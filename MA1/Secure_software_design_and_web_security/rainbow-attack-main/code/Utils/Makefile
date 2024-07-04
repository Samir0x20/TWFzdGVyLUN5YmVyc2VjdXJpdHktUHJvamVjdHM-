FLAG=-g -Wall -std=c++17 

all: check_passwd.out

check_passwd.out: ../sha256.cpp check-passwd.cpp passwd-utils.hpp random.hpp
	g++ $(FLAG) -o check-passwd.out ../sha256.cpp check-passwd.cpp passwd-utils.hpp random.hpp
	
clean:
	rm -rf ./*.out