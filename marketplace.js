const MARKETPLACE_STORE_KEY = 'kpaos_marketplace';
const MARKETPLACE_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MARKETPLACE_API_FALLBACK = 'https://script.google.com/macros/s/AKfycbzIRXPFKYvqsPVsSN90171P5m4D2ZfA-ujU84_n_KqU1ib4Hy_dn5P_6Y3elt_5elkG/exec';
let marketplaceItems = [];

function marketplaceApiUrl() {
  return window.KPAOS_GOOGLE_SCRIPT_URL || MARKETPLACE_API_FALLBACK;
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

function saveMarketplaceCache(items) {
  marketplaceItems = items;
  try {
    localStorage.setItem(MARKETPLACE_STORE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Unable to cache marketplace items:', error);
  }
}

function requestMarketplaceItems() {
  const apiUrl = marketplaceApiUrl();
  if (!apiUrl) return Promise.reject(new Error('ยังไม่ได้ตั้งค่า Google Apps Script URL'));

  return new Promise((resolve, reject) => {
    const callbackName = `__kpaosMarketplace${Date.now()}${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    const params = new URLSearchParams({
      action: 'marketplace',
      callback: callbackName,
      _: String(Date.now())
    });
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('หมดเวลารอข้อมูลตลาด'));
    }, 15000);
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
      clearTimeout(timeout);
    };

    window[callbackName] = response => {
      cleanup();
      if (response?.status === 'success' && Array.isArray(response.items)) {
        resolve(response.items);
      } else {
        reject(new Error(response?.message || 'ข้อมูลจาก Apps Script ไม่ถูกต้อง'));
      }
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('เชื่อมต่อ Google Apps Script ไม่สำเร็จ'));
    };
    script.src = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}${params}`;
    document.head.appendChild(script);
  });
}

function postMarketplaceSubmission(item) {
  const apiUrl = marketplaceApiUrl();
  if (!apiUrl) return Promise.reject(new Error('ยังไม่ได้ตั้งค่า Google Apps Script URL'));

  const requestId = `marketplace-post-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const iframe = document.createElement('iframe');
  iframe.name = requestId;
  iframe.hidden = true;
  iframe.setAttribute('aria-hidden', 'true');

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = apiUrl;
  form.target = requestId;
  form.enctype = 'application/x-www-form-urlencoded';
  form.hidden = true;

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'payload';
  input.value = JSON.stringify({ type: 'marketplace', action: 'submit', item });
  form.appendChild(input);

  document.body.append(iframe, form);
  try {
    form.submit();
  } catch (error) {
    iframe.remove();
    form.remove();
    return Promise.reject(error);
  }

  return new Promise(resolve => {
    setTimeout(() => {
      iframe.remove();
      form.remove();
      resolve();
    }, 1000);
  });
}

function verifyMarketplaceSubmission(id) {
  const apiUrl = marketplaceApiUrl();
  const checkOnce = () => new Promise((resolve, reject) => {
    const callbackName = `__kpaosSubmit${Date.now()}${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    const params = new URLSearchParams({
      action: 'checkSubmission',
      id: String(id),
      callback: callbackName,
      _: String(Date.now())
    });
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('หมดเวลาตรวจสอบการบันทึกออนไลน์'));
    }, 12000);
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
      clearTimeout(timeout);
    };

    window[callbackName] = response => {
      cleanup();
      if (response?.found) resolve(true);
      else if (response?.error) reject(new Error(response.error));
      else if (typeof response?.found !== 'boolean') {
        reject(new Error('Apps Script ยังเป็นเวอร์ชันเก่า กรุณาอัปเดต Code.gs และ Deploy เป็น New version'));
      }
      else resolve(false);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('ตรวจสอบรายการกับ Apps Script ไม่สำเร็จ'));
    };
    script.src = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}${params}`;
    document.head.appendChild(script);
  });

  return (async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      if (await checkOnce()) return;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Google Apps Script ยังไม่บันทึกรายการ ตรวจสอบว่าได้ Deploy โค้ดล่าสุดและอนุญาต Google Sheets/Drive แล้ว');
  })();
}

function showMarketplaceToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] bg-emerald-900 text-white px-4 py-2 rounded-xl shadow-lg';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function openMarketplaceModal() {
  const modal = document.getElementById('marketplace-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('open');
}

function closeMarketplaceModal() {
  const modal = document.getElementById('marketplace-modal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.classList.add('hidden');
}

function readMarketplaceImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('เตรียมรูปภาพไม่สำเร็จ'));
        return;
      }
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('เปิดไฟล์รูปภาพไม่สำเร็จ'));
    };
    image.src = objectUrl;
  });
}

function showMarketplaceDetails(id) {
  const item = marketplaceItems.find(entry => String(entry.id) === String(id));
  if (!item) {
    showMarketplaceToast('ไม่พบรายละเอียดสินค้า');
    return;
  }
  const text = value => escapeMarketplaceHTML(value || 'ไม่ได้ระบุ');
  const details = `
    <div class="space-y-3 text-sm text-slate-700">
      <p><strong>หมวดหมู่:</strong> ${text(item.category)}</p>
      <p><strong>สภาพสินค้า:</strong> ${text(item.condition)}</p>
      <p class="whitespace-pre-line"><strong>รายละเอียด:</strong> ${text(item.description)}</p>
      <div class="border-t border-black/[0.08] pt-3 space-y-2">
        <p><strong>ผู้ขาย:</strong> ${text(item.sellerName)} (${text(item.sellerClass)})</p>
        <p><strong>Facebook:</strong> ${text(item.fb)}</p>
        <p><strong>Instagram:</strong> ${text(item.ig)}</p>
        <p><strong>เบอร์โทร:</strong> ${text(item.phone)}</p>
      </div>
    </div>`;
  if (window.showAppleModal) {
    window.showAppleModal('รายละเอียดสินค้า', item.title || 'สินค้า', details);
  } else {
    showMarketplaceToast(`${item.title} — ${item.description}`);
  }
}

function renderMarketplace() {
  const grid = document.getElementById('marketplace-grid');
  if (!grid) return;

  const query = document.getElementById('market-search')?.value.trim().toLowerCase() || '';
  const category = document.getElementById('market-category')?.value || '';
  const sort = document.getElementById('market-sort')?.value || 'dateDesc';
  const approved = marketplaceItems.filter(item => item.status === 'approved');
  const filtered = approved.filter(item => {
    const title = String(item.title || '').toLowerCase();
    const description = String(item.description || '').toLowerCase();
    return (title.includes(query) || description.includes(query)) &&
      (!category || item.category === category);
  });

  if (sort === 'priceAsc') filtered.sort((a, b) => Number(a.price) - Number(b.price));
  else if (sort === 'priceDesc') filtered.sort((a, b) => Number(b.price) - Number(a.price));
  else filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  if (!filtered.length) {
    grid.innerHTML = `<p class="col-span-full rounded-2xl bg-white p-6 text-center text-sm text-[#86868B]">${
      approved.length
        ? 'ไม่พบสินค้าที่ตรงกับคำค้นหา'
        : 'ยังไม่มีสินค้าที่ได้รับอนุมัติ รายการจะปรากฏที่นี่หลังสภานักเรียนอนุมัติ'
    }</p>`;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <article class="market-card">
      <div class="market-card-img-wrap">
        ${item.image ? `<img src="${escapeMarketplaceHTML(item.image)}" alt="${escapeMarketplaceHTML(item.title)}" loading="lazy"/>` : ''}
      </div>
      <div class="p-4">
        <h3 class="font-bold text-[#1D1D1F]">${escapeMarketplaceHTML(item.title)}</h3>
        <p class="text-emerald-900 font-medium">฿${Number(item.price || 0).toLocaleString()}</p>
        <p class="text-sm text-[#86868B]">โดย ${escapeMarketplaceHTML(item.sellerName)} (${escapeMarketplaceHTML(item.sellerClass)})</p>
        <button type="button" data-marketplace-details="${escapeMarketplaceHTML(item.id)}" class="apple-btn-secondary px-4 py-2 mt-3 text-sm">ดูรายละเอียดและติดต่อผู้ขาย</button>
      </div>
    </article>`).join('');
}

