---
read_when:
    - Sie fügen einem Plugin einen Setup-Wizard zu einem Plugin hinzu
    - Sie müssen `setup-entry.ts` im Vergleich zu `index.ts` verstehen
    - Sie definieren Plugin-Konfigurationsschemas oder `package.json`-Metadaten für `openclaw`
sidebarTitle: Setup and Config
summary: Setup-Wizards, `setup-entry.ts`, Konfigurationsschemas und `package.json`-Metadaten
title: Plugin-Setup und -Konfiguration
x-i18n:
    generated_at: "2026-04-25T13:53:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referenz für Plugin-Packaging (`package.json`-Metadaten), Manifeste
(`openclaw.plugin.json`), Setup-Einträge und Konfigurationsschemas.

<Tip>
  **Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Die How-to-Guides behandeln Packaging im Kontext:
  [Channel Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und
  [Provider Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paketmetadaten

Ihr `package.json` benötigt ein Feld `openclaw`, das dem Plugin-System mitteilt, was
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
      "blurb": "Kurze Beschreibung des Kanals."
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

Wenn Sie das Plugin extern in ClawHub veröffentlichen, sind diese Felder `compat` und `build`
erforderlich. Die kanonischen Publish-Snippets befinden sich in
`docs/snippets/plugin-publish/`.

### `openclaw`-Felder

| Feld         | Typ        | Beschreibung                                                                                                                 |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Entry-Point-Dateien (relativ zur Paket-Root)                                                                                 |
| `setupEntry` | `string`   | Leichtgewichtiger Einstiegspunkt nur für Setup (optional)                                                                    |
| `channel`    | `object`   | Kanalkatalog-Metadaten für Setup, Picker, Quickstart und Statusoberflächen                                                   |
| `providers`  | `string[]` | Provider-IDs, die von diesem Plugin registriert werden                                                                       |
| `install`    | `object`   | Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags für Startverhalten                                                                                                     |

### `openclaw.channel`

`openclaw.channel` sind günstige Paketmetadaten für die Erkennung von Kanälen und
Setup-Oberflächen, bevor die Runtime geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                          |
| `label`                                | `string`   | Primäres Kanallabel.                                                          |
| `selectionLabel`                       | `string`   | Picker-/Setup-Label, wenn es sich von `label` unterscheiden soll.             |
| `detailLabel`                          | `string`   | Sekundäres Detail-Label für reichhaltigere Kanalkataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Doku-Pfad für Setup- und Auswahl-Links.                                       |
| `docsLabel`                            | `string`   | Überschreibt das für Doku-Links verwendete Label, wenn es sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Beschreibung für Onboarding/Katalog.                                    |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                         |
| `aliases`                              | `string[]` | Zusätzliche Lookup-Aliasse für die Kanalauswahl.                              |
| `preferOver`                           | `string[]` | Plugin-/Kanal-IDs niedrigerer Priorität, die dieser Kanal übertreffen soll.   |
| `systemImage`                          | `string`   | Optionaler Icon-/System-Image-Name für Kanal-UI-Kataloge.                     |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Doku-Links in Auswahloberflächen.                              |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt den Doku-Pfad direkt statt eines beschrifteten Doku-Links im Auswahltext. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Strings, die im Auswahltext angehängt werden.               |
| `markdownCapable`                      | `boolean`  | Markiert den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Sichtbarkeitssteuerung des Kanals für Setup, konfigurierte Listen und Doku-Oberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Kanal in den Standard-Quickstart-Flow `allowFrom` auf.           |
| `forceAccountBinding`                  | `boolean`  | Verlangt explizite Kontobindung, auch wenn nur ein Konto existiert.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt Session-Lookup, wenn Ankündigungsziele für diesen Kanal aufgelöst werden. |

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
      "blurb": "Webhook-basierte selbstgehostete Chat-Integration.",
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

- `configured`: den Kanal in Oberflächen zur Auflistung konfigurierter/statusartiger Kanäle einbeziehen
- `setup`: den Kanal in interaktive Setup-/Configure-Picker einbeziehen
- `docs`: den Kanal in Doku-/Navigationsoberflächen als öffentlich kennzeichnen

`showConfigured` und `showInSetup` werden weiterhin als veraltete Aliasse unterstützt. Bevorzugen
Sie `exposure`.

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifest-Metadaten.

| Feld                         | Typ                  | Bedeutung                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanonische npm-Spezifikation für Installations-/Update-Flows.                    |
| `localPath`                  | `string`             | Lokaler Entwicklungspfad oder Pfad für gebündelte Installation.                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                       |
| `minHostVersion`             | `string`             | Minimal unterstützte OpenClaw-Version im Format `>=x.y.z`.                       |
| `expectedIntegrity`          | `string`             | Erwartete npm-dist-Integritätszeichenfolge, normalerweise `sha512-...`, für gepinnte Installationen. |
| `allowInvalidConfigRecovery` | `boolean`            | Erlaubt Flows zum Neuinstallieren gebündelter Plugins, bestimmte Fehler durch veraltete Konfiguration zu beheben. |

Interaktives Onboarding verwendet `openclaw.install` auch für Oberflächen zur Installation bei Bedarf.
Wenn Ihr Plugin Provider-Auth-Choices oder Setup-/Katalogmetadaten für Kanäle bereitstellt, bevor die Runtime geladen wird, kann das Onboarding diese Auswahl anzeigen, nach npm vs. lokal fragen, das Plugin installieren oder aktivieren und dann den ausgewählten
Flow fortsetzen. npm-Onboarding-Choices erfordern vertrauenswürdige Katalogmetadaten mit einer Registry-
`npmSpec`; exakte Versionen und `expectedIntegrity` sind optionale Pins. Wenn
`expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Flows diese. Halten Sie die
Metadaten „was angezeigt werden soll“ in `openclaw.plugin.json` und die
Metadaten „wie es installiert werden soll“ in `package.json`.

Wenn `minHostVersion` gesetzt ist, erzwingen sowohl Installation als auch Laden der Manifest-Registry
diese. Ältere Hosts überspringen das Plugin; ungültige Versionszeichenfolgen werden abgewiesen.

Für gepinnte npm-Installationen behalten Sie die exakte Version in `npmSpec` bei und fügen die
erwartete Artefakt-Integrität hinzu:

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

`allowInvalidConfigRecovery` ist kein allgemeiner Bypass für kaputte Konfigurationen. Es ist
nur für die enge Wiederherstellung gebündelter Plugins gedacht, sodass Neuinstallation/Setup bekannte
Upgrade-Altlasten wie einen fehlenden Pfad zu einem gebündelten Plugin oder einen veralteten Eintrag
`channels.<id>` für dasselbe Plugin reparieren kann. Wenn die Konfiguration aus anderen Gründen kaputt ist,
scheitert die Installation weiterhin fail-closed und fordert den Operator auf, `openclaw doctor --fix` auszuführen.

### Verzögertes vollständiges Laden

Kanal-Plugins können sich für verzögertes Laden entscheiden mit:

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

Wenn dies aktiviert ist, lädt OpenClaw während der Startphase vor dem Listen nur `setupEntry`,
selbst für bereits konfigurierte Kanäle. Der vollständige Einstiegspunkt wird nach dem
Beginn des Listen des Gateway geladen.

<Warning>
  Aktivieren Sie verzögertes Laden nur dann, wenn Ihr `setupEntry` alles registriert, was das
  Gateway benötigt, bevor es mit dem Listen beginnt (Kanalregistrierung, HTTP-Routen,
  Gateway-Methoden). Wenn der vollständige Einstiegspunkt erforderliche Start-Capabilities besitzt, behalten
  Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/Voll-Einstiegspunkt Gateway-RPC-Methoden registriert, halten Sie diese auf einem
plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben im Besitz des Core und lösen immer
zu `operator.admin` auf.

## Plugin-Manifest

Jedes native Plugin muss im Paket-Root eine `openclaw.plugin.json` mitliefern.
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

Fügen Sie bei Kanal-Plugins `kind` und `channels` hinzu:

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

Siehe [Plugin Manifest](/de/plugins/manifest) für die vollständige Referenz zum Schema.

## ClawHub-Veröffentlichung

Für Plugin-Pakete verwenden Sie den paketbezogenen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Der veraltete Publish-Alias nur für Skills ist für Skills gedacht. Plugin-Pakete sollten
immer `clawhub package publish` verwenden.

## Setup-Einstiegspunkt

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die
OpenClaw lädt, wenn es nur Setup-Oberflächen benötigt (Onboarding, Konfigurationsreparatur,
Prüfung deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, während Setup-Flows schweren Runtime-Code zu laden (Kryptobibliotheken, CLI-Registrierungen,
Hintergrunddienste).

Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Modulen behalten, können
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` statt
`defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Vertrag unterstützt außerdem einen optionalen
Export `runtime`, damit die Runtime-Verdrahtung zur Setup-Zeit leichtgewichtig und explizit bleiben kann.

**Wann OpenClaw `setupEntry` statt des vollständigen Einstiegspunkts verwendet:**

- Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen
- Der Kanal ist aktiviert, aber nicht konfiguriert
- Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Was `setupEntry` registrieren muss:**

- Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`)
- Alle HTTP-Routen, die vor dem Listen des Gateway erforderlich sind
- Alle Gateway-Methoden, die während des Starts benötigt werden

Diese Gateway-Methoden beim Start sollten weiterhin reservierte Core-Admin-
Namespaces wie `config.*` oder `update.*` vermeiden.

**Was `setupEntry` NICHT enthalten sollte:**

- CLI-Registrierungen
- Hintergrunddienste
- Schwere Runtime-Imports (Krypto, SDKs)
- Gateway-Methoden, die erst nach dem Start benötigt werden

### Schmale Importpfade für Setup-Helfer

Für heiße Setup-only-Pfade bevorzugen Sie die schmalen Nähte der Setup-Helfer statt des breiteren
Umbrella-Moduls `plugin-sdk/setup`, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                        | Verwenden Sie ihn für                                                                  | Zentrale Exporte                                                                                                                                                                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | Runtime-Helfer zur Setup-Zeit, die in `setupEntry` / beim verzögerten Start von Kanälen verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Adapter für Konto-Setup                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`          | CLI-/Archiv-/Doku-Helfer für Setup/Installation                                        | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Verwenden Sie die breitere Naht `plugin-sdk/setup`, wenn Sie die vollständige gemeinsame Setup-
Toolbox möchten, einschließlich Helfern für Config-Patches wie
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben auf dem heißen Pfad beim Import sicher. Ihr Lookup der gebündelten
Contract-Oberfläche für Promotion von Einzelkonten ist lazy, sodass der Import von
`plugin-sdk/setup-runtime` die Discovery der gebündelten Contract-Oberfläche nicht vorzeitig lädt,
bevor der Adapter tatsächlich verwendet wird.

### Kanal-eigene Promotion von Einzelkonten

Wenn ein Kanal von einer Einzelkonto-Konfiguration auf Top-Level auf
`channels.<id>.accounts.*` aktualisiert wird, verschiebt das gemeinsame Standardverhalten hochgestufte
kontobezogene Werte nach `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-
Contract-Oberfläche eingrenzen oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Top-Level-Schlüssel, die in das
  hochgestufte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Konten bereits existieren, werden nur diese
  Schlüssel in das hochgestufte Konto verschoben; gemeinsame Richtlinien-/Zustellschlüssel bleiben in der Kanal-Root
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welches vorhandene Konto
  hochgestufte Werte erhält

Matrix ist das aktuelle gebündelte Beispiel. Wenn genau ein benanntes Matrix-Konto
bereits existiert oder wenn `defaultAccount` auf einen vorhandenen nicht kanonischen Schlüssel
wie `Ops` zeigt, behält die Promotion dieses Konto bei, statt einen neuen
Eintrag `accounts.default` zu erstellen.

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

Ihr Plugin erhält diese Konfiguration bei der Registrierung als `api.pluginConfig`.

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

### Konfigurationsschemas für Kanäle aufbauen

Verwenden Sie `buildChannelConfigSchema`, um ein Zod-Schema in den
Wrapper `ChannelConfigSchema` umzuwandeln, der von plugin-eigenen Konfigurationsartefakten verwendet wird:

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

Für Drittanbieter-Plugins ist der Vertrag auf dem kalten Pfad weiterhin das Plugin-Manifest:
Spiegeln Sie das generierte JSON-Schema in `openclaw.plugin.json#channelConfigs`, damit
Konfigurationsschema-, Setup- und UI-Oberflächen `channels.<id>` prüfen können, ohne
Runtime-Code zu laden.

## Setup-Wizards

Kanal-Plugins können interaktive Setup-Wizards für `openclaw onboard` bereitstellen.
Der Wizard ist ein Objekt `ChannelSetupWizard` auf dem `ChannelPlugin`:

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

Für Statusblöcke in der Kanal-Setup-Oberfläche, die sich nur nach Labels, Scores und optionalen
Zusatzzeilen unterscheiden, bevorzugen Sie `createStandardChannelSetupStatus(...)` aus
`openclaw/plugin-sdk/setup`, statt in jedem Plugin dasselbe Objekt `status` manuell zu bauen.

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

`plugin-sdk/channel-setup` stellt außerdem die tieferliegenden Builder
`createOptionalChannelSetupAdapter(...)` und
`createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte
dieser optionalen Installationsoberfläche benötigen.

Der generierte optionale Adapter/Wizard scheitert bei echten Konfigurationsschreibvorgängen fail-closed. Sie
verwenden eine gemeinsame Meldung „Installation erforderlich“ wieder für `validateInput`,
`applyAccountConfig` und `finalize` und hängen einen Doku-Link an, wenn `docsPath` gesetzt ist.

Für binärgestützte Setup-UIs bevorzugen Sie die gemeinsamen delegierten Helfer, statt
denselben Code für Binärstatus in jeden Kanal zu kopieren:

- `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur nach Labels,
  Hinweisen, Scores und Binärerkennung unterscheiden
- `createCliPathTextInput(...)` für pfadgestützte Texteingaben
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und
  `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an
  einen schwereren vollständigen Wizard weiterleiten muss
- `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur die
  Entscheidung `textInputs[*].shouldPrompt` delegieren muss

## Veröffentlichen und Installieren

**Externe Plugins:** in [ClawHub](/de/tools/clawhub) oder npm veröffentlichen, dann installieren:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw versucht zuerst ClawHub und fällt dann automatisch auf npm zurück. Sie können ClawHub auch
explizit erzwingen:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # nur ClawHub
```

Es gibt kein entsprechendes Override `npm:`. Verwenden Sie die normale npm-Paketspezifikation, wenn Sie
nach dem ClawHub-Fallback den npm-Pfad möchten:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Repo-interne Plugins:** unter dem Workspace-Baum für gebündelte Plugins ablegen, dann werden sie während des Builds automatisch
entdeckt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Für Installationen aus npm führt `openclaw plugins install`
  `npm install --ignore-scripts` aus (keine Lifecycle-Skripte). Halten Sie Bäume von Plugin-Abhängigkeiten
  rein in JS/TS und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

Gebündelte, OpenClaw-eigene Plugins sind die einzige Ausnahme für Reparaturen beim Start: Wenn eine
paketierte Installation eines davon durch Plugin-Konfiguration, veraltete Kanalkonfiguration oder
sein gebündeltes standardmäßig aktiviertes Manifest als aktiviert erkennt, installiert der Start die fehlenden
Runtime-Abhängigkeiten dieses Plugins vor dem Import. Drittanbieter-Plugins sollten sich
nicht auf Installationen beim Start verlassen; verwenden Sie weiterhin den expliziten Plugin-Installer.

## Verwandt

- [SDK entry points](/de/plugins/sdk-entrypoints) — `definePluginEntry` und `defineChannelPluginEntry`
- [Plugin manifest](/de/plugins/manifest) — vollständige Referenz zum Manifest-Schema
- [Building plugins](/de/plugins/building-plugins) — Schritt-für-Schritt-Guide für den Einstieg
