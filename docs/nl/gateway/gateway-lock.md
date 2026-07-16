---
read_when:
    - Het Gateway-proces uitvoeren of debuggen
    - Onderzoek naar afdwinging van één instantie
summary: 'Singletonbeveiliging voor de Gateway: bestandsvergrendeling plus WebSocket/HTTP-binding'
title: Gateway-vergrendeling
x-i18n:
    generated_at: "2026-07-16T15:45:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Waarom

- Slechts één Gateway-proces mag eigenaar zijn van een statusmap; voer aanvullende Gateways uit met geïsoleerde profielen, statusmappen, configuraties en poorten.
- Blijf werken na crashes/SIGKILL zonder verouderde vergrendelingsbestanden achter te laten.
- Stop onmiddellijk met een duidelijke foutmelding wanneer een andere Gateway al eigenaar is van de poort.

## Drie lagen

Bij het opstarten wordt het eigenaarschap in drie opeenvolgende stappen afgedwongen:

1. **Vergrendeling van statuseigenaarschap** verkrijgt een vergrendeling op basis van de canonieke statusmap. Elke Gateway neemt hieraan deel, inclusief Gateways die zijn gestart met `OPENCLAW_ALLOW_MULTI_GATEWAY=1`, zodat destructief SQLite-onderhoud niet kan conflicteren met een actieve eigenaar.
2. **Configuratievergrendeling** verkrijgt de historische vergrendeling per configuratie en registreert de runtimepoort. De modus met meerdere Gateways slaat deze configuratiesingleton over, maar behoudt de vergrendeling van statuseigenaarschap.
3. **Socketbinding** bindt de HTTP/WebSocket-listener (standaard `ws://127.0.0.1:18789`) als een exclusieve TCP-listener.

Elke laag kan onafhankelijk mislukken en genereert een eigen `GatewayLockError`.

### Status- en configuratievergrendelingen

- De geldigheid van de vergrendeling wordt bepaald aan de hand van de geregistreerde PID, de startidentiteit van het platformproces indien beschikbaar en de procesidentiteit van de Gateway. Een geverifieerde eigenaar blijft tijdens het opstarten gezaghebbend voordat diens poort begint te luisteren.
- Een speciale SQLite-coördinator serialiseert de inspectie van metagegevens, het terugvorderen van verouderd eigenaarschap en het vervangen van vergrendelingen. De exclusieve transactie wordt automatisch vrijgegeven als het proces dat er eigenaar van is crasht.
- Als een vergrendelingsbestand ontbreekt of het geregistreerde eigenaarsproces niet meer actief is, vordert het opstartproces de vergrendeling terug en gaat het verder.
- Als een van beide vergrendelingen actief wordt vastgehouden, probeert het opstartproces dit maximaal 5 seconden (standaard) opnieuw voordat het opgeeft:

  ```text
  GatewayLockError("Gateway wordt al uitgevoerd (PID <pid>); time-out van vergrendeling na <ms> ms")
  ```

### Socketbinding

- Bij `EADDRINUSE` probeert het opstartproces de binding maximaal 20 keer opnieuw met intervallen van 500 ms (in totaal ongeveer 10 seconden) om een `TIME_WAIT`-venster na een onlangs afgesloten proces te overbruggen.
- Als de poort na de nieuwe pogingen nog steeds in gebruik is:

  ```text
  GatewayLockError("een andere Gateway-instantie luistert al op ws://127.0.0.1:<port>")
  ```

- Andere bindingsfouten:

  ```text
  GatewayLockError("kan Gateway-socket niet binden op ws://127.0.0.1:<port>: <cause>")
  ```

Bij het afsluiten sluit de Gateway de HTTP/WebSocket-server en verwijdert deze zijn
status- en configuratievergrendelingsbestanden.

## Operationele opmerkingen

- Als de poort wordt gebruikt door een ander proces dat geen Gateway is, blijft de fout hetzelfde; maak de poort vrij of kies een andere met `openclaw gateway --port <port>`.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` staat meerdere configuratie-/runtime-instanties toe, maar geen gedeelde veranderlijke status. Elke instantie heeft nog steeds een unieke `OPENCLAW_STATE_DIR` nodig.
- Onder een servicebeheerder controleert een nieuw Gateway-proces dat een van de bovenstaande fouten tegenkomt eerst `/healthz` op het bestaande proces. Als dat proces gezond is, laat het nieuwe proces de controle bij het bestaande proces in plaats van te mislukken. Op systemd wordt het afgesloten met code `78`; de `RestartPreventExitStatus=78` van de unit voorkomt dat `Restart=always` blijft herhalen bij een vergrendelings- of `EADDRINUSE`-conflict. Als het bestaande proces nooit gezond wordt, is het opnieuw proberen van de statuscontrole beperkt in de tijd en mislukt het opstarten vervolgens met de bovenstaande vergrendelingsfout in plaats van eindeloos te blijven herhalen.
- De macOS-app behoudt een eigen eenvoudige PID-beveiliging voordat de Gateway wordt gestart; de bovenstaande bestandsvergrendeling en socketbinding vormen de daadwerkelijke runtimehandhaving.

## Gerelateerd

- [Meerdere Gateways](/nl/gateway/multiple-gateways) - meerdere instanties uitvoeren met unieke poorten
- [Problemen oplossen](/nl/gateway/troubleshooting) - `EADDRINUSE` en poortconflicten diagnosticeren
