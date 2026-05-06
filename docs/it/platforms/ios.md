---
read_when:
    - Associazione o riconnessione del Node iOS
    - Esecuzione dell'app iOS dal codice sorgente
    - Risoluzione dei problemi del rilevamento del Gateway o dei comandi del canvas
summary: 'App nodo iOS: connessione al Gateway, associazione, canvas e risoluzione dei problemi'
title: app iOS
x-i18n:
    generated_at: "2026-05-06T08:59:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilità: anteprima interna. L'app iOS non è ancora distribuita pubblicamente.

## Cosa fa

- Si connette a un Gateway tramite WebSocket (LAN o tailnet).
- Espone le capacità del Node: Canvas, istantanea dello schermo, acquisizione dalla fotocamera, posizione, modalità di conversazione, attivazione vocale.
- Riceve comandi `node.invoke` e segnala eventi di stato del Node.

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

2. Nell'app iOS, apri Impostazioni e scegli un Gateway rilevato (oppure abilita Host manuale e inserisci host/porta).

3. Approva la richiesta di associazione sull'host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se l'app ritenta l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Facoltativo: se il Node iOS si connette sempre da una subnet strettamente controllata, puoi
aderire all'approvazione automatica del Node al primo utilizzo con CIDR espliciti o IP esatti:

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

È disabilitata per impostazione predefinita. Si applica solo a una nuova associazione `role: node`
senza ambiti richiesti. L'associazione operatore/browser e qualsiasi modifica a ruolo, ambito, metadati o
chiave pubblica richiede comunque l'approvazione manuale.

4. Verifica la connessione:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push con supporto relay per build ufficiali

Le build iOS distribuite ufficialmente usano il relay push esterno invece di pubblicare il token APNs
grezzo sul Gateway.

Requisito lato Gateway:

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

- L'app iOS si registra con il relay usando App Attest e un JWS di transazione app StoreKit.
- Il relay restituisce un handle relay opaco più una concessione di invio con ambito di registrazione.
- L'app iOS recupera l'identità del Gateway associato e la include nella registrazione relay, quindi la registrazione con supporto relay viene delegata a quello specifico Gateway.
- L'app inoltra quella registrazione con supporto relay al Gateway associato con `push.apns.register`.
- Il Gateway usa l'handle relay memorizzato per `push.test`, riattivazioni in background e stimoli di riattivazione.
- L'URL di base del relay del Gateway deve corrispondere all'URL del relay incorporato nella build iOS ufficiale/TestFlight.
- Se in seguito l'app si connette a un Gateway diverso o a una build con un URL di base del relay diverso, aggiorna la registrazione relay invece di riutilizzare il vecchio collegamento.

Cosa **non** serve al Gateway per questo percorso:

- Nessun token relay a livello di distribuzione.
- Nessuna chiave APNs diretta per invii ufficiali/TestFlight con supporto relay.

Flusso operatore previsto:

1. Installa la build iOS ufficiale/TestFlight.
2. Imposta `gateway.push.apns.relay.baseUrl` sul Gateway.
3. Associa l'app al Gateway e lascia che completi la connessione.
4. L'app pubblica automaticamente `push.apns.register` dopo aver ottenuto un token APNs, dopo che la sessione operatore è connessa e dopo che la registrazione relay riesce.
5. Dopo di ciò, `push.test`, le riattivazioni di riconnessione e gli stimoli di riattivazione possono usare la registrazione memorizzata con supporto relay.

## Beacon di attività in background

Quando iOS riattiva l'app per una push silenziosa, un aggiornamento in background o un evento di posizione significativa, l'app
tenta una breve riconnessione del Node e poi chiama `node.event` con `event: "node.presence.alive"`.
Il Gateway lo registra come `lastSeenAtMs`/`lastSeenReason` nei metadati del Node/dispositivo associato solo
dopo che l'identità autenticata del dispositivo Node è nota.

L'app considera una riattivazione in background registrata correttamente solo quando la risposta del Gateway include
`handled: true`. Gateway più vecchi possono confermare `node.event` con `{ "ok": true }`; quella risposta è
compatibile ma non conta come aggiornamento durevole dell'ultimo avvistamento.

Nota di compatibilità:

- `OPENCLAW_APNS_RELAY_BASE_URL` funziona ancora come override temporaneo dell'ambiente per il Gateway.

## Flusso di autenticazione e fiducia

Il relay esiste per applicare due vincoli che APNs diretto sul Gateway non può fornire per
le build iOS ufficiali:

- Solo build iOS OpenClaw autentiche distribuite tramite Apple possono usare il relay ospitato.
- Un Gateway può inviare push con supporto relay solo per dispositivi iOS associati a quello specifico
  Gateway.

Passaggio per passaggio:

1. `iOS app -> gateway`
   - L'app si associa prima al Gateway tramite il normale flusso di autenticazione del Gateway.
   - Questo fornisce all'app una sessione Node autenticata più una sessione operatore autenticata.
   - La sessione operatore viene usata per chiamare `gateway.identity.get`.

2. `iOS app -> relay`
   - L'app chiama gli endpoint di registrazione del relay tramite HTTPS.
   - La registrazione include una prova App Attest più un JWS di transazione app StoreKit.
   - Il relay convalida l'ID bundle, la prova App Attest e la prova di distribuzione Apple, e richiede il
     percorso di distribuzione ufficiale/di produzione.
   - Questo è ciò che impedisce alle build locali Xcode/dev di usare il relay ospitato. Una build locale può essere
     firmata, ma non soddisfa la prova di distribuzione Apple ufficiale attesa dal relay.

