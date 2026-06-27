---
read_when:
    - Associazione o riconnessione del nodo Android
    - Debug della discovery o dell'autenticazione del Gateway Android
    - Verifica della parità della cronologia chat tra client
summary: 'App Android (nodo): runbook per la connessione + superficie dei comandi Connetti/Chat/Voce/Canvas'
title: App Android
x-i18n:
    generated_at: "2026-06-27T17:44:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
L'app Android ufficiale è disponibile su [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). È un nodo companion e richiede un OpenClaw Gateway in esecuzione. Il codice sorgente è disponibile anche nel [repository OpenClaw](https://github.com/openclaw/openclaw) sotto `apps/android`; vedi [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) per le istruzioni di build.
</Note>

## Snapshot del supporto

- Ruolo: app nodo companion (Android non ospita il Gateway).
- Gateway richiesto: sì (eseguilo su macOS, Linux o Windows tramite WSL2).
- Installazione: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) per l'app, [Guida introduttiva](/it/start/getting-started) per il Gateway, poi [Abbinamento](/it/channels/pairing).
- Gateway: [Runbook](/it/gateway) + [Configurazione](/it/gateway/configuration).
  - Protocolli: [Protocollo Gateway](/it/gateway/protocol) (nodi + piano di controllo).

## Controllo di sistema

Il controllo di sistema (launchd/systemd) risiede sull'host del Gateway. Vedi [Gateway](/it/gateway).

## Runbook di connessione

App nodo Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android si connette direttamente al WebSocket del Gateway e usa l'abbinamento del dispositivo (`role: node`).

Per Tailscale o host pubblici, Android richiede un endpoint sicuro:

- Preferito: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- Supportato anche: qualsiasi altro URL Gateway `wss://` con un endpoint TLS reale
- `ws://` in chiaro resta supportato su indirizzi LAN privati / host `.local`, più `localhost`, `127.0.0.1` e il bridge dell'emulatore Android (`10.0.2.2`)

### Prerequisiti

- Puoi eseguire il Gateway sulla macchina "master".
- Il dispositivo/emulatore Android può raggiungere il WebSocket del Gateway:
  - Stessa LAN con mDNS/NSD, **oppure**
  - Stessa tailnet Tailscale usando Wide-Area Bonjour / DNS-SD unicast (vedi sotto), **oppure**
  - Host/porta del gateway manuali (fallback)
- L'abbinamento mobile tailnet/pubblico **non** usa endpoint IP tailnet grezzi `ws://`. Usa invece Tailscale Serve o un altro URL `wss://`.
- Puoi eseguire la CLI (`openclaw`) sulla macchina gateway (o tramite SSH).

### 1) Avvia il Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Conferma nei log di vedere qualcosa come:

- `listening on ws://0.0.0.0:18789`

Per l'accesso Android remoto su Tailscale, preferisci Serve/Funnel invece di un bind tailnet grezzo:

```bash
openclaw gateway --tailscale serve
```

Questo fornisce ad Android un endpoint sicuro `wss://` / `https://`. Una semplice configurazione `gateway.bind: "tailnet"` non basta per il primo abbinamento Android remoto, a meno che tu non termini anche TLS separatamente.

### 2) Verifica il rilevamento (opzionale)

Dalla macchina gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Altre note di debug: [Bonjour](/it/gateway/bonjour).

Se hai configurato anche un dominio di rilevamento wide-area, confronta con:

```bash
openclaw gateway discover --json
```

Mostra `local.` più il dominio wide-area configurato in un unico passaggio e usa l'endpoint
di servizio risolto invece di suggerimenti solo TXT.

#### Rilevamento tailnet (Vienna ⇄ Londra) tramite DNS-SD unicast

Il rilevamento NSD/mDNS di Android non attraversa le reti. Se il nodo Android e il gateway sono su reti diverse ma connessi tramite Tailscale, usa invece Wide-Area Bonjour / DNS-SD unicast.

Il solo rilevamento non è sufficiente per l'abbinamento Android tailnet/pubblico. La route rilevata richiede comunque un endpoint sicuro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (esempio `openclaw.internal.`) sull'host gateway e pubblica record `_openclaw-gw._tcp`.
2. Configura il DNS split di Tailscale per il dominio scelto, puntandolo a quel server DNS.

