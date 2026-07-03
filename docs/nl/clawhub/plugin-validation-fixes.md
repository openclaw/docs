---
read_when:
    - Je hebt clawhub package validate uitgevoerd en moet Plugin-bevindingen oplossen
    - ClawHub heeft een publicatie van een Plugin-pakket geweigerd of er een waarschuwing voor gegeven
    - Je werkt Plugin-pakketmetadata bij vóór de release
summary: Los validatiebevindingen voor het ClawHub Plugin-pakket op vóór publicatie
title: Plugin-validatiefixes
x-i18n:
    generated_at: "2026-07-03T01:00:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Oplossingen voor Plugin-validatie

ClawHub valideert Plugin-pakketten vóór publicatie en kan ook bevindingen uit
geautomatiseerde pakketscans tonen. Deze pagina behandelt bevindingen voor auteurs,
oftewel bevindingen die de Plugin-auteur kan oplossen in pakketmetadata, manifest, SDK-
imports of gepubliceerd artefact.

Dit behandelt geen interne dekkingsbevindingen van Plugin Inspector. Als een volledig rapport
scanneronderhoudscodes bevat zonder herstelrichtlijnen voor auteurs, zijn die bedoeld
voor OpenClaw-onderhouders in plaats van Plugin-auteurs.

Voer na elke oplossing opnieuw uit:

```bash
clawhub package validate <path-to-plugin>
```

## Bevindingen voor auteurs