3. `gateway identity delegation`
   - Prima della registrazione relay, l'app recupera l'identità del Gateway associato da
     `gateway.identity.get`.
   - L'app include quell'identità del Gateway nel payload di registrazione relay.
   - Il relay restituisce un handle relay e una concessione di invio con ambito di registrazione delegati a
     quell'identità del Gateway.

4. `gateway -> relay`
   - Il Gateway memorizza l'handle relay e la concessione di invio da `push.apns.register`.
   - Su `push.test`, riattivazioni di riconnessione e stimoli di riattivazione, il Gateway firma la richiesta di invio con la
     propria identità dispositivo.
   - Il relay verifica sia la concessione di invio memorizzata sia la firma del Gateway rispetto all'identità del
     Gateway delegata dalla registrazione.
   - Un altro Gateway non può riutilizzare quella registrazione memorizzata, anche se in qualche modo ottiene l'handle.

5. `relay -> APNs`
   - Il relay possiede le credenziali APNs di produzione e il token APNs grezzo per la build ufficiale.
   - Il Gateway non memorizza mai il token APNs grezzo per build ufficiali con supporto relay.
   - Il relay invia la push finale ad APNs per conto del Gateway associato.

Perché è stato creato questo design:

- Per tenere le credenziali APNs di produzione fuori dai Gateway degli utenti.
- Per evitare di memorizzare token APNs grezzi delle build ufficiali sul Gateway.
- Per consentire l'uso del relay ospitato solo alle build OpenClaw ufficiali/TestFlight.
- Per impedire a un Gateway di inviare push di riattivazione a dispositivi iOS appartenenti a un Gateway diverso.

Le build locali/manuali restano su APNs diretto. Se testi quelle build senza il relay, il
Gateway ha ancora bisogno di credenziali APNs dirette:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Queste sono variabili d'ambiente di runtime dell'host Gateway, non impostazioni Fastlane. `apps/ios/fastlane/.env` memorizza solo
l'autenticazione App Store Connect / TestFlight, come `ASC_KEY_ID` e `ASC_ISSUER_ID`; non configura
la consegna APNs diretta per build iOS locali.

Archiviazione consigliata sull'host Gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Non eseguire commit del file `.p8` né collocarlo sotto il checkout del repository.

## Percorsi di rilevamento

### Bonjour (LAN)

L'app iOS esplora `_openclaw-gw._tcp` su `local.` e, quando configurato, lo stesso
dominio di rilevamento DNS-SD wide-area. I Gateway sulla stessa LAN appaiono automaticamente da `local.`;
il rilevamento tra reti può usare il dominio wide-area configurato senza modificare il tipo di beacon.

### Tailnet (cross-network)

Se mDNS è bloccato, usa una zona DNS-SD unicast (scegli un dominio; esempio:
`openclaw.internal.`) e Tailscale split DNS.
Vedi [Bonjour](/it/gateway/bonjour) per l'esempio CoreDNS.

### Host/porta manuali

In Impostazioni, abilita **Host manuale** e inserisci l'host + porta del Gateway (predefinita `18789`).

## Canvas + A2UI

Il Node iOS renderizza un canvas WKWebView. Usa `node.invoke` per controllarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Note:

- L'host canvas del Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Viene servito dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).
- Il Node iOS passa automaticamente ad A2UI alla connessione quando viene pubblicizzato un URL dell'host canvas.
- Torna allo scaffold integrato con `canvas.navigate` e `{"url":""}`.

## Relazione con Computer Use

L'app iOS è una superficie Node mobile, non un backend Codex Computer Use. Codex
Computer Use e `cua-driver mcp` controllano un desktop macOS locale tramite strumenti MCP;
l'app iOS espone le capacità di iPhone tramite comandi Node OpenClaw
come `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Gli agenti possono comunque operare sull'app iOS tramite OpenClaw invocando comandi
Node, ma quelle chiamate passano attraverso il protocollo Node del Gateway e seguono i limiti
di foreground/background di iOS. Usa [Codex Computer Use](/it/plugins/codex-computer-use)
per il controllo del desktop locale e questa pagina per le capacità del Node iOS.

### Valutazione / istantanea Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Attivazione vocale + modalità di conversazione

- L'attivazione vocale e la modalità di conversazione sono disponibili in Impostazioni.
- I Node iOS con supporto alla conversazione pubblicizzano la capacità `talk` e possono dichiarare
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`;
  il Gateway consente per impostazione predefinita quei comandi push-to-talk per Node
  fidati con supporto alla conversazione.
- iOS può sospendere l'audio in background; considera le funzionalità vocali come best-effort quando l'app non è attiva.

## Errori comuni

- `NODE_BACKGROUND_UNAVAILABLE`: porta l'app iOS in primo piano (i comandi canvas/fotocamera/schermo lo richiedono).
- `A2UI_HOST_NOT_CONFIGURED`: il Gateway non ha pubblicizzato un URL dell'host canvas; controlla `canvasHost` in [Configurazione del Gateway](/it/gateway/configuration).
- Il prompt di associazione non appare mai: esegui `openclaw devices list` e approva manualmente.
- La riconnessione fallisce dopo la reinstallazione: il token di associazione nel Keychain è stato cancellato; riassocia il Node.

## Documenti correlati

- [Associazione](/it/channels/pairing)
- [Rilevamento](/it/gateway/discovery)
- [Bonjour](/it/gateway/bonjour)
