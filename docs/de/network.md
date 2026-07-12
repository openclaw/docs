---
read_when:
    - Sie benötigen den Überblick über die Netzwerkarchitektur und Sicherheit.
    - Sie debuggen den lokalen Zugriff im Vergleich zum Tailnet-Zugriff oder die Kopplung
    - Sie möchten die kanonische Liste der Netzwerkdokumentation.
summary: 'Netzwerkzentrale: Gateway-Schnittstellen, Kopplung, Erkennung und Sicherheit'
title: Netzwerk
x-i18n:
    generated_at: "2026-07-12T01:49:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

Dieser Hub verlinkt die zentralen Dokumentationen dazu, wie OpenClaw Geräte über
localhost, LAN und Tailnet hinweg verbindet, koppelt und absichert.

## Kernmodell

Die meisten Vorgänge laufen über das Gateway (`openclaw gateway`), einen einzelnen dauerhaft ausgeführten Prozess, der die Kanalverbindungen und die WebSocket-Steuerungsebene verwaltet.

- **Zuerst Loopback**: Die Gateway-WS-Verbindung verwendet standardmäßig `ws://127.0.0.1:18789`.
  Bindungen außerhalb von Loopback verweigern den Start ohne einen gültigen Gateway-Authentifizierungspfad:
  Authentifizierung per gemeinsamem geheimem Token/Passwort oder eine korrekt konfigurierte
  `trusted-proxy`-Bereitstellung außerhalb von Loopback.
- **Ein Gateway pro Host** wird empfohlen. Führen Sie zur Isolation mehrere Gateways mit getrennten Profilen und Ports aus ([Mehrere Gateways](/de/gateway/multiple-gateways)).
- **Canvas-Host** wird über denselben Port wie das Gateway bereitgestellt (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) und bei einer Bindung über Loopback hinaus durch die Gateway-Authentifizierung geschützt.
- **Remotezugriff** erfolgt üblicherweise über einen SSH-Tunnel oder ein Tailscale-VPN ([Remotezugriff](/de/gateway/remote)).

Wichtige Referenzen:

- [Gateway-Architektur](/de/concepts/architecture)
- [Gateway-Protokoll](/de/gateway/protocol)
- [Gateway-Betriebshandbuch](/de/gateway)
- [Weboberflächen und Bindungsmodi](/de/web)

## Kopplung und Identität

- [Übersicht zur Kopplung (Direktnachrichten und Nodes)](/de/channels/pairing)
- [Vom Gateway verwaltete Node-Kopplung](/de/gateway/pairing)
- [Geräte-CLI (Kopplung und Token-Rotation)](/de/cli/devices)
- [Kopplungs-CLI (Genehmigungen für Direktnachrichten)](/de/cli/pairing)

Lokales Vertrauen:

- Direkte lokale Loopback-Verbindungen (ohne weitergeleitete Header oder Proxy-Header) können
  automatisch für die Kopplung genehmigt werden, um eine reibungslose Benutzererfahrung auf demselben Host zu gewährleisten.
- OpenClaw verfügt außerdem über einen eng begrenzten, Backend- beziehungsweise Container-lokalen Selbstverbindungspfad für
  vertrauenswürdige Hilfsabläufe mit gemeinsamem Geheimnis.
- Tailnet- und LAN-Clients, einschließlich Tailnet-Bindungen auf demselben Host, benötigen weiterhin
  eine ausdrückliche Genehmigung der Kopplung.

## Erkennung und Transporte

- [Erkennung und Transporte](/de/gateway/discovery)
- [Bonjour/mDNS](/de/gateway/bonjour)
- [Remotezugriff (SSH)](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)

## Nodes und Transporte

- [Node-Übersicht](/de/nodes)
- [Bridge-Protokoll (veraltete Nodes, historisch)](/de/gateway/bridge-protocol)
- [Node-Betriebshandbuch: iOS](/de/platforms/ios)
- [Node-Betriebshandbuch: Android](/de/platforms/android)

## Sicherheit

- [Sicherheitsübersicht](/de/gateway/security)
- [Referenz zur Gateway-Konfiguration](/de/gateway/configuration)
- [Fehlerbehebung](/de/gateway/troubleshooting)
- [Doctor](/de/gateway/doctor)

## Verwandte Themen

- [Gateway-Betriebshandbuch](/de/gateway)
- [Remotezugriff](/de/gateway/remote)
