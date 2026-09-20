const startScreen = document.querySelector('#start-screen');
const modeScreen = document.querySelector('#mode-screen');
const loadingScreen = document.querySelector('#loading-screen');
const gameScreen = document.querySelector('#game-screen');
const hexagon = document.querySelector('#hexagon');
const goalHexagon = document.querySelector('#goal-hexagon');
const goalPanel = document.querySelector('#goal-panel');
const gameLayout = document.querySelector('#game-layout');
const imageRain = document.querySelector('#image-rain');
const status = document.querySelector('#status');
const modeLabel = document.querySelector('#mode-label');
const startButton = document.querySelector('#start-game-button');
const homeFromModeButton = document.querySelector('#home-from-mode-button');
const homeFromGameButton = document.querySelector('#home-from-game-button');
const playAgainButton = document.querySelector('#play-again-button');
const newGameButton = document.querySelector('#new-game-button');
const rotateButton = document.querySelector('#rotate-button');
const modeButtons = document.querySelectorAll('.mode-card');
const themeButtons = document.querySelectorAll('.theme-option');

const MODES = {
  easy: { label: 'Easy', activeCount: 2 },
  difficult: { label: 'Difficult', activeCount: 3 },
  impossible: { label: 'Impossible', activeCount: 5 },
  sandbox: { label: 'Sandbox', activeCount: 6 },
};

let triangleValues = [0, 0, 0, 0, 0, 0];
let goalValues = [0, 0, 0, 0, 0, 0];
let editingIndex = null;
let currentMode = null;
let stepCount = 0;
let isSolved = false;

function startImageRain() {
  imageRain.replaceChildren();

  for (let index = 0; index < 320; index += 1) { // Create 28 falling images for a dense celebration.
    const image = document.createElement('img');
    image.src = '/static/hexa-plex.png'; // Use the Hexa-plex artwork for every falling piece.
    image.className = 'rain-image'; // Apply the shared position and fall animation styles.
    image.alt = ''; // Keep decorative celebration images out of the screen reader flow.
    image.style.left = `${Math.random() * 100}%`; // Spread each image across the full viewport width.
    image.style.setProperty('--fall-delay', `${Math.random() * 2.25}s`); // Stagger starts by up to 2 seconds.
    image.style.setProperty('--fall-duration', `${2.6 + Math.random() * 0.1}s`); // Make each fall last 2.6-3.4 seconds.
    image.style.setProperty('--fall-rotation', `${-360 + Math.random() * 720}deg`); // Give each image a random -360 to 360 degree spin.
    imageRain.append(image);
  }

  window.setTimeout(() => imageRain.replaceChildren(), 15000); // Remove finished images after the celebration window.
}

function clearImageRain() {
  imageRain.replaceChildren();
}

function matchesGoal() {
  return triangleValues.every((value, index) => value === goalValues[index]);
}

function updateSolvedState() {
  if (currentMode === 'sandbox') return false;

  if (!matchesGoal()) return false;

  isSolved = true;
  editingIndex = null;
  status.textContent = `Solved in ${stepCount} step${stepCount === 1 ? '' : 's'}!`;
  startImageRain();
  return true;
}

