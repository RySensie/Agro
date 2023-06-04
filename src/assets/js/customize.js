//DATA TABLE
$(document).ready(function () {
  //GLOBAL DATA TABLE
  ("use strict");
  $("#data-datatable").DataTable({
    dom: "Bfrtip",
    buttons: ["print"],
    language: {
      paginate: {
        previous: "<i class='mdi mdi-chevron-left'>",
        next: "<i class='mdi mdi-chevron-right'>",
      },
      info: "Showing agents _START_ to _END_ of _TOTAL_",
      lengthMenu:
        '<select class=\'form-select form-select-sm ms-1 me-1\'><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="-1">All</option></select>',
    },
    pageLength: 20,
    select: { style: "multi" },
    order: [[1, "desc"]],
    drawCallback: function () {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded"),
        $("#data-datatable_length label").addClass("form-label"),
        document.querySelector(".dataTables_wrapper .row");
    },
  });

  $("#grandtotal-datatable").DataTable({
    dom: "Bfrtip",
    buttons: ["print"],
    language: {
      paginate: {
        previous: "<i class='mdi mdi-chevron-left'>",
        next: "<i class='mdi mdi-chevron-right'>",
      },
      info: "Showing agents _START_ to _END_ of _TOTAL_",
      lengthMenu:
        '<select class=\'form-select form-select-sm ms-1 me-1\'><option value="50">20</option><option value="50">50</option><option value="100">100</option><option value="-1">All</option></select>',
    },
    pageLength: 40,
    select: { style: "multi" },
    drawCallback: function () {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded"),
        $("#data-datatable_length label").addClass("form-label"),
        document.querySelector(".dataTables_wrapper .row");
    },
  });
});

/******************************************************
 * ******************* VARIABLE **********************
 * ****************************************************/
let products = [];
let rowId;
let lastNote = "";
/******************************************************
 * ******************* FUNCTIONS **********************
 * ****************************************************/
