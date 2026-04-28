---
read_when:
    - Instalowanie lub konfigurowanie Pluginów
    - Zrozumienie zasad wykrywania i ładowania Pluginów
    - Praca z bundlami Pluginów zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instaluj, konfiguruj i zarządzaj Pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-04-26T11:43:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
harnessy agentów, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
głos w czasie rzeczywistym, rozumienie multimediów, generowanie obrazów, generowanie wideo, web fetch, web
search i inne. Niektóre Pluginy są **rdzeniowe** (dostarczane z OpenClaw), inne
są **zewnętrzne** (publikowane w npm przez społeczność).

## Szybki start

<Steps>
  <Step title="Zobacz, co jest załadowane">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Zainstaluj Plugin">
    ```bash
    # Z npm
    openclaw plugins install @openclaw/voice-call

    # Z lokalnego katalogu lub archiwum
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
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Ścieżka instalacji używa tego samego resolvera co CLI: lokalna ścieżka/archiwum, jawne
`clawhub:<pkg>` albo specyfikacja pakietu bez prefiksu (najpierw ClawHub, potem mechanizm rezerwowy npm).

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpieczną odmową i kieruje do
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka ponownej instalacji dołączonego do pakietu Pluginu
dla Pluginów, które wybiorą
`openclaw.install.allowInvalidConfigRecovery`.

Spakowane instalacje OpenClaw nie instalują od razu całego
drzewa zależności środowiska uruchomieniowego każdego dołączonego do pakietu Pluginu. Gdy dołączony do pakietu Plugin należący do OpenClaw jest aktywny z
konfiguracji Pluginu, starszej konfiguracji kanału albo manifestu domyślnie włączonego, uruchamianie
naprawia tylko zadeklarowane zależności środowiska uruchomieniowego tego Pluginu przed jego importem.
Sam utrwalony stan uwierzytelniania kanału nie aktywuje dołączonego do pakietu kanału dla naprawy
zależności środowiska uruchomieniowego Gateway podczas uruchamiania.
Jawne wyłączenie nadal ma pierwszeństwo: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` oraz `channels.<id>.enabled: false`
uniemożliwiają automatyczną naprawę dołączonych do pakietu zależności środowiska uruchomieniowego dla tego Pluginu/kanału.
Niepuste `plugins.allow` również ogranicza naprawę dołączonych do pakietu zależności środowiska uruchomieniowego dla domyślnie włączonych Pluginów;
jawne włączenie dołączonego do pakietu kanału (`channels.<id>.enabled: true`) nadal może
naprawić zależności Pluginu tego kanału.
Zewnętrzne Pluginy i niestandardowe ścieżki ładowania nadal muszą być instalowane przez
`openclaw plugins install`.

## Typy Pluginów

OpenClaw rozpoznaje dwa formaty Pluginów:

| Format     | Jak działa                                                        | Przykłady                                              |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Natywny** | `openclaw.plugin.json` + moduł środowiska uruchomieniowego; wykonuje się w procesie | Oficjalne Pluginy, pakiety społecznościowe npm         |
| **Bundel** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba są widoczne w `openclaw plugins list`. Szczegóły bundli znajdziesz w [Bundlach Pluginów](/pl/plugins/bundles).

Jeśli tworzysz natywny Plugin, zacznij od [Tworzenia Pluginów](/pl/plugins/building-plugins)
i [Przeglądu Plugin SDK](/pl/plugins/sdk-overview).

## Punkty wejścia pakietu

Natywne pakiety npm Pluginów muszą deklarować `openclaw.extensions` w `package.json`.
Każdy wpis musi pozostawać wewnątrz katalogu pakietu i rozwiązywać się do czytelnego
pliku środowiska uruchomieniowego albo do źródłowego pliku TypeScript z wywnioskowanym zbudowanym odpowiednikiem JavaScript,
takim jak `src/index.ts` do `dist/index.js`.

