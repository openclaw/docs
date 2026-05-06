---
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Zrozumienie reguł wykrywania i ładowania Pluginów
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instaluj, konfiguruj i zarządzaj pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-05-06T09:34:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
środowiska agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie
wideo, pobieranie z sieci, wyszukiwanie w sieci i nie tylko. Niektóre pluginy są
**rdzeniowe** (dostarczane z OpenClaw), inne są **zewnętrzne**. Większość
zewnętrznych pluginów jest publikowana i odkrywana przez
[ClawHub](/pl/tools/clawhub). Npm pozostaje obsługiwany dla bezpośrednich instalacji
oraz dla tymczasowego zestawu pakietów pluginów należących do OpenClaw do czasu
zakończenia tej migracji.

## Szybki start

Przykłady instalacji, listowania, odinstalowania, aktualizacji i publikowania do
skopiowania i wklejenia znajdziesz w
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

    Następnie skonfiguruj pod `plugins.entries.\<id\>.config` w pliku konfiguracyjnym.

  </Step>

  <Step title="Zarządzanie natywne dla czatu">
    W działającym Gateway polecenia tylko dla właściciela `/plugins enable` i `/plugins disable`
    wyzwalają moduł przeładowywania konfiguracji Gateway. Gateway przeładowuje
    powierzchnie runtime pluginów w procesie, a nowe tury agentów odbudowują swoją
    listę narzędzi z odświeżonego rejestru. `/plugins install` zmienia kod źródłowy
    pluginu, więc Gateway żąda ponownego uruchomienia zamiast udawać, że bieżący
    proces może bezpiecznie przeładować już zaimportowane moduły.

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

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się zamknięciem i wskazuje
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka
ponownej instalacji pluginu wbudowanego dla pluginów, które włączają
`openclaw.install.allowInvalidConfigRecovery`.
Podczas uruchamiania Gateway nieprawidłowa konfiguracja pluginu kończy się zamknięciem,
tak jak każda inna nieprawidłowa konfiguracja. Uruchom `openclaw doctor --fix`, aby
poddać wadliwą konfigurację pluginu kwarantannie przez wyłączenie tego wpisu pluginu
i usunięcie jego nieprawidłowego ładunku konfiguracji; zwykła kopia zapasowa konfiguracji
zachowuje poprzednie wartości.
Gdy konfiguracja kanału odwołuje się do pluginu, którego nie da się już odkryć, ale ten sam
nieaktualny identyfikator pluginu pozostaje w konfiguracji pluginu lub rekordach instalacji,
uruchamianie Gateway zapisuje ostrzeżenia i pomija ten kanał zamiast blokować każdy inny kanał.
Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne wpisy kanału/pluginu; nieznane
klucze kanałów bez dowodów na nieaktualny plugin nadal nie przechodzą walidacji, aby literówki
pozostały widoczne.
Jeśli ustawiono `plugins.enabled: false`, nieaktualne odwołania do pluginów są traktowane jako bezczynne:
uruchamianie Gateway pomija odkrywanie/ładowanie pluginów, a `openclaw doctor` zachowuje
wyłączoną konfigurację pluginów zamiast usuwać ją automatycznie. Ponownie włącz pluginy przed
uruchomieniem czyszczenia przez doctor, jeśli chcesz usunąć nieaktualne identyfikatory pluginów.

Instalacja zależności pluginów odbywa się tylko podczas jawnych przepływów instalacji/aktualizacji
albo naprawy przez doctor. Uruchamianie Gateway, przeładowanie konfiguracji i inspekcja runtime
nie uruchamiają menedżerów pakietów ani nie naprawiają drzew zależności. Lokalne pluginy muszą
mieć już zainstalowane zależności, a pluginy npm, git i ClawHub są instalowane pod zarządzanymi
katalogami głównymi pluginów OpenClaw. Zależności npm mogą zostać hoistowane w zarządzanym
katalogu głównym npm OpenClaw; instalacja/aktualizacja skanuje ten zarządzany katalog główny
przed zaufaniem, a odinstalowanie usuwa pakiety zarządzane przez npm przez npm. Zewnętrzne pluginy
i niestandardowe ścieżki ładowania nadal muszą być instalowane przez `openclaw plugins install`.
Użyj `openclaw plugins list --json`, aby zobaczyć statyczny `dependencyStatus` dla każdego
widocznego pluginu bez importowania kodu runtime ani naprawiania zależności.
Zobacz [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution), aby poznać
cykl życia w czasie instalacji.

