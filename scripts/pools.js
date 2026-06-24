// ============================================================
// Content pools for procedural soal generation (id + en).
// Used by scripts/generate.js
// ============================================================

// ---- Seeded RNG (LCG) for reproducible builds ----
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sample(rng, arr, n) {
  return shuffle(rng, arr).slice(0, n);
}

// ---- Logic categories (for syllogisms / analogies) ----
const CATS = {
  id: [
    ['kucing', 'hewan'], ['mawar', 'bunga'], ['apel', 'buah'], ['guru', 'manusia'],
    ['mobil', 'kendaraan'], ['merpati', 'burung'], ['hiu', 'ikan'], ['emas', 'logam'],
    ['gitar', 'alat musik'], ['dokter', 'profesi'], ['jakarta', 'kota'], ['padi', 'tanaman'],
    ['singa', 'hewan'], ['melati', 'bunga'], ['mangga', 'buah'], ['pesawat', 'kendaraan'],
  ],
  en: [
    ['cat', 'animal'], ['rose', 'flower'], ['apple', 'fruit'], ['teacher', 'human'],
    ['car', 'vehicle'], ['pigeon', 'bird'], ['shark', 'fish'], ['gold', 'metal'],
    ['guitar', 'instrument'], ['doctor', 'profession'], ['paris', 'city'], ['rice', 'plant'],
    ['lion', 'animal'], ['jasmine', 'flower'], ['mango', 'fruit'], ['plane', 'vehicle'],
  ],
};

// ---- Analogy pairs (relation-consistent) ----
const ANALOGY = {
  id: [
    ['panas', 'dingin', 'tinggi', 'rendah'],
    ['raja', 'ratu', 'pria', 'wanita'],
    ['siang', 'malam', 'terang', 'gelap'],
    ['guru', 'sekolah', 'dokter', 'rumah sakit'],
    ['roda', 'mobil', 'sayap', 'pesawat'],
    ['ikan', 'air', 'burung', 'udara'],
    ['buku', 'membaca', 'pena', 'menulis'],
    ['lapar', 'makan', 'haus', 'minum'],
  ],
  en: [
    ['hot', 'cold', 'high', 'low'],
    ['king', 'queen', 'man', 'woman'],
    ['day', 'night', 'light', 'dark'],
    ['teacher', 'school', 'doctor', 'hospital'],
    ['wheel', 'car', 'wing', 'plane'],
    ['fish', 'water', 'bird', 'air'],
    ['book', 'read', 'pen', 'write'],
    ['hungry', 'eat', 'thirsty', 'drink'],
  ],
};

