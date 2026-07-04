---
read_when:
    - Je hebt clawhub package validate uitgevoerd en moet Plugin-bevindingen oplossen
    - ClawHub heeft het publiceren van een Plugin-pakket geweigerd of ervoor gewaarschuwd
    - U werkt Plugin-pakketmetadata bij vóór de release
summary: Los bevindingen voor validatie van ClawHub Plugin-pakketten op vóór publicatie
title: Plugin-validatiefixes
x-i18n:
    generated_at: "2026-07-04T10:50:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin-validatiefixes

ClawHub valideert Plugin-pakketten vóór publicatie en kan ook bevindingen uit
geautomatiseerde pakketscans tonen. Deze pagina behandelt auteursgerichte
bevindingen, wat betekent: bevindingen die de Plugin-auteur kan oplossen in de
pakketmetadata, het manifest, SDK-imports of het gepubliceerde artefact.

Dit behandelt geen interne dekkingsbevindingen van Plugin Inspector. Als een
volledig rapport scanneronderhoudscodes bevat zonder herstelrichtlijnen voor
auteurs, zijn die bedoeld voor OpenClaw-beheerders in plaats van Plugin-auteurs.

Voer na het toepassen van een fix opnieuw uit:

```bash
clawhub package validate <path-to-plugin>
```

## Auteursgerichte bevindingen

