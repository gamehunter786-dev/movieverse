
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyAGIr1zZ_yRV_GZn_C84BIRXhXqFYeKHFo",
  authDomain: "e-commerce-a5510.firebaseapp.com",
  projectId: "e-commerce-a5510",
  storageBucket: "e-commerce-a5510.firebasestorage.app",
  messagingSenderId: "472698943089",
  appId: "1:472698943089:web:6bc21b0522d8ae41ee8dd0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// ==========================================
// 2. MOVIE DATABASE
// ==========================================

 // ==========================================
 // 2. MOVIE DATABASE
 // ==========================================

const movies = [
  {
    id: 1,
    title: "Dune: Part Two",
    year: 2024,
    genre: "Sci-Fi",
    rating: "8.5",
    image: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    glow: "#e7a64e",
    youtubeId: "Way9Dexny3w"
  },
  {
    id: 2,
    title: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    genre: "Animation",
    rating: "8.6",
    image: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    glow: "#df3f5c",
    youtubeId: "cqGjhVJWtEg"
  }
];

// The next section of your existing script starts here.


// ==========================================
// 3. APP STATE AND HELPERS
// ==========================================

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

const STORAGE_KEY = "cineverse_watchlists_v1";

let activeFilter = "All";
let searchTerm = "";
let currentUser = null;
let watchlistIds = [];
let authMode = "signin";

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function readLocalWatchlists() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveLocalWatchlist(ids) {
  const allWatchlists = readLocalWatchlists();
  const key = currentUser?.uid || "guest";

  allWatchlists[key] = ids;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allWatchlists));
}

function getCurrentWatchlist() {
  return watchlistIds;
}

// ==========================================
// 4. RENDER MOVIE CARDS
// ==========================================

function renderMovies() {
  const grid = $("#movieGrid");
  const emptyState = $("#emptyState");

  if (!grid || !emptyState) {
    console.error(
      "CineVerse: #movieGrid or #emptyState was not found in index.html."
    );
    return;
  }

  const filteredMovies = movies.filter(movie => {
    const matchesGenre =
      activeFilter === "All" || movie.genre === activeFilter;

    const searchableText =
      `${movie.title} ${movie.genre} ${movie.year}`.toLowerCase();

    return matchesGenre && searchableText.includes(searchTerm);
  });

  grid.innerHTML = filteredMovies.map((movie, index) => {
    const saved = getCurrentWatchlist().includes(movie.id);

    return `
      <article class="movie-card"
        style="animation-delay:${Math.min(index * 45, 300)}ms">

        <div class="movie-poster">

          <div class="movie-poster-fallback"
            style="--glow:${movie.glow}">
            <span>${safeText(movie.title)}</span>
          </div>

          <img
            src="${movie.image}"
            alt="${safeText(movie.title)} poster"
            loading="lazy"
            onerror="this.style.display='none'"
          >

          <div class="movie-rating">
            <span>★</span> ${safeText(movie.rating)}
          </div>

          <button
            class="watch-btn ${saved ? "saved" : ""}"
            data-save="${movie.id}"
            aria-label="${saved ? "Remove" : "Add"} ${safeText(movie.title)} ${saved ? "from" : "to"} watchlist"
            title="${saved ? "Remove from watchlist" : "Add to watchlist"}"
          >${saved ? "✓" : "+"}</button>

        </div>

        <div class="movie-info">
          <div class="movie-title-line">
            <h3 class="movie-title">${safeText(movie.title)}</h3>
            <span class="movie-year">${movie.year}</span>
          </div>

          <div class="movie-meta">
            <span>${safeText(movie.genre)}</span>
            <i class="genre-dot"></i>
            <span>Movie</span>
          </div>
        </div>

      </article>
    `;
  }).join("");

  emptyState.hidden = filteredMovies.length > 0;
}

// ==========================================
// 5. SEARCH AND GENRE FILTERS
// ==========================================

const searchInput = $("#searchInput");

