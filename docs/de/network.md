---
read_when:
    - Sie benötigen die Übersicht zur Netzwerkarchitektur und Sicherheit
    - Sie debuggen lokalen Zugriff gegenüber Tailnet-Zugriff oder Kopplung
    - Sie möchten die maßgebliche Liste der Netzwerkdokumentation
summary: 'Netzwerk-Hub: Gateway-Schnittstellen, Kopplung, Erkennung und Sicherheit'
title: Netzwerk
x-i18n:
    generated_at: "2026-05-06T06:54:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
---

Dieser Hub verlinkt die Kerndokumentation dazu, wie OpenClaw Geräte über localhost, LAN und Tailnet hinweg verbindet, koppelt und absichert.

## Kernmodell

Die meisten Vorgänge laufen über das Gateway (`openclaw gateway`), einen einzelnen, dauerhaft laufenden Prozess, der Kanalverbindungen und die WebSocket-Steuerungsebene verwaltet.

- **Loopback zuerst**: Gateway WS verwendet standardmäßig `ws://127.0.0.1:18789`.
  Nicht-Loopback-Bindungen erfordern einen gültigen Gateway-Authentifizierungsweg: Shared-Secret-
  Token-/Passwortauthentifizierung oder eine korrekt konfigurierte Nicht-Loopback-
  `trusted-proxy`-Bereitstellung.
- **Ein Gateway pro Host** wird empfohlen. Für Isolation führen Sie mehrere Gateways mit isolierten Profilen und Ports aus ([Mehrere Gateways](/de/gateway/multiple-gateways)).
- **Canvas-Host** wird auf demselben Port wie das Gateway bereitgestellt (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) und durch Gateway-Authentifizierung geschützt, wenn er außerhalb von Loopback gebunden ist.
- **Remote-Zugriff** erfolgt typischerweise über SSH-Tunnel oder Tailscale-VPN ([Remote-Zugriff](/de/gateway/remote)).

Wichtige Referenzen:

- [Gateway-Architektur](/de/concepts/architecture)
- [Gateway-Protokoll](/de/gateway/protocol)
- [Gateway-Runbook](/de/gateway)
- [Web-Oberflächen + Bindungsmodi](/de/web)

## Kopplung + Identität

- [Kopplungsübersicht (DM + Nodes)](/de/channels/pairing)
- [Gateway-verwaltete Node-Kopplung](/de/gateway/pairing)
- [Geräte-CLI (Kopplung + Token-Rotation)](/de/cli/devices)
- [Kopplungs-CLI (DM-Genehmigungen)](/de/cli/pairing)

Lokales Vertrauen:

- Direkte local loopback-Verbindungen können für die Kopplung automatisch genehmigt werden, damit die
  UX auf demselben Host reibungslos bleibt.
- OpenClaw verfügt außerdem über einen engen backend-/containerlokalen Selbstverbindungspfad für
  vertrauenswürdige Shared-Secret-Hilfsabläufe.
- Tailnet- und LAN-Clients, einschließlich Tailnet-Bindungen auf demselben Host, erfordern weiterhin
  eine explizite Kopplungsgenehmigung.

## Erkennung + Transporte

- [Erkennung und Transporte](/de/gateway/discovery)
- [Bonjour / mDNS](/de/gateway/bonjour)
- [Remote-Zugriff (SSH)](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)

## Nodes + Transporte

- [Nodes-Übersicht](/de/nodes)
- [Bridge-Protokoll (Legacy-Nodes, historisch)](/de/gateway/bridge-protocol)
- [Node-Runbook: iOS](/de/platforms/ios)
- [Node-Runbook: Android](/de/platforms/android)

## Sicherheit

- [Sicherheitsübersicht](/de/gateway/security)
- [Gateway-Konfigurationsreferenz](/de/gateway/configuration)
- [Fehlerbehebung](/de/gateway/troubleshooting)
- [Doctor](/de/gateway/doctor)

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Remote-Zugriff](/de/gateway/remote)
