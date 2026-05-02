---
read_when:
    - Je onderhoudt een OpenClaw-plugin
    - Je ziet een Plugin-compatibiliteitswaarschuwing
    - Je plant een Plugin-SDK- of manifestmigratie
summary: Plugin-compatibiliteitscontracten, verouderingsmetadata en migratieverwachtingen
title: Plugin-compatibiliteit
x-i18n:
    generated_at: "2026-05-02T11:21:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw houdt oudere plugincontracten verbonden via benoemde compatibiliteitsadapters voordat ze worden verwijderd. Dit beschermt bestaande gebundelde en externe plugins terwijl de SDK-, manifest-, setup-, config- en agentruntimecontracten evolueren.

## Compatibiliteitsregister

Plugincompatibiliteitscontracten worden bijgehouden in het kernregister op
`src/plugins/compat/registry.ts`.

Elk record heeft:

- een stabiele compatibiliteitscode
- status: `active`, `deprecated`, `removal-pending` of `removed`
- eigenaar: SDK, config, setup, kanaal, provider, pluginuitvoering, agentruntime,
  of core
- introductie- en afschaffingsdatums waar van toepassing
- vervangingsrichtlijnen
- docs, diagnostiek en tests die het oude en nieuwe gedrag dekken

Het register is de bron voor maintainerplanning en toekomstige controles van de plugin inspector. Als plugin-facing gedrag verandert, voeg dan het compatibiliteitsrecord toe of werk het bij in dezelfde wijziging die de adapter toevoegt.

Compatibiliteit voor doctor-reparatie en migratie wordt apart bijgehouden op
`src/commands/doctor/shared/deprecation-compat.ts`. Die records dekken oude configvormen, install-ledger-indelingen en reparatieshims die mogelijk beschikbaar moeten blijven nadat het runtimecompatibiliteitspad is verwijderd.

Releasesweeps moeten beide registers controleren. Verwijder een doctormigratie niet alleen omdat het bijbehorende runtime- of configcompatibiliteitsrecord is verlopen; verifieer eerst dat er geen ondersteund upgradepad is dat de reparatie nog nodig heeft. Valideer ook elke vervangingsannotatie opnieuw tijdens releaseplanning, omdat plugineigendom en configfootprint kunnen veranderen wanneer providers en kanalen uit core worden verplaatst.

## Plugin inspector-pakket

De plugin inspector hoort buiten de core OpenClaw-repo te staan als een apart pakket/repository, ondersteund door de versiebeheercompatibiliteits- en manifestcontracten.

De CLI op dag één moet zijn:

```sh
openclaw-plugin-inspector ./my-plugin
```

Deze moet uitvoeren:

- manifest-/schemavalidatie
- de contractcompatibiliteitsversie die wordt gecontroleerd
- controles op install-/bronmetadata
- importcontroles voor koude paden
- afschaffings- en compatibiliteitswaarschuwingen

Gebruik `--json` voor stabiele machineleesbare output in CI-annotaties. OpenClaw core moet contracten en fixtures beschikbaar maken die de inspector kan gebruiken, maar mag de inspector-binary niet publiceren vanuit het hoofdpackage `openclaw`.

### Acceptatielane voor maintainers

Gebruik Blacksmith Testbox voor de acceptatielane van het installeerbare pakket wanneer je de externe inspector valideert tegen OpenClaw-pluginpakketten. Voer dit uit vanuit een schone OpenClaw-checkout nadat het pakket is gebouwd:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Houd deze lane opt-in voor maintainers, omdat deze een extern npm-pakket installeert en pluginpakketten kan inspecteren die buiten de repo zijn gekloond. De lokale repoguards dekken de SDK-exportmap, metadata van het compatibiliteitsregister, afbouw van verouderde SDK-imports en importgrenzen van gebundelde extensies; Testbox-inspectorbewijs dekt het pakket zoals externe pluginauteurs het gebruiken.

## Afschaffingsbeleid

OpenClaw mag een gedocumenteerd plugincontract niet verwijderen in dezelfde release die de vervanging introduceert.

