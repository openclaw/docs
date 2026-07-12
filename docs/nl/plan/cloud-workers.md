---
read_when:
    - Het ontwerpen of implementeren van cloudworker-provisioning, workermodus of sessieoverdracht
    - Omgevingen wijzigen.*, het workerprotocol, transcriptinvoer of RPC's van de inferentieproxy
    - De beveiligingsstatus van uitvoering door externe agents beoordelen
summary: Voer agentsessies uit op tijdelijke, via SSH bereikbare machines, met door de Gateway geproxiede inferentie en live streaming in de zijbalk.
title: Plan voor cloudworkers
x-i18n:
    generated_at: "2026-07-12T09:02:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Status

Voorstel, revisie 3. Niet geïmplementeerd. Richting overeengekomen in 2026-07; revisie 2 verwerkte bevindingen uit adversariële beoordeling (specifiek workerprotocol, toestandsmachines voor plaatsing/omgeving, git-bewuste inkomende synchronisatie, eenrichtings-overdracht in v1, beveiligingsformulering voor gecontroleerd uitgaand verkeer). Revisie 3 legt het eigendomsmodel voor synchronisatie vast (de worker maakt commits, de Gateway neemt ze over en publiceert ze), voegt een eenvoudige synchronisatiemodus zonder git toe, corrigeert de uitvoering door de worker naar volledig-binnen-de-box, verplaatst internetbeleid naar het moment van inrichting en herstelt agentdispatch naar mijlpaal 3.

## Probleem

OpenClaw-agentsessies voeren hun lus, tools en inferentie uit binnen het Gateway-proces op één machine. De rekenkracht wordt beperkt door die machine, langdurige taken houden haar bezet en parallel werk concurreert om haar capaciteit. Gehoste producten (Cursor-cloudagents, Claude Code op het web, Codex cloud) lossen dit op met tijdelijke cloudsandboxen per taak, maar vereisen infrastructuur en vertrouwen van een leverancier.

Operators die al reservemachines bezitten (of die goedkoop kunnen huren) hebben geen manier om te zeggen: voer deze sessie daar uit, toon haar zoals elke andere sessie in mijn zijbalk en verwijder de machine daarna.

## Doelen

