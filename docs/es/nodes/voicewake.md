---
read_when:
    - Cambiar el comportamiento o los valores predeterminados de las palabras de activación por voz
    - Agregar nuevas plataformas de Node que necesitan sincronización de palabra de activación
summary: Palabras de activación por voz globales (propiedad del Gateway) y cómo se sincronizan entre nodos
title: Activación por voz
x-i18n:
    generated_at: "2026-06-27T11:56:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw trata las **palabras de activación como una única lista global** propiedad del **Gateway**.

- No hay **palabras de activación personalizadas por nodo**.
- **Cualquier IU de nodo/app puede editar** la lista; los cambios los persiste el Gateway y se transmiten a todos.
- macOS e iOS mantienen interruptores locales de **activación/desactivación de Activación por voz** (la UX local y los permisos difieren).
- Android actualmente mantiene la Activación por voz desactivada y usa un flujo manual de micrófono en la pestaña Voz.

## Almacenamiento (host del Gateway)

Las palabras de activación y las reglas de enrutamiento se almacenan en la base de datos de estado del gateway:

- `~/.openclaw/state/openclaw.sqlite`

Las tablas activas son:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

Los archivos heredados `settings/voicewake.json` y `settings/voicewake-routing.json` son
solo entradas de migración de doctor; en tiempo de ejecución se leen y escriben las tablas SQLite.

## Protocolo

### Métodos

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` con parámetros `{ triggers: string[] }` → `{ triggers: string[] }`

Notas:

- Los disparadores se normalizan (se recortan y se descartan los vacíos). Las listas vacías recurren a los valores predeterminados.
- Se aplican límites por seguridad (topes de cantidad/longitud).

### Métodos de enrutamiento (disparador → destino)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` con parámetros `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Forma de `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Los destinos de ruta admiten exactamente uno de los siguientes:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Eventos

- carga útil de `voicewake.changed` `{ triggers: string[] }`
- carga útil de `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Quién lo recibe:

- Todos los clientes WebSocket (app de macOS, WebChat, etc.)
- Todos los nodos conectados (iOS/Android), y también al conectar un nodo como envío inicial del “estado actual”.

## Comportamiento del cliente

### App de macOS

- Usa la lista global para filtrar los disparadores de `VoiceWakeRuntime`.
- Editar “Palabras de activación” en la configuración de Activación por voz llama a `voicewake.set` y luego depende de la transmisión para mantener sincronizados a los demás clientes.

### Nodo iOS

- Usa la lista global para la detección de disparadores de `VoiceWakeManager`.
- Editar Palabras de activación en Configuración llama a `voicewake.set` (a través del WS del Gateway) y también mantiene receptiva la detección local de palabras de activación.

### Nodo Android

- La Activación por voz está actualmente deshabilitada en el runtime/la Configuración de Android.
- La voz de Android usa captura manual de micrófono en la pestaña Voz en lugar de disparadores por palabras de activación.

## Relacionado

- [Modo conversación](/es/nodes/talk)
- [Notas de audio y voz](/es/nodes/audio)
- [Comprensión multimedia](/es/nodes/media-understanding)
