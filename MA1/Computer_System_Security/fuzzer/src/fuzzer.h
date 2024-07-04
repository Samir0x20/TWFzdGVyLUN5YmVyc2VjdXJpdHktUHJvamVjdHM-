#ifndef FUZZER_H
#define FUZZER_H

#include <stdbool.h>

static char NON_ASCII_CHARS[] = {'ö', 'β', 'ж', '∑', '¥', '😀', '↑', '│', '◆'};
static char seperators[] = {'/', ';', ':', '|', ',', '.', '[', ']', '-'};
static char content1[] = "";
static char content2[] = "hello";

void wrong_time_tester(char* extractor, int time);
void impossible_time_tester(char* extractor, char time);
void terminated_field_tester(char* extractor, char* field_name, char character, int size, char* content, bool chksum);
void empty_field_tester(char* extractor,char* field_name ,int size, char* content, bool chksum);
void non_terminated_field_tester(char* extractor,char* field_name , char character, int size, char* content, bool chksum);

void general_test(char* extractor, char* field_name, int size, char* content, bool chksum);
void fuzz_name(char *extractor);
void fuzz_mode(char *extractor);
void fuzz_gid(char *extractor);
void fuzz_uid(char *extractor);
void fuzz_size(char *extractor);
void fuzz_mtime(char *extractor);
void fuzz_chksum(char *extractor);
void fuzz_typeflag(char *extractor);
void fuzz_linkname(char *extractor);
void fuzz_magic(char *extractor);
void fuzz_version(char *extractor);
void fuzz_gname(char *extractor);
void fuzz_uname(char *extractor);
void fuzz_end_block(extractor);
void fuzzer(char *extractor);

#endif