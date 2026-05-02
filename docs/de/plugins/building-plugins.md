---
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie fügen OpenClaw einen neuen Kanal, Provider, ein neues Tool oder eine andere Fähigkeit hinzu
sidebarTitle: Getting Started
summary: Erstellen Sie Ihr erstes OpenClaw-Plugin in wenigen Minuten
title: Plugins erstellen
x-i18n:
    generated_at: "2026-05-02T06:39:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Sprache, Echtzeit-Transkription, Echtzeit-Sprache, Medienverständnis,
Bildgenerierung, Videogenerierung, Webabruf, Websuche, Agent-Tools oder jede
Kombination daraus.

Sie müssen Ihr Plugin nicht zum OpenClaw-Repository hinzufügen. Veröffentlichen
Sie es auf [ClawHub](/de/tools/clawhub), und Nutzer installieren es mit
`openclaw plugins install <package-name>`. OpenClaw versucht zuerst ClawHub und
fällt automatisch auf npm zurück, wenn Pakete weiterhin npm-Distribution
verwenden.

## Voraussetzungen

- Node >= 22 und ein Paketmanager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für Plugins im Repository: Repository geklont und `pnpm install` ausgeführt.
  Plugin-Entwicklung aus dem Source-Checkout ist nur mit pnpm möglich, weil
  OpenClaw gebündelte Plugins aus den `extensions/*`-Workspace-Paketen lädt.

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Channel-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Verbinden Sie OpenClaw mit einer Messaging-Plattform (Discord, IRC usw.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Fügen Sie einen Modell-Provider hinzu (LLM, Proxy oder benutzerdefinierter Endpunkt)
  </Card>
  <Card title="Tool-/Hook-Plugin" icon="wrench" href="/de/plugins/hooks">
    Registrieren Sie Agent-Tools, Ereignis-Hooks oder Dienste — fahren Sie unten fort
  </Card>
</CardGroup>

Für ein Channel-Plugin, das bei Ausführung von Onboarding/Einrichtung nicht
garantiert installiert ist, verwenden Sie `createOptionalChannelSetupSurface(...)`
aus `openclaw/plugin-sdk/channel-setup`. Es erzeugt ein Setup-Adapter- und
Wizard-Paar, das die Installationsanforderung ausweist und bei echten
Konfigurationsschreibvorgängen geschlossen fehlschlägt, bis das Plugin
installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agent-Tool registriert.
Für Channel- und Provider-Plugins gibt es eigene Anleitungen, die oben verlinkt
sind.

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

    Jedes Plugin benötigt ein Manifest, auch ohne Konfiguration. Zur Laufzeit
    registrierte Tools müssen in `contracts.tools` aufgeführt sein, damit
    OpenClaw das besitzende Plugin erkennen kann, ohne jede Plugin-Laufzeit zu
    laden. Plugins sollten außerdem `activation.onStartup` bewusst deklarieren.
    Dieses Beispiel setzt es auf `true`. Das vollständige Schema finden Sie unter
    [Manifest](/de/plugins/manifest). Die kanonischen ClawHub-Publish-Snippets
    befinden sich in `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` ist für Nicht-Channel-Plugins vorgesehen. Für Channels
    verwenden Sie `defineChannelPluginEntry` — siehe
    [Channel-Plugins](/de/plugins/sdk-channel-plugins). Alle Optionen für
    Einstiegspunkte finden Sie unter [Einstiegspunkte](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testen und veröffentlichen">

    **Externe Plugins:** Validieren und veröffentlichen Sie mit ClawHub, dann installieren Sie:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw prüft außerdem ClawHub vor npm für einfache Paketangaben wie
    `@myorg/openclaw-my-plugin`; npm bleibt ein Fallback für Pakete, die noch
    nicht zu ClawHub migriert wurden.

    **Plugins im Repository:** Platzieren Sie sie unter dem gebündelten Plugin-Workspace-Baum — sie werden automatisch erkannt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Funktionen

Ein einzelnes Plugin kann über das `api`-Objekt beliebig viele Funktionen registrieren:

| Funktion               | Registrierungsmethode                           | Ausführliche Anleitung                                                          |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Textinferenz (LLM)     | `api.registerProvider(...)`                      | [Provider-Plugins](/de/plugins/sdk-provider-plugins)                               |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | [CLI-Backends](/de/gateway/cli-backends)                                           |
| Channel / Messaging    | `api.registerChannel(...)`                       | [Channel-Plugins](/de/plugins/sdk-channel-plugins)                                 |
| Sprache (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeit-Sprache       | `api.registerRealtimeVoiceProvider(...)`         | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Webabruf               | `api.registerWebFetchProvider(...)`              | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Websuche               | `api.registerWebSearchProvider(...)`             | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tool-Ergebnis-Middleware | `api.registerAgentToolResultMiddleware(...)`   | [SDK-Übersicht](/de/plugins/sdk-overview#registration-api)                         |
| Agent-Tools            | `api.registerTool(...)`                          | Unten                                                                           |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                  | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                     |
| Plugin-Hooks           | `api.on(...)`                                    | [Plugin-Hooks](/de/plugins/hooks)                                                  |
| Interne Ereignis-Hooks | `api.registerHook(...)`                          | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                     |
| HTTP-Routen            | `api.registerHttpRoute(...)`                     | [Interna](/de/plugins/architecture-internals#gateway-http-routes)                  |
| CLI-Unterbefehle       | `api.registerCli(...)`                           | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                     |

Die vollständige Registrierungs-API finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#registration-api).

Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden,
wenn sie asynchrones Umschreiben von Tool-Ergebnissen benötigen, bevor das Modell
die Ausgabe sieht. Deklarieren Sie die zielgerichteten Laufzeiten in
`contracts.agentToolResultMiddleware`, zum Beispiel `["pi", "codex"]`. Dies ist
ein vertrauenswürdiger Seam für gebündelte Plugins; externe Plugins sollten
reguläre OpenClaw-Plugin-Hooks bevorzugen, sofern OpenClaw keine explizite
Vertrauensrichtlinie für diese Funktion entwickelt.

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, belassen
Sie sie auf einem Plugin-spezifischen Präfix. Core-Admin-Namensräume
(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und
lösen immer zu `operator.admin` auf, selbst wenn ein Plugin einen engeren Scope
anfordert.

Hook-Guard-Semantik, die Sie beachten sollten:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agent-Ausführung und fordert den Nutzer über das Exec-Freigabe-Overlay, Telegram-Schaltflächen, Discord-Interaktionen oder den Befehl `/approve` auf einem beliebigen Kanal zur Freigabe auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.
- `message_received`: Bevorzugen Sie das typisierte Feld `threadId`, wenn Sie Routing für eingehende Threads/Themen benötigen. Verwenden Sie `metadata` für channel-spezifische Extras.
- `message_sending`: Bevorzugen Sie die typisierten Routing-Felder `replyToId` / `threadId` gegenüber channel-spezifischen Metadaten-Schlüsseln.

Der Befehl `/approve` verarbeitet sowohl Exec- als auch Plugin-Freigaben mit
begrenztem Fallback: Wenn eine Exec-Freigabe-ID nicht gefunden wird, versucht
OpenClaw dieselbe ID erneut über Plugin-Freigaben. Plugin-Freigabeweiterleitung
kann unabhängig über `approvals.plugin` in der Konfiguration konfiguriert
werden.

Wenn benutzerdefinierte Freigabeverkabelung denselben begrenzten Fallback-Fall
erkennen muss, bevorzugen Sie `isApprovalNotFoundError` aus
`openclaw/plugin-sdk/error-runtime`, anstatt Freigabeablauf-Strings manuell
abzugleichen.

Beispiele und die Hook-Referenz finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

## Agent-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können
erforderlich (immer verfügbar) oder optional (Opt-in durch Nutzer) sein:

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

Jedes Tool, das mit `api.registerTool(...)` registriert wird, muss auch im
Plugin-Manifest deklariert sein:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

Nutzer aktivieren optionale Tools in der Konfiguration:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tool-Namen dürfen nicht mit Kern-Tools kollidieren (Konflikte werden übersprungen)
- Tools mit fehlerhaften Registrierungsobjekten, einschließlich fehlender `parameters`, werden übersprungen und stattdessen in der Plugin-Diagnose gemeldet, anstatt Agent-Ausführungen zu unterbrechen
- Verwenden Sie `optional: true` für Tools mit Seiteneffekten oder zusätzlichen Binäranforderungen
- Benutzer können alle Tools eines Plugins aktivieren, indem sie die Plugin-ID zu `tools.allow` hinzufügen

## CLI-Befehle registrieren

Plugins können mit `api.registerCli` Root-`openclaw`-Befehlsgruppen hinzufügen. Geben Sie
`descriptors` für jeden Befehls-Root der obersten Ebene an, damit OpenClaw den Befehl anzeigen und weiterleiten kann,
ohne jede Plugin-Laufzeit vorab laden zu müssen.

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

Prüfen Sie nach der Installation die Laufzeitregistrierung und führen Sie den Befehl aus:

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

Die vollständige Referenz der Unterpfade finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview).

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien (`api.ts`, `runtime-api.ts`) für
interne Importe — importieren Sie Ihr eigenes Plugin niemals über dessen SDK-Pfad.

Für Provider-Plugins sollten providerspezifische Hilfsfunktionen in diesen Package-Root-
Barrels bleiben, sofern die Schnittstelle nicht wirklich generisch ist. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und `service_tier`- / Beta-Hilfsfunktionen
- OpenAI: Provider-Builder, Hilfsfunktionen für Standardmodelle, Echtzeit-Provider
- OpenRouter: Provider-Builder plus Onboarding-/Konfigurations-Hilfsfunktionen

Wenn eine Hilfsfunktion nur innerhalb eines gebündelten Provider-Packages nützlich ist, behalten Sie sie an dieser
Package-Root-Schnittstelle, anstatt sie nach `openclaw/plugin-sdk/*` zu verschieben.

Einige generierte `openclaw/plugin-sdk/<bundled-id>`-Hilfsschnittstellen existieren weiterhin für die
Wartung gebündelter Plugins, wenn sie nachverfolgte Owner-Nutzung haben. Behandeln Sie diese als
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

1. Achten Sie auf GitHub-Release-Tags auf [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie diese über `Watch` > `Releases`. Beta-Tags sehen aus wie `v2026.3.N-beta.1`. Sie können außerdem Benachrichtigungen für den offiziellen OpenClaw-X-Account [@openclaw](https://x.com/openclaw) aktivieren, um Release-Ankündigungen zu erhalten.
2. Testen Sie Ihr Plugin gegen den Beta-Tag, sobald er erscheint. Das Zeitfenster vor Stable beträgt typischerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` entweder `all good` oder was defekt ist. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas defekt ist, öffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und wenden Sie das Label `beta-blocker` an. Fügen Sie den Issue-Link in Ihren Thread ein.
5. Öffnen Sie einen PR gegen `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Beitragende können PRs nicht labeln, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit PR werden gemergt; Blocker ohne PR werden möglicherweise trotzdem ausgeliefert. Maintainer beobachten diese Threads während der Beta-Tests.
6. Stille bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Channel-Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Messaging-Channel-Plugin erstellen
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Modell-Provider-Plugin erstellen
  </Card>
  <Card title="SDK-Übersicht" icon="book-open" href="/de/plugins/sdk-overview">
    Importzuordnung und Referenz der Registrierungs-API
  </Card>
  <Card title="Laufzeit-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/de/plugins/sdk-testing">
    Test-Hilfsprogramme und Muster
  </Card>
  <Card title="Plugin-Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Referenz des Manifest-Schemas
  </Card>
</CardGroup>

## Verwandt

- [Plugin-Architektur](/de/plugins/architecture) — tiefer Einblick in die interne Architektur
- [SDK-Übersicht](/de/plugins/sdk-overview) — Plugin-SDK-Referenz
- [Manifest](/de/plugins/manifest) — Plugin-Manifestformat
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) — Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
