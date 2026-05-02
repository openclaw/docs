---
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Zrozumienie reguł wykrywania i ładowania Plugin
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instaluj, konfiguruj i zarządzaj pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-02T10:05:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
środowiska agentów, narzędzia, Skills, mowę, transkrypcję w czasie
rzeczywistym, głos w czasie rzeczywistym, rozumienie mediów, generowanie
obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci i więcej.
Niektóre pluginy są **rdzeniowe** (dostarczane z OpenClaw), inne są
**zewnętrzne**. Większość zewnętrznych pluginów jest publikowana i odkrywana
przez [ClawHub](/pl/tools/clawhub). npm pozostaje obsługiwany dla instalacji
bezpośrednich oraz dla tymczasowego zestawu pakietów pluginów należących do
OpenClaw, dopóki ta migracja się nie zakończy.

## Szybki start

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Następnie skonfiguruj w `plugins.entries.\<id\>.config` w swoim pliku
    konfiguracyjnym.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Użyj `--runtime`, gdy musisz potwierdzić zarejestrowane narzędzia, usługi,
    metody Gateway, hooki lub należące do pluginu polecenia CLI. Zwykłe
    `inspect` to zimny sprawdzian manifestu/rejestru, który celowo unika
    importowania runtime pluginu.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Ścieżka instalacji używa tego samego mechanizmu rozwiązywania co CLI: ścieżka
lokalna/archiwum, jawne `clawhub:<pkg>`, jawne `npm:<pkg>`, jawne `git:<repo>`
albo goła specyfikacja pakietu (najpierw ClawHub, potem fallback do npm).

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się odmową
działania i kieruje do `openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania
jest wąska ścieżka ponownej instalacji dołączonego pluginu dla pluginów, które
włączają `openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja jednego pluginu jest
izolowana do tego pluginu: uruchamianie zapisuje w logach problem
`plugins.entries.<id>.config`, pomija ten plugin podczas ładowania i utrzymuje
pozostałe pluginy oraz kanały online. Uruchom `openclaw doctor --fix`, aby
poddać wadliwą konfigurację pluginu kwarantannie przez wyłączenie wpisu tego
pluginu i usunięcie jego nieprawidłowego payloadu konfiguracji; normalna kopia
zapasowa konfiguracji zachowuje poprzednie wartości. Gdy konfiguracja kanału
odwołuje się do pluginu, którego nie da się już odkryć, ale ten sam nieaktualny
identyfikator pluginu pozostaje w konfiguracji pluginu lub rekordach
instalacji, uruchamianie Gateway zapisuje ostrzeżenia i pomija ten kanał zamiast
blokować wszystkie pozostałe kanały. Uruchom `openclaw doctor --fix`, aby usunąć
nieaktualne wpisy kanału/pluginu; nieznane klucze kanałów bez dowodów na
nieaktualny plugin nadal powodują błąd walidacji, aby literówki pozostały
widoczne.
Jeśli ustawiono `plugins.enabled: false`, nieaktualne odwołania do pluginów są
traktowane jako nieaktywne: uruchamianie Gateway pomija odkrywanie/ładowanie
pluginów, a `openclaw doctor` zachowuje wyłączoną konfigurację pluginu zamiast
automatycznie ją usuwać. Włącz pluginy ponownie przed uruchomieniem czyszczenia
przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory pluginów.

Instalacja zależności pluginów odbywa się tylko podczas jawnych przepływów
instalacji/aktualizacji albo naprawy przez doctor. Uruchamianie Gateway,
ponowne ładowanie konfiguracji i inspekcja runtime nie uruchamiają menedżerów
pakietów ani nie naprawiają drzew zależności. Lokalne pluginy muszą mieć już
zainstalowane swoje zależności, natomiast pluginy npm, git i ClawHub są
instalowane w zarządzanych katalogach głównych pluginów OpenClaw. Zależności npm
mogą być hoistowane w zarządzanym katalogu głównym npm OpenClaw;
instalacja/aktualizacja skanuje ten zarządzany katalog główny przed uznaniem go
za zaufany, a odinstalowanie usuwa pakiety zarządzane przez npm za pośrednictwem
npm. Zewnętrzne pluginy i niestandardowe ścieżki ładowania nadal muszą być
instalowane przez `openclaw plugins install`. Zobacz [Rozwiązywanie zależności
pluginów](/pl/plugins/dependency-resolution), aby poznać cykl życia podczas
instalacji.

