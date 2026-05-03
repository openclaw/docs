---
read_when:
    - Implementieren oder Ändern der Bonjour-Erkennung/-Ankündigung
    - Remote-Verbindungsmodi anpassen (direkt vs. SSH)
    - Node-Erkennung + Kopplung für entfernte Nodes entwerfen
summary: Node-Erkennung und Transportmethoden (Bonjour, Tailscale, SSH) zum Auffinden des Gateway
title: Erkennung und Transporte
x-i18n:
    generated_at: "2026-05-03T21:32:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# Diensterkennung & Transporte

OpenClaw hat zwei unterschiedliche Probleme, die oberflächlich ähnlich aussehen:

1. **Operator-Fernsteuerung**: die macOS-Menüleisten-App, die ein Gateway steuert, das anderswo läuft.
2. **Node-Pairing**: iOS/Android (und zukünftige Nodes), die ein Gateway finden und sich sicher koppeln.

Das Designziel ist, die gesamte Netzwerkerkennung/-ankündigung im **Node Gateway** (`openclaw gateway`) zu halten und Clients (Mac-App, iOS) als Konsumenten zu behandeln.

## Begriffe

- **Gateway**: ein einzelner, dauerhaft laufender Gateway-Prozess, der den Zustand besitzt (Sitzungen, Pairing, Node-Registry) und Channels ausführt. Die meisten Setups verwenden eines pro Host; isolierte Multi-Gateway-Setups sind möglich.
- **Gateway WS (Steuerungsebene)**: der WebSocket-Endpunkt standardmäßig auf `127.0.0.1:18789`; kann über `gateway.bind` an LAN/Tailnet gebunden werden.
- **Direkter WS-Transport**: ein LAN-/Tailnet-seitiger Gateway-WS-Endpunkt (kein SSH).
- **SSH-Transport (Fallback)**: Fernsteuerung durch Weiterleiten von `127.0.0.1:18789` über SSH.
- **Legacy-TCP-Bridge (entfernt)**: älterer Node-Transport (siehe
  [Bridge-Protokoll](/de/gateway/bridge-protocol)); wird für die
  Diensterkennung nicht mehr angekündigt und ist nicht mehr Teil aktueller Builds.

Protokolldetails:

- [Gateway-Protokoll](/de/gateway/protocol)
- [Bridge-Protokoll (Legacy)](/de/gateway/bridge-protocol)

## Warum wir sowohl „direkt“ als auch SSH beibehalten

- **Direktes WS** bietet die beste UX im selben Netzwerk und innerhalb eines Tailnets:
  - automatische Diensterkennung im LAN über Bonjour
  - Pairing-Tokens + ACLs, die vom Gateway verwaltet werden
  - kein Shell-Zugriff erforderlich; die Protokolloberfläche kann eng und prüfbar bleiben
- **SSH** bleibt der universelle Fallback:
  - funktioniert überall dort, wo Sie SSH-Zugriff haben (auch über unabhängige Netzwerke hinweg)
  - übersteht Multicast-/mDNS-Probleme
  - erfordert außer SSH keine neuen eingehenden Ports

## Discovery-Eingaben (wie Clients erfahren, wo sich das Gateway befindet)

### 1) Bonjour- / DNS-SD-Diensterkennung

Multicast-Bonjour ist Best-Effort und überschreitet keine Netzwerkgrenzen. OpenClaw kann dasselbe Gateway-Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain durchsuchen, sodass die Diensterkennung Folgendes abdecken kann:

- `local.` im selben LAN
- eine konfigurierte Unicast-DNS-SD-Domain für netzwerkübergreifende Diensterkennung

Zielrichtung:

- Das **Gateway** kündigt seinen WS-Endpunkt über Bonjour an, wenn das gebündelte
  `bonjour` Plugin aktiviert ist. Das Plugin startet auf macOS-Hosts automatisch und ist
  andernorts optional.
- Clients durchsuchen die Umgebung und zeigen eine Liste „Gateway auswählen“ an; anschließend speichern sie den gewählten Endpunkt.

Fehlerbehebung und Beacon-Details: [Bonjour](/de/gateway/bonjour).

#### Details zum Service-Beacon

- Diensttypen:
  - `_openclaw-gw._tcp` (Gateway-Transport-Beacon)
- TXT-Schlüssel (nicht geheim):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (operator-konfigurierter Anzeigename)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (nur wenn TLS aktiviert ist)
  - `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und ein Fingerprint verfügbar ist)
  - `canvasPort=<port>` (Canvas-Host-Port; derzeit derselbe wie `gatewayPort`, wenn der Canvas-Host aktiviert ist)
  - `tailnetDns=<magicdns>` (optionaler Hinweis; automatisch erkannt, wenn Tailscale verfügbar ist)
  - `sshPort=<port>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD kann dies weglassen, in diesem Fall bleiben die SSH-Standardwerte bei `22`)
  - `cliPath=<path>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD schreibt dies weiterhin als Hinweis für Remote-Installationen)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients müssen TXT-Werte nur als UX-Hinweise behandeln.
- Routing (Host/Port) sollte den **aufgelösten Dienstendpunkt** (SRV + A/AAAA) gegenüber per TXT bereitgestellten Werten wie `lanHost`, `tailnetDns` oder `gatewayPort` bevorzugen.
- TLS-Pinning darf niemals zulassen, dass ein angekündigtes `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten eine ausdrückliche Bestätigung „diesem Fingerprint vertrauen“ verlangen, bevor ein erstmaliger Pin gespeichert wird (Out-of-Band-Verifizierung), wenn die gewählte Route sicher/TLS-basiert ist.

