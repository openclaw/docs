---
read_when:
    - Cambiar el comportamiento o los valores predeterminados de las palabras de activación de voz
    - Añadir nuevas plataformas de Node que necesiten sincronización de palabras de activación voice
summary: Palabras de activación de voz globales (gestionadas por el Gateway) y cómo se sincronizan entre Nodes
title: Activación por voz
x-i18n:
    generated_at: "2026-04-26T11:33:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw trata las **palabras de activación** como una única lista global gestionada por el **Gateway**.

- **No hay palabras de activación personalizadas por Node**.
- **Cualquier Node/UI de app puede editar** la lista; los cambios se conservan en el Gateway y se difunden a todos.
- macOS e iOS mantienen toggles locales de **Voice Wake activado/desactivado** (la UX local + los permisos difieren).
- Android actualmente mantiene Voice Wake desactivado y usa un flujo manual de micrófono en la pestaña Voice.

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

- Los triggers se normalizan (se recortan, se eliminan los vacíos). Las listas vacías vuelven a los valores predeterminados.
- Los límites se aplican por seguridad (topes de cantidad/longitud).

### Métodos de enrutamiento (trigger → destino)

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

- Carga de `voicewake.changed` `{ triggers: string[] }`
- Carga de `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Quién lo recibe:

- Todos los clientes WebSocket (app de macOS, WebChat, etc.)
- Todos los Nodes conectados (iOS/Android), y también al conectar un Node como envío inicial del “estado actual”.

## Comportamiento del cliente

### App de macOS

- Usa la lista global para controlar los triggers de `VoiceWakeRuntime`.
- Editar “Trigger words” en los ajustes de Voice Wake llama a `voicewake.set` y luego depende de la difusión para mantener sincronizados a los demás clientes.

### Node de iOS

- Usa la lista global para la detección de triggers de `VoiceWakeManager`.
- Editar Wake Words en Ajustes llama a `voicewake.set` (a través del Gateway WS) y además mantiene reactiva la detección local de palabras de activación.

### Node de Android

- Voice Wake está actualmente desactivado en el runtime/Ajustes de Android.
- La voz en Android usa captura manual de micrófono en la pestaña Voice en lugar de triggers de palabras de activación.

## Relacionado

- [Modo Talk](/es/nodes/talk)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de medios](/es/nodes/media-understanding)
