var totalNet = function (v1, v2) {
  if (!v1 || !v2) {
    return 0;
  }
  return Math.abs(v1 - v2);
};

module.exports = totalNet;
