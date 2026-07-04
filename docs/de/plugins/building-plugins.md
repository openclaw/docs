---
doc-schema-version: 1
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie wählen zwischen Dokumentation zu Kanal, Provider, CLI-Backend, Tool oder Hook
sidebarTitle: Getting Started
summary: Erstellen Sie Ihr erstes OpenClaw-Plugin in wenigen Minuten
title: Plugins erstellen
x-i18n:
    generated_at: "2026-07-04T15:12:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins erweitern OpenClaw, ohne den Kern zu ändern. Ein Plugin kann einen Messaging-
Kanal, Modell-Provider, lokalen CLI-Backend, Agent-Tool, Hook, Medien-Provider
oder eine andere Plugin-eigene Fähigkeit hinzufügen.

Sie müssen kein externes Plugin zum OpenClaw-Repository hinzufügen. Veröffentlichen
Sie das Paket auf [ClawHub](/de/clawhub), und Benutzer installieren es mit:

```bash
openclaw plugins install clawhub:<package-name>
```

Nackte Paketspezifikationen werden während der Launch-Umstellung weiterhin von npm installiert. Verwenden Sie das
Präfix `clawhub:`, wenn Sie die ClawHub-Auflösung wünschen.

## Anforderungen

- Verwenden Sie Node 22.19+, Node 23.11+ oder Node 24+ und einen Paketmanager wie `npm` oder `pnpm`.
- Machen Sie sich mit TypeScript-ESM-Modulen vertraut.
- Klonen Sie für im Repository gebündelte Plugin-Arbeit das Repository und führen Sie `pnpm install` aus.
  Die Plugin-Entwicklung aus einem Source-Checkout ist nur mit pnpm möglich, weil OpenClaw gebündelte
  Plugins aus Workspace-Paketen unter `extensions/*` lädt.

## Plugin-Form auswählen

<CardGroup cols={2}>
  <Card title="Kanal-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Verbinden Sie OpenClaw mit einer Messaging-Plattform.
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Fügen Sie einen Modell-, Medien-, Such-, Fetch-, Sprach- oder Echtzeit-Provider hinzu.
  </Card>
  <Card title="CLI-Backend-Plugin" icon="terminal" href="/de/plugins/cli-backend-plugins">
    Führen Sie eine lokale KI-CLI über OpenClaw-Modell-Fallback aus.
  </Card>
  <Card title="Tool-Plugin" icon="wrench" href="/de/plugins/tool-plugins">
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
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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

    Veröffentlichte externe Plugins sollten Laufzeit-Einträge auf gebaute JavaScript-
    Dateien zeigen lassen. Den vollständigen Einstiegspunkt-Vertrag finden Sie unter [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints).

    Jedes Plugin benötigt ein Manifest, selbst wenn es keine Konfiguration hat. Laufzeit-Tools
    müssen in `contracts.tools` erscheinen, damit OpenClaw die Zuständigkeit erkennen kann, ohne
    jede Plugin-Laufzeit vorab zu laden. Setzen Sie `activation.onStartup`
    bewusst. Dieses Beispiel startet beim Gateway-Start.

    Host-vertrauenswürdige Plugin-Oberflächen sind ebenfalls manifestgesteuert und erfordern eine explizite
    Aktivierung für installierte Plugins. Wenn ein installiertes Plugin
    `api.registerAgentToolResultMiddleware(...)` registriert, deklarieren Sie jede Ziel-Laufzeit in
    `contracts.agentToolResultMiddleware`. Wenn es
    `api.registerTrustedToolPolicy(...)` registriert, deklarieren Sie jede Policy-ID in
    `contracts.trustedToolPolicies`. Diese Deklarationen halten die Prüfung zur Installationszeit
    und die Laufzeitregistrierung aufeinander abgestimmt.

    Alle Manifestfelder finden Sie unter [Plugin-Manifest](/de/plugins/manifest).

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

    Verwenden Sie `definePluginEntry` für Nicht-Kanal-Plugins. Kanal-Plugins verwenden
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Laufzeit testen">
    Prüfen Sie bei einem installierten oder externen Plugin die geladene Laufzeit:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Wenn das Plugin einen CLI-Befehl registriert, führen Sie auch diesen Befehl aus. Zum Beispiel
    sollte ein Demo-Befehl einen Ausführungsnachweis wie
    `openclaw demo-plugin ping` haben.

    Bei einem gebündelten Plugin in diesem Repository erkennt OpenClaw Source-Checkout-
    Plugin-Pakete aus dem `extensions/*`-Workspace. Führen Sie den nächstliegenden gezielten
    Test aus:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Paketinstallation testen">
    Bevor Sie ein paketfertiges Plugin veröffentlichen, testen Sie dieselbe Installationsform, die Benutzer
    erhalten werden. Fügen Sie zuerst einen Build-Schritt hinzu, lassen Sie Laufzeit-Einträge wie
    `openclaw.extensions` auf gebautes JavaScript wie `./dist/index.js` zeigen, und stellen Sie
    sicher, dass `npm pack` diese `dist/`-Ausgabe enthält. TypeScript-Quelleinträge sind
    nur für Source-Checkouts und lokale Entwicklungspfade vorgesehen.

    Packen Sie dann das Plugin und installieren Sie den Tarball mit `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` verwendet OpenClaws verwaltetes npm-Projekt pro Plugin, sodass es
    Laufzeit-Abhängigkeitsfehler findet, die Source-Checkout-Tests verbergen können. Es weist
    die Paket- und Abhängigkeitsform nach, nicht katalogverknüpftes offizielles Vertrauen.
    Laufzeit-Imports müssen in `dependencies` oder `optionalDependencies` stehen;
    Abhängigkeiten, die nur in `devDependencies` verbleiben, werden für das
    verwaltete Laufzeitprojekt nicht installiert.

    Verwenden Sie keine rohe Archiv-/Pfadinstallation als finalen Nachweis für offizielles oder
    privilegiertes Plugin-Verhalten. Rohe Quellen sind für lokales Debugging nützlich, aber
    sie weisen nicht denselben Abhängigkeitspfad wie npm- oder ClawHub-Installationen nach. Wenn
    Ihr Plugin auf vertrauenswürdigen offiziellen Plugin-Status angewiesen ist, fügen Sie einen zweiten Nachweis
    über eine kataloggestützte offizielle Installation oder einen veröffentlichten Paketpfad hinzu, der
    offizielles Vertrauen aufzeichnet. Details zu Installations-Root und Zuständigkeit für Abhängigkeiten finden Sie unter
    [Plugin-Abhängigkeitsauflösung](/de/plugins/dependency-resolution).

  </Step>

  <Step title="Veröffentlichen">
    Validieren Sie das Paket vor der Veröffentlichung:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Die kanonischen ClawHub-Snippets befinden sich in `docs/snippets/plugin-publish/`.

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
Plugin aktiviert ist. Optionale Tools erfordern eine Zustimmung durch den Benutzer.

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

