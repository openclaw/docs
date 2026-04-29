---
read_when:
    - Je hebt het overzicht van de netwerkarchitectuur + beveiliging nodig
    - Je debugt lokale toegang versus tailnet-toegang of koppeling
    - Je wilt de canonieke lijst met netwerkdocumentatie
summary: 'Netwerkhub: Gateway-oppervlakken, koppelen, detectie en beveiliging'
title: Netwerk
x-i18n:
    generated_at: "2026-04-29T22:56:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 16
---

# Networkhub

Deze hub koppelt de kerndocumentatie voor hoe OpenClaw apparaten verbindt, koppelt en beveiligt
via localhost, LAN en tailnet.

## Kernmodel

De meeste bewerkingen verlopen via de Gateway (`openclaw gateway`), één langlopend proces dat kanaalverbindingen en het WebSocket-besturingsvlak beheert.

- **Loopback eerst**: de Gateway-WS gebruikt standaard `ws://127.0.0.1:18789`.
  Niet-loopback-bindings vereisen een geldig gateway-authenticatiepad: gedeeld-geheim
  token-/wachtwoordauthenticatie, of een correct geconfigureerde niet-loopback
  `trusted-proxy`-implementatie.
- **Eén Gateway per host** wordt aanbevolen. Gebruik voor isolatie meerdere gateways met geïsoleerde profielen en poorten ([Meerdere Gateways](/nl/gateway/multiple-gateways)).
- **Canvas-host** wordt op dezelfde poort als de Gateway aangeboden (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), beschermd door Gateway-authenticatie wanneer buiten loopback gebonden.
- **Externe toegang** is meestal een SSH-tunnel of Tailscale-VPN ([Externe toegang](/nl/gateway/remote)).

Belangrijke referenties:

- [Gateway-architectuur](/nl/concepts/architecture)
- [Gateway-protocol](/nl/gateway/protocol)
- [Gateway-runbook](/nl/gateway)
- [Weboppervlakken + bindmodi](/nl/web)

## Koppeling + identiteit

- [Overzicht van koppeling (DM + nodes)](/nl/channels/pairing)
- [Gateway-beheerde node-koppeling](/nl/gateway/pairing)
- [Apparaten-CLI (koppeling + tokenrotatie)](/nl/cli/devices)
- [Koppelings-CLI (DM-goedkeuringen)](/nl/cli/pairing)

Lokaal vertrouwen:

- Rechtstreekse local loopback-verbindingen kunnen automatisch worden goedgekeurd voor koppeling om
  de UX op dezelfde host soepel te houden.
- OpenClaw heeft ook een smal backend-/containerlokaal zelfverbindingspad voor
  vertrouwde helperflows met gedeeld geheim.
- Tailnet- en LAN-clients, inclusief tailnet-bindings op dezelfde host, vereisen nog steeds
  expliciete goedkeuring voor koppeling.

## Detectie + transporten

- [Detectie en transporten](/nl/gateway/discovery)
- [Bonjour / mDNS](/nl/gateway/bonjour)
- [Externe toegang (SSH)](/nl/gateway/remote)
- [Tailscale](/nl/gateway/tailscale)

## Nodes + transporten

- [Nodes-overzicht](/nl/nodes)
- [Bridge-protocol (legacy nodes, historisch)](/nl/gateway/bridge-protocol)
- [Node-runbook: iOS](/nl/platforms/ios)
- [Node-runbook: Android](/nl/platforms/android)

## Beveiliging

- [Beveiligingsoverzicht](/nl/gateway/security)
- [Gateway-configuratiereferentie](/nl/gateway/configuration)
- [Probleemoplossing](/nl/gateway/troubleshooting)
- [Doctor](/nl/gateway/doctor)

## Gerelateerd

- [Gateway-netwerkmodel](/nl/gateway/network-model)
- [Externe toegang](/nl/gateway/remote)
