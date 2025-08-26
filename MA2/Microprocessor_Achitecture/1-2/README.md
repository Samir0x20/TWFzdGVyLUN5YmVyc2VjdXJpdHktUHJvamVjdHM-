## Goal

Lab 1-2 consiste of understanding the internal behaviour of a RISC processor. We are going to program in assembly code and watch this code running in simulation.

## Materials from the UV

- RISC 1-2
- RiSC-seq.pdf (for more details)
- RiSC16 Simulators.pdf (for more details)
- RiSC16_seq.jar (Simulator)

## Tips & commentaires

- `sw 3,1,0` It saves the value of R3 in Data Memory index=R1+0.
- `addi 1,1,1` It increase the index for the pointer/location in Data Memory.
- PC is the address of the current instruction that is being executed.
## Question

### Question 1: Explain what is the example on listing 1 on the preceding page doing? Detail the state of registers and the state of the PC after each instruction.

```
Listing1: Example code

            addi    2 ,0 ,1
            sw      2 ,1 ,0
            addi    1 ,1 ,1
            sw      2 ,1 ,0
            addi    1 ,1 ,1
            add     3 ,2 ,2
            sw      3 ,1 ,0
            addi    1 ,1 ,1
            addi    7 ,0 ,7
loop :      beq     7 ,0 , end
            lw      2 ,1 , -2
            add     3 ,3 ,2
            sw      3 ,1 ,0
            addi    1 ,1 ,1
            addi    7 ,7 , -1
            beq     0 ,0 , loop
end :       halt
```

The listing 1 example code cumputes the first 11th fibonacci sequence.

The R1 is the index in Data Memory. This is why it's incremented after each `sw` instruction as it saves the value in Data Memory

`addi   2,0,1` R2 = 0 (R0 contains constant value 0) + 1 = 1 / PC=0  
`addi   1,1,1` R1 = R1 + 1 = 1 / PC=2  
`addi   1,1,1` R1 = R1 + 1 = 2 / PC=4    
`add    3,2,2` R3 = R2 + R2 = 1 + 1 = 2 / PC=5    
`addi   1,1,1` R1 = R1 + 1 = 3 / PC=7    
`addi   7,0,7` R7 = R0 + 7 = 7 / PC=8  

In loop:

- 7
  ```
  `lw     2,1,-2` R2 = MEM[R1 - 2] = 1 / PC=10  
  `add    3,3,2` R3 = R3 + R2 = 2 + 1 = 3 / PC=11  
  `addi   1,1,1` R1 = R1 + 1 = 4 (index for the next number) / PC=13   
  `addi   7,7,1` R7 = R7 - 1 = 7 - 1 = 6 / PC=14  
  ```

- **6**  
  ```
  `lw     2,1,-2`   R2 = MEM[R1 - 2] = 2  / PC=10  
  `add    3,3,2`    R3 = R3 + R2 = 3 + 2 = 5  / PC=11  
  `addi   1,1,1`    R1 = R1 + 1 = 5 (index for the next number)  / PC=13  
  `addi   7,7,1`    R7 = R7 - 1 = 6 - 1 = 5  / PC=14  
  ```

- **5**  
  ```
  `lw     2,1,-2`   R2 = MEM[R1 - 2] = 3  / PC=10  
  `add    3,3,2`    R3 = R3 + R2 = 5 + 3 = 8  / PC=11  
  `addi   1,1,1`    R1 = R1 + 1 = 6 (index for the next number)  / PC=13  
  `addi   7,7,1`    R7 = R7 - 1 = 5 - 1 = 4  / PC=14  
  ```

- **4**  
  ```
  `lw     2,1,-2`   R2 = MEM[R1 - 2] = 5  / PC=10  
  `add    3,3,2`    R3 = R3 + R2 = 8 + 5 = 13  / PC=11  
  `addi   1,1,1`    R1 = R1 + 1 = 7 (index for the next number)  / PC=13  
  `addi   7,7,1`    R7 = R7 - 1 = 4 - 1 = 3  / PC=14  
  ```

- **3**  
  ```
  `lw     2,1,-2`   R2 = MEM[R1 - 2] = 8  / PC=10  
  `add    3,3,2`    R3 = R3 + R2 = 13 + 8 = 21  / PC=11  
  `addi   1,1,1`    R1 = R1 + 1 = 8 (index for the next number)  / PC=13  
  `addi   7,7,1`    R7 = R7 - 1 = 3 - 1 = 2  / PC=14  
  ```

- **2**  
  ```
  `lw     2,1,-2`   R2 = MEM[R1 - 2] = 13  / PC=10  
  `add    3,3,2`    R3 = R3 + R2 = 21 + 13 = 34  / PC=11  
  `addi   1,1,1`    R1 = R1 + 1 = 9 (index for the next number)  / PC=13  
  `addi   7,7,1`    R7 = R7 - 1 = 2 - 1 = 1  / PC=14  
  ```

