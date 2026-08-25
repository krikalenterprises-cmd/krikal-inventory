const API_URL =
    "https://script.google.com/macros/s/AKfycbwr5ZD74X1UrZD3cJTRD7RaA5pAVKlEbDCPmLLANP3-KXQOCnQQJGfqgb9PjgYbSM1r/exec";


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let inventoryData = [];
let selectedCategory = "All";
let isLoading = false;


// =====================================================
// CATEGORY ICONS
// =====================================================

function getCategoryIcon(category) {

    const value = String(category || "")
        .trim()
        .toLowerCase();

    if (
        value.includes("cover") ||
        value.includes("case")
    ) {
        return "📱";
    }

    if (
        value.includes("guard") ||
        value.includes("tempered") ||
        value.includes("glass") ||
        value.includes("screen protector") ||
        value.includes("protector")
    ) {
        return "🛡️";
    }

    if (
        value.includes("charger") ||
        value.includes("adapter") ||
        value.includes("power adapter")
    ) {
        return "🔌";
    }

    if (
        value.includes("cable") ||
        value.includes("wire")
    ) {
        return "🔗";
    }

    if (
        value.includes("earphone") ||
        value.includes("earbud") ||
        value.includes("headphone") ||
        value.includes("handsfree")
    ) {
        return "🎧";
    }

    if (
        value.includes("power bank") ||
        value.includes("powerbank")
    ) {
        return "🔋";
    }

    if (
        value.includes("speaker") ||
        value.includes("bluetooth speaker")
    ) {
        return "🔊";
    }

    if (
        value.includes("watch") ||
        value.includes("smartwatch")
    ) {
        return "⌚";
    }

    if (
        value.includes("holder") ||
        value.includes("stand")
    ) {
        return "📱";
    }

    if (
        value.includes("mouse") ||
        value.includes("keyboard")
    ) {
        return "🖱️";
    }

    if (
        value.includes("memory") ||
        value.includes("card") ||
        value.includes("sd card")
    ) {
        return "💾";
    }

    if (
        value.includes("battery")
    ) {
        return "🔋";
    }

    if (
        value.includes("sim")
    ) {
        return "📶";
    }

    if (
        value.includes("mic") ||
        value.includes("microphone")
    ) {
        return "🎙️";
    }

    if (
        value.includes("light") ||
        value.includes("led")
    ) {
        return "💡";
    }

    return "🧩";
}


// =====================================================
// LOAD INVENTORY
// =====================================================

async function loadInventory() {

    if (isLoading) {
        return;
    }

    isLoading = true;

    const table =
        document.getElementById("inventoryTable");

    const loading =
        document.getElementById("loadingMessage");

    const errorBox =
        document.getElementById("errorMessage");

    const emptyBox =
        document.getElementById("emptyMessage");


    if (!table) {
        isLoading = false;
        return;
    }


    // Show loader only when no old data exists

    if (
        inventoryData.length === 0 &&
        loading
    ) {
        loading.style.display = "flex";
    }


    if (errorBox) {
        errorBox.style.display = "none";
    }


    if (emptyBox) {
        emptyBox.style.display = "none";
    }


    try {

        const response = await fetch(
            API_URL + "?t=" + Date.now(),
            {
                method: "GET",
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                "Server Error: " +
                response.status
            );

        }


        const result =
            await response.json();


        console.log(
            "API Response:",
            result
        );


        // =================================================
        // HANDLE API RESPONSE
        // =================================================

        let data = [];


        if (Array.isArray(result)) {

            data = result;

        } else if (
            result &&
            Array.isArray(result.data)
        ) {

            data = result.data;

        } else if (
            result &&
            result.success === false
        ) {

            throw new Error(
                result.message ||
                "Unable to load inventory"
            );

        }


        inventoryData = data;


        console.log(
            "Inventory Loaded:",
            inventoryData.length,
            inventoryData
        );


        // =================================================
        // UPDATE PAGE
        // =================================================

        createCategoryDropdown();

        updateStatistics();

        displayInventory();

        updateLastUpdated();


    } catch (error) {

        console.error(
            "Inventory Loading Error:",
            error
        );


        // Show error only when no previous data exists

        if (
            inventoryData.length === 0 &&
            errorBox
        ) {

            errorBox.style.display = "flex";


            const errorText =
                errorBox.querySelector(
                    ".error-text"
                );


            if (errorText) {

                errorText.textContent =
                    "Unable to load inventory. Please try again.";

            }

        }

    } finally {

        isLoading = false;


        if (loading) {

            loading.style.display = "none";

        }

    }
}


