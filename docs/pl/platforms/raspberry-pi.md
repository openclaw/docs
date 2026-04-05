---
read_when:
    - Konfiguracja OpenClaw na Raspberry Pi
    - Uruchamianie OpenClaw na urządzeniach ARM
    - Budowanie taniego, zawsze włączonego osobistego AI
summary: OpenClaw na Raspberry Pi (budżetowa konfiguracja self-hosted)
title: Raspberry Pi (Platforma)
x-i18n:
    generated_at: "2026-04-05T14:01:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07f34e91899b7e0a31d9b944f3cb0cfdd4ecdeba58b619ae554379abdbf37eaf
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw na Raspberry Pi

## Cel

Uruchom trwałą, zawsze włączoną bramę OpenClaw Gateway na Raspberry Pi przy **~35-80 USD** jednorazowego kosztu (bez miesięcznych opłat).

Idealne do:

- osobistego asystenta AI działającego 24/7
- centrum automatyki domowej
- energooszczędnego, zawsze dostępnego bota Telegram/WhatsApp

## Wymagania sprzętowe

| Model Pi         | RAM     | Działa?  | Uwagi                              |
| ---------------- | ------- | -------- | ---------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ Najlepsze | Najszybsze, zalecane            |
| **Pi 4**         | 4GB     | ✅ Dobre | Najlepszy wybór dla większości użytkowników |
| **Pi 4**         | 2GB     | ✅ OK    | Działa, dodaj swap                 |
| **Pi 4**         | 1GB     | ⚠️ Mało miejsca | Możliwe ze swapem, minimalna konfiguracja |
| **Pi 3B+**       | 1GB     | ⚠️ Wolne | Działa, ale jest ospałe            |
| **Pi Zero 2 W**  | 512MB   | ❌       | Niezalecane                        |

**Minimalne wymagania:** 1GB RAM, 1 rdzeń, 500MB miejsca na dysku  
**Zalecane:** 2GB+ RAM, system 64-bitowy, karta SD 16GB+ (lub dysk USB SSD)

## Czego potrzebujesz

- Raspberry Pi 4 lub 5 (zalecane 2GB+)
- karta MicroSD (16GB+) lub dysk USB SSD (lepsza wydajność)
- zasilacz (zalecany oficjalny zasilacz Pi)
- połączenie sieciowe (Ethernet lub WiFi)
- ~30 minut

## 1) Wgraj system operacyjny

Użyj **Raspberry Pi OS Lite (64-bit)** — do serwera bez monitora nie jest potrzebne środowisko graficzne.

