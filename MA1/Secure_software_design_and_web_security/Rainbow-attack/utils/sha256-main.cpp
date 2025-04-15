#include <iostream>
#include "sha256.h"
#include "staticstring.hpp"

using std::string;
using std::cout;
using std::endl;
 
int main(int argc, char *argv[])
{   
    string input1 = "grape";        
    string output1 = sha256(input1);
 
    cout << "sha256('"<< input1 << "'):" << output1 << endl;
    
    StaticString<10> input2 = "grape";
    StaticString<65> output2 = sha256(input2);
    cout << "sha256('"<< input2 << "'):" << output2 << endl;
    return 0;
}
