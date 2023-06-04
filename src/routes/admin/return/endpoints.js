"use strict";
/**
 * ## Imports
 *
 */
//Handle the endpoints
var Handlers = require("./handlers"),
  internals = {};

const CONFIG = {
  auth: {
    strategy: "standard",
    scope: ["admin"],
  },
  tags: ["api"],
};

let endpoints = [
  {
    method: ["GET"],
    path: "/admin/return",
    handler: Handlers.index,
  },
  {
    method: ["POST"],
    path: "/admin/return/confirm",
    handler: Handlers.confirm,
  },
  // {
  //   method: ["POST"],
  //   path: "/admin/stocks/update/{_id}",
  //   handler: Handlers.update,
  // },
  // {
  //   method: ["POST"],
  //   path: "/admin/stocks/delete/{_id}",
  //   handler: Handlers.delete,
  // },
];

internals.endpoints = endpoints.map((r) => {
  if (!!r.config) r.config = { ...CONFIG, ...r.config };
  else r.config = { ...CONFIG };
  return r;
});

module.exports = internals;
