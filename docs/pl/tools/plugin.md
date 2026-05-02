---
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Zrozumienie reguł wykrywania i ładowania Plugin
    - Praca z pakietami pluginów zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie Pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-02T20:59:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
środowiska obsługi agentów, narzędzia, Skills, mowę, transkrypcję w czasie
rzeczywistym, głos w czasie rzeczywistym, rozumienie mediów, generowanie
obrazów, generowanie wideo, pobieranie stron z sieci, wyszukiwanie w sieci i
więcej. Niektóre pluginy są **rdzeniowe** (dostarczane z OpenClaw), inne są
**zewnętrzne**. Większość zewnętrznych pluginów jest publikowana i odkrywana za
pośrednictwem [ClawHub](/pl/tools/clawhub). Npm pozostaje obsługiwany dla instalacji
bezpośrednich oraz dla tymczasowego zestawu pakietów pluginów należących do
OpenClaw do czasu zakończenia tej migracji.

## Szybki start

Przykłady instalowania metodą kopiuj-wklej, wyświetlania listy, odinstalowywania,
aktualizowania i publikowania znajdziesz w sekcji
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

    Następnie skonfiguruj pod `plugins.entries.\<id\>.config` w pliku
    konfiguracyjnym.

  </Step>

  <Step title="Zarządzanie natywne dla czatu">
    W działającym Gateway polecenia tylko dla właściciela `/plugins enable` i
    `/plugins disable` uruchamiają ponowne ładowanie konfiguracji Gateway. Gateway
    przeładowuje powierzchnie uruchomieniowe pluginów w procesie, a nowe tury
    agentów budują swoją listę narzędzi z odświeżonego rejestru. `/plugins install`
    zmienia kod źródłowy pluginu, więc Gateway żąda ponownego uruchomienia zamiast
    udawać, że bieżący proces może bezpiecznie przeładować już zaimportowane
    moduły.

  </Step>

  <Step title="Zweryfikuj plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Użyj `--runtime`, gdy trzeba potwierdzić zarejestrowane narzędzia, usługi,
    metody Gateway, hooki lub polecenia CLI należące do pluginu. Zwykłe `inspect`
    jest zimnym sprawdzeniem manifestu/rejestru i celowo unika importowania
    środowiska uruchomieniowego pluginu.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Ścieżka instalacji używa tego samego resolvera co CLI: lokalna ścieżka/archiwum,
jawne `clawhub:<pkg>`, jawne `npm:<pkg>`, jawne `git:<repo>` albo nieprefiksowana
specyfikacja pakietu przez npm.

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się zamknięciem
bez zmian i wskazuje `openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest
wąska ścieżka ponownej instalacji pluginu wbudowanego dla pluginów, które
włączają `openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja jednego pluginu jest
izolowana do tego pluginu: uruchamianie zapisuje w logach problem
`plugins.entries.<id>.config`, pomija ten plugin podczas ładowania i utrzymuje
pozostałe pluginy oraz kanały online. Uruchom `openclaw doctor --fix`, aby
poddać błędną konfigurację pluginu kwarantannie przez wyłączenie tego wpisu
pluginu i usunięcie jego nieprawidłowego ładunku konfiguracji; zwykła kopia
zapasowa konfiguracji zachowuje poprzednie wartości.
Gdy konfiguracja kanału odwołuje się do pluginu, którego nie można już odnaleźć,
ale ten sam nieaktualny identyfikator pluginu pozostaje w konfiguracji pluginów
lub rekordach instalacji, uruchamianie Gateway zapisuje ostrzeżenia i pomija ten
kanał zamiast blokować każdy inny kanał. Uruchom `openclaw doctor --fix`, aby
usunąć nieaktualne wpisy kanału/pluginu; nieznane klucze kanałów bez dowodu na
nieaktualny plugin nadal powodują błąd walidacji, aby literówki pozostały
widoczne.
Jeśli ustawiono `plugins.enabled: false`, nieaktualne odwołania do pluginów są
traktowane jako nieaktywne: uruchamianie Gateway pomija odkrywanie/ładowanie
pluginów, a `openclaw doctor` zachowuje wyłączoną konfigurację pluginów zamiast
automatycznie ją usuwać. Włącz pluginy ponownie przed uruchomieniem czyszczenia
przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory pluginów.

