---
read_when:
    - Refactoring van de levenscyclus van ACP-sessies of het opruimen van ACPX-processen
    - Probleemoplossing voor verweesde ACPX-processen, hergebruik van PID's en veilige opschoning bij meerdere Gateways
    - De zichtbaarheid van sessions_list wijzigen voor gestarte ACP- of subagentsessies
    - Eigenaarschapsmetadata ontwerpen voor achtergrondtaken, ACP-sessies of procesleases
sidebarTitle: ACP lifecycle refactor
summary: Migratieplan om het eigenaarschap van ACP-sessies en ACPX-processen expliciet te maken
title: Refactor van de ACP-levenscyclus
x-i18n:
    generated_at: "2026-07-12T09:22:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

De ACP-levenscyclus werkt momenteel, maar te veel ervan wordt achteraf afgeleid.
Procesopschoning reconstrueert eigenaarschap aan de hand van PID's, opdrachtteksten, wrapperpaden
en de actuele procestabel. Sessiezichtbaarheid reconstrueert eigenaarschap
aan de hand van sessiesleutelteksten plus aanvullende `sessions.list({ spawnedBy })`-zoekacties.
Dat maakt gerichte oplossingen mogelijk, maar zorgt er ook voor dat randgevallen gemakkelijk worden gemist:
hergebruik van PID's, aangehaalde opdrachten, kleinkindprocessen van adapters, statusmappen voor meerdere Gateways,
`cancel` versus `close`, en zichtbaarheid van `tree` versus `all` worden allemaal afzonderlijke
plekken waar dezelfde eigenaarschapsregels opnieuw moeten worden afgeleid.

Deze refactor maakt eigenaarschap expliciet. Het doel is geen nieuw ACP-productoppervlak,
maar een veiliger intern contract voor het bestaande gedrag van ACP en ACPX.

## Doelen

- Opschoning stuurt nooit een signaal naar een proces tenzij actueel bewijs overeenkomt met een
  lease die eigendom is van OpenClaw.
- `cancel`, `close` en opschoning bij het opstarten hebben afzonderlijke levenscyclusintenties.
- `sessions_list`, `sessions_history`, `sessions_send` en statuscontroles gebruiken
  hetzelfde sessiemodel op basis van eigenaarschap door de aanvrager.
- Installaties met meerdere Gateways kunnen elkaars ACPX-wrappers niet opruimen.
- Oude ACPX-sessierecords blijven tijdens de migratie werken.
- De runtime blijft eigendom van de plugin; de kern krijgt geen kennis van ACPX-pakketdetails.

## Niet-doelen

- ACPX vervangen of het openbare `/acp`-opdrachtoppervlak wijzigen.
- Leveranciersspecifiek gedrag van ACP-adapters naar de kern verplaatsen.
- Van gebruikers eisen dat ze vóór een upgrade handmatig statusgegevens opschonen.
- `cancel` herbruikbare ACP-sessies laten sluiten.

## Doelmodel

### Identiteit van Gateway-instanties

Elk Gateway-proces moet een stabiele runtime-instantie-id hebben:

```ts
type GatewayInstanceId = string;
```

Deze kan bij het opstarten van de Gateway worden gegenereerd en gedurende de levensduur van
die installatie in de status worden opgeslagen. Het is geen beveiligingsgeheim, maar een eigendomsonderscheider
die wordt gebruikt om te voorkomen dat de ACP-processen van de ene Gateway worden verward met de processen van een andere Gateway.

### Eigenaarschap van ACP-sessies

Elke gestarte ACP-sessie moet genormaliseerde eigenaarschapsmetagegevens bevatten:

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

De Gateway moet deze velden retourneren voor sessierijen waarin ze bekend zijn.
Zichtbaarheidsfiltering moet een zuivere controle op metagegevens van rijen zijn:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Hiermee verdwijnen verborgen aanvullende `sessions.list({ spawnedBy })`-aanroepen uit
zichtbaarheidscontroles. Een gestart ACP-kindproces voor een andere agent is eigendom van de aanvrager omdat
de rij dat aangeeft, niet omdat een tweede zoekopdracht het toevallig vindt.

### ACPX-procesleases

Elke gegenereerde wrapperstart moet een leaserecord maken:

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

