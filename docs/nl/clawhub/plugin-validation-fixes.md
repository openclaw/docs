---
read_when:
    - Je hebt clawhub package validate uitgevoerd en moet plugin-bevindingen oplossen
    - ClawHub heeft een Plugin-pakketpublicatie geweigerd of er een waarschuwing voor gegeven
    - Je werkt Plugin-pakketmetadata bij vóór de release
summary: Los bevindingen uit de pakketvalidatie van de ClawHub-Plugin op voordat je publiceert
title: Oplossingen voor Plugin-validatie
x-i18n:
    generated_at: "2026-07-04T20:37:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin-validatiefixes

ClawHub valideert Plugin-pakketten vóór publicatie en kan ook bevindingen tonen uit
geautomatiseerde pakketscans. Deze pagina behandelt auteursgerichte bevindingen, wat betekent:
bevindingen die de Plugin-auteur kan oplossen in de pakketmetadata, het manifest, SDK-
imports of het gepubliceerde artefact.

Dit behandelt geen interne dekkingsbevindingen van Plugin Inspector. Als een volledig rapport
scanneronderhoudscodes bevat zonder herstelrichtlijnen voor auteurs, zijn die
bedoeld voor OpenClaw-beheerders in plaats van Plugin-auteurs.

Voer na het toepassen van een fix opnieuw uit:

```bash
clawhub package validate <path-to-plugin>
```

## Auteursgerichte bevindingen

