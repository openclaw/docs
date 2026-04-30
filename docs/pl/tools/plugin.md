---
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Zrozumienie reguł wykrywania i ładowania pluginów
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-04-30T10:23:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
wiązki agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
głos w czasie rzeczywistym, rozumienie multimediów, generowanie obrazów,
generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci i więcej. Niektóre
pluginy są **core** (dostarczane z OpenClaw), inne są **zewnętrzne**. Większość
zewnętrznych pluginów jest publikowana i odkrywana przez
[ClawHub](/pl/tools/clawhub). Npm pozostaje obsługiwane dla bezpośrednich instalacji
oraz dla tymczasowego zestawu pakietów pluginów należących do OpenClaw, dopóki
ta migracja się nie zakończy.

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

    Następnie skonfiguruj w `plugins.entries.\<id\>.config` w pliku konfiguracyjnym.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Ścieżka instalacji używa tego samego resolvera co CLI: ścieżka lokalna/archiwum,
jawne `clawhub:<pkg>`, jawne `npm:<pkg>` albo specyfikacja samego pakietu
(najpierw ClawHub, potem fallback npm).

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpiecznym
niepowodzeniem i wskazuje `openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania
jest wąska ścieżka ponownej instalacji dołączonego pluginu dla pluginów, które
wybierają `openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja jednego pluginu jest
izolowana do tego pluginu: uruchamianie zapisuje w logach problem
`plugins.entries.<id>.config`, pomija ten plugin podczas ładowania i utrzymuje
pozostałe pluginy oraz kanały online. Uruchom `openclaw doctor --fix`, aby
poddać złą konfigurację pluginu kwarantannie przez wyłączenie tego wpisu pluginu
i usunięcie jego nieprawidłowego ładunku konfiguracji; zwykła kopia zapasowa
konfiguracji zachowuje poprzednie wartości. Gdy konfiguracja kanału odwołuje się
do pluginu, którego nie da się już odkryć, ale ten sam nieaktualny identyfikator
pluginu pozostaje w konfiguracji pluginów lub rekordach instalacji, uruchamianie
Gateway zapisuje ostrzeżenia i pomija ten kanał, zamiast blokować wszystkie inne
kanały. Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne wpisy
kanału/pluginu; nieznane klucze kanałów bez dowodów na nieaktualny plugin nadal
powodują niepowodzenie walidacji, dzięki czemu literówki pozostają widoczne.
Jeśli ustawiono `plugins.enabled: false`, nieaktualne odwołania do pluginów są
traktowane jako bezczynne: uruchamianie Gateway pomija odkrywanie/ładowanie
pluginów, a `openclaw doctor` zachowuje wyłączoną konfigurację pluginów zamiast
automatycznie ją usuwać. Włącz pluginy ponownie przed uruchomieniem czyszczenia
przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory pluginów.

