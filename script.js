// --- البيانات وحالة التطبيق ---
let currentInventory = 1;
let currentRentInventory = 1; 
let currentCustomerId = null;

let data = JSON.parse(localStorage.getItem('kareemData')) || {
    inventory1: [],
    inventory2: [],
    customers: [],
    transactions: []
};

function saveData() {
    localStorage.setItem('kareemData', JSON.stringify(data));
}

function formatIQD(number) {
    return new Intl.NumberFormat('en-IQ').format(number);
}

// --- نظام تسجيل الدخول ---
function checkPassword() {
    const pass = document.getElementById('password-input').value;
    if (pass === "1001") {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        switchTab('tab-customers'); 
    } else {
        alert("كلمة المرور خاطئة");
    }
}

// --- التنقل بين التبويبات السفلية ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById(tabId.replace('tab-', 'nav-')).classList.add('active');

    if(tabId === 'tab-inventory') {
        document.getElementById('search-inventory').value = '';
        renderInventory();
    }
    if(tabId === 'tab-customers') {
        document.getElementById('search-customer').value = '';
        document.getElementById('customers-main-view').style.display = 'block';
        document.getElementById('customer-details-view').style.display = 'none';
        renderCustomers();
    }
    if(tabId === 'tab-alerts') renderAlerts();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ================= قسم المخزون =================

function switchInventory(num) {
    currentInventory = num;
    document.getElementById('btn-inv-1').classList.remove('active');
    document.getElementById('btn-inv-2').classList.remove('active');
    document.getElementById(`btn-inv-${num}`).classList.add('active');
    document.getElementById('current-inv-label').innerText = num;
    document.getElementById('search-inventory').value = ''; 
    renderInventory();
}

function saveItem() {
    const name = document.getElementById('item-name').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const qty = parseInt(document.getElementById('item-qty').value);

    if (!name || isNaN(price) || isNaN(qty)) {
        alert("يرجى تعبئة جميع الحقول بشكل صحيح"); return;
    }

    const newItem = { id: Date.now(), name, price, qty };
    
    if (currentInventory === 1) data.inventory1.push(newItem);
    else data.inventory2.push(newItem);

    saveData();
    closeModal('addItemModal');
    
    document.getElementById('item-name').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-qty').value = '';
    
    searchInventory();
}

function searchInventory() {
    const query = document.getElementById('search-inventory').value.toLowerCase().trim();
    renderInventory(query);
}

function openEditModal(id, invNum) {
    const items = invNum === 1 ? data.inventory1 : data.inventory2;
    const item = items.find(i => i.id === id);

    if (item) {
        document.getElementById('edit-item-id').value = id;
        document.getElementById('edit-item-inv').value = invNum;
        document.getElementById('edit-item-name').value = item.name;
        document.getElementById('edit-item-price').value = item.price;
        document.getElementById('edit-item-qty').value = item.qty;
        
        openModal('editItemModal');
    }
}

function saveEditItem() {
    const id = parseInt(document.getElementById('edit-item-id').value);
    const invNum = parseInt(document.getElementById('edit-item-inv').value);
    const name = document.getElementById('edit-item-name').value;
    const price = parseFloat(document.getElementById('edit-item-price').value);
    const qty = parseInt(document.getElementById('edit-item-qty').value);

    if (!name || isNaN(price) || isNaN(qty)) {
        alert("يرجى تعبئة جميع الحقول بشكل صحيح"); return;
    }

    const items = invNum === 1 ? data.inventory1 : data.inventory2;
    const itemIndex = items.findIndex(i => i.id === id);

    if (itemIndex > -1) {
        items[itemIndex].name = name;
        items[itemIndex].price = price;
        items[itemIndex].qty = qty;
        
        saveData();
        closeModal('editItemModal');
        searchInventory();
    }
}

function deleteItem(id, invNum) {
    if(confirm("هل أنت متأكد من حذف هذه المادة؟")) {
        if(invNum === 1) data.inventory1 = data.inventory1.filter(item => item.id !== id);
        else data.inventory2 = data.inventory2.filter(item => item.id !== id);
        saveData();
        searchInventory();
    }
}

