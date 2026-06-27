---
read_when:
    - Sie erstellen ein lokales AI-CLI-Backend-Plugin
    - Sie möchten ein Backend für Modell-Refs wie acme-cli/model registrieren
    - Sie müssen eine Drittanbieter-CLI in den Text-Fallback-Runner von OpenClaw abbilden
sidebarTitle: CLI backend plugins
summary: Erstellen Sie ein Plugin, das ein lokales AI-CLI-Backend registriert
title: CLI-Backend-Plugins erstellen
x-i18n:
    generated_at: "2026-06-27T17:45:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI-Backend-Plugins ermöglichen es OpenClaw, eine lokale KI-CLI als Textinferenz-
Backend aufzurufen. Das Backend erscheint als Provider-Präfix in Modellreferenzen:

```text
acme-cli/acme-large
```

Verwenden Sie ein CLI-Backend, wenn die Upstream-Integration bereits als lokaler
Befehl verfügbar ist, wenn die CLI den lokalen Anmeldestatus besitzt oder wenn
die CLI ein nützlicher Fallback ist, falls API-Provider nicht verfügbar sind.

<Info>
  Wenn der Upstream-Dienst eine normale HTTP-Modell-API bereitstellt, schreiben Sie
  stattdessen ein [Provider-Plugin](/de/plugins/sdk-provider-plugins). Wenn die Upstream-
  Runtime vollständige Agent-Sitzungen, Tool-Ereignisse, Compaction oder Hintergrund-
  Task-Zustand besitzt, verwenden Sie ein [Agent-Harness](/de/plugins/sdk-agent-harness).
</Info>

## Was das Plugin besitzt

Ein CLI-Backend-Plugin hat drei Verträge:

| Vertrag              | Datei                  | Zweck                                                     |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Paket-Einstieg       | `package.json`         | Verweist OpenClaw auf das Runtime-Modul des Plugins       |
| Manifest-Besitz      | `openclaw.plugin.json` | Deklariert die Backend-ID, bevor die Runtime geladen wird |
| Runtime-Registrierung | `index.ts`             | Ruft `api.registerCliBackend(...)` mit Befehlsdefaults auf |

Das Manifest ist Discovery-Metadaten. Es führt die CLI nicht aus und registriert
kein Runtime-Verhalten. Runtime-Verhalten beginnt, wenn der Plugin-Einstieg
`api.registerCliBackend(...)` aufruft.

## Minimales Backend-Plugin

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

    Veröffentlichte Pakete müssen gebaute JavaScript-Runtime-Dateien ausliefern. Wenn Ihr Quell-
    Einstieg `./src/index.ts` ist, fügen Sie `openclaw.runtimeExtensions` hinzu, das auf
    das gebaute JavaScript-Pendant verweist. Siehe [Einstiegspunkte](/de/plugins/sdk-entrypoints).

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

    `cliBackends` ist die Runtime-Besitzliste. Damit kann OpenClaw das
    Plugin automatisch laden, wenn Konfiguration oder Modellauswahl `acme-cli/...` erwähnen.

    `setup.cliBackends` ist die deskriptororientierte Setup-Oberfläche. Fügen Sie sie hinzu, wenn
    Modelldiscovery, Onboarding oder Status das Backend erkennen sollen, ohne
    die Plugin-Runtime zu laden. Verwenden Sie `requiresRuntime: false` nur, wenn diese statischen
    Deskriptoren für das Setup ausreichen.

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

    Die Backend-ID muss mit dem Manifest-Eintrag `cliBackends` übereinstimmen. Die registrierte
    `config` ist nur der Default; Benutzerkonfiguration unter
    `agents.defaults.cliBackends.acme-cli` wird zur Laufzeit darüber zusammengeführt.

  </Step>
</Steps>

## Konfigurationsform

`CliBackendConfig` beschreibt, wie OpenClaw die CLI starten und parsen soll:

| Feld                                      | Verwendung                                                  |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Binärname oder absoluter Befehlspfad                        |
| `args`                                    | Basis-argv für neue Läufe                                   |
| `resumeArgs`                              | Alternatives argv für fortgesetzte Sitzungen; unterstützt `{sessionId}` |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl` oder `text`                         |
| `input`                                   | Prompt-Transport: `arg` oder `stdin`                        |
| `modelArg`                                | Flag, das vor der Modell-ID verwendet wird                  |
| `modelAliases`                            | Ordnet OpenClaw-Modell-IDs CLI-nativen IDs zu               |
| `sessionArg` / `sessionArgs`              | Wie eine Sitzungs-ID übergeben wird                         |
| `sessionMode`                             | `always`, `existing` oder `none`                            |
| `sessionIdFields`                         | JSON-Felder, die OpenClaw aus der CLI-Ausgabe liest         |
| `systemPromptArg` / `systemPromptFileArg` | System-Prompt-Transport                                    |
| `systemPromptWhen`                        | `first`, `always` oder `never`                              |
| `imageArg` / `imageMode`                  | Unterstützung für Bildpfade                                 |
| `serialize`                               | Läufe desselben Backends geordnet halten                    |
| `reliability.watchdog`                    | Abstimmung des Timeouts bei fehlender Ausgabe               |

Bevorzugen Sie die kleinste statische Konfiguration, die zur CLI passt. Fügen Sie Plugin-Callbacks
nur für Verhalten hinzu, das wirklich zum Backend gehört.

## Erweiterte Backend-Hooks

`CliBackendPlugin` kann auch Folgendes definieren:

| Hook                               | Verwendung                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Legacy-Benutzerkonfiguration nach dem Zusammenführen umschreiben             |
| `resolveExecutionArgs(ctx)`        | Anfragespezifische Flags wie Denkaufwand oder Isolation von Nebenfragen hinzufügen |
| `prepareExecution(ctx)`            | Temporäre Auth- oder Konfigurationsbrücken vor dem Start erstellen           |
| `transformSystemPrompt(ctx)`       | Eine finale CLI-spezifische System-Prompt-Transformation anwenden            |
| `textTransforms`                   | Bidirektionale Prompt-/Ausgabe-Ersetzungen                                  |
| `defaultAuthProfileId`             | Ein bestimmtes OpenClaw-Auth-Profil bevorzugen                              |
| `authEpochMode`                    | Entscheiden, wie Auth-Änderungen gespeicherte CLI-Sitzungen invalidieren     |
| `nativeToolMode`                   | Deklarieren, ob die CLI dauerhaft aktive native Tools hat                    |
| `sideQuestionToolMode`             | Deaktivierte native Tools für `/btw`-Nebenfragen deklarieren                 |
| `bundleMcp` / `bundleMcpMode`      | Die Loopback-MCP-Tool-Bridge von OpenClaw aktivieren                         |
| `ownsNativeCompaction`             | Backend besitzt seine eigene Compaction - OpenClaw stellt zurück             |

Belassen Sie diese Hooks im Besitz des Providers. Fügen Sie keine CLI-spezifischen Branches zum Core hinzu, wenn ein
Backend-Hook das Verhalten ausdrücken kann.

`ctx.executionMode` ist `"agent"` für normale Turns und `"side-question"` für
flüchtige `/btw`-Aufrufe. Verwenden Sie dies, wenn die CLI andere Einmal-Flags benötigt, etwa
zum Deaktivieren nativer Tools, der Sitzungspersistenz oder des Fortsetzungsverhaltens für BTW. Wenn ein
Backend normalerweise `nativeToolMode: "always-on"` hat, sein Side-Question-argv
diese Tools aber zuverlässig deaktiviert, setzen Sie außerdem `sideQuestionToolMode: "disabled"`;
andernfalls schlägt OpenClaw geschlossen fehl, wenn BTW einen CLI-Lauf ohne Tools erfordert.

### `ownsNativeCompaction`: OpenClaw-Compaction deaktivieren

Wenn Ihr Backend einen Agenten ausführt, der sein **eigenes** Transkript kompaktiert, setzen Sie
`ownsNativeCompaction: true`, damit der Schutz-Summarizer von OpenClaw niemals gegen seine
Sitzungen läuft - der CLI-Compaction-Lebenszyklus gibt einen No-op zurück und der Turn fährt fort. `claude-cli`
deklariert dies, weil Claude Code intern ohne Harness-Endpunkt kompaktiert. Native-Harness-
Sitzungen wie Codex werden stattdessen weiterhin an ihren Harness-Compaction-Endpunkt weitergeleitet.

**Deklarieren Sie dies nur, wenn alle folgenden Punkte zutreffen**, andernfalls kann eine zurückgestellte Sitzung über dem Budget
über Budget bleiben / veralten (OpenClaw rettet sie nicht mehr):

- Das Backend kompaktiert oder begrenzt sein eigenes Transkript zuverlässig, wenn es sich seinem Fenster nähert;
- es persistiert eine fortsetzbare Sitzung, sodass der kompaktierte Zustand über Turns hinweg erhalten bleibt
  (z. B. `--resume` / `--session-id`);
- es ist keine Native-Harness-Compaction-Sitzung - passende `agentHarnessId`-Sitzungen
  werden stattdessen an den Harness-Endpunkt weitergeleitet.

## MCP-Tool-Bridge

CLI-Backends erhalten OpenClaw-Tools nicht standardmäßig. Wenn die CLI eine
MCP-Konfiguration konsumieren kann, aktivieren Sie dies explizit:

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

| Modus                    | Verwendung                                                     |
| ------------------------ | -------------------------------------------------------------- |
| `claude-config-file`     | CLIs, die eine MCP-Konfigurationsdatei akzeptieren             |
| `codex-config-overrides` | CLIs, die Konfigurationsüberschreibungen im argv akzeptieren   |
| `gemini-system-settings` | CLIs, die MCP-Einstellungen aus ihrem System-Einstellungsverzeichnis lesen |

Aktivieren Sie die Bridge nur, wenn die CLI sie tatsächlich konsumieren kann. Wenn die CLI ihre
eigene eingebaute Tool-Ebene hat, die nicht deaktiviert werden kann, setzen Sie `nativeToolMode:
"always-on"`, damit OpenClaw geschlossen fehlschlagen kann, wenn ein Aufrufer keine nativen Tools erlaubt.

## Benutzerkonfiguration

Benutzer können jeden Backend-Default überschreiben:

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

Dokumentieren Sie die minimale Überschreibung, die Benutzer voraussichtlich benötigen. Üblicherweise ist das nur
`command`, wenn sich die Binärdatei außerhalb von `PATH` befindet.

## Verifizierung

Fügen Sie für gebündelte Plugins einen fokussierten Test rund um die Builder- und Setup-Registrierung hinzu und führen Sie dann die gezielte Test-Lane des Plugins aus:

```bash
pnpm test extensions/acme-cli
```

Verifizieren Sie für lokale oder installierte Plugins die Erkennung und einen echten Modelldurchlauf:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Wenn das Backend Bilder oder MCP unterstützt, fügen Sie einen Live-Smoke-Test hinzu, der diese Pfade mit der echten CLI nachweist. Verlassen Sie sich bei Prompt-, Bild-, MCP- oder Sitzungsfortsetzungsverhalten nicht auf statische Inspektion.

## Checkliste

<Check>`package.json` enthält `openclaw.extensions` und gebaute Runtime-Einträge für veröffentlichte Pakete</Check>
<Check>`openclaw.plugin.json` deklariert `cliBackends` und absichtliches `activation.onStartup`</Check>
<Check>`setup.cliBackends` ist vorhanden, wenn Setup/Modelldiscovery das Backend kalt sehen soll</Check>
<Check>`api.registerCliBackend(...)` verwendet dieselbe Backend-ID wie das Manifest</Check>
<Check>Benutzerüberschreibungen unter `agents.defaults.cliBackends.<id>` haben weiterhin Vorrang</Check>
<Check>Sitzungs-, System-Prompt-, Bild- und Ausgabeparser-Einstellungen entsprechen dem echten CLI-Vertrag</Check>
<Check>Gezielte Tests und mindestens ein Live-CLI-Smoke-Test weisen den Backend-Pfad nach</Check>

## Verwandt

- [CLI-Backends](/de/gateway/cli-backends) - Benutzerkonfiguration und Runtime-Verhalten
- [Plugins erstellen](/de/plugins/building-plugins) - Paket- und Manifest-Grundlagen
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview) - Referenz zur Registrierungs-API
- [Plugin-Manifest](/de/plugins/manifest) - `cliBackends` und Setup-Deskriptoren
- [Agent-Harness](/de/plugins/sdk-agent-harness) - vollständige externe Agent-Runtimes
