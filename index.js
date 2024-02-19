const COOLER_COUNT = 8;
const ELEMENTS = {
    container: document.getElementById('container')
};
let coolers = [];

function createCoolerBox(coolerIndex) {
    const coolerBox = document.createElement('div');
    coolerBox.className = 'cooler-box';
    coolerBox.innerHTML = `
        <h3>Manometer ${coolerIndex + 1}</h3>
        <div id="inputStartPressure${coolerIndex}">
            <label for="startPressure${coolerIndex}">Startdruck (in Bar):</label>
            <input type="number" id="startPressure${coolerIndex}" step="0.001" min="0" placeholder="z.B. 2.500">
            <button data-coolerIndex="${coolerIndex}" class="start-button">Start Test</button>
        </div>
        <div class="progress-bar" id="progressBar${coolerIndex}">
            <div class="progress-bar-inner"></div>
        </div>
        <div id="inputEndPressure${coolerIndex}" style="display: none;">
            <label for="endPressure${coolerIndex}">Enddruck nach 10 Minuten (in Bar):</label>
            <input type="number" id="endPressure${coolerIndex}" step="0.001" min="0" placeholder="z.B. 2.500">
            <button data-coolerIndex="${coolerIndex}" class="check-button">Druck überprüfen</button>
        </div>
        <div class="result" id="result${coolerIndex}"></div>
        <button data-coolerIndex="${coolerIndex}" class="reset-button" style="display: none;">Prüfstation ${coolerIndex + 1} zurücksetzen</button>
    `;
    ELEMENTS.container.appendChild(coolerBox);
    coolers.push({ startPressure: null, progressBarInterval: null });
}

for (let i = 0; i < COOLER_COUNT; i++) {
    createCoolerBox(i);
}

ELEMENTS.container.addEventListener('click', function (event) {
    if (event.target.classList.contains('start-button')) {
        const coolerIndex = parseInt(event.target.getAttribute('data-coolerIndex'));
        startTest(coolerIndex);
    } else if (event.target.classList.contains('check-button')) {
        const coolerIndex = parseInt(event.target.getAttribute('data-coolerIndex'));
        checkPressure(coolerIndex);
    } else if (event.target.classList.contains('reset-button')) {
        const coolerIndex = parseInt(event.target.getAttribute('data-coolerIndex'));
        resetCooler(coolerIndex);
    }
});

function startTest(coolerIndex) {
    const progressBar = document.querySelector(`#progressBar${coolerIndex} .progress-bar-inner`);
    const coolerTitle = document.getElementById(`coolerTitle${coolerIndex}`);
    const startPressure = parseFloat(document.getElementById(`startPressure${coolerIndex}`).value);

    if (startPressure) {
        document.getElementById(`inputStartPressure${coolerIndex}`).style.display = 'none';
        document.getElementById(`inputEndPressure${coolerIndex}`).style.display = 'none';
        document.getElementById(`result${coolerIndex}`).style.display = 'none';
        progressBar.style.width = '0%';
        document.getElementById(`progressBar${coolerIndex}`).style.display = 'block';

        animateProgressBar(coolerIndex, WAIT_TIME * 60);

        coolerTitle.innerText = `Manometer ${coolerIndex + 1} | Prüfe ${WAIT_TIME}:00 verbleiben...`;

        setTimeout(function () {
            document.getElementById(`inputEndPressure${coolerIndex}`).style.display = 'block';
            document.getElementById(`endPressure${coolerIndex}`).focus();
        }, WAIT_TIME * 60000);

        coolers[coolerIndex].startPressure = startPressure;
    } else {
        alert('Bitte geben Sie den Startdruck ein.');
    }
}

