import commonPasswords from '../data/commonPasswords.json';

// Map of common l33t substitutions
const LEET_MAP = {
  '4': 'a', '@': 'a', '^': 'a',
  '3': 'e',
  '1': 'i', '!': 'i', '|': 'i',
  '0': 'o',
  '5': 's', '$': 's',
  '7': 't', '+': 't',
  '8': 'b',
  '9': 'g',
  '2': 'z'
};

// Coordinate map for a standard QWERTY keyboard layout
const KEYBOARD_GRID = {
  // Row 0 (Numbers and standard symbols)
  '1': [0, 0], '!': [0, 0],
  '2': [0, 1], '@': [0, 1],
  '3': [0, 2], '#': [0, 2],
  '4': [0, 3], '$': [0, 3],
  '5': [0, 4], '%': [0, 4],
  '6': [0, 5], '^': [0, 5],
  '7': [0, 6], '&': [0, 6],
  '8': [0, 7], '*': [0, 7],
  '9': [0, 8], '(': [0, 8],
  '0': [0, 9], ')': [0, 9],
  '-': [0, 10], '_': [0, 10],
  '=': [0, 11], '+': [0, 11],

  // Row 1 (QWERTY row)
  'q': [1, 0], 'Q': [1, 0],
  'w': [1, 1], 'W': [1, 1],
  'e': [1, 2], 'E': [1, 2],
  'r': [1, 3], 'R': [1, 3],
  't': [1, 4], 'T': [1, 4],
  'y': [1, 5], 'Y': [1, 5],
  'u': [1, 6], 'U': [1, 6],
  'i': [1, 7], 'I': [1, 7],
  'o': [1, 8], 'O': [1, 8],
  'p': [1, 9], 'P': [1, 9],
  '[': [1, 10], '{': [1, 10],
  ']': [1, 11], '}': [1, 11],
  '\\': [1, 12], '|': [1, 12],

  // Row 2 (Home row)
  'a': [2, 0], 'A': [2, 0],
  's': [2, 1], 'S': [2, 1],
  'd': [2, 2], 'D': [2, 2],
  'f': [2, 3], 'F': [2, 3],
  'g': [2, 4], 'G': [2, 4],
  'h': [2, 5], 'H': [2, 5],
  'j': [2, 6], 'J': [2, 6],
  'k': [2, 7], 'K': [2, 7],
  'l': [2, 8], 'L': [2, 8],
  ';': [2, 9], ':': [2, 9],
  "'": [2, 10], '"': [2, 10],

  // Row 3 (Bottom row)
  'z': [3, 0], 'Z': [3, 0],
  'x': [3, 1], 'X': [3, 1],
  'c': [3, 2], 'C': [3, 2],
  'v': [3, 3], 'V': [3, 3],
  'b': [3, 4], 'B': [3, 4],
  'n': [3, 5], 'N': [3, 5],
  'm': [3, 6], 'M': [3, 6],
  ',': [3, 7], '<': [3, 7],
  '.': [3, 8], '>': [3, 8],
  '/': [3, 9], '?': [3, 9],
};

// Set of common passwords for O(1) lookups
const COMMON_SET = new Set(commonPasswords.map(p => p.toLowerCase()));

// Reverse map a string to standard characters
export function demangleLeet(password) {
  let demangled = '';
  let substitutions = [];
  
  for (let i = 0; i < password.length; i++) {
    const char = password[i];
    const replaced = LEET_MAP[char];
    if (replaced && replaced !== char.toLowerCase()) {
      demangled += replaced;
      substitutions.push({ char, replaced, index: i });
    } else {
      demangled += char;
    }
  }
  return { demangled, substitutions };
}