Het wrapperproces moet de lease-id en Gateway-instantie-id in zijn
omgeving ontvangen:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Wanneer het platform dit toestaat, moet verificatie de voorkeur geven aan actuele procesmetagegevens
die niet door aanhalingstekens in opdrachten kunnen worden verward:

- de hoofd-PID bestaat nog
- het actuele wrapperpad bevindt zich onder `wrapperRoot`
- de procesgroep komt overeen met de lease wanneer die beschikbaar is
- de omgeving bevat de verwachte lease-id wanneer die leesbaar is
- de opdrachthash of het pad naar het uitvoerbare bestand komt overeen met de lease

Als het actuele proces niet kan worden geverifieerd, wordt de opschoning uit veiligheidsoverwegingen afgebroken.

## Levenscycluscontroller

Introduceer één ACPX-levenscycluscontroller die eigenaar is van procesleases en het
opschoningsbeleid:

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` vraagt alleen om annulering van de beurt. Het mag herbruikbare wrapper-
of adapterprocessen niet opruimen.

`closeSession` mag opruimen, maar alleen nadat het sessierecord is geladen,
de lease is geladen en is geverifieerd dat de actuele procesboom nog steeds bij die
lease hoort.

`reapStartupOrphans` begint bij open leases in de status. Het mag de procestabel
gebruiken om afstammelingen te vinden, maar het moet niet eerst willekeurige opdrachten scannen
die op ACP lijken en vervolgens besluiten dat die waarschijnlijk van ons zijn.

## Wrappercontract

Gegenereerde wrappers moeten klein blijven. Ze moeten:

- de adapter starten in een procesgroep waar dit wordt ondersteund
- normale beëindigingssignalen doorsturen naar de procesgroep
- het overlijden van het bovenliggende proces detecteren
- bij overlijden van het bovenliggende proces SIGTERM verzenden en vervolgens de wrapper actief houden totdat de
  terugval naar SIGKILL wordt uitgevoerd
- de hoofd-PID en procesgroep-id terugmelden aan de levenscycluscontroller wanneer
  die beschikbaar zijn

Wrappers moeten niet over sessiebeleid beslissen. Ze dwingen alleen lokale opschoning van de procesboom
af voor hun eigen adaptergroep.

## Contract voor sessiezichtbaarheid

Zichtbaarheid moet genormaliseerd eigenaarschap van rijen gebruiken:

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

Regels:

- `self`: alleen de sessie van de aanvrager.
- `tree`: de sessie van de aanvrager plus rijen die eigendom zijn van of gestart zijn vanuit de aanvrager.
- `all`: alle rijen van dezelfde agent, door a2a toegestane rijen van andere agents en door de aanvrager beheerde
  gestarte rijen van andere agents, zelfs wanneer algemene a2a is uitgeschakeld.
- `agent`: alleen dezelfde agent, tenzij een expliciete eigenaarsrelatie aangeeft dat de rij
  bij de aanvrager hoort.

Hierdoor worden `tree` en `all` monotoon: `all` mag een eigen kindproces dat
`tree` zou tonen niet verbergen.

## Migratieplan

### Fase 1: identiteit en leases toevoegen

- Voeg `gatewayInstanceId` toe aan de Gateway-status.
- Voeg een ACPX-leaseregister toe onder de ACPX-statusmap.
- Schrijf een lease voordat een gegenereerde wrapper wordt gestart.
- Sla `leaseId` op in nieuwe ACPX-sessierecords.
- Behoud bestaande PID- en opdrachtvelden voor oude records.

### Fase 2: opschoning met leases als uitgangspunt

- Wijzig opschoning bij sluiten zodat eerst `leaseId` wordt geladen.
- Verifieer actueel proceseigenaarschap aan de hand van de lease voordat signalen worden verzonden.
- Behoud de huidige terugval op hoofd-PID en wrappermap alleen voor verouderde records.
- Markeer leases als `closed` na geverifieerde opschoning.
- Markeer leases als `lost` wanneer het proces vóór de opschoning is verdwenen.

### Fase 3: opschoning bij opstarten met leases als uitgangspunt

- Opschoning bij het opstarten scant open leases.
- Verifieer voor elke lease het hoofdproces en verzamel afstammelingen.
- Ruim geverifieerde bomen op, beginnend bij de kinderen.
- Laat oude leases met status `closed` en `lost` verlopen met een begrensde bewaartermijn.
- Behoud het scannen naar opdrachtmarkeringen alleen als tijdelijke terugval voor verouderde records, waar mogelijk
  afgeschermd door de wrappermap en Gateway-instantie.

### Fase 4: rijen met sessie-eigenaarschap

- Voeg eigenaarschapsmetagegevens toe aan Gateway-sessierijen.
- Leer ACPX, subagents, achtergrondtaken en schrijvers van sessieopslag om
  `ownerSessionKey` of `spawnedBy` in te vullen.
- Zet controles van sessiezichtbaarheid om naar het gebruik van metagegevens van rijen.
- Verwijder aanvullende `sessions.list({ spawnedBy })`-zoekacties tijdens zichtbaarheidscontroles.

### Fase 5: verouderde heuristieken verwijderen

Na één releaseperiode:

- vertrouw niet langer op opgeslagen teksten van hoofdopdrachten voor niet-verouderde ACPX-opschoning
- verwijder scans naar opdrachtmarkeringen bij het opstarten
- verwijder terugvalzoekacties in lijsten voor zichtbaarheid
- behoud defensief gedrag waarbij opschoning uit veiligheidsoverwegingen wordt afgebroken bij ontbrekende of niet-verifieerbare leases

## Tests

Voeg twee tabelgestuurde testsuites toe.

Simulator voor proceslevenscycli:

- PID hergebruikt door een niet-gerelateerd proces
- PID hergebruikt door de wrappermap van een andere Gateway
- opgeslagen wrapperopdracht bevat shell-aanhalingstekens, actuele `ps`-opdracht niet
- adapterkindproces stopt, kleinkindproces blijft in de procesgroep
- SIGTERM-terugval bij overlijden van bovenliggend proces bereikt SIGKILL
- proceslijst niet beschikbaar
- verouderde lease met ontbrekend proces
- weesproces bij opstarten met wrapper, adapterkindproces en kleinkindproces

Matrix voor sessiezichtbaarheid:

- `self`, `tree`, `agent`, `all`
- a2a ingeschakeld en uitgeschakeld
- rij van dezelfde agent
- rij van een andere agent
- door de aanvrager beheerde gestarte ACP-rij van een andere agent
- aanvrager in een sandbox beperkt tot `tree`
- lijst-, geschiedenis-, verzend- en statusacties

De belangrijke invariant: een door de aanvrager beheerd gestart kindproces is overal zichtbaar
waar de geconfigureerde zichtbaarheid de sessieboom van de aanvrager omvat, en `all` is niet
minder capabel dan `tree`.

## Compatibiliteitsopmerkingen

Oude sessierecords hebben mogelijk geen `leaseId`. Ze moeten het verouderde
opschoningspad gebruiken dat bij twijfel uit veiligheidsoverwegingen wordt afgebroken:

- vereis een actueel hoofdproces
- vereis eigenaarschap van de wrappermap wanneer een gegenereerde wrapper wordt verwacht
- vereis overeenstemming van opdrachten voor hoofdprocessen zonder wrapper
- stuur nooit een signaal uitsluitend op basis van verouderde opgeslagen PID-metagegevens

Als een verouderd record niet kan worden geverifieerd, laat het dan ongemoeid. Opschoning van leases bij het opstarten en
de volgende releaseperiode moeten de terugval uiteindelijk overbodig maken.

## Succescriteria

- Het sluiten van een oude of verouderde ACPX-sessie kan geen proces van een andere Gateway beëindigen.
- Het overlijden van het bovenliggende proces laat geen hardnekkige kleinkindprocessen van adapters actief.
- `cancel` breekt de actieve beurt af zonder herbruikbare sessies te sluiten.
- `sessions_list` kan door de aanvrager beheerde ACP-kindprocessen van andere agents tonen onder zowel
  `tree` als `all`.
- Opschoning bij het opstarten wordt aangestuurd door leases, niet door brede scans van opdrachtteksten.
- De gerichte matrix-tests voor processen en zichtbaarheid dekken elk randgeval dat
  voorheen eenmalige oplossingen tijdens reviews vereiste.
