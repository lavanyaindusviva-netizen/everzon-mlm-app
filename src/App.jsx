import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LayoutDashboard, Package, GitBranch, ShoppingCart, Wallet,
  Plus, X, Copy, Check, Clock, TrendingUp, Upload, QrCode,
  ChevronRight, Users, ShieldCheck, Loader2, AlertCircle, LogIn, Menu, Search,
  UserPlus, Layers, Award, Crown, Gift, Receipt, Star, Trophy, Gem, Sparkles, Medal
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
/* ---------------- Product Images (embedded base64) ---------------- */
const imgML86 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0Y0RjZGNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTI5OEE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHVjdCBQaG90bzwvdGV4dD48L3N2Zz4=";
const imgML83 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0Y0RjZGNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTI5OEE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHVjdCBQaG90bzwvdGV4dD48L3N2Zz4=";
const imgML84 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0Y0RjZGNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTI5OEE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHVjdCBQaG90bzwvdGV4dD48L3N2Zz4=";
const imgML27 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0Y0RjZGNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTI5OEE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHVjdCBQaG90bzwvdGV4dD48L3N2Zz4=";

const PRODUCTS = [
  { model: "ML-86", name: "Premium ANC Earbuds", price: 2000, image: imgML86 },
  { model: "ML-83", name: "Audio Sports Hero — Buds Pro 5", price: 2000, image: imgML83 },
  { model: "ML-84", name: "Smart TWS Earphone", price: 2000, image: imgML84 },
  { model: "ML-27", name: "ENC Pro Earbuds", price: 2000, image: imgML27 },
];

const INDIGO = "#1B1F3B";
const TEAL = "#0F9B8E";
const GOLD = "#D4AF37";

const BINARY_PCT = 0.15;
const DIRECT_PCT = 0.10;
const LEVEL_PCTS = {
  1: 0.040, 2: 0.025, 3: 0.015, 4: 0.015, 5: 0.010,
  6: 0.005, 7: 0.005, 8: 0.005, 9: 0.005, 10: 0.005,
};
const RANK_PCT = 0.04;
const ROYALTY_PCT = 0.02;
const REWARD_PCT = 0.01;
const BINARY_LIFETIME_CAP = 100000;

const RANKS = [
  { name: "Crown Diamond", minBV: 10000000, royaltyEligible: true, rewardEligible: true, color: "#9333EA", textColor: "#FFFFFF", icon: Crown },
  { name: "Diamond", minBV: 4000000, royaltyEligible: true, rewardEligible: false, color: "#0EA5E9", textColor: "#FFFFFF", icon: Sparkles },
  { name: "Platinum", minBV: 1500000, royaltyEligible: true, rewardEligible: false, color: "#64748B", textColor: "#FFFFFF", icon: Gem },
  { name: "Gold", minBV: 600000, royaltyEligible: false, rewardEligible: false, color: "#D4AF37", textColor: "#1B1F3B", icon: Trophy },
  { name: "Silver", minBV: 200000, royaltyEligible: false, rewardEligible: false, color: "#9CA3AF", textColor: "#1B1F3B", icon: Medal },
  { name: "Star", minBV: 50000, royaltyEligible: false, rewardEligible: false, color: "#B45309", textColor: "#FFFFFF", icon: Star },
];
function getRank(cumulativeMatchedBV) {
  for (const r of RANKS) if (cumulativeMatchedBV >= r.minBV) return r;
  return null;
}
function getRankByName(name) {
  return RANKS.find((r) => r.name === name) || null;
}
const ADMIN_CHARGE_PCT = 0.05;

const ADMIN_PASSCODE_HASH = "8aea344e50c3957ab9ec037bb1cf4f7b32ed053a55e88e67b5353853d3883d79";
const ADMIN_RECOVERY_HASH = "eb96471a7a9bd73bd49919cc02228e6d7902d52b5f0e69573748fb9648811003";

async function hashPassword(plain) {
  const enc = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const firebaseConfig = {
  apiKey: "AIzaSyDxQFtJI2JRXPGjh1d8uSOnbFKR1MCfr0g",
  authDomain: "everzon-5935b.firebaseapp.com",
  projectId: "everzon-5935b",
  storageBucket: "everzon-5935b.firebasestorage.app",
  messagingSenderId: "891532823695",
  appId: "1:891532823695:web:94a8f7bacf377ee765b4fa",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// Cloudinary is used for image hosting instead of Firebase Storage (which now
// requires the paid Blaze plan). Cloudinary's free tier needs no card and
// comfortably covers a product catalog + QR code for this app.
const CLOUDINARY_CLOUD_NAME = "vtil7boq";
const CLOUDINARY_UPLOAD_PRESET = "j8kyro6p";

let authReadyPromise = null;
function ensureFirebaseAuth() {
  if (!authReadyPromise) {
    authReadyPromise = signInAnonymously(auth).catch((e) => {
      console.error("Firebase anonymous sign-in failed", e);
      authReadyPromise = null;
    });
  }
  return authReadyPromise;
}

async function loadKey(key, fallback) {
  try {
    await ensureFirebaseAuth();
    const snap = await getDoc(doc(db, "everzon_data", key));
    return snap.exists() ? JSON.parse(snap.data().value) : fallback;
  } catch (e) {
    console.error("Firestore load failed", key, e);
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, "everzon_data", key), { value: JSON.stringify(value) });
  } catch (e) {
    console.error("Firestore save failed", key, e);
  }
}
// Uploads an image file to Cloudinary (NOT into a Firestore document) and
// returns its public URL. This is what lets the app hold as many
// products/images as needed — Firestore documents are capped at 1 MB total,
// which previously meant only 1-2 product photos could ever be saved before
// hitting that limit (since the whole catalog lived in a single document).
// Cloudinary's free tier (25 GB) has no such cap, so only a small URL string
// is stored in Firestore now.
async function uploadImageToStorage(path, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url;
}
// Cloudinary deletion requires a signed, server-side request (with an API
// secret that must never be exposed in client code), so this app — which has
// no backend server — cannot safely auto-delete old Cloudinary images. Old
// images are simply left in place; this is a non-issue on the 25 GB free tier
// for a product catalog + QR code.
async function deleteImageFromStorage(url) {
  // Intentionally a no-op — see note above.
}
// Real-time listener: keeps every connected device (member phones, admin browser)
// in sync automatically. This replaces the old "load once on page open" approach,
// which is why a request submitted on one device never used to appear on another
// until a manual page refresh.
function subscribeKey(key, onValue, fallback, onError) {
  return onSnapshot(
    doc(db, "everzon_data", key),
    (snap) => {
      if (snap.exists()) {
        try {
          onValue(JSON.parse(snap.data().value));
        } catch (e) {
          onValue(fallback);
        }
      } else {
        onValue(fallback);
      }
    },
    (err) => {
      console.error("Firestore listen failed", key, err);
      // IMPORTANT: always resolve the caller with the fallback even on error —
      // otherwise a permission/network failure leaves the app's "loading" state
      // stuck forever with no way out (the bug that caused the endless spinner).
      onValue(fallback);
      if (onError) onError(err);
    }
  );
}

function genId(users) {
  let n = 1001 + users.length;
  let id = `EVZ${n}`;
  while (users.some((u) => u.id === id)) {
    n++;
    id = `EVZ${n}`;
  }
  return id;
}
function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}
function findUser(users, id) {
  return users.find((u) => u.id === id);
}
function getChildren(users, parentId) {
  return users.filter((u) => u.parentId === parentId);
}
function getSubtreeIds(users, rootId) {
  const ids = [];
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop();
    ids.push(cur);
    getChildren(users, cur).forEach((c) => stack.push(c.id));
  }
  return ids;
}
function getUplineChain(users, userId, maxLevels) {
  const chain = [];
  let current = findUser(users, userId);
  let level = 1;
  while (current && current.sponsorId && level <= maxLevels) {
    const sponsor = findUser(users, current.sponsorId);
    if (!sponsor) break;
    chain.push({ user: sponsor, level });
    current = sponsor;
    level++;
  }
  return chain;
}
function daysSince(dateStr) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return d < 0 ? 0 : d;
}

function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="markGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F9B8E" />
          <stop offset="100%" stopColor="#1B1F3B" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#markGrad)" />
      <path d="M22 44 L50 26 L78 44 L78 50 L50 33 L22 50 Z" fill="#D4AF37" />
      <path d="M25 60 L50 44 L75 60 L75 66 L50 51 L25 66 Z" fill="#FFFFFF" />
      <path d="M28 76 L50 62 L72 76 L72 82 L50 69 L28 82 Z" fill="#FFFFFF" />
    </svg>
  );
}

