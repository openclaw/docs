---
read_when:
    - Cambiar el comportamiento o los valores predeterminados de las palabras de activación por voz
    - Agregar nuevas plataformas Node que necesitan sincronización de palabra de activación
summary: Palabras de activación por voz globales (propiedad del Gateway) y cómo se sincronizan entre nodos
title: Activación por voz
x-i18n:
    generated_at: "2026-05-06T09:04:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw trata las **palabras de activación como una única lista global** propiedad del **Gateway**.

- No hay **palabras de activación personalizadas por nodo**.
- **Cualquier interfaz de nodo/app puede editar** la lista; los cambios los persiste el Gateway y se transmiten a todos.
- macOS e iOS mantienen interruptores locales de **Activación por voz habilitada/deshabilitada** (la UX local y los permisos difieren).
- Android actualmente mantiene la Activación por voz desactivada y usa un flujo manual de micrófono en la pestaña Voz.

## Almacenamiento (host del Gateway)

Las palabras de activación se almacenan en la máquina del gateway en:

- `~/.openclaw/settings/voicewake.json`

Forma:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocolo

### Métodos

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` con parámetros `{ triggers: string[] }` → `{ triggers: string[] }`

Notas:

- Los activadores se normalizan (se recortan, se eliminan los vacíos). Las listas vacías vuelven a los valores predeterminados.
- Se aplican límites por seguridad (topes de cantidad/longitud).

### Métodos de enrutamiento (activador → destino)

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

Los destinos de ruta admiten exactamente uno de:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Eventos

- `voicewake.changed` con carga `{ triggers: string[] }`
- `voicewake.routing.changed` con carga `{ config: VoiceWakeRoutingConfig }`

Quién lo recibe:

- Todos los clientes WebSocket (app de macOS, WebChat, etc.)
- Todos los nodos conectados (iOS/Android), y también al conectar un nodo como envío inicial del "estado actual".

## Comportamiento del cliente

### App de macOS

- Usa la lista global para controlar los activadores de `VoiceWakeRuntime`.
- Editar "Palabras de activación" en la configuración de Activación por voz llama a `voicewake.set` y luego depende de la transmisión para mantener sincronizados a los demás clientes.

### Nodo iOS

- Usa la lista global para la detección de activadores de `VoiceWakeManager`.
- Editar Palabras de activación en Ajustes llama a `voicewake.set` (a través del WS del Gateway) y también mantiene receptiva la detección local de palabras de activación.

### Nodo Android

- La Activación por voz está actualmente deshabilitada en el runtime/la Configuración de Android.
- La voz en Android usa la captura manual de micrófono en la pestaña Voz en lugar de activadores por palabra de activación.

## Relacionado

- [Modo conversación](/es/nodes/talk)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión multimedia](/es/nodes/media-understanding)
