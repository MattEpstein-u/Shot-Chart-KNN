document.addEventListener('DOMContentLoaded', () => {
    const shotChart = document.getElementById('shot-chart');
    const xAxis = document.getElementById('x-axis');
    const yAxis = document.getElementById('y-axis');

    // Create X-axis ticks
    for (let i = -25; i <= 25; i += 5) {
        const tick = document.createElement('div');
        tick.classList.add('tick-label');
        tick.textContent = i;
        xAxis.appendChild(tick);
    }

    // Create Y-axis ticks
    for (let i = 0; i <= 45; i += 5) {
        const tick = document.createElement('div');
        tick.classList.add('tick-label');
        tick.textContent = i;
        yAxis.appendChild(tick);
    }


    fetch('sethcurry.csv')
        .then(response => response.text())
        .then(csvText => {
            const shots = parseCSV(csvText);
            shots.forEach(shot => {
                if (shot.X && shot.Y) {
                    const shotDiv = document.createElement('div');
                    shotDiv.classList.add('shot');
                    shotDiv.classList.add(shot.SCORE === 'MADE' ? 'made' : 'missed');
                    
                    // The x and y in the csv are in feet.
                    // The court image is 500px wide and 470px tall, representing a 50x47 feet area.
                    // X coordinates are from -25 to 25 feet, so we add 25 to normalize to 0-50.
                    // Y coordinates are distance from the baseline.
                    // We multiply by 10 to scale from feet to pixels.
                    const xPos = (parseFloat(shot.X) + 25) * 10;
                    const yPos = 470 - (parseFloat(shot.Y) * 10);

                    shotDiv.style.left = `${xPos}px`;
                    shotDiv.style.top = `${yPos}px`;

                    const tooltip = document.createElement('div');
                    tooltip.classList.add('tooltip');
                    tooltip.innerHTML = `
                        <b>X:</b> ${shot.X}<br>
                        <b>Y:</b> ${shot.Y}<br>
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

    function parseCSV(csvText) {
        const lines = csvText.trim().split(/\r?\n/);
        const headers = lines[0].split(',').map(header => header.trim());
        const shots = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const shot = {};
                for (let j = 0; j < headers.length; j++) {
                    shot[headers[j]] = values[j].trim();
                }
                shots.push(shot);
            }
        }
        return shots;
    }
});
