---
read_when:
    - OpenClaw Gateway in WSL2 ausführen, während Chrome unter Windows läuft
    - Überlappende browser/control-ui-Fehler unter WSL2 und Windows
    - Entscheidung zwischen host-lokalem Chrome MCP und direktem Remote-CDP in Split-Host-Setups
summary: Probleme mit WSL2-Gateway + Remote-CDP von Windows Chrome schichtweise beheben
title: WSL2 + Windows + Problembehandlung für Remote-Chrome-CDP
x-i18n:
    generated_at: "2026-04-30T07:16:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Bei der üblichen Split-Host-Konfiguration läuft OpenClaw Gateway in WSL2, Chrome läuft unter Windows, und die Browsersteuerung muss die Grenze zwischen WSL2 und Windows überqueren. Das geschichtete Fehlermuster aus [Issue #39369](https://github.com/openclaw/openclaw/issues/39369) bedeutet, dass mehrere unabhängige Probleme gleichzeitig auftreten können, wodurch zunächst die falsche Schicht defekt wirkt.

## Wählen Sie zuerst den richtigen Browsermodus

Es gibt zwei gültige Muster:

### Option 1: Direktes Remote-CDP von WSL2 zu Windows

Verwenden Sie ein Remote-Browserprofil, das von WSL2 auf einen Windows-Chrome-CDP-Endpunkt zeigt.

Wählen Sie dies, wenn:

- der Gateway in WSL2 bleibt
- Chrome unter Windows läuft
- die Browsersteuerung die Grenze zwischen WSL2 und Windows überqueren muss

### Option 2: Host-lokales Chrome MCP

Verwenden Sie `existing-session` / `user` nur, wenn der Gateway selbst auf demselben Host wie Chrome läuft.

Wählen Sie dies, wenn:

- OpenClaw und Chrome auf derselben Maschine sind
- Sie den lokalen angemeldeten Browserzustand verwenden möchten
- Sie keinen hostübergreifenden Browsertransport benötigen
- Sie keine erweiterten verwalteten oder nur über direktes CDP verfügbaren Routen wie `responsebody`, PDF-
  Export, Download-Abfangen oder Batch-Aktionen benötigen

Für WSL2 Gateway + Windows Chrome bevorzugen Sie direktes Remote-CDP. Chrome MCP ist host-lokal, keine Brücke von WSL2 zu Windows.

## Funktionierende Architektur

Referenzform:

- WSL2 führt den Gateway auf `127.0.0.1:18789` aus
- Windows öffnet die Control UI in einem normalen Browser unter `http://127.0.0.1:18789/`
- Windows Chrome stellt einen CDP-Endpunkt auf Port `9222` bereit
- WSL2 kann diesen Windows-CDP-Endpunkt erreichen
- OpenClaw verweist mit einem Browserprofil auf die Adresse, die von WSL2 aus erreichbar ist

## Warum diese Konfiguration verwirrend ist

Mehrere Fehler können sich überlagern:

- WSL2 kann den Windows-CDP-Endpunkt nicht erreichen
- die Control UI wird von einem nicht sicheren Origin geöffnet
- `gateway.controlUi.allowedOrigins` passt nicht zum Seiten-Origin
- Token oder Pairing fehlt
- das Browserprofil zeigt auf die falsche Adresse

Deshalb kann nach dem Beheben einer Schicht weiterhin ein anderer Fehler sichtbar bleiben.

## Kritische Regel für die Control UI

Wenn die UI von Windows aus geöffnet wird, verwenden Sie Windows-localhost, sofern Sie keine absichtliche HTTPS-Konfiguration haben.

Verwenden Sie:

`http://127.0.0.1:18789/`

Verwenden Sie nicht standardmäßig eine LAN-IP für die Control UI. Reines HTTP auf einer LAN- oder tailnet-Adresse kann unsicheres Origin-/Geräteauthentifizierungsverhalten auslösen, das nichts mit CDP selbst zu tun hat. Siehe [Control UI](/de/web/control-ui).

## In Schichten validieren

Arbeiten Sie von oben nach unten. Überspringen Sie keine Schritte.

### Schicht 1: Prüfen, ob Chrome unter Windows CDP bereitstellt

Starten Sie Chrome unter Windows mit aktivierter Remote-Debugging-Funktion:

```powershell
chrome.exe --remote-debugging-port=9222
```

Prüfen Sie von Windows aus zuerst Chrome selbst:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Wenn dies unter Windows fehlschlägt, ist OpenClaw noch nicht das Problem.

### Schicht 2: Prüfen, ob WSL2 diesen Windows-Endpunkt erreichen kann

Testen Sie von WSL2 aus die exakte Adresse, die Sie in `cdpUrl` verwenden möchten:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Gutes Ergebnis:

- `/json/version` gibt JSON mit Browser- / Protocol-Version-Metadaten zurück
- `/json/list` gibt JSON zurück (ein leeres Array ist in Ordnung, wenn keine Seiten geöffnet sind)

Wenn dies fehlschlägt:

- Windows stellt den Port für WSL2 noch nicht bereit
- die Adresse ist für die WSL2-Seite falsch
- Firewall / Portweiterleitung / lokales Proxying fehlt noch

Beheben Sie das, bevor Sie die OpenClaw-Konfiguration anfassen.

### Schicht 3: Das richtige Browserprofil konfigurieren

Für direktes Remote-CDP verweisen Sie OpenClaw auf die Adresse, die von WSL2 aus erreichbar ist:

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

- verwenden Sie die von WSL2 aus erreichbare Adresse, nicht das, was nur unter Windows funktioniert
- behalten Sie `attachOnly: true` für extern verwaltete Browser bei
- `cdpUrl` kann `http://`, `https://`, `ws://` oder `wss://` sein
- verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll
- verwenden Sie WS(S) nur, wenn der Browser-Provider Ihnen eine direkte DevTools-Socket-URL bereitstellt
- testen Sie dieselbe URL mit `curl`, bevor Sie erwarten, dass OpenClaw erfolgreich ist

### Schicht 4: Die Control-UI-Schicht separat prüfen

Öffnen Sie die UI von Windows aus:

`http://127.0.0.1:18789/`

Prüfen Sie dann:

- der Seiten-Origin entspricht dem, was `gateway.controlUi.allowedOrigins` erwartet
- Token-Authentifizierung oder Pairing ist korrekt konfiguriert
- Sie debuggen kein Control-UI-Authentifizierungsproblem, als wäre es ein Browserproblem

Hilfreiche Seite:

- [Control UI](/de/web/control-ui)

### Schicht 5: End-to-End-Browsersteuerung prüfen

Von WSL2 aus:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Gutes Ergebnis:

- der Tab wird in Windows Chrome geöffnet
- `openclaw browser tabs` gibt das Ziel zurück
- spätere Aktionen (`snapshot`, `screenshot`, `navigate`) funktionieren mit demselben Profil

## Häufige irreführende Fehler

Behandeln Sie jede Meldung als schichtspezifischen Hinweis:

- `control-ui-insecure-auth`
  - UI-Origin-/Secure-Context-Problem, kein CDP-Transportproblem
- `token_missing`
  - Problem mit der Authentifizierungskonfiguration
- `pairing required`
  - Problem mit der Gerätefreigabe
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 kann die konfigurierte `cdpUrl` nicht erreichen
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - der HTTP-Endpunkt hat geantwortet, aber der DevTools-WebSocket konnte trotzdem nicht geöffnet werden
- veraltete Viewport- / Dark-Mode- / Locale- / Offline-Overrides nach einer Remote-Sitzung
  - führen Sie `openclaw browser stop --browser-profile remote` aus
  - dies schließt die aktive Steuerungssitzung und gibt den Playwright-/CDP-Emulationszustand frei, ohne den Gateway oder den externen Browser neu zu starten
- `gateway timeout after 1500ms`
  - oft weiterhin CDP-Erreichbarkeit oder ein langsamer/nicht erreichbarer Remote-Endpunkt
- `No Chrome tabs found for profile="user"`
  - lokales Chrome-MCP-Profil ausgewählt, obwohl keine host-lokalen Tabs verfügbar sind

## Schnelle Triage-Checkliste

1. Windows: funktioniert `curl http://127.0.0.1:9222/json/version`?
2. WSL2: funktioniert `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. OpenClaw-Konfiguration: verwendet `browser.profiles.<name>.cdpUrl` genau diese von WSL2 aus erreichbare Adresse?
4. Control UI: öffnen Sie `http://127.0.0.1:18789/` statt einer LAN-IP?
5. Versuchen Sie, `existing-session` über WSL2 und Windows hinweg zu verwenden, statt direktes Remote-CDP?

## Praktische Schlussfolgerung

Die Konfiguration ist in der Regel funktionsfähig. Die Schwierigkeit besteht darin, dass Browsertransport, Origin-Sicherheit der Control UI und Token/Pairing jeweils unabhängig fehlschlagen können, während sie aus Benutzersicht ähnlich aussehen.

Im Zweifel:

- prüfen Sie zuerst den Windows-Chrome-Endpunkt lokal
- prüfen Sie denselben Endpunkt anschließend von WSL2 aus
- debuggen Sie erst dann die OpenClaw-Konfiguration oder die Control-UI-Authentifizierung

## Verwandte Themen

- [Browser](/de/tools/browser)
- [Browser-Anmeldung](/de/tools/browser-login)
- [Browser-Linux-Fehlerbehebung](/de/tools/browser-linux-troubleshooting)
