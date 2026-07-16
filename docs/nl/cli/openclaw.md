---
read_when:
    - Je hebt de inferentie-installatie voltooid en wilt dat OpenClaw de rest configureert
    - Je moet OpenClaw inspecteren of repareren met de lokale configuratieagent
    - Je ontwerpt of activeert de reddingsmodus voor berichtkanalen
summary: CLI-referentie en beveiligingsmodel voor de door inferentie ondersteunde OpenClaw-helper voor configuratie en herstel
title: OpenClaw-installatieagent
x-i18n:
    generated_at: "2026-07-16T15:37:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw wordt geleverd met een ingebouwde systeemagent — die spreekt als "OpenClaw" — voor
lokale installatie, reparatie en configuratie (voorheen Crestodian genoemd). Deze start pas nadat het effectieve standaardmodel een echte beurt heeft voltooid.
Bij nieuwe installaties wordt eerst inferentie ingesteld; ongeldige configuratie blijft het
klassieke doctor-pad volgen.

## Wanneer deze start

Het uitvoeren van `openclaw` zonder subopdracht kiest een route op basis van de configuratiestatus:

- Configuratie ontbreekt of bevat geen door de gebruiker opgegeven instellingen (leeg of alleen `$schema`-/`meta`-sleutels): start begeleide onboarding met live AI-verificatie.
- Configuratie bestaat maar slaagt niet voor validatie: start klassieke onboarding, die de problemen meldt en je doorverwijst naar `openclaw doctor`.
- Configuratie bestaat en is geldig: opent de normale agent-TUI. Een bereikbare
  geconfigureerde Gateway waarvan de standaardagent een model heeft, gaat rechtstreeks naar die UI
  zonder onboarding of OpenClaw. Gebruik `/openclaw` in de TUI of voer
  `openclaw setup` rechtstreeks uit om OpenClaw later te openen.

Bij het uitvoeren van `openclaw setup` wordt eerst het geconfigureerde standaardmodel live getest. Na een geslaagde beurt start OpenClaw. Bij een interactieve fout wordt de begeleide inferentie-installatie geopend en wordt de besturing aan OpenClaw overgedragen nadat een kandidaat slaagt. Eenmalige, JSON- en andere niet-interactieve verzoeken mislukken met instructies om `openclaw onboard` uit te voeren wanneer inferentie niet beschikbaar is. `openclaw --help` en `openclaw --version` behouden hun normale snelle paden.

Niet-interactief kaal `openclaw` (zonder TTY) wordt afgesloten met een kort bericht in plaats van de hoofdhulp af te drukken: het verwijst naar niet-interactieve onboarding bij een nieuwe of ongeldige installatie, of naar `openclaw agent --local ...` wanneer de configuratie geldig is.

`openclaw onboard --modern` blijft een compatibiliteitsalias voor OpenClaw, maar gebruikt dezelfde inferentiepoort: werkende inferentie opent de chat, interactieve fouten starten de begeleide inferentie-installatie en niet-interactieve fouten worden afgesloten met onboardingbegeleiding. `openclaw onboard --classic` opent de volledige stapsgewijze wizard.

## Wat OpenClaw toont

Interactieve OpenClaw opent dezelfde TUI-shell als `openclaw tui`, met een OpenClaw-chatbackend. De welkomsttekst bij het starten behandelt:

- de geldigheid van de configuratie en de standaardagent
- het geverifieerde model dat OpenClaw gebruikt
- de bereikbaarheid van de Gateway volgens de eerste controle bij het starten
- de volgende aanbevolen foutopsporingsactie

Er worden geen geheimen gedumpt en er worden niet alleen voor het starten CLI-opdrachten van plugins geladen.

Gebruik `status` voor de gedetailleerde inventaris: configuratiepad, documentatie-/bronpaden, lokale CLI-controles, aanwezigheid van sleutels/tokens, agents, model en Gateway-details.

OpenClaw gebruikt dezelfde referentiedetectie als reguliere agents: in een Git-checkout verwijst het naar lokale `docs/` en de bronstructuur; in een npm-installatie gebruikt het meegeleverde documentatie en verwijst het naar [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), met het advies de broncode te raadplegen wanneer de documentatie niet volstaat.

