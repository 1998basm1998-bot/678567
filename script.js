// --- البيانات وحالة التطبيق ---
let currentInventory = 1;
let currentRentInventory = 1; // للتحكم بمخزون نافذة البيع
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
        renderInventory();
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
    document.getElementById('search-inventory').value = ''; // تصفير حقل البحث عند التبديل
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
    
    // استعادة عرض القائمة مع مراعاة البحث الحالي إن وجد
    searchInventory();
}

// دالة البحث الجديدة من أول الاسم
function searchInventory() {
    const query = document.getElementById('search-inventory').value.toLowerCase().trim();
    renderInventory(query);
}

// دالة فتح نافذة التعديل
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

// دالة حفظ التعديلات
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
        
        // تحديث العرض مع بقاء فلتر البحث إن وجد
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
        // فلترة بناءً على تطابق بداية الاسم (من أول اسم)
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
    
    renderCustomers();
}

function renderCustomers() {
    const list = document.getElementById('customers-list');
    list.innerHTML = '';
    data.customers.forEach(cust => {
        list.innerHTML += `
            <div class="card" onclick="openCustomerDetails(${cust.id})">
                <div class="card-info">
                    <h4>${cust.name}</h4>
                    <p>الرقم: +${cust.phone}</p>
                </div>
                <div class="card-actions">
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
        renderCustomers();
    }
}

function openCustomerDetails(id) {
    currentCustomerId = id;
    const customer = data.customers.find(c => c.id === id);
    
    document.getElementById('customers-main-view').style.display = 'none';
    document.getElementById('customer-details-view').style.display = 'block';
    
    document.getElementById('detail-customer-name').innerText = customer.name;
    updateCustomerBalanceDisplay(customer);
    renderTransactions();
}

function backToCustomers() {
    document.getElementById('customers-main-view').style.display = 'block';
    document.getElementById('customer-details-view').style.display = 'none';
    currentCustomerId = null;
    renderCustomers();
}

function updateCustomerBalanceDisplay(customer) {
    document.getElementById('detail-customer-balance').innerText = `${formatIQD(customer.balance)} د.ع`;
}

// ================= قسم التأجير والتسديد =================

function savePayment() {
    const amount = parseFloat(document.getElementById('payment-amount').value);
    if(isNaN(amount) || amount <= 0) return;

    const customer = data.customers.find(c => c.id === currentCustomerId);
    customer.balance -= amount;

    data.transactions.push({
        id: Date.now(),
        customerId: currentCustomerId,
        type: 'payment',
        amount: amount,
        date: new Date().toLocaleDateString('ar-IQ')
    });

    saveData();
    closeModal('paymentModal');
    document.getElementById('payment-amount').value = '';
    updateCustomerBalanceDisplay(customer);
    renderTransactions();
}

// تغيير المخزون داخل نافذة البيع
function changeRentInventory(num) {
    currentRentInventory = num;
    document.getElementById('btn-rent-inv-1').classList.remove('active');
    document.getElementById('btn-rent-inv-2').classList.remove('active');
    document.getElementById(`btn-rent-inv-${num}`).classList.add('active');
    
    // تحديث جميع القوائم المنسدلة الحالية بالمواد الجديدة وإفراغ اختيارها
    const selects = document.querySelectorAll('.rent-item-select');
    selects.forEach(select => {
        populateSelectOptions(select);
    });
    calculateRentTotal();
}

function populateSelectOptions(selectElement) {
    const items = currentRentInventory === 1 ? data.inventory1 : data.inventory2;
    let optionsHTML = '<option value="">اختر مادة...</option>';
    items.forEach(item => {
        optionsHTML += `<option value="${item.id}" data-price="${item.price}">${item.name} (${formatIQD(item.price)} د.ع)</option>`;
    });
    selectElement.innerHTML = optionsHTML;
}

function openRentModal() {
    // تعيين المخزون الافتراضي لعملية البيع
    changeRentInventory(1);
    
    document.getElementById('rent-items-container').innerHTML = '';
    document.getElementById('rent-days').value = '';
    document.getElementById('rent-paid').value = '';
    document.getElementById('rent-daily-total').innerText = '0';
    document.getElementById('rent-grand-total').innerText = '0';
    addRentItemRow(); 
    openModal('rentModal');
}

function addRentItemRow() {
    const container = document.getElementById('rent-items-container');
    const rowId = Date.now();
    
    const rowHTML = `
        <div class="rent-item-row" id="row-${rowId}">
            <select class="rent-item-select" onchange="calculateRentTotal()">
            </select>
            <input type="number" placeholder="الكمية" value="1" min="1" class="rent-item-qty" oninput="calculateRentTotal()" style="width: 70px; margin-bottom:0;">
            <button class="btn-danger btn-small" onclick="document.getElementById('row-${rowId}').remove(); calculateRentTotal()">X</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHTML);
    
    // تعبئة القائمة بالمواد الخاصة بالمخزون المحدد حالياً
    const newSelect = container.querySelector(`#row-${rowId} .rent-item-select`);
    populateSelectOptions(newSelect);
}

function calculateRentTotal() {
    const selects = document.querySelectorAll('.rent-item-select');
    const qtys = document.querySelectorAll('.rent-item-qty');
    let dailyTotal = 0;

    selects.forEach((select, index) => {
        if(select.value) {
            const price = parseFloat(select.options[select.selectedIndex].getAttribute('data-price'));
            const qty = parseInt(qtys[index].value) || 1;
            dailyTotal += (price * qty);
        }
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
    const remaining = grandTotal - paid;
    customer.balance += remaining;

    let itemsText = [];
    document.querySelectorAll('.rent-item-select').forEach(select => {
        if(select.value) itemsText.push(select.options[select.selectedIndex].text.split('(')[0]);
    });

    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + days);

    const transaction = {
        id: Date.now(),
        customerId: currentCustomerId,
        type: 'rent',
        items: itemsText.join(' + '),
        days: days,
        total: grandTotal,
        paid: paid,
        remaining: remaining,
        date: new Date().toLocaleDateString('ar-IQ'),
        returnDateTimestamp: returnDate.getTime(),
        status: 'ongoing'
    };

    data.transactions.push(transaction);
    saveData();
    closeModal('rentModal');
    updateCustomerBalanceDisplay(customer);
    renderTransactions();
}

function renderTransactions() {
    const list = document.getElementById('transactions-list');
    list.innerHTML = '';
    
    const custTrans = data.transactions.filter(t => t.customerId === currentCustomerId).reverse();

    custTrans.forEach(t => {
        if(t.type === 'payment') {
            list.innerHTML += `
                <div class="card" style="border-right: 5px solid #27ae60;">
                    <div class="card-info">
                        <h4 style="color:#27ae60;">تسديد نقد</h4>
                        <p>المبلغ: ${formatIQD(t.amount)} د.ع | التاريخ: ${t.date}</p>
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
                        <p>تاريخ: ${t.date}</p>
                    </div>
                    <div class="card-actions">
                        <button class="btn-success btn-small" onclick="shareWhatsApp(${t.id})">مشاركة واتساب</button>
                        ${t.status === 'ongoing' ? `<button class="btn-primary btn-small" onclick="completeTransaction(${t.id})">إنهاء</button>` : `<span style="color: #27ae60; font-size:14px; font-weight:bold; text-align:center;">مكتملة ✔</span>`}
                    </div>
                </div>
            `;
        }
    });
}

function completeTransaction(transId) {
    if(confirm("هل تم إرجاع المواد؟")) {
        const trans = data.transactions.find(t => t.id === transId);
        trans.status = 'completed';
        saveData();
        renderTransactions();
    }
}

function shareWhatsApp(transId) {
    const trans = data.transactions.find(t => t.id === transId);
    const customer = data.customers.find(c => c.id === trans.customerId);
    
    const message = `*محلات كريم لتأجير العدد اليدوية*\n\nمرحباً ${customer.name}،\nتفاصيل التأجير:\nالمواد: ${trans.items}\nالمدة: ${trans.days} أيام\nالمبلغ الكلي: ${formatIQD(trans.total)} د.ع\nالمدفوع: ${formatIQD(trans.paid)} د.ع\nالمتبقي من هذه الفاتورة: ${formatIQD(trans.remaining)} د.ع\n\nإجمالي الباقي بذمتكم: ${formatIQD(customer.balance)} د.ع\n\nشكراً لتعاملكم معنا!`;
    
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
                        <p>المواد: ${t.items}</p>
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
