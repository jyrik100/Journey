const express = require('express')
const app = express()
app.use(express.json())
const fs = require("fs");
const cors = require('cors')
app.use(cors())
const moment = require('moment'); // used for date differencies conversion and calc

// This is the back-end api that 1) retrieves data from Excel files and 2) provides Apis to get and manipulate that data
// npm start

// 1) INITIALISING DATA
  // toDO: create a folder and read the files from that path
  // toDO: massive amount of entries -> need streaming and chuncks?
  // toDo: replace header spaces with: "_" when reading 

 // read the Journey XML files: CSV_file.csv to an array of objects {title: value}
  csv = fs.readFileSync("CSV_file.csv")   
  csv1 = fs.readFileSync("CSV_file1.csv") 
  csv2 = fs.readFileSync("CSV_file2.csv") 
  var array1 = csv.toString().split('\n')
  var array2 = csv1.toString().split('\n')
  var array3 = csv2.toString().split('\n')
  var array = array1.concat(array2, array3)
  console.log(array)

  let result = [];
  var headers;
  headers = array[0].split(",");

  for (var i = 1; i < array.length; i++) {
     var obj = {};
     if(array[i] == undefined || array[i].trim() == "") {
        continue;
      }
      var words = array[i].split(",");
      console.log(words)
      if (words.length>8){  // if there are entries with too many particles skip and log
        console.log("skipped record" + words)
        continue
      }
      for(var j = 0; j < words.length; j++) {
        obj[headers[j].trim()] = words[j];
      }
      result.push(obj);
  }
 // difference is calculated using moment -library
 
  var result1 = [];
  var a = 1;    

 // only entries with sufficient time and distance are submitted
  for (var i = 0, len = result.length; i<len; i++) {
    const newStartDate= new Date (result[i].Departure)
    const newEndDate= new Date (result[i].Return)
    let difference = moment(newEndDate).diff(newStartDate,'seconds')
    var distance = Number(result[i].Covered_distance_m)

 // generate running id for each valid object and provide the json to front end for listing
    if(difference >10 && distance>10){ 
      result[i]["id"] = a;
      result1.push(result[i]);  
      a++
    };
   };
  let json = JSON.stringify(result1);
  // push the initial output list as cvs file also to src directory 
  fs.writeFileSync('output.json', json); 

// 2) PROVIDING APIs to JOURNEY FRONT END
  // available APIs for Journerys -> all apis are not uptodate with latest changes
  // you can test Apis on request methods when this application is running (npm start)
  // toDo: push the array to database and make the queries from DB
  // toDO: return number of pages(even that pages do not have full size of entries) to front pagination
  // toDO: fix rest of apis to new array 
  // toDo: API for stationsList and Details and front pagination

  app.get('/', (req, res) => {  // front page to check connection  WORKING
    res.send('<h1>API working, Welcome!</h1>')  
  })

  app.get('/api/journeys', (req, res) => { // get all items   WORKING
      res.json(result1)    
  })
   app.get('/api/pagejourneys/:id/:size', (req, res) => { // paging based on pageNumber and pagesize
    const page = Number(req.params.id)
    const size = Number(req.params.size)
    const index = (page*size)-size
    const result2 = result1.slice(index,index+size)  // from 11 to 15 
    res.json(result2)    // return also number of pages : how many times the size goes to lenght fully
  })
  app.get('/api/journeys/:id', (request, response) => {  // get item by iD 
    const id = Number(request.params.id)
    const journey = result.find(result => result.id === id)
    console.log(id)

    if (journey) {    
      response.json(journey)  
    } else {    
      response.status(404).end()  
    }
  })
  const generateId = () => {
    const maxId = journeys.length > 0
      ? Math.max(...journeys.map(n => n.id))
      : 0
    return maxId + 1
  }
  

  app.post('/api/journeys', (request, response) => {  // add new item
    const body = request.body  
    if (!body.departure) {
      return response.status(400).json({ 
        error: 'departure missing' 
      })
    }
    const journey = { // get data from request
      id: generateId(),    
      departure: body.departure,
      return: body.return,    
      departureStation_ID: body.departureStation_ID,    
      departureStation_Name: body.departureStation_Name,    
      returnStation_ID: body.returnStation_ID,    
      returnStation_Name: body.returnStation_Name,    
      coveredDistance_Meters: body.coveredDistance_Meters,    
      duration_Seconds: body.duration_Seconds
    }

    journeys = journeys.concat(journey)  
    response.json(journey)
  })

  app.delete('/api/journeys/:id', (request, response) => { // delete item by id
    const id = Number(request.params.id)
    journeys = journeys.filter(journey => journey.id !== id)
    response.status(204).end()
  })

  const PORT = 3001
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })