const API_URL = "https://script.google.com/macros/s/AKfycbwr5ZD74X1UrZD3cJTRD7RaA5pAVKlEbDCPmLLANP3-KXQOCnQQJGfqgb9PjgYbSM1r/exec";

let inventoryData = [];
let editingId = null;


// ==========================================
// LOAD INVENTORY
// ==========================================
async function loadInventory() {

    const table = document.getElementById("adminTable");

    if (!table) return;

    try {

        const response = await fetch(API_URL);

        const result = await response.json();

        console.log("Inventory:", result);

        if (!result.success) {
            throw new Error(result.message);
        }

        inventoryData = result.data || [];

        displayInventory(inventoryData);

    } catch (error) {

        console.error("LOAD ERROR:", error);

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load inventory
                </td>
            </tr>
        `;
    }
}


// ==========================================
// DISPLAY INVENTORY
// ==========================================
function displayInventory(data) {

    const table = document.getElementById("adminTable");

    table.innerHTML = "";

    if (!data || data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No inventory items found
                </td>
            </tr>
        `;

        return;
    }


    data.forEach(item => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${escapeHTML(item.itemName)}</td>

            <td>${escapeHTML(item.model || "-")}</td>

            <td>${escapeHTML(item.category || "-")}</td>

            <td>${Number(item.quantity) || 0}</td>

            <td>

                <button onclick="startEdit(
                    ${item.id},
                    '${escapeJS(item.itemName)}',
                    '${escapeJS(item.model || "")}',
                    '${escapeJS(item.category || "")}',
                    ${Number(item.quantity) || 0}
                )">
                    Edit
                </button>

                <button onclick="removeItem(${item.id})">
                    Delete
                </button>

            </td>

        `;

        table.appendChild(row);

    });
}


// ==========================================
// SAVE ITEM
// ==========================================
async function saveItem() {

    const itemName =
        document.getElementById("itemName").value.trim();

    const model =
        document.getElementById("model").value.trim();

    const category =
        document.getElementById("category").value.trim();

    const quantity =
        document.getElementById("quantity").value;


    if (!itemName) {

        alert("Please enter Item Name");

        return;
    }


    if (quantity === "") {

        alert("Please enter Quantity");

        return;
    }


    const button =
        document.getElementById("saveButton");


    button.disabled = true;

    button.innerText =
        editingId !== null
            ? "Updating..."
            : "Saving...";


    try {

        const requestData = {

            action:
                editingId !== null
                    ? "edit"
                    : "add",

            id:
                editingId !== null
                    ? Number(editingId)
                    : undefined,

            itemName: itemName,

            model: model,

            category: category,

            quantity: Number(quantity)

        };


        console.log("REQUEST:", requestData);


        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type":
                    "text/plain;charset=utf-8"
            },

            body:
                JSON.stringify(requestData)

        });


        const result =
            await response.json();


        console.log("RESPONSE:", result);


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to save item"
            );
        }


        alert(
            editingId !== null
                ? "Item updated successfully!"
                : "Item added successfully!"
        );


        clearForm();


        // Immediately update admin table
        await loadInventory();


    } catch (error) {

        console.error(
            "SAVE ERROR:",
            error
        );

        alert(
            "Unable to save item\n\n" +
            error.message
        );

    } finally {

        button.disabled = false;

        button.innerText =
            "Add Item";
    }
}


// ==========================================
// EDIT ITEM
// ==========================================
function startEdit(
    id,
    itemName,
    model,
    category,
    quantity
) {

    editingId = id;


    document.getElementById("itemName").value =
        itemName;

    document.getElementById("model").value =
        model;

    document.getElementById("category").value =
        category;

    document.getElementById("quantity").value =
        quantity;


    document.getElementById("saveButton").innerText =
        "Update Item";


    document.getElementById("cancelButton").style.display =
        "inline-block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// CANCEL EDIT
// ==========================================
function cancelEdit() {

    clearForm();

}


// ==========================================
// CLEAR FORM
// ==========================================
function clearForm() {

    editingId = null;


    document.getElementById("itemName").value =
        "";

    document.getElementById("model").value =
        "";

    document.getElementById("category").value =
        "";

    document.getElementById("quantity").value =
        "";


    document.getElementById("saveButton").innerText =
        "Add Item";


    document.getElementById("cancelButton").style.display =
        "none";
}


// ==========================================
// DELETE ITEM
// ==========================================
async function removeItem(id) {

    if (!confirm(
        "Are you sure you want to delete this item?"
    )) {
        return;
    }


    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type":
                    "text/plain;charset=utf-8"
            },

            body: JSON.stringify({

                action: "delete",

                id: Number(id)

            })

        });


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to delete item"
            );
        }


        alert("Item deleted successfully!");


        // Immediately update admin table
        await loadInventory();


    } catch (error) {

        console.error(
            "DELETE ERROR:",
            error
        );

        alert(
            "Unable to delete item\n\n" +
            error.message
        );
    }
}


// ==========================================
// SEARCH
// ==========================================
function searchInventory() {

    const searchText =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase()
            .trim();


    if (!searchText) {

        displayInventory(
            inventoryData
        );

        return;
    }


    const filtered =
        inventoryData.filter(item => {

            return (

                String(item.itemName || "")
                    .toLowerCase()
                    .includes(searchText)

                ||

                String(item.model || "")
                    .toLowerCase()
                    .includes(searchText)

                ||

                String(item.category || "")
                    .toLowerCase()
                    .includes(searchText)

            );

        });


    displayInventory(filtered);
}


// ==========================================
// SECURITY
// ==========================================
function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


function escapeJS(value) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");
}


// ==========================================
// PAGE LOAD
// ==========================================
document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Admin tools are available only after the main dashboard login.
        try {
            if (localStorage.getItem("krikalLoggedIn") !== "true") {
                window.location.href = "index.html";
                return;
            }
        } catch (error) {
            window.location.href = "index.html";
            return;
        }

        const adminLogout = document.getElementById("adminLogout");
        if (adminLogout) {
            adminLogout.addEventListener("click", function () {
                localStorage.removeItem("krikalLoggedIn");
                window.location.href = "index.html";
            });
        }

        loadInventory();


        const searchBox =
            document.getElementById("searchInput");


        if (searchBox) {

            searchBox.addEventListener(
                "input",
                searchInventory
            );
        }

    }
);


// ==========================================
// ADMIN AUTO REFRESH
// ==========================================
setInterval(function () {

    loadInventory();

}, 30000);

/* KRIKAL V7 - Model option/filter */
function populateModelOptions(items){
  const select=document.getElementById("modelFilter");
  if(!select || !Array.isArray(items)) return;
  const current=select.value;
  const models=[...new Set(items.map(x=>String(x.model ?? x.Model ?? "").trim()).filter(Boolean))].sort();
  select.innerHTML='<option value="">All Models</option>'+models.map(m=>'<option value="'+m.replace(/"/g,'&quot;')+'">'+m+'</option>').join("");
  if(models.includes(current)) select.value=current;
}
document.addEventListener("change",function(e){
  if(e.target && e.target.id==="modelFilter"){
    if(typeof renderInventory==="function") renderInventory();
    else if(typeof filterInventory==="function") filterInventory();
  }
});