if (searchInput) {
  searchInput.addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLowerCase();
    renderMovies();
  });
}

$$("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "All";

    $$("[data-filter]").forEach(item => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });

    renderMovies();
  });
});

// ==========================================
// 6. WATCHLIST
// ==========================================

async function loadWatchlist(user) {
  const localLists = readLocalWatchlists();
  watchlistIds = localLists[user ? user.uid : "guest"] || [];

  if (user) {
    try {
      const watchlistRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(watchlistRef);

      if (snapshot.exists()) {
        const cloudIds = snapshot.data().watchlist;

        if (Array.isArray(cloudIds)) {
          watchlistIds = cloudIds;
          saveLocalWatchlist(watchlistIds);
        }
      }
    } catch (error) {
      console.warn(
        "Could not load cloud watchlist. Using local watchlist instead.",
        error.message
      );
    }
  }

  renderMovies();
}

async function saveWatchlist() {
  saveLocalWatchlist(watchlistIds);

  if (!currentUser) {
    return;
  }

  try {
    await setDoc(
      doc(db, "users", currentUser.uid),
      { watchlist: watchlistIds },
      { merge: true }
    );
  } catch (error) {
    console.error("Could not save cloud watchlist:", error.message);
  }
}

const movieGrid = $("#movieGrid");

if (movieGrid) {
  movieGrid.addEventListener("click", async event => {
    const button = event.target.closest("[data-save]");

    if (!button) return;

    const movieId = Number(button.dataset.save);

    if (watchlistIds.includes(movieId)) {
      watchlistIds = watchlistIds.filter(id => id !== movieId);
    } else {
      watchlistIds = [...watchlistIds, movieId];
    }

    renderMovies();
    await saveWatchlist();
  });
}

// ==========================================
// 7. ACCOUNT MODAL
// ==========================================

const authModal = $("#authModal");
const authForm = $("#authForm");
const authMessage = $("#authMessage");

function showAuthMessage(message, isError = true) {
  if (!authMessage) return;

  authMessage.textContent = message;
  authMessage.style.color = isError ? "#ff7373" : "#7ee7b5";
}

function openAuthModal(mode = "signin") {
  if (!authModal) {
    console.error("CineVerse: #authModal was not found.");
    return;
  }

  setAuthMode(mode);
  authModal.hidden = false;
  authModal.classList.add("active");
  authModal.setAttribute("aria-hidden", "false");

  const emailInput = $("#authEmail");
  if (emailInput) emailInput.focus();
}

function closeAuthModal() {
  if (!authModal) return;

  authModal.classList.remove("active");
  authModal.hidden = true;
  authModal.setAttribute("aria-hidden", "true");
  showAuthMessage("");
}

function setAuthMode(mode) {
  authMode = mode;

  const title = $("#authTitle");
  const submit = $("#authSubmit");
  const switchText = $("#authSwitchText");
  const switchButton = $("#authSwitch");

  if (title) {
    title.textContent =
      mode === "signup" ? "Create your account" : "Welcome back";
  }

  if (submit) {
    submit.textContent =
      mode === "signup" ? "Create Account" : "Sign In";
  }

  if (switchText) {
    switchText.textContent =
      mode === "signup"
        ? "Already have an account?"
        : "Don't have an account?";
  }

  if (switchButton) {
    switchButton.textContent =
      mode === "signup" ? "Sign In" : "Create Account";
  }

  showAuthMessage("");
}

const accountButton =
  $("#accountBtn") || $("#accountButton") || $("#loginBtn");

if (accountButton) {
  accountButton.addEventListener("click", () => {
    if (currentUser) {
      signOut(auth).catch(error => {
        console.error("Sign-out failed:", error);
      });
    } else {
      openAuthModal("signin");
    }
  });
}

const closeAuthButton =
  $("#authClose") || $("#closeAuth") || $("#modalClose");

