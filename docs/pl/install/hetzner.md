---
read_when:
    - Chcesz, aby OpenClaw działał 24/7 na chmurowym VPS-ie (nie na twoim laptopie)
    - Potrzebujesz produkcyjnej klasy, stale działającego Gateway na własnym VPS
    - Chcesz mieć pełną kontrolę nad trwałością danych, plikami binarnymi i zachowaniem po restarcie
    - Uruchamiasz OpenClaw w Dockerze na platformie Hetzner lub u podobnego dostawcy
summary: Uruchamiaj OpenClaw Gateway 24/7 na tanim serwerze VPS Hetzner (Docker) z trwałym stanem i wbudowanymi plikami binarnymi
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T10:01:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw na Hetzner (Docker, przewodnik po produkcyjnym VPS)

## Cel

Uruchom trwały OpenClaw Gateway na VPS Hetzner z użyciem Docker, z trwałym stanem, wbudowanymi plikami binarnymi i bezpiecznym zachowaniem przy restarcie.

Jeśli chcesz „OpenClaw 24/7 za około 5 USD”, to najprostsza niezawodna konfiguracja.
Ceny Hetzner się zmieniają; wybierz najmniejszy VPS z Debian/Ubuntu i skaluj w górę, jeśli pojawią się błędy OOM.

Przypomnienie modelu bezpieczeństwa:

- Agenci współdzieleni w firmie są w porządku, gdy wszyscy znajdują się w tej samej granicy zaufania, a środowisko uruchomieniowe jest wyłącznie biznesowe.
- Zachowaj ścisłą separację: dedykowany VPS/środowisko uruchomieniowe + dedykowane konta; bez osobistych profili Apple/Google/przeglądarki/menedżera haseł na tym hoście.
- Jeśli użytkownicy są wobec siebie adwersarialni, rozdziel ich według gatewaya/hosta/użytkownika systemu operacyjnego.

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Hosting VPS](/pl/vps).

## Co robimy (prosto)?

- Wynajmujemy mały serwer Linux (VPS Hetzner)
- Instalujemy Docker (izolowane środowisko uruchomieniowe aplikacji)
- Uruchamiamy OpenClaw Gateway w Docker
- Utrwalamy `~/.openclaw` + `~/.openclaw/workspace` na hoście (przetrwa restarty/przebudowy)
- Uzyskujemy dostęp do Control UI z laptopa przez tunel SSH

Ten zamontowany stan `~/.openclaw` obejmuje `openclaw.json`, per-agent
`agents/<agentId>/agent/auth-profiles.json` oraz `.env`.

Dostęp do Gatewaya można uzyskać przez:

- Przekierowanie portu SSH z laptopa
- Bezpośrednie wystawienie portu, jeśli samodzielnie zarządzasz zaporą i tokenami

Ten przewodnik zakłada Ubuntu lub Debian na Hetzner.  
Jeśli używasz innego VPS z Linux, odpowiednio dopasuj pakiety.
Ogólny przepływ Docker znajdziesz w [Docker](/pl/install/docker).

---

## Szybka ścieżka (doświadczeni operatorzy)

1. Utwórz VPS Hetzner
2. Zainstaluj Docker
3. Sklonuj repozytorium OpenClaw
4. Utwórz trwałe katalogi hosta
5. Skonfiguruj `.env` i `docker-compose.yml`
6. Wbuduj wymagane pliki binarne w obraz
7. `docker compose up -d`
8. Zweryfikuj trwałość i dostęp do Gatewaya

---

## Czego potrzebujesz