// =====================================================
// LAST UPDATED
// =====================================================

function updateLastUpdated() {

    const element =
        document.getElementById("lastUpdated");


    if (!element) {
        return;
    }


    const now =
        new Date();


    element.textContent =
        "Updated " +
        now.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}


// =====================================================
// CATEGORY DROPDOWN
// =====================================================

function createCategoryDropdown() {

    const dropdown =
        document.getElementById(
            "categoryFilter"
        );


    if (!dropdown) {
        return;
    }


    const categories =
        inventoryData
            .map(function (item) {

                return String(
                    item.category || ""
                ).trim();

            })
            .filter(function (category) {

                return category !== "";

            });


    const uniqueCategories =
        [...new Set(categories)];


    uniqueCategories.sort(
        function (a, b) {

            return a.localeCompare(b);

        }
    );


    dropdown.innerHTML = "";


    // =================================================
    // ALL ITEMS
    // =================================================

    const allOption =
        document.createElement(
            "option"
        );


    allOption.value = "All";

    allOption.textContent =
        "▦  All Items";


    dropdown.appendChild(
        allOption
    );


    // =================================================
    // CATEGORIES
    // =================================================

    uniqueCategories.forEach(
        function (category) {

            const option =
                document.createElement(
                    "option"
                );


            const icon =
                getCategoryIcon(
                    category
                );


            option.value =
                category;


            option.textContent =
                icon +
                "  " +
                category;


            dropdown.appendChild(
                option
            );

        }
    );


    // Restore selected category

    dropdown.value =
        selectedCategory;


    // If category no longer exists

    if (
        dropdown.value !==
        selectedCategory
    ) {

        selectedCategory =
            "All";

        dropdown.value =
            "All";

    }
}


// =====================================================
// STATISTICS
// =====================================================

