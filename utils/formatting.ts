
export const formatNumber = (num: number): string => {
  if (num < 1000) return Math.floor(num).toString();
  
  const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const suffixNum = Math.floor(("" + Math.floor(num)).length / 3);
  
  let shortValue = parseFloat((suffixNum !== 0 ? (num / Math.pow(1000, suffixNum)) : num).toPrecision(3));
  if (shortValue % 1 !== 0) {
      shortValue = parseFloat(shortValue.toFixed(1));
  }
  return shortValue + suffixes[suffixNum];
};

export const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
};
