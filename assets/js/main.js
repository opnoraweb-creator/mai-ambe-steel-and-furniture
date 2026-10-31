/* ==========================================
   AMBE GOVIND STEEL FURNITURE
   AUTOMATIC GITHUB PRODUCT GALLERY
   NEW FOLDER = NEW CATEGORY
========================================== */

// IMPORTANT:
// Yahan Ambe Govind ki apni GitHub repository details bharni hain.
const GITHUB_OWNER = "opnoraweb-creator";
const GITHUB_REPO = "mai-ambe-steel-and-furniture";

const PRODUCTS_PATH = "assets/images";

let allPhotos = [];
let currentPhotoIndex = 0;

const $ = id => document.getElementById(id);


/* ==========================================
   BASIC HELPERS
========================================== */

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}


/* ==========================================
   SHOP INFORMATION
   Details are already present in index.html
========================================== */

function initializeShop() {
  const year = $("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }
}


/* ==========================================
   PHOTO VIEWER
========================================== */

function openPhoto(images, startIndex = 0) {
  if (!images || !images.length) return;

  allPhotos = images.map(item => {
    return typeof item === "string" ? item : item.url;
  });

  currentPhotoIndex = startIndex;

  let overlay = $("photoOverlay");

  if (overlay) {
    overlay.remove();
  }

  overlay = createElement("div", "photo-overlay");
  overlay.id = "photoOverlay";

  const image = createElement("img", "photo-viewer-image");

  const closeButton = createElement("button", "photo-close", "×");
  const previousButton = createElement("button", "photo-previous", "‹");
  const nextButton = createElement("button", "photo-next", "›");
  const counter = createElement("div", "photo-counter");

  closeButton.type = "button";
  previousButton.type = "button";
  nextButton.type = "button";

  closeButton.setAttribute("aria-label", "Close photo");
  previousButton.setAttribute("aria-label", "Previous photo");
  nextButton.setAttribute("aria-label", "Next photo");

  function updateImage() {
    image.src = allPhotos[currentPhotoIndex];

    counter.textContent =
      `${currentPhotoIndex + 1} / ${allPhotos.length}`;
  }

  function closeViewer() {
    overlay.remove();
    document.removeEventListener("keydown", keyboardHandler);
  }

  previousButton.addEventListener("click", () => {
    currentPhotoIndex =
      (currentPhotoIndex - 1 + allPhotos.length) %
      allPhotos.length;

    updateImage();
  });

  nextButton.addEventListener("click", () => {
    currentPhotoIndex =
      (currentPhotoIndex + 1) % allPhotos.length;

    updateImage();
  });

  closeButton.addEventListener("click", closeViewer);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      closeViewer();
    }
  });

  function keyboardHandler(event) {
    if (!document.body.contains(overlay)) {
      document.removeEventListener("keydown", keyboardHandler);
      return;
    }

    if (event.key === "Escape") {
      closeViewer();
    }

    if (event.key === "ArrowRight") {
      nextButton.click();
    }

    if (event.key === "ArrowLeft") {
      previousButton.click();
    }
  }

  document.addEventListener("keydown", keyboardHandler);

  overlay.append(
    closeButton,
    previousButton,
    image,
    nextButton,
    counter
  );

  document.body.appendChild(overlay);

  updateImage();
}


/* ==========================================
   IMAGE FILE HELPERS
========================================== */

function isImageFile(file) {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
}

function getPhotoNumber(fileName, index) {
  const nameWithoutExtension =
    fileName.replace(/\.[^.]+$/, "");

  const match = nameWithoutExtension.match(/\d+/);

  return match ? Number(match[0]) : index + 1;
}

function formatCategoryName(folderName) {
  return folderName
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}


/* ==========================================
   PRODUCT PHOTO CARD
========================================== */

function createPhotoCard(
  imagePath,
  number,
  categoryName,
  categoryPhotos
) {
  const card = createElement("article", "product-card");

  const image = createElement("img", "product-image");

  image.src = imagePath;
  image.alt = `${categoryName} ${number}`;
  image.loading = "lazy";

  image.addEventListener("click", () => {
    openPhoto(categoryPhotos, number - 1);
  });

  const title = createElement(
    "h3",
    "product-title",
    String(number)
  );

  card.append(image, title);

  return card;
}


/* ==========================================
   GITHUB API URL
========================================== */

