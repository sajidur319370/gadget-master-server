const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { response } = require("express");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

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
    app.get("/inventory", async (req, res) => {
      console.log("query", req.query);
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

    // =================DELETE product=============
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
