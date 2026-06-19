const CART_KEY = "ammaChethiCart";
const REVIEW_KEY = "ammaChethiReviews";
const THEME_KEY = "ammaChethiTheme";

const defaultReviews = [
    {
        name: "Ravi Kumar",
        rating: 5,
        message: "The taste feels exactly like food prepared at home."
    },
    {
        name: "Lakshmi",
        rating: 5,
        message: "Amazing Andhra meals and very hygienic service."
    },
    {
        name: "Suresh",
        rating: 5,
        message: "Best homemade food restaurant in the city."
    }
];

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function formatPrice(value) {
    return `Rs. ${Number(value).toLocaleString("en-IN")}`;
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    window.setTimeout(() => toast.classList.add("show"), 50);
    window.setTimeout(() => toast.remove(), 2600);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        };

        return entities[char];
    });
}

function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll(".cart-count").forEach((badge) => {
        badge.textContent = count;
    });
}

function addToCart(name, price) {
    const cart = getCart();
    const existing = cart.find((item) => item.name === name);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price: Number(price), quantity: 1 });
    }

    saveCart(cart);
    showToast(`${name} added to cart`);
}

function initCartButtons() {
    document.querySelectorAll("[data-cart-name]").forEach((button) => {
        button.addEventListener("click", () => {
            addToCart(button.dataset.cartName, button.dataset.cartPrice);
        });
    });
}

function initCartPage() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    const emptyMessage = document.getElementById("cartEmpty");
    const subtotalBox = document.getElementById("subtotal");
    const deliveryBox = document.getElementById("deliveryFee");
    const totalBox = document.getElementById("grandTotal");
    const clearBtn = document.getElementById("clearCart");
    const checkoutBtn = document.getElementById("checkoutBtn");

    function renderCart() {
        const cart = getCart();
        cartItems.innerHTML = "";

        if (cart.length === 0) {
            emptyMessage.hidden = false;
            clearBtn.disabled = true;
            checkoutBtn.disabled = true;
            subtotalBox.textContent = formatPrice(0);
            deliveryBox.textContent = formatPrice(0);
            totalBox.textContent = formatPrice(0);
            return;
        }

        emptyMessage.hidden = true;
        clearBtn.disabled = false;
        checkoutBtn.disabled = false;

        let subtotal = 0;

        cart.forEach((item, index) => {
            subtotal += item.price * item.quantity;

            const row = document.createElement("article");
            row.className = "cart-item";
            row.innerHTML = `
                <div>
                    <h3>${escapeHTML(item.name)}</h3>
                    <p>${formatPrice(item.price)} each</p>
                </div>
                <div class="quantity-control" aria-label="Quantity controls for ${escapeHTML(item.name)}">
                    <button type="button" data-cart-action="decrease" data-index="${index}" aria-label="Decrease ${escapeHTML(item.name)}">-</button>
                    <strong>${item.quantity}</strong>
                    <button type="button" data-cart-action="increase" data-index="${index}" aria-label="Increase ${escapeHTML(item.name)}">+</button>
                </div>
                <button class="remove-item" type="button" data-cart-action="remove" data-index="${index}">Remove</button>
            `;
            cartItems.appendChild(row);
        });

        const delivery = subtotal >= 499 ? 0 : 40;
        subtotalBox.textContent = formatPrice(subtotal);
        deliveryBox.textContent = delivery === 0 ? "Free" : formatPrice(delivery);
        totalBox.textContent = formatPrice(subtotal + delivery);
    }

    cartItems.addEventListener("click", (event) => {
        const button = event.target.closest("[data-cart-action]");
        if (!button) return;

        const cart = getCart();
        const index = Number(button.dataset.index);
        const action = button.dataset.cartAction;

        if (action === "increase") {
            cart[index].quantity += 1;
        }

        if (action === "decrease") {
            cart[index].quantity -= 1;
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
        }

        if (action === "remove") {
            cart.splice(index, 1);
        }

        saveCart(cart);
        renderCart();
    });

    clearBtn.addEventListener("click", () => {
        saveCart([]);
        renderCart();
        showToast("Cart cleared");
    });

    checkoutBtn.addEventListener("click", () => {
        if (getCart().length === 0) return;
        saveCart([]);
        renderCart();
        showToast("Order placed successfully");
    });

    renderCart();
}

function initMenuFilters() {
    const searchInput = document.getElementById("searchFood");
    const foodCards = Array.from(document.querySelectorAll(".food-card"));
    const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
    const emptyState = document.getElementById("menuEmpty");
    const menuColumns = Array.from(document.querySelectorAll("[data-menu-column]"));
    const menuLists = new Map(
        Array.from(document.querySelectorAll("[data-menu-list]")).map((list) => [list.dataset.menuList, list])
    );
    const countLabels = new Map(
        Array.from(document.querySelectorAll("[data-column-count]")).map((label) => [label.dataset.columnCount, label])
    );

    if (!foodCards.length) return;

    let activeFilter = "all";

    if (menuLists.size > 0) {
        foodCards.forEach((card) => {
            const list = menuLists.get(card.dataset.category);

            if (list && card.parentElement !== list) {
                list.appendChild(card);
            }
        });
    }

    function applyFilters() {
        const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : "";
        let visibleCount = 0;

        foodCards.forEach((card) => {
            const title = card.querySelector("h3").textContent.toLowerCase();
            const category = card.dataset.category;
            const matchesSearch = title.includes(searchValue);
            const matchesCategory = activeFilter === "all" || category === activeFilter;
            const shouldShow = matchesSearch && matchesCategory;

            card.classList.toggle("hidden", !shouldShow);
            if (shouldShow) visibleCount += 1;
        });

        menuColumns.forEach((column) => {
            const categoryCards = Array.from(column.querySelectorAll(".food-card"));
            const visibleItems = categoryCards.filter((card) => {
                return !card.classList.contains("hidden");
            });
            const hasVisibleItems = visibleItems.length > 0;
            const countLabel = countLabels.get(column.dataset.menuColumn);

            column.classList.toggle("hidden", !hasVisibleItems);

            if (countLabel) {
                const count = visibleItems.length;
                countLabel.textContent = `${count} ${count === 1 ? "item" : "items"}`;
            }
        });

        if (emptyState) {
            emptyState.hidden = visibleCount > 0;
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter;
            filterButtons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            applyFilters();
        });
    });

    applyFilters();
}

