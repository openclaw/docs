---
read_when:
    - Je wilt een beknopt overzicht van het Gateway-netwerkmodel
summary: Hoe de Gateway, nodes en canvas-host verbinding maken.
title: Netwerkmodel
x-i18n:
    generated_at: "2026-04-29T22:46:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 16
---

> Deze inhoud is samengevoegd in [Netwerk](/nl/network#core-model). Zie die pagina voor de huidige handleiding.

De meeste bewerkingen lopen via de Gateway (`openclaw gateway`), één langlopend
proces dat eigenaar is van kanaalverbindingen en het WebSocket-besturingsvlak.

## Kernregels

- Eén Gateway per host wordt aanbevolen. Dit is het enige proces dat eigenaar mag zijn van de WhatsApp Web-sessie. Voor reddingsbots of strikte isolatie kun je meerdere gateways draaien met geïsoleerde profielen en poorten. Zie [Meerdere gateways](/nl/gateway/multiple-gateways).
- Loopback eerst: de Gateway-WS gebruikt standaard `ws://127.0.0.1:18789`. De wizard maakt standaard authenticatie met een gedeeld geheim aan en genereert meestal een token, zelfs voor loopback. Gebruik voor toegang buiten loopback een geldig Gateway-authenticatiepad: authenticatie met gedeeld geheim via token/wachtwoord, of een correct geconfigureerde `trusted-proxy`-implementatie buiten loopback. Tailnet-/mobiele configuraties werken meestal het best via Tailscale Serve of een ander `wss://`-eindpunt in plaats van ruwe tailnet-`ws://`.
- Nodes maken zo nodig verbinding met de Gateway-WS via LAN, tailnet of SSH. De
  verouderde TCP-bridge is verwijderd.
- De Canvas-host wordt aangeboden door de HTTP-server van de Gateway op **dezelfde poort** als de Gateway (standaard `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Wanneer `gateway.auth` is geconfigureerd en de Gateway buiten loopback bindt, worden deze routes beschermd door Gateway-authenticatie. Node-clients gebruiken node-gebonden capaciteits-URL's die zijn gekoppeld aan hun actieve WS-sessie. Zie [Gateway-configuratie](/nl/gateway/configuration) (`canvasHost`, `gateway`).
- Gebruik op afstand gebeurt doorgaans via een SSH-tunnel of tailnet-VPN. Zie [Toegang op afstand](/nl/gateway/remote) en [Detectie](/nl/gateway/discovery).

## Gerelateerd

- [Toegang op afstand](/nl/gateway/remote)
- [Trusted proxy-authenticatie](/nl/gateway/trusted-proxy-auth)
- [Gateway-protocol](/nl/gateway/protocol)
