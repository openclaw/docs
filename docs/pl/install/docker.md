---
read_when:
    - Chcesz mieć gateway w kontenerze zamiast lokalnych instalacji
    - Walidujesz przepływ Docker
summary: Opcjonalna konfiguracja OpenClaw oparta na Docker i onboarding
title: Docker
x-i18n:
    generated_at: "2026-04-05T13:57:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4628362d52597f85e72c214efe96b2923c7a59a8592b3044dc8c230318c515b8
    source_path: install/docker.md
    workflow: 15
---

# Docker (opcjonalnie)

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz mieć gateway w kontenerze albo zweryfikować przepływ Docker.

## Czy Docker jest dla mnie odpowiedni?

- **Tak**: chcesz izolowanego, tymczasowego środowiska gateway albo uruchomić OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz na własnej maszynie i chcesz po prostu najszybszej pętli developerskiej. Zamiast tego użyj standardowego przepływu instalacji.
- **Uwaga dotycząca sandboxingu**: sandboxing agentów również używa Docker, ale **nie** wymaga uruchamiania całego gateway w Docker. Zobacz [Sandboxing](/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM do budowania obrazu (`pnpm install` może zostać zakończone przez OOM na hostach 1 GB z kodem wyjścia 137)
- Wystarczająca ilość miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS/publicznym hoście, przejrzyj
  [Utwardzanie bezpieczeństwa dla ekspozycji sieciowej](/gateway/security),
  zwłaszcza politykę zapory Docker `DOCKER-USER`.

## Gateway w kontenerze

<Steps>
  <Step title="Zbuduj obraz">
    Z katalogu głównego repozytorium uruchom skrypt konfiguracji:

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

  <Step title="Zakończ onboarding">
    Skrypt konfiguracji uruchamia onboarding automatycznie. W jego trakcie:

    - poprosi o klucze API dostawców
    - wygeneruje token gateway i zapisze go do `.env`
    - uruchomi gateway przez Docker Compose

    Podczas konfiguracji onboarding przed uruchomieniem i zapisy konfiguracji są wykonywane przez
    `openclaw-gateway` bezpośrednio. `openclaw-cli` służy do poleceń uruchamianych po
    tym, jak kontener gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    współdzielony sekret w Ustawieniach. Skrypt konfiguracji domyślnie zapisuje token do `.env`;
    jeśli zmienisz konfigurację kontenera na uwierzytelnianie hasłem, użyj zamiast tego
    tego hasła.

    Potrzebujesz znowu URL?

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

Jeśli wolisz uruchamiać każdy krok samodzielnie zamiast używać skryptu konfiguracji:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
docker compose up -d openclaw-gateway
```

<Note>
Uruchamiaj `docker compose` z katalogu głównego repozytorium. Jeśli włączyłeś `OPENCLAW_EXTRA_MOUNTS`
lub `OPENCLAW_HOME_VOLUME`, skrypt konfiguracji zapisuje `docker-compose.extra.yml`;
dołącz go za pomocą `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest to
narzędzie po uruchomieniu. Przed `docker compose up -d openclaw-gateway` uruchamiaj onboarding
i zapisy konfiguracji czasu konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                       | Cel                                                              |
| ----------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Użyj zdalnego obrazu zamiast budować lokalnie                    |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Zainstaluj dodatkowe pakiety apt podczas budowania (nazwy rozdzielane spacjami) |
| `OPENCLAW_EXTENSIONS`         | Wstępnie zainstaluj zależności rozszerzeń podczas budowania (nazwy rozdzielane spacjami) |
| `OPENCLAW_EXTRA_MOUNTS`       | Dodatkowe bind mounty hosta (rozdzielane przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Zachowaj `/home/node` w nazwanym wolumenie Docker                |
| `OPENCLAW_SANDBOX`            | Włącz bootstrap sandboxa (`1`, `true`, `yes`, `on`)             |
| `OPENCLAW_DOCKER_SOCKET`      | Nadpisz ścieżkę do socketu Docker                                |

### Kontrole zdrowia

Endpointy kontroli kontenera (bez wymaganego uwierzytelniania):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowane `HEALTHCHECK`, które odpytuje `/healthz`.
Jeśli kontrole stale kończą się niepowodzeniem, Docker oznacza kontener jako `unhealthy`, a
systemy orkiestracji mogą go restartować albo zastępować.

Uwierzytelniona głęboka migawka stanu zdrowia:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, aby dostęp hosta do
`http://127.0.0.1:18789` działał z publikowaniem portów Docker.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą osiągnąć opublikowany port gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą
  bezpośrednio osiągnąć gateway.

<Note>
Używaj wartości trybu bind w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` lub `127.0.0.1`.
</Note>

### Przechowywanie i trwałość

Docker Compose bind-mountuje `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw` oraz
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace`, więc te ścieżki
przetrwają wymianę kontenera.

Ten zamontowany katalog konfiguracji to miejsce, w którym OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanych danych uwierzytelniania dostawców OAuth/klucz API
- `.env` dla sekretów środowiska uruchomieniowego opartych na env, takich jak `OPENCLAW_GATEWAY_TOKEN`

Pełne szczegóły trwałości we wdrożeniach VM znajdziesz w
[Docker VM Runtime - What persists where](/install/docker-vm-runtime#what-persists-where).

**Miejsca wzrostu użycia dysku:** obserwuj `media/`, pliki JSONL sesji, `cron/runs/*.jsonl`
oraz rotowane logi plikowe w `/tmp/openclaw/`.

### Helpery powłoki (opcjonalnie)

Aby ułatwić codzienne zarządzanie Docker, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli zainstalowałeś ClawDock ze starszej ścieżki raw `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik helpera śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Zobacz [ClawDock](/install/clawdock), aby uzyskać pełny przewodnik po helperze.

<AccordionGroup>
  <Accordion title="Włącz sandbox agenta dla gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Niestandardowa ścieżka do socketu (np. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrypt montuje `docker.sock` dopiero po przejściu wymagań wstępnych sandboxa. Jeśli
    konfiguracja sandboxa nie może zostać ukończona, skrypt resetuje `agents.defaults.sandbox.mode`
    do `off`.

  </Accordion>

  <Accordion title="Automatyzacja / CI (nieinteraktywnie)">
    Wyłącz przydział pseudo-TTY Compose za pomocą `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga bezpieczeństwa dotycząca współdzielonej sieci">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, dzięki czemu polecenia CLI
    mogą osiągać gateway przez `127.0.0.1`. Traktuj to jako współdzieloną
    granicę zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` dla `openclaw-cli`.
  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień na
    `/home/node/.openclaw`, upewnij się, że bind mounty hosta są własnością uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

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
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako nieuprzywilejowany `node`. Aby uzyskać bardziej
    rozbudowany kontener:

    1. **Zachowaj `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Zainstaluj przeglądarki Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Zachowaj pobrane pliki przeglądarek**: ustaw
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` i użyj
       `OPENCLAW_HOME_VOLUME` lub `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker bez interfejsu graficznego)">
    Jeśli wybierzesz OpenAI Codex OAuth w kreatorze, otworzy on URL w przeglądarce. W
    konfiguracjach Docker lub headless skopiuj pełny URL przekierowania, na który trafisz, i wklej
    go z powrotem do kreatora, aby zakończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz Docker używa `node:24-bookworm` i publikuje adnotacje obrazu bazowego OCI,
    w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Zobacz
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamianie na VPS?

Zobacz [Hetzner (Docker VPS)](/install/hetzner) i
[Docker VM Runtime](/install/docker-vm-runtime), aby poznać wspólne kroki wdrożenia na VM,
w tym przygotowanie binariów, trwałość i aktualizacje.

## Sandbox agenta

Gdy `agents.defaults.sandbox` jest włączone, gateway uruchamia wykonywanie narzędzi agenta
(powłoka, odczyt/zapis plików itd.) wewnątrz izolowanych kontenerów Docker, podczas gdy
sam gateway pozostaje na hoście. Daje to twardą granicę wokół niezaufanych lub
wielodzierżawnych sesji agentów bez konteneryzacji całego gateway.

Zakres sandboxa może być per agent (domyślnie), per sesja albo współdzielony. Każdy zakres
otrzymuje własny obszar roboczy zamontowany pod `/workspace`. Możesz także konfigurować
polityki dozwalania/blokowania narzędzi, izolację sieci, limity zasobów i kontenery przeglądarek.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile multi-agent znajdziesz tutaj:

- [Sandboxing](/gateway/sandboxing) -- pełna dokumentacja sandboxa
- [OpenShell](/gateway/openshell) -- interaktywny dostęp do powłoki kontenerów sandboxa
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- nadpisania per agent

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
    Zbuduj obraz sandboxa za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    albo ustaw `agents.defaults.sandbox.docker.image` na własny obraz niestandardowy.
    Kontenery są tworzone automatycznie dla każdej sesji na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w sandboxie">
    Ustaw `docker.user` na UID:GID zgodne z własnością zamontowanego obszaru roboczego,
    albo wykonaj `chown` na folderze obszaru roboczego.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie są znajdowane w sandboxie">
    OpenClaw uruchamia polecenia za pomocą `sh -lc` (powłoka logowania), która ładuje
    `/etc/profile` i może resetować PATH. Ustaw `docker.env.PATH`, aby dodać na początku własne
    ścieżki narzędzi, albo dodaj skrypt w `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="Zakończenie przez OOM podczas budowania obrazu (exit 137)">
    VM potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Unauthorized lub wymagane parowanie w Control UI">
    Pobierz świeży link do panelu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Cel gateway pokazuje ws://172.x.x.x albo błędy parowania z Docker CLI">
    Zresetuj tryb i bind gateway:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Powiązane

- [Install Overview](/install) — wszystkie metody instalacji
- [Podman](/install/podman) — alternatywa Podman dla Docker
- [ClawDock](/install/clawdock) — konfiguracja społeczności Docker Compose
- [Updating](/install/updating) — utrzymywanie OpenClaw na bieżąco
- [Configuration](/gateway/configuration) — konfiguracja gateway po instalacji
