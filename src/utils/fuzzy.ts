// Lightweight, dependency-free fuzzy matcher tuned for clipboard search.
//
// `fuzzyScore` returns a relevance score (higher = better, 0 = no match).
// `text` is expected to already be lowercased (item.searchText is stored that
// way in the main process), and `query` is lowercased by the caller once.
//
// Scoring favours, in order: exact substring (earlier + on a word boundary),
// then in-order subsequence matches with bonuses for consecutive runs and
// word-boundary starts and a small penalty for large gaps.

const BOUNDARY = /[\s/_\-.:,#()[\]{}]/

export function fuzzyScore(query: string, text: string): number {
  if (!query) return 1
  if (!text) return 0

  // Fast path: contiguous substring. Highest tier; ranked by earliness and
  // whether the match begins on a word boundary.
  const idx = text.indexOf(query)
  if (idx !== -1) {
    let score = 10000 - Math.min(idx, 500)
    if (idx === 0 || BOUNDARY.test(text[idx - 1])) score += 400
    return score
  }

  // Subsequence path: every query char must appear in order.
  let ti = 0
  let score = 0
  let run = 0
  let prev = -2
  for (let qi = 0; qi < query.length; qi++) {
    const found = text.indexOf(query[qi], ti)
    if (found === -1) return 0
    if (found === prev + 1) {
      run++
      score += 15 + run * 6 // consecutive characters are worth progressively more
    } else {
      run = 0
      score += 6
      score -= Math.min(found - ti, 12) // penalise large jumps
    }
    if (found === 0 || BOUNDARY.test(text[found - 1])) score += 12 // boundary bonus
    prev = found
    ti = found + 1
  }
  return Math.max(1, score)
}

export function isFuzzyMatch(query: string, text: string): boolean {
  return fuzzyScore(query, text) > 0
}
