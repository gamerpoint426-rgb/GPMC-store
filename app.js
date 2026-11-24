
const DISCORD="https://discord.gg/T8h5gp5fET", JAVA="play.gamerpointmc.qzz.io", BEDROCK="pe.gamerpointmc.qzz.io:443";
const $=s=>document.querySelector(s), products=window.GPM_PRODUCTS||[];
const getCart=()=>{try{return JSON.parse(localStorage.getItem("gpm_cart")||"{}")}catch(e){return {}}};
const saveCart=c=>{localStorage.setItem("gpm_cart",JSON.stringify(c));updateCount();};
function toast(t){const el=$("#toast");if(!el)return;el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2100)}
function updateCount(){let c=getCart(),n=Object.values(c).reduce((a,b)=>a+b,0);document.querySelectorAll("[data-cart-count]").forEach(x=>x.textContent=n)}
function add(id){let c=getCart();c[id]=(c[id]||0)+1;saveCart(c);toast("Added to your cart!")}
document.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>add(b.dataset.add)));
document.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",async()=>{let v=b.dataset.copy==="java"?JAVA:BEDROCK;try{await navigator.clipboard.writeText(v);toast("Copied: "+v)}catch(e){toast(v)}}));
document.querySelectorAll("[data-year]").forEach(x=>x.textContent=new Date().getFullYear());
const toggle=$(".mobile-toggle"),links=$(".navlinks");if(toggle&&links){toggle.setAttribute("aria-expanded","false");toggle.onclick=()=>{const open=links.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Close navigation":"Open navigation")};links.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{links.classList.remove("open");toggle.setAttribute("aria-expanded","false")}));}
updateCount();
function renderCart(){const box=$("#cart-items");if(!box)return;const cart=getCart(),entries=Object.entries(cart).filter(([id,q])=>products.some(p=>p.id===id)&&q>0);$("#cart-total-items").textContent=entries.reduce((n,[,q])=>n+q,0);if(!entries.length){box.innerHTML='<div class="empty"><strong>Your cart is empty.</strong>Browse the store and add something you like.<br><br><a class="btn btn-gold" href="ranks.html">BROWSE RANKS</a></div>';return}
box.innerHTML=entries.map(([id,q])=>{let p=products.find(x=>x.id===id);return `<div class="cart-row"><div><b>${p.name}</b><small>${p.price} · ${p.desc}</small></div><div class="qty"><button data-dec="${id}">−</button><b>${q}</b><button data-inc="${id}">+</button></div><button class="remove" data-remove="${id}">REMOVE</button></div>`}).join("");
box.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>{let c=getCart();c[b.dataset.inc]++;saveCart(c);renderCart()});
box.querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>{let c=getCart();c[b.dataset.dec]--;if(c[b.dataset.dec]<=0)delete c[b.dataset.dec];saveCart(c);renderCart()});
box.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{let c=getCart();delete c[b.dataset.remove];saveCart(c);renderCart()});
}
renderCart();
const clear=$("#clear-cart");if(clear)clear.onclick=()=>{saveCart({});renderCart();toast("Cart cleared")};
const order=$("#discord-order");if(order)order.onclick=async()=>{let c=getCart(),entries=Object.entries(c).filter(([id,q])=>products.some(p=>p.id===id)&&q>0);if(!entries.length)return toast("Your cart is empty.");let lines=entries.map(([id,q])=>{let p=products.find(x=>x.id===id);return `${q} x ${p.name} (${p.price})`});let msg="GamerPointMC Store Order\n"+lines.join("\n")+"\nMinecraft username: ";try{await navigator.clipboard.writeText(msg);toast("Order summary copied. Paste it in your Discord ticket.");}catch(e){toast("Please copy your cart details manually.");}window.open(DISCORD,"_blank","noopener")};
async function status(){let s=$("#status");if(!s)return;try{let r=await fetch("https://api.mcsrvstat.us/3/"+encodeURIComponent(JAVA));if(!r.ok)throw 0;let d=await r.json();if(d.online){s.textContent="ONLINE";$("#players").textContent=`${d.players?.online??0} / ${d.players?.max??"?"}`;$("#motd").textContent=(d.motd?.clean||[]).join(" ")||"Welcome to GamerPointMC";}else{s.textContent="OFFLINE";$("#players").textContent="0";$("#motd").textContent="Server currently offline";if($("#status-dot"))$("#status-dot").style.background="var(--red)"}}catch(e){s.textContent="STATUS UNAVAILABLE";$("#players").textContent="—";$("#motd").textContent="Could not fetch MOTD"}}
status();if($("#status"))setInterval(status,60000);
