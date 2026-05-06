---
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Zrozumienie zasad wykrywania i ładowania Pluginów
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instaluj, konfiguruj i zarządzaj pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-06T18:00:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
środowiska agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
głos w czasie rzeczywistym, rozumienie multimediów, generowanie obrazów,
generowanie wideo, pobieranie z internetu, wyszukiwanie w internecie i więcej.
Niektóre pluginy są **rdzeniowe** (dostarczane z OpenClaw), inne są
**zewnętrzne**. Większość zewnętrznych pluginów jest publikowana i odkrywana
przez [ClawHub](/pl/tools/clawhub). Npm pozostaje obsługiwany dla instalacji
bezpośrednich oraz dla tymczasowego zestawu pakietów pluginów należących do
OpenClaw, dopóki ta migracja się nie zakończy.

## Szybki start

Przykłady instalowania, wyświetlania listy, odinstalowywania, aktualizowania
i publikowania do skopiowania znajdziesz w
[Zarządzaniu pluginami](/pl/plugins/manage-plugins).

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

    Następnie skonfiguruj ustawienia w `plugins.entries.\<id\>.config` w pliku konfiguracyjnym.

  </Step>

  <Step title="Zarządzanie natywne dla czatu">
    W działającym Gateway polecenia `/plugins enable` i `/plugins disable`,
    dostępne tylko dla właściciela, wyzwalają przeładowanie konfiguracji
    Gateway. Gateway przeładowuje powierzchnie runtime pluginu w ramach procesu,
    a nowe tury agenta odbudowują listę narzędzi z odświeżonego rejestru.
    `/plugins install` zmienia kod źródłowy pluginu, więc Gateway żąda
    ponownego uruchomienia zamiast udawać, że bieżący proces może bezpiecznie
    przeładować już zaimportowane moduły.

  </Step>

  <Step title="Zweryfikuj plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Użyj `--runtime`, gdy musisz potwierdzić zarejestrowane narzędzia, usługi,
    metody Gateway, hooki albo polecenia CLI należące do pluginu. Zwykłe
    `inspect` to zimny test manifestu/rejestru i celowo unika importowania
    runtime pluginu.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true`
i użyj:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Ścieżka instalacji używa tego samego resolvera co CLI: ścieżki lokalnej/archiwum,
jawnego `clawhub:<pkg>`, jawnego `npm:<pkg>`, jawnego `npm-pack:<path.tgz>`,
jawnego `git:<repo>` albo zwykłej specyfikacji pakietu przez npm.

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpieczną
odmową i wskazuje na `openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania
jest wąska ścieżka ponownej instalacji pluginu wbudowanego dla pluginów, które
włączają `openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja pluginu kończy się
bezpieczną odmową jak każda inna nieprawidłowa konfiguracja. Uruchom
`openclaw doctor --fix`, aby odizolować błędną konfigurację pluginu przez
wyłączenie tego wpisu pluginu i usunięcie jego nieprawidłowego ładunku
konfiguracji; standardowa kopia zapasowa konfiguracji zachowuje poprzednie
wartości.
Gdy konfiguracja kanału odwołuje się do pluginu, którego nie można już odkryć,
ale ten sam nieaktualny identyfikator pluginu nadal istnieje w konfiguracji
pluginu albo rekordach instalacji, uruchamianie Gateway zapisuje ostrzeżenia
i pomija ten kanał zamiast blokować wszystkie pozostałe kanały. Uruchom
`openclaw doctor --fix`, aby usunąć nieaktualne wpisy kanału/pluginu; nieznane
klucze kanałów bez dowodów na nieaktualny plugin nadal nie przechodzą walidacji,
dzięki czemu literówki pozostają widoczne.
Jeśli ustawiono `plugins.enabled: false`, nieaktualne odwołania do pluginów są
traktowane jako nieaktywne: uruchamianie Gateway pomija odkrywanie/ładowanie
pluginów, a `openclaw doctor` zachowuje wyłączoną konfigurację pluginu zamiast
automatycznie ją usuwać. Ponownie włącz pluginy przed uruchomieniem czyszczenia
przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory pluginów.

Instalacja zależności pluginów odbywa się tylko podczas jawnych przepływów
instalacji/aktualizacji albo naprawy doctor. Uruchamianie Gateway,
przeładowywanie konfiguracji i inspekcja runtime nie uruchamiają menedżerów
pakietów ani nie naprawiają drzew zależności. Pluginy lokalne muszą mieć już
zainstalowane zależności, natomiast pluginy npm, git i ClawHub są instalowane
w zarządzanych katalogach głównych pluginów OpenClaw. Zależności npm mogą być
wynoszone w obrębie zarządzanego katalogu głównego npm OpenClaw; instalacja/
aktualizacja skanuje ten zarządzany katalog główny przed zaufaniem, a
odinstalowanie usuwa pakiety zarządzane przez npm za pomocą npm. Zewnętrzne
pluginy i niestandardowe ścieżki ładowania nadal muszą być instalowane przez
`openclaw plugins install`. Użyj `openclaw plugins list --json`, aby zobaczyć
statyczny `dependencyStatus` dla każdego widocznego pluginu bez importowania
kodu runtime ani naprawiania zależności. Zobacz
[Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution), aby poznać
cykl życia w czasie instalacji.

### Własność zablokowanej ścieżki pluginu

Jeśli diagnostyka pluginu zgłasza
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
a po niej walidacja konfiguracji podaje `plugin present but blocked`, OpenClaw
znalazł pliki pluginu należące do innego użytkownika Unix niż proces, który je
ładuje. Pozostaw konfigurację pluginu na miejscu; napraw własność systemu plików
albo uruchom OpenClaw jako ten sam użytkownik, który jest właścicielem katalogu
stanu.

W instalacjach Docker oficjalny obraz działa jako `node` (uid `1000`), więc
montowane z hosta katalogi konfiguracji i przestrzeni roboczej OpenClaw powinny
zwykle należeć do uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jeśli celowo uruchamiasz OpenClaw jako root, zamiast tego napraw zarządzany
katalog główny pluginów tak, aby należał do root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Po naprawieniu własności uruchom ponownie `openclaw doctor --fix` albo
`openclaw plugins registry --refresh`, aby utrwalony rejestr pluginów odpowiadał
naprawionym plikom.

W instalacjach npm mutowalne selektory, takie jak `latest` albo dist-tag, są
rozwiązywane przed instalacją, a następnie przypinane do dokładnej zweryfikowanej
wersji w zarządzanym katalogu głównym npm OpenClaw. Po zakończeniu działania npm
OpenClaw sprawdza, czy zainstalowany wpis `package-lock.json` nadal odpowiada
rozwiązanej wersji i integralności. Jeśli npm zapisze inne metadane pakietu,
instalacja kończy się niepowodzeniem, a zarządzany pakiet jest wycofywany
zamiast zaakceptowania innego artefaktu pluginu.
Zarządzane katalogi główne npm dziedziczą też `overrides` npm na poziomie
pakietu OpenClaw, więc przypięcia bezpieczeństwa chroniące spakowanego hosta
obejmują również wyniesione zależności zewnętrznych pluginów.

Checkouty źródłowe są workspace'ami pnpm. Jeśli klonujesz OpenClaw, aby pracować
nad wbudowanymi pluginami, uruchom `pnpm install`; OpenClaw będzie wtedy ładował
wbudowane pluginy z `extensions/<id>`, więc zmiany i zależności lokalne dla
pakietu będą używane bezpośrednio. Zwykłe instalacje z katalogu głównego npm są
dla spakowanego OpenClaw, a nie dla pracy deweloperskiej w checkoutcie źródłowym.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format      | Jak działa                                                          | Przykłady                                              |
| ----------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| **Natywny** | `openclaw.plugin.json` + moduł runtime; wykonywany w procesie       | Oficjalne pluginy, społecznościowe pakiety npm         |
| **Pakiet**  | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw    | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Szczegóły pakietów znajdziesz w
[Pakietach pluginów](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Tworzenia pluginów](/pl/plugins/building-plugins)
i [Omówienia SDK pluginów](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety pluginów npm muszą deklarować `openclaw.extensions` w
`package.json`. Każdy wpis musi pozostać wewnątrz katalogu pakietu i rozwiązywać
się do czytelnego pliku runtime albo do pliku źródłowego TypeScript z
wywnioskowanym zbudowanym odpowiednikiem JavaScript, takim jak `src/index.ts`
do `dist/index.js`.
Spakowane instalacje muszą dostarczać ten wynik runtime w JavaScript. Fallback
do źródeł TypeScript jest przeznaczony dla checkoutów źródłowych i lokalnych
ścieżek deweloperskich, a nie dla pakietów npm instalowanych w zarządzanym
katalogu głównym pluginów OpenClaw.

Jeśli ostrzeżenie pakietu zarządzanego mówi, że `requires compiled runtime output for
TypeScript entry ...`, pakiet został opublikowany bez plików JavaScript, których
OpenClaw potrzebuje w runtime. To problem pakowania pluginu, a nie lokalnej
konfiguracji. Zaktualizuj albo zainstaluj ponownie plugin po tym, jak wydawca
ponownie opublikuje skompilowany JavaScript, albo wyłącz/odinstaluj ten plugin,
dopóki poprawiony pakiet nie będzie dostępny.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki runtime nie znajdują
się w tych samych ścieżkach co wpisy źródłowe. Jeśli `runtimeExtensions` jest
obecne, musi zawierać dokładnie jeden wpis dla każdego wpisu `extensions`.
Niedopasowane listy powodują błąd instalacji i odkrywania pluginów zamiast
cichego fallbacku do ścieżek źródłowych. Jeśli publikujesz też
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

ClawHub jest podstawową ścieżką dystrybucji dla większości pluginów. Obecne
spakowane wydania OpenClaw już zawierają wiele oficjalnych pluginów, więc w
normalnych konfiguracjach nie wymagają one osobnych instalacji npm. Dopóki każdy
plugin należący do OpenClaw nie zostanie przeniesiony do ClawHub, OpenClaw nadal
udostępnia część pakietów pluginów `@openclaw/*` w npm dla starszych/
niestandardowych instalacji i bezpośrednich przepływów npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako przestarzały, ta wersja
pakietu pochodzi ze starszej zewnętrznej serii pakietów. Użyj wbudowanego
pluginu z bieżącego OpenClaw albo lokalnego checkoutu, dopóki nowszy pakiet npm
nie zostanie opublikowany.

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

### Rdzeniowe (dostarczane z OpenClaw)

<AccordionGroup>
  <Accordion title="Dostawcy modeli (domyślnie włączeni)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` - dołączone wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` - pamięć długoterminowa oparta na LanceDB z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby skonfigurować osadzanie zgodne z OpenAI,
    przykłady Ollama, limity przywoływania i rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` - dołączony Plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska uruchomieniowego przeglądarki i domyślnej usługi sterowania przeglądarką (włączony domyślnie; wyłącz przed zastąpieniem)
    - `copilot-proxy` - most VS Code Copilot Proxy (domyślnie wyłączony)

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

| Pole               | Opis                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Główny przełącznik (domyślnie: `true`)                    |
| `allow`            | Lista dozwolonych Pluginów (opcjonalnie)                  |
| `bundledDiscovery` | Tryb wykrywania dołączonych Pluginów (domyślnie `allowlist`) |
| `deny`             | Lista zablokowanych Pluginów (opcjonalnie; blokada ma pierwszeństwo) |
| `load.paths`       | Dodatkowe pliki/katalogi Pluginów                         |
| `slots`            | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Przełączniki i konfiguracja dla poszczególnych Pluginów   |

`plugins.allow` jest wyłączna. Gdy nie jest pusta, mogą ładować się lub
udostępniać narzędzia tylko wymienione Pluginy, nawet jeśli `tools.allow`
zawiera `"*"` albo konkretną nazwę narzędzia należącego do Pluginu. Jeśli lista
dozwolonych narzędzi odwołuje się do narzędzi Pluginów, dodaj identyfikatory
właścicielskich Pluginów do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor`
ostrzega o takim kształcie konfiguracji.

`plugins.bundledDiscovery` ma domyślnie wartość `"allowlist"` w nowych konfiguracjach, więc
restrykcyjny spis `plugins.allow` blokuje także pominięte dołączone Pluginy
dostawców, w tym wykrywanie dostawców wyszukiwania w sieci w czasie działania.
Doctor oznacza starsze restrykcyjne konfiguracje listy dozwolonych wartością
`"compat"` podczas migracji, aby aktualizacje zachowały starsze zachowanie
dołączonych dostawców do momentu, gdy operator wybierze surowszy tryb.
Pusta wartość `plugins.allow` nadal jest traktowana jako nieustawiona/otwarta.

Zmiany konfiguracji wykonane przez `/plugins enable` lub `/plugins disable`
wyzwalają przeładowanie Pluginów Gateway w procesie. Nowe tury agentów
odbudowują listę narzędzi z odświeżonego rejestru Pluginów. Operacje zmieniające
źródła, takie jak instalacja, aktualizacja i odinstalowanie, nadal restartują
proces Gateway, ponieważ już zaimportowanych modułów Pluginów nie można
bezpiecznie zastąpić w miejscu.

`openclaw plugins list` to lokalny zrzut rejestru/konfiguracji Pluginów. Plugin
oznaczony tam jako `enabled` oznacza, że utrwalony rejestr i bieżąca konfiguracja
pozwalają Pluginowi uczestniczyć. Nie dowodzi to, że już działający zdalny
Gateway przeładował się lub zrestartował z tym samym kodem Pluginu. W konfiguracjach
VPS/kontenerowych z procesami opakowującymi wysyłaj restarty lub zapisy
wyzwalające przeładowanie do faktycznego procesu `openclaw gateway run`, albo użyj
`openclaw gateway restart` wobec działającego Gateway, gdy przeładowanie zgłosi błąd.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Wyłączony**: Plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora Pluginu, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: Plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchamianie Gateway pomija tylko ten Plugin; `openclaw doctor --fix` może poddać nieprawidłowy wpis kwarantannie, wyłączając go i usuwając jego ładunek konfiguracji.

</Accordion>

## Wykrywanie i pierwszeństwo

OpenClaw skanuje Pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` - jawne ścieżki plików lub katalogów. Ścieżki wskazujące
    z powrotem na własne spakowane katalogi dołączonych Pluginów OpenClaw są ignorowane;
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
drzewa skompilowanego `dist/extensions`. Jeśli katalog źródłowy dołączonego
Pluginu zostanie zamontowany przez bind mount na pasującej spakowanej ścieżce źródłowej,
na przykład `/app/extensions/synology-chat`, OpenClaw traktuje ten zamontowany
katalog źródłowy jako nakładkę źródłową dołączonego Pluginu i wykrywa go przed
spakowaną paczką `/app/dist/extensions/synology-chat`. Dzięki temu pętle
kontenerowe opiekunów działają bez przełączania każdego dołączonego Pluginu
z powrotem na źródła TypeScript. Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`,
aby wymusić spakowane paczki dist nawet wtedy, gdy obecne są montowania nakładek źródłowych.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy i pomija wykrywanie/ładowanie Pluginów
- `plugins.deny` zawsze ma pierwszeństwo przed listą dozwolonych
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone Pluginy stosują wbudowany zestaw domyślnie włączony, chyba że zostanie nadpisany
- Wyłączne sloty mogą wymusić włączenie wybranego Pluginu dla danego slotu
- Niektóre dołączone Pluginy wymagające zgody są włączane automatycznie, gdy konfiguracja nazywa
  powierzchnię należącą do Pluginu, taką jak referencja modelu dostawcy, konfiguracja kanału lub środowisko
  uruchomieniowe harnessa
- Nieaktualna konfiguracja Pluginów jest zachowywana, gdy aktywne jest `plugins.enabled: false`;
  włącz ponownie Pluginy przed uruchomieniem czyszczenia doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy Codex z rodziny OpenAI zachowują oddzielne granice Pluginów:
  `openai-codex/*` należy do Pluginu OpenAI, natomiast dołączony Plugin serwera aplikacji Codex
  jest wybierany przez `agentRuntime.id: "codex"` albo starsze referencje modeli
  `codex/*`

## Rozwiązywanie problemów z hookami środowiska uruchomieniowego

Jeśli Plugin pojawia się w `plugins list`, ale efekty uboczne `register(api)` lub hooki
nie uruchamiają się w ruchu czatu na żywo, najpierw sprawdź te kwestie:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Zrestartuj działający Gateway po zmianach instalacji/konfiguracji/kodu Pluginu. W kontenerach
  opakowujących PID 1 może być tylko nadzorcą; zrestartuj lub wyślij sygnał do procesu potomnego
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Niedostarczane hooki konwersacji, takie jak `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Uruchamia się przed
  rozwiązaniem modelu dla tur agenta; `llm_output` uruchamia się dopiero po tym,
  jak próba modelu wytworzy odpowiedź asystenta.
- Aby uzyskać dowód skutecznego modelu sesji, użyj `openclaw sessions` albo
  powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Powolne przygotowywanie narzędzi Pluginu

Jeśli tury agenta zdają się zatrzymywać podczas przygotowywania narzędzi, włącz logowanie śledzenia i
sprawdź linie czasu fabryk narzędzi Pluginów:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie zawiera łączny czas fabryk i najwolniejsze fabryki narzędzi Pluginów,
w tym identyfikator Pluginu, zadeklarowane nazwy narzędzi, kształt wyniku oraz informację, czy narzędzie jest
opcjonalne. Powolne linie są podnoszone do ostrzeżeń, gdy pojedyncza fabryka trwa
co najmniej 1 s albo łączne przygotowanie fabryk narzędzi Pluginów trwa co najmniej 5 s.

OpenClaw buforuje udane wyniki fabryk narzędzi Pluginów dla powtarzanych rozwiązań
z tym samym skutecznym kontekstem żądania. Klucz pamięci podręcznej obejmuje skuteczną
konfigurację środowiska uruchomieniowego, obszar roboczy, identyfikatory agenta/sesji, politykę sandboxa, ustawienia przeglądarki,
kontekst dostarczania, tożsamość żądającego i stan własności, więc fabryki, które
zależą od tych zaufanych pól, są uruchamiane ponownie, gdy kontekst się zmienia.

Jeśli jeden Plugin dominuje w czasie, sprawdź jego rejestracje środowiska uruchomieniowego:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, zainstaluj ponownie albo wyłącz ten Plugin. Autorzy Pluginów powinni przenieść
kosztowne ładowanie zależności za ścieżkę wykonania narzędzia, zamiast robić to
wewnątrz fabryki narzędzia.

### Duplikacja własności kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznacza to, że więcej niż jeden włączony Plugin próbuje posiadać ten sam kanał,
przepływ konfiguracji lub nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny Plugin kanału
zainstalowany obok dołączonego Pluginu, który teraz zapewnia ten sam identyfikator kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony Plugin
  i jego pochodzenie.
- Uruchom `openclaw plugins inspect <id> --runtime --json` dla każdego podejrzanego Pluginu i
  porównaj `channels`, `channelConfigs`, `tools` oraz diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po zainstalowaniu lub usunięciu
  pakietów Pluginów, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Zrestartuj Gateway po zmianach instalacji, rejestru lub konfiguracji.

Opcje naprawy:

- Jeśli jeden Plugin celowo zastępuje inny dla tego samego identyfikatora kanału, preferowany
  Plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver` z
  identyfikatorem Pluginu o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikacja jest przypadkowa, wyłącz jedną stronę przez
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację
  Pluginu.
- Jeśli jawnie włączono oba Pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do Pluginów,
  aby powierzchnia środowiska uruchomieniowego była jednoznaczna.

## Sloty Pluginów (wyłączne kategorie)

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

| Slot            | Co kontroluje              | Domyślnie           |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Aktywny Plugin pamięci     | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu   | `legacy` (wbudowany) |

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
dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony plugin
przeglądarki). Inne dołączone pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub pakiet hooków w miejscu. Używaj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych pluginów
npm. Nie jest to obsługiwane z `--link`, które ponownie używa ścieżki źródłowej zamiast
kopiować ją do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego pluginu do tej listy dozwolonych przed jego włączeniem. Jeśli ten sam identyfikator pluginu
występuje w `plugins.deny`, instalacja usuwa ten nieaktualny wpis blokujący, aby
jawna instalacja była możliwa do załadowania natychmiast po restarcie.

OpenClaw utrzymuje trwały lokalny rejestr pluginów jako model zimnego odczytu dla
inwentarza pluginów, własności kontrybucji i planowania startu. Przepływy instalowania, aktualizowania,
odinstalowywania, włączania i wyłączania odświeżają ten rejestr po zmianie stanu pluginów.
Ten sam plik `plugins/installs.json` przechowuje trwałe metadane instalacji w
górnopoziomowym `installRecords` oraz odbudowywalne metadane manifestów w `plugins`. Jeśli
rejestr jest brakujący, nieaktualny lub nieprawidłowy, `openclaw plugins registry
--refresh` odbudowuje jego widok manifestów z rekordów instalacji, polityki konfiguracji oraz
metadanych manifestów/pakietów bez ładowania modułów runtime pluginów.

W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia pluginów są wyłączone.
Zarządzaj wyborem pakietów pluginów i konfiguracją przez źródło Nix dla danej
instalacji; w przypadku nix-openclaw zacznij od zorientowanego na agenta
[Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag lub dokładną wersją rozwiązuje nazwę pakietu
z powrotem do śledzonego rekordu pluginu i zapisuje nową specyfikację na potrzeby przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem do
domyślnej linii wydań rejestru. Jeśli zainstalowany plugin npm już pasuje do
rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.
Gdy `openclaw update` działa na kanale beta, rekordy pluginów npm i ClawHub
z domyślnej linii najpierw próbują `@beta`, a następnie wracają do domyślnej/najnowszej wersji, gdy nie istnieje wydanie beta pluginu.
Dokładne wersje i jawne tagi pozostają przypięte.

`--pin` jest przeznaczone tylko dla npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście dla fałszywych alarmów
z wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje
i aktualizacje pluginów mimo wbudowanych wyników o poziomie `critical`, ale nadal
nie omija blokad polityki `before_install` pluginów ani blokowania po niepowodzeniu skanowania.
Skanowania instalacji ignorują typowe pliki i katalogi testowe, takie jak `tests/`,
`__tests__/`, `*.test.*` i `*.spec.*`, aby uniknąć blokowania spakowanych mocków testowych;
zadeklarowane punkty wejścia runtime pluginu są nadal skanowane, nawet jeśli używają jednej z
tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalowania/aktualizowania pluginów. Instalacje zależności Skills
obsługiwane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania
`dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem
pobierania/instalacji Skills z ClawHub.

Jeśli plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skanowanie, otwórz
panel ClawHub albo uruchom `clawhub package rescan <name>`, aby poprosić ClawHub o
ponowne sprawdzenie. `--dangerously-force-unsafe-install` wpływa tylko na instalacje na Twoim
własnym komputerze; nie prosi ClawHub o ponowne przeskanowanie pluginu ani nie czyni zablokowanego wydania
publicznym.

Zgodne pakiety uczestniczą w tym samym przepływie listy/inspekcji/włączania/wyłączania
pluginów. Obecna obsługa runtime obejmuje Skills z pakietów, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` oraz zadeklarowane w manifeście
`lspServers`, command-skills Cursor i zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje także wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na pakietach.

Źródłami marketplace mogą być znana nazwa marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace lub ścieżka
`marketplace.json`, skrót GitHub taki jak `owner/repo`, adres URL repozytorium
GitHub albo adres URL git. W przypadku zdalnych marketplace wpisy pluginów muszą pozostawać wewnątrz
sklonowanego repozytorium marketplace i używać wyłącznie względnych źródeł ścieżek.

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
ale dołączone pluginy i nowe pluginy zewnętrzne powinny traktować `register` jako
publiczny kontrakt.

`api.registrationMode` mówi pluginowi, dlaczego jego wpis jest ładowany:

| Tryb            | Znaczenie                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja w czasie wykonywania. Rejestruj narzędzia, hooki, usługi, komendy, trasy i inne aktywne skutki uboczne.                              |
| `discovery`     | Wykrywanie możliwości tylko do odczytu. Rejestruj dostawców i metadane; zaufany kod wpisu pluginu może się załadować, ale pomijaj aktywne skutki uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekki wpis konfiguracji.                                                                |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga także wpisu runtime.                                                                         |
| `cli-metadata`  | Wyłącznie zbieranie metadanych komend CLI.                                                                                            |

Wpisy pluginów, które otwierają gniazda, bazy danych, pracowniki w tle lub długo działające
klienty, powinny chronić te skutki uboczne warunkiem `api.registrationMode === "full"`.
Ładowania na potrzeby wykrywania są cache'owane oddzielnie od ładowań aktywujących i nie zastępują
działającego rejestru Gateway. Wykrywanie nie aktywuje pluginu, ale nie jest wolne od importów:
OpenClaw może ewaluować zaufany wpis pluginu lub moduł pluginu kanału, aby zbudować
migawkę. Utrzymuj kod na poziomie modułu lekki i wolny od skutków ubocznych, a
klientów sieciowych, podprocesy, listenery, odczyty poświadczeń i uruchamianie usług przenoś
za ścieżki pełnego runtime.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Dostawca modeli (LLM)        |
| `registerChannel`                       | Kanał czatu                |
| `registerTool`                          | Narzędzie agenta                  |
| `registerHook` / `on(...)`              | Hooki cyklu życia             |
| `registerSpeechProvider`                | Synteza mowy / STT        |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT               |
| `registerRealtimeVoiceProvider`         | Dupleksowy głos w czasie rzeczywistym       |
| `registerMediaUnderstandingProvider`    | Analiza obrazu/dźwięku        |
| `registerImageGenerationProvider`       | Generowanie obrazów            |
| `registerMusicGenerationProvider`       | Generowanie muzyki            |
| `registerVideoGenerationProvider`       | Generowanie wideo            |
| `registerWebFetchProvider`              | Dostawca pobierania / scrapingu z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci                  |
| `registerHttpRoute`                     | Punkt końcowy HTTP               |
| `registerCommand` / `registerCli`       | Komendy CLI                |
| `registerContextEngine`                 | Silnik kontekstu              |
| `registerService`                       | Usługa w tle          |

Zachowanie zabezpieczeń dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie czyści wcześniejszego anulowania.

Natywny app-server Codex przekazuje zdarzenia narzędzi natywnych dla Codex z powrotem do tej powierzchni hooków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`, obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzaniu żądań Codex `PermissionRequest`. Most nie przepisuje jeszcze argumentów natywnych narzędzi Codex. Dokładna granica obsługi środowiska uruchomieniowego Codex znajduje się w dokumencie [Kontrakt obsługi harnessa Codex v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne typowane zachowanie hooków opisano w [Omówieniu SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) - utwórz własny plugin
- [Pakiety pluginów](/pl/plugins/bundles) - zgodność pakietów Codex/Claude/Cursor
- [Manifest pluginu](/pl/plugins/manifest) - schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) - dodaj narzędzia agenta w pluginie
- [Wewnętrzna architektura pluginów](/pl/plugins/architecture) - model możliwości i pipeline ładowania
- [Pluginy społecznościowe](/pl/plugins/community) - listy zewnętrznych pluginów
