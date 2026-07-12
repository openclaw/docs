---
doc-schema-version: 1
read_when:
    - Plugins installeren of configureren
    - Inzicht in de detectie- en laadregels voor plugins
    - Werken met Codex-/Claude-compatibele pluginbundels
sidebarTitle: Getting Started
summary: OpenClaw-plugins installeren, configureren en beheren
title: Plugins
x-i18n:
    generated_at: "2026-07-12T09:24:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met kanalen, modelproviders, agentharnassen, tools,
Skills, spraak, realtime transcriptie, stem, mediabegrip, generatie,
webophaling, webzoeken en andere runtimefunctionaliteiten.

Gebruik deze pagina om een Plugin te installeren, de Gateway opnieuw te starten,
te verifiëren dat de runtime deze heeft geladen en veelvoorkomende
configuratiefouten op te lossen. Zie [Plugins beheren](/nl/plugins/manage-plugins)
voor voorbeelden die alleen opdrachten bevatten. Zie
[Plugin-inventaris](/nl/plugins/plugin-inventory) voor de gegenereerde inventaris
van gebundelde, officiële externe en uitsluitend vanuit broncode beschikbare
Plugins.

## Vereisten

- een checkout of installatie van OpenClaw waarin de `openclaw`-CLI beschikbaar is
- netwerktoegang tot de geselecteerde bron (ClawHub, npm of een git-host)
- alle Pluginspecifieke referenties, configuratiesleutels of
  besturingssysteemtools die in de configuratiedocumentatie van die Plugin
  worden genoemd
- toestemming om de Gateway die uw kanalen bedient opnieuw te laden of te starten

## Snel aan de slag

<Steps>
  <Step title="De Plugin zoeken">
    Zoek in [ClawHub](/clawhub) naar openbare Pluginpakketten:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub is het primaire ontdekkingsplatform voor community-Plugins. Tijdens
    de overgang bij de lancering worden gewone kale pakketspecificaties nog
    steeds vanuit npm geïnstalleerd, tenzij ze overeenkomen met een officiële
    Plugin-id. Onbewerkte `@openclaw/*`-specificaties die overeenkomen met een
    gebundelde Plugin worden naar die gebundelde kopie omgezet. Gebruik een
    expliciet bronvoorvoegsel wanneer u specifiek één bron nodig hebt.

  </Step>

  <Step title="De Plugin installeren">
    ```bash
    # Vanuit ClawHub.
    openclaw plugins install clawhub:<package>

    # Vanuit npm.
    openclaw plugins install npm:<package>

    # Vanuit git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Vanuit een lokale ontwikkelcheckout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Behandel Plugininstallaties alsof u code uitvoert. Geef voor
    reproduceerbare productie-installaties de voorkeur aan vastgezette versies.

  </Step>

  <Step title="De Plugin configureren en inschakelen">
    Configureer Pluginspecifieke instellingen onder `plugins.entries.<id>.config`.
    Schakel de Plugin in als deze nog niet is ingeschakeld:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Als `plugins.allow` is ingesteld, moet de geïnstalleerde Plugin-id in die
    lijst staan voordat de Plugin kan worden geladen. `openclaw plugins install`
    voegt de geïnstalleerde id toe aan een bestaande `plugins.allow`-lijst en
    verwijdert dezelfde id uit `plugins.deny`, zodat de expliciete installatie
    na een herstart kan worden geladen.

  </Step>

  <Step title="De Gateway opnieuw laten laden">
    Voor het installeren, bijwerken of verwijderen van Plugincode moet de
    Gateway opnieuw worden gestart. Een beheerde Gateway waarvoor het opnieuw
    laden van configuratie is ingeschakeld, detecteert de gewijzigde
    Plugininstallatierecord en start automatisch opnieuw. Start deze anders
    zelf opnieuw:

    ```bash
    openclaw gateway restart
    ```

    Bij het in- of uitschakelen worden de configuratie en het koude register
    bijgewerkt. Een runtime-inspectie blijft het duidelijkste bewijs van actieve
    runtime-oppervlakken.

  </Step>

  <Step title="Runtimeregistratie verifiëren">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Gebruik `--runtime` om geregistreerde tools, hooks, services,
    Gateway-methoden of CLI-opdrachten van de Plugin aan te tonen. Een gewone
    `inspect` controleert alleen het koude manifest en register.

  </Step>
</Steps>

## Configuratie

### Een installatiebron kiezen

| Bron        | Gebruiken wanneer                                                                                     | Voorbeeld                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| ClawHub     | U OpenClaw-eigen ontdekking, scans, versiemetadata en installatiehints wilt                           | `openclaw plugins install clawhub:<package>`                    |
| npm         | U rechtstreekse workflows met het npm-register of dist-tags nodig hebt                               | `openclaw plugins install npm:<package>`                        |
| git         | U een branch, tag of commit uit een repository nodig hebt                                             | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>`  |
| lokaal pad  | U op dezelfde machine een Plugin ontwikkelt of test                                                   | `openclaw plugins install --link ./my-plugin`                   |
| marktplaats | U een Claude-compatibele marktplaats-Plugin installeert                                               | `openclaw plugins install <plugin> --marketplace <source>`      |

