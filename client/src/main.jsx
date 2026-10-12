import React, { Component, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, ShieldCheck, Truck, CreditCard, MessageCircle, Eye, Star, ArrowLeft, FileText, Users } from "lucide-react";
import "./styles.css";

const API = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");

function readCart() {
  try {
    const value = JSON.parse(window.localStorage.getItem("cart") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("DDCS UI error:", error);
  }
  render() {
    if (this.state.failed) {
      return <main className="errorPage">
        <h1>We’re fixing a display issue</h1>
        <p>Please reload the store. Your saved cart is kept where possible.</p>
        <button onClick={() => window.location.reload()}>Reload store</button>
      </main>;
    }
    return this.props.children;
  }
}

function App() {
  const [products, setProducts] = useState([]);
  const starterProducts = [["Income Certificate Assistance","Government Services","Guidance on the Uttar Pradesh income certificate application process and supporting documents.",60,"Supporting document checklist"],["Caste Certificate Assistance","Government Services","Guidance on the Uttar Pradesh caste certificate application process and official application channel.",60,"Supporting document checklist"],["Domicile Certificate","Government Services","Guidance on the Uttar Pradesh domicile certificate application process and supporting documents.",80,"Supporting document checklist"],["PAN Card Application Assistance","Identity Services","Help understanding PAN application steps and required documents.",100,"Document checklist"],["Voter ID Assistance","Identity Services","Guidance for voter registration and correction requests through official channels.",80,"Application guidance"],["Ayushman Card Assistance","Government Services","Guidance on eligibility checks and official Ayushman card application steps.",50,"Eligibility guidance"],["Ration Card Assistance","Government Services","Support with understanding ration card application and correction steps.",100,"Document checklist"],["Birth Certificate Guidance","Government Services","Information about the appropriate local authority and supporting records.",100,"Application guidance"],["Income Certificate Renewal Help","Government Services","Guidance for renewal and checking the appropriate application channel.",50,"Renewal checklist"],["Scholarship Form Assistance","Student Services","Help understanding scholarship forms, eligibility details and required documents.",100,"Form checklist"],["Job Application Assistance","Career Services","Support with online job application forms and document preparation.",100,"Application support"],["Exam Form Assistance","Student Services","Guidance for online examination forms and common document requirements.",80,"Form checklist"],["Online Form Filling","Digital Services","Assistance with online forms and accurate document entry.",50,"Form filling support"],["Printing & Scanning Service","Computer Services","Document printing, scanning and digital file preparation.",10,"Print and scan service"],["Resume & Typing Service","Computer Services","Typing and resume formatting support for study and job applications.",100,"Formatting support"]].map((p,i)=>({ _id:"ddcs-starter-"+(i+1), slug:"ddcs-starter-"+(i+1), name:p[0], category:p[1], description:p[2], price:p[3], views:0, inquiries:0, reviewCount:0, rating:0, offers:[p[4]], service:false, starterCatalog:true }));
  const [cart, setCart] = useState(readCart);
  const [q, setQ] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [siteStats, setSiteStats] = useState({ totalVisits: 0, totalReviews: 0, averageRating: 0, products: 0 });
  const [menu, setMenu] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [message, setMessage] = useState("");
  const [productsError, setProductsError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [otpCode, setOtpCode] = useState("");
  const [authForm, setAuthForm] = useState({name:"",email:"",password:""});
  const [account, setAccount] = useState(() => { try { return JSON.parse(window.localStorage.getItem("ddcs_user") || "null"); } catch { return null; } });
  const [accountToken, setAccountToken] = useState(() => { try { return window.localStorage.getItem("ddcs_token") || ""; } catch { return ""; } });
  const [accountBusy, setAccountBusy] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({name:"",phone:"",note:""});
  const [inquiryBusy, setInquiryBusy] = useState(false);
  const [contactForm, setContactForm] = useState({name:"",phone:"",email:"",service:"",message:""});
  const [contactBusy, setContactBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const response = await fetch(API + "/products");
        if (!response.ok) throw new Error("Products API returned " + response.status);
        const data = await response.json();
        const rawList = Array.isArray(data) ? data : (Array.isArray(data.products) ? data.products : []);
        const normalized = rawList.map(item => /domicil(e)? certificate/i.test(String(item.name||"")) ? {...item, name:"Domicile Certificate", price:80, service:false, offers:["Supporting document checklist","Guidance on the Uttar Pradesh application process"]} : item);
        const names = new Set(normalized.map(item=>String(item.name||"").trim().toLowerCase()));
        const list = [...normalized, ...starterProducts.filter(item=>!names.has(item.name.toLowerCase()))];
        if (active) {
          setProducts(list);
          setProductsError(false);
        }
      } catch (error) {
        console.error("Could not load products:", error);
        if (active) {
          setProducts([]);
          setProductsError(true);
        }
      }
    }
    loadProducts();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadPublicStats() {
      try {
        const response = await fetch(API + "/public/stats");
        if (response.ok && active) setSiteStats(await response.json());
      } catch (error) { console.warn("Public statistics unavailable:", error); }
    }
    loadPublicStats();
    try {
      if (!window.sessionStorage.getItem("ddcs_visit_counted")) {
        window.sessionStorage.setItem("ddcs_visit_counted", "1");
        fetch(API + "/metrics/visit", { method: "POST" })
          .then(response => response.ok ? response.json() : null)
          .then(data => { if (active && data) setSiteStats(current => ({ ...current, totalVisits: Number(data.totalVisits || current.totalVisits) })); })
          .catch(error => console.warn("Visit counter unavailable:", error));
      }
    } catch (error) { console.warn("Session storage unavailable for visit counter:", error); }
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.warn("Cart could not be saved locally:", error);
    }
  }, [cart]);

  const add = p => setCart(current => {
    const existing = current.find(i => i._id === p._id);
    return existing
      ? current.map(i => i._id === p._id ? { ...i, qty: (Number(i.qty) || 0) + 1 } : i)
      : [...current, { ...p, qty: 1 }];
  });


  useEffect(() => {
    if (!checkout) return;
    const containerId = "paypal-container-YMS9RP3FG6E78";
    let cancelled = false;
    const renderHostedButton = () => {
      if (cancelled || !window.paypal?.HostedButtons) return;
      const container = document.getElementById(containerId);
      if (!container || container.dataset.rendered === "true") return;
      container.dataset.rendered = "true";
      window.paypal.HostedButtons({ hostedButtonId: "YMS9RP3FG6E78" })
        .render("#" + containerId)
        .catch(error => {
          console.error("PayPal Hosted Button failed to render:", error);
          container.dataset.rendered = "false";
          container.textContent = "PayPal checkout is temporarily unavailable. Please try again.";
        });
    };
    const scriptUrl = "https://www.paypal.com/sdk/js?client-id=BAASv9QQOifkaqyK1MaN7OjNUwi9iTpiC4oIUeYuQnAq-ec96XSjxEtpS6UcmgB___h1vaqA0ihiLGonmg&components=hosted-buttons&disable-funding=venmo&currency=USD";
    let script = document.querySelector('script[data-ddcs-paypal-sdk="true"]');
    const showLoadError = () => {
      const container = document.getElementById(containerId);
      if (container) container.textContent = "PayPal checkout could not load. Please refresh and try again.";
    };
    if (window.paypal?.HostedButtons) {
      renderHostedButton();
    } else if (!script) {
      script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.ddcsPaypalSdk = "true";
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        renderHostedButton();
      }, { once: true });
      script.addEventListener("error", showLoadError, { once: true });
      document.body.appendChild(script);
    } else if (script.dataset.loaded === "true") {
      showLoadError();
    } else {
      script.addEventListener("load", renderHostedButton, { once: true });
      script.addEventListener("error", showLoadError, { once: true });
    }
    return () => { cancelled = true; };
  }, [checkout]);

  async function submitAuth(event) {
    event.preventDefault();
    setAccountBusy(true);
    try {
      const response = await fetch(API + (authMode === "register" ? "/auth/register" : "/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ name: authForm.name.trim(), email: authForm.email.trim().toLowerCase(), password: authForm.password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || (response.status === 404 ? "Authentication API route not found. The deployment may still be updating." : "Sign-in failed (HTTP " + response.status + ")."));
      if (!data.token || !data.user) throw new Error("The server response was incomplete. Please try again.");
      try {
        window.localStorage.setItem("ddcs_token", data.token);
        window.localStorage.setItem("ddcs_user", JSON.stringify(data.user));
      } catch (storageError) {
        console.warn("Session storage unavailable:", storageError);
      }
      setAccountToken(data.token);
      setAccount(data.user);
      setAccountOpen(false);
      setMessage(authMode === "register" ? "Account created successfully." : "Signed in successfully.");
      setAuthForm({name:"",email:"",password:""});
    } catch (error) {
      console.error("DDCS authentication error:", error);
      setMessage(error.message || "Unable to sign in. Please check your connection and try again.");
    } finally { setAccountBusy(false); }
  }
  async function submitOtp(event) {
    event.preventDefault();
    setAccountBusy(true);
    const email = authForm.email.trim().toLowerCase();
    try {
      const endpoint = authMode === "otp-verify" ? "/auth/otp/verify" : "/auth/otp/request";
      const response = await fetch(API + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, name: authForm.name.trim(), code: otpCode.trim() })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Email code request failed. Please try again.");
      if (authMode !== "otp-verify") {
        setAuthMode("otp-verify");
        setMessage(data.message || "Check your email for the six-digit code.");
        return;
      }
      if (!data.token || !data.user) throw new Error("The server response was incomplete. Please try again.");
      try {
        window.localStorage.setItem("ddcs_token", data.token);
        window.localStorage.setItem("ddcs_user", JSON.stringify(data.user));
      } catch (storageError) { console.warn("Session storage unavailable:", storageError); }
      setAccountToken(data.token);
      setAccount(data.user);
      setAccountOpen(false);
      setOtpCode("");
      setAuthForm({name:"",email:"",password:""});
      setMessage("Signed in with email verification.");
    } catch (error) {
      setMessage(error.message || "Email OTP sign-in failed. Please try again.");
    } finally { setAccountBusy(false); }
  }

  function signOut() {
    try { window.localStorage.removeItem("ddcs_token"); window.localStorage.removeItem("ddcs_user"); } catch {}
    setAccountToken(""); setAccount(null); setMessage("You have signed out.");
  }
  const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
  const normalizedQuery = q.trim().toLowerCase();
  const categories = [...new Set(products.map(p => String(p.category || "Digital Services").trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  const matchesSearch = (text, query = normalizedQuery) => { const tokens = String(query || "").toLowerCase().split(/\s+/).filter(Boolean); const haystack = String(text || "").toLowerCase(); return tokens.length > 0 && tokens.every(token => haystack.includes(token)); };
  const filteredProducts = products.filter(p => {
    const searchable = [
      p.name, p.category, p.description, ...(Array.isArray(p.offers) ? p.offers : []),
      p.slug, p.service ? "service assistance apply request form" : "product buy purchase",
      Number(p.rating) > 0 ? "rated reviews customer rating" : "not yet rated"
    ].join(" ").toLowerCase();
    return (!normalizedQuery || matchesSearch(searchable)) &&
      (categoryFilter === "all" || String(p.category || "Digital Services") === categoryFilter);
  }).sort((a,b) => {
    if (sortBy === "price-low") return Number(a.price || 0) - Number(b.price || 0);
    if (sortBy === "price-high") return Number(b.price || 0) - Number(a.price || 0);
    if (sortBy === "rating") return (Number(b.reviewCount) > 0 ? Number(b.rating || 0) : 0) - (Number(a.reviewCount) > 0 ? Number(a.rating || 0) : 0);
    if (sortBy === "popular") return Number(b.views || 0) - Number(a.views || 0);
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  });
  const sectionTargets = [
    { id: "home", title: "Home & Hero", keywords: "home homepage hero banner welcome start" },
    { id: "ddcs-about", title: "About DDCS", keywords: "about studio company who we are aim mission purpose" },
    { id: "ddcs-trust", title: "Features & Trust", keywords: "features trust why choose us secure support delivery aim values" },
    { id: "products", title: "Products & Services", keywords: "products services catalog shop store price buy purchase filter" },
    { id: "ddcs-gallery", title: "Gallery & Offers", keywords: "gallery images photos offers promotion deals posters" },
    { id: "ddcs-reviews", title: "Reviews & Ratings", keywords: "reviews review ratings stars feedback customer trust rating" },
    { id: "ddcs-contact", title: "Contact & Enquiry", keywords: "contact enquiry form phone whatsapp support request" },
    { id: "ddcs-cta", title: "Get Started", keywords: "get started call now contact us apply request start today" },
    { id: "support", title: "Footer & Support", keywords: "footer address phone email support links" }
  ];
  const sectionMatches = normalizedQuery ? sectionTargets.filter(item => matchesSearch(item.title + " " + item.keywords)) : [];
  function runSearch(term = q) {
    const value = String(term || "").trim().toLowerCase();
    setSearchOpen(false);
    if (!value) { setShowCatalog(true); window.setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }), 40); return; }
    const section = sectionTargets.find(item => matchesSearch(item.title + " " + item.keywords, value));
    const productMatch = products.some(p => matchesSearch([p.name,p.category,p.description,p.slug,...(p.offers||[])].join(" "), value));
    if (section && section.id !== "products" && !productMatch) {
      setShowCatalog(false);
      setSelectedProduct(null);
      window.setTimeout(() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      return;
    }
    setShowCatalog(true);
    window.setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function openProduct(p) {
    setSelectedProduct(p);
    window.history.replaceState(null, "", "#service-" + encodeURIComponent(p.slug || p._id || "details"));
    fetch(API + "/products/" + encodeURIComponent(p.slug || p._id) + "/view", {method:"POST"})
      .then(r => r.ok ? r.json() : null)
      .then(data => { if(data) setSelectedProduct(current => current ? {...current,views:data.views}:current); })
      .catch(error => console.warn("View count unavailable:",error));
    window.scrollTo({top:0,behavior:"smooth"});
  }
  async function submitInquiry(event) {
    event.preventDefault();
    if(!selectedProduct)return;
    setInquiryBusy(true);
    try {
      const response=await fetch(API+"/products/"+encodeURIComponent(selectedProduct.slug||selectedProduct._id)+"/inquiry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(inquiryForm)});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.message||"Could not submit enquiry.");
      setSelectedProduct(current=>current?{...current,inquiries:data.inquiries}:current);
      setInquiryForm({name:"",phone:"",note:""});
      setMessage(data.message||"Enquiry received.");
    } catch(error){setMessage(error.message||"Could not submit enquiry.");}
    finally{setInquiryBusy(false);}
  }


  async function submitContact(event) {
    event.preventDefault(); setContactBusy(true);
    try {
      const response=await fetch(API+"/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(contactForm)});
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.message||"Could not send your message.");
      setContactForm({name:"",phone:"",email:"",service:"",message:""});
      setMessage(data.message||"Thank you! Your enquiry has been received.");
    } catch(error) { setMessage(error.message||"Could not send your message. Please call us."); }
    finally { setContactBusy(false); }
  }

  return <>
    <header>
      <div className="top">🚀 Free delivery on orders over ₹999 • Secure checkout</div>
      <nav>
        <a className="brandMark" href="#home" aria-label="Deepak Digital Computer Studio home"><span className="brandIcon"><span className="pixelGrid"><i></i><i></i><i></i><i></i><i></i><i></i></span><b>D</b><em></em></span><span className="brandWords"><strong><span>Deepak</span> <i>Digital</i></strong><small>Computer Studio</small></span></a>
        <button className="icon" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? <X /> : <Menu />}</button>
        <div className={"links " + (menu ? "open" : "")}><a href="#home" onClick={() => { setShowCatalog(false); setSelectedProduct(null); setMenu(false); }}>Home</a><a href="#products" onClick={e => { e.preventDefault(); setShowCatalog(true); setSelectedProduct(null); setMenu(false); setQ(""); setCategoryFilter("all"); setSortBy("featured"); setSearchOpen(false); window.setTimeout(() => document.getElementById("products")?.scrollIntoView({behavior:"smooth",block:"start"}), 80); }}>Products</a><a href="#ddcs-about" onClick={() => setMenu(false)}>About</a><a href="#ddcs-gallery" onClick={() => setMenu(false)}>Gallery</a><a href="#support" onClick={() => setMenu(false)}>Support</a></div>
        <div className="search searchShell">
          <Search size={18} />
          <form className="searchForm" onSubmit={e => { e.preventDefault(); runSearch(); }}>
            <input value={q} onFocus={() => setSearchOpen(true)} onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)} onChange={e => { setQ(e.target.value); setSearchOpen(true); if (e.target.value.trim()) { setShowCatalog(true); setSelectedProduct(null); } }} onKeyDown={e => { if(e.key === "Escape") setSearchOpen(false); }} placeholder="Search pages, sections & products..." aria-label="Search pages, sections and products" autoComplete="off" />
          </form>
          {searchOpen && normalizedQuery && <div className="searchResults" role="listbox" aria-label="Search suggestions">
            {sectionMatches.slice(0,4).map(item => <button type="button" className="searchResult" key={item.id} onMouseDown={e=>e.preventDefault()} onClick={() => runSearch(item.title)}><span><b>{item.title}</b><small>Section</small></span><span aria-hidden="true">↗</span></button>)}
            {products.filter(p => matchesSearch([p.name,p.category,p.description,p.slug,...(p.offers||[])].join(" "))).slice(0,5).map(p => <button type="button" className="searchResult" key={p._id||p.slug||p.name} onMouseDown={e=>e.preventDefault()} onClick={() => { setShowCatalog(true); setSelectedProduct(null); setCategoryFilter("all"); setSortBy("featured"); setSearchOpen(false); setQ(p.name); window.setTimeout(() => document.getElementById("products")?.scrollIntoView({behavior:"smooth"}), 40); }}><span><b>{p.name}</b><small>{p.category || "Product"}</small></span><span aria-hidden="true">↗</span></button>)}
            {!sectionMatches.length && !products.some(p => matchesSearch([p.name,p.category,p.description,p.slug,...(p.offers||[])].join(" "))) && <div className="searchEmpty">No matching page, section or product yet.</div>}
            <button type="button" className="searchAll" onClick={() => runSearch()}>Search all results →</button>
          </div>}
        </div>
        <button className="icon accountButton" onClick={() => setAccountOpen(true)} aria-label="Open account">{account ? "My account" : "Sign in"}</button><button className="cart" onClick={() => setCheckout(true)} aria-label="Open cart"><ShoppingCart /><span>{cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0)}</span></button>
      </nav>
    </header>
    <section className="brandSlider" aria-label="Deepak Digital Computer Studio featured banners">
      <div className="brandSlideTrack">
        <article className="brandSlide slideEnglish">
          <div className="slideCopy"><span className="slideEyebrow">YOUR LOCAL DIGITAL SERVICE CENTRE</span><h1>Deepak Digital<br/><em>Computer Studio</em></h1><p>Digital Services • Computer Solutions • Customer Support</p><a href="#products" className="slideCta">Explore Services <span>→</span></a></div>
          <div className="slideVisual" aria-hidden="true"><div className="monitor"><div className="screenGlow">D<span>▦</span></div><div className="monitorStand"></div></div><div className="tower"></div><div className="keyboard"></div><div className="slideOrbit"></div></div>
        </article>
        <article className="brandSlide slideHindi">
          <div className="slideCopy"><span className="slideEyebrow">आपकी डिजिटल सेवा का भरोसेमंद साथी</span><h1>दीपक डिजिटल<br/><em>कम्प्यूटर स्टूडियो</em></h1><p>डिजिटल सेवाएँ • कम्प्यूटर समाधान • ग्राहक सहायता</p><a href="#products" className="slideCta">सेवाएँ देखें <span>→</span></a></div>
          <div className="slideVisual" aria-hidden="true"><div className="serviceCircle"><span>▤</span><span>▣</span><span>⌘</span><span>◎</span><span>♧</span></div><div className="monitor"><div className="screenGlow">D<span>▦</span></div><div className="monitorStand"></div></div><div className="tower"></div></div>
        </article>
      </div>
      <div className="sliderControls"><span className="sliderLabel"><i></i> DIGITAL SERVICES • COMPUTER SOLUTIONS</span><div className="sliderDots"><button className="active" aria-label="Slide 1" onClick={() => document.querySelector(".brandSlider")?.classList.remove("showHindi")}></button><button aria-label="Slide 2" onClick={() => document.querySelector(".brandSlider")?.classList.add("showHindi")}></button></div></div>
    </section>
    <section className="hero" id="home">
      <div><p className="eyebrow">DEEPAK DIGITAL COMPUTER STUDIO</p><h1>Tech that works as hard as you do.</h1><p>Computers, accessories and smart tech — curated for work, gaming and everyday productivity.</p><button onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>Shop now →</button></div>
      <div className="heroCard"><ShieldCheck size={42} /><h3>Trusted checkout</h3><p>Secure payments, order tracking and automated confirmations.</p></div>
    </section>
    <div className="features"><div><Truck />Fast delivery</div><div><CreditCard />Secure payments</div><div><MessageCircle />WhatsApp-ready support</div></div>
    <section className="ddcsAbout" id="ddcs-about">
      <div className="sectionHead"><div><p className="eyebrow">ABOUT OUR STUDIO</p><h2>Digital help, made simpler</h2><p>Deepak Digital Computer Studio supports everyday digital needs, online form guidance, computer services and customer assistance.</p></div></div>
      <div className="aboutGrid">
        <article className="aboutCard"><span className="aboutIcon">◎</span><h3>Who we are</h3><p>A local digital service studio helping customers navigate online services and computer-related needs.</p></article>
        <article className="aboutCard"><span className="aboutIcon">✦</span><h3>Our aim</h3><p>Make digital tasks easier to understand with clear guidance, practical support and transparent next steps.</p></article>
        <article className="aboutCard"><span className="aboutIcon">✓</span><h3>Our promise</h3><p>Respect customer information, explain service requirements and confirm charges before a request proceeds.</p></article>
      </div>
    </section>
    <section className="ddcsTrust" id="ddcs-trust">
      <div className="sectionHead"><div><p className="eyebrow">FEATURES & TRUST</p><h2>Support you can understand</h2><p>Clear information, convenient contact options and real catalogue statistics.</p></div></div>
      <div className="trustGrid">
        <article className="trustCard"><ShieldCheck /><h3>Transparent service</h3><p>Check the details and ask us to confirm the current requirements and charges.</p></article>
        <article className="trustCard"><MessageCircle /><h3>Direct assistance</h3><p>Use the enquiry form, phone or WhatsApp to tell us what you need.</p></article>
        <article className="trustCard"><Eye /><h3>Real catalogue activity</h3><p>Views, enquiries and ratings are displayed only when the system has recorded them.</p></article>
      </div>
      <div className="trustStats" aria-label="DDCS site statistics">
        <div><strong>{Number(siteStats.totalVisits||0).toLocaleString("en-IN")}</strong><span>Site visits</span></div>
        <div><strong>{Number(siteStats.products||products.length||0).toLocaleString("en-IN")}</strong><span>Products & services</span></div>
        <div><strong>{Number(siteStats.totalReviews||0).toLocaleString("en-IN")}</strong><span>Recorded reviews</span></div>
        <div><strong>{Number(siteStats.totalReviews||0) ? Number(siteStats.averageRating||0).toFixed(1)+" / 5" : "Not rated"}</strong><span>Average rating</span></div>
      </div>
    </section>
    {selectedProduct ? <main className="serviceDetail" id="service-detail">
      <button className="backToProducts" onClick={()=>{setSelectedProduct(null);window.history.replaceState(null,"",window.location.pathname);}}><ArrowLeft size={18}/> Back to services</button>
      <div className="detailLayout">
        <div className="detailImageWrap"><img className="detailImage" src={selectedProduct.image||""} alt={selectedProduct.name} onError={e=>{e.currentTarget.style.visibility="hidden";}}/><span className="detailCategory">{selectedProduct.category||"Digital Service"}</span></div>
        <div className="detailInfo"><span className="eyebrow">DEEPAK DIGITAL COMPUTER STUDIO</span><h1>{selectedProduct.name}</h1>
          <div className="ratingLine"><span className="stars">{Number(selectedProduct.reviewCount)>0 ? "★★★★★" : "Not yet rated"}</span>{Number(selectedProduct.reviewCount)>0 && <><b>{Number(selectedProduct.rating||0).toFixed(1)}/5</b><span>({Number(selectedProduct.reviewCount)} reviews)</span></>}</div>
          <div className="detailPrice">{selectedProduct.service ? <span className="servicePrice">Contact for service charges</span> : money(selectedProduct.price)} {Number(selectedProduct.discountPercent)>0&&<><span className="oldPrice">{money(Number(selectedProduct.price)/(1-Number(selectedProduct.discountPercent)/100))}</span><span className="discountBadge">{selectedProduct.discountPercent}% OFF</span></>}</div>
          <p className="detailDescription">{selectedProduct.description||"Professional assistance from Deepak Digital Computer Studio. Contact our team to confirm eligibility, required documents, service charges and expected timelines."}</p>
          <div className="detailStats"><span><Eye size={17}/> {Number(selectedProduct.views||0).toLocaleString("en-IN")} views</span><span><Users size={17}/> {Number(selectedProduct.inquiries||0).toLocaleString("en-IN")} enquiries</span></div>
          <div className="offerPanel"><b>Available offers</b>{(selectedProduct.offers?.length?selectedProduct.offers:["Get assistance with application steps and document checklist","Contact our service desk to confirm current service charges","Support with next steps and application guidance"]).map((offer,i)=><p key={i}>✓ {offer}</p>)}</div>
          <div className="detailActions"><button onClick={()=>{add(selectedProduct);setCheckout(true);setMessage("Selected "+selectedProduct.name+". Complete payment using the PayPal button in checkout.")}}><CreditCard size={18}/> Buy with PayPal</button><button className="secondaryAction" onClick={()=>document.getElementById("service-enquiry")?.scrollIntoView({behavior:"smooth",block:"center"})}><FileText size={18}/> Online form / Enquiry</button></div>
        </div>
      </div>
      <section className="detailBelow"><div><h2>Service details and information</h2><p>{selectedProduct.description||"Our team can help you understand the process and prepare the information needed before submitting a request."}</p><h3>How it works</h3><ol><li>Review the service information and document checklist.</li><li>Submit the enquiry form with your contact details.</li><li>Our team contacts you to confirm charges and next steps.</li></ol><h3>Before you apply</h3><p>Requirements and official approval timelines can vary. Confirm current requirements with the relevant government portal or authorised service centre. An enquiry does not guarantee issuance of a government certificate.</p></div>
      <form id="service-enquiry" className="enquiryCard" onSubmit={submitInquiry}><h2>Request this service</h2><p>Leave your details for a follow-up.</p><label>Your name<input required minLength="2" maxLength="100" value={inquiryForm.name} onChange={e=>setInquiryForm({...inquiryForm,name:e.target.value})} placeholder="Full name"/></label><label>Mobile / contact number<input required maxLength="25" inputMode="tel" value={inquiryForm.phone} onChange={e=>setInquiryForm({...inquiryForm,phone:e.target.value})} placeholder="Contact number"/></label><label>What do you need?<textarea maxLength="1000" value={inquiryForm.note} onChange={e=>setInquiryForm({...inquiryForm,note:e.target.value})} placeholder="Optional questions"/></label><button className="pay" disabled={inquiryBusy}>{inquiryBusy?"Submitting…":"Submit enquiry"}</button></form></section>
    </main> : showCatalog ? <main id="products">
      <div className="sectionHead catalogHeading"><div><p className="eyebrow">SHOP & DIGITAL SERVICES</p><h2>Products and online services</h2><p>Search by name, keyword, category, description or offer.</p></div><span>{filteredProducts.length} results</span></div>
      <div className="catalogControls">
        <label>Category <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">All categories</option>{categories.map(category=><option key={category} value={category}>{category}</option>)}</select></label>
        <label>Sort by <select value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="featured">Featured</option><option value="popular">Most viewed</option><option value="rating">Top rating</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
        <button type="button" className="catalogReset" onClick={()=>{setQ("");setCategoryFilter("all");setSortBy("featured");}}>Clear filters</button>
      </div>
      {productsError&&<p role="status">We couldn’t load the catalogue right now. Please try again shortly.</p>}
      {!productsError&&products.length===0&&<p>Products and services will appear here when the catalog is available.</p>}
      <section className="homeFeatured" id="home-products"><div className="sectionHead"><div><p className="eyebrow">QUICK PICKS</p><h2>Featured services</h2><p>Popular services at a glance. Explore all products below.</p></div><a className="slideCta" href="#products">View all products →</a></div><div className="grid homeProductGrid">{filteredProducts.slice(0,4).map(p=><article className="card serviceCard" key={"featured-"+(p._id||p.name)}><div className="featuredIcon">✦</div><small>{p.category||"Digital Service"}</small><h3>{p.name||"Product"}</h3><p className="desc">{p.description||"Learn about this service, required documents and how to apply."}</p><div className="cardPrice">{p.service?<span className="servicePrice">Contact for charges</span>:money(p.price)}</div><div className="cardActions"><button onClick={()=>openProduct(p)}>View details</button><button className="secondaryAction" onClick={()=>{window.open("https://forms.gle/RVsTMhm8KeYZneLN9","_blank","noopener,noreferrer")}}>Apply online</button></div></article>)}</div></section><div className="grid">{filteredProducts.map(p=>{
        const discount=Number(p.discountPercent)||(Number(p.compareAt)>Number(p.price)&&Number(p.compareAt)>0?Math.round((1-Number(p.price)/Number(p.compareAt))*100):0);
        const oldPrice=Number(p.compareAt)>Number(p.price)?Number(p.compareAt):(discount>0?Number(p.price)/(1-discount/100):0);
        return <article className="card serviceCard" key={p._id||p.name}>
          <button className="productImageButton" onClick={()=>openProduct(p)} aria-label={"View "+p.name}><img src={p.image||""} alt={p.name||"Service"} loading="lazy" onError={e=>{e.currentTarget.style.visibility="hidden";}}/><span className="imageLabel">View details ↗</span>{discount>0&&<span className="cardDiscount">{discount}% OFF</span>}</button>
          <small>{/domicil(e)? certificate/i.test(String(p.name||"")) ? "Government Services" : (p.category||"Digital Service")}</small><h3>{p.name||"Product"}</h3><p className="desc">{/domicil(e)? certificate/i.test(String(p.name||"")) ? "Guidance on the Uttar Pradesh domicile certificate application process, common supporting documents and the appropriate official application channel." : (p.description||"Learn about this service, required documents and how to apply.")}</p>
          <div className="ratingLine"><span className={"stars "+(Number(p.reviewCount)>0?"starsRated":"starsInvite")} aria-label={Number(p.reviewCount)>0 ? "Customer rating" : "No customer rating yet"}>{Number(p.reviewCount)>0 ? "★★★★★" : "☆☆☆☆☆"}</span>{Number(p.reviewCount)===0&&<span className="ratingInvite">Be the first to review</span>}{Number(p.reviewCount)>0 && <><b>{Number(p.rating||0).toFixed(1)}</b><span>({Number(p.reviewCount)} reviews)</span></>}</div>
          <div className="cardPrice">{p.service ? <span className="servicePrice">Contact for charges</span> : money(p.price)} {oldPrice>Number(p.price)&&<span className="oldPrice">{money(oldPrice)}</span>}</div>
          <div className="cardStats"><span><Eye size={15}/> {Number(p.views||0).toLocaleString("en-IN")} views</span><span><Users size={15}/> {Number(p.inquiries||0).toLocaleString("en-IN")} enquiries</span></div>
          <div className="offerMini"><b>Offers · {(/domicil(e)? certificate/i.test(String(p.name||"")) ? 2 : (p.offers?.length||1))}</b><span>{p.offers?.[0]||"Ask us about current offers and service charges."}</span>{/domicil(e)? certificate/i.test(String(p.name||""))&&<span>✓ Uttar Pradesh application guidance</span>}</div>
          <div className="cardActions"><button onClick={()=>{add(p);setCheckout(true);setMessage("Selected "+p.name+". Complete payment using the PayPal button in checkout.")}}><CreditCard size={16}/> Buy with PayPal</button><button className="secondaryAction" onClick={()=>{window.open("https://forms.gle/RVsTMhm8KeYZneLN9","_blank","noopener,noreferrer")}}>Apply/Request</button></div>
        </article>;
      })}</div>
    </main> : null}

    <section className="ddcsAdditions" id="ddcs-gallery"><div className="sectionHead"><div><p className="eyebrow">DEALS & PROMOTIONS</p><h2>Offers Gallery</h2><p>Explore our current service offers and studio promotions.</p></div></div>
      <div className="sectionHead"><div><p className="eyebrow">OUR STUDIO</p><h2>Deepak Digital Computer Studio</h2></div></div>
      <div className="studioPromo"><div><span className="eyebrow">आपकी सेवा, हमारा विश्वास</span><h2>आपका अपना डिजिटल सेवा केंद्र</h2><p>सरकारी ऑनलाइन फॉर्म, जॉब एप्लीकेशन, प्रमाणपत्र सहायता, प्रिंटिंग, स्कैनिंग और अन्य डिजिटल सेवाएँ।</p><a className="slideCta" href="https://forms.gle/RVsTMhm8KeYZneLN9" target="_blank" rel="noreferrer">Online Form भरें →</a><a className="slideCta" href="#ddcs-contact">आज ही संपर्क करें →</a></div><div className="promoOffer"><b>3 in 1 फॉर्म ऑनलाइन</b><strong>₹220</strong><span>आय प्रमाण पत्र • जाति प्रमाण पत्र • निवास प्रमाण पत्र</span><small>पहले ₹300 — सीमित समय का ऑफर</small></div></div>
      <div className="ddcsGallerySlider" aria-label="DDCS gallery slider">
        <div className="ddcsGalleryTrack">
          <article className="ddcsGallerySlide"><img src="/assets/gallery/ddcs-service-center.webp" alt="Deepak Digital Computer Studio digital service centre poster" loading="lazy" /><div className="gallerySlideCaption"><b>हमारी डिजिटल सेवाएँ</b><span>Online Forms • Printing • Computer Services</span></div></article>
          <article className="ddcsGallerySlide"><img src="/assets/gallery/ddcs-festival-offer.webp" alt="DDCS festival offer for income, caste and domicile certificates" loading="lazy" /><div className="gallerySlideCaption"><b>स्पेशल 3-in-1 ऑफर</b><span>Income • Caste • Domicile Certificate</span></div></article>
          <article className="ddcsGallerySlide"><img src="/assets/gallery/ddcs-homepage-banner-1.webp" alt="Deepak Digital Computer Studio homepage services banner" loading="lazy" /><div className="gallerySlideCaption"><b>आपकी सेवा, हमारा विश्वास</b><span>Digital Services • Computer Solutions • Customer Support</span></div></article>
          <article className="ddcsGallerySlide"><img src="/assets/gallery/ddcs-homepage-banner-2.webp" alt="DDCS computer and digital service promotional banner" loading="lazy" /><div className="gallerySlideCaption"><b>आपका अपना डिजिटल सेवा केंद्र</b><span>तेज़ सेवा • सही जानकारी • ग्राहक सहायता</span></div></article>
          <article className="ddcsGallerySlide ddcsPortraitSlide"><img src="/assets/gallery/ddcs-profile.webp" alt="Deepak Digital Computer Studio profile portrait" loading="lazy" /><div className="gallerySlideCaption"><b>Deepak Digital Computer Studio</b><span>आपके शहर में — आपकी सुविधा के लिए हमेशा तैयार</span></div></article>
        </div>
        <div className="ddcsGalleryControls"><button type="button" className="galleryPrev" aria-label="Previous gallery image" onClick={e=>{const track=e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack");track.scrollBy({left:-track.clientWidth,behavior:"smooth"});}}>‹</button><div className="gallerySlideDots" aria-label="Gallery slide indicators"><button type="button" aria-label="Show slide 1" onClick={e=>e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack").scrollTo({left:0,behavior:"smooth"})}></button><button type="button" aria-label="Show slide 2" onClick={e=>e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack").scrollTo({left:e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack").clientWidth,behavior:"smooth"})}></button><button type="button" aria-label="Show slide 3" onClick={e=>e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack").scrollTo({left:e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack").clientWidth*2,behavior:"smooth"})}></button><button type="button" aria-label="Show slide 4" onClick={e=>e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack").scrollTo({left:e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack").clientWidth*3,behavior:"smooth"})}></button><button type="button" aria-label="Show slide 5" onClick={e=>e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack").scrollTo({left:e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack").clientWidth*4,behavior:"smooth"})}></button></div><button type="button" className="galleryNext" aria-label="Next gallery image" onClick={e=>{const track=e.currentTarget.closest(".ddcsGallerySlider").querySelector(".ddcsGalleryTrack");track.scrollBy({left:track.clientWidth,behavior:"smooth"});}}>›</button></div>
      </div>
    </section>
    <section className="ddcsAdditions" id="ddcs-reviews"><div className="sectionHead"><div><p className="eyebrow">CUSTOMER TRUST</p><h2>Customer Reviews</h2><p>आपका feedback हमारे लिए महत्वपूर्ण है। Google पर अपने अनुभव को साझा करें।</p></div></div><div className="reviewCta">{Number(siteStats.totalReviews||0)>0 ? <div className="reviewStars">{"★".repeat(Math.min(5,Math.round(Number(siteStats.averageRating)||0)))} <span>{Number(siteStats.averageRating||0).toFixed(1)} / 5 · {Number(siteStats.totalReviews).toLocaleString("en-IN")} reviews</span></div> : <div className="reviewStars">No verified ratings yet</div>}<h3>क्या आपने हमारी सेवा ली?</h3><p>अपना वास्तविक अनुभव Google पर साझा करके दूसरे ग्राहकों की मदद करें।</p><a className="slideCta" href="https://maps.app.goo.gl/U3JLNwZChQ8uniLu8" target="_blank" rel="noreferrer">Write a Google Review ↗</a><a href="https://maps.app.goo.gl/U3JLNwZChQ8uniLu8" target="_blank" rel="noreferrer">Google Maps पर studio देखें</a></div></section>
    <section className="ddcsAdditions" id="ddcs-contact"><div className="sectionHead"><div><p className="eyebrow">WE’RE HERE TO HELP</p><h2>Contact & Enquiry</h2><p>अपनी जरूरत बताएं — हमारी टीम आपसे संपर्क करेगी।</p></div></div><div className="contactGrid"><div className="contactDetails"><h3>Deepak Digital Computer Studio</h3><p><b>Phone:</b> <a href="tel:9794210366">9794210366</a> · <a href="tel:9506288216">9506288216</a></p><p><b>Address:</b> Tahsil Gate, Near Patanjali Shop, Nighasan, Lakhimpur Kheri, Uttar Pradesh – 262903</p><p><a href="https://wa.me/919794210366" target="_blank" rel="noreferrer">WhatsApp पर संपर्क करें →</a></p><a className="mapLink" href="https://maps.app.goo.gl/U3JLNwZChQ8uniLu8" target="_blank" rel="noreferrer">📍 Open exact Google Maps location</a><p><a className="mapLink" href="https://forms.gle/RVsTMhm8KeYZneLN9" target="_blank" rel="noreferrer">📝 Open official Google enquiry form</a></p><iframe title="Deepak Digital Computer Studio map" src="https://maps.google.com/maps?q=Tahsil%20Gate%20near%20Patanjali%20Shop%20Nighasan%20Lakhimpur%20Kheri%20UP%20262903&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe></div><form className="enquiryCard contactForm" onSubmit={submitContact}><h3>Send an enquiry</h3><label>Full name<input required minLength="2" maxLength="100" value={contactForm.name} onChange={e=>setContactForm({...contactForm,name:e.target.value})} placeholder="Your name"/></label><label>Mobile number<input required type="tel" inputMode="tel" maxLength="25" value={contactForm.phone} onChange={e=>setContactForm({...contactForm,phone:e.target.value})} placeholder="Your mobile number"/></label><label>Email (optional)<input type="email" maxLength="254" value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})} placeholder="you@example.com"/></label><label>Service required<select value={contactForm.service} onChange={e=>setContactForm({...contactForm,service:e.target.value})}><option value="">Choose a service</option><option>Income / Caste / Domicile Certificate</option><option>Government online form</option><option>Job application</option><option>Aadhaar / PAN / Voter services</option><option>Printing / Scanning / DTP</option><option>Other digital service</option></select></label><label>Message<textarea required maxLength="1500" value={contactForm.message} onChange={e=>setContactForm({...contactForm,message:e.target.value})} placeholder="Tell us what you need"/></label><button className="pay" disabled={contactBusy}>{contactBusy?"Sending…":"Submit enquiry"}</button><small>Details are submitted securely to our website enquiry system. Do not include passwords or OTPs.</small></form></div></section>

    <section className="ddcsFinalCta" id="ddcs-cta">
      <div><p className="eyebrow">NEED A HAND?</p><h2>Let’s make your next digital task easier.</h2><p>Tell us what you need and our team will help you understand the next steps.</p></div>
      <div className="ctaActions"><a className="slideCta" href="#ddcs-contact">Send an enquiry →</a><a className="slideCta" href="https://forms.gle/RVsTMhm8KeYZneLN9" target="_blank" rel="noreferrer">Apply / Request →</a><a className="ctaPhone" href="tel:9794210366">Call 9794210366</a></div>
    </section>

    <footer id="support"><div><a className="brandMark footerBrand" href="#home" aria-label="Deepak Digital Computer Studio home"><span className="brandIcon"><span className="pixelGrid"><i></i><i></i><i></i><i></i><i></i><i></i></span><b>D</b><em></em></span><span className="brandWords"><strong><span>Deepak</span> <i>Digital</i></strong><small>Computer Studio</small></span></a><p>Deepak Digital Computer Studio — modern commerce for local technology retail.</p></div><div><b>Integrations</b><p>MongoDB • Express • React • Node • Razorpay • Resend • Vercel</p></div></footer>

    {accountOpen && <div className="overlay"><div className="modal accountModal" role="dialog" aria-modal="true" aria-label="Customer account">
      <button className="close" onClick={() => setAccountOpen(false)} aria-label="Close account">×</button>
      {account ? <><h2>Welcome, {account.name}</h2><p>{account.email}</p><p>Your account is ready. Profile and address management will be expanded in the next iteration.</p><button onClick={signOut}>Sign out</button></> : <>
        <h2>{authMode === "register" ? "Create account" : authMode === "otp" ? "Sign in with email code" : authMode === "otp-verify" ? "Verify your email" : "Sign in"}</h2>
        <form onSubmit={authMode.startsWith("otp") ? submitOtp : submitAuth} className="accountForm">
          {(authMode === "register" || authMode.startsWith("otp")) && <input required={authMode === "register"} maxLength="100" value={authForm.name} onChange={e => setAuthForm({...authForm,name:e.target.value})} placeholder={authMode.startsWith("otp") ? "Full name (new accounts only)" : "Full name"} aria-label="Full name" /> }
          <input required type="email" autoComplete="email" value={authForm.email} onChange={e => setAuthForm({...authForm,email:e.target.value})} placeholder="Email address" aria-label="Email address" />
          {!authMode.startsWith("otp") && <input required minLength={authMode === "register" ? 8 : 1} maxLength="128" type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} value={authForm.password} onChange={e => setAuthForm({...authForm,password:e.target.value})} placeholder="Password (at least 8 characters)" aria-label="Password" /> }
          {authMode === "otp-verify" && <input required inputMode="numeric" pattern="[0-9]{6}" minLength="6" maxLength="6" autoComplete="one-time-code" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0,6))} placeholder="6-digit email code" aria-label="Six-digit email verification code" />}
          <button className="pay" type="submit" disabled={accountBusy}>{accountBusy ? "Please wait…" : authMode === "register" ? "Create account" : authMode === "otp" ? "Send email code" : authMode === "otp-verify" ? "Verify code & sign in" : "Sign in"}</button>
        </form>
        {authMode.startsWith("otp") ? <p><button type="button" onClick={() => { setAuthMode("otp"); setOtpCode(""); }}>Change email / resend code</button> · <button type="button" onClick={() => setAuthMode("login")}>Use password instead</button></p> : <><p>{authMode === "register" ? "Already registered?" : "New to DDCS?"} <button type="button" onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}>{authMode === "register" ? "Sign in" : "Create account"}</button></p><p><button type="button" className="otpAlternative" onClick={() => { setAuthMode("otp"); setOtpCode(""); }}>Use email OTP instead</button></p></>}
      </>}
    </div></div>}

    {message && <div className="toast" role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss message">×</button></div>}
    {checkout && <div className="overlay"><div className="modal" role="dialog" aria-modal="true" aria-label="Your cart">
      <button className="close" onClick={() => setCheckout(false)} aria-label="Close cart">×</button><h2>Your cart</h2>
      {cart.length === 0 ? <p>Your cart is empty.</p> : <>{cart.map((i, index) => <div className="line" key={i._id || index}><span>{i.name} × {i.qty}</span><b>{money((Number(i.price) || 0) * (Number(i.qty) || 0))}</b></div>)}<hr /><div className="line"><b>Total</b><b>{money(total)}</b></div><div className="paypalCheckout"><h3>PayPal checkout</h3><p>Continue through the official PayPal checkout button below.</p><div id="paypal-container-YMS9RP3FG6E78"></div><small>Important: this PayPal Hosted Button charges the amount configured in your PayPal account (USD). It does not automatically use the INR cart total shown above. Confirm the configured amount before accepting live payments.</small></div></>}
    </div></div>}
  </>;
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary><BrowserRouter><App /></BrowserRouter></ErrorBoundary>
);
