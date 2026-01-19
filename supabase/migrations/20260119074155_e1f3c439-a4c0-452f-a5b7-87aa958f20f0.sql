-- Update product images to use local assets
UPDATE products SET images = ARRAY['/src/assets/pearl-round-aaa.jpg'] WHERE slug = 'perle-tahiti-ronde-aaa';
UPDATE products SET images = ARRAY['/src/assets/pearl-baroque.jpg'] WHERE slug = 'perle-tahiti-baroque';
UPDATE products SET images = ARRAY['/src/assets/pearl-set.jpg'] WHERE slug = 'lot-perles-tahiti-assorties';
UPDATE products SET images = ARRAY['/src/assets/bracelet-gold-pearls.jpg'] WHERE slug = 'bracelet-or-perles-tahiti';
UPDATE products SET images = ARRAY['/src/assets/bracelet-multi-pearls.jpg'] WHERE slug = 'bracelet-multi-perles';
UPDATE products SET images = ARRAY['/src/assets/necklace-pearls-gold.jpg'] WHERE slug = 'collier-perles-tahiti-or';
UPDATE products SET images = ARRAY['/src/assets/necklace-sautoir.jpg'] WHERE slug = 'sautoir-perles-tahiti';
UPDATE products SET images = ARRAY['/src/assets/ring-pearl-diamonds.jpg'] WHERE slug = 'bague-perle-tahiti-diamants';
UPDATE products SET images = ARRAY['/src/assets/ring-simple-pearl.jpg'] WHERE slug = 'bague-solitaire-perle';
UPDATE products SET images = ARRAY['/src/assets/pendant-pearl.jpg'] WHERE slug = 'pendentif-perle-tahiti';
UPDATE products SET images = ARRAY['/src/assets/earrings-pearl-drop.jpg'] WHERE slug = 'boucles-oreilles-perles-tahiti';