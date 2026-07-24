---
read_when:
    - Sie fügen einem Plugin einen Einrichtungsassistenten hinzu.
    - Sie müssen setup-entry.ts im Vergleich zu index.ts verstehen
    - Sie definieren Plugin-Konfigurationsschemas oder OpenClaw-Metadaten in package.json
sidebarTitle: Setup and config
summary: Einrichtungsassistenten, setup-entry.ts, Konfigurationsschemas und package.json-Metadaten
title: Plugin-Einrichtung und -Konfiguration
x-i18n:
    generated_at: "2026-07-24T04:49:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b07e3fa365939fa9c0885b31b7894f5e734313a7deef2297e316956063d97e45
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referenz für die Plugin-Paketierung (`package.json`-Metadaten), Manifeste (`openclaw.plugin.json`), Einrichtungseinträge und Konfigurationsschemas.

<Tip>
**Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Die Anleitungen behandeln die Paketierung im jeweiligen Kontext: [Channel-Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paketmetadaten

Ihr `package.json` benötigt ein `openclaw`-Feld, das dem Plugin-System mitteilt, was Ihr Plugin bereitstellt:

<Tabs>
  <Tab title="Channel-Plugin">
    ```json
    {
      "name": "@myorg/openclaw-my-channel",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "my-channel",
          "label": "Mein Channel",
          "blurb": "Kurze Beschreibung des Channels."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Provider-Plugin/ClawHub-Basis">
    ```json openclaw-clawhub-package.json
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
  </Tab>
</Tabs>

<Note>
Für die externe Veröffentlichung auf ClawHub sind `compat` und `build` erforderlich. Die kanonischen Veröffentlichungsbeispiele befinden sich in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-Felder

<ParamField path="extensions" type="string[]">
  Einstiegspunktdateien (relativ zum Paketstammverzeichnis). Gültige Quelleinträge für die Entwicklung in Workspaces und Git-Checkouts.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Erstellte JavaScript-Gegenstücke für `extensions`, die bevorzugt werden, wenn OpenClaw ein installiertes npm-Paket lädt. Die Auflösungsreihenfolge für Quell- und Build-Dateien finden Sie unter [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints).
</ParamField>
<ParamField path="setupEntry" type="string">
  Leichtgewichtiger Einstieg nur für die Einrichtung (optional).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Erstelltes JavaScript-Gegenstück für `setupEntry`. Erfordert, dass auch `setupEntry` festgelegt ist.
</ParamField>
<ParamField path="plugin" type="object">
  `{ id, label }`-Fallback-Plugin-Identität, die verwendet wird, wenn ein Plugin keine Channel-/Provider-Metadaten besitzt, aus denen eine ID oder Bezeichnung abgeleitet werden kann.
</ParamField>
<ParamField path="channel" type="object">
  Channel-Katalogmetadaten für Einrichtungs-, Auswahl-, Schnellstart- und Statusoberflächen.
</ParamField>
<ParamField path="install" type="object">
  Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Flags für das Startverhalten.
</ParamField>
<ParamField path="compat" type="object">
  Von diesem Plugin unterstützter `pluginApi`-Versionsbereich. Für externe Veröffentlichungen auf ClawHub erforderlich.
</ParamField>

<Note>
Provider-IDs (`providers: string[]`) sind Manifestmetadaten, keine Paketmetadaten. Deklarieren Sie sie in `openclaw.plugin.json`, nicht hier – siehe [Plugin-Manifest](/de/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` sind leichtgewichtige Paketmetadaten für die Channel-Erkennung und Einrichtungsoberflächen vor dem Laden der Laufzeit.

### Channel-eigene Einrichtungsfelder

Channel-Plugins sollten Einrichtungsfelder einmalig im Laufzeitcode mit `defineChannelSetupContract(...)` definieren und die entsprechende serialisierbare Projektion unter `openclaw.channel.setup.fields` veröffentlichen. Die Laufzeitdefinition leitet den Plugin-lokalen Eingabetyp ab, analysiert sowohl geführte als auch nicht interaktive Werte und hält Channel-spezifische Schlüssel aus den Kerntypen heraus. Mithilfe der Paketmetadaten können `openclaw channels add <channel-id> --help` und `openclaw channels add --channel <channel-id> --help` ausschließlich die Optionen des ausgewählten Channels erkennen, ohne das Plugin zu laden.

```ts
import { defineChannelSetupContract } from "openclaw/plugin-sdk/channel-setup";

export const setupContract = defineChannelSetupContract({
  fields: {
    endpoint: {
      kind: "string",
      cli: { flags: "--endpoint <url>", description: "Dienstendpunkt" },
    },
    transport: {
      kind: "choice",
      choices: ["native", "container"],
      cli: { flags: "--transport <kind>", description: "Transportverantwortlicher" },
    },
  },
  adapter: {
    applyAccountConfig: ({ cfg, input }) => ({
      ...cfg,
      channels: { ...cfg.channels, example: input },
    }),
  },
});
```

```json
{
  "openclaw": {
    "channel": {
      "id": "example",
      "setup": {
        "fields": [
          {
            "key": "endpoint",
            "kind": "string",
            "cli": { "flags": "--endpoint <url>", "description": "Dienstendpunkt" }
          },
          {
            "key": "transport",
            "kind": "choice",
            "choices": ["native", "container"],
            "cli": { "flags": "--transport <kind>", "description": "Transportverantwortlicher" }
          }
        ]
      }
    }
  }
}
```

Unterstützte Feldarten sind `string`, `boolean`, `integer`, `string-list` und `choice`. Verwenden Sie `sensitive: true` für Anmeldedaten. Jeder Feldschlüssel muss dem in camelCase geschriebenen Attributnamen seines langen CLI-Flags entsprechen, einschließlich negierter Formen, beispielsweise `apiToken` für `--api-token`. Boolesche Felder können `cli.negatedFlags` hinzufügen, wenn sowohl positive als auch `--no-*`-Formen benötigt werden. `channel`, `account` und die Kontoanzeige `name` bleiben die gemeinsame Steuerungshülle.

Der veröffentlichte `setup`/`ChannelSetupInput`-Adapter bleibt für bestehende externe Plugins verfügbar. Neue Plugins sollten `setupContract` bereitstellen; OpenClaw bevorzugt diesen immer, wenn beide vorhanden sind.

| Feld                                   | Typ        | Bedeutung                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                     | `string`   | Kanonische Channel-ID.                                                        |
| `label`                     | `string`   | Primäre Channel-Bezeichnung.                                                  |
| `selectionLabel`                     | `string`   | Auswahl-/Einrichtungsbezeichnung, wenn sie von `label` abweichen soll. |
| `detailLabel`                     | `string`   | Sekundäre Detailbezeichnung für umfangreichere Channel-Kataloge und Statusoberflächen. |
| `docsPath`                     | `string`   | Dokumentationspfad für Einrichtungs- und Auswahllinks.                        |
| `docsLabel`                     | `string`   | Überschreibende Bezeichnung für Dokumentationslinks, wenn sie von der Channel-ID abweichen soll. |
| `blurb`                     | `string`   | Kurze Onboarding-/Katalogbeschreibung.                                        |
| `order`                     | `number`   | Sortierreihenfolge in Channel-Katalogen.                                      |
| `aliases`                     | `string[]` | Zusätzliche Suchaliasnamen für die Channel-Auswahl.                            |
| `preferOver`                     | `string[]` | Niedriger priorisierte Plugin-/Channel-IDs, vor denen dieser Channel eingestuft werden soll. |
| `systemImage`                     | `string`   | Optionaler Symbol-/Systembildname für Channel-UI-Kataloge.                    |
| `selectionDocsPrefix`                     | `string`   | Präfixtext vor Dokumentationslinks in Auswahloberflächen.                     |
| `selectionDocsOmitLabel`                     | `boolean`  | Den Dokumentationspfad direkt statt eines beschrifteten Dokumentationslinks im Auswahltext anzeigen. |
| `selectionExtras`                     | `string[]` | Zusätzliche kurze Zeichenfolgen, die an den Auswahltext angehängt werden.      |
| `markdownCapable`                     | `boolean`  | Kennzeichnet den Channel für Entscheidungen zur ausgehenden Formatierung als Markdown-fähig. |
| `exposure`                     | `object`   | Steuert die Sichtbarkeit des Channels in Einrichtungs-, Konfigurationslisten- und Dokumentationsoberflächen. |
| `quickstartAllowFrom`                     | `boolean`  | Nimmt diesen Channel in den standardmäßigen Schnellstart-Einrichtungsablauf `allowFrom` auf. |
| `forceAccountBinding`                     | `boolean`  | Erfordert eine explizite Kontobindung, auch wenn nur ein Konto vorhanden ist. |
| `preferSessionLookupForAnnounceTarget`                     | `boolean`  | Bevorzugt die Sitzungssuche beim Auflösen von Ankündigungszielen für diesen Channel. |
| `setup`                     | `object`   | Serialisierbare Channel-eigene Einrichtungsfelder für die verzögerte Erkennung von CLI-Optionen. |

Beispiel:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "Mein Channel",
      "selectionLabel": "Mein Channel (selbst gehostet)",
      "detailLabel": "Mein Channel-Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-basierte selbst gehostete Chat-Integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Anleitung:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` unterstützt:

- `configured`: den Channel in konfigurierten/statusähnlichen Listenoberflächen anzeigen
- `setup`: den Channel in interaktiven Einrichtungs-/Konfigurationsauswahlen anzeigen
- `docs`: den Channel in Dokumentations-/Navigationsoberflächen als öffentlich sichtbar kennzeichnen

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                                 | Bedeutung                                                                         |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kanonische ClawHub-Spezifikation für Installations-/Aktualisierungs- und Onboarding-Abläufe mit bedarfsgesteuerter Installation. |
| `npmSpec`                    | `string`                            | Kanonische npm-Spezifikation für Fallback-Abläufe bei Installation/Aktualisierung. |
| `localPath`                  | `string`                            | Lokaler Entwicklungspfad oder gebündelter Installationspfad.                      |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn mehrere Quellen verfügbar sind.              |
| `minHostVersion`             | `string`                            | Unterstützte Mindestversion von OpenClaw, `>=x.y.z` oder `>=x.y.z-prerelease`.   |
| `expectedIntegrity`          | `string`                            | Erwartete npm-dist-Integritätszeichenfolge, normalerweise `sha512-...`, für angeheftete Installationen. |
| `allowInvalidConfigRecovery` | `boolean`                           | Ermöglicht Neuinstallationsabläufen gebündelter Plugins die Wiederherstellung nach bestimmten Fehlern durch veraltete Konfigurationen. |
| `requiredPlatformPackages`   | `string[]`                          | Erforderliche plattformspezifische npm-Aliasse, die während der npm-Installation überprüft werden. |

<AccordionGroup>
  <Accordion title="Onboarding-Verhalten">
    Das interaktive Onboarding verwendet `openclaw.install` für Oberflächen zur bedarfsgesteuerten Installation: Wenn Ihr Plugin vor dem Laden der Laufzeit Provider-Authentifizierungsoptionen oder Metadaten für Kanaleinrichtung/-katalog bereitstellt, kann das Onboarding zur Installation über ClawHub, npm oder eine lokale Quelle auffordern, das Plugin installieren oder aktivieren und anschließend den ausgewählten Ablauf fortsetzen. ClawHub-Optionen verwenden `clawhubSpec` und werden bevorzugt, wenn sie vorhanden sind; npm-Optionen erfordern vertrauenswürdige Katalogmetadaten mit einer Registry-`npmSpec` (exakte Versionen und `expectedIntegrity` sind optionale Anheftungen, die bei Installation/Aktualisierung erzwungen werden, wenn sie festgelegt sind). Halten Sie „was angezeigt werden soll“ in `openclaw.plugin.json` und „wie es installiert wird“ in `package.json`.
  </Accordion>
  <Accordion title="Durchsetzung von minHostVersion">
    Wenn `minHostVersion` festgelegt ist, wird es sowohl bei der Installation als auch beim Laden nicht gebündelter Manifest-Registrys durchgesetzt. Ältere Hosts überspringen externe Plugins; ungültige Versionszeichenfolgen werden abgelehnt. Bei gebündelten Quell-Plugins wird angenommen, dass sie dieselbe Version wie der Host-Checkout haben.
  </Accordion>
  <Accordion title="Angeheftete npm-Installationen">
    Behalten Sie bei angehefteten npm-Installationen die exakte Version in `npmSpec` bei und fügen Sie die erwartete Artefaktintegrität hinzu:

    ```json
    {
      "openclaw": {
        "install": {
          "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
          "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
          "defaultChoice": "npm"
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="Geltungsbereich von allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` ist keine allgemeine Umgehung für fehlerhafte Konfigurationen. Es dient ausschließlich der gezielten Wiederherstellung gebündelter Plugins und ermöglicht es Neuinstallation/Einrichtung, bekannte Überreste von Aktualisierungen zu reparieren, etwa einen fehlenden Pfad eines gebündelten Plugins oder einen veralteten `channels.<id>`-Eintrag für dasselbe Plugin. Wenn die Konfiguration aus anderen Gründen fehlerhaft ist, schlägt die Installation weiterhin sicher geschlossen fehl und fordert den Betreiber auf, `openclaw doctor --fix` auszuführen.
  </Accordion>
</AccordionGroup>

### Verzögertes vollständiges Laden

Kanal-Plugins können das verzögerte Laden aktivieren mit:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Wenn dies aktiviert ist, lädt OpenClaw während der Startphase vor dem Lauschen nur `setupEntry`, selbst bei bereits konfigurierten Kanälen. Der vollständige Einstiegspunkt wird geladen, nachdem der Gateway mit dem Lauschen begonnen hat.

<Warning>
Aktivieren Sie das verzögerte Laden nur, wenn Ihr `setupEntry` alles registriert, was der Gateway vor Beginn des Lauschens benötigt (Kanalregistrierung, HTTP-Routen, Gateway-Methoden). Wenn der vollständige Einstiegspunkt erforderliche Startfunktionen bereitstellt, behalten Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Einrichtungs-/vollständiger Einstiegspunkt Gateway-RPC-Methoden registriert, verwenden Sie dafür ein Plugin-spezifisches Präfix. Reservierte administrative Kern-Namensräume (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben im Besitz des Kerns und werden immer zu `operator.admin` normalisiert.

## Plugin-Manifest

Jedes native Plugin muss eine `openclaw.plugin.json` im Paketstamm bereitstellen. OpenClaw verwendet diese, um die Konfiguration zu validieren, ohne Plugin-Code auszuführen.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Fügen Sie bei Kanal-Plugins `channels` hinzu (und bei Provider-Plugins `providers`):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Auch Plugins ohne Konfiguration müssen ein Schema bereitstellen. Ein leeres Schema ist gültig:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Die vollständige Schemareferenz finden Sie unter [Plugin-Manifest](/de/plugins/manifest).

## Veröffentlichung auf ClawHub

Skills und Plugin-Pakete verwenden separate ClawHub-Veröffentlichungsbefehle. Verwenden Sie für Plugin-Pakete den paketspezifischen Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` ist ein anderer Befehl zur Veröffentlichung eines Skill-Ordners und nicht eines Plugin-Pakets. Siehe [Veröffentlichung auf ClawHub](/de/clawhub/publishing).
</Note>

## Einrichtungseinstiegspunkt

`setup-entry.ts` ist eine schlanke Alternative zu `index.ts`, die OpenClaw lädt, wenn nur Einrichtungsoberflächen benötigt werden (Onboarding, Konfigurationsreparatur, Prüfung deaktivierter Kanäle):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, während Einrichtungsabläufen umfangreichen Laufzeitcode zu laden (Kryptografiebibliotheken, CLI-Registrierungen, Hintergrunddienste).

Gebündelte Workspace-Kanäle, die einrichtungssichere Exporte in Sidecar-Modulen aufbewahren, können `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` anstelle von `defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Vertrag unterstützt außerdem einen optionalen `runtime`-Export, damit die Laufzeitverdrahtung während der Einrichtung schlank und explizit bleiben kann.

<AccordionGroup>
  <Accordion title="Wann OpenClaw setupEntry anstelle des vollständigen Einstiegspunkts verwendet">
    - Der Kanal ist deaktiviert, benötigt jedoch Einrichtungs-/Onboarding-Oberflächen.
    - Der Kanal ist aktiviert, aber nicht konfiguriert.
    - Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Was setupEntry registrieren muss">
    - Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`).
    - Alle vor dem Lauschen des Gateways erforderlichen HTTP-Routen.
    - Alle während des Starts benötigten Gateway-Methoden.

    Diese Gateway-Methoden für den Start sollten weiterhin reservierte administrative Kern-Namensräume wie `config.*` oder `update.*` vermeiden.

  </Accordion>
  <Accordion title="Was setupEntry NICHT enthalten sollte">
    - CLI-Registrierungen.
    - Hintergrunddienste.
    - Umfangreiche Laufzeitimporte (Kryptografie, SDKs).
    - Gateway-Methoden, die erst nach dem Start benötigt werden.

  </Accordion>
</AccordionGroup>

### Schmale Importe von Einrichtungshilfen

Bevorzugen Sie für häufig ausgeführte, reine Einrichtungspfade die schmalen Schnittstellen der Einrichtungshilfen gegenüber dem breiteren `plugin-sdk/setup`-Dach, wenn Sie nur einen Teil der Einrichtungsoberfläche benötigen:

| Importpfad                 | Verwendungszweck                                                                          | Wichtige Exporte                                                                                                                                                                                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | Laufzeithilfen für die Einrichtung, die in `setupEntry` / beim verzögerten Kanalstart verfügbar bleiben | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-tools`   | Hilfen für Einrichtungs-/Installations-CLI, Archive und Dokumentation                     | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Verwenden Sie die breitere `plugin-sdk/setup`-Schnittstelle, wenn Sie den vollständigen gemeinsamen Einrichtungswerkzeugkasten einschließlich Hilfen für Konfigurations-Patches wie `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen.

Verwenden Sie `createSetupTranslator(...)` für feste Texte des Einrichtungsassistenten. Es verwendet den ersten nicht leeren Wert aus `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES` und `LANG` in dieser Reihenfolge und greift anschließend auf Englisch zurück. Legen Sie `OPENCLAW_LOCALE=en` für eine explizite englische Überschreibung fest. Bewahren Sie Plugin-spezifische Einrichtungstexte im Plugin-eigenen Code auf und verwenden Sie gemeinsame Katalogschlüssel nur für allgemeine Einrichtungsbeschriftungen, Statustexte und Einrichtungstexte offizieller gebündelter Plugins.

Die Adapter für Einrichtungs-Patches bleiben beim Import für häufig ausgeführte Pfade sicher. Ihre Suche nach der gebündelten Vertragsoberfläche zur Hochstufung eines einzelnen Kontos erfolgt verzögert, sodass der Import von `plugin-sdk/setup-runtime` die Ermittlung der gebündelten Vertragsoberfläche nicht vorzeitig lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanaleigene Eingabefelder für die Einrichtung

`ChannelSetupInput` ist eine generische Hülle, die von Einrichtungsaufrufern und Kanal-
Plugins gemeinsam verwendet wird. Ihre dauerhaft typisierten Felder sind `name`, `token`, `tokenFile`,
`useEnv`, `allowFrom` und `defaultTo`. Zusätzliche Plugin-eigene Schlüssel können weiterhin
im Laufzeiteingabeobjekt vorhanden sein, der gemeinsame Typ deklariert jedoch keine
Indexsignatur. Jedes Plugin muss seine eigenen Einrichtungsfelder deklarieren und eingrenzen oder
sie mit einem Plugin-eigenen Schema an der Adaptergrenze validieren:

```typescript
import type { ChannelSetupAdapter, ChannelSetupInput } from "openclaw/plugin-sdk/channel-setup";

type AcmeSetupInput = ChannelSetupInput & {
  workspaceId?: string;
  webhookUrl?: string;
};

export const acmeSetupAdapter: ChannelSetupAdapter = {
  applyAccountConfig: ({ cfg, input }) => {
    const setupInput = input as AcmeSetupInput;
    return {
      ...cfg,
      channels: {
        ...cfg.channels,
        acme: {
          token: setupInput.token,
          workspaceId: setupInput.workspaceId,
          webhookUrl: setupInput.webhookUrl,
        },
      },
    };
  },
};
```

Kanalspezifische Felder, die zuvor direkt in
`ChannelSetupInput` deklariert wurden, bleiben vorübergehend für die Kompatibilität mit externem Quellcode typisiert.
Sie sind veraltet. Bei einer Registry-Prüfung am 2026-07-22 wurden von 426 veröffentlichten, außerhalb des Repositorys verwalteten
Channel-Plugins 21 Felder ohne lesende Zugriffe entfernt und 22 mit bekannten
lesenden Zugriffen beibehalten. Jedes beibehaltene Feld wird gelöscht, sobald kein veröffentlichtes Plugin mehr darauf lesend zugreift;
eine Versionsgrenze ist nicht erforderlich. Neue und gebündelte Plugins dürfen sich nicht auf diese
Ebene verlassen; deklarieren Sie die Felder, deren Eigentümer sie sind, lokal.

### Channel-eigene Hochstufung eines Einzelkontos

Wenn ein Channel von einer Top-Level-Konfiguration für ein Einzelkonto auf `channels.<id>.accounts.*` umgestellt wird, verschiebt das standardmäßige gemeinsame Verhalten hochgestufte kontobezogene Werte nach `accounts.default`.

Jedes Channel-Plugin kann diese Hochstufung über seinen Setup-Adapter erweitern oder einschränken:

- `singleAccountKeysToMove`: zusätzliche Top-Level-Schlüssel, die in das hochgestufte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn bereits benannte Konten vorhanden sind, werden nur diese Schlüssel in das hochgestufte Konto verschoben; gemeinsame Richtlinien-/Zustellungsschlüssel verbleiben im Channel-Stamm
- `resolveSingleAccountPromotionTarget(...)`: legt fest, welches bestehende Konto die hochgestuften Werte erhält

Das Vorhandensein von `singleAccountKeysToMove` kennzeichnet den Hochstufungsvertrag als vollständig. Deklarieren Sie das Feld auch dann, wenn es ein leeres Array ist, um die Hochstufung veralteter Schlüssel zu deaktivieren. Adapter, die das Feld auslassen, behalten für bereits veröffentlichte Plugins eine durch lesende Zugriffe belegte Hochstufungsebene aus der Zeit vor der Deklaration bei. Bei der Registry-Prüfung am 2026-07-22 wurden 23 Schlüssel ohne veröffentlichte abhängige Plugins entfernt und sechs allgemeine Schlüssel sowie der ausschließlich für das Setup verwendete Schlüssel `rooms` beibehalten. Jeder beibehaltene Schlüssel wird gelöscht, sobald seine veröffentlichten lesenden Zugriffe auf Deklarationen migriert wurden; eine Versionsgrenze ist nicht erforderlich.

Deklarieren Sie `openclaw.setupFeatures.configPromotion: true` im Paketmanifest des Plugins, wenn Doctor diese Deklarationen aus dem leichtgewichtigen gebündelten Setup-Artefakt laden muss. Die ausschließlich für das Setup vorgesehene Plugin-Oberfläche und das vollständige Channel-Plugin müssen dieselben Deklarationen bereitstellen.

Wenn Sie `moveSingleAccountChannelSectionToDefaultAccount(...)` mit einem bereits aufgelösten Plugin aufrufen, übergeben Sie dessen Setup-Adapter als `setupSurface`. Vom Aufrufer bereitgestellte Setup-Oberflächen haben Vorrang vor geladenen und gebündelten Suchmechanismen, wodurch bereichsgebundene oder ausschließlich für das Setup vorgesehene Plugins unabhängig von der globalen Registrierung bleiben.

<Note>
Matrix ist das aktuelle gebündelte Beispiel. Wenn bereits genau ein benanntes Matrix-Konto vorhanden ist oder wenn `defaultAccount` auf einen vorhandenen, nicht kanonischen Schlüssel wie `Ops` verweist, behält die Hochstufung dieses Konto bei, anstatt einen neuen Eintrag `accounts.default` zu erstellen.
</Note>

## Konfigurationsschema

Die Plugin-Konfiguration wird anhand des JSON-Schemas in Ihrem Manifest validiert. Benutzer konfigurieren Plugins über:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Ihr Plugin erhält diese Konfiguration während der Registrierung als `api.pluginConfig`.

Verwenden Sie für kanalspezifische Konfigurationen stattdessen den Abschnitt für die Channel-Konfiguration:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Channel-Konfigurationsschemas erstellen

Verwenden Sie `buildChannelConfigSchema`, um ein Zod-Schema in den von Plugin-eigenen Konfigurationsartefakten verwendeten Wrapper `ChannelConfigSchema` umzuwandeln:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Wenn Sie den Vertrag bereits als JSON-Schema oder TypeBox erstellen, verwenden Sie den direkten Helper, damit OpenClaw die Konvertierung von Zod zu JSON-Schema auf Metadatenpfaden überspringen kann:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

Für Drittanbieter-Plugins bleibt das Plugin-Manifest der Vertrag für den selten ausgeführten Pfad: Spiegeln Sie das generierte JSON-Schema nach `openclaw.plugin.json#channelConfigs`, damit Konfigurationsschema-, Setup- und UI-Oberflächen `channels.<id>` untersuchen können, ohne Laufzeitcode zu laden.

## Setup-Assistenten

Channel-Plugins können interaktive Setup-Assistenten für `openclaw onboard` bereitstellen. Der Assistent ist ein `ChannelSetupWizard`-Objekt auf `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Verbunden",
    unconfiguredLabel: "Nicht konfiguriert",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot-Token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "MY_CHANNEL_BOT_TOKEN aus der Umgebung verwenden?",
      keepPrompt: "Aktuelles Token beibehalten?",
      inputPrompt: "Geben Sie Ihr Bot-Token ein:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` unterstützt außerdem `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` und weitere. Ein vollständiges gebündeltes Beispiel finden Sie unter `src/setup-core.ts` des Discord-Plugins.

<AccordionGroup>
  <Accordion title="Gemeinsame allowFrom-Eingabeaufforderungen">
    Verwenden Sie für DM-Zulassungslisten-Eingabeaufforderungen, die nur den standardmäßigen Ablauf `note -> prompt -> parse -> merge -> patch` benötigen, vorzugsweise die gemeinsamen Setup-Helper aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)` und `createTopLevelChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardstatus für das Channel-Setup">
    Verwenden Sie für Statusblöcke des Channel-Setups, die sich nur durch Beschriftungen, Bewertungen und optionale zusätzliche Zeilen unterscheiden, vorzugsweise `createStandardChannelSetupStatus(...)` aus `openclaw/plugin-sdk/setup`, anstatt dasselbe `status`-Objekt in jedem Plugin manuell zu erstellen.
  </Accordion>
  <Accordion title="Optionale Channel-Setup-Oberfläche">
    Verwenden Sie für optionale Setup-Oberflächen, die nur in bestimmten Kontexten angezeigt werden sollen, `createOptionalChannelSetupSurface` aus `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "Mein Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Gibt { setupAdapter, setupWizard } zurück
    ```

    `plugin-sdk/channel-setup` stellt außerdem die grundlegenderen Builder `createOptionalChannelSetupAdapter(...)` und `createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte dieser Oberfläche für die optionale Installation benötigen.

    Der generierte optionale Adapter/Assistent verweigert bei tatsächlichen Konfigurationsschreibvorgängen standardmäßig den Vorgang. Er verwendet dieselbe Meldung zur erforderlichen Installation für `validateInput`, `applyAccountConfig` und `finalize` und fügt einen Dokumentationslink an, wenn `docsPath` gesetzt ist.

  </Accordion>
  <Accordion title="Binärdateibasierte Setup-Helper">
    Verwenden Sie für binärdateibasierte Setup-UIs vorzugsweise die gemeinsamen delegierten Helper, anstatt dieselbe Binärdatei-/Status-Verknüpfungslogik in jeden Channel zu kopieren:

    - `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur durch Beschriftungen, Hinweise, Bewertungen und die Erkennung von Binärdateien unterscheiden
    - `createCliPathTextInput(...)` für pfadbasierte Texteingaben
    - `createDelegatedSetupWizardProxy(...)`, wenn `setupEntry` Status-, Vorbereitungs- oder Abschlussverhalten verzögert an einen umfangreicheren vollständigen Assistenten weiterleiten muss
    - `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur eine `textInputs[*].shouldPrompt`-Entscheidung delegieren muss

  </Accordion>
</AccordionGroup>

## Veröffentlichen und installieren

**Externe Plugins:** Veröffentlichen Sie sie auf [ClawHub](/clawhub) und installieren Sie sie anschließend:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Reine Paketspezifikationen werden während der Startumstellung von npm installiert, sofern der Name nicht mit der ID eines gebündelten oder offiziellen Plugins übereinstimmt; in diesem Fall verwendet OpenClaw stattdessen diese lokale/offizielle Kopie. Verwenden Sie `clawhub:`, `npm:`, `git:` oder `npm-pack:` für eine deterministische Quellenauswahl – siehe [Plugins verwalten](/de/plugins/manage-plugins).

  </Tab>
  <Tab title="Nur ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm-Paketspezifikation">
    Verwenden Sie npm, wenn ein Paket noch nicht zu ClawHub verschoben wurde oder wenn Sie während der
    Migration einen direkten npm-Installationspfad benötigen:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Repository-interne Plugins:** Legen Sie sie im Workspace-Baum der gebündelten Plugins ab; sie werden während des Builds automatisch erkannt.

<Info>
Bei Installationen aus npm installiert `openclaw plugins install` das Paket in einem projektspezifischen Verzeichnis pro Plugin unter `~/.openclaw/npm/projects`, wobei Lebenszyklusskripte deaktiviert sind (`--ignore-scripts`). Halten Sie Plugin-Abhängigkeitsbäume auf reines JS/TS beschränkt und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

<Note>
Beim Start des Gateways werden keine Plugin-Abhängigkeiten installiert. Die Installationsabläufe für npm/git/ClawHub sind für die Konvergenz der Abhängigkeiten verantwortlich; bei lokalen Plugins müssen die Abhängigkeiten bereits installiert sein.
</Note>

Die Metadaten gebündelter Pakete sind explizit und werden beim Start des Gateways nicht aus dem erstellten JavaScript abgeleitet. Laufzeitabhängigkeiten gehören in das Plugin-Paket, das ihr Eigentümer ist; der Start des paketierten OpenClaw repariert oder spiegelt Plugin-Abhängigkeiten niemals.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) – Schritt-für-Schritt-Anleitung für den Einstieg
- [Plugin-Manifest](/de/plugins/manifest) – vollständige Referenz des Manifestschemas
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) – `definePluginEntry` und `defineChannelPluginEntry`
