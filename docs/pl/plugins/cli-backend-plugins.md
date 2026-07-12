---
read_when:
    - Tworzysz lokalny plugin zaplecza CLI AI
    - Chcesz zarejestrować backend dla odwołań do modeli, takich jak acme-cli/model
    - Musisz zintegrować CLI innej firmy z tekstowym mechanizmem uruchamiania awaryjnego OpenClaw
sidebarTitle: CLI backend plugins
summary: Utwórz Plugin, który rejestruje lokalny backend CLI AI
title: Tworzenie Pluginów zaplecza CLI
x-i18n:
    generated_at: "2026-07-12T15:20:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Pluginy zaplecza CLI umożliwiają OpenClaw wywoływanie lokalnego CLI AI jako
zaplecza wnioskowania tekstowego. Zaplecze występuje jako prefiks dostawcy w odwołaniach do modeli:

```text
acme-cli/acme-large
```

Użyj zaplecza CLI, gdy integracja nadrzędna jest już udostępniona jako lokalne
polecenie, gdy CLI zarządza lokalnym stanem logowania lub jako rozwiązanie awaryjne, gdy
dostawcy API są niedostępni.

<Info>
  Jeśli usługa nadrzędna udostępnia standardowe API modelu HTTP, zamiast tego utwórz
  [plugin dostawcy](/pl/plugins/sdk-provider-plugins). Jeśli środowisko wykonawcze
  nadrzędne zarządza pełnymi sesjami agenta, zdarzeniami narzędzi, Compaction lub stanem
  zadań w tle, użyj [środowiska agenta](/pl/plugins/sdk-agent-harness).
</Info>

## Za co odpowiada plugin

Plugin zaplecza CLI ma trzy kontrakty:

| Kontrakt                | Plik                   | Przeznaczenie                                                        |
| ----------------------- | ---------------------- | -------------------------------------------------------------------- |
| Punkt wejścia pakietu   | `package.json`         | Wskazuje OpenClaw moduł środowiska wykonawczego pluginu              |
| Deklaracja właściciela  | `openclaw.plugin.json` | Deklaruje identyfikator zaplecza przed załadowaniem środowiska       |
| Rejestracja wykonawcza  | `index.ts`             | Wywołuje `api.registerCliBackend(...)` z domyślnymi opcjami polecenia |

Manifest zawiera metadane wykrywania: nie uruchamia CLI ani nie rejestruje
zachowania środowiska wykonawczego. Zachowanie wykonawcze zaczyna się, gdy punkt wejścia pluginu wywoła
`api.registerCliBackend(...)`.

## Minimalny plugin zaplecza

