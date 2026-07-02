---
read_when:
    - Associazione o riconnessione del nodo iOS
    - Eseguire l'app iOS dal sorgente
    - Debug del rilevamento del gateway o dei comandi canvas
summary: 'App nodo iOS: connessione al Gateway, abbinamento, canvas e risoluzione dei problemi'
title: App iOS
x-i18n:
    generated_at: "2026-07-02T22:37:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilità: le build dell'app per iPhone vengono distribuite tramite i canali Apple quando abilitate per una release. Le build di sviluppo locali possono anche essere eseguite dal codice sorgente.

## Cosa fa

- Si connette a un Gateway tramite WebSocket (LAN o tailnet).
- Espone le capacità del nodo: Canvas, istantanea dello schermo, acquisizione dalla fotocamera, posizione, modalità Talk, riattivazione vocale.
- Riceve comandi `node.invoke` e segnala eventi di stato del nodo.

## Requisiti

- Gateway in esecuzione su un altro dispositivo (macOS, Linux o Windows tramite WSL2).
- Percorso di rete:
  - Stessa LAN tramite Bonjour, **oppure**
  - Tailnet tramite DNS-SD unicast (dominio di esempio: `openclaw.internal.`), **oppure**
  - Host/porta manuali (fallback).

## Avvio rapido (associa + connetti)

1. Avvia il Gateway:

```bash
openclaw gateway --port 18789
```

2. Nell'app iOS, apri Impostazioni e scegli un gateway rilevato (oppure abilita Host manuale e inserisci host/porta).

3. Approva la richiesta di associazione sull'host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se l'app ritenta l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica),
la richiesta precedente in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Facoltativo: se il nodo iOS si connette sempre da una subnet strettamente controllata, puoi
abilitare l'approvazione automatica del nodo al primo utilizzo con CIDR espliciti o IP esatti:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Questa opzione è disabilitata per impostazione predefinita. Si applica solo alle nuove associazioni `role: node` senza
ambiti richiesti. L'associazione di operatori/browser e qualsiasi modifica di ruolo, ambito, metadati o
chiave pubblica richiede comunque l'approvazione manuale.

4. Verifica la connessione:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push supportati da relay per le build ufficiali

Le build iOS ufficiali distribuite usano il relay push esterno invece di pubblicare il token APNs grezzo
sul gateway.

Le build ufficiali dell'App Store dal canale di release pubblico usano il relay ospitato su `https://ios-push-relay.openclaw.ai`.

Le distribuzioni di relay personalizzate richiedono un percorso di build/distribuzione iOS deliberatamente separato il cui URL del relay corrisponda all'URL del relay del gateway. Il canale di release pubblico dell'App Store non accetta override personalizzati dell'URL del relay. Se usi una build con relay personalizzato, imposta l'URL del relay del gateway corrispondente:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Come funziona il flusso:

- L'app iOS si registra presso il relay usando App Attest e un JWS di transazione app StoreKit.
- Il relay restituisce un handle relay opaco più una concessione di invio limitata alla registrazione.
- L'app iOS recupera l'identità del gateway associato e la include nella registrazione al relay, quindi la registrazione supportata dal relay viene delegata a quello specifico gateway.
- L'app inoltra quella registrazione supportata dal relay al gateway associato con `push.apns.register`.
- Il gateway usa quell'handle relay archiviato per `push.test`, riattivazioni in background e solleciti di riattivazione.
- Gli URL relay personalizzati del gateway devono corrispondere all'URL del relay incorporato nella build iOS.
- Se in seguito l'app si connette a un gateway diverso o a una build con un URL base del relay diverso, aggiorna la registrazione al relay invece di riutilizzare il vecchio binding.

Cosa **non** serve al gateway per questo percorso:

- Nessun token relay a livello di distribuzione.
- Nessuna chiave APNs diretta per gli invii ufficiali supportati da relay tramite App Store.

Flusso previsto per l'operatore:

1. Installa l'app iOS ufficiale.
2. Facoltativo: imposta `gateway.push.apns.relay.baseUrl` sul gateway solo quando usi una build con relay personalizzato deliberatamente separata.
3. Associa l'app al gateway e lascia che completi la connessione.
4. L'app pubblica automaticamente `push.apns.register` dopo che ha un token APNs, la sessione operatore è connessa e la registrazione al relay riesce.
5. Dopo di ciò, `push.test`, le riattivazioni per riconnessione e i solleciti di riattivazione possono usare la registrazione archiviata supportata da relay.

