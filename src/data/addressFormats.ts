// Dynamic address form configurations by country
// Each FieldConfig drives one row/group of input fields

export type FieldId = 'addressLine1' | 'addressLine2' | 'city' | 'postalCode' | 'state';
export type FieldWidth = 'full' | 'half' | 'third' | 'two-third';
export type FieldType = 'text' | 'select';

export interface FieldConfig {
  id: FieldId;
  labelKey: string; // key in ShippingTranslations extended
  type: FieldType;
  required: boolean;
  width: FieldWidth;
  subdivisionKey?: string; // e.g. 'US', 'CA', 'AU', 'JP', 'KR'
  validationPattern?: RegExp;
  validationMessage?: string; // key in ShippingTranslations for error
}

// ── Format groups ──────────────────────────────────────────────────────────────

// FR group: address → complement(opt) → CP(half) + Ville(half)
const FORMAT_FR: FieldConfig[] = [
  { id: 'addressLine1', labelKey: 'address',         type: 'text',   required: true,  width: 'full' },
  { id: 'addressLine2', labelKey: 'addressOptional', type: 'text',   required: false, width: 'full' },
  { id: 'postalCode',   labelKey: 'postalCode',      type: 'text',   required: true,  width: 'half',
    validationPattern: /^\d{5}$/, validationMessage: 'invalidPostalCode' },
  { id: 'city',         labelKey: 'city',            type: 'text',   required: true,  width: 'half' },
];

// DE group: address → CP(half) + Ville(half)
const FORMAT_DE: FieldConfig[] = [
  { id: 'addressLine1', labelKey: 'address',    type: 'text', required: true,  width: 'full' },
  { id: 'postalCode',   labelKey: 'postalCode', type: 'text', required: true,  width: 'half',
    validationPattern: /^\d{5}$/, validationMessage: 'invalidPostalCode' },
  { id: 'city',         labelKey: 'city',       type: 'text', required: true,  width: 'half' },
];

// NL group: address → CP(third) + Ville(two-third)
const FORMAT_NL: FieldConfig[] = [
  { id: 'addressLine1', labelKey: 'address',    type: 'text', required: true,  width: 'full' },
  { id: 'postalCode',   labelKey: 'postalCode', type: 'text', required: true,  width: 'third',
    validationPattern: /^\d{4}\s?[A-Z]{2}$/i, validationMessage: 'invalidPostalCode' },
  { id: 'city',         labelKey: 'city',       type: 'text', required: true,  width: 'two-third' },
];

// IT/ES/PT group: address → complement(opt) → Ville(half) + CP(half)
const FORMAT_IT_ES_PT: FieldConfig[] = [
  { id: 'addressLine1', labelKey: 'address',         type: 'text', required: true,  width: 'full' },
  { id: 'addressLine2', labelKey: 'addressOptional', type: 'text', required: false, width: 'full' },
  { id: 'city',         labelKey: 'city',            type: 'text', required: true,  width: 'half' },
  { id: 'postalCode',   labelKey: 'postalCode',      type: 'text', required: true,  width: 'half' },
];

// GB/IE group: address → complement(opt) → Ville → comté(opt) → CP
const FORMAT_GB: FieldConfig[] = [
  { id: 'addressLine1', labelKey: 'address',         type: 'text', required: true,  width: 'full' },
  { id: 'addressLine2', labelKey: 'addressOptional', type: 'text', required: false, width: 'full' },
  { id: 'city',         labelKey: 'city',            type: 'text', required: true,  width: 'full' },
  { id: 'state',        labelKey: 'county',          type: 'text', required: false, width: 'full' },
  { id: 'postalCode',   labelKey: 'postalCode',      type: 'text', required: true,  width: 'half' },
];

// US group: address → unité(opt) → Ville(third) + État(select,third) + ZIP(third)
const FORMAT_US: FieldConfig[] = [
  { id: 'addressLine1', labelKey: 'address',         type: 'text',   required: true,  width: 'full' },
  { id: 'addressLine2', labelKey: 'addressOptional', type: 'text',   required: false, width: 'full' },
  { id: 'city',         labelKey: 'city',            type: 'text',   required: true,  width: 'third' },
  { id: 'state',        labelKey: 'state',           type: 'select', required: true,  width: 'third', subdivisionKey: 'US' },
  { id: 'postalCode',   labelKey: 'postalCode',      type: 'text',   required: true,  width: 'third',
    validationPattern: /^\d{5}(-\d{4})?$/, validationMessage: 'invalidPostalCode' },
];

// CA group: address → unité(opt) → Ville(third) + Province(select,third) + CP(third)
const FORMAT_CA: FieldConfig[] = [
  { id: 'addressLine1', labelKey: 'address',         type: 'text',   required: true,  width: 'full' },
  { id: 'addressLine2', labelKey: 'addressOptional', type: 'text',   required: false, width: 'full' },
  { id: 'city',         labelKey: 'city',            type: 'text',   required: true,  width: 'third' },
  { id: 'state',        labelKey: 'province',        type: 'select', required: true,  width: 'third', subdivisionKey: 'CA' },
  { id: 'postalCode',   labelKey: 'postalCode',      type: 'text',   required: true,  width: 'third',
    validationPattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, validationMessage: 'invalidPostalCode' },
];

