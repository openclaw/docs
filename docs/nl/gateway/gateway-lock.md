---
read_when:
    - Het Gateway-proces uitvoeren of debuggen
    - Onderzoek naar het afdwingen van één enkele instantie
summary: Gateway-singletonbeveiliging via de binding van de WebSocket-listener
title: Gateway-vergrendeling
x-i18n:
    generated_at: "2026-04-29T22:44:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Waarom

- Zorg ervoor dat er per basispoort slechts één Gateway-instantie op dezelfde host draait; extra Gateways moeten geïsoleerde profielen en unieke poorten gebruiken.
- Herstel van crashes/SIGKILL zonder verouderde lockbestanden achter te laten.
- Faalt snel met een duidelijke fout wanneer de controlepoort al bezet is.

## Mechanisme

- De Gateway verkrijgt eerst een lockbestand per configuratie onder de state-lockdirectory en test de geconfigureerde poort op een bestaande luisteraar.
- Als de geregistreerde lockeigenaar verdwenen is, de poort vrij is, of de lock verouderd is, claimt het opstarten de lock opnieuw en gaat verder.
- De Gateway bindt daarna de HTTP/WebSocket-luisteraar (standaard `ws://127.0.0.1:18789`) met een exclusieve TCP-luisteraar.
- Als het binden mislukt met `EADDRINUSE`, gooit het opstarten `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Bij afsluiten sluit de Gateway de HTTP/WebSocket-server en verwijdert het lockbestand.

## Foutoppervlak

- Als een ander proces de poort bezet houdt, gooit het opstarten `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Andere bindfouten verschijnen als `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Operationele opmerkingen

- Als de poort door _een ander_ proces bezet is, is de fout hetzelfde; maak de poort vrij of kies een andere met `openclaw gateway --port <port>`.
- Onder een service-supervisor sluit een nieuw Gateway-proces dat een bestaande gezonde `/healthz`-responder ziet succesvol af en laat het dat proces de controle houden. Als het bestaande proces nooit gezond wordt, zijn herhalingen begrensd en mislukt het opstarten met een duidelijke lockfout in plaats van eindeloos te blijven herhalen.
- De macOS-app behoudt nog steeds zijn eigen lichte PID-bewaking voordat de Gateway wordt gestart; de runtime-lock wordt afgedwongen door het lockbestand plus de HTTP/WebSocket-binding.

## Gerelateerd

- [Meerdere Gateways](/nl/gateway/multiple-gateways) — meerdere instanties draaien met unieke poorten
- [Probleemoplossing](/nl/gateway/troubleshooting) — `EADDRINUSE` en poortconflicten diagnosticeren
