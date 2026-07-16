---
doc-schema-version: 1
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie wählen zwischen Dokumentationen zu Kanälen, Providern, CLI-Backends, Tools oder Hooks.
sidebarTitle: Getting Started
summary: Erstellen Sie in wenigen Minuten Ihr erstes OpenClaw-Plugin
title: Plugins entwickeln
x-i18n:
    generated_at: "2026-07-16T13:14:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins erweitern OpenClaw, ohne den Kern zu verändern. Ein Plugin kann einen Nachrichtenkanal, Modell-Provider, ein lokales CLI-Backend, Agentenwerkzeug, einen Hook, Medien-Provider oder eine andere Plugin-eigene Funktion hinzufügen.

Sie müssen dem OpenClaw-Repository kein externes Plugin hinzufügen. Veröffentlichen Sie das Paket auf [ClawHub](/clawhub); Benutzer installieren es mit:

```bash
openclaw plugins install clawhub:<package-name>
```

Reine Paketspezifikationen werden während der Umstellung beim Start weiterhin von npm installiert. Verwenden Sie das Präfix `clawhub:`, wenn die Auflösung über ClawHub erfolgen soll.

## Anforderungen

- Node 22.22.3+, Node 24.15+ oder Node 25.9+ sowie `npm` oder `pnpm`.
- TypeScript-ESM-Module.
- Klonen Sie für die Arbeit an gebündelten Plugins im Repository das Repository und führen Sie `pnpm install` aus.
  Die Plugin-Entwicklung aus einem Quell-Checkout unterstützt nur pnpm, da OpenClaw
  gebündelte Plugins aus den Workspace-Paketen unter `extensions/*` erkennt.

## Plugin-Form auswählen

<CardGroup cols={2}>
  <Card title="Kanal-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Verbinden Sie OpenClaw mit einer Nachrichtenplattform.
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Fügen Sie einen Modell-, Medien-, Such-, Abruf-, Sprach- oder Echtzeit-Provider hinzu.
  </Card>
  <Card title="CLI-Backend-Plugin" icon="terminal" href="/de/plugins/cli-backend-plugins">
    Führen Sie eine lokale KI-CLI über den Modell-Fallback von OpenClaw aus.
  </Card>
  <Card title="Werkzeug-Plugin" icon="wrench" href="/de/plugins/tool-plugins">
    Registrieren Sie Agentenwerkzeuge.
  </Card>
</CardGroup>

## Schnellstart

