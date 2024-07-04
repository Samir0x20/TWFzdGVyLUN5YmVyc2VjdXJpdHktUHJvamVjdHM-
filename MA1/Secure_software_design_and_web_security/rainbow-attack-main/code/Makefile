# Compiler flags
FLAG=-g -Wall -std=c++17

# Default target: Build all four executables
all: gen-passwd.out gen-RT.out check_passwd.out gen-Attack.out

# Rule to build gen-passwd.out
gen-passwd.out: Utils/sha256.cpp Utils/gen-passwd.cpp Utils/passwd-utils.hpp Utils/random.hpp
	g++ $(FLAG) -o gen-passwd.out Utils/sha256.cpp Utils/gen-passwd.cpp Utils/random.hpp Utils/passwd-utils.hpp

# Rule to build gen-RT.out
gen-RT.out: Utils/sha256.cpp Generate/gen-RT.cpp Generate/rainbow-table.cpp Generate/rainbow-table.hpp
	g++ $(FLAG) -o gen-RT.out Utils/sha256.cpp Generate/gen-RT.cpp Generate/rainbow-table.cpp Generate/rainbow-table.hpp

# Rule to build check_passwd.out
check_passwd.out: Utils/sha256.cpp Utils/check-passwd.cpp Utils/passwd-utils.hpp Utils/random.hpp
	g++ $(FLAG) -o check-passwd.out Utils/sha256.cpp Utils/check-passwd.cpp Utils/passwd-utils.hpp Utils/random.hpp

# Rule to build attack.out
gen-Attack.out: Utils/sha256.cpp Attack/attack.cpp Attack/attack.hpp Attack/gen-Attack.cpp
	g++ $(FLAG) -o gen-Attack.out Utils/sha256.cpp Attack/attack.cpp Attack/attack.hpp Attack/gen-Attack.cpp

# Rule to clean up generated .out files
clean:
	rm -rf ./*.out

	
	
