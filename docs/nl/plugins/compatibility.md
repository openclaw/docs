---
read_when:
    - Je onderhoudt een OpenClaw Plugin
    - Je ziet een Plugin-compatibiliteitswaarschuwing
    - Je plant een migratie van de Plugin SDK of het manifest
summary: Plugin-compatibiliteitscontracten, deprecatiemetadata en migratieverwachtingen
title: Plugin-compatibiliteit
x-i18n:
    generated_at: "2026-04-29T23:02:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw houdt oudere Plugin-contracten aangesloten via benoemde compatibiliteitsadapters voordat ze worden verwijderd. Dit beschermt bestaande gebundelde en externe plugins terwijl de contracten voor SDK, manifest, setup, configuratie en agent-runtime evolueren.

## Compatibiliteitsregister

Plugin-compatibiliteitscontracten worden bijgehouden in het core-register op
`src/plugins/compat/registry.ts`.

Elke record heeft:

- een stabiele compatibiliteitscode
- status: `active`, `deprecated`, `removal-pending` of `removed`
- eigenaar: SDK, configuratie, setup, kanaal, provider, Plugin-uitvoering, agent-runtime
  of core
- introductie- en deprecatiedatums indien van toepassing
- vervangingsrichtlijnen
- docs, diagnostiek en tests die het oude en nieuwe gedrag afdekken

Het register is de bron voor maintainerplanning en toekomstige Plugin-inspectorcontroles. Als Plugin-gericht gedrag verandert, voeg dan de compatibiliteitsrecord toe of werk deze bij in dezelfde wijziging die de adapter toevoegt.

Compatibiliteit voor doctor-reparatie en migratie wordt apart bijgehouden op
`src/commands/doctor/shared/deprecation-compat.ts`. Die records dekken oude configuratievormen, install-ledgerindelingen en reparatieshims die mogelijk beschikbaar moeten blijven nadat het runtime-compatibiliteitspad is verwijderd.

Release-sweeps moeten beide registers controleren. Verwijder een doctor-migratie niet alleen omdat de bijbehorende runtime- of configuratiecompatibiliteitsrecord is verlopen; verifieer eerst dat er geen ondersteund upgradepad is dat de reparatie nog nodig heeft. Valideer ook elke vervangingsannotatie opnieuw tijdens releaseplanning, omdat Plugin-eigenaarschap en configuratievoetafdruk kunnen veranderen wanneer providers en kanalen uit core worden verplaatst.

## Plugin-inspectorpakket

De Plugin-inspector moet buiten de core OpenClaw-repo bestaan als een afzonderlijk pakket/repository, ondersteund door de geversioneerde compatibiliteits- en manifestcontracten.

De CLI op dag een moet zijn:

```sh
openclaw-plugin-inspector ./my-plugin
```

Deze moet uitvoeren:

- manifest-/schemavalidatie
- de contractcompatibiliteitsversie die wordt gecontroleerd
- controles op installatie-/bronmetadata
- importcontroles voor koude paden
- depreciatie- en compatibiliteitswaarschuwingen

Gebruik `--json` voor stabiele machineleesbare uitvoer in CI-annotaties. OpenClaw core moet contracten en fixtures blootleggen die de inspector kan gebruiken, maar moet de inspector-binary niet publiceren vanuit het hoofdpackage `openclaw`.

### Acceptatielane voor maintainers

Gebruik Blacksmith Testbox voor de acceptatielane van installeerbare packages bij het valideren van de externe inspector tegen OpenClaw Plugin-packages. Voer dit uit vanuit een schone OpenClaw-checkout nadat het package is gebouwd:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Houd deze lane opt-in voor maintainers, omdat deze een extern npm-package installeert en Plugin-packages kan inspecteren die buiten de repo zijn gekloond. De lokale repo-guards dekken de SDK-exportmap, metadata van het compatibiliteitsregister, afbouw van verouderde SDK-imports en importgrenzen van gebundelde extensies; Testbox-inspectorbewijs dekt het package zoals externe Plugin-auteurs het gebruiken.

## Deprecatiebeleid

OpenClaw mag een gedocumenteerd Plugin-contract niet verwijderen in dezelfde release die de vervanging ervan introduceert.

De migratiereeks is:

