require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Rcon } = require('rcon-client');
const { createBot } = require('./bot');
const { createCouponStore } = require('./coupon-store');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
app.use(express.json({ limit:'100kb' }));
app.use(express.static(path.join(ROOT, 'public')));
function loadOrders() { try { return JSON.parse(fs.readFileSync(ORDERS_FILE,'utf8')); } catch { return {}; } }
function saveOrders(db) { fs.mkdirSync(DATA_DIR,{recursive:true}); const tmp=ORDERS_FILE+'.tmp'; fs.writeFileSync(tmp,JSON.stringify(db,null,2)); fs.renameSync(tmp,ORDERS_FILE); }
function getOrder(id) { return loadOrders()[id] || null; }
function saveOrder(order) { const db=loadOrders(); db[order.orderId]=order; saveOrders(db); }
const coupons = createCouponStore(DATA_DIR);
const products = {
  rank:{ diamond:{name:'Diamond Rank',price:39}, ascendant:{name:'Ascendant Rank',price:59}, immortal:{name:'Immortal Rank',price:69} },
  coins:{ '500':{name:'500 Coins',price:19}, '1000':{name:'1,000 Coins',price:35}, '2500':{name:'2,500 Coins',price:49}, '5000':{name:'5,000 Coins',price:89}, '10000':{name:'10,000 Coins',price:149} },
  tag:{ phantom:{name:'PHANTOM Tag',price:19}, ghost:{name:'GHOST Tag',price:29}, spectre:{name:'SPECTRE Tag',price:29}, apex:{name:'APEX Tag',price:39}, odin:{name:'ODIN Tag',price:39}, omega:{name:'OMEGA Tag',price:49} }
};
function safePlayer(s) { return typeof s==='string' && /^[A-Za-z0-9_]{3,16}$/.test(s); }
function parseCart(raw) {
  let arr; try { arr=JSON.parse(raw); } catch { throw new Error('Invalid cart data.'); }
  if (!Array.isArray(arr) || !arr.length || arr.length>10) throw new Error('Invalid cart.');
  const out=[]; let total=0;
  for (const x of arr) {
    const [type,id]=String(x.id||'').split(':'); const p=products[type]?.[id]; const qty=Number(x.qty);
    if (!p || !Number.isInteger(qty) || qty<1 || qty>10) throw new Error('Invalid product or quantity.');
    out.push({id:`${type}:${id}`,type,productId:id,name:p.name,qty,unitPrice:p.price,lineTotal:p.price*qty}); total+=p.price*qty;
  }
  return {items:out,subtotal:total};
}
const upload = multer({ storage:multer.memoryStorage(), limits:{fileSize:5*1024*1024,files:1}, fileFilter:(req,file,cb)=>{ const ok=['image/png','image/jpeg','image/webp'].includes(file.mimetype); cb(ok?null:new Error('Upload PNG, JPG or WEBP only.'),ok); } });
let bot;
app.get('/health',(req,res)=>res.json({ok:true,botReady:!!bot?.client?.isReady(),time:new Date().toISOString()}));
app.get('/api/config',(req,res)=>res.json({upiId:process.env.UPI_ID||'',upiName:process.env.UPI_NAME||'GamerPointMC'}));
app.post('/api/coupons/validate',(req,res)=>{ try { const {subtotal}=parseCart(JSON.stringify(req.body.cart)); const quote=coupons.quote(req.body.code,subtotal); res.json({ok:true,...quote}); } catch(e) { res.status(400).json({error:e.message}); } });
async function deliverOrder(order) {
  const map=JSON.parse(process.env.DELIVERY_COMMANDS_JSON||'{}'); const commands=[];
  for (const item of order.items) { const template=map[item.id]; if(!template || template.includes('YOUR_')) throw new Error(`Delivery command is not configured for ${item.id}`); for(let n=0;n<item.qty;n++) { const cmd=template.replaceAll('{player}',order.player); if(/[\r\n]/.test(cmd)) throw new Error('Unsafe command template.'); commands.push(cmd); } }
  const rcon=await Rcon.connect({host:process.env.RCON_HOST||'127.0.0.1',port:Number(process.env.RCON_PORT||25575),password:process.env.RCON_PASSWORD});
  try { for(const cmd of commands) await rcon.send(cmd); } finally { await rcon.end(); }
}
bot=createBot({ getOrder, saveOrder, deliverOrder, coupons });
app.post('/api/orders',upload.single('screenshot'),async(req,res)=>{
  let reservedCoupon=null;
  try {
    if(!bot?.client?.isReady()) return res.status(503).json({error:'Discord order bot is offline. Try again later.'});
    const player=String(req.body.minecraftUsername||'').trim(); if(!safePlayer(player)) return res.status(400).json({error:'Enter a valid Minecraft Java username (3–16 letters, numbers or underscore).'});
    const payerUpiId=String(req.body.payerUpiId||'').trim(); if(payerUpiId.length>100) return res.status(400).json({error:'Payer UPI ID is too long.'});
    const utr=String(req.body.utr||'').trim(); if(!/^[A-Za-z0-9-]{6,40}$/.test(utr)) return res.status(400).json({error:'Enter a valid UPI transaction reference / UTR.'});
    if(!req.file) return res.status(400).json({error:'Payment screenshot is required.'});
    const {items,subtotal}=parseCart(req.body.cart); const quote=coupons.quote(req.body.couponCode,subtotal);
    if(Number(req.body.total)!==quote.total) return res.status(400).json({error:'Cart total mismatch. Refresh checkout and try again.'});
    if(quote.code) { coupons.reserve(quote.code); reservedCoupon=quote.code; }
    const orderId='GPM-'+Date.now().toString(36).toUpperCase()+'-'+crypto.randomBytes(2).toString('hex').toUpperCase();
    const order={orderId,player,payerUpiId,utr,items,subtotal,couponCode:quote.code,discount:quote.discount,total:quote.total,status:'PENDING',createdAt:new Date().toISOString(),discordMessageId:null};
    saveOrder(order);
    try { await bot.publishOrder(order,req.file); saveOrder(order); }
    catch(e) { if(reservedCoupon) coupons.release(reservedCoupon); order.status='DISCORD_SEND_FAILED'; order.error=String(e.message||e); saveOrder(order); throw e; }
    res.json({ok:true,orderId});
  } catch(e) { console.error('[Order submit]',e); res.status(400).json({error:e.message||'Could not submit order. Please contact staff on Discord.'}); }
});
app.use((err,req,res,next)=>{ console.error(err); res.status(400).json({error:err.message||'Bad request'}); });
app.listen(PORT,process.env.HOST||'0.0.0.0',()=>console.log(`GamerPointMC store listening on ${PORT}`));
