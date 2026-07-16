---
read_when:
    - Potrzebny jest skonteneryzowany Gateway zamiast instalacji lokalnych
    - Sprawdzanie poprawności przepływu Docker.
summary: Opcjonalna konfiguracja i wdrażanie OpenClaw oparte na Dockerze
title: Docker
x-i18n:
    generated_at: "2026-07-16T18:33:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker jest **opcjonalny**. Należy go używać do uzyskania izolowanego, tymczasowego środowiska Gateway lub na hoście bez lokalnych instalacji. Jeśli prace programistyczne są już prowadzone na własnym komputerze, należy zamiast tego użyć standardowego procesu instalacji.

Domyślny backend piaskownicy używa Dockera, gdy włączono `agents.defaults.sandbox`, ale piaskownica jest domyślnie wyłączona i nie wymaga uruchamiania samego Gateway w Dockerze. Dostępne są również backendy piaskownicy SSH i OpenShell; zobacz [Piaskownica](/pl/gateway/sandboxing).

Obsługujesz wielu użytkowników? Model jednej komórki na dzierżawcę opisano w sekcji [Hosting wielodostępny](/pl/gateway/multi-tenant-hosting).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB pamięci RAM na zbudowanie obrazu (`pnpm install` może zostać zakończony przez mechanizm OOM na hostach z 1 GB pamięci, z kodem wyjścia 137)
- Wystarczająca ilość miejsca na dysku na obrazy i dzienniki
- Na serwerze VPS lub hoście publicznym należy zapoznać się z sekcją [Zabezpieczenia przed dostępem sieciowym](/pl/gateway/security), zwłaszcza z łańcuchem zapory `DOCKER-USER` Dockera

## Gateway w kontenerze