export default function EverzonDashboard() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [income, setIncome] = useState([]);
  const [payment, setPayment] = useState({ upiId: "", accountName: "", accountNumber: "", ifsc: "", qr: "" });
  const [products, setProducts] = useState(PRODUCTS);
  const [adminPasscodeHash, setAdminPasscodeHash] = useState(ADMIN_PASSCODE_HASH);
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [carry, setCarry] = useState({});
  const [cumulativeBV, setCumulativeBV] = useState({});

  const [tab, setTab] = useState("dashboard");
  const [sessionId, setSessionId] = useState("");
  const [loginInput, setLoginInput] = useState("");
  const [loginPasswordInput, setLoginPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [portalMode, setPortalMode] = useState(null);
  const [showForgotMember, setShowForgotMember] = useState(false);
  const [showForgotAdmin, setShowForgotAdmin] = useState(false);
  const [showPublicJoin, setShowPublicJoin] = useState(false);
  const [publicJoinResult, setPublicJoinResult] = useState(null);

  // Live sync: every key below is subscribed with onSnapshot, so a change made on
  // ANY device (member's phone, admin's laptop, etc.) reaches every other open
  // session automatically — no manual refresh needed. This is what makes a
  // member's password-reset request show up on the admin's screen right away,
  // and makes an approved password take effect immediately for that member.
  useEffect(() => {
    let active = true;
    let seededUsers = false;
    let unsubs = [];

    // Safety net: if nothing has resolved within 12 seconds (bad network, wrong
    // Firebase config, Firestore rules blocking access, etc.), stop spinning
    // forever and show a clear "couldn't connect" screen with a Retry button
    // instead of an endless loading circle.
    const hardTimeout = setTimeout(() => {
      if (active) {
        setLoading((prevLoading) => {
          if (prevLoading) setLoadError(true);
          return false;
        });
      }
    }, 12000);

    ensureFirebaseAuth()
      .then(() => {
        if (!active) return;
        unsubs.push(
          subscribeKey(
            "ez_users",
            async (val) => {
              if (val.length === 0 && !seededUsers) {
                seededUsers = true;
                const root = {
                  id: "EVZ1000",
                  name: "Everzon HQ",
                  email: "hq@everzon.example",
                  mobile: "-",
                  sponsorId: null,
                  parentId: null,
                  position: "root",
                  password: await hashPassword("Ravi@4545"),
                  joinDate: new Date().toISOString(),
                  status: "active",
                };
                const demoMember = {
                  id: "EVZ1001",
                  name: "Demo Distributor",
                  email: "demo@everzon.example",
                  mobile: "9999999999",
                  sponsorId: "EVZ1000",
                  parentId: "EVZ1000",
                  position: "left",
                  password: await hashPassword("demo1234"),
                  joinDate: new Date().toISOString(),
                  status: "active",
                };
                await saveKey("ez_users", [root, demoMember]);
                // Always clear the loading state here too — if this write silently
                // failed (e.g. permission denied), the snapshot won't fire again,
                // so we must not leave the app stuck waiting on it.
                if (active) setLoading(false);
                return;
              }
              setUsers(val);
              setLoading(false);
            },
            [],
            () => {
              // A real connection/permission error on the core "users" data —
              // surface it immediately instead of waiting for the hard timeout.
              if (active) {
                setLoadError(true);
                setLoading(false);
              }
            }
          )
        );
        unsubs.push(subscribeKey("ez_orders", setOrders, []));
        unsubs.push(subscribeKey("ez_income", setIncome, []));
        unsubs.push(subscribeKey("ez_payment", setPayment, { upiId: "", accountName: "", accountNumber: "", ifsc: "", qr: "" }));
        unsubs.push(subscribeKey("ez_products", setProducts, PRODUCTS));
        unsubs.push(subscribeKey("ez_admin_passcode", setAdminPasscodeHash, ADMIN_PASSCODE_HASH));
        unsubs.push(subscribeKey("ez_password_requests", setPasswordRequests, []));
        unsubs.push(subscribeKey("ez_carry", setCarry, {}));
        unsubs.push(subscribeKey("ez_cumulative_bv", setCumulativeBV, {}));
      })
      .catch(() => {
        // ensureFirebaseAuth is designed to swallow its own errors, but just in
        // case anything else throws before subscriptions are set up, never leave
        // the screen stuck on the spinner.
        if (active) {
          setLoadError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      clearTimeout(hardTimeout);
      unsubs.forEach((u) => u && u());
    };
  }, []);

  // Click sound: plays a short synthesized "tick" on every button press across the
  // whole app. Uses the Web Audio API so no external sound file/network is needed.
  const audioCtxRef = useRef(null);
  const playClickSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch (e) {
      // Audio not available/blocked — fail silently, never break the click itself.
    }
  }, []);
  useEffect(() => {
    const handler = (e) => {
      const btn = e.target.closest("button, [role='button']");
      if (btn && !btn.disabled) playClickSound();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [playClickSound]);

  const currentUser = findUser(users, sessionId);

  const approvePasswordRequest = async (userId) => {
    const req = passwordRequests.find((r) => r.userId === userId);
    if (!req) return;
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, password: req.newPasswordHash } : u));
    const updatedRequests = passwordRequests.filter((r) => r.userId !== userId);
    await saveKey("ez_users", updatedUsers);
    await saveKey("ez_password_requests", updatedRequests);
    setUsers(updatedUsers);
    setPasswordRequests(updatedRequests);
  };
  const rejectPasswordRequest = async (userId) => {
    const updatedRequests = passwordRequests.filter((r) => r.userId !== userId);
    await saveKey("ez_password_requests", updatedRequests);
    setPasswordRequests(updatedRequests);
  };

  const resetAllData = async () => {
    const root = users.find((u) => u.position === "root");
    const rootOnly = root ? [root] : [];
    await saveKey("ez_users", rootOnly);
    await saveKey("ez_orders", []);
    await saveKey("ez_income", []);
    await saveKey("ez_carry", {});
    await saveKey("ez_binary_lifetime", {});
    await saveKey("ez_cumulative_bv", {});
    await saveKey("ez_password_requests", []);
    setUsers(rootOnly);
    setOrders([]);
    setIncome([]);
    setCarry({});
    setCumulativeBV({});
    setPasswordRequests([]);
  };

  // Self-serve recovery: if the HQ (root) ID is missing — usually because the
  // automatic first-time setup silently failed (e.g. a Firestore write was
  // blocked) — the tree has nothing to display and looks empty forever.
  // This lets the admin recreate the HQ ID directly from the app, without
  // needing direct database access.
  const [initializingRoot, setInitializingRoot] = useState(false);
  const initializeRoot = async () => {
    if (users.some((u) => u.position === "root")) return;
    setInitializingRoot(true);
    const root = {
      id: "EVZ1000",
      name: "Everzon HQ",
      email: "hq@everzon.example",
      mobile: "-",
      sponsorId: null,
      parentId: null,
      position: "root",
      password: await hashPassword("Ravi@4545"),
      joinDate: new Date().toISOString(),
      status: "active",
    };
    const updated = [...users, root];
    await saveKey("ez_users", updated);
    setUsers(updated);
    setInitializingRoot(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] gap-3">
        <Loader2 className="animate-spin text-[#0F9B8E]" size={28} />
        <span className="text-xs text-[#9298A6]">Connecting…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] px-6 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#FCEEE9" }}>
          <AlertCircle size={26} className="text-[#B3532F]" />
        </div>
        <h2 className="font-display font-bold text-lg text-[#1B1F3B]">Couldn't Connect</h2>
        <p className="text-xs text-[#6E7482] max-w-xs">
          Everzon couldn't reach the server. Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-medium rounded-xl px-5 py-2.5 text-white mt-2"
          style={{ backgroundColor: "#1B1F3B" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#20232E]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
        .font-display { font-family: 'Poppins', sans-serif; }
        .font-mono-tag { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <header
        className="px-4 py-3 flex items-center justify-between sticky top-0 z-40"
        style={{ background: "linear-gradient(90deg, #1B1F3B 0%, #24296B 55%, #0F9B8E 130%)" }}
      >
        <div className="flex items-center gap-2">
          {(currentUser || isAdmin) && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
              aria-label="Menu"
            >
              <Menu size={20} className="text-white" />
            </button>
          )}
          <Logo size={30} />
          <span className="font-display font-bold text-white text-lg">Everzon</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="flex items-center gap-1 text-[10px] font-mono-tag bg-[#D4AF37] text-[#1B1F3B] px-2 py-1 rounded-full">
              <ShieldCheck size={12} /> ADMIN
            </span>
          )}
          {currentUser && (
            <span className="text-[10px] font-mono-tag text-[#C9CEDB] bg-white/10 px-2 py-1 rounded-full">
              {currentUser.id}
            </span>
          )}
          {(currentUser || isAdmin) && (
            <button
              onClick={() => {
                setSessionId("");
                setIsAdmin(false);
                setPortalMode(null);
                setTab("dashboard");
                setMenuOpen(false);
                setLoginInput("");
                setLoginPasswordInput("");
                setLoginError("");
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
              aria-label="Logout"
              title="Logout"
            >
              <LogIn size={16} className="text-white" style={{ transform: "scaleX(-1)" }} />
            </button>
          )}
        </div>
      </header>

      {menuOpen && (currentUser || isAdmin) && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-[56px] left-3 right-3 bg-white rounded-2xl shadow-xl border border-[#E5E3DC] p-2 z-50 flex flex-col gap-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#1B1F3B" },
              { id: "products", label: "Products", icon: Package, color: "#0F9B8E" },
              { id: "genealogy", label: "Genealogy", icon: GitBranch, color: "#7C3AED" },
              { id: "orders", label: "Orders", icon: ShoppingCart, color: "#F97316" },
              { id: "income", label: "Income", icon: Wallet, color: "#22C55E" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.id ? "bg-[#FAF9F6] text-[#1B1F3B]" : "text-[#6E7482] hover:bg-[#FAF9F6]"
                }`}
              >
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: t.color }}
                >
                  <t.icon size={18} color="#FFFFFF" />
                </div>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {!currentUser && !isAdmin && portalMode === null && (
        <div className="max-w-sm mx-auto px-4 py-10">
          <div className="text-center mb-6">
            <div className="font-display font-bold text-[#1B1F3B] text-lg">Login</div>
            <div className="text-xs text-[#6E7482] mt-1">Choose your panel</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPortalMode("member")}
              className="bg-white border border-[#E5E3DC] rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-[#0F9B8E] transition-colors"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#0F9B8E" }}>
                <Users size={22} color="#FFFFFF" />
              </div>
              <span className="font-display font-semibold text-sm text-[#1B1F3B]">Member</span>
            </button>
            <button
              onClick={() => setPortalMode("admin")}
              className="bg-white border border-[#E5E3DC] rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-[#D4AF37] transition-colors"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#D4AF37" }}>
                <ShieldCheck size={22} color="#1B1F3B" />
              </div>
              <span className="font-display font-semibold text-sm text-[#1B1F3B]">Admin</span>
            </button>
          </div>

          <button
            onClick={() => setShowPublicJoin(true)}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl py-3 mt-5 border-2 border-dashed"
            style={{ borderColor: "#0F9B8E", color: "#0F9B8E" }}
          >
            <UserPlus size={16} /> New Distributor? Create Your Joining ID
          </button>
        </div>
      )}

      {!currentUser && !isAdmin && portalMode === "member" && (
        <div className="bg-white border-b border-[#E5E3DC] px-4 py-4">
          <button
            onClick={() => { setPortalMode(null); setLoginError(""); }}
            className="text-xs text-[#6E7482] underline mb-3 block"
          >
            ← Back
          </button>
          <input
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value.toUpperCase())}
            placeholder="Enter your Distributor ID (e.g. EVZ1001)"
            className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F9B8E] mb-3"
          />
          <input
            type="password"
            value={loginPasswordInput}
            onChange={(e) => setLoginPasswordInput(e.target.value)}
            placeholder="Enter password"
            className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F9B8E] mb-3"
          />
          <button
            onClick={async () => {
              const id = loginInput.trim().toUpperCase();
              const match = findUser(users, id);
              if (!match) {
                setLoginError("ID not found");
                return;
              }
              const enteredHash = await hashPassword(loginPasswordInput);
              if (match.password !== enteredHash) {
                setLoginError("Incorrect password");
                return;
              }
              if (match.status === "hold") {
                setLoginError("This ID is on hold. Please contact admin.");
                return;
              }
              setLoginError("");
              setSessionId(match.id);
            }}
            className="w-full text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1.5"
            style={{ backgroundColor: "#1B1F3B", color: "#FFFFFF", padding: "12px 16px", minHeight: 44, border: "none" }}
          >
            <LogIn size={15} /> Login
          </button>
          {loginError && <span className="text-xs text-red-600 block mt-2">{loginError}</span>}
          <button
            onClick={() => setShowForgotMember(true)}
            className="text-xs text-[#0F9B8E] underline mt-3 block mx-auto"
          >
            Forgot Password?
          </button>
          <button
            onClick={() => setShowPublicJoin(true)}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl py-3 mt-4 border-2 border-dashed"
            style={{ borderColor: "#0F9B8E", color: "#0F9B8E" }}
          >
            <UserPlus size={16} /> New Distributor? Create Your Joining ID
          </button>
        </div>
      )}

      {!currentUser && !isAdmin && portalMode === "admin" && (
        <div className="bg-white border-b border-[#E5E3DC] px-4 py-4">
          <button
            onClick={() => { setPortalMode(null); setAdminError(""); }}
            className="text-xs text-[#6E7482] underline mb-3 block"
          >
            ← Back
          </button>
          <input
            type="password"
            value={adminInput}
            onChange={(e) => setAdminInput(e.target.value)}
            placeholder="Admin passcode"
            className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F9B8E] mb-3"
          />
          <button
            onClick={async () => {
              const enteredHash = await hashPassword(adminInput);
              if (enteredHash === adminPasscodeHash) {
                setIsAdmin(true);
                setAdminError("");
                setTab("orders");
              } else {
                setAdminError("Incorrect passcode");
              }
            }}
            className="w-full text-sm font-semibold rounded-lg"
            style={{ backgroundColor: "#D4AF37", color: "#1B1F3B", padding: "12px 16px", minHeight: 44, border: "none" }}
          >
            Enter Admin
          </button>
          {adminError && <span className="text-xs text-red-600 block mt-2">{adminError}</span>}
          <button
            onClick={() => setShowForgotAdmin(true)}
            className="text-xs text-[#0F9B8E] underline mt-3 block mx-auto"
          >
            Forgot Passcode?
          </button>
        </div>
      )}

      {(currentUser || isAdmin) && (
        <>
          <main className="max-w-5xl mx-auto px-4 py-5 pb-24">
            {tab === "dashboard" || (!["products", "genealogy", "orders", "income"].includes(tab)) ? (
              <DashboardTab
                currentUser={currentUser}
                users={users}
                orders={orders}
                income={income}
                isAdmin={isAdmin}
                carry={carry}
                cumulativeBV={cumulativeBV}
                passwordRequests={passwordRequests}
                onApprovePassword={approvePasswordRequest}
                onRejectPassword={rejectPasswordRequest}
                onResetAllData={resetAllData}
              />
            ) : null}
            {tab === "products" && (
              <ProductsTab products={products} setProducts={setProducts} isAdmin={isAdmin} />
            )}
            {tab === "genealogy" && (
              <GenealogyTab
                users={users}
                setUsers={setUsers}
                currentUser={currentUser}
                isAdmin={isAdmin}
                cumulativeBV={cumulativeBV}
                onInitializeRoot={initializeRoot}
                initializingRoot={initializingRoot}
              />
            )}
            {tab === "orders" && (
              <OrdersTab
                users={users}
                setUsers={setUsers}
                orders={orders}
                setOrders={setOrders}
                payment={payment}
                setPayment={setPayment}
                products={products}
                currentUser={currentUser}
                isAdmin={isAdmin}
                passwordRequests={passwordRequests}
                onApprovePassword={approvePasswordRequest}
                onRejectPassword={rejectPasswordRequest}
              />
            )}
            {tab === "income" && (
              <IncomeTab
                users={users}
                orders={orders}
                setOrders={setOrders}
                income={income}
                setIncome={setIncome}
                carry={carry}
                setCarry={setCarry}
                cumulativeBV={cumulativeBV}
                products={products}
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            )}
          </main>

          <nav className="fixed bottom-0 w-full bg-white border-t border-[#E5E3DC] flex justify-around py-2 z-40">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#1B1F3B" },
              { id: "products", label: "Products", icon: Package, color: "#0F9B8E" },
              { id: "genealogy", label: "Genealogy", icon: GitBranch, color: "#7C3AED" },
              { id: "orders", label: "Orders", icon: ShoppingCart, color: "#F97316" },
              { id: "income", label: "Income", icon: Wallet, color: "#22C55E" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-transform ${
                  tab === t.id ? "text-[#1B1F3B] -translate-y-0.5" : "text-[#9298A6]"
                }`}
              >
                <div
                  className="flex items-center justify-center rounded-xl transition-shadow"
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor: t.color,
                    boxShadow: tab === t.id ? `0 4px 10px ${t.color}66` : "none",
                    opacity: tab === t.id ? 1 : 0.85,
                  }}
                >
                  <t.icon size={18} color="#FFFFFF" />
                </div>
                {t.label}
              </button>
            ))}
          </nav>
        </>
      )}

      {showForgotMember && (
        <ForgotMemberPasswordModal
          users={users}
          passwordRequests={passwordRequests}
          setPasswordRequests={setPasswordRequests}
          onClose={() => setShowForgotMember(false)}
        />
      )}
      {showForgotAdmin && (
        <ForgotAdminPasscodeModal
          onClose={() => setShowForgotAdmin(false)}
          onSuccess={(newHash) => {
            setAdminPasscodeHash(newHash);
            setShowForgotAdmin(false);
          }}
        />
      )}
      {showPublicJoin && (
        <PublicJoinModal
          users={users}
          setUsers={setUsers}
          onClose={() => setShowPublicJoin(false)}
          onSuccess={(res) => {
            setShowPublicJoin(false);
            setPublicJoinResult(res);
          }}
        />
      )}
      {publicJoinResult && (
        <CredentialsModal result={publicJoinResult} onClose={() => setPublicJoinResult(null)} />
      )}
    </div>
  );
}

