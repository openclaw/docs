---
read_when:
    - Instalowanie lub konfigurowanie Pluginów
    - Zrozumienie reguł wykrywania i ładowania Pluginów
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-12T08:47:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
środowiska agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym,
rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci
i nie tylko. Niektóre pluginy są **core** (dostarczane z OpenClaw), inne
są **zewnętrzne**. Większość zewnętrznych pluginów jest publikowana i odkrywana przez
[ClawHub](/pl/clawhub). Npm pozostaje obsługiwane do bezpośrednich instalacji oraz dla
tymczasowego zestawu pakietów pluginów należących do OpenClaw, dopóki ta migracja się nie zakończy.

## Szybki start

Przykłady instalacji, wyświetlania listy, odinstalowywania, aktualizacji i publikowania do skopiowania znajdziesz w
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
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

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

    Następnie skonfiguruj w `plugins.entries.\<id\>.config` w pliku konfiguracji.

  </Step>

  <Step title="Zarządzanie natywne dla czatu">
    W działającym Gateway polecenia tylko dla właściciela `/plugins enable` i `/plugins disable`
    uruchamiają ponowne ładowanie konfiguracji Gateway. Gateway przeładowuje powierzchnie uruchomieniowe pluginów
    w procesie, a nowe tury agentów odbudowują listę narzędzi z odświeżonego
    rejestru. `/plugins install` zmienia kod źródłowy pluginu, więc
    Gateway żąda ponownego uruchomienia zamiast udawać, że bieżący proces może
    bezpiecznie przeładować już zaimportowane moduły.

  </Step>

  <Step title="Zweryfikuj plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Użyj `--runtime`, gdy musisz potwierdzić zarejestrowane narzędzia, usługi, metody gateway,
    hooki lub polecenia CLI należące do pluginu. Zwykłe `inspect` jest zimnym
    sprawdzeniem manifestu/rejestru i celowo unika importowania środowiska uruchomieniowego pluginu.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Ścieżka instalacji używa tego samego resolvera co CLI: lokalna ścieżka/archiwum, jawne
