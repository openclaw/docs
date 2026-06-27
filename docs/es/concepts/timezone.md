---
read_when:
    - Quieres un modelo mental rápido para manejar zonas horarias
    - Estás decidiendo dónde establecer o anular una zona horaria
summary: 'Dónde aparecen las zonas horarias en OpenClaw: sobres, cargas útiles de herramientas, prompt del sistema'
title: Zonas horarias
x-i18n:
    generated_at: "2026-06-27T11:20:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw estandariza las marcas de tiempo para que el modelo vea una **única hora de referencia** en lugar de una mezcla de relojes locales de proveedores. Hay tres superficies donde aparecen las zonas horarias, cada una con su propio propósito:

## Tres superficies de zona horaria

| Superficie        | Lo que muestra                                                                                           | Predeterminado                        | Configurado mediante                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| Sobres de mensajes | Envuelve los mensajes entrantes del canal: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`            | Local del host                        | `agents.defaults.envelopeTimezone`                     |
| Cargas de herramientas | Las herramientas de canal estilo `readMessages` devuelven la hora sin procesar del proveedor + `timestampMs` / `timestampUtc` normalizados | Campos UTC siempre presentes          | No configurable — conserva las marcas de tiempo nativas del proveedor |
| Prompt del sistema | Un pequeño bloque `Current Date & Time` con **solo la zona horaria** (sin valor de reloj, para estabilidad de caché) | Zona horaria del host si `userTimezone` no está definido | `agents.defaults.userTimezone`                         |

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

Si `userTimezone` no está definido, OpenClaw resuelve la zona horaria del host en tiempo de ejecución (sin escribir configuración). `agents.defaults.timeFormat` (`auto` | `12` | `24`) controla la representación de 12 h/24 h en los sobres y superficies posteriores, no en la sección del prompt del sistema.

## Cuándo sobrescribir

- **Usa sobres UTC** (`envelopeTimezone: "utc"`) cuando quieras marcas de tiempo estables entre hosts en distintas regiones, o cuando quieras que los registros alineados con UTC coincidan con la salida de diagnóstico.
- **Usa una zona IANA fija** (por ejemplo, `"Europe/Vienna"`) cuando el host del Gateway esté en una zona, pero el usuario esté en otra, y quieras que los sobres se lean en la zona del usuario sin importar la migración del host.
- **Define `envelopeTimestamp: "off"`** cuando el contexto de marca de tiempo no sea útil para la conversación. Esto elimina las marcas de tiempo absolutas de los sobres, los prefijos directos del prompt del agente y los prefijos incrustados de entrada del modelo.

Para ver la referencia completa del comportamiento, ejemplos por proveedor y formato de tiempo transcurrido, consulta [Fecha y hora](/es/date-time).

## Relacionado

- [Fecha y hora](/es/date-time) — comportamiento completo de sobres/herramientas/prompt y ejemplos.
- [Heartbeat](/es/gateway/heartbeat) — las horas activas usan la zona horaria para la programación.
- [Trabajos Cron](/es/automation/cron-jobs) — las expresiones Cron usan la zona horaria para la programación.
