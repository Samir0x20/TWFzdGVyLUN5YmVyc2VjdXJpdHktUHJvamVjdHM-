#include "rainbow-table.hpp"
#include "../misc/threadpool.hpp"
#include "../Utils/passwd-utils.hpp"
#include <bits/stdc++.h> 
#include <tuple>


/*
* It creates the rainbow-table
* @param instance the rainbow object
*/
void Rainbow::generate(void * instance){ 
    Rainbow* rainbow = (Rainbow*) instance;
    std::string line;
    std::string reduced;
    std::string head_tail;
    std::string previous_tail = "";
    int collision = 0;
    std::vector<std::tuple<std::string, std::string>> content;
    int pwdSize = rainbow->getSize();
    long unsigned int index = pwdSize % 6;
    

    std::ifstream head_file("Output-Input/password.txt");
    if(head_file.is_open())
    {
        while(getline(head_file, line)){// reads all the starting passwords
            
            if(line.size() == pwdSize){
                reduced = rainbow->generate_chain(line, rainbow->nbReduction);
                content.push_back(make_tuple(line , reduced));
            }
        }
        std::sort(content.begin(), content.end(), sortbysec); // sorts (head,tail) tuples by tail
        openFiles[index].open(tailFiles[index]);
        for(int unsigned i = 0; i < content.size(); i++){// writes to file head and coresponding tail 
            line = std::get<0>(content[i]);
            reduced = std::get<1>(content[i]);
            if(previous_tail != reduced){// does not write collision
                head_tail = line + ";" + reduced ;
                openFiles[index] << head_tail << std::endl;
            }
            else{collision++;}
            previous_tail = reduced;
        }
        openFiles[pwdSize % 6].close();
        std::cout << "Number of collision : "<< collision << " || for size : " << pwdSize <<std::endl;
    }

    else throw std::runtime_error("Output files could not be opened");
}

inline bool Rainbow::sortbysec(const std::tuple<std::string, std::string>& a, const std::tuple<std::string, std::string>& b){ // function to compare tuples by the second element

    return (std::get<1>(a) < std::get<1>(b)); 

} 

/*
* It creates a chain from head to tail using sha256 and different reduction functions
* @param head the randomly generated password to start the chain
* @param chainLength the length of the password
*/
std::string Rainbow::generate_chain(std::string& head, const int chainLenght){
    
    SHA256 sha;
    std::string hashed = sha(head);
    std::string reduced;
    const int size = head.size();
    
    for(int i = 0; i < chainLenght; i++){
        reduced = reduction(hashed, size, i);
        hashed = sha(reduced); // There is away to optimise this line but not enough time
    }

    reduced = reduction(hashed, size, chainLenght);
    return reduced;
}

/*
* It reduces a hash finding a possible password from it
* @param hash256 the hash whose position we wish to find
* @param passwordLength the length of the password
* @param position the position where the reduction is
*/
std::string Rainbow::reduction(std::string hash256,  int passwordLength, int position) {
  
    std::string reduced;
    int index;

    for (int i = 0; i < passwordLength; i++) {
        index = static_cast<int>((((hash256[i] ^ position) + hash256[i + 3] + hash256[i + 5] + hash256[i + 7] + hash256[i + 9] + hash256[i + 17] + position) % 62));
        reduced += charset[index];
    }

    return reduced;
}