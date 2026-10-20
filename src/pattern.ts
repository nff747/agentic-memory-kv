export function globToRegExp(pattern: string): RegExp {
  let regexStr = '^';
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '*') {
      regexStr += '.*';
    } else if (char === '?') {
      regexStr += '.';
    } else if (char === '[' || char === ']') {
      regexStr += char;
    } else if (['.', '+', '^', '$', '(', ')', '{', '}', '|', '\\'].includes(char)) {
      regexStr += '\\' + char;
    } else {
      regexStr += char;
    }
  }
  regexStr += '$';
  return new RegExp(regexStr);
}

export function matchesPattern(key: string, pattern: string): boolean {
  if (pattern === '*' || pattern === '') return true;
  return globToRegExp(pattern).test(key);
}

export function filterKeysByPattern(keys: Iterable<string>, pattern: string): string[] {
  const re = globToRegExp(pattern);
  const matched: string[] = [];
  for (const k of keys) {
    if (re.test(k)) {
      matched.push(k);
    }
  }
  return matched;
}