Dettagli ed esempio di configurazione CoreDNS: [Bonjour](/it/gateway/bonjour).

### 3) Connettiti da Android

Nell'app Android:

- L'app mantiene attiva la connessione al gateway tramite un **servizio in primo piano** (notifica persistente).
- Apri la scheda **Connetti**.
- Usa la modalità **Codice di configurazione** o **Manuale**.
- Se il rilevamento è bloccato, usa host/porta manuali in **Controlli avanzati**. Per host LAN privati, `ws://` funziona ancora. Per host Tailscale/pubblici, attiva TLS e usa un endpoint `wss://` / Tailscale Serve.

Dopo il primo abbinamento riuscito, Android si riconnette automaticamente all'avvio:

- Endpoint manuale (se abilitato), altrimenti
- L'ultimo gateway rilevato (best-effort).

### Beacon di presenza attiva

Dopo che la sessione del nodo autenticato si connette, e quando l'app passa in background mentre il
servizio in primo piano è ancora connesso, Android chiama `node.event` con
`event: "node.presence.alive"`. Il gateway lo registra come `lastSeenAtMs`/`lastSeenReason` sui
metadati del nodo/dispositivo abbinato solo dopo che l'identità del dispositivo nodo autenticato è nota.

L'app considera il beacon registrato correttamente solo quando la risposta del gateway include
`handled: true`. Gateway più vecchi possono confermare `node.event` con `{ "ok": true }`; quella risposta è
compatibile ma non conta come aggiornamento persistente dell'ultimo visto.

### 4) Approva l'abbinamento (CLI)

Sulla macchina gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Dettagli sull'abbinamento: [Abbinamento](/it/channels/pairing).

Opzionale: se il nodo Android si connette sempre da una subnet strettamente controllata,
puoi abilitare la prima approvazione automatica del nodo con CIDR espliciti o IP esatti:

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

È disabilitato per impostazione predefinita. Si applica solo a nuovi abbinamenti `role: node` senza
scope richiesti. L'abbinamento operatore/browser e qualsiasi modifica di ruolo, scope, metadati o
chiave pubblica richiedono comunque l'approvazione manuale.

### 5) Verifica che il nodo sia connesso

- Tramite stato dei nodi:

  ```bash
  openclaw nodes status
  ```

- Tramite Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + cronologia

La scheda Chat di Android supporta la selezione della sessione (predefinita `main`, più altre sessioni esistenti):

- Cronologia: `chat.history` (normalizzata per la visualizzazione; i tag direttiva inline vengono
  rimossi dal testo visibile, i payload XML di chiamate tool in testo semplice (inclusi
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocchi di chiamate tool troncati) e i token di controllo del modello ASCII/full-width trapelati
  vengono rimossi, le righe assistant di soli token silenziosi come esattamente `NO_REPLY` /
  `no_reply` vengono omesse, e le righe sovradimensionate possono essere sostituite con placeholder)
- Invio: `chat.send`
- Aggiornamenti push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + fotocamera

#### Host Canvas del Gateway (consigliato per contenuti web)

Se vuoi che il nodo mostri HTML/CSS/JS reale che l'agente può modificare su disco, punta il nodo all'host canvas del Gateway.

<Note>
I nodi caricano il canvas dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).
</Note>

1. Crea `~/.openclaw/workspace/canvas/index.html` sull'host gateway.

2. Naviga il nodo lì (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opzionale): se entrambi i dispositivi sono su Tailscale, usa un nome MagicDNS o un IP tailnet invece di `.local`, ad esempio `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Questo server inietta un client live-reload nell'HTML e ricarica alle modifiche dei file.
Il Gateway serve anche `/__openclaw__/a2ui/`, ma l'app Android tratta le pagine A2UI remote come solo rendering. I comandi A2UI con azioni usano la pagina A2UI inclusa e di proprietà dell'app prima di applicare i messaggi.

Comandi canvas (solo in primo piano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` per tornare allo scaffold predefinito). `canvas.snapshot` restituisce `{ format, base64 }` (`format="jpeg"` predefinito).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias legacy). Questi comandi usano la pagina A2UI inclusa e di proprietà dell'app per il rendering con azioni.

