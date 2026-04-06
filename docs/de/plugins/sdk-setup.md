---
read_when:
    - Sie fügen einem Plugin einen Setup-Assistenten hinzu
    - Sie müssen den Unterschied zwischen setup-entry.ts und index.ts verstehen
    - Sie definieren Plugin-Konfigurationsschemas oder openclaw-Metadaten in package.json
sidebarTitle: Setup and Config
summary: Setup-Assistenten, setup-entry.ts, Konfigurationsschemas und package.json-Metadaten
title: Plugin-Setup und Konfiguration
x-i18n:
    generated_at: "2026-04-06T03:10:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: eac2586516d27bcd94cc4c259fe6274c792b3f9938c7ddd6dbf04a6dbb988dc9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin-Setup und Konfiguration

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste
(`openclaw.plugin.json`), Setup-Einträge und Konfigurationsschemas.

<Tip>
  **Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Die How-to-Anleitungen behandeln Paketierung im Kontext:
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

**Provider-Plugin / ClawHub-Veröffentlichungsbaseline:**

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
erforderlich. Die kanonischen Snippets für die Veröffentlichung finden Sie in
`docs/snippets/plugin-publish/`.

### `openclaw`-Felder

| Feld         | Typ        | Beschreibung                                                                                             |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Einstiegspunktdateien (relativ zum Paketstamm)                                                           |
| `setupEntry` | `string`   | Leichtgewichtiger Einstiegspunkt nur für Setup (optional)                                                |
| `channel`    | `object`   | Metadaten des Kanalkatalogs für Setup, Picker, Quickstart- und Statusoberflächen                         |
| `providers`  | `string[]` | Provider-IDs, die von diesem Plugin registriert werden                                                   |
| `install`    | `object`   | Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags für das Startverhalten                                                                             |

### `openclaw.channel`

`openclaw.channel` sind kostengünstige Paketmetadaten für Kanalerkennung und Setup-
Oberflächen, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                        |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                             |
| `label`                                | `string`   | Primäre Kanalbezeichnung.                                                        |
| `selectionLabel`                       | `string`   | Bezeichnung für Picker/Setup, wenn sie sich von `label` unterscheiden soll.      |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für umfangreichere Kanalkataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Docs-Pfad für Setup- und Auswahllinks.                                           |
| `docsLabel`                            | `string`   | Überschreibungsbezeichnung für Docs-Links, wenn sie sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Beschreibung für Onboarding/Katalog.                                       |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                            |
| `aliases`                              | `string[]` | Zusätzliche Lookup-Aliasse für die Kanalauswahl.                                 |
| `preferOver`                           | `string[]` | Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Kanal übertreffen soll.  |
| `systemImage`                          | `string`   | Optionaler Symbol-/Systembildname für Kanal-UI-Kataloge.                         |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Docs-Links in Auswahloberflächen.                                 |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt den Docs-Pfad direkt anstelle eines beschrifteten Docs-Links im Auswahltext. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Zeichenfolgen, die im Auswahltext angehängt werden.            |
| `markdownCapable`                      | `boolean`  | Markiert den Kanal als markdownfähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Steuerung der Kanalsichtbarkeit für Setup, konfigurierte Listen und Docs-Oberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Meldet diesen Kanal für den standardmäßigen Quickstart-`allowFrom`-Setup-Ablauf an. |
| `forceAccountBinding`                  | `boolean`  | Erzwingt explizites Account-Binding, selbst wenn nur ein Konto existiert.        |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt Session-Lookup beim Auflösen von Ankündigungszielen für diesen Kanal.  |

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

- `configured`: schließt den Kanal in Oberflächen für konfigurierte/statusartige Listen ein
- `setup`: schließt den Kanal in interaktive Setup-/Konfigurations-Picker ein
- `docs`: markiert den Kanal als öffentlich sichtbar in Docs-/Navigationsoberflächen

`showConfigured` und `showInSetup` werden weiterhin als veraltete Aliasse unterstützt. Bevorzugen Sie
`exposure`.

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                  | Bedeutung                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanonische npm-Spezifikation für Installations-/Aktualisierungsabläufe.          |
| `localPath`                  | `string`             | Lokaler Entwicklungs- oder gebündelter Installationspfad.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                       |
| `minHostVersion`             | `string`             | Mindestunterstützte OpenClaw-Version in der Form `>=x.y.z`.                      |
| `allowInvalidConfigRecovery` | `boolean`            | Ermöglicht Reinstallationsabläufen für gebündelte Plugins die Wiederherstellung nach bestimmten veralteten Konfigurationsfehlern. |

