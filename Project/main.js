//@Author: Bilgehan Sandikci
//@Date & time: 28.04.2024 20:40
//This is a web app that uses four different convex hull finding algorithms. Namely: Gift-wrap, Graham's scan, Quick-hull, and Merge-hull.
//The app has functionalities about creating & drawing n points using gaussian and normal distribution options, finding the convex hull of these points,
//animating the algorithms and their inner workings while the hull is beings found, and the functionality to add new points by clicking with mouse.

var gl;
var program;

var points;
var hull;
var animation;
var animPoints;
var drawColor;

var tempHull;
var hullDrawFlag;

var debug;
var debugPoints;

var animationFlag = 0;
var animationTime = 300;

var colors;

var stepToggle;
var isStep;
var reset;

var currentXTransform = 0.0;
var currentYTransform = 0.0;
var zoom = 1.0;
var isDragging = false;
var startX, startY;

var currentAlgorithm;
var nValue;
var timeElapsed;

var newPointsEnabled = false;


window.onload = function init(){
    var canvas = document.getElementById( "gl-canvas" );
     gl = WebGLUtils.setupWebGL( canvas );    
     if ( !gl ) { alert( "WebGL isn't available" ); 
}    

//Init variables
points = [];
colors = {
    red: vec4(1.0, 0.0, 0.0, 1.0),
    blue: vec4(0.0, 0.0, 1.0, 1.0),
    green: vec4(0.0, 1.0, 0.0, 1.0),
    yellow: vec4(1.0, 1.0, 0.0, 1.0),
    orange: vec4(1.0, 0.65, 0.0, 1.0),
    black: vec4(0.0, 0.0, 0.0, 1.0),
};
drawColor = colors.black;
hullDrawFlag = 0;

stepToggle = 0;
isStep = 0;
reset = 0;

nValue = "-";
currentAlgorithm = "-";
timeElapsed = "-";
displayInfo();

// Get the HTML elements
var nValueInput = document.getElementById("n-value");
var drawButton = document.getElementById("draw-button");
var calculateButton = document.getElementById("calculate-hull-button");
var animateButton = document.getElementById("animate-hull-button");
var newPointsCheckbox = document.getElementById("add-points-checkbox");
var resetButton = document.getElementById("reset-button")

// Add event listeners to the UI
drawButton.addEventListener("click", createPoints);
calculateButton.addEventListener("click", calculateHull);
animateButton.addEventListener("click", calculateAnimation);
newPointsCheckbox.addEventListener("click",function() {newPointsEnabled = newPointsCheckbox.checked;});
resetButton.addEventListener("click", resetAnimation);

var isDragging = false;
var startX, startY;
var currentX, currentY;

//Mouse event listeners
canvas.addEventListener("mousedown", function(event) {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
});

canvas.addEventListener("mousemove", function(event) {
    if (isDragging) {
        var deltaX = 2 * (event.clientX - startX) / canvas.width;
        var deltaY = 2 * (event.clientY - startY) / canvas.height;
        currentXTransform += deltaX / zoom;
        currentYTransform -= deltaY / zoom; // Invert y-axis for canvas coordinates
        startX = event.clientX;
        startY = event.clientY;
        //console.log("Dragging - DeltaX:", deltaX, "DeltaY:", deltaY);
        render();
    }
});

canvas.addEventListener("mouseup", function(event) {
    isDragging = false;
});

canvas.addEventListener("wheel", function(event) {
    var delta = event.deltaY;
    if (delta < 0) {
        zoom *= 1.1; // Zoom in
    } else {
        zoom *= 0.9; // Zoom out
    }
    //console.log("Zoom:", zoom);
    render();
});

canvas.addEventListener("click", function(event) {

    if(newPointsEnabled){
        var rect = canvas.getBoundingClientRect();
        var clickX = (event.clientX - rect.left) / canvas.width * 2 - 1;
        var clickY = 1 - (event.clientY - rect.top) / canvas.height * 2; // Invert y-axis for canvas coordinates

        clickX = (clickX) / (zoom) - currentXTransform;
        clickY = (clickY) / (zoom) - currentYTransform;

        points.push(vec2(clickX, clickY));
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    }
    render();
});

//  Configure WebGL   
// 
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );   
     
//  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );        

//Initialize buffers and some attributes       
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );    
    render();
};

//Render points
function render() {
    var defaultColor = colors.black;

    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var xTransformLoc = gl.getUniformLocation(program, "xTransform");
    var yTransformLoc = gl.getUniformLocation(program, "yTransform");
    var zoomLoc = gl.getUniformLocation(program, "zoom");

    var uColor = gl.getUniformLocation(program, "uColor");
    gl.uniform4f(uColor, defaultColor[0], defaultColor[1], defaultColor[2], defaultColor[3]); // Set uniform color to red (for example)

    gl.uniform1f(xTransformLoc, currentXTransform);
    gl.uniform1f(yTransformLoc, currentYTransform);
    gl.uniform1f(zoomLoc, zoom);

    gl.clear( gl.COLOR_BUFFER_BIT ); 
    gl.drawArrays( gl.POINTS, 0, points.length );

    renderHull();
    renderAnimation();
    renderPoints();
}

