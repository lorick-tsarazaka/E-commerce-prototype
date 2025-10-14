/* main.js */
async function fetchProducts(){
const res = await fetch('../assets/js/products.json');
const products = await res.json();
return products;
}


function updateCartCount(){
const cart = JSON.parse(localStorage.getItem('cart')||'[]');
document.getElementById('cart-count') && (document.getElementById('cart-count').innerText = cart.reduce((s,i)=>s+i.qty,0));
}


function createProductCard(p){
const col = document.createElement('div');
col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
col.innerHTML = `
<div class="card card-product shadow-sm">
<img src="${p.image||'../assets/img/placeholder.png'}" class="card-img-top" alt="${p.name}">
<div class="card-body border-top border-1 ">
<h5 class="product-title fs-6 fw-bold">${p.name}</h5>
<p class="text-muted mb-2 small">${p.category}</p>
<div class="d-flex justify-content-between align-items-center">
<div class="fs-5 fw-bold">${p.price.toFixed(2)} €</div>
<div>
<a href="product.html?id=${p.id}" class="btn btn-sm btn-outline-primary me-2">Voir</a>
<button class="btn btn-sm btn-primary" data-id="${p.id}">Ajouter</button>
</div>
</div>
</div>
</div>
`;
col.querySelector('button') .addEventListener('click', ()=> addToCart(p.id));
return col;
}


function saveCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); }


function addToCart(id){
const cart = JSON.parse(localStorage.getItem('cart')||'[]');
const existing = cart.find(i=>i.id===id);
if(existing) existing.qty += 1; else cart.push({id:id, qty:1});
saveCart(cart);
const btn = document.querySelector(`button[data-id='${id}']`);
if(btn){ btn.innerText = 'Ajouté'; setTimeout(()=>btn.innerText='Ajouter',800); }
}


// remplir liste produits
(async function(){
updateCartCount();
if(document.getElementById('products-row')){
const products = await fetchProducts();
const row = document.getElementById('products-row');
products.forEach(p=>row.appendChild(createProductCard(p)));
}


// page produit
if(document.getElementById('product-detail')){
const params = new URLSearchParams(location.search);
const id = params.get('id');
const products = await fetchProducts();
const p = products.find(x=>String(x.id)===String(id)) || products[0];
const container = document.getElementById('product-detail');
container.innerHTML = `
<div class="col-md-6">
<img src="${p.image||'../assets/img/placeholder.png'}" class="img-fluid shadow-sm rounded-3" alt="${p.name}">
</div>
<div class="col-md-6 d-flex flex-column justify-content-center">
<h2 class="fw-bold">${p.name}</h2>
<p class="text-muted">${p.category}</p>
<h3 class="text-primary">${p.price.toFixed(2)} €</h3>
<p>${p.description}</p>
<div>
<button id="add-btn" class="btn btn-primary">Ajouter au panier</button>
</div>
</div>
`;
document.getElementById('add-btn').addEventListener('click', ()=> addToCart(p.id));
}
})();


window.addEventListener('storage', updateCartCount);

window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
});