function renderInventory(searchQuery = '') {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    let items = currentInventory === 1 ? data.inventory1 : data.inventory2;

    if (searchQuery) {
        items = items.filter(item => item.name.toLowerCase().startsWith(searchQuery));
    }

    if(items.length === 0 && searchQuery !== '') {
        list.innerHTML = '<p style="text-align:center; color:#7f8c8d; padding: 20px;">لا توجد مواد تطابق بحثك.</p>';
        return;
    }

    items.forEach(item => {
        list.innerHTML += `
            <div class="card">
                <div class="card-info">
                    <h4>${item.name}</h4>
                    <p>السعر: ${formatIQD(item.price)} د.ع</p>
                    <p>الكمية المتوفرة: ${item.qty}</p>
                </div>
                <div class="card-actions">
                    <button class="btn-warning btn-small" onclick="openEditModal(${item.id}, ${currentInventory})">تعديل</button>
                    <button class="btn-danger btn-small" onclick="deleteItem(${item.id}, ${currentInventory})">حذف</button>
                </div>
            </div>
        `;
    });
}

// ================= قسم الزبائن =================

function searchCustomer() {
    const query = document.getElementById('search-customer').value.toLowerCase().trim();
    renderCustomers(query);
}

function saveCustomer() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;

    if (!name || !phone) { alert("يرجى إدخال الاسم والرقم"); return; }

    const newCustomer = {
        id: Date.now(),
        name: name,
        phone: "964" + phone,
        balance: 0
    };

    data.customers.push(newCustomer);
    saveData();
    closeModal('addCustomerModal');
    
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    
    searchCustomer();
}

function openEditCustomerModal(id) {
    const customer = data.customers.find(c => c.id === id);
    if (customer) {
        document.getElementById('edit-cust-id').value = customer.id;
        document.getElementById('edit-cust-name').value = customer.name;
        document.getElementById('edit-cust-phone').value = customer.phone.replace(/^964/, ''); // إزالة الكود للعرض
        
        openModal('editCustomerModal');
    }
}

function saveEditCustomer() {
    const id = parseInt(document.getElementById('edit-cust-id').value);
    const name = document.getElementById('edit-cust-name').value;
    const phone = document.getElementById('edit-cust-phone').value;

    if (!name || !phone) { alert("يرجى إدخال الاسم والرقم"); return; }

    const customerIndex = data.customers.findIndex(c => c.id === id);
    if (customerIndex > -1) {
        data.customers[customerIndex].name = name;
        data.customers[customerIndex].phone = "964" + phone;
        
        saveData();
        closeModal('editCustomerModal');
        searchCustomer();
    }
}

function renderCustomers(searchQuery = '') {
    const list = document.getElementById('customers-list');
    list.innerHTML = '';
    
    let filteredCustomers = data.customers;
    if(searchQuery) {
        // فلترة من أول حرف للاسم
        filteredCustomers = filteredCustomers.filter(cust => cust.name.toLowerCase().startsWith(searchQuery));
    }

    filteredCustomers.forEach(cust => {
        list.innerHTML += `
            <div class="card" onclick="openCustomerDetails(${cust.id})">
                <div class="card-info">
                    <h4>${cust.name}</h4>
                    <p>الرقم: +${cust.phone}</p>
                </div>
                <div class="card-actions">
                    <button class="btn-warning btn-small" onclick="event.stopPropagation(); openEditCustomerModal(${cust.id})">تعديل</button>
                    <button class="btn-danger btn-small" onclick="event.stopPropagation(); deleteCustomer(${cust.id})">حذف</button>
                </div>
            </div>
        `;
    });
}

function deleteCustomer(id) {
    if(confirm("هل أنت متأكد من حذف هذا الزبون؟")) {
        data.customers = data.customers.filter(c => c.id !== id);
        saveData();
        searchCustomer();
    }
}

