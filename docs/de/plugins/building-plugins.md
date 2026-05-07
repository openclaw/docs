---
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen eine Schnellstartanleitung für die Plugin-Entwicklung
    - Sie fügen OpenClaw einen neuen Kanal, einen neuen Provider, ein neues Tool oder eine andere Funktion hinzu
sidebarTitle: Getting Started
summary: Erstellen Sie in wenigen Minuten Ihr erstes OpenClaw-Plugin
title: Plugins erstellen
x-i18n:
    generated_at: "2026-05-07T13:22:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis,
Bildgenerierung, Videogenerierung, Webabruf, Websuche, Agent-Tools oder jede
Kombination daraus.

Sie müssen Ihr Plugin nicht zum OpenClaw-Repository hinzufügen. Veröffentlichen
Sie es in [ClawHub](/de/tools/clawhub), und Benutzer installieren es mit
`openclaw plugins install clawhub:<package-name>`. Reine Paketangaben
installieren während der Launch-Umstellung weiterhin von npm.

## Voraussetzungen

- Node >= 22 und ein Paketmanager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für Plugins im Repository: Repository geklont und `pnpm install` ausgeführt. Die
  Plugin-Entwicklung aus einem Source-Checkout ist nur mit pnpm möglich, weil OpenClaw gebündelte
  Plugins aus den `extensions/*`-Workspace-Paketen lädt.

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Kanal-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Verbinden Sie OpenClaw mit einer Messaging-Plattform (Discord, IRC usw.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Fügen Sie einen Modell-Provider hinzu (LLM, Proxy oder benutzerdefinierter Endpunkt)
  </Card>
  <Card title="CLI-Backend-Plugin" icon="terminal" href="/de/plugins/cli-backend-plugins">
    Ordnen Sie eine lokale KI-CLI dem Text-Fallback-Runner von OpenClaw zu
  </Card>
  <Card title="Tool-/Hook-Plugin" icon="wrench" href="/de/plugins/hooks">
    Registrieren Sie Agent-Tools, Event-Hooks oder Dienste - weiter unten
  </Card>
</CardGroup>

Für ein Kanal-Plugin, dessen Installation beim Ausführen von Onboarding/Setup
nicht garantiert ist, verwenden Sie `createOptionalChannelSetupSurface(...)` aus
`openclaw/plugin-sdk/channel-setup`. Dies erzeugt ein Setup-Adapter- und Assistenten-Paar,
das auf die Installationsanforderung hinweist und echte Konfigurationsschreibvorgänge
geschlossen fehlschlagen lässt, bis das Plugin installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agent-Tool registriert. Kanal-
und Provider-Plugins haben eigene, oben verlinkte Anleitungen.

<Steps>
  <Step title="Paket und Manifest erstellen">
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
    Plugin erkennen kann, ohne jede Plugin-Runtime zu laden. Plugins sollten außerdem
    `activation.onStartup` bewusst deklarieren. Dieses Beispiel setzt es auf `true`. Siehe
    [Manifest](/de/plugins/manifest) für das vollständige Schema. Die kanonischen ClawHub-
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

    `definePluginEntry` ist für Nicht-Kanal-Plugins vorgesehen. Für Kanäle verwenden Sie
    `defineChannelPluginEntry` - siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins).
    Vollständige Optionen für Einstiegspunkte finden Sie unter [Einstiegspunkte](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testen und veröffentlichen">

    **Externe Plugins:** Validieren und veröffentlichen Sie mit ClawHub, dann installieren Sie:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Reine Paketangaben wie `@myorg/openclaw-my-plugin` installieren während
    der Launch-Umstellung von npm. Verwenden Sie `clawhub:`, wenn Sie ClawHub-Auflösung möchten.

    **Plugins im Repository:** Legen Sie sie unterhalb des Workspace-Baums für gebündelte Plugins ab - sie werden automatisch erkannt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Funktionen

Ein einzelnes Plugin kann über das `api`-Objekt beliebig viele Funktionen registrieren:

| Funktion               | Registrierungsmethode                            | Ausführliche Anleitung                                                          |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Textinferenz (LLM)     | `api.registerProvider(...)`                      | [Provider-Plugins](/de/plugins/sdk-provider-plugins)                               |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins)                             |
| Kanal / Messaging      | `api.registerChannel(...)`                       | [Kanal-Plugins](/de/plugins/sdk-channel-plugins)                                   |
| Sprache (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeittranskription  | `api.registerRealtimeTranscriptionProvider(...)` | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeitstimme         | `api.registerRealtimeVoiceProvider(...)`         | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Webabruf               | `api.registerWebFetchProvider(...)`              | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Websuche               | `api.registerWebSearchProvider(...)`             | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tool-Ergebnis-Middleware | `api.registerAgentToolResultMiddleware(...)`   | [SDK-Übersicht](/de/plugins/sdk-overview#registration-api)                         |
| Agent-Tools            | `api.registerTool(...)`                          | Unten                                                                           |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                   | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                     |
| Plugin-Hooks           | `api.on(...)`                                    | [Plugin-Hooks](/de/plugins/hooks)                                                  |
| Interne Event-Hooks    | `api.registerHook(...)`                          | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                     |
| HTTP-Routen            | `api.registerHttpRoute(...)`                     | [Interna](/de/plugins/architecture-internals#gateway-http-routes)                  |
| CLI-Unterbefehle       | `api.registerCli(...)`                           | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                     |

Die vollständige Registrierungs-API finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#registration-api).

Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn sie
asynchrone Umschreibungen von Tool-Ergebnissen benötigen, bevor das Modell die Ausgabe sieht. Deklarieren Sie die
Ziel-Runtimes in `contracts.agentToolResultMiddleware`, zum Beispiel
`["pi", "codex"]`. Dies ist eine vertrauenswürdige Schnittstelle für gebündelte Plugins; externe
Plugins sollten reguläre OpenClaw-Plugin-Hooks bevorzugen, solange OpenClaw keine
explizite Vertrauensrichtlinie für diese Funktion bereitstellt.

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, halten Sie diese unter einem
Plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu
`operator.admin` aufgelöst, auch wenn ein Plugin einen engeren Scope anfordert.

Hook-Guard-Semantik, die Sie beachten sollten:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agent-Ausführung und fordert den Benutzer über das Exec-Genehmigungs-Overlay, Telegram-Buttons, Discord-Interaktionen oder den Befehl `/approve` in einem beliebigen Kanal zur Genehmigung auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.
- `message_received`: Bevorzugen Sie das typisierte Feld `threadId`, wenn Sie Routing für eingehende Threads/Themen benötigen. Verwenden Sie `metadata` weiterhin für kanalspezifische Extras.
- `message_sending`: Bevorzugen Sie die typisierten Routing-Felder `replyToId` / `threadId` gegenüber kanalspezifischen Metadatenschlüsseln.

Der Befehl `/approve` verarbeitet sowohl Exec- als auch Plugin-Genehmigungen mit begrenztem Fallback: Wenn eine Exec-Genehmigungs-ID nicht gefunden wird, versucht OpenClaw dieselbe ID erneut über Plugin-Genehmigungen. Die Weiterleitung von Plugin-Genehmigungen kann unabhängig über `approvals.plugin` in der Konfiguration eingerichtet werden.

Wenn benutzerdefinierte Genehmigungslogik denselben begrenzten Fallback-Fall erkennen muss,
verwenden Sie vorzugsweise `isApprovalNotFoundError` aus `openclaw/plugin-sdk/error-runtime`,
statt Genehmigungsablaufzeichenfolgen manuell abzugleichen.

Beispiele und die Hook-Referenz finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

## Agent-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können erforderlich (immer
verfügbar) oder optional (Benutzer-Opt-in) sein:

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

Jedes Tool, das mit `api.registerTool(...)` registriert wird, muss auch im
Plugin-Manifest deklariert sein:

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

OpenClaw erfasst und cached den validierten Deskriptor aus dem registrierten Tool,
damit Plugins `description`- oder Schemadaten nicht im Manifest duplizieren. Der
Manifest-Vertrag deklariert nur Ownership und Erkennung; die Ausführung ruft
weiterhin die live registrierte Tool-Implementierung auf.
Setzen Sie `toolMetadata.<tool>.optional: true` für Tools, die mit
`api.registerTool(..., { optional: true })` registriert wurden, damit OpenClaw das
Plugin-Runtime erst laden muss, wenn das Tool ausdrücklich in die Allowlist aufgenommen wurde.

Benutzer aktivieren optionale Tools in der Konfiguration:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tool-Namen dürfen nicht mit Core-Tools kollidieren (Konflikte werden übersprungen)
- Tools mit fehlerhaften Registrierungsobjekten, einschließlich fehlendem `parameters`, werden übersprungen und in Plugin-Diagnosen gemeldet, anstatt Agent-Ausführungen zu unterbrechen
- Verwenden Sie `optional: true` für Tools mit Seiteneffekten oder zusätzlichen Binäranforderungen
- Benutzer können alle Tools eines Plugins aktivieren, indem sie die Plugin-ID zu `tools.allow` hinzufügen

## CLI-Befehle registrieren

Plugins können Root-`openclaw`-Befehlsgruppen mit `api.registerCli` hinzufügen. Geben Sie
`descriptors` für jeden Top-Level-Befehlsstamm an, damit OpenClaw den Befehl anzeigen und weiterleiten kann,
ohne jedes Plugin-Runtime frühzeitig zu laden.

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
interne Imports - importieren Sie Ihr eigenes Plugin niemals über dessen SDK-Pfad.

Für Provider-Plugins sollten Sie Provider-spezifische Hilfsfunktionen in diesen Package-Root-Barrels belassen,
es sei denn, die Schnittstelle ist wirklich generisch. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und `service_tier`-/Beta-Hilfsfunktionen
- OpenAI: Provider-Builder, Standardmodell-Hilfsfunktionen, Realtime-Provider
- OpenRouter: Provider-Builder sowie Onboarding-/Konfigurationshilfen

Wenn eine Hilfsfunktion nur innerhalb eines gebündelten Provider-Pakets nützlich ist, behalten Sie sie an dieser
Package-Root-Schnittstelle, anstatt sie in `openclaw/plugin-sdk/*` zu verschieben.

Einige generierte `openclaw/plugin-sdk/<bundled-id>`-Hilfsschnittstellen existieren weiterhin für
die Wartung gebündelter Plugins, wenn sie nachverfolgte Owner-Nutzung haben. Behandeln Sie diese als
reservierte Oberflächen, nicht als Standardmuster für neue Drittanbieter-Plugins.

## Checkliste vor der Einreichung

<Check>**package.json** enthält korrekte `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Imports verwenden fokussierte `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Imports verwenden lokale Module, keine SDK-Selbstimports</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (In-Repo-Plugins)</Check>

## Beta-Release-Tests

1. Achten Sie auf GitHub-Release-Tags bei [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie diese über `Watch` > `Releases`. Beta-Tags sehen aus wie `v2026.3.N-beta.1`. Sie können außerdem Benachrichtigungen für den offiziellen OpenClaw-X-Account [@openclaw](https://x.com/openclaw) aktivieren, um Release-Ankündigungen zu erhalten.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Zeitfenster vor Stable beträgt typischerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Channel `plugin-forum` entweder `all good` oder was defekt ist. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas defekt ist, öffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und wenden Sie das Label `beta-blocker` an. Fügen Sie den Issue-Link in Ihren Thread ein.
5. Öffnen Sie einen PR nach `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Mitwirkende können PRs nicht labeln, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit einem PR werden gemergt; Blocker ohne PR können trotzdem ausgeliefert werden. Maintainer beobachten diese Threads während der Beta-Tests.
6. Stille bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Channel-Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Erstellen Sie ein Messaging-Channel-Plugin
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Erstellen Sie ein Modell-Provider-Plugin
  </Card>
  <Card title="CLI-Backend-Plugins" icon="terminal" href="/de/plugins/cli-backend-plugins">
    Registrieren Sie ein lokales KI-CLI-Backend
  </Card>
  <Card title="SDK-Übersicht" icon="book-open" href="/de/plugins/sdk-overview">
    Import-Map- und Registrierungs-API-Referenz
  </Card>
  <Card title="Runtime-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Testen" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testhilfsprogramme und Muster
  </Card>
  <Card title="Plugin-Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Manifest-Schemareferenz
  </Card>
</CardGroup>

## Verwandt

- [Plugin-Architektur](/de/plugins/architecture) - ausführlicher Einblick in die interne Architektur
- [SDK-Übersicht](/de/plugins/sdk-overview) - Plugin-SDK-Referenz
- [Manifest](/de/plugins/manifest) - Plugin-Manifestformat
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Plugins erstellen
