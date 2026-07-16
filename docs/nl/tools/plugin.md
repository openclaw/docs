---
doc-schema-version: 1
read_when:
    - Plugins installeren of configureren
    - Inzicht in regels voor het detecteren en laden van plugins
    - Werken met Codex-/Claude-compatibele pluginbundels
sidebarTitle: Getting Started
summary: OpenClaw-plugins installeren, configureren en beheren
title: Plugins
x-i18n:
    generated_at: "2026-07-16T16:30:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met kanalen, modelproviders, agentharnassen, tools,
Skills, spraak, realtime transcriptie, stem, mediabegrip, generatie,
webophaling, zoeken op het web en andere runtimemogelijkheden.

Gebruik deze pagina om een Plugin te installeren, de Gateway opnieuw te starten, te controleren
of deze door de runtime is geladen en veelvoorkomende installatiefouten op te lossen. Zie voor voorbeelden met alleen opdrachten
[Plugins beheren](/nl/plugins/manage-plugins). Zie voor de gegenereerde inventaris van
meegeleverde, officiële externe en uitsluitend als bron beschikbare Plugins
[Plugininventaris](/nl/plugins/plugin-inventory).

## Vereisten

- een checkout of installatie van OpenClaw waarin de `openclaw` CLI beschikbaar is
- netwerktoegang tot de geselecteerde bron (ClawHub, npm of een git-host)
- alle Pluginspecifieke referenties, configuratiesleutels of besturingssysteemtools die in de
  installatiedocumentatie van die Plugin worden genoemd
- toestemming om de Gateway die je kanalen bedient opnieuw te laden of te starten

## Snel aan de slag

<Steps>
  <Step title="De Plugin zoeken">
    Zoek in [ClawHub](/clawhub) naar openbare Pluginpakketten:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub is het primaire ontdekkingsplatform voor communityplugins. Tijdens de
    overgang bij de lancering worden gewone kale pakketspecificaties nog steeds vanaf npm geïnstalleerd, tenzij
    ze overeenkomen met een officiële Plugin-id. Onbewerkte `@openclaw/*`-specificaties die overeenkomen met een
    meegeleverde Plugin worden naar die meegeleverde kopie omgezet. Gebruik een expliciet bronvoorvoegsel
    wanneer je specifiek één bron nodig hebt.

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

    Behandel Plugininstallaties alsof je code uitvoert. Geef voor
    reproduceerbare productie-installaties de voorkeur aan vastgezette versies. ClawHub-pakketten en de
    meegeleverde/officiële catalogus van OpenClaw zijn vertrouwde bronnen. Nieuwe willekeurige npm-, git-,
    lokale pad-/archief-, `npm-pack:`- of marketplacebronnen vereisen
    `--force` bij niet-interactieve installaties nadat je
    de bron hebt beoordeeld en vertrouwt.

  </Step>

  <Step title="De Plugin configureren en inschakelen">
    Configureer Pluginspecifieke instellingen onder `plugins.entries.<id>.config`.
    Schakel de Plugin in als deze nog niet is ingeschakeld:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Als `plugins.allow` is ingesteld, moet de geïnstalleerde Plugin-id in die lijst staan
    voordat de Plugin kan worden geladen. `openclaw plugins install` voegt de geïnstalleerde
    id toe aan een bestaande `plugins.allow`-lijst en verwijdert dezelfde id uit
    `plugins.deny`, zodat de expliciete installatie na opnieuw starten kan worden geladen.

  </Step>

  <Step title="De Gateway opnieuw laten laden">
    Voor het installeren, bijwerken of verwijderen van Plugincode moet de Gateway
    opnieuw worden gestart. Een beheerde Gateway waarvoor het opnieuw laden van configuratie is ingeschakeld, detecteert de gewijzigde
    Plugininstallatieregistratie en start automatisch opnieuw. Start deze anders
    zelf opnieuw:

    ```bash
    openclaw gateway restart
    ```

    In-/uitschakelen werkt de configuratie en het koude register bij. Een runtime-inspectie is
    nog steeds het duidelijkste bewijs van actieve runtime-oppervlakken.

  </Step>

  <Step title="Runtimeregistratie verifiëren">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Gebruik `--runtime` om geregistreerde tools, hooks, services, Gateway-
    methoden of CLI-opdrachten van de Plugin aan te tonen. Gewoon `inspect` is uitsluitend een koude manifest-
    en registercontrole.

  </Step>
</Steps>

## Configuratie

### Een installatiebron kiezen