function openCustomerDetails(id) {
    currentCustomerId = id;
    const customer = data.customers.find(c => c.id === id);
    
    document.getElementById('customers-main-view').style.display = 'none';
    document.getElementById('customer-details-view').style.display = 'block';
    
    document.getElementById('detail-customer-name').innerText = customer.name;
    document.getElementById('detail-customer-phone').innerText = "+" + customer.phone;
    document.getElementById('detail-customer-phone').href = "tel:+" + customer.phone;

    updateCustomerBalanceDisplay(customer);
    renderTransactions();
}

function backToCustomers() {
    document.getElementById('customers-main-view').style.display = 'block';
    document.getElementById('customer-details-view').style.display = 'none';
    currentCustomerId = null;
    searchCustomer();
}

function updateCustomerBalanceDisplay(customer) {
    document.getElementById('detail-customer-balance').innerText = `${formatIQD(customer.balance)} د.ع`;
}

// ================= قسم التأجير والتسديد والمعاملات =================

function savePayment() {
    const amount = parseFloat(document.getElementById('payment-amount').value);
    if(isNaN(amount) || amount <= 0) return;

    const customer = data.customers.find(c => c.id === currentCustomerId);
    customer.balance -= amount;

    const now = new Date();
    data.transactions.push({
        id: Date.now(),
        customerId: currentCustomerId,
        type: 'payment',
        amount: amount,
        date: now.toLocaleDateString('ar-IQ'),
        time: now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true })
    });

    saveData();
    closeModal('paymentModal');
    document.getElementById('payment-amount').value = '';
    updateCustomerBalanceDisplay(customer);
    renderTransactions();
}

function changeRentInventory(num) {
    currentRentInventory = num;
    document.getElementById('btn-rent-inv-1').classList.remove('active');
    document.getElementById('btn-rent-inv-2').classList.remove('active');
    document.getElementById(`btn-rent-inv-${num}`).classList.add('active');
    
    const searches = document.querySelectorAll('.rent-item-search');
    searches.forEach(search => {
        search.value = '';
    });
    const prices = document.querySelectorAll('.rent-item-price');
    prices.forEach(price => {
        price.value = '0';
    });
    calculateRentTotal();
}

function openRentModal() {
    changeRentInventory(1);
    document.getElementById('rent-items-container').innerHTML = '';
    document.getElementById('rent-days').value = '';
    document.getElementById('rent-paid').value = '';
    document.getElementById('rent-daily-total').innerText = '0';
    document.getElementById('rent-grand-total').innerText = '0';
    addRentItemRow(); 
    openModal('rentModal');
}

function filterRentItems(input, rowId) {
    const query = input.value.toLowerCase().trim();
    const dropdown = document.getElementById(`dropdown-${rowId}`);
    const items = currentRentInventory === 1 ? data.inventory1 : data.inventory2;
    
    dropdown.innerHTML = '';
    
    let filtered = items;
    if (query) {
        filtered = items.filter(item => item.name.toLowerCase().startsWith(query));
    }

    if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    filtered.forEach(item => {
        const div = document.createElement('div');
        div.style.padding = '10px';
        div.style.borderBottom = '1px solid #eee';
        div.style.cursor = 'pointer';
        div.innerText = `${item.name} (${formatIQD(item.price)} د.ع)`;
        div.onclick = function() {
            input.value = item.name;
            document.getElementById(`price-${rowId}`).value = item.price;
            dropdown.style.display = 'none';
            calculateRentTotal();
        };
        dropdown.appendChild(div);
    });
    
    dropdown.style.display = 'block';
}

document.addEventListener('click', function(e) {
    if (!e.target.classList.contains('rent-item-search')) {
        document.querySelectorAll('.rent-item-dropdown').forEach(d => d.style.display = 'none');
    }
});

