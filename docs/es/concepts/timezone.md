---
read_when:
    - Quieres un modelo mental rápido para gestionar las zonas horarias
    - Estás decidiendo dónde configurar o sobrescribir una zona horaria
summary: 'Dónde aparecen las zonas horarias en OpenClaw: envoltorios, cargas útiles de herramientas y prompt del sistema'
title: Zonas horarias
x-i18n:
    generated_at: "2026-07-11T23:04:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw estandariza las marcas de tiempo para que el modelo vea una **única hora de referencia** en lugar de una combinación de relojes locales de los proveedores. Tres superficies muestran zonas horarias, cada una con su propio propósito:

## Tres superficies de zona horaria

| Superficie            | Qué muestra                                                                                                                        | Valor predeterminado                                    | Configuración mediante                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| Envoltorios de mensaje | Envuelven los mensajes entrantes de los canales: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                | Zona local del host                                     | `agents.defaults.envelopeTimezone`                       |
| Cargas útiles de herramientas | Las herramientas de canal del tipo `readMessages` devuelven la hora sin procesar del proveedor, además de `timestampMs` / `timestampUtc` normalizados | Los campos UTC siempre están presentes                  | No es configurable; conserva las marcas de tiempo nativas del proveedor |
| Prompt del sistema     | Un pequeño bloque `Current Date & Time` que incluye **solo la zona horaria** (sin valor de reloj, para mantener estable la caché)   | Zona horaria del host si `userTimezone` no está definido | `agents.defaults.userTimezone`                           |

El prompt del sistema omite deliberadamente la hora actual para mantener estable la caché del prompt entre turnos. Cuando el agente necesita la hora actual, llama a `session_status`.

## Configuración de la zona horaria del usuario

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Si `userTimezone` no está definido, OpenClaw resuelve la zona horaria del host en tiempo de ejecución mediante `Intl.DateTimeFormat().resolvedOptions().timeZone` (sin escribir en la configuración). `agents.defaults.timeFormat` (`auto` | `12` | `24`) controla la representación en formato de 12 o 24 horas en los envoltorios y las superficies posteriores, pero no en la sección del prompt del sistema.

## Valores de zona horaria del envoltorio

`agents.defaults.envelopeTimezone` acepta:

- `"local"` (valor predeterminado) o `"host"`: la zona horaria de la máquina host.
- `"utc"` o `"gmt"`: UTC.
- `"user"`: el valor resuelto de `agents.defaults.userTimezone` (si no está definido, usa la zona horaria del host).
- Cualquier cadena explícita de zona IANA, por ejemplo, `"Europe/Vienna"`.

## Cuándo sobrescribirla

- **Use `"utc"`** para obtener marcas de tiempo estables entre hosts de distintas regiones o para que coincidan con la salida de diagnósticos o registros ajustada a UTC.
- **Use `"user"`** para mantener los envoltorios ajustados a la zona horaria configurada del usuario, independientemente de la zona en la que se ejecute el host del Gateway.
- **Use una zona IANA fija** cuando el host del Gateway esté en una zona, pero el envoltorio deba mostrarse siempre en otra, independientemente de la migración del host.
- **Establezca `envelopeTimestamp: "off"`** cuando el contexto de la marca de tiempo no sea útil para la conversación. Esto elimina las marcas de tiempo absolutas de los envoltorios, los prefijos directos del prompt del agente y los prefijos integrados de entrada del modelo.

Para consultar la referencia completa del comportamiento, ejemplos de cada proveedor y el formato del tiempo transcurrido, consulte [Fecha y hora](/es/date-time).

## Temas relacionados

- [Fecha y hora](/es/date-time): comportamiento completo de los envoltorios, las herramientas y los prompts, con ejemplos.
- [Heartbeat](/es/gateway/heartbeat): las horas activas usan la zona horaria para la programación.
- [Trabajos de Cron](/es/automation/cron-jobs): las expresiones cron usan la zona horaria para la programación.
