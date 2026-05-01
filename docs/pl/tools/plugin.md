---
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Omówienie reguł wykrywania i ładowania Pluginów
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie Pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-01T10:04:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2df8aca086aafbd8f268820f1ccc2425079c69f1a673a4c2ea163aba1358ff51
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
środowiska agentów, narzędzia, skills, mowę, transkrypcję w czasie rzeczywistym, głos
w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie
z sieci, wyszukiwanie w sieci i nie tylko. Niektóre Pluginy są **podstawowe** (dostarczane z OpenClaw), inne
są **zewnętrzne**. Większość zewnętrznych Pluginów jest publikowana i odkrywana przez
[ClawHub](/pl/tools/clawhub). Npm pozostaje obsługiwane przy instalacjach bezpośrednich oraz dla
tymczasowego zestawu pakietów Pluginów należących do OpenClaw do czasu zakończenia tej migracji.

## Szybki start

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Następnie skonfiguruj pod `plugins.entries.\<id\>.config` w swoim pliku konfiguracyjnym.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Ścieżka instalacji używa tego samego resolvera co CLI: lokalna ścieżka/archiwum, jawne
`clawhub:<pkg>`, jawne `npm:<pkg>` albo specyfikacja samego pakietu (najpierw ClawHub, potem
awaryjnie npm).

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się zamknięciem i wskazuje
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka
ponownej instalacji dołączonego Pluginu dla Pluginów, które włączają
`openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja jednego Pluginu jest izolowana do tego Pluginu:
uruchamianie zapisuje problem `plugins.entries.<id>.config` w logach, pomija ten Plugin podczas
ładowania i utrzymuje pozostałe Pluginy oraz kanały online. Uruchom `openclaw doctor --fix`,
aby poddać złą konfigurację Pluginu kwarantannie przez wyłączenie tego wpisu Pluginu i usunięcie
jego nieprawidłowego ładunku konfiguracyjnego; normalna kopia zapasowa konfiguracji zachowuje poprzednie wartości.
Gdy konfiguracja kanału odwołuje się do Pluginu, którego nie da się już odkryć, ale ten sam
przestarzały identyfikator Pluginu pozostaje w konfiguracji Pluginu lub rekordach instalacji, uruchamianie Gateway
zapisuje ostrzeżenia i pomija ten kanał zamiast blokować wszystkie inne kanały.
Uruchom `openclaw doctor --fix`, aby usunąć przestarzałe wpisy kanału/Pluginu; nieznane
klucze kanałów bez dowodów na przestarzały Plugin nadal powodują błąd walidacji, aby literówki pozostały
widoczne.
Jeśli ustawiono `plugins.enabled: false`, przestarzałe odwołania do Pluginów są traktowane jako nieaktywne:
uruchamianie Gateway pomija odkrywanie/ładowanie Pluginów, a `openclaw doctor` zachowuje
wyłączoną konfigurację Pluginu zamiast automatycznie ją usuwać. Włącz Pluginy ponownie przed
uruchomieniem czyszczenia przez doctor, jeśli chcesz usunąć przestarzałe identyfikatory Pluginów.

Pakietowe instalacje OpenClaw nie instalują z wyprzedzeniem pełnego drzewa
zależności runtime każdego dołączonego Pluginu. Gdy dołączony, należący do OpenClaw Plugin jest aktywny z
konfiguracji Pluginów, starszej konfiguracji kanału albo domyślnie włączonego manifestu, uruchamianie
naprawia tylko zadeklarowane zależności runtime tego Pluginu przed jego zaimportowaniem.
Sam utrwalony stan uwierzytelniania kanału nie aktywuje dołączonego kanału na potrzeby
naprawy zależności runtime podczas uruchamiania Gateway.
Jawne wyłączenie nadal ma pierwszeństwo: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` i `channels.<id>.enabled: false`
zapobiegają automatycznej naprawie dołączonych zależności runtime dla tego Pluginu/kanału.
Niepusta lista `plugins.allow` również ogranicza domyślnie włączoną naprawę dołączonych zależności
runtime; jawne włączenie dołączonego kanału (`channels.<id>.enabled: true`) nadal może
naprawić zależności Pluginu tego kanału.
Zewnętrzne Pluginy i niestandardowe ścieżki ładowania nadal muszą być instalowane przez
`openclaw plugins install`.
Zobacz [Rozwiązywanie zależności Pluginów](/pl/plugins/dependency-resolution), aby poznać pełny
cykl planowania i przygotowania.

## Typy Pluginów

OpenClaw rozpoznaje dwa formaty Pluginów:

| Format     | Jak działa                                                        | Przykłady                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| **Natywny** | `openclaw.plugin.json` + moduł runtime; wykonuje się w procesie  | Oficjalne Pluginy, społecznościowe pakiety npm          |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Zobacz [Pakiety Pluginów](/pl/plugins/bundles), aby poznać szczegóły pakietów.

Jeśli piszesz natywny Plugin, zacznij od [Tworzenia Pluginów](/pl/plugins/building-plugins)
oraz [Przeglądu Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety npm Pluginów muszą deklarować `openclaw.extensions` w `package.json`.
Każdy wpis musi pozostać wewnątrz katalogu pakietu i rozwiązywać się do czytelnego
pliku runtime albo do pliku źródłowego TypeScript z wywnioskowanym zbudowanym odpowiednikiem JavaScript,
takim jak `src/index.ts` do `dist/index.js`.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki runtime nie znajdują się w
tych samych ścieżkach co wpisy źródłowe. Gdy jest obecne, `runtimeExtensions` musi zawierać
dokładnie jeden wpis dla każdego wpisu `extensions`. Niedopasowane listy powodują błąd instalacji i
odkrywania Pluginów zamiast cichego powrotu do ścieżek źródłowych.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Oficjalne Pluginy

### Pakiety npm należące do OpenClaw podczas migracji

ClawHub jest podstawową ścieżką dystrybucji dla większości Pluginów. Obecne pakietowe
wydania OpenClaw zawierają już wiele oficjalnych Pluginów, więc w typowych konfiguracjach nie wymagają one
osobnych instalacji npm. Dopóki każdy Plugin należący do OpenClaw nie zostanie
przeniesiony do ClawHub, OpenClaw nadal dostarcza niektóre pakiety Pluginów `@openclaw/*` w
npm dla starszych/niestandardowych instalacji i bezpośrednich przepływów npm.

Jeśli npm zgłasza pakiet Pluginu `@openclaw/*` jako przestarzały, ta wersja pakietu
pochodzi ze starszej zewnętrznej linii pakietów. Użyj dołączonego Pluginu z
obecnego OpenClaw albo lokalnego checkoutu, dopóki nie zostanie opublikowany nowszy pakiet npm.

| Plugin          | Pakiet                     | Dokumentacja                              |
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

### Podstawowe (dostarczane z OpenClaw)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — dołączone wyszukiwanie w pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — instalowana na żądanie pamięć długoterminowa z automatycznym przypominaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby poznać konfigurację osadzania zgodną z OpenAI,
    przykłady Ollama, limity przypominania i rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — dołączony Plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, runtime przeglądarki i domyślnej usługi sterowania przeglądarką (włączony domyślnie; wyłącz przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)

  </Accordion>
</AccordionGroup>

Szukasz Pluginów firm trzecich? Zobacz [Pluginy społeczności](/pl/plugins/community).

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
| `allow`          | Lista dozwolonych Pluginów (opcjonalnie)                  |
| `deny`           | Lista zabronionych Pluginów (opcjonalnie; deny wygrywa)   |
| `load.paths`     | Dodatkowe pliki/katalogi Pluginów                         |
| `slots`          | Wyłączne selektory slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki i konfiguracja dla poszczególnych Pluginów   |

`plugins.allow` jest wyłączne. Gdy nie jest puste, tylko wymienione Pluginy mogą się ładować
lub udostępniać narzędzia, nawet jeśli `tools.allow` zawiera `"*"` albo konkretną nazwę
narzędzia należącego do Pluginu. Jeśli lista dozwolonych narzędzi odwołuje się do narzędzi Pluginu, dodaj identyfikatory
posiadających je Pluginów do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor` ostrzega o takim
kształcie.

Zmiany konfiguracji **wymagają restartu Gateway**. Jeśli Gateway działa z włączonym obserwowaniem konfiguracji
i restartem w procesie (domyślna ścieżka `openclaw gateway`), taki
restart jest zwykle wykonywany automatycznie chwilę po zapisaniu konfiguracji.
Nie ma obsługiwanej ścieżki hot-reload dla natywnego kodu runtime Pluginu ani hooków cyklu życia;
zrestartuj proces Gateway obsługujący kanał na żywo, zanim będziesz oczekiwać uruchomienia
zaktualizowanego kodu `register(api)`, hooków `api.on(...)`, narzędzi, usług albo
hooków dostawcy/runtime.

`openclaw plugins list` to lokalna migawka rejestru/konfiguracji Pluginów.
Włączony tam Plugin oznacza, że utrwalony rejestr i obecna konfiguracja pozwalają
Pluginowi uczestniczyć. Nie dowodzi to, że już działające zdalne dziecko Gateway
zrestartowało się do tego samego kodu Pluginu. W konfiguracjach VPS/kontenerowych z
procesami opakowującymi wysyłaj restarty do właściwego procesu `openclaw gateway run`
albo użyj `openclaw gateway restart` względem działającego Gateway.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Wyłączony**: Plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora Pluginu, którego odkrywanie nie znalazło.
  - **Nieprawidłowy**: Plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchamianie Gateway pomija tylko ten Plugin; `openclaw doctor --fix` może poddać nieprawidłowy wpis kwarantannie przez jego wyłączenie i usunięcie jego ładunku konfiguracyjnego.

</Accordion>

## Odkrywanie i pierwszeństwo

OpenClaw skanuje Pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki plików lub katalogów. Ścieżki wskazujące
    z powrotem na własne spakowane katalogi wbudowanych pluginów OpenClaw są ignorowane;
    uruchom `openclaw doctor --fix`, aby usunąć te nieaktualne aliasy.
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

Instalacje pakietowe i obrazy Docker zwykle rozwiązują wbudowane pluginy z
skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy wbudowanego pluginu
zostanie podmontowany przez bind mount nad odpowiadającą mu spakowaną ścieżką źródłową, na przykład
`/app/extensions/synology-chat`, OpenClaw traktuje ten zamontowany katalog źródłowy
jako nakładkę źródeł wbudowanych i wykrywa go przed spakowanym pakietem
`/app/dist/extensions/synology-chat`. Dzięki temu pętle kontenerowe maintainerów
działają bez przełączania każdego wbudowanego pluginu z powrotem na źródła TypeScript.
Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane pakiety dist
nawet wtedy, gdy obecne są montowania nakładek źródłowych.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie pluginy i pomija wykrywanie/ładowanie pluginów
- `plugins.deny` zawsze ma pierwszeństwo przed listą dozwolonych
- `plugins.entries.\<id\>.enabled: false` wyłącza ten plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą być jawnie włączone)
- Wbudowane pluginy używają wbudowanego zestawu domyślnie włączonych, chyba że zostanie to nadpisane
- Ekskluzywne sloty mogą wymusić włączenie wybranego pluginu dla danego slotu
- Niektóre wbudowane pluginy opt-in są włączane automatycznie, gdy konfiguracja wskazuje
  powierzchnię należącą do pluginu, taką jak referencja modelu dostawcy, konfiguracja kanału lub runtime
  harnessu
- Nieaktualna konfiguracja pluginu jest zachowywana, gdy `plugins.enabled: false` jest aktywne;
  włącz ponownie pluginy przed uruchomieniem czyszczenia przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy Codex z rodziny OpenAI zachowują oddzielne granice pluginów:
  `openai-codex/*` należy do pluginu OpenAI, natomiast wbudowany plugin serwera aplikacji Codex
  jest wybierany przez `agentRuntime.id: "codex"` lub starsze referencje modeli
  `codex/*`

## Rozwiązywanie problemów z hookami runtime

Jeśli plugin pojawia się w `plugins list`, ale efekty uboczne lub hooki
`register(api)` nie uruchamiają się w ruchu czatu live, najpierw sprawdź:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  adres URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Uruchom ponownie Gateway live po zmianach instalacji/konfiguracji/kodu pluginu. W kontenerach
  wrapperów PID 1 może być tylko supervisorem; uruchom ponownie albo wyślij sygnał do procesu potomnego
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Niewbudowane hooki konwersacji, takie jak `llm_input`,
  `llm_output`, `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Uruchamia się przed
  rozwiązywaniem modelu dla tur agenta; `llm_output` uruchamia się dopiero po tym, jak próba modelu
  wygeneruje wynik asystenta.
- Jako dowód efektywnego modelu sesji użyj `openclaw sessions` albo powierzchni
  sesji/statusu Gateway, a podczas debugowania payloadów dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznacza to, że więcej niż jeden włączony plugin próbuje posiadać ten sam kanał,
przepływ konfiguracji lub nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny plugin kanału
zainstalowany obok wbudowanego pluginu, który teraz zapewnia ten sam identyfikator kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony plugin
  i jego pochodzenie.
- Uruchom `openclaw plugins inspect <id> --runtime --json` dla każdego podejrzanego pluginu i
  porównaj `channels`, `channelConfigs`, `tools` oraz diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po zainstalowaniu lub usunięciu
  pakietów pluginów, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Uruchom ponownie Gateway po zmianach instalacji, rejestru lub konfiguracji.

Opcje naprawy:

- Jeśli jeden plugin celowo zastępuje inny dla tego samego identyfikatora kanału,
  preferowany plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver` z
  identyfikatorem pluginu o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę za pomocą
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację pluginu.
- Jeśli jawnie włączono oba pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do pluginu,
  aby powierzchnia runtime była jednoznaczna.

## Sloty pluginów (kategorie ekskluzywne)

Niektóre kategorie są ekskluzywne (aktywna może być tylko jedna naraz):

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

| Slot            | Co kontroluje          | Domyślne            |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Plugin aktywnej pamięci | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

## Dokumentacja CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/diagnostics
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Wbudowane pluginy są dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład
wbudowani dostawcy modeli, wbudowani dostawcy mowy i wbudowany plugin przeglądarki).
Inne wbudowane pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub pakiet hooków w miejscu. Użyj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych pluginów npm.
Nie jest obsługiwane z `--link`, który ponownie używa ścieżki źródłowej zamiast
kopiować do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego pluginu do tej listy dozwolonych przed jego włączeniem. Jeśli ten sam identyfikator pluginu
jest obecny w `plugins.deny`, instalacja usuwa ten nieaktualny wpis deny, aby
jawna instalacja była możliwa do załadowania natychmiast po restarcie.

OpenClaw utrzymuje trwały lokalny rejestr pluginów jako model zimnego odczytu dla
inwentarza pluginów, własności kontrybucji i planowania startu. Przepływy instalacji, aktualizacji,
odinstalowania, włączania i wyłączania odświeżają ten rejestr po zmianie stanu pluginu.
Ten sam plik `plugins/installs.json` przechowuje trwałe metadane instalacji w
najwyższego poziomu `installRecords` oraz odbudowywalne metadane manifestów w `plugins`. Jeśli
rejestru brakuje, jest nieaktualny lub nieprawidłowy, `openclaw plugins registry
--refresh` odbudowuje jego widok manifestów z rekordów instalacji, polityki konfiguracji i
metadanych manifestu/pakietu bez ładowania modułów runtime pluginów.
`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag lub dokładną wersją rozwiązuje nazwę pakietu
z powrotem do rekordu śledzonego pluginu i zapisuje nową specyfikację do przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem do
domyślnej linii wydań rejestru. Jeśli zainstalowany plugin npm już odpowiada
rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście fałszywych
alarmów z wbudowanego skanera niebezpiecznego kodu. Pozwala instalacjom pluginów
i aktualizacjom pluginów kontynuować mimo wbudowanych wyników `critical`, ale nadal
nie omija blokad polityki `before_install` pluginu ani blokowania po niepowodzeniu skanowania.
Skany instalacji ignorują typowe pliki i katalogi testowe, takie jak `tests/`,
`__tests__/`, `*.test.*` i `*.spec.*`, aby uniknąć blokowania spakowanych mocków testowych;
zadeklarowane punkty wejścia runtime pluginu nadal są skanowane, nawet jeśli używają jednej z
tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills
obsługiwane przez Gateway używają zamiast tego odpowiadającego override żądania
`dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje oddzielnym
przepływem pobierania/instalacji Skills z ClawHub.

Jeśli plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skan, otwórz
panel ClawHub albo uruchom `clawhub package rescan <name>`, aby poprosić ClawHub o ponowne
sprawdzenie go. `--dangerously-force-unsafe-install` wpływa tylko na instalacje na Twoim własnym
komputerze; nie prosi ClawHub o ponowne przeskanowanie pluginu ani nie sprawia, że zablokowane wydanie
staje się publiczne.

Zgodne pakiety uczestniczą w tym samym przepływie list/inspect/enable/disable
pluginów. Bieżące wsparcie runtime obejmuje Skills pakietu, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` oraz zadeklarowane w manifeście
`lspServers`, command-skills Cursor i zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` zgłasza również wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na pakietach.

Źródła marketplace mogą być znaną nazwą marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalnym katalogiem głównym marketplace albo
ścieżką `marketplace.json`, skrótem GitHub takim jak `owner/repo`, adresem URL repozytorium
GitHub albo adresem URL git. W przypadku zdalnych marketplace wpisy pluginów muszą pozostać wewnątrz
sklonowanego repozytorium marketplace i używać wyłącznie względnych źródeł ścieżek.

Zobacz [dokumentację CLI `openclaw plugins`](/pl/cli/plugins), aby uzyskać pełne szczegóły.

## Przegląd API pluginów

Natywne plugins eksportują obiekt wejścia, który udostępnia `register(api)`. Starsze
plugins mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe plugins powinny
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

OpenClaw ładuje obiekt wejścia i wywołuje `register(api)` podczas aktywacji
plugin. Loader nadal awaryjnie używa `activate(api)` dla starszych plugins,
ale dołączone plugins i nowe zewnętrzne plugins powinny traktować `register` jako
publiczny kontrakt.

`api.registrationMode` informuje plugin, dlaczego jego wejście jest ładowane:

| Tryb            | Znaczenie                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja w czasie działania. Rejestruje narzędzia, hooks, usługi, polecenia, trasy i inne aktywne efekty uboczne.                              |
| `discovery`     | Odkrywanie możliwości tylko do odczytu. Rejestruje providers i metadane; zaufany kod wejścia plugin może zostać załadowany, ale należy pominąć aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekkie wejście konfiguracji.                                                                |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga także wejścia czasu działania.                                                                         |
| `cli-metadata`  | Tylko zbieranie metadanych poleceń CLI.                                                                                            |

Wejścia plugin, które otwierają sockets, bazy danych, workers w tle lub długotrwałe
clients, powinny zabezpieczać te efekty uboczne warunkiem `api.registrationMode === "full"`.
Ładowania odkrywania są buforowane oddzielnie od ładowań aktywujących i nie zastępują
działającego rejestru Gateway. Odkrywanie jest nieaktywujące, ale nie jest wolne od importów:
OpenClaw może ocenić zaufane wejście plugin lub moduł plugin kanału, aby zbudować
snapshot. Utrzymuj najwyższe poziomy modułów lekkie i wolne od efektów ubocznych, a klientów
sieciowych, podprocesy, listeners, odczyty poświadczeń i uruchamianie usług przenieś
za ścieżki pełnego czasu działania.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model provider (LLM)        |
| `registerChannel`                       | Kanał czatu                |
| `registerTool`                          | Narzędzie agenta                  |
| `registerHook` / `on(...)`              | Hooks cyklu życia             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT               |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos w czasie rzeczywistym       |
| `registerMediaUnderstandingProvider`    | Analiza obrazu/audio        |
| `registerImageGenerationProvider`       | Generowanie obrazów            |
| `registerMusicGenerationProvider`       | Generowanie muzyki            |
| `registerVideoGenerationProvider`       | Generowanie wideo            |
| `registerWebFetchProvider`              | Provider pobierania / scrapingu z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci                  |
| `registerHttpRoute`                     | Punkt końcowy HTTP               |
| `registerCommand` / `registerCli`       | Polecenia CLI                |
| `registerContextEngine`                 | Silnik kontekstu              |
| `registerService`                       | Usługa w tle          |

Zachowanie guard hooks dla typowanych hooks cyklu życia:

- `before_tool_call`: `{ block: true }` jest terminalne; handlers o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne; handlers o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne; handlers o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` jest operacją bez efektu i nie usuwa wcześniejszego anulowania.

Natywny serwer aplikacji Codex mostkuje natywne zdarzenia narzędzi Codex z powrotem do tej
powierzchni hook. Plugins mogą blokować natywne narzędzia Codex przez `before_tool_call`,
obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzeniach
`PermissionRequest` Codex. Mostek nie przepisuje jeszcze natywnych argumentów narzędzi
Codex. Dokładna granica obsługi runtime Codex znajduje się w
[kontrakcie obsługi Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne zachowanie typowanych hooks opisano w [omówieniu SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie plugins](/pl/plugins/building-plugins) — utwórz własny plugin
- [Pakiety plugin](/pl/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Manifest plugin](/pl/plugins/manifest) — schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) — dodawanie narzędzi agenta w plugin
- [Wewnętrzna architektura plugin](/pl/plugins/architecture) — model możliwości i pipeline ładowania
- [Społecznościowe plugins](/pl/plugins/community) — listy rozwiązań zewnętrznych
