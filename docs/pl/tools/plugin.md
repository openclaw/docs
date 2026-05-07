---
read_when:
    - Instalowanie lub konfigurowanie Pluginów
    - Zrozumienie reguł wykrywania i ładowania Pluginów
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instaluj, konfiguruj i zarządzaj Pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-07T01:55:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
uprzęże agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym,
rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci
i więcej. Niektóre pluginy są **core** (dostarczane z OpenClaw), inne
są **zewnętrzne**. Większość zewnętrznych pluginów jest publikowana i odkrywana przez
[ClawHub](/pl/tools/clawhub). Npm pozostaje obsługiwany dla bezpośrednich instalacji oraz dla
tymczasowego zestawu pakietów pluginów należących do OpenClaw, dopóki ta migracja się nie zakończy.

## Szybki start

Przykłady instalowania, wyświetlania listy, odinstalowywania, aktualizowania i publikowania do skopiowania i wklejenia znajdziesz w
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

    Następnie skonfiguruj w `plugins.entries.\<id\>.config` w swoim pliku konfiguracyjnym.

  </Step>

  <Step title="Zarządzanie natywne dla czatu">
    W działającym Gateway dostępne tylko dla właściciela `/plugins enable` i `/plugins disable`
    uruchamiają przeładowywacz konfiguracji Gateway. Gateway przeładowuje powierzchnie runtime
    pluginów w procesie, a nowe tury agenta odbudowują listę narzędzi z
    odświeżonego rejestru. `/plugins install` zmienia kod źródłowy pluginu, więc
    Gateway żąda ponownego uruchomienia zamiast udawać, że bieżący proces może
    bezpiecznie przeładować już zaimportowane moduły.

  </Step>

  <Step title="Zweryfikuj plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Użyj `--runtime`, gdy musisz potwierdzić zarejestrowane narzędzia, usługi, metody Gateway,
    hooki lub polecenia CLI należące do pluginu. Zwykłe `inspect` jest zimnym
    sprawdzeniem manifestu/rejestru i celowo unika importowania runtime pluginu.

  </Step>
</Steps>

