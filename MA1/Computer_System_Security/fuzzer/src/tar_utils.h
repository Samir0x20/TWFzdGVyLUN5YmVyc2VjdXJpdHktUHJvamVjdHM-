#ifndef TAR_UTILS_H
#define TAR_UTILS_H

#include <stdbool.h>

/**
 * tar Header Block, from POSIX 1003.1-1990. 
 * Taken from https://www.gnu.org/software/tar/manual/html_node/Standard.html
*/

/* POSIX header.  */

struct tar_t
{                              /* byte offset */
    char name[100];               /*   0 */
    char mode[8];                 /* 100 */
    char uid[8];                  /* 108 */
    char gid[8];                  /* 116 */
    char size[12];                /* 124 */
    char mtime[12];               /* 136 */
    char chksum[8];               /* 148 */
    char typeflag;                /* 156 */
    char linkname[100];           /* 157 */
    char magic[6];                /* 257 */
    char version[2];              /* 263 */
    char uname[32];               /* 265 */
    char gname[32];               /* 297 */
    char devmajor[8];             /* 329 */
    char devminor[8];             /* 337 */
    char prefix[155];             /* 345 */
    char padding[12];             /* 500 */
};

#define TMAGIC   "ustar"        /* ustar and a null */
#define TMAGLEN  6
#define TVERSION "00"           /* 00 and no null */
#define TVERSLEN 2

/* Values used in typeflag field.  */
#define REGTYPE  '0'            /* regular file */
#define AREGTYPE '\0'           /* regular file */
#define LNKTYPE  '1'            /* link */
#define SYMTYPE  '2'            /* reserved */
#define CHRTYPE  '3'            /* character special */
#define BLKTYPE  '4'            /* block special */
#define DIRTYPE  '5'            /* directory */
#define FIFOTYPE '6'            /* FIFO special */
#define CONTTYPE '7'            /* reserved */

#define XHDTYPE  'x'            /* Extended header referring to the next file in the archive */
#define XGLTYPE  'g'            /* Global extended header */

/* Bits used in the mode field, values in octal.  */
#define TSUID    04000          /* set UID on execution */
#define TSGID    02000          /* set GID on execution */
#define TSVTX    01000          /* reserved */
                                /* file permissions */
#define TUREAD   00400          /* read by owner */
#define TUWRITE  00200          /* write by owner */
#define TUEXEC   00100          /* execute/search by owner */
#define TGREAD   00040          /* read by group */
#define TGWRITE  00020          /* write by group */
#define TGEXEC   00010          /* execute/search by group */
#define TOREAD   00004          /* read by other */
#define TOWRITE  00002          /* write by other */
#define TOEXEC   00001          /* execute/search by other */

#define BLOCK_SIZE 512

static char username[32];
static struct tar_t header;
static int success = 0;
static int MODES[] = {TSUID, TSGID, TSVTX, TUREAD, TUWRITE, TUEXEC, TGREAD, TGWRITE, TGEXEC, TOREAD, TOWRITE, TOEXEC};
static int TYPEFLAG[] = {REGTYPE, AREGTYPE, LNKTYPE, SYMTYPE, CHRTYPE, BLKTYPE, DIRTYPE, FIFOTYPE, CONTTYPE};
static char end_bytes[BLOCK_SIZE*2];


void getUserName();
void extraction(char *extractor);
unsigned int calculate_checksum(struct tar_t* header);
void save_tar(struct tar_t* header, char* content, int content_size, char* end_bytes_buffer, size_t end_size, bool chksum);
void default_header(struct tar_t* header);
void rm_extracted_file();

#endif