// AU/NZ group: address → Suburb(half) + État(select,half) → CP
const FORMAT_AU: FieldConfig[] = [
  { id: 'addressLine1', labelKey: 'address',    type: 'text',   required: true,  width: 'full' },
  { id: 'city',         labelKey: 'suburb',     type: 'text',   required: true,  width: 'half' },
  { id: 'state',        labelKey: 'state',      type: 'select', required: true,  width: 'half', subdivisionKey: 'AU' },
  { id: 'postalCode',   labelKey: 'postalCode', type: 'text',   required: true,  width: 'half',
    validationPattern: /^\d{4}$/, validationMessage: 'invalidPostalCode' },
];

// NZ group (same structure, no state selector)
const FORMAT_NZ: FieldConfig[] = [
  { id: 'addressLine1', labelKey: 'address',    type: 'text', required: true,  width: 'full' },
  { id: 'city',         labelKey: 'suburb',     type: 'text', required: true,  width: 'half' },
  { id: 'postalCode',   labelKey: 'postalCode', type: 'text', required: true,  width: 'half',
    validationPattern: /^\d{4}$/, validationMessage: 'invalidPostalCode' },
];

// JP group: CP → Préfecture(select) → Ville → address → bâtiment(opt)
const FORMAT_JP: FieldConfig[] = [
  { id: 'postalCode',   labelKey: 'postalCode',  type: 'text',   required: true,  width: 'half',
    validationPattern: /^\d{3}-?\d{4}$/, validationMessage: 'invalidPostalCode' },
  { id: 'state',        labelKey: 'prefecture',  type: 'select', required: true,  width: 'half', subdivisionKey: 'JP' },
  { id: 'city',         labelKey: 'city',        type: 'text',   required: true,  width: 'full' },
  { id: 'addressLine1', labelKey: 'address',     type: 'text',   required: true,  width: 'full' },
  { id: 'addressLine2', labelKey: 'building',    type: 'text',   required: false, width: 'full' },
];

// KR group: CP → Région(select) → Ville → address → détail(opt)
const FORMAT_KR: FieldConfig[] = [
  { id: 'postalCode',   labelKey: 'postalCode',  type: 'text',   required: true,  width: 'half',
    validationPattern: /^\d{5}$/, validationMessage: 'invalidPostalCode' },
  { id: 'state',        labelKey: 'state',       type: 'select', required: true,  width: 'half', subdivisionKey: 'KR' },
  { id: 'city',         labelKey: 'city',        type: 'text',   required: true,  width: 'full' },
  { id: 'addressLine1', labelKey: 'address',     type: 'text',   required: true,  width: 'full' },
  { id: 'addressLine2', labelKey: 'addressOptional', type: 'text', required: false, width: 'full' },
];

// DEFAULT: address → complement(opt) → Ville(half) + CP(half)
const FORMAT_DEFAULT: FieldConfig[] = [
  { id: 'addressLine1', labelKey: 'address',         type: 'text', required: true,  width: 'full' },
  { id: 'addressLine2', labelKey: 'addressOptional', type: 'text', required: false, width: 'full' },
  { id: 'city',         labelKey: 'city',            type: 'text', required: true,  width: 'half' },
  { id: 'postalCode',   labelKey: 'postalCode',      type: 'text', required: true,  width: 'half' },
];

// ── Country → format map ───────────────────────────────────────────────────────

const COUNTRY_FORMAT_MAP: Record<string, FieldConfig[]> = {
  // FR group
  FR: FORMAT_FR, NC: FORMAT_FR, PF: FORMAT_FR, GP: FORMAT_FR, GF: FORMAT_FR,
  MQ: FORMAT_FR, RE: FORMAT_FR, YT: FORMAT_FR, PM: FORMAT_FR, BL: FORMAT_FR,
  MF: FORMAT_FR, WF: FORMAT_FR, BE: FORMAT_FR, CH: FORMAT_FR, LU: FORMAT_FR,
  MC: FORMAT_FR,

  // DE group
  DE: FORMAT_DE, AT: FORMAT_DE,

  // NL group
  NL: FORMAT_NL,

  // IT/ES/PT group
  IT: FORMAT_IT_ES_PT, ES: FORMAT_IT_ES_PT, PT: FORMAT_IT_ES_PT,

  // GB/IE group
  GB: FORMAT_GB, IE: FORMAT_GB,

  // US group
  US: FORMAT_US,

  // CA group
  CA: FORMAT_CA,

  // AU group
  AU: FORMAT_AU,

  // NZ group
  NZ: FORMAT_NZ,

  // JP group
  JP: FORMAT_JP,

  // KR group
  KR: FORMAT_KR,
};

export function getCountryFormat(countryCode: string): FieldConfig[] {
  return COUNTRY_FORMAT_MAP[countryCode] ?? FORMAT_DEFAULT;
}