//Render hull
function renderHull(){

    if(hull && hull.length > 0){
        gl.bufferData( gl.ARRAY_BUFFER, flatten(hull), gl.STATIC_DRAW );

        if(hullDrawFlag) gl.drawArrays( gl.LINE_LOOP, 0, hull.length );
    }
}

//Render animations with strip-line
function renderAnimation(){

    if(animation && animationFlag){
        for(let i = 0; i < animation.length; i++){
            var uColor = gl.getUniformLocation(program, "uColor");
            gl.uniform4f(uColor, drawColor[i][0], drawColor[i][1], drawColor[i][2], drawColor[i][3]);

            gl.bufferData( gl.ARRAY_BUFFER, flatten(animation[i]), gl.STATIC_DRAW );
            gl.drawArrays( gl.LINE_STRIP, 0, animation[i].length );
        }
    }
}

//Render animations with points
function renderPoints(){

    var color = colors.blue;
    if(animPoints && animationFlag){
       
        var uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4f(uColor, color[0], color[1], color[2], color[3]);

        gl.bufferData( gl.ARRAY_BUFFER, flatten(animPoints), gl.STATIC_DRAW );
        gl.drawArrays( gl.POINTS, 0, animPoints.length );
    }
}

//Create points by using n value and distribution type
function createPoints() {
    var n = parseInt(document.getElementById("n-value").value);

    var l = parseFloat(document.getElementById("pointSize").value);
    var sizeLoc = gl.getUniformLocation(program, "size");
    gl.uniform1f(sizeLoc, l);

    nValue = n;

    if (isNaN(n) || n < 0) {
        alert("Please enter a valid positive integer for n.");
        return;
    }

    var distributionType = document.getElementById("distribution-select").value;
    
     // Generate n random points
     points = [];
     hull = [];
     animation = [];
     if (distributionType === "normal") {
        for (var i = 0; i < n; i++) {
            var x = Math.random() * 2 - 1; // Random x coordinate in range [-1, 1]
            var y = Math.random() * 2 - 1; // Random y coordinate in range [-1, 1]
            points.push(vec2(x, y));
        }
    }
    else if(distributionType === "gaussian"){
        for (var i = 0; i < n; i++) {
            var x = gaussianRandom(0,0.2); // Random x coordinate in range [-1, 1]
            var y = gaussianRandom(0,0.2); // Random y coordinate in range [-1, 1]
            points.push(vec2(x, y));    
        }
    }
   
    // Update the buffer with the new points
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    render();
}

//Main decorator function for hull calculations
async function calculateHull() {
    animationTime = document.getElementById("animation-speed").value;    

    //Reset/init values
    hull = [];
    hullDrawFlag = 0;
    tempHull = [];

    var selectedAlgorithm = document.getElementById("algorithm-select").value;

    currentAlgorithm = selectedAlgorithm;
    timeElapsed = "...";
    displayInfo();

    var startTime = performance.now();

    let tempEnabled = newPointsEnabled;
    newPointsEnabled = false;
    //Perform algorithms
    if(selectedAlgorithm === "grahams-scan"){
        hull = await grahamsScan(points);
    }
    else if(selectedAlgorithm === "gift-wrap"){
        await giftWrap();
    }
    else if(selectedAlgorithm === "quick-hull"){
        hull = await quickHull();
    }
    else if(selectedAlgorithm === "merge-hull"){
        hull = await mergeHull(points);
    }
    if(reset){
        hull = [];
    }
    newPointsEnabled = tempEnabled;

    //Calculate elapsed time
    var endTime = performance.now();
    var elapsedTime = endTime - startTime;
   
    //Display elapsed time
    timeElapsed = classifyTime(elapsedTime);
    timePerNValue = classifyTime(elapsedTime) + "/N";

    displayInfo();

    //Reset values
    reset = 0;
    isStep = 0;
    stepToggle = 0;

    animationFlag = 0;
    animation = [];
    animPoints = [];

    hullDrawFlag = 1;
    render();
}