if (closeAuthButton) {
  closeAuthButton.addEventListener("click", closeAuthModal);
}

if (authModal) {
  authModal.addEventListener("click", event => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });
}

const authSwitch = $("#authSwitch");

if (authSwitch) {
  authSwitch.addEventListener("click", () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin");
  });
}

// ==========================================
// 8. FIREBASE SIGN-UP AND SIGN-IN
// ==========================================

if (authForm) {
  authForm.addEventListener("submit", async event => {
    event.preventDefault();

    const emailInput =
      $("#authEmail", authForm) || $('input[type="email"]', authForm);

    const passwordInput =
      $("#authPassword", authForm) ||
      $('input[type="password"]', authForm);

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      showAuthMessage("Please enter your email and password.");
      return;
    }

    const submitButton =
      $("#authSubmit", authForm) ||
      $('button[type="submit"]', authForm);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Please wait...";
    }

    try {
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        showAuthMessage("Account created successfully!", false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showAuthMessage("Signed in successfully!", false);
      }

      authForm.reset();

      setTimeout(() => {
        closeAuthModal();
      }, 700);

    } catch (error) {
      const messages = {
        "auth/email-already-in-use": "This email already has an account.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Your password must be at least 6 characters.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "No account was found for this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/network-request-failed": "Network error. Check your connection."
      };

      showAuthMessage(
        messages[error.code] ||
        error.message ||
        "Something went wrong. Please try again."
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent =
          authMode === "signup" ? "Create Account" : "Sign In";
      }
    }
  });
}

// ==========================================
// 9. UPDATE ACCOUNT BUTTON
// ==========================================

function updateAccountButton(user) {
  const button =
    $("#accountBtn") || $("#accountButton") || $("#loginBtn");

  if (!button) return;

  if (user) {
    button.textContent = "Sign Out";
    button.title = user.email || "Signed in";
  } else {
    button.textContent = "Sign In";
    button.title = "Sign in to CineVerse";
  }
}

// ==========================================
// 10. SURPRISE ME BUTTON
// ==========================================

const surpriseButton = $("#surpriseBtn");

if (surpriseButton) {
  surpriseButton.addEventListener("click", () => {
    const availableMovies = movies.filter(movie => {
      const searchMatches =
        `${movie.title} ${movie.genre} ${movie.year}`
          .toLowerCase()
          .includes(searchTerm);

      const genreMatches =
        activeFilter === "All" || movie.genre === activeFilter;

      return searchMatches && genreMatches;
    });

    if (availableMovies.length === 0) {
      showAuthMessage("No movies match your search.");
      return;
    }

    const randomMovie =
      availableMovies[Math.floor(Math.random() * availableMovies.length)];

    const card = $$("[data-save]").find(button =>
      Number(button.dataset.save) === randomMovie.id
    );

    if (card) {
      card.closest(".movie-card")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    } else {
      activeFilter = "All";
      searchTerm = "";

      if (searchInput) searchInput.value = "";

      $$("[data-filter]").forEach(button => {
        button.classList.toggle(
          "active",
          (button.dataset.filter || "All") === "All"
        );
      });

      renderMovies();

      setTimeout(() => {
        const target = $$("[data-save]").find(button =>
          Number(button.dataset.save) === randomMovie.id
        );

        target?.closest(".movie-card")?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 50);
    }
  });
}

// ==========================================
// 11. MOBILE MENU
// ==========================================

const menuToggle = $("#menuToggle");
const navMenu = $("#navMenu") || $(".nav-links");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");

    menuToggle.setAttribute(
      "aria-expanded",
      String(navMenu.classList.contains("active"))
    );
  });
}

// ==========================================
// 12. FIREBASE AUTH STATE
// ==========================================

onAuthStateChanged(auth, async user => {
  currentUser = user;

  updateAccountButton(user);

  await loadWatchlist(user);
});

// Initial display: render immediately while Firebase checks sign-in state.
renderMovies();
updateAccountButton(null);
