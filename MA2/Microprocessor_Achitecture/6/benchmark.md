<!-- Benchmark both solutions and compare their performance.
Comment on the expected acceleration factor, the actual results, the difference between debug and release compilation, etc. -->

# SIMD Acceleration Benchmark Report

## Benchmark Methodology
- Tested C and SIMD implementations
- Two build configurations:
  - **Debug**: `-O0` optimization flag
  - **Release**: `-O2` optimization flag
- Executed each program 10 times per image
- Calculated average execution time
- Hardware: AMD Ryzen 5 5600X, 16GB RAM, Windows 11

## Results Summary

### Absolute Times (ms)

| Image               | Dimensions | Debug C | Debug SIMD | Release C | Release SIMD |
|---------------------|------------|---------|------------|-----------|--------------|
| kid.raw            | 512×512    | 1.8342  | 0.3031     | 0.5825    | 0.1717       |
| Amelia_256x256.raw | 256×256    | 0.1515  | 0.0372     | 0.0497    | 0.0201       |
| Angela_512x512.raw | 512×512    | 0.4969  | 0.0726     | 0.2221    | 0.0433       |
| Ken_512x512.raw    | 512×512    | 0.5050  | 0.0826     | 0.2331    | 0.0524       |
| Quentin_512x512.raw| 512×512    | 0.5622  | 0.0911     | 0.2327    | 0.0460       |
| parrots_512x256.raw| 512×256    | 0.2538  | 0.0489     | 0.1036    | 0.0306       |
| Escher.raw         | 512×512    | 1.9718  | 0.2569     | 0.6326    | 0.1702       |

### Speedup Factors

| Image               | Debug Speedup | Release Speedup | Release vs Debug (C) | Release vs Debug (SIMD) |
|---------------------|---------------|-----------------|----------------------|-------------------------|
| kid.raw            | 6.05×         | 3.39×           | 3.15× faster         | 1.77× faster            |
| Amelia_256x256.raw | 4.07×         | 2.47×           | 3.05× faster         | 1.85× faster            |
| Angela_512x512.raw | 6.84×         | 5.13×           | 2.24× faster         | 1.68× faster            |
| Ken_512x512.raw    | 6.11×         | 4.45×           | 2.17× faster         | 1.58× faster            |
| Quentin_512x512.raw| 6.17×         | 5.06×           | 2.42× faster         | 1.98× faster            |
| parrots_512x256.raw| 5.19×         | 3.39×           | 2.45× faster         | 1.60× faster            |
| Escher.raw         | 7.68×         | 3.72×           | 3.12× faster         | 1.51× faster            |

<!-- Remarks -->
### Notes:
- Debug Speedup = Debug C / Debug SIMD
- Release Speedup = Release C / Release SIMD
- Release vs Debug (C) = Release C / Debug C
- Release vs Debug (SIMD) = Release SIMD / Debug SIMD

## Performance Analysis

### Key Observations

1. **SIMD Efficiency**:
   - Debug builds show higher speedup factors (4.07-7.68×) than release builds (2.47-5.13×)
   - Explained by the fact that C code benefits more from compiler optimizations (see [O2 Documentation](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html#index-O2) )

2. **Compiler Optimization Impact**:
   - `-O2` optimizations improve C code 2.17-3.15×
   - SIMD code improves are small 1.51-1.98×
   - Suggests that the SIMD code was already near optimal in debug builds

3. **Best Performing Case**:
   - Debug: Escher.raw (7.68× speedup)
   - Release: Angela_512x512.raw (5.13× speedup)

4. **Image Size Correlation**:
   - 512×512 images and 1024x1024 maintain better speedups in both configurations
   - 256×256 images show lowest acceleration factors

## Conclusion

1. **Debug Builds**:
   - Demonstrate SIMD's potential (4-7.68× faster)
   - Highlight inefficiencies in unoptimized C code

2. **Release Builds**:
   - Show more realistic performance gains (2.47-5.13×)
   - Prove SIMD remains valuable even with optimized C code (O2)
   - But when using flags equal or above `-O3`, the performance difference between SIMD and C becomes similar

3. **Overall**:
   - SIMD provides significant acceleration for image processing tasks
       - When using C, we perform 1 operation on 1 byte (unsigned char) at a time.
       - When using SIMD, we can perform 1 operation on 16 bytes (128 bits xmm registers) at a time, reducing computation time and number of memory accesses.
   - Largest images benefit most from vectorization (SIMD)