`clawhub:<pkg>`, jawne `npm:<pkg>`, jawne `npm-pack:<path.tgz>`,
jawne `git:<repo>` albo zwykła specyfikacja pakietu przez npm.

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się w trybie fail-closed i wskazuje
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka ponownej instalacji
bundlowanego pluginu dla pluginów, które włączają
`openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja pluginu kończy się w trybie fail-closed jak każda inna nieprawidłowa
konfiguracja. Uruchom `openclaw doctor --fix`, aby poddać kwarantannie błędną konfigurację pluginu przez
wyłączenie tego wpisu pluginu i usunięcie jego nieprawidłowego ładunku konfiguracji; zwykła
kopia zapasowa konfiguracji zachowuje poprzednie wartości.
Gdy konfiguracja kanału odwołuje się do pluginu, którego nie da się już odkryć, ale
ten sam nieaktualny identyfikator pluginu pozostaje w konfiguracji pluginu lub rekordach instalacji, uruchamianie Gateway
zapisuje ostrzeżenia i pomija ten kanał zamiast blokować każdy inny kanał.
Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne wpisy kanału/pluginu; nieznane
klucze kanałów bez dowodów na nieaktualny plugin nadal nie przechodzą walidacji, aby literówki pozostały
widoczne.
Jeśli ustawiono `plugins.enabled: false`, nieaktualne odwołania do pluginów są traktowane jako bezczynne:
uruchamianie Gateway pomija odkrywanie/ładowanie pluginów, a `openclaw doctor` zachowuje
wyłączoną konfigurację pluginów zamiast usuwać ją automatycznie. Włącz ponownie pluginy przed
uruchomieniem czyszczenia przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory pluginów.

Instalacja zależności pluginów odbywa się tylko podczas jawnych przepływów instalacji/aktualizacji lub
naprawy przez doctor. Uruchamianie Gateway, przeładowanie konfiguracji i inspekcja środowiska uruchomieniowego
nie uruchamiają menedżerów pakietów ani nie naprawiają drzew zależności. Lokalne pluginy muszą już
mieć zainstalowane swoje zależności, natomiast pluginy npm, git i ClawHub są
instalowane w zarządzanych katalogach głównych pluginów OpenClaw. Zależności npm mogą być hoistowane
w zarządzanym katalogu głównym npm OpenClaw; instalacja/aktualizacja skanuje ten zarządzany katalog główny przed
zaufaniem, a odinstalowanie usuwa pakiety zarządzane przez npm przez npm. Zewnętrzne pluginy
i niestandardowe ścieżki ładowania nadal muszą być instalowane przez `openclaw plugins install`.
Użyj `openclaw plugins list --json`, aby zobaczyć statyczny `dependencyStatus` dla każdego
widocznego pluginu bez importowania kodu uruchomieniowego ani naprawiania zależności.
Zobacz [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution), aby poznać
cykl życia w czasie instalacji.

### Zablokowana własność ścieżki pluginu

Jeśli diagnostyka pluginu mówi
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
a walidacja konfiguracji następuje z `plugin present but blocked`, OpenClaw znalazł
pliki pluginu należące do innego użytkownika Unix niż proces, który je ładuje.
Pozostaw konfigurację pluginu na miejscu; napraw własność w systemie plików albo uruchom
OpenClaw jako ten sam użytkownik, do którego należy katalog stanu.

W przypadku instalacji Docker oficjalny obraz działa jako `node` (uid `1000`), więc
hostowe katalogi konfiguracji i przestrzeni roboczej OpenClaw montowane przez bind powinny zwykle
należeć do uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jeśli celowo uruchamiasz OpenClaw jako root, napraw zarządzany katalog główny pluginów tak, aby
należał do root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Po naprawieniu własności uruchom ponownie `openclaw doctor --fix` albo
`openclaw plugins registry --refresh`, aby utrwalony rejestr pluginów odpowiadał
naprawionym plikom.

W przypadku instalacji npm zmienne selektory, takie jak `latest` lub dist-tag, są rozwiązywane
przed instalacją, a potem przypinane do dokładnej zweryfikowanej wersji w zarządzanym
katalogu głównym npm OpenClaw. Po zakończeniu działania npm OpenClaw weryfikuje, czy zainstalowany
wpis `package-lock.json` nadal pasuje do rozwiązanej wersji i integralności. Jeśli
npm zapisze inne metadane pakietu, instalacja kończy się niepowodzeniem, a zarządzany pakiet
jest wycofywany zamiast zaakceptować inny artefakt pluginu.
Zarządzane katalogi główne npm dziedziczą także pakietowe `overrides` npm OpenClaw, więc
przypięcia bezpieczeństwa chroniące spakowanego hosta mają też zastosowanie do hoistowanych zewnętrznych
zależności pluginów.

Checkouty źródłowe są obszarami roboczymi pnpm. Jeśli klonujesz OpenClaw, aby pracować nad bundlowanymi
pluginami, uruchom `pnpm install`; OpenClaw ładuje wtedy bundlowane pluginy z
`extensions/<id>`, więc edycje i zależności lokalne dla pakietu są używane bezpośrednio.
Zwykłe instalacje główne npm są przeznaczone dla spakowanego OpenClaw, a nie dla rozwoju
z checkoutu źródłowego.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format       | Jak działa                                                         | Przykłady                                               |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------- |
| **Natywny**  | `openclaw.plugin.json` + moduł uruchomieniowy; wykonuje się w procesie | Oficjalne pluginy, społecznościowe pakiety npm          |
| **Bundle**   | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw   | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/`  |

