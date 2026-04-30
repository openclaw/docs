---
read_when:
    - Konfigurowanie OpenClaw na Raspberry Pi
    - Uruchamianie OpenClaw na urządzeniach ARM
    - Budowanie taniej, zawsze działającej osobistej sztucznej inteligencji
summary: OpenClaw na Raspberry Pi (budżetowa konfiguracja do samodzielnego hostowania)
title: Raspberry Pi (platforma)
x-i18n:
    generated_at: "2026-04-30T10:05:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw na Raspberry Pi

## Cel

Uruchom trwały, zawsze dostępny OpenClaw Gateway na Raspberry Pi za jednorazowy koszt **~35-80 USD** (bez opłat miesięcznych).

Idealne do:

- osobistego asystenta AI 24/7
- centrum automatyki domowej
- energooszczędnego, zawsze dostępnego bota Telegram/WhatsApp

## Wymagania sprzętowe

| Model Pi        | RAM     | Działa?      | Uwagi                                |
| --------------- | ------- | ------------ | ------------------------------------ |
| **Pi 5**        | 4GB/8GB | ✅ Najlepszy | Najszybszy, zalecany                 |
| **Pi 4**        | 4GB     | ✅ Dobry     | Najlepszy wybór dla większości osób  |
| **Pi 4**        | 2GB     | ✅ OK        | Działa, dodaj swap                   |
| **Pi 4**        | 1GB     | ⚠️ Na styk   | Możliwe ze swapem, minimalna konfiguracja |
| **Pi 3B+**      | 1GB     | ⚠️ Wolny     | Działa, ale ociężale                 |
| **Pi Zero 2 W** | 512MB   | ❌           | Niezalecany                          |

**Minimalne wymagania:** 1GB RAM, 1 rdzeń, 500MB miejsca na dysku  
**Zalecane:** 2GB+ RAM, 64-bitowy system operacyjny, karta SD 16GB+ (lub USB SSD)

## Czego potrzebujesz

- Raspberry Pi 4 lub 5 (zalecane 2GB+)
- Karta MicroSD (16GB+) lub USB SSD (lepsza wydajność)
- Zasilacz (zalecany oficjalny zasilacz Pi)
- Połączenie sieciowe (Ethernet lub WiFi)
- ~30 minut

## 1) Wgraj system operacyjny

Użyj **Raspberry Pi OS Lite (64-bit)** — na serwerze headless pulpit nie jest potrzebny.

1. Pobierz [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Wybierz system operacyjny: **Raspberry Pi OS Lite (64-bit)**
3. Kliknij ikonę koła zębatego (⚙️), aby wstępnie skonfigurować:
   - Ustaw nazwę hosta: `gateway-host`
   - Włącz SSH
   - Ustaw nazwę użytkownika/hasło
   - Skonfiguruj WiFi (jeśli nie używasz Ethernetu)
4. Wgraj na kartę SD / dysk USB
5. Włóż nośnik i uruchom Pi

## 2) Połącz się przez SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) Konfiguracja systemu

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Zainstaluj Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) Dodaj swap (ważne przy 2GB lub mniej)

Swap zapobiega awariom spowodowanym brakiem pamięci:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Zainstaluj OpenClaw

### Opcja A: standardowa instalacja (zalecana)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Opcja B: instalacja do modyfikacji (do eksperymentowania)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Instalacja do modyfikacji daje bezpośredni dostęp do logów i kodu — przydatne podczas debugowania problemów specyficznych dla ARM.

## 7) Uruchom onboarding

```bash
openclaw onboard --install-daemon
```

Postępuj zgodnie z kreatorem:

1. **Tryb Gateway:** lokalny
2. **Uwierzytelnianie:** zalecane klucze API (OAuth może sprawiać problemy na headless Pi)
3. **Kanały:** od Telegram najłatwiej zacząć
4. **Daemon:** tak (systemd)

## 8) Zweryfikuj instalację

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) Uzyskaj dostęp do pulpitu OpenClaw

Zastąp `user@gateway-host` nazwą użytkownika Pi oraz nazwą hosta lub adresem IP.

Na swoim komputerze poproś Pi o wydrukowanie świeżego adresu URL pulpitu:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Polecenie wypisuje `Dashboard URL:`. W zależności od konfiguracji `gateway.auth.token`
adres URL może być zwykłym linkiem `http://127.0.0.1:18789/` albo linkiem,
który zawiera `#token=...`.

W innym terminalu na swoim komputerze utwórz tunel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Następnie otwórz wydrukowany adres URL pulpitu w lokalnej przeglądarce.

Jeśli UI poprosi o uwierzytelnianie wspólnym sekretem, wklej skonfigurowany token lub hasło
w ustawieniach Control UI. Dla uwierzytelniania tokenem użyj `gateway.auth.token` (lub
`OPENCLAW_GATEWAY_TOKEN`).

Aby uzyskać stały zdalny dostęp, zobacz [Tailscale](/pl/gateway/tailscale).

---

## Optymalizacje wydajności

### Użyj USB SSD (ogromna poprawa)

Karty SD są wolne i zużywają się. USB SSD znacząco poprawia wydajność:

