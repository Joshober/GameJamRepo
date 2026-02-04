## GLOBAL VARIABLES (Adapted for minigame system)
import pygame
import sys
import os

pygame.init()

# Dummy network class for compatibility
class Network:
    def __init__(self):
        self.id = 0
    def send(self, data):
        return ""

net = Network()

Width = 1280
Height = 720

pygame.display.set_mode((Width, Height))

FPS = 60

Background_Color = (41, 41, 41)

Text_Forecolor = (255, 255, 255)
Text_Hovercolor = (0, 255, 255)
Text_NameColor = (50,200,200)

def font(size):
    return pygame.font.SysFont("Consolas", size)

Account_Username = "Player"
Account_ID = ""

def complete_level(levelID, time):
    pass  # No database in minigame version

# Import scaling system
from Utils.GameScale import PLAYER_WIDTH, PLAYER_HEIGHT

Player_size_X = PLAYER_WIDTH
Player_size_Y = PLAYER_HEIGHT

# Get the directory of this file
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assets_dir = os.path.join(base_dir, 'Assets')

FirstPlayer_RightStandingImage = pygame.image.load(os.path.join(assets_dir, 'Cut_AvatarSprite_StandingStill_Blue.png')).convert_alpha()
FirstPlayer_RightStandingImage = pygame.transform.scale(FirstPlayer_RightStandingImage, (Player_size_X, Player_size_Y))
FirstPlayer_LeftStandingImage = pygame.transform.flip(FirstPlayer_RightStandingImage, True, False)
FirstPlayer_RightRunningImage = pygame.image.load(os.path.join(assets_dir, 'Cut_AvatarSprite_Running_Blue.png')).convert_alpha()
FirstPlayer_RightRunningImage = pygame.transform.scale(FirstPlayer_RightRunningImage, (Player_size_X, Player_size_Y))
FirstPlayer_LeftRunningImage = pygame.transform.flip(FirstPlayer_RightRunningImage, True, False)

SecondPlayer_RightStandingImage = pygame.image.load(os.path.join(assets_dir, 'Cut_AvatarSprite_StandingStill_Orange.png')).convert_alpha()
SecondPlayer_RightStandingImage = pygame.transform.scale(SecondPlayer_RightStandingImage, (Player_size_X, Player_size_Y))
SecondPlayer_LeftStandingImage = pygame.transform.flip(SecondPlayer_RightStandingImage, True, False)
SecondPlayer_RightRunningImage = pygame.image.load(os.path.join(assets_dir, 'Cut_AvatarSprite_Running_Orange.png')).convert_alpha()
SecondPlayer_RightRunningImage = pygame.transform.scale(SecondPlayer_RightRunningImage, (Player_size_X, Player_size_Y))
SecondPlayer_LeftRunningImage = pygame.transform.flip(SecondPlayer_RightRunningImage, True, False)

# Additional player colors (for 4 players)
ThirdPlayer_RightStandingImage = FirstPlayer_RightStandingImage.copy()
ThirdPlayer_LeftStandingImage = FirstPlayer_LeftStandingImage.copy()
ThirdPlayer_RightRunningImage = FirstPlayer_RightRunningImage.copy()
ThirdPlayer_LeftRunningImage = FirstPlayer_LeftRunningImage.copy()

FourthPlayer_RightStandingImage = SecondPlayer_RightStandingImage.copy()
FourthPlayer_LeftStandingImage = SecondPlayer_LeftStandingImage.copy()
FourthPlayer_RightRunningImage = SecondPlayer_RightRunningImage.copy()
FourthPlayer_LeftRunningImage = SecondPlayer_LeftStandingImage.copy()

Medal_Image = pygame.image.load(os.path.join(assets_dir, 'medal.png')).convert_alpha()