//Gift-wrap algorithm: sorts points by y-value then scans from bottom to top to find right-hull, then scans from top to bottom to find left-hull
async function giftWrap(){
    //Sort points
    points.sort(function(a, b) {
        if (a[1] !== b[1]) {
            return a[1] - b[1]; // Sort by y-coordinate first
        } else {
            return a[0] - b[0]; // If y-coordinates are equal, sort by x-coordinate
        }
    });

    //Init variables
    var p1 = points[0];
    var p2 = points[points.length - 1];

    var curID = 0;
    var curPoint = points[curID];

    var lowestAngle;
    var lowestID;
    
    var angle;
    
    //Bottom to Top Query
    while(true){

        hull.push(curPoint);

        lowestAngle = 4; //bigger than pi
        for(var j = curID; j < points.length; j++){
            angle = Math.atan2( curPoint[1] - points[j][1], curPoint[0] - points[j][0] );

            //Animation
            if(reset){
                return;
            }
            if(animationFlag){
                await sleep(animationTime);
                
                animation = [hull, [curPoint , points[j]]];
                drawColor = [colors.black, colors.red];
                render();
            }

            if(angle < lowestAngle){
                lowestAngle = angle;
                lowestID = j;
            }
        }

        curPoint = points[lowestID];
        curID = lowestID;

        if(curPoint == p2) break;
    }

    //Top to Bottom Query
    while(true){

        hull.push(curPoint);

        lowestAngle = 4; //bigger than pi
        for(var j = 0; j < curID; j++){
            angle = Math.atan2( - curPoint[1] + points[j][1], -curPoint[0] + points[j][0] );

            //Animation
            if(reset){
                return;
            }
            if(animationFlag){
                await sleep(animationTime);

                animation = [hull, [curPoint , points[j]]];
                drawColor = [colors.black, colors.red];
                render();
            }

            if(angle < lowestAngle){
                lowestAngle = angle;
                lowestID = j;
            }
        }

        curPoint = points[lowestID];
        curID = lowestID;

        if(curPoint == p1) break;
    }

    hull.push(curPoint);
}

//Graham's scan algorithm: selects the average of first three points, then sorts points by angle to that point in DLL. then performs grahams scan in a little modified manner to help with animating the algorithm
async function grahamsScan(points) {
    let hull = [];
    
    //base case
    if(!points || points.length <= 3){
        hull = points;
        return hull;
    }

    //Select interior point
    let p = vec2((points[0][0] + points[1][0] + points[2][0]) / 3.0, (points[0][1] + points[1][1] + points[2][1]) / 3.0 );

    //Sort points and build DLL
    points.sort(function(a, b) {
        let thetaA = Math.atan2( a[1] - p[1], a[0] - p[0] );
        let thetaB = Math.atan2( b[1] - p[1], b[0] - p[0] );

        if (thetaA !== thetaB) {
            return thetaA - thetaB; // Sort by angle between p first
        } else {
            return Math.abs(p[0] - a[0]) - Math.abs(p[0] - b[0]); // sort by distance to p then
        }
    }); 

    //Find the lowest y-value point that is definitely on the hull and start the hull from that point
    let min = points[0][1];
    let minIndex = 0;
    for(let i = 0; i < points.length; i++){
        if(points[i][1] < min){
            minIndex = i;
            min = points[i][1];
        }
    }

    rotatedPoints = rotateArray(points, minIndex);
    let head = buildDoublyLinkedList(rotatedPoints);   

    //Scan
    // let hull = [];

    let curPoint = head;
    let start = head;
    let prev = head.prev;
    let isFinished = false;

    hull.push(curPoint.data);

    while(!isFinished){
        if(curPoint === prev){
            isFinished = true;
        }

        //Check left turn
        if(left(curPoint.data, curPoint.next.data, curPoint.next.next.data)){

            //Animation
            if(reset){
                return;
            }
            if(animationFlag){
                await sleep(animationTime);

                animation = [hull, [curPoint.data, curPoint.next.data, curPoint.next.next.data]];
                drawColor = [colors.black, colors.green];

                render();
            }

            hull.push(curPoint.next.data);
            curPoint = curPoint.next;
        }
        else{                       //backtrack

            //Animation
            if(reset){
                return;
            }
            if(animationFlag){
                await sleep(animationTime);

                animation = [hull, [curPoint.data, curPoint.next.data, curPoint.next.next.data]];
                drawColor = [colors.black, colors.red];

                render();
            }

            //Modified backtracking logic to ease animation process
            if(curPoint.next === prev){
                prev = curPoint;
            }
            
            curPoint.next = curPoint.next.next;
            curPoint.next.prev = curPoint;

            if(curPoint !== start){
                curPoint = curPoint.prev;
                hull.pop();
            }
        }
        
        

    }

    hull.pop();
    return hull;
}

