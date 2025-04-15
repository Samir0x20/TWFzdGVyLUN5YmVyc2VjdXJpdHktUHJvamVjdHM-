#include "6bits-encoder.hpp"
#include <stdexcept>


uint64_t encodeStringToUint64(const std::string& input) {

    if (input.length() < 6 || input.length() > 10) {
        throw std::invalid_argument("Input string must be between 6 and 10 characters.");
    }

    uint64_t result = 0;

    for (size_t i = 0; i < input.length(); ++i) {
        char c = input[i];
        uint64_t value;

        // Map '0'-'9' to 0-9
        if (c >= '0' && c <= '9') {
            value = static_cast<uint64_t>(c - '0');
        }
        // Map 'A'-'Z' to 10-35
        else if (c >= 'A' && c <= 'Z') {
            value = static_cast<uint64_t>(c - 'A' + 10);
        }
        // Map 'a'-'z' to 36-61
        else if (c >= 'a' && c <= 'z') {
            value = static_cast<uint64_t>(c - 'a' + 36);
        }
        else {
            throw std::invalid_argument("Input string contains invalid characters. Allowed characters are a-z, A-Z, and 0-9.");
        }

        // Pack the 6-bit value into the result
        result |= (value << (6 * i));
    }

    return result;
}

std::string decodeUint64ToString(uint64_t encoded, size_t length) {

    if (length < 6 || length > 10) {
        throw std::invalid_argument("Length must be between 6 and 10.");
    }

    std::string result(length, ' ');

    for (size_t i = 0; i < length; ++i) {
        uint64_t mask = 0x3F; // Mask to extract 6 bits
        uint64_t value = (encoded >> (6 * i)) & mask;

        // Map the 6-bit value back to the corresponding character
        if (value <= 9) {
            result[i] = '0' + static_cast<char>(value);
        }
        else if (value <= 35) {
            result[i] = 'A' + static_cast<char>(value - 10);
        }
        else if (value <= 61) {
            result[i] = 'a' + static_cast<char>(value - 36);
        }
        else {
            throw std::invalid_argument("Encoded value contains invalid 6-bit segments.");
        }
    }

    return result;
}
