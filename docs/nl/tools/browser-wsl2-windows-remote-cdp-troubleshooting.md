---
read_when:
    - OpenClaw Gateway uitvoeren in WSL2 terwijl Chrome op Windows draait
    - Overlappende browser-/control-ui-fouten in WSL2 en Windows
    - Kiezen tussen host-lokale Chrome-MCP en ruwe externe CDP in configuraties met gesplitste hosts
summary: Problemen met WSL2 Gateway + externe CDP van Windows Chrome laag voor laag oplossen
title: Probleemoplossing voor WSL2 + Windows + externe Chrome-CDP
x-i18n:
    generated_at: "2026-04-29T23:21:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

In de gangbare split-hostconfiguratie draait OpenClaw Gateway binnen WSL2, draait Chrome op Windows, en moet browserbesturing de grens tussen WSL2 en Windows oversteken. Het gelaagde foutpatroon uit [issue #39369](https://github.com/openclaw/openclaw/issues/39369) betekent dat meerdere onafhankelijke problemen tegelijk kunnen optreden, waardoor eerst de verkeerde laag kapot lijkt.

## Kies eerst de juiste browsermodus

Je hebt twee geldige patronen:

### Optie 1: Ruwe externe CDP van WSL2 naar Windows

Gebruik een extern browserprofiel dat vanuit WSL2 naar een Windows Chrome-CDP-eindpunt wijst.

Kies dit wanneer:

- de Gateway binnen WSL2 blijft
- Chrome op Windows draait
- je browserbesturing de grens tussen WSL2 en Windows moet laten oversteken

### Optie 2: Host-lokale Chrome MCP

Gebruik `existing-session` / `user` alleen wanneer de Gateway zelf op dezelfde host als Chrome draait.

Kies dit wanneer:

- OpenClaw en Chrome op dezelfde machine staan
- je de lokale ingelogde browserstatus wilt
- je geen cross-host browsertransport nodig hebt
- je geen geavanceerde beheerde/alleen-raw-CDP-routes nodig hebt, zoals `responsebody`, PDF-
  export, downloadinterceptie of batchacties

Voor WSL2 Gateway + Windows Chrome heeft ruwe externe CDP de voorkeur. Chrome MCP is host-lokaal, geen brug van WSL2 naar Windows.

## Werkende architectuur

Referentievorm:

- WSL2 draait de Gateway op `127.0.0.1:18789`
- Windows opent de Control UI in een normale browser op `http://127.0.0.1:18789/`
- Windows Chrome stelt een CDP-eindpunt beschikbaar op poort `9222`
- WSL2 kan dat Windows CDP-eindpunt bereiken
- OpenClaw wijst een browserprofiel naar het adres dat bereikbaar is vanuit WSL2

## Waarom deze configuratie verwarrend is

Meerdere fouten kunnen elkaar overlappen:

- WSL2 kan het Windows CDP-eindpunt niet bereiken
- de Control UI wordt geopend vanaf een niet-beveiligde oorsprong
- `gateway.controlUi.allowedOrigins` komt niet overeen met de paginaoorsprong
- token of koppeling ontbreekt
- het browserprofiel wijst naar het verkeerde adres

Daardoor kan na het oplossen van één laag nog steeds een andere fout zichtbaar blijven.

## Kritieke regel voor de Control UI

Wanneer de UI vanuit Windows wordt geopend, gebruik dan Windows localhost tenzij je bewust een HTTPS-configuratie hebt.

Gebruik:

`http://127.0.0.1:18789/`

Gebruik niet standaard een LAN-IP voor de Control UI. Gewone HTTP op een LAN- of tailnet-adres kan onveilig-oorsprong-/apparaat-authenticatiegedrag activeren dat niets met CDP zelf te maken heeft. Zie [Control UI](/nl/web/control-ui).

## Valideer in lagen

Werk van boven naar beneden. Sla niets over.

### Laag 1: Controleer of Chrome CDP aanbiedt op Windows

Start Chrome op Windows met remote debugging ingeschakeld:

```powershell
chrome.exe --remote-debugging-port=9222
```

Controleer vanuit Windows eerst Chrome zelf:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Als dit op Windows mislukt, is OpenClaw nog niet het probleem.

### Laag 2: Controleer of WSL2 dat Windows-eindpunt kan bereiken

Test vanuit WSL2 het exacte adres dat je in `cdpUrl` wilt gebruiken:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Goed resultaat:

- `/json/version` retourneert JSON met Browser / Protocol-Version-metadata
- `/json/list` retourneert JSON (een lege array is prima als er geen pagina's open zijn)

Als dit mislukt:

- Windows stelt de poort nog niet beschikbaar aan WSL2
- het adres is verkeerd voor de WSL2-kant
- firewall / port forwarding / lokale proxying ontbreekt nog steeds

Los dat op voordat je de OpenClaw-configuratie aanraakt.

### Laag 3: Configureer het juiste browserprofiel

Voor ruwe externe CDP laat je OpenClaw wijzen naar het adres dat bereikbaar is vanuit WSL2:

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

Opmerkingen:

- gebruik het vanuit WSL2 bereikbare adres, niet wat alleen op Windows werkt
- houd `attachOnly: true` aan voor extern beheerde browsers
- `cdpUrl` kan `http://`, `https://`, `ws://` of `wss://` zijn
- gebruik HTTP(S) wanneer je wilt dat OpenClaw `/json/version` ontdekt
- gebruik WS(S) alleen wanneer de browserprovider je een directe DevTools-socket-URL geeft
- test dezelfde URL met `curl` voordat je verwacht dat OpenClaw slaagt

### Laag 4: Controleer de Control UI-laag afzonderlijk

Open de UI vanuit Windows:

`http://127.0.0.1:18789/`

Controleer daarna:

- de paginaoorsprong komt overeen met wat `gateway.controlUi.allowedOrigins` verwacht
- tokenauthenticatie of koppeling is correct geconfigureerd
- je debugt geen authenticatieprobleem van de Control UI alsof het een browserprobleem is

Nuttige pagina:

- [Control UI](/nl/web/control-ui)

### Laag 5: Controleer end-to-end browserbesturing

Vanuit WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Goed resultaat:

- het tabblad opent in Windows Chrome
- `openclaw browser tabs` retourneert het doel
- latere acties (`snapshot`, `screenshot`, `navigate`) werken vanuit hetzelfde profiel

## Vaak misleidende fouten

Behandel elk bericht als een laagspecifieke aanwijzing:

- `control-ui-insecure-auth`
  - UI-oorsprong / secure-context-probleem, geen CDP-transportprobleem
- `token_missing`
  - authenticatieconfiguratieprobleem
- `pairing required`
  - apparaatgoedkeuringsprobleem
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 kan de geconfigureerde `cdpUrl` niet bereiken
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - het HTTP-eindpunt antwoordde, maar de DevTools WebSocket kon nog steeds niet worden geopend
- verouderde viewport- / dark-mode- / locale- / offline-overschrijvingen na een externe sessie
  - voer `openclaw browser stop --browser-profile remote` uit
  - dit sluit de actieve besturingssessie en geeft Playwright/CDP-emulatiestatus vrij zonder de gateway of de externe browser opnieuw te starten
- `gateway timeout after 1500ms`
  - vaak nog steeds CDP-bereikbaarheid of een traag/onbereikbaar extern eindpunt
- `No Chrome tabs found for profile="user"`
  - lokaal Chrome MCP-profiel geselecteerd terwijl er geen host-lokale tabbladen beschikbaar zijn

## Snelle triagechecklist

1. Windows: werkt `curl http://127.0.0.1:9222/json/version`?
2. WSL2: werkt `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. OpenClaw-configuratie: gebruikt `browser.profiles.<name>.cdpUrl` dat exacte vanuit WSL2 bereikbare adres?
4. Control UI: open je `http://127.0.0.1:18789/` in plaats van een LAN-IP?
5. Probeer je `existing-session` over WSL2 en Windows te gebruiken in plaats van ruwe externe CDP?

## Praktische conclusie

De configuratie is meestal haalbaar. Het lastige is dat browsertransport, oorsprongsbeveiliging van de Control UI en token/koppeling elk onafhankelijk kunnen mislukken terwijl ze vanaf de gebruikerskant op elkaar lijken.

Bij twijfel:

- controleer eerst lokaal het Windows Chrome-eindpunt
- controleer daarna hetzelfde eindpunt vanuit WSL2
- debug pas daarna OpenClaw-configuratie of Control UI-authenticatie

## Gerelateerd

- [Browser](/nl/tools/browser)
- [Browserlogin](/nl/tools/browser-login)
- [Probleemoplossing voor Browser op Linux](/nl/tools/browser-linux-troubleshooting)
