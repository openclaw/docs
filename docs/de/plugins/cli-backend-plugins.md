---
read_when:
    - Sie erstellen ein Plugin für ein lokales KI-CLI-Backend
    - Sie möchten ein Backend für Modellreferenzen wie acme-cli/model registrieren
    - Sie müssen eine Drittanbieter-CLI dem Text-Fallback-Runner von OpenClaw zuordnen
sidebarTitle: CLI backend plugins
summary: Erstellen Sie ein Plugin, das ein lokales KI-CLI-Backend registriert
title: CLI-Backend-Plugins erstellen
x-i18n:
    generated_at: "2026-07-12T15:40:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI-Backend-Plugins ermöglichen es OpenClaw, eine lokale KI-CLI als Backend für
Textinferenz aufzurufen. Das Backend erscheint als Provider-Präfix in Modellreferenzen:

```text
acme-cli/acme-large
```

Verwenden Sie ein CLI-Backend, wenn die vorgelagerte Integration bereits als lokaler
Befehl verfügbar ist, wenn die CLI den lokalen Anmeldestatus verwaltet oder als Ausweichlösung,
wenn API-Provider nicht verfügbar sind.

<Info>
  Wenn der vorgelagerte Dienst eine normale HTTP-Modell-API bereitstellt, schreiben Sie
  stattdessen ein [Provider-Plugin](/de/plugins/sdk-provider-plugins). Wenn die vorgelagerte
  Laufzeit vollständige Agentensitzungen, Tool-Ereignisse, Compaction oder den Status von
  Hintergrundaufgaben verwaltet, verwenden Sie ein [Agent-Harness](/de/plugins/sdk-agent-harness).
</Info>

## Zuständigkeit des Plugins

Ein CLI-Backend-Plugin hat drei Verträge:

| Vertrag              | Datei                  | Zweck                                                        |
| -------------------- | ---------------------- | ------------------------------------------------------------ |
| Paketeinstiegspunkt  | `package.json`         | Verweist OpenClaw auf das Laufzeitmodul des Plugins           |
| Manifestzuständigkeit | `openclaw.plugin.json` | Deklariert die Backend-ID, bevor die Laufzeit geladen wird    |
| Laufzeitregistrierung | `index.ts`             | Ruft `api.registerCliBackend(...)` mit Befehlsvorgaben auf    |

