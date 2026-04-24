---
read_when:
    - Konfigurowanie OpenClaw na DigitalOcean
    - Szukasz taniego hostingu VPS dla OpenClaw
summary: OpenClaw na DigitalOcean (prosta płatna opcja VPS)
title: DigitalOcean (platforma)
x-i18n:
    generated_at: "2026-04-24T09:20:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw na DigitalOcean

## Cel

Uruchom trwałe Gateway OpenClaw na DigitalOcean za **6 USD/miesiąc** (albo 4 USD/miesiąc przy cenie rezerwowanej).

Jeśli chcesz opcji za 0 USD/miesiąc i nie przeszkadza ci ARM + konfiguracja specyficzna dla dostawcy, zobacz [przewodnik Oracle Cloud](/pl/install/oracle).

## Porównanie kosztów (2026)

| Provider     | Plan            | Specs                  | Price/mo        | Notes                                     |
| ------------ | --------------- | ---------------------- | --------------- | ----------------------------------------- |
| Oracle Cloud | Always Free ARM | do 4 OCPU, 24 GB RAM   | $0              | ARM, ograniczona dostępność / problemy przy rejestracji |
| Hetzner      | CX22            | 2 vCPU, 4 GB RAM       | €3.79 (~$4)     | Najtańsza płatna opcja                    |
| DigitalOcean | Basic           | 1 vCPU, 1 GB RAM       | $6              | Prosty interfejs, dobra dokumentacja      |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB RAM       | $6              | Wiele lokalizacji                         |
| Linode       | Nanode          | 1 vCPU, 1 GB RAM       | $5              | Obecnie część Akamai                      |

**Wybór dostawcy:**

- DigitalOcean: najprostszy UX + przewidywalna konfiguracja (ten przewodnik)
- Hetzner: dobry stosunek ceny do wydajności (zobacz [przewodnik Hetzner](/pl/install/hetzner))
- Oracle Cloud: może kosztować 0 USD/miesiąc, ale jest bardziej kapryśny i tylko ARM (zobacz [przewodnik Oracle](/pl/install/oracle))

---

## Wymagania wstępne

- Konto DigitalOcean ([rejestracja z 200 USD darmowego kredytu](https://m.do.co/c/signup))
- Para kluczy SSH (albo gotowość do użycia uwierzytelniania hasłem)
- Około 20 minut

## 1) Utwórz Droplet

<Warning>
Użyj czystego obrazu bazowego (Ubuntu 24.04 LTS). Unikaj zewnętrznych obrazów Marketplace typu 1-click, chyba że sprawdziłeś ich skrypty startowe i domyślne ustawienia zapory.
</Warning>

1. Zaloguj się do [DigitalOcean](https://cloud.digitalocean.com/)
2. Kliknij **Create → Droplets**
3. Wybierz:
   - **Region:** najbliższy tobie (albo twoim użytkownikom)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **6 USD/mies.** (1 vCPU, 1 GB RAM, 25 GB SSD)
   - **Authentication:** klucz SSH (zalecane) albo hasło
4. Kliknij **Create Droplet**
5. Zanotuj adres IP

## 2) Połącz się przez SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Zainstaluj OpenClaw

```bash
# Zaktualizuj system
apt update && apt upgrade -y

# Zainstaluj Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Zainstaluj OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Zweryfikuj
openclaw --version
```

## 4) Uruchom onboarding

```bash
openclaw onboard --install-daemon
```

Kreator przeprowadzi cię przez:

- uwierzytelnianie modelu (klucze API albo OAuth)
- konfigurację kanałów (Telegram, WhatsApp, Discord itd.)
- token Gateway (generowany automatycznie)
- instalację daemona (systemd)

## 5) Zweryfikuj Gateway

```bash
# Sprawdź status
openclaw status

# Sprawdź usługę
systemctl --user status openclaw-gateway.service

# Wyświetl logi
journalctl --user -u openclaw-gateway.service -f
```

## 6) Uzyskaj dostęp do Dashboardu

Gateway domyślnie wiąże się z loopback. Aby uzyskać dostęp do Control UI:

**Opcja A: tunel SSH (zalecana)**

```bash
# Z twojej lokalnej maszyny
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Następnie otwórz: http://localhost:18789
```

**Opcja B: Tailscale Serve (HTTPS, tylko loopback)**

```bash
# Na droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Skonfiguruj Gateway do używania Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Otwórz: `https://<magicdns>/`

Uwagi:

- Serve utrzymuje Gateway tylko na loopback i uwierzytelnia ruch Control UI/WebSocket przez nagłówki tożsamości Tailscale (beztokenowe auth zakłada zaufany host gateway; HTTP API nie używają tych nagłówków Tailscale i zamiast tego stosują zwykły tryb auth HTTP gateway).
- Aby zamiast tego wymagać jawnych poświadczeń opartych na współdzielonym sekrecie, ustaw `gateway.auth.allowTailscale: false` i użyj `gateway.auth.mode: "token"` albo `"password"`.

**Opcja C: bind tailnet (bez Serve)**

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
# Zeskanuj kod QR
```

Pozostałych dostawców znajdziesz w [Kanałach](/pl/channels).

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

Jeśli trafiasz na OOM, rozważ:

- używanie modeli opartych na API (Claude, GPT) zamiast modeli lokalnych
- ustawienie `agents.defaults.model.primary` na mniejszy model

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

## Alternatywa Oracle Cloud Free

Oracle Cloud oferuje instancje ARM **Always Free**, które są znacznie mocniejsze niż każda płatna opcja tutaj — za 0 USD/miesiąc.

| Co otrzymujesz    | Specs                  |
| ----------------- | ---------------------- |
| **4 OCPU**        | ARM Ampere A1          |
| **24 GB RAM**     | Więcej niż wystarczająco |
| **200 GB storage**| Wolumen blokowy        |
| **Zawsze darmowe**| Brak opłat na karcie   |

**Ograniczenia:**

- Rejestracja bywa kapryśna (spróbuj ponownie, jeśli się nie uda)
- Architektura ARM — większość rzeczy działa, ale część binarek wymaga buildów ARM

Pełny przewodnik konfiguracji znajdziesz w [Oracle Cloud](/pl/install/oracle). Wskazówki dotyczące rejestracji i rozwiązywania problemów z procesem zapisu znajdziesz w tym [przewodniku społeczności](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

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

### Za mało pamięci

```bash
# Sprawdź pamięć
free -h

# Dodaj więcej swap
# Albo przejdź na droplet za 12 USD/mies. (2 GB RAM)
```

---

## Powiązane

- [Przewodnik Hetzner](/pl/install/hetzner) — taniej i wydajniej
- [Instalacja Docker](/pl/install/docker) — konfiguracja kontenerowa
- [Tailscale](/pl/gateway/tailscale) — bezpieczny dostęp zdalny
- [Konfiguracja](/pl/gateway/configuration) — pełna dokumentacja konfiguracji
