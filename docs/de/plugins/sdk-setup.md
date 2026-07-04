---
read_when:
    - Sie fügen einem Plugin einen Einrichtungsassistenten hinzu
    - Sie müssen setup-entry.ts im Vergleich zu index.ts verstehen
    - Sie definieren Plugin-Konfigurationsschemas oder openclaw-Metadaten in package.json
sidebarTitle: Setup and config
summary: Einrichtungsassistenten, setup-entry.ts, Konfigurationsschemata und package.json-Metadaten
title: Plugin-Einrichtung und -Konfiguration
x-i18n:
    generated_at: "2026-07-04T15:15:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste (`openclaw.plugin.json`), Einrichtungseinträge und Konfigurationsschemas.

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
Wenn Sie das Plugin extern auf ClawHub veröffentlichen, sind diese `compat`- und `build`-Felder erforderlich. Die kanonischen Veröffentlichungssnippets befinden sich in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-Felder

<ParamField path="extensions" type="string[]">
  Einstiegspunktdateien (relativ zum Paket-Root).
</ParamField>
<ParamField path="setupEntry" type="string">
  Leichtgewichtiger Einstieg nur für die Einrichtung (optional).
</ParamField>
<ParamField path="channel" type="object">
  Kanalkatalog-Metadaten für Einrichtungs-, Auswahl-, Schnellstart- und Statusoberflächen.
</ParamField>
<ParamField path="providers" type="string[]">
  Von diesem Plugin registrierte Provider-IDs.
</ParamField>
<ParamField path="install" type="object">
  Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flags für das Startverhalten.
</ParamField>

### `openclaw.channel`

`openclaw.channel` sind schlanke Paketmetadaten für die Kanalerkennung und Einrichtungsoberflächen, bevor die Laufzeit lädt.

| Feld                                   | Typ        | Bedeutung                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                          |
| `label`                                | `string`   | Primäre Kanalbezeichnung.                                                     |
| `selectionLabel`                       | `string`   | Auswahl-/Einrichtungsbezeichnung, wenn sie von `label` abweichen soll.        |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für umfangreichere Kanalkataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Dokumentationspfad für Einrichtungs- und Auswahllinks.                        |
| `docsLabel`                            | `string`   | Überschreibt die für Dokumentationslinks verwendete Bezeichnung, wenn sie von der Kanal-ID abweichen soll. |
| `blurb`                                | `string`   | Kurze Onboarding-/Katalogbeschreibung.                                        |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                         |
| `aliases`                              | `string[]` | Zusätzliche Suchaliase für die Kanalauswahl.                                  |
| `preferOver`                           | `string[]` | Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Kanal übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Symbol-/System-Image-Name für Kanal-UI-Kataloge.                   |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Dokumentationslinks in Auswahloberflächen.                     |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt den Dokumentationspfad direkt statt eines beschrifteten Dokumentationslinks im Auswahltext an. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Zeichenfolgen, die im Auswahltext angehängt werden.         |
| `markdownCapable`                      | `boolean`  | Markiert den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Sichtbarkeitssteuerung des Kanals für Einrichtung, konfigurierte Listen und Dokumentationsoberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Kanal in den standardmäßigen Schnellstart-`allowFrom`-Einrichtungsablauf auf. |
| `forceAccountBinding`                  | `boolean`  | Erfordert eine explizite Kontobindung, auch wenn nur ein Konto vorhanden ist. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt die Sitzungssuche beim Auflösen von Ankündigungszielen für diesen Kanal. |

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

- `configured`: Kanal in konfigurierten/statusähnlichen Listenoberflächen einschließen
- `setup`: Kanal in interaktive Einrichtungs-/Konfigurationsauswahlen einschließen
- `docs`: Kanal in Dokumentations-/Navigationsoberflächen als öffentlich markieren