// ---- WordSearch themes (theme -> words). Words UPPERCASE, A-Z only ----
const WORD_THEMES = {
  id: {
    HEWAN: ['KUCING', 'ANJING', 'GAJAH', 'HARIMAU', 'SINGA', 'ZEBRA', 'KUDA', 'SAPI', 'KAMBING', 'AYAM', 'BEBEK', 'RUSA', 'BERUANG', 'SERIGALA', 'KELINCI', 'TIKUS', 'ULAR', 'KATAK', 'BURUNG', 'IKAN'],
    BUAH: ['APEL', 'MANGGA', 'JERUK', 'PISANG', 'ANGGUR', 'MELON', 'SEMANGKA', 'NANAS', 'PEPAYA', 'DURIAN', 'RAMBUTAN', 'SALAK', 'JAMBU', 'KELAPA', 'STROBERI', 'CERI', 'KIWI', 'LECI'],
    SAYURAN: ['WORTEL', 'BAYAM', 'KANGKUNG', 'KENTANG', 'TOMAT', 'TERONG', 'TIMUN', 'LABU', 'JAGUNG', 'BUNCIS', 'KOL', 'SAWI', 'BROKOLI', 'CABAI', 'BAWANG', 'SELADA'],
    KOTA: ['JAKARTA', 'BANDUNG', 'SURABAYA', 'MEDAN', 'SEMARANG', 'MAKASSAR', 'PALEMBANG', 'DEPOK', 'BOGOR', 'MALANG', 'SOLO', 'PADANG', 'MANADO', 'AMBON', 'JAYAPURA'],
    PROFESI: ['DOKTER', 'GURU', 'POLISI', 'TENTARA', 'PILOT', 'PERAWAT', 'PETANI', 'NELAYAN', 'HAKIM', 'PENGACARA', 'KOKI', 'PENJAHIT', 'MASINIS', 'WARTAWAN', 'ARSITEK'],
    OLAHRAGA: ['SEPAKBOLA', 'BASKET', 'VOLI', 'RENANG', 'LARI', 'TENIS', 'BULUTANGKIS', 'CATUR', 'KARATE', 'SILAT', 'GOLF', 'BILIAR', 'SENAM', 'TINJU', 'PANAHAN'],
    WARNA: ['MERAH', 'BIRU', 'HIJAU', 'KUNING', 'UNGU', 'JINGGA', 'HITAM', 'PUTIH', 'COKLAT', 'ABU', 'PINK', 'EMAS', 'PERAK', 'NILA'],
    PAHLAWAN: ['SOEKARNO', 'HATTA', 'KARTINI', 'DIPONEGORO', 'SUDIRMAN', 'IMAM', 'CUTNYAKDIEN', 'PATTIMURA', 'HASANUDDIN', 'TEUKUUMAR'],
  },
  en: {
    ANIMALS: ['CAT', 'DOG', 'ELEPHANT', 'TIGER', 'LION', 'ZEBRA', 'HORSE', 'COW', 'GOAT', 'CHICKEN', 'DUCK', 'DEER', 'BEAR', 'WOLF', 'RABBIT', 'MOUSE', 'SNAKE', 'FROG', 'BIRD', 'FISH'],
    FRUITS: ['APPLE', 'MANGO', 'ORANGE', 'BANANA', 'GRAPE', 'MELON', 'PEACH', 'PINEAPPLE', 'PAPAYA', 'CHERRY', 'LEMON', 'KIWI', 'PLUM', 'PEAR', 'BERRY', 'COCONUT', 'LIME', 'FIG'],
    VEGETABLES: ['CARROT', 'SPINACH', 'POTATO', 'TOMATO', 'CUCUMBER', 'PUMPKIN', 'CORN', 'BEAN', 'CABBAGE', 'BROCCOLI', 'CHILI', 'ONION', 'LETTUCE', 'GARLIC', 'PEA', 'CELERY'],
    COUNTRIES: ['INDONESIA', 'JAPAN', 'BRAZIL', 'CANADA', 'FRANCE', 'GERMANY', 'EGYPT', 'INDIA', 'CHINA', 'MEXICO', 'SPAIN', 'ITALY', 'KENYA', 'CHILE', 'NORWAY'],
    JOBS: ['DOCTOR', 'TEACHER', 'POLICE', 'SOLDIER', 'PILOT', 'NURSE', 'FARMER', 'JUDGE', 'LAWYER', 'CHEF', 'TAILOR', 'DRIVER', 'WRITER', 'ARCHITECT', 'ENGINEER'],
    SPORTS: ['SOCCER', 'BASKET', 'VOLLEY', 'SWIM', 'RUNNING', 'TENNIS', 'BADMINTON', 'CHESS', 'KARATE', 'BOXING', 'GOLF', 'CYCLING', 'HOCKEY', 'ARCHERY', 'SKIING'],
    COLORS: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'BLACK', 'WHITE', 'BROWN', 'GRAY', 'PINK', 'GOLD', 'SILVER', 'CYAN'],
    JOBS2: ['BAKER', 'BARBER', 'DENTIST', 'PLUMBER', 'PAINTER', 'SAILOR', 'MINER', 'ACTOR', 'SINGER', 'DANCER', 'CLERK', 'GUARD'],
  },
};

