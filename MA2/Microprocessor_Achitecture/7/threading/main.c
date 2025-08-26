/**
 * This needs to be compiled with the pthread library.
 * Command line: gcc -lpthread main.c -o thread
**/

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <assert.h>
#include <immintrin.h>
#include <time.h>
#include <unistd.h>

#define WIDTH 1024
#define HEIGHT 1024

// Define a structure for the thread arguments
typedef struct Args Args;
struct Args {
    unsigned char *ptrin;
    unsigned char *ptrout;
    unsigned char threshold;
    int start;
    int end;
};

// void threshold_image_C(unsigned char *ptrin, unsigned char *ptrout, unsigned char threshold) {
//     for (int i = 0; i < WIDTH * HEIGHT; i++) {
//         if (ptrin[i] < threshold) {
//             ptrout[i] = 0; // Black
//         } else {
//             ptrout[i] = 255; // White
//         }
//     }
// }

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

void threshold_image_C(unsigned char *ptrin, unsigned char *ptrout, unsigned char threshold) {
    for (int i = 0; i < WIDTH * HEIGHT; i++) {
        if (ptrin[i] < threshold) {
            ptrout[i] = 0; // Black
        } else {
            ptrout[i] = 255; // White
        }
    }
}


// This function is the entry point of the thread
void *processing_subset_image(Args *vargp){
    int start = vargp->start;
    int end = vargp->end;
    unsigned char *ptrin = vargp->ptrin;
    unsigned char *ptrout = vargp->ptrout;
    unsigned char threshold = vargp->threshold;

    for (int i = start; i < end; i++) {
        if (ptrin[i] < threshold) {
            ptrout[i] = 0; // Black
        } else {
            ptrout[i] = 255; // White
        }
    }
    pthread_exit(NULL);
}


int main(){
    int maxThreads = 4;

    const char *input_filename = "kid.raw";

    /*************
     * C processing
     * *************/
    char output_filename_C[256];
    snprintf(output_filename_C, sizeof(output_filename_C), "kid_out_C.raw");

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

    struct timespec start_time_C, end_time_C;
    clock_gettime(CLOCK_REALTIME, &start_time_C);

    threshold_image_C(ptrin_C, ptrout_C, thresh);

    clock_gettime(CLOCK_REALTIME, &end_time_C);
    double elapsed_time_C = (end_time_C.tv_sec - start_time_C.tv_sec) +
                          (end_time_C.tv_nsec - start_time_C.tv_nsec) / 1e9;
    printf("Time spent for C code: %f seconds\n", elapsed_time_C);



    /******************
     * thread processing
     * ****************/


    char output_filename_thread[256];

    snprintf(output_filename_thread, sizeof(output_filename_thread), "kid_out_thread.raw");



    unsigned char *ptrin_thread = (unsigned char *)malloc(WIDTH * HEIGHT);
    unsigned char *ptrout_thread = (unsigned char *)malloc(WIDTH * HEIGHT);
    if (!ptrin_thread || !ptrout_thread) {
        fprintf(stderr, "Memory allocation failed\n");
        return EXIT_FAILURE;
    }

    // Load image data into ptrin_thread
    if (!load_image(input_filename, ptrin_thread)) {
        free(ptrin_thread);
        free(ptrout_thread);
        return EXIT_FAILURE;
    }

    // Create thread IDs
    pthread_t *tid = malloc(maxThreads * sizeof(pthread_t));
    assert (tid != NULL);

    struct timespec start_time_thread, end_time_thread;
    clock_gettime(CLOCK_REALTIME, &start_time_thread);

    for(int i = 0; i < maxThreads; i++){
        Args *args = malloc(sizeof(Args));
        assert (args != NULL);
        args->start = i * (WIDTH * HEIGHT / maxThreads);
        args->end = (i + 1) * (WIDTH * HEIGHT / maxThreads);
        args->threshold = 127;
        args->ptrin = ptrin_thread;
        args->ptrout = ptrout_thread;


        pthread_create(&tid[i], NULL, (void *) processing_subset_image, args);
    }


    for(int i = 0; i < maxThreads; i++){
        pthread_join(tid[i], NULL);
    }

    clock_gettime(CLOCK_REALTIME, &end_time_thread);
    double elapsed_time_thread = (end_time_thread.tv_sec - start_time_thread.tv_sec) +
                          (end_time_thread.tv_nsec - start_time_thread.tv_nsec) / 1e9;
    printf("Time spent for multithreaded code: %f seconds\n", elapsed_time_thread);

    free(tid);

    // Save the output image
    if(!save_image(output_filename_thread, ptrout_thread)) {
        free(ptrin_thread);
        free(ptrout_thread);
        return EXIT_FAILURE;
    }

    if (!save_image(output_filename_C, ptrout_C)) {
        free(ptrin_C);
        free(ptrout_C);
        return EXIT_FAILURE;
    }

    free(ptrin_thread);
    free(ptrout_thread);
    free(ptrin_C);
    free(ptrout_C);

    return 0;
    // Free allocated memory

}
