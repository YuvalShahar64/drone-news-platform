const RULES = [
  [
    'Military & Defense',
    /\b(military|defense|defence|army|navy|air force|weapon|missile|combat|warfare|soldier|troop|pentagon|nato|strike|bomb|warhead|armed forces)\b/i,
  ],
  [
    'Delivery & Logistics',
    /\b(deliver(y|ies)|logistics|shipping|package|warehouse|supply chain|last.?mile|cargo|fulfilment|fulfillment|amazon|ups|fedex)\b/i,
  ],
  [
    'Racing & Sport',
    /\b(racing|race|sport|fpv|freestyle|pilot|championship|league|competition|tournament|speed record)\b/i,
  ],
  [
    'Regulations & Policy',
    /\b(regulation|policy|law|legislation|faa|caa|easa|airspace|ban|permit|licen[cs]e|rule|compliance|authority|government|congress|senate)\b/i,
  ],
  [
    'Surveillance & Security',
    /\b(surveillance|monitoring|security|border|patrol|spy|intelligence|reconnaissance|tracking|infrared|thermal)\b/i,
  ],
  [
    'Technology & Innovation',
    /\b(technology|innovation|sensor|battery|autonomy|autonomous|ai|machine learning|software|hardware|prototype|startup|research|development|lidar|gps|navigation)\b/i,
  ],
];

const DEFAULT_CATEGORY = 'General';

function classifyArticle(article) {
  const text = `${article.title ?? ''} ${article.description ?? ''}`;
  for (const [category, pattern] of RULES) {
    if (pattern.test(text)) return category;
  }
  return DEFAULT_CATEGORY;
}

module.exports = { classifyArticle, RULES, DEFAULT_CATEGORY };
