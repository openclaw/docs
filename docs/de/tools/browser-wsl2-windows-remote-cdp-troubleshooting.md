---
read_when:
    - OpenClaw Gateway in WSL2 ausführen, während Chrome unter Windows läuft
    - Sich überschneidende Browser-/Control-UI-Fehler unter WSL2 und Windows feststellen
    - Entscheidung zwischen hostlokalem Chrome MCP und direktem Remote-CDP in Split-Host-Konfigurationen
summary: WSL2-Gateway und Remote-CDP von Chrome unter Windows schichtweise diagnostizieren
title: Fehlerbehebung für WSL2 + Windows + Remote-Chrome-CDP
x-i18n:
    generated_at: "2026-07-12T16:02:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

In der üblichen Split-Host-Konfiguration wird das OpenClaw Gateway innerhalb von WSL2 ausgeführt, Chrome wird
unter Windows ausgeführt und die Browsersteuerung muss die WSL2/Windows-Grenze überwinden. Mehrere
unabhängige Probleme können gleichzeitig auftreten (siehe
[Issue #39369](https://github.com/openclaw/openclaw/issues/39369)): CDP-
Transport, Ursprungssicherheit der Control UI sowie Token/Kopplung können jeweils
unabhängig voneinander fehlschlagen und dabei ähnlich aussehende Fehler erzeugen. Arbeiten Sie die folgenden
Ebenen der Reihe nach durch, statt zu raten, welche davon fehlerhaft ist.

## Wählen Sie zuerst den richtigen Browsermodus

### Option 1: Unverarbeitetes Remote-CDP von WSL2 zu Windows

Verwenden Sie ein Remote-Browserprofil, das von WSL2 auf einen Chrome-CDP-
Endpunkt unter Windows verweist. Wählen Sie diese Option, wenn das Gateway innerhalb von WSL2 bleibt, Chrome unter
Windows ausgeführt wird und die Browsersteuerung die WSL2/Windows-Grenze überwinden muss.

### Option 2: Hostlokales Chrome MCP

Verwenden Sie den Treiber `existing-session` (Profil `user`) nur, wenn das Gateway
auf demselben Host wie Chrome ausgeführt wird, Sie den lokalen angemeldeten Browserstatus verwenden möchten, keinen
hostübergreifenden Browsertransport benötigen und weder `responsebody`,
PDF-Export, Download-Abfangen noch Batch-Aktionen benötigen (Chrome-MCP-Profile
unterstützen diese nicht).

Verwenden Sie für WSL2 Gateway + Windows Chrome unverarbeitetes Remote-CDP. Chrome MCP ist
hostlokal und keine WSL2-zu-Windows-Brücke.

## Funktionsfähige Architektur

- WSL2 führt das Gateway auf `127.0.0.1:18789` aus
- Windows öffnet die Control UI in einem normalen Browser unter `http://127.0.0.1:18789/`
- Windows Chrome stellt einen CDP-Endpunkt auf Port `9222` bereit
- WSL2 kann diesen Windows-CDP-Endpunkt erreichen
- OpenClaw richtet ein Browserprofil auf die von WSL2 erreichbare Adresse aus

## Kritische Regel für die Control UI

Wenn die UI von Windows aus geöffnet wird, verwenden Sie Windows-Localhost, sofern Sie nicht über eine
bewusst eingerichtete HTTPS-Konfiguration verfügen:

```text
http://127.0.0.1:18789/
```

Verwenden Sie nicht standardmäßig eine LAN-IP. Einfaches HTTP unter einer LAN- oder Tailnet-Adresse kann
Verhalten aufgrund eines unsicheren Ursprungs oder der Geräteauthentifizierung auslösen, das nichts mit CDP selbst zu tun hat. Siehe
[Control UI](/de/web/control-ui).

## Ebenenweise validieren

Arbeiten Sie von oben nach unten; überspringen Sie keine Schritte. Nach der Behebung einer Ebene kann weiterhin ein
anderer Fehler aus einer weiter unten liegenden Ebene sichtbar sein.

### Ebene 1: Überprüfen Sie, ob Chrome CDP unter Windows bereitstellt

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 und höher ignorieren Befehlszeilenschalter für Remote-Debugging beim
standardmäßigen Chrome-Datenverzeichnis. Verwenden Sie wie oben gezeigt ein separates, nicht standardmäßiges Datenverzeichnis.
Siehe Chromes
[Sicherheitsänderung für Remote-Debugging](https://developer.chrome.com/blog/remote-debugging-port).
Dadurch wird das normale angemeldete Chrome-Profil nicht remote steuerbar.

Überprüfen Sie zunächst Chrome selbst unter Windows:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Wenn dies fehlschlägt, diagnostizieren Sie die Windows-Listener weiter unten. OpenClaw ist zu diesem
Zeitpunkt noch nicht das Problem.

#### Diagnostizieren Sie IPv4 und IPv6, bevor Sie portproxy ändern

Chromium versucht zuerst, Remote-Debugging an `127.0.0.1` zu binden, und weicht nur dann auf
`[::1]` aus, wenn die IPv4-Bindung fehlschlägt. Eine persistente `v4tov4`-Regel, die auf
`127.0.0.1:9222` lauscht, kann diesen Endpunkt belegen, bevor Chrome gestartet wird. Chrome
weicht dann auf `[::1]:9222` aus, während die alte Regel IPv4-Datenverkehr zurück an
ihren eigenen Listener weiterleitet und eine leere Antwort zurückgibt.

Prüfen Sie die tatsächlichen Listener und Proxyregeln unter Windows, statt sie aus
der Chrome-Version abzuleiten:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Verwenden Sie `tasklist /fi "PID eq <PID>"` für jede PID aus `netstat`.

- Wenn `chrome.exe` auf `127.0.0.1` antwortet, entfernen Sie jede portproxy-Regel, die ebenfalls
  auf `127.0.0.1:9222` lauscht. Leiten Sie nur die für WSL2 erreichbare Windows-Adapteradresse
  an `127.0.0.1` weiter.
- Wenn `chrome.exe` nur auf `[::1]` antwortet, richten Sie den für WSL2 erreichbaren Listener mit
  `v4tov6` auf `::1`, statt an eine ungenutzte IPv4-Adresse weiterzuleiten:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Binden Sie den Listener an die von WSL2 benötigte Adapteradresse. Stellen Sie den CDP-
Port nicht auf `0.0.0.0`, einer LAN-Adresse oder einer Tailnet-Adresse bereit: CDP gewährt Kontrolle über
die Browsersitzung.

### Ebene 2: Überprüfen Sie, ob WSL2 diesen Windows-Endpunkt erreichen kann

Testen Sie von WSL2 aus die exakte Adresse, die Sie in `cdpUrl` verwenden möchten:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Gutes Ergebnis:

- `/json/version` gibt JSON mit Browser-/Protocol-Version-Metadaten zurück
- `/json/list` gibt JSON zurück (ein leeres Array ist in Ordnung, wenn keine Seiten geöffnet sind)

Wenn dies fehlschlägt, stellt Windows den Port für WSL2 noch nicht bereit, die Adresse ist
für die WSL2-Seite falsch oder Firewall/Portweiterleitung/Proxying fehlt. Beheben Sie
dies, bevor Sie die OpenClaw-Konfiguration ändern.

### Ebene 3: Konfigurieren Sie das richtige Browserprofil

Richten Sie OpenClaw auf die von WSL2 erreichbare Adresse aus:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Hinweise:

- Verwenden Sie die von WSL2 erreichbare Adresse, nicht eine Adresse, die nur unter Windows funktioniert
- Behalten Sie `attachOnly: true` für extern verwaltete Browser bei
- `cdpUrl` kann `http://`, `https://`, `ws://` oder `wss://` sein
- Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` ermitteln soll
- Verwenden Sie WS(S) nur, wenn der Browser-Provider Ihnen eine direkte DevTools-
  Socket-URL bereitstellt
- Testen Sie dieselbe URL mit `curl`, bevor Sie erwarten, dass OpenClaw erfolgreich ist

### Ebene 4: Überprüfen Sie die Control-UI-Ebene separat

Öffnen Sie `http://127.0.0.1:18789/` unter Windows und überprüfen Sie anschließend:

- Der Seitenursprung entspricht den Erwartungen von `gateway.controlUi.allowedOrigins`
- Token-Authentifizierung oder Kopplung ist korrekt konfiguriert
- Sie diagnostizieren kein Control-UI-Authentifizierungsproblem fälschlicherweise als Browser-
  problem

Hilfreiche Seite: [Control UI](/de/web/control-ui).

### Ebene 5: Überprüfen Sie die durchgängige Browsersteuerung

Von WSL2 aus:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Gutes Ergebnis:

- Der Tab wird in Windows Chrome geöffnet
- `browser tabs` gibt das Ziel zurück
- Nachfolgende Aktionen (`snapshot`, `screenshot`, `navigate`) funktionieren mit demselben
  Profil

## Häufige irreführende Fehler

| Meldung                                                                                 | Bedeutung                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | Problem mit dem UI-Ursprung/sicheren Kontext, kein CDP-Transportproblem                                                                                                             |
| `token_missing`                                                                         | Problem mit der Authentifizierungskonfiguration                                                                                                                                     |
| `pairing required`                                                                      | Problem mit der Gerätegenehmigung                                                                                                                                                   |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 kann die konfigurierte `cdpUrl` nicht erreichen                                                                                                                                |
| Leere CDP-Antwort / `other side closed` über einen portproxy                            | Nicht übereinstimmender Windows-Listener oder eine Selbstschleife; prüfen Sie beide Loopback-Familien und `netsh interface portproxy show all`                                      |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | Der HTTP-Endpunkt hat geantwortet, aber der DevTools-WebSocket konnte nicht geöffnet werden                                                                                         |
| Veraltete Viewport-/Dark-Mode-/Gebietsschema-/Offline-Überschreibungen nach einer Remote-Sitzung | Führen Sie `openclaw browser --browser-profile remote stop` aus, um die Sitzung zu schließen und die zwischengespeicherte Playwright/CDP-Verbindung freizugeben, ohne das Gateway oder den externen Browser neu zu starten |
| Zeitüberschreitung im Zusammenhang mit `remoteCdpTimeoutMs` (Standardwert 1500ms)       | In der Regel weiterhin die CDP-Erreichbarkeit oder ein langsamer/nicht erreichbarer Remote-Endpunkt                                                                                 |
| `Playwright page enumeration timed out after 3000ms`                                    | Die Remote-CDP-Verbindung wurde hergestellt, aber das persistente Lesen der Tabs blieb hängen; die Frist ist der größere Wert von `remoteCdpTimeoutMs` und `remoteCdpHandshakeTimeoutMs` |
| `No Chrome tabs found for profile="user"`                                               | Lokales Chrome-MCP-Profil wurde ausgewählt, obwohl keine hostlokalen Tabs verfügbar sind                                                                                            |

## Checkliste für die schnelle Eingrenzung

1. Windows: Welche der Adressen `127.0.0.1` oder `[::1]` antwortet unter `/json/version`, und
   gehört dieser Listener zu `chrome.exe`?
2. WSL2: Funktioniert `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. OpenClaw-Konfiguration: Verwendet `browser.profiles.<name>.cdpUrl` exakt diese
   von WSL2 erreichbare Adresse?
4. Control UI: Öffnen Sie `http://127.0.0.1:18789/` statt einer LAN-IP?
5. Versuchen Sie, `existing-session` über WSL2 und Windows hinweg zu verwenden,
   statt unverarbeitetes Remote-CDP zu nutzen?

Überprüfen Sie zuerst den Windows-Chrome-Endpunkt lokal, anschließend denselben Endpunkt
von WSL2 aus und diagnostizieren Sie erst danach die OpenClaw-Konfiguration oder die Control-UI-Authentifizierung.

## Verwandte Themen

- [Browser](/de/tools/browser)
- [Browseranmeldung](/de/tools/browser-login)
- [Fehlerbehebung für Browser unter Linux](/de/tools/browser-linux-troubleshooting)
