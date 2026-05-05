---
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Zrozumienie zasad wykrywania i ładowania Pluginów
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie Pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-05T01:51:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
środowiska uruchomieniowe agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym,
rozumienie multimediów, generowanie obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci
i więcej. Niektóre pluginy są **podstawowe** (dostarczane z OpenClaw), inne
są **zewnętrzne**. Większość zewnętrznych pluginów jest publikowana i odkrywana przez
[ClawHub](/pl/tools/clawhub). Npm pozostaje obsługiwany dla instalacji bezpośrednich oraz dla
tymczasowego zestawu pakietów pluginów należących do OpenClaw, dopóki ta migracja się nie zakończy.

## Szybki start

Przykłady instalacji, listowania, odinstalowywania, aktualizowania i publikowania do skopiowania znajdziesz w
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
    W działającym Gateway polecenia tylko dla właściciela `/plugins enable` i `/plugins disable`
    wyzwalają moduł ponownego ładowania konfiguracji Gateway. Gateway ponownie ładuje powierzchnie uruchomieniowe pluginu
    w procesie, a nowe tury agenta odbudowują listę narzędzi z
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

    Użyj `--runtime`, gdy musisz potwierdzić zarejestrowane narzędzia, usługi, metody Gateway,
    hooki lub polecenia CLI należące do pluginu. Zwykłe `inspect` to zimne
    sprawdzenie manifestu/rejestru i celowo unika importowania runtime pluginu.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Ścieżka instalacji używa tego samego resolvera co CLI: lokalna ścieżka/archiwum, jawne
