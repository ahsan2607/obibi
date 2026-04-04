import os
from PIL import Image, ImageDraw, ImageFont

def create_image_from_file(file_path, output_name):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
        
    # Find max line length to dynamically adjust width
    max_len = max(len(line) for line in lines) if lines else 0
    width = max(800, max_len * 9 + 80)
    height = len(lines) * 22 + 80
    
    image = Image.new('RGB', (width, height), color='#282a36')
    draw = ImageDraw.Draw(image)
    
    try:
        font = ImageFont.truetype("consola.ttf", 15)
    except IOError:
        try:
            font = ImageFont.truetype("cour.ttf", 15)
        except IOError:
            font = ImageFont.load_default()

    y_text = 40
    for line in lines:
        # replace tabs with 4 spaces for better rendering
        line = line.replace('\t', '    ')
        draw.text((40, y_text), line, font=font, fill='#f8f8f2')
        y_text += 22

    os.makedirs('screenshots', exist_ok=True)
    image.save(f'screenshots/{output_name}.png')
    print(f"Generated screenshots/{output_name}.png")

def main():
    create_image_from_file('src/app/api/models/class_diagram.js', 'API_Models_Class_Diagram')
    create_image_from_file('src/app/api/chat/route.ts', 'API_Chat_Route')

if __name__ == '__main__':
    main()
