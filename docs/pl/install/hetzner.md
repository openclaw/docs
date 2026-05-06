---
read_when:
    - Chcesz, aby OpenClaw działał 24/7 na VPS-ie w chmurze (nie na swoim laptopie)
    - Chcesz mieć produkcyjnej klasy, stale działający Gateway na własnym VPS-ie
    - Chcesz mieć pełną kontrolę nad utrwalaniem danych, plikami binarnymi i zachowaniem podczas ponownego uruchamiania
    - Korzystasz z OpenClaw uruchomionego w Dockerze na Hetznerze lub u podobnego dostawcy
summary: Uruchamiaj OpenClaw Gateway 24/7 na tanim VPS-ie Hetzner (Docker) z trwałym stanem i wbudowanymi plikami binarnymi
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T09:18:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2625a028b6242f653d29b8f45035bf2d796c5c60453582cf269fd1c3776eca52
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw na Hetznerze (Docker, przewodnik po produkcyjnym VPS)

## Cel

Uruchom trwały OpenClaw Gateway na VPS-ie Hetznera za pomocą Dockera, z trwałym stanem, wbudowanymi binariami i bezpiecznym zachowaniem przy restarcie.

Jeśli chcesz mieć „OpenClaw 24/7 za około 5 USD”, to jest najprostsza niezawodna konfiguracja.
Ceny Hetznera się zmieniają; wybierz najmniejszy VPS z Debianem/Ubuntu i skaluj w górę, jeśli napotkasz błędy OOM.

Przypomnienie modelu bezpieczeństwa:

- Agenci współdzieleni w firmie są w porządku, gdy wszyscy znajdują się w tej samej granicy zaufania, a środowisko uruchomieniowe jest wyłącznie biznesowe.
- Zachowaj ścisłą separację: dedykowany VPS/środowisko uruchomieniowe + dedykowane konta; bez osobistych profili Apple/Google/przeglądarki/menedżera haseł na tym hoście.
- Jeśli użytkownicy są wobec siebie antagonistyczni, rozdziel ich według gatewaya/hosta/użytkownika systemu operacyjnego.

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Hosting VPS](/pl/vps).

## Co robimy (w prostych słowach)?

- Wynajmujemy mały serwer Linux (VPS Hetznera)
- Instalujemy Dockera (izolowane środowisko uruchomieniowe aplikacji)
- Uruchamiamy OpenClaw Gateway w Dockerze
- Utrwalamy `~/.openclaw` + `~/.openclaw/workspace` na hoście (przetrwa restarty/przebudowy)
- Uzyskujemy dostęp do Control UI z laptopa przez tunel SSH

Ten zamontowany stan `~/.openclaw` obejmuje `openclaw.json`, przypisany do agenta
`agents/<agentId>/agent/auth-profiles.json` oraz `.env`.

Dostęp do Gatewaya można uzyskać przez:

- przekierowanie portu SSH z laptopa
- bezpośrednie wystawienie portu, jeśli samodzielnie zarządzasz zaporą i tokenami

Ten przewodnik zakłada Ubuntu lub Debiana na Hetznerze.  
Jeśli używasz innego VPS-a z Linuksem, dobierz odpowiednie pakiety.
Ogólny przepływ Dockera znajdziesz w [Docker](/pl/install/docker).

---

## Szybka ścieżka (doświadczeni operatorzy)

1. Utwórz VPS Hetznera
2. Zainstaluj Dockera
3. Sklonuj repozytorium OpenClaw
4. Utwórz trwałe katalogi hosta
5. Skonfiguruj `.env` i `docker-compose.yml`
6. Wbuduj wymagane binaria w obraz
7. `docker compose up -d`
8. Zweryfikuj trwałość i dostęp do Gatewaya

---

## Czego potrzebujesz

