---
read_when:
    - Implementieren oder Ändern der Bonjour-Erkennung/-Ankündigung
    - Anpassen der Remote-Verbindungsmodi (direkt vs. SSH)
    - Node-Erkennung und -Kopplung für Remote-Nodes entwerfen
summary: Node-Erkennung und Transportwege (Bonjour, Tailscale, SSH) zum Auffinden des Gateways
title: Erkennung und Übertragungswege
x-i18n:
    generated_at: "2026-07-24T04:55:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw hat zwei miteinander zusammenhängende, aber unterschiedliche Erkennungsprobleme:

1. **Fernsteuerung durch Bedienpersonal**: Die macOS-Menüleisten-App steuert ein Gateway, das an einem anderen Ort ausgeführt wird.
2. **Node-Kopplung**: iOS/Android (und zukünftige Nodes) finden ein Gateway und koppeln sich sicher damit.

Die gesamte Netzwerkerkennung und -ankündigung erfolgt im **Node-Gateway**
(`openclaw gateway`); Clients (Mac-App, iOS) sind lediglich Nutzer dieser Informationen.

## Begriffe

- **Gateway**: ein einzelner, dauerhaft ausgeführter Prozess, der den Zustand verwaltet (Sitzungen,
  Kopplung, Node-Register) und Kanäle ausführt. Die meisten Installationen verwenden einen pro Host;
  isolierte Installationen mit mehreren Gateways sind möglich.
- **Gateway-WS (Steuerungsebene)**: der WebSocket-Endpunkt, standardmäßig auf `127.0.0.1:18789`;
  binden Sie ihn über `gateway.bind` an das LAN/Tailnet.
- **Direkter WS-Transport**: ein für LAN/Tailnet erreichbarer Gateway-WS-Endpunkt (ohne SSH).
- **SSH-Transport (Fallback)**: Fernsteuerung durch Weiterleitung von
  `127.0.0.1:18789` über SSH.
- **Veraltete TCP-Bridge (entfernt)**: älterer Node-Transport (siehe
  [Bridge-Protokoll](/de/gateway/bridge-protocol)); wird nicht mehr zur
  Erkennung angekündigt und ist nicht mehr Bestandteil aktueller Builds.

Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol),
[Bridge-Protokoll (veraltet)](/de/gateway/bridge-protocol).

## Warum sowohl Direktverbindungen als auch SSH vorhanden sind

- **Direktes WS** bietet die beste Benutzererfahrung im selben Netzwerk und innerhalb eines Tailnets: automatische
  LAN-Erkennung über Bonjour, vom Gateway verwaltete Kopplungstoken und ACLs
  sowie kein erforderlicher Shell-Zugriff.
- **SSH** ist der universelle Fallback: funktioniert überall, wo SSH-Zugriff besteht, auch
  über voneinander unabhängige Netzwerke hinweg, ist unempfindlich gegenüber Multicast-/mDNS-Problemen und benötigt außer SSH
  keinen neuen eingehenden Port.

## Erkennungsquellen

### 1) Bonjour / DNS-SD

Multicast-Bonjour arbeitet nach dem Best-Effort-Prinzip und überschreitet keine Netzwerkgrenzen. OpenClaw
unterstützt außerdem das Durchsuchen desselben Gateway-Beacons über eine konfigurierte Wide-Area-DNS-SD-
Domain, sodass die Erkennung sowohl `local.` im selben LAN als auch eine konfigurierte
Unicast-DNS-SD-Domain zur netzwerkübergreifenden Erkennung abdecken kann.

Das **Gateway** kündigt seinen WS-Endpunkt über Bonjour an, wenn das mitgelieferte
Plugin `bonjour` aktiviert ist; Clients suchen danach und zeigen eine Liste zur Auswahl eines Gateways an,
anschließend speichern sie den gewählten Endpunkt.

Fehlerbehebung und Beacon-Details: [Bonjour](/de/gateway/bonjour).

#### Details zum Service-Beacon

- Servicetyp: `_openclaw-gw._tcp` (Beacon für den Gateway-Transport).
- TXT-Schlüssel (nicht geheim):

  | Schlüssel                    | Hinweise                                                                                                                                                         |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Immer vorhanden.                                                                                                                                                 |
  | `transport=gateway`         | Immer vorhanden.                                                                                                                                                 |
  | `displayName=<name>`        | Vom Bedienpersonal konfigurierter Anzeigename.                                                                                                                   |
  | `lanHost=<hostname>.local`  | Nur LAN-mDNS-Ankündiger; wird nicht von Wide-Area-DNS-SD geschrieben.                                                                                            |
  | `gatewayPort=18789`         | Gateway-WS- und HTTP-Port.                                                                                                                                       |
  | `gatewayTls=1`              | Nur bei aktiviertem TLS.                                                                                                                                         |
  | `gatewayTlsSha256=<sha256>` | Nur bei aktiviertem TLS und verfügbarem Fingerabdruck.                                                                                                           |
  | `tailnetDns=<magicdns>`     | Optionaler Hinweis; wird automatisch erkannt, wenn Tailscale verfügbar ist.                                                                                      |
  | `sshPort=<port>`            | Nur vorhanden, wenn `discovery.mdns.mode="full"`; im standardmäßigen Modus `"minimal"` ausgelassen (SSH verwendet standardmäßig `22`), sowohl beim LAN-Ankündiger als auch bei Wide-Area-DNS-SD. |
  | `cliPath=<path>`            | Dieselbe `discovery.mdns.mode="full"`-Bedingung wie bei `sshPort`; ein Hinweis für die Remote-Installation über den CLI-Pfad.                                   |

  Im Plugin-Erkennungsvertrag ist ein TXT-Schlüssel `canvasPort` für einen
  zukünftigen Canvas-Host-Port definiert. Da jedoch kein aktueller Codepfad einen Wert festlegt, wird er
  derzeit nie ausgegeben.

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients dürfen TXT-
  Werte nur als Hinweise für die Benutzeroberfläche behandeln.
- Beim Routing (Host/Port) sollte der **aufgelöste Service-Endpunkt**
  (SRV + A/AAAA) gegenüber den über TXT bereitgestellten Werten `lanHost`, `tailnetDns` oder `gatewayPort` bevorzugt werden.
- Beim TLS-Pinning darf ein angekündigter Wert `gatewayTlsSha256` niemals einen
  zuvor gespeicherten Pin überschreiben.
- iOS-/Android-Nodes sollten vor dem erstmaligen Speichern eines Pins eine ausdrückliche
  Bestätigung „Diesem Fingerabdruck vertrauen“ verlangen (Verifizierung außerhalb des Übertragungskanals),
  wenn die gewählte Route sicher bzw. TLS-basiert ist.

Aktivieren, deaktivieren und überschreiben:

