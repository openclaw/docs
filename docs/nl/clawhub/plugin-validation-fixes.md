---
read_when:
    - Je hebt `clawhub package validate` uitgevoerd en moet Plugin-bevindingen oplossen
    - ClawHub heeft een publicatie van een Plugin-pakket geweigerd of er een waarschuwing voor gegeven
    - Je werkt Plugin-pakketmetadata bij vóór de release
summary: ClawHub-Pluginpakketvalidatiebevindingen oplossen vóór publicatie
title: Oplossingen voor Plugin-validatie
x-i18n:
    generated_at: "2026-06-30T22:23:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Oplossingen voor Plugin-validatie

ClawHub valideert Plugin-pakketten vóór publicatie en kan ook bevindingen tonen uit
geautomatiseerde pakketscans. Deze pagina behandelt bevindingen voor auteurs, wat
betekent bevindingen die de Plugin-auteur kan oplossen in pakketmetagegevens,
manifest, SDK-imports of gepubliceerd artefact.

Dit behandelt geen interne dekkingsbevindingen van Plugin Inspector. Als een
volledig rapport onderhoudscodes van de scanner bevat zonder herstelrichtlijnen
voor auteurs, zijn die bedoeld voor OpenClaw-maintainers in plaats van
Plugin-auteurs.

Voer na het toepassen van een oplossing opnieuw uit:

```bash
clawhub package validate <path-to-plugin>
```

## Bevindingen voor auteurs

