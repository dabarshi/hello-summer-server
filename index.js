const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.Port || 5000;

// middleware
app.use(cors());
app.use(express.json());


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access'});
  }
  // bearer token 
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {

    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access'});
    }
    req.decoded = decoded;
    next();
  })
}

app.get('/', (req, res) => {
  res.send('Hello Summer is running')
})



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.75j00aw.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    const userCollection = client.db("summerDB").collection("users");
    const classCollection = client.db("summerDB").collection("classes");
    const selectedClassCollection = client.db("summerDB").collection("selectedClasses");


    // jwt token
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })


    // user related api 

    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    // upadate admin
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result);
    })

    // update instructor
    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result);
    })



    //  classe related api
    app.get('/classes', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await classCollection.find(query).sort({ _id: -1 }).toArray();
      res.send(result);
    })

    // popular classes
    app.get('/Popularclasses', async (req, res) => {
      const result = await classCollection.find().sort({ "students": -1 }).limit(6).toArray();
      res.send(result);
    })

    // selected Classes collection
    app.get('/selectedClasses', async (req, res) => {
      const email = req.query.email;
      const query = {"email": email}
      const result = await selectedClassCollection.find(query).toArray();
      res.send(result);
    })
    
    app.post('/selectedClasses', async(req, res) => {
      const selectedClass = req.body;
      const result = await selectedClassCollection.insertOne(selectedClass);
      res.send(result);
    })

    app.delete('/selectedClasses/:id', async(req, res) => {
      const _id = req.params.id;
      const query = {_id: new ObjectId(_id)}
      const result = await selectedClassCollection.deleteOne(query)
      res.send(result);
    })




    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Hello summer is running on port ${port}`);
})