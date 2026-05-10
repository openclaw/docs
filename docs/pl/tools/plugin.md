---
read_when:
    - Instalowanie lub konfigurowanie Pluginów
    - Zrozumienie reguł wykrywania i ładowania Pluginów
    - Praca z pakietami Pluginów zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie wtyczkami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-10T19:58:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
środowiska uruchomieniowe agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym,
rozumienie multimediów, generowanie obrazów, generowanie wideo, pobieranie z internetu, wyszukiwanie w internecie
i więcej. Niektóre pluginy są **core** (dostarczane z OpenClaw), inne
są **zewnętrzne**. Większość zewnętrznych pluginów jest publikowana i odkrywana przez
[ClawHub](/pl/clawhub). Npm pozostaje obsługiwane dla bezpośrednich instalacji oraz dla
tymczasowego zestawu pakietów pluginów należących do OpenClaw, dopóki ta migracja się nie zakończy.

## Szybki start

Przykłady instalowania, wyświetlania listy, odinstalowywania, aktualizowania i publikowania do skopiowania znajdziesz w
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

    Następnie skonfiguruj w `plugins.entries.\<id\>.config` w swoim pliku konfiguracji.

  </Step>

  <Step title="Zarządzanie z poziomu czatu">
    W działającym Gateway polecenia `/plugins enable` i `/plugins disable`, dostępne tylko dla właściciela,
    wyzwalają przeładowanie konfiguracji Gateway. Gateway przeładowuje powierzchnie uruchomieniowe pluginów
    w procesie, a nowe tury agenta odbudowują swoją listę narzędzi z
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
    hooki lub polecenia CLI należące do pluginu. Zwykłe `inspect` to zimne
    sprawdzenie manifestu/rejestru i celowo unika importowania środowiska uruchomieniowego pluginu.

  </Step>
</Steps>

