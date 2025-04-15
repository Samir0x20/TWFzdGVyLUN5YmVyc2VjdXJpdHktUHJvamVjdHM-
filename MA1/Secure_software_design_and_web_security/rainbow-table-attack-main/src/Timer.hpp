#include <iostream>
#include <chrono>

class Timer {
public:
    // Constructor
    Timer() : startTimePoint(), isRunning(false) {}

    // Start the timer
    void start() {
        if (!isRunning) {
            startTimePoint = std::chrono::high_resolution_clock::now();
            isRunning = true;
        }
    }

    // Stop the timer
    void stop() {
        if (isRunning) {
            endTimePoint = std::chrono::high_resolution_clock::now();
            isRunning = false;
        }
    }

    // Reset the timer
    void reset() {
        startTimePoint = std::chrono::time_point<std::chrono::high_resolution_clock>();
        endTimePoint = std::chrono::time_point<std::chrono::high_resolution_clock>();
        isRunning = false;
    }

    // Get the elapsed time in seconds
    double elapsedTime() {
        std::chrono::time_point<std::chrono::high_resolution_clock> endTime;
        
        if (isRunning) {
            endTime = std::chrono::high_resolution_clock::now();
        } else {
            endTime = endTimePoint;
        }
        
        return std::chrono::duration<double>(endTime - startTimePoint).count();
    }

private:
    std::chrono::time_point<std::chrono::high_resolution_clock> startTimePoint, endTimePoint;
    bool isRunning;
};