- VPS Hetznera z dostępem root
- Dostęp SSH z laptopa
- Podstawowa swoboda pracy z SSH + kopiowaniem/wklejaniem
- Około 20 minut
- Docker i Docker Compose
- Dane uwierzytelniania modelu
- Opcjonalne dane uwierzytelniania dostawców
  - kod QR WhatsApp
  - token bota Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Utwórz VPS">
    Utwórz VPS z Ubuntu lub Debianem w Hetznerze.

    Połącz się jako root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Ten przewodnik zakłada, że VPS jest stanowy.
    Nie traktuj go jako infrastruktury jednorazowej.

  </Step>

  <Step title="Zainstaluj Dockera (na VPS-ie)">
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

    Ten przewodnik zakłada, że zbudujesz niestandardowy obraz, aby zagwarantować trwałość binariów.

  </Step>

  <Step title="Utwórz trwałe katalogi hosta">
    Kontenery Dockera są efemeryczne.
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
    zarządzać nim przez `.env`; OpenClaw zapisuje losowy token gatewaya w
    konfiguracji przy pierwszym uruchomieniu. Wygeneruj hasło pęku kluczy i wklej je do
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Nie commituj tego pliku.**

    Ten plik `.env` służy do zmiennych środowiskowych kontenera/środowiska uruchomieniowego, takich jak `OPENCLAW_GATEWAY_TOKEN`.
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

    `--allow-unconfigured` służy tylko wygodzie bootstrapu; nie zastępuje właściwej konfiguracji gatewaya. Nadal ustaw uwierzytelnianie (`gateway.auth.token` lub hasło) i używaj bezpiecznych ustawień bind dla swojego wdrożenia.

  </Step>

  <Step title="Wspólne kroki środowiska uruchomieniowego Docker VM">
    Użyj wspólnego przewodnika po środowisku uruchomieniowym dla typowego przepływu hosta Docker:

    - [Wbuduj wymagane binaria w obraz](/pl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Zbuduj i uruchom](/pl/install/docker-vm-runtime#build-and-launch)
    - [Co gdzie jest utrwalane](/pl/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/pl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Dostęp specyficzny dla Hetznera">
    Po wykonaniu wspólnych kroków budowania i uruchamiania dokończ poniższą konfigurację, aby otworzyć tunel:

    **Wymaganie wstępne:** Upewnij się, że konfiguracja sshd na VPS-ie pozwala na przekierowanie TCP. Jeśli
    utwardziłeś konfigurację SSH, sprawdź `/etc/ssh/sshd_config` i ustaw:

    ```
    AllowTcpForwarding local
    ```

    `local` pozwala na lokalne przekierowania `ssh -L` z laptopa, blokując jednocześnie
    przekierowania zdalne z serwera. Ustawienie na `no` spowoduje niepowodzenie tunelu
    z komunikatem:
    `channel 3: open failed: administratively prohibited: open failed`

    Po potwierdzeniu, że przekierowanie TCP jest włączone, zrestartuj usługę SSH
    (`systemctl restart ssh`) i uruchom tunel z laptopa:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Otwórz:

    `http://127.0.0.1:18789/`

    Wklej skonfigurowany współdzielony sekret. Ten przewodnik domyślnie używa tokenu gatewaya;
    jeśli przełączyłeś się na uwierzytelnianie hasłem, użyj zamiast niego tego hasła.

  </Step>
</Steps>

Wspólna mapa trwałości znajduje się w [Środowisko uruchomieniowe Docker VM](/pl/install/docker-vm-runtime#what-persists-where).

## Infrastruktura jako kod (Terraform)

Dla zespołów preferujących przepływy pracy infrastruktury jako kodu społecznościowo utrzymywana konfiguracja Terraform zapewnia:

- Modularną konfigurację Terraform ze zdalnym zarządzaniem stanem
- Automatyczne provisionowanie przez cloud-init
- Skrypty wdrożeniowe (bootstrap, deploy, backup/restore)
- Utwardzenie bezpieczeństwa (zapora, UFW, dostęp tylko przez SSH)
- Konfigurację tunelu SSH do dostępu do gatewaya

**Repozytoria:**

- Infrastruktura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfiguracja Dockera: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

To podejście uzupełnia powyższą konfigurację Dockera o powtarzalne wdrożenia, infrastrukturę kontrolowaną wersjami i automatyczne odzyskiwanie po awarii.

<Note>
Utrzymywane przez społeczność. W przypadku problemów lub chęci wniesienia wkładu zobacz powyższe linki do repozytoriów.
</Note>

## Następne kroki

- Skonfiguruj kanały komunikacji: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gatewaya](/pl/gateway/configuration)
- Utrzymuj OpenClaw na bieżąco: [Aktualizowanie](/pl/install/updating)

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Fly.io](/pl/install/fly)
- [Docker](/pl/install/docker)
- [Hosting VPS](/pl/vps)
