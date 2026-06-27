---
read_when:
    - Je onderhoudt een OpenClaw-Plugin
    - Je ziet een waarschuwing over Plugin-compatibiliteit
    - Je plant een Plugin SDK- of manifestmigratie
summary: Plugin-compatibiliteitscontracten, deprecatiemetadata en migratieverwachtingen
title: Plugin-compatibiliteit
x-i18n:
    generated_at: "2026-06-27T17:53:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw houdt oudere Plugin-contracten aangesloten via benoemde compatibiliteitsadapters voordat ze worden verwijderd. Dit beschermt bestaande gebundelde en externe plugins terwijl de contracten voor SDK, manifest, setup, configuratie en agent-runtime zich ontwikkelen.

## Compatibiliteitsregister

Plugin-compatibiliteitscontracten worden bijgehouden in het kernregister op
`src/plugins/compat/registry.ts`.

Elke record heeft:

- een stabiele compatibiliteitscode
- status: `active`, `deprecated`, `removal-pending` of `removed`
- eigenaar: SDK, configuratie, setup, kanaal, provider, Plugin-uitvoering, agent-runtime,
  of kern
- introductie- en afschrijvingsdatums waar van toepassing
- vervangingsrichtlijnen
- docs, diagnostiek en tests die het oude en nieuwe gedrag afdekken

Het register is de bron voor beheerderplanning en toekomstige Plugin-inspectorcontroles. Als Plugin-gericht gedrag verandert, voeg dan de compatibiliteitsrecord toe of werk deze bij in dezelfde wijziging die de adapter toevoegt.

Doctor-reparatie- en migratiecompatibiliteit wordt afzonderlijk bijgehouden op
`src/commands/doctor/shared/deprecation-compat.ts`. Die records dekken oude configuratievormen, install-ledgerindelingen en reparatieshims die mogelijk beschikbaar moeten blijven nadat het runtime-compatibiliteitspad is verwijderd.

Release-sweeps moeten beide registers controleren. Verwijder een doctor-migratie niet alleen omdat de overeenkomende runtime- of configuratiecompatibiliteitsrecord is verlopen; controleer eerst of er geen ondersteund upgradepad is dat de reparatie nog nodig heeft. Valideer ook elke vervangingsannotatie opnieuw tijdens releaseplanning, omdat Plugin-eigenaarschap en configuratievoetafdruk kunnen veranderen wanneer providers en kanalen uit de kern worden verplaatst.

## Plugin-inspectorpakket

De Plugin-inspector moet buiten de kernrepo van OpenClaw leven als een afzonderlijk pakket/repository, ondersteund door de geversioneerde compatibiliteits- en manifestcontracten.

De CLI op dag een moet zijn:

```sh
openclaw-plugin-inspector ./my-plugin
```

Deze moet het volgende uitvoeren:

- manifest-/schemavalidatie
- de contractcompatibiliteitsversie die wordt gecontroleerd
- install-/bronmetadatacontroles
- importcontroles voor koude paden
- afschrijvings- en compatibiliteitswaarschuwingen

Gebruik `--json` voor stabiele machineleesbare uitvoer in CI-annotaties. De OpenClaw-kern moet contracten en fixtures beschikbaar stellen die de inspector kan gebruiken, maar mag de inspector-binary niet publiceren vanuit het hoofdpackage `openclaw`.

### Acceptatietraject voor beheerders

Gebruik Crabbox-ondersteunde Blacksmith Testbox voor het acceptatietraject voor installeerbare packages bij het valideren van de externe inspector tegen OpenClaw-Plugin-packages. Voer dit uit vanuit een schone OpenClaw-checkout nadat het package is gebouwd:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Houd dit traject opt-in voor beheerders, omdat het een extern npm-package installeert en Plugin-packages kan inspecteren die buiten de repo zijn gekloond. De lokale repo-guards dekken de SDK-exportmap, metadata van het compatibiliteitsregister, afbouw van verouderde SDK-imports en importgrenzen van gebundelde extensies; Testbox-inspectorbewijs dekt het package zoals externe Plugin-auteurs het gebruiken.

