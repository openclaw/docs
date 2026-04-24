---
read_when:
    - Cambiar el comportamiento o los valores predeterminados de las palabras de activación por voz
    - Agregar nuevas plataformas de nodos que necesitan sincronización de palabras de activación
summary: Palabras de activación por voz globales (propiedad de Gateway) y cómo se sincronizan entre nodos
title: Activación por voz
x-i18n:
    generated_at: "2026-04-24T05:37:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw trata las **palabras de activación** como una única lista global propiedad de **Gateway**.

- No hay **palabras de activación personalizadas por nodo**.
- **Cualquier nodo/UI de app puede editar** la lista; Gateway conserva los cambios y los difunde a todos.
- macOS e iOS mantienen alternancias locales de **Voice Wake activado/desactivado** (la UX local + los permisos son diferentes).
- Android actualmente mantiene Voice Wake desactivado y usa un flujo manual de micrófono en la pestaña Voice.

## Almacenamiento (host de Gateway)

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

- Los desencadenadores se normalizan (se recortan, se eliminan los vacíos). Las listas vacías vuelven a los valores predeterminados.
- Se aplican límites por seguridad (topes de cantidad/longitud).

### Eventos

- `voicewake.changed` con carga útil `{ triggers: string[] }`

Quién lo recibe:

- Todos los clientes WebSocket (app de macOS, WebChat, etc.)
- Todos los nodos conectados (iOS/Android), y también al conectar el nodo como un envío inicial del “estado actual”.

## Comportamiento del cliente

### App de macOS

- Usa la lista global para filtrar desencadenadores de `VoiceWakeRuntime`.
- Editar “Trigger words” en la configuración de Voice Wake llama a `voicewake.set` y luego se basa en la difusión para mantener sincronizados a los demás clientes.

### Nodo de iOS

- Usa la lista global para la detección de desencadenadores de `VoiceWakeManager`.
- Editar Wake Words en Settings llama a `voicewake.set` (a través del WS de Gateway) y también mantiene sensible la detección local de palabras de activación.

### Nodo de Android

- Voice Wake está actualmente desactivado en el tiempo de ejecución/Settings de Android.
- La voz en Android usa captura manual de micrófono en la pestaña Voice en lugar de desencadenadores por palabra de activación.

## Relacionado

- [Modo Talk](/es/nodes/talk)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de contenido multimedia](/es/nodes/media-understanding)
