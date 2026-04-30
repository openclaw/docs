---
read_when:
    - Implementieren oder Ändern der Bonjour-Erkennung/-Ankündigung
    - Remote-Verbindungsmodi anpassen (direkt vs. SSH)
    - Entwurf von Node-Erkennung + Kopplung für Remote-Nodes
summary: Node-Erkennung und Transportwege (Bonjour, Tailscale, SSH) zum Auffinden des Gateway
title: Erkennung und Transporte
x-i18n:
    generated_at: "2026-04-30T06:53:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# Erkennung & Transporte

OpenClaw hat zwei unterschiedliche Probleme, die oberflächlich ähnlich aussehen:

1. **Operator-Fernsteuerung**: die macOS-Menüleisten-App, die einen anderswo laufenden Gateway steuert.
2. **Node-Kopplung**: iOS/Android (und zukünftige Nodes), die einen Gateway finden und sich sicher koppeln.

Das Designziel besteht darin, die gesamte Netzwerkerkennung/-ankündigung im **Node Gateway** (`openclaw gateway`) zu halten und Clients (Mac-App, iOS) als Konsumenten zu belassen.

## Begriffe

- **Gateway**: ein einzelner, dauerhaft laufender Gateway-Prozess, der Zustand besitzt (Sitzungen, Kopplung, Node-Registry) und Kanäle ausführt. Die meisten Setups verwenden einen pro Host; isolierte Multi-Gateway-Setups sind möglich.
- **Gateway WS (Steuerungsebene)**: der WebSocket-Endpunkt standardmäßig auf `127.0.0.1:18789`; kann über `gateway.bind` an LAN/Tailnet gebunden werden.
- **Direkter WS-Transport**: ein Gateway-WS-Endpunkt mit LAN-/Tailnet-Zugriff (kein SSH).
- **SSH-Transport (Fallback)**: Fernsteuerung durch Weiterleitung von `127.0.0.1:18789` über SSH.
- **Legacy-TCP-Bridge (entfernt)**: älterer Node-Transport (siehe
  [Bridge-Protokoll](/de/gateway/bridge-protocol)); wird nicht mehr für
  Erkennung angekündigt und ist nicht mehr Teil aktueller Builds.

Protokolldetails:

- [Gateway-Protokoll](/de/gateway/protocol)
- [Bridge-Protokoll (Legacy)](/de/gateway/bridge-protocol)

## Warum wir sowohl „direkt“ als auch SSH beibehalten

- **Direktes WS** bietet die beste UX im selben Netzwerk und innerhalb eines Tailnets:
  - automatische Erkennung im LAN über Bonjour
  - Kopplungstokens + ACLs, die dem Gateway gehören
  - kein Shell-Zugriff erforderlich; die Protokolloberfläche kann eng und prüfbar bleiben
- **SSH** bleibt der universelle Fallback:
  - funktioniert überall, wo Sie SSH-Zugriff haben (auch über nicht zusammenhängende Netzwerke hinweg)
  - übersteht Multicast-/mDNS-Probleme
  - benötigt außer SSH keine neuen eingehenden Ports

## Erkennungseingaben (wie Clients erfahren, wo der Gateway ist)

### 1) Bonjour- / DNS-SD-Erkennung

Multicast-Bonjour ist Best-Effort und überschreitet keine Netzwerkgrenzen. OpenClaw kann dasselbe Gateway-Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain durchsuchen, sodass Erkennung Folgendes abdecken kann:

- `local.` im selben LAN
- eine konfigurierte Unicast-DNS-SD-Domain für netzwerkübergreifende Erkennung

Zielrichtung:

- Der **Gateway** kündigt seinen WS-Endpunkt über Bonjour an.
- Clients durchsuchen und zeigen eine Liste „Gateway auswählen“ an und speichern dann den gewählten Endpunkt.

Fehlerbehebung und Beacon-Details: [Bonjour](/de/gateway/bonjour).

#### Details zum Service-Beacon

- Diensttypen:
  - `_openclaw-gw._tcp` (Gateway-Transport-Beacon)
- TXT-Schlüssel (nicht geheim):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (vom Operator konfigurierter Anzeigename)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (nur wenn TLS aktiviert ist)
  - `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und der Fingerprint verfügbar ist)
  - `canvasPort=<port>` (Canvas-Host-Port; derzeit derselbe wie `gatewayPort`, wenn der Canvas-Host aktiviert ist)
  - `tailnetDns=<magicdns>` (optionaler Hinweis; automatisch erkannt, wenn Tailscale verfügbar ist)
  - `sshPort=<port>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD kann ihn weglassen, in diesem Fall bleiben die SSH-Standards bei `22`)
  - `cliPath=<path>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD schreibt ihn weiterhin als Hinweis für Remote-Installation)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients müssen TXT-Werte nur als UX-Hinweise behandeln.
- Routing (Host/Port) sollte den **aufgelösten Service-Endpunkt** (SRV + A/AAAA) gegenüber per TXT bereitgestellten `lanHost`, `tailnetDns` oder `gatewayPort` bevorzugen.
- TLS-Pinning darf niemals zulassen, dass ein angekündigtes `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten eine explizite Bestätigung „diesem Fingerprint vertrauen“ erfordern, bevor sie einen erstmaligen Pin speichern (Out-of-Band-Verifizierung), wann immer die gewählte Route sicher/TLS-basiert ist.

