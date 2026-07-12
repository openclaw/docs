---
read_when:
    - Je hebt de inferentie ingesteld en wilt dat Crestodian de rest configureert
    - Je moet OpenClaw inspecteren of repareren met de lokale installatieagent
    - U ontwerpt of activeert de reddingsmodus voor berichtenkanalen
summary: CLI-referentie en beveiligingsmodel voor de door inferentie ondersteunde Crestodian-hulp voor installatie en herstel
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T08:40:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Conversational Crestodian is de lokale agent van OpenClaw voor installatie, reparatie en configuratie. Deze start pas nadat het effectieve standaardmodel een echte beurt heeft voltooid. Bij nieuwe installaties wordt eerst inferentie ingesteld; ongeldige configuratie blijft het klassieke doctor-traject volgen.

## Wanneer deze start

Wanneer `openclaw` zonder subopdracht wordt uitgevoerd, wordt de route bepaald op basis van de configuratiestatus:

- Configuratie ontbreekt of bestaat zonder door de gebruiker opgegeven instellingen (leeg of met alleen de sleutels `$schema`/`meta`): start begeleide onboarding met live AI-verificatie.
- Configuratie bestaat maar slaagt niet voor validatie: start klassieke onboarding, die de problemen meldt en u doorverwijst naar `openclaw doctor`.
- Configuratie bestaat en is geldig: opent de normale agent-TUI. Een bereikbare, geconfigureerde Gateway waarvan de standaardagent een model heeft, gaat rechtstreeks naar die gebruikersinterface zonder onboarding of Crestodian. Gebruik later `/crestodian` in de TUI of voer rechtstreeks `openclaw crestodian` uit om Crestodian te openen.

`openclaw crestodian` test eerst live het geconfigureerde standaardmodel. Na een geslaagde beurt start Crestodian. Bij een interactieve fout wordt de begeleide inferentieconfiguratie geopend en wordt na het slagen van een kandidaat overgeschakeld naar Crestodian. Eenmalige, JSON- en andere niet-interactieve verzoeken mislukken met instructies om `openclaw onboard` uit te voeren wanneer inferentie niet beschikbaar is. `openclaw --help` en `openclaw --version` behouden hun normale snelle paden.

Niet-interactief kaal `openclaw` (zonder TTY) sluit af met een kort bericht in plaats van de hoofdhulp weer te geven: het verwijst naar niet-interactieve onboarding bij een nieuwe of ongeldige installatie, of naar `openclaw agent --local ...` wanneer de configuratie geldig is.

`openclaw onboard --modern` blijft een compatibiliteitsalias voor Crestodian, maar gebruikt dezelfde inferentiecontrole: werkende inferentie opent de chat, interactieve fouten starten begeleide inferentieconfiguratie en niet-interactieve fouten sluiten af met onboardinginstructies. `openclaw onboard --classic` opent de volledige stapsgewijze wizard.

## Wat Crestodian toont

Interactieve Crestodian opent dezelfde TUI-shell als `openclaw tui`, met een Crestodian-chatbackend. De begroeting bij het opstarten behandelt:

- de geldigheid van de configuratie en de standaardagent
- het geverifieerde model dat Crestodian gebruikt
- de bereikbaarheid van de Gateway volgens de eerste controle bij het opstarten
- de volgende aanbevolen foutopsporingsactie

Er worden geen geheimen gedumpt en er worden niet alleen voor het opstarten CLI-opdrachten van plugins geladen.

Gebruik `status` voor de gedetailleerde inventaris: configuratiepad, documentatie-/bronpaden, lokale CLI-controles, aanwezigheid van sleutels/tokens, agents, model en Gateway-gegevens.

Crestodian gebruikt dezelfde referentiedetectie als gewone agents: in een Git-checkout verwijst deze naar de lokale map `docs/` en de bronstructuur; in een npm-installatie gebruikt deze de meegeleverde documentatie en verwijst deze naar [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), met het advies de broncode te raadplegen wanneer de documentatie niet volstaat.

## Voorbeelden

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

In de Crestodian-TUI:

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Bewerkingen en goedkeuring

Crestodian gebruikt getypeerde bewerkingen in plaats van de configuratie ad hoc te bewerken.

Alleen-lezenbewerkingen worden onmiddellijk uitgevoerd: overzicht tonen, agents weergeven, geïnstalleerde plugins weergeven, ClawHub-plugins zoeken, model-/backendstatus tonen, status-/statuscontroles uitvoeren, bereikbaarheid van de Gateway controleren, doctor zonder interactieve reparaties uitvoeren, configuratie valideren en het pad naar het auditlogboek tonen.

