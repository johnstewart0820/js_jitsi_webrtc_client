// Copyright 1998-2019 Epic Games, Inc. All Rights Reserved.

function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

function setVisualization(id) {
    let descriptor = {
        Visualization: id
    };
    emitUIInteraction(descriptor);
    console.log(descriptor);
}

function setBandwidthCap(cap) {
    capBpsCmd = 'Encoder.MaxBitrate ' + cap;
    let descriptor = {
        Console: capBpsCmd
    }
    capStr = cap != 0 ? cap : 'Unlimited';
    document.getElementById('bandwidthCapDropdown').innerHTML = 'Bandwidth Cap (' + capStr + ' Mbps)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    emitUIInteraction(descriptor);
    console.log(descriptor);
}

function setFramerateCap(cap) {
    capFpsCmd = 't.maxFPS ' + cap;
    let descriptor = {
        Console: capFpsCmd
    }
    capStr = cap != 0 ? cap : 'Unlimited';
    document.getElementById('framerateCapDropdown').innerHTML = 'Framerate Cap (' + capStr + ' fps)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    emitUIInteraction(descriptor);
    console.log(descriptor);
}

function zoom() {
    let descriptor = {
        zoom: 1
    };
    emitUIInteraction(descriptor);
    console.log(descriptor);
}

function onCharacterButton(category, item) {
    let descriptor = {
        Category: category,
        Item: item
    };
    emitUIInteraction(descriptor);
    console.log(descriptor);
}

function onConfigButton(category, item) {
    let descriptor = {
        Category: category,
        Item: item
    };
    emitUIInteraction(descriptor);
    console.log(descriptor);
}

function setRes(width, height) {
    let descriptor = {
        Console: 'r.' + 'setres ' + width + 'x' + height + 'w'
    };
    emitUIInteraction(descriptor);
    console.log(descriptor);
}

function onConfigurationOne() {
    let descriptor = {
		Category: 0,
		Item: 3
	};
    emitUIInteraction(descriptor);
    console.log(descriptor);
}

function onConfigurationTwo() {
	let descriptor = {
	    Category: 1,
	    Item: 4
	};
	emitUIInteraction(descriptor);
}

function myHandleResponseFunction(data) {
	console.warn(data)
	if (data.substring("1080p")) {
		// UE4 only supports up to 1080p, not 4K.
		console.log("Disabling 4k button");
		let button4K = document.getElementById("4k");
		button4K.disabled = true;
		button4K.title = "4K is supported only when -NvEncH264ConfigLevel=NV_ENC_LEVEL_H264_52 UE4 is added to UE4 command line";
	}
	
	if (data == "lock_mouse") {
		registerLockedMouseEvents(playerElementGlobal);
	}
	else if (data == "unlock_mouse") {
		registerHoveringMouseEvents(playerElementGlobal);
	}
}

var mouse_locked = true;
function overrideRegisterHoveringMouseEvents(playerElement) {
	if (mouse_locked)
	{
		console.warn("unlock confirmed");
		mouse_locked = false;
		
		// clearing old events
		if (lockStateChange != undefined)
		{
			document.removeEventListener('pointerlockchange', lockStateChange, false);
			document.removeEventListener('mozpointerlockchange', lockStateChange, false);
		}

		playerElement.onclick = function () {};
		document.exitPointerLock();
		
		playerElementGlobal = playerElement;
		styleCursor = 'none';   // We will rely on UE4 client's software cursor.

		playerElement.onmousemove = function (e) {
			emitMouseMove(e.offsetX, e.offsetY, e.movementX, e.movementY);
			e.preventDefault();
		};

		playerElement.onmousedown = function (e) {
			emitMouseDown(e.button, e.offsetX, e.offsetY);
			e.preventDefault();
		};

		playerElement.onmouseup = function (e) {
			emitMouseUp(e.button, e.offsetX, e.offsetY);
			e.preventDefault();
		};

		// When the context menu is shown then it is safest to release the button
		// which was pressed when the event happened. This will guarantee we will
		// get at least one mouse up corresponding to a mouse down event. Otherwise
		// the mouse can get stuck.
		// https://github.com/facebook/react/issues/5531
		playerElement.oncontextmenu = function (e) {
			emitMouseUp(e.button, e.offsetX, e.offsetY);
			e.preventDefault();
		};

		if ('onmousewheel' in playerElement) {
			playerElement.onmousewheel = function (e) {
				emitMouseWheel(e.wheelDelta, e.offsetX, e.offsetY);
				e.preventDefault();
			};
		} else {
			playerElement.addEventListener('DOMMouseScroll', function (e) {
				emitMouseWheel(e.detail * -120, e.offsetX, e.offsetY);
				e.preventDefault();
			}, false);
		}

		playerElement.releaseMouseButtons = function (e) {
			releaseMouseButtons(e.buttons, e.offsetX, e.offsetY);
		};

		playerElement.pressMouseButtons = function (e) {
			pressMouseButtons(e.buttons, e.offsetX, e.offsetY);
			// settings variable in UI that it is using pixel streaming
			emitUIInteraction("pixel_stream_active");
		};
	}
}

