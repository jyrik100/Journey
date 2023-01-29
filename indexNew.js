const express = require('express')
const app = express()
app.use(express.json())
const fs = require("fs");
const cors = require('cors')
app.use(cors())
const moment = require('moment');


// read the Journey XML file to an array and generate ID to each entry
  csv = fs.readFileSync("CSV_file.csv")
  var array = csv.toString().split('\n');
  let result = [];
  var headers;
  headers = array[0].split(",");

  for (var i = 1; i < array.length; i++) {
     var obj = {};
     if(array[i] == undefined || array[i].trim() == "") {
          continue;
      }
      var words = array[i].split(",");
      for(var j = 0; j < words.length; j++) {
          obj[headers[j].trim()] = words[j];
      }
      result.push(obj);
  }
  var result1 = [];
  var a = 1;    

  for (var i = 0, len = result.length; i<len; i++) {
    const newStartDate= new Date (result[i].Departure)
    console.log(newStartDate)
    const newEndDate= new Date (result[i].Return)
    console.log(newEndDate)
    let difference=moment(newEndDate).diff(newStartDate,'seconds')
    if(difference >1000){ 
    console.log("dif:"+difference)
    }
    if(difference >1000){ 
      result[i]["id"] = a;
      result1.push(result[i]);  
      a++
    };

   };

  console.log(result1)
  let json = JSON.stringify(result1);
  fs.writeFileSync('output.json', json); // generate output json folder

  
 // available APIs for Journerys, you can test tem on request methods when this is running

  app.get('/', (req, res) => {  // front page to check connection  WORKING
    res.send('<h1>API working, Welcome!</h1>')  
  })

  app.get('/api/journeys', (req, res) => { // get all items   WORKING
      res.json(result1)    
  })

  app.get('/api/journeys/:id', (request, response) => {  // get item by iD  WORKING
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