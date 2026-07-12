---
read_when:
    - Aggiunta o modifica dell'acquisizione dalla fotocamera sui nodi iOS/Android o su macOS
    - Estensione dei flussi di lavoro per i file temporanei MEDIA accessibili agli agenti
summary: 'Acquisizione dalla fotocamera (nodi iOS/Android + app macOS) per l''uso da parte dell''agente: foto (jpg) e brevi clip video (mp4)'
title: Acquisizione dalla fotocamera
x-i18n:
    generated_at: "2026-07-12T07:09:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw supporta l'acquisizione dalla fotocamera per i flussi di lavoro degli agenti sui nodi **iOS**, **Android** e **macOS** associati: è possibile acquisire una foto (`jpg`) o un breve clip video (`mp4`, con audio facoltativo) tramite `node.invoke` del Gateway.

L'accesso alla fotocamera è sempre subordinato a un'impostazione controllata dall'utente su ciascuna piattaforma.

## Nodo iOS

### Impostazione utente iOS

- Scheda Settings di iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - Valore predefinito: **attivo** (una chiave mancante viene considerata abilitata).
  - Quando è disattivata: i comandi `camera.*` restituiscono `CAMERA_DISABLED`.

### Comandi iOS (tramite `node.invoke` del Gateway)

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
  - Protezione del payload: le foto vengono ricompresse per mantenere il payload codificato in base64 al di sotto di 5 MB.

- `camera.clip`
  - Parametri:
    - `facing`: `front|back` (valore predefinito: `front`)
    - `durationMs`: numero (valore predefinito `3000`, limitato a `[250, 60000]`)
    - `includeAudio`: valore booleano (valore predefinito `true`)
    - `format`: attualmente `mp4`
    - `deviceId`: stringa (facoltativa; da `camera.list`)
  - Payload della risposta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Requisito di primo piano su iOS

Come per `canvas.*`, il nodo iOS consente i comandi `camera.*` solo in **primo piano**. Le invocazioni in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`.

### Strumento ausiliario della CLI

Il modo più semplice per ottenere i file multimediali è utilizzare lo strumento ausiliario della CLI, che scrive i contenuti multimediali decodificati in un file temporaneo e mostra il percorso di salvataggio.

```bash
openclaw nodes camera snap --node <id>                 # valore predefinito: anteriore + posteriore (2 righe MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Il valore predefinito di `nodes camera snap` è `--facing both`, che acquisisce sia dalla fotocamera anteriore sia da quella posteriore per fornire all'agente entrambe le visuali; usare `--device-id` con un singolo orientamento esplicito (`both` viene rifiutato quando è impostato `--device-id`). I file di output sono temporanei (nella directory temporanea del sistema operativo), a meno che non si crei un wrapper personalizzato.

## Nodo Android

### Impostazione utente Android

- Pannello Settings di Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Nelle nuove installazioni è disattivata per impostazione predefinita.** Le installazioni esistenti precedenti all'introduzione di questa impostazione vengono migrate su **attivo**, affinché gli aggiornamenti non rimuovano silenziosamente un accesso alla fotocamera che prima funzionava.
  - Quando è disattivata: i comandi `camera.*` restituiscono `CAMERA_DISABLED: enable Camera in Settings`.

### Autorizzazioni

- `CAMERA` è obbligatoria sia per `camera.snap` sia per `camera.clip`; se l'autorizzazione manca o viene negata, viene restituito `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` è obbligatoria per `camera.clip` quando `includeAudio` è `true`; se l'autorizzazione manca o viene negata, viene restituito `MIC_PERMISSION_REQUIRED`.

Quando possibile, l'app richiede le autorizzazioni in fase di esecuzione.

### Requisito di primo piano su Android

Come per `canvas.*`, il nodo Android consente i comandi `camera.*` solo in **primo piano**. Le invocazioni in background restituiscono `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Comandi Android (tramite `node.invoke` del Gateway)

- `camera.list`
  - Payload della risposta: `devices` — array di `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parametri: `facing` (`front|back`, valore predefinito `front`), `quality` (valore predefinito `0.95`, limitato a `[0.1, 1.0]`), `maxWidth` (valore predefinito `1600`), `deviceId` (facoltativo; un ID sconosciuto causa un errore `INVALID_REQUEST`).
  - Payload della risposta: `format: "jpg"`, `base64`, `width`, `height`.
  - Protezione del payload: viene ricompresso per mantenere i dati base64 al di sotto di 5 MB (lo stesso limite di iOS).

- `camera.clip`
  - Parametri: `facing` (valore predefinito `front`), `durationMs` (valore predefinito `3000`, limitato a `[200, 60000]`), `includeAudio` (valore predefinito `true`), `deviceId` (facoltativo).
  - Payload della risposta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Protezione del payload: il file MP4 non elaborato è limitato a 18 MB prima della codifica base64; i clip che superano tale dimensione generano l'errore `PAYLOAD_TOO_LARGE` (ridurre `durationMs` e riprovare).

## App macOS

### Impostazione utente macOS

L'app complementare per macOS mette a disposizione una casella di controllo:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Valore predefinito: **disattivato**.
  - Quando è disattivata: le richieste della fotocamera restituiscono `CAMERA_DISABLED: enable Camera in Settings`.

### Strumento ausiliario della CLI (invocazione del nodo)

Utilizzare la CLI principale `openclaw` per invocare i comandi della fotocamera sul nodo macOS.

```bash
openclaw nodes camera list --node <id>                     # elenca gli ID delle fotocamere
openclaw nodes camera snap --node <id>                     # mostra il percorso di salvataggio
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # mostra il percorso di salvataggio
openclaw nodes camera clip --node <id> --duration-ms 3000   # mostra il percorso di salvataggio (flag precedente)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- Il valore predefinito di `openclaw nodes camera snap` è `maxWidth=1600`, se non viene sovrascritto.
- Dopo il riscaldamento e la stabilizzazione dell'esposizione, `camera.snap` attende per `delayMs` (valore predefinito 2000 ms, limitato a `[0, 10000]`) prima dell'acquisizione.
- I payload delle foto vengono ricompressi per mantenere i dati base64 al di sotto di 5 MB.

## Sicurezza e limiti pratici

- L'accesso alla fotocamera e al microfono attiva le consuete richieste di autorizzazione del sistema operativo e richiede le stringhe di utilizzo in `Info.plist`.
- I clip video sono limitati a 60 secondi per evitare payload del nodo eccessivamente grandi (sovraccarico della codifica base64 sommato ai limiti dei messaggi).

## Video dello schermo su macOS (a livello di sistema operativo)

Per registrare un video dello _schermo_ (non della fotocamera), utilizzare l'app complementare per macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # mostra il percorso di salvataggio
```

Richiede l'autorizzazione **Screen Recording** di macOS (TCC).

## Contenuti correlati

- [Supporto per immagini e contenuti multimediali](/it/nodes/images)
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
- [Comando per la posizione](/it/nodes/location-command)
