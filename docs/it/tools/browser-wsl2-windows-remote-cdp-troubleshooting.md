---
read_when:
    - Esecuzione del Gateway OpenClaw in WSL2 mentre Chrome è installato su Windows
    - Errori sovrapposti del browser/dell'interfaccia di controllo in WSL2 e Windows
    - Scegliere tra Chrome MCP locale all'host e CDP remoto diretto nelle configurazioni con host separati
summary: Risoluzione dei problemi del Gateway WSL2 e del CDP remoto di Chrome per Windows, livello per livello
title: Risoluzione dei problemi di WSL2 + Windows + CDP remoto di Chrome
x-i18n:
    generated_at: "2026-07-12T07:35:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Nella comune configurazione con host separati, OpenClaw Gateway viene eseguito all'interno di WSL2, Chrome viene eseguito
su Windows e il controllo del browser deve attraversare il confine tra WSL2 e Windows. Possono emergere
contemporaneamente diversi problemi indipendenti (vedere
[issue #39369](https://github.com/openclaw/openclaw/issues/39369)): il trasporto
CDP, la sicurezza dell'origine della UI di controllo e il token/associazione possono non funzionare
ciascuno autonomamente, producendo errori dall'aspetto simile. Esamina nell'ordine
i livelli riportati di seguito anziché tentare di indovinare quale non funziona.

## Scegli prima la modalità browser corretta

### Opzione 1: CDP remoto diretto da WSL2 a Windows

Usa un profilo browser remoto che da WSL2 punti a un endpoint CDP di Chrome
su Windows. Scegli questa opzione quando il Gateway rimane all'interno di WSL2, Chrome viene eseguito su
Windows e il controllo del browser deve attraversare il confine tra WSL2 e Windows.

### Opzione 2: Chrome MCP locale all'host

Usa il driver `existing-session` (profilo `user`) solo quando il Gateway viene eseguito
sullo stesso host di Chrome, vuoi utilizzare lo stato locale del browser con accesso effettuato, non
ti serve il trasporto del browser tra host e non ti servono `responsebody`,
l'esportazione in PDF, l'intercettazione dei download o le azioni in batch (i profili Chrome MCP non
supportano queste funzionalità).

Per Gateway WSL2 + Chrome su Windows, usa CDP remoto diretto. Chrome MCP è
locale all'host, non è un ponte tra WSL2 e Windows.

## Architettura funzionante

- WSL2 esegue il Gateway su `127.0.0.1:18789`
- Windows apre la UI di controllo in un browser normale all'indirizzo `http://127.0.0.1:18789/`
- Chrome su Windows espone un endpoint CDP sulla porta `9222`
- WSL2 può raggiungere tale endpoint CDP di Windows
- OpenClaw indirizza un profilo browser all'indirizzo raggiungibile da WSL2

## Regola fondamentale per la UI di controllo

Quando la UI viene aperta da Windows, usa il localhost di Windows, a meno che tu non disponga di una
configurazione HTTPS intenzionale:

```text
http://127.0.0.1:18789/
```

Non usare per impostazione predefinita un indirizzo IP LAN. HTTP semplice su un indirizzo LAN o tailnet può
attivare comportamenti relativi a un'origine non sicura o all'autenticazione del dispositivo, non correlati a CDP. Vedere
[UI di controllo](/it/web/control-ui).

## Convalida per livelli

Procedi dall'alto verso il basso; non saltare passaggi. La correzione di un livello può comunque lasciare
visibile un errore diverso proveniente da un livello successivo.

### Livello 1: verifica che Chrome esponga CDP su Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 e versioni successive ignorano le opzioni della riga di comando per il debug remoto quando viene usata la
directory dati predefinita di Chrome. Usa una directory dati separata e non predefinita, come
mostrato sopra. Vedere la
[modifica alla sicurezza del debug remoto](https://developer.chrome.com/blog/remote-debugging-port)
di Chrome.
Ciò non rende controllabile da remoto il normale profilo Chrome con accesso effettuato.

Da Windows, verifica innanzitutto Chrome stesso:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Se l'operazione non riesce, diagnostica i listener di Windows riportati di seguito. OpenClaw non è ancora
il problema.

#### Diagnostica IPv4 e IPv6 prima di modificare portproxy

Chromium tenta prima di associare il debug remoto a `127.0.0.1` e passa a
`[::1]` solo se l'associazione IPv4 non riesce. Una regola `v4tov4` persistente in ascolto su
`127.0.0.1:9222` può occupare tale endpoint prima dell'avvio di Chrome. Chrome quindi
passa a `[::1]:9222`, mentre la vecchia regola inoltra il traffico IPv4 nuovamente al
proprio listener e restituisce una risposta vuota.

Controlla i listener e le regole proxy effettivi da Windows, anziché dedurli
dalla versione di Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Usa `tasklist /fi "PID eq <PID>"` per ogni PID restituito da `netstat`.

- Se `chrome.exe` risponde su `127.0.0.1`, rimuovi qualsiasi regola portproxy che sia anch'essa
  in ascolto su `127.0.0.1:9222`. Inoltra soltanto l'indirizzo dell'adattatore Windows
  raggiungibile da WSL2 verso `127.0.0.1`.
- Se `chrome.exe` risponde solo su `[::1]`, indirizza il listener raggiungibile da WSL2 a
  `::1` con `v4tov6`, invece di inoltrarlo a un indirizzo IPv4 inutilizzato:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Associa il listener all'indirizzo dell'adattatore necessario a WSL2. Non esporre la porta
CDP su `0.0.0.0`, su un indirizzo LAN o su un indirizzo tailnet: CDP concede il controllo della
sessione del browser.

### Livello 2: verifica che WSL2 possa raggiungere tale endpoint di Windows

Da WSL2, verifica l'indirizzo esatto che intendi usare in `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Risultato corretto:

- `/json/version` restituisce JSON con i metadati Browser / Protocol-Version
- `/json/list` restituisce JSON (un array vuoto va bene se non ci sono pagine aperte)

Se l'operazione non riesce, Windows non sta ancora esponendo la porta a WSL2, l'indirizzo è
errato per il lato WSL2 oppure manca il firewall, l'inoltro della porta o il proxy. Correggi
il problema prima di modificare la configurazione di OpenClaw.

### Livello 3: configura il profilo browser corretto

Indirizza OpenClaw all'indirizzo raggiungibile da WSL2:

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

Note:

- usa l'indirizzo raggiungibile da WSL2, non quello che funziona soltanto su Windows
- mantieni `attachOnly: true` per i browser gestiti esternamente
- `cdpUrl` può essere `http://`, `https://`, `ws://` o `wss://`
- usa HTTP(S) quando vuoi che OpenClaw rilevi `/json/version`
- usa WS(S) solo quando il fornitore del browser ti fornisce un URL diretto per il socket
  DevTools
- verifica lo stesso URL con `curl` prima di aspettarti che OpenClaw funzioni

### Livello 4: verifica separatamente il livello della UI di controllo

Apri `http://127.0.0.1:18789/` da Windows, quindi verifica:

- che l'origine della pagina corrisponda a quanto previsto da `gateway.controlUi.allowedOrigins`
- che l'autenticazione tramite token o l'associazione sia configurata correttamente
- che tu non stia diagnosticando un problema di autenticazione della UI di controllo come se fosse un problema del browser

Pagina utile: [UI di controllo](/it/web/control-ui).

### Livello 5: verifica il controllo del browser end-to-end

Da WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Risultato corretto:

- la scheda si apre in Chrome su Windows
- `browser tabs` restituisce la destinazione
- le azioni successive (`snapshot`, `screenshot`, `navigate`) funzionano con lo stesso
  profilo

## Errori fuorvianti comuni

| Messaggio                                                                                | Significato                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                               | problema dell'origine o del contesto sicuro della UI, non un problema del trasporto CDP                                                                                            |
| `token_missing`                                                                          | problema di configurazione dell'autenticazione                                                                                                                                     |
| `pairing required`                                                                       | problema di approvazione del dispositivo                                                                                                                                           |
| `Remote CDP for profile "remote" is not reachable`                                       | WSL2 non può raggiungere il `cdpUrl` configurato                                                                                                                                    |
| risposta CDP vuota / `other side closed` attraverso un portproxy                         | mancata corrispondenza del listener di Windows o auto-loop; controlla entrambe le famiglie di loopback e `netsh interface portproxy show all`                                      |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`  | l'endpoint HTTP ha risposto, ma non è stato possibile aprire il WebSocket DevTools                                                                                                  |
| viewport / modalità scura / impostazioni locali / override offline obsoleti dopo una sessione remota | esegui `openclaw browser --browser-profile remote stop` per chiudere la sessione e rilasciare la connessione Playwright/CDP memorizzata nella cache senza riavviare il Gateway o il browser esterno |
| timeout relativo a `remoteCdpTimeoutMs` (valore predefinito 1500 ms)                     | in genere si tratta comunque della raggiungibilità CDP oppure di un endpoint remoto lento o irraggiungibile                                                                        |
| `Playwright page enumeration timed out after 3000ms`                                     | il CDP remoto si è connesso, ma la lettura persistente delle schede si è bloccata; la scadenza corrisponde al valore maggiore tra `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` |
| `No Chrome tabs found for profile="user"`                                                | è stato selezionato il profilo Chrome MCP locale, ma non sono disponibili schede locali all'host                                                                                   |

## Elenco di controllo per una diagnosi rapida

1. Windows: quale tra `127.0.0.1` e `[::1]` risponde su `/json/version` e
   tale listener appartiene a `chrome.exe`?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` funziona?
3. Configurazione di OpenClaw: `browser.profiles.<name>.cdpUrl` usa esattamente tale
   indirizzo raggiungibile da WSL2?
4. UI di controllo: stai aprendo `http://127.0.0.1:18789/` anziché un indirizzo IP LAN?
5. Stai tentando di usare `existing-session` tra WSL2 e Windows invece
   del CDP remoto diretto?

Verifica innanzitutto l'endpoint Chrome di Windows localmente, quindi verifica lo stesso endpoint
da WSL2 e solo a quel punto diagnostica la configurazione di OpenClaw o l'autenticazione della UI di controllo.

## Contenuti correlati

- [Browser](/it/tools/browser)
- [Accesso al browser](/it/tools/browser-login)
- [Risoluzione dei problemi del browser su Linux](/it/tools/browser-linux-troubleshooting)
