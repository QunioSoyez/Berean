/**
 * Word Scramble content (hand-written; each word appears in or right around its KJV verse).
 *
 * Each row: [WORD, clue, 'BOOK chapter:verse']. Words are a single word, letters only
 * (A–Z, no spaces), and should be unique across both lists. The clue and reference are
 * shown while solving; "Read it" opens the verse after.
 * To add a word, add a row to OLD or NEW — nothing else needs changing.
 */
type Row = readonly [string, string, string];

const OLD: Row[] = [
  ['ADAM', 'The first man, who gave names to the animals', 'GEN 2:20'],
  ['EDEN', 'The garden where God put the man He had formed', 'GEN 2:8'],
  ['CAIN', 'Rose up against his brother Abel', 'GEN 4:8'],
  ['NOAH', 'Built the ark of gopher wood', 'GEN 6:14'],
  ['ARARAT', 'Mountains where the ark rested', 'GEN 8:4'],
  ['BABEL', 'Where the LORD confounded the language of all the earth', 'GEN 11:9'],
  ['ABRAHAM', 'Made a father of many nations', 'GEN 17:5'],
  ['SARAH', 'Bore a son to Abraham in his old age', 'GEN 21:2'],
  ['ISAAC', 'The son born to Abraham when he was a hundred years old', 'GEN 21:5'],
  ['JACOB', 'Wrestled until the breaking of the day', 'GEN 32:24'],
  ['ISRAEL', 'The new name given to Jacob', 'GEN 32:28'],
  ['JOSEPH', 'Given a coat of many colours', 'GEN 37:3'],
  ['EGYPT', 'Land where Joseph was set over all the land', 'GEN 41:41'],
  ['MOSES', 'Named because he was drawn out of the water', 'EXO 2:10'],
  ['MIRIAM', 'Sister of Aaron who took a timbrel in her hand', 'EXO 15:20'],
  ['MANNA', 'Bread from heaven, like coriander seed', 'EXO 16:31'],
  ['SINAI', 'The mount where the LORD came down', 'EXO 19:20'],
  ['AARON', 'Moses’ brother, set apart to minister as priest', 'EXO 28:1'],
  ['CALEB', 'Spy who followed the LORD fully', 'NUM 14:24'],
  ['JOSHUA', 'Led Israel over the Jordan after Moses died', 'JOS 1:2'],
  ['RAHAB', 'Hid the spies with stalks of flax on her roof', 'JOS 2:6'],
  ['JERICHO', 'City shut up because of the children of Israel', 'JOS 6:1'],
  ['GIDEON', 'Asked God for a sign with a fleece of wool', 'JDG 6:37'],
  ['DELILAH', 'Called for a man to shave off Samson’s seven locks', 'JDG 16:19'],
  ['SAMSON', 'Pulled down the pillars of the house', 'JDG 16:29'],
  ['RUTH', 'Said, “Whither thou goest, I will go”', 'RUT 1:16'],
  ['BOAZ', 'Took Ruth to be his wife', 'RUT 4:13'],
  ['HANNAH', 'Prayed for a son, then named him Samuel', '1SA 1:20'],
  ['SAMUEL', 'Answered, “Speak; for thy servant heareth”', '1SA 3:10'],
  ['DAVID', 'The shepherd boy anointed among his brethren', '1SA 16:13'],
  ['GOLIATH', 'The champion of Gath', '1SA 17:4'],
  ['JONATHAN', 'Loved David as his own soul', '1SA 18:1'],
  ['SOLOMON', 'Asked God for an understanding heart', '1KI 3:9'],
  ['ELIJAH', 'Went up by a whirlwind into heaven', '2KI 2:11'],
  ['ELISHA', 'Asked for a double portion of Elijah’s spirit', '2KI 2:9'],
  ['NAAMAN', 'Captain who dipped seven times in the Jordan', '2KI 5:14'],
  ['ESTHER', 'Queen who said, “If I perish, I perish”', 'EST 4:16'],
  ['JOB', 'A man in the land of Uz, perfect and upright', 'JOB 1:1'],
  ['DANIEL', 'Kept safe in the den of lions', 'DAN 6:23'],
  ['JONAH', 'Three days and three nights in the belly of the fish', 'JON 1:17'],
  ['NINEVEH', 'Great city whose people believed God', 'JON 3:5'],
];

