#ifndef RAINBOWTABLE_HPP
#define RAINBOWTABLE_HPP

#include <string>
#include <iostream>
#include <vector>
#include <mutex>
#include <thread>
#include <atomic>
#include <iomanip>
#include <csignal>
#include <execution>
#include <stdexcept>

#include "./Timer.hpp"
#include "../utils/staticstring.hpp"


static const std::string charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
static const int charsetSize = charset.size();

static const unsigned HASHSIZE = 65;
const size_t bytesPerGB = 1e9;

template<unsigned PASSWDLENGTH>
class RainbowTable{
    private:
        float fileSizeGB;
        int chainLength;
        std::vector<std::pair<uint64_t, uint64_t>> table;
        Timer timer;
        int maxEntries;
    public:
        RainbowTable(float fileSizeGB, int chainLength) : fileSizeGB{fileSizeGB}, chainLength{chainLength} {
            maxEntries = (fileSizeGB * bytesPerGB) / (2*sizeof(uint64_t));
            std::cout << "Generating rainbow table with " << maxEntries << " entries" << std::endl;
            table.resize(maxEntries);
        }

        void generate();

        static void generateRainbowTable(void* instance, unsigned int maxDataSize, unsigned int startIdx, unsigned int endIdx);
        
        void generateChain(const StaticString<PASSWDLENGTH+1> &head, StaticString<PASSWDLENGTH+1> &tail, StaticString<HASHSIZE> &hash);

        void reduction(const StaticString<HASHSIZE> &hash, const int position, StaticString<PASSWDLENGTH+1> &reduced);

        void sortTable();

        void saveTabletoFile();

        std::string generate_passwd(int length);
};

#endif // RAINBOWTABLE_HPPzz