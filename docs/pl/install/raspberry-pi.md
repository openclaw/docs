---
read_when:
    - Konfigurowanie OpenClaw na Raspberry Pi
    - Uruchamianie OpenClaw na urządzeniach ARM
    - Budowa niedrogiej, stale dostępnej osobistej sztucznej inteligencji
summary: Hostuj OpenClaw na Raspberry Pi, aby zapewnić stale działający hosting na własnej infrastrukturze
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T15:16:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Uruchom trwały, działający bez przerwy Gateway OpenClaw na Raspberry Pi. Ponieważ Pi pełni jedynie funkcję Gateway (modele działają w chmurze przez API), nawet podstawowy model Pi dobrze radzi sobie z tym obciążeniem — typowy jednorazowy koszt sprzętu wynosi **35–80 USD**, bez opłat miesięcznych.

## Zgodność sprzętowa

| Model Pi    | RAM    | Działa?       | Uwagi                                      |
| ----------- | ------ | ------------- | ------------------------------------------ |
| Pi 5        | 4/8 GB | Najlepiej     | Najszybszy, zalecany.                      |
| Pi 4        | 4 GB   | Dobrze        | Optymalny wybór dla większości użytkowników. |
| Pi 4        | 2 GB   | Wystarczająco | Dodaj przestrzeń wymiany.                  |
| Pi 4        | 1 GB   | Na granicy    | Możliwe z przestrzenią wymiany i minimalną konfiguracją. |
| Pi 3B+      | 1 GB   | Wolno         | Działa, ale powoli.                        |
| Pi Zero 2 W | 512 MB | Nie           | Niezalecany.                               |

**Minimum:** 1 GB RAM, 1 rdzeń, 500 MB wolnego miejsca na dysku, 64-bitowy system operacyjny.
**Zalecane:** co najmniej 2 GB RAM, karta SD o pojemności co najmniej 16 GB (lub dysk SSD USB), Ethernet.

## Wymagania wstępne

- Raspberry Pi 4 lub 5 z co najmniej 2 GB RAM (zalecane 4 GB)
- Karta microSD (co najmniej 16 GB) lub dysk SSD USB (lepsza wydajność)
- Oficjalny zasilacz Pi
- Połączenie sieciowe (Ethernet lub WiFi)
- 64-bitowy Raspberry Pi OS (wymagany — nie używaj wersji 32-bitowej)
- Około 30 minut

## Konfiguracja

