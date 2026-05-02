---
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie fügen OpenClaw einen neuen Kanal, Provider, ein Tool oder eine andere Funktion hinzu
sidebarTitle: Getting Started
summary: Erstellen Sie Ihr erstes OpenClaw-Plugin in wenigen Minuten
title: Plugins erstellen
x-i18n:
    generated_at: "2026-05-02T20:49:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Fähigkeiten: Channels, Modell-Provider,
Sprachausgabe und Spracherkennung, Echtzeit-Transkription, Echtzeit-Sprache,
Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf, Websuche,
Agent-Tools oder beliebige Kombinationen davon.

Sie müssen Ihr Plugin nicht zum OpenClaw-Repository hinzufügen. Veröffentlichen
Sie es in [ClawHub](/de/tools/clawhub); Benutzer installieren es mit
`openclaw plugins install clawhub:<package-name>`. Reine Package-Spezifikationen
installieren während der Launch-Umstellung weiterhin von npm.

## Voraussetzungen

- Node >= 22 und ein Paketmanager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für Plugins im Repository: Repository geklont und `pnpm install` ausgeführt.
  Plugin-Entwicklung aus einem Source-Checkout ist ausschließlich mit pnpm
  möglich, weil OpenClaw gebündelte Plugins aus den `extensions/*`-Workspace-Packages
  lädt.

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Channel-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    OpenClaw mit einer Messaging-Plattform verbinden (Discord, IRC usw.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Einen Modell-Provider hinzufügen (LLM, Proxy oder benutzerdefinierter Endpoint)
  </Card>
  <Card title="Tool-/Hook-Plugin" icon="wrench" href="/de/plugins/hooks">
    Agent-Tools, Event-Hooks oder Dienste registrieren — weiter unten fortfahren
  </Card>
</CardGroup>

Für ein Channel-Plugin, das nicht garantiert installiert ist, wenn Onboarding/Setup
ausgeführt wird, verwenden Sie `createOptionalChannelSetupSurface(...)` aus
`openclaw/plugin-sdk/channel-setup`. Es erzeugt ein Paar aus Setup-Adapter und
Assistent, das die Installationsanforderung ausweist und echte Config-Schreibvorgänge
geschlossen fehlschlagen lässt, bis das Plugin installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agent-Tool registriert.
Channel- und Provider-Plugins haben eigene Anleitungen, die oben verlinkt sind.

<Steps>
  <Step title="Package und Manifest erstellen">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
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
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Jedes Plugin benötigt ein Manifest, selbst ohne Config. Zur Laufzeit registrierte Tools
    müssen in `contracts.tools` aufgeführt sein, damit OpenClaw das zuständige
    Plugin erkennen kann, ohne jede Plugin-Laufzeit zu laden. Plugins sollten außerdem
    `activation.onStartup` bewusst deklarieren. Dieses Beispiel setzt es auf `true`. Das vollständige
    Schema finden Sie unter [Manifest](/de/plugins/manifest). Die kanonischen ClawHub-
    Veröffentlichungssnippets befinden sich in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Einstiegspunkt schreiben">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` ist für Nicht-Channel-Plugins gedacht. Für Channels verwenden Sie
    `defineChannelPluginEntry` — siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).
    Die vollständigen Optionen für Einstiegspunkte finden Sie unter [Einstiegspunkte](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testen und veröffentlichen">

    **Externe Plugins:** Mit ClawHub validieren und veröffentlichen, dann installieren:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Reine Package-Spezifikationen wie `@myorg/openclaw-my-plugin` installieren während
    der Launch-Umstellung von npm. Verwenden Sie `clawhub:`, wenn Sie ClawHub-Auflösung wünschen.

    **Plugins im Repository:** Platzieren Sie sie unter dem gebündelten Plugin-Workspace-Baum — sie werden automatisch erkannt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Fähigkeiten

Ein einzelnes Plugin kann über das `api`-Objekt beliebig viele Fähigkeiten registrieren:

| Fähigkeit              | Registrierungsmethode                            | Ausführliche Anleitung                                                         |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Text-Inferenz (LLM)    | `api.registerProvider(...)`                      | [Provider-Plugins](/de/plugins/sdk-provider-plugins)                              |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | [CLI-Backends](/de/gateway/cli-backends)                                          |
| Channel / Messaging    | `api.registerChannel(...)`                       | [Channel-Plugins](/de/plugins/sdk-channel-plugins)                                |
| Sprache (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeit-Sprache       | `api.registerRealtimeVoiceProvider(...)`         | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Websuche               | `api.registerWebSearchProvider(...)`             | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tool-Result-Middleware | `api.registerAgentToolResultMiddleware(...)`     | [SDK-Übersicht](/de/plugins/sdk-overview#registration-api)                        |
| Agent-Tools            | `api.registerTool(...)`                          | Unten                                                                           |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                   | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                    |
| Plugin-Hooks           | `api.on(...)`                                    | [Plugin-Hooks](/de/plugins/hooks)                                                 |
| Interne Event-Hooks    | `api.registerHook(...)`                          | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                    |
| HTTP-Routen            | `api.registerHttpRoute(...)`                     | [Interna](/de/plugins/architecture-internals#gateway-http-routes)                 |
| CLI-Unterbefehle       | `api.registerCli(...)`                           | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                    |

Die vollständige Registrierungs-API finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#registration-api).

Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn sie
eine asynchrone Umschreibung von Tool-Ergebnissen benötigen, bevor das Modell die Ausgabe sieht. Deklarieren Sie die
Ziel-Laufzeiten in `contracts.agentToolResultMiddleware`, zum Beispiel
`["pi", "codex"]`. Dies ist eine vertrauenswürdige Schnittstelle für gebündelte Plugins; externe
Plugins sollten reguläre OpenClaw-Plugin-Hooks bevorzugen, sofern OpenClaw keine
explizite Vertrauensrichtlinie für diese Fähigkeit einführt.

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, halten Sie sie auf einem
Plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu
`operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope anfordert.

Zu beachtende Hook-Guard-Semantik:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agent-Ausführung und fordert den Benutzer über das Exec-Freigabe-Overlay, Telegram-Buttons, Discord-Interaktionen oder den `/approve`-Befehl in einem beliebigen Channel zur Freigabe auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.
- `message_received`: Bevorzugen Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Topic-Routing benötigen. Behalten Sie `metadata` für Channel-spezifische Extras bei.
- `message_sending`: Bevorzugen Sie die typisierten Routing-Felder `replyToId` / `threadId` gegenüber Channel-spezifischen Metadaten-Schlüsseln.

Der Befehl `/approve` verarbeitet sowohl Exec- als auch Plugin-Freigaben mit begrenztem Fallback: Wenn eine Exec-Freigabe-ID nicht gefunden wird, versucht OpenClaw dieselbe ID erneut über Plugin-Freigaben. Die Weiterleitung von Plugin-Freigaben kann unabhängig über `approvals.plugin` in der Config konfiguriert werden.

Wenn benutzerdefinierte Freigabe-Logik denselben begrenzten Fallback-Fall erkennen muss,
verwenden Sie bevorzugt `isApprovalNotFoundError` aus `openclaw/plugin-sdk/error-runtime`,
statt Freigabe-Ablaufstrings manuell abzugleichen.

Beispiele und die Hook-Referenz finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

## Agent-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können erforderlich (immer
verfügbar) oder optional (Benutzer-Opt-in) sein:

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Jedes mit `api.registerTool(...)` registrierte Tool muss auch im
Plugin-Manifest deklariert sein:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw erfasst und cached den validierten Deskriptor aus dem registrierten Tool,
sodass Plugins `description` oder Schemadaten nicht im Manifest duplizieren. Der
Manifest-Contract deklariert nur Zuständigkeit und Erkennung; die Ausführung ruft weiterhin
die live registrierte Tool-Implementierung auf.

Benutzer aktivieren optionale Tools in der Config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tool-Namen dürfen nicht mit Kern-Tools kollidieren (Konflikte werden übersprungen)
- Tools mit fehlerhaft geformten Registrierungsobjekten, einschließlich fehlender `parameters`, werden übersprungen und in der Plugin-Diagnose gemeldet, statt Agent-Läufe zu unterbrechen
- Verwenden Sie `optional: true` für Tools mit Seiteneffekten oder zusätzlichen Binäranforderungen
- Benutzer können alle Tools eines Plugins aktivieren, indem sie die Plugin-ID zu `tools.allow` hinzufügen

## CLI-Befehle registrieren

Plugins können mit `api.registerCli` Stamm-Befehlsgruppen für `openclaw` hinzufügen. Geben Sie
`descriptors` für jeden obersten Befehlsstamm an, damit OpenClaw den Befehl anzeigen und
weiterleiten kann, ohne jede Plugin-Runtime vorab zu laden.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Prüfen Sie nach der Installation die Runtime-Registrierung und führen Sie den Befehl aus:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Import-Konventionen

Importieren Sie immer aus fokussierten `openclaw/plugin-sdk/<subpath>`-Pfaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Die vollständige Subpath-Referenz finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview).

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien (`api.ts`, `runtime-api.ts`) für
interne Importe — importieren Sie Ihr eigenes Plugin niemals über seinen SDK-Pfad.

Für Provider-Plugins sollten providerspezifische Helfer in diesen Barrels im Paketstamm
bleiben, sofern die Schnittstelle nicht wirklich generisch ist. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und `service_tier`- / Beta-Helfer
- OpenAI: Provider-Builder, Standardmodell-Helfer, Echtzeit-Provider
- OpenRouter: Provider-Builder plus Onboarding-/Konfigurationshelfer

Wenn ein Helfer nur innerhalb eines gebündelten Provider-Pakets nützlich ist, belassen Sie ihn auf dieser
Paketstamm-Schnittstelle, statt ihn in `openclaw/plugin-sdk/*` zu befördern.

Einige generierte `openclaw/plugin-sdk/<bundled-id>`-Hilfsschnittstellen bestehen noch für die
Wartung gebündelter Plugins, wenn sie verfolgte Owner-Nutzung haben. Behandeln Sie diese als
reservierte Oberflächen, nicht als Standardmuster für neue Drittanbieter-Plugins.

## Checkliste vor der Einreichung

<Check>**package.json** enthält korrekte `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden fokussierte `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Importe verwenden lokale Module, keine SDK-Selbstimporte</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (repositoryinterne Plugins)</Check>

## Beta-Release-Tests

1. Achten Sie auf GitHub-Release-Tags auf [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie sie über `Watch` > `Releases`. Beta-Tags sehen aus wie `v2026.3.N-beta.1`. Sie können außerdem Benachrichtigungen für das offizielle OpenClaw-X-Konto [@openclaw](https://x.com/openclaw) für Release-Ankündigungen aktivieren.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Zeitfenster bis zum stabilen Release beträgt typischerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` entweder `all good` oder was nicht funktioniert hat. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas nicht funktioniert, öffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und wenden Sie das Label `beta-blocker` an. Fügen Sie den Issue-Link in Ihren Thread ein.
5. Öffnen Sie einen PR nach `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Beitragende können PRs nicht labeln, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit einem PR werden gemergt; Blocker ohne PR werden möglicherweise trotzdem ausgeliefert. Maintainer beobachten diese Threads während der Beta-Tests.
6. Stille bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Channel-Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Erstellen Sie ein Messaging-Channel-Plugin
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Erstellen Sie ein Modell-Provider-Plugin
  </Card>
  <Card title="SDK-Übersicht" icon="book-open" href="/de/plugins/sdk-overview">
    Import-Map- und Registrierungs-API-Referenz
  </Card>
  <Card title="Runtime-Helfer" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testhilfen und Muster
  </Card>
  <Card title="Plugin-Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Manifest-Schemareferenz
  </Card>
</CardGroup>

## Verwandt

- [Plugin-Architektur](/de/plugins/architecture) — tiefer Einblick in die interne Architektur
- [SDK-Übersicht](/de/plugins/sdk-overview) — Referenz zum Plugin-SDK
- [Manifest](/de/plugins/manifest) — Format des Plugin-Manifests
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) — Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
