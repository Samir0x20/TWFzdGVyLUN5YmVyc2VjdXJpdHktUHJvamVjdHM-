#ifndef ATTACK_HPP
#define ATTACK_HPP
#include <iostream>
#include <fstream>
#include <string>
#include <cstring>
#include <tuple>
#include <vector>
#include <algorithm>
#include <thread>
#include "../Utils/sha256.h"

static const std::string charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

class Attack{

private:

    std::string rainbowTablePath; //the path to the rainbow table
    std::string hashFilePath; //path to the file containing the hashes to crack 
    int pwdSize; 
    int maxSize;
    int nbReduction;
    SHA256 sha;
    std::vector<std::string> allPasswordFound;


    std::string reduction(std::string hash256,  int passwordLength, int position);

    std::string generateTail(std::string hash, int column);

    std::string findInChain(std::string login, std::string hashToCrack);

    std::string findInRainbowTable(std::string hashToCrack, std::string tail, 
                                   std::vector<std::tuple<std::string, std::string>> content);

    std::string attack(std::string hashToCrack,
                std::vector<std::tuple<std::string, std::string>> content);

    std::vector<std::tuple<std::string, std::string>> pullContent();

public:

    Attack(int size, int nb, std::string file){
        pwdSize = size, 
        nbReduction = nb,
        hashFilePath = file;};

    int binarySearch(std::vector<std::tuple<std::string, std::string>> content, int begin, int end, std::string element);

    int getSize(){return pwdSize;};

    std::string getHashFile(){return hashFilePath;};
    
    static void multiAttack(void * instance);

    void push(std::string element){allPasswordFound.push_back(element);};

    std::vector<std::string> getAllPasswordFound(){return allPasswordFound;};


};

#endif // ATTACK_HPP