Optionale Tools steuern, ob ein Tool dem Modell offengelegt wird. Verwenden Sie
[Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests), wenn ein Tool
oder Hook nach der Auswahl durch das Modell und vor dem Ausführen der
Aktion eine Genehmigung anfordern soll.

Verwenden Sie optionale Tools für Seiteneffekte, ungewöhnliche Binärdateien oder Fähigkeiten, die
standardmäßig nicht offengelegt werden sollten. Tool-Namen dürfen nicht mit Core-Tools kollidieren;
Konflikte werden übersprungen und in den Plugin-Diagnosen gemeldet. Fehlerhafte
Registrierungen, einschließlich Tool-Deskriptoren ohne `parameters`, werden übersprungen und
auf dieselbe Weise gemeldet. Registrierte Tools sind typisierte Funktionen, die das Modell
aufrufen kann, nachdem Policy- und Allowlist-Prüfungen bestanden wurden.

Tool-Factories erhalten ein von der Laufzeit bereitgestelltes Kontextobjekt. Verwenden Sie `ctx.activeModel`,
wenn ein Tool das aktive Modell für den aktuellen Turn protokollieren, anzeigen oder sich daran
anpassen muss. Das Objekt kann `provider`, `modelId` und `modelRef` enthalten. Behandeln Sie es als
informative Laufzeitmetadaten, nicht als Sicherheitsgrenze gegenüber dem lokalen
Operator, installiertem Plugin-Code oder einer modifizierten OpenClaw-Laufzeit. Sensible lokale
Tools sollten weiterhin eine explizite Plugin- oder Operator-Zustimmung erfordern und geschlossen fehlschlagen,
wenn aktive Modellmetadaten fehlen oder ungeeignet sind.

Das Manifest deklariert Zuständigkeit und Discovery; die Ausführung ruft weiterhin die live
registrierte Tool-Implementierung auf. Halten Sie `toolMetadata.<tool>.optional: true`
mit `api.registerTool(..., { optional: true })` abgestimmt, damit OpenClaw vermeiden kann,
diese Plugin-Laufzeit zu laden, bis das Tool explizit in die Allowlist aufgenommen wurde.

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

Verwenden Sie innerhalb Ihres Plugin-Pakets lokale Barrel-Dateien wie `api.ts` und
`runtime-api.ts` für interne Imports. Importieren Sie Ihr eigenes Plugin nicht über einen
SDK-Pfad. Provider-spezifische Hilfsfunktionen sollten im Provider-Paket bleiben, sofern
die Schnittstelle nicht wirklich generisch ist.

Benutzerdefinierte Gateway-RPC-Methoden sind ein fortgeschrittener Einstiegspunkt. Belassen Sie sie unter einem
Plugin-spezifischen Präfix; Core-Admin-Namespaces wie `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` und `update.*` bleiben reserviert
und werden zu `operator.admin` aufgelöst. Die
`openclaw/plugin-sdk/gateway-method-runtime`-Bridge ist für Plugin-HTTP-
Routen reserviert, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren.

Die vollständige Import-Map finden Sie in der [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Checkliste vor der Einreichung

<Check>**package.json** enthält korrekte `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Der Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Imports verwenden fokussierte `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Imports verwenden lokale Module, keine SDK-Selbstimports</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (In-Repo-Plugins)</Check>

## Gegen Beta-Releases testen

1. Achten Sie auf GitHub-Release-Tags bei [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie sie über `Watch` > `Releases`. Beta-Tags sehen wie `v2026.3.N-beta.1` aus. Sie können außerdem Benachrichtigungen für das offizielle OpenClaw-X-Konto [@openclaw](https://x.com/openclaw) aktivieren, um Release-Ankündigungen zu erhalten.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Zeitfenster bis zur stabilen Version beträgt typischerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` entweder `all good` oder was kaputtgegangen ist. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas kaputtgeht, öffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und wenden Sie das Label `beta-blocker` an. Setzen Sie den Issue-Link in Ihren Thread.
5. Öffnen Sie einen PR auf `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Mitwirkende können PRs nicht labeln, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit einem PR werden gemergt; Blocker ohne PR könnten trotzdem ausgeliefert werden. Maintainer beobachten diese Threads während des Beta-Tests.
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
    Import-Map und API-Referenz zur Registrierung
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testhilfen und Muster
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Referenz zum Manifest-Schema
  </Card>
</CardGroup>

## Verwandt

- [Plugin-Hooks](/de/plugins/hooks)
- [Plugin-Architektur](/de/plugins/architecture)
