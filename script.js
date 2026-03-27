// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyClhb_-h8A25NcRkt7q-Jm15HkIQX2NoEs",
    authDomain: "kiui-3527b.firebaseapp.com",
    projectId: "kiui-3527b",
    storageBucket: "kiui-3527b.firebasestorage.app",
    messagingSenderId: "174501891120",
    appId: "1:174501891120:web:aa6a83eb7c776f88aa71f5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentInventory = 1;
let currentRentInventory = 1; 
let currentCustomerId = null;
let isOnline = navigator.onLine;

let data = {
    inventory1: [],
    inventory2: [],
    customers: [],
    transactions: [],
    lastSync: 0
};

let syncQueue = [];

// IndexedDB Wrapper
const DB_NAME = 'kareemDB';
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('store')) {
                db.createObjectStore('store');
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getLocalData(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('store', 'readonly');
        const store = tx.objectStore('store');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function setLocalData(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('store', 'readwrite');
        const store = tx.objectStore('store');
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function initData() {
    const localData = await getLocalData('kareemData');
    const localQueue = await getLocalData('syncQueue');
    if (localData) data = localData;
    if (localQueue) syncQueue = localQueue;
    
    if (isOnline) {
        await syncData();
    } else {
        updateUI();
    }
}

async function saveDataLocally() {
    await setLocalData('kareemData', data);
    if (isOnline) {
        addToQueue('sync');
        processQueue();
    } else {
        addToQueue('sync');
    }
}

function addToQueue(action) {
    syncQueue.push({ action, timestamp: Date.now() });
    setLocalData('syncQueue', syncQueue);
}

async function syncData() {
    updateNetworkStatus('syncing');
    try {
        const docRef = doc(db, "data", "main");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const serverData = docSnap.data();
            mergeData(serverData);
        }
        
        await setDoc(docRef, data);
        syncQueue = [];
        await setLocalData('syncQueue', syncQueue);
        updateNetworkStatus('online');
        updateUI();
    } catch (e) {
        updateNetworkStatus('offline');
    }
}

function mergeData(serverData) {
    const mergeArray = (localArr, serverArr) => {
        const map = new Map();
        serverArr.forEach(item => map.set(item.id, item));
        localArr.forEach(item => {
            if (!map.has(item.id) || (item.lastUpdated && item.lastUpdated > map.get(item.id).lastUpdated)) {
                map.set(item.id, item);
            }
        });
        return Array.from(map.values());
    };

    data.inventory1 = mergeArray(data.inventory1 || [], serverData.inventory1 || []);
    data.inventory2 = mergeArray(data.inventory2 || [], serverData.inventory2 || []);
    data.customers = mergeArray(data.customers || [], serverData.customers || []);
    data.transactions = mergeArray(data.transactions || [], serverData.transactions || []);
    data.lastSync = Date.now();
    setLocalData('kareemData', data);
}

async function processQueue() {
    if (!isOnline || syncQueue.length === 0) return;
    await syncData();
}

function updateNetworkStatus(status) {
    const el = document.getElementById('network-status');
    el.className = `network-status ${status}`;
    if (status === 'online') el.innerText = 'متصل';
    if (status === 'offline') el.innerText = 'غير متصل';
    if (status === 'syncing') el.innerText = 'جاري المزامنة...';
}

window.addEventListener('online', () => { isOnline = true; processQueue(); });
window.addEventListener('offline', () => { isOnline = false; updateNetworkStatus('offline'); });

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-prompt').style.display = 'block';
});
document.getElementById('btn-install').addEventListener('click', () => {
    document.getElementById('install-prompt').style.display = 'none';
    deferredPrompt.prompt();
    deferredPrompt = null;
});
document.getElementById('btn-close-install').addEventListener('click', () => {
    document.getElementById('install-prompt').style.display = 'none';
});

function formatIQD(number) { return new Intl.NumberFormat('en-IQ').format(number); }

document.getElementById('btn-login').addEventListener('click', () => {
    const pass = document.getElementById('password-input').value;
    if (pass === "1001") {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        switchTab('tab-customers'); 
    } else {
        alert("كلمة المرور خاطئة");
    }
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    updateUI();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
});

function openModal(modalId) { document.getElementById(modalId).classList.add('active'); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('active'); }

document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => closeModal(e.target.dataset.modal));
});

document.querySelectorAll('.btn-inv-switch').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentInventory = parseInt(e.target.dataset.inv);
        document.querySelectorAll('.btn-inv-switch').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById('current-inv-label').innerText = currentInventory;
        renderInventory();
    });
});

