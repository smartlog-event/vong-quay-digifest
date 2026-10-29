/* Digifest: máy chủ quyết định và lưu kết quả trước hiệu ứng quay. */
'use strict';
const SEG = 360 / PRIZES.length;
const state = { info:null, prize:null, spinning:false, spun:false };
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
};

/**
 * Cỡ chữ lớn nhất cho một nhãn trong ô hình rẻ quạt.
 * Số dòng LẤY ĐÚNG theo "\n" trong nhãn, không tự ngắt thêm — muốn hai dòng
 * thì ra đúng hai dòng, chữ dài quá thì thu nhỏ cỡ chứ không đẩy xuống dòng ba.
 * Chữ chạy dọc bán kính: bề DÀI là (rOut - rIn), bề NGANG là bề rộng ô tại rIn
 * (chỗ hẹp nhất chữ chạm tới). Thử nhiều rIn rồi lấy kết quả to nhất.
 */
function fitRadial(probe, label, rOut) {
  const lines = label.split('\n');
  const halfSeg = Math.tan(SEG * Math.PI / 360);
  let best = { size: 3.6, lines, rIn: 42 };
  for (let rIn = 34; rIn <= 62; rIn += 1) {
    const maxW = rOut - rIn;
    const maxH = 2 * rIn * halfSeg * 0.90;
    for (let size = 11; size >= 3.6; size -= 0.15) {
      if (lines.length * size * 1.16 > maxH) continue;
      probe.style.fontSize = size + 'px';
      let widest = 0;
      for (const ln of lines) {
        probe.textContent = ln;
        widest = Math.max(widest, probe.getComputedTextLength());
      }
      if (widest > maxW) continue;
      if (size > best.size) best = { size, lines, rIn };
      break;
    }
  }
  return best;
}

/* Vẽ vòng quay. Ô voucher in CHỮ trực tiếp — thu nhỏ ảnh voucher xuống cỡ ô
   thì chữ chỉ còn 7px, còn chữ vector thì canh được to hơn và luôn nét.
   Ba ô quà thật vẫn dùng ảnh vì hình dáng đã tự nhận diện được. */
function initWheel() {
  const svg = $('#disc');
  const R    = 100;   // bán kính mặt đĩa
  const RING = 105;   // tâm của vành xanh
  const EDGE = 95;    // mép ngoài của vùng đặt nội dung
  const VATTHE = { s: 32, r: 74 };   // ảnh quà thật, xích vào cho gần tâm hơn
  const pt = (r, deg) => {
    const a = (deg - 90) * Math.PI / 180;
    return [r * Math.cos(a), r * Math.sin(a)];
  };

  svg.append(el('circle', { cx: 0, cy: 0, r: R, fill: '#fff' }));

  // lệch nửa ô để khi đứng yên, kim chỉ vào GIỮA ô đầu chứ không vào vạch chia
  PRIZES.forEach((p, i) => {
    const a0 = i * SEG - SEG / 2;
    const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a0 + SEG);
    svg.append(el('path', {
      class: `seg--${p.tone}`,
      d: `M0 0L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ` +
         `${x1.toFixed(2)} ${y1.toFixed(2)}Z`,
    }));
  });

  PRIZES.forEach((_, i) => {
    const [x, y] = pt(R, i * SEG - SEG / 2);
    svg.append(el('path', { class: 'seg-line', d: `M0 0L${x.toFixed(2)} ${y.toFixed(2)}` }));
  });

  const probe = el('text', { class: 'seg-txt', x: -999, y: -999 });   // thước đo tạm
  svg.append(probe);

  PRIZES.forEach((p, i) => {
    const mid = i * SEG;

    if (p.kind === 'vat-the') {
      const [cx, cy] = pt(VATTHE.r, mid);
      const g = el('g', {
        transform: `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`,
        role: 'img', 'aria-label': p.name,
      });
      g.append(el('image', {
        href: p.img, x: (-VATTHE.s / 2).toFixed(2), y: (-VATTHE.s / 2).toFixed(2),
        width: VATTHE.s, height: VATTHE.s, preserveAspectRatio: 'xMidYMid meet',
      }));
      svg.append(g);
      return;
    }

    const { size, lines, rIn } = fitRadial(probe, p.label, EDGE);
    const flip = mid >= 180;                    // nửa trái lật để chữ không ngược
    const rMid = (rIn + EDGE) / 2;
    const x = ((flip ? -1 : 1) * rMid).toFixed(2);
    const g = el('g', {
      transform: `rotate(${(flip ? mid + 90 : mid - 90).toFixed(3)})`,
      'aria-label': p.name,
    });

    const txt = el('text', {
      class: `seg-txt seg-txt--${p.tone}`, x, y: 0,
      'dominant-baseline': 'central', style: `font-size:${size}px`,
    });
    const step = size * 1.16;
    lines.forEach((ln, k) => {
      const ts = el('tspan', {
        x, dy: k === 0 ? (-(lines.length - 1) * step / 2).toFixed(2) : step.toFixed(2),
      });
      ts.textContent = ln;
      txt.append(ts);
    });
    g.append(txt);
    svg.append(g);
  });

  probe.remove();

  // vành xanh + bóng đèn ở mỗi giao điểm
  svg.append(el('circle', { class: 'wheel-ring', cx: 0, cy: 0, r: RING }));
  PRIZES.forEach((_, i) => {
    const [x, y] = pt(RING, i * SEG - SEG / 2);
    svg.append(el('circle', {
      class: 'wheel-bulb', cx: x.toFixed(2), cy: y.toFixed(2), r: 3.8,
    }));
  });
}