### Zablokowana własność ścieżki pluginu

Jeśli diagnostyka pluginów mówi
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
a po walidacji konfiguracji pojawia się `plugin present but blocked`, OpenClaw znalazł
pliki pluginu należące do innego użytkownika Unix niż proces, który je ładuje.
Pozostaw konfigurację pluginu na miejscu; napraw własność systemu plików albo uruchom
OpenClaw jako ten sam użytkownik, który jest właścicielem katalogu stanu.

W instalacjach Docker oficjalny obraz działa jako `node` (uid `1000`), więc
katalogi konfiguracji i obszaru roboczego OpenClaw montowane z hosta powinny zwykle
należeć do uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jeśli celowo uruchamiasz OpenClaw jako root, napraw zarządzany katalog główny pluginów,
przypisując go zamiast tego do root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Po naprawieniu własności uruchom ponownie `openclaw doctor --fix` albo
`openclaw plugins registry --refresh`, aby utrwalony rejestr pluginów odpowiadał
naprawionym plikom.

W instalacjach npm mutowalne selektory, takie jak `latest` albo dist-tag, są rozwiązywane
przed instalacją, a następnie przypinane do dokładnie zweryfikowanej wersji w zarządzanym
katalogu głównym npm OpenClaw. Po zakończeniu npm OpenClaw weryfikuje, że zainstalowany
wpis `package-lock.json` nadal odpowiada rozwiązanej wersji i integralności. Jeśli npm
zapisze inne metadane pakietu, instalacja kończy się niepowodzeniem, a zarządzany pakiet
jest wycofywany zamiast akceptować inny artefakt pluginu.

Checkouty źródłowe są obszarami roboczymi pnpm. Jeśli klonujesz OpenClaw, aby pracować
nad wbudowanymi pluginami, uruchom `pnpm install`; OpenClaw ładuje wtedy wbudowane pluginy z
`extensions/<id>`, więc edycje i zależności lokalne dla pakietu są używane bezpośrednio.
Zwykłe instalacje w katalogu głównym npm są przeznaczone dla spakowanego OpenClaw, a nie dla
developmentu checkoutu źródłowego.

## Typy pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format     | Jak działa                                                         | Przykłady                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Natywny** | `openclaw.plugin.json` + moduł runtime; wykonuje się w procesie    | Oficjalne pluginy, społecznościowe pakiety npm         |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw   | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się pod `openclaw plugins list`. Szczegóły bundle znajdziesz w [Plugin Bundles](/pl/plugins/bundles).

