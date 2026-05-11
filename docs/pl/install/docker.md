---
read_when:
    - Chcesz używać skonteneryzowanego Gateway zamiast instalacji lokalnych
    - Weryfikujesz przepływ Docker
summary: Opcjonalna konfiguracja i wprowadzenie do OpenClaw oparte na Dockerze
title: Docker
x-i18n:
    generated_at: "2026-05-11T20:32:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73e7f028708f6455b21aa38adf9dcd833bf6bc169d5405d32faa42641186b4a0
    source_path: install/docker.md
    workflow: 16
---

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz uruchomić Gateway w kontenerze albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie odpowiedni?

- **Tak**: chcesz izolowanego, tymczasowego środowiska Gateway albo uruchomić OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz na własnej maszynie i chcesz po prostu najszybszej pętli deweloperskiej. Zamiast tego użyj standardowego procesu instalacji.
- **Uwaga dotycząca izolacji**: domyślny backend izolacji używa Docker, gdy izolacja jest włączona, ale izolacja jest domyślnie wyłączona i **nie** wymaga, aby cały Gateway działał w Docker. Dostępne są też backendy izolacji SSH i OpenShell. Zobacz [Izolacja sandboxowa](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM do budowania obrazu (`pnpm install` może zostać przerwane przez OOM na hostach z 1 GB pamięci z kodem wyjścia 137)
- Wystarczająco miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS-ie lub publicznym hoście, przeczytaj
  [Wzmacnianie zabezpieczeń przy ekspozycji sieciowej](/pl/gateway/security),
  zwłaszcza politykę zapory Docker `DOCKER-USER`.

## Gateway w kontenerze

<Steps>
  <Step title="Build the image">
    Z katalogu głównego repozytorium uruchom skrypt konfiguracyjny:

    ```bash
    ./scripts/docker/setup.sh
    ```

    To buduje lokalnie obraz Gateway. Aby zamiast tego użyć gotowego obrazu:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gotowe obrazy są publikowane w
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Typowe tagi: `main`, `latest`, `<version>` (np. `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    Skrypt konfiguracyjny automatycznie uruchamia wstępną konfigurację. Wykona następujące czynności:

    - poprosi o klucze API dostawcy
    - wygeneruje token Gateway i zapisze go w `.env`
    - uruchomi Gateway przez Docker Compose

    Podczas konfiguracji wstępna konfiguracja przed uruchomieniem i zapisy konfiguracji są wykonywane bezpośrednio przez
    `openclaw-gateway`. `openclaw-cli` służy do poleceń uruchamianych po tym, jak kontener Gateway już istnieje.

  </Step>

  <Step title="Open the Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    wspólny sekret w Ustawieniach. Skrypt konfiguracyjny domyślnie zapisuje token w `.env`;
    jeśli przełączysz konfigurację kontenera na uwierzytelnianie hasłem, użyj zamiast niego tego
    hasła.

    Potrzebujesz ponownie adresu URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
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

### Procedura ręczna

Jeśli wolisz uruchamiać każdy krok samodzielnie zamiast używać skryptu konfiguracyjnego:

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
lub `OPENCLAW_HOME_VOLUME`, skrypt konfiguracyjny zapisuje `docker-compose.extra.yml`;
dołącz go za pomocą `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci z `openclaw-gateway`, jest narzędziem
używanym po uruchomieniu. Przed `docker compose up -d openclaw-gateway` przeprowadź wstępną konfigurację
i zapisy konfiguracji z czasu konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracyjny przyjmuje następujące opcjonalne zmienne środowiskowe:

| Zmienna                                    | Cel                                                             |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Użycie obrazu zdalnego zamiast budowania lokalnie               |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Instalacja dodatkowych pakietów apt podczas budowania (rozdzielonych spacjami) |
| `OPENCLAW_EXTENSIONS`                      | Dołączenie wybranych pomocników dołączonych Plugin podczas budowania |
| `OPENCLAW_EXTRA_MOUNTS`                    | Dodatkowe montowania hosta typu bind (oddzielone przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Utrwalenie `/home/node` w nazwanym wolumenie Docker             |
| `OPENCLAW_SANDBOX`                         | Włączenie przygotowania sandboxa (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_SKIP_ONBOARDING`                 | Pominięcie interaktywnego kroku wstępnej konfiguracji (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Nadpisanie ścieżki gniazda Docker                               |
| `OPENCLAW_DISABLE_BONJOUR`                 | Wyłączenie rozgłaszania Bonjour/mDNS (domyślnie `1` dla Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Wyłączenie nakładek montowania typu bind dla źródeł dołączonych Plugin |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Wspólny punkt końcowy kolektora OTLP/HTTP dla eksportu OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Specyficzne dla sygnału punkty końcowe OTLP dla śladów, metryk lub logów |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Nadpisanie protokołu OTLP. Obecnie obsługiwane jest tylko `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nazwa usługi używana dla zasobów OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Włączenie najnowszych eksperymentalnych atrybutów semantycznych GenAI |
| `OPENCLAW_OTEL_PRELOADED`                  | Pominięcie uruchomienia drugiego SDK OpenTelemetry, gdy jedno jest wstępnie załadowane |

Maintainerzy mogą testować źródła dołączonych Plugin względem spakowanego obrazu, montując
jeden katalog źródeł Plugin na jego spakowanej ścieżce źródłowej, na przykład
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ten zamontowany katalog źródeł zastępuje pasujący skompilowany pakiet
`/app/dist/extensions/synology-chat` dla tego samego identyfikatora Plugin.

### Obserwowalność

Eksport OpenTelemetry wychodzi z kontenera Gateway do Twojego kolektora OTLP.
Nie wymaga opublikowanego portu Docker. Jeśli budujesz obraz lokalnie i chcesz, aby
dołączony eksporter OpenTelemetry był dostępny wewnątrz obrazu, dołącz jego zależności uruchomieniowe:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Zainstaluj oficjalny Plugin `@openclaw/diagnostics-otel` z ClawHub w
spakowanych instalacjach Docker przed włączeniem eksportu. Niestandardowe obrazy budowane ze źródeł
nadal mogą dołączyć lokalne źródła Plugin za pomocą
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Aby włączyć eksport, dopuść i włącz
Plugin `diagnostics-otel` w konfiguracji, a następnie ustaw
`diagnostics.otel.enabled=true` albo użyj przykładu konfiguracji w [Eksport OpenTelemetry
](/pl/gateway/opentelemetry). Nagłówki uwierzytelniania kolektora są konfigurowane przez
`diagnostics.otel.headers`, a nie przez zmienne środowiskowe Docker.

Metryki Prometheus używają już opublikowanego portu Gateway. Zainstaluj
`clawhub:@openclaw/diagnostics-prometheus`, włącz Plugin
`diagnostics-prometheus`, a następnie pobieraj metryki z:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Trasa jest chroniona przez uwierzytelnianie Gateway. Nie wystawiaj osobnego
publicznego portu `/metrics` ani nieuwierzytelnionej ścieżki odwrotnego proxy. Zobacz
[Metryki Prometheus](/pl/gateway/prometheus).

### Kontrole kondycji

Punkty końcowe sond kontenera (uwierzytelnianie niewymagane):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli kontrole stale kończą się niepowodzeniem, Docker oznacza kontener jako `unhealthy`, a
systemy orkiestracji mogą go zrestartować lub zastąpić.

Uwierzytelniona szczegółowa migawka kondycji:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN a loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, dzięki czemu dostęp z hosta do
`http://127.0.0.1:18789` działa przy publikowaniu portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą osiągnąć opublikowany port Gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą bezpośrednio osiągnąć
  Gateway.

<Note>
Używaj wartości trybu wiązania w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` czy `127.0.0.1`.
</Note>

### Lokalni dostawcy hosta

Gdy OpenClaw działa w środowisku Docker, `127.0.0.1` wewnątrz kontenera oznacza sam kontener,
a nie maszynę hosta. Użyj `host.docker.internal` dla dostawców AI działających
na hoście:

| Dostawca  | Domyślny URL hosta       | URL konfiguracji Docker             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Dołączona konfiguracja Docker używa tych URL-i hosta jako domyślnych wartości wstępnej konfiguracji
LM Studio i Ollama, a `docker-compose.yml` mapuje `host.docker.internal` na
bramę hosta Docker dla Linux Docker Engine. Docker Desktop już udostępnia
tę samą nazwę hosta w macOS i Windows.

Usługi hosta muszą również nasłuchiwać na adresie osiągalnym z Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jeśli używasz własnego pliku Compose albo polecenia `docker run`, dodaj samodzielnie takie samo
mapowanie hosta, na przykład
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Sieć mostkowa Docker zwykle nie przekazuje niezawodnie multicastu Bonjour/mDNS
(`224.0.0.251:5353`). Dlatego dołączona konfiguracja Compose domyślnie ustawia
`OPENCLAW_DISABLE_BONJOUR=1`, aby Gateway nie wpadał w pętlę awarii ani wielokrotnie
nie restartował rozgłaszania, gdy most odrzuca ruch multicast.

Dla hostów Docker używaj opublikowanego URL Gateway, Tailscale albo szerokoobszarowego DNS-SD.
Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko wtedy, gdy uruchamiasz z siecią hosta, macvlan
albo inną siecią, w której wiadomo, że multicast mDNS działa.

Pułapki i rozwiązywanie problemów opisuje [Wykrywanie Bonjour](/pl/gateway/bonjour).

### Przechowywanie i trwałość

Docker Compose montuje przez bind `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw` oraz
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace`, więc te ścieżki
przetrwają wymianę kontenera. Gdy któraś zmienna nie jest ustawiona, dołączony
`docker-compose.yml` przechodzi na `${HOME}/.openclaw` (oraz
`${HOME}/.openclaw/workspace` dla montowania obszaru roboczego) albo na `/tmp/.openclaw`,
gdy brakuje również samego `HOME`. Dzięki temu `docker compose up` nie emituje
specyfikacji wolumenu z pustym źródłem w minimalnych środowiskach.

W tym zamontowanym katalogu konfiguracji OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanego uwierzytelniania OAuth/API-key dostawców
- `.env` dla sekretów uruchomieniowych opartych na środowisku, takich jak `OPENCLAW_GATEWAY_TOKEN`

Zainstalowane pobieralne Plugin przechowują stan pakietów w zamontowanym
katalogu domowym OpenClaw, więc zapisy instalacji Plugin i katalogi główne pakietów
przetrwają wymianę kontenera. Uruchamianie Gateway nie generuje drzew zależności dołączonych Plugin.

Pełne szczegóły trwałości we wdrożeniach VM znajdziesz w
[Środowisko uruchomieniowe VM Docker - co gdzie jest utrwalane](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca szczególnie narażone na rozrost dysku:** obserwuj `media/`, pliki JSONL sesji,
`cron/runs/*.jsonl`, katalogi główne zainstalowanych pakietów Plugin oraz rotowane logi plikowe
w `/tmp/openclaw/`.

### Pomocniki powłoki (opcjonalne)

Aby ułatwić codzienne zarządzanie Dockerem, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli zainstalowano ClawDock ze starszej ścieżki raw `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocnika śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik po pomocniku znajdziesz w [ClawDock](/pl/install/clawdock).

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
    konfiguracja sandboxa nie może się zakończyć, skrypt resetuje `agents.defaults.sandbox.mode`
    na `off`. Tury trybu kodowania Codex nadal są ograniczone do Codex
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
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, dzięki czemu polecenia CLI
    mogą dotrzeć do gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` zarówno dla `openclaw-gateway`, jak i `openclaw-cli`.
  </Accordion>

  <Accordion title="Błędy DNS Docker Desktop w openclaw-cli">
    Niektóre konfiguracje Docker Desktop nie wykonują poprawnie wyszukiwań DNS z sidecara
    `openclaw-cli` w sieci współdzielonej po usunięciu `NET_RAW`, co objawia się jako
    `EAI_AGAIN` podczas poleceń opartych na npm, takich jak `openclaw plugins install`.
    Zachowaj domyślny, utwardzony plik compose do zwykłego działania gateway. Poniższe
    lokalne nadpisanie rozluźnia postawę bezpieczeństwa kontenera CLI przez
    przywrócenie domyślnych uprawnień Docker, więc używaj go tylko dla jednorazowego polecenia CLI,
    które potrzebuje dostępu do rejestru pakietów, a nie jako domyślnego wywołania Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Jeśli utworzono już długotrwale działający kontener `openclaw-cli`, odtwórz go
    z tym samym nadpisaniem. `docker compose exec` i `docker exec` nie mogą
    zmienić uprawnień Linuksa w już utworzonym kontenerze.

  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień dla
    `/home/node/.openclaw`, upewnij się, że montowania bind hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ta sama niezgodność może pojawić się jako ostrzeżenie Plugin, takie jak
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    po którym następuje `plugin present but blocked`. Oznacza to, że uid procesu i właściciel
    zamontowanego katalogu Plugin są różne. Preferuj uruchamianie kontenera jako
    domyślny uid 1000 i naprawę własności montowania bind. Zmieniaj właściciela
    `/path/to/openclaw-config/npm` na `root:root` tylko wtedy, gdy celowo uruchamiasz
    OpenClaw jako root długoterminowo.

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Uporządkuj Dockerfile tak, aby warstwy zależności były buforowane. Pozwala to uniknąć ponownego uruchamiania
    `pnpm install`, chyba że zmienią się pliki blokad:

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
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako nie-root `node`. Aby uzyskać bardziej
    funkcjonalny kontener:

    1. **Utrwal `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Wbuduj Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Albo zainstaluj przeglądarki Playwright w utrwalonym woluminie**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Utrwal pobrania przeglądarek**: użyj `OPENCLAW_HOME_VOLUME` lub
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw automatycznie wykrywa zarządzany przez Playwright
       Chromium obrazu Docker w Linuksie.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (bezgłowy Docker)">
    Jeśli w kreatorze wybierzesz OpenAI Codex OAuth, otworzy on URL w przeglądarce. W
    Dockerze lub konfiguracjach bezgłowych skopiuj pełny URL przekierowania, na którym wylądujesz, i wklej
    go z powrotem do kreatora, aby zakończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz runtime Docker używa `node:24-bookworm-slim` i zawiera `tini` jako proces init punktu wejścia (PID 1), aby zapewnić usuwanie procesów zombie i poprawną obsługę sygnałów w długotrwale działających kontenerach. Publikuje adnotacje obrazu bazowego OCI, w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Digest obrazu bazowego Node jest
    odświeżany przez PR-y Dependabot dla obrazów bazowych Docker; kompilacje wydań nie uruchamiają
    warstwy aktualizacji dystrybucji. Zobacz
    [adnotacje obrazów OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamiasz na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) i
[Docker VM Runtime](/pl/install/docker-vm-runtime), aby poznać kroki wdrożenia współdzielonej maszyny wirtualnej,
obejmujące wbudowywanie binariów, trwałość i aktualizacje.

## Sandbox agenta

Gdy `agents.defaults.sandbox` jest włączony z backendem Docker, gateway
uruchamia wykonywanie narzędzi agenta (powłoka, odczyt/zapis plików itd.) wewnątrz izolowanych kontenerów Docker,
podczas gdy sam gateway pozostaje na hoście. Daje to twardą granicę
wokół niezaufanych lub wielodzierżawczych sesji agentów bez konteneryzowania całego
gateway.

Zakres sandboxa może być per-agent (domyślnie), per-session albo współdzielony. Każdy zakres
otrzymuje własny obszar roboczy zamontowany w `/workspace`. Możesz też skonfigurować
zasady narzędzi allow/deny, izolację sieci, limity zasobów i kontenery
przeglądarkowe.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile wieloagentowe znajdziesz tutaj:

- [Sandboxing](/pl/gateway/sandboxing) -- pełna referencja sandboxa
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp powłoki do kontenerów sandboxa
- [Multi-Agent Sandbox and Tools](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per-agent

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

Dla instalacji npm bez checkoutu źródłowego zobacz [Sandboxing § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), gdzie znajdziesz polecenia inline `docker build`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu lub kontener sandboxa się nie uruchamia">
    Zbuduj obraz sandboxa za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout źródłowy) albo polecenia inline `docker build` z [Sandboxing § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup) (instalacja npm),
    albo ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są tworzone automatycznie na żądanie dla każdej sesji.
  </Accordion>

  <Accordion title="Błędy uprawnień w sandboxie">
    Ustaw `docker.user` na UID:GID zgodny z własnością zamontowanego obszaru roboczego
    albo zmień właściciela folderu obszaru roboczego.
  </Accordion>

  <Accordion title="Narzędzia niestandardowe nie są znajdowane w sandboxie">
    OpenClaw uruchamia polecenia za pomocą `sh -lc` (powłoka logowania), co wczytuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby dodać na początku własne
    ścieżki narzędzi, albo dodaj skrypt w `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="Proces zabity przez OOM podczas budowania obrazu (kod wyjścia 137)">
    Maszyna wirtualna potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i ponów próbę.
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

  <Accordion title="Cel gateway pokazuje ws://172.x.x.x lub błędy parowania z Docker CLI">
    Zresetuj tryb i powiązanie gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie instalacji](/pl/install) — wszystkie metody instalacji
- [Podman](/pl/install/podman) — alternatywa Podman dla Docker
- [ClawDock](/pl/install/clawdock) — społecznościowa konfiguracja Docker Compose
- [Aktualizowanie](/pl/install/updating) — utrzymywanie OpenClaw w aktualnej wersji
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja gateway po instalacji
