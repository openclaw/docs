---
read_when:
    - Añadir o modificar la captura de cámara en plataformas Node
    - Ampliación de los flujos de trabajo de archivos temporales MEDIA accesibles para agentes
summary: Captura con cámara en nodos iOS, Android, macOS y Linux para fotos y videoclips cortos
title: Captura de cámara
x-i18n:
    generated_at: "2026-07-22T10:38:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b819f7ff3fc9b51757ae998d27f540975bf6c1194ed32fd36b1fbe909e79400c
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw admite la captura con cámara para flujos de trabajo de agentes en nodos **iOS**, **Android**, **macOS** y **Linux** emparejados: capture una foto (`jpg`) o un videoclip corto (`mp4`, con audio opcional) mediante `node.invoke` del Gateway.

Todo acceso a la cámara está sujeto a una configuración controlada por el usuario en cada plataforma.

## Nodo iOS

### Configuración de usuario de iOS

- Pestaña iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - Valor predeterminado: **activado** (si falta la clave, se considera habilitado).
  - Cuando está desactivado: los comandos `camera.*` devuelven `CAMERA_DISABLED`.

### Comandos de iOS (mediante `node.invoke` del Gateway)

- `camera.list`
  - Carga útil de respuesta: `devices` — matriz de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parámetros:
    - `facing`: `front|back` (valor predeterminado: `front`)
    - `maxWidth`: número (opcional; valor predeterminado: `1600`)
    - `quality`: `0..1` (opcional; valor predeterminado: `0.9`, limitado a `[0.05, 1.0]`)
    - `format`: actualmente `jpg`
    - `delayMs`: número (opcional; valor predeterminado: `0`, con un límite interno de `10000`)
    - `deviceId`: cadena (opcional; de `camera.list`)
  - Carga útil de respuesta: `format: "jpg"`, `base64`, `width`, `height`.
  - Protección de carga útil: las fotos se vuelven a comprimir para mantener la carga útil codificada en base64 por debajo de 5MB.

- `camera.clip`
  - Parámetros:
    - `facing`: `front|back` (valor predeterminado: `front`)
    - `durationMs`: número (valor predeterminado: `3000`, limitado a `[250, 60000]`)
    - `includeAudio`: booleano (valor predeterminado: `true`)
    - `format`: actualmente `mp4`
    - `deviceId`: cadena (opcional; de `camera.list`)
  - Carga útil de respuesta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Requisito de primer plano en iOS

Al igual que `canvas.*`, el nodo iOS solo permite comandos `camera.*` en **primer plano**. Las invocaciones en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`.

### Utilidad de la CLI

La forma más sencilla de obtener archivos multimedia es mediante la utilidad de la CLI, que escribe el contenido multimedia decodificado en un archivo temporal e imprime la ruta guardada.

```bash
openclaw nodes camera snap --node <id>                 # valor predeterminado: frontal + trasera (2 líneas MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` tiene como valor predeterminado `--facing both`, lo que captura tanto la vista frontal como la trasera para proporcionar ambas vistas al agente; pase `--device-id` con una sola orientación explícita (`both` se rechaza cuando se establece `--device-id`). Los archivos de salida son temporales (en el directorio temporal del SO), a menos que cree su propio contenedor.

## Nodo Android

### Configuración de usuario de Android

- Panel Android Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - **En las instalaciones nuevas, el valor predeterminado es desactivado.** Las instalaciones existentes anteriores a esta configuración se migran a **activado** para que las actualizaciones no pierdan silenciosamente el acceso a la cámara que funcionaba anteriormente.
  - Cuando está desactivado: los comandos `camera.*` devuelven `CAMERA_DISABLED: enable Camera in Settings`.

### Permisos

- `CAMERA` es obligatorio tanto para `camera.snap` como para `camera.clip`; si el permiso falta o se deniega, se devuelve `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` es obligatorio para `camera.clip` cuando `includeAudio` es `true`; si el permiso falta o se deniega, se devuelve `MIC_PERMISSION_REQUIRED`.

La aplicación solicita permisos en tiempo de ejecución cuando es posible.

### Requisito de primer plano en Android

Al igual que `canvas.*`, el nodo Android solo permite comandos `camera.*` en **primer plano**. Las invocaciones en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Comandos de Android (mediante `node.invoke` del Gateway)

- `camera.list`
  - Carga útil de respuesta: `devices` — matriz de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parámetros: `facing` (`front|back`, valor predeterminado: `front`), `quality` (valor predeterminado: `0.95`, limitado a `[0.1, 1.0]`), `maxWidth` (valor predeterminado: `1600`), `deviceId` (opcional; un id desconocido produce `INVALID_REQUEST`).
  - Carga útil de respuesta: `format: "jpg"`, `base64`, `width`, `height`.
  - Protección de carga útil: se vuelve a comprimir para mantener el contenido base64 por debajo de 5MB (el mismo límite que en iOS).

