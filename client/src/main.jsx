import React, { Component, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, ShieldCheck, Truck, CreditCard, MessageCircle, Eye, Star, ArrowLeft, FileText, Users } from "lucide-react";
import "./styles.css";

const API = "/api";
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
  const [cart, setCart] = useState(readCart);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [message, setMessage] = useState("");
  const [productsError, setProductsError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
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
        const list = Array.isArray(data) ? data : (Array.isArray(data.products) ? data.products : []);
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
  function signOut() {
    try { window.localStorage.removeItem("ddcs_token"); window.localStorage.removeItem("ddcs_user"); } catch {}
    setAccountToken(""); setAccount(null); setMessage("You have signed out.");
  }
  const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
  const filteredProducts = products.filter(p =>
    String(p.name || "").toLowerCase().includes(q.toLowerCase()) ||
    String(p.category || "").toLowerCase().includes(q.toLowerCase())
  );

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

  async function pay() {
    if (paying || cart.length === 0) return;
    if (cart.some(item => item.service)) { setMessage("Government service charges must be confirmed first. Open the service details and submit an enquiry before checkout."); return; }
    setPaying(true);
    try {
      const shipping = { name: "Guest Customer", email: "customer@example.com", phone: "", address: "India" };
      const paymentResponse = await fetch(API + "/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total })
      });
      if (!paymentResponse.ok) throw new Error("Payment setup failed");
      const payment = await paymentResponse.json();
      const orderResponse = await fetch(API + "/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i._id, name: i.name, price: i.price, qty: i.qty })),
          total,
          paymentMethod: payment.demo ? "demo" : "razorpay",
          shipping
        })
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.message || "Order could not be placed");
      setCart([]);
      setCheckout(false);
      setMessage("Order placed successfully: " + (order._id || order.orderId || ""));
    } catch (error) {
      console.error("Checkout failed:", error);
      setMessage(error.message || "Checkout failed. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  return <>
    <header>
      <div className="top">🚀 Free delivery on orders over ₹999 • Secure checkout</div>
      <nav>
        <a className="brandMark" href="#home" aria-label="Deepak Digital Computer Studio home"><span className="brandIcon"><span className="pixelGrid"><i></i><i></i><i></i><i></i><i></i><i></i></span><b>D</b><em></em></span><span className="brandWords"><strong><span>Deepak</span> <i>Digital</i></strong><small>Computer Studio</small></span></a>
        <button className="icon" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? <X /> : <Menu />}</button>
        <div className={"links " + (menu ? "open" : "")}><a href="#home">Home</a><a href="#products">Products</a><a href="#products">Deals</a><a href="#support">Support</a></div>
        <div className="search"><Search size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products..." aria-label="Search products" /></div>
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
          <div className="detailActions"><button onClick={()=>{add(selectedProduct);setMessage("Added to cart: "+selectedProduct.name)}}><ShoppingCart size={18}/> Add to cart</button><button className="secondaryAction" onClick={()=>document.getElementById("service-enquiry")?.scrollIntoView({behavior:"smooth",block:"center"})}><FileText size={18}/> Online form / Enquiry</button></div>
        </div>
      </div>
      <section className="detailBelow"><div><h2>Service details and information</h2><p>{selectedProduct.description||"Our team can help you understand the process and prepare the information needed before submitting a request."}</p><h3>How it works</h3><ol><li>Review the service information and document checklist.</li><li>Submit the enquiry form with your contact details.</li><li>Our team contacts you to confirm charges and next steps.</li></ol><h3>Before you apply</h3><p>Requirements and official approval timelines can vary. Confirm current requirements with the relevant government portal or authorised service centre. An enquiry does not guarantee issuance of a government certificate.</p></div>
      <form id="service-enquiry" className="enquiryCard" onSubmit={submitInquiry}><h2>Request this service</h2><p>Leave your details for a follow-up.</p><label>Your name<input required minLength="2" maxLength="100" value={inquiryForm.name} onChange={e=>setInquiryForm({...inquiryForm,name:e.target.value})} placeholder="Full name"/></label><label>Mobile / contact number<input required maxLength="25" inputMode="tel" value={inquiryForm.phone} onChange={e=>setInquiryForm({...inquiryForm,phone:e.target.value})} placeholder="Contact number"/></label><label>What do you need?<textarea maxLength="1000" value={inquiryForm.note} onChange={e=>setInquiryForm({...inquiryForm,note:e.target.value})} placeholder="Optional questions"/></label><button className="pay" disabled={inquiryBusy}>{inquiryBusy?"Submitting…":"Submit enquiry"}</button></form></section>
    </main> : <main id="products">
      <div className="sectionHead"><div><p className="eyebrow">SHOP & DIGITAL SERVICES</p><h2>Featured products and online services</h2></div><span>{filteredProducts.length} items</span></div>
      {productsError&&<p role="status">We couldn’t load the catalogue right now. Please try again shortly.</p>}
      {!productsError&&products.length===0&&<p>Products and services will appear here when the catalog is available.</p>}
      <div className="grid">{filteredProducts.map(p=>{
        const discount=Number(p.discountPercent)||(Number(p.compareAt)>Number(p.price)&&Number(p.compareAt)>0?Math.round((1-Number(p.price)/Number(p.compareAt))*100):0);
        const oldPrice=Number(p.compareAt)>Number(p.price)?Number(p.compareAt):(discount>0?Number(p.price)/(1-discount/100):0);
        return <article className="card serviceCard" key={p._id||p.name}>
          <button className="productImageButton" onClick={()=>openProduct(p)} aria-label={"View "+p.name}><img src={p.image||""} alt={p.name||"Service"} loading="lazy" onError={e=>{e.currentTarget.style.visibility="hidden";}}/><span className="imageLabel">View details ↗</span>{discount>0&&<span className="cardDiscount">{discount}% OFF</span>}</button>
          <small>{p.category||"Digital Service"}</small><h3>{p.name||"Product"}</h3><p className="desc">{p.description||"Learn about this service, required documents and how to apply."}</p>
          <div className="ratingLine"><span className="stars">{Number(p.reviewCount)>0 ? "★★★★★" : "Not yet rated"}</span>{Number(p.reviewCount)>0 && <><b>{Number(p.rating||0).toFixed(1)}</b><span>({Number(p.reviewCount)} reviews)</span></>}</div>
          <div className="cardPrice">{p.service ? <span className="servicePrice">Contact for charges</span> : money(p.price)} {oldPrice>Number(p.price)&&<span className="oldPrice">{money(oldPrice)}</span>}</div>
          <div className="cardStats"><span><Eye size={15}/> {Number(p.views||0).toLocaleString("en-IN")} views</span><span><Users size={15}/> {Number(p.inquiries||0).toLocaleString("en-IN")} enquiries</span></div>
          <div className="offerMini"><b>Offers</b><span>{p.offers?.[0]||"Ask us about current offers and service charges."}</span></div>
          <div className="cardActions"><button onClick={()=>{add(p);setMessage("Added to cart: "+p.name)}}><ShoppingCart size={16}/> Add to cart</button><button className="secondaryAction" onClick={()=>openProduct(p)}>Online form / Details</button></div>
        </article>;
      })}</div>
    </main>}

    <section className="ddcsAdditions" id="ddcs-gallery">
      <div className="sectionHead"><div><p className="eyebrow">OUR STUDIO</p><h2>Deepak Digital Computer Studio</h2></div></div>
      <div className="studioPromo"><div><span className="eyebrow">आपकी सेवा, हमारा विश्वास</span><h2>आपका अपना डिजिटल सेवा केंद्र</h2><p>सरकारी ऑनलाइन फॉर्म, जॉब एप्लीकेशन, प्रमाणपत्र सहायता, प्रिंटिंग, स्कैनिंग और अन्य डिजिटल सेवाएँ।</p><a className="slideCta" href="#ddcs-contact">आज ही संपर्क करें →</a></div><div className="promoOffer"><b>3 in 1 फॉर्म ऑनलाइन</b><strong>₹220</strong><span>आय प्रमाण पत्र • जाति प्रमाण पत्र • निवास प्रमाण पत्र</span><small>पहले ₹300 — सीमित समय का ऑफर</small></div></div>
      <div className="ddcsGallery"><article><div className="galleryPoster posterOne"><b>DEEPAK DIGITAL</b><strong>COMPUTER STUDIO</strong><span>आपका अपना डिजिटल सेवा केंद्र</span><p>Online Forms • Printing • Computer Services</p></div><h3>हमारी डिजिटल सेवाएँ</h3></article><article><div className="galleryPoster posterTwo"><b>3 in 1</b><strong>फॉर्म ऑनलाइन</strong><span>₹220/-</span><p>Income • Caste • Domicile Certificate</p></div><h3>स्पेशल ऑफर</h3></article></div>
    </section>
    <section className="ddcsAdditions" id="ddcs-reviews"><div className="sectionHead"><div><p className="eyebrow">CUSTOMER TRUST</p><h2>Customer Reviews</h2><p>आपका feedback हमारे लिए महत्वपूर्ण है। Google पर अपने अनुभव को साझा करें।</p></div></div><div className="reviewCta"><div className="reviewStars">★★★★★</div><h3>क्या आपने हमारी सेवा ली?</h3><p>अपना वास्तविक अनुभव Google पर साझा करके दूसरे ग्राहकों की मदद करें।</p><a className="slideCta" href="https://search.google.com/local/writereview?placeid=" target="_blank" rel="noreferrer">Write a Google Review ↗</a><a href="https://maps.app.goo.gl/U3JLNwZChQ8uniLu8" target="_blank" rel="noreferrer">Google Maps पर studio देखें</a></div></section>
    <section className="ddcsAdditions" id="ddcs-contact"><div className="sectionHead"><div><p className="eyebrow">WE’RE HERE TO HELP</p><h2>Contact & Enquiry</h2><p>अपनी जरूरत बताएं — हमारी टीम आपसे संपर्क करेगी।</p></div></div><div className="contactGrid"><div className="contactDetails"><h3>Deepak Digital Computer Studio</h3><p><b>Phone:</b> <a href="tel:9794210366">9794210366</a> · <a href="tel:9506288216">9506288216</a></p><p><b>Address:</b> Tahsil Gate, Near Patanjali Shop, Nighasan, Lakhimpur Kheri, Uttar Pradesh – 262903</p><p><a href="https://wa.me/919794210366" target="_blank" rel="noreferrer">WhatsApp पर संपर्क करें →</a></p><a className="mapLink" href="https://maps.app.goo.gl/U3JLNwZChQ8uniLu8" target="_blank" rel="noreferrer">📍 Open exact Google Maps location</a><iframe title="Deepak Digital Computer Studio map" src="https://maps.google.com/maps?q=Tahsil%20Gate%20near%20Patanjali%20Shop%20Nighasan%20Lakhimpur%20Kheri%20UP%20262903&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe></div><form className="enquiryCard contactForm" onSubmit={submitContact}><h3>Send an enquiry</h3><label>Full name<input required minLength="2" maxLength="100" value={contactForm.name} onChange={e=>setContactForm({...contactForm,name:e.target.value})} placeholder="Your name"/></label><label>Mobile number<input required type="tel" inputMode="tel" maxLength="25" value={contactForm.phone} onChange={e=>setContactForm({...contactForm,phone:e.target.value})} placeholder="Your mobile number"/></label><label>Email (optional)<input type="email" maxLength="254" value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})} placeholder="you@example.com"/></label><label>Service required<select value={contactForm.service} onChange={e=>setContactForm({...contactForm,service:e.target.value})}><option value="">Choose a service</option><option>Income / Caste / Domicile Certificate</option><option>Government online form</option><option>Job application</option><option>Aadhaar / PAN / Voter services</option><option>Printing / Scanning / DTP</option><option>Other digital service</option></select></label><label>Message<textarea required maxLength="1500" value={contactForm.message} onChange={e=>setContactForm({...contactForm,message:e.target.value})} placeholder="Tell us what you need"/></label><button className="pay" disabled={contactBusy}>{contactBusy?"Sending…":"Submit enquiry"}</button><small>Details are submitted securely to our website enquiry system. Do not include passwords or OTPs.</small></form></div></section>

    <footer id="support"><div><a className="brandMark footerBrand" href="#home" aria-label="Deepak Digital Computer Studio home"><span className="brandIcon"><span className="pixelGrid"><i></i><i></i><i></i><i></i><i></i><i></i></span><b>D</b><em></em></span><span className="brandWords"><strong><span>Deepak</span> <i>Digital</i></strong><small>Computer Studio</small></span></a><p>Deepak Digital Computer Studio — modern commerce for local technology retail.</p></div><div><b>Integrations</b><p>MongoDB • Express • React • Node • Razorpay • Resend • Vercel</p></div></footer>

    {accountOpen && <div className="overlay"><div className="modal accountModal" role="dialog" aria-modal="true" aria-label="Customer account">
      <button className="close" onClick={() => setAccountOpen(false)} aria-label="Close account">×</button>
      {account ? <><h2>Welcome, {account.name}</h2><p>{account.email}</p><p>Your account is ready. Profile and address management will be expanded in the next iteration.</p><button onClick={signOut}>Sign out</button></> : <>
        <h2>{authMode === "register" ? "Create account" : "Sign in"}</h2>
        <form onSubmit={submitAuth} className="accountForm">
          {authMode === "register" && <input required maxLength="100" value={authForm.name} onChange={e => setAuthForm({...authForm,name:e.target.value})} placeholder="Full name" aria-label="Full name" />}
          <input required type="email" autoComplete="email" value={authForm.email} onChange={e => setAuthForm({...authForm,email:e.target.value})} placeholder="Email address" aria-label="Email address" />
          <input required minLength={authMode === "register" ? 8 : 1} maxLength="128" type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} value={authForm.password} onChange={e => setAuthForm({...authForm,password:e.target.value})} placeholder="Password (at least 6 characters)" aria-label="Password" />
          <button className="pay" type="submit" disabled={accountBusy}>{accountBusy ? "Please wait…" : authMode === "register" ? "Create account" : "Sign in"}</button>
        </form>
        <p>{authMode === "register" ? "Already registered?" : "New to DDCS?"} <button onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}>{authMode === "register" ? "Sign in" : "Create account"}</button></p>
      </>}
    </div></div>}

    {message && <div className="toast" role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss message">×</button></div>}
    {checkout && <div className="overlay"><div className="modal" role="dialog" aria-modal="true" aria-label="Your cart">
      <button className="close" onClick={() => setCheckout(false)} aria-label="Close cart">×</button><h2>Your cart</h2>
      {cart.length === 0 ? <p>Your cart is empty.</p> : <>{cart.map((i, index) => <div className="line" key={i._id || index}><span>{i.name} × {i.qty}</span><b>{money((Number(i.price) || 0) * (Number(i.qty) || 0))}</b></div>)}<hr /><div className="line"><b>Total</b><b>{money(total)}</b></div><button className="pay" onClick={pay} disabled={paying}>{paying ? "Processing…" : "Place order & pay"}</button></>}
    </div></div>}
  </>;
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary><BrowserRouter><App /></BrowserRouter></ErrorBoundary>
);
