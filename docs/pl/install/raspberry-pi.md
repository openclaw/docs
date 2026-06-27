---
read_when:
    - Konfigurowanie OpenClaw na Raspberry Pi
    - Uruchamianie OpenClaw na urządzeniach ARM
    - Budowanie taniej, zawsze włączonej osobistej AI
summary: Hostuj OpenClaw na Raspberry Pi, aby zapewnić stale działający self-hosting
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T17:43:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Uruchom trwały, zawsze włączony OpenClaw Gateway na Raspberry Pi. Ponieważ Pi jest tylko bramą (modele działają w chmurze przez API), nawet skromny Pi dobrze radzi sobie z obciążeniem — typowy koszt sprzętu to **35–80 USD jednorazowo**, bez opłat miesięcznych.

## Zgodność sprzętowa

| Model Pi     | RAM    | Działa? | Uwagi                                      |
| ------------ | ------ | ------- | ------------------------------------------ |
| Pi 5         | 4/8 GB | Najlepiej | Najszybszy, zalecany.                    |
| Pi 4         | 4 GB   | Dobrze  | Najlepszy wybór dla większości użytkowników. |
| Pi 4         | 2 GB   | OK      | Dodaj swap.                                |
| Pi 4         | 1 GB   | Ciasno  | Możliwe ze swapem, minimalna konfiguracja. |
| Pi 3B+       | 1 GB   | Wolno   | Działa, ale ociężale.                      |
| Pi Zero 2 W  | 512 MB | Nie     | Niezalecany.                               |

**Minimum:** 1 GB RAM, 1 rdzeń, 500 MB wolnego miejsca na dysku, 64-bitowy system operacyjny.
**Zalecane:** 2 GB+ RAM, karta SD 16 GB+ (lub USB SSD), Ethernet.

## Wymagania wstępne

- Raspberry Pi 4 lub 5 z 2 GB+ RAM (zalecane 4 GB)
- Karta MicroSD (16 GB+) lub USB SSD (lepsza wydajność)
- Oficjalny zasilacz Pi
- Połączenie sieciowe (Ethernet lub WiFi)
- 64-bitowy Raspberry Pi OS (wymagany -- nie używaj wersji 32-bitowej)
- Około 30 minut

## Konfiguracja

<Steps>
  <Step title="Flash the OS">
    Użyj **Raspberry Pi OS Lite (64-bit)** -- pulpit nie jest potrzebny dla serwera headless.

    1. Pobierz [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Wybierz system: **Raspberry Pi OS Lite (64-bit)**.
    3. W oknie ustawień wstępnie skonfiguruj:
       - Nazwa hosta: `gateway-host`
       - Włącz SSH
       - Ustaw nazwę użytkownika i hasło
       - Skonfiguruj WiFi (jeśli nie używasz Ethernetu)
    4. Wgraj obraz na kartę SD lub dysk USB, włóż nośnik i uruchom Pi.

  </Step>

  <Step title="Connect via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Update the system">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Install Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Add swap (important for 2 GB or less)">
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

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Postępuj zgodnie z kreatorem. Klucze API są zalecane zamiast OAuth dla urządzeń headless. Telegram to najłatwiejszy kanał na start.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    Na swoim komputerze pobierz URL panelu z Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Następnie utwórz tunel SSH w innym terminalu:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Otwórz wydrukowany URL w lokalnej przeglądarce. Aby uzyskać zawsze dostępny dostęp zdalny, zobacz [integrację Tailscale](/pl/gateway/tailscale).

  </Step>
</Steps>

## Wskazówki dotyczące wydajności

**Użyj USB SSD** -- karty SD są wolne i zużywają się. USB SSD znacząco poprawia wydajność. Zobacz [przewodnik rozruchu Pi z USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Włącz pamięć podręczną kompilacji modułów** -- przyspiesza powtarzane wywołania CLI na słabszych hostach Pi:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` utrzymuje rutynowe restarty Gateway w tym samym procesie, co pozwala uniknąć dodatkowych przekazań między procesami i upraszcza śledzenie PID na małych hostach.

**Zmniejsz użycie pamięci** -- w konfiguracjach headless zwolnij pamięć GPU i wyłącz nieużywane usługi:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Drop-in systemd dla stabilnych restartów** -- jeśli ten Pi działa głównie z OpenClaw, dodaj drop-in usługi:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Następnie `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Na headless Pi włącz też jednorazowo lingering, aby usługa użytkownika przetrwała wylogowanie: `sudo loginctl enable-linger "$(whoami)"`.

## Zalecana konfiguracja modelu

Ponieważ Pi uruchamia tylko Gateway, używaj modeli API hostowanych w chmurze:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

Nie uruchamiaj lokalnych LLM-ów na Pi — nawet małe modele są zbyt wolne, by były użyteczne. Pozwól Claude lub GPT wykonać pracę modelu.

## Uwagi dotyczące binariów ARM

Większość funkcji OpenClaw działa na ARM64 bez zmian (Node.js, Telegram, WhatsApp/Baileys, Chromium). Binarne pliki, którym czasami brakuje buildów ARM, to zwykle opcjonalne narzędzia CLI w Go/Rust dostarczane przez Skills. Przed przejściem do budowania ze źródeł sprawdź stronę wydań brakującego binarium pod kątem artefaktów `linux-arm64` / `aarch64`.

## Trwałość i kopie zapasowe

Stan OpenClaw znajduje się w:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` dla poszczególnych agentów, stan kanałów/dostawców, sesje.
- `~/.openclaw/workspace/` — obszar roboczy agenta (SOUL.md, pamięć, artefakty).

Przetrwają one ponowne uruchomienia. Utwórz przenośną migawkę za pomocą:

```bash
openclaw backup create
```

Jeśli trzymasz je na SSD, poprawisz zarówno wydajność, jak i żywotność w porównaniu z kartą SD.

## Rozwiązywanie problemów

**Brak pamięci** -- sprawdź, czy swap jest aktywny, używając `free -h`. Wyłącz nieużywane usługi (`sudo systemctl disable cups bluetooth avahi-daemon`). Używaj wyłącznie modeli opartych na API.

**Niska wydajność** -- użyj USB SSD zamiast karty SD. Sprawdź dławienie CPU za pomocą `vcgencmd get_throttled` (powinno zwrócić `0x0`).

**Usługa się nie uruchamia** -- sprawdź logi poleceniem `journalctl --user -u openclaw-gateway.service --no-pager -n 100` i uruchom `openclaw doctor --non-interactive`. Jeśli to headless Pi, sprawdź też, czy lingering jest włączony: `sudo loginctl enable-linger "$(whoami)"`.

**Problemy z binariami ARM** -- jeśli Skill kończy się błędem „exec format error”, sprawdź, czy binarium ma build ARM64. Zweryfikuj architekturę poleceniem `uname -m` (powinno pokazać `aarch64`).

**Zrywanie WiFi** -- wyłącz zarządzanie energią WiFi: `sudo iwconfig wlan0 power off`.

## Następne kroki

- [Kanały](/pl/channels) -- połącz Telegram, WhatsApp, Discord i więcej
- [Konfiguracja Gateway](/pl/gateway/configuration) -- wszystkie opcje konfiguracji
- [Aktualizowanie](/pl/install/updating) -- utrzymuj OpenClaw w aktualnej wersji

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Serwer Linux](/pl/vps)
- [Platformy](/pl/platforms)