Używaj `openclaw.runtimeExtensions`, gdy opublikowane pliki środowiska uruchomieniowego nie znajdują się pod
tymi samymi ścieżkami co wpisy źródłowe. Jeśli są obecne, `runtimeExtensions` musi zawierać
dokładnie jeden wpis dla każdego wpisu `extensions`. Niezgodne listy powodują niepowodzenie instalacji i
wykrywania Pluginu zamiast cichego przejścia do ścieżek źródłowych.

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

### Instalowalne (npm)

| Plugin           | Pakiet                 | Dokumentacja                         |
| ---------------- | ---------------------- | ------------------------------------ |
| Matrix           | `@openclaw/matrix`     | [Matrix](/pl/channels/matrix)           |
| Microsoft Teams  | `@openclaw/msteams`    | [Microsoft Teams](/pl/channels/msteams) |
| Nostr            | `@openclaw/nostr`      | [Nostr](/pl/channels/nostr)             |
| Voice Call       | `@openclaw/voice-call` | [Voice Call](/pl/plugins/voice-call)    |
| Zalo             | `@openclaw/zalo`       | [Zalo](/pl/channels/zalo)               |
| Zalo Personal    | `@openclaw/zalouser`   | [Zalo Personal](/pl/plugins/zalouser)   |

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
    - `memory-core` — dołączone do pakietu wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — instalowana na żądanie pamięć długoterminowa z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)

  </Accordion>

  <Accordion title="Dostawcy mowy (domyślnie włączeni)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` — dołączony do pakietu Plugin przeglądarki dla narzędzia browser, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska uruchomieniowego przeglądarki i domyślnej usługi sterowania przeglądarką (domyślnie włączony; wyłącz go przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)

  </Accordion>
</AccordionGroup>

Szukasz zewnętrznych Pluginów? Zobacz [Pluginy społecznościowe](/pl/plugins/community).

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
| `allow`          | Allowlist Pluginów (opcjonalnie)                          |
| `deny`           | Denylist Pluginów (opcjonalnie; blokowanie ma pierwszeństwo) |
| `load.paths`     | Dodatkowe pliki/katalogi Pluginów                         |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki i konfiguracja per Plugin                    |

Zmiany konfiguracji **wymagają restartu Gateway**. Jeśli Gateway działa z obserwacją konfiguracji
i restartem w procesie (domyślna ścieżka `openclaw gateway`),
ten restart zwykle jest wykonywany automatycznie chwilę po zapisaniu konfiguracji.
Nie ma obsługiwanej ścieżki hot-reload dla natywnego kodu środowiska uruchomieniowego Pluginu ani hooków
cyklu życia; uruchom ponownie proces Gateway obsługujący aktywny kanał, zanim
zaczniesz oczekiwać działania zaktualizowanego kodu `register(api)`, hooków `api.on(...)`, narzędzi, usług lub
hooków dostawcy/środowiska uruchomieniowego.

`openclaw plugins list` to lokalna migawka rejestru/konfiguracji Pluginów. Plugin
oznaczony tam jako `enabled` oznacza, że utrwalony rejestr i bieżąca konfiguracja pozwalają
mu uczestniczyć. Nie dowodzi to, że już działający zdalny podrzędny Gateway
zrestartował się do tego samego kodu Pluginu. W konfiguracjach VPS/kontenerów z
procesami opakowującymi wysyłaj restarty do rzeczywistego procesu `openclaw gateway run`
albo użyj `openclaw gateway restart` względem działającego Gateway.

<Accordion title="Stany Pluginów: disabled vs missing vs invalid">
  - **Disabled**: Plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja jest zachowywana.
  - **Missing**: konfiguracja odwołuje się do identyfikatora Pluginu, którego wykrywanie nie znalazło.
  - **Invalid**: Plugin istnieje, ale jego konfiguracja nie odpowiada zadeklarowanemu schematowi.

</Accordion>

## Wykrywanie i pierwszeństwo

