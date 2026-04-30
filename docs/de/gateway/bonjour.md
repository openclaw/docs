---
read_when:
    - Debugging von Bonjour-Erkennungsproblemen unter macOS/iOS
    - Ändern von mDNS-Diensttypen, TXT-Einträgen oder Erkennungs-UX
summary: Bonjour/mDNS-Erkennung + Debugging (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-04-30T06:51:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour- / mDNS-Erkennung

OpenClaw verwendet Bonjour (mDNS / DNS-SD), um ein aktives Gateway (WebSocket-Endpunkt) zu erkennen.
Multicast-`local.`-Browsing ist eine **reine LAN-Komfortfunktion**. Das gebündelte `bonjour`-
Plugin ist für LAN-Advertising zuständig und standardmäßig aktiviert. Für netzwerkübergreifende Erkennung
kann derselbe Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden.
Die Erkennung bleibt weiterhin Best-Effort und ersetzt **nicht** SSH- oder Tailnet-basierte Konnektivität.

## Wide-Area Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich Node und Gateway in verschiedenen Netzwerken befinden, überschreitet Multicast-mDNS die
Grenze nicht. Sie können dieselbe Erkennungs-UX beibehalten, indem Sie zu **Unicast DNS-SD**
("Wide-Area Bonjour") über Tailscale wechseln.

Übergeordnete Schritte:

1. Führen Sie einen DNS-Server auf dem Gateway-Host aus (über Tailnet erreichbar).
2. Veröffentlichen Sie DNS-SD-Einträge für `_openclaw-gw._tcp` unter einer dedizierten Zone
   (Beispiel: `openclaw.internal.`).
3. Konfigurieren Sie Tailscale-**Split-DNS**, damit Ihre gewählte Domain für Clients
   (einschließlich iOS) über diesen DNS-Server aufgelöst wird.

OpenClaw unterstützt jede Erkennungs-Domain; `openclaw.internal.` ist nur ein Beispiel.
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

Dadurch wird CoreDNS installiert und so konfiguriert, dass es:

- nur auf Port 53 auf den Tailscale-Schnittstellen des Gateways lauscht
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bereitstellt

Validieren Sie dies von einem mit Tailnet verbundenen Rechner aus:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Admin-Konsole:

- Fügen Sie einen Nameserver hinzu, der auf die Tailnet-IP des Gateways zeigt (UDP/TCP 53).
- Fügen Sie Split-DNS hinzu, damit Ihre Erkennungs-Domain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und die CLI-Erkennung
`_openclaw-gw._tcp` in Ihrer Erkennungs-Domain ohne Multicast browsen.

### Sicherheit des Gateway-Listeners (empfohlen)

Der Gateway-WS-Port (Standard `18789`) bindet standardmäßig an Loopback. Für LAN-/Tailnet-
Zugriff binden Sie explizit und lassen die Authentifizierung aktiviert.

Für reine Tailnet-Setups:

- Setzen Sie `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Starten Sie das Gateway neu (oder starten Sie die macOS-Menüleisten-App neu).

## Was advertised wird

Nur das Gateway advertised `_openclaw-gw._tcp`. LAN-Multicast-Advertising wird
durch das gebündelte `bonjour`-Plugin bereitgestellt; Wide-Area-DNS-SD-Publishing bleibt
Gateway-eigen.

## Diensttypen

- `_openclaw-gw._tcp` — Gateway-Transport-Beacon (verwendet von macOS-/iOS-/Android-Nodes).

## TXT-Schlüssel (nicht geheime Hinweise)

Das Gateway advertised kleine, nicht geheime Hinweise, um UI-Abläufe komfortabel zu machen:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (nur wenn TLS aktiviert ist)
- `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und ein Fingerprint verfügbar ist)
- `canvasPort=<port>` (nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (nur mDNS-Vollmodus, optionaler Hinweis, wenn Tailnet verfügbar ist)
- `sshPort=<port>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD kann ihn auslassen)
- `cliPath=<path>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD schreibt ihn weiterhin als Remote-Installations-Hinweis)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients dürfen TXT nicht als autoritatives Routing behandeln.
- Clients sollten über den aufgelösten Dienstendpunkt routen (SRV + A/AAAA). Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` nur als Hinweise.
- Automatisches SSH-Targeting sollte ebenfalls den aufgelösten Dienst-Host verwenden, nicht ausschließlich TXT-Hinweise.
- TLS-Pinning darf niemals zulassen, dass ein advertised `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten erkennungbasierte Direktverbindungen als **nur TLS** behandeln und eine ausdrückliche Bestätigung durch den Benutzer verlangen, bevor sie einem erstmaligen Fingerprint vertrauen.

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

