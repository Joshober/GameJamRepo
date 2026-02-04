#!/usr/bin/env python3
import qrcode
import socket
import sys
from PIL import Image

def get_local_ip():
    """Get local IP address"""
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def generate_qr_codes():
    """Generate QR codes for all 4 players"""
    local_ip = get_local_ip()
    print("Duck Attack Mobile Controllers")
    print(f"Server IP: {local_ip}:8080")
    print("=" * 50)
    
    for player in range(1, 5):
        url = f"http://{local_ip}:8080/controller.html?player={player}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR code
        filename = f"player{player}_qr.png"
        img.save(filename)
        
        print(f"Player {player} Controller:")
        print(f"   URL: {url}")
        print(f"   QR Code saved: {filename}")
        print()
    
    print("Instructions:")
    print("1. Run the game: python main.py")
    print("2. Players scan their QR codes with phones")
    print("3. Open the controller URL in mobile browser")
    print("4. Use touch controls to play!")
    print()
    print("Troubleshooting:")
    print("- Make sure all devices are on the same WiFi network")
    print("- Check firewall settings if controllers don't connect")
    print("- Use keyboard controls as backup")

if __name__ == "__main__":
    generate_qr_codes()