function animateProgressBar(coolerIndex, durationInSeconds) {
    const progressBar = document.querySelector(`#progressBar${coolerIndex} .progress-bar-inner`);
    const coolerTitle = document.getElementById(`coolerTitle${coolerIndex}`);
    const startTime = Date.now();
    const endTime = startTime + (durationInSeconds * 1000);

    coolers[coolerIndex].progressBarInterval = setInterval(function () {
        const now = Date.now();
        const timeElapsed = now - startTime;
        const progress = (timeElapsed / (endTime - startTime)) * 100;
        const remainingTime = Math.max(0, Math.ceil((endTime - now) / 1000)); // Restzeit in Sekunden

        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        const timeString = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');

        progressBar.style.width = progress + '%';
        coolerTitle.innerText = `Manometer ${coolerIndex + 1} | Prüfe ${timeString} verbleiben...`;

        if (progress >= 100) {
            clearInterval(coolers[coolerIndex].progressBarInterval);
            progressBar.style.display = 'none';
            document.getElementById(`inputEndPressure${coolerIndex}`).style.display = 'block';
            document.querySelector(`#resetBtn${coolerIndex}`).style.display = 'block';
            coolerTitle.innerText = `Manometer ${coolerIndex + 1} | S: ${coolers[coolerIndex].startPressure} E: `;
        }
    }, 1000);
}

function checkPressure(coolerIndex) {
    const startPressure = coolers[coolerIndex].startPressure;
    const endPressure = parseFloat(document.getElementById(`endPressure${coolerIndex}`).value);
    const resultDiv = document.getElementById(`result${coolerIndex}`);

    if (endPressure < startPressure - 0.002) {
        resultDiv.innerHTML = `<div class='failure'>Der Kühler ist undicht. Bitte manuell überprüfen!<br>Startdruck: ${startPressure} Bar<br>Enddruck: ${endPressure} Bar<br>Differenz: ${endPressure - startPressure} Bar</div>`;
        document.getElementById(`coolerTitle${coolerIndex}`).style.backgroundColor = '#E03131'; // Rot einfärben
    } else {
        resultDiv.innerHTML = `<div class='success'>Der Kühler ist dicht und kann verpackt werden.<br>Startdruck: ${startPressure} Bar<br>Enddruck: ${endPressure} Bar<br>Differenz: ${endPressure - startPressure} Bar</div>`;
        document.getElementById(`coolerTitle${coolerIndex}`).style.backgroundColor = '#2B8A3E'; // Grün einfärben
    }

    resultDiv.style.display = 'block';

    // Push-Benachrichtigung
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(`Manometer ${coolerIndex + 1}`, {
            body: `Der Kühler ${coolers[coolerIndex].startPressure} Bar - ${endPressure} Bar wurde überprüft.`,
            icon: 'path/to/icon.png'
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(function (permission) {
            if (permission === 'granted') {
                const notification = new Notification(`Manometer ${coolerIndex + 1}`, {
                    body: `Der Kühler ${coolers[coolerIndex].startPressure} Bar - ${endPressure} Bar wurde überprüft.`,
                    icon: 'path/to/icon.png'
                });
            }
        });
    }

    const resetButton = document.querySelector(`#resetBtn${coolerIndex}`);
    resetButton.style.display = 'block';
    resetButton.innerText = `Prüfstation ${coolerIndex + 1} zurücksetzen`;
}

function resetCooler(coolerIndex) {
    clearInterval(coolers[coolerIndex].progressBarInterval);
    document.getElementById(`startPressure${coolerIndex}`).value = '';
    document.getElementById(`inputStartPressure${coolerIndex}`).style.display = 'block';
    document.getElementById(`inputEndPressure${coolerIndex}`).style.display = 'none';
    document.getElementById(`result${coolerIndex}`).style.display = 'none';
    document.querySelector(`#resetBtn${coolerIndex}`).style.display = 'none';
    const coolerTitle = document.getElementById(`coolerTitle${coolerIndex}`);
    coolerTitle.innerText = `Manometer ${coolerIndex + 1}`;
    coolerTitle.style.backgroundColor = ''; // Zurücksetzen der Hintergrundfarbe
}
