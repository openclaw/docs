---
read_when:
    - Pairing o riconnessione del Node Android
    - Debug di discovery o auth del gateway Android
    - Verifica della parità della cronologia chat tra client
summary: 'App Android (Node): runbook di connessione + superficie dei comandi Connect/Chat/Voice/Canvas'
title: App Android
x-i18n:
    generated_at: "2026-04-24T08:49:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **Nota:** L'app Android non è ancora stata rilasciata pubblicamente. Il codice sorgente è disponibile nel [repository OpenClaw](https://github.com/openclaw/openclaw) sotto `apps/android`. Puoi compilarla autonomamente usando Java 17 e Android SDK (`./gradlew :app:assemblePlayDebug`). Vedi [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) per le istruzioni di build.

## Stato del supporto

- Ruolo: app Node companion (Android non ospita il Gateway).
- Gateway richiesto: sì (eseguilo su macOS, Linux o Windows tramite WSL2).
- Installazione: [Getting Started](/it/start/getting-started) + [Pairing](/it/channels/pairing).
- Gateway: [Runbook](/it/gateway) + [Configuration](/it/gateway/configuration).
  - Protocolli: [Gateway protocol](/it/gateway/protocol) (Node + control plane).

## Controllo di sistema

Il controllo di sistema (launchd/systemd) risiede sull'host Gateway. Vedi [Gateway](/it/gateway).

## Runbook di connessione

App Node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android si connette direttamente al WebSocket del Gateway e usa il pairing del dispositivo (`role: node`).

Per host Tailscale o pubblici, Android richiede un endpoint sicuro:

- Preferito: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- Supportato anche: qualsiasi altro URL Gateway `wss://` con un endpoint TLS reale
- Il `ws://` in chiaro continua a essere supportato su indirizzi LAN privati / host `.local`, più `localhost`, `127.0.0.1` e il bridge dell'emulatore Android (`10.0.2.2`)

### Prerequisiti

- Puoi eseguire il Gateway sulla macchina “master”.
- Il dispositivo/emulatore Android può raggiungere il WebSocket del gateway:
  - stessa LAN con mDNS/NSD, **oppure**
  - stessa tailnet Tailscale usando Wide-Area Bonjour / unicast DNS-SD (vedi sotto), **oppure**
  - host/porta del gateway configurati manualmente (fallback)
- Il pairing mobile tailnet/pubblico **non** usa endpoint raw `ws://` su IP tailnet. Usa invece Tailscale Serve o un altro URL `wss://`.
- Puoi eseguire la CLI (`openclaw`) sulla macchina gateway (o via SSH).

### 1) Avvia il Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Conferma nei log di vedere qualcosa del tipo:

- `listening on ws://0.0.0.0:18789`

Per l'accesso remoto Android tramite Tailscale, preferisci Serve/Funnel invece di un bind raw tailnet:

```bash
openclaw gateway --tailscale serve
```

Questo fornisce ad Android un endpoint sicuro `wss://` / `https://`. Una semplice configurazione `gateway.bind: "tailnet"` non basta per il primo pairing remoto Android, a meno che tu non termini TLS separatamente.

### 2) Verifica il discovery (facoltativo)

Dalla macchina gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Altre note di debug: [Bonjour](/it/gateway/bonjour).

Se hai configurato anche un dominio di discovery wide-area, confronta con:

```bash
openclaw gateway discover --json
```

Questo mostra `local.` più il dominio wide-area configurato in un solo passaggio e usa l'endpoint di servizio risolto invece dei soli suggerimenti TXT.

#### Discovery tailnet (Vienna ⇄ Londra) tramite unicast DNS-SD

Il discovery Android NSD/mDNS non attraversa le reti. Se il tuo Node Android e il gateway sono su reti diverse ma collegati tramite Tailscale, usa Wide-Area Bonjour / unicast DNS-SD.

Il discovery da solo non è sufficiente per il pairing Android tailnet/pubblico. Il percorso rilevato richiede comunque un endpoint sicuro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (esempio `openclaw.internal.`) sull'host gateway e pubblica record `_openclaw-gw._tcp`.
2. Configura Tailscale split DNS per il dominio scelto puntando a quel server DNS.

Dettagli ed esempio di configurazione CoreDNS: [Bonjour](/it/gateway/bonjour).

### 3) Connettiti da Android

Nell'app Android:

- L'app mantiene viva la connessione al gateway tramite un **foreground service** (notifica persistente).
- Apri la scheda **Connect**.
- Usa la modalità **Setup Code** o **Manual**.
- Se il discovery è bloccato, usa host/porta manuali nei **controlli avanzati**. Per host LAN privati, `ws://` continua a funzionare. Per host Tailscale/pubblici, attiva TLS e usa un endpoint `wss://` / Tailscale Serve.

