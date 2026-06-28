---
read_when:
    - Refactoring van de ACP-sessielevenscyclus of opschoning van ACPX-processen
    - Debuggen van ACPX-weesprocessen, PID-hergebruik of veilige opschoning van meerdere Gateways
    - Zichtbaarheid van sessions_list wijzigen voor gestarte ACP- of subagentsessies
    - Eigendomsmetadata ontwerpen voor achtergrondtaken, ACP-sessies of procesleases
sidebarTitle: ACP lifecycle refactor
summary: Migratieplan om eigenaarschap van ACP-sessies en ACPX-processen expliciet te maken
title: Refactor van de ACP-levenscyclus
x-i18n:
    generated_at: "2026-05-07T13:26:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

De ACP-levenscyclus werkt momenteel, maar te veel ervan wordt achteraf afgeleid.
Procesopschoning reconstrueert eigenaarschap op basis van PID's, commandoreeksen, wrapper-
paden en de live procestabel. Sessiezichtbaarheid reconstrueert eigenaarschap
op basis van sessiesleutelreeksen plus secundaire `sessions.list({ spawnedBy })`-lookups.
Dat maakt gerichte fixes mogelijk, maar zorgt er ook voor dat randgevallen gemakkelijk worden gemist:
PID-hergebruik, commando's met aanhalingstekens, kleinkinderen van adapters, statusroots met meerdere Gateways,
`cancel` versus `close`, en `tree` versus `all`-zichtbaarheid worden allemaal afzonderlijke
plekken om dezelfde eigendomsregels opnieuw te ontdekken.

Deze refactor maakt eigenaarschap eersteklas. Het doel is geen nieuw ACP-productoppervlak;
het is een veiliger intern contract voor het bestaande ACP- en ACPX-gedrag.

## Doelen

- Opschoning stuurt nooit een signaal naar een proces tenzij huidig live bewijs overeenkomt met een
  lease die eigendom is van OpenClaw.
- `cancel`, `close` en opruimen bij opstarten hebben afzonderlijke levenscyclusintenties.
- `sessions_list`, `sessions_history`, `sessions_send` en statuscontroles gebruiken
  hetzelfde sessiemodel dat eigendom is van de aanvrager.
- Installaties met meerdere Gateways kunnen elkaars ACPX-wrappers niet opruimen.
- Oude ACPX-sessierecords blijven werken tijdens migratie.
- De runtime blijft eigendom van de Plugin; de kern leert geen ACPX-pakketdetails.

## Niet-doelen

- ACPX vervangen of het openbare `/acp`-commando-oppervlak wijzigen.
- Leveranciersspecifiek ACP-adaptergedrag naar de kern verplaatsen.
- Vereisen dat gebruikers handmatig status opschonen voordat ze upgraden.
- Ervoor zorgen dat `cancel` herbruikbare ACP-sessies sluit.

## Doelmodel

### Gateway-instantie-identiteit

Elk Gateway-proces zou een stabiele runtime-instantie-id moeten hebben:

```ts
type GatewayInstanceId = string;
```

Die kan worden gegenereerd bij het opstarten van de Gateway en worden bewaard in de status voor de levensduur van
die installatie. Het is geen beveiligingsgeheim; het is een eigendomsdiscriminator die wordt gebruikt
om te voorkomen dat ACP-processen van de ene Gateway worden verward met processen van een andere Gateway.

### ACP-sessie-eigenaarschap

Elke gespawnde ACP-sessie zou genormaliseerde eigendomsmetadata moeten hebben:

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

De Gateway zou deze velden moeten retourneren op sessierijen waar ze bekend zijn.
Zichtbaarheidsfiltering zou een pure controle over rijmetadata moeten zijn:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Dat verwijdert verborgen secundaire `sessions.list({ spawnedBy })`-aanroepen uit
zichtbaarheidscontroles. Een gespawnd cross-agent ACP-kind is eigendom van de aanvrager omdat
de rij dat zegt, niet omdat een tweede query het toevallig vindt.

