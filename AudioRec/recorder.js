/*!
 * ************************************************
 * FM-DX Webserver Audio Recorder plugin
 * ************************************************
 * Created by Adam W (mrwish7)
 * Join the OpenRadioCommunity Discord: https://discord.gg/fmdx
 * ************************************************
 *
 * This plugin adds a button to allow audio 
 * recordings to be made within FM-DX Webserver.
 * 
 * The recordings are made from the server's raw 
 * MP3 audio stream and then automatically 
 * downloaded in the browser once finished.
 * 
 * Thanks to: Highpoint2000, bkram, AmateurAudioDude 
 * 
 * ************************************************
 */

const REC_BUTTON_NAME = ' RECORD';
// Default max recording time in seconds (default 600 = 10 mins).
const REC_BUTTON_TIMEOUT = 600;

// Build audio websocket address
let protocol = 'ws://';
if (window.location.protocol == 'https:') {
    protocol = 'wss://';
}
const aRecWS = protocol + window.location.host + window.location.pathname + 'audio';
// Set-up required variables
let aRecSocket;
let aRecData = [];
let aRecFileName;
let toggle = true;
let timer;
let min = 0;
let sec = 0;
let timeoutRecording;

// Add some styles for elements.
const aRecCss = `.arec-icon {
    display: inline-block;
    width: 12px;
    height: 12px;
    background-color: rgba(255, 0, 0, 0.75);
    border-radius: 6px;
    margin-right: 2px;
}
#audio-record-button {
    border-radius: 0px;
    width: 100px;
    height: 22px;
    position: relative;
    margin-top: 16px;
    margin-left: 5px;
    right: 0px;
}
@keyframes blink {
    50% {
        opacity: 0.0;
    }
}
#audio-record-button.rec-active i.arec-icon {
    animation: blink 2s step-start 0s infinite;
}`

$("<style>")
    .prop("type", "text/css")
    .html(aRecCss)
    .appendTo("head");

const aRecIcon = $('<i>', {
    class: 'arec-icon',
});

const aRecText = $('<strong>', {
    class: 'arec-text',
    html: REC_BUTTON_NAME
});

const aRecButton = $('<button>', {
    id: 'audio-record-button',
});

aRecButton.append(aRecIcon);
aRecButton.append(aRecText);

function initRecButton() {
    let buttonWrapper = $('#button-wrapper');
    if (buttonWrapper.length < 1) {
        buttonWrapper = createDefaultButtonWrapper();
    }

    if (buttonWrapper.length) {
        aRecButton.addClass('hide-phone bg-color-2')
        buttonWrapper.append(aRecButton);
    }
}

// Create a default button wrapper if it does not exist
function createDefaultButtonWrapper() {
    const wrapperElement = $('.tuner-info');
    if (wrapperElement.length) {
        const buttonWrapper = $('<div>', {
            id: 'button-wrapper'
        });
        buttonWrapper.addClass('button-wrapper');
        wrapperElement.append(buttonWrapper);
        wrapperElement.append(document.createElement('br'));
        return buttonWrapper;
    } else {
        console.error('Standard location not found. Unable to add button.');
        return null;
    }
}

function toggleRecButtonState() {
    toggle ? startRecording() : stopRecording();
    toggle = !toggle;
}

function updateTimer() {
    sec++;
    if (sec === 60) {
        sec = 0;
        min++;
    }

    let formattedSec = sec < 10 ? '0' + sec : sec;
    let formattedMin = min < 10 ? '0' + min : min;

    aRecText.html(formattedMin + ':' + formattedSec);
}

function startRecording() {
    aRecButton.removeClass('bg-color-2').addClass('bg-color-4').addClass('rec-active');
    aRecText.html('00:00');
    timer = setInterval(updateTimer, 1000);
    // Build audio filename
    const d = new Date().toISOString().slice(0, 19).replaceAll(':','').replace('T','_');
    let f = $('#data-frequency').text();
    f.length > 0 ? f = parseInt(f.replace(/\D/g, ''), 10) : f;
    aRecFileName = `Audio_${d}z_${f}kHz.mp3`;
    // Create WebSocket connection
    aRecSocket = new WebSocket(aRecWS);
    aRecSocket.binaryType = 'arraybuffer';

    aRecSocket.addEventListener("open", (event) => {
        aRecSocket.send(JSON.stringify({ type: 'fallback', data: 'mp3' }));
    });

    aRecSocket.addEventListener('message', (event) => {
        if (event.data instanceof ArrayBuffer) {
            aRecData.push(event.data);
        }
    });

    if (REC_BUTTON_TIMEOUT > 0) {
        timeoutRecording = setTimeout(stopRecording, REC_BUTTON_TIMEOUT * 1000);
    }

}

function stopRecording() {
    aRecButton.removeClass('bg-color-4').removeClass('rec-active').addClass('bg-color-2');
    clearTimeout(timeoutRecording);
    clearInterval(timer);
    min = 0;
    sec = 0;
    aRecText.html(REC_BUTTON_NAME);

    if (aRecSocket) {
        aRecSocket.close();

        // Create a Blob from the collected data
        const blob = new Blob(aRecData, { type: 'application/octet-stream' });

        // Create a link element
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = aRecFileName;
        document.body.appendChild(link);
        link.click();
        sendToast('success', 'Audio recording complete', aRecFileName, false, false);
        document.body.removeChild(link);
        aRecData = [];
    }
}

$(window).on('load', function() {
    // Delay the initialization of the record button by 500 milliseconds
    setTimeout(initRecButton, 500);

    aRecButton.on('click', function() {
        toggleRecButtonState();
    });
});
