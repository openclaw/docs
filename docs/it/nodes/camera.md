---
read_when:
    - Aggiunta o modifica dell'acquisizione della fotocamera su Node iOS/Android o macOS
    - Estensione dei flussi di lavoro dei file temporanei MEDIA accessibili all'agente
summary: 'Acquisizione della fotocamera (Node iOS/Android + app macOS) per l''uso da parte dell''agente: foto (jpg) e brevi clip video (mp4)'
title: Acquisizione della fotocamera
x-i18n:
    generated_at: "2026-04-24T08:48:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

OpenClaw supporta l'**acquisizione della fotocamera** per i flussi di lavoro dell'agente:

- **Node iOS** (associato tramite Gateway): acquisizione di una **foto** (`jpg`) o di una **breve clip video** (`mp4`, con audio facoltativo) tramite `node.invoke`.
- **Node Android** (associato tramite Gateway): acquisizione di una **foto** (`jpg`) o di una **breve clip video** (`mp4`, con audio facoltativo) tramite `node.invoke`.
- **App macOS** (Node tramite Gateway): acquisizione di una **foto** (`jpg`) o di una **breve clip video** (`mp4`, con audio facoltativo) tramite `node.invoke`.

Tutto l'accesso alla fotocamera è protetto da **impostazioni controllate dall'utente**.

## Node iOS

### Impostazione utente (attiva per impostazione predefinita)

- Scheda Impostazioni iOS → **Fotocamera** → **Consenti fotocamera** (`camera.enabled`)
  - Predefinito: **attivo** (una chiave mancante viene trattata come abilitata).
  - Se disattivato: i comandi `camera.*` restituiscono `CAMERA_DISABLED`.

### Comandi (tramite Gateway `node.invoke`)

- `camera.list`
  - Payload della risposta:
    - `devices`: array di `{ id, name, position, deviceType }`

- `camera.snap`
  - Parametri:
    - `facing`: `front|back` (predefinito: `front`)
    - `maxWidth`: numero (facoltativo; predefinito `1600` sul Node iOS)
    - `quality`: `0..1` (facoltativo; predefinito `0.9`)
    - `format`: attualmente `jpg`
    - `delayMs`: numero (facoltativo; predefinito `0`)
    - `deviceId`: stringa (facoltativo; da `camera.list`)
  - Payload della risposta:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Protezione del payload: le foto vengono ricomprese per mantenere il payload base64 sotto i 5 MB.

- `camera.clip`
  - Parametri:
    - `facing`: `front|back` (predefinito: `front`)
    - `durationMs`: numero (predefinito `3000`, limitato a un massimo di `60000`)
    - `includeAudio`: booleano (predefinito `true`)
    - `format`: attualmente `mp4`
    - `deviceId`: stringa (facoltativo; da `camera.list`)
  - Payload della risposta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Requisito di foreground

Come `canvas.*`, il Node iOS consente i comandi `camera.*` solo in **foreground**. Le invocazioni in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`.

### Helper CLI (file temporanei + MEDIA)

Il modo più semplice per ottenere allegati è tramite l'helper CLI, che scrive i media decodificati in un file temporaneo e stampa `MEDIA:<path>`.

Esempi:

```bash
openclaw nodes camera snap --node <id>               # predefinito: entrambe le facings front + back (2 righe MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Note:

- `nodes camera snap` usa per impostazione predefinita **entrambe** le facings per dare all'agente entrambe le visuali.
- I file di output sono temporanei (nella directory temporanea del sistema operativo) a meno che tu non costruisca un tuo wrapper.

## Node Android

### Impostazione utente Android (attiva per impostazione predefinita)

- Foglio Impostazioni Android → **Fotocamera** → **Consenti fotocamera** (`camera.enabled`)
  - Predefinito: **attivo** (una chiave mancante viene trattata come abilitata).
  - Se disattivato: i comandi `camera.*` restituiscono `CAMERA_DISABLED`.

### Permessi

- Android richiede permessi runtime:
  - `CAMERA` sia per `camera.snap` sia per `camera.clip`.
  - `RECORD_AUDIO` per `camera.clip` quando `includeAudio=true`.

Se i permessi mancano, l'app mostrerà un prompt quando possibile; se vengono negati, le richieste `camera.*` falliscono con un
errore `*_PERMISSION_REQUIRED`.

### Requisito di foreground Android

Come `canvas.*`, il Node Android consente i comandi `camera.*` solo in **foreground**. Le invocazioni in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`.

### Comandi Android (tramite Gateway `node.invoke`)

- `camera.list`
  - Payload della risposta:
    - `devices`: array di `{ id, name, position, deviceType }`

### Protezione del payload

Le foto vengono ricomprese per mantenere il payload base64 sotto i 5 MB.

## App macOS

### Impostazione utente (disattivata per impostazione predefinita)

L'app companion macOS espone una checkbox:

- **Impostazioni → Generale → Consenti fotocamera** (`openclaw.cameraEnabled`)
  - Predefinito: **disattivato**
  - Se disattivato: le richieste della fotocamera restituiscono “Camera disabled by user”.

### Helper CLI (node invoke)

Usa la CLI principale `openclaw` per invocare i comandi della fotocamera sul Node macOS.

Esempi:

```bash
openclaw nodes camera list --node <id>            # elenca gli id delle fotocamere
openclaw nodes camera snap --node <id>            # stampa MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # stampa MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # stampa MEDIA:<path> (flag legacy)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Note:

- `openclaw nodes camera snap` usa per impostazione predefinita `maxWidth=1600` salvo override.
- Su macOS, `camera.snap` attende `delayMs` (predefinito 2000ms) dopo warm-up/assestamento dell'esposizione prima di acquisire.
- I payload fotografici vengono ricompressi per mantenere il base64 sotto i 5 MB.

## Sicurezza + limiti pratici

- L'accesso a fotocamera e microfono attiva i consueti prompt di permesso del sistema operativo (e richiede usage string in Info.plist).
- Le clip video hanno un limite massimo (attualmente `<= 60s`) per evitare payload Node troppo grandi (overhead base64 + limiti dei messaggi).

## Video dello schermo macOS (a livello OS)

Per il video dello _schermo_ (non della fotocamera), usa l'app companion macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # stampa MEDIA:<path>
```

Note:

- Richiede il permesso macOS **Screen Recording** (TCC).

## Correlati

- [Supporto immagini e media](/it/nodes/images)
- [Comprensione dei media](/it/nodes/media-understanding)
- [Comando location](/it/nodes/location-command)
