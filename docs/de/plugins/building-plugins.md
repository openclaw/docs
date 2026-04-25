---
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie fügen OpenClaw einen neuen Kanal, Provider, ein neues Tool oder eine andere Fähigkeit hinzu
sidebarTitle: Getting Started
summary: Erstellen Sie in wenigen Minuten Ihr erstes OpenClaw-Plugin
title: Plugins erstellen
x-i18n:
    generated_at: "2026-04-25T13:51:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugins erweitern OpenClaw um neue Fähigkeiten: Kanäle, Modell-Provider,
Speech, Realtime-Transkription, Realtime-Voice, Medienverständnis, Bildgenerierung,
Videogenerierung, Web-Fetch, Websuche, Agenten-Tools oder beliebige
Kombinationen daraus.

Sie müssen Ihr Plugin nicht dem OpenClaw-Repository hinzufügen. Veröffentlichen Sie es auf
[ClawHub](/de/tools/clawhub) oder npm; Benutzer installieren es dann mit
`openclaw plugins install <package-name>`. OpenClaw versucht zuerst ClawHub und
fällt automatisch auf npm zurück.

## Voraussetzungen

- Node >= 22 und ein Paketmanager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für In-Repo-Plugins: Repository geklont und `pnpm install` ausgeführt

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Kanal-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    OpenClaw mit einer Messaging-Plattform verbinden (Discord, IRC usw.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Einen Modell-Provider hinzufügen (LLM, Proxy oder benutzerdefinierter Endpunkt)
  </Card>
  <Card title="Tool- / Hook-Plugin" icon="wrench" href="/de/plugins/hooks">
    Agenten-Tools, Event-Hooks oder Services registrieren — unten fortfahren
  </Card>
</CardGroup>

Für ein Kanal-Plugin, bei dem nicht garantiert ist, dass es installiert ist, wenn Onboarding/Setup
ausgeführt wird, verwenden Sie `createOptionalChannelSetupSurface(...)` aus
`openclaw/plugin-sdk/channel-setup`. Es erzeugt ein Setup-Adapter-/Assistenten-Paar,
das die Installationsanforderung anzeigt und bei echten Konfigurationsschreibvorgängen fail-closed arbeitet,
bis das Plugin installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agenten-Tool registriert. Kanal-
und Provider-Plugins haben eigene Anleitungen, die oben verlinkt sind.

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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Jedes Plugin benötigt ein Manifest, auch ohne Konfiguration. Siehe
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

    `definePluginEntry` ist für Nicht-Kanal-Plugins. Für Kanäle verwenden Sie
    `defineChannelPluginEntry` — siehe [Channel Plugins](/de/plugins/sdk-channel-plugins).
    Für die vollständigen Optionen des Einstiegspunkts siehe [Entry Points](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testen und veröffentlichen">

    **Externe Plugins:** mit ClawHub validieren und veröffentlichen, dann installieren:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw prüft bei reinen Paketspezifikationen wie
    `@myorg/openclaw-my-plugin` ebenfalls zuerst ClawHub vor npm.

    **In-Repo-Plugins:** unter dem Workspace-Baum für gebündelte Plugins ablegen — werden automatisch entdeckt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Fähigkeiten

Ein einzelnes Plugin kann über das `api`-Objekt beliebig viele Fähigkeiten registrieren:

| Fähigkeit               | Registrierungsmethode                           | Detaillierte Anleitung                                                        |
| ----------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Text-Inferenz (LLM)     | `api.registerProvider(...)`                     | [Provider Plugins](/de/plugins/sdk-provider-plugins)                             |
| CLI-Inferenz-Backend    | `api.registerCliBackend(...)`                   | [CLI Backends](/de/gateway/cli-backends)                                         |
| Kanal / Messaging       | `api.registerChannel(...)`                      | [Channel Plugins](/de/plugins/sdk-channel-plugins)                               |
| Speech (TTS/STT)        | `api.registerSpeechProvider(...)`               | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime-Transkription  | `api.registerRealtimeTranscriptionProvider(...)`| [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime-Voice          | `api.registerRealtimeVoiceProvider(...)`        | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medienverständnis       | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Bildgenerierung         | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Musikgenerierung        | `api.registerMusicGenerationProvider(...)`      | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogenerierung        | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web-Fetch               | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Websuche                | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tool-Result-Middleware  | `api.registerAgentToolResultMiddleware(...)`    | [SDK Overview](/de/plugins/sdk-overview#registration-api)                        |
| Agenten-Tools           | `api.registerTool(...)`                         | Unten                                                                         |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                   | [Entry Points](/de/plugins/sdk-entrypoints)                                      |
| Plugin-Hooks            | `api.on(...)`                                   | [Plugin hooks](/de/plugins/hooks)                                                |
| Interne Event-Hooks     | `api.registerHook(...)`                         | [Entry Points](/de/plugins/sdk-entrypoints)                                      |
| HTTP-Routen             | `api.registerHttpRoute(...)`                    | [Internals](/de/plugins/architecture-internals#gateway-http-routes)              |
| CLI-Unterbefehle        | `api.registerCli(...)`                          | [Entry Points](/de/plugins/sdk-entrypoints)                                      |

Für die vollständige Registrierungs-API siehe [SDK Overview](/de/plugins/sdk-overview#registration-api).

Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn sie
asynchrone Umschreibung von Tool-Ergebnissen benötigen, bevor das Modell die Ausgabe sieht. Deklarieren Sie die
betroffenen Laufzeiten in `contracts.agentToolResultMiddleware`, zum Beispiel
`["pi", "codex"]`. Dies ist eine vertrauenswürdige Seam für gebündelte Plugins; externe
Plugins sollten reguläre OpenClaw-Plugin-Hooks bevorzugen, es sei denn, OpenClaw erhält
eine explizite Vertrauensrichtlinie für diese Fähigkeit.

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, halten Sie sie unter einem
pluginspezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und lösen immer zu
`operator.admin` auf, auch wenn ein Plugin einen engeren Scope anfordert.

Semantik der Hook-Guards, die Sie beachten sollten:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agentenausführung und fordert den Benutzer zur Genehmigung über das Exec-Freigabe-Overlay, Telegram-Schaltflächen, Discord-Interaktionen oder den Befehl `/approve` auf jedem Kanal auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.
- `message_received`: Bevorzugen Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Topic-Routing benötigen. Verwenden Sie `metadata` für kanalspezifische Extras.
- `message_sending`: Bevorzugen Sie die typisierten Routing-Felder `replyToId` / `threadId` gegenüber kanalspezifischen Metadaten-Schlüsseln.

Der Befehl `/approve` verarbeitet sowohl Exec- als auch Plugin-Freigaben mit begrenztem Fallback: Wenn eine Exec-Freigabe-ID nicht gefunden wird, versucht OpenClaw dieselbe ID erneut über Plugin-Freigaben. Die Weiterleitung von Plugin-Freigaben kann unabhängig über `approvals.plugin` in der Konfiguration konfiguriert werden.

Wenn benutzerdefinierte Freigabelogik genau diesen Fall des begrenzten Fallbacks erkennen muss,
bevorzugen Sie `isApprovalNotFoundError` aus `openclaw/plugin-sdk/error-runtime`,
statt manuell auf Strings zum Ablauf von Freigaben zu prüfen.

Siehe [Plugin hooks](/de/plugins/hooks) für Beispiele und die Hook-Referenz.

## Agenten-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können erforderlich (immer
verfügbar) oder optional (Opt-in durch Benutzer) sein:

```typescript
register(api) {
  // Erforderliches Tool — immer verfügbar
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optionales Tool — Benutzer muss es zur Allowlist hinzufügen
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
- Verwenden Sie `optional: true` für Tools mit Seiteneffekten oder zusätzlichen Binäranforderungen
- Benutzer können alle Tools eines Plugins aktivieren, indem sie die Plugin-ID zu `tools.allow` hinzufügen

## Import-Konventionen

Importieren Sie immer aus fokussierten Pfaden `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Falsch: monolithischer Root (veraltet, wird entfernt)
import { ... } from "openclaw/plugin-sdk";
```

Für die vollständige Referenz der Subpaths siehe [SDK Overview](/de/plugins/sdk-overview).

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien (`api.ts`, `runtime-api.ts`) für
interne Importe — importieren Sie Ihr eigenes Plugin niemals über dessen SDK-Pfad.

Bei Provider-Plugins sollten providerspezifische Helfer in diesen
Barrels auf Paketwurzelebene bleiben, sofern die Seam nicht wirklich generisch ist. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und Hilfsfunktionen für `service_tier` / Beta
- OpenAI: Provider-Builder, Hilfsfunktionen für Standardmodelle, Realtime-Provider
- OpenRouter: Provider-Builder plus Hilfsfunktionen für Onboarding/Konfiguration

Wenn eine Hilfsfunktion nur innerhalb eines gebündelten Provider-Pakets nützlich ist, belassen Sie sie auf dieser Seam auf Paketwurzelebene, statt sie in `openclaw/plugin-sdk/*` hochzustufen.

Einige generierte Hilfs-Seams `openclaw/plugin-sdk/<bundled-id>` existieren noch für
die Wartung gebündelter Plugins und für Kompatibilität, zum Beispiel
`plugin-sdk/feishu-setup` oder `plugin-sdk/zalo-setup`. Behandeln Sie diese als reservierte
Oberflächen, nicht als Standardmuster für neue Drittanbieter-Plugins.

## Checkliste vor der Einreichung

<Check>**package.json** hat korrekte `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Der Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden fokussierte Pfade `plugin-sdk/<subpath>`</Check>
<Check>Interne Importe verwenden lokale Module, keine SDK-Selbstimporte</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ist erfolgreich (In-Repo-Plugins)</Check>

## Testen von Beta-Releases

1. Achten Sie auf GitHub-Release-Tags bei [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie sie über `Watch` > `Releases`. Beta-Tags sehen aus wie `v2026.3.N-beta.1`. Sie können auch Benachrichtigungen für das offizielle OpenClaw-X-Konto [@openclaw](https://x.com/openclaw) für Release-Ankündigungen aktivieren.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Zeitfenster vor Stable beträgt typischerweise nur wenige Stunden.
3. Schreiben Sie nach dem Testen im `plugin-forum`-Discord-Kanal in den Thread Ihres Plugins entweder `all good` oder was kaputtgegangen ist. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas kaputtgeht, öffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und versehen Sie es mit dem Label `beta-blocker`. Platzieren Sie den Issue-Link in Ihrem Thread.
5. Öffnen Sie einen PR gegen `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Mitwirkende können PRs nicht labeln, daher ist der Titel das Signal auf PR-Seite für Maintainer und Automatisierung. Blocker mit einem PR werden gemergt; Blocker ohne PR werden möglicherweise trotzdem ausgeliefert. Maintainer beobachten diese Threads während der Beta-Tests.
6. Schweigen bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Kanal-Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Ein Messaging-Kanal-Plugin erstellen
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Ein Modell-Provider-Plugin erstellen
  </Card>
  <Card title="SDK-Überblick" icon="book-open" href="/de/plugins/sdk-overview">
    Referenz zur Import-Map und Registrierungs-API
  </Card>
  <Card title="Laufzeit-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Unteragent über api.runtime
  </Card>
  <Card title="Testen" icon="test-tubes" href="/de/plugins/sdk-testing">
    Test-Utilities und Muster
  </Card>
  <Card title="Plugin-Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Referenz für das Manifest-Schema
  </Card>
</CardGroup>

## Verwandt

- [Plugin Architecture](/de/plugins/architecture) — Deep Dive in die interne Architektur
- [SDK Overview](/de/plugins/sdk-overview) — Referenz für das Plugin SDK
- [Manifest](/de/plugins/manifest) — Format des Plugin-Manifests
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Kanal-Plugins erstellen
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