- `camera.clip`
  - Parámetros: `facing` (valor predeterminado: `front`), `durationMs` (valor predeterminado: `3000`, limitado a `[200, 60000]`), `includeAudio` (valor predeterminado: `true`), `deviceId` (opcional).
  - Carga útil de respuesta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Protección de carga útil: el MP4 sin procesar está limitado a 18MB antes de la codificación base64; los clips que superan el tamaño máximo fallan con `PAYLOAD_TOO_LARGE` (reduzca `durationMs` y vuelva a intentarlo).

## Aplicación para macOS

### Configuración de usuario de macOS

La aplicación complementaria para macOS ofrece una casilla de verificación:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Valor predeterminado: **desactivado**.
  - Cuando está desactivado: las solicitudes de la cámara devuelven `CAMERA_DISABLED: enable Camera in Settings`.

### Utilidad de la CLI (invocación del nodo)

Utilice la CLI principal `openclaw` para invocar comandos de cámara en el nodo macOS.

```bash
openclaw nodes camera list --node <id>                     # enumera los id de las cámaras
openclaw nodes camera snap --node <id>                     # imprime la ruta guardada
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # imprime la ruta guardada
openclaw nodes camera clip --node <id> --duration-ms 3000   # imprime la ruta guardada (opción heredada)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` tiene como valor predeterminado `maxWidth=1600`, salvo que se sustituya.
- `camera.snap` espera `delayMs` (valor predeterminado: 2000ms, limitado a `[0, 10000]`) después del calentamiento y la estabilización de la exposición antes de realizar la captura.
- Las cargas útiles de las fotos se vuelven a comprimir para mantener el contenido base64 por debajo de 5MB.

## Host de nodo Linux

El Plugin de Node Linux incluido añade la captura con cámara al servicio `openclaw node` de la CLI. Funciona en un host sin interfaz gráfica y no requiere la aplicación de escritorio para Linux.

El acceso a la cámara está desactivado de forma predeterminada. Habilítelo en la entrada del Plugin y, a continuación, reinicie el servicio del nodo para que se vuelva a generar su anuncio del Gateway:

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

Requisitos:

- FFmpeg con entrada V4L2, `libx264` y compatibilidad con AAC
- un dispositivo `/dev/video*` que pueda leer el usuario del servicio del nodo; en las distribuciones habituales, añada ese usuario al grupo `video`
- para clips con el valor predeterminado `includeAudio: true`, un servidor PulseAudio funcional o una capa de compatibilidad con PulseAudio de PipeWire que tenga una fuente predeterminada

Linux devuelve rutas de dispositivos V4L2 legibles y capaces de realizar capturas desde `camera.list`; FFmpeg sondea cada candidato `/dev/video*` y omite los nodos sin metadatos o que solo admiten salida. El `position` del dispositivo es `unknown`, por lo que las solicitudes de orientación sin `deviceId` generan una foto o un clip con la posición `unknown`, en lugar de afirmar que se trata de una cámara frontal o trasera. Utilice `deviceId` cuando un host tenga varias cámaras. `camera.snap` utiliza el calentamiento de entrada de FFmpeg para `delayMs` y conserva la relación de aspecto mientras limita el ancho. `camera.clip` graba el audio del micrófono como pista de audio del MP4; OpenClaw no ofrece deliberadamente ningún comando independiente para el micrófono.

El Plugin utiliza `libx264` para vídeo MP4 y no cambia los códecs silenciosamente. Una compilación de FFmpeg sin la entrada o los codificadores necesarios devuelve `CAMERA_UNAVAILABLE`. Las fotos y los clips que superarían el límite de carga útil base64 de 25MB fallan con `PAYLOAD_TOO_LARGE`.

`camera.snap` y `camera.clip` siguen siendo comandos peligrosos. Añádalos a `gateway.nodes.commands.allow` solo cuando pretenda habilitar la captura; habilitar únicamente el Plugin no elude la política del Gateway.

## Seguridad y límites prácticos

- El acceso a la cámara y al micrófono activa las solicitudes de permisos habituales del SO (y requiere cadenas de uso en `Info.plist`).
- Los videoclips están limitados a 60s para evitar cargas útiles de nodo demasiado grandes (sobrecarga de base64 más límites de mensajes).

## Vídeo de pantalla en macOS (en el nivel del SO)

Para vídeo de la _pantalla_ (no de la cámara), utilice la aplicación complementaria para macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # imprime la ruta guardada
```

Requiere el permiso **Screen Recording** de macOS (TCC).

## Contenido relacionado

- [Compatibilidad con imágenes y contenido multimedia](/es/nodes/images)
- [Comprensión de contenido multimedia](/es/nodes/media-understanding)
- [Comando de ubicación](/es/nodes/location-command)