function initGallery() {
    const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
    const galleryButtons = Array.from(document.querySelectorAll("[data-gallery-filter]"));
    const lightbox = document.getElementById("galleryLightbox");

    if (!galleryItems.length) return;

    galleryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.galleryFilter;
            galleryButtons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");

            galleryItems.forEach((item) => {
                const shouldShow = filter === "all" || item.dataset.galleryCategory === filter;
                item.classList.toggle("hidden", !shouldShow);
            });
        });
    });

    if (!lightbox) return;

    const lightboxImage = lightbox.querySelector("img");
    const closeBtn = lightbox.querySelector(".lightbox-close");

    galleryItems.forEach((item) => {
        item.addEventListener("click", () => {
            const image = item.querySelector("img");
            lightboxImage.src = image.src;
            lightboxImage.alt = image.alt;
            lightbox.classList.add("open");
            lightbox.setAttribute("aria-hidden", "false");
        });
    });

    function closeLightbox() {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
        lightboxImage.src = "";
    }

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && lightbox.classList.contains("open")) {
            closeLightbox();
        }
    });
}

function getReviews() {
    return JSON.parse(localStorage.getItem(REVIEW_KEY)) || defaultReviews;
}

function saveReviews(reviews) {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
}

function stars(rating) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function initReviews() {
    const reviewList = document.getElementById("reviewList");
    const reviewForm = document.getElementById("reviewForm");

    if (!reviewList && !reviewForm) return;

    function renderReviews() {
        if (!reviewList) return;

        reviewList.innerHTML = "";
        getReviews().forEach((review) => {
            const card = document.createElement("article");
            card.className = "review-card";
            card.innerHTML = `
                <div class="stars" aria-label="${review.rating} out of 5 stars">${stars(review.rating)}</div>
                <p>${escapeHTML(review.message)}</p>
                <h3>- ${escapeHTML(review.name)}</h3>
            `;
            reviewList.appendChild(card);
        });
    }

    if (reviewForm) {
        reviewForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const name = document.getElementById("reviewName").value.trim();
            const rating = Number(document.getElementById("reviewRating").value);
            const message = document.getElementById("reviewMessage").value.trim();

            if (!name || !message) {
                showToast("Please complete the review form");
                return;
            }

            const reviews = getReviews();
            reviews.unshift({ name, rating, message });
            saveReviews(reviews);
            renderReviews();
            reviewForm.reset();
            showToast("Review submitted. Thank you");
        });
    }

    renderReviews();
}

function initContactForms() {
    const contactForm = document.getElementById("contactForm");
    const bookingForm = document.getElementById("bookingForm");

    if (contactForm) {
        contactForm.addEventListener("submit", (event) => {
            event.preventDefault();
            contactForm.reset();
            showToast("Message sent successfully");
        });
    }

    if (bookingForm) {
        bookingForm.addEventListener("submit", (event) => {
            event.preventDefault();
            bookingForm.reset();
            showToast("Table reserved successfully");
        });
    }
}

function initTheme() {
    const darkBtn = document.getElementById("darkMode");
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }

    function syncIcon() {
        if (!darkBtn) return;
        darkBtn.innerHTML = document.body.classList.contains("dark")
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
    }

    syncIcon();

    if (darkBtn) {
        darkBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark");
            localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
            syncIcon();
        });
    }
}

function initTopButton() {
    const topBtn = document.getElementById("topBtn");
    if (!topBtn) return;

    function toggleTopButton() {
        topBtn.style.display = window.scrollY > 280 ? "inline-flex" : "none";
    }

    window.addEventListener("scroll", toggleTopButton);
    topBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
    toggleTopButton();
}

function initActiveNav() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach((link) => {
        const linkPage = link.getAttribute("href");
        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });
}

function initCounters() {
    const counters = document.querySelectorAll("[data-target]");
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const counter = entry.target;
            const target = Number(counter.dataset.target);
            const suffix = counter.dataset.suffix || "+";
            const decimal = target % 1 !== 0;
            let current = 0;
            const steps = 70;
            const increment = target / steps;

            const timer = window.setInterval(() => {
                current += increment;

                if (current >= target) {
                    current = target;
                    window.clearInterval(timer);
                }

                counter.textContent = `${decimal ? current.toFixed(1) : Math.ceil(current)}${suffix}`;
            }, 18);

            observer.unobserve(counter);
        });
    }, { threshold: 0.45 });

    counters.forEach((counter) => observer.observe(counter));
}

function initRevealAnimation() {
    const elements = document.querySelectorAll(".food-card, .feature-card, .review-card, .stat-box, .gallery-item, .cart-item");
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach((element) => {
        element.style.opacity = "0";
        element.style.transform = "translateY(28px)";
        element.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        observer.observe(element);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initActiveNav();
    updateCartCount();
    initCartButtons();
    initCartPage();
    initMenuFilters();
    initGallery();
    initReviews();
    initContactForms();
    initTopButton();
    initCounters();
    initRevealAnimation();
});
