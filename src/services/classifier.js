// FR3: de xuat nhom su co va muc uu tien tu mo ta loi bang tu khoa. Ham thuan, khong DB.

// category_id khop voi seeds/001_demo.sql
const CATEGORIES = {
  MAN_HINH: { id: 1, name: 'Màn hình' },
  PIN: { id: 2, name: 'Pin' },
  SAC: { id: 3, name: 'Sạc' },
  PHAN_MEM: { id: 4, name: 'Phần mềm' },
  NUOC_VAO: { id: 5, name: 'Nước vào' },
  KHAC: { id: 6, name: 'Khác' },
};

// Thu tu khai bao cung la thu tu uu tien khi so tu khoa khop bang nhau
const KEYWORDS = {
  NUOC_VAO: ['nuoc', 'uot', 'ngam', 'roi xuong nuoc', 'vao nuoc', 'am uot'],
  SAC: ['sac', 'cong sac', 'chan sac', 'khong nhan sac', 'cap sac'],
  MAN_HINH: ['man hinh', 'cam ung', 'soc', 'vo kinh', 'nut kinh', 'den man', 've man', 'loang mau', 'soc doc'],
  PIN: ['pin', 'hao pin', 'tut pin', 'tut nhanh', 'phong pin', 'chai pin', 'hao nhanh'],
  PHAN_MEM: ['phan mem', 'cap nhat', 'he dieu hanh', 'bootloop', 'khoi dong lai', 'ung dung', 'bi treo', 'bi do', 'lag'],
};

// Dau hieu nguy hiem hoac may khong dung duoc: luon xep muc CAO
const CRITICAL_KEYWORDS = ['khong len nguon', 'khong khoi dong', 'chay no', 'bi chay', 'phong pin', 'bi no', 'boc khoi', 'chap dien'];

// Muc uu tien co so theo nhom khi khong co dau hieu nguy hiem
const BASE_PRIORITY = {
  NUOC_VAO: 'CAO',
  MAN_HINH: 'TRUNG_BINH',
  SAC: 'TRUNG_BINH',
  PIN: 'THAP',
  PHAN_MEM: 'THAP',
  KHAC: 'THAP',
};

// Bo dau tieng Viet, ha chu thuong de so khop khong phu thuoc cach go
function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

function countMatches(text, keywords) {
  return keywords.filter((kw) => new RegExp(`\\b${kw}\\b`).test(text)).length;
}

function phanLoaiSuCo(issueDesc) {
  const text = normalize(issueDesc || '');

  let code = 'KHAC';
  let best = 0;
  for (const [candidate, keywords] of Object.entries(KEYWORDS)) {
    const score = countMatches(text, keywords);
    if (score > best) {
      best = score;
      code = candidate;
    }
  }

  const critical = countMatches(text, CRITICAL_KEYWORDS) > 0;
  return {
    category_code: code,
    category_id: CATEGORIES[code].id,
    category_name: CATEGORIES[code].name,
    priority: critical ? 'CAO' : BASE_PRIORITY[code],
  };
}

module.exports = { phanLoaiSuCo, CATEGORIES };
