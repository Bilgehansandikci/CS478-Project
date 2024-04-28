Name: 		  Bilgehan Yilmaz Sandikci
ID: 			  21902354
E-mail: 		yilmaz.sandikci@ug.bilkent.edu.tr
Date:       28.04.2024 21:10


Description:
This is a web app that uses four different convex hull finding algorithms. Namely: Gift-wrap, Graham's scan, Quick-hull, and Merge-hull.
The app has functionalities about creating & drawing n points using gaussian and normal distribution options, finding the convex hull of these points,
animating the algorithms and their inner workings while the hull is beings found, and the functionality to add new points by clicking with mouse. The
elapsed time and some other information is displayed on-screen as well.

Note: the code in Common/ folder are taken from CS465 course webpage, and are needed to run the program.


To run:
Double click to open Project/main.html in a browser that supports WebGL.


Controls & Tips: 
UI is straightforward.

- Create N points with custom distribution: Enter the number of points(N) in "Enter n value" field, 
select the distribution you want in the "Select distribution" dropdown, and click "Draw" button.

- Add new points: Tick the "Enable adding new points" checkbox then click on the canvas.

- Zoom: Scrolwheel.

- Move camera: Dragging with mouse.

- Select Algorithm: Use "Select Algorithm" dropdown.

- Show hull: click "Calculate Hull" button.

- Show animation: enter the preferred time between animation steps(by milliseconds format) in "Animation frame speed", then click "Animate hull".

- Reset: While on animation, or to reset an already calculated hull, press "Reset" button.

Note: Adding points while animation/calculation is in progress is not allowed.

Tip: If "Animate hull" or "Reset" buttons are not working as expected in certain situations, click the same button again. This resolves the issue.



