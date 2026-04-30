---
read_when:
    - Het Gateway-proces uitvoeren of debuggen
    - Onderzoek naar het afdwingen van één enkele instantie
summary: Gateway-singletonbewaking met de WebSocket-listenerbinding
title: Gateway-vergrendeling
x-i18n:
    generated_at: "2026-04-30T16:29:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Waarom

- Zorg ervoor dat er slechts één Gateway-instantie per basispoort op dezelfde host draait; extra Gateways moeten geïsoleerde profielen en unieke poorten gebruiken.
- Overleef crashes/SIGKILL zonder verouderde lockbestanden achter te laten.
- Faalt snel met een duidelijke fout wanneer de controlepoort al bezet is.

## Mechanisme

- De Gateway verkrijgt eerst een lockbestand per configuratie onder de statuslockmap en controleert de geconfigureerde poort op een bestaande listener.
- Als de geregistreerde lockeigenaar verdwenen is, de poort vrij is of de lock verouderd is, claimt het opstarten de lock opnieuw en gaat het verder.
- De Gateway bindt vervolgens de HTTP/WebSocket-listener (standaard `ws://127.0.0.1:18789`) met een exclusieve TCP-listener.
- Als het binden mislukt met `EADDRINUSE`, geeft het opstarten `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Bij het afsluiten sluit de Gateway de HTTP/WebSocket-server en verwijdert hij het lockbestand.

## Foutinterface

- Als een ander proces de poort bezet houdt, geeft het opstarten `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Andere bindfouten komen naar voren als `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Operationele opmerkingen

- Als de poort bezet is door _een ander_ proces, is de fout hetzelfde; maak de poort vrij of kies een andere met `openclaw gateway --port <port>`.
- Onder een servicemanager laat een nieuw Gateway-proces dat een bestaande gezonde `/healthz`-responder ziet, dat proces de controle behouden. Op systemd sluit de dubbele starter af met code 78, zodat de standaard `RestartPreventExitStatus=78` voorkomt dat `Restart=always` blijft herhalen bij een lock- of `EADDRINUSE`-conflict. Als het bestaande proces nooit gezond wordt, zijn nieuwe pogingen begrensd en mislukt het opstarten met een duidelijke lockfout in plaats van eindeloos te blijven herhalen.
- De macOS-app behoudt nog steeds zijn eigen lichte PID-bewaking voordat de Gateway wordt gestart; de runtime-lock wordt afgedwongen door het lockbestand plus de HTTP/WebSocket-binding.

## Gerelateerd

- [Meerdere Gateways](/nl/gateway/multiple-gateways) — meerdere instanties draaien met unieke poorten
- [Probleemoplossing](/nl/gateway/troubleshooting) — `EADDRINUSE` en poortconflicten diagnosticeren
