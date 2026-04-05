---
read_when:
    - Pairing o riconnessione del nodo Android
    - Debug del rilevamento del gateway o dell'autenticazione su Android
    - Verifica della parità della cronologia chat tra i client
summary: 'App Android (nodo): runbook di connessione + superficie dei comandi Connect/Chat/Voice/Canvas'
title: App Android
x-i18n:
    generated_at: "2026-04-05T13:58:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2223891afc3aa34af4aaf5410b4f1c6aebcf24bab68a6c47dd9832882d5260db
    source_path: platforms/android.md
    workflow: 15
---

# App Android (nodo)

> **Nota:** L'app Android non è ancora stata rilasciata pubblicamente. Il codice sorgente è disponibile nel [repository OpenClaw](https://github.com/openclaw/openclaw) in `apps/android`. Puoi compilarla tu stesso usando Java 17 e l'Android SDK (`./gradlew :app:assemblePlayDebug`). Vedi [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) per le istruzioni di build.

## Panoramica del supporto

- Ruolo: app nodo complementare (Android non ospita il Gateway).
- Gateway richiesto: sì (eseguilo su macOS, Linux o Windows tramite WSL2).
- Installazione: [Per iniziare](/start/getting-started) + [Pairing](/it/channels/pairing).
- Gateway: [Runbook](/gateway) + [Configurazione](/gateway/configuration).
  - Protocolli: [Protocollo Gateway](/gateway/protocol) (nodi + piano di controllo).

## Controllo del sistema

Il controllo del sistema (launchd/systemd) risiede sull'host Gateway. Vedi [Gateway](/gateway).

## Runbook di connessione

App nodo Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android si connette direttamente al WebSocket del Gateway e usa il pairing del dispositivo (`role: node`).

Per Tailscale o host pubblici, Android richiede un endpoint sicuro:

- Preferito: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- Supportato anche: qualsiasi altro URL Gateway `wss://` con un vero endpoint TLS
- `ws://` in chiaro continua a essere supportato su indirizzi LAN privati / host `.local`, oltre a `localhost`, `127.0.0.1` e al bridge dell'emulatore Android (`10.0.2.2`)

### Prerequisiti

- Puoi eseguire il Gateway sulla macchina “master”.
- Il dispositivo/emulatore Android può raggiungere il WebSocket del gateway:
  - Stessa LAN con mDNS/NSD, **oppure**
  - Stessa tailnet Tailscale usando Wide-Area Bonjour / unicast DNS-SD (vedi sotto), **oppure**
  - Host/porta del gateway inseriti manualmente (fallback)
- Il pairing mobile tailnet/pubblico **non** usa endpoint raw `ws://` su IP tailnet. Usa invece Tailscale Serve o un altro URL `wss://`.
- Puoi eseguire la CLI (`openclaw`) sulla macchina gateway (o tramite SSH).

### 1) Avvia il Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Conferma nei log di vedere qualcosa come:

- `listening on ws://0.0.0.0:18789`

Per l'accesso Android remoto tramite Tailscale, preferisci Serve/Funnel invece di un bind tailnet raw:

```bash
openclaw gateway --tailscale serve
```

Questo fornisce ad Android un endpoint sicuro `wss://` / `https://`. Una semplice configurazione `gateway.bind: "tailnet"` non è sufficiente per il primo pairing Android remoto, a meno che tu non termini anche TLS separatamente.

### 2) Verifica il rilevamento (opzionale)

Dalla macchina gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Altre note di debug: [Bonjour](/gateway/bonjour).

Se hai configurato anche un dominio di discovery wide-area, confrontalo con:

```bash
openclaw gateway discover --json
```

Questo mostra `local.` più il dominio wide-area configurato in un solo passaggio e usa l'endpoint del
servizio risolto invece dei soli suggerimenti TXT.

#### Rilevamento tailnet (Vienna ⇄ Londra) tramite unicast DNS-SD

Il rilevamento Android NSD/mDNS non attraversa le reti. Se il tuo nodo Android e il gateway sono su reti diverse ma collegati tramite Tailscale, usa Wide-Area Bonjour / unicast DNS-SD.

Il solo rilevamento non è sufficiente per il pairing Android tailnet/pubblico. Il percorso rilevato richiede comunque un endpoint sicuro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (esempio `openclaw.internal.`) sull'host gateway e pubblica i record `_openclaw-gw._tcp`.
2. Configura Tailscale split DNS per il dominio scelto puntando a quel server DNS.

Dettagli ed esempio di configurazione CoreDNS: [Bonjour](/gateway/bonjour).

### 3) Connettiti da Android

Nell'app Android:

- L'app mantiene attiva la connessione al gateway tramite un **foreground service** (notifica persistente).
- Apri la scheda **Connect**.
- Usa la modalità **Setup Code** o **Manual**.
- Se il rilevamento è bloccato, usa host/porta manuali nei **controlli avanzati**. Per host LAN privati, `ws://` continua a funzionare. Per host Tailscale/pubblici, attiva TLS e usa un endpoint `wss://` / Tailscale Serve.

Dopo il primo pairing riuscito, Android si riconnette automaticamente all'avvio:

- Endpoint manuale (se abilitato), altrimenti
- Ultimo gateway rilevato (best-effort).

### 4) Approva il pairing (CLI)

Sulla macchina gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Dettagli sul pairing: [Pairing](/it/channels/pairing).

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

- Cronologia: `chat.history` (normalizzata per la visualizzazione; i tag di direttiva inline vengono
  rimossi dal testo visibile, i payload XML plain-text delle chiamate tool (inclusi
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocchi di chiamata tool troncati) e i token di controllo del modello ASCII/full-width trapelati
  vengono rimossi, le righe dell'assistente composte esclusivamente da token silenziosi come esatto `NO_REPLY` /
  `no_reply` vengono omesse e le righe troppo grandi possono essere sostituite da segnaposto)
- Invio: `chat.send`
- Aggiornamenti push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + fotocamera

#### Gateway Canvas Host (consigliato per contenuti web)

Se vuoi che il nodo mostri vero HTML/CSS/JS che l'agente può modificare su disco, punta il nodo al canvas host del Gateway.

Nota: i nodi caricano il canvas dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).

1. Crea `~/.openclaw/workspace/canvas/index.html` sull'host gateway.

2. Naviga il nodo verso di esso (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opzionale): se entrambi i dispositivi sono su Tailscale, usa un nome MagicDNS o un IP tailnet invece di `.local`, ad esempio `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Questo server inietta un client di live-reload nell'HTML e ricarica quando i file cambiano.
L'host A2UI si trova in `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandi canvas (solo foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` per tornare allo scaffold predefinito). `canvas.snapshot` restituisce `{ format, base64 }` (predefinito `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legacy `canvas.a2ui.pushJSONL`)

Comandi fotocamera (solo foreground; controllati dai permessi):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Vedi [Nodo fotocamera](/nodes/camera) per parametri e helper CLI.

### 8) Voice + superficie dei comandi Android ampliata

- Voce: Android usa un unico flusso microfono on/off nella scheda Voice con acquisizione della trascrizione e riproduzione `talk.speak`. Il TTS di sistema locale viene usato solo quando `talk.speak` non è disponibile. La voce si interrompe quando l'app esce dal foreground.
- I toggle Voice wake/talk-mode sono attualmente rimossi dalla UX/runtime Android.
- Famiglie di comandi Android aggiuntive (la disponibilità dipende dal dispositivo + dai permessi):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (vedi [Inoltro delle notifiche](#notification-forwarding) qui sotto)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Punti di ingresso dell'assistente

Android supporta l'avvio di OpenClaw dal trigger dell'assistente di sistema (Google
Assistant). Quando configurato, tenere premuto il tasto Home o dire "Hey Google, ask
OpenClaw..." apre l'app e passa il prompt nel composer della chat.

Questo usa i metadati Android **App Actions** dichiarati nel manifest dell'app. Nessuna
configurazione aggiuntiva è necessaria sul lato gateway — l'intento dell'assistente viene
gestito interamente dall'app Android e inoltrato come normale messaggio chat.

<Note>
La disponibilità delle App Actions dipende dal dispositivo, dalla versione di Google Play Services
e dal fatto che l'utente abbia impostato OpenClaw come app assistente predefinita.
</Note>

## Inoltro delle notifiche

Android può inoltrare le notifiche del dispositivo al gateway come eventi. Diversi controlli consentono di limitare quali notifiche vengono inoltrate e quando.

| Chiave                           | Tipo           | Descrizione                                                                                           |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Inoltra solo le notifiche provenienti da questi nomi di pacchetto. Se impostato, tutti gli altri pacchetti vengono ignorati. |
| `notifications.denyPackages`     | string[]       | Non inoltrare mai notifiche provenienti da questi nomi di pacchetto. Applicato dopo `allowPackages`. |
| `notifications.quietHours.start` | string (HH:mm) | Inizio della finestra di quiet hours (ora locale del dispositivo). Le notifiche vengono soppresse durante questa finestra. |
| `notifications.quietHours.end`   | string (HH:mm) | Fine della finestra di quiet hours.                                                                   |
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
L'inoltro delle notifiche richiede il permesso Android Notification Listener. L'app lo richiede durante la configurazione.
</Note>
