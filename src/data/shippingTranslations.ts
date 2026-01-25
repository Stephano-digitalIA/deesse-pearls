// Shipping Address Modal Translations
// Supports: FR, EN, DE, ES, PT, IT, NL, JA, KO

export type Language = 'fr' | 'en' | 'de' | 'es' | 'pt' | 'it' | 'nl' | 'ja' | 'ko';

interface ShippingTranslations {
  // Modal titles
  shippingAddressTitle: string;
  confirmAndPay: string;
  cancel: string;
  modify: string;

  // Form fields
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  addressOptional: string;
  postalCode: string;
  city: string;
  country: string;
  selectCountry: string;

  // Validation messages
  fieldRequired: string;
  invalidEmail: string;
  invalidPhone: string;
  formHasErrors: string;
  addressSaved: string;
  saveError: string;
  saving: string;
}

export const shippingTranslations: Record<Language, ShippingTranslations> = {
  fr: {
    shippingAddressTitle: 'Adresse de livraison',
    confirmAndPay: 'Confirmer et payer',
    cancel: 'Annuler',
    modify: 'Modifier',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    address: 'Adresse',
    addressOptional: 'Complément d\'adresse (optionnel)',
    postalCode: 'Code postal',
    city: 'Ville',
    country: 'Pays',
    selectCountry: 'Sélectionner un pays',
    fieldRequired: 'Ce champ est requis',
    invalidEmail: 'Email invalide',
    invalidPhone: 'Numéro de téléphone invalide',
    formHasErrors: 'Veuillez corriger les erreurs du formulaire',
    addressSaved: 'Adresse de livraison enregistrée',
    saveError: 'Erreur lors de la sauvegarde',
    saving: 'Enregistrement...',
  },
  en: {
    shippingAddressTitle: 'Shipping Address',
    confirmAndPay: 'Confirm and Pay',
    cancel: 'Cancel',
    modify: 'Edit',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    addressOptional: 'Address Line 2 (optional)',
    postalCode: 'Postal Code',
    city: 'City',
    country: 'Country',
    selectCountry: 'Select a country',
    fieldRequired: 'This field is required',
    invalidEmail: 'Invalid email',
    invalidPhone: 'Invalid phone number',
    formHasErrors: 'Please correct the form errors',
    addressSaved: 'Shipping address saved',
    saveError: 'Error saving address',
    saving: 'Saving...',
  },
  de: {
    shippingAddressTitle: 'Lieferadresse',
    confirmAndPay: 'Bestätigen und bezahlen',
    cancel: 'Abbrechen',
    modify: 'Bearbeiten',
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail',
    phone: 'Telefon',
    address: 'Adresse',
    addressOptional: 'Adresszusatz (optional)',
    postalCode: 'Postleitzahl',
    city: 'Stadt',
    country: 'Land',
    selectCountry: 'Land auswählen',
    fieldRequired: 'Dieses Feld ist erforderlich',
    invalidEmail: 'Ungültige E-Mail',
    invalidPhone: 'Ungültige Telefonnummer',
    formHasErrors: 'Bitte korrigieren Sie die Formulärfehler',
    addressSaved: 'Lieferadresse gespeichert',
    saveError: 'Fehler beim Speichern',
    saving: 'Speichern...',
  },
  es: {
    shippingAddressTitle: 'Dirección de envío',
    confirmAndPay: 'Confirmar y pagar',
    cancel: 'Cancelar',
    modify: 'Modificar',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    address: 'Dirección',
    addressOptional: 'Línea 2 de dirección (opcional)',
    postalCode: 'Código postal',
    city: 'Ciudad',
    country: 'País',
    selectCountry: 'Seleccionar un país',
    fieldRequired: 'Este campo es obligatorio',
    invalidEmail: 'Correo electrónico inválido',
    invalidPhone: 'Número de teléfono inválido',
    formHasErrors: 'Por favor, corrija los errores del formulario',
    addressSaved: 'Dirección de envío guardada',
    saveError: 'Error al guardar',
    saving: 'Guardando...',
  },
  pt: {
    shippingAddressTitle: 'Endereço de entrega',
    confirmAndPay: 'Confirmar e pagar',
    cancel: 'Cancelar',
    modify: 'Editar',
    firstName: 'Nome',
    lastName: 'Sobrenome',
    email: 'E-mail',
    phone: 'Telefone',
    address: 'Endereço',
    addressOptional: 'Complemento (opcional)',
    postalCode: 'Código postal',
    city: 'Cidade',
    country: 'País',
    selectCountry: 'Selecionar um país',
    fieldRequired: 'Este campo é obrigatório',
    invalidEmail: 'E-mail inválido',
    invalidPhone: 'Número de telefone inválido',
    formHasErrors: 'Por favor, corrija os erros do formulário',
    addressSaved: 'Endereço de entrega salvo',
    saveError: 'Erro ao salvar',
    saving: 'Salvando...',
  },
  it: {
    shippingAddressTitle: 'Indirizzo di spedizione',
    confirmAndPay: 'Conferma e paga',
    cancel: 'Annulla',
    modify: 'Modifica',
    firstName: 'Nome',
    lastName: 'Cognome',
    email: 'Email',
    phone: 'Telefono',
    address: 'Indirizzo',
    addressOptional: 'Indirizzo linea 2 (opzionale)',
    postalCode: 'Codice postale',
    city: 'Città',
    country: 'Paese',
    selectCountry: 'Seleziona un paese',
    fieldRequired: 'Questo campo è obbligatorio',
    invalidEmail: 'Email non valida',
    invalidPhone: 'Numero di telefono non valido',
    formHasErrors: 'Si prega di correggere gli errori nel modulo',
    addressSaved: 'Indirizzo di spedizione salvato',
    saveError: 'Errore durante il salvataggio',
    saving: 'Salvataggio...',
  },
  nl: {
    shippingAddressTitle: 'Verzendadres',
    confirmAndPay: 'Bevestigen en betalen',
    cancel: 'Annuleren',
    modify: 'Bewerken',
    firstName: 'Voornaam',
    lastName: 'Achternaam',
    email: 'E-mail',
    phone: 'Telefoon',
    address: 'Adres',
    addressOptional: 'Adresregel 2 (optioneel)',
    postalCode: 'Postcode',
    city: 'Stad',
    country: 'Land',
    selectCountry: 'Selecteer een land',
    fieldRequired: 'Dit veld is verplicht',
    invalidEmail: 'Ongeldig e-mailadres',
    invalidPhone: 'Ongeldig telefoonnummer',
    formHasErrors: 'Corrigeer de fouten in het formulier',
    addressSaved: 'Verzendadres opgeslagen',
    saveError: 'Fout bij opslaan',
    saving: 'Opslaan...',
  },
  ja: {
    shippingAddressTitle: '配送先住所',
    confirmAndPay: '確認して支払う',
    cancel: 'キャンセル',
    modify: '編集',
    firstName: '名',
    lastName: '姓',
    email: 'メールアドレス',
    phone: '電話番号',
    address: '住所',
    addressOptional: '建物名・部屋番号（任意）',
    postalCode: '郵便番号',
    city: '市区町村',
    country: '国',
    selectCountry: '国を選択',
    fieldRequired: 'この項目は必須です',
    invalidEmail: '無効なメールアドレス',
    invalidPhone: '無効な電話番号',
    formHasErrors: 'フォームのエラーを修正してください',
    addressSaved: '配送先住所を保存しました',
    saveError: '保存中にエラーが発生しました',
    saving: '保存中...',
  },
  ko: {
    shippingAddressTitle: '배송 주소',
    confirmAndPay: '확인 및 결제',
    cancel: '취소',
    modify: '수정',
    firstName: '이름',
    lastName: '성',
    email: '이메일',
    phone: '전화번호',
    address: '주소',
    addressOptional: '상세 주소 (선택사항)',
    postalCode: '우편번호',
    city: '도시',
    country: '국가',
    selectCountry: '국가 선택',
    fieldRequired: '필수 항목입니다',
    invalidEmail: '유효하지 않은 이메일',
    invalidPhone: '유효하지 않은 전화번호',
    formHasErrors: '양식 오류를 수정해 주세요',
    addressSaved: '배송 주소가 저장되었습니다',
    saveError: '저장 중 오류가 발생했습니다',
    saving: '저장 중...',
  },
};

