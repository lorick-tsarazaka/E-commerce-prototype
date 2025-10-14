async function getProducts() {
  try {
    const res = await fetch('../assets/js/products.json');
    if (!res.ok) throw new Error('Erreur fetch produits');
    return await res.json();
  } catch (err) {
    console.error('Impossible de charger products.json:', err);
    return [];
  }
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const badge = document.getElementById('cart-count');
  const cart = getCart();
  const count = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  if (badge) badge.innerText = count;
  // Si tu veux une autre UI (header mobile...), tu peux ajouter ici.
}

function formatPrice(n) {
  // calcul fait chiffre par chiffre (Number -> toFixed)
  return Number(n).toFixed(2) + ' €';
}

async function renderCart() {
  const container = document.getElementById('cart-container');
  const checkoutBtn = document.getElementById('checkout-btn');
  if (!container) return;

  const cart = getCart();
  if (!cart.length) {
    container.innerHTML = `
      <div class="text-center py-5">
        <p class="lead">Votre panier est vide.</p>
        <a href="home.html" class="btn btn-primary">Retour aux produits</a>
      </div>`;
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    updateCartCount();
    return;
  }

  // Has items -> show checkout button
  if (checkoutBtn) checkoutBtn.style.display = '';

  const products = await getProducts();
  let total = 0;
  let html = '<div class="list-group">';

  cart.forEach(item => {
    const p = products.find(x => String(x.id) === String(item.id));
    if (!p) return; // ignore missing product
    const qty = Number(item.qty) || 1;
    const lineTotal = p.price * qty;
    total += lineTotal;

    html += `
      <div class="list-group-item d-flex align-items-center justify-content-between border border-0 border-bottom border-1 rounded-0 py-3">
        <div class="d-flex align-items-center">
          <img src="${p.image || '../assets/img/placeholder.png'}" style="width:100px;height:80px;object-fit:cover; border:  1px solid rgba(0,0,0,0.100) ; border-radius:8px" alt="${p.name}">
          <div class="ms-3">
            <div class="fw-bold">${p.name}</div>
            <div class="small text-muted">${formatPrice(p.price)}</div>
          </div>
        </div>
        <div class="d-flex align-items-center">
          <input type="number" min="1" value="${qty}" data-id="${item.id}" class="form-control form-control-sm me-3 cart-qty" style="width:80px">
          <div class="fw-bold me-3 line-total">${formatPrice(lineTotal)}</div>
          <button class="btn btn-sm btn-outline-danger btn-remove" data-id="${item.id}">Retirer</button>
        </div>
      </div>
    `;
  });

  html += `</div>
    <div class="mt-3 d-flex justify-content-between align-items-center">
      <div>
        <button id="clear-cart" class="btn btn-sm btn-outline-secondary">Vider le panier</button>
      </div>
      <div class="text-end">
        <h4>Total: <span id="cart-total">${formatPrice(total)}</span></h4>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // --- Event listeners ---

  // Quantity change
  container.querySelectorAll('.cart-qty').forEach(inp => {
    inp.addEventListener('change', (e) => {
      let v = parseInt(e.target.value, 10);
      if (isNaN(v) || v < 1) v = 1;
      e.target.value = v;

      const id = e.target.dataset.id;
      const cart = getCart();
      const it = cart.find(x => String(x.id) === String(id));
      if (!it) return;

      it.qty = v;
      setCart(cart); // saves and updates badge

      // update line total and grand total without refetching products.json
      const productsPromise = getProducts(); // safe to fetch again (small file)
      productsPromise.then(products => {
        const p = products.find(x => String(x.id) === String(id));
        if (!p) return;
        const newLineTotal = p.price * v;
        // update DOM line total
        const lineTotalEl = e.target.closest('.d-flex').querySelector('.line-total');
        if (lineTotalEl) lineTotalEl.innerText = formatPrice(newLineTotal);
        // recalc grand total quickly from DOM or from cart/products
        recalcGrandTotal(products);
      });
    });
  });

  // Remove item
  container.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      let cart = getCart();
      cart = cart.filter(i => String(i.id) !== String(id));
      setCart(cart);
      renderCart(); // rerender
    });
  });

  // Clear cart
  const clearBtn = document.getElementById('clear-cart');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Vider complètement le panier ?')) return;
      setCart([]);
      renderCart();
    });
  }

  // Checkout button (redirige vers checkout.html)
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      // si tu veux vérifier que le panier n'est pas vide :
      const currentCart = getCart();
      if (!currentCart.length) {
        e.preventDefault();
        alert('Votre panier est vide.');
        return;
      }
      // laisse le lien faire la navigation (checkout.html)
      // on pourrait aussi passer des infos via localStorage/sessionStorage si besoin
    });
  }

  // helper: recalc grand total from cart + products
  function recalcGrandTotal(productsList) {
    const cart = getCart();
    let newTotal = 0;
    cart.forEach(it => {
      const p = productsList.find(x => String(x.id) === String(it.id));
      if (!p) return;
      newTotal += (Number(it.qty) || 0) * p.price;
    });
    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.innerText = formatPrice(newTotal);
  }

  // initial updateCartCount
  updateCartCount();
}

// réagir aux changements de localStorage (autres onglets)
window.addEventListener('storage', (e) => {
  if (e.key === 'cart') {
    // si on est sur la page panier, rerender; sinon seulement mettre à jour le badge
    if (document.getElementById('cart-container')) renderCart();
    else updateCartCount();
  }
});

// initialisation
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCart();
});