- Een volledige agentsessie (lus + tools) uitvoeren op een tijdelijke externe machine ("cloudworker"), terwijl de sessie in de Control UI precies als een lokale sessie verschijnt en streamt.
- Geen permanent aanwezige inloggegevens op de worker (geen providerauthenticatie, geen forge-tokens) en geen direct uitgaand netwerkverkeer; de box heeft alleen een bereikbare sshd nodig.
- Inrichten, synchroniseren, uitvoeren, verzamelen, vernietigen — volledig geautomatiseerd en met verwisselbare providers (eerste provider: Crabbox-achtige lease-CLI's).
- Lopend werk vanaf de Gateway naar een worker sturen op een beurtgrens zonder transcript, sessie-identiteit of (wanneer de aanvraagbytes equivalent blijven) providercache-affiniteit te verliezen; resultaten veilig terughalen.
- Zowel mensen (UI) als agents (tool) kunnen werk naar een cloudworker sturen.
- Dagenlange sessies ondersteunen; de levensduur is beleid, geen vast gecodeerde limiet.

## Geen doelen (v1)

- Geen externe codeerharnassen (Claude Code, Codex CLI) op workers. Workersessies voeren alleen de ingebedde runner van OpenClaw uit. Ondersteuning voor harnassen is een opt-in voor v2, omdat harnassen hun eigen inferentie met hun eigen inloggegevens uitvoeren.
- Geen best-of-N-/parallelle uitwaaiering van pogingen.
- Geen afhankelijkheid van VPN/tailnet. Transport verloopt uitsluitend via SSH.
- Geen nieuwe sandboxruntime. De workermachine vormt de isolatiegrens; OS-sandboxing binnen de box kan later als extra laag worden toegevoegd.
- Geen symmetrische livemigratie in v1: dispatch verloopt lokaal → worker; worker → lokaal vereist een gestopte sessie plus voltooide werkruimtereconciliatie. Live overdracht in twee richtingen bouwt later voort op hetzelfde barrièremechanisme.
- Geen JSON-nevenstatus op de Gateway; omgevings-, plaatsings-, cursor- en toekenningsstatus bevinden zich in SQLite.

## Bestaande voorbeelden (wat we overnemen, wat we omkeren)

- Cursor-cloudagents: de agentlus wordt in hun cloud uitgevoerd; de VM is een doel voor tooluitvoering; een alleen-toevoegbaar gespreksarchief wordt naar alle clients gestreamd; momentopname-na-installatie voor een warme start; zelfgehoste workers zijn workerprocessen die alleen uitgaande verbindingen maken. We nemen het model over waarbij "de bron van waarheid voor het gesprek bij de orchestrator blijft" en het streamingmodel; we keren de plaatsing van de lus om (zie de beslissing hieronder).
- Codex cloud: runtime in twee fasen — een installatiefase met netwerktoegang, gevolgd door een offline agentfase waaruit geheimen zijn verwijderd; cache van containerstatus voor snelle vervolgtaken. We nemen de fasescheiding over als onze benadering van uitgaand verkeer en het cache-idee voor warme v2-images.
- Claude Code op het web: VM per sessie; git-proxy die inloggegevens isoleert (echte tokens komen nooit in de sandbox, push is beperkt tot de sessiebranch); momentopname van het bestandssysteem na de installatie; teleport-overdracht = gepushte branch + opnieuw afgespeelde geschiedenis. We nemen de isolatie van inloggegevens en het overdrachtsmodel over, maar uitgaande synchronisatie gebeurt via rsync vanaf de Gateway, zodat vuile werkmappen werken en er nergens in de buurt van de box een forge-token aanwezig is.
- Copilot-codeeragent: standaard geweigerd uitgaand verkeer met een toestemmingslijst voor pakketregisters. Onze standaard voor normale uitvoering is strenger (helemaal geen direct uitgaand verkeer), omdat inferentie en webzoekopdrachten via de SSH-tunnel binnenkomen — maar zie Beveiliging voor waarom dit "gecontroleerd uitgaand verkeer" is en niet "geen uitgaand verkeer".

## Architectuurbeslissing: lus op de worker, inferentie via de Gateway

Er zijn drie plaatsingen overwogen:

1. De lus blijft op de Gateway, de worker voert tools uit (Cursor-model). Veiligste storingsdomein (transcript, inferentie, goedkeuringen en herstel na herstart blijven allemaal lokaal) en de eerste mijlpaal die beoordelaars verkozen. Afgewezen als productarchitectuur: de niet-uitvoerende tools van OpenClaw zijn bestandssysteembewerkingen binnen het proces, waardoor elke lees-, bewerk- of grep-bewerking op bestanden een netwerkretour vereist, of een omvangrijke refactor van het tooloppervlak naar grofmazige werkruimte-RPC's; het runtimegedrag is praatgraag en sterk afhankelijk van latentie. We hergebruiken de gedachte erachter waar die al is gebouwd (uitbesteding van uitvoering aan Nodes), maar bouwen de laag voor externe tooluitvoering niet.
2. Zowel lus als inferentie op de worker. Eenvoudigste storingsdomein, maar modelinloggegevens (inclusief OAuth-profielen) moeten naar wegwerpmachines worden verzonden, de Gateway verliest controle over beleid/routering/audit en migratie wijzigt de identiteit die de provider aanroept, waardoor providercaches ongeldig worden.
3. Lus + tools op de worker, modelaanroepen via een proxy door de Gateway. Gekozen. Eén netwerkretour per modelbeurt in plaats van per toolaanroep; tools worden naast de code uitgevoerd; de Gateway blijft de enige eigenaar van authenticatieprofielen, providerroutering en beleid; de worker bevat geen geheimen.

De prijs van optie 3 is een synchrone afhankelijkheid van de Gateway tijdens elke modelbeurt, waardoor de duurzaamheidsregels ervan deel uitmaken van de beslissing en geen bijzaak zijn:

- Verlies van de Gateway midden in een beurt laat de actieve provideraanroep mislukken. De beurt wordt als mislukt gemarkeerd en na opnieuw verbinden als een nieuwe beurt geprobeerd; een actieve providerstream wordt niet transparant opnieuw afgespeeld (risico op dubbele facturering/dubbele toolaanroepen).
- Elke worker↔Gateway-bewerking bevat een duurzame identiteit (zie Workerprotocol), zodat verbindingen na herstel worden hervat of in de cache opgeslagen eindresultaten ophalen in plaats van te blijven hangen.
- De Gateway is een component met beheerde capaciteit: limieten voor gelijktijdige workers, stroomregeling en belastingafwerping vallen binnen de reikwijdte van v1 (zie Capaciteit).

Omdat de Gateway zowel het transcript opslaat als al het providerverkeer initieert, is de sessie locatieonafhankelijk: het verplaatsen van de lus tussen Gateway en worker verandert niets aan de providerzijde en niets in het UI-gegevenspad. Dat maakt dispatch en terughalen goedkoop.

## Componenten

### 1. Toestandsmachine voor omgevingen + providercontract

`environments.*` in het Gateway-protocol is momenteel uitsluitend een statusprojectie. De duurzame kern is een door SQLite beheerd omgevingsrecord en een toestandsmachine, ontworpen vóór de RPC-vormen:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Inrichting is crashbestendig: de intentieregel wordt vóór de provideraanroep opgeslagen, met een deterministische bewerkings-id, zodat de Gateway na een herstart een lopende lease kan overnemen in plaats van dubbel in te richten of een betaalde machine te verwezen.
- Reconciliatie na herstart en een opruimer voor verweesde resources (provider-`inspect` tegenover lokale records) zijn vereisten voor v1, geen aanvullende versteviging.

Providercontract (geïmplementeerd door een Plugin; geen providernamen of beleid in de kern):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → SSH-host/-poort/-gebruiker/-sleutelmateriaal
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // overname/gezondheid/opruimen van verweesde resources
  renew?(leaseId: string): Promise<void>; // langdurige sessies tegenover provider-TTL's
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, retourneert pas na bewijs van afbouw
};
```

RPC's: `environments.create`, `environments.destroy`, uitgebreide `environments.list/status` (provider, lease-id, status, leeftijd, inactiviteitsduur, gekoppelde sessies). Eerste providers: een wrapper voor een Crabbox-vormige lease-CLI (productpad) en een provider voor statische SSH-hosts die als uitsluitend voor ontwikkeling wordt gemarkeerd — een worker op een gedeelde host kan niet-gerelateerde hostgegevens lezen, dus statische hosts zijn bedoeld voor functieontwikkeling en niet als standaardbenadering.

### 2. Workerbootstrap: OpenClaw op de box installeren

Geen speciaal workerartefact en geen afhankelijkheid van de beschikbaarheid van npm:

- Canonieke installatie voor alle modi: een door de Gateway geproduceerde workerbundel met inhoudshash (de eigen builduitvoer van de Gateway verpakt als tarball), die via SSH wordt verzonden en op de box wordt geïnstalleerd. Dit ondersteunt ontwikkelbuilds en niet-uitgebrachte commits automatisch.
- `npm i -g openclaw@<exact gateway version>` is een optimalisatie wanneer de Gateway een uitgebrachte versie uitvoert; nooit `latest`.
- Bootstrap is idempotent; een warme lease met een overeenkomende bundelhash slaat de installatie over. Onbewerkte machines kunnen een toolchainfase met netwerktoegang nodig hebben (Node-runtime) — onderdeel van de installatiefase, die daarna wordt afgesloten.
- De handshake verifieert de workerbuildhash, de verzameling protocolfuncties en de runtimecompatibiliteit. De bestaande versie-/protocolcontroles van de Gateway zijn hiervoor onvoldoende (via SSH getunnelde Nodes zijn vrijgesteld van afwijzing wegens een niet-exacte versie), dus workertoelating voert een eigen controle op de exacte build uit.

Workermodus (`openclaw worker`) is een toegangspunt, geen fork: verbindingsafhandeling plus de ingebedde agentrunner, met sessiepersistentie en modelaanroepen ondersteund door Gateway-RPC's. Deze modus mag geen Gateway-oppervlakken starten: geen kanalen, geen automatische start van Plugins buiten de toolset van de sessie, een tijdelijke statusmap en geen lokale authenticatieprofielen.

### 3. Transport: alles via SSH

De Gateway beheert de connectiviteit; de worker heeft alleen sshd nodig:

- De Gateway opent SSH naar de worker (inloggegevens uit de providerlease, hostsleutel vastgezet op basis van de inrichtingsuitvoer — geen `StrictHostKeyChecking=no`) en maakt een omgekeerde tunnel die een socket op de worker doorstuurt naar het WS-eindpunt van de Gateway.
- Besturings-/modelverkeer en werkruimteoverdracht gebruiken afzonderlijke SSH-verbindingen met hetzelfde vastgezette vertrouwensmateriaal, zodat rsync tokenstreams niet kan blokkeren door kop-van-de-rijblokkering.
- De levenscyclus van de tunnel (keepalive, opnieuw verbinden met back-off) wordt beheerd door de omgevingsruntime op de Gateway. Een korte tunnelonderbreking is onzichtbaar op sessieniveau: dankzij duurzame protocolstatus (hieronder) kan de worker zich opnieuw koppelen en doorgaan.

### 4. Workerprotocol (specifiek; niet het Node-protocol)

Een adversariële beoordeling van de huidige Node-aansluitpunten sloot eenvoudig hergebruik uit: wachtende Node-aanroepen zijn proceslokale promises die met de verbinding verdwijnen, idempotentiesleutels van Nodes worden geparseerd maar niet gededupliceerd en — doorslaggevend — een verbonden Node kan gewone Node-events uitzenden (waaronder aanvragen voor agentuitvoering), waardoor "Node-soort + capaciteitsplafond" geen beveiligingsgrens voor inkomend verkeer vormt. Workers krijgen daarom een geauthenticeerde `worker`-rol met een gesloten, geversioneerde toestemmingslijst voor RPC's/events; workerverbindingen kunnen geen verouderde Node-eventhandler bereiken.

Identiteit en inloggegevens: tijdens de inrichting wordt een kortlevend worker-inloggegeven aangemaakt dat is gebonden aan de omgevings-id, workersleutel, bundelhash, de enige toegestane sessie, de toegestane RPC-verzameling en een vervaldatum. Via SSH geverifieerde koppeling blijft van toepassing (we hebben de box ingericht en bezitten de sleutel), maar autorisatie komt van het aangemaakte inloggegeven en niet van het opgegeven Node-oppervlak.

Duurzame bewerkingssemantiek (vorm ontleend aan de bestaande ACP-runtime en het eventlogboek daarvan — stabiele handles, serialisatie per sessie, duurzame replay van `(session, seq)`):

- Elke bewerking valt binnen het bereik `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Eigenaarschapstijdperken schermen verouderde workers af: een vervangende worker verhoogt het tijdperk; late resultaten uit het oude tijdperk worden deterministisch geweigerd.
- Ten minste één keer afleveren met opgeslagen ACK-cursors en in SQLite gecachete eindresultaten; deduplicatie is deterministisch. Geen garanties voor exact één keer.
- Expliciete frames voor annuleren, sluiten, hervatten en eindresultaten; stroomregeling op basis van credits/vensters voor streams.
- Onderhandeling over protocolfuncties staat los van de algemene versie van het Node-protocol.

