const REC_BUTTON_NAME = 'RECORD';
const audWs = 'ws://' + window.location.host + window.location.pathname + 'audio';
let aSocket;
let collectedData = [];
let fName = "audio";
let toggle = true;
let timer;
let min = 0;
let sec = 0;

const recIcon = $('<i>', {
    class: 'rec-icon',
});
recIcon.css({
    display: 'inline-block',
    width: '12px',
    height: '12px',
    backgroundColor: '#ff0000',
    borderRadius: '6px',
    marginRight: '2px'
});

const recText = $('<strong>', {
    class: 'rec-text',
    html: REC_BUTTON_NAME
});

const audioRecorderButton = $('<button>', {
    id: 'audio-record-button',
});

audioRecorderButton.append(recIcon);
audioRecorderButton.append(recText);

function initializeRecordButton() {
    let buttonWrapper = $('#button-wrapper');
    if (buttonWrapper.length < 1) {
        buttonWrapper = createDefaultButtonWrapper();
    }

    if (buttonWrapper.length) {
        audioRecorderButton.addClass('hide-phone bg-color-3')
            .css({
                borderRadius: '0px',
                width: '100px',
                height: '22px',
                position: 'relative',
                marginTop: '16px',
                right: '0px'
            });
        buttonWrapper.append(audioRecorderButton);
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

    recText.html(formattedMin + ':' + formattedSec);
}

function startRecording() {
    recText.html('00:00');
    timer = setInterval(updateTimer, 1000);
    const d = new Date().toISOString().slice(0, 19).replaceAll(':','').replace('T','_');
    fName = `${d}z_Audio.mp3`
    // Create WebSocket connection
    aSocket = new WebSocket(audWs);
    aSocket.binaryType = 'arraybuffer';

    aSocket.addEventListener("open", (event) => {
        aSocket.send(JSON.stringify({ type: 'fallback', data: 'mp3' }));
    });

    aSocket.addEventListener('message', (event) => {
        if (event.data instanceof ArrayBuffer) {
            collectedData.push(event.data);
        }
    });

}

function stopRecording() {
    clearInterval(timer);
    min = 0;
    sec = 0;
    recText.html(REC_BUTTON_NAME);

    if (aSocket) {
        aSocket.close();

        // Create a Blob from the collected data
        const blob = new Blob(collectedData, { type: 'application/octet-stream' });

        // Create a link element
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        collectedData = [];
    }
}

$(document).ready(function() {
    initializeRecordButton();

    audioRecorderButton.on('click', function() {
        toggleRecButtonState();
    });
});