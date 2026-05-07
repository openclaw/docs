---
read_when:
    - Associazione o riconnessione del Node iOS
    - Esecuzione dell'app iOS dal sorgente
    - Risoluzione dei problemi del rilevamento del Gateway o dei comandi canvas
summary: 'App nodo iOS: connessione al Gateway, abbinamento, area di disegno e risoluzione dei problemi'
title: app iOS
x-i18n:
    generated_at: "2026-05-07T13:21:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilità: anteprima interna. L'app iOS non è ancora distribuita pubblicamente.

## Cosa fa

- Si connette a un Gateway tramite WebSocket (LAN o tailnet).
- Espone le capacità del Node: Canvas, istantanea dello schermo, acquisizione dalla fotocamera, posizione, modalità Talk, attivazione vocale.
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

2. Nell'app iOS, apri Impostazioni e scegli un gateway rilevato (oppure abilita Host manuale e inserisci host/porta).

3. Approva la richiesta di associazione sull'host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se l'app riprova l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Opzionale: se il Node iOS si connette sempre da una subnet strettamente controllata, puoi
abilitare l'approvazione automatica del Node al primo utilizzo con CIDR espliciti o IP esatti:

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

Questa opzione è disabilitata per impostazione predefinita. Si applica solo a una nuova associazione `role: node` senza
ambiti richiesti. L'associazione operatore/browser e qualsiasi modifica a ruolo, ambito, metadati o
chiave pubblica richiede comunque l'approvazione manuale.

4. Verifica la connessione:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push basato su relay per le build ufficiali

Le build iOS distribuite ufficialmente usano il relay push esterno invece di pubblicare il token APNs
grezzo sul gateway.

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
- L'app iOS recupera l'identità del gateway associato e la include nella registrazione relay, così la registrazione basata su relay viene delegata a quello specifico gateway.
- L'app inoltra quella registrazione basata su relay al gateway associato con `push.apns.register`.
- Il gateway usa quell'handle relay memorizzato per `push.test`, riattivazioni in background e solleciti di riattivazione.
- L'URL base del relay del gateway deve corrispondere all'URL del relay incorporato nella build iOS ufficiale/TestFlight.
- Se in seguito l'app si connette a un gateway diverso o a una build con un URL base del relay diverso, aggiorna la registrazione relay invece di riutilizzare il vecchio binding.

Cosa il gateway **non** richiede per questo percorso:

- Nessun token relay a livello di distribuzione.
- Nessuna chiave APNs diretta per gli invii ufficiali/TestFlight basati su relay.

Flusso operatore previsto:

1. Installa la build iOS ufficiale/TestFlight.
2. Imposta `gateway.push.apns.relay.baseUrl` sul gateway.
3. Associa l'app al gateway e lascia che completi la connessione.
4. L'app pubblica automaticamente `push.apns.register` dopo avere ottenuto un token APNs, dopo che la sessione operatore è connessa e dopo che la registrazione relay riesce.
5. Dopodiché, `push.test`, le riattivazioni di riconnessione e i solleciti di riattivazione possono usare la registrazione basata su relay memorizzata.

## Beacon di attività in background

Quando iOS riattiva l'app per un push silenzioso, un aggiornamento in background o un evento di posizione significativo, l'app
tenta una breve riconnessione del Node e poi chiama `node.event` con `event: "node.presence.alive"`.
Il gateway lo registra come `lastSeenAtMs`/`lastSeenReason` sui metadati del Node/dispositivo associato solo
dopo che l'identità autenticata del dispositivo Node è nota.

L'app considera una riattivazione in background registrata correttamente solo quando la risposta del gateway include
`handled: true`. I gateway meno recenti possono confermare `node.event` con `{ "ok": true }`; quella risposta è
compatibile ma non conta come aggiornamento persistente dell'ultimo avvistamento.

Nota di compatibilità:

- `OPENCLAW_APNS_RELAY_BASE_URL` funziona ancora come override temporaneo tramite env per il gateway.

## Autenticazione e flusso di fiducia

Il relay esiste per applicare due vincoli che APNs diretto sul gateway non può garantire per
le build iOS ufficiali:

- Solo le build iOS OpenClaw autentiche distribuite tramite Apple possono usare il relay ospitato.
- Un gateway può inviare push basati su relay solo per dispositivi iOS associati a quello specifico
  gateway.

Passaggio per passaggio:

1. `iOS app -> gateway`
   - L'app prima si associa al gateway tramite il normale flusso di autenticazione del Gateway.
   - Questo fornisce all'app una sessione Node autenticata più una sessione operatore autenticata.
   - La sessione operatore viene usata per chiamare `gateway.identity.get`.

2. `iOS app -> relay`
   - L'app chiama gli endpoint di registrazione del relay tramite HTTPS.
   - La registrazione include una prova App Attest più un JWS di transazione app StoreKit.
   - Il relay convalida il bundle ID, la prova App Attest e la prova di distribuzione Apple, e richiede il
     percorso di distribuzione ufficiale/di produzione.
   - Questo è ciò che impedisce alle build locali Xcode/dev di usare il relay ospitato. Una build locale può essere
     firmata, ma non soddisfa la prova di distribuzione ufficiale Apple prevista dal relay.