Wenn `minHostVersion` gesetzt ist, erzwingen sowohl Installation als auch das Laden der Manifest-
Registry diese. Ältere Hosts überspringen das Plugin; ungültige Versionszeichenfolgen werden abgelehnt.

`allowInvalidConfigRecovery` ist keine allgemeine Umgehung für fehlerhafte Konfigurationen. Es ist
nur für eng gefasste Wiederherstellung gebündelter Plugins gedacht, damit Reinstallation/Setup bekannte Upgrade-
Überbleibsel wie einen fehlenden Pfad zu einem gebündelten Plugin oder einen veralteten Eintrag `channels.<id>`
für dasselbe Plugin reparieren können. Wenn die Konfiguration aus anderen Gründen fehlerhaft ist,
schlägt die Installation weiterhin fehlgeschlossen fehl und weist den Operator an, `openclaw doctor --fix` auszuführen.

### Verzögertes vollständiges Laden

Kanal-Plugins können sich mit Folgendem für verzögertes Laden anmelden:

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

Wenn dies aktiviert ist, lädt OpenClaw in der Startphase vor `listen`
nur `setupEntry`, selbst für bereits konfigurierte Kanäle. Der vollständige Einstiegspunkt wird geladen, nachdem das
Gateway mit dem Lauschen begonnen hat.

<Warning>
  Aktivieren Sie verzögertes Laden nur dann, wenn Ihr `setupEntry` alles registriert, was das
  Gateway benötigt, bevor es mit dem Lauschen beginnt (Kanalregistrierung, HTTP-Routen,
  Gateway-Methoden). Wenn der vollständige Einstiegspunkt erforderliche Startfähigkeiten besitzt, behalten Sie
  das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/Voll-Einstiegspunkt Gateway-RPC-Methoden registriert, behalten Sie sie auf einem
plugin-spezifischen Präfix. Reservierte Admin-Namespaces des Kerns (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben im Besitz des Kerns und werden immer zu
`operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss ein `openclaw.plugin.json` im Paketstamm mitliefern.
OpenClaw verwendet dies, um Konfiguration zu validieren, ohne Plugin-Code auszuführen.

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

Selbst Plugins ohne Konfiguration müssen ein Schema mitliefern. Ein leeres Schema ist gültig:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Die vollständige Schemareferenz finden Sie unter [Plugin Manifest](/de/plugins/manifest).

## ClawHub-Veröffentlichung

Für Plugin-Pakete verwenden Sie den paketspezifischen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Der veraltete Alias für die Veröffentlichung nur von Skills ist für Skills gedacht. Plugin-Pakete sollten
immer `clawhub package publish` verwenden.

## Setup-Eintrag

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die
OpenClaw lädt, wenn es nur Setup-Oberflächen benötigt (Onboarding, Konfigurationsreparatur,
Inspektion deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, während Setup-Abläufen schweren Laufzeitcode zu laden (Kryptobibliotheken, CLI-Registrierungen,
Hintergrunddienste).

**Wann OpenClaw `setupEntry` statt des vollständigen Einstiegspunkts verwendet:**

- Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen
- Der Kanal ist aktiviert, aber nicht konfiguriert
- Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Was `setupEntry` registrieren muss:**

- Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`)
- Alle HTTP-Routen, die vor dem Gateway-`listen` erforderlich sind
- Alle Gateway-Methoden, die beim Start benötigt werden

Diese Gateway-Methoden beim Start sollten weiterhin reservierte Admin-
Namespaces des Kerns wie `config.*` oder `update.*` vermeiden.

**Was `setupEntry` NICHT enthalten sollte:**

- CLI-Registrierungen
- Hintergrunddienste
- Schwere Laufzeitimporte (Krypto, SDKs)
- Gateway-Methoden, die erst nach dem Start benötigt werden

### Enge Importe von Setup-Hilfen

Für heiße Pfade nur für Setup bevorzugen Sie die engen Helper-Seams für Setup gegenüber der breiteren
übergeordneten `plugin-sdk/setup`-Oberfläche, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                        | Verwenden Sie ihn für                                                                  | Wichtige Exporte                                                                                                                                                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | laufzeitsichere Setup-Hilfen, die in `setupEntry` / beim verzögerten Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Account-Setup-Adapter                                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                          |
| `plugin-sdk/setup-tools`          | CLI-/Archiv-/Docs-Hilfen für Setup/Installation                                        | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Verwenden Sie die breitere Naht `plugin-sdk/setup`, wenn Sie die vollständige gemeinsame Setup-
Werkzeugkiste möchten, einschließlich Hilfen für Konfigurations-Patches wie
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import für den Hot Path sicher. Ihr gebündeltes
Lookup der Vertragsoberfläche für Single-Account-Promotion ist lazy, sodass das Importieren von
`plugin-sdk/setup-runtime` die Discovery der gebündelten Vertragsoberfläche nicht eager lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanal-eigene Single-Account-Promotion

