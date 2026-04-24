---
read_when:
    - Instalowanie lub konfigurowanie Pluginów
    - Zrozumienie reguł wykrywania i ładowania Pluginów
    - Praca z pakietami Pluginów zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalacja, konfiguracja i zarządzanie Pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-04-24T09:37:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, providery modeli,
harnessy agentów, narzędzia, Skills, mowę, transkrypcję realtime, głos realtime,
rozumienie mediów, generowanie obrazów, generowanie wideo, web fetch, web
search i inne. Niektóre pluginy są **core** (dostarczane z OpenClaw), a inne
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

    Następnie skonfiguruj w `plugins.entries.\<id\>.config` w swoim pliku konfiguracyjnym.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i użyj:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Ścieżka instalacji używa tego samego resolvera co CLI: lokalna ścieżka/archiwum, jawne
`clawhub:<pkg>` albo zwykła specyfikacja pakietu (najpierw ClawHub, potem fallback do npm).

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpieczną odmową i wskazuje
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka ponownej instalacji dołączonego Pluginu
dla pluginów, które włączają
`openclaw.install.allowInvalidConfigRecovery`.

Spakowane instalacje OpenClaw nie instalują z wyprzedzeniem całego drzewa zależności runtime każdego dołączonego pluginu.
Gdy dołączony Plugin należący do OpenClaw jest aktywny na podstawie konfiguracji pluginu,
starszej konfiguracji kanału lub manifestu włączonego domyślnie, uruchomienie
naprawia tylko zadeklarowane zależności runtime tego pluginu przed jego zaimportowaniem.
Zewnętrzne pluginy i własne ścieżki ładowania nadal muszą być instalowane przez
`openclaw plugins install`.

## Typy Pluginów

OpenClaw rozpoznaje dwa formaty Pluginów:

| Format     | Jak działa                                                       | Przykłady                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Natywny** | `openclaw.plugin.json` + moduł runtime; wykonywany w procesie   | Oficjalne Pluginy, pakiety npm społeczności            |
| **Bundle** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Szczegóły bundle znajdziesz w [Plugin Bundles](/pl/plugins/bundles).

Jeśli piszesz natywny Plugin, zacznij od [Building Plugins](/pl/plugins/building-plugins)
i [Plugin SDK Overview](/pl/plugins/sdk-overview).

## Oficjalne Pluginy

### Instalowalne (npm)

| Plugin          | Pakiet                 | Dokumentacja                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/pl/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/pl/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/pl/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pl/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/pl/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/pl/plugins/zalouser)   |

### Core (dostarczane z OpenClaw)

