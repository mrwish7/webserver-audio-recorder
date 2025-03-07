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

(() => {

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
const aRecCss = `@keyframes blink {
    50% {
        opacity: 0.0;
    }
}
#audio-record-button:hover i {
    color: rgba(255, 0, 0, 0.75);
}
#audio-record-button.rec-active i {
    color: rgba(255, 0, 0, 0.75);
    animation: blink 2s step-start 0s infinite;
}
#audio-record-button.rec-active:hover i {
    color: var(--color-4);
}`

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

    $('#audio-record-button span').html(formattedMin + ':' + formattedSec);
}

function startRecording() {
    $('#audio-record-button').addClass('rec-active');
    $('#audio-record-button span').html('00:00');
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
    $('#audio-record-button').removeClass('rec-active');
    clearTimeout(timeoutRecording);
    clearInterval(timer);
    min = 0;
    sec = 0;
    $('#audio-record-button span').html('Record');

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
        sendToast('success', 'Audio recording complete', aRecFileName.length > 28 ? aRecFileName.slice(0, 16) + '...' + aRecFileName.slice(-12) : aRecFileName, false, false);
        document.body.removeChild(link);
        aRecData = [];
    }
}

function createButton(buttonId) {
    (function waitForFunction() {
        const maxWaitTime = 10000;
        let functionFound = false;

        const observer = new MutationObserver((mutationsList, observer) => {
            if (typeof addIconToPluginPanel === 'function') {
                observer.disconnect();
                addIconToPluginPanel(buttonId, 'Record', 'solid', 'circle', 'Start audio recording');
                functionFound = true;

                const buttonObserver = new MutationObserver(() => {
                    const $pluginButton = $(`#${buttonId}`);
                    if ($pluginButton.length > 0) {
                        $pluginButton.on('click', function() {
                            // Code to execute on click
                            toggleRecButtonState();
                        });
                        // Additional code
                        buttonObserver.disconnect(); // Stop observing once button is found
                    }
                });

                buttonObserver.observe(document.body, { childList: true, subtree: true });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            if (!functionFound) {
                console.error(`Function addIconToPluginPanel not found after ${maxWaitTime / 1000} seconds.`);
            }
        }, maxWaitTime);
    })();

    $("<style>")
        .prop("type", "text/css")
        .html(aRecCss)
        .appendTo("head");
}

createButton('audio-record-button');

})();
