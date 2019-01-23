        var peer = null,
			player, 			
			ship={type:"Sub",
					btn:null,
					col:"gray"},
			config={size:0,
					vcalc:0,
					gameon:true,
					p2ready:false,
					opp:"Player 2"
					};
	
        document.getElementById("plselect").onclick = function(evt) {  
		//get user's name
            if (evt.target.className === "plbutton") {
                var val = document.getElementById("nm").value;
                var nm = val == "" ? "Anonymous" : val;
				player = new makeFleet(nm);
                document.getElementById("p1").innerHTML = player.name;
                if (evt.target.id === "plsub") { 
				makeConn();				
			} else { 
			//playing vs. computer

                }
            }
        }
		
		function makeConn(){
							//playing vs. player -set up the peer connection
                    peer = new Peer({
                        debug: 2,
                        serialization: "json"
                    });
					
					peer.conn = null;
                    
                    peer.on('open', function(id) {
						// Show this peer's ID
						document.getElementById("welcome").style.display = "none";
						document.getElementById("login").style.display="block";
						document.getElementById("welc").innerHTML="Welcome, " + player.name;
						document.getElementById("myid").innerHTML=peer.id;
                    });

                    // Await connections from others
                    peer.on('connection', connect);

                    peer.on('error', function(err) {
                        if (err.type == 'disconnected') {
                            console.log("disconnected")
                        }
                        if (err.type == 'network') {
                            console.log("server. refresh")
                        }
                        if (err.type == 'browser-incompatible') {
							killSwitch();
                        }
                    })
				if (!util.supports.data){
							killSwitch();
				}
		}
		
		document.getElementById("gotid").onclick=function(){
			// the other player sent us their ID
			document.getElementById("login").style.display = "none";
			var theval=document.getElementById("oppid").value;
			if(theval!=""){
				player.one = true;
				dirconnect(theval);	
			}	
		}
		
		function killSwitch(){
			document.getElementById("loader").style.display = "none";
            alert("Your browser does not support the WebRTC protocol. \nWe suggest using Chrome or Firefox.");
		}

        
        function connect(c) {
			// Handle a connection object.
            peer.conn = c;
            sendIt({
                "type": "conn",
                "name": player.name
            });
			if(!player.one){
				
			}
            // Handle a chat connection.
            if (c.label === 'chat') {
                // Just to fix the connection receiver to successfully send a message to the connection requester
                c.open = true;
                c.on('data', function(data) {
                    getData(data);
                });
                c.on('close', function() {
					postChat("sys", config.opp + ' has closed the connection.');
					peer.conn=null;
                });
            }
        }

        
        function dirconnect(id) {
			// Connect to a peer
            var requestedPeer = id;
            if (!peer.conn) {
                var c = peer.connect(requestedPeer, {
                    label: 'chat',
                    serialization: 'json',
                    metadata: {
                        message: 'hi i want to chat with you!'
                    }
                });
                c.on('open', function() {
                    connect(c);
                });
                c.on('error', function(err) {
					postChat("sys", err)
                });
            }
			showSizeSel();
        }

        // Make sure things clean up properly.

        window.onunload = window.onbeforeunload = function(e) {
            if (!!peer && !peer.destroyed) {
                peer.destroy();
            }
        };


        function showSizeSel() {	
		// show the grid size selection dialog
            document.getElementById("welcome").style.display = "none";
            document.getElementById("sizesel").style.display = "block";
        }
		
				
		document.getElementById("runbtn").onclick = runIt;
		
		document.getElementById("gsize").onkeypress = function(evt){
			  if (event.keyCode === 13) {
				runIt();
			}
		}
	
		
		function makeBoard() {	
            document.getElementById("status").style.visibility = "visible";
			document.getElementById("status").innerHTML="Please place your ships..."		
			for (a in player.fleet) {		
			// make buttons for placing ships
				var btn = document.createElement("input");
				btn.type = "button";
				btn.value = "Place " + a;
				btn.className = "placer";
				document.getElementById("shipbtns").appendChild(btn);
				document.getElementById("shipbtns").appendChild(document.createElement("hr"))
			}
            document.getElementById("outer").style.display = "block";
			document.getElementById("wrapper").style.display = "grid";
			document.getElementById("bombs").style.display = "none";
			document.getElementById("shipyd").style.display = "block";
            document.getElementById("blanket").style.display = "none";
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
			var min=10, max=50;
			config.size = Number(document.getElementById("gsize").value);
            if (config.size > max) {
                config.size = max;
            }
            if (config.size < min) {
                config.size = min;
            }
            config.vcalc = 30 / config.size; // helper calc. for getting widths right			
            makeBoard();
			// send config.size to player 2 for their setup
                peer.conn.send({
                    type: "gsize",
                    gs: config.size
                })
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
						document.getElementById("bombs").style.pointerEvents = "none";
                        if (player.one) {
                            if (config.p2ready) { 
							// player 2 has already placed ships, or playing against computer, so ready to play 
                                goPlayerOne();
                            } else {
                                document.getElementById("status").innerHTML = "Waiting for " + config.opp + " to place ships";
                            }
                        } else { 
						// player 2, so send msg to player 1 that ships have been placed
                            sendIt({
                                type: "p2ready",
                                deets: true
                            })
                            document.getElementById("status").innerHTML = config.opp + " to shoot. Please wait...";
                            document.getElementById("p2").className = "plyr on";
                        }
						document.getElementById("players").style.visibility = "visible";
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
	            togglePlayer(false);			
				// drop bomb - get coordinates of click and send them
                    sendIt({
                        type: "shot",
                        coords: theid
                    })	
			}
        }
		
		function sendIt(data) {
            peer.conn.send(data);
        }
		
		
        function postChat(plr, msg) { 
		// for posting directly to own chat
            var thediv = document.createElement("div"),
				me = player.name,
                cls = {
                    sys: "red"
                }
			cls[me]="black";	
			cls[config.opp]="blue";	
            thediv.style.color = cls[plr];
            thediv.appendChild(document.createTextNode(plr + ": " + msg));
            document.getElementById("cbox").appendChild(thediv);
        }

        function enterChat() { 
		// for sending chat to other player
            var txt = document.getElementById("msgs").value,
                theobj = {
                    sndr: player.name,
                    type: "chat",
                    msg: txt
                }
            postChat(player.name, txt);
            if (peer.conn) {
                sendIt(theobj);
            }
            document.getElementById("msgs").value = "";
        }
		
		document.getElementById("msgbtn").onclick = enterChat;
		
		document.getElementById("msgs").onkeypress = function(evt){
			  if (event.keyCode === 13) {
				enterChat();
			}
		}
		
		function getHit(theid, who, targ) { // receive a hit, iterate over fleet coordinates 
            var thediv = document.getElementById("ships" + theid),
                flt = targ.fleet,
                res = isTaken(flt, theid),
                hit = res.isHit,
                sunk = false,
                slots = [];
            if (hit) {
                flt[res.bt].hits++; 
                if (flt[res.bt].hits === flt[res.bt].slots) { 
				// ship has been sunk 
                    var txt = targ.name + "'s " + res.bt + " has been sunk!";
                    sunk = true;
                    slots = flt[res.bt].coords;
					postChat("sys", txt);
                    targ.sunk++;
                    if (targ.sunk == player.toplace) { 
					// all ships have been sunk
                        var txt = targ.name + " loses!" 
                        postChat("sys", txt)  // post direct to chat if playing vs comp 
                        endGame(targ.name == player.name); // did the player lose or was it the comp?
                        config.gameon = false;
                    }
                }
            }
		    if (who != "pl1") {
				// other player fired
                placeDot("ships" + theid, hit); 
            } else {
				// this player fired
                placeDot("bombs" + theid, hit); 
            }
            if (peer) {
                sendIt({ 	// tell other player if hit or miss 
                    type: "res",
                    coords: "bombs" + theid,
                    hit: hit
                })
            }	
        }
		
		function endGame(){
			
		}
		
        function placeDot(idstr, hit) { 
		// places dot coloured depending on hit or miss
            var mydiv = document.createElement("div");
            mydiv.className = "dot";
            mydiv.style.backgroundColor = hit ? "red" : "white";
            document.getElementById(idstr).appendChild(mydiv);
        }
		
		function waitConfig(){
		document.getElementById("plone").innerHTML = "Receiving game configuration from "+config.opp+"...";	
		document.getElementById("loading").style.display = "block";	
		}
		
        function goPlayerOne() { 
		// setup for player 1	
            if (player.toplace == player.placed) {
			togglePlayer(true);
            }
        }
		
        function togglePlayer(isme) { 
		// toggle player indicator and text
            var statid = document.getElementById("status"),
                bdiv = document.getElementById("bombs"),
                onstr = "plyr on",
                offstr = "plyr";
            bdiv.style.pointerEvents = isme ? "auto" : "none";
            document.getElementById("p1").className = isme ? onstr : offstr;
            document.getElementById("p2").className = isme ? offstr : onstr;
            statid.innerHTML = isme ? player.name + " to shoot. Fire away!" : config.opp + " to shoot. Please wait...";
        }

		function getData(data) { 
		// data received...
            switch (data.type) {
			case "conn": 
				// connection established, exchange names
                    config.opp = data.name;
		            document.getElementById("connmess").innerHTML = config.opp + " has connected";
					document.getElementById("connmess").style.visibility = "visible";
                    document.getElementById("p2").innerHTML = config.opp;
                    if (!player.one) {
					document.getElementById("login").style.display = "none";	
                        peer.conn.send({
                            type: "conn",
                            name: player.name
                        });
					waitConfig();	
                    }
                    break;
            case "gsize": 
				// player 1 has sent grid size info to player 2
                    config.size = data.gs;
                    config.vcalc = 30 / config.size;
                    makeBoard();
                    break;
			case "chat": // chat
                    postChat(data.sndr, data.msg)
                    break;
			case "p2ready": 
				// player 2 has finished placing ships
                    config.p2ready = true;
                    goPlayerOne();
                    break;	
            case "shot": 
				// other player has sent shot
                    getHit(data.coords, "pl2", player);
                    togglePlayer(true);
                    break;
            case "res": 
				// other player has sent results of this player's shot
                    placeDot(data.coords, data.hit);
                    break;					
            }
        }