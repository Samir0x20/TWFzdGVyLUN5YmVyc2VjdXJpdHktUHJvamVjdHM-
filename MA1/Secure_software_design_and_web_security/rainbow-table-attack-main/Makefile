# Compiler flags
FLAG=-g -Wall -std=c++17 -O3 -march=native

# Default target: Build all four executables
all: gen-passwd check_passwd generate_table crack_password

# Rule to build gen-passwd.out
gen-passwd: utils/sha256.cpp utils/gen-passwd.cpp
	g++ $(FLAG) -o gen-passwd.out utils/sha256.cpp utils/gen-passwd.cpp 

# Rule to build check_passwd.out
check_passwd: utils/sha256.cpp utils/check-passwd.cpp
	g++ $(FLAG) -o check-passwd.out utils/sha256.cpp utils/check-passwd.cpp 

# Rule to build generate_table.out
generate_table: utils/sha256.cpp src/main_RT.cpp src/RainbowTable.cpp src/RainbowTable.hpp utils/6bits-encoder.cpp utils/6bits-encoder.hpp
	g++ $(FLAG) -o generate_table.out utils/sha256.cpp src/main_RT.cpp src/RainbowTable.cpp utils/6bits-encoder.cpp

# Rule to build crack_password.out
crack_password: src/crack_password.cpp utils/sha256.h utils/sha256.cpp utils/6bits-encoder.hpp utils/6bits-encoder.cpp
	g++ $(FLAG) -o crack_password.out src/crack_password.cpp utils/sha256.cpp utils/6bits-encoder.cpp

# Rule to clean up generated .out files
clean:
	rm -rf ./*.out
	