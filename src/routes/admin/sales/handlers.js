"use strict";

var internals = {};
const { Users, Sales, Stocks } = require("@models");
const Crypto = require("@lib/Crypto");
const _ = require("lodash");

function getTotal(sales) {
  let totalCost = 0,
    totalPrice = 0;
  sales.map((r) => {
    // console.log(r);
    totalCost += r.cost ? r.cost : 0;
    totalPrice += r.product_id.price ? r.product_id.price : 0;
  });
  return { totalCost, totalPrice };
}

internals.index = async function (req, reply) {
  var condition = {
    $expr: {
      $or: [
        {
          $and: [
            { status: "accepted" },
            { isReturn: true },
            { isAcceptReturn: true },
          ],
        },
        {
          $and: [
            { status: "accepted" },
            { isReturn: false },
            { isAcceptReturn: false },
          ],
        },
      ],
    },
  };
  // var condition = { status: "accepted" };
  const stocks = await Stocks.find({}).lean();

  let sales = await Sales.find(condition)
    .populate({
      path: "product_id user_id",
      populate: [
        {
          path: "brand_id",
          model: "brand",
        },
        {
          path: "category_id",
          model: "category",
        },
        {
          path: "unit_id",
          model: "unit",
        },
      ],
    })
    .lean();
  console.log("SALESSS", sales);

  let members = await Users.countDocuments({ scope: ["client"] });

  const salesConsume = await Sales.aggregate([
    {
      $match: {
        $expr: {
          $or: [
            {
              $and: [
                { isAcceptReturn: true },
                { isReturn: true },
                { status: "accepted" },
              ],
            },
            {
              $and: [{ isReturn: false }, { status: "accepted" }],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: "$product_id",
        total: { $sum: "$qty" },
      },
    },
  ]);

  sales = sales.map((sale) => {
    stocks.map((s) => {
      salesConsume.map((c) => {
        const consume = Math.abs(s.qty - c.total);

        if (
          String(s.product_id) == String(sale.product_id._id) &&
          String(s.product_id) == String(c._id) &&
          consume > 0
        ) {
          sale.cost = s.cost;
        }
      });
    });
    return sale;
  });
  //console.log(sales);
  const uniqueName = sales.filter((r, index) => {
    if (
      index !== sales.map((s) => s.product_id._id).indexOf(r.product_id._id)
    ) {
      return;
    }
    return r;
  });
  uniqueName.map((u) => {
    u.totalSales = 0;
    sales.map((s) => {
      if (u.product_id._id == s.product_id._id) {
        u.totalSales += s.qty * s.product_id.price;
      }
    });
    return u;
  });

  let cnt = 0;
  const labelsProduct = uniqueName.map((r) => r.product_id.name);
  const totalProduct = uniqueName.map((r) => r.totalSales);
  const colorProduct = uniqueName.map((r) => {
    cnt++;
    return `rgba(${cnt}5${cnt}, ${cnt}${cnt}, 131, 1)-`;
  });

  return reply.view("admin/sales/index.html", {
    credentials: req.auth.credentials,
    sales,
    members,
    totalCost: getTotal(sales).totalCost,
    totalPrice: getTotal(sales).totalPrice,
    labelsProduct,
    totalProduct,
    colorProduct,
  });
};

internals.search = async function (req, reply) {
  let condition = [{}];
  let members = 1;
  let selected_user,
    selected_startDate,
    selected_endDate,
    isSearch,
    isSearchName = false,
    isSearchDate = false;
  if (
    !_.isEmpty(req.payload.startDate) &&
    !_.isEmpty(req.payload.endDate) &&
    !_.isEmpty(req.payload.user_id)
  ) {
    let start = new Date(req.payload.startDate);
    let end = new Date(req.payload.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    selected_startDate = start;
    (selected_endDate = end), (isSearch = true);
    isSearchName = true;
    isSearchDate = true;
    condition = [
      { approve_date: { $gte: start, $lt: end } },
      { user_id: req.payload.user_id },
      {
        $or: [
          { $and: [{ status: "accepted" }, { isReturn: false }] },
          {
            $and: [
              { status: "accepted" },
              { isReturn: true },
              { isAcceptReturn: true },
            ],
          },
        ],
      },
    ];
    selected_user = await Users.findOne({ _id: req.payload.user_id }).lean();
  } else if (!_.isEmpty(req.payload.user_id)) {
    selected_user = await Users.findOne({ _id: req.payload.user_id }).lean();
    isSearch = true;
    isSearchName = true;
    condition = [
      { user_id: req.payload.user_id },
      {
        $or: [
          { $and: [{ status: "accepted" }, { isReturn: false }] },
          {
            $and: [
              { status: "accepted" },
              { isReturn: true },
              { isAcceptReturn: true },
            ],
          },
        ],
      },
    ];
  } else if (req.payload.startDate && req.payload.endDate) {
    members = await Users.countDocuments({ scope: ["client"] });
    let start = new Date(req.payload.startDate);
    let end = new Date(req.payload.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    selected_startDate = start;
    (selected_endDate = end), (isSearch = true);
    isSearchDate = true;
    condition = [
      { approve_date: { $gte: start, $lt: end } },
      {
        $or: [
          { $and: [{ status: "accepted" }, { isReturn: false }] },
          {
            $and: [
              { status: "accepted" },
              { isReturn: true },
              { isAcceptReturn: true },
            ],
          },
        ],
      },
    ];
  } else if (!_.isEmpty(req.payload.startDate)) {
    members = await Users.countDocuments({ scope: ["client"] });
    let start = new Date(req.payload.startDate);
    var today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);

    condition = [
      { approve_date: { $gte: start, $lt: today } },
      {
        $or: [
          { $and: [{ status: "accepted" }, { isReturn: false }] },
          {
            $and: [
              { status: "accepted" },
              { isReturn: true },
              { isAcceptReturn: true },
            ],
          },
        ],
      },
    ];
  }
  const stocks = await Stocks.find({}).lean();

  let sales = await Sales.find({
    $and: condition,
  })
    .populate("user_id product_id")
    .lean();

  const salesConsume = await Sales.aggregate([
    {
      $match: {
        $or: [
          {
            $and: [
              { isAcceptReturn: true },
              { isReturn: true },
              { status: "accepted" },
            ],
          },
          {
            $and: [{ isReturn: false }, { status: "accepted" }],
          },
        ],
      },
    },
    {
      $group: {
        _id: "$product_id",
        total: { $sum: "$qty" },
      },
    },
  ]);

  sales = sales.map((sale) => {
    stocks.map((s) => {
      salesConsume.map((c) => {
        const consume = s.qty - c.total;

        if (
          String(s.product_id) == String(sale.product_id._id) &&
          String(s.product_id) == String(c._id) &&
          consume > 0
        ) {
          sale.cost = s.cost;
        }
      });
    });
    return sale;
  });

  return reply.view("admin/sales/index.html", {
    credentials: req.auth.credentials,
    sales,
    members,
    totalCost: getTotal(sales).totalCost,
    totalPrice: getTotal(sales).totalPrice,
    selected_user,
    selected_startDate,
    selected_endDate,
    isSearch,
    isSearchDate,
    isSearchName,
  });
};
module.exports = internals;
