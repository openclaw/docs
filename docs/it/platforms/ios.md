---
read_when:
    - Associare o riconnettere il Node iOS
    - Eseguire l'app iOS dal sorgente
    - Debug di discovery del Gateway o dei comandi canvas
summary: 'App Node iOS: connessione al Gateway, pairing, canvas e risoluzione dei problemi'
title: app iOS
x-i18n:
    generated_at: "2026-04-24T08:49:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

Disponibilità: anteprima interna. L'app iOS non è ancora distribuita pubblicamente.

## Cosa fa

- Si connette a un Gateway tramite WebSocket (LAN o tailnet).
- Espone capacità del Node: Canvas, snapshot dello schermo, acquisizione fotocamera, posizione, modalità Talk, Voice wake.
- Riceve comandi `node.invoke` e segnala eventi di stato del Node.

## Requisiti

- Gateway in esecuzione su un altro dispositivo (macOS, Linux o Windows tramite WSL2).
- Percorso di rete:
  - Stessa LAN tramite Bonjour, **oppure**
  - Tailnet tramite DNS-SD unicast (dominio di esempio: `openclaw.internal.`), **oppure**
  - Host/porta manuali (fallback).

## Avvio rapido (pair + connessione)

1. Avvia il Gateway:

```bash
openclaw gateway --port 18789
```

2. Nell'app iOS, apri Impostazioni e scegli un gateway rilevato (oppure abilita Host manuale e inserisci host/porta).

3. Approva la richiesta di pairing sull'host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se l'app ritenta il pairing con dettagli auth modificati (ruolo/ambiti/chiave pubblica),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

4. Verifica la connessione:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push supportato da relay per build ufficiali

Le build iOS ufficiali distribuite usano il relay push esterno invece di pubblicare il token APNs raw
al gateway.

Requisito lato gateway:

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

- L'app iOS si registra con il relay usando App Attest e la ricevuta dell'app.
- Il relay restituisce un relay handle opaco più un send grant limitato alla registrazione.
- L'app iOS recupera l'identità del gateway associato e la include nella registrazione al relay, così la registrazione supportata dal relay viene delegata a quel gateway specifico.
- L'app inoltra quella registrazione supportata dal relay al gateway associato con `push.apns.register`.
- Il gateway usa quell'handle relay memorizzato per `push.test`, risvegli in background e wake nudges.
- Il base URL del relay del gateway deve corrispondere all'URL relay incorporato nella build iOS ufficiale/TestFlight.
- Se in seguito l'app si connette a un gateway diverso o a una build con un base URL relay diverso, aggiorna la registrazione relay invece di riusare il vecchio binding.

Cosa **non** serve al gateway per questo percorso:

- Nessun token relay valido per tutto il deployment.
- Nessuna chiave APNs diretta per invii ufficiali/TestFlight supportati da relay.

Flusso operativo previsto:

1. Installa la build iOS ufficiale/TestFlight.
2. Imposta `gateway.push.apns.relay.baseUrl` sul gateway.
3. Associa l'app al gateway e lascia che completi la connessione.
4. L'app pubblica automaticamente `push.apns.register` dopo aver ottenuto un token APNs, dopo che la sessione operatore è connessa e dopo che la registrazione relay ha successo.
5. Dopo questo, `push.test`, reconnect wakes e wake nudges possono usare la registrazione supportata dal relay memorizzata.

Nota di compatibilità:

- `OPENCLAW_APNS_RELAY_BASE_URL` continua a funzionare come override env temporaneo per il gateway.

## Flusso di autenticazione e trust

Il relay esiste per imporre due vincoli che APNs diretti sul gateway non possono fornire per
le build iOS ufficiali:

- Solo le build iOS OpenClaw autentiche distribuite tramite Apple possono usare il relay ospitato.
- Un gateway può inviare push supportate da relay solo per dispositivi iOS associati a quello specifico
  gateway.

Hop per hop:

1. `app iOS -> gateway`
   - L'app esegue prima il pairing con il gateway tramite il normale flusso auth del Gateway.
   - Questo fornisce all'app una sessione Node autenticata più una sessione operatore autenticata.
   - La sessione operatore viene usata per chiamare `gateway.identity.get`.

2. `app iOS -> relay`
   - L'app chiama gli endpoint di registrazione del relay via HTTPS.
   - La registrazione include prova App Attest più la ricevuta dell'app.
   - Il relay valida bundle ID, prova App Attest e ricevuta Apple, e richiede il
     percorso di distribuzione ufficiale/di produzione.
   - Questo è ciò che impedisce alle build locali Xcode/dev di usare il relay ospitato. Una build locale può essere
     firmata, ma non soddisfa la prova di distribuzione ufficiale Apple che il relay si aspetta.

