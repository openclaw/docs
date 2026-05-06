---
read_when:
    - Chcesz konteneryzowanego Gateway zamiast lokalnych instalacji
    - Weryfikujesz przepływ Docker
summary: Opcjonalna konfiguracja i wdrożenie oparte na Dockerze dla OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-06T09:18:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85ef98f0524c018dad280788dc83c7afaadc077ebe4509ae2c0b8b3bea1474df
    source_path: install/docker.md
    workflow: 16
---

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz mieć skonteneryzowany Gateway albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie odpowiedni?

- **Tak**: chcesz odizolowane, jednorazowe środowisko Gateway albo uruchomić OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz na własnym komputerze i chcesz po prostu najszybszej pętli deweloperskiej. Zamiast tego użyj standardowego przepływu instalacji.
- **Uwaga o piaskownicy**: domyślny backend piaskownicy używa Docker, gdy piaskownica jest włączona, ale piaskownica jest domyślnie wyłączona i **nie** wymaga uruchamiania całego Gateway w Docker. Dostępne są też backendy piaskownicy SSH i OpenShell. Zobacz [Piaskownica](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (albo Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM na budowanie obrazu (`pnpm install` może zostać ubite przez OOM na hostach z 1 GB z kodem wyjścia 137)
- Wystarczająca ilość miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS/publicznym hoście, przejrzyj
  [Wzmocnienie bezpieczeństwa dla ekspozycji sieciowej](/pl/gateway/security),
  szczególnie politykę zapory Docker `DOCKER-USER`.

## Gateway w kontenerze

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
    - wygenerowanie tokenu Gateway i zapisanie go w `.env`
    - uruchomienie Gateway przez Docker Compose

    Podczas konfiguracji onboarding przed startem oraz zapisy konfiguracji są wykonywane bezpośrednio przez
    `openclaw-gateway`. `openclaw-cli` służy do poleceń uruchamianych po tym,
    jak kontener Gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    współdzielony sekret w Settings. Skrypt konfiguracji domyślnie zapisuje token do `.env`;
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

Jeśli wolisz wykonać każdy krok samodzielnie zamiast używać skryptu konfiguracji:

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
albo `OPENCLAW_HOME_VOLUME`, skrypt konfiguracji zapisze `docker-compose.extra.yml`;
dołącz go przez `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest to narzędzie
używane po starcie. Przed `docker compose up -d openclaw-gateway` uruchamiaj onboarding
i zapisy konfiguracji z czasu konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                                    | Cel                                                            |
| ------------------------------------------ | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Używa zdalnego obrazu zamiast budować lokalnie                 |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Instaluje dodatkowe pakiety apt podczas budowania (oddzielone spacjami) |
| `OPENCLAW_EXTENSIONS`                      | Dołącza wybrane pomocnicze elementy dołączonych Plugin podczas budowania |
| `OPENCLAW_EXTRA_MOUNTS`                    | Dodatkowe montowania bind hosta (oddzielone przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Utrwala `/home/node` w nazwanym wolumenie Docker               |
| `OPENCLAW_SANDBOX`                         | Włącza bootstrap piaskownicy (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_SKIP_ONBOARDING`                 | Pomija interaktywny krok onboardingu (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Nadpisuje ścieżkę gniazda Docker                              |
| `OPENCLAW_DISABLE_BONJOUR`                 | Wyłącza rozgłaszanie Bonjour/mDNS (domyślnie `1` dla Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Wyłącza nakładki bind-mount źródeł dołączonych Plugin          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Wspólny endpoint kolektora OTLP/HTTP dla eksportu OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpointy OTLP specyficzne dla sygnałów dla śladów, metryk albo logów |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Nadpisanie protokołu OTLP. Obecnie obsługiwane jest tylko `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nazwa usługi używana dla zasobów OpenTelemetry                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Włącza najnowsze eksperymentalne atrybuty semantyczne GenAI    |
| `OPENCLAW_OTEL_PRELOADED`                  | Pomija uruchamianie drugiego SDK OpenTelemetry, gdy jeden jest już wstępnie załadowany |

Maintainerzy mogą testować źródła dołączonych Plugin względem obrazu pakietowego, montując
jeden katalog źródeł Plugin na jego pakietowej ścieżce źródłowej, na przykład
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ten zamontowany katalog źródłowy zastępuje pasujący skompilowany pakiet
`/app/dist/extensions/synology-chat` dla tego samego identyfikatora Plugin.

### Obserwowalność

Eksport OpenTelemetry jest wychodzący z kontenera Gateway do Twojego kolektora
OTLP. Nie wymaga opublikowanego portu Docker. Jeśli budujesz obraz
lokalnie i chcesz, aby dołączony eksporter OpenTelemetry był dostępny wewnątrz obrazu,
dołącz jego zależności runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Zainstaluj oficjalny Plugin `@openclaw/diagnostics-otel` z ClawHub w
pakietowych instalacjach Docker przed włączeniem eksportu. Niestandardowe obrazy budowane ze źródeł mogą
nadal dołączać lokalne źródła Plugin za pomocą
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Aby włączyć eksport, zezwól na Plugin
`diagnostics-otel` w konfiguracji i włącz go, a następnie ustaw
`diagnostics.otel.enabled=true` albo użyj przykładu konfiguracji w [Eksport
OpenTelemetry](/pl/gateway/opentelemetry). Nagłówki uwierzytelniania kolektora są konfigurowane przez
`diagnostics.otel.headers`, a nie przez zmienne środowiskowe Docker.

Metryki Prometheus używają już opublikowanego portu Gateway. Zainstaluj
`clawhub:@openclaw/diagnostics-prometheus`, włącz Plugin
`diagnostics-prometheus`, a następnie pobieraj metryki:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Trasa jest chroniona przez uwierzytelnianie Gateway. Nie wystawiaj osobnego
publicznego portu `/metrics` ani nieuwierzytelnionej ścieżki reverse proxy. Zobacz
[Metryki Prometheus](/pl/gateway/prometheus).

### Kontrole zdrowia

Endpointy sond kontenera (uwierzytelnianie nie jest wymagane):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli kontrole nadal kończą się niepowodzeniem, Docker oznacza kontener jako `unhealthy`, a
systemy orkiestracji mogą go zrestartować albo zastąpić.

Uwierzytelniona dogłębna migawka zdrowia:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, aby dostęp hosta do
`http://127.0.0.1:18789` działał z publikowaniem portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą sięgnąć do opublikowanego portu Gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą sięgać
  bezpośrednio do Gateway.

<Note>
Używaj wartości trybu bind w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` czy `127.0.0.1`.
</Note>

### Lokalni dostawcy hosta

Gdy OpenClaw działa w Docker, `127.0.0.1` wewnątrz kontenera oznacza sam kontener,
a nie maszynę hosta. Używaj `host.docker.internal` dla dostawców AI, którzy
działają na hoście:

| Dostawca  | Domyślny URL hosta        | URL konfiguracji Docker             |
| --------- | ------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434` |

Dołączona konfiguracja Docker używa tych URL-i hosta jako domyślnych wartości onboardingu
dla LM Studio i Ollama, a `docker-compose.yml` mapuje `host.docker.internal` na
Gateway hosta Docker dla Linux Docker Engine. Docker Desktop już zapewnia
tę samą nazwę hosta na macOS i Windows.

Usługi hosta muszą też nasłuchiwać na adresie osiągalnym z Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jeśli używasz własnego pliku Compose albo polecenia `docker run`, dodaj samodzielnie to samo
mapowanie hosta, na przykład
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Sieć mostkowa Docker zwykle nie przekazuje niezawodnie multicastu Bonjour/mDNS
(`224.0.0.251:5353`). Dlatego dołączona konfiguracja Compose domyślnie ustawia
`OPENCLAW_DISABLE_BONJOUR=1`, aby Gateway nie wpadał w pętlę awarii ani wielokrotnie
nie restartował rozgłaszania, gdy mostek odrzuca ruch multicast.

Użyj opublikowanego URL-a Gateway, Tailscale albo wide-area DNS-SD dla hostów Docker.
Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko wtedy, gdy uruchamiasz z siecią hosta, macvlan
albo inną siecią, w której wiadomo, że multicast mDNS działa.

Pułapki i rozwiązywanie problemów opisuje [Wykrywanie Bonjour](/pl/gateway/bonjour).

### Pamięć masowa i trwałość

Docker Compose montuje bind `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw` oraz
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace`, więc te ścieżki
przetrwają zastąpienie kontenera. Gdy którakolwiek zmienna nie jest ustawiona, dołączony
`docker-compose.yml` wraca do `${HOME}/.openclaw` (oraz
`${HOME}/.openclaw/workspace` dla montowania workspace) albo do `/tmp/.openclaw`,
gdy brakuje też samego `HOME`. Dzięki temu `docker compose up` nie emituje
specyfikacji wolumenu z pustym źródłem w minimalistycznych środowiskach.

Ten zamontowany katalog konfiguracji jest miejscem, w którym OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanych danych uwierzytelniania OAuth/kluczy API dostawców
- `.env` dla sekretów runtime opartych na zmiennych środowiskowych, takich jak `OPENCLAW_GATEWAY_TOKEN`

Zainstalowane pobieralne Plugin przechowują stan swoich pakietów pod zamontowanym
katalogiem domowym OpenClaw, więc rekordy instalacji Plugin i katalogi główne pakietów przetrwają
zastąpienie kontenera. Start Gateway nie generuje drzew zależności dołączonych Plugin.

Pełne szczegóły trwałości przy wdrożeniach VM znajdziesz w
[Docker VM Runtime - Co jest utrwalane i gdzie](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca szybkiego wzrostu użycia dysku:** obserwuj `media/`, pliki JSONL sesji,
`cron/runs/*.jsonl`, katalogi główne zainstalowanych pakietów Plugin oraz rotacyjne logi plikowe
w `/tmp/openclaw/`.

### Pomocniki powłoki (opcjonalne)

Aby ułatwić codzienne zarządzanie Dockerem, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli zainstalowano ClawDock ze starszej surowej ścieżki `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocnika śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik po pomocniku znajdziesz w [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Włącz piaskownicę agenta dla Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Niestandardowa ścieżka gniazda (np. bezrootowy Docker):

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
    mogły połączyć się z gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` zarówno dla `openclaw-gateway`, jak i `openclaw-cli`.
  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień w
    `/home/node/.openclaw`, upewnij się, że montowania bind hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ten sam brak zgodności może pojawić się jako ostrzeżenie Plugin, takie jak
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`,
    po którym następuje `plugin present but blocked`. Oznacza to, że uid procesu i właściciel
    zamontowanego katalogu Plugin są różni. Preferuj uruchamianie kontenera z domyślnym
    uid 1000 i naprawienie własności montowania bind. Używaj chown dla
    `/path/to/openclaw-config/npm` na `root:root` tylko wtedy, gdy celowo uruchamiasz
    OpenClaw jako root w dłuższej perspektywie.

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Uporządkuj Dockerfile tak, aby warstwy zależności były buforowane. Pozwala to uniknąć ponownego uruchamiania
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
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako nierootowy `node`. Aby uzyskać bardziej
    funkcjonalny kontener:

    1. **Utrwal `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Zainstaluj przeglądarki Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Utrwal pobieranie przeglądarek**: ustaw
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` i użyj
       `OPENCLAW_HOME_VOLUME` albo `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (bezgłowy Docker)">
    Jeśli w kreatorze wybierzesz OpenAI Codex OAuth, zostanie otwarty URL przeglądarki. W
    Dockerze lub konfiguracjach bezgłowych skopiuj pełny URL przekierowania, na którym wylądujesz, i wklej
    go z powrotem do kreatora, aby zakończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz środowiska uruchomieniowego Docker używa `node:24-bookworm-slim` i publikuje adnotacje OCI
    obrazu bazowego, w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` oraz inne. Digest obrazu bazowego Node jest
    odświeżany przez PR-y Dependabot dotyczące obrazu bazowego Docker; buildy wydań nie uruchamiają
    warstwy aktualizacji dystrybucji. Zobacz
    [adnotacje obrazu OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamiasz na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) oraz
[Docker VM Runtime](/pl/install/docker-vm-runtime), aby poznać kroki wdrażania na współdzielonej maszynie VM,
w tym wbudowywanie plików binarnych, trwałość i aktualizacje.

## Piaskownica agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, gateway
uruchamia wykonywanie narzędzi agenta (powłoka, odczyt/zapis plików itd.) w izolowanych kontenerach Docker,
podczas gdy sam gateway pozostaje na hoście. Daje to twardą barierę
wokół niezaufanych lub wielodzierżawczych sesji agentów bez konteneryzowania całego
gateway.

Zakres piaskownicy może być per agent (domyślnie), per sesja albo współdzielony. Każdy zakres
otrzymuje własny obszar roboczy zamontowany w `/workspace`. Możesz też skonfigurować
zasady zezwalania/odmawiania dla narzędzi, izolację sieci, limity zasobów i kontenery
przeglądarki.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile wieloagentowe znajdziesz tutaj:

- [Piaskownica](/pl/gateway/sandboxing) -- pełna dokumentacja piaskownicy
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp powłoki do kontenerów piaskownicy
- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent

### Szybkie włączanie

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

Dla instalacji npm bez checkoutu źródłowego zobacz [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), aby uzyskać wbudowane polecenia `docker build`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu lub kontener piaskownicy się nie uruchamia">
    Zbuduj obraz piaskownicy za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout źródłowy) albo wbudowanego polecenia `docker build` z [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup) (instalacja npm),
    albo ustaw `agents.defaults.sandbox.docker.image` na swój niestandardowy obraz.
    Kontenery są tworzone automatycznie per sesja na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w piaskownicy">
    Ustaw `docker.user` na UID:GID zgodne z własnością zamontowanego obszaru roboczego
    albo zmień właściciela folderu obszaru roboczego.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie są znalezione w piaskownicy">
    OpenClaw uruchamia polecenia za pomocą `sh -lc` (powłoka logowania), która wczytuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby dodać na początku swoje
    niestandardowe ścieżki narzędzi, albo dodaj skrypt pod `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="Proces zabity przez OOM podczas budowania obrazu (kod wyjścia 137)">
    Maszyna VM potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Brak autoryzacji lub wymagane parowanie w Control UI">
    Pobierz świeży link do pulpitu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Pulpit](/pl/web/dashboard), [Urządzenia](/pl/cli/devices).

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
- [Podman](/pl/install/podman) — alternatywa Podman dla Dockera
- [ClawDock](/pl/install/clawdock) — społecznościowa konfiguracja Docker Compose
- [Aktualizowanie](/pl/install/updating) — utrzymywanie OpenClaw w aktualnej wersji
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja gateway po instalacji
