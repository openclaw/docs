---
doc-schema-version: 1
read_when:
    - Plugins installeren of configureren
    - Inzicht in Plugin-detectie en laadregels
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Getting Started
summary: Installeer, configureer en beheer OpenClaw Plugins
title: Plugins
x-i18n:
    generated_at: "2026-06-27T18:29:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met kanalen, modelproviders, agent-harnassen, tools,
Skills, spraak, realtime transcriptie, stem, media-inzicht, generatie,
web fetch, webzoekopdrachten en andere runtime-mogelijkheden.

Gebruik deze pagina wanneer je een plugin wilt installeren, de Gateway opnieuw wilt
starten, wilt controleren of de runtime deze heeft geladen, en veelvoorkomende
installatiefouten wilt routeren. Zie voor voorbeelden met alleen opdrachten
[Plugins beheren](/nl/plugins/manage-plugins). Zie voor de volledige gegenereerde
inventaris van gebundelde, officiële externe en alleen-bronplugins
[Plugin-inventaris](/nl/plugins/plugin-inventory).

## Vereisten

Controleer voordat je een plugin installeert of je beschikt over:

- een OpenClaw-checkout of -installatie waarin de `openclaw` CLI beschikbaar is
- netwerktoegang tot de geselecteerde bron, zoals ClawHub, npm of een git-host
- eventuele pluginspecifieke referenties, configuratiesleutels of
  besturingssysteemtools die in de installatiedocumentatie van die plugin worden
  genoemd
- toestemming voor de Gateway die je kanalen bedient om opnieuw te laden of
  opnieuw te starten

## Snelstart

<Steps>
  <Step title="Zoek de plugin">
    Doorzoek [ClawHub](/nl/clawhub) naar openbare pluginpakketten:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub is het primaire ontdekkingsoppervlak voor communityplugins. Tijdens
    de lanceringsovergang installeren gewone kale pakketspecificaties nog steeds
    vanaf npm, tenzij ze overeenkomen met een officiële plugin-id. Onbewerkte
    `@openclaw/*`-pakketspecificaties die overeenkomen met gebundelde plugins
    gebruiken de gebundelde kopie uit de huidige OpenClaw-build. Gebruik een
    expliciet voorvoegsel wanneer je één bron nodig hebt.

  </Step>

  <Step title="Installeer de plugin">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Behandel plugininstallaties alsof je code uitvoert. Geef de voorkeur aan
    vastgepinde versies wanneer je reproduceerbare productie-installaties nodig
    hebt.

  </Step>

  <Step title="Configureer en schakel deze in">
    Configureer pluginspecifieke instellingen onder `plugins.entries.<id>.config`.
    Schakel de plugin in wanneer deze nog niet is ingeschakeld:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Als je configuratie een beperkende `plugins.allow`-lijst gebruikt, moet de
    geïnstalleerde plugin-id daarin aanwezig zijn voordat de plugin kan laden.
    `openclaw plugins install` voegt de geïnstalleerde id toe aan een bestaande
    `plugins.allow`-lijst en verwijdert dezelfde id uit `plugins.deny`, zodat de
    expliciete installatie na een herstart kan laden.

  </Step>

  <Step title="Laat de Gateway opnieuw laden">
    Voor het installeren, bijwerken of verwijderen van plugincode is een
    herstart van de Gateway vereist. Wanneer er al een beheerde Gateway draait
    met configuratieherladen ingeschakeld, detecteert OpenClaw het gewijzigde
    plugininstallatierecord en start het de Gateway automatisch opnieuw. Als de
    Gateway niet wordt beheerd of herladen is uitgeschakeld, start deze dan zelf
    opnieuw:

    ```bash
    openclaw gateway restart
    ```

    In- en uitschakelbewerkingen werken de configuratie bij en vernieuwen de
    koude registry. Een runtime-inspectie blijft het duidelijkste verificatiepad
    voor live runtime-oppervlakken.

  </Step>

  <Step title="Controleer runtime-registratie">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Gebruik `--runtime` wanneer je geregistreerde tools, hooks, services,
    Gateway-methoden of pluginbeheerde CLI-opdrachten moet bewijzen. Gewone
    `inspect` is een koude manifest- en registrycontrole.

  </Step>
</Steps>

## Configuratie

### Kies een installatiebron