Comandi fotocamera (solo in primo piano; protetti da permesso):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Vedi [Nodo fotocamera](/it/nodes/camera) per parametri e helper CLI.

### 8) Voce + superficie comandi Android estesa

- Scheda Voce: Android ha due modalità di acquisizione esplicite. **Mic** è una sessione manuale della scheda Voce che invia ogni pausa come turno di chat e si interrompe quando l'app lascia il primo piano o l'utente lascia la scheda Voce. **Talk** è la modalità Talk continua e continua ad ascoltare finché non viene disattivata o il nodo si disconnette.
- La modalità Talk promuove il servizio in primo piano esistente da `connectedDevice` a `connectedDevice|microphone` prima dell'inizio dell'acquisizione, poi lo retrocede quando la modalità Talk si arresta. Il servizio del nodo dichiara `FOREGROUND_SERVICE_CONNECTED_DEVICE` con `CHANGE_NETWORK_STATE`; Android 14+ richiede anche la dichiarazione `FOREGROUND_SERVICE_MICROPHONE`, la concessione runtime `RECORD_AUDIO` e il tipo di servizio microfono a runtime.
- Per impostazione predefinita, Talk di Android usa il riconoscimento vocale nativo, la chat del Gateway e `talk.speak` tramite il provider Talk del gateway configurato. Il TTS di sistema locale viene usato solo quando `talk.speak` non è disponibile.
- Talk di Android usa il relay realtime del Gateway solo quando `talk.realtime.mode` è `realtime` e `talk.realtime.transport` è `gateway-relay`.
- Il wake vocale resta disabilitato nella UX/runtime Android.
- Famiglie di comandi Android aggiuntive (la disponibilità dipende da dispositivo, permessi e impostazioni utente):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` solo quando **Impostazioni > Capacità telefono > App installate** è abilitato; per impostazione predefinita elenca le app visibili nel launcher.
  - `notifications.list`, `notifications.actions` (vedi [Inoltro notifiche](#notification-forwarding) sotto)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Entry point dell'assistant

Android supporta l'avvio di OpenClaw dal trigger dell'assistant di sistema (Google
Assistant). Quando configurato, tenere premuto il pulsante Home o dire "Hey Google, ask
OpenClaw..." apre l'app e passa il prompt nel compositore della chat.

Questo usa i metadati **App Actions** di Android dichiarati nel manifest dell'app. Non è
necessaria alcuna configurazione extra lato gateway: l'intent dell'assistant è
gestito interamente dall'app Android e inoltrato come normale messaggio di chat.

<Note>
La disponibilità di App Actions dipende dal dispositivo, dalla versione di Google Play Services
e dal fatto che l'utente abbia impostato OpenClaw come app assistant predefinita.
</Note>

## Inoltro notifiche

Android può inoltrare le notifiche del dispositivo al gateway come eventi. Diversi controlli consentono di definire quali notifiche vengono inoltrate e quando.

| Chiave                           | Tipo           | Descrizione                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Inoltra solo le notifiche da questi nomi di pacchetto. Se impostato, tutti gli altri pacchetti vengono ignorati. |
| `notifications.denyPackages`     | string[]       | Non inoltrare mai notifiche da questi nomi di pacchetto. Applicato dopo `allowPackages`.          |
| `notifications.quietHours.start` | string (HH:mm) | Inizio della finestra delle ore silenziose (ora locale del dispositivo). Le notifiche vengono soppresse durante questa finestra. |
| `notifications.quietHours.end`   | string (HH:mm) | Fine della finestra delle ore silenziose.                                                         |
| `notifications.rateLimit`        | number         | Numero massimo di notifiche inoltrate per pacchetto al minuto. Le notifiche in eccesso vengono scartate. |

Il selettore delle notifiche usa anche un comportamento più sicuro per gli eventi di notifica inoltrati, impedendo l'inoltro accidentale di notifiche di sistema sensibili.

Esempio di configurazione:

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
L'inoltro delle notifiche richiede l'autorizzazione Android Notification Listener. L'app la richiede durante la configurazione.
</Note>

## Correlati

- [App iOS](/it/platforms/ios)
- [Nodi](/it/nodes)
- [Risoluzione dei problemi del nodo Android](/it/nodes/troubleshooting)