function addRentItemRow() {
    const container = document.getElementById('rent-items-container');
    const rowId = Date.now();
    
    const rowHTML = `
        <div class="rent-item-row" id="row-${rowId}">
            <div style="position: relative; flex: 1;">
                <input type="text" id="search-${rowId}" class="rent-item-search" placeholder="ابحث عن مادة..." onkeyup="filterRentItems(this, ${rowId})" onfocus="filterRentItems(this, ${rowId})" autocomplete="off" style="margin-bottom:0;">
                <input type="hidden" id="price-${rowId}" class="rent-item-price" value="0">
                <div id="dropdown-${rowId}" class="rent-item-dropdown" style="display:none; position:absolute; background:white; width:100%; border:1px solid #bdc3c7; border-radius:4px; max-height:150px; overflow-y:auto; z-index:100; top:100%;"></div>
            </div>
            <input type="number" placeholder="الكمية" value="1" min="1" class="rent-item-qty" oninput="calculateRentTotal()" style="width: 70px; margin-bottom:0;">
            <button class="btn-danger btn-small" onclick="document.getElementById('row-${rowId}').remove(); calculateRentTotal()">X</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHTML);
}

function calculateRentTotal() {
    const prices = document.querySelectorAll('.rent-item-price');
    const qtys = document.querySelectorAll('.rent-item-qty');
    let dailyTotal = 0;

    prices.forEach((priceInput, index) => {
        const price = parseFloat(priceInput.value) || 0;
        const qty = parseInt(qtys[index].value) || 1;
        dailyTotal += (price * qty);
    });

    const days = parseInt(document.getElementById('rent-days').value) || 0;
    const grandTotal = dailyTotal * days;

    document.getElementById('rent-daily-total').innerText = formatIQD(dailyTotal);
    document.getElementById('rent-grand-total').innerText = formatIQD(grandTotal);
    
    return grandTotal;
}

function saveRentalTransaction() {
    const grandTotal = calculateRentTotal();
    const days = parseInt(document.getElementById('rent-days').value);
    const paid = parseFloat(document.getElementById('rent-paid').value) || 0;

    if(!days || days <= 0 || grandTotal === 0) {
        alert("يرجى اختيار مواد وتحديد عدد الأيام"); return;
    }

    const customer = data.customers.find(c => c.id === currentCustomerId);

    let itemsText = [];
    let itemsArray = [];
    let canRent = true;

    const searches = document.querySelectorAll('.rent-item-search');
    const qtys = document.querySelectorAll('.rent-item-qty');
    
    searches.forEach((search, index) => {
        if(search.value.trim() !== '') {
            const itemName = search.value.trim();
            const qty = parseInt(qtys[index].value) || 1;
            
            let foundItem = data.inventory1.find(i => i.name === itemName);
            let invType = 1;
            if(!foundItem) {
                foundItem = data.inventory2.find(i => i.name === itemName);
                invType = 2;
            }

            if(foundItem) {
                if(foundItem.qty < qty) {
                    canRent = false;
                } else {
                    itemsArray.push({
                        id: foundItem.id,
                        name: foundItem.name,
                        qty: qty,
                        invType: invType,
                        returnedQty: 0,
                        returnDate: null
                    });
                    itemsText.push(`${itemName} (عدد ${qty})`);
                }
            } else {
                 canRent = false;
            }
        }
    });

    if(!canRent) {
        alert("المخزون لا يكفي أو المادة غير موجودة!");
        return;
    }

    itemsArray.forEach(item => {
        if(item.invType === 1) {
            let invItem = data.inventory1.find(i => i.id === item.id);
            if(invItem) invItem.qty -= item.qty;
        } else {
            let invItem = data.inventory2.find(i => i.id === item.id);
            if(invItem) invItem.qty -= item.qty;
        }
    });

    const remaining = grandTotal - paid;
    customer.balance += remaining;

    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + days);
    
    const now = new Date();
    const rawDate = now.toISOString().split('T')[0];
    const rawTime = now.toTimeString().slice(0, 5);

    const transaction = {
        id: Date.now(),
        customerId: currentCustomerId,
        type: 'rent',
        items: itemsText.join(' + '),
        itemsArray: itemsArray,
        days: days,
        total: grandTotal,
        paid: paid,
        remaining: remaining,
        date: now.toLocaleDateString('ar-IQ'),
        time: now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true }),
        rawDate: rawDate,
        rawTime: rawTime,
        returnDateTimestamp: returnDate.getTime(),
        status: 'ongoing'
    };

    data.transactions.push(transaction);
    saveData();
    closeModal('rentModal');
    updateCustomerBalanceDisplay(customer);
    renderTransactions();
    renderInventory();
}

function deleteTransaction(id) {
    if(confirm("هل أنت متأكد من حذف هذه المعاملة؟ سيتم التراجع عن تأثيرها في حساب الزبون.")) {
        const trans = data.transactions.find(t => t.id === id);
        const customer = data.customers.find(c => c.id === trans.customerId);
        
        if (trans.type === 'rent') {
            customer.balance -= trans.remaining;
            if(trans.itemsArray) {
                trans.itemsArray.forEach(item => {
                    const unreturnedQty = item.qty - item.returnedQty;
                    if(unreturnedQty > 0) {
                        if(item.invType === 1) {
                            let invItem = data.inventory1.find(i => i.id === item.id);
                            if(invItem) invItem.qty += unreturnedQty;
                        } else {
                            let invItem = data.inventory2.find(i => i.id === item.id);
                            if(invItem) invItem.qty += unreturnedQty;
                        }
                    }
                });
            }
        } else if (trans.type === 'payment') {
            customer.balance += trans.amount; 
        }
        
        data.transactions = data.transactions.filter(t => t.id !== id);
        saveData();
        updateCustomerBalanceDisplay(customer);
        renderTransactions();
        renderInventory();
    }
}

function openEditTransactionModal(id) {
    const trans = data.transactions.find(t => t.id === id);
    if(trans && trans.type === 'rent') {
        document.getElementById('edit-trans-id').value = id;
        document.getElementById('edit-trans-items').value = trans.items || '';
        document.getElementById('edit-trans-date').value = trans.rawDate || '';
        document.getElementById('edit-trans-time').value = trans.rawTime || '';
        document.getElementById('edit-trans-days').value = trans.days;
        
        const dailyRate = trans.days > 0 ? (trans.total / trans.days) : 0;
        document.getElementById('edit-trans-days').dataset.dailyRate = dailyRate;
        
        document.getElementById('edit-trans-total').value = trans.total;
        document.getElementById('edit-trans-paid').value = trans.paid;
        openModal('editTransactionModal');
    }
}

function updateEditTotal() {
    const daysInput = document.getElementById('edit-trans-days');
    const dailyRate = parseFloat(daysInput.dataset.dailyRate) || 0;
    const newDays = parseInt(daysInput.value) || 0;
    document.getElementById('edit-trans-total').value = dailyRate * newDays;
}

function saveEditTransaction() {
    const id = parseInt(document.getElementById('edit-trans-id').value);
    const trans = data.transactions.find(t => t.id === id);
    const customer = data.customers.find(c => c.id === trans.customerId);
    
    const newItems = document.getElementById('edit-trans-items').value;
    const newDate = document.getElementById('edit-trans-date').value;
    const newTime = document.getElementById('edit-trans-time').value;
    const newDays = parseInt(document.getElementById('edit-trans-days').value) || trans.days;
    const newTotal = parseFloat(document.getElementById('edit-trans-total').value) || 0;
    const newPaid = parseFloat(document.getElementById('edit-trans-paid').value) || 0;
    
    customer.balance -= trans.remaining;
    
    trans.items = newItems;
    if(newDate) { trans.rawDate = newDate; trans.date = newDate; }
    if(newTime) { trans.rawTime = newTime; trans.time = newTime; }
    trans.days = newDays;
    trans.total = newTotal;
    trans.paid = newPaid;
    trans.remaining = trans.total - trans.paid;
    
    customer.balance += trans.remaining;
    
    saveData();
    closeModal('editTransactionModal');
    updateCustomerBalanceDisplay(customer);
    renderTransactions();
}

function openReturnModal(id) {
    document.getElementById('return-trans-id').value = id;
    const trans = data.transactions.find(t => t.id === id);
    const container = document.getElementById('return-items-container');
    container.innerHTML = '';

    if(trans.itemsArray && trans.itemsArray.length > 0) {
        trans.itemsArray.forEach((item, index) => {
            const pendingQty = item.qty - item.returnedQty;
            let html = `
                <div class="rent-item-row" style="flex-direction:column; align-items:start; gap:5px;">
                    <div style="font-weight:bold;">${item.name} (الكمية الكلية: ${item.qty} | المتبقي للإرجاع: ${pendingQty})</div>
            `;
            
            if(pendingQty > 0) {
                html += `
                    <div style="display:flex; gap:5px; width:100%;">
                        <input type="number" id="ret-qty-${index}" placeholder="الكمية المرجعة" value="${pendingQty}" max="${pendingQty}" min="1" style="margin-bottom:0; flex:1;">
                        <input type="number" id="ret-pay-${index}" placeholder="مبلغ التسديد" style="margin-bottom:0; flex:1;">
                        <button class="btn-primary btn-small" onclick="processSingleReturn(${id}, ${index})" style="margin-bottom:0;">إرجاع</button>
                    </div>
                `;
            } else {
                html += `<div style="color:green; font-size:14px; font-weight:bold;">تم الإرجاع بتاريخ: ${item.returnDate}</div>`;
            }
            html += `</div>`;
            container.innerHTML += html;
        });
    } else {
        container.innerHTML = '<p>لا توجد تفاصيل مواد لهذه المعاملة القديمة.</p>';
    }
    openModal('returnModal');
}

function processSingleReturn(transId, itemIndex) {
    const trans = data.transactions.find(t => t.id === transId);
    const customer = data.customers.find(c => c.id === trans.customerId);
    const item = trans.itemsArray[itemIndex];
    
    const qtyInput = parseInt(document.getElementById(`ret-qty-${itemIndex}`).value) || 0;
    const payInput = parseFloat(document.getElementById(`ret-pay-${itemIndex}`).value) || 0;
    
    const pendingQty = item.qty - item.returnedQty;
    if(qtyInput <= 0 || qtyInput > pendingQty) {
        alert("كمية الإرجاع غير صالحة"); return;
    }

    item.returnedQty += qtyInput;
    const now = new Date();
    item.returnDate = now.toLocaleDateString('ar-IQ') + ' ' + now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true });

    if(item.invType === 1) {
        let invItem = data.inventory1.find(i => i.id === item.id);
        if(invItem) invItem.qty += qtyInput;
    } else {
        let invItem = data.inventory2.find(i => i.id === item.id);
        if(invItem) invItem.qty += qtyInput;
    }

    if(payInput > 0) {
        trans.paid += payInput;
        trans.remaining = trans.total - trans.paid;
        customer.balance -= payInput;
    }

    const allReturned = trans.itemsArray.every(i => i.returnedQty >= i.qty);
    if(allReturned) {
        trans.status = 'completed';
    }

    saveData();
    openReturnModal(transId); 
    updateCustomerBalanceDisplay(customer);
    renderTransactions();
    renderInventory();
}

function renderTransactions() {
    const list = document.getElementById('transactions-list');
    list.innerHTML = '';
    
    const custTrans = data.transactions.filter(t => t.customerId === currentCustomerId).reverse();

    custTrans.forEach(t => {
        const displayTime = t.time ? t.time : ''; 
        
        if(t.type === 'payment') {
            list.innerHTML += `
                <div class="card" style="border-right: 5px solid #27ae60;">
                    <div class="card-info">
                        <h4 style="color:#27ae60;">تسديد نقد</h4>
                        <p>المبلغ: ${formatIQD(t.amount)} د.ع | التاريخ: ${t.date} ${displayTime}</p>
                    </div>
                    <div class="card-actions">
                        <button class="btn-danger btn-small" onclick="deleteTransaction(${t.id})">حذف</button>
                    </div>
                </div>
            `;
        } else {
            list.innerHTML += `
                <div class="card" style="border-right: 5px solid #2980b9;">
                    <div class="card-info">
                        <h4>تأجير: ${t.items}</h4>
                        <p>المدة: ${t.days} أيام | الكلي: ${formatIQD(t.total)}</p>
                        <p>المدفوع: ${formatIQD(t.paid)} | الباقي: ${formatIQD(t.remaining)}</p>
                        <p>تاريخ: ${t.date} | الوقت: ${displayTime}</p>
                    </div>
                    <div class="card-actions">
                        <button class="btn-success btn-small" onclick="shareWhatsApp(${t.id})" style="margin-bottom:3px;">واتساب</button>
                        <button class="btn-primary btn-small" onclick="openReturnModal(${t.id})" style="margin-bottom:3px; background:linear-gradient(to bottom, #e67e22, #d35400);">الراجع</button>
                        ${t.status === 'completed' ? `<span style="color: #27ae60; font-size:14px; font-weight:bold; text-align:center; margin-bottom:5px;">مكتملة ✔</span>` : ''}
                        <button class="btn-warning btn-small" onclick="openEditTransactionModal(${t.id})" style="margin-bottom:3px;">تعديل</button>
                        <button class="btn-danger btn-small" onclick="deleteTransaction(${t.id})">حذف</button>
                    </div>
                </div>
            `;
        }
    });
}

function shareWhatsApp(transId) {
    const trans = data.transactions.find(t => t.id === transId);
    const customer = data.customers.find(c => c.id === trans.customerId);
    
    const cleanItems = trans.items.replace(/<[^>]*>?/gm, ' ');

    const message = `*محلات كريم لتأجير العدد اليدوية*\n\nمرحباً ${customer.name}،\nتفاصيل التأجير:\nالمواد: ${cleanItems}\nالمدة: ${trans.days} أيام\nالمبلغ الكلي: ${formatIQD(trans.total)} د.ع\nالمدفوع: ${formatIQD(trans.paid)} د.ع\nالمتبقي من هذه الفاتورة: ${formatIQD(trans.remaining)} د.ع\n\nإجمالي الباقي بذمتكم: ${formatIQD(customer.balance)} د.ع\n\nشكراً لتعاملكم معنا!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

// ================= قسم التنبيهات =================

function renderAlerts() {
    const list = document.getElementById('alerts-list');
    list.innerHTML = '';
    
    const now = Date.now();
    let hasAlerts = false;

    data.transactions.forEach(t => {
        if(t.type === 'rent' && t.status === 'ongoing' && t.returnDateTimestamp < now) {
            hasAlerts = true;
            const customer = data.customers.find(c => c.id === t.customerId);
            
            const diffTime = Math.abs(now - t.returnDateTimestamp);
            const delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            list.innerHTML += `
                <div class="card" style="border-right: 5px solid #e74c3c; background-color: #fdf0ed;">
                    <div class="card-info">
                        <h4 style="color:#c0392b;">تأخير: ${customer.name}</h4>
                        <p>المواد: ${t.items.replace(/<[^>]*>?/gm, ' ')}</p>
                        <p>مدة التأخير: ${delayDays} يوم</p>
                        <p>الرقم: +${customer.phone}</p>
                    </div>
                    <div class="card-actions">
                        <a href="https://wa.me/${customer.phone}" target="_blank" class="btn-success btn-small" style="text-decoration:none; text-align:center;">مراسلة</a>
                    </div>
                </div>
            `;
        }
    });

    if(!hasAlerts) {
        list.innerHTML = '<p style="text-align:center; color:#7f8c8d; margin-top:20px; font-weight:bold;">لا توجد تنبيهات حالياً.</p>';
    }
}
