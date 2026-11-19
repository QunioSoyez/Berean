/**
 * Bible story quiz question bank (hand-written; answers checked against the KJV).
 *
 * Each row: [question, correct answer, wrong 1, wrong 2, wrong 3, 'BOOK chapter:verse'].
 * BOOK is the USFM id used everywhere else in the app (GEN … REV). The reference is shown
 * after answering with a "Read it" link, so point it at the verse that settles the answer.
 * Options are shuffled when shown, so the correct answer always goes second here.
 * To add questions, add rows to OLD or NEW — nothing else needs changing.
 */
type Row = readonly [string, string, string, string, string, string];

const OLD: Row[] = [
  ['What did God create on the first day?', 'Light', 'The sun and moon', 'Dry land', 'The animals', 'GEN 1:3'],
  ['Who was the first person to commit murder?', 'Cain', 'Abel', 'Lamech', 'Seth', 'GEN 4:8'],
  ['Who lived 969 years, the oldest age recorded in the Bible?', 'Methuselah', 'Adam', 'Noah', 'Enoch', 'GEN 5:27'],
  ['Who built the ark?', 'Noah', 'Abraham', 'Moses', 'Enoch', 'GEN 6:14'],
  ['How many days and nights did it rain during the flood?', '40', '7', '12', '100', 'GEN 7:12'],
  ['What sign did God give of His promise never again to flood the earth?', 'A rainbow', 'A dove', 'An olive branch', 'A star', 'GEN 9:13'],
  ['At which tower did God confuse the languages of the people?', 'Babel', 'Jericho', 'Shinar', 'Ur', 'GEN 11:9'],
  ['What was Abraham’s wife’s name after God changed it?', 'Sarah', 'Rebekah', 'Hagar', 'Rachel', 'GEN 17:15'],
  ['Whose wife looked back and became a pillar of salt?', 'Lot’s', 'Abraham’s', 'Isaac’s', 'Laban’s', 'GEN 19:26'],
  ['Which son was Abraham told to offer in the land of Moriah?', 'Isaac', 'Ishmael', 'Jacob', 'Esau', 'GEN 22:2'],
  ['Who sold his birthright to his brother for a meal?', 'Esau', 'Jacob', 'Reuben', 'Ishmael', 'GEN 25:33'],
  ['What new name did God give Jacob?', 'Israel', 'Judah', 'Abraham', 'Joseph', 'GEN 32:28'],
  ['Who gave Joseph a coat of many colours?', 'His father, Jacob', 'His mother, Rachel', 'Pharaoh', 'His brother Reuben', 'GEN 37:3'],
  ['Joseph’s brothers sold him to which traders?', 'Ishmaelites', 'Egyptians', 'Philistines', 'Amorites', 'GEN 37:28'],
  ['Whose dreams did Joseph interpret, leading to his rise in Egypt?', 'Pharaoh’s', 'Potiphar’s', 'Nebuchadnezzar’s', 'Laban’s', 'GEN 41:15'],
  ['Who found baby Moses in an ark of bulrushes by the river?', 'Pharaoh’s daughter', 'Moses’ sister', 'Pharaoh’s wife', 'A shepherd', 'EXO 2:5'],
  ['From what did God speak to Moses in the wilderness?', 'A burning bush', 'A whirlwind', 'A pillar of salt', 'A cloud on the sea', 'EXO 3:2'],
  ['What was the last plague on Egypt?', 'The death of the firstborn', 'Darkness', 'Locusts', 'Hail', 'EXO 12:29'],
  ['In which sea did Pharaoh’s army drown?', 'The Red Sea', 'The Dead Sea', 'The Sea of Galilee', 'The Great Sea', 'EXO 15:4'],
  ['What food did God send from heaven to feed Israel in the wilderness?', 'Manna', 'Barley loaves', 'Figs', 'Locusts and honey', 'EXO 16:31'],
  ['On which mountain did God come down to give Moses the law?', 'Sinai', 'Carmel', 'Zion', 'Ararat', 'EXO 19:20'],
  ['What idol did Israel make while Moses was on the mountain?', 'A golden calf', 'A brass serpent', 'A statue of Baal', 'A silver bull', 'EXO 32:4'],
  ['Who was Moses’ brother, chosen to serve as priest?', 'Aaron', 'Joshua', 'Caleb', 'Levi', 'EXO 28:1'],
  ['How many years did Israel wander in the wilderness?', '40', '7', '12', '70', 'NUM 14:33'],
  ['Whose donkey (ass) spoke to him?', 'Balaam’s', 'Balak’s', 'Gideon’s', 'Saul’s', 'NUM 22:28'],
  ['Who led Israel into the promised land after Moses died?', 'Joshua', 'Caleb', 'Aaron', 'Gideon', 'JOS 1:2'],
  ['Who hid the two Israelite spies in Jericho?', 'Rahab', 'Deborah', 'Ruth', 'Jael', 'JOS 2:4'],
  ['Which city’s walls fell down after Israel marched around it?', 'Jericho', 'Ai', 'Jerusalem', 'Gaza', 'JOS 6:20'],
  ['With how many men did Gideon defeat the Midianites?', '300', '12', '1,000', '10,000', 'JDG 7:7'],
  ['Whose great strength was tied to never cutting his hair?', 'Samson', 'Gideon', 'Samuel', 'Absalom', 'JDG 16:17'],
  ['Who betrayed Samson to the Philistines?', 'Delilah', 'Jezebel', 'Michal', 'Bathsheba', 'JDG 16:18'],
  ['Who was Ruth’s mother-in-law?', 'Naomi', 'Orpah', 'Hannah', 'Leah', 'RUT 1:22'],
  ['Whom did Ruth marry in Bethlehem?', 'Boaz', 'Obed', 'Jesse', 'Elimelech', 'RUT 4:13'],
  ['Which woman prayed for a son and named him Samuel?', 'Hannah', 'Sarah', 'Elisabeth', 'Rachel', '1SA 1:20'],
  ['Who heard God calling his name at night as a boy?', 'Samuel', 'David', 'Eli', 'Solomon', '1SA 3:10'],
  ['Who was the first king of Israel?', 'Saul', 'David', 'Samuel', 'Solomon', '1SA 10:1'],
  ['What did David use to defeat Goliath?', 'A sling and a stone', 'A sword', 'A spear', 'A bow and arrow', '1SA 17:49'],
  ['Which son of King Saul was David’s closest friend?', 'Jonathan', 'Absalom', 'Ishbosheth', 'Abner', '1SA 18:1'],
  ['Which prophet confronted David about his sin with Bathsheba?', 'Nathan', 'Samuel', 'Elijah', 'Gad', '2SA 12:7'],
  ['Which king asked God for an understanding heart?', 'Solomon', 'David', 'Saul', 'Hezekiah', '1KI 3:9'],
  ['Who was King Ahab’s wicked wife?', 'Jezebel', 'Athaliah', 'Delilah', 'Vashti', '1KI 16:31'],
  ['What creatures brought food to Elijah by the brook?', 'Ravens', 'Doves', 'Eagles', 'Angels', '1KI 17:6'],
  ['On which mountain did Elijah call down fire from heaven?', 'Carmel', 'Sinai', 'Horeb', 'Olivet', '1KI 18:38'],
  ['How was Elijah taken up into heaven?', 'By a whirlwind', 'In his sleep', 'On a cloud', 'From a mountaintop', '2KI 2:11'],
  ['Who took Elijah’s place as prophet?', 'Elisha', 'Isaiah', 'Jonah', 'Gehazi', '1KI 19:16'],
  ['How many times did Naaman dip in the Jordan to be healed of leprosy?', 'Seven', 'Three', 'Twelve', 'Once', '2KI 5:14'],
  ['Who led the rebuilding of Jerusalem’s walls?', 'Nehemiah', 'Ezra', 'Zerubbabel', 'Daniel', 'NEH 2:17'],
  ['Who raised Esther after her parents died?', 'Her cousin Mordecai', 'Haman', 'King Ahasuerus', 'The scribe Ezra', 'EST 2:7'],
  ['Which queen risked her life to save the Jews from Haman’s plot?', 'Esther', 'Vashti', 'The queen of Sheba', 'Jezebel', 'EST 7:3'],
  ['Who was the man from the land of Uz who lost everything but stayed faithful?', 'Job', 'Jonah', 'Hosea', 'Lot', 'JOB 1:1'],
  ['Which Psalm begins “The LORD is my shepherd”?', 'Psalm 23', 'Psalm 1', 'Psalm 91', 'Psalm 119', 'PSA 23:1'],
  ['Which three men were thrown into the fiery furnace?', 'Shadrach, Meshach and Abednego', 'Daniel, Ezra and Nehemiah', 'Peter, James and John', 'Shem, Ham and Japheth', 'DAN 3:20'],
  ['Which king saw a hand writing on the wall at his feast?', 'Belshazzar', 'Nebuchadnezzar', 'Darius', 'Cyrus', 'DAN 5:5'],
  ['Who was thrown into the den of lions?', 'Daniel', 'Jeremiah', 'Joseph', 'Elijah', 'DAN 6:16'],
  ['Which prophet saw a valley full of dry bones come to life?', 'Ezekiel', 'Isaiah', 'Jeremiah', 'Daniel', 'EZK 37:1'],
  ['To which city did God send Jonah?', 'Nineveh', 'Babylon', 'Tarshish', 'Damascus', 'JON 1:2'],
  ['How long was Jonah inside the great fish?', 'Three days and three nights', 'One day', 'Seven days', 'Forty days', 'JON 1:17'],
];

