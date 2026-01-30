import pygame
import asyncio
import math

from Utils import Timer
from Utils.Player import Player
from Utils.PhysObj import CubeObj
from Utils.ButtonObject import ButtonObject
from Utils.Platform import Platform
from Utils.CubeDropper import CubeDropper
from Utils.ExitDoor import ExitDoor
from Utils.PlayerButton import PlayerButton
from Utils import GlobalVariables
from Utils.Portal_gun import Portal

background = pygame.Surface((GlobalVariables.Width, GlobalVariables.Height))
background.fill((255, 255, 255))

pygame.display.set_caption("Portal 2D - Level One (Remade Tutorial)")
pygame.init()
clock = pygame.time.Clock()
screen = pygame.display.set_mode((GlobalVariables.Width, GlobalVariables.Height))


async def Level():
    W = GlobalVariables.Width
    H = GlobalVariables.Height

    # ----------------------------
    # LEVEL GEOMETRY (Tutorial Hallway)
    # Key idea: each lesson is separated by a wall, so players can't skip it.
    # Convention used:
    # - last param 1 = portalable (gray wall) (based on your tutorial text)
    # - the bool param = "wall-ish" collision style as in your existing files
    # - the (False, 1) style is kept ONLY where you were using it as "red wall"
    #   (if your Platform class uses different meaning, swap flags accordingly)
    # ----------------------------
    platforms = [
        # Bounds
        Platform(0, H - 20, W, 20, False, 0),
        Platform(0, 0, 20, H - 20, True, 0),
        Platform(W - 20, 0, 20, H - 20, True, 0),

        # ===== Zone 1: Spawn + movement =====
        Platform(20, H - 140, 320, 20, False, 0),     # spawn ledge
        Platform(80, H - 220, 140, 20, False, 0),     # step 1
        Platform(240, H - 300, 140, 20, False, 0),    # step 2

        # Divider wall into Zone 2
        Platform(380, H - 260, 20, 240, True, 0),

        # ===== Zone 2: Portal tutorial (must portal past a blocker) =====
        # Two portalable panels facing the player
        Platform(420, H - 320, 20, 300, True, 1),     # portal panel A
        Platform(620, H - 320, 20, 300, True, 1),     # portal panel B

        # Hard blocker wall that forces portal use (no normal path)
        Platform(520, H - 200, 40, 180, True, 0),     # solid pillar blocks corridor

        # Ledges around the blocker
        Platform(420, H - 140, 120, 20, False, 0),    # left ledge
        Platform(600, H - 240, 160, 20, False, 0),    # right ledge (reachable via portal)

        # Divider wall into Zone 3
        Platform(820, H - 260, 20, 240, True, 0),

        # ===== Zone 3: Cube tutorial =====
        Platform(840, H - 180, 220, 20, False, 0),    # cube platform
        Platform(860, H - 320, 20, 280, True, 1),     # portalable wall for cube routing practice

        # Tiny reset button area
        Platform(980, H - 260, 140, 20, False, 0),    # small ledge above pButton area

        # Divider into Zone 4
        Platform(1120, H - 260, 20, 240, True, 0),

        # ===== Zone 4: "Red wall" / cube-only gate + button =====
        # This "gate" is where cube needs to pass but player shouldn't.
        # If your red wall behavior is correct, this will teach it naturally.
        Platform(1140, H - 220, 20, 200, False, 1),   # cube-pass gate (your prior red-wall style)

        # Big button floor area
        Platform(1160, H - 140, 100, 20, False, 0),

        # Exit platform (door up top)
        Platform(1040, H - 420, 240, 20, False, 0),
        Platform(1040, H - 420, 20, 200, True, 0),    # left wall to keep it feeling like a room
    ]

    selectedObj = None

    # ----------------------------
    # PUZZLE OBJECTS (aligned to zones)
    # ----------------------------
    dropper = CubeDropper(900, 0, 180, 3)
    dropper.add(CubeObj(0, 0, 0.0999, 0.2))
    dropper.spawnCube()

    # Tiny button to respawn cube (placed in Zone 3, easy to find)
    pButton = PlayerButton(920, H - 75, 30)

    # Big button in Zone 4 (cube goes through gate to press it)
    button = ButtonObject(1180, H - 35, 0)

    door = ExitDoor(1140, H - 570)

    players = [
        Player(60, H - 180, True, str(GlobalVariables.net.id) == str(0)),
        Player(120, H - 180, False, False)
    ]
    players[0].name = GlobalVariables.Account_Username

    global hasStarted
    hasStarted = False
    levelComplete = False
    global completionTimer
    completionTimer = 160
    finalTime = 0
    global frameTimer
    frameTimer = 0

    pygame.display.update()

    # ----------------------------
    # Networking (unchanged)
    # ----------------------------
    def send_data():
        if players[0].cubeState == "11":
            cubeState = "0"
            players[0].controllingCube = False
        elif players[0].cubeState == "10":
            cubeState = "1"
            players[0].controllingCube = True
        else:
            cubeState = "-1"

        if type(players[0].pGun.sprite) is Portal:
            portalPos = players[0].pGun.portalPos
            portalRot = players[0].pGun.portalRot
        else:
            portalPos = ("None", "None")
            portalRot = 0

        global hasStarted
        if hasStarted:
            roomId = "1"
        else:
            roomId = "101"
            hasStarted = True

        data = (
            str(GlobalVariables.net.id) + ":" +
            str(players[0].x) + "," + str(players[0].y) + ":" +
            ("True" if players[0].leftSide else "False") + ":" +
            str(GlobalVariables.Account_Username) + ":" +
            str(dropper.sprite.rect.x) + "," + str(dropper.sprite.rect.y) + ":" +
            cubeState + ":" +
            str(players[0].pGun.angle) + ":" +
            str(portalPos[0]) + "," + str(portalPos[1]) + ":" +
            str(portalRot) + ":" +
            str(roomId)
        )
        return GlobalVariables.net.send(data)

    @staticmethod
    def parse_data(data):
        pos = data.split(":")[1].split(",")
        left = True if data.split(":")[2] == "True" else False
        players[1].image = players[1].leftStandingImage if left else players[1].rightStandingImage
        name = data.split(":")[3]
        cube = data.split(":")[4].split(",")
        cubeState = data.split(":")[5]
        angle = data.split(":")[6]
        portalPos = data.split(":")[7].split(",")
        portalRot = data.split(":")[8]
        p2room = data.split(":")[9]

        global completionTimer
        global frameTimer

        if type(frameTimer) is int:
            if (str(p2room) == "-1" or str(p2room) == "100" or str(p2room) == "0") and frameTimer > 60:
                frameTimer = 0
                completionTimer = 0

        if str(portalPos[0]) == "None":
            players[1].pGun.empty()
        else:
            players[1].pGun.add(Portal(int(float(portalPos[0])), int(float(portalPos[1])), int(float(portalRot)), 1))

        return float(pos[0]), float(pos[1]), left, name, int(float(cube[0])), int(float(cube[1])), cubeState, int(float(angle)), portalPos[0], portalPos[1], int(float(portalRot)), p2room

    # ----------------------------
    # Tutorial text (placed per zone)
    # ----------------------------
    control1_text = GlobalVariables.font(14).render("Move left/right with A and D.", True, GlobalVariables.Text_NameColor)
    control2_text = GlobalVariables.font(14).render("Jump with SPACE.", True, GlobalVariables.Text_NameColor)
    control3_text = GlobalVariables.font(14).render("Shoot portal with LEFT CLICK.", True, GlobalVariables.Text_NameColor)

    portal1_text = GlobalVariables.font(14).render("Portals can only be created on GRAY walls.", True, GlobalVariables.Text_NameColor)
    portal2_text = GlobalVariables.font(14).render("Use portals to cross blocked paths.", True, GlobalVariables.Text_NameColor)

    cube_text = GlobalVariables.font(14).render("Pick up/throw cubes with RIGHT CLICK.", True, GlobalVariables.Text_NameColor)

    tiny1_text = GlobalVariables.font(14).render("TINY BUTTON: press E to respawn the cube.", True, GlobalVariables.Text_NameColor)

    red_text = GlobalVariables.font(14).render("RED WALL: blocks players, allows cubes through.", True, GlobalVariables.Text_NameColor)

    big1_text = GlobalVariables.font(14).render("BIG BUTTON: players or cubes can press it.", True, GlobalVariables.Text_NameColor)
    big2_text = GlobalVariables.font(14).render("Opens the exit door!", True, GlobalVariables.Text_NameColor)

    door1_text = GlobalVariables.font(14).render("Both players must reach the open door to win.", True, GlobalVariables.Text_NameColor)

    running = True
    while running:
        frameTimer += 1

        dt = clock.tick(GlobalVariables.FPS)
        portals = [players[0].pGun.sprite, players[1].pGun.sprite]
        pressed_keys = pygame.key.get_pressed()
        screen.blit(background, (0, 0))

        # Zone text anchors
        screen.blit(control1_text, (40, H - 320))
        screen.blit(control2_text, (40, H - 300))
        screen.blit(control3_text, (40, H - 280))

        screen.blit(portal1_text, (430, H - 520))
        screen.blit(portal2_text, (430, H - 500))

        screen.blit(cube_text, (840, H - 360))
        screen.blit(tiny1_text, (860, H - 110))

        screen.blit(red_text, (1040, H - 260))
        screen.blit(big1_text, (1020, H - 120))
        screen.blit(big2_text, (1020, H - 100))

        screen.blit(door1_text, (1040, H - 600))

        # Door logic
        door.door_status(button)
        door.update(screen)

        # Win
        if not levelComplete and door.try_exit(players[0], pressed_keys) and door.try_exit(players[1], pressed_keys):
            levelComplete = True
            Timer.stop_timer()
            finalTime = Timer.elapsed_time
            Timer.start_time = 0
            Timer.elapsed_time = 0

        # Timer
        if not Timer.timer_started and not levelComplete:
            Timer.start_timer()

        if Timer.timer_started and Timer.elapsed_time == 0:
            current_time = pygame.time.get_ticks() - Timer.start_time
            timer_text = GlobalVariables.font(36).render("Time: " + str(current_time // 1000) + "s", True, (0, 0, 0))
            screen.blit(timer_text, (W - 200, 20))

        if not Timer.timer_started and Timer.elapsed_time != 0:
            timer_text = GlobalVariables.font(36).render("Time: " + str(Timer.elapsed_time // 1000) + "s", True, (0, 0, 0))
            screen.blit(timer_text, (W - 200, 20))

        # Draw platforms ONCE
        for platform in platforms:
            platform.draw(screen)

        # Cube physics
        for i, obj in enumerate(dropper.sprites()):
            if obj.runPhysics:
                obj.move(dt)
            obj.bounce(W, H, platforms)
            obj.collide(dropper.sprites()[i + 1:])
        dropper.update()
        dropper.draw(screen)

        # Buttons
        button.checkActive(dropper.sprites(), players)
        button.draw(screen)
        pButton.draw(screen)

        # Local player movement
        if not door.try_exit(players[0], pressed_keys) or not door.try_exit(players[1], pressed_keys):
            players[0].move(pressed_keys, platforms, dt)
            players[0].jump(dt)

        # Network sync
        reply = send_data()
        if players[0].controllingCube is False:
            players[1].x, players[1].y, _d0, players[1].name, dropper.sprite.rect.x, dropper.sprite.rect.y, cubeState, players[1].pGun.angle, _d1, _d2, _d3, _d4 = parse_data(reply)
        else:
            players[1].x, players[1].y, _d0, players[1].name, _d1, _d2, cubeState, players[1].pGun.angle, _d3, _d4, _d5, _d6 = parse_data(reply)

        # Cube control state
        if cubeState == "0":
            players[0].cubeState = "0"
            players[0].controllingCube = False
            dropper.sprite.runPhysics = False
        elif cubeState == "1":
            players[0].cubeState = "1"
            players[0].controllingCube = True

        if players[0].controllingCube is False and Timer.elapsed_time > 5:
            dropper.sprite.runPhysics = False

        # Player update/draw
        for player in players:
            player.update(platforms, dt)
            player.draw(screen)

        # Tiny button: respawn cube
        if players[0].interactButton(pressed_keys, pButton):
            dropper.spawnCube()
            players[0].cubeState = "11"
            players[0].controllingCube = True
            dropper.sprite.runPhysics = True

        # Completion UI
        if levelComplete and completionTimer > 0:
            completionTimer -= 1
            completionText = GlobalVariables.font(50).render("Level completed in " + str(finalTime // 1000) + " seconds!", True, (0, 0, 0))
            screen.blit(completionText, (W / 2 - completionText.get_width() / 2, H / 2))

        if completionTimer == 0:
            if levelComplete:
                GlobalVariables.complete_level(1, finalTime // 1000)
            frameTimer = 0
            running = False
            return

        pygame.display.flip()

        # Events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                quit()
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                Timer.timer_started = False
                running = False
            if event.type == pygame.MOUSEBUTTONDOWN:
                players[0].mouseInput(event.button, dropper.sprite)

        # Portal warp
        if all(isinstance(x, Portal) for x in portals):
            for player in players:
                player.portalWarp(portals)
            for obj in dropper.sprites():
                obj.portalWarp(portals)

        pygame.display.update()
        await asyncio.sleep(0)
