---
read_when:
    - Associazione o riconnessione del Node Android
    - Debug del rilevamento o dell'autenticazione del Gateway Android
    - Verifica della parità della cronologia delle chat tra i client
summary: 'App Android (Node): procedura operativa di connessione + interfaccia dei comandi Connetti/Chat/Voce/Canvas'
title: App Android
x-i18n:
    generated_at: "2026-04-30T09:00:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
L'app Android non è ancora stata rilasciata pubblicamente. Il codice sorgente è disponibile nel [repository OpenClaw](https://github.com/openclaw/openclaw) in `apps/android`. Puoi compilarla autonomamente usando Java 17 e l'Android SDK (`./gradlew :app:assemblePlayDebug`). Consulta [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) per le istruzioni di compilazione.
</Note>

## Riepilogo del supporto

- Ruolo: app nodo companion (Android non ospita il Gateway).
- Gateway richiesto: sì (eseguilo su macOS, Linux o Windows tramite WSL2).
- Installazione: [Primi passi](/it/start/getting-started) + [Associazione](/it/channels/pairing).
- Gateway: [Runbook](/it/gateway) + [Configurazione](/it/gateway/configuration).
  - Protocolli: [Protocollo Gateway](/it/gateway/protocol) (nodi + piano di controllo).

## Controllo di sistema

Il controllo di sistema (launchd/systemd) risiede sull'host del Gateway. Consulta [Gateway](/it/gateway).

## Runbook di connessione

App nodo Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android si connette direttamente al WebSocket del Gateway e usa l'associazione del dispositivo (`role: node`).

Per Tailscale o host pubblici, Android richiede un endpoint sicuro:

- Preferito: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- Supportato anche: qualsiasi altro URL Gateway `wss://` con un endpoint TLS reale
- `ws://` in chiaro resta supportato su indirizzi LAN privati / host `.local`, oltre a `localhost`, `127.0.0.1` e al bridge dell'emulatore Android (`10.0.2.2`)

### Prerequisiti

- Puoi eseguire il Gateway sulla macchina “master”.
- Il dispositivo/emulatore Android può raggiungere il WebSocket del gateway:
  - Stessa LAN con mDNS/NSD, **oppure**
  - Stessa tailnet Tailscale usando Wide-Area Bonjour / DNS-SD unicast (vedi sotto), **oppure**
  - Host/porta del gateway manuali (fallback)
- L'associazione mobile su tailnet/pubblica **non** usa endpoint IP tailnet grezzi `ws://`. Usa invece Tailscale Serve o un altro URL `wss://`.
- Puoi eseguire la CLI (`openclaw`) sulla macchina del gateway (o tramite SSH).

### 1) Avvia il Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Conferma nei log di vedere qualcosa come:

- `listening on ws://0.0.0.0:18789`

Per l'accesso Android remoto tramite Tailscale, preferisci Serve/Funnel invece di un bind tailnet grezzo:

```bash
openclaw gateway --tailscale serve
```

Questo fornisce ad Android un endpoint sicuro `wss://` / `https://`. Una configurazione semplice `gateway.bind: "tailnet"` non basta per la prima associazione Android remota, a meno che tu non termini anche TLS separatamente.

### 2) Verifica il rilevamento (facoltativo)

Dalla macchina del gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Altre note di debug: [Bonjour](/it/gateway/bonjour).

Se hai configurato anche un dominio di rilevamento wide-area, confrontalo con:

```bash
openclaw gateway discover --json
```

Mostra `local.` più il dominio wide-area configurato in un unico passaggio e usa l'endpoint del servizio risolto invece di suggerimenti solo TXT.

#### Rilevamento tailnet (Vienna ⇄ Londra) tramite DNS-SD unicast

Il rilevamento NSD/mDNS di Android non attraversa le reti. Se il nodo Android e il gateway sono su reti diverse ma connessi tramite Tailscale, usa invece Wide-Area Bonjour / DNS-SD unicast.

