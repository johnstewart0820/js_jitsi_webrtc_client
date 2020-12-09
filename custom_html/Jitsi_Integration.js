/* global $, JitsiMeetJS */

const options = {
    hosts: {
        // XMPP domain.
        domain: 'comm.encade.org',
        muc: 'conference.comm.encade.org'
    },

    // BOSH URL. FIXME: use XEP-0156 to discover it.
    bosh: '//comm.encade.org/http-bind',

    // Websocket URL
    // websocket: 'wss://comm.encade.org/xmpp-websocket',
    clientNode: 'http://jitsi.org/jitsimeet',
    useStunTurn: true
};

// const options = {
//     hosts: {
//         domain: 'meet.jit.si',
//         muc: 'conference.meet.jit.si',
//         focus: 'focus.meet.jit.si',
//     },
//     externalConnectUrl: 'https://meet.jit.si/http-pre-bind',
//     enableP2P: true,
//     p2p: {
//         enabled: true,
//         preferH264: true,
//         disableH264: true,
//         useStunTurn: true,
//     },
//     useStunTurn: true,
//     bosh: `https://meet.jit.si/http-bind?room=liveroom`,
//     websocket: 'wss://meet.jit.si/xmpp-websocket',
//     clientNode: 'http://jitsi.org/jitsimeet',
// }

const confOptions = {
    openBridgeChannel: true,
};

const initOptions = {
    disableAudioLevels: true,
    enableAnalyticsLogging: false
}

let connection = null;
let isJoined = false;
let room = null;

let localTracks = [];
let isListener = true;
const remoteTracks = [];
let status_list = [];
let userName = 'user';
let test_on = false;

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks) {
    // console.log('>>>onLocalTracks', tracks);
    localTracks = tracks;
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
            audioLevel => console.log(`Audio Level local: ${audioLevel}`));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
            () => console.log('local track muted'));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
            () => console.log('local track stoped'));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
            deviceId =>
                console.log(
                    `track audio output device was changed to ${deviceId}`));
        if (localTracks[i].getType() === 'video') {
            // $('body').append(`<video autoplay='1' id='localVideo' />`);
            localTracks[i].attach($(`#localVideo`)[0]);
        } else {
            // $('body').append(
            //     `<audio autoplay='1' muted='true' id='localAudio' />`);
            // console.log('>>>localAudioChanged');
            // localTracks[i].attach($(`#localAudio`)[0]);
        }
        if (isJoined) {
            room.addTrack(localTracks[i]);
        }
    }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    // console.log('>>>onRemoteTrack', track.getParticipantId());
    if (track.isLocal() || track.getType() === 'video') {
        // console.log('>>>onRemoteTrackNull', track);
        return;
    }
    // console.log('>>>onRemoteTrack1', track.getParticipantId());
    const participant = track.getParticipantId();
    // console.log('>>>onRemoteTrack3', remoteTracks);
    const id = participant + track.getType();
    remoteTracks.map((remoteTrack, index) => {
        if (remoteTrack.id === participant) {
            remoteTrack.tracks.push(track);
            if (remoteTrack.tracks.length > 1) {
                const deletedID = participant + remoteTrack.tracks[0].getType();
                remoteTrack.tracks[0].detach($(`#${deletedID}`)[0]);
                remoteTrack.tracks.splice(0, 1);
            }
 
        }

    })

    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log('remote track muted'));
    track.addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('remote track stoped'));
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
            console.log(
                `track audio output device was changed to ${deviceId}`));

    if ($(`#${participant}`).length === 0) {
        // console.log(">>>$(`#${participant}`).length", $(`#${participant}`).length);
        $('#remote_area').append(`<div class='remoteitem' id='${participant}'></div>`)
    }

    if (track.getType() === 'video') {
        // console.log(">>>remote video item");
        if ($(`#${participant}video`).length === 0) {
            $(`#${participant}`).append(`<video class='remotevideo' autoplay='1' id='${participant}video' />`);
        }
    } else {
        // console.log(">>>remote audio item");
        if ($(`#${participant}audio`).length === 0) {
            $(`#${participant}`).append(`<audio autoplay='1' id='${participant}audio' />`);
        }
    }
    track.attach($(`#${id}`)[0]);
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoveTrack(track) {

    if (track.isLocal())
        return;
    console.log('>>>trackRemoved');
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
    document.getElementById('control-block').style.display = 'block';
    console.log('>>>onConferenceJoined');
    console.log('conference joined!');
    isJoined = true;
    room.setDisplayName(userName);
    for (let i = 0; i < localTracks.length; i++) {
        room.addTrack(localTracks[i]);
    }
    mute_self();
}
/**
 * That function is executed when the participant property is changed
 */
