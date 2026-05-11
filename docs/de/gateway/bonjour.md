---
read_when:
    - Fehlerbehebung bei Bonjour-Erkennungsproblemen unter macOS/iOS
    - Ändern von mDNS-Diensttypen, TXT-Einträgen oder der Erkennungs-UX
summary: Bonjour-/mDNS-Erkennung + Debugging (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-05-11T20:28:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw kann Bonjour (mDNS / DNS-SD) verwenden, um ein aktives Gateway (WebSocket-Endpunkt) zu erkennen.
Multicast-`local.`-Browsing ist ein **reiner LAN-Komfortmechanismus**. Das gebündelte `bonjour`-
Plugin ist für LAN-Advertising zuständig. Es startet auf macOS-Hosts automatisch und ist auf
Linux, Windows und containerisierten Gateway-Bereitstellungen optional. Für netzwerkübergreifende Erkennung kann derselbe
Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden. Discovery
bleibt Best-Effort und ersetzt **nicht** SSH- oder Tailnet-basierte Konnektivität.

## Wide-Area Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich Node und Gateway in unterschiedlichen Netzwerken befinden, überschreitet Multicast-mDNS die
Grenze nicht. Sie können dieselbe Discovery-UX beibehalten, indem Sie auf **Unicast DNS-SD**
("Wide-Area Bonjour") über Tailscale umstellen.

Übergeordnete Schritte:

1. Führen Sie einen DNS-Server auf dem Gateway-Host aus (über Tailnet erreichbar).
2. Veröffentlichen Sie DNS-SD-Einträge für `_openclaw-gw._tcp` unter einer dedizierten Zone
   (Beispiel: `openclaw.internal.`).
3. Konfigurieren Sie Tailscale-**Split-DNS**, damit Ihre gewählte Domain für Clients
   (einschließlich iOS) über diesen DNS-Server aufgelöst wird.

OpenClaw unterstützt jede Discovery-Domain; `openclaw.internal.` ist nur ein Beispiel.
iOS-/Android-Nodes browsen sowohl `local.` als auch Ihre konfigurierte Wide-Area-Domain.

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

- nur auf Port 53 auf den Tailscale-Schnittstellen des Gateway lauscht
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bereitstellt

Validieren Sie dies von einem mit dem Tailnet verbundenen Rechner aus:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Admin-Konsole:

- Fügen Sie einen Nameserver hinzu, der auf die Tailnet-IP des Gateway verweist (UDP/TCP 53).
- Fügen Sie Split-DNS hinzu, damit Ihre Discovery-Domain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und CLI-Discovery
`_openclaw-gw._tcp` in Ihrer Discovery-Domain ohne Multicast browsen.

### Sicherheit des Gateway-Listeners (empfohlen)

Der Gateway-WS-Port (Standard `18789`) bindet standardmäßig an Loopback. Für LAN-/Tailnet-
Zugriff binden Sie explizit und lassen Authentifizierung aktiviert.

Für reine Tailnet-Setups:

- Setzen Sie `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Starten Sie das Gateway neu (oder starten Sie die macOS-Menüleisten-App neu).

## Was advertised wird

Nur das Gateway advertised `_openclaw-gw._tcp`. LAN-Multicast-Advertising wird
vom gebündelten `bonjour`-Plugin bereitgestellt, wenn das Plugin aktiviert ist; Wide-Area-
DNS-SD-Publishing bleibt im Besitz des Gateway.

## Servicetypen

- `_openclaw-gw._tcp` - Gateway-Transport-Beacon (verwendet von macOS-/iOS-/Android-Nodes).

## TXT-Schlüssel (nicht geheime Hinweise)

Das Gateway advertised kleine, nicht geheime Hinweise, um UI-Abläufe komfortabel zu machen:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (nur wenn TLS aktiviert ist)
- `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und der Fingerprint verfügbar ist)
- `canvasPort=<port>` (nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (nur mDNS-Vollmodus, optionaler Hinweis, wenn Tailnet verfügbar ist)
- `sshPort=<port>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD kann ihn auslassen)
- `cliPath=<path>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD schreibt ihn weiterhin als Remote-Installationshinweis)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients dürfen TXT nicht als autoritative Routing-Information behandeln.
- Clients sollten über den aufgelösten Service-Endpunkt routen (SRV + A/AAAA). Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` nur als Hinweise.
- SSH-Auto-Targeting sollte ebenfalls den aufgelösten Service-Host verwenden, keine reinen TXT-Hinweise.
- TLS-Pinning darf niemals zulassen, dass ein advertised `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten discoverybasierte Direktverbindungen als **nur TLS** behandeln und eine explizite Bestätigung durch den Benutzer verlangen, bevor sie einem erstmaligen Fingerprint vertrauen.

## Debugging unter macOS

Nützliche integrierte Tools:

- Instanzen browsen:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Eine Instanz auflösen (`<instance>` ersetzen):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Wenn Browsing funktioniert, aber Auflösen fehlschlägt, handelt es sich in der Regel um eine LAN-Richtlinie oder
ein mDNS-Resolver-Problem.

## Debugging in Gateway-Logs

Das Gateway schreibt eine rotierende Logdatei (beim Start ausgegeben als
`gateway log file: ...`). Suchen Sie nach `bonjour:`-Zeilen, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Der Watchdog behandelt aktive Zustände `probing`, `announcing` und frische Konflikt-Umbenennungen als
laufende Zustände. Wenn der Service nie `announced` erreicht, erstellt OpenClaw den
Advertiser schließlich neu und deaktiviert Bonjour nach wiederholten Fehlern für diesen
Gateway-Prozess, statt endlos erneut zu advertisieren.

Bonjour verwendet den System-Hostnamen für den advertised `.local`-Host, wenn er ein
gültiges DNS-Label ist. Wenn der System-Hostname Leerzeichen, Unterstriche oder ein anderes
ungültiges DNS-Label-Zeichen enthält, fällt OpenClaw auf `openclaw.local` zurück. Setzen Sie
`OPENCLAW_MDNS_HOSTNAME=<name>`, bevor Sie das Gateway starten, wenn Sie ein
explizites Host-Label benötigen.

## Debugging auf dem iOS-Node

Der iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu erkennen.

So erfassen Sie Logs:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduzieren → **Copy**

Das Log enthält Browser-Zustandsübergänge und Änderungen der Ergebnismenge.

## Wann Bonjour aktiviert werden sollte

Bonjour startet bei leerer Gateway-Konfiguration auf macOS-Hosts automatisch, weil die
lokale App und nahegelegene iOS-/Android-Nodes häufig auf Same-LAN-Discovery angewiesen sind.

Aktivieren Sie Bonjour explizit, wenn Same-LAN-Auto-Discovery unter Linux,
Windows oder einem anderen Nicht-macOS-Host nützlich ist:

```bash
openclaw plugins enable bonjour
```

Wenn Bonjour aktiviert ist, verwendet es `discovery.mdns.mode`, um zu entscheiden, wie viele TXT-Metadaten
veröffentlicht werden. Der Standardmodus ist `minimal`; verwenden Sie `full` nur, wenn lokale Clients
`cliPath`- oder `sshPort`-Hinweise benötigen, und verwenden Sie `off`, um LAN-Multicast zu unterdrücken, ohne
die Plugin-Aktivierung zu ändern.

## Wann Bonjour deaktiviert werden sollte

Lassen Sie Bonjour deaktiviert, wenn LAN-Multicast-Advertising unnötig, nicht verfügbar
oder schädlich ist. Häufige Fälle sind Nicht-macOS-Server, Docker-Bridge-Networking,
WSL oder eine Netzwerkrichtlinie, die mDNS-Multicast verwirft. In diesen Umgebungen ist das
Gateway weiterhin über seine veröffentlichte URL, SSH, Tailnet oder Wide-Area-
DNS-SD erreichbar, aber LAN-Auto-Discovery ist nicht zuverlässig.

Bevorzugen Sie die vorhandene Umgebungs-Override, wenn das Problem bereitstellungsspezifisch ist:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Das deaktiviert LAN-Multicast-Advertising, ohne die Plugin-Konfiguration zu ändern.
Es ist sicher für Docker-Images, Service-Dateien, Startskripte und einmaliges
Debugging, da die Einstellung verschwindet, wenn die Umgebung dies tut.

Verwenden Sie die Plugin-Konfiguration, wenn Sie das gebündelte LAN-
Discovery-Plugin für diese OpenClaw-Konfiguration absichtlich ausschalten möchten:

```bash
openclaw plugins disable bonjour
```

## Docker-Fallstricke

Das gebündelte Bonjour-Plugin deaktiviert LAN-Multicast-Advertising in erkannten
Containern automatisch, wenn `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist. Docker-Bridge-Netzwerke
leiten mDNS-Multicast (`224.0.0.251:5353`) zwischen dem Container
und dem LAN normalerweise nicht weiter, sodass Advertising aus dem Container heraus Discovery nur selten funktionsfähig macht.

Wichtige Fallstricke:

- Bonjour startet auf macOS-Hosts automatisch und ist anderswo optional. Es
  deaktiviert zu lassen, stoppt das Gateway nicht; es überspringt nur LAN-Multicast-Advertising.
- Das Deaktivieren von Bonjour ändert `gateway.bind` nicht; Docker verwendet weiterhin standardmäßig
  `OPENCLAW_GATEWAY_BIND=lan`, damit der veröffentlichte Host-Port funktionieren kann.
- Das Deaktivieren von Bonjour deaktiviert Wide-Area-DNS-SD nicht. Verwenden Sie Wide-Area-Discovery
  oder Tailnet, wenn sich Gateway und Node nicht im selben LAN befinden.
- Die Wiederverwendung desselben `OPENCLAW_CONFIG_DIR` außerhalb von Docker persistiert die
  Container-Auto-Deaktivierungsrichtlinie nicht.
- Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host-Networking, macvlan oder ein anderes
  Netzwerk, bei dem bekannt ist, dass mDNS-Multicast durchgelassen wird; setzen Sie es auf `1`, um die Deaktivierung zu erzwingen.

## Fehlerbehebung bei deaktiviertem Bonjour

Wenn ein Node das Gateway nach der Docker-Einrichtung nicht mehr automatisch erkennt:

1. Bestätigen Sie, ob das Gateway im Auto-, Forced-on- oder Forced-off-Modus läuft:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Bestätigen Sie, dass das Gateway selbst über den veröffentlichten Port erreichbar ist:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Verwenden Sie ein direktes Ziel, wenn Bonjour deaktiviert ist:
   - Control-UI oder lokale Tools: `http://127.0.0.1:18789`
   - LAN-Clients: `http://<gateway-host>:18789`
   - Netzwerkübergreifende Clients: Tailnet MagicDNS, Tailnet-IP, SSH-Tunnel oder
     Wide-Area-DNS-SD

