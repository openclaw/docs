---
read_when:
    - Chcesz gateway działający w kontenerze zamiast instalacji lokalnych
    - Weryfikujesz przepływ Docker
summary: Opcjonalna konfiguracja i onboarding OpenClaw oparte na Dockerze
title: Docker
x-i18n:
    generated_at: "2026-04-21T09:56:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8d3e346ca60daa9908aef0846c9052321087af7dd2c919ce79de4d5925136a2
    source_path: install/docker.md
    workflow: 15
---

# Docker (opcjonalnie)

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz gateway działający w kontenerze albo chcesz zweryfikować przepływ Docker.

## Czy Docker jest dla mnie odpowiedni?

- **Tak**: chcesz odizolowane, tymczasowe środowisko gateway albo uruchamiać OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz na własnej maszynie i chcesz po prostu najszybszej pętli developerskiej. Zamiast tego użyj normalnego przepływu instalacji.
- **Uwaga o sandboxingu**: domyślny backend sandbox używa Docker, gdy sandboxing jest włączony, ale sandboxing jest domyślnie wyłączony i **nie** wymaga uruchamiania całego gateway w Docker. Dostępne są też backendy sandbox SSH i OpenShell. Zobacz [Sandboxing](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (albo Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM do budowy obrazu (`pnpm install` może zostać ubite przez OOM na hostach 1 GB z kodem wyjścia 137)
- Wystarczająco dużo miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS/publicznym hoście, przejrzyj
  [Utwardzanie zabezpieczeń przy ekspozycji sieciowej](/pl/gateway/security),
  zwłaszcza politykę firewalla Docker `DOCKER-USER`.

## Gateway działający w kontenerze

<Steps>
  <Step title="Zbuduj obraz">
    Z katalogu głównego repo uruchom skrypt konfiguracji:

    ```bash
    ./scripts/docker/setup.sh
    ```

    To buduje obraz gateway lokalnie. Aby zamiast tego użyć gotowego obrazu:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gotowe obrazy są publikowane w
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Typowe tagi: `main`, `latest`, `<version>` (np. `2026.2.26`).

  </Step>

  <Step title="Dokończ onboarding">
    Skrypt konfiguracji uruchamia onboarding automatycznie. Wykona on:

    - poprosi o klucze API dostawców
    - wygeneruje token gateway i zapisze go do `.env`
    - uruchomi gateway przez Docker Compose

    Podczas konfiguracji onboarding przed startem i zapisy konfiguracji działają przez
    `openclaw-gateway` bezpośrednio. `openclaw-cli` służy do poleceń, które uruchamiasz po tym,
    jak kontener gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    shared secret w Settings. Skrypt konfiguracji domyślnie zapisuje token do `.env`; jeśli zmienisz konfigurację kontenera na uwierzytelnianie hasłem, użyj zamiast tego
    tego hasła.

    Potrzebujesz znowu URL?

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

Jeśli wolisz uruchamiać każdy krok samodzielnie zamiast używać skryptu konfiguracji:

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
albo `OPENCLAW_HOME_VOLUME`, skrypt konfiguracji zapisuje `docker-compose.extra.yml`;
uwzględnij go przez `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli namespace sieciowe `openclaw-gateway`, jest to
narzędzie po starcie. Przed `docker compose up -d openclaw-gateway` uruchamiaj onboarding
i zapisy konfiguracji w czasie konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                       | Cel                                                            |
| ----------------------------- | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Użyj zdalnego obrazu zamiast budować lokalnie                  |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Zainstaluj dodatkowe pakiety apt podczas budowy (rozdzielane spacją) |
| `OPENCLAW_EXTENSIONS`         | Wstępnie zainstaluj zależności rozszerzeń podczas budowy (nazwy rozdzielane spacją) |
| `OPENCLAW_EXTRA_MOUNTS`       | Dodatkowe bind mounty hosta (rozdzielane przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Zachowaj `/home/node` w nazwanym wolumenie Docker              |
| `OPENCLAW_SANDBOX`            | Włącz bootstrap sandbox (`1`, `true`, `yes`, `on`)            |
| `OPENCLAW_DOCKER_SOCKET`      | Nadpisz ścieżkę socketu Docker                                 |

### Health checki

Endpointy probe kontenera (bez wymagania uwierzytelniania):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli checki ciągle zawodzą, Docker oznacza kontener jako `unhealthy`, a
systemy orkiestracji mogą go zrestartować albo podmienić.

Uwierzytelniona głęboka migawka health:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, aby dostęp hosta do
`http://127.0.0.1:18789` działał z publikowaniem portu Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą osiągnąć opublikowany port gateway.
- `loopback`: tylko procesy wewnątrz namespace sieciowego kontenera mogą bezpośrednio
  osiągnąć gateway.

<Note>
Używaj wartości trybu bind w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` albo `127.0.0.1`.
</Note>

### Storage i trwałość

Docker Compose bind-mountuje `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw` oraz
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace`, więc te ścieżki
przetrwają wymianę kontenera.

Ten zamontowany katalog konfiguracji to miejsce, gdzie OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanych profili uwierzytelniania OAuth/klucz API dostawców
- `.env` dla sekretów runtime opartych na env, takich jak `OPENCLAW_GATEWAY_TOKEN`

Pełne szczegóły trwałości dla wdrożeń VM znajdziesz w
[Docker VM Runtime - Co jest zachowywane gdzie](/pl/install/docker-vm-runtime#what-persists-where).

**Gorące punkty wzrostu dysku:** obserwuj `media/`, pliki JSONL sesji, `cron/runs/*.jsonl`
oraz rotujące logi plikowe pod `/tmp/openclaw/`.

### Shell helpers (opcjonalnie)

Aby ułatwić codzienne zarządzanie Docker, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli zainstalowałeś ClawDock ze starszej surowej ścieżki `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik helper śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik helpera znajdziesz w [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Włącz sandbox agenta dla gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Niestandardowa ścieżka socketu (np. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrypt montuje `docker.sock` dopiero po przejściu wymagań wstępnych sandboxa. Jeśli
    konfiguracja sandboxa nie może zostać ukończona, skrypt resetuje `agents.defaults.sandbox.mode`
    do `off`.

  </Accordion>

  <Accordion title="Automatyzacja / CI (nieinteraktywne)">
    Wyłącz przydzielanie pseudo-TTY Compose przez `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga o bezpieczeństwie współdzielonej sieci">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, więc polecenia CLI
    mogą osiągnąć gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` dla `openclaw-cli`.
  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień na
    `/home/node/.openclaw`, upewnij się, że bind mounty hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Ułóż Dockerfile tak, aby warstwy zależności były cache’owane. Pozwala to uniknąć ponownego uruchamiania
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

  <Accordion title="Opcje kontenera dla zaawansowanych">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako nie-root `node`. Dla bardziej
    funkcjonalnego kontenera:

    1. **Zachowaj `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wypiecz zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Zainstaluj przeglądarki Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Zachowaj pobrane przeglądarki**: ustaw
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` i użyj
       `OPENCLAW_HOME_VOLUME` albo `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Jeśli w kreatorze wybierzesz OpenAI Codex OAuth, otworzy on URL w przeglądarce. W
    konfiguracjach Docker albo headless skopiuj pełny URL przekierowania, na który trafisz, i wklej
    go z powrotem do kreatora, aby dokończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz Docker używa `node:24-bookworm` i publikuje adnotacje obrazu bazowego OCI,
    w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Zobacz
    [Adnotacje obrazu OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamianie na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) oraz
[Docker VM Runtime](/pl/install/docker-vm-runtime), aby poznać kroki wdrożenia na współdzielonej VM,
w tym wypiekanie binariów, trwałość i aktualizacje.

## Agent Sandbox

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, gateway
uruchamia wykonywanie narzędzi agenta (shell, odczyt/zapis plików itd.) w izolowanych kontenerach Docker,
podczas gdy sam gateway pozostaje na hoście. Daje to twardą ścianę
wokół niezaufanych albo wielodostępnych sesji agentów bez konteneryzowania całego
gateway.

Scope sandboxa może być per agent (domyślnie), per sesja albo współdzielony. Każdy scope
otrzymuje własny workspace montowany pod `/workspace`. Możesz także konfigurować
polityki allow/deny dla narzędzi, izolację sieci, limity zasobów i kontenery
przeglądarki.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile wielu agentów znajdziesz w:

- [Sandboxing](/pl/gateway/sandboxing) -- pełna referencja sandboxa
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp shell do kontenerów sandbox
- [Sandbox i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent

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

Zbuduj domyślny obraz sandboxa:

```bash
scripts/sandbox-setup.sh
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu albo kontener sandboxa się nie uruchamia">
    Zbuduj obraz sandboxa za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    albo ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są tworzone automatycznie per sesja na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w sandboxie">
    Ustaw `docker.user` na UID:GID zgodne z właścicielem zamontowanego workspace,
    albo wykonaj chown katalogu workspace.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie są znajdowane w sandboxie">
    OpenClaw uruchamia polecenia przez `sh -lc` (login shell), co ładuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby dodać na początek
    własne ścieżki narzędzi, albo dodaj skrypt w `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="Ubite przez OOM podczas budowy obrazu (exit 137)">
    VM potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Unauthorized albo wymagane pairing w Control UI">
    Pobierz świeży link dashboard i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Dashboard](/web/dashboard), [Urządzenia](/cli/devices).

  </Accordion>

  <Accordion title="Cel gateway pokazuje ws://172.x.x.x albo błędy pairing z Docker CLI">
    Zresetuj tryb i bind gateway:

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
- [Aktualizowanie](/pl/install/updating) — utrzymywanie OpenClaw w aktualnej wersji
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja gateway po instalacji
