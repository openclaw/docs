---
read_when:
    - Añadir o modificar la captura de cámara en nodos iOS/Android o macOS
    - Ampliar flujos de trabajo de archivos temporales MEDIA accesibles por el agente
summary: 'Captura de cámara (nodos iOS/Android + app de macOS) para uso del agente: fotos (jpg) y clips de video cortos (mp4)'
title: Captura de cámara
x-i18n:
    generated_at: "2026-04-24T05:36:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

OpenClaw admite **captura de cámara** para flujos de trabajo del agente:

- **Nodo iOS** (vinculado mediante Gateway): capturar una **foto** (`jpg`) o un **clip de video corto** (`mp4`, con audio opcional) mediante `node.invoke`.
- **Nodo Android** (vinculado mediante Gateway): capturar una **foto** (`jpg`) o un **clip de video corto** (`mp4`, con audio opcional) mediante `node.invoke`.
- **App de macOS** (nodo mediante Gateway): capturar una **foto** (`jpg`) o un **clip de video corto** (`mp4`, con audio opcional) mediante `node.invoke`.

Todo el acceso a la cámara está protegido por **ajustes controlados por el usuario**.

## Nodo iOS

### Ajuste de usuario (activado por defecto)

- Pestaña Ajustes de iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Predeterminado: **activado** (la ausencia de la clave se trata como habilitado).
  - Si está desactivado: los comandos `camera.*` devuelven `CAMERA_DISABLED`.

### Comandos (mediante Gateway `node.invoke`)

- `camera.list`
  - Carga de respuesta:
    - `devices`: array de `{ id, name, position, deviceType }`

- `camera.snap`
  - Parámetros:
    - `facing`: `front|back` (predeterminado: `front`)
    - `maxWidth`: número (opcional; predeterminado `1600` en el nodo iOS)
    - `quality`: `0..1` (opcional; predeterminado `0.9`)
    - `format`: actualmente `jpg`
    - `delayMs`: número (opcional; predeterminado `0`)
    - `deviceId`: cadena (opcional; de `camera.list`)
  - Carga de respuesta:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Protección de carga: las fotos se recomprimen para mantener la carga base64 por debajo de 5 MB.

- `camera.clip`
  - Parámetros:
    - `facing`: `front|back` (predeterminado: `front`)
    - `durationMs`: número (predeterminado `3000`, limitado a un máximo de `60000`)
    - `includeAudio`: booleano (predeterminado `true`)
    - `format`: actualmente `mp4`
    - `deviceId`: cadena (opcional; de `camera.list`)
  - Carga de respuesta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Requisito de primer plano

Igual que `canvas.*`, el nodo iOS solo permite comandos `camera.*` en **primer plano**. Las invocaciones en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`.

### Ayudante CLI (archivos temporales + MEDIA)

La forma más sencilla de obtener adjuntos es mediante el ayudante CLI, que escribe los medios decodificados en un archivo temporal e imprime `MEDIA:<path>`.

Ejemplos:

```bash
openclaw nodes camera snap --node <id>               # predeterminado: ambos, front + back (2 líneas MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Notas:

- `nodes camera snap` usa por defecto **ambas** orientaciones para dar al agente ambas vistas.
- Los archivos de salida son temporales (en el directorio temporal del SO) a menos que construyas tu propio contenedor.

## Nodo Android

### Ajuste de usuario de Android (activado por defecto)

- Hoja de Ajustes de Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Predeterminado: **activado** (la ausencia de la clave se trata como habilitado).
  - Si está desactivado: los comandos `camera.*` devuelven `CAMERA_DISABLED`.

### Permisos

- Android requiere permisos en tiempo de ejecución:
  - `CAMERA` tanto para `camera.snap` como para `camera.clip`.
  - `RECORD_AUDIO` para `camera.clip` cuando `includeAudio=true`.

Si faltan permisos, la app mostrará la solicitud cuando sea posible; si se deniegan, las solicitudes `camera.*` fallan con un
error `*_PERMISSION_REQUIRED`.

### Requisito de primer plano en Android

Igual que `canvas.*`, el nodo Android solo permite comandos `camera.*` en **primer plano**. Las invocaciones en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`.

### Comandos de Android (mediante Gateway `node.invoke`)

- `camera.list`
  - Carga de respuesta:
    - `devices`: array de `{ id, name, position, deviceType }`

### Protección de carga

Las fotos se recomprimen para mantener la carga base64 por debajo de 5 MB.

## App de macOS

### Ajuste de usuario (desactivado por defecto)

La app complementaria de macOS expone una casilla de verificación:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Predeterminado: **desactivado**
  - Si está desactivado: las solicitudes de cámara devuelven “Camera disabled by user”.

### Ayudante CLI (node invoke)

Usa la CLI principal `openclaw` para invocar comandos de cámara en el nodo macOS.

Ejemplos:

```bash
openclaw nodes camera list --node <id>            # listar id de cámaras
openclaw nodes camera snap --node <id>            # imprime MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # imprime MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # imprime MEDIA:<path> (indicador heredado)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Notas:

- `openclaw nodes camera snap` usa por defecto `maxWidth=1600` salvo sobrescritura.
- En macOS, `camera.snap` espera `delayMs` (predeterminado 2000ms) después del calentamiento/estabilización de la exposición antes de capturar.
- Las cargas de fotos se recomprimen para mantener el base64 por debajo de 5 MB.

## Seguridad + límites prácticos

- El acceso a cámara y micrófono activa las solicitudes habituales de permisos del SO (y requiere cadenas de uso en Info.plist).
- Los clips de video están limitados (actualmente `<= 60s`) para evitar cargas de nodo sobredimensionadas (sobrecarga base64 + límites de mensajes).

## Video de pantalla de macOS (a nivel de SO)

Para video de _pantalla_ (no de cámara), usa el complemento de macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # imprime MEDIA:<path>
```

Notas:

- Requiere permiso de macOS **Screen Recording** (TCC).

## Relacionado

- [Compatibilidad con imágenes y multimedia](/es/nodes/images)
- [Comprensión de multimedia](/es/nodes/media-understanding)
- [Comando de ubicación](/es/nodes/location-command)
