---
read_when:
    - Chcesz, aby OpenClaw działał 24/7 na VPS-ie w chmurze (nie na Twoim laptopie)
    - Chcesz mieć stale działający Gateway klasy produkcyjnej na własnym serwerze VPS
    - Chcesz mieć pełną kontrolę nad utrwalaniem danych, plikami binarnymi i zachowaniem podczas restartu
    - Uruchamiasz OpenClaw w Dockerze na Hetznerze lub u podobnego dostawcy
summary: Uruchom OpenClaw Gateway 24/7 na niedrogim VPS-ie Hetzner (Docker) z trwałym stanem i wbudowanymi plikami binarnymi
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T17:57:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6102649b381b3b1ecd6f52e1cf518fc36147fe143ebc8fd4be5f44ab26cb3b4d
    source_path: install/hetzner.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Cel

Uruchom trwały OpenClaw Gateway na Hetzner VPS przy użyciu Docker, z trwałym stanem, wbudowanymi plikami binarnymi i bezpiecznym zachowaniem przy ponownym uruchamianiu.

Jeśli chcesz „OpenClaw 24/7 za około 5 USD”, to jest najprostsza niezawodna konfiguracja.
Ceny Hetzner się zmieniają; wybierz najmniejszy Debian/Ubuntu VPS i zwiększ zasoby, jeśli napotkasz błędy OOM.

Przypomnienie modelu bezpieczeństwa:

- Agenci współdzieleni w firmie są w porządku, gdy wszyscy znajdują się w tej samej granicy zaufania, a runtime jest wyłącznie biznesowy.
- Zachowaj ścisłą separację: dedykowany VPS/runtime + dedykowane konta; bez osobistych profili Apple/Google/przeglądarki/menedżera haseł na tym hoście.
- Jeśli użytkownicy są wobec siebie adwersarialni, rozdziel ich według gateway/hosta/użytkownika OS.

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Hosting VPS](/pl/vps).

## Co robimy (w prostych słowach)?

- Wynajmujemy mały serwer Linux (Hetzner VPS)
- Instalujemy Docker (izolowany runtime aplikacji)
- Uruchamiamy OpenClaw Gateway w Docker
- Utrwalamy `~/.openclaw` + `~/.openclaw/workspace` na hoście (przetrwa ponowne uruchomienia/przebudowy)
- Uzyskujemy dostęp do Control UI z laptopa przez tunel SSH

Ten zamontowany stan `~/.openclaw` obejmuje `openclaw.json`, osobne dla agentów
`agents/<agentId>/agent/auth-profiles.json` oraz `.env`.

Do Gateway można uzyskać dostęp przez:

- przekierowanie portu SSH z laptopa
- bezpośrednie wystawienie portu, jeśli samodzielnie zarządzasz zaporą i tokenami

Ten przewodnik zakłada Ubuntu lub Debian na Hetzner.  
Jeśli używasz innego Linux VPS, odpowiednio dopasuj pakiety.
Ogólny przepływ Docker znajdziesz w [Docker](/pl/install/docker).

---

## Szybka ścieżka (doświadczeni operatorzy)

1. Utwórz Hetzner VPS
2. Zainstaluj Docker
3. Sklonuj repozytorium OpenClaw
4. Utwórz trwałe katalogi hosta
5. Skonfiguruj `.env` i `docker-compose.yml`
6. Wbuduj wymagane pliki binarne w obraz
7. `docker compose up -d`
8. Zweryfikuj trwałość i dostęp do Gateway

---

## Czego potrzebujesz

