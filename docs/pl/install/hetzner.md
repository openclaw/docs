---
read_when:
    - Chcesz, aby OpenClaw działał całodobowo na serwerze VPS w chmurze (a nie na Twoim laptopie)
    - Potrzebujesz działającego bez przerwy Gateway klasy produkcyjnej na własnym serwerze VPS
    - Chcesz mieć pełną kontrolę nad trwałością danych, plikami binarnymi i zachowaniem podczas ponownego uruchamiania
    - Uruchamiasz OpenClaw w Dockerze na platformie Hetzner lub u podobnego dostawcy
summary: Uruchom OpenClaw Gateway 24/7 na niedrogim VPS-ie Hetzner (Docker) z trwałym stanem i wbudowanymi plikami binarnymi
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T15:15:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Uruchom trwały Gateway OpenClaw na serwerze VPS Hetzner przy użyciu Dockera, z trwałym stanem, plikami binarnymi wbudowanymi w obraz oraz bezpiecznym zachowaniem podczas ponownego uruchamiania.

Ceny Hetzner ulegają zmianom; wybierz najmniejszy serwer VPS z Debianem/Ubuntu, który spełnia wymagania, i zwiększ jego zasoby, jeśli wystąpią błędy braku pamięci (OOM).

Dostęp do Gateway można uzyskać z laptopa przez przekierowanie portów SSH lub przez bezpośrednie udostępnienie portu, jeśli samodzielnie zarządzasz zaporą sieciową i tokenami.

Przypomnienie dotyczące modelu bezpieczeństwa:

- Agenty współdzielone w firmie są odpowiednie, gdy wszyscy znajdują się w tej samej granicy zaufania, a środowisko uruchomieniowe służy wyłącznie celom biznesowym.
- Zachowaj ścisłą separację: dedykowany VPS/środowisko uruchomieniowe oraz dedykowane konta; na tym hoście nie używaj osobistych profili Apple, Google, przeglądarek ani menedżerów haseł.
- Jeśli użytkownicy mogą działać przeciwko sobie, rozdziel ich według instancji Gateway, hosta lub użytkownika systemu operacyjnego.

Zobacz [Bezpieczeństwo](/pl/gateway/security) oraz [Hosting VPS](/pl/vps).

W tym przewodniku założono użycie Ubuntu lub Debiana na platformie Hetzner. Na innym serwerze VPS z systemem Linux odpowiednio dostosuj pakiety. Ogólny proces pracy z Dockerem opisano w sekcji [Docker](/pl/install/docker).

## Czego potrzebujesz

- Serwer VPS Hetzner z dostępem root
- Dostęp SSH z laptopa
- Docker i Docker Compose
- Dane uwierzytelniające modelu
- Opcjonalne dane uwierzytelniające dostawców (kod QR WhatsApp, token bota Telegram, OAuth Gmail)
- Około 20 minut

## Szybka ścieżka

1. Utwórz serwer VPS Hetzner
2. Zainstaluj Docker
3. Sklonuj repozytorium OpenClaw
4. Utwórz trwałe katalogi na hoście
5. Skonfiguruj `.env` oraz `docker-compose.yml`
6. Wbuduj wymagane pliki binarne w obraz
7. `docker compose up -d`
8. Zweryfikuj trwałość danych i dostęp do Gateway

