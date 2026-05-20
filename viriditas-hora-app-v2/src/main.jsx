import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
const DAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

const PLANETS = {
  Sun: { glyph:'☉', title:'Radiance', tone:'visibility, courage, life force', feeling:'You are being invited to be seen without forcing attention.', herb:'rosemary', candle:'gold', psalm:'Psalm 27', crystal:'citrine', oil:'frankincense', avoid:'performing for approval', action:'Choose one brave visible action.', color:'sun' },
  Moon: { glyph:'☾', title:'Inner Tide', tone:'emotion, intuition, memory', feeling:'Your body is speaking before your mind can explain it.', herb:'mugwort', candle:'white', psalm:'Psalm 4', crystal:'moonstone', oil:'jasmine', avoid:'absorbing everyone else', action:'Name the feeling without judging it.', color:'moon' },
  Mars: { glyph:'♂', title:'Sacred Fire', tone:'boundaries, courage, protection', feeling:'Heat is rising so you can protect what matters.', herb:'cayenne', candle:'red', psalm:'Psalm 35', crystal:'red jasper', oil:'ginger', avoid:'speaking while boiling', action:'State one boundary calmly.', color:'mars' },
  Mercury: { glyph:'☿', title:'Clear Signal', tone:'messages, decisions, speech', feeling:'Your words are keys today. Use them with precision.', herb:'peppermint', candle:'yellow', psalm:'Psalm 141', crystal:'clear quartz', oil:'lemongrass', avoid:'gossip and mental clutter', action:'Write the message before sending it.', color:'mercury' },
  Jupiter: { glyph:'♃', title:'Open Door', tone:'favor, wisdom, expansion', feeling:'Increase is available, but wisdom must hold it.', herb:'cinnamon', candle:'purple', psalm:'Psalm 65', crystal:'amethyst', oil:'orange', avoid:'overpromising', action:'Ask clearly for the door you are ready to walk through.', color:'jupiter' },
  Venus: { glyph:'♀', title:'Soft Power', tone:'love, beauty, attraction', feeling:'Soften without abandoning yourself.', herb:'rose', candle:'pink or green', psalm:'Psalm 45', crystal:'rose quartz', oil:'lavender', avoid:'people pleasing', action:'Speak one kind truth over yourself.', color:'venus' },
  Saturn: { glyph:'♄', title:'Holy Boundary', tone:'structure, endings, discipline', feeling:'What feels heavy may be asking for structure, not fear.', herb:'comfrey', candle:'black or dark blue', psalm:'Psalm 91', crystal:'black tourmaline', oil:'cedarwood', avoid:'self-punishment', action:'Remove one thing draining your attention.', color:'saturn' }
};

const PHASES = [
  ['New Moon','quiet planting','Set one clear intention.'],
  ['Waxing Crescent','small growth','Take one visible step.'],
  ['First Quarter','decision pressure','Choose without delay.'],
  ['Waxing Gibbous','refinement','Prepare before revealing.'],
  ['Full Moon','revelation','Release what is loud but not aligned.'],
  ['Waning Gibbous','integration','Write what the cycle taught you.'],
  ['Last Quarter','cleansing','Cut one attachment.'],
  ['Waning Crescent','rest and repair','Lower the noise and protect peace.']
];

const FLOW = [
  ['Awareness','Notice what energy is ruling now.'],
  ['Understanding','Learn why it affects your mood, choices, and patterns.'],
  ['Healing','Restore balance with herbs, prayer, breath, and reflection.'],
  ['Protection','Stop absorbing what does not belong to you.'],
  ['Control','Choose your hour, action, and emotional response.'],
  ['Utilization','Use aligned energy to build, attract, bless, and create.']
];

