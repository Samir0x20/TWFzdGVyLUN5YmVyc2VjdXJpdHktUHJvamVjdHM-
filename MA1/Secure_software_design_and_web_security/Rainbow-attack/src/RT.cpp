#include "RT.hpp"
#include <bits/stdc++.h> 
#include <tuple>
#include "../utils/passwd-utils.hpp"


void Rainbow::generate(){
    std::string filename = "output/rainbowTable-" + std::to_string(pwdLength) + ".txt";
    unsigned int nbThread = std::thread::hardware_concurrency();
    std::string line;
    std::string reduced;
    std::string head_tail;
    std::string previous_tail = "";
    int collision = 0;

    std::vector<std::thread> threads;

    std::cout << "number of threads : " << nbThread << std::endl;
    for(unsigned int i = 0; i < nbThread; i++){
        threads.push_back(std::thread(Rainbow::makeChain, this));
    }

    for(long unsigned int i = 0 ; i < threads.size() ; i++){// waits for all threads to finish
		threads[i].join();
	}

    std::sort(content.begin(), content.end(), sortbysec); // sorts (head,tail) tuples by tail

    std::ofstream outputFile(filename);
    if(outputFile.is_open()){
        
        for(int unsigned i = 0; i < content.size(); i++){// writes to file head and coresponding tail 
            line = std::get<0>(content[i]);
            reduced = std::get<1>(content[i]);
            if(previous_tail != reduced){// does not write collision
                head_tail = line + ";" + reduced ;
                outputFile << head_tail << std::endl;
            }
            else{collision++;}
            previous_tail = reduced;
        }
        outputFile.close();
        std::cout << "Number of collision : "<< collision << " || for size : " << pwdLength << "|| content size :" <<content.size()<<std::endl;
    }

    else throw std::runtime_error("Output files could not be opened");
}


void Rainbow::makeChain(void * instance){
    
    Rainbow* rainbow = (Rainbow*) instance;
    std::string reduced;
    //std::cout << "Target file size: " << rainbow->getfileSize() << std::endl;
    size_t sizeInBytes;
    double sizeInGB = 0.0;

    //std::cout << rainbow->getpwdLenght() << " || " << rainbow->getnbReduction() << " || " << rainbow->getfileSize() << std::endl;
    while(sizeInGB < rainbow->getfileSize()){

        std::string pwd =rainbow->generate_passwd1(rainbow->getpwdLenght());
        std::cout << pwd << std::endl;
        reduced = rainbow->generate_chain(pwd, rainbow->getnbReduction());
        std::cout << reduced << std::endl;
        {
            std::lock_guard<std::mutex> lock(rainbow->mtx);
            rainbow->getContent().emplace_back(pwd, reduced);  // Use emplace_back for efficiency
        }


        // Calculate the size of the variable in bytes
        sizeInBytes = rainbow->getContent().size() * sizeof(std::tuple<std::string, std::string>);


        // Convert the size to gigabytes (1 GB = 1,073,741,824 bytes)
        //sizeInGB = static_cast<double>(sizeInBytes) / (1024 * 1024 * 1024);
        sizeInGB = static_cast<double>(sizeInBytes) / (1024 * 1024 * 1024);
        std::cout << "Content size after addition: " << rainbow->getContent().size() << std::endl;
    }
}


/*
* It creates the rainbow-table
* @param instance the rainbow object
*/
/*void Rainbow::generate(void * instance){ 
    Rainbow* rainbow = (Rainbow*) instance;
    std::string line;
    std::string reduced;
    std::string head_tail;
    std::string previous_tail = "";
    int collision = 0;
    
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
}*/

inline bool Rainbow::sortbysec(const std::tuple<std::string, std::string>& a, 
                            const std::tuple<std::string, std::string>& b){ // function to compare tuples by the second element

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

std::string Rainbow::generate_passwd1(int length)
{
	static const std::string char_policy = "azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN1234567890";
	static const int c_len = char_policy.length();

	char str[length + 1];
	for(int i = 0; i < length; i++)
		str[i] = char_policy[rainbow::random(0, c_len - 1)];
	str[length] = '\0';

	return std::string(str);
}