<Steps>
  <Step title="Zbuduj obraz">
    Z katalogu głównego repozytorium:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Spowoduje to lokalne zbudowanie obrazu Gateway jako `openclaw:local`. Aby zamiast tego użyć gotowego obrazu:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gotowe obrazy są publikowane najpierw w [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR jest głównym rejestrem na potrzeby automatyzacji wydań, wdrożeń przypiętych do konkretnej wersji i sprawdzania pochodzenia. To samo wydanie publikuje kopię w Docker Hub pod adresem `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Należy używać `ghcr.io/openclaw/openclaw` lub `openclaw/openclaw` i unikać nieoficjalnych kopii, które nie stosują harmonogramu wydań ani zasad przechowywania OpenClaw. Oficjalne tagi: `main`, `latest`, `<version>` (np. `2026.2.26`) oraz tagi wersji beta, takie jak `2026.2.26-beta.1` (wersje beta nigdy nie zmieniają `latest`/`main`). Domyślny obraz `main`/`latest`/`<version>` zawiera pluginy `codex` i `diagnostics-otel`. Dostępny jest także wariant `-browser` (np. `latest-browser`) z wbudowanym Chromium, przydatny dla narzędzia [przeglądarki w piaskownicy](/pl/gateway/sandboxing#sandboxed-browser) bez konieczności instalowania Playwright przy pierwszym uruchomieniu.

  </Step>

  <Step title="Ponowne uruchomienie bez dostępu do sieci">
    Na hostach bez dostępu do sieci należy najpierw przesłać i załadować obraz:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` sprawdza, czy `OPENCLAW_IMAGE` istnieje już lokalnie, wyłącza niejawne pobieranie i budowanie przez Compose, a następnie wykonuje standardową procedurę: synchronizację `.env`, korekty uprawnień, konfigurację początkową, synchronizację konfiguracji Gateway i uruchomienie Compose.

    Jeśli `OPENCLAW_SANDBOX=1`, konfiguracja offline sprawdza również skonfigurowane domyślne obrazy piaskownicy i obrazy poszczególnych agentów w demonie wskazywanym przez `OPENCLAW_DOCKER_SOCKET`, w tym etykietę kontraktu przeglądarki na obrazach przeglądarki opartych na Dockerze. Jeśli wymagany obraz nie istnieje lub jest nieaktualny, konfiguracja kończy się bez zmiany konfiguracji piaskownicy, zamiast błędnie zgłaszać powodzenie.

  </Step>

  <Step title="Dokończ konfigurację początkową">
    Skrypt konfiguracyjny automatycznie przeprowadza konfigurację początkową:

    - prosi o klucze API dostawcy
    - generuje token Gateway i zapisuje go w `.env`
    - tworzy katalog klucza tajnego profilu uwierzytelniania
    - uruchamia Gateway za pomocą Docker Compose

    Konfiguracja początkowa przed uruchomieniem oraz zapisywanie konfiguracji są wykonywane bezpośrednio przez `openclaw-gateway` (z `--no-deps --entrypoint node`), ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci Gateway i działa dopiero po utworzeniu kontenera Gateway.

  </Step>

  <Step title="Otwórz interfejs sterowania">
    Otwórz `http://127.0.0.1:18789/` i wklej token zapisany w `.env` w Settings. Jeśli kontener przełączono na uwierzytelnianie hasłem, zamiast tokenu należy użyć tego hasła.

    Potrzebujesz ponownie adresu URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Skonfiguruj kanały (opcjonalnie)">
    ```bash
    # WhatsApp (kod QR)
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

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Kontekst Dockera wyklucza `.git`. Należy przekazać tożsamość źródła jako argumenty kompilacji,
jak pokazano powyżej, aby ekran Informacje obrazu wyświetlał pobrany commit i
jeden znacznik czasu kompilacji. `scripts/docker/setup.sh` automatycznie ustala i przekazuje obie wartości.

<Note>
Polecenie `docker compose` należy uruchamiać z katalogu głównego repozytorium. Jeśli włączono `OPENCLAW_EXTRA_MOUNTS` lub `OPENCLAW_HOME_VOLUME`, skrypt konfiguracyjny zapisuje `docker-compose.extra.yml`; należy dołączyć go po każdym samodzielnie utrzymywanym `docker-compose.override.yml`, np. `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Uaktualnianie obrazów kontenerów

Po zastąpieniu obrazu OpenClaw przy zachowaniu tego samego zamontowanego stanu i konfiguracji
nowy Gateway przed osiągnięciem gotowości wykonuje bezpieczne podczas uruchamiania migracje aktualizacyjne i uzgadnianie pluginów.
Rutynowe uaktualnienia obrazu nie powinny wymagać osobnego uruchomienia
`openclaw doctor --fix`.

Jeśli podczas uruchamiania nie można bezpiecznie ukończyć tych napraw, Gateway kończy działanie, zamiast
zgłaszać prawidłowy stan. Przy skonfigurowanych zasadach ponownego uruchamiania Docker, Podman lub Kubernetes może wskazywać,
że kontener Gateway jest ponownie uruchamiany. Należy zachować zamontowany wolumin stanu, a następnie jednokrotnie uruchomić
ten sam obraz z `openclaw doctor --fix` jako poleceniem kontenera, używając
tych samych punktów montowania stanu i konfiguracji co Gateway:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Po zakończeniu działania narzędzia doctor należy ponownie uruchomić kontener Gateway z jego domyślnym poleceniem.
W Kubernetes należy uruchomić to samo polecenie w jednorazowym zadaniu Job lub podzie debugowania zamontowanym do
tego samego PVC, a następnie ponownie uruchomić Deployment lub StatefulSet.

### Zmienne środowiskowe

Opcjonalne zmienne obsługiwane przez `scripts/docker/setup.sh` (a w przypadku kontenera Gateway również bezpośrednio przez `docker-compose.yml`):

| Zmienna                                        | Przeznaczenie                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Użycie obrazu zdalnego zamiast budowania lokalnie                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Instalacja dodatkowych pakietów apt podczas budowania (rozdzielonych spacjami). Starszy alias: `OPENCLAW_DOCKER_APT_PACKAGES`           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Instalacja dodatkowych pakietów Pythona podczas budowania (rozdzielonych spacjami)                                                      |
| `OPENCLAW_EXTENSIONS`                           | Kompilacja i pakowanie wybranych obsługiwanych pluginów oraz instalacja ich zależności środowiska uruchomieniowego (identyfikatory rozdzielone przecinkami lub spacjami) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Zastąpienie opcji Node dla lokalnej kompilacji ze źródeł (domyślnie `--max-old-space-size=8192`)                                |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Zastąpienie rozmiaru sterty tsdown w MB dla lokalnej kompilacji ze źródeł                                                                 |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Pominięcie generowania deklaracji podczas lokalnego budowania obrazów przeznaczonych wyłącznie do uruchamiania (domyślnie `1`)                                      |
| `OPENCLAW_INSTALL_BROWSER`                      | Wbudowanie Chromium i Xvfb w obraz podczas budowania                                                                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | Dodatkowe montowania powiązań z hosta (wartości `source:target[:opts]` rozdzielone przecinkami)                                                   |
| `OPENCLAW_HOME_VOLUME`                          | Utrwalanie `/home/node` w nazwanym woluminie Dockera                                                                     |
| `OPENCLAW_SANDBOX`                              | Włączenie inicjalizacji piaskownicy (`1`, `true`, `yes`, `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | Pominięcie interaktywnego etapu konfiguracji początkowej (`1`, `true`, `yes`, `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | Zastąpienie ścieżki do gniazda Dockera                                                                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | Wymuszenie włączenia (`0`) lub wyłączenia (`1`) rozgłaszania Bonjour/mDNS; zobacz [Bonjour / mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Wyłączenie nakładek montowania źródeł dołączonych pluginów                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Wspólny punkt końcowy kolektora OTLP/HTTP do eksportu OpenTelemetry                                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Punkty końcowe OTLP specyficzne dla sygnału: śladów, metryk lub dzienników                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Zastąpienie protokołu OTLP. Obecnie obsługiwany jest tylko `http/protobuf`                                                   |
| `OTEL_SERVICE_NAME`                             | Nazwa usługi używana dla zasobów OpenTelemetry                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Włączenie najnowszych eksperymentalnych atrybutów semantycznych GenAI                                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | Pominięcie uruchamiania drugiego zestawu SDK OpenTelemetry, gdy jeden został wstępnie załadowany                                                    |

Oficjalny obraz nie zawiera Homebrew. Podczas konfiguracji początkowej OpenClaw ukrywa instalatory zależności Skills wymagające wyłącznie brew w kontenerze z systemem Linux bez `brew`; zależności te należy dostarczyć za pomocą niestandardowego obrazu lub zainstalować ręcznie. Należy użyć `OPENCLAW_IMAGE_APT_PACKAGES` w przypadku zależności z pakietów Debiana oraz `OPENCLAW_IMAGE_PIP_PACKAGES` w przypadku zależności Pythona (podczas budowania uruchamiane jest `python3 -m pip install --break-system-packages`, dlatego należy przypinać wersje i używać wyłącznie zaufanych indeksów).

Jeśli Docker zgłasza `ResourceExhausted`, `cannot allocate memory` lub przerywa działanie podczas `tsdown`, należy zwiększyć limit pamięci kreatora Dockera lub ponowić próbę z mniejszymi, jawnie określonymi rozmiarami sterty:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Obrazy budowane ze źródeł z wybranymi pluginami

`OPENCLAW_EXTENSIONS` wybiera identyfikatory manifestów pluginów z roboczej kopii źródłowej;
akceptowane są również istniejące nazwy katalogów źródłowych, jeśli się różnią. Kompilacja
Docker raz przyporządkowuje wybór do katalogów źródłowych, instaluje zależności
produkcyjne, a gdy wybrany plugin jest publikowany oddzielnie z użyciem
`openclaw.build.bundledDist: false`, kompiluje jego środowisko uruchomieniowe do głównego, dołączonego
katalogu dist. Ten sposób pakowania, stosowany wyłącznie w Dockerze, nie zmienia kontraktu
artefaktu npm ani ClawHub pluginu. Nieznane, nieprawidłowe lub niejednoznaczne identyfikatory
powodują niepowodzenie kompilacji obrazu. Znane identyfikatory zależności lub dostępne
wyłącznie w źródłach zachowują dotychczasowy sposób przygotowywania źródeł i zależności,
bez uzyskania skompilowanego wpisu w głównym katalogu dist. Wybrany plugin ze
zintegrowanymi wpisami kompilacji musi zostać pomyślnie skompilowany; źródła i wyniki
środowiska uruchomieniowego niewybranych zewnętrznych pluginów są usuwane.

Na przykład te polecenia tworzą oddzielne, wieloarchitekturowe, samodzielne
obrazy gatewaya FakeCo dla ClickClack, Slack i Microsoft Teams. ClawRouter jest
już częścią głównego środowiska uruchomieniowego OpenClaw, dlatego obraz ClickClack wybiera tylko
`clickclack`. Jawnie pusty argument przeglądarki sprawia, że domyślny obraz nie
zawiera Chromium:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

Użyj `--platform linux/arm64 --load` lub `--platform linux/amd64 --load` dla pojedynczej
natywnej kompilacji lokalnej. Wynik wieloplatformowy oraz dołączone SBOM i dane pochodzenia
wymagają rejestru albo innego miejsca docelowego Buildx, które zachowuje atestacje. Po
wypchnięciu sprawdź manifest i wdróż niezmienny skrót zamiast
zmiennego tagu SHA źródeł:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Wdrożenie: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Te obrazy są przeznaczone dla samodzielnych gatewayów opartych na OCI i zwykłych użytkowników Dockera.
Gatewaye zarządzane przez Crabhelm ich nie używają: ta ścieżka dostarczania tworzy
oddzielne archiwum urządzenia x86_64 zawierające archiwum npm OpenClaw oraz przypina
skróty Node, archiwum i manifestu. Urządzenie należy kompilować niezależnie
z tych samych scalonych źródeł OpenClaw.

Aby przetestować źródła dołączonego pluginu z użyciem spakowanego obrazu, zamontuj jeden katalog źródeł pluginu w jego spakowanej ścieżce źródłowej, np. `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Zastąpi to odpowiadający mu skompilowany pakiet `/app/dist/extensions/synology-chat` dla tego samego identyfikatora pluginu.

### Obserwowalność

Eksport OpenTelemetry jest wysyłany z kontenera Gateway do kolektora OTLP; nie wymaga publikowania portu Dockera. Aby umieścić dołączony eksporter w obrazie kompilowanym lokalnie:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Oficjalne gotowe obrazy zawierają już `diagnostics-otel`; zainstaluj samodzielnie `clawhub:@openclaw/diagnostics-otel` tylko wtedy, gdy został usunięty. Aby włączyć eksport, zezwól na plugin `diagnostics-otel` i włącz go w konfiguracji, a następnie ustaw `diagnostics.otel.enabled=true` (pełny przykład znajduje się w sekcji [Eksport OpenTelemetry](/pl/gateway/opentelemetry)). Nagłówki uwierzytelniania kolektora przekazuje się przez `diagnostics.otel.headers`, a nie przez zmienne środowiskowe Dockera.

Metryki Prometheus ponownie wykorzystują już opublikowany port Gateway. Zainstaluj `clawhub:@openclaw/diagnostics-prometheus`, włącz plugin `diagnostics-prometheus`, a następnie skonfiguruj pobieranie metryk z adresu:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Trasa jest chroniona uwierzytelnianiem Gateway; nie udostępniaj oddzielnego publicznego portu `/metrics` ani nieuwierzytelnionej ścieżki odwrotnego proxy. Zobacz [Metryki Prometheus](/pl/gateway/prometheus).

### Kontrole kondycji

Punkty końcowe sond kontenera (nie wymagają uwierzytelniania):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # aktywność
curl -fsS http://127.0.0.1:18789/readyz     # gotowość
```

Wbudowany w obraz `HEALTHCHECK` odpytuje `/healthz`; powtarzające się niepowodzenia oznaczają kontener jako `unhealthy`, dzięki czemu orkiestratory mogą go ponownie uruchomić lub zastąpić.

Uwierzytelniona, szczegółowa migawka kondycji:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN a interfejs pętli zwrotnej

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, aby `http://127.0.0.1:18789` na hoście działał z publikowaniem portów Dockera.

- `lan` (domyślnie): przeglądarka i CLI na hoście mogą uzyskać dostęp do opublikowanego portu gatewaya.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą uzyskać bezpośredni dostęp do gatewaya.

<Note>
Używaj wartości trybu powiązania w `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` lub `127.0.0.1`.
</Note>

### Lokalne dostawcy na hoście

Wewnątrz kontenera `127.0.0.1` oznacza sam kontener, a nie hosta. Dla dostawców działających na hoście użyj `host.docker.internal`:

| Dostawca  | Domyślny adres URL hosta         | Adres URL konfiguracji Dockera                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Dołączony proces konfiguracji używa tych adresów URL jako domyślnych wartości wdrażania LM Studio/Ollama, a `docker-compose.yml` mapuje `host.docker.internal` na gateway hosta w Docker Engine dla systemu Linux (Docker Desktop udostępnia ten sam alias w systemach macOS/Windows). Usługi hosta muszą nasłuchiwać pod adresem dostępnym dla Dockera:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Używasz własnego pliku Compose lub `docker run`? Dodaj samodzielnie to samo mapowanie, np. `--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI w Dockerze

Oficjalny obraz nie zawiera fabrycznie Claude Code. Zainstaluj go i zaloguj się wewnątrz użytkownika `node` kontenera, a następnie zachowaj ten katalog domowy kontenera, aby aktualizacje obrazu nie usuwały pliku wykonywalnego ani stanu uwierzytelniania.

W przypadku nowej instalacji włącz trwały wolumin `/home/node` przed uruchomieniem konfiguracji:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

W przypadku istniejącej instalacji najpierw zatrzymaj stos i ponownie wczytaj bieżące wartości `.env` — skrypt konfiguracji zawsze nadpisuje `.env` wartościami z bieżącej powłoki i wartościami domyślnymi; nie odczytuje samodzielnie tego pliku:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Jeśli `.env` zawiera wartości, których powłoka nie może wczytać, najpierw ręcznie ponownie wyeksportuj używane wartości (`OPENCLAW_IMAGE`, porty, tryb powiązania, niestandardowe ścieżki, `OPENCLAW_EXTRA_MOUNTS`, piaskownicę, pominięcie wdrażania). Wygenerowana nakładka montuje wolumin domowy zarówno dla `openclaw-gateway`, jak i `openclaw-cli`; pozostałe polecenia uruchamiaj z tą nakładką (oraz najpierw z `docker-compose.override.yml`, jeśli jest używany):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Natywny instalator zapisuje `claude` w `/home/node/.local/bin/claude`. Skonfiguruj OpenClaw tak, aby używał tej ścieżki:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Zaloguj się i zweryfikuj działanie z tego samego trwałego katalogu domowego:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

Następnie użyj dołączonego backendu `claude-cli`:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Przywitaj się z Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` zachowuje natywną instalację w `/home/node/.local/bin` i `/home/node/.local/share/claude`, a także ustawienia i dane uwierzytelniania Claude Code w `/home/node/.claude` i `/home/node/.claude.json`. Zachowanie wyłącznie `/home/node/.openclaw` nie wystarczy; jeśli zamiast woluminu domowego używany jest `OPENCLAW_EXTRA_MOUNTS`, zamontuj wszystkie te ścieżki Claude w obu usługach.

<Note>
W przypadku współdzielonej automatyzacji produkcyjnej lub przewidywalnych rozliczeń Anthropic preferuj ścieżkę z kluczem API Anthropic. Ponowne użycie Claude CLI podlega wersji zainstalowanego Claude Code oraz zachowaniu logowania na konto, rozliczeń i aktualizacji.
</Note>

### Bonjour / mDNS

Sieć mostkowa Dockera zwykle nie przekazuje niezawodnie ruchu multiemisji Bonjour/mDNS (`224.0.0.251:5353`). Gdy `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione, dołączony plugin Bonjour automatycznie wyłącza rozgłaszanie w sieci LAN po wykryciu działania w kontenerze, dzięki czemu nie wpada w pętlę awarii podczas ponawiania multiemisji odrzucanej przez most. Ustaw `OPENCLAW_DISABLE_BONJOUR=1`, aby wymusić wyłączenie niezależnie od wyniku wykrywania, albo `0`, aby wymusić włączenie (wyłącznie w sieci hosta, macvlan lub innej sieci, w której wiadomo, że multiemisja mDNS działa).

W pozostałych przypadkach dla hostów Dockera używaj opublikowanego adresu URL Gateway, Tailscale lub rozległego DNS-SD. Ograniczenia i wskazówki dotyczące rozwiązywania problemów zawiera sekcja [Wykrywanie Bonjour](/pl/gateway/bonjour).

### Pamięć masowa i trwałość

Docker Compose montuje przez powiązanie `OPENCLAW_CONFIG_DIR` w `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` w `/home/node/.openclaw/workspace` oraz `OPENCLAW_AUTH_PROFILE_SECRET_DIR` w `/home/node/.config/openclaw`, dzięki czemu te ścieżki przetrwają zastąpienie kontenera. Gdy zmienna nie jest ustawiona, `docker-compose.yml` używa ścieżki zapasowej w `${HOME}` albo `/tmp`, jeśli brakuje samego `HOME`, dzięki czemu `docker compose up` nigdy nie generuje specyfikacji woluminu z pustym źródłem w podstawowych środowiskach.

Ten zamontowany katalog konfiguracji zawiera:

- `openclaw.json` — konfigurację zachowania
- `agents/<agentId>/agent/auth-profiles.json` — zapisane dane uwierzytelniania OAuth/kluczem API dostawcy
- `.env` — sekrety środowiska uruchomieniowego pochodzące ze zmiennych środowiskowych, takie jak `OPENCLAW_GATEWAY_TOKEN`

Katalog sekretów profilu uwierzytelniania przechowuje lokalny klucz szyfrowania materiału tokenów profilu uwierzytelniania opartego na OAuth. Przechowuj go razem ze stanem hosta Dockera, ale oddzielnie od `OPENCLAW_CONFIG_DIR`.

Zainstalowane pluginy dostępne do pobrania przechowują stan pakietów w zamontowanym katalogu domowym OpenClaw, dzięki czemu rekordy instalacji i katalogi główne pakietów przetrwają zastąpienie kontenera; uruchomienie gatewaya nie regeneruje drzew zależności dołączonych pluginów.

Pełne informacje o trwałości maszyny wirtualnej zawiera sekcja [Środowisko uruchomieniowe maszyny wirtualnej Docker — co i gdzie jest zachowywane](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca szybkiego wzrostu użycia dysku:** `media/`, bazy danych SQLite poszczególnych agentów, starsze transkrypcje sesji JSONL, współdzielona baza danych stanu SQLite, katalogi główne pakietów zainstalowanych pluginów oraz rotacyjne dzienniki plikowe w `/tmp/openclaw/`.

### Pomocnicze funkcje powłoki (opcjonalnie)

Aby skrócić codzienne polecenia, zainstaluj [ClawDock](/pl/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli instalacja została przeprowadzona ze starszej ścieżki `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie, aby lokalny skrypt pomocniczy wskazywał bieżącą lokalizację. Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. (uruchom `clawdock-help`, aby wyświetlić pełną listę).

<AccordionGroup>
  <Accordion title="Włącz piaskownicę agenta dla Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Niestandardowa ścieżka gniazda (np. Docker bez uprawnień roota):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrypt montuje `docker.sock` dopiero po pomyślnym spełnieniu wymagań wstępnych piaskownicy. Jeśli nie można ukończyć konfiguracji piaskownicy, resetuje `agents.defaults.sandbox.mode` do `off`. Tryb kodu Codex jest wyłączony podczas tur, w których piaskownica OpenClaw jest aktywna (zobacz [Piaskownica § Backend Docker](/pl/gateway/sandboxing#docker-backend)); nigdy nie montuj gniazda Docker hosta w kontenerach piaskownicy agenta.

  </Accordion>

  <Accordion title="Automatyzacja / CI (bez interakcji)">
    Wyłącz przydzielanie pseudoterminala przez Compose za pomocą `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga dotycząca bezpieczeństwa współdzielonej sieci">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, aby polecenia CLI mogły komunikować się z Gateway przez `127.0.0.1`. Należy traktować to jako współdzieloną granicę zaufania. Konfiguracja Compose usuwa `NET_RAW`/`NET_ADMIN` i włącza `no-new-privileges` zarówno dla `openclaw-gateway`, jak i `openclaw-cli`.
  </Accordion>

  <Accordion title="Błędy DNS Docker Desktop w openclaw-cli">
    W niektórych konfiguracjach Docker Desktop wyszukiwanie DNS z pomocniczego kontenera `openclaw-cli` we współdzielonej sieci kończy się niepowodzeniem po usunięciu `NET_RAW`, co objawia się jako `EAI_AGAIN` podczas poleceń korzystających z npm, takich jak `openclaw plugins install`. Do normalnej pracy zachowaj domyślny, wzmocniony plik Compose. Poniższe nadpisanie przywraca domyślne możliwości wyłącznie kontenerowi `openclaw-cli` — używaj go do jednorazowego polecenia wymagającego dostępu do rejestru, a nie jako domyślnego sposobu uruchamiania:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Jeśli kontener `openclaw-cli` został już utworzony jako długotrwale działający, utwórz go ponownie z tym samym nadpisaniem — `docker compose exec`/`docker exec` nie mogą zmienić możliwości systemu Linux w już utworzonym kontenerze.

  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli występują błędy uprawnień dotyczące `/home/node/.openclaw`, upewnij się, że montowania powiązane z hosta należą do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ta sama niezgodność może objawiać się jako `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`, po którym występuje `plugin present but blocked` — uid procesu i właściciel zamontowanego katalogu Pluginu są różni. Zalecane jest uruchamianie z domyślnym uid 1000 i poprawienie własności montowania powiązanego. Zmieniaj właściciela `/path/to/openclaw-config/npm` na `root:root` tylko wtedy, gdy OpenClaw jest celowo uruchamiany długoterminowo jako root.

  </Accordion>

  <Accordion title="Szybsze ponowne kompilacje">
    Uporządkuj plik Dockerfile tak, aby warstwy zależności były buforowane, co pozwoli uniknąć ponownego uruchamiania `pnpm install`, dopóki pliki blokady się nie zmienią:

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
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik inny niż root: `node`. Aby uzyskać kontener o większych możliwościach:

    1. **Zachowaj `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Wbuduj zależności Pythona**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Wbuduj Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1` lub użyj oficjalnego znacznika obrazu `-browser`
    5. **Alternatywnie zainstaluj przeglądarki Playwright w trwałym woluminie**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Zachowaj pobrane pliki przeglądarek**: użyj `OPENCLAW_HOME_VOLUME` lub `OPENCLAW_EXTRA_MOUNTS`. OpenClaw automatycznie wykrywa zarządzaną przez Playwright przeglądarkę Chromium obrazu w systemie Linux.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker bez interfejsu graficznego)">
    Po wybraniu OAuth OpenAI Codex w kreatorze zostanie otwarty adres URL w przeglądarce. W konfiguracjach Docker lub bez interfejsu graficznego skopiuj pełny docelowy adres URL przekierowania i wklej go z powrotem do kreatora, aby dokończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Obraz środowiska uruchomieniowego używa `node:24-bookworm-slim` i uruchamia `tini` jako proces o PID 1, aby procesy zombie były sprzątane, a sygnały prawidłowo obsługiwane w długotrwale działających kontenerach. Publikuje adnotacje obrazu bazowego OCI, w tym `org.opencontainers.image.base.name` i `org.opencontainers.image.source`. Dependabot odświeża przypięty skrót obrazu bazowego Node; kompilacje wydań nie uruchamiają osobnej warstwy aktualizacji dystrybucji. Zobacz [adnotacje obrazów OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamianie na VPS?

Instrukcje wdrażania na współdzielonej maszynie wirtualnej, w tym wbudowywania plików binarnych, trwałości i aktualizacji, znajdują się w sekcjach [Hetzner (VPS Docker)](/pl/install/hetzner) oraz [Środowisko uruchomieniowe maszyny wirtualnej Docker](/pl/install/docker-vm-runtime).

## Piaskownica agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, Gateway wykonuje narzędzia agenta (powłokę, odczyt i zapis plików itd.) wewnątrz izolowanych kontenerów Docker, podczas gdy sam Gateway pozostaje na hoście — tworzy to twardą barierę wokół niezaufanych lub wielodostępnych sesji agentów bez umieszczania całego Gateway w kontenerze.

Zakres piaskownicy może obejmować agenta (domyślnie), sesję lub być współdzielony; każdy zakres otrzymuje własny obszar roboczy zamontowany w `/workspace`. Można również skonfigurować zasady zezwalania na narzędzia lub ich blokowania, izolację sieci, limity zasobów i kontenery przeglądarek.

Pełna konfiguracja, obrazy, uwagi dotyczące bezpieczeństwa i profile wielu agentów:

- [Piaskownica](/pl/gateway/sandboxing) -- pełna dokumentacja piaskownicy
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp do powłoki kontenerów piaskownicy
- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- ustawienia zastępujące dla poszczególnych agentów

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

Zbuduj domyślny obraz piaskownicy (z kopii roboczej kodu źródłowego):

```bash
scripts/sandbox-setup.sh
```

W przypadku instalacji npm bez kopii roboczej kodu źródłowego zobacz [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), gdzie znajdują się polecenia `docker build` do wykonania bezpośrednio.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu lub kontener piaskownicy nie uruchamia się">
    Zbuduj obraz piaskownicy za pomocą [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (kopia robocza kodu źródłowego) albo bezpośredniego polecenia `docker build` z sekcji [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup) (instalacja npm), lub ustaw `agents.defaults.sandbox.docker.image` na własny obraz. Kontenery są automatycznie tworzone dla poszczególnych sesji na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w piaskownicy">
    Ustaw `docker.user` na UID:GID zgodne z własnością zamontowanego obszaru roboczego albo zmień właściciela folderu obszaru roboczego.
  </Accordion>

  <Accordion title="Nie znaleziono niestandardowych narzędzi w piaskownicy">
    OpenClaw uruchamia polecenia za pomocą `sh -lc` (powłoka logowania), która wczytuje `/etc/profile` i może resetować PATH. Ustaw `docker.env.PATH`, aby dodać ścieżki niestandardowych narzędzi na początku, albo dodaj skrypt w `/etc/profile.d/` w pliku Dockerfile.
  </Accordion>

  <Accordion title="Proces zakończony z powodu braku pamięci podczas budowania obrazu (kod wyjścia 137)">
    Maszyna wirtualna wymaga co najmniej 2 GB pamięci RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Brak autoryzacji lub wymagane parowanie w interfejsie Control UI">
    Pobierz nowy link do panelu i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej informacji: [Panel](/pl/web/dashboard), [Urządzenia](/pl/cli/devices).

  </Accordion>

  <Accordion title="Cel Gateway wskazuje ws://172.x.x.x lub występują błędy parowania z CLI Docker">
    Zresetuj tryb i powiązanie Gateway:

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
- [Aktualizowanie](/pl/install/updating) — utrzymywanie aktualnej wersji OpenClaw
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja Gateway po instalacji
