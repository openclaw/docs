---
read_when:
    - Agregar o modificar la captura de cámara en nodos iOS/Android o macOS
    - Extensión de los flujos de trabajo de archivos temporales MEDIA accesibles para agentes
summary: 'Captura de cámara (nodos iOS/Android + app para macOS) para uso del agente: fotos (jpg) y clips de video cortos (mp4)'
title: Captura de cámara
x-i18n:
    generated_at: "2026-06-27T11:52:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw admite la **captura de cámara** para flujos de trabajo de agentes:

- **Nodo iOS** (emparejado mediante Gateway): captura una **foto** (`jpg`) o un **clip de video corto** (`mp4`, con audio opcional) mediante `node.invoke`.
- **Nodo Android** (emparejado mediante Gateway): captura una **foto** (`jpg`) o un **clip de video corto** (`mp4`, con audio opcional) mediante `node.invoke`.
- **App macOS** (nodo mediante Gateway): captura una **foto** (`jpg`) o un **clip de video corto** (`mp4`, con audio opcional) mediante `node.invoke`.

Todo el acceso a la cámara está protegido por **ajustes controlados por el usuario**.

## Nodo iOS

### Ajuste de usuario (activado de forma predeterminada)

- Pestaña Ajustes de iOS → **Cámara** → **Permitir cámara** (`camera.enabled`)
  - Predeterminado: **activado** (si falta la clave, se trata como habilitado).
  - Cuando está desactivado: los comandos `camera.*` devuelven `CAMERA_DISABLED`.

### Comandos (mediante Gateway `node.invoke`)

- `camera.list`
  - Carga útil de respuesta:
    - `devices`: matriz de `{ id, name, position, deviceType }`

- `camera.snap`
  - Parámetros:
    - `facing`: `front|back` (predeterminado: `front`)
    - `maxWidth`: número (opcional; predeterminado `1600` en el nodo iOS)
    - `quality`: `0..1` (opcional; predeterminado `0.9`)
    - `format`: actualmente `jpg`
    - `delayMs`: número (opcional; predeterminado `0`)
    - `deviceId`: cadena (opcional; de `camera.list`)
  - Carga útil de respuesta:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Protección de carga útil: las fotos se recomprimen para mantener la carga útil base64 por debajo de 5 MB.

- `camera.clip`
  - Parámetros:
    - `facing`: `front|back` (predeterminado: `front`)
    - `durationMs`: número (predeterminado `3000`, limitado a un máximo de `60000`)
    - `includeAudio`: booleano (predeterminado `true`)
    - `format`: actualmente `mp4`
    - `deviceId`: cadena (opcional; de `camera.list`)
  - Carga útil de respuesta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Requisito de primer plano

Al igual que `canvas.*`, el nodo iOS solo permite comandos `camera.*` en **primer plano**. Las invocaciones en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`.

### Ayudante de CLI

La forma más sencilla de obtener archivos multimedia es mediante el ayudante de CLI, que escribe los medios decodificados en un archivo temporal e imprime la ruta guardada.

Ejemplos:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Notas:

- `nodes camera snap` usa de forma predeterminada **ambas** orientaciones para dar al agente ambas vistas.
- Los archivos de salida son temporales (en el directorio temporal del SO) salvo que crees tu propio envoltorio.

## Nodo Android

### Ajuste de usuario de Android (activado de forma predeterminada)

- Hoja de Ajustes de Android → **Cámara** → **Permitir cámara** (`camera.enabled`)
  - Predeterminado: **activado** (si falta la clave, se trata como habilitado).
  - Cuando está desactivado: los comandos `camera.*` devuelven `CAMERA_DISABLED`.

### Permisos

- Android requiere permisos en tiempo de ejecución:
  - `CAMERA` para `camera.snap` y `camera.clip`.
  - `RECORD_AUDIO` para `camera.clip` cuando `includeAudio=true`.

Si faltan permisos, la app solicitará autorización cuando sea posible; si se deniega, las solicitudes `camera.*` fallan con un error
`*_PERMISSION_REQUIRED`.

### Requisito de primer plano en Android

Al igual que `canvas.*`, el nodo Android solo permite comandos `camera.*` en **primer plano**. Las invocaciones en segundo plano devuelven `NODE_BACKGROUND_UNAVAILABLE`.

### Comandos de Android (mediante Gateway `node.invoke`)

- `camera.list`
  - Carga útil de respuesta:
    - `devices`: matriz de `{ id, name, position, deviceType }`

### Protección de carga útil

Las fotos se recomprimen para mantener la carga útil base64 por debajo de 5 MB.

## App macOS

### Ajuste de usuario (desactivado de forma predeterminada)

La app complementaria de macOS expone una casilla:

- **Ajustes → General → Permitir cámara** (`openclaw.cameraEnabled`)
  - Predeterminado: **desactivado**
  - Cuando está desactivado: las solicitudes de cámara devuelven "Cámara desactivada por el usuario".

### Ayudante de CLI (invocación de nodo)

Usa la CLI principal `openclaw` para invocar comandos de cámara en el nodo macOS.

Ejemplos:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Notas:

- `openclaw nodes camera snap` usa `maxWidth=1600` de forma predeterminada salvo que se sobrescriba.
- En macOS, `camera.snap` espera `delayMs` (predeterminado 2000 ms) después del calentamiento y la estabilización de la exposición antes de capturar.
- Las cargas útiles de foto se recomprimen para mantener base64 por debajo de 5 MB.

## Seguridad + límites prácticos

- El acceso a la cámara y al micrófono activa las indicaciones habituales de permisos del SO (y requiere cadenas de uso en Info.plist).
- Los clips de video están limitados (actualmente `<= 60s`) para evitar cargas útiles de nodo sobredimensionadas (sobrecarga de base64 + límites de mensajes).

## Video de pantalla de macOS (a nivel de SO)

Para video de _pantalla_ (no de cámara), usa el complemento de macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

Notas:

- Requiere permiso de **Grabación de pantalla** de macOS (TCC).

## Relacionado

- [Compatibilidad con imágenes y medios](/es/nodes/images)
- [Comprensión de medios](/es/nodes/media-understanding)
- [Comando de ubicación](/es/nodes/location-command)
