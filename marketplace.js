// marketplace.js – ฟังก์ชัน Marketplace ของสภานักเรียน
// ------------------------------------------------------------
// 1. เปิด/ปิดโมดัลขายสินค้า
function openMarketplaceModal() {
  const modal = document.getElementById('marketplace-modal');
  modal.classList.remove('hidden');
  modal.classList.add('open');
}
function closeMarketplaceModal() {
  const modal = document.getElementById('marketplace-modal');
  modal.classList.remove('open');
  modal.classList.add('hidden');
}
// ปุ่ม floating ให้เปิดโมดัล
document.getElementById('marketplace-fab')?.addEventListener('click', e => {
  e.preventDefault();
  openMarketplaceModal();
});
document.getElementById('marketplace-grid')?.addEventListener('click', e => {
  const button = e.target.closest('[data-marketplace-details]');
  if (button) showMarketplaceDetails(button.dataset.marketplaceDetails);
});

// 2. แสดงตัวอย่างภาพเมื่อเลือกไฟล์
document.getElementById('mp-image')?.addEventListener('change', function () {
  const preview = document.getElementById('mp-image-preview');
  preview.innerHTML = '';
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}" class="max-w-full h-auto rounded-xl"/>`;
    };
    reader.readAsDataURL(this.files[0]);
  }
});

// 3. บันทึกรายการขาย (สถานะ pending)
document.getElementById('marketplace-form')?.addEventListener('submit', e => {
  e.preventDefault();

  const item = {
    id: Date.now(),
    title: document.getElementById('mp-title').value.trim(),
    price: parseFloat(document.getElementById('mp-price').value),
    category: document.getElementById('mp-category').value,
    description: document.getElementById('mp-description').value.trim(),
    condition: document.getElementById('mp-condition').value.trim(),
    image: document.querySelector('#mp-image-preview img')?.src || '',
    sellerName: document.getElementById('mp-seller-name').value.trim(),
    sellerClass: document.getElementById('mp-seller-class').value.trim(),
    fb: document.getElementById('mp-fb').value.trim(),
    ig: document.getElementById('mp-ig').value.trim(),
    phone: document.getElementById('mp-phone').value.trim(),
    status: 'pending', // pending / approved / rejected
    submittedAt: new Date().toISOString()
  };

  const storeKey = 'kpaos_marketplace';
  const existing = JSON.parse(localStorage.getItem(storeKey) || '[]');
  existing.unshift(item);
  localStorage.setItem(storeKey, JSON.stringify(existing));

  closeMarketplaceModal();
  showToast('ส่งรายการขายเรียบร้อยแล้ว – รอการตรวจสอบจากสภานักเรียน');
  renderMarketplace();
});

// 4. แสดง toast แจ้งผล
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-emerald-900 text-white px-4 py-2 rounded-xl shadow-lg';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function escapeMarketplaceHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function getMarketplaceProfileUrl(value, platform) {
  const input = String(value || '').trim();
  if (!input) return '';

  const domains = {
    facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com'],
    instagram: ['instagram.com', 'www.instagram.com']
  };
  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      return url.protocol === 'https:' && domains[platform].includes(url.hostname.toLowerCase())
        ? url.href
        : '';
    } catch (error) {
      return '';
    }
  }

  const username = input.replace(/^@/, '');
  if (!/^[a-zA-Z0-9._]+$/.test(username)) return '';
  return `https://${platform === 'facebook' ? 'www.facebook.com' : 'www.instagram.com'}/${encodeURIComponent(username)}`;
}

