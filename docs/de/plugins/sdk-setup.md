---
read_when:
    - Sie fügen einem Plugin einen Einrichtungsassistenten hinzu
    - Sie müssen den Unterschied zwischen setup-entry.ts und index.ts verstehen
    - Sie definieren Plugin-Konfigurationsschemas oder openclaw-Metadaten in package.json
sidebarTitle: Setup and config
summary: Einrichtungsassistenten, setup-entry.ts, Konfigurationsschemas und package.json-Metadaten
title: Plugin-Einrichtung und Konfiguration
x-i18n:
    generated_at: "2026-04-30T07:08:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste (`openclaw.plugin.json`), Setup-Einträge und Konfigurationsschemas.

<Tip>
**Suchen Sie eine Schritt-für-Schritt-Anleitung?** Die How-to-Anleitungen behandeln die Paketierung im Kontext: [Channel plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und [Provider plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
  Einstiegspunktdateien (relativ zum Paket-Root).
</ParamField>
<ParamField path="setupEntry" type="string">
  Leichter Einstieg nur für Setup (optional).
</ParamField>
<ParamField path="channel" type="object">
  Channel-Katalogmetadaten für Setup-, Picker-, Quickstart- und Status-Oberflächen.
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

`openclaw.channel` sind schlanke Paketmetadaten für Channel-Erkennung und Setup-Oberflächen, bevor die Runtime geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Channel-ID.                                                        |
| `label`                                | `string`   | Primäre Channel-Bezeichnung.                                                  |
| `selectionLabel`                       | `string`   | Picker-/Setup-Bezeichnung, wenn sie sich von `label` unterscheiden soll.      |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für umfangreichere Channel-Kataloge und Status-Oberflächen. |
| `docsPath`                             | `string`   | Dokumentationspfad für Setup- und Auswahllinks.                               |
| `docsLabel`                            | `string`   | Überschreibt die Bezeichnung für Dokumentationslinks, wenn sie sich von der Channel-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Onboarding-/Katalogbeschreibung.                                        |
| `order`                                | `number`   | Sortierreihenfolge in Channel-Katalogen.                                      |
| `aliases`                              | `string[]` | Zusätzliche Such-Aliasse für die Channel-Auswahl.                             |
| `preferOver`                           | `string[]` | Plugin-/Channel-IDs mit niedrigerer Priorität, die dieser Channel übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Icon-/Systembildname für Channel-UI-Kataloge.                      |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Dokumentationslinks in Auswahloberflächen.                     |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt in Auswahltexten den Dokumentationspfad direkt statt eines beschrifteten Dokumentationslinks an. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Zeichenfolgen, die im Auswahltext angehängt werden.         |
| `markdownCapable`                      | `boolean`  | Markiert den Channel als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Sichtbarkeitssteuerung des Channels für Setup, konfigurierte Listen und Dokumentationsoberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Bindet diesen Channel in den standardmäßigen Quickstart-Setup-Ablauf `allowFrom` ein. |
| `forceAccountBinding`                  | `boolean`  | Erfordert explizite Kontobindung, auch wenn nur ein Konto existiert.          |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt die Sitzungssuche beim Auflösen von Ankündigungszielen für diesen Channel. |

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

- `configured`: den Channel in konfigurierten/statusartigen Listenoberflächen aufnehmen
- `setup`: den Channel in interaktive Setup-/Konfigurations-Picker aufnehmen
- `docs`: den Channel in Dokumentations-/Navigationsoberflächen als öffentlich sichtbar markieren

<Note>
`showConfigured` und `showInSetup` bleiben als Legacy-Aliasse unterstützt. Bevorzugen Sie `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                  | Bedeutung                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanonische npm-Spezifikation für Installations-/Update-Abläufe.                  |
| `localPath`                  | `string`             | Lokaler Entwicklungs- oder gebündelter Installationspfad.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                       |
| `minHostVersion`             | `string`             | Minimal unterstützte OpenClaw-Version in der Form `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | Erwartete npm-Dist-Integritätszeichenfolge, üblicherweise `sha512-...`, für gepinnte Installationen. |
| `allowInvalidConfigRecovery` | `boolean`            | Ermöglicht gebündelten Plugin-Neuinstallationsabläufen, sich von bestimmten veralteten Konfigurationsfehlern zu erholen. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interaktives Onboarding verwendet `openclaw.install` ebenfalls für Install-on-Demand-Oberflächen. Wenn Ihr Plugin Provider-Authentifizierungsoptionen oder Channel-Setup-/Katalogmetadaten offenlegt, bevor die Runtime geladen wird, kann das Onboarding diese Auswahl anzeigen, nach npm- oder lokaler Installation fragen, das Plugin installieren oder aktivieren und dann mit dem ausgewählten Ablauf fortfahren. npm-Onboarding-Auswahlen erfordern vertrauenswürdige Katalogmetadaten mit einer Registry-`npmSpec`; exakte Versionen und `expectedIntegrity` sind optionale Pins. Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Abläufe sie. Bewahren Sie die Metadaten dazu, „was angezeigt werden soll“, in `openclaw.plugin.json` auf und die Metadaten dazu, „wie es installiert wird“, in `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Wenn `minHostVersion` gesetzt ist, erzwingen sowohl Installation als auch Manifest-Registry-Laden diese Version. Ältere Hosts überspringen das Plugin; ungültige Versionszeichenfolgen werden abgelehnt.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Für gepinnte npm-Installationen behalten Sie die exakte Version in `npmSpec` bei und fügen die erwartete Artefaktintegrität hinzu:

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
    `allowInvalidConfigRecovery` ist keine allgemeine Umgehung für defekte Konfigurationen. Es ist nur für die gezielte Wiederherstellung gebündelter Plugins gedacht, damit Neuinstallation/Setup bekannte Upgrade-Reste wie einen fehlenden gebündelten Plugin-Pfad oder einen veralteten `channels.<id>`-Eintrag für dasselbe Plugin reparieren können. Wenn die Konfiguration aus anderen Gründen defekt ist, schlägt die Installation weiterhin geschlossen fehl und weist den Operator an, `openclaw doctor --fix` auszuführen.
  </Accordion>
</AccordionGroup>

### Verzögertes vollständiges Laden

Channel-Plugins können verzögertes Laden aktivieren mit:

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

Wenn aktiviert, lädt OpenClaw während der Startphase vor dem Lauschen nur `setupEntry`, selbst für bereits konfigurierte Channels. Der vollständige Einstieg wird geladen, nachdem das Gateway begonnen hat zu lauschen.

<Warning>
Aktivieren Sie verzögertes Laden nur, wenn Ihr `setupEntry` alles registriert, was das Gateway benötigt, bevor es mit dem Lauschen beginnt (Channel-Registrierung, HTTP-Routen, Gateway-Methoden). Wenn der vollständige Einstieg erforderliche Startfunktionen besitzt, behalten Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/vollständiger Einstieg Gateway-RPC-Methoden registriert, halten Sie sie unter einem Plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben Core-eigen und werden immer zu `operator.admin` aufgelöst.

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

Fügen Sie für Channel-Plugins `kind` und `channels` hinzu:

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

## Setup-Einstieg

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die OpenClaw lädt, wenn es nur Setup-Oberflächen benötigt (Onboarding, Konfigurationsreparatur, Prüfung deaktivierter Channels).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, dass umfangreicher Laufzeitcode (Kryptobibliotheken, CLI-Registrierungen, Hintergrunddienste) während Einrichtungsabläufen geladen wird.

Gebündelte Workspace-Kanäle, die einrichtungssichere Exporte in Sidecar-Modulen halten, können `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` anstelle von `defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Vertrag unterstützt außerdem einen optionalen `runtime`-Export, damit die Laufzeit-Anbindung zur Einrichtungszeit schlank und explizit bleiben kann.

<AccordionGroup>
  <Accordion title="Wann OpenClaw setupEntry statt des vollständigen Eintrags verwendet">
    - Der Kanal ist deaktiviert, benötigt aber Einrichtungs-/Onboarding-Oberflächen.
    - Der Kanal ist aktiviert, aber nicht konfiguriert.
    - Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Was setupEntry registrieren muss">
    - Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`).
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

### Schmale Importe für Einrichtungshelfer

Für heiße reine Einrichtungspfade bevorzugen Sie die schmalen Einrichtungshilfs-Schnittstellen gegenüber dem breiteren `plugin-sdk/setup`-Umbrella, wenn Sie nur einen Teil der Einrichtungsoberfläche benötigen:

| Importpfad                         | Verwenden für                                                                            | Wichtige Exporte                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Laufzeithelfer zur Einrichtungszeit, die in `setupEntry` / verzögertem Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Adapter für die Konto-Einrichtung                                      | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | Helfer für Einrichtung/Installation per CLI/Archiv/Dokumentation                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Verwenden Sie die breitere Schnittstelle `plugin-sdk/setup`, wenn Sie die vollständige gemeinsame Einrichtungs-Toolbox benötigen, einschließlich Config-Patch-Helfern wie `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import für heiße Pfade sicher. Ihre gebündelte Vertragsschnittstellen-Suche für die Hochstufung von Einzelkonten ist lazy, sodass der Import von `plugin-sdk/setup-runtime` die Erkennung gebündelter Vertragsschnittstellen nicht vorab lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanalgesteuerte Hochstufung von Einzelkonten

Wenn ein Kanal von einer Top-Level-Konfiguration für ein einzelnes Konto auf `channels.<id>.accounts.*` aktualisiert wird, verschiebt das standardmäßige gemeinsame Verhalten hochgestufte kontobezogene Werte nach `accounts.default`.

Gebündelte Kanäle können diese Hochstufung über ihre Einrichtungsvertragsschnittstelle einschränken oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Top-Level-Schlüssel, die in das hochgestufte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Konten bereits existieren, werden nur diese Schlüssel in das hochgestufte Konto verschoben; gemeinsame Richtlinien-/Zustellschlüssel bleiben am Kanalstamm
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welches bestehende Konto hochgestufte Werte erhält

<Note>
Matrix ist das aktuelle gebündelte Beispiel. Wenn bereits genau ein benanntes Matrix-Konto existiert oder wenn `defaultAccount` auf einen vorhandenen nicht-kanonischen Schlüssel wie `Ops` verweist, behält die Hochstufung dieses Konto bei, anstatt einen neuen Eintrag `accounts.default` zu erstellen.
</Note>

## Config-Schema

Die Plugin-Config wird gegen das JSON Schema in Ihrem Manifest validiert. Benutzer konfigurieren Plugins über:

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

Ihr Plugin erhält diese Config während der Registrierung als `api.pluginConfig`.

Für kanalspezifische Config verwenden Sie stattdessen den Kanal-Config-Abschnitt:

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

### Kanal-Config-Schemata erstellen

Verwenden Sie `buildChannelConfigSchema`, um ein Zod-Schema in den `ChannelConfigSchema`-Wrapper zu konvertieren, der von Plugin-eigenen Config-Artefakten verwendet wird:

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

Für Drittanbieter-Plugins bleibt der Cold-Path-Vertrag weiterhin das Plugin-Manifest: Spiegeln Sie das generierte JSON Schema nach `openclaw.plugin.json#channelConfigs`, damit Config-Schema, Einrichtung und UI-Oberflächen `channels.<id>` prüfen können, ohne Laufzeitcode zu laden.

## Einrichtungsassistenten

Kanal-Plugins können interaktive Einrichtungsassistenten für `openclaw onboard` bereitstellen. Der Assistent ist ein `ChannelSetupWizard`-Objekt auf dem `ChannelPlugin`:

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
  <Accordion title="Gemeinsame allowFrom-Eingabeaufforderungen">
    Für DM-Allowlist-Eingabeaufforderungen, die nur den Standardablauf `note -> prompt -> parse -> merge -> patch` benötigen, bevorzugen Sie die gemeinsamen Einrichtungshelfer aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` und `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardstatus der Kanaleinrichtung">
    Für Statusblöcke der Kanaleinrichtung, die sich nur durch Labels, Bewertungen und optionale zusätzliche Zeilen unterscheiden, bevorzugen Sie `createStandardChannelSetupStatus(...)` aus `openclaw/plugin-sdk/setup`, anstatt in jedem Plugin dasselbe `status`-Objekt manuell zu erstellen.
  </Accordion>
  <Accordion title="Optionale Oberfläche für die Kanaleinrichtung">
    Für optionale Einrichtungsoberflächen, die nur in bestimmten Kontexten erscheinen sollen, verwenden Sie `createOptionalChannelSetupSurface` aus `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` stellt außerdem die Low-Level-Builder `createOptionalChannelSetupAdapter(...)` und `createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte dieser optionalen Installationsoberfläche benötigen.

    Der generierte optionale Adapter/Assistent schlägt bei echten Config-Schreibvorgängen geschlossen fehl. Er verwendet dieselbe Installations-erforderlich-Meldung über `validateInput`, `applyAccountConfig` und `finalize` hinweg erneut und hängt einen Dokumentationslink an, wenn `docsPath` gesetzt ist.

  </Accordion>
  <Accordion title="Binärdateibasierte Einrichtungshelfer">
    Für binärdateibasierte Einrichtungs-UIs bevorzugen Sie die gemeinsamen delegierten Helfer, anstatt dieselbe Binärdatei-/Status-Verklebung in jeden Kanal zu kopieren:

    - `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur durch Labels, Hinweise, Bewertungen und Binärdateierkennung unterscheiden
    - `createCliPathTextInput(...)` für pfadbasierte Texteingaben
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an einen umfangreicheren vollständigen Assistenten weiterleiten muss
    - `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur eine Entscheidung für `textInputs[*].shouldPrompt` delegieren muss

  </Accordion>
</AccordionGroup>

## Veröffentlichen und installieren

**Externe Plugins:** Veröffentlichen Sie auf [ClawHub](/de/tools/clawhub), dann installieren Sie:

<Tabs>
  <Tab title="Auto (zuerst ClawHub, dann npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw versucht zuerst ClawHub und fällt automatisch auf npm zurück.

  </Tab>
  <Tab title="Nur ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm-Paketspezifikation">
    Verwenden Sie npm, wenn ein Paket noch nicht nach ClawHub verschoben wurde oder wenn Sie während einer Migration einen
    direkten npm-Installationspfad benötigen:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins im Repository:** Legen Sie sie unter dem Workspace-Baum der gebündelten Plugins ab; sie werden während des Builds automatisch erkannt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Für Installationen aus npm führt `openclaw plugins install` ein projektlokales `npm install --ignore-scripts` aus (keine Lifecycle-Skripte) und ignoriert dabei geerbte globale npm-Installationseinstellungen. Halten Sie Plugin-Abhängigkeitsbäume rein JS/TS und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

<Note>
Gebündelte OpenClaw-eigene Plugins sind die einzige Ausnahme für Reparaturen beim Start: Wenn eine paketierte Installation ein solches Plugin über die Plugin-Konfiguration, eine Legacy-Kanalkonfiguration oder sein gebündeltes, standardmäßig aktiviertes Manifest aktiviert sieht, installiert der Startvorgang die fehlenden Runtime-Abhängigkeiten dieses Plugins vor dem Import. Betreiber können diese Phase mit `openclaw plugins deps` prüfen oder reparieren. Drittanbieter-Plugins sollten sich nicht auf Installationen beim Start verlassen; verwenden Sie weiterhin den expliziten Plugin-Installer.
</Note>

Gebündelte Runtime-Abhängigkeiten auf Paketebene sind explizite Metadaten und werden beim Gateway-Start nicht aus dem gebauten JavaScript abgeleitet. Wenn eine gemeinsam genutzte OpenClaw-Root-Abhängigkeit im externen Runtime-Spiegel für gebündelte Plugins verfügbar sein muss, deklarieren Sie sie im Root-Paketmanifest unter `openclaw.bundle.mirroredRootRuntimeDependencies`.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) — Schritt-für-Schritt-Einstiegsleitfaden
- [Plugin-Manifest](/de/plugins/manifest) — vollständige Referenz zum Manifest-Schema
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — `definePluginEntry` und `defineChannelPluginEntry`
