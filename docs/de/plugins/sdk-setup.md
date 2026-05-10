---
read_when:
    - Sie fügen einem Plugin einen Einrichtungsassistenten hinzu
    - Sie müssen den Unterschied zwischen setup-entry.ts und index.ts verstehen
    - Sie definieren Plugin-Konfigurationsschemas oder openclaw-Metadaten in package.json
sidebarTitle: Setup and config
summary: Einrichtungsassistenten, setup-entry.ts, Konfigurationsschemas und package.json-Metadaten
title: Plugin-Einrichtung und -Konfiguration
x-i18n:
    generated_at: "2026-05-10T19:47:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste (`openclaw.plugin.json`), Setup-Einträge und Konfigurationsschemas.

<Tip>
**Suchen Sie eine Schritt-für-Schritt-Anleitung?** Die How-to-Guides behandeln Paketierung im Kontext: [Channel-Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
Wenn Sie das Plugin extern auf ClawHub veröffentlichen, sind diese Felder `compat` und `build` erforderlich. Die kanonischen Veröffentlichungssnippets befinden sich in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-Felder

<ParamField path="extensions" type="string[]">
  Einstiegspunktdateien (relativ zum Paketstamm).
</ParamField>
<ParamField path="setupEntry" type="string">
  Leichtgewichtiger reiner Setup-Eintrag (optional).
</ParamField>
<ParamField path="channel" type="object">
  Channel-Katalogmetadaten für Setup, Auswahl, Schnellstart und Statusoberflächen.
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

`openclaw.channel` sind günstige Paketmetadaten für Channel-Erkennung und Setup-Oberflächen, bevor die Runtime lädt.

| Feld                                   | Typ        | Bedeutung                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Channel-ID.                                                        |
| `label`                                | `string`   | Primäres Channel-Label.                                                       |
| `selectionLabel`                       | `string`   | Auswahl-/Setup-Label, wenn es sich von `label` unterscheiden soll.            |
| `detailLabel`                          | `string`   | Sekundäres Detail-Label für umfangreichere Channel-Kataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Dokumentationspfad für Setup- und Auswahllinks.                               |
| `docsLabel`                            | `string`   | Überschreibungs-Label für Dokumentationslinks, wenn es sich von der Channel-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Onboarding-/Katalogbeschreibung.                                        |
| `order`                                | `number`   | Sortierreihenfolge in Channel-Katalogen.                                      |
| `aliases`                              | `string[]` | Zusätzliche Lookup-Aliasse für die Channel-Auswahl.                           |
| `preferOver`                           | `string[]` | Plugin-/Channel-IDs mit niedrigerer Priorität, die dieser Channel übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Icon-/System-Image-Name für Channel-UI-Kataloge.                   |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Dokumentationslinks in Auswahloberflächen.                     |
| `selectionDocsOmitLabel`               | `boolean`  | Den Dokumentationspfad direkt anzeigen statt eines beschrifteten Dokumentationslinks im Auswahltext. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Strings, die im Auswahltext angehängt werden.               |
| `markdownCapable`                      | `boolean`  | Markiert den Channel als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Sichtbarkeitssteuerung des Channels für Setup, konfigurierte Listen und Dokumentationsoberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Channel in den standardmäßigen Schnellstart-Setup-Flow `allowFrom` auf. |
| `forceAccountBinding`                  | `boolean`  | Erfordert explizite Konto-Bindung, selbst wenn nur ein Konto existiert.        |
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

- `configured`: Channel in konfigurierte bzw. statusartige Listenoberflächen aufnehmen
- `setup`: Channel in interaktive Setup-/Konfigurationsauswahlen aufnehmen
- `docs`: Channel in Dokumentations-/Navigationsoberflächen als öffentlich sichtbar markieren

<Note>
`showConfigured` und `showInSetup` bleiben als Legacy-Aliasse unterstützt. Bevorzugen Sie `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                                 | Bedeutung                                                                         |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kanonische ClawHub-Spezifikation für Install-/Update- und Onboarding-Install-on-Demand-Flows. |
| `npmSpec`                    | `string`                            | Kanonische npm-Spezifikation für Install-/Update-Fallback-Flows.                  |
| `localPath`                  | `string`                            | Lokaler Entwicklungs- oder gebündelter Installationspfad.                         |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn mehrere Quellen verfügbar sind.              |
| `minHostVersion`             | `string`                            | Minimal unterstützte OpenClaw-Version im Format `>=x.y.z` oder `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Erwarteter npm-Dist-Integritätsstring, üblicherweise `sha512-...`, für gepinnte Installationen. |
| `allowInvalidConfigRecovery` | `boolean`                           | Ermöglicht Neuinstallations-Flows gebündelter Plugins die Wiederherstellung nach bestimmten veralteten Konfigurationsfehlern. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interaktives Onboarding verwendet `openclaw.install` auch für Install-on-Demand-Oberflächen. Wenn Ihr Plugin vor dem Laden der Runtime Provider-Auth-Optionen oder Channel-Setup-/Katalogmetadaten bereitstellt, kann das Onboarding diese Option anzeigen, nach ClawHub, npm oder lokaler Installation fragen, das Plugin installieren oder aktivieren und anschließend den ausgewählten Flow fortsetzen. ClawHub-Onboarding-Optionen verwenden `clawhubSpec` und werden bevorzugt, wenn vorhanden; npm-Optionen erfordern vertrauenswürdige Katalogmetadaten mit einer Registry-`npmSpec`; exakte Versionen und `expectedIntegrity` sind optionale npm-Pins. Wenn `expectedIntegrity` vorhanden ist, erzwingen Install-/Update-Flows diesen Wert für npm. Bewahren Sie die Metadaten dazu, „was angezeigt werden soll“, in `openclaw.plugin.json` und die Metadaten dazu, „wie es installiert wird“, in `package.json` auf.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Wenn `minHostVersion` gesetzt ist, erzwingen sowohl die Installation als auch das Laden der nicht gebündelten Manifest-Registry diesen Wert. Ältere Hosts überspringen externe Plugins; ungültige Versionsstrings werden abgelehnt. Gebündelte Source-Plugins werden als mit dem Host-Checkout versionsgleich angenommen.
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
    `allowInvalidConfigRecovery` ist keine allgemeine Umgehung für defekte Konfigurationen. Es dient nur der eng begrenzten Wiederherstellung gebündelter Plugins, damit Neuinstallation/Setup bekannte Upgrade-Überreste reparieren können, etwa einen fehlenden gebündelten Plugin-Pfad oder einen veralteten Eintrag `channels.<id>` für dasselbe Plugin. Wenn die Konfiguration aus anderen Gründen defekt ist, schlägt die Installation weiterhin geschlossen fehl und weist den Operator an, `openclaw doctor --fix` auszuführen.
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

Wenn aktiviert, lädt OpenClaw während der Startphase vor dem Lauschen nur `setupEntry`, auch für bereits konfigurierte Channels. Der vollständige Eintrag lädt, nachdem das Gateway zu lauschen beginnt.

<Warning>
Aktivieren Sie verzögertes Laden nur, wenn Ihr `setupEntry` alles registriert, was das Gateway benötigt, bevor es zu lauschen beginnt (Channel-Registrierung, HTTP-Routen, Gateway-Methoden). Wenn der vollständige Eintrag erforderliche Startfunktionen besitzt, behalten Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/vollständiger Eintrag Gateway-RPC-Methoden registriert, behalten Sie diese unter einem Plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben Core-eigen und werden immer zu `operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss ein `openclaw.plugin.json` im Paketstamm ausliefern. OpenClaw verwendet dies, um Konfiguration zu validieren, ohne Plugin-Code auszuführen.

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

Selbst Plugins ohne Konfiguration müssen ein Schema ausliefern. Ein leeres Schema ist gültig:

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

Verwenden Sie für Plugin-Pakete den paketbezogenen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Der veraltete Publish-Alias nur für Skills ist für Skills vorgesehen. Plugin-Pakete sollten immer `clawhub package publish` verwenden.
</Note>

## Setup-Einstieg

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die OpenClaw lädt, wenn nur Setup-Oberflächen benötigt werden (Onboarding, Konfigurationsreparatur, Prüfung deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, dass während Setup-Abläufen schwergewichtiger Laufzeitcode geladen wird (Krypto-Bibliotheken, CLI-Registrierungen, Hintergrunddienste).

Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Modulen halten, können statt `defineSetupPluginEntry(...)` `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` verwenden. Dieser gebündelte Vertrag unterstützt außerdem einen optionalen `runtime`-Export, sodass die Laufzeitverdrahtung zur Setup-Zeit leichtgewichtig und explizit bleiben kann.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen.
    - Der Kanal ist aktiviert, aber nicht konfiguriert.
    - Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`).
    - Alle HTTP-Routen, die vor dem Gateway-Listen erforderlich sind.
    - Alle Gateway-Methoden, die während des Starts benötigt werden.

    Diese Start-Gateway-Methoden sollten weiterhin reservierte Core-Admin-Namespaces wie `config.*` oder `update.*` vermeiden.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - CLI-Registrierungen.
    - Hintergrunddienste.
    - Schwergewichtige Laufzeit-Imports (Krypto, SDKs).
    - Gateway-Methoden, die erst nach dem Start benötigt werden.

  </Accordion>