- VPS Hetzner z dostępem root
- Dostęp SSH z laptopa
- Podstawowa swoboda pracy z SSH + kopiowaniem/wklejaniem
- Około 20 minut
- Docker i Docker Compose
- Dane uwierzytelniające modelu
- Opcjonalne dane uwierzytelniające dostawców
  - Kod QR WhatsApp
  - Token bota Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Utwórz VPS">
    Utwórz VPS Ubuntu lub Debian w Hetzner.

    Połącz się jako root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Ten przewodnik zakłada, że VPS jest stanowy.
    Nie traktuj go jak infrastruktury jednorazowej.

  </Step>

  <Step title="Zainstaluj Docker (na VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Zweryfikuj:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Sklonuj repozytorium OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Ten przewodnik zakłada, że zbudujesz niestandardowy obraz, aby zagwarantować trwałość plików binarnych.

  </Step>

  <Step title="Utwórz trwałe katalogi hosta">
    Kontenery Docker są efemeryczne.
    Cały długotrwały stan musi znajdować się na hoście.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Skonfiguruj zmienne środowiskowe">
    Utwórz `.env` w katalogu głównym repozytorium.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Pozostaw `OPENCLAW_GATEWAY_TOKEN` puste, chyba że wyraźnie chcesz
    zarządzać nim przez `.env`; OpenClaw zapisuje losowy token gatewaya do
    konfiguracji przy pierwszym uruchomieniu. Wygeneruj hasło keyringa i wklej je do
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Nie commituj tego pliku.**

    Ten plik `.env` służy do zmiennych środowiska kontenera/środowiska uruchomieniowego, takich jak `OPENCLAW_GATEWAY_TOKEN`.
    Zapisane uwierzytelnianie OAuth/API-key dostawców znajduje się w zamontowanym
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Konfiguracja Docker Compose">
    Utwórz lub zaktualizuj `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` służy wyłącznie wygodzie bootstrapu; nie zastępuje poprawnej konfiguracji gatewaya. Nadal ustaw uwierzytelnianie (`gateway.auth.token` lub hasło) i używaj bezpiecznych ustawień bind dla swojego wdrożenia.

  </Step>

  <Step title="Wspólne kroki środowiska uruchomieniowego Docker VM">
    Użyj wspólnego przewodnika po środowisku uruchomieniowym dla typowego przepływu hosta Docker:

    - [Wbuduj wymagane pliki binarne w obraz](/pl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Zbuduj i uruchom](/pl/install/docker-vm-runtime#build-and-launch)
    - [Co gdzie jest utrwalane](/pl/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/pl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Dostęp specyficzny dla Hetzner">
    Po wykonaniu wspólnych kroków budowania i uruchamiania dokończ poniższą konfigurację, aby otworzyć tunel:

    **Wymaganie wstępne:** Upewnij się, że konfiguracja sshd na VPS zezwala na przekierowanie TCP. Jeśli
    utwardziłeś konfigurację SSH, sprawdź `/etc/ssh/sshd_config` i ustaw:

    ```
    AllowTcpForwarding local
    ```

    `local` zezwala na lokalne przekierowania `ssh -L` z laptopa, jednocześnie blokując
    zdalne przekierowania z serwera. Ustawienie go na `no` spowoduje niepowodzenie tunelu
    z komunikatem:
    `channel 3: open failed: administratively prohibited: open failed`

    Po potwierdzeniu, że przekierowanie TCP jest włączone, zrestartuj usługę SSH
    (`systemctl restart ssh`) i uruchom tunel z laptopa:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Otwórz:

    `http://127.0.0.1:18789/`

    Wklej skonfigurowany współdzielony sekret. Ten przewodnik domyślnie używa tokena gatewaya;
    jeśli przełączyłeś się na uwierzytelnianie hasłem, użyj zamiast tego tego hasła.

  </Step>
</Steps>

Wspólna mapa trwałości znajduje się w [Docker VM Runtime](/pl/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Dla zespołów preferujących przepływy infrastructure-as-code społecznościowo utrzymywana konfiguracja Terraform zapewnia:

- Modułową konfigurację Terraform z zarządzaniem stanem zdalnym
- Automatyczne tworzenie zasobów przez cloud-init
- Skrypty wdrożeniowe (bootstrap, deploy, backup/restore)
- Utwardzanie bezpieczeństwa (firewall, UFW, dostęp tylko przez SSH)
- Konfigurację tunelu SSH do dostępu do gatewaya

**Repozytoria:**

- Infrastruktura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfiguracja Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

To podejście uzupełnia powyższą konfigurację Docker o powtarzalne wdrożenia, infrastrukturę kontrolowaną wersjami i zautomatyzowane odzyskiwanie po awarii.

<Note>
Utrzymywane przez społeczność. W sprawach problemów lub wkładu zobacz linki do repozytoriów powyżej.
</Note>

## Następne kroki

- Skonfiguruj kanały wiadomości: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gatewaya](/pl/gateway/configuration)
- Utrzymuj OpenClaw na bieżąco: [Aktualizowanie](/pl/install/updating)

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Fly.io](/pl/install/fly)
- [Docker](/pl/install/docker)
- [Hosting VPS](/pl/vps)
