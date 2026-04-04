import os
import re
from PIL import Image, ImageDraw, ImageFont

def create_image_from_code(class_name, code_text):
    lines = code_text.strip().split('\n')
    # Cleanup any trailing module.exports 
    clean_lines = []
    for line in lines:
        if 'module.exports' in line:
            break
        clean_lines.append(line)
        
    width = 800
    height = len(clean_lines) * 22 + 80
    
    # Background color typical for code editors (e.g. Dracula theme background)
    image = Image.new('RGB', (width, height), color='#282a36')
    draw = ImageDraw.Draw(image)
    
    # Try to find a monospace font
    try:
        font = ImageFont.truetype("consola.ttf", 16)
    except IOError:
        try:
            font = ImageFont.truetype("cour.ttf", 16)
        except IOError:
            font = ImageFont.load_default()

    y_text = 40
    for line in clean_lines:
        # Foreground color typical for text (e.g. Dracula theme foreground)
        draw.text((40, y_text), line, font=font, fill='#f8f8f2')
        y_text += 22

    os.makedirs('screenshots', exist_ok=True)
    # Convert spaces in class names just in case
    file_name = class_name.replace(' ', '_')
    image.save(f'screenshots/{file_name}.png')
    print(f"Generated screenshots/{file_name}.png")

def main():
    with open('src/app/api/models/class_diagram.js', 'r', encoding='utf-8') as f:
        content = f.read()

    class_blocks = re.split(r'^(?=class )', content, flags=re.MULTILINE)
    
    for block in class_blocks:
        block = block.strip()
        if not block.startswith('class '):
            continue
            
        # Extract class name robustly
        match = re.match(r'class\s+([A-Za-z0-9_]+)', block)
        if not match:
            continue
            
        class_name = match.group(1)
        create_image_from_code(class_name, block)

if __name__ == '__main__':
    main()
