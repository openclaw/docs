---
read_when:
    - Fehlerbehebung bei Bonjour-Erkennungsproblemen unter macOS/iOS
    - Ändern von mDNS-Diensttypen, TXT-Einträgen oder der Erkennungs-UX
summary: Bonjour-/mDNS-Erkennung und Fehlersuche (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-05-03T21:31:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour- / mDNS-Erkennung

OpenClaw kann Bonjour (mDNS / DNS-SD) verwenden, um ein aktives Gateway (WebSocket-Endpunkt) zu erkennen.
Multicast-Browsing für `local.` ist eine **reine LAN-Komfortfunktion**. Das gebündelte `bonjour`
Plugin ist für LAN-Advertising zuständig. Es startet auf macOS-Hosts automatisch und ist auf
Linux, Windows und containerisierten Gateway-Bereitstellungen optional. Für netzwerkübergreifende Erkennung kann dasselbe
Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden. Die Erkennung
bleibt Best-Effort und ersetzt **nicht** SSH- oder Tailnet-basierte Konnektivität.

## Wide-Area Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich Node und Gateway in verschiedenen Netzwerken befinden, überschreitet Multicast-mDNS die
Grenze nicht. Sie können dieselbe Discovery-UX beibehalten, indem Sie zu **Unicast DNS-SD**
("Wide-Area Bonjour") über Tailscale wechseln.

Überblick über die Schritte:

1. Führen Sie auf dem Gateway-Host einen DNS-Server aus (über Tailnet erreichbar).
2. Veröffentlichen Sie DNS-SD-Einträge für `_openclaw-gw._tcp` unter einer dedizierten Zone
   (Beispiel: `openclaw.internal.`).
3. Konfigurieren Sie Tailscale **Split DNS**, sodass Ihre gewählte Domain für Clients
   (einschließlich iOS) über diesen DNS-Server aufgelöst wird.

OpenClaw unterstützt jede Discovery-Domain; `openclaw.internal.` ist nur ein Beispiel.
iOS-/Android-Nodes durchsuchen sowohl `local.` als auch Ihre konfigurierte Wide-Area-Domain.

### Gateway-Konfiguration (empfohlen)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Einmalige DNS-Server-Einrichtung (Gateway-Host)

```bash
openclaw dns setup --apply
```

Dies installiert CoreDNS und konfiguriert es so, dass es:

- nur auf Port 53 an den Tailscale-Schnittstellen des Gateways lauscht
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bereitstellt

Validieren Sie dies von einem mit Tailnet verbundenen Computer aus:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Administrationskonsole:

- Fügen Sie einen Nameserver hinzu, der auf die Tailnet-IP des Gateways zeigt (UDP/TCP 53).
- Fügen Sie Split DNS hinzu, sodass Ihre Discovery-Domain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und die CLI-Erkennung
`_openclaw-gw._tcp` in Ihrer Discovery-Domain ohne Multicast durchsuchen.

### Gateway-Listener-Sicherheit (empfohlen)

Der Gateway-WS-Port (Standard `18789`) bindet standardmäßig an Loopback. Für LAN-/Tailnet-
Zugriff binden Sie ihn explizit und lassen die Authentifizierung aktiviert.

Für Tailnet-only-Setups:

- Setzen Sie `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Starten Sie das Gateway neu (oder starten Sie die macOS-Menüleisten-App neu).

## Was angekündigt wird

Nur das Gateway kündigt `_openclaw-gw._tcp` an. LAN-Multicast-Advertising wird
vom gebündelten `bonjour` Plugin bereitgestellt, wenn das Plugin aktiviert ist; Wide-Area-
DNS-SD-Publishing bleibt Eigentum des Gateways.

## Servicetypen

- `_openclaw-gw._tcp` — Gateway-Transport-Beacon (verwendet von macOS-/iOS-/Android-Nodes).

## TXT-Schlüssel (nicht geheime Hinweise)

Das Gateway kündigt kleine, nicht geheime Hinweise an, um UI-Abläufe komfortabel zu machen:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (nur wenn TLS aktiviert ist)
- `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und der Fingerprint verfügbar ist)
- `canvasPort=<port>` (nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (nur mDNS-Full-Modus, optionaler Hinweis, wenn Tailnet verfügbar ist)
- `sshPort=<port>` (nur mDNS-Full-Modus; Wide-Area-DNS-SD kann dies auslassen)
- `cliPath=<path>` (nur mDNS-Full-Modus; Wide-Area-DNS-SD schreibt dies weiterhin als Remote-Installationshinweis)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients dürfen TXT nicht als verbindliche Routing-Quelle behandeln.
- Clients sollten über den aufgelösten Service-Endpunkt (SRV + A/AAAA) routen. Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` nur als Hinweise.
- SSH-Auto-Targeting sollte ebenfalls den aufgelösten Service-Host verwenden, nicht reine TXT-Hinweise.
- TLS-Pinning darf niemals zulassen, dass ein angekündigtes `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten discovery-basierte Direktverbindungen als **nur TLS** behandeln und eine explizite Benutzerbestätigung verlangen, bevor sie einem erstmaligen Fingerprint vertrauen.

## Debugging unter macOS

Nützliche integrierte Werkzeuge:

- Instanzen durchsuchen:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Eine Instanz auflösen (`<instance>` ersetzen):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Wenn das Browsing funktioniert, die Auflösung aber fehlschlägt, liegt normalerweise ein LAN-Richtlinien- oder
mDNS-Resolver-Problem vor.

## Debugging in Gateway-Logs

Das Gateway schreibt eine rotierende Protokolldatei (beim Start ausgegeben als
`gateway log file: ...`). Suchen Sie nach `bonjour:`-Zeilen, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour verwendet den System-Hostnamen für den angekündigten `.local`-Host, wenn er ein
gültiges DNS-Label ist. Wenn der System-Hostname Leerzeichen, Unterstriche oder ein anderes
ungültiges DNS-Label-Zeichen enthält, fällt OpenClaw auf `openclaw.local` zurück. Setzen Sie
`OPENCLAW_MDNS_HOSTNAME=<name>`, bevor Sie das Gateway starten, wenn Sie ein
explizites Host-Label benötigen.

## Debugging auf iOS-Node

Der iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu erkennen.

So erfassen Sie Logs:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduzieren → **Copy**

Das Log enthält Browser-Zustandsübergänge und Änderungen der Ergebnismengen.

## Wann Bonjour aktiviert werden sollte

Bonjour startet bei leerer Gateway-Konfiguration auf macOS-Hosts automatisch, weil die
lokale App und nahegelegene iOS-/Android-Nodes häufig auf Same-LAN-Erkennung angewiesen sind.

Aktivieren Sie Bonjour explizit, wenn Same-LAN-Auto-Discovery auf Linux,
Windows oder einem anderen Nicht-macOS-Host nützlich ist:

```bash
openclaw plugins enable bonjour
```

Wenn aktiviert, verwendet Bonjour `discovery.mdns.mode`, um zu entscheiden, wie viele TXT-Metadaten
veröffentlicht werden. Der Standardmodus ist `minimal`; verwenden Sie `full` nur, wenn lokale Clients
`cliPath`- oder `sshPort`-Hinweise benötigen, und verwenden Sie `off`, um LAN-Multicast zu unterdrücken, ohne
die Plugin-Aktivierung zu ändern.

## Wann Bonjour deaktiviert werden sollte

Lassen Sie Bonjour deaktiviert, wenn LAN-Multicast-Advertising unnötig, nicht verfügbar
oder schädlich ist. Häufige Fälle sind Nicht-macOS-Server, Docker-Bridge-Networking,
WSL oder eine Netzwerkrichtlinie, die mDNS-Multicast verwirft. In diesen Umgebungen ist das
Gateway weiterhin über seine veröffentlichte URL, SSH, Tailnet oder Wide-Area-
DNS-SD erreichbar, aber LAN-Auto-Discovery ist nicht zuverlässig.

Bevorzugen Sie die vorhandene Umgebungsüberschreibung, wenn das Problem bereitstellungsbezogen ist:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Das deaktiviert LAN-Multicast-Advertising, ohne die Plugin-Konfiguration zu ändern.
Es ist sicher für Docker-Images, Service-Dateien, Startskripte und einmaliges
Debugging, weil die Einstellung verschwindet, sobald die Umgebung dies tut.

Verwenden Sie die Plugin-Konfiguration, wenn Sie das gebündelte LAN-
Discovery-Plugin für diese OpenClaw-Konfiguration absichtlich ausschalten möchten:

```bash
openclaw plugins disable bonjour
```

## Docker-Fallstricke

Das gebündelte Bonjour-Plugin deaktiviert LAN-Multicast-Advertising in erkannten
Containern automatisch, wenn `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist. Docker-Bridge-Netzwerke
leiten mDNS-Multicast (`224.0.0.251:5353`) zwischen Container
und LAN normalerweise nicht weiter, daher sorgt Advertising aus dem Container nur selten dafür, dass Discovery funktioniert.

Wichtige Fallstricke:

- Bonjour startet auf macOS-Hosts automatisch und ist andernorts optional. Es
  deaktiviert zu lassen, stoppt das Gateway nicht; es überspringt nur LAN-Multicast-Advertising.
- Das Deaktivieren von Bonjour ändert `gateway.bind` nicht; Docker verwendet weiterhin standardmäßig
  `OPENCLAW_GATEWAY_BIND=lan`, damit der veröffentlichte Host-Port funktionieren kann.
- Das Deaktivieren von Bonjour deaktiviert Wide-Area-DNS-SD nicht. Verwenden Sie Wide-Area-Discovery
  oder Tailnet, wenn Gateway und Node nicht im selben LAN sind.
- Die Wiederverwendung desselben `OPENCLAW_CONFIG_DIR` außerhalb von Docker übernimmt die
  Container-Auto-Disable-Richtlinie nicht dauerhaft.
- Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host-Networking, macvlan oder ein anderes
  Netzwerk, bei dem bekannt ist, dass mDNS-Multicast durchgelassen wird; setzen Sie es auf `1`, um die Deaktivierung zu erzwingen.

## Fehlerbehebung bei deaktiviertem Bonjour

Wenn ein Node das Gateway nach der Docker-Einrichtung nicht mehr automatisch erkennt:

1. Prüfen Sie, ob das Gateway im Auto-, Forced-on- oder Forced-off-Modus läuft:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Prüfen Sie, ob das Gateway selbst über den veröffentlichten Port erreichbar ist:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Verwenden Sie ein direktes Ziel, wenn Bonjour deaktiviert ist:
   - Control UI oder lokale Tools: `http://127.0.0.1:18789`
   - LAN-Clients: `http://<gateway-host>:18789`
   - Netzwerkübergreifende Clients: Tailnet MagicDNS, Tailnet-IP, SSH-Tunnel oder
     Wide-Area-DNS-SD

4. Wenn Sie das Bonjour-Plugin in Docker bewusst aktiviert und Advertising
   mit `OPENCLAW_DISABLE_BONJOUR=0` erzwungen haben, testen Sie Multicast vom Host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Wenn das Browsing leer ist oder die Gateway-Logs wiederholte ciao-Watchdog-
   Abbrüche zeigen, stellen Sie `OPENCLAW_DISABLE_BONJOUR=1` wieder her und verwenden Sie eine direkte oder
   Tailnet-Route.

## Häufige Fehlermodi

- **Bonjour überschreitet keine Netzwerke**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Einige WLAN-Netzwerke deaktivieren mDNS.
- **Advertiser hängt in Probing/Announcing fest**: Hosts mit blockiertem Multicast,
  Container-Bridges, WSL oder Schnittstellenänderungen können den ciao-Advertiser in einem
  nicht angekündigten Zustand belassen. OpenClaw versucht es einige Male erneut und deaktiviert dann Bonjour
  für den aktuellen Gateway-Prozess, anstatt den Advertiser dauerhaft neu zu starten.
- **Docker-Bridge-Networking**: Bonjour deaktiviert sich in erkannten Containern automatisch.
  Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host, macvlan oder ein anderes
  mDNS-fähiges Netzwerk.
- **Ruhezustand / Schnittstellenänderungen**: macOS kann mDNS-Ergebnisse vorübergehend verlieren; versuchen Sie es erneut.
- **Browsing funktioniert, aber Auflösung schlägt fehl**: Halten Sie Computernamen einfach (vermeiden Sie Emojis oder
  Satzzeichen), und starten Sie dann das Gateway neu. Der Service-Instanzname wird aus
  dem Hostnamen abgeleitet, sodass zu komplexe Namen einige Resolver verwirren können.

## Escapte Instanznamen (`\032`)

Bonjour/DNS-SD escapet Bytes in Service-Instanznamen häufig als dezimale `\DDD`-
Sequenzen (z. B. werden Leerzeichen zu `\032`).

- Das ist auf Protokollebene normal.
- UIs sollten für die Anzeige dekodieren (iOS verwendet `BonjourEscapes.decode`).

## Aktivieren / Deaktivieren / Konfiguration

- macOS-Hosts starten das gebündelte LAN-Discovery-Plugin standardmäßig automatisch.
- `openclaw plugins enable bonjour` aktiviert das gebündelte LAN-Discovery-Plugin auf Hosts, auf denen es nicht standardmäßig aktiviert ist.
- `openclaw plugins disable bonjour` deaktiviert LAN-Multicast-Advertising, indem es das gebündelte Plugin deaktiviert.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert LAN-Multicast-Advertising, ohne die Plugin-Konfiguration zu ändern; akzeptierte truthy-Werte sind `1`, `true`, `yes` und `on` (Legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` erzwingt LAN-Multicast-Advertising, auch in erkannten Containern; akzeptierte falsy-Werte sind `0`, `false`, `no` und `off`.
- Wenn das Bonjour-Plugin aktiviert ist und `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist, kündigt Bonjour auf normalen Hosts an und deaktiviert sich in erkannten Containern automatisch.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Gateway-Bind-Modus.
- `OPENCLAW_SSH_PORT` überschreibt den SSH-Port, wenn `sshPort` angekündigt wird (Legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen MagicDNS-Hinweis in TXT, wenn der mDNS-Full-Modus aktiviert ist (Legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad (Legacy: `OPENCLAW_CLI_PATH`).

## Verwandte Dokumentation

- Discovery-Richtlinie und Transportauswahl: [Discovery](/de/gateway/discovery)
- Node-Pairing + Freigaben: [Gateway-Pairing](/de/gateway/pairing)