</AccordionGroup>

### Schmale Setup-Hilfs-Imports

Für heiße reine Setup-Pfade sollten Sie die schmalen Setup-Hilfs-Seams gegenüber dem breiteren Umbrella `plugin-sdk/setup` bevorzugen, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                        | Verwendung                                                                               | Wichtige Exporte                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Laufzeit-Helfer zur Setup-Zeit, die in `setupEntry` / beim verzögerten Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | veralteter Kompatibilitäts-Alias; verwenden Sie `plugin-sdk/setup-runtime`                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | Setup-/Installations-CLI-/Archiv-/Dokumentations-Helfer                                  | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Verwenden Sie den breiteren Seam `plugin-sdk/setup`, wenn Sie die vollständige gemeinsam genutzte Setup-Toolbox wünschen, einschließlich Konfigurations-Patch-Helfern wie `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import für Hot Paths sicher. Ihre gebündelte Contract-Surface-Suche für die Einzelkonto-Promotion ist lazy, sodass der Import von `plugin-sdk/setup-runtime` die gebündelte Contract-Surface-Erkennung nicht eifrig lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanaleigene Einzelkonto-Promotion

Wenn ein Kanal von einer Einzelkonto-Konfiguration auf oberster Ebene auf `channels.<id>.accounts.*` aktualisiert, verschiebt das standardmäßige gemeinsame Verhalten die hochgestuften kontobezogenen Werte nach `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-Contract-Surface eingrenzen oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Schlüssel auf oberster Ebene, die in das hochgestufte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Konten bereits existieren, werden nur diese Schlüssel in das hochgestufte Konto verschoben; gemeinsame Policy-/Delivery-Schlüssel bleiben im Kanalstamm
- `resolveSingleAccountPromotionTarget(...)`: wählt, welches vorhandene Konto hochgestufte Werte erhält

