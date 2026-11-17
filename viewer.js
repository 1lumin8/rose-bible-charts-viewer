const PAGE_COUNT = 250;
const sections = [
  { id: "front", label: "Opening & Foldouts", start: 1, end: 13, range: "Cover, Bible timeline, tabernacle, and contents" },
  { id: "bible-overview", label: "Bible Overview", start: 14, end: 81, range: "Book pages 5-72" },
  { id: "old-testament", label: "Old Testament", start: 82, end: 133, range: "Book pages 73-124" },
  { id: "new-testament", label: "New Testament", start: 134, end: 179, range: "Book pages 125-170" },
  { id: "maps", label: "Maps", start: 180, end: 199, range: "Book pages 171-190" },
  { id: "religions", label: "Christianity, Cults & Religions", start: 200, end: 232, range: "Book pages 191-223" },
  { id: "indexes", label: "Indexes", start: 233, end: 250, range: "Map and subject indexes" },
];

const HIDDEN_BOOK_PAGES = new Set();
const tocGroupsFallback = [
  {
    label: "Getting Started",
    items: [["Books of the Bible", 8], ["The Covenants of the Bible", 10]],
  },
  {
    label: "Old Testament",
    wide: true,
    items: [
      ["The Old Testament",14],["Adam and Eve",16],["Tree of Knowledge",18],["Cain and Abel",20],["Noah",22],["The Flood and the Rainbow",24],["The Tower of Babel",26],["Abraham",28],["Lot",30],["Sarah",32],["Ishmael",33],["Abraham’s Test",34],["Rebekah",36],["Isaac",37],["Jacob",38],["Jacob’s Flight",40],["Leah and Rachel",42],["Esau",44],["Joseph",46],["Joseph in Egypt",48],["Moses",50],["The Plagues and the Exodus",52],["Food in the Desert",54],["The Ten Commandments",55],["Aaron",56],["Miriam",58],["Balaam",59],["Joshua",60],["The Battle of Ai",62],["Deborah and Barak",64],["Gideon",66],["Samson",68],["Delilah",70],["Naomi and Ruth",72],["Eli",74],["Samuel",76],["Saul",78],["David",80],["David and Goliath",82],["Jonathan",84],["Bathsheba",86],["Absalom",87],["Nathan",88],["Solomon",89],["Solomon’s Temple",90],["The Queen of Sheba",92],["Rehoboam",94],["Jeroboam",95],["Ahab and Jezebel",96],["Elijah",98],["Elisha",100],["Jonah",102],["Ahaz",104],["Isaiah and Hezekiah",105],["Josiah",106],["Jeremiah",107],["Ezekiel",108],["Nebuchadnezzar",109],["Daniel",110],["Daniel in the Lions’ Den",112],["Esther",114],["Job",115],["Nehemiah",116],["Ezra",117],
    ],
  },
  {
    label: "New Testament",
    wide: true,
    items: [
      ["The New Testament",120],["Zechariah",122],["Elizabeth",123],["Mary",124],["Joseph",125],["Jesus is Born",126],["The Shepherds and the Angels",128],["Herod the Great",130],["John the Baptist",132],["The Dove and the Devil",134],["The Disciples",136],["Simon (Peter) and Andrew",138],["James and John",140],["Matthew (Levi)",141],["The Transfiguration",142],["The Sermon on the Mount",144],["Miracles",146],["Parables",148],["Herod Antipas and Salome",150],["Zacchaeus",152],["Lazarus",154],["Jesus Enters Jerusalem",156],["The Money Changers in the Temple",157],["The Last Supper",158],["Judas Iscariot",160],["Jesus is Tried, Peter Denies",162],["Pontius Pilate",164],["Jesus is Crucified",166],["Joseph of Arimathea",168],["Nicodemus",169],["Jesus is Risen",170],["Mary Magdalene",172],["Thomas",174],["The Ascension",176],["Pentecost",177],["Stephen",178],["Philip the Evangelist",180],["Paul",182],["Herod Agrippa I",184],["Cornelius",186],["James",187],["Paul’s Journeys",188],["Barnabas",190],["Silas",191],["Aquila and Priscilla",192],["Apollos",193],["Luke",194],["John Mark",195],
    ],
  },
  {
    label: "Reference",
    items: [["Reference",196],["Lands of the Bible",198],["More Bible Characters",200],["Glossary",204],["Index",206],["Acknowledgments",208]],
  },
];

