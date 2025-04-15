#include <iostream>
#include <chrono>
#include "RainbowTable.hpp"

enum LengthEnum {
    LENGTH_6 = 6,
    LENGTH_7 = 7,
    LENGTH_8 = 8,
    LENGTH_9 = 9,
    LENGTH_10 = 10
};

int main(int argc, char *argv[])
{
    if(argc != 4)
    {
        std::cerr << "Usage : \"./generate_table.out length size nbReduction\", where" << std::endl
            << "- length is the number of chars in an alphanumeric password," << std::endl
            << "- size is the size of a file in GigaBytes," << std::endl
            << "- nbReduction is the length of the chain." << std::endl;    
        return 1;
    }

    const int length = std::stoi(argv[1]);
    float size = std::stof(argv[2]);
    int nbReduction = std::stoi(argv[3]);

    // Get current time at the start of the program
    auto start_time = std::chrono::system_clock::now();
    auto start_time_t = std::chrono::system_clock::to_time_t(start_time);
    auto start_tm = *std::localtime(&start_time_t);

    std::cout << "Program started at: " << std::put_time(&start_tm, "%H:%M:%S") << std::endl;
    std::cout << "Press CTRL+C to stop the program. It will still save the progress." << std::endl;
    std::cout << "Generate approximately " << size << " GB of rainbow table with " << nbReduction << " reduction for password size " << length << std::endl;

    std::chrono::time_point<std::chrono::system_clock> start, end;
    start = std::chrono::system_clock::now();

    switch (length) {
        case LENGTH_6: {
            RainbowTable<6> rainbow(size, nbReduction);
            rainbow.generate();
            break;
        }
        case LENGTH_7: {
            RainbowTable<7> rainbow(size, nbReduction);
            rainbow.generate();
            break;
        }
        case LENGTH_8: {
            RainbowTable<8> rainbow(size, nbReduction);
            rainbow.generate();
            break;
        }
        case LENGTH_9: {
            RainbowTable<9> rainbow(size, nbReduction);
            rainbow.generate();
            break;
        }
        case LENGTH_10: {
            RainbowTable<10> rainbow(size, nbReduction);
            rainbow.generate();
            break;
        }
        default:
            std::cerr << "Unsupported length: " << length << std::endl;
            return 1;
    }

    end = std::chrono::system_clock::now();
    std::chrono::duration<double> elapsed_seconds = end - start;
    std::cout << elapsed_seconds.count() << std::endl;

    return 0;
}