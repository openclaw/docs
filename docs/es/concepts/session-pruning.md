---
read_when:
    - Quieres reducir el crecimiento del contexto por las salidas de herramientas
    - Quieres entender la optimización de la caché de prompts de Anthropic
summary: Recortar resultados antiguos de herramientas para mantener el contexto ligero y el almacenamiento en caché eficiente
title: Poda de sesión
x-i18n:
    generated_at: "2026-04-26T11:27:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 15
---

La poda de sesión recorta los **resultados antiguos de herramientas** del contexto antes de cada llamada al LLM. Reduce el crecimiento del contexto por salidas acumuladas de herramientas (resultados de ejecución, lecturas de archivos, resultados de búsqueda) sin reescribir el texto normal de la conversación.

<Info>
La poda es solo en memoria; no modifica la transcripción de la sesión en disco.
Tu historial completo siempre se conserva.
</Info>

## Por qué importa

Las sesiones largas acumulan salidas de herramientas que inflan la ventana de contexto. Esto aumenta el costo y puede forzar la [Compaction](/es/concepts/compaction) antes de lo necesario.

La poda es especialmente valiosa para la **caché de prompts de Anthropic**. Después de que expire el TTL de la caché, la siguiente solicitud vuelve a almacenar en caché el prompt completo. La poda reduce el tamaño de escritura en caché, lo que reduce directamente el costo.

## Cómo funciona

1. Espera a que expire el TTL de la caché (predeterminado: 5 minutos).
2. Encuentra resultados antiguos de herramientas para la poda normal (el texto de la conversación se deja intacto).
3. **Recorte suave** de resultados sobredimensionados: conserva el inicio y el final, e inserta `...`.
4. **Borrado total** del resto: sustitúyelo por un marcador de posición.
5. Restablece el TTL para que las solicitudes posteriores reutilicen la caché nueva.

## Limpieza heredada de imágenes

OpenClaw también crea una vista de repetición idempotente independiente para sesiones que
persisten bloques de imagen sin procesar o marcadores de medios de hidratación del prompt en el historial.

- Conserva los **3 turnos completados más recientes** byte por byte para que los
  prefijos de caché de prompts de seguimientos recientes sigan siendo estables.
- En la vista de repetición, los bloques de imagen más antiguos ya procesados del historial de `user` o
  `toolResult` pueden sustituirse por
  `[image data removed - already processed by model]`.
- Las referencias textuales de medios más antiguas, como `[media attached: ...]`,
  `[Image: source: ...]` y `media://inbound/...`, pueden sustituirse por
  `[media reference removed - already processed by model]`. Los marcadores de archivos adjuntos del turno actual permanecen intactos para que los modelos de visión puedan seguir hidratando imágenes nuevas.
- La transcripción sin procesar de la sesión no se reescribe, por lo que los visores del historial pueden seguir renderizando las entradas de mensaje originales y sus imágenes.
- Esto es independiente de la poda normal por TTL de caché. Existe para evitar que cargas útiles de imagen repetidas o referencias de medios obsoletas invaliden las cachés de prompts en turnos posteriores.

## Valores predeterminados inteligentes

OpenClaw habilita automáticamente la poda para perfiles de Anthropic:

| Tipo de perfil                                         | Poda habilitada | Heartbeat |
| ------------------------------------------------------ | --------------- | --------- |
| Autenticación OAuth/token de Anthropic (incluida la reutilización de Claude CLI) | Sí | 1 hora |
| Clave de API                                           | Sí              | 30 min    |

Si estableces valores explícitos, OpenClaw no los sobrescribe.

## Habilitar o deshabilitar

La poda está desactivada de forma predeterminada para proveedores que no sean Anthropic. Para habilitarla:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Para deshabilitarla: establece `mode: "off"`.

## Poda frente a Compaction

|            | Poda                | Compaction              |
| ---------- | ------------------- | ----------------------- |
| **Qué**    | Recorta resultados de herramientas | Resume la conversación |
| **¿Se guarda?** | No (por solicitud) | Sí (en la transcripción) |
| **Ámbito** | Solo resultados de herramientas | Conversación completa |

Se complementan entre sí: la poda mantiene ligera la salida de herramientas entre ciclos de Compaction.

## Lectura adicional

- [Compaction](/es/concepts/compaction) — reducción de contexto basada en resumido
- [Configuración del Gateway](/es/gateway/configuration) — todos los controles de configuración de la poda
  (`contextPruning.*`)

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Motor de contexto](/es/concepts/context-engine)
