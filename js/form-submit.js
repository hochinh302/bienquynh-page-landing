(function () {
  'use strict';

  const form = document.getElementById('leadForm');
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');
  const typeInputs = document.querySelectorAll('input[name="lead_type"]');
  const userFields = document.querySelectorAll('[data-fields="user"]');
  const merchantFields = document.querySelectorAll('[data-fields="merchant"]');

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'form-status ' + (type || '');
  }

  function getLeadType() {
    return document.querySelector('input[name="lead_type"]:checked')?.value || 'user';
  }

  function toggleFields() {
    const type = getLeadType();
    userFields.forEach(el => el.style.display = type === 'user' ? '' : 'none');
    merchantFields.forEach(el => el.style.display = type === 'merchant' ? '' : 'none');

    document.querySelectorAll('[data-required-user]').forEach(el => el.required = type === 'user');
    document.querySelectorAll('[data-required-merchant]').forEach(el => el.required = type === 'merchant');
  }

  typeInputs.forEach(input => input.addEventListener('change', toggleFields));
  toggleFields();

  const params = new URLSearchParams(location.search);
  if (params.get('type') === 'merchant') {
    const merchantRadio = document.querySelector('input[name="lead_type"][value="merchant"]');
    if (merchantRadio) {
      merchantRadio.checked = true;
      toggleFields();
    }
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('', '');

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!data.phone || data.phone.replace(/\D/g, '').length < 9) {
      setStatus('Vui lòng nhập số điện thoại/Zalo hợp lệ.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    const result = await window.BQSheetAPI.send({
      event_type: 'lead_submit',
      source: 'coming_soon_form',
      ...data
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Gửi thông tin đăng ký';

    if (result.ok || result.local) {
      form.reset();
      toggleFields();
      setStatus('Đã ghi nhận thông tin. Biển Quỳnh sẽ liên hệ khi nền tảng sẵn sàng.', 'success');
    } else {
      setStatus('Có lỗi khi gửi thông tin. Bạn thử lại giúp mình nhé.', 'error');
    }
  });
})();
