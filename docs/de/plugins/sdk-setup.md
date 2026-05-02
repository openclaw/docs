---
read_when:
    - Sie fügen einem Plugin einen Einrichtungsassistenten hinzu
    - Sie müssen den Unterschied zwischen setup-entry.ts und index.ts verstehen.
    - Sie definieren Plugin-Konfigurationsschemas oder openclaw-Metadaten in package.json
sidebarTitle: Setup and config
summary: Einrichtungsassistenten, setup-entry.ts, Konfigurationsschemata und package.json-Metadaten
title: Plugin-Einrichtung und Konfiguration
x-i18n:
    generated_at: "2026-05-02T21:01:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste (`openclaw.plugin.json`), Setup-Einträge und Konfigurationsschemata.

<Tip>
**Suchen Sie eine Schritt-für-Schritt-Anleitung?** Die How-to-Anleitungen behandeln die Paketierung im Kontext: [Kanal-Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paketmetadaten

Ihre `package.json` benötigt ein `openclaw`-Feld, das dem Plugin-System mitteilt, was Ihr Plugin bereitstellt:

<Tabs>
  <Tab title="Channel plugin">
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
  <Tab title="Provider plugin / ClawHub baseline">
    ```json openclaw-clawhub-package.json
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
  </Tab>
</Tabs>

<Note>
Wenn Sie das Plugin extern auf ClawHub veröffentlichen, sind diese Felder `compat` und `build` erforderlich. Die kanonischen Veröffentlichungs-Snippets befinden sich in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-Felder

<ParamField path="extensions" type="string[]">
  Einstiegspunktdateien (relativ zum Paketstamm).
</ParamField>
<ParamField path="setupEntry" type="string">
  Leichter, nur für das Setup vorgesehener Eintrag (optional).
</ParamField>
<ParamField path="channel" type="object">
  Kanal-Katalogmetadaten für Setup-, Auswahl-, Schnellstart- und Statusoberflächen.
</ParamField>
<ParamField path="providers" type="string[]">
  Provider-IDs, die von diesem Plugin registriert werden.
</ParamField>
<ParamField path="install" type="object">
  Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flags für das Startverhalten.
</ParamField>

### `openclaw.channel`

`openclaw.channel` sind schlanke Paketmetadaten für die Kanalermittlung und Setup-Oberflächen, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                          |
| `label`                                | `string`   | Primäre Kanalbezeichnung.                                                     |
| `selectionLabel`                       | `string`   | Auswahl-/Setup-Bezeichnung, wenn sie sich von `label` unterscheiden soll.     |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für umfangreichere Kanalkataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Dokumentationspfad für Setup- und Auswahllinks.                               |
| `docsLabel`                            | `string`   | Überschreibende Bezeichnung für Dokumentationslinks, wenn sie sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Onboarding-/Katalogbeschreibung.                                        |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                         |
| `aliases`                              | `string[]` | Zusätzliche Suchaliase für die Kanalauswahl.                                  |
| `preferOver`                           | `string[]` | Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Kanal übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Symbol-/Systembildname für Kanal-UI-Kataloge.                      |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Dokumentationslinks in Auswahloberflächen.                     |
| `selectionDocsOmitLabel`               | `boolean`  | Den Dokumentationspfad in Auswahltexten direkt anzeigen statt eines beschrifteten Dokumentationslinks. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Zeichenfolgen, die im Auswahltext angehängt werden.         |
| `markdownCapable`                      | `boolean`  | Kennzeichnet den Kanal als Markdown-fähig für ausgehende Formatierungsentscheidungen. |
| `exposure`                             | `object`   | Steuerelemente für die Sichtbarkeit des Kanals in Setup-, konfigurierten Listen- und Dokumentationsoberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Diesen Kanal für den Standard-Schnellstart-Setup-Flow `allowFrom` aktivieren. |
| `forceAccountBinding`                  | `boolean`  | Explizite Kontobindung erzwingen, auch wenn nur ein Konto existiert.          |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Sitzungssuche beim Auflösen von Ankündigungszielen für diesen Kanal bevorzugen. |

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

- `configured`: den Kanal in konfigurierten/statusartigen Listenoberflächen aufnehmen
- `setup`: den Kanal in interaktive Setup-/Konfigurationsauswahlen aufnehmen
- `docs`: den Kanal in Dokumentations-/Navigationsoberflächen als öffentlich sichtbar markieren

<Note>
`showConfigured` und `showInSetup` werden weiterhin als Legacy-Aliase unterstützt. Bevorzugen Sie `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                                 | Bedeutung                                                                         |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kanonische ClawHub-Spezifikation für Installations-/Update- und Onboarding-Install-on-Demand-Flows. |
| `npmSpec`                    | `string`                            | Kanonische npm-Spezifikation für Fallback-Flows bei Installation/Update.          |
| `localPath`                  | `string`                            | Lokaler Entwicklungs- oder gebündelter Installationspfad.                         |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn mehrere Quellen verfügbar sind.              |
| `minHostVersion`             | `string`                            | Unterstützte Mindestversion von OpenClaw im Format `>=x.y.z` oder `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Erwarteter npm-Dist-Integritätsstring, üblicherweise `sha512-...`, für gepinnte Installationen. |
| `allowInvalidConfigRecovery` | `boolean`                           | Ermöglicht gebündelten Plugin-Neuinstallations-Flows die Wiederherstellung nach bestimmten veralteten Konfigurationsfehlern. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interaktives Onboarding verwendet `openclaw.install` ebenfalls für Install-on-Demand-Oberflächen. Wenn Ihr Plugin Provider-Authentifizierungsoptionen oder Kanal-Setup-/Katalogmetadaten bereitstellt, bevor die Laufzeit geladen wird, kann Onboarding diese Auswahl anzeigen, nach ClawHub-, npm- oder lokaler Installation fragen, das Plugin installieren oder aktivieren und anschließend den ausgewählten Flow fortsetzen. ClawHub-Onboarding-Auswahlen verwenden `clawhubSpec` und werden bevorzugt, wenn vorhanden; npm-Auswahlen erfordern vertrauenswürdige Katalogmetadaten mit einer Registry-`npmSpec`; exakte Versionen und `expectedIntegrity` sind optionale npm-Pins. Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Flows diese für npm. Halten Sie die Metadaten dazu, „was angezeigt werden soll“, in `openclaw.plugin.json` und die Metadaten dazu, „wie es installiert wird“, in `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Wenn `minHostVersion` gesetzt ist, erzwingen sowohl Installation als auch das Laden der Manifest-Registry für nicht gebündelte Plugins diese Vorgabe. Ältere Hosts überspringen externe Plugins; ungültige Versionszeichenfolgen werden abgelehnt. Gebündelte Quell-Plugins werden als gemeinsam mit dem Host-Checkout versioniert angenommen.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Behalten Sie für gepinnte npm-Installationen die exakte Version in `npmSpec` bei und fügen Sie die erwartete Artefaktintegrität hinzu:

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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` ist kein allgemeiner Bypass für fehlerhafte Konfigurationen. Es ist nur für eng begrenzte Wiederherstellung bei gebündelten Plugins gedacht, damit Neuinstallation/Setup bekannte Upgrade-Reste wie einen fehlenden Pfad zu einem gebündelten Plugin oder einen veralteten `channels.<id>`-Eintrag für dasselbe Plugin reparieren kann. Wenn die Konfiguration aus anderen Gründen fehlerhaft ist, schlägt die Installation weiterhin geschlossen fehl und weist den Operator an, `openclaw doctor --fix` auszuführen.
  </Accordion>
</AccordionGroup>

### Verzögertes vollständiges Laden

Kanal-Plugins können verzögertes Laden aktivieren mit:

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

Wenn aktiviert, lädt OpenClaw während der Startphase vor dem Lauschen nur `setupEntry`, auch für bereits konfigurierte Kanäle. Der vollständige Eintrag wird geladen, nachdem der Gateway mit dem Lauschen begonnen hat.

<Warning>
Aktivieren Sie verzögertes Laden nur, wenn Ihr `setupEntry` alles registriert, was der Gateway benötigt, bevor er mit dem Lauschen beginnt (Kanalregistrierung, HTTP-Routen, Gateway-Methoden). Wenn der vollständige Eintrag erforderliche Startfunktionen besitzt, behalten Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/vollständiger Eintrag Gateway-RPC-Methoden registriert, behalten Sie sie unter einem Plugin-spezifischen Präfix. Reservierte Core-Admin-Namensräume (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben Core-eigen und werden immer zu `operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss ein `openclaw.plugin.json` im Paketstamm ausliefern. OpenClaw verwendet es, um die Konfiguration zu validieren, ohne Plugin-Code auszuführen.

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

Fügen Sie für Kanal-Plugins `kind` und `channels` hinzu:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Auch Plugins ohne Konfiguration müssen ein Schema ausliefern. Ein leeres Schema ist gültig:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Siehe [Plugin-Manifest](/de/plugins/manifest) für die vollständige Schemareferenz.

## ClawHub-Veröffentlichung

Verwenden Sie für Plugin-Pakete den paketspezifischen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Der Legacy-Veröffentlichungsalias nur für Skills ist für Skills gedacht. Plugin-Pakete sollten immer `clawhub package publish` verwenden.
</Note>

## Setup-Einstieg

Die Datei `setup-entry.ts` ist eine schlanke Alternative zu `index.ts`, die OpenClaw lädt, wenn nur Setup-Oberflächen benötigt werden (Onboarding, Konfigurationsreparatur, Prüfung deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, dass während Setup-Abläufen umfangreicher Laufzeitcode geladen wird (Kryptobibliotheken, CLI-Registrierungen, Hintergrunddienste).

Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Modulen halten, können `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` anstelle von `defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Contract unterstützt außerdem einen optionalen `runtime`-Export, damit die Laufzeitverdrahtung zur Setup-Zeit schlank und explizit bleiben kann.

<AccordionGroup>
  <Accordion title="Wann OpenClaw setupEntry anstelle des vollständigen Eintrags verwendet">
    - Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen.
    - Der Kanal ist aktiviert, aber nicht konfiguriert.
    - Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Was setupEntry registrieren muss">
    - Das Channel-Plugin-Objekt (über `defineSetupPluginEntry`).
    - Alle HTTP-Routen, die vor dem Gateway-Listen erforderlich sind.
    - Alle Gateway-Methoden, die während des Starts benötigt werden.

    Diese Gateway-Methoden beim Start sollten weiterhin reservierte Core-Admin-Namespaces wie `config.*` oder `update.*` vermeiden.

  </Accordion>
  <Accordion title="Was setupEntry NICHT enthalten sollte">
    - CLI-Registrierungen.
    - Hintergrunddienste.
    - Umfangreiche Laufzeitimporte (Krypto, SDKs).
    - Gateway-Methoden, die erst nach dem Start benötigt werden.

  </Accordion>
</AccordionGroup>

### Enge Setup-Helferimporte

Für heiße reine Setup-Pfade sollten Sie die engen Setup-Helfer-Schnittstellen gegenüber dem breiteren Umbrella `plugin-sdk/setup` bevorzugen, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                        | Dafür verwenden                                                                                | Wichtige Exporte                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Laufzeithelfer zur Setup-Zeit, die in `setupEntry` / beim verzögerten Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Adapter für Konto-Setup                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | Setup-/Installations-CLI-/Archiv-/Dokumentationshelfer                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Verwenden Sie die breitere Schnittstelle `plugin-sdk/setup`, wenn Sie die vollständige gemeinsame Setup-Toolbox benötigen, einschließlich Konfigurations-Patch-Helfern wie `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import für heiße Pfade sicher. Ihre gebündelte Contract-Oberflächen-Suche für die Promotion einzelner Konten ist lazy, sodass der Import von `plugin-sdk/setup-runtime` die Ermittlung der gebündelten Contract-Oberfläche nicht vorab lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanalverwaltete Promotion einzelner Konten

Wenn ein Kanal von einer Top-Level-Konfiguration für ein einzelnes Konto auf `channels.<id>.accounts.*` aktualisiert wird, verschiebt das standardmäßige gemeinsame Verhalten promotete kontobezogene Werte nach `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-Contract-Oberfläche eingrenzen oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Top-Level-Schlüssel, die in das promotete Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Konten bereits existieren, werden nur diese Schlüssel in das promotete Konto verschoben; gemeinsame Richtlinien-/Zustellungsschlüssel bleiben im Kanal-Root
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welches vorhandene Konto promotete Werte erhält

<Note>
Matrix ist das aktuelle gebündelte Beispiel. Wenn genau ein benanntes Matrix-Konto bereits existiert oder wenn `defaultAccount` auf einen vorhandenen nicht-kanonischen Schlüssel wie `Ops` zeigt, bewahrt die Promotion dieses Konto, anstatt einen neuen Eintrag `accounts.default` zu erstellen.
</Note>

## Konfigurationsschema

Plugin-Konfiguration wird anhand des JSON-Schemas in Ihrem Manifest validiert. Benutzer konfigurieren Plugins über:

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

Für kanalspezifische Konfiguration verwenden Sie stattdessen den Abschnitt für Kanalkonfiguration:

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

### Kanalkonfigurationsschemata erstellen

Verwenden Sie `buildChannelConfigSchema`, um ein Zod-Schema in den `ChannelConfigSchema`-Wrapper zu konvertieren, der von Plugin-eigenen Konfigurationsartefakten verwendet wird:

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

Wenn Sie den Contract bereits als JSON-Schema oder TypeBox verfassen, verwenden Sie den direkten Helfer, damit OpenClaw die Zod-zu-JSON-Schema-Konvertierung auf Metadatenpfaden überspringen kann:

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

Für Drittanbieter-Plugins bleibt der Cold-Path-Contract weiterhin das Plugin-Manifest: Spiegeln Sie das generierte JSON-Schema nach `openclaw.plugin.json#channelConfigs`, damit Konfigurationsschema, Setup und UI-Oberflächen `channels.<id>` prüfen können, ohne Laufzeitcode zu laden.

## Setup-Assistenten

Channel-Plugins können interaktive Setup-Assistenten für `openclaw onboard` bereitstellen. Der Assistent ist ein `ChannelSetupWizard`-Objekt auf dem `ChannelPlugin`:

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

Der Typ `ChannelSetupWizard` unterstützt `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` und mehr. Vollständige Beispiele finden Sie in gebündelten Plugin-Paketen (zum Beispiel im Discord-Plugin `src/channel.setup.ts`).

<AccordionGroup>
  <Accordion title="Gemeinsame allowFrom-Prompts">
    Für DM-Allowlist-Prompts, die nur den Standardablauf `note -> prompt -> parse -> merge -> patch` benötigen, bevorzugen Sie die gemeinsamen Setup-Helfer aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` und `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardstatus für Kanal-Setup">
    Für Statusblöcke zum Kanal-Setup, die nur nach Labels, Scores und optionalen zusätzlichen Zeilen variieren, bevorzugen Sie `createStandardChannelSetupStatus(...)` aus `openclaw/plugin-sdk/setup`, anstatt dasselbe `status`-Objekt in jedem Plugin manuell zu erstellen.
  </Accordion>
  <Accordion title="Optionale Kanal-Setup-Oberfläche">
    Für optionale Setup-Oberflächen, die nur in bestimmten Kontexten erscheinen sollen, verwenden Sie `createOptionalChannelSetupSurface` aus `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` stellt außerdem die tiefer liegenden Builder `createOptionalChannelSetupAdapter(...)` und `createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte dieser optionalen Installationsoberfläche benötigen.

    Der generierte optionale Adapter/Assistent schlägt bei echten Konfigurationsschreibvorgängen geschlossen fehl. Er verwendet dieselbe Meldung für erforderliche Installation über `validateInput`, `applyAccountConfig` und `finalize` hinweg wieder und hängt einen Dokumentationslink an, wenn `docsPath` gesetzt ist.

  </Accordion>
  <Accordion title="Setup-Helfer mit Binary-Unterstützung">
    Für Setup-UIs mit Binary-Unterstützung bevorzugen Sie die gemeinsamen delegierten Helfer, anstatt dieselbe Binary-/Status-Verknüpfung in jeden Kanal zu kopieren:

    - `createDetectedBinaryStatus(...)` für Statusblöcke, die nur nach Labels, Hinweisen, Scores und Binary-Erkennung variieren
    - `createCliPathTextInput(...)` für textbasierte Eingaben mit Pfadbezug
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an einen schwereren vollständigen Assistenten weiterleiten muss
    - `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur eine Entscheidung für `textInputs[*].shouldPrompt` delegieren muss

  </Accordion>
</AccordionGroup>

## Veröffentlichen und installieren

**Externe Plugins:** Veröffentlichen Sie auf [ClawHub](/de/tools/clawhub) und installieren Sie dann:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Bloße Paketspezifikationen installieren während der Launch-Umstellung aus npm.

  </Tab>
  <Tab title="Nur ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm-Paketspezifikation">
    Verwenden Sie npm, wenn ein Paket noch nicht zu ClawHub gewechselt ist oder wenn Sie während der Migration einen
    direkten npm-Installationspfad benötigen:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**In-Repo-Plugins:** Legen Sie sie unter dem gebündelten Plugin-Workspace-Baum ab; sie werden beim Build automatisch erkannt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Bei Installationen aus npm-Quellen installiert `openclaw plugins install` das Paket unter `~/.openclaw/npm` mit deaktivierten Lifecycle-Skripten. Halten Sie Plugin-Abhängigkeitsbäume auf reines JS/TS beschränkt und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

<Note>
Der Gateway-Start installiert keine Plugin-Abhängigkeiten. npm-/git-/ClawHub-Installationsabläufe sind für die Abhängigkeitsangleichung zuständig; lokale Plugins müssen ihre Abhängigkeiten bereits installiert haben.
</Note>

Gebündelte Paketmetadaten sind explizit und werden nicht beim Gateway-Start aus gebautem JavaScript abgeleitet. Runtime-Abhängigkeiten gehören in das Plugin-Paket, dem sie gehören; der Start des paketierten OpenClaw repariert oder spiegelt Plugin-Abhängigkeiten niemals.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) — Schritt-für-Schritt-Leitfaden für den Einstieg
- [Plugin-Manifest](/de/plugins/manifest) — vollständige Referenz zum Manifest-Schema
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — `definePluginEntry` und `defineChannelPluginEntry`
