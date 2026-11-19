/**
 * Story Scramble content (hand-written; event order checked against the KJV).
 *
 * Each story lists its events in the CORRECT order — the game shuffles them.
 * `read` is the chapter the "Read the story" link opens (USFM book id + chapter);
 * `range` is the label shown under the title. Keep every event text unique within its story.
 * To add a story, add an entry to OLD or NEW — nothing else needs changing.
 */
export type Testament = 'OT' | 'NT';

export type Story = {
  id: string;
  testament: Testament;
  title: string;
  range: string;
  book: string;
  chapter: number;
  events: readonly string[];
};

type Entry = { title: string; range: string; read: string; events: string[] };

const OLD: Entry[] = [
  {
    title: 'The Creation',
    range: 'Genesis 1',
    read: 'GEN 1',
    events: [
      'God creates light and divides it from the darkness',
      'God makes the firmament and calls it Heaven',
      'Dry land appears, and grass, herbs and trees grow',
      'The sun, moon and stars are set in the sky',
      'Fish fill the waters and birds fly above the earth',
      'Land animals are made, then man in God’s image',
    ],
  },
  {
    title: 'Noah and the Flood',
    range: 'Genesis 6–9',
    read: 'GEN 6',
    events: [
      'God tells Noah to build an ark of gopher wood',
      'Noah, his family and the animals go into the ark',
      'Rain falls for forty days and forty nights',
      'The ark rests upon the mountains of Ararat',
      'A dove returns with an olive leaf in her mouth',
      'God sets His bow in the cloud as a covenant',
    ],
  },
  {
    title: 'Joseph and His Brothers',
    range: 'Genesis 37–45',
    read: 'GEN 37',
    events: [
      'Jacob gives Joseph a coat of many colours',
      'Joseph’s brothers sell him to the Ishmeelites',
      'In prison, Joseph interprets the butler’s and baker’s dreams',
      'Joseph interprets Pharaoh’s dreams and is made ruler over Egypt',
      'Joseph’s brothers come to Egypt to buy corn',
      'Joseph tells his brothers, “I am Joseph”',
    ],
  },
  {
    title: 'Moses and the Exodus',
    range: 'Exodus 2–20',
    read: 'EXO 2',
    events: [
      'Baby Moses is hidden in an ark of bulrushes',
      'Moses flees from Pharaoh to the land of Midian',
      'God speaks to Moses from a burning bush',
      'God sends plagues upon Egypt',
      'Israel crosses the Red Sea on dry ground',
      'God gives the Ten Commandments at Mount Sinai',
    ],
  },
  {
    title: 'The Fall of Jericho',
    range: 'Joshua 2–6',
    read: 'JOS 2',
    events: [
      'Rahab hides the two spies on her roof',
      'Israel crosses the Jordan on dry ground',
      'Israel marches around the city once a day for six days',
      'On the seventh day they march around it seven times',
      'The priests blow the trumpets and the people shout',
      'The wall falls down flat',
    ],
  },
  {
    title: 'Gideon’s Three Hundred',
    range: 'Judges 6–7',
    read: 'JDG 6',
    events: [
      'An angel of the LORD appears to Gideon by the winepress',
      'Gideon throws down the altar of Baal by night',
      'Gideon asks for a sign with a fleece of wool',
      'God cuts Gideon’s army down to three hundred men',
      'The men blow trumpets, break pitchers and hold up lamps',
      'The Midianite army runs and flees',
    ],
  },
  {
    title: 'Samson and Delilah',
    range: 'Judges 16',
    read: 'JDG 16',
    events: [
      'Delilah asks Samson where his great strength lies',
      'Samson is bound with seven green withs',
      'Samson is bound with new ropes',
      'Delilah weaves the seven locks of his head into the web',
      'Samson tells her all his heart and his head is shaved',
      'Samson pulls down the pillars of the house',
    ],
  },
  {
    title: 'Ruth and Naomi',
    range: 'Ruth 1–4',
    read: 'RUT 1',
    events: [
      'Naomi’s husband and two sons die in Moab',
      'Ruth says, “Whither thou goest, I will go”',
      'Naomi and Ruth come to Bethlehem at the barley harvest',
      'Ruth gleans in the field of Boaz',
      'Ruth lies at Boaz’s feet at the threshing floor',
      'Boaz marries Ruth and their son Obed is born',
    ],
  },
  {
    title: 'David and Goliath',
    range: '1 Samuel 17',
    read: '1SA 17',
    events: [
      'Goliath defies the armies of Israel for forty days',
      'David brings food to his brothers in the camp',
      'David tells Saul how he killed a lion and a bear',
      'David puts off Saul’s armour',
      'David chooses five smooth stones from the brook',
      'David’s stone sinks into Goliath’s forehead',
    ],
  },
  {
    title: 'Elijah on Mount Carmel',
    range: '1 Kings 18',
    read: '1KI 18',
    events: [
      'Elijah challenges the prophets of Baal on Mount Carmel',
      'The prophets of Baal call on Baal from morning until noon',
      'Elijah mocks them: “Cry aloud: for he is a god”',
      'Elijah has water poured over the altar three times',
      'The fire of the LORD falls and consumes the sacrifice',
      'A great rain ends the long drought',
    ],
  },
  {
    title: 'Jonah and the Great Fish',
    range: 'Jonah 1–3',
    read: 'JON 1',
    events: [
      'Jonah boards a ship to flee to Tarshish',
      'The LORD sends a great wind and a mighty tempest',
      'The sailors cast Jonah into the sea',
      'A great fish swallows Jonah',
      'The fish vomits Jonah out upon dry land',
      'Jonah preaches and the people of Nineveh repent',
    ],
  },
  {
    title: 'Daniel in the Lions’ Den',
    range: 'Daniel 6',
    read: 'DAN 6',
    events: [
      'The rulers persuade King Darius to sign a decree',
      'Daniel prays three times a day with his windows open',
      'Daniel is cast into the den of lions',
      'The king hurries to the den very early in the morning',
      'Daniel is taken up out of the den unhurt',
      'Daniel’s accusers are cast into the den',
    ],
  },
  {
    title: 'Queen Esther',
    range: 'Esther 1–7',
    read: 'EST 1',
    events: [
      'Queen Vashti refuses to come at the king’s command',
      'Esther is made queen instead of Vashti',
      'Mordecai uncovers a plot against the king',
      'Haman’s decree to destroy the Jews is sent out',
      'Esther goes in to the king, who holds out his golden sceptre',
      'Haman is hanged on the gallows he made for Mordecai',
    ],
  },
];

