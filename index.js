

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
    // tasks proposals users payments reviews |  bookmarks notifications


    const database = client.db("skills-wap-db");
    const taskCollection = database.collection("tasks");
    const proposalsCollection = database.collection("proposals");
    const usersCollection = database.collection("user");
    const paymentCollection = database.collection("payments");



    //--------------------api----------------------------


     // 10 no- get user api
    app.get('/api/users', async(req, res)=>{
      
      const cursor = usersCollection.find().skip(4)
      const result = await cursor.toArray()

      // const query = {}
      // if(req.query.role){
      //   req.role = req.query.role.client
      // }
      // const cursor = usersCollection.find(query)
      // const result = await cursor.toArray()


      res.send(result)
    });



    // no-1 : for post a task 
    app.post('/api/tasks', async (req, res) => {
        const task = req.body;
        const newTask ={
            ...task,
            createdAt: new Date()
        }
        const result = await taskCollection.insertOne(newTask);
        res.send(result);
    });

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



    //7 no- Combined API: Proposals search (by taskId, freelancerEmail, or all)
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



    //8 no- accept
    app.patch("/api/proposals/:id/accept", async (req, res) => {
      try {
        const id = req.params.id;

        // Find proposal
        const proposal = await proposalsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!proposal) {
          return res.status(404).send({
            success: false,
            message: "Proposal not found",
          });
        }

        // Accept selected proposal
        await proposalsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "accepted",
            },
          }
        );

        // Reject all other proposals of this task
        await proposalsCollection.updateMany(
          {
            taskId: proposal.taskId,
            _id: { $ne: new ObjectId(id) },
          },
          {
            $set: {
              status: "rejected",
            },
          }
        );

        // Update task
        await taskCollection.updateOne(
          {
            _id: new ObjectId(proposal.taskId),
          },
          {

            $set: {
              assignedFreelancerEmail: proposal.freelancerEmail,
              acceptedProposalId: id,
            },


            // $set: {
            //   status: "in-progress",
            //   hasApprovedProposal: true,
            //   assignedFreelancerEmail: proposal.freelancerEmail,
            // },
          }
        );

        res.send({
          success: true,
          message: "Proposal accepted successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Internal Server Error",
        });
      }
    });


    //9 no - reject
    app.patch("/api/proposals/:id/reject", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await proposalsCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              status: "rejected",
            },
          }
        );

        res.send({
          success: true,
          result,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Internal Server Error",
        });
      }
    });



    //11 no- client Payment Success API
    app.patch("/api/tasks/:id/payment-success", async (req, res) => {
      try {
        const id = req.params.id;

        // task খুঁজে বের করো
        const task = await taskCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!task) {
          return res.status(404).send({
            success: false,
            message: "Task not found",
          });
        }

        // task update
        await taskCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "in-progress",
              paymentStatus: "paid",
              hasApprovedProposal: true,
            },
          }
        );

        // payment save
        await paymentCollection.insertOne({
          taskId: task._id.toString(),
          taskTitle: task.title,
          clientName: task.clientName,
          clientEmail: task.email,
          freelancerEmail: task.assignedFreelancerEmail,
          amount: task.budget,
          paymentStatus: "paid",
          paidAt: new Date(),
        });

        res.send({
          success: true,
          message: "Payment completed successfully",
        });


      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Internal Server Error",
        });
      }
    });
 
   
    //
    // 12 no - Get client payments
    app.get("/api/payments", async (req, res) => {
      try {
        const query = {};

        if (req.query.clientEmail) {
          query.clientEmail = req.query.clientEmail;
        }

        const result = await paymentCollection
          .find(query)
          .sort({ paidAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Internal Server Error",
        });
      }
    });


    // 13 no - Get proposal by id for client payment to freelancer 
    app.get("/api/proposals/:id", async (req, res) => {
      const proposal = await proposalCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

      res.send(proposal);
    });


    // 14 no- Get freelancer projects by email (in-progress and completed)
    app.get("/api/freelancer/projects/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const result = await taskCollection
          .find({
            assignedFreelancerEmail: email,
            status: {
              $in: ["in-progress", "completed"],
            },
          })
          .toArray();

        res.send(result);
      } catch (err) {
        console.log(err);

        res.status(500).send({
          success: false,
          message: "Internal Server Error!!!",
        });
      }
    });



    // 15 no - Update task status to completed and save deliverable URL
    app.patch("/api/tasks/:id/deliverable", async (req, res) => {

       console.log("BODY =>", req.body);
      // console.log("ID =>", req.params.id);
      try {
        const id = req.params.id;

        const { deliverableUrl } = req.body;


        // console.log("Task ID:", id);
        // console.log("Body:", req.body);
        // console.log("URL:", deliverableUrl);

        const result = await taskCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              status: "completed",
              deliverableUrl,
              completedAt: new Date(),
            },
          }
        );

        // console.log("UPDATE RESULT:", result);


        res.send({
          success: true,
          modifiedCount: result.modifiedCount,
        });
      } catch (err) {
          console.error("========== ERROR ==========");
          console.error(err);
          console.error(err.stack);

          res.status(500).send({
            success: false,
            message: err.message,
          });
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