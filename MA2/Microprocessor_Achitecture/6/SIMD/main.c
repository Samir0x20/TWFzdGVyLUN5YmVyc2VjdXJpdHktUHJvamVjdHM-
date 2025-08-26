#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>
// Used to calculate the performance with precision on Windows
// For linux, use the commented code in the main function
#include <windows.h>

#define WIDTH 1024
#define HEIGHT 1024

void generate_output_filename_C(const char *input_filename, char *output_filename, size_t size) {
    snprintf(output_filename, size, "%s_out_C.raw", strtok(strdup(input_filename), "."));
}

void generate_output_filename_SIMD(const char *input_filename, char *output_filename, size_t size) {
    snprintf(output_filename, size, "%s_out_SIMD.raw", strtok(strdup(input_filename), "."));
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

void check_and_delete_file(const char *filename) {
    struct stat buffer;
    if (stat(filename, &buffer) == 0) { // Check if the file exists
        if (remove(filename) == 0) {   // Delete the file
            printf("File %s deleted successfully.\n", filename);
        } else {
            perror("Error deleting file");
        }
    } else {
        printf("File %s does not exist.\n", filename);
    }
}

void threshold_image_C(unsigned char *ptrin, unsigned char *ptrout, unsigned char threshold) {
    for (int i = 0; i < WIDTH * HEIGHT; i++) {
        if (ptrin[i] < threshold) {
            ptrout[i] = 0; // Black
        } else {
            ptrout[i] = 255; // White
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


void threshold_image_SIMD(unsigned char *prtin, unsigned char *ptrout, unsigned char threshold) {

    // We need 2 mask because the instruction pcmpgtb compare signed values and we have unsigned value for the images.
    // signed char = -128 to 127, unsigned char = 0 to 255
    // So we use pminub to make sure no value is above the threshold.
    // If a pixel is bigger than the threshold, it becomes equal to it.
    // Then we use pcmpgtb to check if the value is greater than the threshold - 1:
    // If yes → output 255 (white)
    // If no → output 0 (black)


    int block_number = (HEIGHT * WIDTH) / 16; // Number of 16-byte blocks
    unsigned char* mask = (unsigned char*) malloc(16 * sizeof(unsigned char));
    unsigned char* mask2 = (unsigned char*) malloc(16 * sizeof(unsigned char));

    for (int i = 0; i < 16; i++) {
        mask[i] = threshold;
        mask2[i] = threshold - 1;
    }

    __asm__(
        ".intel_syntax noprefix;\n"
        "mov rsi, %[ptrin];\n"        // Load input pointer into rsi
        "mov rdi, %[ptrout];\n"       // Load output pointer into rdi
        "mov rax, %[mask];\n"         // Load address of mask into rax
        "movdqu xmm7, [rax];\n"       // Load mask into xmm7
        "mov rcx, %[mask2];\n"        // Load address of mask2 into rcx
        "movdqu xmm5, [rcx];\n"       // Load mask2 into xmm5

    "loop:\n"
        "movdqu xmm6, [rsi];\n"       // Load 16 bytes from input into xmm6
        "pminub xmm6, xmm7;\n"        // Perform min operation with xmm7
        "pcmpgtb xmm6, xmm5;\n"       // Compare bytes in xmm6 with xmm5
        "movdqu [rdi], xmm6;\n"       // Store result into output
        "add rsi, 16;\n"              // Advance input pointer by 16 bytes
        "add rdi, 16;\n"              // Advance output pointer by 16 bytes
        "sub %[j], 1;\n"              // Decrement block counter
        "jnz loop;\n"                 // Repeat loop if counter is not zero
        ".att_syntax prefix;\n"
        : [j] "+r" (block_number)
        : [ptrin] "r" (prtin), [ptrout] "r" (ptrout), [mask] "r" (mask), [mask2] "r" (mask2)
        : "rsi", "rdi", "rax", "rcx", "xmm5", "xmm6", "xmm7"
    );

    free(mask);
    free(mask2);
}

int main() {
    LARGE_INTEGER frequency, start, end;
    QueryPerformanceFrequency(&frequency);

    const char *input_filename = "kid.raw";

    /*************
     * C processing
     * *************/
    char output_filename_C[256];
    generate_output_filename_C(input_filename, output_filename_C, sizeof(output_filename_C));

    // Check and delete existing output files
    check_and_delete_file(output_filename_C);

    unsigned char thresh = 127;
    unsigned char *ptrin_C = (unsigned char *)malloc(WIDTH * HEIGHT);
    unsigned char *ptrout_C = (unsigned char *)malloc(WIDTH * HEIGHT);
    if (!ptrin_C || !ptrout_C) {
        fprintf(stderr, "Memory allocation failed\n");
        return EXIT_FAILURE;
    }

    if (!load_image(input_filename, ptrin_C)) {
        free(ptrin_C);
        free(ptrout_C);
        return EXIT_FAILURE;
    }

    // clock_t start_C = clock();
    QueryPerformanceCounter(&start);
    threshold_image_C(ptrin_C, ptrout_C, thresh);
    QueryPerformanceCounter(&end);
    // clock_t end_C = clock();

    // printf("Time spent for C code: %f\n", (float)(end_C - start_C) / CLOCKS_PER_SEC);
    printf("Time spent for C code: %f\n", (float)(end.QuadPart - start.QuadPart) / frequency.QuadPart);

    /**************
     * SIMD processing
     * *************/
    char output_filename_SIMD[256];
    generate_output_filename_SIMD(input_filename, output_filename_SIMD, sizeof(output_filename_SIMD));

    // Check and delete existing output files
    check_and_delete_file(output_filename_SIMD);

    unsigned char *ptrin_SIMD = (unsigned char *)malloc(WIDTH * HEIGHT);
    unsigned char *ptrout_SIMD = (unsigned char *)malloc(WIDTH * HEIGHT);
    if (!ptrin_SIMD || !ptrout_SIMD) {
        free(ptrin_SIMD);
        free(ptrout_SIMD);
        return EXIT_FAILURE;
    }

    if (!load_image(input_filename, ptrin_SIMD)) {
        free(ptrin_SIMD);
        free(ptrout_SIMD);
        return EXIT_FAILURE;
    }

    // clock_t start_simd = clock();
    QueryPerformanceCounter(&start);
    threshold_image_SIMD(ptrin_SIMD, ptrout_SIMD, thresh);
    QueryPerformanceCounter(&end);
    //clock_t end_simd = clock();

    // printf("Time spent for SIMD code: %f\n", (float)(end_simd - start_simd) / CLOCKS_PER_SEC);
    printf("Time spent for SIMD code: %f\n", (float)(end.QuadPart - start.QuadPart) / frequency.QuadPart);


    if (!save_image(output_filename_C, ptrout_C)) {
        free(ptrin_C);
        free(ptrout_C);
        return EXIT_FAILURE;
    }

    if (!save_image(output_filename_SIMD, ptrout_SIMD)) {
        free(ptrin_SIMD);
        free(ptrout_SIMD);
        return EXIT_FAILURE;
    }

    free(ptrin_C);
    free(ptrout_C);
    free(ptrin_SIMD);
    free(ptrout_SIMD);
    return EXIT_SUCCESS;
}
