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

pygame.display.set_caption("Portal 2D - Level Two (Co-op Redesign)")
pygame.init()

clock = pygame.time.Clock()
screen = pygame.display.set_mode((GlobalVariables.Width, GlobalVariables.Height))

background = pygame.Surface((GlobalVariables.Width, GlobalVariables.Height))
background.fill((255, 255, 255))


async def Level():
    """
    Level Two redesign goal:
    - Clear left-to-right flow
    - Forced co-op: spawn cube -> route cube into button room -> regroup at exit
    - Limited portal surfaces (marked with portalable=1)
    """

    W = GlobalVariables.Width
    H = GlobalVariables.Height

    # ----------------------------
    # LEVEL GEOMETRY (Layout A)
    # ----------------------------
    platforms = [
        # === World bounds / main floor ===
        Platform(0, H - 20, W, 20, False, 0),                 # floor
        Platform(0, 0, 20, H - 20, True, 0),                  # left wall
        Platform(W - 20, 0, 20, H - 20, True, 0),             # right wall

        # === Spawn bay (left) ===
        Platform(20, H - 140, 260, 20, False, 0),             # spawn ledge
        Platform(280, H - 240, 20, 120, True, 0),             # divider wall (non-portal)
        Platform(320, H - 260, 20, 180, True, 1),             # portal wall (teaches portals)

        # === Mid traversal (staggered jumps) ===
        Platform(420, H - 170, 180, 20, False, 0),
        Platform(620, H - 250, 180, 20, False, 0),

        # A portalable flat "bridge" that helps route cube / players
        Platform(820, H - 310, 240, 20, False, 1),

        # === Split section: Button room (lower right) ===
        Platform(920, H - 120, 260, 20, False, 0),            # approach ledge
        Platform(900, H - 220, 20, 120, True, 0),             # left wall of room
        Platform(1180, H - 220, 20, 120, True, 0),            # right wall of room
        Platform(900, H - 220, 300, 20, False, 0),            # ceiling of room (non-portal)

        # Portalable interior panel so cube can be delivered into the room
        Platform(1040, H - 200, 20, 80, True, 1),

        # === Exit approach (upper right) ===
        # (high ground that both players must reach after opening door)
        Platform(760, H - 420, 220, 20, False, 0),
        Platform(1020, H - 420, 240, 20, False, 0),
        Platform(980, H - 500, 20, 100, True, 0),             # small blocker to prevent trivial walk
        Platform(1000, H - 540, 280, 20, False, 0),            # top-right ledge for door
    ]

    selectedObj = None

    # ----------------------------
    # PUZZLE OBJECTS
    # ----------------------------
    # Cube dropper spawns cube early area so it must be routed to the button room
    dropper = CubeDropper(220, 0, 180, 3)
    dropper.add(CubeObj(0, 0, 0.0999, 0.2))
    dropper.spawnCube()

    # PlayerButton spawns cube (so players can reset if lost)
    pButton = PlayerButton(120, H - 175, 30)

    # Floor button inside the right-side button room
    button = ButtonObject(1030, H - 55, 0)

    # Door on upper-right ledge (forces regroup)
    door = ExitDoor(1140, H - 690)  # sits on Platform(1000, H-540) ledge

    # Players spawn in the left bay
    players = [
        Player(60, H - 180, True, str(GlobalVariables.net.id) == str(0)),
        Player(110, H - 180, False, False),
    ]
    players[0].name = GlobalVariables.Account_Username

    # ----------------------------
    # STATE
    # ----------------------------
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
    # NETWORKING HELPERS
    # ----------------------------
    def send_data():
        """
        Send player1 state to server, receive player2 state back.
        """
        # cubeState protocol mapping (existing behavior)
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
            roomId = "2"
        else:
            roomId = "102"
            hasStarted = True

        data = (
            str(GlobalVariables.net.id)
            + ":" + str(players[0].x) + "," + str(players[0].y)
            + ":" + ("True" if players[0].leftSide else "False")
            + ":" + str(GlobalVariables.Account_Username)
            + ":" + str(dropper.sprite.rect.x) + "," + str(dropper.sprite.rect.y)
            + ":" + str(cubeState)
            + ":" + str(players[0].pGun.angle)
            + ":" + str(portalPos[0]) + "," + str(portalPos[1])
            + ":" + str(portalRot)
            + ":" + str(roomId)
        )
        return GlobalVariables.net.send(data)

    @staticmethod
    def parse_data(data):
        """
        Parse player2 data. Returns:
        p2x, p2y, left, name, cubeX, cubeY, cubeState, angle, portalX, portalY, portalRot, room
        """
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

        # existing "room exit" logic (kept)
        if type(frameTimer) is int:
            if (str(p2room) in ["-1", "100", "0"]) and frameTimer > 60:
                frameTimer = 0
                completionTimer = 0

        # portal sync
        if str(portalPos[0]) == "None":
            players[1].pGun.empty()
        else:
            players[1].pGun.add(Portal(int(float(portalPos[0])), int(float(portalPos[1])), int(float(portalRot)), 1))

        return (
            float(pos[0]), float(pos[1]),
            left,
            name,
            int(float(cube[0])), int(float(cube[1])),
            cubeState,
            int(float(angle)),
            portalPos[0], portalPos[1],
            int(float(portalRot)),
            p2room
        )

    # ----------------------------
    # MAIN LOOP
    # ----------------------------
    running = True
    while running:
        frameTimer += 1

        dt = clock.tick(GlobalVariables.FPS)
        pressed_keys = pygame.key.get_pressed()

        # clear
        screen.blit(background, (0, 0))

        # portal list for warp checks
        portals = [players[0].pGun.sprite, players[1].pGun.sprite]

        # door logic + rendering
        door.door_status(button)
        door.update(screen)

        # timer UI
        if not Timer.timer_started and not levelComplete:
            Timer.start_timer()

        if Timer.timer_started and Timer.elapsed_time == 0:
            current_time = pygame.time.get_ticks() - Timer.start_time
            timer_text = GlobalVariables.font(36).render(
                "Time: " + str(current_time // 1000) + "s", True, (0, 0, 0)
            )
            screen.blit(timer_text, (W - 200, 20))

        if not Timer.timer_started and Timer.elapsed_time != 0:
            timer_text = GlobalVariables.font(36).render(
                "Time: " + str(Timer.elapsed_time // 1000) + "s", True, (0, 0, 0)
            )
            screen.blit(timer_text, (W - 200, 20))

        # draw platforms once
        for platform in platforms:
            platform.draw(screen)

        # cube physics
        for i, obj in enumerate(dropper.sprites()):
            if obj != selectedObj and obj.runPhysics:
                obj.move(dt)
            obj.bounce(W, H, platforms)
            obj.collide(dropper.sprites()[i + 1:])
        dropper.update()
        dropper.draw(screen)

        # buttons
        button.checkActive(dropper.sprites(), players)
        button.draw(screen)
        pButton.draw(screen)

        # exit conditions
        if not levelComplete and door.try_exit(players[0], pressed_keys) and door.try_exit(players[1], pressed_keys):
            levelComplete = True
            Timer.stop_timer()
            finalTime = Timer.elapsed_time
            Timer.start_time = 0
            Timer.elapsed_time = 0

        # move local player unless both are in door interaction
        if not door.try_exit(players[0], pressed_keys) or not door.try_exit(players[1], pressed_keys):
            players[0].move(pressed_keys, platforms, dt)
            players[0].jump(dt)

        # sync network player + cube
        reply = send_data()
        if players[0].controllingCube is False:
            # use server cube position when NOT controlling cube
            (
                players[1].x, players[1].y, _dummy0, players[1].name,
                dropper.sprite.rect.x, dropper.sprite.rect.y,
                cubeState,
                players[1].pGun.angle,
                _d1, _d2, _d3, _d4
            ) = parse_data(reply)
        else:
            (
                players[1].x, players[1].y, _dummy0, players[1].name,
                _d1, _d2,
                cubeState,
                players[1].pGun.angle,
                _d3, _d4, _d5, _d6
            ) = parse_data(reply)

        # apply cube control state
        if cubeState == "0":
            players[0].cubeState = "0"
            players[0].controllingCube = False
            dropper.sprite.runPhysics = False
        elif cubeState == "1":
            players[0].cubeState = "1"
            players[0].controllingCube = True

        # (kept from original) freeze cube after 5s if not controlling
        if players[0].controllingCube is False and Timer.elapsed_time > 5:
            dropper.sprite.runPhysics = False

        # update players
        for player in players:
            player.update(platforms, dt)
            player.draw(screen)

        # spawn cube interaction (reset mechanic)
        if players[0].interactButton(pressed_keys, pButton):
            dropper.spawnCube()
            players[0].cubeState = "11"
            players[0].controllingCube = True
            dropper.sprite.runPhysics = True

        # completion UI
        if levelComplete and completionTimer > 0:
            completionTimer -= 1
            completionText = GlobalVariables.font(50).render(
                "Level completed in " + str(finalTime // 1000) + " seconds!",
                True,
                (0, 0, 0)
            )
            screen.blit(
                completionText,
                (W / 2 - completionText.get_width() / 2, H / 2)
            )

        if completionTimer == 0:
            if levelComplete:
                GlobalVariables.complete_level(2, finalTime // 1000)
            frameTimer = 0
            running = False
            return

        # events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                quit()

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    Timer.timer_started = False
                    running = False

            if event.type == pygame.MOUSEBUTTONDOWN:
                players[0].mouseInput(event.button, dropper.sprite)
            elif event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1:
                    selectedObj = None

        # portal warp
        if all(isinstance(x, Portal) for x in portals):
            for player in players:
                player.portalWarp(portals)
            for obj in dropper.sprites():
                obj.portalWarp(portals)

        pygame.display.flip()
        await asyncio.sleep(0)
