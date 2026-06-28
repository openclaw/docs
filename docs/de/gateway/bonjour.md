---
read_when:
    - Fehlerbehebung bei Problemen mit der Bonjour-Erkennung unter macOS/iOS
    - Ändern von mDNS-Diensttypen, TXT-Einträgen oder der Discovery-UX
summary: Bonjour/mDNS-Erkennung und Debugging (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-05-12T12:55:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw kann Bonjour (mDNS / DNS-SD) verwenden, um einen aktiven Gateway (WebSocket-Endpunkt) zu erkennen.
Multicast-`local.`-Browsing ist eine **reine LAN-Komfortfunktion**. Das gebündelte `bonjour`
Plugin ist für LAN-Advertising zuständig. Es startet automatisch auf macOS-Hosts und ist auf
Linux, Windows und containerisierten Gateway-Deployments opt-in. Für netzwerkübergreifende Erkennung kann derselbe
Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden. Die Erkennung
bleibt Best-Effort und ersetzt **nicht** SSH- oder Tailnet-basierte Konnektivität.

## Wide-Area Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich Node und Gateway in unterschiedlichen Netzwerken befinden, überschreitet Multicast-mDNS die
Grenze nicht. Sie können dieselbe Discovery-UX beibehalten, indem Sie zu **Unicast DNS-SD**
("Wide-Area Bonjour") über Tailscale wechseln.

Allgemeine Schritte:

1. Führen Sie einen DNS-Server auf dem Gateway-Host aus (über Tailnet erreichbar).
2. Veröffentlichen Sie DNS-SD-Records für `_openclaw-gw._tcp` unter einer dedizierten Zone
   (Beispiel: `openclaw.internal.`).
3. Konfigurieren Sie Tailscale-**Split-DNS**, damit Ihre gewählte Domain für Clients
   (einschließlich iOS) über diesen DNS-Server aufgelöst wird.

OpenClaw unterstützt jede Discovery-Domain; `openclaw.internal.` ist nur ein Beispiel.
iOS/Android-Nodes durchsuchen sowohl `local.` als auch Ihre konfigurierte Wide-Area-Domain.

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

- nur auf den Tailscale-Schnittstellen des Gateways auf Port 53 lauscht
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bereitstellt

Validieren Sie dies von einem mit dem Tailnet verbundenen Rechner:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Admin-Konsole:

- Fügen Sie einen Nameserver hinzu, der auf die Tailnet-IP des Gateways zeigt (UDP/TCP 53).
- Fügen Sie Split-DNS hinzu, damit Ihre Discovery-Domain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und die CLI-Discovery
`_openclaw-gw._tcp` in Ihrer Discovery-Domain ohne Multicast durchsuchen.

### Sicherheit des Gateway-Listeners (empfohlen)

Der Gateway-WS-Port (Standard `18789`) bindet standardmäßig an Loopback. Für LAN-/Tailnet-
Zugriff binden Sie explizit und lassen Authentifizierung aktiviert.

Für reine Tailnet-Setups:

- Setzen Sie `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Starten Sie den Gateway neu (oder starten Sie die macOS-Menubar-App neu).

## Was advertised wird

Nur der Gateway advertised `_openclaw-gw._tcp`. LAN-Multicast-Advertising wird
vom gebündelten `bonjour` Plugin bereitgestellt, wenn das Plugin aktiviert ist; Wide-Area-
DNS-SD-Publishing bleibt im Besitz des Gateways.

## Servicetypen

- `_openclaw-gw._tcp` - Gateway-Transport-Beacon (verwendet von macOS-/iOS-/Android-Nodes).

## TXT-Schlüssel (nicht geheime Hinweise)

Der Gateway advertised kleine, nicht geheime Hinweise, um UI-Abläufe komfortabel zu machen:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway-WS + HTTP)
- `gatewayTls=1` (nur wenn TLS aktiviert ist)
- `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und der Fingerprint verfügbar ist)
- `canvasPort=<port>` (nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (nur mDNS-Vollmodus, optionaler Hinweis, wenn Tailnet verfügbar ist)
- `sshPort=<port>` (nur Vollmodus; in den Modi minimal und off ausgelassen)
- `cliPath=<path>` (nur Vollmodus; in den Modi minimal und off ausgelassen)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Records sind **nicht authentifiziert**. Clients dürfen TXT nicht als autoritative Routing-Quelle behandeln.
- Clients sollten anhand des aufgelösten Service-Endpunkts routen (SRV + A/AAAA). Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` nur als Hinweise.
- SSH-Auto-Targeting sollte ebenfalls den aufgelösten Service-Host verwenden, keine reinen TXT-Hinweise.
- TLS-Pinning darf niemals zulassen, dass ein beworbener `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten Discovery-basierte Direktverbindungen als **nur TLS** behandeln und eine ausdrückliche Nutzerbestätigung verlangen, bevor sie einem erstmaligen Fingerprint vertrauen.

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

Wenn das Browsing funktioniert, das Auflösen aber fehlschlägt, liegt meist eine LAN-Richtlinie oder ein
mDNS-Resolver-Problem vor.

## Debugging in Gateway-Logs

Der Gateway schreibt eine rollierende Logdatei (beim Start ausgegeben als
`gateway log file: ...`). Suchen Sie nach `bonjour:`-Zeilen, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Der Watchdog behandelt aktive `probing`-, `announcing`- und frische Konflikt-Umbenennungen als
laufende Zustände. Wenn der Service nie `announced` erreicht, erstellt OpenClaw den Advertiser schließlich
neu und deaktiviert nach wiederholten Fehlern Bonjour für diesen
Gateway-Prozess, statt endlos erneut zu advertisen.

Bonjour verwendet den System-Hostnamen für den beworbenen `.local`-Host, wenn er ein
gültiges DNS-Label ist. Wenn der System-Hostname Leerzeichen, Unterstriche oder ein anderes
ungültiges DNS-Label-Zeichen enthält, fällt OpenClaw auf `openclaw.local` zurück. Setzen Sie
`OPENCLAW_MDNS_HOSTNAME=<name>` vor dem Starten des Gateways, wenn Sie ein
explizites Host-Label benötigen.

## Debugging auf dem iOS-Node

Der iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu erkennen.

So erfassen Sie Logs:

- Einstellungen → Gateway → Erweitert → **Discovery-Debug-Logs**
- Einstellungen → Gateway → Erweitert → **Discovery-Logs** → reproduzieren → **Kopieren**

Das Log enthält Browser-Zustandsübergänge und Änderungen der Ergebnismengen.

## Wann Bonjour aktiviert werden sollte

Bonjour startet automatisch beim Gateway-Start mit leerer Konfiguration auf macOS-Hosts, weil die
lokale App und nahe iOS-/Android-Nodes häufig auf Discovery im selben LAN angewiesen sind.

Aktivieren Sie Bonjour explizit, wenn automatische Erkennung im selben LAN auf Linux,
Windows oder einem anderen Nicht-macOS-Host nützlich ist:

```bash
openclaw plugins enable bonjour
```

Wenn aktiviert, verwendet Bonjour `discovery.mdns.mode`, um zu entscheiden, wie viele TXT-Metadaten
veröffentlicht werden. Derselbe Modus steuert optionale TXT-Hinweise in Wide-Area-DNS-SD-Records.
Der Standardmodus ist `minimal`; verwenden Sie `full` nur, wenn Clients `cliPath`- oder
`sshPort`-Hinweise benötigen. Verwenden Sie `off`, um LAN-Multicast zu unterdrücken, ohne die Plugin-
Aktivierung zu ändern; Wide-Area-DNS-SD kann weiterhin den minimalen Gateway-Beacon veröffentlichen, wenn
`discovery.wideArea.enabled` true ist.

## Wann Bonjour deaktiviert werden sollte

Lassen Sie Bonjour deaktiviert, wenn LAN-Multicast-Advertising unnötig, nicht verfügbar
oder schädlich ist. Häufige Fälle sind Nicht-macOS-Server, Docker-Bridge-Networking,
WSL oder eine Netzwerkrichtlinie, die mDNS-Multicast verwirft. In diesen Umgebungen ist der
Gateway weiterhin über seine veröffentlichte URL, SSH, Tailnet oder Wide-Area-
DNS-SD erreichbar, aber LAN-Auto-Discovery ist nicht zuverlässig.

Bevorzugen Sie den bestehenden Environment-Override, wenn das Problem deployment-bezogen ist:

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
und LAN normalerweise nicht weiter, daher führt Advertising aus dem Container selten zu funktionierender Discovery.

Wichtige Fallstricke:

- Bonjour startet automatisch auf macOS-Hosts und ist andernorts opt-in. Es
  deaktiviert zu lassen, stoppt den Gateway nicht; es überspringt nur LAN-Multicast-Advertising.
- Das Deaktivieren von Bonjour ändert `gateway.bind` nicht; Docker verwendet weiterhin standardmäßig
  `OPENCLAW_GATEWAY_BIND=lan`, damit der veröffentlichte Host-Port funktionieren kann.
- Das Deaktivieren von Bonjour deaktiviert Wide-Area-DNS-SD nicht. Verwenden Sie Wide-Area-Discovery
  oder Tailnet, wenn sich Gateway und Node nicht im selben LAN befinden.
- Die Wiederverwendung desselben `OPENCLAW_CONFIG_DIR` außerhalb von Docker persistiert die
  Auto-Deaktivierungsrichtlinie des Containers nicht.
- Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host-Networking, macvlan oder ein anderes
  Netzwerk, bei dem mDNS-Multicast bekanntermaßen durchkommt; setzen Sie es auf `1`, um die Deaktivierung zu erzwingen.

## Fehlerbehebung bei deaktiviertem Bonjour

Wenn ein Node den Gateway nach der Docker-Einrichtung nicht mehr automatisch erkennt:

1. Bestätigen Sie, ob der Gateway im Auto-, Forced-on- oder Forced-off-Modus läuft:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Bestätigen Sie, dass der Gateway selbst über den veröffentlichten Port erreichbar ist:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Verwenden Sie ein direktes Ziel, wenn Bonjour deaktiviert ist:
   - Control UI oder lokale Tools: `http://127.0.0.1:18789`
   - LAN-Clients: `http://<gateway-host>:18789`
   - Netzwerkübergreifende Clients: Tailnet MagicDNS, Tailnet-IP, SSH-Tunnel oder
     Wide-Area-DNS-SD

4. Wenn Sie das Bonjour-Plugin in Docker bewusst aktiviert und Advertising mit
   `OPENCLAW_DISABLE_BONJOUR=0` erzwungen haben, testen Sie Multicast vom Host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Wenn das Browsing leer ist oder die Gateway-Logs wiederholte ciao-Watchdog-
   Abbrüche zeigen, stellen Sie `OPENCLAW_DISABLE_BONJOUR=1` wieder her und verwenden Sie eine direkte oder
   Tailnet-Route.

## Häufige Fehlermodi

- **Bonjour überschreitet keine Netzwerke**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Manche WLAN-Netzwerke deaktivieren mDNS.
- **Advertiser hängt in probing/announcing fest**: Hosts mit blockiertem Multicast,
  Container-Bridges, WSL oder Schnittstellenwechsel können den ciao-Advertiser in einem
  nicht angekündigten Zustand zurücklassen. OpenClaw versucht es einige Male erneut und deaktiviert Bonjour dann
  für den aktuellen Gateway-Prozess, statt den Advertiser endlos neu zu starten.
- **Docker-Bridge-Networking**: Bonjour deaktiviert sich in erkannten Containern automatisch.
  Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host, macvlan oder ein anderes
  mDNS-fähiges Netzwerk.
- **Ruhezustand / Schnittstellenwechsel**: macOS kann mDNS-Ergebnisse vorübergehend verlieren; versuchen Sie es erneut.
- **Browsing funktioniert, aber Auflösen schlägt fehl**: Halten Sie Rechnernamen einfach (vermeiden Sie Emojis oder
  Satzzeichen), und starten Sie dann den Gateway neu. Der Service-Instanzname wird vom
  Hostnamen abgeleitet, daher können übermäßig komplexe Namen manche Resolver verwirren.

## Escapte Instanznamen (`\032`)

Bonjour/DNS-SD escapet Bytes in Service-Instanznamen häufig als dezimale `\DDD`-
Sequenzen (z. B. werden Leerzeichen zu `\032`).

- Dies ist auf Protokollebene normal.
- UIs sollten für die Anzeige dekodieren (iOS verwendet `BonjourEscapes.decode`).

## Aktivieren / Deaktivieren / Konfiguration

- macOS-Hosts starten das mitgelieferte LAN-Erkennungs-Plugin standardmäßig automatisch.
- `openclaw plugins enable bonjour` aktiviert das mitgelieferte LAN-Erkennungs-Plugin auf Hosts, auf denen es nicht standardmäßig aktiviert ist.
- `openclaw plugins disable bonjour` deaktiviert LAN-Multicast-Ankündigungen, indem das mitgelieferte Plugin deaktiviert wird.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert LAN-Multicast-Ankündigungen, ohne die Plugin-Konfiguration zu ändern; akzeptierte Wahrheitswerte sind `1`, `true`, `yes` und `on` (Legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` erzwingt LAN-Multicast-Ankündigungen, auch innerhalb erkannter Container; akzeptierte Falschwerte sind `0`, `false`, `no` und `off`.
- Wenn das Bonjour-Plugin aktiviert und `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist, kündigt Bonjour auf normalen Hosts an und deaktiviert sich innerhalb erkannter Container automatisch.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateways.
- `OPENCLAW_SSH_PORT` überschreibt den SSH-Port, wenn `sshPort` angekündigt wird (Legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen MagicDNS-Hinweis in TXT, wenn der mDNS-Vollmodus aktiviert ist (Legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad (Legacy: `OPENCLAW_CLI_PATH`).

## Verwandte Dokumentation

- Erkennungsrichtlinie und Transportauswahl: [Erkennung](/de/gateway/discovery)
- Node-Kopplung + Genehmigungen: [Gateway-Kopplung](/de/gateway/pairing)
