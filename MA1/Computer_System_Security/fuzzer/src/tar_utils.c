#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/stat.h>
#include <fcntl.h>

#include "tar_utils.h"

/**
 * Function to get the current username of the user.
 */
void getUserName(){
    char* name = getlogin();
    sprintf(username, name, sizeof(name));
    username[32] = '\0';
}

/**
 * Function to perfome the extraction on "archive.tar".
 * @param extractor Path of the the extractor being fuzzed.
 */
void extraction(char *extractor){
    
    int rv = 0;
    char cmd[51];
    strncpy(cmd, extractor, 25);
    cmd[26] = '\0';
    strncat(cmd, " archive.tar", 25);
    char buf[33];
    FILE *fp;

    if ((fp = popen(cmd, "r")) == NULL) {
        printf("Error opening pipe!\n");
        return;
    }

    if(fgets(buf, 33, fp) == NULL) {
        printf("No output\n");
        goto finally;
    }

    if(strncmp(buf, "*** The program has crashed ***\n", 33)) {
        printf("Not the crash message\n");
        goto finally;
    } else {
        printf("Crash message\n");

        // Rename file when it crashes
        char success_name[100];
        snprintf(success_name, 100, "success_archive%d.tar", success);
        rename("archive.tar", success_name);
        success++;
        goto finally;
    }

    finally:
    if(pclose(fp) == -1) {
        printf("Command not found\n"); 
    }
}


/**
 * Computes the checksum for a tar header and encode it on the header.
 * @param header: The tar header.
 * @return the value of the checksum.
 */
unsigned int calculate_checksum(struct tar_t* header){
    // use spaces for the checksum bytes while calculating the checksum
    memset(header->chksum, ' ', 8);

    // sum of entire metadata
    unsigned int check = 0;
    unsigned char* raw = (unsigned char*) header;
    for(int i = 0; i < 512; i++){
        check += raw[i];
    }

    snprintf(header->chksum, sizeof(header->chksum), "%06o0", check);

    header->chksum[6] = '\0';
    header->chksum[7] = ' ';
    return check;
}

/**
 * Function to save tar header to archive.tar.
 * @param header Tar header.
 * @param content Content to write into the tar file.
 * @param content_size Size of the content.
 * @param end_bytes_buffer End-of-archive entry.
 * @param end_size Size of end bytes buffer.
 * @param chksum Boolean to determine if we calculate checksum.
 */
void save_tar(struct tar_t* header, char* content, int content_size, char* end_bytes_buffer, size_t end_size, bool chksum) {
    
    system("rm -f archive.tar");

    FILE* file = fopen("archive.tar", "w");

    
    if (file != NULL) {

        snprintf(header->size, sizeof(header->size), "%011o", content_size);

        if(chksum){
            calculate_checksum(header);
        }
        
        fwrite(header, sizeof(struct tar_t), 1, file);

        fwrite(content, content_size, 1, file);
        
        fwrite(end_bytes_buffer, end_size, 1, file);

        fclose(file);
    }
}

/**
 * Function to set default value into header fields.
 * @param header Tar header.
 */
void default_header(struct tar_t *header){
    getUserName();

    memset(header, 0, sizeof(struct tar_t));

    sprintf(header->name, "normal.txt");
    sprintf(header->mode, "0007777");
    sprintf(header->uid, "0000000");
    sprintf(header->gid, "0000000");
    sprintf(header->size, "00000000000");
    sprintf(header->mtime, "14565412572");
    header->typeflag = REGTYPE;
    sprintf(header->magic, TMAGIC);
    sprintf(header->version, TVERSION);
    sprintf(header->uname, username);
    sprintf(header->gname, username);
}


/**
 * Function to remove the file that was extracted from "archive.tar"
 * @param header Tar header.
 */
void rm_extracted_file(struct tar_t *header){

    char command[256];
    char filename[100]; 
    strncpy(filename, header->name, sizeof((header->name)));
    if (access(filename, F_OK) != -1){
        snprintf(command, sizeof(command), "rm -f %s", filename);
        system(command);
    }
}

