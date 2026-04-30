---
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie fügen OpenClaw einen neuen Kanal, Provider, ein Tool oder eine andere Fähigkeit hinzu
sidebarTitle: Getting Started
summary: Erstellen Sie Ihr erstes OpenClaw-Plugin in wenigen Minuten
title: Plugins erstellen
x-i18n:
    generated_at: "2026-04-30T07:03:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Fähigkeiten: Channels, Modell-Provider,
Sprache, Echtzeit-Transkription, Echtzeit-Sprache, Medienverständnis, Bildgenerierung,
Videogenerierung, Web-Abruf, Websuche, Agent-Tools oder jede
Kombination davon.

Sie müssen Ihr Plugin nicht zum OpenClaw-Repository hinzufügen. Veröffentlichen Sie es auf
[ClawHub](/de/tools/clawhub), und Benutzer installieren es mit
`openclaw plugins install <package-name>`. OpenClaw versucht zuerst ClawHub und
fällt für Pakete, die weiterhin npm-Distribution verwenden, automatisch auf npm zurück.

## Voraussetzungen

- Node >= 22 und ein Paketmanager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für Plugins im Repository: Repository geklont und `pnpm install` ausgeführt

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Channel-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    OpenClaw mit einer Messaging-Plattform verbinden (Discord, IRC usw.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Einen Modell-Provider hinzufügen (LLM, Proxy oder benutzerdefinierter Endpunkt)
  </Card>
  <Card title="Tool-/Hook-Plugin" icon="wrench" href="/de/plugins/hooks">
    Agent-Tools, Ereignis-Hooks oder Dienste registrieren — weiter unten fortfahren
  </Card>
</CardGroup>

Für ein Channel-Plugin, das nicht garantiert installiert ist, wenn Onboarding/Setup
ausgeführt wird, verwenden Sie `createOptionalChannelSetupSurface(...)` aus
`openclaw/plugin-sdk/channel-setup`. Es erzeugt ein Setup-Adapter- und Wizard-Paar,
das die Installationsanforderung ausweist und echte Konfigurationsschreibvorgänge
geschlossen fehlschlagen lässt, bis das Plugin installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agent-Tool registriert. Für Channel-
und Provider-Plugins gibt es eigene, oben verlinkte Anleitungen.

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

    Jedes Plugin benötigt ein Manifest, auch ohne Konfiguration, und jedes Plugin sollte
    `activation.onStartup` bewusst deklarieren. Zur Laufzeit registrierte Tools benötigen
    einen Startup-Import, daher setzt dieses Beispiel ihn auf `true`. Siehe
    [Manifest](/de/plugins/manifest) für das vollständige Schema. Die kanonischen ClawHub-
    Veröffentlichungs-Snippets befinden sich in `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` ist für Nicht-Channel-Plugins. Verwenden Sie für Channels
    `defineChannelPluginEntry` — siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).
    Die vollständigen Optionen für Einstiegspunkte finden Sie unter [Einstiegspunkte](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testen und veröffentlichen">

    **Externe Plugins:** mit ClawHub validieren und veröffentlichen, dann installieren:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw prüft bei bloßen Paketspezifikationen wie
    `@myorg/openclaw-my-plugin` ebenfalls ClawHub vor npm; npm bleibt ein Fallback für Pakete, die
    noch nicht zu ClawHub migriert wurden.

    **Plugins im Repository:** unter dem Workspace-Baum für gebündelte Plugins ablegen — sie werden automatisch erkannt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Fähigkeiten

Ein einzelnes Plugin kann über das `api`-Objekt beliebig viele Fähigkeiten registrieren:

| Fähigkeit              | Registrierungsmethode                           | Ausführliche Anleitung                                                         |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Text-Inferenz (LLM)    | `api.registerProvider(...)`                      | [Provider-Plugins](/de/plugins/sdk-provider-plugins)                               |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | [CLI-Backends](/de/gateway/cli-backends)                                           |
| Channel / Messaging    | `api.registerChannel(...)`                       | [Channel-Plugins](/de/plugins/sdk-channel-plugins)                                 |
| Sprache (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeit-Sprache       | `api.registerRealtimeVoiceProvider(...)`         | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Websuche               | `api.registerWebSearchProvider(...)`             | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tool-Result-Middleware | `api.registerAgentToolResultMiddleware(...)`     | [SDK-Übersicht](/de/plugins/sdk-overview#registration-api)                         |
| Agent-Tools            | `api.registerTool(...)`                          | Unten                                                                           |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                   | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                     |
| Plugin-Hooks           | `api.on(...)`                                    | [Plugin-Hooks](/de/plugins/hooks)                                                  |
| Interne Ereignis-Hooks | `api.registerHook(...)`                          | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                     |
| HTTP-Routen            | `api.registerHttpRoute(...)`                     | [Interna](/de/plugins/architecture-internals#gateway-http-routes)                  |
| CLI-Unterbefehle       | `api.registerCli(...)`                           | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                     |

Die vollständige Registrierungs-API finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#registration-api).

Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn sie
asynchrones Umschreiben von Tool-Ergebnissen benötigen, bevor das Modell die Ausgabe sieht. Deklarieren Sie die
Ziel-Runtimes in `contracts.agentToolResultMiddleware`, zum Beispiel
`["pi", "codex"]`. Dies ist eine vertrauenswürdige Schnittstelle für gebündelte Plugins; externe
Plugins sollten reguläre OpenClaw-Plugin-Hooks bevorzugen, sofern OpenClaw keine
explizite Vertrauensrichtlinie für diese Fähigkeit erhält.

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, belassen Sie sie unter einem
Plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu
`operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope anfordert.

Hook-Guard-Semantik, die Sie beachten sollten:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agent-Ausführung und fragt den Benutzer über das Exec-Approval-Overlay, Telegram-Schaltflächen, Discord-Interaktionen oder den `/approve`-Befehl auf jedem Channel nach Zustimmung.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.
- `message_received`: bevorzugen Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Topic-Routing benötigen. Behalten Sie `metadata` für Channel-spezifische Extras bei.
- `message_sending`: bevorzugen Sie typisierte Routing-Felder `replyToId` / `threadId` gegenüber Channel-spezifischen Metadaten-Schlüsseln.

Der Befehl `/approve` verarbeitet sowohl Exec- als auch Plugin-Freigaben mit begrenztem Fallback: Wenn eine Exec-Approval-ID nicht gefunden wird, versucht OpenClaw dieselbe ID erneut über Plugin-Freigaben. Die Weiterleitung von Plugin-Freigaben kann unabhängig über `approvals.plugin` in der Konfiguration eingerichtet werden.

Wenn benutzerdefinierte Approval-Logik denselben begrenzten Fallback-Fall erkennen muss,
bevorzugen Sie `isApprovalNotFoundError` aus `openclaw/plugin-sdk/error-runtime`,
anstatt Approval-Ablaufstrings manuell abzugleichen.

Beispiele und die Hook-Referenz finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

## Agent-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können erforderlich (immer
verfügbar) oder optional (Opt-in durch den Benutzer) sein:

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

Benutzer aktivieren optionale Tools in der Konfiguration:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tool-Namen dürfen nicht mit Core-Tools kollidieren (Konflikte werden übersprungen)
- Tools mit fehlerhaft geformten Registrierungsobjekten, einschließlich fehlender `parameters`, werden übersprungen und in Plugin-Diagnosen gemeldet, statt Agent-Läufe zu unterbrechen
- Verwenden Sie `optional: true` für Tools mit Nebeneffekten oder zusätzlichen Binäranforderungen
- Benutzer können alle Tools aus einem Plugin aktivieren, indem sie die Plugin-ID zu `tools.allow` hinzufügen

## Importkonventionen

Importieren Sie immer aus fokussierten Pfaden `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Die vollständige Subpath-Referenz finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview).

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien (`api.ts`, `runtime-api.ts`) für
interne Importe — importieren Sie Ihr eigenes Plugin niemals über seinen SDK-Pfad.

Für Provider-Plugins sollten Provider-spezifische Hilfsfunktionen in diesen Barrels im Package-Root
bleiben, sofern die Schnittstelle nicht wirklich generisch ist. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und `service_tier`-/Beta-Hilfsfunktionen
- OpenAI: Provider-Builder, Hilfsfunktionen für Standardmodelle, Realtime-Provider
- OpenRouter: Provider-Builder sowie Hilfsfunktionen für Onboarding/Konfiguration

Wenn eine Hilfsfunktion nur innerhalb eines gebündelten Provider-Packages nützlich ist, belassen Sie sie an dieser
Schnittstelle im Package-Root, statt sie nach `openclaw/plugin-sdk/*` zu verschieben.

Einige generierte Hilfsschnittstellen unter `openclaw/plugin-sdk/<bundled-id>` existieren weiterhin für die
Wartung gebündelter Plugins, wenn sie nachverfolgte Nutzung durch Owner haben. Behandeln Sie diese als
reservierte Oberflächen, nicht als Standardmuster für neue Drittanbieter-Plugins.

## Checkliste vor der Einreichung

<Check>**package.json** enthält korrekte `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden fokussierte `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Importe verwenden lokale Module, keine SDK-Selbstimporte</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (Plugins im Repository)</Check>

## Testen von Beta-Releases

1. Achten Sie auf GitHub-Release-Tags unter [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie diese über `Watch` > `Releases`. Beta-Tags sehen aus wie `v2026.3.N-beta.1`. Sie können außerdem Benachrichtigungen für das offizielle OpenClaw-X-Konto [@openclaw](https://x.com/openclaw) aktivieren, um Release-Ankündigungen zu erhalten.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Zeitfenster vor Stable beträgt normalerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` entweder `all good` oder was nicht funktioniert hat. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas nicht funktioniert, öffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und wenden Sie das Label `beta-blocker` an. Fügen Sie den Issue-Link in Ihren Thread ein.
5. Öffnen Sie einen PR zu `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Beitragende können PRs nicht labeln, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit PR werden gemergt; Blocker ohne PR können trotzdem ausgeliefert werden. Maintainer beobachten diese Threads während der Beta-Tests.
6. Schweigen bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Channel-Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Erstellen Sie ein Messaging-Channel-Plugin
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Erstellen Sie ein Modell-Provider-Plugin
  </Card>
  <Card title="SDK-Übersicht" icon="book-open" href="/de/plugins/sdk-overview">
    Import-Map und API-Referenz zur Registrierung
  </Card>
  <Card title="Runtime-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Testen" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testwerkzeuge und Muster
  </Card>
  <Card title="Plugin-Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Referenz zum Manifest-Schema
  </Card>
</CardGroup>

## Verwandte Themen

- [Plugin-Architektur](/de/plugins/architecture) — tiefgehender Einblick in die interne Architektur
- [SDK-Übersicht](/de/plugins/sdk-overview) — Referenz zum Plugin-SDK
- [Manifest](/de/plugins/manifest) — Format des Plugin-Manifests
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) — Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