3. `delega dell'identità del gateway`
   - Prima della registrazione relay, l'app recupera l'identità del gateway associato da
     `gateway.identity.get`.
   - L'app include quell'identità del gateway nel payload di registrazione relay.
   - Il relay restituisce un relay handle e un send grant limitato alla registrazione che vengono delegati a
     quell'identità di gateway.

4. `gateway -> relay`
   - Il gateway memorizza relay handle e send grant da `push.apns.register`.
   - Su `push.test`, reconnect wakes e wake nudges, il gateway firma la richiesta di invio con la
     propria identità del dispositivo.
   - Il relay verifica sia il send grant memorizzato sia la firma del gateway rispetto all'identità di gateway delegata dalla registrazione.
   - Un altro gateway non può riusare quella registrazione memorizzata, anche se in qualche modo ottiene l'handle.

5. `relay -> APNs`
   - Il relay possiede le credenziali APNs di produzione e il token APNs raw per la build ufficiale.
   - Il gateway non memorizza mai il token APNs raw per build ufficiali supportate da relay.
   - Il relay invia il push finale ad APNs per conto del gateway associato.

Perché è stato creato questo design:

- Per mantenere le credenziali APNs di produzione fuori dai gateway utente.
- Per evitare di memorizzare sul gateway i token APNs raw delle build ufficiali.
- Per consentire l'uso del relay ospitato solo alle build OpenClaw ufficiali/TestFlight.
- Per impedire a un gateway di inviare wake push a dispositivi iOS appartenenti a un gateway diverso.

Le build locali/manuali restano su APNs diretti. Se stai testando quelle build senza relay, il
gateway ha comunque bisogno di credenziali APNs dirette:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Queste sono variabili env runtime dell'host gateway, non impostazioni Fastlane. `apps/ios/fastlane/.env` memorizza solo
l'auth App Store Connect / TestFlight come `ASC_KEY_ID` e `ASC_ISSUER_ID`; non configura
la consegna APNs diretta per le build iOS locali.

Archiviazione consigliata sull'host gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Non fare commit del file `.p8` e non metterlo sotto il checkout del repo.

## Percorsi di discovery

### Bonjour (LAN)

L'app iOS esplora `_openclaw-gw._tcp` su `local.` e, quando configurato, lo stesso
dominio di discovery DNS-SD wide-area. I gateway sulla stessa LAN appaiono automaticamente da `local.`;
la discovery cross-network può usare il dominio wide-area configurato senza cambiare il tipo di beacon.

### Tailnet (cross-network)

Se mDNS è bloccato, usa una zona DNS-SD unicast (scegli un dominio; esempio:
`openclaw.internal.`) e Tailscale split DNS.
Consulta [Bonjour](/it/gateway/bonjour) per l'esempio CoreDNS.

### Host/porta manuali

In Impostazioni, abilita **Host manuale** e inserisci host + porta del gateway (predefinita `18789`).

## Canvas + A2UI

Il Node iOS renderizza un canvas WKWebView. Usa `node.invoke` per pilotarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Note:

- L'host canvas del Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Viene servito dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).
- Il Node iOS naviga automaticamente verso A2UI alla connessione quando viene pubblicizzato un URL host canvas.
- Torna allo scaffold integrato con `canvas.navigate` e `{"url":""}`.

### Eval / snapshot del canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + modalità Talk

- Voice wake e modalità Talk sono disponibili nelle Impostazioni.
- iOS può sospendere l'audio in background; considera le funzionalità vocali come best-effort quando l'app non è attiva.

## Errori comuni

- `NODE_BACKGROUND_UNAVAILABLE`: porta l'app iOS in primo piano (i comandi canvas/camera/schermo lo richiedono).
- `A2UI_HOST_NOT_CONFIGURED`: il Gateway non ha pubblicizzato un URL host canvas; controlla `canvasHost` in [Configurazione del Gateway](/it/gateway/configuration).
- Il prompt di pairing non appare mai: esegui `openclaw devices list` e approva manualmente.
- La riconnessione fallisce dopo la reinstallazione: il token di pairing nel Keychain è stato cancellato; riesegui il pairing del Node.

## Documentazione correlata

- [Pairing](/it/channels/pairing)
- [Discovery](/it/gateway/discovery)
- [Bonjour](/it/gateway/bonjour)