| Code                                    | Begin hier                                                                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Voeg pakketmetadata toe](/nl/clawhub/plugin-validation-fixes#package-json-missing)                                             |
| `package-openclaw-metadata-missing`     | [Voeg het pakketblok openclaw toe](/nl/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                       |
| `package-openclaw-entry-missing`        | [Declareer OpenClaw-pakket-entrypoints](/nl/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                     |
| `package-entrypoint-missing`            | [Publiceer het gedeclareerde entrypoint](/nl/clawhub/plugin-validation-fixes#package-entrypoint-missing)                        |
| `package-install-metadata-incomplete`   | [Vul installatiemetadata aan](/nl/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                          |
| `package-plugin-api-compat-missing`     | [Declareer compatibiliteit met de Plugin-API](/nl/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)            |
| `package-min-host-version-drift`        | [Stem de minimale hostversie af](/nl/clawhub/plugin-validation-fixes#package-min-host-version-drift)                            |
| `package-manifest-version-drift`        | [Stem pakket- en manifestversies op elkaar af](/nl/clawhub/plugin-validation-fixes#package-manifest-version-drift)              |
| `package-openclaw-unsupported-metadata` | [Verwijder niet-ondersteunde OpenClaw-pakketmetadata](/nl/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Maak het npm-artefact packbaar](/nl/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                              |
| `package-npm-pack-entrypoint-missing`   | [Neem entrypoints op in npm pack-uitvoer](/nl/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)              |
| `package-npm-pack-metadata-missing`     | [Neem metadata op in npm pack-uitvoer](/nl/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                   |
| `manifest-name-missing`                 | [Voeg een weergavenaam voor het manifest toe](/nl/clawhub/plugin-validation-fixes#manifest-name-missing)                        |
| `manifest-unknown-fields`               | [Verwijder niet-ondersteunde manifestvelden](/nl/clawhub/plugin-validation-fixes#manifest-unknown-fields)                       |
| `manifest-unknown-contracts`            | [Verwijder niet-ondersteunde contractsleutels](/nl/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                  |
| `legacy-root-sdk-import`                | [Vervang root-SDK-imports](/nl/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                           |
| `reserved-sdk-import`                   | [Verwijder gereserveerde SDK-imports](/nl/clawhub/plugin-validation-fixes#reserved-sdk-import)                                  |
| `sdk-load-session-store`                | [Vervang toegang tot de volledige sessiestore](/nl/clawhub/plugin-validation-fixes#sdk-load-session-store)                      |
| `sdk-session-store-write`               | [Vervang schrijfacties naar de volledige sessiestore](/nl/clawhub/plugin-validation-fixes#sdk-session-store-write)              |
| `sdk-session-file-helper`               | [Vervang helpers voor sessiebestandspaden](/nl/clawhub/plugin-validation-fixes#sdk-session-file-helper)                         |
| `sdk-session-transcript-file-target`    | [Vervang verouderde transcriptbestanddoelen](/nl/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)            |
| `sdk-session-transcript-low-level`      | [Vervang low-level transcripthelpers](/nl/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                     |
| `legacy-before-agent-start`             | [Vervang before_agent_start](/nl/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                      |
| `provider-auth-env-vars`                | [Verplaats provider-env-vars naar setupmetadata](/nl/clawhub/plugin-validation-fixes#provider-auth-env-vars)                    |
| `channel-env-vars`                      | [Spiegel kanaal-env-vars in huidige metadata](/nl/clawhub/plugin-validation-fixes#channel-env-vars)                             |
| `security-manifest-schema-unavailable`  | [Verwijder verwijzingen naar niet-beschikbare beveiligingsmanifestschema's](/nl/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Verwijder niet-ondersteunde beveiligingsmanifestbestanden](/nl/clawhub/plugin-validation-fixes#unrecognized-security-manifest) |

## Pakketmetadata

### package-json-missing

De pakketroot bevat geen `package.json`, waardoor ClawHub het
npm-pakket, de versie, entrypoints of OpenClaw-metadata niet kan identificeren.

- Voeg `package.json` toe met `name`, `version` en `type`.
- Voeg een `openclaw`-blok toe wanneer het pakket een OpenClaw Plugin levert.
- Gebruik [Plugins bouwen](/nl/plugins/building-plugins) voor een minimaal pakketvoorbeeld
  en [Plugin-manifest](/nl/plugins/manifest#manifest-versus-packagejson)
  voor de scheiding tussen pakket en manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-metadata-missing

Het pakket heeft `package.json`, maar declareert geen OpenClaw-pakketmetadata.

- Voeg `package.json#openclaw` toe.
- Neem entrypointmetadata op, zoals `openclaw.extensions` of
  `openclaw.runtimeExtensions`.
- Voeg compatibiliteits- en installatiemetadata toe wanneer het pakket wordt gepubliceerd of
  geïnstalleerd via ClawHub.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-entry-missing

De pakketmetadata bestaat, maar declareert geen OpenClaw-runtime-
entrypoint.

- Voeg `openclaw.extensions` toe voor native Plugin-entrypoints.
- Voeg `openclaw.runtimeExtensions` toe wanneer het gepubliceerde pakket gebouwde
  JavaScript moet laden.
- Houd alle entrypointpaden binnen de pakketdirectory.
- Zie [Plugin-entrypoints](/nl/plugins/sdk-entrypoints) en
  [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-entrypoint-missing

Het pakket declareert een OpenClaw-entrypoint, maar het bestand waarnaar wordt verwezen ontbreekt
in het pakket dat wordt gevalideerd.

- Controleer elk pad in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` en `openclaw.runtimeSetupEntry`.
- Bouw het pakket als het entrypoint in `dist` wordt gegenereerd.
- Werk de metadata bij als het entrypoint is verplaatst.
- Zie [Plugin-entrypoints](/nl/plugins/sdk-entrypoints).
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

Het pakket declareert niet welk OpenClaw Plugin-API-bereik het ondersteunt.

- Voeg `openclaw.compat.pluginApi` toe aan `package.json`.
- Gebruik de OpenClaw Plugin-API-versie of semver-ondergrens waarvoor je hebt gebouwd en getest.
- Houd dit gescheiden van de pakketversie. De pakketversie beschrijft de
  Plugin-release; `openclaw.compat.pluginApi` beschrijft het host-API-contract.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-min-host-version-drift

De minimale hostversie van het pakket komt niet overeen met de OpenClaw-versiemetadata
waarmee het pakket is gebouwd.

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
- Als `openclaw.plugin.json` ook `version` heeft, werk dit dan bij zodat het overeenkomt of verwijder
  verouderde manifestversiemetadata wanneer pakketmetadata gezaghebbend is.
- Publiceer een nieuwe pakketversie na het wijzigen van gepubliceerde metadata.
- Zie [Plugin-manifest](/nl/plugins/manifest).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-unsupported-metadata

Het `package.json#openclaw`-blok bevat velden die geen ondersteunde
OpenClaw-pakketmetadata zijn.

- Verwijder niet-ondersteunde velden zoals `openclaw.bundle`.
- Bewaar native Plugin-metadata in `openclaw.plugin.json`.
- Bewaar pakket-entrypoints, compatibiliteit, installatie, setup en catalogusmetadata
  in ondersteunde `package.json#openclaw`-velden.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gepubliceerd artefact

### package-npm-pack-unavailable

Het pakket kan niet worden verpakt in het artefact dat ClawHub zou inspecteren of
publiceren.

- Voer `npm pack --dry-run` uit vanuit de pakketroot.
- Los ongeldige pakketmetadata, kapotte lifecycle-scripts of files-vermeldingen op die
  ervoor zorgen dat verpakken mislukt.
- Verwijder `private: true` als dit pakket bedoeld is voor openbare publicatie.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-entrypoint-missing

Het pakket kan worden verpakt, maar het verpakte artefact bevat niet de
entrypointbestanden die in `package.json#openclaw` zijn gedeclareerd.

- Voer `npm pack --dry-run` uit en inspecteer de bestanden die zouden worden opgenomen.
- Bouw gegenereerde entrypoints vóór het verpakken.
- Werk `files`, `.npmignore` of build-uitvoer bij zodat gedeclareerde entrypoints worden
  opgenomen.
- Zie [Plugin-entrypoints](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-metadata-missing

In het verpakte artefact ontbreekt OpenClaw-metadata die in je bronpakket bestaat.

- Voer `npm pack --dry-run` uit en inspecteer de opgenomen metadatabestanden.
- Zorg ervoor dat `package.json` het `openclaw`-blok bevat in het verpakte artefact.
- Zorg ervoor dat `openclaw.plugin.json` wordt opgenomen wanneer het pakket een native
  OpenClaw Plugin is.
- Werk `files` of `.npmignore` bij zodat pakketmetadata niet wordt uitgesloten.
- Zie [Plugins bouwen](/nl/plugins/building-plugins).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Manifestmetadata

### manifest-name-missing

Het native Plugin-manifest bevat geen weergavenaam.

- Voeg een niet-leeg `name`-veld toe aan `openclaw.plugin.json`.
- Houd `name` leesbaar voor mensen en houd `id` als de stabiele machine-id.
- Zie [Plugin-manifest](/nl/plugins/manifest).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### manifest-unknown-fields

Het Plugin-manifest heeft top-level velden die OpenClaw niet ondersteunt.

- Vergelijk elk top-level veld met de
  [referentie voor manifestvelden](/nl/plugins/manifest#top-level-field-reference).
- Verwijder aangepaste velden uit `openclaw.plugin.json`.
- Verplaats package- of installatiemetadata naar ondersteunde `package.json#openclaw`-velden
  in plaats van naar het manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### manifest-unknown-contracts

Het manifest declareert niet-ondersteunde sleutels binnen `contracts`.

- Vergelijk elke sleutel onder `contracts` met de
  [contracts-referentie](/nl/plugins/manifest#contracts-reference).
- Verwijder niet-ondersteunde contractsleutels.
- Verplaats runtimegedrag naar Plugin-registratiecode, en beperk `contracts`
  tot statische metadata voor eigenaarschap van mogelijkheden.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## SDK en compatibiliteitsmigratie

### legacy-root-sdk-import

De Plugin importeert uit de verouderde root-SDK-barrel:
`openclaw/plugin-sdk`.

- Vervang imports uit de root-barrel door gerichte publieke subpadimports.
- Gebruik `openclaw/plugin-sdk/plugin-entry` voor `definePluginEntry`.
- Gebruik `openclaw/plugin-sdk/channel-core` voor kanaal-entryhelpers.
- Gebruik [Importconventies](/nl/plugins/building-plugins#import-conventions) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths) om de nauwe import te vinden.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### reserved-sdk-import

De Plugin importeert een SDK-pad dat is gereserveerd voor gebundelde Plugins of interne
compatibiliteit.

- Vervang gereserveerde interne OpenClaw-SDK-imports door gedocumenteerde publieke
  `openclaw/plugin-sdk/*`-subpaden.
- Als het gedrag geen publieke SDK heeft, houd de helper dan binnen je package of
  vraag een publieke OpenClaw-API aan.
- Gebruik [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths) en
  [SDK-migratie](/nl/plugins/sdk-migration) om een ondersteunde import te kiezen.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-load-session-store

De Plugin gebruikt nog steeds de verouderde helper voor de volledige sessiestore
`loadSessionStore`.

- Gebruik `getSessionEntry(...)` of `listSessionEntries(...)` bij het lezen van sessie-
  state.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` bij het schrijven van sessie-
  state.
- Vermijd het laden, muteren en opslaan van het volledige sessiestore-object.
- Houd `loadSessionStore(...)` alleen zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-store-write

De Plugin gebruikt nog steeds een verouderde schrijfhelper voor de volledige sessiestore, zoals
`saveSessionStore` of `updateSessionStore`.

- Gebruik `patchSessionEntry(...)` bij het bijwerken van velden op een bestaande sessie-
  entry.
- Gebruik `upsertSessionEntry(...)` bij het vervangen of maken van een sessie-entry.
- Vermijd het laden, muteren en opslaan van het volledige sessiestore-object.
- Houd schrijfhelpers voor de volledige store alleen zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die ze vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-file-helper

De Plugin gebruikt nog steeds verouderde helpers voor sessiebestandspaden, zoals
`resolveSessionFilePath` of `resolveAndPersistSessionFile`.

- Gebruik `getSessionEntry(...)` om sessiemetadata per agent- en sessie-
  identiteit te lezen.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` om sessie-
  metadata te bewaren.
- Gebruik transcriptidentiteit of doelhelpers wanneer de code een
  transcriptbewerking voorbereidt.
- Bewaar geen verouderde transcriptbestandspaden en maak je er niet afhankelijk van.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-transcript-file-target

De Plugin gebruikt nog steeds de verouderde helper voor transcriptbestanddoelen
`resolveSessionTranscriptLegacyFileTarget`.

- Gebruik `resolveSessionTranscriptIdentity(...)` wanneer de code alleen publieke
  sessie-identiteit nodig heeft.
- Gebruik `resolveSessionTranscriptTarget(...)` wanneer de code een gestructureerd
  doel voor een transcriptbewerking nodig heeft.
- Vermijd het rechtstreeks lezen of construeren van verouderde transcriptbestanddoelen.
- Houd de verouderde helper alleen zolang je gedeclareerde compatibiliteitsbereik nog
  oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-transcript-low-level

De Plugin gebruikt nog steeds verouderde low-level transcripthelpers, zoals
`appendSessionTranscriptMessage` of `emitSessionTranscriptUpdate`.

- Gebruik `appendSessionTranscriptMessageByIdentity(...)` voor transcripttoevoegingen.
- Gebruik `publishSessionTranscriptUpdateByIdentity(...)` voor transcriptupdate-
  meldingen.
- Geef de voorkeur aan het gestructureerde transcriptruntime-oppervlak, zodat OpenClaw de
  juiste transactiegrenzen en identiteitsafhandeling kan toepassen.
- Houd low-level transcripthelpers alleen zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die ze vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### legacy-before-agent-start

De Plugin gebruikt nog steeds de legacy `before_agent_start`-hook.

- Verplaats werk voor model- of provideroverrides naar `before_model_resolve`.
- Verplaats werk voor prompt- of contextmutatie naar `before_prompt_build`.
- Houd `before_agent_start` alleen zolang je gedeclareerde compatibiliteitsbereik nog
  oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Hooks](/nl/plugins/hooks) en
  [Plugin-compatibiliteit](/nl/plugins/compatibility).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### provider-auth-env-vars

Het manifest gebruikt nog steeds legacy `providerAuthEnvVars`-metadata voor providerauthenticatie.

- Spiegel provider-env-var-metadata naar `setup.providers[].envVars`.
- Houd `providerAuthEnvVars` alleen als compatibiliteitsmetadata zolang je ondersteunde
  OpenClaw-bereik dit nog nodig heeft.
- Zie [setup-referentie](/nl/plugins/manifest#setup-reference) en
  [SDK-migratie](/nl/plugins/sdk-migration).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### channel-env-vars

Het manifest gebruikt legacy of oudere kanaal-env-var-metadata zonder de huidige
setup- of configmetadata die ClawHub verwacht.

- Houd kanaal-env-var-metadata declaratief, zodat OpenClaw de setupstatus kan inspecteren
  zonder de kanaalruntime te laden.
- Spiegel env-gestuurde kanaalsetup naar de huidige setup-, kanaalconfig- of
  package-kanaalmetadata die door jouw Plugin-vorm wordt gebruikt.
- Houd `channelEnvVars` alleen als compatibiliteitsmetadata zolang oudere ondersteunde
  OpenClaw-versies dit nog vereisen.
- Zie [Plugin-manifest](/nl/plugins/manifest) en
  [kanaal-Plugins](/nl/plugins/sdk-channel-plugins).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Beveiligingsmanifest

### security-manifest-schema-unavailable

Het package levert `openclaw.security.json` met een schemareferentie die ClawHub
niet als beschikbaar herkent.

- Verwijder de schema-URL als die alleen adviserend is.
- Gebruik pas een gedocumenteerd geversioneerd schema nadat OpenClaw er een publiceert.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### unrecognized-security-manifest

Het package levert een niet-ondersteund beveiligingsmanifestbestand.

- Verwijder `openclaw.security.json` totdat OpenClaw een geversioneerd beveiligings-
  manifestschema en ClawHub-gedrag documenteert.
- Houd beveiligingsgevoelig gedrag gedocumenteerd in je publieke packagedocumentatie of
  README totdat het manifestcontract bestaat.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gerelateerd

- [ClawHub-CLI](/nl/clawhub/cli)
- [ClawHub-publicatie](/nl/clawhub/publishing)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin-manifest](/nl/plugins/manifest)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Plugin-compatibiliteit](/nl/plugins/compatibility)