### ACPX-procesleases

Elke gegenereerde wrapperstart zou een leaserecord moeten maken:

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

Het wrapperproces zou de lease-id en Gateway-instantie-id in zijn
omgeving moeten ontvangen:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Wanneer het platform dit toestaat, zou verificatie de voorkeur moeten geven aan live procesmetadata
die niet door commando-aanhalingstekens kunnen worden verward:

- root-PID bestaat nog
- live wrapperpad valt onder `wrapperRoot`
- procesgroep komt overeen met de lease wanneer beschikbaar
- omgeving bevat de verwachte lease-id wanneer leesbaar
- commandohash of uitvoerbaar pad komt overeen met de lease

Als het live proces niet kan worden geverifieerd, faalt opschoning gesloten.

## Levenscycluscontroller

Introduceer één ACPX-levenscycluscontroller die procesleases en opschoningsbeleid
beheert:

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

`cancelTurn` vraagt alleen annulering van de beurt aan. Het mag herbruikbare wrapper-
of adapterprocessen niet opruimen.

`closeSession` mag opruimen, maar alleen na het laden van het sessierecord,
het laden van de lease en het verifiëren dat de live procesboom nog bij die
lease hoort.

`reapStartupOrphans` begint bij open leases in de status. Het mag de procestabel
gebruiken om descendants te vinden, maar het zou niet eerst willekeurige commando's
moeten scannen die op ACP lijken en daarna beslissen dat ze waarschijnlijk van ons zijn.

## Wrappercontract

Gegenereerde wrappers moeten klein blijven. Ze moeten:

- de adapter starten in een procesgroep waar ondersteund
- normale beëindigingssignalen doorsturen naar de procesgroep
- overlijden van de ouder detecteren
- bij overlijden van de ouder SIGTERM sturen en vervolgens de wrapper in leven houden totdat de SIGKILL-
  fallback wordt uitgevoerd
- root-PID en procesgroep-id terugrapporteren aan de levenscycluscontroller wanneer
  dat beschikbaar is

Wrappers moeten geen sessiebeleid bepalen. Ze handhaven alleen lokale opschoning van procesbomen
voor hun eigen adaptergroep.

## Sessiezichtbaarheidscontract

Zichtbaarheid moet genormaliseerd rijeigenaarschap gebruiken:

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

- `self`: alleen de aanvragersessie.
- `tree`: aanvragersessie plus rijen die eigendom zijn van of gespawnd zijn vanuit de aanvrager.
- `all`: alle rijen van dezelfde agent, a2a-toegestane cross-agent-rijen en door de aanvrager beheerde
  gespawnde cross-agent-rijen, zelfs wanneer algemene a2a is uitgeschakeld.
- `agent`: alleen dezelfde agent, tenzij een expliciete eigendomsrelatie zegt dat de rij
  bij de aanvrager hoort.

Dit maakt `tree` en `all` monotoon: `all` mag geen eigendomskind verbergen dat
`tree` zou tonen.

## Migratieplan

### Fase 1: Identiteit En Leases Toevoegen

- Voeg `gatewayInstanceId` toe aan Gateway-status.
- Voeg een ACPX-leasestore toe onder de ACPX-statusmap.
- Schrijf een lease voordat een gegenereerde wrapper wordt gespawnd.
- Sla `leaseId` op in nieuwe ACPX-sessierecords.
- Behoud bestaande PID- en commandovelden voor oude records.

### Fase 2: Lease-Eerste Opschoning

- Wijzig sluitopschoning om eerst `leaseId` te laden.
- Verifieer live proceseigenaarschap tegen de lease voordat signalen worden gestuurd.
- Behoud de huidige root-PID- en wrapper-root-fallback alleen voor legacy-records.
- Markeer leases als `closed` na geverifieerde opschoning.
- Markeer leases als `lost` wanneer het proces vóór opschoning verdwenen is.

### Fase 3: Lease-Eerst Opruimen Bij Opstarten

