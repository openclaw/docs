---
read_when:
    - Instalowanie lub konfigurowanie Pluginów
    - Zrozumienie reguł wykrywania i ładowania Plugin
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-03T21:38:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
harnesy agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
głos w czasie rzeczywistym, rozumienie multimediów, generowanie obrazów,
generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci i więcej. Niektóre
pluginy są **core** (dostarczane z OpenClaw), inne są **zewnętrzne**. Większość
zewnętrznych pluginów jest publikowana i odkrywana przez
[ClawHub](/pl/tools/clawhub). Npm pozostaje obsługiwany dla instalacji
bezpośrednich oraz dla tymczasowego zestawu pakietów pluginów należących do
OpenClaw, dopóki ta migracja się nie zakończy.

## Szybki start

Przykłady instalacji, wyświetlania listy, odinstalowywania, aktualizacji i
publikowania do skopiowania znajdziesz w
[Zarządzanie pluginami](/pl/plugins/manage-plugins).

<Steps>
  <Step title="Zobacz, co jest załadowane">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Zainstaluj plugin">
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

  <Step title="Uruchom ponownie Gateway">
    ```bash
    openclaw gateway restart
    ```

    Następnie skonfiguruj w `plugins.entries.\<id\>.config` w swoim pliku konfiguracji.

  </Step>

  <Step title="Zarządzanie natywne dla czatu">
    W działającym Gateway dostępne tylko dla właściciela polecenia `/plugins enable` i `/plugins disable`
    wyzwalają moduł ponownego ładowania konfiguracji Gateway. Gateway ponownie ładuje powierzchnie runtime
    pluginów w procesie, a nowe tury agenta przebudowują listę narzędzi z
    odświeżonego rejestru. `/plugins install` zmienia kod źródłowy pluginu, więc
    Gateway żąda ponownego uruchomienia zamiast udawać, że bieżący proces może
    bezpiecznie ponownie załadować już zaimportowane moduły.

  </Step>

  <Step title="Zweryfikuj plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Użyj `--runtime`, gdy musisz potwierdzić zarejestrowane narzędzia, usługi, metody gateway,
    haki lub polecenia CLI należące do pluginu. Zwykłe `inspect` jest zimnym
    sprawdzeniem manifestu/rejestru i celowo unika importowania runtime pluginu.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Ścieżka instalacji używa tego samego resolvera co CLI: lokalna ścieżka/archiwum, jawne
`clawhub:<pkg>`, jawne `npm:<pkg>`, jawne `git:<repo>` albo goła specyfikacja
pakietu przez npm.

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpieczną odmową i wskazuje
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka ponownej instalacji
pluginu wbudowanego dla pluginów, które wybierają
`openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja pluginu kończy się bezpieczną odmową jak każda inna nieprawidłowa
konfiguracja. Uruchom `openclaw doctor --fix`, aby odizolować złą konfigurację pluginu przez
wyłączenie tego wpisu pluginu i usunięcie jego nieprawidłowego payloadu konfiguracji; zwykła
kopia zapasowa konfiguracji zachowuje poprzednie wartości.
Gdy konfiguracja kanału odwołuje się do pluginu, którego nie można już odkryć, ale ten
sam nieaktualny identyfikator pluginu pozostaje w konfiguracji pluginów lub rekordach instalacji, uruchamianie Gateway
loguje ostrzeżenia i pomija ten kanał zamiast blokować każdy inny kanał.
Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne wpisy kanału/pluginu; nieznane
klucze kanałów bez dowodu nieaktualnego pluginu nadal nie przechodzą walidacji, żeby literówki pozostały
widoczne.
Jeśli ustawiono `plugins.enabled: false`, nieaktualne odwołania do pluginów są traktowane jako bezwładne:
uruchamianie Gateway pomija odkrywanie/ładowanie pluginów, a `openclaw doctor` zachowuje
wyłączoną konfigurację pluginów zamiast usuwać ją automatycznie. Włącz pluginy ponownie przed
uruchomieniem czyszczenia przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory pluginów.

Instalacja zależności pluginów odbywa się tylko podczas jawnych przepływów instalacji/aktualizacji albo
naprawy doctor. Uruchamianie Gateway, ponowne ładowanie konfiguracji i inspekcja runtime
nie uruchamiają menedżerów pakietów ani nie naprawiają drzew zależności. Lokalne pluginy muszą już
mieć zainstalowane zależności, natomiast pluginy npm, git i ClawHub są
instalowane w zarządzanych katalogach głównych pluginów OpenClaw. Zależności npm mogą być wynoszone
w obrębie zarządzanego katalogu głównego npm OpenClaw; instalacja/aktualizacja skanuje ten zarządzany katalog główny przed
zaufaniem, a odinstalowanie usuwa pakiety zarządzane przez npm przez npm. Zewnętrzne pluginy
i niestandardowe ścieżki ładowania nadal muszą być instalowane przez `openclaw plugins install`.
Użyj `openclaw plugins list --json`, aby zobaczyć statyczny `dependencyStatus` dla każdego
widocznego pluginu bez importowania kodu runtime ani naprawiania zależności.
Zobacz [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution), aby poznać
cykl życia w czasie instalacji.

Dla instalacji npm zmienne selektory, takie jak `latest` lub dist-tag, są rozwiązywane
przed instalacją, a następnie przypinane do dokładnej zweryfikowanej wersji w zarządzanym
katalogu głównym npm OpenClaw. Po zakończeniu pracy npm OpenClaw weryfikuje, czy zainstalowany
wpis `package-lock.json` nadal pasuje do rozwiązanej wersji i integralności. Jeśli
npm zapisze inne metadane pakietu, instalacja nie powiedzie się, a zarządzany pakiet
zostanie wycofany zamiast zaakceptować inny artefakt pluginu.

Checkouty źródłowe są obszarami roboczymi pnpm. Jeśli sklonujesz OpenClaw, aby pracować nad wbudowanymi
pluginami, uruchom `pnpm install`; OpenClaw ładuje wtedy wbudowane pluginy z
`extensions/<id>`, dzięki czemu edycje i zależności lokalne dla pakietu są używane bezpośrednio.
Zwykłe instalacje w katalogu głównym npm są przeznaczone dla spakowanego OpenClaw, nie dla programowania
na checkoutach źródłowych.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format     | Jak działa                                                         | Przykłady                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + moduł runtime; wykonuje się w procesie    | Oficjalne pluginy, pakiety npm społeczności             |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw   | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/`  |

Oba pojawiają się w `openclaw plugins list`. Szczegóły pakietów bundle znajdziesz w [Pakiety bundle pluginów](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Tworzenie pluginów](/pl/plugins/building-plugins)
i [Omówienie Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety npm pluginów muszą deklarować `openclaw.extensions` w `package.json`.
Każdy wpis musi pozostawać wewnątrz katalogu pakietu i rozwiązywać się do czytelnego
pliku runtime albo do pliku źródłowego TypeScript z wywnioskowanym zbudowanym odpowiednikiem JavaScript,
takim jak `src/index.ts` do `dist/index.js`.
Spakowane instalacje muszą dostarczać ten wynik runtime JavaScript. Fallback do źródeł TypeScript
jest przeznaczony dla checkoutów źródłowych i lokalnych ścieżek programistycznych, nie dla
pakietów npm instalowanych do zarządzanego katalogu głównego pluginów OpenClaw.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki runtime nie znajdują się w
tych samych ścieżkach co wpisy źródłowe. Gdy `runtimeExtensions` jest obecne, musi zawierać
dokładnie jeden wpis dla każdego wpisu `extensions`. Niedopasowane listy powodują niepowodzenie instalacji i
odkrywania pluginów zamiast cichego fallbacku do ścieżek źródłowych. Jeśli publikujesz też
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

ClawHub jest główną ścieżką dystrybucji dla większości pluginów. Obecne spakowane
wydania OpenClaw już zawierają wiele oficjalnych pluginów, więc w normalnych konfiguracjach nie wymagają one
osobnych instalacji npm. Dopóki każdy plugin należący do OpenClaw nie zostanie
zmigrowany do ClawHub, OpenClaw nadal dostarcza część pakietów pluginów `@openclaw/*` w
npm dla starszych/niestandardowych instalacji i bezpośrednich przepływów npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako przestarzały, ta wersja pakietu
pochodzi ze starszej zewnętrznej serii pakietów. Użyj wbudowanego pluginu z
obecnego OpenClaw albo lokalnego checkoutu, dopóki nowszy pakiet npm nie zostanie opublikowany.

| Plugin          | Pakiet                     | Dokumentacja                               |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/pl/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/pl/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/pl/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/pl/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/pl/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/pl/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/pl/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/pl/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/pl/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/pl/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/pl/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/pl/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/pl/plugins/zalouser)         |

### Core (dostarczane z OpenClaw)

<AccordionGroup>
  <Accordion title="Dostawcy modeli (włączeni domyślnie)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginy pamięci">
    - `memory-core` — wbudowane wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — pamięć długoterminowa oparta na LanceDB z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby poznać konfigurację embeddingów zgodną z OpenAI,
    przykłady Ollama, limity przywoływania i rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Dostawcy mowy (włączeni domyślnie)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` — wbudowany plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody gateway `browser.request`, runtime przeglądarki i domyślnej usługi sterowania przeglądarką (włączony domyślnie; wyłącz przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)

  </Accordion>
</AccordionGroup>

Szukasz pluginów firm trzecich? Zobacz [Pluginy społeczności](/pl/plugins/community).

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
| `allow`          | Lista dozwolonych Plugin (opcjonalna)                     |
| `deny`           | Lista blokowanych Plugin (opcjonalna; blokada wygrywa)    |
| `load.paths`     | Dodatkowe pliki/katalogi Plugin                           |
| `slots`          | Wyłączne selektory slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki i konfiguracja dla poszczególnych Plugin     |

`plugins.allow` działa wykluczająco. Gdy nie jest puste, tylko wymienione Pluginy mogą się ładować
lub udostępniać narzędzia, nawet jeśli `tools.allow` zawiera `"*"` albo konkretną nazwę
narzędzia należącego do Plugin. Jeśli lista dozwolonych narzędzi odwołuje się do narzędzi Plugin, dodaj identyfikatory właścicieli Plugin
do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor` ostrzega o takim
układzie.

Zmiany konfiguracji wprowadzone przez `/plugins enable` albo `/plugins disable` wyzwalają
przeładowanie Plugin w procesie Gateway. Nowe tury agenta odbudowują swoją listę narzędzi z
odświeżonego rejestru Plugin. Operacje zmieniające źródła, takie jak instalacja,
aktualizacja i odinstalowanie, nadal restartują proces Gateway, ponieważ już zaimportowanych
modułów Plugin nie można bezpiecznie zastąpić w miejscu.

`openclaw plugins list` to lokalna migawka rejestru/konfiguracji Plugin. Plugin z oznaczeniem
`enabled` oznacza tam, że utrwalony rejestr i bieżąca konfiguracja pozwalają
Plugin uczestniczyć. Nie dowodzi to, że już działający zdalny Gateway
został przeładowany albo zrestartowany do tego samego kodu Plugin. W konfiguracjach VPS/kontenerów
z procesami opakowującymi wysyłaj restarty albo zapisy wyzwalające przeładowanie do rzeczywistego
procesu `openclaw gateway run`, albo użyj `openclaw gateway restart` wobec
działającego Gateway, gdy przeładowanie zgłasza błąd.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Wyłączony**: Plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora Plugin, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: Plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchamianie Gateway pomija tylko ten Plugin; `openclaw doctor --fix` może odizolować nieprawidłowy wpis, wyłączając go i usuwając jego ładunek konfiguracji.

</Accordion>

## Wykrywanie i pierwszeństwo

OpenClaw skanuje Pluginy w tej kolejności (wygrywa pierwsze dopasowanie):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — jawne ścieżki do pliku lub katalogu. Ścieżki wskazujące
    z powrotem na własne spakowane katalogi dołączonych Plugin OpenClaw są ignorowane;
    uruchom `openclaw doctor --fix`, aby usunąć te nieaktualne aliasy.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Dostarczane z OpenClaw. Wiele jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Instalacje pakietowe i obrazy Docker zwykle rozwiązują dołączone Pluginy z
skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy dołączonego Plugin
jest zamontowany przez bind mount na pasującej spakowanej ścieżce źródłowej, na przykład
`/app/extensions/synology-chat`, OpenClaw traktuje ten zamontowany katalog źródłowy
jako nakładkę źródłową dołączonego Plugin i wykrywa go przed spakowanym pakietem
`/app/dist/extensions/synology-chat`. Dzięki temu pętle kontenerowe opiekunów
działają bez przełączania każdego dołączonego Plugin z powrotem na źródła TypeScript.
Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane pakiety dist
nawet wtedy, gdy obecne są montowania nakładek źródłowych.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy i pomija pracę wykrywania/ładowania Plugin
- `plugins.deny` zawsze wygrywa z listą dozwolonych
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą być jawnie włączone)
- Dołączone Pluginy korzystają z wbudowanego zestawu domyślnie włączonych, chyba że zostanie to nadpisane
- Wyłączne sloty mogą wymusić włączenie wybranego Plugin dla danego slotu
- Niektóre dołączone opcjonalne Pluginy są włączane automatycznie, gdy konfiguracja nazywa
  powierzchnię należącą do Plugin, taką jak referencja modelu dostawcy, konfiguracja kanału albo środowisko wykonawcze
  harness
- Nieaktualna konfiguracja Plugin jest zachowywana, gdy aktywne jest `plugins.enabled: false`;
  włącz Pluginy ponownie przed uruchomieniem czyszczenia doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy Codex z rodziny OpenAI zachowują oddzielne granice Plugin:
  `openai-codex/*` należy do Plugin OpenAI, a dołączony Plugin serwera aplikacji Codex
  jest wybierany przez `agentRuntime.id: "codex"` albo starsze referencje modeli
  `codex/*`

## Rozwiązywanie problemów z hakami środowiska wykonawczego

Jeśli Plugin pojawia się w `plugins list`, ale efekty uboczne lub haki `register(api)`
nie działają w ruchu czatu na żywo, najpierw sprawdź te elementy:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Zrestartuj aktywny Gateway po zmianach instalacji/konfiguracji/kodu Plugin. W kontenerach
  opakowujących PID 1 może być tylko nadzorcą; zrestartuj albo zasygnalizuj proces potomny
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje haków i
  diagnostykę. Haki konwersacji spoza dołączonych Plugin, takie jak `llm_input`,
  `llm_output`, `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Działa przed rozwiązywaniem modelu
  dla tur agenta; `llm_output` działa dopiero po tym, jak próba modelu
  wytworzy wyjście asystenta.
- Jako dowodu efektywnego modelu sesji użyj `openclaw sessions` albo
  powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Wolne przygotowanie narzędzi Plugin

Jeśli tury agenta wydają się zatrzymywać podczas przygotowywania narzędzi, włącz rejestrowanie śledzące i
sprawdź wiersze czasu działania fabryk narzędzi Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie pokazuje łączny czas fabryk i najwolniejsze fabryki narzędzi Plugin,
w tym identyfikator Plugin, zadeklarowane nazwy narzędzi, kształt wyniku oraz informację, czy narzędzie jest
opcjonalne. Wolne wiersze są podnoszone do ostrzeżeń, gdy pojedyncza fabryka trwa
co najmniej 1 s albo łączne przygotowanie fabryk narzędzi Plugin trwa co najmniej 5 s.

OpenClaw buforuje pomyślne wyniki fabryk narzędzi Plugin dla powtarzanych rozwiązań
z tym samym efektywnym kontekstem żądania. Klucz pamięci podręcznej obejmuje efektywną
konfigurację środowiska wykonawczego, obszar roboczy, identyfikatory agenta/sesji, politykę sandboxa, ustawienia przeglądarki,
kontekst dostarczania, tożsamość zgłaszającego i stan własności, więc fabryki, które
zależą od tych zaufanych pól, są uruchamiane ponownie, gdy kontekst się zmienia.

Jeśli jeden Plugin dominuje czasowo, sprawdź jego rejestracje środowiska wykonawczego:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, zainstaluj ponownie albo wyłącz ten Plugin. Autorzy Plugin powinni przenieść
kosztowne ładowanie zależności za ścieżkę wykonywania narzędzia zamiast robić to
wewnątrz fabryki narzędzia.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznacza to, że więcej niż jeden włączony Plugin próbuje posiadać ten sam kanał,
przepływ konfiguracji albo nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny Plugin kanału
zainstalowany obok dołączonego Plugin, który teraz zapewnia ten sam identyfikator kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony Plugin
  i jego pochodzenie.
- Uruchom `openclaw plugins inspect <id> --runtime --json` dla każdego podejrzanego Plugin i
  porównaj `channels`, `channelConfigs`, `tools` oraz diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po zainstalowaniu lub usunięciu
  pakietów Plugin, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Zrestartuj Gateway po zmianach instalacji, rejestru albo konfiguracji.

Opcje naprawy:

- Jeśli jeden Plugin celowo zastępuje inny dla tego samego identyfikatora kanału, preferowany
  Plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver` z
  identyfikatorem Plugin o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę za pomocą
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację
  Plugin.
- Jeśli jawnie włączono oba Pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do Plugin,
  aby powierzchnia środowiska wykonawczego była jednoznaczna.

## Sloty Plugin (kategorie wyłączne)

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

| Slot            | Co kontroluje                    | Domyślnie             |
| --------------- | -------------------------------- | --------------------- |
| `memory`        | Aktywny Plugin pamięci           | `memory-core`         |
| `contextEngine` | Aktywny silnik kontekstu         | `legacy` (wbudowany)  |

## Dokumentacja CLI

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

openclaw plugins install <package>         # install from npm by default
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

Pluginy dołączone są dostarczane z OpenClaw. Wiele z nich jest włączonych domyślnie (na przykład
dołączeni dostawcy modeli, dołączeni dostawcy mowy oraz dołączony plugin przeglądarki). Inne dołączone pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub pakiet hooków w miejscu. Użyj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych pluginów npm.
Nie jest obsługiwane z `--link`, które ponownie używa ścieżki źródłowej zamiast
kopiować do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego pluginu do tej listy dozwolonych przed jego włączeniem. Jeśli ten sam identyfikator pluginu
jest obecny w `plugins.deny`, instalacja usuwa ten nieaktualny wpis odmowy, aby
jawna instalacja była natychmiast możliwa do załadowania po restarcie.

OpenClaw przechowuje utrwalony lokalny rejestr pluginów jako model zimnego odczytu dla
inwentaryzacji pluginów, własności wkładów i planowania startu. Przepływy instalacji, aktualizacji,
odinstalowania, włączania i wyłączania odświeżają ten rejestr po zmianie stanu pluginów.
Ten sam plik `plugins/installs.json` przechowuje trwałe metadane instalacji w
najwyższego poziomu `installRecords` oraz odtwarzalne metadane manifestu w `plugins`. Jeśli
rejestru brakuje, jest nieaktualny lub nieprawidłowy, `openclaw plugins registry
--refresh` odbudowuje jego widok manifestów z rekordów instalacji, zasad konfiguracji oraz
metadanych manifestu/pakietu bez ładowania modułów runtime pluginów.
`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag albo dokładną wersją rozwiązuje nazwę pakietu
z powrotem do śledzonego rekordu pluginu i zapisuje nową specyfikację dla przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem do
domyślnej linii wydań rejestru. Jeśli zainstalowany plugin npm już odpowiada
rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.
Gdy `openclaw update` działa w kanale beta, rekordy pluginów npm i ClawHub
z domyślnej linii najpierw próbują `@beta`, a następnie wracają do default/latest, gdy nie istnieje
wydanie beta pluginu. Dokładne wersje i jawne tagi pozostają przypięte.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście fałszywych alarmów
z wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje
i aktualizacje pluginów mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad zasad pluginu `before_install` ani blokowania po niepowodzeniu skanowania.
Skanowania instalacji ignorują typowe pliki i katalogi testowe, takie jak `tests/`,
`__tests__/`, `*.test.*` i `*.spec.*`, aby uniknąć blokowania spakowanych mocków testowych;
zadeklarowane punkty wejścia runtime pluginu nadal są skanowane, nawet jeśli używają jednej z
tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills
obsługiwane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania
`dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje oddzielnym
przepływem pobierania/instalacji Skills z ClawHub.

Jeśli plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skanowanie, otwórz
panel ClawHub albo uruchom `clawhub package rescan <name>`, aby poprosić ClawHub o ponowne
sprawdzenie. `--dangerously-force-unsafe-install` wpływa tylko na instalacje na Twojej własnej
maszynie; nie prosi ClawHub o ponowne przeskanowanie pluginu ani o upublicznienie zablokowanego wydania.

