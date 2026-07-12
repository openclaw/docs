---
read_when:
    - Konfigurowanie OpenClaw w DigitalOcean
    - Szukasz prostego płatnego VPS-a dla OpenClaw?
summary: Hostuj OpenClaw na Droplecie DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T15:15:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Uruchom trwale działający Gateway OpenClaw na Droplecie DigitalOcean (około 6 USD miesięcznie za plan Basic z 1 GB pamięci).

DigitalOcean to prosta, płatna opcja VPS. Tańsze lub bezpłatne możliwości:

- [Hetzner](/pl/install/hetzner) — więcej rdzeni i pamięci RAM w przeliczeniu na wydanego dolara.
- [Oracle Cloud](/pl/install/oracle) — bezpłatna warstwa Always Free ARM (do 4 OCPU i 24 GB RAM), ale rejestracja może być problematyczna, a dostępna jest wyłącznie architektura ARM.

## Wymagania wstępne

- Konto DigitalOcean ([rejestracja](https://cloud.digitalocean.com/registrations/new))
- Para kluczy SSH (lub gotowość do użycia uwierzytelniania hasłem)
- Około 20 minut

## Konfiguracja

<Steps>
  <Step title="Utwórz Droplet">
    <Warning>
    Użyj czystego obrazu bazowego (Ubuntu 24.04 LTS). Unikaj obrazów innych firm instalowanych jednym kliknięciem z Marketplace, chyba że sprawdzisz ich skrypty startowe i domyślne ustawienia zapory sieciowej.
    </Warning>

    1. Zaloguj się do [DigitalOcean](https://cloud.digitalocean.com/).
    2. Kliknij **Create > Droplets**.
    3. Wybierz:
       - **Region:** najbliższy Tobie
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** klucz SSH (zalecane) lub hasło
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

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Powłoki użytkownika root używaj wyłącznie do wstępnego przygotowania systemu. Polecenia OpenClaw uruchamiaj jako użytkownik `openclaw` bez uprawnień root, aby stan był przechowywany w `/home/openclaw/.openclaw/`, a Gateway został zainstalowany jako usługa systemd `--user` tego użytkownika.

  </Step>

  <Step title="Uruchom konfigurację początkową">
    ```bash
    openclaw onboard --install-daemon
    ```

    Kreator przeprowadzi Cię przez uwierzytelnianie modelu, konfigurację kanałów, generowanie tokenu Gateway oraz instalację demona (usługi systemd użytkownika).

  </Step>

  <Step title="Dodaj przestrzeń wymiany (zalecane dla Dropletów z 1 GB pamięci)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Sprawdź Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Uzyskaj dostęp do interfejsu sterowania">
    Gateway domyślnie nasłuchuje na local loopback. Wybierz jedną z poniższych opcji.

    **Opcja A: tunel SSH (najprostsza)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Następnie otwórz `http://localhost:18789`.

    **Opcja B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Następnie otwórz `https://<magicdns>/` na dowolnym urządzeniu w swojej sieci tailnet.

    Tailscale Serve uwierzytelnia ruch interfejsu sterowania i WebSocket za pomocą nagłówków tożsamości sieci tailnet, co zakłada, że sam host Gateway jest zaufany. Punkty końcowe HTTP API nadal korzystają ze standardowego trybu uwierzytelniania Gateway (token/hasło), niezależnie od tej konfiguracji. Aby wymagać jawnych współdzielonych danych uwierzytelniających podczas korzystania z Serve, ustaw `gateway.auth.allowTailscale: false` i użyj `gateway.auth.mode: "token"` lub `"password"`.

    **Opcja C: powiązanie z siecią tailnet (bez Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Następnie otwórz `http://<tailscale-ip>:18789` (wymagany token).

  </Step>
</Steps>

## Trwałość danych i kopie zapasowe

Stan OpenClaw jest przechowywany w:

- `~/.openclaw/` — `openclaw.json`, dane uwierzytelniające kanałów i dostawców, pliki `auth-profiles.json` poszczególnych agentów oraz dane sesji.
- `~/.openclaw/workspace/` — przestrzeń robocza agenta (SOUL.md, pamięć, artefakty).

Dane te zachowują się po ponownym uruchomieniu Dropletu. Aby utworzyć przenośną migawkę:

```bash
openclaw backup create
```

Migawki DigitalOcean obejmują cały Droplet, natomiast kopię utworzoną za pomocą `openclaw backup create` można przenosić między hostami.

## Wskazówki dotyczące 1 GB RAM

Droplet za 6 USD ma tylko 1 GB RAM. Aby zapewnić płynne działanie:

- Upewnij się, że krok konfiguracji przestrzeni wymiany opisany powyżej został dodany do `/etc/fstab`, aby ustawienie zachowało się po ponownym uruchomieniu.
- Preferuj modele dostępne przez API (Claude, GPT) zamiast modeli lokalnych — lokalne wnioskowanie LLM nie mieści się w 1 GB pamięci.
- Jeśli przy dużych promptach występują błędy braku pamięci, ustaw `agents.defaults.model.primary` na mniejszy model.
- Monitoruj zasoby za pomocą `free -h` i `htop`.

## Rozwiązywanie problemów

**Gateway nie uruchamia się** — uruchom `openclaw doctor --non-interactive` i sprawdź dzienniki za pomocą `journalctl --user -u openclaw-gateway.service -n 50`.

**Port jest już używany** — uruchom `lsof -i :18789`, aby znaleźć proces, a następnie go zatrzymaj.

**Brak pamięci** — sprawdź za pomocą `free -h`, czy przestrzeń wymiany jest aktywna. Jeśli nadal występują błędy braku pamięci, przełącz się z modeli lokalnych na modele dostępne przez API (Claude, GPT) albo wybierz Droplet z 2 GB pamięci.

## Następne kroki

- [Kanały](/pl/channels) — połącz Telegram, WhatsApp, Discord i inne usługi
- [Konfiguracja Gateway](/pl/gateway/configuration) — wszystkie opcje konfiguracji
- [Aktualizowanie](/pl/install/updating) — dbaj o aktualność OpenClaw

## Powiązane materiały

- [Omówienie instalacji](/pl/install)
- [Fly.io](/pl/install/fly)
- [Hetzner](/pl/install/hetzner)
- [Hosting VPS](/pl/vps)