| Bron        | Gebruik wanneer                                                                 | Voorbeeld                                                      |
| ----------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Je OpenClaw-native ontdekking, scans, versiemetadata en installatiehints wilt    | `openclaw plugins install clawhub:<package>`                   |
| npm         | Je directe npm-registry- of dist-tag-workflows nodig hebt                        | `openclaw plugins install npm:<package>`                       |
| git         | Je een branch, tag of commit uit een repository nodig hebt                       | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaal pad  | Je een plugin op dezelfde machine ontwikkelt of test                             | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Je een Claude-compatibele marketplace-plugin installeert                         | `openclaw plugins install <plugin> --marketplace <source>`     |

Kale pakketspecificaties hebben speciaal compatibiliteitsgedrag. Als de kale
naam overeenkomt met een gebundelde plugin-id, gebruikt OpenClaw die gebundelde
bron. Als deze overeenkomt met een officiële externe plugin-id, gebruikt
OpenClaw de officiële pakketcatalogus. Andere gewone kale pakketspecificaties
installeren tijdens de lanceringsovergang via npm. Onbewerkte
`@openclaw/*`-pakketspecificaties die overeenkomen met gebundelde plugins worden
ook eerst naar de gebundelde kopie opgelost voordat npm als fallback wordt
gebruikt. Gebruik `npm:@openclaw/<plugin>@<version>` wanneer je bewust het
externe npm-pakket wilt gebruiken in plaats van de door de image beheerde
gebundelde kopie. Gebruik `clawhub:`, `npm:`, `git:` of `npm-pack:` wanneer je
deterministische bronselectie nodig hebt. Zie
[`openclaw plugins`](/nl/cli/plugins#install) voor het volledige opdrachtcontract.

Voor npm-installaties kiezen niet-vastgepinde pakketspecificaties en `@latest`
het nieuwste stabiele pakket dat compatibiliteit met deze OpenClaw-build
adverteert. Als de huidige nieuwste release van npm een nieuwere
`openclaw.compat.pluginApi` of `openclaw.install.minHostVersion` declareert,
scant OpenClaw oudere stabiele pakketversies en installeert het de nieuwste die
past. Exacte versies en expliciete kanaaltags zoals `@beta` blijven vastgepind
op het geselecteerde pakket en mislukken wanneer ze incompatibel zijn.

### Installatiebeleid voor operators

Configureer `security.installPolicy` om een vertrouwde lokale beleidsopdracht uit
te voeren voordat de installatie of update van een plugin doorgaat. Het beleid
ontvangt metadata plus het gestagede bronpad en kan de installatie toestaan of
blokkeren. Het dekt CLI- en Gateway-ondersteunde paden voor installatie/update
van plugins. Plugin-`before_install`-hooks draaien later alleen in
OpenClaw-processen waarin plugin-hooks zijn geladen, dus gebruik
`security.installPolicy` voor installatiebeslissingen die eigendom zijn van de
operator. De verouderde vlag `--dangerously-force-unsafe-install` wordt voor
compatibiliteit geaccepteerd, maar omzeilt het installatiebeleid of de ingebouwde
denylist voor pluginafhankelijkheden van OpenClaw niet.

Zie [Skills-configuratie](/nl/tools/skills-config#operator-install-policy-securityinstallpolicy)
voor het gedeelde `security.installPolicy`-execschema dat door zowel Skills als
plugins wordt gebruikt.

### Configureer pluginbeleid

De algemene vorm van pluginconfiguratie is:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Belangrijke beleidsregels:

- `plugins.enabled: false` schakelt alle plugins uit en slaat werk voor
  pluginontdekking/-laden over. Verouderde pluginverwijzingen zijn inert zolang
  dit actief is; schakel plugins opnieuw in voordat je doctor cleanup uitvoert
  wanneer je verouderde id's wilt verwijderen.
- `plugins.deny` wint van allow en per-plugin-inschakeling.
- `plugins.allow` is een exclusieve allowlist. Tools die eigendom zijn van
  plugins buiten de allowlist blijven onbeschikbaar, zelfs wanneer `tools.allow`
  `"*"` bevat.
- `plugins.entries.<id>.enabled: false` schakelt één plugin uit terwijl de
  configuratie behouden blijft.
- `plugins.load.paths` voegt expliciete lokale pluginbestanden of -mappen toe.
  Beheerde lokale paden voor `plugins install` moeten pluginmappen of archieven
  zijn; gebruik `plugins.load.paths` voor zelfstandige pluginbestanden.
- Plugins uit de workspace zijn standaard uitgeschakeld; schakel ze expliciet in
  of zet ze op de allowlist voordat je lokale workspace-code gebruikt.
- Gebundelde plugins volgen hun ingebouwde default-on/default-off-metadata,
  tenzij configuratie deze expliciet overschrijft.
- `plugins.slots.<slot>` kiest één plugin voor exclusieve categorieën zoals
  geheugen- en context-engines. Slotselectie schakelt de geselecteerde plugin
  geforceerd in voor dat slot door te tellen als expliciete activatie; deze kan
  laden, zelfs wanneer deze anders opt-in zou zijn. `plugins.deny` en
  `plugins.entries.<id>.enabled: false` blokkeren deze nog steeds.
- Gebundelde opt-in-plugins kunnen automatisch activeren wanneer de configuratie
  een van hun eigen oppervlakken noemt, zoals een provider/model-ref,
  kanaalconfiguratie, CLI-backend of agent-harnasruntime.
- OpenAI-familie Codex-routing houdt provider- en runtime-plugin-grenzen
  gescheiden: legacy Codex-modelrefs zijn legacyconfiguratie die door doctor
  wordt gerepareerd, terwijl de gebundelde `codex`-plugin eigenaar is van de
  Codex app-serverruntime voor canonieke `openai/*`-agentrefs, expliciete
  `agentRuntime.id: "codex"` en legacy `codex/*`-refs.

Wanneer `plugins.allow` niet is ingesteld en niet-gebundelde plugins automatisch
worden ontdekt vanuit de workspace of globale pluginroots, logt startup
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`.
De waarschuwing bevat ontdekte plugin-id's en, voor korte lijsten, een minimale
`plugins.allow`-snippet. Voer
[`openclaw plugins list --enabled --verbose`](/nl/cli/plugins#list) of
[`openclaw plugins inspect <id>`](/nl/cli/plugins#inspect) uit met de vermelde
plugin-id voordat je vertrouwde plugins naar `openclaw.json` kopieert. Dezelfde
richtlijn voor trust-pinning geldt wanneer diagnostics aangeven dat een plugin
is geladen `without install/load-path provenance`: inspecteer die plugin-id en
pin vervolgens de vertrouwde id in `plugins.allow` of installeer opnieuw vanuit
een vertrouwde bron zodat OpenClaw de installatieherkomst vastlegt.

Voer `openclaw doctor` of `openclaw doctor --fix` uit wanneer
configuratievalidatie verouderde plugin-id's, mismatches tussen allowlist/tools
of legacy gebundelde pluginpaden rapporteert.

## Pluginformaten begrijpen

OpenClaw herkent twee pluginformaten:

| Formaat                 | Hoe het laadt                                                               | Gebruik wanneer                                                        |
| ----------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Native OpenClaw-plugin  | `openclaw.plugin.json` plus een runtimemodule die in-process wordt geladen | Je OpenClaw-specifieke runtime-mogelijkheden installeert of bouwt      |
| Compatibele bundel      | Codex-, Claude- of Cursor-pluginlay-out gemapt naar OpenClaw-plugininventaris | Je compatibele Skills, opdrachten, hooks of bundelmetadata hergebruikt |

Beide formaten verschijnen in `openclaw plugins list`,
`openclaw plugins inspect`, `openclaw plugins enable` en
`openclaw plugins disable`. Zie [Pluginbundels](/nl/plugins/bundles) voor de
compatibiliteitsgrens van bundels en
[Plugins bouwen](/nl/plugins/building-plugins) voor het maken van native plugins.

## Plugin-hooks

Plugins kunnen hooks registreren tijdens runtime, maar er zijn twee verschillende
API's met verschillende taken.

- Gebruik getypeerde hooks via `api.on(...)` voor runtime-lifecyclehooks. Dit is
  het voorkeursoppervlak voor middleware, beleid, het herschrijven van berichten,
  promptvorming en toolbeheer.
- Gebruik `api.registerHook(...)` alleen wanneer je wilt deelnemen aan het
  interne hooksysteem dat wordt beschreven in [Hooks](/nl/automation/hooks). Dit is
  vooral bedoeld voor grove opdracht-/lifecycle-bijwerkingen en compatibiliteit
  met bestaande HOOK-achtige automatisering.

Snelle regel:

- Als de handler prioriteit, merge-semantiek of blokkeer-/annuleergedrag nodig
  heeft, gebruik dan getypeerde plugin-hooks.
- Als de handler alleen reageert op `command:new`, `command:reset`,
  `message:sent` of vergelijkbare grove events, is `api.registerHook(...)`
  prima.

Door plugins beheerde interne hooks verschijnen in `openclaw hooks list` met
`plugin:<id>`. Je kunt ze niet in- of uitschakelen via `openclaw hooks`;
schakel in plaats daarvan de plugin in of uit.

## Controleer de actieve Gateway

`openclaw plugins list` en gewone `openclaw plugins inspect` lezen koude configuratie,
manifest- en registerstatus. Ze bewijzen niet dat een al draaiende Gateway
dezelfde plugincode heeft geïmporteerd.

Wanneer een plugin geïnstalleerd lijkt, maar live chatverkeer deze niet gebruikt:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Beheerde Gateways herstarten automatisch na wijzigingen door plugininstallatie, updates en
verwijdering die pluginbroncode wijzigen. Zorg er bij VPS- of containerinstallaties voor
dat een handmatige herstart gericht is op het daadwerkelijke `openclaw gateway run`-kindproces dat
je kanalen bedient, niet alleen op een wrapper of supervisor.

## Probleemoplossing

| Symptoom                                                       | Controle                                                                                                                                   | Oplossing                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin verschijnt in `plugins list`, maar runtime hooks worden niet uitgevoerd | Gebruik `openclaw plugins inspect <id> --runtime --json` en bevestig de actieve Gateway met `gateway status --deep --require-rpc`          | Herstart de live Gateway na installatie-, update-, configuratie- of bronwijzigingen                     |
| Diagnostiek voor dubbele kanaal- of tool-eigendom verschijnt   | Voer `openclaw plugins list --enabled --verbose` uit, inspecteer elke verdachte plugin met `--runtime --json` en vergelijk kanaal-/tool-eigendom | Schakel één eigenaar uit, verwijder verouderde installaties, of gebruik manifest `preferOver` voor bedoelde vervanging |
| Configuratie zegt dat een plugin ontbreekt                     | Controleer [Plugin-inventaris](/nl/plugins/plugin-inventory) om te zien of deze gebundeld, officieel extern of alleen broncode is             | Installeer het externe pakket, schakel de gebundelde plugin in, of verwijder verouderde configuratie    |
| Configuratie is ongeldig tijdens installatie                   | Lees het validatiebericht en voer `openclaw doctor --fix` uit wanneer het naar verouderde pluginstatus verwijst                            | Doctor kan ongeldige pluginconfiguratie in quarantaine plaatsen door de invoer uit te schakelen en de ongeldige payload te verwijderen |
| Pluginpad wordt geblokkeerd wegens verdachte eigendom of rechten | Inspecteer de diagnostiek vóór de configuratiefout                                                                                          | Herstel bestandssysteemeigendom/-rechten en voer daarna `openclaw plugins registry --refresh` uit       |
| `OPENCLAW_NIX_MODE=1` blokkeert levenscyclusopdrachten         | Bevestig dat de installatie door Nix wordt beheerd                                                                                          | Wijzig pluginselectie in de Nix-bron in plaats van plugin-mutatieopdrachten te gebruiken               |
| Dependency-import mislukt tijdens runtime                      | Controleer of de plugin via npm/git/ClawHub is geïnstalleerd of vanaf een lokaal pad is geladen                                             | Voer `openclaw plugins update <id>` uit, installeer de bron opnieuw, of installeer lokale pluginafhankelijkheden zelf |

Wanneer verouderde pluginconfiguratie nog steeds een niet-langer-vindbare kanaalplugin noemt,
slaat Gateway-startup dat door een plugin ondersteunde kanaal over in plaats van elk
ander kanaal te blokkeren. Voer `openclaw doctor --fix` uit om verouderde plugin- en kanaalvermeldingen
te verwijderen. Onbekende kanaalsleutels zonder bewijs van verouderde plugins blijven
validatie laten mislukken, zodat typefouten zichtbaar blijven.

Voor bedoelde kanaalvervanging moet de voorkeursplugin
`channelConfigs.<channel-id>.preferOver` declareren met de legacy of lagere-prioriteit
plugin-id. Als beide plugins expliciet zijn ingeschakeld, behoudt OpenClaw dat verzoek
en rapporteert het diagnostiek voor dubbele kanaal- of tool-eigendom in plaats van stilzwijgend
één eigenaar te kiezen.

Als een geïnstalleerd pakket meldt dat het `requires compiled runtime output for
TypeScript entry ...`, dan is het pakket gepubliceerd zonder de JavaScript-bestanden
die OpenClaw tijdens runtime nodig heeft. Update of installeer opnieuw nadat de uitgever
gecompileerde JavaScript levert, of schakel de plugin tot die tijd uit/verwijder deze.

### Geblokkeerde eigendom van pluginpad

Als plugindiagnostiek zegt
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
en configuratievalidatie volgt met `plugin present but blocked`, heeft OpenClaw
pluginbestanden gevonden die eigendom zijn van een andere Unix-gebruiker dan het proces dat ze laadt.
Laat de pluginconfiguratie staan; herstel het bestandssysteemeigendom of voer
OpenClaw uit als dezelfde gebruiker die eigenaar is van de statusmap.

Voor Docker-installaties draait de officiële image als `node` (uid `1000`), dus de
vanaf de host bind-mounted OpenClaw-configuratie- en werkruimtemappen horen normaal gesproken
eigendom te zijn van uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Als je OpenClaw bewust als root uitvoert, herstel dan de beheerde pluginroot naar
root-eigendom:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Voer na het herstellen van eigendom opnieuw `openclaw doctor --fix` of
`openclaw plugins registry --refresh` uit, zodat het vastgelegde pluginregister overeenkomt
met de herstelde bestanden.

### Trage instelling van plugintools

Als agentbeurten lijken te blijven hangen tijdens het voorbereiden van tools, schakel trace-logging in en
controleer op timingregels voor plugintool-factories:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Zoek naar:

```text
[trace:plugin-tools] factory timings ...
```

De samenvatting vermeldt de totale factorytijd en de traagste plugintool-factories,
inclusief plugin-id, gedeclareerde toolnamen, resultaatvorm en of de tool
optioneel is. Trage regels worden gepromoveerd tot waarschuwingen wanneer één factory
minstens 1 s duurt of de totale voorbereiding van plugintool-factories minstens 5 s duurt.

OpenClaw cachet succesvolle resultaten van plugintool-factories voor herhaalde resoluties
met dezelfde effectieve aanvraagcontext. De cachesleutel bevat de effectieve
runtimeconfiguratie, werkruimte, agent-/sessie-id's, sandboxbeleid, browserinstellingen,
leveringscontext, identiteit van de aanvrager en eigendomsstatus, zodat factories die
afhankelijk zijn van die vertrouwde velden opnieuw worden uitgevoerd wanneer de context verandert. Als timings
hoog blijven, doet de plugin mogelijk duur werk voordat deze zijn tooldefinities
teruggeeft.

Als één plugin de timing domineert, inspecteer dan de runtime-registraties ervan:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die plugin daarna bij, installeer deze opnieuw of schakel deze uit. Pluginauteurs moeten
dure afhankelijkheidslading verplaatsen naar achter het uitvoeringspad van de tool in plaats van dit
binnen de toolfactory te doen.

Zie voor dependency-roots, validatie van pakketmetadata, registerrecords, startup-
herlaadgedrag en legacy-opschoning
[Plugin dependency resolution](/nl/plugins/dependency-resolution).

## Gerelateerd

- [Plugins beheren](/nl/plugins/manage-plugins) - opdrachtvoorbeelden voor weergeven, installeren, bijwerken, verwijderen en publiceren
- [`openclaw plugins`](/nl/cli/plugins) - volledige CLI-referentie
- [Plugin-inventaris](/nl/plugins/plugin-inventory) - gegenereerde lijst met gebundelde en externe plugins
- [Pluginreferentie](/nl/plugins/reference) - gegenereerde referentiepagina's per plugin
- [Communityplugins](/nl/plugins/community) - ClawHub-ontdekking en beleid voor docs-PR's
- [Plugin dependency resolution](/nl/plugins/dependency-resolution) - installatieroots, registerrecords en runtimegrenzen
- [Plugins bouwen](/nl/plugins/building-plugins) - gids voor native pluginauteurs
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview) - runtimeregistratie, hooks en API-velden
- [Pluginmanifest](/nl/plugins/manifest) - manifest- en pakketmetadata