function updateStatistics() {

    let total = 0;

    let available = 0;

    let lowStock = 0;

    let outStock = 0;


    inventoryData.forEach(
        function (item) {

            const quantity =
                Number(
                    item.quantity
                ) || 0;


            total++;


            if (quantity <= 0) {

                outStock++;

            } else if (quantity <= 5) {

                lowStock++;

            } else {

                available++;

            }

        }
    );


    const totalElement =
        document.getElementById(
            "totalItems"
        );


    const availableElement =
        document.getElementById(
            "availableItems"
        );


    const lowElement =
        document.getElementById(
            "lowStockItems"
        );


    const outElement =
        document.getElementById(
            "outStockItems"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (availableElement) {

        availableElement.textContent =
            available;

    }


    if (lowElement) {

        lowElement.textContent =
            lowStock;

    }


    if (outElement) {

        outElement.textContent =
            outStock;

    }
}


// =====================================================
// DISPLAY INVENTORY
// =====================================================

function displayInventory() {

    const table =
        document.getElementById(
            "inventoryTable"
        );


    if (!table) {
        return;
    }


    // =================================================
    // SEARCH
    // =================================================

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const searchText =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    // =================================================
    // CATEGORY
    // =================================================

    const selected =
        String(
            selectedCategory ||
            "All"
        )
            .trim()
            .toLowerCase();


    // =================================================
    // FILTER DATA
    // =================================================

    const filteredData =
        inventoryData.filter(
            function (item) {

                const itemName =
                    String(
                        item.itemName ||
                        item.name ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const model =
                    String(
                        item.model ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const category =
                    String(
                        item.category ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const searchMatch =
                    searchText === "" ||
                    itemName.includes(
                        searchText
                    ) ||
                    model.includes(
                        searchText
                    ) ||
                    category.includes(
                        searchText
                    );


                const categoryMatch =
                    selected === "all" ||
                    category === selected;


                return (
                    searchMatch &&
                    categoryMatch
                );

            }
        );


    // Clear table

    table.innerHTML = "";


    // Update item count

    updateItemCount(
        filteredData.length
    );


    // =================================================
    // EMPTY RESULT
    // =================================================

    const emptyBox =
        document.getElementById(
            "emptyMessage"
        );


    if (
        filteredData.length === 0
    ) {

        if (emptyBox) {

            emptyBox.style.display =
                "flex";

        }

        return;
    }


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


    // =================================================
    // CREATE ROWS
    // =================================================

    const fragment =
        document.createDocumentFragment();


    filteredData.forEach(
        function (item) {

            const quantity =
                Number(
                    item.quantity
                ) || 0;


            let status = "";

            let statusClass = "";


            // =================================================
            // STOCK STATUS
            // =================================================

            if (quantity <= 0) {

                status =
                    "Out of Stock";

                statusClass =
                    "out-stock";

            } else if (
                quantity <= 5
            ) {

                status =
                    "Low Stock";

                statusClass =
                    "low-stock";

            } else {

                status =
                    "Available";

                statusClass =
                    "available";

            }


            // =================================================
            // CATEGORY ICON
            // =================================================

            const categoryName =
                String(
                    item.category ||
                    ""
                ).trim();


            const categoryIcon =
                getCategoryIcon(
                    categoryName
                );


            // =================================================
            // TABLE ROW
            // =================================================

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(
                            item.itemName ||
                            item.name ||
                            "-"
                        )}
                    </strong>
                </td>


                <td>
                    ${escapeHTML(
                        item.model ||
                        "-"
                    )}
                </td>


                <td>

                    <span class="category-badge">

                        <span class="category-icon">
                            ${categoryIcon}
                        </span>

                        <span>
                            ${escapeHTML(
                                categoryName ||
                                "Other"
                            )}
                        </span>

                    </span>

                </td>


                <td>
                    <strong>
                        ${quantity}
                    </strong>
                </td>


                <td>

                    <!-- STATUS COLOR -->
                    <span
                        class="stock-status ${statusClass}"
                        data-status="${statusClass}"
                    >
                        ${status}
                    </span>

                </td>

            `;


            fragment.appendChild(
                row
            );

        }
    );


    table.appendChild(
        fragment
    );
}


// =====================================================
// ITEM COUNT
// =====================================================

function updateItemCount(count) {

    const element =
        document.getElementById(
            "itemCount"
        );


    if (!element) {
        return;
    }


    element.textContent =
        count +
        (
            count === 1
                ? " Item"
                : " Items"
        );
}


// =====================================================
// SEARCH
// =====================================================

function setupSearch() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        function () {

            displayInventory();

        }
    );
}


// =====================================================
// CATEGORY FILTER
// =====================================================

function setupFilters() {

    const dropdown =
        document.getElementById(
            "categoryFilter"
        );


    if (!dropdown) {
        return;
    }


    dropdown.addEventListener(
        "change",
        function () {

            selectedCategory =
                this.value || "All";


            displayInventory();

        }
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;
}


// =====================================================
// REFRESH BUTTON
// =====================================================

function setupRefreshButton() {

    const refreshButton =
        document.getElementById(
            "refreshButton"
        );


    if (!refreshButton) {
        return;
    }


    refreshButton.addEventListener(
        "click",
        function () {

            loadInventory();

        }
    );
}


// =====================================================
// AUTO REFRESH
// =====================================================

// Refresh inventory every 60 seconds

setInterval(
    function () {

        loadInventory();

    },
    60000
);


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupSearch();

        setupFilters();

        setupRefreshButton();

        loadInventory();

    }
);