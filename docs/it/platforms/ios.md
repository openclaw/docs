---
read_when:
    - Associazione o riconnessione del Node iOS
    - Abilitazione o risoluzione dei problemi del Node diretto per Apple Watch
    - Esecuzione dell'app iOS dal codice sorgente
    - Debug del rilevamento del Gateway o dei comandi canvas
summary: 'App Node per iOS: connessione al Gateway, abbinamento, canvas e risoluzione dei problemi'
title: App iOS
x-i18n:
    generated_at: "2026-07-16T14:38:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilità: le build dell'app per iPhone vengono distribuite tramite i canali Apple quando abilitate per una release. Le build di sviluppo locali possono anche essere eseguite dal codice sorgente.

## Funzionalità

- Si connette a un Gateway tramite WebSocket (LAN o tailnet).
- Espone le funzionalità del Node: Canvas, istantanea dello schermo, acquisizione dalla fotocamera, posizione, modalità conversazione, attivazione vocale e riepiloghi facoltativi dei dati sanitari.
- Riceve i comandi `node.invoke` e segnala gli eventi di stato del Node.
- Consente di esplorare in sola lettura lo spazio di lavoro dell'agente selezionato dalla sezione Agenti (File): navigazione nelle directory, anteprime testuali con evidenziazione della sintassi, anteprime delle immagini ed esportazione tramite il pannello di condivisione. Non sono consentite operazioni di scrittura; le dimensioni delle anteprime sono limitate dal Gateway.
- Mantiene una piccola cache offline in sola lettura delle sessioni di chat e delle trascrizioni recenti per ciascun Gateway associato: all'avvio a freddo mostra immediatamente l'ultima trascrizione nota e la aggiorna non appena il Gateway risponde, le chat recenti rimangono consultabili anche senza connessione e il ripristino o la rimozione del Gateway elimina la cache locale protetta.
- Accoda i messaggi di testo inviati in assenza di connessione in una casella di uscita persistente per ciascun Gateway (fino a 50): i messaggi accodati vengono visualizzati nella trascrizione, inviati in ordine alla riconnessione con tentativi idempotenti, conservati finché la cronologia canonica non conferma l'invio, ritentati con attese progressive prima di mostrare un'azione per riprovare o eliminarli e lasciati scadere anziché inviati dopo 48 ore offline; il ripristino o la rimozione del Gateway elimina la coda insieme alla cache.
- Riproduce su richiesta i messaggi dell'assistente: tenere premuto un messaggio nella Chat e scegliere **Listen**. L'app riproduce i clip `tts.speak` supportati dal Gateway tramite il provider TTS configurato e ricorre alla sintesi vocale sul dispositivo quando l'audio del Gateway non è disponibile o riproducibile. La riproduzione si interrompe quando si cambia sessione o l'app passa in background.

## Requisiti

- Gateway in esecuzione su un altro dispositivo (macOS, Linux o Windows tramite WSL2).
- Percorso di rete:
  - Stessa LAN tramite Bonjour, **oppure**
  - Tailnet tramite DNS-SD unicast (dominio di esempio: `openclaw.internal.`), **oppure**
  - Host/porta manuali (opzione di riserva).

## Avvio rapido (associazione e connessione)

Al primo avvio, l'app presenta una breve spiegazione dell'associazione e una
pagina delle autorizzazioni (notifiche, fotocamera, microfono, foto, contatti,
calendario, promemoria, posizione). Ogni autorizzazione è facoltativa e può
essere modificata in seguito in **Settings** -> **Permissions** oppure nell'app
Impostazioni di iOS.

1. Avviare un Gateway autenticato con un percorso raggiungibile dal telefono. Tailscale
   Serve è il percorso remoto consigliato:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Per una configurazione attendibile sulla stessa LAN, utilizzare invece un
`gateway.bind: "lan"` autenticato. Il binding di loopback predefinito non è
raggiungibile da un telefono. Se il Gateway non è ancora stato configurato,
eseguire prima `openclaw onboard`, affinché la creazione del codice di
configurazione disponga di un percorso di autenticazione tramite token o password.