Jeśli piszesz natywny plugin, zacznij od [Budowanie pluginów](/pl/plugins/building-plugins)
oraz [Przegląd Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety npm pluginów muszą deklarować `openclaw.extensions` w `package.json`.
Każdy wpis musi pozostać wewnątrz katalogu pakietu i rozwiązywać się do czytelnego
pliku runtime albo do pliku źródłowego TypeScript z wywnioskowanym zbudowanym odpowiednikiem
JavaScript, takim jak `src/index.ts` do `dist/index.js`.
Spakowane instalacje muszą dostarczać ten wynik runtime JavaScript. Fallback do źródła
TypeScript jest przeznaczony dla checkoutów źródłowych i lokalnych ścieżek developmentu,
a nie dla pakietów npm instalowanych w zarządzanym katalogu głównym pluginów OpenClaw.

Jeśli ostrzeżenie pakietu zarządzanego mówi, że `requires compiled runtime output for
TypeScript entry ...`, pakiet został opublikowany bez plików JavaScript potrzebnych
OpenClaw w runtime. To problem pakowania pluginu, a nie lokalnej konfiguracji.
Zaktualizuj lub zainstaluj ponownie plugin po tym, jak wydawca ponownie opublikuje
skompilowany JavaScript, albo wyłącz/odinstaluj ten plugin do czasu dostępności
naprawionego pakietu.

Użyj `openclaw.runtimeExtensions`, gdy opublikowane pliki runtime nie znajdują się w tych
samych ścieżkach co wpisy źródłowe. Gdy `runtimeExtensions` jest obecne, musi zawierać
dokładnie jeden wpis dla każdego wpisu `extensions`. Niedopasowane listy powodują
niepowodzenie instalacji i odkrywania pluginów zamiast cicho wracać do ścieżek źródłowych.
Jeśli publikujesz także `openclaw.setupEntry`, użyj `openclaw.runtimeSetupEntry` dla jego
zbudowanego odpowiednika JavaScript; ten plik jest wymagany, gdy zostanie zadeklarowany.

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
wydania OpenClaw zawierają już wiele oficjalnych pluginów, więc w normalnych konfiguracjach
nie wymagają one osobnych instalacji npm. Dopóki każdy plugin należący do OpenClaw nie
przejdzie migracji do ClawHub, OpenClaw nadal dostarcza niektóre pakiety pluginów `@openclaw/*`
w npm dla starszych/niestandardowych instalacji i bezpośrednich przepływów npm.

Jeśli npm zgłasza pakiet pluginu `@openclaw/*` jako przestarzały, ta wersja pakietu pochodzi
ze starszej zewnętrznej linii pakietów. Użyj wbudowanego pluginu z bieżącego OpenClaw albo
lokalnego checkoutu, dopóki nowszy pakiet npm nie zostanie opublikowany.

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

### Rdzeniowe (dostarczane z OpenClaw)

<AccordionGroup>
  <Accordion title="Dostawcy modeli (włączeni domyślnie)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginy pamięci">
    - `memory-core` - wbudowane wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` - pamięć długoterminowa oparta na LanceDB z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

    Zobacz [Memory LanceDB](/pl/plugins/memory-lancedb), aby skonfigurować embeddingi zgodne z OpenAI,
    przykłady Ollama, limity przywoływania i rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Dostawcy mowy (włączeni domyślnie)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` - dołączony Plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska wykonawczego przeglądarki i domyślnej usługi sterowania przeglądarką (włączony domyślnie; wyłącz przed zastąpieniem)
    - `copilot-proxy` - most VS Code Copilot Proxy (domyślnie wyłączony)

  </Accordion>
</AccordionGroup>

Szukasz Pluginów zewnętrznych? Zobacz [Pluginy społeczności](/pl/plugins/community).

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
| `deny`             | Lista blokowanych Pluginów (opcjonalnie; blokada ma pierwszeństwo) |
| `load.paths`       | Dodatkowe pliki/katalogi Pluginów                         |
| `slots`            | Wyłączne selektory slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Przełączniki i konfiguracja dla poszczególnych Pluginów   |

`plugins.allow` jest wyłączna. Gdy nie jest pusta, tylko wymienione Pluginy mogą się ładować
lub udostępniać narzędzia, nawet jeśli `tools.allow` zawiera `"*"` albo konkretną nazwę
narzędzia należącego do Pluginu. Jeśli lista dozwolonych narzędzi odwołuje się do narzędzi Pluginów, dodaj identyfikatory
Pluginów właścicieli do `plugins.allow` albo usuń `plugins.allow`; `openclaw doctor` ostrzega o takiej
postaci konfiguracji.

`plugins.bundledDiscovery` domyślnie ma wartość `"allowlist"` dla nowych konfiguracji, więc
restrykcyjny inwentarz `plugins.allow` blokuje też pominięte dołączone Pluginy dostawców,
w tym wykrywanie dostawców wyszukiwania w sieci w czasie wykonywania. Doctor oznacza starsze
restrykcyjne konfiguracje list dozwolonych wartością `"compat"` podczas migracji, aby aktualizacje zachowały
starsze zachowanie dołączonych dostawców do czasu, aż operator wybierze bardziej restrykcyjny tryb.
Pusta wartość `plugins.allow` nadal jest traktowana jako nieustawiona/otwarta.

Zmiany konfiguracji wykonane przez `/plugins enable` lub `/plugins disable` wyzwalają
przeładowanie Pluginów Gateway w procesie. Nowe tury agenta odbudowują listę narzędzi z
odświeżonego rejestru Pluginów. Operacje zmieniające źródła, takie jak instalacja,
aktualizacja i odinstalowanie, nadal restartują proces Gateway, ponieważ już zaimportowanych
modułów Pluginów nie da się bezpiecznie zastąpić w miejscu.

`openclaw plugins list` to lokalny zrzut rejestru/konfiguracji Pluginów. Włączony
Plugin oznacza tam, że utrwalony rejestr i bieżąca konfiguracja pozwalają
Pluginowi uczestniczyć. Nie dowodzi to, że już działający zdalny Gateway
został przeładowany lub zrestartowany z tym samym kodem Pluginu. W konfiguracjach VPS/kontenerów
z procesami opakowującymi wysyłaj restarty lub zapisy wyzwalające przeładowanie do rzeczywistego
procesu `openclaw gateway run`, albo użyj `openclaw gateway restart` wobec
działającego Gateway, gdy przeładowanie zgłasza błąd.

<Accordion title="Stany Pluginów: wyłączony vs brakujący vs nieprawidłowy">
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
    Dostarczane z OpenClaw. Wiele jest włączonych domyślnie (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Instalacje pakietowe i obrazy Dockera zwykle rozwiązują dołączone Pluginy z
skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy dołączonego Pluginu jest
zamontowany przez bind mount na pasującej spakowanej ścieżce źródłowej, na przykład
`/app/extensions/synology-chat`, OpenClaw traktuje ten zamontowany katalog źródłowy
jako nakładkę źródeł dołączonych i wykrywa go przed spakowanym pakietem
`/app/dist/extensions/synology-chat`. Dzięki temu pętle kontenerowe opiekunów
działają bez przełączania każdego dołączonego Pluginu z powrotem na źródła TypeScript.
Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić spakowane pakiety dist
nawet wtedy, gdy obecne są montowania nakładek źródeł.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy i pomija pracę wykrywania/ładowania Pluginów
- `plugins.deny` zawsze ma pierwszeństwo przed allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą być jawnie włączone)
- Dołączone Pluginy podążają za wbudowanym zestawem domyślnie włączonym, chyba że zostanie nadpisany
- Wyłączne sloty mogą wymusić włączenie wybranego Pluginu dla tego slotu
- Niektóre dołączone Pluginy wymagające zgody są włączane automatycznie, gdy konfiguracja wskazuje
  powierzchnię należącą do Pluginu, taką jak referencja modelu dostawcy, konfiguracja kanału lub środowisko wykonawcze harness
- Nieaktualna konfiguracja Pluginu jest zachowywana, gdy aktywne jest `plugins.enabled: false`;
  ponownie włącz Pluginy przed uruchomieniem czyszczenia doctor, jeśli chcesz usunąć nieaktualne identyfikatory
- Trasy Codex z rodziny OpenAI zachowują oddzielne granice Pluginów:
  `openai-codex/*` należy do Pluginu OpenAI, natomiast dołączony Plugin serwera aplikacji Codex
  jest wybierany przez `agentRuntime.id: "codex"` albo starsze referencje modeli
  `codex/*`

## Rozwiązywanie problemów z hookami czasu wykonywania

Jeśli Plugin pojawia się w `plugins list`, ale efekty uboczne lub hooki `register(api)`
nie działają w ruchu czatu na żywo, najpierw sprawdź te elementy:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywne
  URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Zrestartuj działający Gateway po zmianach instalacji/konfiguracji/kodu Pluginu. W kontenerach
  opakowujących PID 1 może być tylko supervisorem; zrestartuj lub zasygnalizuj proces potomny
  `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --runtime --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Hooki rozmów spoza dołączonych Pluginów, takie jak `llm_input`,
  `llm_output`, `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Do przełączania modeli preferuj `before_model_resolve`. Działa przed rozwiązywaniem modelu
  dla tur agenta; `llm_output` działa dopiero po tym, jak próba modelu
  wygeneruje wyjście asystenta.
- Aby uzyskać dowód efektywnego modelu sesji, użyj `openclaw sessions` lub
  powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Wolna konfiguracja narzędzi Pluginów

Jeśli tury agenta wydają się zatrzymywać podczas przygotowywania narzędzi, włącz logowanie śledzące i
sprawdź wiersze czasu działania fabryk narzędzi Pluginów:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie wymienia łączny czas fabryk i najwolniejsze fabryki narzędzi Pluginów,
w tym identyfikator Pluginu, zadeklarowane nazwy narzędzi, kształt wyniku oraz informację, czy narzędzie jest
opcjonalne. Wolne wiersze są promowane do ostrzeżeń, gdy pojedyncza fabryka zajmuje
co najmniej 1 s albo łączne przygotowanie fabryk narzędzi Pluginów zajmuje co najmniej 5 s.

OpenClaw buforuje udane wyniki fabryk narzędzi Pluginów dla powtarzanych rozwiązań
z tym samym efektywnym kontekstem żądania. Klucz pamięci podręcznej obejmuje efektywną
konfigurację czasu wykonywania, obszar roboczy, identyfikatory agenta/sesji, politykę sandboxa, ustawienia przeglądarki,
kontekst dostarczania, tożsamość żądającego i stan własności, więc fabryki, które
zależą od tych zaufanych pól, są uruchamiane ponownie, gdy kontekst się zmienia.

Jeśli jeden Plugin dominuje w czasie działania, sprawdź jego rejestracje czasu wykonywania:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, ponownie zainstaluj albo wyłącz ten Plugin. Autorzy Pluginów powinni przenieść
kosztowne ładowanie zależności za ścieżkę wykonywania narzędzia zamiast robić to
wewnątrz fabryki narzędzi.

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
  Plugin powinien zadeklarować `channelConfigs.<channel-id>.preferOver` z identyfikatorem Pluginu
  o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę przez
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację Pluginu.
- Jeśli jawnie włączono oba Pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do Pluginu,
  aby powierzchnia czasu wykonywania była jednoznaczna.

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

Dołączone pluginy są dostarczane razem z OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy oraz dołączony plugin przeglądarki). Inne dołączone pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany plugin lub pakiet hooków w miejscu. Do rutynowych aktualizacji śledzonych pluginów npm używaj `openclaw plugins update <id-or-npm-spec>`. Nie jest to obsługiwane z `--link`, które ponownie używa ścieżki źródłowej zamiast kopiować ją do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje identyfikator zainstalowanego pluginu do tej listy dozwolonych przed jego włączeniem. Jeśli ten sam identyfikator pluginu znajduje się w `plugins.deny`, instalacja usuwa ten nieaktualny wpis odmowy, aby jawnie zainstalowany plugin można było załadować natychmiast po ponownym uruchomieniu.

