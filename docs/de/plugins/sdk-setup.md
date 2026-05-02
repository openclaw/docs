---
read_when:
    - Sie fügen einem Plugin einen Einrichtungsassistenten hinzu
    - Sie müssen setup-entry.ts im Vergleich zu index.ts verstehen.
    - Sie definieren Plugin-Konfigurationsschemas oder openclaw-Metadaten in package.json
sidebarTitle: Setup and config
summary: Einrichtungsassistenten, setup-entry.ts, Konfigurationsschemas und package.json-Metadaten
title: Plugin-Einrichtung und -Konfiguration
x-i18n:
    generated_at: "2026-05-02T06:42:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste (`openclaw.plugin.json`), Setup-Einträge und Konfigurationsschemas.

<Tip>
**Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Die How-to-Anleitungen behandeln die Paketierung im Kontext: [Kanal-Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
  <Tab title="Provider-Plugin / ClawHub-Baseline">
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
Wenn Sie das Plugin extern auf ClawHub veröffentlichen, sind diese `compat`- und `build`-Felder erforderlich. Die kanonischen Veröffentlichungssnippets befinden sich in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-Felder

<ParamField path="extensions" type="string[]">
  Einstiegspunktdateien (relativ zum Paketstamm).
</ParamField>
<ParamField path="setupEntry" type="string">
  Schlanker Einstieg nur für das Setup (optional).
</ParamField>
<ParamField path="channel" type="object">
  Kanalkatalog-Metadaten für Setup-, Auswahl-, Schnellstart- und Statusoberflächen.
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

`openclaw.channel` sind schlanke Paketmetadaten für Kanalerkennung und Setup-Oberflächen, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                          |
| `label`                                | `string`   | Primäre Kanalbezeichnung.                                                     |
| `selectionLabel`                       | `string`   | Auswahl-/Setup-Bezeichnung, wenn sie sich von `label` unterscheiden soll.     |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für umfangreichere Kanalkataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Dokumentationspfad für Setup- und Auswahllinks.                               |
| `docsLabel`                            | `string`   | Überschreibt die für Dokumentationslinks verwendete Bezeichnung, wenn sie sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Beschreibung für Onboarding/Katalog.                                    |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                         |
| `aliases`                              | `string[]` | Zusätzliche Such-Aliasse für die Kanalauswahl.                                |
| `preferOver`                           | `string[]` | Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Kanal übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Icon-/Systembildname für Kanal-UI-Kataloge.                        |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Dokumentationslinks in Auswahloberflächen.                     |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt den Dokumentationspfad direkt statt eines beschrifteten Dokumentationslinks im Auswahltext an. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Zeichenfolgen, die dem Auswahltext angehängt werden.        |
| `markdownCapable`                      | `boolean`  | Kennzeichnet den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Steuerung der Kanalsichtbarkeit für Setup, konfigurierte Listen und Dokumentationsoberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Kanal in den standardmäßigen Schnellstart-Setup-Ablauf `allowFrom` auf. |
| `forceAccountBinding`                  | `boolean`  | Erfordert explizite Kontobindung, auch wenn nur ein Konto vorhanden ist.      |
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

- `configured`: den Kanal in konfigurierten/statusartigen Listenoberflächen einschließen
- `setup`: den Kanal in interaktive Setup-/Konfigurationsauswahlen einschließen
- `docs`: den Kanal in Dokumentations-/Navigationsoberflächen als öffentlich sichtbar markieren

<Note>
`showConfigured` und `showInSetup` werden weiterhin als Legacy-Aliasse unterstützt. Bevorzugen Sie `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                  | Bedeutung                                                                         |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanonische npm-Spezifikation für Installations-/Update-Abläufe.                   |
| `localPath`                  | `string`             | Lokaler Entwicklungs- oder gebündelter Installationspfad.                         |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                        |
| `minHostVersion`             | `string`             | Minimal unterstützte OpenClaw-Version in der Form `>=x.y.z` oder `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`             | Erwartete npm-Dist-Integritätszeichenfolge, normalerweise `sha512-...`, für gepinnte Installationen. |
| `allowInvalidConfigRecovery` | `boolean`            | Ermöglicht gebündelten Plugin-Neuinstallationsabläufen die Wiederherstellung nach bestimmten veralteten Konfigurationsfehlern. |

<AccordionGroup>
  <Accordion title="Onboarding-Verhalten">
    Interaktives Onboarding verwendet `openclaw.install` auch für Install-on-Demand-Oberflächen. Wenn Ihr Plugin Provider-Authentifizierungsoptionen oder Kanal-Setup-/Katalogmetadaten bereitstellt, bevor die Laufzeit geladen wird, kann das Onboarding diese Auswahl anzeigen, nach npm- oder lokaler Installation fragen, das Plugin installieren oder aktivieren und dann den ausgewählten Ablauf fortsetzen. npm-Onboarding-Auswahlen erfordern vertrauenswürdige Katalogmetadaten mit einer Registry-`npmSpec`; exakte Versionen und `expectedIntegrity` sind optionale Pins. Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Abläufe dies. Bewahren Sie die „was angezeigt werden soll“-Metadaten in `openclaw.plugin.json` und die „wie es installiert wird“-Metadaten in `package.json` auf.
  </Accordion>
  <Accordion title="Erzwingung von minHostVersion">
    Wenn `minHostVersion` festgelegt ist, erzwingen sowohl Installation als auch das Laden der nicht gebündelten Manifest-Registry diese Version. Ältere Hosts überspringen externe Plugins; ungültige Versionszeichenfolgen werden abgelehnt. Gebündelte Quell-Plugins werden als mit dem Host-Checkout mitversioniert angenommen.
  </Accordion>
  <Accordion title="Gepinnte npm-Installationen">
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
  <Accordion title="Geltungsbereich von allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` ist keine allgemeine Umgehung für fehlerhafte Konfigurationen. Es dient nur der engen Wiederherstellung gebündelter Plugins, damit Neuinstallation/Setup bekannte Upgrade-Reste wie einen fehlenden gebündelten Plugin-Pfad oder einen veralteten `channels.<id>`-Eintrag für dasselbe Plugin reparieren können. Wenn die Konfiguration aus anderen Gründen fehlerhaft ist, schlägt die Installation weiterhin geschlossen fehl und weist den Operator an, `openclaw doctor --fix` auszuführen.
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

Wenn aktiviert, lädt OpenClaw während der Startphase vor dem Listen nur `setupEntry`, selbst für bereits konfigurierte Kanäle. Der vollständige Eintrag wird geladen, nachdem der Gateway mit dem Lauschen beginnt.

<Warning>
Aktivieren Sie verzögertes Laden nur, wenn Ihr `setupEntry` alles registriert, was der Gateway benötigt, bevor er mit dem Lauschen beginnt (Kanalregistrierung, HTTP-Routen, Gateway-Methoden). Wenn der vollständige Eintrag erforderliche Startfunktionen besitzt, behalten Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/vollständiger Eintrag Gateway-RPC-Methoden registriert, behalten Sie diese unter einem Plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben Core-eigen und werden immer zu `operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss eine `openclaw.plugin.json` im Paketstamm ausliefern. OpenClaw verwendet diese Datei, um die Konfiguration zu validieren, ohne Plugin-Code auszuführen.

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

## Setup-Eintrag

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die OpenClaw lädt, wenn nur Setup-Oberflächen benötigt werden (Onboarding, Config-Reparatur, Inspektion deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, dass schwergewichtiger Runtime-Code (Kryptobibliotheken, CLI-Registrierungen, Hintergrunddienste) während Setup-Abläufen geladen wird.

Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Modulen halten, können `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` statt `defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Vertrag unterstützt außerdem einen optionalen `runtime`-Export, damit die Runtime-Verdrahtung zur Setup-Zeit leichtgewichtig und explizit bleibt.

<AccordionGroup>
  <Accordion title="Wann OpenClaw setupEntry statt des vollständigen Entry verwendet">
    - Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen.
    - Der Kanal ist aktiviert, aber nicht konfiguriert.
    - Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Was setupEntry registrieren muss">
    - Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`).
    - Alle HTTP-Routen, die vor dem Gateway-Listen benötigt werden.
    - Alle Gateway-Methoden, die während des Starts benötigt werden.

    Diese Gateway-Startmethoden sollten weiterhin reservierte Core-Admin-Namespaces wie `config.*` oder `update.*` vermeiden.

  </Accordion>
  <Accordion title="Was setupEntry NICHT enthalten sollte">
    - CLI-Registrierungen.
    - Hintergrunddienste.
    - Schwergewichtige Runtime-Importe (Krypto, SDKs).
    - Gateway-Methoden, die erst nach dem Start benötigt werden.

  </Accordion>
</AccordionGroup>

### Schmale Setup-Hilfsimporte

Für heiße reine Setup-Pfade sollten Sie die schmalen Setup-Hilfsseams dem breiteren Umbrella `plugin-sdk/setup` vorziehen, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                        | Verwendung für                                                                                | Wichtige Exporte                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Runtime-Helfer zur Setup-Zeit, die in `setupEntry` / beim verzögerten Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Adapter für Konto-Setup                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | Helfer für Setup-/Installations-CLI, Archive und Dokumentation                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Verwenden Sie den breiteren Seam `plugin-sdk/setup`, wenn Sie die vollständige gemeinsame Setup-Toolbox wünschen, einschließlich Config-Patch-Helfern wie `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import hot-path-sicher. Ihre gebündelte Vertrag-Oberflächen-Suche für die Promotion einzelner Konten ist lazy, sodass der Import von `plugin-sdk/setup-runtime` die gebündelte Vertrag-Oberflächen-Discovery nicht vorzeitig lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanalverwaltete Promotion einzelner Konten

Wenn ein Kanal von einer Top-Level-Config mit einem einzelnen Konto auf `channels.<id>.accounts.*` aktualisiert, verschiebt das gemeinsame Standardverhalten die promoteten kontobezogenen Werte nach `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-Vertrag-Oberfläche einschränken oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Top-Level-Schlüssel, die in das promotete Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Konten bereits existieren, werden nur diese Schlüssel in das promotete Konto verschoben; gemeinsame Richtlinien-/Zustellungsschlüssel bleiben am Kanalstamm
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welches bestehende Konto promotete Werte erhält

<Note>
Matrix ist das aktuelle gebündelte Beispiel. Wenn genau ein benanntes Matrix-Konto bereits existiert oder wenn `defaultAccount` auf einen bestehenden nicht-kanonischen Schlüssel wie `Ops` zeigt, behält die Promotion dieses Konto bei, statt einen neuen Eintrag `accounts.default` zu erstellen.
</Note>

## Config-Schema

Plugin-Config wird gegen das JSON-Schema in Ihrem Manifest validiert. Benutzer konfigurieren Plugins über:

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

Für kanalspezifische Config verwenden Sie stattdessen den Abschnitt für Kanal-Config:

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

### Kanal-Config-Schemas erstellen

Verwenden Sie `buildChannelConfigSchema`, um ein Zod-Schema in den Wrapper `ChannelConfigSchema` zu konvertieren, der von pluginverwalteten Config-Artefakten verwendet wird:

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

Für Drittanbieter-Plugins bleibt der Cold-Path-Vertrag weiterhin das Plugin-Manifest: Spiegeln Sie das generierte JSON-Schema nach `openclaw.plugin.json#channelConfigs`, damit Config-Schema, Setup und UI-Oberflächen `channels.<id>` prüfen können, ohne Runtime-Code zu laden.

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

Der Typ `ChannelSetupWizard` unterstützt `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` und mehr. Vollständige Beispiele finden Sie in gebündelten Plugin-Paketen, zum Beispiel im Discord-Plugin `src/channel.setup.ts`.

<AccordionGroup>
  <Accordion title="Gemeinsame allowFrom-Eingabeaufforderungen">
    Für DM-Allowlist-Eingabeaufforderungen, die nur den Standardablauf `note -> prompt -> parse -> merge -> patch` benötigen, sollten Sie die gemeinsamen Setup-Helfer aus `openclaw/plugin-sdk/setup` bevorzugen: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` und `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardstatus für Kanal-Setup">
    Für Statusblöcke des Kanal-Setups, die sich nur durch Labels, Scores und optionale zusätzliche Zeilen unterscheiden, sollten Sie `createStandardChannelSetupStatus(...)` aus `openclaw/plugin-sdk/setup` bevorzugen, statt dasselbe `status`-Objekt in jedem Plugin selbst zu erstellen.
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

    `plugin-sdk/channel-setup` stellt außerdem die Low-Level-Builder `createOptionalChannelSetupAdapter(...)` und `createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte dieser optionalen Installationsoberfläche benötigen.

    Der generierte optionale Adapter/Assistent schlägt bei echten Config-Schreibvorgängen geschlossen fehl. Er verwendet dieselbe Installations-erforderlich-Meldung über `validateInput`, `applyAccountConfig` und `finalize` hinweg wieder und hängt einen Dokumentationslink an, wenn `docsPath` gesetzt ist.

  </Accordion>
  <Accordion title="Binary-gestützte Setup-Helfer">
    Für binary-gestützte Setup-UIs sollten Sie die gemeinsamen delegierten Helfer bevorzugen, statt denselben Binary-/Status-Glue in jeden Kanal zu kopieren:

    - `createDetectedBinaryStatus(...)` für Statusblöcke, die nur durch Labels, Hinweise, Scores und Binary-Erkennung variieren
    - `createCliPathTextInput(...)` für pfadgestützte Texteingaben
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an einen schwergewichtigeren vollständigen Assistenten weiterleiten muss
    - `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur eine Entscheidung für `textInputs[*].shouldPrompt` delegieren muss

  </Accordion>
</AccordionGroup>

## Veröffentlichen und Installieren

**Externe Plugins:** Veröffentlichen Sie in [ClawHub](/de/tools/clawhub), installieren Sie dann:

<Tabs>
  <Tab title="Automatisch (ClawHub, dann npm)">
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
    Verwenden Sie npm, wenn ein Paket noch nicht zu ClawHub verschoben wurde oder wenn Sie während der Migration einen
    direkten npm-Installationspfad benötigen:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Repo-interne Plugins:** Legen Sie sie unterhalb des Workspace-Baums für gebündelte Plugins ab; sie werden während des Builds automatisch entdeckt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Für Installationen aus npm-Quellen installiert `openclaw plugins install` das Paket unter `~/.openclaw/npm` mit deaktivierten Lifecycle-Skripten. Halten Sie Plugin-Abhängigkeitsbäume in reinem JS/TS und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

<Note>
Der Gateway-Start installiert keine Plugin-Abhängigkeiten. npm-/Git-/ClawHub-Installationsabläufe sind für die Konvergenz von Abhängigkeiten verantwortlich; lokale Plugins müssen ihre Abhängigkeiten bereits installiert haben.
</Note>

Gebündelte Paketmetadaten sind explizit und werden beim Start des Gateway nicht aus gebautem JavaScript abgeleitet. Laufzeitabhängigkeiten gehören in das Plugin-Paket, dem sie zugeordnet sind; der Start eines paketierten OpenClaw repariert oder spiegelt Plugin-Abhängigkeiten niemals.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) — Schritt-für-Schritt-Anleitung für den Einstieg
- [Plugin-Manifest](/de/plugins/manifest) — vollständige Referenz zum Manifest-Schema
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — `definePluginEntry` und `defineChannelPluginEntry`