registerHoveringMouseEvents = overrideRegisterHoveringMouseEvents;

var lockStateChange;

function overrideRegisterLockedMouseEvents(playerElement) {
	if (!mouse_locked)
	{
		mouse_locked = true;
		console.warn("lock_confirmed");

		playerElementGlobal = playerElement;

		var x = playerElement.width / 2;
		var y = playerElement.height / 2;

		playerElement.requestPointerLock = playerElement.requestPointerLock || playerElement.mozRequestPointerLock;
		document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

		playerElement.onclick = function () {
			playerElement.requestPointerLock();
		};

		// Respond to lock state change events
		document.addEventListener('pointerlockchange', lockStateChange, false);
		document.addEventListener('mozpointerlockchange', lockStateChange, false);

		lockStateChange = function() {
			if (document.pointerLockElement === playerElement ||
				document.mozPointerLockElement === playerElement) {
				console.log('Pointer locked');
				document.addEventListener("mousemove", updatePosition, false);
			} else {
				console.log('The pointer lock status is now unlocked');
				document.removeEventListener("mousemove", updatePosition, false);
			}
		}

		function updatePosition(e) {
			x += e.movementX;
			y += e.movementY;
			if (x > styleWidth) {
				x -= styleWidth;
			}
			if (y > styleHeight) {
				y -= styleHeight;
			}
			if (x < 0) {
				x = styleWidth + x;
			}
			if (y < 0) {
				y = styleHeight - y;
			}
			emitMouseMove(x, y, e.movementX, e.movementY);
		}

		playerElement.onmousedown = function (e) {
			emitMouseDown(e.button, x, y);
		};

		playerElement.onmouseup = function (e) {
			emitMouseUp(e.button, x, y);
		};

		playerElement.onmousewheel = function (e) {
			emitMouseWheel(e.wheelDelta, x, y);
		};

		playerElement.pressMouseButtons = function (e) {
			pressMouseButtons(e.buttons, x, y);
		};

		playerElement.releaseMouseButtons = function (e) {
			releaseMouseButtons(e.buttons, x, y);
		};
		
		playerElement.requestPointerLock();
	}
}

registerLockedMouseEvents = overrideRegisterLockedMouseEvents;

var playerElementGlobal;
var grabStyle = 'cursor: grab; cursor: -moz-grab; cursor: -webkit-grab';   // We will have a browser side grab cursor.
var isFullscreen = false;

function onParagonLoad() {
	styleAdditional = grabStyle;
	inputOptions.controlScheme = ControlSchemeType.HoveringMouse;
	inputOptions.fakeMouseWithTouches = true;
	styleWidth = 700;
	styleHeight = 394;

	if (document.addEventListener)
	{
	    document.addEventListener('webkitfullscreenchange', onFullscreenChange, false);
	    document.addEventListener('mozfullscreenchange', onFullscreenChange, false);
	    document.addEventListener('fullscreenchange', onFullscreenChange, false);
	    document.addEventListener('MSFullscreenChange', onFullscreenChange, false);
	}

	let fullscreenCheck = document.getElementById('ck-fullscreen');
	if(fullscreenCheck){
		fullscreenCheck.onclick = function(){
			if (!isFullscreen) {
				enterFullscreen();
			} else {
				exitFullscreen();
			}
		};
	}
	
	// When the data channel is connected we want to ask UE4 if 4K is supported.
	onDataChannelConnected = function() { emitUIInteraction("4K"); };
	
	addResponseEventListener("handle_responses", myHandleResponseFunction);
}

function onFullscreenChange(data)
{
	var fullscreenDiv    = document.getElementById("player");
	isFullscreen = (document.webkitIsFullScreen 
		|| document.mozFullScreen 
		|| (document.msFullscreenElement && document.msFullscreenElement !== null) 
		|| (document.fullscreenElement && document.fullscreenElement !== null)
		|| (fullscreenDiv && fullscreenDiv.classList.contains("fullscreen")));

	let fullscreenImg = document.getElementById('fullscreen-img');
	if(fullscreenImg){
		fullscreenImg.src = isFullscreen ? 'images/MinimiseToFullscreen.png' : 'images/MaximiseToFullscreen.png'
		fullscreenImg.alt = isFullscreen ? 'Shrink to normal size' : 'Maximise to Fullscreen'
	}
}