function dataTable(table_name, index) {
  "use strict";
  $(`#${table_name}`).DataTable({
    language: {
      paginate: {
        previous: "<i class='mdi mdi-chevron-left'>",
        next: "<i class='mdi mdi-chevron-right'>",
      },
      info: "Showing agents _START_ to _END_ of _TOTAL_",
      lengthMenu:
        '<select class=\'form-select form-select-sm ms-1 me-1\'><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="-1">All</option></select>',
    },
    pageLength: 20,
    select: { style: "multi" },
    order: [[index, "desc"]],
    drawCallback: function () {
      $(".dataTables_paginate > .pagination").addClass("pagination-rounded"),
        $("#data-datatable_length label").addClass("form-label"),
        document
          .querySelector(".dataTables_wrapper .row")
          .querySelectorAll(".col-md-6")
          .forEach(function (e) {
            e.classList.add("col-sm-6"),
              e.classList.remove("col-sm-12"),
              e.classList.remove("col-md-6");
          });
    },
  });
}
function addProductTableRow(res, productTable, cartTable) {
  console.log('resss', res);
  //for add to cart button
  let elem = $(`
  <button class="btn btn-success btn-sm">
          Add to cart
      </button>
  `);
  elem.click(function () {
    let data = res;
    productTable.row($(this).parents("tr")).remove().draw();
    addCartTableRow(data, productTable, cartTable);
    //ADD 1 PRODUCT
    products.push({
      product_id: res._id,
      qty: 1,
      isReturn: res.isReturn,
    });
    //DISPLAY TOTAL
    $(`#cart-total-${data._id}`).html(data.price);
  });
  productTable.row
    .add([
      ` <img src="${res.img}" alt="contact-img" title="contact-img" class="rounded me-3" height="64" />
      <p class="m-0 d-inline-block align-middle font-16">
          <a href="apps-ecommerce-products-details.html" class="text-body">${res.name}</a>
          <br/>
          <small class="me-2"><b>Category:</b> ${res.category_id.name}</small>
              <small><b>Brand:</b> ${res.brand_id.name}
          </small>
      </p>`,
      res.unit_id.name,
      res.price,

      moment(res.expiry_date).format("MMMM DD, YYYY"),
      res.total,
      `<div id="product-btn-${res._id}"></div>`,
    ])
    .draw(false);
  $(`#product-btn-${res._id}`).append(elem);
}
function addCartTableRow(res, productTable, cartTable) {
  //REMOVE CART BTN
  let removeElem = $(`
      <a class="action-icon"> <i class="mdi mdi-delete"></i></a>
  `);
  removeElem.click(function () {
    let data = res;

    cartTable.row($(this).parents("tr")).remove().draw();
    addProductTableRow(res, productTable, cartTable);

    //REMOVE PRODUCT FROM CART
    products = products.filter((product) => {
      return product.product_id != data._id;
    });
    totalProductsCostAdd();
  });
  //CHANGE PRODUCT QUANTITY
  let qtyElem = $(`
    <input type="number" class="form-control" placeholder="Qty" value="1" max=${res.total} style="width: 90px;">
  `);
  qtyElem.change(function () {
    const data = res;
    //INNPUT MIN AND MAX OF PRODUCT STOCKS
    if (this.value > data.total) {
      this.value = data.total;
    } else if (this.value < 1) {
      this.value = 1;
    }
    //UPDATE PRODUCT QUANTITY
    products.map((product) => {
      if (data._id == product.product_id) {
        product.qty = parseInt(this.value);
        //product.total = parseInt(this.value * data.price);
        return product;
      }
    });
    //DISPLAY TOTAL
    $(`#cart-total-${data._id}`).html(parseInt(data.price * this.value));
    totalProductsCostAdd();
  });

  //DATE RETURN
  let inputDateReturn = $(`
    <input type="date" class="form-control" style="width: 120px;">
  `);
  inputDateReturn.change(function () {
    const data = res;
    //UPDATE DATE RETURN
    products.map((product) => {
      if (data._id == product.product_id) {
        product.returnDate = this.value;
        return product;
      }
    });
  });
console.log('resssss 1', res);
  cartTable.row
    .add([
      `<img src="${res.img}" alt="contact-img" title="contact-img" class="rounded me-3" height="64" />
      <p class="m-0 d-inline-block align-middle font-16">
          <a href="apps-ecommerce-products-details.html" class="text-body">${res.name}</a>
          <br/>
          <small class="me-2"><b>Category:</b> ${res.category_id.name}</small>
              <small><b>Brand:</b> ${res.brand_id.name}
          </small>
      </p>`,
      res.unit_id.name,
      res.price,
      res.total,
      // `<div id="cart-date-return-${res._id}"></div>`,
      `<div id="cart-qty-${res._id}"></div>`,
      `<div id="cart-total-${res._id}" class="totalProductsAdded"></div>`,
      `<div id="cart-remove-${res._id}" style="width:40px"></div>`,
    ])
    .draw(false);
  $(`#cart-qty-${res._id}`).append(qtyElem);
  $(`#cart-remove-${res._id}`).append(removeElem);
  res.isReturn ? $(`#cart-date-return-${res._id}`).append(inputDateReturn) : "";
}

function totalProductsCostAdd() {
  let total = 0;
  var elts = document.getElementsByClassName("totalProductsAdded");
  for (var i = 0; i < elts.length; ++i) {
    total += parseInt(elts[i].innerHTML);
  }
  $("#totalCartProducts").html(total);
}

