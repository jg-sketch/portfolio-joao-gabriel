// ============================================================
// Dark mode
// ============================================================
const THEME_KEY = "portfolio-theme";
const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle.querySelector("i");

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);

  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");

    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");

    themeToggle.setAttribute("aria-pressed", "true");
    themeToggle.setAttribute("aria-label", "Ativar modo claro");
  } else {
    root.removeAttribute("data-theme");

    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");

    themeToggle.setAttribute("aria-pressed", "false");
    themeToggle.setAttribute("aria-label", "Ativar modo escuro");
  }
}

let currentTheme = getPreferredTheme();
applyTheme(currentTheme);

themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
  localStorage.setItem(THEME_KEY, currentTheme);
});

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    if (localStorage.getItem(THEME_KEY)) {
      return;
    }

    currentTheme = event.matches ? "dark" : "light";
    applyTheme(currentTheme);
  });

// ============================================================
// Mobile navigation
// ============================================================
const navToggle = document.getElementById("nav-toggle");
const siteNav = document.querySelector(".site-nav");

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");

  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute(
    "aria-label",
    isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"
  );
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menu de navegação");
  });
});

// ============================================================
// Footer year
// ============================================================
document.getElementById("year").textContent = new Date().getFullYear();

// ============================================================
// Scroll reveal
// ============================================================
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const revealTargets = document.querySelectorAll(
  ".section, .hero-text, .hero-visual"
);

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealTargets.forEach((el) => {
    el.classList.add("reveal", "is-visible");
  });
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealTargets.forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });
}

// ============================================================
// GitHub repositories showcase
//
// Cada card já vem no HTML com um conteúdo estático de fallback
// (descrição e links funcionam sem JavaScript). Aqui tentamos
// complementar cada card com dados ao vivo da API pública do
// GitHub (linguagem, stars, forks e data de atualização). Se a
// requisição falhar ou a API estiver indisponível/limitada, o
// card simplesmente continua exibindo o conteúdo estático — o
// site nunca depende da API para funcionar.
// ============================================================
const relativeTimeFormatter = new Intl.RelativeTimeFormat("pt-BR", {
  numeric: "auto",
});

function formatRelativeDate(isoDate) {
  const updatedAt = new Date(isoDate);
  const diffInDays = Math.round(
    (updatedAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (Math.abs(diffInDays) < 30) {
    return relativeTimeFormatter.format(diffInDays, "day");
  }

  const diffInMonths = Math.round(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return relativeTimeFormatter.format(diffInMonths, "month");
  }

  const diffInYears = Math.round(diffInDays / 365);
  return relativeTimeFormatter.format(diffInYears, "year");
}

function formatCount(value) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value);
}

async function hydrateRepoCard(card) {
  const repoPath = card.dataset.repo;
  if (!repoPath) return;

  card.classList.add("is-loading");

  try {
    const response = await fetch(`https://api.github.com/repos/${repoPath}`, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
      throw new Error(`GitHub API respondeu ${response.status}`);
    }

    const repo = await response.json();

    const descEl = card.querySelector(".repo-desc");
    const langEl = card.querySelector(".repo-lang-name");
    const starsEl = card.querySelector(".repo-stars");
    const forksEl = card.querySelector(".repo-forks");
    const updatedEl = card.querySelector(".repo-updated-text");

    if (descEl && repo.description) {
      descEl.textContent = repo.description;
    }

    if (langEl) {
      langEl.textContent = repo.language || card.dataset.fallbackLang || "—";
    }

    if (starsEl) {
      starsEl.textContent = formatCount(repo.stargazers_count ?? 0);
    }

    if (forksEl) {
      forksEl.textContent = formatCount(repo.forks_count ?? 0);
    }

    if (updatedEl && repo.pushed_at) {
      updatedEl.textContent = `Atualizado ${formatRelativeDate(
        repo.pushed_at
      )}`;
    }
  } catch (error) {
    // A API pode estar indisponível ou o limite de requisições sem
    // autenticação (60/hora por IP) pode ter sido atingido. Nesse
    // caso, mantemos o conteúdo estático que já está no HTML.
    console.warn(
      `Não foi possível carregar dados ao vivo de ${repoPath}:`,
      error
    );
  } finally {
    card.classList.remove("is-loading");
  }
}

document.querySelectorAll(".repo-card[data-repo]").forEach(hydrateRepoCard);
