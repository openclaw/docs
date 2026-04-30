---
read_when:
    - Associazione o riconnessione del Node iOS
    - Eseguire l'app iOS dal codice sorgente
    - Debug del rilevamento del Gateway o dei comandi canvas
summary: 'App nodo iOS: connessione al Gateway, abbinamento, area di disegno e risoluzione dei problemi'
title: App iOS
x-i18n:
    generated_at: "2026-04-30T09:01:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilità: anteprima interna. L'app iOS non è ancora distribuita pubblicamente.

## Cosa fa

- Si connette a un Gateway tramite WebSocket (LAN o tailnet).
- Espone le capacità del nodo: Canvas, istantanea dello schermo, acquisizione della fotocamera, posizione, modalità Talk, attivazione vocale.
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

2. Nell'app iOS, apri Settings e seleziona un Gateway rilevato (oppure abilita Manual Host e inserisci host/porta).

3. Approva la richiesta di associazione sull'host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se l'app ritenta l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Facoltativo: se il nodo iOS si connette sempre da una sottorete strettamente controllata, puoi
abilitare l'approvazione automatica dei nodi al primo utilizzo con CIDR espliciti o IP esatti:

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

Questa opzione è disabilitata per impostazione predefinita. Si applica solo a nuove associazioni `role: node`
senza ambiti richiesti. L'associazione operatore/browser e qualsiasi modifica a ruolo, ambito, metadati o
chiave pubblica richiedono comunque l'approvazione manuale.

4. Verifica la connessione:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push supportato da relay per build ufficiali

Le build iOS distribuite ufficialmente usano il relay push esterno invece di pubblicare il token APNs grezzo
al Gateway.

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

- L'app iOS si registra con il relay usando App Attest e un JWS di transazione dell'app StoreKit.
- Il relay restituisce un handle relay opaco più una concessione di invio con ambito di registrazione.
- L'app iOS recupera l'identità del Gateway associato e la include nella registrazione relay, così la registrazione supportata dal relay viene delegata a quello specifico Gateway.
- L'app inoltra quella registrazione supportata dal relay al Gateway associato con `push.apns.register`.
- Il Gateway usa quell'handle relay archiviato per `push.test`, risvegli in background e suggerimenti di risveglio.
- L'URL di base del relay del Gateway deve corrispondere all'URL del relay incorporato nella build iOS ufficiale/TestFlight.
- Se l'app in seguito si connette a un Gateway diverso o a una build con un URL di base relay diverso, aggiorna la registrazione relay invece di riutilizzare il vecchio binding.

Cosa **non** serve al Gateway per questo percorso:

- Nessun token relay a livello di distribuzione.
- Nessuna chiave APNs diretta per invii ufficiali/TestFlight supportati da relay.

Flusso previsto per l'operatore:

1. Installa la build iOS ufficiale/TestFlight.
2. Imposta `gateway.push.apns.relay.baseUrl` sul Gateway.
3. Associa l'app al Gateway e lascia che completi la connessione.
4. L'app pubblica automaticamente `push.apns.register` dopo avere un token APNs, la sessione operatore è connessa e la registrazione relay riesce.
5. Dopo questo, `push.test`, i risvegli di riconnessione e i suggerimenti di risveglio possono usare la registrazione archiviata supportata da relay.

## Beacon di attività in background

Quando iOS risveglia l'app per un push silenzioso, un aggiornamento in background o un evento di posizione significativa, l'app
tenta una breve riconnessione del nodo e poi chiama `node.event` con `event: "node.presence.alive"`.
Il Gateway lo registra come `lastSeenAtMs`/`lastSeenReason` nei metadati del nodo/dispositivo associato solo
dopo che l'identità autenticata del dispositivo nodo è nota.

L'app considera un risveglio in background registrato correttamente solo quando la risposta del Gateway include
`handled: true`. I Gateway più vecchi possono confermare `node.event` con `{ "ok": true }`; quella risposta è
compatibile ma non conta come aggiornamento durevole dell'ultimo avvistamento.

Nota di compatibilità:

- `OPENCLAW_APNS_RELAY_BASE_URL` funziona ancora come override temporaneo tramite variabile d'ambiente per il Gateway.

## Flusso di autenticazione e fiducia

Il relay esiste per applicare due vincoli che APNs diretto sul Gateway non può fornire per
le build iOS ufficiali:

- Solo build iOS OpenClaw autentiche distribuite tramite Apple possono usare il relay ospitato.
- Un Gateway può inviare push supportati da relay solo per dispositivi iOS associati a quello specifico
  Gateway.

Passaggio per passaggio:

1. `iOS app -> gateway`
   - L'app si associa prima al Gateway tramite il normale flusso di autenticazione del Gateway.
   - Questo fornisce all'app una sessione nodo autenticata più una sessione operatore autenticata.
   - La sessione operatore viene usata per chiamare `gateway.identity.get`.

2. `iOS app -> relay`
   - L'app chiama gli endpoint di registrazione del relay tramite HTTPS.
   - La registrazione include la prova App Attest più un JWS di transazione dell'app StoreKit.
   - Il relay convalida l'ID bundle, la prova App Attest e la prova di distribuzione Apple, e richiede il
     percorso di distribuzione ufficiale/produzione.
   - Questo è ciò che impedisce alle build locali Xcode/dev di usare il relay ospitato. Una build locale può essere
     firmata, ma non soddisfa la prova di distribuzione Apple ufficiale attesa dal relay.

