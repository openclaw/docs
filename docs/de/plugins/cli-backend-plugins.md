---
read_when:
    - Sie erstellen ein lokales KI-CLI-Backend-Plugin
    - Sie möchten ein Backend für Modell-Referenzen wie acme-cli/model registrieren
    - Sie müssen eine Drittanbieter-CLI dem Text-Fallback-Runner von OpenClaw zuordnen
sidebarTitle: CLI backend plugins
summary: Erstellen Sie ein Plugin, das ein lokales KI-CLI-Backend registriert.
title: CLI-Backend-Plugins erstellen
x-i18n:
    generated_at: "2026-05-07T13:22:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI-Backend-Plugins ermöglichen OpenClaw, eine lokale KI-CLI als Textinferenz-Backend aufzurufen. Das Backend erscheint als Provider-Präfix in Modellreferenzen:

```text
acme-cli/acme-large
```

Verwenden Sie ein CLI-Backend, wenn die Upstream-Integration bereits als lokaler Befehl verfügbar ist, wenn die CLI den lokalen Anmeldestatus verwaltet oder wenn die CLI ein nützlicher Fallback ist, falls API-Provider nicht verfügbar sind.

<Info>
  Wenn der Upstream-Dienst eine normale HTTP-Modell-API bereitstellt, schreiben Sie stattdessen ein [Provider-Plugin](/de/plugins/sdk-provider-plugins). Wenn die Upstream-Laufzeit vollständige Agent-Sitzungen, Tool-Ereignisse, Compaction oder den Status von Hintergrundaufgaben verwaltet, verwenden Sie ein [Agent-Harness](/de/plugins/sdk-agent-harness).
</Info>

## Was das Plugin verwaltet

Ein CLI-Backend-Plugin hat drei Verträge:

| Vertrag              | Datei                  | Zweck                                                        |
| -------------------- | ---------------------- | ------------------------------------------------------------ |
| Paketeinstieg        | `package.json`         | Verweist OpenClaw auf das Laufzeitmodul des Plugins          |
| Manifest-Zuständigkeit | `openclaw.plugin.json` | Deklariert die Backend-ID, bevor die Laufzeit geladen wird    |
| Laufzeitregistrierung | `index.ts`             | Ruft `api.registerCliBackend(...)` mit Befehlsvorgaben auf   |

Das Manifest ist Discovery-Metadaten. Es führt die CLI nicht aus und registriert kein Laufzeitverhalten. Das Laufzeitverhalten beginnt, wenn der Plugin-Einstieg `api.registerCliBackend(...)` aufruft.

## Minimales Backend-Plugin