- `openclaw plugins enable bonjour` aktiviert Multicast-Ankündigungen im LAN.
- `discovery.mdns.mode` in `openclaw.json` steuert die mDNS-Übertragung:
  `"minimal"` (Standard), `"full"` (fügt `cliPath`/`sshPort` sowohl dem LAN-
  Beacon als auch jeder Wide-Area-DNS-SD-Zone hinzu) oder `"off"` (deaktiviert mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` erzwingt die Deaktivierung von Ankündigungen; `discovery.mdns.mode="off"`
  deaktiviert sie unabhängig davon. `OPENCLAW_DISABLE_BONJOUR=0` ist eine ausdrückliche
  Zustimmung, welche die automatische Deaktivierung des Plugins innerhalb eines erkannten Containers
  (Docker, containerd, Kubernetes, LXC) außer Kraft setzt; `discovery.mdns.mode="off"` wird dadurch nicht
  überschrieben. Das mitgelieferte Plugin `bonjour` startet auf
  macOS-Hosts automatisch (`enabledByDefaultOnPlatforms: ["darwin"]`) und deaktiviert sich
  innerhalb erkannter Container automatisch; unter Linux, Windows und in anderen containerisierten
  Bereitstellungen muss `plugins enable bonjour` ausdrücklich festgelegt werden.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bindungsmodus des Gateways.
- `OPENCLAW_SSH_PORT` überschreibt den angekündigten SSH-Port (wirkt sich nur aus,
  wenn `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen Hinweis `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad.

### 2) Tailnet (netzwerkübergreifend)

Bei Gateways in unterschiedlichen physischen Netzwerken hilft Bonjour nicht. Das
empfohlene direkte Ziel ist ein Tailscale-MagicDNS-Name (bevorzugt) oder eine
stabile Tailnet-IP.

Wenn das Gateway erkennt, dass es unter Tailscale ausgeführt wird, veröffentlicht es
`tailnetDns` als optionalen Hinweis für Clients (einschließlich Wide-Area-Beacons).
Die macOS-App bevorzugt MagicDNS-Namen gegenüber unformatierten Tailscale-IPs für die Gateway-
Erkennung. Diese bleibt zuverlässig, wenn sich Tailnet-IPs ändern (Node-Neustarts,
CGNAT-Neuzuweisung), da MagicDNS automatisch zur aktuellen IP auflöst.

Bei der Kopplung mobiler Nodes lockern Erkennungshinweise niemals die Transportsicherheit auf
Tailnet-/öffentlichen Routen:

- iOS/Android erfordern für die erstmalige Verbindung über Tailnet/öffentliche Netze weiterhin einen sicheren Pfad
  (`wss://` oder Tailscale Serve/Funnel).
- Eine erkannte unformatierte Tailnet-IP ist ein Routinghinweis und keine Berechtigung zur Verwendung
  einer unverschlüsselten Remote-Verbindung über `ws://`.
- Direktverbindungen über `ws://` in privaten LANs werden weiterhin unterstützt.
- Für den einfachsten Tailscale-Pfad auf mobilen Nodes verwenden Sie Tailscale Serve, sodass
  sowohl die Erkennung als auch die Einrichtung zum selben sicheren MagicDNS-Endpunkt auflösen.

### 3) Manuelles / SSH-Ziel

Wenn keine direkte Route vorhanden ist (oder Direktverbindungen deaktiviert sind), können Clients jederzeit
über SSH eine Verbindung herstellen, indem sie den Loopback-Gateway-Port weiterleiten. Siehe
[Remote-Zugriff](/de/gateway/remote).

## Transportauswahl (Client-Richtlinie)

1. Wenn ein gekoppelter direkter Endpunkt konfiguriert und erreichbar ist, verwenden Sie ihn.
2. Andernfalls: Wenn die Erkennung ein Gateway auf `local.` oder in der konfigurierten Wide-Area-
   Domain findet, bieten Sie eine mit einmaligem Tippen auswählbare Option „Dieses Gateway verwenden“ an und speichern Sie es als
   direkten Endpunkt.
3. Andernfalls: Wenn eine Tailnet-DNS/IP konfiguriert ist, versuchen Sie eine Direktverbindung. Für mobile Nodes auf
   Tailnet-/öffentlichen Routen bezeichnet „direkt“ einen sicheren Endpunkt und keine unverschlüsselte
   Remote-Verbindung über `ws://`.
4. Andernfalls verwenden Sie SSH als Fallback.

## Kopplung und Authentifizierung (direkter Transport)

Das Gateway ist die maßgebliche Instanz für die Zulassung von Nodes/Clients:

- Kopplungsanfragen werden im Gateway erstellt, genehmigt oder abgelehnt (siehe
  [Gateway-Kopplung](/de/gateway/pairing)).
- Das Gateway erzwingt die Authentifizierung (Token/Schlüsselpaar), Geltungsbereiche/ACLs (es ist kein unbeschränkter
  Proxy für jede Methode) und Ratenbegrenzungen.

## Zuständigkeiten nach Komponente

- **Gateway**: kündigt Erkennungs-Beacons an, verwaltet Kopplungsentscheidungen und hostet
  den WS-Endpunkt.
- **macOS-App**: unterstützt Sie bei der Auswahl eines Gateways, zeigt Kopplungsaufforderungen an und verwendet SSH
  nur als Fallback.
- **iOS-/Android-Nodes**: durchsuchen Bonjour zur Vereinfachung und stellen eine Verbindung zum
  gekoppelten Gateway-WS her.

## Verwandte Themen

- [Remote-Zugriff](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
- [Bonjour-Erkennung](/de/gateway/bonjour)
