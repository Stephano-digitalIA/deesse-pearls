import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Static translations from productTranslations.ts - embedded here for Edge Function access
const staticTranslations: Record<string, { name: Record<string, string>; description: Record<string, string> }> = {
  'perle-tahiti-ronde-aaa-12mm': {
    name: {
      fr: 'Perle de Tahiti Ronde AAA 12mm',
      en: 'Round Tahitian Pearl AAA 12mm',
      de: 'Runde Tahiti-Perle AAA 12mm',
      es: 'Perla de Tahití Redonda AAA 12mm',
      pt: 'Pérola do Taiti Redonda AAA 12mm',
      it: 'Perla di Tahiti Rotonda AAA 12mm',
      nl: 'Ronde Tahiti-parel AAA 12mm',
      ja: 'タヒチ産ラウンドパールAAA 12mm',
      ko: '타히티 라운드 진주 AAA 12mm',
    },
    description: {
      fr: 'Magnifique perle de Tahiti parfaitement ronde de 12mm, qualité AAA. Lustre exceptionnel avec des reflets vert paon et roses caractéristiques. Surface impeccable, nacre épaisse.',
      en: 'Magnificent perfectly round 12mm Tahitian pearl, AAA quality. Exceptional luster with characteristic peacock green and pink reflections. Flawless surface, thick nacre.',
      de: 'Wunderschöne perfekt runde 12mm Tahiti-Perle, AAA-Qualität. Außergewöhnlicher Glanz mit charakteristischen pfauengrünen und rosa Reflexen. Makellose Oberfläche, dicke Perlmuttschicht.',
      es: 'Magnífica perla de Tahití perfectamente redonda de 12mm, calidad AAA. Brillo excepcional con reflejos verde pavo real y rosados característicos. Superficie impecable, nácar grueso.',
      pt: 'Magnífica pérola do Taiti perfeitamente redonda de 12mm, qualidade AAA. Brilho excepcional com reflexos verde pavão e rosados característicos. Superfície impecável, nácar espesso.',
      it: 'Magnifica perla di Tahiti perfettamente rotonda da 12mm, qualità AAA. Lucentezza eccezionale con riflessi verde pavone e rosa caratteristici. Superficie impeccabile, madreperla spessa.',
      nl: 'Prachtige perfect ronde 12mm Tahiti-parel, AAA-kwaliteit. Uitzonderlijke glans met karakteristieke pauwgroene en roze reflecties. Vlekkeloze oppervlak, dikke parelmoer.',
      ja: '完璧なラウンド形の12mmタヒチ産パール、AAA品質。特徴的なピーコックグリーンとピンクの反射を持つ卓越した光沢。完璧な表面、厚い真珠層。',
      ko: '완벽하게 둥근 12mm 타히티 진주, AAA 품질. 특징적인 공작 녹색과 분홍색 반사가 있는 뛰어난 광택. 완벽한 표면, 두꺼운 진주층.',
    },
  },
  'perle-tahiti-baroque-unique': {
    name: {
      fr: 'Perle de Tahiti Baroque Unique',
      en: 'Unique Baroque Tahitian Pearl',
      de: 'Einzigartige Barocke Tahiti-Perle',
      es: 'Perla de Tahití Barroca Única',
      pt: 'Pérola do Taiti Barroca Única',
      it: 'Perla di Tahiti Barocca Unica',
      nl: 'Unieke Barokke Tahiti-parel',
      ja: 'ユニークなバロックタヒチパール',
      ko: '유니크 바로크 타히티 진주',
    },
    description: {
      fr: 'Perle de Tahiti baroque aux formes organiques uniques et reflets multicolores iridescents. Chaque pièce est une œuvre de la nature, impossible à reproduire.',
      en: 'Baroque Tahitian pearl with unique organic shapes and iridescent multicolor reflections. Each piece is a work of nature, impossible to replicate.',
      de: 'Barocke Tahiti-Perle mit einzigartigen organischen Formen und schillernden mehrfarbigen Reflexen. Jedes Stück ist ein Werk der Natur, unmöglich zu replizieren.',
      es: 'Perla de Tahití barroca con formas orgánicas únicas y reflejos multicolores iridiscentes. Cada pieza es una obra de la naturaleza, imposible de replicar.',
      pt: 'Pérola do Taiti barroca com formas orgânicas únicas e reflexos multicoloridos iridescentes. Cada peça é uma obra da natureza, impossível de replicar.',
      it: 'Perla di Tahiti barocca con forme organiche uniche e riflessi multicolori iridescenti. Ogni pezzo è unopera della natura, impossibile da replicare.',
      nl: 'Barokke Tahiti-parel met unieke organische vormen en iriserende meerkleurige reflecties. Elk stuk is een werk van de natuur, onmogelijk te repliceren.',
      ja: 'ユニークなオーガニック形状と虹色の多彩な反射を持つバロックタヒチパール。各ピースは自然の芸術作品で、再現不可能です。',
      ko: '독특한 유기적 형태와 무지개빛 다채로운 반사를 가진 바로크 타히티 진주. 각 제품은 자연의 작품으로 복제가 불가능합니다.',
    },
  },
  'perle-tahiti-goutte-premium': {
    name: {
      fr: 'Perle de Tahiti Goutte Premium',
      en: 'Premium Drop Tahitian Pearl',
      de: 'Premium Tropfen Tahiti-Perle',
      es: 'Perla de Tahití Gota Premium',
      pt: 'Pérola do Taiti Gota Premium',
      it: 'Perla di Tahiti Goccia Premium',
      nl: 'Premium Druppel Tahiti-parel',
      ja: 'プレミアムドロップタヒチパール',
      ko: '프리미엄 드롭 타히티 진주',
    },
    description: {
      fr: 'Perle de Tahiti en forme de goutte parfaite, qualité premium. Surface lisse avec reflets argent-vert intenses. Idéale pour pendentif ou boucles doreilles.',
      en: 'Perfect drop-shaped Tahitian pearl, premium quality. Smooth surface with intense silver-green reflections. Ideal for pendant or earrings.',
      de: 'Perfekt tropfenförmige Tahiti-Perle, Premium-Qualität. Glatte Oberfläche mit intensiven silber-grünen Reflexen. Ideal für Anhänger oder Ohrringe.',
      es: 'Perla de Tahití en forma de gota perfecta, calidad premium. Superficie lisa con reflejos plata-verde intensos. Ideal para colgante o pendientes.',
      pt: 'Pérola do Taiti em forma de gota perfeita, qualidade premium. Superfície lisa com reflexos prata-verde intensos. Ideal para pingente ou brincos.',
      it: 'Perla di Tahiti a goccia perfetta, qualità premium. Superficie liscia con riflessi argento-verde intensi. Ideale per ciondolo o orecchini.',
      nl: 'Perfect druppelvormige Tahiti-parel, premium kwaliteit. Glad oppervlak met intense zilver-groene reflecties. Ideaal voor hanger of oorbellen.',
      ja: '完璧なドロップ形のタヒチパール、プレミアム品質。シルバーグリーンの強烈な反射を持つ滑らかな表面。ペンダントやイヤリングに最適。',
      ko: '완벽한 드롭 형태의 타히티 진주, 프리미엄 품질. 강렬한 실버-그린 반사가 있는 매끄러운 표면. 펜던트나 귀걸이에 이상적.',
    },
  },
  'perle-tahiti-bouton-aubergine': {
    name: {
      fr: 'Perle de Tahiti Bouton Aubergine',
      en: 'Aubergine Button Tahitian Pearl',
      de: 'Aubergine Knopf Tahiti-Perle',
      es: 'Perla de Tahití Botón Berenjena',
      pt: 'Pérola do Taiti Botão Berinjela',
      it: 'Perla di Tahiti Bottone Melanzana',
      nl: 'Aubergine Knoop Tahiti-parel',
      ja: 'オーベルジーヌボタンタヒチパール',
      ko: '오베르진 버튼 타히티 진주',
    },
    description: {
      fr: 'Perle de Tahiti en forme de bouton, couleur gris foncé avec nuances aubergine. Surface plane idéale pour montage en bague ou boucles doreilles.',
      en: 'Button-shaped Tahitian pearl, dark grey color with aubergine nuances. Flat surface ideal for ring or earring mounting.',
      de: 'Knopfförmige Tahiti-Perle, dunkelgraue Farbe mit Aubergine-Nuancen. Flache Oberfläche ideal für Ring- oder Ohrringe.',
      es: 'Perla de Tahití en forma de botón, color gris oscuro con matices berenjena. Superficie plana ideal para montaje en anillo o pendientes.',
      pt: 'Pérola do Taiti em forma de botão, cor cinza escuro com nuances berinjela. Superfície plana ideal para montagem em anel ou brincos.',
      it: 'Perla di Tahiti a forma di bottone, colore grigio scuro con sfumature melanzana. Superficie piatta ideale per montaggio su anello o orecchini.',
      nl: 'Knoopvormige Tahiti-parel, donkergrijze kleur met aubergine nuances. Plat oppervlak ideaal voor ring- of oorbelbevestiging.',
      ja: 'ボタン形のタヒチパール、オーベルジーヌのニュアンスを持つダークグレー。リングやイヤリングに最適な平らな表面。',
      ko: '버튼 모양의 타히티 진주, 오베르진 뉘앙스가 있는 짙은 회색. 반지나 귀걸이 장착에 이상적인 평평한 표면.',
    },
  },
  'perle-tahiti-exceptionnelle-16mm': {
    name: {
      fr: 'Perle de Tahiti Exceptionnelle 16mm',
      en: 'Exceptional 16mm Tahitian Pearl',
      de: 'Außergewöhnliche 16mm Tahiti-Perle',
      es: 'Perla de Tahití Excepcional 16mm',
      pt: 'Pérola do Taiti Excepcional 16mm',
      it: 'Perla di Tahiti Eccezionale 16mm',
      nl: 'Uitzonderlijke 16mm Tahiti-parel',
      ja: 'エクセプショナル16mmタヒチパール',
      ko: '익셉셔널 16mm 타히티 진주',
    },
    description: {
      fr: 'Perle de Tahiti dexception de 16mm, qualité AAA+. Lustre miroir avec reflets vert paon profond. Pièce rare pour connaisseurs.',
      en: 'Exceptional 16mm Tahitian pearl, AAA+ quality. Mirror luster with deep peacock green reflections. Rare piece for connoisseurs.',
      de: 'Außergewöhnliche 16mm Tahiti-Perle, AAA+ Qualität. Spiegelglanz mit tiefen pfauengrünen Reflexen. Seltenes Stück für Kenner.',
      es: 'Perla de Tahití excepcional de 16mm, calidad AAA+. Brillo espejo con reflejos verde pavo real profundo. Pieza rara para conocedores.',
      pt: 'Pérola do Taiti excepcional de 16mm, qualidade AAA+. Brilho espelho com reflexos verde pavão profundo. Peça rara para conhecedores.',
      it: 'Perla di Tahiti eccezionale da 16mm, qualità AAA+. Lucentezza a specchio con riflessi verde pavone profondo. Pezzo raro per intenditori.',
      nl: 'Uitzonderlijke 16mm Tahiti-parel, AAA+ kwaliteit. Spiegelglans met diepe pauwgroene reflecties. Zeldzaam stuk voor kenners.',
      ja: '16mmのエクセプショナルタヒチパール、AAA+品質。深いピーコックグリーンの反射を持つミラー光沢。コニサー向けのレアピース。',
      ko: '16mm 익셉셔널 타히티 진주, AAA+ 품질. 깊은 공작 녹색 반사가 있는 거울 광택. 감정가를 위한 희귀 제품.',
    },
  },
  'perle-tahiti-keshi-irisee': {
    name: {
      fr: 'Perle de Tahiti Keshi Irisée',
      en: 'Iridescent Keshi Tahitian Pearl',
      de: 'Schillernde Keshi Tahiti-Perle',
      es: 'Perla de Tahití Keshi Irisada',
      pt: 'Pérola do Taiti Keshi Iridescente',
      it: 'Perla di Tahiti Keshi Iridescente',
      nl: 'Iriserende Keshi Tahiti-parel',
      ja: 'イリデセントケシタヒチパール',
      ko: '이리데센트 케시 타히티 진주',
    },
    description: {
      fr: 'Perle keshi de Tahiti aux formes libres et hautement iridescente. Reflets arc-en-ciel uniques, 100% nacre pure sans nucleus.',
      en: 'Free-form keshi Tahitian pearl, highly iridescent. Unique rainbow reflections, 100% pure nacre without nucleus.',
      de: 'Freiförmige Keshi Tahiti-Perle, hochgradig schillernd. Einzigartige Regenbogenreflexe, 100% reines Perlmutt ohne Kern.',
      es: 'Perla keshi de Tahití de forma libre, altamente iridiscente. Reflejos arcoíris únicos, 100% nácar puro sin núcleo.',
      pt: 'Pérola keshi do Taiti de forma livre, altamente iridescente. Reflexos arco-íris únicos, 100% nácar puro sem núcleo.',
      it: 'Perla keshi di Tahiti a forma libera, altamente iridescente. Riflessi arcobaleno unici, 100% madreperla pura senza nucleo.',
      nl: 'Vrijvormige keshi Tahiti-parel, zeer iriserend. Unieke regenboogreflecties, 100% pure parelmoer zonder kern.',
      ja: '自由形状のケシタヒチパール、高度にイリデセント。ユニークな虹の反射、核なしの100%純粋な真珠層。',
      ko: '자유 형태의 케시 타히티 진주, 고도로 이리데센트. 독특한 무지개 반사, 핵 없는 100% 순수 진주층.',
    },
  },
  'perle-tahiti-cerclee': {
    name: {
      fr: 'Perle de Tahiti Cerclée',
      en: 'Circled Tahitian Pearl',
      de: 'Geringelte Tahiti-Perle',
      es: 'Perla de Tahití Anillada',
      pt: 'Pérola do Taiti Circulada',
      it: 'Perla di Tahiti Cerchiata',
      nl: 'Geringde Tahiti-parel',
      ja: 'サークルドタヒチパール',
      ko: '서클드 타히티 진주',
    },
    description: {
      fr: 'Perle de Tahiti avec cercles naturels caractéristiques. Motifs organiques uniques formés naturellement. Prix accessible pour perle authentique.',
      en: 'Tahitian pearl with characteristic natural circles. Unique organic patterns formed naturally. Accessible price for authentic pearl.',
      de: 'Tahiti-Perle mit charakteristischen natürlichen Ringen. Einzigartige organische Muster natürlich gebildet. Erschwinglicher Preis für authentische Perle.',
      es: 'Perla de Tahití con círculos naturales característicos. Patrones orgánicos únicos formados naturalmente. Precio accesible para perla auténtica.',
      pt: 'Pérola do Taiti com círculos naturais característicos. Padrões orgânicos únicos formados naturalmente. Preço acessível para pérola autêntica.',
      it: 'Perla di Tahiti con cerchi naturali caratteristici. Motivi organici unici formati naturalmente. Prezzo accessibile per perla autentica.',
      nl: 'Tahiti-parel met karakteristieke natuurlijke ringen. Unieke organische patronen natuurlijk gevormd. Toegankelijke prijs voor authentieke parel.',
      ja: '特徴的な自然な円を持つタヒチパール。自然に形成されたユニークなオーガニックパターン。本物のパールとしてお手頃な価格。',
      ko: '특징적인 자연 원이 있는 타히티 진주. 자연스럽게 형성된 독특한 유기적 패턴. 진품 진주로서 접근 가능한 가격.',
    },
  },
  'perle-tahiti-gold-rare': {
    name: {
      fr: 'Perle de Tahiti Gold Rare',
      en: 'Rare Gold Tahitian Pearl',
      de: 'Seltene Goldene Tahiti-Perle',
      es: 'Perla de Tahití Dorada Rara',
      pt: 'Pérola do Taiti Dourada Rara',
      it: 'Perla di Tahiti Oro Rara',
      nl: 'Zeldzame Gouden Tahiti-parel',
      ja: 'レアゴールドタヒチパール',
      ko: '레어 골드 타히티 진주',
    },
    description: {
      fr: 'Perle de Tahiti extrêmement rare de couleur champagne dorée avec nuances rosées. Une des couleurs les plus rares et recherchées.',
      en: 'Extremely rare champagne gold Tahitian pearl with pink nuances. One of the rarest and most sought-after colors.',
      de: 'Extrem seltene champagnergoldene Tahiti-Perle mit rosa Nuancen. Eine der seltensten und gesuchtesten Farben.',
      es: 'Perla de Tahití extremadamente rara de color champán dorado con matices rosados. Uno de los colores más raros y buscados.',
      pt: 'Pérola do Taiti extremamente rara de cor champanhe dourada com nuances rosadas. Uma das cores mais raras e procuradas.',
      it: 'Perla di Tahiti estremamente rara color champagne dorato con sfumature rosa. Uno dei colori più rari e ricercati.',
      nl: 'Extreem zeldzame champagnegouden Tahiti-parel met roze nuances. Een van de zeldzaamste en meest gezochte kleuren.',
      ja: 'ピンクのニュアンスを持つ極めて珍しいシャンパンゴールドのタヒチパール。最も希少で人気のある色の1つ。',
      ko: '분홍 뉘앙스가 있는 극히 희귀한 샴페인 골드 타히티 진주. 가장 희귀하고 인기 있는 색상 중 하나.',
    },
  },
  'collier-perles-tahiti-classique': {
    name: {
      fr: 'Collier Perles de Tahiti Classique',
      en: 'Classic Tahitian Pearl Necklace',
      de: 'Klassische Tahiti-Perlenkette',
      es: 'Collar de Perlas de Tahití Clásico',
      pt: 'Colar de Pérolas do Taiti Clássico',
      it: 'Collana di Perle di Tahiti Classica',
      nl: 'Klassieke Tahiti-parelketting',
      ja: 'クラシックタヒチパールネックレス',
      ko: '클래식 타히티 진주 목걸이',
    },
    description: {
      fr: 'Collier classique de perles de Tahiti rondes de 9-11mm, fermoir or 18 carats. 43cm de longueur princess pour une élégance intemporelle.',
      en: 'Classic necklace of round Tahitian pearls 9-11mm, 18k gold clasp. 43cm princess length for timeless elegance.',
      de: 'Klassische Halskette aus runden Tahiti-Perlen 9-11mm, 18K Goldverschluss. 43cm Princess-Länge für zeitlose Eleganz.',
      es: 'Collar clásico de perlas de Tahití redondas de 9-11mm, cierre de oro de 18 quilates. 43cm de largo princesa para elegancia atemporal.',
      pt: 'Colar clássico de pérolas do Taiti redondas de 9-11mm, fecho de ouro 18 quilates. 43cm de comprimento princesa para elegância atemporal.',
      it: 'Collana classica di perle di Tahiti rotonde da 9-11mm, chiusura in oro 18 carati. 43cm lunghezza principessa per uneleganza senza tempo.',
      nl: 'Klassieke ketting van ronde Tahiti-parels 9-11mm, 18k gouden sluiting. 43cm princess-lengte voor tijdloze elegantie.',
      ja: '9-11mmのラウンドタヒチパールクラシックネックレス、18金クラスプ。43cmプリンセスレングスで永遠のエレガンス。',
      ko: '9-11mm 라운드 타히티 진주 클래식 목걸이, 18K 금 잠금장치. 43cm 프린세스 길이로 영원한 우아함.',
    },
  },
  'collier-choker-perles-tahiti': {
    name: {
      fr: 'Collier Choker Perles de Tahiti',
      en: 'Tahitian Pearl Choker Necklace',
      de: 'Tahiti-Perlen Choker Halskette',
      es: 'Gargantilla de Perlas de Tahití',
      pt: 'Colar Gargantilha de Pérolas do Taiti',
      it: 'Collana Choker Perle di Tahiti',
      nl: 'Tahiti-parels Choker Ketting',
      ja: 'タヒチパールチョーカーネックレス',
      ko: '타히티 진주 초커 목걸이',
    },
    description: {
      fr: 'Choker élégant de perles de Tahiti graduées de 8-10mm. Fermoir en or blanc 18 carats avec diamant. 38cm pour un port près du cou sophistiqué.',
      en: 'Elegant choker of graduated Tahitian pearls 8-10mm. 18k white gold clasp with diamond. 38cm for sophisticated close-to-neck wear.',
      de: 'Eleganter Choker aus abgestuften Tahiti-Perlen 8-10mm. 18K Weißgold-Verschluss mit Diamant. 38cm für sophistiziertes nahes Tragen am Hals.',
      es: 'Gargantilla elegante de perlas de Tahití graduadas de 8-10mm. Cierre de oro blanco de 18 quilates con diamante. 38cm para uso sofisticado cerca del cuello.',
      pt: 'Gargantilha elegante de pérolas do Taiti graduadas de 8-10mm. Fecho de ouro branco 18 quilates com diamante. 38cm para uso sofisticado próximo ao pescoço.',
      it: 'Choker elegante di perle di Tahiti graduate da 8-10mm. Chiusura in oro bianco 18 carati con diamante. 38cm per un utilizzo sofisticato vicino al collo.',
      nl: 'Elegante choker van gegradueerde Tahiti-parels 8-10mm. 18k witgouden sluiting met diamant. 38cm voor gesofisticeerd dragen dicht bij de hals.',
      ja: '8-10mmグラデーションタヒチパールエレガントチョーカー。ダイヤモンド付き18金ホワイトゴールドクラスプ。38cmで洗練されたネックウェア。',
      ko: '8-10mm 그라데이션 타히티 진주 우아한 초커. 다이아몬드가 있는 18K 화이트 골드 잠금장치. 38cm로 정교한 목걸이.',
    },
  },
  'collier-sautoir-perles-tahiti': {
    name: {
      fr: 'Collier Sautoir Perles de Tahiti',
      en: 'Long Tahitian Pearl Sautoir Necklace',
      de: 'Lange Tahiti-Perlen Sautoir Halskette',
      es: 'Collar Largo Sautoir de Perlas de Tahití',
      pt: 'Colar Longo Sautoir de Pérolas do Taiti',
      it: 'Collana Lunga Sautoir Perle di Tahiti',
      nl: 'Lange Tahiti-parels Sautoir Ketting',
      ja: 'ロングタヒチパールサトワールネックレス',
      ko: '롱 타히티 진주 소토아 목걸이',
    },
    description: {
      fr: 'Long sautoir de 90cm en perles de Tahiti baroques. Peut être porté simple ou en double rang. Fermoir boule en or 18 carats pour une polyvalence maximale.',
      en: 'Long 90cm sautoir of baroque Tahitian pearls. Can be worn single or double strand. 18k gold ball clasp for maximum versatility.',
      de: 'Lange 90cm Sautoir aus barocken Tahiti-Perlen. Kann einfach oder doppelreihig getragen werden. 18K Gold Kugelverschluss für maximale Vielseitigkeit.',
      es: 'Largo sautoir de 90cm en perlas de Tahití barrocas. Puede usarse simple o en doble vuelta. Cierre de bola en oro de 18 quilates para máxima versatilidad.',
      pt: 'Sautoir longo de 90cm em pérolas do Taiti barrocas. Pode ser usado simples ou em dupla volta. Fecho de bola em ouro 18 quilates para máxima versatilidade.',
      it: 'Lungo sautoir di 90cm in perle di Tahiti barocche. Può essere indossato singolo o doppio filo. Chiusura a sfera in oro 18 carati per massima versatilità.',
      nl: 'Lange 90cm sautoir van barokke Tahiti-parels. Kan enkel of dubbel gedragen worden. 18k gouden balsluiting voor maximale veelzijdigheid.',
      ja: 'バロックタヒチパールの90cmロングサトワール。シングルまたはダブルストランドで着用可能。最大の汎用性のための18金ボールクラスプ。',
      ko: '바로크 타히티 진주의 90cm 롱 소토아. 싱글 또는 더블 스트랜드로 착용 가능. 최대 다용도성을 위한 18K 금 볼 잠금장치.',
    },
  },
  'bracelet-perles-tahiti-or': {
    name: {
      fr: 'Bracelet Perles de Tahiti Or',
      en: 'Gold Tahitian Pearl Bracelet',
      de: 'Gold Tahiti-Perlenarmband',
      es: 'Pulsera de Perlas de Tahití Oro',
      pt: 'Pulseira de Pérolas do Taiti Ouro',
      it: 'Bracciale Perle di Tahiti Oro',
      nl: 'Gouden Tahiti-parels Armband',
      ja: 'ゴールドタヒチパールブレスレット',
      ko: '골드 타히티 진주 팔찌',
    },
    description: {
      fr: 'Bracelet de perles de Tahiti rondes de 9mm montées sur chaîne or 18 carats. Fermoir mousqueton sécurisé. 18cm ajustable.',
      en: 'Bracelet of 9mm round Tahitian pearls mounted on 18k gold chain. Secure lobster clasp. 18cm adjustable.',
      de: 'Armband aus 9mm runden Tahiti-Perlen auf 18K Goldkette montiert. Sicherer Karabinerverschluss. 18cm verstellbar.',
      es: 'Pulsera de perlas de Tahití redondas de 9mm montadas en cadena de oro de 18 quilates. Cierre de mosquetón seguro. 18cm ajustable.',
      pt: 'Pulseira de pérolas do Taiti redondas de 9mm montadas em corrente de ouro 18 quilates. Fecho de lagosta seguro. 18cm ajustável.',
      it: 'Bracciale di perle di Tahiti rotonde da 9mm montate su catena in oro 18 carati. Chiusura a moschettone sicura. 18cm regolabile.',
      nl: 'Armband van 9mm ronde Tahiti-parels gemonteerd op 18k gouden ketting. Veilige karabijnsluiting. 18cm verstelbaar.',
      ja: '9mmラウンドタヒチパールを18金チェーンにセットしたブレスレット。安全なロブスタークラスプ。18cm調節可能。',
      ko: '18K 금 체인에 장착된 9mm 라운드 타히티 진주 팔찌. 안전한 랍스터 잠금장치. 18cm 조절 가능.',
    },
  },
  'bracelet-multi-rangs-perles': {
    name: {
      fr: 'Bracelet Multi-rangs Perles de Tahiti',
      en: 'Multi-strand Tahitian Pearl Bracelet',
      de: 'Mehrreihiges Tahiti-Perlenarmband',
      es: 'Pulsera Multi-hileras de Perlas de Tahití',
      pt: 'Pulseira Multi-fileiras de Pérolas do Taiti',
      it: 'Bracciale Multi-fila Perle di Tahiti',
      nl: 'Meerrijige Tahiti-parels Armband',
      ja: 'マルチストランドタヒチパールブレスレット',
      ko: '멀티 스트랜드 타히티 진주 팔찌',
    },
    description: {
      fr: 'Bracelet trois rangs de perles de Tahiti keshi iridescentes. Fermoir magnétique or blanc 18 carats. Effet cascade lumineux sur le poignet.',
      en: 'Three-strand bracelet of iridescent Tahitian keshi pearls. 18k white gold magnetic clasp. Luminous cascade effect on the wrist.',
      de: 'Dreireihiges Armband aus schillernden Tahiti-Keshi-Perlen. 18K Weißgold Magnetverschluss. Leuchtender Kaskadeneffekt am Handgelenk.',
      es: 'Pulsera de tres hileras de perlas keshi de Tahití iridiscentes. Cierre magnético de oro blanco de 18 quilates. Efecto cascada luminoso en la muñeca.',
      pt: 'Pulseira de três fileiras de pérolas keshi do Taiti iridescentes. Fecho magnético de ouro branco 18 quilates. Efeito cascata luminoso no pulso.',
      it: 'Bracciale a tre fili di perle keshi di Tahiti iridescenti. Chiusura magnetica in oro bianco 18 carati. Effetto cascata luminoso sul polso.',
      nl: 'Drierijige armband van iriserende Tahiti-keshi-parels. 18k witgouden magnetische sluiting. Lichtend cascade-effect op de pols.',
      ja: 'イリデセントタヒチケシパールの3連ブレスレット。18金ホワイトゴールドマグネットクラスプ。手首に輝くカスケード効果。',
      ko: '이리데센트 타히티 케시 진주의 3줄 팔찌. 18K 화이트 골드 자석 잠금장치. 손목에 빛나는 캐스케이드 효과.',
    },
  },
  'boucles-oreilles-perles-goutte': {
    name: {
      fr: 'Boucles dOreilles Perles Goutte',
      en: 'Drop Pearl Earrings',
      de: 'Tropfen-Perlenohrringe',
      es: 'Pendientes de Perlas Gota',
      pt: 'Brincos de Pérolas Gota',
      it: 'Orecchini Perle Goccia',
      nl: 'Druppel Parel Oorbellen',
      ja: 'ドロップパールイヤリング',
      ko: '드롭 진주 귀걸이',
    },
    description: {
      fr: 'Boucles doreilles pendantes avec perles de Tahiti en forme de goutte de 11mm. Monture or 18 carats avec diamants. Élégance pour toutes occasions.',
      en: 'Drop earrings with 11mm drop-shaped Tahitian pearls. 18k gold setting with diamonds. Elegance for all occasions.',
      de: 'Hängeohrringe mit 11mm tropfenförmigen Tahiti-Perlen. 18K Gold-Fassung mit Diamanten. Eleganz für alle Anlässe.',
      es: 'Pendientes colgantes con perlas de Tahití en forma de gota de 11mm. Montura de oro de 18 quilates con diamantes. Elegancia para todas las ocasiones.',
      pt: 'Brincos pendentes com pérolas do Taiti em forma de gota de 11mm. Engaste de ouro 18 quilates com diamantes. Elegância para todas as ocasiões.',
      it: 'Orecchini pendenti con perle di Tahiti a goccia da 11mm. Montatura in oro 18 carati con diamanti. Eleganza per tutte le occasioni.',
      nl: 'Hangende oorbellen met 11mm druppelvormige Tahiti-parels. 18k gouden zetting met diamanten. Elegantie voor alle gelegenheden.',
      ja: '11mmドロップ形タヒチパールのドロップイヤリング。ダイヤモンド付き18金セッティング。あらゆる機会にエレガンス。',
      ko: '11mm 드롭 모양 타히티 진주가 있는 드롭 귀걸이. 다이아몬드가 있는 18K 금 세팅. 모든 경우에 우아함.',
    },
  },
  'bague-perle-tahiti-diamants': {
    name: {
      fr: 'Bague Perle de Tahiti Diamants',
      en: 'Tahitian Pearl Diamond Ring',
      de: 'Tahiti-Perle Diamant Ring',
      es: 'Anillo de Perla de Tahití con Diamantes',
      pt: 'Anel de Pérola do Taiti com Diamantes',
      it: 'Anello Perla di Tahiti con Diamanti',
      nl: 'Tahiti-parel Diamanten Ring',
      ja: 'タヒチパールダイヤモンドリング',
      ko: '타히티 진주 다이아몬드 반지',
    },
    description: {
      fr: 'Bague en or blanc 18 carats avec perle de Tahiti ronde de 11mm entourée de diamants. Design classique intemporel pour une brillance exceptionnelle.',
      en: '18k white gold ring with 11mm round Tahitian pearl surrounded by diamonds. Timeless classic design for exceptional brilliance.',
      de: '18K Weißgold-Ring mit 11mm runder Tahiti-Perle umgeben von Diamanten. Zeitloses klassisches Design für außergewöhnliche Brillanz.',
      es: 'Anillo de oro blanco de 18 quilates con perla de Tahití redonda de 11mm rodeada de diamantes. Diseño clásico atemporal para un brillo excepcional.',
      pt: 'Anel de ouro branco 18 quilates com pérola do Taiti redonda de 11mm cercada por diamantes. Design clássico atemporal para brilho excepcional.',
      it: 'Anello in oro bianco 18 carati con perla di Tahiti rotonda da 11mm circondata da diamanti. Design classico senza tempo per una brillantezza eccezionale.',
      nl: '18k witgouden ring met 11mm ronde Tahiti-parel omringd door diamanten. Tijdloos klassiek ontwerp voor uitzonderlijke schittering.',
      ja: 'ダイヤモンドに囲まれた11mmラウンドタヒチパールの18金ホワイトゴールドリング。卓越した輝きのための永遠のクラシックデザイン。',
      ko: '다이아몬드로 둘러싸인 11mm 라운드 타히티 진주가 있는 18K 화이트 골드 반지. 뛰어난 광채를 위한 시대를 초월한 클래식 디자인.',
    },
  },
  'bague-perle-simple': {
    name: {
      fr: 'Bague Perle Simple',
      en: 'Simple Pearl Ring',
      de: 'Einfacher Perlenring',
      es: 'Anillo de Perla Simple',
      pt: 'Anel de Pérola Simples',
      it: 'Anello Perla Semplice',
      nl: 'Eenvoudige Parel Ring',
      ja: 'シンプルパールリング',
      ko: '심플 진주 반지',
    },
    description: {
      fr: 'Bague solitaire en or jaune 18 carats avec perle de Tahiti ronde de 10mm. Design minimaliste élégant pour un port quotidien raffiné.',
      en: 'Solitaire ring in 18k yellow gold with 10mm round Tahitian pearl. Elegant minimalist design for refined daily wear.',
      de: 'Solitär-Ring aus 18K Gelbgold mit 10mm runder Tahiti-Perle. Elegantes minimalistisches Design für raffiniertes tägliches Tragen.',
      es: 'Anillo solitario en oro amarillo de 18 quilates con perla de Tahití redonda de 10mm. Diseño minimalista elegante para uso diario refinado.',
      pt: 'Anel solitário em ouro amarelo 18 quilates com pérola do Taiti redonda de 10mm. Design minimalista elegante para uso diário refinado.',
      it: 'Anello solitario in oro giallo 18 carati con perla di Tahiti rotonda da 10mm. Design minimalista elegante per un uso quotidiano raffinato.',
      nl: 'Solitaire ring in 18k geel goud met 10mm ronde Tahiti-parel. Elegant minimalistisch ontwerp voor verfijnd dagelijks dragen.',
      ja: '10mmラウンドタヒチパールの18金イエローゴールドソリテールリング。洗練された日常使いのためのエレガントなミニマリストデザイン。',
      ko: '10mm 라운드 타히티 진주가 있는 18K 옐로우 골드 솔리테어 반지. 정제된 일상 착용을 위한 우아한 미니멀리스트 디자인.',
    },
  },
  'pendentif-perle-simple': {
    name: {
      fr: 'Pendentif Perle Simple',
      en: 'Simple Pearl Pendant',
      de: 'Einfacher Perlenanhänger',
      es: 'Colgante de Perla Simple',
      pt: 'Pingente de Pérola Simples',
      it: 'Ciondolo Perla Semplice',
      nl: 'Eenvoudige Parel Hanger',
      ja: 'シンプルパールペンダント',
      ko: '심플 진주 펜던트',
    },
    description: {
      fr: 'Pendentif élégant avec perle de Tahiti ronde de 10mm sur bélière or 18 carats. Chaîne vénitienne incluse. Un classique indémodable.',
      en: 'Elegant pendant with 10mm round Tahitian pearl on 18k gold bail. Venetian chain included. A timeless classic.',
      de: 'Eleganter Anhänger mit 10mm runder Tahiti-Perle an 18K Gold-Öse. Venezianische Kette inklusive. Ein zeitloser Klassiker.',
      es: 'Colgante elegante con perla de Tahití redonda de 10mm en anilla de oro de 18 quilates. Cadena veneciana incluida. Un clásico atemporal.',
      pt: 'Pingente elegante com pérola do Taiti redonda de 10mm em argola de ouro 18 quilates. Corrente veneziana incluída. Um clássico atemporal.',
      it: 'Ciondolo elegante con perla di Tahiti rotonda da 10mm su gancio in oro 18 carati. Catena veneziana inclusa. Un classico senza tempo.',
      nl: 'Elegante hanger met 10mm ronde Tahiti-parel aan 18k gouden oog. Venetiaanse ketting inbegrepen. Een tijdloze klassieker.',
      ja: '18金ベイルに10mmラウンドタヒチパールのエレガントなペンダント。ベネチアンチェーン付き。永遠のクラシック。',
      ko: '18K 금 베일에 10mm 라운드 타히티 진주가 있는 우아한 펜던트. 베네치안 체인 포함. 시대를 초월한 클래식.',
    },
  },
  'pendentif-diamant-halo': {
    name: {
      fr: 'Pendentif Diamant Halo',
      en: 'Diamond Halo Pendant',
      de: 'Diamant Halo Anhänger',
      es: 'Colgante Halo de Diamantes',
      pt: 'Pingente Halo de Diamante',
      it: 'Ciondolo Halo di Diamanti',
      nl: 'Diamant Halo Hanger',
      ja: 'ダイヤモンドハローペンダント',
      ko: '다이아몬드 헤일로 펜던트',
    },
    description: {
      fr: 'Pendentif luxueux avec perle de Tahiti de 12mm entourée dun halo de diamants. Or blanc 18 carats. Éclat spectaculaire pour occasions spéciales.',
      en: 'Luxurious pendant with 12mm Tahitian pearl surrounded by a diamond halo. 18k white gold. Spectacular sparkle for special occasions.',
      de: 'Luxuriöser Anhänger mit 12mm Tahiti-Perle umgeben von einem Diamant-Halo. 18K Weißgold. Spektakulärer Glanz für besondere Anlässe.',
      es: 'Colgante lujoso con perla de Tahití de 12mm rodeada de un halo de diamantes. Oro blanco de 18 quilates. Brillo espectacular para ocasiones especiales.',
      pt: 'Pingente luxuoso com pérola do Taiti de 12mm cercada por um halo de diamantes. Ouro branco 18 quilates. Brilho espetacular para ocasiões especiais.',
      it: 'Ciondolo lussuoso con perla di Tahiti da 12mm circondata da un alone di diamanti. Oro bianco 18 carati. Splendore spettacolare per occasioni speciali.',
      nl: 'Luxueuze hanger met 12mm Tahiti-parel omringd door een diamanten halo. 18k witgoud. Spectaculaire schittering voor speciale gelegenheden.',
      ja: 'ダイヤモンドハローに囲まれた12mmタヒチパールのラグジュアリーペンダント。18金ホワイトゴールド。特別な機会のための壮観な輝き。',
      ko: '다이아몬드 헤일로로 둘러싸인 12mm 타히티 진주가 있는 럭셔리 펜던트. 18K 화이트 골드. 특별한 경우를 위한 화려한 빛.',
    },
  },
  'parure-complete-tahiti': {
    name: {
      fr: 'Parure Complète Perles de Tahiti',
      en: 'Complete Tahitian Pearl Set',
      de: 'Komplettes Tahiti-Perlen Set',
      es: 'Conjunto Completo de Perlas de Tahití',
      pt: 'Conjunto Completo de Pérolas do Taiti',
      it: 'Parure Completa Perle di Tahiti',
      nl: 'Complete Tahiti-parels Set',
      ja: 'コンプリートタヒチパールセット',
      ko: '완전한 타히티 진주 세트',
    },
    description: {
      fr: 'Parure assortie comprenant collier princess, bracelet et boucles doreilles en perles de Tahiti. Coffret cadeau de luxe inclus.',
      en: 'Matching set including princess necklace, bracelet, and earrings in Tahitian pearls. Luxury gift box included.',
      de: 'Passendes Set bestehend aus Princess-Halskette, Armband und Ohrringen aus Tahiti-Perlen. Luxus-Geschenkbox inklusive.',
      es: 'Conjunto combinado que incluye collar princess, pulsera y pendientes en perlas de Tahití. Caja de regalo de lujo incluida.',
      pt: 'Conjunto combinado incluindo colar princess, pulseira e brincos em pérolas do Taiti. Caixa de presente de luxo incluída.',
      it: 'Parure abbinata comprendente collana princess, bracciale e orecchini in perle di Tahiti. Cofanetto regalo di lusso incluso.',
      nl: 'Bijpassende set inclusief princess-ketting, armband en oorbellen in Tahiti-parels. Luxe geschenkdoos inbegrepen.',
      ja: 'タヒチパールのプリンセスネックレス、ブレスレット、イヤリングを含むマッチングセット。ラグジュアリーギフトボックス付き。',
      ko: '타히티 진주의 프린세스 목걸이, 팔찌, 귀걸이를 포함한 매칭 세트. 럭셔리 선물 상자 포함.',
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing translations from database
    const { data: existingTranslations, error: fetchError } = await supabase
      .from("product_translations")
      .select("slug");

    if (fetchError) {
      throw fetchError;
    }

    const existingSlugs = new Set((existingTranslations || []).map((t: { slug: string }) => t.slug));
    
    // Find static translations that don't exist in DB
    const staticSlugs = Object.keys(staticTranslations);
    const missingSlugs = staticSlugs.filter(slug => !existingSlugs.has(slug));

    if (missingSlugs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "All static translations already exist in database",
          existing: existingSlugs.size,
          static: staticSlugs.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare records to insert
    const recordsToInsert = missingSlugs.map(slug => ({
      slug,
      name_translations: staticTranslations[slug].name,
      description_translations: staticTranslations[slug].description,
    }));

    // Insert missing translations
    const { data: inserted, error: insertError } = await supabase
      .from("product_translations")
      .upsert(recordsToInsert, { onConflict: "slug" })
      .select();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${missingSlugs.length} static translations to database`,
        synced: missingSlugs,
        count: missingSlugs.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error syncing translations:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