```bash
# Check if booting from USB
lsblk
```

Instrukcję konfiguracji znajdziesz w [przewodniku uruchamiania Pi z USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

### Przyspiesz start CLI (pamięć podręczna kompilacji modułów)

Na słabszych hostach Pi włącz pamięć podręczną kompilacji modułów Node, aby kolejne uruchomienia CLI były szybsze:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Uwagi:

- `NODE_COMPILE_CACHE` przyspiesza kolejne uruchomienia (`status`, `health`, `--help`).
- `/var/tmp` lepiej przetrwa ponowne uruchomienia niż `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` eliminuje dodatkowy koszt startu związany z samoczynnym ponownym uruchamianiem CLI.
- Pierwsze uruchomienie rozgrzewa pamięć podręczną; późniejsze uruchomienia korzystają najbardziej.

### Dostrajanie startu systemd (opcjonalne)

Jeśli ten Pi głównie uruchamia OpenClaw, dodaj drop-in usługi, aby ograniczyć
zmienność restartów i utrzymać stabilne środowisko startowe:

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

Następnie zastosuj zmiany:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Jeśli to możliwe, trzymaj stan/pamięć podręczną OpenClaw na nośniku SSD, aby uniknąć
wąskich gardeł losowego I/O karty SD podczas zimnych startów.

Jeśli to headless Pi, włącz lingering raz, aby usługa użytkownika przetrwała
wylogowanie:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Jak zasady `Restart=` pomagają w automatycznym odzyskiwaniu:
[systemd może automatyzować odzyskiwanie usług](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Zmniejsz zużycie pamięci

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### Monitoruj zasoby

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## Uwagi specyficzne dla ARM

### Zgodność binarna

Większość funkcji OpenClaw działa na ARM64, ale niektóre zewnętrzne pliki binarne mogą wymagać kompilacji ARM:

| Narzędzie          | Status ARM64 | Uwagi                               |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Działa świetnie                     |
| WhatsApp (Baileys) | ✅           | Czysty JS, bez problemów            |
| Telegram           | ✅           | Czysty JS, bez problemów            |
| gog (Gmail CLI)    | ⚠️           | Sprawdź, czy istnieje wydanie ARM   |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Jeśli skill się nie powiedzie, sprawdź, czy jego plik binarny ma kompilację ARM. Wiele narzędzi Go/Rust ją ma; niektóre nie.

### 32-bit vs 64-bit

**Zawsze używaj 64-bitowego systemu operacyjnego.** Node.js i wiele nowoczesnych narzędzi tego wymaga. Sprawdź za pomocą:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## Zalecana konfiguracja modeli

Ponieważ Pi jest tylko Gateway (modele działają w chmurze), używaj modeli opartych na API:

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

**Nie próbuj uruchamiać lokalnych LLM na Pi** — nawet małe modele są zbyt wolne. Pozwól Claude/GPT wykonać ciężką pracę.

---

## Automatyczne uruchamianie przy starcie

Onboarding to konfiguruje, ale aby zweryfikować:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## Rozwiązywanie problemów

### Brak pamięci (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### Niska wydajność

- Użyj USB SSD zamiast karty SD
- Wyłącz nieużywane usługi: `sudo systemctl disable cups bluetooth avahi-daemon`
- Sprawdź throttling CPU: `vcgencmd get_throttled` (powinno zwrócić `0x0`)

### Usługa się nie uruchamia

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problemy z plikami binarnymi ARM

Jeśli skill kończy się błędem "exec format error":

1. Sprawdź, czy plik binarny ma kompilację ARM64
2. Spróbuj zbudować ze źródła
3. Albo użyj kontenera Docker z obsługą ARM

### Zrywanie WiFi

Dla headless Pi na WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Porównanie kosztów

| Konfiguracja    | Koszt jednorazowy | Koszt miesięczny | Uwagi                         |
| --------------- | ----------------- | ---------------- | ----------------------------- |
| **Pi 4 (2GB)**  | ~$45              | $0               | + zasilanie (~$5/rok)         |
| **Pi 4 (4GB)**  | ~$55              | $0               | Zalecany                      |
| **Pi 5 (4GB)**  | ~$60              | $0               | Najlepsza wydajność           |
| **Pi 5 (8GB)**  | ~$80              | $0               | Nadmiarowy, ale przyszłościowy |
| DigitalOcean    | $0                | $6/mies.         | $72/rok                       |
| Hetzner         | $0                | €3.79/mies.      | ~$50/rok                      |

**Próg opłacalności:** Pi zwraca się po ~6-12 miesiącach w porównaniu z VPS w chmurze.

---

## Powiązane

- [Przewodnik po Linuksie](/pl/platforms/linux) — ogólna konfiguracja Linuksa
- [Przewodnik po DigitalOcean](/pl/install/digitalocean) — alternatywa w chmurze
- [Przewodnik po Hetzner](/pl/install/hetzner) — konfiguracja Docker
- [Tailscale](/pl/gateway/tailscale) — zdalny dostęp
- [Węzły](/pl/nodes) — sparuj laptop/telefon z gateway Pi