## Beacon di attività in background

Quando iOS riattiva l'app per una push silenziosa, un aggiornamento in background o un evento di posizione significativa, l'app
tenta una breve riconnessione del nodo e poi chiama `node.event` con `event: "node.presence.alive"`.
Il gateway lo registra come `lastSeenAtMs`/`lastSeenReason` nei metadati del nodo/dispositivo associato solo
dopo che l'identità autenticata del dispositivo nodo è nota.

L'app considera una riattivazione in background registrata con successo solo quando la risposta del gateway include
`handled: true`. I gateway più vecchi possono riconoscere `node.event` con `{ "ok": true }`; quella risposta è
compatibile ma non conta come aggiornamento duraturo dell'ultimo accesso.

Nota di compatibilità:

- `OPENCLAW_APNS_RELAY_BASE_URL` funziona ancora come override env temporaneo per il gateway.
- Il canale di release pubblico dell'App Store rifiuta `OPENCLAW_PUSH_RELAY_BASE_URL` per le build iOS.

## Flusso di autenticazione e attendibilità

Il relay esiste per imporre due vincoli che APNs diretto sul gateway non può fornire per
le build iOS ufficiali:

- Solo le build iOS autentiche di OpenClaw distribuite tramite Apple possono usare il relay ospitato.
- Un gateway può inviare push supportate da relay solo per dispositivi iOS associati a quello specifico
  gateway.

Passaggio per passaggio:

1. `iOS app -> gateway`
   - L'app si associa prima al gateway tramite il normale flusso di autenticazione del Gateway.
   - Questo fornisce all'app una sessione nodo autenticata più una sessione operatore autenticata.
   - La sessione operatore viene usata per chiamare `gateway.identity.get`.

2. `iOS app -> relay`
   - L'app chiama gli endpoint di registrazione del relay tramite HTTPS.
   - La registrazione include la prova App Attest più un JWS di transazione app StoreKit.
   - Il relay convalida il bundle ID, la prova App Attest e la prova di distribuzione Apple, e richiede il
     percorso di distribuzione ufficiale/di produzione.
   - Questo è ciò che impedisce alle build locali Xcode/dev di usare il relay ospitato. Una build locale può essere
     firmata, ma non soddisfa la prova di distribuzione Apple ufficiale attesa dal relay.

3. `delega dell'identità del gateway`
   - Prima della registrazione al relay, l'app recupera l'identità del gateway associato da
     `gateway.identity.get`.
   - L'app include quell'identità del gateway nel payload di registrazione al relay.
   - Il relay restituisce un handle relay e una concessione di invio limitata alla registrazione delegati a
     quell'identità del gateway.

4. `gateway -> relay`
   - Il gateway archivia l'handle relay e la concessione di invio da `push.apns.register`.
   - Su `push.test`, riattivazioni per riconnessione e solleciti di riattivazione, il gateway firma la richiesta di invio con la propria
     identità dispositivo.
   - Il relay verifica sia la concessione di invio archiviata sia la firma del gateway rispetto all'identità del gateway
     delegata dalla registrazione.
   - Un altro gateway non può riutilizzare quella registrazione archiviata, anche se in qualche modo ottiene l'handle.

5. `relay -> APNs`
   - Il relay possiede le credenziali APNs di produzione e il token APNs grezzo per la build ufficiale.
   - Il gateway non archivia mai il token APNs grezzo per le build ufficiali supportate da relay.
   - Il relay invia la push finale ad APNs per conto del gateway associato.

Perché questo design è stato creato:

- Per tenere le credenziali APNs di produzione fuori dai gateway degli utenti.
- Per evitare di archiviare token APNs grezzi delle build ufficiali sul gateway.
- Per consentire l'uso del relay ospitato solo alle build iOS ufficiali di OpenClaw.
- Per impedire a un gateway di inviare push di riattivazione a dispositivi iOS posseduti da un gateway diverso.

