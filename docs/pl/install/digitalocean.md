---
read_when:
    - Konfigurowanie OpenClaw na DigitalOcean
    - Szukasz prostego płatnego VPS dla OpenClaw
summary: Hostowanie OpenClaw na Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-05T13:56:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b161db8ec643d8313938a2453ce6242fc1ee8ea1fd2069916276f1aadeb71f1
    source_path: install/digitalocean.md
    workflow: 15
---

# DigitalOcean

Uruchom trwały Gateway OpenClaw na Droplet DigitalOcean.

## Wymagania wstępne

- Konto DigitalOcean ([rejestracja](https://cloud.digitalocean.com/registrations/new))
- Para kluczy SSH (lub gotowość do użycia uwierzytelniania hasłem)
- Około 20 minut

## Konfiguracja

<Steps>
  <Step title="Utwórz Droplet">
    <Warning>
    Użyj czystego obrazu bazowego (Ubuntu 24.04 LTS). Unikaj obrazów Marketplace 1-click od firm trzecich, chyba że sprawdzono ich skrypty startowe i domyślne ustawienia zapory.
    </Warning>

    1. Zaloguj się do [DigitalOcean](https://cloud.digitalocean.com/).
    2. Kliknij **Create > Droplets**.
    3. Wybierz:
       - **Region:** Najbliższy Tobie
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** Klucz SSH (zalecane) lub hasło
    4. Kliknij **Create Droplet** i zanotuj adres IP.

  </Step>

  <Step title="Połącz się i zainstaluj">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Kreator przeprowadzi Cię przez uwierzytelnianie modelu, konfigurację kanałów, generowanie tokenu gateway i instalację daemona (systemd).

  </Step>

  <Step title="Dodaj swap (zalecane dla Droplet 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Zweryfikuj gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Uzyskaj dostęp do Control UI">
    Gateway domyślnie wiąże się z loopback. Wybierz jedną z tych opcji.

    **Opcja A: tunel SSH (najprostsza)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Następnie otwórz `http://localhost:18789`.

    **Opcja B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Następnie otwórz `https://<magicdns>/` z dowolnego urządzenia w Twoim tailnet.

    **Opcja C: powiązanie Tailnet (bez Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Następnie otwórz `http://<tailscale-ip>:18789` (wymagany token).

  </Step>
</Steps>

## Rozwiązywanie problemów

**Gateway nie chce się uruchomić** — Uruchom `openclaw doctor --non-interactive` i sprawdź logi poleceniem `journalctl --user -u openclaw-gateway.service -n 50`.

**Port jest już używany** — Uruchom `lsof -i :18789`, aby znaleźć proces, a następnie go zatrzymaj.

**Brak pamięci** — Sprawdź, czy swap jest aktywny poleceniem `free -h`. Jeśli nadal występuje OOM, używaj modeli opartych na API (Claude, GPT) zamiast modeli lokalnych albo przejdź na Droplet 2 GB.

## Następne kroki

- [Channels](/pl/channels) — podłącz Telegram, WhatsApp, Discord i inne
- [Gateway configuration](/gateway/configuration) — wszystkie opcje konfiguracji
- [Updating](/install/updating) — aktualizuj OpenClaw na bieżąco
