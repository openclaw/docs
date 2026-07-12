---
read_when:
    - Vuoi che un agente controlli dal tuo telefono il browser Chrome reale in cui hai effettuato l'accesso
    - Continui a visualizzare la richiesta di Chrome "Allow remote debugging?" quando non c'è nessuno alla postazione
    - Vuoi comprendere il modello di sicurezza del controllo del browser tramite l'estensione
summary: 'Estensione Chrome: consenti a OpenClaw di controllare la tua sessione Chrome autenticata senza richiesta di debug remoto'
title: Estensione di Chrome
x-i18n:
    generated_at: "2026-07-12T07:31:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Estensione Chrome

L'estensione Chrome di OpenClaw consente a un agente di controllare le **schede di Chrome in cui hai eseguito l'accesso** senza avviare un browser gestito separato e **senza** la richiesta bloccante di Chrome "Allow remote debugging?".

Questo è importante quando controlli OpenClaw da un telefono (Telegram, WhatsApp, ecc.): il [profilo `user`](/it/tools/browser#profiles-openclaw-user-chrome) si connette tramite la porta di debug remoto di Chrome, facendo comparire una finestra di consenso sul desktop che nessuno può selezionare quando sei lontano. L'estensione utilizza invece l'API `chrome.debugger`, quindi l'unica indicazione nella pagina è il banner ignorabile di Chrome "OpenClaw started debugging this browser".

Questa è la stessa architettura utilizzata dalle estensioni Chrome Claude in Chrome di Anthropic e Codex di OpenAI.

## Funzionamento

Tre componenti:

- **Servizio di controllo del browser** (Gateway o host del Node): l'API chiamata dallo strumento `browser`.
- **Relay dell'estensione** (WebSocket local loopback): un piccolo server avviato dal servizio di controllo su `127.0.0.1`. Presenta a OpenClaw un endpoint Chrome DevTools Protocol e comunica con l'estensione. Entrambe le parti si autenticano con un token locale dell'host (vedi sotto).
- **Estensione Chrome di OpenClaw** (MV3): si collega alle schede tramite `chrome.debugger`, inoltra il traffico CDP e gestisce il **gruppo di schede OpenClaw**.

OpenClaw vede e controlla esclusivamente le schede incluse nel **gruppo di schede OpenClaw**. Il gruppo costituisce il confine del consenso: trascina una scheda al suo interno per condividerla oppure trascinala fuori (o fai clic sul pulsante della barra degli strumenti) per revocare immediatamente l'accesso.

## Installazione e associazione

1. Visualizza il percorso dell'estensione decompressa:

   ```bash
   openclaw browser extension path
   ```

2. Apri `chrome://extensions`, abilita **Developer mode**, fai clic su **Load unpacked** e seleziona la directory visualizzata.

3. Visualizza la stringa di associazione:

   ```bash
   openclaw browser extension pair
   ```

4. Fai clic sull'icona OpenClaw nella barra degli strumenti e incolla la stringa di associazione nella finestra popup. L'indicatore mostra **ON** quando l'estensione si connette al relay.

Il token di associazione è un **segreto locale dell'host**, creato al primo utilizzo e archiviato in `credentials/` nella directory di stato (modalità `0600`). Ogni macchina che esegue un browser, ovvero l'host del Gateway e ogni host del Node del browser, possiede il proprio token; pertanto, nessuna credenziale deve essere trasferita tra le macchine. Per ruotarlo, elimina il file `browser-extension-relay.secret` ed esegui nuovamente l'associazione.

## Utilizzo

Seleziona il profilo integrato `chrome` in una chiamata allo strumento `browser` oppure impostalo come predefinito:

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- Per condividere una scheda, fai clic sul pulsante OpenClaw nella barra degli strumenti di quella scheda (verrà aggiunta al gruppo di schede OpenClaw) oppure trascina una scheda nel gruppo.
- L'agente può anche aprire nuove schede, che vengono aggiunte automaticamente al gruppo.
- Per revocare l'accesso, fai nuovamente clic sul pulsante, trascina la scheda fuori dal gruppo oppure chiudi il banner di debug di Chrome. L'agente perde immediatamente l'accesso alla scheda.

## Accesso remoto / tra macchine

Chrome non deve necessariamente essere eseguito sull'host del Gateway. Sono supportate tre topologie:

- **Stesso host** (Gateway e Chrome sulla stessa macchina): esegui l'associazione su tale macchina con `openclaw browser extension pair`. Il relay è accessibile solo tramite local loopback.
- **Connessione diretta a un Gateway remoto** (Chrome sul tuo portatile, Gateway su un VPS e **nient'altro sul portatile**): sul Gateway, esegui `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`. Il comando visualizza una stringa `wss://…/browser/extension#<secret>`; carica e associa l'estensione sul portatile. L'estensione si connette **direttamente al Gateway** tramite `wss://`: sul portatile non sono necessari un'installazione di OpenClaw, Node, la CLI o una porta in ingresso aperta. Questo è il percorso per l'hosting gestito.
- **Tramite l'host di un Node del browser** (Chrome su una macchina che esegue già un Node OpenClaw): esegui `pair` sul Node ed effettua l'associazione localmente; il Gateway inoltra le azioni del browser al Node tramite il collegamento autenticato esistente del Node.

Il segreto di associazione è specifico per ogni host (quello del Gateway nel caso della connessione diretta) e viene convalidato dalla route `/browser/extension` del Gateway. Per il percorso diretto, esponi il Gateway tramite TLS (`wss://`) affinché il segreto di associazione e il traffico CDP siano cifrati.
Il segreto rimane nel frammento URL della stringa di associazione e viene presentato durante l'handshake WebSocket come credenziale del sottoprotocollo, quindi i normali log di accesso del proxy non lo ricevono nell'URL della richiesta. Assicurati che qualsiasi proxy inverso mantenga l'header standard `Sec-WebSocket-Protocol`.

## Diagnostica

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` segnala il controllo del **relay dell'estensione Chrome** come non riuscito finché la finestra popup dell'estensione non mostra **Connected**.

## Modello di sicurezza

- Il relay si associa esclusivamente al local loopback; entrambi i lati WebSocket vengono autenticati con il token derivato e l'origine del lato dell'estensione viene verificata rispetto a `chrome-extension://`.
- L'associazione diretta al Gateway non accetta il token del relay nell'URL della richiesta; l'estensione inclusa lo trasmette invece nell'elenco dei sottoprotocolli WebSocket.
- L'agente può vedere e controllare esclusivamente le schede nel **gruppo di schede OpenClaw**. Le altre schede rimangono private.
- Rispetto al profilo `user` (Chrome MCP), che espone l'intero browser in cui hai eseguito l'accesso dopo l'approvazione della richiesta di debug remoto, l'estensione limita la superficie condivisa a un gruppo di schede che puoi controllare a colpo d'occhio.

Vedi anche: [Browser](/it/tools/browser) per il modello completo dei profili e per i profili gestiti `openclaw` e `user` di Chrome MCP.
