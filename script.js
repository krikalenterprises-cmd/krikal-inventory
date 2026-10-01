/* =========================================================
   KRIKAL INVENTORY MANAGER
   COMPLETE CLEAN JAVASCRIPT
   LOGIN + GOOGLE SHEET + DASHBOARD + SETTINGS
   ========================================================= */

"use strict";


/* =========================================================
   GOOGLE APPS SCRIPT API
   ========================================================= */

const API_URL =
    "https://script.google.com/macros/s/AKfycbwr5ZD74X1UrZD3cJTRD7RaA5pAVKlEbDCPmLLANP3-KXQOCnQQJGfqgb9PjgYbSM1r/exec";


/* =========================================================
   LOGIN
   ========================================================= */

const LOGIN_USERNAME = "admin";
const LOGIN_PASSWORD = "krikal123";
const LOGIN_KEY = "krikalLoggedIn";


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let inventoryData = [];
let filteredData = [];

let autoRefreshTimer = null;

let initialized = false;


/* =========================================================
   DEFAULT SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {

    theme: true,

    glow: true,

    animations: true,

    lowStockLimit: 5,

    showOutStock: true,

    showStatus: true,

    autoRefresh: false,

    refreshInterval: 60000,

    lowStockAlerts: true,

    outStockAlerts: true,

    browserNotifications: false,

    showCategory: true,

    showStock: true,

    showCategoryIcons: true,

    compactTable: false,

    rememberLastPage: true,

    defaultPage: "home",

    confirmRefresh: false,

    dateFormat: "long",

    dashboardLock: false

};


let settings = {
    ...DEFAULT_SETTINGS
};


/* =========================================================
   SHORT DOM HELPER
   ========================================================= */

function $(id) {

    return document.getElementById(id);

}


/* =========================================================
   DOM VARIABLES
   ========================================================= */

let loginScreen;
let loginForm;
let loginUsername;
let loginPassword;
let loginError;
let togglePassword;

let app;

let sidebar;
let sidebarOverlay;
let mobileMenu;

let refreshBtn;
let logoutBtn;

let currentPageLabel;

let dashboardInventoryBody;
let inventoryBody;

let searchInput;
let categoryFilter;
let inventoryCount;

let dashboardDate;
let lastUpdated;
let settingsLastSync;


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


function init() {

    if (initialized) {
        return;
    }

    initialized = true;


    initializeDOM();

    loadSettings();

    setupLogin();

    setupNavigation();

    setupMobileMenu();

    setupSearch();

    setupSettings();

    setupKeyboardShortcuts();

    setupProInventoryFeatures();

    updateDate();

    checkLogin();

}


/* =========================================================
   INITIALIZE DOM
   ========================================================= */

function initializeDOM() {

    loginScreen =
        $("loginScreen");

    loginForm =
        $("loginForm");

    loginUsername =
        $("loginUsername");

    loginPassword =
        $("loginPassword");

    loginError =
        $("loginError");

    togglePassword =
        $("togglePassword");


    app =
        $("app");


    sidebar =
        $("sidebar");

    sidebarOverlay =
        $("sidebarOverlay");

    mobileMenu =
        $("mobileMenu");


    refreshBtn =
        $("refreshBtn");

    logoutBtn =
        $("logoutBtn");


    currentPageLabel =
        $("currentPageLabel");


    dashboardInventoryBody =
        $("dashboardInventoryBody");

    inventoryBody =
        $("inventoryBody");


    searchInput =
        $("searchInput");

    categoryFilter =
        $("categoryFilter");

    inventoryCount =
        $("inventoryCount");


    dashboardDate =
        $("dashboardDate");

    lastUpdated =
        $("lastUpdated");

    settingsLastSync =
        $("settingsLastSync");

}


/* =========================================================
   LOGIN SETUP
   ========================================================= */

function setupLogin() {

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            togglePasswordVisibility
        );

    }

}


/* =========================================================
   PASSWORD TOGGLE
   ========================================================= */

function togglePasswordVisibility() {

    if (!loginPassword) {
        return;
    }


    if (
        loginPassword.type ===
        "password"
    ) {

        loginPassword.type =
            "text";


        if (togglePassword) {

            togglePassword.textContent =
                "🙈";

        }

    } else {

        loginPassword.type =
            "password";


        if (togglePassword) {

            togglePassword.textContent =
                "👁";

        }

    }

}


/* =========================================================
   CHECK LOGIN
   ========================================================= */

function checkLogin() {

    let loggedIn = false;


    try {

        loggedIn =
            localStorage.getItem(
                LOGIN_KEY
            ) === "true";

    } catch (error) {

        console.warn(
            "Login storage unavailable:",
            error
        );

    }


    if (loggedIn) {

        showApp();

    } else {

        showLogin();

    }

}


/* =========================================================
   LOGIN
   ========================================================= */

function handleLogin(event) {

    event.preventDefault();


    const username =
        loginUsername
            ? String(
                loginUsername.value
            ).trim()
            : "";


    const password =
        loginPassword
            ? String(
                loginPassword.value
            )
            : "";


    if (
        username ===
            LOGIN_USERNAME &&
        password ===
            LOGIN_PASSWORD
    ) {

        try {

            localStorage.setItem(
                LOGIN_KEY,
                "true"
            );

        } catch (error) {

            console.warn(
                "Could not save login:",
                error
            );

        }


        if (loginError) {

            loginError.textContent =
                "";

        }


        showApp();


        showToast(
            "✓ Login successful"
        );

    } else {

        if (loginError) {

            loginError.textContent =
                "Invalid username or password.";

        }


        if (loginPassword) {

            loginPassword.value =
                "";

            loginPassword.focus();

        }

    }

}


