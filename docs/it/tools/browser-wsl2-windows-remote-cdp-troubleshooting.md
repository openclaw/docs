---
read_when:
    - Esecuzione di OpenClaw Gateway in WSL2 mentre Chrome è in esecuzione su Windows
    - Riscontro di errori sovrapposti del browser/control-ui tra WSL2 e Windows
    - Scegliere tra Chrome MCP locale sull'host e CDP remoto diretto nelle configurazioni con host separati
summary: Risolvere i problemi di WSL2 Gateway + CDP remoto di Chrome su Windows per livelli
title: Risoluzione dei problemi di WSL2 + Windows + Chrome CDP remoto
x-i18n:
    generated_at: "2026-04-30T09:15:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Nella configurazione comune con host separati, OpenClaw Gateway viene eseguito dentro WSL2, Chrome viene eseguito su Windows e il controllo del browser deve attraversare il confine tra WSL2 e Windows. Il modello di errore stratificato da [issue #39369](https://github.com/openclaw/openclaw/issues/39369) significa che più problemi indipendenti possono presentarsi contemporaneamente, facendo sembrare guasto per primo il livello sbagliato.

## Scegli prima la modalità browser corretta

Hai due schemi validi:

### Opzione 1: CDP remoto grezzo da WSL2 a Windows

Usa un profilo browser remoto che punti da WSL2 a un endpoint CDP di Chrome su Windows.

Scegli questa opzione quando:

- il Gateway rimane dentro WSL2
- Chrome viene eseguito su Windows
- hai bisogno che il controllo del browser attraversi il confine WSL2/Windows

### Opzione 2: Chrome MCP locale all'host

Usa `existing-session` / `user` solo quando il Gateway stesso viene eseguito sullo stesso host di Chrome.

Scegli questa opzione quando:

- OpenClaw e Chrome sono sulla stessa macchina
- vuoi lo stato del browser locale con sessione avviata
- non hai bisogno del trasporto browser tra host
- non hai bisogno di percorsi avanzati gestiti/solo raw-CDP come `responsebody`, esportazione PDF, intercettazione dei download o azioni in batch

Per Gateway in WSL2 + Chrome su Windows, preferisci CDP remoto grezzo. Chrome MCP è locale all'host, non un bridge da WSL2 a Windows.

## Architettura funzionante

Forma di riferimento:

- WSL2 esegue il Gateway su `127.0.0.1:18789`
- Windows apre l'interfaccia di controllo in un browser normale su `http://127.0.0.1:18789/`
- Chrome su Windows espone un endpoint CDP sulla porta `9222`
- WSL2 può raggiungere quell'endpoint CDP di Windows
- OpenClaw punta un profilo browser all'indirizzo raggiungibile da WSL2

## Perché questa configurazione crea confusione

Diversi errori possono sovrapporsi:

- WSL2 non riesce a raggiungere l'endpoint CDP di Windows
- l'interfaccia di controllo viene aperta da un'origine non sicura
- `gateway.controlUi.allowedOrigins` non corrisponde all'origine della pagina
- token o abbinamento mancanti
- il profilo browser punta all'indirizzo sbagliato

Per questo motivo, correggere un livello può comunque lasciare visibile un errore diverso.

## Regola critica per l'interfaccia di controllo

Quando l'UI viene aperta da Windows, usa il localhost di Windows a meno che tu non abbia una configurazione HTTPS deliberata.

Usa:

`http://127.0.0.1:18789/`

Non usare come impostazione predefinita un IP LAN per l'interfaccia di controllo. HTTP semplice su un indirizzo LAN o tailnet può attivare comportamenti di origine non sicura/autenticazione dispositivo che non sono collegati a CDP stesso. Vedi [interfaccia di controllo](/it/web/control-ui).

## Convalida per livelli

Procedi dall'alto verso il basso. Non saltare passaggi.

### Livello 1: Verifica che Chrome stia servendo CDP su Windows

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

### Livello 2: Verifica che WSL2 possa raggiungere quell'endpoint Windows

