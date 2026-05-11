---
read_when:
    - Je onderhoudt een OpenClaw Plugin
    - Je ziet een waarschuwing over Plugin-compatibiliteit
    - Je plant een Plugin-SDK- of manifestmigratie
summary: Plugin-compatibiliteitscontracten, deprecatiemetadata en migratieverwachtingen
title: Plugin-compatibiliteit
x-i18n:
    generated_at: "2026-05-11T20:39:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw houdt oudere Plugin-contracten bedraad via benoemde compatibiliteitsadapters voordat ze worden verwijderd. Dit beschermt bestaande gebundelde en externe plugins terwijl de SDK-, manifest-, setup-, configuratie- en agent-runtimecontracten evolueren.

## Compatibiliteitsregister

Plugin-compatibiliteitscontracten worden bijgehouden in het kernregister op
`src/plugins/compat/registry.ts`.

Elke record heeft:

- een stabiele compatibiliteitscode
- status: `active`, `deprecated`, `removal-pending` of `removed`
- eigenaar: SDK, configuratie, setup, kanaal, provider, Plugin-uitvoering, agent-runtime
  of core
- introductie- en afschrijvingsdatums waar van toepassing
- vervangingsrichtlijnen
- docs, diagnoses en tests die het oude en nieuwe gedrag dekken

Het register is de bron voor maintainerplanning en toekomstige plugin-inspectorcontroles. Als Plugin-gericht gedrag verandert, voeg dan de compatibiliteitsrecord toe of werk deze bij in dezelfde wijziging die de adapter toevoegt.

Compatibiliteit voor doctor-herstel en migratie wordt apart bijgehouden op
`src/commands/doctor/shared/deprecation-compat.ts`. Die records dekken oude configuratievormen, install-ledgerindelingen en herstel-shims die mogelijk beschikbaar moeten blijven nadat het runtime-compatibiliteitspad is verwijderd.

Release-sweeps moeten beide registers controleren. Verwijder geen doctor-migratie alleen omdat de bijbehorende runtime- of configuratiecompatibiliteitsrecord is verlopen; verifieer eerst dat er geen ondersteund upgradepad is dat de reparatie nog nodig heeft. Valideer ook elke vervangingsannotatie opnieuw tijdens releaseplanning, omdat Plugin-eigenaarschap en configuratievoetafdruk kunnen veranderen wanneer providers en kanalen uit core worden verplaatst.

## Plugin-inspectorpakket

De Plugin-inspector moet buiten de core OpenClaw-repo leven als een apart pakket/repository, ondersteund door de geversioneerde compatibiliteits- en manifestcontracten.

De CLI op dag één moet zijn:

```sh
openclaw-plugin-inspector ./my-plugin
```

Deze moet het volgende uitvoeren:

- manifest-/schemavalidatie
- de contractcompatibiliteitsversie die wordt gecontroleerd
- controles van installatie-/bronmetadata
- cold-path importcontroles
- waarschuwingen voor afschrijving en compatibiliteit

Gebruik `--json` voor stabiele, machineleesbare uitvoer in CI-annotaties. OpenClaw core moet contracten en fixtures blootstellen die de inspector kan gebruiken, maar mag de inspector-binary niet publiceren vanuit het hoofdpackage `openclaw`.

### Acceptatielane voor maintainers

Gebruik Crabbox-ondersteunde Blacksmith Testbox voor de acceptatielane voor installeerbare pakketten bij het valideren van de externe inspector tegen OpenClaw Plugin-pakketten. Voer dit uit vanuit een schone OpenClaw-checkout nadat het pakket is gebouwd:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Houd deze lane opt-in voor maintainers, omdat deze een extern npm-pakket installeert en Plugin-pakketten kan inspecteren die buiten de repo zijn gekloond. De lokale repo-guards dekken de SDK-exportmap, compatibiliteitsregistermetadata, afbouw van verouderde SDK-imports en importgrenzen van gebundelde extensies; Testbox-inspectorbewijs dekt het pakket zoals externe Plugin-auteurs het gebruiken.

## Afschrijvingsbeleid

