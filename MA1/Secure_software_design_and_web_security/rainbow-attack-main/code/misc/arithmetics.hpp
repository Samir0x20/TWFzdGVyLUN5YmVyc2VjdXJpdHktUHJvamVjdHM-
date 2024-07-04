#ifndef ARITHMETICS_H
#define ARITHMETICS_H

#include <concepts>

namespace rainbow {

/**
 * A concept for any "real" number
 */
template<class T>
concept Real = std::integral<T> || std::floating_point<T>;

/**
 * A concept for any natural number
 */
template<class T>
concept Natural = std::unsigned_integral<T>;

/**
 * Computes b^e using the fast exponentiation algorithm.
 * @brief Computes b^e.
 * @param b the base
 * @param e the exponent
 * @return b^2
 */
template<Real Number, Natural N>
Number pow(Number b, N e);

template<Natural N>
N factorial(N n);

template<Real Number, Natural N>
Number pow(Number base, N exp)
{
    if(exp == 0)
        return 1;
    else if(exp == 1)
        return base;
    else if(exp % 2 == 0)
        return pow(base * base, exp / 2);
    else
        return base * pow(base * base, exp / 2);
}

template<Natural N>
N factorial(N n)
{
    unsigned prod = 1;
    while(n > 0)
    {
        prod *= n;
        n--;
    }
}

}
#endif // ARITHMETICS_H
