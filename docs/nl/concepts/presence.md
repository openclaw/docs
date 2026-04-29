---
read_when:
    - Het tabblad Instanties debuggen
    - Dubbele of verouderde instantierijen onderzoeken
    - Gateway-WS-verbinding of systeemgebeurtenis-bakens wijzigen
summary: Hoe OpenClaw-aanwezigheidsvermeldingen worden aangemaakt, samengevoegd en weergegeven
title: Aanwezigheid
x-i18n:
    generated_at: "2026-04-29T22:39:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw-“aanwezigheid” is een lichtgewicht overzicht naar beste vermogen van:

- de **Gateway** zelf, en
- **clients die met de Gateway zijn verbonden** (Mac-app, WebChat, CLI, enz.)

Aanwezigheid wordt vooral gebruikt om het tabblad **Instanties** van de macOS-app weer te geven en om
operators snel inzicht te geven.

## Aanwezigheidsvelden (wat wordt weergegeven)

Aanwezigheidsitems zijn gestructureerde objecten met velden zoals:

- `instanceId` (optioneel maar sterk aanbevolen): stabiele clientidentiteit (meestal `connect.client.instanceId`)
- `host`: mensvriendelijke hostnaam
- `ip`: IP-adres naar beste vermogen
- `version`: clientversietekenreeks
- `deviceFamily` / `modelIdentifier`: hardware-aanwijzingen
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “seconden sinds de laatste gebruikersinvoer” (indien bekend)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: tijdstempel van de laatste update (ms sinds epoch)

## Producenten (waar aanwezigheid vandaan komt)

Aanwezigheidsitems worden door meerdere bronnen geproduceerd en **samengevoegd**.

### 1) Zelfitem van Gateway

De Gateway maakt bij het opstarten altijd een “zelf”-item aan, zodat UI’s de gatewayhost tonen
nog voordat clients verbinding maken.

### 2) WebSocket-verbinding

Elke WS-client begint met een `connect`-verzoek. Na een geslaagde handshake voegt de
Gateway een aanwezigheidsitem voor die verbinding in of werkt het bij.

#### Waarom eenmalige CLI-opdrachten niet verschijnen

De CLI maakt vaak verbinding voor korte, eenmalige opdrachten. Om te voorkomen dat de
Instanties-lijst wordt overspoeld, wordt `client.mode === "cli"` **niet** omgezet in een aanwezigheidsitem.

### 3) `system-event`-bakens

Clients kunnen rijkere periodieke bakens verzenden via de methode `system-event`. De Mac-
app gebruikt dit om hostnaam, IP en `lastInputSeconds` te rapporteren.

### 4) Node-verbindingen (rol: node)

Wanneer een node via de Gateway-WebSocket verbinding maakt met `role: node`, voegt de Gateway
een aanwezigheidsitem voor die node in of werkt het bij (dezelfde stroom als andere WS-clients).

## Regels voor samenvoegen en deduplicatie (waarom `instanceId` belangrijk is)

Aanwezigheidsitems worden opgeslagen in één in-memory map:

- Items worden gesleuteld met een **aanwezigheidssleutel**.
- De beste sleutel is een stabiele `instanceId` (van `connect.client.instanceId`) die herstarts overleeft.
- Sleutels zijn hoofdletterongevoelig.

Als een client opnieuw verbinding maakt zonder stabiele `instanceId`, kan deze als een
**dubbele** rij verschijnen.

## TTL en begrensde grootte

Aanwezigheid is bewust tijdelijk:

- **TTL:** items ouder dan 5 minuten worden opgeschoond
- **Maximale items:** 200 (oudste eerst verwijderd)

Dit houdt de lijst actueel en voorkomt onbeperkte geheugengroei.

## Waarschuwing voor remote/tunnel (loopback-IP’s)

Wanneer een client verbinding maakt via een SSH-tunnel / lokale poortdoorsturing, kan de Gateway
het externe adres zien als `127.0.0.1`. Om te voorkomen dat een goed door de client gerapporteerd
IP wordt overschreven, worden externe loopback-adressen genegeerd.

## Consumenten

### macOS-tabblad Instanties

De macOS-app geeft de uitvoer van `system-presence` weer en past een kleine statusindicator
toe (Actief/Inactief/Verouderd) op basis van de leeftijd van de laatste update.

## Debuggingtips

- Roep `system-presence` aan op de Gateway om de onbewerkte lijst te zien.
- Als je dubbele items ziet:
  - bevestig dat clients een stabiele `client.instanceId` in de handshake verzenden
  - bevestig dat periodieke bakens dezelfde `instanceId` gebruiken
  - controleer of het uit de verbinding afgeleide item `instanceId` mist (dubbele items zijn verwacht)

## Gerelateerd

- [Type-indicatoren](/nl/concepts/typing-indicators)
- [Streaming en chunking](/nl/concepts/streaming)