const NEW: Entry[] = [
  {
    title: 'The Birth of Jesus',
    range: 'Luke 1–2',
    read: 'LUK 1',
    events: [
      'The angel Gabriel is sent to Mary in Nazareth',
      'Joseph and Mary go to Bethlehem to be taxed',
      'Jesus is born and laid in a manger',
      'An angel appears to shepherds in the field',
      'The shepherds find the babe lying in a manger',
      'Simeon takes the child Jesus in his arms in the temple',
    ],
  },
  {
    title: 'The Wise Men',
    range: 'Matthew 2',
    read: 'MAT 2',
    events: [
      'Wise men come to Jerusalem asking for the King of the Jews',
      'Herod sends the wise men to Bethlehem',
      'The star stands over where the young child is',
      'The wise men offer gold, frankincense and myrrh',
      'The wise men are warned in a dream not to return to Herod',
      'Joseph takes the young child and His mother into Egypt',
    ],
  },
  {
    title: 'Baptism and Temptation',
    range: 'Matthew 3–4',
    read: 'MAT 3',
    events: [
      'John the Baptist preaches in the wilderness of Judaea',
      'Jesus is baptized and the Spirit descends like a dove',
      'Jesus fasts forty days and forty nights',
      'The tempter says to make stones into bread',
      'The devil sets Jesus on a pinnacle of the temple',
      'The devil shows Him all the kingdoms of the world',
    ],
  },
  {
    title: 'Loaves, Fishes and the Storm',
    range: 'Matthew 14',
    read: 'MAT 14',
    events: [
      'The disciples have only five loaves and two fishes',
      'Twelve baskets of fragments are taken up',
      'Jesus sends the disciples ahead by ship',
      'Jesus walks on the sea in the fourth watch of the night',
      'Peter walks on the water, then begins to sink',
      'The wind ceases when they come into the ship',
    ],
  },
  {
    title: 'The Raising of Lazarus',
    range: 'John 11',
    read: 'JHN 11',
    events: [
      'Mary and Martha send word that Lazarus is sick',
      'Jesus stays two days where He is',
      'Lazarus has been in the grave four days when Jesus comes',
      'Martha goes out to meet Jesus',
      'Jesus wept',
      'Jesus cries, “Lazarus, come forth”',
    ],
  },
  {
    title: 'The Last Supper and Betrayal',
    range: 'Matthew 26',
    read: 'MAT 26',
    events: [
      'Judas agrees to betray Jesus for thirty pieces of silver',
      'At supper, Jesus says one of them will betray Him',
      'Jesus takes bread and the cup and gives them to the disciples',
      'Jesus prays in Gethsemane while the disciples sleep',
      'Judas betrays Jesus with a kiss',
      'Peter denies Jesus three times',
    ],
  },
  {
    title: 'The Cross and the Empty Tomb',
    range: 'Matthew 27–28',
    read: 'MAT 27',
    events: [
      'Pilate releases Barabbas',
      'Simon of Cyrene is made to bear the cross',
      'Jesus is crucified at Golgotha',
      'Darkness covers the land from the sixth to the ninth hour',
      'Joseph of Arimathea lays the body in his new tomb',
      'An angel rolls back the stone from the door',
    ],
  },
  {
    title: 'The Prodigal Son',
    range: 'Luke 15',
    read: 'LUK 15',
    events: [
      'The younger son asks for his portion of goods',
      'He wastes his substance with riotous living',
      'In a mighty famine he is sent to feed swine',
      'He comes to himself and goes back to his father',
      'His father runs, falls on his neck and kisses him',
      'The elder brother is angry and will not go in',
    ],
  },
  {
    title: 'The Good Samaritan',
    range: 'Luke 10',
    read: 'LUK 10',
    events: [
      'A lawyer asks Jesus, “Who is my neighbour?”',
      'A man going to Jericho falls among thieves',
      'A priest passes by on the other side',
      'A Levite looks on him and passes by',
      'A Samaritan binds up his wounds and brings him to an inn',
      'The Samaritan gives the host two pence',
    ],
  },
  {
    title: 'Saul on the Road to Damascus',
    range: 'Acts 9',
    read: 'ACT 9',
    events: [
      'Saul sets out for Damascus to bind the disciples',
      'A light from heaven shines round about him',
      'Saul is three days without sight',
      'Ananias is sent to put his hands on Saul',
      'Scales fall from Saul’s eyes and he is baptized',
      'Saul preaches Christ in the synagogues',
    ],
  },
  {
    title: 'Paul’s Shipwreck',
    range: 'Acts 27–28',
    read: 'ACT 27',
    events: [
      'Paul sails for Italy as a prisoner',
      'A tempestuous wind called Euroclydon strikes the ship',
      'An angel tells Paul no life will be lost',
      'The ship runs aground and is broken by the waves',
      'A viper fastens on Paul’s hand on the island of Melita',
      'Paul heals the father of Publius',
    ],
  },
];

function toStories(entries: Entry[], testament: Testament): Story[] {
  return entries.map((e, i) => {
    const [book, chapter] = e.read.split(' ');
    return {
      id: `${testament}${i}`,
      testament,
      title: e.title,
      range: e.range,
      book,
      chapter: Number(chapter),
      events: e.events,
    };
  });
}

export const STORIES: readonly Story[] = [...toStories(OLD, 'OT'), ...toStories(NEW, 'NT')];
