var total = function (payload, name, name2) {
  console.log('payloadsss', payload);
  console.log('name', name);
  console.log('name2', name2);
  let total = 0;
  payload.map((r) => {
    total += r?.qty * r[name][name2];
  });
  return total;
};

module.exports = total;