Het starten van begeleide kanaalconfiguratie (`connect telegram`) wordt eveneens onmiddellijk uitgevoerd. De wizard verzamelt expliciete antwoorden en beheert de resulterende schrijfbewerkingen.

Permanente bewerkingen vereisen goedkeuring in het gesprek (of `--yes` voor een rechtstreekse opdracht): configuratie schrijven, `config set`, `config set-ref`, installatie-/onboardinginitialisatie, het standaardmodel wijzigen, de Gateway starten/stoppen/herstarten, agents maken en plugins installeren.

Doctor-reparaties zijn niet beschikbaar in Crestodian, omdat ze de provider-, authenticatie- of inferentieroute van de standaardagent kunnen herschrijven waarop de sessie draait. Sluit Crestodian af en voer `openclaw doctor --fix` uit in een terminal. Alleen-lezen `doctor` blijft beschikbaar in Crestodian.

Nieuwe agents nemen de live geverifieerde standaardinferentieroute over. De agent-id `crestodian` is gereserveerd voor de bevoorrechte virtuele beheerder en kan niet als normale agent worden gemaakt.

`config set` en `config set-ref` kunnen de status van de inferentieroute niet wijzigen,
waaronder referenties van de inferentieprovider, `auth.*` op het hoogste niveau, modelcatalogi,
CLI-backends, standaard-/agentspecifieke modelroutes, agentparameters/-hulpmiddelen of `tools.*`
in de hoofdstructuur. Onbewerkte schrijfbewerkingen onder `env.*`, `secrets.*`, `plugins.*` en `$include`
worden ook geweigerd, omdat ze de verwerking van referenties of de activering van providers
kunnen vervangen. Gateway- en kanaalauthenticatie blijven normale configuratieonderdelen. Gebruik getypeerde plugin-/kanaalworkflows en
`set default model <provider/model>` voor een reeds
geconfigureerde route; de route wordt live getest voordat deze wordt opgeslagen. Sluit Crestodian af en voer `openclaw onboard` uit om
provider-/authenticatietoegang te configureren of te repareren.

Het verwijderen van een Plugin wordt in Crestodian geweigerd, omdat het verwijderen van een providerplugin
de inferentieroute waarop de sessie draait kan uitschakelen. Sluit Crestodian af
en voer `openclaw plugins uninstall <id>` uit vanuit een terminal.

U geeft goedkeuring in uw eigen woorden: ondubbelzinnige antwoorden ("ja", "zeker", "ga door", "nu niet") worden verwerkt aan de hand van een gesloten, deterministische lijst. Wanneer de geconfigureerde route een afzonderlijke voltooiingsaanroep ondersteunt, kunnen andere antwoorden uitsluitend op basis van uw bericht en het openstaande voorstel worden geclassificeerd — nooit door het gespreksmodel zelf, dat zichzelf niet kan goedkeuren. Niet-geclassificeerde of dubbelzinnige antwoorden laten het voorstel openstaan en het gesprek vraagt het opnieuw.

Toegepaste schrijfbewerkingen worden vastgelegd in `~/.openclaw/audit/crestodian.jsonl`. Detectie wordt niet gecontroleerd; alleen toegepaste bewerkingen en schrijfbewerkingen worden geregistreerd.

Kanaalconfiguratie kan als gehost gesprek worden uitgevoerd totdat er een geheim nodig is. De
lokale Crestodian-TUI accepteert geen gevoelige wizardantwoorden, omdat invoer in
terminalchats zichtbaar is. Deze biedt onmiddellijk `open channel wizard` aan, waarbij
het geselecteerde kanaal wordt meegenomen naar de afgeschermde terminalwizard; u kunt later ook
`openclaw channels add --channel <channel>` uitvoeren.

### Overschakelen naar afgeschermde kanaalconfiguratie

