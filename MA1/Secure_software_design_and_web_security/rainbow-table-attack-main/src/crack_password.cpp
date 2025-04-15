#include <iostream>
#include <fstream>
#include <thread>
#include <vector>
#include <algorithm> 
#include <csignal>
#include <atomic>
#include <filesystem>  
#include <system_error>  

#include "../utils/sha256.h"
#include "../utils/6bits-encoder.hpp"
#include "Timer.hpp"

using std::string;

static const unsigned HASHSIZE = 65;
static const string charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


std::atomic<bool> keepRunning(true);  // Shared flag to signal all threads to stop

void signalHandler(int signal) {
    if (signal == SIGINT || signal == SIGTERM) {
        std::cout << "SIGINT caught. Exiting gracefully..." << std::endl;
        keepRunning.store(false);  // Set the flag to "false", to notify threads to stop
    }
}

void createTable(const string& tableFilename, std::vector<std::pair<uint64_t, uint64_t>>& myMap) {
    std::ifstream file(tableFilename, std::ios::binary);
    if (!file) {
        throw std::runtime_error("Could not open file");
    }

    uint64_t encodedHead;
    uint64_t encodedTail;

    while (file.read(reinterpret_cast<char*>(&encodedHead), sizeof(encodedHead)) &&
           file.read(reinterpret_cast<char*>(&encodedTail), sizeof(encodedTail))) {
        myMap.emplace_back(std::make_pair(encodedHead, encodedTail));
    }
    file.close();
}

void reduction(const int passwdLength, const string &hash, const int position, string &reduced) {
    int index = 0;

    for (int i = 0; i < passwdLength; i++) {
        index = static_cast<int>((((hash[i] ^ position) + hash[i + 3] + hash[i + 5] + hash[i + 7] + hash[i + 9] + hash[i + 17] + position) % 62));
        reduced[i] = charset[index];
    }
}

string crackPassword(const string &head, const int &reductionIdx, const int passwdLength) {
    string reduced = head;
    string hash;
    for (int i=0; i<reductionIdx; i++) {
        hash = sha256(reduced);
        reduction(passwdLength, hash, i, reduced);
    }
    return reduced;
}

void crackHashes(const std::vector<string>& hashes, int startIdx, int endIdx, int passwordLength, int nbReduction,
     const std::vector<std::pair<uint64_t, uint64_t>>& rainbowTable, std::vector<string>& crackedPasswords) {
    for (int idx = startIdx; idx < endIdx; ++idx) {
        string hash = hashes[idx];
        string tmpHash;
        string reduced;
        reduced.resize(passwordLength);
        int reductionIdx = nbReduction;
        bool cracked = false;

        // Check if signal was received to break out of the loop
        while (0 <= reductionIdx && keepRunning.load() && !cracked) {

            tmpHash = hash;
            for (int i = 0; i < nbReduction - reductionIdx; i++) {
                reduction(passwordLength, tmpHash, reductionIdx + i, reduced);
                tmpHash = sha256(reduced);
            }
            reduction(passwordLength, tmpHash, nbReduction, reduced);

            // Use std::lower_bound to search in the sorted rainbow table
            auto it = std::lower_bound(rainbowTable.begin(), rainbowTable.end(), encodeStringToUint64(reduced), [](const std::pair<uint64_t, uint64_t>& p, uint64_t value) {
                return p.second < value;
            });

            if (it != rainbowTable.end()) {
                reduced = crackPassword(decodeUint64ToString(it->first, passwordLength), reductionIdx, passwordLength);
                tmpHash = sha256(reduced);
                if (tmpHash == hash) {
                    std::cout << "Password cracked." << std::endl;
                    cracked = true;
                    break;
                }
            }
            reductionIdx--;
        }

        if (cracked) {
            crackedPasswords[idx] = reduced;
        } else {
            crackedPasswords[idx] = "?";
        }
    }
}

int main(int argc, char const *argv[])
{
    // Set up signal handler for SIGINT and SIGTERM
    std::signal(SIGINT, signalHandler);
    std::signal(SIGTERM, signalHandler);

    Timer timer;
    timer.start();

    if(argc != 6)
    {
        std::cerr << "Usage : ./crack_password.out password_length nbReduction if_table if_hash of_pwd , where" << std::endl
            << "- password_length is the number of chars in an alphanumeric password," << std::endl
            << "- nbReduction is the number of reduction to apply in the chain," << std::endl
            << "- if_table is the name of the input file where the rainbow table is stored," << std::endl
            << "- if_hash is the name of the input file where the sha-256 hashes of the passwords are stored," << std::endl
            << "- of_pwd is the name of the output file where the cracked passwords will be stored." << std::endl;    
        return 1;
    }

    const int passwordLength = std::stoi(argv[1]);
    const int nbReduction = std::stoi(argv[2]);
    const string input_table_file = argv[3];
    const string input_hash_file = argv[4];
    const string output_password_file = argv[5];

    // Get file size of input_table_file
    std::error_code ec;
    auto fileSize = std::filesystem::file_size(input_table_file, ec);
    if (ec) {
        std::cerr << "Error getting file size: " << ec.message() << std::endl;
        return 1;
    }
    int maxEntries = fileSize / (2*sizeof(uint64_t));

    std::vector<std::pair<uint64_t, uint64_t>> rainbowTable; 
    rainbowTable.reserve(maxEntries);
    
    std::cout << "Loading rainbow table..." << std::endl;
    createTable(input_table_file, rainbowTable);

    std::cout << "Loaded rainbow table in " << timer.elapsedTime() << " seconds." << std::endl;
    timer.reset();
    timer.start();

    std::ifstream input_file(input_hash_file);
    std::vector<string> hashes;
    string hash;
    while (std::getline(input_file, hash)) {
        hashes.push_back(hash);
    }
    input_file.close();

    std::vector<string> crackedPasswords(hashes.size(), "?");

    int numThreads = std::thread::hardware_concurrency();

    std::vector<std::thread> threads;
    int chunkSize = hashes.size() / numThreads;


    for (int i = 0; i < numThreads; ++i) {
        int startIdx = i * chunkSize;
        int endIdx = (i == numThreads - 1) ? hashes.size() : startIdx + chunkSize;
        threads.emplace_back(crackHashes, std::ref(hashes), startIdx, endIdx, passwordLength,
            nbReduction, std::ref(rainbowTable), std::ref(crackedPasswords));
    }

    for (auto& thread : threads) {
        thread.join();
    }

    std::ofstream passwd_file(output_password_file);
    for (const auto& crackedPassword : crackedPasswords) {
        passwd_file << crackedPassword << std::endl;
    }
    passwd_file << '\n';
    passwd_file.close();

    std::cout << "Cracked password in " << timer.elapsedTime() << " seconds." << std::endl;

    return 0;
}
