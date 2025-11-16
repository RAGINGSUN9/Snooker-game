# Snooker-game
Its a game i mae i was just testing my js work
# Snooker Web Game

A web-based snooker game built with HTML5 Canvas and JavaScript.

## How to Run

### Method 1: Direct File Opening (Simplest)
1. Navigate to the project folder u have it`
2. Double-click on `index.html`
3. The game will open in your default web browser

### Method 2: Using a Local Web Server (Recommended)

#### Option A: Using Python (if installed)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open: `http://localhost:8000`

#### Option B: Using Node.js (if installed)
```bash
# Install http-server globally (one time)
npm install -g http-server

# Run the server
http-server -p 8000
```
Then open: `http://localhost:8000`

#### Option C: Using VS Code Live Server Extension
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Method 3: Using PowerShell (Windows)
```powershell
# Navigate to the project directory


# Start a simple HTTP server (if Python is installed)
python -m http.server 8000
```

## Game Controls

- **Aim**: Click and drag from the cue ball
- **Shoot**: Release the mouse button
- **Power**: Longer drag = more power
- **Reset**: Click "New Game" button to restart

## Game Rules

- Pot red balls (1 point) followed by a colored ball (2-7 points)
- Alternate between reds and colors
- Fouls occur when:
  - Cue ball is potted
  - Wrong ball is potted
  - No ball is potted
- Player switches on fouls or when no ball is potted