function setErr(key,msg) {
  const e = $(`[data-err="${key}"]`); if(e) e.textContent=msg;
  const input = $(`#${key}`); if(input) input.closest('.input')?.classList.toggle('is-bad',!!msg);
}
let toastTimer;
function toast(msg,ms=5000) { const t=$('#toast'); t.textContent=msg; t.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>{t.hidden=true},ms); }
function modal({title,body,img,kicker}) {
  $('#mKicker').textContent=kicker||''; $('#mKicker').hidden=!kicker;
  $('#mTitle').textContent=title; $('#mBody').textContent=body||'';
  const im=$('#mImg'); if(img){im.src=img;im.alt=title;im.hidden=false}else{im.hidden=true;im.removeAttribute('src')}
  $('#modal').hidden=false; $('#mClose').focus({preventScroll:true});
}
function normPhone(v) { let s=String(v).replace(/[^\d]/g,''); if(s.startsWith('84')&&s.length===11) s='0'+s.slice(2); return s; }
function validate() {
  const name=$('#name').value.trim(), phone=normPhone($('#phone').value), company=$('#company').value.trim(), position=$('#position').value.trim();
  const errors={name:name.length<2?'Vui lòng nhập họ và tên.':'',phone:/^0\d{9}$/.test(phone)?'':'Số điện thoại cần đúng 10 số, bắt đầu bằng 0.',company:company?'':'Vui lòng nhập tên công ty.',position:position?'':'Vui lòng nhập chức vụ.'};
  for(const k in errors) setErr(k,errors[k]);
  if(Object.values(errors).some(Boolean)) return false;
  state.info={name,phone,company,position}; return true;
}
const demo = new URLSearchParams(location.search).has('demo');
function browserId() {
  const key='digifest_browser_v1';
  try {
    let id=localStorage.getItem(key);
    if (!/^dev-[a-zA-Z0-9-]{8,80}$/.test(id || '')) {
      const bytes=new Uint8Array(16); crypto.getRandomValues(bytes);
      id='dev-'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
      localStorage.setItem(key,id);
    }
    return id;
  } catch (_) { return null; }
}