Instalacja zależności pluginu odbywa się tylko podczas jawnych przepływów
instalacji/aktualizacji lub naprawy przez doctor. Uruchamianie Gateway,
przeładowanie konfiguracji i inspekcja runtime nie uruchamiają menedżerów
pakietów ani nie naprawiają drzew zależności. Lokalne pluginy muszą już mieć
zainstalowane zależności, natomiast pluginy npm, git i ClawHub są instalowane w
zarządzanych katalogach głównych pluginów OpenClaw. Zależności npm mogą być
wyniesione w obrębie zarządzanego katalogu głównego npm OpenClaw; instalacja/
aktualizacja skanuje ten zarządzany katalog główny przed zaufaniem, a
odinstalowanie usuwa pakiety zarządzane przez npm za pośrednictwem npm.
Zewnętrzne pluginy i niestandardowe ścieżki ładowania nadal muszą być
instalowane przez `openclaw plugins install`. Użyj `openclaw plugins list --json`,
aby zobaczyć statyczny `dependencyStatus` dla każdego widocznego pluginu bez
importowania kodu runtime ani naprawiania zależności.
Zobacz [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution), aby
poznać cykl życia w czasie instalacji.

Checkouty źródłowe są obszarami roboczymi pnpm. Jeśli klonujesz OpenClaw, aby
pracować nad wbudowanymi pluginami, uruchom `pnpm install`; OpenClaw ładuje wtedy
wbudowane pluginy z `extensions/<id>`, więc edycje i lokalne zależności pakietu
są używane bezpośrednio. Zwykłe instalacje w katalogu głównym npm są przeznaczone
dla spakowanego OpenClaw, nie dla rozwoju checkoutu źródłowego.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format       | Jak działa                                                         | Przykłady                                               |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------- |
| **Natywny**  | `openclaw.plugin.json` + moduł runtime; wykonuje się w procesie    | Oficjalne pluginy, społecznościowe pakiety npm          |
| **Pakiet**   | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw   | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/`  |

Oba pojawiają się pod `openclaw plugins list`. Szczegóły pakietów znajdziesz w
sekcji [Pakiety pluginów](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Budowania pluginów](/pl/plugins/building-plugins)
i [Przeglądu Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety npm pluginów muszą deklarować `openclaw.extensions` w
`package.json`. Każdy wpis musi pozostać wewnątrz katalogu pakietu i wskazywać
czytelny plik runtime albo plik źródłowy TypeScript z wywnioskowanym zbudowanym
odpowiednikiem JavaScript, takim jak `src/index.ts` do `dist/index.js`.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki runtime nie znajdują
się w tych samych ścieżkach co wpisy źródłowe. Gdy `runtimeExtensions` jest
obecne, musi zawierać dokładnie jeden wpis dla każdego wpisu `extensions`.
Niedopasowane listy powodują błąd instalacji i odkrywania pluginów zamiast
cicho wracać do ścieżek źródłowych. Jeśli publikujesz także
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

ClawHub jest główną ścieżką dystrybucji dla większości pluginów. Bieżące
spakowane wydania OpenClaw już zawierają wiele oficjalnych pluginów, więc w
typowych konfiguracjach nie trzeba instalować ich osobno przez npm. Dopóki każdy
plugin należący do OpenClaw nie zostanie przeniesiony do ClawHub, OpenClaw nadal
wysyła niektóre pakiety pluginów `@openclaw/*` w npm dla starszych/
niestandardowych instalacji i bezpośrednich przepływów npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako przestarzały, ta wersja
pakietu pochodzi ze starszej zewnętrznej linii pakietów. Użyj wbudowanego pluginu
z bieżącego OpenClaw lub lokalnego checkoutu, dopóki nie zostanie opublikowany
nowszy pakiet npm.

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

### Rdzeniowe (dostarczane z OpenClaw)

<AccordionGroup>
  <Accordion title="Dostawcy modeli (domyślnie włączeni)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginy pamięci">
    - `memory-core` — wbudowane wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — pamięć długoterminowa oparta na LanceDB z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby poznać konfigurację
    osadzeń zgodnych z OpenAI, przykłady Ollama, limity przywoływania i
    rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Dostawcy mowy (domyślnie włączeni)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` — wbudowany plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska uruchomieniowego przeglądarki i domyślnej usługi sterowania przeglądarką (domyślnie włączony; wyłącz go przed zastąpieniem)
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
| `enabled`        | Przełącznik główny (domyślnie: `true`)                    |
| `allow`          | Lista dozwolonych pluginów (opcjonalnie)                  |
| `deny`           | Lista zabronionych pluginów (opcjonalnie; deny wygrywa)   |
| `load.paths`     | Dodatkowe pliki/katalogi pluginów                         |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki + konfiguracja dla poszczególnych pluginów   |

`plugins.allow` jest wyłączna. Gdy nie jest pusta, tylko wymienione pluginy mogą
się ładować lub udostępniać narzędzia, nawet jeśli `tools.allow` zawiera `"*"`
albo konkretną nazwę narzędzia należącego do pluginu. Jeśli lista dozwolonych
narzędzi odwołuje się do narzędzi pluginów, dodaj identyfikatory pluginów, które
są ich właścicielami, do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor`
ostrzega o takim kształcie.

Zmiany konfiguracji wprowadzone przez `/plugins enable` lub `/plugins disable` wyzwalają
przeładowanie Plugin Gateway w bieżącym procesie. Nowe tury agenta odbudowują swoją listę narzędzi z
odświeżonego rejestru pluginów. Operacje zmieniające źródła, takie jak instalacja,
aktualizacja i odinstalowanie, nadal restartują proces Gateway, ponieważ już zaimportowanych
modułów pluginów nie da się bezpiecznie zastąpić w miejscu.

`openclaw plugins list` to lokalny snapshot rejestru/konfiguracji pluginów.
Plugin oznaczony tam jako `enabled` oznacza, że utrwalony rejestr i bieżąca konfiguracja pozwalają
pluginowi uczestniczyć. Nie dowodzi to, że już działający zdalny Gateway
przeładował się lub zrestartował do tego samego kodu pluginu. W konfiguracjach VPS/kontenerowych
z procesami opakowującymi wysyłaj restarty lub zapisy wyzwalające przeładowanie do rzeczywistego
procesu `openclaw gateway run`, albo użyj `openclaw gateway restart` względem
działającego Gateway, gdy przeładowanie zgłasza błąd.

<Accordion title="Stany pluginu: wyłączony vs brakujący vs nieprawidłowy">
  - **Wyłączony**: plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowana.
  - **Brakujący**: konfiguracja odwołuje się do id pluginu, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchomienie Gateway pomija tylko ten plugin; `openclaw doctor --fix` może odizolować nieprawidłowy wpis przez jego wyłączenie i usunięcie jego ładunku konfiguracji.

</Accordion>

## Wykrywanie i pierwszeństwo

OpenClaw skanuje pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki plików lub katalogów. Ścieżki, które wskazują
    z powrotem na własne spakowane katalogi dołączonych pluginów OpenClaw, są ignorowane;
    uruchom `openclaw doctor --fix`, aby usunąć te nieaktualne aliasy.
  </Step>

  <Step title="Pluginy obszaru roboczego">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginy globalne">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dołączone pluginy">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Instalacje pakietowe i obrazy Docker zwykle rozwiązują dołączone pluginy z
skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy dołączonego pluginu jest
zamontowany przez bind mount nad pasującą spakowaną ścieżką źródłową, na przykład
`/app/extensions/synology-chat`, OpenClaw traktuje ten zamontowany katalog źródłowy
jako nakładkę źródeł dołączonego pluginu i wykrywa go przed spakowanym pakietem
`/app/dist/extensions/synology-chat`. Dzięki temu pętle kontenerowe maintainerów
działają bez przełączania każdego dołączonego pluginu z powrotem na źródła TypeScript.
Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane pakiety dist
nawet wtedy, gdy obecne są montowania nakładek źródeł.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie pluginy i pomija wykrywanie/ładowanie pluginów
- `plugins.deny` zawsze ma pierwszeństwo przed allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone pluginy stosują wbudowany zestaw domyślnie włączonych, chyba że zostanie to nadpisane
- Wyłączne sloty mogą wymusić włączenie pluginu wybranego dla danego slotu
- Niektóre dołączone pluginy opt-in są włączane automatycznie, gdy konfiguracja wskazuje
  powierzchnię należącą do pluginu, taką jak odwołanie do modelu dostawcy, konfiguracja kanału lub środowisko uruchomieniowe harness
- Nieaktualna konfiguracja pluginów jest zachowywana, gdy aktywne jest `plugins.enabled: false`;
  włącz ponownie pluginy przed uruchomieniem czyszczenia przez doctor, jeśli chcesz usunąć nieaktualne id
- Trasy OpenAI-family Codex zachowują oddzielne granice pluginów:
  `openai-codex/*` należy do pluginu OpenAI, natomiast dołączony plugin serwera aplikacji Codex
  jest wybierany przez `agentRuntime.id: "codex"` lub starsze odwołania do modeli
  `codex/*`

## Rozwiązywanie problemów z hookami runtime

Jeśli plugin pojawia się w `plugins list`, ale efekty uboczne `register(api)` lub hooki
nie uruchamiają się w ruchu czatu na żywo, najpierw sprawdź te rzeczy:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  URL Gateway, profil, ścieżka konfiguracji i proces to te, które edytujesz.
- Zrestartuj działający Gateway po zmianach instalacji/konfiguracji/kodu pluginu. W kontenerach
  opakowujących PID 1 może być tylko supervisorem; zrestartuj lub zasygnalizuj proces potomny
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Niedostarczone hooki konwersacji, takie jak `llm_input`,
  `llm_output`, `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Uruchamia się przed rozwiązaniem modelu
  dla tur agenta; `llm_output` uruchamia się dopiero po tym, jak próba modelu
  wytworzy odpowiedź asystenta.
- Jako dowód efektywnego modelu sesji użyj `openclaw sessions` lub
  powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Wolne przygotowanie narzędzi pluginu

Jeśli tury agenta wydają się zatrzymywać podczas przygotowywania narzędzi, włącz logowanie śledzenia i
sprawdź linie czasu fabryk narzędzi pluginów:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie zawiera łączny czas fabryk i najwolniejsze fabryki narzędzi pluginów,
w tym id pluginu, zadeklarowane nazwy narzędzi, kształt wyniku oraz informację, czy narzędzie jest
opcjonalne. Wolne linie są promowane do ostrzeżeń, gdy pojedyncza fabryka zajmuje
co najmniej 1 s lub łączne przygotowanie fabryk narzędzi pluginów zajmuje co najmniej 5 s.

OpenClaw buforuje udane wyniki fabryk narzędzi pluginów dla powtarzanych rozwiązań
z tym samym efektywnym kontekstem żądania. Klucz pamięci podręcznej obejmuje efektywną
konfigurację runtime, obszar roboczy, id agenta/sesji, politykę sandboxa, ustawienia przeglądarki,
kontekst dostarczenia, tożsamość requester oraz stan własności, więc fabryki, które
zależą od tych zaufanych pól, są uruchamiane ponownie, gdy kontekst się zmieni.

Jeśli jeden plugin dominuje czasowo, sprawdź jego rejestracje runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, zainstaluj ponownie lub wyłącz ten plugin. Autorzy pluginów powinni przenieść
kosztowne ładowanie zależności za ścieżkę wykonania narzędzia zamiast robić to
wewnątrz fabryki narzędzia.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznacza to, że więcej niż jeden włączony plugin próbuje posiadać ten sam kanał,
przepływ konfiguracji lub nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny plugin kanału
zainstalowany obok dołączonego pluginu, który teraz zapewnia to samo id kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony plugin
  i jego pochodzenie.
- Uruchom `openclaw plugins inspect <id> --runtime --json` dla każdego podejrzanego pluginu i
  porównaj `channels`, `channelConfigs`, `tools` oraz diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po instalacji lub usunięciu
  pakietów pluginów, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Zrestartuj Gateway po zmianach instalacji, rejestru lub konfiguracji.

Opcje naprawy:

- Jeśli jeden plugin celowo zastępuje inny dla tego samego id kanału, preferowany
  plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver` z
  id pluginu o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę za pomocą
  `plugins.entries.<plugin-id>.enabled: false` lub usuń nieaktualną instalację
  pluginu.
- Jeśli jawnie włączono oba pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do pluginu,
  aby powierzchnia runtime była jednoznaczna.

## Sloty pluginów (kategorie wyłączne)

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

| Slot            | Co kontroluje           | Domyślnie           |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Plugin Active memory    | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

## Odwołanie CLI

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

Dołączone pluginy są dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład
dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony plugin przeglądarki).
Inne dołączone pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub pakiet hooków w miejscu. Używaj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych pluginów npm.
Nie jest obsługiwane z `--link`, które ponownie używa ścieżki źródłowej zamiast
kopiować do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
id zainstalowanego pluginu do tej listy allow przed jego włączeniem. Jeśli to samo id pluginu
jest obecne w `plugins.deny`, instalacja usuwa ten nieaktualny wpis deny, aby
jawna instalacja była możliwa do załadowania natychmiast po restarcie.

OpenClaw utrzymuje trwały lokalny rejestr Plugin jako zimny model odczytu dla
inwentarza pluginów, własności wkładów i planowania uruchamiania. Przepływy
instalowania, aktualizowania, odinstalowywania, włączania i wyłączania odświeżają
ten rejestr po zmianie stanu pluginu. Ten sam plik `plugins/installs.json`
przechowuje trwałe metadane instalacji w najwyższego poziomu `installRecords`
oraz możliwe do odbudowania metadane manifestu w `plugins`. Jeśli rejestru
brakuje, jest nieaktualny albo nieprawidłowy, `openclaw plugins registry
--refresh` odbudowuje jego widok manifestów z rekordów instalacji, zasad
konfiguracji oraz metadanych manifestu/pakietu, bez ładowania modułów runtime
pluginu.
`openclaw plugins update <id-or-npm-spec>` stosuje się do śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag albo dokładną wersją rozwiązuje nazwę pakietu
z powrotem do śledzonego rekordu pluginu i zapisuje nową specyfikację na potrzeby
przyszłych aktualizacji. Przekazanie nazwy pakietu bez wersji przenosi dokładnie
przypiętą instalację z powrotem na domyślną linię wydania rejestru. Jeśli
zainstalowany plugin npm już odpowiada rozwiązanej wersji i zapisanej tożsamości
artefaktu, OpenClaw pomija aktualizację bez pobierania, ponownej instalacji ani
przepisywania konfiguracji.
Gdy `openclaw update` działa na kanale beta, rekordy pluginów npm i ClawHub z
domyślnej linii najpierw próbują `@beta`, a gdy nie istnieje wydanie beta pluginu,
wracają do default/latest. Dokładne wersje i jawne tagi pozostają przypięte.

`--pin` działa tylko dla npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście fałszywych alarmów
wbudowanego skanera niebezpiecznego kodu. Pozwala instalacjom i aktualizacjom
pluginów przejść dalej mimo wbudowanych ustaleń `critical`, ale nadal nie omija
blokad zasad `before_install` pluginu ani blokowania po niepowodzeniu skanowania.
Skany instalacji ignorują typowe pliki i katalogi testowe, takie jak `tests/`,
`__tests__/`, `*.test.*` i `*.spec.*`, aby uniknąć blokowania spakowanych mocków
testowych; zadeklarowane punkty wejścia runtime pluginu nadal są skanowane, nawet
jeśli używają jednej z tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów. Instalacje
zależności Skills obsługiwane przez Gateway używają zamiast tego odpowiadającego
nadpisania żądania `dangerouslyForceUnsafeInstall`, a `openclaw skills install`
pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Jeśli plugin opublikowany przez Ciebie w ClawHub jest ukryty albo zablokowany
przez skan, otwórz panel ClawHub albo uruchom `clawhub package rescan <name>`,
aby poprosić ClawHub o ponowne sprawdzenie. `--dangerously-force-unsafe-install`
wpływa tylko na instalacje na Twojej własnej maszynie; nie prosi ClawHub o ponowne
skanowanie pluginu ani nie upublicznia zablokowanego wydania.

Zgodne pakiety uczestniczą w tym samym przepływie listy/inspekcji/włączania/wyłączania
pluginów. Bieżąca obsługa runtime obejmuje Skills z pakietów, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json`
i zadeklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne
katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje też wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na
pakietach.

Źródła marketplace mogą być znaną nazwą marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalnym katalogiem głównym marketplace
albo ścieżką `marketplace.json`, skrótem GitHub w rodzaju `owner/repo`, adresem URL
repozytorium GitHub albo adresem URL git. W przypadku zdalnych marketplace wpisy
pluginów muszą pozostawać wewnątrz sklonowanego repozytorium marketplace i używać
wyłącznie względnych źródeł ścieżek.

Pełne szczegóły znajdziesz w [referencji CLI `openclaw plugins`](/pl/cli/plugins).

## Omówienie API Plugin

Natywne pluginy eksportują obiekt wejścia, który udostępnia `register(api)`. Starsze
pluginy mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe pluginy
powinny używać `register`.

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
pluginu. Loader nadal cofa się do `activate(api)` dla starszych pluginów, ale
wbudowane pluginy i nowe zewnętrzne pluginy powinny traktować `register` jako
publiczny kontrakt.

`api.registrationMode` mówi pluginowi, dlaczego jego wejście jest ładowane:

| Tryb            | Znaczenie                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja runtime. Rejestruje narzędzia, hooki, usługi, polecenia, trasy i inne aktywne efekty uboczne.                              |
| `discovery`     | Tylko do odczytu odkrywanie możliwości. Rejestruje providerów i metadane; zaufany kod wejścia pluginu może zostać załadowany, ale pomija aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekkie wejście konfiguracji.                                                                |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga także wejścia runtime.                                                                         |
| `cli-metadata`  | Wyłącznie zbieranie metadanych poleceń CLI.                                                                                            |

Wejścia pluginów, które otwierają gniazda, bazy danych, pracowników w tle albo
długotrwałych klientów, powinny chronić te efekty uboczne warunkiem
`api.registrationMode === "full"`. Ładowania odkrywania są cache'owane osobno od
ładowań aktywujących i nie zastępują działającego rejestru Gateway. Odkrywanie
nie aktywuje, ale nie jest wolne od importów: OpenClaw może wykonać zaufane
wejście pluginu albo moduł pluginu kanału, aby zbudować migawkę. Utrzymuj najwyższe
poziomy modułów lekkie i wolne od efektów ubocznych, a klientów sieciowych,
podprocesy, listenery, odczyty poświadczeń i uruchamianie usług przenieś za
ścieżki pełnego runtime.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider modelu (LLM)        |
| `registerChannel`                       | Kanał czatu                |
| `registerTool`                          | Narzędzie agenta                  |
| `registerHook` / `on(...)`              | Hooki cyklu życia             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT               |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos czasu rzeczywistego       |
| `registerMediaUnderstandingProvider`    | Analiza obrazów/audio        |
| `registerImageGenerationProvider`       | Generowanie obrazów            |
| `registerMusicGenerationProvider`       | Generowanie muzyki            |
| `registerVideoGenerationProvider`       | Generowanie wideo            |
| `registerWebFetchProvider`              | Provider pobierania/scrapowania z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Polecenia CLI                |
| `registerContextEngine`                 | Silnik kontekstu              |
| `registerService`                       | Usługa w tle          |

Zachowanie strażników hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` jest operacją no-op i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` jest operacją no-op i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` jest operacją no-op i nie usuwa wcześniejszego anulowania.

Natywny app-server Codex przekazuje zdarzenia natywnych narzędzi Codex z powrotem
do tej powierzchni hooków. Pluginy mogą blokować natywne narzędzia Codex przez
`before_tool_call`, obserwować wyniki przez `after_tool_call` i uczestniczyć w
zatwierdzeniach Codex `PermissionRequest`. Most nie przepisuje jeszcze argumentów
natywnych narzędzi Codex. Dokładna granica obsługi runtime Codex znajduje się w
[kontrakcie obsługi Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne zachowanie typowanych hooków opisuje [omówienie SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) — utwórz własny plugin
- [Pakiety pluginów](/pl/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Manifest Plugin](/pl/plugins/manifest) — schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) — dodaj narzędzia agenta w pluginie
- [Wewnętrzna architektura pluginów](/pl/plugins/architecture) — model możliwości i potok ładowania
- [Pluginy społeczności](/pl/plugins/community) — listy stron trzecich