2. Aprire la [UI di controllo](/it/web/control-ui), selezionare **Nodes** e fare clic su
   **Pair mobile device** nella pagina **Devices**. L'accesso completo è consigliato
   e selezionato per impostazione predefinita; scegliere Limited access solo se si
   desidera omettere i controlli amministrativi del Gateway, quindi fare clic su
   **Create setup code**.

3. Nell'app iOS, aprire **Settings** -> **Gateway**, scansionare il codice QR (oppure
   incollare il codice di configurazione) e connettersi.

   Se il codice di configurazione contiene sia percorsi LAN sia Tailscale Serve,
   l'app li verifica in ordine e salva il primo endpoint raggiungibile.

4. L'app ufficiale si connette automaticamente. Se **Pending approval** mostra una
   richiesta, verificarne il ruolo e gli ambiti prima di approvarla.

   **Settings → Gateway** indica se la connessione operatore salvata dispone di
   accesso **Full** o **Limited**. La configurazione LAN `ws://` in testo
   non crittografato viene automaticamente limitata per proteggere il bearer token.
   Se è limitata, configurare `wss://` o Tailscale Serve, scansionare un
   nuovo codice di accesso completo dalla UI di controllo o da `openclaw qr`,
   quindi riconnettersi per abilitare le impostazioni e gli aggiornamenti.

Il pulsante della UI di controllo richiede una sessione già associata con `operator.admin`.
Come alternativa da terminale, selezionare nell'app iOS un Gateway rilevato
(oppure abilitare Manual Host e inserire host/porta), quindi approvare la richiesta
sull'host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se l'app ritenta l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Eseguire nuovamente `openclaw devices list` prima dell'approvazione.

Facoltativo: se il Node iOS si connette sempre da una sottorete strettamente controllata, è possibile abilitare l'approvazione automatica dei Node al primo collegamento specificando CIDR o indirizzi IP esatti:

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

Questa funzione è disabilitata per impostazione predefinita. Si applica soltanto alle nuove associazioni `role: node` senza ambiti richiesti. L'associazione di operatori/browser e qualsiasi modifica a ruolo, ambito, metadati o chiave pubblica richiedono comunque l'approvazione manuale.

5. Verificare la connessione:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Riepiloghi dei dati sanitari

Il Node iOS può restituire, previa adesione, un aggregato HealthKit in sola lettura
per il giorno di calendario corrente. Il consenso sull'iPhone e l'autorizzazione
esplicita dei comandi del Gateway costituiscono controlli indipendenti. Consultare
[Riepiloghi HealthKit](/platforms/ios-healthkit) per configurazione, chiamata,
campi del payload, comportamento relativo alla privacy e risoluzione dei problemi.

Per impostazione predefinita, l'app complementare per Apple Watch continua a
utilizzare il relay esistente dell'iPhone e non richiede un'associazione separata
al Gateway. Associare l'Apple Watch all'iPhone nell'app Watch di Apple, installare
OpenClaw da **Watch app -> My Watch -> Available Apps**, quindi aprire OpenClaw una
volta su entrambi i dispositivi.

## Revisione delle approvazioni dei comandi

Una connessione operatore con `operator.admin`, oppure una connessione
`operator.approvals` associata e scelta esplicitamente come destinazione dal Gateway,
può esaminare le richieste di esecuzione in sospeso sull'iPhone. La scheda di
approvazione mostra l'anteprima sanitizzata del comando del Gateway, l'avviso,
il contesto dell'host, la scadenza e soltanto le decisioni offerte da quella
richiesta. L'Apple Watch associato riceve la stessa richiesta sicura per il
revisore tramite il relay esistente dell'iPhone e offre il sottoinsieme compatto
di decisioni per consentire una volta o negare. La modalità di connessione diretta
dell'Apple Watch al Gateway non trasmette le richieste di approvazione.

Lo stato dell'approvazione è condiviso con la UI di controllo e le superfici di
chat supportate. Prevale la prima risposta confermata. L'iPhone e l'Apple Watch
recuperano il record terminale canonico del Gateway dopo che un'altra superficie
ha risolto la richiesta, dopo una notifica remota di risoluzione e ogni volta che
potrebbe essere andata persa una conferma di risoluzione. Le azioni rimangono
indisponibili finché tale rilettura non conferma se la richiesta è ancora in sospeso.

