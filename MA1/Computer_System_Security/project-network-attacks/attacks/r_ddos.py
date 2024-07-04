from scapy.all import *
import threading
import random
import string

def generate_random_string(length):
    letters = string.ascii_lowercase + string.ascii_uppercase
    return ''.join(random.choice(letters) for _ in range(length))


def dns():
    for _ in range(3000):
        query = generate_random_string(35)
        query = query + ".example.com"
        p = IP(src='10.1.0.2' ,dst='10.12.0.20') / UDP(sport=5353, dport=5353) / DNS(rd=1, qd=DNSQR(qname=query, qtype="ANY"))
        send(p, verbose=0)
       

def http():
    for _ in range(3000):
        p = IP(src='10.1.0.2' ,dst='10.12.0.10') / TCP(sport=RandShort(), dport=80) / b"GET / HTTP/1.1\r\nHost: www.example.com\r\n\r\n"
        send(p, verbose=0)
        

def ftp():
    for _ in range(3000):
        p = IP(src='10.1.0.2' ,dst='10.12.0.40') / TCP(sport=RandShort(), dport=21) / b"USER anonymous\r\nPASS guest\r\n"
        send(p, verbose=0)
       
        

thread_dns = threading.Thread(target=dns)
thread_dns.start()
thread_http = threading.Thread(target=http)
thread_http.start()
thread_ftp = threading.Thread(target=ftp)
thread_ftp.start()