import cv2
import numpy as np
import time

glyphs = ('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 
	'\u0251', '\u0250', '\u0252', '\u00E6', '\u0253', '\u0299', '\u03B2', '\u0254', '\u0255', '\u00E7', '\u0257', '\u0256', '\u00F0', '\u02A4', '\u0259', '\u0258', '\u025A', '\u025B', '\u025C', '\u025D', '\u025E', '\u025F', '\u0284', '\u0261', '\u0260', '\u0262', '\u029B', '\u0266', '\u0267', '\u0127', '\u0265', '\u029C', '\u0268', '\u026A', '\u029D', '\u026D', '\u026C', '\u026B', '\u026E', '\u029F', '\u0271', '\u026F', '\u0270', '\u014B', '\u0273', '\u0272', '\u0274', '\u00F8', '\u0275', '\u0278', '\u03B8', '\u0153', '\u0276', '\u0298', '\u0279', '\u027A', '\u027E', '\u027B', '\u0280', '\u0281', '\u027D', '\u0282', '\u0283', '\u0288', '\u02A7', '\u0289', '\u028A', '\u028B', '\u2C71', '\u028C', '\u0263', '\u0264', '\u028D', '\u03C7', '\u028E', '\u028F', '\u0291', '\u0290', '\u0292', '\u0294', '\u02A1', '\u0295', '\u02A2', '\u01C0', '\u01C1', '\u01C2', '\u01C3')


# modified from opencv docs http://docs.opencv.org/trunk/db/d5b/tutorial_py_mouse_handling.html
drawing = False # true if mouse is pressed
mode = True # if True, draw rectangle. Press 'm' to toggle to curve
quit = False # if True, quit out of drawing loop and go to next glyph
empty = True

# mouse callback function
def draw_circle(event,x,y,flags,param):
    global drawing, quit, empty

    if event == cv2.EVENT_LBUTTONDOWN:
        if x > 450 and y > 450:
        	quit = True
        	drawing = False
        else:
        	drawing = True
       		empty = False

    elif event == cv2.EVENT_MOUSEMOVE:
        if drawing == True:
            cv2.circle(img,(x,y),5,255,-1)

    elif event == cv2.EVENT_LBUTTONUP:
        drawing = False
        # cv2.circle(img,(x,y),5,(0,0,255),-1)

for glyph in glyphs:
	cv2.namedWindow(glyph)
	cv2.setMouseCallback(glyph, draw_circle)
	img = np.zeros((512,512), np.uint8)
	empty = True
	#cv2.putText(img, glyph, (450, 480), cv2.FONT_HERSHEY_SIMPLEX, 2, 255, 2)
	while(1):
	    cv2.imshow(glyph, img)
	    k = cv2.waitKey(1) & 0xFF
	    if k != 255 or quit:
	    	quit = False
	    	break
	if empty:
		break

	img = cv2.dilate(img, (15, 15), 3)
	img = cv2.resize(img, (64, 64))
	cv2.imwrite(u'training/%s-%d.png' % (glyph, int(time.time())), img)
	cv2.destroyAllWindows()