Zgodne pakiety uczestniczą w tym samym przepływie listy/inspekcji/włączania/wyłączania pluginów.
Bieżące wsparcie runtime obejmuje Skills z pakietów, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` i zadeklarowane w manifeście
`lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` zgłasza także wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na pakietach.

Źródłami marketplace mogą być znana nazwa marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace albo
ścieżka `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, adres URL repozytorium GitHub
albo adres URL git. W przypadku zdalnych marketplace wpisy pluginów muszą pozostawać wewnątrz
sklonowanego repozytorium marketplace i używać wyłącznie źródeł ze ścieżkami względnymi.

Pełne szczegóły znajdziesz w [dokumentacji referencyjnej CLI `openclaw plugins`](/pl/cli/plugins).

## Przegląd API Plugin

Natywne pluginy eksportują obiekt wejściowy, który udostępnia `register(api)`. Starsze
pluginy mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe pluginy powinny
używać `register`.

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

OpenClaw ładuje obiekt wejściowy i wywołuje `register(api)` podczas
aktywacji pluginu. Loader nadal wraca do `activate(api)` dla starszych pluginów,
ale dołączone pluginy i nowe zewnętrzne pluginy powinny traktować `register` jako
kontrakt publiczny.

`api.registrationMode` informuje plugin, dlaczego jego punkt wejścia jest ładowany:

| Tryb            | Znaczenie                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja runtime. Rejestruj narzędzia, hooki, usługi, polecenia, trasy i inne aktywne efekty uboczne.                              |
| `discovery`     | Tylko do odczytu wykrywanie możliwości. Rejestruj dostawców i metadane; zaufany kod wejściowy pluginu może się ładować, ale pomijaj aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekki punkt wejścia konfiguracji.                                                                |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga także punktu wejścia runtime.                                                                         |
| `cli-metadata`  | Wyłącznie zbieranie metadanych poleceń CLI.                                                                                            |

Punkty wejścia pluginów, które otwierają gniazda, bazy danych, workery w tle albo długotrwałych
klientów, powinny chronić te efekty uboczne warunkiem `api.registrationMode === "full"`.
Ładowania wykrywania są buforowane oddzielnie od ładowań aktywujących i nie zastępują
działającego rejestru Gateway. Wykrywanie nie aktywuje, ale nie jest wolne od importów:
OpenClaw może ocenić zaufany punkt wejścia pluginu albo moduł pluginu kanału, aby zbudować
snapshot. Utrzymuj najwyższe poziomy modułów jako lekkie i wolne od efektów ubocznych, a klientów
sieciowych, podprocesy, nasłuchiwacze, odczyty poświadczeń i uruchamianie usług przenieś
za ścieżki pełnego runtime.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Dostawca modelu (LLM)        |
| `registerChannel`                       | Kanał czatu                |
| `registerTool`                          | Narzędzie agenta                  |
| `registerHook` / `on(...)`              | Hooki cyklu życia             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT               |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos w czasie rzeczywistym       |
| `registerMediaUnderstandingProvider`    | Analiza obrazu/audio        |
| `registerImageGenerationProvider`       | Generowanie obrazów            |
| `registerMusicGenerationProvider`       | Generowanie muzyki            |
| `registerVideoGenerationProvider`       | Generowanie wideo            |
| `registerWebFetchProvider`              | Dostawca pobierania / scrapingu z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Polecenia CLI                |
| `registerContextEngine`                 | Silnik kontekstu              |
| `registerService`                       | Usługa w tle          |

Zachowanie strażników hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` kończy przetwarzanie; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nie wykonuje operacji i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` kończy przetwarzanie; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nie wykonuje operacji i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` kończy przetwarzanie; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nie wykonuje operacji i nie usuwa wcześniejszego anulowania.

Natywny serwer aplikacji Codex mostkuje natywne zdarzenia narzędzi Codex z powrotem do tej
powierzchni hooków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`,
obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzeniach
`PermissionRequest` Codex. Mostek nie przepisuje jeszcze argumentów natywnych narzędzi Codex.
Dokładna granica wsparcia runtime Codex znajduje się w
[kontrakcie wsparcia Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne zachowanie typowanych hooków opisuje [przegląd SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) — utwórz własny plugin
- [Pakiety pluginów](/pl/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Manifest pluginu](/pl/plugins/manifest) — schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) — dodaj narzędzia agenta w pluginie
- [Wnętrze pluginów](/pl/plugins/architecture) — model możliwości i potok ładowania
- [Pluginy społeczności](/pl/plugins/community) — listy firm trzecich
