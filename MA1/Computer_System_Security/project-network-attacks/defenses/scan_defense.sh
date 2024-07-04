ws2 nft add rule ip ws2_filter input icmp type echo-request counter drop
ws2 nft add rule ip ws2_filter input tcp flags \{ syn \} limit rate over 10/minute counter drop
ws2 nft add rule ip ws2_filter input ip protocol udp limit rate over 10/minute drop

ws3 nft add rule ip ws3_filter input icmp type echo-request counter drop
ws3 nft add rule ip ws3_filter input tcp flags \{ syn \} limit rate over 10/minute counter drop
ws3 nft add rule ip ws3_filter input ip protocol udp limit rate over 10/minute drop

http nft add rule ip http_server_filter input icmp type echo-request counter drop
http nft add rule ip http_server_filter input tcp flags \{ syn \} limit rate over 10/minute counter drop
http nft add rule ip http_server_filter input ip protocol udp limit rate over 10/minute drop

dns nft add rule ip dns_server_filter input icmp type echo-request counter drop
dns nft add rule ip dns_server_filter input tcp flags \{ syn \} limit rate over 10/minute counter drop
dns nft add rule ip dns_server_filter input ip protocol udp limit rate over 10/minute drop

ftp nft add rule ip ftp_server_filter input icmp type echo-request counter drop
ftp nft add rule ip ftp_server_filter input tcp flags \{ syn \} limit rate over 10/minute counter drop
ftp nft add rule ip ftp_server_filter input ip protocol udp limit rate over 10/minute drop

ntp nft add rule ip ntp_server_filter input icmp type echo-request counter drop
ntp nft add rule ip ntp_server_filter input tcp flags \{ syn \} limit rate over 10/minute counter drop
ntp nft add rule ip ntp_server_filter input ip protocol udp limit rate over 10/minute drop