Wenn ein Kanal von einer Top-Level-Konfiguration für ein einzelnes Konto auf
`channels.<id>.accounts.*` aktualisiert wird, verschiebt das standardmäßige gemeinsame Verhalten die
hochgestuften kontobezogenen Werte nach `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-
Vertragsoberfläche eingrenzen oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Top-Level-Schlüssel, die in das
  hochgestufte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn bereits benannte Konten existieren, werden nur diese
  Schlüssel in das hochgestufte Konto verschoben; gemeinsame Richtlinien-/Zustellungsschlüssel bleiben im
  Kanalstamm
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welches vorhandene Konto
  hochgestufte Werte erhält

Matrix ist das aktuelle gebündelte Beispiel. Wenn genau ein benanntes Matrix-Konto
bereits existiert oder wenn `defaultAccount` auf einen vorhandenen nichtkanonischen Schlüssel
wie `Ops` zeigt, bewahrt die Promotion dieses Konto, statt einen neuen Eintrag
`accounts.default` zu erzeugen.

## Konfigurationsschema

Die Plugin-Konfiguration wird gegen das JSON-Schema in Ihrem Manifest validiert. Benutzer
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

Für kanalspezifische Konfiguration verwenden Sie stattdessen den Kanal-Konfigurationsabschnitt:

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

Verwenden Sie `buildChannelConfigSchema` aus `openclaw/plugin-sdk/core`, um ein
Zod-Schema in den Wrapper `ChannelConfigSchema` zu konvertieren, den OpenClaw validiert:

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
Vollständige Beispiele finden Sie in gebündelten Plugin-Paketen (zum Beispiel im Discord-Plugin `src/channel.setup.ts`).

Für Abfragen der DM-Allowlist, die nur den Standardablauf
`note -> prompt -> parse -> merge -> patch` benötigen, bevorzugen Sie die gemeinsamen Setup-
Hilfen aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` und
`createNestedChannelParsedAllowFromPrompt(...)`.

Für Statusblöcke des Kanal-Setups, die sich nur durch Bezeichnungen, Werte und optionale
zusätzliche Zeilen unterscheiden, bevorzugen Sie `createStandardChannelSetupStatus(...)` aus
`openclaw/plugin-sdk/setup`, statt in jedem Plugin dasselbe `status`-Objekt
von Hand zu erstellen.

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
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` exportiert auch die Low-Level-Builder
`createOptionalChannelSetupAdapter(...)` und
`createOptionalChannelSetupWizard(...)`, wenn Sie nur eine Hälfte
dieser Oberfläche für optionale Installation benötigen.

Der erzeugte optionale Adapter/Assistent schlägt bei echten Konfigurationsschreibvorgängen fehlgeschlossen fehl. Er
verwendet eine einzige Meldung „Installation erforderlich“ über `validateInput`,
`applyAccountConfig` und `finalize` hinweg wieder und hängt einen Docs-Link an, wenn `docsPath`
gesetzt ist.

Für binär gestützte Setup-UIs bevorzugen Sie die gemeinsamen delegierten Hilfen, statt
denselben Binär-/Status-Klebstoff in jeden Kanal zu kopieren:

- `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur nach Bezeichnungen,
  Hinweisen, Werten und Binärerkennung unterscheiden
- `createCliPathTextInput(...)` für pfadgestützte Texteingaben
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und
  `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an einen
  schwereren vollständigen Assistenten weiterleiten muss
- `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur die Entscheidung
  `textInputs[*].shouldPrompt` delegieren muss

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

Es gibt keine passende Überschreibung `npm:`. Verwenden Sie die normale npm-Paketspezifikation, wenn Sie
nach dem ClawHub-Fallback den npm-Pfad wünschen:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins im Repository:** Platzieren Sie sie unter dem Workspace-Baum für gebündelte Plugins, dann werden sie beim Build automatisch
erkannt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Für Installationen aus npm führt `openclaw plugins install`
  `npm install --ignore-scripts` aus (keine Lifecycle-Skripte). Halten Sie die Abhängigkeits-
  Bäume von Plugins bei reinem JS/TS und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

## Verwandt

- [SDK Entry Points](/de/plugins/sdk-entrypoints) -- `definePluginEntry` und `defineChannelPluginEntry`
- [Plugin Manifest](/de/plugins/manifest) -- vollständige Manifest-Schemareferenz
- [Building Plugins](/de/plugins/building-plugins) -- Schritt-für-Schritt-Anleitung für den Einstieg
