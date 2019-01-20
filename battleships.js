        var player, 			
			ship={type:"Sub",
					btn:null,
					col:"gray"},
			config={size:10,
					vcalc:3
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
		
runIt();
	