/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showLogin() {

    if (loginScreen) {

        loginScreen.classList.remove(
            "hidden"
        );

        loginScreen.style.display =
            "";

    }


    if (app) {

        app.classList.add(
            "hidden"
        );

        app.style.display =
            "none";

    }

}


/* =========================================================
   SHOW APP
   ========================================================= */

function showApp() {

    if (loginScreen) {

        loginScreen.classList.add(
            "hidden"
        );

        loginScreen.style.display =
            "none";

    }


    if (app) {

        app.classList.remove(
            "hidden"
        );

        app.style.display =
            "";

    }


    let page =
        "home";


    if (
        settings.rememberLastPage
    ) {

        try {

            page =
                localStorage.getItem(
                    "krikalLastPage"
                ) ||
                settings.defaultPage ||
                "home";

        } catch (error) {

            page =
                settings.defaultPage ||
                "home";

        }

    } else {

        page =
            settings.defaultPage ||
            "home";

    }


    openPage(
        page,
        false
    );


    setupAutoRefresh();


    loadInventory();

}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    if (!logoutBtn) {
        return;
    }


    logoutBtn.addEventListener(
        "click",
        function () {

            if (
                !confirm(
                    "Are you sure you want to logout?"
                )
            ) {

                return;

            }


            try {

                localStorage.removeItem(
                    LOGIN_KEY
                );

            } catch (error) {

                console.warn(
                    "Logout error:",
                    error
                );

            }


            stopAutoRefresh();


            inventoryData = [];

            filteredData = [];


            showLogin();


            if (loginForm) {

                loginForm.reset();

            }


            if (loginError) {

                loginError.textContent =
                    "";

            }


            showToast(
                "Logged out successfully"
            );

        }
    );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const page =
                            button.dataset.page;


                        if (!page) {
                            return;
                        }


                        openPage(
                            page,
                            true
                        );

                    }
                );

            }
        );

}


/* =========================================================
   OPEN PAGE
   ========================================================= */

