---
read_when:
    - Je onderhoudt een OpenClaw-plugin
    - Je ziet een compatibiliteitswaarschuwing voor een plugin
    - Je plant een migratie van een Plugin-SDK of manifest.
summary: Compatibiliteitscontracten voor Plugins, afschrijvingsmetadata en migratieverwachtingen
title: Plugincompatibiliteit
x-i18n:
    generated_at: "2026-07-12T09:08:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw houdt oudere plugincontracten via benoemde compatibiliteitsadapters
aangesloten voordat ze worden verwijderd. Dit beschermt bestaande gebundelde
en externe plugins terwijl de contracten voor de SDK, het manifest, de
installatie, de configuratie en de agentruntime zich ontwikkelen.

## Compatibiliteitsregister

Compatibiliteitscontracten voor plugins worden bijgehouden in het kernregister
in `src/plugins/compat/registry.ts`. Elke record bevat:

- een stabiele compatibiliteitscode
- status: `active`, `deprecated`, `removal-pending` of `removed`
- eigenaar: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime` of `core`
- introductie- en afschrijvingsdatums, indien van toepassing
- richtlijnen voor vervanging
- documentatie, diagnostiek en tests die het oude en nieuwe gedrag dekken

Het register is de bron voor onderhoudsplanning en toekomstige controles door
de plugin-inspector. Als gedrag voor plugins verandert, voegt u de
compatibiliteitsrecord toe of werkt u deze bij in dezelfde wijziging waarmee
de adapter wordt toegevoegd.

Compatibiliteit voor reparatie en migratie door Doctor wordt afzonderlijk
bijgehouden in `src/commands/doctor/shared/deprecation-compat.ts`. Die records
dekken oude configuratiestructuren, indelingen van het installatielogboek en
reparatieshims die mogelijk beschikbaar moeten blijven nadat het
compatibiliteitspad in de runtime is verwijderd.

Releasecontroles moeten beide registers controleren. Verwijder een
Doctor-migratie niet alleen omdat de bijbehorende compatibiliteitsrecord voor
de runtime of configuratie is verlopen; controleer eerst of er geen
ondersteund upgradepad is waarvoor de reparatie nog nodig is. Valideer tijdens
de releaseplanning ook elke vervangingsannotatie opnieuw, omdat het eigendom
van plugins en de configuratieomvang kunnen veranderen wanneer providers en
kanalen uit de kern worden verplaatst.

## Afschrijvingsbeleid

OpenClaw mag een gedocumenteerd plugincontract niet verwijderen in dezelfde
release waarin de vervanging ervan wordt geïntroduceerd. Migratievolgorde:

1. Voeg het nieuwe contract toe.
2. Houd het oude gedrag aangesloten via een benoemde compatibiliteitsadapter.
3. Geef diagnostische meldingen of waarschuwingen wanneer pluginauteurs actie kunnen ondernemen.
4. Documenteer de vervanging en de tijdlijn.
5. Test zowel het oude als het nieuwe pad.
6. Wacht gedurende het aangekondigde migratievenster.
7. Verwijder alleen met expliciete goedkeuring voor een release met incompatibele wijzigingen.

Afgeschreven records moeten een begindatum voor waarschuwingen, een vervanging,
een documentatielink en een definitieve verwijderingsdatum bevatten die niet
later dan drie maanden na het begin van de waarschuwingen ligt. Voeg geen
afgeschreven compatibiliteitspad met een onbeperkt verwijderingsvenster toe,
tenzij onderhouders expliciet besluiten dat het permanente compatibiliteit is
en het in plaats daarvan als `active` markeren.

## Huidige compatibiliteitsgebieden

Het register houdt momenteel ongeveer 70 compatibiliteitscodes bij binnen
deze gebieden. Nieuwe plugincode moet in elk gebied en in de specifieke
migratiehandleiding de vervanging gebruiken; bestaande plugins kunnen een
compatibiliteitspad blijven gebruiken totdat de documentatie, diagnostiek en
releaseopmerkingen een verwijderingsvenster aankondigen.

- verouderde brede SDK-imports, zoals `openclaw/plugin-sdk/compat`
- verouderde pluginstructuren met alleen hooks en `before_agent_start`
- verouderde namen van opschoningshooks met `api.on("deactivate", ...)` terwijl plugins
  migreren naar `gateway_stop`
- verouderde pluginingangspunten met `activate(api)` terwijl plugins migreren naar
  `register(api)`
- verouderde SDK-aliassen, zoals `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, statusbouwers van
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils`
  (vervangen door gerichte testsubpaden onder `openclaw/plugin-sdk/*`) en de
  typealiassen `ClawdbotConfig` / `OpenClawSchemaType`
- gedrag voor de toelatingslijst en activering van gebundelde plugins
- verouderde manifestmetagegevens voor omgevingsvariabelen van providers en kanalen
- verouderde hooks en typealiassen voor providerplugins terwijl providers overstappen op
  expliciete hooks voor catalogi, authenticatie, redenering, herhaling en transport
- verouderde runtime-aliassen, zoals `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` en de afgeschreven
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- platte callbackvelden van WhatsApp `WebInboundMessage` (zie hieronder)
- toelatingsvelden op het hoogste niveau van WhatsApp `WebInboundMessage` (zie hieronder)
- verouderde gesplitste registratie van geheugenplugins terwijl geheugenplugins overstappen op
  `registerMemoryCapability`
- verouderde geheugenspecifieke registratie van embeddingproviders terwijl embeddingproviders
  overstappen op `api.registerEmbeddingProvider(...)` en
  `contracts.embeddingProviders`
- verouderde helpers van de kanaal-SDK voor systeemeigen berichtschema's,
  vermeldingstoegang, opmaak van binnenkomende enveloppen en het nesten van
  goedkeuringsmogelijkheden
- verouderde aliassen voor kanaalroutesleutels en helpers voor vergelijkbare doelen terwijl
  plugins overstappen op `openclaw/plugin-sdk/channel-route`
- activeringshints die worden vervangen door eigendom van manifestbijdragen
- runtime-terugval op `setup-api` terwijl installatiebeschrijvingen overstappen op koude
  metagegevens met `setup.requiresRuntime: false`
- providerhooks voor `discovery` terwijl hooks voor providercatalogi overstappen op
  `catalog.run(...)`
- kanaalmetagegevens `showConfigured` / `showInSetup` terwijl kanaalpakketten
  overstappen op `openclaw.channel.exposure`
- verouderde configuratiesleutels voor runtimebeleid terwijl Doctor beheerders migreert naar
  `agentRuntime`
- terugval op gegenereerde configuratiemetagegevens voor gebundelde kanalen terwijl
  registergestuurde `channelConfigs`-metagegevens worden ingevoerd
- opgeslagen omgevingsvlaggen voor het uitschakelen van het pluginregister en de
  installatiemigratie terwijl reparatiestromen beheerders migreren naar
  `openclaw plugins registry --refresh` en `openclaw doctor --fix`
- verouderde configuratiepaden voor zoekopdrachten op het web, ophalen via het web en
  x_search die eigendom zijn van plugins, terwijl Doctor ze migreert naar
  `plugins.entries.<plugin>.config`
- verouderde handmatig geschreven configuratie voor `plugins.installs` en aliassen voor
  laadpaden van gebundelde plugins terwijl installatiemetagegevens worden verplaatst naar
  het door status beheerde pluginlogboek

### Platte aliassen voor binnenkomende WhatsApp-callbacks

WhatsApp-runtimecallbacks leveren `WebInboundMessage`: de canonieke geneste
contexten `event`, `payload`, `quote`, `group` en `platform`, plus afgeschreven
platte aliassen voor de uitgebrachte callbackvelden. Nieuwe callbackcode moet
de geneste contexten lezen. Code die zuiver geneste callbackberichten
construeert, kan `WebInboundCallbackMessage` gebruiken; compatibiliteitslisteners
die nog oude platte test- of pluginberichten invoegen, moeten
`LegacyFlatWebInboundMessage` of `WebInboundMessageInput` gebruiken.

De platte aliassen blijven beschikbaar tot **2026-08-30**; dat venster geldt
alleen voor toegang via platte aliassen, niet voor de geneste structuur, die
het canonieke runtimecontract is. De TypeScript-annotatie `@deprecated` van
elke platte alias noemt de exacte geneste vervanging. Veelvoorkomende
voorbeelden:

- `id`, `timestamp` en `isBatched` worden onder `event` geplaatst.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`
  en `untrustedStructuredContext` worden onder `payload` geplaatst.
- `to`, `chatId`, afzender-/zelfvelden, `sendComposing`, `reply(...)` en
  `sendMedia(...)` worden onder `platform` geplaatst.
- `replyTo*`-velden worden onder `quote` geplaatst; velden voor
  groepsonderwerp, deelnemers en vermeldingen worden onder `group` geplaatst.

`payload.untrustedStructuredContext` wordt uit binnenkomende providerpayloads
geëxtraheerd. Plugins moeten `label`, `source` en `type` controleren voordat
ze de `payload` ervan als gezaghebbend behandelen.

### Toelatingsvelden voor binnenkomende WhatsApp-berichten

Geaccepteerde WhatsApp-callbackberichten bevatten `admission`, een openbaar
veilige envelop voor de toegangscontrolebeslissing waarmee het bericht is
toegelaten. Nieuwe callbackcode moet toelatingsgegevens uit `msg.admission`
lezen in plaats van uit de oudere toelatingsvelden op het hoogste niveau.

De velden op het hoogste niveau blijven beschikbaar tot **2026-08-30**. De
TypeScript-annotatie `@deprecated` van elk veld noemt de vervanging:

- `from` en `conversationId` worden verplaatst naar `admission.conversation.id`.
- `accountId` wordt verplaatst naar `admission.accountId`.
- `accessControlPassed` is een afgeleide compatibiliteitsweergave van
  `admission.ingress.decision === "allow"`; bij berichten die al
  `admission` bevatten, herschrijft het instellen van de verouderde booleaanse
  waarde de inkomende beslissingsgraaf niet.
- `chatType` wordt verplaatst naar `admission.conversation.kind`.

## Pakket voor de plugin-inspector

De plugin-inspector moet buiten de kernrepository van OpenClaw worden
ondergebracht als een afzonderlijk pakket/aparte repository, gebaseerd op de
geversioneerde compatibiliteits- en manifestcontracten. De CLI voor de eerste
dag moet zijn:

```sh
openclaw-plugin-inspector ./my-plugin
```

Deze moet manifest-/schemavalidatie, de gecontroleerde
contractcompatibiliteitsversie, controles van installatie-/bronmetagegevens,
importcontroles voor koude paden en waarschuwingen over
afschrijving/compatibiliteit uitvoeren. Gebruik `--json` voor stabiele,
machineleesbare uitvoer in CI-annotaties. De kern van OpenClaw moet contracten
en testgegevens beschikbaar stellen die de inspector kan gebruiken, maar mag
het uitvoerbare inspectorbestand niet publiceren vanuit het hoofdpakket
`openclaw`.

### Acceptatietraject voor onderhouders

Gebruik door Crabbox ondersteunde Blacksmith Testbox voor het acceptatietraject
voor installeerbare pakketten wanneer de externe inspector wordt gevalideerd
tegen OpenClaw-pluginpakketten. Voer dit uit vanuit een schone
OpenClaw-check-out nadat het pakket is gebouwd:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Houd dit traject optioneel voor onderhouders, omdat het een extern npm-pakket
installeert en pluginpakketten kan inspecteren die buiten de repository zijn
gekloond. De lokale repositorybeveiligingen dekken de exportindeling van de
SDK, metagegevens van het compatibiliteitsregister, de uitfasering van
afgeschreven SDK-imports en importgrenzen van gebundelde extensies;
inspectorsbewijs uit Testbox dekt het pakket zoals externe pluginauteurs het
gebruiken.

## Releaseopmerkingen

Releaseopmerkingen moeten aankomende afschrijvingen van plugins bevatten, met
streefdatums en links naar migratiedocumentatie, voordat een
compatibiliteitspad wordt verplaatst naar `removal-pending` of `removed`.
