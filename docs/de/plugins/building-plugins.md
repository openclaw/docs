---
doc-schema-version: 1
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie wählen zwischen Dokumentation für Kanal, Provider, CLI-Backend, Tool oder Hook
sidebarTitle: Getting Started
summary: Erstellen Sie Ihr erstes OpenClaw-Plugin in wenigen Minuten
title: Plugins erstellen
x-i18n:
    generated_at: "2026-06-27T17:44:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins erweitern OpenClaw, ohne den Core zu ändern. Ein Plugin kann einen Messaging-
Kanal, Modell-Provider, ein lokales CLI-Backend, ein Agent-Tool, einen Hook, Medien-Provider
oder eine andere Plugin-eigene Fähigkeit hinzufügen.

Sie müssen kein externes Plugin zum OpenClaw-Repository hinzufügen. Veröffentlichen Sie
das Paket in [ClawHub](/de/clawhub), und Benutzer installieren es mit:

```bash
openclaw plugins install clawhub:<package-name>
```

Reine Paketspezifikationen installieren während der Launch-Umstellung weiterhin aus npm. Verwenden Sie das
Präfix `clawhub:`, wenn Sie ClawHub-Auflösung möchten.

## Anforderungen

- Verwenden Sie Node 22.19 oder neuer und einen Paketmanager wie `npm` oder `pnpm`.
- Sie sollten mit TypeScript-ESM-Modulen vertraut sein.
- Für im Repository gebündelte Plugin-Arbeit klonen Sie das Repository und führen Sie `pnpm install` aus.
  Plugin-Entwicklung aus einem Source-Checkout ist ausschließlich pnpm-basiert, weil OpenClaw gebündelte
  Plugins aus `extensions/*`-Workspace-Paketen lädt.

## Plugin-Form auswählen

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Verbinden Sie OpenClaw mit einer Messaging-Plattform.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Fügen Sie ein Modell, Medien, Suche, Abruf, Sprache oder einen Realtime-Provider hinzu.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/de/plugins/cli-backend-plugins">
    Führen Sie eine lokale KI-CLI über OpenClaw-Modell-Fallback aus.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/de/plugins/tool-plugins">
    Registrieren Sie Agent-Tools.
  </Card>
</CardGroup>

## Schnellstart

Erstellen Sie ein minimales Tool-Plugin, indem Sie ein erforderliches Agent-Tool registrieren. Dies ist die
kürzeste nützliche Plugin-Form und zeigt Paket, Manifest, Einstiegspunkt und
lokalen Nachweis.

<Steps>
  <Step title="Paketmetadaten erstellen">
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

    Veröffentlichte externe Plugins sollten Runtime-Einstiege auf gebaute JavaScript-
    Dateien verweisen lassen. Siehe [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) für den vollständigen
    Einstiegspunktvertrag.

    Jedes Plugin benötigt ein Manifest, auch wenn es keine Konfiguration hat. Runtime-Tools
    müssen in `contracts.tools` erscheinen, damit OpenClaw die Zuständigkeit erkennen kann, ohne
    jede Plugin-Runtime sofort zu laden. Setzen Sie `activation.onStartup`
    bewusst. Dieses Beispiel startet beim Gateway-Start.

    Host-vertrauenswürdige Plugin-Oberflächen sind ebenfalls manifestgesteuert und erfordern explizite
    Aktivierung für installierte Plugins. Wenn ein installiertes Plugin
    `api.registerAgentToolResultMiddleware(...)` registriert, deklarieren Sie jede Ziel-Runtime in
    `contracts.agentToolResultMiddleware`. Wenn es
    `api.registerTrustedToolPolicy(...)` registriert, deklarieren Sie jede Policy-ID in
    `contracts.trustedToolPolicies`. Diese Deklarationen halten Installationszeit-
    Prüfung und Runtime-Registrierung konsistent.

    Für jedes Manifestfeld siehe [Plugin-Manifest](/de/plugins/manifest).

  </Step>

  <Step title="Tool registrieren">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Verwenden Sie `definePluginEntry` für Nicht-Channel-Plugins. Channel-Plugins verwenden
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Runtime testen">
    Für ein installiertes oder externes Plugin prüfen Sie die geladene Runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Wenn das Plugin einen CLI-Befehl registriert, führen Sie auch diesen Befehl aus. Zum Beispiel
    sollte ein Demo-Befehl einen Ausführungsnachweis wie
    `openclaw demo-plugin ping` haben.

    Für ein gebündeltes Plugin in diesem Repository erkennt OpenClaw Source-Checkout-
    Plugin-Pakete aus dem `extensions/*`-Workspace. Führen Sie den nächstliegenden gezielten
    Test aus:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Veröffentlichen">
    Validieren Sie das Paket vor der Veröffentlichung:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Die kanonischen ClawHub-Snippets liegen in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Installieren">
    Installieren Sie das veröffentlichte Paket über ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Tools registrieren

Tools können erforderlich oder optional sein. Erforderliche Tools sind immer verfügbar, wenn das
Plugin aktiviert ist. Optionale Tools erfordern ein Opt-in durch den Benutzer.