Wenn Browsing funktioniert, aber die Auflösung fehlschlägt, liegt meist ein LAN-Richtlinien- oder
mDNS-Resolver-Problem vor.

## Debugging in Gateway-Logs

Das Gateway schreibt eine rotierende Logdatei (beim Start als
`gateway log file: ...` ausgegeben). Suchen Sie nach `bonjour:`-Zeilen, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour verwendet den System-Hostnamen für den advertised `.local`-Host, wenn er ein
gültiges DNS-Label ist. Wenn der System-Hostname Leerzeichen, Unterstriche oder ein anderes
ungültiges DNS-Label-Zeichen enthält, fällt OpenClaw auf `openclaw.local` zurück. Setzen Sie
`OPENCLAW_MDNS_HOSTNAME=<name>` vor dem Start des Gateways, wenn Sie ein
explizites Host-Label benötigen.

## Debugging auf dem iOS-Node

Der iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu erkennen.

So erfassen Sie Logs:

- Einstellungen → Gateway → Erweitert → **Erkennungs-Debug-Logs**
- Einstellungen → Gateway → Erweitert → **Erkennungs-Logs** → reproduzieren → **Kopieren**

Das Log enthält Browser-Zustandsübergänge und Änderungen der Ergebnismenge.

## Wann Bonjour deaktiviert werden sollte

Deaktivieren Sie Bonjour nur, wenn LAN-Multicast-Advertising nicht verfügbar oder schädlich ist.
Der häufige Fall ist ein Gateway, das hinter Docker-Bridge-Networking, WSL oder einer
Netzwerkrichtlinie läuft, die mDNS-Multicast verwirft. In diesen Umgebungen ist das Gateway
weiterhin über seine veröffentlichte URL, SSH, Tailnet oder Wide-Area-DNS-SD erreichbar,
aber LAN-Auto-Discovery ist nicht zuverlässig.

Bevorzugen Sie den vorhandenen Environment-Override, wenn das Problem deployment-spezifisch ist:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Das deaktiviert LAN-Multicast-Advertising, ohne die Plugin-Konfiguration zu ändern.
Es ist sicher für Docker-Images, Dienstdateien, Startskripte und einmaliges
Debugging, da die Einstellung verschwindet, wenn die Umgebung dies tut.

Verwenden Sie die Plugin-Konfiguration nur, wenn Sie das
gebündelte LAN-Erkennungs-Plugin für diese OpenClaw-Konfiguration absichtlich ausschalten möchten:

```bash
openclaw plugins disable bonjour
```

## Docker-Fallstricke

