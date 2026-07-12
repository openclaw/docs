---
read_when:
    - Het Gateway-proces uitvoeren of debuggen
    - Handhaving van één instantie onderzoeken
summary: 'Singletonbeveiliging voor de Gateway: bestandsvergrendeling plus WebSocket-/HTTP-binding'
title: Gatewayvergrendeling
x-i18n:
    generated_at: "2026-07-12T08:53:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Waarom

- Slechts één Gateway-proces mag op een host eigenaar zijn van een bepaalde configuratie + poort; voer aanvullende Gateways uit met geïsoleerde profielen en unieke poorten.
- Blijf bestand tegen crashes/SIGKILL zonder verouderde vergrendelingsbestanden achter te laten.
- Stop onmiddellijk met een duidelijke foutmelding wanneer een andere Gateway al eigenaar is van de poort.

## Twee lagen

Bij het opstarten wordt eigenaarschap door één instantie in twee onafhankelijke, opeenvolgende stappen afgedwongen:

1. **Bestandsvergrendeling** verkrijgt een vergrendelingsbestand per configuratie in de vergrendelingsmap van de statusmap. Tijdens het verkrijgen ervan controleert het opstartproces de geconfigureerde poort op een actieve luisteraar om een verouderde eigenaar van de vergrendeling na een crash te detecteren.
2. **Socketbinding** bindt de HTTP-/WebSocket-luisteraar (standaard `ws://127.0.0.1:18789`) als exclusieve TCP-luisteraar.

Elke laag kan onafhankelijk mislukken en genereert een eigen `GatewayLockError`.

### Bestandsvergrendeling

- Als het vergrendelingsbestand ontbreekt, het geregistreerde eigenaarsproces niet meer actief is of de poortcontrole van de eigenaar geen actieve luisteraar aantreft, neemt het opstartproces de vergrendeling over en gaat het verder.
- Als de vergrendeling actief wordt vastgehouden en geen van de bovenstaande situaties van toepassing is, probeert het opstartproces het maximaal 5 seconden (standaard) opnieuw voordat het opgeeft:

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Socketbinding

- Bij `EADDRINUSE` probeert het opstartproces de binding maximaal 20 keer opnieuw met tussenpozen van 500 ms (in totaal ongeveer 10 seconden), om een `TIME_WAIT`-periode na een recent afgesloten proces te overbruggen.
- Als de poort na de nieuwe pogingen nog steeds in gebruik is:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Andere bindingsfouten:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

Bij het afsluiten sluit de Gateway de HTTP-/WebSocket-server en verwijdert deze het vergrendelingsbestand.

## Operationele opmerkingen

- Als de poort bezet is door een ander proces dat geen Gateway is, is de foutmelding hetzelfde; maak de poort vrij of kies een andere met `openclaw gateway --port <port>`.
- Onder een servicebeheerder controleert een nieuw Gateway-proces dat een van de bovenstaande fouten tegenkomt eerst `/healthz` bij het bestaande proces. Als dat proces gezond is, laat het nieuwe proces de besturing bij het bestaande proces in plaats van te mislukken. Onder systemd wordt het afgesloten met code `78`; de instelling `RestartPreventExitStatus=78` van de unit voorkomt dat `Restart=always` blijft herhalen bij een vergrendelings- of `EADDRINUSE`-conflict. Als het bestaande proces nooit gezond wordt, is het aantal nieuwe pogingen voor de statuscontrole beperkt in de tijd en mislukt het opstartproces vervolgens met de bovenstaande vergrendelingsfout in plaats van eindeloos te blijven herhalen.
- De macOS-app gebruikt een eigen eenvoudige PID-beveiliging voordat deze de Gateway start; de bovenstaande bestandsvergrendeling en socketbinding vormen de daadwerkelijke afdwinging tijdens runtime.

## Gerelateerd

- [Meerdere Gateways](/nl/gateway/multiple-gateways) - meerdere instanties uitvoeren met unieke poorten
- [Probleemoplossing](/nl/gateway/troubleshooting) - `EADDRINUSE` en poortconflicten diagnosticeren
