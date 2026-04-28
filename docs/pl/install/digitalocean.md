---
read_when:
    - Konfigurowanie OpenClaw na DigitalOcean
    - Szukasz prostego płatnego VPS dla OpenClaw
summary: Hostuj OpenClaw na Droplet DigitalOcean
title: DigitalOcean
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T09:16:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

Uruchom trwałe Gateway OpenClaw na Droplet DigitalOcean.

## Wymagania wstępne

- Konto DigitalOcean ([rejestracja](https://cloud.digitalocean.com/registrations/new))
- Para kluczy SSH (albo gotowość do użycia uwierzytelniania hasłem)
- Około 20 minut

## Konfiguracja

<Steps>
  <Step title="Utwórz Droplet">
    <Warning>
    Użyj czystego obrazu bazowego (Ubuntu 24.04 LTS). Unikaj zewnętrznych obrazów Marketplace typu 1-click, chyba że sprawdziłeś ich skrypty startowe i domyślne ustawienia zapory.
    </Warning>

    1. Zaloguj się do [DigitalOcean](https://cloud.digitalocean.com/).
    2. Kliknij **Create > Droplets**.
    3. Wybierz:
       - **Region:** najbliższy tobie
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** klucz SSH (zalecane) albo hasło
    4. Kliknij **Create Droplet** i zanotuj adres IP.

  </Step>

  <Step title="Połącz się i zainstaluj">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Zainstaluj Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Zainstaluj OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Kreator przeprowadzi cię przez uwierzytelnianie modelu, konfigurację kanału, generowanie tokenu gateway i instalację daemona (systemd).

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
    # Z twojej lokalnej maszyny
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

    Następnie otwórz `https://<magicdns>/` z dowolnego urządzenia w twoim tailnet.

    **Opcja C: bind tailnet (bez Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Następnie otwórz `http://<tailscale-ip>:18789` (wymagany token).

  </Step>
</Steps>

## Rozwiązywanie problemów

**Gateway nie chce się uruchomić** -- uruchom `openclaw doctor --non-interactive` i sprawdź logi przez `journalctl --user -u openclaw-gateway.service -n 50`.

**Port jest już używany** -- uruchom `lsof -i :18789`, aby znaleźć proces, a następnie go zatrzymaj.

**Za mało pamięci** -- sprawdź, czy swap jest aktywny, używając `free -h`. Jeśli nadal występuje OOM, używaj modeli opartych na API (Claude, GPT) zamiast modeli lokalnych albo przejdź na Droplet 2 GB.

## Następne kroki

- [Kanały](/pl/channels) -- połącz Telegram, WhatsApp, Discord i inne
- [Konfiguracja Gateway](/pl/gateway/configuration) -- wszystkie opcje konfiguracji
- [Aktualizowanie](/pl/install/updating) -- utrzymuj OpenClaw na bieżąco

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Fly.io](/pl/install/fly)
- [Hetzner](/pl/install/hetzner)
- [Hosting VPS](/pl/vps)
