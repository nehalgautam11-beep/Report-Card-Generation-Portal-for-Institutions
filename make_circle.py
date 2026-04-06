from PIL import Image, ImageOps, ImageDraw

# Open the image and ensure it has an alpha channel
im = Image.open('public/gis_logo.png').convert("RGBA")

# Make a circular mask
mask = Image.new('L', im.size, 0)
draw = ImageDraw.Draw(mask)
# Use the smallest dimension for the bounding box of the circle to maintain aspect ratio
min_dim = min(im.size)
# Calculate offsets to center the circle
offset_x = (im.size[0] - min_dim) // 2
offset_y = (im.size[1] - min_dim) // 2

# Draw the ellipse mapping exactly matching the circle's crop
draw.ellipse((offset_x, offset_y, offset_x + min_dim, offset_y + min_dim), fill=255)

# composite the mask directly
im.putalpha(mask)

# Save overriding the original, then copy to icon.png
im.save('public/gis_logo_circle.png', "PNG")
