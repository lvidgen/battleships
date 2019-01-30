# Battleship Royale

An HTML5 version of the classic board game. Play against another human (using peer-to-peer WebRTC) or against the computer.

## Background
This game is based on the Milton Bradley board game [Battleship](https://boardgamegeek.com/boardgame/2425/battleship) that was itself based on the pen and paper version.

## Setup
This version can be played without having to upload files to a server. It operates in two modes:

### Player vs Computer:
This mode can be played offline. Simply enter your name, choose the grid size, place your ships and start bombing. 
For testing purposes, there is a "cheat mode" checkbox at the bottom of the screen that can be activated to see where the computer's ships are.

### Player vs Player:
This mode uses websockets and HTML5's Real Time Communication protocol. 
The initial connection is brokered through the open source [PeerJS cloud server](https://peerjs.com).
Once the connection is made, no peer-to-peer data passes through the server - WebRTC allows direct communication between browsers. 

The two players can use separate tabs of the same browser, separate windows or separate PCs
An internet connection is required for the two pages to talk to each other but the files can be run locally (on the hard drive, etc) without uploading to the server.

For an initial connction to be made, one player needs to pass their Peer-generated ID to the other. Obviously, for copy and paste purposes this is best done via IM on computer. 

## Browser compatibility
Chrome and Firefox work perfectly. Microsoft Edge handles One Player mode OK but doesn't seem capable of making a correct WebSocket connection for two player. 
Internet Explorer fails as expecteed, both on modern JS and CSS.