document.getElementById('btn-save-item').addEventListener('click', async () => {
    const name = document.getElementById('item-name').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const qty = parseInt(document.getElementById('item-qty').value);
    if (!name || isNaN(price) || isNaN(qty)) return;

    const newItem = { id: Date.now(), name, price, qty, lastUpdated: Date.now() };
    if (currentInventory === 1) data.inventory1.push(newItem);
    else data.inventory2.push(newItem);

    await saveDataLocally();
    closeModal('addItemModal');
    renderInventory();
});

document.getElementById('btn-save-customer').addEventListener('click', async () => {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    if (!name || !phone) return;

    data.customers.push({ id: Date.now(), name, phone: "964" + phone, balance: 0, lastUpdated: Date.now() });
    await saveDataLocally();
    closeModal('addCustomerModal');
    renderCustomers();
});

function renderInventory() {
    const query = document.getElementById('search-inventory').value.toLowerCase().trim();
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    let items = currentInventory === 1 ? data.inventory1 : data.inventory2;
    if (query) items = items.filter(item => item.name.toLowerCase().includes(query));

    items.forEach(item => {
        list.innerHTML += `
            <div class="card">
                <div class="card-info">
                    <h4>${item.name}</h4>
                    <p>السعر: ${formatIQD(item.price)} د.ع</p>
                    <p>الكمية المتوفرة: ${item.qty}</p>
                </div>
            </div>`;
    });
}

