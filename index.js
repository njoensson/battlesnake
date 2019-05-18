const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js')

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---

//Global stuff
var myBoard;
var myHeadX = 0;
var myHeadY = 0;
var myLength =0;

//VALUES TO PLAY AROUND WITH
var myFactor0 = 17;  //1
var myFactor1 = 5;   //3
var myFactor2 = 3;   //5
var myFactor3 = 3;   //7

const sidelineValue = 2;
const myselfValue = -8;
const emptyValue = 5;
const foodValue = 15;
const anotherWorm = -4;
const myAnotherSnakeHead = 12;  //if smaller
const myHead = 1;
//--------------------------

// Handle POST request to '/start'
app.post('/start', (request, response) => {
  // NOTE: Do something here to start the game
  console.log('Start called');

  // Response data
  const data = {
    color: '#DFFF00',
  }

  return response.json(data)
})


// Handle POST request to '/move'
app.post('/move', (request, response) => {
  // NOTE: Do something here to generate your move
  console.log('Move called');

  createBoard(request);
  printBoard();
  let theMove = decideMove();

  // Response data
  const data = {
    move: theMove, // one of: ['up','down','left','right']
  }

  return response.json(data)
})

app.post('/end', (request, response) => {
  // NOTE: Any cleanup when a game is complete.
  return response.json({})
})

app.post('/ping', (request, response) => {
  // Used for checking if this snake is still alive.
  return response.json({});
})

//DECIDE MOVE
function decideMove() {
  console.log('decideMove() called')
  let values0 = checkLevel0();
  let values1 = checkLevel1();
  let values2 = checkLevel2();
  let values3 = checkLevel3();

  let moveChooser = new Array();

  //Handle level 0
  let i = 0;
  values0.forEach(element => {
    if(values0[i].value > 0 ) {
      moveChooser.push({direction: values0[i].direction, value: values0[i].value});
    }
    i++;
  });

  //Handle level 1
  i = 0;
  let addedSum;
  moveChooser.forEach(element => {
    addedSum = values1.find(function (element) {
        return element.direction == moveChooser[i].direction; 
      });
      moveChooser[i].value = moveChooser[i].value + addedSum.value;
    i++;
  });
  
  //Handle level 2
  i = 0;
  addedSum = 0;
  moveChooser.forEach(element => {
    addedSum = values2.find(function (element) {
        return element.direction == moveChooser[i].direction; 
      });
      moveChooser[i].value = moveChooser[i].value + addedSum.value;
    i++;
  });

  //Handle level 3
  //Handle level 2
  i = 0;
  addedSum = 0;
  moveChooser.forEach(element => {
    addedSum = values3.find(function (element) {
        return element.direction == moveChooser[i].direction; 
      });
      moveChooser[i].value = moveChooser[i].value + addedSum.value;
    i++;
  });
  
  moveChooser.sort(function (a, b) {return b.value - a.value;});
  let theMove = moveChooser[0].direction;

  //log moveChoose
  moveChooser.forEach(element => {
      console.log(element.direction + ' ' + element.value);
  });

  console.log('Direction selected = ' + theMove);
  return theMove;

}

//HELPERS

function createBoard(request){
  console.log('createBoard() called');
  //Create board array

  const width = request.body.board.width;
  const height = request.body.board.height;
  myHeadX = request.body.you.body[0].x;
  myHeadY = request.body.you.body[0].y;
  
  //Create empty array
  myBoard = new Array(height);
  let i = 0;
  while(i < height) {
    let ii = 0;
    myBoard[i] = new Array(width);
    while(ii < width) {
      myBoard[i][ii] = emptyValue;
      ii++;
    }
    i++;
  }

  //Set sidelines
  //Top sideline
  i = 0;
  myBoard[0].forEach(element => {
    myBoard[0][i] = sidelineValue;
    i++;
  });

  //Left sideline
  i = 0;
  myBoard.forEach(element => {
    myBoard[i][0] = sidelineValue;
    i++;
  });

  //Bottom sideline
  i = 0;
  myBoard[height-1].forEach(element => {
    myBoard[height-1][i] = sidelineValue;
    i++;
  });

  //Right sideline
  i = 0;
  myBoard.forEach(element => {
    myBoard[i][width-1] = sidelineValue;
    i++;
  });

  //Add the food to myBoard
  let foodArray = request.body.board.food;
  let x;
  let y;
  foodArray.forEach(element => {
    x = element.x;
    y = element.y;
    myBoard[y][x] = foodValue;
  });

  //Add myself to the board
  i = 0;
  let meArray = request.body.you.body;
  meArray.forEach(element => {
    x = element.x;
    y = element.y;
    i++;
    myBoard[y][x] = myselfValue;
  });
  myLength = i;


  //Mark my head
  myHeadX = meArray[0].x;
  myHeadY = meArray[0].y;
  myBoard[myHeadY][myHeadX] = myHead;

  //Mark other snakes
  let snakeArray = request.body.board.snakes;
  let oneSnakeArray;
  let snakeHeadX = 0;
  let snakeHeadY = 0;
  snakeArray.forEach(element => {
    oneSnakeArray = element.body;
    i = 0;
    oneSnakeArray.forEach(element => {
        x = element.x;
        y = element.y;
        if(i == 0 ) {
          snakeHeadX = x;
          snakeHeadY = y;
        }
        myBoard[y][x] = anotherWorm;
        i++;                        
    });
    if(i < myLength) { //if other snake is shorter
      //up
      if(myBoard[snakeHeadY-1][snakeHeadX] > 0) {
        myBoard[snakeHeadY-1][snakeHeadX] = myAnotherSnakeHead;
      }
      //down
      if(myBoard[snakeHeadY+1][snakeHeadX] > 0) {
        myBoard[snakeHeadY+1][snakeHeadX] = myAnotherSnakeHead;
      }
      //left
      if(myBoard[snakeHeadY][snakeHeadX-1] > 0) {
        myBoard[snakeHeadY][snakeHeadX-1] = myAnotherSnakeHead;
      }
      //right
      if(myBoard[snakeHeadY][snakeHeadX+1] > 0) {
        myBoard[snakeHeadY][snakeHeadX+1] = myAnotherSnakeHead;
      }
    }
  });

  //Expand board in all directions
  i = 0;
  myBoard.forEach(element => {
    myBoard[i].push(0,0,0);
    i++;
  });

  i = 0;
  myBoard.forEach(element => {
    myBoard[i].unshift(0,0,0);
    i++;
  });

  let emptyArray = new Array();
  i = 0;
  while (i < myBoard[0].length) {
    emptyArray[i] = 0;
    i++;
  }
  myBoard.unshift(emptyArray, emptyArray, emptyArray);
  myBoard.push(emptyArray, emptyArray, emptyArray);

  //Update myHead position according to expande board
  myHeadX = myHeadX + 3;
  myHeadY = myHeadY + 3;
}

