---
read_when:
    - Implementieren oder Ändern der Bonjour-Erkennung/-Ankündigung
    - Remote-Verbindungsmodi anpassen (direkt vs. SSH)
    - Entwurf der Node-Erkennung und -Kopplung für Remote-Nodes
summary: Node-Erkennung und -Transporte (Bonjour, Tailscale, SSH) zum Auffinden des Gateways
title: Erkennung und Transportwege
x-i18n:
    generated_at: "2026-07-12T15:19:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw hat zwei verwandte, aber unterschiedliche Erkennungsprobleme:

1. **Fernsteuerung durch den Betreiber**: Die macOS-Menüleisten-App steuert ein Gateway, das an einem anderen Ort ausgeführt wird.
2. **Node-Kopplung**: iOS/Android (und zukünftige Nodes) finden ein Gateway und koppeln sich sicher damit.

Die gesamte Netzwerkerkennung/-ankündigung erfolgt im **Node Gateway**
(`openclaw gateway`); Clients (Mac-App, iOS) sind ausschließlich Konsumenten.

## Begriffe

- **Gateway**: ein einzelner, dauerhaft laufender Prozess, der den Zustand verwaltet (Sitzungen,
  Kopplung, Node-Registrierung) und Kanäle ausführt. Die meisten Konfigurationen verwenden einen pro Host;
  isolierte Konfigurationen mit mehreren Gateways sind möglich.
- **Gateway-WS (Steuerungsebene)**: der WebSocket-Endpunkt standardmäßig unter `127.0.0.1:18789`;
  binden Sie ihn über `gateway.bind` an das LAN/Tailnet.
- **Direkter WS-Transport**: ein zum LAN/Tailnet gerichteter Gateway-WS-Endpunkt (ohne SSH).
- **SSH-Transport (Fallback)**: Fernsteuerung durch Weiterleitung von
  `127.0.0.1:18789` über SSH.
- **Legacy-TCP-Bridge (entfernt)**: älterer Node-Transport (siehe
  [Bridge-Protokoll](/de/gateway/bridge-protocol)); wird nicht mehr zur
  Erkennung angekündigt und ist nicht mehr Bestandteil aktueller Builds.

Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol),
[Bridge-Protokoll (Legacy)](/de/gateway/bridge-protocol).

## Warum sowohl direkte Verbindungen als auch SSH existieren

- **Direktes WS** bietet die beste Benutzererfahrung im selben Netzwerk und innerhalb eines Tailnets: automatische
  LAN-Erkennung über Bonjour, vom Gateway verwaltete Kopplungstoken und ACLs
  sowie kein erforderlicher Shell-Zugriff.
- **SSH** ist der universelle Fallback: Es funktioniert überall, wo Sie SSH-Zugriff haben, selbst
  über voneinander unabhängige Netzwerke hinweg, ist unempfindlich gegenüber Multicast-/mDNS-Problemen und benötigt neben SSH
  keinen neuen eingehenden Port.

## Erkennungsquellen

### 1) Bonjour / DNS-SD

Multicast-Bonjour funktioniert nach dem Best-Effort-Prinzip und überschreitet keine Netzwerkgrenzen. OpenClaw unterstützt außerdem
das Durchsuchen desselben Gateway-Beacons über eine konfigurierte Wide-Area-DNS-SD-
Domain, sodass die Erkennung sowohl `local.` im selben LAN als auch eine konfigurierte
Unicast-DNS-SD-Domain für die netzwerkübergreifende Erkennung abdecken kann.

Das **Gateway** kündigt seinen WS-Endpunkt über Bonjour an, wenn das gebündelte
`bonjour`-Plugin aktiviert ist; Clients suchen danach und zeigen eine Liste zur Gateway-Auswahl an,
anschließend speichern sie den ausgewählten Endpunkt.

Fehlerbehebung und Beacon-Details: [Bonjour](/de/gateway/bonjour).

#### Details zum Dienst-Beacon