//Quickhull algorithm
async function quickHull(S = null, p1 = null, p2 = null){

    //Sort points
    if(S === null){
        points.sort(function(a, b) {
            if (a[0] !== b[0]) {
                return a[0] - b[0]; // Sort by x-coordinate first
            } else {
                return a[1] - b[1]; // If x-coordinates are equal, sort by y-coordinate
            }
        });    //Sort by x then y

        let S1 = findLeftSet(points, points[0],points[points.length - 1]);      //Left array
        let S2 = findLeftSet(points, points[points.length - 1], points[0]);     //Right array

        //Animation
        if(reset){
            return;
        }
        if(animationFlag){
            await sleep(animationTime);

            animation = [tempHull ,[points[0], points[points.length - 1]]];
            drawColor = [colors.black,colors.orange];
            render();
        }

        //Recursively find hulls
        let hullL = await quickHull(S1, points[0], points[points.length - 1]);
        if(reset){
            return;
        }

        hullL.pop();    //Prevent duplication of side points
        
        let hullR = await quickHull(S2, points[points.length - 1], points[0]);
        if(reset){
            return;
        }

        hullR.pop();    //Prevent duplication of side points

        return hullL.concat(hullR);     //Merge and return
    }

    //Recursive part
    //Animation
    if(reset){
        return;
    }
    if(animationFlag){
        await sleep(animationTime);

        animation = [tempHull, [p1, p2]];
        drawColor = [colors.black, colors.orange];
        animPoints = S;
        render();
    }
    
    //Base case
    if(S.length === 0){
        hull.push(p1);
        hull.push(p2);

        //for animation
        tempHull.push(p1);
        tempHull.push(p2);

        return [p1, p2];
    }

    //find index of h'
    let h = findFurthestPoint(S, p1, p2);

    //calculate ah & hb left points
    let S1 = findLeftSet(points, p1,  S[h]);        //Left array
    let S2 = findLeftSet(points,  S[h], p2);        //Right array

    //Recursively calculate and merge
    let hullL = await quickHull(S1, p1,  S[h]);
    if(reset){
        return;
    }

    let hullR = await quickHull(S2,  S[h], p2);
    if(reset){
        return;
    }

    return hullL.concat(hullR);
}

//Mergehull algorithm
async function mergeHull(S, direction = 0){

    // //Animation
    // if(reset){
    //     return;
    // }
    // if(animationFlag){
    //     await sleep(animationTime);

    //     lettempHull
    //     animation = [tempHull];
    //     drawColor = [colors.orange];
    //     animPoints = S;
    //     render();
    // }

    //Base case
    if(!S){
        return [];
    }
    if(S.length === 0){
        return [];
    }
    if(S.length === 1){
        return [S];
    }
    if(S.length === 3 || S.length === 2){
        return S;
    }

    let newDir = direction === 0 ? 1 : 0;   //Change direction

    // //Sort
    // if(direction === 1){
    //     S.sort(function(a, b) {
    //         if (a[0] !== b[0]) {
    //             return a[0] - b[0]; // Sort by x-coordinate first
    //         } else {
    //             return a[1] - b[1]; // If x-coordinates are equal, sort by y-coordinate
    //         }
    //     });    //sort by x then y
    // }
    // else{
    //     S.sort(function(a, b) {
    //         if (a[1] !== b[1]) {
    //             return a[1] - b[1]; // Sort by y-coordinate first
    //         } else {
    //             return a[0] - b[0]; // If y-coordinates are equal, sort by x-coordinate
    //         }
    //     });    //sort by y then x
    // }

    //Cut S into half and recursively pass
    let middleIndex = Math.floor(S.length / 2);

    // Split the array into two halves
    let S1 = S.slice(0, middleIndex);
    let S2 = S.slice(middleIndex);

    // Recursively pass the two halves
    let hullL = await mergeHull(S1, newDir);
    if(reset){
        return;
    }

    //Animation
    let tempHull = hullL.slice();
    if(reset){
        return;
    }
    if(animationFlag){
        await sleep(animationTime);

        tempHull.push(tempHull[0])
        animation = [tempHull];
        drawColor = [colors.blue];
        animPoints = hullL.slice();
        render();
    }
    tempHull = [];

    let hullR = await mergeHull(S2, newDir);
    if(reset){
        return;
    }

    //Animation
    tempHull = hullR.slice();
    if(reset){
        return;
    }
    if(animationFlag){
        await sleep(animationTime);

        tempHull.push(tempHull[0])
        animation = [tempHull];
        drawColor = [colors.blue];
        animPoints = hullR.slice();
        render();
    }
    tempHull = [];

    //Merge without animating
    temp = animationFlag
    animationFlag = 0;
    let merged = await grahamsScan(hullL.concat(hullR));
    animationFlag = temp;

    return merged;
}

//UI function for animations 
function calculateAnimation() {
    animationFlag = 1;

    calculateHull();
    return;
}

//UI function to reset calculations
function resetAnimation() {
    reset = 1;
    hull = [];
    render();
    return;
}

//Sleep function for animations
var sleepSetTimeout_ctrl;
function sleep(ms) {
    clearInterval(sleepSetTimeout_ctrl);
    return new Promise(resolve => sleepSetTimeout_ctrl = setTimeout(resolve, ms));
}