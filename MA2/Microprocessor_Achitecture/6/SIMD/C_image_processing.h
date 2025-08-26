#ifndef C_IMAGE_PROCESSING_H
#define C_IMAGE_PROCESSING_H

#include <stdlib.h>
#include <stdio.h>

#define WIDTH 256
#define HEIGHT 256

void threshold_image(unsigned char *input_image, unsigned char *output_image, unsigned char threshold);
int load_image(const char *filename, unsigned char *image);
void generate_output_filename(const char *input_filename, char *output_filename, size_t size);

#endif // C_IMAGE_PROCESSING_H
