---
read_when:
    - Tworzysz lokalny Plugin backendu CLI dla AI
    - Chcesz zarejestrować backend dla odwołań do modeli takich jak acme-cli/model
    - Musisz zmapować CLI innej firmy na tekstowy zastępczy runner OpenClaw
sidebarTitle: CLI backend plugins
summary: Zbuduj plugin, który rejestruje lokalny backend CLI AI
title: Tworzenie Pluginów backendu CLI
x-i18n:
    generated_at: "2026-06-27T17:50:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Pluginy backendu CLI pozwalają OpenClaw wywoływać lokalne AI CLI jako backend
wnioskowania tekstowego. Backend pojawia się jako prefiks dostawcy w referencjach modeli:

```text
acme-cli/acme-large
```

Użyj backendu CLI, gdy integracja nadrzędna jest już udostępniona jako lokalne
polecenie, gdy CLI zarządza lokalnym stanem logowania albo gdy CLI jest przydatnym
rozwiązaniem zapasowym, jeśli dostawcy API są niedostępni.

<Info>
  Jeśli usługa nadrzędna udostępnia zwykłe HTTP API modelu, zamiast tego napisz
  [plugin dostawcy](/pl/plugins/sdk-provider-plugins). Jeśli nadrzędne środowisko
  uruchomieniowe zarządza pełnymi sesjami agentów, zdarzeniami narzędzi,
  Compaction albo stanem zadań w tle, użyj [uprzęży agenta](/pl/plugins/sdk-agent-harness).
</Info>

## Za co odpowiada Plugin

Plugin backendu CLI ma trzy kontrakty:

| Kontrakt                  | Plik                   | Cel                                                        |
| ------------------------- | ---------------------- | ---------------------------------------------------------- |
| Punkt wejścia pakietu     | `package.json`         | Wskazuje OpenClaw moduł uruchomieniowy Pluginu             |
| Własność manifestu        | `openclaw.plugin.json` | Deklaruje identyfikator backendu przed załadowaniem runtime |
| Rejestracja runtime       | `index.ts`             | Wywołuje `api.registerCliBackend(...)` z domyślnymi poleceniami |

Manifest to metadane wykrywania. Nie wykonuje CLI i nie rejestruje zachowania
runtime. Zachowanie runtime zaczyna się, gdy punkt wejścia Pluginu wywołuje
`api.registerCliBackend(...)`.

## Minimalny Plugin backendu