function getGitHubApiUrl(path = "") {
  return (
    `https://api.github.com/repos/` +
    `${GITHUB_OWNER}/${GITHUB_REPO}/contents/` +
    `${PRODUCTS_PATH}${path}`
  );
}


/* ==========================================
   GET ALL CATEGORY FOLDERS
========================================== */

async function getGitHubFolders() {
  const response = await fetch(getGitHubApiUrl(), {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    throw new Error(
      `GitHub folder loading failed: ${response.status}`
    );
  }

  const items = await response.json();

  return items
    .filter(item => item.type === "dir")
    .sort((a, b) => a.name.localeCompare(b.name));
}


/* ==========================================
   GET IMAGES FROM CATEGORY FOLDER
========================================== */

async function getFolderImages(folderName) {
  const folderUrl = getGitHubApiUrl(
    `/${encodeURIComponent(folderName)}`
  );

  const response = await fetch(folderUrl, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    console.warn("Folder could not load:", folderName);
    return [];
  }

  const files = await response.json();

  return files
    .filter(file =>
      file.type === "file" &&
      isImageFile(file) &&
      file.download_url
    )
    .sort((a, b) => {
      const numberA = getPhotoNumber(a.name, 0);
      const numberB = getPhotoNumber(b.name, 0);

      return numberA - numberB ||
        a.name.localeCompare(b.name);
    });
}


/* ==========================================
   AUTOMATIC PRODUCT CATALOG
========================================== */

async function renderProductCatalog() {
  const productsBox = $("products");

  if (!productsBox) return;

  productsBox.innerHTML = "";

  productsBox.appendChild(
    createElement(
      "p",
      "empty-message",
      "Loading products..."
    )
  );

  try {
    const folders = await getGitHubFolders();

    productsBox.innerHTML = "";

    let totalPhotos = 0;

    for (const folder of folders) {
      const images = await getFolderImages(folder.name);

      if (!images.length) continue;

      const categoryName =
        formatCategoryName(folder.name);

      const categorySection = createElement(
        "section",
        "catalog-category"
      );

      const heading = createElement(
        "h2",
        "catalog-category-heading",
        categoryName
      );

      const grid = createElement(
        "div",
        "product-grid"
      );

      const categoryPhotos = images.map(file => {
        return file.download_url;
      });

      images.forEach((file, index) => {
        const number = getPhotoNumber(file.name, index);

        grid.appendChild(
          createPhotoCard(
            file.download_url,
            index + 1,
            categoryName,
            categoryPhotos
          )
        );

        totalPhotos++;
      });

      categorySection.append(heading, grid);

      productsBox.appendChild(categorySection);
    }

    if (totalPhotos === 0) {
      productsBox.appendChild(
        createElement(
          "p",
          "empty-message",
          "Products coming soon."
        )
      );
    }

  } catch (error) {
    console.error("Product catalog error:", error);

    productsBox.innerHTML = "";

    productsBox.appendChild(
      createElement(
        "p",
        "empty-message",
        "Products load nahi ho paye. GitHub repository aur internet connection check karein."
      )
    );
  }
}


/* ==========================================
   WEBSITE DISPLAY MODE
========================================== */

function showFinalCatalog() {
  const categoriesSection = $("categoriesSection");
  const subcategoriesSection = $("subcategoriesSection");
  const productsSection = $("productsSection");

  if (categoriesSection) {
    categoriesSection.hidden = true;
  }

  if (subcategoriesSection) {
    subcategoriesSection.hidden = true;
  }

  if (productsSection) {
    productsSection.hidden = false;
  }

  const heading = $("productsHeading");

  if (heading) {
    heading.textContent = "Our Products";
  }

  renderProductCatalog();
}


/* ==========================================
   START WEBSITE
========================================== */

document.addEventListener("DOMContentLoaded", () => {

  initializeShop();

  // Apni repository details check karein.
  if (
    GITHUB_OWNER.startsWith("YOUR_") ||
    GITHUB_REPO.startsWith("YOUR_")
  ) {
    const productsBox = $("products");

    if (productsBox) {
      productsBox.innerHTML = "";

      productsBox.appendChild(
        createElement(
          "p",
          "empty-message",
          "GitHub repository details main.js mein add karni hain."
        )
      );
    }

    const productsSection = $("productsSection");

    if (productsSection) {
      productsSection.hidden = false;
    }

    return;
  }

  showFinalCatalog();

});
