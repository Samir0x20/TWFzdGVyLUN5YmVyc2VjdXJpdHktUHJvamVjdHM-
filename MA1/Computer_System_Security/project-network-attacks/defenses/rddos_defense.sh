r2 sudo nft add table ip r2_filter
r2 sudo nft add chain ip r2_filter forward { type filter hook forward priority 0 \; }
r2 sudo nft add rule ip r2_filter forward ip saddr 10.1.0.0/24 ip daddr 10.12.0.0/24 counter drop