1. Voeg het nieuwe contract toe.
2. Houd het oude gedrag aangesloten via een benoemde compatibiliteitsadapter.
3. Geef diagnostiek of waarschuwingen wanneer Plugin-auteurs kunnen handelen.
4. Documenteer de vervanging en tijdlijn.
5. Test zowel oude als nieuwe paden.
6. Wacht de aangekondigde migratieperiode af.
7. Verwijder alleen met expliciete goedkeuring voor een breaking release.

Verouderde records moeten een startdatum voor waarschuwingen, vervanging, doclink en definitieve verwijderingsdatum bevatten, niet meer dan drie maanden nadat de waarschuwingen starten. Voeg geen verouderd compatibiliteitspad toe met een open verwijderingsperiode, tenzij maintainers expliciet besluiten dat het permanente compatibiliteit is en het in plaats daarvan als `active` markeren.

## Huidige compatibiliteitsgebieden

Huidige compatibiliteitsrecords omvatten:

- oude brede SDK-imports zoals `openclaw/plugin-sdk/compat`
- oude Plugin-vormen met alleen hooks en `before_agent_start`
- oude Plugin-entrypoints `activate(api)` terwijl plugins migreren naar
  `register(api)`
- oude SDK-aliassen zoals `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  statusbouwers, `openclaw/plugin-sdk/test-utils` (vervangen door gerichte
  `openclaw/plugin-sdk/*` testsubpaden), en de typealiassen `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist- en activeringsgedrag voor gebundelde plugins
- oude env-var-manifestmetadata voor providers/kanalen
- oude provider-Plugin-hooks en typealiassen terwijl providers verhuizen naar
  expliciete catalogus-, auth-, thinking-, replay- en transporthooks
- oude runtime-aliassen zoals `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, en verouderde
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- oude gesplitste registratie voor memory-plugins terwijl memory-plugins verhuizen naar
  `registerMemoryCapability`
- oude kanaal-SDK-helpers voor native berichtschema's, mention-gating,
  opmaak van inbound envelopes en nesting van goedkeuringscapaciteiten
- oude kanaalroutesleutel- en comparable-target-helperaliassen terwijl plugins
  verhuizen naar `openclaw/plugin-sdk/channel-route`
- activatiehints die worden vervangen door eigenaarschap van manifestbijdragen
- verouderd impliciet laden van startup-sidecars voor plugins die
  `activation.onStartup` niet hebben gedeclareerd; maintainers kunnen het toekomstige strengere gedrag testen met
  `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`
- runtimefallback voor `setup-api` terwijl setupdescriptors verhuizen naar koude
  metadata `setup.requiresRuntime: false`
- providerhooks `discovery` terwijl providercatalogushooks verhuizen naar
  `catalog.run(...)`
- kanaalmetadata `showConfigured` / `showInSetup` terwijl kanaalpackages verhuizen
  naar `openclaw.channel.exposure`
- oude configuratiesleutels voor runtimebeleid terwijl doctor operators migreert naar
  `agentRuntime`
- fallback voor gegenereerde gebundelde kanaalconfiguratiemetadata terwijl registry-first
  metadata `channelConfigs` landt
- persistente env-flags voor uitschakeling van het Plugin-register en installatiemigratie terwijl
  reparatiestromen operators migreren naar `openclaw plugins registry --refresh` en
  `openclaw doctor --fix`
- oude configuratiepaden voor Plugin-eigen web search, web fetch en x_search terwijl
  doctor ze migreert naar `plugins.entries.<plugin>.config`
- oude geauthorde configuratie `plugins.installs` en load-path-aliassen voor gebundelde plugins terwijl installatiemetadata verhuist naar de state-managed Plugin-ledger

Nieuwe Plugin-code moet de vervanging verkiezen die in het register en in de specifieke migratiegids staat. Bestaande plugins kunnen een compatibiliteitspad blijven gebruiken totdat de docs, diagnostiek en release notes een verwijderingsperiode aankondigen.

## Release notes

Release notes moeten aankomende Plugin-deprecaties bevatten met streefdatums en links naar migratiedocs. Die waarschuwing moet plaatsvinden voordat een compatibiliteitspad naar `removal-pending` of `removed` gaat.
