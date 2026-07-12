---
read_when:
    - Je hebt het overzicht van de netwerkarchitectuur en beveiliging nodig
    - Je onderzoekt problemen met lokale toegang versus toegang via het tailnet of met koppeling.
    - U wilt de canonieke lijst met netwerkdocumentatie
summary: 'Netwerkhub: Gateway-interfaces, koppeling, detectie en beveiliging'
title: Netwerk
x-i18n:
    generated_at: "2026-07-12T09:04:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

Deze hub bevat koppelingen naar de kerndocumentatie over hoe OpenClaw apparaten verbindt, koppelt en beveiligt via localhost, LAN en tailnet.

## Kernmodel

De meeste bewerkingen verlopen via de Gateway (`openclaw gateway`), één langlopend proces dat de kanaalverbindingen en het WebSocket-besturingsvlak beheert.

- **Eerst loopback**: de Gateway-WS gebruikt standaard `ws://127.0.0.1:18789`.
  Bindingen buiten loopback weigeren te starten zonder een geldig Gateway-authenticatiepad:
  authenticatie met een gedeeld geheim via een token of wachtwoord, of een correct geconfigureerde
  `trusted-proxy`-implementatie buiten loopback.
- **Eén Gateway per host** wordt aanbevolen. Voer voor isolatie meerdere gateways uit met geïsoleerde profielen en poorten ([Meerdere Gateways](/nl/gateway/multiple-gateways)).
- **Canvas-host** wordt aangeboden op dezelfde poort als de Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) en wordt beveiligd met Gateway-authenticatie wanneer deze buiten loopback is gebonden.
- **Externe toegang** verloopt doorgaans via een SSH-tunnel of Tailscale-VPN ([Externe toegang](/nl/gateway/remote)).

Belangrijke naslaginformatie:

- [Gateway-architectuur](/nl/concepts/architecture)
- [Gateway-protocol](/nl/gateway/protocol)
- [Gateway-draaiboek](/nl/gateway)
- [Webinterfaces en bindingsmodi](/nl/web)

## Koppeling en identiteit

- [Overzicht van koppeling (DM en nodes)](/nl/channels/pairing)
- [Door de Gateway beheerde nodekoppeling](/nl/gateway/pairing)
- [CLI voor apparaten (koppeling en tokenrotatie)](/nl/cli/devices)
- [CLI voor koppeling (DM-goedkeuringen)](/nl/cli/pairing)

Lokaal vertrouwen:

- Rechtstreekse verbindingen via local loopback (zonder doorgestuurde headers of proxyheaders) kunnen
  automatisch worden goedgekeurd voor koppeling, zodat de gebruikerservaring op dezelfde host soepel blijft.
- OpenClaw heeft ook een beperkt pad voor lokale zelfverbinding vanuit de backend of container voor
  vertrouwde hulpstromen met een gedeeld geheim.
- Clients op tailnet en LAN, inclusief tailnet-bindingen op dezelfde host, vereisen nog steeds
  expliciete goedkeuring voor koppeling.

## Detectie en transporten

- [Detectie en transporten](/nl/gateway/discovery)
- [Bonjour/mDNS](/nl/gateway/bonjour)
- [Externe toegang (SSH)](/nl/gateway/remote)
- [Tailscale](/nl/gateway/tailscale)

## Nodes en transporten

- [Overzicht van nodes](/nl/nodes)
- [Bridge-protocol (verouderde nodes, historisch)](/nl/gateway/bridge-protocol)
- [Node-draaiboek: iOS](/nl/platforms/ios)
- [Node-draaiboek: Android](/nl/platforms/android)

## Beveiliging

- [Overzicht van beveiliging](/nl/gateway/security)
- [Naslaginformatie voor Gateway-configuratie](/nl/gateway/configuration)
- [Probleemoplossing](/nl/gateway/troubleshooting)
- [Doctor](/nl/gateway/doctor)

## Gerelateerd

- [Gateway-draaiboek](/nl/gateway)
- [Externe toegang](/nl/gateway/remote)
