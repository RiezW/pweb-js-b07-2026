(function () {
    "use strict";

    const AUTH_KEY = "loggedInUser";
    const LEGACY_AUTH_KEY = "userFirstName";
    const LOGIN_PAGE = "login.html";
    const NEW_TAB_KEY = "new";
    const SEARCH_DEBOUNCE_MS = 300;
    const PRODUCTS_URL = "https://dummyjson.com/products?limit=100";
    const PRODUCTS_PER_PAGE = 12;

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
        const CART_KEY = "shoppingCart";
        const productGrid = document.getElementById("productGrid");
        const modal = document.getElementById("modal");
        const modalContent = document.getElementById("modalContent");
        const modalClose = document.getElementById("modalClose");
        const cartCount = document.getElementById("cartCount");
        const cartTotal = document.getElementById("cartTotal");
        const cartBtn = document.getElementById("cartBtn");
        const cartModal = document.getElementById("cartModal");
        const cartClose = document.getElementById("cartClose");
        const cartItems = document.getElementById("cartItems");
        const cartEmpty = document.getElementById("cartEmpty");
        const cartModalTotal = document.getElementById("cartModalTotal");
        const clearCartBtn = document.getElementById("clearCartBtn");
        const categoryFilter = document.getElementById("categoryFilter");
        const sortSelect = document.getElementById("sortSelect");
        const productStatus = document.getElementById("productStatus");
        const loadMoreBtn = document.getElementById("loadMoreBtn");
        let allProducts = [];
        let filteredProducts = [];
        let visibleProductCount = PRODUCTS_PER_PAGE;
        let currentSearch = "";

        function getCart() {
            try {
                const storedCart = JSON.parse(localStorage.getItem(CART_KEY));
                return Array.isArray(storedCart) ? storedCart : [];
            } catch (e) {
                console.error("Gagal membaca keranjang dari LocalStorage:", e);
                return [];
            }
        }

        function saveCart(cart) {
            try {
                localStorage.setItem(CART_KEY, JSON.stringify(cart));
            } catch (e) {
                console.error("Gagal menyimpan keranjang ke LocalStorage:", e);
            }
            updateCartUI();
            renderCart();
        }

        function updateCartUI() {
            const cart = getCart();
            const totalCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * Number(item.quantity || 0), 0);

            if (cartCount) cartCount.textContent = totalCount;
            if (cartTotal) cartTotal.textContent = formatPrice(totalPrice);
            if (cartModalTotal) cartModalTotal.textContent = formatPrice(totalPrice);
        }

        function formatPrice(price) {
            return `$${(Number(price) || 0).toFixed(2)}`;
        }

        function escapeHtml(value) {
            return String(value ?? "")
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#039;");
        }

        function addToCart(product) {
            if (!product || !product.id) return;

            const cart = getCart();
            const existing = cart.find(item => item.id === product.id);

            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    thumbnail: product.thumbnail,
                    quantity: 1
                });
            }
            saveCart(cart);
            alert(`"${product.title}" berhasil ditambahkan ke keranjang!`);
        }

        function changeQuantity(productId, amount) {
            const cart = getCart();
            const item = cart.find(function (cartItem) {
                return String(cartItem.id) === String(productId);
            });
            if (!item) return;

            item.quantity = Number(item.quantity || 0) + amount;
            const updatedCart = cart.filter(function (cartItem) {
                return Number(cartItem.quantity) > 0;
            });
            saveCart(updatedCart);
        }

        function removeFromCart(productId) {
            const updatedCart = getCart().filter(function (item) {
                return String(item.id) !== String(productId);
            });
            saveCart(updatedCart);
        }

        function renderCart() {
            if (!cartItems) return;
            const cart = getCart();
            cartItems.innerHTML = cart.map(function (item) {
                const quantity = Number(item.quantity || 0);
                return `
                    <div class="cart-item">
                        <img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title)}">
                        <div>
                            <p class="cart-item-title">${escapeHtml(item.title)}</p>
                            <p class="cart-item-price">${formatPrice(item.price)} x ${quantity}</p>
                            <div class="cart-item-controls">
                                <button type="button" data-cart-action="decrease" data-product-id="${escapeHtml(item.id)}" aria-label="Kurangi jumlah">-</button>
                                <span>${quantity}</span>
                                <button type="button" data-cart-action="increase" data-product-id="${escapeHtml(item.id)}" aria-label="Tambah jumlah">+</button>
                                <button type="button" class="cart-item-remove" data-cart-action="remove" data-product-id="${escapeHtml(item.id)}">Hapus</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
            cartEmpty.hidden = cart.length !== 0;
            clearCartBtn.disabled = cart.length === 0;
        }

        function sortProducts(products) {
            const sortedProducts = products.slice();
            const sortValue = sortSelect ? sortSelect.value : "featured";

            if (sortValue === "price-asc") {
                sortedProducts.sort(function (first, second) { return first.price - second.price; });
            }
            if (sortValue === "price-desc") {
                sortedProducts.sort(function (first, second) { return second.price - first.price; });
            }
            if (sortValue === "rating-desc") {
                sortedProducts.sort(function (first, second) { return second.rating - first.rating; });
            }
            return sortedProducts;
        }

        function renderProducts() {
            if (!productGrid) return;

            const productsToRender = sortProducts(filteredProducts).slice(0, visibleProductCount);
            if (productsToRender.length === 0) {
                productGrid.innerHTML = "<p class=\"placeholder-note\">Produk tidak ditemukan.</p>";
            } else {
                productGrid.innerHTML = productsToRender.map(function (product) {
                    const discount = product.discountPercentage
                        ? `<span class="product-discount">-${Math.round(product.discountPercentage)}%</span>`
                        : "";
                    return `
                        <article class="product-card" data-product-json="${escapeHtml(JSON.stringify(product))}">
                            <div class="product-image-wrap">
                                ${discount}
                                <img src="${escapeHtml(product.thumbnail)}" alt="${escapeHtml(product.title)}" class="product-image">
                            </div>
                            <div class="product-card-body">
                                <p class="product-category">${escapeHtml(product.category)}</p>
                                <h3>${escapeHtml(product.title)}</h3>
                                <p class="product-price">${formatPrice(product.price)}</p>
                                <p class="product-rating">Rating ${Number(product.rating || 0).toFixed(1)}</p>
                                <button type="button" class="btn-add-card">Tambah ke Keranjang</button>
                            </div>
                        </article>
                    `;
                }).join("");
            }

            const hasMoreProducts = visibleProductCount < filteredProducts.length;
            if (loadMoreBtn) loadMoreBtn.hidden = !hasMoreProducts;
            if (productStatus) {
                productStatus.textContent = `${productsToRender.length} dari ${filteredProducts.length} produk ditampilkan`;
                productStatus.hidden = filteredProducts.length === 0;
            }
        }

        function updateProductResults(resetVisibleCount) {
            const query = currentSearch.toLowerCase();
            const selectedCategory = categoryFilter ? categoryFilter.value : "all";

            filteredProducts = allProducts.filter(function (product) {
                const searchableText = `${product.title} ${product.category}`.toLowerCase();
                const matchesSearch = searchableText.includes(query);
                const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
                return matchesSearch && matchesCategory;
            });

            if (resetVisibleCount) visibleProductCount = PRODUCTS_PER_PAGE;
            renderProducts();
        }

        function fillCategoryFilter() {
            if (!categoryFilter) return;
            const categories = allProducts
                .map(function (product) { return product.category; })
                .filter(function (category, index, list) { return category && list.indexOf(category) === index; })
                .sort();

            categoryFilter.innerHTML = '<option value="all">Semua kategori</option>';
            categories.forEach(function (category) {
                categoryFilter.insertAdjacentHTML(
                    "beforeend",
                    `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
                );
            });
        }

        async function loadProducts() {
            if (productStatus) {
                productStatus.textContent = "Memuat produk...";
                productStatus.hidden = false;
            }

            try {
                const response = await fetch(PRODUCTS_URL);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                allProducts = Array.isArray(data.products) ? data.products : [];
                fillCategoryFilter();
                updateProductResults(true);
            } catch (error) {
                console.error("Gagal mengambil data produk:", error);
                if (productGrid) productGrid.innerHTML = "";
                if (loadMoreBtn) loadMoreBtn.hidden = true;
                if (productStatus) productStatus.hidden = true;
                if (window.AppError) window.AppError.show("Produk gagal dimuat. Periksa koneksi internet lalu coba lagi.");
            }
        }

        document.addEventListener("catalog:search", function (e) {
            currentSearch = e.detail.query || "";
            updateProductResults(true);
        });

        if (categoryFilter) {
            categoryFilter.addEventListener("change", function () {
                updateProductResults(true);
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener("change", function () {
                renderProducts();
            });
        }

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener("click", function () {
                visibleProductCount += PRODUCTS_PER_PAGE;
                renderProducts();
            });
        }

        function openModal(product) {
            if (!modal || !modalContent) return;

            modalContent.innerHTML = `
                <img src="${escapeHtml(product.thumbnail)}" alt="${escapeHtml(product.title || 'Produk')}" class="modal-product-image">
                <h3>${escapeHtml(product.title || 'Tanpa Nama')}</h3>
                <p><strong>Brand:</strong> ${escapeHtml(product.brand || 'N/A')}</p>
                <p><strong>Kategori:</strong> ${escapeHtml(product.category || 'Umum')}</p>
                <p><strong>Stok Tersedia:</strong> ${escapeHtml(product.stock ?? 'N/A')}</p>
                <p><strong>Harga:</strong> ${formatPrice(product.price)}</p>
                <p><strong>Rating:</strong> ${escapeHtml(product.rating ?? 'N/A')}</p>
                <p class="modal-product-description">${escapeHtml(product.description || '')}</p>
                <button type="button" class="btn-add" id="addFromModal">Tambah ke Keranjang</button>
            `;

            modal.hidden = false;

            const addBtn = document.getElementById("addFromModal");
            if (addBtn) {
                addBtn.addEventListener("click", function () {
                    addToCart(product);
                });
            }
        }

        if (modalClose) {
            modalClose.addEventListener("click", function () {
                if (modal) modal.hidden = true;
            });
        }

        if (cartBtn) {
            cartBtn.addEventListener("click", function () {
                renderCart();
                cartModal.hidden = false;
            });
        }

        if (cartClose) {
            cartClose.addEventListener("click", function () {
                cartModal.hidden = true;
            });
        }

        if (clearCartBtn) {
            clearCartBtn.addEventListener("click", function () {
                saveCart([]);
            });
        }

        if (cartItems) {
            cartItems.addEventListener("click", function (e) {
                const actionButton = e.target.closest("[data-cart-action]");
                if (!actionButton) return;

                const productId = actionButton.dataset.productId;
                const action = actionButton.dataset.cartAction;
                if (action === "increase") changeQuantity(productId, 1);
                if (action === "decrease") changeQuantity(productId, -1);
                if (action === "remove") removeFromCart(productId);
            });
        }

        function closeProductAndCartModals() {
            if (modal) modal.hidden = true;
            if (cartModal) cartModal.hidden = true;
        }

        [modal, cartModal].forEach(function (overlay) {
            if (!overlay) return;
            overlay.addEventListener("click", function (e) {
                if (e.target === overlay) overlay.hidden = true;
            });
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeProductAndCartModals();
        });

        if (productGrid) {
            productGrid.addEventListener("click", function (e) {
                const card = e.target.closest(".product-card");
                if (!card) return;

                let product = {};
                try {
                    product = JSON.parse(card.dataset.productJson || "{}");
                } catch (err) {
                    console.error("Gagal parse data produk dari dataset kartu:", err);
                    return;
                }

                // Jika yang diklik tombol "Tambah ke Keranjang" langsung di kartu
                if (e.target.closest(".btn-add-card")) {
                    e.stopPropagation();
                    addToCart(product);
                    return;
                }

                // Jika area kartu lainnya yang diklik -> Buka Modal
                openModal(product);
            });
        }

        updateCartUI();
    renderCart();
        loadProducts();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();