<AccordionGroup>
  <Accordion title="Providery modeli (włączone domyślnie)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginy pamięci">
    - `memory-core` — dołączone wyszukiwanie pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — instalowana na żądanie pamięć długoterminowa z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Providery mowy (włączone domyślnie)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` — dołączony Plugin przeglądarki dla narzędzia browser, CLI `openclaw browser`, metody gateway `browser.request`, runtime przeglądarki i domyślnej usługi sterowania przeglądarką (włączony domyślnie; wyłącz go przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)
  </Accordion>
</AccordionGroup>

Szukasz Pluginów firm trzecich? Zobacz [Community Plugins](/pl/plugins/community).

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
| `allow`          | Lista dozwolonych Pluginów (opcjonalnie)                  |
| `deny`           | Lista zablokowanych Pluginów (opcjonalnie; deny ma pierwszeństwo) |
| `load.paths`     | Dodatkowe pliki/katalogi Pluginów                         |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki i konfiguracja per Plugin                    |

Zmiany konfiguracji **wymagają restartu gateway**. Jeśli Gateway działa z obserwacją konfiguracji
i włączonym restartem w procesie (domyślna ścieżka `openclaw gateway`), ten
restart zwykle jest wykonywany automatycznie chwilę po zapisaniu konfiguracji.

<Accordion title="Stany Pluginu: disabled vs missing vs invalid">
  - **Disabled**: plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja zostaje zachowana.
  - **Missing**: konfiguracja odwołuje się do identyfikatora pluginu, którego wykrywanie nie znalazło.
  - **Invalid**: plugin istnieje, ale jego konfiguracja nie pasuje do zadeklarowanego schematu.
</Accordion>

## Wykrywanie i priorytet

OpenClaw skanuje Pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki plików lub katalogów.
  </Step>

  <Step title="Pluginy workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globalne Pluginy">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dołączone Pluginy">
    Dostarczane z OpenClaw. Wiele z nich jest włączonych domyślnie (providery modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy
- `plugins.deny` zawsze ma pierwszeństwo nad allow
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z workspace są **domyślnie wyłączone** (muszą być jawnie włączone)
- Dołączone Pluginy stosują wbudowany zestaw domyślnie włączonych, chyba że zostanie nadpisany
- Wyłączne sloty mogą wymusić włączenie wybranego Pluginu dla tego slotu
- Niektóre dołączone pluginy typu opt-in są włączane automatycznie, gdy konfiguracja wskazuje
  powierzchnię należącą do pluginu, taką jak odwołanie do modelu providera, konfiguracja kanału lub runtime harnessu
- Trasy Codex z rodziny OpenAI zachowują osobne granice pluginów:
  `openai-codex/*` należy do Pluginu OpenAI, podczas gdy dołączony Plugin
  serwera aplikacji Codex jest wybierany przez `embeddedHarness.runtime: "codex"` lub starsze
  odwołania do modeli `codex/*`

## Sloty Pluginów (wyłączne kategorie)

Niektóre kategorie są wyłączne (tylko jedna może być aktywna jednocześnie):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // lub "none", aby wyłączyć
      contextEngine: "legacy", // lub identyfikator pluginu
    },
  },
}
```

| Slot            | Co kontroluje          | Domyślnie           |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Aktywny Plugin pamięci | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

## Dokumentacja referencyjna CLI

```bash
openclaw plugins list                       # zwięzły spis
openclaw plugins list --enabled            # tylko załadowane Pluginy
openclaw plugins list --verbose            # szczegółowe wiersze per Plugin
openclaw plugins list --json               # spis czytelny maszynowo
openclaw plugins inspect <id>              # pełne szczegóły
openclaw plugins inspect <id> --json       # format czytelny maszynowo
openclaw plugins inspect --all             # tabela dla całej floty
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostyka

openclaw plugins install <package>         # instalacja (najpierw ClawHub, potem npm)
openclaw plugins install clawhub:<pkg>     # instalacja tylko z ClawHub
openclaw plugins install <spec> --force    # nadpisanie istniejącej instalacji
openclaw plugins install <path>            # instalacja z lokalnej ścieżki
openclaw plugins install -l <path>         # linkowanie (bez kopiowania) do dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # zapis dokładnie rozpoznanej specyfikacji npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aktualizacja jednego Pluginu
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aktualizacja wszystkich
openclaw plugins uninstall <id>          # usunięcie konfiguracji/rejestrów instalacji
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Dołączone Pluginy są dostarczane z OpenClaw. Wiele z nich jest włączonych domyślnie (na przykład
dołączone providery modeli, dołączone providery mowy oraz dołączony Plugin
przeglądarki). Inne dołączone Pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany Plugin lub pakiet hooków w miejscu. Używaj
`openclaw plugins update <id-or-npm-spec>` do rutynowych aktualizacji śledzonych pluginów npm.
Nie jest to obsługiwane z `--link`, które ponownie używa ścieżki źródłowej zamiast
kopiować do zarządzanego celu instalacji.

Gdy `plugins.allow` jest już ustawione, `openclaw plugins install` dodaje
identyfikator zainstalowanego pluginu do tej listy dozwolonych przed jego włączeniem, dzięki czemu instalacje są
natychmiast gotowe do załadowania po restarcie.

`openclaw plugins update <id-or-npm-spec>` dotyczy śledzonych instalacji. Przekazanie
specyfikacji pakietu npm z dist-tag lub dokładną wersją rozpoznaje nazwę pakietu
z powrotem do śledzonego rekordu pluginu i zapisuje nową specyfikację dla przyszłych aktualizacji.
Przekazanie nazwy pakietu bez wersji przenosi instalację przypiętą do dokładnej wersji z powrotem na
domyślną linię wydań rejestru. Jeśli zainstalowany Plugin npm już odpowiada
rozpoznanej wersji i zapisanej tożsamości artefaktu, OpenClaw pomija aktualizację
bez pobierania, ponownej instalacji ani przepisywania konfiguracji.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace zapisują metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne nadpisanie dla fałszywych
pozytywów z wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje i aktualizacje pluginów
mimo wbudowanych ustaleń `critical`, ale nadal nie omija blokad polityki pluginu `before_install`
ani blokowania przy błędzie skanowania.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills wykonywane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Zgodne bundle uczestniczą w tym samym przepływie `list`/`inspect`/`enable`/`disable`
dla Pluginów. Obecna obsługa runtime obejmuje bundle Skills, Claude command-skills,
domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` i zadeklarowane w manifeście
`lspServers`, Cursor command-skills oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje również wykryte możliwości bundle oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla pluginów opartych na bundle.

Źródła marketplace mogą być nazwą znanego marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalnym katalogiem marketplace lub ścieżką
`marketplace.json`, skrótem GitHub takim jak `owner/repo`, URL repozytorium GitHub
albo URL git. W przypadku zdalnych marketplace wpisy pluginów muszą pozostać w
sklonowanym repozytorium marketplace i używać wyłącznie względnych źródeł ścieżek.

Pełne szczegóły znajdziesz w [dokumentacji referencyjnej CLI `openclaw plugins`](/pl/cli/plugins).

## Przegląd API Pluginów

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

OpenClaw ładuje obiekt wejściowy i wywołuje `register(api)` podczas aktywacji
pluginu. Loader nadal przełącza się awaryjnie na `activate(api)` dla starszych pluginów,
ale dołączone pluginy i nowe pluginy zewnętrzne powinny traktować `register` jako publiczny kontrakt.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje               |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider modelu (LLM)       |
| `registerChannel`                       | Kanał czatu                 |
| `registerTool`                          | Narzędzie agenta            |
| `registerHook` / `on(...)`              | Hooki cyklu życia           |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos realtime |
| `registerMediaUnderstandingProvider`    | Analiza obrazu/dźwięku      |
| `registerImageGenerationProvider`       | Generowanie obrazów         |
| `registerMusicGenerationProvider`       | Generowanie muzyki          |
| `registerVideoGenerationProvider`       | Generowanie wideo           |
| `registerWebFetchProvider`              | Provider web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Polecenia CLI               |
| `registerContextEngine`                 | Silnik kontekstu            |
| `registerService`                       | Usługa działająca w tle     |

Zachowanie hook guard dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie usuwa wcześniejszego anulowania.

Pełne zachowanie typowanych hooków znajdziesz w [SDK Overview](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Building Plugins](/pl/plugins/building-plugins) — utwórz własny Plugin
- [Plugin Bundles](/pl/plugins/bundles) — zgodność bundle Codex/Claude/Cursor
- [Plugin Manifest](/pl/plugins/manifest) — schemat manifestu
- [Registering Tools](/pl/plugins/building-plugins#registering-agent-tools) — dodawanie narzędzi agenta w Pluginie
- [Plugin Internals](/pl/plugins/architecture) — model możliwości i pipeline ładowania
- [Community Plugins](/pl/plugins/community) — listy Pluginów firm trzecich
