---
read_when:
    - Konfigurowanie OpenClaw na Raspberry Pi
    - Uruchamianie OpenClaw na urządzeniach ARM
    - Budowanie taniego, zawsze włączonego osobistego AI
summary: Hostuj OpenClaw na Raspberry Pi do zawsze włączonego self-hostingu
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-24T09:18:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

Uruchom trwały, zawsze włączony Gateway OpenClaw na Raspberry Pi. Ponieważ Pi działa tylko jako gateway (modele działają w chmurze przez API), nawet skromny Pi dobrze radzi sobie z tym obciążeniem.

## Wymagania wstępne

- Raspberry Pi 4 lub 5 z 2 GB+ RAM (zalecane 4 GB)
- Karta MicroSD (16 GB+) lub USB SSD (lepsza wydajność)
- Oficjalny zasilacz Pi
- Połączenie sieciowe (Ethernet lub WiFi)
- 64-bit Raspberry Pi OS (wymagane — nie używaj wersji 32-bitowej)
- Około 30 minut

## Konfiguracja

<Steps>
  <Step title="Wgraj system operacyjny">
    Użyj **Raspberry Pi OS Lite (64-bit)** — dla serwera headless nie jest potrzebne środowisko graficzne.

    1. Pobierz [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Wybierz system operacyjny: **Raspberry Pi OS Lite (64-bit)**.
    3. W oknie ustawień skonfiguruj z wyprzedzeniem:
       - Nazwa hosta: `gateway-host`
       - Włącz SSH
       - Ustaw nazwę użytkownika i hasło
       - Skonfiguruj WiFi (jeśli nie używasz Ethernet)
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

    # Ustaw strefę czasową (ważne dla cron i przypomnień)
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

  <Step title="Dodaj swap (ważne przy 2 GB RAM lub mniej)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Zmniejsz swappiness dla urządzeń z małą ilością RAM
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

    Postępuj zgodnie z kreatorem. Dla urządzeń headless zalecane są klucze API zamiast OAuth. Telegram to najłatwiejszy kanał na początek.

  </Step>

  <Step title="Zweryfikuj">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Uzyskaj dostęp do interfejsu Control">
    Na swoim komputerze pobierz URL panelu kontrolnego z Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Następnie utwórz tunel SSH w innym terminalu:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Otwórz wypisany URL w lokalnej przeglądarce. W przypadku zawsze dostępnego zdalnego dostępu zobacz [integrację Tailscale](/pl/gateway/tailscale).

  </Step>
</Steps>

## Wskazówki wydajnościowe

**Używaj USB SSD** — karty SD są wolne i szybko się zużywają. USB SSD znacząco poprawia wydajność. Zobacz [przewodnik bootowania Pi z USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Włącz cache kompilacji modułów** — przyspiesza powtarzane wywołania CLI na mniej wydajnych hostach Pi:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Zmniejsz zużycie pamięci** — w konfiguracjach headless zwolnij pamięć GPU i wyłącz nieużywane usługi:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Rozwiązywanie problemów

**Brak pamięci** — sprawdź, czy swap jest aktywny przez `free -h`. Wyłącz nieużywane usługi (`sudo systemctl disable cups bluetooth avahi-daemon`). Używaj wyłącznie modeli opartych na API.

**Niska wydajność** — używaj USB SSD zamiast karty SD. Sprawdź throttling CPU przez `vcgencmd get_throttled` (powinno zwrócić `0x0`).

**Usługa nie chce się uruchomić** — sprawdź logi przez `journalctl --user -u openclaw-gateway.service --no-pager -n 100` i uruchom `openclaw doctor --non-interactive`. Jeśli to headless Pi, sprawdź też, czy włączono lingering: `sudo loginctl enable-linger "$(whoami)"`.

**Problemy z binariami ARM** — jeśli Skill kończy się błędem „exec format error”, sprawdź, czy binarium ma kompilację ARM64. Zweryfikuj architekturę przez `uname -m` (powinno pokazać `aarch64`).

**WiFi się rozłącza** — wyłącz zarządzanie energią WiFi: `sudo iwconfig wlan0 power off`.

## Następne kroki

- [Kanały](/pl/channels) — podłącz Telegram, WhatsApp, Discord i inne
- [Konfiguracja Gateway](/pl/gateway/configuration) — wszystkie opcje konfiguracji
- [Aktualizowanie](/pl/install/updating) — aktualizuj OpenClaw na bieżąco

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Serwer Linux](/pl/vps)
- [Platformy](/pl/platforms)
