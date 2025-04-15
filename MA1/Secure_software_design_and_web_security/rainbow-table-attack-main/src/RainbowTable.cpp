#include "RainbowTable.hpp"
#include "../utils/passwd-utils.hpp"
#include "../utils/6bits-encoder.hpp"
#include "../utils/sha256.h"

std::atomic<bool> stopFlag(false);

void signalHandler(int signum) {
    stopFlag = true;
}


template<unsigned PASSWDLENGTH>
void RainbowTable<PASSWDLENGTH>::generate() {
    timer.start();

    const unsigned int nbThreads = std::thread::hardware_concurrency();

    std::cout << "number of threads : " << nbThreads << std::endl;

    std::vector<std::thread> threads;
    threads.reserve(nbThreads);

    unsigned int maxDataSizePerThread = maxEntries / nbThreads;


    // Register signal handler
    std::signal(SIGINT, signalHandler);


    for (unsigned int i = 0; i < nbThreads; i++) {
        unsigned int startIdx = i * maxDataSizePerThread;
        unsigned int endIdx = (i == nbThreads - 1) ? maxEntries : startIdx + maxDataSizePerThread;
        threads.emplace_back(std::thread(RainbowTable::generateRainbowTable, this, maxDataSizePerThread, startIdx, endIdx));
    }

    for(long unsigned int i = 0 ; i < threads.size() ; i++){
		threads[i].join();
	}

    std::cout << "\nCreated rainbow table in " << timer.elapsedTime() << " seconds" << std::endl;
    timer.reset();
    timer.start();

    std::cout << "Sorting table..." << std::endl;
    sortTable();
    std::cout << "Table sorted in " << timer.elapsedTime() << " seconds" << std::endl;

    timer.reset();
    timer.start();

    saveTabletoFile();
}

template<unsigned PASSWDLENGTH>
void RainbowTable<PASSWDLENGTH>::generateRainbowTable(void* instance, unsigned int maxDataSize, unsigned int startIdx, unsigned int endIdx) {
    RainbowTable* rainbowTable = static_cast<RainbowTable*>(instance);

    StaticString<HASHSIZE> hash;

    StaticString<PASSWDLENGTH+1> tail;
    StaticString<PASSWDLENGTH+1> head;

    // Assignment needed to avoid getting random
    // values from memory that raise exceptions
    tail = rainbowTable->generate_passwd(PASSWDLENGTH);

    int lastDisplayedProgress = 0;
    double totalTime = 0.0;
    int progressCount = 0;
    float progress;
    Timer progressTimer;
    progressTimer.start();

    for (unsigned int idx = startIdx; idx < endIdx; idx++) {
        if (stopFlag) {
            break;
        }

        head = rainbowTable->generate_passwd(PASSWDLENGTH);
        rainbowTable->generateChain(head, tail, hash);
        rainbowTable->table[idx] = std::make_pair(encodeStringToUint64(head.c_str()), encodeStringToUint64(tail.c_str()));
        
        progress = ((float)(idx - startIdx) / (float)(endIdx - startIdx)) * 100;

        if (progress - lastDisplayedProgress >= 1.0) {
            progressTimer.stop();
            double elapsed = progressTimer.elapsedTime();
            totalTime += elapsed;
            progressCount++;
            double averageTime = totalTime / progressCount;

            // Get current time of day
            auto now = std::chrono::system_clock::now();
            auto now_time_t = std::chrono::system_clock::to_time_t(now);
            auto now_tm = *std::localtime(&now_time_t);

            std::cout << "\r[" <<std::put_time(&now_tm, "%H:%M:%S") << "]" 
                    << "Progress: " << std::fixed << std::setprecision(2) << progress 
                    << "%, Average Time per 1%: " << averageTime << " seconds. " << std::flush;

            lastDisplayedProgress = progress;
            progressTimer.reset();
            progressTimer.start();
        }
    }
}

template<unsigned PASSWDLENGTH>
void RainbowTable<PASSWDLENGTH>::generateChain(const StaticString<PASSWDLENGTH+1> &head, StaticString<PASSWDLENGTH+1> &tail, StaticString<HASHSIZE> &hash) {
    hash = sha256(head.c_str());
    for (int i=0; i < chainLength; i++) {
        reduction(hash, i, tail);
        hash = sha256(tail.c_str());
    }
    reduction(hash, chainLength, tail);
}

template<unsigned PASSWDLENGTH>
void RainbowTable<PASSWDLENGTH>::reduction(const StaticString<HASHSIZE> &hash, const int position, StaticString<PASSWDLENGTH+1> &reduced) {
    int index = 0;

    for (unsigned i = 0; i < PASSWDLENGTH; i++) {
        index = static_cast<int>((((hash[i] ^ position) + hash[i + 3] + hash[i + 5] + hash[i + 7] + hash[i + 9] + hash[i + 17] + position) % 62));
        reduced[i] = charset[index];
    }
}

template<unsigned PASSWDLENGTH>
void RainbowTable<PASSWDLENGTH>::sortTable() {
    std::sort(table.begin(), table.end(), [](const std::pair<uint64_t, uint64_t>& a, const std::pair<uint64_t, uint64_t>& b) {
        return a.second < b.second;
    });
}

template<unsigned PASSWDLENGTH>
void RainbowTable<PASSWDLENGTH>::saveTabletoFile() {
    // Format fileSizeGB to 4 decimal places
    std::ostringstream fileSizeStream;
    fileSizeStream << std::fixed << std::setprecision(3) << fileSizeGB;
    std::string fileSizeStr = fileSizeStream.str();

    std::string filename = "output/rainbowTable-" + std::to_string(PASSWDLENGTH) + "-" + std::to_string(chainLength) + "-" + fileSizeStr + ".bin";
    if(stopFlag) {
        filename = "output/rainbowTable-" + std::to_string(PASSWDLENGTH) + "-" + std::to_string(chainLength) + "-" + fileSizeStr + "-incomplete.bin";
    }

    timer.reset();
    timer.start();

    std::ofstream outputFile(filename, std::ios::binary);

    if (!outputFile.is_open()) {
        throw std::runtime_error("Output file could not be opened");
    }

    uint64_t previousTail = 0;
    int collision = 0;

    for (const auto& pair : table) {
        if(previousTail != pair.second) {
            outputFile.write(reinterpret_cast<const char*>(&pair.first), sizeof(pair.first));
            outputFile.write(reinterpret_cast<const char*>(&pair.second), sizeof(pair.second));
        }
        else{collision++;}
        previousTail = pair.second;
    }   

    outputFile.close();

    std::cout << "data stored in " << timer.elapsedTime() << " seconds" << std::endl;
    std::cout << "Number of head/tail: " << table.size() - collision << " | collisions: " << collision << std::endl;
}

template<unsigned PASSWDLENGTH>
std::string RainbowTable<PASSWDLENGTH>::generate_passwd(int length)
{
	char str[length + 1];
	for(int i = 0; i < length; i++)
		str[i] = charset[rainbow::random(0, charsetSize - 1)];
	str[length] = '\0';

	return std::string(str);
}


template class RainbowTable<6>;
template class RainbowTable<7>;
template class RainbowTable<8>;
template class RainbowTable<9>;
template class RainbowTable<10>;