<Steps>
  <Step title="Utwórz serwer VPS">
    Utwórz serwer VPS z Ubuntu lub Debianem w Hetzner, a następnie połącz się jako root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Traktuj VPS jako infrastrukturę przechowującą stan, a nie jednorazową.

  </Step>

  <Step title="Zainstaluj Docker (na serwerze VPS)">
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

    W tym przewodniku tworzony jest niestandardowy obraz, dzięki czemu wszystkie wbudowane w niego pliki binarne przetrwają ponowne uruchomienia.

  </Step>

  <Step title="Utwórz trwałe katalogi na hoście">
    Kontenery Docker są tymczasowe; cały długotrwale przechowywany stan musi znajdować się na hoście.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Skonfiguruj zmienne środowiskowe">
    Utwórz plik `.env` w katalogu głównym repozytorium:

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

    Ustaw `OPENCLAW_GATEWAY_TOKEN`, aby zarządzać stałym tokenem Gateway za pomocą
    pliku `.env`; w przeciwnym razie skonfiguruj `gateway.auth.token`, zanim zaczniesz
    polegać na klientach zachowujących dostęp między ponownymi uruchomieniami. Jeśli
    żadna z tych wartości nie jest ustawiona, OpenClaw używa podczas danego uruchomienia
    tokena istniejącego wyłącznie w środowisku uruchomieniowym. Wygeneruj hasło pęku kluczy dla `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Nie zatwierdzaj tego pliku w repozytorium.** Zawiera on zmienne środowiskowe kontenera/środowiska uruchomieniowego, takie jak
    `OPENCLAW_GATEWAY_TOKEN`. Zapisane dane uwierzytelniające OAuth/klucze API dostawców znajdują się w
    zamontowanym pliku `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Konfiguracja Docker Compose">
    Utwórz lub zaktualizuj plik `docker-compose.yml`:

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

    Opcja `--allow-unconfigured` służy wyłącznie do ułatwienia początkowego uruchomienia i nie zastępuje rzeczywistej konfiguracji Gateway. Nadal należy skonfigurować uwierzytelnianie (`gateway.auth.token` lub hasło) oraz bezpieczny tryb powiązania dla wdrożenia.

  </Step>

  <Step title="Wspólne kroki środowiska uruchomieniowego maszyny wirtualnej Docker">
    Wykonaj czynności ze wspólnego przewodnika po środowisku uruchomieniowym dla standardowego procesu na hoście Docker:

    - [Wbuduj wymagane pliki binarne w obraz](/pl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Zbuduj i uruchom](/pl/install/docker-vm-runtime#build-and-launch)
    - [Co i gdzie jest trwale przechowywane](/pl/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/pl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Dostęp specyficzny dla Hetzner">
    Po wykonaniu wspólnych kroków budowania i uruchamiania otwórz tunel.

    **Warunek wstępny:** upewnij się, że konfiguracja `sshd` na serwerze VPS zezwala na przekazywanie TCP. Jeśli
    wzmocniono konfigurację SSH, sprawdź plik `/etc/ssh/sshd_config` i ustaw:

    ```text
    AllowTcpForwarding local
    ```

    Wartość `local` zezwala na lokalne przekierowania `ssh -L` z laptopa, jednocześnie blokując
    przekierowania zdalne z serwera. Ustawienie wartości `no` powoduje niepowodzenie tunelu z komunikatem:
    `channel 3: open failed: administratively prohibited: open failed`

    Po potwierdzeniu, że przekazywanie TCP jest włączone, uruchom ponownie usługę SSH
    (`systemctl restart ssh`) i uruchom tunel z laptopa:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Otwórz `http://127.0.0.1:18789/` i wklej skonfigurowany współdzielony sekret.
    Ten przewodnik domyślnie używa tokena Gateway; jeśli przełączono się na uwierzytelnianie hasłem,
    użyj zamiast niego skonfigurowanego hasła.

  </Step>
</Steps>

Wspólna mapa trwałości danych znajduje się w sekcji [Środowisko uruchomieniowe maszyny wirtualnej Docker](/pl/install/docker-vm-runtime#what-persists-where).

## Infrastruktura jako kod (Terraform)

Dla zespołów preferujących przepływy pracy oparte na infrastrukturze jako kodzie dostępna jest utrzymywana przez społeczność konfiguracja Terraform, która zapewnia:

- Modułową konfigurację Terraform ze zdalnym zarządzaniem stanem
- Automatyczne tworzenie zasobów za pomocą cloud-init
- Skrypty wdrażania (inicjalizacja, wdrażanie, tworzenie i przywracanie kopii zapasowych)
- Wzmocnienie zabezpieczeń (zapora sieciowa, UFW, dostęp wyłącznie przez SSH)
- Konfigurację tunelu SSH zapewniającego dostęp do Gateway

**Repozytoria:**

- Infrastruktura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfiguracja Dockera: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

To podejście uzupełnia powyższą konfigurację Dockera o powtarzalne wdrożenia, infrastrukturę kontrolowaną wersjami oraz automatyczne odzyskiwanie po awarii.

<Note>
Rozwiązanie utrzymywane przez społeczność. Aby zgłosić problemy lub wnieść wkład, skorzystaj z powyższych odnośników do repozytoriów.
</Note>

## Następne kroki

- Skonfiguruj kanały komunikacji: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Dbaj o aktualność OpenClaw: [Aktualizowanie](/pl/install/updating)

## Powiązane materiały

- [Omówienie instalacji](/pl/install)
- [Fly.io](/pl/install/fly)
- [Docker](/pl/install/docker)
- [Hosting VPS](/pl/vps)
