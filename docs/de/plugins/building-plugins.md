---
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie fügen OpenClaw einen neuen Kanal, einen neuen Provider, ein neues Tool oder eine andere Funktion hinzu
sidebarTitle: Getting Started
summary: Erstellen Sie Ihr erstes OpenClaw-Plugin in wenigen Minuten
title: Plugins erstellen
x-i18n:
    generated_at: "2026-05-06T06:57:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Funktionen: Channels, Modell-Provider,
Sprache, Echtzeit-Transkription, Echtzeit-Sprache, Medienverständnis,
Bildgenerierung, Videogenerierung, Webabruf, Websuche, Agent-Tools oder jede
Kombination daraus.

Sie müssen Ihr Plugin nicht zum OpenClaw-Repository hinzufügen. Veröffentlichen
Sie es in [ClawHub](/de/tools/clawhub), und Benutzer installieren es mit
`openclaw plugins install clawhub:<package-name>`. Reine Package-Spezifikationen
werden während der Launch-Umstellung weiterhin von npm installiert.

## Voraussetzungen

- Node >= 22 und ein Package-Manager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für Plugins im Repository: Repository geklont und `pnpm install` ausgeführt. Die
  Plugin-Entwicklung aus einem Source-Checkout ist nur mit pnpm möglich, weil OpenClaw gebündelte
  Plugins aus den Workspace-Packages `extensions/*` lädt.

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    OpenClaw mit einer Messaging-Plattform verbinden (Discord, IRC usw.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Einen Modell-Provider hinzufügen (LLM, Proxy oder benutzerdefinierter Endpunkt)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/de/plugins/hooks">
    Agent-Tools, Event-Hooks oder Dienste registrieren - fahren Sie unten fort
  </Card>
</CardGroup>

Für ein Channel-Plugin, dessen Installation beim Ausführen von Onboarding/Setup
nicht garantiert ist, verwenden Sie `createOptionalChannelSetupSurface(...)` aus
`openclaw/plugin-sdk/channel-setup`. Es erzeugt ein Paar aus Setup-Adapter und
Assistent, das auf die Installationsanforderung hinweist und echte Konfigurationsschreibvorgänge
geschlossen fehlschlagen lässt, bis das Plugin installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agent-Tool registriert. Für Channel-
und Provider-Plugins gibt es eigene oben verlinkte Anleitungen.

<Steps>
  <Step title="Create the package and manifest">
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

    Jedes Plugin benötigt ein Manifest, auch ohne Konfiguration. Zur Laufzeit registrierte Tools
    müssen in `contracts.tools` aufgeführt sein, damit OpenClaw das besitzende
    Plugin erkennen kann, ohne jede Plugin-Laufzeit zu laden. Plugins sollten außerdem
    `activation.onStartup` bewusst deklarieren. Dieses Beispiel setzt es auf `true`. Siehe
    [Manifest](/de/plugins/manifest) für das vollständige Schema. Die kanonischen ClawHub-
    Veröffentlichungsausschnitte befinden sich in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Write the entry point">

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
    `defineChannelPluginEntry` - siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).
    Vollständige Optionen für Einstiegspunkte finden Sie unter [Einstiegspunkte](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test and publish">

    **Externe Plugins:** Mit ClawHub validieren und veröffentlichen, dann installieren:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Reine Package-Spezifikationen wie `@myorg/openclaw-my-plugin` werden während
    der Launch-Umstellung von npm installiert. Verwenden Sie `clawhub:`, wenn Sie ClawHub-Auflösung wünschen.

    **Plugins im Repository:** Unter dem gebündelten Plugin-Workspace-Baum ablegen - sie werden automatisch erkannt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Funktionen

Ein einzelnes Plugin kann über das `api`-Objekt beliebig viele Funktionen registrieren:

| Funktion               | Registrierungsmethode                           | Ausführliche Anleitung                                                         |
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
| Webabruf               | `api.registerWebFetchProvider(...)`              | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Websuche               | `api.registerWebSearchProvider(...)`             | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tool-Ergebnis-Middleware | `api.registerAgentToolResultMiddleware(...)`   | [SDK-Übersicht](/de/plugins/sdk-overview#registration-api)                        |
| Agent-Tools            | `api.registerTool(...)`                          | Unten                                                                           |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                   | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                    |
| Plugin-Hooks           | `api.on(...)`                                    | [Plugin-Hooks](/de/plugins/hooks)                                                 |
| Interne Event-Hooks    | `api.registerHook(...)`                          | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                    |
| HTTP-Routen            | `api.registerHttpRoute(...)`                     | [Interna](/de/plugins/architecture-internals#gateway-http-routes)                 |
| CLI-Unterbefehle       | `api.registerCli(...)`                           | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                    |

Die vollständige Registrierungs-API finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#registration-api).

Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn sie
asynchrone Umschreibungen von Tool-Ergebnissen benötigen, bevor das Modell die Ausgabe sieht. Deklarieren Sie die
Ziel-Laufzeiten in `contracts.agentToolResultMiddleware`, zum Beispiel
`["pi", "codex"]`. Dies ist eine vertrauenswürdige Schnittstelle für gebündelte Plugins; externe
Plugins sollten reguläre OpenClaw-Plugin-Hooks bevorzugen, sofern OpenClaw keine
explizite Vertrauensrichtlinie für diese Funktion entwickelt.

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, belassen Sie sie unter einem
Plugin-spezifischen Präfix. Zentrale Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu
`operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope anfordert.

Wichtige Semantik von Hook-Guards:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agent-Ausführung und fordert den Benutzer über das Exec-Freigabe-Overlay, Telegram-Buttons, Discord-Interaktionen oder den Befehl `/approve` auf einem beliebigen Channel zur Freigabe auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.
- `message_received`: Bevorzugen Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Topic-Routing benötigen. Behalten Sie `metadata` für Channel-spezifische Extras bei.
- `message_sending`: Bevorzugen Sie typisierte Routing-Felder `replyToId` / `threadId` gegenüber Channel-spezifischen Metadatenschlüsseln.

Der Befehl `/approve` verarbeitet sowohl Exec- als auch Plugin-Freigaben mit begrenztem Fallback: Wenn eine Exec-Freigabe-ID nicht gefunden wird, versucht OpenClaw dieselbe ID erneut über Plugin-Freigaben. Plugin-Freigabeweiterleitung kann unabhängig über `approvals.plugin` in der Konfiguration eingerichtet werden.

Wenn benutzerdefinierte Freigabe-Verkabelung denselben begrenzten Fallback-Fall erkennen muss,
verwenden Sie bevorzugt `isApprovalNotFoundError` aus `openclaw/plugin-sdk/error-runtime`,
statt Freigabeablauf-Strings manuell abzugleichen.

Beispiele und die Hook-Referenz finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

## Agent-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können erforderlich (immer
verfügbar) oder optional (Opt-in durch Benutzer) sein:

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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
Plugin-Manifest deklariert werden:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw erfasst und cached den validierten Descriptor des registrierten Tools,
sodass Plugins keine `description`- oder Schemadaten im Manifest duplizieren. Der
Manifest-Vertrag deklariert nur Ownership und Discovery; die Ausführung ruft
weiterhin die live registrierte Tool-Implementierung auf.
Setzen Sie `toolMetadata.<tool>.optional: true` für Tools, die mit
`api.registerTool(..., { optional: true })` registriert wurden, damit OpenClaw
das Laden dieser Plugin Runtime vermeiden kann, bis das Tool explizit in die Allowlist aufgenommen wird.

Benutzer aktivieren optionale Tools in der Konfiguration:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tool-Namen dürfen nicht mit Core-Tools kollidieren (Konflikte werden übersprungen)
- Tools mit fehlerhaften Registrierungsobjekten, einschließlich fehlender `parameters`, werden übersprungen und in den Plugin-Diagnosen gemeldet, statt Agent-Ausführungen zu unterbrechen
- Verwenden Sie `optional: true` für Tools mit Seiteneffekten oder zusätzlichen Binäranforderungen
- Benutzer können alle Tools eines Plugins aktivieren, indem sie die Plugin-ID zu `tools.allow` hinzufügen

## CLI-Befehle registrieren

Plugins können Root-`openclaw`-Befehlsgruppen mit `api.registerCli` hinzufügen. Geben Sie
`descriptors` für jeden Top-Level-Befehlsstamm an, damit OpenClaw den Befehl
anzeigen und routen kann, ohne jede Plugin Runtime vorab zu laden.

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

Überprüfen Sie nach der Installation die Runtime-Registrierung und führen Sie den Befehl aus:

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
interne Importe - importieren Sie niemals Ihr eigenes Plugin über seinen SDK-Pfad.

Für Provider-Plugins sollten Provider-spezifische Hilfsfunktionen in diesen Package-Root-
Barrels bleiben, sofern die Schnittstelle nicht wirklich generisch ist. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und `service_tier`- / Beta-Hilfsfunktionen
- OpenAI: Provider-Builder, Hilfsfunktionen für Standardmodelle, Realtime-Provider
- OpenRouter: Provider-Builder plus Hilfsfunktionen für Onboarding/Konfiguration

Wenn eine Hilfsfunktion nur innerhalb eines gebündelten Provider-Pakets nützlich ist, belassen Sie sie auf dieser
Package-Root-Schnittstelle, statt sie nach `openclaw/plugin-sdk/*` zu verschieben.

Einige generierte `openclaw/plugin-sdk/<bundled-id>`-Hilfsschnittstellen existieren weiterhin für die
Wartung gebündelter Plugins, wenn dafür Owner-Nutzung nachverfolgt wurde. Behandeln Sie diese als
reservierte Oberflächen, nicht als Standardmuster für neue Drittanbieter-Plugins.

## Checkliste vor der Einreichung

<Check>**package.json** enthält korrekte `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden fokussierte `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Importe verwenden lokale Module, keine SDK-Selbstimporte</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (Plugins im Repository)</Check>

## Beta-Release-Tests

1. Achten Sie auf GitHub-Release-Tags bei [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie sie über `Watch` > `Releases`. Beta-Tags sehen wie `v2026.3.N-beta.1` aus. Sie können außerdem Benachrichtigungen für den offiziellen OpenClaw-X-Account [@openclaw](https://x.com/openclaw) aktivieren, um Release-Ankündigungen zu erhalten.
2. Testen Sie Ihr Plugin gegen den Beta-Tag, sobald er erscheint. Das Zeitfenster vor Stable beträgt normalerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` entweder `all good` oder was defekt ist. Falls Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas defekt ist, öffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und wenden Sie das Label `beta-blocker` an. Fügen Sie den Issue-Link in Ihren Thread ein.
5. Öffnen Sie einen PR nach `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Beitragende können PRs nicht labeln, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit PR werden gemergt; Blocker ohne PR werden möglicherweise trotzdem ausgeliefert. Maintainer beobachten diese Threads während der Beta-Tests.
6. Schweigen bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Erstellen Sie ein Messaging-Kanal-Plugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Erstellen Sie ein Modell-Provider-Plugin
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/de/plugins/sdk-overview">
    Import-Map und API-Referenz zur Registrierung
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testhilfen und Muster
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Manifest-Schemareferenz
  </Card>
</CardGroup>

## Verwandt

- [Plugin-Architektur](/de/plugins/architecture) - ausführlicher Einblick in die interne Architektur
- [SDK-Übersicht](/de/plugins/sdk-overview) - Plugin-SDK-Referenz
- [Manifest](/de/plugins/manifest) - Plugin-Manifestformat
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) - Kanal-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Plugins erstellen