Erstellen Sie ein minimales Werkzeug-Plugin, indem Sie ein erforderliches Agentenwerkzeug registrieren. Dies ist die
kürzeste nützliche Plugin-Form und deckt Paket, Manifest, Einstiegspunkt und
lokalen Nachweis ab.

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

    Veröffentlichte externe Plugins sollten Laufzeiteinträge auf erstellte JavaScript-
    Dateien verweisen lassen. Den vollständigen Einstiegspunktvertrag finden Sie unter [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints).

    Jedes Plugin benötigt ein Manifest, auch ohne Konfiguration. Laufzeitwerkzeuge müssen
    in `contracts.tools` enthalten sein, damit OpenClaw die Zuständigkeit erkennen kann, ohne
    jede Plugin-Laufzeit vorzeitig zu laden. Legen Sie `activation.onStartup`
    bewusst fest; dieses Beispiel lädt beim Start des Gateways.

    Vom Host als vertrauenswürdig eingestufte Plugin-Oberflächen sind ebenfalls durch das Manifest eingeschränkt und erfordern für
    installierte Plugins eine ausdrückliche Deklaration: `api.registerAgentToolResultMiddleware(...)`
    erfordert, dass jede Ziellaufzeit in `contracts.agentToolResultMiddleware` aufgeführt ist,
    und `api.registerTrustedToolPolicy(...)` erfordert jede Richtlinien-ID in
    `contracts.trustedToolPolicies`. Diese Deklarationen halten die Prüfung bei der Installation
    und die Laufzeitregistrierung synchron.

    Informationen zu allen Manifestfeldern finden Sie unter [Plugin-Manifest](/de/plugins/manifest).

  </Step>

  <Step title="Werkzeug registrieren">
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

    Verwenden Sie `definePluginEntry` für Plugins, die keine Kanal-Plugins sind. Kanal-Plugins verwenden
    stattdessen `defineChannelPluginEntry` aus `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Laufzeit testen">
    Prüfen Sie für ein installiertes oder externes Plugin die geladene Laufzeit:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Wenn das Plugin einen CLI-Befehl registriert, führen Sie auch diesen Befehl aus und überprüfen Sie
    die Ausgabe, beispielsweise `openclaw demo-plugin ping`.

    Für ein gebündeltes Plugin in diesem Repository erkennt OpenClaw Plugin-Pakete aus dem
    Quell-Checkout im Workspace `extensions/*`. Führen Sie den am besten passenden gezielten
    Test aus:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Paketinstallation testen">
    Bevor Sie ein veröffentlichungsfertiges Plugin veröffentlichen, testen Sie dieselbe Installationsform, die Benutzer
    erhalten. Fügen Sie zunächst einen Build-Schritt hinzu, lassen Sie Laufzeiteinträge wie
    `openclaw.extensions` auf erstelltes JavaScript wie `./dist/index.js` verweisen und stellen Sie
    sicher, dass `npm pack` diese Ausgabe unter `dist/` enthält. TypeScript-Quelleinträge sind
    nur für Quell-Checkouts und lokale Entwicklungspfade vorgesehen.

    Packen Sie anschließend das Plugin und installieren Sie den Tarball mit `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` verwendet das von OpenClaw verwaltete npm-Projekt pro Plugin und erkennt daher
    Fehler bei Laufzeitabhängigkeiten, die Tests im Quell-Checkout verbergen können. Dies weist
    die Paket- und Abhängigkeitsstruktur nach, nicht das mit einem Katalog verknüpfte offizielle Vertrauen.
    Laufzeitimporte müssen in `dependencies` oder `optionalDependencies` enthalten sein;
    Abhängigkeiten, die nur in `devDependencies` verbleiben, werden für das
    verwaltete Laufzeitprojekt nicht installiert.

    Verwenden Sie keine direkte Archiv-/Pfadinstallation als abschließenden Nachweis für offizielles oder
    privilegiertes Plugin-Verhalten. Rohquellen sind für das lokale Debugging nützlich,
    weisen jedoch nicht denselben Abhängigkeitspfad wie npm- oder ClawHub-Installationen nach. Wenn
    Ihr Plugin auf den vertrauenswürdigen Status als offizielles Plugin angewiesen ist, fügen Sie einen zweiten Nachweis
    über eine kataloggestützte offizielle Installation oder einen veröffentlichten Paketpfad hinzu, der
    offizielles Vertrauen dokumentiert. Einzelheiten zu Installationsstamm und Zuständigkeit für
    Abhängigkeiten finden Sie unter
    [Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution).

  </Step>

  <Step title="Veröffentlichen">
    Validieren Sie das Paket vor der Veröffentlichung:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Kanonische ClawHub-Paketbeispiele befinden sich in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Installieren">
    Installieren Sie das veröffentlichte Paket über ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Werkzeuge registrieren

Werkzeuge können erforderlich oder optional sein. Erforderliche Werkzeuge sind immer verfügbar, wenn das
Plugin aktiviert ist. Optionale Werkzeuge erfordern eine ausdrückliche Zustimmung des Benutzers, bevor OpenClaw
die zugehörige Plugin-Laufzeit lädt.

Werkzeugfabriken erhalten einen vertrauenswürdigen Laufzeitkontext, einschließlich `deliveryContext`,
`nativeChannelId` für die aktive Plattformkonversation, sofern verfügbar, und
`requesterSenderId`.

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

Jedes mit `api.registerTool(...)` registrierte Werkzeug muss außerdem im
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

Benutzer stimmen über `tools.allow` zu:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Optionale Werkzeuge steuern, ob ein Werkzeug dem Modell bereitgestellt wird. Verwenden Sie
[Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests), wenn ein Werkzeug
oder Hook eine Genehmigung anfordern soll, nachdem das Modell es ausgewählt hat und bevor die
Aktion ausgeführt wird.

Verwenden Sie optionale Werkzeuge für Seiteneffekte, ungewöhnliche Binärdateien oder Funktionen, die
standardmäßig nicht bereitgestellt werden sollen. Werkzeugnamen dürfen nicht mit Namen von Kernwerkzeugen
kollidieren; Konflikte werden übersprungen und in der Plugin-Diagnose gemeldet. Fehlerhafte
Registrierungen werden auf dieselbe Weise übersprungen und gemeldet: ein fehlendes, nicht leeres
`name`, ein Wert in `execute`, der keine Funktion ist, oder ein Werkzeugdeskriptor ohne ein `parameters`-
Objekt.

Werkzeugfabriken erhalten ein von der Laufzeit bereitgestelltes Kontextobjekt. Verwenden Sie `ctx.activeModel`,
wenn ein Werkzeug das aktive Modell für den aktuellen
Durchlauf protokollieren, anzeigen oder sich daran anpassen muss; es kann `provider`, `modelId` und `modelRef` enthalten. Behandeln Sie es als
informative Laufzeitmetadaten, nicht als Sicherheitsgrenze gegenüber dem lokalen
Betreiber, installiertem Plugin-Code oder einer veränderten OpenClaw-Laufzeit. Sensible
lokale Werkzeuge sollten weiterhin eine ausdrückliche Zustimmung für das Plugin oder durch den Betreiber erfordern und
geschlossen fehlschlagen, wenn Metadaten zum aktiven Modell fehlen oder ungeeignet sind.

Das Manifest deklariert Zuständigkeit und Erkennung; bei der Ausführung wird weiterhin die aktive
registrierte Werkzeugimplementierung aufgerufen. Halten Sie `toolMetadata.<tool>.optional: true`
mit `api.registerTool(..., { optional: true })` synchron, damit OpenClaw das Laden
dieser Plugin-Laufzeit vermeiden kann, bis das Werkzeug ausdrücklich in die Zulassungsliste aufgenommen wird.

## Importkonventionen

Importieren Sie aus spezifischen SDK-Unterpfaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Importieren Sie nicht aus dem veralteten Stamm-Barrel:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Verwenden Sie innerhalb Ihres Plugin-Pakets lokale Barrel-Dateien wie `api.ts` und
`runtime-api.ts` für interne Importe. Importieren Sie Ihr eigenes Plugin nicht über einen
SDK-Pfad. Provider-spezifische Hilfsfunktionen sollten im Provider-Paket verbleiben, sofern
die Schnittstelle nicht wirklich generisch ist.

Benutzerdefinierte Gateway-RPC-Methoden sind ein fortgeschrittener Einstiegspunkt. Verwenden Sie dafür ein
Plugin-spezifisches Präfix; zentrale Admin-Namespaces wie `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` und `update.*` bleiben reserviert
und werden zu `operator.admin` aufgelöst. Die
`openclaw/plugin-sdk/gateway-method-runtime`-Bridge ist für Plugin-HTTP-
Routen reserviert, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren.

Die vollständige Importübersicht finden Sie unter [Übersicht über das Plugin SDK](/de/plugins/sdk-overview).

## Checkliste vor der Einreichung

<Check>**package.json** enthält korrekte `openclaw`-Metadaten</Check>
<Check>Das Manifest **openclaw.plugin.json** ist vorhanden und gültig</Check>
<Check>Der Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden spezifische `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Importe verwenden lokale Module, keine SDK-Selbstimporte</Check>
<Check>Tests sind erfolgreich (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ist erfolgreich (Plugins im Repository)</Check>

## Gegen Beta-Versionen testen

1. Beobachten Sie die Releases von [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Beta-Tags sehen wie `v2026.3.N-beta.1` aus. Sie können außerdem [@openclaw](https://x.com/openclaw) auf X folgen, um Release-Ankündigungen zu erhalten.
2. Testen Sie Ihr Plugin gegen den Beta-Tag, sobald er erscheint. Das Zeitfenster bis zur stabilen Version beträgt normalerweise nur wenige Stunden.
3. Veröffentlichen Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) entweder `all good` oder eine Beschreibung dessen, was nicht mehr funktioniert. Erstellen Sie einen Thread, falls noch keiner vorhanden ist.
4. Wenn etwas nicht mehr funktioniert, erstellen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und weisen Sie ihm das Label `beta-blocker` zu. Verlinken Sie das Issue in Ihrem Thread.
5. Erstellen Sie einen PR für `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Mitwirkende können PRs keine Labels zuweisen, daher dient der Titel den Maintainern und der Automatisierung als Signal auf PR-Seite. Blocker mit einem PR werden gemergt; Blocker ohne PR werden möglicherweise trotzdem ausgeliefert.
6. Keine Meldung bedeutet grünes Licht. Wenn Sie das Zeitfenster verpassen, wird Ihre Korrektur üblicherweise erst im nächsten Zyklus aufgenommen.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Kanal-Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Ein Plugin für einen Nachrichtenkanal erstellen
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Ein Plugin für einen Modell-Provider erstellen
  </Card>
  <Card title="CLI-Backend-Plugins" icon="terminal" href="/de/plugins/cli-backend-plugins">
    Ein lokales KI-CLI-Backend registrieren
  </Card>
  <Card title="SDK-Übersicht" icon="book-open" href="/de/plugins/sdk-overview">
    Referenz zur Importzuordnung und Registrierungs-API
  </Card>
  <Card title="Runtime-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche und Subagent über api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testhilfsprogramme und -muster
  </Card>
  <Card title="Plugin-Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Referenz zum Manifest-Schema
  </Card>
</CardGroup>

## Verwandte Themen

- [Plugin-Hooks](/de/plugins/hooks)
- [Plugin-Architektur](/de/plugins/architecture)