<Note>
`showConfigured` und `showInSetup` werden weiterhin als Legacy-Aliase unterstützt. Bevorzugen Sie `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                                 | Bedeutung                                                                         |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kanonische ClawHub-Spezifikation für Installations-/Aktualisierungs- und Onboarding-Install-on-Demand-Abläufe. |
| `npmSpec`                    | `string`                            | Kanonische npm-Spezifikation für Installations-/Aktualisierungs-Fallback-Abläufe. |
| `localPath`                  | `string`                            | Lokaler Entwicklungs- oder gebündelter Installationspfad.                         |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn mehrere Quellen verfügbar sind.              |
| `minHostVersion`             | `string`                            | Minimal unterstützte OpenClaw-Version in der Form `>=x.y.z` oder `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Erwartete npm-Dist-Integritätszeichenfolge, normalerweise `sha512-...`, für angeheftete Installationen. |
| `allowInvalidConfigRecovery` | `boolean`                           | Ermöglicht Neuinstallationsabläufen gebündelter Plugins die Wiederherstellung nach bestimmten veralteten Konfigurationsfehlern. |
| `requiredPlatformPackages`   | `string[]`                          | Erforderliche plattformspezifische npm-Aliase, die während der npm-Installation geprüft werden. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interaktives Onboarding verwendet `openclaw.install` auch für Install-on-Demand-Oberflächen. Wenn Ihr Plugin Provider-Authentifizierungsoptionen oder Kanaleinrichtungs-/Katalogmetadaten verfügbar macht, bevor die Laufzeit lädt, kann das Onboarding diese Option anzeigen, zur ClawHub-, npm- oder lokalen Installation auffordern, das Plugin installieren oder aktivieren und dann mit dem ausgewählten Ablauf fortfahren. ClawHub-Onboarding-Optionen verwenden `clawhubSpec` und werden bevorzugt, wenn vorhanden; npm-Optionen erfordern vertrauenswürdige Katalogmetadaten mit einer Registry-`npmSpec`; exakte Versionen und `expectedIntegrity` sind optionale npm-Pins. Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Aktualisierungsabläufe sie für npm. Bewahren Sie die „was anzeigen“-Metadaten in `openclaw.plugin.json` und die „wie installieren“-Metadaten in `package.json` auf.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Wenn `minHostVersion` gesetzt ist, erzwingen sowohl Installation als auch nicht gebündeltes Laden aus der Manifest-Registry diese Version. Ältere Hosts überspringen externe Plugins; ungültige Versionszeichenfolgen werden abgelehnt. Gebündelte Quell-Plugins gelten als mit dem Host-Checkout gleich versioniert.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Für angeheftete npm-Installationen behalten Sie die exakte Version in `npmSpec` bei und fügen die erwartete Artefaktintegrität hinzu:

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
    `allowInvalidConfigRecovery` ist keine allgemeine Umgehung für defekte Konfigurationen. Es ist nur für eng begrenzte Wiederherstellung gebündelter Plugins gedacht, damit Neuinstallation/Einrichtung bekannte Upgrade-Reste wie einen fehlenden gebündelten Plugin-Pfad oder einen veralteten `channels.<id>`-Eintrag für dasselbe Plugin reparieren kann. Wenn die Konfiguration aus anderen Gründen defekt ist, schlägt die Installation weiterhin geschlossen fehl und weist den Operator an, `openclaw doctor --fix` auszuführen.
  </Accordion>
</AccordionGroup>

### Aufgeschobenes vollständiges Laden

Kanal-Plugins können das aufgeschobene Laden aktivieren mit:

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

Wenn aktiviert, lädt OpenClaw während der Startphase vor dem Listen nur `setupEntry`, auch für bereits konfigurierte Kanäle. Der vollständige Einstieg wird geladen, nachdem der Gateway zu lauschen beginnt.

<Warning>
Aktivieren Sie aufgeschobenes Laden nur, wenn Ihr `setupEntry` alles registriert, was der Gateway benötigt, bevor er zu lauschen beginnt (Kanalregistrierung, HTTP-Routen, Gateway-Methoden). Wenn der vollständige Einstieg erforderliche Startfähigkeiten besitzt, behalten Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Einrichtungs-/vollständiger Einstieg Gateway-RPC-Methoden registriert, halten Sie sie auf einem Plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben Core-eigen und werden immer zu `operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss ein `openclaw.plugin.json` im Paket-Root ausliefern. OpenClaw verwendet dies, um die Konfiguration zu validieren, ohne Plugin-Code auszuführen.

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

Siehe [Plugin-Manifest](/de/plugins/manifest) für die vollständige Schema-Referenz.

## ClawHub-Veröffentlichung

Verwenden Sie für Plugin-Pakete den paketspezifischen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Der Legacy-Veröffentlichungsalias nur für Skills ist für Skills gedacht. Plugin-Pakete sollten immer `clawhub package publish` verwenden.
</Note>

## Setup-Einstiegspunkt

Die Datei `setup-entry.ts` ist eine schlanke Alternative zu `index.ts`, die OpenClaw lädt, wenn nur Setup-Oberflächen benötigt werden (Onboarding, Konfigurationsreparatur, Prüfung deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, dass umfangreicher Runtime-Code (Kryptobibliotheken, CLI-Registrierungen, Hintergrunddienste) während Setup-Abläufen geladen wird.

Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Modulen halten, können statt `defineSetupPluginEntry(...)` `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` verwenden. Dieser gebündelte Vertrag unterstützt außerdem einen optionalen `runtime`-Export, damit die Runtime-Verdrahtung zur Setup-Zeit schlank und explizit bleiben kann.

<AccordionGroup>
  <Accordion title="Wann OpenClaw setupEntry statt des vollständigen Einstiegspunkts verwendet">
    - Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen.
    - Der Kanal ist aktiviert, aber nicht konfiguriert.
    - Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Was setupEntry registrieren muss">
    - Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`).
    - Alle HTTP-Routen, die vor dem Gateway-Listen erforderlich sind.
    - Alle Gateway-Methoden, die während des Starts benötigt werden.

    Diese Startup-Gateway-Methoden sollten weiterhin reservierte Core-Admin-Namensräume wie `config.*` oder `update.*` vermeiden.

  </Accordion>
  <Accordion title="Was setupEntry NICHT enthalten sollte">
    - CLI-Registrierungen.
    - Hintergrunddienste.
    - Umfangreiche Runtime-Importe (Krypto, SDKs).
    - Gateway-Methoden, die erst nach dem Start benötigt werden.

  </Accordion>
