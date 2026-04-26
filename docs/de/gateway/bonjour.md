---
read_when:
    - Debuggen von Problemen bei der Bonjour-Erkennung unter macOS/iOS
    - mDNS-Servicetypen, TXT-Records oder Discovery-UX ändern
summary: Bonjour-/mDNS-Erkennung + Debugging (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-04-26T11:28:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour-/mDNS-Erkennung

OpenClaw verwendet Bonjour (mDNS / DNS‑SD), um ein aktives Gateway (WebSocket-Endpunkt) zu erkennen.
Multicast-Browsing unter `local.` ist nur eine **LAN-interne Komfortfunktion**. Das gebündelte Plugin
`bonjour` verwaltet die LAN-Ankündigung und ist standardmäßig aktiviert. Für netzwerkübergreifende Erkennung
kann derselbe Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden.
Die Erkennung bleibt weiterhin Best-Effort und ersetzt **nicht** SSH oder Tailnet-basierte Konnektivität.

## Wide-Area-Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich Node und Gateway in unterschiedlichen Netzwerken befinden, überschreitet Multicast-mDNS
diese Grenze nicht. Sie können dieselbe Discovery-UX beibehalten, indem Sie auf **Unicast DNS‑SD**
(„Wide‑Area Bonjour“) über Tailscale umstellen.

Überblick über die Schritte:

1. Einen DNS-Server auf dem Gateway-Host ausführen (über Tailnet erreichbar).
2. DNS‑SD-Records für `_openclaw-gw._tcp` unter einer dedizierten Zone veröffentlichen
   (Beispiel: `openclaw.internal.`).
3. Tailscale **Split DNS** konfigurieren, sodass Ihre gewählte Domain für Clients
   (einschließlich iOS) über diesen DNS-Server aufgelöst wird.

OpenClaw unterstützt jede Discovery-Domain; `openclaw.internal.` ist nur ein Beispiel.
iOS-/Android-Nodes browsen sowohl `local.` als auch Ihre konfigurierte Wide-Area-Domain.

### Gateway-Konfiguration (empfohlen)

```json5
{
  gateway: { bind: "tailnet" }, // nur Tailnet (empfohlen)
  discovery: { wideArea: { enabled: true } }, // aktiviert Wide-Area-DNS-SD-Veröffentlichung
}
```

### Einmalige DNS-Server-Einrichtung (Gateway-Host)

```bash
openclaw dns setup --apply
```

Dies installiert CoreDNS und konfiguriert es so, dass es:

- nur auf Port 53 auf den Tailscale-Schnittstellen des Gateways lauscht
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bereitstellt

Validierung von einer mit dem Tailnet verbundenen Maschine aus:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Admin-Konsole:

- Einen Nameserver hinzufügen, der auf die Tailnet-IP des Gateways zeigt (UDP/TCP 53).
- Split DNS hinzufügen, damit Ihre Discovery-Domain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und CLI-Discovery
`_openclaw-gw._tcp` in Ihrer Discovery-Domain ohne Multicast browsen.

### Sicherheit des Gateway-Listeners (empfohlen)

Der Gateway-WS-Port (Standard `18789`) bindet standardmäßig an loopback. Für LAN-/Tailnet-
Zugriff binden Sie ihn explizit und lassen Sie Authentifizierung aktiviert.

Für reine Tailnet-Setups:

- Setzen Sie `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Starten Sie das Gateway neu (oder starten Sie die macOS-Menüleisten-App neu).

## Was angekündigt wird

Nur das Gateway kündigt `_openclaw-gw._tcp` an. Die LAN-Multicast-Ankündigung wird
durch das gebündelte Plugin `bonjour` bereitgestellt; die Veröffentlichung per Wide-Area-DNS-SD bleibt
im Besitz des Gateways.

## Servicetypen

- `_openclaw-gw._tcp` — Gateway-Transport-Beacon (verwendet von macOS-/iOS-/Android-Nodes).

## TXT-Schlüssel (nicht geheime Hinweise)

Das Gateway kündigt kleine, nicht geheime Hinweise an, um UI-Abläufe bequem zu machen:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway-WS + HTTP)
- `gatewayTls=1` (nur wenn TLS aktiviert ist)
- `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und der Fingerabdruck verfügbar ist)
- `canvasPort=<port>` (nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (nur im mDNS-Vollmodus; optionaler Hinweis, wenn Tailnet verfügbar ist)
- `sshPort=<port>` (nur im mDNS-Vollmodus; Wide-Area-DNS-SD kann ihn weglassen)
- `cliPath=<path>` (nur im mDNS-Vollmodus; Wide-Area-DNS-SD schreibt ihn weiterhin als Hinweis für Remote-Installationen)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Records sind **nicht authentifiziert**. Clients dürfen TXT nicht als maßgebliches Routing behandeln.
- Clients sollten über den aufgelösten Service-Endpunkt routen (SRV + A/AAAA). Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` nur als Hinweise.
- Auch automatisches SSH-Targeting sollte den aufgelösten Service-Host verwenden, nicht nur TXT-Hinweise.
- TLS-Pinning darf niemals zulassen, dass ein angekündigtes `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten discovery-basierte direkte Verbindungen als **nur TLS** behandeln und eine explizite Benutzerbestätigung verlangen, bevor einem erstmaligen Fingerabdruck vertraut wird.

## Debugging unter macOS

Nützliche integrierte Tools:

- Instanzen browsen:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Eine Instanz auflösen (ersetzen Sie `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Wenn Browsing funktioniert, aber Auflösen fehlschlägt, liegt meist eine LAN-Richtlinie oder
ein mDNS-Resolver-Problem vor.

## Debugging in Gateway-Logs

Das Gateway schreibt eine rotierende Logdatei (beim Start ausgegeben als
`gateway log file: ...`). Achten Sie auf Zeilen mit `bonjour:`, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Debugging auf dem iOS-Node

Der iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu erkennen.

So erfassen Sie Logs:

- Einstellungen → Gateway → Erweitert → **Discovery Debug Logs**
- Einstellungen → Gateway → Erweitert → **Discovery Logs** → reproduzieren → **Kopieren**

Das Log enthält Browser-Statusübergänge und Änderungen an der Ergebnismenge.

## Wann Bonjour deaktiviert werden sollte

Deaktivieren Sie Bonjour nur, wenn LAN-Multicast-Ankündigung nicht verfügbar oder schädlich ist.
Der häufigste Fall ist ein Gateway hinter Docker-Bridge-Netzwerk, WSL oder einer
Netzwerkrichtlinie, die mDNS-Multicast verwirft. In diesen Umgebungen ist das Gateway
weiterhin über seine veröffentlichte URL, SSH, Tailnet oder Wide-Area-DNS-SD erreichbar,
aber LAN-Auto-Discovery ist nicht zuverlässig.

Bevorzugen Sie die vorhandene Umgebungsüberschreibung, wenn das Problem auf die Bereitstellung beschränkt ist:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Dadurch wird die LAN-Multicast-Ankündigung deaktiviert, ohne die Plugin-Konfiguration zu ändern.
Das ist sicher für Docker-Images, Service-Dateien, Launch-Skripte und einmaliges
Debugging, weil die Einstellung verschwindet, wenn die Umgebung sie nicht mehr setzt.

Verwenden Sie die Plugin-Konfiguration nur, wenn Sie das
gebündelte LAN-Discovery-Plugin für diese OpenClaw-Konfiguration bewusst ausschalten möchten:

```bash
openclaw plugins disable bonjour
```

## Docker-Stolperfallen

Das gebündelte Docker Compose setzt `OPENCLAW_DISABLE_BONJOUR=1` für den Gateway-Service
standardmäßig. Docker-Bridge-Netzwerke leiten mDNS-Multicast in der Regel nicht weiter
(`224.0.0.251:5353`) zwischen Container und LAN, sodass aktiviertes Bonjour wiederholte ciao-Fehler bei `probing` oder `announcing`
verursachen kann, ohne dass Discovery funktioniert.

Wichtige Stolperfallen:

- Das Deaktivieren von Bonjour stoppt das Gateway nicht. Es stoppt nur die LAN-Multicast-
  Ankündigung.
- Das Deaktivieren von Bonjour ändert `gateway.bind` nicht; Docker verwendet weiterhin standardmäßig
  `OPENCLAW_GATEWAY_BIND=lan`, damit der veröffentlichte Host-Port funktioniert.
- Das Deaktivieren von Bonjour deaktiviert Wide-Area-DNS-SD nicht. Verwenden Sie Wide-Area-Discovery
  oder Tailnet, wenn sich Gateway und Node nicht im selben LAN befinden.
- Die Wiederverwendung desselben `OPENCLAW_CONFIG_DIR` außerhalb von Docker übernimmt den
  Compose-Standard nicht, sofern die Umgebung nicht weiterhin `OPENCLAW_DISABLE_BONJOUR` setzt.
- Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host-Netzwerk, macvlan oder ein anderes
  Netzwerk, in dem mDNS-Multicast nachweislich funktioniert.

## Fehlerbehebung bei deaktiviertem Bonjour

Wenn ein Node das Gateway nach der Docker-Einrichtung nicht mehr automatisch erkennt:

1. Bestätigen Sie, ob das Gateway die LAN-Ankündigung absichtlich unterdrückt:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Bestätigen Sie, dass das Gateway selbst über den veröffentlichten Port erreichbar ist:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Verwenden Sie ein direktes Ziel, wenn Bonjour deaktiviert ist:
   - Control UI oder lokale Tools: `http://127.0.0.1:18789`
   - LAN-Clients: `http://<gateway-host>:18789`
   - Netzwerkübergreifende Clients: Tailnet MagicDNS, Tailnet-IP, SSH-Tunnel oder
     Wide-Area-DNS-SD

4. Wenn Sie Bonjour in Docker bewusst mit
   `OPENCLAW_DISABLE_BONJOUR=0` aktiviert haben, testen Sie Multicast vom Host aus:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Wenn Browsing leer bleibt oder die Gateway-Logs wiederholte ciao-Watchdog-
   Abbrüche zeigen, stellen Sie `OPENCLAW_DISABLE_BONJOUR=1` wieder her und verwenden Sie einen direkten
   oder Tailnet-Pfad.

## Häufige Fehlermodi

- **Bonjour überschreitet keine Netzwerke**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Einige Wi‑Fi-Netzwerke deaktivieren mDNS.
- **Advertiser hängt in probing/announcing**: Hosts mit blockiertem Multicast,
  Container-Bridges, WSL oder Interface-Wechseln können den ciao-Advertiser in einem
  nicht angekündigten Zustand belassen. OpenClaw versucht es einige Male erneut und deaktiviert dann Bonjour
  für den aktuellen Gateway-Prozess, statt den Advertiser endlos neu zu starten.
- **Docker-Bridge-Netzwerk**: Das gebündelte Docker Compose deaktiviert Bonjour
  standardmäßig mit `OPENCLAW_DISABLE_BONJOUR=1`. Setzen Sie es nur für Host-,
  macvlan- oder andere mDNS-fähige Netzwerke auf `0`.
- **Ruhezustand / Interface-Wechsel**: macOS kann mDNS-Ergebnisse vorübergehend verwerfen; versuchen Sie es erneut.
- **Browsing funktioniert, aber Auflösen nicht**: Halten Sie Maschinennamen einfach (vermeiden Sie Emojis oder
  Satzzeichen) und starten Sie dann das Gateway neu. Der Service-Instanzname leitet sich vom
  Hostnamen ab, daher können zu komplexe Namen manche Resolver verwirren.

## Escapte Instanznamen (`\032`)

Bonjour/DNS‑SD maskiert Bytes in Service-Instanznamen häufig als dezimale `\DDD`-
Sequenzen (z. B. werden Leerzeichen zu `\032`).

- Das ist auf Protokollebene normal.
- UIs sollten dies für die Anzeige dekodieren (iOS verwendet `BonjourEscapes.decode`).

## Deaktivierung / Konfiguration

- `openclaw plugins disable bonjour` deaktiviert die LAN-Multicast-Ankündigung, indem das gebündelte Plugin deaktiviert wird.
- `openclaw plugins enable bonjour` stellt das Standard-LAN-Discovery-Plugin wieder her.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert die LAN-Multicast-Ankündigung, ohne die Plugin-Konfiguration zu ändern; akzeptierte Truthy-Werte sind `1`, `true`, `yes` und `on` (Legacy: `OPENCLAW_DISABLE_BONJOUR`).
- Docker Compose setzt `OPENCLAW_DISABLE_BONJOUR=1` standardmäßig für Bridge-Netzwerke; überschreiben Sie dies nur mit `OPENCLAW_DISABLE_BONJOUR=0`, wenn mDNS-Multicast verfügbar ist.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateways.
- `OPENCLAW_SSH_PORT` überschreibt den SSH-Port, wenn `sshPort` angekündigt wird (Legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen MagicDNS-Hinweis in TXT, wenn der mDNS-Vollmodus aktiviert ist (Legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad (Legacy: `OPENCLAW_CLI_PATH`).

## Verwandte Dokumente

- Discovery-Richtlinie und Transportauswahl: [Discovery](/de/gateway/discovery)
- Node-Kopplung + Genehmigungen: [Gateway-Kopplung](/de/gateway/pairing)