La titolarità dell'approvazione è vincolata al Gateway selezionato. Il passaggio
da un Gateway a un altro non può applicare una vecchia richiesta alla connessione
sostitutiva. I Gateway precedenti ai metodi di approvazione unificati ricorrono
ai metodi specifici per l'esecuzione già distribuiti; lo stato terminale conservato
e i risultati più completi condivisi tra le superfici richiedono un Gateway aggiornato.

## Node Apple Watch diretto facoltativo

La modalità diretta assegna all'Apple Watch una propria identità Node firmata e
una connessione al Gateway. I comandi Node supportati continuano a funzionare
tramite Wi-Fi o rete cellulare dell'Apple Watch mentre OpenClaw è attivo, anche
quando l'iPhone associato non è disponibile.

Requisiti:

- L'iPhone è connesso al Gateway con l'ambito `operator.admin`.
- Il codice di configurazione pubblicizza un endpoint Gateway `wss://` con un certificato considerato attendibile
  da watchOS; l'Apple Watch interroga periodicamente l'origine `https://` corrispondente. HTTP in chiaro
  e l'attendibilità basata soltanto su certificati autofirmati o impronte digitali non sono supportati. Consultare
  [Associazione gestita dal Gateway](/it/gateway/pairing) per la configurazione dell'endpoint. I percorsi di loopback,
  accessibili soltanto dall'iPhone o soltanto dalla tailnet non sono raggiungibili autonomamente dall'Apple Watch.