Oba pojawiają się w `openclaw plugins list`. Szczegóły dotyczące bundle znajdziesz w [Bundle pluginów](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Budowania pluginów](/pl/plugins/building-plugins)
i [Przeglądu Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety npm pluginów muszą deklarować `openclaw.extensions` w `package.json`.
Każdy wpis musi pozostać w katalogu pakietu i rozwiązywać się do czytelnego
pliku uruchomieniowego albo do pliku źródłowego TypeScript z wywnioskowanym zbudowanym odpowiednikiem JavaScript,
takim jak `src/index.ts` do `dist/index.js`.
Spakowane instalacje muszą dostarczać ten wynik uruchomieniowy JavaScript. Awaryjne użycie źródła
TypeScript jest przeznaczone dla checkoutów źródłowych i lokalnych ścieżek deweloperskich, a nie dla
pakietów npm instalowanych w zarządzanym katalogu głównym pluginów OpenClaw.

Nieśledzone katalogi umieszczone w globalnym katalogu głównym rozszerzeń są traktowane jako
lokalne checkouty źródłowe i mogą bezpośrednio ładować wpisy TypeScript. Katalogi
nadal wskazane przez rekord instalacji, w tym `installPath` lub `sourcePath`, pozostają
zarządzane i utrzymują wymóg skompilowanego wyjścia nawet wtedy, gdy globalne skanowanie je widzi.
Jeśli celowo konwertujesz zarządzaną instalację w nieśledzony lokalny
checkout, najpierw usuń nieaktualny rekord instalacji przez odinstalowanie lub czyszczenie doctor.

Jeśli ostrzeżenie zarządzanego pakietu mówi, że `requires compiled runtime output for
TypeScript entry ...`, pakiet został opublikowany bez plików JavaScript,
których OpenClaw potrzebuje w czasie uruchomienia. To problem pakowania pluginu, a nie lokalnej konfiguracji.
Zaktualizuj albo zainstaluj ponownie plugin po ponownym opublikowaniu skompilowanego
JavaScript przez wydawcę albo wyłącz/odinstaluj ten plugin, dopóki poprawiony pakiet nie będzie dostępny.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki uruchomieniowe nie znajdują się w
tych samych ścieżkach co wpisy źródłowe. Gdy `runtimeExtensions` jest obecne, musi zawierać
dokładnie jeden wpis dla każdego wpisu `extensions`. Niedopasowane listy powodują niepowodzenie instalacji i
odkrywania pluginów zamiast cichego powrotu do ścieżek źródłowych. Jeśli publikujesz też
`openclaw.setupEntry`, użyj `openclaw.runtimeSetupEntry` dla jego zbudowanego
odpowiednika JavaScript; ten plik jest wymagany, gdy został zadeklarowany.

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
wydania OpenClaw już zawierają wiele oficjalnych pluginów, więc zwykle nie wymagają one
oddzielnych instalacji npm w standardowych konfiguracjach. Dopóki każdy plugin należący do OpenClaw nie
zmigruje do ClawHub, OpenClaw nadal publikuje niektóre pakiety pluginów `@openclaw/*` w
npm dla starszych/niestandardowych instalacji i bezpośrednich przepływów npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako przestarzały, ta wersja pakietu
pochodzi ze starszej zewnętrznej serii pakietów. Użyj bundlowanego pluginu z
obecnego OpenClaw albo lokalnego checkoutu, dopóki nowszy pakiet npm nie zostanie opublikowany.

| Plugin          | Pakiet                     | Dokumentacja                              |
| --------------- | -------------------------- | ----------------------------------------- |
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

### Core (dostarczane z OpenClaw)

<AccordionGroup>
  <Accordion title="Dostawcy modeli (domyślnie włączeni)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginy pamięci">
    - `memory-core` - wbudowane wyszukiwanie w pamięci (domyślne przez `plugins.slots.memory`)
    - `memory-lancedb` - pamięć długoterminowa oparta na LanceDB z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby skonfigurować osadzanie zgodne z OpenAI,
    przykłady Ollama, limity przywoływania i rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Dostawcy mowy (domyślnie włączeni)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` - wbudowany plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody gateway `browser.request`, środowiska uruchomieniowego przeglądarki i domyślnej usługi sterowania przeglądarką (domyślnie włączony; wyłącz go przed zastąpieniem)
    - `copilot-proxy` - most VS Code Copilot Proxy (domyślnie wyłączony)

  </Accordion>
</AccordionGroup>

Szukasz pluginów innych firm? Zobacz [ClawHub](/pl/clawhub).

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

| Pole               | Opis                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Główny przełącznik (domyślnie: `true`)                    |
| `allow`            | Lista dozwolonych pluginów (opcjonalna)                   |
| `bundledDiscovery` | Tryb wykrywania wbudowanych pluginów (domyślnie `allowlist`) |
| `deny`             | Lista zabronionych pluginów (opcjonalna; odmowa ma pierwszeństwo) |
| `load.paths`       | Dodatkowe pliki/katalogi pluginów                         |
| `slots`            | Wyłączne selektory slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Przełączniki i konfiguracja dla poszczególnych pluginów   |

`plugins.allow` jest wyłączne. Gdy nie jest puste, tylko wymienione pluginy mogą być ładowane
lub udostępniać narzędzia, nawet jeśli `tools.allow` zawiera `"*"` albo konkretną nazwę
narzędzia należącego do pluginu. Jeśli lista dozwolonych narzędzi odwołuje się do narzędzi pluginu, dodaj identyfikatory
właścicielskich pluginów do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor` ostrzega o takim
kształcie konfiguracji.

`plugins.bundledDiscovery` domyślnie ma wartość `"allowlist"` dla nowych konfiguracji, więc
restrykcyjna lista `plugins.allow` blokuje też pominięte wbudowane pluginy dostawców,
w tym wykrywanie dostawcy wyszukiwania w sieci w czasie działania. Doctor oznacza starsze
restrykcyjne konfiguracje listy dozwolonych wartością `"compat"` podczas migracji, aby aktualizacje zachowały
starsze zachowanie wbudowanych dostawców, dopóki operator nie wybierze bardziej restrykcyjnego trybu.
Puste `plugins.allow` nadal jest traktowane jako nieustawione/otwarte.

Zmiany konfiguracji wykonane przez `/plugins enable` lub `/plugins disable` wyzwalają
przeładowanie pluginów Gateway w ramach tego samego procesu. Nowe tury agenta odbudowują listę narzędzi z
odświeżonego rejestru pluginów. Operacje zmieniające źródła, takie jak instalacja,
aktualizacja i odinstalowanie, nadal restartują proces Gateway, ponieważ już zaimportowanych
modułów pluginów nie da się bezpiecznie zastąpić w miejscu.

`openclaw plugins list` to lokalna migawka rejestru/konfiguracji pluginów. Plugin
`enabled` oznacza tam, że utrwalony rejestr i bieżąca konfiguracja pozwalają
pluginowi uczestniczyć. Nie dowodzi to, że już działający zdalny Gateway
przeładował się lub zrestartował z tym samym kodem pluginu. W konfiguracjach VPS/kontenerowych
z procesami opakowującymi wysyłaj restarty lub zapisy wyzwalające przeładowanie do właściwego
procesu `openclaw gateway run` albo użyj `openclaw gateway restart` wobec
działającego Gateway, gdy przeładowanie zgłosi błąd.

<Accordion title="Stany pluginów: wyłączony, brakujący i nieprawidłowy">
  - **Wyłączony**: plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowywana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora pluginu, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchamianie Gateway pomija tylko ten plugin; `openclaw doctor --fix` może poddać nieprawidłowy wpis kwarantannie przez wyłączenie go i usunięcie jego ładunku konfiguracji.

</Accordion>

## Wykrywanie i kolejność pierwszeństwa

OpenClaw skanuje pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` - jawne ścieżki do plików lub katalogów. Ścieżki wskazujące
    z powrotem na własne spakowane katalogi wbudowanych pluginów OpenClaw są ignorowane;
    uruchom `openclaw doctor --fix`, aby usunąć te nieaktualne aliasy.
  </Step>

  <Step title="Pluginy obszaru roboczego">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginy globalne">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Wbudowane pluginy">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Instalacje pakietowe i obrazy Docker zwykle rozwiązują wbudowane pluginy z
skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy wbudowanego pluginu jest
zamontowany przez bind mount nad odpowiadającą mu spakowaną ścieżką źródłową, na przykład
`/app/extensions/synology-chat`, OpenClaw traktuje ten zamontowany katalog źródłowy
jako nakładkę źródłową wbudowanego pluginu i wykrywa go przed spakowanym
pakietem `/app/dist/extensions/synology-chat`. Dzięki temu pętle kontenerowe maintainerów
działają bez przełączania każdego wbudowanego pluginu z powrotem na źródła TypeScript.
Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane pakiety dist
nawet wtedy, gdy obecne są montowania nakładek źródłowych.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie pluginy i pomija wykrywanie/ładowanie pluginów
- `plugins.deny` zawsze ma pierwszeństwo przed listą dozwolonych
- `plugins.entries.\<id\>.enabled: false` wyłącza ten plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą być jawnie włączone)
- Wbudowane pluginy korzystają z wbudowanego zestawu domyślnie włączonych, chyba że zostanie to nadpisane
- Wyłączne sloty mogą wymusić włączenie wybranego pluginu dla danego slotu
- Niektóre wbudowane pluginy opcjonalne są włączane automatycznie, gdy konfiguracja nazywa
  powierzchnię należącą do pluginu, taką jak referencja modelu dostawcy, konfiguracja kanału lub środowisko
  uruchomieniowe harness
- Nieaktualna konfiguracja pluginu jest zachowywana, gdy `plugins.enabled: false` jest aktywne;
  włącz ponownie pluginy przed uruchomieniem czyszczenia przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy OpenAI-family Codex zachowują oddzielne granice pluginów:
  `openai-codex/*` należy do pluginu OpenAI, natomiast wbudowany plugin serwera aplikacji Codex
  jest wybierany przez kanoniczne referencje agenta `openai/*`, jawne
  `agentRuntime.id: "codex"` dostawcy/modelu albo starsze referencje modeli `codex/*`

## Rozwiązywanie problemów z hookami środowiska uruchomieniowego

Jeśli plugin pojawia się w `plugins list`, ale efekty uboczne `register(api)` lub hooki
nie uruchamiają się w ruchu czatu na żywo, sprawdź najpierw te elementy:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Zrestartuj działający Gateway po zmianach instalacji/konfiguracji/kodu pluginu. W kontenerach
  opakowujących PID 1 może być tylko nadzorcą; zrestartuj albo zasygnalizuj proces potomny
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Niewbudowane hooki konwersacji, takie jak `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Uruchamia się przed
  rozwiązywaniem modelu dla tur agenta; `llm_output` uruchamia się dopiero po tym, jak próba modelu
  wygeneruje odpowiedź asystenta.
- Aby udowodnić skuteczny model sesji, użyj `openclaw sessions` albo
  powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Powolne przygotowywanie narzędzi pluginu

Jeśli tury agenta wyglądają na zablokowane podczas przygotowywania narzędzi, włącz logowanie trace i
sprawdź wiersze czasu fabryk narzędzi pluginów:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie wyświetla łączny czas fabryk i najwolniejsze fabryki narzędzi pluginów,
w tym identyfikator pluginu, zadeklarowane nazwy narzędzi, kształt wyniku oraz to, czy narzędzie jest
opcjonalne. Wolne wiersze są promowane do ostrzeżeń, gdy pojedyncza fabryka trwa
co najmniej 1 s albo łączne przygotowanie fabryk narzędzi pluginów trwa co najmniej 5 s.

OpenClaw buforuje pomyślne wyniki fabryk narzędzi pluginów dla powtarzanych rozwiązań
z tym samym skutecznym kontekstem żądania. Klucz cache obejmuje skuteczną
konfigurację środowiska uruchomieniowego, obszar roboczy, identyfikatory agenta/sesji, politykę sandboxa, ustawienia przeglądarki,
kontekst dostarczania, tożsamość żądającego i stan własności, więc fabryki zależne
od tych zaufanych pól są uruchamiane ponownie, gdy kontekst się zmienia.

Jeśli jeden plugin dominuje w czasie, sprawdź jego rejestracje środowiska uruchomieniowego:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, zainstaluj ponownie albo wyłącz ten plugin. Autorzy pluginów powinni przenieść
kosztowne ładowanie zależności za ścieżkę wykonywania narzędzia, zamiast robić to
wewnątrz fabryki narzędzia.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznaczają one, że więcej niż jeden włączony plugin próbuje posiadać ten sam kanał,
przepływ konfiguracji lub nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny plugin kanału
zainstalowany obok wbudowanego pluginu, który teraz udostępnia ten sam identyfikator kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony plugin
  i jego pochodzenie.
- Uruchom `openclaw plugins inspect <id> --runtime --json` dla każdego podejrzanego pluginu i
  porównaj `channels`, `channelConfigs`, `tools` oraz diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po zainstalowaniu lub usunięciu
  pakietów pluginów, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Zrestartuj Gateway po zmianach instalacji, rejestru lub konfiguracji.

Opcje naprawy:

- Jeśli jeden plugin celowo zastępuje inny dla tego samego identyfikatora kanału, preferowany
  plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver` z
  identyfikatorem pluginu o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę za pomocą
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację
  pluginu.
- Jeśli jawnie włączono oba pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do pluginu,
  aby powierzchnia środowiska uruchomieniowego była jednoznaczna.

## Sloty pluginów (kategorie wyłączne)

Niektóre kategorie są wyłączne (aktywny może być tylko jeden naraz):

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

| Slot            | Co kontroluje             | Domyślnie            |
| --------------- | ------------------------- | -------------------- |
| `memory`        | Aktywny plugin pamięci    | `memory-core`        |
| `contextEngine` | Aktywny silnik kontekstu  | `legacy` (wbudowany) |

## Referencja CLI

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
dołączone dostawcy modeli, dołączeni dostawcy mowy oraz dołączony
plugin przeglądarki). Inne dołączone pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub pakiet hooków w miejscu. Użyj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych pluginów npm.
Nie jest obsługiwane z `--link`, który ponownie używa ścieżki źródłowej zamiast
kopiować do zarządzanego miejsca instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego pluginu do tej listy dozwolonych przed jego włączeniem. Jeśli ten sam identyfikator pluginu
znajduje się w `plugins.deny`, instalacja usuwa ten nieaktualny wpis odmowy, dzięki czemu
jawna instalacja jest od razu możliwa do załadowania po ponownym uruchomieniu.

OpenClaw przechowuje utrwalony lokalny rejestr pluginów jako model odczytu na zimno dla
inwentarza pluginów, własności wkładów i planowania uruchomienia. Przepływy instalowania, aktualizowania,
odinstalowywania, włączania i wyłączania odświeżają ten rejestr po zmianie stanu pluginów. Ten sam plik `plugins/installs.json` przechowuje trwałe metadane instalacji w
najwyższego poziomu `installRecords` oraz odtwarzalne metadane manifestu w `plugins`. Jeśli
brakuje rejestru, jest on nieaktualny lub nieprawidłowy, `openclaw plugins registry
--refresh` odbudowuje jego widok manifestu na podstawie rekordów instalacji, polityki konfiguracji oraz
metadanych manifestu/pakietu bez ładowania modułów runtime pluginów.

W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia pluginów są wyłączone.
Zarządzaj wyborem pakietów pluginów i konfiguracją przez źródło Nix dla
instalacji; w przypadku nix-openclaw zacznij od agent-first
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` stosuje się do śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag albo dokładną wersją rozwiązuje nazwę pakietu
z powrotem do śledzonego rekordu pluginu i zapisuje nową specyfikację na potrzeby przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem do
domyślnej linii wydań rejestru. Jeśli zainstalowany plugin npm już pasuje do
rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.
Gdy `openclaw update` działa na kanale beta, rekordy pluginów npm i ClawHub
z linii domyślnej próbują najpierw `@beta`, a następnie wracają do default/latest, gdy nie istnieje
wydanie beta pluginu. Dokładne wersje i jawne tagi pozostają przypięte.

`--pin` dotyczy wyłącznie npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście dla fałszywych
alarmów wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje pluginów
i aktualizacje pluginów mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad polityki `before_install` pluginu ani blokowania po niepowodzeniu skanowania.
Skanowanie instalacji ignoruje typowe pliki i katalogi testowe, takie jak `tests/`,
`__tests__/`, `*.test.*` i `*.spec.*`, aby nie blokować spakowanych mocków testowych;
zadeklarowane punkty wejścia runtime pluginu nadal są skanowane, nawet jeśli używają jednej z
tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów. Instalacje
zależności Skills wspierane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania
`dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje oddzielnym
przepływem pobierania/instalacji Skills z ClawHub.

Jeśli plugin opublikowany przez Ciebie w ClawHub jest ukryty albo zablokowany przez skanowanie, otwórz
panel ClawHub albo uruchom `clawhub package rescan <name>`, aby poprosić ClawHub o ponowne
sprawdzenie. `--dangerously-force-unsafe-install` wpływa tylko na instalacje na Twoim własnym
komputerze; nie prosi ClawHub o ponowne przeskanowanie pluginu ani o upublicznienie zablokowanego wydania.

Zgodne pakiety uczestniczą w tym samym przepływie list/inspect/enable/disable
pluginów. Obecna obsługa runtime obejmuje Skills z pakietów, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` i zadeklarowane w manifeście
`lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje także wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na pakietach.

Źródła marketplace mogą być znaną nazwą marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalnym katalogiem głównym marketplace albo
ścieżką `marketplace.json`, skrótem GitHub w stylu `owner/repo`, adresem URL repozytorium
GitHub albo adresem URL git. W przypadku zdalnych marketplace wpisy pluginów muszą pozostać wewnątrz
sklonowanego repozytorium marketplace i używać wyłącznie względnych źródeł ścieżek.

Pełne szczegóły znajdziesz w [referencji CLI `openclaw plugins`](/pl/cli/plugins).

## Omówienie API Plugin

Natywne pluginy eksportują obiekt wejścia, który udostępnia `register(api)`. Starsze
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

OpenClaw ładuje obiekt wejścia i wywołuje `register(api)` podczas
aktywacji pluginu. Loader nadal wraca do `activate(api)` dla starszych pluginów,
ale dołączone pluginy i nowe pluginy zewnętrzne powinny traktować `register` jako
publiczny kontrakt.

`api.registrationMode` informuje plugin, dlaczego jego wejście jest ładowane:

| Tryb            | Znaczenie                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja runtime. Rejestruj narzędzia, hooki, usługi, polecenia, trasy i inne aktywne efekty uboczne.                              |
| `discovery`     | Odkrywanie możliwości tylko do odczytu. Rejestruj dostawców i metadane; zaufany kod wejścia pluginu może się ładować, ale pomijaj aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekkie wejście konfiguracji.                                                                |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga także wejścia runtime.                                                                         |
| `cli-metadata`  | Wyłącznie zbieranie metadanych poleceń CLI.                                                                                            |

Wejścia pluginów, które otwierają gniazda, bazy danych, procesy robocze w tle albo długotrwałe
klienty, powinny zabezpieczać te efekty uboczne warunkiem `api.registrationMode === "full"`.
Ładowania odkrywania są buforowane oddzielnie od ładowań aktywujących i nie zastępują
działającego rejestru Gateway. Odkrywanie jest nieaktywujące, ale nie jest wolne od importów:
OpenClaw może wykonać zaufane wejście pluginu albo moduł pluginu kanału, aby zbudować
migawkę. Utrzymuj najwyższe poziomy modułów lekkie i bez efektów ubocznych, a klientów
sieciowych, podprocesy, listenery, odczyty poświadczeń i uruchamianie usług przenieś
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
| `registerMediaUnderstandingProvider`    | Analiza obrazów/audio        |
| `registerImageGenerationProvider`       | Generowanie obrazów            |
| `registerMusicGenerationProvider`       | Generowanie muzyki            |
| `registerVideoGenerationProvider`       | Generowanie wideo            |
| `registerWebFetchProvider`              | Dostawca pobierania/scrapingu z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci                  |
| `registerHttpRoute`                     | Punkt końcowy HTTP               |
| `registerCommand` / `registerCli`       | Polecenia CLI                |
| `registerContextEngine`                 | Silnik kontekstu              |
| `registerService`                       | Usługa w tle          |

Zachowanie strażników hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` jest bez działania i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` jest bez działania i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` jest bez działania i nie usuwa wcześniejszego anulowania.

Natywny serwer aplikacji Codex przekazuje zdarzenia natywnych narzędzi Codex z powrotem do tej powierzchni haków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`, obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzeniach `PermissionRequest` Codex. Most nie przepisuje jeszcze argumentów natywnych narzędzi Codex. Dokładna granica obsługi środowiska uruchomieniowego Codex znajduje się w dokumencie [kontraktu obsługi Codex harness v1](/pl/plugins/codex-harness-runtime#v1-support-contract).

Pełne typowane zachowanie haków opisuje [przegląd SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Budowanie pluginów](/pl/plugins/building-plugins) - utwórz własny plugin
- [Pakiety pluginów](/pl/plugins/bundles) - zgodność pakietów Codex/Claude/Cursor
- [Manifest pluginu](/pl/plugins/manifest) - schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) - dodaj narzędzia agenta w pluginie
- [Wewnętrzne działanie pluginów](/pl/plugins/architecture) - model możliwości i potok ładowania
- [ClawHub](/pl/clawhub) - odkrywanie pluginów innych firm