Kale pakketspecificaties hebben speciaal compatibiliteitsgedrag: een kale naam
die overeenkomt met een gebundelde Plugin-id gebruikt die gebundelde bron; een
kale naam die overeenkomt met een officiële externe Plugin-id gebruikt de
officiële pakketcatalogus; elke andere kale specificatie wordt tijdens de
overgang bij de lancering via npm geïnstalleerd. Onbewerkte
`@openclaw/*`-specificaties die overeenkomen met gebundelde Plugins worden
eveneens vóór de terugval naar npm naar de gebundelde kopie omgezet. Gebruik
`npm:@openclaw/<plugin>@<version>` om doelbewust het externe npm-pakket te
installeren in plaats van de gebundelde kopie. Gebruik `clawhub:`, `npm:`,
`git:` of `npm-pack:` voor deterministische bronselectie. Zie
[`openclaw plugins`](/nl/cli/plugins#install) voor het volledige opdrachtcontract.

Voor npm-installaties selecteren niet-vastgezette specificaties en `@latest`
het nieuwste stabiele pakket dat compatibiliteit met deze OpenClaw-build
aangeeft. Als de huidige nieuwste npm-release een nieuwere
`openclaw.compat.pluginApi` of `openclaw.install.minHostVersion` declareert dan
deze build ondersteunt, doorzoekt OpenClaw oudere stabiele versies en
installeert het de nieuwste passende versie. Exacte versies en expliciete
kanaaltags zoals `@beta` blijven aan het geselecteerde pakket vastgezet en
mislukken wanneer ze incompatibel zijn.

### Installatiebeleid voor operators

Configureer `security.installPolicy` om een vertrouwde lokale beleidsopdracht
uit te voeren voordat een Plugininstallatie of -update doorgaat. Het beleid
ontvangt metadata plus het pad naar de voorbereide bron en kan de installatie
toestaan of blokkeren. Het geldt zowel voor installatie- en updatepaden via de
CLI als voor die via de Gateway. Pluginhooks van het type `before_install`
worden later uitgevoerd, en alleen in OpenClaw-processen waarin Pluginhooks
zijn geladen. Gebruik daarom in plaats daarvan `security.installPolicy` voor
installatiebeslissingen van de operator. De verouderde vlag
`--dangerously-force-unsafe-install` wordt om compatibiliteitsredenen
geaccepteerd, maar doet niets: deze omzeilt noch het installatiebeleid, noch de
ingebouwde blokkeerlijst voor Pluginafhankelijkheden van OpenClaw.

Zie [Skills-configuratie](/nl/tools/skills-config#operator-install-policy-securityinstallpolicy)
voor het gedeelde uitvoeringsschema van `security.installPolicy` dat door zowel
Skills als Plugins wordt gebruikt.

### Pluginbeleid configureren

De algemene vorm van de Pluginconfiguratie is:

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

Belangrijkste beleidsregels:

- `plugins.enabled: false` schakelt alle Plugins uit en slaat
  ontdekkings- en laadwerk over. Verouderde Pluginverwijzingen blijven
  inactief zolang dit actief is; schakel Plugins opnieuw in voordat u
  opschoning met doctor uitvoert als u verouderde id's wilt verwijderen.
- `plugins.deny` heeft voorrang op de toestemmingslijst en inschakeling per
  Plugin.
- `plugins.allow` is een exclusieve toestemmingslijst. Tools van Plugins die
  niet op de toestemmingslijst staan, blijven onbeschikbaar, zelfs wanneer
  `tools.allow` `"*"` bevat.
- `plugins.entries.<id>.enabled: false` schakelt één Plugin uit en behoudt de
  configuratie ervan.
- `plugins.load.paths` voegt expliciete lokale Pluginbestanden of -mappen toe.
  Lokale paden die worden beheerd met `plugins install` moeten Pluginmappen of
  archieven zijn; gebruik `plugins.load.paths` voor zelfstandige
  Pluginbestanden.
- Plugins die uit de werkruimte afkomstig zijn, zijn standaard uitgeschakeld;
  schakel ze expliciet in of voeg ze toe aan de toestemmingslijst voordat u
  lokale werkruimtecode gebruikt.
- Gebundelde Plugins volgen hun ingebouwde metadata voor standaard
  ingeschakeld of standaard uitgeschakeld, tenzij de configuratie dit
  expliciet overschrijft.
- `plugins.slots.<slot>` (`memory` of `contextEngine`) selecteert één Plugin
  voor een exclusieve categorie. Slotsselectie geldt als expliciete activering
  en schakelt de geselecteerde Plugin voor die slot geforceerd in, zelfs als
  deze anders opt-in zou zijn. `plugins.deny` en
  `plugins.entries.<id>.enabled: false` blokkeren deze nog steeds.
- Gebundelde opt-in-Plugins kunnen automatisch worden geactiveerd wanneer de
  configuratie een van hun eigen oppervlakken benoemt, zoals een
  provider-/modelverwijzing, kanaalconfiguratie, CLI-backend of runtime van een
  agentharnas.
- Codex-routering binnen de OpenAI-familie houdt de grenzen tussen
  provider- en runtime-Plugins gescheiden: verouderde Codex-modelverwijzingen
  zijn verouderde configuratie die door doctor wordt hersteld, terwijl de
  gebundelde `codex`-Plugin eigenaar is van de Codex-app-serverruntime voor
  canonieke `openai/*`-agentverwijzingen, expliciete
  `agentRuntime.id: "codex"` en verouderde `codex/*`-verwijzingen.

Wanneer `plugins.allow` niet is ingesteld en niet-gebundelde Plugins
automatisch vanuit de werkruimte of globale Pluginhoofdmappen worden ontdekt,
wordt bij het opstarten
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
gelogd, met de ontdekte Plugin-id's en, voor korte lijsten, een minimale
`plugins.allow`-snippet. Voer
[`openclaw plugins list --enabled --verbose`](/nl/cli/plugins#list) of
[`openclaw plugins inspect <id>`](/nl/cli/plugins#inspect) uit voor de vermelde
Plugin-id voordat u vertrouwde Plugins naar `openclaw.json` kopieert. Dezelfde
vertrouwensvastlegging geldt wanneer diagnostiek meldt dat een Plugin is
geladen `without install/load-path provenance`: inspecteer die Plugin-id en
leg deze vervolgens vast in `plugins.allow`, of installeer deze opnieuw vanuit
een vertrouwde bron zodat OpenClaw de installatieherkomst registreert.

Voer `openclaw doctor` of `openclaw doctor --fix` uit wanneer
configuratievalidatie verouderde Plugin-id's, verschillen tussen
toestemmingslijsten en tools of verouderde paden van gebundelde Plugins meldt.

## Pluginindelingen begrijpen

OpenClaw herkent twee Pluginindelingen:

| Indeling                  | Hoe deze wordt geladen                                                          | Gebruiken wanneer                                                                      |
| ------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Native OpenClaw-Plugin    | `openclaw.plugin.json` plus een runtimemodule die in het proces wordt geladen   | U OpenClaw-specifieke runtimefunctionaliteiten installeert of bouwt                    |
| Compatibele bundel        | Codex-, Claude- of Cursor-Pluginindeling die aan de OpenClaw-Plugininventaris wordt gekoppeld | U compatibele Skills, opdrachten, hooks of bundelmetadata hergebruikt         |

Beide indelingen verschijnen in `openclaw plugins list`,
`openclaw plugins inspect`, `openclaw plugins enable` en
`openclaw plugins disable`. Zie
[Pluginbundels](/nl/plugins/bundles) voor de compatibiliteitsgrens van bundels en
[Plugins bouwen](/nl/plugins/building-plugins) voor het maken van native Plugins.

## Pluginhooks

Plugins kunnen tijdens runtime hooks registreren via twee verschillende API's:

- Getypeerde hooks met `api.on(...)` voor gebeurtenissen in de
  runtimelevenscyclus. Dit is het voorkeursoppervlak voor middleware, beleid,
  het herschrijven van berichten, promptvormgeving en toolbeheer.
- `api.registerHook(...)` voor het interne hooksysteem dat wordt beschreven in
  [Hooks](/nl/automation/hooks). Dit is voornamelijk bedoeld voor grove
  neveneffecten van opdrachten of de levenscyclus en compatibiliteit met
  bestaande automatisering in HOOK-stijl.

Vuistregel: gebruik getypeerde hooks als de handler prioriteit,
samenvoegsemantiek of blokkeer-/annuleergedrag nodig heeft. Als deze alleen
reageert op `command:new`, `command:reset`, `message:sent` of vergelijkbare
grove gebeurtenissen, volstaat `api.registerHook`.

Interne hooks die door Plugins worden beheerd, verschijnen in
`openclaw hooks list` met `plugin:<id>`. U kunt deze niet in- of uitschakelen
via `openclaw hooks`; schakel in plaats daarvan de Plugin in of uit.

## De actieve Gateway verifiëren

`openclaw plugins list` en een gewone `openclaw plugins inspect` lezen de
koude configuratie-, manifest- en registerstatus. Ze bewijzen niet dat een al
actieve Gateway dezelfde Plugincode heeft geïmporteerd.

Wanneer een Plugin als geïnstalleerd wordt weergegeven, maar actief
chatverkeer deze niet gebruikt:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Beheerde Gateways worden automatisch opnieuw gestart na installatie-, update- en
verwijderingswijzigingen van plugins die de pluginbron wijzigen. Zorg er bij
VPS- of containerinstallaties voor dat een handmatige herstart gericht is op het
daadwerkelijke onderliggende proces `openclaw gateway run` dat je kanalen bedient,
en niet alleen op een wrapper of supervisor.

## Problemen oplossen

| Symptoom                                                       | Controle                                                                                                                                   | Oplossing                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin verschijnt in `plugins list`, maar runtimehooks worden niet uitgevoerd | Gebruik `openclaw plugins inspect <id> --runtime --json` en controleer de actieve Gateway met `gateway status --deep --require-rpc`         | Start de actieve Gateway opnieuw na wijzigingen aan installatie, update, configuratie of bron           |
| Diagnostiek over dubbel eigenaarschap van kanalen of tools verschijnt | Voer `openclaw plugins list --enabled --verbose` uit, inspecteer elke verdachte plugin met `--runtime --json` en vergelijk het eigenaarschap van kanalen/tools | Schakel één eigenaar uit, verwijder verouderde installaties of gebruik `preferOver` in het manifest voor doelbewuste vervanging |
| Configuratie meldt dat een plugin ontbreekt                    | Controleer in [Pluginoverzicht](/nl/plugins/plugin-inventory) of deze gebundeld, officieel extern of alleen als bron beschikbaar is            | Installeer het externe pakket, schakel de gebundelde plugin in of verwijder verouderde configuratie      |
| Configuratie is ongeldig tijdens de installatie                | Lees de validatiemelding en voer `openclaw doctor --fix` uit als deze naar verouderde pluginstatus verwijst                                | Doctor kan ongeldige pluginconfiguratie isoleren door de vermelding uit te schakelen en de ongeldige inhoud te verwijderen |
| Pluginpad wordt geblokkeerd vanwege verdacht eigenaarschap of verdachte machtigingen | Bekijk de diagnose vóór de configuratiefout                                                                                      | Herstel het eigenaarschap/de machtigingen van het bestandssysteem en voer daarna `openclaw plugins registry --refresh` uit |
| `OPENCLAW_NIX_MODE=1` blokkeert levenscyclusopdrachten         | Controleer of de installatie door Nix wordt beheerd                                                                                        | Wijzig de pluginselectie in de Nix-bron in plaats van opdrachten te gebruiken die plugins wijzigen      |
| Importeren van afhankelijkheid mislukt tijdens runtime         | Controleer of de plugin via npm/git/ClawHub is geïnstalleerd of vanuit een lokaal pad is geladen                                           | Voer `openclaw plugins update <id>` uit, installeer de bron opnieuw of installeer lokale pluginafhankelijkheden zelf |

Wanneer verouderde pluginconfiguratie nog steeds een kanaalplugin vermeldt die
niet langer kan worden gevonden, verlaagt configuratievalidatie die kanaalsleutel
van een harde fout naar een waarschuwing, zodat de Gateway bij het opstarten alle
andere kanalen nog kan bedienen. Voer `openclaw doctor --fix` uit om verouderde
plugin- en kanaalvermeldingen te verwijderen. Onbekende kanaalsleutels zonder
bewijs van een verouderde plugin leiden nog steeds tot mislukte validatie, zodat
typefouten zichtbaar blijven.

Voor doelbewuste vervanging van een kanaal moet de voorkeursplugin
`channelConfigs.<channel-id>.preferOver` declareren met de id van de verouderde
plugin of de plugin met lagere prioriteit. Als beide plugins expliciet zijn
ingeschakeld, respecteert OpenClaw dat verzoek en meldt het diagnostiek over
dubbel eigenaarschap van kanalen/tools in plaats van stilzwijgend één eigenaar
te kiezen.

Als een geïnstalleerd pakket meldt dat het `requires compiled runtime output for
TypeScript entry ...`, is het pakket gepubliceerd zonder de JavaScript-bestanden
die OpenClaw tijdens runtime nodig heeft. Werk het pakket bij of installeer het
opnieuw nadat de uitgever gecompileerd JavaScript heeft uitgebracht, of schakel
de plugin tot die tijd uit of verwijder deze.

### Geblokkeerd eigenaarschap van pluginpaden

Als de diagnostiek
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
meldt en de validatie daarna `plugin present but blocked` weergeeft, heeft
OpenClaw pluginbestanden gevonden die eigendom zijn van een andere Unix-gebruiker
dan het proces dat ze laadt. Laat de pluginconfiguratie intact; herstel het
eigenaarschap van het bestandssysteem of voer OpenClaw uit als dezelfde gebruiker
die eigenaar is van de statusmap.

Bij Docker-installaties wordt de officiële image uitgevoerd als `node` (uid
`1000`), waardoor de vanaf de host gekoppelde OpenClaw-configuratie- en
werkruimtemappen normaal gesproken eigendom moeten zijn van uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Als je OpenClaw doelbewust als root uitvoert, stel je in plaats daarvan root in
als eigenaar van de beheerde pluginhoofdmap:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Voer na het herstellen van het eigenaarschap opnieuw `openclaw doctor --fix` of
`openclaw plugins registry --refresh` uit, zodat het opgeslagen pluginregister
overeenkomt met de herstelde bestanden.

### Trage configuratie van plugintools

Als agentbeurten lijken vast te lopen tijdens het voorbereiden van tools, schakel
dan tracelogboekregistratie in en controleer op timingregels van
plugintoolfabrieken:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Zoek naar:

```text
[trace:plugin-tools] factory timings ...
```

Het overzicht vermeldt de totale fabriekstijd en de traagste
plugintoolfabrieken, inclusief plugin-id, gedeclareerde toolnamen, resultaatvorm
en of de tool optioneel is. Trage regels worden als waarschuwingen weergegeven
wanneer één fabriek minstens 1 seconde nodig heeft of de totale voorbereiding
van plugintoolfabrieken minstens 5 seconden duurt.

OpenClaw slaat succesvolle resultaten van plugintoolfabrieken in de cache op
voor herhaalde oplossingen met dezelfde effectieve aanvraagcontext. De
cachesleutel omvat de effectieve runtimeconfiguratie, werkruimte- en agent-id,
sandboxbeleid, browserinstellingen, afleveringscontext, identiteit van de
aanvrager en eigendomsstatus, zodat fabrieken die van deze vertrouwde velden
afhankelijk zijn opnieuw worden uitgevoerd wanneer de context verandert. Als de
timings hoog blijven, voert de plugin mogelijk kostbaar werk uit voordat deze de
tooldefinities retourneert.

Als één plugin de timing domineert, inspecteer dan de runtimeregistraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die plugin vervolgens bij, installeer deze opnieuw of schakel deze uit.
Pluginauteurs moeten het kostbare laden van afhankelijkheden naar het
uitvoeringspad van de tool verplaatsen in plaats van dit binnen de toolfabriek
uit te voeren.

Zie
[Oplossing van pluginafhankelijkheden](/nl/plugins/dependency-resolution) voor
hoofdmaplocaties van afhankelijkheden, validatie van pakketmetadata,
registervermeldingen, herlaadgedrag bij het opstarten en opschoning van
verouderde gegevens.

## Gerelateerd

- [Plugins beheren](/nl/plugins/manage-plugins) - opdrachtvoorbeelden voor weergeven, installeren, bijwerken, verwijderen en publiceren
- [`openclaw plugins`](/nl/cli/plugins) - volledige CLI-referentie
- [Pluginoverzicht](/nl/plugins/plugin-inventory) - gegenereerde lijst met gebundelde en externe plugins
- [Pluginreferentie](/nl/plugins/reference) - gegenereerde referentiepagina's per plugin
- [Communityplugins](/nl/plugins/community) - ontdekking via ClawHub en beleid voor documentatie-PR's
- [Oplossing van pluginafhankelijkheden](/nl/plugins/dependency-resolution) - installatiehoofdmaplocaties, registervermeldingen en runtimegrenzen
- [Plugins bouwen](/nl/plugins/building-plugins) - handleiding voor het ontwikkelen van native plugins
- [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview) - runtimeregistratie, hooks en API-velden
- [Pluginmanifest](/nl/plugins/manifest) - manifest- en pakketmetadata