| Bron        | Gebruiken wanneer                                                                | Voorbeeld                                                       |
| ----------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| ClawHub     | Je OpenClaw-eigen ontdekking, scans, versiemetadata en installatietips wilt     | `openclaw plugins install clawhub:<package>`                   |
| npm         | Je rechtstreekse npm-register- of dist-tagworkflows nodig hebt                  | `openclaw plugins install npm:<package>`                       |
| git         | Je een branch, tag of commit uit een repository nodig hebt                      | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaal pad  | Je op dezelfde machine een Plugin ontwikkelt of test                            | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Je een Claude-compatibele marketplace-Plugin installeert                        | `openclaw plugins install <plugin> --marketplace <source>`     |

Kale pakketspecificaties vertonen bijzonder compatibiliteitsgedrag: een kale naam die
overeenkomt met een meegeleverde Plugin-id gebruikt die meegeleverde bron; een kale naam die overeenkomt
met een officiële externe Plugin-id gebruikt de officiële pakketcatalogus; elke andere
kale specificatie wordt tijdens de overgang bij de lancering via npm geïnstalleerd. Onbewerkte `@openclaw/*`-
specificaties die overeenkomen met meegeleverde Plugins worden vóór de npm-
terugval ook naar de meegeleverde kopie omgezet. Gebruik `npm:@openclaw/<plugin>@<version>` om bewust het
externe npm-pakket te installeren in plaats van de meegeleverde kopie. Gebruik `clawhub:`, `npm:`,
`git:` of `npm-pack:` voor deterministische bronselectie. Zie
[`openclaw plugins`](/nl/cli/plugins#install) voor het volledige opdrachtcontract.

Bij npm-installaties kiezen niet-vastgezette specificaties en `@latest` het nieuwste stabiele
pakket dat compatibiliteit met deze OpenClaw-build aangeeft. Als de
huidige nieuwste release van npm een nieuwere `openclaw.compat.pluginApi` of
`openclaw.install.minHostVersion` declareert dan door deze build wordt ondersteund, scant OpenClaw
oudere stabiele versies en installeert het de nieuwste passende versie. Exacte versies
en expliciete kanaaltags zoals `@beta` blijven vastgezet op het geselecteerde pakket
en mislukken bij incompatibiliteit.

### Installatiebeleid voor beheerders

Configureer `security.installPolicy` om een vertrouwde lokale beleidsopdracht uit te voeren
voordat een Plugininstallatie of -update doorgaat. Het beleid ontvangt metadata plus
het voorbereide bronpad en kan de installatie toestaan of blokkeren. Het geldt voor zowel CLI-
als door de Gateway ondersteunde installatie-/updatepaden. Pluginhooks van het type `before_install` worden
later uitgevoerd, en alleen in OpenClaw-processen waarin Pluginhooks zijn geladen; gebruik daarom
in plaats daarvan `security.installPolicy` voor installatiebeslissingen van de beheerder. De
afgeschreven vlag `--dangerously-force-unsafe-install` wordt voor
compatibiliteit geaccepteerd, maar doet niets: deze omzeilt noch het installatiebeleid, noch de
ingebouwde weigerlijst van OpenClaw voor Pluginafhankelijkheden.

Zie [Skills-configuratie](/nl/tools/skills-config#operator-install-policy-securityinstallpolicy)
voor het gedeelde `security.installPolicy`-uitvoerschema dat door zowel Skills als
Plugins wordt gebruikt.

### Pluginbeleid configureren

De gebruikelijke vorm van Pluginconfiguratie is:

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

- `plugins.enabled: false` schakelt alle Plugins uit en slaat ontdekking/laadwerk
  over. Verouderde Pluginverwijzingen blijven inert zolang dit actief is; schakel
  Plugins opnieuw in voordat je opschoning met doctor uitvoert als je verouderde id's wilt verwijderen.
- `plugins.deny` heeft voorrang op toestaan en inschakeling per Plugin.
- `plugins.allow` is een exclusieve toelatingslijst. Tools van Plugins buiten de
  toelatingslijst blijven onbeschikbaar, zelfs wanneer `tools.allow` `"*"` bevat.
- `plugins.entries.<id>.enabled: false` schakelt één Plugin uit maar behoudt de
  configuratie ervan.
- `plugins.load.paths` voegt expliciete lokale Pluginbestanden of -mappen toe.
  Beheerde lokale paden van `plugins install` moeten Pluginmappen of
  archieven zijn; gebruik `plugins.load.paths` voor zelfstandige Pluginbestanden.
- Plugins die uit de werkruimte afkomstig zijn, zijn standaard uitgeschakeld; schakel ze expliciet in of
  voeg ze aan de toelatingslijst toe voordat je lokale werkruimtecode gebruikt.
- Meegeleverde Plugins volgen hun ingebouwde metadata voor standaard aan/uit,
  tenzij dit expliciet door de configuratie wordt overschreven.
- `plugins.slots.<slot>` (`memory` of `contextEngine`) kiest één Plugin voor een
  exclusieve categorie. Sleufselectie geldt als expliciete activering en
  schakelt de geselecteerde Plugin gedwongen in voor die sleuf, zelfs als deze anders
  expliciet ingeschakeld zou moeten worden. `plugins.deny` en `plugins.entries.<id>.enabled: false` blokkeren
  deze nog steeds.
- Meegeleverde opt-in-Plugins kunnen automatisch worden geactiveerd wanneer de configuratie een van hun
  eigen oppervlakken noemt, zoals een provider-/modelreferentie, kanaalconfiguratie, CLI-backend
  of runtime van een agentharnas.
- Codex-routering binnen de OpenAI-familie houdt de grenzen tussen provider- en runtime-Plugins
  gescheiden: verouderde Codex-modelreferenties zijn verouderde configuratie die doctor herstelt,
  terwijl de meegeleverde `codex`-Plugin eigenaar is van de Codex-appserverruntime voor
  canonieke `openai/*`-agentreferenties, expliciete `agentRuntime.id: "codex"` en
  verouderde `codex/*`-referenties.

Wanneer `plugins.allow` niet is ingesteld en niet-meegeleverde Plugins automatisch worden ontdekt vanuit
de werkruimte of algemene Pluginhoofdmappen, registreert het opstartproces
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
met de ontdekte Plugin-id's en, voor korte lijsten, een minimale `plugins.allow`-
snippet. Voer [`openclaw plugins list --enabled --verbose`](/nl/cli/plugins#list)
of [`openclaw plugins inspect <id>`](/nl/cli/plugins#inspect) uit voor de vermelde
Plugin-id voordat je vertrouwde Plugins naar `openclaw.json` kopieert. Dezelfde
vertrouwensvastzetting geldt wanneer diagnostiek meldt dat een Plugin is geladen
`without install/load-path provenance`: inspecteer die Plugin-id en zet deze vervolgens vast in
`plugins.allow`, of installeer opnieuw vanuit een vertrouwde bron zodat OpenClaw de herkomst van de
installatie registreert.

Voer `openclaw doctor` of `openclaw doctor --fix` uit wanneer configuratievalidatie
verouderde Plugin-id's, mismatches tussen toelatingslijst en tools, of verouderde paden van meegeleverde Plugins
meldt.

## Pluginindelingen begrijpen

OpenClaw herkent twee Pluginindelingen:

| Indeling                 | Hoe deze wordt geladen                                                        | Gebruiken wanneer                                                        |
| ------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Systeemeigen OpenClaw-Plugin | `openclaw.plugin.json` plus een runtimemodule die in het proces wordt geladen | Je OpenClaw-specifieke runtimemogelijkheden installeert of bouwt         |
| Compatibele bundel       | Codex-, Claude- of Cursor-Pluginindeling toegewezen aan de OpenClaw-Plugininventaris | Je compatibele Skills, opdrachten, hooks of bundelmetadata hergebruikt |

Beide indelingen verschijnen in `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` en `openclaw plugins disable`. Zie
[Pluginbundels](/nl/plugins/bundles) voor de compatibiliteitsgrens van bundels en
[Plugins bouwen](/nl/plugins/building-plugins) voor het ontwikkelen van systeemeigen Plugins.

## Pluginhooks

Plugins kunnen tijdens runtime hooks registreren via twee verschillende API's:

- `api.on(...)` getypeerde hooks voor gebeurtenissen in de runtimelevenscyclus. Dit is het
  voorkeursoppervlak voor middleware, beleid, het herschrijven van berichten, het
  vormgeven van prompts en toolbeheer.
- `api.registerHook(...)` voor het interne hooksysteem dat wordt beschreven in
  [Hooks](/nl/automation/hooks). Dit is voornamelijk bedoeld voor globale neveneffecten van opdrachten/de levenscyclus
  en compatibiliteit met bestaande automatisering in HOOK-stijl.

Vuistregel: als de handler prioriteit, samenvoegingssemantiek of
blokkeer-/annuleergedrag nodig heeft, gebruik je getypeerde hooks. Als deze alleen reageert op `command:new`,
`command:reset`, `message:sent` of vergelijkbare globale gebeurtenissen, is `api.registerHook`
geschikt.

Door Plugins beheerde interne hooks verschijnen in `openclaw hooks list` met
`plugin:<id>`. Je kunt ze niet inschakelen of uitschakelen via `openclaw hooks`;
schakel in plaats daarvan de Plugin in of uit.

## De actieve Gateway verifiëren

`openclaw plugins list` en gewone `openclaw plugins inspect` lezen koude configuratie-, manifest- en registerstatus. Ze bewijzen niet dat een reeds actieve Gateway dezelfde plugincode heeft geïmporteerd.

Wanneer een plugin geïnstalleerd lijkt, maar live chatverkeer deze niet gebruikt:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Beheerde Gateways worden automatisch opnieuw gestart na installatie-, update- en verwijderingswijzigingen van plugins die de pluginbron wijzigen. Zorg er bij VPS- of containerinstallaties voor dat een handmatige herstart gericht is op het daadwerkelijke onderliggende proces `openclaw gateway run` dat je kanalen bedient, en niet alleen op een wrapper of supervisor.

## Probleemoplossing

| Symptoom                                                        | Controle                                                                                                                                      | Oplossing                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin verschijnt in `plugins list`, maar runtime-hooks worden niet uitgevoerd  | Gebruik `openclaw plugins inspect <id> --runtime --json` en bevestig de actieve Gateway met `gateway status --deep --require-rpc`             | Start de live Gateway opnieuw na wijzigingen aan installatie, update, configuratie of bron                               |
| Diagnostiek over dubbel eigenaarschap van kanalen of tools verschijnt         | Voer `openclaw plugins list --enabled --verbose` uit, inspecteer elke verdachte plugin met `--runtime --json` en vergelijk het eigenaarschap van kanalen/tools | Schakel één eigenaar uit, verwijder verouderde installaties of gebruik manifest-`preferOver` voor opzettelijke vervanging      |
| Configuratie meldt dat een plugin ontbreekt                                | Controleer in [Plugininventaris](/nl/plugins/plugin-inventory) of deze gebundeld, officieel extern of alleen als bron beschikbaar is                           | Installeer het externe pakket, schakel de gebundelde plugin in of verwijder verouderde configuratie                         |
| Configuratie is ongeldig tijdens de installatie                               | Lees het validatiebericht en voer `openclaw doctor --fix` uit als het naar verouderde pluginstatus verwijst                                             | Doctor kan ongeldige pluginconfiguratie in quarantaine plaatsen door de vermelding uit te schakelen en de ongeldige payload te verwijderen     |
| Pluginpad wordt geblokkeerd vanwege verdacht eigenaarschap of verdachte machtigingen | Inspecteer de diagnostiek vóór de configuratiefout                                                                                             | Herstel het eigenaarschap/de machtigingen van het bestandssysteem en voer daarna `openclaw plugins registry --refresh` uit                    |
| `OPENCLAW_NIX_MODE=1` blokkeert levenscyclusopdrachten                | Bevestig dat de installatie door Nix wordt beheerd                                                                                                      | Wijzig de pluginselectie in de Nix-bron in plaats van pluginmutatieopdrachten te gebruiken                      |
| Importeren van afhankelijkheid mislukt tijdens runtime                             | Controleer of de plugin via npm/git/ClawHub is geïnstalleerd of vanuit een lokaal pad is geladen                                                 | Voer `openclaw plugins update <id>` uit, installeer de bron opnieuw of installeer zelf de lokale pluginafhankelijkheden |

Wanneer verouderde pluginconfiguratie nog steeds een niet langer vindbare kanaalplugin vermeldt, verlaagt configuratievalidatie die kanaalsleutel van een harde fout naar een waarschuwing, zodat het opstarten van de Gateway alle andere kanalen nog steeds kan bedienen. Voer `openclaw doctor --fix` uit om verouderde plugin- en kanaalvermeldingen te verwijderen. Onbekende kanaalsleutels zonder bewijs van een verouderde plugin blijven validatie afkeuren, zodat typefouten zichtbaar blijven.

Voor opzettelijke kanaalvervanging moet de voorkeursplugin `channelConfigs.<channel-id>.preferOver` declareren met de oude plugin-id of de plugin-id met lagere prioriteit. Als beide plugins expliciet zijn ingeschakeld, respecteert OpenClaw dat verzoek en meldt het diagnostiek over dubbel eigenaarschap van kanalen/tools in plaats van stilzwijgend één eigenaar te kiezen.

Als een geïnstalleerd pakket meldt dat het `requires compiled runtime output for
TypeScript entry ...`, is het pakket gepubliceerd zonder de JavaScript-bestanden die OpenClaw tijdens runtime nodig heeft. Werk het pakket bij of installeer het opnieuw nadat de uitgever gecompileerd JavaScript beschikbaar heeft gesteld, of schakel de plugin tot die tijd uit of verwijder deze.

### Geblokkeerd eigenaarschap van pluginpad

Als de diagnostiek `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` meldt en validatie wordt gevolgd door `plugin present but blocked`, heeft OpenClaw pluginbestanden gevonden die eigendom zijn van een andere Unix-gebruiker dan het proces dat ze laadt. Laat de pluginconfiguratie staan; herstel het eigenaarschap van het bestandssysteem of voer OpenClaw uit als dezelfde gebruiker die eigenaar is van de statusmap.

Voor Docker-installaties wordt de officiële image uitgevoerd als `node` (uid `1000`), dus de vanaf de host gekoppelde OpenClaw-configuratie- en werkruimtemappen moeten normaal gesproken eigendom zijn van uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Als je OpenClaw opzettelijk als root uitvoert, herstel je in plaats daarvan het eigenaarschap van de beheerde pluginroot naar root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Voer na het herstellen van het eigenaarschap `openclaw doctor --fix` of `openclaw plugins registry --refresh` opnieuw uit, zodat het opgeslagen pluginregister overeenkomt met de herstelde bestanden.

### Trage instelling van plugintools

Als agentbeurten lijken vast te lopen tijdens het voorbereiden van tools, schakel dan trace-logging in en controleer op timingregels van plugintoolfabrieken:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Zoek naar:

```text
[trace:plugin-tools] factory timings ...
```

Het overzicht vermeldt de totale fabriekstijd en de traagste plugintoolfabrieken, inclusief plugin-id, gedeclareerde toolnamen, resultaatvorm en of de tool optioneel is. Trage regels worden waarschuwingen wanneer één fabriek ten minste 1s nodig heeft of de totale voorbereiding van plugintoolfabrieken ten minste 5s duurt.

OpenClaw bewaart succesvolle resultaten van plugintoolfabrieken in de cache voor herhaalde resoluties met dezelfde effectieve aanvraagcontext. De cachesleutel omvat de effectieve runtimeconfiguratie, werkruimte- en agent-id, sandboxbeleid, browserinstellingen, leveringscontext, identiteit van de aanvrager en eigendomsstatus, zodat fabrieken die afhankelijk zijn van deze vertrouwde velden opnieuw worden uitgevoerd wanneer de context verandert. Als de timings hoog blijven, voert de plugin mogelijk kostbaar werk uit voordat de tooldefinities worden geretourneerd.

Als één plugin de timing domineert, inspecteer dan de runtimeregistraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die plugin vervolgens bij, installeer deze opnieuw of schakel deze uit. Pluginauteurs moeten het kostbare laden van afhankelijkheden verplaatsen naar het uitvoeringspad van de tool in plaats van dit binnen de toolfabriek uit te voeren.

Zie [Resolutie van pluginafhankelijkheden](/nl/plugins/dependency-resolution) voor afhankelijkheidsroots, validatie van pakketmetadata, registervermeldingen, herlaadgedrag bij het opstarten en opschoning van verouderde gegevens.

## Gerelateerd

- [Plugins beheren](/nl/plugins/manage-plugins) - opdrachtvoorbeelden voor weergeven, installeren, bijwerken, verwijderen en publiceren
- [`openclaw plugins`](/nl/cli/plugins) - volledige CLI-referentie
- [Plugininventaris](/nl/plugins/plugin-inventory) - gegenereerde lijst met gebundelde en externe plugins
- [Pluginreferentie](/nl/plugins/reference) - gegenereerde referentiepagina's per plugin
- [Communityplugins](/nl/plugins/community) - ClawHub-ontdekking en beleid voor documentatie-PR's
- [Resolutie van pluginafhankelijkheden](/nl/plugins/dependency-resolution) - installatieroots, registervermeldingen en runtimegrenzen
- [Plugins bouwen](/nl/plugins/building-plugins) - handleiding voor het ontwikkelen van native plugins
- [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview) - runtimeregistratie, hooks en API-velden
- [Pluginmanifest](/nl/plugins/manifest) - manifest- en pakketmetadata