Le build locali/manuali restano su APNs diretto. Se testi quelle build senza il relay, il
gateway ha comunque bisogno di credenziali APNs dirette:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Queste sono variabili env runtime dell'host gateway, non impostazioni Fastlane. `apps/ios/fastlane/.env` archivia solo
l'autenticazione App Store Connect come `APP_STORE_CONNECT_KEY_ID` e
`APP_STORE_CONNECT_ISSUER_ID`; non configura la consegna APNs diretta per le build iOS locali.

Archiviazione consigliata sull'host gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Non fare commit del file `.p8` né posizionarlo nel checkout del repo.

## Percorsi di rilevamento

### Bonjour (LAN)

L'app iOS esplora `_openclaw-gw._tcp` su `local.` e, quando configurato, lo stesso
dominio di rilevamento DNS-SD wide-area. I gateway sulla stessa LAN appaiono automaticamente da `local.`;
il rilevamento cross-network può usare il dominio wide-area configurato senza cambiare il tipo di beacon.

### Tailnet (cross-network)

Se mDNS è bloccato, usa una zona DNS-SD unicast (scegli un dominio; esempio:
`openclaw.internal.`) e DNS split Tailscale.
Vedi [Bonjour](/it/gateway/bonjour) per l'esempio CoreDNS.

### Host/porta manuali

In Impostazioni, abilita **Host manuale** e inserisci host + porta del gateway (predefinita `18789`).

## Canvas + A2UI

Il nodo iOS renderizza un canvas WKWebView. Usa `node.invoke` per controllarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Note:

- L'host canvas del Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Viene servito dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).
- Il nodo iOS mantiene lo scaffold integrato come vista predefinita connessa. `canvas.a2ui.push` e `canvas.a2ui.reset` usano la pagina A2UI in bundle posseduta dall'app.
- Le pagine A2UI remote del Gateway sono solo renderizzazione su iOS; le azioni dei pulsanti A2UI native sono accettate solo dalle pagine in bundle possedute dall'app.
- Torna allo scaffold integrato con `canvas.navigate` e `{"url":""}`.

## Relazione con Computer Use

L'app iOS è una superficie di nodo mobile, non un backend Codex Computer Use. Codex
Computer Use e `cua-driver mcp` controllano un desktop macOS locale tramite strumenti MCP;
l'app iOS espone capacità iPhone tramite comandi nodo OpenClaw
come `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Gli agenti possono comunque usare l'app iOS tramite OpenClaw invocando comandi
nodo, ma quelle chiamate passano attraverso il protocollo nodo del gateway e seguono i limiti iOS
di primo piano/background. Usa [Codex Computer Use](/it/plugins/codex-computer-use)
per il controllo del desktop locale e questa pagina per le capacità del nodo iOS.

### Eval / istantanea Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Riattivazione vocale + modalità Talk

- Riattivazione vocale e modalità Talk sono disponibili in Impostazioni.
- OpenAI realtime Talk usa WebRTC posseduto dal client quando `talk.realtime.transport` è `webrtc`; una configurazione esplicita `gateway-relay` resta posseduta dal Gateway. Vedi [Modalità Talk](/it/nodes/talk).
- I nodi iOS con capacità Talk pubblicizzano la capacità `talk` e possono dichiarare
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`;
  il Gateway consente per impostazione predefinita quei comandi push-to-talk per nodi attendibili
  con capacità Talk.
- iOS può sospendere l'audio in background; considera le funzionalità vocali come best-effort quando l'app non è attiva.

## Errori comuni

- `NODE_BACKGROUND_UNAVAILABLE`: porta l'app iOS in primo piano (i comandi canvas/fotocamera/schermo lo richiedono).
- `A2UI_HOST_UNAVAILABLE`: la pagina A2UI in bundle non era raggiungibile nella WebView dell'app; mantieni l'app in primo piano nella scheda Schermo e riprova.
- Il prompt di associazione non appare mai: esegui `openclaw devices list` e approva manualmente.
- La riconnessione fallisce dopo la reinstallazione: il token di associazione del Portachiavi è stato cancellato; associa di nuovo il nodo.

## Documenti correlati

- [Abbinamento](/it/channels/pairing)
- [Rilevamento](/it/gateway/discovery)
- [Bonjour](/it/gateway/bonjour)
