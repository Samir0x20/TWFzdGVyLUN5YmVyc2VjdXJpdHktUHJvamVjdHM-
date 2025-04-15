# Compiler flags
FLAG=-g -Wall -std=c++17

# Default target: Build all four executables
all: gen-passwd.out check_passwd.out main_RT.out

# Rule to build gen-passwd.out
gen-passwd.out: utils/sha256.cpp utils/gen-passwd.cpp utils/passwd-utils.hpp utils/random.hpp
	g++ $(FLAG) -o gen-passwd.out utils/sha256.cpp utils/gen-passwd.cpp utils/random.hpp utils/passwd-utils.hpp

# Rule to build check_passwd.out
check_passwd.out: utils/sha256.cpp utils/check-passwd.cpp utils/passwd-utils.hpp utils/random.hpp
	g++ $(FLAG) -o check-passwd.out utils/sha256.cpp utils/check-passwd.cpp utils/passwd-utils.hpp utils/random.hpp

# Rule to build gen-RT.out
main_RT.out: utils/sha256.cpp src/main_RT.cpp src/RT.cpp src/RT.hpp
	g++ $(FLAG) -o main_RT.out utils/sha256.cpp src/main_RT.cpp src/RT.cpp src/RT.hpp

# Rule to clean up generated .out files
clean:
	rm -rf ./*.out
