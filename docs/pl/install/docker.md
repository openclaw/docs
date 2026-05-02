---
read_when:
    - Chcesz używać skonteneryzowanego Gateway zamiast lokalnych instalacji
    - Weryfikujesz przepływ Docker
summary: Opcjonalna konfiguracja i wdrażanie OpenClaw oparte na Dockerze
title: Docker
x-i18n:
    generated_at: "2026-05-02T20:46:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e57659c89a0b207b4b331752e7faaa814fe1f0043dad97043e95e460286c551
    source_path: install/docker.md
    workflow: 16
---

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz uruchomić konteneryzowany Gateway albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie odpowiedni?

- **Tak**: chcesz izolowanego, jednorazowego środowiska Gateway albo uruchomić OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: pracujesz na własnej maszynie i chcesz po prostu najszybszej pętli developerskiej. Zamiast tego użyj zwykłego przepływu instalacji.
- **Uwaga o sandboxingu**: domyślny backend sandboxingu używa Docker, gdy sandboxing jest włączony, ale sandboxing jest domyślnie wyłączony i **nie** wymaga uruchamiania całego Gateway w Docker. Dostępne są też backendy sandboxingu SSH i OpenShell. Zobacz [Sandboxing](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM na zbudowanie obrazu (`pnpm install` może zostać zakończone przez OOM na hostach z 1 GB, z kodem wyjścia 137)
- Wystarczająco dużo miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS-ie/hoście publicznym, przejrzyj
  [Utwardzanie bezpieczeństwa przy ekspozycji sieciowej](/pl/gateway/security),
  szczególnie politykę zapory Docker `DOCKER-USER`.

## Konteneryzowany Gateway

<Steps>
  <Step title="Zbuduj obraz">
    Z katalogu głównego repozytorium uruchom skrypt konfiguracji:

    ```bash
    ./scripts/docker/setup.sh
    ```

    To lokalnie zbuduje obraz Gateway. Aby zamiast tego użyć gotowego obrazu:

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

    - zapytanie o klucze API providerów
    - wygenerowanie tokenu Gateway i zapisanie go w `.env`
    - uruchomienie Gateway przez Docker Compose

    Podczas konfiguracji onboarding przed startem oraz zapisy konfiguracji są wykonywane bezpośrednio przez
    `openclaw-gateway`. `openclaw-cli` służy do poleceń uruchamianych po tym,
    jak kontener Gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    współdzielony sekret w Ustawieniach. Skrypt konfiguracji domyślnie zapisuje token do `.env`;
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
dołącz go za pomocą `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest to
narzędzie po starcie. Przed `docker compose up -d openclaw-gateway` uruchom onboarding
i zapisy konfiguracji wykonywane w czasie konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                                    | Cel                                                             |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Użyj zdalnego obrazu zamiast budowania lokalnie                 |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Zainstaluj dodatkowe pakiety apt podczas budowania (oddzielone spacjami) |
| `OPENCLAW_EXTENSIONS`                      | Uwzględnij wybrane pomocniki bundled Plugin podczas budowania   |
| `OPENCLAW_EXTRA_MOUNTS`                    | Dodatkowe montowania bind hosta (oddzielone przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Utrwal `/home/node` w nazwanym wolumenie Docker                 |
| `OPENCLAW_SANDBOX`                         | Włącz bootstrap sandboxingu (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | Pomiń interaktywny krok onboardingu (`1`, `true`, `yes`, `on`)  |
| `OPENCLAW_DOCKER_SOCKET`                   | Nadpisz ścieżkę gniazda Docker                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | Wyłącz rozgłaszanie Bonjour/mDNS (domyślnie `1` dla Docker)     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Wyłącz nakładki bind-mount źródeł bundled Plugin                |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Wspólny endpoint kolektora OTLP/HTTP dla eksportu OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpointy OTLP specyficzne dla sygnałów: śladów, metryk lub logów |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Nadpisanie protokołu OTLP. Obecnie obsługiwany jest tylko `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nazwa usługi używana dla zasobów OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Włącz najnowsze eksperymentalne atrybuty semantyczne GenAI      |
| `OPENCLAW_OTEL_PRELOADED`                  | Pomiń uruchamianie drugiego SDK OpenTelemetry, gdy jedno jest już wstępnie załadowane |

Maintainerzy mogą testować źródła bundled Plugin względem spakowanego obrazu, montując
jeden katalog źródłowy Plugin na jego spakowanej ścieżce źródłowej, na przykład
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ten zamontowany katalog źródłowy nadpisuje odpowiadający mu skompilowany pakiet
`/app/dist/extensions/synology-chat` dla tego samego id Plugin.

### Obserwowalność

Eksport OpenTelemetry wychodzi z kontenera Gateway do Twojego kolektora OTLP.
Nie wymaga opublikowanego portu Docker. Jeśli budujesz obraz
lokalnie i chcesz, aby bundled exporter OpenTelemetry był dostępny w obrazie,
uwzględnij jego zależności runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Zainstaluj oficjalny Plugin `@openclaw/diagnostics-otel` z ClawHub w
spakowanych instalacjach Docker przed włączeniem eksportu. Niestandardowe obrazy budowane ze źródeł nadal mogą
uwzględniać lokalne źródła Plugin za pomocą
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

Trasa jest chroniona uwierzytelnianiem Gateway. Nie wystawiaj oddzielnego
publicznego portu `/metrics` ani nieuwierzytelnionej ścieżki reverse proxy. Zobacz
[Metryki Prometheus](/pl/gateway/prometheus).

### Kontrole stanu

Endpointy sond kontenera (uwierzytelnianie nie jest wymagane):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli kontrole nadal się nie powiodą, Docker oznaczy kontener jako `unhealthy`, a
systemy orkiestracji mogą go zrestartować lub zastąpić.

Uwierzytelniona głęboka migawka stanu:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, aby dostęp hosta do
`http://127.0.0.1:18789` działał z publikowaniem portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą połączyć się z opublikowanym portem Gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą połączyć się
  bezpośrednio z Gateway.

<Note>
Używaj wartości trybu wiązania w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` czy `127.0.0.1`.
</Note>

### Lokalne providery hosta

Gdy OpenClaw działa w Docker, `127.0.0.1` wewnątrz kontenera oznacza sam kontener,
a nie Twoją maszynę hosta. Użyj `host.docker.internal` dla providerów AI, które
działają na hoście:

| Provider  | Domyślny URL hosta       | URL konfiguracji Docker             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Bundled konfiguracja Docker używa tych adresów URL hosta jako domyślnych wartości onboardingu
LM Studio i Ollama, a `docker-compose.yml` mapuje `host.docker.internal` na
bramę hosta Docker dla Linux Docker Engine. Docker Desktop udostępnia już
tę samą nazwę hosta w macOS i Windows.

Usługi hosta muszą też nasłuchiwać na adresie osiągalnym z Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jeśli używasz własnego pliku Compose albo polecenia `docker run`, dodaj samodzielnie to samo
mapowanie hosta, na przykład
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Sieć mostkowana Docker zwykle nie przekazuje niezawodnie multicastu Bonjour/mDNS
(`224.0.0.251:5353`). Dlatego bundled konfiguracja Compose domyślnie ustawia
`OPENCLAW_DISABLE_BONJOUR=1`, aby Gateway nie wpadał w pętlę awarii ani wielokrotnie
nie restartował rozgłaszania, gdy mostek odrzuca ruch multicast.

Dla hostów Docker używaj opublikowanego URL Gateway, Tailscale albo wide-area DNS-SD.
Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko przy uruchamianiu z siecią hosta, macvlan
albo inną siecią, w której wiadomo, że multicast mDNS działa.

Pułapki i rozwiązywanie problemów znajdziesz w [Wykrywanie Bonjour](/pl/gateway/bonjour).

### Przechowywanie i trwałość

Docker Compose montuje bind-mount `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw` oraz
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace`, więc te ścieżki
przetrwają zastąpienie kontenera. Gdy któraś ze zmiennych nie jest ustawiona, bundled
`docker-compose.yml` wraca do `${HOME}/.openclaw` (oraz
`${HOME}/.openclaw/workspace` dla montowania workspace) albo do `/tmp/.openclaw`,
gdy brakuje także samego `HOME`. Dzięki temu `docker compose up` nie emituje
specyfikacji wolumenu z pustym źródłem w podstawowych środowiskach.

Ten zamontowany katalog konfiguracji to miejsce, w którym OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanej autoryzacji OAuth/API-key providerów
- `.env` dla sekretów runtime opartych na zmiennych środowiskowych, takich jak `OPENCLAW_GATEWAY_TOKEN`

Zainstalowane pobieralne pluginy przechowują swój stan pakietu w zamontowanym
katalogu domowym OpenClaw, więc rekordy instalacji pluginów i katalogi główne pakietów przetrwają
zastąpienie kontenera. Start Gateway nie generuje drzew zależności bundled Plugin.

Pełne szczegóły trwałości we wdrożeniach VM znajdziesz w
[Docker VM Runtime - Co jest utrwalane i gdzie](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca intensywnego wzrostu użycia dysku:** obserwuj `media/`, pliki JSONL sesji,
`cron/runs/*.jsonl`, katalogi główne zainstalowanych pakietów pluginów oraz rotacyjne logi plikowe
w `/tmp/openclaw/`.

### Pomocniki powłoki (opcjonalne)

Aby ułatwić codzienne zarządzanie Dockerem, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli ClawDock został zainstalowany ze starszej ścieżki raw `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocniczy śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik po pomocniku znajdziesz w [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Włącz sandbox agenta dla Docker gateway">
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

    Skrypt montuje `docker.sock` dopiero po spełnieniu wymagań wstępnych sandboxa. Jeśli
    konfiguracja sandboxa nie może zostać ukończona, skrypt resetuje `agents.defaults.sandbox.mode`
    na `off`.

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
    mogły dotrzeć do Gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` dla `openclaw-cli`.
  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień dla
    `/home/node/.openclaw`, upewnij się, że bind mounty hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

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
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako nie-rootowy `node`. Aby uzyskać
    bardziej rozbudowany kontener:

    1. **Utrwal `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Zainstaluj przeglądarki Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Utrwal pobrane przeglądarki**: ustaw
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` i użyj
       `OPENCLAW_HOME_VOLUME` lub `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (bezgłowy Docker)">
    Jeśli wybierzesz OpenAI Codex OAuth w kreatorze, otworzy on adres URL w przeglądarce. W
    konfiguracjach Docker lub bezgłowych skopiuj pełny adres URL przekierowania, na którym wylądujesz, i wklej
    go z powrotem do kreatora, aby zakończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz uruchomieniowy Docker używa `node:24-bookworm-slim` i publikuje adnotacje OCI
    obrazu bazowego, w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` oraz inne. Digest obrazu bazowego Node jest
    odświeżany przez PR-y Dependabot dla obrazów bazowych Docker; buildy wydań nie uruchamiają
    warstwy aktualizacji dystrybucji. Zobacz
    [adnotacje obrazu OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamianie na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) oraz
[Docker VM Runtime](/pl/install/docker-vm-runtime), aby poznać wspólne kroki wdrażania VM,
w tym przygotowywanie binariów, trwałość danych i aktualizacje.

## Piaskownica agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, gateway
uruchamia wykonywanie narzędzi agenta (powłoka, odczyt/zapis plików itd.) w izolowanych
kontenerach Docker, podczas gdy sam gateway pozostaje na hoście. Daje to twardą granicę
wokół niezaufanych lub wielodostępnych sesji agentów bez konteneryzowania całego
gateway.

Zakres piaskownicy może być przypisany do agenta (domyślnie), sesji albo współdzielony. Każdy zakres
otrzymuje własny obszar roboczy zamontowany w `/workspace`. Możesz także skonfigurować
zasady zezwalania/odmawiania dla narzędzi, izolację sieci, limity zasobów oraz
kontenery przeglądarek.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile wielu agentów znajdziesz tutaj:

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

Zbuduj domyślny obraz piaskownicy (z kopii źródeł):

```bash
scripts/sandbox-setup.sh
```

W przypadku instalacji npm bez kopii źródeł zobacz [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), aby uzyskać wbudowane polecenia `docker build`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu lub kontener piaskownicy nie uruchamia się">
    Zbuduj obraz piaskownicy za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kopia źródeł) albo wbudowanego polecenia `docker build` z [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup) (instalacja npm),
    albo ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są tworzone automatycznie dla każdej sesji na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w piaskownicy">
    Ustaw `docker.user` na UID:GID zgodny z własnością zamontowanego obszaru roboczego
    albo zmień właściciela folderu obszaru roboczego za pomocą chown.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie zostały znalezione w piaskownicy">
    OpenClaw uruchamia polecenia za pomocą `sh -lc` (powłoka logowania), która odczytuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby poprzedzić je
    ścieżkami do własnych narzędzi, albo dodaj skrypt w `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="Proces zakończony przez OOM podczas budowania obrazu (exit 137)">
    VM potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Wymagana autoryzacja lub parowanie w Control UI">
    Pobierz świeży link do panelu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Panel](/pl/web/dashboard), [Urządzenia](/pl/cli/devices).

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
- [Podman](/pl/install/podman) — alternatywa dla Docker oparta na Podman
- [ClawDock](/pl/install/clawdock) — społecznościowa konfiguracja Docker Compose
- [Aktualizowanie](/pl/install/updating) — utrzymywanie OpenClaw w aktualnej wersji
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja gateway po instalacji
