const httprequest = 'https://yary2022.app.n8n.cloud/webhook/gateway?task=';
const translations = {
  en: {
    title: "Coffee Shop", order: "🛒 Card", add: "Add", quantity: "Quantity",
    size: "Size", sugar: "Sugar (%)", yourOrder: "Your Order",
    delivery: "Delivery", takeAway: "Come and Take", dineIn: "Dine In",
    table: "Table", checkout: "Order", addToCart: "ADD", total: "Total",
    selectTable: "Select table", alertSelectTable: "Please select a table.",
    orderReceived: "Order received!", orderFailed: "Error sending order."
  },
  km: {
    title: "ហាងកាហ្វេ", order: "🛒 កន្ត្រក", add: "បន្ថែម", quantity: "បរិមាណ",
    size: "ទំហំ", sugar: "ស្ករ (%)", yourOrder: "ការបញ្ជាទិញរបស់អ្នក",
    delivery: "ដឹកជញ្ជូន", takeAway: "មកយកផ្ទាល់", dineIn: "ញុំានក្នុងហាង",
    table: "តុ", checkout: "បញ្ជាទិញ", addToCart: "បន្ថែម", total: "សរុប",
    selectTable: "ជ្រើសរើសតុ", alertSelectTable: "សូមជ្រើសរើសតុ",
    orderReceived: "បញ្ជាទិញរបស់អ្នកត្រូវបានទទួល!", orderFailed: "បញ្ហាក្នុងការផ្ញើបញ្ជាទិញ។"
  }
};

let cart = [];
let current = {};
let currentLang = "en";
let serviceType = "Delivery";
let tableNumber = null;
let userId = 0;
let userName = null;
let firstName = null;
let itemModal, summaryModal;
let drinkItems = [];
let snackItems = [];

let addressData = {
  chartId: '',
  firstName: '',
  houseNo: '',
  street: '',
  note: ''
};

const addressModal = new bootstrap.Modal(document.getElementById('addressModal'));
async function loadMenu() {
  try {
    const res = await fetch(`${httprequest}menuitem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const menu = await res.json();

    drinkItems = menu.drink || [];
    snackItems = menu.snack || [];

    init();
  } catch (err) {
    console.error("Failed to load menu", err);
    Swal.fire({
      icon: 'error',
      title: 'Failed!',
      text: '❌ Failed to get menu item. Please try again.',
      confirmButtonColor: '#d33'
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  itemModal = new bootstrap.Modal(document.getElementById('itemModal'));
  summaryModal = new bootstrap.Modal(document.getElementById('summaryModal'));
  loadMenu();

  const sugarContainer = document.getElementById("sugar-options");
  [0, 25, 50, 75, 100, 125].forEach(sugar => {
    const div = document.createElement("div");
    div.className = "form-check";
    div.innerHTML = `
      <input class="form-check-input" type="radio" name="sugar" id="sugar${sugar}" value="${sugar}" ${sugar === 0 ? "checked" : ""}>
      <label class="form-check-label" for="sugar${sugar}">${sugar}</label>
    `;
    sugarContainer.appendChild(div);
  });

  // getUserAddress();
  setLanguage(currentLang);
  init();

  // userId = +document.getElementById('chatId').value;//471682968;// 
  // userName = document.getElementById('userName').value;
  // firstName = document.getElementById('firstName').value;

  document.getElementById("langToggle").addEventListener("click", () => {
    currentLang = currentLang === "en" ? "km" : "en";
    setLanguage(currentLang);
  });
});

function setLanguage(lang) {
  const t = translations[lang];
  document.getElementById("page-title").innerText = "☕ " + t.title;
  document.getElementById("orderBtn").innerText = t.order;
  document.getElementById("checkoutBtn").innerText = t.checkout;
  document.getElementById("summaryTitle").innerText = t.yourOrder;
  document.getElementById("label-delivery").innerText = t.delivery;
  document.getElementById("label-takeaway").innerText = t.takeAway;
  document.getElementById("label-dinein").innerText = t.dineIn;
  document.getElementById("label-size").innerText = t.size + ":";
  document.getElementById("label-sugar").innerText = t.sugar + ":";
  document.getElementById("label-qty").innerText = t.quantity + ":";
  document.getElementById("label-table").innerText = t.table + ":";
  document.getElementById("addBtn").innerText = t.addToCart;
  document.getElementById("langToggle").innerText = lang === "en" ? "🇰🇭 ខ្មែរ" : "🇬🇧 EN";
  document.body.style.fontFamily = lang === "km" ? "'Noto Sans Khmer', sans-serif" : "'Noto Sans Khmer', sans-serif";
  document.documentElement.lang = lang;
}

function init() {
  renderMenu("drink-menu", drinkItems);
  renderMenu("snack-menu", snackItems);
  updateButtonStates();
  updateBadges();
}

// async function getUserAddress() {
//   userId = +document.getElementById('chatId').value;//471682968;// 
// console.log(userId);
//   try {
//     const res = await fetch(`${httprequest}getaddress`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ chatId: userId })
//     });

//     addressData = await res.json();
//   } catch (err) {
//     console.error("Failed to load address", err);
//   }
// }


async function openAddressModal() {
  // Fill form if data exists
  userId = +document.getElementById('chatId').value;//471682968;// 
console.log(userId);
  try {
    const res = await fetch(`${httprequest}getaddress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: userId })
    });

    console.log(res);
    addressData = await res.json();
    console.log(addressData);
  } catch (err) {
    console.error("Failed to load address", err);
  }

  document.getElementById('houseNo').value = addressData.houseNo || '';
  document.getElementById('street').value = addressData.street || '';
  document.getElementById('note').value = addressData.note || '';
  addressModal.show();
}

