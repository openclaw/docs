---
read_when:
    - Cambiar el comportamiento o los valores predeterminados de las palabras de activación por voz
    - Añadir nuevas plataformas de Node que necesitan sincronización de la palabra de activación
summary: Palabras de activación por voz globales (gestionadas por el Gateway) y cómo se sincronizan entre nodos
title: Activación por voz
x-i18n:
    generated_at: "2026-07-12T14:38:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8a8c7a8bb2ee5bbc57d9141cd8f2176246cc61952b0ed42257f83af2c777427
    source_path: nodes/voicewake.md
    workflow: 16
---

Las palabras de activación son **una única lista global administrada por el Gateway**; no hay listas personalizadas por nodo. Cualquier nodo o interfaz de aplicación puede editar la lista; el Gateway conserva el cambio y lo transmite a todos los clientes conectados.

- **macOS**: control local para activar o desactivar Voice Wake. Requiere macOS 26+; consulte [Activación por voz (macOS)](/es/platforms/mac/voicewake) para obtener detalles sobre el entorno de ejecución y PTT.
- **iOS**: control local para activar o desactivar Voice Wake en Settings.
- **Android**: no implementa Voice Wake. La pestaña Voice utiliza la captura manual del micrófono en lugar de activadores por palabra de activación.

## Almacenamiento

Las palabras de activación y las reglas de enrutamiento se almacenan en la base de datos de estado del Gateway, `~/.openclaw/state/openclaw.sqlite` de forma predeterminada (se puede sustituir mediante `OPENCLAW_STATE_DIR`), en las tablas `voicewake_triggers`, `voicewake_routing_config` y `voicewake_routing_routes`. Los archivos heredados `settings/voicewake.json` y `settings/voicewake-routing.json` solo se utilizan como entradas de migración de `openclaw doctor --fix`; el entorno de ejecución nunca los lee.

## Protocolo

### Lista de activadores

| Método          | Parámetros               | Resultado                |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | ninguno                  | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normaliza la entrada: elimina los espacios en blanco iniciales y finales, descarta las entradas vacías, conserva como máximo 32 activadores y trunca cada uno a 64 unidades de código UTF-16 sin dividir pares sustitutos. Si el resultado está vacío, se utilizan los valores predeterminados integrados (`openclaw`, `claude`, `computer`).

### Enrutamiento (del activador al destino)

| Método                  | Parámetros                           | Resultado                            |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | ninguno                              | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Cada `target` de ruta admite exactamente una de estas opciones:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Límites: como máximo 32 rutas y un texto de activación de 64 caracteres como máximo. Los activadores de ruta se normalizan para la coincidencia y la detección de duplicados convirtiéndolos a minúsculas, eliminando la puntuación inicial y final de cada palabra y contrayendo los espacios en blanco (`"Hey, Bot!!"` y `"hey bot"` coinciden y cuentan como duplicados). Esta normalización es más estricta que la simple eliminación de espacios iniciales y finales utilizada anteriormente para la lista global de activadores.

### Eventos

| Evento                      | Carga útil                           |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Ambos se transmiten a todos los clientes WebSocket con ámbito de lectura (la aplicación para macOS, WebChat y similares) y a todos los nodos conectados. Cada nodo también recibe ambos como envío de instantánea inicial justo después de conectarse.

## Comportamiento de los clientes

- **macOS**: llama a `voicewake.set`/`voicewake.get` y escucha `voicewake.changed` para mantenerse sincronizado con los demás clientes.
- **iOS**: llama a `voicewake.set`/`voicewake.get` y escucha `voicewake.changed` para mantener receptiva la detección local de palabras de activación.
- **Android**: no anuncia la capacidad `voiceWake` ni consume actualizaciones de palabras de activación.

## Temas relacionados

- [Modo de conversación](/es/nodes/talk)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de contenido multimedia](/es/nodes/media-understanding)
