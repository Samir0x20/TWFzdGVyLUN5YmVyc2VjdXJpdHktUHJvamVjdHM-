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
#include "../Utils/sha256.h"


static const std::vector<std::string> tailFiles = {"Output-Input/rainbowTable-6.txt", 
                                         "Output-Input/rainbowTable-7.txt", 
                                         "Output-Input/rainbowTable-8.txt", 
                                         "Output-Input/rainbowTable-9.txt", 
                                         "Output-Input/rainbowTable-10.txt"};
static const std::string charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
static const int SIZE = 16;


class Rainbow{
private:
    int pwdSize, nbReduction;

    
    std::string reduction(std::string hash256,  int passwordLength, int position);

    inline static bool sortbysec(const std::tuple<std::string, std::string>& a,  
                   const std::tuple<std::string, std::string>& b);

public:

    inline static std::ofstream openFiles[5];

    Rainbow(int size, int nb){
        pwdSize = size,
        nbReduction = nb;};

    int getSize(){return pwdSize;};
    static void generate(void * instance);
    std::string generate_chain(std::string &head, const int chainLenght);
    

}; 

#endif // RAINBOWTABLE_HPP


