---
read_when:
    - Eseguire OpenClaw Gateway in WSL2 mentre Chrome risiede su Windows
    - Vedere errori sovrapposti di browser/control-ui tra WSL2 e Windows
    - Decidere tra Chrome MCP host-local e CDP remoto raw in configurazioni host suddivise
summary: Risolvere i problemi del Gateway WSL2 + Chrome Windows con CDP remoto a livelli
title: Risoluzione dei problemi di WSL2 + Windows + Chrome remoto con CDP
x-i18n:
    generated_at: "2026-04-24T09:04:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

Questa guida copre la comune configurazione split-host in cui:

- OpenClaw Gateway è in esecuzione dentro WSL2
- Chrome è in esecuzione su Windows
- il controllo del browser deve attraversare il confine WSL2/Windows

Copre anche il pattern di guasto a livelli descritto in [issue #39369](https://github.com/openclaw/openclaw/issues/39369): possono comparire contemporaneamente diversi problemi indipendenti, facendo sembrare rotto per primo il livello sbagliato.

## Scegli prima la modalità browser corretta

Hai due pattern validi:

### Opzione 1: CDP remoto raw da WSL2 a Windows

Usa un profilo browser remoto che punti da WSL2 a un endpoint CDP di Chrome su Windows.

Sceglilo quando:

- il Gateway resta dentro WSL2
- Chrome è in esecuzione su Windows
- ti serve che il controllo del browser attraversi il confine WSL2/Windows

### Opzione 2: Chrome MCP host-local

Usa `existing-session` / `user` solo quando il Gateway stesso è in esecuzione sullo stesso host di Chrome.

Sceglilo quando:

- OpenClaw e Chrome sono sulla stessa macchina
- vuoi lo stato del browser locale con accesso già effettuato
- non hai bisogno di trasporto browser cross-host
- non hai bisogno di percorsi avanzati disponibili solo con managed/raw CDP come `responsebody`, esportazione PDF, intercettazione dei download o azioni batch

Per Gateway WSL2 + Chrome su Windows, preferisci CDP remoto raw. Chrome MCP è host-local, non un bridge da WSL2 a Windows.

## Architettura funzionante

Forma di riferimento:

- WSL2 esegue il Gateway su `127.0.0.1:18789`
- Windows apre la Control UI in un normale browser su `http://127.0.0.1:18789/`
- Chrome su Windows espone un endpoint CDP sulla porta `9222`
- WSL2 può raggiungere quell'endpoint CDP di Windows
- OpenClaw punta un profilo browser all'indirizzo raggiungibile da WSL2

## Perché questa configurazione è confusa

Possono sovrapporsi più guasti:

- WSL2 non riesce a raggiungere l'endpoint CDP di Windows
- La Control UI viene aperta da un'origine non sicura
- `gateway.controlUi.allowedOrigins` non corrisponde all'origine della pagina
- mancano token o abbinamento
- il profilo browser punta all'indirizzo sbagliato

Per questo, correggere un livello può comunque lasciare visibile un errore diverso.

## Regola critica per la Control UI

Quando la UI viene aperta da Windows, usa localhost di Windows a meno che tu non abbia una configurazione HTTPS deliberata.

Usa:

`http://127.0.0.1:18789/`

Non usare come predefinito un IP LAN per la Control UI. HTTP in chiaro su un indirizzo LAN o tailnet può attivare comportamenti di origine non sicura / autenticazione del dispositivo che non hanno nulla a che vedere con CDP. Vedi [Control UI](/it/web/control-ui).

## Valida a livelli

Procedi dall'alto verso il basso. Non saltare avanti.

### Livello 1: verifica che Chrome stia servendo CDP su Windows

Avvia Chrome su Windows con il debug remoto abilitato:

```powershell
chrome.exe --remote-debugging-port=9222
```

Da Windows, verifica prima Chrome stesso:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Se questo fallisce su Windows, OpenClaw non è ancora il problema.

### Livello 2: verifica che WSL2 possa raggiungere quell'endpoint Windows

Da WSL2, testa l'indirizzo esatto che intendi usare in `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Buon risultato:

- `/json/version` restituisce JSON con metadati Browser / Protocol-Version
- `/json/list` restituisce JSON (un array vuoto va bene se non ci sono pagine aperte)

Se questo fallisce:

- Windows non sta ancora esponendo la porta a WSL2
- l'indirizzo è sbagliato dal lato WSL2
- mancano ancora firewall / port forwarding / proxy locale

Correggi questo prima di toccare la configurazione di OpenClaw.

### Livello 3: configura il profilo browser corretto

Per CDP remoto raw, fai puntare OpenClaw all'indirizzo raggiungibile da WSL2:

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

- usa l'indirizzo raggiungibile da WSL2, non quello che funziona solo su Windows
- mantieni `attachOnly: true` per browser gestiti esternamente
- `cdpUrl` può essere `http://`, `https://`, `ws://` o `wss://`
- usa HTTP(S) quando vuoi che OpenClaw scopra `/json/version`
- usa WS(S) solo quando il provider browser ti fornisce un URL socket DevTools diretto
- testa lo stesso URL con `curl` prima di aspettarti che OpenClaw funzioni

### Livello 4: verifica separatamente il livello Control UI

Apri la UI da Windows:

`http://127.0.0.1:18789/`

Poi verifica:

- l'origine della pagina corrisponde a ciò che si aspetta `gateway.controlUi.allowedOrigins`
- token auth o pairing sono configurati correttamente
- non stai facendo debug di un problema di autenticazione della Control UI come se fosse un problema del browser

Pagina utile:

- [Control UI](/it/web/control-ui)

### Livello 5: verifica il controllo browser end-to-end

Da WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Buon risultato:

- la scheda si apre in Chrome su Windows
- `openclaw browser tabs` restituisce il target
- azioni successive (`snapshot`, `screenshot`, `navigate`) funzionano dallo stesso profilo

## Errori comuni fuorvianti

Tratta ogni messaggio come un indizio specifico del livello:

- `control-ui-insecure-auth`
  - problema di origine della UI / contesto sicuro, non problema di trasporto CDP
- `token_missing`
  - problema di configurazione auth
- `pairing required`
  - problema di approvazione del dispositivo
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 non riesce a raggiungere il `cdpUrl` configurato
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - l'endpoint HTTP ha risposto, ma il WebSocket DevTools non è comunque riuscito ad aprirsi
- override stale di viewport / dark-mode / locale / offline dopo una sessione remota
  - esegui `openclaw browser stop --browser-profile remote`
  - questo chiude la sessione di controllo attiva e rilascia lo stato di emulazione Playwright/CDP senza riavviare il gateway o il browser esterno
- `gateway timeout after 1500ms`
  - spesso è ancora un problema di raggiungibilità CDP o un endpoint remoto lento/non raggiungibile
- `No Chrome tabs found for profile="user"`
  - è stato selezionato un profilo locale Chrome MCP dove non sono disponibili schede host-local

## Checklist rapida di triage

1. Windows: `curl http://127.0.0.1:9222/json/version` funziona?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` funziona?
3. Configurazione OpenClaw: `browser.profiles.<name>.cdpUrl` usa quell'indirizzo esatto raggiungibile da WSL2?
4. Control UI: stai aprendo `http://127.0.0.1:18789/` invece di un IP LAN?
5. Stai cercando di usare `existing-session` tra WSL2 e Windows invece di CDP remoto raw?

## Risultato pratico

La configurazione di solito è fattibile. La parte difficile è che trasporto del browser, sicurezza dell'origine della Control UI e token/pairing possono fallire indipendentemente pur sembrando simili dal lato utente.

In caso di dubbio:

- verifica prima localmente l'endpoint Chrome di Windows
- verifica poi lo stesso endpoint da WSL2
- solo dopo fai debug della configurazione OpenClaw o dell'autenticazione della Control UI

## Correlati

- [Browser](/it/tools/browser)
- [Browser login](/it/tools/browser-login)
- [Risoluzione dei problemi Browser su Linux](/it/tools/browser-linux-troubleshooting)