3. `gateway identity delegation`
   - Prima della registrazione relay, l'app recupera l'identità del gateway associato da
     `gateway.identity.get`.
   - L'app include quell'identità del gateway nel payload di registrazione relay.
   - Il relay restituisce un handle relay e una concessione di invio con ambito di registrazione delegati a
     quell'identità del gateway.

4. `gateway -> relay`
   - Il gateway memorizza l'handle relay e la concessione di invio da `push.apns.register`.
   - Su `push.test`, riattivazioni di riconnessione e solleciti di riattivazione, il gateway firma la richiesta di invio con la
     propria identità dispositivo.
   - Il relay verifica sia la concessione di invio memorizzata sia la firma del gateway rispetto all'identità
     del gateway delegata dalla registrazione.
   - Un altro gateway non può riutilizzare quella registrazione memorizzata, anche se in qualche modo ottiene l'handle.

5. `relay -> APNs`
   - Il relay possiede le credenziali APNs di produzione e il token APNs grezzo per la build ufficiale.
   - Il gateway non memorizza mai il token APNs grezzo per le build ufficiali basate su relay.
   - Il relay invia il push finale ad APNs per conto del gateway associato.

Perché è stato creato questo design:

- Per tenere le credenziali APNs di produzione fuori dai gateway degli utenti.
- Per evitare di memorizzare token APNs grezzi delle build ufficiali sul gateway.
- Per consentire l'uso del relay ospitato solo alle build ufficiali/TestFlight di OpenClaw.
- Per impedire a un gateway di inviare push di riattivazione a dispositivi iOS appartenenti a un gateway diverso.

Le build locali/manuali restano su APNs diretto. Se stai testando quelle build senza il relay, il
gateway richiede ancora credenziali APNs dirette:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Queste sono variabili env runtime dell'host gateway, non impostazioni Fastlane. `apps/ios/fastlane/.env` memorizza solo
l'autenticazione App Store Connect / TestFlight come `ASC_KEY_ID` e `ASC_ISSUER_ID`; non configura
la consegna APNs diretta per le build iOS locali.

Archiviazione consigliata sull'host gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Non eseguire il commit del file `.p8` né collocarlo sotto il checkout del repo.

## Percorsi di rilevamento

### Bonjour (LAN)

L'app iOS cerca `_openclaw-gw._tcp` su `local.` e, quando configurato, lo stesso
dominio di rilevamento DNS-SD geografico. I gateway sulla stessa LAN compaiono automaticamente da `local.`;
il rilevamento tra reti può usare il dominio geografico configurato senza modificare il tipo di beacon.

### Tailnet (tra reti)

Se mDNS è bloccato, usa una zona DNS-SD unicast (scegli un dominio; esempio:
`openclaw.internal.`) e split DNS Tailscale.
Consulta [Bonjour](/it/gateway/bonjour) per l'esempio CoreDNS.

### Host/porta manuali

In Impostazioni, abilita **Host manuale** e inserisci host + porta del gateway (predefinita `18789`).

## Canvas + A2UI

Il Node iOS renderizza un canvas WKWebView. Usa `node.invoke` per controllarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Note:

- L'host canvas del Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Viene servito dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).
- Il Node iOS naviga automaticamente ad A2UI alla connessione quando viene pubblicizzato un URL host canvas.
- Torna allo scaffold integrato con `canvas.navigate` e `{"url":""}`.

## Relazione con Computer Use

L'app iOS è una superficie Node mobile, non un backend Codex Computer Use. Codex
Computer Use e `cua-driver mcp` controllano un desktop macOS locale tramite strumenti MCP;
l'app iOS espone le capacità dell'iPhone tramite comandi Node OpenClaw
come `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Gli agenti possono comunque operare sull'app iOS tramite OpenClaw invocando comandi
Node, ma quelle chiamate passano attraverso il protocollo Node del gateway e seguono i limiti di iOS
in primo piano/background. Usa [Codex Computer Use](/it/plugins/codex-computer-use)
per il controllo del desktop locale e questa pagina per le capacità del Node iOS.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Attivazione vocale + modalità Talk

- L'attivazione vocale e la modalità Talk sono disponibili in Impostazioni.
- I Node iOS compatibili con Talk pubblicizzano la capacità `talk` e possono dichiarare
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`;
  il Gateway consente questi comandi push-to-talk per impostazione predefinita per i Node
  compatibili con Talk e attendibili.
- iOS può sospendere l'audio in background; considera le funzionalità vocali best-effort quando l'app non è attiva.

## Errori comuni

- `NODE_BACKGROUND_UNAVAILABLE`: porta l'app iOS in primo piano (i comandi canvas/camera/screen lo richiedono).
- `A2UI_HOST_NOT_CONFIGURED`: il Gateway non ha pubblicizzato l'URL della superficie del Plugin Canvas; controlla `plugins.entries.canvas.config.host` in [Configurazione del Gateway](/it/gateway/configuration).
- Il prompt di associazione non compare mai: esegui `openclaw devices list` e approva manualmente.
- La riconnessione non riesce dopo la reinstallazione: il token di associazione Keychain è stato cancellato; associa di nuovo il Node.

## Documentazione correlata

- [Associazione](/it/channels/pairing)
- [Rilevamento](/it/gateway/discovery)
- [Bonjour](/it/gateway/bonjour)
