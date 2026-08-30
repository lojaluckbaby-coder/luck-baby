
const $=id=>document.getElementById(id);
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const KEY='luckbaby_store_pro_v3';
const defaults={
 products:[],cart:[],orders:[],customers:[],favorites:[],
 settings:{whatsapp:'5554000000000',pix:'',pixName:'LUCK BABY',install:'6x',instagram:'',phone:'',email:'',storeName:'LUCK BABY — Loja Infantil'},
 shipping:{type:'Combinar pelo WhatsApp',value:0,note:''},
 categories:['Meninas','Meninos','Bebê','Vestidos','Conjuntos','Moletons','Jardineiras','Calçados','Acessórios'],
 promo:{title:'Ofertas da semana',text:'Confira nossas peças especiais.',active:true},
banners:[],brands:[]
};
let db=null;
try{ db=JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ console.warn('Dados antigos inválidos; iniciando loja limpa.',e); localStorage.removeItem(KEY); }
if(!db || typeof db!=='object') db=structuredClone(defaults);
for(const k in defaults) if(db[k]===undefined) db[k]=structuredClone(defaults[k]);
const demo=[
{id:'d1',name:'Vestido Laço Encantado',price:129.90,sizes:'2,4,6,8',category:'Vestidos',emoji:'👗'},
{id:'d2',name:'Conjunto Polo Premium',price:109.90,sizes:'1,2,4,6',category:'Conjuntos',emoji:'👕'},
{id:'d3',name:'Conjunto Ursinha',price:119.90,sizes:'1,2,4,6',category:'Meninas',emoji:'🧸'},
{id:'d4',name:'Jardineira Jeans',price:139.90,sizes:'2,4,6,8',category:'Jardineiras',emoji:'👖'},
{id:'d5',name:'Tênis Infantil Coração',price:89.90,sizes:'20,22,24,26',category:'Calçados',emoji:'👟'}
];
let cloudTimer=null;
let cloudAdminAuthenticated=false;
let cloudBusy=false;
let suspendCloudSync=false;
function persist(){
 localStorage.setItem(KEY,JSON.stringify(db));
 if(!suspendCloudSync && cloudAdminAuthenticated) scheduleCloudSync();
}
function scheduleCloudSync(){
 clearTimeout(cloudTimer);
 cloudTimer=setTimeout(()=>syncCloudStore().catch(e=>console.warn('Falha ao sincronizar com a nuvem:',e)),500);
}
async function syncCloudStore(){
 if(cloudBusy)return;
 cloudBusy=true;
 try{
  const r=await fetch('/api/store',{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Password':window.SETTINGS_PASSWORD},body:JSON.stringify(db)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(j.error||'Não foi possível salvar no servidor.');
 }finally{cloudBusy=false}
}
async function loadPublicCloud(){
 try{
  const r=await fetch('/api/store',{cache:'no-store'}); if(!r.ok)return;
  const j=await r.json(); if(!j.ok||!j.data)return;
  const localCart=db.cart||[],localFav=db.favorites||[];
  const incoming=j.data;
  db={...db,...incoming,cart:localCart,favorites:localFav,orders:db.orders||[],customers:db.customers||[]};
  localStorage.setItem(KEY,JSON.stringify(db)); renderProducts(); renderPublicBanners(); renderPublicBrands();
 }catch(e){console.warn('API central ainda não disponível; usando dados locais.',e)}
}
async function authenticateCloudAdmin(){
 if(cloudAdminAuthenticated)return true;
 const pass=window.prompt('Digite a senha administrativa para salvar no servidor:');
 if(pass===null)return false;
 if(pass!==window.SETTINGS_PASSWORD){toast('Acesso negado.');return false;}
 cloudAdminAuthenticated=true;
 try{
  const r=await fetch('/api/store?admin=1',{headers:{'X-Admin-Password':window.SETTINGS_PASSWORD},cache:'no-store'});
  if(r.ok){const j=await r.json();if(j.ok&&j.admin&&j.data){const cart=db.cart||[],fav=db.favorites||[];db={...db,...j.data,cart,favorites:fav};localStorage.setItem(KEY,JSON.stringify(db));renderProducts();renderAdmin();}}
 }catch(e){console.warn(e)}
 return true;
}
function renderPublicBanners(){
 const box=$('publicBanners'); if(!box)return;
 const arr=db.banners||[]; box.innerHTML=arr.length?arr.map(b=>`<a class="publicBanner" href="${b.link||'#'}" ${b.link?'target="_blank" rel="noopener"':''}><img src="${b.image||''}" alt="Banner LUCK BABY"></a>`).join(''):'';
}
function renderPublicBrands(){
 const box=$('publicBrands'); if(!box)return;
 const arr=db.brands||[]; box.innerHTML=arr.length?arr.map(b=>`<a class="publicBrand" href="${b.link||'#'}" ${b.link?'target="_blank" rel="noopener"':''}>${b.image?`<img src="${b.image}" alt="${b.name}">`:''}<span>${b.name}</span></a>`).join(''):'';
}
function allProducts(){return db.products.length?db.products:demo}
function findProduct(id){return db.products.find(p=>p.id===id)||demo.find(p=>p.id===id)}
function toast(msg){alert(msg)}
function renderProducts(list=allProducts()){
 const favs=db.favorites||[];
 $('productGrid').innerHTML=list.length?list.map(p=>{
   const fav=favs.includes(p.id);
   return `<article class="product">
   ${p.promo?'<div class="badge">OFERTA</div>':''}
   <button type="button" class="heart ${fav?'favActive':''}" onclick="toggleFav('${p.id}')">${fav?'♥':'♡'}</button>
   <div class="pPhoto" onclick="openDetail('${p.id}')">${(p.photos?.[0]||p.photo)?`<img src="${p.photos?.[0]||p.photo}" alt="${p.name}">`:(p.emoji||'🧸')}</div>
   <div class="pInfo"><h3>${p.name}</h3>${p.brand?`<div class="brand">${p.brand}</div>`:''}
   <div class="price">${money(p.promo||p.price)} ${p.promo?`<small style="color:#aaa;text-decoration:line-through">${money(p.price)}</small>`:''}</div>
   <div class="sizes">${(p.sizes||'').split(',').filter(Boolean).map(s=>`<span>${s.trim()}</span>`).join('')}</div>
   <button type="button" class="quick" onclick="openDetail('${p.id}')">Ver detalhes</button>
   <button type="button" class="add" onclick="addCart('${p.id}')">🛒 ADICIONAR AO CARRINHO</button></div></article>`;
 }).join(''):'<div class="emptySearch">Nenhum produto encontrado.<br><br><button type="button" class="tab" onclick="clearFilters()">Limpar filtros</button></div>';
 $('cartCount').textContent=db.cart.reduce((s,p)=>s+(p.qty||1),0);
 $('cartFloatCount').textContent=db.cart.reduce((s,p)=>s+(p.qty||1),0);
 $('whatsFloat').href='https://wa.me/'+(db.settings.whatsapp||'');
}
function applyFilters(){
 const q=($('shopSearch')?.value||'').toLowerCase(),cat=$('filterCat')?.value||'',size=$('filterSize')?.value||'',sort=$('sortProducts')?.value||'featured';
 let list=allProducts().filter(p=>(!q||(p.name+' '+(p.brand||'')+' '+(p.category||'')).toLowerCase().includes(q))&&(!cat||p.category===cat)&&(!size||(p.sizes||'').split(',').map(x=>x.trim()).includes(size)));
 if(sort==='low')list.sort((a,b)=>(a.promo||a.price)-(b.promo||b.price));
 if(sort==='high')list.sort((a,b)=>(b.promo||b.price)-(a.promo||a.price));
 if(sort==='new')list=list.slice().reverse();
 renderProducts(list)
}
function clearFilters(){if($('shopSearch'))$('shopSearch').value='';if($('filterCat'))$('filterCat').value='';if($('filterSize'))$('filterSize').value='';if($('sortProducts'))$('sortProducts').value='featured';renderProducts()}
function category(c){if($('filterCat'))$('filterCat').value=c;applyFilters();location.hash='produtos'}
function toggleFav(id){db.favorites=db.favorites||[];db.favorites=db.favorites.includes(id)?db.favorites.filter(x=>x!==id):[...db.favorites,id];persist();applyFilters()}

function productUrl(id){const p=(typeof db!=='undefined'&&db.products)?db.products.find(x=>x.id===id):null;return p?.link||location.href.split('#')[0]+'#produto='+encodeURIComponent(id)}
function openDetail(id){
 const p=findProduct(id);if(!p)return;
 $('detailProductId').value=id;$('detailName').textContent=p.name;$('detailBrand').textContent=p.brand||'LUCK BABY';
 $('detailPrice').innerHTML=money(p.promo||p.price)+(p.promo?` <small style="color:#aaa;text-decoration:line-through">${money(p.price)}</small>`:'');
 $('detailDesc').textContent=p.desc||'Uma peça escolhida com carinho para trazer conforto, estilo e qualidade para os pequenos.';
 const photos=(p.photos&&p.photos.length?p.photos:(p.photo?[p.photo]:[])).slice(0,5);
 const main=photos[0];
 $('detailPhoto').innerHTML=main?`<img src="${main}" alt="${p.name}" onclick="zoomPhoto(this.src)">`:`<div class="detailEmoji">${p.emoji||'🧸'}</div>`;
 $('detailThumbs').innerHTML=photos.map((src,i)=>`<button type="button" onclick="selectDetailPhoto('${src.replace(/'/g,"&#39;")}')"><img src="${src}" alt="Foto ${i+1}"></button>`).join('');
 $('productLink').textContent=productUrl(id);
 const sizes=(p.sizes||'').split(',').map(s=>s.trim()).filter(Boolean);
 $('detailSizes').innerHTML=sizes.length?sizes.map((s,i)=>`<button type="button" class="${i===0?'selected':''}" onclick="selectSize(this)">${s}</button>`).join(''):'<span style="color:#888">Tamanho a confirmar</span>';
 $('detailQty').textContent='1';$('detailModal').classList.add('open');
 history.replaceState(null,'',productUrl(id));
}
function selectDetailPhoto(src){$('detailPhoto').innerHTML=`<img src="${src}" alt="Foto do produto" onclick="zoomPhoto(this.src)">`}
function zoomPhoto(src){$('zoomImage').src=src;$('zoomModal').classList.add('open')}
function closeZoom(){$('zoomModal').classList.remove('open')}
function shareProduct(){const id=$('detailProductId').value,p=findProduct(id);if(!p)return;const url=productUrl(id);if(navigator.share){navigator.share({title:p.name,text:'Confira este produto da LUCK BABY',url}).catch(()=>{})}else if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>toast('Link copiado!')).catch(()=>toast(url))}else toast(url)}
function copyProductLink(){const u=$('productLink').textContent;if(navigator.clipboard)navigator.clipboard.writeText(u).then(()=>toast('Link copiado!'));else toast(u)}
function closeDetail(){$('detailModal').classList.remove('open');if(location.hash.startsWith('#produto='))history.replaceState(null,'',location.pathname+location.search)}
function selectSize(b){document.querySelectorAll('#detailSizes button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')}
function changeQty(d){$('detailQty').textContent=Math.max(1,Number($('detailQty').textContent)+d)}
function addFromDetail(){
 const p=findProduct($('detailProductId').value),size=document.querySelector('#detailSizes button.selected')?.textContent||'',qty=Number($('detailQty').textContent)||1;
 if(!p)return;for(let i=0;i<qty;i++)db.cart.push({...p,selectedSize:size,qty:1});persist();closeDetail();openCart();renderProducts()
}
function whatsappFromDetail(){
 const p=findProduct($('detailProductId').value),size=document.querySelector('#detailSizes button.selected')?.textContent||'a confirmar',qty=Number($('detailQty').textContent)||1;
 if(!p)return;const total=(p.promo||p.price)*qty;
 const msg=`Olá! Tenho interesse na LUCK BABY.\n\nProduto: ${p.name}\nTamanho: ${size}\nQuantidade: ${qty}\nValor: ${money(total)}\n\nGostaria de confirmar disponibilidade e entrega.`;
 location.href='https://wa.me/'+db.settings.whatsapp+'?text='+encodeURIComponent(msg)
}

