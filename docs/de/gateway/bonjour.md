---
read_when:
    - Fehlerbehebung bei Problemen mit der Bonjour-Erkennung unter macOS/iOS
    - Ändern von mDNS-Diensttypen, TXT-Einträgen oder der Discovery-UX
summary: Bonjour-/mDNS-Erkennung und -Fehlerbehebung (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-07-16T12:42:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw kann Bonjour (mDNS/DNS-SD) verwenden, um ein aktives Gateway (WebSocket-Endpunkt) zu erkennen. Multicast-`local.`-Browsing ist eine **reine LAN-Komfortfunktion**: Das gebündelte `bonjour`-Plugin ist für die LAN-Ankündigung zuständig, startet auf macOS-Hosts automatisch und muss unter Linux, Windows sowie bei containerisierten Gateway-Bereitstellungen aktiviert werden. Dasselbe Beacon kann für die netzwerkübergreifende Erkennung auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden. Die Erkennung erfolgt nach bestem Bemühen und ersetzt **nicht** die Konnektivität über SSH oder Tailnet.

## Wide-Area Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich Node und Gateway in verschiedenen Netzwerken befinden, kann Multicast-mDNS die Grenze nicht überschreiten. Behalten Sie dieselbe Erkennungs-UX bei, indem Sie über Tailscale zu **Unicast DNS-SD** („Wide-Area Bonjour“) wechseln:

1. Führen Sie auf dem Gateway-Host einen DNS-Server aus, der über das Tailnet erreichbar ist.
2. Veröffentlichen Sie DNS-SD-Einträge für `_openclaw-gw._tcp` unter einer dedizierten Zone (Beispiel: `openclaw.internal.`).
3. Konfigurieren Sie **Split DNS** in Tailscale so, dass Ihre gewählte Domain für Clients einschließlich iOS über diesen DNS-Server aufgelöst wird.

`openclaw.internal.` oben ist nur ein Beispiel – OpenClaw unterstützt jede Erkennungsdomain. iOS-/Android-Nodes durchsuchen sowohl `local.` als auch Ihre konfigurierte Wide-Area-Domain.

### Gateway-Konfiguration

```json5
{
  gateway: { bind: "tailnet" }, // nur Tailnet (empfohlen)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` akzeptiert außerdem die Umgebungsvariable `OPENCLAW_WIDE_AREA_DOMAIN` als Fallback, wenn kein Wert festgelegt ist.

### Einmalige Einrichtung des DNS-Servers (Gateway-Host, nur macOS)

```bash
openclaw dns setup --apply
```

Dieser Befehl ist nur für macOS verfügbar und erfordert Homebrew sowie eine aktive Tailscale-Verbindung. Er installiert CoreDNS (`brew install coredns`) und konfiguriert es so, dass es:

- nur an den Tailscale-Schnittstellen des Gateways auf Port 53 lauscht
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bereitstellt

Führen Sie den Befehl zunächst ohne `--apply` aus, um den Plan (Domain, Pfad der Zonendatei, erkannte Tailnet-IP, empfohlene Konfiguration) vorab anzuzeigen, ohne etwas zu installieren.

Validieren Sie die Einrichtung von einem mit dem Tailnet verbundenen Rechner:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Administratorkonsole:

- Fügen Sie einen Nameserver hinzu, der auf die Tailnet-IP des Gateways verweist (UDP/TCP 53).
- Fügen Sie Split DNS hinzu, damit Ihre Erkennungsdomain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und die CLI-Erkennung `_openclaw-gw._tcp` in Ihrer Erkennungsdomain ohne Multicast durchsuchen.

### Sicherheit des Gateway-Listeners

Der Gateway-WS-Port (standardmäßig `18789`) wird standardmäßig an die Loopback-Schnittstelle gebunden. Binden Sie ihn für LAN-/Tailnet-Zugriff explizit und lassen Sie die Authentifizierung aktiviert. Legen Sie für reine Tailnet-Setups `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json` fest und starten Sie das Gateway (oder die macOS-Menüleisten-App) neu.

## Was angekündigt wird

Nur das Gateway kündigt `_openclaw-gw._tcp` an. Die LAN-Multicast-Ankündigung erfolgt bei Aktivierung durch das gebündelte `bonjour`-Plugin; die Veröffentlichung über Wide-Area DNS-SD bleibt Aufgabe des Gateways.

## Diensttypen

- `_openclaw-gw._tcp` – Transport-Beacon des Gateways, das von macOS-/iOS-/Android-Nodes verwendet wird.

## TXT-Schlüssel (nicht geheime Hinweise)

| Schlüssel                      | Wenn vorhanden                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `role=gateway`             | Immer.                                                                         |
| `displayName=<friendly name>`             | Immer.                                                                         |
| `lanHost=<hostname>.local`             | Immer.                                                                         |
| `gatewayPort=<port>`             | Immer (Gateway-WS + HTTP).                                                      |
| `transport=gateway`             | Immer.                                                                         |
| `gatewayTls=1`             | Nur wenn TLS aktiviert ist.                                                    |
| `gatewayTlsSha256=<sha256>`             | Nur wenn TLS aktiviert und ein Fingerabdruck verfügbar ist.                    |
| `gatewayDirectReachable=1`             | Nur wenn das Gateway direkt erreichbar ist (nicht nur über einen Relay-/Proxy-Pfad). |
| `canvasPort=<port>`             | Nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`. |
| `tailnetDns=<magicdns>`             | Nur im vollständigen mDNS-Modus; optionaler Hinweis, wenn Tailnet verfügbar ist. |
| `sshPort=<port>`             | Nur im vollständigen Modus; im minimalen und deaktivierten Modus nicht enthalten. |
| `cliPath=<path>`             | Nur im vollständigen Modus; im minimalen und deaktivierten Modus nicht enthalten. |

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients dürfen TXT nicht als maßgebliche Routing-Information behandeln.
- Clients sollten das Routing anhand des aufgelösten Dienstendpunkts (SRV + A/AAAA) durchführen. Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` nur als Hinweise.
- Die automatische SSH-Zielauswahl sollte ebenfalls den aufgelösten Diensthost und nicht ausschließlich TXT-Hinweise verwenden.
- Beim TLS-Pinning darf ein angekündigter `gatewayTlsSha256` niemals einen zuvor gespeicherten Pin überschreiben.
- iOS-/Android-Nodes sollten direkte, auf der Erkennung basierende Verbindungen als **reine TLS-Verbindungen** behandeln und vor dem erstmaligen Vertrauen eines Fingerabdrucks eine ausdrückliche Bestätigung durch den Benutzer verlangen.

## Debugging unter macOS

Integrierte Werkzeuge:

```bash
# Instanzen durchsuchen
dns-sd -B _openclaw-gw._tcp local.

# Eine Instanz auflösen (<instance> ersetzen)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Wenn das Durchsuchen funktioniert, die Auflösung jedoch fehlschlägt, liegt in der Regel ein Problem mit einer LAN-Richtlinie oder dem mDNS-Resolver vor.

## Debugging in Gateway-Protokollen

Das Gateway schreibt eine rotierende Protokolldatei (beim Start als `gateway log file: ...` ausgegeben). Suchen Sie nach `bonjour:`-Zeilen, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw startet jeden Bonjour-Dienst einmal und überlässt das Prüfen, Wiederholen, Auflösen von Namenskonflikten und erneute Veröffentlichen bei Schnittstellenänderungen dem mDNS-Responder. Dadurch werden sich überschneidende Veröffentlichungsversuche bei normalen Netzwerkänderungen vermieden. Wiederholte interne Selbstprüfungsnachrichten werden unterdrückt, damit sie das Gateway-Protokoll nicht überfluten können.

Wenn mehrere OpenClaw-Gateways vom selben Host aus Ankündigungen senden, kann Bonjour Suffixe wie `(2)` oder `(3)` anhängen, um eindeutige Namen für Dienstinstanzen sicherzustellen. Diese Suffixe sind Teil der normalen Konfliktauflösung und weisen nicht auf eine doppelte OCM-Überwachung hin.

Bonjour verwendet den System-Hostnamen für den angekündigten `.local`-Host, sofern er eine gültige DNS-Bezeichnung ist. Wenn der System-Hostname Leerzeichen, Unterstriche oder andere für DNS-Bezeichnungen ungültige Zeichen enthält, weicht OpenClaw auf `openclaw.local` aus. Legen Sie `OPENCLAW_MDNS_HOSTNAME=<name>` vor dem Start des Gateways fest, wenn Sie eine explizite Hostbezeichnung benötigen.

## Debugging auf dem iOS-Node

Der iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu erkennen.

So erfassen Sie Protokolle: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, anschließend Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduzieren -> **Copy**. Das Protokoll enthält Zustandsübergänge des Browsers und Änderungen der Ergebnismenge.

## Wann Bonjour aktiviert werden sollte

Bonjour startet auf macOS-Hosts automatisch, wenn das Gateway mit leerer Konfiguration gestartet wird, da die lokale App und iOS-/Android-Nodes in der Nähe häufig auf die Erkennung im selben LAN angewiesen sind.

Aktivieren Sie es explizit, wenn die automatische Erkennung im selben LAN unter Linux, Windows oder auf einem anderen Nicht-macOS-Host nützlich ist:

```bash
openclaw plugins enable bonjour
```

Wenn Bonjour aktiviert ist, bestimmt `discovery.mdns.mode`, wie viele TXT-Metadaten veröffentlicht werden; derselbe Modus steuert optionale TXT-Hinweise in Wide-Area-DNS-SD-Einträgen. Modi:

| Modus                       | Verhalten                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (Standard) | Nur grundlegende TXT-Schlüssel; `sshPort`, `cliPath` und `tailnetDns` werden ausgelassen.                                           |
| `full`          | Fügt `sshPort`, `cliPath` und `tailnetDns` hinzu – verwenden Sie diesen Modus, wenn Clients diese Hinweise benötigen.                 |
| `off`          | Unterdrückt LAN-Multicast, ohne die Plugin-Aktivierung zu ändern; Wide-Area DNS-SD kann das minimale Beacon weiterhin veröffentlichen, wenn `discovery.wideArea.enabled` wahr ist. |

## Wann Bonjour deaktiviert werden sollte

Lassen Sie Bonjour deaktiviert, wenn LAN-Multicast-Ankündigungen unnötig, nicht verfügbar oder nachteilig sind – typische Fälle sind Nicht-macOS-Server, Docker-Bridge-Netzwerke, WSL oder eine Netzwerkrichtlinie, die mDNS-Multicast verwirft. Das Gateway bleibt über seine veröffentlichte URL, SSH, Tailnet oder Wide-Area DNS-SD erreichbar; lediglich die automatische LAN-Erkennung ist unzuverlässig.

Verwenden Sie die Umgebungsüberschreibung für bereitstellungsspezifische Probleme (sicher für Docker-Images, Dienstdateien, Startskripte und einmaliges Debugging – sie verschwindet zusammen mit der Umgebung):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Verwenden Sie die Plugin-Konfiguration, wenn Sie das gebündelte LAN-Erkennungs-Plugin für diese OpenClaw-Konfiguration bewusst deaktivieren möchten:

```bash
openclaw plugins disable bonjour
```

## Besonderheiten bei Docker

Das gebündelte Bonjour-Plugin deaktiviert LAN-Multicast-Ankündigungen in erkannten Containern automatisch, wenn `OPENCLAW_DISABLE_BONJOUR` nicht festgelegt ist. Docker-Bridge-Netzwerke leiten mDNS-Multicast (`224.0.0.251:5353`) zwischen Container und LAN üblicherweise nicht weiter, sodass Ankündigungen aus dem Container nur selten eine funktionierende Erkennung ermöglichen.

Besonderheiten:

- Bonjour startet auf macOS-Hosts automatisch und muss andernorts aktiviert werden. Wenn es deaktiviert bleibt, wird das Gateway nicht angehalten – lediglich die LAN-Multicast-Ankündigung wird übersprungen.
- Das Deaktivieren von Bonjour ändert `gateway.bind` nicht; Docker verwendet weiterhin standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit der veröffentlichte Host-Port funktioniert.
- Das Deaktivieren von Bonjour deaktiviert Wide-Area DNS-SD nicht. Verwenden Sie Wide-Area-Erkennung oder Tailnet, wenn sich Gateway und Node nicht im selben LAN befinden.
- Wenn dasselbe `OPENCLAW_CONFIG_DIR` außerhalb von Docker wiederverwendet wird, bleibt die Richtlinie zur automatischen Deaktivierung im Container nicht bestehen.
- Legen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host-Netzwerke, macvlan oder andere Netzwerke fest, bei denen mDNS-Multicast nachweislich weitergeleitet wird; setzen Sie es auf `1`, um die Deaktivierung zu erzwingen.

## Fehlerbehebung bei deaktiviertem Bonjour

Wenn ein Node das Gateway nach der Docker-Einrichtung nicht mehr automatisch erkennt:

1. Prüfen Sie, ob das Gateway im automatischen, erzwungen aktivierten oder erzwungen deaktivierten Modus ausgeführt wird:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Prüfen Sie, ob das Gateway selbst über den veröffentlichten Port erreichbar ist:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Verwenden Sie ein direktes Ziel, wenn Bonjour deaktiviert ist:
   - Control UI oder lokale Werkzeuge: `http://127.0.0.1:18789`
   - LAN-Clients: `http://<gateway-host>:18789`
   - Netzwerkübergreifende Clients: Tailnet MagicDNS, Tailnet-IP, SSH-Tunnel oder Wide-Area DNS-SD

4. Wenn Sie das Bonjour-Plugin in Docker bewusst aktiviert und Ankündigungen mit `OPENCLAW_DISABLE_BONJOUR=0` erzwungen haben, testen Sie Multicast vom Host aus:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Wenn beim Durchsuchen keine Ergebnisse angezeigt werden oder die Gateway-Protokolle wiederholte ciao-Prüffehler enthalten, stellen Sie `OPENCLAW_DISABLE_BONJOUR=1` wieder her und verwenden Sie eine direkte Route oder eine Tailnet-Route.

## Häufige Fehlermodi

- **Bonjour funktioniert nicht netzwerkübergreifend**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Einige WLAN-Netzwerke deaktivieren mDNS.
- **Advertiser bleibt beim Prüfen/Ankündigen hängen**: Hosts mit blockiertem Multicast, Container-Bridges, WSL oder häufigen Schnittstellenänderungen können den Responder in einem nicht angekündigten Zustand belassen. Das Gateway bleibt über direkte Verbindungen, SSH, Tailnet oder Wide-Area-DNS-SD-Routen erreichbar; deaktivieren Sie LAN-Bonjour mit `discovery.mdns.mode: "off"` oder `OPENCLAW_DISABLE_BONJOUR=1`, wenn Multicast nicht verfügbar ist.
- **Docker-Bridge-Netzwerk**: Bonjour wird in erkannten Containern automatisch deaktiviert. Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host-, macvlan- oder andere mDNS-fähige Netzwerke.
- **Ruhezustand/Schnittstellenänderungen**: macOS kann mDNS-Ergebnisse vorübergehend verwerfen; versuchen Sie es erneut.
- **Durchsuchen funktioniert, aber die Auflösung schlägt fehl**: Halten Sie Rechnernamen einfach (vermeiden Sie Emojis oder Satzzeichen) und starten Sie anschließend das Gateway neu. Der Name der Dienstinstanz wird vom Hostnamen abgeleitet, daher können übermäßig komplexe Namen einige Resolver verwirren.

## Maskierte Instanznamen (`\032`)

Bonjour/DNS-SD maskiert Bytes in Namen von Dienstinstanzen häufig als dezimale `\DDD`-Sequenzen (Leerzeichen werden zu `\032`). Dies ist auf Protokollebene normal; Benutzeroberflächen sollten sie für die Anzeige dekodieren (iOS verwendet `BonjourEscapes.decode`).

## Aktivierung / Deaktivierung / Konfiguration

| Einstellung                                              | Auswirkung                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Aktiviert das gebündelte LAN-Erkennungs-Plugin auf Hosts, auf denen es nicht standardmäßig aktiviert ist. |
| `openclaw plugins disable bonjour`                   | Deaktiviert Multicast-Ankündigungen im LAN, indem das gebündelte Plugin deaktiviert wird.               |
| `OPENCLAW_DISABLE_BONJOUR=1` (oder `true`/`yes`/`on`)  | Deaktiviert Multicast-Ankündigungen im LAN, ohne die Plugin-Konfiguration zu ändern.                |
| `OPENCLAW_DISABLE_BONJOUR=0` (oder `false`/`no`/`off`) | Erzwingt Multicast-Ankündigungen im LAN, auch innerhalb erkannter Container.        |
| `discovery.mdns.mode`                                | `off` \| `minimal` (Standard) \| `full` — siehe Modi oben.                         |
| `gateway.bind`                                       | Steuert den Bindungsmodus des Gateways in `~/.openclaw/openclaw.json`.                    |
| `OPENCLAW_SSH_PORT`                                  | Überschreibt den SSH-Port, wenn `sshPort` angekündigt wird (vollständiger Modus).                  |
| `OPENCLAW_TAILNET_DNS`                               | Veröffentlicht einen MagicDNS-Hinweis in TXT, wenn der vollständige mDNS-Modus aktiviert ist.                  |
| `OPENCLAW_CLI_PATH`                                  | Überschreibt den angekündigten CLI-Pfad (vollständiger Modus).                                    |

macOS-Hosts starten das gebündelte LAN-Erkennungs-Plugin standardmäßig automatisch. Wenn das Bonjour-Plugin aktiviert und `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist, kündigt Bonjour auf normalen Hosts an und wird innerhalb erkannter Container (Docker, Fly.io-Maschinen und gängige Container-Runtimes) automatisch deaktiviert.

## Verwandte Dokumentation

- Erkennungsrichtlinie und Transportauswahl: [Erkennung](/de/gateway/discovery)
- Node-Kopplung und Genehmigungen: [Gateway-Kopplung](/de/gateway/pairing)
