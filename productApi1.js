let express = require("express");
let app = express();
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS,PUT,PATCH,DELETE,HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept"
  );
  next();
});
const port = process.env.PORT || 2410;
app.listen(port, () => console.log(`Node app listening on port ${port}!`));

const { Client } = require("pg");
const client = new Client({
  user: "postgres",
  password: "sampita123*",
  port: 5432,
  host: "db.exsooxwehydzqqxtlknu.supabase.co",
  ssl: { rejectUnauthorized: false },
});
client.connect(function (res, error) {
  console.log(`connected!!!`);
});

app.get("/shops", function (req, res, next) {
  const query = "SELECT * FROM shoptable";
  client.query(query, function (err, result) {
    if (err) res.status(404).send(err);
    else res.send(result.rows);
  });
});
app.post("/shops", function (req, res, next) {
  const query = "SELECT * FROM shoptable";
  client.query(query, function (err, result) {
    if (err) res.status(404).send(err);
    else {
      let arr = result.rows;
      let maxId = arr.reduce(
        (acc, curr) => (curr.shopid > acc ? curr.shopid : acc),
        0
      );
      let newId = maxId + 1;
      let body = { shopid: newId, ...req.body };
      let values = Object.values(body);
      const query = "INSERT INTO shoptable(shopid,name,rent) VALUES ($1,$2,$3)";
      client.query(query, values, function (err, result) {
        if (err) res.status(404).send(err);
        else res.send(body);
      });
    }
  });
});

app.get("/products", function (req, res, next) {
  const query = "SELECT * FROM products";
  client.query(query, function (err, result) {
    if (err) res.status(404).send(err);
    else res.send(result.rows);
  });
});
app.post("/products", function (req, res) {
  const query = "SELECT * FROM products";
  client.query(query, function (err, result) {
    if (err) res.status(404).send(err);
    else {
      let arr = result.rows;
      let maxId = arr.reduce(
        (acc, curr) => (curr.productid > acc ? curr.productid : acc),
        0
      );
      let newId = maxId + 1;
      let body = { productid: newId, ...req.body };
      let values = Object.values(body);
      const query =
        "INSERT INTO products (productid,productname,category,description) VALUES ($1,$2,$3,$4)";
      client.query(query, values, function (err, result) {
        if (err) res.status(404).send(err);
        else res.send(body);
      });
    }
  });
});

app.put("/products/:id", function (req, res, next) {
  let id = +req.params.id;
  let body = req.body;
  let val = [body.productname,body.category,body.description, id];
  const query =
    `UPDATE products SET productname=$1,category=$2,description=$3 WHERE productid=$4`;
  client.query(query, val, function (err, result) {
    if (err) res.status(404).send(err);
    else res.send({ productid: id, ...req.body });
  });
});
app.get("/products/:id", function (req, res, next) {
  let id = +req.params.id;
  const query = "SELECT * FROM products WHERE productid=$1";
  client.query(query, [id], function (err, result) {
    if (err) res.status(404).send(err);
    else res.send(result.rows);
  });
});

app.get("/purchases", function (req, res, next) {
  let shop = req.query.shop;
  let product = req.query.product;
  let sort = req.query.sort;
  const query = "SELECT * FROM purchases";
  client.query(query, function (err, result) {
    if (err) res.status(404).send(err);
    else {
      let arr = result.rows;
      if (shop) arr = arr.filter((p) => p.shopid === +shop[2]);
      if (product) {
        let prArr=product.split(",");
        arr = arr.filter((p) =>prArr.find((opt)=>+opt[2]===p.productid));
      }
      if (sort === "QtyAsc")
        arr = arr.sort((pr1, pr2) => pr1.quantity - pr2.quantity);
      if (sort === "QtyDesc")
        arr = arr.sort((pr1, pr2) => pr2.quantity - pr1.quantity);
      if (sort === "ValueAsc")
        arr = arr.sort(
          (pr1, pr2) => pr1.price * pr1.quantity - pr2.price * pr2.quantity
        );
      if (sort === "ValueDesc")
        arr = arr.sort(
          (pr1, pr2) => pr2.price * pr2.quantity - pr1.price * pr1.quantity
        );
      res.send(arr);
    }
  });
});
app.get("/purchases/shops/:id", function (req, res, next) {
  let id = +req.params.id;
  const query = "SELECT * FROM purchases WHERE shopid=$1";
  client.query(query, [id], function (err, result) {
    if (err) res.status(404).send(err);
    else res.send(result.rows);
  });
});
app.get("/purchases/products/:id", function (req, res, next) {
  let id = +req.params.id;
  const query = "SELECT * FROM purchases WHERE productid=$1";
  client.query(query, [id], function (err, result) {
    if (err) res.status(404).send(err);
    else res.send(result.rows);
  });
});
app.get("/totalPurchase/shop/:id", function (req, res) {
  let id = +req.params.id;
  const query = "SELECT * FROM purchases WHERE shopid=$1";
  client.query(query, [id], function (err, result) {
    if (err) res.status(404).send(err);
    else {
      let arr = result.rows;
      let newArr = arr.filter((pr1) => pr1.shopid === id);
      let newArr1 = newArr.reduce(function (acc, curr) {
        let find = acc.find((p) => p.productid === curr.productid);
        if (find) {
          find.quantity += curr.quantity;
          return acc;
        } else return [...acc, curr];
      }, []);
      res.send(newArr1);
    }
  });
});
app.get("/totalPurchase/product/:id", function (req, res) {
  let id = +req.params.id;
  const query = "SELECT * FROM purchases WHERE productid=$1";
  client.query(query, [id], function (err, result) {
    if (err) res.status(404).send(err);
    else {
      let arr = result.rows;
      let newArr = arr.filter((pr1) => pr1.productid === id);
      let newArr1 = newArr.reduce(function (acc, curr) {
        let find = acc.find((p) => p.shopid === curr.shopid);
        if (find) {
          find.quantity += curr.quantity;
          return acc;
        } else return [...acc, curr];
      }, []);
      res.send(newArr1);
    }
  });
});