- Opruimen bij opstarten scant open leases.
- Verifieer voor elke lease het rootproces en verzamel descendants.
- Ruim geverifieerde bomen kinderen-eerst op.
- Laat oude `closed`- en `lost`-leases verlopen met een begrensde retentieperiode.
- Behoud scannen met commandomarkers alleen als tijdelijke legacy-fallback, bewaakt door
  wrapper-root en Gateway-instantie waar mogelijk.

### Fase 4: Sessierijen Voor Eigenaarschap

- Voeg eigendomsmetadata toe aan Gateway-sessierijen.
- Leer ACPX-, subagent-, achtergrondtaak- en sessiestore-schrijvers om
  `ownerSessionKey` of `spawnedBy` te vullen.
- Zet sessiezichtbaarheidscontroles om naar gebruik van rijmetadata.
- Verwijder secundaire `sessions.list({ spawnedBy })`-lookups tijdens zichtbaarheidscontrole.

### Fase 5: Legacy-Heuristieken Verwijderen

Na één releaseperiode:

- stop met vertrouwen op opgeslagen root-commandoreeksen voor niet-legacy ACPX-opschoning
- verwijder commandomarker-scans bij opstarten
- verwijder fallback-listlookups voor zichtbaarheid
- behoud defensief fail-closed-gedrag voor ontbrekende of niet-verifieerbare leases

## Tests

Voeg twee tabelgestuurde suites toe.

Simulator voor proceslevenscyclus:

- PID hergebruikt door niet-gerelateerd proces
- PID hergebruikt door wrapper-root van een andere Gateway
- opgeslagen wrappercommando is shell-gequote, live `ps`-commando is dat niet
- adapterkind sluit af, kleinkind blijft in de procesgroep
- SIGTERM-fallback bij overlijden van ouder bereikt SIGKILL
- proceslijst niet beschikbaar
- verouderde lease met ontbrekend proces
- opstartwees met wrapper, adapterkind en kleinkind

Matrix voor sessiezichtbaarheid:

- `self`, `tree`, `agent`, `all`
- a2a ingeschakeld en uitgeschakeld
- rij van dezelfde agent
- cross-agent-rij
- door aanvrager beheerde gespawnde cross-agent ACP-rij
- gesandboxte aanvrager beperkt tot `tree`
- lijst-, geschiedenis-, verzend- en statusacties

De belangrijke invariant: een door de aanvrager beheerd gespawnd kind is zichtbaar overal waar
de geconfigureerde zichtbaarheid de sessieboom van de aanvrager omvat, en `all` is niet
minder capabel dan `tree`.

## Compatibiliteitsnotities

Oude sessierecords hebben mogelijk geen `leaseId`. Ze moeten het legacy
fail-closed-opschoningspad gebruiken:

- vereis een live rootproces
- vereis wrapper-root-eigenaarschap wanneer een gegenereerde wrapper wordt verwacht
- vereis commando-overeenkomst voor niet-wrapper-roots
- stuur nooit signalen alleen op basis van verouderde opgeslagen PID-metadata

Als een legacy-record niet kan worden geverifieerd, laat het dan met rust. Startup-leaseopschoning en
de volgende releaseperiode zouden de fallback uiteindelijk moeten uitfaseren.

## Succescriteria

- Het sluiten van een oude of verouderde ACPX-sessie kan geen proces van een andere Gateway doden.
- Overlijden van de ouder laat geen hardnekkige adapterkleinkinderen actief.
- `cancel` breekt de actieve beurt af zonder herbruikbare sessies te sluiten.
- `sessions_list` kan door de aanvrager beheerde cross-agent ACP-kinderen tonen onder zowel
  `tree` als `all`.
- Opschoning bij opstarten wordt aangestuurd door leases, niet door brede scans van commandoreeksen.
- De gerichte proces- en zichtbaarheidsmatrixtests dekken elk randgeval dat
  eerder eenmalige reviewfixes vereiste.
