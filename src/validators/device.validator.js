const AppError = require('../errors/AppError');

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

// QT-07: thiet bi nhap thu cong bat buoc co serial/IMEI
function validateDeviceInput(body = {}) {
  const fields = {};

  const customerId = Number(body.customer_id);
  if (!Number.isInteger(customerId) || customerId < 1) fields.customer_id = 'customer_id phai la so nguyen duong';

  if (isBlank(body.serial_no)) fields.serial_no = 'Serial/IMEI la bat buoc';
  else if (body.serial_no.trim().length > 80) fields.serial_no = 'Serial/IMEI toi da 80 ky tu';

  if (isBlank(body.product_name)) fields.product_name = 'Ten san pham la bat buoc';
  else if (body.product_name.trim().length > 120) fields.product_name = 'Ten san pham toi da 120 ky tu';

  if (body.imei != null && (typeof body.imei !== 'string' || body.imei.length > 30)) {
    fields.imei = 'IMEI phai la chuoi toi da 30 ky tu';
  }

  if (Object.keys(fields).length > 0) {
    throw new AppError('VALIDATION_ERROR', 'Du lieu thiet bi khong hop le', fields);
  }

  return {
    customer_id: customerId,
    serial_no: body.serial_no.trim(),
    imei: body.imei ? body.imei.trim() : null,
    product_name: body.product_name.trim(),
  };
}

module.exports = { validateDeviceInput };