// ---- Crossword word+clue banks (answer UPPERCASE, A-Z) ----
const CROSSWORD_WORDS = {
  id: [
    ['KUCING', 'Hewan peliharaan yang mengeong'],
    ['ANJING', 'Sahabat manusia yang menggonggong'],
    ['GAJAH', 'Hewan darat terbesar berbelalai'],
    ['HARIMAU', 'Kucing besar belang dari Sumatra'],
    ['SINGA', 'Raja hutan bersurai'],
    ['APEL', 'Buah merah simbol guru'],
    ['MANGGA', 'Buah kuning manis tropis'],
    ['JERUK', 'Buah sumber vitamin C'],
    ['PISANG', 'Buah kuning melengkung'],
    ['MERAH', 'Warna darah dan berani'],
    ['BIRU', 'Warna langit cerah'],
    ['HIJAU', 'Warna daun dan alam'],
    ['KUNING', 'Warna matahari'],
    ['JAKARTA', 'Ibu kota Indonesia'],
    ['BANDUNG', 'Kota kembang Jawa Barat'],
    ['DOKTER', 'Profesi penyembuh penyakit'],
    ['GURU', 'Pahlawan tanpa tanda jasa'],
    ['POLISI', 'Penjaga keamanan negara'],
    ['BUKU', 'Jendela dunia untuk dibaca'],
    ['MEJA', 'Tempat menulis berkaki empat'],
    ['KURSI', 'Tempat duduk'],
    ['PENA', 'Alat untuk menulis'],
    ['LAUT', 'Perairan asin yang luas'],
    ['GUNUNG', 'Daratan menjulang tinggi'],
    ['SUNGAI', 'Aliran air tawar panjang'],
    ['HUJAN', 'Air yang turun dari langit'],
    ['MATAHARI', 'Bintang pusat tata surya'],
    ['BULAN', 'Satelit alami bumi'],
    ['BINTANG', 'Titik cahaya di malam hari'],
    ['NASI', 'Makanan pokok Indonesia'],
    ['ZEBRA', 'Kuda belang hitam putih'],
    ['BEBEK', 'Unggas yang berkata kwek'],
    ['KUDA', 'Hewan tunggangan berlari kencang'],
    ['SAPI', 'Hewan penghasil susu'],
    ['AYAM', 'Unggas berkokok di pagi hari'],
    ['SEMUT', 'Serangga kecil pekerja keras'],
    ['LEBAH', 'Serangga penghasil madu'],
    ['KUPU', 'Serangga indah bersayap warna'],
    ['NANAS', 'Buah berduri rasa asam manis'],
    ['MELON', 'Buah hijau berair manis'],
    ['SALAK', 'Buah berkulit seperti ular'],
    ['DURIAN', 'Raja buah berduri tajam'],
    ['UNGU', 'Warna campuran merah dan biru'],
    ['HITAM', 'Warna paling gelap'],
    ['PUTIH', 'Warna salju dan susu'],
    ['MEDAN', 'Ibu kota Sumatra Utara'],
    ['SOLO', 'Kota batik di Jawa Tengah'],
    ['BOGOR', 'Kota hujan dekat Jakarta'],
    ['PILOT', 'Pengemudi pesawat terbang'],
    ['PETANI', 'Penggarap sawah dan ladang'],
    ['HAKIM', 'Pemutus perkara di pengadilan'],
    ['PERAWAT', 'Pendamping dokter merawat pasien'],
    ['KOKI', 'Ahli memasak di restoran'],
    ['SEKOLAH', 'Tempat menuntut ilmu'],
    ['PENSIL', 'Alat tulis dari grafit'],
    ['PAPAN', 'Tempat menulis di kelas'],
    ['TAS', 'Wadah membawa buku'],
    ['JAM', 'Penunjuk waktu'],
    ['LAMPU', 'Penerang di malam hari'],
    ['JEMBATAN', 'Penghubung dua sisi sungai'],
    ['HUTAN', 'Kumpulan pohon yang lebat'],
    ['PANTAI', 'Tepi laut berpasir'],
    ['SALJU', 'Air membeku turun dari langit'],
    ['ANGIN', 'Udara yang bergerak'],
    ['PETIR', 'Kilat disertai guntur'],
    ['PELANGI', 'Busur warna setelah hujan'],
    ['KAPAL', 'Kendaraan besar di laut'],
    ['SEPEDA', 'Kendaraan roda dua dikayuh'],
    ['KERETA', 'Kendaraan rel panjang'],
    ['ROKET', 'Kendaraan menuju luar angkasa'],
    ['GARAM', 'Bumbu asin dari laut'],
    ['GULA', 'Bumbu manis untuk teh'],
    ['SUSU', 'Minuman putih dari sapi'],
    ['KOPI', 'Minuman hitam pahit penambah semangat'],
    ['MADU', 'Cairan manis dari lebah'],
    ['ROTI', 'Makanan dari tepung dipanggang'],
    ['TELUR', 'Bahan masakan dari ayam'],
    ['KEJU', 'Olahan susu berwarna kuning'],
  ],
  en: [
    ['CAT', 'A pet that meows'],
    ['DOG', "Man's best friend"],
    ['LION', 'King of the jungle'],
    ['TIGER', 'Striped big cat'],
    ['APPLE', 'A teacher fruit, keeps the doctor away'],
    ['MANGO', 'Sweet tropical fruit'],
    ['LEMON', 'Sour yellow citrus'],
    ['GRAPE', 'Small fruit in bunches'],
    ['RED', 'Color of blood'],
    ['BLUE', 'Color of the sky'],
    ['GREEN', 'Color of leaves'],
    ['GOLD', 'Precious yellow metal'],
    ['PARIS', 'Capital of France'],
    ['TOKYO', 'Capital of Japan'],
    ['DOCTOR', 'One who heals the sick'],
    ['TEACHER', 'One who educates students'],
    ['POLICE', 'Keeper of public order'],
    ['BOOK', 'You read it'],
    ['DESK', 'A table for writing'],
    ['CHAIR', 'You sit on it'],
    ['PEN', 'A writing tool'],
    ['SEA', 'Large body of salt water'],
    ['MOUNTAIN', 'Tall landform'],
    ['RIVER', 'Flowing fresh water'],
    ['RAIN', 'Water falling from clouds'],
    ['SUN', 'Star at the center of our system'],
    ['MOON', "Earth's natural satellite"],
    ['STAR', 'A point of light at night'],
    ['RICE', 'Asian staple food'],
    ['WATER', 'H2O, essential to life'],
    ['ZEBRA', 'Black and white striped horse'],
    ['HORSE', 'Animal you ride that gallops'],
    ['SNAKE', 'Legless reptile that slithers'],
    ['EAGLE', 'Powerful bird of prey'],
    ['SHARK', 'Feared predator of the sea'],
    ['WHALE', 'Largest animal in the ocean'],
    ['BEE', 'Insect that makes honey'],
    ['ANT', 'Tiny hard-working insect'],
    ['SPIDER', 'Eight-legged web weaver'],
    ['MELON', 'Sweet juicy green fruit'],
    ['CHERRY', 'Small red fruit with a pit'],
    ['ORANGE', 'Citrus fruit and a color'],
    ['PURPLE', 'Mix of red and blue'],
    ['BLACK', 'The darkest color'],
    ['WHITE', 'Color of snow and milk'],
    ['LONDON', 'Capital of England'],
    ['ROME', 'Capital of Italy'],
    ['CAIRO', 'Capital of Egypt'],
    ['PILOT', 'One who flies a plane'],
    ['FARMER', 'One who works the fields'],
    ['JUDGE', 'One who decides court cases'],
    ['NURSE', 'One who cares for patients'],
    ['CHEF', 'A professional cook'],
    ['SCHOOL', 'Place where you learn'],
    ['PENCIL', 'Writing tool made of graphite'],
    ['BOARD', 'You write on it in class'],
    ['BAG', 'You carry your books in it'],
    ['CLOCK', 'It tells the time'],
    ['LAMP', 'It gives light at night'],
    ['BRIDGE', 'It connects two riverbanks'],
    ['FOREST', 'A large area full of trees'],
    ['BEACH', 'Sandy shore by the sea'],
    ['SNOW', 'Frozen water from the sky'],
    ['WIND', 'Moving air'],
    ['CLOUD', 'White fluffy shape in the sky'],
    ['RAINBOW', 'Arc of colors after rain'],
    ['SHIP', 'A large vessel on the sea'],
    ['BICYCLE', 'Two-wheeled pedal vehicle'],
    ['TRAIN', 'Vehicle that runs on rails'],
    ['ROCKET', 'Vehicle that flies to space'],
    ['SALT', 'Salty seasoning from the sea'],
    ['SUGAR', 'Sweet seasoning for tea'],
    ['MILK', 'White drink from a cow'],
    ['COFFEE', 'Bitter morning drink'],
    ['HONEY', 'Sweet liquid from bees'],
    ['BREAD', 'Baked food made from flour'],
    ['EGG', 'Cooking ingredient from a hen'],
    ['CHEESE', 'Yellow dairy product'],
  ],
};

