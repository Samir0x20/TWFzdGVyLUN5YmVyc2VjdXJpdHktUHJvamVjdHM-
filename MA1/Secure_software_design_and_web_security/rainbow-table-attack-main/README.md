# Rainbow attack


## Membres
- Samir Azmar: 000503446
- Marcus Chrétien: 000498327
- Elric Deroeux: 000596621
- Hugo Lefebvre: 000524628
- Quentin Lévêque: 000595895

## Prerequisites
- make sure to have `make` and `g++` installed, if not you can install them by running: `sudo apt install make g++`.

## Build the project
- You can build everything in one command by running `make`. Or you can build manually, using the following command:

- To build the script used to generate the rainbow table, run `make generate_table`.

- To build the script used to crack passwords with a rainbow table, run `make crack_password`.

## Running the project
### Generate the rainbow table
- The table will be store in the `output` directory, so make sure it exists by typing `mkdir output`.
- Run the following command to generate a table `./generate_table.out <password_length> <file_size> <reduction_number>`, and change the parameters: 
    - `password_length`: the password length
    - `file_size`: the file size in Gb of the final RainbowTable file, it's an approximation, it will be less than the given size.
    - `reduction_number`: the number of reductions to apply / the longeur of the chain.

- If you want to stop the generation before the end, you can CTRL+C, it will stop the generation of new row. But you will have to wait for the table to sort (in our test it was never more than 10 minutes). The file will be store in the `output` directory and it name will have `*-incomplete.bin` at the end. 

- You can see the progress of the program after the first percentage, and the average time per %.

- And just for reference, here is a run of the script we did on a limited laptop:
    - Password of size 6: `./generate_table.out 6 12 300` -> it took 8h

### Cracking hashes
- Run the following command to crack the provided hashes `./crack_password.out <password_length> <reduction_number> <if_table> <if_hash> <of_pwd>`, and change the parameters with:
    - `password_length` is the number of chars in an alphanumeric password,
    - `reduction_number` is the number of reduction to apply in the chain,
    - `if_table` is the name of the input file where the rainbow table is stored,
    - `if_hash` is the name of the input file where the sha-256 hashes of the passwords are stored,
    - `of_pwd` is the name of the output file where the cracked passwords will be stored.