## Afschrijvingsbeleid

OpenClaw mag een gedocumenteerd Plugin-contract niet verwijderen in dezelfde release waarin de vervanging wordt geïntroduceerd.

De migratievolgorde is:

1. Voeg het nieuwe contract toe.
2. Houd het oude gedrag aangesloten via een benoemde compatibiliteitsadapter.
3. Geef diagnostiek of waarschuwingen wanneer Plugin-auteurs actie kunnen ondernemen.
4. Documenteer de vervanging en tijdlijn.
5. Test zowel oude als nieuwe paden.
6. Wacht gedurende de aangekondigde migratieperiode.
7. Verwijder alleen met expliciete goedkeuring voor een breaking release.

Verouderde records moeten een startdatum voor waarschuwingen, vervanging, docs-link en definitieve verwijderdatum bevatten, niet meer dan drie maanden nadat de waarschuwing begint. Voeg geen verouderd compatibiliteitspad toe met een open verwijderingsperiode, tenzij beheerders expliciet besluiten dat het permanente compatibiliteit is en het in plaats daarvan als `active` markeren.

## Huidige compatibiliteitsgebieden

Huidige compatibiliteitsrecords omvatten:

- oude brede SDK-imports zoals `openclaw/plugin-sdk/compat`
- oude hook-only Plugin-vormen en `before_agent_start`
- oude namen voor cleanup-hooks `api.on("deactivate", ...)` terwijl plugins migreren naar
  `gateway_stop`
- oude Plugin-entrypoints `activate(api)` terwijl plugins migreren naar
  `register(api)`