Kopie robocze źródeł są workspace'ami pnpm. Jeśli klonujesz OpenClaw, aby
pracować nad dołączonymi pluginami, uruchom `pnpm install`; OpenClaw ładuje
wtedy dołączone pluginy z `extensions/<id>`, więc zmiany i zależności lokalne
dla pakietu są używane bezpośrednio. Zwykłe instalacje w katalogu głównym npm są
przeznaczone dla spakowanego OpenClaw, a nie dla pracy programistycznej na kopii
źródeł.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format       | Jak działa                                                         | Przykłady                                              |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natywny**  | `openclaw.plugin.json` + moduł runtime; wykonuje się w procesie    | Oficjalne pluginy, społecznościowe pakiety npm         |
| **Pakiet**   | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw   | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Szczegóły pakietów znajdziesz w
[Pakietach pluginów](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Tworzenia pluginów](/pl/plugins/building-plugins)
oraz [Omówienia Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety pluginów npm muszą deklarować `openclaw.extensions` w
`package.json`. Każdy wpis musi pozostać wewnątrz katalogu pakietu i wskazywać
czytelny plik runtime albo plik źródłowy TypeScript z wywnioskowanym
zbudowanym odpowiednikiem JavaScript, takim jak `src/index.ts` do
`dist/index.js`.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki runtime nie znajdują
się pod tymi samymi ścieżkami co wpisy źródłowe. Gdy `runtimeExtensions` jest
obecne, musi zawierać dokładnie jeden wpis dla każdego wpisu `extensions`.
Niezgodne listy powodują niepowodzenie instalacji i odkrywania pluginów zamiast
cichego fallbacku do ścieżek źródłowych. Jeśli publikujesz także
`openclaw.setupEntry`, użyj `openclaw.runtimeSetupEntry` dla jego zbudowanego
odpowiednika JavaScript; ten plik jest wymagany, gdy zostanie zadeklarowany.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Oficjalne pluginy

### Pakiety npm należące do OpenClaw podczas migracji

ClawHub jest główną ścieżką dystrybucji dla większości pluginów. Obecne
spakowane wydania OpenClaw już dołączają wiele oficjalnych pluginów, więc w
normalnych konfiguracjach nie potrzebują one osobnych instalacji npm. Dopóki
każdy plugin należący do OpenClaw nie zostanie przeniesiony do ClawHub, OpenClaw
nadal publikuje część pakietów pluginów `@openclaw/*` w npm dla starszych/
niestandardowych instalacji i bezpośrednich przepływów npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako przestarzały, ta wersja
pakietu pochodzi ze starszej zewnętrznej linii pakietów. Użyj dołączonego
pluginu z obecnego OpenClaw albo lokalnej kopii roboczej, dopóki nie zostanie
opublikowany nowszy pakiet npm.

| Plugin          | Pakiet                     | Dokumentacja                              |
| --------------- | -------------------------- | ----------------------------------------- |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/pl/channels/bluebubbles)      |
| Discord         | `@openclaw/discord`        | [Discord](/pl/channels/discord)              |
| Feishu          | `@openclaw/feishu`         | [Feishu](/pl/channels/feishu)                |
| Matrix          | `@openclaw/matrix`         | [Matrix](/pl/channels/matrix)                |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/pl/channels/mattermost)        |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/pl/channels/msteams)      |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/pl/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/pl/channels/nostr)                  |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/pl/channels/synology-chat)  |
| Tlon            | `@openclaw/tlon`           | [Tlon](/pl/channels/tlon)                    |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/pl/channels/whatsapp)            |
| Zalo            | `@openclaw/zalo`           | [Zalo](/pl/channels/zalo)                    |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/pl/plugins/zalouser)        |

### Rdzeń (dostarczany z OpenClaw)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — dołączone wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — pamięć długoterminowa oparta na LanceDB z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby poznać konfigurację
    embeddingów zgodnych z OpenAI, przykłady Ollama, limity przywoływania i
    rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — dołączony plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, runtime przeglądarki i domyślnej usługi sterowania przeglądarką (włączony domyślnie; wyłącz przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)

  </Accordion>