const NEW: Row[] = [
  ['MARY', 'Of her was born Jesus, who is called Christ', 'MAT 1:16'],
  ['GABRIEL', 'The angel sent to a city of Galilee named Nazareth', 'LUK 1:26'],
  ['BETHLEHEM', 'Town in Judaea where Jesus was born', 'MAT 2:1'],
  ['MANGER', 'Where the baby was laid, for there was no room in the inn', 'LUK 2:7'],
  ['HEROD', 'King who sought the young child to destroy him', 'MAT 2:13'],
  ['NAZARETH', 'Town where Jesus’ family came to dwell', 'MAT 2:23'],
  ['GALILEE', 'Sea where Jesus called two brothers casting a net', 'MAT 4:18'],
  ['ANDREW', 'Simon Peter’s brother', 'MAT 4:18'],
  ['MATTHEW', 'Called while sitting at the receipt of custom', 'MAT 9:9'],
  ['PARABLE', 'Jesus spake many things unto them in these', 'MAT 13:3'],
  ['MUSTARD', 'The kingdom is like a grain of this seed', 'MAT 13:31'],
  ['PETER', 'Came down out of the ship and walked on the water', 'MAT 14:29'],
  ['JUDAS', 'Betrayed Jesus with a kiss', 'MAT 26:49'],
  ['PILATE', 'Washed his hands before the multitude', 'MAT 27:24'],
  ['BARABBAS', 'Released instead of Jesus', 'MAT 27:26'],
  ['CROSS', 'Simon of Cyrene was compelled to bear it', 'MAT 27:32'],
  ['GOLGOTHA', 'A place of a skull', 'MAT 27:33'],
  ['SEPULCHRE', 'Hewn out in the rock, where Jesus’ body was laid', 'MAT 27:60'],
  ['CANA', 'Where the water was made wine', 'JHN 2:11'],
  ['NICODEMUS', 'Came to Jesus by night', 'JHN 3:2'],
  ['LIGHT', '“I am the ___ of the world”', 'JHN 8:12'],
  ['SHEPHERD', '“I am the good ___”', 'JHN 10:11'],
  ['LAZARUS', 'Came forth, bound hand and foot with graveclothes', 'JHN 11:44'],
  ['VINE', '“I am the true ___”', 'JHN 15:1'],
  ['THOMAS', 'Wanted to see the print of the nails', 'JHN 20:25'],
  ['SAMARITAN', 'Had compassion on the man who fell among thieves', 'LUK 10:33'],
  ['MARTHA', 'Cumbered about much serving', 'LUK 10:40'],
  ['ZACCHEUS', 'Chief among the publicans, and he was rich (KJV spelling)', 'LUK 19:2'],
  ['EMMAUS', 'Village about threescore furlongs from Jerusalem', 'LUK 24:13'],
  ['PENTECOST', 'The day they were all with one accord in one place', 'ACT 2:1'],
  ['BARNABAS', 'Name meaning “the son of consolation”', 'ACT 4:36'],
  ['STEPHEN', 'Called upon God, saying, “Lord Jesus, receive my spirit”', 'ACT 7:59'],
  ['DAMASCUS', 'Saul was near this city when a light shone from heaven', 'ACT 9:3'],
  ['PAUL', 'Saul’s other name', 'ACT 13:9'],
  ['LYDIA', 'A seller of purple, whose heart the Lord opened', 'ACT 16:14'],
  ['SILAS', 'Prayed and sang praises with Paul at midnight', 'ACT 16:25'],
  ['BEREA', 'Its people searched the scriptures daily', 'ACT 17:10'],
  ['GOSPEL', '“I am not ashamed of the ___ of Christ”', 'ROM 1:16'],
  ['CHARITY', 'The greatest of faith, hope and …', '1CO 13:13'],
  ['GRACE', '“By ___ are ye saved through faith”', 'EPH 2:8'],
  ['TIMOTHY', 'Paul’s own son in the faith', '1TI 1:2'],
  ['FAITH', 'The substance of things hoped for', 'HEB 11:1'],
  ['PATMOS', 'Isle where John was for the word of God', 'REV 1:9'],
  ['ALPHA', '“I am ___ and Omega”', 'REV 1:8'],
];

export type Testament = 'OT' | 'NT';

export type ScrambleWord = {
  id: string;
  testament: Testament;
  word: string;
  clue: string;
  book: string;
  chapter: number;
  verse: number;
};

function toWords(rows: Row[], testament: Testament): ScrambleWord[] {
  return rows.map(([word, clue, ref], i) => {
    const [book, cv] = ref.split(' ');
    const [chapter, verse] = cv.split(':').map(Number);
    return { id: `${testament}${i}`, testament, word, clue, book, chapter, verse };
  });
}

export const SCRAMBLE_WORDS: readonly ScrambleWord[] = [
  ...toWords(OLD, 'OT'),
  ...toWords(NEW, 'NT'),
];