// ---- Memory: emoji pairs + word/translation pairs ----
const EMOJIS = ['🐶', '🐱', '🦁', '🐯', '🐸', '🐵', '🦊', '🐼', '🐨', '🐮', '🐷', '🐔', '🦄', '🐙', '🦋', '🐝', '🍎', '🍌', '🍇', '🍓', '🍉', '🍒', '🥕', '🌽', '⚽', '🏀', '🎸', '🚗', '✈️', '🚀', '⭐', '🌈', '🔥', '❤️', '🎈', '🎁', '🍕', '🍔', '🍩', '🌙'];

const WORD_PAIRS = {
  // id word -> en word (used for medium memory: id/en match)
  base: [
    ['KUCING', 'CAT'], ['ANJING', 'DOG'], ['BURUNG', 'BIRD'], ['IKAN', 'FISH'],
    ['APEL', 'APPLE'], ['BUKU', 'BOOK'], ['AIR', 'WATER'], ['API', 'FIRE'],
    ['RUMAH', 'HOUSE'], ['MOBIL', 'CAR'], ['MEJA', 'TABLE'], ['PINTU', 'DOOR'],
    ['MERAH', 'RED'], ['BIRU', 'BLUE'], ['HIJAU', 'GREEN'], ['BULAN', 'MOON'],
    ['MATAHARI', 'SUN'], ['BINTANG', 'STAR'], ['LAUT', 'SEA'], ['GUNUNG', 'MOUNTAIN'],
    ['SATU', 'ONE'], ['DUA', 'TWO'], ['TIGA', 'THREE'], ['EMPAT', 'FOUR'],
  ],
};

