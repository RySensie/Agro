module.exports = {
  env: {
    dev: true,
  },
  hapi: {
    port: '2025',
  },
  app: {
    name: 'AGRO',
    title: 'AGRO INDUSTRIAL PRODUCT AND SUPPLY MANAGEMENT SYSTEM',
  },
  mongodb_production: {
    ip:'127.0.0.1',
    port: '2025',
    app:'pos',
  },
  mongodb_local: {
    ip:'127.0.0.1',
    port: '2025',
    app:'pos',
  },
  url: {
    local: '',
  },
  crypto: {
    privateKey:
      'agX/xoQ4d6erQ5TWeT4Tbjx6Fo8Ng+0lhxBpFTAvoy3UWGnirQuE00IOlaUfBQJ+p6XUsJfquk8q6+807VaRDaP5m1E07JVYgjMHzi24Sl1Q7EA4eY7vNGw91kN1EP3ucnyJh7hOnQbmvBmXEO/0j6RYkzY+WqdWiKSxdYgDNek=',
    tokenExpiry: 1 * 30 * 1000 * 60, //1 hour
  },
  validation: {
    username: /^[a-zA-Z0-9]{5,12}$/,
    password: /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,12}$/,
  },
};
