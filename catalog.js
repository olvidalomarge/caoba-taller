const $=s=>document.querySelector(s);
const money=n=>`$${n.toLocaleString('es-AR')}`;
const availability='Venta prevista para diciembre de 2026';
const products=[
{id:'ST-ORG',type:'stock',name:'Organizador alto',category:'Organización',price:295000,unit:'por unidad',image:'assets/organizador.webp',description:'Todo en su lugar, con un diseño que aprovecha el espacio.',dimensions:'180 cm alto × 50 cm ancho × 30 cm profundidad',finish:'Blanco, según imagen',detail:'Organizador vertical con puertas y estantes interiores. Una propuesta para sumar guardado a la cocina o a otros ambientes de la casa.',note:'Medidas indicadas en la imagen proporcionada por el taller. Materiales, entrega e instalación a confirmar.',modelLabel:'Ver organizador en 3D'},
{id:'ST-MDL',type:'stock',name:'Mesas de luz flotantes',category:'Dormitorio',price:180000,unit:'el par · 2 unidades',image:'assets/mesas-de-luz.webp',description:'Un detalle cálido para acompañar tus noches.',dimensions:'Medidas a confirmar con el taller',finish:'Tono madera, según imagen',detail:'Par de mesas de luz flotantes con cajón y espacio abierto de guardado. El precio publicado corresponde a las dos mesas.',note:'La imagen muestra una mesa del conjunto. Medidas, materiales, fijación, entrega e instalación a confirmar.',modelLabel:'Ver mesa de luz en 3D'}
];
const posts=[
['Dc4SXuamYD_','p','Cocina con alacenas en tono madera','Cocinas','2026-09-04'],
['DS8p9TDjeXq','p','Cocina en gris y madera','Cocinas','2025-12-31'],
['DZN-gf1Efcw','p','Cocina con guardado integrado','Cocinas','2026-06-05'],
['Dcg8CScIYxl','reel','Integración de cocina y heladera','Cocinas','2026-08-26'],
['DUtw79XEcrj','p','Cocina con isla','Cocinas','2026-02-13'],
['DZLvKsDNiOh','reel','Detalles e iluminación en cocina','Cocinas','2026-06-04'],
['DcggyNbRAV2','reel','Interior de guardado a medida','Guardado','2026-08-26'],
['DbZMixNxJu9','reel','En el taller','Taller','2026-07-29'],
['DZnsBwQog0F','reel','Cajones y organización interior','Guardado','2026-06-15'],
['DVrjXWyDZI7','p','Mueble con estantes iluminados','Guardado','2026-03-09'],
['DXzu1mExjJR','reel','Distribución interior a medida','Guardado','2026-05-01'],
['DX2NCN_R4U5','reel','Herrajes y detalles de guardado','Guardado','2026-05-02'],
['DXP_vlFDZCo','p','Panel de TV con listones','Living','2026-04-17'],
['DXQAdWBjWUv','p','Mesa de comedor','Comedor','2026-04-17'],
['DXLHcHkjdCA','p','Mostrador curvo','Comerciales','2026-04-15'],
['DWFG-KJEXsC','p','Cocina y barra en tono madera','Cocinas','2026-03-19']
];
const works=posts.map(([code,format,name,category,date])=>({id:`IG-${code}`,code,format,type:'work',name,category,date,image:`assets/trabajo-${code}.jpg`,url:`https://www.instagram.com/caoba_taller/${format}/${code}/`}));
const allItems=[...products,...works],findItem=id=>allItems.find(p=>p.id===id);
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{toast('No se pudo guardar en este navegador.')}}
let favorites=read('caoba-v2-favorites',[]);if(!Array.isArray(favorites))favorites=[];favorites=favorites.filter(id=>products.some(p=>p.id===id));
let selection=read('caoba-v2-project',[]);if(!Array.isArray(selection))selection=[];selection=selection.filter(id=>findItem(id));
let category='Todos',workCategory='Todos',showAllWorks=false,studioApi,studioPromise,deferredInstall;
let toastTimer;function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500)}
function openDialog(id){const d=$(id);if(!d.open)d.showModal()}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
function renderCategories(){const cats=['Todos',...new Set(products.map(p=>p.category))];$('.categories').innerHTML=cats.map(c=>`<button class="category ${c===category?'active':''}" aria-pressed="${c===category}" data-category="${c}">${c}</button>`).join('')}
$('.categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;renderCategories();renderProducts()}});
function normalize(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function renderProducts(){const q=normalize($('#search').value);const list=products.filter(p=>(category==='Todos'||p.category===category)&&(!$('#only-favorites').checked||favorites.includes(p.id))&&normalize(`${p.name} ${p.category} ${p.description}`).includes(q));$('#result-count').textContent=`${list.length} ${list.length===1?'producto':'productos'} · stock limitado · diciembre 2026`;$('#empty').hidden=!!list.length;$('#product-grid').innerHTML=list.map(p=>`<article class="product-card"><div class="product-image-wrap"><button class="product-image-button" data-product="${p.id}" aria-label="Ver ${p.name}"><img src="${p.image}" srcset="${p.image.replace('.webp','-600.webp')} 600w, ${p.image} 1280w" sizes="(min-width: 760px) 44vw, 90vw" alt="${p.name}, imagen proporcionada por Caoba" loading="lazy" decoding="async" width="1200" height="1600"></button><span class="product-badge">DICIEMBRE 2026</span><button class="favorite-button" aria-label="${favorites.includes(p.id)?'Quitar de':'Agregar a'} favoritos: ${p.name}" aria-pressed="${favorites.includes(p.id)}" data-favorite="${p.id}">${icon('heart')}</button>${p.modelLabel?`<button class="card-model" data-model="${p.id}" aria-label="${p.modelLabel}">${icon('cube')} Vista 3D</button>`:''}</div><p class="card-category">${p.category}</p><button class="card-title" data-product="${p.id}">${p.name}</button><p class="card-description">${p.description}</p><div class="stock-price"><strong>${money(p.price)}</strong><span>ARS · ${p.unit}</span></div><div class="card-bottom"><span>Stock limitado · Consultar disponibilidad</span><button data-product="${p.id}">Ver producto ${icon('layers')}</button></div></article>`).join('')}
$('#product-grid').addEventListener('click',e=>{const f=e.target.closest('[data-favorite]');if(f){const id=f.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save('caoba-v2-favorites',favorites);renderProducts();toast(favorites.includes(id)?'Guardado en favoritos':'Quitado de favoritos');return}const model=e.target.closest('[data-model]');if(model){openProductModel(model.dataset.model);return}const p=e.target.closest('[data-product]');if(p)showProduct(p.dataset.product)});
$('#search').addEventListener('input',renderProducts);$('#only-favorites').addEventListener('change',renderProducts);$('#clear-filters').addEventListener('click',()=>{category='Todos';$('#search').value='';$('#only-favorites').checked=false;renderCategories();renderProducts()});$('#mobile-favorites').addEventListener('click',()=>{$('#only-favorites').checked=true;category='Todos';$('#search').value='';renderCategories();renderProducts();$('#catalogo').scrollIntoView()});
function showProduct(id){const p=products.find(p=>p.id===id);if(!p)return;$('#product-detail').innerHTML=`<div class="detail-layout"><div class="detail-photo"><img src="${p.image}" alt="${p.name}"><span class="reference-label">Imagen proporcionada por Caoba</span></div><div class="detail-content"><p class="eyebrow">CATÁLOGO CON STOCK LIMITADO · ${p.id}</p><h2>${p.name}</h2><div class="stock-price"><strong>${money(p.price)}</strong><span>ARS · ${p.unit}</span></div><p>${p.detail}</p><p class="availability-note">${availability}<br><small>Consultá las unidades disponibles antes de comprar.</small></p><dl class="detail-specs"><div><dt>Medidas</dt><dd>${p.dimensions}</dd></div><div><dt>Terminación de la imagen</dt><dd>${p.finish}</dd></div><div><dt>Presentación</dt><dd>${p.unit}</dd></div><div><dt>Entrega e instalación</dt><dd>A confirmar con el taller</dd></div></dl><button class="button green" id="detail-add">${icon('message')} Consultar disponibilidad</button>${p.modelLabel?`<button class="button outlined" id="detail-model">${icon('cube')} ${p.modelLabel}</button>`:''}${p.id==='ST-ORG'?`<button class="ar-entry" data-open-ar>${icon('cube')} Ver en mi espacio</button>`:''}<button class="button outlined" id="detail-share">${icon('share')} Compartir producto</button><p class="detail-note">${p.note} Agregar a tu consulta no reserva stock ni confirma una compra.</p></div></div>`;$('#detail-add').addEventListener('click',()=>{addItem(p.id);$('#product-dialog').close();showSelection()});$('#detail-model')?.addEventListener('click',()=>{$('#product-dialog').close();openProductModel(id)});$('#detail-share').addEventListener('click',()=>shareText(`${p.name} · Caoba\n${money(p.price)} ARS — ${p.unit}\n${availability}. Disponibilidad a confirmar.\n${location.origin}${location.pathname}#producto=${p.id}`));openDialog('#product-dialog')}
function renderWorks(){const cats=['Todos','Cocinas','Guardado','Living','Comedor','Comerciales','Taller'];$('#work-categories').innerHTML=cats.map(c=>`<button class="category ${c===workCategory?'active':''}" aria-pressed="${c===workCategory}" data-work-category="${c}">${c}</button>`).join('');const matches=works.filter(w=>workCategory==='Todos'||w.category===workCategory);const visible=showAllWorks?matches:matches.slice(0,6);$('#work-count').textContent=`${matches.length} publicaciones del taller`;$('#works-grid').innerHTML=visible.map(w=>`<article class="work-card"><button class="work-photo" data-work="${w.id}" aria-label="Ver ${w.name}"><img src="${w.image}" alt="${w.name}, trabajo de Caoba publicado en Instagram" loading="lazy" decoding="async" width="640" height="640"><span class="work-format">${icon(w.format==='reel'?'rotate':'layers')} ${w.format==='reel'?'Reel':'Fotos'}</span></button><p class="card-category">${w.category} · HECHO A PEDIDO</p><button class="work-title" data-work="${w.id}">${w.name}</button><div class="work-actions"><button data-work-consult="${w.id}">Quiero algo similar ${icon('message')}</button><a href="${w.url}" target="_blank" rel="noopener noreferrer" aria-label="Ver publicación original: ${w.name}">${icon('instagram')}</a></div></article>`).join('');$('#more-works').hidden=showAllWorks||matches.length<=6;document.dispatchEvent(new Event('caoba:render'))}
$('#work-categories').addEventListener('click',e=>{const b=e.target.closest('[data-work-category]');if(b){workCategory=b.dataset.workCategory;showAllWorks=false;renderWorks()}});$('#more-works').addEventListener('click',()=>{showAllWorks=true;renderWorks()});$('#works-grid').addEventListener('click',e=>{const c=e.target.closest('[data-work-consult]');if(c){addItem(c.dataset.workConsult);showSelection();return}const b=e.target.closest('[data-work]');if(b)showWork(b.dataset.work)});
function showWork(id){const w=works.find(w=>w.id===id);if(!w)return;$('#work-detail').innerHTML=`<div class="work-detail-photo"><img src="${w.image}" alt="${w.name}"></div><div class="work-detail-copy"><p class="eyebrow">TRABAJO REALIZADO · ${w.category}</p><h2>${w.name}</h2><p>Proyecto realizado por encargo, según las medidas y necesidades de cada cliente. Este trabajo no forma parte del stock en venta.</p><p>Si te gusta este estilo, podemos conversar sobre un diseño adaptado a tu espacio. Materiales, medidas, precio y plazos se cotizan para cada proyecto.</p><a href="${w.url}" class="button outlined" target="_blank" rel="noopener noreferrer">${icon('instagram')} ${w.format==='reel'?'Ver reel original':'Ver fotos en Instagram'}</a><button id="work-consult" class="button green">${icon('message')} Consultar por algo similar</button></div>`;$('#work-consult').addEventListener('click',()=>{addItem(id);$('#work-dialog').close();showSelection()});openDialog('#work-dialog')}
function updateCounts(){document.querySelectorAll('.count').forEach(e=>e.textContent=selection.length)}
function addItem(id){if(!findItem(id))return;if(selection.includes(id)){toast('Ya está en tu consulta');return}selection.push(id);save('caoba-v2-project',selection);updateCounts();toast('Sumado a tu consulta')}
function showSelection(){renderSelection();openDialog('#project-dialog')}
function renderSelection(){$('#project-items').innerHTML=selection.length?selection.map((id,i)=>{const p=findItem(id);return `<div class="project-item"><img src="${p.image}" alt="${p.name}"><div><h3>${p.name}</h3><p>${p.type==='stock'?`${money(p.price)} ARS · ${p.unit}`:'Referencia para proyecto a medida · A cotizar'}</p><p>${p.type==='stock'?'Diciembre 2026 · Consultar stock':'Trabajo realizado · Sin stock'}</p></div><button class="remove-item" data-remove="${i}" aria-label="Quitar ${p.name}">Quitar</button></div>`}).join(''):'<div class="project-empty">Todavía no elegiste productos o referencias. Podés consultar por un mueble del catálogo o contarnos tu idea a medida.</div>';updateMessage()}
$('#project-items').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){selection.splice(Number(b.dataset.remove),1);save('caoba-v2-project',selection);updateCounts();renderSelection()}});document.querySelectorAll('[data-action=selection]').forEach(b=>b.addEventListener('click',showSelection));
function quoteText(){const f=$('#quote-form');let t='¡Hola, Caoba! Me gustaría hacer una consulta.';if(f.elements.name.value.trim())t+=`\nMi nombre es ${f.elements.name.value.trim()}.`;if(f.elements.city.value.trim())t+=`\nLocalidad: ${f.elements.city.value.trim()}.`;const stock=selection.map(findItem).filter(p=>p.type==='stock'),custom=selection.map(findItem).filter(p=>p.type==='work');if(stock.length){t+='\n\nProductos del catálogo (venta prevista para diciembre de 2026):';for(const p of stock)t+=`\n• ${p.name} (${p.id}): ${money(p.price)} ARS — ${p.unit}.`;t+='\nQuisiera confirmar disponibilidad, entrega e instalación. Entiendo que esta consulta no reserva unidades.'}if(custom.length){t+='\n\nReferencias para un trabajo a medida (a cotizar, sin stock):';for(const p of custom)t+=`\n• ${p.name}\n${p.url}`;t+='\nMe gustaría algo similar, adaptado a mi espacio.'}if(f.elements.notes.value.trim())t+=`\n\nMi idea: ${f.elements.notes.value.trim()}`;if(!selection.length)t+='\nQuisiera conversar sobre un mueble a medida.';return t}
function updateMessage(){$('#message-preview').value=quoteText()}$('#quote-form').addEventListener('input',updateMessage);$('#quote-form').addEventListener('submit',e=>e.preventDefault());
async function copyText(text){try{await navigator.clipboard.writeText(text);toast('Consulta copiada. Podés pegarla en tu conversación.')}catch{if($('#message-preview').value===text){$('#message-preview').focus();$('#message-preview').select();toast('Seleccionamos el mensaje para que puedas copiarlo.')}else{toast('No se pudo copiar el enlace. Probá desde el menú Compartir del navegador.')}}}
async function shareText(text){if(navigator.share){try{await navigator.share({title:'Caoba · Muebles y proyectos',text})}catch(e){if(e.name!=='AbortError')await copyText(text)}}else await copyText(text)}$('#copy-quote').addEventListener('click',()=>copyText(quoteText()));$('#share-quote').addEventListener('click',()=>shareText(quoteText()));
async function openStudio(){openDialog('#studio-dialog');if(!studioPromise){studioPromise=import('./organizer.js').then(m=>m.createStudio({canvas:$('#model-canvas'),state:()=>({open:$('#doors-open').checked})})).then(api=>{studioApi=api;$('#model-loading').hidden=true;api.resize();return api}).catch(()=>{studioPromise=null;$('#model-loading').textContent='No se pudo iniciar el modelo 3D. Probá con un navegador compatible con WebGL.'})}else studioApi?.resize()}
$('#doors-open').addEventListener('change',()=>studioApi?.update());$('#rotate-model').addEventListener('click',()=>studioApi?.rotate());$('#zoom-in').addEventListener('click',()=>studioApi?.zoom(.8));$('#zoom-out').addEventListener('click',()=>studioApi?.zoom(1.25));$('#reset-camera').addEventListener('click',()=>studioApi?.reset());$('#add-model').addEventListener('click',()=>{addItem('ST-ORG');$('#studio-dialog').close();showSelection()});