function dispalyEverySalesInTable(res, salesTable, type = false) {
  //TOTAL
  if (type) {
    salesTable.row.add([`Total`, "", "", "", res, ``, ``]).draw(false);
    return;
  }
  //REMOVE SALES BTN
  let removeSales = $(`
    <a class="action-icon"> <i class="mdi mdi-delete"></i></a>
  `);
  //RETURN SALES BTN
  let returnSales = $(`
    <a class="text-danger action-icon"> <i class="mdi mdi-atom-variant"></i></a>
  `);
  removeSales.click(function () {
    const data = res;
    delete_data("/client/product/remove/", data._id);
  });
  returnSales.click(function () {
    const data = res;
    console.log("data", data);
    let sales_info = `
      <h3 class="text-center">${data.product_id.name}</h3>
      <div class="col-4">
        <h5>Delivery Date : ${moment(data.delivery_date).format(
          "MMM DD, YYYY"
        )}</h5>
        <h5 >Status: <span class="text-success">${data.status}</span> </h5>
        <h5 >Code: <span class="text-danger">${data.code}</span> </h5>
      </div>
    `;
    $("#sales_id").val(data._id);
    $("#product_id").val(data.product_id._id);
    $("#product_price").val(data.product_id.price);
    $("#product_qty").val(data.qty);
    $(`#sales_info`).append(sales_info);
    $("#modal-delivery-body").html("");
    $(`#modal-delivery`).modal("show");
  });

  salesTable.row
    .add([
      `<img src="${res.product_id.img}" alt="contact-img" title="contact-img" class="rounded me-3" height="64" />
    <p class="m-0 d-inline-block align-middle font-16">
        <a href="apps-ecommerce-products-details.html" class="text-body">${res.product_id.name}</a>
        <br/>
        <small class="me-2"><b>Category:</b> ${res.product_id.category_id.name}</small>
            <small><b>Brand:</b> ${res.product_id.brand_id.name}
        </small>
     </p>`,
      moment(res.createdAt).format("MMM DD, YYYY"),
      res?.price || 0,
      res.qty,
      res.qty * res?.price || 0,
      `<span class="badge bg-${
        res.status == "accepted" ? "success" : "danger"
      }">${res.status}</span>`,
      `<div id="remove-${res._id}"></div>
      <div id="returnSales-${res._id}"></div>`,
    ])
    .draw(false)
    .node().id = res._id;

  if (res.status != "accepted") {
    $(`#remove-${res._id}`).append(removeSales);
  } else {
    $(`#returnSales-${res._id}`).append(returnSales);
  }
}
function appendRowSales(res, cartTable) {
  console.log("res", res);
  if (res.firstName || res.lastName) {
    cartTable.row
      .add([
        `Customer name: ${res.firstName ? res.firstName : ""} ${
          res.lastName ? res.lastName : ""
        }`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ])
      .draw(false);

    cartTable.row
      .add([
        `Date: ${moment(res.createdAt).format("MMM DD, YYYY")}`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ])
      .draw(false);
    return;
  }

  products.push({
    _id: res._id,
    qty: res.qty,
    returnDate: res.returnDate
      ? moment(res.returnDate).format("YYYY-MM-DD")
      : null,
  });
  //REMOVE CART BTN
  let removeElem = $(`
      <a class="action-icon"> <i class="mdi mdi-delete"></i></a>
  `);
  removeElem.click(function () {
    let data = res;
    cartTable.row($(this).parents("tr")).remove().draw();
    //REMOVE PRODUCT FROM CART
    products = products.map((product) => {
      if (product._id == data._id) {
        product.status = "cancel";
      }
      return product;
    });
  });
  //CHANGE PRODUCT QUANTITY
  let qtyElem = $(`
    <input type="number" class="form-control" placeholder="Qty" value="${res.qty}" style="width: 90px;" disabled>
  `);
  qtyElem.change(function () {
    const data = res;
    //INNPUT MIN AND MAX OF PRODUCT STOCKS
    if (this.value > data.total) {
      this.value = data.total;
    } else if (this.value < 1) {
      this.value = 1;
    }
    //UPDATE PRODUCT QUANTITY
    products.map((product) => {
      if (data._id == product._id) {
        product.qty = parseInt(this.value);
        //product.total = parseInt(this.value * data.price);
        return product;
      }
    });
    //DISPLAY TOTAL
    $(`#cart-total-${data._id}`).html(parseInt(data.price * this.value));
  });
  //DATE RETURN
  let inputDateReturn = $(`
    <input type="date" class="form-control" style="width: 120px;" value="${
      res.returnDate ? moment(res.returnDate).format("YYYY-MM-DD") : null
    }">
  `);
  inputDateReturn.change(function () {
    const data = res;
    //UPDATE DATE RETURN
    products.map((product) => {
      if (data._id == product._id) {
        product.returnDate = this.value;
        return product;
      }
    });
  });

  cartTable.row
    .add([
      res?.name
        ? `<img src="${res.img}" alt="contact-img" title="contact-img" class="rounded me-3" height="64" />
      <p class="m-0 d-inline-block align-middle font-16">
          <a href="apps-ecommerce-products-details.html" class="text-body">${res.name}</a>
          <br/>
          <small class="me-2"><b>Category:</b> ${res.category}</small>
              <small><b>Brand:</b> ${res.brand} 
          </small>
      </p>`
        : res?.total
        ? "<b>Total</b>"
        : "",
      res?.expiry_date ? `<span>${moment(res.expiry_date).format("lll") }</span>`: "",
      res?.price ?? "",
      res?.unit ?? "",
      res?.stocks ?? "",
      res?.type
        ? res?.qty
        : res?._id
        ? `<div id="cart-qty-${res?._id}"></div>`
        : "",
      res?.price
        ? `<div id="cart-total-${res?._id}">${res?.qty * res?.price}</div>`
        : res?.total
        ? res.total
        : "",
      // `<div id="cart-date-return-${res._id}"></div>`,
      res?._id
        ? `<div id="cart-remove-${res?._id}" style="width:40px"></div>`
        : "",
    ])
    .draw(false);
  $(`#cart-qty-${res._id}`).append(qtyElem);
  $(`#cart-remove-${res._id}`).append(removeElem);
  res.isReturn ? $(`#cart-date-return-${res._id}`).append(inputDateReturn) : "";
}
function appendRowReceipt(res, cartTable) {
  if (res.firstName || res.lastName) {
    cartTable.row
      .add([
        `Customer name: ${res.firstName ? res.firstName : ""} ${
          res.lastName ? res.lastName : ""
        }`,
        "",
        "",
        "",
        "",
        "",
        "",
      ])
      .draw(false);

    cartTable.row
      .add([
        `Date: ${moment(res.createdAt).format("MMM DD, YYYY")}`,
        "",
        "",
        "",
        "",
        "",
        "",
      ])
      .draw(false);
    return;
  }

  products.push({
    _id: res._id,
    qty: res.qty,
    returnDate: res.returnDate
      ? moment(res.returnDate).format("YYYY-MM-DD")
      : null,
  });
  //REMOVE CART BTN
  let removeElem = $(`
      <a class="action-icon"> <i class="mdi mdi-delete"></i></a>
  `);
  removeElem.click(function () {
    let data = res;
    cartTable.row($(this).parents("tr")).remove().draw();
    //REMOVE PRODUCT FROM CART
    products = products.map((product) => {
      if (product._id == data._id) {
        product.status = "cancel";
      }
      return product;
    });
  });
  //CHANGE PRODUCT QUANTITY
  let qtyElem = $(`
    <input type="number" class="form-control" placeholder="Qty" value="${res.qty}" style="width: 90px;" disabled>
  `);
  qtyElem.change(function () {
    const data = res;
    //INNPUT MIN AND MAX OF PRODUCT STOCKS
    if (this.value > data.total) {
      this.value = data.total;
    } else if (this.value < 1) {
      this.value = 1;
    }
    //UPDATE PRODUCT QUANTITY
    products.map((product) => {
      if (data._id == product._id) {
        product.qty = parseInt(this.value);
        //product.total = parseInt(this.value * data.price);
        return product;
      }
    });
    //DISPLAY TOTAL
    $(`#cart-total-${data._id}`).html(parseInt(data.price * this.value));
  });
  //DATE RETURN
  let inputDateReturn = $(`
    <input type="date" class="form-control" style="width: 120px;" value="${
      res.returnDate ? moment(res.returnDate).format("YYYY-MM-DD") : null
    }">
  `);
  inputDateReturn.change(function () {
    const data = res;
    //UPDATE DATE RETURN
    products.map((product) => {
      if (data._id == product._id) {
        product.returnDate = this.value;
        return product;
      }
    });
  });

  cartTable.row
    .add([
      res?.name
        ? `<img src="${res.img}" alt="contact-img" title="contact-img" class="rounded me-3" height="64" />
      <p class="m-0 d-inline-block align-middle font-16">
          <a href="apps-ecommerce-products-details.html" class="text-body">${res.name}</a>
          <br/>
          <small class="me-2"><b>Category:</b> ${res.category}</small>
              <small><b>Brand:</b> ${res.brand}
          </small>
      </p>`
        : res?.total
        ? "<b>Total</b>"
        : "",
        res?.expiry_date ? `<span>${moment(res.expiry_date).format("lll") }</span>`: "",
      res?.price ?? "",
      res?.unit ?? "",
      res?.type
        ? res?.qty
        : res?._id
        ? `<div id="cart-qty-${res?._id}"></div>`
        : "",
      res?.price
        ? `<div id="cart-total-${res?._id}">${res?.qty * res?.price}</div>`
        : res?.total
        ? res.total
        : "",
      // `<div id="cart-date-return-${res._id}"></div>`,
      // res?._id
      //   ? `<div id="cart-remove-${res?._id}" style="width:40px"></div>`
      //   : "",
    ])
    .draw(false);
  $(`#cart-qty-${res._id}`).append(qtyElem);
  $(`#cart-remove-${res._id}`).append(removeElem);
  res.isReturn ? $(`#cart-date-return-${res._id}`).append(inputDateReturn) : "";
}
function appendAllSales(
  res,
  tableName,
  status,
  salesBtnName,
  deliveryDate,
  prints
) {
  res.createdAtDate = moment(res.createdAt).format("MMM DD, YYYY");
  res.createdAtTime = moment(res.createdAt).format("HH:MM");
  let salebtn = salesBtnName;
  let deliverybtn = deliveryDate;
  let print_btn = prints;
  console.log("resssssssssssssssssssssss", res);
  let viewOrEdit = $(`
    <button type="button" class="btn btn-success">
      <i class="mdi mdi-cart-outline"></i>
    </button>
  `);
  let deliverbtn = $(`
    <button type="button" class="btn btn-primary">
      <i class="mdi mdi-calendar-today"></i>
    </button>
  `);
  let printBtn = $(`
  <button type="button" class="btn btn btn-warning">
    <i class="uil-print"></i>
  </button>
`);
  viewOrEdit.click(function () {
    let total = 0;
    const data = res;
    rowId = res.userId;
    products = [];
    $("#modal-product-body").html("");
    $(`#modal-product`).modal("show");
    $("#data-datatable").DataTable().rows().remove();
    console.log("resssssssssssssssssss", data);
    renderPrint(data);
    res.salesDb.map((r) => {
      total += r.qty * r.price;
      appendRowSales({ ...r, type: true }, $("#data-datatable").DataTable());
    });

    appendRowSales({ qty: 1, total }, $("#data-datatable").DataTable());
    appendRowSales(
      { firstName: res.firstName || "", lastName: res.lastName },
      $("#data-datatable").DataTable()
    );
  });
  deliverbtn.click(function () {
    let total = 0;
    const data = res;
    let _id = res.userId;
    products = [];
    $("#modal-delivery-body").html("");
    $(`#modal-delivery`).modal("show");
    $("#user_id").val(_id);
  });
  printBtn.click(function () {
    $("#info").empty();
    $("#invoice_receipt").empty();
    $("#cart_container_view").empty();
    // let total = 0;
    const data = res;
    let total = 0;
    rowId = res.userId;
    products = [];
    let _id = res.userId;

    console.log("dataaaaaaaa", data);
    $(`#modal-receipt`).modal("show");
    // $('#modal-receipt').modal({backdrop: 'static', keyboard: false}, 'show');
    // $('#modal-receipt').modal({backdrop: 'static', keyboard: false, })

    let customer_info = `              
    <span class="font-18">Date: </span><span class="font-18"  id="dates">${moment(
      data.salesDb[0].delivery_date
    ).format("MMM DD, YYYY")}</span><br />
    <span class="font-18">Customer</span><span> : </span
    ><span class="font-18" id="stokistfname"> ${data.firstName} ${
      data.lastName
    }</span
    ><span class="ms-1 font-18" id="stokistlname"></span><br />
    <span class="font-18">Address : ${data.address}<br /></span>`;

    $("#customer_info").append(customer_info);

    // $("#data-datatables").DataTable().rows().remove();
    res.salesDb.map((r) => {
      total += r.qty * r.price;
      appendRowReceipt({ ...r, type: true }, $("#data-datatables").DataTable());
    });

    appendRowReceipt({ qty: 1, total }, $("#data-datatables").DataTable());
  });
  let dv_date;
  if (res.salesDb[0].delivery_date != null) {
    dv_date = `${moment(res.salesDb[0].delivery_date).format("MMM DD, YYYY")}`;
  } else {
    dv_date = `<span class="text-danger">Assign delivery date</span> `;
  }
  tableName.row
    .add([
      `<img src="${
        res.profile_img
      }" alt="contact-img" title="contact-img" class="rounded me-3" height="38"/>
      <p class="m-0 d-inline-block align-middle font-16">
      ${
        res.firstName ? res.firstName : res.email ? res.email : res.phoneNumber
      } ${res.lastName ? res.lastName : ""}
      </p>`,
      `${res.address}`,
      `${res.createdAtDate}<small class="text-muted"> ${res.createdAtTime}</small>`,
      `${res.total}`,
      `${res.note ? res.note : ""}`,
      `<span class="badge badge-${
        status == "pending" ? "warning" : "success"
      }-lighten p-1">${status}</span>`,
      `${dv_date}`,
      `<div> 
      <a id="viewOrEdit-${res.userId}"></a>
      <a id="deliverbtn-${res.userId}"></a>
      <a id="printBtn-${res.userId}"></a>
      </div>`,
    ])
    .draw(false)
    .node().id = res.userId;
  $(`#viewOrEdit-${res.userId}`).append(viewOrEdit);
  $(`#deliverbtn-${res.userId}`).append(deliverbtn);
  $(`#printBtn-${res.userId}`).append(printBtn);
}
function renderPrint(data) {
  $("#invoice_receipt").empty();
  $("#cart_container_view").empty();
  // let total = 0;
  let total = 0;
  // rowId = data.userId;
  products = [];
  // let _id = data.userId;
  console.log("print dataaaaaaaaaaaaa", data);
  let customer_info = `              
  <span class="font-18">Date: </span><span class="font-18"  id="dates">${moment(
    data.salesDb[0].delivery_date
  ).format("MMM DD, YYYY")}</span><br />
  <span class="font-18">Customer</span><span> : </span
  ><span class="font-18" id="stokistfname"> ${data.firstName} ${
    data.lastName
  }</span
  ><span class="ms-1 font-18" id="stokistlname"></span><br />
  <span class="font-18">Address : ${data.address}<br /></span>`;

  $("#customer_info").append(customer_info);

  $("#data-datatables").DataTable().rows().remove();
  data.salesDb.map((r) => {
    total += r.qty * r.price;
    appendRowReceipt({ ...r, type: true }, $("#data-datatables").DataTable());
  });

  appendRowReceipt({ qty: 1, total }, $("#data-datatables").DataTable());
}
function comma(data) {
  data = parseFloat(data);
  data = data.toFixed(2);
  return data.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}