// ---- Memory: picture (emoji) ↔ word, for medium mode ----
// [emoji, id, en]
const EMOJI_WORDS = [
  ['🐱', 'KUCING', 'CAT'], ['🐶', 'ANJING', 'DOG'], ['🦁', 'SINGA', 'LION'],
  ['🐯', 'HARIMAU', 'TIGER'], ['🐘', 'GAJAH', 'ELEPHANT'], ['🐵', 'MONYET', 'MONKEY'],
  ['🐸', 'KATAK', 'FROG'], ['🐦', 'BURUNG', 'BIRD'], ['🐟', 'IKAN', 'FISH'],
  ['🐮', 'SAPI', 'COW'], ['🐷', 'BABI', 'PIG'], ['🐔', 'AYAM', 'CHICKEN'],
  ['🐴', 'KUDA', 'HORSE'], ['🐰', 'KELINCI', 'RABBIT'], ['🐻', 'BERUANG', 'BEAR'],
  ['🐧', 'PINGUIN', 'PENGUIN'], ['🦋', 'KUPU', 'BUTTERFLY'], ['🐝', 'LEBAH', 'BEE'],
  ['🍎', 'APEL', 'APPLE'], ['🍌', 'PISANG', 'BANANA'], ['🍇', 'ANGGUR', 'GRAPE'],
  ['🍓', 'STROBERI', 'STRAWBERRY'], ['🍉', 'SEMANGKA', 'WATERMELON'], ['🍊', 'JERUK', 'ORANGE'],
  ['🥕', 'WORTEL', 'CARROT'], ['🌽', 'JAGUNG', 'CORN'], ['🍅', 'TOMAT', 'TOMATO'],
  ['⚽', 'BOLA', 'BALL'], ['🚗', 'MOBIL', 'CAR'], ['✈️', 'PESAWAT', 'PLANE'],
  ['🚀', 'ROKET', 'ROCKET'], ['🚲', 'SEPEDA', 'BICYCLE'], ['🚂', 'KERETA', 'TRAIN'],
  ['⭐', 'BINTANG', 'STAR'], ['🌙', 'BULAN', 'MOON'], ['☀️', 'MATAHARI', 'SUN'],
  ['🔥', 'API', 'FIRE'], ['💧', 'AIR', 'WATER'], ['🏠', 'RUMAH', 'HOUSE'],
  ['🌳', 'POHON', 'TREE'], ['🌸', 'BUNGA', 'FLOWER'], ['🎸', 'GITAR', 'GUITAR'],
  ['📖', 'BUKU', 'BOOK'], ['✏️', 'PENSIL', 'PENCIL'], ['🕐', 'JAM', 'CLOCK'],
  ['👁️', 'MATA', 'EYE'], ['🌧️', 'HUJAN', 'RAIN'], ['❄️', 'SALJU', 'SNOW'],
];

// ---- Emoji groups for OddOneOut ----
const EMOJI_GROUPS = {
  animals: ['🐶', '🐱', '🦁', '🐯', '🐘', '🐵', '🐸', '🐰', '🐻', '🐼', '🐷', '🐮', '🐔', '🦊', '🐨', '🐺'],
  fruits: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍒', '🍊', '🥝', '🍑', '🍍', '🥭', '🍐'],
  vehicles: ['🚗', '✈️', '🚀', '🚲', '🚂', '🚁', '🚌', '🚜', '🛵', '🚤', '🚓', '🚒'],
  food: ['🍕', '🍔', '🍩', '🍟', '🌭', '🥐', '🍿', '🍰', '🧀', '🥪', '🍙', '🌮'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '⛳', '🏒', '🎳'],
  nature: ['🌳', '🌸', '🌵', '🌻', '🍄', '⭐', '🌙', '☀️', '🔥', '💧', '🌈', '❄️'],
  faces: ['😀', '😅', '😍', '😎', '🤔', '😭', '😡', '😴', '🥳', '😱', '🤩', '😋'],
  objects: ['📖', '✏️', '🕐', '🎸', '💡', '🔑', '📷', '☎️', '🧲', '🔨', '🧸', '🎈'],
};

module.exports = {
  makeRng, pick, shuffle, sample,
  CATS, ANALOGY, WORD_THEMES, CROSSWORD_WORDS, EMOJIS, WORD_PAIRS, EMOJI_WORDS, EMOJI_GROUPS,
};
