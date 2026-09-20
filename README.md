# Hexaplex

Hexaplex is a browser puzzle game built around a six-triangle hexagon. Change the
values in the interactive hexagon until they match the target pattern, using as
few steps as possible.

## Quick start

Create a virtual environment and install the backend dependencies:

### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

Start the local server from the repository root:

```bash
python -m uvicorn backend.main:app --reload
```

Then open http://127.0.0.1:8000 in a browser.

## How to play

1. Choose **Start Game**, then select a difficulty.
2. Click a triangle and enter a number from `-6` to `6`.
3. The entered value is added to that triangle. The two triangles on its left
	rotate clockwise, and the two on its right rotate counterclockwise. The
	opposite triangle does not move.
4. Overlapping values are added together. Negative numbers rotate backwards.
5. Match the goal hexagon. Every input and manual rotation counts as one step.

Available modes:

- **Easy**: 2 active triangles
- **Difficult**: 3-4 active triangles
- **Impossible**: 5-6 active triangles
- **Sandbox**: free play without a target

The game also includes a clockwise rotate button, an in-game rules panel, and
20 light and dark visual themes. The selected theme is saved in browser storage.

## Project structure

```text
backend/main.py       FastAPI app and static-file server
frontend/index.html   Game markup and controls
frontend/app.js       Puzzle generation and game logic
frontend/styles.css   Layout, themes, and animations
requirements.txt      Python dependencies
```

The legacy Matplotlib prototype remains in `backend/app.py`

It is separate from the browser game and is not required for the normal startup.