OpenClaw mag een gedocumenteerd Plugin-contract niet verwijderen in dezelfde release waarin de vervanging wordt geïntroduceerd.

De migratiereeks is:

1. Voeg het nieuwe contract toe.
2. Houd het oude gedrag bedraad via een benoemde compatibiliteitsadapter.
3. Geef diagnoses of waarschuwingen wanneer Plugin-auteurs kunnen handelen.
4. Documenteer de vervanging en tijdlijn.
5. Test zowel oude als nieuwe paden.
6. Wacht gedurende het aangekondigde migratievenster.
7. Verwijder alleen met expliciete goedkeuring voor een breaking release.

Verouderde records moeten een startdatum voor waarschuwingen, vervanging, docs-link en definitieve verwijderingsdatum bevatten, niet meer dan drie maanden nadat de waarschuwing start. Voeg geen verouderd compatibiliteitspad toe met een open verwijderingsvenster, tenzij maintainers expliciet besluiten dat het permanente compatibiliteit is en het in plaats daarvan als `active` markeren.

## Huidige compatibiliteitsgebieden

Huidige compatibiliteitsrecords omvatten:

- legacy brede SDK-imports zoals `openclaw/plugin-sdk/compat`
- legacy hook-only Plugin-vormen en `before_agent_start`
- legacy `activate(api)` Plugin-entrypoints terwijl plugins migreren naar
  `register(api)`
- legacy SDK-aliassen zoals `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  status builders, `openclaw/plugin-sdk/test-utils` (vervangen door gerichte
  `openclaw/plugin-sdk/*` test-subpaden), en de type-aliassen `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist- en enablementgedrag voor gebundelde plugins
- legacy provider-/kanaal-env-var-manifestmetadata
- legacy provider-Plugin-hooks en type-aliassen terwijl providers overgaan naar
  expliciete catalogus-, auth-, thinking-, replay- en transporthooks
- legacy runtime-aliassen zoals `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, en verouderde
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- legacy gesplitste registratie voor memory-plugins terwijl memory-plugins migreren naar
  `registerMemoryCapability`
- legacy kanaal-SDK-helpers voor native berichtschema’s, mention gating,
  inbound envelope-formattering en nesting van approval capabilities
- legacy kanaalroute-key en comparable-target helper-aliassen terwijl plugins
  migreren naar `openclaw/plugin-sdk/channel-route`
- activation hints die worden vervangen door eigenaarschap van manifest contributions
- `setup-api` runtime-fallback terwijl setup-descriptors worden verplaatst naar koude
  `setup.requiresRuntime: false` metadata
- provider-`discovery` hooks terwijl providercatalogushooks migreren naar
  `catalog.run(...)`
- kanaalmetadata `showConfigured` / `showInSetup` terwijl kanaalpakketten migreren
  naar `openclaw.channel.exposure`
- legacy runtime-policy configuratiesleutels terwijl doctor operators migreert naar
  `agentRuntime`
- gegenereerde metadatafallback voor gebundelde kanaalconfiguratie terwijl registry-first
  `channelConfigs` metadata landt
- persistente env-flags voor uitschakeling van het Plugin-register en installatiemigratie terwijl
  reparatiestromen operators migreren naar `openclaw plugins registry --refresh` en
  `openclaw doctor --fix`
- legacy Plugin-beheerde configuratiepaden voor web search, web fetch en x_search terwijl
  doctor ze migreert naar `plugins.entries.<plugin>.config`
- legacy `plugins.installs` authored config en aliasen voor laadpaden van gebundelde plugins
  terwijl installatiemetadata naar de door state beheerde Plugin-ledger wordt verplaatst

Nieuwe Plugin-code moet de vervanging gebruiken die in het register en in de specifieke migratiegids staat. Bestaande plugins kunnen een compatibiliteitspad blijven gebruiken totdat de docs, diagnoses en release notes een verwijderingsvenster aankondigen.

## Release notes

Release notes moeten aankomende Plugin-afschrijvingen bevatten met doeldatums en links naar migratiedocs. Die waarschuwing moet plaatsvinden voordat een compatibiliteitspad naar `removal-pending` of `removed` gaat.
