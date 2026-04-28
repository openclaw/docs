---
read_when:
    - Sie fügen einem Plugin einen Einrichtungsassistenten hinzu.
    - Sie müssen den Unterschied zwischen `setup-entry.ts` und `index.ts` verstehen.
    - Sie definieren Plugin-Konfigurationsschemata oder `openclaw`-Metadaten in `package.json`.
sidebarTitle: Setup and config
summary: Einrichtungsassistenten, `setup-entry.ts`, Konfigurationsschemata und Metadaten in `package.json`
title: Plugin-Einrichtung und -Konfiguration
x-i18n:
    generated_at: "2026-04-26T11:36:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste (`openclaw.plugin.json`), Setup-Einstiegspunkte und Konfigurationsschemata.

<Tip>
**Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Die How-to-Guides behandeln die Paketierung im Kontext: [Kanal-Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und [Anbieter-Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paketmetadaten

Ihre `package.json` benötigt ein Feld `openclaw`, das dem Plugin-System mitteilt, was Ihr Plugin bereitstellt:

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
  <Tab title="Anbieter-Plugin / ClawHub-Basis">
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
  Leichter Einstiegspunkt nur für das Setup (optional).
</ParamField>
<ParamField path="channel" type="object">
  Metadaten des Kanal-Katalogs für Setup-, Auswahl-, Schnellstart- und Statusoberflächen.
</ParamField>
<ParamField path="providers" type="string[]">
  Anbieter-IDs, die von diesem Plugin registriert werden.
</ParamField>
<ParamField path="install" type="object">
  Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flags für das Startverhalten.
</ParamField>

### `openclaw.channel`

`openclaw.channel` sind schlanke Paketmetadaten für Kanalerkennung und Setup-Oberflächen, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                    |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                         |
| `label`                                | `string`   | Primäre Kanalbezeichnung.                                                    |
| `selectionLabel`                       | `string`   | Bezeichnung in Auswahl/Setup, wenn sie sich von `label` unterscheiden soll. |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für umfangreichere Kanalkataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Dokumentationspfad für Setup- und Auswahllinks.                              |
| `docsLabel`                            | `string`   | Überschriebene Bezeichnung für Dokumentationslinks, wenn sie sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Beschreibung für Onboarding/Katalog.                                   |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                        |
| `aliases`                              | `string[]` | Zusätzliche Such-Aliase für die Kanalauswahl.                                |
| `preferOver`                           | `string[]` | Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Kanal übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Icon-/Systembildname für Kanal-UI-Kataloge.                       |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Dokumentationslinks in Auswahloberflächen.                    |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt den Dokumentationspfad direkt statt eines beschrifteten Dokumentationslinks im Auswahltext an. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Zeichenfolgen, die im Auswahltext angehängt werden.        |
| `markdownCapable`                      | `boolean`  | Kennzeichnet den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Sichtbarkeitssteuerung des Kanals für Setup-, konfigurierte Listen- und Dokumentationsoberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Kanal in den Standard-Schnellstart-Setup-Flow `allowFrom` auf.  |
| `forceAccountBinding`                  | `boolean`  | Erzwingt eine explizite Kontobindung, auch wenn nur ein Konto vorhanden ist. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt Sitzungslookup beim Auflösen von Ankündigungszielen für diesen Kanal. |

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

- `configured`: schließt den Kanal in konfigurierte/statusähnliche Listenoberflächen ein
- `setup`: schließt den Kanal in interaktive Setup-/Konfigurationsauswahlen ein
- `docs`: markiert den Kanal in Dokumentations-/Navigationsoberflächen als öffentlich sichtbar

<Note>
`showConfigured` und `showInSetup` werden weiterhin als Legacy-Aliase unterstützt. Bevorzugen Sie `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                  | Bedeutung                                                                       |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanonische npm-Spezifikation für Installations-/Update-Flows.                   |
| `localPath`                  | `string`             | Lokaler Entwicklungs- oder gebündelter Installationspfad.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                      |
| `minHostVersion`             | `string`             | Minimal unterstützte OpenClaw-Version im Format `>=x.y.z`.                      |
| `expectedIntegrity`          | `string`             | Erwartete npm-dist-Integrity-Zeichenfolge, meist `sha512-...`, für angeheftete Installationen. |
| `allowInvalidConfigRecovery` | `boolean`            | Ermöglicht gebündelten Plugin-Neuinstallations-Flows die Wiederherstellung bei bestimmten veralteten Konfigurationsfehlern. |

<AccordionGroup>
  <Accordion title="Onboarding-Verhalten">
    Interaktives Onboarding verwendet `openclaw.install` auch für Oberflächen mit bedarfsgesteuerter Installation. Wenn Ihr Plugin Anbieter-Authentifizierungsoptionen oder Kanal-Setup-/Katalogmetadaten bereitstellt, bevor die Laufzeit geladen wird, kann das Onboarding diese Auswahl anzeigen, nach npm- oder lokaler Installation fragen, das Plugin installieren oder aktivieren und dann den ausgewählten Flow fortsetzen. Npm-Onboarding-Auswahlen erfordern vertrauenswürdige Katalogmetadaten mit einer Registry-`npmSpec`; exakte Versionen und `expectedIntegrity` sind optionale Pins. Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Flows sie. Behalten Sie die Metadaten für „was angezeigt werden soll“ in `openclaw.plugin.json` und die Metadaten für „wie es installiert werden soll“ in `package.json`.
  </Accordion>
  <Accordion title="Durchsetzung von minHostVersion">
    Wenn `minHostVersion` gesetzt ist, erzwingen sowohl Installation als auch Laden über die Manifest-Registrierung dieses Feld. Ältere Hosts überspringen das Plugin; ungültige Versionszeichenfolgen werden abgelehnt.
  </Accordion>
  <Accordion title="Angeheftete npm-Installationen">
    Halten Sie bei angehefteten npm-Installationen die exakte Version in `npmSpec` und fügen Sie die erwartete Artifact-Integrity hinzu:

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
  <Accordion title="Umfang von allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` ist keine allgemeine Umgehung für defekte Konfigurationen. Es ist nur für die eng begrenzte Wiederherstellung gebündelter Plugins gedacht, damit Neuinstallation/Setup bekannte Upgrade-Überbleibsel wie einen fehlenden gebündelten Plugin-Pfad oder einen veralteten Eintrag `channels.<id>` für dasselbe Plugin reparieren kann. Wenn die Konfiguration aus nicht zusammenhängenden Gründen defekt ist, schlägt die Installation weiterhin mit geschlossenem Fehlerbild fehl und weist den Operator an, `openclaw doctor --fix` auszuführen.
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

Wenn dies aktiviert ist, lädt OpenClaw während der Startphase vor `listen` nur `setupEntry`, selbst für bereits konfigurierte Kanäle. Der vollständige Einstiegspunkt wird geladen, nachdem das Gateway mit dem Lauschen begonnen hat.

<Warning>
Aktivieren Sie verzögertes Laden nur dann, wenn Ihr `setupEntry` alles registriert, was das Gateway vor dem Start des Listenings benötigt (Kanalregistrierung, HTTP-Routen, Gateway-Methoden). Wenn der vollständige Einstiegspunkt erforderliche Startfunktionen verwaltet, behalten Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/Voll-Einstiegspunkt Gateway-RPC-Methoden registriert, behalten Sie diese unter einem Plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben im Besitz des Core und werden immer zu `operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss im Paketstamm eine `openclaw.plugin.json` ausliefern. OpenClaw verwendet diese Datei, um die Konfiguration zu validieren, ohne Plugin-Code auszuführen.

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
Der Legacy-Veröffentlichungsalias nur für Skills ist für Skills vorgesehen. Plugin-Pakete sollten immer `clawhub package publish` verwenden.
</Note>

## Setup-Einstiegspunkt

Die Datei `setup-entry.ts` ist eine leichte Alternative zu `index.ts`, die OpenClaw lädt, wenn es nur Setup-Oberflächen benötigt (Onboarding, Konfigurationsreparatur, Inspektion deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, während Setup-Flows schwere Laufzeit-Codes zu laden (Kryptobibliotheken, CLI-Registrierungen, Hintergrunddienste).

Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Modulen halten, können `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` anstelle von `defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Vertrag unterstützt außerdem einen optionalen Export `runtime`, sodass die Laufzeitverdrahtung zur Setup-Zeit leichtgewichtig und explizit bleiben kann.

<AccordionGroup>
  <Accordion title="Wann OpenClaw `setupEntry` anstelle des vollständigen Einstiegspunkts verwendet">
    - Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen.
    - Der Kanal ist aktiviert, aber nicht konfiguriert.
    - Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Was `setupEntry` registrieren muss">
    - Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`).
    - Alle HTTP-Routen, die vor dem Start von Gateway Listen erforderlich sind.
    - Alle Gateway-Methoden, die während des Starts benötigt werden.

    Diese Gateway-Methoden für den Start sollten weiterhin reservierte Core-Admin-Namespaces wie `config.*` oder `update.*` vermeiden.

  </Accordion>
  <Accordion title="Was `setupEntry` NICHT enthalten sollte">
    - CLI-Registrierungen.
    - Hintergrunddienste.
    - Schwere Laufzeit-Importe (Krypto, SDKs).
    - Gateway-Methoden, die erst nach dem Start benötigt werden.

  </Accordion>
</AccordionGroup>

### Schmale Helper-Importe für das Setup

Bevorzugen Sie für schnelle Pfade nur für das Setup die schmalen Schnittstellen für Setup-Helper statt des breiteren Umbrella-Pfads `plugin-sdk/setup`, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                        | Verwenden Sie ihn für                                                                     | Zentrale Exporte                                                                                                                                                                                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Laufzeit-Helper zur Setup-Zeit, die in `setupEntry` / verzögertem Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Account-Setup-Adapter                                                   | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | CLI-/Archiv-/Dokumentations-Helper für Setup/Installation                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Verwenden Sie die breitere Schnittstelle `plugin-sdk/setup`, wenn Sie die vollständige gemeinsame Setup-Toolbox benötigen, einschließlich Konfigurations-Patch-Helpern wie `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import für den Hot Path sicher. Ihr gebündeltes Single-Account-Promotion-Lookup für die Vertragsoberfläche ist lazy, sodass der Import von `plugin-sdk/setup-runtime` die Erkennung gebündelter Vertragsoberflächen nicht eager lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanalgesteuerte Single-Account-Promotion

Wenn ein Kanal von einer Single-Account-Konfiguration auf oberster Ebene zu `channels.<id>.accounts.*` migriert, verschiebt das standardmäßige gemeinsame Verhalten die promoteten Account-spezifischen Werte in `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-Vertragsoberfläche einschränken oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Schlüssel auf oberster Ebene, die in den promoteten Account verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Accounts bereits existieren, werden nur diese Schlüssel in den promoteten Account verschoben; gemeinsame Richtlinien-/Auslieferungsschlüssel bleiben an der Kanalwurzel
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welcher vorhandene Account die promoteten Werte erhält

<Note>
Matrix ist das aktuelle gebündelte Beispiel. Wenn bereits genau ein benannter Matrix-Account existiert oder wenn `defaultAccount` auf einen vorhandenen nicht-kanonischen Schlüssel wie `Ops` zeigt, bewahrt die Promotion diesen Account, statt einen neuen Eintrag `accounts.default` zu erstellen.
</Note>

## Konfigurationsschema

Die Plugin-Konfiguration wird anhand des JSON-Schemas in Ihrem Manifest validiert. Nutzer konfigurieren Plugins über:

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

Verwenden Sie für kanalspezifische Konfiguration stattdessen den Abschnitt für die Kanalkonfiguration:

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

### Konfigurationsschemata für Kanäle erstellen

Verwenden Sie `buildChannelConfigSchema`, um ein Zod-Schema in den Wrapper `ChannelConfigSchema` zu konvertieren, der von Plugin-eigenen Konfigurationsartefakten verwendet wird:

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

Für Drittanbieter-Plugins bleibt der Cold-Path-Vertrag weiterhin das Plugin-Manifest: spiegeln Sie das generierte JSON-Schema in `openclaw.plugin.json#channelConfigs`, damit Konfigurationsschema-, Setup- und UI-Oberflächen `channels.<id>` prüfen können, ohne Laufzeit-Code zu laden.

## Einrichtungsassistenten

Kanal-Plugins können interaktive Einrichtungsassistenten für `openclaw onboard` bereitstellen. Der Assistent ist ein Objekt vom Typ `ChannelSetupWizard` auf dem `ChannelPlugin`:

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
  <Accordion title="Gemeinsame `allowFrom`-Prompts">
    Bevorzugen Sie für DM-Allowlist-Prompts, die nur den Standard-Flow `note -> prompt -> parse -> merge -> patch` benötigen, die gemeinsamen Setup-Helper aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` und `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardstatus für Kanal-Setup">
    Bevorzugen Sie für Statusblöcke im Kanal-Setup, die sich nur in Bezeichnungen, Scores und optionalen Zusatzzeilen unterscheiden, `createStandardChannelSetupStatus(...)` aus `openclaw/plugin-sdk/setup`, anstatt dasselbe Objekt `status` in jedem Plugin von Hand zu erstellen.
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

    `plugin-sdk/channel-setup` stellt auch die Low-Level-Builder `createOptionalChannelSetupAdapter(...)` und `createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte dieser optionalen Installationsoberfläche benötigen.

    Der generierte optionale Adapter/Assistent schlägt bei echten Konfigurationsschreibvorgängen mit geschlossenem Fehlerbild fehl. Sie verwenden dieselbe Nachricht „Installation erforderlich“ über `validateInput`, `applyAccountConfig` und `finalize` hinweg wieder und hängen einen Dokumentationslink an, wenn `docsPath` gesetzt ist.

  </Accordion>
  <Accordion title="Setup-Helper mit Binärdatei-Backend">
    Bevorzugen Sie für Setup-UIs mit Binärdatei-Backend die gemeinsamen delegierten Helper, statt denselben Binary-/Status-Kleber in jeden Kanal zu kopieren:

    - `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur in Bezeichnungen, Hinweisen, Scores und der Erkennung von Binärdateien unterscheiden
    - `createCliPathTextInput(...)` für pfadgestützte Texteingaben
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an einen schwereren vollständigen Assistenten weiterleiten muss
    - `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur eine Entscheidung für `textInputs[*].shouldPrompt` delegieren muss

  </Accordion>
</AccordionGroup>

## Veröffentlichen und Installieren

**Externe Plugins:** Veröffentlichen Sie auf [ClawHub](/de/tools/clawhub) oder npm und installieren Sie dann:

<Tabs>
  <Tab title="Automatisch (ClawHub, dann npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw versucht zuerst ClawHub und fällt dann automatisch auf npm zurück.

  </Tab>
  <Tab title="Nur ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm-Paketspezifikation">
    Es gibt kein passendes Override `npm:`. Verwenden Sie die normale npm-Paketspezifikation, wenn Sie den npm-Pfad nach dem ClawHub-Fallback verwenden möchten:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins im Repository:** Legen Sie sie unter dem Workspace-Baum für gebündelte Plugins ab; sie werden während des Builds automatisch erkannt.

**Nutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Für Installationen aus npm führt `openclaw plugins install` ein projektlokales `npm install --ignore-scripts` aus (keine Lifecycle-Skripte) und ignoriert geerbte globale npm-Installationsoptionen. Halten Sie die Abhängigkeitsbäume von Plugins bei reinem JS/TS und vermeiden Sie Pakete, die Builds über `postinstall` erfordern.
</Info>

<Note>
Gebündelte, OpenClaw-eigene Plugins sind die einzige Ausnahme bei der Reparatur während des Starts: Wenn eine paketierte Installation eines davon über die Plugin-Konfiguration, eine Legacy-Kanalkonfiguration oder ihr gebündeltes standardmäßig aktiviertes Manifest aktiviert sieht, installiert der Start die fehlenden Laufzeitabhängigkeiten dieses Plugins vor dem Import. Drittanbieter-Plugins sollten sich nicht auf Installationen beim Start verlassen; verwenden Sie weiterhin den expliziten Plugin-Installer.
</Note>

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) — Schritt-für-Schritt-Einstiegshilfe
- [Plugin-Manifest](/de/plugins/manifest) — vollständige Referenz für das Manifestschema
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — `definePluginEntry` und `defineChannelPluginEntry`
