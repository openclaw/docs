---
read_when:
    - Chcesz używać gateway w kontenerze zamiast lokalnych instalacji
    - Weryfikujesz przepływ Docker
summary: Opcjonalna konfiguracja oparta na Docker i onboarding dla OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-24T09:16:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz mieć gateway w kontenerze albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie?

- **Tak**: chcesz mieć izolowane, tymczasowe środowisko gateway albo uruchamiać OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz OpenClaw na własnej maszynie i chcesz po prostu najszybszej pętli deweloperskiej. Użyj zwykłego przepływu instalacji.
- **Uwaga o sandboxingu**: domyślny backend sandboxa używa Docker, gdy sandboxing jest włączony, ale sandboxing jest domyślnie wyłączony i **nie** wymaga, aby całe gateway działało w Docker. Dostępne są też backendy sandboxa SSH i OpenShell. Zobacz [Sandboxing](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM do budowania obrazu (`pnpm install` może zostać zabity przez OOM na hostach 1 GB z kodem wyjścia 137)
- Wystarczająco dużo miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS/publicznym hoście, zapoznaj się z
  [Utwardzaniem bezpieczeństwa dla ekspozycji sieciowej](/pl/gateway/security),
  zwłaszcza z polityką zapory `DOCKER-USER` w Docker.

## Gateway w kontenerze

<Steps>
  <Step title="Zbuduj obraz">
    Z katalogu głównego repozytorium uruchom skrypt konfiguracji:

    ```bash
    ./scripts/docker/setup.sh
    ```

    To zbuduje lokalnie obraz gateway. Aby zamiast tego użyć gotowego obrazu:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gotowe obrazy są publikowane w
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Typowe tagi: `main`, `latest`, `<version>` (np. `2026.2.26`).

  </Step>

  <Step title="Ukończ onboarding">
    Skrypt konfiguracji uruchamia onboarding automatycznie. W jego trakcie:

    - zostaniesz poproszony o klucze API dostawców
    - zostanie wygenerowany token gateway i zapisany do `.env`
    - gateway zostanie uruchomione przez Docker Compose

    Podczas konfiguracji onboarding przed startem i zapisy konfiguracji są wykonywane przez
    `openclaw-gateway` bezpośrednio. `openclaw-cli` służy do poleceń uruchamianych po tym,
    jak kontener gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    współdzielony sekret w Settings. Skrypt konfiguracji domyślnie zapisuje token do `.env`; jeśli przełączysz konfigurację kontenera na auth hasłem, użyj zamiast tego
    tego hasła.

    Potrzebujesz ponownie URL?

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
Uruchamiaj `docker compose` z katalogu głównego repozytorium. Jeśli włączyłeś `OPENCLAW_EXTRA_MOUNTS`
albo `OPENCLAW_HOME_VOLUME`, skrypt konfiguracji zapisze `docker-compose.extra.yml`;
uwzględnij go przez `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest to
narzędzie po uruchomieniu. Przed `docker compose up -d openclaw-gateway` uruchamiaj onboarding
i zapisy konfiguracji na etapie konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Variable                       | Purpose                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Użyj zdalnego obrazu zamiast budować lokalnie                    |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Zainstaluj dodatkowe pakiety apt podczas budowania (oddzielone spacjami) |
| `OPENCLAW_EXTENSIONS`          | Wstępnie zainstaluj zależności Pluginów podczas budowania (nazwy oddzielone spacjami) |
| `OPENCLAW_EXTRA_MOUNTS`        | Dodatkowe montowania bind hosta (oddzielone przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | Utrwal `/home/node` w nazwanym wolumenie Docker                  |
| `OPENCLAW_SANDBOX`             | Jawnie włącz bootstrap sandboxa (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`       | Nadpisz ścieżkę gniazda Docker                                   |

### Sprawdzenia kondycji

Punkty końcowe sond kontenera (bez wymaganego auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli sprawdzenia ciągle kończą się niepowodzeniem, Docker oznacza kontener jako `unhealthy`, a
systemy orkiestracji mogą go zrestartować albo podmienić.

Uwierzytelniony głęboki zrzut kondycji:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, aby dostęp z hosta do
`http://127.0.0.1:18789` działał z publikowaniem portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą dotrzeć do opublikowanego portu gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą
  bezpośrednio dotrzeć do gateway.

<Note>
Używaj wartości trybu bind w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta, takich jak `0.0.0.0` czy `127.0.0.1`.
</Note>

### Przechowywanie i trwałość

Docker Compose montuje bind `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw` oraz
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace`, dzięki czemu te ścieżki
przetrwają podmianę kontenera.

Ten zamontowany katalog konfiguracji to miejsce, w którym OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanych poświadczeń OAuth/kluczy API dostawców
- `.env` dla sekretów czasu działania opartych na env, takich jak `OPENCLAW_GATEWAY_TOKEN`

Pełne szczegóły trwałości dla wdrożeń VM znajdziesz w
[Środowisko wykonawcze Docker VM - Co i gdzie jest utrwalane](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca wzrostu użycia dysku:** obserwuj `media/`, pliki JSONL sesji, `cron/runs/*.jsonl`
oraz rotujące logi plikowe w `/tmp/openclaw/`.

### Pomocniki powłoki (opcjonalnie)

Aby ułatwić codzienne zarządzanie Docker, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli zainstalowałeś ClawDock ze starszej surowej ścieżki `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocnika śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik po pomocniku znajdziesz w [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Włącz sandbox agenta dla gateway w Docker">
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

    Skrypt montuje `docker.sock` dopiero po spełnieniu wymagań wstępnych sandboxa. Jeśli
    konfiguracja sandboxa nie może zostać ukończona, skrypt resetuje `agents.defaults.sandbox.mode`
    do `off`.

  </Accordion>

  <Accordion title="Automatyzacja / CI (non-interactive)">
    Wyłącz pseudo-TTY Compose przez `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga bezpieczeństwa dotycząca współdzielonej sieci">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, dzięki czemu polecenia CLI
    mogą docierać do gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` dla `openclaw-cli`.
  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień na
    `/home/node/.openclaw`, upewnij się, że montowania bind hosta są własnością uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Ułóż Dockerfile tak, aby warstwy zależności były cache’owane. Pozwala to uniknąć ponownego uruchamiania
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
    Domyślny obraz jest nastawiony na bezpieczeństwo i działa jako nieuprzywilejowany `node`. Dla bardziej
    rozbudowanego kontenera:

    1. **Utrwal `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Zainstaluj przeglądarki Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Utrwal pobrane przeglądarki**: ustaw
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` i użyj
       `OPENCLAW_HOME_VOLUME` albo `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Jeśli wybierzesz OpenAI Codex OAuth w kreatorze, otworzy on URL w przeglądarce. W
    konfiguracjach Docker lub headless skopiuj pełny URL przekierowania, na który trafisz, i wklej
    go z powrotem do kreatora, aby dokończyć auth.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz Docker używa `node:24-bookworm` i publikuje adnotacje OCI obrazu bazowego,
    w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Zobacz
    [Adnotacje obrazów OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamiasz na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) i
[Środowisko wykonawcze Docker VM](/pl/install/docker-vm-runtime), aby poznać wspólne kroki wdrażania na VM,
w tym przygotowanie binarek, trwałość danych i aktualizacje.

## Sandbox agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, gateway
uruchamia wykonanie narzędzi agenta (powłoka, odczyt/zapis plików itd.) wewnątrz izolowanych kontenerów Docker,
podczas gdy samo gateway pozostaje na hoście. Daje to twardą ścianę
wokół niezaufanych lub wielodzierżawnych sesji agentów bez konieczności konteneryzowania całego
gateway.

Zakres sandboxa może być per agent (domyślnie), per sesja albo współdzielony. Każdy zakres
otrzymuje własny obszar roboczy montowany pod `/workspace`. Możesz też konfigurować
polityki allow/deny narzędzi, izolację sieci, limity zasobów i kontenery przeglądarki.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile multi-agent znajdziesz w:

- [Sandboxing](/pl/gateway/sandboxing) -- pełna dokumentacja sandboxa
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp do powłoki kontenerów sandboxa
- [Sandbox i narzędzia Multi-Agent](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent

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
  <Accordion title="Brak obrazu lub kontener sandboxa się nie uruchamia">
    Zbuduj obraz sandboxa przy użyciu
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    albo ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są tworzone automatycznie per sesja na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w sandboxie">
    Ustaw `docker.user` na UID:GID zgodne z własnością zamontowanego obszaru roboczego
    albo zmień właściciela katalogu obszaru roboczego.
  </Accordion>

  <Accordion title="Nie znaleziono niestandardowych narzędzi w sandboxie">
    OpenClaw uruchamia polecenia przez `sh -lc` (powłoka logowania), która wczytuje
    `/etc/profile` i może resetować PATH. Ustaw `docker.env.PATH`, aby poprzedzić nim
    ścieżki swoich niestandardowych narzędzi, albo dodaj skrypt do `/etc/profile.d/` w Dockerfile.
  </Accordion>

  <Accordion title="Proces zabity przez OOM podczas budowania obrazu (exit 137)">
    Maszyna wirtualna potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Unauthorized albo wymagane parowanie w Control UI">
    Pobierz świeży link do dashboardu i zatwierdź urządzenie przeglądarki:

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
- [Podman](/pl/install/podman) — alternatywa Podman dla Docker
- [ClawDock](/pl/install/clawdock) — społecznościowa konfiguracja Docker Compose
- [Aktualizowanie](/pl/install/updating) — utrzymywanie OpenClaw na bieżąco
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja gateway po instalacji
