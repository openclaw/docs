---
read_when:
    - Aggiunta o modifica dell'acquisizione dalla fotocamera su nodi iOS/Android o macOS
    - Estendere i flussi di lavoro dei file temporanei MEDIA accessibili agli agenti
summary: 'Acquisizione dalla fotocamera (nodi iOS/Android + app macOS) per l''uso da parte degli agenti: foto (jpg) e brevi clip video (mp4)'
title: Acquisizione dalla fotocamera
x-i18n:
    generated_at: "2026-05-06T08:58:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw supporta **l'acquisizione con fotocamera** per i flussi di lavoro degli agenti:

- **Node iOS** (abbinato tramite Gateway): acquisisci una **foto** (`jpg`) o un **breve clip video** (`mp4`, con audio opzionale) tramite `node.invoke`.
- **Node Android** (abbinato tramite Gateway): acquisisci una **foto** (`jpg`) o un **breve clip video** (`mp4`, con audio opzionale) tramite `node.invoke`.
- **App macOS** (Node tramite Gateway): acquisisci una **foto** (`jpg`) o un **breve clip video** (`mp4`, con audio opzionale) tramite `node.invoke`.

Tutto l'accesso alla fotocamera è protetto da **impostazioni controllate dall'utente**.

## Node iOS

### Impostazione utente (attiva per impostazione predefinita)

- Scheda Impostazioni iOS → **Fotocamera** → **Consenti fotocamera** (`camera.enabled`)
  - Predefinito: **attivo** (una chiave mancante viene trattata come abilitata).
  - Quando disattivato: i comandi `camera.*` restituiscono `CAMERA_DISABLED`.

### Comandi (tramite Gateway `node.invoke`)

- `camera.list`
  - Payload della risposta:
    - `devices`: array di `{ id, name, position, deviceType }`

- `camera.snap`
  - Parametri:
    - `facing`: `front|back` (predefinito: `front`)
    - `maxWidth`: numero (opzionale; predefinito `1600` sul Node iOS)
    - `quality`: `0..1` (opzionale; predefinito `0.9`)
    - `format`: attualmente `jpg`
    - `delayMs`: numero (opzionale; predefinito `0`)
    - `deviceId`: stringa (opzionale; da `camera.list`)
  - Payload della risposta:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Protezione del payload: le foto vengono ricompresse per mantenere il payload base64 sotto 5 MB.

- `camera.clip`
  - Parametri:
    - `facing`: `front|back` (predefinito: `front`)
    - `durationMs`: numero (predefinito `3000`, limitato a un massimo di `60000`)
    - `includeAudio`: booleano (predefinito `true`)
    - `format`: attualmente `mp4`
    - `deviceId`: stringa (opzionale; da `camera.list`)
  - Payload della risposta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Requisito di primo piano

Come `canvas.*`, il Node iOS consente i comandi `camera.*` solo in **primo piano**. Le invocazioni in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`.

### Helper CLI (file temporanei + MEDIA)

Il modo più semplice per ottenere allegati è tramite l'helper CLI, che scrive i media decodificati in un file temporaneo e stampa `MEDIA:<path>`.

Esempi:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Note:

- `nodes camera snap` usa come impostazione predefinita **entrambe** le direzioni per fornire all'agente entrambe le viste.
- I file di output sono temporanei (nella directory temporanea del sistema operativo) a meno che tu non crei un wrapper personalizzato.

## Node Android

### Impostazione utente Android (attiva per impostazione predefinita)

- Foglio Impostazioni Android → **Fotocamera** → **Consenti fotocamera** (`camera.enabled`)
  - Predefinito: **attivo** (una chiave mancante viene trattata come abilitata).
  - Quando disattivato: i comandi `camera.*` restituiscono `CAMERA_DISABLED`.

### Autorizzazioni

- Android richiede autorizzazioni runtime:
  - `CAMERA` per entrambi `camera.snap` e `camera.clip`.
  - `RECORD_AUDIO` per `camera.clip` quando `includeAudio=true`.

Se le autorizzazioni mancano, l'app le richiederà quando possibile; se vengono negate, le richieste `camera.*` falliscono con un errore
`*_PERMISSION_REQUIRED`.

### Requisito di primo piano Android

Come `canvas.*`, il Node Android consente i comandi `camera.*` solo in **primo piano**. Le invocazioni in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`.

### Comandi Android (tramite Gateway `node.invoke`)

- `camera.list`
  - Payload della risposta:
    - `devices`: array di `{ id, name, position, deviceType }`

### Protezione del payload

Le foto vengono ricompresse per mantenere il payload base64 sotto 5 MB.

## App macOS

### Impostazione utente (disattivata per impostazione predefinita)

L'app companion macOS espone una casella di controllo:

- **Impostazioni → Generali → Consenti fotocamera** (`openclaw.cameraEnabled`)
  - Predefinito: **disattivato**
  - Quando disattivato: le richieste alla fotocamera restituiscono "Fotocamera disabilitata dall'utente".

### Helper CLI (invocazione Node)

Usa la CLI principale `openclaw` per invocare comandi della fotocamera sul Node macOS.

Esempi:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Note:

- `openclaw nodes camera snap` usa `maxWidth=1600` come impostazione predefinita, a meno che non venga sovrascritta.
- Su macOS, `camera.snap` attende `delayMs` (predefinito 2000ms) dopo il riscaldamento/la stabilizzazione dell'esposizione prima di acquisire.
- I payload delle foto vengono ricompressi per mantenere base64 sotto 5 MB.

## Sicurezza + limiti pratici

- L'accesso a fotocamera e microfono attiva le consuete richieste di autorizzazione del sistema operativo (e richiede stringhe d'uso in Info.plist).
- I clip video sono limitati (attualmente `<= 60s`) per evitare payload Node troppo grandi (overhead base64 + limiti dei messaggi).

## Video dello schermo macOS (a livello di sistema operativo)

Per i video dello _schermo_ (non della fotocamera), usa il companion macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Note:

- Richiede l'autorizzazione **Registrazione schermo** di macOS (TCC).

## Correlati

- [Supporto per immagini e media](/it/nodes/images)
- [Comprensione dei media](/it/nodes/media-understanding)
- [Comando di posizione](/it/nodes/location-command)
