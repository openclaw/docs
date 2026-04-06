---
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie fügen OpenClaw einen neuen Kanal, Provider, ein Tool oder eine andere Funktion hinzu
sidebarTitle: Getting Started
summary: Erstellen Sie Ihr erstes OpenClaw-Plugin in wenigen Minuten
title: Plugins erstellen
x-i18n:
    generated_at: "2026-04-06T03:09:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9be344cb300ecbcba08e593a95bcc93ab16c14b28a0ff0c29b26b79d8249146c
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Plugins erstellen

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Sprachverarbeitung, Echtzeit-Transkription, Echtzeitstimme, Medienverständnis, Bild-
generierung, Videoerzeugung, Web-Abruf, Websuche, Agent-Tools oder eine beliebige
Kombination davon.

Sie müssen Ihr Plugin nicht zum OpenClaw-Repository hinzufügen. Veröffentlichen Sie es in
[ClawHub](/de/tools/clawhub) oder auf npm, und Benutzer installieren es mit
`openclaw plugins install <package-name>`. OpenClaw versucht zuerst ClawHub und
fällt dann automatisch auf npm zurück.

## Voraussetzungen

- Node >= 22 und ein Paketmanager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für In-Repo-Plugins: geklontes Repository und ausgeführtes `pnpm install`

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Kanal-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    OpenClaw mit einer Messaging-Plattform verbinden (Discord, IRC usw.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Einen Modell-Provider hinzufügen (LLM, Proxy oder benutzerdefinierter Endpoint)
  </Card>
  <Card title="Tool- / Hook-Plugin" icon="wrench">
    Agent-Tools, Event-Hooks oder Dienste registrieren — unten weiter
  </Card>
</CardGroup>

Wenn ein Kanal-Plugin optional ist und während Onboarding/Einrichtung
möglicherweise nicht installiert ist, verwenden Sie `createOptionalChannelSetupSurface(...)` aus
`openclaw/plugin-sdk/channel-setup`. Es erzeugt ein Einrichtungs-Adapter-/Assistenten-Paar,
das auf die Installationsanforderung hinweist und echte Konfigurationsschreibvorgänge
fehlschlagen lässt, bis das Plugin installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agent-Tool registriert. Kanal-
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
    `defineChannelPluginEntry` — siehe [Channel Plugins](/de/plugins/sdk-channel-plugins).
    Für die vollständigen Entry-Point-Optionen siehe [Entry Points](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testen und veröffentlichen">

    **Externe Plugins:** mit ClawHub validieren und veröffentlichen, dann installieren:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw prüft auch ClawHub vor npm für einfache Paketspezifikationen wie
    `@myorg/openclaw-my-plugin`.

    **In-Repo-Plugins:** unter dem gebündelten Plugin-Workspace-Baum platzieren — werden automatisch erkannt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Funktionen

Ein einzelnes Plugin kann über das `api`-Objekt eine beliebige Anzahl von Funktionen registrieren:

| Funktion               | Registrierungsmethode                            | Detaillierte Anleitung                                                           |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Text-Inferenz (LLM)    | `api.registerProvider(...)`                      | [Provider Plugins](/de/plugins/sdk-provider-plugins)                                |
| Kanal / Messaging      | `api.registerChannel(...)`                       | [Channel Plugins](/de/plugins/sdk-channel-plugins)                                  |
| Sprache (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Echtzeitstimme         | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Videoerzeugung         | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Websuche               | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Agent-Tools            | `api.registerTool(...)`                          | Unten                                                                            |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                   | [Entry Points](/de/plugins/sdk-entrypoints)                                         |
| Event-Hooks            | `api.registerHook(...)`                          | [Entry Points](/de/plugins/sdk-entrypoints)                                         |
| HTTP-Routen            | `api.registerHttpRoute(...)`                     | [Internals](/de/plugins/architecture#gateway-http-routes)                           |
| CLI-Unterbefehle       | `api.registerCli(...)`                           | [Entry Points](/de/plugins/sdk-entrypoints)                                         |

Für die vollständige Registrierungs-API siehe [SDK Overview](/de/plugins/sdk-overview#registration-api).

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, behalten Sie sie unter einem
plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu
`operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Geltungsbereich anfordert.

Zu beachtende Hook-Guard-Semantik:

- `before_tool_call`: `{ block: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agent-Ausführung und fordert den Benutzer zur Genehmigung über das Exec-Genehmigungs-Overlay, Telegram-Buttons, Discord-Interaktionen oder den Befehl `/approve` auf jedem Kanal auf.
- `before_install`: `{ block: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.

Der Befehl `/approve` verarbeitet sowohl Exec- als auch Plugin-Genehmigungen mit begrenztem Fallback: Wenn keine Exec-Genehmigungs-ID gefunden wird, versucht OpenClaw dieselbe ID erneut über Plugin-Genehmigungen. Das Weiterleiten von Plugin-Genehmigungen kann unabhängig über `approvals.plugin` in der Konfiguration konfiguriert werden.

Wenn benutzerdefinierte Genehmigungslogik denselben begrenzten Fallback-Fall erkennen muss,
verwenden Sie bevorzugt `isApprovalNotFoundError` aus `openclaw/plugin-sdk/error-runtime`,
anstatt Strings für abgelaufene Genehmigungen manuell abzugleichen.

Siehe [SDK Overview hook decision semantics](/de/plugins/sdk-overview#hook-decision-semantics) für Details.

## Agent-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können erforderlich (immer
verfügbar) oder optional (Opt-in des Benutzers) sein:

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
- Verwenden Sie `optional: true` für Tools mit Nebeneffekten oder zusätzlichen Binäranforderungen
- Benutzer können alle Tools eines Plugins aktivieren, indem sie die Plugin-ID zu `tools.allow` hinzufügen

## Import-Konventionen

Importieren Sie immer aus fokussierten `openclaw/plugin-sdk/<subpath>`-Pfaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Falsch: monolithische Wurzel (veraltet, wird entfernt)
import { ... } from "openclaw/plugin-sdk";
```

Für die vollständige Subpath-Referenz siehe [SDK Overview](/de/plugins/sdk-overview).

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien (`api.ts`, `runtime-api.ts`) für
interne Importe — importieren Sie niemals Ihr eigenes Plugin über seinen SDK-Pfad.

Für Provider-Plugins behalten Sie provider-spezifische Hilfsfunktionen in diesen Paket-
Root-Barrels, sofern die Schnittstelle nicht wirklich generisch ist. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und `service_tier`- / Beta-Hilfsfunktionen
- OpenAI: Provider-Builder, Standardmodell-Hilfsfunktionen, Echtzeit-Provider
- OpenRouter: Provider-Builder plus Onboarding-/Konfigurationshilfsfunktionen

Wenn eine Hilfsfunktion nur innerhalb eines gebündelten Provider-Pakets nützlich ist, behalten Sie sie auf dieser
Paket-Root-Schnittstelle, statt sie in `openclaw/plugin-sdk/*` hochzustufen.

Einige generierte Hilfsschnittstellen unter `openclaw/plugin-sdk/<bundled-id>` existieren weiterhin für
die Wartung und Kompatibilität gebündelter Plugins, zum Beispiel
`plugin-sdk/feishu-setup` oder `plugin-sdk/zalo-setup`. Behandeln Sie diese als reservierte
Oberflächen, nicht als Standardmuster für neue Drittanbieter-Plugins.

## Checkliste vor dem Einreichen

<Check>**package.json** hat die korrekten `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Entry Point verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden fokussierte `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Importe verwenden lokale Module, keine SDK-Selbstimporte</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (In-Repo-Plugins)</Check>

## Beta-Release-Tests

1. Beobachten Sie GitHub-Release-Tags auf [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie sie über `Watch` > `Releases`. Beta-Tags sehen aus wie `v2026.3.N-beta.1`. Sie können auch Benachrichtigungen für das offizielle OpenClaw-X-Konto [@openclaw](https://x.com/openclaw) für Release-Ankündigungen aktivieren.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Zeitfenster vor dem Stable-Release beträgt normalerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` entweder `all good` oder was kaputt ist. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas kaputt ist, eröffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und wenden Sie das Label `beta-blocker` an. Fügen Sie den Issue-Link in Ihren Thread ein.
5. Öffnen Sie einen PR an `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Mitwirkende können PRs nicht labeln, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit einem PR werden zusammengeführt; Blocker ohne PR werden möglicherweise trotzdem ausgeliefert. Maintainer beobachten diese Threads während der Beta-Tests.
6. Schweigen bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Ein Messaging-Kanal-Plugin erstellen
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Ein Modell-Provider-Plugin erstellen
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/de/plugins/sdk-overview">
    Import-Map und Referenz der Registrierungs-API
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testhilfsprogramme und Muster
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Referenz des Manifest-Schemas
  </Card>
</CardGroup>

## Verwandt

- [Plugin Architecture](/de/plugins/architecture) — tiefer Einblick in die interne Architektur
- [SDK Overview](/de/plugins/sdk-overview) — Referenz zum Plugin SDK
- [Manifest](/de/plugins/manifest) — Format des Plugin-Manifests
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Kanal-Plugins erstellen
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
