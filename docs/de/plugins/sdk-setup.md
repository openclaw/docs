---
read_when:
    - Sie fügen einem Plugin einen Setup-Assistenten hinzu
    - Sie müssen den Unterschied zwischen setup-entry.ts und index.ts verstehen
    - Sie definieren Plugin-Konfigurationsschemata oder openclaw-Metadaten in package.json
sidebarTitle: Setup and Config
summary: Setup-Assistenten, setup-entry.ts, Konfigurationsschemata und package.json-Metadaten
title: Plugin-Setup und -Konfiguration
x-i18n:
    generated_at: "2026-04-23T06:33:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccdafb9a562353a7851fcd47bbc382961a449f5d645362c800f64c60579ce7b2
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin-Setup und -Konfiguration

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste
(`openclaw.plugin.json`), Setup-Entries und Konfigurationsschemata.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?** Die How-to-Guides behandeln die Paketierung im Kontext:
  [Kanal-Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und
  [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paketmetadaten

Ihre `package.json` benötigt ein Feld `openclaw`, das dem Plugin-System mitteilt, was
Ihr Plugin bereitstellt:

**Kanal-Plugin:**

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

**Provider-Plugin / ClawHub-Publish-Basis:**

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

Wenn Sie das Plugin extern auf ClawHub veröffentlichen, sind diese Felder `compat` und `build`
erforderlich. Die kanonischen Publish-Snippets liegen in
`docs/snippets/plugin-publish/`.

### `openclaw`-Felder

| Feld         | Typ        | Beschreibung                                                                                                              |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Entry-Point-Dateien (relativ zum Paket-Root)                                                                              |
| `setupEntry` | `string`   | Leichtgewichtiger Entry nur für Setup (optional)                                                                          |
| `channel`    | `object`   | Kanal-Katalogmetadaten für Setup, Auswahl, Schnellstart und Statusoberflächen                                            |
| `providers`  | `string[]` | Provider-IDs, die von diesem Plugin registriert werden                                                                    |
| `install`    | `object`   | Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags für das Startverhalten                                                                                              |

### `openclaw.channel`

`openclaw.channel` sind kostengünstige Paketmetadaten für Kanalerkennung und Setup-
Oberflächen, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                   |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                        |
| `label`                                | `string`   | Primäres Kanal-Label.                                                       |
| `selectionLabel`                       | `string`   | Label für Auswahl/Setup, wenn es sich von `label` unterscheiden soll.       |
| `detailLabel`                          | `string`   | Sekundäres Detail-Label für umfangreichere Kanalkataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Doku-Pfad für Setup- und Auswahllinks.                                      |
| `docsLabel`                            | `string`   | Überschreibungslabel für Doku-Links, wenn es sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Beschreibung für Onboarding/Katalog.                                  |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                       |
| `aliases`                              | `string[]` | Zusätzliche Lookup-Aliasse für die Kanalauswahl.                            |
| `preferOver`                           | `string[]` | Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Kanal übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Icon-/Systembildname für Kanal-UI-Kataloge.                      |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Doku-Links in Auswahloberflächen.                            |
| `selectionDocsOmitLabel`               | `boolean`  | Den Doku-Pfad direkt statt eines beschrifteten Doku-Links im Auswahltext anzeigen. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Strings, die im Auswahltext angehängt werden.             |
| `markdownCapable`                      | `boolean`  | Kennzeichnet den Kanal für ausgehende Formatierungsentscheidungen als Markdown-fähig. |
| `exposure`                             | `object`   | Sichtbarkeitssteuerung des Kanals für Setup, konfigurierte Listen und Doku-Oberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Kanal in den Standard-Schnellstart-`allowFrom`-Flow auf.       |
| `forceAccountBinding`                  | `boolean`  | Erzwingt explizites Konto-Binding, selbst wenn nur ein Konto existiert.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt Session-Lookup beim Auflösen von Ankündigungszielen für diesen Kanal. |

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

- `configured`: den Kanal in konfigurierten/statusartigen Listenoberflächen einschließen
- `setup`: den Kanal in interaktiven Setup-/Configure-Auswahlen einschließen
- `docs`: den Kanal in Doku-/Navigationsoberflächen als öffentlich markieren

`showConfigured` und `showInSetup` werden weiterhin als veraltete Aliasse unterstützt. Bevorzugen Sie
`exposure`.

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                  | Bedeutung                                                                      |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Kanonische npm-Spezifikation für Installations-/Update-Flows.                  |
| `localPath`                  | `string`             | Lokaler Entwicklungs- oder gebündelter Installationspfad.                      |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                     |
| `minHostVersion`             | `string`             | Minimale unterstützte OpenClaw-Version in der Form `>=x.y.z`.                  |
| `expectedIntegrity`          | `string`             | Erwarteter npm-dist-Integritätsstring, meist `sha512-...`, für gepinnte Installationen. |
| `allowInvalidConfigRecovery` | `boolean`            | Erlaubt gebündelten Plugin-Reinstallations-Flows die Wiederherstellung nach bestimmten Fehlern mit veralteter Konfiguration. |

Interaktives Onboarding verwendet `openclaw.install` auch für Install-on-Demand-
Oberflächen. Wenn Ihr Plugin Provider-Auth-Optionen oder Kanal-Setup-/Katalog-
Metadaten bereitstellt, bevor die Laufzeit geladen wird, kann das Onboarding diese Auswahl anzeigen, nach npm
vs. lokaler Installation fragen, das Plugin installieren oder aktivieren und dann mit dem
gewählten Flow fortfahren. Npm-Onboarding-Optionen erfordern vertrauenswürdige Katalogmetadaten mit
einer exakten `npmSpec`-Version und `expectedIntegrity`; ungepinnte Paketnamen und dist-tags
werden nicht für automatische Onboarding-Installationen angeboten. Behalten Sie die Metadaten
für „was anzeigen“ in `openclaw.plugin.json` und die Metadaten für „wie installieren“
in `package.json`.

Wenn `minHostVersion` gesetzt ist, erzwingen sowohl Installation als auch manifestbasierte Register-Ladung
diesen Wert. Ältere Hosts überspringen das Plugin; ungültige Versionsstrings werden abgelehnt.

Für gepinnte npm-Installationen behalten Sie die exakte Version in `npmSpec` bei und fügen die
erwartete Artefaktintegrität hinzu:

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

`allowInvalidConfigRecovery` ist kein allgemeiner Bypass für fehlerhafte Konfigurationen. Es ist
nur für enge Wiederherstellungsfälle gebündelter Plugins gedacht, damit Reinstallation/Setup bekannte
Upgrade-Altlasten wie einen fehlenden Pfad zu gebündelten Plugins oder einen veralteten Eintrag `channels.<id>`
für dasselbe Plugin reparieren kann. Wenn die Konfiguration aus anderen Gründen fehlerhaft ist, schlägt die Installation
weiterhin geschlossen fehl und weist den Operator an, `openclaw doctor --fix` auszuführen.

### Verzögertes vollständiges Laden

Kanal-Plugins können sich mit Folgendem für verzögertes Laden entscheiden:

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

Wenn dies aktiviert ist, lädt OpenClaw in der Startphase vor dem Listen nur `setupEntry`,
selbst für bereits konfigurierte Kanäle. Der vollständige Entry wird geladen, nachdem das
Gateway begonnen hat zu lauschen.

<Warning>
  Aktivieren Sie verzögertes Laden nur, wenn Ihr `setupEntry` alles registriert, was das
  Gateway vor dem Start des Listenings benötigt (Kanalregistrierung, HTTP-Routen,
  Gateway-Methoden). Wenn der vollständige Entry erforderliche Startfähigkeiten besitzt, behalten Sie
  das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/vollständiger Entry Gateway-RPC-Methoden registriert, halten Sie sie unter einem
pluginspezifischen Präfix. Reservierte Core-Admin-Namensräume (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben im Besitz des Core und werden immer zu
`operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss eine `openclaw.plugin.json` im Paket-Root mitliefern.
OpenClaw verwendet diese, um Konfigurationen zu validieren, ohne Plugin-Code auszuführen.

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

Für Kanal-Plugins fügen Sie `kind` und `channels` hinzu:

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

Siehe [Plugin Manifest](/de/plugins/manifest) für die vollständige Referenz des Schemas.

## ClawHub-Veröffentlichung

Verwenden Sie für Plugin-Pakete den paketspezifischen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Der veraltete Publish-Alias nur für Skills ist für Skills gedacht. Plugin-Pakete sollten
immer `clawhub package publish` verwenden.

## Setup-Entry

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die
OpenClaw lädt, wenn nur Setup-Oberflächen benötigt werden (Onboarding, Konfigurationsreparatur,
Prüfung deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, dass in Setup-Flows schwergewichtiger Laufzeitcode geladen wird (Kryptobibliotheken, CLI-Registrierungen,
Hintergrunddienste).

Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Modulen halten, können
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` anstelle von
`defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Vertrag unterstützt auch einen optionalen
Export `runtime`, damit die Setup-Laufzeitverdrahtung leichtgewichtig und explizit bleiben kann.

**Wann OpenClaw `setupEntry` statt des vollständigen Entry verwendet:**

- Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen
- Der Kanal ist aktiviert, aber nicht konfiguriert
- Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Was `setupEntry` registrieren muss:**

- Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`)
- Alle HTTP-Routen, die vor dem Gateway-Listen benötigt werden
- Alle Gateway-Methoden, die beim Start benötigt werden

Diese Gateway-Methoden für den Start sollten weiterhin reservierte Core-Admin-
Namensräume wie `config.*` oder `update.*` vermeiden.

**Was `setupEntry` NICHT enthalten sollte:**

- CLI-Registrierungen
- Hintergrunddienste
- Schwergewichtige Laufzeitimporte (Krypto, SDKs)
- Gateway-Methoden, die erst nach dem Start benötigt werden

### Schmale Setup-Helferimporte

Für Hot-Paths nur für Setup sollten Sie die schmalen Setup-Helferschnittstellen anstelle der breiteren
Umbrella-Schnittstelle `plugin-sdk/setup` bevorzugen, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                         | Verwenden Sie ihn für                                                                    | Wichtige Exporte                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Laufzeithelfer zur Setup-Zeit, die in `setupEntry` / beim verzögerten Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Konto-Setup-Adapter                                                    | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | CLI-/Archiv-/Doku-Helfer für Setup/Installation                                          | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Verwenden Sie die breitere Schnittstelle `plugin-sdk/setup`, wenn Sie den vollständigen gemeinsamen Setup-
Werkzeugkasten möchten, einschließlich Konfigurations-Patch-Helfern wie
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import Hot-Path-sicher. Ihr gebündelter
Lookup der Vertragsoberfläche zur Single-Account-Promotion ist lazy, daher lädt der Import von
`plugin-sdk/setup-runtime` die Discovery der gebündelten Vertragsoberfläche nicht eager, bevor der Adapter tatsächlich verwendet wird.

### Kanaleigene Single-Account-Promotion

Wenn ein Kanal von einer Single-Account-Top-Level-Konfiguration zu
`channels.<id>.accounts.*` wechselt, verschiebt das gemeinsame Standardverhalten
kontobezogene Werte der Promotion in `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-
Vertragsoberfläche einschränken oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Top-Level-Schlüssel, die in das
  beförderte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Konten bereits existieren, werden nur diese
  Schlüssel in das beförderte Konto verschoben; gemeinsame Policy-/Zustellschlüssel bleiben im
  Kanal-Root
- `resolveSingleAccountPromotionTarget(...)`: wählen, welches vorhandene Konto
  die beförderten Werte erhält

Matrix ist das aktuelle gebündelte Beispiel. Wenn genau ein benanntes Matrix-Konto
bereits existiert oder wenn `defaultAccount` auf einen vorhandenen nicht kanonischen Schlüssel
wie `Ops` zeigt, behält die Promotion dieses Konto bei, statt einen neuen
Eintrag `accounts.default` zu erzeugen.

## Konfigurationsschema

Plugin-Konfiguration wird gegen das JSON-Schema in Ihrem Manifest validiert. Benutzer
konfigurieren Plugins über:

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

Verwenden Sie für kanalspezifische Konfiguration stattdessen den Abschnitt der Kanalkonfiguration:

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

Verwenden Sie `buildChannelConfigSchema` aus `openclaw/plugin-sdk/core`, um ein
Zod-Schema in den Wrapper `ChannelConfigSchema` umzuwandeln, den OpenClaw validiert:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Setup-Assistenten

Kanal-Plugins können interaktive Setup-Assistenten für `openclaw onboard` bereitstellen.
Der Assistent ist ein Objekt `ChannelSetupWizard` auf dem `ChannelPlugin`:

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

Der Typ `ChannelSetupWizard` unterstützt `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` und mehr.
Siehe gebündelte Plugin-Pakete (zum Beispiel das Discord-Plugin `src/channel.setup.ts`) für
vollständige Beispiele.

Für DM-Allowlist-Prompts, die nur den Standard-
Flow `note -> prompt -> parse -> merge -> patch` benötigen, bevorzugen Sie die gemeinsamen Setup-
Helfer aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` und
`createNestedChannelParsedAllowFromPrompt(...)`.

Für Statusblöcke im Kanal-Setup, die sich nur durch Labels, Scores und optionale
zusätzliche Zeilen unterscheiden, bevorzugen Sie `createStandardChannelSetupStatus(...)` aus
`openclaw/plugin-sdk/setup`, statt in jedem Plugin dasselbe Objekt `status` manuell
nachzubauen.

Für optionale Setup-Oberflächen, die nur in bestimmten Kontexten erscheinen sollen, verwenden Sie
`createOptionalChannelSetupSurface` aus `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Gibt { setupAdapter, setupWizard } zurück
```

`plugin-sdk/channel-setup` stellt auch die Low-Level-
Builder `createOptionalChannelSetupAdapter(...)` und
`createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte
dieser Oberfläche für optionale Installationen benötigen.

Der generierte optionale Adapter/Assistent schlägt bei echten Konfigurationsschreibvorgängen geschlossen fehl. Er
verwendet eine gemeinsame Meldung „Installation erforderlich“ über `validateInput`,
`applyAccountConfig` und `finalize` hinweg und hängt einen Doku-Link an, wenn `docsPath`
gesetzt ist.

Für Binary-gestützte Setup-UIs bevorzugen Sie die gemeinsamen delegierten Helfer, statt
denselben Binary-/Status-Kleber in jeden Kanal zu kopieren:

- `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur durch Labels,
  Hinweise, Scores und Binary-Erkennung unterscheiden
- `createCliPathTextInput(...)` für pfadgestützte Texteingaben
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und
  `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an
  einen schwereren vollständigen Assistenten weiterleiten muss
- `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur die
  Entscheidung `textInputs[*].shouldPrompt` delegieren muss

## Veröffentlichen und installieren

**Externe Plugins:** auf [ClawHub](/de/tools/clawhub) oder npm veröffentlichen, dann installieren:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw versucht zuerst ClawHub und fällt automatisch auf npm zurück. Sie können ClawHub auch
explizit erzwingen:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # nur ClawHub
```

Es gibt keinen entsprechenden Override `npm:`. Verwenden Sie die normale npm-Paketspezifikation, wenn Sie
den npm-Pfad nach dem ClawHub-Fallback möchten:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins im Repository:** unter dem Workspace-Baum für gebündelte Plugins ablegen; sie werden während des Builds automatisch
erkannt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Für Installationen aus npm führt `openclaw plugins install`
  `npm install --ignore-scripts` aus (keine Lifecycle-Skripte). Halten Sie die Plugin-Abhängigkeits-
  bäume bei reinem JS/TS und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

Gebündelte, OpenClaw-eigene Plugins sind die einzige Ausnahme für Startreparaturen: Wenn eine
paketierte Installation eines davon sieht, das durch Plugin-Konfiguration, veraltete Kanalkonfiguration oder
sein gebündeltes standardmäßig aktiviertes Manifest aktiviert ist, installiert der Start die fehlenden
Laufzeitabhängigkeiten dieses Plugins vor dem Import. Drittanbieter-Plugins sollten sich nicht auf
Startinstallationen verlassen; verwenden Sie weiterhin den expliziten Plugin-Installer.

## Verwandt

- [SDK Entry Points](/de/plugins/sdk-entrypoints) -- `definePluginEntry` und `defineChannelPluginEntry`
- [Plugin Manifest](/de/plugins/manifest) -- vollständige Referenz des Manifest-Schemas
- [Building Plugins](/de/plugins/building-plugins) -- Schritt-für-Schritt-Einstiegsleitfaden
