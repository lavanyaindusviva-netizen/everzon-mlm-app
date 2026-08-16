import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LayoutDashboard, Package, GitBranch, ShoppingCart, Wallet,
  Plus, X, Copy, Check, Clock, TrendingUp, Upload, QrCode,
  ChevronRight, Users, ShieldCheck, Loader2, AlertCircle, LogIn, Menu, Search,
  UserPlus, Layers, Award, Crown, Gift, Receipt, Star
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
  { model: "ML-83", name: "Audio Sports Hero â€” Buds Pro 5", price: 2000, image: imgML83 },
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
  { name: "Crown Diamond", minBV: 10000000, royaltyEligible: true, rewardEligible: true, color: "#9333EA", textColor: "#FFFFFF" },
  { name: "Diamond", minBV: 4000000, royaltyEligible: true, rewardEligible: false, color: "#0EA5E9", textColor: "#FFFFFF" },
  { name: "Platinum", minBV: 1500000, royaltyEligible: true, rewardEligible: false, color: "#64748B", textColor: "#FFFFFF" },
  { name: "Gold", minBV: 600000, royaltyEligible: false, rewardEligible: false, color: "#D4AF37", textColor: "#1B1F3B" },
  { name: "Silver", minBV: 200000, royaltyEligible: false, rewardEligible: false, color: "#9CA3AF", textColor: "#1B1F3B" },
  { name: "Bronze", minBV: 50000, royaltyEligible: false, rewardEligible: false, color: "#B45309", textColor: "#FFFFFF" },
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
// Real-time listener: keeps every connected device (member phones, admin browser)
// in sync automatically. This replaces the old "load once on page open" approach,