- oude SDK-aliassen zoals `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  status builders, `openclaw/plugin-sdk/test-utils` (vervangen door gerichte
  `openclaw/plugin-sdk/*`-testsubpaden), en de type-aliassen `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist- en inschakelgedrag voor gebundelde plugins
- oude manifestmetadata voor provider-/kanaal-env-vars
- oude provider-Plugin-hooks en type-aliassen terwijl providers overstappen naar
  expliciete catalogus-, auth-, thinking-, replay- en transporthooks
- oude runtime-aliassen zoals `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, en verouderde
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- WhatsApp `WebInboundMessage` vlakke callbackvelden zoals `body`, `chatId`,
  `reply(...)`, en `mediaPath` terwijl callbackconsumenten migreren naar de geneste
  `WebInboundCallbackMessage`-contexten `event`, `payload`, `quote`, `group`, en
  `platform`
- WhatsApp `WebInboundMessage` admission-velden op topniveau zoals `from`,
  `conversationId`, `accountId`, `accessControlPassed`, en `chatType` terwijl
  callbackconsumenten migreren naar de `admission`-envelope
- oude gesplitste registratie van geheugenplugins terwijl geheugenplugins overstappen naar
  `registerMemoryCapability`
- oude geheugenspecifieke registratie van embeddingproviders terwijl embeddingproviders overstappen naar `api.registerEmbeddingProvider(...)` en
  `contracts.embeddingProviders`
- oude SDK-helpers voor kanalen voor native berichtschema's, mention gating,
  inbound envelope-formattering en nesting van approval-capabilities
- oude kanaalroutesleutel- en comparable-target-helperaliassen terwijl plugins overstappen naar `openclaw/plugin-sdk/channel-route`
- activatiehints die worden vervangen door eigenaarschap van manifestbijdragen
- `setup-api` runtime-fallback terwijl setup-descriptors overstappen naar koude
  `setup.requiresRuntime: false`-metadata
- provider-`discovery`-hooks terwijl providercatalogushooks overstappen naar
  `catalog.run(...)`
- kanaalmetadata `showConfigured` / `showInSetup` terwijl kanaalpackages overstappen naar `openclaw.channel.exposure`
- oude runtime-policy-configuratiesleutels terwijl doctor operators migreert naar
  `agentRuntime`
- gegenereerde fallback voor gebundelde kanaalconfiguratiemetadata terwijl registry-first
  `channelConfigs`-metadata landt
- gepersisteerde env-flags voor uitschakelen van het Plugin-register en install-migratie terwijl
  reparatiestromen operators migreren naar `openclaw plugins registry --refresh` en
  `openclaw doctor --fix`
- oude Plugin-eigen configuratiepaden voor web search, web fetch en x_search terwijl
  doctor ze migreert naar `plugins.entries.<plugin>.config`
- oude door `plugins.installs` geschreven configuratie en aliassen voor laadpaden van gebundelde plugins terwijl installatiemetadata naar de state-managed Plugin-ledger verhuist

Nieuwe Plugin-code moet de vervanging gebruiken die in het register en in de specifieke migratiegids staat. Bestaande plugins kunnen een compatibiliteitspad blijven gebruiken totdat de docs, diagnostiek en release notes een verwijderingsperiode aankondigen.

### Vlakke Aliassen Voor WhatsApp Inbound Callback

WhatsApp-runtimecallbacks leveren `WebInboundMessage`: de canonieke geneste contexten `event`, `payload`, `quote`, `group` en `platform` plus verouderde vlakke aliassen voor de uitgeleverde callbackvelden. Nieuwe callbackcode moet de geneste contexten lezen. Code die schone geneste callbackberichten construeert, kan `WebInboundCallbackMessage` gebruiken; compatibiliteitslisteners die nog oude vlakke test- of Plugin-berichten injecteren, moeten `LegacyFlatWebInboundMessage` of
`WebInboundMessageInput` gebruiken.

De vlakke aliassen blijven beschikbaar tot **2026-08-30**. Die verwijderingsperiode geldt alleen voor toegang via vlakke aliassen; de geneste callbackvorm is het canonieke runtimecontract. De TypeScript-`@deprecated`-annotaties op elke vlakke alias noemen de exacte geneste vervanging. Veelvoorkomende voorbeelden:

- `id`, `timestamp`, en `isBatched` verplaatsen naar `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`, en
  `untrustedStructuredContext` verplaatsen naar `payload`.
- `to`, `chatId`, sender/self-velden, `sendComposing`, `reply(...)`, en
  `sendMedia(...)` verplaatsen naar `platform`.
- `replyTo*`-velden verplaatsen naar `quote`, en velden voor groepsonderwerp/deelnemer/vermelding verplaatsen naar `group`.

`payload.untrustedStructuredContext` wordt geëxtraheerd uit inbound providerpayloads. Plugins moeten de `label`, `source` en `type` inspecteren voordat ze de
`payload` als gezaghebbend behandelen.

### WhatsApp Inbound Admission-Velden

Geaccepteerde WhatsApp-callbackberichten dragen nu `admission`, een publiek-veilige envelope voor de access-controlbeslissing die het bericht toeliet. Nieuwe callbackcode moet admission-feiten lezen uit `msg.admission` in plaats van uit de oudere admission-velden op topniveau.

De velden op topniveau blijven beschikbaar tot **2026-08-30**. De TypeScript-`@deprecated`-annotaties noemen elke vervanging:

- `from` en `conversationId` verplaatsen naar `admission.conversation.id`.
- `accountId` verplaatst naar `admission.accountId`.
- `accessControlPassed` is een afgeleide compatibiliteitsweergave van
  `admission.ingress.decision === "allow"`; op berichten die al
  `admission` bevatten, herschrijft het schrijven van de oude boolean de ingress-grafiek niet.
- `chatType` verplaatst naar `admission.conversation.kind`.

## Release notes

Release notes moeten aankomende Plugin-afschrijvingen bevatten met doeldatums en links naar migratiedocs. Die waarschuwing moet plaatsvinden voordat een compatibiliteitspad naar `removal-pending` of `removed` gaat.
