---
read_when:
    - Quieres un modelo mental rápido para el manejo de zonas horarias
    - Estás decidiendo dónde establecer o sobrescribir una zona horaria
summary: 'Dónde aparecen las zonas horarias en OpenClaw: sobres, cargas útiles de herramientas, prompt del sistema'
title: Zonas horarias
x-i18n:
    generated_at: "2026-07-05T11:16:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw estandariza las marcas de tiempo para que el modelo vea una **única hora de referencia** en lugar de una mezcla de relojes locales de proveedores. Tres superficies muestran zonas horarias, cada una con su propio propósito:

## Tres superficies de zona horaria

| Superficie          | Qué muestra                                                                                                      | Predeterminado                                  | Configurado mediante                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Sobres de mensajes  | Envuelve mensajes entrantes de canales: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                       | Local del host                                  | `agents.defaults.envelopeTimezone`                     |
| Cargas de herramientas | Las herramientas de estilo `readMessages` de canal devuelven la hora sin procesar del proveedor más `timestampMs` / `timestampUtc` normalizados | Campos UTC siempre presentes                    | No configurable; conserva las marcas de tiempo nativas del proveedor |
| Prompt del sistema  | Un pequeño bloque `Current Date & Time` con **solo la zona horaria** (sin valor de reloj, para estabilidad de caché) | Zona horaria del host si `userTimezone` no está configurado | `agents.defaults.userTimezone`                         |

El prompt del sistema omite deliberadamente el reloj en vivo para mantener estable el almacenamiento en caché del prompt entre turnos. Cuando el agente necesita la hora actual, llama a `session_status`.

## Configurar la zona horaria del usuario

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Si `userTimezone` no está configurado, OpenClaw resuelve la zona horaria del host en tiempo de ejecución mediante `Intl.DateTimeFormat().resolvedOptions().timeZone` (sin escribir configuración). `agents.defaults.timeFormat` (`auto` | `12` | `24`) controla la representación en formato de 12 h/24 h en los sobres y las superficies posteriores, no en la sección del prompt del sistema.

## Valores de zona horaria del sobre

`agents.defaults.envelopeTimezone` acepta:

- `"local"` (predeterminado) o `"host"` - zona horaria de la máquina host.
- `"utc"` o `"gmt"` - UTC.
- `"user"` - el `agents.defaults.userTimezone` resuelto (recurre a la zona horaria del host si no está configurado).
- Cualquier cadena explícita de zona IANA, por ejemplo, `"Europe/Vienna"`.

## Cuándo sobrescribir

- **Usa `"utc"`** para marcas de tiempo estables entre hosts en distintas regiones, o para coincidir con diagnósticos/salida de registros alineados con UTC.
- **Usa `"user"`** para mantener los sobres alineados con la zona horaria configurada del usuario independientemente de la zona en la que se ejecute el host del Gateway.
- **Usa una zona IANA fija** cuando el host del Gateway esté en una zona pero el sobre deba leerse siempre en otra zona independientemente de la migración del host.
- **Establece `envelopeTimestamp: "off"`** cuando el contexto de marca de tiempo no sea útil para la conversación. Esto elimina las marcas de tiempo absolutas de los sobres, los prefijos directos del prompt del agente y los prefijos incrustados de entrada del modelo.

Para ver la referencia completa del comportamiento, ejemplos por proveedor y formato de tiempo transcurrido, consulta [Fecha y hora](/es/date-time).

## Relacionado

- [Fecha y hora](/es/date-time) - comportamiento completo de sobres/herramientas/prompt y ejemplos.
- [Heartbeat](/es/gateway/heartbeat) - las horas activas usan la zona horaria para la programación.
- [Trabajos Cron](/es/automation/cron-jobs) - las expresiones Cron usan la zona horaria para la programación.
