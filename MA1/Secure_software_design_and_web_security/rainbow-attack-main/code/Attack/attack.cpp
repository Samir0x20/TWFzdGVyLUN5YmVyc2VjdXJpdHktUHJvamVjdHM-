#include "../misc/threadpool.hpp"
#include "attack.hpp"


/*
* It reduces a hash finding a possible password from it
* @param hash256 the hash whose position we wish to find
* @param passwordLength the length of the password
* @param position the position where the reduction is
*/
std::string Attack::reduction(std::string hash256,  int passwordLength, int position) {
  
    std::string reduced;
    int index;

    for (int i = 0; i < passwordLength; i++) {
        index = static_cast<int>((((hash256[i] ^ position) + hash256[i + 3] + hash256[i + 5] + hash256[i + 7] + hash256[i + 9] + hash256[i + 17] + position) % 62));
        reduced += charset[index];
    }

    return reduced;
}


/*
* It generates a tail from a given hash starting at given position
* @param hash the hash whose position we wish ti find
* @param column the column where the hash could be
*/
std::string Attack::generateTail(std::string hash, int column){

    std::string tail;

    for(int i = column; i < nbReduction; i++){
        tail = reduction(hash, getSize(), i);
        hash = sha(tail);
    }
    tail = reduction(hash, getSize(), nbReduction);
    return tail;
}


/*
* It look in one of the chain of the rainbow table for the hash to crack and if found return the password that precedes it
*
* @param login the password at the beginning of the chain
* @param hashToCrack the hash that we are looking for in the chain
* @param nbReductions the lenght of the chain
*/
std::string Attack::findInChain(std::string head, std::string hashToCrack){
    std::string pwd = head;
    std::string hash;

    for (int i = 0; i < nbReduction; i++){
        hash = sha(pwd);
        if (hashToCrack == hash) {
            return pwd;
        }
        pwd = reduction(hash, getSize(), i);
    }
    
    return "";
}


/*
 * It looks for the generated tail in the rainbow table chains, if it's found, we will look for the string that was hashed to produce it.
 *
 * @param nbReductions The number of reductions the hash will go through
 * @param tail The tail of the hash that is looked for in the rainbow table
 * @param rainbowTablePath The path to the rainbow table file
 *
 * Line format: "login;hash"
 *
 * @return the password corresponding to the tail found in the rainbow table, an empty string if the tail is not found.
 */
std::string Attack::findInRainbowTable(std::string hashToCrack, std::string tail, 
                                     std::vector<std::tuple<std::string, std::string>> content){

    std::string head;
    std::string hash;
    

    int index = binarySearch(content, 0, content.size()-1, tail);
    
    if(index != -1) { 
        head = std::get<0>(content[index]);
        std::string pwdInChain = findInChain(head, hashToCrack);
        if (!pwdInChain.empty()) {
            return pwdInChain;
        }
    }
    return "";
}

int Attack::binarySearch(std::vector<std::tuple<std::string, std::string>> content, int begin, int end, std::string element) {
   if (begin <= end) {

        int mid = (begin + end)/2;
        std::string tail = std::get<1>(content[mid]);

        if(tail == element)
            return mid;

        if(tail > element)
            return binarySearch(content, begin, mid-1, element);

        if(tail < element)
            return binarySearch(content, mid+1, end, element);
    }
   return -1;
}


std::string Attack::attack(std::string hashToCrack, 
                    std::vector<std::tuple<std::string, std::string>> content){

    std::string tail;
    std::string password = "";
    int i = nbReduction;

    while(i >= 0){

        tail = generateTail(hashToCrack, i);
        password = findInRainbowTable(hashToCrack, tail, content);

        if (!password.empty()){ 
            if (sha256(password) == hashToCrack){
                return password;
            }
        }
        i--;
    }
    return "NOT_FOUND";
}


/*
*Perform the rainbow table attack on multiple hashes
* We attempt to crack every single hash of the input file
*
* @param instance the instance of the class Attack performing the attack.
*/
void Attack::multiAttack(void * instance) {
    try{
        Attack* atk = (Attack*) instance;
        std::string hashFilePath = atk->getHashFile();
        std::vector<std::tuple<std::string, std::string>> content = atk->pullContent();
        std::ifstream hashesToCrack(hashFilePath);
        std::string resultTitle = "Output-Input/result.txt";
        int successRate = 0;
        std::string hashToCrack;
        std::string passwordFound;
        std::string result;

        if(hashesToCrack.is_open()) {
            while(std::getline(hashesToCrack, hashToCrack)){
                if(!hashToCrack.empty()){
                    passwordFound = atk->attack(hashToCrack, content);
                    //std::cout << crackPassword << std::endl;
                    if(passwordFound != "NOT_FOUND"){
                        result =  "Password : " + passwordFound +   " | Hash : " + hashToCrack;
                        successRate++;
                    }
                    else{
                        result = "?";
                    }
                    atk->push(result);
                }
            }

            hashesToCrack.close();
            std::cout << "Success Rate: Out of all the hashes, " << successRate << " / " << content.size() << " have been found for the password of size " << atk->getSize() << std::endl;
        } 
        else{
            std::cerr << "Error opening file: " << hashFilePath << std::endl;
        }
    }
    catch(std::ifstream::failure e){
        std::cerr << "Exception opening/reading/closing file: " << e.what() << std::endl;
    }
}


std::vector<std::tuple<std::string, std::string>> Attack::pullContent(){

    std::string rainbowTablePath = "Output-Input/rainbowTable-" + std::to_string(getSize()) + ".txt"; // Adjust the path accordingly
    std::vector<std::tuple<std::string, std::string>> content;
    std::ifstream file(rainbowTablePath);
    std::string line;
    int lineSeparator;
    std::string head, tail;

    if(file.is_open()){
        while(std::getline(file, line)){
            lineSeparator = line.find(";");
            if (lineSeparator == std::string::npos) {
                // Handle invalid line format (no semicolon found)
                continue;
            }
            head = line.substr(0, lineSeparator);
            tail = line.substr(lineSeparator + 1, line.length());
            content.push_back(make_tuple(head , tail));
        }
    } 
    else throw std::runtime_error("Output files could not be opened");  
    return content;   
}
