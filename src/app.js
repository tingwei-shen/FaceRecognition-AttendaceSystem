const path = require("path")
const express = require("express")
const app = express()
const port = process.env.PORT || 3000
const basePath = path.join(__dirname, "../public")
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // be able to access it when we need to.

const dbService = require('./dbService');

app.use(cors());

let ALLOWED_ORIGINS = ["http://34.74.152.145"];
app.use((req, res, next) => {
    let origin = req.headers.origin;
    let theOrigin = (ALLOWED_ORIGINS.indexOf(origin) >= 0) ? origin : ALLOWED_ORIGINS[0];
    res.header("Access-Control-Allow-Origin", theOrigin);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods",  'GET,POST,DELETE');
    next();
})
app.use(express.static(basePath))

 // when we have an incoming API call, it is able to send data to backend
app.use(express.json()); // be able to send josn format
app.use(express.urlencoded({ extended : false }));

app.get('/none',cors(),(request, response)=>
  {  console.log('get none')
    response.send('none')
  }
    )
app.get('/getAll',(request, response) => {
    console.log("get alls")
    const db = dbService.getDbServiceInstance(); //get the object back

    const result = db.getAllData();
  
    result
    .then(data => response.json({data : data}))
    .catch(err => console.log(err));
});

app.get('/testn',cors(),(request, response)=>{
    console.log('api tesing')
    response.send('api call from servers')
})
// create
app.post('/insert',(request, response) => {
    console.log("name added ")
    const { name } = request.body;
    console.log("name added ", name)
    const db = dbService.getDbServiceInstance();
    console.log("name added ",name)
    const result = db.insertNewName(name);

    result
    .then(data => response.json({ data: data}))
    .catch(err => console.log(err));
});

//read
// app.get('/getAll', cors(),(request, response) => {
//     console.log("get alls")
//     const db = dbService.getDbServiceInstance(); //get the object back

//     const result = db.getAllData();
  
//     result
//     .then(data => response.json({data : data}))
//     .catch(err => console.log(err));
// });

// update
app.patch('/update', (request, response) => {
    const { id, name } = request.body;
    const db = dbService.getDbServiceInstance();
    const result = db.updateNameById(id, name);

    result
    .then(data => response.json({success : data}))
    .catch(err => console.log(err));
});

// delete
app.delete('/delete/:id', (request, response) => {
    const { id } = request.params;
    const db = dbService.getDbServiceInstance();
    const result = db.deleteRowById(id);

    result
    .then(data => response.json({success : data}))
    .catch(err => console.log(err));
});

// search
app.get('/search/:name', (request, response) => {
    console.log("searchs")
    const { name } = request.params;
    const db = dbService.getDbServiceInstance();
    const result = db.searchByName(name);

    result
    .then(data => response.json({data : data}))
    .catch(err => console.log(err));
})


app.listen(port, () => {
    console.log("Server started on port " + port)
})




