---
read_when:
    - OpenClaw Gateway uitvoeren in WSL2 terwijl Chrome op Windows draait
    - Overlappende browser-/control-ui-fouten in WSL2 en Windows zien
    - Kiezen tussen hostlokale Chrome MCP en onbewerkte externe CDP in configuraties met gescheiden hosts
summary: Problemen met WSL2 Gateway + externe CDP van Windows Chrome stapsgewijs oplossen
title: Probleemoplossing voor WSL2 + Windows + externe Chrome CDP
x-i18n:
    generated_at: "2026-07-12T09:27:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

In de gebruikelijke configuratie met gescheiden hosts draait OpenClaw Gateway binnen WSL2, draait Chrome
op Windows en moet browserbesturing de grens tussen WSL2 en Windows passeren. Er kunnen
tegelijkertijd meerdere onafhankelijke problemen optreden (zie
[issue #39369](https://github.com/openclaw/openclaw/issues/39369)): CDP-
transport, oorsprongsbeveiliging van de Control UI en token/koppeling kunnen elk afzonderlijk
mislukken en toch vergelijkbare fouten opleveren. Doorloop de onderstaande lagen
op volgorde in plaats van te raden welke defect is.

## Kies eerst de juiste browsermodus

### Optie 1: rechtstreekse externe CDP van WSL2 naar Windows

Gebruik een extern browserprofiel dat vanuit WSL2 verwijst naar een CDP-
eindpunt van Chrome op Windows. Kies dit wanneer de Gateway binnen WSL2 blijft draaien, Chrome
op Windows draait en browserbesturing de grens tussen WSL2 en Windows moet passeren.

### Optie 2: hostlokale Chrome MCP

Gebruik het stuurprogramma `existing-session` (profiel `user`) alleen wanneer de Gateway
op dezelfde host als Chrome draait, u de lokale aangemelde browserstatus wilt gebruiken, u
geen browsertransport tussen hosts nodig hebt en u geen `responsebody`,
PDF-export, downloadonderschepping of batchacties nodig hebt (Chrome MCP-profielen
ondersteunen deze niet).

Gebruik voor WSL2 Gateway + Windows Chrome rechtstreekse externe CDP. Chrome MCP is
hostlokaal en geen brug van WSL2 naar Windows.

## Werkende architectuur

- WSL2 voert de Gateway uit op `127.0.0.1:18789`
- Windows opent de Control UI in een normale browser op `http://127.0.0.1:18789/`
- Chrome op Windows stelt een CDP-eindpunt beschikbaar op poort `9222`
- WSL2 kan dat CDP-eindpunt op Windows bereiken
- OpenClaw laat een browserprofiel verwijzen naar het vanuit WSL2 bereikbare adres

## Cruciale regel voor de Control UI

Wanneer de UI vanuit Windows wordt geopend, gebruikt u Windows-localhost, tenzij u
bewust HTTPS hebt geconfigureerd:

```text
http://127.0.0.1:18789/
```

Gebruik niet standaard een LAN-IP-adres. Onversleutelde HTTP op een LAN- of tailnetadres kan
gedrag activeren voor een onveilige oorsprong of apparaatauthenticatie dat niets met CDP zelf te maken heeft. Zie
[Control UI](/nl/web/control-ui).

## Valideer in lagen

Werk van boven naar beneden en sla niets over. Nadat u één laag hebt hersteld, kan er nog steeds
een andere fout zichtbaar zijn uit een onderliggende laag.

### Laag 1: controleer of Chrome CDP beschikbaar stelt op Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 en hoger negeren opdrachtregelopties voor externe foutopsporing wanneer de
standaardgegevensmap van Chrome wordt gebruikt. Gebruik een afzonderlijke, niet-standaard gegevensmap,
zoals hierboven weergegeven. Zie de
[beveiligingswijziging voor externe foutopsporing](https://developer.chrome.com/blog/remote-debugging-port)
van Chrome.
Hiermee wordt het normale aangemelde Chrome-profiel niet op afstand bestuurbaar.

Controleer vanuit Windows eerst Chrome zelf:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Als dit mislukt, onderzoekt u de Windows-listeners hieronder. OpenClaw is dan nog niet het
probleem.

#### Onderzoek IPv4 en IPv6 voordat u portproxy wijzigt

Chromium probeert externe foutopsporing eerst aan `127.0.0.1` te binden en valt alleen terug op
`[::1]` als de IPv4-binding mislukt. Een permanente `v4tov4`-regel die luistert op
`127.0.0.1:9222` kan dat eindpunt bezetten voordat Chrome start. Chrome valt dan
terug op `[::1]:9222`, terwijl de oude regel IPv4-verkeer terugstuurt naar
zijn eigen listener en een leeg antwoord retourneert.

Controleer vanuit Windows de daadwerkelijke listeners en proxyregels in plaats van deze
af te leiden uit de Chrome-versie:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Gebruik `tasklist /fi "PID eq <PID>"` voor elke PID uit `netstat`.

- Als `chrome.exe` antwoordt op `127.0.0.1`, verwijdert u elke portproxyregel die ook
  luistert op `127.0.0.1:9222`. Stuur alleen het vanuit WSL2 bereikbare Windows-adapteradres
  door naar `127.0.0.1`.
- Als `chrome.exe` alleen antwoordt op `[::1]`, laat u de vanuit WSL2 bereikbare listener
  met `v4tov6` naar `::1` verwijzen in plaats van door te sturen naar een ongebruikt IPv4-adres:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Bind de listener aan het adapteradres dat WSL2 nodig heeft. Stel de CDP-
poort niet beschikbaar op `0.0.0.0`, een LAN-adres of een tailnetadres: CDP geeft controle over
de browsersessie.

### Laag 2: controleer of WSL2 dat Windows-eindpunt kan bereiken

Test vanuit WSL2 het exacte adres dat u in `cdpUrl` wilt gebruiken:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Goed resultaat:

- `/json/version` retourneert JSON met Browser / Protocol-Version-metagegevens
- `/json/list` retourneert JSON (een lege matrix is prima als er geen pagina's geopend zijn)

Als dit mislukt, stelt Windows de poort nog niet beschikbaar aan WSL2, is het adres
onjuist voor de WSL2-zijde of ontbreekt een firewall-, poortdoorstuur- of proxyconfiguratie. Herstel
dit voordat u de OpenClaw-configuratie wijzigt.

### Laag 3: configureer het juiste browserprofiel

Laat OpenClaw verwijzen naar het vanuit WSL2 bereikbare adres:

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

- gebruik het vanuit WSL2 bereikbare adres, niet een adres dat alleen op Windows werkt
- behoud `attachOnly: true` voor extern beheerde browsers
- `cdpUrl` kan `http://`, `https://`, `ws://` of `wss://` zijn
- gebruik HTTP(S) wanneer u wilt dat OpenClaw `/json/version` detecteert
- gebruik WS(S) alleen wanneer de browserprovider u een rechtstreekse DevTools-
  socket-URL geeft
- test dezelfde URL met `curl` voordat u verwacht dat OpenClaw slaagt

### Laag 4: controleer de Control UI-laag afzonderlijk

Open `http://127.0.0.1:18789/` vanuit Windows en controleer vervolgens:

- of de paginaoorsprong overeenkomt met wat `gateway.controlUi.allowedOrigins` verwacht
- of tokenauthenticatie of koppeling correct is geconfigureerd
- of u niet een authenticatieprobleem van de Control UI onderzoekt alsof het een browserprobleem
  is

Nuttige pagina: [Control UI](/nl/web/control-ui).

### Laag 5: controleer de browserbesturing van begin tot eind

Vanuit WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Goed resultaat:

- het tabblad wordt geopend in Chrome op Windows
- `browser tabs` retourneert het doel
- latere acties (`snapshot`, `screenshot`, `navigate`) werken vanuit hetzelfde
  profiel

## Veelvoorkomende misleidende fouten

| Bericht                                                                                 | Betekenis                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | probleem met de UI-oorsprong of beveiligde context, niet met CDP-transport                                                                                                                     |
| `token_missing`                                                                         | probleem met de authenticatieconfiguratie                                                                                                                                                        |
| `pairing required`                                                                      | probleem met apparaatgoedkeuring                                                                                                                                                           |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 kan de geconfigureerde `cdpUrl` niet bereiken                                                                                                                                         |
| leeg CDP-antwoord / `other side closed` via een portproxy                               | niet-overeenkomende Windows-listener of een zelflus; controleer beide loopbackfamilies en `netsh interface portproxy show all`                                                                 |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | het HTTP-eindpunt antwoordde, maar de DevTools-WebSocket kon niet worden geopend                                                                                                        |
| verouderde viewport-/donkeremodus-/landinstellings-/offline-overschrijvingen na een externe sessie          | voer `openclaw browser --browser-profile remote stop` uit om de sessie te sluiten en de in het cachegeheugen opgeslagen Playwright/CDP-verbinding vrij te geven zonder de Gateway of de externe browser opnieuw te starten |
| time-out rond `remoteCdpTimeoutMs` (standaard 1500 ms)                                    | meestal nog steeds de bereikbaarheid van CDP, of een traag/onbereikbaar extern eindpunt                                                                                                             |
| `Playwright page enumeration timed out after 3000ms`                                    | er is verbinding gemaakt met de externe CDP, maar het permanent uitlezen van tabbladen is vastgelopen; de deadline is de hoogste waarde van `remoteCdpTimeoutMs` en `remoteCdpHandshakeTimeoutMs`                               |
| `No Chrome tabs found for profile="user"`                                               | lokaal Chrome MCP-profiel geselecteerd terwijl er geen hostlokale tabbladen beschikbaar zijn                                                                                                          |

## Snelle controlelijst voor probleemdiagnose

1. Windows: welke van `127.0.0.1` of `[::1]` antwoordt op `/json/version`, en
   behoort die listener toe aan `chrome.exe`?
2. WSL2: werkt `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. OpenClaw-configuratie: gebruikt `browser.profiles.<name>.cdpUrl` exact dat
   vanuit WSL2 bereikbare adres?
4. Control UI: opent u `http://127.0.0.1:18789/` in plaats van een LAN-IP-adres?
5. Probeert u `existing-session` tussen WSL2 en Windows te gebruiken in plaats
   van rechtstreekse externe CDP?

Controleer eerst lokaal het Chrome-eindpunt op Windows, controleer daarna hetzelfde eindpunt
vanuit WSL2 en onderzoek pas vervolgens de OpenClaw-configuratie of Control UI-authenticatie.

## Gerelateerd

- [Browser](/nl/tools/browser)
- [Browseraanmelding](/nl/tools/browser-login)
- [Probleemoplossing voor Browser op Linux](/nl/tools/browser-linux-troubleshooting)
