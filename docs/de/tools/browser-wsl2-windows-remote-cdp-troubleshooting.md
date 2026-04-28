---
read_when:
- Running OpenClaw Gateway in WSL2 while Chrome lives on Windows
- Überlappende Browser-/Control-UI-Fehler in WSL2 und Windows sehen
- Zwischen hostlokalem Chrome MCP und rohem Remote-CDP in Setups mit getrennten Hosts
  entscheiden
summary: Fehlerbehebung für WSL2-Gateway + Windows-Chrome-Remote-CDP in Schichten
title: Fehlerbehebung für WSL2 + Windows + Remote-Chrome-CDP
x-i18n:
  generated_at: '2026-04-24T07:01:50Z'
  refreshed_at: '2026-04-28T04:45:00Z'
  model: gpt-5.4
  provider: openai
  source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
  source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
  workflow: 15
---

Diese Anleitung behandelt das häufige Split-Host-Setup, bei dem:

- OpenClaw Gateway innerhalb von WSL2 läuft
- Chrome auf Windows läuft
- Browser-Steuerung die Grenze zwischen WSL2 und Windows überqueren muss

Sie behandelt außerdem das mehrschichtige Fehlermuster aus [Issue #39369](https://github.com/openclaw/openclaw/issues/39369): Mehrere unabhängige Probleme können gleichzeitig auftreten, wodurch zunächst die falsche Schicht defekt zu sein scheint.

## Wählen Sie zuerst den richtigen Browser-Modus

Sie haben zwei gültige Muster:

### Option 1: Rohes Remote-CDP von WSL2 nach Windows

Verwenden Sie ein Remote-Browserprofil, das von WSL2 auf einen Windows-Chrome-CDP-Endpunkt zeigt.

Wählen Sie dies, wenn:

- das Gateway innerhalb von WSL2 bleibt
- Chrome auf Windows läuft
- Browser-Steuerung die Grenze zwischen WSL2 und Windows überqueren muss

### Option 2: Host-lokales Chrome MCP

Verwenden Sie `existing-session` / `user` nur dann, wenn das Gateway selbst auf demselben Host wie Chrome läuft.

Wählen Sie dies, wenn:

- OpenClaw und Chrome auf demselben Rechner laufen
- Sie den lokal angemeldeten Browser-Status verwenden möchten
- Sie keinen hostübergreifenden Browser-Transport benötigen
- Sie keine erweiterten verwalteten/rohen-CDP-only-Routen wie `responsebody`, PDF-
  Export, Download-Abfangung oder Batch-Aktionen benötigen

Für Gateway in WSL2 + Chrome auf Windows bevorzugen Sie rohes Remote-CDP. Chrome MCP ist hostlokal, keine Bridge von WSL2 nach Windows.

## Funktionierende Architektur

Referenzform:

- WSL2 führt das Gateway auf `127.0.0.1:18789` aus
- Windows öffnet die Control UI in einem normalen Browser unter `http://127.0.0.1:18789/`
- Windows-Chrome stellt einen CDP-Endpunkt auf Port `9222` bereit
- WSL2 kann diesen Windows-CDP-Endpunkt erreichen
- OpenClaw richtet ein Browserprofil auf die Adresse aus, die von WSL2 aus erreichbar ist

## Warum dieses Setup verwirrend ist

Mehrere Fehler können sich überlagern:

- WSL2 kann den Windows-CDP-Endpunkt nicht erreichen
- die Control UI wird von einem nicht sicheren Origin aus geöffnet
- `gateway.controlUi.allowedOrigins` passt nicht zum Seiten-Origin
- Token oder Pairing fehlt
- das Browserprofil zeigt auf die falsche Adresse

Deshalb kann das Beheben einer Schicht trotzdem noch einen anderen sichtbaren Fehler zurücklassen.

## Kritische Regel für die Control UI

Wenn die UI von Windows aus geöffnet wird, verwenden Sie Windows-Localhost, sofern Sie kein bewusstes HTTPS-Setup haben.

Verwenden Sie:

`http://127.0.0.1:18789/`

Verwenden Sie für die Control UI nicht standardmäßig eine LAN-IP. Reines HTTP auf einer LAN- oder Tailnet-Adresse kann Verhalten bei unsicherem Origin/Device-Auth auslösen, das nichts mit CDP selbst zu tun hat. Siehe [Control UI](/de/web/control-ui).

## In Schichten validieren

Arbeiten Sie von oben nach unten. Überspringen Sie keine Schritte.

### Schicht 1: Prüfen, ob Chrome auf Windows CDP bereitstellt

Starten Sie Chrome auf Windows mit aktiviertem Remote-Debugging:

```powershell
chrome.exe --remote-debugging-port=9222
```

Prüfen Sie von Windows aus zuerst Chrome selbst:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Wenn das auf Windows fehlschlägt, ist OpenClaw noch nicht das Problem.

### Schicht 2: Prüfen, ob WSL2 diesen Windows-Endpunkt erreichen kann

Testen Sie von WSL2 aus die genaue Adresse, die Sie in `cdpUrl` verwenden möchten:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Gutes Ergebnis:

- `/json/version` gibt JSON mit Browser-/Protocol-Version-Metadaten zurück
- `/json/list` gibt JSON zurück (ein leeres Array ist in Ordnung, wenn keine Seiten geöffnet sind)

Wenn das fehlschlägt:

- Windows stellt den Port für WSL2 noch nicht bereit
- die Adresse ist für die WSL2-Seite falsch
- Firewall / Port-Forwarding / lokales Proxying fehlt noch

Beheben Sie das, bevor Sie die OpenClaw-Konfiguration anfassen.

### Schicht 3: Das richtige Browserprofil konfigurieren

Für rohes Remote-CDP richten Sie OpenClaw auf die Adresse aus, die von WSL2 aus erreichbar ist:

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

- verwenden Sie die von WSL2 aus erreichbare Adresse, nicht diejenige, die nur auf Windows funktioniert
- lassen Sie `attachOnly: true` für extern verwaltete Browser gesetzt
- `cdpUrl` kann `http://`, `https://`, `ws://` oder `wss://` sein
- verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll
- verwenden Sie WS(S) nur dann, wenn der Browser-Provider Ihnen eine direkte DevTools-Socket-URL gibt
- testen Sie dieselbe URL mit `curl`, bevor Sie erwarten, dass OpenClaw erfolgreich ist

### Schicht 4: Die Control-UI-Schicht getrennt prüfen

Öffnen Sie die UI von Windows aus:

`http://127.0.0.1:18789/`

Prüfen Sie dann:

- der Seiten-Origin passt zu dem, was `gateway.controlUi.allowedOrigins` erwartet
- Token-Auth oder Pairing ist korrekt konfiguriert
- Sie debuggen kein Auth-Problem der Control UI, als wäre es ein Browser-Problem

Hilfreiche Seite:

- [Control UI](/de/web/control-ui)

### Schicht 5: End-to-End-Browser-Steuerung prüfen

Von WSL2 aus:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Gutes Ergebnis:

- der Tab wird in Windows-Chrome geöffnet
- `openclaw browser tabs` gibt das Ziel zurück
- spätere Aktionen (`snapshot`, `screenshot`, `navigate`) funktionieren mit demselben Profil

## Häufig irreführende Fehler

Behandeln Sie jede Meldung als schichtspezifischen Hinweis:

- `control-ui-insecure-auth`
  - Problem mit UI-Origin / sicherem Kontext, kein CDP-Transportproblem
- `token_missing`
  - Problem mit der Auth-Konfiguration
- `pairing required`
  - Problem mit der Gerätefreigabe
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 kann das konfigurierte `cdpUrl` nicht erreichen
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - der HTTP-Endpunkt hat geantwortet, aber der DevTools-WebSocket konnte trotzdem nicht geöffnet werden
- veraltete Viewport-/Dark-Mode-/Locale-/Offline-Overrides nach einer Remote-Sitzung
  - führen Sie `openclaw browser stop --browser-profile remote` aus
  - dies schließt die aktive Steuerungssitzung und gibt den Emulationsstatus von Playwright/CDP frei, ohne das Gateway oder den externen Browser neu zu starten
- `gateway timeout after 1500ms`
  - oft weiterhin CDP-Erreichbarkeit oder ein langsamer/nicht erreichbarer Remote-Endpunkt
- `No Chrome tabs found for profile="user"`
  - lokales Chrome-MCP-Profil ausgewählt, obwohl keine hostlokalen Tabs verfügbar sind

## Schnelle Triage-Checkliste

1. Windows: Funktioniert `curl http://127.0.0.1:9222/json/version`?
2. WSL2: Funktioniert `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. OpenClaw-Konfiguration: Verwendet `browser.profiles.<name>.cdpUrl` genau diese von WSL2 aus erreichbare Adresse?
4. Control UI: Öffnen Sie `http://127.0.0.1:18789/` statt einer LAN-IP?
5. Versuchen Sie, `existing-session` über WSL2 und Windows hinweg statt rohem Remote-CDP zu verwenden?

## Praktische Erkenntnis

Das Setup ist normalerweise praktikabel. Der schwierige Teil ist, dass Browser-Transport, Origin-Sicherheit der Control UI und Token/Pairing jeweils unabhängig voneinander ausfallen können, obwohl sie aus Sicht des Benutzers ähnlich aussehen.

Im Zweifel:

- prüfen Sie zuerst den Windows-Chrome-Endpunkt lokal
- prüfen Sie zweitens denselben Endpunkt von WSL2 aus
- debuggen Sie erst dann OpenClaw-Konfiguration oder Control-UI-Auth

## Verwandt

- [Browser](/de/tools/browser)
- [Browser login](/de/tools/browser-login)
- [Browser Linux troubleshooting](/de/tools/browser-linux-troubleshooting)