function handleParticipantPropertyChange(participant, propertyName, oldValue, newValue) {
    console.log('>>>handleParticipantPropertyChange', newValue);

    if (newValue == "none")
        return;
    remoteTracks.map((remoteTrack, index) =>{
        // console.log('>>>>>>>>handleParticipantPropertyChange', remoteTrack.id);
        if(remoteTrack.id === participant.getId()) {
            switch(propertyName) {
                case 'voice_status':
                    if (newValue === 'speaker') {
                        remoteTrack.status = 'speaker';
                        setMessageLabel();
                    } else if (newValue === 'listener') {
                        remoteTrack.status = 'listener';
                        setMessageLabel();
                    }
                    break;
                default:
                    return;
            }     
        }
    });
}

/**
 *
 * @param id
 */
function onUserLeft(id) {
    console.log('>>>onUserLeft');
    let tracks = null;
    let index = -1;
    remoteTracks.map((remoteTrack, ind) => {
        if (remoteTrack.id === id) {
            tracks = remoteTrack.tracks;
            index = ind;
        }
    })
    if (tracks != null) {
        for (let i = 0; i < tracks.length; i++) {
            const type = tracks[i].getType();
            tracks[i].detach($(`#${id + type}`)[0]);
        }
    }

    if (index != -1) {
        $(`#${id.toString()}`).remove();
        remoteTracks.splice(index, 1);
    }

    setMessageLabel();
}

/**
 *That function is called when a user speak a louldly.
 * @param id
 */
function onDominantSpeaker(id) {
    // if (!remoteTracks[id]) {
    //     return;
    // }
    
    // console.log(">>>>DominantSpeaker", remoteTracks[id]);
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
    console.log('>>>onConnectionSuccess');
    room = connection.initJitsiConference('liveroom', confOptions);
    room.on(JitsiMeetJS.events.conference.DOMINANT_SPEAKER_CHANGED, onDominantSpeaker);
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, onRemoveTrack);
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, (id, user) => {
        console.log('>>>userJoined', id, user.getDisplayName());
        remoteTracks.push({id: id, tracks: [], name: user.getDisplayName(), status: 'listener'});

    });
    room.on(JitsiMeetJS.events.conference.PARTICIPANT_PROPERTY_CHANGED, handleParticipantPropertyChange);
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
        console.log(`${track.getType()} - ${track.isMuted()}`);
    });
    room.on(
        JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, handleDisplayNameChange);
    room.on(
        JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
        (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
    room.on(
        JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
    room.join();
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
    console.error('Connection Failed!');
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {
    console.info('current devices', devices);
}

function handleDisplayNameChange(userID, displayName) {
    for (let i = 0; i < remoteTracks.length; i ++) {
        if (remoteTracks[i].id === userID) {
            remoteTracks[i].name = displayName;
        }
    }
    setMessageLabel();
}
/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log('>>>disconnect!');
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        disconnect);
}

/**
 *
 */
function unload() {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
    }
    room.leave();
    connection.disconnect();
}

let isVideo = true;

/**
 *
 */
