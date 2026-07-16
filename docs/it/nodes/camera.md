---
read_when:
    - Aggiunta o modifica dell'acquisizione dalla fotocamera sulle piattaforme Node
    - Estensione dei flussi di lavoro per i file temporanei MEDIA accessibili agli agenti
summary: Acquisizione dalla fotocamera sui nodi iOS, Android, macOS e Linux per foto e brevi clip video
title: Acquisizione dalla fotocamera
x-i18n:
    generated_at: "2026-07-16T14:32:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw supporta l'acquisizione dalla fotocamera per i flussi di lavoro degli agenti sui nodi **iOS**, **Android**, **macOS** e **Linux** associati: è possibile acquisire una foto (`jpg`) o un breve videoclip (`mp4`, con audio facoltativo) tramite il Gateway `node.invoke`.

L'accesso alla fotocamera è subordinato, su ogni piattaforma, a un'impostazione controllata dall'utente.

## Nodo iOS

### Impostazione utente di iOS

- Scheda Settings di iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - Valore predefinito: **attivo** (l'assenza della chiave viene interpretata come abilitazione).
  - Quando è disattivato: i comandi `camera.*` restituiscono `CAMERA_DISABLED`.

### Comandi iOS (tramite il Gateway `node.invoke`)

- `camera.list`
  - Payload della risposta: `devices` — array di `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parametri:
    - `facing`: `front|back` (valore predefinito: `front`)
    - `maxWidth`: numero (facoltativo; valore predefinito `1600`)
    - `quality`: `0..1` (facoltativo; valore predefinito `0.9`, limitato a `[0.05, 1.0]`)
    - `format`: attualmente `jpg`
    - `delayMs`: numero (facoltativo; valore predefinito `0`, limitato internamente a `10000`)
    - `deviceId`: stringa (facoltativa; da `camera.list`)
  - Payload della risposta: `format: "jpg"`, `base64`, `width`, `height`.
  - Protezione del payload: le foto vengono ricompresse per mantenere il payload codificato in base64 al di sotto di 5MB.

- `camera.clip`
  - Parametri:
    - `facing`: `front|back` (valore predefinito: `front`)
    - `durationMs`: numero (valore predefinito `3000`, limitato a `[250, 60000]`)
    - `includeAudio`: booleano (valore predefinito `true`)
    - `format`: attualmente `mp4`
    - `deviceId`: stringa (facoltativa; da `camera.list`)
  - Payload della risposta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Requisito di esecuzione in primo piano su iOS

Come `canvas.*`, il nodo iOS consente i comandi `camera.*` solo in **primo piano**. Le invocazioni in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`.

### Utilità CLI

Il modo più semplice per ottenere i file multimediali consiste nell'utilizzare l'utilità CLI, che scrive i contenuti multimediali decodificati in un file temporaneo e stampa il percorso di salvataggio.

```bash
openclaw nodes camera snap --node <id>                 # valore predefinito: anteriore + posteriore (2 righe MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` usa come valore predefinito `--facing both`, acquisendo sia dalla fotocamera anteriore sia da quella posteriore per fornire all'agente entrambe le visuali; passare `--device-id` con un singolo orientamento esplicito (`both` viene rifiutato quando è impostato `--device-id`). I file di output sono temporanei (nella directory temporanea del sistema operativo), a meno che non venga creato un wrapper personalizzato.

## Nodo Android

### Impostazione utente di Android

- Pannello Settings di Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Nelle nuove installazioni il valore predefinito è disattivato.** Le installazioni esistenti precedenti a questa impostazione vengono migrate su **attivo**, in modo che gli aggiornamenti non causino la perdita silenziosa di un accesso alla fotocamera precedentemente funzionante.
  - Quando è disattivato: i comandi `camera.*` restituiscono `CAMERA_DISABLED: enable Camera in Settings`.

### Autorizzazioni

- `CAMERA` è obbligatoria sia per `camera.snap` sia per `camera.clip`; se l'autorizzazione è assente o negata, viene restituito `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` è obbligatoria per `camera.clip` quando `includeAudio` è `true`; se l'autorizzazione è assente o negata, viene restituito `MIC_PERMISSION_REQUIRED`.

Quando possibile, l'app richiede le autorizzazioni in fase di esecuzione.

### Requisito di esecuzione in primo piano su Android

Come `canvas.*`, il nodo Android consente i comandi `camera.*` solo in **primo piano**. Le invocazioni in background restituiscono `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Comandi Android (tramite il Gateway `node.invoke`)

- `camera.list`
  - Payload della risposta: `devices` — array di `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parametri: `facing` (`front|back`, valore predefinito `front`), `quality` (valore predefinito `0.95`, limitato a `[0.1, 1.0]`), `maxWidth` (valore predefinito `1600`), `deviceId` (facoltativo; un ID sconosciuto genera l'errore `INVALID_REQUEST`).
  - Payload della risposta: `format: "jpg"`, `base64`, `width`, `height`.
  - Protezione del payload: viene eseguita una ricompressione per mantenere il contenuto base64 al di sotto di 5MB (lo stesso limite di iOS).

- `camera.clip`
  - Parametri: `facing` (valore predefinito `front`), `durationMs` (valore predefinito `3000`, limitato a `[200, 60000]`), `includeAudio` (valore predefinito `true`), `deviceId` (facoltativo).
  - Payload della risposta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Protezione del payload: il file MP4 non elaborato è limitato a 18MB prima della codifica base64; i filmati che superano il limite generano l'errore `PAYLOAD_TOO_LARGE` (ridurre `durationMs` e riprovare).

## App macOS

### Impostazione utente di macOS

L'app complementare per macOS presenta una casella di controllo:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Valore predefinito: **disattivato**.
  - Quando è disattivato: le richieste alla fotocamera restituiscono `CAMERA_DISABLED: enable Camera in Settings`.

### Utilità CLI (invocazione del nodo)

Utilizzare la CLI principale `openclaw` per invocare i comandi della fotocamera sul nodo macOS.

```bash
openclaw nodes camera list --node <id>                     # elenca gli ID delle fotocamere
openclaw nodes camera snap --node <id>                     # stampa il percorso di salvataggio
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # stampa il percorso di salvataggio
openclaw nodes camera clip --node <id> --duration-ms 3000   # stampa il percorso di salvataggio (flag precedente)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` usa come valore predefinito `maxWidth=1600`, salvo sostituzione.
- `camera.snap` attende `delayMs` (valore predefinito 2000ms, limitato a `[0, 10000]`) dopo il riscaldamento e la stabilizzazione dell'esposizione prima dell'acquisizione.
- I payload delle foto vengono ricompressi per mantenere il contenuto base64 al di sotto di 5MB.

## Host del nodo Linux

Il Plugin Linux Node incluso aggiunge l'acquisizione dalla fotocamera al servizio CLI `openclaw node`. Funziona su un host headless e non richiede l'app desktop per Linux.

L'accesso alla fotocamera è disattivato per impostazione predefinita. Abilitarlo nella voce del Plugin, quindi riavviare il servizio del nodo affinché il relativo annuncio del Gateway venga rigenerato:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

Requisiti:

- FFmpeg con input V4L2, `libx264` e supporto AAC
- un dispositivo `/dev/video*` leggibile dall'utente del servizio del nodo; nelle distribuzioni comuni, aggiungere tale utente al gruppo `video`
- per i filmati con il valore predefinito `includeAudio: true`, un server PulseAudio funzionante o un livello di compatibilità PulseAudio di PipeWire con una sorgente predefinita

Linux restituisce da `camera.list` i percorsi dei dispositivi V4L2 leggibili e in grado di acquisire; FFmpeg esamina ogni candidato `/dev/video*` e omette i nodi di metadati o di sola uscita. Il valore `position` del dispositivo è `unknown`; pertanto, le richieste di orientamento prive di `deviceId` producono una foto o un filmato con posizione `unknown`, anziché dichiarare una fotocamera anteriore o posteriore. Utilizzare `deviceId` quando un host dispone di più fotocamere. `camera.snap` utilizza il riscaldamento dell'input di FFmpeg per `delayMs` e mantiene le proporzioni limitando al contempo la larghezza. `camera.clip` registra l'audio del microfono come traccia audio MP4; OpenClaw non espone deliberatamente alcun comando autonomo per il microfono.

Il Plugin utilizza `libx264` per i video MP4 e non cambia silenziosamente i codec. Una build di FFmpeg priva dell'input o degli encoder necessari restituisce `CAMERA_UNAVAILABLE`. Le foto e i filmati che supererebbero il limite di 25MB del payload base64 generano l'errore `PAYLOAD_TOO_LARGE`.

`camera.snap` e `camera.clip` restano comandi pericolosi. Aggiungerli a `gateway.nodes.allowCommands` solo quando si intende attivare l'acquisizione; la sola abilitazione del Plugin non aggira i criteri del Gateway.

## Sicurezza e limiti pratici

- L'accesso alla fotocamera e al microfono attiva le consuete richieste di autorizzazione del sistema operativo e richiede le stringhe di utilizzo in `Info.plist`.
- I videoclip sono limitati a 60s per evitare payload del nodo sovradimensionati (overhead di base64 e limiti dei messaggi).

## Video dello schermo su macOS (a livello di sistema operativo)

Per registrare un video dello _schermo_ (non della fotocamera), utilizzare l'app complementare per macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # stampa il percorso di salvataggio
```

Richiede l'autorizzazione **Screen Recording** di macOS (TCC).

## Contenuti correlati

- [Supporto di immagini e contenuti multimediali](/it/nodes/images)
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
- [Comando di localizzazione](/it/nodes/location-command)