function setTheme(themeName) {
  const availableThemes = [
    'mono', 'paper', 'sky', 'mint', 'sand', 'rose', 'lemon', 'ocean', 'coral', 'sage',
    'midnight', 'graphite', 'forest', 'ember', 'cobalt', 'navy', 'charcoal', 'moss', 'ruby', 'slate',
  ];
  if (!availableThemes.includes(themeName)) themeName = 'mono';

  document.body.dataset.theme = themeName;
  themeButtons.forEach((button) => {
    const isSelected = button.dataset.theme === themeName;
    button.classList.toggle('is-selected', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
  window.localStorage.setItem('hexagon-theme', themeName);
}

function showScreen(screenName) {
  const screens = [startScreen, modeScreen, loadingScreen, gameScreen];
  screens.forEach((screen) => {
    screen.classList.toggle('hidden', screen.id !== `${screenName}-screen`);
  });
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function generateModePuzzle(mode) {
  if (mode === 'sandbox') {
    return {
      current: Array.from({ length: 6 }, () => randomInt(1, 6)),
      goal: Array(6).fill(0),
    };
  }

  const config = MODES[mode];
  const activeCount = config.activeCount + (mode === 'difficult' && Math.random() < 0.5 ? 1 : 0) + (mode === 'impossible' && Math.random() < 0.5 ? 1 : 0);
  const available = shuffle([0, 1, 2, 3, 4, 5]).slice(0, activeCount);
  const nextGoal = Array(6).fill(0);
  const nextCurrent = Array(6).fill(0);

  available.forEach((index) => {
    const value = randomInt(1, 6);
    nextGoal[index] = value;
    nextCurrent[index] = value;
  });

  const mutateCount = Math.min(2, activeCount);
  const mutationIndices = shuffle(available).slice(0, mutateCount);
  mutationIndices.forEach((index, offset) => {
    nextCurrent[index] = randomInt(1, 6);
    if (offset === 0 && nextCurrent.every((value) => value === 0)) {
      nextCurrent[index] = 1;
    }
  });

  if (nextCurrent.every((value, index) => value === nextGoal[index])) {
    const fallbackIndex = available[0] ?? 0;
    nextCurrent[fallbackIndex] = (nextCurrent[fallbackIndex] % 6) + 1;
  }

  return { current: nextCurrent, goal: nextGoal };
}

function renderTriangularValues(values, targetElement, interactive = false) {
  targetElement.replaceChildren();

  values.forEach((value, index) => {
    const triangle = document.createElement('div');
    triangle.className = 'triangle';
    triangle.style.setProperty('--triangle-angle', `${index * 60}deg`);
    triangle.setAttribute('role', interactive ? 'button' : 'presentation');
    triangle.tabIndex = interactive ? 0 : -1;
    triangle.setAttribute('aria-label', interactive ? `Triangle ${index + 1}, value ${value}. Click to edit.` : `Triangle ${index + 1}, value ${value}.`);

    const number = document.createElement('span');
    number.className = 'triangle-number';
    number.textContent = value === 0 ? '' : value;

    const label = document.createElement('span');
    label.className = 'triangle-label';
    label.textContent = String(index + 1);

    triangle.append(number, label);

    if (interactive) {
      triangle.addEventListener('click', () => openTriangleEditor(index));
      triangle.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openTriangleEditor(index);
        }
      });
    }

    targetElement.append(triangle);
  });
}

function renderHexagon() {
  editingIndex = null;
  renderTriangularValues(triangleValues, hexagon, true);
}

function renderGoalHexagon() {
  renderTriangularValues(goalValues, goalHexagon, false);
}

function openTriangleEditor(index) {
  if (isSolved) return;

  if (editingIndex !== null && editingIndex !== index) renderHexagon();

  editingIndex = index;
  document.querySelectorAll('.triangle').forEach((triangle, triangleIndex) => {
    triangle.classList.toggle('is-active', triangleIndex === index);
  });

  const triangle = hexagon.children[index];
  const input = document.createElement('input');
  input.className = 'triangle-editor';
  input.type = 'number';
  input.min = '-6';
  input.max = '6';
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
      input.setCustomValidity('Enter an integer from ' + input.min + ' to ' + input.max +".");
      input.reportValidity();
      input.focus();
      return;
    }

    input.setCustomValidity('');
    applyShift(index, value);
    stepCount += 1;
    renderHexagon();

    if (updateSolvedState()) return;

    status.textContent = `Triangle ${index + 1} set to ${value}. Values were shifted around it.`;
  });
}

function cancelEditor() {
  if (isSolved) return;

  renderHexagon();
  status.textContent = 'Edit cancelled.';
}

document.addEventListener('pointerdown', (event) => {
  if (isSolved || editingIndex === null || event.target.closest('.triangle')) return;
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


function rotateClockwise(){
  const newValues = triangleValues.slice();
  for (let i = 0; i < 6; i++) {
    newValues[(i + 1) % 6] = triangleValues[i];
  }
  triangleValues = newValues;
}



function beginGame(mode) {
  const { current, goal } = generateModePuzzle(mode);
  currentMode = mode;
  triangleValues = current;
  goalValues = goal;
  stepCount = 0;
  isSolved = false;
  clearImageRain();
  modeLabel.textContent = MODES[mode].label;
  const isSandbox = mode === 'sandbox';
  goalPanel.classList.toggle('hidden', isSandbox);
  gameLayout.classList.toggle('sandbox-layout', isSandbox);
  renderGoalHexagon();
  renderHexagon();
  status.textContent = isSandbox ? 'Sandbox mode — experiment freely.' : 'Match the goal hexagon.';
  showScreen('game');
}

function chooseMode(mode) {
  showScreen('loading');
  window.setTimeout(() => beginGame(mode), 650);
}

startButton.addEventListener('click', () => showScreen('mode'));
homeFromModeButton.addEventListener('click', () => showScreen('start'));
homeFromGameButton.addEventListener('click', () => showScreen('start'));
playAgainButton.addEventListener('click', () => beginGame(currentMode));
newGameButton.addEventListener('click', () => showScreen('mode'));
rotateButton.addEventListener('click', () => {
  if (isSolved) return;

  rotateClockwise();
  stepCount += 1;
  renderHexagon();

  if (updateSolvedState()) return;

  status.textContent = 'Hexagon rotated clockwise.';
});

if (window.lucide) {
  lucide.createIcons();
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => chooseMode(button.dataset.mode));
});

themeButtons.forEach((button) => {
  button.addEventListener('click', () => setTheme(button.dataset.theme));
});

setTheme(window.localStorage.getItem('hexagon-theme') || 'meadow');
showScreen('start');