function addCart(id){const p=findProduct(id);if(!p)return;db.cart.push({...p,selectedSize:'',qty:1});persist();openCart();renderProducts()}
function removeCart(i){db.cart.splice(i,1);persist();openCart();renderProducts()}
function changeCartQty(i,d){const q=(db.cart[i].qty||1)+d;if(q<=0)db.cart.splice(i,1);else db.cart[i].qty=q;persist();openCart();renderProducts()}
function openCart(){
 $('cartModal').classList.add('open');
 const total=db.cart.reduce((s,p)=>s+Number(p.promo||p.price)*(p.qty||1),0);
 $('cartItems').innerHTML=db.cart.length?db.cart.map((p,i)=>`<div class="cartLine"><span><b>${p.name}</b><br><small>${p.selectedSize?'Tamanho: '+p.selectedSize+' • ':''}${money(p.promo||p.price)} cada</small></span><span style="white-space:nowrap"><button type="button" class="remove" onclick="changeCartQty(${i},-1)">−</button> <b>${p.qty||1}</b> <button type="button" class="remove" onclick="changeCartQty(${i},1)">+</button> <button type="button" class="remove" onclick="removeCart(${i})">×</button></span></div>`).join(''):'<div class="empty">Seu carrinho está vazio.</div>';
 $('cartTotal').textContent='Total: '+money(total)
}
function closeCart(){$('cartModal').classList.remove('open')}
function sendWhatsApp(){
 if(!db.cart.length)return toast('Adicione um produto primeiro.');
 const name=$('customerName').value.trim();if(!name)return toast('Informe seu nome.');
 const pay=$('customerPayment').value,total=db.cart.reduce((s,p)=>s+Number(p.promo||p.price)*(p.qty||1),0);
 const items=db.cart.map(p=>`- ${p.name} | tamanho: ${p.selectedSize||'a confirmar'} | qtd: ${p.qty||1} | ${money((p.promo||p.price)*(p.qty||1))}`).join('\n');
 const order={id:'PED-'+Date.now(),date:new Date().toLocaleString('pt-BR'),customer:name,phone:'',items:structuredClone(db.cart),total,payment:pay,status:'Aguardando confirmação',paymentStatus:'Aguardando',shippingStatus:'Aguardando',whatsappSent:true};
 db.orders.unshift(order);
 const existing=db.customers.find(c=>c.name.toLowerCase()===name.toLowerCase());if(!existing)db.customers.push({name,created:order.date,orders:1});else existing.orders++;
 persist();
 const msg=`Olá! Quero fazer um pedido na LUCK BABY.\n\nPedido: ${order.id}\nNome: ${name}\n\nPRODUTOS:\n${items}\n\nTOTAL: ${money(total)}\nPagamento: ${pay}\n\nGostaria de confirmar disponibilidade, frete, tamanhos e pagamento.`;
 location.href='https://wa.me/'+db.settings.whatsapp+'?text='+encodeURIComponent(msg);
 closeCart();renderAdmin()
}