Aktivieren/deaktivieren/überschreiben:

- `openclaw plugins enable bonjour` aktiviert LAN-Multicast-Ankündigungen.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert Ankündigungen.
- Wenn das Bonjour-Plugin aktiviert ist und `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist,
  kündigt Bonjour auf normalen Hosts an und deaktiviert sich automatisch in erkannten Containern.
  Ein macOS-Gateway-Start mit leerer Konfiguration aktiviert das Plugin automatisch; Linux,
  Windows und containerisierte Deployments müssen explizit aktiviert werden.
  Verwenden Sie `0` nur auf Host-, macvlan- oder einem anderen mDNS-fähigen Netzwerk; verwenden Sie `1`, um
  eine Deaktivierung zu erzwingen.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateway.
- `OPENCLAW_SSH_PORT` überschreibt den angekündigten SSH-Port, wenn `sshPort` ausgegeben wird.
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen `tailnetDns`-Hinweis (MagicDNS).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad.

### 2) Tailnet (netzwerkübergreifend)

Für Setups im Stil London/Wien hilft Bonjour nicht. Das empfohlene „direkte“ Ziel ist:

- Tailscale-MagicDNS-Name (bevorzugt) oder eine stabile Tailnet-IP.

Wenn das Gateway erkennen kann, dass es unter Tailscale läuft, veröffentlicht es `tailnetDns` als optionalen Hinweis für Clients (einschließlich Wide-Area-Beacons).

Die macOS-App bevorzugt jetzt MagicDNS-Namen gegenüber rohen Tailscale-IPs für die Gateway-Erkennung. Das verbessert die Zuverlässigkeit, wenn sich Tailnet-IPs ändern (zum Beispiel nach Node-Neustarts oder CGNAT-Neuzuweisung), da MagicDNS-Namen automatisch zur aktuellen IP auflösen.

Für das Pairing mobiler Nodes lockern Discovery-Hinweise die Transportsicherheit auf Tailnet-/öffentlichen Routen nicht:

- iOS/Android erfordern weiterhin einen sicheren erstmaligen Tailnet-/öffentlichen Verbindungspfad (`wss://` oder Tailscale Serve/Funnel).
- Eine erkannte rohe Tailnet-IP ist ein Routing-Hinweis, keine Berechtigung, entferntes Klartext-`ws://` zu verwenden.
- Private direkte LAN-Verbindungen per `ws://` bleiben unterstützt.
- Wenn Sie den einfachsten Tailscale-Pfad für mobile Nodes möchten, verwenden Sie Tailscale Serve, damit Diensterkennung und Setup-Code beide zum selben sicheren MagicDNS-Endpunkt auflösen.

### 3) Manuelles / SSH-Ziel

Wenn es keine direkte Route gibt (oder die direkte Verbindung deaktiviert ist), können Clients immer per SSH verbinden, indem sie den Loopback-Gateway-Port weiterleiten.

Siehe [Remote-Zugriff](/de/gateway/remote).

## Transportauswahl (Client-Richtlinie)

Empfohlenes Client-Verhalten:

1. Wenn ein gekoppelter direkter Endpunkt konfiguriert und erreichbar ist, verwenden Sie ihn.
2. Andernfalls, wenn die Diensterkennung ein Gateway auf `local.` oder in der konfigurierten Wide-Area-Domain findet, bieten Sie eine One-Tap-Auswahl „Dieses Gateway verwenden“ an und speichern Sie sie als direkten Endpunkt.
3. Andernfalls, wenn eine Tailnet-DNS/IP konfiguriert ist, versuchen Sie eine direkte Verbindung.
   Für mobile Nodes auf Tailnet-/öffentlichen Routen bedeutet direkt einen sicheren Endpunkt, kein entferntes Klartext-`ws://`.
4. Andernfalls auf SSH zurückfallen.

## Pairing + Auth (direkter Transport)

Das Gateway ist die maßgebliche Quelle für die Zulassung von Nodes/Clients.

- Pairing-Anfragen werden im Gateway erstellt/genehmigt/abgelehnt (siehe [Gateway-Pairing](/de/gateway/pairing)).
- Das Gateway erzwingt:
  - Authentifizierung (Token / Schlüsselpaar)
  - Scopes/ACLs (das Gateway ist kein roher Proxy für jede Methode)
  - Ratenbegrenzungen

## Verantwortlichkeiten nach Komponente

- **Gateway**: kündigt Discovery-Beacons an, besitzt Pairing-Entscheidungen und hostet den WS-Endpunkt.
- **macOS-App**: hilft Ihnen, ein Gateway auszuwählen, zeigt Pairing-Aufforderungen an und verwendet SSH nur als Fallback.
- **iOS-/Android-Nodes**: durchsuchen Bonjour als Komfortfunktion und verbinden sich mit dem gekoppelten Gateway WS.

## Verwandt

- [Remote-Zugriff](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
- [Bonjour-Diensterkennung](/de/gateway/bonjour)