/* ==================================================================== */
/* FORGOT PASSWORD / PASSCODE MODALS                                    */
/* ==================================================================== */
function ForgotMemberPasswordModal({ users, passwordRequests, setPasswordRequests, onClose }) {
  const [id, setId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    const upperId = id.trim().toUpperCase();
    const match = users.find((u) => u.id === upperId);
    if (!match) {
      setError("ID not found");
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    // IMPORTANT: this hash is derived from exactly what the member typed above —
    // it is never re-generated later, so the password the admin approves is
    // guaranteed to be the same one the member just chose.
    const passwordHash = await hashPassword(newPassword);
    // Read/write through the SAME React state the admin panel reads (passwordRequests),
    // instead of hitting Firestore directly and bypassing app state — this is what
    // previously caused requests to "disappear" and admin approvals to apply a stale entry.
    const updated = [
      ...passwordRequests.filter((r) => r.userId !== upperId),
      {
        userId: upperId,
        newPasswordHash: passwordHash,
        requestedAt: new Date().toISOString(),
        status: "pending",
      },
    ];
    await saveKey("ez_password_requests", updated);
    setPasswordRequests(updated);
    setSaving(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center">
        {done ? (
          <>
            <Check size={36} className="mx-auto text-[#0F9B8E]" />
            <h3 className="font-display font-bold text-lg text-[#1B1F3B] mt-3">Request Sent</h3>
            <p className="text-xs text-[#6E7482] mt-2">
              Your new password will be active once the admin approves it.
            </p>
            <button onClick={onClose} className="w-full bg-[#1B1F3B] text-white rounded-xl py-2.5 mt-5 text-sm font-medium">
              Done
            </button>
          </>
        ) : (
          <>
            <h3 className="font-display font-bold text-lg text-[#1B1F3B]">Forgot Password</h3>
            <p className="text-xs text-[#6E7482] mt-1 mb-4">Set a new password — it will be active after admin approval.</p>
            <div className="space-y-3 text-left">
              <input value={id} onChange={(e) => setId(e.target.value.toUpperCase())} placeholder="Distributor ID" className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2.5 text-sm font-mono-tag" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2.5 text-sm" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2.5 text-sm" />
            </div>
            {error && <div className="flex items-center gap-1.5 text-red-600 text-xs mt-3"><AlertCircle size={14} /> {error}</div>}
            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 border border-[#D8D5CC] rounded-xl py-2.5 text-sm font-medium">Cancel</button>
              <button onClick={submit} disabled={saving} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white flex items-center justify-center gap-1.5" style={{ backgroundColor: "#1B1F3B" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ForgotAdminPasscodeModal({ onClose, onSuccess }) {
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    const enteredRecoveryHash = await hashPassword(recoveryKey);
    if (enteredRecoveryHash !== ADMIN_RECOVERY_HASH) {
      setError("Incorrect recovery key");
      return;
    }
    if (!newPasscode.trim() || newPasscode.length < 6) {
      setError("Passcode must be at least 6 characters");
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setError("Passcodes do not match");
      return;
    }
    setSaving(true);
    const newHash = await hashPassword(newPasscode);
    await saveKey("ez_admin_passcode", newHash);
    setSaving(false);
    onSuccess(newHash);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center">
        <h3 className="font-display font-bold text-lg text-[#1B1F3B]">Reset Admin Passcode</h3>
        <p className="text-xs text-[#6E7482] mt-1 mb-4">Enter your Recovery Key to set a new passcode.</p>
        <div className="space-y-3 text-left">
          <input type="password" value={recoveryKey} onChange={(e) => setRecoveryKey(e.target.value)} placeholder="Recovery Key" className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2.5 text-sm" />
          <input type="password" value={newPasscode} onChange={(e) => setNewPasscode(e.target.value)} placeholder="New Passcode" className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2.5 text-sm" />
          <input type="password" value={confirmPasscode} onChange={(e) => setConfirmPasscode(e.target.value)} placeholder="Confirm New Passcode" className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2.5 text-sm" />
        </div>
        {error && <div className="flex items-center gap-1.5 text-red-600 text-xs mt-3"><AlertCircle size={14} /> {error}</div>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-[#D8D5CC] rounded-xl py-2.5 text-sm font-medium">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white flex items-center justify-center gap-1.5" style={{ backgroundColor: "#D4AF37", color: "#1B1F3B" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// Public self-registration — usable WITHOUT logging in, so a brand new
// distributor (or the person recruiting them) can create a joining ID
// directly from the login screen. Unlike the in-tree "+" join flow, both the
// sponsor AND the exact placement slot (parent ID + Left/Right) must be
// typed in here, since there's no logged-in team context to infer them from.
function PublicJoinModal({ users, setUsers, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [sponsorId, setSponsorId] = useState("");
  const [placementId, setPlacementId] = useState("");
  const [position, setPosition] = useState("left");
  const [customId, setCustomId] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !mobile.trim() || !sponsorId.trim() || !placementId.trim()) {
      setError("Name, email, mobile, Sponsor ID and Placement ID are all required");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email ID");
      return;
    }
    const sponsor = findUser(users, sponsorId.trim().toUpperCase());
    if (!sponsor) {
      setError("Sponsor ID not found");
      return;
    }
    const parent = findUser(users, placementId.trim().toUpperCase());
    if (!parent) {
      setError("Placement ID not found");
      return;
    }
    const occupied = getChildren(users, parent.id).find((c) => c.position === position);
    if (occupied) {
      setError(`The ${position.toUpperCase()} slot under ${parent.id} is already filled by ${occupied.id}`);
      return;
    }
    let newId = customId.trim().toUpperCase();
    if (newId) {
      if (findUser(users, newId)) {
        setError("This ID already exists, please choose another ID");
        return;
      }
    } else {
      newId = genId(users);
    }
    const newPassword = customPassword.trim() || genPassword();
    const passwordHash = await hashPassword(newPassword);
    setSaving(true);
    const newUser = {
      id: newId,
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      sponsorId: sponsor.id,
      parentId: parent.id,
      position,
      password: passwordHash,
      joinDate: new Date().toISOString(),
      status: "inactive",
      kyc: {
        aadharNumber: aadharNumber.trim(),
        panNumber: panNumber.trim().toUpperCase(),
        bankAccountName: bankAccountName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        bankName: bankName.trim(),
      },
    };
    const updated = [...users, newUser];
    await saveKey("ez_users", updated);
    setUsers(updated);

    loadKey("ez_mailbox", []).then((mailbox) => {
      mailbox.push({
        to: newUser.email,
        subject: "Welcome to Everzon — Your Distributor ID",
        body: `ID: ${newId}, Password: ${newPassword}`,
        sentAt: new Date().toISOString(),
      });
      saveKey("ez_mailbox", mailbox);
    });

    setSaving(false);
    onSuccess({ id: newId, password: newPassword, name: newUser.name, email: newUser.email });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] max-h-[85dvh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#E5E3DC] shrink-0">
          <div>
            <h3 className="font-display font-bold text-lg text-[#1B1F3B]">Create Your Joining ID</h3>
            <p className="text-[11px] text-[#6E7482] mt-0.5">No login needed — fill this in to register.</p>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 pt-4"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y" }}
        >
          <div className="space-y-3">
            <Field label="Full Name"><input value={name} onChange={(e) => setName(e.target.value)} className="in" /></Field>
            <Field label="Email ID"><input value={email} onChange={(e) => setEmail(e.target.value)} className="in" type="email" /></Field>
            <Field label="Mobile Number"><input value={mobile} onChange={(e) => setMobile(e.target.value)} className="in" /></Field>
            <Field label="Sponsor ID (who referred you)">
              <input
                value={sponsorId}
                onChange={(e) => setSponsorId(e.target.value.toUpperCase())}
                className="in font-mono-tag"
                placeholder="e.g. EVZ1000"
              />
            </Field>
            <Field label="Placement ID (whose team you'll join)">
              <input
                value={placementId}
                onChange={(e) => setPlacementId(e.target.value.toUpperCase())}
                className="in font-mono-tag"
                placeholder="e.g. EVZ1000 (often same as Sponsor ID)"
              />
            </Field>
            <Field label="Position (Left / Right)">
              <select value={position} onChange={(e) => setPosition(e.target.value)} className="in">
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </Field>
            <Field label="Custom ID (optional)">
              <input
                value={customId}
                onChange={(e) => setCustomId(e.target.value.toUpperCase())}
                className="in font-mono-tag"
                placeholder="Leave blank to auto-generate"
              />
            </Field>
            <Field label="Custom Password (optional)">
              <input
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                className="in font-mono-tag"
                placeholder="Leave blank to auto-generate"
              />
            </Field>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E5E3DC]">
            <h4 className="font-display font-semibold text-sm text-[#1B1F3B] mb-1">KYC Details (optional)</h4>
            <p className="text-[11px] text-[#6E7482] mb-3">Aadhar, PAN and bank details can also be added later</p>
            <div className="space-y-3">
              <Field label="Aadhar Number">
                <input value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} className="in font-mono-tag" placeholder="XXXX XXXX XXXX" maxLength={14} />
              </Field>
              <Field label="PAN Number">
                <input value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} className="in font-mono-tag" placeholder="ABCDE1234F" maxLength={10} />
              </Field>
              <Field label="Bank Account Holder Name">
                <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="in" />
              </Field>
              <Field label="Bank Account Number">
                <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="in font-mono-tag" />
              </Field>
              <Field label="IFSC Code">
                <input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} className="in font-mono-tag" placeholder="e.g. SBIN0001234" />
              </Field>
              <Field label="Bank Name">
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="in" />
              </Field>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs mt-3">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="h-2" />
        </div>

        <div className="px-5 py-4 border-t border-[#E5E3DC] shrink-0">
          <button
            onClick={submit}
            disabled={saving}
            className="w-full bg-[#1B1F3B] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Create Joining ID
          </button>
        </div>

        <style>{`.in { width:100%; border:1px solid #D8D5CC; border-radius:8px; padding:8px 10px; font-size:14px; }`}</style>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* DASHBOARD TAB                                                        */
/* ==================================================================== */
function DashboardTab({ currentUser, users, orders, income, isAdmin, carry, cumulativeBV, passwordRequests, onApprovePassword, onRejectPassword, onResetAllData }) {
  const teamSize = useMemo(
    () => (currentUser ? getSubtreeIds(users, currentUser.id).length - 1 : 0),
    [users, currentUser]
  );
  const myIncome = income.filter((i) => i.userId === currentUser?.id);
  const totalIncome = myIncome.reduce((s, i) => s + i.total, 0);
  const myRank = currentUser ? getRank(cumulativeBV?.[currentUser.id] || 0) : null;

  const { leftBV, rightBV } = useMemo(() => {
    if (!currentUser || isAdmin) return { leftBV: 0, rightBV: 0 };
    const weeklyOrders = orders.filter((o) => o.status === "approved" && !o.closedWeek);
    const leftChild = getChildren(users, currentUser.id).find((c) => c.position === "left");
    const rightChild = getChildren(users, currentUser.id).find((c) => c.position === "right");
    const leftIds = leftChild ? getSubtreeIds(users, leftChild.id) : [];
    const rightIds = rightChild ? getSubtreeIds(users, rightChild.id) : [];
    const newLeft = weeklyOrders.filter((o) => leftIds.includes(o.userId)).reduce((s, o) => s + o.bv, 0);
    const newRight = weeklyOrders.filter((o) => rightIds.includes(o.userId)).reduce((s, o) => s + o.bv, 0);
    // Include BV carried forward from previous weekly closings, same as the
    // actual closing calculation, so this preview matches what will really be paid.
    const priorLeft = carry?.[currentUser.id]?.left || 0;
    const priorRight = carry?.[currentUser.id]?.right || 0;
    return { leftBV: priorLeft + newLeft, rightBV: priorRight + newRight };
  }, [users, orders, currentUser, isAdmin, carry]);
  const matchedBV = Math.min(leftBV, rightBV);
  const [showReset, setShowReset] = useState(false);
  const [rankDetail, setRankDetail] = useState(null);

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl p-6 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #1B1F3B 0%, #262C5C 60%, #0F9B8E 140%)" }}
      >
        <Logo size={48} />
        <div>
          <div className="font-display font-bold text-white text-xl">
            {isAdmin ? "Everzon Admin" : currentUser?.name}
          </div>
          <div className="text-[#C9CEDB] text-sm font-mono-tag">
            {isAdmin ? "Full Access" : currentUser?.id}
          </div>
          {!isAdmin && currentUser && (
            <div className="mt-1.5">
              <RankBadge rank={myRank} />
            </div>
          )}
        </div>
      </div>

      {!isAdmin && currentUser && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Status" value={currentUser.status === "hold" ? "On Hold" : currentUser.status === "active" ? "Active" : "Inactive"}
            color={currentUser.status === "active" ? TEAL : "#B3532F"} />
          <StatCard label="Active Since" value={currentUser.status === "active" ? `${daysSince(currentUser.joinDate)} days` : "—"} color={INDIGO} />
          <StatCard label="Team Size" value={teamSize} color={INDIGO} />
          <StatCard label="Total Income" value={`₹${totalIncome.toLocaleString("en-IN")}`} color={GOLD} />
        </div>
      )}

      {!isAdmin && currentUser && (
        <RankLegendCard cumulativeBV={cumulativeBV} currentUser={currentUser} />
      )}


      {!isAdmin && currentUser && (
        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-sm text-[#1B1F3B]">This Week's Business (Left / Right)</h3>
            <span className="text-[9px] font-mono-tag text-[#9298A6]">Until next closing</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#FFF3EC" }}>
              <div className="w-9 h-9 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: "#F97316" }}>
                <GitBranch size={16} color="#FFFFFF" style={{ transform: "scaleX(-1)" }} />
              </div>
              <div className="text-[10px] text-[#6E7482]">Left Leg BV</div>
              <div className="font-display font-bold text-lg" style={{ color: "#F97316" }}>{leftBV}</div>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#F1EBFC" }}>
              <div className="w-9 h-9 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: "#7C3AED" }}>
                <GitBranch size={16} color="#FFFFFF" />
              </div>
              <div className="text-[10px] text-[#6E7482]">Right Leg BV</div>
              <div className="font-display font-bold text-lg" style={{ color: "#7C3AED" }}>{rightBV}</div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 bg-[#FAF9F6] rounded-lg px-3 py-2">
            <span className="text-xs text-[#6E7482]">Matched BV (income basis)</span>
            <span className="font-display font-bold text-sm text-[#0F9B8E]">{matchedBV}</span>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total Distributors" value={Math.max(0, users.length - 1)} color={INDIGO} />
          <StatCard label="Pending Orders" value={orders.filter((o) => o.status === "pending").length} color="#B3532F" />
          <StatCard label="Active IDs" value={users.filter((u) => u.status === "active").length} color={TEAL} />
          <StatCard label="Total Orders" value={orders.length} color={GOLD} />
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-4">
          <h3 className="font-display font-semibold text-sm text-[#1B1F3B] mb-1">Rank Distribution</h3>
          <p className="text-[10px] text-[#9298A6] mb-3">Tap a rank to see who holds it and their income.</p>
          <div className="grid grid-cols-2 gap-2">
            {RANKS.map((r) => {
              const count = users.filter((u) => getRank(cumulativeBV?.[u.id] || 0)?.name === r.name).length;
              return (
                <button
                  key={r.name}
                  onClick={() => setRankDetail(r)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-left"
                  style={{ backgroundColor: `${r.color}1A` }}
                >
                  <div className="flex items-center gap-1.5">
                    <r.icon size={13} fill={r.color} color={r.color} />
                    <span className="text-[11px] font-medium text-[#1B1F3B]">{r.name}</span>
                  </div>
                  <span className="text-xs font-display font-bold" style={{ color: r.color }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {rankDetail && (
        <RankDetailModal
          rank={rankDetail}
          users={users}
          income={income}
          cumulativeBV={cumulativeBV}
          onClose={() => setRankDetail(null)}
        />
      )}

      {isAdmin && (
        <PasswordRequestsCard
          passwordRequests={passwordRequests}
          onApprovePassword={onApprovePassword}
          onRejectPassword={onRejectPassword}
        />
      )}

      {isAdmin && (
        <div className="bg-white rounded-2xl border border-[#B3532F] p-4">
          <h3 className="font-display font-semibold text-sm text-[#B3532F] mb-1">Danger Zone</h3>
          <p className="text-xs text-[#6E7482] mb-3">
            Permanently clears every distributor (except HQ), every order, and every income record. This cannot be undone.
          </p>
          <button
            onClick={() => setShowReset(true)}
            className="text-xs font-semibold rounded-lg px-3 py-2 border border-[#B3532F] text-[#B3532F]"
          >
            Clear All Joinings / Reset All Data
          </button>
        </div>
      )}

      {showReset && (
        <ResetAllDataModal onClose={() => setShowReset(false)} onConfirm={async () => { await onResetAllData(); setShowReset(false); }} />
      )}
    </div>
  );
}

function PasswordRequestsCard({ passwordRequests, onApprovePassword, onRejectPassword }) {
  if (!passwordRequests || passwordRequests.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-[#E5E3DC] p-4">
      <h3 className="font-display font-semibold text-sm text-[#1B1F3B] mb-3">Password Reset Requests ({passwordRequests.length})</h3>
      <div className="space-y-2">
        {passwordRequests.map((r) => (
          <div key={r.userId} className="flex items-center justify-between bg-[#FAF9F6] rounded-lg px-3 py-2">
            <span className="font-mono-tag text-xs text-[#1B1F3B]">{r.userId}</span>
            <div className="flex gap-2">
              <button onClick={() => onApprovePassword(r.userId)} className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#0F9B8E" }}>
                Approve
              </button>
              <button onClick={() => onRejectPassword(r.userId)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#D8D5CC]">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResetAllDataModal({ onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");
  const [saving, setSaving] = useState(false);
  const ready = confirmText.trim().toUpperCase() === "RESET";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center">
        <AlertCircle size={32} className="mx-auto text-[#B3532F]" />
        <h3 className="font-display font-bold text-lg text-[#1B1F3B] mt-3">Clear All Joinings?</h3>
        <p className="text-xs text-[#6E7482] mt-1">
          This will permanently delete every distributor (except HQ), every order, and every income record. This cannot be undone.
        </p>
        <p className="text-xs text-[#3A3F52] mt-3">Type <b>RESET</b> to confirm.</p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2.5 text-sm text-center mt-2"
          placeholder="RESET"
        />
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-[#D8D5CC] rounded-xl py-2.5 text-sm font-medium">Cancel</button>
          <button
            onClick={async () => { setSaving(true); await onConfirm(); setSaving(false); }}
            disabled={!ready || saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-40"
            style={{ backgroundColor: "#B3532F" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Clear Everything
          </button>
        </div>
      </div>
    </div>
  );
}
function StatCard({ label, value, color }) {
  return (
    <div
      className="bg-white rounded-xl border p-4 relative overflow-hidden"
      style={{ borderColor: "#E5E3DC" }}
    >
      <div className="absolute left-0 top-0 bottom-0" style={{ width: 4, backgroundColor: color }} />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundColor: color }} />
      <div className="relative">
        <div className="text-xs text-[#6E7482]">{label}</div>
        <div className="font-display font-bold text-2xl mt-1" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

function RankBadge({ rank, size = "md" }) {
  if (!rank) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${size === "sm" ? "text-[8px] px-1.5 py-0.5" : "text-[10px] px-2 py-1"}`}
        style={{ backgroundColor: "#F4F6F5", color: "#9298A6" }}
      >
        Unranked
      </span>
    );
  }
  const RankIcon = rank.icon || Star;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${size === "sm" ? "text-[8px] px-1.5 py-0.5" : "text-[10px] px-2 py-1"}`}
      style={{ backgroundColor: rank.color, color: rank.textColor }}
    >
      <RankIcon size={size === "sm" ? 8 : 10} fill={rank.textColor} color={rank.textColor} />
      {rank.name}
    </span>
  );
}

function RankLegendCard({ cumulativeBV, currentUser }) {
  const myBV = currentUser ? cumulativeBV?.[currentUser.id] || 0 : null;
  return (
    <div className="bg-white rounded-2xl border border-[#E5E3DC] p-4">
      <h3 className="font-display font-semibold text-sm text-[#1B1F3B] mb-3">Rank Ladder</h3>
      <div className="space-y-2">
        {[...RANKS].reverse().map((r) => {
          const achieved = myBV !== null && myBV >= r.minBV;
          return (
            <div
              key={r.name}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ backgroundColor: achieved ? `${r.color}1A` : "#FAF9F6" }}
            >
              <div className="flex items-center gap-2">
                <r.icon size={13} fill={r.color} color={r.color} />
                <span className="text-xs font-medium text-[#1B1F3B]">{r.name}</span>
                {achieved && <Check size={12} className="text-[#0F9B8E]" />}
              </div>
              <span className="text-[10px] font-mono-tag text-[#6E7482]">{r.minBV.toLocaleString("en-IN")} matched BV</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-[#9298A6] mt-3">
        Rank is based on your all-time cumulative matched (binary) Business Volume. Platinum and above share the Royalty pool; Crown Diamond also shares the Reward pool.
      </p>
    </div>
  );
}

function RankDetailModal({ rank, users, income, cumulativeBV, onClose }) {
  const holders = users.filter((u) => getRank(cumulativeBV?.[u.id] || 0)?.name === rank.name);
  const RankIcon = rank.icon;
  const rows = holders.map((u) => {
    const myIncome = income.filter((i) => i.userId === u.id);
    const totalIncome = myIncome.reduce((s, i) => s + i.total, 0);
    const rankTypeIncome = myIncome.reduce((s, i) => s + (i.rank || 0) + (i.royalty || 0) + (i.reward || 0), 0);
    return { user: u, totalIncome, rankTypeIncome };
  }).sort((a, b) => b.totalIncome - a.totalIncome);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden max-h-[85vh] max-h-[85dvh] flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ backgroundColor: rank.color }}
        >
          <div className="flex items-center gap-2">
            <RankIcon size={18} fill={rank.textColor} color={rank.textColor} />
            <span className="font-display font-bold text-sm" style={{ color: rank.textColor }}>{rank.name} Rank</span>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: rank.textColor }} /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          <p className="text-[11px] text-[#6E7482] mb-3">
            {holders.length === 0
              ? "No one has reached this rank yet."
              : `${holders.length} distributor${holders.length > 1 ? "s" : ""} currently hold this rank, sorted by total income.`}
          </p>
          <div className="space-y-2">
            {rows.map(({ user, totalIncome, rankTypeIncome }) => (
              <div key={user.id} className="border border-[#E5E3DC] rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display font-semibold text-xs text-[#1B1F3B]">{user.name}</div>
                    <div className="font-mono-tag text-[10px] text-[#6E7482]">{user.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-[#9298A6]">Total Income</div>
                    <div className="font-display font-bold text-sm" style={{ color: rank.color }}>₹{totalIncome.toLocaleString("en-IN")}</div>
                  </div>
                </div>
                <div className="text-[10px] text-[#6E7482] mt-1.5 pt-1.5 border-t border-[#F0EFE9]">
                  Rank + Royalty + Reward income (all-time): <span className="font-semibold text-[#1B1F3B]">₹{rankTypeIncome.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const INCOME_TYPES = [
  { key: "binary", label: "Binary", icon: GitBranch, color: TEAL },
  { key: "direct", label: "Direct", icon: UserPlus, color: GOLD },
  { key: "level", label: "Level", icon: Layers, color: INDIGO },
  { key: "rank", label: "Rank", icon: Award, color: "#B3532F" },
  { key: "royalty", label: "Royalty", icon: Crown, color: "#7C3AED" },
  { key: "reward", label: "Reward", icon: Gift, color: "#F97316" },
];

function IncomeBreakdown({ entry }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
      {INCOME_TYPES.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="flex items-center gap-1.5 bg-[#FAF9F6] rounded-lg px-2 py-1.5">
          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
            <Icon size={11} color="#FFFFFF" />
          </div>
          <div className="min-w-0">
            <div className="text-[8px] leading-tight text-[#9298A6]">{label}</div>
            <div className="text-[10px] leading-tight font-semibold text-[#1B1F3B]">₹{entry[key] || 0}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==================================================================== */
/* PRODUCTS TAB                                                         */
/* ==================================================================== */
function ProductsTab({ products, setProducts, isAdmin }) {
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const persist = async (updated) => {
    await saveKey("ez_products", updated);
    setProducts(updated);
  };

  const removeProduct = async (model) => {
    const target = products.find((p) => p.model === model);
    const updated = products.filter((p) => p.model !== model);
    await persist(updated);
    setConfirmDelete(null);
    if (target?.image) deleteImageFromStorage(target.image); // cleans up the Storage file, doesn't block the UI
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl text-[#1B1F3B]">Products</h2>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2"
            style={{ backgroundColor: "#1B1F3B", color: "#FFFFFF" }}
          >
            <Plus size={14} /> Add Product
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {products.map((p) => (
          <div key={p.model} className="bg-white rounded-2xl border border-[#E5E3DC] overflow-hidden relative">
            {isAdmin && (
              <button
                onClick={() => setConfirmDelete(p.model)}
                className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1.5 shadow"
                aria-label="Remove product"
                title="Remove product"
              >
                <X size={14} className="text-[#B3532F]" />
              </button>
            )}
            <div className="h-40 bg-[#F4F6F5]">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
            <div className="p-4">
              <span className="font-mono-tag text-[10px] bg-[#1B1F3B] text-white px-2 py-0.5 rounded-full">{p.model}</span>
              <div className="font-display font-semibold text-[#1B1F3B] mt-2">{p.name}</div>
              <div className="font-display font-bold text-lg text-[#0F9B8E] mt-1">₹{p.price.toLocaleString("en-IN")}</div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-2 text-center text-xs text-[#6E7482] py-10">No products available</div>
        )}
      </div>

      {showAdd && (
        <AddProductModal
          products={products}
          onClose={() => setShowAdd(false)}
          onSave={async (newProduct) => {
            await persist([...products, newProduct]);
            setShowAdd(false);
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center">
            <AlertCircle size={32} className="mx-auto text-[#B3532F]" />
            <h3 className="font-display font-bold text-lg text-[#1B1F3B] mt-3">Remove Product?</h3>
            <p className="text-xs text-[#6E7482] mt-1">
              {confirmDelete} will be removed from the catalog. Past orders will not be affected.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-[#D8D5CC] rounded-xl py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => removeProduct(confirmDelete)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white"
                style={{ backgroundColor: "#B3532F" }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddProductModal({ products, onClose, onSave }) {
  const [model, setModel] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result); // preview only — never saved to Firestore
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setError("");
    if (!model.trim() || !name.trim() || !price) {
      setError("All fields are required");
      return;
    }
    if (products.some((p) => p.model.toUpperCase() === model.trim().toUpperCase())) {
      setError("A product with this model number already exists");
      return;
    }
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      setError("Please enter a valid price");
      return;
    }
    setSaving(true);
    let imageUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0Y0RjZGNSIvPjwvc3ZnPg==";
    if (imageFile) {
      try {
        const path = `product-images/${model.trim().toUpperCase()}-${Date.now()}-${imageFile.name}`;
        imageUrl = await uploadImageToStorage(path, imageFile);
      } catch (e) {
        setSaving(false);
        setError("Image upload failed. Please check your connection and try again.");
        return;
      }
    }
    onSave({
      model: model.trim().toUpperCase(),
      name: name.trim(),
      price: priceNum,
      image: imageUrl,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] max-h-[85dvh] overflow-y-auto"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-[#1B1F3B]">Add Product</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <Field label="Model Number"><input value={model} onChange={(e) => setModel(e.target.value)} className="in" placeholder="e.g. ML-90" /></Field>
          <Field label="Product Name"><input value={name} onChange={(e) => setName(e.target.value)} className="in" /></Field>
          <Field label="Price (₹)"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="in" /></Field>
          <Field label="Product Image (optional)">
            <label className="flex items-center gap-2 border border-dashed border-[#D8D5CC] rounded-lg px-3 py-3 text-xs text-[#6E7482] cursor-pointer">
              <Upload size={14} />
              {imagePreview ? "Image selected" : "Upload photo"}
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
            {imagePreview && <img src={imagePreview} alt="preview" className="w-16 h-16 object-cover rounded-lg mt-2" />}
          </Field>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-red-600 text-xs mt-3">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className="w-full bg-[#1B1F3B] text-white font-medium py-3 rounded-xl mt-5 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? "Uploading..." : "Add Product"}
        </button>
        <style>{`.in { width:100%; border:1px solid #D8D5CC; border-radius:8px; padding:8px 10px; font-size:14px; }`}</style>
      </div>
    </div>
  );
}

function GenealogyTab({ users, setUsers, currentUser, isAdmin, cumulativeBV, onInitializeRoot, initializingRoot }) {
  const [joinSlot, setJoinSlot] = useState(null);
  const [result, setResult] = useState(null);
  const [blockedMsg, setBlockedMsg] = useState("");
  const [manageUser, setManageUser] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [viewRootId, setViewRootId] = useState(null);

  const rootId = users.find((u) => u.position === "root")?.id;
  const displayRootId = viewRootId || rootId;

  const handleSearch = (e) => {
    e.preventDefault();
    const id = searchInput.trim().toUpperCase();
    if (!id) return;
    const found = users.find((u) => u.id.toUpperCase() === id);
    if (!found) {
      setSearchError(`ID "${id}" not found.`);
      return;
    }
    setSearchError("");
    setViewRootId(found.id);
  };

  const allowedParentIds = isAdmin || !currentUser
    ? null
    : new Set(getSubtreeIds(users, currentUser.id));

  const handleSlotClick = (slot) => {
    if (allowedParentIds && !allowedParentIds.has(slot.parentId)) {
      setBlockedMsg("You can only place a joining within your own team (your own left/right downline).");
      return;
    }
    setBlockedMsg("");
    setJoinSlot(slot);
  };

  const toggleHold = async (userId, hold) => {
    const target = findUser(users, userId);
    if (!target) return;
    const updated = users.map((u) => {
      if (u.id !== userId) return u;
      if (hold) {
        return { ...u, preHoldStatus: u.status, status: "hold" };
      }
      return { ...u, status: u.preHoldStatus || "inactive", preHoldStatus: undefined };
    });
    await saveKey("ez_users", updated);
    setUsers(updated);
    setManageUser(null);
  };

  const saveKyc = async (userId, kycUpdates) => {
    const updated = users.map((u) =>
      u.id === userId ? { ...u, kyc: { ...u.kyc, ...kycUpdates } } : u
    );
    await saveKey("ez_users", updated);
    setUsers(updated);
    setManageUser((prev) => (prev && prev.id === userId ? { ...prev, kyc: { ...prev.kyc, ...kycUpdates } } : prev));
  };

  // Admin-only: set/reset any ID's password immediately, without going through
  // the member-submitted request + approval flow. Useful for HQ/root and for
  // fixing an ID whose password was never set correctly.
  const setUserPassword = async (userId, newPasswordHash) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, password: newPasswordHash } : u));
    await saveKey("ez_users", updated);
    setUsers(updated);
  };

  // Admin-only: permanently delete a distributor ID. Only allowed when the ID has no
  // children (a leaf node), so deleting it can never break the binary tree — the
  // LEFT/RIGHT slot under its parent simply becomes an empty, joinable slot again.
  const [deleteError, setDeleteError] = useState("");
  const deleteUser = async (userId) => {
    setDeleteError("");
    const target = findUser(users, userId);
    if (!target || target.position === "root") return;
    const hasChildren = getChildren(users, userId).length > 0;
    if (hasChildren) {
      setDeleteError("This ID has a team under it. Move or delete its LEFT/RIGHT team first.");
      return;
    }
    const updated = users.filter((u) => u.id !== userId);
    await saveKey("ez_users", updated);
    setUsers(updated);
    setManageUser(null);
  };

  // Admin-only: move an ID and its entire downline team to a different LEFT/RIGHT
  // slot anywhere in the tree. Only the moved node's parentId/position change —
  // its children keep pointing at it, so the whole team moves together.
  const [moveTarget, setMoveTarget] = useState(null);
  const moveTeam = async (userId, newParentId, newPosition) => {
    const updated = users.map((u) =>
      u.id === userId ? { ...u, parentId: newParentId, position: newPosition } : u
    );
    await saveKey("ez_users", updated);
    setUsers(updated);
    setMoveTarget(null);
    setManageUser(null);
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-[#1B1F3B] mb-1">Genealogy</h2>
      <p className="text-xs text-[#6E7482] mb-4">
        {isAdmin
          ? "Click an empty slot to place a new joining · click an ID to manage it"
          : "Click an empty slot in your team to place a new joining"}
      </p>

      {blockedMsg && (
        <div className="flex items-center gap-1.5 text-[#B3532F] bg-[#FCEEE9] text-xs rounded-lg px-3 py-2 mb-3">
          <AlertCircle size={14} className="shrink-0" /> {blockedMsg}
        </div>
      )}

      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E7482]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter ID number (e.g. EVZ1001)"
            className="w-full border border-[#D8D5CC] rounded-lg pl-9 pr-3 py-2 text-sm font-mono-tag"
          />
        </div>
        <button type="submit" className="bg-[#1B1F3B] text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0">
          View
        </button>
        {viewRootId && (
          <button
            type="button"
            onClick={() => { setViewRootId(null); setSearchInput(""); setSearchError(""); }}
            className="text-xs text-[#0F9B8E] font-medium shrink-0"
          >
            Back to top
          </button>
        )}
      </form>
      {searchError && (
        <div className="flex items-center gap-1.5 text-[#B3532F] bg-[#FCEEE9] text-xs rounded-lg px-3 py-2 mb-3">
          <AlertCircle size={14} className="shrink-0" /> {searchError}
        </div>
      )}
      {viewRootId && !searchError && (
        <div className="bg-[#EAF4F2] text-xs text-[#0F9B8E] rounded-lg px-3 py-2 mb-3 font-mono-tag">
          Showing: team below {viewRootId}
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="min-w-max flex justify-center">
          {displayRootId ? (
            <TreeNode
              users={users}
              nodeId={displayRootId}
              onSlotClick={handleSlotClick}
              allowedParentIds={allowedParentIds}
              isAdmin={isAdmin}
              cumulativeBV={cumulativeBV}
              onNodeClick={isAdmin ? (node) => setManageUser(node) : undefined}
            />
          ) : (
            <div className="w-full max-w-sm bg-white border border-[#E5E3DC] rounded-2xl p-6 text-center mx-auto">
              <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center" style={{ backgroundColor: "#FCEEE9" }}>
                <AlertCircle size={22} className="text-[#B3532F]" />
              </div>
              <h3 className="font-display font-bold text-base text-[#1B1F3B] mt-3">No HQ ID Found</h3>
              <p className="text-xs text-[#6E7482] mt-1">
                {isAdmin
                  ? "The tree is empty because there's no root (HQ) ID set up yet. This can happen if the first-time setup didn't complete. Create it now to start building your tree."
                  : "The distributor tree hasn't been set up yet. Please check back later or contact your admin."}
              </p>
              {isAdmin && (
                <button
                  onClick={onInitializeRoot}
                  disabled={initializingRoot}
                  className="mt-4 flex items-center justify-center gap-2 mx-auto text-sm font-medium rounded-xl px-5 py-2.5 text-white disabled:opacity-50"
                  style={{ backgroundColor: "#1B1F3B" }}
                >
                  {initializingRoot ? <Loader2 size={15} className="animate-spin" /> : null}
                  Initialize HQ ID (EVZ1000)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {joinSlot && (
        <JoinModal
          users={users}
          setUsers={setUsers}
          slot={joinSlot}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onClose={() => setJoinSlot(null)}
          onSuccess={(res) => {
            setJoinSlot(null);
            setResult(res);
          }}
        />
      )}

      {result && <CredentialsModal result={result} onClose={() => setResult(null)} />}

      {manageUser && (
        <ManageUserModal
          user={manageUser}
          users={users}
          isAdmin={isAdmin}
          deleteError={deleteError}
          cumulativeBV={cumulativeBV}
          onClose={() => { setManageUser(null); setDeleteError(""); }}
          onHold={() => toggleHold(manageUser.id, true)}
          onUnhold={() => toggleHold(manageUser.id, false)}
          onSaveKyc={saveKyc}
          onDelete={() => deleteUser(manageUser.id)}
          onMove={() => setMoveTarget(manageUser)}
          onSetPassword={(newHash) => setUserPassword(manageUser.id, newHash)}
        />
      )}

      {moveTarget && (
        <MoveTeamModal
          node={moveTarget}
          users={users}
          onClose={() => setMoveTarget(null)}
          onMove={moveTeam}
        />
      )}
    </div>
  );
}

function ManageUserModal({ user, users, isAdmin, deleteError, cumulativeBV, onClose, onHold, onUnhold, onSaveKyc, onDelete, onMove, onSetPassword }) {
  const isHeld = user.status === "hold";
  const isRoot = user.position === "root";
  const hasChildren = users ? getChildren(users, user.id).length > 0 : false;
  const rank = getRank(cumulativeBV?.[user.id] || 0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const submitPassword = async () => {
    setPassError("");
    if (!newPass.trim() || newPass.length < 6) {
      setPassError("Password must be at least 6 characters");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("Passwords do not match");
      return;
    }
    setPassSaving(true);
    const hash = await hashPassword(newPass);
    await onSetPassword(hash);
    setPassSaving(false);
    setPassSuccess(true);
    setNewPass("");
    setConfirmPass("");
  };
  const kyc = user.kyc || {};
  const hasKyc = kyc.aadharNumber || kyc.panNumber || kyc.bankAccountNumber;
  const [editing, setEditing] = useState(false);
  const [panNumber, setPanNumber] = useState(kyc.panNumber || "");
  const [bankAccountName, setBankAccountName] = useState(kyc.bankAccountName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(kyc.bankAccountNumber || "");
  const [bankIfsc, setBankIfsc] = useState(kyc.bankIfsc || "");
  const [bankName, setBankName] = useState(kyc.bankName || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSaveKyc(user.id, {
      panNumber: panNumber.trim().toUpperCase(),
      bankAccountName: bankAccountName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankIfsc: bankIfsc.trim().toUpperCase(),
      bankName: bankName.trim(),
    });
    setSaving(false);
    setEditing(false);
  };

  const handleRemovePan = async () => {
    setPanNumber("");
    setSaving(true);
    await onSaveKyc(user.id, { panNumber: "" });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white w-full max-w-sm rounded-2xl p-6 text-center max-h-[85vh] max-h-[85dvh] overflow-y-auto"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y" }}
      >
        <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center" style={{ backgroundColor: "#1B1F3B" }}>
          <ShieldCheck size={22} color="#FFFFFF" />
        </div>
        <h3 className="font-display font-bold text-lg text-[#1B1F3B] mt-3">{user.name}</h3>
        <div className="font-mono-tag text-xs mt-0.5 flex items-center justify-center gap-1" style={{ color: rank ? rank.color : "#6E7482" }}>
          {rank && <rank.icon size={12} fill={rank.color} color={rank.color} />}
          {user.id}
        </div>
        {rank && (
          <div className="mt-1.5 flex justify-center">
            <RankBadge rank={rank} />
          </div>
        )}
        <div className={`text-xs font-medium mt-2 ${isHeld ? "text-[#B3532F]" : "text-[#0F9B8E]"}`}>
          {isHeld ? "This ID is currently on hold" : "This ID is active"}
        </div>

        {!isRoot && (
          <div className="text-left mt-4 bg-[#F4F6F5] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-display font-semibold text-xs text-[#1B1F3B]">KYC Details</h4>
              {!editing && (
                <button onClick={() => setEditing(true)} className="text-[11px] text-[#0F9B8E] font-medium">
                  Edit
                </button>
              )}
            </div>

            {!editing ? (
              !hasKyc ? (
                <p className="text-[11px] text-[#6E7482]">KYC not submitted yet</p>
              ) : (
                <div className="space-y-2 text-[11px] text-[#3A3F52]">
                  {kyc.aadharNumber && <div><b>Aadhar No:</b> {kyc.aadharNumber}</div>}
                  {kyc.panNumber && <div><b>PAN No:</b> {kyc.panNumber}</div>}
                  {kyc.bankAccountName && <div><b>A/C Name:</b> {kyc.bankAccountName}</div>}
                  {kyc.bankAccountNumber && <div><b>A/C No:</b> {kyc.bankAccountNumber}</div>}
                  {kyc.bankIfsc && <div><b>IFSC:</b> {kyc.bankIfsc}</div>}
                  {kyc.bankName && <div><b>Bank:</b> {kyc.bankName}</div>}
                </div>
              )
            ) : (
              <div className="space-y-2">
                {kyc.aadharNumber && (
                  <div className="text-[11px] text-[#3A3F52]"><b>Aadhar No:</b> {kyc.aadharNumber}</div>
                )}
                <div>
                  <label className="text-[10px] text-[#6E7482]">PAN Number</label>
                  <div className="flex gap-1.5">
                    <input value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} className="in font-mono-tag flex-1" placeholder="ABCDE1234F" />
                    {panNumber && (
                      <button onClick={handleRemovePan} className="text-[10px] text-[#B3532F] font-medium px-2 border border-[#B3532F] rounded-lg shrink-0">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#6E7482]">A/C Holder Name</label>
                  <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="in" />
                </div>
                <div>
                  <label className="text-[10px] text-[#6E7482]">A/C Number</label>
                  <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="in font-mono-tag" />
                </div>
                <div>
                  <label className="text-[10px] text-[#6E7482]">IFSC Code</label>
                  <input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} className="in font-mono-tag" />
                </div>
                <div>
                  <label className="text-[10px] text-[#6E7482]">Bank Name</label>
                  <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="in" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditing(false)} className="flex-1 border border-[#D8D5CC] rounded-lg py-2 text-xs font-medium">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-lg py-2 text-xs font-medium text-white flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: "#1B1F3B" }}
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                    Save
                  </button>
                </div>
                <style>{`.in { width:100%; border:1px solid #D8D5CC; border-radius:8px; padding:6px 8px; font-size:12px; }`}</style>
              </div>
            )}
          </div>
        )}

        {isRoot ? (
          <p className="text-xs text-[#6E7482] mt-4">The HQ ID cannot be put on hold, moved, or deleted — but its password can still be set below.</p>
        ) : (
          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 border border-[#D8D5CC] rounded-xl py-2.5 text-sm font-medium">
              Cancel
            </button>
            {isHeld ? (
              <button onClick={onUnhold} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white" style={{ backgroundColor: "#0F9B8E" }}>
                Unhold
              </button>
            ) : (
              <button onClick={onHold} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white" style={{ backgroundColor: "#B3532F" }}>
                Hold ID
              </button>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-[#E5E3DC] text-left">
            <h4 className="font-display font-semibold text-xs text-[#1B1F3B] mb-2 text-center">Admin Actions</h4>

            {!isRoot && (
              <button
                onClick={onMove}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg py-2.5 border border-[#7C3AED] text-[#7C3AED] mb-2"
              >
                <GitBranch size={13} /> Move Team to Another Slot
              </button>
            )}

            {!settingPassword ? (
              <button
                onClick={() => { setSettingPassword(true); setPassSuccess(false); }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg py-2.5 border border-[#0F9B8E] text-[#0F9B8E] mb-2"
              >
                <ShieldCheck size={13} /> Set / Reset Password
              </button>
            ) : (
              <div className="bg-[#EAF4F2] rounded-lg p-3 mb-2 text-left">
                {passSuccess ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#0F9B8E]">
                    <Check size={14} /> Password updated for {user.id}.
                  </div>
                ) : (
                  <>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="New password"
                      className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2 text-xs mb-2"
                    />
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full border border-[#D8D5CC] rounded-lg px-3 py-2 text-xs mb-2"
                    />
                    {passError && <p className="text-[11px] text-[#B3532F] mb-2">{passError}</p>}
                  </>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setSettingPassword(false); setNewPass(""); setConfirmPass(""); setPassError(""); }} className="flex-1 border border-[#D8D5CC] rounded-lg py-2 text-xs font-medium bg-white">
                    {passSuccess ? "Close" : "Cancel"}
                  </button>
                  {!passSuccess && (
                    <button
                      onClick={submitPassword}
                      disabled={passSaving}
                      className="flex-1 rounded-lg py-2 text-xs font-medium text-white flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: "#0F9B8E" }}
                    >
                      {passSaving ? <Loader2 size={12} className="animate-spin" /> : null}
                      Save Password
                    </button>
                  )}
                </div>
              </div>
            )}

            {!isRoot && (
              <>
                {!confirmingDelete ? (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg py-2.5 border border-[#B3532F] text-[#B3532F]"
                  >
                    <X size={13} /> Delete ID Permanently
                  </button>
                ) : (
                  <div className="bg-[#FCEEE9] rounded-lg p-3">
                    <p className="text-[11px] text-[#B3532F] mb-2">
                      {hasChildren
                        ? "This ID has a team under it. Move or delete its LEFT/RIGHT team first."
                        : "This permanently deletes this ID. The slot becomes empty and can be filled again. This cannot be undone."}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmingDelete(false)} className="flex-1 border border-[#D8D5CC] rounded-lg py-2 text-xs font-medium bg-white">
                        Cancel
                      </button>
                      <button
                        onClick={onDelete}
                        disabled={hasChildren}
                        className="flex-1 rounded-lg py-2 text-xs font-medium text-white disabled:opacity-40"
                        style={{ backgroundColor: "#B3532F" }}
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
                {deleteError && <p className="text-[11px] text-[#B3532F] mt-2">{deleteError}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MoveTeamModal({ node, users, onClose, onMove }) {
  const [targetParentId, setTargetParentId] = useState("");
  const [targetPosition, setTargetPosition] = useState("left");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    const pid = targetParentId.trim().toUpperCase();
    if (!pid) {
      setError("Enter a target ID");
      return;
    }
    const targetParent = findUser(users, pid);
    if (!targetParent) {
      setError("Target ID not found");
      return;
    }
    if (pid === node.id) {
      setError("Cannot move a team under itself");
      return;
    }
    const subtreeIds = new Set(getSubtreeIds(users, node.id));
    if (subtreeIds.has(pid)) {
      setError("Cannot move a team under its own downline");
      return;
    }
    const occupied = getChildren(users, pid).find((c) => c.position === targetPosition);
    if (occupied) {
      setError(`The ${targetPosition.toUpperCase()} slot under ${pid} is already occupied by ${occupied.id}`);
      return;
    }
    if (targetParent.id === node.parentId && targetPosition === node.position) {
      setError("This is already this team's current slot");
      return;
    }
    setSaving(true);
    await onMove(node.id, pid, targetPosition);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center" style={{ backgroundColor: "#7C3AED" }}>
            <GitBranch size={22} color="#FFFFFF" />
          </div>
          <h3 className="font-display font-bold text-lg text-[#1B1F3B] mt-3">Move Team</h3>
          <p className="text-xs text-[#6E7482] mt-1">
            Move <b className="font-mono-tag">{node.id}</b> ({node.name}) and its entire downline team to a new LEFT/RIGHT slot anywhere in the tree.
          </p>
        </div>

        <div className="space-y-3 mt-4 text-left">
          <Field label="Target Parent ID">
            <input
              value={targetParentId}
              onChange={(e) => setTargetParentId(e.target.value.toUpperCase())}
              className="in font-mono-tag"
              placeholder="e.g. EVZ1005"
            />
          </Field>
          <Field label="Target Position">
            <select value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)} className="in">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </Field>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-red-600 text-xs mt-3">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-[#D8D5CC] rounded-xl py-2.5 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white flex items-center justify-center gap-1.5"
            style={{ backgroundColor: "#7C3AED" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Move Team
          </button>
        </div>
        <style>{`.in { width:100%; border:1px solid #D8D5CC; border-radius:8px; padding:8px 10px; font-size:14px; }`}</style>
      </div>
    </div>
  );
}

const TreeNode = React.memo(function TreeNode({ users, nodeId, onSlotClick, allowedParentIds, isAdmin, cumulativeBV, onNodeClick }) {
  const node = findUser(users, nodeId);
  if (!node) return null;
  const left = getChildren(users, nodeId).find((c) => c.position === "left");
  const right = getChildren(users, nodeId).find((c) => c.position === "right");
  const canJoinHere = !allowedParentIds || allowedParentIds.has(nodeId);
  const isHeld = node.status === "hold";
  const rank = getRank(cumulativeBV?.[node.id] || 0);

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={onNodeClick ? () => onNodeClick(node) : undefined}
        className={`rounded-xl px-3 py-2 text-center border-2 ${onNodeClick ? "cursor-pointer" : ""} ${
          isHeld
            ? "border-[#B3532F] bg-[#FCEEE9]"
            : node.status === "active"
            ? "border-[#0F9B8E] bg-[#EAF4F2]"
            : "border-[#D8D5CC] bg-white"
        }`}
        style={{ minWidth: 110, boxShadow: rank ? `0 0 0 2px ${rank.color}` : "none" }}
      >
        <div className="font-mono-tag text-[10px] font-semibold flex items-center justify-center gap-1" style={{ color: rank ? rank.color : "#6E7482" }}>
          {rank && <rank.icon size={10} fill={rank.color} color={rank.color} />}
          {node.id}
        </div>
        <div className="font-display font-medium text-xs text-[#1B1F3B] truncate max-w-[100px] mx-auto">{node.name}</div>
        <div className={`text-[9px] mt-0.5 font-medium ${isHeld ? "text-[#B3532F]" : node.status === "active" ? "text-[#0F9B8E]" : "text-[#B3532F]"}`}>
          {isHeld ? "On Hold" : node.status === "active" ? "Active" : node.status === "root" ? "HQ" : "Inactive"}
        </div>
        {rank && (
          <div className="mt-1 flex justify-center">
            <RankBadge rank={rank} size="sm" />
          </div>
        )}
      </div>

      <div className="flex gap-6 mt-3 relative">
        <div className="absolute left-1/2 -top-3 w-px h-3 bg-[#D8D5CC]" />
        <div className="flex flex-col items-center">
          {left ? (
            <TreeNode users={users} nodeId={left.id} onSlotClick={onSlotClick} allowedParentIds={allowedParentIds} isAdmin={isAdmin} cumulativeBV={cumulativeBV} onNodeClick={onNodeClick} />
          ) : (
            <EmptySlot
              label="LEFT"
              locked={!canJoinHere}
              onClick={() => onSlotClick({ parentId: nodeId, position: "left" })}
            />
          )}
        </div>
        <div className="flex flex-col items-center">
          {right ? (
            <TreeNode users={users} nodeId={right.id} onSlotClick={onSlotClick} allowedParentIds={allowedParentIds} isAdmin={isAdmin} cumulativeBV={cumulativeBV} onNodeClick={onNodeClick} />
          ) : (
            <EmptySlot
              label="RIGHT"
              locked={!canJoinHere}
              onClick={() => onSlotClick({ parentId: nodeId, position: "right" })}
            />
          )}
        </div>
      </div>
    </div>
  );
});
function EmptySlot({ label, onClick, locked }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
        locked
          ? "border-[#D8D5CC] bg-[#F4F6F5] cursor-not-allowed"
          : "border-[#0F9B8E] hover:bg-[#EAF4F2]"
      }`}
      style={{ minWidth: 110, minHeight: 56 }}
    >
      <Plus size={16} className={locked ? "text-[#9298A6]" : "text-[#0F9B8E]"} />
      <span className={`text-[9px] font-mono-tag ${locked ? "text-[#9298A6]" : "text-[#0F9B8E]"}`}>{label}</span>
    </button>
  );
}

function JoinModal({ users, setUsers, slot, currentUser, isAdmin, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [sponsorId, setSponsorId] = useState(!isAdmin && currentUser ? currentUser.id : "");
  const [position, setPosition] = useState(slot.position);
  const [customId, setCustomId] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !mobile.trim() || !sponsorId.trim()) {
      setError("All fields are required");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid Gmail/email ID");
      return;
    }
    const sponsor = findUser(users, sponsorId.trim().toUpperCase());
    if (!sponsor) {
      setError("Sponsor ID not found");
      return;
    }
    let newId = customId.trim().toUpperCase();
    if (newId) {
      if (findUser(users, newId)) {
        setError("This ID already exists, please choose another ID");
        return;
      }
    } else {
      newId = genId(users);
    }
    const newPassword = customPassword.trim() || genPassword();
    const passwordHash = await hashPassword(newPassword);
    setSaving(true);
    const newUser = {
      id: newId,
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      sponsorId: sponsor.id,
      parentId: slot.parentId,
      position,
      password: passwordHash,
      joinDate: new Date().toISOString(),
      status: "inactive",
      kyc: {
        aadharNumber: aadharNumber.trim(),
        panNumber: panNumber.trim().toUpperCase(),
        bankAccountName: bankAccountName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        bankName: bankName.trim(),
      },
    };
    const updated = [...users, newUser];
    await saveKey("ez_users", updated);
    setUsers(updated);

    loadKey("ez_mailbox", []).then((mailbox) => {
      mailbox.push({
        to: newUser.email,
        subject: "Welcome to Everzon — Your Distributor ID",
        body: `ID: ${newId}, Password: ${newPassword}`,
        sentAt: new Date().toISOString(),
      });
      saveKey("ez_mailbox", mailbox);
    });

    setSaving(false);
    onSuccess({ id: newId, password: newPassword, name: newUser.name, email: newUser.email });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] max-h-[85dvh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#E5E3DC] shrink-0">
          <h3 className="font-display font-bold text-lg text-[#1B1F3B]">New Joining</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 pt-4"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y" }}
        >
          <div className="bg-[#EAF4F2] text-xs text-[#0F9B8E] rounded-lg px-3 py-2 mb-4 font-mono-tag">
            Placed under: {slot.parentId} — {slot.position.toUpperCase()}
          </div>

          <div className="space-y-3">
            <Field label="Full Name"><input value={name} onChange={(e) => setName(e.target.value)} className="in" /></Field>
            <Field label="Gmail ID"><input value={email} onChange={(e) => setEmail(e.target.value)} className="in" type="email" /></Field>
            <Field label="Mobile Number"><input value={mobile} onChange={(e) => setMobile(e.target.value)} className="in" /></Field>
            <Field label="Sponsor ID">
              <input
                value={sponsorId}
                onChange={(e) => setSponsorId(e.target.value.toUpperCase())}
                className="in"
                placeholder="e.g. EVZ1000"
                readOnly={!isAdmin && !!currentUser}
                style={!isAdmin && currentUser ? { backgroundColor: "#F4F6F5", color: "#6E7482" } : undefined}
              />
            </Field>
            <Field label="Position (Left / Right)">
              <select value={position} onChange={(e) => setPosition(e.target.value)} className="in">
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </Field>
            <Field label="Custom ID (optional)">
              <input
                value={customId}
                onChange={(e) => setCustomId(e.target.value.toUpperCase())}
                className="in font-mono-tag"
                placeholder="Leave blank to auto-generate"
              />
            </Field>
            <Field label="Custom Password (optional)">
              <input
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                className="in font-mono-tag"
                placeholder="Leave blank to auto-generate"
              />
            </Field>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E5E3DC]">
            <h4 className="font-display font-semibold text-sm text-[#1B1F3B] mb-1">KYC Details (optional)</h4>
            <p className="text-[11px] text-[#6E7482] mb-3">Aadhar, PAN and bank details can also be added later</p>
            <div className="space-y-3">
              <Field label="Aadhar Number">
                <input value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} className="in font-mono-tag" placeholder="XXXX XXXX XXXX" maxLength={14} />
              </Field>
              <Field label="PAN Number">
                <input value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} className="in font-mono-tag" placeholder="ABCDE1234F" maxLength={10} />
              </Field>
              <Field label="Bank Account Holder Name">
                <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="in" />
              </Field>
              <Field label="Bank Account Number">
                <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="in font-mono-tag" />
              </Field>
              <Field label="IFSC Code">
                <input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} className="in font-mono-tag" placeholder="e.g. SBIN0001234" />
              </Field>
              <Field label="Bank Name">
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="in" />
              </Field>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs mt-3">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="h-2" />
        </div>

        <div className="px-5 py-4 border-t border-[#E5E3DC] shrink-0">
          <button
            onClick={submit}
            disabled={saving}
            className="w-full bg-[#1B1F3B] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Join
          </button>
        </div>

        <style>{`.in { width:100%; border:1px solid #D8D5CC; border-radius:8px; padding:8px 10px; font-size:14px; }`}</style>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-[#3A3F52] block mb-1">{label}</label>
      {children}
    </div>
  );
}

function CredentialsModal({ result, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(`ID: ${result.id}\nPassword: ${result.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center">
        <Check size={36} className="mx-auto text-[#0F9B8E]" />
        <h3 className="font-display font-bold text-lg text-[#1B1F3B] mt-3">Joining Successful!</h3>
        <p className="text-xs text-[#6E7482] mt-1">{result.name}'s ID has been created</p>

        <div className="bg-[#F4F6F5] rounded-xl p-4 mt-4 text-left space-y-2">
          <div>
            <div className="text-[10px] text-[#6E7482]">Distributor ID</div>
            <div className="font-mono-tag font-bold text-[#1B1F3B]">{result.id}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#6E7482]">Password</div>
            <div className="font-mono-tag font-bold text-[#1B1F3B]">{result.password}</div>
          </div>
        </div>

        <div className="flex items-start gap-1.5 text-[10px] text-[#B3532F] bg-[#FCEEE9] rounded-lg p-2.5 mt-3 text-left">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          Email is currently simulated (won't reach a real inbox) — once a backend email service is connected, it will also be sent to {result.email}.
        </div>

        <button onClick={copy} className="w-full border border-[#D8D5CC] rounded-xl py-2.5 mt-4 text-sm font-medium flex items-center justify-center gap-2">
          {copied ? <Check size={15} className="text-[#0F9B8E]" /> : <Copy size={15} />}
          {copied ? "Copied!" : "Copy ID & Password"}
        </button>
        <button onClick={onClose} className="w-full bg-[#1B1F3B] text-white rounded-xl py-2.5 mt-2 text-sm font-medium">
          Done
        </button>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* ORDERS TAB                                                           */
/* ==================================================================== */
function OrdersTab({ users, setUsers, orders, setOrders, payment, setPayment, products, currentUser, isAdmin, passwordRequests, onApprovePassword, onRejectPassword }) {
  const [cart, setCart] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const total = Object.entries(cart).reduce((sum, [model, qty]) => {
    const p = products.find((pr) => pr.model === model);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const placeOrder = async () => {
    if (!currentUser || total === 0) return;
    setPlacing(true);
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([model, qty]) => {
        const p = products.find((pr) => pr.model === model);
        return { model, name: p.name, qty, price: p.price };
      });
    const newOrder = {
      orderId: `ORD${Date.now().toString().slice(-8)}`,
      userId: currentUser.id,
      items,
      total,
      bv: total,
      status: "pending",
      closedWeek: null,
      createdAt: new Date().toISOString(),
    };
    const updated = [...orders, newOrder];
    await saveKey("ez_orders", updated);
    setOrders(updated);
    setCart({});
    setPlacing(false);
    setPlaced(true);
    setTimeout(() => setPlaced(false), 2500);
  };

  const approveOrder = async (orderId, approve) => {
    const updatedOrders = orders.map((o) =>
      o.orderId === orderId ? { ...o, status: approve ? "approved" : "rejected" } : o
    );
    await saveKey("ez_orders", updatedOrders);
    setOrders(updatedOrders);

    if (approve) {
      const order = orders.find((o) => o.orderId === orderId);
      const updatedUsers = users.map((u) =>
        u.id === order.userId && u.status !== "active" && u.status !== "hold" ? { ...u, status: "active" } : u
      );
      await saveKey("ez_users", updatedUsers);
      setUsers(updatedUsers);
    }
  };

  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrError, setQrError] = useState("");
  const uploadQr = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrError("");
    setUploadingQr(true);
    try {
      const oldQr = payment.qr;
      const url = await uploadImageToStorage(`payment-qr/qr-${Date.now()}-${file.name}`, file);
      const updated = { ...payment, qr: url };
      await saveKey("ez_payment", updated);
      setPayment(updated);
      if (oldQr) deleteImageFromStorage(oldQr);
    } catch (err) {
      setQrError("QR upload failed. Please check your connection and try again.");
    }
    setUploadingQr(false);
  };
  const updatePaymentField = async (field, value) => {
    const updated = { ...payment, [field]: value };
    setPayment(updated);
    await saveKey("ez_payment", updated);
  };

  if (isAdmin) {
    const pending = orders.filter((o) => o.status === "pending");
    const rest = orders.filter((o) => o.status !== "pending");
    return (
      <div>
        <h2 className="font-display font-bold text-xl text-[#1B1F3B] mb-4">Orders — Admin</h2>

        <div className="mb-5">
          <PasswordRequestsCard
            passwordRequests={passwordRequests}
            onApprovePassword={onApprovePassword}
            onRejectPassword={onRejectPassword}
          />
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-4 mb-5">
          <h3 className="font-display font-semibold text-sm text-[#1B1F3B] mb-3">Payment Settings (visible to distributors)</h3>
          <div className="space-y-2">
            <input placeholder="UPI ID" value={payment.upiId} onChange={(e) => updatePaymentField("upiId", e.target.value)} className="in" />
            <input placeholder="Account Name" value={payment.accountName} onChange={(e) => updatePaymentField("accountName", e.target.value)} className="in" />
            <input placeholder="Account Number" value={payment.accountNumber} onChange={(e) => updatePaymentField("accountNumber", e.target.value)} className="in" />
            <input placeholder="IFSC" value={payment.ifsc} onChange={(e) => updatePaymentField("ifsc", e.target.value)} className="in" />
            <label className="flex items-center gap-2 text-xs text-[#0F9B8E] cursor-pointer mt-2">
              {uploadingQr ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploadingQr ? "Uploading..." : "QR Code Upload"}
              <input type="file" accept="image/*" onChange={uploadQr} className="hidden" disabled={uploadingQr} />
            </label>
            {qrError && <p className="text-[11px] text-[#B3532F]">{qrError}</p>}
            {payment.qr && <img src={payment.qr} alt="QR" className="w-24 h-24 object-contain border border-[#E5E3DC] rounded-lg mt-1" />}
          </div>
        </div>

        <h3 className="font-display font-semibold text-sm text-[#1B1F3B] mb-2">Pending Approval ({pending.length})</h3>
        <div className="space-y-3 mb-6">
          {pending.length === 0 && <p className="text-xs text-[#6E7482]">No pending orders</p>}
          {pending.map((o) => (
            <div key={o.orderId} className="bg-white rounded-xl border border-[#E5E3DC] p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono-tag text-xs text-[#6E7482]">{o.orderId} · {o.userId}</div>
                  <div className="text-sm mt-1">{o.items.map((it) => `${it.name} x${it.qty}`).join(", ")}</div>
                </div>
                <div className="font-display font-bold text-[#1B1F3B]">₹{o.total.toLocaleString("en-IN")}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => approveOrder(o.orderId, true)} className="flex-1 bg-[#0F9B8E] text-white text-xs font-medium py-2 rounded-lg">Approve</button>
                <button onClick={() => approveOrder(o.orderId, false)} className="flex-1 border border-[#D8D5CC] text-xs font-medium py-2 rounded-lg">Reject</button>
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-display font-semibold text-sm text-[#1B1F3B] mb-2">History</h3>
        <div className="space-y-2">
          {rest.map((o) => (
            <div key={o.orderId} className="bg-white rounded-xl border border-[#E5E3DC] p-3 flex justify-between text-xs">
              <span className="font-mono-tag">{o.orderId} · {o.userId}</span>
              <span className={o.status === "approved" ? "text-[#0F9B8E]" : "text-red-500"}>{o.status}</span>
            </div>
          ))}
        </div>
        <style>{`.in { width:100%; border:1px solid #D8D5CC; border-radius:8px; padding:8px 10px; font-size:13px; }`}</style>
      </div>
    );
  }

  const myOrders = orders.filter((o) => o.userId === currentUser?.id);

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-[#1B1F3B] mb-4">Place Order</h2>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.model} className="bg-white rounded-xl border border-[#E5E3DC] p-3 flex items-center gap-3">
            <img src={p.image} alt={p.name} className="w-14 h-14 rounded-lg object-cover" loading="lazy" decoding="async" />
            <div className="flex-1">
              <div className="text-sm font-medium text-[#1B1F3B]">{p.name}</div>
              <div className="text-xs text-[#6E7482]">₹{p.price.toLocaleString("en-IN")}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCart((c) => ({ ...c, [p.model]: Math.max(0, (c[p.model] || 0) - 1) }))} className="w-7 h-7 rounded-full border border-[#D8D5CC]">-</button>
              <span className="w-5 text-center text-sm">{cart[p.model] || 0}</span>
              <button onClick={() => setCart((c) => ({ ...c, [p.model]: (c[p.model] || 0) + 1 }))} className="w-7 h-7 rounded-full border border-[#D8D5CC]">+</button>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="bg-[#1B1F3B] rounded-xl p-4 mt-4 flex items-center justify-between">
          <span className="text-white text-sm">Total</span>
          <span className="text-white font-display font-bold text-lg">₹{total.toLocaleString("en-IN")}</span>
        </div>
      )}

      <button
        onClick={placeOrder}
        disabled={total === 0 || placing}
        className="w-full bg-[#0F9B8E] text-white font-medium py-3 rounded-xl mt-4 disabled:opacity-40"
      >
        {placing ? "Placing..." : "Place Order"}
      </button>
      {placed && <div className="text-center text-xs text-[#0F9B8E] mt-2">Order placed — please wait for admin approval</div>}

      <div className="bg-white rounded-2xl border border-[#E5E3DC] p-4 mt-6">
        <h3 className="font-display font-semibold text-sm text-[#1B1F3B] mb-3 flex items-center gap-2">
          <QrCode size={16} /> Make Payment
        </h3>
        {payment.qr && <img src={payment.qr} alt="Payment QR" className="w-32 h-32 object-contain mx-auto border border-[#E5E3DC] rounded-lg mb-3" />}
        <div className="text-xs space-y-1 text-[#3A3F52]">
          {payment.upiId && <div><b>UPI ID:</b> {payment.upiId}</div>}
          {payment.accountName && <div><b>A/C Name:</b> {payment.accountName}</div>}
          {payment.accountNumber && <div><b>A/C No:</b> {payment.accountNumber}</div>}
          {payment.ifsc && <div><b>IFSC:</b> {payment.ifsc}</div>}
          {!payment.upiId && !payment.qr && <div className="text-[#B3532F]">Admin has not set payment details yet</div>}
        </div>
      </div>

      {myOrders.length > 0 && (
        <div className="mt-6">
          <h3 className="font-display font-semibold text-sm text-[#1B1F3B] mb-2">My Orders</h3>
          <div className="space-y-2">
            {myOrders.map((o) => (
              <div key={o.orderId} className="bg-white rounded-xl border border-[#E5E3DC] p-3 flex justify-between text-xs">
                <span className="font-mono-tag">{o.orderId}</span>
                <span className={o.status === "approved" ? "text-[#0F9B8E]" : o.status === "rejected" ? "text-red-500" : "text-[#B3532F]"}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`.in { width:100%; border:1px solid #D8D5CC; border-radius:8px; padding:8px 10px; font-size:13px; }`}</style>
    </div>
  );
}

/* ==================================================================== */
/* INCOME TAB                                                           */
/* ==================================================================== */
function IncomeTab({ users, orders, setOrders, income, setIncome, carry, setCarry, cumulativeBV, currentUser, isAdmin }) {
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const runWeeklyClosing = async () => {
    setRunning(true);
    const weekLabel = new Date().toISOString().slice(0, 10);
    const unclosed = orders.filter((o) => o.status === "approved" && !o.closedWeek);

    if (unclosed.length === 0) {
      setRunning(false);
      setLastRun("No new approved orders found in this cycle");
      return;
    }

    // Read the SAME carry that the Dashboard preview uses (passed down from app state),
    // instead of a separate loadKey call, so the two never fall out of sync.
    const lifetimeBinary = await loadKey("ez_binary_lifetime", {});
    const cumulativeMatchedBV = await loadKey("ez_cumulative_bv", {});

    const totalCycleBV = unclosed.reduce((s, o) => s + o.bv, 0);
    const availablePool = totalCycleBV * BINARY_PCT;

    const binaryRaw = {};
    const matchedThisWeek = {};
    const newCarry = { ...carry };
    users.forEach((u) => {
      // Root (HQ) now participates in binary matching just like any other
      // distributor — this is what makes it eligible for Binary, Rank,
      // Royalty and Reward income too, not just Direct and Level.
      const leftChild = getChildren(users, u.id).find((c) => c.position === "left");
      const rightChild = getChildren(users, u.id).find((c) => c.position === "right");
      const leftIds = leftChild ? getSubtreeIds(users, leftChild.id) : [];
      const rightIds = rightChild ? getSubtreeIds(users, rightChild.id) : [];
      const newLeftBV = unclosed.filter((o) => leftIds.includes(o.userId)).reduce((s, o) => s + o.bv, 0);
      const newRightBV = unclosed.filter((o) => rightIds.includes(o.userId)).reduce((s, o) => s + o.bv, 0);

      const priorLeft = carry[u.id]?.left || 0;
      const priorRight = carry[u.id]?.right || 0;
      const leftBV = priorLeft + newLeftBV;
      const rightBV = priorRight + newRightBV;
      const matched = Math.min(leftBV, rightBV);

      if (matched > 0) {
        binaryRaw[u.id] = matched * BINARY_PCT;
        matchedThisWeek[u.id] = matched;
      }
      newCarry[u.id] = { left: leftBV - matched, right: rightBV - matched };
    });
    const totalCalculated = Object.values(binaryRaw).reduce((s, v) => s + v, 0);
    const scaleFactor = totalCalculated > availablePool && totalCalculated > 0 ? availablePool / totalCalculated : 1;

    const binaryFinal = {};
    const newLifetimeBinary = { ...lifetimeBinary };
    Object.keys(binaryRaw).forEach((uid) => {
      const scaled = binaryRaw[uid] * scaleFactor;
      const earnedSoFar = lifetimeBinary[uid] || 0;
      const remainingCap = Math.max(0, BINARY_LIFETIME_CAP - earnedSoFar);
      const payable = Math.min(scaled, remainingCap);
      if (payable > 0) {
        binaryFinal[uid] = payable;
        newLifetimeBinary[uid] = earnedSoFar + payable;
      }
    });

    const newCumulativeMatchedBV = { ...cumulativeMatchedBV };
    Object.keys(matchedThisWeek).forEach((uid) => {
      newCumulativeMatchedBV[uid] = (cumulativeMatchedBV[uid] || 0) + matchedThisWeek[uid];
    });

    const directMap = {};
    // Direct Income must fire on a buyer's TRUE first-ever approved order — not just
    // "no prior CLOSED order" — otherwise if a brand-new buyer's first two orders land
    // in the same unclosed batch, both would incorrectly pay Direct Income. We instead
    // find each buyer's earliest approved order (closed or not) across their full
    // history and only pay when the order being processed IS that one.
    const firstApprovedOrderIdByUser = {};
    orders
      .filter((x) => x.status === "approved")
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach((x) => {
        if (!firstApprovedOrderIdByUser[x.userId]) firstApprovedOrderIdByUser[x.userId] = x.orderId;
      });
    unclosed.forEach((o) => {
      const buyer = findUser(users, o.userId);
      if (!buyer || !buyer.sponsorId) return;
      const isTrueFirstOrder = firstApprovedOrderIdByUser[o.userId] === o.orderId;
      if (isTrueFirstOrder) {
        directMap[buyer.sponsorId] = (directMap[buyer.sponsorId] || 0) + o.bv * DIRECT_PCT;
      }
    });

    const levelMap = {};
    unclosed.forEach((o) => {
      const chain = getUplineChain(users, o.userId, 10);
      chain.forEach(({ user, level }) => {
        const pct = LEVEL_PCTS[level] || 0;
        if (pct > 0) levelMap[user.id] = (levelMap[user.id] || 0) + o.bv * pct;
      });
    });

    const rankPoolTotal = totalCycleBV * RANK_PCT;
    const royaltyPoolTotal = totalCycleBV * ROYALTY_PCT;
    const rewardPoolTotal = totalCycleBV * REWARD_PCT;

    const rankOf = {};
    Object.keys(matchedThisWeek).forEach((uid) => {
      const r = getRank(newCumulativeMatchedBV[uid] || 0);
      if (r) rankOf[uid] = r;
    });
    const rankHolderIds = Object.keys(rankOf);
    const rankWeightSum = rankHolderIds.reduce((s, uid) => s + matchedThisWeek[uid], 0);
    const royaltyHolderIds = rankHolderIds.filter((uid) => rankOf[uid].royaltyEligible);
    const royaltyWeightSum = royaltyHolderIds.reduce((s, uid) => s + matchedThisWeek[uid], 0);
    const rewardHolderIds = rankHolderIds.filter((uid) => rankOf[uid].rewardEligible);
    const rewardWeightSum = rewardHolderIds.reduce((s, uid) => s + matchedThisWeek[uid], 0);

    const rankMap = {}, royaltyMap = {}, rewardMap = {};
    rankHolderIds.forEach((uid) => {
      if (rankWeightSum > 0) rankMap[uid] = (matchedThisWeek[uid] / rankWeightSum) * rankPoolTotal;
    });
    royaltyHolderIds.forEach((uid) => {
      if (royaltyWeightSum > 0) royaltyMap[uid] = (matchedThisWeek[uid] / royaltyWeightSum) * royaltyPoolTotal;
    });
    rewardHolderIds.forEach((uid) => {
      if (rewardWeightSum > 0) rewardMap[uid] = (matchedThisWeek[uid] / rewardWeightSum) * rewardPoolTotal;
    });

    const newIncomeEntries = [];
    const allUserIds = new Set([
      ...Object.keys(binaryFinal), ...Object.keys(directMap), ...Object.keys(levelMap),
      ...Object.keys(rankMap), ...Object.keys(royaltyMap), ...Object.keys(rewardMap),
    ]);
    allUserIds.forEach((uid) => {
      const binary = binaryFinal[uid] || 0;
      const direct = directMap[uid] || 0;
      const level = levelMap[uid] || 0;
      const rank = rankMap[uid] || 0;
      const royalty = royaltyMap[uid] || 0;
      const reward = rewardMap[uid] || 0;
      const totalAmt = binary + direct + level + rank + royalty + reward;
      if (totalAmt > 0) {
        // 5% admin charge is deducted from the gross commission before it is
        // credited — "total" (used everywhere for the distributor's payable
        // amount) is always the NET figure; grossTotal/adminCharge are kept
        // alongside for the income slip breakdown.
        const adminCharge = totalAmt * ADMIN_CHARGE_PCT;
        const netAmt = totalAmt - adminCharge;
        newIncomeEntries.push({
          userId: uid,
          weekLabel,
          binary: Math.round(binary),
          direct: Math.round(direct),
          level: Math.round(level),
          rank: Math.round(rank),
          royalty: Math.round(royalty),
          reward: Math.round(reward),
          rankName: rankOf[uid]?.name || null,
          grossTotal: Math.round(totalAmt),
          adminCharge: Math.round(adminCharge),
          total: Math.round(netAmt),
          createdAt: new Date().toISOString(),
        });
      }
    });

    const updatedIncome = [...income, ...newIncomeEntries];
    const updatedOrders = orders.map((o) => (unclosed.find((u) => u.orderId === o.orderId) ? { ...o, closedWeek: weekLabel } : o));

    await saveKey("ez_income", updatedIncome);
    await saveKey("ez_orders", updatedOrders);
    await saveKey("ez_carry", newCarry);
    await saveKey("ez_binary_lifetime", newLifetimeBinary);
    await saveKey("ez_cumulative_bv", newCumulativeMatchedBV);
    setIncome(updatedIncome);
    setOrders(updatedOrders);
    setCarry(newCarry);
    setRunning(false);
    const totalNetPaid = newIncomeEntries.reduce((s, e) => s + e.total, 0);
    const totalAdminCharge = newIncomeEntries.reduce((s, e) => s + e.adminCharge, 0);
    setLastRun(
      `Closing done — Total Cycle BV ₹${totalCycleBV.toLocaleString("en-IN")}, Scale Factor ${scaleFactor.toFixed(2)}. Net income credited to ${newIncomeEntries.length} distributors: ₹${totalNetPaid.toLocaleString("en-IN")} (Admin charge withheld: ₹${totalAdminCharge.toLocaleString("en-IN")}). Unmatched BV carried forward for next week.`
    );
  };

  const [slipEntry, setSlipEntry] = useState(null);

  if (isAdmin) {
    const weeks = [...new Set(income.map((i) => i.weekLabel))].sort().reverse();
    return (
      <div>
        <h2 className="font-display font-bold text-xl text-[#1B1F3B] mb-4">Income — Weekly Closing</h2>
        <button
          onClick={runWeeklyClosing}
          disabled={running}
          className="w-full bg-[#1B1F3B] text-white font-medium py-3 rounded-xl mb-3 flex items-center justify-center gap-2"
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
          Run Weekly Closing Now
        </button>
        {lastRun && <div className="text-xs bg-[#EAF4F2] text-[#0F9B8E] rounded-lg p-3 mb-4">{lastRun}</div>}

        {weeks.map((w) => (
          <div key={w} className="mb-4">
            <div className="text-xs font-mono-tag text-[#6E7482] mb-1">{w}</div>
            <div className="space-y-1.5">
              {income.filter((i) => i.weekLabel === w).map((i, idx) => {
                const rank = getRankByName(i.rankName);
                return (
                  <div key={idx} className="bg-white border border-[#E5E3DC] rounded-lg p-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono-tag inline-flex items-center gap-1" style={{ color: rank ? rank.color : "#1B1F3B" }}>
                        {rank && <rank.icon size={11} fill={rank.color} color={rank.color} />}
                        {i.userId}
                      </span>
                      <div className="flex items-center gap-2">
                        {rank && <RankBadge rank={rank} size="sm" />}
                        <span className="font-semibold text-[#0F9B8E]">₹{i.total}</span>
                        <button onClick={() => setSlipEntry(i)} className="text-[#6E7482] hover:text-[#1B1F3B]" title="View Income Slip">
                          <Receipt size={14} />
                        </button>
                      </div>
                    </div>
                    <IncomeBreakdown entry={i} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {slipEntry && (
          <IncomeSlipModal entry={slipEntry} users={users} onClose={() => setSlipEntry(null)} />
        )}
      </div>
    );
  }

  const myIncome = income.filter((i) => i.userId === currentUser?.id).sort((a, b) => b.weekLabel.localeCompare(a.weekLabel));
  const totalIncome = myIncome.reduce((s, i) => s + i.total, 0);
  const latestWeek = myIncome[0];
  const myOrdersBV = orders.filter((o) => o.userId === currentUser?.id && o.status === "approved").reduce((s, o) => s + o.bv, 0);
  const myRank = currentUser ? getRank(cumulativeBV?.[currentUser.id] || 0) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl text-[#1B1F3B]">My Income</h2>
        {myRank && <RankBadge rank={myRank} />}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="My Business (BV)" value={`₹${myOrdersBV.toLocaleString("en-IN")}`} color={INDIGO} />
        <StatCard label="This Week" value={latestWeek ? `₹${latestWeek.total}` : "₹0"} color={TEAL} />
        <StatCard label="Total Income" value={`₹${totalIncome.toLocaleString("en-IN")}`} color={GOLD} />
        <StatCard label="Weeks Paid" value={myIncome.length} color={INDIGO} />
      </div>
      <p className="text-[10px] text-[#9298A6] mb-4 -mt-2">
        All amounts shown are net of the 5% admin charge. Tap the <Receipt size={10} className="inline align-text-bottom" /> icon on any week for a full income slip.
      </p>

      <h3 className="font-display font-semibold text-sm text-[#1B1F3B] mb-2">Weekly History</h3>
      <div className="space-y-2">
        {myIncome.length === 0 && <p className="text-xs text-[#6E7482]">No income yet</p>}
        {myIncome.map((i, idx) => (
          <div key={idx} className="bg-white border border-[#E5E3DC] rounded-xl p-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono-tag text-[#6E7482]">{i.weekLabel} {i.rankName && <span className="text-[#D4AF37] font-semibold ml-1">{i.rankName}</span>}</span>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[#0F9B8E]">₹{i.total}</span>
                <button onClick={() => setSlipEntry(i)} className="text-[#6E7482] hover:text-[#1B1F3B]" title="View Income Slip">
                  <Receipt size={15} />
                </button>
              </div>
            </div>
            <IncomeBreakdown entry={i} />
          </div>
        ))}
      </div>

      {slipEntry && (
        <IncomeSlipModal entry={slipEntry} users={users} onClose={() => setSlipEntry(null)} />
      )}
    </div>
  );
}

function IncomeSlipModal({ entry, users, onClose }) {
  const person = findUser(users, entry.userId);
  const rank = getRankByName(entry.rankName);
  const gross = entry.grossTotal ?? entry.total;
  const adminCharge = entry.adminCharge ?? 0;
  const rows = [
    { label: "Binary Income", value: entry.binary || 0 },
    { label: "Direct Income", value: entry.direct || 0 },
    { label: "Level Income", value: entry.level || 0 },
    { label: "Rank Income", value: entry.rank || 0 },
    { label: "Royalty Income", value: entry.royalty || 0 },
    { label: "Reward Income", value: entry.reward || 0 },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden">
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(90deg, #1B1F3B 0%, #0F9B8E 160%)" }}
        >
          <div className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-display font-bold text-white text-sm">Income Slip</span>
          </div>
          <button onClick={onClose}><X size={18} className="text-white" /></button>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display font-semibold text-sm text-[#1B1F3B]">{person?.name || entry.userId}</div>
              <div className="font-mono-tag text-[11px] text-[#6E7482]">{entry.userId} · Week of {entry.weekLabel}</div>
            </div>
            {rank && <RankBadge rank={rank} size="sm" />}
          </div>

          <div className="border border-[#E5E3DC] rounded-xl overflow-hidden">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between px-3 py-2 text-xs border-b border-[#F0EFE9] last:border-b-0">
                <span className="text-[#6E7482]">{r.label}</span>
                <span className="font-mono-tag text-[#1B1F3B]">₹{r.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
            <div className="flex justify-between px-3 py-2 text-xs bg-[#FAF9F6] font-semibold">
              <span className="text-[#1B1F3B]">Gross Total</span>
              <span className="font-mono-tag text-[#1B1F3B]">₹{gross.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between px-3 py-2 text-xs">
              <span className="text-[#B3532F]">Admin Charge (5%)</span>
              <span className="font-mono-tag text-[#B3532F]">−₹{adminCharge.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between px-3 py-3 text-sm font-bold" style={{ backgroundColor: "#EAF4F2" }}>
              <span className="text-[#0F9B8E]">Net Payable</span>
              <span className="font-mono-tag text-[#0F9B8E]">₹{entry.total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <p className="text-[9px] text-[#9298A6] mt-3 text-center">This is a system-generated income slip from Everzon.</p>
        </div>
      </div>
    </div>
  );
}
