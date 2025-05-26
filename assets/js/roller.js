let previousRolls = [];
let customRolls = new Set();

function loadCustomRolls() {
    const savedCustomRolls = JSON.parse(sessionStorage.getItem('customRolls')) || [];
    customRolls = new Set(savedCustomRolls);
    updateCustomRollButtons();
}

function saveCustomRoll(roll) {
    if (!customRolls.has(roll) && !isQuickRoll(roll)) {
        customRolls.add(roll);
        sessionStorage.setItem('customRolls', JSON.stringify([...customRolls]));
        updateCustomRollButtons();
    }
}

function isQuickRoll(roll) {
    const quickRolls = ['1d4', '2d4', '3d4', '4d4', '5d4', '6d4', 
                        '1d6', '2d6', '3d6', '4d6', '5d6', '6d6',
                        '1d8', '2d8', '3d8', '4d8', '5d8', '6d8',
                        '1d10', '2d10', '3d10', '4d10', '5d10', '6d10',
                        '1d12', '2d12', '3d12', '4d12', '5d12', '6d12',
                        '1d20', '2d20', '3d20', '4d20', '5d20', '6d20',
                        '4d6dl1', '2d10!', '2d6+6', '3d6x2', '1d100', '1d20+5'];
    return quickRolls.includes(roll);
}

function updateCustomRollButtons() {
    const customButtons = document.getElementById('custom-buttons');
    customButtons.innerHTML = '';
    customRolls.forEach(roll => {
        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.textContent = roll;
        button.onclick = () => rollDice(roll);
        customButtons.appendChild(button);
    });
}

function calculateRoll(diceNotation) {
    const rollRegex = /(\d+)d(\d+)((?:[!khdl]\d*)*)((?:\s*[+-x]\s*\d+)?)/i;
    const match = diceNotation.match(rollRegex);

    if (match) {
        const [, numDice, numSides, operations, modifier] = match;
        let rolls = [];

        // Roll the dice
        for (let i = 0; i < parseInt(numDice); i++) {
            rolls.push(rollDie(parseInt(numSides)));
        }

        // Apply operations
        rolls = applyOperations(rolls, operations, parseInt(numSides));

        // Calculate total
        let total = rolls.reduce((sum, roll) => sum + (roll.discarded ? 0 : roll.value), 0);

        // Apply modifier
        if (modifier) {
            total = applyModifier(total, modifier);
        }

        return { total, individualResults: rolls };
    }

    return { total: "Invalid dice notation", individualResults: [] };
}

function rollDie(sides) {
    return { value: Math.floor(Math.random() * sides) + 1, discarded: false };
}

function applyOperations(rolls, operations, numSides) {
    const ops = operations.match(/[!khdl]\d*/g) || [];
    
    for (let op of ops) {
        if (op.startsWith('!')) {
            rolls = explodeDice(rolls, numSides);
        } else if (op.startsWith('kh')) {
            rolls = keepHighest(rolls, op.slice(2) || 1);
        } else if (op.startsWith('dl')) {
            rolls = dropLowest(rolls, op.slice(2) || 1);
        }
    }

    return rolls;
}

function explodeDice(rolls, numSides) {
    return rolls.map(roll => {
        let value = roll.value;
        let explosions = [value];
        while (value === numSides) {
            value = Math.floor(Math.random() * numSides) + 1;
            explosions.push(value);
        }
        return { value: explosions.reduce((a, b) => a + b), explosions, discarded: roll.discarded };
    });
}

function keepHighest(rolls, keep) {
    keep = parseInt(keep);
    const sortedRolls = [...rolls].sort((a, b) => b.value - a.value);
    return sortedRolls.map((roll, index) => ({ ...roll, discarded: index >= keep }));
}

function dropLowest(rolls, drop) {
    drop = parseInt(drop);
    const sortedRolls = [...rolls].sort((a, b) => a.value - b.value);
    return sortedRolls.map((roll, index) => ({ ...roll, discarded: index < drop }));
}

function applyModifier(total, modifier) {
    const [, operation, value] = modifier.match(/\s*([+-x])\s*(\d+)/);
    switch (operation) {
        case '+': return total + parseInt(value);
        case '-': return total - parseInt(value);
        case 'x': return total * parseInt(value);
    }
}

function displayResult(diceNotation, total, individualResults) {
    const resultDiv = document.getElementById('roll-details');
    let resultHTML = `<p class="mb-2"><strong>${diceNotation}</strong></p>`;

    const numSides = getNumberOfSides(diceNotation);

    individualResults.forEach((result, index) => {
        const rollClass = getRollClass(result.value, numSides);
        resultHTML += `<p class="mb-1 ${result.discarded ? 'discarded' : ''}">
            ${index + 1}: <strong class="${rollClass}">${result.value}</strong>
            ${result.explosions ? `(${result.explosions.join(' + ')})` : ''}
            ${result.discarded ? ' (discarded)' : ''}
        </p>`;
    });

    resultHTML += `<div class="result-divider"></div>`;
    resultHTML += `<p class="mt-2"><strong>Total: ${total}</strong></p>`;
    resultDiv.innerHTML = resultHTML;
}

function rollDice(diceNotation) {
    const { total, individualResults } = calculateRoll(diceNotation);
    displayResult(diceNotation, total, individualResults);
    updatePreviousRolls(diceNotation, total, individualResults);
}

function rollCustomDice() {
    const customRoll = document.getElementById('custom-roll').value;
    const { total, individualResults } = calculateRoll(customRoll);
    displayResult(customRoll, total, individualResults);
    updatePreviousRolls(customRoll, total, individualResults);
    saveCustomRoll(customRoll);
}

function updatePreviousRolls(diceNotation, total, individualResults) {
    previousRolls.unshift({ diceNotation, total, individualResults });

    const previousRollsList = document.getElementById('previous-rolls-list');
    previousRollsList.innerHTML = '';

    const numSides = getNumberOfSides(diceNotation);

    previousRolls.forEach(roll => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        let rollDetails = `${roll.diceNotation}: `;
        roll.individualResults.forEach((result, index) => {
            const rollClass = getRollClass(result.value, numSides);
            if (result.discarded) {
                rollDetails += `<span class="discarded"><strong class="${rollClass}">${result.value}</strong></span> `;
            } else {
                rollDetails += `<strong class="${rollClass}">${result.value}</strong> `;
            }
        });
        rollDetails += `= <strong>${roll.total}</strong>`;
        li.innerHTML = rollDetails;
        previousRollsList.appendChild(li);
    });
}

function getNumberOfSides(diceNotation) {
    const match = diceNotation.match(/d(\d+)/i);
    return match ? parseInt(match[1]) : 0;
}

function getRollClass(roll, numSides) {
    if (roll === 1) return 'min-roll';
    if (roll === numSides) return 'max-roll';
    return '';
}

function clearResults() {
    const resultDiv = document.getElementById('roll-details');
    resultDiv.innerHTML = ``;
}

function clearPreviousResults() {
    previousRolls = [];
    const previousRollsList = document.getElementById('previous-rolls-list');
    previousRollsList.innerHTML = '';
}

window.onload = loadCustomRolls;