Das gebündelte Bonjour-Plugin deaktiviert LAN-Multicast-Advertising in erkannten
Containern automatisch, wenn `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist. Docker-Bridge-Netzwerke
leiten mDNS-Multicast (`224.0.0.251:5353`) zwischen Container
und LAN in der Regel nicht weiter, daher führt Advertising aus dem Container selten dazu, dass die Erkennung funktioniert.

Wichtige Fallstricke:

- Das Deaktivieren von Bonjour stoppt das Gateway nicht. Es stoppt nur LAN-Multicast-
  Advertising.
- Das Deaktivieren von Bonjour ändert `gateway.bind` nicht; Docker verwendet weiterhin standardmäßig
  `OPENCLAW_GATEWAY_BIND=lan`, damit der veröffentlichte Host-Port funktionieren kann.
- Das Deaktivieren von Bonjour deaktiviert Wide-Area-DNS-SD nicht. Verwenden Sie Wide-Area-Erkennung
  oder Tailnet, wenn sich Gateway und Node nicht im selben LAN befinden.
- Die Wiederverwendung desselben `OPENCLAW_CONFIG_DIR` außerhalb von Docker persistiert die
  Container-Auto-Deaktivierungsrichtlinie nicht.
- Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host-Networking, macvlan oder ein anderes
  Netzwerk, bei dem bekannt ist, dass mDNS-Multicast durchgelassen wird; setzen Sie es auf `1`, um die Deaktivierung zu erzwingen.

## Fehlerbehebung bei deaktiviertem Bonjour

Wenn ein Node das Gateway nach der Docker-Einrichtung nicht mehr automatisch erkennt:

1. Bestätigen Sie, ob das Gateway im Auto-, erzwungen eingeschalteten oder erzwungen ausgeschalteten Modus läuft:

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

4. Wenn Sie Bonjour in Docker absichtlich mit
   `OPENCLAW_DISABLE_BONJOUR=0` aktiviert haben, testen Sie Multicast vom Host aus:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Wenn Browsing leer ist oder die Gateway-Logs wiederholte ciao-Watchdog-
   Abbrüche zeigen, stellen Sie `OPENCLAW_DISABLE_BONJOUR=1` wieder her und verwenden Sie eine direkte oder
   Tailnet-Route.

## Häufige Fehlermodi

- **Bonjour überschreitet keine Netzwerkgrenzen**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Einige WLAN-Netzwerke deaktivieren mDNS.
- **Advertiser hängt in probing/announcing**: Hosts mit blockiertem Multicast,
  Container-Bridges, WSL oder Schnittstellenwechsel können den ciao-Advertiser in einem
  nicht announced Zustand lassen. OpenClaw versucht es einige Male erneut und deaktiviert Bonjour dann
  für den aktuellen Gateway-Prozess, anstatt den Advertiser endlos neu zu starten.
- **Docker-Bridge-Networking**: Bonjour deaktiviert sich in erkannten Containern automatisch.
  Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host, macvlan oder ein anderes
  mDNS-fähiges Netzwerk.
- **Ruhezustand / Schnittstellenwechsel**: macOS kann mDNS-Ergebnisse vorübergehend verlieren; versuchen Sie es erneut.
- **Browsing funktioniert, Auflösen schlägt fehl**: Halten Sie Rechnernamen einfach (vermeiden Sie Emojis oder
  Satzzeichen) und starten Sie dann das Gateway neu. Der Dienstinstanzname wird aus
  dem Hostnamen abgeleitet, daher können übermäßig komplexe Namen einige Resolver verwirren.

## Escaped-Instanznamen (`\032`)

Bonjour/DNS-SD escaped Bytes in Dienstinstanznamen häufig als dezimale `\DDD`-
Sequenzen (z. B. werden Leerzeichen zu `\032`).

- Dies ist auf Protokollebene normal.
- UIs sollten für die Anzeige decodieren (iOS verwendet `BonjourEscapes.decode`).

## Deaktivierung / Konfiguration

- `openclaw plugins disable bonjour` deaktiviert LAN-Multicast-Advertising, indem das gebündelte Plugin deaktiviert wird.
- `openclaw plugins enable bonjour` stellt das standardmäßige LAN-Erkennungs-Plugin wieder her.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert LAN-Multicast-Advertising, ohne die Plugin-Konfiguration zu ändern; akzeptierte truthy-Werte sind `1`, `true`, `yes` und `on` (Legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` erzwingt LAN-Multicast-Advertising, auch innerhalb erkannter Container; akzeptierte falsy-Werte sind `0`, `false`, `no` und `off`.
- Wenn `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist, advertised Bonjour auf normalen Hosts und deaktiviert sich innerhalb erkannter Container automatisch.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Gateway-Bind-Modus.
- `OPENCLAW_SSH_PORT` überschreibt den SSH-Port, wenn `sshPort` advertised wird (Legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen MagicDNS-Hinweis in TXT, wenn der mDNS-Vollmodus aktiviert ist (Legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` überschreibt den advertised CLI-Pfad (Legacy: `OPENCLAW_CLI_PATH`).

## Zugehörige Dokumentation

- Erkennungsrichtlinie und Transportauswahl: [Erkennung](/de/gateway/discovery)
- Node-Kopplung + Genehmigungen: [Gateway-Kopplung](/de/gateway/pairing)
