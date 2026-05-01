(function() {
  const COOKIE_NAME = 'application_submitted';
  const COOKIE_DAYS = 365;
  const API_URL = 'https://snowy-king-2ffa.aimsother.workers.dev/';

  function extractDigits(str) {
    return String(str || '').replace(/\D/g, '');
  }
  function normalizeLocalDigits(digits) {
    let d = digits.slice(0, 11);
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    return d.slice(0, 10);
  }
  function formatLocalPart(digits) {
    const d = digits.slice(0, 10);
    if (d.length === 0) return '';
    if (d.length <= 3) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
    return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
  }
  function digitsFromAnyPhoneString(phone) {
    return normalizeLocalDigits(extractDigits(phone || ''));
  }
  function digitIndexBeforeCaret(value, caretPos) {
    let n = 0;
    const end = Math.min(caretPos, value.length);
    for (let i = 0; i < end; i++) {
      if (/\d/.test(value[i])) n++;
    }
    return n;
  }
  function caretAfterDigitCount(formatted, digitCount) {
    if (digitCount <= 0) return 0;
    let count = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        count++;
        if (count === digitCount) return i + 1;
      }
    }
    return formatted.length;
  }
  function getPhoneDigitsForSubmit(inputEl) {
    const digits = normalizeLocalDigits(extractDigits(inputEl.value));
    return digits.length === 10 ? '1' + digits : '';
  }
  function splitFullName(full) {
    const t = String(full || '').trim();
    if (!t) return { firstName: '', lastName: '' };
    const parts = t.split(/\s+/);
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
  }
  function initCanadianPhoneMask() {
    const phone = document.getElementById('phone');
    if (!phone || phone.dataset.phoneMask !== 'ca') return;
    phone.addEventListener('input', function() {
      const el = phone;
      const raw = el.value;
      const caret = el.selectionStart != null ? el.selectionStart : raw.length;
      const digitBefore = digitIndexBeforeCaret(raw, caret);
      const digits = normalizeLocalDigits(extractDigits(raw));
      const formatted = formatLocalPart(digits);
      el.value = formatted;
      const targetDigit = Math.min(digitBefore, digits.length);
      const pos = caretAfterDigitCount(formatted, targetDigit);
      requestAnimationFrame(function() {
        el.setSelectionRange(pos, pos);
      });
    });
    phone.addEventListener('keydown', function(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || e.key === 'Enter' ||
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
        e.key === 'Home' || e.key === 'End'
      ) return;
      if (e.key.length === 1 && /\d/.test(e.key)) return;
      if (e.key.length !== 1) return;
      e.preventDefault();
    });
    phone.addEventListener('paste', function(e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text') || '';
      const digits = normalizeLocalDigits(extractDigits(text));
      phone.value = formatLocalPart(digits);
      const pos = caretAfterDigitCount(phone.value, digits.length);
      requestAnimationFrame(function() {
        phone.setSelectionRange(pos, pos);
      });
    });
  }
  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + expires.toUTCString() + ';path=/';
  }
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
  function getApplicationData() {
    const data = getCookie(COOKIE_NAME);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  function saveApplicationData(firstName, lastName, email, phone) {
    const data = JSON.stringify({
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      submitted: true
    });
    setCookie(COOKIE_NAME, data, COOKIE_DAYS);
  }
  function showSubmittedState(data) {
    const form = document.getElementById('applicationForm');
    if (!form) return;
    const fullNameEl = document.getElementById('fullName');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const submitBtn = document.getElementById('submitBtn');
    const changeBtn = document.getElementById('changeBtn');
    if (fullNameEl) {
      const ln = data.lastName && data.lastName !== '-' ? data.lastName : '';
      fullNameEl.value = [data.firstName, ln].filter(Boolean).join(' ').trim();
      fullNameEl.readOnly = true;
    }
    if (emailEl) {
      emailEl.value = data.email || '';
      emailEl.readOnly = true;
    }
    if (phoneEl) {
      phoneEl.value = formatLocalPart(digitsFromAnyPhoneString(data.phone || ''));
      phoneEl.readOnly = true;
    }
    if (submitBtn) submitBtn.style.display = 'none';
    if (changeBtn) changeBtn.style.display = 'block';
  }
  function showEditState() {
    const form = document.getElementById('applicationForm');
    if (!form) return;
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach(function(input) {
      input.readOnly = false;
    });
    const submitBtn = document.getElementById('submitBtn');
    const changeBtn = document.getElementById('changeBtn');
    if (submitBtn) submitBtn.style.display = 'block';
    if (changeBtn) changeBtn.style.display = 'none';
  }
  function showModal(title, text) {
    const overlay = document.getElementById('modalOverlay');
    const modalTitleEl = document.getElementById('modalTitle');
    const modalTextEl = document.querySelector('.modal-text');
    if (!overlay) return;
    if (title && modalTitleEl) modalTitleEl.textContent = title;
    if (text && modalTextEl) modalTextEl.textContent = text;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  async function submitToApi(firstName, lastName, email, phone) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        country: 'CA'
      })
    });
    let result;
    try {
      result = await response.json();
    } catch {
      result = {};
    }
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Request failed');
    }
    const isSuccess = result.success === 'true' || result.success === true;
    if (!isSuccess) {
      throw new Error(result.message || result.error || 'Invalid response from server');
    }
    return result;
  }
  function init() {
    const form = document.getElementById('applicationForm');
    if (!form) return;
    const changeBtn = document.getElementById('changeBtn');
    const submitBtn = document.getElementById('submitBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const data = getApplicationData();

    initCanadianPhoneMask();

    if (data && data.submitted) {
      showSubmittedState(data);
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const full = document.getElementById('fullName').value.trim();
      const { firstName, lastName } = splitFullName(full);
      const lastNameOut = (lastName && lastName.trim()) || '-';
      const email = document.getElementById('email').value.trim();
      const phone = getPhoneDigitsForSubmit(document.getElementById('phone'));
      if (!firstName) {
        showModal('Error', 'Please enter your name.');
        return;
      }
      if (!phone) {
        showModal('Error', 'Please enter a complete 10-digit Canadian phone number.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        await submitToApi(firstName, lastNameOut, email, phone);
        if (typeof fbq === 'function') fbq('track', 'Lead');
        saveApplicationData(firstName, lastNameOut, email, phone);
        showSubmittedState({ firstName: firstName, lastName: lastNameOut, email: email, phone: phone });
        showModal('Success', 'Application submitted successfully. Thank you!');
      } catch (err) {
        showModal('Error', err.message || 'Failed to submit. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    });

    if (changeBtn) {
      changeBtn.addEventListener('click', function() {
        showEditState();
      });
    }
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }
    if (modalOverlay) {
      modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) closeModal();
      });
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('is-open')) {
        closeModal();
      }
    });
  }
  init();
})();
