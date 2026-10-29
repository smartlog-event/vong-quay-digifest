/* Dán URL Web App của Apps Script Digifest mới sau khi triển khai. */
const CONFIG = { API_URL: 'https://script.google.com/macros/s/AKfycbwzL_TwMUfCzNDB1ph7Tca6wXvzzZjbUDUV5ur1sqih7_due9lv5j3aae53Vjqs9ORv_Q/exec', RETRY: 3, TIMEOUT: 8 };
const PRIZE_TYPES = [
  {id:'moc-khoa', name:'Móc khóa Smartlog', kind:'vat-the', demoWeight:25},
  {id:'may-man', name:'Chúc bạn may mắn lần sau', kind:'chu', label:'MAY MẮN\nLẦN SAU', demoWeight:40},
  {id:'tui-tote', name:'Túi tote Smartlog', kind:'vat-the', demoWeight:20},
  {id:'voucher-50k', name:'Voucher 50K', kind:'chu', label:'VOUCHER\n50K', demoWeight:10},
  {id:'ly-smartlog', name:'Ly Smartlog', kind:'vat-the', demoWeight:5},
];
/* Mỗi loại hiển thị hai ô đối xứng. Tỷ lệ demo vẫn giữ nguyên theo loại. */
const PRIZES = [...PRIZE_TYPES, ...PRIZE_TYPES].map((p,i)=>({
  ...p, demoWeight:p.demoWeight/2, tone:i%2?'b':'a',
  img:p.id==='may-man'?'':`assets/img/prize/${p.id}.webp`
}));
function choosePrizeIndex(id, random = Math.random) {
  const matches = PRIZES.map((p,i)=>p.id===id?i:-1).filter(i=>i>=0);
  return matches.length ? matches[Math.floor(random()*matches.length)] : -1;
}

