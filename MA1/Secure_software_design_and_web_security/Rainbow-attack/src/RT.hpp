#ifndef RAINBOWTABLE_HPP
#define RAINBOWTABLE_HPP
#include <string>
#include <fstream>
#include <iostream>
#include <vector>
#include <algorithm>
#include <array>
#include <memory>
#include <thread>
#include <mutex>
#include <bits/stdc++.h> 
#include <tuple>
#include "../utils/sha256.h"


static const std::vector<std::string> tailFiles = { "input/rainbowTable-6.txt", 
                                                    "input/rainbowTable-7.txt", 
                                                    "input/rainbowTable-8.txt", 
                                                    "input/rainbowTable-9.txt", 
                                                    "input/rainbowTable-10.txt"};
static const std::string charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
static const int SIZE = 16;



class Rainbow{
private:
    int pwdLength, nbReduction;
    double fileSize;
    
    std::vector<std::tuple<std::string, std::string>> content;

    
    std::string reduction(std::string hash256,  int passwordLength, int position);

    inline static bool sortbysec(const std::tuple<std::string, std::string>& a,  
                   const std::tuple<std::string, std::string>& b);

    static void makeChain(void * instance);

    std::string generate_passwd1(int lenght);

public:

    //inline static std::ofstream openFiles[5];
    std::mutex mtx;  // Mutex to protect sharedVector
    Rainbow(int length, double size, int nb): pwdLength(length), fileSize(size), nbReduction(nb) {
    std::cout << "Constructor called with fileSize: " << fileSize << std::endl;
}

    int getpwdLenght(){return pwdLength;};
    double getfileSize(){return fileSize;};
    int getnbReduction(){return nbReduction;};
    std::vector<std::tuple<std::string, std::string>>& getContent(){return content;};

    void generate();
    std::string generate_chain(std::string &head, const int chainLenght);
    

}; 

#endif // RAINBOWTABLE_HPP