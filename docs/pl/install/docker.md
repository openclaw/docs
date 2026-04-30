---
read_when:
    - Chcesz korzystać z Gateway w kontenerze zamiast lokalnych instalacji
    - Weryfikujesz przepływ Docker
summary: Opcjonalna konfiguracja i wdrożenie OpenClaw oparte na Dockerze
title: Docker
x-i18n:
    generated_at: "2026-04-30T10:00:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz uruchomić konteneryzowany Gateway lub zweryfikować przepływ Docker.

## Czy Docker jest dla mnie właściwy?

- **Tak**: chcesz odizolowanego, tymczasowego środowiska Gateway albo uruchomić OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: pracujesz na własnym komputerze i chcesz po prostu najszybszej pętli deweloperskiej. Zamiast tego użyj standardowego przepływu instalacji.
- **Uwaga o sandboxingu**: domyślny backend sandboxingu używa Docker, gdy sandboxing jest włączony, ale sandboxing jest domyślnie wyłączony i **nie** wymaga uruchamiania całego Gateway w Docker. Dostępne są też backendy sandboxingu SSH i OpenShell. Zobacz [Sandboxing](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM na zbudowanie obrazu (`pnpm install` może zostać zabity przez OOM na hostach z 1 GB, z kodem wyjścia 137)
- Wystarczająco dużo miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS/publicznym hoście, przejrzyj
  [Wzmacnianie bezpieczeństwa przy ekspozycji sieciowej](/pl/gateway/security),
  szczególnie politykę zapory Docker `DOCKER-USER`.

## Konteneryzowany Gateway

<Steps>
  <Step title="Zbuduj obraz">
    Z katalogu głównego repozytorium uruchom skrypt konfiguracji:

    ```bash
    ./scripts/docker/setup.sh
    ```

    To buduje obraz Gateway lokalnie. Aby zamiast tego użyć wstępnie zbudowanego obrazu:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Wstępnie zbudowane obrazy są publikowane w
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Typowe tagi: `main`, `latest`, `<version>` (np. `2026.2.26`).

  </Step>

  <Step title="Ukończ onboarding">
    Skrypt konfiguracji automatycznie uruchamia onboarding. Wykona on:

    - poprosi o klucze API dostawców
    - wygeneruje token Gateway i zapisze go w `.env`
    - uruchomi Gateway przez Docker Compose

    Podczas konfiguracji onboarding przed startem i zapisy konfiguracji są uruchamiane
    bezpośrednio przez `openclaw-gateway`. `openclaw-cli` służy do poleceń uruchamianych po
    tym, jak kontener Gateway już istnieje.

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
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest to
narzędzie po starcie. Przed `docker compose up -d openclaw-gateway` uruchom onboarding
i zapisy konfiguracji wykonywane podczas konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                                    | Cel                                                             |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Użyj obrazu zdalnego zamiast budować lokalnie                   |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Zainstaluj dodatkowe pakiety apt podczas budowania (oddzielone spacjami) |
| `OPENCLAW_EXTENSIONS`                      | Wstępnie zainstaluj zależności pluginów podczas budowania (nazwy oddzielone spacjami) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Dodatkowe montowania bind z hosta (oddzielone przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Zachowaj `/home/node` w nazwanym woluminie Docker               |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | Ścieżka kontenera dla wygenerowanych zależności i mirrorów dołączonych pluginów |
| `OPENCLAW_SANDBOX`                         | Włącz bootstrap sandboxingu (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | Pomiń interaktywny krok onboardingu (`1`, `true`, `yes`, `on`)  |
| `OPENCLAW_DOCKER_SOCKET`                   | Nadpisz ścieżkę gniazda Docker                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | Wyłącz ogłaszanie Bonjour/mDNS (domyślnie `1` dla Docker)       |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Wyłącz nakładki bind-mount źródeł dołączonych pluginów          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Wspólny punkt końcowy kolektora OTLP/HTTP dla eksportu OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Punkty końcowe OTLP specyficzne dla sygnałów śladów, metryk lub logów |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Nadpisanie protokołu OTLP. Obecnie obsługiwane jest tylko `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nazwa usługi używana dla zasobów OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Włącz najnowsze eksperymentalne atrybuty semantyczne GenAI      |
| `OPENCLAW_OTEL_PRELOADED`                  | Pomiń uruchamianie drugiego SDK OpenTelemetry, gdy jedno jest już wstępnie załadowane |

Maintainerzy mogą testować źródła dołączonego pluginu względem spakowanego obrazu, montując
jeden katalog źródeł pluginu nad jego spakowaną ścieżką źródłową, na przykład
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ten zamontowany katalog źródeł zastępuje pasujący skompilowany pakiet
`/app/dist/extensions/synology-chat` dla tego samego identyfikatora pluginu.

### Obserwowalność

Eksport OpenTelemetry wychodzi z kontenera Gateway do Twojego kolektora OTLP.
Nie wymaga opublikowanego portu Docker. Jeśli budujesz obraz lokalnie i chcesz,
aby dołączony eksporter OpenTelemetry był dostępny wewnątrz obrazu, uwzględnij
jego zależności uruchomieniowe:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Oficjalny obraz wydania Docker OpenClaw zawiera źródło dołączonego pluginu
`diagnostics-otel`. W zależności od obrazu i stanu cache Gateway może nadal
przygotowywać lokalne dla pluginu zależności uruchomieniowe OpenTelemetry przy
pierwszym włączeniu pluginu, więc pozwól, aby pierwszy start miał dostęp do rejestru
pakietów, albo wstępnie rozgrzej obraz w swojej ścieżce wydania. Aby włączyć eksport,
zezwól na plugin `diagnostics-otel` i włącz go w konfiguracji, a następnie ustaw
`diagnostics.otel.enabled=true` albo użyj przykładu konfiguracji w
[Eksport OpenTelemetry](/pl/gateway/opentelemetry). Nagłówki uwierzytelniania kolektora są
konfigurowane przez `diagnostics.otel.headers`, a nie przez zmienne środowiskowe Docker.

Metryki Prometheus używają już opublikowanego portu Gateway. Włącz plugin
`diagnostics-prometheus`, a następnie zbieraj metryki:

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
Jeśli kontrole nadal kończą się niepowodzeniem, Docker oznacza kontener jako `unhealthy`,
a systemy orkiestracji mogą go zrestartować lub zastąpić.

Uwierzytelniony, szczegółowy snapshot kondycji:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN kontra loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, dzięki czemu dostęp z hosta do
`http://127.0.0.1:18789` działa z publikowaniem portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą uzyskać dostęp do opublikowanego portu Gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą uzyskać
  bezpośredni dostęp do Gateway.

<Note>
Używaj wartości trybu bind w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` czy `127.0.0.1`.
</Note>

### Lokalne dostawcy hosta

Gdy OpenClaw działa w Docker, `127.0.0.1` wewnątrz kontenera oznacza sam kontener,
a nie Twoją maszynę hosta. Użyj `host.docker.internal` dla dostawców AI, którzy
działają na hoście:

| Dostawca  | Domyślny URL hosta        | URL konfiguracji Docker             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Dołączona konfiguracja Docker używa tych adresów URL hosta jako domyślnych wartości
onboardingu LM Studio i Ollama, a `docker-compose.yml` mapuje `host.docker.internal` na
Gateway hosta Docker dla Linux Docker Engine. Docker Desktop już udostępnia tę samą
nazwę hosta na macOS i Windows.

Usługi hosta muszą też nasłuchiwać na adresie osiągalnym z Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jeśli używasz własnego pliku Compose lub polecenia `docker run`, dodaj samodzielnie
to samo mapowanie hosta, na przykład
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Sieci mostkowane Docker zwykle nie przekazują niezawodnie multicastu Bonjour/mDNS
(`224.0.0.251:5353`). Dlatego dołączona konfiguracja Compose domyślnie ustawia
`OPENCLAW_DISABLE_BONJOUR=1`, aby Gateway nie wpadał w pętlę awarii ani wielokrotnie
nie restartował ogłaszania, gdy most odrzuca ruch multicast.

Dla hostów Docker używaj opublikowanego URL Gateway, Tailscale albo wide-area DNS-SD.
Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko wtedy, gdy uruchamiasz z siecią hosta, macvlan
albo inną siecią, w której wiadomo, że multicast mDNS działa.

Pułapki i rozwiązywanie problemów znajdziesz w [Wykrywanie Bonjour](/pl/gateway/bonjour).

### Przechowywanie i trwałość

Docker Compose montuje bind `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw` oraz
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace`, więc te ścieżki
przetrwają wymianę kontenera. Gdy którakolwiek zmienna nie jest ustawiona, dołączony
`docker-compose.yml` wraca do `${HOME}/.openclaw` (oraz
`${HOME}/.openclaw/workspace` dla montowania workspace) albo do `/tmp/.openclaw`,
gdy brakuje także samego `HOME`. Dzięki temu `docker compose up` nie emituje
specyfikacji woluminu z pustym źródłem w podstawowych środowiskach.

Ten zamontowany katalog konfiguracji jest miejscem, w którym OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanych danych uwierzytelniania OAuth/kluczy API dostawców
- `.env` dla sekretów uruchomieniowych opartych na env, takich jak `OPENCLAW_GATEWAY_TOKEN`

Zależności wykonawcze dołączonych plugins i zdublowane pliki wykonawcze są wygenerowanym
stanem, a nie konfiguracją użytkownika. Compose przechowuje je w nazwanym woluminie Docker
`openclaw-plugin-runtime-deps` zamontowanym w
`/var/lib/openclaw/plugin-runtime-deps`. Trzymanie tego często zmieniającego się drzewa poza
wiązanym montowaniem konfiguracji hosta pozwala uniknąć wolnych operacji plikowych Docker Desktop/WSL i nieaktualnych
uchwytów Windows podczas zimnego uruchamiania Gateway.

Domyślny plik Compose ustawia `OPENCLAW_PLUGIN_STAGE_DIR` na tę ścieżkę zarówno dla
`openclaw-gateway`, jak i `openclaw-cli`, więc `openclaw doctor --fix`, polecenia
logowania/konfiguracji kanałów oraz uruchamianie Gateway używają tego samego wygenerowanego woluminu wykonawczego.

Pełne szczegóły dotyczące trwałości we wdrożeniach VM znajdziesz w
[Środowisko wykonawcze Docker VM - co gdzie jest utrwalane](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca szybkiego wzrostu użycia dysku:** obserwuj `media/`, pliki JSONL sesji, `cron/runs/*.jsonl`,
wolumin Docker `openclaw-plugin-runtime-deps` oraz rotacyjne logi plikowe w
`/tmp/openclaw/`.

### Pomocnicze narzędzia powłoki (opcjonalne)

Aby ułatwić codzienne zarządzanie Docker, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli zainstalowano ClawDock ze starszej surowej ścieżki `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocniczy śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik po narzędziach pomocniczych znajdziesz w [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
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

  <Accordion title="Automation / CI (non-interactive)">
    Wyłącz przydzielanie pseudo-TTY przez Compose za pomocą `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, aby polecenia CLI
    mogły dotrzeć do gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` w `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissions and EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień w
    `/home/node/.openclaw`, upewnij się, że montowania wiązane hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Faster rebuilds">
    Uporządkuj Dockerfile tak, aby warstwy zależności były buforowane. Pozwala to uniknąć ponownego uruchamiania
    `pnpm install`, chyba że zmienią się pliki blokady:

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

  <Accordion title="Power-user container options">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako nierootowy użytkownik `node`. Aby uzyskać bardziej
    funkcjonalny kontener:

    1. **Utrwal `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Zainstaluj przeglądarki Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Utrwal pobrania przeglądarek**: ustaw
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` i użyj
       `OPENCLAW_HOME_VOLUME` albo `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Jeśli wybierzesz OpenAI Codex OAuth w kreatorze, otworzy on URL przeglądarki. W
    Docker lub konfiguracjach bez interfejsu graficznego skopiuj pełny URL przekierowania, na którym się znajdziesz, i wklej
    go z powrotem do kreatora, aby zakończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Base image metadata">
    Główny obraz wykonawczy Docker używa `node:24-bookworm-slim` i publikuje adnotacje
    obrazu bazowego OCI, w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Skrót bazowego obrazu Node jest
    odświeżany przez PR-y Dependabot dotyczące obrazów bazowych Docker; kompilacje wydań nie uruchamiają
    warstwy aktualizacji dystrybucji. Zobacz
    [Adnotacje obrazów OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamiasz na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) oraz
[Środowisko wykonawcze Docker VM](/pl/install/docker-vm-runtime), aby poznać kroki wdrażania na współdzielonej VM,
w tym wbudowywanie binariów, trwałość i aktualizacje.

## Piaskownica agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, gateway
uruchamia wykonywanie narzędzi agenta (powłoka, odczyt/zapis plików itd.) w izolowanych kontenerach Docker,
podczas gdy sam gateway pozostaje na hoście. Daje to twardą barierę
wokół niezaufanych lub wielodzierżawczych sesji agentów bez konteneryzowania całego
gateway.

Zakres piaskownicy może być przypisany do agenta (domyślnie), do sesji lub współdzielony. Każdy zakres
otrzymuje własny obszar roboczy zamontowany w `/workspace`. Możesz także skonfigurować
polityki dopuszczania/odmawiania narzędzi, izolację sieci, limity zasobów i kontenery
przeglądarek.

Pełną konfigurację, obrazy, uwagi bezpieczeństwa i profile wielu agentów znajdziesz tutaj:

- [Piaskownica](/pl/gateway/sandboxing) -- pełna dokumentacja piaskownicy
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp powłoki do kontenerów piaskownicy
- [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania dla poszczególnych agentów

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

Zbuduj domyślny obraz piaskownicy:

```bash
scripts/sandbox-setup.sh
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    Zbuduj obraz piaskownicy za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    albo ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są tworzone automatycznie dla każdej sesji na żądanie.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    Ustaw `docker.user` na UID:GID zgodny z właścicielem zamontowanego obszaru roboczego
    albo zmień właściciela folderu obszaru roboczego za pomocą chown.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw uruchamia polecenia za pomocą `sh -lc` (powłoka logowania), która odczytuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby dodać ścieżki
    własnych narzędzi na początku, albo dodaj skrypt w `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    VM potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    Pobierz świeży link do pulpitu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Pulpit](/pl/web/dashboard), [Urządzenia](/pl/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
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
- [Aktualizowanie](/pl/install/updating) — utrzymywanie OpenClaw w aktualnym stanie
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja gateway po instalacji