// Check if two keyboard keys are adjacent
function keysAreAdjacent(char1, char2) {
  const coord1 = KEYBOARD_GRID[char1];
  const coord2 = KEYBOARD_GRID[char2];
  if (!coord1 || !coord2) return false;
  
  const [r1, c1] = coord1;
  const [r2, c2] = coord2;
  
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  
  // They are adjacent if row and column distance is <= 1, but they are not the exact same key
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

// Find keyboard walk runs of length >= 3
export function findKeyboardWalks(password) {
  const walks = [];
  let currentWalk = [];
  
  for (let i = 0; i < password.length; i++) {
    const char = password[i];
    
    if (currentWalk.length === 0) {
      currentWalk.push({ char, index: i });
    } else {
      const prev = currentWalk[currentWalk.length - 1];
      if (keysAreAdjacent(prev.char, char)) {
        currentWalk.push({ char, index: i });
      } else {
        if (currentWalk.length >= 3) {
          const match = password.substring(currentWalk[0].index, currentWalk[currentWalk.length - 1].index + 1);
          walks.push({
            match,
            start: currentWalk[0].index,
            length: currentWalk.length
          });
        }
        currentWalk = [{ char, index: i }];
      }
    }
  }
  
  if (currentWalk.length >= 3) {
    const match = password.substring(currentWalk[0].index, currentWalk[currentWalk.length - 1].index + 1);
    walks.push({
      match,
      start: currentWalk[0].index,
      length: currentWalk.length
    });
  }
  
  return walks;
}

// Find runs of repeated characters of length >= 3 (e.g. "aaa")
export function findRepeatedChars(password) {
  const repeats = [];
  let currentRun = [];
  
  for (let i = 0; i < password.length; i++) {
    const char = password[i].toLowerCase();
    
    if (currentRun.length === 0) {
      currentRun.push({ char, index: i });
    } else {
      const prev = currentRun[currentRun.length - 1];
      if (prev.char === char) {
        currentRun.push({ char, index: i });
      } else {
        if (currentRun.length >= 3) {
          const match = password.substring(currentRun[0].index, currentRun[currentRun.length - 1].index + 1);
          repeats.push({
            match,
            start: currentRun[0].index,
            length: currentRun.length
          });
        }
        currentRun = [{ char, index: i }];
      }
    }
  }
  
  if (currentRun.length >= 3) {
    const match = password.substring(currentRun[0].index, currentRun[currentRun.length - 1].index + 1);
    repeats.push({
      match,
      start: currentRun[0].index,
      length: currentRun.length
    });
  }
  
  return repeats;
}

// Find sequential runs (alphabetical/numeric) of length >= 3 (e.g. "abc", "321")
export function findSequentialChars(password) {
  if (password.length < 3) return [];
  
  const sequences = [];
  let currentSeq = [];
  let currentDirection = null; // 1 for ascending, -1 for descending
  
  for (let i = 0; i < password.length; i++) {
    const charCode = password.charCodeAt(i);
    
    if (currentSeq.length === 0) {
      currentSeq.push({ charCode, index: i });
    } else if (currentSeq.length === 1) {
      const prev = currentSeq[0];
      const diff = charCode - prev.charCode;
      
      if (diff === 1 || diff === -1) {
        currentDirection = diff;
        currentSeq.push({ charCode, index: i });
      } else {
        currentSeq = [{ charCode, index: i }];
      }
    } else {
      const prev = currentSeq[currentSeq.length - 1];
      const diff = charCode - prev.charCode;
      
      if (diff === currentDirection && (diff === 1 || diff === -1)) {
        currentSeq.push({ charCode, index: i });
      } else {
        if (currentSeq.length >= 3) {
          const match = password.substring(currentSeq[0].index, currentSeq[currentSeq.length - 1].index + 1);
          sequences.push({
            match,
            start: currentSeq[0].index,
            length: currentSeq.length,
            direction: currentDirection === 1 ? 'ascending' : 'descending'
          });
        }
        // Reset sequence with current char, but check if it can form a sequence with the previous character
        const prevChar = currentSeq[currentSeq.length - 1];
        const newDiff = charCode - prevChar.charCode;
        if (newDiff === 1 || newDiff === -1) {
          currentDirection = newDiff;
          currentSeq = [prevChar, { charCode, index: i }];
        } else {
          currentDirection = null;
          currentSeq = [{ charCode, index: i }];
        }
      }
    }
  }
  
  if (currentSeq.length >= 3) {
    const match = password.substring(currentSeq[0].index, currentSeq[currentSeq.length - 1].index + 1);
    sequences.push({
      match,
      start: currentSeq[0].index,
      length: currentSeq.length,
      direction: currentDirection === 1 ? 'ascending' : 'descending'
    });
  }
  
  return sequences;
}

// Scan the password and detect all patterns
export function detectPatterns(password) {
  if (!password) {
    return {
      repeats: [],
      sequences: [],
      keyboardWalks: [],
      isCommon: false,
      commonMatch: null,
      leetSubstitutions: [],
      demangled: ''
    };
  }

  // 1. Demangle leet speak
  const { demangled, substitutions } = demangleLeet(password);
  
  // 2. Check in top-10k common password list (check both raw, raw lower, and demangled lower)
  const rawLower = password.toLowerCase();
  const demangledLower = demangled.toLowerCase();
  
  let isCommon = false;
  let commonMatch = null;
  
  if (COMMON_SET.has(rawLower)) {
    isCommon = true;
    commonMatch = rawLower;
  } else if (COMMON_SET.has(demangledLower)) {
    isCommon = true;
    commonMatch = demangledLower;
  }
  
  // 3. Find structural patterns (keyboard walks, repetitions, alphabetical/numerical sequences)
  // We run these on the raw password to capture walks/repeats as typed,
  // but we also check the demangled password in case the patterns are masked.
  const repeats = findRepeatedChars(password);
  const sequences = findSequentialChars(password);
  const keyboardWalks = findKeyboardWalks(password);
  
  return {
    repeats,
    sequences,
    keyboardWalks,
    isCommon,
    commonMatch,
    leetSubstitutions: substitutions,
    demangled
  };
}