OpenClaw skanuje Pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki do plików lub katalogów. Ścieżki, które wskazują
    z powrotem na własne spakowane katalogi dołączonych do pakietu Pluginów OpenClaw, są ignorowane;
    uruchom `openclaw doctor --fix`, aby usunąć te nieaktualne aliasy.
  </Step>

  <Step title="Pluginy workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globalne Pluginy">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginy dołączone do pakietu">
    Dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

Spakowane instalacje i obrazy Docker zwykle rozwiązują dołączone do pakietu Pluginy z
skompilowanego drzewa `dist/extensions`. Jeśli katalog źródłowy dołączonego do pakietu Pluginu
jest bind-mounted nad odpowiadającą spakowaną ścieżką źródłową, na przykład
`/app/extensions/synology-chat`, OpenClaw traktuje ten zamontowany katalog źródłowy
jako nakładkę źródeł dołączonych do pakietu i wykrywa go przed spakowanym
bundlem `/app/dist/extensions/synology-chat`. Dzięki temu pętle kontenerowe maintainerów
działają bez przełączania każdego dołączonego do pakietu Pluginu z powrotem na źródła TypeScript.
Ustaw `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, aby wymusić użycie spakowanych bundli dist,
nawet gdy obecne są montowania nakładek źródeł.

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy
- `plugins.deny` zawsze ma pierwszeństwo przed allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z workspace są **domyślnie wyłączone** (muszą być jawnie włączone)
- Pluginy dołączone do pakietu stosują wbudowany zestaw domyślnie włączonych, chyba że zostaną nadpisane
- Wyłączne sloty mogą wymusić włączenie wybranego Pluginu dla tego slotu
- Niektóre dołączone do pakietu Pluginy opt-in są włączane automatycznie, gdy konfiguracja wskazuje
  powierzchnię należącą do Pluginu, taką jak odwołanie do modelu dostawcy, konfiguracja kanału lub harness
  środowiska uruchomieniowego
- Trasy Codex z rodziny OpenAI zachowują oddzielne granice Pluginów:
  `openai-codex/*` należy do Pluginu OpenAI, podczas gdy dołączony do pakietu Plugin Codex
  app-server jest wybierany przez `agentRuntime.id: "codex"` albo starsze
  odwołania do modeli `codex/*`

## Rozwiązywanie problemów z hookami środowiska uruchomieniowego

Jeśli Plugin pojawia się w `plugins list`, ale efekty uboczne `register(api)` albo hooki
nie działają w aktywnym ruchu czatu, sprawdź najpierw to:

- Uruchom `openclaw gateway status --deep --require-rpc` i potwierdź, że aktywne
  URL Gateway, profil, ścieżka konfiguracji i proces są tymi, które edytujesz.
- Uruchom ponownie aktywny Gateway po zmianach instalacji/konfiguracji/kodu Pluginu. W opakowujących
  kontenerach PID 1 może być tylko supervisorem; uruchom ponownie lub wyślij sygnał do podrzędnego
  procesu `openclaw gateway run`.
- Użyj `openclaw plugins inspect <id> --json`, aby potwierdzić rejestracje hooków i
  diagnostykę. Hooki rozmów niedołączone do pakietu, takie jak `llm_input`,
  `llm_output`, `before_agent_finalize` i `agent_end`, wymagają
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- W przypadku przełączania modeli preferuj `before_model_resolve`. Działa on przed
  rozstrzygnięciem modelu dla tur agenta; `llm_output` działa dopiero po tym, jak próba modelu
  wygeneruje dane wyjściowe asystenta.
- Aby uzyskać dowód efektywnego modelu sesji, użyj `openclaw sessions` albo
  powierzchni sesji/statusu Gateway, a podczas debugowania ładunków dostawcy uruchom
  Gateway z `--raw-stream --raw-stream-path <path>`.

### Zduplikowana własność kanału lub narzędzia

Objawy:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Oznaczają one, że więcej niż jeden włączony Plugin próbuje przejąć ten sam kanał,
przepływ konfiguracji albo nazwę narzędzia. Najczęstszą przyczyną jest zewnętrzny Plugin kanału
zainstalowany obok Pluginu dołączonego do pakietu, który teraz udostępnia ten sam identyfikator kanału.

Kroki debugowania:

- Uruchom `openclaw plugins list --enabled --verbose`, aby zobaczyć każdy włączony Plugin
  i jego pochodzenie.
- Uruchom `openclaw plugins inspect <id> --json` dla każdego podejrzanego Pluginu i
  porównaj `channels`, `channelConfigs`, `tools` i diagnostykę.
- Uruchom `openclaw plugins registry --refresh` po zainstalowaniu lub usunięciu
  pakietów Pluginów, aby utrwalone metadane odzwierciedlały bieżącą instalację.
- Uruchom ponownie Gateway po zmianach instalacji, rejestru lub konfiguracji.

Opcje naprawy:

- Jeśli jeden Plugin celowo zastępuje inny dla tego samego identyfikatora kanału,
  preferowany Plugin powinien deklarować `channelConfigs.<channel-id>.preferOver` z
  identyfikatorem Pluginu o niższym priorytecie. Zobacz [/plugins/manifest#replacing-another-channel-plugin](/pl/plugins/manifest#replacing-another-channel-plugin).
- Jeśli duplikat jest przypadkowy, wyłącz jedną stronę przez
  `plugins.entries.<plugin-id>.enabled: false` albo usuń nieaktualną instalację Pluginu.
- Jeśli jawnie włączyłeś oba Pluginy, OpenClaw zachowuje to żądanie i
  zgłasza konflikt. Wybierz jednego właściciela kanału albo zmień nazwy narzędzi należących do Pluginu,
  aby powierzchnia środowiska uruchomieniowego była jednoznaczna.

## Sloty Pluginów (wyłączne kategorie)

Niektóre kategorie są wyłączne (tylko jedna aktywna naraz):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // albo "none", aby wyłączyć
      contextEngine: "legacy", // albo identyfikator Pluginu
    },
  },
}
```

| Slot             | Co kontroluje         | Domyślnie           |
| ---------------- | --------------------- | ------------------- |
| `memory`         | Aktywny Plugin pamięci | `memory-core`      |
| `contextEngine`  | Aktywny kontekst engine | `legacy` (wbudowany) |

## Dokumentacja CLI

```bash
openclaw plugins list                       # kompaktowy spis
openclaw plugins list --enabled            # tylko włączone Pluginy
openclaw plugins list --verbose            # szczegóły per Plugin
openclaw plugins list --json               # spis czytelny maszynowo
openclaw plugins inspect <id>              # szczegółowe informacje
openclaw plugins inspect <id> --json       # format czytelny maszynowo
openclaw plugins inspect --all             # tabela dla całej floty
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostyka
openclaw plugins registry                  # sprawdzenie stanu utrwalonego rejestru
openclaw plugins registry --refresh        # przebudowa utrwalonego rejestru
openclaw doctor --fix                      # naprawa stanu rejestru Pluginów

openclaw plugins install <package>         # instalacja (najpierw ClawHub, potem npm)
openclaw plugins install clawhub:<pkg>     # instalacja tylko z ClawHub
openclaw plugins install <spec> --force    # nadpisanie istniejącej instalacji
openclaw plugins install <path>            # instalacja z lokalnej ścieżki
openclaw plugins install -l <path>         # link (bez kopiowania) dla developmentu
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # zapisanie dokładnej rozstrzygniętej specyfikacji npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aktualizacja jednego Pluginu
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aktualizacja wszystkich
openclaw plugins uninstall <id>          # usunięcie konfiguracji i wpisów indeksu Pluginu
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Pluginy dołączone do pakietu są dostarczane z OpenClaw. Wiele z nich jest domyślnie włączonych (na przykład
dołączeni do pakietu dostawcy modeli, dołączeni do pakietu dostawcy mowy oraz dołączony do pakietu
Plugin przeglądarki). Inne dołączone do pakietu Pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany Plugin albo pakiet hooków w miejscu. Do rutynowych aktualizacji śledzonych npm
Pluginów używaj `openclaw plugins update <id-or-npm-spec>`.
Nie jest to obsługiwane z `--link`, które ponownie używa ścieżki źródłowej zamiast
kopiować nad zarządzany cel instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego Pluginu do tej allowlist przed jego włączeniem. Jeśli ten sam identyfikator Pluginu
występuje w `plugins.deny`, instalacja usuwa ten nieaktualny wpis deny, aby jawnie zainstalowany
Plugin był natychmiast możliwy do załadowania po restarcie.

OpenClaw utrzymuje utrwalony lokalny rejestr Pluginów jako model odczytu cold-path dla
spisu Pluginów, własności wkładów i planowania uruchamiania. Przepływy instalacji, aktualizacji,
odinstalowania, włączania i wyłączania odświeżają ten rejestr po zmianie stanu
Pluginu. Ten sam plik `plugins/installs.json` przechowuje trwałe metadane instalacji w
najwyższego poziomu `installRecords` oraz odtwarzalne metadane manifestu w `plugins`. Jeśli
rejestr jest brakujący, nieaktualny lub nieprawidłowy, `openclaw plugins registry
--refresh` odbudowuje widok manifestu na podstawie rekordów instalacji, polityki konfiguracji i
metadanych manifestu/pakietu bez ładowania modułów środowiska uruchomieniowego Pluginów.
`openclaw plugins update <id-or-npm-spec>` stosuje się do śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag albo dokładną wersją rozwiązuje nazwę pakietu
z powrotem do śledzonego rekordu Pluginu i zapisuje nową specyfikację dla przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi instalację dokładnie przypiętą z powrotem do
domyślnej linii wydań rejestru. Jeśli zainstalowany Plugin npm już odpowiada
rozstrzygniętej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście dla fałszywych
pozytywów z wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje
i aktualizacje Pluginów mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad polityki Pluginu `before_install` ani blokowania z powodu niepowodzenia skanowania.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji Pluginów. Instalacje zależności Skills wspierane przez Gateway
używają zamiast tego odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje oddzielnym przepływem pobierania/instalacji Skills z ClawHub.

Zgodne bundle uczestniczą w tym samym przepływie list/inspect/enable/disable Pluginów.
Obecna obsługa środowiska uruchomieniowego obejmuje bundle Skills, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne wartości Claude `.lsp.json` oraz zadeklarowane w manifeście
wartości `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje również wykryte możliwości bundla oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla Pluginów opartych na bundlach.

Źródłami marketplace mogą być znana nazwa marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalny katalog główny marketplace lub
ścieżka `marketplace.json`, skrócona forma GitHub jak `owner/repo`, adres URL repozytorium GitHub
albo adres URL git. W przypadku zdalnych marketplace wpisy Pluginów muszą pozostawać wewnątrz
sklonowanego repo marketplace i używać wyłącznie źródeł ścieżek względnych.

Pełne szczegóły znajdziesz w [Dokumentacji CLI `openclaw plugins`](/pl/cli/plugins).

## Przegląd API Pluginów

Natywne Pluginy eksportują obiekt wejściowy, który udostępnia `register(api)`. Starsze
Pluginy mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe Pluginy powinny
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

OpenClaw ładuje obiekt wejściowy i wywołuje `register(api)` podczas aktywacji Pluginu.
Loader nadal przechodzi do `activate(api)` dla starszych Pluginów,
ale dołączone do pakietu Pluginy i nowe zewnętrzne Pluginy powinny traktować `register` jako kontrakt publiczny.

`api.registrationMode` informuje Plugin, dlaczego jego wpis jest ładowany:

| Tryb            | Znaczenie                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktywacja środowiska uruchomieniowego. Rejestruj narzędzia, hooki, usługi, polecenia, trasy i inne aktywne efekty uboczne.      |
| `discovery`     | Odkrywanie możliwości tylko do odczytu. Rejestruj dostawców i metadane; zaufany kod wejściowy Pluginu może się załadować, ale pomijaj aktywne efekty uboczne. |
| `setup-only`    | Ładowanie metadanych konfiguracji kanału przez lekki wpis konfiguracji.                                                           |
| `setup-runtime` | Ładowanie konfiguracji kanału, które wymaga również wpisu środowiska uruchomieniowego.                                           |
| `cli-metadata`  | Wyłącznie zbieranie metadanych poleceń CLI.                                                                                       |

Wpisy Pluginów, które otwierają sockety, bazy danych, workerów w tle albo długotrwałych
klientów, powinny chronić te efekty uboczne przez `api.registrationMode === "full"`.
Ładowania discovery są buforowane oddzielnie od ładowań aktywujących i nie zastępują
rejestru działającego Gateway. Discovery nie aktywuje, ale też nie jest wolne od importów:
OpenClaw może wykonać ocenę zaufanego wpisu Pluginu lub modułu Pluginu kanału, aby zbudować
migawkę. Utrzymuj najwyższe poziomy modułów lekkie i pozbawione efektów ubocznych oraz przenoś
klientów sieciowych, podprocesy, listenery, odczyty poświadczeń i uruchamianie usług
za ścieżki pełnego środowiska uruchomieniowego.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje               |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Dostawcę modeli (LLM)       |
| `registerChannel`                       | Kanał czatu                 |
| `registerTool`                          | Narzędzie agenta            |
| `registerHook` / `on(...)`              | Hooki cyklu życia           |
| `registerSpeechProvider`                | Zamianę tekstu na mowę / STT |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT            |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos w czasie rzeczywistym |
| `registerMediaUnderstandingProvider`    | Analizę obrazów/audio       |
| `registerImageGenerationProvider`       | Generowanie obrazów         |
| `registerMusicGenerationProvider`       | Generowanie muzyki          |
| `registerVideoGenerationProvider`       | Generowanie wideo           |
| `registerWebFetchProvider`              | Dostawcę web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | Punkt końcowy HTTP          |
| `registerCommand` / `registerCli`       | Polecenia CLI               |
| `registerContextEngine`                 | Kontekst engine             |
| `registerService`                       | Usługę działającą w tle     |

Zachowanie ochrony hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie usuwa wcześniejszego anulowania.

Natywne uruchomienia Codex app-server mostkują zdarzenia narzędzi natywnych dla Codex z powrotem do tej
powierzchni hooków. Pluginy mogą blokować natywne narzędzia Codex przez `before_tool_call`,
obserwować wyniki przez `after_tool_call` oraz uczestniczyć w akceptacjach
Codex `PermissionRequest`. Most nie przepisuje jeszcze argumentów narzędzi natywnych dla Codex. Dokładna granica obsługi środowiska uruchomieniowego Codex znajduje się w
[kontrakcie obsługi Codex harness v1](/pl/plugins/codex-harness#v1-support-contract).

Pełne informacje o zachowaniu typowanych hooków znajdziesz w [Przeglądzie SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie Pluginów](/pl/plugins/building-plugins) — utwórz własny Plugin
- [Bundle Pluginów](/pl/plugins/bundles) — zgodność bundli Codex/Claude/Cursor
- [Manifest Pluginu](/pl/plugins/manifest) — schemat manifestu
- [Rejestrowanie narzędzi](/pl/plugins/building-plugins#registering-agent-tools) — dodawanie narzędzi agenta w Pluginie
- [Elementy wewnętrzne Pluginów](/pl/plugins/architecture) — model możliwości i pipeline ładowania
- [Pluginy społecznościowe](/pl/plugins/community) — listy zewnętrzne