</AccordionGroup>

### Schmale Setup-Hilfsimporte

Bevorzugen Sie für heiße reine Setup-Pfade die schmalen Setup-Hilfs-Seams gegenüber dem breiteren `plugin-sdk/setup`-Umbrella, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                        | Verwenden für                                                                                | Wichtige Exporte                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Runtime-Helfer zur Setup-Zeit, die in `setupEntry` / beim verzögerten Kanalstart verfügbar bleiben | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | Setup-/Installations-CLI-/Archiv-/Dokumentationshelfer                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Verwenden Sie den breiteren `plugin-sdk/setup`-Seam, wenn Sie die vollständige gemeinsame Setup-Toolbox einschließlich Konfigurations-Patch-Helfern wie `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen.

Verwenden Sie `createSetupTranslator(...)` für feste Texte des Setup-Assistenten. Er folgt der
CLI-Assistenten-Locale (`OPENCLAW_LOCALE`, dann System-Locale-Variablen) und fällt
auf Englisch zurück. Halten Sie Plugin-spezifischen Setup-Text in Plugin-eigenem Code und verwenden Sie
gemeinsame Katalogschlüssel nur für allgemeine Setup-Labels, Statustexte und offizielle
Setup-Texte gebündelter Plugins.

Die Setup-Patch-Adapter bleiben beim Import für Hot Paths sicher. Ihre gebündelte Contract-Surface-Suche für Single-Account-Promotion ist lazy, sodass der Import von `plugin-sdk/setup-runtime` die gebündelte Contract-Surface-Ermittlung nicht vorab lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanal-eigene Single-Account-Promotion

Wenn ein Kanal von einer Single-Account-Konfiguration auf oberster Ebene auf `channels.<id>.accounts.*` aktualisiert, verschiebt das gemeinsame Standardverhalten hochgestufte account-bezogene Werte nach `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-Contract-Surface einschränken oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Schlüssel auf oberster Ebene, die in den hochgestuften Account verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Accounts bereits vorhanden sind, werden nur diese Schlüssel in den hochgestuften Account verschoben; gemeinsame Policy-/Delivery-Schlüssel bleiben am Kanal-Root
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welcher vorhandene Account hochgestufte Werte erhält

<Note>
Matrix ist das aktuelle gebündelte Beispiel. Wenn genau ein benannter Matrix-Account bereits existiert oder wenn `defaultAccount` auf einen vorhandenen nicht-kanonischen Schlüssel wie `Ops` zeigt, bewahrt die Promotion diesen Account, statt einen neuen Eintrag `accounts.default` zu erstellen.
</Note>

## Konfigurationsschema

Die Plugin-Konfiguration wird gegen das JSON Schema in Ihrem Manifest validiert. Benutzer konfigurieren Plugins über:

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

Verwenden Sie für kanalspezifische Konfiguration stattdessen den Kanal-Konfigurationsabschnitt:

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

### Kanal-Konfigurationsschemas erstellen

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

Wenn Sie den Vertrag bereits als JSON Schema oder TypeBox verfassen, verwenden Sie den direkten Helfer, damit OpenClaw die Zod-zu-JSON-Schema-Konvertierung auf Metadatenpfaden überspringen kann:

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