| Code                                    | Begin hier                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Voeg pakketmetagegevens toe](/nl/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Voeg het openclaw-blok aan het pakket toe](/nl/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Declareer OpenClaw-pakkettoegangspunten](/nl/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publiceer het gedeclareerde toegangspunt](/nl/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Maak installatiemetagegevens compleet](/nl/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Declareer compatibiliteit met de Plugin-API](/nl/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Lijn de minimale hostversie uit](/nl/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Lijn pakket- en manifestversies uit](/nl/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Verwijder niet-ondersteunde OpenClaw-pakketmetagegevens](/nl/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Maak het npm-artefact packbaar](/nl/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Neem toegangspunten op in npm-packuitvoer](/nl/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Neem metagegevens op in npm-packuitvoer](/nl/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Voeg een weergavenaam aan het manifest toe](/nl/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Verwijder niet-ondersteunde manifestvelden](/nl/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Verwijder niet-ondersteunde contractsleutels](/nl/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Vervang SDK-imports uit de root](/nl/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Verwijder gereserveerde SDK-imports](/nl/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Vervang toegang tot de volledige sessiestore](/nl/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Vervang schrijfbewerkingen naar de volledige sessiestore](/nl/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Vervang helpers voor sessiebestandspaden](/nl/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Vervang verouderde transcriptbestanddoelen](/nl/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Vervang low-level transcripthelpers](/nl/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Vervang before_agent_start](/nl/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Verplaats provider-env-vars naar setup-metagegevens](/nl/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Spiegel kanaal-env-vars in huidige metagegevens](/nl/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Verwijder verwijzingen naar niet-beschikbare beveiligingsmanifestschema's](/nl/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Verwijder niet-ondersteunde beveiligingsmanifestbestanden](/nl/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Pakketmetagegevens

### package-json-missing

De pakketroot bevat geen `package.json`, waardoor ClawHub het npm-pakket, de
versie, toegangspunten of OpenClaw-metagegevens niet kan identificeren.

- Voeg `package.json` toe met `name`, `version` en `type`.
- Voeg een `openclaw`-blok toe wanneer het pakket een OpenClaw-Plugin levert.
- Gebruik [Plugins bouwen](/nl/plugins/building-plugins) voor een minimaal
  pakketvoorbeeld en [Plugin-manifest](/nl/plugins/manifest#manifest-versus-packagejson)
  voor de scheiding tussen pakket en manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-metadata-missing

Het pakket heeft `package.json`, maar declareert geen OpenClaw-pakketmetagegevens.

- Voeg `package.json#openclaw` toe.
- Neem metagegevens voor toegangspunten op, zoals `openclaw.extensions` of
  `openclaw.runtimeExtensions`.
- Voeg compatibiliteits- en installatiemetagegevens toe wanneer het pakket via
  ClawHub wordt gepubliceerd of geïnstalleerd.
- Zie [package.json-velden die discovery beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-entry-missing

De pakketmetagegevens bestaan, maar declareren geen OpenClaw-runtime-
toegangspunt.

- Voeg `openclaw.extensions` toe voor native Plugin-toegangspunten.
- Voeg `openclaw.runtimeExtensions` toe wanneer het gepubliceerde pakket
  gebouwde JavaScript moet laden.
- Houd alle toegangspuntpaden binnen de pakketdirectory.
- Zie [Plugin-toegangspunten](/nl/plugins/sdk-entrypoints) en
  [package.json-velden die discovery beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-entrypoint-missing

Het pakket declareert een OpenClaw-toegangspunt, maar het bestand waarnaar wordt
verwezen ontbreekt in het pakket dat wordt gevalideerd.

- Controleer elk pad in `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` en `openclaw.runtimeSetupEntry`.
- Bouw het pakket als het toegangspunt naar `dist` wordt gegenereerd.
- Werk de metagegevens bij als het toegangspunt is verplaatst.
- Zie [Plugin-toegangspunten](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-install-metadata-incomplete

ClawHub kan niet bepalen hoe het pakket moet worden geïnstalleerd of bijgewerkt.

- Vul `openclaw.install` met de ondersteunde installatiebron, zoals
  `clawhubSpec`, `npmSpec` of `localPath`.
- Stel `openclaw.install.defaultChoice` in wanneer er meer dan één
  installatiebron beschikbaar is.
- Gebruik `openclaw.install.minHostVersion` voor de minimale OpenClaw-hostversie.
- Zie [package.json-velden die discovery beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-plugin-api-compat-missing

Het pakket declareert niet welk bereik van de OpenClaw Plugin-API het
ondersteunt.

- Voeg `openclaw.compat.pluginApi` toe aan `package.json`.
- Gebruik de OpenClaw Plugin-API-versie of semver-ondergrens waartegen je hebt
  gebouwd en getest.
- Houd dit gescheiden van de pakketversie. De pakketversie beschrijft de
  Plugin-release; `openclaw.compat.pluginApi` beschrijft het API-contract van de host.
- Zie [package.json-velden die discovery beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-min-host-version-drift

De minimale hostversie van het pakket komt niet overeen met de
OpenClaw-versiemetagegevens waartegen het pakket is gebouwd.

- Controleer `openclaw.install.minHostVersion`.
- Controleer eventuele OpenClaw-buildmetagegevens in het pakket, zoals de
  OpenClaw-versie die tijdens de release is gebruikt.
- Lijn de minimale hostversie uit met het hostversiebereik dat het pakket
  daadwerkelijk ondersteunt.
- Zie [package.json-velden die discovery beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-manifest-version-drift

De pakketversie en de Plugin-manifestversie komen niet overeen.

- Geef de voorkeur aan `package.json#version` als pakketreleaseversie.
- Als `openclaw.plugin.json` ook `version` heeft, werk die dan bij zodat die
  overeenkomt, of verwijder verouderde manifestversiemetagegevens wanneer
  pakketmetagegevens leidend zijn.
- Publiceer een nieuwe pakketversie nadat je gepubliceerde metagegevens hebt
  gewijzigd.
- Zie [Plugin-manifest](/nl/plugins/manifest).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-unsupported-metadata

Het `package.json#openclaw`-blok bevat velden die geen ondersteunde
OpenClaw-pakketmetagegevens zijn.

- Verwijder niet-ondersteunde velden zoals `openclaw.bundle`.
- Houd native Plugin-metagegevens in `openclaw.plugin.json`.
- Houd pakkettoegangspunten, compatibiliteit, installatie, setup en
  catalogusmetagegevens in ondersteunde `package.json#openclaw`-velden.
- Zie [package.json-velden die discovery beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gepubliceerd artefact

### package-npm-pack-unavailable

Het pakket kan niet worden gepackt naar het artefact dat ClawHub zou inspecteren
of publiceren.

- Voer `npm pack --dry-run` uit vanuit de pakketroot.
- Los ongeldige pakketmetagegevens, defecte lifecycle-scripts of
  bestandsvermeldingen op die het packen laten mislukken.
- Verwijder `private: true` als dit pakket bedoeld is voor openbare publicatie.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-entrypoint-missing

Het pakket kan worden gepackt, maar het gepackte artefact bevat niet de
toegangspuntbestanden die in `package.json#openclaw` zijn gedeclareerd.

- Voer `npm pack --dry-run` uit en inspecteer de bestanden die zouden worden opgenomen.
- Bouw gegenereerde toegangspunten voordat je packt.
- Werk `files`, `.npmignore` of build-uitvoer bij zodat gedeclareerde
  toegangspunten worden opgenomen.
- Zie [Plugin-toegangspunten](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-metadata-missing

Het gepackte artefact mist OpenClaw-metagegevens die in je bronpakket bestaan.

- Voer `npm pack --dry-run` uit en inspecteer de opgenomen metagegevensbestanden.
- Zorg dat `package.json` het `openclaw`-blok bevat in het gepackte artefact.
- Zorg dat `openclaw.plugin.json` wordt opgenomen wanneer het pakket een native
  OpenClaw-Plugin is.
- Werk `files` of `.npmignore` bij zodat pakketmetagegevens niet worden uitgesloten.
- Zie [Plugins bouwen](/nl/plugins/building-plugins).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Manifestmetagegevens

### manifest-name-missing

Het native pluginmanifest bevat geen weergavenaam.

- Voeg een niet-leeg `name`-veld toe aan `openclaw.plugin.json`.
- Houd `name` leesbaar voor mensen en houd `id` als de stabiele machine-id.
- Zie [Pluginmanifest](/nl/plugins/manifest).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### manifest-unknown-fields

Het pluginmanifest bevat velden op het hoogste niveau die OpenClaw niet ondersteunt.

- Vergelijk elk veld op het hoogste niveau met de
  [referentie voor manifestvelden](/nl/plugins/manifest#top-level-field-reference).
- Verwijder aangepaste velden uit `openclaw.plugin.json`.
- Verplaats pakket- of installatiemetagegevens naar ondersteunde `package.json#openclaw`-velden
  in plaats van naar het manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### manifest-unknown-contracts

Het manifest declareert niet-ondersteunde sleutels binnen `contracts`.

- Vergelijk elke sleutel onder `contracts` met de
  [referentie voor contracts](/nl/plugins/manifest#contracts-reference).
- Verwijder niet-ondersteunde contractsleutels.
- Verplaats runtimegedrag naar pluginregistratiecode en houd `contracts`
  beperkt tot statische metagegevens over eigendom van capabilities.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## SDK en compatibiliteitsmigratie

### legacy-root-sdk-import

De plugin importeert uit de verouderde root-SDK-barrel:
`openclaw/plugin-sdk`.

- Vervang root-barrel-imports door gerichte publieke subpad-imports.
- Gebruik `openclaw/plugin-sdk/plugin-entry` voor `definePluginEntry`.
- Gebruik `openclaw/plugin-sdk/channel-core` voor helpers voor kanaalentry's.
- Gebruik [Importconventies](/nl/plugins/building-plugins#import-conventions) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths) om de smalle import te vinden.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### reserved-sdk-import

De plugin importeert een SDK-pad dat is gereserveerd voor gebundelde plugins of interne
compatibiliteit.

- Vervang gereserveerde interne OpenClaw-SDK-imports door gedocumenteerde publieke
  `openclaw/plugin-sdk/*`-subpaden.
- Als het gedrag geen publieke SDK heeft, houd de helper dan binnen je pakket of
  vraag een publieke OpenClaw-API aan.
- Gebruik [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths) en
  [SDK-migratie](/nl/plugins/sdk-migration) om een ondersteunde import te kiezen.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-load-session-store

De plugin gebruikt nog steeds de verouderde whole-session-store-helper
`loadSessionStore`.

- Gebruik `getSessionEntry(...)` of `listSessionEntries(...)` bij het lezen van sessie-
  status.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` bij het schrijven van sessie-
  status.
- Vermijd het laden, wijzigen en opslaan van het volledige sessiestore-object.
- Houd `loadSessionStore(...)` alleen zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-store-write

De plugin gebruikt nog steeds een verouderde whole-session-store-schrijfhelper zoals
`saveSessionStore` of `updateSessionStore`.

- Gebruik `patchSessionEntry(...)` bij het bijwerken van velden in een bestaande sessie-
  entry.
- Gebruik `upsertSessionEntry(...)` bij het vervangen of aanmaken van een sessie-entry.
- Vermijd het laden, wijzigen en opslaan van het volledige sessiestore-object.
- Houd whole-store-schrijfhelpers alleen zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die ze vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-file-helper

De plugin gebruikt nog steeds verouderde helpers voor sessiebestandspaden zoals
`resolveSessionFilePath` of `resolveAndPersistSessionFile`.

- Gebruik `getSessionEntry(...)` om sessiemetagegevens per agent en sessie-
  identiteit te lezen.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` om sessie-
  metagegevens te bewaren.
- Gebruik transcriptidentiteit of targethelpers wanneer de code een
  transcriptbewerking voorbereidt.
- Bewaar geen legacy transcriptbestandspaden en maak je er niet afhankelijk van.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-transcript-file-target

De plugin gebruikt nog steeds de verouderde helper voor transcriptbestandstargets
`resolveSessionTranscriptLegacyFileTarget`.

- Gebruik `resolveSessionTranscriptIdentity(...)` wanneer de code alleen publieke
  sessie-identiteit nodig heeft.
- Gebruik `resolveSessionTranscriptTarget(...)` wanneer de code een gestructureerd
  target voor transcriptbewerkingen nodig heeft.
- Vermijd het direct lezen of construeren van legacy transcriptbestandstargets.
- Houd de legacy helper alleen zolang je gedeclareerde compatibiliteitsbereik nog
  oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-session-transcript-low-level

De plugin gebruikt nog steeds verouderde low-level transcripthelpers zoals
`appendSessionTranscriptMessage` of `emitSessionTranscriptUpdate`.

- Gebruik `appendSessionTranscriptMessageByIdentity(...)` voor transcripttoevoegingen.
- Gebruik `publishSessionTranscriptUpdateByIdentity(...)` voor meldingen over transcriptupdates.
- Geef de voorkeur aan het gestructureerde transcript-runtimeoppervlak, zodat OpenClaw de
  juiste transactiegrenzen en identiteitsafhandeling kan toepassen.
- Houd low-level transcripthelpers alleen zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die ze vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin-SDK-subpaden](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### legacy-before-agent-start

De plugin gebruikt nog steeds de legacy `before_agent_start`-hook.

- Verplaats werk voor model- of provideroverrides naar `before_model_resolve`.
- Verplaats werk voor prompt- of contextmutatie naar `before_prompt_build`.
- Houd `before_agent_start` alleen zolang je gedeclareerde compatibiliteitsbereik nog
  oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Hooks](/nl/plugins/hooks) en
  [Plugincompatibiliteit](/nl/plugins/compatibility).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### provider-auth-env-vars

Het manifest gebruikt nog steeds legacy `providerAuthEnvVars`-providerauth-metagegevens.

- Spiegel provider-env-var-metagegevens naar `setup.providers[].envVars`.
- Houd `providerAuthEnvVars` alleen als compatibiliteitsmetagegevens zolang je ondersteunde
  OpenClaw-bereik dit nog nodig heeft.
- Zie [setup-referentie](/nl/plugins/manifest#setup-reference) en
  [SDK-migratie](/nl/plugins/sdk-migration).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### channel-env-vars

Het manifest gebruikt legacy of oudere kanaal-env-var-metagegevens zonder de huidige
setup- of configmetagegevens die ClawHub verwacht.

- Houd kanaal-env-var-metagegevens declaratief, zodat OpenClaw de setupstatus kan inspecteren
  zonder de kanaalruntime te laden.
- Spiegel env-gestuurde kanaalsetup naar de huidige setup, kanaalconfiguratie of
  pakketkanaalmetagegevens die door je pluginvorm worden gebruikt.
- Houd `channelEnvVars` alleen als compatibiliteitsmetagegevens zolang oudere ondersteunde
  OpenClaw-versies dit nog vereisen.
- Zie [Pluginmanifest](/nl/plugins/manifest) en
  [Kanaalplugins](/nl/plugins/sdk-channel-plugins).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Beveiligingsmanifest

### security-manifest-schema-unavailable

Het pakket levert `openclaw.security.json` met een schemareferentie die ClawHub
niet als beschikbaar herkent.

- Verwijder de schema-URL als deze alleen adviserend is.
- Gebruik pas een gedocumenteerd versiegebonden schema nadat OpenClaw er een publiceert.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### unrecognized-security-manifest

Het pakket levert een niet-ondersteund beveiligingsmanifestbestand.

- Verwijder `openclaw.security.json` totdat OpenClaw een versiegebonden schema voor
  beveiligingsmanifesten en ClawHub-gedrag documenteert.
- Houd beveiligingsgevoelig gedrag gedocumenteerd in je publieke pakketdocumentatie of
  README totdat het manifestcontract bestaat.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gerelateerd

- [ClawHub CLI](/nl/clawhub/cli)
- [ClawHub-publicatie](/nl/clawhub/publishing)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Pluginmanifest](/nl/plugins/manifest)
- [Pluginentrypoints](/nl/plugins/sdk-entrypoints)
- [Plugincompatibiliteit](/nl/plugins/compatibility)