Il solo rilevamento non è sufficiente per l'associazione Android su tailnet/pubblica. La rotta rilevata richiede comunque un endpoint sicuro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (esempio `openclaw.internal.`) sull'host del gateway e pubblica i record `_openclaw-gw._tcp`.
2. Configura lo split DNS Tailscale per il dominio scelto, puntandolo a quel server DNS.

Dettagli e configurazione CoreDNS di esempio: [Bonjour](/it/gateway/bonjour).

### 3) Connettiti da Android

Nell'app Android:

- L'app mantiene attiva la connessione al gateway tramite un **servizio in primo piano** (notifica persistente).
- Apri la scheda **Connetti**.
- Usa la modalità **Codice di configurazione** o **Manuale**.
- Se il rilevamento è bloccato, usa host/porta manuali in **Controlli avanzati**. Per host LAN privati, `ws://` funziona ancora. Per host Tailscale/pubblici, attiva TLS e usa un endpoint `wss://` / Tailscale Serve.

Dopo la prima associazione riuscita, Android si riconnette automaticamente all'avvio:

- Endpoint manuale (se abilitato), altrimenti
- L'ultimo gateway rilevato (best-effort).

### Beacon di presenza attiva

Dopo la connessione della sessione nodo autenticata, e quando l'app passa in background mentre il servizio in primo piano è ancora connesso, Android chiama `node.event` con `event: "node.presence.alive"`. Il gateway lo registra come `lastSeenAtMs`/`lastSeenReason` nei metadati del nodo/dispositivo associato solo dopo che l'identità del dispositivo nodo autenticato è nota.

L'app considera il beacon registrato correttamente solo quando la risposta del gateway include `handled: true`. Gateway più vecchi possono confermare `node.event` con `{ "ok": true }`; quella risposta è compatibile ma non conta come aggiornamento persistente di last-seen.

### 4) Approva l'associazione (CLI)

Sulla macchina del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Dettagli sull'associazione: [Associazione](/it/channels/pairing).

Facoltativo: se il nodo Android si connette sempre da una sottorete strettamente controllata, puoi attivare l'approvazione automatica del primo nodo con CIDR espliciti o IP esatti:

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

È disabilitata per impostazione predefinita. Si applica solo a nuove associazioni `role: node` senza scope richiesti. L'associazione operatore/browser e qualsiasi modifica a ruolo, scope, metadati o chiave pubblica richiedono comunque l'approvazione manuale.

### 5) Verifica che il nodo sia connesso

- Tramite lo stato dei nodi:

  ```bash
  openclaw nodes status
  ```

- Tramite Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + cronologia

La scheda Chat di Android supporta la selezione della sessione (predefinita `main`, più altre sessioni esistenti):

- Cronologia: `chat.history` (normalizzata per la visualizzazione; i tag direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamata tool in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata tool troncati) e i token di controllo del modello ASCII/full-width trapelati vengono rimossi, le righe dell'assistente composte solo da token silenziosi come esattamente `NO_REPLY` / `no_reply` vengono omesse, e le righe sovradimensionate possono essere sostituite con segnaposto)
- Invio: `chat.send`
- Aggiornamenti push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + fotocamera

#### Host Canvas del Gateway (consigliato per contenuti web)

Se vuoi che il nodo mostri HTML/CSS/JS reale che l'agente può modificare su disco, punta il nodo all'host canvas del Gateway.

<Note>
I nodi caricano il canvas dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).
</Note>

1. Crea `~/.openclaw/workspace/canvas/index.html` sull'host del gateway.

2. Porta il nodo a quell'URL (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facoltativo): se entrambi i dispositivi sono su Tailscale, usa un nome MagicDNS o un IP tailnet invece di `.local`, ad esempio `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Questo server inserisce un client live-reload nell'HTML e ricarica quando i file cambiano.
L'host A2UI si trova in `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandi canvas (solo in primo piano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` per tornare allo scaffold predefinito). `canvas.snapshot` restituisce `{ format, base64 }` (predefinito `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias legacy)

