---
read_when:
    - Chcesz skonteneryzowanego Gateway zamiast lokalnych instalacji
    - Sprawdzasz przepływ Docker
summary: Opcjonalna konfiguracja i wdrożenie oparte na Dockerze dla OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-10T19:41:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810ad901cafda4adad477ea3aeb5940e0bc2bd4a24b15d5f9ab0c172ed943a94
    source_path: install/docker.md
    workflow: 16
---

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz skonteneryzowany Gateway albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie odpowiedni?

- **Tak**: chcesz izolowanego, tymczasowego środowiska Gateway albo uruchomić OpenClaw na hoście bez instalacji lokalnych.
- **Nie**: uruchamiasz na własnym komputerze i chcesz po prostu najszybszej pętli deweloperskiej. Zamiast tego użyj normalnego przepływu instalacji.
- **Uwaga o sandboxingu**: domyślny backend sandboxingu używa Docker, gdy sandboxing jest włączony, ale sandboxing jest domyślnie wyłączony i **nie** wymaga uruchamiania całego Gateway w Docker. Dostępne są także backendy sandboxingu SSH i OpenShell. Zobacz [Sandboxing](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM do budowania obrazu (`pnpm install` może zostać ubity z powodu OOM na hostach z 1 GB, z kodem wyjścia 137)
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

    To buduje lokalnie obraz Gateway. Aby zamiast tego użyć gotowego obrazu:

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

    - zapytanie o klucze API dostawcy
    - wygenerowanie tokena Gateway i zapisanie go w `.env`
    - uruchomienie Gateway przez Docker Compose

    Podczas konfiguracji onboarding przed uruchomieniem i zapisy konfiguracji są wykonywane bezpośrednio przez
    `openclaw-gateway`. `openclaw-cli` służy do poleceń uruchamianych po tym,
    jak kontener Gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    sekret współdzielony w ustawieniach. Skrypt konfiguracji domyślnie zapisuje token do `.env`;
    jeśli przełączysz konfigurację kontenera na uwierzytelnianie hasłem, użyj zamiast tego
    tego hasła.

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
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest to narzędzie
po uruchomieniu. Przed `docker compose up -d openclaw-gateway` uruchamiaj onboarding
i zapisy konfiguracji z czasu konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                                    | Cel                                                             |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Użyj zdalnego obrazu zamiast budować lokalnie                   |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Zainstaluj dodatkowe pakiety apt podczas budowania (oddzielone spacjami) |
| `OPENCLAW_EXTENSIONS`                      | Uwzględnij wybrane dołączone pomocniki Plugin podczas budowania |
| `OPENCLAW_EXTRA_MOUNTS`                    | Dodatkowe montowania bind hosta (oddzielone przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Utrwal `/home/node` w nazwanym woluminie Docker                 |
| `OPENCLAW_SANDBOX`                         | Włącz bootstrap sandboxingu (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | Pomiń interaktywny etap onboardingu (`1`, `true`, `yes`, `on`)  |
| `OPENCLAW_DOCKER_SOCKET`                   | Nadpisz ścieżkę gniazda Docker                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | Wyłącz rozgłaszanie Bonjour/mDNS (domyślnie `1` dla Docker)     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Wyłącz dołączone nakładki bind-mount źródeł Plugin              |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Wspólny endpoint kolektora OTLP/HTTP dla eksportu OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpointy OTLP specyficzne dla sygnałów: śladów, metryk lub logów |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Nadpisanie protokołu OTLP. Obecnie obsługiwane jest tylko `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nazwa usługi używana dla zasobów OpenTelemetry                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Włącz najnowsze eksperymentalne atrybuty semantyczne GenAI      |
| `OPENCLAW_OTEL_PRELOADED`                  | Pomiń uruchamianie drugiego OpenTelemetry SDK, gdy jedno jest wstępnie załadowane |

Maintainerzy mogą testować dołączone źródła Plugin względem spakowanego obrazu, montując
jeden katalog źródeł Plugin w miejscu jego spakowanej ścieżki źródłowej, na przykład
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ten zamontowany katalog źródłowy zastępuje pasujący skompilowany pakiet
`/app/dist/extensions/synology-chat` dla tego samego identyfikatora Plugin.

### Obserwowalność

Eksport OpenTelemetry wychodzi z kontenera Gateway do Twojego kolektora OTLP.
Nie wymaga opublikowanego portu Docker. Jeśli budujesz obraz lokalnie
i chcesz, aby dołączony eksporter OpenTelemetry był dostępny w obrazie,
uwzględnij jego zależności uruchomieniowe:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Zainstaluj oficjalny Plugin `@openclaw/diagnostics-otel` z ClawHub w
spakowanych instalacjach Docker przed włączeniem eksportu. Niestandardowe obrazy zbudowane ze źródeł
nadal mogą uwzględniać lokalne źródła Plugin z
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Aby włączyć eksport, dopuść i włącz
Plugin `diagnostics-otel` w konfiguracji, a następnie ustaw
`diagnostics.otel.enabled=true` albo użyj przykładu konfiguracji w [Eksport
OpenTelemetry](/pl/gateway/opentelemetry). Nagłówki uwierzytelniania kolektora są konfigurowane przez
`diagnostics.otel.headers`, a nie przez zmienne środowiskowe Docker.

Metryki Prometheus używają już opublikowanego portu Gateway. Zainstaluj
`clawhub:@openclaw/diagnostics-prometheus`, włącz
Plugin `diagnostics-prometheus`, a następnie scrapuj:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Trasa jest chroniona przez uwierzytelnianie Gateway. Nie wystawiaj osobnego
publicznego portu `/metrics` ani nieuwierzytelnionej ścieżki reverse proxy. Zobacz
[Metryki Prometheus](/pl/gateway/prometheus).

### Kontrole zdrowia

Endpointy sond kontenera (bez wymaganego uwierzytelniania):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli kontrole nadal kończą się niepowodzeniem, Docker oznacza kontener jako `unhealthy`,
a systemy orkiestracji mogą go zrestartować lub zastąpić.

Uwierzytelniony głęboki snapshot zdrowia:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN a loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, aby dostęp z hosta do
`http://127.0.0.1:18789` działał z publikowaniem portu Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą uzyskać dostęp do opublikowanego portu Gateway.
- `loopback`: tylko procesy w przestrzeni nazw sieci kontenera mogą uzyskać
  bezpośredni dostęp do Gateway.

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

Dołączona konfiguracja Docker używa tych URL-i hosta jako domyślnych wartości onboardingu
LM Studio i Ollama, a `docker-compose.yml` mapuje `host.docker.internal` na
bramę hosta Docker dla Linux Docker Engine. Docker Desktop już udostępnia
tę samą nazwę hosta w macOS i Windows.

Usługi hosta muszą też nasłuchiwać na adresie osiągalnym z Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jeśli używasz własnego pliku Compose albo polecenia `docker run`, dodaj samodzielnie
to samo mapowanie hosta, na przykład
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Sieć mostkowa Docker zwykle nie przekazuje niezawodnie multicastu Bonjour/mDNS
(`224.0.0.251:5353`). Dlatego dołączona konfiguracja Compose domyślnie ustawia
`OPENCLAW_DISABLE_BONJOUR=1`, aby Gateway nie wpadał w pętlę awarii ani wielokrotnie
nie restartował rozgłaszania, gdy mostek odrzuca ruch multicast.

Używaj opublikowanego URL Gateway, Tailscale albo DNS-SD dla sieci rozległych dla hostów Docker.
Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko przy uruchamianiu z siecią hosta, macvlan
albo inną siecią, w której wiadomo, że multicast mDNS działa.

Pułapki i rozwiązywanie problemów znajdziesz w [Wykrywanie Bonjour](/pl/gateway/bonjour).

### Przechowywanie i trwałość

Docker Compose montuje bind-mount `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw` oraz
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace`, więc te ścieżki
przetrwają zastąpienie kontenera. Gdy którakolwiek zmienna nie jest ustawiona, dołączony
`docker-compose.yml` wraca do `${HOME}/.openclaw` (oraz
`${HOME}/.openclaw/workspace` dla montowania workspace) albo do `/tmp/.openclaw`,
gdy brakuje też samego `HOME`. Dzięki temu `docker compose up` nie emituje
specyfikacji woluminu z pustym źródłem w minimalnych środowiskach.

Ten zamontowany katalog konfiguracji to miejsce, w którym OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla przechowywanego uwierzytelniania OAuth/kluczy API dostawców
- `.env` dla sekretów uruchomieniowych opartych na zmiennych środowiskowych, takich jak `OPENCLAW_GATEWAY_TOKEN`

Zainstalowane pobieralne Plugin przechowują swój stan pakietów pod zamontowanym
katalogiem domowym OpenClaw, więc rekordy instalacji Plugin i katalogi główne pakietów przetrwają
zastąpienie kontenera. Uruchamianie Gateway nie generuje drzew zależności dołączonych Plugin.

Pełne szczegóły trwałości we wdrożeniach VM znajdziesz w
[Docker VM Runtime - Co jest przechowywane gdzie](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca największego przyrostu danych na dysku:** monitoruj `media/`, pliki JSONL sesji,
`cron/runs/*.jsonl`, katalogi główne zainstalowanych pakietów pluginów oraz rotacyjne logi plikowe
w `/tmp/openclaw/`.

### Pomocniki powłoki (opcjonalne)

Aby łatwiej zarządzać Dockerem na co dzień, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli ClawDock został zainstalowany ze starszej surowej ścieżki `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocniczy śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik po pomocnikach znajdziesz w [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Włącz piaskownicę agenta dla Docker gateway">
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

    Skrypt montuje `docker.sock` dopiero po spełnieniu wymagań wstępnych piaskownicy. Jeśli
    konfiguracja piaskownicy nie może zostać ukończona, skrypt resetuje `agents.defaults.sandbox.mode`
    do `off`.

  </Accordion>

  <Accordion title="Automatyzacja / CI (nieinteraktywne)">
    Wyłącz alokację pseudo-TTY w Compose za pomocą `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga dotycząca bezpieczeństwa sieci współdzielonej">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, aby polecenia CLI
    mogły łączyć się z gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` zarówno dla `openclaw-gateway`, jak i `openclaw-cli`.
  </Accordion>

  <Accordion title="Błędy DNS Docker Desktop w openclaw-cli">
    W niektórych konfiguracjach Docker Desktop wyszukiwanie DNS z pomocniczego kontenera
    `openclaw-cli` w sieci współdzielonej kończy się niepowodzeniem po usunięciu `NET_RAW`, co objawia się jako
    `EAI_AGAIN` podczas poleceń opartych na npm, takich jak `openclaw plugins install`.
    Zachowaj domyślny utwardzony plik compose do normalnej pracy gateway. Poniższe
    lokalne nadpisanie osłabia postawę bezpieczeństwa kontenera CLI przez
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

    Jeśli utworzono już długodziałający kontener `openclaw-cli`, odtwórz go
    z tym samym nadpisaniem. `docker compose exec` i `docker exec` nie mogą
    zmienić uprawnień Linuksa w już utworzonym kontenerze.

  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień dla
    `/home/node/.openclaw`, upewnij się, że montowania bind z hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ta sama niezgodność może pojawić się jako ostrzeżenie plugina, takie jak
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    po którym następuje `plugin present but blocked`. Oznacza to, że uid procesu i właściciel
    zamontowanego katalogu plugina są niezgodni. Preferuj uruchamianie kontenera jako
    domyślny uid 1000 i naprawienie właściciela montowania bind. Zmieniaj właściciela
    `/path/to/openclaw-config/npm` na `root:root` tylko wtedy, gdy celowo uruchamiasz
    OpenClaw jako root długoterminowo.

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Uporządkuj Dockerfile tak, aby warstwy zależności były buforowane. Dzięki temu unikniesz ponownego uruchamiania
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
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik nierootowy `node`. Aby uzyskać bardziej
    rozbudowany kontener:

    1. **Utrwal `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wypiecz zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Zainstaluj przeglądarki Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Utrwal pobrane pliki przeglądarek**: użyj `OPENCLAW_HOME_VOLUME` lub
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw automatycznie wykrywa zarządzany przez Playwright
       Chromium z obrazu Dockera w Linuksie.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker bez interfejsu graficznego)">
    Jeśli wybierzesz OpenAI Codex OAuth w kreatorze, otworzy on URL w przeglądarce. W
    Dockerze lub konfiguracjach bez interfejsu graficznego skopiuj pełny URL przekierowania, na którym wylądujesz, i wklej
    go z powrotem do kreatora, aby zakończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz środowiska uruchomieniowego Dockera używa `node:24-bookworm-slim` i zawiera `tini` jako proces inicjalizacji entrypoint (PID 1), aby zapewnić sprzątanie procesów zombie i poprawną obsługę sygnałów w długodziałających kontenerach. Publikuje adnotacje obrazu bazowego OCI, w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Digest obrazu bazowego Node jest
    odświeżany przez PR-y Dependabot dla obrazów bazowych Dockera; buildy wydań nie uruchamiają
    warstwy aktualizacji dystrybucji. Zobacz
    [adnotacje obrazów OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamiasz na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) i
[Docker VM Runtime](/pl/install/docker-vm-runtime), aby poznać kroki wdrażania we współdzielonej maszynie wirtualnej,
w tym wypiekanie binariów, utrwalanie danych i aktualizacje.

## Piaskownica agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Dockera, gateway
uruchamia wykonywanie narzędzi agenta (powłoka, odczyt/zapis plików itd.) w izolowanych kontenerach Dockera,
podczas gdy sam gateway pozostaje na hoście. Daje to twardą barierę
wokół niezaufanych lub wielodzierżawczych sesji agentów bez konteneryzowania całego
gateway.

Zakres piaskownicy może być na agenta (domyślnie), na sesję lub współdzielony. Każdy zakres
otrzymuje własny workspace zamontowany w `/workspace`. Możesz też skonfigurować
zasady zezwalania/odmawiania dla narzędzi, izolację sieci, limity zasobów i kontenery
przeglądarek.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile wieloagentowe znajdziesz tutaj:

- [Sandboxing](/pl/gateway/sandboxing) -- pełne odniesienie dotyczące piaskownicy
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp powłoki do kontenerów piaskownicy
- [Multi-Agent Sandbox and Tools](/pl/tools/multi-agent-sandbox-tools) -- nadpisania na agenta

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

Zbuduj domyślny obraz piaskownicy (z checkoutu źródłowego):

```bash
scripts/sandbox-setup.sh
```

Dla instalacji npm bez checkoutu źródłowego zobacz [Sandboxing § Images and setup](/pl/gateway/sandboxing#images-and-setup), aby uzyskać wbudowane polecenia `docker build`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu lub kontener piaskownicy nie uruchamia się">
    Zbuduj obraz piaskownicy za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout źródłowy) albo wbudowanego polecenia `docker build` z [Sandboxing § Images and setup](/pl/gateway/sandboxing#images-and-setup) (instalacja npm),
    lub ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są automatycznie tworzone na żądanie dla każdej sesji.
  </Accordion>

  <Accordion title="Błędy uprawnień w piaskownicy">
    Ustaw `docker.user` na UID:GID zgodny z właścicielem zamontowanego workspace
    albo zmień właściciela folderu workspace.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie są znajdowane w piaskownicy">
    OpenClaw uruchamia polecenia za pomocą `sh -lc` (powłoka logowania), która wczytuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby poprzedzić go
    ścieżkami do niestandardowych narzędzi, albo dodaj skrypt w `/etc/profile.d/` w Dockerfile.
  </Accordion>

  <Accordion title="Zabite przez OOM podczas budowania obrazu (exit 137)">
    VM potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Brak autoryzacji lub wymagane parowanie w Control UI">
    Pobierz świeży link do dashboardu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Dashboard](/pl/web/dashboard), [Devices](/pl/cli/devices).

  </Accordion>

  <Accordion title="Cel Gateway pokazuje ws://172.x.x.x lub błędy parowania z Docker CLI">
    Zresetuj tryb gateway i bindowanie:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Powiązane

- [Install Overview](/pl/install) — wszystkie metody instalacji
- [Podman](/pl/install/podman) — alternatywa Podman dla Dockera
- [ClawDock](/pl/install/clawdock) — społecznościowa konfiguracja Docker Compose
- [Updating](/pl/install/updating) — utrzymywanie OpenClaw w aktualnej wersji
- [Configuration](/pl/gateway/configuration) — konfiguracja gateway po instalacji