async function saveAddress() {
  const addressBtn = document.getElementById('checkoutBtn');
  userId = +document.getElementById('chatId').value;//471682968;// 
console.log(userId);
  addressData.houseNo = document.getElementById('houseNo').value.trim() || '';
  addressData.street = document.getElementById('street').value.trim() || '';
  addressData.note = document.getElementById('note').value.trim() || '';

  if (addressData.houseNo != '' && addressData.street != '') {
    const payload = {
      userId,
      firstName,
      addressData
    };
    await fetch(`${httprequest}setaddress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: payload })
    })
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        addressBtn.disabled = false;
        return response.text(); // or response.json() if expecting JSON
      })
      .then(data => {
        addressModal.hide();
        Swal.fire({
          icon: 'success',
          title: 'Order sent!',
          text: '✅ Your address was submitted successfully.',
          confirmButtonColor: '#3085d6'
        });
      })
      .catch(error => {
        console.error("Order error:", error);
        addressBtn.disabled = false;
        Swal.fire({
          icon: 'error',
          title: 'Failed!',
          text: '❌ Failed to send order. Please try again.',
          confirmButtonColor: '#d33'
        });
      });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Failed!',
      text: '❌ House No and Street are required field.',
      confirmButtonColor: '#d33'
    });
  }
}

function renderMenu(containerId, itemsArray) {
//   userId = +document.getElementById('chatId').value;//471682968;// 
// console.log(userId);  
  const menu = document.getElementById(containerId);
  if (!menu) {
    console.warn(`⚠️ Element with id="${containerId}" not found.`);
    return;
  }

  menu.innerHTML = '';
  itemsArray.forEach(it => {
    const div = document.createElement('div');
    div.className = 'col-6 col-md-4 mb-4';
    div.innerHTML = `
      <div class="card h-100">
        <img src="${convertDriveLink(it.img)}" class="card-img-top" alt="${it.name}">
        <div class="card-body text-center">
          <h5 class="card-title">${it.name}</h5>
          <p class="card-text">៛${it.price.toFixed(2)}</p>
          <button class="btn btn-outline-primary" onclick="openItem('${it.id}')">${translations[currentLang].add}</button>
          <span class="badge bg-danger position-absolute top-0 end-0 translate-middle" id="badge-${it.id}" style="display: none;">0</span>
        </div>
      </div>
    `;
    menu.appendChild(div);
  });
}

function convertDriveLink(url) {
  const match = url.match(/\/d\/(.*?)\//);
  return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : url;
}

function updateButtonStates() {
  const orderBtn = document.getElementById('orderBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const disabled = cart.length === 0;
  orderBtn.disabled = disabled;
  checkoutBtn.disabled = disabled;
}

function updateBadges() {
  const counts = {};
  cart.forEach(item => {
    counts[item.id] = (counts[item.id] || 0) + item.qty;
  });

  [...drinkItems, ...snackItems].forEach(it => {
    const badge = document.getElementById(`badge-${it.id}`);
    if (badge) {
      if (counts[it.id]) {
        badge.innerText = counts[it.id];
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  });

}

function openItem(id) {
  const it = [...drinkItems, ...snackItems].find(i => i.id === id);
  if (!it) return;

  current = { ...it, qty: 1 };

  document.getElementById('modal-img').src = it.img;
  document.getElementById('modal-name').innerText = it.name;
  document.getElementById('modal-qty').innerText = current.qty;

  const sizeOptions = document.getElementById('size-options').parentElement;
  const sugarOptions = document.getElementById('sugar-options').parentElement;

  if (it.category === 'drink') {
    sizeOptions.style.display = 'block';
    sugarOptions.style.display = 'block';
    current.size = "Medium";
    current.sugar = "0";
    document.querySelectorAll('input[name="size"]').forEach(r => {
      r.checked = r.value === current.size;
    });
    document.querySelectorAll('input[name="sugar"]').forEach(r => {
      r.checked = r.value === current.sugar;
    });
  } else {
    sizeOptions.style.display = 'none';
    sugarOptions.style.display = 'none';
  }

  itemModal.show();
}

function changeQty(delta) {
  current.qty = Math.max(1, current.qty + delta);
  document.getElementById('modal-qty').innerText = current.qty;
}

function confirmAdd() {
  if (current.category === 'drink') {
    const selectedSize = document.querySelector('input[name="size"]:checked');
    const selectedSugar = document.querySelector('input[name="sugar"]:checked');
    current.size = selectedSize ? selectedSize.value : "Medium";
    current.sugar = selectedSugar ? selectedSugar.value : "0";
  }
  cart.push({ ...current });
  itemModal.hide();
  updateButtonStates();
  updateBadges();
}

function openSummary() {
  const listDiv = document.getElementById('summaryList');
  listDiv.innerHTML = '';
  let total = 0;
  const grouped = {};

  cart.forEach((i, idx) => {
    const key = i.category === "drink"
      ? `${i.name}-${i.size}-${i.sugar}`
      : i.name;

    if (!grouped[key]) {
      grouped[key] = { ...i, qty: 0 };
    }
    grouped[key].qty += i.qty;
  });

  for (const key in grouped) {
    const g = grouped[key];
    const sub = g.qty * g.price;
    total += sub;

    // Display details only for drink
    let displayText = g.name;
    if (g.category === "drink") {
      displayText += ` (${g.size}, ${g.sugar}%)`;
    }

    const itemDiv = document.createElement('div');
    itemDiv.innerHTML = `
    <button class="btn btn-sm btn-outline-danger me-2" onclick="removeGroup('${key}')">❌</button>
    ${displayText} x ${g.qty} = ៛${sub.toFixed(2)}
  `;
    listDiv.appendChild(itemDiv);
  }

  document.getElementById('summaryTotal').innerText = `${translations[currentLang].total}: ៛${total.toFixed(2)}`;

  serviceType = "Delivery";
  tableNumber = null;
  document.querySelectorAll('input[name="serviceType"]').forEach(input => {
    input.checked = input.value === "Delivery";
    input.addEventListener("change", function () {
      serviceType = this.value;
      document.getElementById("tableSelection").style.display = serviceType === "Dine In" ? "block" : "none";
    });
  });

  document.getElementById('tableNumber').selectedIndex = 0;
  summaryModal.show();
}

function getItemKey(item) {
  return item.category === "drink"
    ? `${item.name}-${item.size}-${item.sugar}`
    : item.name;
}

function removeGroup(key) {
  cart = cart.filter(item => getItemKey(item) !== key);
  openSummary();
  updateButtonStates();
  updateBadges();
}

async function checkout() {
  userId = +document.getElementById('chatId').value;//471682968;// 
console.log(userId);
  const checkoutBtn = document.getElementById('checkoutBtn');
  checkoutBtn.disabled = true;

  if (serviceType === "Dine In") {
    const selectedTable = document.getElementById("tableNumber").value;
    if (!selectedTable || selectedTable === "Select table") {
      alert(translations[currentLang].alertSelectTable);
      return;
    }
    tableNumber = selectedTable;
  }

  const payload = {
    userId,
    userName,
    firstName,
    serviceType,
    table: serviceType === "Dine In" ? tableNumber : '',
    //address: serviceType === "Delivery" ? addressData : null,
    timestamp: new Date().toISOString(),
    items: cart.map(item => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
      size: item.size || '',
      sugar: item.sugar || '',
      category: item.category
    }))
  };
  console.log(payload);
  await fetch(`${httprequest}order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload })
  })
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      checkoutBtn.disabled = false;
      return response.text(); // or response.json() if expecting JSON
    })
    .then(data => {
      cart = [];
      updateButtonStates();
      updateBadges();
      summaryModal.hide();
      Swal.fire({
        icon: 'success',
        title: 'Order sent!',
        text: '✅ Your order was submitted successfully.',
        confirmButtonColor: '#3085d6'
      });
    })
    .catch(error => {
      console.error("Order error:", error);
      checkoutBtn.disabled = false;
      Swal.fire({
        icon: 'error',
        title: 'Failed!',
        text: '❌ Failed to send order. Please try again.',
        confirmButtonColor: '#d33'
      });
    });
}