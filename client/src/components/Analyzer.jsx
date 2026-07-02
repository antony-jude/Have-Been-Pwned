import React, { useState, useEffect, useRef } from 'react';
import { calculateStrength } from '../utils/entropyCalc';

export default function Analyzer() {
  // Password State
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordBreach, setPasswordBreach] = useState({ state: 'idle', count: 0, error: null });
  
  // Email State
  const [email, setEmail] = useState('');
  const [emailBreach, setEmailBreach] = useState({ state: 'idle', data: null, error: null });

  // Debounced Password Check timer
  const pwdTimer = useRef(null);

  // Client-side SHA-1 hash generator
  const sha1 = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.toUpperCase();
  };

  // Password breach lookup
  const checkPasswordBreach = async (pwd) => {
    if (!pwd) {
      setPasswordBreach({ state: 'idle', count: 0, error: null });
      return;
    }

    setPasswordBreach({ state: 'checking', count: 0, error: null });

    try {
      const fullHash = await sha1(pwd);
      const prefix = fullHash.substring(0, 5);
      const suffix = fullHash.substring(5);

      const res = await fetch(`http://localhost:3001/api/pwned-check/${prefix}`);
      if (!res.ok) throw new Error('API server error');

      const text = await res.text();
      const lines = text.split(/\r?\n/);
      
      let foundCount = 0;
      for (const line of lines) {
        const [lineSuffix, countStr] = line.split(':');
        if (lineSuffix && lineSuffix.trim() === suffix) {
          foundCount = parseInt(countStr.trim(), 10);
          break;
        }
      }

      if (foundCount > 0) {
        setPasswordBreach({ state: 'breached', count: foundCount, error: null });
      } else {
        setPasswordBreach({ state: 'safe', count: 0, error: null });
      }
    } catch (err) {
      console.error(err);
      setPasswordBreach({ 
        state: 'error', 
        count: 0, 
        error: 'Failed to verify password breach status.' 
      });
    }
  };

  // Trigger password check with debounce
  useEffect(() => {
    if (pwdTimer.current) clearTimeout(pwdTimer.current);

    if (password) {
      setPasswordBreach({ state: 'idle', count: 0, error: null });
      pwdTimer.current = setTimeout(() => {
        checkPasswordBreach(password);
      }, 600);
    } else {
      setPasswordBreach({ state: 'idle', count: 0, error: null });
    }

    return () => {
      if (pwdTimer.current) clearTimeout(pwdTimer.current);
    };
  }, [password]);

  // Email breach lookup
  const handleEmailCheck = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setEmailBreach({ state: 'error', data: null, error: 'Please enter a valid email address.' });
      return;
    }

    setEmailBreach({ state: 'checking', data: null, error: null });

    try {
      const res = await fetch(`http://localhost:3001/api/email-check/${encodeURIComponent(email)}`);
      
      if (!res.ok) {
        throw new Error('API server error');
      }

      const data = await res.json();
      
      if (data && data.ExposedBreaches && data.ExposedBreaches.breaches_details && data.ExposedBreaches.breaches_details.length > 0) {
        setEmailBreach({ state: 'breached', data, error: null });
      } else {
        setEmailBreach({ state: 'safe', data: null, error: null });
      }
    } catch (err) {
      console.error(err);
      setEmailBreach({ 
        state: 'error', 
        data: null, 
        error: 'Could not connect to the breach database. Ensure the backend server is running.' 
      });
    }
  };

  // Password analysis calculations
  const metrics = calculateStrength(password);

  // Dynamic colors for gauge and elements based on score
  const getThemeMapping = (score, isCommon) => {
    if (isCommon) return {
      text: 'text-pink',
      bg: 'bg-pink',
      border: 'border-pink/40',
      lightBg: 'bg-pink/10',
      barColor: 'bg-strength-0',
      shadow: 'shadow-pink/10'
    };

    switch (score) {
      case 4:
        return {
          text: 'text-primary',
          bg: 'bg-primary',
          border: 'border-primary/40',
          lightBg: 'bg-primary/10',
          barColor: 'bg-strength-4',
          shadow: 'shadow-primary/10'
        };
      case 3:
        return {
          text: 'text-secondary',
          bg: 'bg-secondary',
          border: 'border-secondary/40',
          lightBg: 'bg-secondary/10',
          barColor: 'bg-strength-3',
          shadow: 'shadow-secondary/10'
        };
      case 2:
        return {
          text: 'text-amber-300',
          bg: 'bg-amber-400',
          border: 'border-amber-400/40',
          lightBg: 'bg-amber-450/10',
          barColor: 'bg-strength-2',
          shadow: 'shadow-amber-400/10'
        };
      case 1:
        return {
          text: 'text-pink/80',
          bg: 'bg-pink/80',
          border: 'border-pink/30',
          lightBg: 'bg-pink/5',
          barColor: 'bg-strength-1',
          shadow: 'shadow-pink/5'
        };
      default:
        return {
          text: 'text-pink',
          bg: 'bg-pink',
          border: 'border-pink/40',
          lightBg: 'bg-pink/10',
          barColor: 'bg-strength-0',
          shadow: 'shadow-pink/10'
        };
    }
  };

  const theme = getThemeMapping(metrics.strengthScore, metrics.patterns.isCommon);

  return (
    <div id="top" className="dashboard w-full max-w-7xl mx-auto px-4 text-light">
      {/* Brand Header */}
      <header className="site-hero">
        <div className="hero-badge"><span>New</span> Personal security intelligence <b>→</b></div>
        <h1 className="hero-title font-black tracking-tight">
          Has Your Digital Life<br />Been <span>Pwned?</span>
        </h1>
        <p className="hero-copy text-taupe">
          Analyze password strength, uncover exposed accounts, and get clear security insights—all from one private dashboard.
        </p>
        <div className="hero-actions">
          <a className="hero-button hero-button-secondary" href="#email-scan"><span>▶</span> Check email</a>
          <a className="hero-button hero-button-primary" href="#password-scan">Start password scan <span>→</span></a>
        </div>
        <div className="hero-trust"><span>✓</span> Private by design. Your password never leaves this device.</div>
        <div className="hero-horizon" aria-hidden="true"></div>
      </header>

      <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-12 items-start">
        {/* COLUMN 1: PASSWORD STRENGTH & METRICS */}
        <div className="dashboard-column lg:col-span-6">
          {/* Input Box Card */}
          <div id="password-scan" className={`panel-card password-card p-6 md:p-8 bg-panel-bg border ${password ? theme.border : 'border-panel-border'} glow-panel backdrop-blur-md transition-all duration-500`}>
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2.5">
              <svg className="w-5 h-5 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password Shield
            </h2>

            <div className="relative mb-6">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Check your password strength..."
                className="w-full px-5 py-4 bg-bg-dark border border-panel-border/60 rounded-xl text-light font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-taupe/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-taupe hover:text-light transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.5 3.5M21 21l-3.5-3.5" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Strength bar */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-taupe text-xs font-semibold uppercase tracking-wider">Entropy Score</span>
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${theme.lightBg} ${theme.text} border border-current/25`}>
                  {password ? metrics.strengthLabel : 'Awaiting Input'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 h-2.5">
                {[0, 1, 2, 3, 4].map((index) => {
                  const isActive = !metrics.patterns.isCommon && password && metrics.strengthScore >= index;
                  const isCompromised = metrics.patterns.isCommon && password;
                  return (
                    <div
                      key={index}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompromised
                          ? 'bg-strength-0 shadow-[0_0_8px_rgba(255,168,182,0.6)]'
                          : isActive
                            ? `${theme.barColor} shadow-[0_0_8px_rgba(81,226,245,0.4)]`
                            : 'bg-bg-dark/80'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Passwords Breach Alerts */}
            {password && (
              <div className="mt-4 pt-4 border-t border-panel-border/30">
                {passwordBreach.state === 'checking' && (
                  <div className="flex items-center gap-3 text-xs text-secondary">
                    <div className="w-3.5 h-3.5 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching password database...</span>
                  </div>
                )}
                {passwordBreach.state === 'safe' && (
                  <div className="text-xs text-primary flex items-center gap-2 bg-primary/10 p-3 rounded-lg border border-primary/20">
                    <span>🛡️</span>
                    <span>Safe: Password not found in known database breaches.</span>
                  </div>
                )}
                {passwordBreach.state === 'breached' && (
                  <div className="text-xs text-pink flex items-center gap-2 bg-pink/10 p-3 rounded-lg border border-pink/20">
                    <span>🚨</span>
                    <span>
                      Compromised: Found <strong>{passwordBreach.count.toLocaleString()} times</strong> in public breaches!
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actionable Feedback Guidance */}
            <div className="mt-6 border-t border-panel-border/30 pt-5">
              <h3 className="text-xs font-bold text-taupe tracking-wider uppercase mb-3.5">Analysis & Advice</h3>
              <ul className="space-y-3">
                {metrics.feedback.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs text-light/80">
                    <span className="text-pink mt-0.5 shrink-0">⚡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Theoretical & Practical Entropy Math */}
          <div id="security-insights" className="panel-card entropy-card p-6 md:p-8 bg-panel-bg border border-panel-border glow-panel backdrop-blur-md space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2.5">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculated Entropy Analysis
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-dark/70 p-4 rounded-xl border border-panel-border/40">
                <div className="text-[10px] font-bold text-taupe uppercase tracking-wider mb-1">Theoretical Entropy</div>
                <div className="text-2xl font-black text-light font-mono">
                  {metrics.rawEntropy.toFixed(1)} <span className="text-xs font-normal text-taupe">bits</span>
                </div>
              </div>
              <div className="bg-bg-dark/70 p-4 rounded-xl border border-panel-border/40">
                <div className="text-[10px] font-bold text-taupe uppercase tracking-wider mb-1">Effective Entropy</div>
                <div className={`text-2xl font-black font-mono ${theme.text}`}>
                  {metrics.effectiveEntropy.toFixed(1)} <span className="text-xs font-normal text-taupe">bits</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-taupe tracking-wider uppercase mb-3">Time-to-Crack Estimates</h3>
              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center p-3 bg-bg-dark/50 border border-panel-border/20 rounded-xl">
                  <div className="text-[11px]">
                    <span className="font-bold text-light block">Offline Attack (GPU Brute Force)</span>
                    <span className="text-[9px] text-taupe font-normal">10 Billion guesses/sec</span>
                  </div>
                  <span className={`text-xs font-bold ${metrics.strengthScore >= 3 && !metrics.patterns.isCommon ? 'text-primary' : 'text-light/90'}`}>
                    {metrics.crackTimeOffline}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-bg-dark/50 border border-panel-border/20 rounded-xl">
                  <div className="text-[11px]">
                    <span className="font-bold text-light block">Online Attack (Login Panel)</span>
                    <span className="text-[9px] text-taupe font-normal">1,000 guesses/sec</span>
                  </div>
                  <span className={`text-xs font-bold ${metrics.strengthScore >= 2 && !metrics.patterns.isCommon ? 'text-secondary' : 'text-light/90'}`}>
                    {metrics.crackTimeOnline}
                  </span>
                </div>
              </div>
            </div>

            {/* Pattern Penalty List */}
            {password && (
              <div className="border-t border-panel-border/30 pt-4">
                <h3 className="text-xs font-bold text-taupe tracking-wider uppercase mb-3">Pattern Deductions</h3>
                {metrics.deductions.length === 0 && !metrics.patterns.isCommon && metrics.patterns.leetSubstitutions.length === 0 ? (
                  <div className="text-xs text-primary/80">No pattern reductions applied. Raw entropy holds.</div>
                ) : (
                  <div className="space-y-2.5 font-mono text-[11px]">
                    {metrics.patterns.isCommon && (
                      <div className="flex justify-between items-center p-2.5 bg-pink/10 border border-pink/20 text-pink rounded-lg">
                        <span>Dictionary Match (Top 10k)</span>
                        <span className="font-bold">Score Capped (5.0 bits)</span>
                      </div>
                    )}
                    {metrics.patterns.leetSubstitutions.length > 0 && (
                      <div className="flex justify-between items-center p-2.5 bg-amber-400/10 border border-amber-400/20 text-amber-300 rounded-lg">
                        <span>L33t Substitutions detected</span>
                        <span className="font-bold">Pool Downgraded</span>
                      </div>
                    )}
                    {metrics.deductions.map((d, i) => (
                      <div key={i} className="flex justify-between items-center p-2.5 bg-bg-dark/50 border border-panel-border/20 text-light/85 rounded-lg">
                        <span>{d.type === 'walk' ? 'Keyboard Walk' : d.type === 'repeat' ? 'Char Repeat' : 'Sequence'} ("{d.match}")</span>
                        <span className="text-pink font-bold">-{d.bits.toFixed(1)} bits</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: EMAIL BREACH CHECKER */}
        <div className="dashboard-column lg:col-span-6">
          <div id="email-scan" className="panel-card email-card p-6 md:p-8 bg-panel-bg border border-panel-border glow-panel backdrop-blur-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
              </svg>
              Email Integrity Scan
            </h2>
            <p className="text-xs text-taupe mb-6 leading-relaxed">
              Verify if your email address has been compromised in database leaks. We query the XposedOrNot intelligence database securely.
            </p>

            <form onSubmit={handleEmailCheck} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to scan (e.g. test@example.com)..."
                className="flex-1 px-4 py-3 bg-bg-dark border border-panel-border/60 rounded-xl text-light focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all placeholder:text-taupe/40 text-sm"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-secondary hover:bg-primary hover:text-bg-dark text-bg-dark font-bold rounded-xl transition-all shadow-md active:scale-95 text-sm"
              >
                Scan Email
              </button>
            </form>

            {/* Email Check Results */}
            <div className="space-y-6">
              {emailBreach.state === 'checking' && (
                <div className="flex items-center gap-3 p-4 bg-bg-dark/50 border border-panel-border/30 rounded-xl text-secondary">
                  <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-semibold">Scanning exposed records...</span>
                </div>
              )}

              {emailBreach.state === 'safe' && (
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-primary flex items-start gap-3">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <h4 className="font-bold text-sm">No Exposure Detected</h4>
                    <p className="text-xs text-taupe mt-1">This email address was not found in any recorded data breaches.</p>
                  </div>
                </div>
              )}

              {emailBreach.state === 'error' && (
                <div className="p-4 bg-pink/15 border border-pink/30 rounded-xl text-pink flex items-start gap-3 text-xs">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <h4 className="font-bold text-sm">Scan Interrupted</h4>
                    <p className="text-light/80 mt-1">{emailBreach.error}</p>
                  </div>
                </div>
              )}

              {emailBreach.state === 'breached' && emailBreach.data && (
                <div className="space-y-6">
                  {/* Summary Banner */}
                  <div className="p-4 bg-pink/10 border border-pink/30 rounded-xl text-pink flex items-start gap-3">
                    <span className="text-xl">🚨</span>
                    <div>
                      <h4 className="font-bold text-sm">Exposed Credentials Found!</h4>
                      <p className="text-xs text-light/95 mt-1 leading-relaxed">
                        This email was detected in <strong className="text-pink font-bold">{emailBreach.data.ExposedAnalytic.BreachesSummary.cnt} data breaches</strong>. Examine details and source proofs below.
                      </p>
                    </div>
                  </div>

                  {/* Detailed Breaches List - Source and Proof */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-taupe uppercase tracking-wider">Compromise Source & Proof Logs</h3>
                    
                    {emailBreach.data.ExposedAnalytic.ExposedBreaches.breaches_details.map((b, i) => (
                      <div key={i} className="p-5 rounded-xl bg-bg-dark/70 border border-panel-border/30 hover:border-panel-border/60 transition-all space-y-3 relative overflow-hidden group">
                        
                        {/* Header: Logo, Name & Domain */}
                        <div className="flex items-center gap-3">
                          {b.logo ? (
                            <img 
                              src={b.logo} 
                              alt={`${b.breach} logo`} 
                              className="w-8 h-8 rounded-md bg-slate-900 border border-panel-border/40 p-0.5 object-contain"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-slate-900 border border-panel-border/40 flex items-center justify-center font-bold text-xs text-taupe">
                              {b.breach.substring(0, 2)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm text-light group-hover:text-primary transition-colors">{b.breach}</h4>
                            <span className="text-[10px] text-taupe font-mono">{b.domain}</span>
                          </div>
                          <span className="ml-auto text-[10px] bg-pink/10 border border-pink/25 text-pink px-2.5 py-0.5 rounded-full font-mono">
                            Leaked in {b.xposed_date}
                          </span>
                        </div>

                        {/* Details */}
                        <p className="text-xs text-light/80 leading-relaxed pt-1">
                          {b.details}
                        </p>

                        {/* Proof: Data Exposed */}
                        <div className="bg-bg-dark/40 p-3 rounded-lg border border-panel-border/20 text-xs space-y-1.5 font-mono">
                          <div className="flex justify-between">
                            <span className="text-taupe">Proof of Leak:</span>
                            <span className="text-pink font-semibold text-right max-w-[70%] break-all">
                              {b.xposed_data.replace(/;/g, ', ')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-taupe">Total Records Leaked:</span>
                            <span className="text-light">{parseInt(b.xposed_records, 10).toLocaleString()} accounts</span>
                          </div>
                        </div>

                        {/* Source Links */}
                        {b.references && (
                          <div className="flex justify-end pt-1">
                            <a 
                              href={b.references} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] text-secondary hover:text-primary flex items-center gap-1 font-mono transition-colors"
                            >
                              <span>View Incident Source</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