4. Wenn Sie das Bonjour-Plugin in Docker absichtlich aktiviert und Advertising
   mit `OPENCLAW_DISABLE_BONJOUR=0` erzwungen haben, testen Sie Multicast vom Host aus:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Wenn Browsing leer ist oder die Gateway-Logs wiederholte ciao-Watchdog-
   Abbrüche zeigen, stellen Sie `OPENCLAW_DISABLE_BONJOUR=1` wieder her und verwenden Sie eine direkte oder
   Tailnet-Route.

## Häufige Fehlermodi

- **Bonjour überschreitet keine Netzwerke**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Einige Wi-Fi-Netzwerke deaktivieren mDNS.
- **Advertiser steckt in probing/announcing fest**: Hosts mit blockiertem Multicast,
  Container-Bridges, WSL oder Schnittstellenwechsel können den ciao-Advertiser in einem
  nicht angekündigten Zustand belassen. OpenClaw versucht es einige Male erneut und deaktiviert Bonjour dann
  für den aktuellen Gateway-Prozess, statt den Advertiser endlos neu zu starten.
- **Docker-Bridge-Networking**: Bonjour deaktiviert sich in erkannten Containern automatisch.
  Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host, macvlan oder ein anderes
  mDNS-fähiges Netzwerk.
- **Ruhezustand / Schnittstellenwechsel**: macOS kann mDNS-Ergebnisse vorübergehend verlieren; versuchen Sie es erneut.
- **Browsing funktioniert, aber Auflösen schlägt fehl**: Halten Sie Rechnernamen einfach (vermeiden Sie Emojis oder
  Satzzeichen), starten Sie dann das Gateway neu. Der Service-Instanzname leitet sich vom
  Hostnamen ab, daher können zu komplexe Namen manche Resolver verwirren.

## Escaped-Instanznamen (`\032`)

Bonjour/DNS-SD escaped Bytes in Service-Instanznamen häufig als dezimale `\DDD`-
Sequenzen (z. B. werden Leerzeichen zu `\032`).

- Dies ist auf Protokollebene normal.
- UIs sollten zur Anzeige decodieren (iOS verwendet `BonjourEscapes.decode`).

## Aktivieren / Deaktivieren / Konfiguration

- macOS-Hosts starten standardmäßig automatisch das gebündelte Plugin für LAN-Erkennung.
- `openclaw plugins enable bonjour` aktiviert das gebündelte Plugin für LAN-Erkennung auf Hosts, auf denen es nicht standardmäßig aktiviert ist.
- `openclaw plugins disable bonjour` deaktiviert LAN-Multicast-Advertising, indem das gebündelte Plugin deaktiviert wird.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert LAN-Multicast-Advertising, ohne die Plugin-Konfiguration zu ändern; akzeptierte Truthy-Werte sind `1`, `true`, `yes` und `on` (veraltet: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` erzwingt LAN-Multicast-Advertising, auch innerhalb erkannter Container; akzeptierte Falsy-Werte sind `0`, `false`, `no` und `off`.
- Wenn das Bonjour-Plugin aktiviert und `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist, annonciert Bonjour auf normalen Hosts und deaktiviert sich innerhalb erkannter Container automatisch.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateway.
- `OPENCLAW_SSH_PORT` überschreibt den SSH-Port, wenn `sshPort` annonciert wird (veraltet: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen MagicDNS-Hinweis in TXT, wenn der vollständige mDNS-Modus aktiviert ist (veraltet: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` überschreibt den annoncierten CLI-Pfad (veraltet: `OPENCLAW_CLI_PATH`).

## Zugehörige Dokumentation

- Discovery-Richtlinie und Transportauswahl: [Discovery](/de/gateway/discovery)
- Node-Kopplung und Genehmigungen: [Gateway-Kopplung](/de/gateway/pairing)