<Steps>
  <Step title="Paketmetadaten erstellen">
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

    Veröffentlichte Pakete müssen gebaute JavaScript-Laufzeitdateien ausliefern. Wenn Ihr Quell-Einstieg `./src/index.ts` ist, fügen Sie `openclaw.runtimeExtensions` hinzu, das auf das gebaute JavaScript-Peer verweist. Siehe [Einstiegspunkte](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Backend-Zuständigkeit deklarieren">
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

    `cliBackends` ist die Liste der Laufzeit-Zuständigkeiten. Sie ermöglicht OpenClaw, das Plugin automatisch zu laden, wenn die Konfiguration oder Modellauswahl `acme-cli/...` erwähnt.

    `setup.cliBackends` ist die deskriptorbasierte Setup-Oberfläche. Fügen Sie sie hinzu, wenn Modellerkennung, Onboarding oder Status das Backend erkennen sollen, ohne die Plugin-Laufzeit zu laden. Verwenden Sie `requiresRuntime: false` nur, wenn diese statischen Deskriptoren für das Setup ausreichen.

  </Step>

  <Step title="Das Backend registrieren">
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

    Die Backend-ID muss mit dem Manifest-Eintrag `cliBackends` übereinstimmen. Die registrierte `config` ist nur die Vorgabe; die Benutzerkonfiguration unter `agents.defaults.cliBackends.acme-cli` wird zur Laufzeit darübergeführt.

  </Step>
</Steps>

## Konfigurationsform

`CliBackendConfig` beschreibt, wie OpenClaw die CLI starten und parsen soll:

| Feld                                      | Verwendung                                                 |
| ----------------------------------------- | ---------------------------------------------------------- |
| `command`                                 | Binärname oder absoluter Befehlspfad                       |
| `args`                                    | Basis-argv für neue Ausführungen                           |
| `resumeArgs`                              | Alternatives argv für fortgesetzte Sitzungen; unterstützt `{sessionId}` |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl` oder `text`                        |
| `input`                                   | Prompt-Transport: `arg` oder `stdin`                       |
| `modelArg`                                | Flag vor der Modell-ID                                     |
| `modelAliases`                            | OpenClaw-Modell-IDs CLI-nativen IDs zuordnen               |
| `sessionArg` / `sessionArgs`              | Wie eine Sitzungs-ID übergeben wird                        |
| `sessionMode`                             | `always`, `existing` oder `none`                           |
| `sessionIdFields`                         | JSON-Felder, die OpenClaw aus der CLI-Ausgabe liest        |
| `systemPromptArg` / `systemPromptFileArg` | System-Prompt-Transport                                    |
| `systemPromptWhen`                        | `first`, `always` oder `never`                             |
| `imageArg` / `imageMode`                  | Unterstützung für Bildpfade                                |
| `serialize`                               | Ausführungen desselben Backends geordnet halten            |
| `reliability.watchdog`                    | Abstimmung des Timeouts ohne Ausgabe                       |

Bevorzugen Sie die kleinste statische Konfiguration, die zur CLI passt. Fügen Sie Plugin-Callbacks nur für Verhalten hinzu, das wirklich zum Backend gehört.

## Erweiterte Backend-Hooks

`CliBackendPlugin` kann außerdem Folgendes definieren:

| Hook                               | Verwendung                                                |
| ---------------------------------- | --------------------------------------------------------- |
| `normalizeConfig(config, context)` | Veraltete Benutzerkonfiguration nach dem Zusammenführen umschreiben |
| `resolveExecutionArgs(ctx)`        | Anfragebezogene Flags wie Thinking-Aufwand hinzufügen     |
| `prepareExecution(ctx)`            | Temporäre Auth- oder Konfigurationsbrücken vor dem Start erstellen |
| `transformSystemPrompt(ctx)`       | Eine letzte CLI-spezifische System-Prompt-Transformation anwenden |
| `textTransforms`                   | Bidirektionale Prompt-/Ausgabe-Ersetzungen                |
| `defaultAuthProfileId`             | Ein bestimmtes OpenClaw-Auth-Profil bevorzugen            |
| `authEpochMode`                    | Festlegen, wie Auth-Änderungen gespeicherte CLI-Sitzungen ungültig machen |
| `nativeToolMode`                   | Deklarieren, ob die CLI immer aktive native Tools hat     |
| `bundleMcp` / `bundleMcpMode`      | In OpenClaws loopback-MCP-Tool-Bridge einsteigen          |

Halten Sie diese Hooks Provider-eigen. Fügen Sie keine CLI-spezifischen Verzweigungen zum Core hinzu, wenn ein Backend-Hook das Verhalten ausdrücken kann.

## MCP-Tool-Bridge

CLI-Backends erhalten OpenClaw-Tools standardmäßig nicht. Wenn die CLI eine MCP-Konfiguration nutzen kann, aktivieren Sie dies ausdrücklich:

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

Unterstützte Bridge-Modi sind:

| Modus                    | Verwendung                                                    |
| ------------------------ | ------------------------------------------------------------- |
| `claude-config-file`     | CLIs, die eine MCP-Konfigurationsdatei akzeptieren            |
| `codex-config-overrides` | CLIs, die Konfigurations-Overrides auf argv akzeptieren       |
| `gemini-system-settings` | CLIs, die MCP-Einstellungen aus ihrem System-Einstellungsverzeichnis lesen |

Aktivieren Sie die Bridge nur, wenn die CLI sie tatsächlich nutzen kann. Wenn die CLI eine eigene integrierte Tool-Schicht hat, die nicht deaktiviert werden kann, setzen Sie `nativeToolMode:
"always-on"`, damit OpenClaw geschlossen fehlschlagen kann, wenn ein Aufrufer keine nativen Tools verlangt.

## Benutzerkonfiguration

Benutzer können jede Backend-Vorgabe überschreiben:

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

Dokumentieren Sie die minimale Überschreibung, die Benutzer voraussichtlich benötigen. In der Regel ist das nur `command`, wenn sich die Binärdatei außerhalb von `PATH` befindet.

## Verifizierung

Fügen Sie für gebündelte Plugins einen fokussierten Test rund um den Builder und die Setup-Registrierung hinzu und führen Sie dann die gezielte Test-Lane des Plugins aus:

```bash
pnpm test extensions/acme-cli
```

Verifizieren Sie bei lokalen oder installierten Plugins die Discovery und einen echten Modelllauf:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Wenn das Backend Bilder oder MCP unterstützt, fügen Sie einen Live-Smoke hinzu, der diese Pfade mit der echten CLI nachweist. Verlassen Sie sich bei Prompt-, Bild-, MCP- oder Sitzungsfortsetzungsverhalten nicht auf statische Inspektion.

## Checkliste

<Check>`package.json` hat `openclaw.extensions` und gebaute Laufzeiteinträge für veröffentlichte Pakete</Check>
<Check>`openclaw.plugin.json` deklariert `cliBackends` und bewusstes `activation.onStartup`</Check>
<Check>`setup.cliBackends` ist vorhanden, wenn Setup/Modellerkennung das Backend kalt sehen soll</Check>
<Check>`api.registerCliBackend(...)` verwendet dieselbe Backend-ID wie das Manifest</Check>
<Check>Benutzer-Overrides unter `agents.defaults.cliBackends.<id>` gewinnen weiterhin</Check>
<Check>Sitzungs-, System-Prompt-, Bild- und Ausgabeparser-Einstellungen entsprechen dem echten CLI-Vertrag</Check>
<Check>Gezielte Tests und mindestens ein Live-CLI-Smoke weisen den Backend-Pfad nach</Check>

## Verwandte Themen

- [CLI-Backends](/de/gateway/cli-backends) - Benutzerkonfiguration und Laufzeitverhalten
- [Plugins erstellen](/de/plugins/building-plugins) - Paket- und Manifest-Grundlagen
- [Plugin SDK-Übersicht](/de/plugins/sdk-overview) - Referenz zur Registrierungs-API
- [Plugin-Manifest](/de/plugins/manifest) - `cliBackends` und Setup-Deskriptoren
- [Agent-Harness](/de/plugins/sdk-agent-harness) - vollständige externe Agent-Laufzeiten
