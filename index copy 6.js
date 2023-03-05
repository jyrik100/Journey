const express = require('express')
const app = express()
app.use(express.json())
const fs = require("fs");
const cors = require('cors')
app.use(cors())
const moment = require('moment'); // used for date differencies conversion and calc

// Backend(npm start) 1) read data from excels to jsonArray 2) provide methods to frontEnd to use that data

// 1) Read data from excels
  // toDO: create a folder and read the files from that path
  // toDO: test with massive amount of entries -> need streaming and chuncks?
  // toDo: replace header spaces with: "_" when reading 
  // toDo: stations >13 skips some records, analyse why
  // toDo: fix other Journeys apis to work with latest data 

 // read the Journeys from xml files into one array
  csv = fs.readFileSync("CSV_file.csv")   
  csv1 = fs.readFileSync("CSV_file1.csv") 
  csv2 = fs.readFileSync("CSV_file2.csv") 
  csv4 = fs.readFileSync("Stations.csv") 
  var array1 = csv.toString().split('\n')
  var array2 = csv1.toString().split('\n')
  var array3 = csv2.toString().split('\n')
  var array = array1.concat(array2, array3)
 // read the stations XML file into an array of objects
 
  let result = [];
  var headers;
  headers = array[0].split(",");
  

  for (var i = 1; i < array.length; i++) {
     var obj = {};
     if(array[i] == undefined || array[i].trim() == "") {
        continue;
      }
      var words = array[i].split(",");
//      console.log(words)
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

 // read the Stations data from xml file into one array

  var stationArray = csv4.toString().split('\n')
  let resultStations = [];
  var headersStations;
  headersStations = stationArray[0].split(",");
  

  for (var i = 1; i < stationArray.length; i++) {
     var obj = {};
     if(stationArray[i] == undefined || stationArray[i].trim() == "") {
        continue;
      }
      var wordsStation = stationArray[i].split(",");
      if (wordsStation.length!=13){  // if there are entries with too many particles skip and log
        console.log("skipped record" + wordsStation)
        continue
      }
      for(var j = 0; j < wordsStation.length; j++) {
        obj[headersStations[j].trim()] = wordsStation[j];
      }
      resultStations.push(obj);
  } 
  let jsonStations = JSON.stringify(resultStations);

// 2) PROVIDING APIs to JOURNEY FRONT END
  // available APIs for Journerys -> all apis are not uptodate with latest changes
  // you can test Apis on request methods when this application is running (npm start)
  // toDo: push the array to database and make the queries from DB
  // toDO: return number of pages(even that pages do not have full size of entries) to front pagination
  // toDO: fix rest of apis to new array 
  // toDo: API for stationsList and Details and front pagination
  // get stations
  // get station by id -> show station
  // get journeys where departure {id} 
  // get journeys where return {id}

  app.get('/', (req, res) => {  
    res.send('<h1>API working, Welcome!</h1>')  
  })

  app.get('/api/journeys', (req, res) => { 
      res.json(result1)    
  })
  app.get('/api/pagejourneyspages/:size', (req, res) => { // how many pages for pagination
    const size = Number(req.params.size)
    const pages = Math.ceil(result1.length / size)
    res.json(pages)    
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
    const maxId = result1.length > 0
      ? Math.max(...result1.map(n => n.id))
      : 0
    return maxId + 1
  }
  
  app.get('/api/journeysstation/:id', (request, response) => {  // get journeycounts by stationID
    const returnCount = result.filter(obj => obj.Return_station_id === request.params.id);
    const departureCount = result.filter(obj => obj.Departure_station_id === request.params.id);
    var counts ={
    "returnCount": returnCount.length,
    "departCount": departureCount.length, 
    }
    response.json(counts)
 })
  

  app.post('/api/journeys', (request, response) => {  // add new journey
    const body = request.body  
    if (!body.departure) {
      return response.status(400).json({ 
        error: 'departure missing' 
      })
    }
    const journey = { // get data from request
      Departure: body.departure,
      Return: body.return,    
      Departure_station_id: body.departureStation_ID,    
      Departure_station_name: body.departureStation_Name,    
      Return_station_id: body.returnStation_ID,    
      Return_station_name: body.returnStation_Name,    
      Covered_distance_m: body.coveredDistance_Meters,    
      Duration_sec: body.duration_Seconds,
      id: generateId()    
    }

    result1 = result1.concat(journey)  
    response.json(journey)
  })

  app.delete('/api/journeys/:id', (request, response) => { // delete journey by id
    const id = Number(request.params.id)
    result1 = result1.filter(journey => journey.id !== id)
    response.status(204).end()
  })

  app.get('/api/stations', (req, res) => {
    res.json(resultStations)    
})


app.get('/api/pagestations/:id/:size', (req, res) => { // paging based on pageNumber and pagesize
  const page = Number(req.params.id)
  const size = Number(req.params.size)
  const index = (page*size)-size
  const result2Stations = resultStations.slice(index,index+size)  // from 11 to 15 
  res.json(result2Stations)    // return also number of pages : how many times the size goes to lenght fully
})
app.get('/api/pagestationsspages/:size', (req, res) => { 
  const size = Number(req.params.size)
  const pages = Math.ceil(resultStations.length / size)
  res.json(pages)    // how many pages are there in array for the size
})


  const PORT = 3001
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })