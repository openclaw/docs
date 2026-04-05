---
read_when:
    - Instalujesz lub konfigurujesz wtyczki
    - Chcesz zrozumieć reguły wykrywania i ładowania wtyczek
    - Pracujesz z pakietami wtyczek zgodnymi z Codex/Claude
sidebarTitle: Install and Configure
summary: Instalowanie, konfigurowanie i zarządzanie wtyczkami OpenClaw
title: Wtyczki
x-i18n:
    generated_at: "2026-04-05T14:09:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 707bd3625596f290322aeac9fecb7f4c6f45d595fdfb82ded7cbc8e04457ac7f
    source_path: tools/plugin.md
    workflow: 15
---

# Wtyczki

Wtyczki rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
narzędzia, Skills, mowę, transkrypcję realtime, głos realtime,
rozumienie mediów, generowanie obrazów, generowanie wideo, web fetch, web
search i wiele więcej. Niektóre wtyczki są **główne** (dostarczane z OpenClaw), inne
są **zewnętrzne** (publikowane na npm przez społeczność).

## Szybki start

<Steps>
  <Step title="Zobacz, co jest załadowane">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Zainstaluj wtyczkę">
    ```bash
    # Z npm
    openclaw plugins install @openclaw/voice-call

    # Z lokalnego katalogu lub archiwum
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Zrestartuj Gateway">
    ```bash
    openclaw gateway restart
    ```

    Następnie skonfiguruj ją w `plugins.entries.\<id\>.config` w swoim pliku konfiguracyjnym.

  </Step>
</Steps>

Jeśli wolisz sterowanie natywne dla czatu, włącz `commands.plugins: true` i używaj:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Ścieżka instalacji używa tego samego mechanizmu rozwiązywania co CLI: ścieżka/archiwum lokalne, jawne
`clawhub:<pkg>` albo zwykła specyfikacja pakietu (najpierw ClawHub, potem fallback do npm).

Jeśli konfiguracja jest nieprawidłowa, instalacja zwykle kończy się bezpieczną odmową i kieruje do
`openclaw doctor --fix`. Jedynym wyjątkiem odzyskiwania jest wąska ścieżka ponownej instalacji dołączonej wtyczki
dla wtyczek, które optują do
`openclaw.install.allowInvalidConfigRecovery`.

## Typy wtyczek

OpenClaw rozpoznaje dwa formaty wtyczek:

| Format     | Jak działa                                                       | Przykłady                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Natywny** | `openclaw.plugin.json` + moduł runtime; wykonuje się w procesie | Oficjalne wtyczki, pakiety npm społeczności            |
| **Pakiet** | Układ zgodny z Codex/Claude/Cursor; mapowany na funkcje OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Oba pojawiają się pod `openclaw plugins list`. Szczegóły pakietów znajdziesz w [Pakiety wtyczek](/plugins/bundles).

Jeśli piszesz natywną wtyczkę, zacznij od [Tworzenie wtyczek](/plugins/building-plugins)
i [Przegląd Plugin SDK](/plugins/sdk-overview).

## Oficjalne wtyczki

### Instalowalne (npm)

| Wtyczka         | Pakiet                 | Dokumentacja                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/pl/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/pl/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/pl/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/pl/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/plugins/zalouser)   |

### Główne (dostarczane z OpenClaw)

<AccordionGroup>
  <Accordion title="Dostawcy modeli (włączeni domyślnie)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Wtyczki pamięci">
    - `memory-core` — dołączone wyszukiwanie w pamięci (domyślnie przez `plugins.slots.memory`)
    - `memory-lancedb` — instalowana na żądanie pamięć długoterminowa z automatycznym przywoływaniem/przechwytywaniem (ustaw `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Dostawcy mowy (włączeni domyślnie)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Inne">
    - `browser` — dołączona wtyczka przeglądarki dla narzędzia browser, CLI `openclaw browser`, metody gateway `browser.request`, runtime przeglądarki i domyślnej usługi sterowania przeglądarką (włączona domyślnie; wyłącz ją przed zastąpieniem)
    - `copilot-proxy` — most VS Code Copilot Proxy (domyślnie wyłączony)
  </Accordion>
</AccordionGroup>

Szukasz wtyczek zewnętrznych? Zobacz [Wtyczki społeczności](/plugins/community).

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
| `allow`          | Allowlista wtyczek (opcjonalnie)                          |
| `deny`           | Lista zabronionych wtyczek (opcjonalnie; zabronienie wygrywa) |
| `load.paths`     | Dodatkowe pliki/katalogi wtyczek                          |
| `slots`          | Selektory wyłącznych slotów (np. `memory`, `contextEngine`) |
| `entries.\<id\>` | Przełączniki i konfiguracja per-wtyczka                   |

Zmiany konfiguracji **wymagają restartu gateway**. Jeśli Gateway działa z obserwacją konfiguracji
i restartem w procesie (domyślna ścieżka `openclaw gateway`), ten
restart zwykle wykonywany jest automatycznie chwilę po zapisaniu konfiguracji.

<Accordion title="Stany wtyczek: wyłączona vs brakująca vs nieprawidłowa">
  - **Wyłączona**: wtyczka istnieje, ale reguły włączania ją wyłączyły. Konfiguracja zostaje zachowana.
  - **Brakująca**: konfiguracja odwołuje się do identyfikatora wtyczki, którego wykrywanie nie znalazło.
  - **Nieprawidłowa**: wtyczka istnieje, ale jej konfiguracja nie pasuje do zadeklarowanego schematu.
</Accordion>

## Wykrywanie i priorytet

OpenClaw skanuje w poszukiwaniu wtyczek w tej kolejności (pierwsze dopasowanie wygrywa):

<Steps>
  <Step title="Ścieżki konfiguracji">
    `plugins.load.paths` — jawne ścieżki do plików lub katalogów.
  </Step>

  <Step title="Rozszerzenia obszaru roboczego">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` oraz `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globalne rozszerzenia">
    `~/.openclaw/<plugin-root>/*.ts` oraz `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Dołączone wtyczki">
    Dostarczane z OpenClaw. Wiele z nich jest włączonych domyślnie (dostawcy modeli, mowa).
    Inne wymagają jawnego włączenia.
  </Step>
</Steps>

### Reguły włączania

- `plugins.enabled: false` wyłącza wszystkie wtyczki
- `plugins.deny` zawsze wygrywa nad allow
- `plugins.entries.\<id\>.enabled: false` wyłącza tę wtyczkę
- Wtyczki pochodzące z obszaru roboczego są **domyślnie wyłączone** (muszą zostać jawnie włączone)
- Dołączone wtyczki stosują wbudowany zestaw domyślnie włączonych, chyba że został nadpisany
- Wyłączne sloty mogą wymusić włączenie wybranej wtyczki dla tego slotu

## Sloty wtyczek (wyłączne kategorie)

Niektóre kategorie są wyłączne (w danym czasie aktywna może być tylko jedna):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // lub "none", aby wyłączyć
      contextEngine: "legacy", // lub identyfikator wtyczki
    },
  },
}
```

| Slot            | Co kontroluje            | Domyślnie           |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Aktywna wtyczka pamięci  | `memory-core`       |
| `contextEngine` | Aktywny silnik kontekstu | `legacy` (wbudowany) |

## Dokumentacja CLI

```bash
openclaw plugins list                       # skrócony spis
openclaw plugins list --enabled            # tylko załadowane wtyczki
openclaw plugins list --verbose            # szczegółowe linie dla każdej wtyczki
openclaw plugins list --json               # spis czytelny maszynowo
openclaw plugins inspect <id>              # szczegóły
openclaw plugins inspect <id> --json       # format czytelny maszynowo
openclaw plugins inspect --all             # tabela dla całej floty
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostyka

openclaw plugins install <package>         # instalacja (najpierw ClawHub, potem npm)
openclaw plugins install clawhub:<pkg>     # instalacja tylko z ClawHub
openclaw plugins install <spec> --force    # nadpisanie istniejącej instalacji
openclaw plugins install <path>            # instalacja z lokalnej ścieżki
openclaw plugins install -l <path>         # podlinkowanie (bez kopiowania) do dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # zapis dokładnej rozwiązanej specyfikacji npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # aktualizacja jednej wtyczki
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # aktualizacja wszystkich
openclaw plugins uninstall <id>          # usunięcie rekordów konfiguracji/instalacji
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Dołączone wtyczki są dostarczane z OpenClaw. Wiele z nich jest włączonych domyślnie (na przykład
dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączona wtyczka
browser). Inne dołączone wtyczki nadal wymagają `openclaw plugins enable <id>`.

`--force` nadpisuje istniejącą zainstalowaną wtyczkę lub pakiet hooków w miejscu.
Nie jest obsługiwane razem z `--link`, które używa ścieżki źródłowej zamiast
kopiowania do zarządzanego celu instalacji.

`--pin` jest dostępne tylko dla npm. Nie jest obsługiwane z `--marketplace`, ponieważ
instalacje z marketplace zapisują metadane źródła marketplace zamiast specyfikacji npm.

`--dangerously-force-unsafe-install` to awaryjne obejście dla fałszywych
alarmów wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalacje
i aktualizacje wtyczek mimo wbudowanych ustaleń `critical`, ale nadal
nie omija blokad polityki `before_install` ani blokowania przy błędzie skanowania.

Ta flaga CLI dotyczy tylko przepływów instalacji/aktualizacji wtyczek. Instalacje zależności Skills
obsługiwane przez gateway używają zamiast tego odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills przez ClawHub.

Zgodne pakiety uczestniczą w tym samym przepływie list/inspect/enable/disable wtyczek. Obecna obsługa runtime obejmuje Skills z pakietów, command-skills Claude,
domyślne ustawienia `settings.json` Claude, domyślne ustawienia Claude `.lsp.json` i deklarowane w manifescie
`lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex.

`openclaw plugins inspect <id>` raportuje też wykryte możliwości pakietu oraz
obsługiwane lub nieobsługiwane wpisy serwerów MCP i LSP dla wtyczek opartych na pakietach.

Źródła marketplace mogą być znaną nazwą marketplace Claude z
`~/.claude/plugins/known_marketplaces.json`, lokalnym katalogiem marketplace lub
ścieżką `marketplace.json`, skrótem GitHub w postaci `owner/repo`, adresem URL repozytorium GitHub
albo adresem URL git. W przypadku zdalnych marketplace wpisy wtyczek muszą pozostać wewnątrz
sklonowanego repozytorium marketplace i używać wyłącznie względnych źródeł ścieżek.

Pełne szczegóły znajdziesz w [dokumentacji CLI `openclaw plugins`](/cli/plugins).

## Przegląd API wtyczek

Natywne wtyczki eksportują obiekt wejściowy udostępniający `register(api)`. Starsze
wtyczki mogą nadal używać `activate(api)` jako starszego aliasu, ale nowe wtyczki powinny
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
wtyczki. Loader nadal przechodzi awaryjnie do `activate(api)` dla starszych wtyczek,
ale dołączone wtyczki i nowe zewnętrzne wtyczki powinny traktować `register` jako
publiczny kontrakt.

Typowe metody rejestracji:

| Metoda                                  | Co rejestruje                |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Dostawcę modelu (LLM)        |
| `registerChannel`                       | Kanał czatu                  |
| `registerTool`                          | Narzędzie agenta             |
| `registerHook` / `on(...)`              | Hooki cyklu życia            |
| `registerSpeechProvider`                | Zamianę tekstu na mowę / STT |
| `registerRealtimeTranscriptionProvider` | Strumieniowe STT             |
| `registerRealtimeVoiceProvider`         | Dwukierunkowy głos realtime  |
| `registerMediaUnderstandingProvider`    | Analizę obrazu/audio         |
| `registerImageGenerationProvider`       | Generowanie obrazów          |
| `registerVideoGenerationProvider`       | Generowanie wideo            |
| `registerWebFetchProvider`              | Dostawcę web fetch / scrape  |
| `registerWebSearchProvider`             | Web search                   |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Polecenia CLI                |
| `registerContextEngine`                 | Silnik kontekstu             |
| `registerService`                       | Usługę działającą w tle      |

Zachowanie hook guard dla typowanych hooków cyklu życia:

- `before_tool_call`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_tool_call`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `before_install`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe; handlery o niższym priorytecie są pomijane.
- `message_sending`: `{ cancel: false }` nic nie robi i nie usuwa wcześniejszego anulowania.

Pełne zachowanie typowanych hooków znajdziesz w [Przegląd SDK](/plugins/sdk-overview#hook-decision-semantics).

## Powiązane

- [Tworzenie wtyczek](/plugins/building-plugins) — utwórz własną wtyczkę
- [Pakiety wtyczek](/plugins/bundles) — zgodność pakietów Codex/Claude/Cursor
- [Manifest wtyczki](/plugins/manifest) — schemat manifestu
- [Rejestrowanie narzędzi](/plugins/building-plugins#registering-agent-tools) — dodawanie narzędzi agenta we wtyczce
- [Wnętrze wtyczek](/plugins/architecture) — model możliwości i pipeline ładowania
- [Wtyczki społeczności](/plugins/community) — listy wtyczek zewnętrznych