De migratievolgorde is:

1. Voeg het nieuwe contract toe.
2. Houd het oude gedrag verbonden via een benoemde compatibiliteitsadapter.
3. Geef diagnostiek of waarschuwingen wanneer pluginauteurs actie kunnen ondernemen.
4. Documenteer de vervanging en tijdlijn.
5. Test zowel oude als nieuwe paden.
6. Wacht gedurende het aangekondigde migratievenster.
7. Verwijder alleen met expliciete goedkeuring voor een breaking release.

Verouderde records moeten een begindatum voor waarschuwingen, vervanging, docslink en definitieve verwijderingsdatum bevatten, niet meer dan drie maanden nadat de waarschuwingen starten. Voeg geen verouderd compatibiliteitspad toe met een open verwijderingsvenster, tenzij maintainers expliciet besluiten dat het permanente compatibiliteit is en het in plaats daarvan als `active` markeren.

## Huidige compatibiliteitsgebieden

Huidige compatibiliteitsrecords omvatten:

- oude brede SDK-imports zoals `openclaw/plugin-sdk/compat`
- oude hook-only pluginvormen en `before_agent_start`
- oude `activate(api)` pluginentrypoints terwijl plugins migreren naar
  `register(api)`
- oude SDK-aliassen zoals `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  statusbuilders, `openclaw/plugin-sdk/test-utils` (vervangen door gerichte
  `openclaw/plugin-sdk/*` testsubpaden), en de typealiassen `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist- en inschakelgedrag voor gebundelde plugins
- oude provider-/kanaal-env-var-manifestmetadata
- oude providerpluginhooks en typealiassen terwijl providers overgaan naar
  expliciete catalogus-, auth-, thinking-, replay- en transporthooks
- oude runtimealiassen zoals `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, en verouderde
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- oude splitregistratie voor memory-plugins terwijl memory-plugins overgaan naar
  `registerMemoryCapability`
- oude kanaal-SDK-helpers voor native berichtschema’s, mention gating,
  inbound envelope-opmaak en nesten van goedkeuringscapabilities
- oude kanaalroutekey- en comparable-target-helperaliassen terwijl plugins
  overgaan naar `openclaw/plugin-sdk/channel-route`
- activeringshints die worden vervangen door eigendom van manifestbijdragen
- `setup-api` runtimefallback terwijl setupdescriptors overgaan naar koude
  `setup.requiresRuntime: false` metadata
- provider-`discovery`-hooks terwijl providercatalogushooks overgaan naar
  `catalog.run(...)`
- kanaalmetadata `showConfigured` / `showInSetup` terwijl kanaalpakketten overgaan
  naar `openclaw.channel.exposure`
- oude runtime-policy-configkeys terwijl doctor operators migreert naar
  `agentRuntime`
- fallback voor gegenereerde configmetadata van gebundelde kanalen terwijl registry-first
  `channelConfigs` metadata landt
- gepersisteerde env-flags voor uitschakeling van het pluginregister en installatiemigratie terwijl
  reparatiestromen operators migreren naar `openclaw plugins registry --refresh` en
  `openclaw doctor --fix`
- oude plugin-owned web search-, web fetch- en x_search-configpaden terwijl
  doctor ze migreert naar `plugins.entries.<plugin>.config`
- oude door `plugins.installs` geschreven config en load-path-aliassen voor gebundelde plugins
  terwijl installatiemetadata wordt verplaatst naar het state-managed pluginledger

Nieuwe plugincode moet de voorkeur geven aan de vervanging die in het register en in de specifieke migratiegids staat. Bestaande plugins kunnen een compatibiliteitspad blijven gebruiken totdat de docs, diagnostiek en release notes een verwijderingsvenster aankondigen.

## Release notes

Release notes moeten aankomende pluginafschaffingen bevatten met streefdatums en links naar migratiedocs. Die waarschuwing moet plaatsvinden voordat een compatibiliteitspad naar `removal-pending` of `removed` gaat.
