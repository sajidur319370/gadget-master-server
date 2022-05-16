const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { response } = require("express");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// =================jwt function==================
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res.status(403).send({ message: "forbidden Access" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rcxdj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("gadgetMaster").collection("product");
    const userItemsCollection = client
      .db("gadgetMaster")
      .collection("userItems");
    app.get("/inventory", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = serviceCollection.find(query);

      let products;
      if (page || size) {
        products = await cursor
          .skip(size * page)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }

      res.send(products);
    });

    //================ AUTH=========================
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // =================GET single product=============
    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await serviceCollection.findOne(query);
      res.send(product);
    });

    // =================POST single product=============
    app.post("/inventory", async (req, res) => {
      const newProduct = req.body;
      const result = await serviceCollection.insertOne(newProduct);
      res.send(result);
    });
    // ===================Update quantity of Product===================
    app.put("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const updateProduct = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: updateProduct.updateQuantity,
        },
      };
      const result = await serviceCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // =================DELETE product from inventory=============
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    // =====================Pagination========================
    app.get("/productCount", async (req, res) => {
      const count = await serviceCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // =================User Collection Api====================
    app.post("/userItems", async (req, res) => {
      const userItems = req.body;
      const result = await userItemsCollection.insertOne(userItems);
      res.send(result);
    });
    // ========get User Collection=========================
    app.get("/userItems", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query?.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = userItemsCollection.find(query);
        const userItems = await cursor.toArray();
        res.send(userItems);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });
    // =================DELETE product from User Collection=============
    app.delete("/userItems/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userItemsCollection.deleteOne(query);
      res.send(result);
    });

    // ===================================================
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("My Gadget Master Server is running.......");
});

app.listen(port, () => {
  console.log("Server is running at", port);
});
