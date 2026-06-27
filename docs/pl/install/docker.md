---
read_when:
    - Chcesz konteneryzowanego Gateway zamiast lokalnych instalacji
    - Walidujesz przepływ Docker
summary: Opcjonalna konfiguracja i wdrożenie OpenClaw oparte na Dockerze
title: Docker
x-i18n:
    generated_at: "2026-06-27T17:42:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz uruchomić skonteneryzowany Gateway albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie odpowiedni?

- **Tak**: chcesz mieć izolowane, jednorazowe środowisko Gateway albo uruchomić OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz na własnym komputerze i chcesz po prostu najszybszej pętli deweloperskiej. Zamiast tego użyj normalnego przepływu instalacji.
- **Uwaga o izolacji**: domyślny backend izolacji używa Docker, gdy izolacja jest włączona, ale izolacja jest domyślnie wyłączona i **nie** wymaga uruchamiania całego Gateway w Docker. Dostępne są też backendy izolacji SSH i OpenShell. Zobacz [Izolacja](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (albo Docker Engine) + Docker Compose v2
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

    Gotowe obrazy są publikowane w
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Typowe tagi: `main`, `latest`, `<version>` (np. `2026.2.26`).

  </Step>

  <Step title="Ponowne uruchomienie bez dostępu do sieci">
    Na hostach offline najpierw przenieś i załaduj obraz:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` sprawdza, czy `OPENCLAW_IMAGE` już istnieje lokalnie, wyłącza
    niejawne pobieranie i budowanie przez Compose, a następnie uruchamia normalny
    przepływ konfiguracji, taki jak synchronizacja `.env`, poprawki uprawnień,
    onboarding, synchronizacja konfiguracji Gateway i start Compose.

    Jeśli `OPENCLAW_SANDBOX=1`, konfiguracja offline sprawdza też skonfigurowane domyślne
    oraz aktywne obrazy izolacji per-agent w daemonie za
    `OPENCLAW_DOCKER_SOCKET`. Obrazy przeglądarki oparte na Docker muszą też mieć
    bieżącą etykietę kontraktu przeglądarki OpenClaw. Gdy wymagany obraz jest brakujący lub
    niezgodny, konfiguracja kończy się bez zmiany konfiguracji izolacji, zamiast
    zgłaszać sukces z nieużywalną izolacją.

  </Step>

  <Step title="Ukończ onboarding">
    Skrypt konfiguracji automatycznie uruchamia onboarding. Wykona on:

    - zapytanie o klucze API dostawców
    - wygenerowanie tokenu Gateway i zapisanie go w `.env`
    - utworzenie katalogu klucza tajnego profilu uwierzytelniania
    - uruchomienie Gateway przez Docker Compose

    Podczas konfiguracji onboarding przed startem i zapisy konfiguracji są wykonywane bezpośrednio przez
    `openclaw-gateway`. `openclaw-cli` służy do poleceń uruchamianych po tym,
    jak kontener Gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    współdzielony sekret w Ustawieniach. Skrypt konfiguracji domyślnie zapisuje token do `.env`;
    jeśli przełączysz konfigurację kontenera na uwierzytelnianie hasłem, użyj
    zamiast tego tego hasła.

    Potrzebujesz ponownie URL-a?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Skonfiguruj kanały (opcjonalnie)">
    Użyj kontenera CLI, aby dodać kanały wiadomości:

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
Uruchamiaj `docker compose` z katalogu głównego repozytorium. Jeśli włączysz `OPENCLAW_EXTRA_MOUNTS`
lub `OPENCLAW_HOME_VOLUME`, skrypt konfiguracji zapisze `docker-compose.extra.yml`;
dołącz go po każdym standardowym pliku override, na przykład
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`,
gdy istnieją oba pliki override.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest
narzędziem po uruchomieniu. Przed `docker compose up -d openclaw-gateway` uruchom onboarding
i zapisy konfiguracji wykonywane podczas konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                                    | Cel                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Użyj zdalnego obrazu zamiast budować lokalnie                         |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Zainstaluj dodatkowe pakiety apt podczas budowania (rozdzielone spacjami) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Zainstaluj dodatkowe pakiety Python podczas budowania (rozdzielone spacjami) |
| `OPENCLAW_EXTENSIONS`                      | Wstępnie zainstaluj zależności pluginów podczas budowania (nazwy rozdzielone spacjami) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Dodatkowe montowania bind z hosta (rozdzielone przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Zachowaj `/home/node` w nazwanym woluminie Docker                     |
| `OPENCLAW_SANDBOX`                         | Włącz bootstrap izolacji (`1`, `true`, `yes`, `on`)                   |
| `OPENCLAW_SKIP_ONBOARDING`                 | Pomiń interaktywny krok onboardingu (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_DOCKER_SOCKET`                   | Nadpisz ścieżkę gniazda Docker                                       |
| `OPENCLAW_DISABLE_BONJOUR`                 | Wyłącz rozgłaszanie Bonjour/mDNS (domyślnie `1` dla Docker)           |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Wyłącz nakładki bind-mount źródeł dołączonych pluginów                |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Wspólny punkt końcowy kolektora OTLP/HTTP dla eksportu OpenTelemetry  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Punkty końcowe OTLP specyficzne dla sygnału: śladów, metryk lub logów |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Nadpisanie protokołu OTLP. Obecnie obsługiwane jest tylko `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nazwa usługi używana dla zasobów OpenTelemetry                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Włącz najnowsze eksperymentalne atrybuty semantyczne GenAI            |
| `OPENCLAW_OTEL_PRELOADED`                  | Pomiń uruchamianie drugiego SDK OpenTelemetry, gdy jedno jest już wstępnie załadowane |

Oficjalny obraz Docker nie zawiera Homebrew. Podczas onboardingu OpenClaw
ukrywa instalatory zależności Skills dostępne tylko przez brew, gdy działa w kontenerze
Linux bez `brew`; te zależności muszą zostać dostarczone przez obraz niestandardowy
albo zainstalowane ręcznie. Dla zależności dostępnych jako pakiety Debian użyj
`OPENCLAW_IMAGE_APT_PACKAGES` podczas budowania obrazu. Starsza nazwa
`OPENCLAW_DOCKER_APT_PACKAGES` jest nadal akceptowana.
Dla zależności Python użyj `OPENCLAW_IMAGE_PIP_PACKAGES`. Uruchamia to
`python3 -m pip install --break-system-packages` podczas budowania obrazu, więc przypnij
wersje pakietów i używaj tylko indeksów pakietów, którym ufasz.

Maintainerzy mogą testować źródła dołączonego pluginu względem spakowanego obrazu, montując
jeden katalog źródłowy pluginu nad jego spakowaną ścieżką źródłową, na przykład
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ten zamontowany katalog źródłowy nadpisuje pasujący skompilowany pakiet
`/app/dist/extensions/synology-chat` dla tego samego identyfikatora pluginu.

### Obserwowalność

Eksport OpenTelemetry wychodzi z kontenera Gateway do Twojego kolektora OTLP.
Nie wymaga opublikowanego portu Docker. Jeśli budujesz obraz
lokalnie i chcesz, aby dołączony eksporter OpenTelemetry był dostępny wewnątrz obrazu,
uwzględnij jego zależności runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Zainstaluj oficjalny plugin `@openclaw/diagnostics-otel` z ClawHub w
spakowanych instalacjach Docker przed włączeniem eksportu. Niestandardowe obrazy zbudowane ze źródeł mogą
nadal dołączyć lokalne źródła pluginu za pomocą
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Aby włączyć eksport, dopuść i włącz
plugin `diagnostics-otel` w konfiguracji, a następnie ustaw
`diagnostics.otel.enabled=true` albo użyj przykładu konfiguracji w [Eksport
OpenTelemetry](/pl/gateway/opentelemetry). Nagłówki uwierzytelniania kolektora konfiguruje się przez
`diagnostics.otel.headers`, a nie przez zmienne środowiskowe Docker.

Metryki Prometheus używają już opublikowanego portu Gateway. Zainstaluj
`clawhub:@openclaw/diagnostics-prometheus`, włącz plugin
`diagnostics-prometheus`, a następnie scrapuj:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Trasa jest chroniona uwierzytelnianiem Gateway. Nie wystawiaj osobnego
publicznego portu `/metrics` ani nieuwierzytelnionej ścieżki reverse proxy. Zobacz
[Metryki Prometheus](/pl/gateway/prometheus).

### Kontrole kondycji

Punkty końcowe sond kontenera (bez wymaganego uwierzytelniania):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli kontrole ciągle się nie udają, Docker oznacza kontener jako `unhealthy`, a
systemy orkiestracji mogą go zrestartować lub zastąpić.

Uwierzytelniona głęboka migawka kondycji:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN a loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, aby dostęp hosta do
`http://127.0.0.1:18789` działał z publikowaniem portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą dosięgnąć opublikowanego portu Gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą dosięgnąć
  Gateway bezpośrednio.

<Note>
Używaj wartości trybu bindowania w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` lub `127.0.0.1`.
</Note>

### Lokalne dostawcy hosta

Gdy OpenClaw działa w Docker, `127.0.0.1` wewnątrz kontenera oznacza sam kontener,
a nie Twoją maszynę hosta. Używaj `host.docker.internal` dla dostawców AI, którzy
działają na hoście:

| Dostawca  | Domyślny URL hosta       | URL konfiguracji Docker             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Dołączona konfiguracja Docker używa tych URL-i hosta jako domyślnych wartości onboardingu
dla LM Studio i Ollama, a `docker-compose.yml` mapuje `host.docker.internal` na
bramę hosta Docker dla Linux Docker Engine. Docker Desktop już zapewnia
tę samą nazwę hosta w macOS i Windows.

Usługi hosta muszą też nasłuchiwać na adresie osiągalnym z Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jeśli używasz własnego pliku Compose albo polecenia `docker run`, dodaj to samo
mapowanie hosta samodzielnie, na przykład
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI w Dockerze

Oficjalny obraz Docker OpenClaw nie ma wstępnie zainstalowanego Claude Code. Zainstaluj
Claude Code i zaloguj się do niego wewnątrz użytkownika kontenera, który uruchamia OpenClaw,
a następnie utrwal katalog domowy tego kontenera, aby aktualizacje obrazu nie usuwały pliku
binarnego ani stanu uwierzytelniania Claude.

W przypadku nowych instalacji Docker włącz trwały wolumin `/home/node` przed uruchomieniem
konfiguracji:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

W przypadku istniejącej instalacji Docker najpierw zatrzymaj stos i ponownie załaduj bieżące
wartości Docker `.env` przed ponownym uruchomieniem konfiguracji. Skrypt konfiguracyjny nie czyta
`.env` samodzielnie; przepisuje `.env` na podstawie bieżącej powłoki i wartości domyślnych. Dla
wygenerowanego `.env` uruchom:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Jeśli plik `.env` zawiera wartości, których powłoka nie może wczytać, najpierw ręcznie ponownie
wyeksportuj istniejące wartości, na których polegasz, takie jak `OPENCLAW_IMAGE`, porty, tryb
wiązania, ścieżki niestandardowe, `OPENCLAW_EXTRA_MOUNTS`, piaskownica i ustawienia pomijania
onboardingu. Wygenerowana nakładka montuje wolumin domowy zarówno dla `openclaw-gateway`, jak i
`openclaw-cli`.

Uruchamiaj pozostałe polecenia z wygenerowaną nakładką Compose, aby obie usługi montowały
utrwalony katalog domowy. Jeśli Twoja konfiguracja używa też `docker-compose.override.yml`,
dołącz go przed `docker-compose.extra.yml`.

Zainstaluj Claude Code w tym utrwalonym katalogu domowym:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Natywny instalator zapisuje plik binarny `claude` pod
`/home/node/.local/bin/claude`. Powiedz OpenClaw, aby używał tej ścieżki kontenera:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Zaloguj się i zweryfikuj z poziomu tego samego utrwalonego katalogu domowego kontenera:

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

Następnie możesz używać dołączonego backendu `claude-cli`:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` utrwala natywną instalację Claude Code pod
`/home/node/.local/bin` i `/home/node/.local/share/claude`, a także ustawienia Claude Code
i stan uwierzytelniania pod `/home/node/.claude` oraz `/home/node/.claude.json`.
Utrwalenie samego `/home/node/.openclaw` nie wystarczy do ponownego użycia Claude CLI. Jeśli
używasz `OPENCLAW_EXTRA_MOUNTS` zamiast woluminu domowego, zamontuj wszystkie te ścieżki Claude
w obu usługach Docker.

<Note>
W przypadku współdzielonej automatyzacji produkcyjnej lub przewidywalnego rozliczania Anthropic
preferuj ścieżkę klucza API Anthropic. Ponowne użycie Claude CLI podąża za zainstalowaną wersją
Claude Code, logowaniem konta, rozliczeniami i zachowaniem aktualizacji.
</Note>

### Bonjour / mDNS

Sieć mostkowana Docker zwykle nie przekazuje niezawodnie multicastu Bonjour/mDNS
(`224.0.0.251:5353`). Dlatego dołączona konfiguracja Compose domyślnie ustawia
`OPENCLAW_DISABLE_BONJOUR=1`, aby Gateway nie wpadał w pętlę awarii ani wielokrotnie nie
restartował rozgłaszania, gdy mostek odrzuca ruch multicast.

Dla hostów Docker użyj opublikowanego adresu URL Gateway, Tailscale albo szerokoobszarowego
DNS-SD. Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko wtedy, gdy uruchamiasz z siecią hosta,
macvlan albo inną siecią, w której wiadomo, że multicast mDNS działa.

Pułapki i rozwiązywanie problemów opisuje [wykrywanie Bonjour](/pl/gateway/bonjour).

### Przechowywanie i trwałość

Docker Compose montuje przez bind mount `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace` oraz
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` do `/home/node/.config/openclaw`, więc te ścieżki
przetrwają wymianę kontenera. Gdy dowolna zmienna nie jest ustawiona, dołączony
`docker-compose.yml` używa ścieżki zapasowej pod `${HOME}`, albo `/tmp`, gdy brakuje także
samego `HOME`. Dzięki temu `docker compose up` nie emituje specyfikacji woluminu z pustym
źródłem w surowych środowiskach.

W tym zamontowanym katalogu konfiguracji OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanych uwierzytelnień OAuth/kluczy API dostawców
- `.env` dla sekretów runtime opartych na zmiennych środowiskowych, takich jak `OPENCLAW_GATEWAY_TOKEN`

Katalog klucza sekretu profilu uwierzytelniania przechowuje lokalny klucz szyfrowania używany dla
materiału tokenów profilu uwierzytelniania opartego na OAuth. Przechowuj go wraz ze stanem hosta
Docker, ale oddzielnie od `OPENCLAW_CONFIG_DIR`.

Zainstalowane pobieralne plugins przechowują swój stan pakietu pod zamontowanym katalogiem domowym
OpenClaw, więc rekordy instalacji Plugin i katalogi główne pakietów przetrwają wymianę kontenera.
Uruchomienie Gateway nie generuje drzew zależności dołączonych Plugin.

Pełne szczegóły trwałości we wdrożeniach VM znajdziesz w
[Docker VM Runtime - Co jest utrwalane i gdzie](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca szybkiego wzrostu zużycia dysku:** obserwuj `media/`, pliki JSONL sesji, współdzieloną
bazę stanu SQLite, katalogi główne zainstalowanych pakietów Plugin oraz rotowane logi plikowe
pod `/tmp/openclaw/`.

### Pomocniki powłoki (opcjonalne)

Aby ułatwić codzienne zarządzanie Docker, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli zainstalowano ClawDock ze starszej surowej ścieżki `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocniczy śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik po pomocniku znajdziesz w [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Włącz piaskownicę agenta dla Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Niestandardowa ścieżka gniazda (np. Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrypt montuje `docker.sock` dopiero po spełnieniu wymagań wstępnych piaskownicy. Jeśli
    konfiguracja piaskownicy nie może zostać ukończona, skrypt resetuje `agents.defaults.sandbox.mode`
    do `off`. Przebiegi Codex code-mode nadal są ograniczone do Codex
    `workspace-write`, gdy piaskownica OpenClaw jest aktywna; nie montuj gniazda Docker hosta
    w kontenerach piaskownicy agenta.

  </Accordion>

  <Accordion title="Automatyzacja / CI (nieinteraktywne)">
    Wyłącz alokację pseudo-TTY Compose za pomocą `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga o bezpieczeństwie sieci współdzielonej">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, aby polecenia CLI
    mogły połączyć się z gateway przez `127.0.0.1`. Traktuj to jako współdzieloną granicę
    zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` zarówno dla `openclaw-gateway`, jak i `openclaw-cli`.
  </Accordion>

  <Accordion title="Awarie DNS Docker Desktop w openclaw-cli">
    Niektóre konfiguracje Docker Desktop nie wykonują poprawnie zapytań DNS z sidecara
    `openclaw-cli` w sieci współdzielonej po usunięciu `NET_RAW`, co objawia się jako
    `EAI_AGAIN` podczas poleceń opartych na npm, takich jak `openclaw plugins install`.
    Zachowaj domyślny utwardzony plik compose dla normalnego działania gateway. Poniższa
    lokalna nakładka osłabia postawę bezpieczeństwa kontenera CLI przez przywrócenie
    domyślnych capabilities Docker, więc używaj jej tylko dla jednorazowego polecenia CLI,
    które potrzebuje dostępu do rejestru pakietów, a nie jako domyślnego wywołania Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Jeśli utworzono już długotrwale działający kontener `openclaw-cli`, utwórz go ponownie
    z tą samą nakładką. `docker compose exec` i `docker exec` nie mogą zmienić Linux
    capabilities w już utworzonym kontenerze.

  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień na
    `/home/node/.openclaw`, upewnij się, że bind mounty hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ta sama niezgodność może pojawić się jako ostrzeżenie Plugin, takie jak
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    po którym następuje `plugin present but blocked`. Oznacza to, że uid procesu i właściciel
    zamontowanego katalogu Plugin są różni. Preferuj uruchamianie kontenera jako domyślny uid 1000
    i naprawę właściciela bind mountu. Zmieniaj właściciela
    `/path/to/openclaw-config/npm` na `root:root` tylko wtedy, gdy celowo uruchamiasz
    OpenClaw jako root długoterminowo.

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Uporządkuj Dockerfile tak, aby warstwy zależności były buforowane. Pozwala to uniknąć
    ponownego uruchamiania `pnpm install`, chyba że zmienią się lockfile:

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
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako nie-root `node`. Aby uzyskać
    pełniej wyposażony kontener:

    1. **Utrwal `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Wbuduj zależności Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Wbuduj Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Albo zainstaluj przeglądarki Playwright w utrwalonym woluminie**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Utrwal pobrania przeglądarek**: użyj `OPENCLAW_HOME_VOLUME` albo
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw automatycznie wykrywa zarządzany przez Playwright
       Chromium z obrazu Docker w systemie Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Jeśli wybierzesz OpenAI Codex OAuth w kreatorze, otworzy on adres URL przeglądarki. W
    Docker albo konfiguracjach headless skopiuj pełny przekierowujący adres URL, na którym wylądujesz,
    i wklej go z powrotem do kreatora, aby zakończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz środowiska uruchomieniowego Docker używa `node:24-bookworm-slim` i zawiera `tini` jako proces init punktu wejścia (PID 1), aby zapewnić zbieranie procesów zombie i poprawną obsługę sygnałów w długo działających kontenerach. Publikuje adnotacje obrazu bazowego OCI, w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Digest bazowy Node jest
    odświeżany przez PR-y Dependabot dla obrazów bazowych Docker; buildy wydań nie uruchamiają
    warstwy aktualizacji dystrybucji. Zobacz
    [adnotacje obrazu OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamiasz na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) i
[Środowisko uruchomieniowe Docker VM](/pl/install/docker-vm-runtime), aby poznać wspólne kroki wdrożenia VM,
w tym przygotowanie binariów, trwałość danych i aktualizacje.

## Piaskownica agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, Gateway
uruchamia wykonywanie narzędzi agenta (powłokę, odczyt/zapis plików itd.) wewnątrz izolowanych kontenerów
Docker, podczas gdy sam Gateway pozostaje na hoście. Daje to twardą barierę
wokół niezaufanych lub wielodzierżawczych sesji agentów bez konteneryzowania całego
Gateway.

Zakres piaskownicy może być per agent (domyślnie), per sesja albo współdzielony. Każdy zakres
otrzymuje własny obszar roboczy zamontowany w `/workspace`. Możesz także skonfigurować
zasady zezwalania/odmawiania dla narzędzi, izolację sieci, limity zasobów i kontenery
przeglądarki.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile wieloagentowe znajdziesz tutaj:

- [Piaskownica](/pl/gateway/sandboxing) -- pełna dokumentacja piaskownicy
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp powłoki do kontenerów piaskownicy
- [Piaskownica i narzędzia wieloagentowe](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent

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

Dla instalacji npm bez checkoutu źródeł zobacz [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), aby poznać wbudowane polecenia `docker build`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu albo kontener piaskownicy się nie uruchamia">
    Zbuduj obraz piaskownicy za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout źródeł) albo wbudowanego polecenia `docker build` z [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup) (instalacja npm),
    albo ustaw `agents.defaults.sandbox.docker.image` na swój obraz niestandardowy.
    Kontenery są automatycznie tworzone per sesja na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w piaskownicy">
    Ustaw `docker.user` na UID:GID zgodne z własnością zamontowanego obszaru roboczego
    albo zmień właściciela folderu obszaru roboczego poleceniem chown.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie są znajdowane w piaskownicy">
    OpenClaw uruchamia polecenia za pomocą `sh -lc` (powłoka logowania), która wczytuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby dodać na początku swoje
    ścieżki niestandardowych narzędzi, albo dodaj skrypt w `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="Proces zakończony przez OOM podczas budowania obrazu (kod wyjścia 137)">
    VM potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Brak autoryzacji albo wymagane parowanie w Control UI">
    Pobierz świeży link do panelu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Panel](/pl/web/dashboard), [Urządzenia](/pl/cli/devices).

  </Accordion>

  <Accordion title="Cel Gateway pokazuje ws://172.x.x.x albo błędy parowania z Docker CLI">
    Zresetuj tryb Gateway i powiązanie:

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
- [Aktualizowanie](/pl/install/updating) — utrzymywanie OpenClaw na bieżąco
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja Gateway po instalacji
