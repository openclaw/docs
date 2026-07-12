---
read_when:
    - Je hebt `clawhub package validate` uitgevoerd en moet de bevindingen voor de Plugin oplossen
    - ClawHub heeft de publicatie van een Plugin-pakket geweigerd of er een waarschuwing over gegeven
    - Je werkt de pakketmetagegevens van de Plugin bij vóór de release
summary: Los bevindingen van de ClawHub-validatie van Plugin-pakketten op vóór publicatie
title: Oplossingen voor Plugin-validatie
x-i18n:
    generated_at: "2026-07-12T08:42:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Oplossingen voor Plugin-validatie

ClawHub valideert Plugin-pakketten vóór publicatie en kan ook bevindingen uit
geautomatiseerde pakketscans tonen. Deze pagina behandelt bevindingen voor auteurs,
oftewel bevindingen die de Plugin-auteur kan oplossen in de pakketmetadata, het manifest,
SDK-imports of het gepubliceerde artefact.

Interne bevindingen over de dekking van Plugin Inspector worden hier niet behandeld. Als
een volledig rapport onderhoudscodes voor de scanner bevat zonder herstelrichtlijnen voor
auteurs, zijn die bedoeld voor OpenClaw-beheerders en niet voor Plugin-auteurs.

Voer na elke aangebrachte oplossing opnieuw het volgende uit:

```bash
clawhub package validate <path-to-plugin>
```

## Bevindingen voor auteurs