1. Pobierz [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Wybierz system: **Raspberry Pi OS Lite (64-bit)**
3. Kliknij ikonę koła zębatego (⚙️), aby wstępnie skonfigurować:
   - Ustaw hostname: `gateway-host`
   - Włącz SSH
   - Ustaw nazwę użytkownika/hasło
   - Skonfiguruj WiFi (jeśli nie używasz Ethernetu)
4. Wgraj system na kartę SD / dysk USB
5. Włóż nośnik i uruchom Pi

## 2) Połącz się przez SSH

```bash
ssh user@gateway-host
# lub użyj adresu IP
ssh user@192.168.x.x
```

## 3) Konfiguracja systemu

```bash
# Zaktualizuj system
sudo apt update && sudo apt upgrade -y

# Zainstaluj podstawowe pakiety
sudo apt install -y git curl build-essential

# Ustaw strefę czasową (ważne dla cron/przypomnień)
sudo timedatectl set-timezone America/Chicago  # Zmień na swoją strefę czasową
```

## 4) Zainstaluj Node.js 24 (ARM64)

```bash
# Zainstaluj Node.js przez NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Weryfikacja
node --version  # Powinno pokazać v24.x.x
npm --version
```

## 5) Dodaj swap (ważne przy 2GB lub mniej)

Swap zapobiega awariom spowodowanym brakiem pamięci:

```bash
# Utwórz plik swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Ustaw na stałe
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Zoptymalizuj dla małej ilości RAM (zmniejsz swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Zainstaluj OpenClaw

### Opcja A: Instalacja standardowa (zalecana)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Opcja B: Instalacja z możliwością modyfikacji (dla lubiących eksperymenty)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Ta instalacja daje bezpośredni dostęp do logów i kodu — przydatne do debugowania problemów specyficznych dla ARM.

## 7) Uruchom onboarding

```bash
openclaw onboard --install-daemon
```

Postępuj zgodnie z kreatorem:

1. **Tryb Gateway:** Local
2. **Uwierzytelnianie:** zalecane klucze API (OAuth może być kapryśny na Pi bez monitora)
3. **Kanały:** najłatwiej zacząć od Telegram
4. **Daemon:** Yes (systemd)

## 8) Zweryfikuj instalację

```bash
# Sprawdź status
openclaw status

# Sprawdź usługę (instalacja standardowa = jednostka użytkownika systemd)
systemctl --user status openclaw-gateway.service

# Wyświetl logi
journalctl --user -u openclaw-gateway.service -f
```

## 9) Otwórz pulpit OpenClaw

Zamień `user@gateway-host` na nazwę użytkownika Pi oraz hostname albo adres IP.

Na swoim komputerze poproś Pi o wypisanie nowego adresu URL pulpitu:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Polecenie wypisze `Dashboard URL:`. W zależności od konfiguracji
`gateway.auth.token` adres URL może być zwykłym linkiem `http://127.0.0.1:18789/`
albo takim, który zawiera `#token=...`.

W innym terminalu na swoim komputerze utwórz tunel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Następnie otwórz wypisany adres URL pulpitu w lokalnej przeglądarce.

Jeśli interfejs poprosi o uwierzytelnianie wspólnym sekretem, wklej
skonfigurowany token lub hasło w ustawieniach Control UI. W przypadku
uwierzytelniania tokenem użyj `gateway.auth.token` (lub
`OPENCLAW_GATEWAY_TOKEN`).

Aby uzyskać zawsze dostępny zdalny dostęp, zobacz [Tailscale](/pl/gateway/tailscale).

---

## Optymalizacje wydajności

### Użyj dysku USB SSD (ogromna poprawa)

Karty SD są wolne i się zużywają. Dysk USB SSD znacząco poprawia wydajność:

```bash
# Sprawdź, czy system startuje z USB
lsblk
```

Instrukcję konfiguracji znajdziesz w [przewodniku uruchamiania Pi z USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

### Przyspiesz uruchamianie CLI (cache kompilacji modułów)

Na mniej wydajnych hostach Pi włącz cache kompilacji modułów Node, aby przyspieszyć powtarzane uruchomienia CLI:

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
- `/var/tmp` zachowuje się po restartach lepiej niż `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` eliminuje dodatkowy koszt startu związany z samoczynnym ponownym uruchamianiem CLI.
- Pierwsze uruchomienie nagrzewa cache; kolejne korzystają najbardziej.

### Dostrajanie uruchamiania systemd (opcjonalne)

Jeśli ten Pi służy głównie do uruchamiania OpenClaw, dodaj drop-in usługi, aby zmniejszyć
niestabilność restartów i utrzymać stabilne środowisko startowe:

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

Jeśli to możliwe, przechowuj stan/cache OpenClaw na pamięci opartej na SSD, aby uniknąć
wąskich gardeł losowego I/O kart SD podczas zimnego startu.

Jeśli to Pi bez monitora, włącz lingering raz, aby usługa użytkownika działała także po wylogowaniu:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Jak polityki `Restart=` pomagają w automatycznym odzyskiwaniu:
[systemd może automatyzować odzyskiwanie usług](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Zmniejsz użycie pamięci

```bash
# Wyłącz przydział pamięci dla GPU (tryb bez monitora)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Wyłącz Bluetooth, jeśli nie jest potrzebny
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

### Zgodność binarna

Większość funkcji OpenClaw działa na ARM64, ale niektóre zewnętrzne binaria mogą wymagać kompilacji dla ARM:

| Narzędzie         | Status ARM64 | Uwagi                               |
| ----------------- | ------------ | ----------------------------------- |
| Node.js           | ✅           | Działa świetnie                     |
| WhatsApp (Baileys) | ✅          | Czysty JS, bez problemów            |
| Telegram          | ✅           | Czysty JS, bez problemów            |
| gog (Gmail CLI)   | ⚠️           | Sprawdź, czy jest wydanie dla ARM   |
| Chromium (browser) | ✅          | `sudo apt install chromium-browser` |

Jeśli jakiś Skill nie działa, sprawdź, czy jego binarium ma kompilację dla ARM. Wiele narzędzi w Go/Rust ją ma, część nie.

### 32-bit vs 64-bit

**Zawsze używaj systemu 64-bitowego.** Node.js i wiele nowoczesnych narzędzi tego wymaga. Sprawdź poleceniem:

```bash
uname -m
# Powinno pokazać: aarch64 (64-bit), a nie armv7l (32-bit)
```

---

## Zalecana konfiguracja modeli

Ponieważ Pi działa tylko jako Gateway (modele działają w chmurze), użyj modeli opartych na API:

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

**Nie próbuj uruchamiać lokalnych LLM-ów na Pi** — nawet małe modele są zbyt wolne. Niech Claude/GPT wykonują ciężką pracę.

---

## Automatyczne uruchamianie po starcie

Onboarding to konfiguruje, ale aby to sprawdzić:

```bash
# Sprawdź, czy usługa jest włączona
systemctl --user is-enabled openclaw-gateway.service

# Włącz, jeśli nie jest
systemctl --user enable openclaw-gateway.service

# Uruchom przy starcie
systemctl --user start openclaw-gateway.service
```

---

## Rozwiązywanie problemów

### Brak pamięci (OOM)

```bash
# Sprawdź pamięć
free -h

# Dodaj więcej swapu (zobacz krok 5)
# Lub zmniejsz liczbę usług działających na Pi
```

### Niska wydajność

- Użyj dysku USB SSD zamiast karty SD
- Wyłącz nieużywane usługi: `sudo systemctl disable cups bluetooth avahi-daemon`
- Sprawdź ograniczanie CPU: `vcgencmd get_throttled` (powinno zwrócić `0x0`)

### Usługa nie uruchamia się

```bash
# Sprawdź logi
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Typowa naprawa: przebudowa
cd ~/openclaw  # jeśli używasz instalacji z możliwością modyfikacji
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problemy z binariami ARM

Jeśli jakiś Skill kończy się błędem „exec format error”:

1. Sprawdź, czy binarium ma kompilację ARM64
2. Spróbuj zbudować je ze źródeł
3. Albo użyj kontenera Docker z obsługą ARM

### Zrywanie połączenia WiFi

W przypadku Pi bez monitora działających przez WiFi:

```bash
# Wyłącz zarządzanie energią WiFi
sudo iwconfig wlan0 power off

# Ustaw na stałe
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Porównanie kosztów

| Konfiguracja    | Koszt jednorazowy | Koszt miesięczny | Uwagi                     |
| --------------- | ----------------- | ---------------- | ------------------------- |
| **Pi 4 (2GB)**  | ~$45              | $0               | + prąd (~$5/rok)          |
| **Pi 4 (4GB)**  | ~$55              | $0               | Zalecane                  |
| **Pi 5 (4GB)**  | ~$60              | $0               | Najlepsza wydajność       |
| **Pi 5 (8GB)**  | ~$80              | $0               | Przesada, ale przyszłościowe |
| DigitalOcean    | $0                | $6/mies.         | $72/rok                   |
| Hetzner         | $0                | €3.79/mies.      | ~$50/rok                  |

**Punkt zwrotu:** Pi zwraca się po około 6-12 miesiącach w porównaniu z chmurowym VPS.

---

## Zobacz też

- [Przewodnik po Linuxie](/pl/platforms/linux) — ogólna konfiguracja Linuxa
- [Przewodnik po DigitalOcean](/pl/install/digitalocean) — alternatywa chmurowa
- [Przewodnik po Hetzner](/pl/install/hetzner) — konfiguracja Docker
- [Tailscale](/pl/gateway/tailscale) — zdalny dostęp
- [Nodes](/pl/nodes) — sparuj laptopa/telefon z bramą Pi
