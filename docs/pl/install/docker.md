---
read_when:
    - Chcesz skonteneryzowanej bramy zamiast instalacji lokalnych
    - Walidujesz przepływ Docker
summary: Opcjonalna konfiguracja i wdrożenie OpenClaw oparte na Dockerze
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:43:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz skonteneryzowany Gateway albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie odpowiedni?

- **Tak**: chcesz odizolowanego, jednorazowego środowiska Gateway albo uruchomić OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz na własnej maszynie i chcesz po prostu najszybszej pętli deweloperskiej. Zamiast tego użyj standardowego przepływu instalacji.
- **Uwaga o piaskownicy**: domyślny backend piaskownicy używa Docker, gdy piaskownica jest włączona, ale piaskownica jest domyślnie wyłączona i **nie** wymaga uruchamiania całego Gateway w Docker. Dostępne są też backendy piaskownicy SSH i OpenShell. Zobacz [Piaskownica](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM do budowania obrazu (`pnpm install` może zostać zabity z powodu OOM na hostach z 1 GB, z kodem wyjścia 137)
- Wystarczająco dużo miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS/hoście publicznym, przejrzyj
  [Wzmacnianie bezpieczeństwa przy ekspozycji sieciowej](/pl/gateway/security),
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

    Gotowe obrazy są publikowane najpierw w
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR jest głównym rejestrem dla automatyzacji wydań, przypiętych wdrożeń
    i kontroli pochodzenia. Ten sam przepływ wydań publikuje też oficjalne
    lustro Docker Hub pod `openclaw/openclaw` dla hostów preferujących Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Używaj `ghcr.io/openclaw/openclaw` lub `openclaw/openclaw`. Unikaj społecznościowych
    luster Docker Hub, ponieważ OpenClaw nie kontroluje ich harmonogramu wydań,
    przebudów ani polityki przechowywania. Typowe oficjalne tagi: `main`, `latest`,
    `<version>` (np. `2026.2.26`) oraz wersje beta, takie jak
    `2026.2.26-beta.1`. Tagi beta nie przesuwają `latest` ani `main`.

  </Step>

  <Step title="Ponowne uruchomienie bez dostępu do sieci">
    Na hostach offline najpierw przenieś i załaduj obraz:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` sprawdza, czy `OPENCLAW_IMAGE` już istnieje lokalnie, wyłącza
    niejawne pobieranie i budowanie przez Compose, a następnie uruchamia standardowy
    przepływ konfiguracji, taki jak synchronizacja `.env`, poprawki uprawnień,
    onboarding, synchronizacja konfiguracji Gateway i start Compose.

    Jeśli `OPENCLAW_SANDBOX=1`, konfiguracja offline sprawdza też skonfigurowane
    domyślne oraz aktywne obrazy piaskownicy per agent w demonie za
    `OPENCLAW_DOCKER_SOCKET`. Obrazy przeglądarkowe oparte na Docker muszą też mieć
    bieżącą etykietę kontraktu przeglądarki OpenClaw. Gdy wymagany obraz jest brakujący
    lub niezgodny, konfiguracja kończy działanie bez zmieniania konfiguracji piaskownicy,
    zamiast zgłaszać sukces z bezużyteczną piaskownicą.

  </Step>

  <Step title="Dokończ onboarding">
    Skrypt konfiguracji automatycznie uruchamia onboarding. Wykona on:

    - poprosi o klucze API dostawców
    - wygeneruje token Gateway i zapisze go w `.env`
    - utworzy katalog klucza sekretu profilu uwierzytelniania
    - uruchomi Gateway przez Docker Compose

    Podczas konfiguracji onboarding przed startem i zapisy konfiguracji działają
    bezpośrednio przez `openclaw-gateway`. `openclaw-cli` służy do poleceń uruchamianych
    po tym, jak kontener Gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    współdzielony sekret w ustawieniach. Skrypt konfiguracji domyślnie zapisuje token
    w `.env`; jeśli przełączysz konfigurację kontenera na uwierzytelnianie hasłem, użyj
    zamiast tego tego hasła.

    Potrzebujesz ponownie adresu URL?

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

### Ręczny przepływ

Jeśli wolisz uruchomić każdy krok samodzielnie zamiast używać skryptu konfiguracyjnego:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Uruchom `docker compose` z katalogu głównego repozytorium. Jeśli włączono `OPENCLAW_EXTRA_MOUNTS`
lub `OPENCLAW_HOME_VOLUME`, skrypt konfiguracyjny zapisuje `docker-compose.extra.yml`;
dołącz go po każdym standardowym pliku nadpisującym, na przykład
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`,
gdy istnieją oba pliki nadpisujące.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest
narzędziem używanym po uruchomieniu. Przed `docker compose up -d openclaw-gateway` uruchom onboarding
i zapisy konfiguracji na etapie konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracyjny akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                                    | Cel                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Użyj obrazu zdalnego zamiast budować lokalnie                         |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Zainstaluj dodatkowe pakiety apt podczas budowania (oddzielone spacjami) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Zainstaluj dodatkowe pakiety Pythona podczas budowania (oddzielone spacjami) |
| `OPENCLAW_EXTENSIONS`                      | Wstępnie zainstaluj zależności pluginów podczas budowania (nazwy oddzielone spacjami) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Dodatkowe montowania bind hosta (oddzielone przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Utrwal `/home/node` w nazwanym woluminie Docker                       |
| `OPENCLAW_SANDBOX`                         | Włącz bootstrap sandbox (`1`, `true`, `yes`, `on`)                    |
| `OPENCLAW_SKIP_ONBOARDING`                 | Pomiń interaktywny krok onboardingu (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_DOCKER_SOCKET`                   | Zastąp ścieżkę gniazda Docker                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | Wyłącz rozgłaszanie Bonjour/mDNS (domyślnie `1` dla Docker)           |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Wyłącz nakładki bind-mount źródeł dołączonych pluginów                |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Wspólny punkt końcowy kolektora OTLP/HTTP dla eksportu OpenTelemetry  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Punkty końcowe OTLP specyficzne dla sygnałów: śladów, metryk lub logów |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Zastąpienie protokołu OTLP. Obecnie obsługiwany jest tylko `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nazwa usługi używana dla zasobów OpenTelemetry                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Włącz najnowsze eksperymentalne atrybuty semantyczne GenAI            |
| `OPENCLAW_OTEL_PRELOADED`                  | Pomiń uruchamianie drugiego SDK OpenTelemetry, gdy jedno jest wstępnie załadowane |

Oficjalny obraz Docker nie zawiera Homebrew. Podczas onboardingu OpenClaw
ukrywa instalatory zależności skill dostępne tylko przez brew, gdy działa w kontenerze Linux
bez `brew`; te zależności muszą zostać dostarczone przez obraz niestandardowy
lub zainstalowane ręcznie. Dla zależności dostępnych jako pakiety Debian użyj
`OPENCLAW_IMAGE_APT_PACKAGES` podczas budowania obrazu. Starsza nazwa
`OPENCLAW_DOCKER_APT_PACKAGES` jest nadal akceptowana.
Dla zależności Pythona użyj `OPENCLAW_IMAGE_PIP_PACKAGES`. To uruchamia
`python3 -m pip install --break-system-packages` podczas budowania obrazu, więc przypinaj
wersje pakietów i używaj tylko zaufanych indeksów pakietów.

Maintainerzy mogą testować źródła dołączonych pluginów względem spakowanego obrazu, montując
jeden katalog źródeł pluginu na jego spakowanej ścieżce źródłowej, na przykład
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ten zamontowany katalog źródłowy zastępuje odpowiadający mu skompilowany pakiet
`/app/dist/extensions/synology-chat` dla tego samego identyfikatora pluginu.

### Obserwowalność

Eksport OpenTelemetry jest wychodzący z kontenera Gateway do Twojego kolektora
OTLP. Nie wymaga opublikowanego portu Docker. Jeśli budujesz obraz
lokalnie i chcesz, aby dołączony eksporter OpenTelemetry był dostępny w obrazie,
dołącz jego zależności runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Zainstaluj oficjalny plugin `@openclaw/diagnostics-otel` z ClawHub w
spakowanych instalacjach Docker przed włączeniem eksportu. Niestandardowe obrazy zbudowane ze źródeł mogą
nadal zawierać lokalne źródło pluginu z
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Aby włączyć eksport, zezwól na plugin
`diagnostics-otel` i włącz go w konfiguracji, a następnie ustaw
`diagnostics.otel.enabled=true` albo użyj przykładu konfiguracji w [Eksport
OpenTelemetry](/pl/gateway/opentelemetry). Nagłówki uwierzytelniania kolektora konfiguruje się przez
`diagnostics.otel.headers`, a nie przez zmienne środowiskowe Docker.

Metryki Prometheus używają już opublikowanego portu Gateway. Zainstaluj
`clawhub:@openclaw/diagnostics-prometheus`, włącz plugin
`diagnostics-prometheus`, a następnie zbieraj metryki:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Trasa jest chroniona uwierzytelnianiem Gateway. Nie wystawiaj osobnego
publicznego portu `/metrics` ani nieuwierzytelnionej ścieżki reverse proxy. Zobacz
[Metryki Prometheus](/pl/gateway/prometheus).

### Kontrole stanu

Punkty końcowe sond kontenera (bez wymaganego uwierzytelniania):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli kontrole stale kończą się niepowodzeniem, Docker oznacza kontener jako `unhealthy`, a
systemy orkiestracji mogą go zrestartować lub zastąpić.

Uwierzytelniona głęboka migawka stanu:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN kontra loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, dzięki czemu dostęp z hosta do
`http://127.0.0.1:18789` działa z publikowaniem portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą uzyskać dostęp do opublikowanego portu gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą bezpośrednio uzyskać dostęp
  do gateway.

<Note>
Używaj wartości trybu wiązania w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` lub `127.0.0.1`.
</Note>

### Lokalni dostawcy hosta

Gdy OpenClaw działa w Docker, `127.0.0.1` wewnątrz kontenera oznacza sam kontener,
a nie maszynę hosta. Użyj `host.docker.internal` dla dostawców AI, którzy
działają na hoście:

| Dostawca  | Domyślny URL hosta       | URL konfiguracji Docker             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Dołączona konfiguracja Docker używa tych adresów URL hosta jako domyślnych
wartości onboardingu LM Studio i Ollama, a `docker-compose.yml` mapuje
`host.docker.internal` na bramę hosta Dockera dla Linux Docker Engine. Docker
Desktop już udostępnia tę samą nazwę hosta w macOS i Windows.

Usługi hosta muszą także nasłuchiwać na adresie osiągalnym z Dockera:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jeśli używasz własnego pliku Compose lub polecenia `docker run`, dodaj takie
samo mapowanie hosta samodzielnie, na przykład
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI w Dockerze

Oficjalny obraz Docker OpenClaw nie instaluje wstępnie Claude Code. Zainstaluj i
zaloguj się do Claude Code wewnątrz użytkownika kontenera, który uruchamia
OpenClaw, a następnie utrwal katalog domowy tego kontenera, aby aktualizacje
obrazu nie usunęły pliku binarnego ani stanu uwierzytelniania Claude.

W przypadku nowych instalacji Docker włącz trwały wolumin `/home/node` przed
uruchomieniem konfiguracji:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

W przypadku istniejącej instalacji Docker najpierw zatrzymaj stos i ponownie
wczytaj bieżące wartości `.env` Dockera przed ponownym uruchomieniem
konfiguracji. Skrypt konfiguracji nie odczytuje `.env` samodzielnie; przepisuje
`.env` na podstawie bieżącej powłoki i wartości domyślnych. Dla wygenerowanego
`.env` uruchom:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Jeśli Twój `.env` zawiera wartości, których powłoka nie może wczytać,
ręcznie ponownie wyeksportuj najpierw istniejące wartości, na których polegasz,
takie jak `OPENCLAW_IMAGE`, porty, tryb wiązania, niestandardowe ścieżki,
`OPENCLAW_EXTRA_MOUNTS`, piaskownica i ustawienia pomijania onboardingu.
Wygenerowana nakładka montuje wolumin domowy zarówno dla `openclaw-gateway`,
jak i `openclaw-cli`.

Uruchom pozostałe polecenia z wygenerowaną nakładką Compose, aby obie usługi
montowały utrwalony katalog domowy. Jeśli Twoja konfiguracja używa także
`docker-compose.override.yml`, dołącz go przed `docker-compose.extra.yml`.

Zainstaluj Claude Code w tym utrwalonym katalogu domowym:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Natywny instalator zapisuje plik binarny `claude` w
`/home/node/.local/bin/claude`. Poleć OpenClaw używać tej ścieżki kontenera:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Zaloguj się i zweryfikuj z wnętrza tego samego utrwalonego katalogu domowego
kontenera:

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

`OPENCLAW_HOME_VOLUME` utrwala natywną instalację Claude Code w
`/home/node/.local/bin` i `/home/node/.local/share/claude`, a także ustawienia i
stan uwierzytelniania Claude Code w `/home/node/.claude` i
`/home/node/.claude.json`. Utrwalenie samego `/home/node/.openclaw` nie wystarcza
do ponownego użycia Claude CLI. Jeśli używasz `OPENCLAW_EXTRA_MOUNTS` zamiast
woluminu domowego, zamontuj wszystkie te ścieżki Claude w obu usługach Docker.

<Note>
W przypadku współdzielonej automatyzacji produkcyjnej lub przewidywalnego
rozliczania Anthropic preferuj ścieżkę klucza API Anthropic. Ponowne użycie
Claude CLI zależy od zainstalowanej wersji Claude Code, logowania na konto,
rozliczeń i zachowania aktualizacji.
</Note>

### Bonjour / mDNS

Sieć mostkowa Dockera zwykle nie przekazuje niezawodnie multicastu Bonjour/mDNS
(`224.0.0.251:5353`). Dlatego dołączona konfiguracja Compose domyślnie ustawia
`OPENCLAW_DISABLE_BONJOUR=1`, aby Gateway nie wpadał w pętlę awarii ani nie
restartował wielokrotnie rozgłaszania, gdy most odrzuca ruch multicast.

Użyj opublikowanego URL Gateway, Tailscale albo DNS-SD szerokiego obszaru dla
hostów Docker. Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko wtedy, gdy uruchamiasz
z siecią hosta, macvlan albo inną siecią, w której wiadomo, że multicast mDNS
działa.

Problemy i rozwiązywanie usterek opisuje [wykrywanie Bonjour](/pl/gateway/bonjour).

### Przechowywanie i trwałość

Docker Compose montuje przez bind mount `OPENCLAW_CONFIG_DIR` do
`/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` do
`/home/node/.openclaw/workspace` i `OPENCLAW_AUTH_PROFILE_SECRET_DIR` do
`/home/node/.config/openclaw`, więc te ścieżki przetrwają zastąpienie kontenera.
Gdy dowolna zmienna nie jest ustawiona, dołączony `docker-compose.yml` używa
ścieżki pod `${HOME}`, albo `/tmp`, gdy brakuje także samego `HOME`. Dzięki temu
`docker compose up` nie emituje specyfikacji woluminu z pustym źródłem w gołych
środowiskach.

Ten zamontowany katalog konfiguracji to miejsce, w którym OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanych uwierzytelnień OAuth/kluczy API dostawców
- `.env` dla sekretów środowiskowych runtime, takich jak `OPENCLAW_GATEWAY_TOKEN`

Katalog klucza sekretu profilu uwierzytelniania przechowuje lokalny klucz
szyfrowania używany dla materiału tokenów profilu uwierzytelniania opartego na
OAuth. Przechowuj go ze stanem hosta Docker, ale oddzielnie od
`OPENCLAW_CONFIG_DIR`.

Zainstalowane pobieralne Pluginy przechowują stan swoich pakietów w zamontowanym
katalogu domowym OpenClaw, więc rekordy instalacji Pluginów i katalogi główne
pakietów przetrwają zastąpienie kontenera. Uruchomienie Gateway nie generuje
drzew zależności wbudowanych Pluginów.

Pełne informacje o trwałości wdrożeń VM znajdziesz w
[Docker VM Runtime - co jest gdzie utrwalane](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca szybkiego wzrostu danych na dysku:** obserwuj `media/`, pliki JSONL
sesji, współdzieloną bazę stanu SQLite, katalogi główne zainstalowanych pakietów
Pluginów i rotacyjne dzienniki plikowe w `/tmp/openclaw/`.

### Pomocniki powłoki (opcjonalne)

Aby ułatwić codzienne zarządzanie Dockerem, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli zainstalowano ClawDock ze starszej surowej ścieżki `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocnika śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd.
Uruchom `clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik po pomocnikach znajdziesz w [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Włącz piaskownicę agenta dla Gateway Dockera">
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

    Skrypt montuje `docker.sock` dopiero po spełnieniu wymagań wstępnych
    piaskownicy. Jeśli konfiguracja piaskownicy nie może zostać ukończona,
    skrypt resetuje `agents.defaults.sandbox.mode` do `off`. Tury trybu kodu
    Codex nadal są ograniczone do Codex `workspace-write`, gdy piaskownica
    OpenClaw jest aktywna; nie montuj gniazda Docker hosta w kontenerach
    piaskownicy agenta.

  </Accordion>

  <Accordion title="Automatyzacja / CI (nieinteraktywne)">
    Wyłącz alokację pseudo-TTY Compose za pomocą `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga dotycząca bezpieczeństwa sieci współdzielonej">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, aby
    polecenia CLI mogły dotrzeć do Gateway przez `127.0.0.1`. Traktuj to jako
    współdzieloną granicę zaufania. Konfiguracja compose usuwa
    `NET_RAW`/`NET_ADMIN` i włącza `no-new-privileges` zarówno w
    `openclaw-gateway`, jak i `openclaw-cli`.
  </Accordion>

  <Accordion title="Awarie DNS Docker Desktop w openclaw-cli">
    Niektóre konfiguracje Docker Desktop nie wykonują wyszukiwań DNS z sidecara
    `openclaw-cli` w sieci współdzielonej po usunięciu `NET_RAW`, co objawia się
    jako `EAI_AGAIN` podczas poleceń opartych na npm, takich jak
    `openclaw plugins install`. Zachowaj domyślny utwardzony plik compose dla
    normalnej pracy Gateway. Poniższe lokalne nadpisanie rozluźnia postawę
    bezpieczeństwa kontenera CLI przez przywrócenie domyślnych uprawnień
    Dockera, więc używaj go tylko dla jednorazowego polecenia CLI, które
    potrzebuje dostępu do rejestru pakietów, a nie jako domyślnego wywołania
    Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Jeśli masz już utworzony długodziałający kontener `openclaw-cli`, odtwórz go
    z tym samym nadpisaniem. `docker compose exec` i `docker exec` nie mogą
    zmienić uprawnień Linuksa w już utworzonym kontenerze.

  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień w
    `/home/node/.openclaw`, upewnij się, że bind mounty hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ta sama niezgodność może pojawić się jako ostrzeżenie Pluginu, takie jak
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`,
    a po nim `plugin present but blocked`. Oznacza to, że uid procesu i właściciel
    zamontowanego katalogu Pluginu są różne. Preferuj uruchamianie kontenera jako
    domyślny uid 1000 i naprawę właściciela bind mountu. Użyj chown dla
    `/path/to/openclaw-config/npm` na `root:root` tylko wtedy, gdy celowo
    uruchamiasz OpenClaw jako root długoterminowo.

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Uporządkuj Dockerfile tak, aby warstwy zależności były buforowane. Pozwala to
    uniknąć ponownego uruchamiania `pnpm install`, chyba że zmienią się lockfile:

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
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako
    nie-rootowy użytkownik `node`. Aby uzyskać kontener z większą liczbą funkcji:

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
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw automatycznie wykrywa zarządzany przez
       Playwright Chromium z obrazu Docker w systemie Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (bezgłowy Docker)">
    Jeśli w kreatorze wybierzesz OpenAI Codex OAuth, otworzy on URL przeglądarki.
    W konfiguracjach Docker lub bezgłowych skopiuj pełny URL przekierowania,
    na którym wylądujesz, i wklej go z powrotem do kreatora, aby zakończyć
    uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz środowiska uruchomieniowego Docker używa `node:24-bookworm-slim`
    i zawiera `tini` jako proces init punktu wejścia (PID 1), aby zapewnić
    sprzątanie procesów zombie i prawidłową obsługę sygnałów w długo działających
    kontenerach. Publikuje adnotacje obrazu bazowego OCI, w tym
    `org.opencontainers.image.base.name`, `org.opencontainers.image.source` oraz
    inne. Skrót bazowego obrazu Node jest odświeżany przez PR-y Dependabot
    dotyczące bazowych obrazów Docker; kompilacje wydań nie uruchamiają warstwy
    aktualizacji dystrybucji. Zobacz
    [adnotacje obrazów OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamianie na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) i
[Środowisko uruchomieniowe maszyny wirtualnej Docker](/pl/install/docker-vm-runtime), aby poznać kroki wdrożenia na współdzielonej maszynie wirtualnej,
w tym wbudowywanie binariów, utrwalanie i aktualizacje.

## Piaskownica agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, Gateway
uruchamia wykonywanie narzędzi agenta (powłoka, odczyt/zapis plików itd.) w
izolowanych kontenerach Docker, podczas gdy sam Gateway pozostaje na hoście. Daje
to twardą granicę wokół niezaufanych lub wielodostępnych sesji agentów bez
konteneryzowania całego Gateway.

Zakres piaskownicy może być przypisany do agenta (domyślnie), do sesji albo
współdzielony. Każdy zakres otrzymuje własny obszar roboczy zamontowany w
`/workspace`. Możesz także skonfigurować zasady zezwalania/odmowy dla narzędzi,
izolację sieci, limity zasobów i kontenery przeglądarek.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile
wieloagentowe znajdziesz tutaj:

- [Piaskownica](/pl/gateway/sandboxing) -- kompletna dokumentacja piaskownicy
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp powłoki do kontenerów piaskownicy
- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania dla poszczególnych agentów

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
  <Accordion title="Brakuje obrazu lub kontener piaskownicy się nie uruchamia">
    Zbuduj obraz piaskownicy za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout źródeł) albo wbudowanego polecenia `docker build` z sekcji [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup) (instalacja npm),
    albo ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są automatycznie tworzone dla każdej sesji na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w piaskownicy">
    Ustaw `docker.user` na UID:GID odpowiadające właścicielowi zamontowanego
    obszaru roboczego albo zmień właściciela folderu obszaru roboczego.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie są znajdowane w piaskownicy">
    OpenClaw uruchamia polecenia przez `sh -lc` (powłoka logowania), co wczytuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby dodać
    ścieżki własnych narzędzi na początku, albo dodaj skrypt w `/etc/profile.d/`
    w swoim Dockerfile.
  </Accordion>

  <Accordion title="Proces zabity przez OOM podczas budowania obrazu (kod wyjścia 137)">
    Maszyna wirtualna potrzebuje co najmniej 2 GB RAM. Użyj większej klasy
    maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Brak autoryzacji lub wymagane parowanie w Control UI">
    Pobierz świeży link do panelu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Panel](/pl/web/dashboard), [Urządzenia](/pl/cli/devices).

  </Accordion>

  <Accordion title="Cel Gateway pokazuje ws://172.x.x.x lub błędy parowania z Docker CLI">
    Zresetuj tryb i powiązanie Gateway:

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
