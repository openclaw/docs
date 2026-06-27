---
read_when:
    - Sie fügen einem Plugin einen Einrichtungsassistenten hinzu
    - Sie müssen setup-entry.ts im Vergleich zu index.ts verstehen
    - Sie definieren Plugin-Konfigurationsschemas oder `package.json`-`openclaw`-Metadaten
sidebarTitle: Setup and config
summary: Einrichtungsassistenten, setup-entry.ts, Konfigurationsschemas und package.json-Metadaten
title: Plugin-Einrichtung und -Konfiguration
x-i18n:
    generated_at: "2026-06-27T17:59:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste (`openclaw.plugin.json`), Setup-Einträge und Konfigurationsschemas.

<Tip>
**Suchen Sie eine Schritt-für-Schritt-Anleitung?** Die How-to-Anleitungen behandeln Paketierung im Kontext: [Channel-Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
Wenn Sie das Plugin extern auf ClawHub veröffentlichen, sind diese `compat`- und `build`-Felder erforderlich. Die kanonischen Veröffentlichungssnippets befinden sich in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-Felder

<ParamField path="extensions" type="string[]">
  Einstiegspunktdateien (relativ zur Paketwurzel).
</ParamField>
<ParamField path="setupEntry" type="string">
  Leichtgewichtiger reiner Setup-Einstieg (optional).
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

`openclaw.channel` sind einfache Paketmetadaten für Kanalerkennung und Setup-Oberflächen, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                          |
| `label`                                | `string`   | Primäre Kanalbezeichnung.                                                     |
| `selectionLabel`                       | `string`   | Auswahl-/Setup-Bezeichnung, wenn sie sich von `label` unterscheiden soll.     |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für umfangreichere Kanalkataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Dokumentationspfad für Setup- und Auswahllinks.                               |
| `docsLabel`                            | `string`   | Überschreibt die für Dokumentationslinks verwendete Bezeichnung, wenn sie sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Onboarding-/Katalogbeschreibung.                                        |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                         |
| `aliases`                              | `string[]` | Zusätzliche Suchaliases für die Kanalauswahl.                                 |
| `preferOver`                           | `string[]` | Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Kanal übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Symbol-/Systembildname für Kanal-UI-Kataloge.                      |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Dokumentationslinks in Auswahloberflächen.                     |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt in Auswahltexten den Dokumentationspfad direkt statt eines beschrifteten Dokumentationslinks. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Zeichenfolgen, die im Auswahltext angehängt werden.         |
| `markdownCapable`                      | `boolean`  | Markiert den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Steuert die Sichtbarkeit des Kanals für Setup-, konfigurierte Listen- und Dokumentationsoberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Bindet diesen Kanal in den standardmäßigen Schnellstart-Setup-Flow `allowFrom` ein. |
| `forceAccountBinding`                  | `boolean`  | Erfordert eine explizite Kontobindung, selbst wenn nur ein Konto vorhanden ist. |
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

- `configured`: nimmt den Kanal in konfigurierte/statusartige Listenoberflächen auf
- `setup`: nimmt den Kanal in interaktive Setup-/Konfigurationsauswahlen auf
- `docs`: markiert den Kanal als öffentlich sichtbar in Dokumentations-/Navigationsoberflächen

<Note>
`showConfigured` und `showInSetup` bleiben als Legacy-Aliases unterstützt. Bevorzugen Sie `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifestmetadaten.

| Feld                         | Typ                                 | Bedeutung                                                                         |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Kanonische ClawHub-Spezifikation für Installations-/Update- und Onboarding-Install-on-Demand-Flows. |
| `npmSpec`                    | `string`                            | Kanonische npm-Spezifikation für Installations-/Update-Fallback-Flows.            |
| `localPath`                  | `string`                            | Lokaler Entwicklungs- oder gebündelter Installationspfad.                         |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn mehrere Quellen verfügbar sind.              |
| `minHostVersion`             | `string`                            | Minimal unterstützte OpenClaw-Version im Format `>=x.y.z` oder `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Erwartete npm-Dist-Integritätszeichenfolge, normalerweise `sha512-...`, für gepinnte Installationen. |
| `allowInvalidConfigRecovery` | `boolean`                           | Ermöglicht Neuinstallations-Flows gebündelter Plugins, bestimmte veraltete Konfigurationsfehler zu beheben. |
| `requiredPlatformPackages`   | `string[]`                          | Erforderliche plattformspezifische npm-Aliases, die während der npm-Installation verifiziert werden. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interaktives Onboarding verwendet `openclaw.install` ebenfalls für Install-on-Demand-Oberflächen. Wenn Ihr Plugin Provider-Authentifizierungsoptionen oder Kanal-Setup-/Katalogmetadaten bereitstellt, bevor die Laufzeit geladen wird, kann das Onboarding diese Option anzeigen, zur Auswahl von ClawHub, npm oder lokaler Installation auffordern, das Plugin installieren oder aktivieren und dann mit dem ausgewählten Flow fortfahren. ClawHub-Onboarding-Optionen verwenden `clawhubSpec` und werden bevorzugt, wenn vorhanden; npm-Optionen erfordern vertrauenswürdige Katalogmetadaten mit einer Registry-`npmSpec`; exakte Versionen und `expectedIntegrity` sind optionale npm-Pins. Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Flows sie für npm. Halten Sie die Metadaten dazu, „was angezeigt werden soll“, in `openclaw.plugin.json` und die Metadaten dazu, „wie es installiert wird“, in `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Wenn `minHostVersion` gesetzt ist, erzwingen sowohl die Installation als auch das Laden der nicht gebündelten Manifest-Registry diese Version. Ältere Hosts überspringen externe Plugins; ungültige Versionszeichenfolgen werden abgelehnt. Gebündelte Quell-Plugins gelten als mit dem Host-Checkout gemeinsam versioniert.
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
    `allowInvalidConfigRecovery` ist kein allgemeiner Bypass für defekte Konfigurationen. Es ist nur für die eng begrenzte Wiederherstellung gebündelter Plugins vorgesehen, damit Neuinstallation/Setup bekannte Upgrade-Reste wie einen fehlenden gebündelten Plugin-Pfad oder einen veralteten `channels.<id>`-Eintrag für dasselbe Plugin reparieren können. Wenn die Konfiguration aus anderen Gründen defekt ist, schlägt die Installation weiterhin geschlossen fehl und weist den Operator an, `openclaw doctor --fix` auszuführen.
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

Wenn aktiviert, lädt OpenClaw während der Startphase vor dem Lauschen nur `setupEntry`, selbst für bereits konfigurierte Kanäle. Der vollständige Einstieg wird geladen, nachdem der Gateway begonnen hat zu lauschen.

<Warning>
Aktivieren Sie verzögertes Laden nur, wenn Ihr `setupEntry` alles registriert, was der Gateway vor dem Beginn des Lauschens benötigt (Kanalregistrierung, HTTP-Routen, Gateway-Methoden). Wenn der vollständige Einstieg erforderliche Startfähigkeiten besitzt, behalten Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/vollständiger Einstieg Gateway-RPC-Methoden registriert, behalten Sie sie unter einem Plugin-spezifischen Präfix. Reservierte Core-Admin-Namensräume (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben Core-eigen und werden immer zu `operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss eine `openclaw.plugin.json` in der Paketwurzel ausliefern. OpenClaw verwendet diese Datei, um Konfiguration zu validieren, ohne Plugin-Code auszuführen.

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
Der veraltete Veröffentlichungsalias nur für Skills ist für Skills vorgesehen. Plugin-Pakete sollten immer `clawhub package publish` verwenden.
</Note>

## Setup-Einstieg

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die OpenClaw lädt, wenn nur Setup-Oberflächen benötigt werden (Onboarding, Konfigurationsreparatur, Inspektion deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, dass während Setup-Abläufen umfangreicher Laufzeitcode geladen wird (Kryptobibliotheken, CLI-Registrierungen, Hintergrunddienste).

Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Modulen halten, können `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` statt `defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Vertrag unterstützt außerdem einen optionalen `runtime`-Export, damit die Laufzeitverdrahtung zur Setup-Zeit leichtgewichtig und explizit bleiben kann.

<AccordionGroup>
  <Accordion title="Wann OpenClaw setupEntry statt des vollständigen Einstiegs verwendet">
    - Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen.
    - Der Kanal ist aktiviert, aber nicht konfiguriert.
    - Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Was setupEntry registrieren muss">
    - Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`).
    - Alle HTTP-Routen, die vor dem Gateway-Listen erforderlich sind.
    - Alle Gateway-Methoden, die während des Starts benötigt werden.

    Diese Start-Gateway-Methoden sollten weiterhin reservierte Kern-Admin-Namespaces wie `config.*` oder `update.*` vermeiden.

  </Accordion>
  <Accordion title="Was setupEntry NICHT enthalten sollte">
    - CLI-Registrierungen.
    - Hintergrunddienste.
    - Umfangreiche Laufzeitimporte (Krypto, SDKs).
    - Gateway-Methoden, die erst nach dem Start benötigt werden.

  </Accordion>
</AccordionGroup>

### Schmale Setup-Helper-Importe

Für heiße reine Setup-Pfade sollten Sie die schmalen Setup-Helper-Seams dem breiteren Umbrella `plugin-sdk/setup` vorziehen, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                        | Verwenden Sie ihn für                                                                                | Wichtige Exporte                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Laufzeit-Helper zur Setup-Zeit, die in `setupEntry` / beim verzögerten Kanalstart verfügbar bleiben | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | Setup-/Installations-CLI-/Archiv-/Doku-Helper                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Verwenden Sie den breiteren Seam `plugin-sdk/setup`, wenn Sie die vollständige gemeinsame Setup-Toolbox einschließlich Konfigurations-Patch-Helpern wie `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen.

Verwenden Sie `createSetupTranslator(...)` für feste Texte des Setup-Assistenten. Es folgt der
CLI-Assistenten-Locale (`OPENCLAW_LOCALE`, dann System-Locale-Variablen) und fällt
auf Englisch zurück. Halten Sie Plugin-spezifische Setup-Texte in Plugin-eigenem Code und verwenden Sie
gemeinsame Katalogschlüssel nur für allgemeine Setup-Labels, Statustexte und offizielle
Setup-Texte gebündelter Plugins.

Die Setup-Patch-Adapter bleiben beim Import für Hot Paths sicher. Ihr gebündelter Single-Account-Promotion-Vertragsoberflächen-Lookup ist lazy, daher lädt der Import von `plugin-sdk/setup-runtime` die gebündelte Vertragsoberflächen-Erkennung nicht sofort, bevor der Adapter tatsächlich verwendet wird.

### Kanalgesteuerte Single-Account-Promotion

Wenn ein Kanal von einer Single-Account-Konfiguration auf oberster Ebene auf `channels.<id>.accounts.*` aktualisiert wird, besteht das standardmäßige gemeinsame Verhalten darin, heraufgestufte kontospezifische Werte nach `accounts.default` zu verschieben.

Gebündelte Kanäle können diese Promotion über ihre Setup-Vertragsoberfläche einschränken oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Schlüssel auf oberster Ebene, die in das heraufgestufte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Konten bereits existieren, werden nur diese Schlüssel in das heraufgestufte Konto verschoben; gemeinsame Richtlinien-/Auslieferungsschlüssel bleiben im Kanal-Root
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welches vorhandene Konto heraufgestufte Werte erhält

<Note>
Matrix ist das aktuelle gebündelte Beispiel. Wenn genau ein benanntes Matrix-Konto bereits existiert oder wenn `defaultAccount` auf einen vorhandenen nicht-kanonischen Schlüssel wie `Ops` verweist, bewahrt die Promotion dieses Konto, statt einen neuen Eintrag `accounts.default` zu erstellen.
</Note>

## Konfigurationsschema

Plugin-Konfiguration wird anhand des JSON Schema in Ihrem Manifest validiert. Benutzer konfigurieren Plugins über:

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

Verwenden Sie `buildChannelConfigSchema`, um ein Zod-Schema in den `ChannelConfigSchema`-Wrapper umzuwandeln, der von Plugin-eigenen Konfigurationsartefakten verwendet wird:

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

Wenn Sie den Vertrag bereits als JSON Schema oder TypeBox verfassen, verwenden Sie den direkten Helper, damit OpenClaw auf Metadatenpfaden die Zod-zu-JSON-Schema-Konvertierung überspringen kann:

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

Für Drittanbieter-Plugins bleibt der Cold-Path-Vertrag weiterhin das Plugin-Manifest: Spiegeln Sie das generierte JSON Schema nach `openclaw.plugin.json#channelConfigs`, damit Konfigurationsschema, Setup und UI-Oberflächen `channels.<id>` inspizieren können, ohne Laufzeitcode zu laden.

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
    Für DM-Allowlist-Prompts, die nur den Standardablauf `note -> prompt -> parse -> merge -> patch` benötigen, sollten Sie die gemeinsamen Setup-Helper aus `openclaw/plugin-sdk/setup` bevorzugen: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` und `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standardstatus für Kanal-Setup">
    Für Statusblöcke des Kanal-Setups, die nur nach Labels, Scores und optionalen Zusatzzeilen variieren, sollten Sie `createStandardChannelSetupStatus(...)` aus `openclaw/plugin-sdk/setup` bevorzugen, statt dasselbe `status`-Objekt in jedem Plugin selbst zu erstellen.
  </Accordion>
  <Accordion title="Optionale Kanal-Setup-Oberfläche">
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

    `plugin-sdk/channel-setup` stellt außerdem die Low-Level-Builder `createOptionalChannelSetupAdapter(...)` und `createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte dieser optionalen Installationsoberfläche benötigen.

    Der generierte optionale Adapter/Assistent schlägt bei echten Konfigurationsschreibvorgängen geschlossen fehl. Er verwendet dieselbe Installations-erforderlich-Meldung über `validateInput`, `applyAccountConfig` und `finalize` hinweg wieder und hängt einen Doku-Link an, wenn `docsPath` gesetzt ist.

  </Accordion>
  <Accordion title="Binary-gestützte Setup-Helper">
    Für Binary-gestützte Setup-UIs sollten Sie die gemeinsamen delegierten Helper bevorzugen, statt dieselbe Binary-/Status-Verklebung in jeden Kanal zu kopieren:

    - `createDetectedBinaryStatus(...)` für Statusblöcke, die nur nach Labels, Hinweisen, Scores und Binary-Erkennung variieren
    - `createCliPathTextInput(...)` für pfadgestützte Texteingaben
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an einen umfangreicheren vollständigen Assistenten weiterleiten muss
    - `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur eine Entscheidung für `textInputs[*].shouldPrompt` delegieren muss

  </Accordion>
</AccordionGroup>

## Veröffentlichen und Installieren

**Externe Plugins:** Veröffentlichen Sie in [ClawHub](/de/clawhub), installieren Sie dann:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Paketangaben ohne Präfix werden während der Einführungsumstellung von npm installiert.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Verwenden Sie npm, wenn ein Paket noch nicht zu ClawHub verschoben wurde oder wenn Sie während der Migration einen
    direkten npm-Installationspfad benötigen:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins im Repository:** Legen Sie sie im Workspace-Baum der gebündelten Plugins ab; sie werden beim Build automatisch erkannt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Bei Installationen aus npm installiert `openclaw plugins install` das Paket in ein pro Plugin eigenes Projekt unter `~/.openclaw/npm/projects`, wobei Lifecycle-Skripte deaktiviert sind. Halten Sie Abhängigkeitsbäume von Plugins rein JS/TS-basiert und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

<Note>
Der Gateway-Start installiert keine Plugin-Abhängigkeiten. npm-/git-/ClawHub-Installationsabläufe sind für den Abgleich der Abhängigkeiten zuständig; lokale Plugins müssen ihre Abhängigkeiten bereits installiert haben.
</Note>

Gebündelte Paketmetadaten sind explizit und werden beim Gateway-Start nicht aus gebautem JavaScript abgeleitet. Laufzeitabhängigkeiten gehören in das Plugin-Paket, dem sie gehören; der Start eines paketierten OpenClaw repariert oder spiegelt Plugin-Abhängigkeiten niemals.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) — Schritt-für-Schritt-Leitfaden für den Einstieg
- [Plugin-Manifest](/de/plugins/manifest) — vollständige Referenz zum Manifest-Schema
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — `definePluginEntry` und `defineChannelPluginEntry`
