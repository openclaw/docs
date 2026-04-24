---
read_when:
    - Chcesz uruchomić OpenClaw 24/7 na chmurowym VPS (a nie na laptopie)
    - Chcesz produkcyjnego, zawsze aktywnego Gateway na własnym VPS
    - Chcesz pełnej kontroli nad trwałością, binariami i zachowaniem przy restarcie
    - Uruchamiasz OpenClaw w Dockerze na Hetznerze lub podobnym dostawcy cloud VPS
summary: Uruchamiaj Gateway OpenClaw 24/7 na tanim VPS Hetzner (Docker) z trwałym stanem i wbudowanymi binariami
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T09:17:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw na Hetznerze (Docker, produkcyjny przewodnik po VPS)

## Cel

Uruchomić trwały Gateway OpenClaw na VPS Hetzner przy użyciu Docker, z trwałym stanem, wbudowanymi binariami i bezpiecznym zachowaniem przy restarcie.

Jeśli chcesz „OpenClaw 24/7 za ~$5”, to najprostsza niezawodna konfiguracja.
Ceny Hetznera się zmieniają; wybierz najmniejszy VPS z Debianem/Ubuntu i skaluj w górę, jeśli zaczniesz trafiać na OOM.

Przypomnienie o modelu bezpieczeństwa:

- Współdzieleni firmowi agenci są w porządku, gdy wszyscy znajdują się w tej samej granicy zaufania, a runtime jest wyłącznie biznesowy.
- Zachowaj ścisłą separację: dedykowany VPS/runtime + dedykowane konta; żadnych osobistych profili Apple/Google/przeglądarki/menedżera haseł na tym hoście.
- Jeśli użytkownicy są wobec siebie adversarialni, rozdziel ich według gateway/hosta/użytkownika systemowego.

Zobacz [Security](/pl/gateway/security) oraz [VPS hosting](/pl/vps).

## Co robimy (prosto mówiąc)?

- Wynajmujemy mały serwer Linux (VPS Hetzner)
- Instalujemy Docker (izolowane środowisko uruchomieniowe aplikacji)
- Uruchamiamy Gateway OpenClaw w Dockerze
- Utrwalamy `~/.openclaw` + `~/.openclaw/workspace` na hoście (przetrwa restarty/przebudowy)
- Uzyskujemy dostęp do Control UI z laptopa przez tunel SSH

Ten zamontowany stan `~/.openclaw` zawiera `openclaw.json`, profile per-agent
`agents/<agentId>/agent/auth-profiles.json` oraz `.env`.

Dostęp do Gateway można uzyskać przez:

- przekierowanie portu SSH z laptopa
- bezpośrednie wystawienie portu, jeśli samodzielnie zarządzasz firewallem i tokenami

Ten przewodnik zakłada Ubuntu lub Debian na Hetznerze.  
Jeśli używasz innego linuksowego VPS, dopasuj odpowiednio pakiety.
Ogólny przepływ Docker znajdziesz w [Docker](/pl/install/docker).

---

## Szybka ścieżka (dla doświadczonych operatorów)

1. Utwórz VPS Hetzner
2. Zainstaluj Docker
3. Sklonuj repozytorium OpenClaw
4. Utwórz trwałe katalogi hosta
5. Skonfiguruj `.env` i `docker-compose.yml`
6. Wbuduj wymagane binaria do obrazu
7. `docker compose up -d`
8. Zweryfikuj trwałość i dostęp do Gateway

---

## Czego potrzebujesz

- VPS Hetzner z dostępem root
- Dostęp SSH z laptopa
- Podstawowa swoboda w używaniu SSH + kopiuj/wklej
- ~20 minut
- Docker i Docker Compose
- Poświadczenia uwierzytelniania modeli
- Opcjonalne poświadczenia dostawców
  - QR WhatsApp
  - token bota Telegram
  - OAuth Gmail

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

    Ten przewodnik zakłada, że zbudujesz niestandardowy obraz, aby zagwarantować trwałość binariów.

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

    Pozostaw `OPENCLAW_GATEWAY_TOKEN` puste, chyba że jawnie chcesz
    zarządzać nim przez `.env`; przy pierwszym uruchomieniu OpenClaw zapisuje losowy token gateway do
    konfiguracji. Wygeneruj hasło keyringu i wklej je do
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Nie zapisuj tego pliku do repozytorium.**

    Ten plik `.env` służy do env kontenera/runtime, takiego jak `OPENCLAW_GATEWAY_TOKEN`.
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

    `--allow-unconfigured` służy tylko do wygody bootstrapu; nie zastępuje poprawnej konfiguracji gateway. Nadal ustaw uwierzytelnianie (`gateway.auth.token` lub hasło) i używaj bezpiecznych ustawień bind odpowiednich dla swojego wdrożenia.

  </Step>

  <Step title="Współdzielone kroki runtime Docker VM">
    Użyj wspólnego przewodnika runtime dla standardowego przepływu hosta Docker:

    - [Wbuduj wymagane binaria do obrazu](/pl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Zbuduj i uruchom](/pl/install/docker-vm-runtime#build-and-launch)
    - [Co i gdzie jest utrwalane](/pl/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/pl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Dostęp specyficzny dla Hetznera">
    Po wykonaniu współdzielonych kroków budowania i uruchamiania wykonaj tunel z laptopa:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Otwórz:

    `http://127.0.0.1:18789/`

    Wklej skonfigurowany wspólny sekret. Ten przewodnik domyślnie używa tokenu gateway;
    jeśli przełączyłeś się na uwierzytelnianie hasłem, użyj zamiast tego tego hasła.

  </Step>
</Steps>

Wspólna mapa trwałości znajduje się w [Docker VM Runtime](/pl/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Dla zespołów preferujących przepływy infrastructure-as-code społeczność utrzymuje konfigurację Terraform zapewniającą:

- modułową konfigurację Terraform ze zdalnym zarządzaniem stanem
- zautomatyzowane provisionowanie przez cloud-init
- skrypty wdrożeniowe (bootstrap, deploy, backup/restore)
- utwardzanie bezpieczeństwa (firewall, UFW, dostęp tylko przez SSH)
- konfigurację tunelu SSH dla dostępu do gateway

**Repozytoria:**

- Infrastruktura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfiguracja Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

To podejście uzupełnia powyższą konfigurację Docker o powtarzalne wdrożenia, infrastrukturę kontrolowaną wersjami i zautomatyzowane odzyskiwanie po awarii.

> **Uwaga:** Utrzymywane przez społeczność. W sprawie problemów lub wkładu zobacz powyższe linki do repozytoriów.

## Kolejne kroki

- Skonfiguruj kanały wiadomości: [Channels](/pl/channels)
- Skonfiguruj Gateway: [Gateway configuration](/pl/gateway/configuration)
- Utrzymuj OpenClaw na bieżąco: [Updating](/pl/install/updating)

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Fly.io](/pl/install/fly)
- [Docker](/pl/install/docker)
- [VPS hosting](/pl/vps)
