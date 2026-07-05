---
read_when:
    - Agregar o modificar la captura de cámara en nodos iOS/Android o macOS
    - Extensión de los flujos de trabajo de archivos temporales MEDIA accesibles para agentes
summary: 'Captura de cámara (nodos iOS/Android + app de macOS) para uso del agente: fotos (jpg) y clips de video cortos (mp4)'
title: Captura de cámara
x-i18n:
    generated_at: "2026-07-05T11:30:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw admite captura de cámara para flujos de trabajo de agentes en nodos **iOS**, **Android** y **macOS** emparejados: captura una foto (`jpg`) o un clip de video corto (`mp4`, con audio opcional) mediante Gateway `node.invoke`.

Todo acceso a la cámara está protegido por una configuración controlada por el usuario en cada plataforma.

## Nodo iOS

### Configuración de usuario de iOS

- Pestaña Configuración de iOS → **Cámara** → **Permitir cámara** (`camera.enabled`).
  - Valor predeterminado: **activado** (una clave ausente se trata como habilitada).
  - Cuando está desactivado: los comandos `camera.*` devuelven `CAMERA_DISABLED`.

### Comandos de iOS (mediante Gateway `node.invoke`)

- `camera.list`
  - Carga útil de respuesta: `devices` — arreglo de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parámetros:
    - `facing`: `front|back` (valor predeterminado: `front`)
    - `maxWidth`: número (opcional; valor predeterminado `1600`)
    - `quality`: `0..1` (opcional; valor predeterminado `0.9`, limitado a `[0.05, 1.0]`)
    - `format`: actualmente `jpg`
    - `delayMs`: número (opcional; valor predeterminado `0`, limitado internamente a `10000`)
    - `deviceId`: cadena (opcional; de `camera.list`)
  - Carga útil de respuesta: `format: "jpg"`, `base64`, `width`, `height`.
  - Protección de carga útil: las fotos se recomprimen para mantener la carga útil codificada en base64 por debajo de 5 MB.

- `camera.clip`
  - Parámetros:
    - `facing`: `front|back` (valor predeterminado: `front`)
    - `durationMs`: número (valor predeterminado `3000`, limitado a `[250, 60000]`)
    - `includeAudio`: booleano (valor predeterminado `true`)
    - `format`: actualmente `mp4`
    - `deviceId`: cadena (opcional; de `camera.list`)
  - Carga útil de respuesta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Requisito de primer plano de iOS

Al igual que `canvas.*`, el nodo iOS solo permite comandos `camera.*` en **primer plano**. Las invocaciones en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`.

### Ayudante de CLI

La forma más sencilla de obtener archivos multimedia es mediante el ayudante de CLI, que escribe los medios decodificados en un archivo temporal e imprime la ruta guardada.

```bash
openclaw nodes camera snap --node <id>                 # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` usa `--facing both` como valor predeterminado, capturando tanto la cámara frontal como la trasera para dar al agente ambas vistas; pasa `--device-id` con una sola orientación explícita (`both` se rechaza cuando `--device-id` está establecido). Los archivos de salida son temporales (en el directorio temporal del SO) a menos que crees tu propio contenedor.

## Nodo Android

### Configuración de usuario de Android

- Hoja de configuración de Android → **Cámara** → **Permitir cámara** (`camera.enabled`).
  - **Las instalaciones nuevas vienen desactivadas de forma predeterminada.** Las instalaciones existentes anteriores a esta configuración se migran a **activado** para que las actualizaciones no pierdan silenciosamente el acceso a la cámara que funcionaba antes.
  - Cuando está desactivado: los comandos `camera.*` devuelven `CAMERA_DISABLED: enable Camera in Settings`.

### Permisos

- `CAMERA` es necesario tanto para `camera.snap` como para `camera.clip`; si falta el permiso o se deniega, devuelve `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` es necesario para `camera.clip` cuando `includeAudio` es `true`; si falta el permiso o se deniega, devuelve `MIC_PERMISSION_REQUIRED`.

La app solicita permisos en tiempo de ejecución cuando es posible.

### Requisito de primer plano de Android

Al igual que `canvas.*`, el nodo Android solo permite comandos `camera.*` en **primer plano**. Las invocaciones en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Comandos de Android (mediante Gateway `node.invoke`)

- `camera.list`
  - Carga útil de respuesta: `devices` — arreglo de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parámetros: `facing` (`front|back`, valor predeterminado `front`), `quality` (valor predeterminado `0.95`, limitado a `[0.1, 1.0]`), `maxWidth` (valor predeterminado `1600`), `deviceId` (opcional; un id desconocido falla con `INVALID_REQUEST`).
  - Carga útil de respuesta: `format: "jpg"`, `base64`, `width`, `height`.
  - Protección de carga útil: se recomprime para mantener base64 por debajo de 5 MB (el mismo presupuesto que iOS).

- `camera.clip`
  - Parámetros: `facing` (valor predeterminado `front`), `durationMs` (valor predeterminado `3000`, limitado a `[200, 60000]`), `includeAudio` (valor predeterminado `true`), `deviceId` (opcional).
  - Carga útil de respuesta: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Protección de carga útil: el MP4 sin procesar está limitado a 18 MB antes de la codificación base64; los clips de tamaño excesivo fallan con `PAYLOAD_TOO_LARGE` (reduce `durationMs` y vuelve a intentarlo).

## App de macOS

### Configuración de usuario de macOS

La app complementaria de macOS expone una casilla:

- **Configuración → General → Permitir cámara** (`openclaw.cameraEnabled`).
  - Valor predeterminado: **desactivado**.
  - Cuando está desactivado: las solicitudes de cámara devuelven `CAMERA_DISABLED: enable Camera in Settings`.

### Ayudante de CLI (invocación de nodo)

Usa la CLI principal `openclaw` para invocar comandos de cámara en el nodo macOS.

```bash
openclaw nodes camera list --node <id>                     # list camera ids
openclaw nodes camera snap --node <id>                     # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000   # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` usa `maxWidth=1600` como valor predeterminado a menos que se sobrescriba.
- `camera.snap` espera `delayMs` (valor predeterminado 2000 ms, limitado a `[0, 10000]`) después del calentamiento/estabilización de la exposición antes de capturar.
- Las cargas útiles de fotos se recomprimen para mantener base64 por debajo de 5 MB.

## Seguridad + límites prácticos

- El acceso a la cámara y al micrófono activa los avisos habituales de permisos del SO (y requiere cadenas de uso en `Info.plist`).
- Los clips de video están limitados a 60 s para evitar cargas útiles de nodo demasiado grandes (sobrecarga de base64 más límites de mensajes).

## Video de pantalla en macOS (nivel de SO)

Para video de _pantalla_ (no cámara), usa la app complementaria de macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

Requiere permiso de **Grabación de pantalla** de macOS (TCC).

## Relacionado

- [Compatibilidad con imágenes y medios](/es/nodes/images)
- [Comprensión de medios](/es/nodes/media-understanding)
- [Comando de ubicación](/es/nodes/location-command)
