import time
import requests
import os

DEFAULT_DOMAIN = 'www.google.com'

def test_proxy(ip, domain=DEFAULT_DOMAIN):
    proxies = {
        'http': f'http://{ip}',
        'https': f'http://{ip}',
    }
    try:
        response = requests.get(f'http://{domain}', proxies=proxies, timeout=5)
        if response.status_code >= 200 and response.status_code < 300:
            return True
    except requests.RequestException:
        pass
    return False

def test_ip_addresses(ip_file, output_file, domain=DEFAULT_DOMAIN):
    with open(ip_file, 'r') as file:
        ip_addresses = file.read().splitlines()

    results = []

    for i, ip in enumerate(ip_addresses, start=1):
        is_working = test_proxy(ip, domain=domain)
        status = 'Active' if is_working else 'Inactive'
        results.append((ip, status))

        progress = i / len(ip_addresses) * 100
        print(f'\rTesting - Progress: {progress:.1f}% | {"." * (i % 4)}    ', end='', flush=True)
        time.sleep(0.1)  # Add a slight delay to simulate animation

    with open(output_file, 'w') as file:
        for ip, status in results:
            file.write(f'{ip}\t{status}\n')

    print('\rTesting complete.                  ')

def display_menu():
    print('Select a file to test:')
    print('1. http.txt')
    print('2. https.txt')

def get_user_choice():
    while True:
        choice = input('Enter your choice (1 or 2): ')
        if choice in ['1', '2']:
            return choice
        print('Invalid choice. Please try again.')

def get_input_filename(choice):
    if choice == '1':
        return 'http.txt'
    elif choice == '2':
        return 'https.txt'

def check_input_files():
    http_file = 'http.txt'
    https_file = 'https.txt'
    if not os.path.exists(http_file) or not os.path.isfile(http_file):
        print(f"Error: '{http_file}' file is missing or not found.")
        return False
    if not os.path.exists(https_file) or not os.path.isfile(https_file):
        print(f"Error: '{https_file}' file is missing or not found.")
        return False
    return True

def get_domain_choice():
    domain_choice = input("Enter the domain on which you want to test the proxies (default: Google): ")
    return domain_choice.strip() if domain_choice.strip() else DEFAULT_DOMAIN

def main():
    if not check_input_files():
        return

    display_menu()
    choice = get_user_choice()
    input_file = get_input_filename(choice)
    output_file = 'results.txt'

    print('Testing in progress...')
    time.sleep(1)  # Simulate a delay before starting the testing

    domain = get_domain_choice()
    print(f"Using domain: {domain}")

    test_ip_addresses(input_file, output_file, domain=domain)

    print('Testing complete. Results saved to', output_file)

if __name__ == '__main__':
    main()
