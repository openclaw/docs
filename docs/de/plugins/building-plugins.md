---
doc-schema-version: 1
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie wählen zwischen Dokumentationen zu Kanal, Provider, CLI-Backend, Tool oder Hook.
sidebarTitle: Getting Started
summary: Erstellen Sie in wenigen Minuten Ihr erstes OpenClaw-Plugin
title: Plugins erstellen
x-i18n:
    generated_at: "2026-07-24T04:00:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9d156ea305e46d3ca311a0b2cfc42e2c4522f6f10eb70cdd5526d9e9fcd7d4ef
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins erweitern OpenClaw, ohne den Kern zu ändern. Ein Plugin kann einen Messaging-
Kanal, Modell-Provider, ein lokales CLI-Backend, Agentenwerkzeug, einen Hook, Medien-Provider
oder eine andere Plugin-eigene Funktion hinzufügen.

Sie müssen kein externes Plugin zum OpenClaw-Repository hinzufügen. Veröffentlichen Sie
das Paket auf [ClawHub](/clawhub); Benutzer installieren es mit:

```bash
openclaw plugins install clawhub:<package-name>
```

Während der Umstellung beim Launch werden einfache Paketspezifikationen weiterhin von npm installiert. Verwenden Sie das
Präfix `clawhub:`, wenn die Auflösung über ClawHub erfolgen soll.

## Anforderungen

- Node 22.22.3+, Node 24.15+ oder Node 25.9+ sowie `npm` oder `pnpm`.
- TypeScript-ESM-Module.
- Klonen Sie für die Arbeit an gebündelten Plugins im Repository das Repository und führen Sie `pnpm install` aus.
  Die Plugin-Entwicklung in einem Quellcode-Checkout ist ausschließlich mit pnpm möglich, da OpenClaw
  gebündelte Plugins aus `extensions/*`-Workspace-Paketen erkennt.

## Plugin-Form auswählen

