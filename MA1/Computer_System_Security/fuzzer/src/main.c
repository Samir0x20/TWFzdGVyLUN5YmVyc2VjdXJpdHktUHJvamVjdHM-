#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include "tar_utils.h"
#include "fuzzer.h"

int main(int argc, char *argv[])
{
    if (argc != 2) {
        printf("Please, given only the correct path to the tar extractor.");
        return -1;
    }

    // Initialize random generator
    srand(time(NULL));

    char* path_extractor = argv[1];
    
    //test the extractor
    fuzzer(path_extractor);
    
    return 0;
}