function showMarketplaceDetails(id) {
  const items = JSON.parse(localStorage.getItem('kpaos_marketplace') || '[]');
  const item = items.find(entry => String(entry.id) === String(id));
  if (!item) {
    showToast('ไม่พบรายละเอียดสินค้านี้');
    return;
  }

  const text = value => escapeMarketplaceHTML(value || 'ไม่ได้ระบุ');
  const contactLink = (label, value, platform) => {
    const url = getMarketplaceProfileUrl(value, platform);
    return url
      ? `<a href="${escapeMarketplaceHTML(url)}" target="_blank" rel="noopener noreferrer" class="text-emerald-800 underline">${label}</a>`
      : `<span>${label}: ${text(value)}</span>`;
  };
  const phone = String(item.phone || '').trim();
  const phoneNumber = phone.replace(/[^\d+]/g, '');
  const phoneDisplay = phone
    ? ( /^\+?\d{6,15}$/.test(phoneNumber)
        ? `<a href="tel:${escapeMarketplaceHTML(phoneNumber)}" class="text-emerald-800 underline">${text(phone)}</a>`
        : text(phone))
    : 'ไม่ได้ระบุ';
  const details = `
    <div class="space-y-3 text-sm text-slate-700">
      <p><strong>หมวดหมู่:</strong> ${text(item.category)}</p>
      <p><strong>สภาพสินค้า:</strong> ${text(item.condition)}</p>
      <p class="whitespace-pre-line"><strong>รายละเอียด:</strong> ${text(item.description)}</p>
      <div class="border-t border-black/[0.08] pt-3 space-y-2">
        <p><strong>ผู้ขาย:</strong> ${text(item.sellerName)} (${text(item.sellerClass)})</p>
        <p>${contactLink('Facebook', item.fb, 'facebook')}</p>
        <p>${contactLink('Instagram', item.ig, 'instagram')}</p>
        <p><strong>เบอร์โทร:</strong> ${phoneDisplay}</p>
      </div>
    </div>`;

  if (window.showAppleModal) {
    window.showAppleModal('รายละเอียดสินค้า', item.title || 'สินค้า', details);
    return;
  }
  showToast('ไม่สามารถเปิดหน้ารายละเอียดได้');
}

// 5. เรนเดอร์สินค้าสาธารณะ (approved เท่านั้น)
function renderMarketplace() {
  const grid = document.getElementById('marketplace-grid');
  if (!grid) return;

  const allItems = JSON.parse(localStorage.getItem('kpaos_marketplace') || '[]');
  const approved = allItems.filter(i => i.status === 'approved');

  // ค้นหา/กรอง/เรียงลำดับตาม UI
  const query = document.getElementById('market-search')?.value.trim().toLowerCase() || '';
  const cat   = document.getElementById('market-category')?.value || '';
  const sort  = document.getElementById('market-sort')?.value || 'dateDesc';

  let filtered = approved.filter(i => {
    const matchesQuery = i.title.toLowerCase().includes(query) || i.description.toLowerCase().includes(query);
    const matchesCat   = !cat || i.category === cat;
    return matchesQuery && matchesCat;
  });

  if (sort === 'priceAsc')   filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'priceDesc') filtered.sort((a, b) => b.price - a.price);
  else filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  grid.innerHTML = filtered.map(i => `
    <div class="market-card">
      <div class="market-card-img-wrap">
        ${i.image ? `<img src="${i.image}" alt="${i.title}"/>` : ''}
      </div>
      <div class="p-4">
        <h3 class="font-bold text-[#1D1D1F]">${i.title}</h3>
        <p class="text-emerald-900 font-medium">฿${i.price.toLocaleString()}</p>
        <p class="text-sm text-[#86868B]">โดย ${i.sellerName} (${i.sellerClass})</p>
        <button type="button" data-marketplace-details="${escapeMarketplaceHTML(i.id)}" class="apple-btn-secondary px-4 py-2 mt-3 text-sm">ดูรายละเอียดและติดต่อผู้ขาย</button>
        <div class="flex gap-2 mt-2">
          ${getMarketplaceProfileUrl(i.fb, 'facebook') ? `<a href="${escapeMarketplaceHTML(getMarketplaceProfileUrl(i.fb, 'facebook'))}" target="_blank" rel="noopener noreferrer" class="text-emerald-600" aria-label="Facebook"><i data-lucide="facebook"></i></a>` : ''}
          ${getMarketplaceProfileUrl(i.ig, 'instagram') ? `<a href="${escapeMarketplaceHTML(getMarketplaceProfileUrl(i.ig, 'instagram'))}" target="_blank" rel="noopener noreferrer" class="text-emerald-600" aria-label="Instagram"><i data-lucide="instagram"></i></a>` : ''}
        </div>
      </div>
    </div>`).join('');

  if (window.lucide) window.lucide.createIcons();
}

