#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>
#include <stdio.h>
#include <math.h>

#include "fuzzer.h"
#include "tar_utils.h"

/**
 * Function to test field that terminate with a null character.
 * @param extractor Path of the extractor being fuzzed.
 * @param field_name Field in the header we wish to fill.
 * @param character Character to use to fill the field with.
 * @param size Space within the field to fill.
 * @param content Data to add when saving the tar.
 * @param chksum Boolean to determine if we calculate checksum.
 */
void terminated_field_tester(char* extractor, char* field_name, char character, int size, char* content, bool chksum){
    default_header(&header);
    memset(field_name, character, size-1);
    field_name[size] = '\0';
    save_tar(&header, content, strlen(content), end_bytes, BLOCK_SIZE*2, chksum);
    extraction(extractor);
    rm_extracted_file(&header);
}

/**
 * Function to test a header with the wrong time.
 * @param extractor Path of the extractor being fuzzed.
 * @param time The time the field will be set to.
 */
void wrong_time_tester(char* extractor, int time){
    memset(header.mtime, 0, 12);
    snprintf(header.mtime, 12, "%o", time);
    save_tar(&header, content1, strlen(content1), end_bytes, BLOCK_SIZE*2, true);
    extraction(extractor);
    rm_extracted_file(&header);
    default_header(&header);
}

 /**
 * Function to test a header with an impossible time.
 * @param extractor Path of the extractor being fuzzed.
 * @param time The time the field will be set to.
 */
void impossible_time_tester(char* extractor, char time){
    memset(header.mtime, 0, 12);
    snprintf(header.mtime, 12, "%o", time);
    save_tar(&header, content1, strlen(content1), end_bytes, BLOCK_SIZE*2, true);
    extraction(extractor);
    rm_extracted_file(&header);
    default_header(&header);
}

/**
 * Function to test an empty header field.
 * @param extractor Path of the extractor being fuzzed.
 * @param field_name Field in the header we wish to fill.
 * @param size Space within the field to fill.
 * @param content Data to add when saving the tar.
 * @param chksum Boolean to determine if we calculate checksum.
 */
void empty_field_tester(char* extractor,char* field_name ,int size, char* content, bool chksum){
    default_header(&header);
    strncpy(field_name, content1, size);
    field_name[size] = '\0';
    save_tar(&header, content, strlen(content), end_bytes, BLOCK_SIZE*2, chksum);
    extraction(extractor);
    rm_extracted_file(&header);
}

/**
 * Function to test header field without '\0'.
 * @param extractor Path of the extractor being fuzzed.
 * @param field_name Field in the header we wish to fill.
 * @param character Character to use to fill the field with.
 * @param size Space within the field to fill.
 * @param content Data to add when saving the tar.
 * @param chksum Boolean to determine if we calculate checksum.
 */
void non_terminated_field_tester(char* extractor,char* field_name , char character, int size, char* content, bool chksum){
    default_header(&header);
    memset(field_name, character, size);
    save_tar(&header, content, strlen(content), end_bytes, BLOCK_SIZE*2, chksum);
    extraction(extractor);
    rm_extracted_file(&header);
}


/**
 * Function calling the tests that can be appied to all fields.
 * @param extractor Path of the extractor being fuzzed.
 * @param field_name Field in the header we wish to fill.
 * @param size Space within the field to fill.
 * @param content Data to add when saving the tar.
 * @param chksum Boolean to determine if we calculate checksum.
 */
void general_test(char* extractor, char* field_name, int size, char* content, bool chksum){
    
    printf("\nTest empty field :\n");
    empty_field_tester(extractor, field_name, size, content, chksum);

    printf("\nTest non null terminated :\n");
    non_terminated_field_tester(extractor, field_name, 'A', size, content, chksum);

    printf("\nTest terminated in the middle ASCII :\n");
    terminated_field_tester(extractor, field_name, 'A', size/2, content, chksum);

    printf("\nTest terminated in the middle octal:\n");
    terminated_field_tester(extractor, field_name, '0', size/2, content, chksum);
   
    printf("\nTest all ASCII value :\n");
    terminated_field_tester(extractor, field_name, 'A', size, content, chksum);

    printf("\nTest non ASCII value :\n");
    terminated_field_tester(extractor, field_name, NON_ASCII_CHARS[0], size, content, chksum);
    
    printf("\nTest non octal :\n");
    terminated_field_tester(extractor, field_name, '9', size, content, chksum);

    printf("\nTest with 0's :\n");
    terminated_field_tester(extractor, field_name, 0, size, content, chksum);

}

