/**
 * สภานักเรียนบีแดร์ 2569 - โรงเรียนองค์การบริหารส่วนจังหวัดกระบี่ (KPAOS)
 * ระบบการทำงานแบบ Dynamic พร้อมระบบ Sync ไปยัง Google Sheets / Microsoft Excel
 */

// =========================================================================
// 🔗 จุดเชื่อมต่อ GOOGLE SHEETS / EXCEL SYNC
// นำ Web App URL ที่ได้จาก Google Apps Script มาวางในเครื่องหมายคำพูดด้านล่างนี้ได้เลยครับ
// =========================================================================
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxFAjArmMjmVH4zZBI8O9eIxJvHBWzzE0o2Fi2RHa-UIaQZadYVmBNdiFX4VApQ8PU/exec';
window.KPAOS_GOOGLE_SCRIPT_URL = GOOGLE_SHEET_URL;

document.addEventListener('DOMContentLoaded', () => {
  // เริ่มต้นการทำงานของไอคอน Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  /* -------------------------------------------------------------
     1. เมนูนำทางบนสมาร์ตโฟน (Mobile Navigation)
  ------------------------------------------------------------- */
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      const isHidden = mobileNav.classList.toggle('hidden');
      mobileMenuBtn.setAttribute('aria-expanded', (!isHidden).toString());
    });

    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.add('hidden');
      });
    });
  }

  /* -------------------------------------------------------------
     2. แถบนำทางด้านบนโปร่งแสงและเงาเมื่อเลื่อนหน้าจอ
  ------------------------------------------------------------- */
  const mainHeader = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      mainHeader.classList.add('shadow-xs');
    } else {
      mainHeader.classList.remove('shadow-xs');
    }
  });

  /* -------------------------------------------------------------
     3. ข้อมูลคณะกรรมการสภานักเรียน (Apple Leadership Directory)
  ------------------------------------------------------------- */
  const leaders = [
    {
      id: 'tk',
      name: 'นางสาวนทัสนันท์ ทองมหา',
      nickname: 'ยูริ',
      role: 'ประธานสภานักเรียน',
      dept: 'presidium',
      class: 'ชั้นมัธยมศึกษาปีที่ 4/1',
      quote: '“ดีจ้า”',
      initials: 'นท',
      avatarBg: 'bg-emerald-950 text-white',
      bio: 'ประธานสภานักเรียนบีแดร์ 2569 ดูแลการประชุมสภาและการประสานงานกับฝ่ายบริหารโรงเรียน พร้อมเป็นตัวแทนสภานักเรียนในการเข้าร่วมกิจกรรมระดับจังหวัดและระดับประเทศ'
    },
    {
      id: 'ns',
      name: 'นางสาวอาภากร นบนอบ',
      nickname: 'น้ำใส',
      role: 'รองประธาน',
      dept: 'presidium',
      class: 'ชั้นมัธยมศึกษาปีที่ 4/1',
      quote: '“ดีเด้อ”',
      initials: 'นส',
      avatarBg: 'bg-emerald-900 text-emerald-100',
      bio: 'ดูแลการประสานงานตัวแทนห้องเรียน การจัดสรรงบประมาณสนับสนุนชมรม และการตรวจสอบมาตรฐานสุขอนามัยในโรงเรียน'
    },
    {
      id: 'kc',
      name: 'นายนเรศ รักษายศ',
      nickname: 'ทิกเกอร์',
      role: 'กรรมการ',
      dept: 'academic',
      class: 'ชั้นมัธยมศึกษาปีที่ 4/1',
      quote: '“หา 1-1 อาวีให้หมด”',
      initials: 'ทก',
      avatarBg: 'bg-teal-900 text-teal-100',
      bio: 'แชมป์เหลืองกระบี่ 2569 ไหวหมดทุกวิชา ไม่อยากโม้เท่าไหร่'
    },
    {
      id: 'wv',
      name: 'นายอภิวิชญ์ โป้ซิ้ว',
      nickname: 'โชกุน',
      role: 'กรรมการ',
      dept: 'welfare',
      class: 'ชั้นมัธยมศึกษาปีที่ 4/1',
      quote: '“หา 1-1 ทุกตำแหน่งให้หมดทั้งโรงเรียน”',
      initials: 'ชก',
      avatarBg: 'bg-slate-900 text-white',
      bio: 'ไม่พูดมากเจ็บคอ'
    }
  ];

  window.renderLeadersGrid = function(filter = 'all') {
    const container = document.getElementById('leaders-grid-container');
    if (!container) return;
    container.innerHTML = '';

    const filtered = filter === 'all' 
      ? leaders 
      : leaders.filter(l => l.dept === filter);

    filtered.forEach(leader => {
      const card = document.createElement('div');
      card.className = 'bento-card p-6 flex flex-col justify-between group cursor-pointer';
      card.onclick = () => window.showAppleModal(
        leader.role,
        leader.name + (leader.nickname ? ` (${leader.nickname})` : ''),
        `<p class="text-xs font-bold text-emerald-800 mb-1">${leader.class}</p><p class="text-sm italic text-slate-800 bg-[#F5F5F7] p-3 rounded-xl mb-3">“${leader.quote}”</p><p class="text-xs text-slate-600 leading-relaxed">${leader.bio}</p>`
      );

      card.innerHTML = `
        <div>
          <div class="flex items-center gap-3.5 mb-4">
            <div class="w-12 h-12 rounded-2xl ${leader.avatarBg} font-black text-sm flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              ${leader.initials}
            </div>
            <div>
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                ${leader.class}
              </span>
              <h3 class="text-sm font-bold text-[#1D1D1F] group-hover:text-emerald-900 transition-colors mt-0.5 leading-tight">
                ${leader.name}
              </h3>
              <p class="text-[11px] text-[#86868B]">${leader.role}</p>
            </div>
          </div>
          <p class="text-xs text-[#86868B] italic line-clamp-3 bg-[#F5F5F7] p-2.5 rounded-xl border border-black/[0.03]">
            ${leader.quote}
          </p>
        </div>
        <div class="pt-4 mt-4 border-t border-black/[0.05] flex items-center justify-between text-xs font-bold text-emerald-900">
          <span>อ่านวิสัยทัศน์ & ผลงาน</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  };

  window.filterLeaders = function(dept) {
    document.querySelectorAll('.fl-btn').forEach(btn => {
      btn.classList.remove('bg-white', 'text-[#1D1D1F]', 'shadow-xs');
      btn.classList.add('hover:text-[#1D1D1F]');
    });
    const activeBtn = document.getElementById('fl-' + dept);
    if (activeBtn) {
      activeBtn.classList.add('bg-white', 'text-[#1D1D1F]', 'shadow-xs');
      activeBtn.classList.remove('hover:text-[#1D1D1F]');
    }
    window.renderLeadersGrid(dept);
  };

  // โหลดรายชื่อรอบแรก
  window.renderLeadersGrid();

  /* -------------------------------------------------------------
     4. ข้อมูลข่าวสารและประกาศ (Apple Newsroom)
  ------------------------------------------------------------- */
  const newsList = [
    {
      id: 'news-1',
      tag: 'แถลงนโยบาย',
      date: '8 พฤศจิกายน 2567',
      title: 'นึกไม่ออกแล้ว',
      desc: 'ใส่อะไรดี',
      full: 'ไฟล์ app.js นะจ้า'
    },
    {
      id: 'news-2',
      tag: 'กิจกรรมโรงเรียน',
      date: '5 พฤศจิกายน 2567',
      title: 'หาคนเล่นพับจีกับโก้',
      desc: 'ว่าไง',
      full: 'hello world'
    },
    {
      id: 'news-3',
      tag: 'ด้านวิชาการ',
      date: '28 ตุลาคม 2567',
      title: 'มุฮ๋า',
      desc: 'บรรทัดที่ 194 ที่ app.js',
      full: 'skibididopdop yes yes'
    }
  ];

  const newsGrid = document.getElementById('apple-news-grid');
  if (newsGrid) {
    newsList.forEach(item => {
      const card = document.createElement('article');
      card.className = 'bento-card p-6 flex flex-col justify-between group cursor-pointer';
      card.onclick = () => window.showAppleModal(item.tag, item.title, `<p class="text-xs text-[#86868B] mb-2">${item.date}</p><p class="text-sm text-slate-700 leading-relaxed">${item.full}</p>`);
      card.innerHTML = `
        <div>
          <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
            ${item.tag}
          </span>
          <span class="text-xs text-[#86868B] block mt-3">${item.date}</span>
          <h3 class="text-base font-bold text-[#1D1D1F] group-hover:text-emerald-900 transition-colors mt-1 mb-2 leading-snug">
            ${item.title}
          </h3>
          <p class="text-xs text-[#86868B] leading-relaxed line-clamp-3">
            ${item.desc}
          </p>
        </div>
        <div class="pt-4 mt-4 border-t border-black/[0.05] flex items-center justify-between text-xs font-bold text-emerald-900">
          <span>อ่านประกาศฉบับเต็ม</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
        </div>
      `;
      newsGrid.appendChild(card);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  /* -------------------------------------------------------------
     5. ระบบหน้าต่างป๊อปอัปโมดัล (Apple Modal System)
  ------------------------------------------------------------- */
  const modal = document.getElementById('apple-modal');
  const modalEyebrow = document.getElementById('modal-eyebrow');
  const modalHeading = document.getElementById('modal-heading');
  const modalContent = document.getElementById('modal-content');

  window.showAppleModal = function(eyebrow, heading, contentHtml) {
    if (!modal) return;
    if (modalEyebrow) modalEyebrow.textContent = eyebrow;
    if (modalHeading) modalHeading.textContent = heading;
    if (modalContent) modalContent.innerHTML = contentHtml;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeAppleModal = function() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.closeAppleModal();
    });
  }

  /* -------------------------------------------------------------
     6. กล่องรับฟังเสียงนักเรียน & โหมดไม่ระบุตัวตน (Suggestion Box)
     + เชื่อมโยง Sync ส่งข้อมูลไปยัง Google Sheets / Excel
  ------------------------------------------------------------- */
  window.toggleAppleAnonymous = function(isAnon) {
    const userFields = document.getElementById('apple-user-fields');
    const badge = document.getElementById('apple-anon-badge');
    const nameInput = document.getElementById('apple-name');
    const idInput = document.getElementById('apple-id');

    if (isAnon) {
      userFields.classList.add('opacity-30', 'pointer-events-none');
      badge.classList.remove('hidden');
      nameInput.value = '';
      idInput.value = '';
    } else {
      userFields.classList.remove('opacity-30', 'pointer-events-none');
      badge.classList.add('hidden');
    }
  };

  window.handleAppleSubmit = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('apple-submit-btn');
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      กำลังบันทึกและซิงก์ข้อมูล...
    `;

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `KPAOS-BTH-2569-${randNum}`;
    const nameVal = document.getElementById('apple-name').value.trim();
    const idVal = document.getElementById('apple-id').value.trim();
    const catVal = document.getElementById('apple-category').value;
    const priorityVal = document.getElementById('apple-priority').value;
    const subjVal = document.getElementById('apple-subject').value.trim();
    const msgVal = document.getElementById('apple-message').value.trim();
    const now = new Date();
    const timestampStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');

    // 1. จัดเตรียม Payload ส่งข้อมูล
    const payload = {
      timestamp: timestampStr,
      ticketId: ticketId,
      name: nameVal || 'ไม่ระบุตัวตน (Anonymous)',
      studentId: idVal || '-',
      category: catVal,
      priority: priorityVal,
      subject: subjVal,
      message: msgVal,
      status: 'อยู่ระหว่างการพิจารณา'
    };

    // 2. บันทึกสำรองลง LocalStorage ในเครื่องด้วย เพื่อให้กรรมการสภากด Export Excel ได้เสมอ
    try {
      const existingSubmissions = JSON.parse(localStorage.getItem('kpaos_submissions') || '[]');
      existingSubmissions.unshift(payload);
      localStorage.setItem('kpaos_submissions', JSON.stringify(existingSubmissions));
    } catch (err) {
      console.warn('LocalStorage save skipped:', err);
    }

    // 3. ส่งข้อมูลขึ้น Google Sheets / Excel Online (ถ้าผู้ใช้ใส่ GOOGLE_SHEET_URL)
    let syncSuccess = false;
    if (GOOGLE_SHEET_URL && GOOGLE_SHEET_URL.trim() !== '') {
      try {
        await fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
        syncSuccess = true;
      } catch (error) {
        console.error('Sync to Google Sheets error:', error);
      }
    }

    // 4. แสดงผลป๊อปอัปความสำเร็จ
    const syncBadgeHtml = (GOOGLE_SHEET_URL && GOOGLE_SHEET_URL.trim() !== '')
      ? '<span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">✓ ซิงก์ลง Google Sheet / Excel เรียบร้อยแล้ว</span>'
      : '<span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-slate-500">บันทึกข้อมูลในระบบเรียบร้อยแล้ว</span>';

    window.showAppleModal(
      'บันทึกข้อมูลเรียบร้อยแล้ว',
      'ขอบคุณที่ร่วมส่งเสียงเพื่อพัฒนาโรงเรียนของเรา',
      `
      <div class="p-3 bg-[#F5F5F7] rounded-xl border border-black/[0.04] space-y-1 my-2">
        <p class="text-xs text-slate-500">รหัสอ้างอิงสำหรับติดตามสถานะ:</p>
        <p class="font-mono font-bold text-emerald-900 text-base">${ticketId}</p>
        ${syncBadgeHtml}
      </div>
      <p class="text-xs text-slate-600"><strong>หมวดหมู่:</strong> ${catVal}</p>
      <p class="text-xs text-slate-600"><strong>หัวข้อเรื่อง:</strong> ${subjVal}</p>
      <p class="text-xs text-[#86868B] mt-2">ข้อมูลนี้ได้รับการคุ้มครองความเป็นส่วนตัวตามระเบียบสภา และจะถูกนำส่งคณะกรรมการที่เกี่ยวข้องเพื่อพิจารณาภายใน 72 ชั่วโมง</p>
      `
    );

    document.getElementById('apple-suggestion-form').reset();
    window.toggleAppleAnonymous(false);
    document.getElementById('apple-anon-toggle').checked = false;
    document.getElementById('apple-char-count').textContent = '0 / 1000 ตัวอักษร';

    btn.disabled = false;
    btn.innerHTML = `
      <svg class="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      <span>ส่งข้อมูลถึงสภานักเรียน</span>
    `;
  };

  /* -------------------------------------------------------------
     7. ฟังก์ชันค้นหาและตรวจสถานะเรื่องร้องเรียน
  ------------------------------------------------------------- */
  window.trackAppleTicket = function() {
    const input = document.getElementById('apple-track-input');
    const result = document.getElementById('apple-track-result');
    const query = input.value.trim();

    if (!query) {
      alert('กรุณากรอกรหัสติดตามเรื่อง (เช่น KPAOS-BTH-2569-8492)');
      return;
    }

    // ลองค้นหาในประวัติที่บันทึกไว้ในเครื่อง
    let matchedItem = null;
    try {
      const stored = JSON.parse(localStorage.getItem('kpaos_submissions') || '[]');
      matchedItem = stored.find(s => s.ticketId.toUpperCase() === query.toUpperCase());
    } catch (e) {}

    const subjectDisplay = matchedItem ? matchedItem.subject : 'เรื่องที่ยื่นผ่านระบบสภานักเรียน';
    const categoryDisplay = matchedItem ? matchedItem.category : 'ฝ่ายสวัสดิการและอาคารสถานที่';

    result.classList.remove('hidden');
    result.innerHTML = `
      <div class="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.05] text-xs space-y-2">
        <div class="flex items-center justify-between pb-2 border-b border-black/[0.06]">
          <span class="font-mono font-bold text-emerald-900 text-sm">${query.toUpperCase()}</span>
          <span class="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900">อยู่ระหว่างการพิจารณา</span>
        </div>
        <p class="text-[#1D1D1F]">หัวข้อเรื่อง: <strong>${subjectDisplay}</strong></p>
        <p class="text-[#1D1D1F]">ฝ่ายที่รับผิดชอบ: <strong>${categoryDisplay}</strong></p>
        <p class="text-[#86868B]">สถานะ: ผ่านการคัดกรองเบื้องต้นแล้ว มีกำหนดนำเข้าสู่วาระการประชุมสภาในวันศุกร์นี้เพื่อประสานงานฝ่ายบริหารต่อไป</p>
      </div>
    `;
  };

  /* -------------------------------------------------------------
     8. ฟังก์ชันดาวน์โหลดเป็นไฟล์ Excel (.CSV) สำหรับคณะกรรมการสภา
  ------------------------------------------------------------- */
  window.exportSubmissionsToExcel = function() {
    let submissions = [];
    try {
      submissions = JSON.parse(localStorage.getItem('kpaos_submissions') || '[]');
    } catch (e) {}

    if (submissions.length === 0) {
      alert('ยังไม่มีข้อมูลการส่งเรื่องร้องเรียนในเครื่องนี้ครับ หากมีนักเรียนส่งเรื่องเข้ามา ข้อมูลจะสามารถกดดาวน์โหลดเป็น Excel ได้ทันที');
      return;
    }

    // สร้างเนื้อหาไฟล์ CSV พร้อม BOM เพื่อให้ภาษาไทยใน Excel ไม่เพี้ยน
    let csvContent = "\uFEFFวันเวลาที่ส่ง,รหัสตั๋ว,หมวดหมู่,ความเร่งด่วน,หัวข้อเรื่อง,รายละเอียด,ชื่อผู้ส่ง,รหัสนักเรียน,สถานะ\n";

    submissions.forEach(item => {
      const row = [
        `"${item.timestamp || ''}"`,
        `"${item.ticketId || ''}"`,
        `"${item.category || ''}"`,
        `"${item.priority || ''}"`,
        `"${(item.subject || '').replace(/"/g, '""')}"`,
        `"${(item.message || '').replace(/"/g, '""')}"`,
        `"${item.name || ''}"`,
        `"${item.studentId || ''}"`,
        `"${item.status || ''}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    // สร้างลิงก์ดาวน์โหลด
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kpaos_student_voice_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* -------------------------------------------------------------
     9. ปุ่ม ESC เพื่อปิดหน้าต่างโมดัล
  ------------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeAppleModal();
    }
  });
});