| Code                                    | Begin hier                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Pakketmetadata toevoegen](/nl/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Het pakket-openclaw-blok toevoegen](/nl/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw-pakketentrypoints declareren](/nl/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [De gedeclareerde entrypoint publiceren](/nl/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Installatiemetadata voltooien](/nl/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Compatibiliteit met de Plugin-API declareren](/nl/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Minimale hostversie uitlijnen](/nl/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Pakket- en manifestversies uitlijnen](/nl/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Niet-ondersteunde OpenClaw-pakketmetadata verwijderen](/nl/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Zorgen dat het npm-artefact verpakt kan worden](/nl/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Entrypoints opnemen in npm-pack-uitvoer](/nl/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Metadata opnemen in npm-pack-uitvoer](/nl/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Een weergavenaam voor het manifest toevoegen](/nl/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Niet-ondersteunde manifestvelden verwijderen](/nl/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Niet-ondersteunde contractsleutels verwijderen](/nl/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Root-SDK-imports vervangen](/nl/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Gereserveerde SDK-imports verwijderen](/nl/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Toegang tot de volledige session-store vervangen](/nl/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Schrijfacties naar de volledige session-store vervangen](/nl/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Helpers voor sessiebestandspaden vervangen](/nl/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Verouderde transcriptbestanddoelen vervangen](/nl/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Low-level transcripthelpers vervangen](/nl/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start vervangen](/nl/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Provider-env-vars naar setupmetadata verplaatsen](/nl/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Kanaal-env-vars spiegelen in huidige metadata](/nl/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Niet-beschikbare beveiligingsmanifest-schemaverwijzingen verwijderen](/nl/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Niet-ondersteunde beveiligingsmanifestbestanden verwijderen](/nl/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Pakketmetadata

### package-json-missing

De pakketroot bevat geen `package.json`, waardoor ClawHub het npm-pakket, de
versie, entrypoints of OpenClaw-metadata niet kan identificeren.

- Voeg `package.json` toe met `name`, `version` en `type`.
- Voeg een `openclaw`-blok toe wanneer het pakket een OpenClaw-Plugin levert.
- Gebruik [Plugins bouwen](/nl/plugins/building-plugins) voor een minimaal
  pakketvoorbeeld en [Plugin-manifest](/nl/plugins/manifest#manifest-versus-packagejson)
  voor de scheiding tussen pakket en manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-metadata-missing

Het pakket heeft `package.json`, maar declareert geen OpenClaw-pakketmetadata.

- Voeg `package.json#openclaw` toe.
- Neem entrypointmetadata op zoals `openclaw.extensions` of
  `openclaw.runtimeExtensions`.
- Voeg compatibiliteits- en installatiemetadata toe wanneer het pakket via
  ClawHub wordt gepubliceerd of geïnstalleerd.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-entry-missing

De pakketmetadata bestaat, maar declareert geen OpenClaw-runtime-entrypoint.

- Voeg `openclaw.extensions` toe voor native Plugin-entrypoints.
- Voeg `openclaw.runtimeExtensions` toe wanneer het gepubliceerde pakket
  gebouwde JavaScript moet laden.
- Houd alle entrypointpaden binnen de pakketdirectory.
- Zie [Plugin-entrypoints](/nl/plugins/sdk-entrypoints) en
  [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-entrypoint-missing

Het pakket declareert een OpenClaw-entrypoint, maar het verwezen bestand
ontbreekt in het pakket dat wordt gevalideerd.

- Controleer elk pad in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` en `openclaw.runtimeSetupEntry`.
- Bouw het pakket als de entrypoint in `dist` wordt gegenereerd.
- Werk de metadata bij als de entrypoint is verplaatst.
- Zie [Plugin-entrypoints](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-install-metadata-incomplete

ClawHub kan niet bepalen hoe het pakket moet worden geïnstalleerd of
bijgewerkt.

- Vul `openclaw.install` met de ondersteunde installatiebron, zoals
  `clawhubSpec`, `npmSpec` of `localPath`.
- Stel `openclaw.install.defaultChoice` in wanneer er meer dan één
  installatiebron beschikbaar is.
- Gebruik `openclaw.install.minHostVersion` voor de minimale OpenClaw-hostversie.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-plugin-api-compat-missing

Het pakket declareert niet welk OpenClaw-Plugin-API-bereik het ondersteunt.

- Voeg `openclaw.compat.pluginApi` toe aan `package.json`.
- Gebruik de OpenClaw-Plugin-API-versie of semver-ondergrens waartegen je hebt
  gebouwd en getest.
- Houd dit gescheiden van de pakketversie. De pakketversie beschrijft de
  Plugin-release; `openclaw.compat.pluginApi` beschrijft het host-API-contract.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-min-host-version-drift

De minimale hostversie van het pakket komt niet overeen met de
OpenClaw-versiemetadata waartegen het pakket is gebouwd.

- Controleer `openclaw.install.minHostVersion`.
- Controleer eventuele OpenClaw-buildmetadata in het pakket, zoals de
  OpenClaw-versie die tijdens de release is gebruikt.
- Lijn de minimale hostversie uit met het hostversiebereik dat het pakket
  daadwerkelijk ondersteunt.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-manifest-version-drift

De pakketversie en Plugin-manifestversie spreken elkaar tegen.

- Geef de voorkeur aan `package.json#version` als pakketreleaseversie.
- Als `openclaw.plugin.json` ook `version` heeft, werk dit dan bij zodat het
  overeenkomt, of verwijder verouderde manifestversiemetadata wanneer
  pakketmetadata leidend is.
- Publiceer een nieuwe pakketversie na het wijzigen van gepubliceerde metadata.
- Zie [Plugin-manifest](/nl/plugins/manifest).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-unsupported-metadata

Het `package.json#openclaw`-blok bevat velden die geen ondersteunde
OpenClaw-pakketmetadata zijn.

- Verwijder niet-ondersteunde velden zoals `openclaw.bundle`.
- Houd native Plugin-metadata in `openclaw.plugin.json`.
- Houd pakketentrypoints, compatibiliteit, installatie, setup en
  catalogusmetadata in ondersteunde `package.json#openclaw`-velden.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gepubliceerd artefact

### package-npm-pack-unavailable

Het pakket kan niet worden verpakt tot het artefact dat ClawHub zou inspecteren
of publiceren.

- Voer `npm pack --dry-run` uit vanuit de pakketroot.
- Los ongeldige pakketmetadata, defecte lifecyclescripts of files-vermeldingen
  op waardoor verpakken mislukt.
- Verwijder `private: true` als dit pakket bedoeld is voor openbare publicatie.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-entrypoint-missing

Het pakket kan worden verpakt, maar het verpakte artefact bevat niet de
entrypointbestanden die in `package.json#openclaw` zijn gedeclareerd.

- Voer `npm pack --dry-run` uit en inspecteer de bestanden die zouden worden
  opgenomen.
- Bouw gegenereerde entrypoints vóór het verpakken.
- Werk `files`, `.npmignore` of build-uitvoer bij zodat gedeclareerde
  entrypoints worden opgenomen.
- Zie [Plugin-entrypoints](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-metadata-missing

Het verpakte artefact mist OpenClaw-metadata die in je bronpakket bestaat.

- Voer `npm pack --dry-run` uit en inspecteer de opgenomen metadatabestanden.
- Zorg dat `package.json` het `openclaw`-blok bevat in het verpakte artefact.
- Zorg dat `openclaw.plugin.json` wordt opgenomen wanneer het pakket een native
  OpenClaw-Plugin is.
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
  [manifestveldreferentie](/nl/plugins/manifest#top-level-field-reference).
- Verwijder aangepaste velden uit `openclaw.plugin.json`.
- Verplaats package- of installatiemetadata naar ondersteunde `package.json#openclaw`-velden
  in plaats van naar het manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### manifest-unknown-contracts

Het manifest declareert niet-ondersteunde sleutels binnen `contracts`.

- Vergelijk elke sleutel onder `contracts` met de
  [contracts-referentie](/nl/plugins/manifest#contracts-reference).
- Verwijder niet-ondersteunde contracts-sleutels.
- Verplaats runtime-gedrag naar de Plugin-registratiecode en beperk `contracts`
  tot statische metadata over capability-eigenaarschap.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## SDK- en compatibiliteitsmigratie

### legacy-root-sdk-import

De Plugin importeert uit de verouderde root-SDK-barrel:
`openclaw/plugin-sdk`.

- Vervang root-barrel-imports door gerichte openbare subpath-imports.
- Gebruik `openclaw/plugin-sdk/plugin-entry` voor `definePluginEntry`.
- Gebruik `openclaw/plugin-sdk/channel-core` voor channel entry-helpers.
- Gebruik [Importconventies](/nl/plugins/building-plugins#import-conventions) en
  [Plugin SDK-subpaths](/nl/plugins/sdk-subpaths) om de smalle import te vinden.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### reserved-sdk-import

De Plugin importeert een SDK-pad dat is gereserveerd voor gebundelde plugins of interne
compatibiliteit.

- Vervang gereserveerde interne OpenClaw SDK-imports door gedocumenteerde openbare
  `openclaw/plugin-sdk/*`-subpaths.
- Als het gedrag geen openbare SDK heeft, houd de helper dan binnen je package of
  vraag een openbare OpenClaw API aan.
- Gebruik [Plugin SDK-subpaths](/nl/plugins/sdk-subpaths) en
  [SDK-migratie](/nl/plugins/sdk-migration) om een ondersteunde import te kiezen.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-load-session-store

De Plugin gebruikt nog steeds de verouderde whole-session-store-helper
`loadSessionStore`.

- Gebruik `getSessionEntry(...)` of `listSessionEntries(...)` bij het lezen van session
  state.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` bij het schrijven van session
  state.
- Vermijd het laden, wijzigen en opslaan van het volledige session store-object.
- Houd `loadSessionStore(...)` alleen zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Runtime API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-store-write

De Plugin gebruikt nog steeds een verouderde whole-session-store-schrijfhelper zoals
`saveSessionStore` of `updateSessionStore`.

- Gebruik `patchSessionEntry(...)` bij het bijwerken van velden op een bestaande session
  entry.
- Gebruik `upsertSessionEntry(...)` bij het vervangen of maken van een session entry.
- Vermijd het laden, wijzigen en opslaan van het volledige session store-object.
- Houd whole-store-schrijfhelpers alleen zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die ze vereisen.
- Zie [Runtime API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-file-helper

De Plugin gebruikt nog steeds verouderde session file-path-helpers zoals
`resolveSessionFilePath` of `resolveAndPersistSessionFile`.

- Gebruik `getSessionEntry(...)` om session-metadata te lezen op basis van agent- en session-
  identiteit.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` om session-
  metadata te bewaren.
- Gebruik transcript-identiteit of target-helpers wanneer de code een
  transcript-bewerking voorbereidt.
- Bewaar geen legacy transcript-bestandspaden en maak je er niet afhankelijk van.
- Zie [Runtime API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-transcript-file-target

De Plugin gebruikt nog steeds de verouderde transcript file target-helper
`resolveSessionTranscriptLegacyFileTarget`.

- Gebruik `resolveSessionTranscriptIdentity(...)` wanneer de code alleen openbare
  session-identiteit nodig heeft.
- Gebruik `resolveSessionTranscriptTarget(...)` wanneer de code een gestructureerd
  target voor transcript-bewerkingen nodig heeft.
- Vermijd het rechtstreeks lezen of construeren van legacy transcript file targets.
- Houd de legacy-helper alleen zolang je gedeclareerde compatibiliteitsbereik nog
  oudere OpenClaw-versies ondersteunt die deze vereisen.
- Zie [Runtime API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-transcript-low-level

De Plugin gebruikt nog steeds verouderde low-level transcript-helpers zoals
`appendSessionTranscriptMessage` of `emitSessionTranscriptUpdate`.

- Gebruik `appendSessionTranscriptMessageByIdentity(...)` voor transcript-toevoegingen.
- Gebruik `publishSessionTranscriptUpdateByIdentity(...)` voor transcript-update-
  meldingen.
- Geef de voorkeur aan het gestructureerde transcript-runtime-oppervlak zodat OpenClaw de
  juiste transactiegrenzen en identiteitsafhandeling kan toepassen.
- Houd low-level transcript-helpers alleen zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die ze vereisen.
- Zie [Runtime API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### legacy-before-agent-start

De Plugin gebruikt nog steeds de legacy `before_agent_start`-hook.

- Verplaats model- of provider-overridewerk naar `before_model_resolve`.
- Verplaats prompt- of contextmutatiewerk naar `before_prompt_build`.
- Houd `before_agent_start` alleen zolang je gedeclareerde compatibiliteitsbereik nog
  oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Hooks](/nl/plugins/hooks) en
  [Plugin-compatibiliteit](/nl/plugins/compatibility).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### provider-auth-env-vars

Het manifest gebruikt nog steeds legacy `providerAuthEnvVars`-provider-auth-metadata.

- Spiegel provider-env-var-metadata naar `setup.providers[].envVars`.
- Houd `providerAuthEnvVars` alleen als compatibiliteitsmetadata zolang je ondersteunde
  OpenClaw-bereik dit nog nodig heeft.
- Zie [setup-referentie](/nl/plugins/manifest#setup-reference) en
  [SDK-migratie](/nl/plugins/sdk-migration).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### channel-env-vars

Het manifest gebruikt legacy of oudere channel env-var-metadata zonder de huidige
setup- of configmetadata die ClawHub verwacht.

- Houd channel env-var-metadata declaratief zodat OpenClaw de setupstatus kan inspecteren
  zonder de channel-runtime te laden.
- Spiegel env-gestuurde channel-setup naar de huidige setup-, channel-config- of
  package-channel-metadata die door je Plugin-vorm wordt gebruikt.
- Houd `channelEnvVars` alleen als compatibiliteitsmetadata zolang oudere ondersteunde
  OpenClaw-versies dit nog vereisen.
- Zie [Plugin-manifest](/nl/plugins/manifest) en
  [Channel-plugins](/nl/plugins/sdk-channel-plugins).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Beveiligingsmanifest

### security-manifest-schema-unavailable

Het package levert `openclaw.security.json` met een schemareferentie die ClawHub
niet als beschikbaar herkent.

- Verwijder de schema-URL als deze alleen adviserend is.
- Gebruik pas een gedocumenteerd versie-schema nadat OpenClaw er een publiceert.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### unrecognized-security-manifest

Het package levert een niet-ondersteund beveiligingsmanifestbestand.

- Verwijder `openclaw.security.json` totdat OpenClaw een versie-beveiligingsmanifest-
  schema en ClawHub-gedrag documenteert.
- Houd beveiligingsgevoelig gedrag gedocumenteerd in je openbare package-docs of
  README totdat het manifestcontract bestaat.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gerelateerd

- [ClawHub CLI](/nl/clawhub/cli)
- [ClawHub-publicatie](/nl/clawhub/publishing)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin-manifest](/nl/plugins/manifest)
- [Plugin entry points](/nl/plugins/sdk-entrypoints)
- [Plugin-compatibiliteit](/nl/plugins/compatibility)
