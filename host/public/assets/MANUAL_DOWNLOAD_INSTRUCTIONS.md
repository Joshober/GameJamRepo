# Manual Download Instructions for 3D Models

Since some sites have bot protection, here are step-by-step instructions for manually downloading models.

## Free3D.com Dice Models

### Step 1: Visit the Site
1. Go to https://free3d.com/3d-models/dice
2. You may see a CAPTCHA - complete it to access the site

### Step 2: Find a Model
1. Browse the dice models
2. Use filters:
   - **License**: Select "Free" or "Free for Commercial Use"
   - **Format**: Prefer "GLB" or "GLTF" (if available)
   - **Price**: Free

### Step 3: Download
1. Click on a dice model you like
2. Click the "Download" button
3. You may need to:
   - Create a free account (takes 30 seconds)
   - Verify email (if required)
4. Select format: **GLB** (preferred) or **GLTF**
5. If only OBJ/FBX available, download that and convert (see below)

### Step 4: Convert to GLB (if needed)
If you downloaded OBJ, FBX, or another format:

1. **Download Blender** (free): https://www.blender.org/download/
2. **Open Blender**
3. **Import the model**:
   - File → Import → [OBJ/FBX/etc.]
   - Select your downloaded file
4. **Export as GLB**:
   - File → Export → glTF 2.0
   - Choose "glTF Binary (.glb)" format
   - Click "Export glTF 2.0"
   - Save as `dice.glb`

### Step 5: Add to Repository
1. Copy the `dice.glb` file to: `host/public/assets/models/dice/dice.glb`
2. Or create a new archive:
   ```powershell
   cd host/public/assets/models/dice
   tar -czf ../dice.tar.gz *.glb
   ```
3. Commit to git:
   ```powershell
   git add host/public/assets/models/dice/
   git commit -m "Add dice model from Free3D.com"
   git push
   ```

## Why Manual Download?

Some sites like Free3D.com have:
- **Bot protection**: Blocks automated scripts
- **CAPTCHA**: Requires human verification
- **Account requirements**: Need to sign up (free, but manual)

This is actually **good** - it means the models are protected and the site is legitimate!

## Alternative: Use Procedural Models

If manual download is too much work, the system already has **procedural dice generation** that works perfectly fine. The game will automatically create a simple dice model if no external model is found.
