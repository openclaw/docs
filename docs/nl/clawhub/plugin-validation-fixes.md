---
read_when:
    - Je hebt `clawhub package validate` uitgevoerd en moet Plugin-bevindingen oplossen
    - ClawHub heeft een Plugin-pakketpublicatie geweigerd of er een waarschuwing voor gegeven
    - Je werkt de metadata van het pluginpakket bij vóór de release
summary: Los bevindingen uit de validatie van ClawHub-Plugin-pakketten op vóór publicatie
title: Plugin-validatiefixes
x-i18n:
    generated_at: "2026-06-27T17:16:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin-validatiefixes

ClawHub valideert Plugin-pakketten vóór publicatie en kan ook bevindingen uit
geautomatiseerde pakketscans tonen. Deze pagina behandelt auteursgerichte
bevindingen: bevindingen die de Plugin-auteur kan oplossen in pakketmetadata,
manifest, SDK-imports of gepubliceerd artefact.

Dit behandelt geen interne dekkingsbevindingen van de Plugin Inspector. Als een
volledig rapport scanneronderhoudscodes bevat zonder herstelrichtlijnen voor
auteurs, zijn die bedoeld voor OpenClaw-maintainers in plaats van
Plugin-auteurs.

Voer na het toepassen van een fix opnieuw uit:

```bash
clawhub package validate <path-to-plugin>
```

## Auteursgerichte bevindingen

