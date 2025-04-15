#ifndef INC_6BITS_ENCODER_HPP
#define INC_6BITS_ENCODER_HPP

#include <string>
#include <cstdint>


// Function to encode a string into a uint64_t
uint64_t encodeStringToUint64(const std::string& input);

// Function to decode a uint64_t back into a string
std::string decodeUint64ToString(uint64_t encoded, size_t length);


#endif //INC_6BITS_ENCODER_HPP
