---
read_when:
    - Bonjour-Erkennung/-Ankündigung implementieren oder ändern
    - Remote-Verbindungsmodi anpassen (direkt vs. SSH)
    - Node-Erkennung + Pairing für Remote-Nodes entwerfen
summary: Node-Erkennung und Transports (Bonjour, Tailscale, SSH) zum Finden des Gateway
title: Erkennung und Transports
x-i18n:
    generated_at: "2026-04-26T11:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# Erkennung & Transporte

OpenClaw hat zwei unterschiedliche Probleme, die an der Oberfläche ähnlich aussehen:

1. **Remote-Steuerung für Operatoren**: die macOS-Menüleisten-App, die ein anderswo laufendes Gateway steuert.
2. **Node-Pairing**: iOS/Android (und zukünftige Nodes), die ein Gateway finden und sicher pairen.

Das Designziel ist, alle Netzwerk-Erkennungs-/Ankündigungsfunktionen im **Node Gateway** (`openclaw gateway`) zu halten und Clients (Mac-App, iOS) als Consumer zu belassen.

## Begriffe

- **Gateway**: ein einzelner langlebiger Gateway-Prozess, der den Zustand besitzt (Sitzungen, Pairing, Node-Registry) und Channels ausführt. Die meisten Setups verwenden eines pro Host; isolierte Multi-Gateway-Setups sind möglich.
- **Gateway WS (Kontrollebene)**: der WebSocket-Endpunkt auf `127.0.0.1:18789` standardmäßig; kann über `gateway.bind` an LAN/Tailnet gebunden werden.
- **Direkter WS-Transport**: ein LAN-/Tailnet-seitiger Gateway-WS-Endpunkt (ohne SSH).
- **SSH-Transport (Fallback)**: Remote-Steuerung durch Weiterleitung von `127.0.0.1:18789` über SSH.
- **Legacy-TCP-Bridge (entfernt)**: älterer Node-Transport (siehe
  [Bridge-Protokoll](/de/gateway/bridge-protocol)); wird nicht mehr für die
  Erkennung angekündigt und ist nicht mehr Teil aktueller Builds.

Protokolldetails:

- [Gateway-Protokoll](/de/gateway/protocol)
- [Bridge-Protokoll (Legacy)](/de/gateway/bridge-protocol)

## Warum wir sowohl „direkt“ als auch SSH behalten

- **Direktes WS** bietet die beste UX im selben Netzwerk und innerhalb eines Tailnet:
  - Auto-Erkennung im LAN über Bonjour
  - Pairing-Tokens + ACLs werden vom Gateway verwaltet
  - kein Shell-Zugriff erforderlich; die Protokolloberfläche kann eng und auditierbar bleiben
- **SSH** bleibt der universelle Fallback:
  - funktioniert überall, wo Sie SSH-Zugriff haben (auch über nicht zusammenhängende Netzwerke hinweg)
  - übersteht Probleme mit Multicast/mDNS
  - erfordert keine neuen eingehenden Ports außer SSH

## Erkennungsquellen (wie Clients erfahren, wo sich das Gateway befindet)

### 1) Bonjour- / DNS-SD-Erkennung

Multicast-Bonjour ist Best-Effort und überschreitet keine Netzwerke. OpenClaw kann dasselbe Gateway-Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain durchsuchen, sodass die Erkennung Folgendes abdecken kann:

- `local.` im selben LAN
- eine konfigurierte Unicast-DNS-SD-Domain für netzwerkübergreifende Erkennung

Zielrichtung:

- Das **Gateway** kündigt seinen WS-Endpunkt über Bonjour an.
- Clients durchsuchen die Beacons und zeigen eine Liste „Gateway auswählen“ an und speichern dann den gewählten Endpunkt.

Fehlerbehebung und Beacon-Details: [Bonjour](/de/gateway/bonjour).

#### Details des Service-Beacons

- Service-Typen:
  - `_openclaw-gw._tcp` (Beacon für Gateway-Transport)
- TXT-Schlüssel (nicht geheim):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (vom Operator konfigurierter Anzeigename)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (nur wenn TLS aktiviert ist)
  - `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und ein Fingerabdruck verfügbar ist)
  - `canvasPort=<port>` (Port des Canvas-Hosts; derzeit derselbe wie `gatewayPort`, wenn der Canvas-Host aktiviert ist)
  - `tailnetDns=<magicdns>` (optionaler Hinweis; wird automatisch erkannt, wenn Tailscale verfügbar ist)
  - `sshPort=<port>` (nur im mDNS-Modus full; Wide-Area-DNS-SD kann ihn weglassen, in diesem Fall bleiben die SSH-Standards bei `22`)
  - `cliPath=<path>` (nur im mDNS-Modus full; Wide-Area-DNS-SD schreibt ihn weiterhin als Hinweis für Remote-Installationen)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients müssen TXT-Werte nur als UX-Hinweise behandeln.
- Routing (Host/Port) sollte den **aufgelösten Service-Endpunkt** (SRV + A/AAAA) gegenüber per TXT bereitgestellten `lanHost`, `tailnetDns` oder `gatewayPort` bevorzugen.
- TLS-Pinning darf niemals zulassen, dass ein angekündigter `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten vor dem Speichern eines erstmaligen Pins immer eine explizite Bestätigung „diesem Fingerabdruck vertrauen“ verlangen (Out-of-Band-Verifizierung), wenn die gewählte Route sicher/TLS-basiert ist.

