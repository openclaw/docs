---
read_when:
    - Stai aggiungendo o modificando l'acquisizione dalla fotocamera su nodi iOS/Android o macOS
    - Stai estendendo i flussi di lavoro dei file temporanei MEDIA accessibili all'agente
summary: 'Acquisizione dalla fotocamera (nodi iOS/Android + app macOS) per l''uso da parte dell''agente: foto (`jpg`) e brevi clip video (`mp4`)'
title: Acquisizione dalla fotocamera
x-i18n:
    generated_at: "2026-04-05T13:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# Acquisizione dalla fotocamera (agente)

OpenClaw supporta l'**acquisizione dalla fotocamera** per i flussi di lavoro dell'agente:

- **Nodo iOS** (associato tramite Gateway): acquisisce una **foto** (`jpg`) o una **breve clip video** (`mp4`, con audio opzionale) tramite `node.invoke`.
- **Nodo Android** (associato tramite Gateway): acquisisce una **foto** (`jpg`) o una **breve clip video** (`mp4`, con audio opzionale) tramite `node.invoke`.
- **App macOS** (nodo tramite Gateway): acquisisce una **foto** (`jpg`) o una **breve clip video** (`mp4`, con audio opzionale) tramite `node.invoke`.

Tutto l'accesso alla fotocamera è protetto da **impostazioni controllate dall'utente**.

## Nodo iOS

### Impostazione utente (attivata per impostazione predefinita)

- Scheda Settings di iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Predefinito: **on** (una chiave mancante viene trattata come abilitata).
  - Quando è disattivata: i comandi `camera.*` restituiscono `CAMERA_DISABLED`.

### Comandi (tramite Gateway `node.invoke`)

- `camera.list`
  - Payload della risposta:
    - `devices`: array di `{ id, name, position, deviceType }`

- `camera.snap`
  - Parametri:
    - `facing`: `front|back` (predefinito: `front`)
    - `maxWidth`: numero (facoltativo; predefinito `1600` sul nodo iOS)
    - `quality`: `0..1` (facoltativo; predefinito `0.9`)
    - `format`: attualmente `jpg`
    - `delayMs`: numero (facoltativo; predefinito `0`)
    - `deviceId`: stringa (facoltativa; da `camera.list`)
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
    - `deviceId`: stringa (facoltativa; da `camera.list`)
  - Payload della risposta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Requisito di primo piano

Come `canvas.*`, il nodo iOS consente i comandi `camera.*` solo in **primo piano**. Le invocazioni in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`.

### Helper CLI (file temporanei + MEDIA)

Il modo più semplice per ottenere allegati è tramite l'helper CLI, che scrive i media decodificati in un file temporaneo e stampa `MEDIA:<path>`.

Esempi:

```bash
openclaw nodes camera snap --node <id>               # predefinito: entrambe, front + back (2 righe MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Note:

- `nodes camera snap` usa per impostazione predefinita **entrambi** gli orientamenti per fornire all'agente entrambe le visuali.
- I file di output sono temporanei (nella directory temporanea del sistema operativo) a meno che tu non crei un wrapper personalizzato.

## Nodo Android

### Impostazione utente Android (attivata per impostazione predefinita)

- Pannello Settings di Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Predefinito: **on** (una chiave mancante viene trattata come abilitata).
  - Quando è disattivata: i comandi `camera.*` restituiscono `CAMERA_DISABLED`.

### Permessi

- Android richiede permessi runtime:
  - `CAMERA` sia per `camera.snap` sia per `camera.clip`.
  - `RECORD_AUDIO` per `camera.clip` quando `includeAudio=true`.

Se mancano i permessi, l'app mostrerà il prompt quando possibile; se vengono negati, le richieste `camera.*` falliscono con un errore `*_PERMISSION_REQUIRED`.

### Requisito di primo piano Android

Come `canvas.*`, il nodo Android consente i comandi `camera.*` solo in **primo piano**. Le invocazioni in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`.

### Comandi Android (tramite Gateway `node.invoke`)

- `camera.list`
  - Payload della risposta:
    - `devices`: array di `{ id, name, position, deviceType }`

### Protezione del payload

Le foto vengono ricompresse per mantenere il payload base64 sotto 5 MB.

## App macOS

### Impostazione utente (disattivata per impostazione predefinita)

L'app complementare per macOS espone una casella di controllo:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Predefinito: **off**
  - Quando è disattivata: le richieste della fotocamera restituiscono “Fotocamera disabilitata dall'utente”.

### Helper CLI (node invoke)

Usa la CLI principale `openclaw` per invocare i comandi della fotocamera sul nodo macOS.

Esempi:

```bash
openclaw nodes camera list --node <id>            # elenca gli id della fotocamera
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
- Su macOS, `camera.snap` attende `delayMs` (predefinito 2000ms) dopo il warm-up/l'assestamento dell'esposizione prima di acquisire.
- I payload delle foto vengono ricompresi per mantenere il base64 sotto 5 MB.

## Sicurezza + limiti pratici

- L'accesso a fotocamera e microfono attiva i consueti prompt di permesso del sistema operativo (e richiede stringhe di utilizzo in Info.plist).
- Le clip video hanno un limite massimo (attualmente `<= 60s`) per evitare payload dei nodi troppo grandi (overhead base64 + limiti dei messaggi).

## Video dello schermo macOS (a livello di sistema operativo)

Per il video dello _schermo_ (non della fotocamera), usa l'app complementare macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # stampa MEDIA:<path>
```

Note:

- Richiede il permesso macOS **Screen Recording** (TCC).