Für Drittanbieter-Plugins bleibt der Cold-Path-Vertrag weiterhin das Plugin-Manifest: Spiegeln Sie das generierte JSON Schema in `openclaw.plugin.json#channelConfigs`, damit Konfigurationsschema, Setup und UI-Oberflächen `channels.<id>` prüfen können, ohne Runtime-Code zu laden.

## Setup-Assistenten

Kanal-Plugins können interaktive Setup-Assistenten für `openclaw onboard` bereitstellen. Der Assistent ist ein `ChannelSetupWizard`-Objekt auf dem `ChannelPlugin`:

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
    Bevorzugen Sie für DM-Allowlist-Prompts, die nur den Standardablauf `note -> prompt -> parse -> merge -> patch` benötigen, die gemeinsamen Setup-Helfer aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` und `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardmäßiger Kanal-Setup-Status">
    Bevorzugen Sie für Kanal-Setup-Statusblöcke, die sich nur nach Labels, Scores und optionalen Zusatzzeilen unterscheiden, `createStandardChannelSetupStatus(...)` aus `openclaw/plugin-sdk/setup`, statt dasselbe `status`-Objekt in jedem Plugin von Hand zu erstellen.
  </Accordion>
  <Accordion title="Optionale Kanal-Setup-Oberfläche">
    Verwenden Sie für optionale Setup-Oberflächen, die nur in bestimmten Kontexten erscheinen sollen, `createOptionalChannelSetupSurface` aus `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` stellt außerdem die niedrigeren Builder `createOptionalChannelSetupAdapter(...)` und `createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte dieser optionalen Installationsoberfläche benötigen.

    Der generierte optionale Adapter/Assistent schlägt bei echten Konfigurationsschreibvorgängen geschlossen fehl. Er verwendet dieselbe Meldung zur erforderlichen Installation über `validateInput`, `applyAccountConfig` und `finalize` hinweg wieder und hängt einen Dokumentationslink an, wenn `docsPath` gesetzt ist.

  </Accordion>
  <Accordion title="Setup-Helfer mit Binary-Unterstützung">
    Bevorzugen Sie für Binary-gestützte Setup-UIs die gemeinsamen delegierten Helfer, statt denselben Binary-/Status-Code in jeden Kanal zu kopieren:

    - `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur durch Labels, Hinweise, Scores und binäre Erkennung unterscheiden
    - `createCliPathTextInput(...)` für pfadgestützte Texteingaben
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und `createDelegatedResolveConfigured(...)`, wenn `setupEntry` bei Bedarf verzögert an einen umfangreicheren vollständigen Assistenten weiterleiten muss
    - `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur eine `textInputs[*].shouldPrompt`-Entscheidung delegieren muss

  </Accordion>
</AccordionGroup>

## Veröffentlichen und Installieren

**Externe Plugins:** In [ClawHub](/clawhub) veröffentlichen, dann installieren:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Paketangaben ohne Präfix installieren während der Startumstellung von npm.

  </Tab>
  <Tab title="Nur ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm-Paketangabe">
    Verwenden Sie npm, wenn ein Paket noch nicht zu ClawHub verschoben wurde oder wenn Sie während der Migration einen direkten npm-Installationspfad benötigen:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins im Repository:** Legen Sie sie unter dem gebündelten Plugin-Workspace-Baum ab; sie werden während des Builds automatisch erkannt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Bei Installationen aus npm installiert `openclaw plugins install` das Paket in ein Plugin-spezifisches Projekt unter `~/.openclaw/npm/projects`, wobei Lifecycle-Skripte deaktiviert sind. Halten Sie Plugin-Abhängigkeitsbäume rein JS/TS-basiert und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

<Note>
Der Gateway-Start installiert keine Plugin-Abhängigkeiten. npm-/git-/ClawHub-Installationsabläufe sind für die Abhängigkeitskonvergenz zuständig; lokale Plugins müssen ihre Abhängigkeiten bereits installiert haben.
</Note>

Gebündelte Paketmetadaten sind explizit und werden beim Gateway-Start nicht aus gebautem JavaScript abgeleitet. Laufzeitabhängigkeiten gehören in das Plugin-Paket, dem sie gehören; der Start des paketierten OpenClaw repariert oder spiegelt Plugin-Abhängigkeiten nie.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) — Schritt-für-Schritt-Anleitung für den Einstieg
- [Plugin-Manifest](/de/plugins/manifest) — vollständige Referenz zum Manifest-Schema
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — `definePluginEntry` und `defineChannelPluginEntry`