</AccordionGroup>

Szukasz pluginów zewnętrznych? Zobacz [Pluginy społecznościowe](/pl/plugins/community).

## Konfiguracja

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Pole             | Opis                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Główny przełącznik (domyślnie: `true`)                    |
| `allow`          | Lista dozwolonych pluginów (opcjonalna)                   |
| `deny`           | Lista zablokowanych pluginów (opcjonalna; deny wygrywa)   |
| `load.paths`     | Dodatkowe pliki/katalogi pluginów                         |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki i konfiguracja per plugin                    |

`plugins.allow` jest wyłączna. Gdy nie jest pusta, tylko wymienione pluginy mogą
się ładować lub udostępniać narzędzia, nawet jeśli `tools.allow` zawiera `"*"`
albo konkretną nazwę narzędzia należącego do pluginu. Jeśli lista dozwolonych
narzędzi odwołuje się do narzędzi pluginów, dodaj identyfikatory właścicielskich
pluginów do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor` ostrzega
o takim układzie.

Zmiany konfiguracji **wymagają ponownego uruchomienia Gateway**. Jeśli Gateway
działa z włączonym obserwowaniem konfiguracji i restartem w procesie (domyślna
ścieżka `openclaw gateway`), ten restart zwykle wykonuje się automatycznie
chwilę po zapisaniu konfiguracji. Nie ma obsługiwanej ścieżki hot-reload dla
natywnego kodu runtime pluginu ani hooków cyklu życia; uruchom ponownie proces
Gateway obsługujący żywy kanał, zanim będziesz oczekiwać, że zaktualizowany kod
`register(api)`, hooki `api.on(...)`, narzędzia, usługi albo hooki dostawcy/
runtime zaczną działać.

`openclaw plugins list` to lokalna migawka rejestru/konfiguracji Pluginów.
Plugin oznaczony tam jako `enabled` znaczy, że utrwalony rejestr i bieżąca
konfiguracja pozwalają Pluginowi uczestniczyć. Nie dowodzi to, że już działający
zdalny proces potomny Gateway został zrestartowany do tego samego kodu Pluginu.
W konfiguracjach VPS/kontenerów z procesami opakowującymi wysyłaj restarty do
rzeczywistego procesu `openclaw gateway run` albo użyj `openclaw gateway
restart` wobec działającego Gateway.

<Accordion title="Stany Pluginów: wyłączony vs brakujący vs nieprawidłowy">
  - **Wyłączony**: Plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja zostaje zachowana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora Pluginu, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: Plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchamianie Gateway pomija tylko ten Plugin; `openclaw doctor --fix` może poddać nieprawidłowy wpis kwarantannie, wyłączając go i usuwając jego ładunek konfiguracji.

</Accordion>

## Wykrywanie i priorytet

OpenClaw skanuje Pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki do plików lub katalogów. Ścieżki, które
    wskazują z powrotem na własne katalogi spakowanych, wbudowanych Pluginów
    OpenClaw, są ignorowane; uruchom `openclaw doctor --fix`, aby usunąć te
    nieaktualne aliasy.
  </Step>

  <Step title="Pluginy obszaru roboczego">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginy globalne">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginy wbudowane">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Instalacje pakietowe i obrazy Docker zwykle rozwiązują wbudowane Pluginy z
skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy wbudowanego
Pluginu zostanie zamontowany przez bind mount nad odpowiadającą mu spakowaną
ścieżką źródłową, na przykład `/app/extensions/synology-chat`, OpenClaw traktuje
ten zamontowany katalog źródłowy jako źródłową nakładkę Pluginu wbudowanego i
wykrywa go przed spakowaną paczką `/app/dist/extensions/synology-chat`. Dzięki
temu pętle kontenerowe opiekunów działają bez przełączania każdego wbudowanego
Pluginu z powrotem na źródła TypeScript. Ustaw
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane paczki dist
nawet wtedy, gdy obecne są montowania nakładek źródłowych.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy i pomija pracę wykrywania/ładowania Pluginów
- `plugins.deny` zawsze wygrywa z allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Pluginy wbudowane stosują wbudowany zestaw domyślnie włączony, chyba że zostanie nadpisany
- Sloty wyłączne mogą wymusić włączenie wybranego Pluginu dla danego slotu
- Niektóre wbudowane Pluginy opt-in są włączane automatycznie, gdy konfiguracja
  wskazuje powierzchnię należącą do Pluginu, taką jak referencja modelu dostawcy,
  konfiguracja kanału lub środowisko uruchomieniowe harness
- Nieaktualna konfiguracja Pluginu jest zachowywana, gdy aktywne jest `plugins.enabled: false`;
  włącz ponownie Pluginy przed uruchomieniem czyszczenia doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy Codex z rodziny OpenAI zachowują osobne granice Pluginów:
  `openai-codex/*` należy do Pluginu OpenAI, natomiast wbudowany Plugin serwera
  aplikacji Codex jest wybierany przez `agentRuntime.id: "codex"` albo starsze
  referencje modeli `codex/*`

## Rozwiązywanie problemów z hookami runtime

Jeśli Plugin pojawia się w `plugins list`, ale efekty uboczne lub hooki
`register(api)` nie uruchamiają się w ruchu czatu na żywo, najpierw sprawdź:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  URL Gateway, profil, ścieżka konfiguracji i proces to te, które edytujesz.
- Zrestartuj działający Gateway po zmianach instalacji/konfiguracji/kodu Pluginu.
  W kontenerach opakowujących PID 1 może być tylko nadzorcą; zrestartuj albo
  wyślij sygnał do procesu potomnego `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Hooki konwersacji spoza zestawu wbudowanego, takie jak `llm_input`,
  `llm_output`, `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Uruchamia się przed
  rozwiązywaniem modelu dla tur agenta; `llm_output` działa dopiero po tym, jak
  próba modelu wygeneruje odpowiedź asystenta.
- Jako dowodu efektywnego modelu sesji użyj `openclaw sessions` albo powierzchni
  sesji/statusu Gateway, a podczas debugowania ładunków dostawców uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Powolna konfiguracja narzędzi Pluginu

Jeśli tury agenta wydają się zatrzymywać podczas przygotowywania narzędzi, włącz
logowanie trace i sprawdź linie czasu fabryk narzędzi Pluginu:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie zawiera łączny czas fabryk i najwolniejsze fabryki narzędzi
Pluginów, w tym identyfikator Pluginu, zadeklarowane nazwy narzędzi, kształt
wyniku oraz informację, czy narzędzie jest opcjonalne. Wolne linie są
podnoszone do ostrzeżeń, gdy pojedyncza fabryka zajmuje co najmniej 1 s albo
łączne przygotowanie fabryk narzędzi Pluginów zajmuje co najmniej 5 s.

Jeśli jeden Plugin dominuje czasowo, sprawdź jego rejestracje runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, zainstaluj ponownie albo wyłącz ten Plugin. Autorzy
Pluginów powinni przenieść kosztowne ładowanie zależności za ścieżkę wykonania
narzędzia zamiast wykonywać je wewnątrz fabryki narzędzia.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznacza to, że więcej niż jeden włączony Plugin próbuje posiadać ten sam kanał,
przepływ konfiguracji lub nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny
Plugin kanału zainstalowany obok wbudowanego Pluginu, który teraz udostępnia ten
sam identyfikator kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony Plugin
  i pochodzenie.
- Uruchom `openclaw plugins inspect <id> --runtime --json` dla każdego podejrzanego Pluginu i
  porównaj `channels`, `channelConfigs`, `tools` oraz diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po zainstalowaniu albo usunięciu
  pakietów Pluginów, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Zrestartuj Gateway po zmianach instalacji, rejestru lub konfiguracji.

Opcje naprawy:

- Jeśli jeden Plugin celowo zastępuje inny dla tego samego identyfikatora kanału,
  preferowany Plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver`
  z identyfikatorem Pluginu o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę za pomocą
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację
  Pluginu.
- Jeśli jawnie włączono oba Pluginy, OpenClaw zachowuje to żądanie i zgłasza
  konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi
  należących do Pluginów, aby powierzchnia runtime była jednoznaczna.

## Sloty Pluginów (kategorie wyłączne)

Niektóre kategorie są wyłączne (tylko jedna aktywna naraz):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | Co kontroluje              | Domyślnie             |
| --------------- | -------------------------- | --------------------- |
| `memory`        | Aktywny Plugin pamięci     | `memory-core`         |
| `contextEngine` | Aktywny silnik kontekstu   | `legacy` (wbudowany)  |

## Odniesienie CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Pluginy wbudowane są dostarczane z OpenClaw. Wiele z nich jest domyślnie
włączonych (na przykład wbudowani dostawcy modeli, wbudowani dostawcy mowy oraz
wbudowany Plugin przeglądarki). Inne wbudowane Pluginy nadal wymagają
`openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany Plugin lub pakiet hooków w miejscu.
Używaj `openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji
śledzonych Pluginów npm. Nie jest obsługiwane z `--link`, które ponownie używa
ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego Pluginu do tej listy allowlist przed jego
włączeniem. Jeśli ten sam identyfikator Pluginu występuje w `plugins.deny`,
instalacja usuwa ten nieaktualny wpis deny, aby jawna instalacja była możliwa do
załadowania natychmiast po restarcie.

OpenClaw utrzymuje utrwalony lokalny rejestr Pluginów jako model zimnego odczytu
dla inwentarza Pluginów, własności kontrybucji i planowania uruchamiania.
Przepływy instalacji, aktualizacji, odinstalowania, włączania i wyłączania
odświeżają ten rejestr po zmianie stanu Pluginów. Ten sam plik
`plugins/installs.json` przechowuje trwałe metadane instalacji w najwyższym
poziomie `installRecords` oraz odtwarzalne metadane manifestów w `plugins`.
Jeśli rejestr jest brakujący, nieaktualny albo nieprawidłowy, `openclaw plugins
registry --refresh` odbudowuje jego widok manifestów z rekordów instalacji,
polityki konfiguracji oraz metadanych manifestu/pakietu bez ładowania modułów
runtime Pluginów. `openclaw plugins update <id-or-npm-spec>` ma zastosowanie do
śledzonych instalacji. Przekazanie specyfikacji pakietu npm z dist-tag albo
dokładną wersją rozwiązuje nazwę pakietu z powrotem do śledzonego rekordu
Pluginu i zapisuje nową specyfikację dla przyszłych aktualizacji. Przekazanie
nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem na
domyślną linię wydań rejestru. Jeśli zainstalowany Plugin npm już odpowiada
rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija
aktualizację bez pobierania, ponownej instalacji ani przepisywania konfiguracji.

`--pin` działa tylko z npm. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście fałszywych alarmów z wbudowanego skanera niebezpiecznego kodu. Pozwala instalacjom Plugin i aktualizacjom Plugin przejść dalej mimo wbudowanych ustaleń `critical`, ale nadal nie omija blokad polityki Plugin `before_install` ani blokowania po niepowodzeniu skanowania. Skanowania instalacyjne ignorują typowe pliki i katalogi testowe, takie jak `tests/`, `__tests__/`, `*.test.*` i `*.spec.*`, aby uniknąć blokowania spakowanych mocków testowych; zadeklarowane runtime entrypointy Plugin nadal są skanowane, nawet jeśli używają jednej z tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji Plugin. Instalacje zależności Skills wspierane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Jeśli Plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skan, otwórz panel ClawHub albo uruchom `clawhub package rescan <name>`, aby poprosić ClawHub o ponowne sprawdzenie. `--dangerously-force-unsafe-install` wpływa tylko na instalacje na Twojej własnej maszynie; nie prosi ClawHub o ponowne przeskanowanie Plugin ani nie upublicznia zablokowanego wydania.

Zgodne pakiety uczestniczą w tym samym przepływie listy/inspekcji/włączania/wyłączania Plugin. Obecne wsparcie runtime obejmuje Skills w pakietach, command-skills Claude, domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` i zadeklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` zgłasza też wykryte możliwości pakietu oraz obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla Plugin opartych na pakietach.

Źródła marketplace mogą być nazwą znanego marketplace Claude z `~/.claude/plugins/known_marketplaces.json`, lokalnym katalogiem głównym marketplace albo ścieżką `marketplace.json`, skrótem GitHub takim jak `owner/repo`, adresem URL repozytorium GitHub albo adresem URL git. W przypadku zdalnych marketplace wpisy Plugin muszą pozostać wewnątrz sklonowanego repozytorium marketplace i używać wyłącznie względnych źródeł ścieżek.

Pełne szczegóły znajdziesz w [referencji CLI `openclaw plugins`](/pl/cli/plugins).

## Przegląd API Plugin

Natywne Plugin eksportują obiekt wejściowy, który udostępnia `register(api)`. Starsze Plugin mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe Plugin powinny używać `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw ładuje obiekt wejściowy i wywołuje `register(api)` podczas aktywacji Plugin. Loader nadal wraca do `activate(api)` dla starszych Plugin, ale dołączone Plugin i nowe zewnętrzne Plugin powinny traktować `register` jako publiczny kontrakt.

`api.registrationMode` informuje Plugin, dlaczego jego entry jest ładowane:

| Tryb            | Znaczenie                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja runtime. Rejestruj narzędzia, hooki, usługi, polecenia, trasy i inne aktywne efekty uboczne.                              |
| `discovery`     | Odkrywanie możliwości tylko do odczytu. Rejestruj providerów i metadane; zaufany kod entry Plugin może się załadować, ale pomiń aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekkie entry konfiguracji.                                                                |
| `setup-runtime` | Ładowanie konfiguracji kanału, które potrzebuje też entry runtime.                                                                         |
| `cli-metadata`  | Tylko zbieranie metadanych poleceń CLI.                                                                                            |

Entry Plugin, które otwierają gniazda, bazy danych, pracowniki w tle albo długotrwałych klientów, powinny chronić te efekty uboczne warunkiem `api.registrationMode === "full"`. Ładowania odkrywania są buforowane oddzielnie od ładowań aktywacyjnych i nie zastępują działającego rejestru Gateway. Odkrywanie nie aktywuje, ale nie jest wolne od importów: OpenClaw może wykonać zaufane entry Plugin albo moduł Plugin kanału, aby zbudować migawkę. Utrzymuj najwyższy poziom modułów lekki i wolny od efektów ubocznych, a klientów sieciowych, subprocessy, listenery, odczyty poświadczeń i uruchamianie usług przenieś za ścieżki pełnego runtime.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider modelu (LLM)        |
| `registerChannel`                       | Kanał czatu                |
| `registerTool`                          | Narzędzie agenta                  |
| `registerHook` / `on(...)`              | Hooki cyklu życia             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT               |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos w czasie rzeczywistym       |
| `registerMediaUnderstandingProvider`    | Analiza obrazów/audio        |
| `registerImageGenerationProvider`       | Generowanie obrazów            |
| `registerMusicGenerationProvider`       | Generowanie muzyki            |
| `registerVideoGenerationProvider`       | Generowanie wideo            |
| `registerWebFetchProvider`              | Provider pobierania/scrapingu WWW |
| `registerWebSearchProvider`             | Wyszukiwanie w WWW                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Polecenia CLI                |
| `registerContextEngine`                 | Silnik kontekstu              |
| `registerService`                       | Usługa w tle          |

Zachowanie strażników hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` jest operacją bez efektu i nie usuwa wcześniejszego anulowania.

Natywny app-server Codex przekazuje natywne zdarzenia narzędzi Codex z powrotem na tę powierzchnię hooków. Plugin mogą blokować natywne narzędzia Codex przez `before_tool_call`, obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzeniach Codex `PermissionRequest`. Bridge nie przepisuje jeszcze natywnych argumentów narzędzi Codex. Dokładna granica wsparcia runtime Codex znajduje się w [kontrakcie wsparcia Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne zachowanie typowanych hooków opisuje [przegląd SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Budowanie Plugin](/pl/plugins/building-plugins) — utwórz własny Plugin
- [Pakiety Plugin](/pl/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Manifest Plugin](/pl/plugins/manifest) — schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) — dodaj narzędzia agenta w Plugin
- [Wewnętrzna architektura Plugin](/pl/plugins/architecture) — model możliwości i potok ładowania
- [Plugin społeczności](/pl/plugins/community) — listy stron trzecich
