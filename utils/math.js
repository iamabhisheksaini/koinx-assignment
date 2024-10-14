
function calculateStandardDeviation(data) {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b) / n;
  const variance = data.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / n;
  return Math.sqrt(variance);
}

module.exports = { calculateStandardDeviation };
