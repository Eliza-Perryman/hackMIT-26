const hexagon = document.querySelector('#hexagon');
const status = document.querySelector('#status');
const leaderboardList = document.querySelector('#leaderboard-list');
const leaderboardForm = document.querySelector('#leaderboard-form');
const playerNameInput = document.querySelector('#player-name');
const playerTimeInput = document.querySelector('#player-time');
const rangeButtons = document.querySelectorAll('.range-button');

// Triangle positions are clockwise: 1 top, 2 upper-right, 3 lower-right,
// 4 bottom, 5 lower-left, and 6 upper-left.
// Dataset-backed starting configuration follows that same order.
let triangleValues = [0, 1, 0, 2, 0, 0];
let editingIndex = null;
let activeLeaderboardRange = 'daily';

function renderHexagon() {
  editingIndex = null;
  hexagon.replaceChildren();
  triangleValues.forEach((value, index) => {
    const triangle = document.createElement('div');
    triangle.className = 'triangle';
    triangle.setAttribute('role', 'button');
    triangle.tabIndex = 0;
    triangle.setAttribute('aria-label', `Triangle ${index + 1}, value ${value}. Click to edit.`);
    triangle.innerHTML = `<span class="triangle-number">${value}</span><span class="triangle-label">${index + 1}</span>`;
    triangle.addEventListener('click', () => openTriangleEditor(index));
    triangle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openTriangleEditor(index);
      }
    });
    hexagon.append(triangle);
  });
}

function openTriangleEditor(index) {
  if (editingIndex !== null && editingIndex !== index) renderHexagon();
  editingIndex = index;
  document.querySelectorAll('.triangle').forEach((triangle, triangleIndex) => {
    triangle.classList.toggle('is-active', triangleIndex === index);
  });
  const triangle = hexagon.children[index];
  const input = document.createElement('input');
  input.className = 'triangle-editor';
  input.type = 'number';
  input.min = '-5';
  input.max = '5';
  input.step = '1';
  input.value = triangleValues[index];
  input.setAttribute('aria-label', `New number for triangle ${index + 1}`);
  triangle.append(input);
  input.focus();
  input.select();
  input.addEventListener('click', (event) => event.stopPropagation());
  input.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      cancelEditor();
      return;
    }
    if (event.key !== 'Enter') return;
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < Number(input.min) || value > Number(input.max)) {
      input.setCustomValidity('Enter an integer from ' + input.min + ' to ' + input.max + '.');
      input.reportValidity();
      input.focus();
      return;
    }
    input.setCustomValidity('');
    applyShift(index, value);
    renderHexagon();
    status.textContent = `Triangle ${index + 1} set to ${value}. Values were shifted around it.`;
  });
}

function cancelEditor() {
  renderHexagon();
  status.textContent = 'Edit cancelled.';
}

document.addEventListener('pointerdown', (event) => {
  if (editingIndex === null || event.target.closest('.triangle')) return;
  cancelEditor();
});

function applyShift(selectedIndex, enteredValue) {
  const nextValues = new Array(6).fill(0);
  const selectedValue = triangleValues[selectedIndex];
  const oppositeValue = triangleValues[(selectedIndex + 3) % 6];

  const leftNeighbors = [];
  const rightNeighbors = [];

  for (let i = 1; i <= 2; i++) {
    leftNeighbors.push(triangleValues[((selectedIndex - i) % 6 + 6) % 6]);
    rightNeighbors.push(triangleValues[(selectedIndex + i) % 6]);
  }

  nextValues[selectedIndex] = selectedValue + enteredValue;
  nextValues[(selectedIndex + 3) % 6] = oppositeValue;

  for (let i = 1; i <= 2; i++) {
    const leftIdx = ((selectedIndex - i - enteredValue) % 6 + 6) % 6;
    const rightIdx = ((selectedIndex + i + enteredValue) % 6 + 6) % 6;

    nextValues[leftIdx] += leftNeighbors[i - 1];
    nextValues[rightIdx] += rightNeighbors[i - 1];
  }

  triangleValues = nextValues;
}

function formatTime(seconds) {
  return `${Number(seconds).toFixed(2)}s`;
}

function renderLeaderboard(entries) {
  if (!leaderboardList) return;

  if (!entries || entries.length === 0) {
    leaderboardList.innerHTML = '<li>No scores yet for this range.</li>';
    return;
  }

  leaderboardList.innerHTML = entries
    .map((entry, index) => `<li><span>#${index + 1}</span><strong>${entry.name}</strong><em>${formatTime(entry.time)}</em></li>`)
    .join('');
}

async function loadLeaderboard(range = activeLeaderboardRange) {
  activeLeaderboardRange = range;
  rangeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.range === range);
  });

  try {
    const response = await fetch(`/api/leaderboard?range=${encodeURIComponent(range)}`);
    if (!response.ok) throw new Error('Unable to load leaderboard.');
    const payload = await response.json();
    renderLeaderboard(payload.entries);
  } catch (error) {
    renderLeaderboard([]);
    if (status) status.textContent = error.message;
  }
}

leaderboardForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = playerNameInput.value.trim();
  const time = Number(playerTimeInput.value);

  if (!name) {
    playerNameInput.focus();
    return;
  }

  if (!Number.isFinite(time) || time <= 0) {
    playerTimeInput.focus();
    return;
  }

  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, time }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || 'Unable to save score.');
    }

    leaderboardForm.reset();
    await loadLeaderboard(activeLeaderboardRange);
    status.textContent = `Saved ${name} to the ${activeLeaderboardRange} leaderboard.`;
  } catch (error) {
    status.textContent = error.message;
  }
});

rangeButtons.forEach((button) => {
  button.addEventListener('click', () => loadLeaderboard(button.dataset.range));
});

renderHexagon();
loadLeaderboard('daily');
