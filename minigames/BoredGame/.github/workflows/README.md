# GitHub Actions Workflows

## PR Guard (`pr-guard.yml`)

This workflow automatically validates and tests minigame submissions before allowing merges.

### What It Does

1. **Structure Validation**
   - Ensures only one minigame folder is modified per PR
   - Validates `manifest.json` has all required fields
   - Checks that the entry file exists
   - Verifies game type is `js`, `node`, or `pygame`

2. **Game Testing**
   - **JS Games**: Validates HTML structure, checks for script tags and postMessage usage
   - **Node.js Games**: 
     - Installs dependencies from `package.json` if present
     - Executes the game with test parameters
     - Validates that the game outputs a `RESULT:` line with valid JSON
     - Checks that the result contains a `scores` array with 4 numbers
   - **Pygame Games**:
     - Starts the Docker runner service
     - Executes the game via the runner API
     - Validates that the game returns a valid result with proper scores array

### Requirements for Games

All games must:
- Have a valid `manifest.json` with `id`, `name`, `type`, and `entry` fields
- Output results in the correct format:
  - **JS**: `window.parent.postMessage({type:"RESULT", payload:{scores:[a,b,c,d]}}, "*")`
  - **Node.js**: `console.log("RESULT:", JSON.stringify({scores:[a,b,c,d]}))`
  - **Pygame**: `print("RESULT:", json.dumps({"scores":[a,b,c,d]}))`
- Return a `scores` array with exactly 4 numbers (one per player)

### Failure Conditions

The workflow will fail if:
- Files outside `minigames/` are modified
- Multiple minigame folders are modified
- Manifest is missing or invalid
- Entry file doesn't exist
- Game fails to execute
- Game doesn't output a valid RESULT
- RESULT doesn't contain a valid scores array
