/** Keep persisted workflow values compatible while using neutral review labels. */
export function reviewLabel(value:string){return value==='معتمد تجريبياً'?'مراجعة مكتملة':value}