- Hetzner VPS z dostępem root
- Dostęp SSH z laptopa
- Podstawowa swoboda w użyciu SSH + kopiuj/wklej
- Około 20 minut
- Docker i Docker Compose
- Dane uwierzytelniające modelu
- Opcjonalne dane uwierzytelniające dostawców
  - kod QR WhatsApp
  - token bota Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Utwórz VPS">
    Utwórz Ubuntu lub Debian VPS w Hetzner.

    Połącz się jako root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Ten przewodnik zakłada, że VPS jest stanowy.
    Nie traktuj go jako infrastruktury jednorazowej.

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

    Ten przewodnik zakłada, że zbudujesz własny obraz, aby zagwarantować trwałość plików binarnych.

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

    Ustaw `OPENCLAW_GATEWAY_TOKEN`, gdy chcesz zarządzać stabilnym tokenem gateway
    przez `.env`; w przeciwnym razie skonfiguruj `gateway.auth.token` przed
    poleganiem na klientach między ponownymi uruchomieniami. Jeśli żadne z tych źródeł nie istnieje, OpenClaw używa
    tokenu tylko dla runtime dla tego uruchomienia. Wygeneruj hasło keyring i wklej
    je do `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Nie commituj tego pliku.**

    Ten plik `.env` jest przeznaczony dla zmiennych środowiskowych kontenera/runtime, takich jak `OPENCLAW_GATEWAY_TOKEN`.
    Zapisane uwierzytelnianie dostawców OAuth/kluczami API znajduje się w zamontowanym
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

    `--allow-unconfigured` służy tylko wygodzie bootstrapu, nie zastępuje właściwej konfiguracji gateway. Nadal ustaw auth (`gateway.auth.token` lub hasło) i użyj bezpiecznych ustawień bind dla swojego wdrożenia.

  </Step>

  <Step title="Wspólne kroki runtime Docker VM">
    Użyj współdzielonego przewodnika runtime dla typowego przepływu hosta Docker:

    - [Wbuduj wymagane pliki binarne w obraz](/pl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Zbuduj i uruchom](/pl/install/docker-vm-runtime#build-and-launch)
    - [Co utrzymuje się gdzie](/pl/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/pl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Dostęp specyficzny dla Hetzner">
    Po wykonaniu wspólnych kroków budowania i uruchamiania dokończ poniższą konfigurację, aby otworzyć tunel:

    **Wymaganie wstępne:** Upewnij się, że konfiguracja sshd na VPS pozwala na przekierowanie TCP. Jeśli
    utwardziłeś konfigurację SSH, sprawdź `/etc/ssh/sshd_config` i ustaw:

    ```
    AllowTcpForwarding local
    ```

    `local` pozwala na lokalne przekierowania `ssh -L` z laptopa, jednocześnie blokując
    zdalne przekierowania z serwera. Ustawienie na `no` spowoduje niepowodzenie tunelu
    z komunikatem:
    `channel 3: open failed: administratively prohibited: open failed`

    Po potwierdzeniu, że przekierowanie TCP jest włączone, uruchom ponownie usługę SSH
    (`systemctl restart ssh`) i uruchom tunel z laptopa:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Otwórz:

    `http://127.0.0.1:18789/`

    Wklej skonfigurowany współdzielony sekret. Ten przewodnik domyślnie używa tokenu gateway;
    jeśli przełączyłeś się na uwierzytelnianie hasłem, użyj tego hasła.

  </Step>
</Steps>

Wspólna mapa trwałości znajduje się w [Docker VM Runtime](/pl/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Dla zespołów preferujących przepływy infrastructure-as-code społecznościowo utrzymywana konfiguracja Terraform zapewnia:

- Modułową konfigurację Terraform ze zdalnym zarządzaniem stanem
- Automatyczne provisionowanie przez cloud-init
- Skrypty wdrożeniowe (bootstrap, deploy, backup/restore)
- Utwardzenie bezpieczeństwa (zapora, UFW, dostęp tylko przez SSH)
- Konfigurację tunelu SSH do dostępu do gateway

**Repozytoria:**

- Infrastruktura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfiguracja Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

To podejście uzupełnia powyższą konfigurację Docker o powtarzalne wdrożenia, infrastrukturę kontrolowaną wersjami i automatyczne odzyskiwanie po awarii.

<Note>
Utrzymywane przez społeczność. W sprawie problemów lub wkładu zobacz powyższe linki do repozytoriów.
</Note>

## Następne kroki

- Skonfiguruj kanały komunikacji: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Aktualizuj OpenClaw: [Aktualizowanie](/pl/install/updating)

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Fly.io](/pl/install/fly)
- [Docker](/pl/install/docker)
- [Hosting VPS](/pl/vps)
