/* script.js — jQuery-based logic for Adema's Beauty Shop */
(function($){
  "use strict";

  // LocalStorage keys
  const USERS_KEY = 'adema_users';
  const CURRENT_KEY = 'adema_current';
  const THEME_KEY = 'adema_theme';
  const CART_PREFIX = 'adema_cart_';
  const RATING_PREFIX = 'adema_rating_';

  $(function(){
    createSideMenuIfMissing();
    bindMenuToggle();
    populateSideMenuUser();
    bindThemeButtons();
    initProgress();
    initLazyLoad();
    initAuthModal();
    restoreTheme();
    initFooterClock();
    bindBuyButtons();
    initRatingRender();
    initCatalogApi();
    restoreSearchInput();
    initAccordions();
    initProfilePage();
  });

  /* ---------- Helpers ---------- */
  function getUsers(){ return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
  function saveUsers(o){ localStorage.setItem(USERS_KEY, JSON.stringify(o)); }
  function getUser(nick){ const u = getUsers(); return u[nick] || null; }
  function setUser(u){ const all=getUsers(); all[u.nick]=u; saveUsers(all); }
  function setCurrent(nick){ localStorage.setItem(CURRENT_KEY, nick); populateSideMenuUser(); updateCartBadge(); }
  function getCurrent(){ return localStorage.getItem(CURRENT_KEY) || null; }
  function logout(){ localStorage.removeItem(CURRENT_KEY); populateSideMenuUser(); updateCartBadge(); showToast('Logged out',1000); }

  function setTheme(light){
    if(light) $('html').addClass('light-theme');
    else $('html').removeClass('light-theme');
    localStorage.setItem(THEME_KEY, light ? 'light' : 'dark');
  }
  function restoreTheme(){
    const t = localStorage.getItem(THEME_KEY);
    if(t==='light') $('html').addClass('light-theme'); else $('html').removeClass('light-theme');
  }
  function showToast(text, ms=1400){
    let $t = $('#globalToast');
    if(!$t.length){ $('body').append('<div id="globalToast" class="toast"></div>'); $t=$('#globalToast'); }
    $t.stop(true,true).text(text).fadeIn(120).delay(ms).fadeOut(220);
  }

  /* ---------- Side menu ---------- */
  function createSideMenuIfMissing(){
    if($('#sideMenu').length) return;
    const html = `
      <aside id="sideMenu" class="side-menu" aria-hidden="true">
        <div class="profile-section">
          <div class="profile-pic" id="sideAvatar">👤</div>
          <div class="profile-info">
            <p id="sideName">Guest</p>
            <button id="sideAuthBtn">Log in / Sign up</button>
          </div>
          <button id="sideClose" style="margin-left:auto;background:transparent;border:none;color:var(--muted);cursor:pointer">✕</button>
        </div>
        <nav class="menu-links" aria-label="Main menu">
          <a href="index.html">Home</a>
          <a href="catalog.html">Catalog</a>
          <a href="brands.html">Brands</a>
          <button id="themeToggle" aria-pressed="false">🌙/☀️</button>
          <div class="cities"><p>Cities:</p>
            <div class="city-item">Astana</div>
            <div class="city-item">Almaty</div>
            <div class="city-item">Shymkent</div>
            <div class="city-item">Ust-Kamenogorsk</div>
          </div>
        </nav>
        <div class="side-bottom">
          <div>Cart: <span id="sideCartCount">0</span> 🛒</div>
          <div id="sideDateTime"></div>
          <div style="margin-top:6px"><button id="sideLogoutBtn" class="ghost-btn hidden">Logout</button></div>
        </div>
      </aside>`;
    $('body').append(html);
  }

  function bindMenuToggle(){
    $(document).on('click', '.menu-icon, #menuToggle', function(){ 
      $('#sideMenu').toggleClass('open').attr('aria-hidden', $('#sideMenu').hasClass('open') ? 'false' : 'true'); 
      populateSideMenuUser(); 
    });
    $(document).on('click','#sideClose', function(){ $('#sideMenu').removeClass('open').attr('aria-hidden','true'); });
    $(document).on('keydown', function(e){ if(e.key==='Escape') $('#sideMenu').removeClass('open').attr('aria-hidden','true'); });
  }

  function populateSideMenuUser(){
    const nick = getCurrent();
    if(nick){
      const u = getUser(nick);
      $('#sideName').text(u ? u.nick : nick);
      $('#sideAvatar').text(u ? u.nick[0].toUpperCase() : 'U');
      $('#sideAuthBtn').text('Open profile').off('click').on('click', ()=> window.location.href='profile.html');
      $('#sideLogoutBtn').removeClass('hidden').off('click').on('click', ()=>{ logout(); $('#sideLogoutBtn').addClass('hidden'); });
    } else {
      $('#sideName').text('Guest');
      $('#sideAvatar').text('👤');
      $('#sideAuthBtn').text('Log in / Sign up').off('click').on('click', ()=> openAuthModal('login'));
      $('#sideLogoutBtn').addClass('hidden');
    }
    updateCartBadge();
  }

  $(document).ready(function () {

   const $menu = $(".nav-menu");
   const $overlay = $("#menuOverlay");
   const $toggle = $("#menuToggle");

   // Открыть меню
   $toggle.on("click", function () {
     $menu.addClass("open");
     $overlay.addClass("show");
    });

   // Закрыть меню при клике на overlay
   $overlay.on("click", function () {
     $menu.removeClass("open");
     $overlay.removeClass("show");
   });

   // Закрыть меню при клике на ссылку
   $(".nav-menu a").on("click", function () {
     $menu.removeClass("open");
     $overlay.removeClass("show");
   });

  });


  /* ---------- Theme ---------- */
  function bindThemeButtons(){
    $(document).on('click', '#themeToggle', function(){ 
      const isLight = $('html').hasClass('light-theme'); 
      setTheme(!isLight); 
      showToast(!isLight ? 'Light theme' : 'Dark theme'); 
    });
    $(document).on('click', '#sideMenu .city-item', function(){ showToast('City: '+$(this).text()); });
  }

  /* ---------- Progress ---------- */
  function initProgress(){
    $(window).on('scroll resize', function(){ 
      const h = $(document).height() - $(window).height(); 
      const pct = h>0 ? ($(window).scrollTop()/h)*100 : 0; 
      $('#progressBar').css('width', pct + '%'); 
    });
  }

  /* ---------- Lazy load ---------- */
  function initLazyLoad(){ 
    function lazy(){ 
      $('img.lazy').each(function(){ 
        const $img=$(this); 
        if($img.attr('data-src') && isInViewport($img,200)){
          $img.attr('src',$img.attr('data-src')).removeAttr('data-src').removeClass('lazy'); 
        } 
      }); 
    } 
    $(window).on('scroll resize load', lazy); lazy(); 
  }
  function isInViewport($el, offset=0){ 
    if(!$el||!$el.length) return false; 
    const rect = $el[0].getBoundingClientRect(); 
    return rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset; 
  }

  /* ---------- Auth modal ---------- */
  function initAuthModal(){
    if($('#authOverlay').length===0){
      $('body').append('<div id="authOverlay" class="modal-overlay" style="display:none"><div class="modal"><div id="authInner"></div></div></div>');
    }
    $(document).on('click', '#sideAuthBtn', function(){ openAuthModal('login'); });
  }

  function openAuthModal(mode='login'){
    const html = authHtml(mode);
    $('#authInner').html(html);
    $('#authOverlay').fadeIn(160).show();
    bindAuthModalEvents();
  }
  function closeAuthModal(){ $('#authOverlay').fadeOut(120).hide(); $('#authInner').empty(); }

  function authHtml(mode){
    if(mode==='signup'){
      return `
        <h2>Create account</h2>
        <form id="modalSignupForm">
          <label>Nick<input id="m_su_nick" class="form-input"></label><div id="m_su_nick_err" class="error"></div>
          <label>Full name<input id="m_su_name" class="form-input"></label><div id="m_su_name_err" class="error"></div>
          <label>Phone<input id="m_su_phone" class="form-input" placeholder="+7XXXXXXXXXX"></label><div id="m_su_phone_err" class="error"></div>
          <label>Email<input id="m_su_email" class="form-input" type="email"></label><div id="m_su_email_err" class="error"></div>
          <label>Password<input id="m_su_pass" class="form-input" type="password"></label><div id="m_su_pass_err" class="error"></div>
          <div style="margin-top:10px;display:flex;gap:8px"><button type="submit" class="btn-primary">Create</button> <button type="button" id="m_cancel" class="ghost-btn">Cancel</button></div>
          <p class="small" style="margin-top:8px">Already have account? <span id="m_to_login" style="cursor:pointer;color:var(--accent)">Login</span></p>
        </form>`;
    } else {
      return `
        <h2>Log in</h2>
        <form id="modalLoginForm">
          <label>Nick<input id="m_li_nick" class="form-input"></label><div id="m_li_nick_err" class="error"></div>
          <label>Password<input id="m_li_pass" class="form-input" type="password"></label><div id="m_li_pass_err" class="error"></div>
          <div style="margin-top:10px;display:flex;gap:8px"><button type="submit" class="btn-primary">Login</button> <button type="button" id="m_cancel" class="ghost-btn">Cancel</button></div>
          <p class="small" style="margin-top:8px">No account? <span id="m_to_signup" style="cursor:pointer;color:var(--accent)">Sign up</span></p>
        </form>`;
    }
  }

  function bindAuthModalEvents(){
    $('#m_cancel').on('click', closeAuthModal);
    $('#m_to_signup').on('click', function(){ $('#authInner').html(authHtml('signup')); bindAuthModalEvents(); });
    $('#m_to_login').on('click', function(){ $('#authInner').html(authHtml('login')); bindAuthModalEvents(); });

    $('#modalLoginForm').on('submit', function(e){
      e.preventDefault();
      const nick = $('#m_li_nick').val().trim();
      const pass = $('#m_li_pass').val();
      $('#m_li_nick_err,#m_li_pass_err').text('');
      if(!nick){ $('#m_li_nick_err').text('Enter nick'); return; }
      if(!pass){ $('#m_li_pass_err').text('Enter password'); return; }
      const u = getUser(nick);
      if(!u || u.pass !== pass){ $('#m_li_pass_err').text('Invalid nick or password'); return; }
      setCurrent(nick);
      closeAuthModal();
      showToast('Logged in');
      setTimeout(()=> window.location.href='profile.html',300);
    });

    $('#modalSignupForm').on('submit', function(e){
      e.preventDefault();
      const nick = $('#m_su_nick').val().trim();
      const name = $('#m_su_name').val().trim();
      const phone = $('#m_su_phone').val().trim();
      const email = $('#m_su_email').val().trim();
      const pass = $('#m_su_pass').val();
      $('#m_su_nick_err,#m_su_name_err,#m_su_phone_err,#m_su_email_err,#m_su_pass_err').text('');
      let ok=true;
      if(!nick){ $('#m_su_nick_err').text('Enter nick'); ok=false; }
      if(!name){ $('#m_su_name_err').text('Enter full name'); ok=false; }
      if(!/^\+7\d{10}$/.test(phone)){ $('#m_su_phone_err').text('Phone must start with +7 and contain 11 digits'); ok=false; }
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ $('#m_su_email_err').text('Invalid email'); ok=false; }
      if(!pass || pass.length<6){ $('#m_su_pass_err').text('Password min 6 chars'); ok=false; }
      if(getUser(nick)){ $('#m_su_nick_err').text('Nick taken'); ok=false; }
      if(!ok) return;
      setUser({nick,name,phone,email,pass});
      setCurrent(nick);
      closeAuthModal();
      showToast('Account created');
      setTimeout(()=> window.location.href='profile.html',300);
    });
  }

  /* ---------- Footer clock ---------- */
  function initFooterClock(){ 
    setInterval(()=>{
      const s=new Date().toLocaleString();
      $('#sideDateTime').text(s);
      $('#datetimeFooter').text(s);
    },1000); 
  }

  /* ---------- Cart / Buy ---------- */
  function bindBuyButtons(){
    $(document).on('click', '.buy', function(){
      const id = $(this).data('id') || $(this).closest('.product-card').data('id') || $(this).closest('.product-card').find('h3,h2').first().text().trim();
      const nick = getCurrent();
      if(!nick){ openAuthModal('login'); showToast('Please login to buy'); return; }
      addToCart(nick,id);
      playBuySound();
      showToast('Added to cart 🛒');
      updateCartBadge();
    });
    updateCartBadge();
  }

  function addToCart(nick,id){
    const key = CART_PREFIX + nick;
    let cart = JSON.parse(localStorage.getItem(key)||'{}');
    cart[id] = (cart[id]||0)+1;
    localStorage.setItem(key, JSON.stringify(cart));
  }

  function getCartCount(nick){
    const key = CART_PREFIX + nick;
    const cart = JSON.parse(localStorage.getItem(key)||'{}');
    return Object.values(cart).reduce((a,b)=>a+b,0);
  }

  function updateCartBadge(){
    const nick = getCurrent();
    const count = nick ? getCartCount(nick) : 0;
    $('#sideCartCount').text(count);
    $('.cart-badge').remove();
    $('.main-header').append(`<span class="cart-badge" style="margin-left:10px">🛒${count}</span>`);
  }

  function copyCode() {
   const code = document.getElementById("promoCode").innerText;
   navigator.clipboard.writeText(code);
  }

  function playBuySound(){
    try{
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type='sine'; o.frequency.value=880; g.gain.value=0.1;
      o.connect(g); g.connect(ctx.destination); o.start();
      setTimeout(()=>{ o.frequency.value=540; g.gain.value=0.1; },80);
      setTimeout(()=>{ o.stop(); ctx.close(); },260);
    }catch(e){}
  }

  /* ---------- Rating ---------- */
  function initRatingRender(){
    $('.product-card').each(function(){
      const $c=$(this);
      const pid = $c.data('id') || $c.find('h3,h2').first().text().trim();
      const val = Number(localStorage.getItem(RATING_PREFIX + encodeURIComponent(pid)) || 0);
      renderRating($c,val);
    });
    $(document).on('click','.rating .star', function(){
      const $s=$(this); const $card=$s.closest('.product-card');
      const pid = $card.data('id') || $card.find('h3,h2').first().text().trim();
      const val = Number($s.data('value')||0);
      localStorage.setItem(RATING_PREFIX + encodeURIComponent(pid), String(val));
      renderRating($card,val);
      showToast('Rating saved');
    });
  }

  function renderRating($card,val){
    $card.find('.rating .star').each(function(){
      const v = Number($(this).data('value')||0);
      if(v<=val) $(this).addClass('active').text('★'); else $(this).removeClass('active').text('☆');
    });
    $card.find('.rating .value').text((val||0) + '/5');
  }

  /* ---------- Catalog API ---------- */
  function initCatalogApi(){
    const $grid = $('#catalogGrid'); if(!$grid.length) return;
    $.getJSON('https://makeup-api.herokuapp.com/api/v1/products.json?product_type=lipstick')
      .done(function(data){
        data = data.slice(0,6);
        data.forEach(function(p,i){
          const id = 'api_' + (p.id||i);
          const img = p.image_link||'';
          const title = p.name||'Product ' + (i+1);
          const brand = p.brand||'';
          const price = p.price ? p.price + ' USD':'—';
          const card = $(`
            <div class="product-card" data-id="${escapeHtml(id)}">
              <img class="lazy" data-src="${escapeHtml(img)}" alt="${escapeHtml(title)}">
              <h3>${escapeHtml(title)}</h3>
              <p class="small">${escapeHtml(brand)}</p>
              <div class="price">${escapeHtml(price)}</div>
              <div class="rating" aria-label="rating">
                <span class="star" data-value="1">☆</span>
                <span class="star" data-value="2">☆</span>
                <span class="star" data-value="3">☆</span>
                <span class="star" data-value="4">☆</span>
                <span class="star" data-value="5">☆</span>
                <span class="value small">0/5</span>
              </div>
              <div style="display:flex;gap:8px;margin-top:8px">
                <button class="buy btn-primary" data-id="${escapeHtml(id)}">Buy</button>
              </div>
            </div>
          `);
          $grid.append(card);
        });
        initRatingRender(); initLazyLoad();
      });
  }

  function escapeHtml(text){ return text.replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]; }); }

  /* ---------- Search input ---------- */
  function restoreSearchInput(){ const q = localStorage.getItem('search_query')||''; $('#searchInput').val(q); }

  /* ---------- Accordions ---------- */
  function initAccordions(){
  $(document).on('click', '.accordion-button', function(){
    const $btn = $(this);
    const $panel = $btn.next('.accordion-panel');

    // переключаем aria-expanded
    const expanded = $btn.attr('aria-expanded') === 'true';
    $btn.attr('aria-expanded', !expanded);

    // плавно раскрываем/сворачиваем
    if(!expanded){
      // раскрытие
      $panel.css({
        'max-height': $panel.prop('scrollHeight') + 'px',
        'padding-top': '8px',
        'padding-bottom': '8px'
      });
    } else {
      // сворачивание
      $panel.css({
        'max-height': '0',
        'padding-top': '0',
        'padding-bottom': '0'
      });
    }
  });
 }

  /* ---------- Profile page ---------- */
  function initProfilePage(){
    if(!$('#profilePage').length) return;
    const nick = getCurrent();
    if(!nick){ window.location.href='index.html'; return; }
    const user = getUser(nick);
    if(user){
      $('#profileNick').text(user.nick);
      $('#profileName').text(user.name);
      $('#profilePhone').text(user.phone);
      $('#profileEmail').text(user.email);
      $('#profileAvatar').text(user.nick[0].toUpperCase());
    }
    // Cart
    const cartKey = CART_PREFIX + nick;
    const cart = JSON.parse(localStorage.getItem(cartKey)||'{}');
    const cartCount = Object.values(cart).reduce((a,b)=>a+b,0);
    $('#profileCartCount').text(cartCount);
    $('#clearCartBtn').on('click',function(){ localStorage.removeItem(cartKey); $('#profileCartCount').text(0); showToast('Cart cleared'); });
    $('#logoutBtn').on('click',function(){ logout(); window.location.href='index.html'; });
  }

})(jQuery);