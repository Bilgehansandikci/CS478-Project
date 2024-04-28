//@Author: Bilgehan Sandikci
//@Date & time: 28.04.2024 20:40
//This is the js file for utility functions that are needed for main.js

function createNode(data, index = -1) {
    return {
        data: data,
        index: index,
        prev: null,
        next: null
    };
}

//Build DLL circular list for grahams scan
function buildDoublyLinkedList(dataArray) {
    if (!dataArray || dataArray.length === 0) return null;

    let head = createNode(dataArray[0], 0);
    let current = head;

    for (let i = 1; i < dataArray.length;  i++) {
        let newNode = createNode(dataArray[i], i);
        current.next = newNode;
        newNode.prev = current;
        current = newNode;
    }

    //Link the first and the last ones
    current.next = head;
    head.prev = current;

    return head;
}

function displayInfo(){
    // Spans for stat display
    document.getElementById("algorithm-info").textContent = currentAlgorithm;
    document.getElementById("n-info").textContent = nValue;
    document.getElementById("time-info").textContent = timeElapsed;
}

function classifyTime(time){
    return time > 1000 ? (time / 1000).toFixed(2) + "s" : time.toFixed(2) + "ms";
}

//Find all points in S that are to the left of p1 & p2
function findLeftSet(S, p1, p2) {
    let leftSet = [];

    // Iterate through each point in S and check if it's on the left side of the line formed by p1 and p2
    for (let i = 0; i < S.length; i++) {
        let p3 = S[i];
        if (left(p1, p2, p3)) {
            leftSet.push(p3);
        }
    }

    return leftSet;
}

// Standard Normal variate using Box-Muller transform
function gaussianRandom(mean=0, stdev=1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

    return z * stdev + mean;
}

// Left turn function
function left(p1, p2, p3) {
    //calculate cross product
    let crossProduct = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
    return crossProduct > 0;
}

//Rotate array so index i becomes the first
function rotateArray(arr, i) {
    if (i >= arr.length || i < 0) {
        return arr; // Invalid index
    }

    // Slice the array to two and concatenate in reverse order
    return arr.slice(i).concat(arr.slice(0, i));
}

//Find the point h for quick-hull algorihm
function findFurthestPoint(S, p1, p2) {
    let maxDistance = -Infinity;
    let furthestPoint = null;
    let furthestIndex = -1;

    for (let i = 0; i < S.length; i++) {
        
        let p3 = S[i];
        if(p3 !== p1 ||p3 !== p2){

            // Calculate the distance from p3 to the line formed by p1 and p2
            let distance = distanceToLine(p1, p2, p3);
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestPoint = p3;
                furthestIndex = i;
            }
        }
    }

    return furthestIndex;
}

// Function to calculate the distance from a point p3 to the line formed by p1 and p2
function distanceToLine(p1, p2, p3) {
    let x1 = p1[0], y1 = p1[1];
    let x2 = p2[0], y2 = p2[1];
    let x3 = p3[0], y3 = p3[1];

    // Calculate the distance using the formula for the distance from a point to a line
    return Math.abs((y2 - y1) * x3 - (x2 - x1) * y3 + x2 * y1 - y2 * x1) / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
}