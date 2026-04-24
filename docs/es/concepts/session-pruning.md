---
read_when:
    - Quieres reducir el crecimiento del contexto causado por las salidas de herramientas
    - Quieres entender la optimización de caché de prompts de Anthropic
summary: Recortar resultados antiguos de herramientas para mantener el contexto ligero y el almacenamiento en caché eficiente
title: Poda de sesión
x-i18n:
    generated_at: "2026-04-24T05:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

La poda de sesión recorta **resultados antiguos de herramientas** del contexto antes de cada llamada al LLM. Reduce el crecimiento del contexto causado por la acumulación de salidas de herramientas (resultados de ejecución, lecturas de archivos, resultados de búsqueda) sin reescribir el texto normal de la conversación.

<Info>
La poda solo ocurre en memoria; no modifica la transcripción de la sesión en disco.
Tu historial completo siempre se conserva.
</Info>

## Por qué importa

Las sesiones largas acumulan salidas de herramientas que inflan la ventana de contexto. Esto
aumenta el coste y puede forzar [Compaction](/es/concepts/compaction) antes de lo
necesario.

La poda es especialmente valiosa para el **prompt caching de Anthropic**. Después de que
expira el TTL de caché, la siguiente solicitud vuelve a almacenar en caché el prompt completo. La poda reduce el
tamaño de escritura en caché, reduciendo directamente el coste.

## Cómo funciona

1. Espera a que expire el TTL de caché (predeterminado: 5 minutos).
2. Encuentra resultados antiguos de herramientas para la poda normal (el texto de la conversación se deja intacto).
3. **Soft-trim** de resultados sobredimensionados: conserva el principio y el final, inserta `...`.
4. **Hard-clear** del resto: lo sustituye por un marcador.
5. Restablece el TTL para que las solicitudes de seguimiento reutilicen la caché recién creada.

## Limpieza heredada de imágenes

OpenClaw también ejecuta una limpieza idempotente independiente para sesiones heredadas más antiguas que
persistían bloques de imagen sin procesar en el historial.

- Conserva los **3 turnos completados más recientes** byte por byte para que los
  prefijos de caché de prompt para seguimientos recientes permanezcan estables.
- Los bloques de imagen antiguos ya procesados en el historial de `user` o `toolResult` pueden
  sustituirse por `[image data removed - already processed by model]`.
- Esto es independiente de la poda normal por TTL de caché. Existe para impedir que
  cargas útiles de imagen repetidas invaliden las cachés de prompt en turnos posteriores.

## Valores predeterminados inteligentes

OpenClaw habilita automáticamente la poda para perfiles de Anthropic:

| Tipo de perfil                                           | Poda habilitada | Heartbeat |
| -------------------------------------------------------- | --------------- | --------- |
| Autenticación OAuth/token de Anthropic (incluida la reutilización de Claude CLI) | Sí | 1 hora    |
| API key                                                  | Sí              | 30 min    |

Si estableces valores explícitos, OpenClaw no los sobrescribe.

## Habilitar o deshabilitar

La poda está desactivada de forma predeterminada para proveedores que no son Anthropic. Para habilitarla:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Para deshabilitarla: configura `mode: "off"`.

## Poda frente a Compaction

|            | Poda               | Compaction              |
| ---------- | ------------------ | ----------------------- |
| **Qué**    | Recorta resultados de herramientas | Resume la conversación |
| **¿Se guarda?** | No (por solicitud) | Sí (en la transcripción) |
| **Ámbito** | Solo resultados de herramientas | Conversación completa   |

Se complementan entre sí: la poda mantiene ligera la salida de herramientas entre
ciclos de Compaction.

## Lecturas adicionales

- [Compaction](/es/concepts/compaction): reducción de contexto basada en resúmenes
- [Configuración del Gateway](/es/gateway/configuration): todos los ajustes de configuración de poda
  (`contextPruning.*`)

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Motor de contexto](/es/concepts/context-engine)
