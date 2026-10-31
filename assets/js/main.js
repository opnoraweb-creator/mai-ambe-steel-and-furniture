// GitHub Pages auto-gallery: update these two values after creating the repository.
const GITHUB_OWNER = "YOUR_GITHUB_USERNAME";
const GITHUB_REPO = "YOUR_REPOSITORY_NAME";
const PRODUCT_ROOT = "assets/images/products";
let viewerPhotos = [];
let viewerIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  loadProductCategories();
  document.getElementById("viewerClose").addEventListener("click", closeViewer);
  document.getElementById("viewerPrev").addEventListener("click", () => moveViewer(-1));
  document.getElementById("viewerNext").addEventListener("click", () => moveViewer(1));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowLeft") moveViewer(-1);
    if (e.key === "ArrowRight") moveViewer(1);
  });
});

async function loadProductCategories() {
  const host = document.getElementById("categoryGallery");
  if (GITHUB_OWNER.startsWith("YOUR_") || GITHUB_REPO.startsWith("YOUR_")) {
    host.innerHTML = '<div class="empty">फोटो गैलरी चालू करने के लिए main.js में GitHub username और repository name भरें।</div>';
    return;
  }
  try {
    const rootUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PRODUCT_ROOT}`;
    const response = await fetch(rootUrl);
    if (!response.ok) throw new Error("GitHub API error");
    const folders = await response.json();
    const categories = folders.filter(x => x.type === "dir");
    let html = "";
    viewerPhotos = [];
    for (const folder of categories) {
      const res = await fetch(folder.url);
      if (!res.ok) continue;
      const files = await res.json();
      const photos = files.filter(f => f.type === "file" && /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
        .sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric:true}));
      if (!photos.length) continue;
      const cards = photos.map(file => {
        const idx = viewerPhotos.push({url:file.download_url, alt:`${pretty(folder.name)} ${file.name}`}) - 1;
        return `<article class="product-card" tabindex="0" role="button" onclick="openViewer(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openViewer(${idx})}">
          <img src="${file.download_url}" alt="${pretty(folder.name)}" loading="lazy"><p>${pretty(folder.name)} · ${idx+1}</p></article>`;
      }).join("");
      html += `<section class="category-block"><h3 class="category-heading">${pretty(folder.name)}</h3><div class="product-grid">${cards}</div></section>`;
    }
    host.innerHTML = html || '<div class="empty">अभी प्रोडक्ट फोटो अपलोड नहीं की गई हैं।</div>';
  } catch (e) {
    host.innerHTML = '<div class="empty">फोटो गैलरी लोड नहीं हो पाई। GitHub repository public रखें और बाद में फिर देखें।</div>';
  }
}
function pretty(s){return s.replace(/[-_]/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
function openViewer(index){if(!viewerPhotos.length)return;viewerIndex=index;renderViewer();document.getElementById("photoViewer").classList.add("open");document.getElementById("photoViewer").setAttribute("aria-hidden","false")}
function renderViewer(){const p=viewerPhotos[viewerIndex];document.getElementById("viewerImage").src=p.url;document.getElementById("viewerImage").alt=p.alt;document.getElementById("viewerCount").textContent=`${viewerIndex+1} / ${viewerPhotos.length}`}
function moveViewer(step){if(!document.getElementById("photoViewer").classList.contains("open"))return;viewerIndex=(viewerIndex+step+viewerPhotos.length)%viewerPhotos.length;renderViewer()}
function closeViewer(){document.getElementById("photoViewer").classList.remove("open");document.getElementById("photoViewer").setAttribute("aria-hidden","true")}