const NEW: Row[] = [
  ['In which town was Jesus born?', 'Bethlehem', 'Nazareth', 'Jerusalem', 'Capernaum', 'MAT 2:1'],
  ['What did the wise men follow to find Jesus?', 'A star', 'An angel', 'A shepherd', 'A pillar of cloud', 'MAT 2:2'],
  ['What gifts did the wise men bring?', 'Gold, frankincense and myrrh', 'Gold, silver and brass', 'Oil, wine and bread', 'Spices, linen and incense', 'MAT 2:11'],
  ['Which king ordered the killing of the young children in Bethlehem?', 'Herod', 'Pilate', 'Caesar Augustus', 'Agrippa', 'MAT 2:16'],
  ['In which river was Jesus baptized?', 'The Jordan', 'The Nile', 'The Euphrates', 'The Tigris', 'MAT 3:13'],
  ['How many days did Jesus fast in the wilderness?', '40', '3', '7', '12', 'MAT 4:2'],
  ['Who was Simon Peter’s brother?', 'Andrew', 'James', 'John', 'Philip', 'MAT 4:18'],
  ['Which disciple was sitting at the receipt of custom when Jesus called him?', 'Matthew', 'Zacchaeus', 'Thomas', 'Bartholomew', 'MAT 9:9'],
  ['How many apostles did Jesus choose?', 'Twelve', 'Seven', 'Ten', 'Seventy', 'MAT 10:2'],
  ['Jesus compared the kingdom of heaven to which tiny seed?', 'A grain of mustard seed', 'A grain of wheat', 'A fig seed', 'A barley seed', 'MAT 13:31'],
  ['The people of Nazareth called Jesus the son of a…?', 'Carpenter', 'Fisherman', 'Shepherd', 'Tentmaker', 'MAT 13:55'],
  ['How many loaves did the disciples have before Jesus fed the 5,000?', 'Five', 'Two', 'Seven', 'Twelve', 'MAT 14:17'],
  ['Which disciple walked on the water toward Jesus?', 'Peter', 'John', 'Andrew', 'Thomas', 'MAT 14:29'],
  ['Which disciple betrayed Jesus?', 'Judas Iscariot', 'Peter', 'Thomas', 'Simon the Canaanite', 'MAT 26:14'],
  ['For how many pieces of silver was Jesus betrayed?', 'Thirty', 'Ten', 'Twenty', 'Forty', 'MAT 26:15'],
  ['Who was the high priest at Jesus’ trial?', 'Caiaphas', 'Gamaliel', 'Nicodemus', 'Ananias', 'MAT 26:57'],
  ['Which disciple denied knowing Jesus three times?', 'Peter', 'Judas', 'John', 'Matthew', 'MAT 26:75'],
  ['Who was the Roman governor when Jesus was crucified?', 'Pontius Pilate', 'Herod', 'Felix', 'Festus', 'MAT 27:2'],
  ['Which prisoner was released instead of Jesus?', 'Barabbas', 'Barnabas', 'Bartimaeus', 'Silas', 'MAT 27:26'],
  ['What was the place where Jesus was crucified called?', 'Golgotha', 'Gethsemane', 'Bethany', 'Emmaus', 'MAT 27:33'],
  ['Who asked Pilate for Jesus’ body and laid it in his own tomb?', 'Joseph of Arimathea', 'Nicodemus', 'Peter', 'John', 'MAT 27:57'],
  ['Which two brothers did Jesus call “the sons of thunder”?', 'James and John', 'Peter and Andrew', 'Philip and Bartholomew', 'Simon and Jude', 'MRK 3:17'],
  ['What did Jesus say to calm the storm?', '“Peace, be still”', '“Be not afraid”', '“It is finished”', '“Follow me”', 'MRK 4:39'],
  ['What was the name of the blind beggar Jesus healed near Jericho?', 'Bartimaeus', 'Lazarus', 'Zacchaeus', 'Jairus', 'MRK 10:46'],
  ['To whom did the risen Jesus appear first, according to Mark?', 'Mary Magdalene', 'Peter', 'His mother Mary', 'Thomas', 'MRK 16:9'],
  ['Which angel told Mary she would have a son?', 'Gabriel', 'Michael', 'Raphael', 'Uriel', 'LUK 1:26'],
  ['Where did Mary lay baby Jesus?', 'In a manger', 'In a cradle', 'In the temple', 'In a basket', 'LUK 2:7'],
  ['Which devout old man took baby Jesus in his arms in the temple?', 'Simeon', 'Zacharias', 'Eli', 'Nicodemus', 'LUK 2:28'],
  ['Where did Mary and Joseph find 12-year-old Jesus?', 'In the temple', 'At the Jordan River', 'In a carpenter’s shop', 'In Nazareth', 'LUK 2:46'],
  ['In the parable, who stopped to help the wounded traveller?', 'A Samaritan', 'A priest', 'A Levite', 'A Roman soldier', 'LUK 10:33'],
  ['In the parable of the prodigal son, what job did the son take in the far country?', 'Feeding swine', 'Herding sheep', 'Fishing', 'Building houses', 'LUK 15:15'],
  ['Which chief tax collector climbed a sycomore tree to see Jesus?', 'Zacchaeus', 'Matthew', 'Nicodemus', 'Bartimaeus', 'LUK 19:4'],
  ['Who was made to carry Jesus’ cross?', 'Simon of Cyrene', 'Simon Peter', 'Joseph of Arimathea', 'John', 'LUK 23:26'],
  ['Where did Jesus do His first miracle, turning water into wine?', 'Cana of Galilee', 'Capernaum', 'Bethany', 'Jerusalem', 'JHN 2:11'],
  ['Where is “For God so loved the world…” found?', 'John 3:16', 'Romans 8:28', 'Matthew 5:16', '1 John 4:8', 'JHN 3:16'],
  ['Jesus met a woman at a well. Where was she from?', 'Samaria', 'Galilee', 'Judea', 'Syria', 'JHN 4:7'],
  ['Jesus said, “I am the ___ of the world.”', 'Light', 'King', 'Bread', 'Shepherd', 'JHN 8:12'],
  ['Who were the sisters of Lazarus?', 'Mary and Martha', 'Mary and Elisabeth', 'Martha and Salome', 'Joanna and Susanna', 'JHN 11:1'],
  ['What is the shortest verse in the KJV?', '“Jesus wept.”', '“Rejoice evermore.”', '“Pray without ceasing.”', '“God is love.”', 'JHN 11:35'],
  ['Which disciple would not believe until he saw Jesus’ wounds?', 'Thomas', 'Peter', 'Philip', 'Nathanael', 'JHN 20:27'],
  ['For how many days did the risen Jesus appear to the apostles before His ascension?', '40', '3', '7', '50', 'ACT 1:3'],
  ['On which day did the Holy Spirit come upon the disciples?', 'Pentecost', 'Passover', 'The Feast of Tabernacles', 'The Day of Atonement', 'ACT 2:1'],
  ['Which couple was struck dead for lying about the price of their land?', 'Ananias and Sapphira', 'Aquila and Priscilla', 'Felix and Drusilla', 'Zacharias and Elisabeth', 'ACT 5:1'],
  ['Who was stoned to death while praying for his attackers?', 'Stephen', 'James', 'Paul', 'Barnabas', 'ACT 7:59'],
  ['Philip explained Isaiah to a traveller from which land?', 'Ethiopia', 'Egypt', 'Rome', 'Greece', 'ACT 8:27'],
  ['Saul was near which city when a light from heaven shone around him?', 'Damascus', 'Jerusalem', 'Antioch', 'Tarsus', 'ACT 9:3'],
  ['By what other name is Saul known?', 'Paul', 'Peter', 'Silas', 'Barnabas', 'ACT 13:9'],
  ['In which city’s prison did Paul and Silas sing praises at midnight?', 'Philippi', 'Rome', 'Ephesus', 'Corinth', 'ACT 16:25'],
  ['The Bereans were called noble because they did what?', 'Searched the scriptures daily', 'Gave all their money away', 'Built a great synagogue', 'Fasted for forty days', 'ACT 17:11'],
  ['Which young man fell from a window during Paul’s long sermon?', 'Eutychus', 'Timothy', 'Titus', 'Mark', 'ACT 20:9'],
  ['On which island was Paul shipwrecked?', 'Melita (Malta)', 'Crete', 'Cyprus', 'Patmos', 'ACT 28:1'],
  ['Which chapter is often called the “love chapter”?', '1 Corinthians 13', 'Romans 12', 'John 15', 'Galatians 5', '1CO 13:13'],
  ['What is the first fruit of the Spirit listed in Galatians?', 'Love', 'Joy', 'Peace', 'Faith', 'GAL 5:22'],
  ['Who is called “the beloved physician”?', 'Luke', 'Mark', 'Matthew', 'Titus', 'COL 4:14'],
  ['What was the name of Timothy’s grandmother?', 'Lois', 'Eunice', 'Lydia', 'Dorcas', '2TI 1:5'],
  ['Which chapter begins, “Now faith is the substance of things hoped for”?', 'Hebrews 11', 'Romans 5', 'James 2', '1 Corinthians 13', 'HEB 11:1'],
  ['On which island was John when he received the Revelation?', 'Patmos', 'Malta', 'Cyprus', 'Crete', 'REV 1:9'],
];

export type Testament = 'OT' | 'NT';

export type QuizQuestion = {
  id: string;
  testament: Testament;
  question: string;
  answer: string;
  wrong: readonly [string, string, string];
  book: string;
  chapter: number;
  verse: number;
};

function toQuestions(rows: Row[], testament: Testament): QuizQuestion[] {
  return rows.map(([question, answer, w1, w2, w3, ref], i) => {
    const [book, cv] = ref.split(' ');
    const [chapter, verse] = cv.split(':').map(Number);
    return { id: `${testament}${i}`, testament, question, answer, wrong: [w1, w2, w3], book, chapter, verse };
  });
}

export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  ...toQuestions(OLD, 'OT'),
  ...toQuestions(NEW, 'NT'),
];
