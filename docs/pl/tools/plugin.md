---
read_when:
    - Instalowanie lub konfigurowanie Pluginów
    - Zrozumienie reguł wykrywania i ładowania Pluginów
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-07T13:26:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
środowiska agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie
wideo, pobieranie z sieci, wyszukiwanie w sieci i więcej. Niektóre pluginy są
**core** (dostarczane z OpenClaw), inne są **zewnętrzne**. Większość zewnętrznych
pluginów jest publikowana i odkrywana przez
[ClawHub](/pl/tools/clawhub). Npm nadal jest obsługiwany dla instalacji bezpośrednich oraz dla
tymczasowego zestawu pakietów pluginów należących do OpenClaw, dopóki ta migracja się nie zakończy.

## Szybki start

Przykłady instalowania, wyświetlania listy, odinstalowywania, aktualizowania i publikowania gotowe do skopiowania znajdziesz w
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

  <Step title="Zarządzanie natywne dla czatu">
    W działającym Gateway dostępne tylko dla właściciela `/plugins enable` i `/plugins disable`
    wyzwalają ponowne wczytanie konfiguracji Gateway. Gateway ponownie wczytuje powierzchnie
    runtime pluginów w procesie, a nowe tury agenta odbudowują listę narzędzi z
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

    Użyj `--runtime`, gdy musisz potwierdzić zarejestrowane narzędzia, usługi, metody gateway,
    hooki lub należące do pluginu polecenia CLI. Zwykłe `inspect` jest zimnym
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
`clawhub:<pkg>`, jawne `npm:<pkg>`, jawne `npm-pack:<path.tgz>`,
jawne `git:<repo>` albo goła specyfikacja pakietu przez npm.

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpiecznym niepowodzeniem i odsyła do
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka
ponownej instalacji dołączonego pluginu dla pluginów, które włączają
`openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja pluginu kończy się bezpiecznym niepowodzeniem jak każda inna nieprawidłowa
konfiguracja. Uruchom `openclaw doctor --fix`, aby poddać kwarantannie błędną konfigurację pluginu przez
wyłączenie tego wpisu pluginu i usunięcie jego nieprawidłowego ładunku konfiguracji; zwykła
kopia zapasowa konfiguracji zachowuje poprzednie wartości.
Gdy konfiguracja kanału odwołuje się do pluginu, którego nie da się już odkryć, ale ten sam
nieaktualny identyfikator pluginu pozostaje w konfiguracji pluginu lub rekordach instalacji, uruchamianie Gateway
loguje ostrzeżenia i pomija ten kanał zamiast blokować każdy inny kanał.
Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne wpisy kanału/pluginu; nieznane
klucze kanału bez dowodów na nieaktualny plugin nadal nie przechodzą walidacji, aby literówki pozostały
widoczne.
Jeśli ustawiono `plugins.enabled: false`, nieaktualne odwołania do pluginów są traktowane jako nieaktywne:
uruchamianie Gateway pomija odkrywanie/ładowanie pluginów, a `openclaw doctor` zachowuje
wyłączoną konfigurację pluginu zamiast automatycznie ją usuwać. Włącz pluginy ponownie przed
uruchomieniem czyszczenia przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory pluginów.

Instalacja zależności pluginu odbywa się tylko podczas jawnych przepływów instalacji/aktualizacji lub
naprawy doctor. Uruchamianie Gateway, ponowne wczytywanie konfiguracji i inspekcja runtime nie
uruchamiają menedżerów pakietów ani nie naprawiają drzew zależności. Lokalne pluginy muszą już
mieć zainstalowane zależności, natomiast pluginy npm, git i ClawHub są
instalowane w zarządzanych przez OpenClaw korzeniach pluginów. Zależności npm mogą być hoistowane
w zarządzanym przez OpenClaw korzeniu npm; instalacja/aktualizacja skanuje ten zarządzany korzeń przed
zaufaniem, a odinstalowanie usuwa pakiety zarządzane przez npm przez npm. Zewnętrzne pluginy
i niestandardowe ścieżki ładowania nadal muszą być instalowane przez `openclaw plugins install`.
Użyj `openclaw plugins list --json`, aby zobaczyć statyczny `dependencyStatus` dla każdego
widocznego pluginu bez importowania kodu runtime lub naprawiania zależności.
Zobacz [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution), aby poznać
cykl życia podczas instalacji.

### Zablokowana własność ścieżki pluginu

Jeśli diagnostyka pluginu mówi
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
a po niej walidacja konfiguracji pokazuje `plugin present but blocked`, OpenClaw znalazł
pliki pluginu należące do innego użytkownika Unix niż proces, który je ładuje.
Zostaw konfigurację pluginu na miejscu; napraw własność w systemie plików albo uruchom
OpenClaw jako ten sam użytkownik, który jest właścicielem katalogu stanu.

W instalacjach Docker oficjalny obraz działa jako `node` (uid `1000`), więc
montowane z hosta katalogi konfiguracji i przestrzeni roboczej OpenClaw powinny zwykle
należeć do uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jeśli celowo uruchamiasz OpenClaw jako root, napraw zarządzany korzeń pluginów tak, aby
należał do root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Po naprawieniu własności ponownie uruchom `openclaw doctor --fix` albo
`openclaw plugins registry --refresh`, aby utrwalony rejestr pluginów odpowiadał
naprawionym plikom.

Dla instalacji npm zmienne selektory, takie jak `latest` lub dist-tag, są rozwiązywane
przed instalacją, a następnie przypinane do dokładnej zweryfikowanej wersji w zarządzanym przez OpenClaw
korzeniu npm. Po zakończeniu npm OpenClaw weryfikuje, czy zainstalowany wpis
`package-lock.json` nadal odpowiada rozwiązanej wersji i integralności. Jeśli
npm zapisze inne metadane pakietu, instalacja kończy się niepowodzeniem, a zarządzany pakiet
jest wycofywany zamiast zaakceptowania innego artefaktu pluginu.
Zarządzane korzenie npm dziedziczą także `overrides` npm na poziomie pakietu OpenClaw, więc
przypięcia bezpieczeństwa chroniące spakowanego hosta stosują się także do hoistowanych zewnętrznych
zależności pluginów.

Checkouty źródeł są workspace'ami pnpm. Jeśli klonujesz OpenClaw, aby pracować nad dołączonymi
pluginami, uruchom `pnpm install`; OpenClaw wczytuje wtedy dołączone pluginy z
`extensions/<id>`, więc edycje i zależności lokalne dla pakietu są używane bezpośrednio.
Zwykłe instalacje z korzenia npm są przeznaczone dla spakowanego OpenClaw, a nie dla programowania
na checkoucie źródeł.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format     | Jak działa                                                         | Przykłady                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natywny** | `openclaw.plugin.json` + moduł runtime; wykonuje się w procesie    | Oficjalne pluginy, społecznościowe pakiety npm          |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw   | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Szczegóły pakietów bundle znajdziesz w [Plugin Bundles](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Tworzenie pluginów](/pl/plugins/building-plugins)
i [Przegląd Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety npm pluginów muszą deklarować `openclaw.extensions` w `package.json`.
Każdy wpis musi pozostać wewnątrz katalogu pakietu i rozwiązywać się do czytelnego
pliku runtime albo do pliku źródłowego TypeScript z wywnioskowanym zbudowanym
odpowiednikiem JavaScript, takim jak `src/index.ts` do `dist/index.js`.
Spakowane instalacje muszą dostarczać ten wynik runtime JavaScript. Awaryjne użycie źródła
TypeScript jest przeznaczone dla checkoutów źródeł i lokalnych ścieżek programistycznych, a nie dla
pakietów npm instalowanych do zarządzanego przez OpenClaw korzenia pluginów.

Jeśli ostrzeżenie pakietu zarządzanego mówi, że `requires compiled runtime output for
TypeScript entry ...`, pakiet został opublikowany bez plików JavaScript,
których OpenClaw potrzebuje w runtime. To problem pakowania pluginu, a nie problem lokalnej konfiguracji.
Zaktualizuj albo ponownie zainstaluj plugin po tym, jak wydawca ponownie opublikuje skompilowany
JavaScript, albo wyłącz/odinstaluj ten plugin, dopóki poprawiony pakiet nie będzie dostępny.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki runtime nie znajdują się w tych
samych ścieżkach co wpisy źródłowe. Jeśli `runtimeExtensions` jest obecne, musi zawierać
dokładnie jeden wpis dla każdego wpisu `extensions`. Niedopasowane listy powodują niepowodzenie instalacji i
odkrywania pluginu zamiast cichego powrotu do ścieżek źródłowych. Jeśli publikujesz także
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

### Pakiety npm należące do OpenClaw w trakcie migracji

ClawHub jest podstawową ścieżką dystrybucji dla większości pluginów. Obecne spakowane
wydania OpenClaw już zawierają wiele oficjalnych pluginów, więc w normalnych konfiguracjach nie wymagają one
osobnych instalacji npm. Dopóki każdy plugin należący do OpenClaw nie
zmigruje do ClawHub, OpenClaw nadal dostarcza niektóre pakiety pluginów `@openclaw/*` w
npm dla starszych/niestandardowych instalacji oraz bezpośrednich przepływów npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako deprecated, ta wersja pakietu
pochodzi ze starszej zewnętrznej serii pakietów. Użyj dołączonego pluginu z
bieżącego OpenClaw albo lokalnego checkoutu, dopóki nowszy pakiet npm nie zostanie opublikowany.

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
  <Accordion title="Dostawcy modeli (włączeni domyślnie)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginy pamięci">
    - `memory-core` - wbudowane wyszukiwanie w pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` - pamięć długoterminowa oparta na LanceDB z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby uzyskać informacje o konfiguracji osadzania zgodnej z OpenAI, przykładach Ollama, limitach przywoływania i rozwiązywaniu problemów.

  </Accordion>

  <Accordion title="Dostawcy mowy (domyślnie włączeni)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` - wbudowany Plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska wykonawczego przeglądarki i domyślnej usługi sterowania przeglądarką (domyślnie włączony; wyłącz go przed zastąpieniem)
    - `copilot-proxy` - most VS Code Copilot Proxy (domyślnie wyłączony)

  </Accordion>
</AccordionGroup>

Szukasz Pluginów innych firm? Zobacz [Pluginy społeczności](/pl/plugins/community).

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
| `enabled`          | Przełącznik główny (domyślnie: `true`)                    |
| `allow`            | Lista dozwolonych Pluginów (opcjonalna)                   |
| `bundledDiscovery` | Tryb wykrywania wbudowanych Pluginów (domyślnie `allowlist`) |
| `deny`             | Lista zablokowanych Pluginów (opcjonalna; blokada ma pierwszeństwo) |
| `load.paths`       | Dodatkowe pliki/katalogi Pluginów                         |
| `slots`            | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Przełączniki i konfiguracja dla poszczególnych Pluginów   |

`plugins.allow` jest wyłączne. Gdy nie jest puste, tylko wymienione Pluginy mogą się ładować lub udostępniać narzędzia, nawet jeśli `tools.allow` zawiera `"*"` albo nazwę konkretnego narzędzia należącego do Pluginu. Jeśli lista dozwolonych narzędzi odwołuje się do narzędzi Pluginu, dodaj identyfikatory właścicielskich Pluginów do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor` ostrzega o takim kształcie konfiguracji.

`plugins.bundledDiscovery` domyślnie ma wartość `"allowlist"` w nowych konfiguracjach, więc restrykcyjna lista `plugins.allow` blokuje także pominięte wbudowane Pluginy dostawców, w tym wykrywanie dostawców wyszukiwania w sieci w czasie wykonywania. Doctor oznacza starsze restrykcyjne konfiguracje list dozwolonych wartością `"compat"` podczas migracji, aby aktualizacje zachowały starsze zachowanie wbudowanych dostawców do czasu, aż operator wybierze tryb bardziej restrykcyjny. Puste `plugins.allow` nadal jest traktowane jak nieustawione/otwarte.

Zmiany konfiguracji wprowadzone przez `/plugins enable` lub `/plugins disable` wyzwalają przeładowanie Pluginów Gateway w procesie. Nowe tury agenta odbudowują listę narzędzi z odświeżonego rejestru Pluginów. Operacje zmieniające źródła, takie jak instalacja, aktualizacja i odinstalowanie, nadal restartują proces Gateway, ponieważ już zaimportowanych modułów Pluginów nie można bezpiecznie podmienić w miejscu.

`openclaw plugins list` to lokalna migawka rejestru Pluginów/konfiguracji. Plugin oznaczony tam jako `enabled` oznacza, że utrwalony rejestr i bieżąca konfiguracja pozwalają Pluginowi uczestniczyć. Nie dowodzi to, że już działający zdalny Gateway przeładował się lub zrestartował do tego samego kodu Pluginu. W konfiguracjach VPS/kontenerowych z procesami opakowującymi wysyłaj restarty lub zapisy wyzwalające przeładowanie do rzeczywistego procesu `openclaw gateway run` albo użyj `openclaw gateway restart` wobec działającego Gateway, gdy przeładowanie zgłasza błąd.

<Accordion title="Stany Pluginów: wyłączony vs brakujący vs nieprawidłowy">
  - **Wyłączony**: Plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora Pluginu, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: Plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchomienie Gateway pomija tylko ten Plugin; `openclaw doctor --fix` może poddać nieprawidłowy wpis kwarantannie, wyłączając go i usuwając jego ładunek konfiguracji.

</Accordion>

## Wykrywanie i kolejność pierwszeństwa

OpenClaw skanuje Pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` - jawne ścieżki plików lub katalogów. Ścieżki, które wskazują z powrotem na własne spakowane katalogi wbudowanych Pluginów OpenClaw, są ignorowane; uruchom `openclaw doctor --fix`, aby usunąć te nieaktualne aliasy.
  </Step>

  <Step title="Pluginy obszaru roboczego">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globalne Pluginy">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Wbudowane Pluginy">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowa). Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Instalacje pakietowe i obrazy Docker zwykle rozpoznają wbudowane Pluginy ze skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy wbudowanego Pluginu jest zamontowany przez bind mount nad odpowiadającą mu spakowaną ścieżką źródłową, na przykład `/app/extensions/synology-chat`, OpenClaw traktuje ten zamontowany katalog źródłowy jako nakładkę źródłową wbudowanego Pluginu i wykrywa go przed spakowanym pakietem `/app/dist/extensions/synology-chat`. Dzięki temu pętle kontenerowe maintainerów działają bez przełączania każdego wbudowanego Pluginu z powrotem na źródła TypeScript. Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane pakiety dist nawet wtedy, gdy obecne są montowania nakładek źródłowych.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy i pomija wykrywanie/ładowanie Pluginów
- `plugins.deny` zawsze ma pierwszeństwo przed allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą być jawnie włączone)
- Wbudowane Pluginy korzystają z wbudowanego zestawu domyślnie włączonych, o ile nie zostanie to nadpisane
- Wyłączne sloty mogą wymusić włączenie wybranego Pluginu dla tego slotu
- Niektóre wbudowane Pluginy wymagające włączenia są włączane automatycznie, gdy konfiguracja nazywa powierzchnię należącą do Pluginu, taką jak odwołanie do modelu dostawcy, konfiguracja kanału lub środowisko wykonawcze harness
- Nieaktualna konfiguracja Pluginu jest zachowywana, gdy aktywne jest `plugins.enabled: false`; włącz ponownie Pluginy przed uruchomieniem czyszczenia doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy Codex z rodziny OpenAI zachowują osobne granice Pluginów:
  `openai-codex/*` należy do Pluginu OpenAI, natomiast wbudowany Plugin serwera aplikacji Codex jest wybierany przez `agentRuntime.id: "codex"` lub starsze odwołania do modeli `codex/*`

## Rozwiązywanie problemów z hookami środowiska wykonawczego

Jeśli Plugin pojawia się w `plugins list`, ale efekty uboczne `register(api)` albo hooki nie uruchamiają się w ruchu czatu na żywo, najpierw sprawdź:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Zrestartuj działający Gateway po zmianach instalacji/konfiguracji/kodu Pluginu. W kontenerach opakowujących PID 1 może być tylko nadzorcą; zrestartuj albo zasygnalizuj proces potomny `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje hooków i diagnostykę. Niewbudowane hooki konwersacji, takie jak `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`, `before_agent_finalize` i `agent_end`, wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Uruchamia się przed rozpoznaniem modelu dla tur agenta; `llm_output` uruchamia się dopiero po tym, jak próba modelu wytworzy wynik asystenta.
- Jako dowodu efektywnego modelu sesji użyj `openclaw sessions` albo powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom Gateway z `--raw-stream --raw-stream-path <path>`.

### Powolna konfiguracja narzędzi Pluginu

Jeśli tury agenta wydają się zatrzymywać podczas przygotowywania narzędzi, włącz rejestrowanie trace i sprawdź wiersze czasów fabryk narzędzi Pluginów:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie zawiera łączny czas fabryk i najwolniejsze fabryki narzędzi Pluginów, w tym identyfikator Pluginu, zadeklarowane nazwy narzędzi, kształt wyniku oraz informację, czy narzędzie jest opcjonalne. Powolne wiersze są podnoszone do ostrzeżeń, gdy pojedyncza fabryka trwa co najmniej 1 s albo łączne przygotowanie fabryk narzędzi Pluginów trwa co najmniej 5 s.

OpenClaw buforuje udane wyniki fabryk narzędzi Pluginów dla powtarzanych rozpoznań z tym samym efektywnym kontekstem żądania. Klucz pamięci podręcznej obejmuje efektywną konfigurację środowiska wykonawczego, obszar roboczy, identyfikatory agenta/sesji, zasady sandbox, ustawienia przeglądarki, kontekst dostarczenia, tożsamość requester oraz stan własności, więc fabryki zależne od tych zaufanych pól są uruchamiane ponownie, gdy kontekst się zmienia.

Jeśli jeden Plugin dominuje w czasach, sprawdź jego rejestracje środowiska wykonawczego:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, przeinstaluj albo wyłącz ten Plugin. Autorzy Pluginów powinni przenieść kosztowne ładowanie zależności za ścieżkę wykonywania narzędzia, zamiast robić to wewnątrz fabryki narzędzia.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznacza to, że więcej niż jeden włączony Plugin próbuje posiadać ten sam kanał, przepływ konfiguracji albo nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny Plugin kanału zainstalowany obok wbudowanego Pluginu, który teraz udostępnia ten sam identyfikator kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony Plugin i jego pochodzenie.
- Uruchom `openclaw plugins inspect <id> --runtime --json` dla każdego podejrzanego Pluginu i porównaj `channels`, `channelConfigs`, `tools` oraz diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po zainstalowaniu lub usunięciu pakietów Pluginów, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Zrestartuj Gateway po zmianach instalacji, rejestru albo konfiguracji.

Opcje naprawy:

- Jeśli jeden Plugin celowo zastępuje inny dla tego samego identyfikatora kanału, preferowany Plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver` z identyfikatorem Pluginu o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę za pomocą `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację Pluginu.
- Jeśli jawnie włączono oba Pluginy, OpenClaw zachowuje to żądanie i zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do Pluginów, aby powierzchnia środowiska wykonawczego była jednoznaczna.

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

| Slot            | Co kontroluje             | Domyślnie           |
| --------------- | ------------------------- | ------------------- |
| `memory`        | Aktywny Plugin pamięci    | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu  | `legacy` (wbudowany) |

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
dołączeni dostawcy modeli, dołączeni dostawcy mowy oraz dołączony plugin
przeglądarki). Inne dołączone pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub pakiet hooków w miejscu. Używaj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych pluginów npm.
Nie jest obsługiwane razem z `--link`, które ponownie używa ścieżki źródłowej zamiast
kopiować ją do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego pluginu do tej listy dozwolonych przed jego włączeniem. Jeśli ten sam identyfikator pluginu
występuje w `plugins.deny`, instalacja usuwa ten nieaktualny wpis blokady, aby
jawna instalacja była możliwa do załadowania natychmiast po ponownym uruchomieniu.

OpenClaw przechowuje utrwalony lokalny rejestr pluginów jako model zimnego odczytu dla
inwentarza pluginów, własności kontrybucji i planowania uruchamiania. Przepływy instalowania, aktualizowania,
odinstalowywania, włączania i wyłączania odświeżają ten rejestr po zmianie stanu pluginów.
Ten sam plik `plugins/installs.json` przechowuje trwałe metadane instalacji w
najwyższego poziomu `installRecords` oraz odtwarzalne metadane manifestu w
`plugins`. Jeśli rejestr jest brakujący, nieaktualny lub nieprawidłowy, `openclaw plugins registry
--refresh` odbudowuje jego widok manifestów z rekordów instalacji, zasad konfiguracji oraz
metadanych manifestu/pakietu bez ładowania modułów runtime pluginów.

W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia pluginów są wyłączone.
Zarządzaj wyborem pakietów pluginów i konfiguracją przez źródło Nix dla
instalacji; w przypadku nix-openclaw zacznij od agent-first
[Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` stosuje się do śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag lub dokładną wersją rozwiązuje nazwę pakietu
z powrotem do śledzonego rekordu pluginu i zapisuje nową specyfikację dla przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem do
domyślnej linii wydań rejestru. Jeśli zainstalowany plugin npm już odpowiada
rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.
Gdy `openclaw update` działa na kanale beta, rekordy pluginów npm i ClawHub
z domyślnej linii próbują najpierw `@beta`, a następnie wracają do default/latest, gdy nie istnieje
wydanie beta pluginu. Dokładne wersje i jawne tagi pozostają przypięte.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście dla fałszywych
alarmów z wbudowanego skanera niebezpiecznego kodu. Pozwala instalacjom pluginów
i aktualizacjom pluginów przejść dalej mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad zasad pluginu `before_install` ani blokowania po niepowodzeniu skanowania.
Skanowania instalacji ignorują typowe pliki i katalogi testowe, takie jak `tests/`,
`__tests__/`, `*.test.*` i `*.spec.*`, aby uniknąć blokowania spakowanych atrap testowych;
zadeklarowane punkty wejścia runtime pluginu nadal są skanowane, nawet jeśli używają jednej z
tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills
wspierane przez Gateway używają zamiast tego pasującego nadpisania żądania
`dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem
pobierania/instalacji Skills z ClawHub.

Jeśli plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skanowanie, otwórz
panel ClawHub albo uruchom `clawhub package rescan <name>`, aby poprosić ClawHub o ponowne
sprawdzenie go. `--dangerously-force-unsafe-install` wpływa tylko na instalacje na Twojej własnej
maszynie; nie prosi ClawHub o ponowne przeskanowanie pluginu ani nie upublicznia
zablokowanego wydania.

Zgodne pakiety uczestniczą w tym samym przepływie listy/inspekcji/włączania/wyłączania pluginów.
Obecna obsługa runtime obejmuje Skills pakietu, Claude command-skills,
domyślne ustawienia Claude `settings.json`, domyślne wartości Claude `.lsp.json` oraz
zadeklarowane w manifeście `lspServers`, Cursor command-skills i zgodne katalogi hooków
Codex.

`openclaw plugins inspect <id>` raportuje również wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na pakietach.

Źródłami marketplace mogą być znana nazwa marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace albo
ścieżka `marketplace.json`, skrót GitHub taki jak `owner/repo`, adres URL repozytorium GitHub
lub adres URL git. W przypadku zdalnych marketplace wpisy pluginów muszą pozostawać wewnątrz
sklonowanego repozytorium marketplace i używać wyłącznie względnych źródeł ścieżek.

Zobacz [referencję CLI `openclaw plugins`](/pl/cli/plugins), aby uzyskać pełne szczegóły.

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
publiczny kontrakt.

`api.registrationMode` informuje plugin, dlaczego jego punkt wejścia jest ładowany:

| Tryb            | Znaczenie                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja runtime. Rejestruje narzędzia, hooki, usługi, polecenia, trasy i inne aktywne efekty uboczne.                          |
| `discovery`     | Odkrywanie możliwości tylko do odczytu. Rejestruje dostawców i metadane; zaufany kod wejściowy pluginu może się ładować, ale pomija aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekki punkt wejścia konfiguracji.                                                  |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga również punktu wejścia runtime.                                                       |
| `cli-metadata`  | Tylko zbieranie metadanych poleceń CLI.                                                                                          |

Punkty wejścia pluginów, które otwierają gniazda, bazy danych, pracowników w tle lub długotrwałych
klientów, powinny chronić te efekty uboczne warunkiem `api.registrationMode === "full"`.
Ładowania odkrywania są buforowane oddzielnie od ładowań aktywujących i nie zastępują
działającego rejestru Gateway. Odkrywanie nie aktywuje, ale nie jest wolne od importów:
OpenClaw może ocenić zaufany punkt wejścia pluginu lub moduł pluginu kanału, aby zbudować
migawkę. Utrzymuj najwyższe poziomy modułów lekkie i bez efektów ubocznych, a klientów
sieciowych, podprocesy, nasłuchiwaczy, odczyty poświadczeń i uruchamianie usług przenieś
za ścieżki pełnego runtime.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje                 |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Dostawca modeli (LLM)         |
| `registerChannel`                       | Kanał czatu                   |
| `registerTool`                          | Narzędzie agenta              |
| `registerHook` / `on(...)`              | Hooki cyklu życia             |
| `registerSpeechProvider`                | Text-to-speech / STT          |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT              |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos realtime   |
| `registerMediaUnderstandingProvider`    | Analiza obrazów/dźwięku       |
| `registerImageGenerationProvider`       | Generowanie obrazów           |
| `registerMusicGenerationProvider`       | Generowanie muzyki            |
| `registerVideoGenerationProvider`       | Generowanie wideo             |
| `registerWebFetchProvider`              | Dostawca pobierania/scrapingu z sieci |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci          |
| `registerHttpRoute`                     | Punkt końcowy HTTP            |
| `registerCommand` / `registerCli`       | Polecenia CLI                 |
| `registerContextEngine`                 | Silnik kontekstu              |
| `registerService`                       | Usługa w tle                  |

Zachowanie strażnika hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` jest operacją bez efektu i nie usuwa wcześniejszego anulowania.

Natywny serwer aplikacji Codex przekazuje zdarzenia narzędzi natywnych dla Codex z powrotem do tej powierzchni hooków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`, obserwować wyniki przez `after_tool_call` oraz uczestniczyć w zatwierdzeniach `PermissionRequest` Codex. Most nie przepisuje jeszcze argumentów narzędzi natywnych dla Codex. Dokładna granica obsługi środowiska wykonawczego Codex znajduje się w [kontrakcie obsługi Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne, typowane zachowanie hooków opisuje [omówienie SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) - utwórz własny Plugin
- [Pakiety Plugin](/pl/plugins/bundles) - zgodność pakietów Codex/Claude/Cursor
- [Manifest Plugin](/pl/plugins/manifest) - schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) - dodawanie narzędzi agenta w pluginie
- [Elementy wewnętrzne Plugin](/pl/plugins/architecture) - model możliwości i potok ładowania
- [Pluginy społeczności](/pl/plugins/community) - listy firm trzecich
