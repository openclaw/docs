---
read_when:
    - Associazione o riconnessione del Node Android
    - Debug del rilevamento o dell'autenticazione del Gateway su Android
    - Duplicazione o controllo di un dispositivo Android da un Mac remoto
    - Verifica della parità della cronologia chat tra i client
summary: 'App Android (Node): procedura operativa per la connessione + superficie dei comandi Connect/Chat/Voice/Canvas'
title: App Android
x-i18n:
    generated_at: "2026-07-16T14:35:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
L'app Android ufficiale è disponibile su [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) e come APK autonomo firmato nelle [GitHub Releases](https://github.com/openclaw/openclaw/releases) supportate. È un Node complementare e richiede un Gateway OpenClaw in esecuzione. Sorgente: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([istruzioni per la compilazione](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Panoramica del supporto

- Ruolo: app Node complementare (Android non ospita il Gateway).
- Gateway richiesto: sì (eseguirlo su macOS, Linux o Windows tramite WSL2).
- Installazione: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) o `OpenClaw-Android.apk` da una [GitHub Release](https://github.com/openclaw/openclaw/releases) supportata, [Guida introduttiva](/it/start/getting-started) per il Gateway, quindi [Associazione](/it/channels/pairing).
- Gateway: [Manuale operativo](/it/gateway) + [Configurazione](/it/gateway/configuration).
  - Protocolli: [protocollo Gateway](/it/gateway/protocol) (Node + piano di controllo).

Il controllo del sistema (launchd/systemd) risiede sull'host del Gateway; vedere [Gateway](/it/gateway).

## Installazione al di fuori di Google Play

Le GitHub Releases finali e correttive regolari includono un `OpenClaw-Android.apk` universale e `OpenClaw-Android-SHA256SUMS.txt`. L'APK viene compilato dal tag della release, firmato con la chiave di release Android di OpenClaw e include la provenienza di GitHub Actions.

Scegliere una [release](https://github.com/openclaw/openclaw/releases) che elenchi entrambe le risorse, quindi scaricare e verificare esattamente quel tag prima dell'installazione tramite sideload:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Le installazioni da Google Play e tramite APK autonomo utilizzano canali di aggiornamento diversi e possono avere identità di firma differenti. Android potrebbe richiedere la disinstallazione dell'app esistente prima di cambiare canale, rimuovendo così i dati locali dell'app. Per gli aggiornamenti ordinari, restare su un solo canale.
</Warning>

## Mirroring e controllo di Android da un Mac remoto

[scrcpy](https://github.com/Genymobile/scrcpy) esegue il mirroring dello schermo Android in una finestra macOS e
inoltra l'input da tastiera e puntatore tramite Android Debug Bridge (ADB). Si tratta di un flusso di lavoro
lato operatore, separato dalla connessione del Node OpenClaw. È utile quando il dispositivo Android e il
Mac si trovano in luoghi diversi ma condividono una rete Tailscale privata.

### Prima di iniziare

- Installare Tailscale sul dispositivo Android e sul Mac e connetterli entrambi alla stessa tailnet.
- Su Android, abilitare **Developer options** e **USB debugging**. Android 16 colloca **Wireless
  debugging** in **Settings > System > Developer options**. Vedere [le opzioni sviluppatore di
  Android](https://developer.android.com/studio/debug/dev-options).
- Installare scrcpy e ADB sul Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Tenere disponibile il dispositivo Android per la prima connessione. Android deve approvare la chiave ADB
  di ogni Mac prima che quest'ultimo possa controllare il dispositivo.

### Abilitare ADB tramite TCP

Per la configurazione iniziale, collegare il dispositivo Android tramite USB a un computer attendibile e approvare la
richiesta di debug. Quindi eseguire:

```bash
adb devices
adb tcpip 5555
```

Ora è possibile scollegare l'USB. Se la porta 5555 smette di restare in ascolto dopo il riavvio del dispositivo o il ripristino del debug,
ripetere questo passaggio di configurazione locale. Android 11 e versioni successive possono anche stabilire l'attendibilità iniziale con
**Wireless debugging > Pair device with pairing code** e `adb pair`.

### Consentire solo il Mac di controllo

Le tailnet con autorizzazioni restrittive devono consentire esplicitamente al Mac di controllo di raggiungere la porta TCP 5555
sul dispositivo Android. Aggiungere una regola circoscritta ai criteri della tailnet, sostituendo gli indirizzi di esempio
con gli IP Tailscale stabili dei due dispositivi:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

Vedere [le autorizzazioni Tailscale](https://tailscale.com/docs/reference/syntax/grants) per gli alias degli host e altri
selettori. Non consentire l'accesso a questa porta da Internet pubblico e non esporla con Funnel: un client ADB autorizzato
dispone di un ampio controllo sul dispositivo.

### Connettersi e avviare il mirroring

Sul Mac remoto:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

Il primo `adb connect` da questo Mac mostra una finestra di autorizzazione su Android. Sbloccare il dispositivo,
confermare l'impronta digitale della chiave e selezionare **Always allow from this computer** solo se il Mac è
attendibile. Una voce `adb devices` riuscita termina con `device`; `unauthorized` indica che la richiesta sul dispositivo
non è stata approvata.

Una volta aperta la finestra di scrcpy, utilizzarla direttamente oppure indirizzarla con uno strumento di automazione dello schermo macOS,
come [Peekaboo](https://peekaboo.sh/). scrcpy trasporta lo schermo e l'input; Tailscale fornisce soltanto il
percorso di rete privato.

### Risoluzione dei problemi

- `Connection timed out`: verificare l'autorizzazione della tailnet per TCP 5555. Un `tailscale ping` riuscito dimostra
  la raggiungibilità del peer, non che i criteri consentano questa porta TCP. Eseguire un test con
  `nc -vz <android-tailnet-ip> 5555` dal Mac.
- `unauthorized`: sbloccare Android e approvare la chiave ADB del Mac remoto, oppure rimuovere la workstation obsoleta
  in **Wireless debugging > Paired devices** ed eseguire nuovamente l'associazione.
- `Connection refused`: riconnettersi localmente ed eseguire di nuovo `adb tcpip 5555`.
- Sono elencati più dispositivi: mantenere l'argomento esplicito `--serial <android-tailnet-ip>:5555`.

Al termine, chiudere scrcpy e disconnettere ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Manuale operativo per la connessione

App Node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android si connette direttamente al WebSocket del Gateway e utilizza l'associazione del dispositivo (`role: node`).

Per Tailscale o gli host pubblici, Android richiede un endpoint sicuro:

- Opzione preferita: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- Supportato anche: qualsiasi altro URL del Gateway `wss://` con un endpoint TLS reale
- Il protocollo non crittografato `ws://` resta supportato sugli indirizzi LAN privati / host `.local`, oltre a `localhost`, `127.0.0.1` e il bridge dell'emulatore Android (`10.0.2.2`); la configurazione non loopback utilizza automaticamente un accesso operatore limitato

### Prerequisiti

- Gateway in esecuzione su un'altra macchina (o raggiungibile tramite SSH).
- Il dispositivo/emulatore Android può raggiungere il WebSocket del Gateway:
  - Sulla stessa LAN con mDNS/NSD, **oppure**
  - Sulla stessa tailnet Tailscale mediante Wide-Area Bonjour / DNS-SD unicast (vedere di seguito), **oppure**
  - Host/porta del Gateway manuali (ripiego)
- L'associazione mobile su tailnet/rete pubblica **non** utilizza endpoint `ws://` con IP tailnet non elaborato. Utilizzare invece Tailscale Serve o un altro URL `wss://`.
- La CLI `openclaw` disponibile sulla macchina del Gateway (o tramite SSH), per approvare le richieste di associazione.

### 1. Avviare il Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Verificare che nei log compaia qualcosa di simile:

- `listening on ws://0.0.0.0:18789`

Per l'accesso Android remoto tramite Tailscale, preferire Serve/Funnel anziché un'associazione diretta alla tailnet:

```bash
openclaw gateway --tailscale serve
```

Questo fornisce ad Android un endpoint sicuro `wss://` / `https://`. Una semplice configurazione `gateway.bind: "tailnet"` non è sufficiente per la prima associazione Android remota, a meno che TLS non venga terminato separatamente.

### 2. Verificare il rilevamento (facoltativo)

Dalla macchina del Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Ulteriori note per il debug: [Bonjour](/it/gateway/bonjour).

Se è stato configurato anche un dominio di rilevamento ad ampio raggio, confrontarlo con:

```bash
openclaw gateway discover --json
```

Questo mostra `local.` insieme al dominio ad ampio raggio configurato in un unico passaggio, utilizzando l'endpoint del servizio risolto anziché indicazioni basate solo su TXT.

#### Rilevamento tra reti tramite DNS-SD unicast

Il rilevamento NSD/mDNS di Android non attraversa le reti. Se il Node Android e il Gateway si trovano su reti diverse ma sono connessi tramite Tailscale, utilizzare invece Wide-Area Bonjour / DNS-SD unicast. Il solo rilevamento non è sufficiente per l'associazione Android su tailnet/rete pubblica: il percorso rilevato necessita comunque di un endpoint sicuro (`wss://` o Tailscale Serve):

1. Configurare una zona DNS-SD (ad esempio `openclaw.internal.`) sull'host del Gateway e pubblicare i record `_openclaw-gw._tcp`.
2. Configurare il DNS suddiviso di Tailscale per il dominio scelto, indirizzandolo a tale server DNS.

Dettagli ed esempio di configurazione CoreDNS: [Bonjour](/it/gateway/bonjour).

### 3. Connettersi da Android

Nell'app Android:

- L'app mantiene attiva la connessione al Gateway tramite un **foreground service** (notifica persistente).
- Aprire la scheda **Connect**.
- Utilizzare la modalità **Setup Code** o **Manual**.
- Se il rilevamento è bloccato, utilizzare manualmente host/porta in **Advanced controls**. Per gli host LAN privati, `ws://` continua a funzionare. Per gli host Tailscale/pubblici, attivare TLS e utilizzare un endpoint `wss://` / Tailscale Serve.

Dopo la prima associazione riuscita, Android si riconnette automaticamente all'avvio al Gateway associato attivo (secondo disponibilità per i Gateway rilevati, che devono essere visibili sulla rete).

I codici di configurazione ufficiali connettono Android come Node e concedono per impostazione predefinita l'accesso completo
dell'operatore al Gateway tramite `wss://`. La configurazione non loopback non crittografata `ws://`
utilizza automaticamente un accesso limitato per proteggere i bearer token. **Settings → Gateway**
mostra l'accesso **Full** o **Limited**. Per una connessione limitata, configurare
`wss://` o Tailscale Serve, generare un nuovo codice di accesso completo nella Control UI o
con `openclaw qr`, quindi scansionarlo o incollarlo in quella pagina e riconnettersi. Gli operatori
che desiderano il profilo ridotto possono selezionare **Limited access** nella Control UI o eseguire
`openclaw qr --limited`.

### Più Gateway

L'app conserva un registro di ogni Gateway con cui è stata associata, consentendo di passare dall'uno all'altro senza ripetere l'associazione:

- **Settings -> Gateways** elenca i Gateway associati e contrassegna quello attivo. Toccare una voce per passare a tale Gateway; l'app chiude le sessioni correnti e si riconnette al Gateway selezionato.
- La scheda **Connect** mostra un selettore rapido quando sono associati più Gateway.
- Credenziali, token dei dispositivi, attendibilità TLS, cronologia delle chat e messaggi offline in coda vengono archiviati separatamente per ogni Gateway. Il passaggio da un Gateway all'altro non mescola mai lo stato e i messaggi accodati durante il funzionamento offline vengono recapitati soltanto al Gateway per il quale sono stati scritti.
- **Forget** rimuove la voce del Gateway dal registro insieme alle relative credenziali, ai token dei dispositivi, al pin TLS e alle chat memorizzate nella cache.

### Beacon di presenza attiva

Dopo la connessione della sessione Node autenticata e quando l'app passa in background mentre il foreground service è ancora connesso, Android chiama `node.event` con `event: "node.presence.alive"`. Il Gateway registra queste informazioni come `lastSeenAtMs`/`lastSeenReason` nei metadati del Node/dispositivo associato solo dopo che è nota l'identità autenticata del dispositivo Node.

L'app considera il beacon registrato correttamente solo quando la risposta del Gateway include `handled: true`. I Gateway meno recenti possono confermare `node.event` con `{ "ok": true }`; tale risposta è compatibile ma non viene considerata un aggiornamento persistente dell'ultimo accesso.

### 4. Approvare l'associazione (CLI)

Sulla macchina del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Dettagli sull'associazione: [Associazione](/it/channels/pairing).

Facoltativo: se il nodo Android si connette sempre da una sottorete strettamente controllata, è possibile attivare l'approvazione automatica del nodo alla prima connessione mediante CIDR espliciti o indirizzi IP esatti:

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

Questa opzione è disabilitata per impostazione predefinita. Si applica solo alle nuove associazioni `role: node` senza ambiti richiesti. L'associazione di operatori/browser e qualsiasi modifica a ruolo, ambito, metadati o chiave pubblica richiede comunque l'approvazione manuale.

### 5. Verificare che il nodo sia connesso

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat e cronologia

La scheda Chat di Android supporta la selezione della sessione (la sessione predefinita `main` e le altre sessioni esistenti):

- Cronologia: `chat.history` (normalizzata per la visualizzazione: vengono rimossi i tag di direttiva inline, i payload XML in testo normale delle chiamate agli strumenti (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` e le relative varianti troncate) e i token di controllo del modello ASCII/a larghezza intera trapelati; le righe dell'assistente contenenti token silenziosi come gli esatti `NO_REPLY` / `no_reply` vengono omesse; le righe di dimensioni eccessive possono essere sostituite con segnaposto)
- Invio: `chat.send`
- Invio persistente: ogni invio (testo, immagini selezionate e messaggi vocali) viene registrato in una casella di uscita sul dispositivo specifica per ciascun Gateway prima di qualsiasi tentativo di rete, quindi la chiusura dell'app non può causare la perdita dell'input inviato. Gli invii accodati offline vengono consegnati in ordine alla riconnessione con chiavi di idempotenza stabili; un invio viene rimosso solo dopo che il turno diventa visibile nel `chat.history` canonico: una semplice conferma di ricezione non viene considerata una prova di consegna. Gli esiti ambigui (conferma persa, app terminata durante l'invio, riavvio del Gateway prima della scrittura della trascrizione) vengono mostrati come righe visibili con le opzioni esplicite **Riprova**/**Elimina**, anziché essere reinviati automaticamente. I comandi slash non vengono mai riprodotti automaticamente dopo una riconnessione, ma restano in attesa di un nuovo tentativo esplicito. La coda è limitata (50 messaggi e 48 MB di allegati per Gateway) e le righe non inviate scadono dopo 48 ore. Le bozze del compositore mai inviate non persistono tra i processi.
- Aggiornamenti push (best effort): `chat.subscribe` -> `event:"chat"`
- Ascolto: tenere premuto un messaggio dell'assistente e scegliere **Ascolta** per sentirlo; l'audio viene generato tramite `tts.speak` del Gateway usando la catena di provider TTS configurata; quando il Gateway non può generare l'audio, viene usato il TTS di sistema sul dispositivo. La riproduzione si interrompe quando si cambia sessione, si avvia una nuova chat, l'app passa in background o si chiude la chat.

### 7. Canvas e fotocamera

#### Host Canvas del Gateway (consigliato per i contenuti web)

Per fare in modo che il nodo mostri contenuti HTML/CSS/JS reali modificabili dall'agente sul disco, indirizzare il nodo all'host Canvas del Gateway.

<Note>
I nodi caricano il Canvas dal server HTTP del Gateway (la stessa porta di `gateway.port`, valore predefinito `18789`).
</Note>

1. Creare `~/.openclaw/workspace/canvas/index.html` sull'host del Gateway.
2. Indirizzare il nodo a tale risorsa (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facoltativo): se entrambi i dispositivi utilizzano Tailscale, usare un nome MagicDNS o un indirizzo IP della tailnet al posto di `.local`, ad esempio `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Questo server inserisce un client di ricaricamento in tempo reale nel codice HTML e ricarica la pagina quando i file cambiano. Il Gateway distribuisce anche `/__openclaw__/a2ui/`, ma l'app Android tratta le pagine A2UI remote come contenuti di sola visualizzazione. I comandi A2UI con azioni utilizzano la pagina A2UI inclusa e gestita dall'app.

Comandi Canvas (solo in primo piano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usare `{"url":""}` o `{"url":"/"}` per tornare alla struttura predefinita). `canvas.snapshot` restituisce `{ format, base64 }` (valore predefinito `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` è un alias legacy). Questi comandi utilizzano la pagina A2UI inclusa e gestita dall'app per il rendering con azioni.

Comandi della fotocamera (solo in primo piano; soggetti ad autorizzazione): `camera.snap` (jpg), `camera.clip` (mp4). Consultare [Nodo fotocamera](/it/nodes/camera) per i parametri e gli strumenti di supporto della CLI.

### 8. Voce e superficie estesa dei comandi Android

- Scheda Voce: Android dispone di due modalità di acquisizione esplicite. **Microfono** è una sessione manuale della scheda Voce che invia ogni pausa come turno di chat e si interrompe quando l'app lascia il primo piano o si esce dalla scheda Voce. **Conversazione** è la modalità Conversazione continua e resta in ascolto finché non viene disattivata o il nodo non si disconnette.
- Prima dell'inizio dell'acquisizione, la modalità Conversazione promuove il servizio in primo piano esistente da `connectedDevice` a `connectedDevice|microphone`, quindi lo declassa quando la modalità Conversazione termina. Il servizio del nodo dichiara `FOREGROUND_SERVICE_CONNECTED_DEVICE` con `CHANGE_NETWORK_STATE`; Android 14+ richiede inoltre la dichiarazione `FOREGROUND_SERVICE_MICROPHONE`, la concessione di runtime `RECORD_AUDIO` e il tipo di servizio microfono durante l'esecuzione.
- Per impostazione predefinita, la modalità Conversazione di Android usa il riconoscimento vocale nativo, la chat del Gateway e `talk.speak` tramite il provider Conversazione del Gateway configurato. Il TTS di sistema locale viene usato solo quando `talk.speak` non è disponibile.
- La modalità Conversazione di Android usa il relay in tempo reale del Gateway solo quando `talk.realtime.mode` è `realtime` e `talk.realtime.transport` è `gateway-relay`.
- Android non pubblicizza la funzionalità `voiceWake`. Usare **Microfono** o **Conversazione** per l'input vocale.
- Ulteriori famiglie di comandi Android (la disponibilità dipende dal dispositivo, dalle autorizzazioni e dalle impostazioni dell'utente):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` solo quando è abilitata l'opzione **Settings > Phone Capabilities > Installed Apps**; per impostazione predefinita elenca le app visibili nel launcher (passare `includeNonLaunchable` per ottenere l'elenco completo).
  - `notifications.list`, `notifications.actions` (consultare [Inoltro delle notifiche](#notification-forwarding) più avanti)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. File dello spazio di lavoro (sola lettura)

La panoramica Home include una scheda **File** che consente di esplorare lo spazio di lavoro dell'agente attivo tramite le RPC di sola lettura `agents.workspace.list` / `agents.workspace.get` del Gateway: navigazione nelle directory, anteprime di testo e immagini ed esportazione tramite il pannello di condivisione di Android. Non sono disponibili operazioni di scrittura e la dimensione delle anteprime è limitata dal Gateway.

## Esaminare le approvazioni dei comandi

Una connessione operatore con `operator.admin`, oppure una connessione
`operator.approvals` associata e selezionata esplicitamente dal Gateway, può esaminare
le richieste di esecuzione in sospeso in **Settings -> Approvals**. Prima di abilitare
i pulsanti, l'app carica il record di approvazione sanificato del Gateway, mostra
gli eventuali avvisi di sicurezza e le decisioni esatte offerte dalla richiesta, quindi invia
al Gateway l'ID di approvazione e il tipo di proprietario.

Lo stato di approvazione è condiviso con l'interfaccia di controllo e le superfici di chat supportate. La
prima risposta confermata prevale; Android mostra tale risultato canonico anche quando
un'altra superficie ha risposto per prima. Se una risposta di risoluzione viene persa o il Gateway
si disconnette, l'app mantiene l'azione bloccata e legge nuovamente l'approvazione
prima di offrire un'altra decisione.

I Gateway precedenti ai metodi di approvazione unificati ricorrono ai metodi
specifici per l'esecuzione già distribuiti. L'esame delle richieste in sospeso continua a funzionare, ma lo stato conservato del terminale
e il risultato più completo tra le diverse superfici richiedono un Gateway aggiornato.

## Punti di accesso dell'assistente

Android supporta l'avvio di OpenClaw tramite l'attivazione dell'assistente di sistema (Google Assistant). Tenendo premuto il pulsante Home (o usando un'altra attivazione `ACTION_ASSIST`) si apre l'app; pronunciando "Hey Google, ask OpenClaw `<prompt>`" viene riconosciuto il modello di query App Actions dichiarato dall'app e la richiesta viene inserita nel compositore della chat senza essere inviata automaticamente.

Questa funzione usa **App Actions** di Android (funzionalità `shortcuts.xml`) dichiarata nel manifest dell'app. Non è necessaria alcuna configurazione sul Gateway: l'intento dell'assistente viene gestito interamente dall'app Android.

<Note>
La disponibilità di App Actions dipende dal dispositivo, dalla versione di Google Play Services e dall'impostazione di OpenClaw come app assistente predefinita da parte dell'utente.
</Note>

## Inoltro delle notifiche

Android può inoltrare le notifiche del dispositivo al Gateway come elementi `node.event`. La configurazione avviene **sul dispositivo**, nel pannello Settings dell'app, non nella configurazione gateway/`openclaw.json`.

| Impostazione                | Descrizione                                                                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | Interruttore principale. Disattivato per impostazione predefinita; richiede prima la concessione di Notification Listener Access.                                                                            |
| Package Filter              | **Allowlist** (vengono inoltrati solo gli ID dei pacchetti elencati) o **Blocklist** (impostazione predefinita: tutti i pacchetti tranne gli ID elencati). Il pacchetto di OpenClaw è sempre escluso in modalità Blocklist per evitare cicli di inoltro. |
| Quiet Hours                 | Intervallo locale di inizio/fine in formato HH:mm durante il quale l'inoltro viene sospeso. Disabilitato per impostazione predefinita; una volta abilitato, i valori predefiniti sono `22:00`-`07:00`. |
| Max Events / Minute         | Limite per dispositivo alla frequenza delle notifiche inoltrate. Valore predefinito: 20.                                                                                                                     |
| Route Session Key           | Facoltativo. Vincola gli eventi delle notifiche inoltrate a una sessione specifica anziché alla destinazione di notifica predefinita del dispositivo.                                                        |

<Note>
L'inoltro delle notifiche richiede l'autorizzazione Notification Listener di Android. L'app ne richiede la concessione durante la configurazione.
</Note>

Le notifiche di WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord e Signal sono sempre escluse. I relativi messaggi sono già gestiti dalle sessioni native dei canali OpenClaw; inoltrare la notifica Android come evento separato del nodo potrebbe instradare una risposta nella conversazione errata.

## Argomenti correlati

- [App iOS](/it/platforms/ios)
- [Nodi](/it/nodes)
- [Risoluzione dei problemi del nodo Android](/it/nodes/troubleshooting)