const tocGroups = window.PDF_TOC || tocGroupsFallback;
const grid = document.querySelector("#pageGrid");
const tocPanel = document.querySelector("#tocPanel");
const tableOfContents = document.querySelector("#tableOfContents");
const pageSize = document.querySelector("#pageSize");
const searchInput = document.querySelector("#searchInput");
const searchStatus = document.querySelector("#searchStatus");
const searchResults = document.querySelector("#searchResults");
const scrollTopButton = document.querySelector("#scrollTop");
const viewer = document.querySelector("#viewer");
const pane = document.querySelector("#viewerPane");
const viewerImage = document.querySelector("#viewerImage");
const zoomLabel = document.querySelector("#zoomLabel");
const prevButton = document.querySelector("#prevPage");
const nextButton = document.querySelector("#nextPage");

let activePage = 0;
let fitWidth = 700;
let zoom = 1;
let dragging = false;
let dragStart = null;
let searchTimer = null;

const pagePath = (page) => `assets/pages/page-${String(page).padStart(3, "0")}.jpg`;
const pageText = (page) => window.SEARCH_INDEX?.[page - 1]?.text || "";
const pageLabel = (page) => page === 1 ? "Cover" : page >= 14 ? `Book page ${page - 9}` : `Opening page ${page}`;
const isVisiblePage = (page) => page >= 1 && page <= PAGE_COUNT && !HIDDEN_BOOK_PAGES.has(page);

function adjacentPage(page, direction) {
  let candidate = page + direction;
  while (candidate >= 1 && candidate <= PAGE_COUNT && !isVisiblePage(candidate)) candidate += direction;
  return candidate >= 1 && candidate <= PAGE_COUNT ? candidate : null;
}

function buildViewer() {
  const gridFragment = document.createDocumentFragment();

  sections.forEach((section) => {
    const heading = document.createElement("div");
    heading.className = "section-heading";
    heading.id = section.id;
    heading.dataset.section = section.id;
    heading.innerHTML = `<h2>${section.label}</h2><span>${section.range}</span>`;
    gridFragment.append(heading);

    for (let page = section.start; page <= section.end; page += 1) {
      const bookPage = page;
      if (bookPage && HIDDEN_BOOK_PAGES.has(bookPage)) continue;
      const card = document.createElement("figure");
      const button = document.createElement("button");
      const image = document.createElement("img");
      const caption = document.createElement("figcaption");
      const size = window.PAGE_SIZES?.[page - 1] || { width: 612, height: 792 };
      card.className = `page-card${size.width / size.height > 1.5 ? " page-card-wide" : ""}`;
      card.dataset.page = page;
      card.dataset.section = section.id;
      card.id = bookPage ? `book-page-${bookPage}` : `pdf-page-${page}`;
      card.classList.add("toc-target");
      button.className = "page-button";
      button.type = "button";
      button.dataset.page = page;
      button.setAttribute("aria-label", `Open ${pageLabel(page)}`);
      image.src = pagePath(page);
      image.alt = `Rose Book of Bible Charts, Maps and Time Lines, ${pageLabel(page)}`;
      image.style.aspectRatio = `${size.width} / ${size.height}`;
      image.loading = page <= 8 ? "eager" : "lazy";
      image.decoding = "async";
      caption.textContent = pageLabel(page);
      button.append(image);
      card.append(button, caption);
      gridFragment.append(card);
    }
  });

  grid.append(gridFragment);
}

