"use strict";

var internals = {};
const { last } = require("lodash");
const _ = require("lodash");
const Crypto = require("@lib/Crypto");
const { Users, Settings } = require("@models");

internals.index = function (req, reply) {
  if (req.auth.isAuthenticated) {
    if (req.auth.credentials.scope[0] === "agent") {
      return reply.redirect("/agent/dashboard");
    } else if (req.auth.credentials.scope[0] === "manager") {
      return reply.redirect("/manager/dashboard");
    }
  } else {
    return reply.view("accounts/login.html", {
      message: req.query.message,
      alert: req.query.alert,
    });
  }
};

internals.login = async function (req, reply) {
  req.cookieAuth.clear();
  // await Users.create({
  //   email: 'client@test.com',
  //   password: Crypto.encrypt('123'),
  //   firstname: 'Juan',
  //   lastname: 'Doe',
  //   scope: ['client'],
  // })
  reply.view("accounts/login.html", {
    email: req.query.email,
  });
};

internals.logout = function (req, reply) {
  req.cookieAuth.clear();
  return reply.redirect("/login");
};

internals.web_authentication = async function (req, reply) {
  try {
    let credentials = await Users.findOne({
      $and: [
        { email: req.payload.email },
        { password: Crypto.encrypt(req.payload.password) },
      ],
    }).lean();
    if (!credentials) {
      return reply.redirect(
        `/login?message=Invalid account!&alert=error&email=${req.payload.email}`
      );
    }
    const settings = await Settings.findOne({}).lean();
    credentials.position =
      credentials?.scope?.length > 1 ? credentials?.scope[0] : "";
    credentials.company_name = settings?.name;
    credentials.type = settings?.type;
    req.cookieAuth.set(credentials);
    return reply.redirect(`/${credentials.scope[0]}/dashboard`);
  } catch (error) {
    console.log("LOGIN_ERRO", error);
  }
};

module.exports = internals;
