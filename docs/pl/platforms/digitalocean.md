---
read_when:
    - Konfigurowanie OpenClaw na DigitalOcean
    - Szukasz taniego hostingu VPS dla OpenClaw
summary: OpenClaw na DigitalOcean (prosta płatna opcja VPS)
title: DigitalOcean (Platform)
x-i18n:
    generated_at: "2026-04-05T13:59:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ee4ad84c421f87064534a4fb433df1f70304502921841ec618318ed862d4092
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw na DigitalOcean

## Cel

Uruchom trwały Gateway OpenClaw na DigitalOcean za **6 USD/miesiąc** (lub 4 USD/mies. przy cenie z rezerwacją).

Jeśli chcesz opcję za 0 USD/miesiąc i nie przeszkadza Ci ARM oraz konfiguracja specyficzna dla dostawcy, zobacz [przewodnik po Oracle Cloud](/platforms/oracle).

## Porównanie kosztów (2026)

| Dostawca     | Plan             | Specyfikacja            | Cena/mies.   | Uwagi                                  |
| ------------ | ---------------- | ----------------------- | ------------ | -------------------------------------- |
| Oracle Cloud | Always Free ARM  | do 4 OCPU, 24 GB RAM    | 0 USD        | ARM, ograniczona pojemność / problemy przy rejestracji |
| Hetzner      | CX22             | 2 vCPU, 4 GB RAM        | €3.79 (~4 USD) | Najtańsza płatna opcja                 |
| DigitalOcean | Basic            | 1 vCPU, 1 GB RAM        | 6 USD        | Prosty interfejs, dobra dokumentacja   |
| Vultr        | Cloud Compute    | 1 vCPU, 1 GB RAM        | 6 USD        | Wiele lokalizacji                      |
| Linode       | Nanode           | 1 vCPU, 1 GB RAM        | 5 USD        | Teraz część Akamai                     |

**Wybór dostawcy:**

- DigitalOcean: najprostszy UX + przewidywalna konfiguracja (ten przewodnik)
- Hetzner: dobra cena/wydajność (zobacz [przewodnik po Hetzner](/install/hetzner))
- Oracle Cloud: może kosztować 0 USD/miesiąc, ale jest bardziej kapryśny i tylko ARM (zobacz [przewodnik po Oracle](/platforms/oracle))

---

## Wymagania wstępne

- Konto DigitalOcean ([rejestracja z kredytem 200 USD](https://m.do.co/c/signup))
- Para kluczy SSH (lub gotowość do użycia uwierzytelniania hasłem)
- Około 20 minut

## 1) Utwórz Droplet

<Warning>
Użyj czystego obrazu bazowego (Ubuntu 24.04 LTS). Unikaj obrazów Marketplace 1-click od firm trzecich, chyba że sprawdzono ich skrypty startowe i domyślne ustawienia zapory.
</Warning>

1. Zaloguj się do [DigitalOcean](https://cloud.digitalocean.com/)
2. Kliknij **Create → Droplets**
3. Wybierz:
   - **Region:** najbliższy Tobie (lub Twoim użytkownikom)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **6 USD/mies.** (1 vCPU, 1 GB RAM, 25 GB SSD)
   - **Authentication:** klucz SSH (zalecane) lub hasło
4. Kliknij **Create Droplet**
5. Zanotuj adres IP

## 2) Połącz się przez SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Zainstaluj OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Uruchom onboarding

```bash
openclaw onboard --install-daemon
```

Kreator przeprowadzi Cię przez:

- uwierzytelnianie modelu (klucze API lub OAuth)
- konfigurację kanałów (Telegram, WhatsApp, Discord itd.)
- token gateway (generowany automatycznie)
- instalację daemona (systemd)

## 5) Zweryfikuj Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Uzyskaj dostęp do panelu

Gateway domyślnie wiąże się z loopback. Aby uzyskać dostęp do Control UI:

**Opcja A: tunel SSH (zalecane)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Opcja B: Tailscale Serve (HTTPS, tylko loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Otwórz: `https://<magicdns>/`

Uwagi:

- Serve utrzymuje Gateway tylko na loopback i uwierzytelnia ruch Control UI/WebSocket za pomocą nagłówków tożsamości Tailscale (uwierzytelnianie bez tokenu zakłada zaufanego hosta gateway; HTTP API nie używa tych nagłówków Tailscale i zamiast tego stosuje normalny tryb uwierzytelniania HTTP gateway).
- Aby zamiast tego wymagać jawnych poświadczeń współdzielonego sekretu, ustaw `gateway.auth.allowTailscale: false` i użyj `gateway.auth.mode: "token"` lub `"password"`.

**Opcja C: bind Tailnet (bez Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Otwórz: `http://<tailscale-ip>:18789` (wymagany token).

## 7) Podłącz swoje kanały

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Zobacz [Channels](/pl/channels), aby poznać innych dostawców.

---

## Optymalizacje dla 1 GB RAM

Droplet za 6 USD ma tylko 1 GB RAM. Aby wszystko działało płynnie:

### Dodaj swap (zalecane)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Użyj lżejszego modelu

Jeśli trafiasz na OOM:

- używaj modeli opartych na API (Claude, GPT) zamiast modeli lokalnych
- ustaw `agents.defaults.model.primary` na mniejszy model

### Monitoruj pamięć

```bash
free -h
htop
```

---

## Trwałość

Cały stan znajduje się w:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, stan kanałów/dostawców i dane sesji
- `~/.openclaw/workspace/` — obszar roboczy (SOUL.md, pamięć itd.)

Te dane przetrwają restarty. Twórz ich kopie zapasowe okresowo:

```bash
openclaw backup create
```

---

## Darmowa alternatywa Oracle Cloud

Oracle Cloud oferuje instancje ARM **Always Free**, które są znacznie mocniejsze niż jakakolwiek płatna opcja tutaj — za 0 USD/miesiąc.

| Co otrzymujesz    | Specyfikacja           |
| ----------------- | ---------------------- |
| **4 OCPU**        | ARM Ampere A1          |
| **24 GB RAM**     | Więcej niż wystarczająco |
| **200 GB storage** | Wolumen blokowy       |
| **Na zawsze za darmo** | Bez opłat z karty kredytowej |

**Zastrzeżenia:**

- Rejestracja może być kapryśna (spróbuj ponownie, jeśli się nie uda)
- Architektura ARM — większość rzeczy działa, ale niektóre binaria wymagają buildów ARM

Pełny przewodnik konfiguracji znajdziesz w [Oracle Cloud](/platforms/oracle). Wskazówki dotyczące rejestracji i rozwiązywania problemów z procesem zapisu znajdziesz w tym [przewodniku społeczności](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Rozwiązywanie problemów

### Gateway nie chce się uruchomić

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Port jest już używany

```bash
lsof -i :18789
kill <PID>
```

### Brak pamięci

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Zobacz też

- [przewodnik po Hetzner](/install/hetzner) — taniej, większa moc
- [instalacja Docker](/install/docker) — konfiguracja konteneryzowana
- [Tailscale](/gateway/tailscale) — bezpieczny zdalny dostęp
- [Configuration](/gateway/configuration) — pełna dokumentacja konfiguracji
