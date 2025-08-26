/**
 * multifork.c: Example for spawning processes.
 *
 * This needs to be compiled with -mrdrnd to enable architecture support for
 * RDRAND in GCC.
 * Command line: gcc -mrdrnd multifork.c
 * RDRAND is not supported by all architectures and if you are working on
 * this exercise on a processor without RDRAND, you may have to substitute
 * _rdrand16_step() below with a different source of randomness or with
 * deterministic behaviour.
**/
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <unistd.h>
#include <sys/wait.h>
#include <assert.h>
#include <immintrin.h>

#define MAXCHILDREN 3


// Create a global variable
int g = 0;

// This function is the workload for child processes
void myThreadFun(void)
{
    // Create a static variable
    static int s = 0;

    // Normal int variable
    int n = 0;

    ++s;
    ++g;
    ++n;

    // This construct sometimes crashes a child process due to a
    // NULL dereference. We use this to simulate a programming error.
    unsigned short r;
    _rdrand16_step (&r);      // RDRAND requires -mrdrnd
    if ((r % 10) + 1 > 7) {
        int* i = NULL;
        printf("crashing...\n");
        printf("%d\n", *i);   // *i == NULL
    }

    // Output variable states
    printf("Process ID: %d, Static: %d, Global: %d, Normal: %d\n",
      getpid(), s, g, n);
    return;
}


int main()
{
    int i;
    pid_t p;
    pid_t Children[MAXCHILDREN];
    siginfo_t siginfo;

    // Create three child processes
    for (i = 0; i < MAXCHILDREN; i++) {
        p = fork();
        Children[i] = p;
        if (p < 0) {          // fork() failed
            perror ("fork fail\n");
            exit (1);
        } else if (p == 0) {  // child is executing
          myThreadFun();
          break;              // remove this and explain
        }
    }

    // Wait for all children to terminate
    if (p > 0) {              // parent is executing
        for (i = 0; i < MAXCHILDREN; i++) {
            waitid (P_PID, Children[i], &siginfo, WEXITED);
        }

        printf("That's it, folks!\n");
    }

    return EXIT_SUCCESS;
}
