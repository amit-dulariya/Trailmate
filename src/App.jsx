import { useState } from 'react';
import { Leaf, Menu, ArrowDown, Sun, Compass, Heart, ArrowRight, Check, LoaderCircle, AlertCircle, Sparkles } from 'lucide-react';
import ActivityCard from './components/ActivityCard.jsx';
import OptionPill from './components/OptionPill.jsx';
import PlanResults from './components/PlanResults.jsx';
import OutdoorMap from './components/OutdoorMap.jsx';
import { activities, timeOptions, skillOptions } from './data.js';

const interestOptions = [
  'Peace and mindfulness',
  'Fitness and movement',
  'Plants and gardening',
  'Birds and wildlife',
  'Photography',
  'Learning something new',
];

export default function App() {
  const [activity, setActivity] = useState('walking');
  const [time, setTime] = useState('30');
  const [skill, setSkill] = useState('beginner');
  const [interests, setInterests] = useState(['Peace and mindfulness']);
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  function toggleInterest(interest) {
    setInterests(current => current.includes(interest)
      ? current.filter(item => item !== interest)
      : [...current, interest]);
  }

  async function generatePlan(event) {
    event.preventDefault();
    setStatus('loading');
    setError('');
    setPlan(null);

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity,
          time,
          experienceLevel: skill,
          interests,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status}).`);
      }
      if (!data.plan) throw new Error('The server returned an empty plan. Please try again.');
      setPlan(data.plan);
      setStatus('success');
      window.setTimeout(() => document.getElementById('your-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.message || 'Something went wrong. Check that the backend and Ollama are running.');
      setStatus('error');
    }
  }

  function resetPlan() {
    setPlan(null);
    setStatus('idle');
    setError('');
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#" aria-label="TrailMate AI home"><span className="brand-mark"><Leaf size={20} /></span><span>trailmate<span className="brand-ai">.ai</span></span></a>
        <nav className="desktop-nav"><a href="#how-it-works">How it works</a><a href="#planner">Explore activities</a><a href="#your-plan">Your plan</a></nav>
        <a className="header-cta" href="#planner">Find your outside <ArrowRight size={15} /></a>
        <button className="mobile-menu" aria-label="Menu"><Menu size={22} /></button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="pill-label"><span className="live-dot"></span> YOUR LITTLE NUDGE TO GET OUTSIDE</div>
            <h1>Less scrolling.<br /><em>More soul</em> searching.</h1>
            <p className="hero-description">A little fresh air can change your whole day. Find an outdoor activity that fits your time, your energy, and your kind of adventure.</p>
            <div className="hero-actions"><a href="#planner" className="primary-button">Build my outdoor plan <ArrowRight size={17} /></a><span className="no-pressure"><Heart size={15} /> No pressure. Just nature.</span></div>
            <div className="hero-proof"><div className="proof-avatars"><span>🌿</span><span>☀️</span><span>🍃</span></div><p><strong>A small step outside</strong><br />is still a step in the right direction.</p></div>
          </div>
          <div className="hero-art" role="img" aria-label="Illustration of a peaceful green outdoor landscape">
            <div className="art-sun"></div><div className="art-cloud cloud-one"></div><div className="art-cloud cloud-two"></div>
            <div className="art-hill hill-one"></div><div className="art-hill hill-two"></div><div className="art-hill hill-three"></div>
            <div className="art-path"></div>
            <div className="tree tree-one"><span></span></div><div className="tree tree-two"><span></span></div><div className="tree tree-three"><span></span></div>
            <div className="floating-note"><span className="note-sun"><Sun size={18} /></span><span><strong>Take the long way</strong><small>There’s no rush.</small></span></div>
            <div className="art-caption">A little closer to the wild <span>✳</span></div>
          </div>
          <div className="hero-bottom"><span>01 / MAKE SPACE FOR OUTSIDE</span><a href="#planner">SCROLL TO START <ArrowDown size={14} /></a></div>
        </section>

        <section className="intro-strip" id="how-it-works">
          <div className="intro-icon"><Compass size={23} /></div><p><strong>Your day, your pace.</strong> Whether you have 15 minutes or a whole afternoon, there’s an outdoor moment waiting for you.</p><div className="intro-deco">✳</div>
        </section>

        <section className="planner-section" id="planner">
          <div className="planner-heading"><span className="eyebrow">THE OUTDOOR PLANNER</span><h2>What feels good <em>today?</em></h2><p>Tell us a little about your day. Our local AI will help shape a simple plan you can actually enjoy.</p></div>
          <form className="planner-card" onSubmit={generatePlan}>
            <div className="form-topline"><span><span className="step-number">01</span> CHOOSE YOUR OUTSIDE</span><span className="required-note">Pick what sounds good</span></div>
            <div className="activity-grid">{activities.map(item => <ActivityCard key={item.id} activity={item} selected={activity === item.id} onSelect={setActivity} />)}</div>
            <div className="form-divider"></div>
            <div className="form-topline"><span><span className="step-number">02</span> HOW MUCH TIME DO YOU HAVE?</span></div>
            <div className="options-grid time-grid">{timeOptions.map(option => <OptionPill key={option.value} selected={time === option.value} onClick={() => setTime(option.value)} detail={option.detail}>{option.label}</OptionPill>)}</div>
            <div className="form-divider"></div>
            <div className="form-topline"><span><span className="step-number">03</span> WHAT'S YOUR COMFORT LEVEL?</span></div>
            <div className="options-grid skill-grid">{skillOptions.map(option => <OptionPill key={option.value} selected={skill === option.value} onClick={() => setSkill(option.value)} detail={option.detail}>{option.label}</OptionPill>)}</div>
            <div className="form-divider"></div>
            <div className="form-topline"><span><span className="step-number">04</span> WHAT ARE YOU IN THE MOOD FOR?</span><span className="required-note">Choose any</span></div>
            <div className="interest-grid">
              {interestOptions.map(interest => {
                const selected = interests.includes(interest);
                return <button key={interest} type="button" className={`interest-chip ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => toggleInterest(interest)}><span className="interest-check">{selected && <Check size={12} />}</span>{interest}</button>;
              })}
            </div>
            <div className="generate-row"><div className="generate-note"><span>🌱</span><p><strong>Start where you are.</strong><br />Your plan can be as easy as you need it to be.</p></div><button className="primary-button generate-button" type="submit" disabled={status === 'loading'}>{status === 'loading' ? <><LoaderCircle size={17} className="spin" /> Asking local AI…</> : <>Generate my plan <ArrowRight size={17} /></>}</button></div>
            {status === 'loading' && <div className="status-message loading-message" role="status"><LoaderCircle size={17} className="spin" /><span><strong>Growing your plan…</strong> Ollama is running locally. This can take a little while on the first request.</span></div>}
            {status === 'error' && <div className="status-message error-message" role="alert"><AlertCircle size={18} /><span><strong>Couldn't generate your plan.</strong> {error}</span><button type="button" onClick={generatePlan} className="retry-button">Try again</button></div>}
            {status === 'success' && <div className="status-message success-message" role="status"><Check size={17} /><span><strong>Your plan is ready.</strong> Generated with your local Ollama model.</span></div>}
          </form>
        </section>

        <PlanResults plan={plan} activityLabel={activities.find(item => item.id === activity)?.label || 'Walking'} onReset={resetPlan} />

        <OutdoorMap />

        <section className="closing-banner">
          <div className="closing-spark">✳</div><span className="eyebrow">A NOTE FROM TRAILMATE</span><h2>The world is still<br />wonderfully <em>out there.</em></h2><p>Put the phone down when you’re ready. Take a breath. Let the day surprise you.</p><a href="#planner" className="closing-link">Plan a little outside time <ArrowRight size={16} /></a>
          <div className="closing-grass">⌁ ⌁ ⌁ ⌁ ⌁ ⌁ ⌁ ⌁ ⌁</div>
        </section>
      </main>

      <footer className="site-footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><Leaf size={18} /></span><span>trailmate<span className="brand-ai">.ai</span></span></a><p>Made for slower moments and greener days.</p><span className="footer-tag">TOUCH GRASS. FIND YOURSELF. 🌱</span></footer>
    </div>
  );
}