function renderCustomers() {
    const query = document.getElementById('search-customer').value.toLowerCase().trim();
    const list = document.getElementById('customers-list');
    list.innerHTML = '';
    let items = data.customers;
    if (query) items = items.filter(c => c.name.toLowerCase().includes(query));

    items.forEach(cust => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<div class="card-info"><h4>${cust.name}</h4><p>+${cust.phone}</p></div>`;
        div.onclick = () => openCustomerDetails(cust.id);
        list.appendChild(div);
    });
}

function openCustomerDetails(id) {
    currentCustomerId = id;
    const c = data.customers.find(x => x.id === id);
    document.getElementById('customers-main-view').style.display = 'none';
    document.getElementById('customer-details-view').style.display = 'block';
    document.getElementById('detail-customer-name').innerText = c.name;
    document.getElementById('detail-customer-phone').innerText = "+" + c.phone;
    document.getElementById('detail-customer-phone').href = "tel:+" + c.phone;
    document.getElementById('detail-customer-balance').innerText = `${formatIQD(c.balance)} د.ع`;
    renderTransactions();
}

document.getElementById('btn-back-customers').addEventListener('click', () => {
    document.getElementById('customers-main-view').style.display = 'block';
    document.getElementById('customer-details-view').style.display = 'none';
});

document.getElementById('btn-open-payment').addEventListener('click', () => openModal('paymentModal'));
document.getElementById('btn-save-payment').addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('payment-amount').value);
    if(isNaN(amount) || amount <= 0) return;

    const customer = data.customers.find(c => c.id === currentCustomerId);
    customer.balance -= amount;
    customer.lastUpdated = Date.now();

    const now = new Date();
    data.transactions.push({
        id: Date.now(),
        customerId: currentCustomerId,
        type: 'payment',
        amount: amount,
        date: now.toLocaleDateString('ar-IQ'),
        time: now.toLocaleTimeString('ar-IQ'),
        lastUpdated: Date.now()
    });

    await saveDataLocally();
    closeModal('paymentModal');
    openCustomerDetails(currentCustomerId);
});

window.sharePaymentWhatsApp = function(transId) {
    const trans = data.transactions.find(t => t.id === transId);
    const customer = data.customers.find(c => c.id === trans.customerId);
    const msg = `مرحباً ${customer.name}،\nتم استلام دفعة نقدية (تسديد لحسابكم) بمبلغ: ${formatIQD(trans.amount)} د.ع.\nتاريخ الدفعة: ${trans.date} - ${trans.time}\n\nإجمالي الديون المتبقية بذمتكم حالياً هو: ${formatIQD(customer.balance)} د.ع.\n\nشكراً لتعاملكم مع محلات كريم لتأجير العدد اليدوية!`;
    window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

document.getElementById('btn-open-rent').addEventListener('click', () => {
    document.getElementById('rent-items-container').innerHTML = '';
    window.addRentItemRow();
    openModal('rentModal');
});

document.querySelectorAll('.btn-rent-inv-switch').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentRentInventory = parseInt(e.target.dataset.inv);
        document.querySelectorAll('.btn-rent-inv-switch').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
    });
});

window.filterRentItems = function(input, rowId) {
    const query = input.value.toLowerCase().trim();
    const dropdown = document.getElementById(`dropdown-${rowId}`);
    const items = currentRentInventory === 1 ? data.inventory1 : data.inventory2;
    dropdown.innerHTML = '';
    let filtered = query ? items.filter(i => i.name.toLowerCase().includes(query)) : items;
    
    if (filtered.length === 0) { dropdown.style.display = 'none'; return; }
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.style.padding = '10px'; div.style.borderBottom = '1px solid #eee'; div.style.cursor = 'pointer';
        div.innerText = `${item.name} (${formatIQD(item.price)} د.ع)`;
        div.onclick = () => {
            input.value = item.name;
            document.getElementById(`price-${rowId}`).value = item.price;
            dropdown.style.display = 'none';
        };
        dropdown.appendChild(div);
    });
    dropdown.style.display = 'block';
};

window.addRentItemRow = function() {
    const id = Date.now() + Math.random();
    const html = `
        <div class="rent-item-row" id="row-${id}">
            <div style="position: relative; flex: 1;">
                <input type="text" class="rent-item-search" placeholder="ابحث..." onkeyup="filterRentItems(this, '${id}')" onfocus="filterRentItems(this, '${id}')">
                <input type="hidden" id="price-${id}" class="rent-item-price" value="0">
                <div id="dropdown-${id}" class="rent-item-dropdown" style="display:none; position:absolute; background:white; width:100%; border:1px solid #bdc3c7; max-height:150px; overflow-y:auto; z-index:100;"></div>
            </div>
            <input type="number" placeholder="كمية" value="1" class="rent-item-qty" style="width: 70px;">
            <button class="btn-danger btn-small" onclick="document.getElementById('row-${id}').remove()">X</button>
        </div>`;
    document.getElementById('rent-items-container').insertAdjacentHTML('beforeend', html);
}
document.getElementById('btn-add-rent-row').addEventListener('click', window.addRentItemRow);

document.getElementById('btn-save-rent').addEventListener('click', async () => {
    const paid = parseFloat(document.getElementById('rent-paid').value) || 0;
    const customer = data.customers.find(c => c.id === currentCustomerId);
    let itemsArray = [];
    const searches = document.querySelectorAll('.rent-item-search');
    const qtys = document.querySelectorAll('.rent-item-qty');
    const prices = document.querySelectorAll('.rent-item-price');
    const now = Date.now();

    searches.forEach((s, i) => {
        if(s.value.trim() !== '') {
            itemsArray.push({
                name: s.value.trim(),
                qty: parseInt(qtys[i].value) || 1,
                price: parseFloat(prices[i].value) || 0,
                rentTimestamp: now,
                returnedQty: 0
            });
        }
    });

    if(itemsArray.length === 0) return;

    customer.balance -= paid;
    customer.lastUpdated = now;

    data.transactions.push({
        id: now, customerId: currentCustomerId, type: 'rent',
        itemsArray, paid, totalCost: 0,
        date: new Date().toLocaleDateString('ar-IQ'),
        time: new Date().toLocaleTimeString('ar-IQ'),
        status: 'ongoing', lastUpdated: now
    });

    await saveDataLocally();
    closeModal('rentModal');
    openCustomerDetails(currentCustomerId);
});

window.openReturnModal = function(transId) {
    document.getElementById('return-trans-id').value = transId;
    const trans = data.transactions.find(t => t.id === transId);
    const container = document.getElementById('return-items-container');
    container.innerHTML = '';
    const now = Date.now();

    trans.itemsArray.forEach((item, idx) => {
        const pending = item.qty - item.returnedQty;
        if(pending > 0) {
            const days = Math.max(1, Math.ceil((now - item.rentTimestamp) / 86400000));
            const cost = days * item.price;
            container.innerHTML += `
                <div class="rent-item-row" style="flex-direction:column; align-items:start;">
                    <div style="font-weight:bold;">${item.name} (باقي: ${pending})</div>
                    <div style="font-size:12px; color:gray;">الأيام: ${days} | التكلفة التقديرية للقطعة: ${formatIQD(item.price * days)}</div>
                    <div style="display:flex; gap:5px; width:100%; margin-top:5px;">
                        <input type="number" id="ret-qty-${idx}" placeholder="مرتجع" value="${pending}" max="${pending}" min="1" style="flex:1">
                        <input type="number" id="ret-pay-${idx}" placeholder="تسديد" value="${cost * pending}" style="flex:1">
                        <button class="btn-primary" onclick="processReturn(${transId}, ${idx})">إرجاع</button>
                    </div>
                </div>`;
        }
    });
    
    const hist = document.getElementById('return-history-container');
    hist.innerHTML = (trans.returnHistory || []).map(h => `<div style="font-size:13px; padding:5px; background:#f0f3f5; margin-bottom:5px;">${h.date}: إرجاع ${h.qty} من ${h.name} بتكلفة ${formatIQD(h.cost)} (سُدد: ${formatIQD(h.paid)})</div>`).join('');
    openModal('returnModal');
}

window.processReturn = async function(transId, idx) {
    const trans = data.transactions.find(t => t.id === transId);
    const customer = data.customers.find(c => c.id === trans.customerId);
    const item = trans.itemsArray[idx];
    const retQty = parseInt(document.getElementById(`ret-qty-${idx}`).value) || 0;
    const retPay = parseFloat(document.getElementById(`ret-pay-${idx}`).value) || 0;
    if(retQty <= 0) return;

    const days = Math.max(1, Math.ceil((Date.now() - item.rentTimestamp) / 86400000));
    const cost = days * item.price * retQty;

    item.returnedQty += retQty;
    trans.totalCost += cost;
    trans.paid += retPay;
    
    customer.balance += (cost - retPay);
    customer.lastUpdated = Date.now();
    trans.lastUpdated = Date.now();

    if(!trans.returnHistory) trans.returnHistory = [];
    trans.returnHistory.push({ name: item.name, qty: retQty, cost, paid: retPay, date: new Date().toLocaleString('ar-IQ') });

    if(trans.itemsArray.every(i => i.returnedQty >= i.qty)) trans.status = 'completed';

    await saveDataLocally();
    openReturnModal(transId);
    document.getElementById('detail-customer-balance').innerText = `${formatIQD(customer.balance)} د.ع`;
}

window.shareRentWhatsApp = function(transId) {
    const trans = data.transactions.find(t => t.id === transId);
    const customer = data.customers.find(c => c.id === trans.customerId);
    let itemsText = trans.itemsArray.map(i => `${i.name} (عدد ${i.qty})`).join(', ');
    const msg = `مرحباً ${customer.name}،\nتفاصيل التأجير:\nالمواد: ${itemsText}\nالمدفوع مقدماً: ${formatIQD(trans.paid)} د.ع\nتاريخ: ${trans.date}\nإجمالي الديون: ${formatIQD(customer.balance)} د.ع\nشكراً لتعاملكم!`;
    window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function renderTransactions() {
    const list = document.getElementById('transactions-list');
    list.innerHTML = '';
    const custTrans = data.transactions.filter(t => t.customerId === currentCustomerId).reverse();

    custTrans.forEach(t => {
        if(t.type === 'payment') {
            list.innerHTML += `<div class="card" style="border-right:5px solid #27ae60;"><div class="card-info"><h4>تسديد نقد</h4><p>${formatIQD(t.amount)} | ${t.date} ${t.time}</p></div><div class="card-actions"><button class="btn-success btn-small" onclick="sharePaymentWhatsApp(${t.id})">واتساب</button></div></div>`;
        } else {
            const items = t.itemsArray.map(i => `${i.name}(${i.qty})`).join(', ');
            list.innerHTML += `<div class="card" style="border-right:5px solid #2980b9;"><div class="card-info"><h4>تأجير: ${items}</h4><p>التكلفة المحسوبة: ${formatIQD(t.totalCost)} | مسدد: ${formatIQD(t.paid)}</p><p>${t.date}</p></div><div class="card-actions"><button class="btn-success btn-small" onclick="shareRentWhatsApp(${t.id})" style="margin-bottom:3px;">واتساب</button><button class="btn-primary btn-small" onclick="openReturnModal(${t.id})">راجع</button>${t.status === 'completed' ? `<span style="color:#27ae60;font-size:12px;">مكتمل</span>` : ''}</div></div>`;
        }
    });
}

function updateUI() {
    if(document.getElementById('tab-inventory').classList.contains('active')) renderInventory();
    if(document.getElementById('tab-customers').classList.contains('active')) renderCustomers();
}

document.getElementById('search-inventory').addEventListener('input', renderInventory);
document.getElementById('search-customer').addEventListener('input', renderCustomers);
document.getElementById('btn-add-item-modal').addEventListener('click', () => openModal('addItemModal'));
document.getElementById('btn-add-customer-modal').addEventListener('click', () => openModal('addCustomerModal'));

initData();