3. `gateway identity delegation`
   - Prima della registrazione relay, l'app recupera l'identità del Gateway associato da
     `gateway.identity.get`.
   - L'app include quell'identità del Gateway nel payload di registrazione relay.
   - Il relay restituisce un handle relay e una concessione di invio con ambito di registrazione delegati a
     quell'identità del Gateway.

4. `gateway -> relay`
   - Il Gateway archivia l'handle relay e la concessione di invio da `push.apns.register`.
   - Su `push.test`, risvegli di riconnessione e suggerimenti di risveglio, il Gateway firma la richiesta di invio con la
     propria identità dispositivo.
   - Il relay verifica sia la concessione di invio archiviata sia la firma del Gateway rispetto all'identità del
     Gateway delegata dalla registrazione.
   - Un altro Gateway non può riutilizzare quella registrazione archiviata, anche se in qualche modo ottiene l'handle.

5. `relay -> APNs`
   - Il relay possiede le credenziali APNs di produzione e il token APNs grezzo per la build ufficiale.
   - Il Gateway non archivia mai il token APNs grezzo per le build ufficiali supportate da relay.
   - Il relay invia il push finale ad APNs per conto del Gateway associato.

Perché è stata creata questa progettazione:

- Per tenere le credenziali APNs di produzione fuori dai Gateway degli utenti.
- Per evitare di archiviare token APNs grezzi delle build ufficiali sul Gateway.
- Per consentire l'uso del relay ospitato solo alle build OpenClaw ufficiali/TestFlight.
- Per impedire a un Gateway di inviare push di risveglio a dispositivi iOS appartenenti a un Gateway diverso.

Le build locali/manuali restano su APNs diretto. Se stai testando queste build senza il relay, il
Gateway ha ancora bisogno di credenziali APNs dirette:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Queste sono variabili d'ambiente di runtime dell'host Gateway, non impostazioni Fastlane. `apps/ios/fastlane/.env` archivia solo
l'autenticazione App Store Connect / TestFlight come `ASC_KEY_ID` e `ASC_ISSUER_ID`; non configura
la consegna APNs diretta per build iOS locali.

Archiviazione consigliata sull'host Gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Non eseguire il commit del file `.p8` né posizionarlo nel checkout del repo.

## Percorsi di discovery

### Bonjour (LAN)

L'app iOS esplora `_openclaw-gw._tcp` su `local.` e, quando configurato, lo stesso
dominio di discovery DNS-SD wide-area. I Gateway sulla stessa LAN appaiono automaticamente da `local.`;
la discovery cross-network può usare il dominio wide-area configurato senza cambiare il tipo di beacon.

### Tailnet (cross-network)

Se mDNS è bloccato, usa una zona DNS-SD unicast (scegli un dominio; esempio:
`openclaw.internal.`) e il DNS diviso di Tailscale.
Vedi [Bonjour](/it/gateway/bonjour) per l'esempio CoreDNS.

### Host/porta manuali

In Settings, abilita **Manual Host** e inserisci l'host + porta del Gateway (predefinita `18789`).

## Canvas + A2UI

Il nodo iOS renderizza un canvas WKWebView. Usa `node.invoke` per controllarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Note:

- L'host canvas del Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Viene servito dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).
- Il nodo iOS naviga automaticamente ad A2UI alla connessione quando viene annunciato un URL host canvas.
- Torna allo scaffold integrato con `canvas.navigate` e `{"url":""}`.

## Relazione con Computer Use

L'app iOS è una superficie di nodo mobile, non un backend Codex Computer Use. Codex
Computer Use e `cua-driver mcp` controllano un desktop macOS locale tramite strumenti MCP;
l'app iOS espone capacità iPhone tramite comandi nodo OpenClaw
come `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Gli agenti possono comunque utilizzare l'app iOS tramite OpenClaw invocando comandi
nodo, ma quelle chiamate passano attraverso il protocollo nodo del Gateway e seguono i limiti
foreground/background di iOS. Usa [Codex Computer Use](/it/plugins/codex-computer-use)
per il controllo del desktop locale e questa pagina per le capacità del nodo iOS.

### Valutazione / istantanea Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Attivazione vocale + modalità Talk

- Attivazione vocale e modalità Talk sono disponibili in Settings.
- iOS può sospendere l'audio in background; considera le funzionalità vocali come best-effort quando l'app non è attiva.

## Errori comuni

- `NODE_BACKGROUND_UNAVAILABLE`: porta l'app iOS in primo piano (i comandi canvas/fotocamera/schermo lo richiedono).
- `A2UI_HOST_NOT_CONFIGURED`: il Gateway non ha annunciato un URL host canvas; controlla `canvasHost` in [configurazione del Gateway](/it/gateway/configuration).
- La richiesta di associazione non compare mai: esegui `openclaw devices list` e approva manualmente.
- La riconnessione non riesce dopo la reinstallazione: il token di associazione Keychain è stato cancellato; riassocia il nodo.

## Documenti correlati

- [Associazione](/it/channels/pairing)
- [Discovery](/it/gateway/discovery)
- [Bonjour](/it/gateway/bonjour)
