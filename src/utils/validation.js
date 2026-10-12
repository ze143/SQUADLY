// ====== التحقق من الرقم القومي المصري ======
export const validateNationalId = (id) => {
  if (!id || !/^\d{14}$/.test(id)) return false;

  const century = id[0];
  const year = parseInt(id.substring(1, 3), 10);
  const month = parseInt(id.substring(3, 5), 10);
  const day = parseInt(id.substring(5, 7), 10);

  if (!['2', '3'].includes(century)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
};

// ====== استخراج تاريخ الميلاد من الرقم القومي ======
export const extractBirthDateFromNID = (id) => {
  if (!validateNationalId(id)) return null;
  const century = id[0] === '2' ? '19' : '20';
  const year = id.substring(1, 3);
  const month = id.substring(3, 5);
  const day = id.substring(5, 7);
  return `${century}${year}-${month}-${day}`;
};

// ====== استخراج سنة المواليد ======
export const extractBirthYearFromNID = (id) => {
  if (!validateNationalId(id)) return null;
  const century = id[0] === '2' ? '19' : '20';
  return parseInt(`${century}${id.substring(1, 3)}`, 10);
};

// ====== التحقق من البريد الإلكتروني ======
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ====== التحقق من رقم الهاتف المصري ======
export const validatePhone = (phone) => {
  return /^01[0-2,5]\d{8}$/.test(phone);
};

// ====== التحقق من أن الحقل غير فارغ ======
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};