async function once(payload) {
  const ac=new AbortController(), timer=setTimeout(()=>ac.abort(),CONFIG.TIMEOUT*1000);
  try { const r=await fetch(CONFIG.API_URL,{method:'POST',body:JSON.stringify(payload),headers:{'Content-Type':'text/plain;charset=utf-8'},redirect:'follow',signal:ac.signal}); if(!r.ok) throw Error('HTTP '+r.status); return await r.json(); }
  finally {clearTimeout(timer)}
}
async function submit() {
  if(demo) { let x=Math.random()*100; for(const p of PRIZES){x-=p.demoWeight;if(x<0)return {ok:true,prizeId:p.id,demo:true}} return {ok:true,prizeId:'may-man',demo:true}; }
  if(!CONFIG.API_URL) return {ok:false,reason:'not_configured'};
  const deviceId=browserId(); if(!deviceId) return {ok:false,reason:'browser_unavailable'};
  state.info.deviceId=deviceId;
  let error; for(let i=0;i<CONFIG.RETRY;i++) {try{return await once(state.info)}catch(e){error=e;if(i+1<CONFIG.RETRY){toast('Mạng chậm, đang thử lại…',1800);await new Promise(r=>setTimeout(r,900*(i+1)))}}} throw error;
}
let wheelReady=false;
$('#form1').addEventListener('submit',async e=>{
  e.preventDefault(); if(!validate())return;
  const btn=$('[form="form1"]'), label=btn.textContent; btn.disabled=true;btn.textContent='ĐANG GỬI…';
  try {
    const res=await submit();
    if(!res.ok) {
      if(res.reason==='not_configured') modal({title:'Chương trình chưa sẵn sàng',body:'Vui lòng liên hệ nhân viên tại quầy.'});
      else if(res.reason==='paused') modal({title:'Vòng quay đang tạm dừng',body:'Vui lòng liên hệ nhân viên tại quầy để biết thêm thông tin.'});
      else if(res.reason==='not_event_time') modal({title:'Ngoài thời gian chương trình',body:'Vòng quay mở từ 08:00 đến 17:00 ngày 30 và 31/10/2026.'});
      else if(res.reason==='device_used' || res.reason==='suspected_duplicate') modal({title:'Không thể tiếp tục lượt quay',body:'Thông tin hoặc trình duyệt này có thể đã được sử dụng. Vui lòng gặp nhân viên tại quầy để được hỗ trợ.'});
      else if(res.reason==='browser_unavailable') modal({title:'Không thể tiếp tục lượt quay',body:'Vui lòng bật lưu dữ liệu trình duyệt hoặc gặp nhân viên tại quầy để được hỗ trợ.'});
      else if(res.reason==='busy') toast('Nhiều người đang tham gia. Vui lòng thử lại sau vài giây.');
      else toast('Không thể ghi nhận lượt quay. Vui lòng liên hệ nhân viên.');
      return;
    }
    if(!PRIZES.some(p=>p.id===res.prizeId)) {toast('Không nhận diện được kết quả. Vui lòng liên hệ nhân viên.');return}
    state.prize=res.prizeId;
    $$('.step').forEach(s=>{const active=s.id==='step3';s.hidden=!active;s.classList.toggle('is-active',active)});
    document.body.dataset.step='3';if(!wheelReady){initWheel();wheelReady=true} window.scrollTo({top:0,behavior:'instant'});
    if(res.demo) toast('Chế độ thử — không ghi dữ liệu.',3000);
  } catch(err){console.error(err);toast('Không kết nối được máy chủ. Vui lòng thử lại hoặc liên hệ nhân viên.',6000)}
  finally {btn.disabled=false;btn.textContent=label}
});
function showResult(){ const p=PRIZES.find(p=>p.id===state.prize); if(!p)return; const miss=p.id==='may-man'; modal({title:p.name,kicker:miss?'CẢM ƠN ANH/CHỊ':'CHÚC MỪNG ANH/CHỊ',img:p.img,body:miss?'Cảm ơn anh/chị đã tham gia chương trình.':'Vui lòng đến quầy Smartlog để nhận quà. Nhân viên sẽ đối chiếu số điện thoại của anh/chị.'}); }
$('#spin').addEventListener('click',()=>{
  if(state.spinning)return;if(state.spun){showResult();return}
  const i=PRIZES.findIndex(p=>p.id===state.prize);if(i<0){toast('Chưa có kết quả. Vui lòng liên hệ nhân viên.');return}
  state.spinning=true;$('#spin').disabled=true;$('#spinNote').textContent='Đang quay…';
  const jitter=(Math.random()-.5)*SEG*.56,target=360*6-i*SEG+jitter;
  requestAnimationFrame(()=>{$('#disc').style.rotate=`${target.toFixed(2)}deg`});
  setTimeout(()=>{state.spinning=false;state.spun=true;$('#spin').disabled=false;$('#spinNote').textContent='Cảm ơn anh/chị đã tham gia!';showResult()},5700);
});
$('#mClose').addEventListener('click',()=>{$('#modal').hidden=true});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))$('#mClose').click()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').hidden)$('#mClose').click()});
$('#phone').addEventListener('input',e=>{e.target.value=e.target.value.replace(/[^\d+\s.\-()]/g,'')});
