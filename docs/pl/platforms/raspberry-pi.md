---
read_when:
    - Konfigurowanie OpenClaw na Raspberry Pi
    - Uruchamianie OpenClaw na urządzeniach ARM
    - Budowanie taniego, zawsze aktywnego osobistego AI
summary: OpenClaw na Raspberry Pi (budżetowa konfiguracja self-hosted)
title: Raspberry Pi (platforma)
x-i18n:
    generated_at: "2026-04-24T09:21:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw na Raspberry Pi

## Cel

Uruchom trwałą, zawsze aktywną Gateway OpenClaw na Raspberry Pi za **~$35-80** jednorazowego kosztu (bez opłat miesięcznych).

Idealne do:

- osobistego asystenta AI działającego 24/7
- huba automatyki domowej
- energooszczędnego, zawsze dostępnego bota Telegram/WhatsApp

## Wymagania sprzętowe

| Model Pi         | RAM     | Działa?    | Uwagi                             |
| ---------------- | ------- | ---------- | --------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ Najlepiej | Najszybszy, zalecany            |
| **Pi 4**         | 4GB     | ✅ Dobrze   | Najlepszy wybór dla większości użytkowników |
| **Pi 4**         | 2GB     | ✅ OK       | Działa, dodaj swap               |
| **Pi 4**         | 1GB     | ⚠️ Ciasno   | Możliwe ze swap, minimalna konfiguracja |
| **Pi 3B+**       | 1GB     | ⚠️ Wolno    | Działa, ale ociężale             |
| **Pi Zero 2 W**  | 512MB   | ❌         | Niezalecane                       |

**Minimalne parametry:** 1GB RAM, 1 rdzeń, 500MB dysku  
**Zalecane:** 2GB+ RAM, system 64-bit, karta SD 16GB+ (albo USB SSD)

## Czego potrzebujesz

- Raspberry Pi 4 albo 5 (zalecane 2GB+)
- karta MicroSD (16GB+) albo USB SSD (lepsza wydajność)
- zasilacz (zalecany oficjalny zasilacz Pi)
- połączenie sieciowe (Ethernet albo WiFi)
- ~30 minut

## 1) Wgraj system operacyjny

Użyj **Raspberry Pi OS Lite (64-bit)** — do serwera bez ekranu nie potrzeba środowiska graficznego.

