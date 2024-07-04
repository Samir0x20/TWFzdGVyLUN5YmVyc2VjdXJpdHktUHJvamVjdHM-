#include <iostream>
#include <chrono>
#include "attack.hpp"
#include <memory>

int main(int argc, char *argv[])
{
	if(argc != 5)
	{
		std::cerr << "Usage : \"./gen-Attack minSize maxSize nbReduction hashPath \", where" << std::endl
			<< "- minSize is the minimum number of chars allowed in an alphanumeric password," << std::endl
			<< "- maxSize is the maximum number of chars allowed in an alphanumeric password," << std::endl
			<< "- nbReduction is the lenght of the chain." << std::endl
            << "- hashPath is the name of the hash file where the hashes are found" << std::endl;	
		return 1;
	}

	int minSize = std::stoi(argv[1]);
	int maxSize = std::stoi(argv[2]);
	int nbReduction = std::stoi(argv[3]);
	std::string hashFile = argv[4];


	std::vector<std::shared_ptr<Attack>> attacks;
	std::vector<std::thread> threads;

    std::chrono::time_point<std::chrono::system_clock> start, end;
	start = std::chrono::system_clock::now();
	std::shared_ptr<Attack> attack;

	for(int size = minSize ; size < maxSize+1 ; size++){// creates a thread for each password size
		attack = std::make_shared<Attack>(size, nbReduction, hashFile);
		attacks.push_back(attack);
		threads.push_back(std::thread(Attack::multiAttack, attack.get()));
	}

	for(long unsigned int i = 0 ; i < threads.size() ; i++){
		threads[i].join();
	}

	std::vector<std::vector<std::string>> passwordFound;

	for(std::shared_ptr<Attack> atk : attacks){
		Attack* a = atk.get();
		passwordFound.push_back(a->getAllPasswordFound());
	}

	bool pwdFound = false;
	std::ofstream result;
	std::string resultTitle = "Output-Input/result.txt";
	result.open(resultTitle); 
	std::string pwd;

	if(result.is_open()){
		for(int i = 0 ; i < passwordFound[0].size() ; i++){
			for(std::vector<std::string> password : passwordFound){
				if(password[i] != "?"){
					pwdFound = true;
					//result << password[i] << std::endl;
					pwd = password[i];
					break;
				}
				else{
					pwdFound = false;
				}
			}
			if(pwdFound){
				result << pwd << std::endl;
			}
			else{result << "?" << std::endl;}
		}
		result.close();
	}
	else{
		std::cerr << "Error opening file Output-Input/result.txt" << std::endl;
	}


	end = std::chrono::system_clock::now();
    std::chrono::duration<double> elapsed_seconds = end - start;
	std::cout << elapsed_seconds.count() << std::endl;
}