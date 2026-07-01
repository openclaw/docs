---
read_when:
    - Chcesz skonteneryzowany gateway zamiast lokalnych instalacji
    - Weryfikujesz przepływ Docker
summary: Opcjonalna konfiguracja i wdrożenie OpenClaw oparte na Dockerze
title: Docker
x-i18n:
    generated_at: "2026-07-01T13:23:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker jest **opcjonalny**. Użyj go tylko wtedy, gdy chcesz skonteneryzowany Gateway albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie odpowiedni?

- **Tak**: chcesz izolowane, tymczasowe środowisko Gateway albo uruchomić OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz na własnym komputerze i chcesz po prostu najszybszą pętlę deweloperską. Zamiast tego użyj normalnego przepływu instalacji.
- **Uwaga o sandboxingu**: domyślny backend sandboxa używa Docker, gdy sandboxing jest włączony, ale sandboxing jest domyślnie wyłączony i **nie** wymaga uruchamiania całego Gateway w Docker. Dostępne są też backendy sandboxa SSH i OpenShell. Zobacz [Sandboxing](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM na budowanie obrazu (`pnpm install` może zostać zakończone przez OOM na hostach z 1 GB, z kodem wyjścia 137)
- Wystarczająco dużo miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS/hoście publicznym, przejrzyj
  [Wzmacnianie zabezpieczeń przy ekspozycji sieciowej](/pl/gateway/security),
  zwłaszcza politykę zapory Docker `DOCKER-USER`.

## Skonteneryzowany Gateway

<Steps>
  <Step title="Zbuduj obraz">
    Z katalogu głównego repozytorium uruchom skrypt konfiguracji:

    ```bash
    ./scripts/docker/setup.sh
    ```

    To buduje obraz Gateway lokalnie. Aby zamiast tego użyć gotowego obrazu:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gotowe obrazy są najpierw publikowane w
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR jest podstawowym rejestrem dla automatyzacji wydań, przypiętych wdrożeń
    i kontroli pochodzenia. Ten sam przepływ wydań publikuje też oficjalne
    lustro Docker Hub pod `openclaw/openclaw` dla hostów preferujących Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Użyj `ghcr.io/openclaw/openclaw` albo `openclaw/openclaw`. Unikaj
    społecznościowych luster Docker Hub, ponieważ OpenClaw nie kontroluje ich
    harmonogramu wydań, przebudów ani polityki przechowywania. Typowe oficjalne
    tagi: `main`, `latest`, `<version>` (np. `2026.2.26`) oraz wersje beta, takie
    jak `2026.2.26-beta.1`. Tagi beta nie przesuwają `latest` ani `main`.

  </Step>

  <Step title="Ponowne uruchomienie offline">
    Na hostach offline najpierw przenieś i wczytaj obraz:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` weryfikuje, że `OPENCLAW_IMAGE` już istnieje lokalnie, wyłącza
    niejawne pobieranie i budowanie przez Compose, a następnie uruchamia normalny
    przepływ konfiguracji, taki jak synchronizacja `.env`, poprawki uprawnień,
    onboarding, synchronizacja konfiguracji Gateway i start Compose.

    Jeśli `OPENCLAW_SANDBOX=1`, konfiguracja offline sprawdza też skonfigurowane
    domyślne i aktywne obrazy sandboxa dla poszczególnych agentów w daemonie za
    `OPENCLAW_DOCKER_SOCKET`. Obrazy przeglądarki oparte na Docker muszą też
    zawierać bieżącą etykietę kontraktu przeglądarki OpenClaw. Gdy wymagany obraz
    jest brakujący lub niezgodny, konfiguracja kończy działanie bez zmiany
    konfiguracji sandboxa zamiast zgłaszać sukces z nieużywalnym sandboxem.

  </Step>

  <Step title="Ukończ onboarding">
    Skrypt konfiguracji uruchamia onboarding automatycznie. Wykona on:

    - poprosi o klucze API dostawcy
    - wygeneruje token Gateway i zapisze go w `.env`
    - utworzy katalog klucza tajnego profilu uwierzytelniania
    - uruchomi Gateway przez Docker Compose

    Podczas konfiguracji onboarding przed startem i zapisy konfiguracji są
    uruchamiane bezpośrednio przez `openclaw-gateway`. `openclaw-cli` służy do
    poleceń uruchamianych po tym, jak kontener Gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    współdzielony sekret w Settings. Skrypt konfiguracji domyślnie zapisuje token
    w `.env`; jeśli przełączysz konfigurację kontenera na uwierzytelnianie hasłem,
    użyj zamiast tego tego hasła.

    Potrzebujesz ponownie adresu URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Skonfiguruj kanały (opcjonalnie)">
    Użyj kontenera CLI, aby dodać kanały komunikacyjne:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord)

  </Step>
</Steps>

### Przepływ ręczny

Jeśli wolisz uruchomić każdy krok samodzielnie zamiast używać skryptu konfiguracji:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Uruchamiaj `docker compose` z katalogu głównego repozytorium. Jeśli włączono
`OPENCLAW_EXTRA_MOUNTS` albo `OPENCLAW_HOME_VOLUME`, skrypt konfiguracji zapisuje
`docker-compose.extra.yml`; dołącz go po każdym standardowym pliku override, na
przykład `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`,
gdy istnieją oba pliki override.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest
narzędziem po uruchomieniu. Przed `docker compose up -d openclaw-gateway` uruchom
onboarding i zapisy konfiguracji z czasu konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                                        | Cel                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Użyj zdalnego obrazu zamiast budować lokalnie                        |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Zainstaluj dodatkowe pakiety apt podczas budowania (oddzielone spacjami)             |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Zainstaluj dodatkowe pakiety Python podczas budowania (oddzielone spacjami)          |
| `OPENCLAW_EXTENSIONS`                           | Zainstaluj wstępnie zależności pluginów w czasie budowania (nazwy oddzielone spacjami) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Nadpisz lokalne opcje Node dla budowania ze źródeł                          |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Nadpisz lokalny sterta tsdown dla budowania ze źródeł w MB                     |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Pomiń generowanie deklaracji podczas budowania lokalnych obrazów tylko runtime        |
| `OPENCLAW_EXTRA_MOUNTS`                         | Dodatkowe montowania bind z hosta (oddzielone przecinkami `source:target[:opts]`)       |
| `OPENCLAW_HOME_VOLUME`                          | Utrwal `/home/node` w nazwanym wolumenie Docker                         |
| `OPENCLAW_SANDBOX`                              | Włącz bootstrap sandboxa (`1`, `true`, `yes`, `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                      | Pomiń interaktywny krok onboardingu (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`                        | Nadpisz ścieżkę gniazda Docker                                           |
| `OPENCLAW_DISABLE_BONJOUR`                      | Wyłącz ogłaszanie Bonjour/mDNS (domyślnie `1` dla Docker)         |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Wyłącz nakładki montowania bind źródeł dołączonych pluginów                     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Wspólny endpoint kolektora OTLP/HTTP dla eksportu OpenTelemetry          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpointy OTLP specyficzne dla sygnału dla śladów, metryk lub logów           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Nadpisanie protokołu OTLP. Obecnie obsługiwane jest tylko `http/protobuf`       |
| `OTEL_SERVICE_NAME`                             | Nazwa usługi używana dla zasobów OpenTelemetry                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Włącz najnowsze eksperymentalne atrybuty semantyczne GenAI               |
| `OPENCLAW_OTEL_PRELOADED`                       | Pomiń uruchamianie drugiego SDK OpenTelemetry, gdy jedno jest już wstępnie załadowane        |

Oficjalny obraz Docker nie zawiera Homebrew. Podczas onboardingu OpenClaw ukrywa
instalatory zależności Skills dostępne tylko przez brew, gdy działa w kontenerze
Linux bez `brew`; te zależności muszą zostać dostarczone przez obraz niestandardowy
albo zainstalowane ręcznie. Dla zależności dostępnych z pakietów Debian użyj
`OPENCLAW_IMAGE_APT_PACKAGES` podczas budowania obrazu. Starsza nazwa
`OPENCLAW_DOCKER_APT_PACKAGES` nadal jest akceptowana.
Dla zależności Python użyj `OPENCLAW_IMAGE_PIP_PACKAGES`. To uruchamia
`python3 -m pip install --break-system-packages` podczas budowania obrazu, więc
przypinaj wersje pakietów i używaj tylko zaufanych indeksów pakietów.
Budowania ze źródeł domyślnie ustawiają `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` na
`--max-old-space-size=8192` i pozostawiają
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` nieustawione, aby wrapper tsdown
mógł respektować limity pamięci kontenera. Domyślnie ustawiają też
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1`, ponieważ obrazy runtime usuwają pliki
deklaracji po budowaniu. Jeśli Docker zgłasza `ResourceExhausted`, `cannot allocate
memory` albo przerywa podczas `tsdown`, zwiększ limit pamięci buildera Docker albo
spróbuj ponownie z mniejszymi jawnymi stertami, na przykład
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Maintainerzy mogą testować źródło dołączonego pluginu względem spakowanego obrazu,
montując jeden katalog źródłowy pluginu na jego spakowaną ścieżkę źródłową, na przykład
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ten zamontowany katalog źródłowy nadpisuje pasujący skompilowany pakiet
`/app/dist/extensions/synology-chat` dla tego samego identyfikatora pluginu.

### Obserwowalność

Eksport OpenTelemetry jest wychodzący z kontenera Gateway do Twojego kolektora
OTLP. Nie wymaga opublikowanego portu Docker. Jeśli budujesz obraz lokalnie i
chcesz, aby dołączony eksporter OpenTelemetry był dostępny wewnątrz obrazu,
uwzględnij jego zależności runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Zainstaluj oficjalny plugin `@openclaw/diagnostics-otel` z ClawHub w spakowanych
instalacjach Docker przed włączeniem eksportu. Niestandardowe obrazy budowane ze
źródeł nadal mogą zawierać lokalne źródło pluginu z
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Aby włączyć eksport, zezwól i włącz plugin
`diagnostics-otel` w konfiguracji, a następnie ustaw
`diagnostics.otel.enabled=true` albo użyj przykładu konfiguracji w [Eksport
OpenTelemetry](/pl/gateway/opentelemetry). Nagłówki uwierzytelniania kolektora są
konfigurowane przez `diagnostics.otel.headers`, a nie przez zmienne środowiskowe
Docker.

Metryki Prometheus używają już opublikowanego portu Gateway. Zainstaluj
`clawhub:@openclaw/diagnostics-prometheus`, włącz plugin
`diagnostics-prometheus`, a następnie pobieraj metryki:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Trasa jest chroniona uwierzytelnianiem Gateway. Nie wystawiaj osobnego publicznego
portu `/metrics` ani nieuwierzytelnionej ścieżki reverse proxy. Zobacz
[Metryki Prometheus](/pl/gateway/prometheus).

### Kontrole kondycji

Endpointy sond kontenera (uwierzytelnianie niewymagane):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli kontrole nadal kończą się niepowodzeniem, Docker oznacza kontener jako `unhealthy`, a
systemy orkiestracji mogą go zrestartować lub zastąpić.

Uwierzytelniony szczegółowy zrzut stanu zdrowia:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN a loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, dzięki czemu dostęp hosta do
`http://127.0.0.1:18789` działa z publikowaniem portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą dotrzeć do opublikowanego portu gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą dotrzeć
  bezpośrednio do gateway.

<Note>
Używaj wartości trybu wiązania w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta, takich jak `0.0.0.0` lub `127.0.0.1`.
</Note>

### Lokalne providery hosta

Gdy OpenClaw działa w Docker, `127.0.0.1` wewnątrz kontenera oznacza sam kontener,
a nie komputer hosta. Używaj `host.docker.internal` dla providerów AI, które
działają na hoście:

| Provider  | Domyślny URL hosta       | URL konfiguracji Docker             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Dołączona konfiguracja Docker używa tych adresów URL hosta jako domyślnych
wartości onboardingu LM Studio i Ollama, a `docker-compose.yml` mapuje `host.docker.internal` na
gateway hosta Docker dla Linux Docker Engine. Docker Desktop zapewnia już
tę samą nazwę hosta w macOS i Windows.

Usługi hosta muszą także nasłuchiwać na adresie osiągalnym z Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jeśli używasz własnego pliku Compose lub polecenia `docker run`, dodaj takie samo
mapowanie hosta samodzielnie, na przykład
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI w Docker

Oficjalny obraz Docker OpenClaw nie ma wstępnie zainstalowanego Claude Code. Zainstaluj i
zaloguj się do Claude Code wewnątrz użytkownika kontenera, który uruchamia OpenClaw, a następnie utrwal
katalog domowy tego kontenera, aby aktualizacje obrazu nie usuwały pliku binarnego ani stanu
uwierzytelnienia Claude.

W przypadku nowych instalacji Docker włącz trwały wolumin `/home/node` przed uruchomieniem
konfiguracji:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

W przypadku istniejącej instalacji Docker najpierw zatrzymaj stos i ponownie wczytaj bieżące
wartości Docker `.env` przed ponownym uruchomieniem konfiguracji. Skrypt konfiguracyjny nie odczytuje
samodzielnie `.env`; przepisuje `.env` z bieżącej powłoki i wartości domyślnych. Dla
wygenerowanego `.env` uruchom:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Jeśli Twój `.env` zawiera wartości, których powłoka nie może wczytać, najpierw ręcznie ponownie wyeksportuj
istniejące wartości, na których polegasz, takie jak `OPENCLAW_IMAGE`, porty, tryb wiązania,
niestandardowe ścieżki, `OPENCLAW_EXTRA_MOUNTS`, sandbox i ustawienia pomijania onboardingu.
Wygenerowana nakładka montuje wolumin domowy zarówno dla `openclaw-gateway`, jak i
`openclaw-cli`.

Uruchom pozostałe polecenia z wygenerowaną nakładką Compose, aby obie usługi
montowały utrwalony katalog domowy. Jeśli Twoja konfiguracja używa także `docker-compose.override.yml`,
uwzględnij go przed `docker-compose.extra.yml`.

Zainstaluj Claude Code w tym utrwalonym katalogu domowym:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Natywny instalator zapisuje plik binarny `claude` pod
`/home/node/.local/bin/claude`. Wskaż OpenClaw tę ścieżkę kontenera:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Zaloguj się i zweryfikuj z wnętrza tego samego utrwalonego katalogu domowego kontenera:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

Następnie możesz użyć dołączonego backendu `claude-cli`:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` utrwala natywną instalację Claude Code pod
`/home/node/.local/bin` i `/home/node/.local/share/claude`, a także ustawienia Claude Code
oraz stan uwierzytelnienia pod `/home/node/.claude` i `/home/node/.claude.json`.
Utrwalenie samego `/home/node/.openclaw` nie wystarczy do ponownego użycia Claude CLI. Jeśli
używasz `OPENCLAW_EXTRA_MOUNTS` zamiast woluminu domowego, zamontuj wszystkie te
ścieżki Claude w obu usługach Docker.

<Note>
W przypadku współdzielonej automatyzacji produkcyjnej lub przewidywalnych rozliczeń Anthropic preferuj
ścieżkę klucza API Anthropic. Ponowne użycie Claude CLI zależy od zainstalowanej
wersji Claude Code, logowania na konto, rozliczeń i zachowania aktualizacji.
</Note>

### Bonjour / mDNS

  Sieć mostkowa Dockera zwykle nie przekazuje niezawodnie multicastu Bonjour/mDNS
  (`224.0.0.251:5353`). Dlatego dołączona konfiguracja Compose domyślnie ustawia
  `OPENCLAW_DISABLE_BONJOUR=1`, aby Gateway nie wpadał w pętlę awarii ani wielokrotnie
  nie restartował rozgłaszania, gdy mostek odrzuca ruch multicast.

  Dla hostów Docker użyj opublikowanego URL-a Gateway, Tailscale albo rozległego DNS-SD.
  Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko podczas działania z siecią hosta, macvlan
  albo inną siecią, w której wiadomo, że multicast mDNS działa.

  Informacje o pułapkach i rozwiązywaniu problemów znajdziesz w sekcji [wykrywanie Bonjour](/pl/gateway/bonjour).

  ### Przechowywanie i trwałość danych

  Docker Compose montuje przez bind mount `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw`,
  `OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace` oraz
  `OPENCLAW_AUTH_PROFILE_SECRET_DIR` do `/home/node/.config/openclaw`, więc te
  ścieżki przetrwają wymianę kontenera. Gdy dowolna zmienna nie jest ustawiona,
  dołączony `docker-compose.yml` używa lokalizacji pod `${HOME}`, albo `/tmp`, gdy
  brakuje także samego `HOME`. Dzięki temu `docker compose up` nie emituje
  specyfikacji woluminu z pustym źródłem w podstawowych środowiskach.

  Ten zamontowany katalog konfiguracji to miejsce, w którym OpenClaw przechowuje:

  - `openclaw.json` dla konfiguracji zachowania
  - `agents/<agentId>/agent/auth-profiles.json` dla zapisanych danych uwierzytelniania dostawcy OAuth/kluczem API
  - `.env` dla sekretów środowiskowych czasu działania, takich jak `OPENCLAW_GATEWAY_TOKEN`

  Katalog klucza sekretu profilu uwierzytelniania przechowuje lokalny klucz szyfrowania używany dla
  materiału tokenów profilu uwierzytelniania opartego na OAuth. Przechowuj go ze stanem hosta Docker,
  ale oddzielnie od `OPENCLAW_CONFIG_DIR`.

  Zainstalowane pobieralne pluginy przechowują stan swoich pakietów w zamontowanym
  katalogu domowym OpenClaw, więc rekordy instalacji pluginów i katalogi główne pakietów
  przetrwają wymianę kontenera. Uruchomienie Gateway nie generuje drzew zależności
  dołączonych pluginów.

  Pełne szczegóły trwałości danych we wdrożeniach VM znajdziesz w sekcji
  [Środowisko wykonawcze Docker VM - co gdzie jest utrwalane](/pl/install/docker-vm-runtime#what-persists-where).

  **Miejsca szybkiego wzrostu użycia dysku:** obserwuj `media/`, pliki JSONL sesji, współdzieloną
  bazę danych stanu SQLite, katalogi główne pakietów zainstalowanych pluginów oraz rotowane logi plikowe
  w `/tmp/openclaw/`.

  ### Pomocnicze skrypty powłoki (opcjonalne)

  Aby ułatwić codzienne zarządzanie Dockerem, zainstaluj `ClawDock`:

  ```bash
  mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
  echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
  ```

  Jeśli zainstalowano ClawDock ze starszej surowej ścieżki `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocniczy śledził nową lokalizację.

  Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
  `clawdock-help`, aby zobaczyć wszystkie polecenia.
  Pełny przewodnik po narzędziach pomocniczych znajdziesz w sekcji [ClawDock](/pl/install/clawdock).

  <AccordionGroup>
  <Accordion title="Włącz sandbox agenta dla Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Niestandardowa ścieżka gniazda (np. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrypt montuje `docker.sock` dopiero po spełnieniu wymagań wstępnych sandboxa. Jeśli
    konfiguracja sandboxa nie może zostać ukończona, skrypt resetuje `agents.defaults.sandbox.mode`
    do `off`. Tury trybu kodu Codex nadal są ograniczone do Codex
    `workspace-write`, gdy sandbox OpenClaw jest aktywny; nie montuj
    gniazda Docker hosta w kontenerach sandboxa agenta.

  </Accordion>

  <Accordion title="Automatyzacja / CI (nieinteraktywne)">
    Wyłącz alokację pseudo-TTY Compose za pomocą `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga dotycząca bezpieczeństwa sieci współdzielonej">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, aby polecenia CLI
    mogły dotrzeć do gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja Compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` zarówno dla `openclaw-gateway`, jak i `openclaw-cli`.
  </Accordion>

  <Accordion title="Awarie DNS Docker Desktop w openclaw-cli">
    Niektóre konfiguracje Docker Desktop nie wykonują wyszukiwań DNS z sidecara
    `openclaw-cli` w sieci współdzielonej po usunięciu `NET_RAW`, co objawia się jako
    `EAI_AGAIN` podczas poleceń opartych na npm, takich jak `openclaw plugins install`.
    Zachowaj domyślny utwardzony plik Compose dla normalnego działania gateway. Poniższe
    lokalne nadpisanie osłabia profil bezpieczeństwa kontenera CLI przez
    przywrócenie domyślnych uprawnień Dockera, więc używaj go tylko dla jednorazowego polecenia CLI,
    które potrzebuje dostępu do rejestru pakietów, a nie jako domyślnego
    wywołania Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Jeśli masz już utworzony długo działający kontener `openclaw-cli`, utwórz go ponownie
    z tym samym nadpisaniem. `docker compose exec` i `docker exec` nie mogą
    zmienić uprawnień Linux w już utworzonym kontenerze.

  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień dla
    `/home/node/.openclaw`, upewnij się, że bind mounty hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ta sama niezgodność może pojawić się jako ostrzeżenie pluginu, takie jak
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    po którym następuje `plugin present but blocked`. Oznacza to, że uid procesu i właściciel
    zamontowanego katalogu pluginu są różne. Preferuj uruchamianie kontenera jako
    domyślny uid 1000 i naprawienie własności bind mountu. Wykonaj chown
    `/path/to/openclaw-config/npm` na `root:root` tylko wtedy, gdy celowo uruchamiasz
    OpenClaw jako root długoterminowo.

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Uporządkuj Dockerfile tak, aby warstwy zależności były buforowane. Pozwala to uniknąć ponownego uruchamiania
    `pnpm install`, chyba że zmienią się pliki lockfile:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Opcje kontenera dla zaawansowanych użytkowników">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako nieuprzywilejowany użytkownik `node`. Aby uzyskać bardziej
    rozbudowany kontener:

    1. **Utrwal `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Wbuduj zależności Pythona**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Wbuduj Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Albo zainstaluj przeglądarki Playwright w utrwalonym woluminie**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Utrwal pobierane pliki przeglądarki**: użyj `OPENCLAW_HOME_VOLUME` lub
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw automatycznie wykrywa zarządzany przez Playwright
       Chromium z obrazu Docker w systemie Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (bezgłowy Docker)">
    Jeśli wybierzesz OpenAI Codex OAuth w kreatorze, otworzy on adres URL w przeglądarce. W
    Dockerze lub konfiguracjach bezgłowych skopiuj pełny adres URL przekierowania, na który trafisz, i wklej
    go z powrotem do kreatora, aby ukończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz środowiska uruchomieniowego Docker używa `node:24-bookworm-slim` i zawiera `tini` jako proces inicjujący punktu wejścia (PID 1), aby zapewnić zbieranie procesów zombie i poprawną obsługę sygnałów w długo działających kontenerach. Publikuje adnotacje obrazu bazowego OCI, w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Skrót bazowego obrazu Node jest
    odświeżany przez PR-y Dependabot dla obrazów bazowych Docker; kompilacje wydań nie uruchamiają
    warstwy aktualizacji dystrybucji. Zobacz
    [adnotacje obrazów OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamiasz na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) oraz
[Docker VM Runtime](/pl/install/docker-vm-runtime), aby poznać wspólne kroki wdrożenia na maszynie wirtualnej,
w tym wbudowywanie plików binarnych, trwałość danych i aktualizacje.

## Piaskownica agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, gateway
uruchamia wykonywanie narzędzi agenta (powłoka, odczyt/zapis plików itd.) w izolowanych kontenerach Docker,
podczas gdy sam gateway pozostaje na hoście. Daje to twardą granicę
wokół niezaufanych lub wielodzierżawnych sesji agentów bez konteneryzowania całego
gateway.

Zakres piaskownicy może być per agent (domyślnie), per sesja albo współdzielony. Każdy zakres
otrzymuje własny obszar roboczy zamontowany w `/workspace`. Możesz też skonfigurować
zasady zezwalania/odmawiania dla narzędzi, izolację sieci, limity zasobów oraz kontenery
przeglądarek.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile wieloagentowe znajdziesz tutaj:

- [Piaskownica](/pl/gateway/sandboxing) -- pełna dokumentacja piaskownicy
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp powłoki do kontenerów piaskownicy
- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent

### Szybkie włączenie

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Zbuduj domyślny obraz piaskownicy (z checkoutu źródeł):

```bash
scripts/sandbox-setup.sh
```

W przypadku instalacji npm bez checkoutu źródeł zobacz [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), aby uzyskać wbudowane polecenia `docker build`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu lub kontener piaskownicy nie uruchamia się">
    Zbuduj obraz piaskownicy za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout źródeł) albo wbudowanego polecenia `docker build` z [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup) (instalacja npm),
    albo ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są automatycznie tworzone per sesja na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w piaskownicy">
    Ustaw `docker.user` na UID:GID zgodne z właścicielem zamontowanego obszaru roboczego
    albo zmień właściciela folderu obszaru roboczego poleceniem chown.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie są znajdowane w piaskownicy">
    OpenClaw uruchamia polecenia przez `sh -lc` (powłoka logowania), co wczytuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby poprzedzić ścieżki
    do własnych narzędzi, albo dodaj skrypt w `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="Proces zabity przez OOM podczas budowania obrazu (kod wyjścia 137)">
    Maszyna wirtualna potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Brak autoryzacji lub wymagane parowanie w Control UI">
    Pobierz świeży link do panelu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Dashboard](/pl/web/dashboard), [Urządzenia](/pl/cli/devices).

  </Accordion>

  <Accordion title="Cel Gateway pokazuje ws://172.x.x.x lub błędy parowania z Docker CLI">
    Zresetuj tryb gateway i powiązanie:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Powiązane

- [Przegląd instalacji](/pl/install) — wszystkie metody instalacji
- [Podman](/pl/install/podman) — alternatywa Podman dla Docker
- [ClawDock](/pl/install/clawdock) — społecznościowa konfiguracja Docker Compose
- [Aktualizacja](/pl/install/updating) — utrzymywanie OpenClaw w aktualnej wersji
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja gateway po instalacji