function appendRowSalesReturn(res, cartTable) {
  products.push({
    _id: res._id,
    qty: res.qty,
    returnDate: res.returnDate
      ? moment(res.returnDate).format("YYYY-MM-DD")
      : null,
  });
  //REMOVE CART BTN
  let returnNow = $(`
      <button class="btn btn-success">
      <i class="mdi dripicons-return"/> Return item
      </button>
  `);
  returnNow.click(function () {
    const data = res;
    //ACCEPT THE RETURN ITEM
    acceptReturnItem(data);
  });
  //CHANGE PRODUCT QUANTITY
  let qtyElem = $(`
    <input type="number" class="form-control" placeholder="Qty" value="${res.qty}" style="width: 90px;" disabled>
  `);
  qtyElem.change(function () {
    const data = res;
    //INNPUT MIN AND MAX OF PRODUCT STOCKS
    if (this.value > data.total) {
      this.value = data.total;
    } else if (this.value < 1) {
      this.value = 1;
    }
    //UPDATE PRODUCT QUANTITY
    products.map((product) => {
      if (data._id == product._id) {
        product.qty = parseInt(this.value);
        //product.total = parseInt(this.value * data.price);
        return product;
      }
    });
    //DISPLAY TOTAL
    $(`#cart-total-${data._id}`).html(parseInt(data.price * this.value));
  });
  //DATE RETURN
  let inputDateReturn = $(`
    <input type="date" class="form-control" style="width: 125px;" value="${
      res.returnDate ? moment(res.returnDate).format("YYYY-MM-DD") : null
    }" disabled>
  `);
  inputDateReturn.change(function () {
    const data = res;
    //UPDATE DATE RETURN
    products.map((product) => {
      if (data._id == product._id) {
        product.returnDate = this.value;
        return product;
      }
    });
  });

  cartTable.row
    .add([
      `<img src="${res.img}" alt="contact-img" title="contact-img" class="rounded me-3" height="64" />
      <p class="m-0 d-inline-block align-middle font-16">
          <a href="apps-ecommerce-products-details.html" class="text-body">${res.name}</a>
          <br/>
          <small class="me-2"><b>Category:</b> ${res.category}</small>
              <small><b>Brand:</b> ${res.brand}
          </small>
      </p>`,
      res.price,
      res.stocks,
      `<div id="cart-qty-${res._id}"></div>`,
      `<div id="cart-total-${res._id}">${res.qty * res.price}</div>`,
      `<div id="cart-date-return-${res._id}"></div>`,
      `<div id="cart-remove-${res._id}"></div>`,
    ])
    .draw(false);
  $(`#cart-qty-${res._id}`).append(qtyElem);
  $(`#cart-remove-${res._id}`).append(returnNow);
  res.isReturn ? $(`#cart-date-return-${res._id}`).append(inputDateReturn) : "";
}
function appendAllSalesToReturn(res, tableName, status, salesBtnName) {
  res.createdAtDate = moment(res.createdAt).format("MMM DD, YYYY");
  res.createdAtTime = moment(res.createdAt).format("HH:MM");
  let viewOrEdit = $(`
    <button type="button" class="btn btn-success btn-sm">
      <i class="mdi mdi-cart-outline"></i> ${salesBtnName}
    </button>
  `);
  viewOrEdit.click(function () {
    const data = res;
    rowId = res.userId;
    products = [];
    $("#modal-product-body").html("");
    $(`#modal-product`).modal("show");
    $("#data-datatable").DataTable().rows().remove();
    res.salesDb.map((r) => {
      appendRowSalesReturn(r, $("#data-datatable").DataTable());
    });
  });

  tableName.row
    .add([
      `<img src="${
        res.profile_img
      }" alt="contact-img" title="contact-img" class="rounded me-3" height="38"/>
      <p class="m-0 d-inline-block align-middle font-16">
      ${
        res.firstName ? res.firstName : res.email ? res.email : res.phoneNumber
      } ${res.lastName ? res.lastName : ""}
      </p>`,
      `${res.createdAtDate}<small class="text-muted"> ${res.createdAtTime}</small>`,
      `${res.total}`,
      `<span class="badge badge-${
        status == "pending" ? "warning" : "success"
      }-lighten p-1">${status}</span>`,
      `<div id="viewOrEdit-${res.userId}"></div>`,
    ])
    .draw(false)
    .node().id = res.userId;
  $(`#viewOrEdit-${res.userId}`).append(viewOrEdit);
}
function appendRowTopSales(res, tableName) {
  $(`#${tableName}`).append(`
  <tr>
  <td>
    <h5 class="font-14 my-1 fw-normal">
      ${res.name}
    </h5>
    <span class="text-muted font-13">Category: ${res.category} / Brand: ${res.brand}</span>
  </td>
  <td>
    <h5 class="font-14 my-1 fw-normal">₱${res.price}</h5>
    <span class="text-muted font-13">Price</span>
  </td>
  <td>
    <h5 class="font-14 my-1 fw-normal">${res.qty}</h5>
    <span class="text-muted font-13">Quantity</span>
  </td>
  <td>
    <h5 class="font-14 my-1 fw-normal">₱${res.subTotal}</h5>
    <span class="text-muted font-13">Amount</span>
  </td>
</tr>`);
}
/******************************************************
 * ******************* AJAX **********************
 * ****************************************************/