const modelChooser = $('#model-chooser');
const modelChoices = $('#model-choices');
$('#estudio').addEventListener('click', () => {
  if (!modelChoices.childElementCount) {
    modelChoices.innerHTML = products.filter(product => product.modelLabel).map(product => `
      <button class="model-choice" type="button" data-model="${product.id}">
        <img src="${product.image.replace('.webp', '-600.webp')}" alt="" width="80" height="92">
        <span><strong>${product.name}</strong><span>Ver en 3D</span></span>
        ${icon('cube')}
      </button>`).join('');
  }
  openDialog('#model-chooser');
});
modelChoices.addEventListener('click', event => {
  const choice = event.target.closest('[data-model]');
  if (!choice) return;
  modelChooser.close();
  openProductModel(choice.dataset.model);
});

let nightstandPromise, nightstandApi;
function openProductModel(id) {
  if (id !== 'ST-MDL') { openStudio(); return; }
  openDialog('#nightstand-dialog');
  if (nightstandApi) { nightstandApi.resize(); return; }
  const status = $('#nightstand-loading');
  status.textContent = 'Preparando la mesa de luz…';
  nightstandPromise ??= Promise.all([import('./organizer.js'), import('./nightstand-model.js')])
    .then(([{ createStudio }, { createNightstandModel }]) => {
      nightstandApi = createStudio({
        canvas: $('#nightstand-canvas'),
        state: () => ({ open: $('#nightstand-drawer').checked }),
        createModel: createNightstandModel,
        view: { position: [2.5, 1.82, 3.95], targetHeight: 0.5, minDistance: 1.8, maxDistance: 7, floating: true }
      });
      status.hidden = true;
    })
    .catch(() => {
      nightstandPromise = undefined;
      status.textContent = 'No se pudo cargar la mesa de luz en 3D. Volvé a abrir la vista o consultá la foto del producto.';
    });
}
$('#nightstand-drawer').addEventListener('change', () => nightstandApi?.update());
const nightstandControls = {
  rotate: api => api.rotate(),
  in: api => api.zoom(.8),
  out: api => api.zoom(1.25),
  reset: api => api.reset()
};
document.querySelectorAll('[data-nightstand-control]').forEach(button => {
  button.addEventListener('click', () => {
    if (nightstandApi) nightstandControls[button.dataset.nightstandControl](nightstandApi);
  });
});
$('#nightstand-consult').addEventListener('click', () => {
  addItem('ST-MDL');
  $('#nightstand-dialog').close();
  showSelection();
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#install-button').textContent='Instalar Caoba'});$('#install-button').addEventListener('click',async()=>{if(deferredInstall){await deferredInstall.prompt();deferredInstall=null}else openDialog('#info-dialog')});$('#year').textContent=new Date().getFullYear();
function routeProduct(){const m=location.hash.match(/^#producto=(ST-ORG|ST-MDL)$/);if(m)showProduct(m[1])}window.addEventListener('hashchange',routeProduct);renderCategories();renderProducts();renderWorks();updateCounts();routeProduct();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});


