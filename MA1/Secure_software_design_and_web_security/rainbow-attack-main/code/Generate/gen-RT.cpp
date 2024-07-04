#include <iostream>
#include <chrono>
#include "rainbow-table.hpp"

int main(int argc, char *argv[])
{
	if(argc != 4)
	{
		std::cerr << "Usage : \"gen-RT minSize maxSize nbReduction\", where" << std::endl
			<< "- minSize is the minimum number of chars allowed in an alphanumeric password," << std::endl
			<< "- maxSize is the maximum number of chars allowed in an alphanumeric password," << std::endl
			<< "- nbReduction is the lenght of the chain." << std::endl;	
		return 1;
	}

	
	int minSize = std::stoi(argv[1]);
	int maxSize = std::stoi(argv[2]);
	int nbReduction = std::stoi(argv[3]);


    std::chrono::time_point<std::chrono::system_clock> start, end;
	start = std::chrono::system_clock::now();

	std::vector<std::shared_ptr<Rainbow>> rainbows;
	std::vector<std::thread> threads;
	std::shared_ptr<Rainbow> rainbow;

	for(int size = minSize ; size < maxSize+1 ; size++){// creates a thread for each size of password
		rainbow = std::make_shared<Rainbow>(size, nbReduction);
		rainbows.push_back(rainbow);
		threads.push_back(std::thread(Rainbow::generate, rainbow.get()));
	}

	for(long unsigned int i = 0 ; i < threads.size() ; i++){// waits for all threads to finish
		threads[i].join();
	}

	end = std::chrono::system_clock::now();
    std::chrono::duration<double> elapsed_seconds = end - start;
	std::cout << elapsed_seconds.count() << std::endl;
    
    
}