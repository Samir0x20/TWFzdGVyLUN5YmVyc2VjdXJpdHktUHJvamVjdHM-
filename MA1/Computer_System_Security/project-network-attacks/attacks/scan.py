from scapy.all import *

# Define target IP addresses
targets = ['10.1.0.2', '10.1.0.3', '10.12.0.10', 
           '10.12.0.20', '10.12.0.30', '10.12.0.40']


for target in targets:
    # ICMP scan
    for _ in range(10):
        sr(IP(dst=target)/ICMP(), timeout=1)
    
    # UDP scan
    sr(IP(dst=target)/UDP(dport=(1, 1024)), timeout=1)
    
    # TCP scan
    sr(IP(dst=target)/TCP(dport=(1, 1024)), timeout=1)
