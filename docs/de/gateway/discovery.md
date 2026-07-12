---
read_when:
    - Bonjour-Erkennung/-Ankündigung implementieren oder ändern
    - Remote-Verbindungsmodi anpassen (direkt oder über SSH)
    - Konzeption der Node-Erkennung und -Kopplung für Remote-Nodes
summary: Node-Erkennung und Transportwege (Bonjour, Tailscale, SSH) zum Auffinden des Gateways
title: Erkennung und Transportwege
x-i18n:
    generated_at: "2026-07-12T01:39:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw hat zwei zusammenhängende, aber unterschiedliche Erkennungsprobleme:

1. **Fernsteuerung durch den Betreiber**: Die macOS-Menüleisten-App steuert einen Gateway, der auf einem anderen System ausgeführt wird.
2. **Node-Kopplung**: iOS/Android (und zukünftige Nodes) finden einen Gateway und koppeln sich sicher mit ihm.

Die gesamte Netzwerkerkennung und -ankündigung erfolgt im **Node-Gateway**
(`openclaw gateway`); Clients (Mac-App, iOS) sind ausschließlich Empfänger.

## Begriffe

- **Gateway**: ein einzelner, dauerhaft laufender Prozess, der den Zustand verwaltet (Sitzungen,
  Kopplung, Node-Registrierung) und Kanäle ausführt. Die meisten Konfigurationen verwenden einen pro Host;
  isolierte Konfigurationen mit mehreren Gateways sind möglich.
- **Gateway-WS (Steuerungsebene)**: der WebSocket-Endpunkt, standardmäßig unter `127.0.0.1:18789`;
  binden Sie ihn über `gateway.bind` an das LAN/Tailnet.
- **Direkter WS-Transport**: ein Gateway-WS-Endpunkt, der über das LAN/Tailnet erreichbar ist (ohne SSH).
- **SSH-Transport (Fallback)**: Fernsteuerung durch Weiterleitung von
  `127.0.0.1:18789` über SSH.
- **Veraltete TCP-Bridge (entfernt)**: älterer Node-Transport (siehe
  [Bridge-Protokoll](/de/gateway/bridge-protocol)); wird nicht mehr zur
  Erkennung angekündigt und ist nicht mehr Bestandteil aktueller Builds.

Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol),
[Bridge-Protokoll (veraltet)](/de/gateway/bridge-protocol).

## Warum sowohl direkter Transport als auch SSH vorhanden sind

- **Direkter WS-Transport** bietet im selben Netzwerk und innerhalb eines Tailnets die beste Benutzererfahrung: automatische
  LAN-Erkennung über Bonjour, vom Gateway verwaltete Kopplungstoken und ACLs
  sowie kein erforderlicher Shell-Zugriff.
- **SSH** ist der universelle Fallback: funktioniert überall, wo Sie SSH-Zugriff haben, selbst
  über voneinander unabhängige Netzwerke hinweg, ist unempfindlich gegenüber Multicast-/mDNS-Problemen und benötigt neben SSH
  keinen neuen eingehenden Port.

## Erkennungsquellen

### 1) Bonjour/DNS-SD

Multicast-Bonjour funktioniert nach dem Best-Effort-Prinzip und nicht netzwerkübergreifend. OpenClaw
unterstützt außerdem die Suche nach demselben Gateway-Signal über eine konfigurierte Wide-Area-DNS-SD-
Domain, sodass die Erkennung sowohl `local.` im selben LAN als auch eine konfigurierte
Unicast-DNS-SD-Domain für die netzwerkübergreifende Erkennung abdecken kann.

Der **Gateway** kündigt seinen WS-Endpunkt über Bonjour an, wenn das mitgelieferte
`bonjour`-Plugin aktiviert ist; Clients suchen danach und zeigen eine Liste zur Auswahl eines Gateways an,
anschließend speichern sie den ausgewählten Endpunkt.

Details zur Fehlerbehebung und zum Signal: [Bonjour](/de/gateway/bonjour).

#### Details zum Dienstsignal

