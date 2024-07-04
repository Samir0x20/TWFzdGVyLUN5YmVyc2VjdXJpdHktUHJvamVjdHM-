# Basic Firewall

Use WinSCP to move the content of **basic_defense** into **LINFO2347** and not the directory **basic_defense**.

In the VM type:
 - `sudo -E python3~/LINFO2347/topo.py`
 - `source firewall.sh`

# Network Scans

## Attack

We scan ws2, ws3, http, dns, ftp and ntp from internet. The scan is composed of TCP scan, UDP  scan and ping.

## Defense

To mitigate the attack, we limit the number of new TCP connection packets and UDP packets per minute once this limit is reached, we drop all new TCP connection and UDP packets. For ping request, we drop the packets.

## Launch

Use WinSCP to move the files `scan_defense.sh`, `attack_scan.sh` and `scan.py`  into **LINFO2347**.

In the mininet, type:

 - `source scan_defense.sh` (To launch the defense)
 - `source attack_scan.sh` (To launch the attack)

# SSH/FTP brute force attack

## Attack

We attempt to login with the admin account on every host in the network using random passwords from internet.

## Defense

To mitigate the attack, we limit the number of new TCP connection from port 22 once the limit is reached, we drop all new TCP connection packets from this port.

## Launch

Use WinSCP to move the files `ssh_defense.sh`,  `attack_ssh.sh` and `ssh.py` into **LINFO2347**.

Install paramiko with the command : `sudo pip install paramiko`

In the mininet, type:

 - `source ssh_defense.sh` (To launch the defense)
 - `source attack_ssh.sh` (To launch the attack)

# Reflected DDOS

## Attack 

We send queries from internet towards http, dns and ftp servers posing as the victim ip address (ws2).

## Defense

We drop all forwarded packets passing by Router 2 that have an ip source belonging to workstations and an ip destination belonging to DMZ servers within the enterprise network.

## Launch

Use WinSCP to move the files `rddos_defense.sh`,  `attack_rddos.sh` and `r_ddos.py` into **LINFO2347**.

In the mininet, type:

 - `source rddos_defense.sh` (To launch the defense)
 - `source attack_rddos.sh` (To launch the attack)

# DNS/ARP cache poisoning

## Attack

We send ARP response packets every 2 secondes from ws3 to poison the ARP table of ws2 and the gateway.

## Defense

The idea is to use static ARP configurations in an entreprise network. The ARP tables of ws2, ws3 and Router 1 must not be empty before launching the defense. To stop this attack, we block ARP packets. 

## Launch

Use WinSCP to move the files `arp_defense.sh`,  `attack_arp.sh` and `arp_poisoning.py` into **LINFO2347**.

Restart the mininet. Before launching the basic firewall, ping ws2, ws3 and router 1 between them to create their ARP table.
After the ping launch the basic firewall.

In the mininet, type:

 - `ws2 ping -c 1 ws3`
 - `ws2 ping -c 1 r1`
 - `r1 ping -c 1 ws2`
 - `r1 ping -c 1 ws3`
 - `source firewall.sh` (To launch the basic firewall)
 - `source arp_defense.sh` (To launch the defense)
 - `source attack_arp.sh` (To launch the attack)