function printBoard() {
  console.log('printBoard() called');
  console.log('---------myBoard----------------------------');
  myBoard.forEach(element => {
    console.log(element);
  });
  console.log('--------------------------------------------');
}

function printJSON(request) {
  console.log('printJSON() called');
  console.log(request.body);
}

function checkLevel0() {
  console.log('checkLevel0() called');
  let left = myBoard[myHeadY][myHeadX-1] * myFactor0;
  let right = myBoard[myHeadY][myHeadX+1] * myFactor0;
  let up = myBoard[myHeadY-1][myHeadX] * myFactor0;
  let down = myBoard[myHeadY+1][myHeadX] * myFactor0;
  
  let theReturn = [{direction:'left', value:left},
                  {direction:'right', value:right},
                  {direction:'up', value:up},
                  {direction:'down', value:down}];

  console.log('checkLevel0() returning --> left ' + left + ', right ' + right + ', up ' + up + ', down ' + down);
  return theReturn;
}

function checkLevel1() {
  //find my head and return 3x3
  console.log('checkLevel1() called');
  let left = (myBoard[myHeadY][myHeadX-1] + myBoard[myHeadY-1][myHeadX-1] + myBoard[myHeadY][myHeadX+1]) * myFactor1;
  let right = (myBoard[myHeadY][myHeadX+1] + myBoard[myHeadY-1][myHeadX+1] + myBoard[myHeadY+1][myHeadX+1]) * myFactor1;
  let up = (myBoard[myHeadY-1][myHeadX] + myBoard[myHeadY-1][myHeadX-1] + myBoard[myHeadY-1][myHeadX+1]) * myFactor1;
  let down = (myBoard[myHeadY+1][myHeadX] + myBoard[myHeadY+1][myHeadX-1] + myBoard[myHeadY+1][myHeadX+1]) * myFactor1;

  let theReturn = [{direction:'left', value:left},
                  {direction:'right', value:right},
                  {direction:'up', value:up},
                  {direction:'down', value:down}];

  console.log('checkLevel1() returning --> left ' + left + ', right ' + right + ', up ' + up + ', down ' + down);
  return theReturn;
}

function checkLevel2() {
  //find my head and return 5x5
  console.log('checkLevel2() called');
  let i = 0;;
  let left = 0;
  let right = 0;
  let up = 0;
  let down = 0;
  //up
  while (i < 5) {
    up = up + myBoard[myHeadY-2][myHeadX-2+i];
    i++;
  }
  up = up * myFactor2;

  //left
  i = 0;
  while (i < 5) {
    left = left + myBoard[myHeadY-2+i][myHeadX-2];
    i++;
  }
  left = left * myFactor2;

  //right
  i = 0;
  while (i < 5) {
    right = right + myBoard[myHeadY-2+i][myHeadX+2];
    i++;
  }
  right = right * myFactor2;

  //down
  i = 0;
  while (i < 5) {
    down = down + myBoard[myHeadY+2][myHeadX-2+i];
    i++;
  }
  down = down * myFactor2;

  let theReturn = [{direction:'left', value:left},
                  {direction:'right', value:right},
                  {direction:'up', value:up},
                  {direction:'down', value:down}];

  console.log('checkLevel2() returning --> left ' + left + ', right ' + right + ', up ' + up + ', down ' + down);
  return theReturn;
}

function checkLevel3() {
  //find my head and return 7x7
  console.log('checkLevel2() called');
  let i = 0;;
  let left = 0;
  let right = 0;
  let up = 0;
  let down = 0;
  //up
  while (i < 7) {
    up = up + myBoard[myHeadY-3][myHeadX-3+i];
    i++;
  }
  up = up * myFactor3;

  //left
  i = 0;
  while (i < 7) {
    left = left + myBoard[myHeadY-3+i][myHeadX-3];
    i++;
  }
  left = left * myFactor3;

  //right
  i = 0;
  while (i < 7) {
    right = right + myBoard[myHeadY-3+i][myHeadX+3];
    i++;
  }
  right = right * myFactor3;

  //down
  i = 0;
  while (i < 7) {
    down = down + myBoard[myHeadY+3][myHeadX-3+i];
    i++;
  }
  down = down * myFactor3;

  let theReturn = [{direction:'left', value:left},
                  {direction:'right', value:right},
                  {direction:'up', value:up},
                  {direction:'down', value:down}];

  console.log('checkLevel3() returning --> left ' + left + ', right ' + right + ', up ' + up + ', down ' + down);
  return theReturn;
}

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})