Deaktivieren/überschreiben:

- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert die Ankündigung.
- Wenn `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist, kündigt Bonjour auf normalen Hosts an
  und deaktiviert sich automatisch in erkannten Containern. Verwenden Sie `0` nur auf Host, macvlan
  oder einem anderen mDNS-fähigen Netzwerk; verwenden Sie `1`, um die Deaktivierung zu erzwingen.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateway.
- `OPENCLAW_SSH_PORT` überschreibt den angekündigten SSH-Port, wenn `sshPort` ausgegeben wird.
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen `tailnetDns`-Hinweis (MagicDNS).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad.

### 2) Tailnet (netzwerkübergreifend)

Für Setups im Stil von London/Wien hilft Bonjour nicht. Das empfohlene „direkte“ Ziel ist:

- Tailscale-MagicDNS-Name (bevorzugt) oder eine stabile Tailnet-IP.

Wenn der Gateway erkennen kann, dass er unter Tailscale läuft, veröffentlicht er `tailnetDns` als optionalen Hinweis für Clients (einschließlich Wide-Area-Beacons).

Die macOS-App bevorzugt jetzt MagicDNS-Namen gegenüber rohen Tailscale-IPs für die Gateway-Erkennung. Das verbessert die Zuverlässigkeit, wenn sich Tailnet-IPs ändern (zum Beispiel nach Node-Neustarts oder CGNAT-Neuzuweisung), weil MagicDNS-Namen automatisch zur aktuellen IP auflösen.

Für die Kopplung mobiler Nodes lockern Erkennungshinweise die Transportsicherheit auf Tailnet-/öffentlichen Routen nicht:

- iOS/Android erfordern weiterhin einen sicheren erstmaligen Verbindungsweg für Tailnet/öffentlich (`wss://` oder Tailscale Serve/Funnel).
- Eine entdeckte rohe Tailnet-IP ist ein Routinghinweis, keine Erlaubnis, entferntes Klartext-`ws://` zu verwenden.
- Direkte private LAN-`ws://`-Verbindungen bleiben unterstützt.
- Wenn Sie den einfachsten Tailscale-Pfad für mobile Nodes möchten, verwenden Sie Tailscale Serve, damit sowohl Erkennung als auch der Einrichtungscode zum selben sicheren MagicDNS-Endpunkt auflösen.

### 3) Manuelles / SSH-Ziel

Wenn es keine direkte Route gibt (oder direkt deaktiviert ist), können Clients immer per SSH verbinden, indem sie den Gateway-Port auf local loopback weiterleiten.

Siehe [Remote-Zugriff](/de/gateway/remote).

## Transportauswahl (Client-Richtlinie)

Empfohlenes Client-Verhalten:

1. Wenn ein gekoppelter direkter Endpunkt konfiguriert und erreichbar ist, verwenden Sie ihn.
2. Andernfalls, wenn die Erkennung einen Gateway auf `local.` oder der konfigurierten Wide-Area-Domain findet, bieten Sie eine Ein-Tipp-Auswahl „Diesen Gateway verwenden“ an und speichern Sie ihn als direkten Endpunkt.
3. Andernfalls, wenn eine Tailnet-DNS/IP konfiguriert ist, versuchen Sie direkt.
   Für mobile Nodes auf Tailnet-/öffentlichen Routen bedeutet direkt einen sicheren Endpunkt, nicht entferntes Klartext-`ws://`.
4. Andernfalls fallen Sie auf SSH zurück.

## Kopplung + Authentifizierung (direkter Transport)

Der Gateway ist die maßgebliche Quelle für die Zulassung von Nodes/Clients.

- Kopplungsanfragen werden im Gateway erstellt/genehmigt/abgelehnt (siehe [Gateway-Kopplung](/de/gateway/pairing)).
- Der Gateway erzwingt:
  - Authentifizierung (Token / Schlüsselpaar)
  - Scopes/ACLs (der Gateway ist kein Roh-Proxy zu jeder Methode)
  - Ratenbegrenzungen

## Verantwortlichkeiten nach Komponente

- **Gateway**: kündigt Erkennungs-Beacons an, besitzt Kopplungsentscheidungen und hostet den WS-Endpunkt.
- **macOS-App**: hilft Ihnen, einen Gateway auszuwählen, zeigt Kopplungsaufforderungen an und verwendet SSH nur als Fallback.
- **iOS-/Android-Nodes**: durchsuchen Bonjour als Komfortfunktion und verbinden sich mit dem gekoppelten Gateway WS.

## Verwandt

- [Remote-Zugriff](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
- [Bonjour-Erkennung](/de/gateway/bonjour)