// 6. เวอร์ชันผู้ดูแล (admin) – แสดงรายการ pending พร้อมปุ่ม Approve / Reject
function renderAdminMarketplace() {
  const grid = document.getElementById('marketplace-grid');
  if (!grid) return;

  const allItems = JSON.parse(localStorage.getItem('kpaos_marketplace') || '[]');
  const pending = allItems.filter(i => i.status === 'pending');

  grid.innerHTML = pending.map(i => `
    <div class="market-card border border-emerald-200">
      <div class="market-card-img-wrap">
        ${i.image ? `<img src="${i.image}" alt="${i.title}"/>` : ''}
      </div>
      <div class="p-4">
        <h3 class="font-bold text-[#1D1D1F]">${i.title}</h3>
        <p class="text-emerald-900 font-medium">฿${i.price.toLocaleString()}</p>
        <p class="text-sm text-[#86868B]">โดย ${i.sellerName} (${i.sellerClass})</p>
        <p class="text-xs mt-1">${i.description}</p>
        <button type="button" data-marketplace-details="${escapeMarketplaceHTML(i.id)}" class="apple-btn-secondary px-4 py-2 mt-3 text-sm">ดูรายละเอียดและติดต่อผู้ขาย</button>
        <div class="flex gap-2 mt-2">
          ${getMarketplaceProfileUrl(i.fb, 'facebook') ? `<a href="${escapeMarketplaceHTML(getMarketplaceProfileUrl(i.fb, 'facebook'))}" target="_blank" rel="noopener noreferrer" class="text-emerald-600" aria-label="Facebook"><i data-lucide="facebook"></i></a>` : ''}
          ${getMarketplaceProfileUrl(i.ig, 'instagram') ? `<a href="${escapeMarketplaceHTML(getMarketplaceProfileUrl(i.ig, 'instagram'))}" target="_blank" rel="noopener noreferrer" class="text-emerald-600" aria-label="Instagram"><i data-lucide="instagram"></i></a>` : ''}
        </div>
        <div class="flex gap-2 mt-3">
          <button class="apple-btn-primary px-3 py-1 text-xs" onclick="updateItemStatus(${i.id}, 'approved')">Approve</button>
          <button class="apple-btn-primary bg-red-600 hover:bg-red-700 px-3 py-1 text-xs" onclick="updateItemStatus(${i.id}, 'rejected')">Reject</button>
        </div>
        <span class="badge-pending mt-2 inline-block">Pending</span>
      </div>
    </div>`).join('');

  if (window.lucide) window.lucide.createIcons();
}

// 7. อัปเดตสถานะสินค้า (Approve / Reject)
function updateItemStatus(id, newStatus) {
  const storeKey = 'kpaos_marketplace';
  const items = JSON.parse(localStorage.getItem(storeKey) || '[]');
  const idx = items.findIndex(i => i.id === id);
  if (idx > -1) {
    items[idx].status = newStatus;
    localStorage.setItem(storeKey, JSON.stringify(items));
    renderMarketplace();
    if (location.hash === '#admin-marketplace') renderAdminMarketplace();
    showToast(`รายการได้ถูก ${newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}`);
  }
}

// 8. เริ่มต้นการแสดงผลเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
  renderMarketplace();
  // ถ้าอยู่ในหน้า admin ให้แสดง pending queue
  if (location.hash === '#admin-marketplace') {
    renderAdminMarketplace();
  }
});
