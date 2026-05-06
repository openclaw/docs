---
read_when:
    - Bonjour-Erkennung/-Ankündigung implementieren oder ändern
    - Remote-Verbindungsmodi anpassen (direkt vs. SSH)
    - Entwurf von Node-Discovery und Pairing für entfernte Nodes
summary: Node-Erkennung und Transportwege (Bonjour, Tailscale, SSH) für die Suche nach dem Gateway
title: Erkennung und Transporte
x-i18n:
    generated_at: "2026-05-06T06:47:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw hat zwei unterschiedliche Probleme, die oberflächlich ähnlich aussehen:

1. **Operator-Fernsteuerung**: die macOS-Menüleisten-App, die einen Gateway steuert, der an anderer Stelle ausgeführt wird.
2. **Node-Kopplung**: iOS/Android (und künftige Nodes), die einen Gateway finden und sicher koppeln.

Das Designziel ist, die gesamte Netzwerkerkennung/-ankündigung im **Node Gateway** (`openclaw gateway`) zu halten und Clients (Mac-App, iOS) als Konsumenten zu behandeln.

## Begriffe

- **Gateway**: ein einzelner, dauerhaft laufender Gateway-Prozess, der den Zustand besitzt (Sitzungen, Kopplung, Node-Registrierung) und Kanäle ausführt. Die meisten Setups verwenden einen pro Host; isolierte Multi-Gateway-Setups sind möglich.
- **Gateway WS (Steuerebene)**: der WebSocket-Endpunkt standardmäßig auf `127.0.0.1:18789`; kann über `gateway.bind` an LAN/tailnet gebunden werden.
- **Direkter WS-Transport**: ein LAN-/tailnet-seitiger Gateway-WS-Endpunkt (kein SSH).
- **SSH-Transport (Fallback)**: Fernsteuerung durch Weiterleitung von `127.0.0.1:18789` über SSH.
- **Legacy-TCP-Bridge (entfernt)**: älterer Node-Transport (siehe
  [Bridge-Protokoll](/de/gateway/bridge-protocol)); wird nicht mehr für die
  Erkennung angekündigt und ist nicht mehr Teil aktueller Builds.

Protokolldetails:

- [Gateway-Protokoll](/de/gateway/protocol)
- [Bridge-Protokoll (Legacy)](/de/gateway/bridge-protocol)

## Warum wir sowohl direkt als auch SSH beibehalten

- **Direktes WS** bietet die beste UX im selben Netzwerk und innerhalb eines tailnet:
  - automatische Erkennung im LAN über Bonjour
  - Kopplungstoken + ACLs im Besitz des Gateway
  - kein Shell-Zugriff erforderlich; die Protokolloberfläche kann eng und prüfbar bleiben
- **SSH** bleibt der universelle Fallback:
  - funktioniert überall dort, wo Sie SSH-Zugriff haben (auch über unabhängige Netzwerke hinweg)
  - übersteht Multicast-/mDNS-Probleme
  - erfordert außer SSH keine neuen eingehenden Ports

## Erkennungsquellen (wie Clients erfahren, wo der Gateway ist)

### 1) Bonjour- / DNS-SD-Erkennung

Multicast-Bonjour ist Best-Effort und überschreitet keine Netzwerkgrenzen. OpenClaw kann denselben Gateway-Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain durchsuchen, sodass die Erkennung Folgendes abdecken kann:

- `local.` im selben LAN
- eine konfigurierte Unicast-DNS-SD-Domain für netzwerkübergreifende Erkennung

Zielrichtung:

- Der **Gateway** kündigt seinen WS-Endpunkt über Bonjour an, wenn das gebündelte
  `bonjour`-Plugin aktiviert ist. Das Plugin startet auf macOS-Hosts automatisch
  und ist andernorts Opt-in.
- Clients durchsuchen und zeigen eine Liste „Gateway auswählen“ an und speichern anschließend den gewählten Endpunkt.

Fehlerbehebung und Beacon-Details: [Bonjour](/de/gateway/bonjour).

#### Service-Beacon-Details

- Servicetypen:
  - `_openclaw-gw._tcp` (Gateway-Transport-Beacon)
- TXT-Schlüssel (nicht geheim):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (vom Operator konfigurierter Anzeigename)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (nur wenn TLS aktiviert ist)
  - `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und ein Fingerabdruck verfügbar ist)
  - `canvasPort=<port>` (Canvas-Host-Port; derzeit identisch mit `gatewayPort`, wenn der Canvas-Host aktiviert ist)
  - `tailnetDns=<magicdns>` (optionaler Hinweis; automatisch erkannt, wenn Tailscale verfügbar ist)
  - `sshPort=<port>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD kann dies auslassen, in diesem Fall bleiben SSH-Standardwerte bei `22`)
  - `cliPath=<path>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD schreibt dies weiterhin als Remote-Installationshinweis)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients müssen TXT-Werte nur als UX-Hinweise behandeln.
- Routing (Host/Port) sollte den **aufgelösten Service-Endpunkt** (SRV + A/AAAA) gegenüber per TXT bereitgestellten `lanHost`, `tailnetDns` oder `gatewayPort` bevorzugen.
- TLS-Pinning darf niemals zulassen, dass ein angekündigtes `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten eine explizite Bestätigung „diesem Fingerabdruck vertrauen“ verlangen, bevor ein erstmaliger Pin gespeichert wird (Out-of-Band-Verifizierung), wenn die gewählte Route sicher/TLS-basiert ist.

