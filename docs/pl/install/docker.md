---
read_when:
    - Chcesz używać gateway w kontenerze zamiast lokalnych instalacji
    - Weryfikujesz przepływ Docker
summary: Opcjonalna konfiguracja i onboarding OpenClaw oparte na Docker
title: Docker
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:33:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz uruchamiać gateway w kontenerze albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie odpowiedni?

- **Tak**: chcesz izolowane, tymczasowe środowisko gateway albo chcesz uruchamiać OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz na własnej maszynie i zależy Ci tylko na najszybszej pętli developerskiej. Użyj zamiast tego zwykłego przepływu instalacji.
- **Uwaga o sandboxingu**: domyślny backend sandbox używa Docker, gdy sandboxing jest włączony, ale sandboxing jest domyślnie wyłączony i **nie** wymaga uruchamiania całego gateway w Docker. Dostępne są też backendy sandbox SSH i OpenShell. Zobacz [Sandboxing](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM do budowy obrazu (`pnpm install` może zostać ubity przez OOM na hostach z 1 GB z kodem wyjścia 137)
- Wystarczająco dużo miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS/publicznym hoście, przejrzyj
  [Utwardzanie bezpieczeństwa dla ekspozycji sieciowej](/pl/gateway/security),
  zwłaszcza politykę firewalla Docker `DOCKER-USER`.

## Gateway w kontenerze

<Steps>
  <Step title="Zbuduj obraz">
    Z katalogu głównego repo uruchom skrypt setup:

    ```bash
    ./scripts/docker/setup.sh
    ```

    To lokalnie buduje obraz gateway. Aby zamiast tego użyć gotowego obrazu:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gotowe obrazy są publikowane w
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Typowe tagi: `main`, `latest`, `<version>` (np. `2026.2.26`).

  </Step>

  <Step title="Ukończ onboarding">
    Skrypt setup uruchamia onboarding automatycznie. Wykona on:

    - monit o API key providerów
    - wygeneruje token gateway i zapisze go do `.env`
    - uruchomi gateway przez Docker Compose

    Podczas setupu onboarding przed startem i zapisy konfiguracji są uruchamiane przez
    `openclaw-gateway` bezpośrednio. `openclaw-cli` służy do poleceń uruchamianych po
    tym, jak kontener gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    współdzielony sekret w Settings. Skrypt setup domyślnie zapisuje token do `.env`;
    jeśli przełączysz konfigurację kontenera na uwierzytelnianie hasłem, użyj zamiast tego
    tego hasła.

    Potrzebujesz znowu URL-a?

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

Jeśli wolisz uruchamiać każdy krok samodzielnie zamiast używać skryptu setup:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Uruchamiaj `docker compose` z katalogu głównego repo. Jeśli włączyłeś `OPENCLAW_EXTRA_MOUNTS`
albo `OPENCLAW_HOME_VOLUME`, skrypt setup zapisuje `docker-compose.extra.yml`;
dołącz go przez `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest to
narzędzie po starcie. Przed `docker compose up -d openclaw-gateway` uruchamiaj onboarding
i zapisy konfiguracji czasu setupu przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt setup akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                                   | Cel                                                              |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Użyj zdalnego obrazu zamiast budować lokalnie                    |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Zainstaluj dodatkowe pakiety apt podczas budowy (oddzielone spacjami) |
| `OPENCLAW_EXTENSIONS`                     | Wstępnie zainstaluj zależności pluginów podczas budowy (nazwy oddzielone spacjami) |
| `OPENCLAW_EXTRA_MOUNTS`                   | Dodatkowe bind mounty hosta (oddzielone przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Utrwal `/home/node` w nazwanym Docker volume                     |
| `OPENCLAW_SANDBOX`                        | Opt-in do bootstrap sandbox (`1`, `true`, `yes`, `on`)           |
| `OPENCLAW_DOCKER_SOCKET`                  | Nadpisz ścieżkę socketu Docker                                   |
| `OPENCLAW_DISABLE_BONJOUR`                | Wyłącz reklamowanie Bonjour/mDNS (domyślnie `1` dla Docker)      |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Wyłącz bind-mount overlays źródeł dołączonych pluginów          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Współdzielony endpoint kolektora OTLP/HTTP do eksportu OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Endpointy OTLP specyficzne dla sygnału: traces, metrics lub logs |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Nadpisanie protokołu OTLP. Obecnie obsługiwany jest tylko `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Nazwa usługi używana dla zasobów OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Opt-in do najnowszych eksperymentalnych atrybutów semantycznych GenAI |
| `OPENCLAW_OTEL_PRELOADED`                 | Pomiń uruchamianie drugiego SDK OpenTelemetry, gdy jeden jest już preloaded |

Maintainerzy mogą testować źródła dołączonych pluginów względem spakowanego obrazu przez zamontowanie
jednego katalogu źródłowego pluginu nad jego spakowaną ścieżką źródłową, na przykład
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ten zamontowany katalog źródłowy nadpisuje odpowiadający mu skompilowany bundle
`/app/dist/extensions/synology-chat` dla tego samego identyfikatora pluginu.

### Obserwowalność

Eksport OpenTelemetry jest ruchem wychodzącym z kontenera Gateway do Twojego kolektora OTLP.
Nie wymaga publikowanego portu Docker. Jeśli budujesz obraz lokalnie i chcesz, aby dołączony eksporter OpenTelemetry był dostępny wewnątrz obrazu,
dołącz jego zależności runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Oficjalny obraz wydania Docker OpenClaw zawiera źródło dołączonego pluginu
`diagnostics-otel`. W zależności od obrazu i stanu cache Gateway może nadal etapować lokalne zależności runtime OpenTelemetry pluginu przy
pierwszym włączeniu pluginu, więc pozwól temu pierwszemu uruchomieniu mieć dostęp do rejestru pakietów albo rozgrzej obraz wcześniej w swojej ścieżce release. Aby włączyć eksport, zezwól na
plugin `diagnostics-otel` i włącz go w konfiguracji, a następnie ustaw
`diagnostics.otel.enabled=true` albo użyj przykładu konfiguracji z
[OpenTelemetry export](/pl/gateway/opentelemetry). Nagłówki uwierzytelniania kolektora są
konfigurowane przez `diagnostics.otel.headers`, a nie przez zmienne środowiskowe Docker.

Metryki Prometheus używają już opublikowanego portu Gateway. Włącz
plugin `diagnostics-prometheus`, a następnie wykonuj scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Ta trasa jest chroniona przez uwierzytelnianie Gateway. Nie wystawiaj osobnego
publicznego portu `/metrics` ani nieuwierzytelnionej ścieżki reverse-proxy. Zobacz
[Metryki Prometheus](/pl/gateway/prometheus).

### Health checks

Endpointy probe kontenera (bez wymaganego uwierzytelniania):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowane `HEALTHCHECK`, które odpytuje `/healthz`.
Jeśli kontrole stale zawodzą, Docker oznacza kontener jako `unhealthy`, a
systemy orkiestracji mogą go zrestartować lub zastąpić.

Uwierzytelniony szczegółowy snapshot zdrowia:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, aby dostęp hosta do
`http://127.0.0.1:18789` działał z publikowaniem portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą dotrzeć do opublikowanego portu gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą
  bezpośrednio dotrzeć do gateway.

<Note>
Używaj wartości trybu bind w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` czy `127.0.0.1`.
</Note>

### Bonjour / mDNS

Sieć bridge Docker zwykle nie przekazuje multicastu Bonjour/mDNS
(`224.0.0.251:5353`) w niezawodny sposób. Dlatego dołączona konfiguracja Compose domyślnie ustawia
`OPENCLAW_DISABLE_BONJOUR=1`, aby Gateway nie wpadał w crash-loop ani nie
restartował wielokrotnie reklamowania, gdy bridge gubi ruch multicast.

Używaj opublikowanego URL Gateway, Tailscale albo szerokoobszarowego DNS-SD dla hostów Docker.
Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko wtedy, gdy używasz host networking, macvlan
albo innej sieci, w której wiadomo, że multicast mDNS działa.

Problemy i wskazówki dotyczące rozwiązywania znajdziesz w [Bonjour discovery](/pl/gateway/bonjour).

### Przechowywanie i trwałość

Docker Compose bind-mountuje `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw` oraz
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace`, więc te ścieżki
przetrwają wymianę kontenera.

Ten zamontowany katalog konfiguracji to miejsce, w którym OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanych OAuth/API-key providerów
- `.env` dla sekretów runtime opartych na env, takich jak `OPENCLAW_GATEWAY_TOKEN`

Pełne szczegóły trwałości dla wdrożeń VM znajdziesz w
[Docker VM Runtime - What persists where](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca wzrostu zajętości dysku:** obserwuj `media/`, pliki JSONL sesji, `cron/runs/*.jsonl`
oraz rotujące logi plikowe w `/tmp/openclaw/`.

### Helpery shella (opcjonalnie)

Aby ułatwić codzienne zarządzanie Docker, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli zainstalowałeś ClawDock ze starszej ścieżki raw `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik helpera śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik helpera znajdziesz w [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Włącz sandbox agenta dla gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Niestandardowa ścieżka socketu (np. Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrypt montuje `docker.sock` dopiero po przejściu wymagań wstępnych sandbox. Jeśli
    setup sandbox nie może zostać ukończony, skrypt resetuje `agents.defaults.sandbox.mode`
    do `off`.

  </Accordion>

  <Accordion title="Automatyzacja / CI (bez interakcji)">
    Wyłącz alokację pseudo-TTY Compose przez `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga o bezpieczeństwie sieci współdzielonej">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, dzięki czemu polecenia CLI
    mogą docierać do gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` w `openclaw-cli`.
  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień na
    `/home/node/.openclaw`, upewnij się, że bind mounty hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Ułóż Dockerfile tak, aby warstwy zależności były cache’owane. Dzięki temu nie trzeba ponownie uruchamiać
    `pnpm install`, dopóki nie zmienią się lockfile:

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

  <Accordion title="Zaawansowane opcje kontenera">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako nie-rootowy `node`. Dla bardziej
    rozbudowanego kontenera:

    1. **Utrwal `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wypiecz zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Zainstaluj przeglądarki Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Utrwal pobrania przeglądarek**: ustaw
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` i użyj
       `OPENCLAW_HOME_VOLUME` albo `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (bezgłowy Docker)">
    Jeśli wybierzesz w kreatorze OpenAI Codex OAuth, otworzy on URL przeglądarki. W
    Docker lub konfiguracjach bezgłowych skopiuj pełny URL przekierowania, pod który trafisz, i wklej
    go z powrotem do kreatora, aby zakończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz Docker używa `node:24-bookworm` i publikuje adnotacje OCI obrazu bazowego,
    w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Zobacz
    [Adnotacje obrazu OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamiasz na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) oraz
[Docker VM Runtime](/pl/install/docker-vm-runtime), aby poznać wspólne kroki wdrożenia VM,
w tym wypiekanie binariów, trwałość i aktualizacje.

## Sandbox agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, gateway
uruchamia wykonywanie narzędzi agenta (shell, odczyt/zapis plików itp.) wewnątrz izolowanych kontenerów Docker,
podczas gdy sam gateway pozostaje na hoście. Daje to twardą ścianę ochronną
wokół niezaufanych lub wielodostępnych sesji agentów bez konteneryzowania całego
gateway.

Zakres sandbox może być per agent (domyślnie), per sesja albo współdzielony. Każdy zakres
otrzymuje własny workspace montowany pod `/workspace`. Możesz też skonfigurować
polityki allow/deny narzędzi, izolację sieci, limity zasobów oraz kontenery
przeglądarki.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile wieloagentowe znajdziesz w:

- [Sandboxing](/pl/gateway/sandboxing) -- pełna dokumentacja sandbox
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp do shell w kontenerach sandbox
- [Wieloagentowy sandbox i narzędzia](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent

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

Zbuduj domyślny obraz sandbox:

```bash
scripts/sandbox-setup.sh
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu lub kontener sandbox się nie uruchamia">
    Zbuduj obraz sandbox przez
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    albo ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są automatycznie tworzone per sesja na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w sandbox">
    Ustaw `docker.user` na UID:GID zgodne z właścicielem zamontowanego workspace
    albo zmień właściciela katalogu workspace.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie są znajdowane w sandbox">
    OpenClaw uruchamia polecenia przez `sh -lc` (login shell), który ładuje
    `/etc/profile` i może resetować PATH. Ustaw `docker.env.PATH`, aby dodać na początek
    własne ścieżki narzędzi, albo dodaj skrypt w `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="Proces ubity przez OOM podczas budowy obrazu (exit 137)">
    VM potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Unauthorized albo wymagane parowanie w Control UI">
    Pobierz świeży link dashboardu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Dashboard](/pl/web/dashboard), [Urządzenia](/pl/cli/devices).

  </Accordion>

  <Accordion title="Cel gateway pokazuje ws://172.x.x.x albo błędy parowania z Docker CLI">
    Zresetuj tryb i bind gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Powiązane

- [Przegląd instalacji](/pl/install) — wszystkie metody instalacji
- [Podman](/pl/install/podman) — alternatywa dla Docker w postaci Podman
- [ClawDock](/pl/install/clawdock) — społecznościowa konfiguracja Docker Compose
- [Aktualizowanie](/pl/install/updating) — utrzymywanie OpenClaw w aktualnej wersji
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja gateway po instalacji
