---
read_when:
    - Quieres reducir el crecimiento del contexto provocado por las salidas de herramientas
    - Quieres entender la optimización de la caché de prompts de Anthropic
summary: Recortar resultados antiguos de herramientas para mantener el contexto ligero y el almacenamiento en caché eficiente
title: Poda de sesiones
x-i18n:
    generated_at: "2026-07-05T11:15:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

La depuración de sesiones recorta **resultados antiguos de herramientas** del contexto antes de cada llamada al LLM. Reduce la sobrecarga del contexto causada por salidas acumuladas de herramientas (resultados de ejecución, lecturas de archivos, resultados de búsqueda) sin reescribir el texto normal de la conversación.

<Info>
La depuración solo ocurre en memoria: no modifica la transcripción de sesión en disco. Tu historial completo siempre se conserva.
</Info>

## Por qué importa

Las sesiones largas acumulan salida de herramientas que infla la ventana de contexto. Esto aumenta el costo y puede forzar [Compaction](/es/concepts/compaction) antes de lo necesario.

La depuración es especialmente valiosa para el **almacenamiento en caché de prompts de Anthropic**. Después de que vence el TTL de la caché, la siguiente solicitud vuelve a almacenar en caché el prompt completo. La depuración reduce el tamaño de escritura en caché, lo que reduce directamente el costo.

## Cómo funciona

La depuración se ejecuta en modo `cache-ttl`, condicionada tanto por una comprobación de tiempo como por una comprobación de tamaño de contexto:

1. Espera a que venza el TTL de la caché (5 minutos de forma predeterminada cuando se define manualmente; consulta [Valores predeterminados inteligentes](#smart-defaults) para el valor automático predeterminado de Anthropic). Antes de que transcurra el TTL, la depuración se omite por completo para preservar la reutilización de la caché de prompts en turnos cercanos.
2. Una vez transcurrido el TTL, estima el tamaño total del contexto frente a la ventana de contexto del modelo. Si la proporción está por debajo de `softTrimRatio` (predeterminado 0.3), omite la depuración y mantiene el reloj del TTL en marcha.
3. **Recorta suavemente** los resultados de herramientas sobredimensionados por encima de la proporción: conserva el inicio y el final (1500 caracteres cada uno de forma predeterminada, con un límite de 4000 caracteres combinados), e inserta `...` en medio.
4. Si la proporción sigue en `hardClearRatio` o por encima (predeterminado 0.5) y quedan al menos `minPrunableToolChars` (predeterminado 50,000) de contenido de herramientas depurable, **borra por completo** esos resultados: reemplaza su contenido por un marcador de posición (predeterminado `[Old tool result content cleared]`).
5. Restablece el reloj del TTL solo cuando la depuración realmente cambió el contexto, para que las solicitudes posteriores reutilicen la caché nueva.

Se aplican dos reglas de seguridad independientemente de los umbrales: los turnos de asistente más recientes `keepLastAssistants` (predeterminado 3) nunca se depuran, y nunca se depura nada anterior al primer mensaje de usuario de la sesión (protege lecturas de arranque como `SOUL.md`/`USER.md`).

Solo los mensajes `toolResult` son elegibles; el texto normal de la conversación se deja intacto. Usa `agents.defaults.contextPruning.tools.{allow,deny}` para delimitar qué nombres de herramientas son depurables.

## Limpieza de imágenes heredadas

OpenClaw también construye una vista de reproducción idempotente separada para sesiones que conservan bloques de imágenes sin procesar o marcadores multimedia de hidratación de prompts en el historial.

- Conserva los **3 turnos completados más recientes** byte por byte para que los prefijos de caché de prompts de seguimientos recientes permanezcan estables. Este recuento incluye todos los turnos completados, no solo los que contienen imágenes, por lo que los turnos solo de texto también consumen la ventana.
- En la vista de reproducción, los bloques de imágenes antiguos ya procesados del historial de `user` o `toolResult` se reemplazan por `[image data removed - already processed by model]`.
- Las referencias multimedia textuales antiguas, como `[media attached: ...]`, `[Image: source: ...]` y `media://inbound/...`, se reemplazan por `[media reference removed - already processed by model]`. Los marcadores de adjuntos del turno actual permanecen intactos para que los modelos de visión todavía puedan hidratar imágenes nuevas.
- La transcripción de sesión sin procesar no se reescribe, por lo que los visores de historial todavía pueden renderizar las entradas de mensajes originales y sus imágenes.
- Esto es independiente de la depuración normal por TTL de caché descrita arriba. Existe para evitar que las cargas de imágenes repetidas o las referencias multimedia obsoletas invaliden las cachés de prompts en turnos posteriores.

## Valores predeterminados inteligentes

El plugin Anthropic incluido configura automáticamente la depuración y la cadencia de Heartbeat la primera vez que resuelve un perfil de autenticación de Anthropic (o Claude CLI), pero solo para campos que no hayas definido ya explícitamente:

| Modo de autenticación                         | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| --------------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/token (incluida reutilización de Claude CLI) | `cache-ttl`           | `1h`                 | `1h`              |
| Clave de API                                  | `cache-ttl`           | `1h`                 | `30m`             |

Si defines `agents.defaults.contextPruning.mode` o `agents.defaults.heartbeat.every` por tu cuenta, OpenClaw no los sobrescribe. Este valor automático predeterminado solo se activa para autenticación de la familia Anthropic; otros proveedores tienen la depuración en `off` salvo que la configures.

## Activar o desactivar

La depuración está desactivada de forma predeterminada para proveedores que no son Anthropic. Para activarla:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Para desactivarla: define `mode: "off"`.

## Depuración frente a Compaction

|            | Depuración                    | Compaction                    |
| ---------- | ----------------------------- | ----------------------------- |
| **Qué**    | Recorta resultados de herramientas | Resume la conversación        |
| **¿Guardado?** | No (por solicitud)           | Sí (en la transcripción)      |
| **Alcance** | Solo resultados de herramientas | Toda la conversación          |

Se complementan: la depuración mantiene ligera la salida de herramientas entre ciclos de Compaction.

## Lecturas adicionales

- [Compaction](/es/concepts/compaction): reducción de contexto basada en resumir
- [Configuración de Gateway](/es/gateway/configuration): todos los controles de configuración de depuración (`contextPruning.*`)

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Motor de contexto](/es/concepts/context-engine)
