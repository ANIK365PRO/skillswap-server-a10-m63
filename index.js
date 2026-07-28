

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4'])

require('dotenv').config()

const express = require('express');
const cors = require('cors');
const app = express()

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // tasks proposals payments reviews |  bookmarks notifications


    const database = client.db("skills-wap-db");
    const taskCollection = database.collection("tasks");
    const proposalsCollection = database.collection("proposals")






        // no-1 : for post a task 
    app.post('/api/tasks', async (req, res) => {
        const task = req.body;
        const newTask ={
            ...task,
            createdAt: new Date()
        }
        const result = await taskCollection.insertOne(newTask);
        res.send(result);
    })

      // no-2 : for get a task by userId and status
    app.get('/api/tasks', async (req, res) => {
      const query = {};

      if (req.query.userId) {
        query.userId = req.query.userId;
      }

      if (req.query.status) {
        query.status = req.query.status;
      }

      const result = await taskCollection.find(query).toArray();

      res.send(result);
    });

    
    // no-3 : for get a task by id
    app.get('/api/tasks/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await taskCollection.findOne(query);

      res.send(result);
    });


    // no-4 : edit for update a task by _id
    app.patch("/api/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const updateTaskDAta = req.body;

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
         $set :  updateTaskDAta 
      }


      const result = await taskCollection.updateOne(
        filter, updateDoc
      );

      // console.log(result)
      res.send(result);
    });


    //5 no- for delete task by _id
    app.delete("/api/tasks/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await taskCollection.deleteOne(query);

      res.send(result);
    });


    //6 no- for proposals by freelancerEmail
    app.post("/api/proposals", async (req, res) => {
    const proposal = req.body;

    // Check if already applied
    const existingProposal =
        await proposalsCollection.findOne({
          taskId: proposal.taskId,
          freelancerEmail:
            proposal.freelancerEmail,
        });

      if (existingProposal) {
        return res.status(400).send({
          success: false,
          message:
            "You have already applied for this task.",
        });
      }

      const result =
        await proposalsCollection.insertOne({
          ...proposal,
          status: "pending",
          submittedAt: new Date(),
        });

      res.send({
        success: true,
        insertedId: result.insertedId,
      });
    });



    // Combined API: Proposals search (by taskId, freelancerEmail, or all)
    app.get("/api/proposals", async (req, res) => {
      try {
        const query = {};

        // ১. যদি taskId পাঠানো হয়
        if (req.query.taskId) {
          query.taskId = req.query.taskId;
        }

        // ২. যদি freelancerEmail পাঠানো হয়
        if (req.query.freelancerEmail) {
          // যদি 'mine' পাঠানো হয় এবং আপনার auth/session থাকে
          // query.freelancerEmail = req.user?.email || req.query.freelancerEmail;
          
          query.freelancerEmail = req.query.freelancerEmail;
        }

        // find() ব্যবহার করলে সব সময় Array [ ] রিটার্ন করবে (যা Table-এর map() এর জন্য পারফেক্ট)
        const result = await proposalsCollection.find(query).toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching proposals:", error);
        res.status(500).send({ message: "Failed to fetch proposals" });
      }
    });








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