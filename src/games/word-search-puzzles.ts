/**
 * Word Search themes (hand-written; every word appears in the KJV within the theme's range).
 *
 * Each theme has 8 words, letters only (A–Z), at most 10 letters (the grid is 10×10).
 * `read` is the chapter the "Read the story" link opens (USFM book id + chapter).
 * The grid is generated fresh each time, so the same theme plays differently.
 * To add a theme, add an entry to OLD or NEW — nothing else needs changing.
 */
export type Testament = 'OT' | 'NT';

export type SearchTheme = {
  id: string;
  testament: Testament;
  title: string;
  range: string;
  book: string;
  chapter: number;
  words: readonly string[];
};

type Entry = { title: string; range: string; read: string; words: string[] };

const OLD: Entry[] = [
  {
    title: 'The Creation',
    range: 'Genesis 1',
    read: 'GEN 1',
    words: ['LIGHT', 'DARKNESS', 'HEAVEN', 'EARTH', 'WATERS', 'GRASS', 'STARS', 'WHALES'],
  },
  {
    title: 'Noah and the Flood',
    range: 'Genesis 6–8',
    read: 'GEN 6',
    words: ['NOAH', 'ARK', 'GOPHER', 'FLOOD', 'RAVEN', 'DOVE', 'OLIVE', 'ARARAT'],
  },
  {
    title: 'Out of Egypt',
    range: 'Exodus 14–16',
    read: 'EXO 14',
    words: ['MOSES', 'PHARAOH', 'EGYPT', 'SEA', 'CHARIOTS', 'CLOUD', 'MANNA', 'QUAILS'],
  },
  {
    title: 'The Fall of Jericho',
    range: 'Joshua 2–6',
    read: 'JOS 6',
    words: ['JOSHUA', 'JERICHO', 'RAHAB', 'SPIES', 'SCARLET', 'TRUMPETS', 'SHOUT', 'WALL'],
  },
  {
    title: 'Ruth and Naomi',
    range: 'Ruth 1–4',
    read: 'RUT 1',
    words: ['RUTH', 'NAOMI', 'BOAZ', 'MOAB', 'BARLEY', 'GLEAN', 'KINSMAN', 'OBED'],
  },
  {
    title: 'David and Goliath',
    range: '1 Samuel 17',
    read: '1SA 17',
    words: ['DAVID', 'GOLIATH', 'SAUL', 'SLING', 'STONES', 'BROOK', 'ARMOUR', 'SHIELD'],
  },
  {
    title: 'Elijah the Prophet',
    range: '1 Kings 17–18',
    read: '1KI 17',
    words: ['ELIJAH', 'RAVENS', 'WIDOW', 'CARMEL', 'BAAL', 'ALTAR', 'FIRE', 'RAIN'],
  },
  {
    title: 'Daniel and the Lions',
    range: 'Daniel 6',
    read: 'DAN 6',
    words: ['DANIEL', 'DARIUS', 'LIONS', 'DEN', 'DECREE', 'PRAYED', 'ANGEL', 'WINDOWS'],
  },
  {
    title: 'Jonah',
    range: 'Jonah 1–4',
    read: 'JON 1',
    words: ['JONAH', 'NINEVEH', 'TARSHISH', 'SHIP', 'TEMPEST', 'FISH', 'GOURD', 'WORM'],
  },
  {
    title: 'Queen Esther',
    range: 'Esther 1–9',
    read: 'EST 2',
    words: ['ESTHER', 'MORDECAI', 'HAMAN', 'VASHTI', 'SCEPTRE', 'GALLOWS', 'BANQUET', 'PURIM'],
  },
];

const NEW: Entry[] = [
  {
    title: 'The Birth of Jesus',
    range: 'Luke 2',
    read: 'LUK 2',
    words: ['MARY', 'JOSEPH', 'BABE', 'MANGER', 'INN', 'SHEPHERDS', 'ANGEL', 'GLORY'],
  },
  {
    title: 'The Wise Men',
    range: 'Matthew 2',
    read: 'MAT 2',
    words: ['STAR', 'EAST', 'HEROD', 'GOLD', 'MYRRH', 'DREAM', 'EGYPT', 'BETHLEHEM'],
  },
  {
    title: 'The Twelve',
    range: 'Matthew 10',
    read: 'MAT 10',
    words: ['PETER', 'ANDREW', 'JAMES', 'JOHN', 'PHILIP', 'THOMAS', 'MATTHEW', 'JUDAS'],
  },
  {
    title: 'Loaves and the Storm',
    range: 'Matthew 14',
    read: 'MAT 14',
    words: ['LOAVES', 'FISHES', 'BASKETS', 'MULTITUDE', 'SHIP', 'WIND', 'PETER', 'WATER'],
  },
  {
    title: 'The Cross and the Tomb',
    range: 'Matthew 27–28',
    read: 'MAT 27',
    words: ['PILATE', 'CROSS', 'GOLGOTHA', 'THORNS', 'VINEGAR', 'SEPULCHRE', 'STONE', 'RISEN'],
  },
  {
    title: 'The Day of Pentecost',
    range: 'Acts 2',
    read: 'ACT 2',
    words: ['PENTECOST', 'WIND', 'FIRE', 'TONGUES', 'SPIRIT', 'PETER', 'REPENT', 'BAPTIZED'],
  },
  {
    title: 'Paul’s Shipwreck',
    range: 'Acts 27–28',
    read: 'ACT 27',
    words: ['PAUL', 'ITALY', 'TEMPEST', 'ANCHORS', 'ISLAND', 'MELITA', 'VIPER', 'FIRE'],
  },
  {
    title: 'The Fruit of the Spirit',
    range: 'Galatians 5',
    read: 'GAL 5',
    words: ['LOVE', 'JOY', 'PEACE', 'GENTLENESS', 'GOODNESS', 'FAITH', 'MEEKNESS', 'TEMPERANCE'],
  },
];

function toThemes(entries: Entry[], testament: Testament): SearchTheme[] {
  return entries.map((e, i) => {
    const [book, chapter] = e.read.split(' ');
    return {
      id: `${testament}${i}`,
      testament,
      title: e.title,
      range: e.range,
      book,
      chapter: Number(chapter),
      words: e.words,
    };
  });
}

export const SEARCH_THEMES: readonly SearchTheme[] = [...toThemes(OLD, 'OT'), ...toThemes(NEW, 'NT')];