<Steps>
  <Step title="Nagraj system operacyjny">
    Użyj **Raspberry Pi OS Lite (64-bit)** — środowisko graficzne nie jest potrzebne na serwerze bez monitora.

    1. Pobierz [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Wybierz system operacyjny: **Raspberry Pi OS Lite (64-bit)**.
    3. W oknie ustawień skonfiguruj wstępnie:
       - Nazwa hosta: `gateway-host`
       - Włącz SSH
       - Ustaw nazwę użytkownika i hasło
       - Skonfiguruj WiFi (jeśli nie używasz Ethernetu)
    4. Nagraj system na kartę SD lub dysk USB, włóż nośnik i uruchom Pi.

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

  <Step title="Dodaj przestrzeń wymiany (ważne dla urządzeń z maksymalnie 2 GB RAM)">
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

  <Step title="Uruchom konfigurację początkową">
    ```bash
    openclaw onboard --install-daemon
    ```

    Postępuj zgodnie z instrukcjami kreatora. Na urządzeniach bez monitora zaleca się używanie kluczy API zamiast OAuth. Telegram jest najłatwiejszym kanałem na początek.

  </Step>

  <Step title="Zweryfikuj działanie">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Uzyskaj dostęp do interfejsu sterowania">
    Na swoim komputerze pobierz adres URL panelu z Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Następnie utwórz tunel SSH w innym terminalu:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Otwórz wyświetlony adres URL w lokalnej przeglądarce. Aby uzyskać stały dostęp zdalny, zobacz [integrację z Tailscale](/pl/gateway/tailscale).

  </Step>
</Steps>

## Wskazówki dotyczące wydajności

**Używaj dysku SSD USB** — karty SD są wolne i zużywają się. Dysk SSD USB znacząco zwiększa wydajność i wytrzymuje więcej cykli zapisu; użyj go dla `OPENCLAW_STATE_DIR`, jeśli system operacyjny pozostaje na karcie SD. Zobacz [przewodnik uruchamiania Pi z USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Włącz pamięć podręczną kompilacji modułów** — przyspiesza wielokrotne wywołania CLI na mniej wydajnych hostach Pi. `OPENCLAW_NO_RESPAWN=1` sprawia, że rutynowe ponowne uruchomienia Gateway odbywają się w tym samym procesie, co pozwala uniknąć dodatkowego przekazywania między procesami i upraszcza śledzenie PID na małych hostach:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Używaj `/var/tmp`, a nie `/tmp` — niektóre dystrybucje czyszczą `/tmp` podczas uruchamiania, co usuwa przygotowaną pamięć podręczną.

**Zmniejsz zużycie pamięci** — w konfiguracjach bez monitora zwolnij pamięć GPU i wyłącz nieużywane usługi:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Nadpisanie systemd zapewniające stabilne ponowne uruchamianie** — jeśli to Pi służy głównie do uruchamiania OpenClaw, dodaj nadpisanie usługi:

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

Następnie wykonaj `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Na Pi bez monitora włącz również raz pozostawanie procesu użytkownika po wylogowaniu, aby usługa użytkownika nadal działała: `sudo loginctl enable-linger "$(whoami)"`.

## Zalecana konfiguracja modelu

Ponieważ Pi uruchamia tylko Gateway, korzystaj z modeli API hostowanych w chmurze — nie uruchamiaj lokalnych modeli LLM na Pi, ponieważ nawet małe modele są zbyt wolne, aby były użyteczne:

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

## Uwagi dotyczące plików binarnych ARM

Większość funkcji OpenClaw działa na ARM64 bez zmian (Node.js, Telegram, WhatsApp/Baileys, Chromium). Pliki binarne, dla których czasami brakuje kompilacji ARM, to zazwyczaj opcjonalne narzędzia CLI napisane w Go lub Rust i dostarczane przez Skills. Sprawdź architekturę za pomocą `uname -m` (wynikiem powinno być `aarch64`), a następnie poszukaj artefaktów `linux-arm64` / `aarch64` na stronie wydań brakującego pliku binarnego, zanim zdecydujesz się na kompilację ze źródeł.

## Trwałość danych i kopie zapasowe

Stan OpenClaw znajduje się w:

- `~/.openclaw/` — `openclaw.json`, pliki `auth-profiles.json` poszczególnych agentów, stan kanałów i dostawców oraz sesje.
- `~/.openclaw/workspace/` — przestrzeń robocza agenta (SOUL.md, pamięć, artefakty).

Dane te przetrwają ponowne uruchomienia, a przechowywanie ich na dysku SSD zamiast na karcie SD zwiększa zarówno wydajność, jak i trwałość. Utwórz przenośną migawkę za pomocą:

```bash
openclaw backup create
```

## Rozwiązywanie problemów

**Brak pamięci** — sprawdź za pomocą `free -h`, czy przestrzeń wymiany jest aktywna. Wyłącz nieużywane usługi (`sudo systemctl disable cups bluetooth avahi-daemon`). Używaj wyłącznie modeli opartych na API.

**Niska wydajność** — użyj dysku SSD USB zamiast karty SD. Sprawdź ograniczanie częstotliwości procesora za pomocą `vcgencmd get_throttled` (wynikiem powinno być `0x0`).

**Usługa nie uruchamia się** — sprawdź dzienniki za pomocą `journalctl --user -u openclaw-gateway.service --no-pager -n 100` i uruchom `openclaw doctor --non-interactive`. Jeśli jest to Pi bez monitora, sprawdź również, czy pozostawanie procesu użytkownika po wylogowaniu jest włączone: `sudo loginctl enable-linger "$(whoami)"`.

**Problemy z plikami binarnymi ARM** — jeśli Skill kończy działanie z błędem „exec format error”, sprawdź, czy plik binarny ma kompilację ARM64. Sprawdź architekturę za pomocą `uname -m` (wynikiem powinno być `aarch64`).

**Zrywanie połączenia WiFi** — wyłącz zarządzanie energią WiFi: `sudo iwconfig wlan0 power off`.

## Następne kroki

- [Kanały](/pl/channels) — połącz Telegram, WhatsApp, Discord i inne usługi
- [Konfiguracja Gateway](/pl/gateway/configuration) — wszystkie opcje konfiguracji
- [Aktualizowanie](/pl/install/updating) — dbaj o aktualność OpenClaw

## Powiązane materiały

- [Omówienie instalacji](/pl/install)
- [Serwer Linux](/pl/vps)
- [Platformy](/pl/platforms)
