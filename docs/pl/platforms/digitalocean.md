---
read_when:
    - Konfigurowanie OpenClaw na DigitalOcean
    - Szukasz taniego hostingu VPS dla OpenClaw
summary: OpenClaw na DigitalOcean (prosta płatna opcja VPS)
title: DigitalOcean (platforma)
x-i18n:
    generated_at: "2026-04-30T10:03:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw na DigitalOcean

## Cel

Uruchom trwały OpenClaw Gateway na DigitalOcean za **6 USD miesięcznie** (lub 4 USD/mies. przy cenie rezerwowanej).

Jeśli chcesz opcję za 0 USD miesięcznie i nie przeszkadza Ci ARM oraz konfiguracja specyficzna dla dostawcy, zobacz [przewodnik Oracle Cloud](/pl/install/oracle).

## Porównanie kosztów (2026)

| Dostawca     | Plan            | Specyfikacja                  | Cena/mies.    | Uwagi                                 |
| ------------ | --------------- | ----------------------------- | ------------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | do 4 OCPU, 24GB RAM           | 0 USD         | ARM, ograniczona dostępność / osobliwości rejestracji |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM               | 3,79 EUR (~4 USD) | Najtańsza płatna opcja             |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM               | 6 USD         | Prosty UI, dobra dokumentacja         |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM               | 6 USD         | Wiele lokalizacji                     |
| Linode       | Nanode          | 1 vCPU, 1GB RAM               | 5 USD         | Teraz część Akamai                    |

**Wybór dostawcy:**

- DigitalOcean: najprostszy UX + przewidywalna konfiguracja (ten przewodnik)
- Hetzner: dobry stosunek ceny do wydajności (zobacz [przewodnik Hetzner](/pl/install/hetzner))
- Oracle Cloud: może kosztować 0 USD miesięcznie, ale jest bardziej kapryśny i działa tylko na ARM (zobacz [przewodnik Oracle](/pl/install/oracle))

---

## Wymagania wstępne

- Konto DigitalOcean ([rejestracja z darmowym kredytem 200 USD](https://m.do.co/c/signup))
- Para kluczy SSH (lub gotowość do użycia uwierzytelniania hasłem)
- Około 20 minut

## 1) Utwórz Droplet

<Warning>
Użyj czystego obrazu bazowego (Ubuntu 24.04 LTS). Unikaj obrazów 1-click z Marketplace od firm trzecich, chyba że sprawdzono ich skrypty startowe i domyślne ustawienia zapory.
</Warning>

1. Zaloguj się do [DigitalOcean](https://cloud.digitalocean.com/)
2. Kliknij **Create → Droplets**
3. Wybierz:
   - **Region:** najbliższy Tobie (lub Twoim użytkownikom)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **6 USD/mies.** (1 vCPU, 1GB RAM, 25GB SSD)
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

- Uwierzytelnianie modelu (klucze API lub OAuth)
- Konfigurację kanałów (Telegram, WhatsApp, Discord itd.)
- Token Gateway (generowany automatycznie)
- Instalację demona (systemd)

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

- Serve utrzymuje Gateway dostępny tylko przez loopback i uwierzytelnia ruch Control UI/WebSocket za pomocą nagłówków tożsamości Tailscale (uwierzytelnianie bez tokenu zakłada zaufany host Gateway; interfejsy API HTTP nie używają tych nagłówków Tailscale i zamiast tego działają zgodnie ze zwykłym trybem uwierzytelniania HTTP Gateway).
- Aby zamiast tego wymagać jawnych poświadczeń współdzielonego sekretu, ustaw `gateway.auth.allowTailscale: false` i użyj `gateway.auth.mode: "token"` albo `"password"`.

**Opcja C: powiązanie tailnet (bez Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Otwórz: `http://<tailscale-ip>:18789` (wymagany token).

## 7) Połącz swoje kanały

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

Zobacz [Kanały](/pl/channels), aby poznać innych dostawców.

---

## Optymalizacje dla 1GB RAM

Droplet za 6 USD ma tylko 1GB RAM. Aby wszystko działało płynnie:

### Dodaj swap (zalecane)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Użyj lżejszego modelu

Jeśli trafiasz na błędy OOM, rozważ:

- Użycie modeli opartych na API (Claude, GPT) zamiast modeli lokalnych
- Ustawienie `agents.defaults.model.primary` na mniejszy model

### Monitoruj pamięć

```bash
free -h
htop
```

---

## Trwałość

Cały stan znajduje się w:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` dla poszczególnych agentów, stan kanałów/dostawców oraz dane sesji
- `~/.openclaw/workspace/` — workspace (SOUL.md, pamięć itd.)

Przetrwają ponowne uruchomienia. Regularnie twórz ich kopie zapasowe:

```bash
openclaw backup create
```

---

## Darmowa alternatywa Oracle Cloud

Oracle Cloud oferuje instancje ARM **Always Free**, które są znacznie wydajniejsze niż jakakolwiek płatna opcja tutaj — za 0 USD miesięcznie.

| Co otrzymujesz      | Specyfikacja                  |
| ------------------- | ----------------------------- |
| **4 OCPU**          | ARM Ampere A1                 |
| **24GB RAM**        | Więcej niż wystarczająco      |
| **200GB przestrzeni** | Wolumen blokowy             |
| **Zawsze darmowe**  | Brak obciążeń karty kredytowej |

**Zastrzeżenia:**

- Rejestracja może być kapryśna (spróbuj ponownie, jeśli się nie powiedzie)
- Architektura ARM — większość rzeczy działa, ale niektóre pliki binarne wymagają kompilacji ARM

Pełny przewodnik konfiguracji znajdziesz w [Oracle Cloud](/pl/install/oracle). Wskazówki dotyczące rejestracji i rozwiązywania problemów z procesem zapisu znajdziesz w tym [przewodniku społeczności](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Rozwiązywanie problemów

### Gateway nie uruchamia się

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

## Powiązane

- [Przewodnik Hetzner](/pl/install/hetzner) — tańszy, wydajniejszy
- [Instalacja Docker](/pl/install/docker) — konfiguracja skonteneryzowana
- [Tailscale](/pl/gateway/tailscale) — bezpieczny dostęp zdalny
- [Konfiguracja](/pl/gateway/configuration) — pełna dokumentacja konfiguracji