### 5. RPC's voor de sessiebackend

Twee afzonderlijke contracten — de huidige codebase scheidt duurzame transcriptmutaties (beheerd door de sessiemanager, JSONL-boom met bovenliggende/bladstatus) van proceslokale livegebeurtenissen (streamingdelta's, levenscyclus van tools, goedkeuringen), en het workerprotocol moet die scheiding behouden:

- Duurzame transcriptcommits: de worker dient semantische toevoegingsbatches in met `runEpoch` + compare-and-swap van het basisblad; de Gateway-sessiemanager genereert invoer-id's en bovenliggende id's. De worker mag nooit vertrouwde transcriptrijen, invoer-id's, bovenliggende id's of externe sessie-id's aanleveren.
- Opnieuw afspeelbare livegebeurtenissen: een getypeerde event-unie met workervolgordenummers, Gateway-ACK's, begrensde retentie en afscherming van late events, die de bestaande fan-out van agentevents voedt zodat de chatweergave, toolrijen en logica voor ongelezen items/status zich identiek gedragen aan lokale sessies.

Inferentieproxy: hergebruik de eventterminologie van de bestaande streamclient van de runtimeproxy (`src/agents/runtime/proxy.ts`), maar verplaats de vertrouwensgrens. De worker verzendt alleen de sessie-/runidentiteit, een goedgekeurde modelreferentie, context en begrensde generatieopties; de Gateway bepaalt provider, endpoint, authenticatie, headers, routering en kostenbeleid vanuit zijn eigen catalogus. Een door de worker aangeleverd modelobject (bijvoorbeeld een door een aanvaller beheerde `baseUrl`) wordt geweigerd. Limieten voor aanvraaggrootte, annulering, audit en het opnieuw afspelen van terminale resultaten zijn van toepassing. Tools die zich op de Gateway bevinden (websearch), worden op de Gateway uitgevoerd en retourneren resultaten via hetzelfde kanaal.

### 6. Werkruimtesynchronisatie

Het synchronisatieanker is een Gateway-lokale werkruimte met exclusief plaatsingseigendom: voor git-werkruimten een specifieke beheerde worktree (bestaande metadata voor beheerde worktrees — branch, basis, snapshoteigendom — vormt de basis); voor werkruimten zonder git een doelmap die eigendom is van de Gateway. Nooit de live-check-out van de gebruiker. Exclusief eigendom terwijl de sessie op afstand is geplaatst, maakt inkomende synchronisatie inherent conflictvrij.

Eigendomsscheiding — committen versus publiceren:

- De agent aan de workerzijde maakt normaal commits in zijn kopie (`git commit` is een lokale bewerking zonder inloggegevens; de auteursidentiteit wordt geprojecteerd vanuit de Gateway-configuratie). Die commits zijn inerte objecten totdat de Gateway ze overneemt.
- De Gateway doet alles waarvoor vertrouwen vereist is: controleren of inkomende commits voortbouwen op de vastgelegde basis, de lokale worktree fast-forwarden, pushen, PR's aanmaken en optioneel ondertekenen/opnieuw ondertekenen — allemaal met Gateway-lokale inloggegevens. De worker beschikt nooit over git- of forge-inloggegevens en benadert nooit een remote.

Twee synchronisatiemodi, geselecteerd op basis van de vraag of de werkruimte een git-repository is:

- Git-modus. Uitgaand: synchroniseer de worktree met rsync (inclusief niet-gecommitte wijzigingen en toegestane niet-gevolgde bestanden; include/exclude in crabbox-stijl, met inachtneming van `.worktreeinclude`) via de SSH-identiteit van de tunnel, vastgelegd als een onveranderlijk basism manifest (inhoudshashes + basiscommit). Inkomend: nieuwe commits keren terug als een git-bundel of tijdelijke ref ten opzichte van de vastgelegde basis; niet-gevolgde artefacten keren terug via een expliciet manifest met controles op grootte, type en insluiting van symbolische koppelingen. Bij overname wordt de basisafstamming gecontroleerd en bij divergentie gestopt — niets overschrijft stilzwijgend een van beide zijden. Verwijderingen, hernoemingen, submodules en ontsnappingen via symbolische koppelingen worden afgehandeld door de manifestregels, niet door rsync-heuristieken.
- Platte modus (geen git — bijvoorbeeld wanneer op de box een project vanaf nul wordt gebouwd). Uitgaand gebruikt dezelfde rsync + hetzelfde basismanifest. Inkomend wordt een via manifestverschillen bepaalde spiegel teruggeschreven naar de doelmap die eigendom is van de Gateway, met doorvoering van verwijderingen. Dit is veilig om dezelfde reden als de git-modus: exclusief eigendom betekent dat er geen gelijktijdige lokale wijzigingen bestaan waarmee conflicten kunnen optreden; het basismanifest detecteert nog steeds onverwachte lokale afwijkingen en stopt in plaats van te overschrijven.

Controlepunten beschermen dagenlange sessies tegen verlies van een lease: periodieke inkomende controlepunten (commits op een sessiebranch in git-modus, manifestsnapshots in platte modus); de frequentie wordt bepaald door het profielbeleid (standaard op basis van beurten).

### 7. Plaatsingstoestandsmachine, sessies en gebruikersinterface

Runtimeplaatsing is een door SQLite beheerde toestandsmachine die aan de sessie is gekoppeld, niet een paar losse rijvelden:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Deze bewaart de omgevings-id, overgangsgeneratie, epoch van de actieve eigenaar, het basismanifest van de werkruimte, de hash van de workerbundel en de laatste ACK-cursors. Toelating van beurten claimt atomair de plaatsing voordat een van beide lussen een beurt start, zodat een lokaal bericht dat op basis van een verouderde snapshot is toegelaten nooit kan wedijveren met een workerbeurt — op elk moment is precies één lus eigenaar van de sessie.

Gebruikersinterface:

- Een workersessie is een gewone sessierij plus plaatsingsmetadata. Deze bevindt zich in de normale opslag, wordt weergegeven via `sessions.list` en streamt via bestaande abonnementen — de zijbalk en chat hebben geen nieuw gegevenspad nodig, alleen presentatie: een workerbadge en plaatsings-/omgevingsstatus (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Gebruikerservaring bij aanmaken: de doelbalk van de sessie (herontwerp van de sessiezijbalk) krijgt naast Gateway en Node een bestemming voor een cloudworker. Vereist een geconfigureerd providerprofiel; de functie is onzichtbaar totdat deze is geconfigureerd.
- Agentdispatch: met een sessietool kan een agent werk overdragen aan een cloudworker zoals een mens dat doet (door een worker ondersteunde subsessie, in subagentstijl). Wordt in dezelfde mijlpaal geleverd als dispatch door mensen, afgeschermd door dezelfde opt-in-providerconfiguratie. Recursie is structureel begrensd (workersessies kunnen in v1 niet zelf workers dispatchen); uitgavenbeheer gebeurt via boekhouding/audit per omgeving, niet via quotamechanismen.

## Dispatch en overdracht

v1 is opzettelijk asymmetrisch:

- Lokaal → worker (dispatch): passeer de onderstaande migratiebarrière, richt een worker in of hergebruik er een, synchroniseer, wijzig de plaatsing; de volgende beurt wordt op afstand uitgevoerd.
- Worker → lokaal (terughalen): stop de sessie (laat de worker via dezelfde barrière leeglopen), voltooi de inkomende reconciliatie en wijzig de plaatsing naar lokaal. Dit is geen livemigratie.
- Symmetrische live-overdracht (een actief werkende sessie in beide richtingen verplaatsen zonder deze te stoppen) hergebruikt dezelfde barrière- en reconciliatiemechanismen en wordt geleverd nadat foutinjectietests de barrière hebben bewezen.

Migratiebarrière (alleen een "beurtgrens" is onvoldoende — goedkeuringen, achtergrondprocessen en transcriptmerges na vrijgegeven vergrendelingen kunnen deze grens overschrijden):

1. Stop de toelating van nieuwe beurten (plaatsingsclaim).
2. Annuleer actieve runs of laat ze leeglopen.
3. Trek openstaande uitvoeringsgoedkeuringen en uitvoeringstoekenningen in.
4. Laat nevenschrijfbewerkingen van het transcript en ACK's van livegebeurtenissen leeglopen.
5. Beëindig onderliggende workerprocessen.
6. Scherm de oude eigenaar af door de eigenaarsepoch te verhogen.
7. Reconcilieer de werkruimte (inkomend, conflictbewust).
8. Activeer de nieuwe eigenaar.

Cacheaffiniteit: omdat provideraanvragen bij beide plaatsingen vanuit de Gateway afkomstig zijn, blijft cacheaffiniteit behouden wanneer de geserialiseerde provideraanvraag equivalent blijft — dezelfde toolvolgorde, systeeminstructies, providerwrappers en cachemetadata (die aan de Gateway-zijde blijven). Dit is een testbare eigenschap, geen aanname: byte-equivalentietests voor lokale/workerplaatsing per ondersteund providertransport maken deel uit van de mijlpaal die de workerlus introduceert.

## Beveiligingsmodel

Nauwkeurig geformuleerd: de worker heeft geen directe uitgaande netwerktoegang en geen permanent beschikbare provider-/forge-inloggegevens. Het is geen "nul uitgaande toegang" — inferentie en door de Gateway uitgevoerde tools zijn beheerde uitgaande kanalen (een door promptinjectie getroffen worker kan nog steeds werkruimtebytes in modelcontext of websearch-query's plaatsen). Daarom:

- Boekhouding van beheerde uitgaande toegang: audit per omgeving en voor operators zichtbare boekhouding voor de inferentieproxy en Gateway-tools. Limieten voor snelheid/bytes bestaan als protocolstroomregeling (capaciteit), niet als mechanismen voor uitgavenquota.
- Inkomend verkeer van de worker naar de Gateway is beperkt tot de gesloten allowlist van het workerprotocol; transcriptschrijfbewerkingen zijn structureel begrensd (door de Gateway gegenereerde id's, één gebonden sessie).
- Workeruitvoering heeft volledige rechten binnen de box. De box is vervangbaar en bevat geen inloggegevens, waardoor goedkeuring per opdracht wrijving toevoegt zonder iets te beschermen; de bewaakte grens is inkomende reconciliatie en audit. Uitvoering doorloopt nooit het goedkeuringspad voor Gateway-nodes.
- Internetbeleid is een providerbeslissing tijdens de inrichting: het omgevingsprofiel beslist bij het aanmaken van de box (firewall/beveiligingsgroep/netwerk zonder uitgaande toegang), optioneel met een netwerkgebonden installatiefase die de provider vóór de agentfase afsluit. De kern implementeert geen runtime-netwerkschakelaar.
- Boxhygiëne tijdens de inrichting: cloudmetadata-endpoint geblokkeerd of aantoonbaar afwezig, geen instantieprofiel, geen overgenomen SSH-agent, geen Docker-socket, schone omgeving/home. SSH-hostsleutels worden vastgezet op basis van de inrichtingsuitvoer.
- Goedkeuringen en beleid voor alles aan de Gateway-zijde (push, PR, provideraanroepen) blijven op de Gateway draaien.

Impactgebied van een gecompromitteerde workersessie: de gesynchroniseerde werkruimtekopie plus wat de gecontroleerde proxykanalen toestaan — geen inloggegevens, geen direct netwerk, geen Gateway-oppervlak buiten de allowlist.

## Capaciteit

De Gateway geeft elke prompt en tokenstream door voor N workers, dus v1 definieert een capaciteitsmodel in plaats van dit in productie te ontdekken: limieten voor gelijktijdige workers per Gateway, kredietvensters per stream (de huidige wachtrij voor de eventstream is onbegrensd en de bufferlimiet van de node-socket verbreekt gedwongen de verbinding met trage afnemers — beide zijn ongewijzigd ongeschikt), begrensde schijfspooling voor pieken en afschakeling bij belasting met zichtbare toestanden voor tegendruk in de gebruikersinterface. Werkruimteoverdracht blijft op een eigen SSH-kanaal.

## Levenscyclus

- Automatisch stoppen bij inactiviteit en TTL zijn beleid van het providerprofiel, geen vaste constanten. Standaardwaarden zijn ruim met expliciete keep-alive; dagenlang werk is volwaardig ondersteund (provider `renew` bestaat voor leasegebaseerde backends); een sessie met een lopende beurt of recente activiteit wordt nooit teruggewonnen.
- Bij overlijden of terugwinning van een worker: de plaatsing gaat naar `reclaimed`, de sessierij blijft bestaan, het volgende bericht richt een nieuwe worker in en synchroniseert opnieuw vanaf het laatste controlepunt. De conversatie gaat nooit verloren (opslag aan de Gateway-zijde); werkruimtewijzigingen sinds het laatste controlepunt gaan verloren en de gebruikersinterface meldt dit.
- Hergebruik van warme leases vanaf dag één (voor providers die dit ondersteunen); een imagesnapshot na bootstrap is het snelle startpad voor v2.

## Configuratieoppervlak

Minimaal en opt-in: een providerprofielblok (provider-id, inloggegevens/CLI-referentie, synchronisatieregels, levensduurbeleid, budgetten, optionele installatiefase) plus plaatsingsselectie per sessie. Geen nieuwe omgevingsvariabelen. Niet-geconfigureerde installaties zien niets.

## Mijlpalen

De implementatie wordt geleverd als kleine, onafhankelijk samenvoegbare PR's; elke onderstaande mijlpaal is een reeks PR's, niet één wijziging.

1. Fundamenten: omgevingstoestandsmachine + providercontract + provider in crabbox-vorm (statische SSH als ontwikkelharnas), bootstrap van workerbundel + toelatingshandshake, SSH-tunnel + vastzetten van hostsleutels, snapshot van beheerde worktree + uitgaande synchronisatie (git- en platte modi). Opschoning van verweesde resources + overname na herstart.
2. Workerprotocol + workerlus: geauthenticeerde workerrol, duurzame bewerkingen/epochs/ACK-cursors, contracten voor transcriptcommits + livegebeurtenissen, inferentieproxy met door de Gateway bepaalde modellen, stroomregeling. Eén provider, alleen menselijke dispatch van nieuwe sessies, geen overdracht. Foutinjectietests (tunnelonderbreking, herstart van de Gateway, overlijden van de worker) bewaken de voltooiing.
3. Dispatch + terughalen + agentdispatch: migratiebarrière, plaatsingstoestandsmachine gekoppeld aan de doelbalk van de gebruikersinterface, inkomende reconciliatie + controlepunten, audit per omgeving, capaciteitslimieten, tool voor agentdispatch (workersessies kunnen niet recursief dispatchen). Byte-equivalentietests voor de promptcache.
4. Symmetrische live-overdracht, na foutinjectiebewijs voor mijlpaal 3.

Later: ACP-harnassen op workers als opt-in voor het laden van inloggegevens per omgeving; snelle start via snapshot/warme image; fan-out (N leases, dezelfde prompt); sandboxing van het besturingssysteem binnen de box; uitgebreidere vastlegging van artefacten via het artefactenschema.

## Openstaande vragen

- Beschikbaarheid van Plugins/Skills op workers: Skills uit de repository worden automatisch met de werkruimte gesynchroniseerd; voor via de Gateway geconfigureerde agent-Skills/Plugins is een expliciete beslissing over synchronisatie of uitsluiting nodig (het tool-/Plugin-manifest maakt hoe dan ook deel uit van de toelatingshandshake).
- Standaardfrequentie van checkpoints: op beurten gebaseerd versus op tijd gebaseerd voor zeer actieve chatsessies.
- Hoe omgevingsprofielen samenwerken met routering voor meerdere agents (standaardprofielen per agent versus uitsluitend selectie per sessie).