<Note>
Matrix ist das aktuelle gebündelte Beispiel. Wenn genau ein benanntes Matrix-Konto bereits existiert oder wenn `defaultAccount` auf einen vorhandenen nicht-kanonischen Schlüssel wie `Ops` zeigt, behält die Promotion dieses Konto bei, anstatt einen neuen Eintrag `accounts.default` zu erstellen.
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

Für kanalspezifische Konfiguration verwenden Sie stattdessen den Abschnitt für die Kanalkonfiguration:

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

Für Drittanbieter-Plugins bleibt der Cold-Path-Vertrag weiterhin das Plugin-Manifest: Spiegeln Sie das generierte JSON Schema nach `openclaw.plugin.json#channelConfigs`, damit Konfigurationsschema, Setup und UI-Oberflächen `channels.<id>` prüfen können, ohne Laufzeitcode zu laden.

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
  <Accordion title="Shared allowFrom prompts">
    Für DM-Allowlist-Prompts, die nur den Standardablauf `note -> prompt -> parse -> merge -> patch` benötigen, bevorzugen Sie die gemeinsamen Setup-Helfer aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` und `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Für Statusblöcke der Kanal-Einrichtung, die nur nach Labels, Scores und optionalen zusätzlichen Zeilen variieren, bevorzugen Sie `createStandardChannelSetupStatus(...)` aus `openclaw/plugin-sdk/setup`, statt in jedem Plugin dasselbe `status`-Objekt von Hand zu erstellen.
  </Accordion>
  <Accordion title="Optional channel setup surface">
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

    Der generierte optionale Adapter/Assistent schlägt bei echten Konfigurationsschreibvorgängen geschlossen fehl. Er verwendet eine Installations-erforderlich-Meldung für `validateInput`, `applyAccountConfig` und `finalize` wieder und hängt einen Dokumentationslink an, wenn `docsPath` gesetzt ist.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Für binary-gestützte Setup-UIs bevorzugen Sie die gemeinsamen delegierten Helfer, statt denselben Binary-/Status-Glue in jeden Kanal zu kopieren:

    - `createDetectedBinaryStatus(...)` für Statusblöcke, die nur nach Labels, Hinweisen, Scores und Binary-Erkennung variieren
    - `createCliPathTextInput(...)` für pfadgestützte Texteingaben
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an einen schwergewichtigeren vollständigen Assistenten weiterleiten muss
    - `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur eine Entscheidung für `textInputs[*].shouldPrompt` delegieren muss

  </Accordion>
</AccordionGroup>

## Veröffentlichen und Installieren

**Externe Plugins:** Veröffentlichen Sie auf [ClawHub](/de/clawhub), dann installieren Sie:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Reine Paket-Spezifikationen werden während des Launch-Cutovers von npm installiert.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Verwenden Sie npm, wenn ein Paket noch nicht zu ClawHub migriert wurde oder wenn Sie während der Migration einen
    direkten npm-Installationspfad benötigen:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Repo-interne Plugins:** Legen Sie sie unter der gebündelten Plugin-Workspace-Struktur ab; sie werden während des Builds automatisch erkannt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Bei Installationen aus npm installiert `openclaw plugins install` das Paket unter `~/.openclaw/npm` mit deaktivierten Lifecycle-Skripten. Halten Sie Plugin-Abhängigkeitsbäume rein JS/TS-basiert und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

<Note>
Der Gateway-Start installiert keine Plugin-Abhängigkeiten. Installationsabläufe über npm/git/ClawHub sind für den Abgleich der Abhängigkeiten verantwortlich; bei lokalen Plugins müssen die Abhängigkeiten bereits installiert sein.
</Note>

Gebündelte Paketmetadaten sind explizit und werden beim Gateway-Start nicht aus gebautem JavaScript abgeleitet. Runtime-Abhängigkeiten gehören in das Plugin-Paket, dem sie gehören; der Start eines paketierten OpenClaw repariert oder spiegelt Plugin-Abhängigkeiten niemals.

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — Schritt-für-Schritt-Anleitung für den Einstieg
- [Plugin-Manifest](/de/plugins/manifest) — vollständige Referenz zum Manifest-Schema
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — `definePluginEntry` und `defineChannelPluginEntry`