## Voorbeelden

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "modellen"
openclaw setup --message "configuratie valideren"
openclaw setup --message "werkruimte ~/Projects/work instellen" --yes
openclaw setup --message "standaardmodel instellen op openai/gpt-5.6" --yes
openclaw onboard --modern
```

In de OpenClaw-TUI:

```text
status
gezondheid
doctor
configuratie valideren
instellen
werkruimte ~/Projects/work instellen
configuratie gateway.port instellen op 19001
configuratiereferentie gateway.auth.token instellen op env OPENCLAW_GATEWAY_TOKEN
gatewaystatus
gateway herstarten
agents
agent work maken met werkruimte ~/Projects/work
modellen
modelprovider configureren
standaardmodel instellen op openai/gpt-5.6
kanalen
kanaalinformatie slack
slack verbinden
kanaalwizard voor slack openen
plugins weergeven
plugins zoeken slack
plugin installeren clawhub:openclaw-codex-app-server
met werkagent praten
met agent voor ~/Projects/work praten
audit
afsluiten
```

## Bewerkingen en goedkeuring

OpenClaw gebruikt getypeerde bewerkingen in plaats van de configuratie ad hoc te bewerken.

Alleen-lezenbewerkingen worden onmiddellijk uitgevoerd: overzicht tonen, agents weergeven, geïnstalleerde plugins weergeven, ClawHub-plugins zoeken, model-/backendstatus tonen, status-/gezondheidscontroles uitvoeren, bereikbaarheid van de Gateway controleren, doctor uitvoeren zonder interactieve reparaties, configuratie valideren en het pad naar het auditlogboek tonen.

Het starten van begeleide kanaalconfiguratie (`connect telegram`) wordt ook onmiddellijk uitgevoerd. De wizard verzamelt expliciete antwoorden en beheert de daaruit voortvloeiende schrijfbewerkingen.

Permanente bewerkingen vereisen goedkeuring in het gesprek (of `--yes` voor een directe opdracht): configuratie schrijven, `config set`, `config set-ref`, bootstrap voor installatie/onboarding, het standaardmodel wijzigen, de Gateway starten/stoppen/herstarten, agents maken en plugins installeren.

Doctor-reparaties zijn niet beschikbaar in OpenClaw, omdat ze de provider, authenticatie of inferentieroute van de standaardagent waarop de sessie draait, kunnen herschrijven. Sluit OpenClaw af en voer `openclaw doctor --fix` uit in een terminal. Alleen-lezen `doctor` blijft beschikbaar in OpenClaw.

Nieuwe agents nemen de live geverifieerde standaardinferentieroute over. De agent-id's `openclaw` en `crestodian` zijn gereserveerd voor de systeemagent en kunnen niet als normale agents worden gemaakt. De buiten gebruik gestelde id blijft geblokkeerd, zodat een oude configuratie deze niet kan claimen.

`config set` en `config set-ref` kunnen de status van de inferentieroute niet wijzigen,
waaronder referenties van de inferentieprovider, `auth.*` op het hoogste niveau, modelcatalogi,
CLI-backends, standaard-/agentspecifieke modelroutes, agentparameters/-tools of hoofd-`tools.*`.
Onbewerkte schrijfbewerkingen onder `env.*`, `secrets.*`, `plugins.*` en `$include`
worden eveneens geweigerd omdat ze de oplossing van referenties of activering van providers
kunnen vervangen. Gateway- en kanaalauthenticatie blijven normale configuratieoppervlakken. Gebruik getypeerde plugin-/kanaalworkflows en
`set default model <provider/model>` voor een reeds
geconfigureerde route; de route wordt live getest voordat deze wordt opgeslagen. Om provider-/authenticatietoegang te configureren of
te repareren, sluit je OpenClaw af en voer je `openclaw onboard` uit.

Het verwijderen van plugins wordt in OpenClaw geweigerd, omdat het verwijderen van een providerplugin
de inferentieroute waarop de sessie draait kan uitschakelen. Sluit OpenClaw
af en voer `openclaw plugins uninstall <id>` uit vanuit een terminal.

Goedkeuring geef je in je eigen woorden: ondubbelzinnige antwoorden ("ja", "zeker", "ga je gang", "nu niet") worden herkend aan de hand van een gesloten deterministische lijst. Wanneer de geconfigureerde route een afzonderlijke voltooiingsaanroep ondersteunt, kunnen andere antwoorden uitsluitend op basis van jouw bericht en het openstaande voorstel worden geclassificeerd — nooit door het gespreksmodel zelf, dat zichzelf niet kan goedkeuren. Niet-geclassificeerde of dubbelzinnige antwoorden laten het voorstel openstaan en in het gesprek wordt opnieuw om antwoord gevraagd.

Toegepaste schrijfbewerkingen worden vastgelegd in `~/.openclaw/audit/system-agent.jsonl`. Detectie wordt niet geaudit; alleen toegepaste bewerkingen en schrijfbewerkingen worden dat.

Kanaalconfiguratie kan als een gehost gesprek worden uitgevoerd totdat een geheim nodig is. De
lokale OpenClaw-TUI accepteert geen gevoelige wizardantwoorden, omdat
chatinvoer in de terminal zichtbaar is. Deze biedt onmiddellijk `open channel wizard` aan, waarbij
het geselecteerde kanaal wordt doorgegeven aan de afgeschermde terminalwizard; je kunt
`openclaw channels add --channel <channel>` ook later uitvoeren.

### Overschakelen naar afgeschermde kanaalconfiguratie

De lokale chat kan de besturing overdragen aan de afgeschermde kanaalwizard:

```text
kanaalwizard voor slack openen
kanaalinformatie slack
```

`open channel wizard for <channel>` opent afgeschermde kanaalconfiguratie nadat de chat-TUI
is gesloten. Gebruik eerst `channel info <channel>` voor het kanaallabel, de configuratiestatus,
een samenvatting van de vereisten en een link naar de documentatie.

OpenClaw wijzigt nooit provider-/authenticatietoegang vanuit zijn eigen sessie: de
sessie is al afhankelijk van die inferentieroute. Voor installatie of
reparatie van de modelprovider retourneert `configure model provider` begeleiding voor afsluiten/onboarding zonder
een wizard te starten of configuratie te schrijven. Sluit OpenClaw af en voer `openclaw
onboard` uit; onboarding bereidt de referenties voor en slaat alleen een route op die
een echte live beurt voltooit. Start OpenClaw opnieuw nadat onboarding is geslaagd.

## Installatiebootstrap

`setup` configureert de resterende werkruimte- en Gateway-status nadat begeleide onboarding de inferentie al heeft ingesteld. Deze schrijft alleen via getypeerde configuratiebewerkingen en vraagt eerst om goedkeuring.

```text
instellen
werkruimte ~/Projects/work instellen
```

`setup` behoudt het geverifieerde effectieve model. Deze configureert of
vervangt de inferentie niet.

Als inferentie ontbreekt of de live controle mislukt, sluit je OpenClaw af en voer je `openclaw onboard` uit. Begeleide onboarding detecteert geconfigureerde modellen, API-sleutels en geauthenticeerde lokale CLI's, vraagt elke kandidaat om een echt antwoord en slaat alleen een geslaagde route permanent op. OpenClaw start onmiddellijk na die grens en kan vervolgens de werkruimte, Gateway, kanalen, agents, plugins en andere optionele functies configureren.

De macOS-app slaat deze reeks volledig over wanneer deze een geconfigureerde Gateway
bereikt waarvan de standaardagent al een geconfigureerd model heeft; de normale agent-UI
wordt geopend.
Voor een nieuwe of onvolledige Gateway doorloopt de app de inferentiereeks via
de Gateway-methoden `openclaw.setup.detect` en `openclaw.setup.activate`:
detecteren vermeldt elke gevonden kandidaat-backend, activeren test één
kandidaat live (een echte voltooiing met "antwoord met OK") en slaat pas nadat de test slaagt alleen het model,
de referentie en de provider-/runtimestatus op die voor die route nodig zijn. De standaardwaarden voor werkruimte en Gateway blijven voor OpenClaw. Een niet-geslaagde kandidaat
wijzigt de configuratie nooit; de app doorloopt automatisch de reeks en biedt uiteindelijk
een handmatige sleutel-/tokenstap aan die wordt ingevuld vanuit de actieve
tekstinferentieproviderplugins van de Gateway. De geselecteerde provider beheert zijn startmodel
en configuratie, en de referentie wordt op dezelfde manier geverifieerd voordat deze wordt opgeslagen.

Codex-supervisie en andere optionele pluginfuncties blijven buiten deze
inferentieactiveringstransactie. Configureer ze pas nadat inferentie
werkt en OpenClaw is gestart; bestaand pluginbeleid en expliciete
uitsluitingen van supervisie blijven tijdens de inferentie-installatie ongewijzigd.

## AI-gesprek

Het vrije gesprek van interactieve OpenClaw loopt via dezelfde agentlus als reguliere OpenClaw-agents, beperkt tot één OpenClaw-bevoegdheidstool van ring nul, `openclaw`, die de getypeerde bewerkingen omvat. Leesacties worden vrij uitgevoerd, mutaties vereisen jouw goedkeuring in het gesprek voor precies die bewerking (zie Bewerkingen en goedkeuring), en elke toegepaste schrijfbewerking wordt geaudit en opnieuw gevalideerd. De agentsessie blijft behouden, zodat OpenClaw echt geheugen over meerdere beurten heeft. Als de geverifieerde inferentieroute later niet meer werkt, keer je terug naar `openclaw onboard` en repareer je deze voordat je doorgaat.

De host zet verzoeken in natuurlijke taal niet om in bewerkingen. Vrije
berichten — waaronder tekst die op opdrachten lijkt en vragen zoals "waarom is mijn
gateway gestopt?" — gaan naar de AI, die het verzoek via de tool
`openclaw` aan een getypeerde bewerking kan koppelen.

Wanneer een mutatie openstaat, worden alleen ondubbelzinnige goedkeurings- of afwijzingszinnen uit een
gesloten lijst zonder inferentie verwerkt. Dubbelzinnige instemming gaat naar een
afzonderlijke geconfigureerde voltooiingsaanroep en wordt anders veilig geweigerd. Gestructureerde
wizardvelden en exacte hostnavigatie zijn UI-bedieningselementen, geen verwerking van bewerkingen
in natuurlijke taal. Eén uitzondering voor de hygiëne van geheimen is bijzonder belangrijk: een
exacte `config set` op een gevoelig pad (tokens, sleutels, wachtwoorden) bereikt
nooit een model. De host maakt een geredigeerd voorstel en de waarde wordt afgeschermd in de
voor de AI zichtbare geschiedenis. Geef voor geheimen de voorkeur aan `config set-ref <path> env <ENV_VAR>`.

De herstelmodus voor berichtkanalen gebruikt nooit de modelondersteunde planner. Herstel op afstand blijft deterministisch, zodat een defect of gecompromitteerd normaal agentpad niet als configuratie-editor kan worden gebruikt.

### Vertrouwensmodel van het CLI-harnas

Ingebedde runtimes en de Codex-appserverharness dwingen de ring-zero-
beperking rechtstreeks af: de uitvoering bevat een OpenClaw-toegestane-toolslijst met alleen
de tool `openclaw`. Voor Codex schakelt OpenClaw voor die uitvoering ook omgevingen, native
uitvoering, multi-agent, doelen, apps/plugins, Skills/MCP, zoeken op het web en
`request_user_input`-oppervlakken uit. Codex injecteert nog steeds zijn inerte native hulpprogramma `update_plan`;
dit kan de tijdelijke checklist van het model bijwerken, maar kan geen bestanden
of OpenClaw-configuratie schrijven. CLI-harnassen gebruiken de toegestane-toolslijst van OpenClaw niet,
dus OpenClaw staat alleen backends toe waarvan het eigen contract voor toolselectie
dezelfde beperking kan bewijzen:

- Selecteerbare backends, waaronder Claude Code, starten met een lege selectie van native tools
  en één MCP-tool, `openclaw`. De gegenereerde MCP-configuratie van Claude wordt
  toegepast met `--strict-mcp-config`, zodat geen andere MCP-servers worden geladen.
- Backends die geen native tools declareren, krijgen dezelfde afzonderlijke OpenClaw-
  MCP-server.
- Backends met altijd actieve of onbekende native tools worden vóór inferentie veilig geweigerd; ze
  kunnen geen OpenClaw-sessie hosten.

Alleen OpenClaw-sessies krijgen de openclaw-MCP-server; normale agentuitvoeringen
zien deze tool nooit. Selecteerbare CLI-backends zonder native tools en modellen met API-sleutels
dwingen daarom de letterlijke lus met één tool af. Codex-appservermodellen dwingen
één OpenClaw-bevoegdheidstool plus het inerte native planningshulpprogramma af. In alle
drie gevallen blijven schrijfbewerkingen tijdens de installatie beperkt tot het gecontroleerde goedkeuringscontract
van OpenClaw.

Gemini CLI blijft beschikbaar voor normale agents, maar kan de
toolvrije probe die de inferentiegate vereist niet afdwingen en kan daarom OpenClaw niet hosten.

## Overschakelen naar een agent

Gebruik een selector in natuurlijke taal om OpenClaw te verlaten en de normale TUI te openen:

```text
praat met agent
praat met werkagent
schakel over naar hoofdagent
```

`openclaw tui`, `openclaw chat` en `openclaw terminal` openen de normale agent-TUI rechtstreeks; ze starten OpenClaw niet. Nadat je naar de normale TUI bent overgeschakeld, keer je met `/openclaw` terug naar OpenClaw, eventueel met een vervolgverzoek:

```text
/openclaw
/openclaw restart gateway
```

## Berichtreddingsmodus

De berichtreddingsmodus is het toegangspunt voor OpenClaw via berichtkanalen: gebruik deze wanneer je normale agent niet meer werkt, maar een vertrouwd kanaal (bijvoorbeeld WhatsApp) nog steeds opdrachten ontvangt.

Dit is een deterministische noodhandler voor opdrachten, niet de conversationele
OpenClaw-agent. Deze initialiseert geen nieuwe installatie en versoepelt de inferentiegate
voor OpenClaw-chat niet.

Ondersteunde opdracht: `/openclaw <request>`. Redding accepteert uitsluitend de exact getypte opdrachtsyntaxis — natuurlijke taal wordt met een aanwijzing afgewezen, nooit als een bewerking geïnterpreteerd, en er wordt nooit een model geraadpleegd.

```text
Jij, in een vertrouwd privébericht van de eigenaar: /openclaw status
OpenClaw: OpenClaw-reddingsmodus. Gateway bereikbaar: nee. Configuratie geldig: nee.
Jij: /openclaw restart gateway
OpenClaw: Plan: de Gateway opnieuw starten. Antwoord /openclaw yes om toe te passen.
Jij: /openclaw yes
OpenClaw: Toegepast. Auditvermelding geschreven.
```

Het maken van een agent kan ook lokaal of via redding in de wachtrij worden geplaatst:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

Bij het maken van een agent mag alleen het huidige live geverifieerde standaardmodel worden genoemd. Laat het
model weg om die route over te nemen.

Redding op afstand is een beheerdersoppervlak en moet worden behandeld als configuratieherstel op afstand, niet als normale chat.

Beveiligingscontract voor redding op afstand:

- Uitgeschakeld wanneer sandboxing actief is voor de agent/sessie; OpenClaw weigert redding op afstand en verwijst naar lokaal herstel via de CLI.
- De standaard effectieve status is `auto`: sta redding op afstand alleen toe bij vertrouwde YOLO-uitvoering, waarbij de runtime al lokale bevoegdheid zonder sandbox heeft (`tools.exec.security` wordt omgezet in `full` en `tools.exec.ask` wordt omgezet in `off`, met sandboxmodus `off`).
- Vereist een expliciete eigenaarsidentiteit; geen jokerregels voor afzenders, open groepsbeleid, niet-geverifieerde webhooks of anonieme kanalen.
- Standaard alleen privéberichten van de eigenaar; redding via groepen/kanalen vereist expliciete inschakeling.
- Plugin zoeken en weergeven zijn alleen-lezen. Plugininstallatie is altijd uitsluitend lokaal (geblokkeerd in de reddingsmodus, zelfs wanneer deze anders is ingeschakeld), omdat hiermee uitvoerbare code wordt gedownload. Het verwijderen van een Plugin wordt zowel in lokale OpenClaw als in de reddingsmodus geweigerd; voer `openclaw plugins uninstall <id>` uit vanuit een terminal.
- Redding op afstand kan de lokale TUI niet openen of overschakelen naar een interactieve agentsessie; gebruik lokaal `openclaw` voor overdracht aan een agent.
- Permanente schrijfbewerkingen vereisen nog steeds goedkeuring, ook in de reddingsmodus.
- Openstaande goedkeuringen zijn eenmalig. Elke nieuwere reddingsopdracht voor hetzelfde account, kanaal en dezelfde afzender trekt het oudere plan in; een mislukte uitvoering verbruikt de goedkeuring ook, dus verzend de opdracht opnieuw om het opnieuw te proberen.
- Elke toegepaste reddingsbewerking wordt gecontroleerd. Redding via berichtkanalen registreert metadata over kanaal, account, afzender en bronadres; bewerkingen die de configuratie wijzigen, registreren ook configuratiehashes van vóór en na de wijziging.
- Geheimen worden nooit weergegeven. SecretRef-inspectie rapporteert beschikbaarheid, niet de waarden.
- Als de Gateway actief is, geeft redding de voorkeur aan getypeerde Gateway-bewerkingen; als deze niet actief is, gebruikt redding alleen het minimale lokale hersteloppervlak dat niet afhankelijk is van de normale agentlus.

Configuratiestructuur:

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (standaard) staat redding alleen toe wanneer de effectieve runtime YOLO is en sandboxing uitstaat; `false` staat redding via berichtkanalen nooit toe; `true` staat redding expliciet toe wanneer de controles van eigenaar/kanaal slagen (nog steeds onderworpen aan de weigering wegens sandboxing).
- `ownerDmOnly`: beperk redding tot rechtstreekse privéberichten van de eigenaar. Standaard `true`.
- `pendingTtlMinutes`: hoelang een openstaande schrijfbewerking voor redding beschikbaar blijft voor goedkeuring via `/openclaw yes` voordat deze verloopt. Standaard `15`.

`openclaw doctor --fix` migreert het verouderde configuratieblok `crestodian` naar
`systemAgent`. De runtime leest alleen het canonieke blok.

Redding op afstand wordt gedekt door de Docker-lane:

```bash
pnpm test:docker:system-agent-rescue
```

Een optionele live smoke-test van het opdrachtoppervlak van het kanaal controleert `/openclaw status` plus een permanente goedkeuringsrondgang via de reddingshandler:

```bash
pnpm test:live:system-agent-rescue-channel
```

Door inferentie begrensde verpakte eenmalige installatie wordt gedekt door:

```bash
pnpm test:docker:system-agent-first-run
```

Die lane voor de verpakte CLI begint met een lege statusmap en bewijst dat OpenClaw
zonder inferentie veilig weigert. Vervolgens test en activeert deze een nagebootste Claude via
de verpakte activeringsmodule. Pas daarna bereikt een vaag verzoek de
planner en wordt het omgezet in een getypeerde installatie, gevolgd door eenmalige opdrachten die een
extra agent maken, Discord configureren via het inschakelen van een Plugin plus een SecretRef
voor het token, de configuratie valideren en het auditlogboek controleren. Deze lane levert ondersteunend
bewijs voor de gate/bewerkingen; deze test geen interactieve onboarding of het
gesprek tussen de OpenClaw-agent, tools en goedkeuringen. Het onderstaande QA Lab-scenario verwijst
naar dezelfde Docker-lane:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/cli/doctor)
- [TUI](/nl/cli/tui)
- [Sandbox](/nl/cli/sandbox)
- [Beveiliging](/nl/cli/security)