Da WSL2, testa l'indirizzo esatto che intendi usare in `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Risultato corretto:

- `/json/version` restituisce JSON con metadati Browser / Protocol-Version
- `/json/list` restituisce JSON (un array vuoto va bene se non ci sono pagine aperte)

Se questo fallisce:

- Windows non sta ancora esponendo la porta a WSL2
- l'indirizzo è sbagliato dal lato WSL2
- firewall / port forwarding / proxy locale sono ancora mancanti

Correggi questo prima di toccare la configurazione di OpenClaw.

### Livello 3: Configura il profilo browser corretto

Per CDP remoto grezzo, punta OpenClaw all'indirizzo raggiungibile da WSL2:

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
- usa WS(S) solo quando il provider browser ti fornisce un URL diretto del socket DevTools
- testa lo stesso URL con `curl` prima di aspettarti che OpenClaw riesca

### Livello 4: Verifica separatamente il livello dell'interfaccia di controllo

Apri l'UI da Windows:

`http://127.0.0.1:18789/`

Poi verifica:

- l'origine della pagina corrisponde a ciò che `gateway.controlUi.allowedOrigins` si aspetta
- l'autenticazione con token o l'abbinamento sono configurati correttamente
- non stai facendo debug di un problema di autenticazione dell'interfaccia di controllo come se fosse un problema del browser

Pagina utile:

- [Interfaccia di controllo](/it/web/control-ui)

### Livello 5: Verifica il controllo del browser end-to-end

Da WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Risultato corretto:

- la scheda si apre in Chrome su Windows
- `openclaw browser tabs` restituisce il target
- le azioni successive (`snapshot`, `screenshot`, `navigate`) funzionano dallo stesso profilo

## Errori fuorvianti comuni

Tratta ogni messaggio come un indizio specifico del livello:

- `control-ui-insecure-auth`
  - problema di origine UI / contesto sicuro, non un problema di trasporto CDP
- `token_missing`
  - problema di configurazione dell'autenticazione
- `pairing required`
  - problema di approvazione del dispositivo
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 non riesce a raggiungere il `cdpUrl` configurato
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - l'endpoint HTTP ha risposto, ma il WebSocket DevTools non ha comunque potuto essere aperto
- override obsoleti di viewport / modalità scura / locale / offline dopo una sessione remota
  - esegui `openclaw browser stop --browser-profile remote`
  - questo chiude la sessione di controllo attiva e rilascia lo stato di emulazione Playwright/CDP senza riavviare il gateway o il browser esterno
- `gateway timeout after 1500ms`
  - spesso è ancora raggiungibilità CDP o un endpoint remoto lento/non raggiungibile
- `No Chrome tabs found for profile="user"`
  - profilo Chrome MCP locale selezionato quando non sono disponibili schede locali all'host

## Checklist di triage rapida

1. Windows: `curl http://127.0.0.1:9222/json/version` funziona?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` funziona?
3. Configurazione OpenClaw: `browser.profiles.<name>.cdpUrl` usa esattamente quell'indirizzo raggiungibile da WSL2?
4. Interfaccia di controllo: stai aprendo `http://127.0.0.1:18789/` invece di un IP LAN?
5. Stai cercando di usare `existing-session` attraverso WSL2 e Windows invece di CDP remoto grezzo?

## Indicazione pratica

La configurazione di solito è praticabile. La parte difficile è che trasporto del browser, sicurezza dell'origine dell'interfaccia di controllo e token/abbinamento possono fallire ciascuno in modo indipendente, pur apparendo simili dal lato utente.

In caso di dubbio:

- verifica prima localmente l'endpoint Chrome di Windows
- verifica poi lo stesso endpoint da WSL2
- solo dopo fai debug della configurazione OpenClaw o dell'autenticazione dell'interfaccia di controllo

## Correlati

- [Browser](/it/tools/browser)
- [Login del browser](/it/tools/browser-login)
- [Risoluzione dei problemi del browser su Linux](/it/tools/browser-linux-troubleshooting)