Pakietowe instalacje OpenClaw nie instalują zachłannie drzewa zależności
uruchomieniowych każdego dołączonego pluginu. Gdy dołączony plugin należący do
OpenClaw jest aktywny z konfiguracji pluginów, starszej konfiguracji kanału albo
domyślnie włączonego manifestu, uruchamianie naprawia tylko zadeklarowane
zależności uruchomieniowe tego pluginu przed jego importem. Sam utrwalony stan
uwierzytelnienia kanału nie aktywuje dołączonego kanału na potrzeby naprawy
zależności uruchomieniowych podczas uruchamiania Gateway.
Jawne wyłączenie nadal ma pierwszeństwo: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` i `channels.<id>.enabled: false`
zapobiegają automatycznej naprawie dołączonych zależności uruchomieniowych dla
tego pluginu/kanału. Niepusta lista `plugins.allow` także ogranicza naprawę
domyślnie włączonych dołączonych zależności uruchomieniowych; jawne włączenie
dołączonego kanału (`channels.<id>.enabled: true`) nadal może naprawić zależności
pluginu tego kanału.
Zewnętrzne pluginy i niestandardowe ścieżki ładowania nadal trzeba instalować
przez `openclaw plugins install`.

## Typy Plugin

OpenClaw rozpoznaje dwa formaty pluginów:

| Format       | Jak działa                                                          | Przykłady                                               |
| ------------ | ------------------------------------------------------------------- | ------------------------------------------------------- |
| **Natywny**  | `openclaw.plugin.json` + moduł uruchomieniowy; wykonuje się w procesie | Oficjalne pluginy, społecznościowe pakiety npm          |
| **Bundle**   | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw    | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Szczegóły bundle znajdziesz w [Plugin Bundles](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Building Plugins](/pl/plugins/building-plugins)
i [Plugin SDK Overview](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety npm pluginów muszą deklarować `openclaw.extensions` w `package.json`.
Każdy wpis musi pozostać wewnątrz katalogu pakietu i rozwiązywać się do czytelnego
pliku uruchomieniowego albo do pliku źródłowego TypeScript z wywnioskowanym
zbudowanym odpowiednikiem JavaScript, takim jak `src/index.ts` do `dist/index.js`.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki uruchomieniowe nie
znajdują się w tych samych ścieżkach co wpisy źródłowe. Gdy `runtimeExtensions`
jest obecne, musi zawierać dokładnie jeden wpis dla każdego wpisu `extensions`.
Niedopasowane listy powodują niepowodzenie instalacji i odkrywania pluginów
zamiast cichego fallbacku do ścieżek źródłowych.

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

ClawHub jest podstawową ścieżką dystrybucji dla większości pluginów. Obecne
pakietowe wydania OpenClaw już zawierają wiele oficjalnych pluginów, więc w
normalnych konfiguracjach nie wymagają one osobnych instalacji npm. Dopóki każdy
plugin należący do OpenClaw nie zostanie zmigrowany do ClawHub, OpenClaw nadal
publikuje niektóre pakiety pluginów `@openclaw/*` w npm dla starszych/niestandardowych
instalacji oraz bezpośrednich przepływów pracy npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako przestarzały, ta wersja
pakietu pochodzi ze starszego zewnętrznego toru pakietów. Użyj dołączonego pluginu
z bieżącego OpenClaw albo lokalnego checkoutu, dopóki nie zostanie opublikowany
nowszy pakiet npm.

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
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — dołączone wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — instalowana na żądanie pamięć długoterminowa z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby poznać konfigurację
    osadzania zgodną z OpenAI, przykłady Ollama, limity przywoływania i
    rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — dołączony plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska uruchomieniowego przeglądarki i domyślnej usługi sterowania przeglądarką (włączony domyślnie; wyłącz przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)

  </Accordion>
</AccordionGroup>

Szukasz pluginów zewnętrznych? Zobacz [Community Plugins](/pl/plugins/community).

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
| `deny`           | Lista zablokowanych pluginów (opcjonalna; blokada wygrywa) |
| `load.paths`     | Dodatkowe pliki/katalogi pluginów                         |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki i konfiguracja per plugin                    |

Zmiany konfiguracji **wymagają ponownego uruchomienia gatewaya**. Jeśli Gateway
działa z obserwowaniem konfiguracji i włączonym ponownym uruchamianiem w procesie
(domyślna ścieżka `openclaw gateway`), to ponowne uruchomienie jest zwykle
wykonywane automatycznie chwilę po zapisaniu konfiguracji. Nie ma obsługiwanej
ścieżki hot-reloadu dla natywnego kodu uruchomieniowego pluginu ani haków cyklu
życia; uruchom ponownie proces Gateway obsługujący kanał live, zanim oczekujesz,
że zaktualizowany kod `register(api)`, haki `api.on(...)`, narzędzia, usługi albo
haki provider/runtime zaczną działać.

`openclaw plugins list` to lokalna migawka rejestru/konfiguracji pluginów. Plugin
oznaczony tam jako `enabled` oznacza, że utrwalony rejestr i bieżąca konfiguracja
pozwalają pluginowi uczestniczyć. Nie dowodzi to, że już działający zdalny proces
potomny Gateway został ponownie uruchomiony do tego samego kodu pluginu. W
konfiguracjach VPS/kontenerowych z procesami opakowującymi wysyłaj ponowne
uruchomienia do rzeczywistego procesu `openclaw gateway run` albo użyj
`openclaw gateway restart` wobec działającego Gateway.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Wyłączony**: plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowywana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora pluginu, którego odkrywanie nie znalazło.
  - **Nieprawidłowy**: plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchamianie Gateway pomija tylko ten plugin; `openclaw doctor --fix` może poddać nieprawidłowy wpis kwarantannie przez wyłączenie go i usunięcie jego ładunku konfiguracji.

</Accordion>

## Odkrywanie i pierwszeństwo

OpenClaw skanuje pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — jawne ścieżki plików lub katalogów. Ścieżki, które
    wskazują z powrotem na własne pakietowe katalogi dołączonych pluginów
    OpenClaw, są ignorowane; uruchom `openclaw doctor --fix`, aby usunąć te
    nieaktualne aliasy.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dołączone pluginy">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Instalacje pakietowe i obrazy Docker zwykle rozpoznają dołączone pluginy z
drzewa skompilowanego `dist/extensions`. Jeśli katalog źródłowy dołączonego pluginu jest
podmontowany bind mountem na odpowiadającej mu spakowanej ścieżce źródłowej, na przykład
`/app/extensions/synology-chat`, OpenClaw traktuje ten podmontowany katalog źródłowy
jako nakładkę źródeł dołączonego pluginu i wykrywa go przed spakowanym pakietem
`/app/dist/extensions/synology-chat`. Dzięki temu kontenerowe pętle pracy maintainerów
działają bez przełączania każdego dołączonego pluginu z powrotem na źródła TypeScript.
Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane pakiety dist
nawet wtedy, gdy obecne są montowania nakładek źródłowych.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie pluginy i pomija wykrywanie oraz ładowanie pluginów
- `plugins.deny` zawsze ma pierwszeństwo przed allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone pluginy stosują wbudowany zestaw domyślnie włączony, chyba że zostanie nadpisany
- Wyłączne sloty mogą wymusić włączenie wybranego pluginu dla danego slotu
- Niektóre dołączone pluginy opt-in są włączane automatycznie, gdy konfiguracja wskazuje
  powierzchnię należącą do pluginu, taką jak odwołanie do modelu dostawcy, konfigurację kanału lub
  środowisko uruchomieniowe harness
- Nieaktualna konfiguracja pluginu jest zachowywana, gdy aktywne jest `plugins.enabled: false`;
  ponownie włącz pluginy przed uruchomieniem czyszczenia doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy Codex z rodziny OpenAI zachowują oddzielne granice pluginów:
  `openai-codex/*` należy do pluginu OpenAI, natomiast dołączony plugin serwera aplikacji Codex
  jest wybierany przez `agentRuntime.id: "codex"` albo starsze odwołania do modeli
  `codex/*`

## Rozwiązywanie problemów z hookami środowiska uruchomieniowego

Jeśli plugin pojawia się w `plugins list`, ale efekty uboczne lub hooki `register(api)`
nie uruchamiają się w ruchu czatu na żywo, najpierw sprawdź te elementy:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  adres URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Uruchom ponownie działający Gateway po zmianach instalacji, konfiguracji lub kodu pluginu. W kontenerach
  opakowujących PID 1 może być tylko supervisorem; uruchom ponownie albo wyślij sygnał do procesu potomnego
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Niedostarczane w pakiecie hooki konwersacji, takie jak `llm_input`,
  `llm_output`, `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Działa przed rozpoznaniem modelu
  dla tur agenta; `llm_output` działa dopiero po tym, jak próba modelu
  wygeneruje wynik asystenta.
- Jako dowodu efektywnego modelu sesji użyj `openclaw sessions` albo powierzchni
  sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznacza to, że więcej niż jeden włączony plugin próbuje posiadać ten sam kanał,
przepływ konfiguracji albo nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny plugin kanału
zainstalowany obok dołączonego pluginu, który teraz zapewnia ten sam identyfikator kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony plugin
  i jego pochodzenie.
- Uruchom `openclaw plugins inspect <id> --json` dla każdego podejrzanego pluginu i
  porównaj `channels`, `channelConfigs`, `tools` oraz diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po zainstalowaniu albo usunięciu
  pakietów pluginów, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Uruchom ponownie Gateway po zmianach instalacji, rejestru albo konfiguracji.

Opcje naprawy:

- Jeśli jeden plugin celowo zastępuje inny dla tego samego identyfikatora kanału, preferowany
  plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver` z
  identyfikatorem pluginu o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę za pomocą
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację pluginu.
- Jeśli jawnie włączono oba pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do pluginu,
  aby powierzchnia środowiska uruchomieniowego była jednoznaczna.

## Sloty pluginów (kategorie wyłączne)

Niektóre kategorie są wyłączne (aktywna może być tylko jedna naraz):

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

| Slot            | Co kontroluje            | Domyślnie            |
| --------------- | ------------------------ | -------------------- |
| `memory`        | Aktywny plugin pamięci   | `memory-core`        |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

## Dokumentacja CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

Dołączone pluginy są dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład
dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony plugin przeglądarki).
Inne dołączone pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin albo pakiet hooków w miejscu. Użyj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych pluginów npm.
Nie jest obsługiwane z `--link`, które ponownie używa ścieżki źródłowej zamiast
kopiować ją do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego pluginu do tej listy dozwolonych przed jego włączeniem. Jeśli ten sam identyfikator pluginu
jest obecny w `plugins.deny`, instalacja usuwa ten nieaktualny wpis deny, aby
jawna instalacja była możliwa do załadowania natychmiast po restarcie.

OpenClaw utrzymuje utrwalony lokalny rejestr pluginów jako model zimnego odczytu dla
inwentaryzacji pluginów, własności wkładów i planowania uruchamiania. Przepływy instalacji, aktualizacji,
odinstalowania, włączania i wyłączania odświeżają ten rejestr po zmianie stanu pluginu.
Ten sam plik `plugins/installs.json` przechowuje trwałe metadane instalacji w
górnopoziomowym `installRecords` oraz odtwarzalne metadane manifestu w `plugins`. Jeśli
rejestru brakuje, jest nieaktualny albo nieprawidłowy, `openclaw plugins registry
--refresh` odbudowuje jego widok manifestu z rekordów instalacji, zasad konfiguracji oraz
metadanych manifestu/pakietu bez ładowania modułów środowiska uruchomieniowego pluginów.
`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z tagiem dist-tag albo dokładną wersją rozpoznaje nazwę pakietu
z powrotem do śledzonego rekordu pluginu i zapisuje nową specyfikację dla przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem na
domyślną linię wydań rejestru. Jeśli zainstalowany plugin npm już pasuje do
rozpoznanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.

`--pin` działa tylko z npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście dla fałszywych alarmów
z wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje pluginów
i aktualizacje pluginów mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad zasad pluginu `before_install` ani blokowania przy niepowodzeniu skanowania.
Skany instalacyjne ignorują typowe pliki i katalogi testowe, takie jak `tests/`,
`__tests__/`, `*.test.*` i `*.spec.*`, aby uniknąć blokowania spakowanych mocków testowych;
zadeklarowane punkty wejścia środowiska uruchomieniowego pluginu są nadal skanowane, nawet jeśli używają jednej z
tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills
obsługiwane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania
`dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje oddzielnym przepływem
pobierania/instalacji Skills z ClawHub.

Jeśli plugin opublikowany przez ciebie w ClawHub jest ukryty albo zablokowany przez skan, otwórz
panel ClawHub albo uruchom `clawhub package rescan <name>`, aby poprosić ClawHub o ponowne
sprawdzenie. `--dangerously-force-unsafe-install` wpływa tylko na instalacje na twojej własnej
maszynie; nie prosi ClawHub o ponowne skanowanie pluginu ani o upublicznienie zablokowanego wydania.

Zgodne pakiety uczestniczą w tym samym przepływie list/inspekcji/włączania/wyłączania pluginów.
Bieżąca obsługa środowiska uruchomieniowego obejmuje pakietowe Skills, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` oraz zadeklarowane w manifeście
`lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` zgłasza też wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na pakietach.

Źródłami marketplace mogą być znana nazwa marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace albo ścieżka
`marketplace.json`, skrót GitHub taki jak `owner/repo`, adres URL repozytorium GitHub
albo adres URL git. W przypadku zdalnych marketplace wpisy pluginów muszą pozostać wewnątrz
sklonowanego repozytorium marketplace i używać wyłącznie względnych źródeł ścieżek.

Zobacz [dokumentację CLI `openclaw plugins`](/pl/cli/plugins), aby poznać pełne szczegóły.

## Przegląd API pluginów

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
publiczny kontrakt.

`api.registrationMode` informuje plugin, dlaczego jego punkt wejścia jest ładowany:

| Tryb            | Znaczenie                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja środowiska uruchomieniowego. Rejestruje narzędzia, haki, usługi, polecenia, trasy i inne aktywne efekty uboczne.          |
| `discovery`     | Odkrywanie możliwości tylko do odczytu. Rejestruje dostawców i metadane; zaufany kod wejściowy pluginu może zostać załadowany, ale aktywne efekty uboczne są pomijane. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekkie wejście konfiguracji.                                                         |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga także wejścia środowiska uruchomieniowego.                                              |
| `cli-metadata`  | Tylko zbieranie metadanych poleceń CLI.                                                                                             |

Wpisy pluginów, które otwierają gniazda, bazy danych, procesy robocze w tle lub długotrwałe
klienty, powinny chronić te efekty uboczne warunkiem `api.registrationMode === "full"`.
Ładowania odkrywania są buforowane oddzielnie od ładowań aktywujących i nie zastępują
działającego rejestru Gateway. Odkrywanie nie aktywuje, ale nie oznacza braku importów:
OpenClaw może wykonać zaufany wpis pluginu lub moduł pluginu kanału, aby zbudować
migawkę. Utrzymuj najwyższe poziomy modułów jako lekkie i wolne od efektów ubocznych, a
klientów sieciowych, podprocesy, nasłuchiwacze, odczyty poświadczeń i uruchamianie usług
przenieś za ścieżki pełnego środowiska uruchomieniowego.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje                |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Dostawca modelu (LLM)        |
| `registerChannel`                       | Kanał czatu                  |
| `registerTool`                          | Narzędzie agenta             |
| `registerHook` / `on(...)`              | Haki cyklu życia             |
| `registerSpeechProvider`                | Tekst na mowę / STT          |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT             |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos w czasie rzeczywistym |
| `registerMediaUnderstandingProvider`    | Analiza obrazów/audio        |
| `registerImageGenerationProvider`       | Generowanie obrazów          |
| `registerMusicGenerationProvider`       | Generowanie muzyki           |
| `registerVideoGenerationProvider`       | Generowanie wideo            |
| `registerWebFetchProvider`              | Dostawca pobierania / scrapingu WWW |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci         |
| `registerHttpRoute`                     | Punkt końcowy HTTP           |
| `registerCommand` / `registerCli`       | Polecenia CLI                |
| `registerContextEngine`                 | Silnik kontekstu             |
| `registerService`                       | Usługa w tle                 |

Zachowanie osłon haków dla typowanych haków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; procedury obsługi o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; procedury obsługi o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; procedury obsługi o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie usuwa wcześniejszego anulowania.

Natywny serwer aplikacji Codex przekazuje natywne zdarzenia narzędzi Codex z powrotem do tej
powierzchni haków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`,
obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzaniu Codex
`PermissionRequest`. Most nie przepisuje jeszcze argumentów natywnych narzędzi Codex.
Dokładna granica obsługi środowiska uruchomieniowego Codex znajduje się w
[kontrakcie obsługi Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne zachowanie typowanych haków opisuje [omówienie SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) — utwórz własny plugin
- [Pakiety pluginów](/pl/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Manifest pluginu](/pl/plugins/manifest) — schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) — dodaj narzędzia agenta w pluginie
- [Wewnętrzna architektura pluginów](/pl/plugins/architecture) — model możliwości i potok ładowania
- [Pluginy społecznościowe](/pl/plugins/community) — listy zewnętrznych pluginów