function openPage(
    pageName,
    remember
) {

    if (!pageName) {

        pageName =
            "home";

    }


    if (
        typeof remember ===
        "undefined"
    ) {

        remember =
            true;

    }


    let target =
        $(pageName + "Page");


    if (!target) {

        pageName =
            "home";

        target =
            $("homePage");

    }


    document
        .querySelectorAll(
            ".nav-item[data-page]"
        )
        .forEach(
            function (item) {

                item.classList.toggle(
                    "active",
                    item.dataset.page ===
                        pageName
                );

            }
        );


    document
        .querySelectorAll(
            ".page"
        )
        .forEach(
            function (page) {

                page.classList.remove(
                    "active"
                );

            }
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    const labels = {

        home:
            "Dashboard",

        inventory:
            "Inventory",

        settings:
            "Settings"

    };


    if (currentPageLabel) {

        currentPageLabel.textContent =
            labels[pageName] ||
            "Dashboard";

    }


    if (
        remember &&
        settings.rememberLastPage
    ) {

        try {

            localStorage.setItem(
                "krikalLastPage",
                pageName
            );

        } catch (error) {

            console.warn(
                "Page storage error:",
                error
            );

        }

    }


    closeSidebar();

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

    if (mobileMenu) {

        mobileMenu.addEventListener(
            "click",
            toggleSidebar
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );

    }

}


function toggleSidebar() {

    if (sidebar) {

        sidebar.classList.toggle(
            "open"
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.classList.toggle(
            "show"
        );

    }

}


function closeSidebar() {

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   DATE
   ========================================================= */

function updateDate() {

    if (!dashboardDate) {
        return;
    }


    const now =
        new Date();


    if (
        settings.dateFormat ===
        "short"
    ) {

        dashboardDate.textContent =
            now.toLocaleDateString(
                "en-GB"
            );

    } else {

        dashboardDate.textContent =
            now.toLocaleDateString(
                "en-IN",
                {
                    weekday:
                        "long",

                    day:
                        "numeric",

                    month:
                        "long",

                    year:
                        "numeric"
                }
            );

    }

}


/* =========================================================
   GOOGLE SHEET LOAD
   ========================================================= */

async function loadInventory() {

    showLoading();


    setConnectionStatus(
        "Connecting..."
    );


    try {

        const requestURL =
            API_URL +
            "?t=" +
            Date.now();


        console.log(
            "===================================="
        );

        console.log(
            "KRIKAL API REQUEST"
        );

        console.log(
            requestURL
        );


        const response =
            await fetch(
                requestURL,
                {
                    method:
                        "GET",

                    cache:
                        "no-store",

                    redirect:
                        "follow"
                }
            );


        console.log(
            "API HTTP STATUS:",
            response.status
        );


        console.log(
            "API CONTENT TYPE:",
            response.headers.get(
                "content-type"
            )
        );


        if (!response.ok) {

            throw new Error(
                "HTTP Error " +
                response.status
            );

        }


        /*
         * Read as text first.
         *
         * This is safer than response.json()
         * because some Google Apps Script
         * deployments may return JSON
         * with a text content type.
         */

        const rawText =
            await response.text();


        console.log(
            "RAW GOOGLE SHEET RESPONSE:"
        );

        console.log(
            rawText
        );


        let result;


        try {

            result =
                JSON.parse(
                    rawText
                );

        } catch (jsonError) {

            console.error(
                "JSON PARSE ERROR:",
                jsonError
            );


            throw new Error(
                "Google Sheet API did not return valid JSON."
            );

        }


        console.log(
            "PARSED GOOGLE SHEET RESPONSE:"
        );

        console.log(
            result
        );


        inventoryData =
            normalizeInventory(
                result
            );


        console.log(
            "FINAL NORMALIZED INVENTORY:"
        );

        console.table(
            inventoryData
        );


        filteredData =
            inventoryData.slice();


        populateCategories();


        applyFilters();


        updateDashboard();


        updateLastUpdated();


        setConnectionStatus(
            "Connected"
        );


        runStockAlerts();


        console.log(
            "KRIKAL INVENTORY LOADED:",
            inventoryData.length,
            "items"
        );

        console.log(
            "===================================="
        );


    } catch (error) {

        console.error(
            "===================================="
        );

        console.error(
            "KRIKAL GOOGLE SHEET ERROR:"
        );

        console.error(
            error
        );

        console.error(
            "===================================="
        );


        inventoryData =
            [];

        filteredData =
            [];


        updateDashboard();


        showError();


        setConnectionStatus(
            "Connection Error"
        );

    }

}


/* =========================================================
   NORMALIZE GOOGLE SHEET DATA
   ========================================================= */

function normalizeInventory(result) {

    let rows = [];


    /*
     * Direct array
     */

    if (
        Array.isArray(result)
    ) {

        rows =
            result;

    }


    /*
     * data array
     */

    else if (
        result &&
        Array.isArray(
            result.data
        )
    ) {

        rows =
            result.data;

    }


    /*
     * items array
     */

    else if (
        result &&
        Array.isArray(
            result.items
        )
    ) {

        rows =
            result.items;

    }


    /*
     * inventory array
     */

    else if (
        result &&
        Array.isArray(
            result.inventory
        )
    ) {

        rows =
            result.inventory;

    }


    /*
     * records array
     */

    else if (
        result &&
        Array.isArray(
            result.records
        )
    ) {

        rows =
            result.records;

    }


    /*
     * rows array
     */

    else if (
        result &&
        Array.isArray(
            result.rows
        )
    ) {

        rows =
            result.rows;

    }


    /*
     * result array
     */

    else if (
        result &&
        Array.isArray(
            result.result
        )
    ) {

        rows =
            result.result;

    }


    /*
     * No usable array
     */

    if (
        !Array.isArray(rows)
    ) {

        console.warn(
            "No inventory array found in API response."
        );

        return [];

    }


    console.log(
        "ROWS RECEIVED:",
        rows
    );


    /*
     * Convert rows
     */

    let normalized =
        rows
            .map(
                function (
                    item,
                    index
                ) {

                    /*
                     * ARRAY FORMAT
                     *
                     * Example:
                     * [
                     *   "iPhone Cover",
                     *   "Mobile Cover",
                     *   10
                     * ]
                     */

                    if (
                        Array.isArray(
                            item
                        )
                    ) {

                        return {

                            id:
                                index,

                            product:
                                String(
                                    item[0] ??
                                    ""
                                ).trim(),

                            category:
                                String(
                                    item[1] ??
                                    ""
                                ).trim(),

                            stock:
                                toNumber(
                                    item[2]
                                )

                        };

                    }


                    /*
                     * OBJECT FORMAT
                     */

                    if (
                        !item ||
                        typeof item !==
                            "object"
                    ) {

                        return null;

                    }


                    const product =
                        getObjectValue(
                            item,
                            [
                                "product",
                                "Product",
                                "PRODUCT",

                                "product name",
                                "Product Name",
                                "PRODUCT NAME",

                                "item",
                                "Item",
                                "ITEM",

                                "item name",
                                "Item Name",
                                "ITEM NAME",

                                "name",
                                "Name",
                                "NAME"
                            ]
                        );


                    const category =
                        getObjectValue(
                            item,
                            [
                                "category",
                                "Category",
                                "CATEGORY",

                                "product category",
                                "Product Category",
                                "PRODUCT CATEGORY",

                                "category name",
                                "Category Name",
                                "CATEGORY NAME"
                            ]
                        );


                    const stock =
                        getObjectValue(
                            item,
                            [
                                "stock",
                                "Stock",
                                "STOCK",

                                "quantity",
                                "Quantity",
                                "QUANTITY",

                                "stock quantity",
                                "Stock Quantity",
                                "STOCK QUANTITY",

                                "qty",
                                "Qty",
                                "QTY"
                            ]
                        );


                    return {

                        id:
                            getObjectValue(
                                item,
                                [
                                    "id",
                                    "ID",
                                    "Id"
                                ]
                            ) ??
                            index,

                        product:
                            String(
                                product ??
                                ""
                            ).trim(),

                        category:
                            String(
                                category ??
                                ""
                            ).trim(),

                        stock:
                            toNumber(
                                stock
                            )

                    };

                }
            );


    /*
     * Remove empty rows
     */

    normalized =
        normalized.filter(
            function (item) {

                return (
                    item &&
                    item.product !== ""
                );

            }
        );


    /*
     * Remove header row if
     * Google Sheet returned headers.
     */

    normalized =
        normalized.filter(
            function (item) {

                const product =
                    item.product
                        .toLowerCase()
                        .trim();

                const category =
                    item.category
                        .toLowerCase()
                        .trim();

                const headerProducts = [

                    "product",
                    "product name",
                    "item",
                    "item name",
                    "name"

                ];


                const headerCategories = [

                    "category",
                    "product category",
                    "category name"

                ];


                const isHeader =
                    (
                        headerProducts.includes(
                            product
                        )
                    ) &&
                    (
                        category === "" ||
                        headerCategories.includes(
                            category
                        )
                    );


                return !isHeader;

            }
        );


    return normalized;

}


/* =========================================================
   GET OBJECT VALUE
   SUPPORTS SPACES / CASE / NORMALIZED KEYS
   ========================================================= */

function getObjectValue(
    object,
    keys
) {

    if (
        !object ||
        typeof object !==
            "object"
    ) {

        return undefined;

    }


    /*
     * First exact key lookup
     */

    for (
        let i = 0;
        i < keys.length;
        i++
    ) {

        const key =
            keys[i];


        if (
            Object.prototype.hasOwnProperty.call(
                object,
                key
            )
        ) {

            return object[key];

        }

    }


    /*
     * Then normalized key lookup
     */

    const objectKeys =
        Object.keys(
            object
        );


    for (
        let i = 0;
        i < keys.length;
        i++
    ) {

        const wanted =
            normalizeKey(
                keys[i]
            );


        for (
            let j = 0;
            j < objectKeys.length;
            j++
        ) {

            const actual =
                objectKeys[j];


            if (
                normalizeKey(
                    actual
                ) ===
                wanted
            ) {

                return object[actual];

            }

        }

    }


    return undefined;

}


/* =========================================================
   NORMALIZE KEY
   ========================================================= */

function normalizeKey(value) {

    return String(
        value ?? ""
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        );

}


/* =========================================================
   NUMBER CONVERTER
   ========================================================= */

function toNumber(value) {

    if (
        typeof value ===
        "number"
    ) {

        return Number.isFinite(
            value
        )
            ? value
            : 0;

    }


    if (
        value ===
        null ||
        typeof value ===
        "undefined"
    ) {

        return 0;

    }


    const cleaned =
        String(
            value
        )
            .replace(
                /,/g,
                ""
            )
            .replace(
                /[^\d.-]/g,
                ""
            )
            .trim();


    if (
        cleaned === ""
    ) {

        return 0;

    }


    const number =
        Number(
            cleaned
        );


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function populateCategories() {

    if (!categoryFilter) {
        return;
    }


    const currentValue =
        categoryFilter.value;


    const categories =
        [
            ...new Set(
                inventoryData
                    .map(
                        function (item) {

                            return String(
                                item.category ||
                                ""
                            ).trim();

                        }
                    )
                    .filter(Boolean)
            )
        ];


    categories.sort(
        function (a, b) {

            return a.localeCompare(
                b
            );

        }
    );


    categoryFilter.innerHTML =
        "";


    const allOption =
        document.createElement(
            "option"
        );


    allOption.value =
        "";

    allOption.textContent =
        "All Categories";


    categoryFilter.appendChild(
        allOption
    );


    categories.forEach(
        function (category) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category;


            option.textContent =
                category;


            categoryFilter.appendChild(
                option
            );

        }
    );


    if (
        currentValue &&
        categories.includes(
            currentValue
        )
    ) {

        categoryFilter.value =
            currentValue;

    } else {

        categoryFilter.value =
            "";

    }

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            applyFilters
        );

    }

}


/* =========================================================
   FILTER INVENTORY
   ========================================================= */

function applyFilters() {

    const search =
        searchInput
            ? String(
                searchInput.value
            )
                .toLowerCase()
                .trim()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "";

    const statusFilter = document.getElementById("statusFilter");
    const sortFilter = document.getElementById("sortFilter");
    const selectedStatus = statusFilter ? statusFilter.value : "";


    filteredData =
        inventoryData.filter(
            function (item) {

                const product =
                    String(
                        item.product ||
                        ""
                    )
                        .toLowerCase()
                        .trim();


                const itemCategory =
                    String(
                        item.category ||
                        ""
                    )
                        .toLowerCase()
                        .trim();


                const searchMatch =
                    !search ||
                    product.includes(
                        search
                    ) ||
                    itemCategory.includes(
                        search
                    );


                const categoryMatch =
                    !category ||
                    item.category ===
                        category;


                const stockMatch =
                    settings.showOutStock ||
                    item.stock > 0;

                const statusMatch =
                    !selectedStatus ||
                    getStatus(item.stock).className === selectedStatus;


                return (
                    searchMatch &&
                    categoryMatch &&
                    stockMatch &&
                    statusMatch
                );

            }
        );

    const sortValue = sortFilter ? sortFilter.value : "default";
    if (sortValue !== "default") {
        filteredData.sort(function(a, b) {
            if (sortValue === "name-asc") return a.product.localeCompare(b.product);
            if (sortValue === "name-desc") return b.product.localeCompare(a.product);
            if (sortValue === "stock-high") return b.stock - a.stock;
            if (sortValue === "stock-low") return a.stock - b.stock;
            return 0;
        });
    }

    updateFilterSummary();
    renderInventory();

}


/* =========================================================
   RENDER INVENTORY
   ========================================================= */

function renderInventory() {

    renderTable(
        inventoryBody,
        filteredData
    );


    renderTable(
        dashboardInventoryBody,
        inventoryData.slice(
            0,
            10
        )
    );


    updateInventoryCount();
    updateProInsights();

}


/* =========================================================
   RENDER TABLE
   ========================================================= */

function renderTable(
    tbody,
    data
) {

    if (!tbody) {
        return;
    }


    tbody.innerHTML =
        "";


    if (
        !data ||
        !data.length
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-state"
                >
                    No inventory items found.
                </td>
            </tr>
        `;

        return;

    }


    data.forEach(
        function (item) {

            const row =
                document.createElement(
                    "tr"
                );


            const status =
                getStatus(
                    item.stock
                );


            const icon =
                settings.showCategoryIcons
                    ? getCategoryIcon(
                        item.category
                    )
                    : "";


            const product =
                escapeHTML(
                    item.product
                );


            const category =
                settings.showCategory
                    ? escapeHTML(
                        item.category ||
                        "-"
                    )
                    : "—";


            const stock =
                settings.showStock
                    ? escapeHTML(
                        item.stock
                    )
                    : "—";


            const statusHTML =
                settings.showStatus
                    ? `
                        <span class="status ${status.className}">
                            ${status.label}
                        </span>
                    `
                    : "—";


            row.innerHTML = `

                <td>

                    ${
                        icon
                            ? `
                                <span class="category-icon">
                                    ${icon}
                                </span>
                            `
                            : ""
                    }

                    ${product}

                </td>

                <td>
                    ${category}
                </td>

                <td>
                    <strong>
                        ${stock}
                    </strong>
                </td>

                <td>
                    ${statusHTML}
                </td>

                <td>
                    <span class="view-label">
                        View
                    </span>
                </td>

            `;


            tbody.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   STOCK STATUS
   ========================================================= */

function getStatus(
    stock
) {

    const value =
        toNumber(
            stock
        );


    const limit =
        Math.max(
            0,
            toNumber(
                settings.lowStockLimit
            )
        );


    if (
        value <= 0
    ) {

        return {

            label:
                "Out of Stock",

            className:
                "out-stock"

        };

    }


    if (
        value <= limit
    ) {

        return {

            label:
                "Low Stock",

            className:
                "low-stock"

        };

    }


    return {

        label:
            "Available",

        className:
            "available"

    };

}


/* =========================================================
   CATEGORY ICONS
   ========================================================= */

function getCategoryIcon(
    category
) {

    const text =
        String(
            category ||
            ""
        )
            .toLowerCase();


    if (
        text.includes(
            "cover"
        ) ||
        text.includes(
            "case"
        )
    ) {

        return "📱";

    }


    if (
        text.includes(
            "guard"
        ) ||
        text.includes(
            "glass"
        ) ||
        text.includes(
            "tempered"
        )
    ) {

        return "🛡️";

    }


    if (
        text.includes(
            "charger"
        ) ||
        text.includes(
            "adapter"
        )
    ) {

        return "🔌";

    }


    if (
        text.includes(
            "cable"
        ) ||
        text.includes(
            "wire"
        )
    ) {

        return "🔗";

    }


    if (
        text.includes(
            "earphone"
        ) ||
        text.includes(
            "headphone"
        ) ||
        text.includes(
            "audio"
        )
    ) {

        return "🎧";

    }


    if (
        text.includes(
            "battery"
        ) ||
        text.includes(
            "power"
        )
    ) {

        return "🔋";

    }


    if (
        text.includes(
            "holder"
        ) ||
        text.includes(
            "stand"
        )
    ) {

        return "📐";

    }


    return "📦";

}


/* =========================================================
   UPDATE DASHBOARD
   ========================================================= */

function updateDashboard() {

    const total =
        inventoryData.length;


    let available =
        0;

    let lowStock =
        0;

    let outStock =
        0;


    inventoryData.forEach(
        function (item) {

            const status =
                getStatus(
                    item.stock
                );


            if (
                status.className ===
                "available"
            ) {

                available++;

            } else if (
                status.className ===
                "low-stock"
            ) {

                lowStock++;

            } else {

                outStock++;

            }

        }
    );


    setText(
        "totalItems",
        total
    );


    setText(
        "availableItems",
        available
    );


    setText(
        "lowStockItems",
        lowStock
    );


    setText(
        "outStockItems",
        outStock
    );


    renderTable(
        dashboardInventoryBody,
        inventoryData.slice(
            0,
            10
        )
    );

}


/* =========================================================
   INVENTORY COUNT
   ========================================================= */

function updateInventoryCount() {

    if (!inventoryCount) {
        return;
    }


    const count =
        filteredData.length;


    inventoryCount.textContent =
        count +
        " " +
        (
            count === 1
                ? "item"
                : "items"
        );

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading() {

    const html = `

        <tr>

            <td
                colspan="5"
                class="loading"
            >

                Loading inventory...

            </td>

        </tr>

    `;


    if (inventoryBody) {

        inventoryBody.innerHTML =
            html;

    }


    if (dashboardInventoryBody) {

        dashboardInventoryBody.innerHTML =
            html;

    }

}


/* =========================================================
   ERROR
   ========================================================= */

function showError() {

    const html = `

        <tr>

            <td
                colspan="5"
                class="loading"
            >

                Unable to load inventory.

                <br><br>

                Please refresh and try again.

            </td>

        </tr>

    `;


    if (inventoryBody) {

        inventoryBody.innerHTML =
            html;

    }


    if (dashboardInventoryBody) {

        dashboardInventoryBody.innerHTML =
            html;

    }


    updateInventoryCount();

}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function setConnectionStatus(
    text
) {

    if (lastUpdated) {

        lastUpdated.textContent =
            text;

    }

}


/* =========================================================
   LAST UPDATED
   ========================================================= */

function updateLastUpdated() {

    const time =
        new Date().toLocaleTimeString(
            "en-IN",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );


    if (lastUpdated) {

        lastUpdated.textContent =
            "Updated " +
            time;

    }


    if (settingsLastSync) {

        settingsLastSync.textContent =
            time;

    }

}


/* =========================================================
   REFRESH
   ========================================================= */

function refreshInventory() {

    if (
        settings.confirmRefresh
    ) {

        if (
            !confirm(
                "Refresh inventory now?"
            )
        ) {

            return;

        }

    }


    loadInventory();

}


/* =========================================================
   SETTINGS SETUP
   ========================================================= */

function setupSettings() {

    const settingIds = [

        "themeToggle",

        "glowToggle",

        "animationToggle",

        "lowStockLimit",

        "showOutStock",

        "showStatus",

        "autoRefreshToggle",

        "refreshInterval",

        "lowStockToggle",

        "outStockToggle",

        "browserNotificationToggle",

        "showCategory",

        "showStock",

        "showCategoryIcons",

        "compactTable",

        "rememberLastPage",

        "defaultPage",

        "dateFormat",

        "dashboardLock",

        "confirmRefresh"

    ];


    settingIds.forEach(
        function (id) {

            const element =
                $(id);


            if (!element) {
                return;
            }


            element.addEventListener(
                "change",
                previewSettings
            );

        }
    );


    const saveSettingsButton =
        $("saveSettings");


    if (
        saveSettingsButton
    ) {

        saveSettingsButton.addEventListener(
            "click",
            saveSettings
        );

    }


    const resetSettingsButton =
        $("resetSettings");


    if (
        resetSettingsButton
    ) {

        resetSettingsButton.addEventListener(
            "click",
            resetSettings
        );

    }


    const manualRefresh =
        $("manualRefresh");


    if (
        manualRefresh
    ) {

        manualRefresh.addEventListener(
            "click",
            refreshInventory
        );

    }


    const quickRefresh =
        $("quickRefresh");


    if (
        quickRefresh
    ) {

        quickRefresh.addEventListener(
            "click",
            refreshInventory
        );

    }


    setupLogout();


    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            refreshInventory
        );

    }

}


/* =========================================================
   READ SETTINGS
   ========================================================= */

function readSettingsFromUI() {

    settings.theme =
        checked(
            "themeToggle",
            true
        );


    settings.glow =
        checked(
            "glowToggle",
            true
        );


    settings.animations =
        checked(
            "animationToggle",
            true
        );


    settings.lowStockLimit =
        Math.max(
            0,
            toNumber(
                valueOf(
                    "lowStockLimit",
                    5
                )
            )
        );


    settings.showOutStock =
        checked(
            "showOutStock",
            true
        );


    settings.showStatus =
        checked(
            "showStatus",
            true
        );


    settings.autoRefresh =
        checked(
            "autoRefreshToggle",
            false
        );


    settings.refreshInterval =
        Math.max(
            5000,
            toNumber(
                valueOf(
                    "refreshInterval",
                    60000
                )
            )
        );


    settings.lowStockAlerts =
        checked(
            "lowStockToggle",
            true
        );


    settings.outStockAlerts =
        checked(
            "outStockToggle",
            true
        );


    settings.browserNotifications =
        checked(
            "browserNotificationToggle",
            false
        );


    settings.showCategory =
        checked(
            "showCategory",
            true
        );


    settings.showStock =
        checked(
            "showStock",
            true
        );


    settings.showCategoryIcons =
        checked(
            "showCategoryIcons",
            true
        );


    settings.compactTable =
        checked(
            "compactTable",
            false
        );


    settings.rememberLastPage =
        checked(
            "rememberLastPage",
            true
        );


    settings.defaultPage =
        valueOf(
            "defaultPage",
            "home"
        );


    settings.dateFormat =
        valueOf(
            "dateFormat",
            "long"
        );


    settings.dashboardLock =
        checked(
            "dashboardLock",
            false
        );


    settings.confirmRefresh =
        checked(
            "confirmRefresh",
            false
        );

}


/* =========================================================
   PREVIEW SETTINGS
   ========================================================= */

function previewSettings() {

    readSettingsFromUI();


    applyVisualSettings();


    if (
        settings.browserNotifications
    ) {

        requestBrowserNotifications();

    }

}


/* =========================================================
   APPLY VISUAL SETTINGS
   ========================================================= */

function applyVisualSettings() {

    if (
        document.body
    ) {

        document.body.classList.toggle(
            "no-glow",
            !settings.glow
        );


        document.body.classList.toggle(
            "no-animations",
            !settings.animations
        );


        document.body.classList.toggle(
            "compact-table",
            settings.compactTable
        );


        document.body.classList.toggle(
            "dashboard-locked",
            Boolean(
                settings.dashboardLock
            )
        );

    }


    updateDate();


    if (
        inventoryData.length ||
        filteredData.length
    ) {

        renderInventory();

    }


    setupAutoRefresh();

}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

function saveSettings() {

    readSettingsFromUI();


    try {

        localStorage.setItem(
            "krikalInventorySettings",
            JSON.stringify(
                settings
            )
        );


        applyVisualSettings();


        showToast(
            "✓ Settings saved"
        );


    } catch (error) {

        console.error(
            "Settings save error:",
            error
        );


        showToast(
            "Unable to save settings"
        );

    }

}


/* =========================================================
   LOAD SETTINGS
   ========================================================= */

function loadSettings() {

    try {

        const saved =
            localStorage.getItem(
                "krikalInventorySettings"
            );


        if (saved) {

            const parsed =
                JSON.parse(
                    saved
                );


            if (
                parsed &&
                typeof parsed ===
                    "object"
            ) {

                settings = {

                    ...DEFAULT_SETTINGS,

                    ...parsed

                };

            }

        }

    } catch (error) {

        console.warn(
            "Settings load error:",
            error
        );


        settings = {

            ...DEFAULT_SETTINGS

        };

    }


    syncSettingsUI();


    applyVisualSettings();

}


/* =========================================================
   SYNC SETTINGS UI
   ========================================================= */

function syncSettingsUI() {

    setChecked(
        "themeToggle",
        settings.theme
    );


    setChecked(
        "glowToggle",
        settings.glow
    );


    setChecked(
        "animationToggle",
        settings.animations
    );


    setValue(
        "lowStockLimit",
        settings.lowStockLimit
    );


    setChecked(
        "showOutStock",
        settings.showOutStock
    );


    setChecked(
        "showStatus",
        settings.showStatus
    );


    setChecked(
        "autoRefreshToggle",
        settings.autoRefresh
    );


    setValue(
        "refreshInterval",
        settings.refreshInterval
    );


    setChecked(
        "lowStockToggle",
        settings.lowStockAlerts
    );


    setChecked(
        "outStockToggle",
        settings.outStockAlerts
    );


    setChecked(
        "browserNotificationToggle",
        settings.browserNotifications
    );


    setChecked(
        "showCategory",
        settings.showCategory
    );


    setChecked(
        "showStock",
        settings.showStock
    );


    setChecked(
        "showCategoryIcons",
        settings.showCategoryIcons
    );


    setChecked(
        "compactTable",
        settings.compactTable
    );


    setChecked(
        "rememberLastPage",
        settings.rememberLastPage
    );


    setValue(
        "defaultPage",
        settings.defaultPage
    );


    setValue(
        "dateFormat",
        settings.dateFormat
    );


    setChecked(
        "dashboardLock",
        settings.dashboardLock
    );


    setChecked(
        "confirmRefresh",
        settings.confirmRefresh
    );

}


/* =========================================================
   RESET SETTINGS
   ========================================================= */

function resetSettings() {

    if (
        !confirm(
            "Reset all settings?"
        )
    ) {

        return;

    }


    try {

        localStorage.removeItem(
            "krikalInventorySettings"
        );


        localStorage.removeItem(
            "krikalLastPage"
        );

    } catch (error) {

        console.warn(
            "Reset storage error:",
            error
        );

    }


    settings = {

        ...DEFAULT_SETTINGS

    };


    syncSettingsUI();


    applyVisualSettings();


    showToast(
        "↻ Settings reset"
    );

}


/* =========================================================
   AUTO REFRESH
   ========================================================= */

function setupAutoRefresh() {

    stopAutoRefresh();


    if (
        !settings.autoRefresh
    ) {

        return;

    }


    autoRefreshTimer =
        setInterval(
            function () {

                /*
                 * Don't refresh while
                 * login screen is visible.
                 */

                if (
                    app &&
                    app.classList.contains(
                        "hidden"
                    )
                ) {

                    return;

                }


                loadInventory();

            },
            Math.max(
                5000,
                settings.refreshInterval
            )
        );

}


/* =========================================================
   STOP AUTO REFRESH
   ========================================================= */

function stopAutoRefresh() {

    if (
        autoRefreshTimer
    ) {

        clearInterval(
            autoRefreshTimer
        );


        autoRefreshTimer =
            null;

    }

}


/* =========================================================
   BROWSER NOTIFICATIONS
   ========================================================= */

async function requestBrowserNotifications() {

    if (
        !settings.browserNotifications
    ) {

        return;

    }


    if (
        !("Notification" in window)
    ) {

        showToast(
            "Browser notifications not supported"
        );

        return;

    }


    if (
        Notification.permission ===
        "default"
    ) {

        try {

            await Notification.requestPermission();

        } catch (error) {

            console.warn(
                "Notification permission error:",
                error
            );

        }

    }

}


/* =========================================================
   STOCK ALERTS
   ========================================================= */

function runStockAlerts() {

    if (
        !settings.browserNotifications
    ) {

        return;

    }


    if (
        !("Notification" in window)
    ) {

        return;

    }


    if (
        Notification.permission !==
        "granted"
    ) {

        return;

    }


    const outOfStock =
        settings.outStockAlerts
            ? inventoryData.filter(
                function (item) {

                    return (
                        getStatus(
                            item.stock
                        ).className ===
                        "out-stock"
                    );

                }
            )
            : [];


    const lowStock =
        settings.lowStockAlerts
            ? inventoryData.filter(
                function (item) {

                    return (
                        getStatus(
                            item.stock
                        ).className ===
                        "low-stock"
                    );

                }
            )
            : [];


    if (
        outOfStock.length
    ) {

        new Notification(
            "KRIKAL Inventory",
            {
                body:
                    outOfStock.length +
                    " item(s) are out of stock."
            }
        );

    } else if (
        lowStock.length
    ) {

        new Notification(
            "KRIKAL Inventory",
            {
                body:
                    lowStock.length +
                    " item(s) have low stock."
            }
        );

    }

}


/* =========================================================
   LOCK STATE
   ========================================================= */

function applyLockState() {

    if (
        document.body
    ) {

        document.body.classList.toggle(
            "dashboard-locked",
            Boolean(
                settings.dashboardLock
            )
        );

    }

}


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            value;

    }

}


function checked(
    id,
    fallback
) {

    const element =
        $(id);


    return element
        ? Boolean(
            element.checked
        )
        : fallback;

}


function valueOf(
    id,
    fallback
) {

    const element =
        $(id);


    return element
        ? element.value
        : fallback;

}


function setChecked(
    id,
    value
) {

    const element =
        $(id);


    if (element) {

        element.checked =
            Boolean(
                value
            );

    }

}


function setValue(
    id,
    value
) {

    const element =
        $(id);


    if (element) {

        element.value =
            value;

    }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message
) {

    let toast =
        $("krikalToast");


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "krikalToast";


        Object.assign(
            toast.style,
            {

                position:
                    "fixed",

                left:
                    "50%",

                bottom:
                    "25px",

                transform:
                    "translateX(-50%)",

                padding:
                    "11px 17px",

                borderRadius:
                    "10px",

                background:
                    "#0b1728",

                border:
                    "1px solid rgba(96,165,250,.3)",

                color:
                    "#dbeafe",

                fontSize:
                    "11px",

                fontWeight:
                    "600",

                zIndex:
                    "99999",

                boxShadow:
                    "0 15px 40px rgba(0,0,0,.4)",

                pointerEvents:
                    "none"

            }
        );


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(
            function () {

                if (toast) {

                    toast.remove();

                }

            },
            2200
        );

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        function (event) {

            const active =
                document.activeElement;


            const isTyping =
                active &&
                (
                    active.tagName ===
                        "INPUT" ||

                    active.tagName ===
                        "TEXTAREA" ||

                    active.tagName ===
                        "SELECT"
                );


            /*
             * "/" = Inventory Search
             */

            if (
                event.key ===
                    "/" &&
                !isTyping
            ) {

                event.preventDefault();


                openPage(
                    "inventory",
                    true
                );


                if (searchInput) {

                    searchInput.focus();

                }

            }


            /*
             * ESC = close mobile menu
             */

            if (
                event.key ===
                    "Escape"
            ) {

                closeSidebar();

            }

        }
    );

}


/* =========================================================
   DEBUG HELPER
   ========================================================= */

window.KRIKAL_DEBUG = {

    reload:
        function () {

            loadInventory();

        },

    data:
        function () {

            console.table(
                inventoryData
            );

            return inventoryData;

        },

    settings:
        function () {

            console.log(
                settings
            );

            return settings;

        },

    api:
        API_URL

};


/* =========================================================
   END
   ========================================================= */

/* =========================================================
   PRO INVENTORY FEATURES
   ========================================================= */
function setupProInventoryFeatures() {
    const status = document.getElementById("statusFilter");
    const sort = document.getElementById("sortFilter");
    const clear = document.getElementById("clearFiltersBtn");
    const exportBtn = document.getElementById("exportCsvBtn");
    if (status) status.addEventListener("change", applyFilters);
    if (sort) sort.addEventListener("change", applyFilters);
    if (clear) clear.addEventListener("click", function() {
        if (searchInput) searchInput.value = "";
        if (categoryFilter) categoryFilter.value = "";
        if (status) status.value = "";
        if (sort) sort.value = "default";
        applyFilters();
        showToast("✓ Filters cleared");
    });
    if (exportBtn) exportBtn.addEventListener("click", exportInventoryCSV);
}

function updateFilterSummary() {
    const el = document.getElementById("filterSummary");
    if (!el) return;
    const search = searchInput ? searchInput.value.trim() : "";
    const category = categoryFilter ? categoryFilter.value : "";
    const status = document.getElementById("statusFilter");
    const statusValue = status ? status.value : "";
    const active = [];
    if (search) active.push('Search: "' + search + '"');
    if (category) active.push("Category: " + category);
    if (statusValue) active.push("Status: " + getStatusLabel(statusValue));
    const count = filteredData.length;
    el.innerHTML = active.length
        ? `<span>${escapeHTML(active.join(" • "))}</span><strong>${count} result${count === 1 ? "" : "s"}</strong>`
        : `<span>Showing all inventory</span><strong>${count} item${count === 1 ? "" : "s"}</strong>`;
}

function getStatusLabel(value) {
    if (value === "available") return "Available";
    if (value === "low-stock") return "Low Stock";
    if (value === "out-stock") return "Out of Stock";
    return value;
}

function updateProInsights() {
    const total = inventoryData.length;
    const available = inventoryData.filter(i => getStatus(i.stock).className === "available").length;
    const low = inventoryData.filter(i => getStatus(i.stock).className === "low-stock").length;
    const out = inventoryData.filter(i => getStatus(i.stock).className === "out-stock").length;
    const health = document.querySelector("#stockHealthBar span");
    const healthText = document.getElementById("healthText");
    const healthPercent = document.getElementById("healthPercent");
    const healthyPct = total ? Math.round((available / total) * 100) : 0;
    if (health) health.style.width = healthyPct + "%";
    if (healthPercent) healthPercent.textContent = healthyPct + "%";
    if (healthText) healthText.textContent = total ? `${available} of ${total} items currently available` : "Waiting for inventory…";

    const catBox = document.getElementById("categorySummary");
    if (catBox) {
        const cats = {};
        inventoryData.forEach(item => {
            const c = String(item.category || "Uncategorized").trim() || "Uncategorized";
            cats[c] = (cats[c] || 0) + 1;
        });
        const entries = Object.entries(cats).sort((a,b) => b[1]-a[1]).slice(0, 8);
        catBox.innerHTML = entries.length
            ? entries.map(([name,count]) => `<span class="category-pill">${escapeHTML(name)} <strong>${count}</strong></span>`).join("")
            : `<span class="mini-empty">No categories found</span>`;
    }

    const alertBox = document.getElementById("stockAlertList");
    if (alertBox) {
        const alerts = inventoryData
            .map(item => ({ item, status: getStatus(item.stock) }))
            .filter(x => x.status.className !== "available")
            .sort((a,b) => a.item.stock - b.item.stock)
            .slice(0, 5);
        alertBox.innerHTML = alerts.length
            ? alerts.map(x => `<div class="stock-alert ${x.status.className === "low-stock" ? "low" : ""}"><span>${escapeHTML(x.item.product || "Item")}</span><b>${x.status.label} · ${x.item.stock}</b></div>`).join("")
            : `<span class="mini-empty">✓ No low-stock alerts</span>`;
    }
}

function exportInventoryCSV() {
    const rows = filteredData.length ? filteredData : inventoryData;
    if (!rows.length) { showToast("No inventory to export"); return; }
    const lines = [["Product", "Category", "Stock", "Status"]].concat(rows.map(item => [
        item.product || "", item.category || "", item.stock ?? 0, getStatus(item.stock).label
    ]));
    const csv = lines.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "KRIKAL_Inventory_" + new Date().toISOString().slice(0,10) + ".csv";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast("✓ Inventory exported");
}