- **1**  
  ```
  `lw     2,1,-2`   R2 = MEM[R1 - 2] = 21  / PC=10  
  `add    3,3,2`    R3 = R3 + R2 = 34 + 21 = 55  / PC=11  
  `addi   1,1,1`    R1 = R1 + 1 = 10 (index for the next number)  / PC=13  
  `addi   7,7,1`    R7 = R7 - 1 = 1 - 1 = 0  / PC=14  
  ````

- **0**

  It jumps to `end` since R7 = 0

### Question 2: Load exemple1.txt and run the simulation. Explain the internal behaviour for each instruction.  

**1. `addi 2,0,1`**  
  - `addi` (Add Immediate) adds an immediate value to a register.  
  - `R2 = R0 + 1` (since R0 is always 0 in RISC architectures, `R2 = 1`)  
  - **Internal Operations:**  
    - Fetch instruction.
    - Decode: Identify opcode (`addi`), source register (`R0`), destination register (`R2`), and immediate value (`1`).
    - Execute: Perform addition (`0 + 1`).
    - Store result in `R2`.

**2. `sw 2,1,0`**  
  - `sw` (Store Word) stores the value of `R2` into memory at the address in `R1 + 0`.  
  - `Mem[R1 + 0] = R2`  
  - **Internal Operations:**  
    - Fetch instruction.
    - Decode: Identify opcode (`sw`), source register (`R2`), base register (`R1`), and offset (`0`).
    - Compute memory address: `R1 + 0`.
    - Store `R2` in memory.

**3. `addi 1,1,1`**  
  - `R1 = R1 + 1`  
  - Increments `R1` by 1.  

**4. `sw 2,1,0`**  
  - Stores `R2` (which is `1`) in memory at `R1 + 0` (new value of `R1`).  

**5. `addi 1,1,1`**  
  - `R1 = R1 + 1`  

**6. `add 3,2,2`**  
  - `R3 = R2 + R2` → `R3 = 1 + 1 = 2`  
  - **Internal Operations:**  
    - Fetch instruction.
    - Decode opcode (`add`), source registers (`R2` and `R2`), destination register (`R3`).
    - Perform addition.
    - Store result in `R3`.

**7. `sw 3,1,0`**  
  - Stores `R3` (which is `2`) in memory at `R1 + 0`.  

**8. `addi 1,1,1`**  
  - `R1 = R1 + 1`  

**9. `addi 7,0,7`**  
  - `R7 = 7` (since `R0 = 0`)  
  - This initializes `R7` as a loop counter.

**Loop Execution**  

**10. `beq 7,0,end`**  
  - `beq` (Branch if Equal) checks if `R7 == 0`, and if so, jumps to `end`.  
  - Since `R7 = 7`, execution continues normally.

**11. `lw 2,1,-2`**  
  - `lw` (Load Word) loads data from memory at `R1 - 2` into `R2`.  
  - `R2 = Mem[R1 - 2]`  

**12. `add 3,3,2`**  
  - `R3 = R3 + R2` (accumulates values in `R3`).

**13. `sw 3,1,0`**  
  - Stores `R3` at `R1 + 0`.  

**14. `addi 1,1,1`**  
  - Increments `R1`.

**15. `addi 7,7,-1`**  
  - Decrements `R7` (loop counter).  

**16. `beq 0,0,boucle`**  
  - Since `R0` is always `0`, this is an unconditional jump back to `boucle`.  
  - The loop runs until `R7` becomes `0`.

**17. `halt`**  
  - Stops execution.

### Question 3: Using the graph in annexe 3 on page 13, draw the chronogram for the BEQ instruction. Signals on the graph are output of blocks of the processor

No clue  

### Question 4: Write a program which shifts to the left the content of reg5.
```
movi    5,5 // move the value 5 in the registry 5
add     5,5,5 //Shift R5 left by 1 (R5 = R5 * 2)
halt // stop the execution
```
Doubling the value is equivalent to shifting 1 bit to the left.

### Question 5: Write a program which extracts the most significant bit from reg1 and stores the value (0/1) in reg7.
```
    movi  1,5       // load 5 into R1
    movi  2,0x8000  // Load 0x8000 (MSB mask) into R2
    nand  4,1,2     // Perform NAND on R1 and R2
    nand  4,4,4     // NOT operation: Now R4 contains (R1 AND R2)
    beq   4,0,msb0  // If (R1 AND 0x8000) == 0, jump to msb0
    addi  7,0,1     // MSB is 1 -> Set R7 to 1
    halt

msb0:
    addi  7,0,0     // MSB is 0 -> Set R7 to 0
    halt
```

### Question 6: Write a program which shifts to the left a 32-bit value stored in reg6(MSB), reg5.
```
        movi    5,0xffff    //Load R5 with 0xFFFF (initial value for LSB)
        movi    6,0x0001    //Load R6 with 0x0001 (initial value for MSB)
        movi    4,0x8000    //Load R4 with 0x8000 (mask for MSB)
        nand    2,5,4
        nand    2,2,2
        beq     2,0,nocarry //If R2 == 0 then branch to nocarry
        movi    2,1         //Load R2 with 1. R2 contains the carry
        add     5,5,5       //Perform left shifting on R5
        add     6,6,6       //Perform left shifting on R6
        add     6,6,2       //Add the carry on R6
        halt
nocarry:
        add     5,5,5       //Perform left shifting on R5
        add     6,6,6       //Perform left shifting on R6
        halt
```