OpenClaw utrzymuje utrwalony lokalny rejestr pluginów jako model zimnego odczytu dla inwentarza pluginów, własności wkładów i planowania uruchomienia. Przepływy instalacji, aktualizacji, odinstalowania, włączania i wyłączania odświeżają ten rejestr po zmianie stanu pluginu. Ten sam plik `plugins/installs.json` przechowuje trwałe metadane instalacji w najwyższego poziomu `installRecords` oraz odbudowywalne metadane manifestów w `plugins`. Jeśli rejestru brakuje, jest nieaktualny lub nieprawidłowy, `openclaw plugins registry
--refresh` odbudowuje jego widok manifestów z rekordów instalacji, polityki konfiguracji oraz metadanych manifestu/pakietu bez ładowania modułów runtime pluginów.
`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie specyfikacji pakietu npm z tagiem dystrybucyjnym lub dokładną wersją rozwiązuje nazwę pakietu z powrotem do śledzonego rekordu pluginu i zapisuje nową specyfikację dla przyszłych aktualizacji. Przekazanie nazwy pakietu bez wersji przenosi dokładnie przypiętą instalację z powrotem na domyślną linię wydań rejestru. Jeśli zainstalowany plugin npm już pasuje do rozwiązanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację bez pobierania, ponownej instalacji ani przepisywania konfiguracji.
Gdy `openclaw update` działa w kanale beta, rekordy pluginów npm i ClawHub z domyślnej linii najpierw próbują `@beta`, a następnie przechodzą do default/latest, gdy nie istnieje wydanie beta pluginu. Dokładne wersje i jawne tagi pozostają przypięte.

`--pin` działa tylko z npm. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście dla fałszywych alarmów z wbudowanego skanera niebezpiecznego kodu. Pozwala instalacjom i aktualizacjom pluginów kontynuować mimo wbudowanych ustaleń `critical`, ale nadal nie omija blokad polityki pluginu `before_install` ani blokowania po niepowodzeniu skanowania. Skanowanie instalacji ignoruje typowe pliki i katalogi testowe, takie jak `tests/`, `__tests__/`, `*.test.*` i `*.spec.*`, aby uniknąć blokowania spakowanych mocków testowych; zadeklarowane punkty wejścia runtime pluginu nadal są skanowane, nawet jeśli używają jednej z tych nazw.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Jeśli plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skanowanie, otwórz panel ClawHub albo uruchom `clawhub package rescan <name>`, aby poprosić ClawHub o ponowne sprawdzenie. `--dangerously-force-unsafe-install` wpływa tylko na instalacje na Twoim własnym komputerze; nie prosi ClawHub o ponowne przeskanowanie pluginu ani o upublicznienie zablokowanego wydania.

Zgodne pakiety uczestniczą w tym samym przepływie listy/sprawdzania/włączania/wyłączania pluginów. Obecna obsługa runtime obejmuje Skills pakietów, Claude command-skills, domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` i zadeklarowanych w manifeście `lspServers`, Cursor command-skills oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` zgłasza także wykryte możliwości pakietu oraz obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na pakietach.

Źródłami marketplace mogą być znana nazwa marketplace Claude z `~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace lub ścieżka `marketplace.json`, skrót GitHub taki jak `owner/repo`, URL repozytorium GitHub albo URL git. W przypadku zdalnych marketplace wpisy pluginów muszą pozostawać wewnątrz sklonowanego repozytorium marketplace i używać wyłącznie źródeł ścieżek względnych.