`clawhub:<pkg>`, jawne `npm:<pkg>`, jawne `git:<repo>` albo samodzielna specyfikacja pakietu
przez npm.

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpieczną odmową i wskazuje
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka ponownej instalacji
wbudowanego pluginu dla pluginów, które włączają
`openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja pluginu kończy się bezpieczną odmową jak każda inna nieprawidłowa
konfiguracja. Uruchom `openclaw doctor --fix`, aby poddać błędną konfigurację pluginu kwarantannie przez
wyłączenie tego wpisu pluginu i usunięcie jego nieprawidłowego ładunku konfiguracji; normalna
kopia zapasowa konfiguracji zachowuje poprzednie wartości.
Gdy konfiguracja kanału odwołuje się do pluginu, którego nie da się już odnaleźć, ale
ten sam przestarzały identyfikator pluginu pozostaje w konfiguracji pluginu lub rekordach instalacji, uruchamianie Gateway
zapisuje ostrzeżenia i pomija ten kanał zamiast blokować wszystkie pozostałe kanały.
Uruchom `openclaw doctor --fix`, aby usunąć przestarzałe wpisy kanału/pluginu; nieznane
klucze kanałów bez dowodów na przestarzały plugin nadal nie przechodzą walidacji, więc literówki pozostają
widoczne.
Jeśli ustawiono `plugins.enabled: false`, przestarzałe odwołania do pluginów są traktowane jako nieaktywne:
uruchamianie Gateway pomija wykrywanie/ładowanie pluginów, a `openclaw doctor` zachowuje
wyłączoną konfigurację pluginu zamiast automatycznie ją usuwać. Włącz pluginy ponownie przed
uruchomieniem czyszczenia doctor, jeśli chcesz usunąć przestarzałe identyfikatory pluginów.

Instalacja zależności pluginów odbywa się tylko podczas jawnych przepływów instalacji/aktualizacji lub
naprawy doctor. Uruchamianie Gateway, ponowne ładowanie konfiguracji i inspekcja runtime
nie uruchamiają menedżerów pakietów ani nie naprawiają drzew zależności. Lokalne pluginy muszą już
mieć zainstalowane zależności, natomiast pluginy npm, git i ClawHub są
instalowane w zarządzanych katalogach głównych pluginów OpenClaw. Zależności npm mogą być hoistowane
w zarządzanym katalogu głównym npm OpenClaw; instalacja/aktualizacja skanuje ten zarządzany katalog główny przed
zaufaniem, a odinstalowanie usuwa pakiety zarządzane przez npm za pomocą npm. Zewnętrzne pluginy
i niestandardowe ścieżki ładowania nadal muszą być instalowane przez `openclaw plugins install`.
Użyj `openclaw plugins list --json`, aby zobaczyć statyczne `dependencyStatus` dla każdego
widocznego pluginu bez importowania kodu runtime ani naprawiania zależności.
Zobacz [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution), aby poznać
cykl życia podczas instalacji.

W przypadku instalacji npm zmienne selektory, takie jak `latest` lub dist-tag, są rozwiązywane
przed instalacją, a następnie przypinane do dokładnej zweryfikowanej wersji w zarządzanym
katalogu głównym npm OpenClaw. Po zakończeniu działania npm OpenClaw weryfikuje, czy zainstalowany
wpis `package-lock.json` nadal pasuje do rozwiązanej wersji i integralności. Jeśli
npm zapisze inne metadane pakietu, instalacja kończy się niepowodzeniem, a zarządzany pakiet
jest wycofywany zamiast zaakceptowania innego artefaktu pluginu.

Checkouty źródłowe są workspace’ami pnpm. Jeśli klonujesz OpenClaw, aby pracować nad wbudowanymi
pluginami, uruchom `pnpm install`; OpenClaw ładuje wtedy wbudowane pluginy z
`extensions/<id>`, dzięki czemu edycje i zależności lokalne dla pakietu są używane bezpośrednio.
Zwykłe instalacje w katalogu głównym npm są przeznaczone dla spakowanego OpenClaw, a nie dla
rozwoju checkoutu źródłowego.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format     | Jak działa                                                         | Przykłady                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natywny** | `openclaw.plugin.json` + moduł runtime; wykonuje się w procesie    | Oficjalne pluginy, społecznościowe pakiety npm         |
| **Pakiet** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw   | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Szczegóły pakietów znajdziesz w [Pakiety pluginów](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Budowanie pluginów](/pl/plugins/building-plugins)
oraz [Przegląd Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety npm pluginów muszą deklarować `openclaw.extensions` w `package.json`.
Każdy wpis musi pozostać wewnątrz katalogu pakietu i rozwiązywać się do czytelnego
pliku runtime albo do pliku źródłowego TypeScript z wywnioskowanym zbudowanym odpowiednikiem JavaScript,
takim jak `src/index.ts` do `dist/index.js`.
Spakowane instalacje muszą dostarczać ten wynik runtime JavaScript. Fallback na źródło TypeScript
jest przeznaczony dla checkoutów źródłowych i lokalnych ścieżek rozwojowych, a nie dla
pakietów npm instalowanych w zarządzanym katalogu głównym pluginów OpenClaw.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki runtime nie znajdują się w
tych samych ścieżkach co wpisy źródłowe. Gdy `runtimeExtensions` jest obecne, musi zawierać
dokładnie jeden wpis dla każdego wpisu `extensions`. Niedopasowane listy powodują niepowodzenie instalacji i
odkrywania pluginu zamiast cichego fallbacku do ścieżek źródłowych. Jeśli publikujesz również
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
zmigrowany do ClawHub, OpenClaw nadal publikuje niektóre pakiety pluginów `@openclaw/*`
w npm dla starszych/niestandardowych instalacji i bezpośrednich przepływów npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako przestarzały, ta wersja pakietu
pochodzi ze starszej zewnętrznej linii pakietów. Użyj wbudowanego pluginu z
bieżącego OpenClaw albo lokalnego checkoutu, dopóki nie zostanie opublikowany nowszy pakiet npm.

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
  <Accordion title="Dostawcy modeli (włączeni domyślnie)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginy pamięci">
    - `memory-core` — wbudowane wyszukiwanie w pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — pamięć długoterminowa oparta na LanceDB z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby poznać konfigurację embeddingów zgodną z OpenAI,
    przykłady Ollama, limity przywoływania i rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Dostawcy mowy (włączeni domyślnie)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` — wbudowany plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, runtime przeglądarki i domyślnej usługi sterowania przeglądarką (włączony domyślnie; wyłącz go przed zastąpieniem)
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

| Pole               | Opis                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Główny przełącznik (domyślnie: `true`)                    |
| `allow`            | Lista dozwolonych Pluginów (opcjonalnie)                  |
| `bundledDiscovery` | Tryb wykrywania dołączonych Pluginów (domyślnie `allowlist`) |
| `deny`             | Lista zabronionych Pluginów (opcjonalnie; odmowa ma pierwszeństwo) |
| `load.paths`       | Dodatkowe pliki/katalogi Pluginów                         |
| `slots`            | Wyłączne selektory slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Przełączniki i konfiguracja dla poszczególnych Pluginów   |

`plugins.allow` jest wyłączne. Gdy nie jest puste, tylko wymienione Pluginy mogą się ładować
lub udostępniać narzędzia, nawet jeśli `tools.allow` zawiera `"*"` albo konkretną nazwę
narzędzia należącego do Pluginu. Jeśli lista dozwolonych narzędzi odwołuje się do narzędzi Pluginów, dodaj identyfikatory właścicielskich Pluginów
do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor` ostrzega o tej
postaci konfiguracji.

`plugins.bundledDiscovery` domyślnie ma wartość `"allowlist"` dla nowych konfiguracji, więc
restrykcyjny spis `plugins.allow` blokuje również pominięte dołączone Pluginy dostawców,
w tym wykrywanie dostawcy wyszukiwania w sieci w czasie działania. Doctor oznacza starsze
restrykcyjne konfiguracje z listą dozwolonych wartością `"compat"` podczas migracji, aby aktualizacje zachowały
starsze zachowanie dołączonych dostawców do czasu, aż operator wybierze bardziej restrykcyjny tryb.
Puste `plugins.allow` nadal jest traktowane jako nieustawione/otwarte.

Zmiany konfiguracji wprowadzone przez `/plugins enable` lub `/plugins disable` wyzwalają
przeładowanie Pluginów Gateway w ramach procesu. Nowe tury agentów odbudowują listę narzędzi z
odświeżonego rejestru Pluginów. Operacje zmieniające źródła, takie jak instalacja,
aktualizacja i odinstalowanie, nadal restartują proces Gateway, ponieważ już zaimportowanych
modułów Pluginów nie można bezpiecznie zastąpić w miejscu.

`openclaw plugins list` to lokalny zrzut rejestru/konfiguracji Pluginów. Plugin
`enabled` oznacza tam, że utrwalony rejestr i bieżąca konfiguracja pozwalają
Pluginowi uczestniczyć. Nie dowodzi to, że już działający zdalny Gateway
przeładował się lub zrestartował do tego samego kodu Pluginu. W konfiguracjach VPS/kontenerów
z procesami opakowującymi wysyłaj restarty lub zapisy wyzwalające przeładowanie do rzeczywistego
procesu `openclaw gateway run`, albo użyj `openclaw gateway restart` wobec
działającego Gateway, gdy przeładowanie zgłasza błąd.

<Accordion title="Stany Pluginu: wyłączony, brakujący, nieprawidłowy">
  - **Wyłączony**: Plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowana.
  - **Brakujący**: konfiguracja odwołuje się do identyfikatora Pluginu, którego wykrywanie nie znalazło.
  - **Nieprawidłowy**: Plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu. Uruchamianie Gateway pomija tylko ten Plugin; `openclaw doctor --fix` może poddać nieprawidłowy wpis kwarantannie, wyłączając go i usuwając jego ładunek konfiguracyjny.

</Accordion>

## Wykrywanie i kolejność pierwszeństwa

OpenClaw skanuje Pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki plików lub katalogów. Ścieżki wskazujące
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
    Dostarczane z OpenClaw. Wiele jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Instalacje pakietowe i obrazy Docker zwykle rozwiązują dołączone Pluginy z
skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy dołączonego Pluginu jest
zamontowany przez bind mount na pasującej spakowanej ścieżce źródłowej, na przykład
`/app/extensions/synology-chat`, OpenClaw traktuje ten zamontowany katalog źródłowy
jako nakładkę źródłową dołączonego Pluginu i wykrywa go przed spakowanym pakietem
`/app/dist/extensions/synology-chat`. Dzięki temu pętle kontenerowe opiekunów
działają bez przełączania każdego dołączonego Pluginu z powrotem na źródła TypeScript.
Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane pakiety dist,
nawet gdy obecne są montowania nakładek źródłowych.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy i pomija pracę wykrywania/ładowania Pluginów
- `plugins.deny` zawsze ma pierwszeństwo przed zezwoleniem
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone Pluginy stosują wbudowany domyślnie włączony zestaw, chyba że zostaną nadpisane
- Wyłączne sloty mogą wymusić włączenie wybranego Pluginu dla tego slotu
- Niektóre dołączone Pluginy wymagające zgody są włączane automatycznie, gdy konfiguracja nazywa
  powierzchnię należącą do Pluginu, taką jak referencja modelu dostawcy, konfiguracja kanału lub
  środowisko uruchomieniowe harness
- Nieaktualna konfiguracja Pluginu jest zachowywana, gdy aktywne jest `plugins.enabled: false`;
  włącz Pluginy ponownie przed uruchomieniem czyszczenia przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy Codex z rodziny OpenAI zachowują oddzielne granice Pluginów:
  `openai-codex/*` należy do Pluginu OpenAI, a dołączony Plugin serwera aplikacji Codex
  jest wybierany przez `agentRuntime.id: "codex"` albo starsze
  referencje modeli `codex/*`

## Rozwiązywanie problemów z hookami czasu działania

Jeśli Plugin pojawia się w `plugins list`, ale efekty uboczne `register(api)` lub hooki
nie uruchamiają się w ruchu czatu na żywo, najpierw sprawdź te kwestie:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywny
  URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Zrestartuj działający Gateway po zmianach instalacji/konfiguracji/kodu Pluginu. W kontenerach
  opakowujących PID 1 może być tylko nadzorcą; zrestartuj lub zasygnalizuj proces potomny
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Niedostarczane w pakiecie hooki konwersacji, takie jak `llm_input`,
  `llm_output`, `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Uruchamia się przed
  rozwiązywaniem modelu dla tur agenta; `llm_output` działa dopiero po próbie modelu,
  która wytworzy wyjście asystenta.
- Jako dowodu efektywnego modelu sesji użyj `openclaw sessions` albo
  powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Powolna konfiguracja narzędzi Pluginu

Jeśli tury agenta wydają się zatrzymywać podczas przygotowywania narzędzi, włącz logowanie śledzące i
sprawdź wiersze czasów fabryk narzędzi Pluginów:

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
opcjonalne. Wolne wiersze są awansowane do ostrzeżeń, gdy pojedyncza fabryka zajmuje
co najmniej 1 s albo całkowite przygotowanie fabryk narzędzi Pluginów zajmuje co najmniej 5 s.

OpenClaw buforuje udane wyniki fabryk narzędzi Pluginów dla powtarzanych rozwiązań
z tym samym efektywnym kontekstem żądania. Klucz pamięci podręcznej obejmuje efektywną
konfigurację czasu działania, obszar roboczy, identyfikatory agenta/sesji, politykę sandboxa, ustawienia przeglądarki,
kontekst dostarczania, tożsamość żądającego i stan własności, więc fabryki
zależne od tych zaufanych pól są uruchamiane ponownie, gdy kontekst się zmieni.

Jeśli jeden Plugin dominuje w czasach, sprawdź jego rejestracje czasu działania:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, zainstaluj ponownie albo wyłącz ten Plugin. Autorzy Pluginów powinni przenieść
kosztowne ładowanie zależności za ścieżkę wykonywania narzędzia, zamiast wykonywać je
wewnątrz fabryki narzędzia.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznacza to, że więcej niż jeden włączony Plugin próbuje posiadać ten sam kanał,
przepływ konfiguracji albo nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny Plugin kanału
zainstalowany obok dołączonego Pluginu, który teraz udostępnia ten sam identyfikator kanału.

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
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę za pomocą
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację
  Pluginu.
- Jeśli jawnie włączono oba Pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do Pluginów,
  aby powierzchnia czasu działania była jednoznaczna.

## Sloty Pluginów (kategorie wyłączne)

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

| Slot            | Co kontroluje         | Domyślnie           |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin Active Memory  | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

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

Dołączone Pluginy są dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony Plugin przeglądarki). Inne dołączone Pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany Plugin lub pakiet hooków w miejscu. Użyj `openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych Pluginów npm. Nie jest obsługiwane z `--link`, które ponownie używa ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje identyfikator zainstalowanego Pluginu do tej listy dozwolonych przed jego włączeniem. Jeśli ten sam identyfikator Pluginu znajduje się w `plugins.deny`, instalacja usuwa ten nieaktualny wpis odmowy, aby jawna instalacja była możliwa do załadowania natychmiast po restarcie.

OpenClaw utrzymuje trwały lokalny rejestr Pluginów jako model odczytu na zimno dla inwentarza Pluginów, własności wkładów i planowania uruchamiania. Przepływy instalacji, aktualizacji, odinstalowania, włączania i wyłączania odświeżają ten rejestr po zmianie stanu Pluginu. Ten sam plik `plugins/installs.json` przechowuje trwałe metadane instalacji w najwyższego poziomu `installRecords` oraz możliwe do odbudowy metadane manifestu w `plugins`. Jeśli rejestr jest nieobecny, nieaktualny lub nieprawidłowy, `openclaw plugins registry --refresh` odbudowuje jego widok manifestu z rekordów instalacji, polityki konfiguracji oraz metadanych manifestu/pakietu bez ładowania modułów wykonawczych Pluginu. `openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie specyfikacji pakietu npm z dist-tagiem lub dokładną wersją rozwiązuje nazwę pakietu z powrotem do śledzonego rekordu Pluginu i zapisuje nową specyfikację na potrzeby przyszłych aktualizacji. Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem do domyślnej linii wydań rejestru. Jeśli zainstalowany Plugin npm już odpowiada rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację bez pobierania, ponownej instalacji ani przepisywania konfiguracji. Gdy `openclaw update` działa na kanale beta, rekordy Pluginów npm i ClawHub z linii domyślnej najpierw próbują `@beta`, a potem wracają do default/latest, gdy nie istnieje wydanie beta Pluginu. Dokładne wersje i jawne tagi pozostają przypięte.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście na wypadek fałszywych alarmów wbudowanego skanera niebezpiecznego kodu. Pozwala instalacjom i aktualizacjom Pluginów kontynuować mimo wbudowanych ustaleń `critical`, ale nadal nie omija blokad polityki Pluginu `before_install` ani blokowania po niepowodzeniu skanowania. Skanowania instalacji ignorują typowe pliki i katalogi testowe, takie jak `tests/`, `__tests__/`, `*.test.*` i `*.spec.*`, aby uniknąć blokowania spakowanych mocków testowych; zadeklarowane punkty wejścia środowiska wykonawczego Pluginu nadal są skanowane, nawet jeśli używają jednej z tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji Pluginu. Instalacje zależności Skills obsługiwane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Jeśli Plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skanowanie, otwórz panel ClawHub albo uruchom `clawhub package rescan <name>`, aby poprosić ClawHub o ponowne sprawdzenie. `--dangerously-force-unsafe-install` wpływa tylko na instalacje na Twojej własnej maszynie; nie prosi ClawHub o ponowne przeskanowanie Pluginu ani o upublicznienie zablokowanego wydania.

Zgodne pakiety uczestniczą w tym samym przepływie list/inspect/enable/disable Pluginów. Obecne wsparcie środowiska wykonawczego obejmuje Skills z pakietu, command-skills Claude, domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` i zadeklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje także wykryte możliwości pakietu oraz obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla Pluginów opartych na pakietach.

Źródłami marketplace mogą być znana nazwa marketplace Claude z `~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace lub ścieżka `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, adres URL repozytorium GitHub albo adres URL git. W przypadku zdalnych marketplace wpisy Pluginów muszą pozostać wewnątrz sklonowanego repozytorium marketplace i używać wyłącznie źródeł ze ścieżkami względnymi.

Pełne szczegóły znajdziesz w [referencji CLI `openclaw plugins`](/pl/cli/plugins).

## Przegląd API Pluginu

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

OpenClaw ładuje obiekt wejściowy i wywołuje `register(api)` podczas aktywacji Pluginu. Loader nadal wraca do `activate(api)` dla starszych Pluginów, ale dołączone Pluginy i nowe zewnętrzne Pluginy powinny traktować `register` jako publiczny kontrakt.

`api.registrationMode` informuje Plugin, dlaczego jego punkt wejścia jest ładowany:

| Tryb            | Znaczenie                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | Aktywacja środowiska wykonawczego. Rejestruj narzędzia, hooki, usługi, polecenia, trasy i inne aktywne skutki uboczne.              |
| `discovery`     | Odkrywanie możliwości tylko do odczytu. Rejestruj dostawców i metadane; zaufany kod wejściowy Pluginu może się załadować, ale pomiń aktywne skutki uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekki punkt wejścia konfiguracji.                                                     |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga także punktu wejścia środowiska wykonawczego.                                            |
| `cli-metadata`  | Tylko zbieranie metadanych poleceń CLI.                                                                                              |

Punkty wejścia Pluginów, które otwierają gniazda, bazy danych, pracowników w tle albo długotrwałych klientów, powinny chronić te skutki uboczne za pomocą `api.registrationMode === "full"`. Ładowania odkrywania są buforowane oddzielnie od ładowań aktywujących i nie zastępują działającego rejestru Gateway. Odkrywanie nie aktywuje, ale nie jest wolne od importów: OpenClaw może ocenić zaufany punkt wejścia Pluginu lub moduł Pluginu kanału, aby zbudować migawkę. Utrzymuj najwyższy poziom modułów lekkim i wolnym od skutków ubocznych, a klientów sieciowych, podprocesy, listenery, odczyty poświadczeń i uruchamianie usług przenieś za ścieżki pełnego środowiska wykonawczego.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje                            |
| --------------------------------------- | ---------------------------------------- |
| `registerProvider`                      | Dostawca modelu (LLM)                    |
| `registerChannel`                       | Kanał czatu                              |
| `registerTool`                          | Narzędzie agenta                         |
| `registerHook` / `on(...)`              | Hooki cyklu życia                        |
| `registerSpeechProvider`                | Text-to-speech / STT                     |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT                         |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos w czasie rzeczywistym |
| `registerMediaUnderstandingProvider`    | Analiza obrazów/audio                    |
| `registerImageGenerationProvider`       | Generowanie obrazów                      |
| `registerMusicGenerationProvider`       | Generowanie muzyki                       |
| `registerVideoGenerationProvider`       | Generowanie wideo                        |
| `registerWebFetchProvider`              | Dostawca pobierania / scrapingu z sieci  |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci                     |
| `registerHttpRoute`                     | Punkt końcowy HTTP                       |
| `registerCommand` / `registerCli`       | Polecenia CLI                            |
| `registerContextEngine`                 | Silnik kontekstu                         |
| `registerService`                       | Usługa w tle                             |

Zachowanie strażników hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` jest no-op i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` jest no-op i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` jest no-op i nie usuwa wcześniejszego anulowania.

Natywny serwer aplikacji Codex przekazuje natywne zdarzenia narzędzi Codex z powrotem do tej powierzchni hooków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`, obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzeniach `PermissionRequest` Codex. Most nie przepisuje jeszcze argumentów natywnych narzędzi Codex. Dokładna granica wsparcia środowiska wykonawczego Codex znajduje się w [kontrakcie wsparcia Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne zachowanie typowanych hooków opisuje [przegląd SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie Pluginów](/pl/plugins/building-plugins) — utwórz własny Plugin
- [Pakiety Pluginów](/pl/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Manifest Pluginu](/pl/plugins/manifest) — schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) — dodaj narzędzia agenta w Pluginie
- [Wewnętrzne mechanizmy Pluginów](/pl/plugins/architecture) — model możliwości i potok ładowania
- [Pluginy społecznościowe](/pl/plugins/community) — listy firm trzecich