// Country names in each language
export const countryTranslations: Record<Language, Record<string, string>> = {
  fr: {
    FR: 'France',
    PF: 'Polynésie française',
    NC: 'Nouvelle-Calédonie',
    WF: 'Wallis-et-Futuna',
    RE: 'La Réunion',
    GP: 'Guadeloupe',
    MQ: 'Martinique',
    BE: 'Belgique',
    CH: 'Suisse',
    LU: 'Luxembourg',
    MC: 'Monaco',
    DE: 'Allemagne',
    IT: 'Italie',
    ES: 'Espagne',
    PT: 'Portugal',
    NL: 'Pays-Bas',
    GB: 'Royaume-Uni',
    US: 'États-Unis',
    CA: 'Canada',
    JP: 'Japon',
    KR: 'Corée du Sud',
    CN: 'Chine',
    AU: 'Australie',
    NZ: 'Nouvelle-Zélande',
    BR: 'Brésil',
    MX: 'Mexique',
    AT: 'Autriche',
    PL: 'Pologne',
    SE: 'Suède',
    NO: 'Norvège',
    DK: 'Danemark',
    FI: 'Finlande',
    IE: 'Irlande',
    GR: 'Grèce',
    CZ: 'République tchèque',
    HU: 'Hongrie',
    RO: 'Roumanie',
    SG: 'Singapour',
    HK: 'Hong Kong',
    AE: 'Émirats arabes unis',
  },
  en: {
    FR: 'France',
    PF: 'French Polynesia',
    NC: 'New Caledonia',
    WF: 'Wallis and Futuna',
    RE: 'Réunion',
    GP: 'Guadeloupe',
    MQ: 'Martinique',
    BE: 'Belgium',
    CH: 'Switzerland',
    LU: 'Luxembourg',
    MC: 'Monaco',
    DE: 'Germany',
    IT: 'Italy',
    ES: 'Spain',
    PT: 'Portugal',
    NL: 'Netherlands',
    GB: 'United Kingdom',
    US: 'United States',
    CA: 'Canada',
    JP: 'Japan',
    KR: 'South Korea',
    CN: 'China',
    AU: 'Australia',
    NZ: 'New Zealand',
    BR: 'Brazil',
    MX: 'Mexico',
    AT: 'Austria',
    PL: 'Poland',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    IE: 'Ireland',
    GR: 'Greece',
    CZ: 'Czech Republic',
    HU: 'Hungary',
    RO: 'Romania',
    SG: 'Singapore',
    HK: 'Hong Kong',
    AE: 'United Arab Emirates',
  },
  de: {
    FR: 'Frankreich',
    PF: 'Französisch-Polynesien',
    NC: 'Neukaledonien',
    WF: 'Wallis und Futuna',
    RE: 'Réunion',
    GP: 'Guadeloupe',
    MQ: 'Martinique',
    BE: 'Belgien',
    CH: 'Schweiz',
    LU: 'Luxemburg',
    MC: 'Monaco',
    DE: 'Deutschland',
    IT: 'Italien',
    ES: 'Spanien',
    PT: 'Portugal',
    NL: 'Niederlande',
    GB: 'Vereinigtes Königreich',
    US: 'Vereinigte Staaten',
    CA: 'Kanada',
    JP: 'Japan',
    KR: 'Südkorea',
    CN: 'China',
    AU: 'Australien',
    NZ: 'Neuseeland',
    BR: 'Brasilien',
    MX: 'Mexiko',
    AT: 'Österreich',
    PL: 'Polen',
    SE: 'Schweden',
    NO: 'Norwegen',
    DK: 'Dänemark',
    FI: 'Finnland',
    IE: 'Irland',
    GR: 'Griechenland',
    CZ: 'Tschechien',
    HU: 'Ungarn',
    RO: 'Rumänien',
    SG: 'Singapur',
    HK: 'Hongkong',
    AE: 'Vereinigte Arabische Emirate',
  },
  es: {
    FR: 'Francia',
    PF: 'Polinesia Francesa',
    NC: 'Nueva Caledonia',
    WF: 'Wallis y Futuna',
    RE: 'Reunión',
    GP: 'Guadalupe',
    MQ: 'Martinica',
    BE: 'Bélgica',
    CH: 'Suiza',
    LU: 'Luxemburgo',
    MC: 'Mónaco',
    DE: 'Alemania',
    IT: 'Italia',
    ES: 'España',
    PT: 'Portugal',
    NL: 'Países Bajos',
    GB: 'Reino Unido',
    US: 'Estados Unidos',
    CA: 'Canadá',
    JP: 'Japón',
    KR: 'Corea del Sur',
    CN: 'China',
    AU: 'Australia',
    NZ: 'Nueva Zelanda',
    BR: 'Brasil',
    MX: 'México',
    AT: 'Austria',
    PL: 'Polonia',
    SE: 'Suecia',
    NO: 'Noruega',
    DK: 'Dinamarca',
    FI: 'Finlandia',
    IE: 'Irlanda',
    GR: 'Grecia',
    CZ: 'República Checa',
    HU: 'Hungría',
    RO: 'Rumanía',
    SG: 'Singapur',
    HK: 'Hong Kong',
    AE: 'Emiratos Árabes Unidos',
  },
  pt: {
    FR: 'França',
    PF: 'Polinésia Francesa',
    NC: 'Nova Caledónia',
    WF: 'Wallis e Futuna',
    RE: 'Reunião',
    GP: 'Guadalupe',
    MQ: 'Martinica',
    BE: 'Bélgica',
    CH: 'Suíça',
    LU: 'Luxemburgo',
    MC: 'Mónaco',
    DE: 'Alemanha',
    IT: 'Itália',
    ES: 'Espanha',
    PT: 'Portugal',
    NL: 'Países Baixos',
    GB: 'Reino Unido',
    US: 'Estados Unidos',
    CA: 'Canadá',
    JP: 'Japão',
    KR: 'Coreia do Sul',
    CN: 'China',
    AU: 'Austrália',
    NZ: 'Nova Zelândia',
    BR: 'Brasil',
    MX: 'México',
    AT: 'Áustria',
    PL: 'Polónia',
    SE: 'Suécia',
    NO: 'Noruega',
    DK: 'Dinamarca',
    FI: 'Finlândia',
    IE: 'Irlanda',
    GR: 'Grécia',
    CZ: 'República Checa',
    HU: 'Hungria',
    RO: 'Roménia',
    SG: 'Singapura',
    HK: 'Hong Kong',
    AE: 'Emirados Árabes Unidos',
  },
  it: {
    FR: 'Francia',
    PF: 'Polinesia Francese',
    NC: 'Nuova Caledonia',
    WF: 'Wallis e Futuna',
    RE: 'Riunione',
    GP: 'Guadalupa',
    MQ: 'Martinica',
    BE: 'Belgio',
    CH: 'Svizzera',
    LU: 'Lussemburgo',
    MC: 'Monaco',
    DE: 'Germania',
    IT: 'Italia',
    ES: 'Spagna',
    PT: 'Portogallo',
    NL: 'Paesi Bassi',
    GB: 'Regno Unito',
    US: 'Stati Uniti',
    CA: 'Canada',
    JP: 'Giappone',
    KR: 'Corea del Sud',
    CN: 'Cina',
    AU: 'Australia',
    NZ: 'Nuova Zelanda',
    BR: 'Brasile',
    MX: 'Messico',
    AT: 'Austria',
    PL: 'Polonia',
    SE: 'Svezia',
    NO: 'Norvegia',
    DK: 'Danimarca',
    FI: 'Finlandia',
    IE: 'Irlanda',
    GR: 'Grecia',
    CZ: 'Repubblica Ceca',
    HU: 'Ungheria',
    RO: 'Romania',
    SG: 'Singapore',
    HK: 'Hong Kong',
    AE: 'Emirati Arabi Uniti',
  },
  nl: {
    FR: 'Frankrijk',
    PF: 'Frans-Polynesië',
    NC: 'Nieuw-Caledonië',
    WF: 'Wallis en Futuna',
    RE: 'Réunion',
    GP: 'Guadeloupe',
    MQ: 'Martinique',
    BE: 'België',
    CH: 'Zwitserland',
    LU: 'Luxemburg',
    MC: 'Monaco',
    DE: 'Duitsland',
    IT: 'Italië',
    ES: 'Spanje',
    PT: 'Portugal',
    NL: 'Nederland',
    GB: 'Verenigd Koninkrijk',
    US: 'Verenigde Staten',
    CA: 'Canada',
    JP: 'Japan',
    KR: 'Zuid-Korea',
    CN: 'China',
    AU: 'Australië',
    NZ: 'Nieuw-Zeeland',
    BR: 'Brazilië',
    MX: 'Mexico',
    AT: 'Oostenrijk',
    PL: 'Polen',
    SE: 'Zweden',
    NO: 'Noorwegen',
    DK: 'Denemarken',
    FI: 'Finland',
    IE: 'Ierland',
    GR: 'Griekenland',
    CZ: 'Tsjechië',
    HU: 'Hongarije',
    RO: 'Roemenië',
    SG: 'Singapore',
    HK: 'Hongkong',
    AE: 'Verenigde Arabische Emiraten',
  },
  ja: {
    FR: 'フランス',
    PF: 'フランス領ポリネシア',
    NC: 'ニューカレドニア',
    WF: 'ウォリス・フツナ',
    RE: 'レユニオン',
    GP: 'グアドループ',
    MQ: 'マルティニーク',
    BE: 'ベルギー',
    CH: 'スイス',
    LU: 'ルクセンブルク',
    MC: 'モナコ',
    DE: 'ドイツ',
    IT: 'イタリア',
    ES: 'スペイン',
    PT: 'ポルトガル',
    NL: 'オランダ',
    GB: 'イギリス',
    US: 'アメリカ合衆国',
    CA: 'カナダ',
    JP: '日本',
    KR: '韓国',
    CN: '中国',
    AU: 'オーストラリア',
    NZ: 'ニュージーランド',
    BR: 'ブラジル',
    MX: 'メキシコ',
    AT: 'オーストリア',
    PL: 'ポーランド',
    SE: 'スウェーデン',
    NO: 'ノルウェー',
    DK: 'デンマーク',
    FI: 'フィンランド',
    IE: 'アイルランド',
    GR: 'ギリシャ',
    CZ: 'チェコ',
    HU: 'ハンガリー',
    RO: 'ルーマニア',
    SG: 'シンガポール',
    HK: '香港',
    AE: 'アラブ首長国連邦',
  },
  ko: {
    FR: '프랑스',
    PF: '프랑스령 폴리네시아',
    NC: '뉴칼레도니아',
    WF: '왈리스 푸투나',
    RE: '레위니옹',
    GP: '과들루프',
    MQ: '마르티니크',
    BE: '벨기에',
    CH: '스위스',
    LU: '룩셈부르크',
    MC: '모나코',
    DE: '독일',
    IT: '이탈리아',
    ES: '스페인',
    PT: '포르투갈',
    NL: '네덜란드',
    GB: '영국',
    US: '미국',
    CA: '캐나다',
    JP: '일본',
    KR: '한국',
    CN: '중국',
    AU: '호주',
    NZ: '뉴질랜드',
    BR: '브라질',
    MX: '멕시코',
    AT: '오스트리아',
    PL: '폴란드',
    SE: '스웨덴',
    NO: '노르웨이',
    DK: '덴마크',
    FI: '핀란드',
    IE: '아일랜드',
    GR: '그리스',
    CZ: '체코',
    HU: '헝가리',
    RO: '루마니아',
    SG: '싱가포르',
    HK: '홍콩',
    AE: '아랍에미리트',
  },
};