| Code                                    | Begin hier                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Pakketmetadata toevoegen](/nl/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Het pakketblok openclaw toevoegen](/nl/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw-pakketingangspunten declareren](/nl/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Het gedeclareerde ingangspunt publiceren](/nl/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Installatiemetadata aanvullen](/nl/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Compatibiliteit met de Plugin-API declareren](/nl/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Minimale hostversie afstemmen](/nl/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Pakket- en manifestversies afstemmen](/nl/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Niet-ondersteunde OpenClaw-pakketmetadata verwijderen](/nl/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Het npm-artefact verpakbaar maken](/nl/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Ingangspunten opnemen in de uitvoer van npm pack](/nl/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Metadata opnemen in de uitvoer van npm pack](/nl/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Een weergavenaam aan het manifest toevoegen](/nl/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Niet-ondersteunde manifestvelden verwijderen](/nl/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Niet-ondersteunde contractsleutels verwijderen](/nl/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [SDK-imports vanuit de root vervangen](/nl/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Gereserveerde SDK-imports verwijderen](/nl/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Toegang tot de volledige sessieopslag vervangen](/nl/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Schrijfbewerkingen naar de volledige sessieopslag vervangen](/nl/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Helpers voor sessiebestandspaden vervangen](/nl/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Verouderde transcriptbestanddoelen vervangen](/nl/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Laag-niveau transcripthelpers vervangen](/nl/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start vervangen](/nl/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Provider-env-vars naar setupmetadata verplaatsen](/nl/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Kanaal-env-vars spiegelen in huidige metadata](/nl/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Niet-beschikbare verwijzingen naar beveiligingsmanifestschema's verwijderen](/nl/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Niet-ondersteunde beveiligingsmanifestbestanden verwijderen](/nl/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Pakketmetadata

### package-json-missing

De pakketroot bevat geen `package.json`, waardoor ClawHub het npm-pakket,
de versie, ingangspunten of OpenClaw-metadata niet kan identificeren.

- Voeg `package.json` toe met `name`, `version` en `type`.
- Voeg een `openclaw`-blok toe wanneer het pakket een OpenClaw Plugin levert.
- Gebruik [Plugins bouwen](/nl/plugins/building-plugins) voor een minimaal pakketvoorbeeld
  en [Plugin-manifest](/nl/plugins/manifest#manifest-versus-packagejson)
  voor de scheiding tussen pakket en manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-metadata-missing

Het pakket heeft `package.json`, maar declareert geen OpenClaw-pakketmetadata.

- Voeg `package.json#openclaw` toe.
- Neem ingangspuntmetadata op, zoals `openclaw.extensions` of
  `openclaw.runtimeExtensions`.
- Voeg compatibiliteits- en installatiemetadata toe wanneer het pakket via ClawHub
  wordt gepubliceerd of geïnstalleerd.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-entry-missing

De pakketmetadata bestaat, maar declareert geen OpenClaw-runtime-ingangspunt.

- Voeg `openclaw.extensions` toe voor native Plugin-ingangspunten.
- Voeg `openclaw.runtimeExtensions` toe wanneer het gepubliceerde pakket gebouwde
  JavaScript moet laden.
- Houd alle ingangspuntpaden binnen de pakketmap.
- Zie [Plugin-ingangspunten](/nl/plugins/sdk-entrypoints) en
  [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-entrypoint-missing

Het pakket declareert een OpenClaw-ingangspunt, maar het verwezen bestand ontbreekt
in het pakket dat wordt gevalideerd.

- Controleer elk pad in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` en `openclaw.runtimeSetupEntry`.
- Bouw het pakket als het ingangspunt in `dist` wordt gegenereerd.
- Werk de metadata bij als het ingangspunt is verplaatst.
- Zie [Plugin-ingangspunten](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-install-metadata-incomplete

ClawHub kan niet bepalen hoe het pakket moet worden geïnstalleerd of bijgewerkt.

- Vul `openclaw.install` met de ondersteunde installatiebron, zoals
  `clawhubSpec`, `npmSpec` of `localPath`.
- Stel `openclaw.install.defaultChoice` in wanneer meer dan één installatiebron
  beschikbaar is.
- Gebruik `openclaw.install.minHostVersion` voor de minimale OpenClaw-hostversie.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-plugin-api-compat-missing

Het pakket declareert niet welk bereik van de OpenClaw Plugin-API het ondersteunt.

- Voeg `openclaw.compat.pluginApi` toe aan `package.json`.
- Gebruik de versie van de OpenClaw Plugin-API of de semver-ondergrens waartegen
  je hebt gebouwd en getest.
- Houd dit gescheiden van de pakketversie. De pakketversie beschrijft de
  Plugin-release; `openclaw.compat.pluginApi` beschrijft het API-contract van de host.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-min-host-version-drift

De minimale hostversie van het pakket komt niet overeen met de OpenClaw-versiemetadata
waartegen het pakket is gebouwd.

- Controleer `openclaw.install.minHostVersion`.
- Controleer eventuele OpenClaw-buildmetadata in het pakket, zoals de OpenClaw-versie
  die tijdens de release is gebruikt.
- Stem de minimale hostversie af op het hostversiebereik dat het pakket
  daadwerkelijk ondersteunt.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-manifest-version-drift

De pakketversie en Plugin-manifestversie komen niet overeen.

- Geef de voorkeur aan `package.json#version` als de releaseversie van het pakket.
- Als `openclaw.plugin.json` ook `version` heeft, werk die dan bij zodat deze overeenkomt
  of verwijder verouderde manifestversiemetadata wanneer pakketmetadata leidend is.
- Publiceer een nieuwe pakketversie nadat gepubliceerde metadata zijn gewijzigd.
- Zie [Plugin-manifest](/nl/plugins/manifest).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-unsupported-metadata

Het blok `package.json#openclaw` bevat velden die geen ondersteunde
OpenClaw-pakketmetadata zijn.

- Verwijder niet-ondersteunde velden zoals `openclaw.bundle`.
- Houd native Plugin-metadata in `openclaw.plugin.json`.
- Houd pakketingangspunten, compatibiliteit, installatie, setup en catalogusmetadata
  in ondersteunde `package.json#openclaw`-velden.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gepubliceerd artefact

### package-npm-pack-unavailable

Het pakket kan niet worden verpakt tot het artefact dat ClawHub zou inspecteren
of publiceren.

- Voer `npm pack --dry-run` uit vanuit de pakketroot.
- Los ongeldige pakketmetadata, kapotte lifecyclescripts of bestandsvermeldingen op
  waardoor verpakken mislukt.
- Verwijder `private: true` als dit pakket bedoeld is voor openbare publicatie.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-entrypoint-missing

Het pakket kan worden verpakt, maar het verpakte artefact bevat niet de
ingangspuntbestanden die in `package.json#openclaw` zijn gedeclareerd.

- Voer `npm pack --dry-run` uit en inspecteer de bestanden die zouden worden opgenomen.
- Bouw gegenereerde ingangspunten vóór het verpakken.
- Werk `files`, `.npmignore` of build-uitvoer bij zodat gedeclareerde ingangspunten
  worden opgenomen.
- Zie [Plugin-ingangspunten](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-metadata-missing

Het verpakte artefact mist OpenClaw-metadata die in je bronpakket bestaat.

- Voer `npm pack --dry-run` uit en inspecteer de opgenomen metadatabestanden.
- Zorg dat `package.json` het `openclaw`-blok bevat in het verpakte artefact.
- Zorg dat `openclaw.plugin.json` wordt opgenomen wanneer het pakket een native
  OpenClaw Plugin is.
- Werk `files` of `.npmignore` bij zodat pakketmetadata niet worden uitgesloten.
- Zie [Plugins bouwen](/nl/plugins/building-plugins).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Manifestmetadata

### manifest-name-missing

Het native pluginmanifest bevat geen weergavenaam.

- Voeg een niet-leeg `name`-veld toe aan `openclaw.plugin.json`.
- Houd `name` menselijk leesbaar en houd `id` als de stabiele machine-id.
- Zie [Pluginmanifest](/nl/plugins/manifest).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### manifest-unknown-fields

Het pluginmanifest heeft top-level velden die OpenClaw niet ondersteunt.

- Vergelijk elk top-level veld met de
  [referentie voor manifestvelden](/nl/plugins/manifest#top-level-field-reference).
- Verwijder aangepaste velden uit `openclaw.plugin.json`.
- Verplaats package- of installatiemetagegevens naar ondersteunde `package.json#openclaw`-velden
  in plaats van naar het manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### manifest-unknown-contracts

Het manifest declareert niet-ondersteunde sleutels binnen `contracts`.

- Vergelijk elke sleutel onder `contracts` met de
  [contracts-referentie](/nl/plugins/manifest#contracts-reference).
- Verwijder niet-ondersteunde contractsleutels.
- Verplaats runtimegedrag naar pluginregistratiecode en beperk `contracts`
  tot statische metagegevens over eigenaarschap van capabilities.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## SDK- en compatibiliteitsmigratie

### legacy-root-sdk-import

De plugin importeert vanuit de verouderde root-SDK-barrel:
`openclaw/plugin-sdk`.

- Vervang root-barrel-imports door gerichte publieke subpath-imports.
- Gebruik `openclaw/plugin-sdk/plugin-entry` voor `definePluginEntry`.
- Gebruik `openclaw/plugin-sdk/channel-core` voor helpers voor kanaal-entry's.
- Gebruik [Importconventies](/nl/plugins/building-plugins#import-conventions) en
  [Plugin-SDK-subpaths](/nl/plugins/sdk-subpaths) om de nauwe import te vinden.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### reserved-sdk-import

De plugin importeert een SDK-pad dat is gereserveerd voor gebundelde plugins of interne
compatibiliteit.

- Vervang gereserveerde interne OpenClaw-SDK-imports door gedocumenteerde publieke
  `openclaw/plugin-sdk/*`-subpaths.
- Als het gedrag geen publieke SDK heeft, houd de helper dan binnen je package of
  vraag een publieke OpenClaw-API aan.
- Gebruik [Plugin-SDK-subpaths](/nl/plugins/sdk-subpaths) en
  [SDK-migratie](/nl/plugins/sdk-migration) om een ondersteunde import te kiezen.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-load-session-store

De plugin gebruikt nog steeds de verouderde helper voor de volledige session-store
`loadSessionStore`.

- Gebruik `getSessionEntry(...)` of `listSessionEntries(...)` bij het lezen van sessie-
  state.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` bij het schrijven van sessie-
  state.
- Vermijd het laden, muteren en opslaan van het volledige session-store-object.
- Houd `loadSessionStore(...)` alleen aan zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-store-write

De plugin gebruikt nog steeds een verouderde schrijfhelper voor de volledige session-store, zoals
`saveSessionStore` of `updateSessionStore`.

- Gebruik `patchSessionEntry(...)` bij het bijwerken van velden op een bestaande sessie-
  entry.
- Gebruik `upsertSessionEntry(...)` bij het vervangen of maken van een sessie-entry.
- Vermijd het laden, muteren en opslaan van het volledige session-store-object.
- Houd schrijfhelpers voor de volledige store alleen aan zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die ze vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-file-helper

De plugin gebruikt nog steeds verouderde helpers voor sessiebestandspaden, zoals
`resolveSessionFilePath` of `resolveAndPersistSessionFile`.

- Gebruik `getSessionEntry(...)` om sessiemetagegevens per agent en sessie-
  identiteit te lezen.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` om sessie-
  metagegevens vast te leggen.
- Gebruik transcriptidentiteit of target-helpers wanneer de code een
  transcriptbewerking voorbereidt.
- Bewaar geen verouderde transcriptbestandspaden en maak je er niet afhankelijk van.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-transcript-file-target

De plugin gebruikt nog steeds de verouderde helper voor het transcriptbestandstarget
`resolveSessionTranscriptLegacyFileTarget`.

- Gebruik `resolveSessionTranscriptIdentity(...)` wanneer de code alleen publieke
  sessie-identiteit nodig heeft.
- Gebruik `resolveSessionTranscriptTarget(...)` wanneer de code een gestructureerd
  target voor een transcriptbewerking nodig heeft.
- Vermijd het rechtstreeks lezen of construeren van verouderde transcriptbestandstargets.
- Houd de verouderde helper alleen aan zolang je gedeclareerde compatibiliteitsbereik nog
  oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-transcript-low-level

De plugin gebruikt nog steeds verouderde low-level transcripthelpers, zoals
`appendSessionTranscriptMessage` of `emitSessionTranscriptUpdate`.

- Gebruik `appendSessionTranscriptMessageByIdentity(...)` voor transcript-appends.
- Gebruik `publishSessionTranscriptUpdateByIdentity(...)` voor meldingen over
  transcriptupdates.
- Geef de voorkeur aan het gestructureerde transcript-runtimeoppervlak zodat OpenClaw de
  juiste transactiegrenzen en identiteitsafhandeling kan toepassen.
- Houd low-level transcripthelpers alleen aan zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die ze vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### legacy-before-agent-start

De plugin gebruikt nog steeds de legacy-hook `before_agent_start`.

- Verplaats werk voor model- of provideroverrides naar `before_model_resolve`.
- Verplaats werk voor prompt- of contextmutatie naar `before_prompt_build`.
- Houd `before_agent_start` alleen aan zolang je gedeclareerde compatibiliteitsbereik nog
  oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Hooks](/nl/plugins/hooks) en
  [Plugincompatibiliteit](/nl/plugins/compatibility).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### provider-auth-env-vars

Het manifest gebruikt nog steeds legacy `providerAuthEnvVars`-metagegevens voor providerauthenticatie.

- Spiegel provider-env-var-metagegevens naar `setup.providers[].envVars`.
- Houd `providerAuthEnvVars` alleen aan als compatibiliteitsmetagegevens zolang je ondersteunde
  OpenClaw-bereik dit nog nodig heeft.
- Zie [setup-referentie](/nl/plugins/manifest#setup-reference) en
  [SDK-migratie](/nl/plugins/sdk-migration).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### channel-env-vars

Het manifest gebruikt legacy of oudere kanaal-env-var-metagegevens zonder de huidige
setup- of configuratiemetagegevens die ClawHub verwacht.

- Houd kanaal-env-var-metagegevens declaratief zodat OpenClaw de setupstatus kan inspecteren
  zonder de kanaalruntime te laden.
- Spiegel env-gestuurde kanaalsetup naar de huidige setup, kanaalconfiguratie of
  package-kanaalmetagegevens die door je pluginvorm worden gebruikt.
- Houd `channelEnvVars` alleen aan als compatibiliteitsmetagegevens zolang oudere ondersteunde
  OpenClaw-versies dit nog vereisen.
- Zie [Pluginmanifest](/nl/plugins/manifest) en
  [Kanaalplugins](/nl/plugins/sdk-channel-plugins).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Beveiligingsmanifest

### security-manifest-schema-unavailable

Het package levert `openclaw.security.json` met een schemareferentie die ClawHub
niet als beschikbaar herkent.

- Verwijder de schema-URL als deze alleen adviserend is.
- Gebruik alleen een gedocumenteerd versiegebonden schema nadat OpenClaw er een publiceert.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### unrecognized-security-manifest

Het package levert een niet-ondersteund beveiligingsmanifestbestand.

- Verwijder `openclaw.security.json` totdat OpenClaw een versiegebonden beveiligings-
  manifestschema en ClawHub-gedrag documenteert.
- Houd beveiligingsgevoelig gedrag gedocumenteerd in je publieke packagedocs of
  README totdat het manifestcontract bestaat.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gerelateerd

- [ClawHub CLI](/nl/clawhub/cli)
- [ClawHub publiceren](/nl/clawhub/publishing)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Pluginmanifest](/nl/plugins/manifest)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Plugincompatibiliteit](/nl/plugins/compatibility)
