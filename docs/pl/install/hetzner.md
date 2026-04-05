---
read_when:
    - Chcesz uruchamiać OpenClaw 24/7 na chmurowym VPS (nie na laptopie)
    - Chcesz mieć produkcyjną, zawsze działającą Gateway na własnym VPS
    - Chcesz mieć pełną kontrolę nad trwałością danych, binarkami i zachowaniem przy restarcie
    - Uruchamiasz OpenClaw w Dockerze na Hetzner lub podobnym dostawcy
summary: Uruchamianie OpenClaw Gateway 24/7 na tanim VPS Hetzner (Docker) z trwałym stanem i wbudowanymi binarkami
title: Hetzner
x-i18n:
    generated_at: "2026-04-05T13:57:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d859e4c0943040b022835f320708f879a11eadef70f2816cf0f2824eaaf165ef
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw na Hetznerze (Docker, przewodnik po produkcyjnym VPS)

## Cel

Uruchom trwałą Gateway OpenClaw na VPS Hetzner przy użyciu Dockera, z trwałym stanem, wbudowanymi binarkami i bezpiecznym zachowaniem przy restarcie.

Jeśli chcesz „OpenClaw 24/7 za około 5 USD”, to jest najprostsza niezawodna konfiguracja.
Ceny Hetzner się zmieniają; wybierz najmniejszy VPS z Debianem/Ubuntu i skaluj w górę, jeśli zaczniesz trafiać na OOM.

Przypomnienie o modelu bezpieczeństwa:

- Współdzieleni agenci firmowi są w porządku, gdy wszyscy znajdują się w tej samej granicy zaufania, a runtime służy wyłącznie do celów biznesowych.
- Zachowuj ścisłą separację: dedykowany VPS/runtime + dedykowane konta; bez osobistych profili Apple/Google/przeglądarki/menedżera haseł na tym hoście.
- Jeśli użytkownicy są wobec siebie adversarialni, rozdziel ich per gateway/host/użytkownik systemu operacyjnego.

Zobacz [Security](/gateway/security) i [VPS hosting](/vps).

## Co właściwie robimy? (prosto)

- Wynajmujemy mały serwer Linux (VPS Hetzner)
- Instalujemy Docker (izolowane środowisko runtime aplikacji)
- Uruchamiamy Gateway OpenClaw w Dockerze
- Utrwalamy `~/.openclaw` + `~/.openclaw/workspace` na hoście (przetrwa restarty/rebuildy)
- Uzyskujemy dostęp do Control UI z laptopa przez tunel SSH

Ten zamontowany stan `~/.openclaw` obejmuje `openclaw.json`, per-agent
`agents/<agentId>/agent/auth-profiles.json` oraz `.env`.

Dostęp do Gateway można uzyskać przez:

- przekierowanie portu SSH z laptopa
- bezpośrednie wystawienie portu, jeśli samodzielnie zarządzasz firewallem i tokenami

Ten przewodnik zakłada Ubuntu lub Debian na Hetznerze.  
Jeśli używasz innego Linux VPS, odpowiednio dopasuj pakiety.
Ogólny przepływ dla Dockera znajdziesz w [Docker](/install/docker).

---

## Szybka ścieżka (dla doświadczonych operatorów)

1. Przygotuj VPS Hetzner
2. Zainstaluj Docker
3. Sklonuj repozytorium OpenClaw
4. Utwórz trwałe katalogi hosta
5. Skonfiguruj `.env` i `docker-compose.yml`
6. Wbuduj wymagane binarki do obrazu
7. `docker compose up -d`
8. Zweryfikuj trwałość i dostęp do Gateway

---

## Czego potrzebujesz

- VPS Hetzner z dostępem root
- Dostępu SSH z laptopa
- Podstawowej swobody pracy z SSH + copy/paste
- Około 20 minut
- Docker i Docker Compose
- Poświadczeń uwierzytelniania modeli
- Opcjonalnych poświadczeń providerów
  - WhatsApp QR
  - token bota Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Przygotuj VPS">
    Utwórz VPS z Ubuntu lub Debianem w Hetznerze.

    Połącz się jako root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Ten przewodnik zakłada, że VPS jest stateful.
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

    Ten przewodnik zakłada, że zbudujesz własny obraz, aby zagwarantować trwałość binarek.

  </Step>

  <Step title="Utwórz trwałe katalogi hosta">
    Kontenery Docker są efemeryczne.
    Cały długotrwały stan musi znajdować się na hoście.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Ustaw właściciela na użytkownika kontenera (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Skonfiguruj zmienne środowiskowe">
    Utwórz `.env` w katalogu głównym repozytorium.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Wygeneruj silne sekrety:

    ```bash
    openssl rand -hex 32
    ```

    **Nie commituj tego pliku.**

    Ten plik `.env` służy dla env kontenera/runtime, takich jak `OPENCLAW_GATEWAY_TOKEN`.
    Zapisane uwierzytelnianie providerów OAuth/kluczy API znajduje się w zamontowanym
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
          # Zalecane: pozostaw Gateway tylko na loopback na VPS; uzyskuj dostęp przez tunel SSH.
          # Aby wystawić ją publicznie, usuń prefiks `127.0.0.1:` i odpowiednio skonfiguruj firewall.
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

    `--allow-unconfigured` służy wyłącznie wygodzie bootstrapu, nie zastępuje prawidłowej konfiguracji gateway. Nadal ustaw auth (`gateway.auth.token` lub hasło) i używaj bezpiecznych ustawień bind odpowiednich dla swojego wdrożenia.

  </Step>

  <Step title="Wspólne kroki runtime Docker VM">
    Użyj współdzielonego przewodnika runtime dla typowego przepływu hosta Docker:

    - [Wbuduj wymagane binarki do obrazu](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build i uruchomienie](/install/docker-vm-runtime#build-and-launch)
    - [Co jest utrwalane i gdzie](/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Dostęp specyficzny dla Hetzner">
    Po wykonaniu współdzielonych kroków build i uruchomienia utwórz tunel z laptopa:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Otwórz:

    `http://127.0.0.1:18789/`

    Wklej skonfigurowany współdzielony sekret. Ten przewodnik domyślnie używa tokenu gateway;
    jeśli przełączyłeś się na uwierzytelnianie hasłem, użyj zamiast tego tego hasła.

  </Step>
</Steps>

Wspólna mapa trwałości znajduje się w [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where).

## Infrastruktura jako kod (Terraform)

Dla zespołów preferujących workflow infrastruktury jako kod społeczność utrzymuje konfigurację Terraform zapewniającą:

- modułową konfigurację Terraform z zarządzaniem zdalnym stanem
- automatyczny provisioning przez cloud-init
- skrypty wdrożeniowe (bootstrap, deploy, backup/restore)
- utwardzenie bezpieczeństwa (firewall, UFW, dostęp tylko przez SSH)
- konfigurację tunelu SSH do dostępu do gateway

**Repozytoria:**

- Infrastruktura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfiguracja Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

To podejście uzupełnia powyższą konfigurację Docker o powtarzalne wdrożenia, infrastrukturę wersjonowaną w repozytorium i zautomatyzowane odtwarzanie po awarii.

> **Uwaga:** Utrzymywane przez społeczność. W sprawie problemów lub wkładu zobacz powyższe linki do repozytoriów.

## Następne kroki

- Skonfiguruj kanały wiadomości: [Channels](/pl/channels)
- Skonfiguruj Gateway: [Gateway configuration](/gateway/configuration)
- Utrzymuj OpenClaw na bieżąco: [Updating](/install/updating)