Comandi fotocamera (solo in primo piano; vincolati ai permessi):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulta [Nodo fotocamera](/it/nodes/camera) per parametri e helper CLI.

### 8) Voce + superficie comandi Android estesa

- Scheda Voce: Android ha due modalità di acquisizione esplicite. **Mic** è una sessione manuale della scheda Voce che invia ogni pausa come turno di chat e si interrompe quando l'app lascia il primo piano o l'utente lascia la scheda Voce. **Talk** è la modalità Talk continua e continua ad ascoltare finché non viene disattivata o il nodo si disconnette.
- La modalità Talk promuove il servizio in primo piano esistente da `dataSync` a `dataSync|microphone` prima dell'avvio dell'acquisizione, poi lo retrocede quando la modalità Talk si ferma. Android 14+ richiede la dichiarazione `FOREGROUND_SERVICE_MICROPHONE`, la concessione runtime `RECORD_AUDIO` e il tipo di servizio microfono a runtime.
- Le risposte parlate usano `talk.speak` tramite il provider Talk configurato del gateway. Il TTS di sistema locale viene usato solo quando `talk.speak` non è disponibile.
- Il wake vocale rimane disabilitato nell'UX/runtime Android.
- Famiglie aggiuntive di comandi Android (la disponibilità dipende da dispositivo + permessi):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (vedi [Inoltro notifiche](#notification-forwarding) sotto)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Punti di ingresso dell'assistente

Android supporta l'avvio di OpenClaw dal trigger dell'assistente di sistema (Google Assistant). Quando configurato, tenere premuto il pulsante Home o dire "Hey Google, ask OpenClaw..." apre l'app e passa il prompt nel compositore della chat.

Questo usa i metadati **App Actions** di Android dichiarati nel manifest dell'app. Non è necessaria alcuna configurazione aggiuntiva lato gateway: l'intent dell'assistente viene gestito interamente dall'app Android e inoltrato come normale messaggio di chat.

<Note>
La disponibilità di App Actions dipende dal dispositivo, dalla versione di Google Play Services e dal fatto che l'utente abbia impostato OpenClaw come app assistente predefinita.
</Note>

## Inoltro notifiche

Android può inoltrare le notifiche del dispositivo al gateway come eventi. Diversi controlli consentono di definire quali notifiche vengono inoltrate e quando.

| Chiave                           | Tipo           | Descrizione                                                                                                      |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Inoltra solo le notifiche provenienti da questi nomi di pacchetto. Se impostato, tutti gli altri pacchetti vengono ignorati. |
| `notifications.denyPackages`     | string[]       | Non inoltrare mai notifiche provenienti da questi nomi di pacchetto. Applicato dopo `allowPackages`.             |
| `notifications.quietHours.start` | string (HH:mm) | Inizio della finestra di ore silenziose (ora locale del dispositivo). Le notifiche vengono soppresse durante questa finestra. |
| `notifications.quietHours.end`   | string (HH:mm) | Fine della finestra di ore silenziose.                                                                           |
| `notifications.rateLimit`        | number         | Numero massimo di notifiche inoltrate per pacchetto al minuto. Le notifiche in eccesso vengono eliminate.        |

Il selettore delle notifiche usa anche un comportamento più sicuro per gli eventi di notifica inoltrati, prevenendo l'inoltro accidentale di notifiche di sistema sensibili.

Configurazione di esempio:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
L'inoltro notifiche richiede il permesso Android Notification Listener. L'app lo richiede durante la configurazione.
</Note>

## Correlati

- [App iOS](/it/platforms/ios)
- [Nodi](/it/nodes)
- [Risoluzione dei problemi del nodo Android](/it/nodes/troubleshooting)
