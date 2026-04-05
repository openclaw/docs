---
read_when:
    - Pairing o riconnessione del nodo iOS
    - Esecuzione dell'app iOS dal sorgente
    - Debug della discovery del gateway o dei comandi canvas
summary: 'App nodo iOS: connessione al Gateway, pairing, canvas e risoluzione dei problemi'
title: App iOS
x-i18n:
    generated_at: "2026-04-05T13:58:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e9d9cec58afd4003dff81d3e367bfbc6a634c1b229e433e08fd78fbb5f2e5a9
    source_path: platforms/ios.md
    workflow: 15
---

# App iOS (Node)

Disponibilità: anteprima interna. L'app iOS non è ancora distribuita pubblicamente.

## Cosa fa

- Si connette a un Gateway tramite WebSocket (LAN o tailnet).
- Espone capacità del nodo: Canvas, snapshot dello schermo, acquisizione della fotocamera, posizione, modalità Talk, voice wake.
- Riceve comandi `node.invoke` e segnala eventi di stato del nodo.

## Requisiti

- Gateway in esecuzione su un altro dispositivo (macOS, Linux o Windows tramite WSL2).
- Percorso di rete:
  - stessa LAN tramite Bonjour, **oppure**
  - tailnet tramite DNS-SD unicast (dominio di esempio: `openclaw.internal.`), **oppure**
  - host/porta manuali (fallback).

## Guida rapida (pair + connect)

1. Avvia il Gateway:

```bash
openclaw gateway --port 18789
```

2. Nell'app iOS, apri Settings e scegli un gateway rilevato (oppure abilita Manual Host e inserisci host/porta).

3. Approva la richiesta di pairing sull'host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se l'app ritenta il pairing con dettagli di autenticazione cambiati (ruolo/ambiti/public key),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

4. Verifica la connessione:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push supportato da relay per le build ufficiali

Le build iOS ufficiali distribuite usano il relay push esterno invece di pubblicare il token APNs grezzo
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

- L'app iOS si registra presso il relay usando App Attest e la ricevuta dell'app.
- Il relay restituisce un handle relay opaco più una send grant con ambito di registrazione.
- L'app iOS recupera l'identità del gateway associato e la include nella registrazione relay, così la registrazione supportata da relay viene delegata a quel gateway specifico.
- L'app inoltra quella registrazione supportata da relay al gateway associato con `push.apns.register`.
- Il gateway usa l'handle relay memorizzato per `push.test`, wake in background e wake nudges.
- Il base URL del relay del gateway deve corrispondere all'URL del relay incorporato nella build iOS ufficiale/TestFlight.
- Se in seguito l'app si connette a un gateway diverso o a una build con un base URL del relay differente, aggiorna la registrazione relay invece di riutilizzare il vecchio binding.

Cosa **non** serve al gateway per questo percorso:

- Nessun token relay valido per l'intera distribuzione.
- Nessuna chiave APNs diretta per invii ufficiali/TestFlight supportati da relay.

Flusso operatore previsto:

1. Installa la build iOS ufficiale/TestFlight.
2. Imposta `gateway.push.apns.relay.baseUrl` sul gateway.
3. Esegui il pairing dell'app con il gateway e lascia che completi la connessione.
4. L'app pubblica automaticamente `push.apns.register` dopo aver ottenuto un token APNs, quando la sessione operatore è connessa e la registrazione relay è riuscita.
5. Dopo questo, `push.test`, i wake di riconnessione e i wake nudges possono usare la registrazione supportata da relay memorizzata.

Nota sulla compatibilità:

- `OPENCLAW_APNS_RELAY_BASE_URL` funziona ancora come override env temporaneo per il gateway.

## Flusso di autenticazione e attendibilità

Il relay esiste per applicare due vincoli che APNs diretto sul gateway non può fornire per
le build iOS ufficiali:

- Solo le build iOS OpenClaw autentiche distribuite tramite Apple possono usare il relay ospitato.
- Un gateway può inviare push supportati da relay solo ai dispositivi iOS che hanno eseguito il pairing con quel gateway specifico.

Passo per passo:

1. `app iOS -> gateway`
   - L'app esegue prima il pairing con il gateway tramite il normale flusso auth del Gateway.
   - Questo fornisce all'app una sessione node autenticata più una sessione operator autenticata.
   - La sessione operator viene usata per chiamare `gateway.identity.get`.