/**
 * Function that tests the name field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_name(char* extractor){
    printf("\n-------------FUZZING ON NAME FIELD-------------\n");
    
    general_test(extractor, header.name, 100, content1, true);
    
}

/**
 * Function that tests the mode field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_mode(char* extractor){
    printf("\n-------------FUZZING ON MODE FIELD-------------\n");

    general_test(extractor, header.mode, 8, content1, true);

    default_header(&header);

    printf("\nTest all mode :\n");
    for(int i = 0; i < 12; i++){ // tests all possible modes for mode field
        //write the value of MODES[i] to mode field using the format "%07o" which mean that it will write zero's to complet the space of mode field
        snprintf(header.mode, 8, "%07o", MODES[i]);
        save_tar(&header, content1, strlen(content1), end_bytes, BLOCK_SIZE*2, true);
        extraction(extractor);
    }
    rm_extracted_file(&header);
    default_header(&header);

    printf("\nTest mode 0000 :\n");
    memset(header.mode, '0', 8);
    save_tar(&header, content1, strlen(content1), end_bytes, BLOCK_SIZE*2, true);
    extraction(extractor);

}

/**
 * Function that tests the gid field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_gid(char* extractor){
    printf("\n-------------FUZZING ON GID FIELD-------------\n");

    general_test(extractor, header.gid, 8, content1, true);

}

/**
 * Function that tests the uid field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_uid(char* extractor){
    printf("\n-------------FUZZING ON UID FIELD-------------\n");

    general_test(extractor, header.uid, 8, content1, true);
}

/**
 * Function that tests the size field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_size(char* extractor){
    printf("\n-------------FUZZING ON SIZE FIELD-------------\n");

    general_test(extractor, header.size, 12, content1, true);

    default_header(&header);

    int size[] = {-1, 0, 1, 10, 100000};

    printf("\nTest incorrect size without content:\n");
    for (int i = 0; i < 5; ++i) { // tests size field by cycling through different wrong values
        //write the value of size[i] to size field using the format "%011o" which mean that it will write zero's to complet the space of size field
        save_tar(&header, content1, size[i], end_bytes, BLOCK_SIZE*2, true);
        extraction(extractor);
    }
    rm_extracted_file(&header);

    printf("\nTest incorrect size with content:\n");
    for (int i = 0; i < 5; ++i) { // tests size field by cycling through different wrong values
        //write the value of size[i] to size field using the format "%011o" which mean that it will write zero's to complet the space of size field
        save_tar(&header, content2, size[i], end_bytes, BLOCK_SIZE*2, true);
        extraction(extractor);
    }
    rm_extracted_file(&header);
}

/**
 * Function that tests the mtime field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_mtime(char* extractor){
    printf("\n-------------FUZZING ON MTIME FIELD-------------\n");

    general_test(extractor, header.mtime, 12, content1, true);
   
    default_header(&header);

    printf("\nTest 1 year in the future :\n");
    wrong_time_tester(extractor, (int) time(NULL) + 536000);
   
    printf("\nTest 1 year in the past :\n");
    wrong_time_tester(extractor, (int) time(NULL) - 536000);
   
    printf("\nTest no time :\n");
    impossible_time_tester(extractor, '0');

    printf("\nTest negative time :\n");
    impossible_time_tester(extractor, '-1');
    
}

/**
 * Function that tests the checksum field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_chksum(char* extractor){
    printf("\n-------------FUZZING ON CHECKSUM FIELD-------------\n");

    general_test(extractor, header.chksum, 8, content1, false);

    default_header(&header);

    int size[] = {-1, 0, 1, 10, 100000};

    printf("\nTest incorrect chksum :\n");
    for (int i = 0; i < 5; ++i) {// tests chksum field by cycling through different wrong values
        //write the value of size[i] to chksum field using the format "%011o" which mean that it will write zero's to complet space of chksum field
        snprintf(header.chksum, 8, "%07o", size[i]);
        save_tar(&header, content1, strlen(content1), end_bytes, BLOCK_SIZE*2, false);
        extraction(extractor);
    }
    rm_extracted_file(&header);
}

/**
 * Function that tests the typeflag field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_typeflag(char* extractor){
    printf("\n-------------FUZZING ON TYPEFLAG FIELD-------------\n");

    default_header(&header);

    printf("\nTest all ASCII :\n");
    for (int i = 0; i < 256; ++i) {
        header.typeflag = (char)i;
        save_tar(&header, content1, strlen(content1), end_bytes, BLOCK_SIZE*2, true);
        extraction(extractor);
    }


    printf("\nTest non ASCII :\n");
    for (int i = 0; i < sizeof(NON_ASCII_CHARS); ++i) {
        header.typeflag = NON_ASCII_CHARS[i];
        save_tar(&header, content1, strlen(content1), end_bytes, BLOCK_SIZE*2, true);
        extraction(extractor);    
    }

    printf("\nTest non DIRTYPE with '/' in the name field:\n");
    char fileName[] = "directory/"; 
    strncpy(header.name, fileName, sizeof(fileName));
    for (int i = 0; i < 9; ++i) {
        if(TYPEFLAG[i] != DIRTYPE){
            header.typeflag = TYPEFLAG[i];
            save_tar(&header, content1, strlen(content1), end_bytes, BLOCK_SIZE*2, true);
            extraction(extractor);   
        } 
    }

    default_header(&header);
    printf("\nTest all typeflag with content:\n");
    for (int i = 0; i < 9; ++i) {
        header.typeflag = TYPEFLAG[i];
        save_tar(&header, content2, sizeof(content2), end_bytes, BLOCK_SIZE*2, true);
        extraction(extractor);   
        
    }
}

/**
 * Function that tests the linkname field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_linkname(char* extractor){
    printf("\n-------------FUZZING ON LINKNAME FIELD-------------\n");

    general_test(extractor, header.linkname, 99, content1, true);
    general_test(extractor, header.linkname, 99, content2, true);

    default_header(&header);
    
    printf("\nTest link to himself :\n");
    snprintf(header.linkname, 100, "normal.txt");
    save_tar(&header, content1, sizeof(content1), end_bytes, BLOCK_SIZE*2, true);
    extraction(extractor); 
}

/**
 * Function that tests the version field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_version(char* extractor){
    printf("\n-------------FUZZING ON VERSION FIELD-------------\n");
    
    general_test(extractor, header.version, 2, content1, true);

    default_header(&header);

    char version[] = TVERSION;
    printf("\nTest all combinations of octal values:\n");//TODO make a list of all separators
    for (int i = 0; i < 8; i++) { // tests version by cycling through combinations of octal values 
        for (int j = 0; j < 8; j++) {
            version[0] = i + '0';
            version[1] = j + '0';
            
            strncpy(header.version, version, TVERSLEN);
            save_tar(&header, content1, strlen(content1), end_bytes, BLOCK_SIZE*2, true);
            extraction(extractor);
        }
    }
    rm_extracted_file(&header);
}

/**
 * Function that tests the magic field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_magic(char* extractor){
    printf("\n-------------FUZZING ON MAGIC FIELD-------------\n");
    
    general_test(extractor, header.magic, 6, content1, true);

    default_header(&header);

    printf("\nTest GNU magic :\n");
    snprintf(header.magic, 6, "ustar\0 ");
    save_tar(&header, content1, sizeof(content1), end_bytes, BLOCK_SIZE*2, true);
    extraction(extractor); 
}

/**
 * Function that tests the gname field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_gname(char* extractor){
    printf("\n-------------FUZZING ON GNAME FIELD-------------\n");

    general_test(extractor, header.gname, 32, content1, true);

}

/**
 * Function that tests the uname field of the header.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_uname(char* extractor){
    printf("\n-------------FUZZING ON UNAME FIELD-------------\n");
    
    general_test(extractor, header.uname, 32, content1, true);

}

/**
 * Function that tests the end-of-archive of the archive.tar.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzz_end_block(char* extractor){
    printf("\n-------------FUZZING ON END BLOCK-------------\n");

    int size_end_block[] = {0, (BLOCK_SIZE*3), (BLOCK_SIZE*2)-1, BLOCK_SIZE-1, BLOCK_SIZE};

    printf("\ntest end bytes block without content :\n");
    for(int i = 0; i < 5; i++){//test the end-of-archive with different block
        char end_bytes2[size_end_block[i]];
        memset(end_bytes2, 0, size_end_block[i]);
        default_header(&header);
        save_tar(&header, content1, strlen(content1), end_bytes2, size_end_block[i], true);
        extraction(extractor);
    }

    printf("\ntest end bytes block with content :\n");
    for(int i = 0; i < 5; i++){//test the end-of-archive with different block with content
        char end_bytes2[size_end_block[i]];
        memset(end_bytes2, 0, size_end_block[i]);
        default_header(&header);
        snprintf(header.size, 12, "%011o", sizeof(content1));
        save_tar(&header, content2, sizeof(content2), end_bytes2, size_end_block[i], true);
        extraction(extractor);
    }
    rm_extracted_file(&header);
}

/**
 * Function that tests the extractor by calling all the others tests.
 * @param extractor Path of the extractor being fuzzed
 */
void fuzzer(char* extractor){

    memset(end_bytes, 0, BLOCK_SIZE*2);
    getUserName();

    fuzz_name(extractor);
    fuzz_mode(extractor);
    fuzz_gid(extractor);
    fuzz_uid(extractor);
    fuzz_size(extractor);
    fuzz_mtime(extractor);
    fuzz_chksum(extractor);
    fuzz_typeflag(extractor);
    fuzz_linkname(extractor);
    fuzz_magic(extractor);
    fuzz_version(extractor);
    fuzz_gname(extractor);
    fuzz_uname(extractor);
    fuzz_end_block(extractor);
}