        var player, 			
			ship={type:"Sub",
					btn:null,
					col:"gray"},
			config={size:10,
					vcalc:3, 
					gameon:true
					};
		
		function makeBoard() {		
		for (a in player.fleet) {		
		// make buttons for placing ships
            var btn = document.createElement("input");
            btn.type = "button";
            btn.value = "Place " + a;
            btn.className = "placer";
            document.getElementById("shipbtns").appendChild(btn)
            document.getElementById("shipbtns").appendChild(document.createElement("hr"))
        }
            setUp("ships");
            setUp("bombs");
        }

        function makeFleet(nm) {		// object factory for player & comp fleets
            this.fleet = { 
                    Carrier: {
                        hits: 0,
                        slots: 5,
                        coords: []
                    },
                    Battleship: {
                        hits: 0,
                        slots: 4,
                        coords: []
                    },
                    Cruiser: {
                        hits: 0,
                        slots: 3,
                        coords: []
                    },
                    Sub: {
                        hits: 0,
                        slots: 3,
                        coords: []
                    },
                    Destroyer: {
                        hits: 0,
                        slots: 2,
                        coords: []
                    }
                },
            this.shotstaken = [];
			this.placed=0;
			this.toplace=Object.keys(this.fleet).length;
            this.sunk = 0;
            this.name = nm;
			this.one=false;
        }

		function runIt() {
			player = new makeFleet("Player 1");			
            makeBoard();
                }

        function setUp(dv) {
            document.getElementById(dv).style.gridTemplateColumns = "repeat(" + (config.size + 1) + "," + config.vcalc + "vw)";
            document.getElementById(dv).style.gridTemplateRows = "repeat(" + (config.size + 1) + "," + config.vcalc + "vw)";

            var grid = Math.pow((config.size + 1), 2);		//caclulate number of divs required to make grid
            for (var i = 0; i < grid; i++) {
                var mydiv = document.createElement("div");
                if (i == 0) {		
				//top left corner - no content
                    mydiv.className = "coord";
                }
                if (i > 0 && i < config.size + 1) { 	
				// top row - letters
                    mydiv.className = "coord";
                    mydiv.innerHTML = String.fromCharCode(i + 64);
                }
                if (i % (config.size + 1) == 0 && i > 0) { 	
				//left column - numbers
                    mydiv.className = "coord";
                    mydiv.innerHTML = i / (config.size + 1);
                }
                if (i > config.size && i % (config.size + 1) != 0) { 	
				// playing field
                    var num = Math.floor(i / (config.size + 1));
                    mydiv.className = "grid-item";
                    if (dv === "bombs") {
                        mydiv.style.cursor = "crosshair";
                    }
                    mydiv.id = dv + String.fromCharCode((i % (config.size + 1)) + 64) + num; 	//id's correspond to grid references
                }
                document.getElementById(dv).appendChild(mydiv)
            }
   
	   }

	    var rads = document.getElementsByName("orient");	//radio buttons to change between horizontal and vertical ship placement
        for (var x = 0; x < rads.length; x++) {
            rads[x].onchange = checkOr;
        }


        document.getElementById("shipyd").onclick = function(evt) { 	
		//"place ship" button has been clicked - show helper div and move it with mouse movement
            if (evt.target.className === "placer") {
				document.getElementById("ships").style.pointerEvents="auto";
                ship.btn = evt.target;
                var offset = (config.vcalc / 2) * (document.documentElement.clientWidth / 100);
                ship.type = ship.btn.value.replace("Place ", "");
                var hlpr = document.getElementById("ship");
                hlpr.style.display = "block";
                hlpr.style.left = evt.pageX - offset + "px";
                hlpr.style.top = evt.pageY - offset + "px";
                checkOr();

                document.onmousemove = function(evt) {
                    hlpr.style.left = evt.pageX - offset + "px";
                    hlpr.style.top = evt.pageY - offset + "px";

                }
            }
        }

        function checkOr() {	
		// to switch helper div orientation between vertical and horizontal
            var hlpr = document.getElementById("ship"),
                x = config.vcalc + "vw",
                y = (player.fleet[ship.type].slots * config.vcalc) * .98 + "vw";

            if (document.getElementById("hori").checked) {
                hlpr.style.height = x;
                hlpr.style.width = y;
            } else {
                hlpr.style.height = y;
                hlpr.style.width = x;
            }
        }	
		
		
		document.getElementById("ships").onclick = function(evt) { 
		// clicking on "ships" div to place ship
            if (evt.target.className === "grid-item" && player.placed < player.toplace) {
                var dtarg = evt.target;
                var hlpr = document.getElementById("ship");
                var col = dtarg.id[5];		// get coords of click location
                var row = Number(dtarg.id.substr(6))
                var size = player.fleet[ship.type].slots;
                var ori = document.getElementById("hori").checked ? "h" : "v";
                var spots = canPlace(col, row, size, ori, player.fleet); // check that ship can be placed there - returns 0 length if no
                if (spots.length == 0) {
                    hlpr.style.backgroundColor = "red";
                    setTimeout(function() {
                        hlpr.style.backgroundColor = "gray";
                    }, 500)
                } else {
                    for (var i = 0; i < size; i++) {
                        document.getElementById("ships" + spots[i]).style.backgroundColor = ship.col;
                    }
                    hlpr.style.display = "none"; //hide helper div
                    player.placed++; 
					ship.btn.disabled = true; //disable button corresponding to this ship
					document.getElementById("ships").style.pointerEvents="none"; // disable clicks until new ship selected
					player.fleet[ship.type].coords = spots; // store ship coordinates
                    document.onmousemove = function() {} // remove onmousemove listener
                    if (player.toplace == player.placed) { 
					// done placing ships, show right side game board
                        document.getElementById("bombs").style.display = "grid";
						document.getElementById("shipyd").style.display = "none";
                    }
                }   
            }
        }


        function canPlace(col, row, size, ori, fleet) { 
		// can a ship of this size be placed on that spot?
            var spots = [],
                valid = true,
                colnum = col.charCodeAt() - 65;
            if (ori == "h") {
                if (colnum + size > config.size) { 
				//too close to the side
                    valid = false;
                }
                if (valid) {
                    for (var i = 0; i < size; i++) { 
                        var grid = String.fromCharCode(colnum + i + 65) + row;
                        spots.push(grid)
                        if (isTaken(fleet, grid).isHit) { 
						// overlaps with already-placed ships
                            valid = false;
                        }
                    }
                }
            } else {
                if (row + size > config.size + 1) { 
				//too close to the bottom
				valid = false;
                }
                if (valid) { 
                    for (var i = 0; i < size; i++) {
                        var grid = col + (row + i);
                        spots.push(grid)
                        if (isTaken(fleet, grid).isHit) { 
						// overlaps with already-placed ships
                            valid = false;
                        }
                    }
                }
            }
            if (valid) {
                return spots;
            } else {
                return [];
            }
        }

        function isTaken(flt, theid) { 
		// to check if a boat occupies a particular coordinate - for ship placement and can also be for hit detection
            var boat = "",
                hit = false;
            for (a in flt) {
                if (flt[a].coords.indexOf(theid) != -1) {
                    hit = true;
                    boat = a;
                    break;
                }
            }
            return {
                isHit: hit,
                bt: boat
            }
        }
		
		document.getElementById("bombs").onclick = function(evt) { 
            if (evt.target.style.cursor === "crosshair" && config.gameon) {
                evt.target.style.cursor = "no-drop";
                var theid = evt.target.id.replace("bombs", "");
				// drop bomb - get coordinates of click and send them
                    sendIt({
                        type: "shot",
                        coords: theid
                    })
			}
        }
		
		function sendIt(data) {
            console.log(data);
        }
		
runIt();
	