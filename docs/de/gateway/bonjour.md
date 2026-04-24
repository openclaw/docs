---
read_when:
    - Fehlerbehebung bei Bonjour-Erkennungsproblemen unter macOS/iOS
    - Ändern von mDNS-Servicetypen, TXT-Einträgen oder der Erkennungs-UX
summary: Bonjour/mDNS-Erkennung + Fehlerbehebung (Gateway-Beacons, Clients und häufige Fehlermodi)
title: Bonjour-Erkennung
x-i18n:
    generated_at: "2026-04-24T08:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour- / mDNS-Erkennung

OpenClaw verwendet Bonjour (mDNS / DNS‑SD), um ein aktives Gateway (WebSocket-Endpunkt) zu erkennen.
Multicast-Browsing in `local.` ist eine **reine LAN-Komfortfunktion**. Das gebündelte `bonjour`
Plugin ist für die LAN-Ankündigung verantwortlich und standardmäßig aktiviert. Für netzwerkübergreifende Erkennung
kann derselbe Beacon auch über eine konfigurierte Wide-Area-DNS-SD-Domain veröffentlicht werden.
Die Erkennung bleibt weiterhin Best-Effort und **ersetzt weder SSH noch Tailnet-basierte Konnektivität**.

## Wide-Area Bonjour (Unicast DNS-SD) über Tailscale

Wenn sich Node und Gateway in unterschiedlichen Netzwerken befinden, überschreitet Multicast-mDNS
diese Grenze nicht. Sie können dieselbe Erkennungs-UX beibehalten, indem Sie auf **Unicast DNS‑SD**
("Wide‑Area Bonjour") über Tailscale umstellen.

Schritte auf hoher Ebene:

1. Führen Sie einen DNS-Server auf dem Gateway-Host aus (über Tailnet erreichbar).
2. Veröffentlichen Sie DNS‑SD-Einträge für `_openclaw-gw._tcp` unter einer dedizierten Zone
   (Beispiel: `openclaw.internal.`).
3. Konfigurieren Sie Tailscale **Split DNS**, damit Ihre gewählte Domain über diesen
   DNS-Server für Clients aufgelöst wird (einschließlich iOS).

OpenClaw unterstützt jede Erkennungsdomain; `openclaw.internal.` ist nur ein Beispiel.
iOS-/Android-Nodes durchsuchen sowohl `local.` als auch Ihre konfigurierte Wide-Area-Domain.

### Gateway-Konfiguration (empfohlen)

```json5
{
  gateway: { bind: "tailnet" }, // nur tailnet (empfohlen)
  discovery: { wideArea: { enabled: true } }, // aktiviert Wide-Area-DNS-SD-Veröffentlichung
}
```

### Einmalige DNS-Server-Einrichtung (Gateway-Host)

```bash
openclaw dns setup --apply
```

Dadurch wird CoreDNS installiert und so konfiguriert, dass es:

- nur auf Port 53 an den Tailscale-Schnittstellen des Gateway lauscht
- Ihre gewählte Domain (Beispiel: `openclaw.internal.`) aus `~/.openclaw/dns/<domain>.db` bereitstellt

Validieren Sie dies von einem mit dem Tailnet verbundenen Rechner aus:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-Einstellungen

In der Tailscale-Admin-Konsole:

- Fügen Sie einen Nameserver hinzu, der auf die Tailnet-IP des Gateway zeigt (UDP/TCP 53).
- Fügen Sie Split DNS hinzu, damit Ihre Erkennungsdomain diesen Nameserver verwendet.

Sobald Clients Tailnet-DNS akzeptieren, können iOS-Nodes und die CLI-Erkennung
`_openclaw-gw._tcp` in Ihrer Erkennungsdomain ohne Multicast durchsuchen.

### Sicherheit des Gateway-Listeners (empfohlen)

Der Gateway-WS-Port (Standard `18789`) bindet standardmäßig an Loopback. Für LAN-/Tailnet-Zugriff
binden Sie ihn explizit und lassen Sie die Authentifizierung aktiviert.

Für reine Tailnet-Setups:

- Setzen Sie `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Starten Sie das Gateway neu (oder starten Sie die macOS-Menüleisten-App neu).

## Was angekündigt wird

Nur das Gateway kündigt `_openclaw-gw._tcp` an. Die LAN-Multicast-Ankündigung wird
vom gebündelten `bonjour` Plugin bereitgestellt; die Veröffentlichung per Wide-Area-DNS-SD bleibt
dem Gateway vorbehalten.

## Servicetypen

- `_openclaw-gw._tcp` — Gateway-Transport-Beacon (verwendet von macOS-/iOS-/Android-Nodes).

## TXT-Schlüssel (nicht geheime Hinweise)

Das Gateway kündigt kleine, nicht geheime Hinweise an, um UI-Abläufe komfortabler zu machen:

- `role=gateway`
- `displayName=<freundlicher Name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (nur wenn TLS aktiviert ist)
- `gatewayTlsSha256=<sha256>` (nur wenn TLS aktiviert ist und ein Fingerabdruck verfügbar ist)
- `canvasPort=<port>` (nur wenn der Canvas-Host aktiviert ist; derzeit identisch mit `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (nur im mDNS-Vollmodus, optionaler Hinweis, wenn Tailnet verfügbar ist)
- `sshPort=<port>` (nur im mDNS-Vollmodus; Wide-Area-DNS-SD kann dies weglassen)
- `cliPath=<path>` (nur im mDNS-Vollmodus; Wide-Area-DNS-SD schreibt dies weiterhin als Hinweis für Remote-Installation)

Sicherheitshinweise:

- Bonjour-/mDNS-TXT-Einträge sind **nicht authentifiziert**. Clients dürfen TXT nicht als autoritatives Routing behandeln.
- Clients sollten über den aufgelösten Service-Endpunkt routen (SRV + A/AAAA). Behandeln Sie `lanHost`, `tailnetDns`, `gatewayPort` und `gatewayTlsSha256` nur als Hinweise.
- Auch SSH-Auto-Targeting sollte den aufgelösten Service-Host verwenden, nicht Hinweise nur aus TXT.
- TLS-Pinning darf niemals zulassen, dass ein angekündigter `gatewayTlsSha256` einen zuvor gespeicherten Pin überschreibt.
- iOS-/Android-Nodes sollten entdeckungsbasierte Direktverbindungen als **nur TLS** behandeln und vor dem Vertrauen in einen Fingerabdruck beim ersten Mal eine ausdrückliche Benutzerbestätigung verlangen.

## Fehlerbehebung unter macOS

Nützliche integrierte Tools:

- Instanzen durchsuchen:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Eine Instanz auflösen (ersetzen Sie `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Wenn das Durchsuchen funktioniert, das Auflösen aber fehlschlägt, stoßen Sie in der Regel auf
eine LAN-Richtlinie oder ein Problem mit dem mDNS-Resolver.

## Fehlerbehebung in Gateway-Logs

Das Gateway schreibt eine rotierende Logdatei (beim Start ausgegeben als
`gateway log file: ...`). Achten Sie auf `bonjour:`-Zeilen, insbesondere:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Fehlerbehebung auf iOS-Node

Die iOS-Node verwendet `NWBrowser`, um `_openclaw-gw._tcp` zu erkennen.

So erfassen Sie Logs:

- Einstellungen → Gateway → Erweitert → **Discovery Debug Logs**
- Einstellungen → Gateway → Erweitert → **Discovery Logs** → reproduzieren → **Copy**

Das Log enthält Browser-Statusübergänge und Änderungen an der Ergebnismenge.

## Häufige Fehlermodi

- **Bonjour überschreitet keine Netzwerke**: Verwenden Sie Tailnet oder SSH.
- **Multicast blockiert**: Einige Wi‑Fi-Netzwerke deaktivieren mDNS.
- **Ruhezustand / Schnittstellenwechsel**: macOS kann mDNS-Ergebnisse vorübergehend verwerfen; versuchen Sie es erneut.
- **Durchsuchen funktioniert, aber Auflösen schlägt fehl**: Halten Sie Rechnernamen einfach (vermeiden Sie Emojis oder
  Satzzeichen) und starten Sie dann das Gateway neu. Der Name der Serviceinstanz wird vom
  Hostnamen abgeleitet, daher können übermäßig komplexe Namen einige Resolver verwirren.

## Escapte Instanznamen (`\032`)

Bonjour/DNS‑SD maskiert Bytes in Serviceinstanznamen oft als dezimale `\DDD`-
Sequenzen (z. B. werden Leerzeichen zu `\032`).

- Das ist auf Protokollebene normal.
- UIs sollten dies für die Anzeige dekodieren (iOS verwendet `BonjourEscapes.decode`).

## Deaktivierung / Konfiguration

- `openclaw plugins disable bonjour` deaktiviert die LAN-Multicast-Ankündigung, indem das gebündelte Plugin deaktiviert wird.
- `openclaw plugins enable bonjour` stellt das standardmäßige LAN-Erkennungs-Plugin wieder her.
- `OPENCLAW_DISABLE_BONJOUR=1` deaktiviert die LAN-Multicast-Ankündigung, ohne die Plugin-Konfiguration zu ändern; akzeptierte Truthy-Werte sind `1`, `true`, `yes` und `on` (Legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` in `~/.openclaw/openclaw.json` steuert den Bind-Modus des Gateway.
- `OPENCLAW_SSH_PORT` überschreibt den SSH-Port, wenn `sshPort` angekündigt wird (Legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` veröffentlicht einen MagicDNS-Hinweis in TXT, wenn der mDNS-Vollmodus aktiviert ist (Legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` überschreibt den angekündigten CLI-Pfad (Legacy: `OPENCLAW_CLI_PATH`).

## Zugehörige Dokumentation

- Erkennungsrichtlinie und Transportauswahl: [Discovery](/de/gateway/discovery)
- Node-Kopplung + Genehmigungen: [Gateway pairing](/de/gateway/pairing)
