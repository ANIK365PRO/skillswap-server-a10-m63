const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4'])

require('dotenv').config()

const express = require('express');
const cors = require('cors');
const app = express()

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI ;

const port = process.env.PORT || 5000;

app.use(cors()) ;
app.use(express.json()) ;



app.get('/', (req, res) => {
  res.send('Hello friends! This is skillswap backend server.')
})




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //--------------------------------------------------

    const database = client.db("skills-wap-db");
    const collection = database.collection("tasks");


    // tasks proposals payments reviews |  bookmarks notifications





    //--------------------------------------------------

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.listen(port, () => {
  console.log(`skillswap listening on port ${port}`)
})