---
read_when:
    - Sie möchten ein neues OpenClaw Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie fügen OpenClaw einen neuen Kanal, Provider, ein neues Tool oder eine andere Fähigkeit hinzu
sidebarTitle: Getting Started
summary: Erstellen Sie in wenigen Minuten Ihr erstes OpenClaw Plugin
title: Plugins erstellen
x-i18n:
    generated_at: "2026-04-23T06:30:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Plugins erstellen

Plugins erweitern OpenClaw um neue Fähigkeiten: Kanäle, Modell-Provider,
Sprache, Echtzeit-Transkription, Echtzeitstimme, Medienverständnis, Bild-
generierung, Videogenerierung, Web-Fetch, Web-Suche, Agent-Tools oder eine
beliebige Kombination davon.

Sie müssen Ihr Plugin nicht zum OpenClaw-Repository hinzufügen. Veröffentlichen Sie es auf
[ClawHub](/de/tools/clawhub) oder npm, und Benutzer installieren es mit
`openclaw plugins install <package-name>`. OpenClaw versucht zuerst ClawHub und
fällt automatisch auf npm zurück.

## Voraussetzungen

- Node >= 22 und ein Paketmanager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für Plugins im Repository: Repository geklont und `pnpm install` ausgeführt

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Kanal-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    OpenClaw mit einer Messaging-Plattform verbinden (Discord, IRC usw.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Einen Modell-Provider hinzufügen (LLM, Proxy oder benutzerdefinierter Endpunkt)
  </Card>
  <Card title="Tool- / Hook-Plugin" icon="wrench">
    Agent-Tools, Event-Hooks oder Services registrieren — unten fortfahren
  </Card>
</CardGroup>

Wenn ein Kanal-Plugin optional ist und beim Ausführen von Onboarding/Setup
möglicherweise nicht installiert ist, verwenden Sie `createOptionalChannelSetupSurface(...)` aus
`openclaw/plugin-sdk/channel-setup`. Es erzeugt ein Setup-Adapter- + Assistenten-Paar,
das die Installationsanforderung bekannt macht und echte Konfigurationsschreibvorgänge
gesperrt fehlschlagen lässt, bis das Plugin installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agent-Tool registriert. Für Kanal-
und Provider-Plugins gibt es oben verlinkte eigene Leitfäden.

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
    Veröffentlichungssnippets liegen in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Entry Point schreiben">

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
    `defineChannelPluginEntry` — siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins).
    Für die vollständigen Entry-Point-Optionen siehe [Entry Points](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testen und veröffentlichen">

    **Externe Plugins:** mit ClawHub validieren und veröffentlichen, dann installieren:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw prüft vor npm auch ClawHub für einfache Paketspezifikationen wie
    `@myorg/openclaw-my-plugin`.

    **Plugins im Repository:** unter dem Workspace-Baum für gebündelte Plugins ablegen — werden automatisch erkannt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Fähigkeiten

Ein einzelnes Plugin kann beliebig viele Fähigkeiten über das Objekt `api` registrieren:

| Fähigkeit              | Registrierungsmethode                           | Detaillierter Leitfaden                                                      |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Textinferenz (LLM)     | `api.registerProvider(...)`                     | [Provider-Plugins](/de/plugins/sdk-provider-plugins)                            |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                   | [CLI Backends](/de/gateway/cli-backends)                                        |
| Kanal / Messaging      | `api.registerChannel(...)`                      | [Kanal-Plugins](/de/plugins/sdk-channel-plugins)                                |
| Sprache (TTS/STT)      | `api.registerSpeechProvider(...)`               | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeitstimme         | `api.registerRealtimeVoiceProvider(...)`        | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`   | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`      | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`      | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`      | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web-Fetch              | `api.registerWebFetchProvider(...)`             | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web-Suche              | `api.registerWebSearchProvider(...)`            | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Eingebettete Pi-Erweiterung | `api.registerEmbeddedExtensionFactory(...)` | [SDK-Übersicht](/de/plugins/sdk-overview#registration-api)                      |
| Agent-Tools            | `api.registerTool(...)`                         | Unten                                                                        |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                  | [Entry Points](/de/plugins/sdk-entrypoints)                                     |
| Event-Hooks            | `api.registerHook(...)`                         | [Entry Points](/de/plugins/sdk-entrypoints)                                     |
| HTTP-Routen            | `api.registerHttpRoute(...)`                    | [Internals](/de/plugins/architecture#gateway-http-routes)                       |
| CLI-Unterbefehle       | `api.registerCli(...)`                          | [Entry Points](/de/plugins/sdk-entrypoints)                                     |

Für die vollständige Registrierungs-API siehe [SDK-Übersicht](/de/plugins/sdk-overview#registration-api).

Verwenden Sie `api.registerEmbeddedExtensionFactory(...)`, wenn ein Plugin Pi-native
Hooks für den eingebetteten Runner benötigt, etwa asynchrones Umschreiben von `tool_result`,
bevor die endgültige Tool-Ergebnismeldung ausgegeben wird. Bevorzugen Sie reguläre OpenClaw-
Plugin-Hooks, wenn die Arbeit kein Timing auf Pi-Erweiterungsebene benötigt.

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, halten Sie sie unter einem
pluginspezifischen Präfix. Core-Admin-Namensräume (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu
`operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Gültigkeitsbereich anfordert.

Zu beachtende Hook-Guard-Semantik:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agent-Ausführung und fordert den Benutzer zur Genehmigung über das `exec`-Genehmigungs-Overlay, Telegram-Schaltflächen, Discord-Interaktionen oder den Befehl `/approve` auf einem beliebigen Kanal auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.
- `message_received`: Bevorzugen Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Topic-Routing benötigen. Behalten Sie `metadata` für kanalspezifische Zusätze.
- `message_sending`: Bevorzugen Sie typisierte Routing-Felder `replyToId` / `threadId` gegenüber kanalspezifischen `metadata`-Schlüsseln.

Der Befehl `/approve` verarbeitet sowohl `exec`- als auch Plugin-Genehmigungen mit begrenztem Fallback: Wenn eine `exec`-Genehmigungs-ID nicht gefunden wird, versucht OpenClaw dieselbe ID erneut über Plugin-Genehmigungen. Die Weiterleitung von Plugin-Genehmigungen kann unabhängig über `approvals.plugin` in der Konfiguration konfiguriert werden.

Wenn benutzerdefinierte Genehmigungslogik genau diesen begrenzten Fallback-Fall erkennen muss,
verwenden Sie bevorzugt `isApprovalNotFoundError` aus `openclaw/plugin-sdk/error-runtime`,
statt Strings für abgelaufene Genehmigungen manuell abzugleichen.

Details finden Sie unter [SDK-Übersicht Hook-Entscheidungssemantik](/de/plugins/sdk-overview#hook-decision-semantics).

## Agent-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können erforderlich (immer
verfügbar) oder optional (Opt-in durch den Benutzer) sein:

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

## Importkonventionen

Importieren Sie immer aus fokussierten Pfaden `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Falsch: monolithische Root (veraltet, wird entfernt)
import { ... } from "openclaw/plugin-sdk";
```

Für die vollständige Referenz der Unterpfade siehe [SDK-Übersicht](/de/plugins/sdk-overview).

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien (`api.ts`, `runtime-api.ts`) für
interne Importe — importieren Sie Ihr eigenes Plugin niemals über seinen SDK-Pfad.

Bei Provider-Plugins sollten providerspezifische Helfer in diesen Barrels im Paket-Root
bleiben, sofern die Schnittstelle nicht wirklich generisch ist. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und `service_tier`- / Beta-Helfer
- OpenAI: Provider-Builder, Standardmodell-Helfer, Echtzeit-Provider
- OpenRouter: Provider-Builder plus Onboarding-/Konfigurationshelfer

Wenn ein Helfer nur innerhalb eines gebündelten Provider-Pakets nützlich ist, belassen Sie ihn auf dieser
Schnittstelle im Paket-Root, statt ihn nach `openclaw/plugin-sdk/*` hochzustufen.

Einige generierte Hilfsschnittstellen `openclaw/plugin-sdk/<bundled-id>` existieren weiterhin für
die Wartung und Kompatibilität gebündelter Plugins, zum Beispiel
`plugin-sdk/feishu-setup` oder `plugin-sdk/zalo-setup`. Behandeln Sie diese als reservierte
Oberflächen, nicht als Standardmuster für neue Drittanbieter-Plugins.

## Checkliste vor der Einreichung

<Check>**package.json** hat korrekte `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Der Entry Point verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden fokussierte Pfade `plugin-sdk/<subpath>`</Check>
<Check>Interne Importe verwenden lokale Module, keine SDK-Selbstimporte</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (Plugins im Repository)</Check>

## Testen von Beta-Releases

1. Achten Sie auf GitHub-Release-Tags auf [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie sie über `Watch` > `Releases`. Beta-Tags sehen aus wie `v2026.3.N-beta.1`. Sie können auch Benachrichtigungen für den offiziellen OpenClaw-X-Account [@openclaw](https://x.com/openclaw) für Release-Ankündigungen aktivieren.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Zeitfenster vor dem Stable-Release beträgt typischerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` entweder `all good` oder was kaputtgegangen ist. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas kaputtgeht, eröffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und weisen Sie das Label `beta-blocker` zu. Fügen Sie den Issue-Link in Ihren Thread ein.
5. Eröffnen Sie einen PR gegen `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Mitwirkende können PRs keine Labels zuweisen, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit einem PR werden zusammengeführt; Blocker ohne PR werden möglicherweise trotzdem ausgeliefert. Maintainer beobachten diese Threads während des Beta-Testens.
6. Schweigen bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Kanal-Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Ein Messaging-Kanal-Plugin erstellen
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Ein Modell-Provider-Plugin erstellen
  </Card>
  <Card title="SDK-Übersicht" icon="book-open" href="/de/plugins/sdk-overview">
    Referenz für Import-Map und Registrierungs-API
  </Card>
  <Card title="Laufzeithelfer" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testhilfen und Muster
  </Card>
  <Card title="Plugin-Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Referenz des Manifest-Schemas
  </Card>
</CardGroup>

## Verwandt

- [Plugin Architecture](/de/plugins/architecture) — tiefer Einblick in die interne Architektur
- [SDK Overview](/de/plugins/sdk-overview) — Plugin-SDK-Referenz
- [Manifest](/de/plugins/manifest) — Format des Plugin-Manifests
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Kanal-Plugins erstellen
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
