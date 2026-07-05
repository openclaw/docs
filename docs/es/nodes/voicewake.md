---
read_when:
    - Cambiar el comportamiento o los valores predeterminados de las palabras de activación por voz
    - Añadir nuevas plataformas Node que necesitan sincronización de palabra de activación
summary: Palabras de activación de voz globales (propiedad del Gateway) y cómo se sincronizan entre nodos
title: Activación por voz
x-i18n:
    generated_at: "2026-07-05T11:28:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ec1980dd69a041e7dfeaa9d74e370e3279b22aa7ed19b72067ee56f3f696899
    source_path: nodes/voicewake.md
    workflow: 16
---

Las palabras de activación son **una lista global propiedad del Gateway**; no hay listas personalizadas por nodo. Cualquier nodo o interfaz de app puede editar la lista; el Gateway conserva el cambio y lo transmite a todos los clientes conectados.

- **macOS**: interruptor local para activar/desactivar Voice Wake. Requiere macOS 26+; consulta [Activación por voz (macOS)](/es/platforms/mac/voicewake) para detalles de runtime/PTT.
- **iOS**: interruptor local para activar/desactivar Voice Wake en Configuración.
- **Android**: Voice Wake se desactiva forzosamente en runtime. La pestaña Voz usa captura manual del micrófono en lugar de activadores por palabra de activación.

## Almacenamiento

Las palabras de activación y las reglas de enrutamiento viven en la base de datos de estado del Gateway, `~/.openclaw/state/openclaw.sqlite` de forma predeterminada (se puede sobrescribir con `OPENCLAW_STATE_DIR`), en las tablas `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`. Los archivos heredados `settings/voicewake.json` y `settings/voicewake-routing.json` son solo entradas de migración para `openclaw doctor --fix`; el runtime nunca los lee.

## Protocolo

### Lista de activadores

| Método         | Parámetros              | Resultado                |
| -------------- | ----------------------- | ------------------------ |
| `voicewake.get` | ninguno                | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normaliza la entrada: recorta espacios en blanco, elimina entradas vacías, conserva como máximo 32 activadores y trunca cada uno a 64 caracteres. Un resultado vacío vuelve a los valores predeterminados integrados (`openclaw`, `claude`, `computer`).

### Enrutamiento (activador a destino)

| Método                  | Parámetros                           | Resultado                            |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | ninguno                             | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Cada `target` de ruta admite exactamente uno de estos:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Límites: como máximo 32 rutas, texto del activador de como máximo 64 caracteres. Los activadores de ruta se normalizan para coincidencia y detección de duplicados convirtiendo a minúsculas, quitando la puntuación inicial/final de cada palabra y colapsando los espacios en blanco (`"Hey, Bot!!"` y `"hey bot"` coinciden y cuentan como duplicados); esta es una normalización más estricta que el recorte simple usado para la lista global de activadores anterior.

### Eventos

| Evento                      | Carga útil                          |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Ambos se transmiten a todos los clientes WebSocket con ámbito de lectura (app de macOS, WebChat y similares) y a todos los nodos conectados. Un nodo también recibe ambos como envío de instantánea inicial justo después de conectarse.

## Comportamiento del cliente

- **macOS**: llama a `voicewake.set`/`voicewake.get` y escucha `voicewake.changed` para mantenerse sincronizado con otros clientes.
- **iOS**: llama a `voicewake.set`/`voicewake.get` y escucha `voicewake.changed` para mantener ágil la detección local de palabras de activación.
- **Android**: existen `VoiceWakeMode` (`Off`/`Foreground`/`Always`) y código de sincronización con el Gateway, pero la app fuerza el modo a `Off` al iniciar; Voice Wake no está disponible actualmente desde Configuración de Android.

## Relacionado

- [Modo de conversación](/es/nodes/talk)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de medios](/es/nodes/media-understanding)
