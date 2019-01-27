        var peer = null,
			comp = null,
			player, 			
			ship={type:"Sub",
					btn:null,
					col:"gray"},
			config={size:0,
					vcalc:0,
					gameon:true,
					plyrone:false,
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
					document.getElementById("loading").style.display = "none";
					config.plyrone = true;
                    showSizeSel();
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
				config.plyrone = true;
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
			if(!config.plyrone){
				
			}
            // Handle a chat connection.
            if (c.label === 'chat') {
                // Just to fix the connection receiver to successfully send a message to the connection requester
                c.open = true;
                c.on('data', function(data) {
                    getData(data);
                });
                c.on('close', function() {
					alert("The connection has been closed.");
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
			config.gameon = true;
            document.getElementById("status").style.visibility = "visible";
			document.getElementById("status").innerHTML="Please place your ships..."
            document.getElementById("outer").style.display = "block";
			document.getElementById("wrapper").style.display = "grid";
			document.getElementById("bombs").style.display = "none";
			document.getElementById("shipyd").style.display = "block";
            document.getElementById("blanket").style.display = "none";
			for (a in player.fleet) {		
			// make buttons for placing ships
				var btn = document.createElement("input");
				btn.type = "button";
				btn.value = "Place " + a;
				btn.className = "placer";
				document.getElementById("shipbtns").appendChild(btn);
				document.getElementById("shipbtns").appendChild(document.createElement("hr"))
			}
			document.getElementById("ships").innerHTML="";
			document.getElementById("bombs").innerHTML="";
            setUp("ships");
            setUp("bombs");
        }

        function makeFleet(nm) {		
		// object factory for player & comp fleets
            this.fleet = { /*
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
                    },*/
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
			config.size = 4;
            config.vcalc = 30 / config.size; // helper calc. for getting widths right			
            makeBoard();
            if (!peer) {
			//make computer player object
                comp = new makeFleet("Computer");
                config.opp = comp.name;
                document.getElementById("p2").innerHTML = config.opp;
				comp.hits = [];
				comp.dirs = ["e", "n", "w", "s"];
                comp.dir = "e";
				compShips();
			} else {
			// send config.size to player 2 for their setup
                peer.conn.send({
                    type: "gsize",
                    gs: config.size
                })
            }
		}	
		
        function compShips() { 
		// make computer fleet
            for (a in comp.fleet) {
                var boat = a;
                var size = comp.fleet[boat].slots;
                var tmp = trySpot(size, comp.fleet);
                while (tmp.length == 0) {
                    tmp = trySpot(size, comp.fleet);
                }
                comp.fleet[boat].coords = tmp;
            }
        }
		
		
        function trySpot(size, fleet) { 
		//randomly generate coordinates to try to place ships 
            var ori = ["v", "h"][Math.round(Math.random())],
                poss = randCoord(),
                col = poss[0],
                num = Number(poss.slice(1));
            return canPlace(col, num, size, ori, fleet);
        }
			
        function randCoord() { 
		// get a random coordinate from the available grid size
            var clet = String.fromCharCode(Math.floor(Math.random() * config.size) + 65),
                cnum = Math.floor(Math.random() * config.size) + 1;
            return clet + cnum;
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
                        if (comp) {
                            document.getElementById("cheatwrap").style.visibility = "visible"; // show "cheat mode" checkbox
                        }
						if (config.plyrone) {
                            if (config.p2ready || comp) { 
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
		
        document.getElementById("cheat").onchange = function() { 
		// show comp fleet
            var ischk = this.checked;
            for (a in comp.fleet) {
                var arr = comp.fleet[a].coords,
                    len = arr.length,
                    i = 0;
                for (i; i < len; i++) {
                    document.getElementById("bombs" + arr[i]).style.border = ischk ? "dotted" : "1px solid";
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
                if (comp) { 
				// playing vs computer - check if hit, then computer shoots after waiting a bit
                    getHit(theid, "pl1", comp);
                    var wait = Math.random() * 2000;
                    setTimeout(compShot, wait);
                } else { 				
				// drop bomb - get coordinates of click and send them
                    sendIt({
                        type: "shot",
                        coords: theid
                    })	
				}
			}
        }
		
        function compShot() {
			var aimshot=true; //not a random guess
            if (config.gameon) {
                if (comp.hits.length == 0) {
                    var poss = randCoord();
					aimshot=false;
                } else {
                    if (!comp.dir) {
                        changeDir();
                    }
                    if (comp.poss[comp.dir].length == 0) { 
					// dead end - change direction
                        changeDir();
                        compShot();
                        return;
                    }
                    var poss = comp.poss[comp.dir].shift();
                }
                if (comp.shotstaken.indexOf(poss) == -1) { 
				    //hasn't been tried before
                    comp.shotstaken.push(poss);
                    var shot = getHit(poss, "comp", player);
                    if (shot.res) {    
                        if (comp.hits.length == 0) { 
						// unique hit - store as pivot
                            calcPoss(poss)
                        }
						comp.hits.push(poss); // store successful hits
                    } else {
						if(aimshot){
							comp.poss[comp.dir].length = 0;
						}
					}
                    if (shot.snk) {
                        for (var i = 0; i < shot.slts.length; i++) {
                            if (comp.hits.includes(shot.slts[i])) {
								 // remove sunk ship's coords from hits list
                                comp.hits.splice(comp.hits.indexOf(shot.slts[i]), 1)
                            }
                        }
                        if (comp.hits.length > 0) {
							 // if more pivots available, calculate the likely hits for first one
                            calcPoss(comp.hits[0])
                        }
                        comp.dir = null;
                        togglePlayer(true);
                        return;
                    }
                    togglePlayer(true);
                } else {
					if(aimshot){
						// spot has already been tried - dead end
						comp.poss[comp.dir].length = 0; 
					}
                    compShot();
                }
            }
        }

        function changeDir() {
            if (!comp.dir) {
				// random direction
                comp.dir = comp.dirs[Math.floor(Math.random() * comp.dirs.length)]; 
            } else {
				 // pivot 180 degrees
                comp.dir = comp.dirs[(comp.dirs.indexOf(comp.dir) + 2) % 4];
                if (comp.poss[comp.dir].length == 0){
				 // pivot 90 degrees	
                    comp.dir = comp.dirs[(comp.dirs.indexOf(comp.dir) + 1) % 4];
				}
            }
        }

        function calcPoss(anc) {
            var we = [],
                ns = [],
                ltr = anc[0],
                num = Number(anc.substring(1));
            for (var i = 0; i < config.size; i++) {
                ns.push(ltr + (i + 1)) // get all coordinates in the column of the pivot point
                we.push(String.fromCharCode(65 + i) + num);  // get all coordinates in the row of the pivot point
            }
            comp.poss = { 
			/* store coordinates in ascending order from hit point, so for H5:
					E5
					F5
			        G5 
			H8,H7,H6  H4,H3,H2 
					I5
					J5
					K5
			*/
                n: ns.splice(0, ns.indexOf(anc)).reverse(),
                s: ns.splice(ns.indexOf(anc) + 1),
                w: we.splice(0, we.indexOf(anc)).reverse(),
                e: we.splice(we.indexOf(anc) + 1)
            }
            return comp.poss;
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
		
		function getHit(theid, who, targ) { 
		// receive a hit, iterate over fleet coordinates 
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
                        if (peer) {
                            sendIt({  // send notification to other player
                                type: "chat",
                                sndr: "sys",
                                msg: txt
                            })
                            sendIt({
                                type: "end",
                                lost: true
                            })
                        } 
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
                    if (who == 'comp') { 
			/* hack for letting comp calculate where the sunk boat was
			   we could make this more 'human' by getting the first and last comp.hits, 
			   calculating orientation based on if the letters in the 
			   coords are the same and counting back from the last hit by 
			   the amount of slots in the ship, but really...	
			*/
                return {
                    id: theid,
                    res: hit,
                    snk: sunk,
                    slts: slots
                }
            }
		
		}
		
		
        function endGame(ilose) { 
		// show end dialog
			document.getElementById("connmess").style.visibility = "hidden";
			document.getElementById("status").style.visibility = "hidden";
			document.getElementById("loading").style.display = "none";
            document.getElementById("sizesel").style.display = "none";
            document.getElementById("blanket").style.display = "block";
            document.getElementById("winlose").style.display = "block";
			document.getElementById("cbox").innerHTML="";
			document.getElementById("shipbtns").innerHTML="";
			document.getElementById("wrapper").style.display = "none";
			document.getElementById("players").style.visibility = "hidden";
			document.getElementById("cheatwrap").style.visibility = "hidden";
			document.getElementById("cheat").checked = false;			
            document.getElementById("endmess").innerHTML = ilose ? "<p>" + config.opp + " wins. </p><p>Please don't be sad. It's just a game</p>" : "<p>" + player.name + " wins! Congratulations. </p><p>Please don't gloat. Be like Mike</p>";
			var me = player.name;
			player = new makeFleet(me);
		}
		
		document.getElementById("endbtns").onclick = function(evt) { 
            if (evt.target.id === "norepl") {
				if(peer){
					peer.conn.close();
				}
				location.href="https://www.google.com";
			} else {
				document.getElementById("winlose").style.display = "none";
				document.getElementById("replay").style.display = "block";
				document.getElementById("rewelc").innerHTML="Welcome back, " + player.name +"!";
			}
		}	
		
		document.getElementById("replselect").onclick = function(evt) {	
		config.p2ready=false;
		document.getElementById("replay").style.display = "none";
			if (evt.target.id === "replsub") {
				if (comp){
					makeConn();
					comp=null;
				} else {					
					if(config.plyrone){
						waitConfig();
					} else {
						showSizeSel();
					}
				config.plyrone = !config.plyrone;	
				}
			} else {
				// playing vs comp.
			//	comp = new makeFleet("Computer");
				if(!comp){
					peer.conn.close();
					peer=null;					
				} 
			showSizeSel();	
			}
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
                    if (!config.plyrone) {
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
            case "end": 
				// player 2 has lost
                    endGame(false);
                    config.gameon = false;
                    break;					
            }
        }