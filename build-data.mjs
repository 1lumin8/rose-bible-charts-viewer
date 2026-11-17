import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const pdf = "/Users/esther/Desktop/Books/Christian Reference Books/coll. - Rose Book of Bible Charts, Maps, and Time Lines-Rose Publishing (2015).pdf";
const pdftotext = "/Users/esther/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftotext";
const pdfinfo = "/Users/esther/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdfinfo";
const textFile = "/private/tmp/rose-bible-charts-text.txt";

execFileSync(pdftotext, ["-enc", "UTF-8", pdf, textFile]);
const pages = readFileSync(textFile, "utf8").split("\f").slice(0, 250);
const info = execFileSync(pdfinfo, ["-f", "1", "-l", "250", pdf], { encoding: "utf8" });
const sizes = [...info.matchAll(/Page\s+\d+ size:\s+([\d.]+) x ([\d.]+) pts/g)].map((match) => ({
  width: Number(match[1]),
  height: Number(match[2]),
}));

const groups = [
  ["Bible Overview", [["Bible Overview",6],["How We Got the Bible",18],["100 Key People in the Bible",28],["100 Prayers in the Bible",31],["Weights, Measures, and Money in the Bible",34],["Names of God",36],["52 Key Bible Stories",40],["100 Proofs for the Bible",48],["Christian History Time Line",60]]],
  ["Old Testament", [["100 Old Testament Events",74],["Creation",77],["Noah's Ark",78],["Twelve Tribes of Israel",80],["The Exodus",88],["Tabernacle",90],["Ark of the Covenant",98],["The Ten Commandments",100],["The Judges",101],["Feasts of the Bible",102],["Kings and Prophets",107],["Solomon's Temple",112],["Psalm 23",116],["Statue in the Book of Daniel",118]]],
  ["New Testament", [["Genealogy of Jesus",126],["100 Prophecies Fulfilled by Jesus",129],["Events in the Life of Jesus",135],["Miracles of Jesus",136],["Parables of Jesus",137],["The Beatitudes",138],["The Twelve Disciples",139],["The Lord's Prayer",145],["Herod's Temple",146],["Palm Sunday to Easter",150],["Jesus' Hours on the Cross",152],["Evidence for the Resurrection",153],["100 Events from Acts to Revelation",155],["Armor of God",158],["The Love Chapter: 1 Corinthians 13",159],["Fruit of the Spirit",160],["Heroes of the Faith: Hebrews 11",162],["The Seven Churches of Revelation",163],["Four Views of the End Times",166],["Biblical Descriptions of Heaven and Hell",170]]],
  ["Maps", [["Middle East and Central Asia: 10-40 Window",172],["Middle East: Then and Now",174],["Holy Land: Then and Now",176],["Holy Land: United Kingdom",178],["Holy Land: Divided Kingdom",179],["Assyrian Empire",180],["Babylonian and Persian Empires",182],["Middle East: Fascinating Facts and Figures",183],["Where Jesus Walked: Then and Now",184],["World of the First Christians: Then and Now",186],["Paul's Journeys",188]]],
  ["Christianity, Cults, and Religions", [["Christianity, Cults, and Religions",192],["Denominations Comparison",200],["Essential Doctrines",207],["The Trinity",213],["Islam and Christianity",218]]],
  ["Indexes", [["Map Index",224],["Subject Index",226]]],
];

const toc = groups.map(([label, items]) => ({
  label,
  wide: items.length > 10,
  items: items.map(([title, printedPage]) => [title, printedPage + 9, printedPage]),
}));

const search = pages.map((text, index) => ({
  page: index + 1,
  text: text.replace(/\s+/g, " ").trim(),
}));

writeFileSync("page-data.js", [
  `window.PAGE_SIZES = ${JSON.stringify(sizes)};`,
  `window.PDF_TOC = ${JSON.stringify(toc)};`,
  `window.SEARCH_INDEX = ${JSON.stringify(search)};`,
  "",
].join("\n"));
