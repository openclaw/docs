---
read_when:
    - Het tabblad Instanties debuggen
    - Dubbele of verouderde instantierijen onderzoeken
    - Gateway-WS-verbinding of bakens voor systeemgebeurtenissen wijzigen
summary: Hoe OpenClaw-aanwezigheidsvermeldingen worden geproduceerd, samengevoegd en weergegeven
title: Aanwezigheid
x-i18n:
    generated_at: "2026-05-06T09:09:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw-"aanwezigheid" is een lichte, best-effort-weergave van:

- de **Gateway** zelf, en
- **clients die met de Gateway zijn verbonden** (mac-app, WebChat, CLI, enz.)

Aanwezigheid wordt vooral gebruikt om het tabblad **Instanties** van de macOS-app te renderen en om
operators snel inzicht te geven.

## Aanwezigheidsvelden (wat wordt weergegeven)

Aanwezigheidsitems zijn gestructureerde objecten met velden zoals:

- `instanceId` (optioneel maar sterk aanbevolen): stabiele clientidentiteit (meestal `connect.client.instanceId`)
- `host`: mensvriendelijke hostnaam
- `ip`: best-effort-IP-adres
- `version`: clientversietekenreeks
- `deviceFamily` / `modelIdentifier`: hardwarehints
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "seconden sinds laatste gebruikersinvoer" (indien bekend)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: tijdstempel van laatste update (ms sinds epoch)

## Producenten (waar aanwezigheid vandaan komt)

Aanwezigheidsitems worden door meerdere bronnen geproduceerd en **samengevoegd**.

### 1) Zelfitem van de Gateway

De Gateway initialiseert bij het opstarten altijd een "zelf"-item, zodat UI's de gatewayhost tonen
nog voordat er clients verbinding maken.

### 2) WebSocket-verbinding

Elke WS-client begint met een `connect`-verzoek. Na een succesvolle handshake
upsert de Gateway een aanwezigheidsitem voor die verbinding.

#### Waarom eenmalige CLI-opdrachten niet verschijnen

De CLI maakt vaak verbinding voor korte, eenmalige opdrachten. Om te voorkomen dat de
Instanties-lijst wordt overspoeld, wordt `client.mode === "cli"` **niet** omgezet in een aanwezigheidsitem.

### 3) `system-event`-bakens

Clients kunnen rijkere periodieke bakens verzenden via de methode `system-event`. De mac-
app gebruikt dit om hostnaam, IP en `lastInputSeconds` te rapporteren.

### 4) Node-verbindingen (role: node)

Wanneer een node via de Gateway-WebSocket verbinding maakt met `role: node`, upsert de Gateway
een aanwezigheidsitem voor die node (dezelfde flow als bij andere WS-clients).

## Samenvoeg- en deduplicatieregels (waarom `instanceId` belangrijk is)

Aanwezigheidsitems worden opgeslagen in één in-memory map:

- Items worden gesleuteld op een **aanwezigheidssleutel**.
- De beste sleutel is een stabiele `instanceId` (uit `connect.client.instanceId`) die herstarts overleeft.
- Sleutels zijn niet hoofdlettergevoelig.

Als een client opnieuw verbinding maakt zonder een stabiele `instanceId`, kan deze als een
**dubbele** rij verschijnen.

## TTL en begrensde grootte

Aanwezigheid is bewust vluchtig:

- **TTL:** items ouder dan 5 minuten worden opgeschoond
- **Max. items:** 200 (oudste worden eerst verwijderd)

Dit houdt de lijst actueel en voorkomt onbegrensde geheugengroei.

## Aandachtspunt bij remote/tunnel (loopback-IP's)

Wanneer een client verbinding maakt via een SSH-tunnel / lokale poortforward, kan de Gateway
het externe adres zien als `127.0.0.1`. Om te voorkomen dat een goed door de client gerapporteerd
IP wordt overschreven, worden loopback-adressen op afstand genegeerd.

## Consumenten

### macOS-tabblad Instanties

De macOS-app rendert de uitvoer van `system-presence` en past een kleine statusindicator
(Actief/Inactief/Verouderd) toe op basis van de leeftijd van de laatste update.

## Debugtips

- Roep `system-presence` aan op de Gateway om de ruwe lijst te zien.
- Als je duplicaten ziet:
  - controleer of clients een stabiele `client.instanceId` in de handshake verzenden
  - controleer of periodieke bakens dezelfde `instanceId` gebruiken
  - controleer of bij het uit de verbinding afgeleide item `instanceId` ontbreekt (duplicaten zijn dan verwacht)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Typindicatoren" href="/nl/concepts/typing-indicators" icon="ellipsis">
    Wanneer typindicatoren worden verzonden en hoe je ze afstemt.
  </Card>
  <Card title="Streaming en chunking" href="/nl/concepts/streaming" icon="bars-staggered">
    Uitgaande streaming, chunking en kanaalspecifieke opmaak.
  </Card>
  <Card title="Gateway-architectuur" href="/nl/concepts/architecture" icon="diagram-project">
    Gateway-componenten en het WebSocket-protocol dat aanwezigheidsupdates aanstuurt.
  </Card>
  <Card title="Gateway-protocol" href="/nl/gateway/protocol" icon="plug">
    Het wireprotocol voor `connect`, `system-event` en `system-presence`.
  </Card>
</CardGroup>