```typescript
register(api) {
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
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Benutzer stimmen mit `tools.allow` zu:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Optionale Tools steuern, ob ein Tool dem Modell bereitgestellt wird. Verwenden Sie
[Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests), wenn ein Tool
oder Hook nach Genehmigung fragen soll, nachdem das Modell es ausgewählt hat und bevor die
Aktion ausgeführt wird.

Verwenden Sie optionale Tools für Seiteneffekte, ungewöhnliche Binärdateien oder Fähigkeiten, die
standardmäßig nicht bereitgestellt werden sollten. Tool-Namen dürfen nicht mit Core-Tools kollidieren;
Konflikte werden übersprungen und in Plugin-Diagnosen gemeldet. Fehlerhafte
Registrierungen, einschließlich Tool-Deskriptoren ohne `parameters`, werden übersprungen und
auf die gleiche Weise gemeldet. Registrierte Tools sind typisierte Funktionen, die das Modell aufrufen kann,
nachdem Policy- und Allowlist-Prüfungen bestanden wurden.

Tool-Factories erhalten ein von der Runtime bereitgestelltes Kontextobjekt. Verwenden Sie `ctx.activeModel`,
wenn ein Tool das aktive Modell für den aktuellen Turn protokollieren, anzeigen oder sich daran anpassen muss.
Das Objekt kann `provider`, `modelId` und `modelRef` enthalten. Behandeln Sie es als
informative Runtime-Metadaten, nicht als Sicherheitsgrenze gegenüber dem lokalen
Operator, installiertem Plugin-Code oder einer modifizierten OpenClaw-Runtime. Sensible lokale
Tools sollten weiterhin ein explizites Plugin- oder Operator-Opt-in erfordern und geschlossen fehlschlagen,
wenn Active-Model-Metadaten fehlen oder ungeeignet sind.

Das Manifest deklariert Zuständigkeit und Erkennung; die Ausführung ruft weiterhin die live
registrierte Tool-Implementierung auf. Halten Sie `toolMetadata.<tool>.optional: true`
mit `api.registerTool(..., { optional: true })` konsistent, damit OpenClaw vermeiden kann,
diese Plugin-Runtime zu laden, bis das Tool explizit allowlisted ist.

## Importkonventionen

Importieren Sie aus fokussierten SDK-Unterpfaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Importieren Sie nicht aus dem veralteten Root-Barrel:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Innerhalb Ihres Plugin-Pakets verwenden Sie lokale Barrel-Dateien wie `api.ts` und
`runtime-api.ts` für interne Importe. Importieren Sie Ihr eigenes Plugin nicht über einen
SDK-Pfad. Provider-spezifische Hilfsfunktionen sollten im Provider-Paket bleiben, es sei denn,
die Schnittstelle ist wirklich generisch.

Benutzerdefinierte Gateway-RPC-Methoden sind ein fortgeschrittener Einstiegspunkt. Halten Sie sie auf einem
Plugin-spezifischen Präfix; Core-Admin-Namespaces wie `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` und `update.*` bleiben reserviert
und werden zu `operator.admin` aufgelöst. Die
`openclaw/plugin-sdk/gateway-method-runtime`-Bridge ist für Plugin-HTTP-
Routen reserviert, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren.

Die vollständige Importzuordnung finden Sie unter [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Checkliste vor der Einreichung

<Check>**package.json** hat korrekte `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden fokussierte `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Importe verwenden lokale Module, keine SDK-Selbstimporte</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (Plugins im Repository)</Check>

## Gegen Beta-Releases testen

1. Achten Sie auf GitHub-Release-Tags bei [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie sie über `Watch` > `Releases`. Beta-Tags sehen aus wie `v2026.3.N-beta.1`. Sie können auch Benachrichtigungen für das offizielle OpenClaw-X-Konto [@openclaw](https://x.com/openclaw) aktivieren, um Release-Ankündigungen zu erhalten.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Zeitfenster vor Stable beträgt typischerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` entweder `all good` oder was kaputtgegangen ist. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas kaputtgeht, öffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und wenden Sie das Label `beta-blocker` an. Legen Sie den Issue-Link in Ihren Thread.
5. Öffnen Sie einen PR zu `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Beitragende können PRs nicht labeln, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit PR werden gemergt; Blocker ohne PR werden möglicherweise trotzdem ausgeliefert. Maintainer beobachten diese Threads während der Beta-Tests.
6. Stille bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Erstellen Sie ein Messaging-Channel-Plugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Erstellen Sie ein Modell-Provider-Plugin
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/de/plugins/cli-backend-plugins">
    Registrieren Sie ein lokales KI-CLI-Backend
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/de/plugins/sdk-overview">
    Importzuordnung und Registrierungs-API-Referenz
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testhilfen und Muster
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Manifest-Schema-Referenz
  </Card>
</CardGroup>

## Verwandte Themen

- [Plugin-Hooks](/de/plugins/hooks)
- [Plugin-Architektur](/de/plugins/architecture)