Jeśli wolisz sterowanie z poziomu czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Ścieżka instalacji używa tego samego mechanizmu rozwiązywania co CLI: ścieżka lokalna/archiwum, jawne
`clawhub:<pkg>`, jawne `npm:<pkg>`, jawne `npm-pack:<path.tgz>`,
jawne `git:<repo>` albo prosta specyfikacja pakietu przez npm.

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpiecznym niepowodzeniem i odsyła do
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka ponownej instalacji dołączonego pluginu
dla pluginów, które włączają
`openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja pluginu kończy się bezpiecznym niepowodzeniem tak jak każda inna nieprawidłowa
konfiguracja. Uruchom `openclaw doctor --fix`, aby odizolować złą konfigurację pluginu przez
wyłączenie tego wpisu pluginu i usunięcie jego nieprawidłowego ładunku konfiguracji; zwykła
kopia zapasowa konfiguracji zachowuje poprzednie wartości.
Gdy konfiguracja kanału odwołuje się do pluginu, którego nie można już odkryć, ale
ten sam nieaktualny identyfikator pluginu pozostaje w konfiguracji pluginów lub rekordach instalacji, uruchamianie Gateway
zapisuje ostrzeżenia w logach i pomija ten kanał zamiast blokować każdy inny kanał.
Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne wpisy kanału/pluginu; nieznane
klucze kanałów bez dowodu na nieaktualny plugin nadal nie przechodzą walidacji, dzięki czemu literówki pozostają
widoczne.
Jeśli ustawiono `plugins.enabled: false`, nieaktualne odwołania do pluginów są traktowane jako nieaktywne:
uruchamianie Gateway pomija pracę odkrywania/ładowania pluginów, a `openclaw doctor` zachowuje
wyłączoną konfigurację pluginów zamiast automatycznie ją usuwać. Włącz ponownie pluginy przed
uruchomieniem czyszczenia przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory pluginów.

Instalowanie zależności pluginów odbywa się tylko podczas jawnych przepływów instalacji/aktualizacji lub
naprawy przez doctor. Uruchamianie Gateway, przeładowanie konfiguracji i inspekcja środowiska uruchomieniowego nie
uruchamiają menedżerów pakietów ani nie naprawiają drzew zależności. Lokalne pluginy muszą już
mieć zainstalowane swoje zależności, natomiast pluginy npm, git i ClawHub są
instalowane pod zarządzanymi katalogami głównymi pluginów OpenClaw. Zależności npm mogą być hoistowane
w zarządzanym katalogu głównym npm OpenClaw; instalacja/aktualizacja skanuje ten zarządzany katalog główny przed
zaufaniem, a odinstalowanie usuwa pakiety zarządzane przez npm przez npm. Zewnętrzne pluginy
i niestandardowe ścieżki ładowania nadal muszą być instalowane przez `openclaw plugins install`.
Użyj `openclaw plugins list --json`, aby zobaczyć statyczny `dependencyStatus` dla każdego
widocznego pluginu bez importowania kodu środowiska uruchomieniowego ani naprawiania zależności.
Zobacz [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution), aby poznać
cykl życia podczas instalacji.

### Zablokowana własność ścieżki pluginu

Jeśli diagnostyka pluginu mówi
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
a po niej walidacja konfiguracji zgłasza `plugin present but blocked`, OpenClaw znalazł
pliki pluginu należące do innego użytkownika Uniksa niż proces, który je ładuje.
Pozostaw konfigurację pluginu na miejscu; napraw własność w systemie plików albo uruchom
OpenClaw jako ten sam użytkownik, który jest właścicielem katalogu stanu.

W instalacjach Docker oficjalny obraz działa jako `node` (uid `1000`), więc
katalogi konfiguracji i przestrzeni roboczej OpenClaw podmontowane z hosta powinny zwykle
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

W instalacjach npm zmienne selektory, takie jak `latest` albo dist-tag, są rozwiązywane
przed instalacją, a następnie przypinane do dokładnej zweryfikowanej wersji w zarządzanym
katalogu głównym npm OpenClaw. Po zakończeniu npm OpenClaw sprawdza, czy zainstalowany
wpis `package-lock.json` nadal odpowiada rozwiązanej wersji i integralności. Jeśli
npm zapisze inne metadane pakietu, instalacja kończy się niepowodzeniem, a zarządzany pakiet
jest wycofywany zamiast zaakceptowania innego artefaktu pluginu.
Zarządzane katalogi główne npm dziedziczą też `overrides` npm na poziomie pakietu OpenClaw, więc
przypięcia bezpieczeństwa chroniące spakowanego hosta dotyczą także hoistowanych zewnętrznych
zależności pluginów.

Checkouty źródeł są workspace’ami pnpm. Jeśli klonujesz OpenClaw, aby pracować nad dołączonymi
pluginami, uruchom `pnpm install`; OpenClaw ładuje wtedy dołączone pluginy z
`extensions/<id>`, więc edycje i zależności lokalne dla pakietu są używane bezpośrednio.
Zwykłe instalacje w katalogu głównym npm są przeznaczone dla spakowanego OpenClaw, nie dla programowania
na checkoutach źródeł.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format     | Jak działa                                                        | Przykłady                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natywny** | `openclaw.plugin.json` + moduł środowiska uruchomieniowego; wykonuje się w procesie       | Oficjalne pluginy, społecznościowe pakiety npm               |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Zobacz [Pakiety pluginów](/pl/plugins/bundles), aby poznać szczegóły bundle.

Jeśli piszesz natywny plugin, zacznij od [Tworzenie pluginów](/pl/plugins/building-plugins)
oraz [Omówienie Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety pluginów npm muszą deklarować `openclaw.extensions` w `package.json`.
Każdy wpis musi pozostać wewnątrz katalogu pakietu i rozwiązywać się do czytelnego
pliku środowiska uruchomieniowego albo do pliku źródłowego TypeScript z wywnioskowanym zbudowanym odpowiednikiem JavaScript,
takim jak `src/index.ts` do `dist/index.js`.
Spakowane instalacje muszą dostarczać ten wynik środowiska uruchomieniowego JavaScript. Fallback do źródeł TypeScript
jest przeznaczony dla checkoutów źródeł i lokalnych ścieżek programistycznych, nie dla
pakietów npm instalowanych w zarządzanym katalogu głównym pluginów OpenClaw.

Jeśli ostrzeżenie zarządzanego pakietu mówi, że `requires compiled runtime output for
TypeScript entry ...`, pakiet opublikowano bez plików JavaScript
potrzebnych OpenClaw w czasie działania. To problem pakowania pluginu, a nie lokalnej konfiguracji.
Zaktualizuj lub zainstaluj ponownie plugin po ponownym opublikowaniu skompilowanego
JavaScript przez wydawcę albo wyłącz/odinstaluj ten plugin, dopóki poprawiony pakiet nie będzie dostępny.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki środowiska uruchomieniowego nie znajdują się pod
tymi samymi ścieżkami co wpisy źródłowe. Gdy `runtimeExtensions` jest obecne, musi zawierać
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

ClawHub jest główną ścieżką dystrybucji dla większości pluginów. Bieżące spakowane
wydania OpenClaw zawierają już wiele oficjalnych pluginów, więc w normalnych konfiguracjach nie wymagają one
oddzielnych instalacji npm. Dopóki każdy plugin należący do OpenClaw nie
zostanie przeniesiony do ClawHub, OpenClaw nadal publikuje niektóre pakiety pluginów `@openclaw/*`
w npm dla starszych/niestandardowych instalacji i bezpośrednich przepływów npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako przestarzały, ta wersja pakietu
pochodzi ze starszej zewnętrznej serii pakietów. Użyj dołączonego pluginu z
bieżącego OpenClaw albo lokalnego checkoutu, dopóki nowszy pakiet npm nie zostanie opublikowany.

| Plugin          | Pakiet                    | Dokumentacja                                       |
| --------------- | -------------------------- | ------------------------------------------ |
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

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby poznać konfigurację
    embeddingów zgodnych z OpenAI, przykłady Ollama, limity przywoływania i rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Dostawcy mowy (włączeni domyślnie)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` - dołączony Plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska wykonawczego przeglądarki i domyślnej usługi sterowania przeglądarką (włączony domyślnie; wyłącz przed zastąpieniem)
    - `copilot-proxy` - most VS Code Copilot Proxy (domyślnie wyłączony)

  </Accordion>
</AccordionGroup>

Szukasz Pluginów firm trzecich? Zobacz [ClawHub](/pl/clawhub).

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
| `allow`            | Lista dozwolonych Pluginów (opcjonalna)                   |
| `bundledDiscovery` | Tryb wykrywania dołączonych Pluginów (domyślnie `allowlist`) |
| `deny`             | Lista zablokowanych Pluginów (opcjonalna; blokada ma pierwszeństwo) |
| `load.paths`       | Dodatkowe pliki/katalogi Pluginów                         |
| `slots`            | Wyłączne selektory slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Przełączniki i konfiguracja dla poszczególnych Pluginów   |

`plugins.allow` jest wyłączne. Gdy nie jest puste, tylko wymienione Pluginy mogą się ładować
lub udostępniać narzędzia, nawet jeśli `tools.allow` zawiera `"*"` albo konkretną nazwę
narzędzia należącego do Pluginu. Jeśli lista dozwolonych narzędzi odwołuje się do narzędzi Pluginów, dodaj identyfikatory właścicielskich Pluginów
do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor` ostrzega o takiej
strukturze.

`plugins.bundledDiscovery` ma domyślnie wartość `"allowlist"` w nowych konfiguracjach, więc
restrykcyjny spis `plugins.allow` blokuje także pominięte dołączone Pluginy dostawców,
w tym wykrywanie dostawcy wyszukiwania w internecie w środowisku wykonawczym. Doctor oznacza starsze
restrykcyjne konfiguracje listy dozwolonych wartością `"compat"` podczas migracji, aby aktualizacje zachowały
starsze zachowanie dołączonych dostawców, dopóki operator nie włączy trybu bardziej restrykcyjnego.
Puste `plugins.allow` nadal jest traktowane jako nieustawione/otwarte.

Zmiany konfiguracji wykonane przez `/plugins enable` lub `/plugins disable` wyzwalają
przeładowanie Pluginów Gateway w bieżącym procesie. Nowe tury agenta odbudowują listę narzędzi z
odświeżonego rejestru Pluginów. Operacje zmieniające źródła, takie jak instalacja,
aktualizacja i odinstalowanie, nadal restartują proces Gateway, ponieważ już zaimportowanych
modułów Pluginów nie można bezpiecznie zastąpić w miejscu.

`openclaw plugins list` to lokalna migawka rejestru/konfiguracji Pluginów. Plugin
`enabled` oznacza tam, że utrwalony rejestr i bieżąca konfiguracja pozwalają
Pluginowi uczestniczyć. Nie dowodzi to, że już działający zdalny Gateway
przeładował się lub zrestartował do tego samego kodu Pluginu. W konfiguracjach VPS/kontenerowych
z procesami opakowującymi wysyłaj restarty albo zapisy wyzwalające przeładowanie do faktycznego
procesu `openclaw gateway run`, albo użyj `openclaw gateway restart` wobec
działającego Gateway, gdy przeładowanie zgłasza błąd.

<Accordion title="Stany Pluginu: wyłączony vs brakujący vs nieprawidłowy">
  - **Wyłączony**: Plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora Pluginu, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: Plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchamianie Gateway pomija tylko ten Plugin; `openclaw doctor --fix` może poddać nieprawidłowy wpis kwarantannie, wyłączając go i usuwając jego ładunek konfiguracji.

</Accordion>

## Wykrywanie i pierwszeństwo

OpenClaw skanuje Pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` - jawne ścieżki plików lub katalogów. Ścieżki wskazujące
    z powrotem na własne spakowane katalogi dołączonych Pluginów OpenClaw są ignorowane;
    uruchom `openclaw doctor --fix`, aby usunąć te nieaktualne aliasy.
  </Step>

  <Step title="Pluginy obszaru roboczego">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globalne Pluginy">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dołączone Pluginy">
    Dostarczane z OpenClaw. Wiele z nich jest włączonych domyślnie (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Spakowane instalacje i obrazy Dockera zwykle rozpoznają dołączone Pluginy z
skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy dołączonego Pluginu jest
podmontowany przez odpowiadającą mu spakowaną ścieżkę źródłową, na przykład
`/app/extensions/synology-chat`, OpenClaw traktuje ten podmontowany katalog źródłowy
jako nakładkę źródeł dołączonego Pluginu i wykrywa go przed spakowanym pakietem
`/app/dist/extensions/synology-chat`. Dzięki temu pętle kontenerowe maintainerów
działają bez przełączania każdego dołączonego Pluginu z powrotem na źródła TypeScript.
Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane pakiety dist
nawet wtedy, gdy obecne są podmontowane nakładki źródeł.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy i pomija wykrywanie/ładowanie Pluginów
- `plugins.deny` zawsze ma pierwszeństwo przed listą dozwolonych
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone Pluginy używają wbudowanego zestawu domyślnie włączonych, chyba że zostanie to nadpisane
- Wyłączne sloty mogą wymusić włączenie wybranego Pluginu dla danego slotu
- Niektóre dołączone Pluginy opt-in są włączane automatycznie, gdy konfiguracja nazywa
  powierzchnię należącą do Pluginu, taką jak ref modelu dostawcy, konfiguracja kanału lub środowisko wykonawcze
  harness
- Nieaktualna konfiguracja Pluginu jest zachowywana, gdy aktywne jest `plugins.enabled: false`;
  ponownie włącz Pluginy przed uruchomieniem czyszczenia doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy Codex z rodziny OpenAI zachowują oddzielne granice Pluginów:
  `openai-codex/*` należy do Pluginu OpenAI, podczas gdy dołączony Plugin
  serwera aplikacji Codex jest wybierany przez kanoniczne refy agentów `openai/*`, jawne
  `agentRuntime.id: "codex"` dostawcy/modelu albo starsze refy modeli `codex/*`

## Rozwiązywanie problemów z hookami środowiska wykonawczego

Jeśli Plugin pojawia się w `plugins list`, ale efekty uboczne lub hooki `register(api)`
nie uruchamiają się w ruchu czatu na żywo, najpierw sprawdź to:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Zrestartuj działający Gateway po zmianach instalacji/konfiguracji/kodu Pluginu. W kontenerach
  opakowujących PID 1 może być tylko supervisorem; zrestartuj lub zasygnalizuj proces potomny
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Niedomyślne hooki konwersacji, takie jak `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Działa przed rozwiązywaniem modelu
  dla tur agenta; `llm_output` działa dopiero po tym, jak próba modelu
  wygeneruje wynik asystenta.
- Jako dowód efektywnego modelu sesji użyj `openclaw sessions` albo powierzchni
  sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Powolne przygotowywanie narzędzi Pluginu

Jeśli tury agenta wydają się zatrzymywać podczas przygotowywania narzędzi, włącz logowanie śledzące i
sprawdź wiersze czasu fabryk narzędzi Pluginu:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie pokazuje całkowity czas fabryk i najwolniejsze fabryki narzędzi Pluginów,
w tym identyfikator Pluginu, zadeklarowane nazwy narzędzi, kształt wyniku oraz to, czy narzędzie jest
opcjonalne. Powolne wiersze są podnoszone do ostrzeżeń, gdy pojedyncza fabryka trwa
co najmniej 1 s albo całkowite przygotowanie fabryk narzędzi Pluginów trwa co najmniej 5 s.

OpenClaw buforuje pomyślne wyniki fabryk narzędzi Pluginów dla powtarzanych rozwiązań
z tym samym efektywnym kontekstem żądania. Klucz pamięci podręcznej obejmuje efektywną
konfigurację środowiska wykonawczego, obszar roboczy, identyfikatory agenta/sesji, politykę sandboxa, ustawienia przeglądarki,
kontekst dostarczania, tożsamość żądającego i stan własności, więc fabryki, które
zależą od tych zaufanych pól, są uruchamiane ponownie, gdy kontekst się zmienia.

Jeśli jeden Plugin dominuje w czasie, sprawdź jego rejestracje środowiska wykonawczego:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, zainstaluj ponownie albo wyłącz ten Plugin. Autorzy Pluginów powinni przenieść
kosztowne ładowanie zależności za ścieżkę wykonywania narzędzia zamiast robić to
wewnątrz fabryki narzędzia.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznacza to, że więcej niż jeden włączony Plugin próbuje posiadać ten sam kanał,
przepływ konfiguracji albo nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny Plugin kanału
zainstalowany obok dołączonego Pluginu, który teraz zapewnia ten sam identyfikator kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony Plugin
  i jego pochodzenie.
- Uruchom `openclaw plugins inspect <id> --runtime --json` dla każdego podejrzanego Pluginu i
  porównaj `channels`, `channelConfigs`, `tools` oraz diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po zainstalowaniu lub usunięciu
  pakietów Pluginów, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Zrestartuj Gateway po zmianach instalacji, rejestru albo konfiguracji.

Opcje naprawy:

- Jeśli jeden Plugin celowo zastępuje inny dla tego samego identyfikatora kanału, preferowany
  Plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver` z
  identyfikatorem Pluginu o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę przez
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację
  Pluginu.
- Jeśli jawnie włączono oba Pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do Pluginu,
  aby powierzchnia środowiska wykonawczego była jednoznaczna.

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

| Slot            | Co kontroluje              | Domyślnie              |
| --------------- | -------------------------- | ---------------------- |
| `memory`        | Aktywny Plugin pamięci     | `memory-core`          |
| `contextEngine` | Aktywny silnik kontekstu   | `legacy` (wbudowany)   |

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

Dołączone pluginy są dostarczane z OpenClaw. Wiele z nich jest domyślnie
włączonych (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy oraz
dołączony plugin przeglądarki). Inne dołączone pluginy nadal wymagają
`openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub pakiet hooków w miejscu.
Używaj `openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji
śledzonych pluginów npm. Nie jest obsługiwane razem z `--link`, które ponownie
używa ścieżki źródłowej zamiast kopiować ją do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego pluginu do tej listy dozwolonych elementów przed
jego włączeniem. Jeśli ten sam identyfikator pluginu jest obecny w
`plugins.deny`, instalacja usuwa ten nieaktualny wpis odmowy, aby jawna
instalacja była możliwa do załadowania natychmiast po ponownym uruchomieniu.

OpenClaw utrzymuje trwały lokalny rejestr pluginów jako model zimnego odczytu
dla inwentarza pluginów, własności wkładów i planowania uruchamiania. Przepływy
instalacji, aktualizacji, odinstalowania, włączania i wyłączania odświeżają ten
rejestr po zmianie stanu pluginów. Ten sam plik `plugins/installs.json`
przechowuje trwałe metadane instalacji w najwyższego poziomu `installRecords`
oraz odbudowywalne metadane manifestu w `plugins`. Jeśli rejestru brakuje, jest
nieaktualny lub nieprawidłowy, `openclaw plugins registry --refresh` odbudowuje
jego widok manifestów na podstawie rekordów instalacji, zasad konfiguracji oraz
metadanych manifestu/pakietu, bez ładowania modułów uruchomieniowych pluginów.

W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia pluginów są
wyłączone. Zamiast tego zarządzaj wyborem pakietów pluginów i konfiguracją przez
źródło Nix dla instalacji; w przypadku nix-openclaw zacznij od podejścia
agent-first w [Szybkim starcie](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji.
Przekazanie specyfikacji pakietu npm z dist-tagiem lub dokładną wersją
rozwiązuje nazwę pakietu z powrotem do śledzonego rekordu pluginu i zapisuje
nową specyfikację dla przyszłych aktualizacji. Przekazanie nazwy pakietu bez
wersji przenosi dokładnie przypiętą instalację z powrotem do domyślnej linii
wydania rejestru. Jeśli zainstalowany plugin npm już pasuje do rozwiązanej
wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację bez
pobierania, ponownej instalacji ani przepisywania konfiguracji.
Gdy `openclaw update` działa na kanale beta, rekordy pluginów npm i ClawHub z
domyślnej linii najpierw próbują `@beta`, a gdy wydanie beta pluginu nie
istnieje, wracają do default/latest. Dokładne wersje i jawne tagi pozostają
przypięte.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace utrwalają metadane źródła marketplace zamiast
specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście dla fałszywych alarmów
wbudowanego skanera niebezpiecznego kodu. Pozwala instalacjom i aktualizacjom
pluginów przejść mimo wbudowanych ustaleń `critical`, ale nadal nie omija blokad
zasad pluginu `before_install` ani blokad po niepowodzeniu skanowania. Skanowania
instalacyjne ignorują typowe pliki i katalogi testowe, takie jak `tests/`,
`__tests__/`, `*.test.*` i `*.spec.*`, aby nie blokować spakowanych mocków
testowych; zadeklarowane punkty wejścia środowiska uruchomieniowego pluginu są
nadal skanowane, nawet jeśli używają jednej z tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów.
Instalacje zależności umiejętności obsługiwane przez Gateway używają zamiast
tego pasującego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy
`openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji
umiejętności ClawHub.

Jeśli plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany
przez skanowanie, otwórz panel ClawHub albo uruchom
`clawhub package rescan <name>`, aby poprosić ClawHub o ponowne sprawdzenie.
`--dangerously-force-unsafe-install` wpływa tylko na instalacje na Twoim własnym
komputerze; nie prosi ClawHub o ponowne przeskanowanie pluginu ani nie
upublicznia zablokowanego wydania.

Zgodne pakiety uczestniczą w tym samym przepływie listy/inspekcji/włączania/
wyłączania pluginów. Obecna obsługa uruchomieniowa obejmuje umiejętności
pakietów, command-skills Claude, domyślne wartości Claude `settings.json`,
domyślne wartości Claude `.lsp.json` i zadeklarowane w manifeście `lspServers`,
command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje także wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na
pakietach.

Źródłami marketplace mogą być znana nazwa marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace
lub ścieżka `marketplace.json`, skrót GitHub taki jak `owner/repo`, adres URL
repozytorium GitHub albo adres URL git. W przypadku zdalnych marketplace wpisy
pluginów muszą pozostawać wewnątrz sklonowanego repozytorium marketplace i
używać wyłącznie względnych źródeł ścieżek.

Pełne szczegóły znajdziesz w [dokumentacji CLI `openclaw plugins`](/pl/cli/plugins).

## Przegląd API pluginu

Natywne pluginy eksportują obiekt wejściowy, który udostępnia `register(api)`.
Starsze pluginy mogą nadal używać `activate(api)` jako starszego aliasu, ale
nowe pluginy powinny używać `register`.

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

OpenClaw ładuje obiekt wejściowy i wywołuje `register(api)` podczas aktywacji
pluginu. Loader nadal wraca do `activate(api)` dla starszych pluginów, ale
dołączone pluginy i nowe pluginy zewnętrzne powinny traktować `register` jako
publiczny kontrakt.

`api.registrationMode` informuje plugin, dlaczego jego punkt wejścia jest
ładowany:

| Tryb            | Znaczenie                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja uruchomieniowa. Rejestruj narzędzia, hooki, usługi, polecenia, trasy i inne aktywne efekty uboczne.                     |
| `discovery`     | Odkrywanie możliwości tylko do odczytu. Rejestruj dostawców i metadane; zaufany kod wejściowy pluginu może zostać załadowany, ale pomijaj aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekki punkt wejścia konfiguracji.                                                    |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga także punktu wejścia uruchomieniowego.                                                  |
| `cli-metadata`  | Tylko zbieranie metadanych poleceń CLI.                                                                                            |

Punkty wejścia pluginów, które otwierają gniazda, bazy danych, pracowników w tle
lub długo działających klientów, powinny chronić te efekty uboczne warunkiem
`api.registrationMode === "full"`. Ładowania odkrywania są buforowane oddzielnie
od ładowań aktywujących i nie zastępują działającego rejestru Gateway.
Odkrywanie jest nieaktywujące, ale nie jest wolne od importów: OpenClaw może
ewaluować zaufany punkt wejścia pluginu lub moduł pluginu kanału, aby zbudować
migawkę. Utrzymuj najwyższe poziomy modułów lekkie i wolne od efektów ubocznych,
a klientów sieciowych, podprocesy, nasłuchiwacze, odczyty poświadczeń i start
usług przenieś za ścieżki pełnego środowiska uruchomieniowego.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje                |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Dostawca modelu (LLM)        |
| `registerChannel`                       | Kanał czatu                  |
| `registerTool`                          | Narzędzie agenta             |
| `registerHook` / `on(...)`              | Hooki cyklu życia            |
| `registerSpeechProvider`                | Tekst-na-mowę / STT          |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT             |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos realtime  |
| `registerMediaUnderstandingProvider`    | Analiza obrazów/dźwięku      |
| `registerImageGenerationProvider`       | Generowanie obrazów          |
| `registerMusicGenerationProvider`       | Generowanie muzyki           |
| `registerVideoGenerationProvider`       | Generowanie wideo            |
| `registerWebFetchProvider`              | Dostawca pobierania / scrapingu z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci         |
| `registerHttpRoute`                     | Punkt końcowy HTTP           |
| `registerCommand` / `registerCli`       | Polecenia CLI                |
| `registerContextEngine`                 | Silnik kontekstu             |
| `registerService`                       | Usługa w tle                 |

Zachowanie zabezpieczeń hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest kończące; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest kończące; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest kończące; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie usuwa wcześniejszego anulowania.

Natywny serwer aplikacji Codex przekazuje zdarzenia narzędzi natywnych dla Codex z powrotem do tej powierzchni hooków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`, obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzeniach `PermissionRequest` w Codex. Most nie przepisuje jeszcze argumentów narzędzi natywnych dla Codex. Dokładna granica obsługi środowiska uruchomieniowego Codex znajduje się w
[kontrakcie obsługi harnessa Codex v1](/pl/plugins/codex-harness-runtime#v1-support-contract).

Pełne typowane zachowanie hooków opisuje [omówienie SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) - utwórz własny plugin
- [Pakiety pluginów](/pl/plugins/bundles) - zgodność pakietów Codex/Claude/Cursor
- [Manifest pluginu](/pl/plugins/manifest) - schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) - dodawaj narzędzia agenta w pluginie
- [Wewnętrzne mechanizmy pluginów](/pl/plugins/architecture) - model możliwości i potok ładowania
- [ClawHub](/pl/clawhub) - odkrywanie pluginów innych firm