Das Manifest enthält Metadaten für die Erkennung: Es führt die CLI nicht aus und registriert
kein Laufzeitverhalten. Das Laufzeitverhalten beginnt, wenn der Plugin-Einstiegspunkt
`api.registerCliBackend(...)` aufruft.

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

    Veröffentlichte Pakete müssen erstellte JavaScript-Laufzeitdateien enthalten. Wenn Ihr
    Quell-Einstiegspunkt `./src/index.ts` ist, fügen Sie `openclaw.runtimeExtensions` hinzu,
    das auf das erstellte JavaScript-Gegenstück verweist. Siehe
    [Einstiegspunkte](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Backend-Zuständigkeit deklarieren">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Die lokale KI-CLI von Acme über OpenClaw ausführen",
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

    `cliBackends` ist die Liste der Laufzeitzuständigkeiten. Dadurch kann OpenClaw das
    Plugin automatisch laden, wenn die Konfiguration oder Modellauswahl
    `acme-cli/...` erwähnt.

    `setup.cliBackends` ist die deskriptorbasierte Einrichtungsoberfläche. Fügen Sie sie
    hinzu, wenn Modellerkennung, Onboarding oder Status das Backend erkennen sollen,
    ohne die Plugin-Laufzeit zu laden. Verwenden Sie `requiresRuntime: false` nur, wenn
    diese statischen Deskriptoren für die Einrichtung ausreichen.

  </Step>

  <Step title="Backend registrieren">
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

    Die Backend-ID muss mit dem `cliBackends`-Eintrag im Manifest übereinstimmen. Die
    registrierte `config` ist nur die Vorgabe. Die Benutzerkonfiguration unter
    `agents.defaults.cliBackends.acme-cli` wird zur Laufzeit darübergelegt.

  </Step>
</Steps>

## Konfigurationsstruktur

`CliBackendConfig` beschreibt, wie OpenClaw die CLI starten und analysieren soll:

| Feld                                                      | Verwendung                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `command`                                                 | Binärdateiname oder absoluter Befehlspfad                                               |
| `args`                                                    | Basis-argv für neue Ausführungen                                                        |
| `resumeArgs`                                              | Alternatives argv für fortgesetzte Sitzungen; unterstützt `{sessionId}`                |
| `output` / `resumeOutput`                                 | Parser: `json`, `jsonl` oder `text`                                                     |
| `jsonlDialect`                                            | JSONL-Ereignisdialekt: `claude-stream-json` oder `gemini-stream-json`                  |
| `liveSession`                                             | Modus für langlebige CLI-Prozesse (`claude-stdio`)                                      |
| `input`                                                   | Prompt-Übertragung: `arg` oder `stdin`                                                  |
| `maxPromptArgChars`                                       | Maximale Prompt-Länge im Modus `arg`, bevor auf stdin zurückgegriffen wird              |
| `env` / `clearEnv`                                        | Zusätzliche einzufügende Umgebungsvariablen oder vor dem Start zu entfernende Namen    |
| `modelArg`                                                | Flag, das vor der Modell-ID verwendet wird                                              |
| `modelAliases`                                            | Ordnet OpenClaw-Modell-IDs CLI-nativen IDs zu                                           |
| `sessionArg` / `sessionArgs`                              | Art der Übergabe einer Sitzungs-ID                                                      |
| `sessionMode`                                             | `always`, `existing` oder `none`                                                        |
| `sessionIdFields`                                         | JSON-Felder, die OpenClaw aus der CLI-Ausgabe liest                                     |
| `systemPromptArg` / `systemPromptFileArg`                 | Übertragung des System-Prompts                                                         |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Übertragung einer Konfigurationsüberschreibung für eine System-Prompt-Datei (z. B. `-c`) |
| `systemPromptMode`                                        | `append` oder `replace`                                                                |
| `systemPromptWhen`                                        | `first`, `always` oder `never`                                                         |
| `imageArg` / `imageMode`                                  | Flag für den Bildpfad und Übergabeart mehrerer Bilder (`repeat` oder `list`)            |
| `imagePathScope`                                          | Speicherort bereitgestellter Bilddateien vor der Übergabe: `temp` oder `workspace`      |
| `serialize`                                               | Ausführungen desselben Backends geordnet halten                                        |
| `reseedFromRawTranscriptWhenUncompacted`                  | Begrenztes erneutes Einlesen des Rohtranskripts vor der Compaction für sichere Sitzungszurücksetzungen aktivieren |
| `reliability.outputLimits`                                | Maximal beibehaltene Zeichen/Zeilen des JSONL-Rohtexts für einen aktiven CLI-Durchlauf (Live-Session-Backends) |
| `reliability.watchdog`                                    | Abstimmung des Zeitlimits ohne Ausgabe, getrennt für neue und fortgesetzte Ausführungen |

Bevorzugen Sie die kleinste statische Konfiguration, die zur CLI passt. Fügen Sie
Plugin-Callbacks nur für Verhalten hinzu, für das tatsächlich das Backend zuständig ist.

## Erweiterte Backend-Hooks

`CliBackendPlugin` kann außerdem Folgendes definieren:

| Hook                               | Verwendung                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Veraltete Benutzerkonfiguration nach dem Zusammenführen umschreiben           |
| `resolveExecutionArgs(ctx)`        | Anfragespezifische Flags wie Denkaufwand oder Isolation von Nebenfragen hinzufügen |
| `prepareExecution(ctx)`            | Temporäre Authentifizierungs- oder Konfigurationsbrücken vor dem Start erstellen |
| `transformSystemPrompt(ctx)`       | Eine abschließende CLI-spezifische Transformation des System-Prompts anwenden |
| `textTransforms`                   | Bidirektionale Ersetzungen in Prompt und Ausgabe                              |
| `defaultAuthProfileId`             | Ein bestimmtes OpenClaw-Authentifizierungsprofil bevorzugen                   |
| `authEpochMode`                    | Festlegen, wie Authentifizierungsänderungen gespeicherte CLI-Sitzungen ungültig machen |
| `nativeToolMode`                   | Deklarieren, ob native Tools fehlen, immer aktiviert oder vom Host auswählbar sind |
| `sideQuestionToolMode`             | Deaktivierte native Tools für `/btw`-Nebenfragen deklarieren                  |
| `bundleMcp` / `bundleMcpMode`      | OpenClaws Loopback-MCP-Tool-Brücke aktivieren                                 |
| `ownsNativeCompaction`             | Das Backend verwaltet seine eigene Compaction – OpenClaw stellt sie zurück    |
| `runtimeArtifact`                  | Einen Skript-Launcher an seinen vollständigen gebündelten Paketbaum binden    |

Belassen Sie diese Hooks in der Zuständigkeit des Providers. Fügen Sie dem Kern keine
CLI-spezifischen Zweige hinzu, wenn ein Backend-Hook das Verhalten ausdrücken kann.

`runtimeArtifact` gehört dem Plugin und kann nicht vom Benutzer überschrieben werden. Es wird
nur herangezogen, wenn ein aktiver Inferenzdurchlauf eine verifizierte Einrichtungsberechtigung
erstellt oder erneut validiert; normale CLI-Ausführungen benötigen es nicht. Ein Backend ohne
diese Deklaration kann keine verifizierte CLI-Einrichtungsberechtigung erstellen. Eine
`bundled-package-tree`-Deklaration benennt den exakten Eigentümer der `package.json` und
erfordert, dass der Paketeinstiegspunkt der Befehl ist. OpenClaw hasht den begrenzten,
vollständigen installierten Paketbaum einschließlich verschachtelter Abhängigkeiten und
bricht sicher ab bei umleitenden symbolischen Links, Launchern außerhalb des deklarierten
Pakets, Deklarationen erforderlicher externer Abhängigkeiten, übergroßen Bäumen und
unbekannten Skripten. Deklarieren Sie dies nur, wenn dieser Baum die vollständige
Inferenzimplementierung enthält; optionale Tool-Integrationen machen einen externen
Implementierungsgraphen nicht sicher.

Wenn dasselbe Backend außerdem eine eigenständige native ausführbare Datei bereitstellt,
führen Sie deren kanonische Basisnamen in `nativeExecutableNames` auf. Andere native Befehle
bleiben unverifiziert, selbst wenn ein Benutzer den Backend-Befehl überschreibt.

`ctx.executionMode` ist bei normalen Durchläufen `"agent"` und bei kurzlebigen
`/btw`-Aufrufen `"side-question"`. Verwenden Sie es, wenn die CLI andere
Einmal-Flags benötigt, etwa um native Tools, Sitzungspersistenz oder das
Fortsetzungsverhalten für BTW zu deaktivieren. Wenn ein Backend normalerweise
`nativeToolMode: "always-on"` verwendet, seine Argumente für Nebenfragen diese
Tools jedoch zuverlässig deaktivieren, setzen Sie außerdem
`sideQuestionToolMode: "disabled"`; andernfalls schlägt OpenClaw sicher fehl,
wenn BTW einen CLI-Lauf ohne Tools erfordert.

Setzen Sie `nativeToolMode: "selectable"` nur, wenn `resolveExecutionArgs` für
einen einzelnen Lauf jedes backend-native Tool deaktivieren kann. Bei diesen
eingeschränkten Läufen ist `ctx.toolAvailability.native` ein leeres Tupel und
`ctx.toolAvailability.mcp` die exakte, vom Host isolierte MCP-Zulassungsliste.
Der Hook muss kollidierende Tool-Flags ersetzen und Argumente zurückgeben, die
beide Werte durchsetzen; OpenClaw ruft ihn einmal mit den endgültigen
Argumenten für einen neuen oder fortgesetzten Lauf auf und schlägt sicher fehl,
wenn das Backend die Einschränkung nicht durchsetzen kann. MCP-Namen können in
diesem Kontext nur deshalb sicher automatisch genehmigt werden, weil der Host
die generierte MCP-Konfiguration bereits auf diese Server und Tools beschränkt
hat.

### `ownsNativeCompaction`: OpenClaw-Compaction deaktivieren

Wenn Ihr Backend einen Agenten ausführt, der sein **eigenes** Transkript
komprimiert, setzen Sie `ownsNativeCompaction: true`, damit der
Sicherheits-Zusammenfasser von OpenClaw niemals für dessen Sitzungen ausgeführt
wird – der CLI-Compaction-Lebenszyklus führt keine Aktion aus und der Durchlauf
wird fortgesetzt. `claude-cli` deklariert dies, da Claude Code intern ohne
Harness-Endpunkt komprimiert. Native Harness-Sitzungen wie Codex werden
stattdessen weiterhin an ihren Harness-Compaction-Endpunkt weitergeleitet.

**Deklarieren Sie dies nur, wenn alle folgenden Bedingungen erfüllt sind**,
andernfalls kann eine zurückgestellte Sitzung, die ihr Budget überschreitet,
über dem Budget bleiben oder veralten (OpenClaw fängt sie nicht mehr ab):

- Das Backend komprimiert oder begrenzt sein eigenes Transkript zuverlässig,
  wenn es sich seinem Fenster nähert;
- es speichert eine fortsetzbare Sitzung dauerhaft, sodass der komprimierte
  Zustand über mehrere Durchläufe hinweg erhalten bleibt (zum Beispiel
  `--resume` / `--session-id`);
- es handelt sich nicht um eine native Harness-Compaction-Sitzung – Sitzungen
  mit übereinstimmender `agentHarnessId` werden stattdessen an den
  Harness-Endpunkt weitergeleitet.

## MCP-Tool-Bridge

CLI-Backends erhalten OpenClaw-Tools nicht standardmäßig. Wenn die CLI eine
MCP-Konfiguration verarbeiten kann, aktivieren Sie dies ausdrücklich:

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

Unterstützte Bridge-Modi:

| Modus                    | Verwendung                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| `claude-config-file`     | CLIs, die eine MCP-Konfigurationsdatei akzeptieren                 |
| `codex-config-overrides` | CLIs, die Konfigurationsüberschreibungen über argv akzeptieren     |
| `gemini-system-settings` | CLIs, die MCP-Einstellungen aus ihrem Systemeinstellungsverzeichnis lesen |

Aktivieren Sie die Bridge nur, wenn die CLI sie tatsächlich verarbeiten kann. Wenn die CLI
über eine eigene integrierte Tool-Schicht verfügt, die nicht deaktiviert werden kann, setzen Sie `nativeToolMode:
"always-on"`, damit OpenClaw nach dem Fail-Closed-Prinzip abbrechen kann, wenn ein Aufrufer keine nativen
Tools zulässt. Wenn sie alle nativen Tools für jeden Lauf deaktivieren kann, verwenden Sie `"selectable"` mit dem
oben beschriebenen `resolveExecutionArgs`-Vertrag.

## Benutzerkonfiguration

Benutzer können jeden Backend-Standardwert überschreiben:

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

Dokumentieren Sie die minimale Überschreibung, die Benutzer wahrscheinlich benötigen – normalerweise nur
`command`, wenn sich die Binärdatei außerhalb von `PATH` befindet.

## Überprüfung

Fügen Sie für gebündelte Plugins einen gezielten Test für den Builder und die Setup-
Registrierung hinzu und führen Sie anschließend den gezielten Testlauf des Plugins aus:

```bash
pnpm test extensions/acme-cli
```

Überprüfen Sie bei lokalen oder installierten Plugins die Erkennung und einen echten Modelllauf:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Wenn das Backend Bilder oder MCP unterstützt, fügen Sie einen Live-Smoke-Test hinzu, der diese
Pfade mit der echten CLI nachweist. Verlassen Sie sich für das Verhalten von Prompt, Bildern,
MCP oder Sitzungsfortsetzung nicht auf eine statische Prüfung.

## Checkliste

<Check>`package.json` enthält `openclaw.extensions` und gebaute Laufzeiteinträge für veröffentlichte Pakete</Check>
<Check>`openclaw.plugin.json` deklariert `cliBackends` und das bewusst gewählte `activation.onStartup`</Check>
<Check>`setup.cliBackends` ist vorhanden, wenn Setup/Modellerkennung das Backend im kalten Zustand erkennen soll</Check>
<Check>`api.registerCliBackend(...)` verwendet dieselbe Backend-ID wie das Manifest</Check>
<Check>Benutzerüberschreibungen unter `agents.defaults.cliBackends.<id>` haben weiterhin Vorrang</Check>
<Check>Einstellungen für Sitzung, System-Prompt, Bilder und Ausgabeparser entsprechen dem tatsächlichen CLI-Vertrag</Check>
<Check>Gezielte Tests und mindestens ein Live-CLI-Smoke-Test weisen den Backend-Pfad nach</Check>

## Verwandte Themen

- [CLI-Backends](/de/gateway/cli-backends) – Benutzerkonfiguration und Laufzeitverhalten
- [Plugins erstellen](/de/plugins/building-plugins) – Grundlagen zu Paket und Manifest
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview) – API-Referenz zur Registrierung
- [Plugin-Manifest](/de/plugins/manifest) – `cliBackends` und Setup-Deskriptoren
- [Agent-Harness](/de/plugins/sdk-agent-harness) – vollständige externe Agent-Laufzeitumgebungen
