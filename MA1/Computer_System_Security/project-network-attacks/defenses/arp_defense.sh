ws2 ping -c 1 ws3
ws2 ping -c 1 r1
r1 ping -c 1 ws2
r1 ping -c 1 ws3


ws2 nft add table arp ws2_arp
ws2 nft add chain arp ws2_arp input { type filter hook input priority 0\; policy accept\; }
ws2 nft add chain arp ws2_arp output { type filter hook output priority 0\; policy accept\; }
ws2 nft add rule arp ws2_arp input ether type arp drop
ws2 nft add rule arp ws2_arp output ether type arp drop

ws3 nft add table arp ws3_arp
ws3 nft add chain arp ws3_arp input { type filter hook input priority 0\; policy accept\; }
ws3 nft add chain arp ws3_arp output { type filter hook output priority 0\; policy accept\; }
ws3 nft add rule arp ws3_arp input ether type arp drop
ws3 nft add rule arp ws3_arp output ether type arp drop