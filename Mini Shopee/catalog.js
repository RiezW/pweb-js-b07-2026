(function () {
    "use strict";

    const AUTH_KEY = "loggedInUser";
    const LEGACY_AUTH_KEY = "userFirstName";
    const LOGIN_PAGE = "login2.html";
    const NEW_TAB_KEY = "new";
    const SEARCH_DEBOUNCE_MS = 300;

    function debounce(fn, delay) {
        let timeoutId;
        return function debounced(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }
    window.debounce = debounce;

    function authGuard(navGreetingEl) {
        let user = null;
        try {
            user = localStorage.getItem(AUTH_KEY);
            if (!user) {
                user = localStorage.getItem(LEGACY_AUTH_KEY);
                if (user) {
                    localStorage.setItem(AUTH_KEY, user);
                }
            }
        } catch (e) {
            console.error("[AuthGuard/catalog.js] localStorage tidak bisa diakses:", e);
            user = null;
        }

        if (!user) {
            console.warn(
                '[AuthGuard/catalog.js] Key "' + AUTH_KEY + '" tidak ada saat authGuard() dijalankan ' +
                "di catalog.js (lapisan kedua). Redirect ke " + LOGIN_PAGE + "."
            );
            window.location.replace(LOGIN_PAGE);
            return false;
        }

        if (navGreetingEl) {
            navGreetingEl.textContent = `Halo, ${user}`;
        }
        return true;
    }

    function createGlobalErrorController(globalError, globalErrorText, globalErrorClose) {
        function show(message) {
            if (!globalError || !globalErrorText) return;
            globalErrorText.textContent = message;
            globalError.hidden = false;
        }
        function hide() {
            if (!globalError) return;
            globalError.hidden = true;
        }
        if (globalErrorClose) {
            globalErrorClose.addEventListener("click", hide);
        }
        return { show, hide };
    }

    const megaData = {
        "face-care": [
            { title: "Cleansers", items: ["Facial Wash", "Micellar Water", "Makeup Remover"] },
            { title: "Treatments", items: ["Serums", "Face Oils", "Ampoules"] },
            { title: "Moisturizers", items: ["Day Cream", "Night Cream", "Sunscreen"] },
            { title: "Special Care", items: ["Masks", "Eye Care", "Lip Care"] },
        ],
        "body-care": [
            { title: "Cleanse", items: ["Body Wash", "Soap Bars", "Body Scrub"] },
            { title: "Moisturize", items: ["Body Lotion", "Body Butter", "Body Oil"] },
            { title: "Hand & Foot", items: ["Hand Cream", "Foot Cream", "Nail Care"] },
            { title: "Special Care", items: ["Deodorant", "Sun Care"] },
        ],
        "hair-care": [
            { title: "Wash & Care", items: ["Shampoos", "Hair Conditioners", "Hair Masks", "Hair Balms", "Hair Oils", "Serum and Hair Fluids"] },
            { title: "Styling", items: ["Hair Sprays", "Scalp Peels", "Coloring", "Stylization", "Hair Rinses", "Hair Accessories"] },
            { title: "Treatment", items: ["Special Care", "Keratin for Hair"] },
            { title: "New", items: ["New", "Hair Conditioners", "Hair Masks"], highlight: true },
        ],
        "candles": [
            { title: "Scented", items: ["Signature Candles", "Seasonal Candles"] },
            { title: "Home", items: ["Candle Holders", "Diffusers", "Wax Melts"] },
        ],
        "accessories": [
            { title: "Beauty Tools", items: ["Brushes", "Sponges", "Mirrors"] },
            { title: "On The Go", items: ["Travel Kits", "Pouches", "Bags"] },
        ],
    };

    function init() {
        const shopNav = document.getElementById("shopNav");
        const navGreeting = document.getElementById("navGreeting");
        const logoutBtn = document.getElementById("logoutBtn");

        const globalError = document.getElementById("globalError");
        const globalErrorText = document.getElementById("globalErrorText");
        const globalErrorClose = document.getElementById("globalErrorClose");

        window.AppError = createGlobalErrorController(globalError, globalErrorText, globalErrorClose);

        if (!authGuard(navGreeting)) return;

        if (logoutBtn) {
            logoutBtn.addEventListener("click", function () {
                try {
                    localStorage.removeItem(AUTH_KEY);
                    localStorage.removeItem(LEGACY_AUTH_KEY);
                } catch (e) {}
                window.location.href = LOGIN_PAGE;
            });
        }

        function updateNavHeightVar() {
            if (!shopNav) return;
            document.documentElement.style.setProperty("--nav-height", shopNav.offsetHeight + "px");
        }
        updateNavHeightVar();
        window.addEventListener("resize", updateNavHeightVar);

        const tabs = document.querySelectorAll(".tab-item");
        const megaMenu = document.getElementById("megaMenu");
        const megaColumns = document.getElementById("megaColumns");
        const megaOverlay = document.getElementById("megaOverlay");

        let currentOpenTab = null;

        const tabLabels = {};
        tabs.forEach(function (tab) {
            tabLabels[tab.getAttribute("data-tab")] = tab.textContent.trim();
        });

        function buildNewArrivalsColumns() {
            const columns = [];
            Object.keys(megaData).forEach(function (categoryKey) {
                megaData[categoryKey]
                    .filter(function (col) { return col.highlight; })
                    .forEach(function (col) {
                        columns.push({
                            title: tabLabels[categoryKey] || categoryKey,
                            items: col.items,
                            highlight: false,
                        });
                    });
            });
            return columns;
        }

        function getColumnsFor(tabKey) {
            if (tabKey === NEW_TAB_KEY) {
                return buildNewArrivalsColumns();
            }
            return megaData[tabKey];
        }

        function buildColumns(columns) {
            if (!megaColumns) return;
            if (!columns || columns.length === 0) {
                megaColumns.innerHTML = `
                    <div class="mega-column">
                        <ul><li><span>Belum ada produk baru saat ini.</span></li></ul>
                    </div>
                `;
                return;
            }

            megaColumns.innerHTML = columns
                .map(function (col) {
                    const items = col.items
                        .map(function (item) {
                            const highlightClass = col.highlight ? " highlight" : "";
                            return `<li class="${highlightClass.trim()}"><a href="#">${item}</a></li>`;
                        })
                        .join("");
                    return `
                        <div class="mega-column">
                            <h4>${col.title}</h4>
                            <ul>${items}</ul>
                        </div>
                    `;
                })
                .join("");
        }

        function setActiveTab(clickedTab) {
            tabs.forEach(function (tab) { tab.classList.remove("active"); });
            clickedTab.classList.add("active");
        }

        function openMegaMenu(tabKey, tabEl) {
            if (!megaMenu) return;
            buildColumns(getColumnsFor(tabKey));
            megaMenu.hidden = false;
            if (megaOverlay) megaOverlay.hidden = false;
            if (tabEl) tabEl.setAttribute("aria-expanded", "true");
        }

        function closeMegaMenu() {
            if (!megaMenu || megaMenu.hidden) return;
            megaMenu.hidden = true;
            if (megaColumns) megaColumns.innerHTML = "";
            if (megaOverlay) megaOverlay.hidden = true;
            tabs.forEach(function (tab) { tab.setAttribute("aria-expanded", "false"); });
            currentOpenTab = null;
        }

        if (tabs.length && megaMenu && megaColumns) {
            tabs.forEach(function (tab) {
                tab.setAttribute("aria-haspopup", "true");
                tab.setAttribute("aria-expanded", "false");

                tab.addEventListener("click", function () {
                    const tabKey = tab.getAttribute("data-tab");
                    const hasSubmenu = Boolean(megaData[tabKey]) || tabKey === NEW_TAB_KEY;
                    const isSameTabOpen = currentOpenTab === tabKey && !megaMenu.hidden;

                    setActiveTab(tab);

                    if (!hasSubmenu) {
                        closeMegaMenu();
                        return;
                    }
                    if (isSameTabOpen) {
                        closeMegaMenu();
                        return;
                    }
                    openMegaMenu(tabKey, tab);
                    currentOpenTab = tabKey;
                });
            });
        }

        const searchToggle = document.getElementById("searchToggle");
        const searchInput = document.getElementById("navSearchInput");

        function closeSearch() {
            if (!searchInput || searchInput.hidden) return;
            searchInput.hidden = true;
            if (searchToggle) searchToggle.setAttribute("aria-expanded", "false");
        }

        function openSearch() {
            if (!searchInput) return;
            searchInput.hidden = false;
            if (searchToggle) searchToggle.setAttribute("aria-expanded", "true");
            searchInput.focus();
        }

        if (searchToggle && searchInput) {
            const emitSearch = debounce(function () {
                const query = searchInput.value.trim();
                document.dispatchEvent(new CustomEvent("catalog:search", { detail: { query } }));
            }, SEARCH_DEBOUNCE_MS);

            searchInput.addEventListener("input", emitSearch);

            searchToggle.addEventListener("click", function (e) {
                e.stopPropagation();
                if (searchInput.hidden) {
                    openSearch();
                } else {
                    closeSearch();
                }
            });
        }

        const navAccountBtn = document.getElementById("navAccountBtn");
        const navAccountMenu = document.getElementById("navAccountMenu");

        function closeAccountMenu() {
            if (!navAccountMenu || navAccountMenu.hidden) return;
            navAccountMenu.hidden = true;
            if (navAccountBtn) navAccountBtn.setAttribute("aria-expanded", "false");
        }

        function openAccountMenu() {
            if (!navAccountMenu) return;
            navAccountMenu.hidden = false;
            if (navAccountBtn) navAccountBtn.setAttribute("aria-expanded", "true");
        }

        if (navAccountBtn && navAccountMenu) {
            navAccountBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                if (navAccountMenu.hidden) {
                    openAccountMenu();
                } else {
                    closeAccountMenu();
                }
            });
        }

        function closeAllOverlays() {
            closeMegaMenu();
            closeAccountMenu();
            closeSearch();
        }

        if (megaOverlay) {
            megaOverlay.addEventListener("click", closeAllOverlays);
        }

        document.addEventListener("click", function (e) {
            if (!e.target.closest("#categoryTabs") && !e.target.closest("#megaMenu")) {
                closeMegaMenu();
            }
            if (!e.target.closest("#navAccount")) {
                closeAccountMenu();
            }
            if (!e.target.closest("#navSearch")) {
                closeSearch();
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                closeAllOverlays();
            }
        });

        window.addEventListener("scroll", closeAllOverlays, { passive: true });
        window.addEventListener("resize", closeAllOverlays);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();