Aktivieren/deaktivieren/überschreiben:

- `openclaw plugins enable bonjour` aktiviert LAN-Multicast-Ankündigungen.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert Ankündigungen.
- Wenn das Bonjour-Plugin aktiviert und `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist,
  kündigt Bonjour auf normalen Hosts an und deaktiviert sich automatisch in erkannten Containern.
  Ein macOS-Gateway-Start mit leerer Konfiguration aktiviert das Plugin automatisch; Linux-,
  Windows- und containerisierte Deployments benötigen eine explizite Aktivierung.
  Verwenden Sie `0` nur auf Host, macvlan oder einem anderen mDNS-fähigen Netzwerk; verwenden Sie `1`, um
  die Deaktivierung zu erzwingen.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Gateway-Bind-Modus.
- `OPENCLAW_SSH_PORT` überschreibt den angekündigten SSH-Port, wenn `sshPort` ausgegeben wird.
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen `tailnetDns`-Hinweis (MagicDNS).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad.

### 2) Tailnet (netzwerkübergreifend)

Für Setups im Stil London/Wien hilft Bonjour nicht. Das empfohlene „direkte“ Ziel ist:

- Tailscale-MagicDNS-Name (bevorzugt) oder eine stabile tailnet-IP.

Wenn der Gateway erkennen kann, dass er unter Tailscale läuft, veröffentlicht er `tailnetDns` als optionalen Hinweis für Clients (einschließlich Wide-Area-Beacons).

Die macOS-App bevorzugt jetzt MagicDNS-Namen gegenüber rohen Tailscale-IPs für die Gateway-Erkennung. Dies verbessert die Zuverlässigkeit, wenn sich tailnet-IPs ändern (z. B. nach Node-Neustarts oder CGNAT-Neuzuweisung), weil MagicDNS-Namen automatisch zur aktuellen IP auflösen.

Für die Kopplung mobiler Nodes lockern Erkennungshinweise die Transportsicherheit auf tailnet-/öffentlichen Routen nicht:

- iOS/Android verlangen weiterhin einen sicheren erstmaligen tailnet-/öffentlichen Verbindungspfad (`wss://` oder Tailscale Serve/Funnel).
- Eine erkannte rohe tailnet-IP ist ein Routing-Hinweis, keine Erlaubnis, entferntes Klartext-`ws://` zu verwenden.
- Privater LAN-Direktverbindungs-`ws://` bleibt unterstützt.
- Wenn Sie den einfachsten Tailscale-Pfad für mobile Nodes möchten, verwenden Sie Tailscale Serve, sodass sowohl die Erkennung als auch der Setup-Code zum selben sicheren MagicDNS-Endpunkt auflösen.

### 3) Manuelles / SSH-Ziel

Wenn es keine direkte Route gibt (oder direkt deaktiviert ist), können Clients immer per SSH verbinden, indem sie den local loopback-Gateway-Port weiterleiten.

Siehe [Remotezugriff](/de/gateway/remote).

## Transportauswahl (Client-Richtlinie)

Empfohlenes Client-Verhalten:

1. Wenn ein gekoppelter direkter Endpunkt konfiguriert und erreichbar ist, verwenden Sie ihn.
2. Andernfalls, wenn die Erkennung einen Gateway auf `local.` oder in der konfigurierten Wide-Area-Domain findet, bieten Sie eine One-Tap-Auswahl „Diesen Gateway verwenden“ an und speichern Sie ihn als direkten Endpunkt.
3. Andernfalls, wenn eine tailnet-DNS/IP konfiguriert ist, versuchen Sie direkt zu verbinden.
   Für mobile Nodes auf tailnet-/öffentlichen Routen bedeutet direkt einen sicheren Endpunkt, nicht entferntes Klartext-`ws://`.
4. Andernfalls auf SSH zurückfallen.

## Kopplung + Authentifizierung (direkter Transport)

Der Gateway ist die Source of Truth für die Zulassung von Nodes/Clients.

- Kopplungsanfragen werden im Gateway erstellt/genehmigt/abgelehnt (siehe [Gateway-Kopplung](/de/gateway/pairing)).
- Der Gateway erzwingt:
  - Authentifizierung (Token / Schlüsselpaar)
  - Bereiche/ACLs (der Gateway ist kein roher Proxy zu jeder Methode)
  - Ratenbegrenzungen

## Verantwortlichkeiten nach Komponente

- **Gateway**: kündigt Erkennungs-Beacons an, besitzt Kopplungsentscheidungen und hostet den WS-Endpunkt.
- **macOS-App**: hilft Ihnen, einen Gateway auszuwählen, zeigt Kopplungsaufforderungen an und verwendet SSH nur als Fallback.
- **iOS-/Android-Nodes**: durchsuchen Bonjour als Komfortfunktion und verbinden sich mit dem gekoppelten Gateway WS.

## Verwandte Themen

- [Remotezugriff](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
- [Bonjour-Erkennung](/de/gateway/bonjour)
