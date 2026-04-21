---
read_when:
    - Instalowanie lub konfigurowanie Plugin.
    - Zrozumienie reguł wykrywania i ładowania Plugin.
    - Praca z pakietami Plugin zgodnymi z Codex/Claude.
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie Plugin OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-04-21T10:01:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Pluginy

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
narzędzia, Skills, mowę, transkrypcję realtime, głos realtime,
rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci,
wyszukiwanie w sieci i inne. Niektóre Pluginy są **core** (dostarczane z OpenClaw), inne
są **zewnętrzne** (publikowane na npm przez społeczność).

## Szybki start

<Steps>
  <Step title="Sprawdź, co jest załadowane">
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
`clawhub:<pkg>` albo specyfikacja pakietu bez prefiksu (najpierw ClawHub, potem fallback do npm).

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle domyślnie kończy się bez zmian i kieruje do
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka ponownej instalacji bundled-plugin
dla Plugin, które wybiorą
`openclaw.install.allowInvalidConfigRecovery`.

Spakowane instalacje OpenClaw nie instalują od razu całego drzewa zależności środowiska uruchomieniowego każdego bundled plugin.
Gdy dołączony Plugin należący do OpenClaw jest aktywny przez konfigurację Plugin,
starszą konfigurację kanału lub manifest włączony domyślnie, naprawy startowe
instalują tylko zadeklarowane przez ten Plugin zależności środowiska uruchomieniowego przed jego importem.
Zewnętrzne Plugin i niestandardowe ścieżki ładowania nadal muszą być instalowane przez
`openclaw plugins install`.

## Typy Plugin

OpenClaw rozpoznaje dwa formaty Plugin:

| Format     | Jak działa                                                       | Przykłady                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Natywny** | `openclaw.plugin.json` + moduł środowiska uruchomieniowego; wykonywany w procesie | Oficjalne Pluginy, pakiety społeczności na npm         |
| **Pakiet** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się w `openclaw plugins list`. Szczegóły pakietów znajdziesz w [Plugin Bundles](/pl/plugins/bundles).

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
  <Accordion title="Dostawcy modeli (włączeni domyślnie)">
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

  <Accordion title="Dostawcy mowy (włączeni domyślnie)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` — dołączony Plugin przeglądarki dla narzędzia przeglądarki, CLI `openclaw browser`, metody Gateway `browser.request`, środowiska uruchomieniowego przeglądarki i domyślnej usługi sterowania przeglądarką (włączony domyślnie; wyłącz go przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)
  </Accordion>
</AccordionGroup>

Szukasz Plugin zewnętrznych? Zobacz [Community Plugins](/pl/plugins/community).

## Konfiguracja

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Pole             | Opis                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Główny przełącznik (domyślnie: `true`)                    |
| `allow`          | Lista dozwolonych Plugin (opcjonalnie)                    |
| `deny`           | Lista zabronionych Plugin (opcjonalnie; `deny` wygrywa)   |
| `load.paths`     | Dodatkowe pliki/katalogi Plugin                           |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki per Plugin + konfiguracja                    |

Zmiany konfiguracji **wymagają restartu Gateway**. Jeśli Gateway działa z obserwowaniem konfiguracji
i restartem w procesie (domyślna ścieżka `openclaw gateway`),
ten restart zwykle jest wykonywany automatycznie chwilę po zapisaniu zmian konfiguracji.

<Accordion title="Stany Plugin: disabled vs missing vs invalid">
  - **Disabled**: Plugin istnieje, ale reguły włączania go wyłączyły. Konfiguracja zostaje zachowana.
  - **Missing**: konfiguracja odwołuje się do identyfikatora Plugin, którego wykrywanie nie znalazło.
  - **Invalid**: Plugin istnieje, ale jego konfiguracja nie odpowiada zadeklarowanemu schematowi.
</Accordion>

## Wykrywanie i pierwszeństwo

OpenClaw skanuje Pluginy w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki plików lub katalogów.
  </Step>

  <Step title="Rozszerzenia workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` i `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Rozszerzenia globalne">
    `~/.openclaw/<plugin-root>/*.ts` i `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dołączone Pluginy">
    Dostarczane z OpenClaw. Wiele jest włączonych domyślnie (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie Pluginy
- `plugins.deny` zawsze wygrywa nad `allow`
- `plugins.entries.\<id\>.enabled: false` wyłącza ten Plugin
- Pluginy pochodzące z workspace są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone Pluginy stosują wbudowany domyślny zestaw włączonych, chyba że zostanie nadpisany
- Wyłączne sloty mogą wymusić włączenie wybranego Plugin dla danego slotu

## Sloty Plugin (wyłączne kategorie)

Niektóre kategorie są wyłączne (tylko jedna może być aktywna jednocześnie):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // lub "none", aby wyłączyć
      contextEngine: "legacy", // lub identyfikator Plugin
    },
  },
}
```

| Slot            | Co kontroluje          | Domyślnie           |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Aktywny Plugin pamięci | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

## Dokumentacja CLI

```bash
openclaw plugins list                       # kompaktowy spis
openclaw plugins list --enabled            # tylko załadowane Pluginy
openclaw plugins list --verbose            # szczegółowe linie per Plugin
openclaw plugins list --json               # spis do odczytu maszynowego
openclaw plugins inspect <id>              # szczegółowe informacje
openclaw plugins inspect <id> --json       # format do odczytu maszynowego
openclaw plugins inspect --all             # tabela całej floty
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostyka

openclaw plugins install <package>         # instalacja (najpierw ClawHub, potem npm)
openclaw plugins install clawhub:<pkg>     # instalacja tylko z ClawHub
openclaw plugins install <spec> --force    # nadpisanie istniejącej instalacji
openclaw plugins install <path>            # instalacja z lokalnej ścieżki
openclaw plugins install -l <path>         # linkowanie (bez kopiowania) do developmentu
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # zapisanie dokładnie rozstrzygniętej specyfikacji npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # aktualizacja jednego Plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # aktualizacja wszystkich
openclaw plugins uninstall <id>          # usunięcie rekordów konfiguracji/instalacji
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Dołączone Pluginy są dostarczane z OpenClaw. Wiele jest włączonych domyślnie (na przykład
dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony Plugin
przeglądarki). Inne dołączone Pluginy nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejący zainstalowany Plugin lub pakiet hooków na miejscu.
Nie jest obsługiwane z `--link`, które ponownie używa ścieżki źródłowej zamiast
kopiować nad zarządzany cel instalacji.

`--pin` dotyczy tylko npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne nadpisanie dla fałszywych
trafień z wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje
i aktualizacje Plugin mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad polityki `before_install` Plugin ani blokad wynikających z błędów skanowania.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji Plugin. Instalacje zależności Skills
obsługiwane przez Gateway używają zamiast tego odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

Zgodne pakiety uczestniczą w tym samym przepływie list/inspect/enable/disable Plugin. Obecna obsługa środowiska uruchomieniowego obejmuje Skills z pakietów, command-skills Claude,
domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` i deklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje również wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla Plugin opartych na pakietach.

Źródła marketplace mogą być znaną nazwą marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalnym katalogiem marketplace lub ścieżką `marketplace.json`, skrótem GitHub takim jak `owner/repo`, adresem URL repozytorium GitHub albo adresem git URL. Dla zdalnych marketplace wpisy Plugin muszą pozostać wewnątrz sklonowanego repozytorium marketplace i używać tylko względnych źródeł ścieżek.

Pełne szczegóły znajdziesz w [dokumentacji CLI `openclaw plugins`](/cli/plugins).

## Przegląd API Plugin

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

OpenClaw ładuje obiekt wejściowy i wywołuje `register(api)` podczas
aktywacji Plugin. Loader nadal przechodzi awaryjnie do `activate(api)` dla starszych Plugin,
ale bundled plugins i nowe zewnętrzne Pluginy powinny traktować `register` jako
publiczny kontrakt.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje               |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Dostawcę modeli (LLM)       |
| `registerChannel`                       | Kanał czatu                 |
| `registerTool`                          | Narzędzie agenta            |
| `registerHook` / `on(...)`              | Hooki cyklu życia           |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos realtime |
| `registerMediaUnderstandingProvider`    | Analizę obrazów/audio       |
| `registerImageGenerationProvider`       | Generowanie obrazów         |
| `registerMusicGenerationProvider`       | Generowanie muzyki          |
| `registerVideoGenerationProvider`       | Generowanie wideo           |
| `registerWebFetchProvider`              | Dostawcę web fetch / scrape |
| `registerWebSearchProvider`             | Wyszukiwanie w sieci        |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Polecenia CLI               |
| `registerContextEngine`                 | Silnik kontekstu            |
| `registerService`                       | Usługę działającą w tle     |

Zachowanie guardów hooków dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie czyści wcześniejszego anulowania.

Pełne zachowanie typowanych hooków znajdziesz w [SDK Overview](/pl/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Building Plugins](/pl/plugins/building-plugins) — utwórz własny Plugin
- [Plugin Bundles](/pl/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Plugin Manifest](/pl/plugins/manifest) — schemat manifestu
- [Registering Tools](/pl/plugins/building-plugins#registering-agent-tools) — dodawanie narzędzi agenta w Plugin
- [Plugin Internals](/pl/plugins/architecture) — model możliwości i potok ładowania
- [Community Plugins](/pl/plugins/community) — listy zewnętrzne