| Code                                    | Begin hier                                                                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Voeg pakketmetadata toe](/nl/clawhub/plugin-validation-fixes#package-json-missing)                                             |
| `package-openclaw-metadata-missing`     | [Voeg het package openclaw-blok toe](/nl/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                     |
| `package-openclaw-entry-missing`        | [Declareer OpenClaw-pakketentrypoints](/nl/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                      |
| `package-entrypoint-missing`            | [Publiceer het gedeclareerde entrypoint](/nl/clawhub/plugin-validation-fixes#package-entrypoint-missing)                        |
| `package-install-metadata-incomplete`   | [Vul installatiemetadata aan](/nl/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                          |
| `package-plugin-api-compat-missing`     | [Declareer compatibiliteit met de Plugin-API](/nl/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)            |
| `package-min-host-version-drift`        | [Lijn de minimale hostversie uit](/nl/clawhub/plugin-validation-fixes#package-min-host-version-drift)                           |
| `package-manifest-version-drift`        | [Lijn pakket- en manifestversies uit](/nl/clawhub/plugin-validation-fixes#package-manifest-version-drift)                       |
| `package-openclaw-unsupported-metadata` | [Verwijder niet-ondersteunde OpenClaw-pakketmetadata](/nl/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Maak het npm-artefact packbaar](/nl/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                              |
| `package-npm-pack-entrypoint-missing`   | [Neem entrypoints op in npm pack-uitvoer](/nl/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)              |
| `package-npm-pack-metadata-missing`     | [Neem metadata op in npm pack-uitvoer](/nl/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                   |
| `manifest-name-missing`                 | [Voeg een manifestweergavenaam toe](/nl/clawhub/plugin-validation-fixes#manifest-name-missing)                                  |
| `manifest-unknown-fields`               | [Verwijder niet-ondersteunde manifestvelden](/nl/clawhub/plugin-validation-fixes#manifest-unknown-fields)                       |
| `manifest-unknown-contracts`            | [Verwijder niet-ondersteunde contractsleutels](/nl/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                  |
| `legacy-root-sdk-import`                | [Vervang root-SDK-imports](/nl/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                          |
| `reserved-sdk-import`                   | [Verwijder gereserveerde SDK-imports](/nl/clawhub/plugin-validation-fixes#reserved-sdk-import)                                  |
| `sdk-load-session-store`                | [Vervang toegang tot de volledige sessie-store](/nl/clawhub/plugin-validation-fixes#sdk-load-session-store)                     |
| `legacy-before-agent-start`             | [Vervang before_agent_start](/nl/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                     |
| `provider-auth-env-vars`                | [Verplaats provider-env-vars naar setupmetadata](/nl/clawhub/plugin-validation-fixes#provider-auth-env-vars)                    |
| `channel-env-vars`                      | [Spiegel kanaal-env-vars in huidige metadata](/nl/clawhub/plugin-validation-fixes#channel-env-vars)                             |
| `security-manifest-schema-unavailable`  | [Verwijder niet-beschikbare security-manifest-schemaverwijzingen](/nl/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Verwijder niet-ondersteunde security-manifest-bestanden](/nl/clawhub/plugin-validation-fixes#unrecognized-security-manifest)   |

## Pakketmetadata

### package-json-missing

De pakketroot bevat geen `package.json`, waardoor ClawHub het npm-pakket, de
versie, entrypoints of OpenClaw-metadata niet kan identificeren.

- Voeg `package.json` toe met `name`, `version` en `type`.
- Voeg een `openclaw`-blok toe wanneer het pakket een OpenClaw Plugin levert.
- Gebruik [Plugins bouwen](/nl/plugins/building-plugins) voor een minimaal
  pakketvoorbeeld en [Plugin-manifest](/nl/plugins/manifest#manifest-versus-packagejson)
  voor de splitsing tussen pakket en manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-metadata-missing

Het pakket heeft `package.json`, maar declareert geen OpenClaw-pakketmetadata.

- Voeg `package.json#openclaw` toe.
- Neem entrypointmetadata op, zoals `openclaw.extensions` of
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
- Bouw het pakket als het entrypoint in `dist` wordt gegenereerd.
- Werk de metadata bij als het entrypoint is verplaatst.
- Zie [Plugin-entrypoints](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-install-metadata-incomplete

ClawHub kan niet bepalen hoe het pakket moet worden geïnstalleerd of bijgewerkt.

- Vul `openclaw.install` in met de ondersteunde installatiebron, zoals
  `clawhubSpec`, `npmSpec` of `localPath`.
- Stel `openclaw.install.defaultChoice` in wanneer meer dan één installatiebron
  beschikbaar is.
- Gebruik `openclaw.install.minHostVersion` voor de minimale OpenClaw-hostversie.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-plugin-api-compat-missing

Het pakket declareert niet welk OpenClaw Plugin-API-bereik het ondersteunt.

- Voeg `openclaw.compat.pluginApi` toe aan `package.json`.
- Gebruik de OpenClaw Plugin-API-versie of semver-ondergrens waartegen je hebt
  gebouwd en getest.
- Houd dit gescheiden van de pakketversie. De pakketversie beschrijft de
  Plugin-release; `openclaw.compat.pluginApi` beschrijft het host-API-contract.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-min-host-version-drift

De minimale hostversie van het pakket komt niet overeen met de OpenClaw-versiemetadata
waartegen het pakket is gebouwd.

- Controleer `openclaw.install.minHostVersion`.
- Controleer eventuele OpenClaw-buildmetadata in het pakket, zoals de
  OpenClaw-versie die tijdens de release is gebruikt.
- Lijn de minimale hostversie uit met het hostversiebereik dat het pakket
  daadwerkelijk ondersteunt.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-manifest-version-drift

De pakketversie en Plugin-manifestversie komen niet overeen.

- Geef de voorkeur aan `package.json#version` als pakketreleaseversie.
- Als `openclaw.plugin.json` ook `version` heeft, werk die dan bij zodat deze
  overeenkomt, of verwijder verouderde manifestversiemetadata wanneer
  pakketmetadata gezaghebbend is.
- Publiceer een nieuwe pakketversie na het wijzigen van gepubliceerde metadata.
- Zie [Plugin-manifest](/nl/plugins/manifest).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-openclaw-unsupported-metadata

Het `package.json#openclaw`-blok bevat velden die geen ondersteunde
OpenClaw-pakketmetadata zijn.

- Verwijder niet-ondersteunde velden zoals `openclaw.bundle`.
- Houd native Plugin-metadata in `openclaw.plugin.json`.
- Houd pakketentrypoints, compatibiliteit, installatie, setup en catalogusmetadata
  in ondersteunde `package.json#openclaw`-velden.
- Zie [package.json-velden die ontdekking beïnvloeden](/nl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gepubliceerd artefact

### package-npm-pack-unavailable

Het pakket kan niet worden ingepakt in het artefact dat ClawHub zou inspecteren
of publiceren.

- Voer `npm pack --dry-run` uit vanuit de pakketroot.
- Herstel ongeldige pakketmetadata, defecte lifecycle-scripts of files-vermeldingen
  waardoor inpakken mislukt.
- Verwijder `private: true` als dit pakket bedoeld is voor publieke publicatie.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-entrypoint-missing

Het pakket kan worden ingepakt, maar het ingepakte artefact bevat niet de
entrypointbestanden die in `package.json#openclaw` zijn gedeclareerd.

- Voer `npm pack --dry-run` uit en inspecteer de bestanden die zouden worden
  opgenomen.
- Bouw gegenereerde entrypoints vóór het inpakken.
- Werk `files`, `.npmignore` of build-uitvoer bij zodat gedeclareerde
  entrypoints worden opgenomen.
- Zie [Plugin-entrypoints](/nl/plugins/sdk-entrypoints).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### package-npm-pack-metadata-missing

Het ingepakte artefact mist OpenClaw-metadata die in je bronpakket bestaat.

- Voer `npm pack --dry-run` uit en inspecteer de opgenomen metadatabestanden.
- Zorg dat `package.json` het `openclaw`-blok bevat in het ingepakte artefact.
- Zorg dat `openclaw.plugin.json` wordt opgenomen wanneer het pakket een native
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

Het Plugin-manifest heeft velden op het hoogste niveau die OpenClaw niet ondersteunt.

- Vergelijk elk veld op het hoogste niveau met de
  [referentie voor manifestvelden](/nl/plugins/manifest#top-level-field-reference).
- Verwijder aangepaste velden uit `openclaw.plugin.json`.
- Verplaats package- of installatiemetadata naar ondersteunde `package.json#openclaw`-velden
  in plaats van naar het manifest.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### manifest-unknown-contracts

Het manifest declareert niet-ondersteunde sleutels binnen `contracts`.

- Vergelijk elke sleutel onder `contracts` met de
  [contracts-referentie](/nl/plugins/manifest#contracts-reference).
- Verwijder niet-ondersteunde contracts-sleutels.
- Verplaats runtimegedrag naar Plugin-registratiecode en houd `contracts`
  beperkt tot statische metadata over capability-eigenaarschap.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## SDK- en compatibiliteitsmigratie

### legacy-root-sdk-import

De Plugin importeert vanuit de verouderde root-SDK-barrel:
`openclaw/plugin-sdk`.

- Vervang root-barrel-imports door gerichte openbare subpath-imports.
- Gebruik `openclaw/plugin-sdk/plugin-entry` voor `definePluginEntry`.
- Gebruik `openclaw/plugin-sdk/channel-core` voor helpers voor channel-entry’s.
- Gebruik [Importconventies](/nl/plugins/building-plugins#import-conventions) en
  [Plugin SDK-subpaths](/nl/plugins/sdk-subpaths) om de smalle import te vinden.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### reserved-sdk-import

De Plugin importeert een SDK-pad dat is gereserveerd voor gebundelde plugins of interne
compatibiliteit.

- Vervang gereserveerde interne OpenClaw-SDK-imports door gedocumenteerde openbare
  `openclaw/plugin-sdk/*`-subpaths.
- Als het gedrag geen openbare SDK heeft, houd de helper dan binnen je package of
  vraag een openbare OpenClaw-API aan.
- Gebruik [Plugin SDK-subpaths](/nl/plugins/sdk-subpaths) en
  [SDK-migratie](/nl/plugins/sdk-migration) om een ondersteunde import te kiezen.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### sdk-load-session-store

De Plugin gebruikt nog steeds de verouderde helper voor de volledige sessiestore
`loadSessionStore`.

- Gebruik `getSessionEntry(...)` of `listSessionEntries(...)` bij het lezen van sessie-
  status.
- Gebruik `patchSessionEntry(...)` of `upsertSessionEntry(...)` bij het schrijven van sessie-
  status.
- Vermijd het laden, muteren en opslaan van het volledige sessiestore-object.
- Behoud `loadSessionStore(...)` alleen zolang je gedeclareerde compatibiliteitsbereik
  nog oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Runtime-API](/nl/plugins/sdk-runtime#agent-session-state) en
  [Plugin SDK-subpaths](/nl/plugins/sdk-subpaths).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### legacy-before-agent-start

De Plugin gebruikt nog steeds de legacy-hook `before_agent_start`.

- Verplaats werk voor model- of provideroverrides naar `before_model_resolve`.
- Verplaats werk voor prompt- of contextmutatie naar `before_prompt_build`.
- Behoud `before_agent_start` alleen zolang je gedeclareerde compatibiliteitsbereik nog
  oudere OpenClaw-versies ondersteunt die dit vereisen.
- Zie [Hooks](/nl/plugins/hooks) en
  [Plugin-compatibiliteit](/nl/plugins/compatibility).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### provider-auth-env-vars

Het manifest gebruikt nog steeds legacy-provider-authmetadata `providerAuthEnvVars`.

- Spiegel provider-env-var-metadata naar `setup.providers[].envVars`.
- Behoud `providerAuthEnvVars` alleen als compatibiliteitsmetadata zolang je ondersteunde
  OpenClaw-bereik dit nog nodig heeft.
- Zie [setup-referentie](/nl/plugins/manifest#setup-reference) en
  [SDK-migratie](/nl/plugins/sdk-migration).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### channel-env-vars

Het manifest gebruikt legacy- of oudere channel-env-var-metadata zonder de huidige
setup- of configmetadata die ClawHub verwacht.

- Houd channel-env-var-metadata declaratief zodat OpenClaw de setupstatus kan inspecteren
  zonder channel-runtime te laden.
- Spiegel env-gedreven channel-setup naar de huidige setup, channelconfiguratie of
  package-channelmetadata die door je Plugin-vorm wordt gebruikt.
- Behoud `channelEnvVars` alleen als compatibiliteitsmetadata zolang oudere ondersteunde
  OpenClaw-versies dit nog vereisen.
- Zie [Plugin-manifest](/nl/plugins/manifest) en
  [Channel-plugins](/nl/plugins/sdk-channel-plugins).
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Beveiligingsmanifest

### security-manifest-schema-unavailable

De package levert `openclaw.security.json` met een schemareferentie die ClawHub
niet als beschikbaar herkent.

- Verwijder de schema-URL als die alleen adviserend is.
- Gebruik alleen een gedocumenteerd versiegebonden schema nadat OpenClaw er een publiceert.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

### unrecognized-security-manifest

De package levert een niet-ondersteund beveiligingsmanifestbestand.

- Verwijder `openclaw.security.json` totdat OpenClaw een versiegebonden beveiligings-
  manifestschema en ClawHub-gedrag documenteert.
- Houd beveiligingsgevoelig gedrag gedocumenteerd in je openbare package-documentatie of
  README totdat het manifestcontract bestaat.
- Voer `clawhub package validate <path-to-plugin>` opnieuw uit.

## Gerelateerd

- [ClawHub CLI](/nl/clawhub/cli)
- [ClawHub-publicatie](/nl/clawhub/publishing)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin-manifest](/nl/plugins/manifest)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Plugin-compatibiliteit](/nl/plugins/compatibility)