function switchVideo() { // eslint-disable-line no-unused-vars
    isVideo = !isVideo;
    if (localTracks[1]) {
        localTracks[1].dispose();
        localTracks.pop();
    }
    JitsiMeetJS.createLocalTracks({
        devices: [isVideo ? 'video' : 'desktop']
    })
        .then(tracks => {
            localTracks.push(tracks[0]);
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log('local track muted'));
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                () => console.log('local track stoped'));
            localTracks[1].attach($('#localVideo1')[0]);
            room.addTrack(localTracks[1]);
        })
        .catch(error => console.log(error));
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
    switchSpeakerForLocalTest();
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

function changeAudioInput(selected) { // eslint-disable-line no-unused-vars
    console.log(">>>>>>changeAudioOutput", selected.value);

    const audioSource = selected.value;
    switchMicForLocalTest();
    if (localTracks[0]) {
        room.removeTrack(localTracks[0]);
        localTracks[0].dispose();
        localTracks.pop();
    }
    JitsiMeetJS.createLocalTracks({
        devices: ['audio'],
        micDeviceId: audioSource
    })
        .then(tracks => {
            // console.log('>>>tracks', tracks);
            localTracks = [tracks[0]];
            mute_self();
            localTracks[0].addEventListener(
                JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
                audioLevel => console.log(`Audio Level local: ${audioLevel}`));
            localTracks[0].addEventListener(
                JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log('local track muted'));
            localTracks[0].addEventListener(
                JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                () => console.log('local track stoped'));
            localTracks[0].addEventListener(
                JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
                deviceId =>
                    console.log(
                        `track audio output device was changed to ${deviceId}`));
            room.addTrack(localTracks[0]);
        })
        .catch(error => console.log(error));
}

function setUserName(changed) {
    userName = document.getElementById('username').value;
    room.setDisplayName(userName);
    setMessageLabel();
}

$(window).bind('beforeunload', unload);
$(window).bind('unload', unload);


JitsiMeetJS.init(initOptions);

connection = new JitsiMeetJS.JitsiConnection(null, null, options);

connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect);

JitsiMeetJS.mediaDevices.addEventListener(
    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
    onDeviceListChanged);

connection.connect();

JitsiMeetJS.createLocalTracks({ devices: ['audio'] })
    .then(onLocalTracks)
    .catch(error => {
        throw error;
    });
if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
    // console.log('>>>>speaker-switch');
    if(navigator.getUserMedia){
        navigator.getUserMedia({video: {width: 1280, height: 720}, audio: true}, async function(stream) {
            // console.log(">>>>>>>>>>>>>>>>>>", stream);
            await JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
                const audioOutputDevices
                    = devices.filter(d => d.kind === 'audiooutput');
                if (audioOutputDevices.length > 1) {
                    $('#audioOutputSelect').html(
                        audioOutputDevices
                            .map(
                                d =>
                                    `<option value="${d.deviceId}">${d.label}</option>`)
                            .join('\n'));
        
                    $('#audioOutputSelectWrapper').show();
                }
            });
        }, function(error){})
    }
}
if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('input')) {
    // console.log('>>>>mic-switch');
    if(navigator.getUserMedia){
        navigator.getUserMedia({audio: true}, async function(stream) {
            // console.log(">>>>>>>>>>>>>>>>>>", stream);
            await JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
                const audioOutputDevices
                    = devices.filter(d => d.kind === 'audioinput');
                if (audioOutputDevices.length > 1) {
                    $('#audioInputSelect').html(
                        audioOutputDevices
                            .map(
                                d =>
                                    `<option value="${d.deviceId}">${d.label}</option>`)
                            .join('\n'));
                }
            });
        }, function(error){})
    }
}
function startSpeaking(e) {
    isListener = false;
    unmute_self();
    // console.log('>>>startSpeaking');
    room.setLocalParticipantProperty('voice_status', 'none');
    room.setLocalParticipantProperty('voice_status', 'speaker');
    setMessageLabel();
}