Pełne szczegóły znajdziesz w [dokumentacji CLI `openclaw plugins`](/pl/cli/plugins).

## Omówienie API pluginów

Natywne pluginy eksportują obiekt wejściowy, który udostępnia `register(api)`. Starsze pluginy mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe pluginy powinny używać `register`.

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

OpenClaw ładuje obiekt wejściowy i wywołuje `register(api)` podczas aktywacji pluginu. Loader nadal wraca do `activate(api)` dla starszych pluginów, ale dołączone pluginy i nowe zewnętrzne pluginy powinny traktować `register` jako kontrakt publiczny.

`api.registrationMode` informuje plugin, dlaczego jego punkt wejścia jest ładowany:

| Tryb            | Znaczenie                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja runtime. Rejestruj narzędzia, hooki, usługi, polecenia, trasy i inne aktywne efekty uboczne.                           |
| `discovery`     | Wykrywanie możliwości tylko do odczytu. Rejestruj dostawców i metadane; zaufany kod wejściowy pluginu może zostać załadowany, ale pomiń aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekki punkt wejścia konfiguracji.                                                  |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga także punktu wejścia runtime.                                                        |
| `cli-metadata`  | Wyłącznie zbieranie metadanych poleceń CLI.                                                                                      |

Punkty wejścia pluginów, które otwierają gniazda, bazy danych, pracowników w tle lub długotrwałych klientów, powinny zabezpieczać te efekty uboczne warunkiem `api.registrationMode === "full"`. Ładowania wykrywania są buforowane oddzielnie od ładowań aktywujących i nie zastępują działającego rejestru Gateway. Wykrywanie nie aktywuje, ale nie jest wolne od importu: OpenClaw może wykonać zaufany punkt wejścia pluginu lub moduł pluginu kanału, aby zbudować snapshot. Utrzymuj najwyższe poziomy modułów lekkie i wolne od efektów ubocznych, a klientów sieciowych, podprocesy, nasłuchiwacze, odczyty poświadczeń i uruchamianie usług przenieś za ścieżki pełnego runtime.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje                |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Dostawca modeli (LLM)        |
| `registerChannel`                       | Kanał czatu                  |
| `registerTool`                          | Narzędzie agenta             |
| `registerHook` / `on(...)`              | Hooki cyklu życia            |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT             |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos realtime  |
| `registerMediaUnderstandingProvider`    | Analiza obrazów/audio        |
| `registerImageGenerationProvider`       | Generowanie obrazów          |
| `registerMusicGenerationProvider`       | Generowanie muzyki           |
| `registerVideoGenerationProvider`       | Generowanie wideo            |
| `registerWebFetchProvider`              | Dostawca web fetch / scrape  |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci         |
| `registerHttpRoute`                     | Punkt końcowy HTTP           |
| `registerCommand` / `registerCli`       | Polecenia CLI                |
| `registerContextEngine`                 | Silnik kontekstu             |
| `registerService`                       | Usługa w tle                 |

Zachowanie guardów hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` jest no-op i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` jest no-op i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` jest no-op i nie usuwa wcześniejszego anulowania.

Natywny serwer aplikacji Codex mostkuje natywne zdarzenia narzędzi Codex z powrotem do tej powierzchni hooków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`, obserwować wyniki przez `after_tool_call` i uczestniczyć w zatwierdzeniach Codex `PermissionRequest`. Mostek nie przepisuje jeszcze argumentów natywnych narzędzi Codex. Dokładna granica obsługi runtime Codex znajduje się w [kontrakcie obsługi Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne zachowanie typowanych hooków znajdziesz w [omówieniu SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins) - utwórz własny plugin
- [Pakiety pluginów](/pl/plugins/bundles) - zgodność pakietów Codex/Claude/Cursor
- [Manifest pluginu](/pl/plugins/manifest) - schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) - dodawanie narzędzi agenta w pluginie
- [Wewnętrzna architektura pluginów](/pl/plugins/architecture) - model możliwości i potok ładowania
- [Pluginy społeczności](/pl/plugins/community) - listy od firm trzecich
