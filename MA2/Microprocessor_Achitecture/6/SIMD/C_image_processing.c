#include "C_image_processing.h"
#include <string.h>

void threshold_image(unsigned char *input_image, unsigned char *output_image, unsigned char threshold) {
    for (int i = 0; i < WIDTH * HEIGHT; i++) {
        if (input_image[i] < threshold) {
            output_image[i] = 0; // Black
        } else {
            output_image[i] = 255; // White
        }
    }
}

int load_image(const char *filename, unsigned char *image) {
    FILE *file = fopen(filename, "rb");
    if (!file) {
        fprintf(stderr, "Error opening file: %s\n", filename);
        return 0;
    }
    fread(image, sizeof(unsigned char), WIDTH * HEIGHT, file);
    fclose(file);
    return 1;
}

int save_image(const char *filename, unsigned char *image) {
    FILE *file = fopen(filename, "wb");
    if (!file) {
        fprintf(stderr, "Error opening file for writing: %s\n", filename);
        return 0;
    }
    fwrite(image, sizeof(unsigned char), WIDTH * HEIGHT, file);
    fclose(file);
    return 1;
}

void generate_output_filename(const char *input_filename, char *output_filename, size_t size) {
    snprintf(output_filename, size, "%s_out_C.raw", strtok(strdup(input_filename), "."));
}