function stopSpeaking(e) {
    isListener = true;
    mute_self();
    room.setLocalParticipantProperty('voice_status', 'none');
    room.setLocalParticipantProperty('voice_status', 'listener');
    setMessageLabel();
}

function mute_self() {
    for (let i = 0; i < localTracks.length; i ++ ) {
        if (!localTracks[i].isMuted())
            localTracks[i].mute();
    }
}

function unmute_self() {
    for (let i = 0; i < localTracks.length; i ++ ) {
        if (localTracks[i].isMuted())
            localTracks[i].unmute();
    }
}

function handleKeyDown(e) {
    // console.log('>>>handleKeyDown');
    let keynum;
    if(e.which) { // IE                    
        keynum = e.which;
    } else if(e.keyCode){ // Netscape/Firefox/Opera                   
        keynum = e.keyCode;
    }

    let key = String.fromCharCode(keynum);
    if ((key === 't' || key === 'T') && isListener) {
        startSpeaking();
    }
}

function handleKeyUp(e) {
    // console.log('>>>handleKeyDown');
    let keynum;
    if(e.which) { // IE                    
        keynum = e.which;
    } else if(e.keyCode){ // Netscape/Firefox/Opera                   
        keynum = e.keyCode;
    }

    let key = String.fromCharCode(keynum);
    if (key === 't' || key === 'T') {
        stopSpeaking();
    }
}

function setMessageLabel() {
    // console.log('>>>setMessageLabel');
    let text = '';
    let speakerList = [];
    for (let i = 0; i < remoteTracks.length; i ++) {
        if (remoteTracks[i].status === 'speaker') {
            if (remoteTracks[i].name)
                speakerList.push(remoteTracks[i].name);
            else
                speakerList.push('user');
        }
    }

    if (!isListener)
        speakerList.push(userName);
    
    if (speakerList.length == 0)
        text = 'Nobody is speaking';
    else if (speakerList.length == 1)
        text = speakerList[0] + ' is speaking';
    else {
        for (let i = 0; i < speakerList.length - 1; i ++) {
            text += (speakerList[i] + ', ');
        }
        text += speakerList[speakerList.length - 1] + ' are speaking';
    }
    document.getElementById('message-label').innerHTML = text;
}

function toggleTest(e) {
    let start_button = document.getElementById('btn-mic-speaker-test-start');
    let stop_button = document.getElementById('btn-mic-speaker-test-stop');

    test_on = !test_on;
    
    if (!test_on) {
        start_button.style.display = 'block';
        stop_button.style.display = 'none';
        stopLocalTest();
    } else {
        start_button.style.display = 'none';
        stop_button.style.display = 'block';
        startLocalTest();
    }
}

function startLocalTest() {
    const audioElement = document.getElementById('localAudio');
    audioElement.muted = false;
    switchMicForLocalTest();
}

function stopLocalTest() {
    const audioElement = document.getElementById('localAudio');
    audioElement.muted = true;
}

function switchMicForLocalTest() {
    const audioInputSelect = document.getElementById('audioInputSelect');
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
          track.stop();
        });
    }

    const audioSource = audioInputSelect.value;
    const constraints = {
        audio: {deviceId: audioSource ? {exact: audioSource} : undefined}
    };
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        const audioElement = document.getElementById('localAudio');
        window.stream = stream; // make stream available to console
        audioElement.srcObject = stream;
    });
}

function switchSpeakerForLocalTest() {
    const audioOutputSelect = document.getElementById('audioOutputSelect');
    const audioDestination = audioOutputSelect.value;
    const audioElement = document.getElementById('localAudio');
    audioElement.setSinkId(audioDestination);
}


function onInitVoiceChat() {
    document.getElementById('control-block').style.display = 'none';

    let stop_button = document.getElementById('btn-mic-speaker-test-stop');
    stop_button.style.display = 'none';
}