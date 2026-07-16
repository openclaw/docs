---
read_when:
    - Live-status debuggen op de pagina Apparaten van de Control UI
    - Dubbele of verouderde instantierijen onderzoeken
    - Gateway-WS-verbinding of bakens voor systeemgebeurtenissen wijzigen
summary: Hoe OpenClaw-aanwezigheidsvermeldingen worden aangemaakt, samengevoegd en weergegeven
title: Aanwezigheid
x-i18n:
    generated_at: "2026-07-16T15:32:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw-"aanwezigheid" is een lichtgewicht weergave op basis van redelijke inspanning van:

- de **Gateway** zelf, en
- **voor gebruikers zichtbare clients die met de Gateway zijn verbonden** (Mac-app, WebChat, nodes, enz.)

Aanwezigheid toont live verbindingsmetadata op de pagina **Devices** van de Control UI
(onder **Settings → Devices**) en op het tabblad **Instances** van de macOS-app.

Deze pagina behandelt het clientoverzicht van de Gateway. Zie
[Aanwezigheid van actieve computer](/nodes/presence) om de Mac te detecteren die je het laatst
hebt gebruikt en node-waarschuwingen daarheen te routeren.

## Aanwezigheidsvelden (wat wordt weergegeven)

Aanwezigheidsvermeldingen zijn gestructureerde objecten met velden zoals:

- `instanceId` (optioneel, maar sterk aanbevolen): stabiele clientidentiteit (meestal `connect.client.instanceId`)
- `host`: gebruiksvriendelijke hostnaam
- `ip`: IP-adres op basis van redelijke inspanning
- `version`: tekenreeks met de clientversie
- `deviceFamily` / `modelIdentifier`: hardware-aanwijzingen
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: seconden sinds de laatste gebruikersinvoer, indien bekend
- `reason`: vrije tekenreeks die door de client wordt aangeleverd; de Gateway zelf verzendt alleen `self`, `connect` en `disconnect`
- `deviceId`, `roles`, `scopes`: apparaatidentiteit en aanwijzingen voor rol/bereik uit de verbindingshandshake
- `ts`: tijdstempel van de laatste update (ms sinds de epoch)

## Producenten (waar aanwezigheid vandaan komt)

Aanwezigheidsvermeldingen worden door meerdere bronnen geproduceerd en **samengevoegd**.

### 1) Zelfvermelding van de Gateway

De Gateway maakt bij het opstarten altijd een "zelf"-vermelding aan, zodat UI's de Gateway-host
weergeven, zelfs voordat er clients verbinding maken.

### 2) WebSocket-verbinding

Elke WS-client begint met een `connect`-verzoek. Na een geslaagde handshake
voegt de Gateway een aanwezigheidsvermelding voor die verbinding in of werkt deze bij.

#### Waarom kortstondige verbindingen op het besturingsvlak niet worden weergegeven

CLI-opdrachten, backend-RPC-clients en probes maken vaak kort verbinding. Om te voorkomen
dat deze wisselingen gedurende de volledige aanwezigheids-TTL worden bewaard, worden clients in de modus `cli`, `backend`
of `probe` **niet** omgezet in aanwezigheidsvermeldingen. Clients in testmodus
blijven bijgehouden, omdat testsuites ze gebruiken als vervanging voor echte clients.

### 3) `system-event`-bakens

Clients kunnen via de methode `system-event` uitgebreidere periodieke bakens verzenden. De Mac-app
gebruikt dit om de hostnaam, het IP-adres en `lastInputSeconds` te rapporteren.

### 4) Node-verbindingen (rol: node)

Wanneer een node via de Gateway-WebSocket verbinding maakt met `role: node`, voegt de Gateway
een aanwezigheidsvermelding voor die node in of werkt deze bij (dezelfde stroom als voor andere WS-clients).

## Regels voor samenvoegen en dedupliceren (waarom `instanceId` belangrijk is)

Aanwezigheidsvermeldingen worden opgeslagen in één kaart in het geheugen, met hoofdletterongevoelige
sleutels op basis van de eerste beschikbare waarde, in deze volgorde: een gekoppelde apparaat-id, `connect.client.instanceId`
of, als laatste redmiddel, de id per verbinding.

Kortstondige clients op het besturingsvlak worden volledig uitgesloten van bijhouden (zie
hierboven), zodat hun verbindings-id's nooit sleutels worden. Voor elke andere client betekent
de terugval op de verbindings-id dat een client die opnieuw verbinding maakt zonder een stabiele
`instanceId` als een **dubbele** rij wordt weergegeven.

## TTL en begrensde grootte

Aanwezigheid is opzettelijk kortstondig:

- **TTL:** vermeldingen ouder dan 5 minuten worden verwijderd
- **Maximumaantal vermeldingen:** 200 (oudste eerst verwijderd)

Hierdoor blijft de lijst actueel en wordt onbeperkte geheugengroei voorkomen.

## Kanttekening bij verbindingen op afstand/tunnels (loopback-IP-adressen)

Wanneer een client verbinding maakt via een SSH-tunnel/lokale poortdoorschakeling, kan de Gateway
het externe adres als `127.0.0.1` zien. Om te voorkomen dat dit tunneladres
als het IP-adres van de client wordt vastgelegd, laat de verbindingsafhandeling `ip` volledig weg voor
clients die als lokaal (loopback) zijn gedetecteerd, in plaats van het loopback-adres
in de vermelding te schrijven.

## Consumenten

### Pagina Devices van de Control UI

De pagina **Devices** combineert `system-presence` met duurzame koppelings- en node-
records. Het zelfbaken van de Gateway wordt bovenaan vastgezet en overeenkomende apparaat- of
instantie-id's worden gebruikt voor live metadata over platform, versie, model en recentheid van invoer.

### Tabblad Instances van macOS

De macOS-app geeft de uitvoer van `system-presence` weer en past een kleine status-
indicator (Active/Idle/Stale) toe op basis van de ouderdom van de laatste update.

## Tips voor foutopsporing

- Roep `system-presence` aan op de Gateway om de onbewerkte lijst te bekijken.
- Als je duplicaten ziet:
  - controleer of clients tijdens de handshake een stabiele `client.instanceId` verzenden
  - controleer of periodieke bakens dezelfde `instanceId` gebruiken
  - controleer of `instanceId` ontbreekt in de van de verbinding afgeleide vermelding (duplicaten zijn dan te verwachten)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Aanwezigheid van actieve computer" href="/nodes/presence" icon="computer-mouse">
    Hoe fysieke invoer op een Mac een actieve node selecteert en verbindingswaarschuwingen routeert.
  </Card>
  <Card title="Typindicatoren" href="/nl/concepts/typing-indicators" icon="ellipsis">
    Wanneer typindicatoren worden verzonden en hoe je ze afstemt.
  </Card>
  <Card title="Streaming en opdelen" href="/nl/concepts/streaming" icon="bars-staggered">
    Uitgaande streaming, opdelen en opmaak per kanaal.
  </Card>
  <Card title="Gateway-architectuur" href="/nl/concepts/architecture" icon="diagram-project">
    Gateway-componenten en het WebSocket-protocol dat aanwezigheidsupdates aanstuurt.
  </Card>
  <Card title="Gateway-protocol" href="/nl/gateway/protocol" icon="plug">
    Het wire-protocol voor `connect`, `system-event` en `system-presence`.
  </Card>
</CardGroup>