function showMarketplaceLoadError(error) {
  const grid = document.getElementById('marketplace-grid');
  if (!grid) return;
  console.error('Unable to load online marketplace:', error);
  grid.innerHTML = `
    <div class="col-span-full rounded-2xl bg-white p-6 text-center">
      <p class="font-semibold text-amber-800">โหลดรายการออนไลน์ไม่ได้</p>
      <p class="mt-2 text-sm text-[#86868B]">${escapeMarketplaceHTML(error.message || 'เชื่อมต่อ Google Apps Script ไม่สำเร็จ')}</p>
      <p class="mt-2 text-sm text-[#86868B]">ตรวจว่า Deploy Apps Script เวอร์ชันล่าสุดแล้ว และตั้งการเข้าถึงเป็นทุกคน</p>
      <button type="button" id="marketplace-retry" class="apple-btn-secondary px-4 py-2 mt-4 text-sm">ลองโหลดอีกครั้ง</button>
    </div>`;
  document.getElementById('marketplace-retry')?.addEventListener('click', loadMarketplaceItems);
}

function loadMarketplaceItems() {
  const grid = document.getElementById('marketplace-grid');
  if (grid) {
    grid.innerHTML = '<p class="col-span-full text-center text-sm text-[#86868B]">กำลังโหลดรายการตลาด...</p>';
  }
  requestMarketplaceItems()
    .then(items => {
      saveMarketplaceCache(items);
      renderMarketplace();
    })
    .catch(showMarketplaceLoadError);
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    marketplaceItems = JSON.parse(localStorage.getItem(MARKETPLACE_STORE_KEY) || '[]');
  } catch (error) {
    console.error('Unable to read marketplace cache:', error);
    marketplaceItems = [];
  }
  renderMarketplace();

  document.getElementById('marketplace-fab')?.addEventListener('click', event => {
    event.preventDefault();
    openMarketplaceModal();
  });
  document.getElementById('marketplace-grid')?.addEventListener('click', event => {
    const button = event.target.closest('[data-marketplace-details]');
    if (button) showMarketplaceDetails(button.dataset.marketplaceDetails);
  });
  ['market-search', 'market-category', 'market-sort'].forEach(id => {
    document.getElementById(id)?.addEventListener(id === 'market-search' ? 'input' : 'change', renderMarketplace);
  });

  document.getElementById('mp-image')?.addEventListener('change', async function () {
    const preview = document.getElementById('mp-image-preview');
    preview.innerHTML = '';
    const file = this.files && this.files[0];
    if (!file) return;
    try {
      const image = await readMarketplaceImage(file);
      preview.innerHTML = `<img src="${image}" alt="ตัวอย่างรูปสินค้า" class="max-w-full h-auto rounded-xl"/>`;
    } catch (error) {
      showMarketplaceToast(error.message);
    }
  });

  document.getElementById('marketplace-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const file = document.getElementById('mp-image').files?.[0];
    if (file && file.size > MARKETPLACE_MAX_IMAGE_BYTES) {
      showMarketplaceToast('รูปมีขนาดใหญ่เกิน 5 MB กรุณาเลือกรูปที่เล็กลง');
      return;
    }
    const apiUrl = marketplaceApiUrl();
    if (!apiUrl) {
      showMarketplaceToast('ยังไม่ได้ตั้งค่า Google Apps Script');
      return;
    }
    const item = {
      id: Date.now(),
      title: document.getElementById('mp-title').value.trim(),
      price: Number(document.getElementById('mp-price').value),
      category: document.getElementById('mp-category').value,
      description: document.getElementById('mp-description').value.trim(),
      condition: document.getElementById('mp-condition').value.trim(),
      image: '',
      sellerName: document.getElementById('mp-seller-name').value.trim(),
      sellerClass: document.getElementById('mp-seller-class').value.trim(),
      fb: document.getElementById('mp-fb').value.trim(),
      ig: document.getElementById('mp-ig').value.trim(),
      phone: document.getElementById('mp-phone').value.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    submitButton.disabled = true;
    try {
      item.image = file ? await readMarketplaceImage(file) : '';
      await postMarketplaceSubmission(item);
      await verifyMarketplaceSubmission(item.id);
      saveMarketplaceCache([item, ...marketplaceItems.filter(entry => String(entry.id) !== String(item.id))]);
      form.reset();
      document.getElementById('mp-image-preview').innerHTML = '';
      closeMarketplaceModal();
      showMarketplaceToast('ส่งรายการแล้ว รออนุมัติจากสภานักเรียน');
      renderMarketplace();
    } catch (error) {
      console.error('Marketplace submission failed:', error);
      showMarketplaceToast(`ส่งรายการออนไลน์ไม่สำเร็จ: ${error.message}`);
    } finally {
      submitButton.disabled = false;
    }
  });

  loadMarketplaceItems();
});
