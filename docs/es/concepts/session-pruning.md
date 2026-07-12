---
read_when:
    - Quieres reducir el crecimiento del contexto causado por las salidas de las herramientas
    - Quieres comprender la optimización de la caché de prompts de Anthropic
summary: Recorte de resultados antiguos de herramientas para mantener el contexto ligero y un almacenamiento en caché eficiente
title: Poda de sesiones
x-i18n:
    generated_at: "2026-07-11T23:04:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

La poda de sesiones recorta los **resultados antiguos de herramientas** del contexto antes de cada llamada al LLM. Reduce el aumento excesivo del contexto causado por la acumulación de resultados de herramientas (resultados de ejecución, lecturas de archivos y resultados de búsqueda) sin reescribir el texto normal de la conversación.

<Info>
La poda solo se realiza en memoria; no modifica la transcripción de la sesión almacenada en disco. El historial completo se conserva siempre.
</Info>

## Por qué es importante

Las sesiones largas acumulan resultados de herramientas que amplían la ventana de contexto. Esto aumenta el costo y puede obligar a realizar la [Compaction](/es/concepts/compaction) antes de lo necesario.

La poda resulta especialmente útil para el **almacenamiento en caché de prompts de Anthropic**. Cuando vence el TTL de la caché, la siguiente solicitud vuelve a almacenar en caché el prompt completo. La poda reduce el tamaño de escritura en la caché, lo que disminuye directamente el costo.

## Cómo funciona

La poda se ejecuta en modo `cache-ttl` y está condicionada tanto por una comprobación temporal como por una comprobación del tamaño del contexto:

1. Espera a que venza el TTL de la caché (de forma predeterminada, 5 minutos cuando se configura manualmente; consulta [Valores predeterminados inteligentes](#smart-defaults) para conocer el valor predeterminado automático de Anthropic). Antes de que transcurra el TTL, la poda se omite por completo para conservar la reutilización de la caché de prompts entre turnos próximos.
2. Una vez transcurrido el TTL, estima el tamaño total del contexto respecto a la ventana de contexto del modelo. Si la proporción es inferior a `softTrimRatio` (valor predeterminado: 0,3), omite la poda y mantiene en marcha el reloj del TTL.
3. **Recorta parcialmente** los resultados de herramientas sobredimensionados por encima de la proporción: conserva el principio y el final (de forma predeterminada, 1500 caracteres de cada uno, con un máximo combinado de 4000 caracteres) e inserta `...` entre ambos.
4. Si la proporción sigue siendo igual o superior a `hardClearRatio` (valor predeterminado: 0,5) y quedan al menos `minPrunableToolChars` (valor predeterminado: 50 000) caracteres de contenido de herramientas que se pueda podar, **borra por completo** esos resultados: sustituye su contenido por un marcador de posición (de forma predeterminada, `[Se borró el contenido del resultado antiguo de la herramienta]`).
5. Restablece el reloj del TTL solo cuando la poda haya modificado realmente el contexto, para que las solicitudes posteriores reutilicen la caché recién creada.

Se aplican dos reglas de seguridad independientemente de los umbrales: nunca se podan los turnos más recientes del asistente indicados por `keepLastAssistants` (valor predeterminado: 3), ni nada anterior al primer mensaje del usuario de la sesión (esto protege las lecturas de inicialización, como `SOUL.md`/`USER.md`).

Solo los mensajes `toolResult` pueden podarse; el texto normal de la conversación no se modifica. Usa `agents.defaults.contextPruning.tools.{allow,deny}` para delimitar qué nombres de herramientas se pueden podar.

## Limpieza de imágenes heredadas

OpenClaw también crea una vista de reproducción independiente e idempotente para las sesiones que conservan en el historial bloques de imágenes sin procesar o marcadores multimedia de hidratación del prompt.

- Conserva **los 3 turnos completados más recientes** byte por byte para que los prefijos de la caché de prompts se mantengan estables en los seguimientos recientes. Este recuento incluye todos los turnos completados, no solo los que contienen imágenes, por lo que los turnos de solo texto también ocupan la ventana.
- En la vista de reproducción, los bloques de imágenes más antiguos ya procesados del historial de `user` o `toolResult` se sustituyen por `[datos de imagen eliminados: ya procesados por el modelo]`.
- Las referencias multimedia textuales más antiguas, como `[contenido multimedia adjunto: ...]`, `[Imagen: origen: ...]` y `media://inbound/...`, se sustituyen por `[referencia multimedia eliminada: ya procesada por el modelo]`. Los marcadores de archivos adjuntos del turno actual permanecen intactos para que los modelos de visión todavía puedan hidratar imágenes nuevas.
- La transcripción sin procesar de la sesión no se reescribe, por lo que los visores del historial todavía pueden mostrar las entradas originales de los mensajes y sus imágenes.
- Este proceso es independiente de la poda normal mediante TTL de caché descrita anteriormente. Su propósito es evitar que las cargas de imágenes repetidas o las referencias multimedia obsoletas invaliden las cachés de prompts en turnos posteriores.

## Valores predeterminados inteligentes

El Plugin de Anthropic incluido configura automáticamente la poda y la frecuencia del Heartbeat la primera vez que resuelve un perfil de autenticación de Anthropic (o Claude CLI), pero solo para los campos que no hayas configurado ya explícitamente:

| Modo de autenticación                                | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ---------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/token (incluida la reutilización de Claude CLI) | `cache-ttl`           | `1h`                 | `1h`              |
| Clave de API                                  | `cache-ttl`           | `1h`                 | `30m`             |

Si configuras por tu cuenta `agents.defaults.contextPruning.mode` o `agents.defaults.heartbeat.every`, OpenClaw no los sobrescribe. Este valor predeterminado automático solo se aplica a la autenticación de la familia Anthropic; para otros proveedores, la poda se establece en `off` a menos que la configures.

## Activar o desactivar

La poda está desactivada de forma predeterminada para los proveedores que no son Anthropic. Para activarla:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Para desactivarla: establece `mode: "off"`.

## Poda frente a Compaction

|            | Poda            | Compaction              |
| ---------- | ------------------ | ----------------------- |
| **Qué hace**   | Recorta los resultados de herramientas | Resume la conversación |
| **¿Se guarda?** | No (por solicitud)   | Sí (en la transcripción)     |
| **Alcance**  | Solo resultados de herramientas  | Conversación completa     |

Ambas se complementan: la poda mantiene reducido el volumen de los resultados de herramientas entre los ciclos de Compaction.

## Lecturas adicionales

- [Compaction](/es/concepts/compaction): reducción del contexto basada en resúmenes
- [Configuración del Gateway](/es/gateway/configuration): todas las opciones de configuración de la poda (`contextPruning.*`)

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Motor de contexto](/es/concepts/context-engine)