- Diensttyp: `_openclaw-gw._tcp` (Gateway-Transportsignal).
- TXT-Schlüssel (nicht geheim):

  | Schlüssel                    | Hinweise                                                                                                                                                         |
  | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`               | Immer vorhanden.                                                                                                                                                 |
  | `transport=gateway`          | Immer vorhanden.                                                                                                                                                 |
  | `displayName=<name>`         | Vom Betreiber konfigurierter Anzeigename.                                                                                                                        |
  | `lanHost=<hostname>.local`   | Nur LAN-mDNS-Ankündiger; wird nicht von Wide-Area-DNS-SD geschrieben.                                                                                            |
  | `gatewayPort=18789`          | Gateway-WS- und HTTP-Port.                                                                                                                                       |
  | `gatewayTls=1`               | Nur wenn TLS aktiviert ist.                                                                                                                                      |
  | `gatewayTlsSha256=<sha256>`  | Nur wenn TLS aktiviert und ein Fingerabdruck verfügbar ist.                                                                                                      |
  | `tailnetDns=<magicdns>`      | Optionaler Hinweis; wird automatisch erkannt, wenn Tailscale verfügbar ist.                                                                                       |
  | `sshPort=<port>`             | Nur vorhanden, wenn `discovery.mdns.mode="full"` gilt; im standardmäßigen Modus `"minimal"` entfällt der Eintrag (SSH verwendet standardmäßig `22`), sowohl beim LAN-Ankündiger als auch bei Wide-Area-DNS-SD. |
  | `cliPath=<path>`             | Unterliegt derselben Bedingung `discovery.mdns.mode="full"` wie `sshPort`; ein Hinweis auf den CLI-Pfad der Remote-Installation.                                  |

  Ein TXT-Schlüssel `canvasPort` ist im Plugin-Erkennungsvertrag für einen
  zukünftigen Canvas-Host-Port definiert, aber derzeit setzt kein Codepfad einen Wert, sodass er
  aktuell nie ausgegeben wird.

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients dürfen TXT-
  Werte nur als Hinweise für die Benutzerführung behandeln.
- Beim Routing (Host/Port) sollte der **aufgelöste Dienstendpunkt**
  (SRV + A/AAAA) gegenüber den über TXT bereitgestellten Werten `lanHost`, `tailnetDns` oder `gatewayPort` bevorzugt werden.
- Beim TLS-Pinning darf ein angekündigter `gatewayTlsSha256` niemals einen
  zuvor gespeicherten Pin überschreiben.
- iOS-/Android-Nodes sollten eine ausdrückliche Bestätigung zum Vertrauen dieses Fingerabdrucks
  verlangen, bevor sie einen erstmaligen Pin speichern (Überprüfung über einen separaten Kanal),
  wenn die ausgewählte Route sicher beziehungsweise TLS-basiert ist.

Aktivieren, deaktivieren und überschreiben:

- `openclaw plugins enable bonjour` aktiviert die LAN-Multicast-Ankündigung.
- `discovery.mdns.mode` in `openclaw.json` steuert die mDNS-Übertragung:
  `"minimal"` (Standard), `"full"` (fügt `cliPath`/`sshPort` sowohl dem LAN-
  Signal als auch jeder Wide-Area-DNS-SD-Zone hinzu) oder `"off"` (deaktiviert mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` erzwingt die Deaktivierung der Ankündigung; `discovery.mdns.mode="off"`
  deaktiviert sie unabhängig davon. `OPENCLAW_DISABLE_BONJOUR=0` ist eine ausdrückliche
  Aktivierung, welche die automatische Deaktivierung des Plugins innerhalb eines erkannten Containers
  (Docker, containerd, Kubernetes, LXC) außer Kraft setzt; sie überschreibt
  `discovery.mdns.mode="off"` nicht. Das mitgelieferte `bonjour`-Plugin startet automatisch auf
  macOS-Hosts (`enabledByDefaultOnPlatforms: ["darwin"]`) und deaktiviert sich automatisch
  innerhalb erkannter Container; Linux, Windows und andere containerisierte
  Bereitstellungen erfordern ein ausdrückliches `plugins enable bonjour`.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bindungsmodus des Gateways.
- `OPENCLAW_SSH_PORT` überschreibt den angekündigten SSH-Port (wirkt sich nur aus,
  wenn `discovery.mdns.mode="full"` gilt).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen `tailnetDns`-Hinweis (MagicDNS).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad.

### 2) Tailnet (netzwerkübergreifend)

Für Gateways in unterschiedlichen physischen Netzwerken ist Bonjour nicht hilfreich. Das
empfohlene direkte Ziel ist ein Tailscale-MagicDNS-Name (bevorzugt) oder eine
stabile Tailnet-IP-Adresse.

Wenn der Gateway erkennt, dass er unter Tailscale ausgeführt wird, veröffentlicht er
`tailnetDns` als optionalen Hinweis für Clients (einschließlich Wide-Area-Signalen).
Die macOS-App bevorzugt bei der Gateway-Erkennung MagicDNS-Namen gegenüber unverarbeiteten Tailscale-IP-Adressen.
Dies bleibt auch bei Änderungen der Tailnet-IP-Adressen zuverlässig (Node-Neustarts,
CGNAT-Neuzuweisung), da MagicDNS automatisch zur aktuellen IP-Adresse auflöst.

Bei der Kopplung mobiler Nodes lockern Erkennungshinweise niemals die Transportsicherheit auf
Tailnet-/öffentlichen Routen:

- iOS/Android erfordern weiterhin einen sicheren Pfad für die erstmalige Verbindung über ein Tailnet oder öffentliches Netzwerk
  (`wss://` oder Tailscale Serve/Funnel).
- Eine erkannte unverarbeitete Tailnet-IP-Adresse ist ein Routing-Hinweis und keine Berechtigung zur Verwendung
  eines unverschlüsselten entfernten `ws://`.
- Direkte private LAN-Verbindungen über `ws://` werden weiterhin unterstützt.
- Verwenden Sie für den einfachsten Tailscale-Pfad auf mobilen Nodes Tailscale Serve, damit
  Erkennung und Einrichtung beide zum selben sicheren MagicDNS-Endpunkt auflösen.

### 3) Manuelles/SSH-Ziel

Wenn keine direkte Route vorhanden ist (oder die direkte Verbindung deaktiviert ist), können Clients jederzeit
über SSH eine Verbindung herstellen, indem sie den local-loopback-Port des Gateways weiterleiten. Siehe
[Remotezugriff](/de/gateway/remote).

## Transportauswahl (Client-Richtlinie)

1. Wenn ein gekoppelter direkter Endpunkt konfiguriert und erreichbar ist, verwenden Sie ihn.
2. Andernfalls: Wenn die Erkennung einen Gateway unter `local.` oder in der konfigurierten Wide-Area-
   Domain findet, bieten Sie eine Auswahl „Diesen Gateway verwenden“ mit einmaligem Tippen an und speichern Sie ihn als
   direkten Endpunkt.
3. Andernfalls: Wenn eine Tailnet-DNS/IP konfiguriert ist, versuchen Sie eine direkte Verbindung. Für mobile Nodes auf
   Tailnet-/öffentlichen Routen bedeutet „direkt“ einen sicheren Endpunkt und nicht ein unverschlüsseltes
   entferntes `ws://`.
4. Andernfalls verwenden Sie SSH als Fallback.

## Kopplung und Authentifizierung (direkter Transport)

Der Gateway ist die maßgebliche Instanz für die Zulassung von Nodes und Clients:

- Kopplungsanfragen werden im Gateway erstellt, genehmigt oder abgelehnt (siehe
  [Gateway-Kopplung](/de/gateway/pairing)).
- Der Gateway erzwingt die Authentifizierung (Token/Schlüsselpaar), Geltungsbereiche/ACLs (er ist kein einfacher
  Proxy für jede Methode) und Ratenbegrenzungen.

## Zuständigkeiten nach Komponente

- **Gateway**: kündigt Erkennungssignale an, verwaltet Kopplungsentscheidungen und stellt
  den WS-Endpunkt bereit.
- **macOS-App**: unterstützt Sie bei der Auswahl eines Gateways, zeigt Kopplungsaufforderungen an und verwendet SSH
  nur als Fallback.
- **iOS-/Android-Nodes**: durchsuchen Bonjour zur Vereinfachung und stellen eine Verbindung zum
  gekoppelten Gateway-WS her.

## Verwandte Themen

- [Remotezugriff](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
- [Bonjour-Erkennung](/de/gateway/bonjour)