Jeśli wolisz kontrolę natywną dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Ścieżka instalacji używa tego samego resolvera co CLI: lokalna ścieżka/archiwum, jawne
`clawhub:<pkg>`, jawne `npm:<pkg>`, jawne `npm-pack:<path.tgz>`,
jawne `git:<repo>` albo goła specyfikacja pakietu przez npm.

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się zamknięciem i wskazuje na
`openclaw doctor --fix`. Jedyny wyjątek odzyskiwania to wąska ścieżka ponownej instalacji pluginu dostarczanego w pakiecie
dla pluginów, które włączają
`openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja pluginu kończy się zamknięciem jak każda inna nieprawidłowa
konfiguracja. Uruchom `openclaw doctor --fix`, aby odizolować błędną konfigurację pluginu przez
wyłączenie tego wpisu pluginu i usunięcie jego nieprawidłowego ładunku konfiguracji; zwykła
kopia zapasowa konfiguracji zachowuje poprzednie wartości.
Gdy konfiguracja kanału odwołuje się do pluginu, którego nie da się już odkryć, ale ten sam
nieaktualny identyfikator pluginu pozostaje w konfiguracji pluginu lub rekordach instalacji, uruchamianie Gateway
zapisuje ostrzeżenia i pomija ten kanał zamiast blokować każdy inny kanał.
Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne wpisy kanału/pluginu; nieznane
klucze kanałów bez dowodów na nieaktualny plugin nadal nie przechodzą walidacji, aby literówki pozostały
widoczne.
Jeśli ustawiono `plugins.enabled: false`, nieaktualne odwołania do pluginów są traktowane jako bezczynne:
uruchamianie Gateway pomija odkrywanie/ładowanie pluginów, a `openclaw doctor` zachowuje
wyłączoną konfigurację pluginów zamiast usuwać ją automatycznie. Włącz ponownie pluginy przed
uruchomieniem czyszczenia doctor, jeśli chcesz usunąć nieaktualne identyfikatory pluginów.

Instalacja zależności pluginu odbywa się tylko podczas jawnych przepływów instalacji/aktualizacji lub
naprawy doctor. Uruchamianie Gateway, przeładowanie konfiguracji i inspekcja runtime
nie uruchamiają menedżerów pakietów ani nie naprawiają drzew zależności. Lokalne pluginy muszą już
mieć zainstalowane swoje zależności, natomiast pluginy npm, git i ClawHub są
instalowane w zarządzanych katalogach głównych pluginów OpenClaw. Zależności npm mogą być hoistowane
w zarządzanym katalogu głównym npm OpenClaw; instalacja/aktualizacja skanuje ten zarządzany katalog główny przed
zaufaniem, a odinstalowanie usuwa pakiety zarządzane przez npm przez npm. Zewnętrzne pluginy
i niestandardowe ścieżki ładowania nadal muszą być instalowane przez `openclaw plugins install`.
Użyj `openclaw plugins list --json`, aby zobaczyć statyczne `dependencyStatus` dla każdego
widocznego pluginu bez importowania kodu runtime ani naprawiania zależności.
Zobacz [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution), aby poznać
cykl życia w czasie instalacji.

### Zablokowana własność ścieżki pluginu

Jeśli diagnostyka pluginu mówi
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
a po walidacji konfiguracji pojawia się `plugin present but blocked`, OpenClaw znalazł
pliki pluginu należące do innego użytkownika Unix niż proces, który je ładuje.
Zachowaj konfigurację pluginu; napraw własność systemu plików albo uruchom
OpenClaw jako ten sam użytkownik, który jest właścicielem katalogu stanu.

W instalacjach Docker oficjalny obraz działa jako `node` (uid `1000`), więc
montowane z hosta katalogi konfiguracji i obszaru roboczego OpenClaw powinny zwykle
należeć do uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jeśli celowo uruchamiasz OpenClaw jako root, napraw zarządzany katalog główny pluginów tak,
aby należał do root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Po naprawieniu własności ponownie uruchom `openclaw doctor --fix` albo
`openclaw plugins registry --refresh`, aby utrwalony rejestr pluginów odpowiadał
naprawionym plikom.

W instalacjach npm zmienne selektory, takie jak `latest` lub dist-tag, są rozwiązywane
przed instalacją, a następnie przypinane do dokładnej zweryfikowanej wersji w zarządzanym
katalogu głównym npm OpenClaw. Po zakończeniu npm OpenClaw sprawdza, czy zainstalowany
wpis `package-lock.json` nadal odpowiada rozwiązanej wersji i integralności. Jeśli
npm zapisze inne metadane pakietu, instalacja kończy się niepowodzeniem, a zarządzany pakiet
jest wycofywany zamiast zaakceptowania innego artefaktu pluginu.
Zarządzane katalogi główne npm dziedziczą też `overrides` npm na poziomie pakietu OpenClaw, więc
przypięcia bezpieczeństwa chroniące spakowanego hosta mają też zastosowanie do hoistowanych zewnętrznych
zależności pluginów.

Checkouty źródłowe są obszarami roboczymi pnpm. Jeśli klonujesz OpenClaw, aby pracować nad dostarczanymi w pakiecie
pluginami, uruchom `pnpm install`; OpenClaw ładuje wtedy pluginy dostarczane w pakiecie z
`extensions/<id>`, więc edycje i zależności lokalne dla pakietu są używane bezpośrednio.
Zwykłe instalacje w katalogu głównym npm są przeznaczone dla spakowanego OpenClaw, a nie dla rozwoju
na checkoutach źródłowych.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format     | Jak to działa                                                      | Przykłady                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natywny** | `openclaw.plugin.json` + moduł runtime; wykonuje się w procesie   | Oficjalne pluginy, społecznościowe pakiety npm          |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw  | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Szczegóły bundle znajdziesz w [Plugin Bundles](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Tworzenie pluginów](/pl/plugins/building-plugins)
i [Omówienie Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety npm pluginów muszą deklarować `openclaw.extensions` w `package.json`.
Każdy wpis musi pozostać wewnątrz katalogu pakietu i rozwiązywać się do czytelnego
pliku runtime albo do pliku źródłowego TypeScript z wywnioskowanym zbudowanym odpowiednikiem JavaScript,
takim jak `src/index.ts` do `dist/index.js`.
Spakowane instalacje muszą zawierać ten wynik runtime JavaScript. Fallback do źródła TypeScript
jest przeznaczony dla checkoutów źródłowych i lokalnych ścieżek deweloperskich, a nie dla
pakietów npm instalowanych w zarządzanym katalogu głównym pluginów OpenClaw.

Jeśli ostrzeżenie zarządzanego pakietu mówi, że `requires compiled runtime output for
TypeScript entry ...`, pakiet opublikowano bez plików JavaScript, których
OpenClaw potrzebuje w runtime. To problem pakowania pluginu, a nie lokalnej konfiguracji.
Zaktualizuj lub zainstaluj ponownie plugin po tym, jak wydawca ponownie opublikuje skompilowany
JavaScript, albo wyłącz/odinstaluj ten plugin do czasu dostępności poprawionego pakietu.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki runtime nie znajdują się w tych
samych ścieżkach co wpisy źródłowe. Gdy `runtimeExtensions` jest obecne, musi zawierać
dokładnie jeden wpis dla każdego wpisu `extensions`. Niedopasowane listy powodują niepowodzenie instalacji i
odkrywania pluginów zamiast cichego fallbacku do ścieżek źródłowych. Jeśli publikujesz także
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
oddzielnych instalacji npm. Dopóki każdy plugin należący do OpenClaw nie zostanie
przeniesiony do ClawHub, OpenClaw nadal publikuje niektóre pakiety pluginów `@openclaw/*` w
npm dla starszych/niestandardowych instalacji i bezpośrednich przepływów pracy npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako przestarzały, ta wersja pakietu
pochodzi ze starszej zewnętrznej serii pakietów. Użyj pluginu dostarczanego w pakiecie z
aktualnego OpenClaw albo lokalnego checkoutu, dopóki nie zostanie opublikowany nowszy pakiet npm.

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
    - `memory-core` - dołączone wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` - pamięć długoterminowa oparta na LanceDB z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby uzyskać informacje o konfiguracji
    embeddingów zgodnych z OpenAI, przykładach Ollama, limitach przywoływania i rozwiązywaniu problemów.

  </Accordion>

  <Accordion title="Dostawcy mowy (domyślnie włączeni)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` - dołączony plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska uruchomieniowego przeglądarki i domyślnej usługi sterowania przeglądarką (domyślnie włączony; wyłącz przed zastąpieniem)
    - `copilot-proxy` - most VS Code Copilot Proxy (domyślnie wyłączony)

  </Accordion>
</AccordionGroup>

Szukasz pluginów innych firm? Zobacz [Pluginy społeczności](/pl/plugins/community).

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
| `bundledDiscovery` | Tryb wykrywania dołączonych pluginów (domyślnie `allowlist`) |
| `deny`             | Lista blokowanych pluginów (opcjonalna; blokada ma pierwszeństwo) |
| `load.paths`       | Dodatkowe pliki/katalogi pluginów                         |
| `slots`            | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Przełączniki i konfiguracja dla poszczególnych pluginów   |

`plugins.allow` jest wyłączna. Gdy nie jest pusta, tylko wymienione pluginy mogą się ładować
lub udostępniać narzędzia, nawet jeśli `tools.allow` zawiera `"*"` albo konkretną nazwę
narzędzia należącego do pluginu. Jeśli lista dozwolonych narzędzi odwołuje się do narzędzi pluginów, dodaj identyfikatory właścicielskich pluginów
do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor` ostrzega przed taką
konfiguracją.

`plugins.bundledDiscovery` domyślnie ma wartość `"allowlist"` dla nowych konfiguracji, więc
restrykcyjna lista `plugins.allow` blokuje też pominięte dołączone pluginy dostawców,
w tym wykrywanie dostawców wyszukiwania w sieci w czasie działania. Doctor oznacza starsze
restrykcyjne konfiguracje listy dozwolonych wartością `"compat"` podczas migracji, aby aktualizacje zachowały
starsze zachowanie dołączonych dostawców, dopóki operator nie wybierze bardziej rygorystycznego trybu.
Pusta lista `plugins.allow` nadal jest traktowana jako nieustawiona/otwarta.

Zmiany konfiguracji wykonane przez `/plugins enable` albo `/plugins disable` wyzwalają
przeładowanie pluginów Gateway w tym samym procesie. Nowe tury agenta odbudowują listę narzędzi z
odświeżonego rejestru pluginów. Operacje zmieniające źródła, takie jak instalacja,
aktualizacja i odinstalowanie, nadal restartują proces Gateway, ponieważ już zaimportowanych
modułów pluginów nie da się bezpiecznie zastąpić w miejscu.

`openclaw plugins list` to lokalny snapshot rejestru/konfiguracji pluginów. Plugin z wartością
`enabled` oznacza tam, że utrwalony rejestr i bieżąca konfiguracja pozwalają
pluginowi uczestniczyć. Nie dowodzi to, że już uruchomiony zdalny Gateway
przeładował się lub zrestartował do tego samego kodu pluginu. W konfiguracjach VPS/kontenerowych
z procesami opakowującymi wysyłaj restarty albo zapisy wyzwalające przeładowanie do właściwego
procesu `openclaw gateway run`, albo użyj `openclaw gateway restart` wobec
działającego Gateway, gdy przeładowanie zgłasza błąd.

<Accordion title="Stany pluginów: wyłączony, brakujący i nieprawidłowy">
  - **Wyłączony**: plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora pluginu, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchamianie Gateway pomija tylko ten plugin; `openclaw doctor --fix` może poddać nieprawidłowy wpis kwarantannie, wyłączając go i usuwając jego ładunek konfiguracyjny.

</Accordion>

## Wykrywanie i priorytet

OpenClaw skanuje pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` - jawne ścieżki plików lub katalogów. Ścieżki wskazujące
    z powrotem na własne spakowane katalogi dołączonych pluginów OpenClaw są ignorowane;
    uruchom `openclaw doctor --fix`, aby usunąć te nieaktualne aliasy.
  </Step>

  <Step title="Pluginy workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globalne pluginy">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dołączone pluginy">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Instalacje pakietowe i obrazy Docker zwykle rozwiązują dołączone pluginy z
skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy dołączonego pluginu jest
podmontowany przez bind mount nad pasującą spakowaną ścieżką źródłową, na przykład
`/app/extensions/synology-chat`, OpenClaw traktuje ten podmontowany katalog źródłowy
jako overlay dołączonych źródeł i wykrywa go przed spakowanym bundla
`/app/dist/extensions/synology-chat`. Dzięki temu pętle kontenerowe maintainerów
działają bez przełączania każdego dołączonego pluginu z powrotem na źródła TypeScript.
Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane bundle dist,
nawet gdy obecne są podmontowania overlay źródeł.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie pluginy i pomija pracę wykrywania/ładowania pluginów
- `plugins.deny` zawsze ma pierwszeństwo przed allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten plugin
- Pluginy pochodzące z workspace są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone pluginy stosują wbudowany zestaw domyślnie włączonych, chyba że zostanie nadpisany
- Wyłączne sloty mogą wymusić włączenie wybranego pluginu dla danego slotu
- Niektóre dołączone pluginy opt-in są włączane automatycznie, gdy konfiguracja wskazuje
  powierzchnię należącą do pluginu, taką jak referencja modelu dostawcy, konfiguracja kanału albo środowisko uruchomieniowe harness
- Nieaktualna konfiguracja pluginu jest zachowywana, gdy aktywne jest `plugins.enabled: false`;
  ponownie włącz pluginy przed uruchomieniem czyszczenia doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy Codex z rodziny OpenAI zachowują osobne granice pluginów:
  `openai-codex/*` należy do pluginu OpenAI, natomiast dołączony plugin serwera aplikacji Codex
  jest wybierany przez `agentRuntime.id: "codex"` albo starsze referencje modeli
  `codex/*`

## Rozwiązywanie problemów z hookami środowiska uruchomieniowego

Jeśli plugin pojawia się w `plugins list`, ale efekty uboczne `register(api)` albo hooki
nie uruchamiają się w ruchu czatu na żywo, najpierw sprawdź:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Zrestartuj działający Gateway po zmianach instalacji/konfiguracji/kodu pluginu. W kontenerach opakowujących
  PID 1 może być tylko supervisorem; zrestartuj albo zasygnalizuj proces potomny
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Niedowiązane hooki konwersacji, takie jak `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Uruchamia się przed rozwiązaniem modelu
  dla tur agenta; `llm_output` uruchamia się dopiero po tym, jak próba modelu
  wytworzy wyjście asystenta.
- Aby potwierdzić efektywny model sesji, użyj `openclaw sessions` albo
  powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Wolne przygotowywanie narzędzi pluginów

Jeśli tury agenta zdają się zatrzymywać podczas przygotowywania narzędzi, włącz logowanie trace i
sprawdź linie czasów fabryk narzędzi pluginów:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie pokazuje łączny czas fabryk i najwolniejsze fabryki narzędzi pluginów,
w tym identyfikator pluginu, zadeklarowane nazwy narzędzi, kształt wyniku oraz to, czy narzędzie jest
opcjonalne. Wolne linie są promowane do ostrzeżeń, gdy pojedyncza fabryka trwa
co najmniej 1s albo łączny czas przygotowania fabryk narzędzi pluginów trwa co najmniej 5s.

OpenClaw cache'uje udane wyniki fabryk narzędzi pluginów dla powtarzanych rozwiązań
z tym samym efektywnym kontekstem żądania. Klucz cache obejmuje efektywną
konfigurację środowiska uruchomieniowego, workspace, identyfikatory agenta/sesji, politykę sandboxa, ustawienia przeglądarki,
kontekst dostarczania, tożsamość requester i stan własności, więc fabryki
zależne od tych zaufanych pól są uruchamiane ponownie, gdy kontekst się zmienia.

Jeśli jeden plugin dominuje w czasach, sprawdź jego rejestracje runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, przeinstaluj albo wyłącz ten plugin. Autorzy pluginów powinni przenieść
kosztowne ładowanie zależności za ścieżkę wykonania narzędzia zamiast robić to
wewnątrz fabryki narzędzia.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznacza to, że więcej niż jeden włączony plugin próbuje być właścicielem tego samego kanału,
przepływu konfiguracji albo nazwy narzędzia. Najczęstszą przyczyną jest zewnętrzny plugin kanału
zainstalowany obok dołączonego pluginu, który teraz udostępnia ten sam identyfikator kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony plugin
  i jego pochodzenie.
- Uruchom `openclaw plugins inspect <id> --runtime --json` dla każdego podejrzanego pluginu i
  porównaj `channels`, `channelConfigs`, `tools` i diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po instalacji lub usunięciu
  pakietów pluginów, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Zrestartuj Gateway po zmianach instalacji, rejestru albo konfiguracji.

Opcje naprawy:

- Jeśli jeden plugin celowo zastępuje inny dla tego samego identyfikatora kanału, preferowany
  plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver` z
  identyfikatorem pluginu o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę przez
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację
  pluginu.
- Jeśli jawnie włączono oba pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do pluginów,
  aby powierzchnia runtime była jednoznaczna.

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

| Slot            | Co kontroluje              | Domyślnie           |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Aktywny plugin pamięci     | `memory-core`       |
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

Dołączone Pluginy są dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy oraz dołączony Plugin przeglądarki). Inne dołączone Pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany Plugin lub pakiet hooków w miejscu. Używaj `openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych Pluginów npm. Nie jest obsługiwane z `--link`, które ponownie używa ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje identyfikator zainstalowanego Pluginu do tej listy dozwolonych przed jego włączeniem. Jeśli ten sam identyfikator Pluginu znajduje się w `plugins.deny`, instalacja usuwa ten nieaktualny wpis blokady, dzięki czemu jawna instalacja może zostać załadowana natychmiast po ponownym uruchomieniu.

OpenClaw przechowuje utrwalony lokalny rejestr Pluginów jako model zimnego odczytu dla inwentarza Pluginów, własności wkładów i planowania uruchamiania. Przepływy instalacji, aktualizacji, odinstalowania, włączenia i wyłączenia odświeżają ten rejestr po zmianie stanu Pluginu. Ten sam plik `plugins/installs.json` przechowuje trwałe metadane instalacji w najwyższego poziomu `installRecords` oraz odtwarzalne metadane manifestu w `plugins`. Jeśli rejestru brakuje, jest nieaktualny lub nieprawidłowy, `openclaw plugins registry --refresh` odbudowuje jego widok manifestu na podstawie rekordów instalacji, zasad konfiguracji oraz metadanych manifestu/pakietu bez ładowania modułów wykonawczych Pluginu.

W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia Pluginów są wyłączone. Zamiast tego zarządzaj wyborem pakietów Pluginów i konfiguracją przez źródło Nix dla instalacji; w przypadku nix-openclaw zacznij od ukierunkowanego na agenta [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie specyfikacji pakietu npm z dist-tagiem lub dokładną wersją rozwiązuje nazwę pakietu z powrotem do śledzonego rekordu Pluginu i zapisuje nową specyfikację dla przyszłych aktualizacji. Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem na domyślną linię wydań rejestru. Jeśli zainstalowany Plugin npm już odpowiada rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację bez pobierania, ponownej instalacji ani przepisywania konfiguracji. Gdy `openclaw update` działa na kanale beta, rekordy Pluginów npm i ClawHub z domyślnej linii najpierw próbują `@beta`, a następnie wracają do domyślnej/najnowszej wersji, gdy nie istnieje wydanie beta Pluginu. Dokładne wersje i jawne tagi pozostają przypięte.

OpenClaw nie udostępnia jeszcze kanałów Pluginów wsparcia LTS ani miesięcznego. Planowana praca nad miesięczną linią wsparcia będzie wymagała, aby tagi Pluginów npm i ClawHub podążały za tą samą linią wsparcia co pakiet rdzeniowy, zamiast po cichu używać `latest`.

`--pin` działa tylko z npm. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście dla fałszywych alarmów z wbudowanego skanera niebezpiecznego kodu. Pozwala instalacjom i aktualizacjom Pluginów przejść dalej mimo wbudowanych ustaleń `critical`, ale nadal nie omija blokad zasad Pluginu `before_install` ani blokowania po niepowodzeniu skanowania. Skanowania instalacji ignorują typowe pliki i katalogi testowe, takie jak `tests/`, `__tests__/`, `*.test.*` i `*.spec.*`, aby uniknąć blokowania spakowanych mocków testowych; zadeklarowane punkty wejścia środowiska wykonawczego Pluginu nadal są skanowane, nawet jeśli używają jednej z tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji Pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje oddzielnym przepływem pobierania/instalacji Skills z ClawHub.

Jeśli Plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skanowanie, otwórz panel ClawHub albo uruchom `clawhub package rescan <name>`, aby poprosić ClawHub o ponowne sprawdzenie. `--dangerously-force-unsafe-install` wpływa tylko na instalacje na Twojej własnej maszynie; nie prosi ClawHub o ponowne skanowanie Pluginu ani o upublicznienie zablokowanego wydania.

Zgodne pakiety uczestniczą w tym samym przepływie listy/inspekcji/włączania/wyłączania Pluginów. Bieżąca obsługa runtime obejmuje Skills z pakietów, Skills poleceń Claude, domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` i zadeklarowanych w manifeście `lspServers`, Skills poleceń Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje również wykryte możliwości pakietu oraz obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla Pluginów opartych na pakietach.

Źródłami marketplace mogą być znana nazwa marketplace Claude z `~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace lub ścieżka `marketplace.json`, skrót GitHub taki jak `owner/repo`, URL repozytorium GitHub albo URL git. W przypadku zdalnych marketplace wpisy Pluginów muszą pozostawać wewnątrz sklonowanego repozytorium marketplace i używać wyłącznie względnych źródeł ścieżek.

Pełne szczegóły znajdziesz w [referencji CLI `openclaw plugins`](/pl/cli/plugins).

## Omówienie API Pluginów

Natywne Pluginy eksportują obiekt wejściowy, który udostępnia `register(api)`. Starsze Pluginy mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe Pluginy powinny używać `register`.

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

OpenClaw ładuje obiekt wejściowy i wywołuje `register(api)` podczas aktywacji Pluginu. Loader nadal wraca do `activate(api)` dla starszych Pluginów, ale dołączone Pluginy i nowe zewnętrzne Pluginy powinny traktować `register` jako kontrakt publiczny.

`api.registrationMode` informuje Plugin, dlaczego jego punkt wejścia jest ładowany:

| Tryb            | Znaczenie                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja runtime. Rejestruj narzędzia, hooki, usługi, polecenia, trasy i inne aktywne efekty uboczne.                              |
| `discovery`     | Tylko do odczytu wykrywanie możliwości. Rejestruj dostawców i metadane; zaufany kod wejściowy Pluginu może się ładować, ale pomijaj aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekki punkt wejścia konfiguracji.                                                     |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga także punktu wejścia runtime.                                                            |
| `cli-metadata`  | Tylko zbieranie metadanych poleceń CLI.                                                                                              |

Punkty wejścia Pluginów, które otwierają gniazda, bazy danych, pracowników w tle lub długo działających klientów, powinny chronić te efekty uboczne warunkiem `api.registrationMode === "full"`. Ładowania wykrywania są buforowane oddzielnie od ładowań aktywujących i nie zastępują działającego rejestru Gateway. Wykrywanie nie aktywuje, ale nie jest wolne od importów: OpenClaw może ocenić zaufany punkt wejścia Pluginu lub moduł Pluginu kanału, aby zbudować migawkę. Utrzymuj najwyższe poziomy modułów lekkie i wolne od efektów ubocznych, a klientów sieciowych, podprocesy, listenery, odczyty poświadczeń i uruchamianie usług przenieś za ścieżki pełnego runtime.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje                    |
| --------------------------------------- | -------------------------------- |
| `registerProvider`                      | Dostawca modeli (LLM)            |
| `registerChannel`                       | Kanał czatu                      |
| `registerTool`                          | Narzędzie agenta                 |
| `registerHook` / `on(...)`              | Hooki cyklu życia                |
| `registerSpeechProvider`                | Text-to-speech / STT             |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT                 |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos w czasie rzeczywistym |
| `registerMediaUnderstandingProvider`    | Analiza obrazów/audio            |
| `registerImageGenerationProvider`       | Generowanie obrazów              |
| `registerMusicGenerationProvider`       | Generowanie muzyki               |
| `registerVideoGenerationProvider`       | Generowanie wideo                |
| `registerWebFetchProvider`              | Dostawca pobierania/scrapowania z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci             |
| `registerHttpRoute`                     | Punkt końcowy HTTP               |
| `registerCommand` / `registerCli`       | Polecenia CLI                    |
| `registerContextEngine`                 | Silnik kontekstu                 |
| `registerService`                       | Usługa w tle                     |

Zachowanie zabezpieczeń hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nie wykonuje żadnej operacji i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nie wykonuje żadnej operacji i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nie wykonuje żadnej operacji i nie usuwa wcześniejszego anulowania.

Natywne uruchomienia app-servera Codex przekazują zdarzenia narzędzi natywnych dla Codex z powrotem do tej
powierzchni hooków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`,
obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzeniach
`PermissionRequest` Codex. Most nie przepisuje jeszcze argumentów narzędzi
natywnych dla Codex. Dokładna granica obsługi środowiska uruchomieniowego Codex znajduje się w
[kontrakcie obsługi Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełny typowany opis działania hooków znajdziesz w [omówieniu SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) - utwórz własny plugin
- [Pakiety Plugin](/pl/plugins/bundles) - zgodność pakietów Codex/Claude/Cursor
- [Manifest Plugin](/pl/plugins/manifest) - schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) - dodaj narzędzia agenta w pluginie
- [Wewnętrzna architektura Plugin](/pl/plugins/architecture) - model możliwości i potok ładowania
- [Pluginy społecznościowe](/pl/plugins/community) - listy stron trzecich
