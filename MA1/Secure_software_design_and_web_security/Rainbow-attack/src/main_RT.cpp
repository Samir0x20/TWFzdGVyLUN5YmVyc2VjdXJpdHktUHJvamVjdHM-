#include <iostream>
#include <chrono>
#include "RT.hpp"

int main(int argc, char *argv[])
{
	if(argc != 4)
	{
		std::cerr << "Usage : \"gen-RT lenght size nbReduction\", where" << std::endl
			<< "- lenght is the number of chars in an alphanumeric password," << std::endl
			<< "- size is the size of a file in GigaBytes," << std::endl
			<< "- nbReduction is the lenght of the chain." << std::endl;	
		return 1;
	}

	
	int lenght = std::stoi(argv[1]);
	double size = std::stod(argv[2]);
	int nbReduction = std::stoi(argv[3]);


    std::chrono::time_point<std::chrono::system_clock> start, end;
	start = std::chrono::system_clock::now();

	Rainbow rainbow(lenght, size, nbReduction);
	rainbow.generate();

	end = std::chrono::system_clock::now();
    std::chrono::duration<double> elapsed_seconds = end - start;
	std::cout << elapsed_seconds.count() << std::endl;
    
    
}
