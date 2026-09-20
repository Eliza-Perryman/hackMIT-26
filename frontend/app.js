const hexagon = document.querySelector('#hexagon');
const status = document.querySelector('#status');

// Triangle positions are clockwise: 1 top, 2 upper-right, 3 lower-right,
// 4 bottom, 5 lower-left, and 6 upper-left.
// Dataset-backed starting configuration follows that same order.
let triangleValues = [0, 1, 0, 2, 0, 0];
let editingIndex = null;

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
  input.min = '-100';
  input.max = '100';
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
    if (!Number.isInteger(value) || value < -100 || value > 100) {
      input.setCustomValidity('Enter a whole number from -100 to 100.');
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

renderHexagon();
