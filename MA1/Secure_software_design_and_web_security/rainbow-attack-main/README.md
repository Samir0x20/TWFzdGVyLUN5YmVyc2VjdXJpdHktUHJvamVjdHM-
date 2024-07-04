# Authors

* **[Samir Azmar 000503446](https://gitlab.com/sazmar18)**
* **[Tiago Fernandes Do Rosario 000502627](https://gitlab.com/tifernan)**
* **[Salma Mekarnia 000494648](https://gitlab.com/Smekarni)**
* **[Naim Boussaid 000495297](https://gitlab.com/nboussai)**

# Homework : Rainbow attack

Program that creates rainbow tables and can do attacks using them

# Ubuntu version

Ubuntu 22.04

# Prebuild

To build generator and attack, you need to go to code folder using `cd` command (`cd code`). 

# Compilation generator 

To compile the generator program, type `make` command that will create an executable using the makefile provided in the code folder. If the executable already exists, you can clean the folder by typing `make clean`. 

# Execution generator password

To generate the password, type the following command in a shell `./gen-passwd.out 6000000 6 10 Output-Input/password.txt Output-Input/passwordHash.txt`

-6000000 is the number of password.\
-6 to 10 is the range of password lenght.\
-Output/password.txt is the file path where the password will be stored.\
-Output/passwordHash.txt is the file path where the hashes of password are stored.


# Execution generator rainbow table

To generate the rainbow table, type the following command in a shell `./gen-RT.out 6 10 10000`

-6 to 10 is the range of password lenght.\
-10000 is the lenght of the chain.\

Each threads are used for each rainbow tables. If one rainbow table is generated only one thread will be used.


# Execution crack

To generate the rainbow attack, type the following command in a shell `./gen-Attack.out 6 10 10000 Output-Input/passwordHash.txt`

-6 to 10 is the range of password lenght.\
-10000 is the lenght of the chain.\
-Output/passwordHash.txt is the file path where the hashes, to crack, are stored.