function toRad(d){ return d * Math.PI / 180; }
function toDeg(r){ return r * 180 / Math.PI; }
function solarTime(date, lat, lon, sunrise=true){
  const start = new Date(date.getFullYear(),0,0);
  const N = Math.floor((date - start) / 86400000);
  const lngHour = lon / 15;
  const t = N + ((sunrise ? 6 : 18) - lngHour) / 24;
  const M = (0.9856 * t) - 3.289;
  let L = M + (1.916 * Math.sin(toRad(M))) + (0.020 * Math.sin(toRad(2*M))) + 282.634;
  L = (L + 360) % 360;
  let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))));
  RA = (RA + 360) % 360;
  const Lquadrant  = Math.floor(L/90) * 90;
  const RAquadrant = Math.floor(RA/90) * 90;
  RA = (RA + (Lquadrant - RAquadrant)) / 15;
  const sinDec = 0.39782 * Math.sin(toRad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  let cosH = (Math.cos(toRad(90.833)) - (sinDec * Math.sin(toRad(lat)))) / (cosDec * Math.cos(toRad(lat)));
  if (cosH > 1 || cosH < -1) return sunrise ? new Date(date.setHours(6,30,0,0)) : new Date(date.setHours(18,30,0,0));
  let H = sunrise ? 360 - toDeg(Math.acos(cosH)) : toDeg(Math.acos(cosH));
  H = H / 15;
  const T = H + RA - (0.06571 * t) - 6.622;
  let UT = (T - lngHour + 24) % 24;
  const result = new Date(date);
  result.setUTCHours(Math.floor(UT), Math.round((UT % 1)*60), 0, 0);
  return result;
}

function horaInfo(location){
  const now = new Date();
  const lat = location?.lat ?? 29.7604;
  const lon = location?.lon ?? -95.3698;
  const sunrise = solarTime(new Date(now), lat, lon, true);
  const sunset = solarTime(new Date(now), lat, lon, false);
  const tomorrowSunrise = solarTime(new Date(now.getFullYear(), now.getMonth(), now.getDate()+1), lat, lon, true);
  const dayRuler = DAY_RULERS[now.getDay()];
  const startIndex = ORDER.indexOf(dayRuler);
  const dayLength = (sunset - sunrise) / 12;
  const nightLength = (tomorrowSunrise - sunset) / 12;
  let hourIndex = 0, start=sunrise, end=new Date(+sunrise + dayLength);
  if(now >= sunrise && now < sunset){
    hourIndex = Math.min(11, Math.floor((now - sunrise)/dayLength));
    start = new Date(+sunrise + hourIndex*dayLength);
    end = new Date(+start + dayLength);
  } else {
    const nightStart = now < sunrise ? solarTime(new Date(now.getFullYear(), now.getMonth(), now.getDate()-1), lat, lon, false) : sunset;
    const nextSunrise = now < sunrise ? sunrise : tomorrowSunrise;
    const nl = (nextSunrise - nightStart)/12;
    const n = Math.min(11, Math.floor((now - nightStart)/nl));
    hourIndex = 12 + Math.max(0,n);
    start = new Date(+nightStart + Math.max(0,n)*nl);
    end = new Date(+start + nl);
  }
  const planet = ORDER[(startIndex + hourIndex) % ORDER.length];
  return { now, sunrise, sunset, hourIndex, start, end, planet };
}

function fmt(d){ return d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}); }

function Onboarding({setLocation}){
  const [city,setCity] = useState('');
  const [status,setStatus] = useState('');
  const useGps = () => {
    setStatus('Requesting location...');
    navigator.geolocation?.getCurrentPosition(pos => {
      setLocation({ label:'Current location', lat:pos.coords.latitude, lon:pos.coords.longitude });
      localStorage.setItem('vh_location', JSON.stringify({ label:'Current location', lat:pos.coords.latitude, lon:pos.coords.longitude }));
    }, () => setStatus('Location permission was not granted. You can type your city instead.'));
  };
  const saveCity = () => {
    const loc = { label: city || 'Houston, TX', lat:29.7604, lon:-95.3698, manual:true };
    setLocation(loc); localStorage.setItem('vh_location', JSON.stringify(loc));
  };
  return <div className="onboarding">
    <div className="orb intro">✦</div>
    <p className="eyebrow">Begin with place</p>
    <h1>Where is your energy moving from?</h1>
    <p className="soft">Viriditas Hora uses your location to calculate the living hours from sunrise to sunset. This makes the guidance feel like an app, not a generic website.</p>
    <button className="primary" onClick={useGps}>Use my current location</button>
    <div className="divider"><span>or</span></div>
    <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Enter city, state or country" />
    <button className="ghost" onClick={saveCity}>Continue with typed location</button>
    <small>{status || 'You can change this later in Profile.'}</small>
  </div>;
}

