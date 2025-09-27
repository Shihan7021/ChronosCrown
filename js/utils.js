// utils.js - utility helpers
export function $(sel, ctx=document) { return ctx.querySelector(sel); }
export function $all(sel, ctx=document) { return Array.from(ctx.querySelectorAll(sel)); }

export function formatCurrency(n){
  return n?.toLocaleString?.('en-US', { style: 'currency', currency: 'USD' }) || ('$'+Number(n||0).toFixed(2));
}

export function uid() {
  // simple short unique id used for tracking number
  return 'CC-'+Math.random().toString(36).slice(2,10).toUpperCase();
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate()+days);
  return d.toISOString().split('T')[0];
}