<CardGroup cols={2}>
  <Card title="Kanal-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Verbinden Sie OpenClaw mit einer Messaging-Plattform.
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Fügen Sie einen Provider für Modelle, Medien, Suche, Abruf, Sprache oder Echtzeit hinzu.
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
    Dateien verweisen lassen. Den vollständigen Vertrag für Einstiegspunkte finden Sie unter [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints).

    Jedes Plugin benötigt ein Manifest, auch wenn es keine Konfiguration hat. Laufzeitwerkzeuge müssen
    in `contracts.tools` aufgeführt sein, damit OpenClaw die Eigentümerschaft erkennen kann, ohne
    jede Plugin-Laufzeit vorzeitig zu laden. Legen Sie `activation.onStartup`
    bewusst fest; dieses Beispiel wird beim Start des Gateways geladen.

    Vom Host als vertrauenswürdig eingestufte Plugin-Oberflächen sind ebenfalls durch das Manifest beschränkt und erfordern für
    installierte Plugins eine ausdrückliche Deklaration: `api.registerAgentToolResultMiddleware(...)`
    benötigt jede Ziellaufzeit in `contracts.agentToolResultMiddleware`,
    und `api.registerTrustedToolPolicy(...)` benötigt jede Richtlinien-ID in
    `contracts.trustedToolPolicies`. Diese Deklarationen sorgen dafür, dass die Prüfung zur Installationszeit
    und die Laufzeitregistrierung übereinstimmen.

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
          outputSchema: Type.Object(
            { input: Type.String() },
            { additionalProperties: false },
          ),
          async execute(_id, params) {
            const details = { input: params.input };
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
              details,
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
    Prüfen Sie bei einem installierten oder externen Plugin die geladene Laufzeit:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Wenn das Plugin einen CLI-Befehl registriert, führen Sie auch diesen Befehl aus und bestätigen Sie
    die Ausgabe, beispielsweise `openclaw demo-plugin ping`.

    Bei einem gebündelten Plugin in diesem Repository erkennt OpenClaw Plugin-Pakete aus dem
    Quellcode-Checkout über den `extensions/*`-Workspace. Führen Sie den am besten passenden gezielten
    Test aus:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Paketinstallation testen">
    Testen Sie vor der Veröffentlichung eines paketfertigen Plugins dieselbe Installationsform, die Benutzer
    erhalten werden. Fügen Sie zunächst einen Build-Schritt hinzu, lassen Sie Laufzeiteinträge wie
    `openclaw.extensions` auf erstelltes JavaScript wie `./dist/index.js` verweisen und stellen Sie
    sicher, dass `npm pack` diese `dist/`-Ausgabe enthält. TypeScript-Quellcodeeinträge sind
    ausschließlich für Quellcode-Checkouts und lokale Entwicklungspfade vorgesehen.

    Packen Sie anschließend das Plugin und installieren Sie das Tarball mit `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` verwendet das von OpenClaw verwaltete npm-Projekt pro Plugin und erkennt daher
    Fehler bei Laufzeitabhängigkeiten, die Tests im Quellcode-Checkout verbergen können. Damit werden
    die Paket- und Abhängigkeitsstruktur nachgewiesen, nicht das mit einem Katalog verknüpfte offizielle Vertrauen.
    Laufzeitimporte müssen in `dependencies` oder `optionalDependencies` enthalten sein;
    Abhängigkeiten, die nur in `devDependencies` verbleiben, werden für das
    verwaltete Laufzeitprojekt nicht installiert.

    Verwenden Sie eine direkte Archiv-/Pfadinstallation nicht als abschließenden Nachweis für offizielles oder
    privilegiertes Plugin-Verhalten. Direkte Quellen sind für die lokale Fehlerbehebung nützlich,
    weisen jedoch nicht denselben Abhängigkeitspfad wie Installationen über npm oder ClawHub nach. Wenn
    Ihr Plugin auf dem Status als vertrauenswürdiges offizielles Plugin beruht, fügen Sie einen zweiten Nachweis
    über eine kataloggestützte offizielle Installation oder einen veröffentlichten Paketpfad hinzu, der
    offizielles Vertrauen verzeichnet. Einzelheiten zum Installationsstamm und zur Eigentümerschaft von
    Abhängigkeiten finden Sie unter [Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution).

  </Step>

  <Step title="Veröffentlichen">
    Validieren Sie das Paket vor der Veröffentlichung:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Kanonische ClawHub-Paketausschnitte befinden sich in `docs/snippets/plugin-publish/`.

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
Plugin aktiviert ist. Optionale Werkzeuge erfordern die ausdrückliche Zustimmung des Benutzers, bevor OpenClaw
die zugehörige Plugin-Laufzeit lädt.

Werkzeug-Factorys erhalten einen vertrauenswürdigen Laufzeitkontext, einschließlich `deliveryContext`,
`nativeChannelId` für die aktive Plattformkonversation, sofern verfügbar, sowie
`requesterSenderId`.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      outputSchema: Type.Object(
        { pipeline: Type.String() },
        { additionalProperties: false },
      ),
      async execute(_id, params) {
        return {
          content: [{ type: "text", text: params.pipeline }],
          details: { pipeline: params.pipeline },
        };
      },
    },
    { optional: true },
  );
}
```

`outputSchema` ist optional. Es beschreibt den strukturierten `details`-Wert, der von
[Code Mode](/tools/code-mode) und [Werkzeugsuche](/de/tools/tool-search) verwendet wird. Katalog-
aufrufe lehnen ungültige Schemas vor der Ausführung ab und validieren den endgültigen Wert nach
Werkzeug-Hooks. Lassen Sie es bei Werkzeugen ohne stabiles JSON-Ergebnis weg. Den vollständigen Vertrag finden Sie unter
[Werkzeug-Plugins](/de/plugins/tool-plugins#output-contracts).

Jedes mit `api.registerTool(...)` registrierte Werkzeug muss auch im
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
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Optionale Werkzeuge steuern, ob ein Werkzeug dem Modell zur Verfügung gestellt wird. Verwenden Sie
[Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests), wenn ein Werkzeug
oder Hook nach der Auswahl durch das Modell und vor der Ausführung der
Aktion eine Genehmigung anfordern soll.

Verwenden Sie optionale Werkzeuge für Nebeneffekte, ungewöhnliche Binärdateien oder Funktionen, die
standardmäßig nicht verfügbar sein sollten. Werkzeugnamen dürfen nicht mit Namen von Kernwerkzeugen
kollidieren; Konflikte werden übersprungen und in der Plugin-Diagnose gemeldet. Fehlerhafte
Registrierungen werden auf dieselbe Weise übersprungen und gemeldet: ein fehlendes, nicht leeres
`name`, ein `execute`, das keine Funktion ist, oder ein Werkzeugdeskriptor ohne ein `parameters`-
Objekt.

Werkzeug-Factorys erhalten ein von der Laufzeit bereitgestelltes Kontextobjekt. Verwenden Sie `ctx.activeModel`,
wenn ein Werkzeug das für den aktuellen Turn aktive Modell protokollieren, anzeigen oder sich daran anpassen
muss; es kann `provider`, `modelId` und `modelRef` enthalten. Behandeln Sie es als
informative Laufzeitmetadaten, nicht als Sicherheitsgrenze gegenüber dem lokalen
Betreiber, installiertem Plugin-Code oder einer modifizierten OpenClaw-Laufzeit. Sensible
lokale Werkzeuge sollten weiterhin eine ausdrückliche Zustimmung für das Plugin oder durch den Betreiber erfordern und
geschlossen fehlschlagen, wenn Metadaten zum aktiven Modell fehlen oder ungeeignet sind.

Das Manifest deklariert Eigentümerschaft und Erkennung; bei der Ausführung wird weiterhin die aktive
registrierte Werkzeugimplementierung aufgerufen. Halten Sie `toolMetadata.<tool>.optional: true`
und `api.registerTool(..., { optional: true })` aufeinander abgestimmt, damit OpenClaw
das Laden dieser Plugin-Laufzeit vermeiden kann, bis das Werkzeug ausdrücklich in die Zulassungsliste aufgenommen wurde.

## Importkonventionen

Importieren Sie aus fokussierten SDK-Unterpfaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Verwenden Sie innerhalb Ihres Plugin-Pakets lokale Barrel-Dateien wie `api.ts` und
`runtime-api.ts` für interne Importe. Importieren Sie Ihr eigenes Plugin nicht über einen
SDK-Pfad. Provider-spezifische Hilfsfunktionen sollten im Provider-Paket verbleiben, sofern
die Schnittstelle nicht wirklich generisch ist.

Benutzerdefinierte Gateway-RPC-Methoden sind ein fortgeschrittener Einstiegspunkt. Verwenden Sie dafür ein
Plugin-spezifisches Präfix; administrative Kern-Namespaces wie `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` und `update.*` bleiben reserviert
und werden zu `operator.admin` aufgelöst. Die
`openclaw/plugin-sdk/gateway-method-runtime`-Bridge ist für Plugin-HTTP-
Routen reserviert, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren.

Die vollständige Importübersicht finden Sie unter [Übersicht über das Plugin SDK](/de/plugins/sdk-overview).

Die SDK-Kompatibilitätsfelder von OpenClaw tragen TypeScript-`@deprecated`-Annotationen,
die Editoren als Migrationswarnungen anzeigen. Um sie zur Build-Zeit durchzusetzen,
aktivieren Sie eine typbewusste Regel wie
[`@typescript-eslint/no-deprecated`](https://typescript-eslint.io/rules/no-deprecated/).
Oxlint ist nicht typbewusst und kann diese Annotationen daher nicht durchsetzen.

## Checkliste vor der Einreichung

<Check>**package.json** enthält korrekte `openclaw`-Metadaten</Check>
<Check>Das **openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Der Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden gezielte `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Importe verwenden lokale Module, keine Selbstimporte aus dem SDK</Check>
<Check>Tests sind erfolgreich (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ist erfolgreich (repo-interne Plugins)</Check>

## Gegen Beta-Releases testen

1. Beobachten Sie die Releases von [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Beta-Tags sehen wie `v2026.3.N-beta.1` aus. Sie können auch [@openclaw](https://x.com/openclaw) auf X folgen, um Release-Ankündigungen zu erhalten.
2. Testen Sie Ihr Plugin gegen den Beta-Tag, sobald er erscheint. Das Zeitfenster vor dem stabilen Release beträgt in der Regel nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) entweder `all good` oder eine Beschreibung dessen, was nicht funktioniert hat. Erstellen Sie einen Thread, falls Sie noch keinen haben.
4. Wenn etwas nicht funktioniert, erstellen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und wenden Sie das Label `beta-blocker` an. Verlinken Sie das Issue in Ihrem Thread.
5. Öffnen Sie einen PR für `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Mitwirkende können PRs keine Labels zuweisen, daher dient der Titel als Signal auf PR-Seite für Maintainer und Automatisierung. Blocker mit einem PR werden zusammengeführt; Blocker ohne PR werden möglicherweise trotzdem ausgeliefert.
6. Keine Rückmeldung bedeutet grünes Licht. Wenn Sie das Zeitfenster verpassen, wird Ihre Korrektur normalerweise im nächsten Zyklus aufgenommen.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Kanal-Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Ein Plugin für einen Nachrichtenkanal entwickeln
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Ein Plugin für einen Modell-Provider entwickeln
  </Card>
  <Card title="CLI-Backend-Plugins" icon="terminal" href="/de/plugins/cli-backend-plugins">
    Ein lokales KI-CLI-Backend registrieren
  </Card>
  <Card title="SDK-Übersicht" icon="book-open" href="/de/plugins/sdk-overview">
    API-Referenz für Importzuordnung und Registrierung
  </Card>
  <Card title="Runtime-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche und Subagent über api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testwerkzeuge und Muster
  </Card>
  <Card title="Plugin-Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Referenz des Manifestschemas
  </Card>
</CardGroup>

## Verwandte Themen

- [Plugin-Hooks](/de/plugins/hooks)
- [Plugin-Architektur](/de/plugins/architecture)
