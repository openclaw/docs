---
read_when:
    - Associazione o riconnessione del nodo iOS
    - Eseguire l'app iOS dal sorgente
    - Debug del rilevamento del Gateway o dei comandi canvas
summary: 'App nodo iOS: connessione al Gateway, abbinamento, canvas e risoluzione dei problemi'
title: app iOS
x-i18n:
    generated_at: "2026-07-04T18:04:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilità: le build dell'app iPhone sono distribuite tramite i canali Apple quando abilitate per una release. Le build di sviluppo locali possono anche essere eseguite dal codice sorgente.

## Cosa fa

- Si connette a un Gateway tramite WebSocket (LAN o tailnet).
- Espone le funzionalità del nodo: Canvas, istantanea dello schermo, acquisizione dalla fotocamera, posizione, modalità Talk, Voice wake.
- Riceve comandi `node.invoke` e segnala eventi di stato del nodo.

## Requisiti

- Gateway in esecuzione su un altro dispositivo (macOS, Linux o Windows tramite WSL2).
- Percorso di rete:
  - Stessa LAN tramite Bonjour, **oppure**
  - Tailnet tramite DNS-SD unicast (dominio di esempio: `openclaw.internal.`), **oppure**
  - Host/porta manuali (fallback).

## Avvio rapido (abbinamento + connessione)

1. Avvia un Gateway autenticato con una route raggiungibile dal telefono. Tailscale
   Serve è il percorso remoto consigliato:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Per una configurazione attendibile sulla stessa LAN, usa invece un `gateway.bind: "lan"`
autenticato. Il bind loopback predefinito non è raggiungibile da un telefono. Se il
Gateway non è ancora stato configurato, esegui prima `openclaw onboard` in modo che la
creazione del codice di configurazione abbia un percorso di autenticazione con token o password.

2. Apri la [UI di controllo](/it/web/control-ui), seleziona **Nodi** e fai clic su
   **Abbina dispositivo mobile** nella scheda **Dispositivi**.

3. Nell'app iOS, apri **Impostazioni** → **Gateway**, scansiona il codice QR (o incolla
   il codice di configurazione) e connettiti.

4. L'app ufficiale si connette automaticamente. Se **Dispositivi** mostra una richiesta
   in sospeso, esaminane il ruolo e gli ambiti prima di approvarla.

Il pulsante della UI di controllo richiede una sessione già abbinata con `operator.admin`.
Come fallback da terminale, scegli un gateway rilevato nell'app iOS (o abilita
Host manuale e inserisci host/porta), quindi approva la richiesta sull'host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se l'app ritenta l'abbinamento con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica),
la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Facoltativo: se il nodo iOS si connette sempre da una subnet strettamente controllata, puoi
attivare l'approvazione automatica del nodo al primo utilizzo con CIDR espliciti o IP esatti:

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

Questa opzione è disabilitata per impostazione predefinita. Si applica solo al nuovo abbinamento `role: node`
senza ambiti richiesti. L'abbinamento operatore/browser e qualsiasi modifica di ruolo, ambito, metadati o
chiave pubblica richiedono comunque l'approvazione manuale.

5. Verifica la connessione:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push supportate da relay per le build ufficiali

Le build iOS ufficiali distribuite usano il relay push esterno invece di pubblicare il token APNs grezzo
sul gateway.

Le build ufficiali App Store dalla lane di release pubblica usano il relay ospitato su `https://ios-push-relay.openclaw.ai`.

Le distribuzioni di relay personalizzate richiedono un percorso di build/deployment iOS deliberatamente separato il cui URL del relay corrisponda all'URL del relay del gateway. La lane di release pubblica App Store non accetta override dell'URL del relay personalizzati. Se usi una build con relay personalizzato, imposta l'URL del relay del gateway corrispondente:

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

- L'app iOS si registra con il relay usando App Attest e un JWS della transazione app StoreKit.
- Il relay restituisce un handle di relay opaco più una concessione di invio con ambito di registrazione.
- L'app iOS recupera l'identità del gateway abbinato e la include nella registrazione del relay, quindi la registrazione supportata da relay viene delegata a quel gateway specifico.
- L'app inoltra quella registrazione supportata da relay al gateway abbinato con `push.apns.register`.
- Il gateway usa quell'handle di relay archiviato per `push.test`, riattivazioni in background e richiami di wake.
- Gli URL di relay gateway personalizzati devono corrispondere all'URL del relay incorporato nella build iOS.
- Se in seguito l'app si connette a un gateway diverso o a una build con un URL di base del relay diverso, aggiorna la registrazione del relay invece di riutilizzare il vecchio binding.

