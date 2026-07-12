---
read_when:
    - Añadir o modificar la captura de cámara en nodos iOS/Android o macOS
    - Ampliación de los flujos de trabajo de archivos temporales MEDIA accesibles para los agentes
summary: 'Captura de cámara (nodos iOS/Android + aplicación para macOS) para uso del agente: fotos (jpg) y videoclips cortos (mp4)'
title: Captura de cámara
x-i18n:
    generated_at: "2026-07-11T23:12:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw admite la captura con cámara para flujos de trabajo de agentes en nodos **iOS**, **Android** y **macOS** emparejados: capture una foto (`jpg`) o un videoclip corto (`mp4`, con audio opcional) mediante `node.invoke` del Gateway.

Todo acceso a la cámara está sujeto a una configuración controlada por el usuario en cada plataforma.

## Nodo iOS

### Configuración de usuario de iOS

- Pestaña Settings de iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - Valor predeterminado: **activado** (si falta la clave, se considera activado).
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
    - `delayMs`: número (opcional; valor predeterminado: `0`, limitado internamente a `10000`)
    - `deviceId`: cadena (opcional; procedente de `camera.list`)
  - Carga útil de respuesta: `format: "jpg"`, `base64`, `width`, `height`.
  - Protección de la carga útil: las fotos se vuelven a comprimir para mantener la carga útil codificada en base64 por debajo de 5 MB.

- `camera.clip`
  - Parámetros:
    - `facing`: `front|back` (valor predeterminado: `front`)
    - `durationMs`: número (valor predeterminado: `3000`, limitado a `[250, 60000]`)
    - `includeAudio`: booleano (valor predeterminado: `true`)
    - `format`: actualmente `mp4`
    - `deviceId`: cadena (opcional; procedente de `camera.list`)
  - Carga útil de respuesta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Requisito de primer plano en iOS

Al igual que `canvas.*`, el nodo iOS solo permite comandos `camera.*` en **primer plano**. Las invocaciones en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`.

### Ayudante de la CLI

La forma más sencilla de obtener archivos multimedia es mediante el ayudante de la CLI, que escribe el contenido multimedia decodificado en un archivo temporal e imprime la ruta guardada.

```bash
openclaw nodes camera snap --node <id>                 # predeterminado: frontal y trasera (2 líneas MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

El valor predeterminado de `nodes camera snap` es `--facing both`, que captura con las cámaras frontal y trasera para proporcionar al agente ambas vistas; use `--device-id` con una única orientación explícita (`both` se rechaza cuando se establece `--device-id`). Los archivos de salida son temporales (en el directorio temporal del sistema operativo), salvo que cree su propio contenedor.

## Nodo Android

### Configuración de usuario de Android

- Panel Settings de Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **En las instalaciones nuevas, está desactivado de forma predeterminada.** Las instalaciones existentes anteriores a esta configuración se migran a **activado** para que las actualizaciones no pierdan silenciosamente el acceso a la cámara que funcionaba anteriormente.
  - Cuando está desactivado: los comandos `camera.*` devuelven `CAMERA_DISABLED: enable Camera in Settings`.

### Permisos

- Se requiere `CAMERA` tanto para `camera.snap` como para `camera.clip`; si el permiso falta o se deniega, se devuelve `CAMERA_PERMISSION_REQUIRED`.
- Se requiere `RECORD_AUDIO` para `camera.clip` cuando `includeAudio` es `true`; si el permiso falta o se deniega, se devuelve `MIC_PERMISSION_REQUIRED`.

La aplicación solicita los permisos en tiempo de ejecución cuando es posible.

### Requisito de primer plano en Android

Al igual que `canvas.*`, el nodo Android solo permite comandos `camera.*` en **primer plano**. Las invocaciones en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Comandos de Android (mediante `node.invoke` del Gateway)

- `camera.list`
  - Carga útil de respuesta: `devices` — matriz de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parámetros: `facing` (`front|back`, valor predeterminado: `front`), `quality` (valor predeterminado: `0.95`, limitado a `[0.1, 1.0]`), `maxWidth` (valor predeterminado: `1600`), `deviceId` (opcional; un identificador desconocido produce `INVALID_REQUEST`).
  - Carga útil de respuesta: `format: "jpg"`, `base64`, `width`, `height`.
  - Protección de la carga útil: se vuelve a comprimir para mantener el contenido base64 por debajo de 5 MB (el mismo límite que en iOS).

- `camera.clip`
  - Parámetros: `facing` (valor predeterminado: `front`), `durationMs` (valor predeterminado: `3000`, limitado a `[200, 60000]`), `includeAudio` (valor predeterminado: `true`), `deviceId` (opcional).
  - Carga útil de respuesta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Protección de la carga útil: el MP4 sin codificar está limitado a 18 MB antes de la codificación base64; los clips que superen el tamaño permitido fallan con `PAYLOAD_TOO_LARGE` (reduzca `durationMs` y vuelva a intentarlo).

## Aplicación para macOS

### Configuración de usuario de macOS

La aplicación complementaria para macOS ofrece una casilla:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Valor predeterminado: **desactivado**.
  - Cuando está desactivado: las solicitudes de cámara devuelven `CAMERA_DISABLED: enable Camera in Settings`.

### Ayudante de la CLI (invocación de nodo)

Use la CLI principal de `openclaw` para invocar comandos de cámara en el nodo macOS.

```bash
openclaw nodes camera list --node <id>                     # enumera los identificadores de cámara
openclaw nodes camera snap --node <id>                     # imprime la ruta guardada
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # imprime la ruta guardada
openclaw nodes camera clip --node <id> --duration-ms 3000   # imprime la ruta guardada (opción heredada)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` usa `maxWidth=1600` de forma predeterminada, salvo que se sobrescriba.
- `camera.snap` espera `delayMs` (valor predeterminado: 2000 ms, limitado a `[0, 10000]`) después de que finalicen el calentamiento y el ajuste de la exposición antes de realizar la captura.
- Las cargas útiles de las fotos se vuelven a comprimir para mantener el contenido base64 por debajo de 5 MB.

## Seguridad y límites prácticos

- El acceso a la cámara y al micrófono activa las solicitudes de permisos habituales del sistema operativo (y requiere cadenas de uso en `Info.plist`).
- Los videoclips están limitados a 60 s para evitar cargas útiles de nodo demasiado grandes (sobrecarga de base64 más límites de los mensajes).

## Vídeo de la pantalla en macOS (a nivel del sistema operativo)

Para grabar vídeo de la _pantalla_ (no de la cámara), use la aplicación complementaria para macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # imprime la ruta guardada
```

Requiere el permiso **Screen Recording** de macOS (TCC).

## Temas relacionados

- [Compatibilidad con imágenes y contenido multimedia](/es/nodes/images)
- [Comprensión de contenido multimedia](/es/nodes/media-understanding)
- [Comando de ubicación](/es/nodes/location-command)