function enterFullscreen()
{
	var fullscreenDiv    = document.getElementById("player");
	var textDivs    = document.getElementsByClassName("text");
	var headerDiv    = document.getElementById("header-tbl");
	var fullscreenFunc   = fullscreenDiv.requestFullscreen;

	if (!fullscreenFunc) {
	  ['mozRequestFullScreen',
	   'msRequestFullscreen',
	   'webkitRequestFullScreen'].forEach(function (req) {
	     fullscreenFunc = fullscreenFunc || fullscreenDiv[req];
	   });
	}

	if(fullscreenFunc){
		fullscreenFunc.call(fullscreenDiv);
	} else {
		//No Fullscreen api so maximise video to window size
		if(fullscreenDiv){
			fullscreenDiv.classList.add("fullscreen");
			fullscreenDiv.classList.remove("fixed-size");
		}

		if(textDivs){
			for(let i=0; i<textDivs.length; i++){
				textDivs[i].style.display = "none";
			}
		}

		if(headerDiv)
			headerDiv.style.display = "none";

		onFullscreenChange({});
		onInPageFullscreen();
	}
}

function exitFullscreen()
{
	var fullscreenDiv    = document.getElementById("player");
	var textDivs    = document.getElementsByClassName("text");
	var headerDiv    = document.getElementById("header-tbl");
	var exitFullscreenFunc   = document.exitFullscreen;

	if (!exitFullscreenFunc) {
	  ['mozCancelFullScreen',
	   'msExitFullscreen',
	   'webkitExitFullscreen'].forEach(function (req) {
	     exitFullscreenFunc = exitFullscreenFunc || document[req];
	   });
	}

	if(exitFullscreenFunc) {
		exitFullscreenFunc.call(document);
	} else {
		//No Fullscreen api so shrink video back from max window size
		if(fullscreenDiv){
			fullscreenDiv.classList.remove("fullscreen");
			fullscreenDiv.classList.add("fixed-size");
			fullscreenDiv.style.left = "";
		}

		if(textDivs){
			for(let i=0; i<textDivs.length; i++){
				textDivs[i].style.display = "block";
			}
		}

		if(headerDiv)
			headerDiv.style.display = "table";

		onFullscreenChange({});
		onInPageFullscreen();
	}
}

function onInPageFullscreen(){
	var playerElement = document.getElementById('player');
	let videoElement = playerElement.getElementsByTagName("VIDEO");
	document.documentElement.style.position = isFullscreen ?  "fixed" : "";
	document.body.style.position =  isFullscreen ?  "fixed" : "";

	if(isFullscreen){
		let windowAspectRatio = window.innerHeight / window.innerWidth;
		let playerAspectRatio = playerElement.clientHeight / playerElement.clientWidth;
		// We want to keep the video ratio correct for the video stream
	    let videoAspectRatio = videoElement.videoHeight / videoElement.videoWidth;

	    if(isNaN(videoAspectRatio)){
	    	//Video is not initialised yet so set playerElement to size of window
	    	styleWidth = window.innerWidth;
	    	styleHeight = window.innerHeight;
	    	styleTop = 0;
	        styleLeft = Math.floor((window.innerWidth - styleWidth) * 0.5);
	        //Video is now 100% of the playerElement so set the playerElement style
	        playerElement.style.width= styleWidth + "px";
	        playerElement.style.height= styleHeight + "px";
	    } else if (windowAspectRatio < playerAspectRatio) {
	        styleWidth = Math.floor(window.innerHeight / videoAspectRatio);
	        styleHeight = window.innerHeight;
	        styleTop = 0;
	        styleLeft = Math.floor((window.innerWidth - styleWidth) * 0.5);
	        //Video is now 100% of the playerElement so set the playerElement style
	        playerElement.style.width= styleWidth + "px";
	        playerElement.style.height= styleHeight + "px";
	    }
	    else {
	        styleWidth = window.innerWidth;
	        styleHeight = Math.floor(window.innerWidth * videoAspectRatio);
	        styleTop = Math.floor((window.innerHeight - styleHeight) * 0.5);
	        styleLeft = 0;
	        //Video is now 100% of the playerElement so set the playerElement style
	        playerElement.style.width= styleWidth + "px";
	        playerElement.style.height= styleHeight + "px";
	    }

	} else {
		playerElement.style.height = "";
		playerElement.style.width = "";
	}
}
