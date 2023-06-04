var totalStocks = function (payload) {
  console.log('payloadsss', payload);
  let total = 0;
  payload.map((r) => {
    total += r?.totalStocks;
  });
  return total;
};

module.exports = totalStocks;