Deaktivieren/überschreiben:

- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert die Ankündigung.
- Docker Compose verwendet standardmäßig `OPENCLAW_DISABLE_BONJOUR=1`, weil Bridge-Netzwerke
  normalerweise kein mDNS-Multicast zuverlässig transportieren; verwenden Sie `0` nur bei Host-, macvlan-
  oder anderen mDNS-fähigen Netzwerken.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateway.
- `OPENCLAW_SSH_PORT` überschreibt den angekündigten SSH-Port, wenn `sshPort` ausgegeben wird.
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen `tailnetDns`-Hinweis (MagicDNS).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad.

### 2) Tailnet (netzwerkübergreifend)

Bei Setups im Stil London/Wien hilft Bonjour nicht. Das empfohlene „direkte“ Ziel ist:

- Tailscale-MagicDNS-Name (bevorzugt) oder eine stabile Tailnet-IP.

Wenn das Gateway erkennen kann, dass es unter Tailscale läuft, veröffentlicht es `tailnetDns` als optionalen Hinweis für Clients (einschließlich Wide-Area-Beacons).

Die macOS-App bevorzugt jetzt MagicDNS-Namen gegenüber rohen Tailscale-IPs für die Gateway-Erkennung. Das verbessert die Zuverlässigkeit, wenn sich Tailnet-IPs ändern (zum Beispiel nach Node-Neustarts oder CGNAT-Neuzuweisung), weil MagicDNS-Namen automatisch zur aktuellen IP aufgelöst werden.

Für mobiles Node-Pairing lockern Erkennungshinweise die Transportsicherheit auf Tailnet-/öffentlichen Routen nicht:

- iOS/Android erfordern weiterhin einen sicheren erstmaligen Verbindungsweg über Tailnet/öffentlich (`wss://` oder Tailscale Serve/Funnel).
- Eine erkannte rohe Tailnet-IP ist ein Routing-Hinweis, keine Erlaubnis, einfaches entferntes `ws://` zu verwenden.
- Privates direktes `ws://` über LAN bleibt unterstützt.
- Wenn Sie den einfachsten Tailscale-Pfad für mobile Nodes möchten, verwenden Sie Tailscale Serve, damit Erkennung und Einrichtungscode beide denselben sicheren MagicDNS-Endpunkt auflösen.

### 3) Manuelles / SSH-Ziel

Wenn es keine direkte Route gibt (oder direkt deaktiviert ist), können Clients sich immer über SSH verbinden, indem sie den Loopback-Gateway-Port weiterleiten.

Siehe [Remote-Zugriff](/de/gateway/remote).

## Transportauswahl (Client-Richtlinie)

Empfohlenes Client-Verhalten:

1. Wenn ein gepairter direkter Endpunkt konfiguriert und erreichbar ist, diesen verwenden.
2. Andernfalls, wenn die Erkennung ein Gateway auf `local.` oder der konfigurierten Wide-Area-Domain findet, eine One-Tap-Auswahl „Dieses Gateway verwenden“ anbieten und es als direkten Endpunkt speichern.
3. Andernfalls, wenn eine Tailnet-DNS/IP konfiguriert ist, direkt versuchen.
   Für mobile Nodes auf Tailnet-/öffentlichen Routen bedeutet direkt einen sicheren Endpunkt, nicht einfaches entferntes `ws://`.
4. Andernfalls auf SSH zurückfallen.

## Pairing + Authentifizierung (direkter Transport)

Das Gateway ist die Source of Truth für die Zulassung von Nodes/Clients.

- Pairing-Anfragen werden im Gateway erstellt/genehmigt/abgelehnt (siehe [Gateway-Pairing](/de/gateway/pairing)).
- Das Gateway erzwingt:
  - Authentifizierung (Token / Schlüsselpaar)
  - Scopes/ACLs (das Gateway ist kein roher Proxy auf jede Methode)
  - Rate Limits

## Zuständigkeiten nach Komponente

- **Gateway**: kündigt Erkennungs-Beacons an, besitzt Pairing-Entscheidungen und hostet den WS-Endpunkt.
- **macOS-App**: hilft beim Auswählen eines Gateway, zeigt Pairing-Aufforderungen und verwendet SSH nur als Fallback.
- **iOS-/Android-Nodes**: durchsuchen Bonjour zur Vereinfachung und verbinden sich mit dem gepairten Gateway WS.

## Verwandt

- [Remote-Zugriff](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
- [Bonjour-Erkennung](/de/gateway/bonjour)
