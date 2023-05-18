import time
import requests

def test_proxy(ip):
    proxies = {
        'http': f'http://{ip}',
        'https': f'http://{ip}',
    }
    try:
        response = requests.get('http://www.google.com', proxies=proxies, timeout=5)
        if response.status_code >= 200 and response.status_code < 300:
            return True
    except requests.RequestException:
        pass
    return False

def test_ip_addresses(ip_file, output_file, file_number, total_files):
    with open(ip_file, 'r') as file:
        ip_addresses = file.read().splitlines()

    results = []

    for i, ip in enumerate(ip_addresses, start=1):
        is_working = test_proxy(ip)
        status = 'Active' if is_working else 'Inactive'
        results.append((ip, status))

        progress = i / len(ip_addresses) * 100
        print(f'\rTesting {file_number}/{total_files} - Progress: {progress:.1f}%', end='', flush=True)

    with open(output_file, 'w') as file:
        for ip, status in results:
            file.write(f'{ip}\t{status}\n')

    print(f'\rFile {file_number}/{total_files} completed.               ')

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

def main():
    display_menu()
    choice = get_user_choice()
    input_file = get_input_filename(choice)
    output_file = 'results.txt'
    total_files = 1  # Update this value if you have more files to test

    print('Testing in progress...')
    time.sleep(1)  # Simulate a delay before starting the testing

    test_ip_addresses(input_file, output_file, 1, total_files)

    print('Testing complete. Results saved to', output_file)

if __name__ == '__main__':
    main()

