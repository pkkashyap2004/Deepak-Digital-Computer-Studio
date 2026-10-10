import React, { Component, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, ShieldCheck, Truck, CreditCard, MessageCircle } from "lucide-react";
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
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(authForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Sign-in failed");
      window.localStorage.setItem("ddcs_token", data.token);
      window.localStorage.setItem("ddcs_user", JSON.stringify(data.user));
      setAccountToken(data.token);
      setAccount(data.user);
      setMessage(authMode === "register" ? "Account created successfully." : "Signed in successfully.");
      setAuthForm({name:"",email:"",password:""});
    } catch (error) {
      setMessage(error.message || "Unable to sign in.");
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

  async function pay() {
    if (paying || cart.length === 0) return;
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
    <main id="products">
      <div className="sectionHead"><div><p className="eyebrow">SHOP</p><h2>Featured products</h2></div><span>{products.length} products</span></div>
      {productsError && <p role="status">We couldn’t load products right now. You can still browse the store; please try refreshing in a moment.</p>}
      {!productsError && products.length === 0 && <p>Products will appear here when the catalog is available.</p>}
      <div className="grid">{filteredProducts.map(p => <article className="card" key={p._id || p.name}>
        <img src={p.image || ""} alt={p.name || "Product"} loading="lazy" onError={e => { e.currentTarget.style.visibility = "hidden"; }} />
        <small>{p.category || "Technology"}</small><h3>{p.name || "Product"}</h3><p className="desc">{p.description || ""}</p><div className="price">{money(p.price)}</div><button onClick={() => add(p)}>Add to cart</button>
      </article>)}</div>
    </main>
    <footer id="support"><div><a className="brandMark footerBrand" href="#home" aria-label="Deepak Digital Computer Studio home"><span className="brandIcon"><span className="pixelGrid"><i></i><i></i><i></i><i></i><i></i><i></i></span><b>D</b><em></em></span><span className="brandWords"><strong><span>Deepak</span> <i>Digital</i></strong><small>Computer Studio</small></span></a><p>Deepak Digital Computer Studio — modern commerce for local technology retail.</p></div><div><b>Integrations</b><p>MongoDB • Express • React • Node • Razorpay • Resend • Vercel</p></div></footer>

    {accountOpen && <div className="overlay"><div className="modal accountModal" role="dialog" aria-modal="true" aria-label="Customer account">
      <button className="close" onClick={() => setAccountOpen(false)} aria-label="Close account">×</button>
      {account ? <><h2>Welcome, {account.name}</h2><p>{account.email}</p><p>Your account is ready. Profile and address management will be expanded in the next iteration.</p><button onClick={signOut}>Sign out</button></> : <>
        <h2>{authMode === "register" ? "Create account" : "Sign in"}</h2>
        <form onSubmit={submitAuth} className="accountForm">
          {authMode === "register" && <input required maxLength="100" value={authForm.name} onChange={e => setAuthForm({...authForm,name:e.target.value})} placeholder="Full name" aria-label="Full name" />}
          <input required type="email" autoComplete="email" value={authForm.email} onChange={e => setAuthForm({...authForm,email:e.target.value})} placeholder="Email address" aria-label="Email address" />
          <input required minLength="6" type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} value={authForm.password} onChange={e => setAuthForm({...authForm,password:e.target.value})} placeholder="Password (at least 6 characters)" aria-label="Password" />
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