2. `app iOS -> relay`
   - L'app chiama gli endpoint di registrazione del relay tramite HTTPS.
   - La registrazione include prova App Attest più la ricevuta dell'app.
   - Il relay convalida il bundle ID, la prova App Attest e la ricevuta Apple, e richiede il
     percorso di distribuzione ufficiale/di produzione.
   - Questo è ciò che impedisce alle build locali Xcode/dev di usare il relay ospitato. Una build locale può essere
     firmata, ma non soddisfa la prova di distribuzione Apple ufficiale che il relay si aspetta.

3. `delega dell'identità del gateway`
   - Prima della registrazione relay, l'app recupera l'identità del gateway associato da
     `gateway.identity.get`.
   - L'app include quell'identità del gateway nel payload di registrazione relay.
   - Il relay restituisce un handle relay e una send grant con ambito di registrazione delegati a
     quell'identità del gateway.

4. `gateway -> relay`
   - Il gateway memorizza l'handle relay e la send grant di `push.apns.register`.
   - In `push.test`, nei wake di riconnessione e nei wake nudges, il gateway firma la richiesta di invio con la
     propria identità del dispositivo.
   - Il relay verifica sia la send grant memorizzata sia la firma del gateway rispetto all'identità del
     gateway delegata dalla registrazione.
   - Un altro gateway non può riutilizzare quella registrazione memorizzata, anche se in qualche modo ottiene l'handle.

5. `relay -> APNs`
   - Il relay possiede le credenziali APNs di produzione e il token APNs grezzo per la build ufficiale.
   - Il gateway non memorizza mai il token APNs grezzo per le build ufficiali supportate da relay.
   - Il relay invia il push finale ad APNs per conto del gateway associato.

Perché è stato creato questo design:

- Per tenere le credenziali APNs di produzione fuori dai gateway degli utenti.
- Per evitare di memorizzare sul gateway i token APNs grezzi delle build ufficiali.
- Per consentire l'uso del relay ospitato solo alle build OpenClaw ufficiali/TestFlight.
- Per impedire a un gateway di inviare wake push a dispositivi iOS appartenenti a un gateway diverso.

Le build locali/manuali continuano a usare APNs diretto. Se stai testando tali build senza il relay, il
gateway ha comunque bisogno di credenziali APNs dirette:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Percorsi di discovery

### Bonjour (LAN)

L'app iOS sfoglia `_openclaw-gw._tcp` su `local.` e, quando configurato, lo stesso
dominio di discovery DNS-SD wide-area. I gateway sulla stessa LAN appaiono automaticamente da `local.`;
la discovery cross-network può usare il dominio wide-area configurato senza cambiare il tipo di beacon.

### Tailnet (cross-network)

Se mDNS è bloccato, usa una zona DNS-SD unicast (scegli un dominio; esempio:
`openclaw.internal.`) e Tailscale split DNS.
Vedi [Bonjour](/gateway/bonjour) per l'esempio CoreDNS.

### Host/porta manuali

In Settings, abilita **Manual Host** e inserisci host + porta del gateway (predefinita `18789`).

## Canvas + A2UI

Il nodo iOS renderizza un canvas WKWebView. Usa `node.invoke` per pilotarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Note:

- L'host canvas del Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Viene servito dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).
- Il nodo iOS naviga automaticamente verso A2UI alla connessione quando viene annunciato un URL host canvas.
- Torna allo scaffold integrato con `canvas.navigate` e `{"url":""}`.

### Eval / snapshot canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + modalità Talk

- Voice wake e la modalità Talk sono disponibili in Settings.
- iOS può sospendere l'audio in background; considera le funzioni vocali come best-effort quando l'app non è attiva.

## Errori comuni

- `NODE_BACKGROUND_UNAVAILABLE`: porta l'app iOS in primo piano (i comandi canvas/fotocamera/schermo lo richiedono).
- `A2UI_HOST_NOT_CONFIGURED`: il Gateway non ha annunciato un URL host canvas; controlla `canvasHost` in [Configurazione del Gateway](/gateway/configuration).
- Il prompt di pairing non appare mai: esegui `openclaw devices list` e approva manualmente.
- La riconnessione fallisce dopo la reinstallazione: il token di pairing nel Keychain è stato cancellato; riesegui il pairing del nodo.

## Documentazione correlata

- [Pairing](/it/channels/pairing)
- [Discovery](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