/* ADMIN */
let adminTab='dashboard';
window.SETTINGS_PASSWORD='251400';
window.settingsUnlocked=false;
function openAdmin(tab='dashboard'){
 const modal=$('adminModal');
 if(!modal){console.error('Painel administrativo não encontrado.');return false;}
 const requestedSettings=(tab==='settings'||tab==='configuracoes');
 // A senha deve ser validada ANTES de abrir/mostrar o painel de configurações.
 // Cancelar ou senha errada encerra a operação completamente.
 if(requestedSettings && !requestSettingsAccess()){
   window.settingsUnlocked=false;
   modal.classList.remove('open');
   adminTab='dashboard';
   document.querySelectorAll('.adminPage').forEach(pg=>pg.style.display='none');
   return false;
 }
 modal.classList.add('open');
 return showAdminTab(requestedSettings ? 'settings' : tab, true);
}
function closeAdmin(){
 const modal=$('adminModal');
 if(modal)modal.classList.remove('open');
 window.settingsUnlocked=false;
}
function requestSettingsAccess(){
 if(window.settingsUnlocked===true)return true;
 const password=window.prompt('Digite a senha para acessar as configurações:');
 // Cancelar retorna null e também é considerado bloqueio total.
 if(password===null){
   toast('Acesso cancelado.');
   return false;
 }
 if(password===window.SETTINGS_PASSWORD){
   window.settingsUnlocked=true;
   return true;
 }
 toast('Acesso negado.');
 return false;
}
function showAdminTab(tab, accessAlreadyGranted=false){
 const requestedSettings=(tab==='settings'||tab==='configuracoes');
 if(requestedSettings){
  if(!accessAlreadyGranted && !requestSettingsAccess()){
   window.settingsUnlocked=false;
   const settingsPage=document.querySelector('.adminPage[data-page="settings"]');
   if(settingsPage)settingsPage.style.display='none';
   return false;
  }
  tab='settings';
 }
 adminTab=tab;
 document.querySelectorAll('.adminTab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 document.querySelectorAll('.adminPage').forEach(pg=>pg.style.display=pg.dataset.page===tab?'block':'none');
 renderAdmin();
 return true;
}
function renderAdmin(){
 if(adminTab==='dashboard')renderDashboard();
 if(adminTab==='products')renderList();
 if(adminTab==='orders')renderOrders();
 if(adminTab==='customers')renderCustomers();
 if(adminTab==='categories')renderCategories();
 if(adminTab==='promos')loadPromo();
 if(adminTab==='settings')loadSettings();
 if(adminTab==='shipping')loadShipping();
 if(adminTab==='payments')loadPayments();
 if(adminTab==='whatsapp')loadWhatsApp();
 if(adminTab==='banners')loadBanners();
 if(adminTab==='brands')loadBrands();
}
function renderDashboard(){
 const pending=db.orders.filter(o=>o.status==='Aguardando confirmação').length, paid=db.orders.filter(o=>o.paymentStatus==='Confirmado').length, revenue=db.orders.filter(o=>o.status!=='Cancelado').reduce((s,o)=>s+o.total,0);
 $('dash').innerHTML=`<div class="dashGrid"><div class="dashCard"><b>${db.products.length}</b><span>Produtos cadastrados</span></div><div class="dashCard"><b>${db.orders.length}</b><span>Pedidos</span></div><div class="dashCard"><b>${pending}</b><span>Aguardando confirmação</span></div><div class="dashCard"><b>${money(revenue)}</b><span>Vendas registradas</span></div></div>
 <div class="adminNotice">💡 <b>Fluxo da loja:</b> cliente monta o carrinho → envia pelo WhatsApp → você confirma pagamento e entrega aqui no painel.</div>
 <h3>Últimos pedidos</h3>${db.orders.slice(0,5).map(orderCard).join('')||'<div class="empty">Nenhum pedido ainda.</div>'}`
}
function orderCard(o){
 return `<div class="orderCard"><div><b>${o.id}</b> • ${o.date}<br><strong>${o.customer}</strong> — ${money(o.total)}<br><small>${o.payment} • Pedido: ${o.status} • Pagamento: ${o.paymentStatus} • Entrega: ${o.shippingStatus}</small></div><div class="orderActions">
 <button type="button" onclick="orderAction('${o.id}','confirmOrder')">✓ Confirmar pedido</button><button type="button" onclick="orderAction('${o.id}','confirmPayment')">💳 Confirmar pagamento</button><button type="button" onclick="orderAction('${o.id}','separate')">📦 Separar</button><button type="button" onclick="orderAction('${o.id}','shipped')">🚚 Enviado</button><button type="button" class="danger" onclick="orderAction('${o.id}','cancel')">Cancelar</button></div></div>`
}
function renderOrders(){$('ordersList').innerHTML=db.orders.length?db.orders.map(orderCard).join(''):'<div class="empty">Nenhum pedido registrado.</div>'}
function orderAction(id,action){
 const o=db.orders.find(x=>x.id===id);if(!o)return;
 if(action==='confirmOrder')o.status='Confirmado';
 if(action==='confirmPayment')o.paymentStatus='Confirmado';
 if(action==='separate')o.status='Separando pedido';
 if(action==='shipped'){o.shippingStatus='Enviado';o.status='Enviado'}
 if(action==='cancel'){ if(!requestCancelAccess()) return; o.status='Cancelado'; }
 persist();renderAdmin();toast('Pedido atualizado!')
}
function requestCancelAccess(){
 const password=window.prompt('Digite a senha para CANCELAR o pedido:');
 if(password!==window.SETTINGS_PASSWORD){toast('Cancelamento bloqueado. Senha incorreta.');return false}
 return window.confirm('Confirma o cancelamento deste pedido?');
}

function renderCustomers(){$('customersList').innerHTML=db.customers.length?db.customers.map(c=>`<div class="customerRow"><b>${c.name}</b><span>${c.orders||1} pedido(s)</span></div>`).join(''):'<div class="empty">Os clientes aparecerão aqui após os pedidos.</div>'}
function renderCategories(){$('categoriesList').innerHTML=db.categories.map((c,i)=>`<div class="customerRow"><b>${c}</b><button type="button" class="danger" onclick="deleteCategory(${i})">Excluir</button></div>`).join('')}
async function addCategory(){if(!(await authenticateCloudAdmin()))return;const n=$('newCategory').value.trim();if(!n)return;if(!db.categories.includes(n))db.categories.push(n);persist();$('newCategory').value='';renderCategories()}
async function deleteCategory(i){if(!(await authenticateCloudAdmin()))return;db.categories.splice(i,1);persist();renderCategories()}
function loadPromo(){$('promoTitle').value=db.promo.title;$('promoText').value=db.promo.text;$('promoActive').checked=db.promo.active}
async function savePromo(){if(!(await authenticateCloudAdmin()))return;db.promo={title:$('promoTitle').value,text:$('promoText').value,active:$('promoActive').checked};persist();toast('Promoção salva!')}
function loadSettings(){$('sInstagram').value=db.settings.instagram||'';$('sPhoneSettings').value=db.settings.phone||'';$('sEmail').value=db.settings.email||'';$('sStoreName').value=db.settings.storeName||'';}
async function saveSettings(){if(!(await authenticateCloudAdmin()))return;db.settings.instagram=$('sInstagram').value.trim();db.settings.phone=$('sPhoneSettings').value.trim();db.settings.email=$('sEmail').value.trim();db.settings.storeName=$('sStoreName').value.trim();persist();await syncCloudStore();toast('Configurações salvas para todos os clientes!')}
function loadPayments(){$('sPix').value=db.settings.pix||'';$('sPixName').value=db.settings.pixName||'';$('sInstall').value=db.settings.install||'6x'}
async function savePayments(){if(!(await authenticateCloudAdmin()))return;db.settings.pix=$('sPix').value.trim();db.settings.pixName=$('sPixName').value.trim();db.settings.install=$('sInstall').value;persist();await syncCloudStore();toast('Pagamentos salvos!')}
function loadWhatsApp(){$('sWhatsapp').value=db.settings.whatsapp||'';$('sPhoneWhatsapp').value=db.settings.phone||''}
async function saveWhatsApp(){if(!(await authenticateCloudAdmin()))return;db.settings.whatsapp=$('sWhatsapp').value.replace(/\D/g,'');db.settings.phone=$('sPhoneWhatsapp').value.trim();persist();await syncCloudStore();toast('WhatsApp salvo!')}
function loadShipping(){$('sShipping').value=db.shipping.type;$('sShippingValue').value=db.shipping.value;$('sShippingNote').value=db.shipping.note}
async function saveShipping(){if(!(await authenticateCloudAdmin()))return;db.shipping.type=$('sShipping').value;db.shipping.value=Number($('sShippingValue').value)||0;db.shipping.note=$('sShippingNote').value;persist();await syncCloudStore();toast('Entrega salva!')}
function renderList(){$('productList').innerHTML=db.products.length?db.products.map(p=>`<div class="row"><div class="thumb">${p.photo?`<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:9px">`:'🧸'}</div><div><b>${p.name}</b><br><small>${p.brand||'Sem marca'} • ${money(p.price)} • ${p.sizes||'Sem tamanho'} • estoque: ${p.stock??0}</small></div><div><button type="button" class="tab" onclick="editProduct('${p.id}')">Editar</button> <button type="button" class="danger" onclick="removeProduct('${p.id}')">Excluir</button></div></div>`).join(''):'<div class="empty">Nenhum produto cadastrado.</div>'}
function openProduct(id=null){
 $('productModal').classList.add('open');$('productModal').dataset.edit=id||'';
 const p=id?db.products.find(x=>x.id===id):null;
 ['pName','pPrice','pBrand','pSizes','pStock','pPromo','pDesc','pLink'].forEach(x=>$(x).value=p?(p[x==='pPrice'?'price':x==='pBrand'?'brand':x==='pSizes'?'sizes':x==='pStock'?'stock':x==='pPromo'?'promo':x==='pDesc'?'desc':x==='pLink'?'link':'name']??''):'');
 $('pCat').value=p?.category||'Meninas';
 window.productPhotos=p?.photos?.slice(0,5)||(p?.photo?[p.photo]:[]);renderPhotoPreviews();
}
function renderPhotoPreviews(){
 const box=$('photoPreviews');if(!box)return;box.innerHTML=(window.productPhotos||[]).map((src,i)=>`<div class="photoPreview"><img src="${src}"><button type="button" onclick="removeProductPhoto(${i})">×</button></div>`).join('');
}
function removeProductPhoto(i){window.productPhotos.splice(i,1);renderPhotoPreviews()}
function handleProductPhotos(files){
 const incoming=[...files].slice(0,5-(window.productPhotos||[]).length);
 let left=incoming.length;if(!left)return;
 incoming.forEach(f=>{const r=new FileReader();r.onload=()=>{window.productPhotos.push(r.result);left--;if(left===0)renderPhotoPreviews()};r.readAsDataURL(f)});
}
function closeProduct(){$('productModal').classList.remove('open')}
function editProduct(id){openProduct(id)}
async function uploadDataUrl(dataUrl){
 if(!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
 const m=dataUrl.match(/^data:([^;]+);base64,(.+)$/); if(!m)return dataUrl;
 const bin=atob(m[2]); const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
 const blob=new Blob([bytes],{type:m[1]}); const fd=new FormData(); fd.append('file',blob,'imagem');
 const r=await fetch('/api/upload',{method:'POST',headers:{'X-Admin-Password':window.SETTINGS_PASSWORD},body:fd});
 const j=await r.json().catch(()=>({})); if(!r.ok)throw new Error(j.error||'Falha ao enviar imagem'); return j.url;
}
async function saveProduct(){
 if(!(await authenticateCloudAdmin()))return;
 const edit=$('productModal').dataset.edit;
 const localPhotos=(window.productPhotos||[]).slice(0,5);
 const base={name:$('pName').value.trim(),price:Number($('pPrice').value),brand:$('pBrand').value.trim(),sizes:$('pSizes').value,category:$('pCat').value,stock:Number($('pStock').value)||0,promo:Number($('pPromo').value)||0,desc:$('pDesc').value,link:$('pLink').value.trim()};
 if(!base.name||!base.price)return toast('Preencha nome e valor.');
 try{
  suspendCloudSync=true;
  const photos=[];
  for(const src of localPhotos)photos.push(await uploadDataUrl(src));
  const id=edit||String(Date.now()); base.photos=photos;base.photo=photos[0]||'';base.link=base.link||location.href.split('#')[0]+'#produto='+encodeURIComponent(id);
  if(edit){const target=db.products.find(p=>p.id===edit);if(target)Object.assign(target,base)}else db.products.push({id,...base,emoji:'🧸'});
  localStorage.setItem(KEY,JSON.stringify(db)); closeProduct();renderProducts();renderList(); await syncCloudStore(); toast('Produto publicado para todos os clientes!');
 }catch(e){toast(e.message||'Não foi possível publicar o produto.');}
 finally{suspendCloudSync=false}
}
async function removeProduct(id){if(!(await authenticateCloudAdmin()))return;db.products=db.products.filter(p=>p.id!==id);persist();renderProducts();renderList();await syncCloudStore();toast('Produto excluído para todos os clientes!')}

function loadBanners(){const box=$('bannersList');box.innerHTML=(db.banners||[]).map((b,i)=>`<div class="adminLinkRow"><img src="${b.image||''}"><input value="${(b.link||'').replace(/"/g,'&quot;')}" placeholder="Link do banner" onchange="db.banners[${i}].link=this.value"><button type="button" class="danger" onclick="db.banners.splice(${i},1);persist();loadBanners()">Excluir</button></div>`).join('')||'<div class="empty">Nenhum banner cadastrado.</div>'}
async function addBanner(){if(!(await authenticateCloudAdmin()))return;const url=prompt('Cole o link da imagem do banner:');if(!url)return;const link=prompt('Link para abrir ao clicar (opcional):')||'';db.banners.push({image:url,link});persist();loadBanners()}
function saveBanners(){persist();toast('Banners salvos!')}
function loadBrands(){const box=$('brandsList');box.innerHTML=(db.brands||[]).map((b,i)=>`<div class="adminLinkRow"><div style="font-weight:700">${b.name}</div><input value="${(b.link||'').replace(/"/g,'&quot;')}" placeholder="Link da marca" onchange="db.brands[${i}].link=this.value"><button type="button" class="danger" onclick="db.brands.splice(${i},1);persist();loadBrands()">Excluir</button></div>`).join('')||'<div class="empty">Nenhuma marca cadastrada.</div>'}
async function addBrand(){if(!(await authenticateCloudAdmin()))return;const name=prompt('Nome da marca:');if(!name)return;const image=prompt('Link da foto/logo da marca (opcional):')||'';const link=prompt('Link da marca:')||'';db.brands.push({name,image,link});persist();loadBrands();renderPublicBrands()}

function loadPanel(){
 document.querySelectorAll('.adminTab').forEach(b=>b.onclick=(e)=>{e.preventDefault();showAdminTab(b.dataset.tab)});
 renderAdmin()
}
window.addEventListener('DOMContentLoaded',async()=>{renderProducts();renderPublicBanners();renderPublicBrands();await loadPublicCloud();if(location.hash.startsWith('#produto='))openDetail(decodeURIComponent(location.hash.slice(9)));});
window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#produto=(.+)$/);if(m)openDetail(decodeURIComponent(m[1]))});


document.addEventListener('DOMContentLoaded',()=>{try{loadPanel();renderProducts()}catch(e){console.error(e)}});
(function(){function sync(){try{var m=document.getElementById("cartCount"),a=document.getElementById("mobileCartCount"),f=document.getElementById("cartFloatCount");if(m&&a)a.textContent=m.textContent||"0";if(m&&f)f.textContent=m.textContent||"0"}catch(e){}}document.addEventListener("DOMContentLoaded",sync);setInterval(sync,500)})();