- Diensttyp: `_openclaw-gw._tcp` (Gateway-Transport-Beacon).
- TXT-Schlüssel (nicht geheim):

  | Schlüssel                   | Hinweise                                                                                                                                                         |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Immer vorhanden.                                                                                                                                                 |
  | `transport=gateway`         | Immer vorhanden.                                                                                                                                                 |
  | `displayName=<name>`        | Vom Betreiber konfigurierter Anzeigename.                                                                                                                        |
  | `lanHost=<hostname>.local`  | Nur LAN-mDNS-Ankündiger; wird nicht von Wide-Area-DNS-SD geschrieben.                                                                                            |
  | `gatewayPort=18789`         | Gateway-WS- und HTTP-Port.                                                                                                                                       |
  | `gatewayTls=1`              | Nur wenn TLS aktiviert ist.                                                                                                                                      |
  | `gatewayTlsSha256=<sha256>` | Nur wenn TLS aktiviert und ein Fingerabdruck verfügbar ist.                                                                                                      |
  | `tailnetDns=<magicdns>`     | Optionaler Hinweis; wird automatisch erkannt, wenn Tailscale verfügbar ist.                                                                                      |
  | `sshPort=<port>`            | Nur vorhanden, wenn `discovery.mdns.mode="full"`; im standardmäßigen Modus `"minimal"` weggelassen (SSH verwendet standardmäßig `22`), sowohl beim LAN-Ankündiger als auch bei Wide-Area-DNS-SD. |
  | `cliPath=<path>`            | Dieselbe Bedingung `discovery.mdns.mode="full"` wie bei `sshPort`; ein Hinweis auf den CLI-Pfad einer Remote-Installation.                                        |

  Im Plugin-Erkennungsvertrag ist ein TXT-Schlüssel `canvasPort` für einen
  zukünftigen Canvas-Host-Port definiert, aber kein aktueller Codepfad legt einen Wert fest, sodass er
  derzeit nie ausgegeben wird.

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients dürfen TXT-
  Werte nur als Hinweise für die Benutzerführung behandeln.
- Beim Routing (Host/Port) sollte der **aufgelöste Dienstendpunkt**
  (SRV + A/AAAA) gegenüber den per TXT bereitgestellten Werten `lanHost`, `tailnetDns` oder `gatewayPort` bevorzugt werden.
- Beim TLS-Pinning darf ein angekündigter Wert `gatewayTlsSha256` niemals einen
  zuvor gespeicherten Pin überschreiben.
- iOS-/Android-Nodes sollten eine ausdrückliche Bestätigung zum Vertrauen dieses Fingerabdrucks
  verlangen, bevor sie einen erstmaligen Pin speichern (Verifizierung über einen separaten Kanal),
  wenn die ausgewählte Route sicher bzw. TLS-basiert ist.

Aktivieren, deaktivieren und überschreiben:

- `openclaw plugins enable bonjour` aktiviert die LAN-Multicast-Ankündigung.
- `discovery.mdns.mode` in `openclaw.json` steuert die mDNS-Übertragung:
  `"minimal"` (Standard), `"full"` (fügt sowohl dem LAN-
  Beacon als auch jeder Wide-Area-DNS-SD-Zone `cliPath`/`sshPort` hinzu) oder `"off"` (deaktiviert mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert die Ankündigung erzwungenermaßen; `discovery.mdns.mode="off"`
  deaktiviert sie unabhängig davon. `OPENCLAW_DISABLE_BONJOUR=0` ist eine ausdrückliche
  Aktivierung, die die automatische Deaktivierung des Plugins in einem erkannten Container
  (Docker, containerd, Kubernetes, LXC) überschreibt; sie überschreibt nicht
  `discovery.mdns.mode="off"`. Das gebündelte `bonjour`-Plugin startet automatisch auf
  macOS-Hosts (`enabledByDefaultOnPlatforms: ["darwin"]`) und deaktiviert sich automatisch
  in erkannten Containern; Linux, Windows und andere containerisierte
  Bereitstellungen müssen `plugins enable bonjour` ausdrücklich ausführen.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bindungsmodus des Gateways.
- `OPENCLAW_SSH_PORT` überschreibt den angekündigten SSH-Port (wird nur wirksam,
  wenn `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen `tailnetDns`-Hinweis (MagicDNS).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad.

### 2) Tailnet (netzwerkübergreifend)

Bei Gateways in unterschiedlichen physischen Netzwerken hilft Bonjour nicht. Das
empfohlene direkte Ziel ist ein Tailscale-MagicDNS-Name (bevorzugt) oder eine
stabile Tailnet-IP.

Wenn das Gateway erkennt, dass es unter Tailscale ausgeführt wird, veröffentlicht es
`tailnetDns` als optionalen Hinweis für Clients (einschließlich Wide-Area-Beacons).
Die macOS-App bevorzugt MagicDNS-Namen gegenüber unverarbeiteten Tailscale-IPs für die Gateway-
Erkennung. Dies bleibt zuverlässig, wenn sich Tailnet-IPs ändern (Node-Neustarts,
CGNAT-Neuzuweisung), da MagicDNS automatisch zur aktuellen IP auflöst.

Bei der Kopplung mobiler Nodes lockern Erkennungshinweise niemals die Transportsicherheit auf
Tailnet-/öffentlichen Routen:

- iOS/Android erfordern weiterhin einen sicheren erstmaligen Verbindungspfad über das Tailnet/öffentliche Netz
  (`wss://` oder Tailscale Serve/Funnel).
- Eine erkannte unverarbeitete Tailnet-IP ist ein Routinghinweis und keine Erlaubnis,
  unverschlüsseltes Remote-`ws://` zu verwenden.
- Direkte private LAN-Verbindungen über `ws://` werden weiterhin unterstützt.
- Verwenden Sie für den einfachsten Tailscale-Pfad auf mobilen Nodes Tailscale Serve, damit
  sowohl Erkennung als auch Einrichtung zum selben sicheren MagicDNS-Endpunkt auflösen.

### 3) Manuelles / SSH-Ziel

Wenn es keine direkte Route gibt (oder direkte Verbindungen deaktiviert sind), können Clients jederzeit
über SSH eine Verbindung herstellen, indem sie den Loopback-Port des Gateways weiterleiten. Siehe
[Remotezugriff](/de/gateway/remote).

## Transportauswahl (Client-Richtlinie)

1. Wenn ein gekoppelter direkter Endpunkt konfiguriert und erreichbar ist, verwenden Sie ihn.
2. Andernfalls, wenn die Erkennung ein Gateway unter `local.` oder in der konfigurierten Wide-Area-
   Domain findet, bieten Sie eine Auswahl „Dieses Gateway verwenden“ mit einmaligem Tippen an und speichern Sie es als
   direkten Endpunkt.
3. Andernfalls, wenn eine Tailnet-DNS/IP konfiguriert ist, versuchen Sie eine direkte Verbindung. Für mobile Nodes auf
   Tailnet-/öffentlichen Routen bedeutet „direkt“ einen sicheren Endpunkt und kein unverschlüsseltes
   Remote-`ws://`.
4. Andernfalls greifen Sie auf SSH zurück.

## Kopplung und Authentifizierung (direkter Transport)

Das Gateway ist die maßgebliche Instanz für die Zulassung von Nodes/Clients:

- Kopplungsanfragen werden im Gateway erstellt/genehmigt/abgelehnt (siehe
  [Gateway-Kopplung](/de/gateway/pairing)).
- Das Gateway erzwingt die Authentifizierung (Token/Schlüsselpaar), Geltungsbereiche/ACLs (es ist kein unbeschränkter
  Proxy für jede Methode) und Ratenbegrenzungen.

## Zuständigkeiten nach Komponente

- **Gateway**: kündigt Erkennungs-Beacons an, verwaltet Kopplungsentscheidungen und hostet
  den WS-Endpunkt.
- **macOS-App**: unterstützt Sie bei der Auswahl eines Gateways, zeigt Kopplungsaufforderungen an und verwendet SSH
  nur als Fallback.
- **iOS-/Android-Nodes**: durchsuchen Bonjour als Komfortfunktion und stellen eine Verbindung zum
  gekoppelten Gateway-WS her.

## Verwandte Themen

- [Remotezugriff](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
- [Bonjour-Erkennung](/de/gateway/bonjour)
