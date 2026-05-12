---
read_when:
    - Chcesz używać Gateway uruchamianego w kontenerze zamiast lokalnych instalacji
    - Walidujesz przepływ Docker
summary: Opcjonalna konfiguracja i wdrożenie OpenClaw za pomocą Dockera
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:51:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz uruchomić konteneryzowany Gateway albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie właściwy?

- **Tak**: chcesz izolowanego, jednorazowego środowiska Gateway albo uruchomić OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz na własnym komputerze i chcesz po prostu najszybszej pętli deweloperskiej. Zamiast tego użyj normalnego przepływu instalacji.
- **Uwaga o sandboxingu**: domyślny backend sandboxa używa Docker, gdy sandboxing jest włączony, ale sandboxing jest domyślnie wyłączony i **nie** wymaga uruchamiania całego Gateway w Docker. Dostępne są też backendy sandboxa SSH i OpenShell. Zobacz [Sandboxing](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM na budowę obrazu (`pnpm install` może zostać zabity przez OOM na hostach z 1 GB, z kodem wyjścia 137)
- Wystarczająca ilość miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS/hoście publicznym, przejrzyj
  [Wzmocnienie zabezpieczeń przy ekspozycji sieciowej](/pl/gateway/security),
  zwłaszcza politykę zapory Docker `DOCKER-USER`.

## Konteneryzowany Gateway

<Steps>
  <Step title="Zbuduj obraz">
    Z katalogu głównego repozytorium uruchom skrypt konfiguracji:

    ```bash
    ./scripts/docker/setup.sh
    ```

    To zbuduje lokalnie obraz Gateway. Aby zamiast tego użyć gotowego obrazu:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gotowe obrazy są publikowane w
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Typowe tagi: `main`, `latest`, `<version>` (np. `2026.2.26`).

  </Step>

  <Step title="Ukończ onboarding">
    Skrypt konfiguracji automatycznie uruchamia onboarding. Wykona on:

    - zapytanie o klucze API dostawców
    - wygenerowanie tokena Gateway i zapisanie go w `.env`
    - utworzenie katalogu klucza sekretu profilu uwierzytelniania
    - uruchomienie Gateway przez Docker Compose

    Podczas konfiguracji onboarding przed startem i zapisy konfiguracji są wykonywane bezpośrednio przez
    `openclaw-gateway`. `openclaw-cli` służy do poleceń uruchamianych po tym,
    jak kontener Gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    wspólny sekret w Settings. Skrypt konfiguracji domyślnie zapisuje token w `.env`;
    jeśli przełączysz konfigurację kontenera na uwierzytelnianie hasłem, użyj zamiast tego
    tego hasła.

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
Uruchamiaj `docker compose` z katalogu głównego repozytorium. Jeśli włączono `OPENCLAW_EXTRA_MOUNTS`
lub `OPENCLAW_HOME_VOLUME`, skrypt konfiguracji zapisuje `docker-compose.extra.yml`;
uwzględnij go za pomocą `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest
narzędziem po uruchomieniu. Przed `docker compose up -d openclaw-gateway` uruchom onboarding
i zapisy konfiguracji wykonywane podczas konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                                    | Przeznaczenie                                                   |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Użyj zdalnego obrazu zamiast budować lokalnie                   |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Zainstaluj dodatkowe pakiety apt podczas budowy (oddzielone spacjami) |
| `OPENCLAW_EXTENSIONS`                      | Uwzględnij wybrane pomocniki dołączonych plugins podczas budowy |
| `OPENCLAW_EXTRA_MOUNTS`                    | Dodatkowe montowania bind hosta (oddzielone przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Utrwal `/home/node` w nazwanym wolumenie Docker                 |
| `OPENCLAW_SANDBOX`                         | Włącz bootstrap sandboxa (`1`, `true`, `yes`, `on`)             |
| `OPENCLAW_SKIP_ONBOARDING`                 | Pomiń interaktywny krok onboardingu (`1`, `true`, `yes`, `on`)  |
| `OPENCLAW_DOCKER_SOCKET`                   | Nadpisz ścieżkę gniazda Docker                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | Wyłącz ogłaszanie Bonjour/mDNS (domyślnie `1` dla Docker)       |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Wyłącz nakładki bind-mount źródeł dołączonych plugins           |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Wspólny endpoint kolektora OTLP/HTTP dla eksportu OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpointy OTLP specyficzne dla sygnałów: śladów, metryk lub logów |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Nadpisanie protokołu OTLP. Obecnie obsługiwane jest tylko `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nazwa usługi używana dla zasobów OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Włącz najnowsze eksperymentalne atrybuty semantyczne GenAI      |
| `OPENCLAW_OTEL_PRELOADED`                  | Pomiń uruchamianie drugiego SDK OpenTelemetry, gdy jeden jest już załadowany |

Maintainerzy mogą testować źródło dołączonego plugin względem spakowanego obrazu, montując
jeden katalog źródłowy plugin na jego spakowanej ścieżce źródłowej, na przykład
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ten zamontowany katalog źródłowy zastępuje pasujący skompilowany pakiet
`/app/dist/extensions/synology-chat` dla tego samego identyfikatora plugin.

### Obserwowalność

Eksport OpenTelemetry wychodzi z kontenera Gateway do Twojego kolektora OTLP.
Nie wymaga opublikowanego portu Docker. Jeśli budujesz obraz lokalnie i chcesz,
aby dołączony eksporter OpenTelemetry był dostępny w obrazie, uwzględnij jego
zależności uruchomieniowe:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Zainstaluj oficjalny plugin `@openclaw/diagnostics-otel` z ClawHub w
spakowanych instalacjach Docker przed włączeniem eksportu. Niestandardowe obrazy
budowane ze źródeł nadal mogą uwzględniać lokalne źródło plugin za pomocą
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Aby włączyć eksport, zezwól na plugin
`diagnostics-otel` i włącz go w konfiguracji, a następnie ustaw
`diagnostics.otel.enabled=true` albo użyj przykładu konfiguracji w [Eksport
OpenTelemetry](/pl/gateway/opentelemetry). Nagłówki uwierzytelniania kolektora są konfigurowane przez
`diagnostics.otel.headers`, a nie przez zmienne środowiskowe Docker.

Metryki Prometheus używają już opublikowanego portu Gateway. Zainstaluj
`clawhub:@openclaw/diagnostics-prometheus`, włącz plugin
`diagnostics-prometheus`, a następnie pobieraj metryki:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Trasa jest chroniona uwierzytelnianiem Gateway. Nie wystawiaj oddzielnego
publicznego portu `/metrics` ani nieuwierzytelnionej ścieżki reverse proxy. Zobacz
[Metryki Prometheus](/pl/gateway/prometheus).

### Kontrole zdrowia

Endpointy sond kontenera (bez wymaganego uwierzytelniania):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli kontrole nadal się nie powiodą, Docker oznaczy kontener jako `unhealthy`,
a systemy orkiestracji będą mogły go zrestartować lub zastąpić.

Uwierzytelniona głęboka migawka zdrowia:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN kontra loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, dzięki czemu dostęp hosta do
`http://127.0.0.1:18789` działa z publikowaniem portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą dotrzeć do opublikowanego portu Gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą dotrzeć
  bezpośrednio do Gateway.

<Note>
Używaj wartości trybu bind w `gateway.bind` (`lan` / `loopback` / `custom` /
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

Dołączona konfiguracja Docker używa tych URL-i hosta jako domyślnych wartości
onboardingu LM Studio i Ollama, a `docker-compose.yml` mapuje `host.docker.internal` na
Gateway hosta Docker dla Linux Docker Engine. Docker Desktop już udostępnia
tę samą nazwę hosta w macOS i Windows.

Usługi hosta muszą także nasłuchiwać na adresie osiągalnym z Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jeśli używasz własnego pliku Compose lub polecenia `docker run`, dodaj samodzielnie
to samo mapowanie hosta, na przykład
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Sieć mostkowa Docker zwykle nie przekazuje niezawodnie multicastu Bonjour/mDNS
(`224.0.0.251:5353`). Dlatego dołączona konfiguracja Compose domyślnie ustawia
`OPENCLAW_DISABLE_BONJOUR=1`, aby Gateway nie wpadał w pętlę awarii ani nie
restartował wielokrotnie ogłaszania, gdy most odrzuca ruch multicast.

Użyj opublikowanego URL Gateway, Tailscale albo wide-area DNS-SD dla hostów Docker.
Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko wtedy, gdy uruchamiasz z siecią hosta, macvlan
lub inną siecią, w której multicast mDNS na pewno działa.

Pułapki i rozwiązywanie problemów znajdziesz w [Odkrywanie Bonjour](/pl/gateway/bonjour).

### Pamięć masowa i trwałość

Docker Compose montuje bind-mount `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace` oraz
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` do `/home/node/.config/openclaw`, dzięki czemu te
ścieżki przetrwają zastąpienie kontenera. Gdy dowolna zmienna nie jest ustawiona, dołączony
`docker-compose.yml` używa ścieżki pod `${HOME}`, albo `/tmp`, gdy brakuje także samego `HOME`.
Dzięki temu `docker compose up` nie emituje specyfikacji wolumenu z pustym źródłem
w surowych środowiskach.

Ten zamontowany katalog konfiguracji to miejsce, w którym OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanych uwierzytelnień dostawców OAuth/API-key
- `.env` dla sekretów uruchomieniowych opartych na env, takich jak `OPENCLAW_GATEWAY_TOKEN`

Katalog klucza sekretu profilu uwierzytelniania przechowuje lokalny klucz szyfrowania używany dla
materiału tokenów profilu uwierzytelniania opartego na OAuth. Trzymaj go razem ze stanem hosta Docker,
ale oddzielnie od `OPENCLAW_CONFIG_DIR`.

Zainstalowane wtyczki do pobrania przechowują stan swoich pakietów w zamontowanym katalogu domowym OpenClaw, więc rekordy instalacji wtyczek i katalogi główne pakietów przetrwają wymianę kontenera. Uruchomienie Gateway nie generuje drzew zależności wbudowanych wtyczek.

Pełne szczegóły trwałości we wdrożeniach VM znajdziesz w sekcji
[Środowisko uruchomieniowe VM Docker - co gdzie jest zachowywane](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca szybkiego przyrostu użycia dysku:** obserwuj `media/`, pliki JSONL sesji,
`cron/runs/*.jsonl`, katalogi główne pakietów zainstalowanych wtyczek oraz rotowane logi plikowe
w `/tmp/openclaw/`.

### Pomocniki powłoki (opcjonalne)

Aby ułatwić codzienne zarządzanie Dockerem, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli ClawDock został zainstalowany ze starszej surowej ścieżki `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocnika śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik po pomocniku znajdziesz w sekcji [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Włącz sandbox agenta dla Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Niestandardowa ścieżka gniazda (np. Docker bez roota):

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
    Wyłącz alokację pseudo-TTY przez Compose za pomocą `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga dotycząca bezpieczeństwa współdzielonej sieci">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, aby polecenia CLI
    mogły dotrzeć do Gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` zarówno dla `openclaw-gateway`, jak i `openclaw-cli`.
  </Accordion>

  <Accordion title="Awarie DNS Docker Desktop w openclaw-cli">
    Niektóre konfiguracje Docker Desktop nie wykonują poprawnie zapytań DNS z pomocniczego kontenera
    `openclaw-cli` we współdzielonej sieci po usunięciu `NET_RAW`, co objawia się jako
    `EAI_AGAIN` podczas poleceń opartych na npm, takich jak `openclaw plugins install`.
    Zachowaj domyślny utwardzony plik compose do normalnej pracy Gateway. Poniższe
    lokalne nadpisanie osłabia zabezpieczenia kontenera CLI przez
    przywrócenie domyślnych uprawnień Dockera, więc używaj go tylko dla jednorazowego polecenia CLI,
    które wymaga dostępu do rejestru pakietów, a nie jako domyślnego wywołania Compose:

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
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień w
    `/home/node/.openclaw`, upewnij się, że montowania bind na hoście należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ta sama niezgodność może pojawić się jako ostrzeżenie wtyczki, takie jak
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    z następującym po nim `plugin present but blocked`. Oznacza to, że uid procesu i właściciel
    zamontowanego katalogu wtyczki są niezgodne. Preferuj uruchamianie kontenera z
    domyślnym uid 1000 i naprawienie właściciela montowania bind. Wykonuj chown
    `/path/to/openclaw-config/npm` do `root:root` tylko wtedy, gdy celowo uruchamiasz
    OpenClaw jako root długoterminowo.

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Ułóż Dockerfile tak, aby warstwy zależności były buforowane. Pozwala to uniknąć ponownego uruchamiania
    `pnpm install`, chyba że zmienią się lockfile:

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
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik nieroot `node`. Aby uzyskać bardziej
    rozbudowany kontener:

    1. **Utrwal `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Wbuduj Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Albo zainstaluj przeglądarki Playwright w utrwalonym wolumenie**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Utrwal pobrania przeglądarki**: użyj `OPENCLAW_HOME_VOLUME` lub
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw automatycznie wykrywa zarządzany przez Playwright Chromium z obrazu Docker
       na Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker bez interfejsu graficznego)">
    Jeśli w kreatorze wybierzesz OpenAI Codex OAuth, otworzy on URL w przeglądarce. W
    Dockerze lub konfiguracjach bez interfejsu graficznego skopiuj pełny URL przekierowania, na którym wylądujesz, i wklej
    go z powrotem do kreatora, aby ukończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz środowiska uruchomieniowego Docker używa `node:24-bookworm-slim` i zawiera `tini` jako proces init punktu wejścia (PID 1), aby zapewnić sprzątanie procesów zombie i poprawną obsługę sygnałów w długo działających kontenerach. Publikuje adnotacje obrazu bazowego OCI, w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Digest obrazu bazowego Node jest
    odświeżany przez PR-y Dependabot Docker dotyczące obrazu bazowego; buildy wydań nie uruchamiają
    warstwy aktualizacji dystrybucji. Zobacz
    [adnotacje obrazów OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamiasz na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) i
[Środowisko uruchomieniowe VM Docker](/pl/install/docker-vm-runtime), aby poznać wspólne kroki wdrożenia VM,
w tym wbudowywanie binariów, trwałość i aktualizacje.

## Sandbox agenta

Gdy `agents.defaults.sandbox` jest włączony z backendem Docker, Gateway
uruchamia wykonywanie narzędzi agenta (powłoka, odczyt/zapis plików itd.) w izolowanych kontenerach Docker,
podczas gdy sam Gateway pozostaje na hoście. Daje to twardą granicę
wokół niezaufanych lub wielodzierżawczych sesji agenta bez konteneryzowania całego
Gateway.

Zakres sandboxa może być na agenta (domyślnie), na sesję lub współdzielony. Każdy zakres
otrzymuje własny obszar roboczy zamontowany w `/workspace`. Możesz też skonfigurować
polityki dozwolonych/zabronionych narzędzi, izolację sieci, limity zasobów i kontenery
przeglądarek.

Pełną konfigurację, obrazy, uwagi bezpieczeństwa i profile wielu agentów znajdziesz tutaj:

- [Sandboxing](/pl/gateway/sandboxing) -- kompletne odniesienie sandboxa
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp powłoki do kontenerów sandboxa
- [Sandbox i narzędzia wieloagentowe](/pl/tools/multi-agent-sandbox-tools) -- nadpisania na agenta

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

Zbuduj domyślny obraz sandboxa (z checkoutu źródłowego):

```bash
scripts/sandbox-setup.sh
```

Dla instalacji npm bez checkoutu źródłowego zobacz [Sandboxing § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), aby użyć wbudowanych poleceń `docker build`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu lub kontener sandboxa nie startuje">
    Zbuduj obraz sandboxa za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout źródłowy) albo wbudowanego polecenia `docker build` z sekcji [Sandboxing § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup) (instalacja npm),
    albo ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są automatycznie tworzone dla każdej sesji na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w sandboxie">
    Ustaw `docker.user` na UID:GID zgodny z właścicielem zamontowanego obszaru roboczego
    albo wykonaj chown folderu obszaru roboczego.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie są znajdowane w sandboxie">
    OpenClaw uruchamia polecenia za pomocą `sh -lc` (powłoka logowania), co wczytuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby poprzedzić nim
    ścieżki niestandardowych narzędzi, albo dodaj skrypt w `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="Zabite przez OOM podczas budowania obrazu (kod wyjścia 137)">
    VM potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Brak autoryzacji lub wymagane parowanie w Control UI">
    Pobierz świeży link do dashboardu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Dashboard](/pl/web/dashboard), [Urządzenia](/pl/cli/devices).

  </Accordion>

  <Accordion title="Cel Gateway pokazuje ws://172.x.x.x lub błędy parowania z Docker CLI">
    Zresetuj tryb Gateway i powiązanie:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Powiązane

- [Przegląd instalacji](/pl/install) — wszystkie metody instalacji
- [Podman](/pl/install/podman) — alternatywa Podman dla Dockera
- [ClawDock](/pl/install/clawdock) — społecznościowa konfiguracja Docker Compose
- [Aktualizowanie](/pl/install/updating) — utrzymywanie OpenClaw w aktualnym stanie
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja Gateway po instalacji