Cosa **non** serve al gateway per questo percorso:

- Nessun token di relay a livello di deployment.
- Nessuna chiave APNs diretta per gli invii supportati da relay dell'App Store ufficiale.

Flusso previsto per l'operatore:

1. Installa l'app iOS ufficiale.
2. Facoltativo: imposta `gateway.push.apns.relay.baseUrl` sul gateway solo quando usi una build con relay personalizzato deliberatamente separata.
3. Abbina l'app al gateway e lascia che completi la connessione.
4. L'app pubblica automaticamente `push.apns.register` dopo avere un token APNs, la sessione operatore connessa e la registrazione del relay riuscita.
5. Dopodiché, `push.test`, le riattivazioni di riconnessione e i richiami di wake possono usare la registrazione archiviata supportata da relay.

## Beacon di attività in background

Quando iOS riattiva l'app per una push silenziosa, un aggiornamento in background o un evento di posizione significativa, l'app
tenta una breve riconnessione del nodo e poi chiama `node.event` con `event: "node.presence.alive"`.
Il gateway lo registra come `lastSeenAtMs`/`lastSeenReason` nei metadati del nodo/dispositivo abbinato solo
dopo che l'identità autenticata del dispositivo nodo è nota.

L'app considera una riattivazione in background registrata correttamente solo quando la risposta del gateway include
`handled: true`. I gateway più vecchi possono confermare `node.event` con `{ "ok": true }`; quella risposta è
compatibile ma non conta come aggiornamento duraturo dell'ultimo rilevamento.

Nota di compatibilità:

- `OPENCLAW_APNS_RELAY_BASE_URL` funziona ancora come override env temporaneo per il gateway.
- La lane di release pubblica App Store rifiuta `OPENCLAW_PUSH_RELAY_BASE_URL` per le build iOS.

## Flusso di autenticazione e fiducia

Il relay esiste per applicare due vincoli che APNs diretto sul gateway non può fornire per
le build iOS ufficiali:

- Solo build iOS OpenClaw genuine distribuite tramite Apple possono usare il relay ospitato.
- Un gateway può inviare push supportate da relay solo per dispositivi iOS abbinati a quello specifico
  gateway.

Passaggio per passaggio:

1. `iOS app -> gateway`
   - L'app si abbina prima al gateway tramite il normale flusso di autenticazione del Gateway.
   - Questo fornisce all'app una sessione nodo autenticata più una sessione operatore autenticata.
   - La sessione operatore viene usata per chiamare `gateway.identity.get`.

2. `iOS app -> relay`
   - L'app chiama gli endpoint di registrazione del relay tramite HTTPS.
   - La registrazione include la prova App Attest più un JWS della transazione app StoreKit.
   - Il relay convalida bundle ID, prova App Attest e prova di distribuzione Apple, e richiede il
     percorso di distribuzione ufficiale/di produzione.
   - Questo è ciò che impedisce alle build locali Xcode/dev di usare il relay ospitato. Una build locale può essere
     firmata, ma non soddisfa la prova di distribuzione Apple ufficiale attesa dal relay.

3. `gateway identity delegation`
   - Prima della registrazione del relay, l'app recupera l'identità del gateway abbinato da
     `gateway.identity.get`.
   - L'app include quell'identità del gateway nel payload di registrazione del relay.
   - Il relay restituisce un handle di relay e una concessione di invio con ambito di registrazione delegati a
     quell'identità del gateway.

4. `gateway -> relay`
   - Il gateway archivia l'handle di relay e la concessione di invio da `push.apns.register`.
   - Su `push.test`, riattivazioni di riconnessione e richiami di wake, il gateway firma la richiesta di invio con la
     propria identità dispositivo.
   - Il relay verifica sia la concessione di invio archiviata sia la firma del gateway rispetto all'identità del
     gateway delegata dalla registrazione.
   - Un altro gateway non può riutilizzare quella registrazione archiviata, anche se in qualche modo ottiene l'handle.

5. `relay -> APNs`
   - Il relay possiede le credenziali APNs di produzione e il token APNs grezzo per la build ufficiale.
   - Il gateway non archivia mai il token APNs grezzo per le build ufficiali supportate da relay.
   - Il relay invia la push finale ad APNs per conto del gateway abbinato.

Perché è stato creato questo design:

- Per tenere le credenziali APNs di produzione fuori dai gateway utente.
- Per evitare di archiviare token APNs grezzi delle build ufficiali sul gateway.
- Per consentire l'uso del relay ospitato solo alle build iOS OpenClaw ufficiali.
- Per impedire a un gateway di inviare push di wake a dispositivi iOS appartenenti a un gateway diverso.

Le build locali/manuali restano su APNs diretto. Se testi queste build senza il relay, il
gateway necessita comunque di credenziali APNs dirette:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Queste sono variabili env di runtime dell'host gateway, non impostazioni Fastlane. `apps/ios/fastlane/.env` archivia solo
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

Non commettere il file `.p8` né posizionarlo nel checkout del repo.

## Percorsi di rilevamento

### Bonjour (LAN)

L'app iOS esplora `_openclaw-gw._tcp` su `local.` e, quando configurato, lo stesso
dominio di rilevamento DNS-SD wide-area. I gateway sulla stessa LAN vengono visualizzati automaticamente da `local.`;
il rilevamento cross-network può usare il dominio wide-area configurato senza cambiare il tipo di beacon.

### Tailnet (cross-network)

Se mDNS è bloccato, usa una zona DNS-SD unicast (scegli un dominio; esempio:
`openclaw.internal.`) e lo split DNS di Tailscale.
Consulta [Bonjour](/it/gateway/bonjour) per l'esempio CoreDNS.

### Host/porta manuali

In Impostazioni, abilita **Host manuale** e inserisci host + porta del gateway (predefinita `18789`).

## Canvas + A2UI

Il nodo iOS renderizza un canvas WKWebView. Usa `node.invoke` per pilotarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Note:

- L'host canvas del Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Viene servito dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).
- Il nodo iOS mantiene lo scaffold integrato come vista predefinita connessa. `canvas.a2ui.push` e `canvas.a2ui.reset` usano la pagina A2UI in bundle di proprietà dell'app.
- Le pagine A2UI del Gateway remoto sono di sola renderizzazione su iOS; le azioni dei pulsanti A2UI nativi sono accettate solo dalle pagine in bundle di proprietà dell'app.
- Torna allo scaffold integrato con `canvas.navigate` e `{"url":""}`.

## Relazione con Computer Use

L'app iOS è una superficie nodo mobile, non un backend Codex Computer Use. Codex
Computer Use e `cua-driver mcp` controllano un desktop macOS locale tramite strumenti MCP;
l'app iOS espone funzionalità iPhone tramite comandi nodo OpenClaw
come `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Gli agenti possono comunque operare l'app iOS tramite OpenClaw invocando comandi
nodo, ma quelle chiamate passano attraverso il protocollo nodo del gateway e seguono i limiti
foreground/background di iOS. Usa [Codex Computer Use](/it/plugins/codex-computer-use)
per il controllo del desktop locale e questa pagina per le funzionalità nodo iOS.

### Eval / istantanea Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + modalità Talk

- Il risveglio vocale e la modalità conversazione sono disponibili nelle Impostazioni.
- La conversazione in tempo reale di OpenAI usa WebRTC gestito dal client quando `talk.realtime.transport` è `webrtc`; una configurazione esplicita `gateway-relay` resta gestita dal Gateway. Vedi [Modalità conversazione](/it/nodes/talk).
- I nodi iOS compatibili con la conversazione annunciano la capability `talk` e possono dichiarare
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`;
  il Gateway consente per impostazione predefinita questi comandi push-to-talk per i nodi
  compatibili con la conversazione attendibili.
- iOS può sospendere l'audio in background; considera le funzionalità vocali come best-effort quando l'app non è attiva.

## Errori comuni

- `NODE_BACKGROUND_UNAVAILABLE`: porta l'app iOS in primo piano (i comandi canvas/camera/schermo lo richiedono).
- `A2UI_HOST_UNAVAILABLE`: la pagina A2UI inclusa non era raggiungibile nella WebView dell'app; mantieni l'app in primo piano nella scheda Schermo e riprova.
- Il prompt di abbinamento non appare mai: esegui `openclaw devices list` e approva manualmente.
- La riconnessione non riesce dopo la reinstallazione: il token di abbinamento del Keychain è stato cancellato; abbina nuovamente il nodo.

## Documentazione correlata

- [Abbinamento](/it/channels/pairing)
- [Rilevamento](/it/gateway/discovery)
- [Bonjour](/it/gateway/bonjour)