Dopo il primo pairing riuscito, Android si riconnette automaticamente all'avvio:

- endpoint manuale (se abilitato), altrimenti
- ultimo gateway rilevato (best-effort).

### 4) Approva il pairing (CLI)

Sulla macchina gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Dettagli del pairing: [Pairing](/it/channels/pairing).

### 5) Verifica che il Node sia connesso

- Tramite stato dei Node:

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
  rimossi dal testo visibile, i payload XML delle chiamate agli strumenti in testo semplice (inclusi
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocchi di chiamata agli strumenti troncati) e i token di controllo del modello ASCII/full-width trapelati
  vengono rimossi, le righe pure dell'assistente con token silenzioso come `NO_REPLY` /
  `no_reply` esatti vengono omesse e le righe troppo grandi possono essere sostituite con segnaposto)
- Invio: `chat.send`
- Aggiornamenti push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + fotocamera

#### Gateway Canvas Host (consigliato per contenuti web)

Se vuoi che il Node mostri vero HTML/CSS/JS che l'agente può modificare su disco, punta il Node all'host canvas del Gateway.

Nota: i Node caricano il canvas dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).

1. Crea `~/.openclaw/workspace/canvas/index.html` sull'host gateway.

2. Naviga il Node verso di esso (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facoltativo): se entrambi i dispositivi sono su Tailscale, usa un nome MagicDNS o un IP tailnet invece di `.local`, ad esempio `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Questo server inietta un client live-reload nell'HTML e ricarica ai cambiamenti del file.
L'host A2UI si trova in `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandi canvas (solo foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` oppure `{"url":"/"}` per tornare allo scaffold predefinito). `canvas.snapshot` restituisce `{ format, base64 }` (predefinito `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legacy `canvas.a2ui.pushJSONL`)

Comandi fotocamera (solo foreground; soggetti a permessi):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Vedi [Camera node](/it/nodes/camera) per parametri e helper CLI.

### 8) Voice + superficie estesa dei comandi Android

- Voice: Android usa un unico flusso microfono on/off nella scheda Voice con acquisizione della trascrizione e riproduzione `talk.speak`. Il TTS locale di sistema viene usato solo quando `talk.speak` non è disponibile. Voice si interrompe quando l'app lascia il foreground.
- I toggle wake/talk-mode di Voice sono attualmente rimossi da UX/runtime Android.
- Famiglie di comandi Android aggiuntive (la disponibilità dipende da dispositivo + permessi):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (vedi [Notification forwarding](#notification-forwarding) sotto)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Entry point dell'assistente

Android supporta l'avvio di OpenClaw dal trigger dell'assistente di sistema (Google
Assistant). Quando configurato, tenendo premuto il tasto home o dicendo "Hey Google, ask
OpenClaw..." si apre l'app e il prompt viene passato al composer della chat.

Questo usa i metadati Android **App Actions** dichiarati nel manifest dell'app. Non
serve alcuna configurazione aggiuntiva sul lato gateway -- l'intent dell'assistente viene
gestito interamente dall'app Android e inoltrato come normale messaggio chat.

<Note>
La disponibilità di App Actions dipende dal dispositivo, dalla versione di Google Play Services
e dal fatto che l'utente abbia impostato OpenClaw come app assistente predefinita.
</Note>

## Inoltro delle notifiche

Android può inoltrare le notifiche del dispositivo al gateway come eventi. Diversi controlli ti permettono di definire l'ambito di quali notifiche vengono inoltrate e quando.

| Chiave                           | Tipo           | Descrizione                                                                                     |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Inoltra notifiche solo da questi nomi di pacchetto. Se impostato, tutti gli altri pacchetti vengono ignorati. |
| `notifications.denyPackages`     | string[]       | Non inoltrare mai notifiche da questi nomi di pacchetto. Applicato dopo `allowPackages`.       |
| `notifications.quietHours.start` | string (HH:mm) | Inizio della finestra di quiet hours (ora locale del dispositivo). Le notifiche vengono soppresse durante questa finestra. |
| `notifications.quietHours.end`   | string (HH:mm) | Fine della finestra di quiet hours.                                                             |
| `notifications.rateLimit`        | number         | Numero massimo di notifiche inoltrate per pacchetto al minuto. Le notifiche in eccesso vengono scartate. |

Il selettore di notifiche usa anche un comportamento più sicuro per gli eventi di notifica inoltrati, prevenendo l'inoltro accidentale di notifiche di sistema sensibili.

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
L'inoltro delle notifiche richiede il permesso Android Notification Listener. L'app lo richiede durante la configurazione.
</Note>

## Correlati

- [App iOS](/it/platforms/ios)
- [Nodes](/it/nodes)
- [Risoluzione dei problemi del Node Android](/it/nodes/troubleshooting)
