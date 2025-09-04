document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    const shotChart = document.getElementById('shot-chart');
    const kSlider = document.getElementById('k-slider');
    const kValue = document.getElementById('k-value');
    const courtImg = document.getElementById('court-img');
    const knnLinesSvg = document.getElementById('knn-lines-svg');
    let shots = [];
    let newShotPoint = null;

    kSlider.addEventListener('input', () => {
        kValue.textContent = kSlider.value;
        // Recalculate if a point exists
        if (newShotPoint) {
            const x = parseFloat(newShotPoint.style.left);
            const y = parseFloat(newShotPoint.style.top);
            const courtX = (x / 10) - 25;
            const courtY = (470 - y) / 10;
            calculateProbability(courtX, courtY, x, y);
        }
    });

    fetch('sethcurry.csv')
        .then(response => response.text())
        .then(csvText => {
            console.log('CSV data fetched');
            shots = parseCSV(csvText);
            // ... (rest of the shot rendering logic)
            shots.forEach(shot => {
                if (shot.X && shot.Y) {
                    const shotDiv = document.createElement('div');
                    shotDiv.classList.add('shot');
                    shotDiv.classList.add(shot.SCORE === 'MADE' ? 'made' : 'missed');
                    
                    const xPos = (parseFloat(shot.X) + 25) * 10;
                    const yPos = 470 - (parseFloat(shot.Y) * 10);

                    shotDiv.style.left = `${xPos}px`;
                    shotDiv.style.top = `${yPos}px`;

                    const tooltip = document.createElement('div');
                    tooltip.classList.add('tooltip');
                    tooltip.innerHTML = `
                        <b>X:</b> ${shot.X.toPrecision(5)}<br>
                        <b>Y:</b> ${shot.Y.toPrecision(5)}<br>
                        <b>Result:</b> ${shot.SCORE}
                    `;

                    shotDiv.appendChild(tooltip);

                    shotDiv.addEventListener('mouseover', () => {
                        tooltip.style.display = 'block';
                    });

                    shotDiv.addEventListener('mouseout', () => {
                        tooltip.style.display = 'none';
                    });

                    shotChart.appendChild(shotDiv);
                }
            });
        });

    shotChart.addEventListener('click', (e) => {
        // Prevent creating a new point when clicking on an existing shot
        if (e.target.classList.contains('shot')) {
            return;
        }

        console.log('Court area clicked');
        if (newShotPoint && shotChart.contains(newShotPoint)) {
            shotChart.removeChild(newShotPoint);
        }

        const rect = courtImg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log(`Clicked at pixel coordinates: (${x}, ${y})`);

        newShotPoint = document.createElement('div');
        newShotPoint.classList.add('new-shot-point');
        newShotPoint.style.left = `${x}px`;
        newShotPoint.style.top = `${y}px`;
        shotChart.appendChild(newShotPoint);
        console.log('New shot point added to the DOM');

        const courtX = (x / 10) - 25;
        const courtY = (470 - y) / 10;
        console.log(`Calculated court coordinates: (${courtX}, ${courtY})`);

        calculateProbability(courtX, courtY, x, y);
    });

    function calculateProbability(courtX, courtY, pixelX, pixelY) {
        console.log('Calculating probability...');
        const k = parseInt(kSlider.value);
        
        shots.forEach(shot => {
            shot.distance = Math.sqrt(Math.pow(parseFloat(shot.X) - courtX, 2) + Math.pow(parseFloat(shot.Y) - courtY, 2));
        });

        shots.sort((a, b) => a.distance - b.distance);

        const kNearest = shots.slice(0, k);
        console.log('K-Nearest neighbors:', kNearest);

        const madeShots = kNearest.filter(shot => shot.SCORE === 'MADE').length;
        const probability = (madeShots / k) * 100;

        const probabilityBar = document.getElementById('probability-bar-foreground');
        const probabilityText = document.getElementById('probability-text');

        probabilityBar.style.width = `${probability}%`;
        probabilityText.textContent = `${probability.toFixed(2)}%`;

        // Draw lines
        knnLinesSvg.innerHTML = ''; // Clear old lines
        kNearest.forEach(neighbor => {
            const neighborX = (parseFloat(neighbor.X) + 25) * 10;
            const neighborY = 470 - (parseFloat(neighbor.Y) * 10);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', pixelX);
            line.setAttribute('y1', pixelY);
            line.setAttribute('x2', neighborX);
            line.setAttribute('y2', neighborY);
            line.setAttribute('stroke', 'black');
            line.setAttribute('stroke-width', '1');
            knnLinesSvg.appendChild(line);
        });
        console.log('Drew ' + k + ' lines to neighbors.');
    }

    function parseCSV(csvText) {
        const lines = csvText.trim().split(/\r?\n/);
        const headers = lines[0].split(',').map(header => header.trim());
        const parsedShots = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const shot = {};
                for (let j = 0; j < headers.length; j++) {
                    shot[headers[j]] = values[j].trim();
                }
                // Ensure coordinates are numbers
                shot.X = parseFloat(shot.X);
                shot.Y = parseFloat(shot.Y);
                parsedShots.push(shot);
            }
        }
        return parsedShots;
    }
});
