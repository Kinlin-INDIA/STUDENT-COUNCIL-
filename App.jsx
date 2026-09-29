import { useState, useEffect, useCallback, useReducer, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './index.css';

// ── Supabase client (reads from .env) ──
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env
const _url  = import.meta.env.VITE_SUPABASE_URL;
const _key  = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = (_url && _key) ? createClient(_url, _key) : null;


/* ══ SMART BANNER SYSTEM ══ */
/* Maps holiday/event type + keywords to SVG icons automatically */
const BANNER_ICONS = {
  /* Weather */
  'bad weather':  (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16.2A4.5 4.5 0 0017.5 8h-1.8A7 7 0 104 14.9"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/></svg>,
  'rain':         (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/></svg>,
  'fog':          (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M5 5h3m4 0h9M3 9h11m4 0h1M3 13h3m4 0h11M5 17h5m4 0h7"/></svg>,
  /* Festivals */
  'holi':         (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  'diwali':       (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 9l2-4 2 4M9 9l2-4 2 4M1 9l2-4 2 4"/><path d="M7 21H3a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1z"/><path d="M15 21h-4a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1z"/><path d="M23 21h-4a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1z"/></svg>,
  'eid':          (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 009 9 9 9 0 11-9-9z"/><path d="M19 3v4M21 5h-4"/></svg>,
  'christmas':    (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L8 9H4l4 3-2 6 6-4 6 4-2-6 4-3h-4L12 2z"/></svg>,
  'ganesh':       (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M5 19a7 7 0 0114 0"/><path d="M9 6c0 0-1-3 2-3s3 2 3 2"/></svg>,
  'navratri':     (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 10l8 4M8 14l8-4"/></svg>,
  'republic':     (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  'independence': (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  'holiday':      (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>,
  /* Events */
  'chess':        (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="20" width="20" height="2" rx="1"/><rect x="6" y="16" width="12" height="4" rx="1"/><path d="M9 16V8M15 16V8M7 8h10M9 8V5a3 3 0 006 0v3"/></svg>,
  'sports':       (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>,
  'cricket':      (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19l14-14"/><path d="M14.5 4.5l5 5"/><path d="M3 21l2-2"/></svg>,
  'debate':       (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  'science':      (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>,
  'art':          (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  'music':        (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  'dance':        (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v6M9 8l-3 5M15 8l3 5M9 19l3-7 3 7"/></svg>,
  /* Exams */
  'exam':         (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  'test':         (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="11" y2="17"/></svg>,
  'result':       (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  /* Emergency */
  'emergency':    (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  'closed':       (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  'meeting':      (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  /* Default */
  'event':        (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  'festival':     (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  'default':      (c)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

/* Banner color themes per category */
const BANNER_THEMES = {
  weather:    {bg:'#EFF6FF', border:'#BFDBFE', icon:'#2563EB', title:'#1D4ED8'},
  festival:   {bg:'#FFF7ED', border:'#FED7AA', icon:'#EA580C', title:'#C2410C'},
  holiday:    {bg:'#F0FDF4', border:'#86EFAC', icon:'#16A34A', title:'#15803D'},
  exam:       {bg:'#F5F3FF', border:'#DDD6FE', icon:'#7C3AED', title:'#6D28D9'},
  event:      {bg:'#FEF3C7', border:'#FDE68A', icon:'#D97706', title:'#B45309'},
  emergency:  {bg:'#FEF2F2', border:'#FECACA', icon:'#DC2626', title:'#B91C1C'},
  default:    {bg:'#FFFBEB', border:'#FDE68A', icon:'#D97706', title:'#B45309'},
};

/* Smart icon picker — matches keywords in name/msg */
function getBannerIcon(name='', type='', msg='') {
  const text = (name+' '+type+' '+msg).toLowerCase();
  const order = [
    ['bad weather','bad weather'],['rain','rain'],['fog','fog'],
    ['holi','holi'],['diwali','diwali'],['eid','eid'],['christmas','christmas'],
    ['ganesh','ganesh'],['navratri','navratri'],['republic','republic'],['independence','independence'],
    ['chess','chess'],['cricket','cricket'],['debate','debate'],['science','science'],
    ['art','art'],['music','music'],['dance','dance'],['sports','sports'],
    ['exam','exam'],['test','test'],['result','result'],
    ['emergency','emergency'],['closed','closed'],['meeting','meeting'],
    ['festival','festival'],['holiday','holiday'],['event','event'],
  ];
  for(const [kw,icon] of order) { if(text.includes(kw)) return BANNER_ICONS[icon]; }
  if(type==='Emergency') return BANNER_ICONS['emergency'];
  if(type==='Festival')  return BANNER_ICONS['festival'];
  if(type==='Event')     return BANNER_ICONS['event'];
  if(type==='Half Day')  return BANNER_ICONS['holiday'];
  return BANNER_ICONS['default'];
}

function getBannerTheme(name='', type='') {
  const text = (name+' '+type).toLowerCase();
  if(['rain','fog','bad weather','storm','cold','heat'].some(w=>text.includes(w))) return BANNER_THEMES.weather;
  if(['emergency','accident','urgent'].some(w=>text.includes(w))) return BANNER_THEMES.emergency;
  if(['exam','test','result','board'].some(w=>text.includes(w))) return BANNER_THEMES.exam;
  if(['holi','diwali','eid','christmas','ganesh','navratri','puja','festival'].some(w=>text.includes(w))) return BANNER_THEMES.festival;
  if(['holiday','vacation','break'].some(w=>text.includes(w))) return BANNER_THEMES.holiday;
  if(['chess','sport','cricket','debate','science','art','music','dance','event','competition','fair'].some(w=>text.includes(w))) return BANNER_THEMES.event;
  if(type==='Emergency') return BANNER_THEMES.emergency;
  if(type==='Festival')  return BANNER_THEMES.festival;
  if(type==='Event')     return BANNER_THEMES.event;
  return BANNER_THEMES.default;
}

/* Smart Banner Component */
function SmartBanner({title, type='Holiday', msg='', showHide=false, onHide}){
  const theme = getBannerTheme(title, type);
  const IconFn = getBannerIcon(title, type, msg);
  return (
    <div style={{
      background:theme.bg, border:`1px solid ${theme.border}`,
      borderRadius:12, padding:'14px 18px', marginBottom:16,
      display:'flex', alignItems:'flex-start', gap:12,
      animation:'fadeUp .2s',
    }}>
      <div style={{width:36,height:36,borderRadius:10,background:theme.border,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        {IconFn?IconFn(theme.icon):<I n="info" s={18} c={theme.icon}/>}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:theme.title}}>{title}</div>
        {msg&&<div style={{fontSize:12,color:theme.title,opacity:0.8,marginTop:3,lineHeight:1.5}}>{msg}</div>}
      </div>
      {showHide&&<button onClick={onHide} style={{background:'none',border:'none',cursor:'pointer',color:theme.icon,padding:2,display:'flex',flexShrink:0}}>
        <I n="xx" s={14} c={theme.icon}/>
      </button>}
    </div>
  );
}

/* ══ SUPABASE CLIENT ══
   For production: credentials go in server environment variables only.
   Single-HTML prototype uses mock data — no credentials needed here.
   DO NOT paste any URL or key into this file.
*/


const C = {
  sb:'#0A0A0A',sbBorder:'#1F1F1F',sbText:'#71717A',sbActive:'#FFFFFF',sbActiveBg:'#1A1A1A',
  bg:'#FAFAFA',white:'#FFFFFF',border:'#E4E4E7',border2:'#F4F4F5',
  text:'#18181B',text2:'#3F3F46',text3:'#71717A',text4:'#A1A1AA',
  green:'#16A34A',greenL:'#F0FDF4',greenB:'#86EFAC',greenDot:'#22C55E',
  red:'#DC2626',redL:'#FEF2F2',redB:'#FECACA',
  yel:'#D97706',yelL:'#FFFBEB',yelB:'#FDE68A',
  blue:'#2563EB',blueL:'#EFF6FF',blueB:'#BFDBFE',
  pur:'#7C3AED',purL:'#F5F3FF',
};

const HOUSES = {
  Vikramshila:{c:'#B45309',bg:'#FFFBEB',b:'#FDE68A',grad:'linear-gradient(135deg,#F59E0B,#D97706)'},
  Vallabhi:   {c:'#B91C1C',bg:'#FEF2F2',b:'#FECACA',grad:'linear-gradient(135deg,#EF4444,#DC2626)'},
  Nalanda:    {c:'#1D4ED8',bg:'#EFF6FF',b:'#BFDBFE',grad:'linear-gradient(135deg,#3B82F6,#2563EB)'},
  Taxshila:   {c:'#15803D',bg:'#F0FDF4',b:'#86EFAC',grad:'linear-gradient(135deg,#22C55E,#16A34A)'},
  default:    {c:'#52525B',bg:'#F4F4F5',b:'#E4E4E7',grad:'linear-gradient(135deg,#71717A,#52525B)'},
};

const RTHEME = {
  'Head Boy':          {bg:'#18181B',fg:'#F59E0B',sub:'rgba(245,158,11,0.65)'},
  'Head Girl':         {bg:'#4C1D95',fg:'#DDD6FE',sub:'rgba(221,214,254,0.65)'},
  'Student Media Head':{bg:'#1E3A8A',fg:'#BAE6FD',sub:'rgba(186,230,253,0.65)'},
  'Sports Captain':    {bg:'#7F1D1D',fg:'#FCA5A5',sub:'rgba(252,165,165,0.65)'},
  'Sports Prefect':    {bg:'#7F1D1D',fg:'#FCA5A5',sub:'rgba(252,165,165,0.65)'},
  'Discipline Captain':{bg:'#052E16',fg:'#86EFAC',sub:'rgba(134,239,172,0.65)'},
  'Discipline Prefect':{bg:'#052E16',fg:'#86EFAC',sub:'rgba(134,239,172,0.65)'},
  'Student Editor':    {bg:'#78350F',fg:'#FCD34D',sub:'rgba(252,211,77,0.65)'},
  'CCA Captain':       {bg:'#3B0764',fg:'#D8B4FE',sub:'rgba(216,180,254,0.65)'},
  'CCA Prefect':       {bg:'#3B0764',fg:'#D8B4FE',sub:'rgba(216,180,254,0.65)'},
};

const BADGES = [
  {id:'flash',      name:'Flash Responder',   pts:15, color:'#D97706'},
  {id:'logmaster',  name:'The Log Master',     pts:50, color:'#16A34A'},
  {id:'unstoppable',name:'The Unstoppable',    pts:100,color:'#2563EB'},
  {id:'turnaround', name:'Turnaround Hero',    pts:25, color:'#7C3AED'},
  {id:'weekend',    name:'Weekend Warrior',    pts:30, color:'#D97706'},
  {id:'bulletproof',name:'Bulletproof Log',    pts:60, color:'#16A34A'},
  {id:'task',       name:'Task Completion',    pts:20, color:'#2563EB'},
  {id:'victory',    name:'Victory Catalyst',   pts:20, color:'#D97706'},
  {id:'unsung',     name:'The Crown',          pts:150,color:'#7C3AED'},
  {id:'ground',     name:'Ground Warrior',     pts:20, color:'#16A34A'},
];

const I = ({n,s=14,c='currentColor',w=1.8})=>{
  const p={
    grid:   <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    cal:    <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    users:  <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    doc:    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></>,
    gear:   <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.62a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    out:    <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    chk:    <polyline points="20 6 9 17 4 12"/>,
    xx:     <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    warn:   <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    clk:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    star:   <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    trophy: <><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M12 17v5M8 13.13V7a1 1 0 011-1h6a1 1 0 011 1v6.13"/><path d="M8 7H6v4a6 6 0 0012 0V7h-2"/></>,
    medal:  <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
    user:   <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    lock:   <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    eye:    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    eyeoff: <><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    plus:   <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit:   <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:  <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
    key:    <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    crown:  <path d="M2 20h20M5 20L3 8l5 4 4-6 4 6 5-4-2 12"/>,
    bar:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    hist:   <><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 119.9-7.95"/><polyline points="3 3 3 11 11 11"/></>,
    save:   <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    info:   <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    sun:    <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    admins: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></>,
    bell:   <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    arrow:  <polyline points="9 18 15 12 9 6"/>,
    home:   <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    shuffle:<><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">{p[n]}</svg>;
};

const ini = n=>n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
const tsNow = ()=>new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true});
const greet = ()=>{const h=new Date().getHours();return h<5?'Good night':h<12?'Good morning':h<17?'Good afternoon':h<21?'Good evening':'Good night';};

const Logo = ({s=36})=>(
  <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill="#fff"/>
    <circle cx="24" cy="15" r="6" fill="#18181B"/>
    <path d="M11 40c0-7.18 5.82-13 13-13s13 5.82 13 13" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M17 20.5L20 17L24 21.5L28 17L31 20.5L29.5 26H18.5Z" fill="#16A34A"/>
  </svg>
);

const Tag = ({ch,c=C.text3,bg=C.border2,b,px=7})=>(
  <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:`2px ${px}px`,borderRadius:4,fontSize:11,fontWeight:600,color:c,background:bg,border:`1px solid ${b||bg}`,lineHeight:1.6,whiteSpace:'nowrap'}}>{ch}</span>
);

/* ══ STATE ══ */
/* BADGES now also stored in INIT.badges so SA can edit */
const DEFAULT_BADGES = [
  {id:'flash',      name:'Flash Responder',   pts:15,  color:'#D97706', trigger:'Mark attendance within 5 min of window open', auto:true},
  {id:'logmaster',  name:'The Log Master',     pts:50,  color:'#16A34A', trigger:'9 consecutive working days present',          auto:true},
  {id:'unstoppable',name:'The Unstoppable',    pts:100, color:'#2563EB', trigger:'15 consecutive working days present',         auto:true},
  {id:'turnaround', name:'Turnaround Hero',    pts:25,  color:'#7C3AED', trigger:'5 present days after a gap of absences',      auto:true},
  {id:'weekend',    name:'Weekend Warrior',    pts:30,  color:'#D97706', trigger:'Full attendance in a week including Saturday', auto:true},
  {id:'bulletproof',name:'Bulletproof Log',    pts:60,  color:'#16A34A', trigger:'15 day streak with zero mismatches',          auto:true},
  {id:'task',       name:'Task Completion',    pts:20,  color:'#2563EB', trigger:'Verified worker in a school event',           auto:true},
  {id:'victory',    name:'Victory Catalyst',   pts:20,  color:'#D97706', trigger:'Member of winning house in an event',         auto:true},
  {id:'unsung',     name:'The Crown',          pts:150, color:'#7C3AED', trigger:'Teacher manually approves nomination',        auto:false},
  {id:'ground',     name:'Ground Warrior',     pts:20,  color:'#16A34A', trigger:'Completed assigned ground duty task',         auto:false},
];
const INIT = {
  appName:'Student Council',
  attWindow:{start:'05:00',end:'08:00'},
  lbCount:9,
  holidayActive:false,holidayTitle:'',holidayMsg:'',holidayType:'Holiday',
  workingDay:{isWorking:true,type:'working',note:'',setBy:null,setAt:null,log:[]},
  holidays:[],
  auditLog:[],
  badges: DEFAULT_BADGES,
  /* Supabase credentials are configured via environment variables — not stored in UI */
  dutyPoints:[
    {id:'dp1',name:'Main Gate',floor:'Ground',building:'Main',group:'Entry Points',minRequired:1,important:true,assignedTo:null},
    {id:'dp2',name:'Reception Area',floor:'Ground',building:'Main',group:'Entry Points',minRequired:1,important:true,assignedTo:null},
    {id:'dp3',name:'Ground Floor Corridor A',floor:'Ground',building:'Main',group:'GF Corridors',minRequired:1,important:false,assignedTo:null},
    {id:'dp4',name:'Ground Floor Corridor B',floor:'Ground',building:'Main',group:'GF Corridors',minRequired:1,important:false,assignedTo:null},
    {id:'dp5',name:'Stairs GF→1F (Main)',floor:'Ground',building:'Main',group:'Stairs',minRequired:1,important:true,assignedTo:null},
    {id:'dp6',name:'1st Floor Corridor A',floor:'1st',building:'Main',group:'1F Corridors',minRequired:1,important:false,assignedTo:null},
    {id:'dp7',name:'1st Floor Corridor B',floor:'1st',building:'Main',group:'1F Corridors',minRequired:1,important:false,assignedTo:null},
    {id:'dp8',name:'Stairs 1F→2F (Main)',floor:'1st',building:'Main',group:'Stairs',minRequired:1,important:true,assignedTo:null},
    {id:'dp9',name:'2nd Floor Corridor A',floor:'2nd',building:'Main',group:'2F Corridors',minRequired:1,important:false,assignedTo:null},
    {id:'dp10',name:'2nd Floor Corridor B',floor:'2nd',building:'Main',group:'2F Corridors',minRequired:1,important:false,assignedTo:null},
    {id:'dp11',name:'2nd Floor Corridor C',floor:'2nd',building:'Main',group:'2F Corridors',minRequired:1,important:false,assignedTo:null},
  ],
  dutyGroups:[
    {id:'g1',name:'Entry Points',minRequired:1,important:true},
    {id:'g2',name:'GF Corridors',minRequired:1,important:false},
    {id:'g3',name:'Stairs',minRequired:1,important:true},
    {id:'g4',name:'1F Corridors',minRequired:1,important:false},
    {id:'g5',name:'2F Corridors',minRequired:1,important:false},
  ],
  dutyAssignments:{},
  dutyList:[],
  notices:[],
  events:[
    {id:'ev1',title:'Inter House Chess Championship',category:'inter_house',sport:'chess',
     status:'past',date:'2026-09-05',description:'Annual chess championship between all 4 houses.',
     winner:'Nalanda',winnerScore:'12 pts',runnerUp:'Vikramshila',runnerUpScore:'8 pts',
     reward:'certificate+trophy',winnerHouse:'Nalanda',pointsAwarded:20,
     participants:['SC-SC-B','SC-HC-VIK'],addedBy:'TC-CCA'},
    {id:'ev2',title:'CBSE Annual Sports Day',category:'cbse_sports',sport:'sports',
     status:'upcoming',date:'2026-10-15',description:'Annual CBSE sports competition.',
     winner:null,winnerScore:null,runnerUp:null,runnerUpScore:null,
     reward:null,winnerHouse:null,pointsAwarded:0,
     participants:[],addedBy:'SA-001'},
    {id:'ev3',title:'Inter School Debate',category:'inter_school',sport:'debate',
     status:'ongoing',date:'2026-09-23',description:'Inter school debate competition.',
     winner:null,winnerScore:null,runnerUp:null,runnerUpScore:null,
     reward:null,winnerHouse:null,pointsAwarded:0,
     participants:[],addedBy:'TC-CCA'},
  ],
  eventCategories:[
    {id:'inter_house',name:'Inter House',desc:'Competition between the 4 school houses'},
    {id:'cbse_sports',name:'CBSE Yearly Sports',desc:'Annual CBSE mandated sports events'},
    {id:'inter_school',name:'Inter School',desc:'Competition with other schools'},
    {id:'internal',name:'Internal Event',desc:'School internal event / activity'},
  ],
  attendance:{
    'SC-SC-B':  {status:'present',  reason:'',      ts:'Today, 5:42 AM',confirmed:true, confirmedBy:'Mr. Singh',    confirmedAt:'Today, 8:10 AM',editLog:[]},
    'SC-SC-G':  {status:'present',  reason:'',      ts:'Today, 6:01 AM',confirmed:false,confirmedBy:null,           confirmedAt:null,editLog:[]},
    'SC-HC-VIK':{status:'absent',   reason:'Fever', ts:'Today, 5:55 AM',confirmed:false,confirmedBy:null,           confirmedAt:null,editLog:[]},
    'SC-DC-B':  {status:'emergency',reason:'Family',ts:'Today, 6:30 AM',confirmed:false,confirmedBy:null,           confirmedAt:null,editLog:[]},
  },
  users:{
    'SA-001':   {pw:'admin123',role:'super_admin',  name:'Super Admin',        badge:'Super Admin',         house:'default',    pts:0,  streak:0,wallet:[],rank:0, sa:false,class:'',sec:''},
    'TC-CCA':   {pw:'cca123', role:'teacher_admin', name:'Mrs. Sharma',        badge:'CCA Teacher',         house:'default',    pts:0,  streak:0,wallet:[],rank:0, sa:false,class:'',sec:''},
    'TC-PE':    {pw:'pe123',  role:'teacher_admin', name:'Mr. Singh',          badge:'PE Sir',              house:'default',    pts:0,  streak:0,wallet:[],rank:0, sa:false,class:'',sec:''},
    'SC-HB-001':{pw:'hb123', role:'badge_admin',   name:'Rahul Kumar',        badge:'Head Boy',            house:'default',    pts:340,streak:7,wallet:['logmaster','flash'],rank:1,sa:false,class:'12',sec:'A'},
    'SC-HG-001':{pw:'hg123', role:'badge_admin',   name:'Priya Singh',        badge:'Head Girl',           house:'default',    pts:310,streak:5,wallet:['flash','turnaround'],rank:2,sa:false,class:'12',sec:'A'},
    'SC-SC-B':  {pw:'sc123', role:'badge_holder',  name:'Arjun Mehta',        badge:'Boys Sports Captain', house:'Nalanda',    pts:280,streak:9,wallet:['logmaster','flash','task'],rank:3,class:'11',sec:'B'},
    'SC-SC-G':  {pw:'sc456', role:'badge_holder',  name:'Ananya Patel',       badge:'Girls Sports Captain',house:'Vikramshila',pts:260,streak:6,wallet:['flash','weekend'],rank:4,class:'11',sec:'A'},
    'SC-HC-VIK':{pw:'vik123',role:'badge_holder',  name:'Dev Sharma',         badge:'Boys House Captain',  house:'Vikramshila',pts:220,streak:4,wallet:['flash'],rank:5,class:'10',sec:'C'},
    'SC-DC-B':  {pw:'dc123', role:'badge_holder',  name:'Karan Verma',        badge:'Discipline Captain',  house:'Vallabhi',   pts:190,streak:3,wallet:[],rank:6,class:'11',sec:'C'},
    'SC-SE-1':  {pw:'se123', role:'badge_holder',  name:'Shreya Gupta',       badge:'Student Editor',      house:'Taxshila',   pts:170,streak:2,wallet:['task'],rank:7,class:'10',sec:'A'},
    'SC-HP-VIK':{pw:'vp123', role:'badge_holder',  name:'Meera Joshi',        badge:'Girls House Prefect', house:'Vikramshila',pts:150,streak:5,wallet:['logmaster'],rank:8,class:'10',sec:'B'},
    'SC-CC-B':  {pw:'cc123', role:'badge_holder',  name:'Rohan Das',          badge:'CCA Captain',         house:'Nalanda',    pts:130,streak:1,wallet:[],rank:9,class:'11',sec:'A'},
    'SC-MH-1':  {pw:'mh123', role:'badge_holder',  name:'Ayaan Khan',         badge:'Student Media Head',  house:'Taxshila',   pts:110,streak:2,wallet:[],rank:10,class:'12',sec:'B'},
  },
  monthly:{
    /* Each record: d=display, s=P/A/E/H, r=reason, ts=time, dayType=working|holiday|festival|event|halfday|sunday */
    'SC-SC-B':[
      {d:'Mon 1 Sep', date:'2026-09-01',s:'P',r:'',             ts:'5:42 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Tue 2 Sep', date:'2026-09-02',s:'P',r:'',             ts:'5:38 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Wed 3 Sep', date:'2026-09-03',s:'A',r:'Fever',        ts:'6:01 AM',confirmed:true, confirmedBy:'Mrs. Sharma', dayType:'working'},
      {d:'Thu 4 Sep', date:'2026-09-04',s:'H',r:'Ganesh Chaturthi',ts:'',   confirmed:false,confirmedBy:null,           dayType:'festival'},
      {d:'Fri 5 Sep', date:'2026-09-05',s:'P',r:'',             ts:'5:55 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sat 6 Sep', date:'2026-09-06',s:'P',r:'',             ts:'5:58 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sun 7 Sep', date:'2026-09-07',s:'H',r:'Sunday',       ts:'',       confirmed:false,confirmedBy:null,           dayType:'sunday'},
      {d:'Mon 8 Sep', date:'2026-09-08',s:'P',r:'',             ts:'5:44 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Tue 9 Sep', date:'2026-09-09',s:'E',r:'Family emergency',ts:'6:20 AM',confirmed:true,confirmedBy:'Mrs. Sharma',dayType:'working'},
      {d:'Wed 10 Sep',date:'2026-09-10',s:'P',r:'',             ts:'5:50 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Thu 11 Sep',date:'2026-09-11',s:'P',r:'',             ts:'5:41 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Fri 12 Sep',date:'2026-09-12',s:'P',r:'',             ts:'5:39 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sat 13 Sep',date:'2026-09-13',s:'A',r:'Personal work',ts:'6:10 AM',confirmed:true, confirmedBy:'Mrs. Sharma', dayType:'working'},
      {d:'Sun 14 Sep',date:'2026-09-14',s:'H',r:'Sunday',       ts:'',       confirmed:false,confirmedBy:null,           dayType:'sunday'},
      {d:'Mon 15 Sep',date:'2026-09-15',s:'P',r:'',             ts:'5:43 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Tue 16 Sep',date:'2026-09-16',s:'H',r:'School Event Day',ts:'',   confirmed:false,confirmedBy:null,           dayType:'event'},
      {d:'Wed 17 Sep',date:'2026-09-17',s:'P',r:'',             ts:'5:47 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Thu 18 Sep',date:'2026-09-18',s:'H',r:'Half Day — PTM',ts:'',     confirmed:false,confirmedBy:null,           dayType:'halfday'},
      {d:'Fri 19 Sep',date:'2026-09-19',s:'A',r:'Unwell',       ts:'6:05 AM',confirmed:true, confirmedBy:'Mrs. Sharma', dayType:'working'},
    ],
    'SC-SC-G':[
      {d:'Mon 1 Sep', date:'2026-09-01',s:'P',r:'',             ts:'5:50 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Tue 2 Sep', date:'2026-09-02',s:'P',r:'',             ts:'5:48 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Wed 3 Sep', date:'2026-09-03',s:'P',r:'',             ts:'5:52 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Thu 4 Sep', date:'2026-09-04',s:'H',r:'Ganesh Chaturthi',ts:'',   confirmed:false,confirmedBy:null,           dayType:'festival'},
      {d:'Fri 5 Sep', date:'2026-09-05',s:'A',r:'Unwell',       ts:'6:10 AM',confirmed:true, confirmedBy:'Mrs. Sharma', dayType:'working'},
      {d:'Sat 6 Sep', date:'2026-09-06',s:'P',r:'',             ts:'5:52 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sun 7 Sep', date:'2026-09-07',s:'H',r:'Sunday',       ts:'',       confirmed:false,confirmedBy:null,           dayType:'sunday'},
      {d:'Mon 8 Sep', date:'2026-09-08',s:'P',r:'',             ts:'5:45 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Tue 9 Sep', date:'2026-09-09',s:'P',r:'',             ts:'5:47 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Wed 10 Sep',date:'2026-09-10',s:'P',r:'',             ts:'5:53 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Thu 11 Sep',date:'2026-09-11',s:'P',r:'',             ts:'5:42 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Fri 12 Sep',date:'2026-09-12',s:'P',r:'',             ts:'5:40 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sat 13 Sep',date:'2026-09-13',s:'P',r:'',             ts:'5:48 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sun 14 Sep',date:'2026-09-14',s:'H',r:'Sunday',       ts:'',       confirmed:false,confirmedBy:null,           dayType:'sunday'},
      {d:'Mon 15 Sep',date:'2026-09-15',s:'P',r:'',             ts:'5:44 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Tue 16 Sep',date:'2026-09-16',s:'H',r:'School Event Day',ts:'',   confirmed:false,confirmedBy:null,           dayType:'event'},
      {d:'Wed 17 Sep',date:'2026-09-17',s:'P',r:'',             ts:'5:46 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Thu 18 Sep',date:'2026-09-18',s:'H',r:'Half Day — PTM',ts:'',     confirmed:false,confirmedBy:null,           dayType:'halfday'},
      {d:'Fri 19 Sep',date:'2026-09-19',s:'P',r:'',             ts:'5:41 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
    ],
    'SC-HB-001':[
      {d:'Mon 1 Sep', date:'2026-09-01',s:'P',r:'',             ts:'5:40 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Tue 2 Sep', date:'2026-09-02',s:'P',r:'',             ts:'5:42 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Wed 3 Sep', date:'2026-09-03',s:'P',r:'',             ts:'5:38 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Thu 4 Sep', date:'2026-09-04',s:'H',r:'Ganesh Chaturthi',ts:'',   confirmed:false,confirmedBy:null,           dayType:'festival'},
      {d:'Fri 5 Sep', date:'2026-09-05',s:'P',r:'',             ts:'5:44 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sat 6 Sep', date:'2026-09-06',s:'P',r:'',             ts:'5:50 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sun 7 Sep', date:'2026-09-07',s:'H',r:'Sunday',       ts:'',       confirmed:false,confirmedBy:null,           dayType:'sunday'},
      {d:'Mon 8 Sep', date:'2026-09-08',s:'A',r:'Sick',         ts:'6:05 AM',confirmed:true, confirmedBy:'Mrs. Sharma', dayType:'working'},
      {d:'Tue 9 Sep', date:'2026-09-09',s:'P',r:'',             ts:'5:41 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Wed 10 Sep',date:'2026-09-10',s:'P',r:'',             ts:'5:39 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Thu 11 Sep',date:'2026-09-11',s:'P',r:'',             ts:'5:43 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Fri 12 Sep',date:'2026-09-12',s:'P',r:'',             ts:'5:45 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sat 13 Sep',date:'2026-09-13',s:'E',r:'Family event', ts:'6:18 AM',confirmed:true, confirmedBy:'Mrs. Sharma', dayType:'working'},
      {d:'Sun 14 Sep',date:'2026-09-14',s:'H',r:'Sunday',       ts:'',       confirmed:false,confirmedBy:null,           dayType:'sunday'},
      {d:'Mon 15 Sep',date:'2026-09-15',s:'P',r:'',             ts:'5:42 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Tue 16 Sep',date:'2026-09-16',s:'H',r:'School Event Day',ts:'',   confirmed:false,confirmedBy:null,           dayType:'event'},
      {d:'Wed 17 Sep',date:'2026-09-17',s:'P',r:'',             ts:'5:40 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Thu 18 Sep',date:'2026-09-18',s:'H',r:'Half Day — PTM',ts:'',     confirmed:false,confirmedBy:null,           dayType:'halfday'},
      {d:'Fri 19 Sep',date:'2026-09-19',s:'E',r:'Family function',ts:'6:12 AM',confirmed:true,confirmedBy:'Mrs. Sharma',dayType:'working'},
    ],
    'SC-HG-001':[
      {d:'Mon 1 Sep', date:'2026-09-01',s:'P',r:'',             ts:'5:45 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Tue 2 Sep', date:'2026-09-02',s:'P',r:'',             ts:'5:47 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Wed 3 Sep', date:'2026-09-03',s:'E',r:'Doctor appointment',ts:'6:15 AM',confirmed:true,confirmedBy:'Mrs. Sharma',dayType:'working'},
      {d:'Thu 4 Sep', date:'2026-09-04',s:'H',r:'Ganesh Chaturthi',ts:'',   confirmed:false,confirmedBy:null,           dayType:'festival'},
      {d:'Fri 5 Sep', date:'2026-09-05',s:'P',r:'',             ts:'5:50 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sat 6 Sep', date:'2026-09-06',s:'P',r:'',             ts:'5:53 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sun 7 Sep', date:'2026-09-07',s:'H',r:'Sunday',       ts:'',       confirmed:false,confirmedBy:null,           dayType:'sunday'},
      {d:'Mon 8 Sep', date:'2026-09-08',s:'P',r:'',             ts:'5:43 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Tue 9 Sep', date:'2026-09-09',s:'P',r:'',             ts:'5:46 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Wed 10 Sep',date:'2026-09-10',s:'P',r:'',             ts:'5:48 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Thu 11 Sep',date:'2026-09-11',s:'P',r:'',             ts:'5:44 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Fri 12 Sep',date:'2026-09-12',s:'P',r:'',             ts:'5:42 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sat 13 Sep',date:'2026-09-13',s:'P',r:'',             ts:'5:46 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Sun 14 Sep',date:'2026-09-14',s:'H',r:'Sunday',       ts:'',       confirmed:false,confirmedBy:null,           dayType:'sunday'},
      {d:'Mon 15 Sep',date:'2026-09-15',s:'A',r:'Unwell',       ts:'6:08 AM',confirmed:true, confirmedBy:'Mrs. Sharma', dayType:'working'},
      {d:'Tue 16 Sep',date:'2026-09-16',s:'H',r:'School Event Day',ts:'',   confirmed:false,confirmedBy:null,           dayType:'event'},
      {d:'Wed 17 Sep',date:'2026-09-17',s:'P',r:'',             ts:'5:49 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
      {d:'Thu 18 Sep',date:'2026-09-18',s:'H',r:'Half Day — PTM',ts:'',     confirmed:false,confirmedBy:null,           dayType:'halfday'},
      {d:'Fri 19 Sep',date:'2026-09-19',s:'P',r:'',             ts:'5:44 AM',confirmed:true, confirmedBy:'Mr. Singh',   dayType:'working'},
    ],
  },
};

function reducer(st,a){
  switch(a.type){
    case 'SET_NAME':  return{...st,appName:a.v,auditLog:[...st.auditLog,{ts:tsNow(),by:a.by,msg:`App name → "${a.v}"`}]};
    case 'SET_WIN':   return{...st,attWindow:a.v};
    case 'SET_LB':    return{...st,lbCount:a.v};
    case 'SET_HOL':   return{...st,holidayActive:a.active,holidayTitle:a.title||'',holidayMsg:a.msg||'',holidayType:a.holType||'Holiday'};
    case 'ADD_HOL':   return{...st,holidays:[...st.holidays,a.v]};
    case 'DEL_HOL':   return{...st,holidays:st.holidays.filter((_,i)=>i!==a.i)};
    case 'ADD_USER':  return{...st,users:{...st.users,[a.id]:{...a.v,wallet:[],pts:0,streak:0,rank:0,sa:false}},auditLog:[...st.auditLog,{ts:tsNow(),by:a.by,msg:`Added ${a.id}`}]};
    case 'EDIT_USER': return{...st,users:{...st.users,[a.id]:{...st.users[a.id],...a.v}},auditLog:[...st.auditLog,{ts:tsNow(),by:a.by,msg:`Edited ${a.id}`}]};
    case 'CHANGE_USER_ID':{
      if(!st.users[a.oldId]||st.users[a.newId]) return st; // skip if newId already exists
      const users={...st.users};
      users[a.newId]={...users[a.oldId]};
      delete users[a.oldId];
      // update attendance keys too
      const att={...st.attendance};
      if(att[a.oldId]){att[a.newId]=att[a.oldId];delete att[a.oldId];}
      return{...st,users,attendance:att,auditLog:[...st.auditLog,{ts:tsNow(),by:a.by,msg:`ID changed ${a.oldId}→${a.newId}`}]};
    }
    case 'DEL_USER':  {const u={...st.users};delete u[a.id];return{...st,users:u,auditLog:[...st.auditLog,{ts:tsNow(),by:a.by,msg:`Deleted ${a.id}`}]};}
    case 'TOGGLE_SA': {
      const targetUser = st.users[a.id];
      if(!targetUser) return st;
      // Only SA and TA can toggle — enforced in UI, double-check here
      return {...st, users:{...st.users,[a.id]:{...targetUser,sa:!targetUser.sa}},
        auditLog:[...st.auditLog,{ts:tsNow(),by:a.by||'Admin',msg:`Special access ${!targetUser.sa?'granted to':'removed from'} ${targetUser.name}`}]};
    }
    case 'MARK_ATT':  return{...st,attendance:{...st.attendance,[a.uid]:{status:a.status,reason:a.reason,ts:tsNow(),confirmed:false,confirmedBy:null,confirmedAt:null,editLog:[{action:'marked',status:a.status,ts:tsNow()}]}}};
    case 'CONFIRM_ATT':{
      const prev=st.attendance[a.uid]||{};
      return{...st,attendance:{...st.attendance,[a.uid]:{...prev,confirmed:true,confirmedBy:a.by,confirmedAt:tsNow(),editLog:[...(prev.editLog||[]),{action:`confirmed by ${a.by}`,ts:tsNow()}]}}};
    }
    case 'EDIT_ATT':{
      const prev=st.attendance[a.uid]||{};
      const log=[...(prev.editLog||[]),{action:`edited by ${a.by}`,prev:prev.status,new:a.v.status,ts:tsNow()}];
      return{...st,attendance:{...st.attendance,[a.uid]:{...prev,...a.v,editLog:log}}};
    }
    case 'DEL_ATT':   {const att={...st.attendance};delete att[a.uid];return{...st,attendance:att};}
    /* SET_DB_CONFIG removed — credentials not handled in UI */
    case 'ADD_DUTY_POINT': return{...st,dutyPoints:[...st.dutyPoints,{...a.v,id:'dp_'+Date.now(),assignedTo:null}]};
    case 'EDIT_DUTY_POINT': return{...st,dutyPoints:st.dutyPoints.map(p=>p.id===a.id?{...p,...a.v}:p)};
    case 'DEL_DUTY_POINT': return{...st,dutyPoints:st.dutyPoints.filter(p=>p.id!==a.id)};
    case 'ADD_DUTY_GROUP': return{...st,dutyGroups:[...st.dutyGroups,{...a.v,id:'g_'+Date.now()}]};
    case 'EDIT_DUTY_GROUP': return{...st,dutyGroups:st.dutyGroups.map(g=>g.id===a.id?{...g,...a.v}:g)};
    case 'DEL_DUTY_GROUP': return{...st,dutyGroups:st.dutyGroups.filter(g=>g.id!==a.id)};
    case 'SET_DUTY_ASSIGNMENTS': return{...st,dutyAssignments:a.v};
    case 'ADD_DUTY_LIST':  return{...st,dutyList:[...( st.dutyList||[]),{...a.v,id:'dl_'+Date.now()}]};
    case 'EDIT_DUTY_LIST': return{...st,dutyList:(st.dutyList||[]).map(e=>e.id===a.id?{...e,...a.v}:e)};
    case 'DEL_DUTY_LIST':  return{...st,dutyList:(st.dutyList||[]).filter(e=>e.id!==a.id)};
    case 'SET_WORKING_DAY':
      return{...st,workingDay:{isWorking:a.isWorking,type:a.dayType,note:a.note,setBy:a.by,setAt:tsNow(),
        log:[...(st.workingDay?.log||[]),{isWorking:a.isWorking,type:a.dayType,note:a.note,by:a.by,at:tsNow()}]},
        auditLog:[...st.auditLog,{ts:tsNow(),by:a.by,msg:`Day marked as ${a.dayType} by ${a.by}`}]};
    case 'ADD_NOTICE':
      return{...st,notices:[...st.notices,{id:'n_'+Date.now(),heading:a.v.heading,body:a.v.body,by:a.by,at:tsNow(),editedAt:null,seenBy:[]}]};
    case 'EDIT_NOTICE':
      return{...st,notices:st.notices.map(n=>n.id===a.id?{...n,...a.v,editedAt:tsNow()}:n)};
    case 'DEL_NOTICE':
      return{...st,notices:st.notices.filter(n=>n.id!==a.id)};
    case 'READ_NOTICES':
      return{...st,notices:st.notices.map(n=>({...n,seenBy:[...new Set([...(n.seenBy||[]),a.uid])]}))};

    case 'ADD_EVENT':    return{...st,events:[...st.events,{...a.v,id:'ev_'+Date.now(),addedBy:a.by}]};
    case 'EDIT_EVENT':   return{...st,events:st.events.map(ev=>ev.id===a.id?{...ev,...a.v}:ev)};
    case 'DEL_EVENT':    return{...st,events:st.events.filter(ev=>ev.id!==a.id)};
    case 'ADD_EVENT_CAT':return{...st,eventCategories:[...st.eventCategories,{...a.v,id:'cat_'+Date.now()}]};
    case 'DEL_EVENT_CAT':return{...st,eventCategories:st.eventCategories.filter(cat=>cat.id!==a.id)};
    case 'AWARD_EVENT_POINTS':{
      // Give pts to all badge holders of winning house
      const updUsers={...st.users};
      Object.keys(updUsers).forEach(uid=>{
        if(updUsers[uid].house===a.house && ['badge_holder','badge_admin'].includes(updUsers[uid].role)){
          updUsers[uid]={...updUsers[uid],pts:(updUsers[uid].pts||0)+a.pts,
            wallet:[...new Set([...(updUsers[uid].wallet||[]),'victory'])]};
        }
      });
      return{...st,users:updUsers,auditLog:[...st.auditLog,{ts:tsNow(),by:a.by,msg:`+${a.pts} pts awarded to ${a.house} house for ${a.eventTitle}`}]};
    }
    case 'ADD_BADGE':  return{...st,badges:[...st.badges,{...a.v,id:'badge_'+Date.now()}],auditLog:[...st.auditLog,{ts:tsNow(),by:a.by,msg:`Badge added: ${a.v.name}`}]};
    case 'EDIT_BADGE': return{...st,badges:st.badges.map(b=>b.id===a.id?{...b,...a.v}:b),auditLog:[...st.auditLog,{ts:tsNow(),by:a.by,msg:`Badge edited: ${a.id}`}]};
    case 'DEL_BADGE':  return{...st,badges:st.badges.filter(b=>b.id!==a.id),auditLog:[...st.auditLog,{ts:tsNow(),by:a.by,msg:`Badge deleted: ${a.id}`}]};
    default: return st;
  }
}

/* ══ TOAST ══ */
function Toasts({list}){
  return <div style={{position:'fixed',bottom:18,right:18,zIndex:9999,display:'flex',flexDirection:'column',gap:6}}>
    {list.map(t=><div key={t.id} style={{background:t.type==='success'?C.green:t.type==='error'?C.red:C.blue,color:'#fff',padding:'10px 14px',borderRadius:8,fontSize:12,fontWeight:500,display:'flex',alignItems:'center',gap:7,minWidth:220,boxShadow:'0 4px 16px rgba(0,0,0,.15)',animation:'toast .2s ease'}}>
      <I n={t.type==='success'?'chk':t.type==='error'?'xx':'info'} s={13} c="#fff" w={2.5}/>{t.msg}
    </div>)}
  </div>;
}

/* ══ LOADING ══ */
function Loading({name}){
  const [i,si]=useState(0);
  const msgs=[`${name} — Connecting to database…`,'Loading student records…','Almost ready…'];
  useEffect(()=>{const iv=setInterval(()=>si(x=>Math.min(x+1,2)),900);return()=>clearInterval(iv);},[]);
  return <div style={{position:'fixed',inset:0,background:'#0A0A0A',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,animation:'fadeIn .4s'}}>
      <Logo s={52}/>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:20,fontWeight:700,color:'#fff',letterSpacing:'-0.4px'}}>{name}</div>
        <div style={{fontSize:12,color:'#52525B',marginTop:4}}>Student Leadership Management System</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:7,marginTop:6}}>
        {[0,1,2].map(j=><div key={j} style={{width:5,height:5,borderRadius:'50%',background:'#fff',animation:'dot 1.4s ease-in-out infinite',animationDelay:`${j*.18}s`}}/>)}
        <span style={{fontSize:11,color:'#52525B',marginLeft:3}}>{msgs[i]}</span>
      </div>
    </div>
  </div>;
}

/* ══ LOGIN ══ */
function Login({name,onLogin}){
  const [id,sId]=useState('');const [pw,sPw]=useState('');
  const [show,sShow]=useState(false);const [err,sErr]=useState('');const [busy,sBusy]=useState(false);
  const submit=useCallback(()=>{
    if(!id.trim()||!pw){sErr('Please enter your ID and password.');return;}
    sBusy(true);sErr('');
    setTimeout(()=>{
      const u=INIT.users[id.trim()];
      if(u&&u.pw===pw)onLogin({id:id.trim(),...u});
      else{sErr('Invalid ID or Password.');sBusy(false);}
    },450);
  },[id,pw]);
  useEffect(()=>{const h=e=>{if(e.key==='Enter')submit();};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);},[submit]);
  const inp={width:'100%',padding:'10px 12px 10px 36px',border:'1px solid #2A2A2A',borderRadius:8,fontSize:13,color:'#fff',background:'#1A1A1A',outline:'none',transition:'border-color .15s'};
  return <div style={{minHeight:'100vh',background:'#0A0A0A',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <div style={{width:'100%',maxWidth:360,background:'#111',border:'1px solid #1F1F1F',borderRadius:14,padding:'34px 28px',boxShadow:'0 0 0 1px #1F1F1F,0 24px 64px rgba(0,0,0,.6)',animation:'fadeUp .3s ease'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,marginBottom:26}}>
        <Logo s={44}/>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:18,fontWeight:700,color:'#fff',letterSpacing:'-0.4px'}}>{name}</div>
          <div style={{fontSize:11,color:'#52525B',marginTop:3}}>Student Leadership Management System</div>
        </div>
      </div>
      {err&&<div style={{background:'rgba(220,38,38,.1)',border:'1px solid rgba(220,38,38,.25)',borderRadius:7,padding:'9px 12px',marginBottom:14,fontSize:12,color:'#F87171',display:'flex',alignItems:'center',gap:7}}><I n="info" s={13} c="#F87171"/>  {err}</div>}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div><label style={{display:'block',fontSize:11,fontWeight:500,color:'#A1A1AA',marginBottom:5}}>Enter your ID</label>
          <div style={{position:'relative'}}><span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',display:'flex',color:'#52525B'}}><I n="user" s={14} c="#52525B"/></span>
            <input style={inp} placeholder="e.g. SC-HB-001" value={id} onChange={e=>{sId(e.target.value);sErr('');}} onFocus={e=>e.target.style.borderColor='#3F3F46'} onBlur={e=>e.target.style.borderColor='#2A2A2A'}/>
          </div>
        </div>
        <div><label style={{display:'block',fontSize:11,fontWeight:500,color:'#A1A1AA',marginBottom:5}}>Password</label>
          <div style={{position:'relative'}}><span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',display:'flex',color:'#52525B'}}><I n="lock" s={14} c="#52525B"/></span>
            <input style={{...inp,paddingRight:38}} type={show?'text':'password'} placeholder="Password" value={pw} onChange={e=>{sPw(e.target.value);sErr('');}} onFocus={e=>e.target.style.borderColor='#3F3F46'} onBlur={e=>e.target.style.borderColor='#2A2A2A'}/>
            <button onClick={()=>sShow(s=>!s)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#52525B',display:'flex',padding:3}}><I n={show?'eyeoff':'eye'} s={13} c="#52525B"/></button>
          </div>
        </div>
      </div>
      <button onClick={submit} disabled={busy} style={{width:'100%',marginTop:16,padding:'11px',background:busy?'#2A2A2A':'#fff',color:busy?'#71717A':'#0A0A0A',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:busy?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'background .15s'}}>
        {busy?<><div style={{width:13,height:13,border:'2px solid #71717A',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Signing in…</>:'Sign In →'}
      </button>
      <div style={{marginTop:14,textAlign:'center',fontSize:11,color:'#3F3F46'}}>Contact your administrator if you forgot your ID</div>
    </div>
  </div>;
}

/* ══ SIDEBAR ══ */
function Sidebar({user,appName,page,onNav,onLogout}){
  const nav=useMemo(()=>{
    const isSA_=user.role==='super_admin';
    const isTA_=user.role==='teacher_admin';
    const canAdmin=isSA_||isTA_;
    const b=[
      {id:'dashboard', l:'Dashboard',     i:'grid'},
      {id:'attendance',l:'Attendance',    i:'cal'},
      {id:'leaderboard',l:'Top Holders',  i:'bar'},
      {id:'report',    l:'Monthly Report',i:'doc'},
    ];
    if(['super_admin','teacher_admin'].includes(user.role)) b.splice(1,0,{id:'pastdays',l:'Past Days',i:'hist'});
    if(user.role==='badge_admin'&&user.sa) b.push({id:'pastdays',l:'Past Days',i:'hist'});
    b.push({id:'notices',l:'Notices',i:'bell'});
    if(['super_admin','teacher_admin','badge_admin'].includes(user.role)) b.push({id:'members',l:'Badge Holders',i:'users'});
    if(canAdmin) b.push({id:'duty',l:'Duty Points',i:'shield'});
    if(canAdmin) b.push({id:'events',l:'Events',i:'star'});
    if(user.role==='super_admin') b.push({id:'badges',l:'Badges',i:'medal'});
    /* Database nav item removed for security — credentials managed via env vars */
    if(['super_admin','teacher_admin'].includes(user.role)) b.push({id:'admins',l:'Admins',i:'admins'});
    if(['super_admin','teacher_admin'].includes(user.role)) b.push({id:'settings',l:'Settings',i:'gear'});
    return b;
  },[user.role,user.sa]);
  const hc=HOUSES[user.house]||HOUSES.default;
  const roleTag=user.role==='super_admin'?{l:'Super Admin',c:'#F59E0B',bg:'rgba(245,158,11,.12)',b:'rgba(245,158,11,.25)'}:
                user.role==='teacher_admin'?{l:'Admin',c:'#60A5FA',bg:'rgba(96,165,250,.12)',b:'rgba(96,165,250,.25)'}:
                {l:'Member',c:'#4ADE80',bg:'rgba(74,222,128,.12)',b:'rgba(74,222,128,.25)'};
  return <div style={{width:200,minHeight:'100vh',background:C.sb,borderRight:`1px solid ${C.sbBorder}`,display:'flex',flexDirection:'column',position:'fixed',left:0,top:0,zIndex:100}}>
    <div style={{padding:'15px 14px 12px',borderBottom:`1px solid ${C.sbBorder}`}}>
      <div style={{display:'flex',alignItems:'center',gap:9}}>
        <Logo s={28}/>
        <div><div style={{fontSize:12,fontWeight:700,color:'#fff',letterSpacing:'-0.3px'}}>{appName}</div>
          <div style={{fontSize:9,color:'#3F3F46',textTransform:'uppercase',letterSpacing:'.05em',marginTop:1}}>Management</div>
        </div>
      </div>
    </div>
    <nav style={{flex:1,padding:'8px 6px',overflowY:'auto'}}>
      {nav.map(item=>{const act=page===item.id;return <div key={item.id} onClick={()=>onNav(item.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 9px',borderRadius:7,marginBottom:1,fontSize:12,fontWeight:act?600:400,color:act?'#fff':C.sbText,background:act?C.sbActiveBg:'transparent',cursor:'pointer',transition:'all .1s'}} onMouseEnter={e=>{if(!act)e.currentTarget.style.background='#111';}} onMouseLeave={e=>{if(!act)e.currentTarget.style.background='transparent';}}><span style={{color:act?C.greenDot:C.sbText,display:'flex',flexShrink:0}}><I n={item.i} s={14} c={act?C.greenDot:C.sbText}/></span>{item.l}</div>;})}
    </nav>
    <div style={{padding:'10px 10px 12px',borderTop:`1px solid ${C.sbBorder}`}}>
      <div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:4,marginBottom:8,fontSize:10,fontWeight:600,color:roleTag.c,background:roleTag.bg,border:`1px solid ${roleTag.b}`}}>
        <I n={user.role==='super_admin'?'shield':user.role==='teacher_admin'?'key':'star'} s={10} c={roleTag.c}/>{roleTag.l}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:hc.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>{ini(user.name)}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:600,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user.name}</div>
          <div style={{fontSize:10,color:'#3F3F46',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user.badge}</div>
        </div>
        <button onClick={onLogout} style={{background:'none',border:'none',cursor:'pointer',color:'#3F3F46',padding:3,borderRadius:4,display:'flex',flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color='#3F3F46'}><I n="out" s={14} c="currentColor"/></button>
      </div>
    </div>
  </div>;
}

const PH=({icon,title,right})=><div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:'11px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50}}>
  <div style={{display:'flex',alignItems:'center',gap:7}}><span style={{color:C.greenDot,display:'flex'}}><I n={icon} s={15} c={C.greenDot} w={2}/></span><span style={{fontSize:13,fontWeight:700,color:C.text}}>{title}</span></div>
  {right}
</div>;

const SC=({label,val,sub,icon,vc=C.text})=><div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 16px'}}>
  <div style={{fontSize:10,fontWeight:600,color:C.text4,display:'flex',alignItems:'center',gap:4,marginBottom:7,textTransform:'uppercase',letterSpacing:'.04em'}}><I n={icon} s={12} c={C.text4}/>{label}</div>
  <div style={{fontSize:22,fontWeight:800,color:vc,letterSpacing:'-0.8px'}}>{val}</div>
  {sub&&<div style={{fontSize:11,color:C.text4,marginTop:2}}>{sub}</div>}
</div>;

/* ══ BANNER SLIDESHOW ══ */
function BannerSlideshow({state,nav}){
  const [idx,setIdx]=useState(0);
  const [showAll,sShowAll]=useState(false);

  // Collect ALL banners that are currently active (date range covers today)
  const today=new Date().toISOString().slice(0,10);
  const banners=useMemo(()=>{
    const list=[];
    // Add all holidays whose date range covers today
    (state.holidays||[]).forEach(hol=>{
      if(!hol.date||hol.date>today) return; // not started yet
      if(hol.endDate&&hol.endDate<today) return; // already ended
      list.push({title:hol.name,type:hol.type||'Holiday',msg:hol.msg,date:hol.date,endDate:hol.endDate,by:hol.by,at:hol.at});
    });
    // Also include the manually activated banner if it's not already in list
    if(state.holidayActive&&state.holidayTitle){
      const alreadyIn=list.find(b=>b.title===state.holidayTitle);
      if(!alreadyIn){
        list.push({title:state.holidayTitle,type:state.holidayType||'Holiday',msg:state.holidayMsg,date:'',endDate:'',by:'',at:''});
      }
    }
    return list;
  },[state.holidayActive,state.holidayTitle,state.holidayMsg,state.holidays,today]);

  useEffect(()=>{
    if(banners.length<=1) return;
    const iv=setInterval(()=>setIdx(i=>(i+1)%banners.length),4000);
    return()=>clearInterval(iv);
  },[banners.length]);

  if(banners.length===0) return null;
  const b=banners[idx%banners.length];
  const theme=getBannerTheme(b.title,b.type);
  const IconFn=getBannerIcon(b.title,b.type,b.msg);

  return (
    <>
      <div onClick={()=>sShowAll(true)} style={{
        background:theme.bg,border:`1px solid ${theme.border}`,
        borderRadius:12,padding:'13px 16px',marginBottom:14,
        display:'flex',alignItems:'center',gap:12,cursor:'pointer',
        transition:'box-shadow .15s',position:'relative',
      }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
        <div style={{width:36,height:36,borderRadius:9,background:theme.border,
          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          {IconFn?IconFn(theme.icon):<I n="info" s={18} c={theme.icon}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:theme.title}}>{b.title}</div>
          {b.msg&&<div style={{fontSize:12,color:theme.title,opacity:.75,marginTop:2,
            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.msg}</div>}
        </div>
        {/* Dots */}
        {banners.length>1&&<div style={{display:'flex',gap:4,flexShrink:0}}>
          {banners.map((_,i)=><div key={i} style={{
            width:i===idx%banners.length?16:5,height:5,borderRadius:3,
            background:theme.icon,opacity:i===idx%banners.length?1:0.3,
            transition:'all .3s',
          }}/>)}
        </div>}
        <I n="arrow" s={14} c={theme.icon}/>
      </div>

      {/* All Banners Modal */}
      {showAll&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
          onClick={e=>{if(e.target===e.currentTarget)sShowAll(false);}}>
          <div style={{background:C.white,borderRadius:16,width:'100%',maxWidth:480,
            maxHeight:'85vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,.25)',
            animation:'fadeUp .2s'}}>
            <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`,
              display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>All Active Banners</div>
              <button onClick={()=>sShowAll(false)} style={{background:C.border2,
                border:'none',borderRadius:7,padding:6,cursor:'pointer',display:'flex'}}>
                <I n="xx" s={13} c={C.text3}/>
              </button>
            </div>
            <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
              {banners.map((bn,i)=>{
                const t2=getBannerTheme(bn.title,bn.type);
                const IF2=getBannerIcon(bn.title,bn.type,bn.msg);
                return (
                  <div key={i} style={{background:t2.bg,border:`1px solid ${t2.border}`,
                    borderRadius:10,padding:'14px 16px'}}>
                    <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                      <div style={{width:34,height:34,borderRadius:8,background:t2.border,
                        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {IF2?IF2(t2.icon):<I n="info" s={16} c={t2.icon}/>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:t2.title}}>{bn.title}</div>
                        {bn.msg&&<div style={{fontSize:12,color:t2.title,opacity:.75,marginTop:2}}>{bn.msg}</div>}
                        <div style={{fontSize:10,color:t2.title,opacity:.5,marginTop:5,display:'flex',gap:12}}>
                          {bn.date&&<span>Date: {bn.date}</span>}
                          {bn.endDate&&<span>Until: {bn.endDate}</span>}
                          {bn.by&&<span>By: {bn.by}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ══ DASHBOARD ══ */
function Dashboard({user,state,dispatch,toast,nav}){
  const isSA=user.role==='super_admin',isTA=user.role==='teacher_admin',isH=!isSA&&!isTA;
  const hc=HOUSES[user.house]||HOUSES.default;
  const att=state.attendance[user.id];
  const members=Object.entries(state.users).filter(([,u])=>['badge_holder','badge_admin'].includes(u.role)).map(([id,u])=>({id,...u}));
  const myData=state.monthly[user.id]||[];
  const myP=myData.filter(d=>d.s==='P').length,myTotal=myData.filter(d=>d.s!=='H').length;
  let bannerBg='#18181B',bannerFg='#F59E0B',bannerSub='rgba(245,158,11,0.65)';
  if(isH){
    if(user.badge.includes('House')){bannerBg=hc.grad;bannerFg='#fff';bannerSub='rgba(255,255,255,0.65)';}
    else{const rt=Object.entries(RTHEME).find(([k])=>user.badge.includes(k));if(rt){bannerBg=rt[1].bg;bannerFg=rt[1].fg;bannerSub=rt[1].sub;}}
  }
  return <div style={{padding:'18px 22px',maxWidth:920,animation:'fadeUp .2s'}}>
    <div style={{marginBottom:18,display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
      <div>
        <div style={{fontSize:19,fontWeight:700,color:C.text,letterSpacing:'-0.4px'}}>{greet()}, {user.name.split(' ')[0]}</div>
        <div style={{fontSize:12,color:C.text3,marginTop:2}}>{isSA?'Super Admin Dashboard — Full system control.':isTA?`Welcome, ${user.badge}.`:'Welcome back to Student Council.'}</div>
      </div>
      {(()=>{
        const allNotices=state.notices||[];
        const unread=allNotices.filter(n=>!(n.seenBy||[]).includes(user.id));
        const allRead=allNotices.length>0&&unread.length===0;
        return <button onClick={()=>{nav('notices');if(unread.length>0)dispatch({type:'READ_NOTICES',uid:user.id});}} style={{
          padding:'7px 12px',background:C.white,color:C.text,
          border:`1px solid ${C.border}`,borderRadius:8,
          fontSize:11,fontWeight:600,cursor:'pointer',
          display:'flex',alignItems:'center',gap:5,flexShrink:0,marginTop:2,
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <I n="bell" s={13} c={C.text}/>Notices
          {unread.length>0&&<span style={{
            background:C.red,color:'#fff',fontSize:9,fontWeight:700,
            padding:'1px 5px',borderRadius:10,
          }}>{unread.length}</span>}
          {allRead&&<span style={{
            background:C.green,color:'#fff',fontSize:9,fontWeight:700,
            width:16,height:16,borderRadius:'50%',
            display:'inline-flex',alignItems:'center',justifyContent:'center',
          }}><I n="chk" s={9} c="#fff" w={3}/></span>}
        </button>;
      })()}
    </div>
    <BannerSlideshow state={state} nav={nav}/>
    {isH&&<div style={{background:bannerBg,borderRadius:12,padding:'16px 20px',marginBottom:18,position:'relative',overflow:'hidden'}}>
      {/* Top row: Special Access badge if enabled */}
      {user.sa&&<div style={{
        display:'flex',alignItems:'center',gap:5,
        background:'rgba(255,255,255,0.15)',
        borderRadius:6,padding:'3px 8px',
        border:'1px solid rgba(255,255,255,0.2)',
        width:'fit-content',marginBottom:10,
      }}>
        <I n="shield" s={12} c="rgba(255,255,255,0.9)" w={2}/>
        <span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.9)'}}>Special Access</span>
      </div>}
      {/* Main row: icon + name + streak */}
      <div style={{display:'flex',alignItems:'center',gap:12,position:'relative',zIndex:1}}>
        <div style={{width:42,height:42,borderRadius:11,background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <I n={user.badge.includes('Head')?'crown':user.badge.includes('Sport')?'trophy':user.badge.includes('Disc')?'shield':user.badge.includes('Editor')?'edit':user.badge.includes('CCA')||user.badge.includes('Media')?'star':'star'} s={20} c={bannerFg} w={2}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:800,color:bannerFg,letterSpacing:'.3px',textTransform:'uppercase'}}>{user.badge}</div>
          <div style={{fontSize:11,color:bannerSub,marginTop:2}}>{user.house&&user.house!=='default'?`${user.house} House · `:''}Student Council</div>
        </div>
        {user.streak>0&&<div style={{textAlign:'center',background:'rgba(255,255,255,0.1)',borderRadius:8,padding:'6px 12px',flexShrink:0}}>
          <div style={{fontSize:16,fontWeight:800,color:bannerFg}}>{user.streak}</div>
          <div style={{fontSize:9,color:bannerSub,textTransform:'uppercase',letterSpacing:'.04em'}}>Day Streak</div>
        </div>}
      </div>
      <div style={{position:'absolute',right:-18,top:-18,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}/>
    </div>}
    {(isSA||isTA)&&<div style={{background:'linear-gradient(135deg,#000,#18181B)',border:`1px solid ${C.sbBorder}`,borderRadius:12,padding:'16px 20px',marginBottom:18}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:42,height:42,borderRadius:11,background:isSA?'rgba(245,158,11,.1)':'rgba(96,165,250,.1)',display:'flex',alignItems:'center',justifyContent:'center'}}><I n={isSA?'shield':'key'} s={20} c={isSA?'#F59E0B':'#60A5FA'} w={2}/></div>
        <div><div style={{fontSize:13,fontWeight:800,color:'#fff',textTransform:'uppercase',letterSpacing:'.3px'}}>{isSA?'Super Admin Dashboard':user.badge+' Dashboard'}</div><div style={{fontSize:11,color:'#52525B',marginTop:2}}>{isSA?'Full control — members, settings, algorithm, audit':'Manage badge holders, attendance, holidays'}</div></div>
        <div style={{marginLeft:'auto'}}><Tag ch={isSA?'Super Admin':'Admin'} c={isSA?'#F59E0B':'#60A5FA'} bg={isSA?'rgba(245,158,11,.08)':'rgba(96,165,250,.08)'} b={isSA?'rgba(245,158,11,.2)':'rgba(96,165,250,.2)'}/></div>
      </div>
    </div>}
    {isH&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:18}}>
      <div onClick={()=>nav('report')} style={{cursor:'pointer'}}><SC label="Attendance" val={`${myP}/${myTotal}`} sub="This month" icon="cal" vc={C.green}/></div>
      <div onClick={()=>nav('leaderboard')} style={{cursor:'pointer'}}><SC label="Points" val={user.pts} sub="Total earned" icon="star" vc={C.blue}/></div>
      <div onClick={()=>nav('leaderboard')} style={{cursor:'pointer'}}><SC label="Rank" val={user.rank>0?`#${user.rank}`:'—'} sub="Leaderboard" icon="trophy" vc={C.text}/></div>
    </div>}
    {(isSA||isTA)&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:18}}>
      <SC label="Total Members" val={members.length} sub="Badge holders" icon="users" vc={C.blue}/>
      <SC label="Present Today" val={Object.values(state.attendance).filter(a=>a.status==='present').length} sub="Self-marked" icon="chk" vc={C.green}/>
      <SC label="PE Confirmed" val={Object.values(state.attendance).filter(a=>a.confirmed).length} sub="Confirmed" icon="shield" vc={C.yel}/>
    </div>}
    {isH&&<div style={{marginBottom:18}}>
      <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><I n="cal" s={13} c={C.text4}/>Today's Attendance</div>
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
        {att?<div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:att.status==='present'?C.greenL:att.status==='absent'?C.redL:C.yelL,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><I n={att.status==='present'?'chk':att.status==='absent'?'xx':'warn'} s={16} c={att.status==='present'?C.green:att.status==='absent'?C.red:C.yel} w={2.5}/></div>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:C.text,textTransform:'capitalize'}}>{att.status==='emergency'?'Emergency Leave':att.status}</div><div style={{fontSize:11,color:C.text3,marginTop:2}}>{att.confirmed?`Confirmed by ${att.confirmedBy} · ${att.confirmedAt}`:'Confirmation pending from PE Sir'}</div></div>
          <Tag ch={att.confirmed?'Confirmed':'Pending'} c={att.confirmed?C.green:C.blue} bg={att.confirmed?C.greenL:C.blueL} b={att.confirmed?C.greenB:C.blueB}/>
        </div>:<div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:C.border2,display:'flex',alignItems:'center',justifyContent:'center'}}><I n="clk" s={16} c={C.text4}/></div>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:C.text}}>Not marked yet</div><div style={{fontSize:11,color:C.text3,marginTop:2}}>Go to Attendance to mark for today</div></div>
          <Tag ch="Pending"/>
        </div>}
      </div>
    </div>}
    {(isSA||isTA)&&<div>
      <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{display:'flex',alignItems:'center',gap:6}}><I n="users" s={13} c={C.text4}/>Recent Badge Holders Today</span>
        <button onClick={()=>nav('members')} style={{fontSize:11,color:C.green,background:C.greenL,border:`1px solid ${C.greenB}`,borderRadius:5,padding:'3px 9px',cursor:'pointer',fontWeight:600}}>View All</button>
      </div>
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
        {members.slice(0,5).map((m,i)=>{const hc2=HOUSES[m.house]||HOUSES.default;const a=state.attendance[m.id];return <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:i<4?`1px solid ${C.border2}`:'none'}}>
          <div style={{width:26,height:26,borderRadius:7,background:hc2.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{ini(m.name)}</div>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:C.text}}>{m.name}</div><div style={{fontSize:10,color:C.text4}}>{m.badge}</div></div>
          <Tag ch={a?a.confirmed?'Confirmed':a.status==='present'?'Pending':a.status==='absent'?'Absent':'Emergency':'—'} c={a?a.confirmed?C.green:a.status==='absent'?C.red:C.blue:C.text4} bg={a?a.confirmed?C.greenL:a.status==='absent'?C.redL:C.blueL:C.border2} b={a?a.confirmed?C.greenB:a.status==='absent'?C.redB:C.blueB:C.border}/>
        </div>;})}
      </div>
    </div>}
    {isH&&<div style={{marginTop:18}}>
      <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><I n="medal" s={13} c={C.text4}/>My Badges</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(116px,1fr))',gap:8}}>
        {BADGES.map(b=>{const earned=user.wallet?.includes(b.id);return <div key={b.id} style={{background:C.white,border:`1px solid ${earned?b.color+'44':C.border}`,borderRadius:10,padding:'12px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:5,textAlign:'center',opacity:earned?1:.4,filter:earned?'none':'grayscale(1)'}}>
          <div style={{width:32,height:32,borderRadius:8,background:earned?b.color+'15':C.border2,display:'flex',alignItems:'center',justifyContent:'center',color:b.color}}><I n={b.id==='flash'?'sun':b.id==='logmaster'?'cal':b.id==='unstoppable'?'trophy':b.id==='turnaround'?'hist':b.id==='weekend'?'sun':b.id==='bulletproof'?'shield':b.id==='task'?'chk':b.id==='victory'?'trophy':b.id==='unsung'?'crown':'star'} s={16} c={b.color} w={2}/></div>
          <div style={{fontSize:10,fontWeight:600,color:C.text,lineHeight:1.3}}>{b.name}</div>
          <div style={{fontSize:10,fontWeight:600,color:b.color}}>+{b.pts} pts</div>
        </div>;})}
      </div>
    </div>}
  </div>;
}

/* ══ PAST DAYS ══ */
function PastDays({user,state}){
  const [date,setDate]=useState('2026-09-03');
  const isSA=user.role==='super_admin',isTA=user.role==='teacher_admin';
  const hasSpecial=user.sa===true; // badge_admin with special access
  const canSeeAll=isSA||isTA||hasSpecial;
  const members=Object.entries(state.users).filter(([,u])=>['badge_holder','badge_admin'].includes(u.role)).map(([id,u])=>({id,...u}));
  const mockPastAtt={
    'SC-SC-B':  {status:'present',  reason:'',      ts:'5:42 AM',confirmed:true, confirmedBy:'Mr. Singh'},
    'SC-SC-G':  {status:'present',  reason:'',      ts:'6:01 AM',confirmed:true, confirmedBy:'Mr. Singh'},
    'SC-HC-VIK':{status:'absent',   reason:'Fever', ts:'5:55 AM',confirmed:true, confirmedBy:'Mrs. Sharma'},
    'SC-DC-B':  {status:'emergency',reason:'Family',ts:'6:30 AM',confirmed:true, confirmedBy:'Mr. Singh'},
    'SC-SE-1':  {status:'present',  reason:'',      ts:'5:50 AM',confirmed:true, confirmedBy:'Mr. Singh'},
    'SC-HP-VIK':{status:'absent',   reason:'Sick',  ts:'6:10 AM',confirmed:false,confirmedBy:null},
    'SC-CC-B':  {status:'present',  reason:'',      ts:'5:48 AM',confirmed:true, confirmedBy:'Mrs. Sharma'},
    'SC-HB-001':{status:'present',  reason:'',      ts:'5:40 AM',confirmed:true, confirmedBy:'Mr. Singh'},
    'SC-HG-001':{status:'present',  reason:'',      ts:'5:45 AM',confirmed:true, confirmedBy:'Mr. Singh'},
    'SC-MH-1':  {status:'present',  reason:'',      ts:'6:05 AM',confirmed:true, confirmedBy:'Mrs. Sharma'},
  };
  // Filter rows based on access
  const rows = canSeeAll ? members : members.filter(m=>m.id===user.id);
  // Sunday check for selected date
  const selectedDateObj = new Date(date+'T00:00:00');
  const isSundaySelected = selectedDateObj.getDay()===0;
  // Respect admin override: if today is Sunday and admin forced working, treat as working
  const wd3=state.workingDay||{isWorking:true,dayType:'working'};
  const sunOverride=wd3.isWorking===true&&wd3.dayType==='override';
  // Only treat as non-working Sunday if it's actually Sunday AND no override
  const effectiveSunday=isSundaySelected&&!sunOverride;
  // Holiday check for selected date
  const isHolidaySelected = (state.holidays||[]).some(h=>{
    if(!h.date) return false;
    if(h.date>date) return false;
    if(h.endDate&&h.endDate<date) return false;
    return true;
  });
  const isNonWorkingSelected = effectiveSunday || isHolidaySelected;
  const P=rows.filter(m=>mockPastAtt[m.id]?.status==='present').length;
  const A=rows.filter(m=>mockPastAtt[m.id]?.status==='absent').length;
  const E=rows.filter(m=>mockPastAtt[m.id]?.status==='emergency').length;
  return <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}>
    {!canSeeAll&&<div style={{background:C.blueL,border:`1px solid ${C.blueB}`,borderRadius:8,padding:'9px 14px',marginBottom:14,fontSize:12,color:C.blue,fontWeight:500,display:'flex',alignItems:'center',gap:7}}><I n="info" s={13} c={C.blue}/>You can only view your own past attendance. Special access required to view all.</div>}
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <label style={{fontSize:12,fontWeight:600,color:C.text2}}>Select Date</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} max={new Date().toISOString().slice(0,10)} style={{padding:'7px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,background:C.white,outline:'none'}}/>
      </div>
      <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
        <Tag ch={`${P} Present`} c={C.green} bg={C.greenL} b={C.greenB}/>
        <Tag ch={`${A} Absent`}  c={C.red}   bg={C.redL}   b={C.redB}/>
        <Tag ch={`${E} Emergency`} c={C.yel} bg={C.yelL}   b={C.yelB}/>
      </div>
    </div>
    {isNonWorkingSelected&&<div style={{background:effectiveSunday?C.border2:C.yelL,border:`1px solid ${effectiveSunday?C.border:C.yelB}`,borderRadius:10,padding:'16px 20px',textAlign:'center',color:effectiveSunday?C.text3:C.yel,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      <I n={effectiveSunday?'clk':'warn'} s={28} c={effectiveSunday?C.text4:C.yel}/>
      <div style={{fontSize:13,fontWeight:700,color:effectiveSunday?C.text2:'#92400E'}}>{effectiveSunday?'Sunday — No Attendance':'Holiday / Non-Working Day'}</div>
      <div style={{fontSize:11,color:effectiveSunday?C.text4:'#B45309'}}>{effectiveSunday?'Sundays are not working days. No attendance is recorded.':'This day is marked as a holiday or non-working day. No attendance is recorded.'}</div>
    </div>}
    {!isNonWorkingSelected&&<div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
      <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`,fontSize:11,fontWeight:700,color:C.text}}>
        {canSeeAll?'Full Attendance':'My Attendance'} — {new Date(date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1.4fr 80px 1fr 90px',padding:'8px 14px',borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text4,gap:10,textTransform:'uppercase',letterSpacing:'.04em'}}>
        <span>Name</span><span>Badge</span><span>Status</span><span>Reason / Time</span><span>Confirmed By</span>
      </div>
      {rows.map((m,i)=>{
        const hc2=HOUSES[m.house]||HOUSES.default;const a=mockPastAtt[m.id];
        const sc=a?.status==='present'?{c:C.green,bg:C.greenL}:a?.status==='absent'?{c:C.red,bg:C.redL}:{c:C.yel,bg:C.yelL};
        return <div key={m.id} style={{display:'grid',gridTemplateColumns:'1.6fr 1.4fr 80px 1fr 90px',padding:'10px 14px',borderBottom:i<rows.length-1?`1px solid ${C.border2}`:'none',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:26,height:26,borderRadius:7,background:hc2.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{ini(m.name)}</div>
            <div><div style={{fontSize:12,fontWeight:600,color:C.text}}>{m.name}</div><div style={{fontSize:10,color:C.text4}}>{m.id}</div></div>
          </div>
          <div style={{fontSize:11,color:C.text2}}>{m.badge}</div>
          <div>{a?<Tag ch={a.status==='present'?'P':a.status==='absent'?'A':'E'} c={sc.c} bg={sc.bg} b={sc.c+'44'}/>:<Tag ch="—"/>}</div>
          <div style={{fontSize:11,color:C.text3}}>{a?.reason||'—'}{a&&<span style={{marginLeft:6,fontSize:10,color:C.text4}}>· {a.ts}</span>}</div>
          <div>{a?.confirmed?<Tag ch={a.confirmedBy?.split(' ').slice(-1)[0]||a.confirmedBy} c={C.green} bg={C.greenL} b={C.greenB}/>:<Tag ch="Pending" c={C.yel} bg={C.yelL} b={C.yelB}/>}</div>
        </div>;
      })}
    </div>}
  </div>;
}

/* ══ ATTENDANCE ══ */
function Attendance({user,state,dispatch,toast}){
  const [sel,sSel]=useState(null);const [reason,sReason]=useState('');
  // Live clock — updates every minute so window status auto-refreshes
  const [now,sNow]=useState(()=>new Date());
  useEffect(()=>{const iv=setInterval(()=>sNow(new Date()),30000);return()=>clearInterval(iv);},[]);

  const isSA=user.role==='super_admin',isTA=user.role==='teacher_admin';
  const att=state.attendance[user.id];
  if(isSA) return <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}><AttEdit user={user} state={state} dispatch={dispatch} toast={toast} isSA={true}/></div>;
  if(isTA) return <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}><AttEdit user={user} state={state} dispatch={dispatch} toast={toast} isSA={false}/></div>;

  // ── Attendance window check (badge holders only) ──
  const toMins=(hhmm)=>{const [h,m]=(hhmm||'00:00').split(':').map(Number);return h*60+m;};
  const curMins=now.getHours()*60+now.getMinutes();
  const winStart=toMins(state.attWindow?.start||'05:00');
  const winEnd  =toMins(state.attWindow?.end  ||'08:00');
  const isWindowOpen=curMins>=winStart&&curMins<=winEnd;
  const fmt12=(hhmm)=>{const [h,m]=(hhmm||'00:00').split(':').map(Number);const ampm=h>=12?'PM':'AM';const h12=h%12||12;return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`;};

  // If window not open AND holder hasn't marked yet — show "not time" banner
  if(!isWindowOpen&&!att){
    const beforeWindow=curMins<winStart;
    return <div style={{padding:'18px 22px',maxWidth:520,animation:'fadeUp .2s'}}>
      <div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:12,padding:'20px 18px',display:'flex',gap:14,alignItems:'flex-start'}}>
        <div style={{width:40,height:40,borderRadius:10,background:'#FFEDD5',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <I n="clk" s={20} c="#F97316" w={2}/>
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:'#C2410C',marginBottom:4}}>
            {beforeWindow?'Attendance Window Not Open Yet':'Attendance Window Has Closed'}
          </div>
          <div style={{fontSize:12,color:'#9A3412',lineHeight:1.7}}>
            {beforeWindow
              ?<>Today's attendance window opens at <strong>{fmt12(state.attWindow?.start)}</strong>. Please come back then to mark your attendance.</>
              :<>Today's attendance window closed at <strong>{fmt12(state.attWindow?.end)}</strong>. You can no longer mark attendance for today. Contact PE Sir if needed.</>
            }
          </div>
          <div style={{marginTop:12,display:'flex',alignItems:'center',gap:6,padding:'8px 12px',background:'#FFEDD5',borderRadius:8,width:'fit-content'}}>
            <I n="clk" s={12} c="#F97316"/>
            <span style={{fontSize:11,fontWeight:600,color:'#C2410C'}}>Window: {fmt12(state.attWindow?.start)} – {fmt12(state.attWindow?.end)}</span>
          </div>
        </div>
      </div>
    </div>;
  }

  const submit=()=>{
    if((sel==='absent'||sel==='emergency')&&!reason.trim()){toast('Please provide a reason.','error');return;}
    dispatch({type:'MARK_ATT',uid:user.id,status:sel,reason});
    toast('Attendance saved! Visit PE Sir for confirmation.','success');
  };
  if(att) return <div style={{padding:'18px 22px',maxWidth:520,animation:'fadeUp .2s'}}>
    <div style={{background:att.confirmed?C.greenL:C.blueL,border:`1px solid ${att.confirmed?C.greenB:C.blueB}`,borderRadius:10,padding:18,display:'flex',gap:12,alignItems:'flex-start'}}>
      <div style={{width:34,height:34,borderRadius:9,background:att.confirmed?'#DCFCE7':'#DBEAFE',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><I n={att.confirmed?'chk':'clk'} s={16} c={att.confirmed?C.green:C.blue} w={2.5}/></div>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:att.confirmed?C.green:C.blue}}>{att.confirmed?'Attendance Confirmed ✓':'Done — Confirmation is pending...'}</div>
        <div style={{fontSize:12,color:att.confirmed?C.green:C.blue,opacity:.85,marginTop:5,lineHeight:1.7}}>{att.confirmed?<>Confirmed by <strong>{att.confirmedBy}</strong> at {att.confirmedAt}</>:<>Saved at <strong>{att.ts}</strong>. Please visit PE Sir's office for confirmation.</>}</div>
      </div>
    </div>
  </div>;
  return <div style={{padding:'18px 22px',maxWidth:520,animation:'fadeUp .2s'}}>
    <div style={{background:C.greenL,border:`1px solid ${C.greenB}`,borderRadius:8,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8,fontSize:12,color:C.green,fontWeight:500}}>
      <I n="clk" s={13} c={C.green}/>Window: <strong>{fmt12(state.attWindow?.start)} – {fmt12(state.attWindow?.end)}</strong>
    </div>
    <div style={{fontSize:11,color:C.text3,marginBottom:12}}>Select your status for today:</div>
    {[{id:'present',l:'Present',sub:'I will be coming to school today',ic:'chk',ac:C.green,ab:C.greenL,abr:C.greenB},
      {id:'absent', l:'Absent', sub:'I will not be coming today',      ic:'xx', ac:C.red,  ab:C.redL, abr:C.redB},
      {id:'emergency',l:'Emergency Leave',sub:'Sudden urgent reason for absence',ic:'warn',ac:C.yel,ab:C.yelL,abr:C.yelB}
    ].map(opt=><div key={opt.id} onClick={()=>sSel(opt.id)} style={{border:`1.5px solid ${sel===opt.id?opt.abr:C.border}`,background:sel===opt.id?opt.ab:C.white,borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,marginBottom:8,cursor:'pointer',transition:'all .12s'}}>
      <div style={{width:34,height:34,borderRadius:9,background:sel===opt.id?opt.ab:C.border2,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><I n={opt.ic} s={16} c={sel===opt.id?opt.ac:C.text4} w={2.5}/></div>
      <div><div style={{fontSize:12,fontWeight:600,color:C.text}}>{opt.l}</div><div style={{fontSize:11,color:C.text3,marginTop:1}}>{opt.sub}</div></div>
    </div>)}
    {(sel==='absent'||sel==='emergency')&&<div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:9,padding:12,marginBottom:12,animation:'fadeUp .15s'}}>
      <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:6}}>Reason <span style={{color:C.red}}>*</span></label>
      <textarea value={reason} onChange={e=>sReason(e.target.value)} placeholder="Please provide a reason..." style={{width:'100%',minHeight:72,border:`1px solid ${C.border}`,borderRadius:7,padding:'8px 10px',fontSize:12,color:C.text,resize:'vertical',outline:'none',fontFamily:'inherit',background:C.bg,lineHeight:1.6}}/>
    </div>}
    <button onClick={submit} disabled={!sel} style={{width:'100%',padding:'11px',background:sel?C.text:C.border,color:sel?'#fff':C.text4,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:sel?'pointer':'not-allowed',transition:'all .15s'}}>Save Attendance</button>
  </div>;
}

/* ══ ATTENDANCE EDIT (SA + TA) ══ */
function AttEdit({user,state,dispatch,toast,isSA}){
  const [editId,sEid]=useState(null);
  const [editV,sEv]=useState({status:'present',reason:''});
  const [showWDModal,sShowWDModal]=useState(false);
  const [wdType,sWdType]=useState('holiday');
  const [wdNote,sWdNote]=useState('');
  const members=Object.entries(state.users).filter(([,u])=>['badge_holder','badge_admin'].includes(u.role)).map(([id,u])=>({id,...u}));
  const wd=state.workingDay||{isWorking:true,type:'working'};

  // ── Sunday detection (always non-working unless admin manually overrides) ──
  const todayDayOfWeek=new Date().getDay(); // 0=Sun
  const isTodaySunday=todayDayOfWeek===0;

  // ── Holiday detection for today ──
  const todayISO=new Date().toISOString().slice(0,10);
  const isTodayHoliday=(state.holidays||[]).some(h=>{
    if(!h.date) return false;
    if(h.date>todayISO) return false;
    if(h.endDate&&h.endDate<todayISO) return false;
    return true;
  });

  // isWorking: Sunday only working if admin set dayType='override' explicitly
  const adminOverride=wd.isWorking===true&&wd.dayType==='override';
  const isWorking=isTodaySunday
    ? adminOverride
    : (wd.isWorking!==false);

  // Combined non-working reason
  const nonWorkingReason=isTodaySunday?'Sunday'
    :isTodayHoliday?'Holiday'
    :wd.note||wd.type||'Non-Working Day';

  const activeHol=state.holidays?.find(h=>{
    if(!h.date) return false;
    if(h.date>todayISO) return false;
    if(h.endDate&&h.endDate<todayISO) return false;
    return true;
  })||null;

  return <div>
    {/* ── Working Day Bar ── */}
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,gap:10,flexWrap:'wrap'}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:12,fontWeight:600,color:C.text}}>Today:</span>
        <div style={{
          display:'inline-flex',alignItems:'center',gap:6,
          padding:'6px 12px',borderRadius:8,
          background:isWorking?C.greenL:'#FEF2F2',
          border:`1px solid ${isWorking?C.greenB:'#FECACA'}`,
          fontSize:12,fontWeight:700,
          color:isWorking?C.green:'#DC2626',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill={isWorking?C.green:'#DC2626'}>{isWorking?<circle cx="12" cy="12" r="10"/>:<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>}</svg>
          {isWorking?'Working Day':isTodaySunday?'Sunday — Non-Working':isTodayHoliday?'Holiday':
            `${wd.type==='holiday'?'Holiday':wd.type==='halfday'?'Half Day':wd.type==='emergency'?'Emergency':wd.type==='event'?'Event Day':'Non-Working'}`}
        </div>
        {!isWorking&&nonWorkingReason&&!isTodaySunday&&<span style={{fontSize:11,color:C.text3}}>— {nonWorkingReason}</span>}
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {/* Don't show "Mark Working" button on Sunday — it's shown separately as override */}
        {!isTodaySunday&&<button onClick={()=>{
          dispatch({type:'SET_WORKING_DAY',isWorking:true,dayType:'working',note:'',by:user.name});
          toast('Marked as Working Day','success');
        }} style={{
          padding:'6px 12px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
          background:isWorking?C.text:C.white,color:isWorking?'#fff':C.text3,
          border:`1px solid ${isWorking?C.text:C.border}`,transition:'all .15s',
        }}>✓ Working Day</button>}
        {!isTodaySunday&&<button onClick={()=>sShowWDModal(true)} style={{
          padding:'6px 12px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
          background:!isWorking?C.red:'#fff',color:!isWorking?'#fff':C.text3,
          border:`1px solid ${!isWorking?C.red:C.border}`,transition:'all .15s',
        }}>✕ Non-Working</button>}
        <button onClick={()=>toast('Confirmed attendance saved!','success')} style={{
          padding:'6px 12px',background:C.text,color:'#fff',border:'none',
          borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
          display:'flex',alignItems:'center',gap:5,
        }}>
          <I n="save" s={12} c="#fff"/>Save Confirmed
        </button>
      </div>
    </div>

    {/* ── Sunday Banner ── */}
    {isTodaySunday&&!isWorking&&<div style={{
      background:'#F4F4F5',border:`1px solid ${C.border}`,
      borderRadius:10,padding:'16px 20px',marginBottom:14,
      display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:36,height:36,borderRadius:9,background:C.border,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <I n="clk" s={18} c={C.text3}/>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.text}}>Sunday — Non-Working Day</div>
          <div style={{fontSize:11,color:C.text3,marginTop:2}}>Attendance is not recorded on Sundays. Streak and monthly reports will skip this day automatically.</div>
        </div>
      </div>
      <button onClick={()=>{
        dispatch({type:'SET_WORKING_DAY',isWorking:true,dayType:'override',note:'Admin override — Sunday working',by:user.name});
        toast('Sunday marked as working day (override)','success');
      }} style={{
        padding:'8px 14px',background:C.text,color:'#fff',border:'none',
        borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',flexShrink:0,
      }}>Mark as Working Day</button>
    </div>}

    {/* ── Holiday / Non-Working Banner (non-Sunday) ── */}
    {(!isWorking||activeHol)&&!isTodaySunday&&<div style={{marginBottom:14}}>
      <SmartBanner
        title={wd.note||activeHol?.name||'Today is a Holiday'}
        type={wd.type||'Holiday'}
        msg={activeHol?.msg||''}
      />
      {!isWorking&&<div style={{
        background:C.yelL,border:`1px solid ${C.yelB}`,borderRadius:8,
        padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',
        marginTop:8,
      }}>
        <div style={{fontSize:12,color:C.yel,fontWeight:500}}>
          🏖️ Today is a non-working day. Do you still want to mark attendance?
        </div>
        <button onClick={()=>dispatch({type:'SET_WORKING_DAY',isWorking:true,dayType:'override',note:'Admin override',by:user.name})}
          style={{padding:'6px 12px',background:C.yel,color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',flexShrink:0}}>
          Yes, Mark Attendance
        </button>
      </div>}
    </div>}

    {/* ── Attendance Table ── */}
    {isWorking&&<div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1.4fr 75px 1fr 130px',padding:'8px 14px',borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text4,gap:10,textTransform:'uppercase',letterSpacing:'.04em'}}>
        <span>Name</span><span>Badge</span><span>Status</span><span>Reason</span><span>Actions</span>
      </div>
      {members.map((m,i)=>{
        const hc2=HOUSES[m.house]||HOUSES.default; const a=state.attendance[m.id];
        return <div key={m.id} style={{display:'grid',gridTemplateColumns:'1.6fr 1.4fr 75px 1fr 130px',padding:'10px 14px',borderBottom:i<members.length-1?`1px solid ${C.border2}`:'none',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:26,height:26,borderRadius:7,background:hc2.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{ini(m.name)}</div>
            <div><div style={{fontSize:12,fontWeight:600,color:C.text}}>{m.name}</div><div style={{fontSize:10,color:C.text4}}>{m.id}</div></div>
          </div>
          <div style={{fontSize:11,color:C.text2}}>{m.badge}</div>
          <div>{a?<Tag ch={a.status==='present'?'P':a.status==='absent'?'A':'E'} c={a.status==='present'?C.green:a.status==='absent'?C.red:C.yel} bg={a.status==='present'?C.greenL:a.status==='absent'?C.redL:C.yelL} b={a.status==='present'?C.greenB:a.status==='absent'?C.redB:C.yelB}/>:<Tag ch="—"/>}</div>
          <div style={{fontSize:11,color:C.text3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a?.reason||'—'}</div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            <button onClick={()=>{sEid(m.id);sEv({status:a?.status||'present',reason:a?.reason||''});}} style={{padding:'3px 8px',background:C.blueL,color:C.blue,border:`1px solid ${C.blueB}`,borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:2}}><I n="edit" s={11} c={C.blue}/>Edit</button>
            {a&&!a.confirmed&&<button onClick={()=>{dispatch({type:'CONFIRM_ATT',uid:m.id,by:user.name});toast(`Confirmed — ${m.name}`,'success');}} style={{padding:'3px 8px',background:C.greenL,color:C.green,border:`1px solid ${C.greenB}`,borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer'}}>✓</button>}
            {isSA&&a&&<button onClick={()=>{dispatch({type:'DEL_ATT',uid:m.id});toast('Deleted.','success');}} style={{padding:'3px 8px',background:C.redL,color:C.red,border:`1px solid ${C.redB}`,borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center'}}><I n="trash" s={11} c={C.red}/></button>}
          </div>
        </div>;
      })}
    </div>}

    {/* ── Non-Working Day Modal ── */}
    {showWDModal&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.white,borderRadius:14,padding:24,width:'100%',maxWidth:400,boxShadow:'0 24px 60px rgba(0,0,0,.2)',animation:'fadeUp .2s'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>Mark as Non-Working</div>
          <button onClick={()=>sShowWDModal(false)} style={{background:C.border2,border:'none',borderRadius:7,padding:6,cursor:'pointer',display:'flex'}}><I n="xx" s={13} c={C.text3}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:6}}>Type</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[['holiday','Holiday'],['halfday','Half Day'],['emergency','Emergency'],['event','Event Day']].map(([v,l])=>(
                <button key={v} onClick={()=>sWdType(v)} style={{padding:'8px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',border:`1px solid ${wdType===v?C.text:C.border}`,background:wdType===v?C.text:'#fff',color:wdType===v?'#fff':C.text3,transition:'all .12s'}}>{l}</button>
              ))}
            </div>
          </div>
          <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:6}}>Note / Reason</label>
            <input value={wdNote} onChange={e=>sWdNote(e.target.value)} placeholder="e.g. Bad Weather, Diwali, etc."
              style={{width:'100%',padding:'9px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,outline:'none'}}/>
          </div>
          <div style={{display:'flex',gap:8,marginTop:6}}>
            <button onClick={()=>{dispatch({type:'SET_WORKING_DAY',isWorking:false,dayType:wdType,note:wdNote,by:user.name});toast('Marked as non-working.','success');sShowWDModal(false);}} style={{flex:1,padding:'10px',background:C.text,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Save</button>
            <button onClick={()=>sShowWDModal(false)} style={{flex:1,padding:'10px',background:C.border2,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      </div>
    </div>}

    {/* Edit attendance modal */}
    {editId&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.white,borderRadius:12,padding:22,width:360,boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text}}>Edit Attendance — {state.users[editId]?.name}</div>
          <button onClick={()=>sEid(null)} style={{background:C.border2,border:'none',borderRadius:6,padding:5,cursor:'pointer',display:'flex'}}><I n="xx" s={12} c={C.text3}/></button>
        </div>
        <div style={{marginBottom:10}}><label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Status</label>
          <select value={editV.status} onChange={e=>sEv({...editV,status:e.target.value})} style={{width:'100%',padding:'9px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,background:C.white,outline:'none'}}>
            <option value="present">Present</option><option value="absent">Absent</option><option value="emergency">Emergency Leave</option>
          </select>
        </div>
        <div style={{marginBottom:14}}><label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Reason</label>
          <textarea value={editV.reason} onChange={e=>sEv(v=>({...v,reason:e.target.value}))} placeholder="Reason" style={{width:'100%',minHeight:60,border:`1px solid ${C.border}`,borderRadius:7,padding:'8px 10px',fontSize:12,color:C.text,resize:'vertical',outline:'none',fontFamily:'inherit'}}/>
        </div>
        {state.attendance[editId]?.editLog?.filter(l=>l.action?.startsWith('edited')).length>0&&<div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:C.text4,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Edit History</div>
          {state.attendance[editId].editLog.filter(l=>l.action?.startsWith('edited')).slice(-3).map((l,i)=><div key={i} style={{fontSize:10,color:C.text3,padding:'3px 0',borderBottom:`1px solid ${C.border2}`}}>{l.action} · {l.ts}</div>)}
        </div>}
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{dispatch({type:'EDIT_ATT',uid:editId,v:editV,by:user.name});toast('Updated.','success');sEid(null);}} style={{flex:1,padding:'9px',background:C.text,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Save</button>
          <button onClick={()=>sEid(null)} style={{flex:1,padding:'9px',background:C.border2,color:C.text,border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Cancel</button>
        </div>
      </div>
    </div>}
  </div>;
}


function Leaderboard({user,state}){
  const BCOLS=[
    {bar:'rgba(34,197,94,0.12)', border:'#16A34A',text:'#15803D'},
    {bar:'rgba(37,99,235,0.12)', border:'#2563EB',text:'#1D4ED8'},
    {bar:'rgba(217,119,6,0.12)', border:'#D97706', text:'#B45309'},
    {bar:'rgba(124,58,237,0.12)',border:'#7C3AED', text:'#6D28D9'},
    {bar:'rgba(220,38,38,0.12)', border:'#DC2626', text:'#B91C1C'},
    {bar:'rgba(22,163,74,0.12)', border:'#16A34A', text:'#15803D'},
    {bar:'rgba(59,130,246,0.12)',border:'#3B82F6', text:'#2563EB'},
    {bar:'rgba(245,158,11,0.12)',border:'#F59E0B', text:'#D97706'},
    {bar:'rgba(139,92,246,0.12)',border:'#8B5CF6', text:'#7C3AED'},
  ];
  const sorted=useMemo(()=>Object.entries(state.users).filter(([,u])=>u.pts>0).map(([id,u])=>({id,...u})).sort((a,b)=>b.pts-a.pts).slice(0,state.lbCount||9),[state.users,state.lbCount]);
  const maxPts=sorted[0]?.pts||1;
  const nextB=pts=>{for(const b of [...BADGES].sort((a,c)=>a.pts-c.pts)){if(pts<b.pts)return `${b.pts-pts} pts → ${b.name}`;}return'All earned!';};
  return <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}>
    <div style={{fontSize:11,color:C.text3,marginBottom:16}}>Ranked by total badge points</div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {sorted.map((u,i)=>{
        const bc=BCOLS[i%BCOLS.length];const pct=Math.max(8,(u.pts/maxPts)*100);const isMe=u.id===user.id;
        const hc2=HOUSES[u.house]||HOUSES.default;
        return <div key={u.id} style={{background:C.white,border:`1px solid ${isMe?C.greenB:C.border}`,borderRadius:10,padding:'11px 14px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${pct}%`,background:bc.bar,borderRight:`2px solid ${bc.border}`,borderRadius:'10px 0 0 10px',transition:'width .4s ease'}}/>
          <div style={{display:'flex',alignItems:'center',gap:10,position:'relative',zIndex:1}}>
            <div style={{width:22,height:22,borderRadius:5,background:bc.bar,border:`1.5px solid ${bc.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:bc.text,flexShrink:0}}>{i<3?['1','2','3'][i]:i+1}</div>
            <div style={{width:28,height:28,borderRadius:7,background:hc2.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{ini(u.name)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{fontSize:12,fontWeight:600,color:C.text}}>{u.name}</span>
                {isMe&&<Tag ch="You" c={C.green} bg={C.greenL} b={C.greenB}/>}
              </div>
              <div style={{fontSize:10,color:C.text4,marginTop:1}}>{u.badge}</div>
              {(u.wallet||[]).length>0&&<div style={{display:'flex',gap:3,marginTop:4,flexWrap:'wrap'}}>
                {(u.wallet||[]).slice(0,5).map(bid=>{
                  const b2=(state.badges||BADGES).find(x=>x.id===bid);
                  return b2?<span key={bid} title={b2.name} style={{
                    fontSize:9,padding:'2px 6px',borderRadius:4,
                    background:b2.color+'15',color:b2.color,
                    border:`1px solid ${b2.color}33`,fontWeight:700,
                  }}>+{b2.pts}</span>:null;
                })}
              </div>}
              <div style={{marginTop:3,fontSize:10,fontWeight:500,color:bc.text}}>🎯 {nextB(u.pts)}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:15,fontWeight:800,color:bc.text,letterSpacing:'-0.5px'}}>{u.pts}</div>
              <div style={{fontSize:10,color:C.text4}}>pts</div>
            </div>
          </div>
        </div>;
      })}
    </div>
  </div>;
}

/* ══ MONTHLY REPORT ══ */
/* Data model:
   state.monthly[userId] = [
     { d: 'Mon 1 Sep', s: 'P'|'A'|'E'|'H', r: 'reason', ts: '5:42 AM', confirmed: bool }
   ]
   s: P=Present, A=Absent, E=Emergency, H=Holiday/Sunday
   Admin view: list of all members + click to open detail modal
   Member/Holder view: own report card (screenshot style)
*/
function MonthlyReport({user,state}){
  const isSA=user.role==='super_admin', isTA=user.role==='teacher_admin';
  const isAdmin=isSA||isTA;
  const [selUser,sSelUser]=useState(null); // for admin modal
  const [tab,sTab]=useState('log');
  const members=Object.entries(state.users)
    .filter(([,u])=>['badge_holder','badge_admin'].includes(u.role))
    .map(([id,u])=>({id,...u}));

  // ── Day classification (dayType-aware) ──
  // dayType: working | holiday | festival | event | halfday | sunday
  // s:       P=Present, A=Absent, E=Emergency, H=non-attendance day
  const isNonWorking=(d)=>{
    if(d.dayType) return d.dayType!=='working';   // explicit dayType wins
    if(d.s==='H') return true;                    // fallback: s=H
    if(d.d?.trim().startsWith('Sun')) return true; // fallback: display string
    return false;
  };
  const dayLabel=(d)=>{
    const t=d.dayType||'working';
    if(t==='sunday')  return 'Sunday';
    if(t==='holiday') return 'Holiday';
    if(t==='festival')return 'Festival';
    if(t==='event')   return 'Event Day';
    if(t==='halfday') return 'Half Day';
    return '';
  };
  // Helper: compute stats for a userId
  const getStats=(uid)=>{
    const data=state.monthly[uid]||[];
    const workDays=data.filter(d=>!isNonWorking(d));
    const nonWDays=data.filter(d=>isNonWorking(d));
    const P=workDays.filter(d=>d.s==='P').length;
    const A=workDays.filter(d=>d.s==='A').length;
    const E=workDays.filter(d=>d.s==='E').length;
    const H=nonWDays.length;
    const Hholiday =nonWDays.filter(d=>d.dayType==='holiday').length;
    const Hfestival=nonWDays.filter(d=>d.dayType==='festival').length;
    const Hevent   =nonWDays.filter(d=>d.dayType==='event').length;
    const Hhalfday =nonWDays.filter(d=>d.dayType==='halfday').length;
    const Hsunday  =nonWDays.filter(d=>d.dayType==='sunday'||d.d?.trim().startsWith('Sun')).length;
    // Streak: consecutive present working days from most recent
    const rev=[...workDays].reverse();
    let streak=0; for(const d of rev){if(d.s==='P')streak++;else break;}
    const pct=workDays.length>0?Math.round(P/workDays.length*100):0;
    return {P,A,E,H,Hholiday,Hfestival,Hevent,Hhalfday,Hsunday,working:workDays.length,pct,data,streak};
  };

  // ── ADMIN VIEW: list of all members ──
  if(isAdmin) return <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}>
    <div style={{fontSize:11,color:C.text3,marginBottom:14}}>Monthly attendance report for all badge holders</div>
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1.8fr 1.2fr 60px 60px 60px 80px 90px',padding:'8px 16px',borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text4,gap:10,textTransform:'uppercase',letterSpacing:'.04em'}}>
        <span>Name</span><span>Badge</span><span>Present</span><span>Absent</span><span>Emrg</span><span>Rate</span><span>Action</span>
      </div>
      {members.map((m,i)=>{
        const {P,A,E,pct}=getStats(m.id);
        const hc2=HOUSES[m.house]||HOUSES.default;
        const rateColor=pct>=90?C.green:pct>=75?C.yel:C.red;
        return <div key={m.id} style={{display:'grid',gridTemplateColumns:'1.8fr 1.2fr 60px 60px 60px 80px 90px',padding:'11px 16px',borderBottom:i<members.length-1?`1px solid ${C.border2}`:'none',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:28,height:28,borderRadius:7,background:hc2.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{ini(m.name)}</div>
            <div><div style={{fontSize:12,fontWeight:600,color:C.text}}>{m.name}</div><div style={{fontSize:10,color:C.text4}}>{m.class?`Class ${m.class}-${m.sec}`:''}</div></div>
          </div>
          <div style={{fontSize:11,color:C.text2}}>{m.badge}</div>
          <div style={{fontSize:13,fontWeight:700,color:C.green}}>{P}</div>
          <div style={{fontSize:13,fontWeight:700,color:C.red}}>{A}</div>
          <div style={{fontSize:13,fontWeight:700,color:C.yel}}>{E}</div>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:rateColor}}>{pct}%</div>
            {/* mini green bar like screenshot */}
            <div style={{height:3,background:C.border2,borderRadius:2,marginTop:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,background:pct>=90?C.green:pct>=75?C.yel:C.red,borderRadius:2,transition:'width .3s'}}/>
            </div>
          </div>
          <button onClick={()=>sSelUser(m)} style={{padding:'5px 10px',background:C.blueL,color:C.blue,border:`1px solid ${C.blueB}`,borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>View Report</button>
        </div>;
      })}
    </div>
    {/* Detail Modal */}
    {selUser&&<ReportModal user={selUser} stats={getStats(selUser.id)} data={state.monthly[selUser.id]||[]} onClose={()=>sSelUser(null)} workingDay={state.workingDay}/>}
  </div>;

  // ── MEMBER/HOLDER VIEW: own report ──
  const myStats=getStats(user.id);
  const {P,A,E,H,pct,data}=myStats;
  const hc=HOUSES[user.house]||HOUSES.default;
  return <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}>
    <ReportCard user={user} stats={myStats} data={data} hc={hc} tab={tab} sTab={sTab} workingDay={state.workingDay}/>
  </div>;
}

/* ── Report Card (member's own view, also used in modal) ── */
function ReportCard({user,stats,data,hc,tab,sTab,compact=false,workingDay}){
  const {P,A,E,H,Hholiday,Hfestival,Hevent,Hhalfday,Hsunday,pct,streak}=stats;
  const rateColor=pct>=90?C.green:pct>=75?C.yel:C.red;
  // dayType helpers — self-contained so ReportCard works standalone
  const isNonWorkingR=(d)=>{
    if(d.dayType) return d.dayType!=='working';
    if(d.s==='H') return true;
    if(d.d?.trim().startsWith('Sun')) return true;
    return false;
  };
  const dayLabelR=(d)=>{
    const t=d.dayType||'';
    if(t==='sunday')  return {label:'Sunday',    color:C.text4,  bg:C.border2};
    if(t==='holiday') return {label:'Holiday',   color:'#15803D',bg:'#F0FDF4'};
    if(t==='festival')return {label:'Festival',  color:'#EA580C',bg:'#FFF7ED'};
    if(t==='event')   return {label:'Event Day', color:'#D97706',bg:'#FEF3C7'};
    if(t==='halfday') return {label:'Half Day',  color:'#7C3AED',bg:'#F5F3FF'};
    if(d.d?.trim().startsWith('Sun')) return {label:'Sunday',color:C.text4,bg:C.border2};
    if(d.s==='H') return {label:'Holiday',color:'#15803D',bg:'#F0FDF4'};
    return null;
  };
  // All days sorted by date for display
  // workDays = days that count toward attendance (non-Sunday, non-holiday/festival/event/halfday)
  const workDays=data.filter(d=>!isNonWorkingR(d));
  // For heatmap: group ALL data by ISO week (Mon–Sun), keyed by Mon date
  const heatWeeks=(()=>{
    const wkMap={};
    data.forEach(d=>{
      if(!d.date) return;
      const dt=new Date(d.date+'T12:00:00');
      const day=dt.getDay(); // 0=Sun
      const mon=new Date(dt); mon.setDate(dt.getDate()-(day===0?6:day-1));
      const wk=mon.toISOString().slice(0,10);
      if(!wkMap[wk]) wkMap[wk]={label:'',days:{}};
      wkMap[wk].days[day]=d;
      wkMap[wk].label=mon.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
    });
    return Object.entries(wkMap).sort(([a],[b])=>a<b?-1:1);
  })();

  return <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden',maxWidth:compact?'100%':640}}>
    {/* Header: avatar + name + % */}
    <div style={{padding:'14px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:12}}>
      <div style={{width:38,height:38,borderRadius:10,background:hc.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0}}>{ini(user.name)}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text}}>{user.name}</div>
        <div style={{fontSize:11,color:C.text3,marginTop:1}}>{user.badge}{user.class?` · Class ${user.class}-${user.sec}`:''}</div>
      </div>
      <div style={{textAlign:'right'}}>
        <div style={{fontSize:22,fontWeight:800,color:rateColor,letterSpacing:'-0.5px'}}>{pct}%</div>
        <div style={{fontSize:10,color:C.text4}}>Attendance</div>
      </div>
    </div>

    {/* Tabs — like screenshot (Regular Teacher / Free / Sub / Unassigned → Present / Absent / Emergency / Holiday) */}
    <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,padding:'0 18px',background:C.bg}}>
      {[['log','Daily Log'],['weekly','Weekly'],['heatmap','Heatmap']].map(([t,l])=><button key={t} onClick={()=>sTab(t)} style={{padding:'9px 14px',fontSize:12,fontWeight:tab===t?600:400,color:tab===t?C.green:C.text3,background:'none',border:'none',cursor:'pointer',borderBottom:tab===t?`2px solid ${C.green}`:'2px solid transparent',marginBottom:-1,transition:'all .15s'}}>{l}</button>)}
    </div>

    {/* Stats row — 4 columns: Present | Absent | Emergency | Non-working */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:`1px solid ${C.border}`}}>
      {[{l:'Present',v:P,c:C.green},{l:'Absent',v:A,c:C.red},{l:'Emergency',v:E,c:C.yel},{l:'Off Days',v:H,c:C.text4}].map((s,i)=><div key={s.l} style={{padding:'12px 0',textAlign:'center',borderRight:i<3?`1px solid ${C.border}`:'none'}}>
        <div style={{fontSize:20,fontWeight:800,color:s.c,letterSpacing:'-0.5px'}}>{s.v}</div>
        <div style={{fontSize:10,color:C.text4,marginTop:2}}>{s.l}</div>
      </div>)}
    </div>
    {/* Off-days breakdown row */}
    {H>0&&<div style={{display:'flex',gap:6,padding:'7px 18px',borderBottom:`1px solid ${C.border}`,background:C.bg,flexWrap:'wrap'}}>
      {Hsunday>0&&<span style={{fontSize:10,color:C.text4,background:C.border2,borderRadius:4,padding:'2px 7px',fontWeight:500}}>{Hsunday} Sunday{Hsunday>1?'s':''}</span>}
      {Hholiday>0&&<span style={{fontSize:10,color:'#15803D',background:'#F0FDF4',borderRadius:4,padding:'2px 7px',fontWeight:500}}>{Hholiday} Holiday{Hholiday>1?'s':''}</span>}
      {Hfestival>0&&<span style={{fontSize:10,color:'#EA580C',background:'#FFF7ED',borderRadius:4,padding:'2px 7px',fontWeight:500}}>{Hfestival} Festival{Hfestival>1?'s':''}</span>}
      {Hevent>0&&<span style={{fontSize:10,color:'#D97706',background:'#FEF3C7',borderRadius:4,padding:'2px 7px',fontWeight:500}}>{Hevent} Event Day{Hevent>1?'s':''}</span>}
      {Hhalfday>0&&<span style={{fontSize:10,color:'#7C3AED',background:'#F5F3FF',borderRadius:4,padding:'2px 7px',fontWeight:500}}>{Hhalfday} Half Day{Hhalfday>1?'s':''}</span>}
    </div>}

    {/* Progress bar */}
    <div style={{padding:'10px 18px 0',background:C.bg}}>
      <div style={{height:5,background:C.border2,borderRadius:3,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:rateColor,borderRadius:3,transition:'width .5s ease'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:4,marginBottom:10}}>
        <span style={{fontSize:10,color:C.text4}}>{P} / {P+A+E} working days{streak>0?<> · <span style={{color:C.green,fontWeight:600}}>{streak} day streak 🔥</span></>:null}</span>
        <span style={{fontSize:10,fontWeight:600,color:rateColor}}>{pct}%</span>
      </div>
    </div>

    {/* Tab content */}
    {tab==='log'&&<div>
      {data.length===0?<div style={{padding:'24px 18px',textAlign:'center',fontSize:12,color:C.text4}}>No attendance data yet</div>:
      data.map((d,i)=>{
        const nonW=isNonWorkingR(d);
        const dl=nonW?dayLabelR(d):null;
        const sC=nonW?{bg:dl?.bg||C.border2,c:dl?.color||C.text4}:
          {P:{bg:C.greenL,c:C.green},A:{bg:C.redL,c:C.red},E:{bg:C.yelL,c:C.yel}}[d.s]||{bg:C.border2,c:C.text4};
        const badge=nonW?(dl?.label||'Off'):d.s==='P'?'P':d.s==='A'?'A':'E';
        return <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 18px',borderBottom:i<data.length-1?`1px solid ${C.border2}`:'none',background:nonW?C.bg:'transparent'}}>
          <span style={{fontSize:11,color:C.text4,width:76,flexShrink:0,fontFamily:'monospace'}}>{d.d}</span>
          <div style={{minWidth:28,height:22,borderRadius:5,flexShrink:0,background:sC.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:sC.c,padding:'0 5px'}}>{badge}</div>
          <span style={{fontSize:11,color:nonW?C.text4:C.text3,flex:1}}>
            {nonW?(dl?.label?`${dl.label}${d.r?` — ${d.r}`:''}`:d.r||'No Attendance'):(d.r||'')}
          </span>
          {!nonW&&d.ts&&<span style={{fontSize:10,color:C.text4,flexShrink:0}}>{d.ts}</span>}
          {!nonW&&d.s==='P'&&<span style={{fontSize:10,flexShrink:0}}>{d.confirmed?<Tag ch="✓ Confirmed" c={C.green} bg={C.greenL} b={C.greenB}/>:<Tag ch="Pending" c={C.yel} bg={C.yelL} b={C.yelB}/>}</span>}
        </div>;
      })}
    </div>}

    {tab==='weekly'&&(()=>{
      // Build weeks from actual data — 7-day weeks (Mon=1 to Sun=0)
      // Saturday is working, Sunday is non-working
      const wkMap={};
      data.forEach(d=>{
        if(!d.date) return;
        const dt=new Date(d.date+'T12:00:00');
        const day=dt.getDay(); // 0=Sun,1=Mon,...,6=Sat
        // Monday of this week
        const mon=new Date(dt);
        mon.setDate(dt.getDate()-(day===0?6:day-1));
        const wk=mon.toISOString().slice(0,10);
        if(!wkMap[wk]) wkMap[wk]={label:'',days:{}};
        wkMap[wk].days[day]=d;
        wkMap[wk].label=`Week of ${mon.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`;
      });
      const wks=Object.entries(wkMap).sort(([a],[b])=>a<b?-1:1);
      if(wks.length===0) return <div style={{padding:'18px',fontSize:12,color:C.text4,textAlign:'center'}}>No weekly data</div>;
      // Day order: Mon(1) Tue(2) Wed(3) Thu(4) Fri(5) Sat(6) Sun(0)
      const DAY_ORDER=[1,2,3,4,5,6,0];
      const DAY_NAMES={1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat',0:'Sun'};
      return <div style={{padding:'14px 18px'}}>
        {/* Header row */}
        <div style={{display:'grid',gridTemplateColumns:'1fr repeat(7,1fr)',gap:3,marginBottom:8}}>
          <div/>
          {DAY_ORDER.map(dn=><div key={dn} style={{textAlign:'center',fontSize:9,fontWeight:700,color:dn===0?C.text4:C.text3}}>{DAY_NAMES[dn]}</div>)}
        </div>
        {wks.map(([wk,{label,days}],wi)=>{
          const workCells=DAY_ORDER.filter(dn=>dn!==0).map(dn=>days[dn]).filter(Boolean);
          const wPres=workCells.filter(d=>!isNonWorkingR(d)&&d.s==='P').length;
          const wWork=workCells.filter(d=>!isNonWorkingR(d)).length;
          return <div key={wk} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <span style={{fontSize:11,color:C.text2,fontWeight:600}}>{label}</span>
              <span style={{fontSize:11,fontWeight:700,color:wWork>0&&wPres===wWork?C.green:C.yel}}>{wPres}/{wWork} Present</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr repeat(7,1fr)',gap:3}}>
              <div style={{display:'flex',alignItems:'center',fontSize:10,color:C.text4,fontWeight:500,paddingRight:4}}>
                {label.replace('Week of ','')}
              </div>
              {DAY_ORDER.map(dayN=>{
                const isSun=dayN===0;
                const d=days[dayN];
                if(isSun){
                  // Sunday — always non-working
                  const hasSunData=!!d;
                  return <div key={dayN} style={{background:C.border2,borderRadius:5,padding:'7px 2px',textAlign:'center',fontSize:9,fontWeight:600,color:C.text4,cursor:'default',opacity:.5}} title="Sunday">{hasSunData&&d.dayType==='override'?'WRK':'SUN'}</div>;
                }
                if(!d) return <div key={dayN} style={{background:C.border2,borderRadius:5,padding:'7px 2px',textAlign:'center',fontSize:9,fontWeight:600,color:C.text4,opacity:.25,cursor:'default'}}>–</div>;
                const nw=isNonWorkingR(d);
                const dl2=nw?dayLabelR(d):null;
                const sc=nw?{bg:dl2?.bg||C.border2,c:dl2?.color||C.text4}:
                  {P:{bg:'#22C55E',c:'#fff'},A:{bg:C.redL,c:C.red},E:{bg:C.yelL,c:C.yel}}[d.s]||{bg:C.border2,c:C.text4};
                const lbl=nw?(dl2?.label?.slice(0,3)||'OFF'):d.s;
                return <div key={dayN} title={d.d+(d.r?` — ${d.r}`:'')} style={{background:sc.bg,borderRadius:5,padding:'7px 2px',textAlign:'center',fontSize:9,fontWeight:700,color:sc.c,cursor:'default'}}>{lbl}</div>;
              })}
            </div>
          </div>;
        })}
        <div style={{background:C.greenL,border:`1px solid ${C.greenB}`,borderRadius:7,padding:'8px 12px',fontSize:11,fontWeight:600,color:C.green,textAlign:'center',marginTop:6}}>
          Overall: {pct}% · {P} present out of {P+A+E} working days
        </div>
      </div>;
    })()}

    {tab==='heatmap'&&(()=>{
      // Heatmap: 7 columns Mon–Sun, one row per calendar week
      // Colors: P=green, A=red, E=amber, Holiday=green-light, Festival=orange-light,
      //         Event=yellow-light, HalfDay=purple-light, Sunday=grey, empty=faint
      const DAY_ORDER=[1,2,3,4,5,6,0]; // Mon…Sat, Sun
      const DAY_HDR=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const cellStyle=(d)=>{
        if(!d) return {bg:'#F5F5F7',c:'transparent',label:''};
        const nw=isNonWorkingR(d);
        if(nw){
          const t=d.dayType||'';
          if(t==='sunday')   return {bg:'#E5E7EB',c:'#9CA3AF',label:'SUN'};
          if(t==='holiday')  return {bg:'#DCFCE7',c:'#15803D', label:'HOL'};
          if(t==='festival') return {bg:'#FFEDD5',c:'#EA580C', label:'FES'};
          if(t==='event')    return {bg:'#FEF3C7',c:'#D97706', label:'EVT'};
          if(t==='halfday')  return {bg:'#EDE9FE',c:'#7C3AED', label:'½'};
          // fallback non-working
          if(d.d?.trim().startsWith('Sun')) return {bg:'#E5E7EB',c:'#9CA3AF',label:'SUN'};
          return {bg:'#DCFCE7',c:'#15803D',label:'HOL'};
        }
        // Working day
        if(d.s==='P') return {bg:'#22C55E',c:'#fff',   label:'P'};
        if(d.s==='A') return {bg:'#FEE2E2',c:'#DC2626',label:'A'};
        if(d.s==='E') return {bg:'#FEF3C7',c:'#D97706',label:'E'};
        return {bg:C.border2,c:C.text4,label:'?'};
      };
      return <div style={{padding:'14px 18px'}}>
        <div style={{fontSize:11,fontWeight:600,color:C.text2,marginBottom:10}}>Monthly Heatmap — all days</div>
        {/* Header row */}
        <div style={{display:'grid',gridTemplateColumns:'36px repeat(7,1fr)',gap:3,marginBottom:4}}>
          <div/>
          {DAY_HDR.map((h,i)=><div key={h} style={{textAlign:'center',fontSize:9,fontWeight:700,color:i===6?'#9CA3AF':C.text3}}>{h}</div>)}
        </div>
        {/* Week rows */}
        {heatWeeks.map(([wk,{label,days}])=><div key={wk} style={{display:'grid',gridTemplateColumns:'36px repeat(7,1fr)',gap:3,marginBottom:3,alignItems:'center'}}>
          <div style={{fontSize:9,color:C.text4,fontWeight:500,textAlign:'right',paddingRight:4}}>{label}</div>
          {DAY_ORDER.map(dayN=>{
            const d=days[dayN];
            const cs=cellStyle(d);
            return <div key={dayN}
              title={d?`${d.d}${d.r?' — '+d.r:''}`:''}
              style={{background:cs.bg,borderRadius:5,padding:'6px 2px',textAlign:'center',fontSize:9,fontWeight:700,color:cs.c,cursor:d?'default':'default',minHeight:28,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {cs.label}
            </div>;
          })}
        </div>)}
        {/* Legend */}
        <div style={{display:'flex',gap:8,alignItems:'center',fontSize:10,color:C.text4,flexWrap:'wrap',marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border2}`}}>
          {[
            {bg:'#22C55E',c:'#fff',     l:'Present'},
            {bg:'#FEE2E2',c:'#DC2626',  l:'Absent'},
            {bg:'#FEF3C7',c:'#D97706',  l:'Emergency'},
            {bg:'#DCFCE7',c:'#15803D',  l:'Holiday'},
            {bg:'#FFEDD5',c:'#EA580C',  l:'Festival'},
            {bg:'#FEF3C7',c:'#D97706',  l:'Event'},
            {bg:'#EDE9FE',c:'#7C3AED',  l:'Half Day'},
            {bg:'#E5E7EB',c:'#9CA3AF',  l:'Sunday'},
          ].map(({bg,c,l})=><span key={l} style={{display:'flex',alignItems:'center',gap:3}}>
            <span style={{width:14,height:14,borderRadius:3,background:bg,color:c,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700}}/>
            <span>{l}</span>
          </span>)}
        </div>
      </div>;
    })()}
  </div>;
}

/* ── Report Modal (admin clicks "View Report") ── */
function ReportModal({user,stats,data,onClose,workingDay}){
  const [tab,sTab]=useState('log');
  const hc=HOUSES[user.house]||HOUSES.default;
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:C.white,borderRadius:14,width:'100%',maxWidth:580,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,.2)',animation:'fadeUp .2s'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text}}>Monthly Report</div>
        <button onClick={onClose} style={{background:C.border2,border:'none',borderRadius:6,padding:5,cursor:'pointer',display:'flex'}}><I n="xx" s={13} c={C.text3}/></button>
      </div>
      <ReportCard user={user} stats={stats} data={data} hc={hc} tab={tab} sTab={sTab} compact workingDay={workingDay}/>
    </div>
  </div>;
}

/* ══ MEMBERS ══ */
function Members({user,state,dispatch,toast}){
  const isSA=user.role==='super_admin';
  const isTA=user.role==='teacher_admin';
  const isBA=user.role==='badge_admin';
  const canAdmin=isSA||isTA;
  const hasSpecial=user.sa===true;

  const [showCreds,sShowCreds]=useState(false);
  const [showAdd,sAdd]=useState(false);
  const [showEdit,sEdit]=useState(null);

  const members=Object.entries(state.users)
    .filter(([,u])=>['badge_holder','badge_admin'].includes(u.role))
    .map(([id,u])=>({id,...u}));

  // What badge holders can see
  const canSeeId=m=>{
    if(canAdmin) return true;
    if(isBA&&hasSpecial) return true;
    return m.id===user.id;
  };
  const canEdit=m=>{
    if(canAdmin) return true;
    if(isBA&&hasSpecial){
      if(m.role==='badge_admin'&&m.id!==user.id) return false;
      return true;
    }
    return false;
  };
  const canToggleSA=canAdmin; // Only SA+TA

  return <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}>
    {/* ── Top bar ── */}
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
      <div style={{fontSize:11,color:C.text3,fontWeight:500}}>{members.length} badge holders</div>
      <div style={{display:'flex',gap:8}}>
        {/* Show Credentials — SA+TA only, like screenshot */}
        {canAdmin&&(
          <button onClick={()=>sShowCreds(s=>!s)} style={{
            padding:'7px 13px',
            background:showCreds?C.text:C.white,
            color:showCreds?'#fff':C.text,
            border:`1px solid ${showCreds?C.text:C.border}`,
            borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
            display:'flex',alignItems:'center',gap:6,transition:'all .15s',
          }}>
            <I n={showCreds?'eyeoff':'eye'} s={13} c={showCreds?'#fff':C.text}/>
            {showCreds?'Hide Credentials':'Show Credentials'}
          </button>
        )}
        {canAdmin&&(
          <button onClick={()=>sAdd(true)} style={{
            padding:'7px 13px',background:C.green,color:'#fff',
            border:'none',borderRadius:7,fontSize:11,fontWeight:600,
            cursor:'pointer',display:'flex',alignItems:'center',gap:6,
          }}>
            <I n="plus" s={13} c="#fff"/>Add Member
          </button>
        )}
      </div>
    </div>

    {/* ── Credentials panel (shown on button click) ── */}
    {showCreds&&canAdmin&&(
      <div style={{
        background:C.white,
        border:`1px solid ${C.border}`,
        borderRadius:12,padding:'16px 20px',marginBottom:16,
        animation:'fadeUp .2s',
        boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:7}}>
            <I n="key" s={14} c={C.yel}/>Badge Holder Credentials
          </div>
          <Tag ch="Confidential" c={C.yel} bg={C.yelL} b={C.yelB}/>
        </div>
        <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 80px',padding:'8px 14px',borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text4,gap:10,textTransform:'uppercase',letterSpacing:'.05em',background:C.bg}}>
            <span>Name</span><span>ID</span><span>Password</span><span>Edit</span>
          </div>
          {members.map((m,i)=>(
            <CredRow key={m.id} m={m} i={i} total={members.length} isSA={isSA} dispatch={dispatch} toast={toast}/>
          ))}
        </div>
      </div>
    )}

    {/* ── Members table — hidden when credentials shown ── */}
    {!showCreds&&<div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
      {/* Header */}
      <div style={{
        display:'grid',
        gridTemplateColumns:canAdmin?'1.8fr 1.4fr 60px 55px 80px 110px':'1.8fr 1.4fr 60px 55px 110px',
        padding:'9px 14px',borderBottom:`1px solid ${C.border}`,
        fontSize:10,fontWeight:700,color:C.text4,gap:10,
        textTransform:'uppercase',letterSpacing:'.04em',
      }}>
        <span>Name</span>
        <span>Badge · House</span>
        <span>Points</span>
        <span>Streak</span>
        {canAdmin&&<span>Special</span>}
        <span>Actions</span>
      </div>

      {members.map((m,i)=>{
        const hc2=HOUSES[m.house]||HOUSES.default;
        const editable=canEdit(m);
        const seeId=canSeeId(m);

        return (
          <div key={m.id} style={{
            display:'grid',
            gridTemplateColumns:canAdmin?'1.8fr 1.4fr 60px 55px 80px 110px':'1.8fr 1.4fr 60px 55px 110px',
            padding:'10px 14px',
            borderBottom:i<members.length-1?`1px solid ${C.border2}`:'none',
            alignItems:'center',gap:10,
            background:m.role==='badge_admin'?'#FFFDF5':C.white,
          }}>
            {/* Name + ID */}
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{
                width:28,height:28,borderRadius:8,flexShrink:0,
                background:hc2.grad,color:'#fff',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:9,fontWeight:700,
              }}>{ini(m.name)}</div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:C.text,display:'flex',alignItems:'center',gap:5}}>
                  {m.name}
                  {m.role==='badge_admin'&&<Tag ch="Admin" c={C.yel} bg="rgba(245,158,11,.08)" b="rgba(245,158,11,.2)"/>}
                </div>
                <div style={{fontSize:10,color:C.text4,marginTop:1}}>
                  {seeId?m.id:'••••••••'}
                </div>
              </div>
            </div>

            {/* Badge + House */}
            <div>
              <div style={{fontSize:11,color:C.text,fontWeight:500}}>{m.badge}</div>
              {m.house&&m.house!=='default'&&(
                <div style={{fontSize:10,color:hc2.c,marginTop:1}}>{m.house}</div>
              )}
            </div>

            {/* Points */}
            <div style={{fontSize:12,fontWeight:700,color:C.text}}>{m.pts}</div>

            {/* Streak */}
            <div style={{fontSize:11,fontWeight:600,color:C.green,display:'flex',alignItems:'center',gap:3}}>
              {m.streak}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#f97316"><path d="M12 2c0 0-6 6-6 12a6 6 0 0012 0C18 8 12 2 12 2z"/></svg>
            </div>

            {/* Special Access toggle — SA+TA only */}
            {canAdmin&&(
              <div>
                <button
                  onClick={()=>{
                    dispatch({type:'TOGGLE_SA',id:m.id,by:user.name});
                    toast(`Special access ${m.sa?'removed':'granted'} — ${m.name}`,'success');
                  }}
                  style={{
                    padding:'4px 10px',borderRadius:5,fontSize:10,fontWeight:700,cursor:'pointer',
                    border:`1px solid ${m.sa?C.greenB:'#E4E4E7'}`,
                    background:m.sa?C.greenL:'#F9F9F9',
                    color:m.sa?C.green:C.text4,
                    transition:'all .15s',letterSpacing:'.02em',
                  }}
                >
                  {m.sa?'ON':'OFF'}
                </button>
              </div>
            )}

            {/* Actions */}
            <div style={{display:'flex',gap:5}}>
              {editable&&(
                <button onClick={()=>sEdit(m)} style={{
                  padding:'4px 9px',background:C.blueL,color:C.blue,
                  border:`1px solid ${C.blueB}`,borderRadius:5,
                  fontSize:10,fontWeight:600,cursor:'pointer',
                  display:'flex',alignItems:'center',gap:3,
                }}>
                  <I n="edit" s={11} c={C.blue}/>Edit
                </button>
              )}
              {isSA&&(
                <button onClick={()=>{
                  if(window.confirm(`Delete ${m.name}?`)){
                    dispatch({type:'DEL_USER',id:m.id,by:user.name});
                    toast(`${m.name} deleted.`,'success');
                  }
                }} style={{
                  padding:'4px 8px',background:C.redL,color:C.red,
                  border:`1px solid ${C.redB}`,borderRadius:5,
                  fontSize:10,fontWeight:600,cursor:'pointer',
                  display:'flex',alignItems:'center',
                }}>
                  <I n="trash" s={11} c={C.red}/>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>

    }
    {showAdd&&<MemberModal title="Add Badge Holder" isSA={isSA} isTA={isTA} onClose={()=>sAdd(false)} onSave={(id,v)=>{dispatch({type:'ADD_USER',id,v,by:user.name});toast('Member added!','success');sAdd(false);}}/>}
    {showEdit&&<MemberModal title={`Edit — ${showEdit.name}`} initial={showEdit} isSA={isSA} isTA={isTA} onClose={()=>sEdit(null)} onSave={(_,v)=>{dispatch({type:'EDIT_USER',id:showEdit.id,v,by:user.name});toast('Updated!','success');sEdit(null);}} isEdit/>}
  </div>;
}

/* Credential row — memoized to prevent flicker */
const CredRow = React.memo(function CredRow({m,i,total,isSA,dispatch,toast}){
  const [showPw,setShowPw]=useState(false);
  const [editField,setEditField]=useState(null); // 'id' | 'pw' | null
  const [val,setVal]=useState('');

  const startEdit=(field)=>{
    setEditField(field);
    setVal(field==='pw'?m.pw:m.id);
  };
  const saveEdit=()=>{
    if(!val.trim()){toast('Value cannot be empty.','error');setEditField(null);return;}
    if(editField==='pw'){
      dispatch({type:'EDIT_USER',id:m.id,v:{pw:val.trim()},by:'Admin'});
      toast('Password updated.','success');
    } else {
      // ID change — need to update key in users object
      dispatch({type:'CHANGE_USER_ID',oldId:m.id,newId:val.trim(),by:'Admin'});
      toast('ID updated.','success');
    }
    setEditField(null);
  };

  const hc2=HOUSES[m.house]||HOUSES.default;
  const inp={
    background:C.white,border:`1px solid ${C.blue}`,borderRadius:5,
    padding:'4px 8px',fontSize:11,color:C.text,fontFamily:'monospace',
    width:120,outline:'none',boxShadow:`0 0 0 2px ${C.blueL}`,
  };

  return (
    <div style={{
      display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 80px',
      padding:'10px 14px',
      borderBottom:i<total-1?`1px solid ${C.border2}`:'none',
      alignItems:'center',gap:10,
      background:i%2===0?C.white:C.bg,
    }}>
      {/* Name */}
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:26,height:26,borderRadius:7,background:hc2.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{ini(m.name)}</div>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:C.text}}>{m.name}</div>
          <div style={{fontSize:10,color:C.text4}}>{m.badge}</div>
        </div>
      </div>

      {/* ID — editable */}
      <div style={{display:'flex',alignItems:'center',gap:4}}>
        {editField==='id'?(
          <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e=>{if(e.key==='Enter')saveEdit();if(e.key==='Escape')setEditField(null);}}
            style={inp}/>
        ):(
          <>
            <span style={{fontFamily:'monospace',fontSize:11,color:C.text2,fontWeight:500}}>{m.id}</span>
            <button onClick={()=>startEdit('id')} style={{background:'none',border:'none',cursor:'pointer',padding:2,display:'flex',flexShrink:0}}>
              <I n="edit" s={11} c={C.text4}/>
            </button>
          </>
        )}
      </div>

      {/* Password — show/hide + editable */}
      <div style={{display:'flex',alignItems:'center',gap:4}}>
        {editField==='pw'?(
          <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e=>{if(e.key==='Enter')saveEdit();if(e.key==='Escape')setEditField(null);}}
            style={inp}/>
        ):(
          <>
            <span style={{fontFamily:'monospace',fontSize:11,color:showPw?C.text:C.text4,letterSpacing:showPw?'normal':'2px'}}>
              {showPw?m.pw:'••••••'}
            </span>
            <button onClick={()=>setShowPw(s=>!s)} style={{background:'none',border:'none',cursor:'pointer',padding:2,display:'flex'}}>
              <I n={showPw?'eyeoff':'eye'} s={11} c={showPw?C.blue:C.text4}/>
            </button>
            <button onClick={()=>startEdit('pw')} style={{background:'none',border:'none',cursor:'pointer',padding:2,display:'flex'}}>
              <I n="edit" s={11} c={C.text4}/>
            </button>
          </>
        )}
      </div>

      {/* Status indicator */}
      <div style={{display:'flex',gap:4,alignItems:'center',fontSize:10,color:editField?C.blue:C.text4,fontWeight:600}}>
        {editField?<><I n="edit" s={10} c={C.blue}/>Editing…</>:'—'}
      </div>
    </div>
  );
});


/* ══ MEMBER MODAL (Add/Edit) ══ */
function MemberModal({title,initial,isSA,isTA=false,onClose,onSave,isEdit=false}){
  const [mid,sMid]=useState('');
  const [f,sF]=useState({
    name:initial?.name||'',badge:initial?.badge||'Head Boy',
    house:initial?.house||'default',class:initial?.class||'',
    sec:initial?.sec||'',pw:initial?.pw||'',role:'badge_holder'
  });
  const badges=['Head Boy','Head Girl','Student Media Head',
    'Boys Sports Captain','Girls Sports Captain','Sports Prefect',
    'Discipline Captain','Discipline Prefect','Student Editor',
    'CCA Captain','CCA Prefect','Boys House Captain',
    'Girls House Captain','Girls House Prefect','House Prefect'];
  const inp={width:'100%',padding:'9px 10px',border:`1px solid ${C.border}`,
    borderRadius:7,fontSize:12,color:C.text,outline:'none',background:C.white};
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',
      zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.white,borderRadius:14,padding:22,width:'100%',
        maxWidth:440,maxHeight:'90vh',overflowY:'auto',
        boxShadow:'0 24px 60px rgba(0,0,0,.2)',animation:'fadeUp .2s'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>{title}</div>
          <button onClick={onClose} style={{background:C.border2,border:'none',
            borderRadius:7,padding:6,cursor:'pointer',display:'flex'}}>
            <I n="xx" s={13} c={C.text3}/>
          </button>
        </div>
        {!isEdit&&(
          <div style={{marginBottom:11}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Member ID *</label>
            <input value={mid} onChange={e=>sMid(e.target.value)}
              placeholder="e.g. SC-DC-G" style={inp}/>
          </div>
        )}
        {[['Full Name','name','Full name'],
          ['Class','class','e.g. 11'],
          ['Section','sec','e.g. A'],
          ...((isSA||isTA)?[['Password','pw','Set password']]:[])
        ].map(([l,k,ph])=>(
          <div key={k} style={{marginBottom:11}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>{l}</label>
            <input value={f[k]||''} onChange={e=>sF(v=>({...v,[k]:e.target.value}))}
              placeholder={ph} style={inp}/>
          </div>
        ))}
        <div style={{marginBottom:11}}>
          <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Badge</label>
          <select value={f.badge} onChange={e=>sF(v=>({...v,badge:e.target.value}))} style={{...inp}}>
            {badges.map(b=><option key={b}>{b}</option>)}
          </select>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>House</label>
          <select value={f.house} onChange={e=>sF(v=>({...v,house:e.target.value}))} style={{...inp}}>
            {Object.keys(HOUSES).map(h=><option key={h}>{h}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>onSave(isEdit?initial?.id:mid,f)}
            style={{flex:1,padding:'10px',background:C.text,color:'#fff',
              border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
            {isEdit?'Save Changes':'Add Member'}
          </button>
          <button onClick={onClose}
            style={{flex:1,padding:'10px',background:C.border2,color:C.text,
              border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ DUTY POINTS PAGE (SA + TA) ══ */
/* ══ DUTY LIST TAB — standalone component (hooks at top level) ══ */
function DutyListTab({state,dispatch,toast,pts,allMembers}){
  const dl=state.dutyList||[];
  const [showDLModal,sShowDLModal]=useState(false);
  const [editDL,sEditDL]=useState(null);
  const [dlf,sDlf]=useState({userId:'',userName:'',class:'',sec:'',dutyPointIds:[]});
  const inpS={width:'100%',padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,outline:'none',background:C.white};

  const openAdd=()=>{sDlf({userId:'',userName:'',class:'',sec:'',dutyPointIds:[]});sEditDL(null);sShowDLModal(true);};
  const openEdit=(entry)=>{
    sDlf({userId:entry.userId,userName:entry.userName,class:entry.class||'',sec:entry.sec||'',dutyPointIds:entry.dutyPointIds||[]});
    sEditDL(entry.id);sShowDLModal(true);
  };
  const saveDL=()=>{
    if(!dlf.userId.trim()||!dlf.userName.trim()){toast('Name and ID required.','error');return;}
    if(editDL){
      dispatch({type:'EDIT_DUTY_LIST',id:editDL,v:dlf});
      toast('Entry updated!','success');
    }else{
      if(dl.find(e=>e.userId===dlf.userId.trim())){toast('This holder ID already exists in list.','error');return;}
      dispatch({type:'ADD_DUTY_LIST',v:{...dlf,userId:dlf.userId.trim()}});
      toast('Holder added to duty list!','success');
    }
    sShowDLModal(false);sEditDL(null);
  };
  const toggleDutyPt=(ptId)=>{
    const cur=dlf.dutyPointIds||[];
    if(cur.includes(ptId)) sDlf(v=>({...v,dutyPointIds:cur.filter(x=>x!==ptId)}));
    else sDlf(v=>({...v,dutyPointIds:[...cur,ptId]}));
  };
  const onUserIdChange=(val)=>{
    const match=state.users[val];
    if(match) sDlf(v=>({...v,userId:val,userName:match.name,class:match.class||'',sec:match.sec||''}));
    else sDlf(v=>({...v,userId:val}));
  };

  return <div>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <div style={{fontSize:11,color:C.text3}}>{dl.length} holders in duty list · Each holder's natural duty points used by Smart algorithm</div>
      <button onClick={openAdd} style={{padding:'7px 13px',background:C.green,color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
        <I n="plus" s={13} c="#fff"/>Add Holder
      </button>
    </div>

    {dl.length===0&&(
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:'40px 20px',textAlign:'center',color:C.text4}}>
        <I n="users" s={32} c={C.border2}/>
        <div style={{fontSize:13,fontWeight:500,marginTop:8,color:C.text3}}>No holders in duty list yet</div>
        <div style={{fontSize:11,marginTop:4}}>Add badge holders and assign their natural duty points.</div>
        <button onClick={openAdd} style={{marginTop:14,padding:'8px 18px',background:C.text,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Add First Holder</button>
      </div>
    )}

    {dl.length>0&&(
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.6fr 0.7fr 0.7fr 2fr 100px',padding:'8px 14px',borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text4,gap:10,textTransform:'uppercase',letterSpacing:'.04em'}}>
          <span>Name</span><span>Class</span><span>ID</span><span>Duty Points</span><span>Actions</span>
        </div>
        {dl.map((entry,i)=>{
          const assignedPts=pts.filter(p=>(entry.dutyPointIds||[]).includes(p.id));
          const isPres=!!state.attendance[entry.userId]&&state.attendance[entry.userId].status==='present';
          const hc2=HOUSES[state.users[entry.userId]?.house]||HOUSES.default;
          return (
            <div key={entry.id} style={{display:'grid',gridTemplateColumns:'1.6fr 0.7fr 0.7fr 2fr 100px',padding:'11px 14px',borderBottom:i<dl.length-1?`1px solid ${C.border2}`:'none',alignItems:'center',gap:10,background:isPres?'rgba(34,197,94,0.03)':'transparent'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:28,height:28,borderRadius:7,background:hc2.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{ini(entry.userName)}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:C.text}}>{entry.userName}</div>
                  <div style={{fontSize:10,color:C.text4,fontFamily:'monospace'}}>{entry.userId}</div>
                  {isPres&&<Tag ch="Present" c={C.green} bg={C.greenL} b={C.greenB}/>}
                </div>
              </div>
              <div style={{fontSize:11,color:C.text3}}>{entry.class?`${entry.class}-${entry.sec}`:'—'}</div>
              <div style={{fontSize:10,fontFamily:'monospace',color:C.text4}}>{entry.userId}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {assignedPts.length===0
                  ?<span style={{fontSize:11,color:C.text4}}>—</span>
                  :assignedPts.map(p=>(
                    <span key={p.id} style={{fontSize:10,fontWeight:500,background:p.important?C.redL:C.border2,color:p.important?C.red:C.text3,border:`1px solid ${p.important?C.redB:C.border}`,borderRadius:4,padding:'1px 6px',whiteSpace:'nowrap'}}>{p.name}</span>
                  ))}
              </div>
              <div style={{display:'flex',gap:5}}>
                <button onClick={()=>openEdit(entry)} style={{padding:'4px 9px',background:C.blueL,color:C.blue,border:`1px solid ${C.blueB}`,borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:2}}>
                  <I n="edit" s={10} c={C.blue}/>Edit
                </button>
                <button onClick={()=>{if(window.confirm(`Remove "${entry.userName}" from duty list?`)){dispatch({type:'DEL_DUTY_LIST',id:entry.id});toast('Removed.','success');}}} style={{padding:'4px 7px',background:C.redL,color:C.red,border:`1px solid ${C.redB}`,borderRadius:5,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center'}}>
                  <I n="trash" s={10} c={C.red}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {showDLModal&&(
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div style={{background:C.white,borderRadius:14,padding:22,width:'100%',maxWidth:480,boxShadow:'0 24px 60px rgba(0,0,0,.2)',animation:'fadeUp .2s',maxHeight:'90vh',overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>{editDL?'Edit Duty List Entry':'Add Holder to Duty List'}</div>
            <button onClick={()=>{sShowDLModal(false);sEditDL(null);}} style={{background:C.border2,border:'none',borderRadius:7,padding:6,cursor:'pointer',display:'flex'}}><I n="xx" s={13} c={C.text3}/></button>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Holder ID *</label>
            <input value={dlf.userId} onChange={e=>onUserIdChange(e.target.value)} placeholder="e.g. SC-HB-001" list="dl-user-list" style={inpS}/>
            <datalist id="dl-user-list">{allMembers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</datalist>
            {dlf.userId&&state.users[dlf.userId]&&(
              <div style={{fontSize:10,color:C.green,marginTop:3,display:'flex',alignItems:'center',gap:4}}><I n="chk" s={10} c={C.green} w={2.5}/>Auto-filled from system user</div>
            )}
          </div>
          <div style={{marginBottom:10}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Full Name *</label>
            <input value={dlf.userName} onChange={e=>sDlf(v=>({...v,userName:e.target.value}))} placeholder="e.g. Rahul Kumar" style={inpS}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Class</label>
              <input value={dlf.class} onChange={e=>sDlf(v=>({...v,class:e.target.value}))} placeholder="e.g. 11" style={inpS}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Section</label>
              <input value={dlf.sec} onChange={e=>sDlf(v=>({...v,sec:e.target.value}))} placeholder="e.g. A" style={inpS}/>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:8}}>Assign Duty Points <span style={{fontWeight:400,color:C.text4,marginLeft:6}}>({(dlf.dutyPointIds||[]).length} selected)</span></label>
            <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',maxHeight:200,overflowY:'auto'}}>
              {pts.length===0&&<div style={{padding:'12px 14px',fontSize:11,color:C.text4}}>No duty points defined yet. Add them in Duty Points tab first.</div>}
              {pts.map((pt,pi)=>{
                const checked=(dlf.dutyPointIds||[]).includes(pt.id);
                return (
                  <div key={pt.id} onClick={()=>toggleDutyPt(pt.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',cursor:'pointer',borderBottom:pi<pts.length-1?`1px solid ${C.border2}`:'none',background:checked?(pt.important?C.redL:C.greenL):'transparent',transition:'background .1s'}}>
                    <div style={{width:16,height:16,borderRadius:4,flexShrink:0,border:`2px solid ${checked?(pt.important?C.red:C.green):C.border}`,background:checked?(pt.important?C.red:C.green):'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {checked&&<I n="chk" s={9} c="#fff" w={3}/>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:checked?600:400,color:C.text,display:'flex',alignItems:'center',gap:5}}>
                        {pt.important&&<span style={{width:6,height:6,borderRadius:'50%',background:C.red,flexShrink:0,display:'inline-block'}}/>}
                        {pt.name}
                      </div>
                      <div style={{fontSize:10,color:C.text4}}>{pt.floor} Floor · {pt.group||'No group'}</div>
                    </div>
                    {pt.important&&<Tag ch="Important" c={C.red} bg={C.redL} b={C.redB}/>}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={saveDL} style={{flex:1,padding:'10px',background:C.text,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>{editDL?'Save Changes':'Add to List'}</button>
            <button onClick={()=>{sShowDLModal(false);sEditDL(null);}} style={{flex:1,padding:'10px',background:C.border2,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      </div>
    )}
  </div>;
}


function DutyPage({user,state,dispatch,toast}){
  const isSA=user.role==='super_admin';
  const [showAddPt,sShowAddPt]=useState(false);
  const [showAddGrp,sShowAddGrp]=useState(false);
  const [editGrp,sEditGrp]=useState(null);
  const [editPt,sEditPt]=useState(null);
  const [tab,sTab]=useState('points');
  const [dutyTab,sDutyTab]=useState('today'); // 'today' | 'past'
  const [method,sMethod]=useState('smart'); // 'random' | 'smart'
  const [assignments,sAssignments]=useState(state.dutyAssignments||{});
  const [generated,sGenerated]=useState(false);
  const [editAssign,sEditAssign]=useState(null); // pointId being manually edited
  const [manualPick,sManualPick]=useState('');
  const pts=state.dutyPoints||[];
  const grps=state.dutyGroups||[];
  const [f,sF]=useState({name:'',floor:'Ground',building:'Main',group:'',minRequired:'',important:false});
  const [gf,sGf]=useState({name:'',minRequired:'',important:false});
  const inp={width:'100%',padding:'8px 10px',border:`1px solid ${C.border}`,
    borderRadius:7,fontSize:12,color:C.text,outline:'none',background:C.white};
  const floors=['Ground','1st','2nd'];
  const groups=[...new Set(pts.map(p=>p.group).filter(Boolean)),...grps.map(g=>g.name)];

  const resetF=()=>sF({name:'',floor:'Ground',building:'Main',group:'',minRequired:'',important:false});

  // ── Today: working day + sunday check ──
  const todayDate=new Date().toISOString().slice(0,10);
  const isTodaySunday=new Date().getDay()===0;
  const isTodayHoliday=(state.holidays||[]).some(h=>h.date&&h.date<=todayDate&&(!h.endDate||h.endDate>=todayDate));
  const wd=state.workingDay||{isWorking:true,dayType:'working'};
  // Sunday working only if admin explicitly set override
  const adminSundayOverride=isTodaySunday&&wd.isWorking===true&&(wd.dayType==='override');
  const isWorkingDay=isTodaySunday
    ? adminSundayOverride
    : (!isTodayHoliday&&wd.isWorking!==false);

  // ── Members who are present today ──
  const allMembers=Object.entries(state.users)
    .filter(([,u])=>['badge_holder','badge_admin'].includes(u.role))
    .map(([id,u])=>({id,...u}));
  const presentMembers=allMembers.filter(m=>state.attendance[m.id]?.status==='present');

  // ── DUTY ALGORITHM ──
  const generateDuty=(meth)=>{
    const present=[...presentMembers];
    if(present.length===0){toast('No one is present today.','error');return;}
    const result={};
    const presentIds=new Set(present.map(m=>m.id));

    if(meth==='random'){
      // Only present members — self-marked present
      const presentOnly=present.filter(m=>state.attendance[m.id]?.status==='present');
      if(presentOnly.length===0){toast('No present members to assign duty.','error');return;}

      // Shuffle once — each holder gets at most ONE duty point, no repeats
      const pool=[...presentOnly].sort(()=>Math.random()-0.5); // shuffled pool
      const assigned=new Set(); // track who has been assigned

      const pickOne=()=>{
        // Pick next unassigned holder from pool
        const next=pool.find(m=>!assigned.has(m.id));
        if(!next) return null; // no one left
        assigned.add(next.id);
        return next.id;
      };

      // All points start blank
      pts.forEach(pt=>{ result[pt.id]=[]; });

      // Step 1: Important points first (priority)
      const impPts=pts.filter(p=>p.important);
      for(const pt of impPts){
        const pick=pickOne();
        if(pick) result[pt.id]=[pick];
        // else stays blank — not enough holders
      }

      // Step 2: Normal points — only if there are still unassigned holders left
      const normPts=pts.filter(p=>!p.important);
      for(const pt of normPts){
        const pick=pickOne();
        if(pick) result[pt.id]=[pick];
        // else stays blank
      }

    }else{
      // ── SMART method: uses dutyList (each holder's natural duty points) ──
      const dl=state.dutyList||[];

      // Build map: dutyPointId → holders who naturally belong there (and are present)
      const ptNaturalHolders={};
      pts.forEach(pt=>{ ptNaturalHolders[pt.id]=[]; });
      dl.forEach(entry=>{
        if(!presentIds.has(entry.userId)) return; // absent — skip
        (entry.dutyPointIds||[]).forEach(ptId=>{
          if(ptNaturalHolders[ptId]) ptNaturalHolders[ptId].push(entry.userId);
        });
      });

      // Track assigned + unassigned pool
      const assigned=new Set();
      const unassigned=()=>[...presentIds].filter(id=>!assigned.has(id));

      // Helper: pick best holder for a point
      const pickForPoint=(ptId,exclude=new Set())=>{
        // Prefer natural holder who is not yet assigned
        const nat=(ptNaturalHolders[ptId]||[]).find(id=>!assigned.has(id)&&!exclude.has(id));
        if(nat) return nat;
        // Fallback: any unassigned present member
        return unassigned().find(id=>!exclude.has(id))||null;
      };

      // ── Step 1: Fill IMPORTANT points first ──
      pts.filter(p=>p.important).forEach(pt=>{
        const minReq=Math.max(1,pt.minRequired||1);
        const picks=[];
        const usedHere=new Set();
        for(let i=0;i<minReq;i++){
          const pick=pickForPoint(pt.id,usedHere);
          if(pick){picks.push(pick);assigned.add(pick);usedHere.add(pick);}
        }
        result[pt.id]=picks;
      });

      // ── Step 2: Check group minimum requirements ──
      // Count how many present members are already assigned to each group
      const grpAssignedCount={};
      pts.forEach(pt=>{
        if(pt.group&&result[pt.id]?.length){
          grpAssignedCount[pt.group]=(grpAssignedCount[pt.group]||0)+result[pt.id].length;
        }
      });
      grps.forEach(g=>{
        const gMin=Math.max(0,g.minRequired||0);
        const current=grpAssignedCount[g.name]||0;
        if(current<gMin){
          // Fill non-important points in this group
          const gNormPts=pts.filter(p=>p.group===g.name&&!p.important);
          let needed=gMin-current;
          for(const pt of gNormPts){
            if(needed<=0||unassigned().length===0) break;
            const pick=pickForPoint(pt.id);
            if(pick){
              result[pt.id]=[...(result[pt.id]||[]),pick];
              assigned.add(pick);
              grpAssignedCount[g.name]=(grpAssignedCount[g.name]||0)+1;
              needed--;
            }
          }
        }
      });

      // ── Step 3: Assign remaining present members to normal (non-important) points ──
      pts.filter(p=>!p.important).forEach(pt=>{
        // Skip if already filled in step 2
        if(result[pt.id]?.length) return;
        if(unassigned().length===0) return;
        const pick=pickForPoint(pt.id);
        if(pick){result[pt.id]=[pick];assigned.add(pick);}
        else result[pt.id]=[];
      });

      // ── Step 4: Any still-unassigned present members → add to least-covered points ──
      let leftover=unassigned();
      if(leftover.length>0){
        // Sort points by fewest assignments
        const sortedByLoad=[...pts].sort((a,b)=>(result[a.id]?.length||0)-(result[b.id]?.length||0));
        leftover.forEach((uid,i)=>{
          const pt=sortedByLoad[i%sortedByLoad.length];
          if(pt){result[pt.id]=[...(result[pt.id]||[]),uid];}
        });
      }
    }

    dispatch({type:'SET_DUTY_ASSIGNMENTS',v:result});
    sAssignments(result);
    sGenerated(true);
    toast(`Duty generated (${meth==='random'?'Random':'Smart'} method)!`,'success');
  };

  // Sync assignments from state (in case state updated externally)
  const currentAssignments=state.dutyAssignments||{};

  const memberName=(uid)=>state.users[uid]?.name||uid;

  return (
    <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}>
      {/* Tab bar */}
      <div style={{display:'flex',gap:0,background:C.border2,borderRadius:8,
        padding:3,width:'fit-content',marginBottom:16}}>
        {[['points','Duty Points'],['groups','Groups'],['today',"Today's Duty"],['list','Duty List']].map(([v,l])=>(
          <button key={v} onClick={()=>sTab(v)} style={{
            padding:'7px 16px',borderRadius:6,fontSize:12,fontWeight:tab===v?700:500,
            background:tab===v?C.white:'transparent',color:tab===v?C.text:C.text3,
            border:'none',cursor:'pointer',transition:'all .15s',whiteSpace:'nowrap'}}>
            {l}
          </button>
        ))}
      </div>

      {/* TODAY'S DUTY TAB */}
      {tab==='today'&&(
        <div>
          {/* Sub-tabs: Today / Past */}
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {[['today',"Today's Duty"],['past','Past Duty']].map(([v,l])=>(
              <button key={v} onClick={()=>sDutyTab(v)} style={{
                padding:'6px 14px',borderRadius:6,fontSize:11,fontWeight:dutyTab===v?700:500,
                background:dutyTab===v?C.text:'transparent',color:dutyTab===v?'#fff':C.text3,
                border:`1px solid ${dutyTab===v?C.text:C.border}`,cursor:'pointer'}}>
                {l}
              </button>
            ))}
          </div>

          {dutyTab==='today'&&(
            <>
              {/* Non-working day banners */}
              {!isWorkingDay&&isTodaySunday&&(
                <div style={{background:'#F4F4F5',border:`1px solid ${C.border}`,borderRadius:10,padding:'16px 18px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>Sunday — No Duty</div>
                    <div style={{fontSize:11,color:C.text3,marginTop:3}}>Duty points are not active on Sundays. Mark as working day to override.</div>
                  </div>
                  <button onClick={()=>{dispatch({type:'SET_WORKING_DAY',isWorking:true,dayType:'override',note:'Admin override — Sunday working',by:user.name});toast('Sunday marked as working day','success');}}
                    style={{padding:'8px 14px',background:C.text,color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',flexShrink:0}}>
                    Mark as Working Day
                  </button>
                </div>
              )}
              {!isWorkingDay&&!isTodaySunday&&(
                <div style={{background:C.yelL,border:`1px solid ${C.yelB}`,borderRadius:10,padding:'14px 18px',marginBottom:14,color:C.yel}}>
                  <div style={{fontWeight:700,fontSize:13}}>Holiday / Non-Working Day</div>
                  <div style={{fontSize:11,marginTop:4}}>Duty points are only active on working days.</div>
                </div>
              )}
              {isWorkingDay&&isTodaySunday&&adminSundayOverride&&(
                <div style={{background:C.greenL,border:`1px solid ${C.greenB}`,borderRadius:8,padding:'8px 14px',marginBottom:12,fontSize:11,color:C.green,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                  <I n="chk" s={12} c={C.green} w={2.5}/>Sunday overridden as Working Day by admin
                </div>
              )}

              {isWorkingDay&&<>
                {/* Method selector */}
                <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 18px',marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:10}}>Select Assignment Method</div>
                  <div style={{display:'flex',gap:10,marginBottom:12}}>
                    {[['random','Random'],['smart','Smart (Duty List)']].map(([v,l])=>(
                      <div key={v} onClick={()=>sMethod(v)} style={{
                        flex:1,border:`2px solid ${method===v?C.green:C.border}`,
                        background:method===v?C.greenL:C.white,borderRadius:9,padding:'12px 14px',cursor:'pointer',transition:'all .12s'}}>
                        <div style={{fontSize:12,fontWeight:700,color:method===v?C.green:C.text}}>{l}</div>
                        <div style={{fontSize:10,color:C.text4,marginTop:3}}>
                          {v==='random'?'Randomly assigns all present members, important points filled first.':'Uses each member\'s duty points from the list. Important points & group minimums enforced.'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                    <div style={{fontSize:11,color:C.text3}}><b style={{color:C.text}}>{presentMembers.length}</b> present today · <b style={{color:C.text}}>{pts.length}</b> duty points · <b style={{color:C.text}}>{(state.dutyList||[]).length}</b> in duty list</div>
                    <button onClick={()=>generateDuty(method)} style={{
                      marginLeft:'auto',padding:'8px 16px',background:C.green,color:'#fff',
                      border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',
                      display:'flex',alignItems:'center',gap:6}}>
                      <I n="shuffle" s={13} c="#fff"/>Generate Duty
                    </button>
                  </div>
                  {method==='smart'&&(state.dutyList||[]).length===0&&(
                    <div style={{marginTop:10,padding:'8px 12px',background:C.yelL,border:`1px solid ${C.yelB}`,borderRadius:7,fontSize:11,color:C.yel}}>
                      ⚠️ Duty List is empty — Smart method will behave like Random. Add holders in the Duty List tab first.
                    </div>
                  )}
                </div>

                {/* Generated assignments */}
                {(generated||Object.keys(currentAssignments).length>0)&&<div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                  <div style={{padding:'10px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.text}}>Today's Assignment — {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <Tag ch="Generated" c={C.green} bg={C.greenL} b={C.greenB}/>
                      <button onClick={()=>{dispatch({type:'SET_DUTY_ASSIGNMENTS',v:{}});sAssignments({});sGenerated(false);toast('Cleared.','success');}}
                        style={{padding:'3px 8px',background:C.redL,color:C.red,border:`1px solid ${C.redB}`,borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer'}}>
                        Clear
                      </button>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 80px 1fr 80px',padding:'8px 14px',borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text4,gap:10,textTransform:'uppercase',letterSpacing:'.04em'}}>
                    <span>Duty Point</span><span>Group</span><span>Priority</span><span>Assigned To</span><span>Edit</span>
                  </div>
                  {pts.map((pt,i)=>{
                    const assignedIds=currentAssignments[pt.id]||assignments[pt.id]||[];
                    const assignedNames=assignedIds.map(uid=>memberName(uid)).join(', ')||'—';
                    const isEditing=editAssign===pt.id;
                    return <div key={pt.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 80px 1fr 80px',padding:'10px 14px',borderBottom:i<pts.length-1?`1px solid ${C.border2}`:'none',alignItems:'center',gap:10,background:pt.important?'rgba(220,38,38,0.02)':'transparent'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        {pt.important&&<span style={{width:6,height:6,borderRadius:'50%',background:C.red,flexShrink:0,display:'inline-block'}}/>}
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:C.text}}>{pt.name}</div>
                          <div style={{fontSize:10,color:C.text4}}>{pt.floor} Floor · {pt.building||'Main'}</div>
                        </div>
                      </div>
                      <div style={{fontSize:11,color:C.text3}}>{pt.group||'—'}</div>
                      <div>{pt.important?<Tag ch="Important" c={C.red} bg={C.redL} b={C.redB}/>:<span style={{fontSize:10,color:C.text4}}>Normal</span>}</div>
                      <div>
                        {isEditing
                          ?<select value={manualPick} onChange={e=>sManualPick(e.target.value)} style={{...inp,padding:'4px 8px',fontSize:11}}>
                            <option value="">— Unassigned —</option>
                            {presentMembers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                          :<span style={{fontSize:12,fontWeight:500,color:assignedNames==='—'?C.text4:C.text}}>{assignedNames}</span>}
                      </div>
                      <div style={{display:'flex',gap:5}}>
                        {!isEditing
                          ?<button onClick={()=>{sEditAssign(pt.id);sManualPick((assignedIds)[0]||'');}} style={{padding:'3px 8px',background:C.blueL,color:C.blue,border:`1px solid ${C.blueB}`,borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:2}}>
                            <I n="edit" s={11} c={C.blue}/>Edit
                          </button>
                          :<div style={{display:'flex',gap:4}}>
                            <button onClick={()=>{
                              const updated={...currentAssignments,...assignments};
                              updated[pt.id]=manualPick?[manualPick]:[];
                              sAssignments(updated);
                              dispatch({type:'SET_DUTY_ASSIGNMENTS',v:updated});
                              sEditAssign(null);toast('Updated!','success');
                            }} style={{padding:'3px 8px',background:C.greenL,color:C.green,border:`1px solid ${C.greenB}`,borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer'}}>Save</button>
                            <button onClick={()=>sEditAssign(null)} style={{padding:'3px 6px',background:C.border2,color:C.text3,border:`1px solid ${C.border}`,borderRadius:5,fontSize:10,cursor:'pointer'}}>✕</button>
                          </div>}
                      </div>
                    </div>;
                  })}
                </div>}
                {(!generated&&Object.keys(currentAssignments).length===0)&&<div style={{textAlign:'center',padding:'40px 0',color:C.text4}}>
                  <I n="shuffle" s={32} c={C.border2}/>
                  <div style={{marginTop:8,fontSize:13,fontWeight:500}}>No duty generated yet for today</div>
                  <div style={{fontSize:11,marginTop:4}}>Choose a method above and click Generate</div>
                </div>}
              </>}
            </>
          )}

          {dutyTab==='past'&&(
            <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:'20px',textAlign:'center',color:C.text4}}>
              <I n="hist" s={28} c={C.border2}/>
              <div style={{fontSize:13,fontWeight:500,marginTop:8}}>Past Duty Records</div>
              <div style={{fontSize:11,marginTop:4}}>Past day duty assignments will appear here after midnight rollover.</div>
              <div style={{fontSize:10,marginTop:4,color:C.text4}}>Historical records will be available after Supabase integration.</div>
            </div>
          )}
        </div>
      )}

      {/* DUTY LIST TAB */}
      {tab==='list'&&<DutyListTab state={state} dispatch={dispatch} toast={toast} pts={pts} allMembers={allMembers}/>}

      {tab==='points'&&(
        <>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12,alignItems:'center'}}>
            <div style={{fontSize:11,color:C.text3}}>{pts.length} duty points · {pts.filter(p=>p.important).length} important</div>
            <button onClick={()=>{resetF();sShowAddPt(true);}} style={{
              padding:'7px 13px',background:C.green,color:'#fff',border:'none',
              borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
              display:'flex',alignItems:'center',gap:5}}>
              <I n="plus" s={13} c="#fff"/>Add Point
            </button>
          </div>
          {/* Group by floor */}
          {floors.map(floor=>{
            const fpts=pts.filter(p=>p.floor===floor);
            if(!fpts.length) return null;
            return (
              <div key={floor} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:C.text4,
                  textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8,
                  display:'flex',alignItems:'center',gap:6}}>
                  <I n="home" s={12} c={C.text4}/>{floor} Floor
                </div>
                <div style={{background:C.white,border:`1px solid ${C.border}`,
                  borderRadius:10,overflow:'hidden'}}>
                  {fpts.map((pt,i)=>(
                    <div key={pt.id} style={{
                      display:'grid',gridTemplateColumns:'1.5fr 1fr 60px 60px 100px',
                      padding:'10px 14px',gap:10,alignItems:'center',
                      borderBottom:i<fpts.length-1?`1px solid ${C.border2}`:'none',
                    }}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        {pt.important&&<span title="Important" style={{
                          width:6,height:6,borderRadius:'50%',
                          background:C.red,flexShrink:0,display:'inline-block'}}/>}
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:C.text}}>{pt.name}</div>
                          <div style={{fontSize:10,color:C.text4}}>{pt.group||'—'}</div>
                        </div>
                      </div>
                      <div style={{fontSize:11,color:C.text3}}>{pt.building}</div>
                      <div style={{fontSize:11,fontWeight:600,color:C.blue}}>Min {pt.minRequired}</div>
                      <div>
                        {pt.important
                          ?<Tag ch="Important" c={C.red} bg={C.redL} b={C.redB}/>
                          :<span style={{fontSize:10,color:C.text4}}>Normal</span>}
                      </div>
                      <div style={{display:'flex',gap:5}}>
                        <button onClick={()=>{sF({...pt});sEditPt(pt.id);sShowAddPt(true);}}
                          style={{padding:'3px 8px',background:C.blueL,color:C.blue,
                            border:`1px solid ${C.blueB}`,borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:2}}>
                          <I n="edit" s={11} c={C.blue}/>Edit
                        </button>
                        <button onClick={()=>{
                          if(window.confirm(`Delete "${pt.name}"?`)){
                            dispatch({type:'DEL_DUTY_POINT',id:pt.id});
                            toast('Duty point deleted.','success');
                          }
                        }} style={{padding:'3px 7px',background:C.redL,color:C.red,
                          border:`1px solid ${C.redB}`,borderRadius:5,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center'}}>
                          <I n="trash" s={11} c={C.red}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab==='groups'&&(
        <>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12,alignItems:'center'}}>
            <div style={{fontSize:11,color:C.text3}}>{grps.length} groups — each group needs min coverage</div>
            <button onClick={()=>{sGf({name:'',minRequired:1,important:false});sShowAddGrp(true);}} style={{
              padding:'7px 13px',background:C.green,color:'#fff',border:'none',
              borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
              display:'flex',alignItems:'center',gap:5}}>
              <I n="plus" s={13} c="#fff"/>Add Group
            </button>
          </div>
          <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 60px 80px',
              padding:'8px 14px',borderBottom:`1px solid ${C.border}`,
              fontSize:10,fontWeight:700,color:C.text4,gap:10,
              textTransform:'uppercase',letterSpacing:'.04em'}}>
              <span>Group Name</span><span>Points In Group</span><span>Min</span><span>Actions</span>
            </div>
            {grps.map((g,i)=>{
              const gpts=pts.filter(p=>p.group===g.name);
              return (
                <div key={g.id} style={{
                  display:'grid',gridTemplateColumns:'1.5fr 1fr 60px 80px',
                  padding:'11px 14px',gap:10,alignItems:'center',
                  borderBottom:i<grps.length-1?`1px solid ${C.border2}`:'none',
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {g.important&&<span style={{width:6,height:6,borderRadius:'50%',background:C.red,flexShrink:0,display:'inline-block'}}/>}
                    <div style={{fontSize:12,fontWeight:600,color:C.text}}>{g.name}</div>
                  </div>
                  <div style={{fontSize:11,color:C.text3}}>{gpts.length} points: {gpts.map(p=>p.name).join(', ').slice(0,40)||'—'}</div>
                  <div style={{fontSize:12,fontWeight:700,color:C.blue}}>≥{g.minRequired}</div>
                  <div style={{display:'flex',gap:5}}>
                    <button onClick={()=>{sGf({name:g.name,minRequired:g.minRequired,important:!!g.important});sEditGrp(g.id);sShowAddGrp(true);}}
                      style={{padding:'3px 7px',background:C.blueL,color:C.blue,
                        border:`1px solid ${C.blueB}`,borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:2}}>
                      <I n="edit" s={11} c={C.blue}/>Edit
                    </button>
                    <button onClick={()=>{
                      if(window.confirm(`Delete group "${g.name}"?`)){
                        dispatch({type:'DEL_DUTY_GROUP',id:g.id});
                        toast('Group deleted.','success');
                      }
                    }} style={{padding:'3px 7px',background:C.redL,color:C.red,
                      border:`1px solid ${C.redB}`,borderRadius:5,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center'}}>
                      <I n="trash" s={11} c={C.red}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add/Edit Duty Point Modal */}
      {showAddPt&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:C.white,borderRadius:14,padding:22,width:'100%',
            maxWidth:420,boxShadow:'0 24px 60px rgba(0,0,0,.2)',animation:'fadeUp .2s'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{editPt?'Edit':'Add'} Duty Point</div>
              <button onClick={()=>{sShowAddPt(false);sEditPt(null);resetF();}}
                style={{background:C.border2,border:'none',borderRadius:7,padding:6,cursor:'pointer',display:'flex'}}>
                <I n="xx" s={13} c={C.text3}/>
              </button>
            </div>
            {[['Point Name *','name','e.g. Main Gate'],['Building','building','Main / Block A']].map(([l,k,ph])=>(
              <div key={k} style={{marginBottom:10}}>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>{l}</label>
                <input value={f[k]||''} onChange={e=>sF(v=>({...v,[k]:e.target.value}))} placeholder={ph} style={inp}/>
              </div>
            ))}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Floor</label>
                <select value={f.floor||'Ground'} onChange={e=>sF(v=>({...v,floor:e.target.value}))} style={{...inp}}>
                  {floors.map(fl=><option key={fl}>{fl}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Min Required</label>
                <input type="number" min="0" max="20"
                  value={f.minRequired===undefined||f.minRequired===null?'':f.minRequired}
                  onChange={e=>{const v=e.target.value;sF(p=>({...p,minRequired:v===''?'':parseInt(v)||0}));}}
                  placeholder="e.g. 1" style={inp}/>
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Group</label>
              <input value={f.group||''} onChange={e=>sF(v=>({...v,group:e.target.value}))}
                placeholder="e.g. 2F Corridors" list="grp-list" style={inp}/>
              <datalist id="grp-list">{groups.map(g=><option key={g} value={g}/>)}</datalist>
            </div>
            <div style={{marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
              <input type="checkbox" id="imp" checked={!!f.important}
                onChange={e=>sF(v=>({...v,important:e.target.checked}))}
                style={{width:14,height:14,cursor:'pointer'}}/>
              <label htmlFor="imp" style={{fontSize:12,fontWeight:500,color:C.text,cursor:'pointer'}}>
                Mark as Important (must always be covered)
              </label>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{
                if(!f.name?.trim()){toast('Name required.','error');return;}
                if(editPt){dispatch({type:'EDIT_DUTY_POINT',id:editPt,v:f});toast('Updated!','success');}
                else{dispatch({type:'ADD_DUTY_POINT',v:f});toast('Added!','success');}
                sShowAddPt(false);sEditPt(null);resetF();
              }} style={{flex:1,padding:'10px',background:C.text,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                {editPt?'Save':'Add'}
              </button>
              <button onClick={()=>{sShowAddPt(false);sEditPt(null);resetF();}}
                style={{flex:1,padding:'10px',background:C.border2,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Group Modal */}
      {showAddGrp&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:C.white,borderRadius:14,padding:22,width:'100%',
            maxWidth:380,boxShadow:'0 24px 60px rgba(0,0,0,.2)',animation:'fadeUp .2s'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{editGrp?'Edit Group':'Add Group'}</div>
              <button onClick={()=>{sShowAddGrp(false);sEditGrp(null);sGf({name:'',minRequired:'',important:false});}}
                style={{background:C.border2,border:'none',borderRadius:7,padding:6,cursor:'pointer',display:'flex'}}>
                <I n="xx" s={13} c={C.text3}/>
              </button>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Group Name *</label>
              <input value={gf.name} onChange={e=>sGf(v=>({...v,name:e.target.value}))} placeholder="e.g. 2F Corridors" style={inp}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Min Required Coverage</label>
              <input type="number" min="0" max="20"
                value={gf.minRequired===undefined||gf.minRequired===null?'':gf.minRequired}
                onChange={e=>{const v=e.target.value;sGf(p=>({...p,minRequired:v===''?'':parseInt(v)||0}));}}
                placeholder="e.g. 1" style={inp}/>
              <div style={{fontSize:10,color:C.text4,marginTop:4}}>If all members absent, algorithm redistributes to cover this minimum</div>
            </div>
            <div style={{marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
              <input type="checkbox" id="gimp" checked={!!gf.important}
                onChange={e=>sGf(v=>({...v,important:e.target.checked}))}
                style={{width:14,height:14,cursor:'pointer'}}/>
              <label htmlFor="gimp" style={{fontSize:12,fontWeight:500,color:C.text,cursor:'pointer'}}>Important group</label>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{
                if(!gf.name?.trim()){toast('Name required.','error');return;}
                const val={...gf,minRequired:gf.minRequired===''?0:Number(gf.minRequired)};
                if(editGrp){
                  dispatch({type:'EDIT_DUTY_GROUP',id:editGrp,v:val});
                  toast('Group updated!','success');
                }else{
                  dispatch({type:'ADD_DUTY_GROUP',v:val});
                  toast('Group added!','success');
                }
                sShowAddGrp(false);sEditGrp(null);sGf({name:'',minRequired:'',important:false});
              }} style={{flex:1,padding:'10px',background:C.text,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>{editGrp?'Save':'Add'}</button>
              <button onClick={()=>{sShowAddGrp(false);sEditGrp(null);sGf({name:'',minRequired:'',important:false});}}
                style={{flex:1,padding:'10px',background:C.border2,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ NOTICE PAGE ══ */
function NoticePage({user,state,dispatch,toast}){
  const canAdmin=['super_admin','teacher_admin'].includes(user.role);
  const [showAdd,sShowAdd]=useState(false);
  const [editN,sEditN]=useState(null);
  const [fh,sFh]=useState('');
  const [fb,sFb]=useState('');
  const notices=state.notices||[];
  const inp={width:'100%',padding:'9px 10px',border:`1px solid ${C.border}`,
    borderRadius:7,fontSize:12,color:C.text,outline:'none',background:C.white};

  const resetForm=()=>{sFh('');sFb('');sEditN(null);};

  return (
    <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontSize:11,color:C.text3}}>{notices.length} notices</div>
        {canAdmin&&(
          <button onClick={()=>{resetForm();sShowAdd(true);}} style={{
            padding:'7px 13px',background:C.text,color:'#fff',border:'none',
            borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
            display:'flex',alignItems:'center',gap:5}}>
            <I n="plus" s={13} c="#fff"/>Add Notice
          </button>
        )}
      </div>

      {notices.length===0&&(
        <div style={{textAlign:'center',padding:'48px 0',color:C.text4}}>
          <div style={{marginBottom:8,display:'flex',justifyContent:'center'}}>
            <I n="bell" s={32} c={C.border2}/>
          </div>
          <div style={{fontSize:13,fontWeight:500}}>No notices yet</div>
          {canAdmin&&<div style={{fontSize:12,marginTop:4}}>Click "Add Notice" to post one</div>}
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {[...notices].reverse().map((n,i)=>(
          <div key={n.id} style={{
            background:C.white,border:`1px solid ${C.border}`,
            borderRadius:12,overflow:'hidden',
            boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              background:'linear-gradient(135deg,#000,#18181B)',
              padding:'12px 16px',
              display:'flex',alignItems:'center',justifyContent:'space-between',
            }}>
              <div style={{fontSize:13,fontWeight:700,color:'#fff',letterSpacing:'-0.2px'}}>{n.heading}</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>{n.at}</span>
                {canAdmin&&(
                  <div style={{display:'flex',gap:5}}>
                    <button onClick={()=>{sEditN(n);sFh(n.heading);sFb(n.body);sShowAdd(true);}}
                      style={{background:'rgba(255,255,255,0.1)',border:'none',borderRadius:5,
                        padding:'3px 7px',cursor:'pointer',color:'rgba(255,255,255,0.7)',fontSize:10,fontWeight:600,display:'flex',alignItems:'center',gap:3}}>
                      <I n="edit" s={11} c="rgba(255,255,255,0.7)"/>Edit
                    </button>
                    <button onClick={()=>{
                      if(window.confirm('Delete this notice?')){
                        dispatch({type:'DEL_NOTICE',id:n.id});
                        toast('Notice deleted.','success');
                      }
                    }} style={{background:'rgba(220,38,38,0.2)',border:'none',borderRadius:5,
                      padding:'3px 7px',cursor:'pointer',color:'#FCA5A5',fontSize:10,display:'flex',alignItems:'center'}}>
                      <I n="trash" s={11} c="#FCA5A5"/>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div style={{padding:'14px 16px',fontSize:13,color:C.text2,lineHeight:1.7,whiteSpace:'pre-wrap'}}>
              {n.body}
            </div>
            <div style={{padding:'8px 16px',borderTop:`1px solid ${C.border2}`,
              fontSize:10,color:C.text4,display:'flex',gap:12}}>
              <span>Posted by {n.by}</span>
              {n.editedAt&&<span>· Edited {n.editedAt}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit modal */}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:C.white,borderRadius:14,padding:22,width:'100%',
            maxWidth:480,boxShadow:'0 24px 60px rgba(0,0,0,.2)',animation:'fadeUp .2s'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{editN?'Edit Notice':'New Notice'}</div>
              <button onClick={()=>{sShowAdd(false);resetForm();}}
                style={{background:C.border2,border:'none',borderRadius:7,padding:6,cursor:'pointer',display:'flex'}}>
                <I n="xx" s={13} c={C.text3}/>
              </button>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Heading *</label>
              <input value={fh} onChange={e=>sFh(e.target.value)}
                placeholder="Notice heading..." style={inp}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Body *</label>
              <textarea value={fb} onChange={e=>sFb(e.target.value)}
                placeholder="Notice details..."
                style={{...inp,minHeight:100,resize:'vertical',lineHeight:1.6}}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{
                if(!fh.trim()||!fb.trim()){toast('Fill heading and body.','error');return;}
                if(editN){
                  dispatch({type:'EDIT_NOTICE',id:editN.id,v:{heading:fh,body:fb,editedAt:tsNow()},by:user.name});
                  toast('Notice updated!','success');
                } else {
                  dispatch({type:'ADD_NOTICE',v:{heading:fh,body:fb},by:user.name});
                  toast('Notice posted!','success');
                }
                sShowAdd(false);resetForm();
              }} style={{flex:1,padding:'10px',background:C.text,color:'#fff',
                border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                {editN?'Save Changes':'Post Notice'}
              </button>
              <button onClick={()=>{sShowAdd(false);resetForm();}}
                style={{flex:1,padding:'10px',background:C.border2,color:C.text,
                  border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ ADMINS PAGE — SA sees all + edit/delete; TA sees only IDs (no passwords, no edit others) ══ */
function AdminsPage({user,state,dispatch,toast}){
  const isSA=user.role==='super_admin';
  const isTA=user.role==='teacher_admin';
  const [editId,sEid]=useState(null);
  const [showPw,sPw]=useState({});
  const [ef,sEf]=useState({name:'',pw:''});
  const [showAdd,sShowAdd]=useState(false);
  const [af,sAf]=useState({name:'',badge:'Teacher Admin',id:'',pw:''});
  const admins=Object.entries(state.users).filter(([id,u])=>u.role==='teacher_admin').map(([id,u])=>({id,...u}));
  const inp2={width:'100%',padding:'9px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,outline:'none',background:C.white};

  // SA: Name | Login ID | Password (show/hide) | Edit | Delete
  // TA: Name | Login ID | Delete (can't see/edit own or others' pw except add)
  const cols = isSA ? '1.4fr 1fr 1fr 130px' : '1.6fr 1fr 80px';

  return <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <div style={{fontSize:11,color:C.text3}}>
        {isSA ? 'Teacher Admin credentials — Super Admin view' : 'Teacher Admins in the system'}
      </div>
      <button onClick={()=>{sAf({name:'',badge:'Teacher Admin',id:'TC-',pw:''});sShowAdd(true);}}
        style={{padding:'7px 13px',background:C.green,color:'#fff',border:'none',
          borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
          display:'flex',alignItems:'center',gap:5}}>
        <I n="plus" s={13} c="#fff"/>Add Admin
      </button>
    </div>

    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
      {/* Header */}
      <div style={{display:'grid',gridTemplateColumns:cols,padding:'9px 16px',borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.text4,gap:12,textTransform:'uppercase',letterSpacing:'.04em'}}>
        <span>Name</span><span>Login ID</span>
        {isSA&&<span>Password</span>}
        <span>Actions</span>
      </div>

      {admins.length===0&&<div style={{padding:'24px',textAlign:'center',color:C.text4,fontSize:12}}>No teacher admins yet</div>}

      {admins.map((a,i)=>{
        const isOwnRow=a.id===user.id;
        return <div key={a.id} style={{display:'grid',gridTemplateColumns:cols,padding:'13px 16px',borderBottom:i<admins.length-1?`1px solid ${C.border2}`:'none',alignItems:'center',gap:12}}>
          {/* Name + badge */}
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:9,background:HOUSES.default.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{ini(a.name)}</div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>{a.name}</div>
              <div style={{fontSize:11,color:C.text4,marginTop:1}}>{a.badge}</div>
            </div>
          </div>
          {/* Login ID */}
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontFamily:'monospace',fontSize:12,color:C.text,fontWeight:500}}>{a.id}</span>
            {isOwnRow&&<Tag ch="You" c={C.green} bg={C.greenL} b={C.greenB}/>}
          </div>
          {/* Password — SA only */}
          {isSA&&<div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontFamily:'monospace',fontSize:12,color:showPw[a.id]?C.text:C.text4}}>
              {showPw[a.id]?a.pw:'••••••••'}
            </span>
            <button onClick={()=>sPw(p=>({...p,[a.id]:!p[a.id]}))} style={{background:'none',border:'none',cursor:'pointer',display:'flex',padding:2}}>
              <I n={showPw[a.id]?'eyeoff':'eye'} s={13} c={C.blue}/>
            </button>
          </div>}
          {/* Actions */}
          <div style={{display:'flex',gap:5}}>
            {isSA&&<button onClick={()=>{sEid(a.id);sEf({name:a.name,pw:a.pw});}}
              style={{padding:'5px 10px',background:C.blueL,color:C.blue,border:`1px solid ${C.blueB}`,borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}>
              <I n="edit" s={11} c={C.blue}/>Edit
            </button>}
            {!isOwnRow&&<button onClick={()=>{
              if(window.confirm(`Delete "${a.name}"? This cannot be undone.`)){
                dispatch({type:'DEL_USER',id:a.id,by:user.name});
                toast(`${a.name} deleted.`,'success');
              }
            }} style={{padding:'5px 9px',background:C.redL,color:C.red,border:`1px solid ${C.redB}`,borderRadius:6,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center'}}>
              <I n="trash" s={11} c={C.red}/>
            </button>}
          </div>
        </div>;
      })}
    </div>

    {/* Add Admin Modal — available to SA and TA */}
    {showAdd&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.white,borderRadius:12,padding:22,width:'100%',maxWidth:400,boxShadow:'0 20px 60px rgba(0,0,0,.2)',animation:'fadeUp .2s'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text}}>Add Teacher Admin</div>
          <button onClick={()=>sShowAdd(false)} style={{background:C.border2,border:'none',borderRadius:6,padding:5,cursor:'pointer',display:'flex'}}><I n="xx" s={12} c={C.text3}/></button>
        </div>
        <div style={{marginBottom:10}}>
          <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Full Name *</label>
          <input value={af.name} onChange={e=>sAf(v=>({...v,name:e.target.value}))} placeholder="e.g. Mrs. Gupta" style={inp2}/>
        </div>
        <div style={{marginBottom:10}}>
          <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Badge / Role Title</label>
          <input value={af.badge} onChange={e=>sAf(v=>({...v,badge:e.target.value}))} placeholder="e.g. PT Teacher" style={inp2}/>
        </div>
        <div style={{marginBottom:10}}>
          <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Login ID *</label>
          <input value={af.id} onChange={e=>sAf(v=>({...v,id:e.target.value}))} placeholder="e.g. TC-PT" style={inp2}/>
          {af.id&&state.users[af.id]&&<div style={{fontSize:11,color:C.red,marginTop:4}}>⚠ This ID already exists</div>}
        </div>
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Password *</label>
          <input value={af.pw} onChange={e=>sAf(v=>({...v,pw:e.target.value}))} placeholder="Set a password" style={inp2}/>
          <div style={{fontSize:10,color:C.text4,marginTop:4}}>⚠ Note the password now — it will be hidden after saving</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{
            if(!af.name.trim()||!af.id.trim()||!af.pw.trim()){toast('All fields required.','error');return;}
            if(state.users[af.id]){toast('ID already exists.','error');return;}
            dispatch({type:'ADD_USER',id:af.id,v:{name:af.name,badge:af.badge||'Teacher Admin',role:'teacher_admin',pw:af.pw,house:'default',class:'',sec:''},by:user.name});
            toast(`${af.name} added!`,'success');sShowAdd(false);sAf({name:'',badge:'Teacher Admin',id:'TC-',pw:''});
          }} style={{flex:1,padding:'10px',background:C.text,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Add Admin</button>
          <button onClick={()=>sShowAdd(false)} style={{flex:1,padding:'10px',background:C.border2,color:C.text,border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Cancel</button>
        </div>
      </div>
    </div>}

    {/* Edit modal — SA only */}
    {editId&&isSA&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.white,borderRadius:12,padding:22,width:380,boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text}}>Edit Admin — {state.users[editId]?.name}</div>
          <button onClick={()=>sEid(null)} style={{background:C.border2,border:'none',borderRadius:6,padding:5,cursor:'pointer',display:'flex'}}><I n="xx" s={12} c={C.text3}/></button>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Login ID</label>
          <div style={{padding:'9px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text4,background:C.border2,fontFamily:'monospace'}}>{editId}</div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Name</label>
          <input value={ef.name} onChange={e=>sEf(v=>({...v,name:e.target.value}))} placeholder="Full name" style={inp2}/>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Password</label>
          <input value={ef.pw} onChange={e=>sEf(v=>({...v,pw:e.target.value}))} placeholder="New password" style={inp2}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{dispatch({type:'EDIT_USER',id:editId,v:{name:ef.name,pw:ef.pw},by:user.name});toast('Admin updated!','success');sEid(null);}} style={{flex:1,padding:'10px',background:C.text,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Save Changes</button>
          <button onClick={()=>sEid(null)} style={{flex:1,padding:'10px',background:C.border2,color:C.text,border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Cancel</button>
        </div>
      </div>
    </div>}
  </div>;
}

/* ══ SPORT / EVENT SVG ICONS ══ */
const SPORT_ICONS = {
  chess:      <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#1E293B"/><rect x="6" y="6" width="12" height="12" fill="none" stroke="#94A3B8" strokeWidth="1"/><rect x="22" y="6" width="12" height="12" fill="#94A3B8"/><rect x="6" y="22" width="12" height="12" fill="#94A3B8"/><rect x="22" y="22" width="12" height="12" fill="none" stroke="#94A3B8" strokeWidth="1"/></svg>,
  cricket:    <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#14532D"/><path d="M8 32L28 8" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round"/><ellipse cx="30" cy="30" rx="6" ry="4" fill="#86EFAC"/></svg>,
  football:   <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#1E3A5F"/><circle cx="20" cy="20" r="12" stroke="#93C5FD" strokeWidth="2"/><polygon points="20,12 24,17 22,22 18,22 16,17" fill="#93C5FD"/></svg>,
  basketball: <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#7C2D12"/><circle cx="20" cy="20" r="11" stroke="#FCA5A5" strokeWidth="2"/><line x1="9" y1="20" x2="31" y2="20" stroke="#FCA5A5" strokeWidth="1.5"/><line x1="20" y1="9" x2="20" y2="31" stroke="#FCA5A5" strokeWidth="1.5"/><path d="M12 12 Q20 20 12 28" stroke="#FCA5A5" strokeWidth="1.5" fill="none"/><path d="M28 12 Q20 20 28 28" stroke="#FCA5A5" strokeWidth="1.5" fill="none"/></svg>,
  badminton:  <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#4C1D95"/><line x1="10" y1="30" x2="24" y2="16" stroke="#DDD6FE" strokeWidth="2.5" strokeLinecap="round"/><circle cx="27" cy="13" r="5" stroke="#DDD6FE" strokeWidth="1.5" fill="none"/><line x1="22" y1="13" x2="32" y2="13" stroke="#DDD6FE" strokeWidth="1"/><line x1="27" y1="8" x2="27" y2="18" stroke="#DDD6FE" strokeWidth="1"/></svg>,
  debate:     <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#0C4A6E"/><rect x="6" y="8" width="16" height="12" rx="3" stroke="#BAE6FD" strokeWidth="1.5"/><path d="M8 20l-3 4h4" stroke="#BAE6FD" strokeWidth="1.5" fill="none"/><rect x="18" y="20" width="16" height="12" rx="3" stroke="#BAE6FD" strokeWidth="1.5"/><path d="M32 32l3-4h-4" stroke="#BAE6FD" strokeWidth="1.5" fill="none"/></svg>,
  science:    <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#0F172A"/><path d="M14 8v12L8 32h24L26 20V8" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="14" x2="28" y2="14" stroke="#6EE7B7" strokeWidth="1.5"/><circle cx="18" cy="26" r="2" fill="#6EE7B7"/></svg>,
  art:        <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#3B0764"/><circle cx="14" cy="16" r="3" fill="#E879F9"/><circle cx="26" cy="14" r="3" fill="#F0ABFC"/><circle cx="12" cy="26" r="3" fill="#A855F7"/><circle cx="28" cy="26" r="3" fill="#D8B4FE"/><circle cx="20" cy="22" r="4" fill="#C084FC"/></svg>,
  music:      <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#172554"/><path d="M16 28V12l16-3v16" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="28" r="4" stroke="#93C5FD" strokeWidth="1.5"/><circle cx="28" cy="25" r="4" stroke="#93C5FD" strokeWidth="1.5"/></svg>,
  dance:      <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#4A044E"/><circle cx="22" cy="10" r="3" fill="#F0ABFC"/><path d="M22 13c-2 4-8 6-8 10M22 13c2 4 6 8 6 12M14 30l3-6M28 30l-4-6" stroke="#F0ABFC" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  sports:     <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#064E3B"/><path d="M12 28L20 10l8 18" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="14" y1="22" x2="26" y2="22" stroke="#6EE7B7" strokeWidth="1.5"/></svg>,
  quiz:       <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#1C1917"/><text x="20" y="26" textAnchor="middle" fontSize="20" fill="#FCD34D" fontFamily="serif" fontWeight="bold">?</text></svg>,
  // Text-based SVGs for less common sports
  'kho kho':  <svg viewBox="0 0 80 40" fill="none"><rect width="80" height="40" rx="8" fill="#7F1D1D"/><text x="40" y="27" textAnchor="middle" fontSize="14" fill="#FCA5A5" fontFamily="sans-serif" fontWeight="800">KHO KHO</text></svg>,
  'kabaddi':  <svg viewBox="0 0 80 40" fill="none"><rect width="80" height="40" rx="8" fill="#14532D"/><text x="40" y="27" textAnchor="middle" fontSize="14" fill="#86EFAC" fontFamily="sans-serif" fontWeight="800">KABADDI</text></svg>,
  'hockey':   <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#1E3A8A"/><path d="M10 10L26 26" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round"/><path d="M26 26c0 0 6 0 6 4s-6 2-6 2" stroke="#93C5FD" strokeWidth="2" fill="none"/><circle cx="12" cy="30" r="3" fill="#93C5FD"/></svg>,
  default:    <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#1E293B"/><polygon points="20,8 24,16 33,17 26,24 28,33 20,28 12,33 14,24 7,17 16,16" stroke="#FCD34D" strokeWidth="1.5" fill="none"/></svg>,
};

function getSportIcon(sport='',title=''){
  const s=(sport+' '+title).toLowerCase();
  for(const key of Object.keys(SPORT_ICONS)){
    if(s.includes(key)) return SPORT_ICONS[key];
  }
  return SPORT_ICONS.default;
}

/* ══ EVENTS PAGE ══ */
function EventsPage({user,state,dispatch,toast}){
  const isSA=user.role==='super_admin';
  const isTA=user.role==='teacher_admin';
  const canAdmin=isSA||isTA;
  const [tab,sTab]=useState('ongoing');
  const [showAdd,sShowAdd]=useState(false);
  const [showDetail,sShowDetail]=useState(null);
  const [editEv,sEditEv]=useState(null);
  const TABS=[['past','Past Events'],['ongoing','Ongoing'],['upcoming','Upcoming']];
  const filtered=(state.events||[]).filter(ev=>ev.status===tab);
  const cats=state.eventCategories||[];
  const REWARDS=['certificate','certificate+medal','certificate+trophy','certificate+medal+trophy','points only','none'];

  return <div style={{padding:'18px 22px',animation:'fadeUp .2s'}}>
    {/* Tabs */}
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
      <div style={{display:'flex',gap:0,background:C.border2,borderRadius:8,padding:3}}>
        {TABS.map(([v,l])=><button key={v} onClick={()=>sTab(v)} style={{
          padding:'7px 16px',borderRadius:6,fontSize:12,fontWeight:tab===v?700:500,
          background:tab===v?C.white:'transparent',color:tab===v?C.text:C.text3,
          border:'none',cursor:'pointer',transition:'all .15s',
        }}>{l}</button>)}
      </div>
      {canAdmin&&<button onClick={()=>{sEditEv(null);sShowAdd(true);}} style={{
        padding:'7px 13px',background:C.green,color:'#fff',border:'none',
        borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
        display:'flex',alignItems:'center',gap:6,
      }}><I n="plus" s={13} c="#fff"/>Add Event</button>}
    </div>

    {/* Event cards */}
    {filtered.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:C.text4,fontSize:13}}>No {tab} events</div>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
      {filtered.map(ev=>{
        const cat=cats.find(c=>c.id===ev.category)||{name:ev.category};
        const hc=HOUSES[ev.winnerHouse]||null;
        const icon=getSportIcon(ev.sport,ev.title);
        return <div key={ev.id} style={{
          background:C.white,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden',
          cursor:'pointer',transition:'box-shadow .15s, transform .15s',
        }}
          onClick={()=>sShowDetail(ev)}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.1)';e.currentTarget.style.transform='translateY(-1px)';}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
          {/* Icon header */}
          <div style={{
            background:hc?hc.grad:'linear-gradient(135deg,#1E293B,#334155)',
            padding:'16px',display:'flex',alignItems:'center',gap:12,
          }}>
            <div style={{width:48,height:48,borderRadius:10,overflow:'hidden',flexShrink:0,background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {typeof icon==='object'?<div style={{width:40,height:40}}>{icon}</div>:icon}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:'#fff',lineHeight:1.3}}>{ev.title}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.6)',marginTop:3}}>{ev.date} · {cat.name}</div>
            </div>
          </div>
          {/* Body */}
          <div style={{padding:'12px 14px'}}>
            {ev.winner&&<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:C.green}}>🏆 Winner: {ev.winner}</div>
              {ev.winnerScore&&<Tag ch={ev.winnerScore} c={C.green} bg={C.greenL} b={C.greenB}/>}
            </div>}
            {ev.runnerUp&&<div style={{fontSize:11,color:C.text3,marginBottom:8}}>🥈 Runner-up: {ev.runnerUp} {ev.runnerUpScore&&`· ${ev.runnerUpScore}`}</div>}
            {ev.status==='ongoing'&&<div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:C.green,animation:'dot 1.2s ease-in-out infinite'}}/>
              <span style={{fontSize:11,fontWeight:600,color:C.green}}>In Progress</span>
            </div>}
            {ev.status==='upcoming'&&<div style={{fontSize:11,color:C.blue,fontWeight:500,display:'flex',alignItems:'center',gap:5}}><I n="clk" s={12} c={C.blue}/>Scheduled</div>}
            {ev.reward&&<div style={{marginTop:8,fontSize:11,color:C.text4}}>Reward: {ev.reward}</div>}
          </div>
        </div>;
      })}
    </div>

    {/* Detail Modal */}
    {showDetail&&<EventDetailModal ev={showDetail} user={user} state={state} dispatch={dispatch} toast={toast} isSA={isSA} canAdmin={canAdmin} onClose={()=>sShowDetail(null)} onEdit={()=>{sEditEv(showDetail);sShowDetail(null);sShowAdd(true);}}/>}

    {/* Add/Edit Modal */}
    {showAdd&&<EventFormModal ev={editEv} cats={cats} isSA={isSA} user={user} state={state} dispatch={dispatch} toast={toast} onClose={()=>{sShowAdd(false);sEditEv(null);}}/>}
  </div>;
}

function EventDetailModal({ev,user,state,dispatch,toast,isSA,canAdmin,onClose,onEdit}){
  const cat=(state.eventCategories||[]).find(c=>c.id===ev.category)||{name:ev.category};
  const hc=HOUSES[ev.winnerHouse]||null;
  const icon=getSportIcon(ev.sport,ev.title);
  const isInterHouse=ev.category==='inter_house';
  const [awarding,sAwarding]=useState(false);
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:C.white,borderRadius:16,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,.25)',animation:'fadeUp .2s'}}>
      {/* Header */}
      <div style={{background:hc?hc.grad:'linear-gradient(135deg,#1E293B,#334155)',padding:'20px',borderRadius:'16px 16px 0 0',position:'relative'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
          <div style={{width:52,height:52,borderRadius:12,overflow:'hidden',background:'rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <div style={{width:44,height:44}}>{icon}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800,color:'#fff',letterSpacing:'-0.3px'}}>{ev.title}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.65)',marginTop:4}}>{ev.date} · {cat.name}</div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.1)',border:'none',borderRadius:8,padding:6,cursor:'pointer',color:'#fff',display:'flex',flexShrink:0}}>
            <I n="xx" s={14} c="#fff"/>
          </button>
        </div>
      </div>

      <div style={{padding:'20px'}}>
        {/* Description */}
        {ev.description&&<div style={{background:C.bg,borderRadius:8,padding:'10px 12px',marginBottom:16,fontSize:12,color:C.text2,lineHeight:1.6}}>{ev.description}</div>}

        {/* Results */}
        {(ev.winner||ev.runnerUp)&&<div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.text4,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Results</div>
          {ev.winner&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:C.greenL,border:`1px solid ${C.greenB}`,borderRadius:8,marginBottom:6}}>
            <span style={{fontSize:18}}>🏆</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:C.green}}>Winner: {ev.winner}</div>
              {ev.winnerScore&&<div style={{fontSize:11,color:C.green,opacity:.8}}>Score: {ev.winnerScore}</div>}
            </div>
          </div>}
          {ev.runnerUp&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:C.bg,border:`1px solid ${C.border}`,borderRadius:8}}>
            <span style={{fontSize:18}}>🥈</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>Runner-up: {ev.runnerUp}</div>
              {ev.runnerUpScore&&<div style={{fontSize:11,color:C.text3}}>Score: {ev.runnerUpScore}</div>}
            </div>
          </div>}
        </div>}

        {/* Reward */}
        {ev.reward&&ev.reward!=='none'&&<div style={{marginBottom:16,display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:C.yelL,border:`1px solid ${C.yelB}`,borderRadius:8}}>
          <span style={{fontSize:16}}>🎖️</span>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.yel}}>Reward</div>
            <div style={{fontSize:12,color:C.yel,textTransform:'capitalize'}}>{ev.reward?.replace(/\+/g,' + ')}</div>
          </div>
        </div>}

        {/* Inter house points */}
        {isInterHouse&&ev.winner&&ev.pointsAwarded>0&&<div style={{marginBottom:16,padding:'10px 12px',background:C.purL,border:'1px solid #DDD6FE',borderRadius:8}}>
          <div style={{fontSize:11,fontWeight:700,color:C.pur}}>Points Awarded</div>
          <div style={{fontSize:12,color:C.pur,marginTop:2}}>+{ev.pointsAwarded} pts to all {ev.winner} house members</div>
          {isSA&&!awarding&&<button onClick={()=>{dispatch({type:'AWARD_EVENT_POINTS',house:ev.winnerHouse,pts:ev.pointsAwarded,eventTitle:ev.title,by:user.name});toast(`+${ev.pointsAwarded} pts awarded to ${ev.winner} house!`,'success');sAwarding(true);}} style={{marginTop:8,padding:'5px 12px',background:C.pur,color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>Award Points Now</button>}
          {awarding&&<div style={{fontSize:11,color:C.green,marginTop:6,fontWeight:600}}>✓ Points awarded</div>}
        </div>}

        {/* Actions */}
        {canAdmin&&<div style={{display:'flex',gap:8,marginTop:16}}>
          <button onClick={onEdit} style={{flex:1,padding:'9px',background:C.blueL,color:C.blue,border:`1px solid ${C.blueB}`,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
            <I n="edit" s={13} c={C.blue}/>Edit Event
          </button>
        </div>}
      </div>
    </div>
  </div>;
}

function EventFormModal({ev,cats,isSA,user,state,dispatch,toast,onClose}){
  const isEdit=!!ev;
  const [f,sF]=useState({
    title:ev?.title||'',sport:ev?.sport||'sports',category:ev?.category||'inter_house',
    status:ev?.status||'upcoming',date:ev?.date||'',description:ev?.description||'',
    winner:ev?.winner||'',winnerScore:ev?.winnerScore||'',
    runnerUp:ev?.runnerUp||'',runnerUpScore:ev?.runnerUpScore||'',
    winnerHouse:ev?.winnerHouse||'',reward:ev?.reward||'none',pointsAwarded:ev?.pointsAwarded||20,
  });
  const inp={width:'100%',padding:'9px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,outline:'none',background:C.white};
  const isInterHouse=f.category==='inter_house';
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <div style={{background:C.white,borderRadius:14,width:'100%',maxWidth:500,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,.2)',animation:'fadeUp .2s'}}>
      <div style={{padding:'18px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:14,fontWeight:700,color:C.text}}>{isEdit?'Edit Event':'Add Event'}</div>
        <button onClick={onClose} style={{background:C.border2,border:'none',borderRadius:7,padding:6,cursor:'pointer',display:'flex'}}><I n="xx" s={13} c={C.text3}/></button>
      </div>
      <div style={{padding:'18px 20px',display:'flex',flexDirection:'column',gap:12}}>
        <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Event Title *</label><input value={f.title} onChange={e=>sF(v=>({...v,title:e.target.value}))} placeholder="e.g. Inter House Chess Championship" style={inp}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Sport / Type *</label>
            <input value={f.sport} onChange={e=>sF(v=>({...v,sport:e.target.value}))} placeholder="chess, cricket, debate..." style={inp}/>
          </div>
          <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Date *</label><input type="date" value={f.date} onChange={e=>sF(v=>({...v,date:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Category</label>
            <select value={f.category} onChange={e=>sF(v=>({...v,category:e.target.value}))} style={{...inp,background:C.white}}>
              {cats.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Status</label>
            <select value={f.status} onChange={e=>sF(v=>({...v,status:e.target.value}))} style={inp}>
              <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="past">Past</option>
            </select>
          </div>
        </div>
        <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Description</label>
          <textarea value={f.description} onChange={e=>sF(v=>({...v,description:e.target.value}))} placeholder="Brief description..." style={{...inp,minHeight:60,resize:'vertical',lineHeight:1.5}}/>
        </div>
        {(f.status==='past'||f.status==='ongoing')&&<>
          <div style={{height:1,background:C.border}}/>
          <div style={{fontSize:11,fontWeight:700,color:C.text4,textTransform:'uppercase',letterSpacing:'.04em'}}>Results</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Winner</label>
              {isInterHouse?<select value={f.winnerHouse} onChange={e=>sF(v=>({...v,winnerHouse:e.target.value,winner:e.target.value}))} style={inp}>
                <option value="">Select house</option>
                {Object.keys(HOUSES).filter(h=>h!=='default').map(h=><option key={h} value={h}>{h}</option>)}
              </select>:<input value={f.winner} onChange={e=>sF(v=>({...v,winner:e.target.value}))} placeholder="Winner name/team" style={inp}/>}
            </div>
            <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Score / Margin</label><input value={f.winnerScore} onChange={e=>sF(v=>({...v,winnerScore:e.target.value}))} placeholder="e.g. 12-8 pts" style={inp}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Runner-up</label>
              {isInterHouse?<select value={f.runnerUp} onChange={e=>sF(v=>({...v,runnerUp:e.target.value}))} style={inp}>
                <option value="">Select house</option>
                {Object.keys(HOUSES).filter(h=>h!=='default').map(h=><option key={h} value={h}>{h}</option>)}
              </select>:<input value={f.runnerUp} onChange={e=>sF(v=>({...v,runnerUp:e.target.value}))} placeholder="Runner-up" style={inp}/>}
            </div>
            <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Runner-up Score</label><input value={f.runnerUpScore} onChange={e=>sF(v=>({...v,runnerUpScore:e.target.value}))} placeholder="e.g. 8 pts" style={inp}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Reward</label>
              <select value={f.reward} onChange={e=>sF(v=>({...v,reward:e.target.value}))} style={inp}>
                {['certificate','certificate+medal','certificate+trophy','certificate+medal+trophy','points only','none'].map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {isInterHouse&&<div><label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Points to Award</label>
              <input type="number" value={f.pointsAwarded} onChange={e=>sF(v=>({...v,pointsAwarded:parseInt(e.target.value)||0}))} min="0" max="200" style={inp}/>
            </div>}
          </div>
        </>}
        <div style={{display:'flex',gap:8,marginTop:6}}>
          <button onClick={()=>{
            if(!f.title.trim()||!f.date){toast('Fill title and date.','error');return;}
            if(isEdit){dispatch({type:'EDIT_EVENT',id:ev.id,v:f,by:user.name});toast('Event updated!','success');}
            else{dispatch({type:'ADD_EVENT',v:f,by:user.name});toast('Event added!','success');}
            onClose();
          }} style={{flex:1,padding:'10px',background:C.text,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
            {isEdit?'Save Changes':'Add Event'}
          </button>
          {isEdit&&<button onClick={()=>{if(window.confirm('Delete this event?')){dispatch({type:'DEL_EVENT',id:ev.id});toast('Deleted.','success');onClose();}}} style={{padding:'10px 14px',background:C.redL,color:C.red,border:`1px solid ${C.redB}`,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}><I n="trash" s={13} c={C.red}/></button>}
          <button onClick={onClose} style={{flex:1,padding:'10px',background:C.border2,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
        </div>
      </div>
    </div>
  </div>;
}

/* ══ DATABASE CONFIG PAGE (SA only) ══ */
/* ══ SUPABASE CLIENT INIT ══
   Credentials are set via environment variables.
   In production, configure your hosting environment:
     VITE_SUPABASE_URL  = your Supabase project URL
     VITE_SUPABASE_ANON_KEY = your Supabase anon key
   The UI does NOT expose or store any credentials.
*/
// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ══ BADGES MANAGEMENT (SA only) ══ */
function BadgesPage({user,state,dispatch,toast}){
  const [showAdd,sShowAdd]=useState(false);
  const [editId,sEditId]=useState(null);
  const badges=state.badges||BADGES;
  const [f,sF]=useState({name:'',pts:10,color:'#16A34A',trigger:'',auto:false});

  const resetForm=()=>sF({name:'',pts:10,color:'#16A34A',trigger:'',auto:false});

  const COLORS=[
    {c:'#16A34A',l:'Green'},  {c:'#2563EB',l:'Blue'},
    {c:'#D97706',l:'Amber'},  {c:'#7C3AED',l:'Purple'},
    {c:'#DC2626',l:'Red'},    {c:'#0891B2',l:'Cyan'},
  ];

  const inp={width:'100%',padding:'9px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,outline:'none',background:C.white};

  return <div style={{padding:'18px 22px',maxWidth:800,animation:'fadeUp .2s'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
      <div style={{fontSize:11,color:C.text3}}>{badges.length} achievement badges · Super Admin can add, edit, delete</div>
      <button onClick={()=>{resetForm();sShowAdd(true);}} style={{padding:'7px 13px',background:C.green,color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
        <I n="plus" s={13} c="#fff"/>New Badge
      </button>
    </div>

    {/* Badges grid */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10,marginBottom:16}}>
      {badges.map(b=>(
        <div key={b.id} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:16,position:'relative',transition:'box-shadow .15s'}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'}
          onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
          {/* Top row */}
          <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:10}}>
            <div style={{width:40,height:40,borderRadius:10,background:b.color+'18',border:`1px solid ${b.color}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <I n={b.id==='flash'?'sun':b.id==='logmaster'?'cal':b.id==='unstoppable'?'trophy':b.id==='turnaround'?'hist':b.id==='weekend'?'sun':b.id==='bulletproof'?'shield':b.id==='task'?'chk':b.id==='victory'?'trophy':b.id==='unsung'?'crown':'star'} s={20} c={b.color} w={2}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text,letterSpacing:'-0.2px'}}>{b.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3}}>
                <Tag ch={`+${b.pts} pts`} c={b.color} bg={b.color+'12'} b={b.color+'30'}/>
                <Tag ch={b.auto?'Auto':'Manual'} c={b.auto?C.green:C.pur} bg={b.auto?C.greenL:C.purL} b={b.auto?C.greenB:'#DDD6FE'}/>
              </div>
            </div>
          </div>
          {/* Trigger */}
          <div style={{fontSize:11,color:C.text3,lineHeight:1.5,marginBottom:12,padding:'8px 10px',background:C.bg,borderRadius:6,border:`1px solid ${C.border2}`}}>
            <span style={{fontSize:10,fontWeight:700,color:C.text4,textTransform:'uppercase',letterSpacing:'.04em'}}>Trigger: </span>
            {b.trigger||'—'}
          </div>
          {/* Actions */}
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>{sF({name:b.name,pts:b.pts,color:b.color,trigger:b.trigger,auto:b.auto});sEditId(b.id);sShowAdd(true);}}
              style={{flex:1,padding:'6px',background:C.blueL,color:C.blue,border:`1px solid ${C.blueB}`,borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
              <I n="edit" s={12} c={C.blue}/>Edit
            </button>
            <button onClick={()=>{if(window.confirm(`Delete "${b.name}"?`)){dispatch({type:'DEL_BADGE',id:b.id,by:user.name});toast(`Badge deleted.`,'success');}}}
              style={{padding:'6px 10px',background:C.redL,color:C.red,border:`1px solid ${C.redB}`,borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}>
              <I n="trash" s={12} c={C.red}/>
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Add/Edit modal */}
    {showAdd&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.white,borderRadius:14,padding:24,width:'100%',maxWidth:460,boxShadow:'0 24px 60px rgba(0,0,0,.2)',animation:'fadeUp .2s'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>{editId?'Edit Badge':'New Badge'}</div>
          <button onClick={()=>{sShowAdd(false);sEditId(null);resetForm();}} style={{background:C.border2,border:'none',borderRadius:7,padding:6,cursor:'pointer',display:'flex'}}><I n="xx" s={13} c={C.text3}/></button>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Badge Name *</label>
            <input value={f.name} onChange={e=>sF(v=>({...v,name:e.target.value}))} placeholder="e.g. Perfect Week" style={inp}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Points *</label>
            <input type="number" value={f.pts} onChange={e=>sF(v=>({...v,pts:parseInt(e.target.value)||0}))} min="1" max="500" style={inp}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>Trigger Condition *</label>
            <textarea value={f.trigger} onChange={e=>sF(v=>({...v,trigger:e.target.value}))} placeholder="Describe when this badge is awarded..." style={{...inp,minHeight:64,resize:'vertical',lineHeight:1.5}}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:8}}>Color</label>
            <div style={{display:'flex',gap:8}}>
              {COLORS.map(col=>(
                <button key={col.c} onClick={()=>sF(v=>({...v,color:col.c}))} title={col.l} style={{
                  width:28,height:28,borderRadius:7,background:col.c,border:`2px solid ${f.color===col.c?C.text:'transparent'}`,
                  cursor:'pointer',transition:'transform .12s',transform:f.color===col.c?'scale(1.15)':'scale(1)',
                }}/>
              ))}
            </div>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:8}}>Award Type</label>
            <div style={{display:'flex',gap:8}}>
              {[{v:true,l:'Auto (system awards)'},{v:false,l:'Manual (teacher approves)'}].map(opt=>(
                <button key={String(opt.v)} onClick={()=>sF(v=>({...v,auto:opt.v}))} style={{
                  flex:1,padding:'8px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
                  border:`1px solid ${f.auto===opt.v?C.green:C.border}`,
                  background:f.auto===opt.v?C.greenL:C.white,
                  color:f.auto===opt.v?C.green:C.text3,transition:'all .12s',
                }}>{opt.l}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:'flex',gap:8,marginTop:18}}>
          <button onClick={()=>{
            if(!f.name.trim()||!f.trigger.trim()){toast('Fill name and trigger.','error');return;}
            if(editId){
              dispatch({type:'EDIT_BADGE',id:editId,v:f,by:user.name});
              toast('Badge updated!','success');
            } else {
              dispatch({type:'ADD_BADGE',v:f,by:user.name});
              toast('Badge added!','success');
            }
            sShowAdd(false);sEditId(null);resetForm();
          }} style={{flex:1,padding:'10px',background:C.text,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
            {editId?'Save Changes':'Add Badge'}
          </button>
          <button onClick={()=>{sShowAdd(false);sEditId(null);resetForm();}} style={{flex:1,padding:'10px',background:C.border2,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
        </div>
      </div>
    </div>}
  </div>;
}

/* ══ SETTINGS ══ */

/* Sec component OUTSIDE Settings — prevents re-mount on every keystroke */
const Sec = React.memo(function Sec({title,sub,children}){
  return <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:18,marginBottom:12}}>
    <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:sub?3:10}}>{title}</div>
    {sub&&<div style={{fontSize:11,color:C.text3,marginBottom:10}}>{sub}</div>}
    {!sub&&<div style={{height:1,background:C.border,marginBottom:12}}/>}
    {children}
  </div>;
});

/* Holiday form as separate component — prevents keyboard jump */
const HolidayForm = React.memo(function HolidayForm({state,dispatch,toast,user}){
  const [hDate,sHDate]=useState('');
  const [hType,sHType]=useState('Holiday');
  const [hName,sHName]=useState('');
  const [hMsg,sHMsg]=useState('');
  const [hEndDate,sHEndDate]=useState('');
  const inp={width:'100%',padding:'9px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,outline:'none',background:C.white};

  const handleSave=()=>{
    if(!hDate||!hName){toast('Fill date and name.','error');return;}
    dispatch({type:'ADD_HOL',v:{date:hDate,endDate:hEndDate,type:hType,name:hName,msg:hMsg,by:user.name,at:tsNow()}});
    dispatch({type:'SET_HOL',active:true,title:hName,msg:hMsg,holType:hType});
    toast('Holiday saved!','success');
    sHDate('');sHName('');sHMsg('');sHType('Holiday');sHEndDate('');
  };

  return <div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
      <div>
        <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Date *</label>
        <input type="date" value={hDate} onChange={e=>sHDate(e.target.value)} style={inp}/>
      </div>
      <div>
        <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Type</label>
        <select value={hType} onChange={e=>sHType(e.target.value)} style={{...inp}}>
          <option>Holiday</option><option>Festival</option><option>Half Day</option><option>Emergency</option><option>Event</option>
        </select>
      </div>
    </div>
    <div style={{marginBottom:10}}>
      <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Holiday Name *</label>
      <input value={hName} onChange={e=>sHName(e.target.value)} placeholder="e.g. Bad Weather Holiday" style={inp}/>
    </div>
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Message for Badge Holders</label>
      <input value={hMsg} onChange={e=>sHMsg(e.target.value)} placeholder="e.g. School closed due to bad weather" style={inp}/>
    </div>
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:11,fontWeight:600,color:C.text2,marginBottom:5}}>End Date <span style={{fontSize:10,color:C.text4}}>(banner auto-hides after)</span></label>
      <input type="date" value={hEndDate||''} onChange={e=>sHEndDate(e.target.value)} style={inp}/>
    </div>
    <div style={{display:'flex',gap:8,marginBottom:state.holidays?.length>0?14:0}}>
      <button onClick={handleSave} style={{padding:'9px 14px',background:C.text,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Save</button>
      <button onClick={()=>{sHDate('');sHName('');sHMsg('');sHType('Holiday');}} style={{padding:'9px 14px',background:C.border2,color:C.text,border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Cancel</button>
    </div>
    {state.holidays?.length>0&&<div>
      {state.holidays.map((h,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderTop:`1px solid ${C.border2}`}}>
        <Tag ch={h.type} c={h.type==='Emergency'?C.red:h.type==='Festival'?C.yel:C.blue} bg={h.type==='Emergency'?C.redL:h.type==='Festival'?C.yelL:C.blueL} b={h.type==='Emergency'?C.redB:h.type==='Festival'?C.yelB:C.blueB}/>
        <span style={{fontSize:12,fontWeight:600,color:C.text,flex:1}}>{h.name}</span>
        <span style={{fontSize:11,color:C.text4}}>{h.date}</span>
        <button onClick={()=>{dispatch({type:'DEL_HOL',i});toast('Removed.','success');}} style={{background:'none',border:'none',cursor:'pointer',color:C.text4,display:'flex',padding:3}}><I n="trash" s={11} c={C.text4}/></button>
      </div>)}
    </div>}
  </div>;
});

function Settings({user,state,dispatch,toast}){
  const isSA=user.role==='super_admin';
  const [aName,sAName]=useState(state.appName);
  const [ws,sWs]=useState(state.attWindow.start);
  const [we,sWe]=useState(state.attWindow.end);
  const [lbc,sLbc]=useState(state.lbCount);
  const [myPw,sMyPw]=useState('');
  const [myPwC,sMyPwC]=useState('');
  const inp={width:'100%',padding:'9px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text,outline:'none',background:C.white};

  return <div style={{padding:'18px 22px',maxWidth:620,animation:'fadeUp .2s'}}>

    {/* My Account */}
    <Sec title="My Account" sub="Change your password">
      <div style={{marginBottom:10}}>
        <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Current ID</label>
        <div style={{padding:'9px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.text4,background:C.border2,fontFamily:'monospace'}}>{user.id}</div>
      </div>
      <div style={{marginBottom:10}}>
        <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>New Password</label>
        <input type="password" value={myPw} onChange={e=>sMyPw(e.target.value)} placeholder="New password" style={inp}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:'block',fontSize:11,fontWeight:500,color:C.text2,marginBottom:5}}>Confirm Password</label>
        <input type="password" value={myPwC} onChange={e=>sMyPwC(e.target.value)} placeholder="Confirm new password" style={inp}/>
      </div>
      <button onClick={()=>{
        if(!myPw){toast('Enter new password.','error');return;}
        if(myPw!==myPwC){toast('Passwords do not match.','error');return;}
        dispatch({type:'EDIT_USER',id:user.id,v:{pw:myPw},by:user.name});
        toast('Password updated!','success');
        sMyPw('');sMyPwC('');
      }} style={{padding:'8px 16px',background:C.text,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Save Changes</button>
    </Sec>

    {/* Attendance Window */}
    <Sec title="Attendance Window" sub="Time window for badge holders to mark attendance">
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        <input type="time" value={ws} onChange={e=>sWs(e.target.value)} style={{...inp,width:'auto',fontFamily:'monospace'}}/>
        <span style={{color:C.text3,fontSize:12}}>to</span>
        <input type="time" value={we} onChange={e=>sWe(e.target.value)} style={{...inp,width:'auto',fontFamily:'monospace'}}/>
        <button onClick={()=>{dispatch({type:'SET_WIN',v:{start:ws,end:we}});toast('Window updated.','success');}} style={{padding:'9px 14px',background:C.text,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Save</button>
      </div>
    </Sec>

    {/* Holiday Management — separate component = no keyboard jump */}
    <Sec title="Holiday & Festival Management" sub="Declare holidays, festivals, emergency closures">
      <HolidayForm state={state} dispatch={dispatch} toast={toast} user={user}/>
    </Sec>

    {/* SA-only settings */}
    {isSA&&<>
      <Sec title="App Name" sub="Name shown across the app">
        <div style={{display:'flex',gap:8}}>
          <input value={aName} onChange={e=>sAName(e.target.value)} style={{...inp,flex:1}}/>
          <button onClick={()=>{dispatch({type:'SET_NAME',v:aName,by:user.name});toast('Updated.','success');}} style={{padding:'9px 14px',background:C.text,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Save</button>
        </div>
      </Sec>

      <Sec title="Leaderboard Display" sub="Number of top holders shown">
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {[6,9,12].map(n=><button key={n} onClick={()=>sLbc(n)} style={{padding:'7px 14px',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',border:`1px solid ${lbc===n?C.text:C.border}`,background:lbc===n?C.text:'#fff',color:lbc===n?'#fff':C.text3,transition:'all .12s'}}>Top {n}</button>)}
          <button onClick={()=>{dispatch({type:'SET_LB',v:lbc});toast(`Set to top ${lbc}.`,'success');}} style={{padding:'9px 14px',background:C.text,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Save</button>
        </div>
      </Sec>

      <Sec title="Badge Algorithm Rules" sub="Points formula — Super Admin only">
        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:12,fontFamily:'monospace',fontSize:11,color:C.text3,lineHeight:2,marginBottom:10}}>
          Base = (Days_Present × 5) + (Tasks × 20)<br/>
          Flash +15 · Log Master +50 · Unstoppable +100<br/>
          Turnaround +25 · Weekend +30 · Bulletproof +60<br/>
          Task/Victory/Ground +20 · Crown +150<br/>
          Penalty: Mismatch −50 + streak reset + 3d lock
        </div>
        <button onClick={()=>toast('Algorithm editor — coming soon!','info')} style={{padding:'8px 14px',background:C.blueL,color:C.blue,border:`1px solid ${C.blueB}`,borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Edit Rules →</button>
      </Sec>

      {state.auditLog?.length>0&&<Sec title="Audit Log" sub="All changes — Super Admin eyes only">
        <div style={{maxHeight:180,overflowY:'auto'}}>
          {[...state.auditLog].reverse().map((l,i)=><div key={i} style={{display:'flex',gap:10,padding:'5px 0',borderBottom:`1px solid ${C.border2}`,fontSize:11,color:C.text3}}>
            <span style={{fontFamily:'monospace',flexShrink:0,color:C.text4,fontSize:10}}>{l.ts}</span>
            <span style={{flex:1}}>{l.msg}</span>
            <span style={{color:C.blue,flexShrink:0}}>{l.by}</span>
          </div>)}
        </div>
      </Sec>}
    </>}
  </div>;
}

/* ══ ROOT ══ */
function App(){
  const [phase,sPhase]=useState('loading');
  const [user,sUser]=useState(null);
  const [page,sPage]=useState('dashboard');
  const [state,dispatch]=useReducer(reducer,INIT);
  const [toasts,sToasts]=useState([]);
  const toast=useCallback((msg,type='info')=>{const id=Date.now();sToasts(t=>[...t,{id,msg,type}]);setTimeout(()=>sToasts(t=>t.filter(x=>x.id!==id)),3000);},[]);
  const nav=useCallback(p=>sPage(p),[]);
  useEffect(()=>{const t=setTimeout(()=>sPhase('login'),2600);return()=>clearTimeout(t);},[]);
  const login=useCallback(u=>{sUser(u);sPage('dashboard');sPhase('app');},[]);
  const logout=useCallback(()=>{sUser(null);sPage('dashboard');sPhase('login');},[]);
  const META={dashboard:{l:'Dashboard',i:'grid'},notices:{l:'Notices',i:'bell'},events:{l:'Events',i:'star'},badges:{l:'Badges',i:'medal'},duty:{l:'Duty Points',i:'shield'},pastdays:{l:'Past Days',i:'hist'},attendance:{l:'Attendance',i:'cal'},leaderboard:{l:'Top Holders',i:'bar'},report:{l:'Monthly Report',i:'doc'},members:{l:'Badge Holders',i:'users'},admins:{l:'Admins',i:'admins'},settings:{l:'Settings',i:'gear'}};
  const m=META[page]||META.dashboard;
  if(phase==='loading')return<Loading name={state.appName}/>;
  if(phase==='login')  return<Login name={state.appName} onLogin={login}/>;
  return <div style={{display:'flex',minHeight:'100vh',background:C.bg,fontFamily:"'Inter',sans-serif"}}>
    <Sidebar user={user?{...user,...(state.users[user.id]||{})}:user} appName={state.appName} page={page} onNav={sPage} onLogout={logout}/>
    <div style={{marginLeft:200,flex:1,display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      {(()=>{const lu=user?{...user,...(state.users[user.id]||{})}:user; return <PH icon={m.i} title={m.l} right={page==='dashboard'&&lu.role==='super_admin'?<Tag ch={<><I n="shield" s={11} c="#F59E0B"/> Super Admin</>} c="#F59E0B" bg="rgba(245,158,11,.08)" b="rgba(245,158,11,.2)"/>:page==='dashboard'&&lu.role==='teacher_admin'?<Tag ch={<><I n="key" s={11} c="#60A5FA"/> Admin</>} c="#60A5FA" bg="rgba(96,165,250,.08)" b="rgba(96,165,250,.2)"/>:null}/>; })()}
      {/* liveUser — always sync sa/pts/wallet from state so special access reflects instantly */}
      {(()=>{
        const liveUser = user ? {...user,...(state.users[user.id]||{})} : user;
        return <>
          {page==='dashboard'  &&<Dashboard   user={liveUser} state={state} dispatch={dispatch} toast={toast} nav={nav}/>}
          {page==='pastdays'   &&<PastDays    user={liveUser} state={state}/>}
          {page==='attendance' &&<Attendance  user={liveUser} state={state} dispatch={dispatch} toast={toast}/>}
          {page==='leaderboard'&&<Leaderboard user={liveUser} state={state}/>}
          {page==='report'     &&<MonthlyReport user={liveUser} state={state}/>}
          {page==='members'    &&<Members     user={liveUser} state={state} dispatch={dispatch} toast={toast}/>}
          {page==='notices'   &&<NoticePage   user={liveUser} state={state} dispatch={dispatch} toast={toast}/>}
          {page==='events'    &&['super_admin','teacher_admin'].includes(liveUser.role)&&<EventsPage   user={liveUser} state={state} dispatch={dispatch} toast={toast}/>}
          {page==='duty'      &&['super_admin','teacher_admin'].includes(liveUser.role)&&<DutyPage     user={liveUser} state={state} dispatch={dispatch} toast={toast}/>}
          {page==='badges'    &&liveUser.role==='super_admin'&&<BadgesPage    user={liveUser} state={state} dispatch={dispatch} toast={toast}/>}
          {/* DatabasePage removed — Supabase config handled via env vars, not UI */}
          {page==='admins'     &&['super_admin','teacher_admin'].includes(liveUser.role)&&<AdminsPage user={liveUser} state={state} dispatch={dispatch} toast={toast}/>}
          {page==='settings'   &&['super_admin','teacher_admin'].includes(liveUser.role)&&<Settings user={liveUser} state={state} dispatch={dispatch} toast={toast}/>}
        </>;
      })()}
    </div>
    <Toasts list={toasts}/>
    <style>{`*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}@keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes dot{0%,80%,100%{opacity:.2;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes toast{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#D1D1D6;border-radius:2px}input[type=date],input[type=time],select{background:#fff}`}</style>
  </div>;
}
export default App;