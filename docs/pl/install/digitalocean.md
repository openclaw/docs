---
read_when:
    - Konfigurowanie OpenClaw na DigitalOcean
    - Szukasz prostego płatnego VPS-a dla OpenClaw
summary: Hostuj OpenClaw na DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T09:17:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

Uruchom trwały OpenClaw Gateway na Droplecie DigitalOcean (~6 USD/mies. za plan Basic 1 GB).

DigitalOcean to najprostsza płatna ścieżka VPS. Jeśli wolisz tańsze lub darmowe opcje:

- [Hetzner](/pl/install/hetzner) — 3,79 €/mies., więcej rdzeni/RAM za dolara.
- [Oracle Cloud](/pl/install/oracle) — Always Free ARM (do 4 OCPU, 24 GB RAM), ale rejestracja może być kapryśna i dostępna tylko dla ARM.

## Wymagania wstępne

- Konto DigitalOcean ([rejestracja](https://cloud.digitalocean.com/registrations/new))
- Para kluczy SSH (albo gotowość do użycia uwierzytelniania hasłem)
- Około 20 minut

## Konfiguracja

<Steps>
  <Step title="Utwórz Droplet">
    <Warning>
    Użyj czystego obrazu bazowego (Ubuntu 24.04 LTS). Unikaj obrazów 1-click z zewnętrznego Marketplace, chyba że sprawdzono ich skrypty startowe i domyślne ustawienia zapory.
    </Warning>

    1. Zaloguj się do [DigitalOcean](https://cloud.digitalocean.com/).
    2. Kliknij **Create > Droplets**.
    3. Wybierz:
       - **Region:** Najbliższy Tobie
       - **Obraz:** Ubuntu 24.04 LTS
       - **Rozmiar:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Uwierzytelnianie:** klucz SSH (zalecane) albo hasło
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

  <Step title="Uruchom wdrażanie">
    ```bash
    openclaw onboard --install-daemon
    ```

    Kreator prowadzi przez uwierzytelnianie modelu, konfigurację kanału, generowanie tokenu gateway oraz instalację demona (systemd).

  </Step>

  <Step title="Dodaj swap (zalecane dla Dropletów 1 GB)">
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

  <Step title="Uzyskaj dostęp do interfejsu sterowania">
    Domyślnie gateway nasłuchuje na local loopback. Wybierz jedną z tych opcji.

    **Opcja A: tunel SSH (najprostsze)**

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

    Następnie otwórz `https://<magicdns>/` z dowolnego urządzenia w swoim tailnecie.

    Tailscale Serve uwierzytelnia ruch interfejsu sterowania i WebSocket za pomocą nagłówków tożsamości tailnetu, co zakłada, że sam host gateway jest zaufany. Punkty końcowe HTTP API działają zgodnie ze zwykłym trybem uwierzytelniania gateway (token/hasło) niezależnie od tego. Aby wymagać jawnych poświadczeń wspólnego sekretu przez Serve, ustaw `gateway.auth.allowTailscale: false` i użyj `gateway.auth.mode: "token"` albo `"password"`.

    **Opcja C: powiązanie z tailnetem (bez Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Następnie otwórz `http://<tailscale-ip>:18789` (wymagany token).

  </Step>
</Steps>

## Trwałość i kopie zapasowe

Stan OpenClaw znajduje się w:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` dla każdego agenta, stan kanałów/providerów i dane sesji.
- `~/.openclaw/workspace/` — przestrzeń robocza agenta (SOUL.md, pamięć, artefakty).

Te dane przetrwają ponowne uruchomienia Dropletu. Aby utworzyć przenośną migawkę:

```bash
openclaw backup create
```

Migawki DigitalOcean tworzą kopię zapasową całego Dropletu; `openclaw backup create` jest przenośne między hostami.

## Wskazówki dla 1 GB RAM

Droplet za 6 USD ma tylko 1 GB RAM. Aby wszystko działało płynnie:

- Upewnij się, że powyższy krok swap jest w `/etc/fstab`, aby przetrwał ponowne uruchomienia.
- Preferuj modele oparte na API (Claude, GPT) zamiast lokalnych — lokalne wnioskowanie LLM nie mieści się w 1 GB.
- Ustaw `agents.defaults.model.primary` na mniejszy model, jeśli przy dużych promptach występują błędy OOM.
- Monitoruj za pomocą `free -h` i `htop`.

## Rozwiązywanie problemów

**Gateway nie uruchamia się** -- Uruchom `openclaw doctor --non-interactive` i sprawdź logi za pomocą `journalctl --user -u openclaw-gateway.service -n 50`.

**Port jest już używany** -- Uruchom `lsof -i :18789`, aby znaleźć proces, a następnie go zatrzymaj.

**Brak pamięci** -- Sprawdź, czy swap jest aktywny, używając `free -h`. Jeśli nadal występuje OOM, użyj modeli opartych na API (Claude, GPT) zamiast modeli lokalnych albo przejdź na Droplet 2 GB.

## Następne kroki

- [Kanały](/pl/channels) -- połącz Telegram, WhatsApp, Discord i więcej
- [Konfiguracja Gateway](/pl/gateway/configuration) -- wszystkie opcje konfiguracji
- [Aktualizowanie](/pl/install/updating) -- utrzymuj OpenClaw w aktualnej wersji

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Fly.io](/pl/install/fly)
- [Hetzner](/pl/install/hetzner)
- [Hosting VPS](/pl/vps)
