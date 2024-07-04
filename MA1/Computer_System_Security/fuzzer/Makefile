CC = gcc

TARGET = fuzzer
SRC = ./src/main.c ./src/fuzzer.c ./src/tar_utils.c

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) -o $(TARGET) $(SRC) 

clean:
	rm -f $(TARGET)
	rm -f *.tar
	rm -f *.txt