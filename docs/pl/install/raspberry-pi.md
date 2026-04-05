---
read_when:
    - Konfigurowanie OpenClaw na Raspberry Pi
    - Uruchamianie OpenClaw na urządzeniach ARM
    - Budowanie taniego, zawsze włączonego osobistego AI
summary: Hostowanie OpenClaw na Raspberry Pi do zawsze włączonego self-hostingu
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-05T13:58:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 222ccbfb18a8dcec483adac6f5647dcb455c84edbad057e0ba2589a6da570b4c
    source_path: install/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi

Uruchom trwały, zawsze włączony Gateway OpenClaw na Raspberry Pi. Ponieważ Pi działa tylko jako gateway (modele działają w chmurze przez API), nawet skromny Pi dobrze radzi sobie z tym obciążeniem.

## Wymagania wstępne

- Raspberry Pi 4 lub 5 z 2 GB+ RAM (zalecane 4 GB)
- Karta microSD (16 GB+) lub dysk USB SSD (lepsza wydajność)
- Oficjalny zasilacz Pi
- Połączenie sieciowe (Ethernet lub WiFi)
- 64-bit Raspberry Pi OS (wymagany — nie używaj wersji 32-bitowej)
- Około 30 minut

## Konfiguracja

<Steps>
  <Step title="Wgraj system operacyjny">
    Użyj **Raspberry Pi OS Lite (64-bit)** — środowisko graficzne nie jest potrzebne dla serwera bezgłowego.

    1. Pobierz [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Wybierz system operacyjny: **Raspberry Pi OS Lite (64-bit)**.
    3. W oknie ustawień skonfiguruj wstępnie:
       - Nazwa hosta: `gateway-host`
       - Włącz SSH
       - Ustaw nazwę użytkownika i hasło
       - Skonfiguruj WiFi (jeśli nie używasz Ethernetu)
    4. Wgraj system na kartę SD lub dysk USB, włóż nośnik i uruchom Pi.

  </Step>

  <Step title="Połącz się przez SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Zaktualizuj system">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Zainstaluj Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Dodaj swap (ważne przy 2 GB lub mniej)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Zainstaluj OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Postępuj zgodnie z kreatorem. Klucze API są zalecane zamiast OAuth na urządzeniach bezgłowych. Telegram to najłatwiejszy kanał na początek.

  </Step>

  <Step title="Weryfikacja">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Uzyskaj dostęp do Control UI">
    Na komputerze pobierz URL panelu z Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Następnie utwórz tunel SSH w innym terminalu:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Otwórz wypisany URL w lokalnej przeglądarce. Aby uzyskać zawsze dostęp zdalny, zobacz [integrację z Tailscale](/gateway/tailscale).

  </Step>
</Steps>

## Wskazówki dotyczące wydajności

**Używaj dysku USB SSD** — karty SD są wolne i się zużywają. Dysk USB SSD znacząco poprawia wydajność. Zobacz [przewodnik uruchamiania Pi z USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Włącz cache kompilacji modułów** — przyspiesza powtarzane wywołania CLI na słabszych hostach Pi:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Zmniejsz użycie pamięci** — w konfiguracjach bezgłowych zwolnij pamięć GPU i wyłącz nieużywane usługi:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Rozwiązywanie problemów

**Brak pamięci** — Sprawdź, czy swap jest aktywny, używając `free -h`. Wyłącz nieużywane usługi (`sudo systemctl disable cups bluetooth avahi-daemon`). Używaj tylko modeli opartych na API.

**Niska wydajność** — Użyj dysku USB SSD zamiast karty SD. Sprawdź ograniczanie CPU poleceniem `vcgencmd get_throttled` (powinno zwrócić `0x0`).

**Usługa nie chce się uruchomić** — Sprawdź logi poleceniem `journalctl --user -u openclaw-gateway.service --no-pager -n 100` i uruchom `openclaw doctor --non-interactive`. Jeśli to bezgłowy Pi, sprawdź też, czy lingering jest włączony: `sudo loginctl enable-linger "$(whoami)"`.

**Problemy z binariami ARM** — Jeśli Skill kończy się błędem „exec format error”, sprawdź, czy binarium ma build ARM64. Zweryfikuj architekturę poleceniem `uname -m` (powinno pokazać `aarch64`).

**WiFi się rozłącza** — Wyłącz zarządzanie energią WiFi: `sudo iwconfig wlan0 power off`.

## Następne kroki

- [Channels](/pl/channels) — podłącz Telegram, WhatsApp, Discord i inne
- [Gateway configuration](/gateway/configuration) — wszystkie opcje konfiguracji
- [Updating](/install/updating) — utrzymuj OpenClaw na bieżąco