// List of country codes for the dropdown
export const COUNTRY_CODES = [
  'FR', 'PF', 'NC', 'WF', 'RE', 'GP', 'MQ', 'BE', 'CH', 'LU', 'MC',
  'DE', 'IT', 'ES', 'PT', 'NL', 'GB', 'US', 'CA', 'JP', 'KR', 'CN',
  'AU', 'NZ', 'BR', 'MX', 'AT', 'PL', 'SE', 'NO', 'DK', 'FI', 'IE',
  'GR', 'CZ', 'HU', 'RO', 'SG', 'HK', 'AE',
];

// Priority countries to show at the top of the list
export const PRIORITY_COUNTRY_CODES = [
  'PF', // Polynésie française
  'FR', // France
  'NC', // Nouvelle-Calédonie
  'WF', // Wallis-et-Futuna
  'BE', // Belgique
  'CH', // Suisse
  'CA', // Canada
  'LU', // Luxembourg
  'MC', // Monaco
];

// Helper function to get translated country name
export function getCountryName(code: string, language: Language): string {
  return countryTranslations[language]?.[code] || countryTranslations.en[code] || code;
}

// Helper function to get all countries for a language, sorted alphabetically
export function getCountriesForLanguage(language: Language): { code: string; name: string }[] {
  return COUNTRY_CODES
    .map(code => ({
      code,
      name: getCountryName(code, language),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, language));
}

// Helper function to get countries with priority countries at the top
export function getCountriesWithPriority(language: Language): { code: string; name: string; isPriority: boolean }[] {
  const allCountries = COUNTRY_CODES.map(code => ({
    code,
    name: getCountryName(code, language),
    isPriority: PRIORITY_COUNTRY_CODES.includes(code),
  }));

  // Split into priority and non-priority
  const priorityCountries = PRIORITY_COUNTRY_CODES
    .filter(code => COUNTRY_CODES.includes(code))
    .map(code => ({
      code,
      name: getCountryName(code, language),
      isPriority: true,
    }));

  const otherCountries = allCountries
    .filter(c => !c.isPriority)
    .sort((a, b) => a.name.localeCompare(b.name, language));

  return [...priorityCountries, ...otherCountries];
}

// Helper function to find country code from a name (any language)
// This is used for backward compatibility when country name is stored instead of code
export function getCountryCodeFromName(name: string): string | null {
  if (!name) return null;

  // If it's already a valid code, return it
  if (COUNTRY_CODES.includes(name as any)) {
    return name;
  }

  // Search in all languages for a matching name
  const normalizedName = name.toLowerCase().trim();

  for (const lang of Object.keys(countryTranslations) as Language[]) {
    for (const [code, countryName] of Object.entries(countryTranslations[lang])) {
      if (countryName.toLowerCase() === normalizedName) {
        return code;
      }
    }
  }

  return null;
}

// Helper function to normalize a country value (code or name) to a code
export function normalizeCountryToCode(value: string): string {
  if (!value) return 'FR'; // Default to France

  // If it's already a valid code
  if (COUNTRY_CODES.includes(value as any)) {
    return value;
  }

  // Try to find the code from the name
  const code = getCountryCodeFromName(value);
  return code || 'FR'; // Default to France if not found
}
