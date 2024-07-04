ws2 nft add rule ip ws2_filter input tcp dport 22 ct state new limit rate over 2/minute counter drop

ws3 nft add rule ip ws3_filter input tcp dport 22 ct state new limit rate over 2/minute counter drop

http nft add rule ip http_server_filter input tcp dport 22 ct state new limit rate over 2/minute counter drop

dns nft add rule ip dns_server_filter input tcp dport 22 ct state new limit rate over 2/minute counter drop

ftp nft add rule ip ftp_server_filter input tcp dport 22 ct state new limit rate over 2/minute counter drop

ntp nft add rule ip ntp_server_filter input tcp dport 22 ct state new limit rate over 2/minute counter drop