<Steps>
  <Step title="Utwórz metadane pakietu">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    Opublikowane pakiety muszą zawierać skompilowane pliki JavaScript środowiska wykonawczego. Jeśli źródłowym
    punktem wejścia jest `./src/index.ts`, dodaj `openclaw.runtimeExtensions` wskazujące
    odpowiadający mu skompilowany plik JavaScript. Zobacz [Punkty wejścia](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Zadeklaruj właściciela zaplecza">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` to lista właścicieli środowiska wykonawczego; umożliwia OpenClaw automatyczne ładowanie
    pluginu, gdy konfiguracja lub wybór modelu odwołuje się do `acme-cli/...`.

    `setup.cliBackends` to powierzchnia konfiguracji oparta przede wszystkim na deskryptorach. Dodaj ją, gdy
    wykrywanie modeli, wdrażanie lub stan mają rozpoznawać zaplecze
    bez ładowania środowiska wykonawczego pluginu. Używaj `requiresRuntime: false` tylko wtedy, gdy
    te statyczne deskryptory są wystarczające do konfiguracji.

  </Step>

  <Step title="Zarejestruj zaplecze">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    Identyfikator zaplecza musi odpowiadać wpisowi `cliBackends` w manifeście.
    Zarejestrowana wartość `config` jest tylko domyślna; konfiguracja użytkownika w
    `agents.defaults.cliBackends.acme-cli` jest z nią scalana w czasie działania i ma pierwszeństwo.

  </Step>
</Steps>

## Struktura konfiguracji

`CliBackendConfig` opisuje sposób, w jaki OpenClaw ma uruchamiać i analizować CLI:

| Pole                                                      | Zastosowanie                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `command`                                                 | Nazwa pliku wykonywalnego lub bezwzględna ścieżka polecenia                                      |
| `args`                                                    | Bazowe argumenty argv dla nowych uruchomień                                                      |
| `resumeArgs`                                              | Alternatywne argumenty argv dla wznowionych sesji; obsługują `{sessionId}`                        |
| `output` / `resumeOutput`                                 | Parser: `json`, `jsonl` lub `text`                                                               |
| `jsonlDialect`                                            | Dialekt zdarzeń JSONL: `claude-stream-json` lub `gemini-stream-json`                              |
| `liveSession`                                             | Tryb długotrwałego procesu CLI (`claude-stdio`)                                                   |
| `input`                                                   | Transport promptu: `arg` lub `stdin`                                                             |
| `maxPromptArgChars`                                       | Maksymalna długość promptu w trybie `arg` przed przejściem na stdin                               |
| `env` / `clearEnv`                                        | Dodatkowe zmienne środowiskowe do wstrzyknięcia lub nazwy do usunięcia przed uruchomieniem        |
| `modelArg`                                                | Flaga używana przed identyfikatorem modelu                                                       |
| `modelAliases`                                            | Mapowanie identyfikatorów modeli OpenClaw na identyfikatory natywne dla CLI                       |
| `sessionArg` / `sessionArgs`                              | Sposób przekazywania identyfikatora sesji                                                        |
| `sessionMode`                                             | `always`, `existing` lub `none`                                                                  |
| `sessionIdFields`                                         | Pola JSON odczytywane przez OpenClaw z danych wyjściowych CLI                                     |
| `systemPromptArg` / `systemPromptFileArg`                 | Transport promptu systemowego                                                                    |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transport nadpisania konfiguracji dla pliku promptu systemowego (na przykład `-c`)                |
| `systemPromptMode`                                        | `append` lub `replace`                                                                           |
| `systemPromptWhen`                                        | `first`, `always` lub `never`                                                                    |
| `imageArg` / `imageMode`                                  | Flaga ścieżki obrazu i sposób przekazywania wielu obrazów (`repeat` lub `list`)                    |
| `imagePathScope`                                          | Miejsce przechowywania przygotowanych plików obrazów przed przekazaniem: `temp` lub `workspace`   |
| `serialize`                                               | Zachowanie kolejności uruchomień tego samego zaplecza                                             |
| `reseedFromRawTranscriptWhenUncompacted`                  | Włączenie ograniczonego ponownego zasilenia surowym transkryptem przed Compaction na potrzeby bezpiecznego resetowania sesji |
| `reliability.outputLimits`                                | Maksymalna liczba znaków/wierszy surowego JSONL zachowywanych dla jednej aktywnej tury CLI (zaplecza z aktywną sesją) |
| `reliability.watchdog`                                    | Dostrajanie limitu czasu bez danych wyjściowych, osobno dla nowych i wznowionych uruchomień        |

Preferuj najmniejszą statyczną konfigurację zgodną z CLI. Dodawaj wywołania zwrotne pluginu
tylko dla zachowania, które rzeczywiście należy do zaplecza.

## Zaawansowane haki zaplecza

`CliBackendPlugin` może również definiować:

| Hak                                | Zastosowanie                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Przekształcanie starszej konfiguracji użytkownika po scaleniu                           |
| `resolveExecutionArgs(ctx)`        | Dodawanie flag dla danego żądania, takich jak poziom namysłu lub izolacja pytań pobocznych |
| `prepareExecution(ctx)`            | Tworzenie tymczasowych mostów uwierzytelniania lub konfiguracji przed uruchomieniem      |
| `transformSystemPrompt(ctx)`       | Stosowanie końcowego przekształcenia promptu systemowego specyficznego dla CLI           |
| `textTransforms`                   | Dwukierunkowe zamiany promptu i danych wyjściowych                                      |
| `defaultAuthProfileId`             | Preferowanie określonego profilu uwierzytelniania OpenClaw                              |
| `authEpochMode`                    | Określanie, jak zmiany uwierzytelniania unieważniają zapisane sesje CLI                  |
| `nativeToolMode`                   | Deklarowanie, czy narzędzia natywne są nieobecne, zawsze włączone lub wybierane przez hosta |
| `sideQuestionToolMode`             | Deklarowanie wyłączonych narzędzi natywnych dla pytań pobocznych `/btw`                  |
| `bundleMcp` / `bundleMcpMode`      | Włączenie mostu narzędzi MCP OpenClaw przez local loopback                               |
| `ownsNativeCompaction`             | Zaplecze zarządza własnym Compaction — OpenClaw odracza tę operację                      |
| `runtimeArtifact`                  | Powiązanie programu uruchamiającego skrypt z jego kompletnym dołączonym drzewem pakietu  |

Haki te powinny pozostawać własnością dostawcy. Nie dodawaj do rdzenia gałęzi specyficznych dla CLI, gdy
hak zaplecza może wyrazić dane zachowanie.

`runtimeArtifact` jest własnością pluginu i użytkownik nie może go nadpisać. Jest sprawdzany
tylko wtedy, gdy aktywna tura wnioskowania tworzy lub ponownie weryfikuje potwierdzone uprawnienie konfiguracji;
zwykłe uruchomienia CLI go nie wymagają. Zaplecze bez tej deklaracji nie może
tworzyć potwierdzonego uprawnienia konfiguracji CLI. Deklaracja `bundled-package-tree` wskazuje
dokładnego właściciela pliku `package.json` i wymaga, aby punktem wejścia pakietu było
polecenie. OpenClaw oblicza skrót ograniczonego, kompletnego drzewa zainstalowanego pakietu, w tym
zagnieżdżonych zależności, i bezpiecznie odrzuca dowiązania symboliczne przekierowujące poza drzewo,
programy uruchamiające spoza zadeklarowanego pakietu, deklaracje wymaganych zależności
zewnętrznych, zbyt duże drzewa oraz nieznane skrypty. Deklaruj to tylko wtedy, gdy
drzewo zawiera kompletną implementację wnioskowania; opcjonalne integracje narzędzi
nie zapewniają bezpieczeństwa zewnętrznemu grafowi implementacji.

Jeśli to samo zaplecze dostarcza również samodzielny natywny plik wykonywalny, wymień jego
kanoniczne nazwy bazowe w `nativeExecutableNames`. Inne natywne polecenia pozostają
niezweryfikowane, nawet gdy użytkownik nadpisze polecenie zaplecza.

`ctx.executionMode` ma wartość `"agent"` dla zwykłych tur oraz `"side-question"` dla
tymczasowych wywołań `/btw`. Użyj go, gdy CLI wymaga innych jednorazowych flag,
na przykład wyłączenia narzędzi natywnych, trwałości sesji lub zachowania przy
wznawianiu dla BTW. Jeśli backend ma zwykle ustawienie `nativeToolMode: "always-on"`, ale jego
argumenty argv dla pytań pobocznych niezawodnie wyłączają te narzędzia, ustaw również
`sideQuestionToolMode: "disabled"`; w przeciwnym razie OpenClaw bezpiecznie odmawia działania, gdy BTW
wymaga uruchomienia CLI bez narzędzi.

Ustaw `nativeToolMode: "selectable"` tylko wtedy, gdy `resolveExecutionArgs` może wyłączyć
każde narzędzie natywne backendu dla pojedynczego uruchomienia. W takich ograniczonych uruchomieniach
`ctx.toolAvailability.native` jest pustą krotką, a
`ctx.toolAvailability.mcp` jest dokładną, izolowaną przez host listą dozwolonych MCP. Hook
musi zastąpić kolidujące flagi narzędzi i zwrócić argv wymuszające obie wartości;
OpenClaw wywołuje go raz z ostatecznym argv nowej lub wznawianej sesji i bezpiecznie odmawia działania, gdy
backend nie może wymusić ograniczenia. Nazwy MCP w tym kontekście można bezpiecznie
zatwierdzać automatycznie wyłącznie dlatego, że host wcześniej ograniczył wygenerowaną konfigurację MCP
do tych serwerów i narzędzi.

### `ownsNativeCompaction`: rezygnacja z Compaction OpenClaw

Jeśli Twój backend uruchamia agenta, który wykonuje Compaction **własnego** transkryptu, ustaw
`ownsNativeCompaction: true`, aby awaryjny mechanizm podsumowujący OpenClaw nigdy nie działał
na jego sesjach — cykl życia Compaction w CLI nie wykonuje żadnej operacji, a
tura jest kontynuowana. `claude-cli` deklaruje tę opcję, ponieważ Claude Code wykonuje Compaction
wewnętrznie, bez punktu końcowego warstwy pośredniczącej. Sesje natywnej warstwy pośredniczącej, takie jak Codex,
są zamiast tego nadal kierowane do punktu końcowego Compaction tej warstwy.

**Deklaruj tę opcję tylko wtedy, gdy spełnione są wszystkie poniższe warunki**; w przeciwnym razie odroczona
sesja przekraczająca budżet może nadal go przekraczać lub stać się nieaktualna (OpenClaw już
jej nie uratuje):

- backend niezawodnie wykonuje Compaction własnego transkryptu lub ogranicza jego rozmiar, gdy zbliża się on do
  granicy okna;
- utrwala sesję możliwą do wznowienia, dzięki czemu stan po Compaction zachowuje się między turami
  (na przykład `--resume` / `--session-id`);
- nie jest to sesja Compaction natywnej warstwy pośredniczącej — sesje pasujące do `agentHarnessId`
  są zamiast tego kierowane do punktu końcowego tej warstwy.

## Most narzędzi MCP

Backendy CLI domyślnie nie otrzymują narzędzi OpenClaw. Jeśli CLI może używać
konfiguracji MCP, włącz tę funkcję jawnie:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

Obsługiwane tryby mostu:

| Tryb                     | Zastosowanie                                                      |
| ------------------------ | ----------------------------------------------------------------- |
| `claude-config-file`     | CLI akceptujące plik konfiguracyjny MCP                            |
| `codex-config-overrides` | CLI akceptujące nadpisania konfiguracji w argv                     |
| `gemini-system-settings` | CLI odczytujące ustawienia MCP z katalogu ustawień systemowych     |

Włączaj most tylko wtedy, gdy CLI rzeczywiście może go używać. Jeśli CLI ma
własną wbudowaną warstwę narzędzi, której nie można wyłączyć, ustaw `nativeToolMode:
"always-on"`, aby OpenClaw mógł bezpiecznie odmówić działania, gdy wywołujący wymaga braku natywnych
narzędzi. Jeśli może wyłączyć wszystkie narzędzia natywne dla każdego uruchomienia, użyj `"selectable"` wraz z
opisaną powyżej umową `resolveExecutionArgs`.

## Konfiguracja użytkownika

Użytkownicy mogą nadpisać dowolną wartość domyślną backendu:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Udokumentuj minimalne nadpisanie, którego użytkownicy prawdopodobnie będą potrzebować — zwykle tylko
`command`, gdy plik wykonywalny znajduje się poza `PATH`.

## Weryfikacja

W przypadku dołączonych Pluginów dodaj ukierunkowany test konstruktora i rejestracji
konfiguracji, a następnie uruchom docelowy zestaw testów Pluginu:

```bash
pnpm test extensions/acme-cli
```

W przypadku lokalnych lub zainstalowanych Pluginów zweryfikuj wykrywanie i jedno rzeczywiste uruchomienie modelu:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Jeśli backend obsługuje obrazy lub MCP, dodaj test dymny na żywo, który potwierdza te
ścieżki przy użyciu rzeczywistego CLI. Nie polegaj na statycznej inspekcji działania promptów, obrazów,
MCP ani wznawiania sesji.

## Lista kontrolna

<Check>`package.json` zawiera `openclaw.extensions` oraz zbudowane wpisy środowiska wykonawczego dla opublikowanych pakietów</Check>
<Check>`openclaw.plugin.json` deklaruje `cliBackends` i świadomie dobrane `activation.onStartup`</Check>
<Check>`setup.cliBackends` jest obecne, gdy konfiguracja lub wykrywanie modeli powinny widzieć nieuruchomiony backend</Check>
<Check>`api.registerCliBackend(...)` używa tego samego identyfikatora backendu co manifest</Check>
<Check>Nadpisania użytkownika w `agents.defaults.cliBackends.<id>` nadal mają pierwszeństwo</Check>
<Check>Ustawienia sesji, promptu systemowego, obrazów i parsera danych wyjściowych odpowiadają rzeczywistej umowie CLI</Check>
<Check>Testy ukierunkowane i co najmniej jeden test dymny CLI na żywo potwierdzają ścieżkę backendu</Check>

## Powiązane materiały

- [Backendy CLI](/pl/gateway/cli-backends) — konfiguracja użytkownika i działanie środowiska wykonawczego
- [Tworzenie Pluginów](/pl/plugins/building-plugins) — podstawy pakietów i manifestów
- [Omówienie SDK Pluginów](/pl/plugins/sdk-overview) — dokumentacja API rejestracji
- [Manifest Pluginu](/pl/plugins/manifest) — `cliBackends` i deskryptory konfiguracji
- [Warstwa pośrednicząca agenta](/pl/plugins/sdk-agent-harness) — kompletne zewnętrzne środowiska wykonawcze agentów