| Code                                    | Begin hier                                                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Voeg pakketmetadata toe](/nl/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Voeg het openclaw-blok aan het pakket toe](/nl/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                     |
| `package-openclaw-entry-missing`        | [Declareer OpenClaw-pakketingangspunten](/nl/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                          |
| `package-entrypoint-missing`            | [Publiceer het gedeclareerde ingangspunt](/nl/clawhub/plugin-validation-fixes#package-entrypoint-missing)                             |
| `package-install-metadata-incomplete`   | [Vul de installatiemetadata aan](/nl/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                             |
| `package-plugin-api-compat-missing`     | [Declareer compatibiliteit met de Plugin-API](/nl/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                  |
| `package-min-host-version-drift`        | [Breng de minimale hostversie op één lijn](/nl/clawhub/plugin-validation-fixes#package-min-host-version-drift)                        |
| `package-manifest-version-drift`        | [Breng pakket- en manifestversies op één lijn](/nl/clawhub/plugin-validation-fixes#package-manifest-version-drift)                    |
| `package-openclaw-unsupported-metadata` | [Verwijder niet-ondersteunde OpenClaw-pakketmetadata](/nl/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)      |
| `package-npm-pack-unavailable`          | [Maak het npm-artefact verpakbaar](/nl/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                  |
| `package-npm-pack-entrypoint-missing`   | [Neem ingangspunten op in de uitvoer van npm pack](/nl/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)           |
| `package-npm-pack-metadata-missing`     | [Neem metadata op in de uitvoer van npm pack](/nl/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                  |
| `manifest-name-missing`                 | [Voeg een weergavenaam aan het manifest toe](/nl/clawhub/plugin-validation-fixes#manifest-name-missing)                              |
| `manifest-unknown-fields`               | [Verwijder niet-ondersteunde manifestvelden](/nl/clawhub/plugin-validation-fixes#manifest-unknown-fields)                            |
| `manifest-unknown-contracts`            | [Verwijder niet-ondersteunde contractsleutels](/nl/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                        |
| `legacy-root-sdk-import`                | [Vervang SDK-imports vanuit de hoofdmodule](/nl/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                              |
| `reserved-sdk-import`                   | [Verwijder gereserveerde SDK-imports](/nl/clawhub/plugin-validation-fixes#reserved-sdk-import)                                       |
| `sdk-load-session-store`                | [Vervang toegang tot de volledige sessieopslag](/nl/clawhub/plugin-validation-fixes#sdk-load-session-store)                          |
| `sdk-session-store-write`               | [Vervang schrijfbewerkingen naar de volledige sessieopslag](/nl/clawhub/plugin-validation-fixes#sdk-session-store-write)             |
| `sdk-session-file-helper`               | [Vervang helpers voor sessiebestandspaden](/nl/clawhub/plugin-validation-fixes#sdk-session-file-helper)                              |
| `sdk-session-transcript-file-target`    | [Vervang verouderde transcriptbestandsdoelen](/nl/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                |
| `sdk-session-transcript-low-level`      | [Vervang laag-niveauhelpers voor transcripten](/nl/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                 |
| `legacy-before-agent-start`             | [Vervang before_agent_start](/nl/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                          |
| `provider-auth-env-vars`                | [Verplaats omgevingsvariabelen van de provider naar instellingsmetadata](/nl/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Neem omgevingsvariabelen van het kanaal over in de huidige metadata](/nl/clawhub/plugin-validation-fixes#channel-env-vars)          |
| `security-manifest-schema-unavailable`  | [Verwijder verwijzingen naar niet-beschikbare beveiligingsmanifestschema's](/nl/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Verwijder niet-ondersteunde beveiligingsmanifestbestanden](/nl/clawhub/plugin-validation-fixes#unrecognized-security-manifest)      |

## Pakketmetadata

### package-json-missing

De hoofdmap van het pakket bevat geen `package.json`, waardoor ClawHub het
npm-pakket, de versie, de ingangspunten of de OpenClaw-metadata niet kan identificeren.

- Voeg `package.json` toe met `name`, `version` en `type`.
- Voeg een `openclaw`-blok toe wanneer het pakket een OpenClaw-Plugin bevat.
- Gebruik [Plugins bouwen](/nl/plugins/building-plugins) voor een minimaal
  pakketvoorbeeld en [Plugin-manifest](/nl/plugins/manifest#manifest-versus-packagejson)
  voor de scheiding tussen pakket en manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-metadata-missing

Het pakket heeft een `package.json`, maar declareert geen
OpenClaw-pakketmetadata.

- Voeg `package.json#openclaw` toe.
- Neem metadata voor ingangspunten op, zoals `openclaw.extensions` of
  `openclaw.runtimeExtensions`.
- Voeg compatibiliteits- en installatiemetadata toe wanneer het pakket via
  ClawHub wordt gepubliceerd of geïnstalleerd.
- Zie [package.json-velden die de detectie beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-entry-missing

De pakketmetadata bestaat, maar declareert geen OpenClaw-ingangspunt voor
uitvoering.

- Voeg `openclaw.extensions` toe voor ingangspunten van native Plugins.
- Voeg `openclaw.runtimeExtensions` toe wanneer het gepubliceerde pakket
  gebouwde JavaScript moet laden.
- Houd alle paden naar ingangspunten binnen de pakketmap.
- Zie [Plugin-ingangspunten](/nl/plugins/sdk-entrypoints) en
  [package.json-velden die de detectie beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-entrypoint-missing

Het pakket declareert een OpenClaw-ingangspunt, maar het bestand waarnaar wordt
verwezen ontbreekt in het pakket dat wordt gevalideerd.

- Controleer elk pad in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` en `openclaw.runtimeSetupEntry`.
- Bouw het pakket als het ingangspunt in `dist` wordt gegenereerd.
- Werk de metadata bij als het ingangspunt is verplaatst.
- Zie [Plugin-ingangspunten](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-install-metadata-incomplete

ClawHub kan niet bepalen hoe het pakket moet worden geïnstalleerd of bijgewerkt.

- Vul `openclaw.install` in met de ondersteunde installatiebron, zoals
  `clawhubSpec`, `npmSpec` of `localPath`.
- Stel `openclaw.install.defaultChoice` in wanneer er meer dan één
  installatiebron beschikbaar is.
- Gebruik `openclaw.install.minHostVersion` voor de minimale OpenClaw-hostversie.
- Zie [package.json-velden die de detectie beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-plugin-api-compat-missing

Het pakket declareert niet welk bereik van de OpenClaw-Plugin-API het ondersteunt.

- Voeg `openclaw.compat.pluginApi` toe aan `package.json`.
- Gebruik de versie of semver-ondergrens van de OpenClaw-Plugin-API waartegen
  u hebt gebouwd en getest.
- Houd dit gescheiden van de pakketversie. De pakketversie beschrijft de
  Plugin-release; `openclaw.compat.pluginApi` beschrijft het API-contract van de host.
- Zie [package.json-velden die de detectie beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-min-host-version-drift

De minimale hostversie van het pakket komt niet overeen met de
OpenClaw-versiemetadata waartegen het pakket is gebouwd.

- Controleer `openclaw.install.minHostVersion`.
- Controleer eventuele OpenClaw-bouwmetadata in het pakket, zoals de
  OpenClaw-versie die tijdens de release is gebruikt.
- Breng de minimale hostversie op één lijn met het hostversiebereik dat het
  pakket daadwerkelijk ondersteunt.
- Zie [package.json-velden die de detectie beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-manifest-version-drift

De pakketversie en de versie in het Plugin-manifest komen niet overeen.

- Gebruik bij voorkeur `package.json#version` als releaseversie van het pakket.
- Als `openclaw.plugin.json` ook een `version` heeft, werk die dan bij zodat
  deze overeenkomt, of verwijder verouderde versiemetadata uit het manifest
  wanneer de pakketmetadata leidend is.
- Publiceer een nieuwe pakketversie nadat u gepubliceerde metadata hebt gewijzigd.
- Zie [Plugin-manifest](/nl/plugins/manifest).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-unsupported-metadata

Het blok `package.json#openclaw` bevat velden die geen ondersteunde
OpenClaw-pakketmetadata zijn.

- Verwijder niet-ondersteunde velden zoals `openclaw.bundle`.
- Bewaar metadata van native Plugins in `openclaw.plugin.json`.
- Bewaar metadata voor pakketingangspunten, compatibiliteit, installatie,
  instelling en catalogi in ondersteunde velden van `package.json#openclaw`.
- Zie [package.json-velden die de detectie beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gepubliceerd artefact

### package-npm-pack-unavailable

Het pakket kan niet worden verpakt in het artefact dat ClawHub zou inspecteren
of publiceren.

- Voer `npm pack --dry-run` uit vanuit de hoofdmap van het pakket.
- Herstel ongeldige pakketmetadata, defecte levenscyclusscripts of
  `files`-vermeldingen waardoor het verpakken mislukt.
- Verwijder `private: true` als dit pakket openbaar moet worden gepubliceerd.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-entrypoint-missing

Het pakket kan worden verpakt, maar het verpakte artefact bevat niet de
ingangspuntbestanden die in `package.json#openclaw` zijn gedeclareerd.

- Voer `npm pack --dry-run` uit en inspecteer de bestanden die zouden worden opgenomen.
- Bouw gegenereerde ingangspunten voordat u het pakket verpakt.
- Werk `files`, `.npmignore` of de bouwuitvoer bij zodat de gedeclareerde
  ingangspunten worden opgenomen.
- Zie [Plugin-ingangspunten](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-metadata-missing

In het verpakte artefact ontbreekt OpenClaw-metadata die wel in uw bronpakket
aanwezig is.

- Voer `npm pack --dry-run` uit en inspecteer de opgenomen metadatabestanden.
- Zorg dat `package.json` het `openclaw`-blok in het verpakte artefact bevat.
- Zorg dat `openclaw.plugin.json` wordt opgenomen wanneer het pakket een native
  OpenClaw-Plugin is.
- Werk `files` of `.npmignore` bij zodat pakketmetadata niet wordt uitgesloten.
- Zie [Plugins bouwen](/nl/plugins/building-plugins).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Manifestmetadata

### manifest-name-missing

Het native Plugin-manifest bevat geen weergavenaam.

- Voeg een niet-leeg veld `name` toe aan `openclaw.plugin.json`.
- Houd `name` leesbaar voor mensen en behoud `id` als de stabiele machine-id.
- Zie [Plugin-manifest](/nl/plugins/manifest).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### manifest-unknown-fields

Het Plugin-manifest bevat velden op het hoogste niveau die OpenClaw niet ondersteunt.

- Vergelijk elk veld op het hoogste niveau met de
  [referentie voor manifestvelden](/nl/plugins/manifest#top-level-field-reference).
- Verwijder aangepaste velden uit `openclaw.plugin.json`.
- Verplaats pakket- of installatiemetagegevens naar ondersteunde velden onder
  `package.json#openclaw` in plaats van naar het manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### manifest-unknown-contracts

Het manifest declareert niet-ondersteunde sleutels binnen `contracts`.

- Vergelijk elke sleutel onder `contracts` met de
  [referentie voor contracten](/nl/plugins/manifest#contracts-reference).
- Verwijder niet-ondersteunde contractsleutels.
- Verplaats runtimegedrag naar de registratiecode van de Plugin en beperk
  `contracts` tot statische metagegevens over eigenaarschap van mogelijkheden.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## SDK- en compatibiliteitsmigratie

### legacy-root-sdk-import

De Plugin importeert uit de verouderde SDK-hoofdbundel:
`openclaw/plugin-sdk`.

- Vervang imports uit de hoofdbundel door gerichte imports uit openbare subpaden.
- Gebruik `openclaw/plugin-sdk/plugin-entry` voor `definePluginEntry`.
- Gebruik `openclaw/plugin-sdk/channel-core` voor helpers voor kanaalingangspunten.
- Gebruik [Importconventies](/nl/plugins/building-plugins#import-conventions) en
  [Subpaden van de Plugin-SDK](/nl/plugins/sdk-subpaths) om de specifieke import te vinden.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### reserved-sdk-import

De Plugin importeert een SDK-pad dat is gereserveerd voor gebundelde Plugins of
interne compatibiliteit.

- Vervang gereserveerde interne SDK-imports van OpenClaw door gedocumenteerde
  openbare subpaden onder `openclaw/plugin-sdk/*`.
- Als het gedrag geen openbare SDK heeft, houd de helper dan binnen uw pakket of
  vraag om een openbare OpenClaw-API.
- Gebruik [Subpaden van de Plugin-SDK](/nl/plugins/sdk-subpaths) en
  [SDK-migratie](/nl/plugins/sdk-migration) om een ondersteunde import te kiezen.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-load-session-store

De Plugin gebruikt nog steeds de verouderde helper voor het volledige
sessiearchief `loadSessionStore`.

- Gebruik `getSessionEntry(...)` of `listSessionEntries(...)` bij het lezen van
  sessiestatus.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` bij het schrijven
  van sessiestatus.
- Vermijd het laden, wijzigen en opslaan van het volledige sessiearchiefobject.
- Behoud `loadSessionStore(...)` alleen zolang uw opgegeven compatibiliteitsbereik
  nog oudere versies van OpenClaw ondersteunt die dit vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Subpaden van de Plugin-SDK](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-store-write

De Plugin gebruikt nog steeds een verouderde schrijfhulp voor het volledige
sessiearchief, zoals `saveSessionStore` of `updateSessionStore`.

- Gebruik `patchSessionEntry(...)` bij het bijwerken van velden in een bestaande
  sessievermelding.
- Gebruik `upsertSessionEntry(...)` bij het vervangen of maken van een
  sessievermelding.
- Vermijd het laden, wijzigen en opslaan van het volledige sessiearchiefobject.
- Behoud schrijfhulpen voor het volledige archief alleen zolang uw opgegeven
  compatibiliteitsbereik nog oudere versies van OpenClaw ondersteunt die deze
  vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Subpaden van de Plugin-SDK](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-file-helper

De Plugin gebruikt nog steeds verouderde helpers voor sessiebestandspaden, zoals
`resolveSessionFilePath` of `resolveAndPersistSessionFile`.

- Gebruik `getSessionEntry(...)` om sessiemetagegevens op basis van agent- en
  sessie-identiteit te lezen.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` om
  sessiemetagegevens op te slaan.
- Gebruik helpers voor transcriptidentiteit of -doelen wanneer de code een
  transcriptbewerking voorbereidt.
- Sla verouderde transcriptbestandspaden niet op en maak u er niet van afhankelijk.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Subpaden van de Plugin-SDK](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-transcript-file-target

De Plugin gebruikt nog steeds de verouderde helper voor transcriptbestanddoelen
`resolveSessionTranscriptLegacyFileTarget`.

- Gebruik `resolveSessionTranscriptIdentity(...)` wanneer de code alleen de
  openbare sessie-identiteit nodig heeft.
- Gebruik `resolveSessionTranscriptTarget(...)` wanneer de code een gestructureerd
  doel voor een transcriptbewerking nodig heeft.
- Vermijd het rechtstreeks lezen of samenstellen van verouderde
  transcriptbestanddoelen.
- Behoud de verouderde helper alleen zolang uw opgegeven compatibiliteitsbereik
  nog oudere versies van OpenClaw ondersteunt die deze vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Subpaden van de Plugin-SDK](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-transcript-low-level

De Plugin gebruikt nog steeds verouderde transcripthelpers op laag niveau, zoals
`appendSessionTranscriptMessage` of `emitSessionTranscriptUpdate`.

- Gebruik `appendSessionTranscriptMessageByIdentity(...)` voor toevoegingen aan
  transcripten.
- Gebruik `publishSessionTranscriptUpdateByIdentity(...)` voor meldingen over
  transcriptupdates.
- Geef de voorkeur aan het gestructureerde runtimeoppervlak voor transcripten,
  zodat OpenClaw de juiste transactiegrenzen en identiteitsafhandeling kan
  toepassen.
- Behoud transcripthelpers op laag niveau alleen zolang uw opgegeven
  compatibiliteitsbereik nog oudere versies van OpenClaw ondersteunt die deze
  vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Subpaden van de Plugin-SDK](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### legacy-before-agent-start

De Plugin gebruikt nog steeds de verouderde hook `before_agent_start`.

- Verplaats werk voor model- of provideroverschrijvingen naar
  `before_model_resolve`.
- Verplaats wijzigingen aan prompts of context naar `before_prompt_build`.
- Behoud `before_agent_start` alleen zolang uw opgegeven compatibiliteitsbereik
  nog oudere versies van OpenClaw ondersteunt die dit vereisen.
- Zie [Hooks](/nl/plugins/hooks) en
  [Plugin-compatibiliteit](/nl/plugins/compatibility).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### provider-auth-env-vars

Het manifest gebruikt nog steeds de verouderde metagegevens
`providerAuthEnvVars` voor providerauthenticatie.

- Spiegel metagegevens over omgevingsvariabelen van de provider naar
  `setup.providers[].envVars`.
- Behoud `providerAuthEnvVars` alleen als compatibiliteitsmetagegevens zolang uw
  ondersteunde OpenClaw-bereik deze nog nodig heeft.
- Zie [setupreferentie](/nl/plugins/manifest#setup-reference) en
  [SDK-migratie](/nl/plugins/sdk-migration).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### channel-env-vars

Het manifest gebruikt verouderde of oudere metagegevens over
kanaalomgevingsvariabelen zonder de huidige setup- of configuratiemetagegevens
die ClawHub verwacht.

- Houd metagegevens over kanaalomgevingsvariabelen declaratief, zodat OpenClaw de
  setupstatus kan inspecteren zonder de kanaalruntime te laden.
- Spiegel omgevingsgestuurde kanaalsetup naar de huidige setup, kanaalconfiguratie
  of pakketmetagegevens voor kanalen die door de structuur van uw Plugin worden
  gebruikt.
- Behoud `channelEnvVars` alleen als compatibiliteitsmetagegevens zolang oudere
  ondersteunde versies van OpenClaw dit nog vereisen.
- Zie [Plugin-manifest](/nl/plugins/manifest) en
  [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Beveiligingsmanifest

### security-manifest-schema-unavailable

Het pakket bevat `openclaw.security.json` met een schemaverwijzing die ClawHub
niet als beschikbaar herkent.

- Verwijder de schema-URL als deze alleen adviserend is.
- Gebruik pas een gedocumenteerd schema met versiebeheer nadat OpenClaw er een
  heeft gepubliceerd.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### unrecognized-security-manifest

Het pakket bevat een niet-ondersteund beveiligingsmanifestbestand.

- Verwijder `openclaw.security.json` totdat OpenClaw een beveiligingsmanifestschema
  met versiebeheer en het gedrag van ClawHub documenteert.
- Documenteer beveiligingsgevoelig gedrag in uw openbare pakketdocumentatie of
  README totdat het manifestcontract bestaat.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gerelateerd

- [ClawHub-CLI](/nl/clawhub/cli)
- [Publiceren via ClawHub](/nl/clawhub/publishing)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin-manifest](/nl/plugins/manifest)
- [Ingangspunten van Plugins](/nl/plugins/sdk-entrypoints)
- [Plugin-compatibiliteit](/nl/plugins/compatibility)