De lokale chat kan de besturing overdragen aan de afgeschermde kanaalwizard:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` opent de afgeschermde kanaalconfiguratie nadat de chat-TUI
is gesloten. Gebruik eerst `channel info <channel>` voor het kanaallabel, de configuratiestatus,
een samenvatting van de vereisten en een koppeling naar de documentatie.

Crestodian wijzigt nooit provider-/authenticatietoegang vanuit de eigen sessie: de
sessie is al afhankelijk van die inferentieroute. Voor de configuratie of
reparatie van een modelprovider retourneert `configure model provider` instructies om af te sluiten en onboarding uit te voeren, zonder
een wizard te starten of configuratie te schrijven. Sluit Crestodian af en voer `openclaw
onboard` uit; onboarding bereidt de referenties voor en slaat alleen een route op die
een echte live beurt voltooit. Start Crestodian opnieuw nadat onboarding is geslaagd.

## Installatie-initialisatie

`setup` configureert de resterende werkruimte- en Gateway-status nadat begeleide onboarding de inferentie al heeft ingesteld. Het schrijft uitsluitend via getypeerde configuratiebewerkingen en vraagt eerst om goedkeuring.

```text
setup
setup workspace ~/Projects/work
```

`setup` behoudt het geverifieerde effectieve model. Het configureert of
vervangt de inferentie niet.

Als inferentie ontbreekt of de live controle ervan mislukt, verlaat u Crestodian en voert u `openclaw onboard` uit. Begeleide onboarding detecteert geconfigureerde modellen, API-sleutels en geauthenticeerde lokale CLI's, vraagt elke kandidaat om een echt antwoord en slaat alleen een geslaagde route permanent op. Crestodian start onmiddellijk na die grens en kan vervolgens de werkruimte, Gateway, kanalen, agents, plugins en andere optionele functies configureren.

De macOS-app slaat dit traject volledig over wanneer deze een geconfigureerde Gateway
bereikt waarvan de standaardagent al een geconfigureerd model heeft; de normale
agentgebruikersinterface wordt geopend.
Voor een nieuwe of onvolledige Gateway doorloopt de app het inferentietraject via
de Gateway-methoden `crestodian.setup.detect` en `crestodian.setup.activate`:
detectie geeft elke gevonden kandidaat-backend weer, activering test één
kandidaat live (een echte voltooiing met "reply with OK") en slaat pas nadat de test is geslaagd het model,
de referentie en de provider-/runtimestatus op die voor die route nodig zijn. De standaardwaarden voor werkruimte en Gateway blijven bestemd voor Crestodian. Een niet-geslaagde kandidaat
wijzigt de configuratie nooit; de app doorloopt automatisch de rest van het traject en
biedt uiteindelijk een handmatige sleutel-/tokenstap aan, ingevuld op basis van de actieve
plugins voor tekstinferentieproviders van de Gateway. De geselecteerde provider beheert het eigen startmodel
en de eigen configuratie, en de referentie wordt op dezelfde manier geverifieerd voordat deze wordt opgeslagen.

Codex-supervisie en andere optionele pluginfuncties vallen buiten deze
transactie voor inferentieactivering. Configureer ze pas nadat inferentie
werkt en Crestodian is gestart; bestaand pluginbeleid en expliciete
uitschakelingen van supervisie blijven tijdens de inferentieconfiguratie ongewijzigd.

## AI-gesprek

Het vrije gesprek van interactieve Crestodian verloopt via dezelfde agentlus als gewone OpenClaw-agents, beperkt tot één OpenClaw-bevoegdheidshulpmiddel op ring nul, `crestodian`, dat de getypeerde bewerkingen omvat. Leesacties worden vrij uitgevoerd, mutaties vereisen uw goedkeuring in het gesprek voor precies die bewerking (zie Bewerkingen en goedkeuring) en elke toegepaste schrijfbewerking wordt geregistreerd en opnieuw gevalideerd. De agentsessie blijft bestaan, waardoor Crestodian echt geheugen over meerdere beurten heeft. Als de geverifieerde inferentieroute later niet meer werkt, keert u terug naar `openclaw onboard` en repareert u deze voordat u verdergaat.

De host ontleedt verzoeken in natuurlijke taal niet tot bewerkingen. Vrije
berichten — waaronder tekst die op opdrachten lijkt en vragen zoals "waarom is mijn
gateway gestopt?" — gaan naar de AI, die het verzoek via het hulpmiddel `crestodian`
aan een getypeerde bewerking kan koppelen.

Wanneer een mutatie openstaat, worden alleen ondubbelzinnige goedkeurings- of afwijzingszinnen uit een
gesloten lijst zonder inferentie verwerkt. Dubbelzinnige toestemming gaat naar een
afzonderlijke geconfigureerde voltooiingsaanroep en wordt anders veilig geweigerd. Gestructureerde
wizardvelden en exacte hostnavigatie zijn bedieningselementen van de gebruikersinterface, geen verwerking van
bewerkingen in natuurlijke taal. Eén uitzondering voor geheimhygiëne is bijzonder belangrijk: een
exacte `config set` op een gevoelig pad (tokens, sleutels, wachtwoorden) bereikt
nooit een model. De host maakt een geredigeerd voorstel en de waarde wordt afgeschermd in de
voor de AI zichtbare geschiedenis. Geef voor geheimen de voorkeur aan `config set-ref <path> env <ENV_VAR>`.

De reddingsmodus voor berichtkanalen gebruikt nooit de modelondersteunde planner. Redding op afstand blijft deterministisch, zodat een defect of gecompromitteerd normaal agentpad niet als configuratie-editor kan worden gebruikt.

### Vertrouwensmodel voor de CLI-harnas

Ingebedde runtimes en de Codex-app-serverharnas dwingen de beperking tot ring nul
rechtstreeks af: de uitvoering bevat een OpenClaw-toelatingslijst voor hulpmiddelen met alleen
het hulpmiddel `crestodian`. Voor Codex schakelt OpenClaw ook omgevingen, native
uitvoering, meerdere agents, doel-, app-/plugin-, skill-/MCP-, webzoek- en
`request_user_input`-onderdelen uit voor die uitvoering. Codex injecteert nog steeds het inerte, ingebouwde hulpprogramma `update_plan`;
dit kan de tijdelijke controlelijst van het model bijwerken, maar geen bestanden
of OpenClaw-configuratie schrijven. CLI-harnassen gebruiken de toelatingslijst van OpenClaw niet,
dus Crestodian staat alleen backends toe waarvan het eigen contract voor hulpmiddelselectie
dezelfde beperking kan aantonen:

- Selecteerbare backends, waaronder Claude Code, worden gestart met een lege selectie
  van systeemeigen tools en één MCP-tool, `crestodian`. De gegenereerde MCP-configuratie
  van Claude wordt toegepast met `--strict-mcp-config`, zodat geen andere MCP-servers
  worden geladen.
- Backends die geen systeemeigen tools declareren, krijgen dezelfde speciale Crestodian
  MCP-server.
- Altijd actieve of onbekende backends met systeemeigen tools worden vóór inferentie
  gesloten bij fouten; ze kunnen geen Crestodian-sessie hosten.

Alleen Crestodian-sessies krijgen de crestodian MCP-server; normale agentuitvoeringen
zien deze tool nooit. Selecteerbare CLI-backends zonder systeemeigen tools en modellen
met API-sleutels dwingen daarom de letterlijke lus met één tool af. Codex-app-servermodellen
dwingen één OpenClaw-bevoegdheidstool af, plus het inactieve systeemeigen planningshulpmiddel.
In alle drie de gevallen blijven schrijfbewerkingen tijdens de installatie beperkt tot
het gecontroleerde goedkeuringscontract van Crestodian.

Gemini CLI blijft beschikbaar voor normale agents, maar kan de toolvrije controle die
de inferentiepoort vereist niet afdwingen en kan daarom geen Crestodian hosten.

## Overschakelen naar een agent

Gebruik een selector in natuurlijke taal om Crestodian te verlaten en de normale TUI te openen:

```text
praat met agent
praat met werkagent
schakel over naar hoofdagent
```

`openclaw tui`, `openclaw chat` en `openclaw terminal` openen de normale agent-TUI rechtstreeks;
ze starten Crestodian niet. Nadat u naar de normale TUI bent overgeschakeld, keert `/crestodian`
terug naar Crestodian, eventueel met een vervolgverzoek:

```text
/crestodian
/crestodian herstart gateway
```

## Berichtherstelmodus

De berichtherstelmodus is het toegangspunt voor Crestodian via berichtkanalen: gebruik deze
wanneer uw normale agent niet meer werkt, maar een vertrouwd kanaal (bijvoorbeeld WhatsApp)
nog steeds opdrachten ontvangt.

Dit is een deterministische noodopdrachtafhandelaar, niet de conversationele
Crestodian-agent. Deze initialiseert geen nieuwe installatie en versoepelt de
inferentiepoort voor Crestodian-chat niet.

Ondersteunde opdracht: `/crestodian <verzoek>`. Herstel accepteert uitsluitend de exact
getypte opdrachtsyntaxis — natuurlijke taal wordt afgewezen met een aanwijzing, nooit
geraden als een bewerking, en er wordt nooit een model geraadpleegd.

```text
U, in een vertrouwd privébericht van de eigenaar: /crestodian status
OpenClaw: Crestodian-herstelmodus. Gateway bereikbaar: nee. Configuratie geldig: nee.
U: /crestodian herstart gateway
OpenClaw: Plan: herstart de Gateway. Antwoord /crestodian yes om toe te passen.
U: /crestodian yes
OpenClaw: Toegepast. Auditvermelding geschreven.
```

Het maken van agents kan ook lokaal of via herstel in de wachtrij worden geplaatst:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

Bij het maken van een agent mag alleen het huidige live geverifieerde standaardmodel
worden genoemd. Laat het model weg om die route over te nemen.

Extern herstel is een beheerdersoppervlak en moet worden behandeld als externe
configuratiereparatie, niet als normale chat.

Beveiligingscontract voor extern herstel:

- Uitgeschakeld wanneer sandboxing actief is voor de agent/sessie; Crestodian weigert extern herstel en verwijst naar lokale reparatie via de CLI.
- De standaard effectieve status is `auto`: extern herstel alleen toestaan bij vertrouwde YOLO-werking, waarbij de runtime al lokale bevoegdheid zonder sandbox heeft (`tools.exec.security` wordt omgezet naar `full` en `tools.exec.ask` naar `off`, met sandboxmodus `off`).
- Vereist een expliciete eigenaarsidentiteit; geen jokerregels voor afzenders, open groepsbeleid, niet-geverifieerde Webhooks of anonieme kanalen.
- Standaard alleen privéberichten van de eigenaar; herstel via groepen/kanalen vereist expliciete aanmelding.
- Het zoeken en weergeven van Plugins is alleen-lezen. Plugin-installatie is altijd uitsluitend lokaal (geblokkeerd tijdens herstel, zelfs wanneer deze anders is ingeschakeld), omdat daarbij uitvoerbare code wordt gedownload. Het verwijderen van Plugins wordt zowel in lokale Crestodian als tijdens herstel geweigerd; voer `openclaw plugins uninstall <id>` uit vanuit een terminal.
- Extern herstel kan de lokale TUI niet openen of overschakelen naar een interactieve agentsessie; gebruik lokaal `openclaw` voor de overdracht aan een agent.
- Permanente schrijfbewerkingen vereisen nog steeds goedkeuring, ook in de herstelmodus.
- Elke toegepaste herstelbewerking wordt gecontroleerd. Herstel via berichtkanalen registreert metagegevens van kanaal, account, afzender en bronadres; configuratiewijzigende bewerkingen registreren ook configuratiehashes van vóór en na de wijziging.
- Geheimen worden nooit weergegeven. Inspectie van SecretRef rapporteert beschikbaarheid, niet de waarden.
- Als de Gateway actief is, geeft herstel de voorkeur aan getypeerde Gateway-bewerkingen; als deze niet actief is, gebruikt herstel alleen het minimale lokale reparatieoppervlak dat niet afhankelijk is van de normale agentlus.

Configuratiestructuur:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (standaard) staat herstel alleen toe wanneer de effectieve runtime YOLO is en sandboxing is uitgeschakeld; `false` staat herstel via berichtkanalen nooit toe; `true` staat herstel expliciet toe wanneer de controles van eigenaar en kanaal slagen (nog steeds onderhevig aan de weigering wegens sandboxing).
- `ownerDmOnly`: beperkt herstel tot directe berichten van de eigenaar. Standaard `true`.
- `pendingTtlMinutes`: hoe lang een wachtende herstelschrijfbewerking openblijft voor goedkeuring met `/crestodian yes` voordat deze verloopt. Standaard `15`.

Extern herstel wordt gedekt door de Docker-lane:

```bash
pnpm test:docker:crestodian-rescue
```

Een optionele live-rooktest van het opdrachtoppervlak van het kanaal controleert
`/crestodian status` plus een volledige permanente goedkeuringscyclus via de
herstelafhandelaar:

```bash
pnpm test:live:crestodian-rescue-channel
```

Een verpakte eenmalige installatie met inferentiepoort wordt gedekt door:

```bash
pnpm test:docker:crestodian-first-run
```

Deze lane voor de verpakte CLI begint met een lege statusmap en bewijst dat Crestodian
zonder inferentie gesloten blijft bij fouten. Vervolgens test en activeert deze
een nagebootste Claude via de verpakte activeringsmodule. Pas daarna bereikt een
vaag verzoek de planner en wordt het omgezet naar een getypeerde installatie, gevolgd
door eenmalige opdrachten die een extra agent maken, Discord configureren via het
inschakelen van een Plugin plus een SecretRef voor een token, de configuratie valideren
en het auditlogboek controleren. Deze lane levert ondersteunend bewijs voor de
poort en bewerkingen; deze test geen interactieve onboarding of het gesprek over de
Crestodian-agent, tools en goedkeuringen. Het onderstaande QA Lab-scenario verwijst
naar dezelfde Docker-lane:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/cli/doctor)
- [TUI](/nl/cli/tui)
- [Sandbox](/nl/cli/sandbox)
- [Beveiliging](/nl/cli/security)