1. Pobierz [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Wybierz system: **Raspberry Pi OS Lite (64-bit)**
3. Kliknij ikonę koła zębatego (⚙️), aby wstępnie skonfigurować:
   - ustaw hostname: `gateway-host`
   - włącz SSH
   - ustaw nazwę użytkownika/hasło
   - skonfiguruj WiFi (jeśli nie używasz Ethernet)
4. Wgraj system na kartę SD / dysk USB
5. Włóż nośnik i uruchom Pi

## 2) Połącz się przez SSH

```bash
ssh user@gateway-host
# albo użyj adresu IP
ssh user@192.168.x.x
```

## 3) Konfiguracja systemu

```bash
# Zaktualizuj system
sudo apt update && sudo apt upgrade -y

# Zainstaluj podstawowe pakiety
sudo apt install -y git curl build-essential

# Ustaw strefę czasową (ważne dla Cron/przypomnień)
sudo timedatectl set-timezone America/Chicago  # Zmień na swoją strefę czasową
```

## 4) Zainstaluj Node.js 24 (ARM64)

```bash
# Zainstaluj Node.js przez NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Zweryfikuj
node --version  # Powinno pokazać v24.x.x
npm --version
```

## 5) Dodaj swap (ważne dla 2GB lub mniej)

Swap zapobiega awariom z powodu braku pamięci:

```bash
# Utwórz plik swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Uczyń trwałym
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Zoptymalizuj dla małej ilości RAM (zmniejsz swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Zainstaluj OpenClaw

### Opcja A: standardowa instalacja (zalecane)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Opcja B: instalacja do modyfikowania (dla majsterkowania)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Instalacja do modyfikowania daje bezpośredni dostęp do logów i kodu — przydatne przy debugowaniu problemów specyficznych dla ARM.

## 7) Uruchom onboarding

```bash
openclaw onboard --install-daemon
```

Postępuj zgodnie z kreatorem:

1. **Gateway mode:** Local
2. **Auth:** zalecane klucze API (OAuth bywa kłopotliwe na bezgłowym Pi)
3. **Channels:** najłatwiej zacząć od Telegram
4. **Daemon:** tak (systemd)

## 8) Zweryfikuj instalację

```bash
# Sprawdź status
openclaw status

# Sprawdź usługę (standardowa instalacja = jednostka użytkownika systemd)
systemctl --user status openclaw-gateway.service

# Zobacz logi
journalctl --user -u openclaw-gateway.service -f
```

## 9) Uzyskaj dostęp do Dashboard OpenClaw

Zastąp `user@gateway-host` swoją nazwą użytkownika Pi oraz hostname lub adresem IP.

Na swoim komputerze poproś Pi o wypisanie świeżego URL Dashboard:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Polecenie wypisze `Dashboard URL:`. W zależności od tego, jak skonfigurowano
`gateway.auth.token`, URL może być zwykłym linkiem `http://127.0.0.1:18789/` albo
linkiem zawierającym `#token=...`.

W innym terminalu na swoim komputerze utwórz tunel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Następnie otwórz wypisany URL Dashboard w lokalnej przeglądarce.

Jeśli interfejs poprosi o uwierzytelnianie współdzielonym sekretem, wklej skonfigurowany token albo hasło
do ustawień Control UI. Dla uwierzytelniania tokenem użyj `gateway.auth.token` (albo
`OPENCLAW_GATEWAY_TOKEN`).

Aby uzyskać stale dostęp zdalny, zobacz [Tailscale](/pl/gateway/tailscale).

---

## Optymalizacje wydajności

### Użyj USB SSD (ogromna poprawa)

Karty SD są wolne i zużywają się. USB SSD znacząco poprawia wydajność:

```bash
# Sprawdź, czy system startuje z USB
lsblk
```

Zobacz [przewodnik uruchamiania Pi z USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot), aby skonfigurować to poprawnie.

### Przyspiesz start CLI (cache kompilacji modułów)

Na słabszych hostach Pi włącz cache kompilacji modułów Node, aby kolejne uruchomienia CLI były szybsze:

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
- `/var/tmp` przetrwa ponowne uruchomienia lepiej niż `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` unika dodatkowego kosztu startu wynikającego z samoczynnego respawn CLI.
- Pierwsze uruchomienie rozgrzewa cache; kolejne korzystają najbardziej.

### Strojenie startu systemd (opcjonalnie)

Jeśli to Pi służy głównie do uruchamiania OpenClaw, dodaj drop-in usługi, aby zmniejszyć
chwiejność restartów i ustabilizować env startowy:

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

Następnie zastosuj:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Jeśli to możliwe, trzymaj stan/cache OpenClaw na pamięci opartej na SSD, aby uniknąć
wąskich gardeł losowego I/O kart SD podczas zimnych startów.

Jeśli to bezgłowe Pi, włącz lingering raz, aby usługa użytkownika przetrwała
wylogowanie:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Jak polityki `Restart=` pomagają w automatycznym odzyskiwaniu:
[systemd może automatyzować odzyskiwanie usług](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Zmniejsz zużycie pamięci

```bash
# Wyłącz przydział pamięci GPU (tryb bez ekranu)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Wyłącz Bluetooth, jeśli niepotrzebny
sudo systemctl disable bluetooth
```

### Monitoruj zasoby

```bash
# Sprawdź pamięć
free -h

# Sprawdź temperaturę CPU
vcgencmd measure_temp

# Monitorowanie na żywo
htop
```

---

## Uwagi specyficzne dla ARM

### Zgodność plików binarnych

Większość funkcji OpenClaw działa na ARM64, ale niektóre zewnętrzne pliki binarne mogą wymagać buildów ARM:

| Narzędzie          | Status ARM64 | Uwagi                              |
| ------------------ | ------------ | ---------------------------------- |
| Node.js            | ✅           | Działa bardzo dobrze               |
| WhatsApp (Baileys) | ✅           | Czysty JS, bez problemów           |
| Telegram           | ✅           | Czysty JS, bez problemów           |
| gog (Gmail CLI)    | ⚠️           | Sprawdź, czy istnieje wydanie ARM  |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Jeśli Skill nie działa, sprawdź, czy jego plik binarny ma build ARM. Wiele narzędzi Go/Rust ma, ale nie wszystkie.

### 32-bit vs 64-bit

**Zawsze używaj systemu 64-bitowego.** Node.js i wiele nowoczesnych narzędzi tego wymaga. Sprawdź przez:

```bash
uname -m
# Powinno pokazać: aarch64 (64-bit), a nie armv7l (32-bit)
```

---

## Zalecana konfiguracja modelu

Ponieważ Pi działa tylko jako Gateway (modele uruchamiane są w chmurze), używaj modeli opartych na API:

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

**Nie próbuj uruchamiać lokalnych LLM na Pi** — nawet małe modele są za wolne. Niech Claude/GPT wykonują ciężką pracę.

---

## Automatyczny start przy boot

Onboarding ustawia to automatycznie, ale aby zweryfikować:

```bash
# Sprawdź, czy usługa jest włączona
systemctl --user is-enabled openclaw-gateway.service

# Włącz, jeśli nie
systemctl --user enable openclaw-gateway.service

# Start przy uruchamianiu systemu
systemctl --user start openclaw-gateway.service
```

---

## Rozwiązywanie problemów

### Brak pamięci (OOM)

```bash
# Sprawdź pamięć
free -h

# Dodaj więcej swap (zobacz krok 5)
# Albo zmniejsz liczbę usług działających na Pi
```

### Powolne działanie

- Używaj USB SSD zamiast karty SD
- Wyłącz nieużywane usługi: `sudo systemctl disable cups bluetooth avahi-daemon`
- Sprawdź throttling CPU: `vcgencmd get_throttled` (powinno zwrócić `0x0`)

### Usługa nie uruchamia się

```bash
# Sprawdź logi
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Typowa naprawa: przebuduj
cd ~/openclaw  # jeśli używasz instalacji do modyfikowania
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problemy z plikami binarnymi ARM

Jeśli Skill kończy się błędem „exec format error”:

1. Sprawdź, czy plik binarny ma build ARM64
2. Spróbuj zbudować go ze źródeł
3. Albo użyj kontenera Docker z obsługą ARM

### Zrywanie WiFi

Dla bezgłowych Pi na WiFi:

```bash
# Wyłącz zarządzanie energią WiFi
sudo iwconfig wlan0 power off

# Uczyń trwałym
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Porównanie kosztów

| Konfiguracja      | Koszt jednorazowy | Koszt miesięczny | Uwagi                     |
| ----------------- | ----------------- | ---------------- | ------------------------- |
| **Pi 4 (2GB)**    | ~$45              | $0               | + prąd (~$5/rok)          |
| **Pi 4 (4GB)**    | ~$55              | $0               | Zalecane                  |
| **Pi 5 (4GB)**    | ~$60              | $0               | Najlepsza wydajność       |
| **Pi 5 (8GB)**    | ~$80              | $0               | Przesada, ale przyszłościowe |
| DigitalOcean      | $0                | $6/mies.         | $72/rok                   |
| Hetzner           | $0                | €3.79/mies.      | ~$50/rok                  |

**Punkt opłacalności:** Pi zwraca się po ~6-12 miesiącach względem chmurowego VPS.

---

## Powiązane

- [Przewodnik po Linux](/pl/platforms/linux) — ogólna konfiguracja Linux
- [Przewodnik po DigitalOcean](/pl/install/digitalocean) — alternatywa chmurowa
- [Przewodnik po Hetzner](/pl/install/hetzner) — konfiguracja Docker
- [Tailscale](/pl/gateway/tailscale) — dostęp zdalny
- [Node](/pl/nodes) — sparuj laptop lub telefon z gateway na Pi