function Home({tier, location}){
  const h = useMemo(()=>horaInfo(location),[location]);
  const p = PLANETS[h.planet];
  const phase = PHASES[new Date().getDate()%PHASES.length];
  const [open,setOpen]=useState(null);
  return <main className="screen home">
    <section className={`hero ${p.color}`}>
      <p className="eyebrow">Current Hora · {location?.label || 'Set location'}</p>
      <div className="planet-orb"><span>{p.glyph}</span></div>
      <h1>{p.title}</h1>
      <p className="planet-name">{h.planet} Hour</p>
      <p className="guidance">{p.feeling}</p>
      <div className="time-row"><span>{fmt(h.start)}</span><i></i><span>{fmt(h.end)}</span></div>
    </section>
    <section className="one-card">
      <p className="eyebrow">Do this now</p>
      <h2>{p.action}</h2>
      <div className="mini-grid">
        <div><b>{p.psalm}</b><span>Psalm</span></div>
        <div><b>{p.herb}</b><span>Herb</span></div>
        <div><b>{p.candle}</b><span>Candle</span></div>
      </div>
    </section>
    <section className="moon-pill"><span>☾</span><div><b>{phase[0]}</b><p>{phase[1]} — {phase[2]}</p></div></section>
    <section className="accordions">
      {['Understand','Heal','Protect'].map((label,i)=><div className="acc" key={label} onClick={()=>setOpen(open===i?null:i)}><div><b>{label}</b><span>{i===0?p.tone:i===1?`Work with ${p.herb}, ${p.oil}, and ${p.crystal}.`:`Avoid ${p.avoid}.`}</span></div><em>{open===i?'−':'+'}</em>{open===i&&<p className="drop">{i===0?'This hour is not here to control you. It shows the current moving through the day so you can respond with awareness.':i===1?`Light a ${p.candle} candle, breathe slowly, and let ${p.psalm} anchor the practice.`:'Protect your attention first. Do not let this hour pull you into old patterns.'}</p>}</div>)}
    </section>
    {tier==='Free' && <section className="locked"><b>Seeker unlocks full 24-hour flow.</b><p>Herbs, oils, crystals, shadow prompts, notifications, and deeper guidance.</p></section>}
  </main>
}

function Flow(){ return <main className="screen"><p className="eyebrow">Energy Path</p><h1 className="page-title">The six movements</h1><div className="flow-list">{FLOW.map((f,i)=><article key={f[0]}><span>{String(i+1).padStart(2,'0')}</span><div><h2>{f[0]}</h2><p>{f[1]}</p></div></article>)}</div></main> }

function Journal({tier}){ const [mood,setMood]=useState(''); return <main className="screen"><p className="eyebrow">Journal</p><h1 className="page-title">What moved through you?</h1><div className="chips">{['anxious','drained','hopeful','angry','peaceful','inspired'].map(x=><button className={mood===x?'active':''} onClick={()=>setMood(x)}>{x}</button>)}</div><textarea placeholder={mood?`Where did ${mood} show up in your body today?`:'Write what you noticed today...'}></textarea>{tier!=='Initiate' && <section className="locked"><b>Initiate turns entries into patterns.</b><p>Monthly energy reports, repeated emotional cycles, and personal timing.</p></section>}</main> }

function Profile({tier,setTier,location,setLocation}){ return <main className="screen"><p className="eyebrow">Profile</p><h1 className="page-title">Your settings</h1><section className="one-card"><b>Location</b><p>{location?.label || 'Not set'}</p><button className="ghost" onClick={()=>{localStorage.removeItem('vh_location');setLocation(null)}}>Change location</button></section><section className="tiers">{['Free','Seeker','Initiate'].map(t=><button className={tier===t?'active':''} onClick={()=>setTier(t)}><b>{t}</b><span>{t==='Free'?'Awareness':t==='Seeker'?'Understanding + healing':'Protection + mastery'}</span></button>)}</section></main> }

function App(){
  const [location,setLocation]=useState(()=>{try{return JSON.parse(localStorage.getItem('vh_location'))}catch{return null}});
  const [tab,setTab]=useState('Home');
  const [tier,setTier]=useState('Free');
  if(!location) return <Onboarding setLocation={setLocation}/>;
  const tabs=[['Home','✦'],['Flow','⟡'],['Journal','☽'],['Profile','☉']];
  return <div className="app"><div className="top"><b>Viriditas Hora</b><span>{tier}</span></div>{tab==='Home'&&<Home tier={tier} location={location}/>} {tab==='Flow'&&<Flow/>} {tab==='Journal'&&<Journal tier={tier}/>} {tab==='Profile'&&<Profile tier={tier} setTier={setTier} location={location} setLocation={setLocation}/>}<nav className="bottom">{tabs.map(t=><button className={tab===t[0]?'active':''} onClick={()=>setTab(t[0])}><span>{t[1]}</span>{t[0]}</button>)}</nav></div>
}

createRoot(document.getElementById('root')).render(<App/>);
