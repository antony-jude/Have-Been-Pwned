import { detectPatterns } from './patternDetector';

// Helper to calculate base-2 logarithm
const log2 = (val) => Math.log(val) / Math.LN2;

// Returns character pool details for a string
export function getPoolDetails(str) {
  let hasLower = false;
  let hasUpper = false;
  let hasDigit = false;
  let hasSymbol = false;
  
  for (const char of str) {
    if (/[a-z]/.test(char)) hasLower = true;
    else if (/[A-Z]/.test(char)) hasUpper = true;
    else if (/[0-9]/.test(char)) hasDigit = true;
    else hasSymbol = true; // space, punctuation, other symbols
  }
  
  let size = 0;
  if (hasLower) size += 26;
  if (hasUpper) size += 26;
  if (hasDigit) size += 10;
  if (hasSymbol) size += 33; // standard ASCII printable symbols count
  
  return { size, hasLower, hasUpper, hasDigit, hasSymbol };
}

// Convert entropy to a human-readable duration
export function formatCrackTime(seconds) {
  if (seconds < 1) return 'instant';
  if (seconds < 60) return `${Math.round(seconds)} second${Math.round(seconds) > 1 ? 's' : ''}`;
  
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} minute${Math.round(minutes) > 1 ? 's' : ''}`;
  
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hour${Math.round(hours) > 1 ? 's' : ''}`;
  
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)} day${Math.round(days) > 1 ? 's' : ''}`;
  
  const months = days / 30.44; // average month length
  if (months < 12) return `${Math.round(months)} month${Math.round(months) > 1 ? 's' : ''}`;
  
  const years = months / 12;
  if (years < 100) return `${Math.round(years)} year${Math.round(years) > 1 ? 's' : ''}`;
  if (years < 1000) return `${Math.round(years / 10) * 10} years`;
  if (years < 1000000) return `${(years / 1000).toFixed(1)}k years`;
  if (years < 1000000000) return `${(years / 1000000).toFixed(1)} million years`;
  return `${(years / 1000000000).toFixed(1)} billion years`;
}

// Main calculation function
export function calculateStrength(password) {
  if (!password) {
    return {
      rawEntropy: 0,
      effectiveEntropy: 0,
      poolSize: 0,
      effectivePoolSize: 0,
      crackTimeOffline: 'instant',
      crackTimeOnline: 'instant',
      patterns: {
        repeats: [],
        sequences: [],
        keyboardWalks: [],
        isCommon: false,
        leetSubstitutions: [],
      },
      feedback: ['Enter a password to begin analysis.'],
      strengthScore: 0, // 0 to 4 (representing levels)
      strengthLabel: 'Very Weak'
    };
  }

  // 1. Get raw pool size and raw entropy
  const rawPool = getPoolDetails(password);
  const L = password.length;
  const rawEntropy = L > 0 && rawPool.size > 0 ? L * log2(rawPool.size) : 0;

  // 2. Detect patterns (repeated characters, keyboard walks, sequences, substitutions, common list)
  const patterns = detectPatterns(password);

  // 3. Get effective pool size using the demangled password
  // This penalizes l33t speak substitutions by treating substituted characters
  // as part of their demangled alphabet pool, not as symbols/digits.
  const effPool = getPoolDetails(patterns.demangled);
  
  // Calculate baseline effective entropy before pattern penalties
  let effectiveEntropy = L > 0 && effPool.size > 0 ? L * log2(effPool.size) : 0;

  const deductions = [];

  // 4. Deduct penalties for repetitions
  patterns.repeats.forEach(p => {
    // A repeat of length k has k-1 redundant characters
    const bitsPerChar = log2(effPool.size);
    const deduction = (p.length - 1) * bitsPerChar;
    effectiveEntropy -= deduction;
    deductions.push({
      type: 'repeat',
      match: p.match,
      bits: deduction
    });
  });

  // 5. Deduct penalties for alphabetical/numerical sequences
  patterns.sequences.forEach(p => {
    // Sequences are highly predictable. We deduct 80% of the bits of the redundant chars.
    const bitsPerChar = log2(effPool.size);
    const deduction = (p.length - 1) * bitsPerChar * 0.8;
    effectiveEntropy -= deduction;
    deductions.push({
      type: 'sequence',
      match: p.match,
      bits: deduction
    });
  });

  // 6. Deduct penalties for keyboard walks
  patterns.keyboardWalks.forEach(p => {
    // Keyboard walks are highly predictable. We deduct 80% of the bits of the redundant chars.
    const bitsPerChar = log2(effPool.size);
    const deduction = (p.length - 1) * bitsPerChar * 0.8;
    effectiveEntropy -= deduction;
    deductions.push({
      type: 'walk',
      match: p.match,
      bits: deduction
    });
  });

  // Clamp effective entropy to a logical minimum: log2(effPool.size) (representing at least one char's entropy)
  if (effectiveEntropy < log2(effPool.size)) {
    effectiveEntropy = log2(effPool.size);
  }

  // 7. Deduct for top 10k list match
  if (patterns.isCommon) {
    // If the password matches a common one, it has practically zero entropy (attacker will check these first)
    effectiveEntropy = Math.min(effectiveEntropy, 5.0); // capped at 5 bits (32 guesses)
  }

  // Ensure it is not negative
  effectiveEntropy = Math.max(0, effectiveEntropy);

  // 8. Convert effective entropy to time to crack
  // Number of guesses = 2^entropy
  const guesses = Math.pow(2, effectiveEntropy);

  // Offline attack rate: 10 billion guesses/sec
  const offlineRate = 10000000000;
  // Online attack rate: 1,000 guesses/sec (e.g. bcrypt server auth)
  const onlineRate = 1000;

  const secondsOffline = guesses / offlineRate;
  const secondsOnline = guesses / onlineRate;

  const crackTimeOffline = formatCrackTime(secondsOffline);
  const crackTimeOnline = formatCrackTime(secondsOnline);

  // 9. Generate actionable feedback
  const feedback = [];
  
  if (L < 8) {
    feedback.push(`Password is too short. Try making it at least 12–16 characters long.`);
  }

  if (patterns.isCommon) {
    feedback.push(`This is a very common password ("${patterns.commonMatch}"). Avoid using dictionary words.`);
  }

  if (patterns.leetSubstitutions.length > 0 && patterns.isCommon) {
    feedback.push(`L33t-speak substitutions (like '@' for 'a' or '0' for 'o') did not fool the analyzer. Attacking scripts automatically check these.`);
  }

  if (patterns.keyboardWalks.length > 0) {
    feedback.push(`Avoid key patterns like "${patterns.keyboardWalks[0].match}" which are easy to guess.`);
  }

  if (patterns.repeats.length > 0) {
    feedback.push(`Avoid repeating characters consecutively (like "${patterns.repeats[0].match}").`);
  }

  if (patterns.sequences.length > 0) {
    feedback.push(`Avoid alphabetical or numerical sequences (like "${patterns.sequences[0].match}").`);
  }

  // General construction feedback
  const pool = getPoolDetails(password);
  const categories = [pool.hasLower, pool.hasUpper, pool.hasDigit, pool.hasSymbol].filter(Boolean).length;

  if (L >= 8 && L < 12 && categories < 3) {
    feedback.push(`Add a mix of uppercase, lowercase, numbers, or symbols to increase complexity, or simply add more characters.`);
  }

  if (effectiveEntropy < 40 && L >= 8) {
    feedback.push(`Increase your password length by adding a few more characters to reach 'strong' status.`);
  }

  if (feedback.length === 0 && effectiveEntropy >= 60) {
    feedback.push(`Great password! Consider using passphrase style (e.g. random words joined by dashes) for even better memorability and strength.`);
  } else if (feedback.length === 0) {
    feedback.push(`Looks good! Make it a bit longer to improve crack time.`);
  }

  // 10. Compute Strength Score and Label
  // 0 - Very Weak: < 28 bits (can be brute forced easily)
  // 1 - Weak: 28 - 39 bits
  // 2 - Moderate: 40 - 59 bits
  // 3 - Strong: 60 - 79 bits
  // 4 - Unbreakable: >= 80 bits
  let strengthScore = 0;
  let strengthLabel = 'Very Weak';

  if (effectiveEntropy >= 80) {
    strengthScore = 4;
    strengthLabel = 'Unbreakable';
  } else if (effectiveEntropy >= 60) {
    strengthScore = 3;
    strengthLabel = 'Strong';
  } else if (effectiveEntropy >= 40) {
    strengthScore = 2;
    strengthLabel = 'Moderate';
  } else if (effectiveEntropy >= 28) {
    strengthScore = 1;
    strengthLabel = 'Weak';
  } else {
    strengthScore = 0;
    strengthLabel = 'Very Weak';
  }

  // If it's in the common list, force it to Very Weak or Weak
  if (patterns.isCommon) {
    strengthScore = 0;
    strengthLabel = 'Very Weak';
  }

  return {
    rawEntropy,
    effectiveEntropy,
    poolSize: rawPool.size,
    effectivePoolSize: effPool.size,
    crackTimeOffline,
    crackTimeOnline,
    patterns,
    deductions,
    feedback,
    strengthScore,
    strengthLabel
  };
}