function buildTableOfContents() {
  const fragment = document.createDocumentFragment();
  const shortcuts = document.createElement("nav");
  shortcuts.className = "toc-shortcuts";
  sections.forEach((section) => {
    const link = document.createElement("a");
    link.href = `#${section.id}`;
    link.textContent = section.label;
    shortcuts.append(link);
  });
  fragment.append(shortcuts);

  tocGroups.forEach((group) => {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const links = document.createElement("div");
    details.className = `toc-group${group.wide ? " toc-group-wide" : ""}`;
    summary.textContent = group.label;
    links.className = "toc-links";
    group.items.forEach(([title, page]) => {
      const link = document.createElement("a");
      const pageNumber = document.createElement("small");
      link.href = `#book-page-${page}`;
      link.append(document.createTextNode(title));
      pageNumber.textContent = group.items.find((item) => item[1] === page)?.[2] || pageLabel(page);
      link.append(pageNumber);
      link.addEventListener("click", () => {
        tocPanel.open = false;
      });
      links.append(link);
    });
    details.append(summary, links);
    fragment.append(details);
  });
  tableOfContents.append(fragment);
}

function setPageSize() {
  document.documentElement.style.setProperty("--page-width", `${pageSize.value}px`);
}

function getFitWidth() {
  const size = window.PAGE_SIZES?.[activePage - 1] || { width: 612, height: 792 };
  const ratio = size.width / size.height;
  return Math.max(260, Math.min(pane.clientWidth - 28, (pane.clientHeight - 30) * ratio, size.width > size.height ? 1600 : 920));
}

function centerImage() {
  requestAnimationFrame(() => {
    pane.scrollLeft = Math.max(0, (viewerImage.offsetWidth - pane.clientWidth) / 2);
    pane.scrollTop = 0;
  });
}

function setZoom(nextZoom) {
  const oldWidth = viewerImage.offsetWidth || fitWidth;
  const centerX = pane.scrollLeft + pane.clientWidth / 2;
  const centerY = pane.scrollTop + pane.clientHeight / 2;
  const ratioX = centerX / oldWidth;
  const ratioY = centerY / (viewerImage.offsetHeight || oldWidth * 782.4 / 649.2);
  zoom = Math.max(.65, Math.min(4, nextZoom));
  viewerImage.style.width = `${Math.round(fitWidth * zoom)}px`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  requestAnimationFrame(() => {
    pane.scrollLeft = ratioX * viewerImage.offsetWidth - pane.clientWidth / 2;
    pane.scrollTop = ratioY * viewerImage.offsetHeight - pane.clientHeight / 2;
  });
}

function openPage(page) {
  activePage = Number(page);
  viewerImage.src = pagePath(activePage);
  viewerImage.alt = `Rose Book of Bible Charts, Maps and Time Lines, ${pageLabel(activePage)}`;
  viewer.classList.add("is-open");
  viewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("viewing");
  fitWidth = getFitWidth();
  zoom = 1;
  viewerImage.style.width = `${Math.round(fitWidth)}px`;
  zoomLabel.textContent = "Fit";
  prevButton.disabled = !adjacentPage(activePage, -1);
  nextButton.disabled = !adjacentPage(activePage, 1);
  if (viewerImage.complete) centerImage();
  else viewerImage.addEventListener("load", centerImage, { once: true });
}

function closeViewer() {
  viewer.classList.remove("is-open");
  viewer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("viewing");
  activePage = 0;
}

function navigatePage(direction) {
  const target = adjacentPage(activePage, direction);
  if (target) openPage(target);
}

function highlight(text, query) {
  const safe = text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp(`(${escaped})`, "ig"), "<mark>$1</mark>");
}

function runSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const cards = [...document.querySelectorAll(".page-card")];
  const headings = [...document.querySelectorAll(".section-heading")];
  searchResults.innerHTML = "";

  if (!query) {
    cards.forEach((card) => card.classList.remove("is-hidden"));
    headings.forEach((heading) => heading.classList.remove("is-hidden"));
    searchResults.classList.remove("is-visible");
    searchStatus.textContent = "Search every chart, map, timeline, and page";
    return;
  }

  const terms = query.split(/\s+/).filter(Boolean);
  const matches = [];
  cards.forEach((card) => {
    const page = Number(card.dataset.page);
    const bookPage = page;
    const text = `${page} pdf page ${page} ${bookPage} book page ${bookPage} ${pageText(page)}`.toLowerCase();
    const matchesAll = terms.every((term) => text.includes(term));
    card.classList.toggle("is-hidden", !matchesAll);
    if (matchesAll) matches.push({ card, page, text: pageText(page) });
  });

  headings.forEach((heading) => {
    const visible = cards.some((card) => card.dataset.section === heading.dataset.section && !card.classList.contains("is-hidden"));
    heading.classList.toggle("is-hidden", !visible);
  });

  searchStatus.textContent = matches.length ? `${matches.length} matching page${matches.length === 1 ? "" : "s"}` : "No matches";
  matches.slice(0, 10).forEach(({ card, page, text }) => {
    const result = document.createElement("button");
    const index = text.toLowerCase().indexOf(terms[0]);
    const start = Math.max(0, index - 70);
    const snippet = text.slice(start, start + 190);
    result.className = "result";
    result.innerHTML = `<strong>${pageLabel(page)}</strong><span>${highlight(`${start ? "…" : ""}${snippet}`, query)}</span>`;
    result.addEventListener("click", () => {
      searchResults.classList.remove("is-visible");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => openPage(page), 300);
    });
    searchResults.append(result);
  });
  searchResults.classList.toggle("is-visible", matches.length > 0);
}

grid.addEventListener("click", (event) => {
  const button = event.target.closest(".page-button");
  if (button) openPage(button.dataset.page);
});
pageSize.addEventListener("input", setPageSize);
document.querySelector("#closeViewer").addEventListener("click", closeViewer);
document.querySelector("#zoomIn").addEventListener("click", () => setZoom(zoom + .25));
document.querySelector("#zoomOut").addEventListener("click", () => setZoom(zoom - .25));
document.querySelector("#fitPage").addEventListener("click", () => openPage(activePage));
prevButton.addEventListener("click", () => navigatePage(-1));
nextButton.addEventListener("click", () => navigatePage(1));

pane.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  dragging = true;
  dragStart = { x: event.clientX, y: event.clientY, left: pane.scrollLeft, top: pane.scrollTop };
  pane.classList.add("is-dragging");
  pane.setPointerCapture(event.pointerId);
});
pane.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  pane.scrollLeft = dragStart.left - (event.clientX - dragStart.x);
  pane.scrollTop = dragStart.top - (event.clientY - dragStart.y);
});
pane.addEventListener("pointerup", (event) => {
  dragging = false;
  pane.classList.remove("is-dragging");
  pane.releasePointerCapture(event.pointerId);
});
pane.addEventListener("wheel", (event) => {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  setZoom(zoom + (event.deltaY > 0 ? -.15 : .15));
}, { passive: false });

window.addEventListener("keydown", (event) => {
  if (!activePage) return;
  if (event.key === "Escape") closeViewer();
  if (event.key === "ArrowLeft") navigatePage(-1);
  if (event.key === "ArrowRight") navigatePage(1);
  if (event.key === "+" || event.key === "=") setZoom(zoom + .25);
  if (event.key === "-") setZoom(zoom - .25);
});

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 140);
});
window.addEventListener("scroll", () => scrollTopButton.classList.toggle("is-visible", scrollY > 700), { passive: true });
scrollTopButton.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

buildViewer();
buildTableOfContents();
setPageSize();
