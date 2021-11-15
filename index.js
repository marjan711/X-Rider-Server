const { MongoClient } = require('mongodb');
const express = require('express');
const cors =require('cors');
require('dotenv').config();
const admin = require("firebase-admin");

const objectId = require('mongodb').ObjectId;
const { query } = require('express');
const app = express();
const port = process.env.PORT || 5000;

const serviceAccount = require('./x-riders7-firebase-adminsdk-729fd-f7d8976704.json');



// use middleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ojbxf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}

async function run() {
    try {
      await client.connect();
      const database = client.db("xRiders");
      const productsCollection = database.collection("products");
      const orderCollection = database.collection("orders");
      const userReviewCollection = database.collection("reviews");
      const usersCollection = database.collection('users');

    //   Post api  for add services
    app.post('/products', async(req,res)=>{
          
        const product=req.body;
        const result = await productsCollection.insertOne(product);
         console.log('got new product', req.body);
         console.log('added product', result); 
        res.send(result);

  });

  //   get api for all products
  app.get('/allproducts', async(req,res)=>{
    const cursor =productsCollection.find({});
    const products=await cursor.toArray();
    res.send(products);
})

  // for single service info
app.get('/product/:id',async(req,res)=>{
    const id =req.params.id;
    const querry = {_id:objectId(id)};
    const product = await productsCollection.findOne(querry);
    console.log('load product with id',id)
    res.send(product)
})

//   post api for orders

app.post('/confirmOrder', async(req,res)=>{
          
    const order=req.body;
    console.log(order);
    const result = await orderCollection.insertOne(order);
    res.json(result);
     

});

// for delete Product
app.delete('/deleteproduct/:id',async(req,res)=>{
    const id =req.params.id;
    const query = {_id:objectId(id)}
    
    const result =await productsCollection.deleteOne(query)
    console.log("deleting order with id",result);
    res.send(result.acknowledged);
})

// for myorders

app.get("/myorders/:email",async(req,res)=>{
    const result = await orderCollection
    .find({email: req.params.email})
    .toArray();
    res.send(result)
})

// for all orders

app.get('/allOrders', async(req,res)=>{
    const cursor =orderCollection.find({});
    const orders=await cursor.toArray();
    res.send(orders);
})

// for update orders
app.put('/updateStatus/:id',(req,res)=>{
    const id =req.params.id;
    const newstatus =req.body.status;
    const filter ={_id:objectId(id)};
    orderCollection.updateOne(filter,{
        $set:{status:newstatus},

    })
    .then((result)=>{
                res.send(result)
    })
    
    
})

// delete orders
app.delete('/deleteOrder/:id',async(req,res)=>{
    const id =req.params.id;
    const query = {_id:objectId(id)}
    
    const result =await orderCollection.deleteOne(query)
    console.log("deleting order with id",result);
    res.send(result.acknowledged);
})



app.post('/users', async (req, res) => {
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    console.log(result);
    res.json(result);
});

// upsert users
app.put('/users', async (req, res) => {
    const user = req.body;
    const filter = { email: user.email };
    const options = { upsert: true };
    const updateDoc = { $set: user };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
    res.json(result);
});

// To Check User's role

app.get('/users/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    let isAdmin = false;
    if (user?.role === 'admin') {
        isAdmin = true;
    }
    res.json({ admin: isAdmin });
})

// for admin purpase
app.put('/users/admin',  async (req, res) => {
    const user = req.body;
    const filter ={email:user.email};
    const updateDoc = { $set: { role: 'admin' } };
    const result = await usersCollection.updateOne(filter, updateDoc);
    console.log('put',user)
    res.json(result);
   
})

// post review
app.post('/reviews', async(req,res)=>{
          
    const review=req.body;
    const result = await userReviewCollection.insertOne(review);
     console.log('got new review', req.body);
     console.log('added review', result); 
    res.send(result);

});

// for all review
app.get('/allreview', async(req,res)=>{
    const cursor =userReviewCollection.find({});
    const review=await cursor.toArray();
    res.send(review);
})
    


      
    } finally {
    
    }
  }

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('its working properly')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })