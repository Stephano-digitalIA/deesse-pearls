import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getCountryFormat, FieldConfig, FieldId } from '@/data/addressFormats';
import { SUBDIVISIONS } from '@/data/subdivisions';
import { shippingTranslations, Language } from '@/data/shippingTranslations';

// ── Country → label language map ───────────────────────────────────────────────

const COUNTRY_LANGUAGE_MAP: Record<string, Language> = {
  // Français — territoires français & Europe francophone
  FR: 'fr', NC: 'fr', PF: 'fr', GP: 'fr', GF: 'fr', MQ: 'fr', RE: 'fr',
  YT: 'fr', PM: 'fr', BL: 'fr', MF: 'fr', WF: 'fr', BE: 'fr', CH: 'fr',
  LU: 'fr', MC: 'fr',
  // Afrique subsaharienne francophone
  SN: 'fr', CI: 'fr', ML: 'fr', BF: 'fr', BJ: 'fr', NE: 'fr', TG: 'fr',
  GN: 'fr', GW: 'fr', CD: 'fr', CG: 'fr', CM: 'fr', GA: 'fr', CF: 'fr',
  TD: 'fr',
  // Afrique du Nord francophone
  MA: 'fr', DZ: 'fr', TN: 'fr', MR: 'fr',
  // Espagnol
  ES: 'es',
  // Amérique centrale & Caraïbes hispanophones
  MX: 'es', GT: 'es', HN: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es',
  CU: 'es', DO: 'es', PR: 'es',
  // Amérique du Sud hispanophone
  AR: 'es', BO: 'es', CL: 'es', CO: 'es', EC: 'es', PY: 'es', PE: 'es',
  UY: 'es', VE: 'es',
  // Portugais
  PT: 'pt', BR: 'pt',
  // Italien
  IT: 'it',
  // Allemand
  DE: 'de', AT: 'de',
  // Néerlandais
  NL: 'nl',
  // Anglais natif
  GB: 'en', US: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', ZA: 'en',
  // Japonais
  JP: 'ja',
  // Coréen
  KR: 'ko',
};

function getAddressLanguage(countryCode: string): Language {
  return COUNTRY_LANGUAGE_MAP[countryCode] ?? 'en';
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AddressValues {
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  state: string;
}

interface AddressFieldsProps {
  values: AddressValues;
  onChange: (field: FieldId, value: string) => void;
  errors?: Partial<Record<FieldId, string>>;
}

// ── Width helpers ─────────────────────────────────────────────────────────────

// We use a simple row-based layout: fields are grouped into rows.
// Widths: full=100%, half=50%, third=33%, two-third=67%.
// Adjacent non-full fields are rendered in a flex row.

function getFlexBasis(width: FieldConfig['width']): string {
  switch (width) {
    case 'full':      return 'w-full';
    case 'half':      return 'flex-1 min-w-0';
    case 'third':     return 'flex-1 min-w-0';
    case 'two-third': return 'flex-[2] min-w-0';
  }
}

// Group consecutive non-full fields into rows
function groupFields(fields: FieldConfig[]): FieldConfig[][] {
  const rows: FieldConfig[][] = [];
  let currentRow: FieldConfig[] = [];

  for (const field of fields) {
    if (field.width === 'full') {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
      }
      rows.push([field]);
    } else {
      currentRow.push(field);
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return rows;
}

// ── Component ─────────────────────────────────────────────────────────────────

const AddressFields: React.FC<AddressFieldsProps> = ({ values, onChange, errors = {} }) => {
  const lang = getAddressLanguage(values.country);
  const ts = shippingTranslations[lang] as any;
  const format = getCountryFormat(values.country);
  const rows = groupFields(format);

  const renderField = (field: FieldConfig) => {
    const label = ts[field.labelKey] ?? field.labelKey;
    const value = values[field.id] ?? '';
    const error = errors[field.id];
    const isRequired = field.required;

    if (field.type === 'select' && field.subdivisionKey) {
      const options = SUBDIVISIONS[field.subdivisionKey] ?? [];
      return (
        <div key={field.id} className={cn('space-y-1', getFlexBasis(field.width))}>
          <Label htmlFor={field.id}>
            {label}{isRequired ? ' *' : ''}
          </Label>
          <Select value={value} onValueChange={(v) => onChange(field.id, v)}>
            <SelectTrigger
              id={field.id}
              className={cn(error && 'border-destructive')}
            >
              <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    }

    return (
      <div key={field.id} className={cn('space-y-1', getFlexBasis(field.width))}>
        <Label htmlFor={field.id}>
          {label}{isRequired ? ' *' : ''}
        </Label>
        <Input
          id={field.id}
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={cn(error && 'border-destructive')}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {rows.map((row, rowIndex) => (
        row.length === 1 && row[0].width === 'full'
          ? renderField(row[0])
          : (
            <div key={rowIndex} className="flex gap-3">
              {row.map(renderField)}
            </div>
          )
      ))}
    </div>
  );
};

export default AddressFields;

// ── Validation helper ─────────────────────────────────────────────────────────

export function validateAddressFields(
  values: AddressValues,
  lang: Language,
): Partial<Record<FieldId, string>> {
  const ts = shippingTranslations[lang] as any;
  const format = getCountryFormat(values.country);
  const errors: Partial<Record<FieldId, string>> = {};

  for (const field of format) {
    const value = (values[field.id] ?? '').trim();
    if (field.required && !value) {
      errors[field.id] = ts.fieldRequired;
    } else if (value && field.validationPattern && !field.validationPattern.test(value)) {
      errors[field.id] = ts[field.validationMessage ?? ''] ?? ts.fieldRequired;
    }
  }

  return errors;
}
