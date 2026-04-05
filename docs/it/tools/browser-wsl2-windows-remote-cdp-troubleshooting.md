---
read_when:
    - Esegui OpenClaw Gateway in WSL2 mentre Chrome si trova su Windows
    - Visualizzi errori sovrapposti del browser/Control UI tra WSL2 e Windows
    - Devi scegliere tra Chrome MCP locale sull'host e CDP remoto puro in configurazioni con host separati
summary: Risolvi i problemi di Gateway WSL2 + Chrome remoto su Windows tramite CDP a livelli
title: Risoluzione dei problemi di WSL2 + Windows + Chrome remoto tramite CDP
x-i18n:
    generated_at: "2026-04-05T14:05:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi di WSL2 + Windows + Chrome remoto tramite CDP

Questa guida copre la comune configurazione con host separati in cui:

- OpenClaw Gateway viene eseguito dentro WSL2
- Chrome viene eseguito su Windows
- il controllo del browser deve attraversare il confine tra WSL2 e Windows

Copre anche il modello di errore a livelli visto in [issue #39369](https://github.com/openclaw/openclaw/issues/39369): diversi problemi indipendenti possono comparire contemporaneamente, facendo sembrare guasto prima il livello sbagliato.

## Scegli prima la modalità browser corretta

Hai due modelli validi:

### Opzione 1: CDP remoto puro da WSL2 a Windows

Usa un profilo browser remoto che punti da WSL2 a un endpoint CDP di Chrome su Windows.

Sceglilo quando:

- il Gateway resta dentro WSL2
- Chrome viene eseguito su Windows
- hai bisogno che il controllo del browser attraversi il confine tra WSL2 e Windows

### Opzione 2: Chrome MCP locale sull'host

Usa `existing-session` / `user` solo quando il Gateway stesso viene eseguito sullo stesso host di Chrome.

Sceglilo quando:

- OpenClaw e Chrome si trovano sulla stessa macchina
- vuoi lo stato locale del browser già autenticato
- non hai bisogno del trasporto browser tra host diversi
- non hai bisogno di percorsi avanzati gestiti/solo raw-CDP come `responsebody`, esportazione PDF,
  intercettazione dei download o azioni batch

Per Gateway in WSL2 + Chrome su Windows, preferisci CDP remoto puro. Chrome MCP è locale all'host, non un ponte da WSL2 a Windows.

## Architettura funzionante

Configurazione di riferimento:

- WSL2 esegue il Gateway su `127.0.0.1:18789`
- Windows apre la Control UI in un normale browser su `http://127.0.0.1:18789/`
- Chrome su Windows espone un endpoint CDP sulla porta `9222`
- WSL2 può raggiungere quell'endpoint CDP di Windows
- OpenClaw punta un profilo browser all'indirizzo raggiungibile da WSL2

## Perché questa configurazione è confusa

Diversi errori possono sovrapporsi:

- WSL2 non riesce a raggiungere l'endpoint CDP di Windows
- la Control UI viene aperta da un'origine non sicura
- `gateway.controlUi.allowedOrigins` non corrisponde all'origine della pagina
- manca il token o il pairing
- il profilo browser punta all'indirizzo sbagliato

Per questo motivo, correggere un livello può comunque lasciare visibile un errore diverso.

## Regola critica per la Control UI

Quando l'interfaccia viene aperta da Windows, usa localhost di Windows a meno che tu non abbia una configurazione HTTPS intenzionale.

Usa:

`http://127.0.0.1:18789/`

Non usare per impostazione predefinita un IP LAN per la Control UI. HTTP semplice su un indirizzo LAN o tailnet può attivare comportamenti di origine non sicura/autenticazione del dispositivo non correlati al CDP stesso. Vedi [Control UI](/web/control-ui).

## Convalida a livelli

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

Se qui fallisce, OpenClaw non è ancora il problema.

### Livello 2: verifica che WSL2 possa raggiungere quell'endpoint Windows

Da WSL2, testa l'indirizzo esatto che intendi usare in `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Risultato corretto:

- `/json/version` restituisce JSON con metadati Browser / Protocol-Version
- `/json/list` restituisce JSON (un array vuoto va bene se non ci sono pagine aperte)

Se fallisce:

- Windows non sta ancora esponendo la porta a WSL2
- l'indirizzo è sbagliato per il lato WSL2
- mancano ancora firewall / port forwarding / proxy locale

Correggi questo prima di toccare la configurazione di OpenClaw.

### Livello 3: configura il profilo browser corretto

Per CDP remoto puro, punta OpenClaw all'indirizzo raggiungibile da WSL2:

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
- mantieni `attachOnly: true` per i browser gestiti esternamente
- `cdpUrl` può essere `http://`, `https://`, `ws://` o `wss://`
- usa HTTP(S) quando vuoi che OpenClaw rilevi `/json/version`
- usa WS(S) solo quando il provider browser ti fornisce un URL socket DevTools diretto
- testa lo stesso URL con `curl` prima di aspettarti che OpenClaw funzioni

### Livello 4: verifica separatamente il livello della Control UI

Apri l'interfaccia da Windows:

`http://127.0.0.1:18789/`

Poi verifica:

- l'origine della pagina corrisponde a quanto si aspetta `gateway.controlUi.allowedOrigins`
- l'autenticazione tramite token o il pairing sono configurati correttamente
- non stai analizzando un problema di autenticazione della Control UI come se fosse un problema del browser

Pagina utile:

- [Control UI](/web/control-ui)

### Livello 5: verifica il controllo browser end-to-end

Da WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Risultato corretto:

- la scheda si apre in Chrome su Windows
- `openclaw browser tabs` restituisce la destinazione
- le azioni successive (`snapshot`, `screenshot`, `navigate`) funzionano dallo stesso profilo

## Errori comuni ma fuorvianti

Tratta ogni messaggio come un indizio specifico del livello:

- `control-ui-insecure-auth`
  - problema di origine dell'interfaccia / contesto sicuro, non di trasporto CDP
- `token_missing`
  - problema di configurazione dell'autenticazione
- `pairing required`
  - problema di approvazione del dispositivo
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 non riesce a raggiungere il `cdpUrl` configurato
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - l'endpoint HTTP ha risposto, ma il WebSocket DevTools non è comunque stato aperto
- override obsoleti di viewport / dark mode / locale / offline dopo una sessione remota
  - esegui `openclaw browser stop --browser-profile remote`
  - questo chiude la sessione di controllo attiva e rilascia lo stato di emulazione Playwright/CDP senza riavviare il gateway o il browser esterno
- `gateway timeout after 1500ms`
  - spesso è ancora un problema di raggiungibilità CDP o un endpoint remoto lento/non raggiungibile
- `No Chrome tabs found for profile="user"`
  - è stato selezionato un profilo Chrome MCP locale dove non sono disponibili schede locali all'host

## Checklist rapida di triage

1. Windows: `curl http://127.0.0.1:9222/json/version` funziona?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` funziona?
3. Configurazione OpenClaw: `browser.profiles.<name>.cdpUrl` usa esattamente quell'indirizzo raggiungibile da WSL2?
4. Control UI: stai aprendo `http://127.0.0.1:18789/` invece di un IP LAN?
5. Stai cercando di usare `existing-session` tra WSL2 e Windows invece di CDP remoto puro?

## Conclusione pratica

La configurazione di solito è praticabile. La parte difficile è che il trasporto del browser, la sicurezza dell'origine della Control UI e token/pairing possono tutti fallire in modo indipendente pur sembrando simili dal lato dell'utente.

In caso di dubbio:

- verifica prima localmente l'endpoint Chrome su Windows
- verifica poi lo stesso endpoint da WSL2
- solo dopo esegui il debug della configurazione OpenClaw o dell'autenticazione della Control UI
