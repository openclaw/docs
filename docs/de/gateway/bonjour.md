---
read_when:
    - Fehlersuche bei Problemen mit der Bonjour-Erkennung unter macOS/iOS
    - Ändern von mDNS-Diensttypen, TXT-Einträgen oder der Erkennungs-UX
summary: Bonjour/mDNS-Erkennung und -Debugging (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-05-06T06:47:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw kann Bonjour (mDNS / DNS-SD) verwenden, um einen aktiven Gateway (WebSocket-Endpunkt) zu entdecken.
Multicast-`local.`-Browsing ist eine **reine LAN-Komfortfunktion**. Das mitgelieferte `bonjour`-Plugin ist für LAN-Ankündigungen zuständig. Es startet auf macOS-Hosts automatisch und ist auf Linux, Windows und containerisierten Gateway-Bereitstellungen optional. Für netzwerkübergreifende Erkennung kann derselbe Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden. Discovery bleibt weiterhin Best-Effort und ersetzt **nicht** SSH- oder Tailnet-basierte Konnektivität.

## Wide-Area Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich der Node und der Gateway in unterschiedlichen Netzwerken befinden, überschreitet Multicast-mDNS die Grenze nicht. Sie können dieselbe Discovery-Benutzererfahrung beibehalten, indem Sie zu **Unicast DNS-SD** („Wide-Area Bonjour“) über Tailscale wechseln.

Übergeordnete Schritte:

1. Führen Sie einen DNS-Server auf dem Gateway-Host aus (über Tailnet erreichbar).
2. Veröffentlichen Sie DNS-SD-Einträge für `_openclaw-gw._tcp` unter einer dedizierten Zone
   (Beispiel: `openclaw.internal.`).
3. Konfigurieren Sie Tailscale-**Split-DNS**, damit Ihre gewählte Domain für Clients (einschließlich iOS) über diesen DNS-Server aufgelöst wird.

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
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bedient

Validieren Sie dies von einem mit Tailnet verbundenen Rechner:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Admin-Konsole:

- Fügen Sie einen Nameserver hinzu, der auf die Tailnet-IP des Gateways zeigt (UDP/TCP 53).
- Fügen Sie Split-DNS hinzu, damit Ihre Discovery-Domain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und CLI-Discovery `_openclaw-gw._tcp` in Ihrer Discovery-Domain ohne Multicast browsen.

### Sicherheit des Gateway-Listeners (empfohlen)

Der Gateway-WS-Port (Standard `18789`) bindet standardmäßig an loopback. Für LAN-/Tailnet-Zugriff binden Sie explizit und lassen Auth aktiviert.

Für reine Tailnet-Setups:

- Setzen Sie `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Starten Sie den Gateway neu (oder starten Sie die macOS-Menüleisten-App neu).

## Was angekündigt wird

Nur der Gateway kündigt `_openclaw-gw._tcp` an. LAN-Multicast-Ankündigungen werden vom mitgelieferten `bonjour`-Plugin bereitgestellt, wenn das Plugin aktiviert ist; Wide-Area-DNS-SD-Veröffentlichung bleibt Eigentum des Gateways.

## Diensttypen

- `_openclaw-gw._tcp` - Gateway-Transport-Beacon (von macOS-/iOS-/Android-Nodes verwendet).

## TXT-Schlüssel (nicht geheime Hinweise)

Der Gateway kündigt kleine, nicht geheime Hinweise an, um UI-Abläufe komfortabel zu machen:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (nur wenn TLS aktiviert ist)
- `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und ein Fingerprint verfügbar ist)
- `canvasPort=<port>` (nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (nur mDNS-Vollmodus, optionaler Hinweis, wenn Tailnet verfügbar ist)
- `sshPort=<port>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD kann ihn weglassen)
- `cliPath=<path>` (nur mDNS-Vollmodus; Wide-Area-DNS-SD schreibt ihn weiterhin als Remote-Install-Hinweis)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients dürfen TXT nicht als maßgebliche Routing-Quelle behandeln.
- Clients sollten den aufgelösten Dienstendpunkt verwenden (SRV + A/AAAA). Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` nur als Hinweise.
- Automatische SSH-Zielauswahl sollte ebenfalls den aufgelösten Dienst-Host verwenden, nicht ausschließlich TXT-Hinweise.
- TLS-Pinning darf niemals zulassen, dass ein angekündigtes `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten discovery-basierte direkte Verbindungen als **nur TLS** behandeln und explizite Benutzerbestätigung verlangen, bevor sie einem erstmaligen Fingerprint vertrauen.

## Debugging unter macOS

Nützliche integrierte Werkzeuge:

- Instanzen browsen:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Eine Instanz auflösen (ersetzen Sie `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Wenn Browsing funktioniert, aber die Auflösung fehlschlägt, handelt es sich meist um eine LAN-Richtlinie oder ein mDNS-Resolver-Problem.

## Debugging in Gateway-Logs

Der Gateway schreibt eine rotierende Logdatei (beim Start als `gateway log file: ...` ausgegeben). Suchen Sie nach `bonjour:`-Zeilen, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour verwendet den System-Hostnamen für den angekündigten `.local`-Host, wenn dieser ein gültiges DNS-Label ist. Wenn der System-Hostname Leerzeichen, Unterstriche oder ein anderes ungültiges DNS-Label-Zeichen enthält, fällt OpenClaw auf `openclaw.local` zurück. Setzen Sie `OPENCLAW_MDNS_HOSTNAME=<name>` vor dem Start des Gateways, wenn Sie ein explizites Host-Label benötigen.

## Debugging auf einem iOS-Node

Der iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu entdecken.

So erfassen Sie Logs:

- Einstellungen → Gateway → Erweitert → **Discovery-Debug-Logs**
- Einstellungen → Gateway → Erweitert → **Discovery-Logs** → reproduzieren → **Kopieren**

Das Log enthält Browser-Zustandsübergänge und Änderungen der Ergebnismenge.

## Wann Bonjour aktiviert werden sollte

Bonjour startet bei leerer Gateway-Konfiguration auf macOS-Hosts automatisch, weil die lokale App und nahegelegene iOS-/Android-Nodes häufig auf Discovery im selben LAN angewiesen sind.

Aktivieren Sie Bonjour explizit, wenn automatische Discovery im selben LAN auf Linux, Windows oder einem anderen Nicht-macOS-Host nützlich ist:

```bash
openclaw plugins enable bonjour
```

Wenn Bonjour aktiviert ist, verwendet es `discovery.mdns.mode`, um zu entscheiden, wie viele TXT-Metadaten veröffentlicht werden. Der Standardmodus ist `minimal`; verwenden Sie `full` nur, wenn lokale Clients `cliPath`- oder `sshPort`-Hinweise benötigen, und verwenden Sie `off`, um LAN-Multicast zu unterdrücken, ohne die Plugin-Aktivierung zu ändern.

## Wann Bonjour deaktiviert werden sollte

Lassen Sie Bonjour deaktiviert, wenn LAN-Multicast-Ankündigungen unnötig, nicht verfügbar oder schädlich sind. Typische Fälle sind Nicht-macOS-Server, Docker-Bridge-Netzwerke, WSL oder eine Netzwerkrichtlinie, die mDNS-Multicast verwirft. In diesen Umgebungen ist der Gateway weiterhin über seine veröffentlichte URL, SSH, Tailnet oder Wide-Area-DNS-SD erreichbar, aber LAN-Auto-Discovery ist nicht zuverlässig.

Bevorzugen Sie die bestehende Umgebungsüberschreibung, wenn das Problem bereitstellungsbezogen ist:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Dies deaktiviert LAN-Multicast-Ankündigungen, ohne die Plugin-Konfiguration zu ändern.
Es ist sicher für Docker-Images, Service-Dateien, Startskripte und einmaliges Debugging, weil die Einstellung verschwindet, wenn die Umgebung dies tut.

Verwenden Sie die Plugin-Konfiguration, wenn Sie das mitgelieferte LAN-Discovery-Plugin für diese OpenClaw-Konfiguration absichtlich ausschalten möchten:

```bash
openclaw plugins disable bonjour
```

## Docker-Fallstricke

Das mitgelieferte Bonjour-Plugin deaktiviert LAN-Multicast-Ankündigungen in erkannten Containern automatisch, wenn `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist. Docker-Bridge-Netzwerke leiten mDNS-Multicast (`224.0.0.251:5353`) zwischen Container und LAN in der Regel nicht weiter, daher sorgt eine Ankündigung aus dem Container nur selten dafür, dass Discovery funktioniert.

Wichtige Fallstricke:

- Bonjour startet auf macOS-Hosts automatisch und ist anderswo opt-in. Es deaktiviert zu lassen stoppt den Gateway nicht; es überspringt nur LAN-Multicast-Ankündigungen.
- Das Deaktivieren von Bonjour ändert `gateway.bind` nicht; Docker verwendet weiterhin standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit der veröffentlichte Host-Port funktionieren kann.
- Das Deaktivieren von Bonjour deaktiviert Wide-Area-DNS-SD nicht. Verwenden Sie Wide-Area-Discovery oder Tailnet, wenn Gateway und Node nicht im selben LAN sind.
- Die Wiederverwendung desselben `OPENCLAW_CONFIG_DIR` außerhalb von Docker persistiert die Container-Auto-Deaktivierungsrichtlinie nicht.
- Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host-Networking, macvlan oder ein anderes Netzwerk, in dem mDNS-Multicast bekanntermaßen durchkommt; setzen Sie es auf `1`, um die Deaktivierung zu erzwingen.

## Fehlerbehebung bei deaktiviertem Bonjour

Wenn ein Node den Gateway nach der Docker-Einrichtung nicht mehr automatisch entdeckt:

1. Prüfen Sie, ob der Gateway im automatischen, erzwungen aktivierten oder erzwungen deaktivierten Modus läuft:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Prüfen Sie, ob der Gateway selbst über den veröffentlichten Port erreichbar ist:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Verwenden Sie ein direktes Ziel, wenn Bonjour deaktiviert ist:
   - Control UI oder lokale Werkzeuge: `http://127.0.0.1:18789`
   - LAN-Clients: `http://<gateway-host>:18789`
   - Netzwerkübergreifende Clients: Tailnet MagicDNS, Tailnet-IP, SSH-Tunnel oder
     Wide-Area-DNS-SD

4. Wenn Sie das Bonjour-Plugin in Docker absichtlich aktiviert und Ankündigungen mit `OPENCLAW_DISABLE_BONJOUR=0` erzwungen haben, testen Sie Multicast vom Host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Wenn Browsing leer ist oder die Gateway-Logs wiederholte ciao-Watchdog-Abbrüche zeigen, stellen Sie `OPENCLAW_DISABLE_BONJOUR=1` wieder her und verwenden Sie eine direkte oder Tailnet-Route.

## Häufige Fehlermodi

- **Bonjour überschreitet keine Netzwerke**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Einige WLAN-Netzwerke deaktivieren mDNS.
- **Advertiser bleibt beim Probing/Announcing hängen**: Hosts mit blockiertem Multicast, Container-Bridges, WSL oder Schnittstellenwechsel können den ciao-Advertiser in einem nicht angekündigten Zustand hinterlassen. OpenClaw versucht es einige Male erneut und deaktiviert Bonjour dann für den aktuellen Gateway-Prozess, statt den Advertiser endlos neu zu starten.
- **Docker-Bridge-Networking**: Bonjour deaktiviert sich in erkannten Containern automatisch. Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host, macvlan oder ein anderes mDNS-fähiges Netzwerk.
- **Ruhezustand / Schnittstellenwechsel**: macOS kann mDNS-Ergebnisse vorübergehend verlieren; versuchen Sie es erneut.
- **Browsing funktioniert, aber Auflösung schlägt fehl**: Halten Sie Rechnernamen einfach (vermeiden Sie Emojis oder Satzzeichen), und starten Sie dann den Gateway neu. Der Name der Dienstinstanz wird aus dem Hostnamen abgeleitet, sodass übermäßig komplexe Namen manche Resolver verwirren können.

## Escaped-Instanznamen (`\032`)

Bonjour/DNS-SD maskiert Bytes in Dienstinstanznamen häufig als dezimale `\DDD`-Sequenzen (z. B. werden Leerzeichen zu `\032`).

- Dies ist auf Protokollebene normal.
- UIs sollten für die Anzeige decodieren (iOS verwendet `BonjourEscapes.decode`).

## Aktivierung / Deaktivierung / Konfiguration

- macOS-Hosts starten das mitgelieferte LAN-Discovery-Plugin standardmäßig automatisch.
- `openclaw plugins enable bonjour` aktiviert das mitgelieferte LAN-Discovery-Plugin auf Hosts, auf denen es nicht standardmäßig aktiviert ist.
- `openclaw plugins disable bonjour` deaktiviert LAN-Multicast-Ankündigungen, indem das mitgelieferte Plugin deaktiviert wird.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert LAN-Multicast-Ankündigungen, ohne die Plugin-Konfiguration zu ändern; akzeptierte Wahrheitswerte sind `1`, `true`, `yes` und `on` (Legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` erzwingt LAN-Multicast-Ankündigungen, auch innerhalb erkannter Container; akzeptierte Falschwerte sind `0`, `false`, `no` und `off`.
- Wenn das Bonjour-Plugin aktiviert ist und `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist, kündigt Bonjour auf normalen Hosts an und deaktiviert sich innerhalb erkannter Container automatisch.
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Gateway-Bindemodus.
- `OPENCLAW_SSH_PORT` überschreibt den SSH-Port, wenn `sshPort` angekündigt wird (Legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen MagicDNS-Hinweis in TXT, wenn der mDNS-Vollmodus aktiviert ist (Legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad (Legacy: `OPENCLAW_CLI_PATH`).

## Verwandte Dokumentation

- Discovery-Richtlinie und Transportauswahl: [Discovery](/de/gateway/discovery)
- Node-Kopplung + Genehmigungen: [Gateway-Kopplung](/de/gateway/pairing)