function checkOutProduct() {
  if (products == "") {
    return errorSweetAlert();
  } else {
    $.ajax({
      type: "POST",
      url: "/admin/checkout",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(products),
      success: function (res) {
        if (res.type == "danger" || res.type == "error") {
          return errorSweetAlert();
        }
        // window.location.href =
        //   "/admin/dashboard?message=Successfully checkout.&alert=success";
      },
    }).fail(function (res) {
      errorSweetAlert();
    });
  }
  $(`#modal-product`).modal("hide");
  $(`#modal-receipt`).modal("show");
  renderPrint();
}

function addToCart() {
  if (products == "") {
    return errorSweetAlert();
  } else {
    //add note every products
    products = products.map((r) => {
      r.note = $("#productNote").val();
      return r;
    });
    $.ajax({
      type: "POST",
      url: "/client/addToCart",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(products),
      success: function (res) {
        window.location.href =
          "/client/dashboard?message=Successfully add to cart.&alert=success";
      },
    }).fail(function (res) {
      errorSweetAlert();
    });
  }
}
function getOneProduct(endpoints, id) {
  $.ajax({
    type: "GET",
    url: endpoints + id,
    dataType: "json",
    contentType: "application/json",
    success: function (res) {
      $(".unitSpan").html(res.unit_id.name);
    },
  }).fail(function (res) {
    errorSweetAlert();
  });
}
function geSalesApproved(endpoints, id) {
  $.ajax({
    type: "GET",
    url: endpoints + id,
    dataType: "json",
    contentType: "application/json",
    success: function (res) {
      // $(".unitSpan").html(res.unit_id.name);

      res.forEach((e) => {
        let saleOption = `
        <option value="${e._id}">${e.product_id.name} - ${e.qty} (${moment(
          e.approve_date
        ).format("lll")})</option>
      `;

        $("#displaySales").append(saleOption);
      });
      console.log("resssss", res);
    },
  }).fail(function (res) {
    errorSweetAlert();
  });
}
// function getselectedSales(endpoints, id) {
//   $.ajax({
//     type: "GET",
//     url: endpoints + id,
//     dataType: "json",
//     contentType: "application/json",
//     success: function (res) {
//       console.log("res", res);
//       let options = {};
//       res.map((r) => {
//         // $('#selcted_sales').append(`<option value="${r._id}">${r.product_id.name}- QTY:${r.qty}</option>`);
//         var o = new Option(`"${r.product_id.name}- QTY:${r.qty}", "${r._id}`);
//         /// jquerify the DOM object 'o' so we can use the html method
//         $(o).html("option text");
//         $("#selcted_sales").append(o);
//         // $("#selcted_sales").append(
//         //   new Option(`"${r.product_id.name}- QTY:${r.qty}", "${r._id}`)
//         // );
//       });
//     },
//   }).fail(function (res) {
//     errorSweetAlert();
//   });
// }

//SWEET ALERT CONFIG
function errorSweetAlert() {
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: "Something went wrong!",
  });
}
function sweetAlertMixinConfig() {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
  return Toast;
}
//END
function delete_data(endpoints, _id) {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        type: "POST",
        url: endpoints + _id,
        dataType: "json",
        data: null,
        success: function (result) {
          //remove row in table
          if (result.status) {
            var table = $("#data-datatable").DataTable();
            table
              .row($(`#${_id}`))
              .remove()
              .draw();
          }
          //show alert message
          const Toast = sweetAlertMixinConfig();
          Toast.fire({
            icon: result.icon,
            title: result.message,
          });
        },
      }).fail(function (res) {
        errorSweetAlert();
      });
    }
  });
}

function acceptReturnItem(data) {
  Swal.fire({
    title: "Are you sure this item is return?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, accept it!",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        type: "POST",
        url: `/admin/accept-return-item/${data._id}`,
        dataType: "json",
        data: null,
        success: function (result) {
          //remove row in table
          if (result.message == "success") {
            window.location.href =
              "/admin/return-item?message=Successfully accepted.&alert=success";
          }
        },
      }).fail(function (res) {
        errorSweetAlert();
      });
    }
  });
}
