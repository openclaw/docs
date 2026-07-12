---
read_when:
    - Sie fügen einem Plugin einen Einrichtungsassistenten hinzu
    - Sie müssen den Unterschied zwischen setup-entry.ts und index.ts verstehen.
    - Sie definieren Plugin-Konfigurationsschemata oder OpenClaw-Metadaten in package.json
sidebarTitle: Setup and config
summary: Einrichtungsassistenten, setup-entry.ts, Konfigurationsschemas und package.json-Metadaten
title: Plugin-Einrichtung und -Konfiguration
x-i18n:
    generated_at: "2026-07-12T02:01:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referenz für die Plugin-Paketierung (`package.json`-Metadaten), Manifeste (`openclaw.plugin.json`), Einrichtungseinstiegspunkte und Konfigurationsschemas.

<Tip>
**Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Die Anleitungen behandeln die Paketierung im jeweiligen Kontext: [Kanal-Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paketmetadaten

Ihre `package.json` benötigt ein `openclaw`-Feld, das dem Plugin-System mitteilt, was Ihr Plugin bereitstellt:

<Tabs>
  <Tab title="Kanal-Plugin">
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
          "label": "My Channel",
          "blurb": "Short description of the channel."
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
Für die externe Veröffentlichung auf ClawHub sind `compat` und `build` erforderlich. Maßgebliche Veröffentlichungsausschnitte befinden sich in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-Felder

<ParamField path="extensions" type="string[]">
  Einstiegspunktdateien (relativ zum Paketstammverzeichnis). Gültige Quelleinstiegspunkte für die Entwicklung im Workspace und in Git-Checkouts.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Erstellte JavaScript-Entsprechungen für `extensions`, die bevorzugt werden, wenn OpenClaw ein installiertes npm-Paket lädt. Die Auflösungsreihenfolge für Quell- und erstellte Dateien finden Sie unter [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints).
</ParamField>
<ParamField path="setupEntry" type="string">
  Leichtgewichtiger Einstiegspunkt ausschließlich für die Einrichtung (optional).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Erstellte JavaScript-Entsprechung für `setupEntry`. Erfordert, dass auch `setupEntry` festgelegt ist.
</ParamField>
<ParamField path="plugin" type="object">
  Ersatzidentität des Plugins in Form von `{ id, label }`, die verwendet wird, wenn ein Plugin keine Kanal- oder Provider-Metadaten besitzt, aus denen eine ID oder Bezeichnung abgeleitet werden kann.
</ParamField>
<ParamField path="channel" type="object">
  Metadaten des Kanalkatalogs für Einrichtung, Auswahl, Schnellstart und Statusansichten.
</ParamField>
<ParamField path="install" type="object">
  Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Optionen für das Startverhalten.
</ParamField>
<ParamField path="compat" type="object">
  Von diesem Plugin unterstützter Versionsbereich für `pluginApi`. Für externe Veröffentlichungen auf ClawHub erforderlich.
</ParamField>

<Note>
Provider-IDs (`providers: string[]`) sind Manifestmetadaten, keine Paketmetadaten. Deklarieren Sie sie in `openclaw.plugin.json`, nicht hier – siehe [Plugin-Manifest](/de/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` enthält leichtgewichtige Paketmetadaten für die Kanalerkennung und Einrichtungsansichten, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                                                               |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                                                                    |
| `label`                                | `string`   | Primäre Kanalbezeichnung.                                                                                               |
| `selectionLabel`                       | `string`   | Bezeichnung in Auswahl und Einrichtung, wenn sie von `label` abweichen soll.                                            |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für umfangreichere Kanalkataloge und Statusansichten.                                        |
| `docsPath`                             | `string`   | Dokumentationspfad für Einrichtungs- und Auswahllinks.                                                                  |
| `docsLabel`                            | `string`   | Abweichende Bezeichnung für Dokumentationslinks, wenn sie sich von der Kanal-ID unterscheiden soll.                     |
| `blurb`                                | `string`   | Kurze Beschreibung für Ersteinrichtung und Katalog.                                                                     |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                                                                   |
| `aliases`                              | `string[]` | Zusätzliche Suchaliase für die Kanalauswahl.                                                                            |
| `preferOver`                           | `string[]` | IDs von Plugins oder Kanälen niedrigerer Priorität, die dieser Kanal übertreffen soll.                                   |
| `systemImage`                          | `string`   | Optionaler Name eines Symbols oder Systembilds für Kanalkataloge der Benutzeroberfläche.                                |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Dokumentationslinks in Auswahlansichten.                                                                 |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt in Auswahltexten den Dokumentationspfad direkt statt eines beschrifteten Dokumentationslinks an.                  |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Zeichenfolgen, die an Auswahltexte angehängt werden.                                                   |
| `markdownCapable`                      | `boolean`  | Kennzeichnet den Kanal für Entscheidungen zur ausgehenden Formatierung als Markdown-fähig.                              |
| `exposure`                             | `object`   | Steuert die Sichtbarkeit des Kanals in der Einrichtung, in Listen konfigurierter Kanäle und in Dokumentationsansichten. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Kanal in den standardmäßigen `allowFrom`-Einrichtungsablauf des Schnellstarts auf.                          |
| `forceAccountBinding`                  | `boolean`  | Erfordert eine explizite Kontobindung, selbst wenn nur ein Konto vorhanden ist.                                         |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt beim Auflösen von Ankündigungszielen für diesen Kanal die Sitzungssuche.                                       |

Beispiel:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
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

- `configured`: nimmt den Kanal in Auflistungsansichten für konfigurierte Kanäle und Status auf
- `setup`: nimmt den Kanal in interaktive Auswahlansichten für Einrichtung und Konfiguration auf
- `docs`: kennzeichnet den Kanal in Dokumentations- und Navigationsansichten als öffentlich sichtbar

<Note>
`showConfigured` und `showInSetup` werden weiterhin als veraltete Aliase unterstützt. Bevorzugen Sie `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` enthält Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                                 | Bedeutung                                                                                                         |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kanonische ClawHub-Spezifikation für Installation, Aktualisierung und bedarfsgesteuerte Installation beim Einstieg. |
| `npmSpec`                    | `string`                            | Kanonische npm-Spezifikation für ersatzweise Installations- und Aktualisierungsabläufe.                           |
| `localPath`                  | `string`                            | Lokaler Entwicklungs- oder gebündelter Installationspfad.                                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn mehrere Quellen verfügbar sind.                                              |
| `minHostVersion`             | `string`                            | Mindestens unterstützte OpenClaw-Version, `>=x.y.z` oder `>=x.y.z-prerelease`.                                    |
| `expectedIntegrity`          | `string`                            | Erwartete npm-Integritätszeichenfolge der Distribution, üblicherweise `sha512-...`, für festgeschriebene Installationen. |
| `allowInvalidConfigRecovery` | `boolean`                           | Ermöglicht Abläufen zur Neuinstallation gebündelter Plugins die Wiederherstellung bei bestimmten Fehlern durch veraltete Konfigurationen. |
| `requiredPlatformPackages`   | `string[]`                          | Erforderliche plattformspezifische npm-Aliase, die während der npm-Installation überprüft werden.                 |

<AccordionGroup>
  <Accordion title="Verhalten bei der Ersteinrichtung">
    Die interaktive Ersteinrichtung verwendet `openclaw.install` für bedarfsgesteuerte Installationsansichten: Wenn Ihr Plugin Provider-Authentifizierungsoptionen oder Metadaten für Kanaleinrichtung und -katalog bereitstellt, bevor die Laufzeit geladen wird, kann die Ersteinrichtung zur Installation über ClawHub, npm oder einen lokalen Pfad auffordern, das Plugin installieren oder aktivieren und anschließend mit dem ausgewählten Ablauf fortfahren. ClawHub-Optionen verwenden `clawhubSpec` und werden bevorzugt, wenn sie vorhanden sind; npm-Optionen erfordern vertrauenswürdige Katalogmetadaten mit einer `npmSpec` aus der Registry (exakte Versionen und `expectedIntegrity` sind optionale Festschreibungen, die bei Installation und Aktualisierung durchgesetzt werden, wenn sie festgelegt sind). Halten Sie „was angezeigt werden soll“ in `openclaw.plugin.json` und „wie es installiert wird“ in `package.json`.
  </Accordion>
  <Accordion title="Durchsetzung von minHostVersion">
    Wenn `minHostVersion` festgelegt ist, wird sie sowohl bei der Installation als auch beim Laden der Manifest-Registry für nicht gebündelte Plugins durchgesetzt. Ältere Hosts überspringen externe Plugins; ungültige Versionszeichenfolgen werden abgelehnt. Bei gebündelten Quell-Plugins wird davon ausgegangen, dass sie dieselbe Version wie der Host-Checkout haben.
  </Accordion>
  <Accordion title="Festgeschriebene npm-Installationen">
    Behalten Sie für festgeschriebene npm-Installationen die exakte Version in `npmSpec` bei und fügen Sie die erwartete Artefaktintegrität hinzu:

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
    `allowInvalidConfigRecovery` ist keine allgemeine Umgehung für fehlerhafte Konfigurationen. Die Option dient ausschließlich der eng begrenzten Wiederherstellung gebündelter Plugins und ermöglicht es der Neuinstallation oder Einrichtung, bekannte Überbleibsel von Aktualisierungen zu reparieren, etwa einen fehlenden Pfad zu einem gebündelten Plugin oder einen veralteten `channels.<id>`-Eintrag für dasselbe Plugin. Ist die Konfiguration aus anderen Gründen fehlerhaft, schlägt die Installation weiterhin sicher fehl und fordert den Betreiber auf, `openclaw doctor --fix` auszuführen.
  </Accordion>
</AccordionGroup>

### Verzögertes vollständiges Laden

Kanal-Plugins können das verzögerte Laden mit folgender Konfiguration aktivieren:

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

Wenn diese Option aktiviert ist, lädt OpenClaw während der Startphase vor dem Lauschen ausschließlich `setupEntry`, auch bei bereits konfigurierten Kanälen. Der vollständige Einstiegspunkt wird geladen, nachdem das Gateway mit dem Lauschen begonnen hat.

<Warning>
Aktivieren Sie das verzögerte Laden nur, wenn Ihr `setupEntry` alles registriert, was das Gateway vor dem Lauschen benötigt (Kanalregistrierung, HTTP-Routen, Gateway-Methoden). Wenn der vollständige Einstiegspunkt erforderliche Startfunktionen bereitstellt, behalten Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Einrichtungs- oder vollständiger Einstiegspunkt Gateway-RPC-Methoden registriert, verwenden Sie dafür ein Plugin-spezifisches Präfix. Reservierte administrative Kern-Namensräume (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben Eigentum des Kerns und werden immer zu `operator.admin` normalisiert.

## Plugin-Manifest

Jedes native Plugin muss eine `openclaw.plugin.json` im Stammverzeichnis des Pakets mitliefern. OpenClaw verwendet diese Datei, um die Konfiguration zu validieren, ohne Plugin-Code auszuführen.

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

Fügen Sie für Kanal-Plugins `channels` hinzu (Provider-Plugins entsprechend `providers`):

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

Auch Plugins ohne Konfiguration müssen ein Schema mitliefern. Ein leeres Schema ist gültig:

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

Skills und Plugin-Pakete verwenden separate ClawHub-Befehle zur Veröffentlichung. Verwenden Sie für Plugin-Pakete den paketspezifischen Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` ist ein anderer Befehl zur Veröffentlichung eines Skill-Ordners, nicht eines Plugin-Pakets. Weitere Informationen finden Sie unter [Veröffentlichung auf ClawHub](/de/clawhub/publishing).
</Note>

## Setup-Einstiegspunkt

`setup-entry.ts` ist eine schlanke Alternative zu `index.ts`, die OpenClaw lädt, wenn nur Setup-Oberflächen benötigt werden (Onboarding, Konfigurationsreparatur, Prüfung deaktivierter Kanäle):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, dass umfangreicher Laufzeitcode (Kryptografiebibliotheken, CLI-Registrierungen, Hintergrunddienste) während der Setup-Abläufe geladen wird.

Gebündelte Workspace-Kanäle, die Setup-sichere Exporte in Sidecar-Modulen vorhalten, können `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` anstelle von `defineSetupPluginEntry(...)` verwenden. Dieser Vertrag für gebündelte Plugins unterstützt außerdem einen optionalen `runtime`-Export, sodass die Laufzeitverdrahtung während des Setups schlank und explizit bleiben kann.

<AccordionGroup>
  <Accordion title="Wann OpenClaw setupEntry anstelle des vollständigen Einstiegspunkts verwendet">
    - Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen.
    - Der Kanal ist aktiviert, aber nicht konfiguriert.
    - Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Was setupEntry registrieren muss">
    - Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`).
    - Alle HTTP-Routen, die vor dem Lauschen des Gateway erforderlich sind.
    - Alle Gateway-Methoden, die während des Starts benötigt werden.

    Diese beim Start verwendeten Gateway-Methoden sollten weiterhin reservierte administrative Kern-Namensräume wie `config.*` oder `update.*` vermeiden.

  </Accordion>
  <Accordion title="Was setupEntry NICHT enthalten sollte">
    - CLI-Registrierungen.
    - Hintergrunddienste.
    - Umfangreiche Laufzeitimporte (Kryptografie, SDKs).
    - Gateway-Methoden, die erst nach dem Start benötigt werden.

  </Accordion>
</AccordionGroup>

### Schmale Importe für Setup-Hilfsfunktionen

Bevorzugen Sie für häufig durchlaufene, ausschließlich dem Setup dienende Pfade die schmalen Schnittstellen für Setup-Hilfsfunktionen gegenüber dem umfassenderen `plugin-sdk/setup`, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                         | Verwendungszweck                                                                          | Wichtige Exporte                                                                                                                                                                                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Laufzeithilfen für das Setup, die in `setupEntry` bzw. beim verzögerten Kanalstart verfügbar bleiben | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime`                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | Hilfsfunktionen für Setup-/Installations-CLI, Archive und Dokumentation                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Verwenden Sie die umfassendere Schnittstelle `plugin-sdk/setup`, wenn Sie den vollständigen gemeinsamen Setup-Werkzeugkasten einschließlich Hilfsfunktionen für Konfigurationsänderungen wie `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen.

Verwenden Sie `createSetupTranslator(...)` für feste Texte des Setup-Assistenten. Die Funktion richtet sich nach dem Gebietsschema des CLI-Assistenten (`OPENCLAW_LOCALE`, danach die Gebietsschemavariablen des Systems) und greift ersatzweise auf Englisch zurück. Belassen Sie Plugin-spezifische Setup-Texte im Plugin-eigenen Code und verwenden Sie gemeinsame Katalogschlüssel nur für allgemeine Setup-Bezeichnungen, Statustexte und Setup-Texte offizieller gebündelter Plugins.

Die Adapter für Setup-Änderungen bleiben beim Import für häufig durchlaufene Pfade geeignet. Die Suche nach der Vertragsoberfläche für die gebündelte Überführung eines Einzelkontos erfolgt verzögert. Daher lädt der Import von `plugin-sdk/setup-runtime` die Erkennung gebündelter Vertragsoberflächen nicht vorzeitig, bevor der Adapter tatsächlich verwendet wird.

### Kanaleigene Überführung eines Einzelkontos

Wenn ein Kanal von einer Einzelkonto-Konfiguration auf oberster Ebene auf `channels.<id>.accounts.*` aktualisiert wird, verschiebt das gemeinsame Standardverhalten die überführten kontobezogenen Werte nach `accounts.default`.

Gebündelte Kanäle können diese Überführung über ihre Setup-Vertragsoberfläche einschränken oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Schlüssel auf oberster Ebene, die in das überführte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: Wenn bereits benannte Konten vorhanden sind, werden nur diese Schlüssel in das überführte Konto verschoben; gemeinsame Richtlinien-/Zustellungsschlüssel verbleiben im Stamm des Kanals
- `resolveSingleAccountPromotionTarget(...)`: legt fest, welches vorhandene Konto die überführten Werte erhält

<Note>
Matrix ist das aktuelle gebündelte Beispiel. Wenn bereits genau ein benanntes Matrix-Konto vorhanden ist oder `defaultAccount` auf einen vorhandenen nicht kanonischen Schlüssel wie `Ops` verweist, behält die Überführung dieses Konto bei, anstatt einen neuen Eintrag `accounts.default` zu erstellen.
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

Verwenden Sie für kanalspezifische Konfigurationen stattdessen den Abschnitt für die Kanalkonfiguration:

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

### Kanalkonfigurationsschemas erstellen

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

Wenn Sie den Vertrag bereits als JSON-Schema oder TypeBox definieren, verwenden Sie die direkte Hilfsfunktion, damit OpenClaw die Konvertierung von Zod in JSON-Schema in Metadatenpfaden überspringen kann:

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

Für Plugins von Drittanbietern bleibt das Plugin-Manifest der Vertrag für selten durchlaufene Pfade: Übernehmen Sie das generierte JSON-Schema nach `openclaw.plugin.json#channelConfigs`, damit Konfigurationsschema-, Setup- und UI-Oberflächen `channels.<id>` prüfen können, ohne Laufzeitcode zu laden.

## Setup-Assistenten

Kanal-Plugins können interaktive Setup-Assistenten für `openclaw onboard` bereitstellen. Der Assistent ist ein `ChannelSetupWizard`-Objekt im `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
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

`ChannelSetupWizard` unterstützt außerdem `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` und weitere Eigenschaften. Ein vollständiges gebündeltes Beispiel finden Sie in `src/setup-core.ts` des Discord-Plugins.

<AccordionGroup>
  <Accordion title="Gemeinsame allowFrom-Eingabeaufforderungen">
    Bevorzugen Sie für Eingabeaufforderungen zu DM-Zulassungslisten, die nur den Standardablauf `note -> prompt -> parse -> merge -> patch` benötigen, die gemeinsamen Setup-Hilfsfunktionen aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` und `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardstatus für die Kanaleinrichtung">
    Bevorzugen Sie für Statusblöcke zur Kanaleinrichtung, die sich nur in Bezeichnungen, Bewertungen und optionalen zusätzlichen Zeilen unterscheiden, `createStandardChannelSetupStatus(...)` aus `openclaw/plugin-sdk/setup`, anstatt dasselbe `status`-Objekt in jedem Plugin manuell zu erstellen.
  </Accordion>
  <Accordion title="Optionale Oberfläche für die Kanaleinrichtung">
    Verwenden Sie für optionale Setup-Oberflächen, die nur in bestimmten Kontexten angezeigt werden sollen, `createOptionalChannelSetupSurface` aus `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Returns { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` stellt außerdem die grundlegenderen Builder `createOptionalChannelSetupAdapter(...)` und `createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte dieser Oberfläche für die optionale Installation benötigen.

    Der generierte optionale Adapter/Assistent schlägt bei tatsächlichen Konfigurationsschreibvorgängen sicher fehl. Er verwendet dieselbe Meldung zur erforderlichen Installation für `validateInput`, `applyAccountConfig` und `finalize` und hängt einen Link zur Dokumentation an, wenn `docsPath` festgelegt ist.

  </Accordion>
  <Accordion title="Einrichtungshilfen mit Binärdatei-Unterstützung">
    Bevorzugen Sie für binärdateibasierte Einrichtungsoberflächen die gemeinsam genutzten delegierten Hilfsfunktionen, anstatt denselben Code für Binärdateien und Status in jeden Kanal zu kopieren:

    - `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur durch Beschriftungen, Hinweise, Bewertungen und Binärdateierkennung unterscheiden
    - `createCliPathTextInput(...)` für pfadbasierte Texteingaben
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und `createDelegatedResolveConfigured(...)`, wenn `setupEntry` bei Bedarf verzögert an einen umfangreicheren vollständigen Assistenten weiterleiten muss
    - `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` lediglich die Entscheidung für `textInputs[*].shouldPrompt` delegieren muss

  </Accordion>
</AccordionGroup>

## Veröffentlichen und Installieren

**Externe Plugins:** Veröffentlichen Sie sie auf [ClawHub](/de/clawhub) und installieren Sie sie anschließend:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Reine Paketspezifikationen werden während der Umstellung beim Start von npm installiert, sofern der Name nicht mit der ID eines mitgelieferten oder offiziellen Plugins übereinstimmt. In diesem Fall verwendet OpenClaw stattdessen die lokale beziehungsweise offizielle Kopie. Verwenden Sie `clawhub:`, `npm:`, `git:` oder `npm-pack:` für eine deterministische Quellenauswahl – siehe [Plugins verwalten](/de/plugins/manage-plugins).

  </Tab>
  <Tab title="Nur ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm-Paketspezifikation">
    Verwenden Sie npm, wenn ein Paket noch nicht zu ClawHub verschoben wurde oder Sie während der Migration einen direkten npm-Installationspfad benötigen:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Repository-interne Plugins:** Legen Sie sie im Workspace-Baum der mitgelieferten Plugins ab; sie werden während des Builds automatisch erkannt.

<Info>
Bei Installationen aus npm installiert `openclaw plugins install` das Paket in einem projektspezifischen Plugin-Projekt unter `~/.openclaw/npm/projects`, wobei Lebenszyklusskripte deaktiviert sind (`--ignore-scripts`). Halten Sie die Abhängigkeitsbäume von Plugins auf reines JS/TS beschränkt und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

<Note>
Beim Start des Gateways werden keine Plugin-Abhängigkeiten installiert. Die Installationsabläufe für npm, Git und ClawHub sind für die Auflösung der Abhängigkeiten zuständig; bei lokalen Plugins müssen die Abhängigkeiten bereits installiert sein.
</Note>

Die Metadaten mitgelieferter Pakete werden explizit angegeben und beim Start des Gateways nicht aus dem erstellten JavaScript abgeleitet. Laufzeitabhängigkeiten gehören in das Plugin-Paket, das für sie zuständig ist; der Start einer paketierten OpenClaw-Installation repariert oder spiegelt niemals Plugin-Abhängigkeiten.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) – Schritt-für-Schritt-Anleitung für den Einstieg
- [Plugin-Manifest](/de/plugins/manifest) – vollständige Referenz des Manifest-Schemas
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) – `definePluginEntry` und `defineChannelPluginEntry`
