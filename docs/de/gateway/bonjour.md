---
read_when:
    - Fehlerbehebung bei Problemen mit der Bonjour-Erkennung unter macOS/iOS
    - Ändern von mDNS-Diensttypen, TXT-Einträgen oder der Discovery-UX
summary: Bonjour-/mDNS-Erkennung und Fehlerbehebung (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-07-12T01:36:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw kann Bonjour (mDNS/DNS-SD) verwenden, um ein aktives Gateway (WebSocket-Endpunkt) zu erkennen. Das Multicast-Browsing von `local.` ist eine **reine LAN-Komfortfunktion**: Das mitgelieferte `bonjour`-Plugin verwaltet die LAN-Ankündigung, die auf macOS-Hosts automatisch startet und unter Linux, Windows sowie bei containerisierten Gateway-Bereitstellungen explizit aktiviert werden muss. Derselbe Beacon kann zur netzwerkübergreifenden Erkennung auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden. Die Erkennung erfolgt nach bestem Bemühen und ersetzt **nicht** die Konnektivität über SSH oder Tailnet.

## Wide-Area Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich Node und Gateway in unterschiedlichen Netzwerken befinden, kann Multicast-mDNS die Netzwerkgrenze nicht überwinden. Behalten Sie dieselbe Erkennungsoberfläche bei, indem Sie über Tailscale zu **Unicast DNS-SD** („Wide-Area Bonjour“) wechseln:

1. Betreiben Sie auf dem Gateway-Host einen DNS-Server, der über das Tailnet erreichbar ist.
2. Veröffentlichen Sie DNS-SD-Einträge für `_openclaw-gw._tcp` unter einer dedizierten Zone (Beispiel: `openclaw.internal.`).
3. Konfigurieren Sie in Tailscale **Split DNS**, damit Ihre gewählte Domain für Clients einschließlich iOS über diesen DNS-Server aufgelöst wird.

`openclaw.internal.` ist oben nur ein Beispiel — OpenClaw unterstützt jede Erkennungsdomain. iOS-/Android-Nodes durchsuchen sowohl `local.` als auch Ihre konfigurierte Wide-Area-Domain.

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

Dieser Befehl ist ausschließlich für macOS vorgesehen und erfordert Homebrew sowie eine aktive Tailscale-Verbindung. Er installiert CoreDNS (`brew install coredns`) und konfiguriert es so, dass es:

- nur auf den Tailscale-Schnittstellen des Gateways an Port 53 lauscht
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bereitstellt

Führen Sie den Befehl zunächst ohne `--apply` aus, um den Plan (Domain, Pfad zur Zonendatei, erkannte Tailnet-IP, empfohlene Konfiguration) in der Vorschau anzuzeigen, ohne etwas zu installieren.

Validieren Sie die Einrichtung von einem mit dem Tailnet verbundenen Rechner aus:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Administrationskonsole:

- Fügen Sie einen Nameserver hinzu, der auf die Tailnet-IP des Gateways verweist (UDP/TCP 53).
- Fügen Sie Split DNS hinzu, damit Ihre Erkennungsdomain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und die CLI-Erkennung `_openclaw-gw._tcp` in Ihrer Erkennungsdomain ohne Multicast durchsuchen.

### Sicherheit des Gateway-Listeners

Der WS-Port des Gateways (standardmäßig `18789`) wird standardmäßig an local loopback gebunden. Binden Sie ihn für den LAN-/Tailnet-Zugriff explizit und lassen Sie die Authentifizierung aktiviert. Legen Sie für reine Tailnet-Konfigurationen in `~/.openclaw/openclaw.json` den Wert `gateway.bind: "tailnet"` fest und starten Sie das Gateway (oder die macOS-Menüleisten-App) neu.

## Was Ankündigungen veröffentlicht

Nur das Gateway kündigt `_openclaw-gw._tcp` an. Die LAN-Multicast-Ankündigung erfolgt bei Aktivierung durch das mitgelieferte `bonjour`-Plugin; die Veröffentlichung über Wide-Area DNS-SD bleibt in der Verantwortung des Gateways.

## Diensttypen

- `_openclaw-gw._tcp` - Transport-Beacon des Gateways, der von macOS-/iOS-/Android-Nodes verwendet wird.

## TXT-Schlüssel (nicht geheime Hinweise)

| Schlüssel                       | Wenn vorhanden                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `role=gateway`                  | Immer.                                                                                                  |
| `displayName=<friendly name>`   | Immer.                                                                                                  |
| `lanHost=<hostname>.local`      | Immer.                                                                                                  |
| `gatewayPort=<port>`            | Immer (Gateway-WS + HTTP).                                                                               |
| `transport=gateway`             | Immer.                                                                                                  |
| `gatewayTls=1`                  | Nur wenn TLS aktiviert ist.                                                                             |
| `gatewayTlsSha256=<sha256>`     | Nur wenn TLS aktiviert und ein Fingerabdruck verfügbar ist.                                             |
| `gatewayDirectReachable=1`      | Nur wenn das Gateway direkt erreichbar ist (nicht ausschließlich über einen Relay-/Proxy-Pfad).         |
| `canvasPort=<port>`             | Nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`.                             |
| `tailnetDns=<magicdns>`         | Nur im vollständigen mDNS-Modus; optionaler Hinweis, wenn Tailnet verfügbar ist.                         |
| `sshPort=<port>`                | Nur im vollständigen Modus; im minimalen und deaktivierten Modus nicht enthalten.                        |
| `cliPath=<path>`                | Nur im vollständigen Modus; im minimalen und deaktivierten Modus nicht enthalten.                        |

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients dürfen TXT nicht als maßgebliche Routing-Information behandeln.
- Clients sollten das Routing anhand des aufgelösten Dienstendpunkts (SRV + A/AAAA) durchführen. Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` ausschließlich als Hinweise.
- Die automatische SSH-Zielauswahl sollte ebenfalls den aufgelösten Diensthost verwenden und nicht ausschließlich TXT-Hinweise.
- Beim TLS-Pinning darf ein angekündigter Wert für `gatewayTlsSha256` niemals einen zuvor gespeicherten Pin überschreiben.
- iOS-/Android-Nodes sollten direkte, auf Erkennung basierende Verbindungen **ausschließlich über TLS** zulassen und eine ausdrückliche Benutzerbestätigung verlangen, bevor sie einem erstmalig angezeigten Fingerabdruck vertrauen.

## Fehlerbehebung unter macOS

Integrierte Werkzeuge:

```bash
# Instanzen durchsuchen
dns-sd -B _openclaw-gw._tcp local.

# Eine Instanz auflösen (<instance> ersetzen)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Wenn das Durchsuchen funktioniert, die Auflösung jedoch fehlschlägt, liegt in der Regel ein Problem mit einer LAN-Richtlinie oder dem mDNS-Resolver vor.

## Fehlerbehebung in Gateway-Protokollen

Das Gateway schreibt eine rotierende Protokolldatei (beim Start als `gateway log file: ...` ausgegeben). Suchen Sie nach Zeilen mit `bonjour:`, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Der Watchdog behandelt aktive Zustände wie `probing`, `announcing` und kürzlich erfolgte konfliktbedingte Umbenennungen als laufende Vorgänge. Wenn der Dienst den Zustand `announced` nie erreicht, erstellt OpenClaw den Ankündigungsdienst neu und deaktiviert Bonjour nach wiederholten Fehlern für diesen Gateway-Prozess, statt die Ankündigung unbegrenzt erneut zu versuchen.

Bonjour verwendet den System-Hostnamen für den angekündigten `.local`-Host, wenn er eine gültige DNS-Bezeichnung ist. Wenn der System-Hostname Leerzeichen, Unterstriche oder andere für DNS-Bezeichnungen ungültige Zeichen enthält, verwendet OpenClaw stattdessen `openclaw.local`. Legen Sie vor dem Start des Gateways `OPENCLAW_MDNS_HOSTNAME=<name>` fest, wenn Sie eine explizite Hostbezeichnung benötigen.

## Fehlerbehebung auf dem iOS-Node

Der iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu erkennen.

So erfassen Sie Protokolle: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, anschließend Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduzieren -> **Copy**. Das Protokoll enthält Browser-Zustandsübergänge und Änderungen der Ergebnismenge.

## Wann Bonjour aktiviert werden sollte

Bonjour startet bei einem Gateway-Start mit leerer Konfiguration auf macOS-Hosts automatisch, da die lokale App und iOS-/Android-Nodes in der Nähe üblicherweise auf die Erkennung im selben LAN angewiesen sind.

Aktivieren Sie es explizit, wenn die automatische Erkennung im selben LAN unter Linux, Windows oder auf einem anderen Nicht-macOS-Host nützlich ist:

```bash
openclaw plugins enable bonjour
```

Wenn Bonjour aktiviert ist, bestimmt `discovery.mdns.mode`, wie viele TXT-Metadaten veröffentlicht werden; derselbe Modus steuert optionale TXT-Hinweise in Wide-Area-DNS-SD-Einträgen. Modi:

| Modus               | Verhalten                                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (Standard) | Nur zentrale TXT-Schlüssel; `sshPort`, `cliPath` und `tailnetDns` werden nicht veröffentlicht.                                                                                      |
| `full`              | Fügt `sshPort`, `cliPath` und `tailnetDns` hinzu — verwenden Sie diesen Modus, wenn Clients diese Hinweise benötigen.                                                               |
| `off`               | Unterdrückt LAN-Multicast, ohne die Plugin-Aktivierung zu ändern; Wide-Area DNS-SD kann den minimalen Beacon weiterhin veröffentlichen, wenn `discovery.wideArea.enabled` auf `true` gesetzt ist. |

## Wann Bonjour deaktiviert werden sollte

Lassen Sie Bonjour deaktiviert, wenn LAN-Multicast-Ankündigungen unnötig, nicht verfügbar oder nachteilig sind — häufige Fälle sind Nicht-macOS-Server, Docker-Bridge-Netzwerke, WSL oder eine Netzwerkrichtlinie, die mDNS-Multicast verwirft. Das Gateway bleibt über seine veröffentlichte URL, SSH, Tailnet oder Wide-Area DNS-SD erreichbar; lediglich die automatische LAN-Erkennung ist unzuverlässig.

Verwenden Sie die Umgebungsvariablen-Überschreibung für bereitstellungsspezifische Probleme (sicher für Docker-Images, Dienstdateien, Startskripte und einmalige Fehlerbehebung — sie verschwindet zusammen mit der Umgebung):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Verwenden Sie die Plugin-Konfiguration, wenn Sie das mitgelieferte LAN-Erkennungs-Plugin für diese OpenClaw-Konfiguration bewusst deaktivieren möchten:

```bash
openclaw plugins disable bonjour
```

## Besonderheiten bei Docker

Das mitgelieferte Bonjour-Plugin deaktiviert LAN-Multicast-Ankündigungen in erkannten Containern automatisch, wenn `OPENCLAW_DISABLE_BONJOUR` nicht festgelegt ist. Docker-Bridge-Netzwerke leiten mDNS-Multicast (`224.0.0.251:5353`) üblicherweise nicht zwischen Container und LAN weiter, weshalb Ankündigungen aus dem Container nur selten eine funktionierende Erkennung ermöglichen.

Zu beachten:

- Bonjour startet auf macOS-Hosts automatisch und muss andernorts explizit aktiviert werden. Wenn es deaktiviert bleibt, wird das Gateway nicht angehalten — lediglich LAN-Multicast-Ankündigungen werden übersprungen.
- Das Deaktivieren von Bonjour ändert `gateway.bind` nicht; Docker verwendet weiterhin standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit der veröffentlichte Host-Port funktioniert.
- Das Deaktivieren von Bonjour deaktiviert Wide-Area DNS-SD nicht. Verwenden Sie Wide-Area-Erkennung oder Tailnet, wenn sich Gateway und Node nicht im selben LAN befinden.
- Die Wiederverwendung desselben `OPENCLAW_CONFIG_DIR` außerhalb von Docker übernimmt die Richtlinie zur automatischen Deaktivierung im Container nicht.
- Legen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host-Netzwerke, macvlan oder andere Netzwerke fest, in denen mDNS-Multicast nachweislich weitergeleitet wird; setzen Sie den Wert auf `1`, um die Deaktivierung zu erzwingen.

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

4. Wenn Sie das Bonjour-Plugin in Docker bewusst aktiviert und die Ankündigung mit `OPENCLAW_DISABLE_BONJOUR=0` erzwungen haben, testen Sie Multicast vom Host aus:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Wenn die Suche keine Ergebnisse liefert oder die Gateway-Protokolle wiederholte Abbrüche durch den ciao-Watchdog anzeigen, stellen Sie `OPENCLAW_DISABLE_BONJOUR=1` wieder her und verwenden Sie eine direkte Route oder eine Tailnet-Route.

## Häufige Fehlermodi

- **Bonjour funktioniert nicht netzwerkübergreifend**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Einige WLAN-Netzwerke deaktivieren mDNS.
- **Advertiser bleibt beim Prüfen/Ankündigen hängen**: Hosts mit blockiertem Multicast, Container-Bridges, WSL oder häufigen Schnittstellenänderungen können dazu führen, dass der ciao-Advertiser in einem nicht angekündigten Zustand verbleibt. OpenClaw versucht es einige Male erneut und deaktiviert dann Bonjour für den aktuellen Gateway-Prozess, anstatt den Advertiser endlos neu zu starten.
- **Docker-Bridge-Netzwerk**: Bonjour wird in erkannten Containern automatisch deaktiviert. Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur für Host-, macvlan- oder andere mDNS-fähige Netzwerke.
- **Ruhezustand/Schnittstellenänderungen**: macOS kann mDNS-Ergebnisse vorübergehend verwerfen; versuchen Sie es erneut.
- **Durchsuchen funktioniert, aber Auflösen schlägt fehl**: Verwenden Sie einfache Rechnernamen (vermeiden Sie Emojis oder Satzzeichen) und starten Sie anschließend das Gateway neu. Der Name der Dienstinstanz wird vom Hostnamen abgeleitet, sodass übermäßig komplexe Namen einige Resolver verwirren können.

## Maskierte Instanznamen (`\032`)

Bonjour/DNS-SD stellt Bytes in Namen von Dienstinstanzen häufig als dezimale `\DDD`-Sequenzen dar (Leerzeichen werden zu `\032`). Dies ist auf Protokollebene normal; Benutzeroberflächen sollten sie für die Anzeige dekodieren (iOS verwendet `BonjourEscapes.decode`).

## Aktivierung, Deaktivierung und Konfiguration

| Einstellung                                          | Wirkung                                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Aktiviert das mitgelieferte Plugin für die LAN-Erkennung auf Hosts, auf denen es nicht standardmäßig aktiviert ist.              |
| `openclaw plugins disable bonjour`                   | Deaktiviert Multicast-Ankündigungen im LAN, indem das mitgelieferte Plugin deaktiviert wird.                                     |
| `OPENCLAW_DISABLE_BONJOUR=1` (oder `true`/`yes`/`on`)  | Deaktiviert Multicast-Ankündigungen im LAN, ohne die Plugin-Konfiguration zu ändern.                                             |
| `OPENCLAW_DISABLE_BONJOUR=0` (oder `false`/`no`/`off`) | Erzwingt Multicast-Ankündigungen im LAN, auch innerhalb erkannter Container.                                                     |
| `discovery.mdns.mode`                                | `off` \| `minimal` (Standard) \| `full` — siehe die Modi weiter oben.                                                           |
| `gateway.bind`                                       | Steuert den Bindungsmodus des Gateways in `~/.openclaw/openclaw.json`.                                                          |
| `OPENCLAW_SSH_PORT`                                  | Überschreibt den SSH-Port, wenn `sshPort` angekündigt wird (vollständiger Modus).                                                |
| `OPENCLAW_TAILNET_DNS`                               | Veröffentlicht einen MagicDNS-Hinweis in TXT, wenn der vollständige mDNS-Modus aktiviert ist.                                   |
| `OPENCLAW_CLI_PATH`                                  | Überschreibt den angekündigten CLI-Pfad (vollständiger Modus).                                                                  |

Auf macOS-Hosts wird das mitgelieferte Plugin für die LAN-Erkennung standardmäßig automatisch gestartet. Wenn das Bonjour-Plugin aktiviert und `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist, kündigt Bonjour Dienste auf normalen Hosts an und wird innerhalb erkannter Container (Docker, Fly.io-Maschinen und gängige Container-Laufzeitumgebungen) automatisch deaktiviert.

## Verwandte Dokumentation

- Erkennungsrichtlinie und Transportauswahl: [Erkennung](/de/gateway/discovery)
- Node-Kopplung und Genehmigungen: [Gateway-Kopplung](/de/gateway/pairing)