<Steps>
  <Step title="Create package metadata">
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

    Opublikowane pakiety muszą zawierać zbudowane pliki runtime JavaScript. Jeśli
    źródłowy punkt wejścia to `./src/index.ts`, dodaj `openclaw.runtimeExtensions`,
    które wskazuje zbudowany odpowiednik JavaScript. Zobacz [Punkty wejścia](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Declare backend ownership">
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

    `cliBackends` to lista własności runtime. Pozwala OpenClaw automatycznie
    załadować Plugin, gdy konfiguracja lub wybór modelu wspomina `acme-cli/...`.

    `setup.cliBackends` to powierzchnia konfiguracji oparta najpierw na deskryptorze.
    Dodaj ją, gdy wykrywanie modeli, onboarding albo status powinny rozpoznawać
    backend bez ładowania runtime Pluginu. Używaj `requiresRuntime: false` tylko
    wtedy, gdy te statyczne deskryptory wystarczają do konfiguracji.

  </Step>

  <Step title="Register the backend">
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

    Identyfikator backendu musi odpowiadać wpisowi `cliBackends` w manifeście.
    Zarejestrowane `config` jest tylko wartością domyślną; konfiguracja użytkownika
    w `agents.defaults.cliBackends.acme-cli` jest z nią scalana w runtime.

  </Step>
</Steps>

## Kształt konfiguracji

`CliBackendConfig` opisuje, jak OpenClaw powinien uruchamiać i analizować CLI:

| Pole                                      | Zastosowanie                                                |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Nazwa binarium albo bezwzględna ścieżka polecenia           |
| `args`                                    | Bazowy argv dla świeżych uruchomień                         |
| `resumeArgs`                              | Alternatywny argv dla wznowionych sesji; obsługuje `{sessionId}` |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl` albo `text`                         |
| `input`                                   | Transport promptu: `arg` albo `stdin`                       |
| `modelArg`                                | Flaga używana przed identyfikatorem modelu                  |
| `modelAliases`                            | Mapuje identyfikatory modeli OpenClaw na natywne identyfikatory CLI |
| `sessionArg` / `sessionArgs`              | Jak przekazać identyfikator sesji                           |
| `sessionMode`                             | `always`, `existing` albo `none`                            |
| `sessionIdFields`                         | Pola JSON, które OpenClaw odczytuje z wyjścia CLI           |
| `systemPromptArg` / `systemPromptFileArg` | Transport promptu systemowego                               |
| `systemPromptWhen`                        | `first`, `always` albo `never`                              |
| `imageArg` / `imageMode`                  | Obsługa ścieżek obrazów                                     |
| `serialize`                               | Utrzymuje uporządkowanie uruchomień tego samego backendu    |
| `reliability.watchdog`                    | Dostrajanie limitu czasu bez wyjścia                        |

Preferuj najmniejszą statyczną konfigurację pasującą do CLI. Dodawaj callbacki
Pluginu tylko dla zachowania, które naprawdę należy do backendu.

## Zaawansowane hooki backendu

`CliBackendPlugin` może także definiować:

| Hook                               | Zastosowanie                                                               |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Przepisuje starszą konfigurację użytkownika po scaleniu                    |
| `resolveExecutionArgs(ctx)`        | Dodaje flagi z zakresu żądania, takie jak poziom myślenia albo izolacja pytań pobocznych |
| `prepareExecution(ctx)`            | Tworzy tymczasowe mosty uwierzytelniania lub konfiguracji przed uruchomieniem |
| `transformSystemPrompt(ctx)`       | Stosuje końcową transformację promptu systemowego specyficzną dla CLI      |
| `textTransforms`                   | Dwukierunkowe zastąpienia promptu/wyjścia                                  |
| `defaultAuthProfileId`             | Preferuje konkretny profil uwierzytelniania OpenClaw                       |
| `authEpochMode`                    | Decyduje, jak zmiany uwierzytelniania unieważniają zapisane sesje CLI      |
| `nativeToolMode`                   | Deklaruje, czy CLI ma zawsze włączone narzędzia natywne                    |
| `sideQuestionToolMode`             | Deklaruje wyłączone narzędzia natywne dla pytań pobocznych `/btw`          |
| `bundleMcp` / `bundleMcpMode`      | Włącza mostek narzędzi MCP local loopback OpenClaw                         |
| `ownsNativeCompaction`             | Backend zarządza własnym Compaction - OpenClaw się wstrzymuje              |

Zachowaj te hooki jako własność dostawcy. Nie dodawaj do rdzenia gałęzi
specyficznych dla CLI, gdy hook backendu może wyrazić dane zachowanie.

`ctx.executionMode` ma wartość `"agent"` dla zwykłych tur i `"side-question"` dla
efemerycznych wywołań `/btw`. Używaj go, gdy CLI potrzebuje innych jednorazowych
flag, takich jak wyłączenie narzędzi natywnych, trwałości sesji albo zachowania
wznawiania dla BTW. Jeśli backend zwykle ma `nativeToolMode: "always-on"`, ale jego
argv dla pytania pobocznego niezawodnie wyłącza te narzędzia, ustaw także
`sideQuestionToolMode: "disabled"`; w przeciwnym razie OpenClaw zamyka się
bezpiecznie, gdy BTW wymaga uruchomienia CLI bez narzędzi.

### `ownsNativeCompaction`: rezygnacja z Compaction OpenClaw

Jeśli backend uruchamia agenta, który kompaktuje **własny** transkrypt, ustaw
`ownsNativeCompaction: true`, aby zabezpieczający summarizer OpenClaw nigdy nie działał na jego
sesjach - cykl życia Compaction CLI zwraca no-op, a tura jest kontynuowana. `claude-cli`
deklaruje to, ponieważ Claude Code kompaktuje wewnętrznie bez punktu końcowego uprzęży. Sesje
native-harness, takie jak Codex, nadal są kierowane do punktu końcowego Compaction swojej uprzęży.

**Deklaruj to tylko wtedy, gdy spełnione są wszystkie poniższe warunki**, inaczej odroczona sesja
ponad budżetem może pozostać ponad budżetem / zestarzeć się (OpenClaw już jej nie ratuje):

- backend niezawodnie kompaktuje lub ogranicza własny transkrypt, gdy zbliża się do swojego okna;
- utrwala wznawialną sesję, aby skompaktowany stan przetrwał między turami
  (np. `--resume` / `--session-id`);
- nie jest sesją Compaction native-harness - pasujące sesje `agentHarnessId`
  są zamiast tego kierowane do punktu końcowego uprzęży.

## Mostek narzędzi MCP

Backendy CLI domyślnie nie otrzymują narzędzi OpenClaw. Jeśli CLI może używać
konfiguracji MCP, włącz to jawnie:

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

Obsługiwane tryby mostka to:

| Tryb                     | Zastosowanie                                                   |
| ------------------------ | -------------------------------------------------------------- |
| `claude-config-file`     | CLI, które akceptują plik konfiguracji MCP                     |
| `codex-config-overrides` | CLI, które akceptują nadpisania konfiguracji w argv            |
| `gemini-system-settings` | CLI, które odczytują ustawienia MCP z katalogu ustawień systemowych |

Włączaj mostek tylko wtedy, gdy CLI faktycznie może go używać. Jeśli CLI ma własną
wbudowaną warstwę narzędzi, której nie da się wyłączyć, ustaw `nativeToolMode:
"always-on"`, aby OpenClaw mógł zamknąć się bezpiecznie, gdy wywołujący wymaga braku
narzędzi natywnych.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Udokumentuj minimalne nadpisanie, którego użytkownicy prawdopodobnie będą potrzebować.
Zwykle jest to tylko `command`, gdy binarium znajduje się poza `PATH`.

## Weryfikacja

W przypadku dołączonych pluginów dodaj ukierunkowany test obejmujący builder i rejestrację konfiguracji, a następnie uruchom ukierunkowany tor testów pluginu:

```bash
pnpm test extensions/acme-cli
```

W przypadku lokalnych lub zainstalowanych pluginów zweryfikuj wykrywanie i jedno rzeczywiste uruchomienie modelu:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Jeśli backend obsługuje obrazy lub MCP, dodaj test smoke na żywo, który potwierdzi te ścieżki z rzeczywistym CLI. Nie polegaj na statycznej inspekcji zachowania promptu, obrazu, MCP ani wznawiania sesji.

## Lista kontrolna

<Check>`package.json` zawiera `openclaw.extensions` i zbudowane wpisy runtime dla publikowanych pakietów</Check>
<Check>`openclaw.plugin.json` deklaruje `cliBackends` i celowe `activation.onStartup`</Check>
<Check>`setup.cliBackends` jest obecne, gdy konfiguracja/wykrywanie modeli powinny widzieć backend na zimno</Check>
<Check>`api.registerCliBackend(...)` używa tego samego identyfikatora backendu co manifest</Check>
<Check>Nadpisania użytkownika w `agents.defaults.cliBackends.<id>` nadal mają pierwszeństwo</Check>
<Check>Ustawienia sesji, promptu systemowego, obrazu i parsera wyjścia są zgodne z rzeczywistym kontraktem CLI</Check>
<Check>Ukierunkowane testy i co najmniej jeden test smoke CLI na żywo potwierdzają ścieżkę backendu</Check>

## Powiązane

- [Backendy CLI](/pl/gateway/cli-backends) - konfiguracja użytkownika i zachowanie runtime
- [Tworzenie pluginów](/pl/plugins/building-plugins) - podstawy pakietu i manifestu
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview) - dokumentacja API rejestracji
- [Manifest pluginu](/pl/plugins/manifest) - `cliBackends` i deskryptory konfiguracji
- [Uprząż agenta](/pl/plugins/sdk-agent-harness) - pełne zewnętrzne runtime agentów
