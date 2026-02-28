# Skill: Add Country Address Format

Use this skill to add a new country to the dynamic address form at `c:\Users\Dell\adresse_clients`.

## Files to modify

| File | Action |
|------|--------|
| `src/data/countries.ts` | Add `{ code, name, flag }` entry to `COUNTRIES` array |
| `src/data/addressFormats.ts` | Add country format under `ADDRESS_FORMATS` |
| `src/data/subdivisions.ts` | Add subdivision list if the country has a state/province dropdown |

## Step 1 — Add to countries.ts

```typescript
{ code: 'XX', name: 'Country Name', flag: '🇽🇽' },
```
Keep the list sorted alphabetically by region then name.

## Step 2 — Add format in addressFormats.ts

```typescript
XX: { fields: [
  F_FULL_NAME,
  F_PHONE,
  { ...F_STREET, label: 'Local street label' },
  { id: 'postalCode', label: 'Postal code label', type: 'text', required: true, width: 'half',
    validationPattern: '\\d{5}',        // adjust regex
    validationMessage: 'Invalid format (e.g. 12345)',
    autoComplete: 'postal-code' },
  { id: 'city', label: 'City label', type: 'text', required: true, width: 'half', autoComplete: 'address-level2' },
  // Add subdivision select if needed:
  { id: 'state', label: 'State/Province', type: 'select', required: true, width: 'full',
    subdivisionKey: 'XX', autoComplete: 'address-level1' },
]},
```

### FieldWidth reference
| Value | Grid columns |
|-------|-------------|
| `full` | 12/12 — full row |
| `half` | 6/12 — two per row |
| `third` | 4/12 — three per row (e.g. City + State + ZIP) |
| `two-third` | 8/12 — paired with `third` |

### Common patterns by country type
- **European** (no subdivision): Street / CP + City → use `half` + `half`
- **Anglo-Saxon** (with state): Street / Unit / City(third) + State(third) + ZIP(third)
- **Asian** (postal code first): Postal code → Prefecture/Province select → City → Street details
- **Latin American**: Street + Number / Complement / Neighbourhood / City + State

## Step 3 — Add subdivisions (if needed)

```typescript
XX: [
  { value: 'CODE', label: 'Name' },
  // ...
],
```
The `subdivisionKey` in `FieldConfig` must match the key in `SUBDIVISIONS`.

## Step 4 — Postal code regex

Common formats:
| Country type | Pattern | Example |
|---|---|---|
| 5 digits | `\\d{5}` | 75001, 28001 |
| 4 digits | `\\d{4}` | 1000, 1010 |
| XX-XXX | `\\d{2}-\\d{3}` | 00-001 |
| XXXX-XXX | `\\d{4}-\\d{3}` | 1000-001 |
| Alphanumeric | `[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d` | K1A 0A9 |

## Verification checklist
- [ ] Country appears in dropdown (search by name and code)
- [ ] Selecting country shows correct fields
- [ ] Subdivision dropdown loads correct options
- [ ] Postal code validation triggers on submit
- [ ] All required fields block form submission when empty
- [ ] `npm run build` passes with no TypeScript errors