- L'uso della rete cellulare richiede un Apple Watch con connettività cellulare e servizio attivo.
- OpenClaw è attivo sull'Apple Watch. Apple non consente alle normali app watchOS di
  mantenere connessioni WebSocket/TCP generiche, pertanto il Node diretto utilizza
  brevi richieste HTTPS periodiche e si riconnette quando l'app torna in primo piano. Consultare le
  [indicazioni di Apple sulle reti di basso livello in watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configurazione:

1. Sull'iPhone, aprire **Settings -> Apple Watch**.
2. Toccare **Enable Direct Gateway Connection**.
3. Aprire OpenClaw sull'Apple Watch prima della scadenza del codice di configurazione temporaneo.
4. Verificare la riga separata dell'Apple Watch con `openclaw nodes status`.

Il codice di configurazione contiene una credenziale di bootstrap temporanea e
riservata al Node; deve essere trattata come una password fino alla scadenza. Non
contiene mai la password o il token del Gateway salvati sull'iPhone. Dopo
l'associazione, l'Apple Watch memorizza il proprio token del dispositivo ed
elimina la credenziale di bootstrap. La modalità diretta supporta soltanto i
comandi indicati di seguito. Chat, conversazione, approvazioni e il flusso di
notifiche `watch.*` esistente rimangono funzionalità del relay dell'iPhone
e richiedono comunque l'iPhone associato.

Comandi Node diretti di watchOS:

| Superficie    | Comandi                        | Note                                                            |
| ------------- | ------------------------------ | --------------------------------------------------------------- |
| Dispositivo   | `device.info`, `device.status` | Identità dell'Apple Watch, batteria, stato termico, spazio di archiviazione e rete. |
| Notifiche     | `system.notify`                | Mentre l'app è attiva; richiede l'autorizzazione sull'Apple Watch. |

watchOS non espone WebKit alle app di terze parti, pertanto il Node diretto
dell'Apple Watch non pubblicizza i comandi Canvas.

## Push tramite relay per le build ufficiali

Le build iOS ufficiali distribuite utilizzano un relay push esterno anziché pubblicare il token APNs non elaborato nel Gateway. Le build ufficiali dell'App Store provenienti dal canale di release pubblico utilizzano il relay ospitato all'indirizzo `https://ios-push-relay.openclaw.ai`; questo URL di base è codificato direttamente per la distribuzione tramite App Store e non legge alcuna sostituzione.

Le distribuzioni con relay personalizzato richiedono un percorso di build e distribuzione iOS deliberatamente separato, il cui URL del relay corrisponda a quello del Gateway. Il canale di release dell'App Store non accetta mai un URL di relay personalizzato. Se si utilizza una build con relay personalizzato, impostare sul Gateway l'URL del relay corrispondente:

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

Funzionamento del flusso:

- L'app iOS si registra presso il relay utilizzando App Attest e un JWS della transazione dell'app StoreKit.
- Il relay restituisce un identificatore opaco del relay e un'autorizzazione all'invio limitata alla registrazione.
- L'app iOS recupera l'identità del Gateway associato (`gateway.identity.get`) e la include nella registrazione al relay, affinché la registrazione basata sul relay venga delegata a quello specifico Gateway.
- L'app inoltra la registrazione basata sul relay al Gateway associato tramite `push.apns.register`.
- Il Gateway utilizza l'identificatore del relay memorizzato per `push.test`, le riattivazioni in background e i segnali di riattivazione.
- Se successivamente l'app si connette a un Gateway diverso o a una build con un URL di base del relay diverso, aggiorna la registrazione al relay anziché riutilizzare il vecchio collegamento.

Ciò che **non** serve al Gateway per questo percorso: nessun token del relay valido per l'intera distribuzione e nessuna chiave APNs diretta per gli invii ufficiali dell'App Store basati sul relay.

Flusso previsto per l'operatore:

1. Installare l'app iOS ufficiale.
2. Facoltativo: impostare `gateway.push.apns.relay.baseUrl` sul Gateway soltanto quando si utilizza una build con relay personalizzato deliberatamente separata.
3. Associare l'app al Gateway e attendere il completamento della connessione.
4. L'app pubblica `push.apns.register` non appena dispone di un token APNs, la sessione operatore è connessa e la registrazione al relay è riuscita.
5. Successivamente, `push.test`, le riattivazioni alla riconnessione e i segnali di riattivazione possono utilizzare la registrazione basata sul relay memorizzata.

## Beacon attivi in background

Quando iOS riattiva l'app per una notifica push silenziosa, un aggiornamento in background o un evento di variazione significativa della posizione, l'app tenta una breve riconnessione del Node e quindi chiama `node.event` con `event: "node.presence.alive"`. Il Gateway registra l'evento come `lastSeenAtMs`/`lastSeenReason` nei metadati del Node/dispositivo associato solo dopo aver determinato l'identità autenticata del dispositivo Node.

L'app considera una riattivazione in background registrata correttamente solo quando la risposta del Gateway include `handled: true`. I Gateway meno recenti possono confermare `node.event` con `{ "ok": true }`; tale risposta è compatibile, ma non viene considerata un aggiornamento persistente dell'ultima visualizzazione.

Nota sulla compatibilità:

- `OPENCLAW_APNS_RELAY_BASE_URL` continua a funzionare come override temporaneo tramite variabile di ambiente per il Gateway (`gateway.push.apns.relay.baseUrl` è il percorso che dà priorità alla configurazione).
- La modalità push della build di rilascio per App Store incorpora direttamente l'host del relay ospitato e non legge mai un override dell'URL del relay: la variabile di ambiente in fase di build `OPENCLAW_PUSH_RELAY_BASE_URL` influisce solo sulle modalità di build iOS locali/sandbox.

## Flusso di autenticazione e attendibilità

Il relay esiste per applicare due vincoli che l'uso diretto di APNs sul Gateway non può garantire per le build iOS ufficiali:

- Solo le build iOS originali di OpenClaw distribuite tramite Apple possono utilizzare il relay ospitato.
- Un Gateway può inviare notifiche push tramite relay solo ai dispositivi iOS associati a quello specifico Gateway.

Passaggio per passaggio:

1. `iOS app -> gateway`: l'app si associa al Gateway tramite il normale flusso di autenticazione del Gateway, ottenendo una sessione Node autenticata e una sessione operatore autenticata. La sessione operatore chiama `gateway.identity.get`.
2. `iOS app -> relay`: l'app chiama gli endpoint di registrazione del relay tramite HTTPS con una prova App Attest e un JWS della transazione dell'app StoreKit. Il relay convalida l'ID del bundle, la prova App Attest e la prova di distribuzione Apple e richiede il percorso di distribuzione ufficiale/di produzione: ciò impedisce alle build locali Xcode/di sviluppo di utilizzare il relay ospitato, poiché una build locale non può soddisfare la prova di distribuzione ufficiale Apple.
3. `gateway identity delegation`: prima della registrazione al relay, l'app recupera l'identità del Gateway associato da `gateway.identity.get` e la include nel payload di registrazione del relay. Il relay restituisce un handle del relay e un'autorizzazione all'invio limitata alla registrazione, delegata a tale identità del Gateway.
4. `gateway -> relay`: il Gateway memorizza l'handle del relay e l'autorizzazione all'invio provenienti da `push.apns.register`. In occasione di `push.test`, riattivazioni per riconnessione e solleciti di riattivazione, il Gateway firma la richiesta di invio con la propria identità dispositivo; il relay verifica sia l'autorizzazione all'invio memorizzata sia la firma del Gateway rispetto all'identità del Gateway delegata durante la registrazione. Un altro Gateway non può riutilizzare tale registrazione memorizzata, anche se in qualche modo ottiene l'handle.
5. `relay -> APNs`: il relay gestisce le credenziali APNs di produzione e il token APNs non elaborato per la build ufficiale. Il Gateway non memorizza mai il token APNs non elaborato per le build ufficiali supportate dal relay; il relay invia la notifica push finale ad APNs per conto del Gateway associato.

Motivo della creazione di questa architettura: mantenere le credenziali APNs di produzione fuori dai Gateway degli utenti, evitare di memorizzare sul Gateway i token APNs non elaborati delle build ufficiali, consentire l'uso del relay ospitato solo alle build iOS ufficiali di OpenClaw e impedire a un Gateway di inviare notifiche push di riattivazione ai dispositivi iOS appartenenti a un Gateway diverso.

Le build locali/manuali continuano a utilizzare APNs direttamente. Se si eseguono test di tali build senza il relay, il Gateway necessita comunque delle credenziali APNs dirette:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Queste sono variabili di ambiente di runtime dell'host del Gateway, non impostazioni Fastlane. `apps/ios/fastlane/.env` memorizza solo dati di autenticazione di App Store Connect come `APP_STORE_CONNECT_KEY_ID` e `APP_STORE_CONNECT_ISSUER_ID`; non configura la consegna APNs diretta per le build iOS locali.

Archiviazione consigliata sull'host del Gateway, coerente con le altre credenziali dei provider in `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Non eseguire il commit del file `.p8` né collocarlo nel checkout del repository.

## Percorsi di rilevamento

### Bonjour (LAN)

L'app iOS cerca `_openclaw-gw._tcp` su `local.` e, quando configurato, nello stesso dominio di rilevamento DNS-SD geografico. I Gateway sulla stessa LAN vengono visualizzati automaticamente tramite `local.`; il rilevamento tra reti diverse può utilizzare il dominio geografico configurato senza modificare il tipo di beacon.

### Tailnet (tra reti)

Se mDNS è bloccato, utilizzare una zona DNS-SD unicast (scegliere un dominio; esempio: `openclaw.internal.`) e il DNS suddiviso di Tailscale. Consultare [Bonjour](/it/gateway/bonjour) per l'esempio CoreDNS.

### Host/porta manuali

In Settings, abilitare **Manual Host** e inserire host e porta del Gateway (valore predefinito `18789`).

## Più Gateway

L'app mantiene un registro di tutti i Gateway con cui è stata associata, consentendo di passare dall'uno all'altro senza ripetere l'associazione:

- **Settings -> Gateway** mostra un elenco **Paired Gateways** con il Gateway attivo contrassegnato. Toccare una voce per cambiare Gateway; l'app termina le sessioni correnti e si riconnette al Gateway selezionato. Quando è associato più di un Gateway, accanto alla riga della connessione viene visualizzato un menu di selezione rapida.
- Le credenziali, le decisioni di attendibilità TLS, le preferenze specifiche di ciascun Gateway e la cronologia delle chat memorizzata nella cache vengono archiviate separatamente per ogni Gateway. Il cambio di Gateway non mescola mai lo stato tra Gateway e la registrazione push segue il Gateway attivo.
- Scorrere su un Gateway associato (oppure utilizzare il relativo menu contestuale) per selezionare **Forget**, rimuovendo le credenziali, i token del dispositivo, il pin TLS e le chat memorizzate nella cache.
- Per poter passare a un Gateway rilevato, questo deve essere visibile sulla rete; i Gateway manuali si riconnettono utilizzando l'host e la porta salvati.

## Canvas + A2UI

Il Node iOS esegue il rendering di un canvas WKWebView. Utilizzare `node.invoke` per controllarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Note:

- L'host del canvas del Gateway fornisce `/__openclaw__/canvas/` e `/__openclaw__/a2ui/` dal server HTTP del Gateway (stessa porta di `gateway.port`, valore predefinito `18789`).
- Il Node iOS mantiene lo scaffold integrato come vista predefinita quando è connesso. `canvas.a2ui.push` e `canvas.a2ui.reset` utilizzano la pagina A2UI inclusa e gestita dall'app.
- Le pagine A2UI del Gateway remoto supportano solo il rendering su iOS; le azioni native dei pulsanti A2UI vengono accettate esclusivamente dalle pagine incluse e gestite dall'app.
- Tornare allo scaffold integrato con `canvas.navigate` e `{"url":""}`.

## Relazione con Computer Use

L'app iOS è un'interfaccia Node mobile, non un backend Codex Computer Use. Codex Computer Use e `cua-driver mcp` controllano un desktop macOS locale tramite strumenti MCP; l'app iOS espone le funzionalità dell'iPhone tramite comandi Node di OpenClaw come `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Gli agenti possono comunque controllare l'app iOS tramite OpenClaw invocando comandi Node, ma tali chiamate passano attraverso il protocollo Node del Gateway e rispettano i limiti di iOS per il primo piano e il background. Utilizzare [Codex Computer Use](/it/plugins/codex-computer-use) per il controllo del desktop locale e questa pagina per le funzionalità del Node iOS.

### Valutazione / snapshot del canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Riattivazione vocale + modalità conversazione

- La riattivazione vocale e la modalità conversazione sono disponibili in Settings.
- La conversazione in tempo reale di OpenAI utilizza WebRTC gestito dal client quando `talk.realtime.transport` è `webrtc`; una configurazione esplicita di `gateway-relay` rimane gestita dal Gateway. Consultare [Modalità conversazione](/it/nodes/talk).
- I Node iOS compatibili con la conversazione dichiarano la funzionalità `talk` e possono dichiarare `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`; per impostazione predefinita, il Gateway consente tali comandi push-to-talk ai Node attendibili compatibili con la conversazione.
- iOS può sospendere l'audio in background; quando l'app non è attiva, le funzionalità vocali vanno considerate senza garanzia di funzionamento.

## Errori comuni

- `NODE_BACKGROUND_UNAVAILABLE`: portare l'app iOS in primo piano (i comandi di canvas/fotocamera/schermo lo richiedono).
- `A2UI_HOST_UNAVAILABLE`: la pagina A2UI inclusa non era raggiungibile nella WebView dell'app; mantenere l'app in primo piano nella scheda Screen e riprovare.
- La richiesta di associazione non viene mai visualizzata: eseguire `openclaw devices list` e approvare manualmente.
- Watch non mostra alcuno stato dell'iPhone: verificare che l'iPhone segnali `watchPaired: true`
  e `watchAppInstalled: true` in `watch.status`. Se l'associazione è false, associare
  Watch nell'app Watch di Apple. Se l'installazione è false, installare l'app complementare
  da **My Watch -> Available Apps**. Dopo una delle due modifiche, aprire una volta OpenClaw su
  Watch; la raggiungibilità immediata richiede comunque che entrambe le app siano in esecuzione,
  mentre gli aggiornamenti in coda possono arrivare successivamente in background.
- La riconnessione non riesce dopo la reinstallazione: il token di associazione del Portachiavi è stato cancellato; associare nuovamente il Node.

## Documentazione correlata

- [Associazione](/it/channels/pairing)
- [Rilevamento](/it/gateway/discovery)
- [Bonjour](/it/gateway/bonjour)
