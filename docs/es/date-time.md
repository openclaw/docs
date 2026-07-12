---
read_when:
    - Estás cambiando la forma en que se muestran las marcas de tiempo al modelo o a los usuarios
    - Estás depurando el formato de la hora en los mensajes o en la salida del prompt del sistema
summary: Gestión de fecha y hora en envoltorios, prompts, herramientas y conectores
title: Fecha y hora
x-i18n:
    generated_at: "2026-07-11T23:02:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw usa **la hora local del host para las marcas de tiempo del transporte** e incluye **solo la zona horaria** en el prompt del sistema.
Las marcas de tiempo del proveedor se conservan para que las herramientas mantengan su semántica nativa. Cuando el agente necesita la hora
actual, ejecuta la herramienta `session_status`.

## Envoltorios de mensajes (local de forma predeterminada)

Los mensajes entrantes se encapsulan con el día de la semana y una marca de tiempo con precisión de segundos:

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] message text
```

La marca de tiempo del envoltorio usa **la hora local del host de forma predeterminada**, independientemente de la zona horaria del proveedor.
Se puede anular en `agents.defaults`:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | zona horaria IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

| Clave               | Valores                                              | Comportamiento                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local` (predeterminado), `utc`, `user`, nombre IANA explícito | `user` usa `agents.defaults.userTimezone` (la zona horaria del host si no está configurada). Un nombre IANA explícito (p. ej., `"America/Chicago"`) fija una zona; los nombres no reconocidos usan UTC como alternativa. |
| `envelopeTimestamp` | `on` (predeterminado), `off`                         | `off` elimina las marcas de tiempo absolutas de los encabezados de los envoltorios, los prefijos directos del prompt del agente y los prefijos incrustados en la entrada del modelo.                            |
| `envelopeElapsed`   | `on` (predeterminado), `off`                         | `off` elimina el sufijo de tiempo transcurrido (con el formato `+30s` / `+2m`) que se muestra desde el mensaje anterior de la sesión.                                                                          |

### Ejemplos

**Local (predeterminado):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Zona horaria del usuario:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Tiempo transcurrido con `envelopeTimezone: "utc"`:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Prompt del sistema: fecha y hora actuales

El prompt del sistema incluye una sección de **fecha y hora actuales** con **solo la zona horaria**
(sin reloj ni formato de hora) para que el almacenamiento en caché del prompt permanezca estable:

```
Time zone: America/Chicago
```

La zona es `agents.defaults.userTimezone` cuando está configurada; de lo contrario, es la zona horaria del host.
El prompt también indica al agente que ejecute la herramienta `session_status` siempre que necesite la
fecha, la hora o el día de la semana actuales.

## Líneas de eventos del sistema (locales de forma predeterminada)

Los eventos del sistema en cola que se insertan en el contexto del agente llevan como prefijo una marca de tiempo que usa la
misma selección de `envelopeTimezone` que los envoltorios de mensajes (valor predeterminado: hora local del host).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Configurar la zona horaria del usuario y el formato

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` establece la **zona horaria local del usuario** para el contexto del prompt (y para `envelopeTimezone: "user"`).
- `timeFormat` controla la **visualización en formato de 12 o 24 horas** en las horas que aparecen en el prompt. `auto` sigue las preferencias del sistema operativo.

## Detección del formato de hora (automática)

Cuando `timeFormat: "auto"`, OpenClaw consulta la preferencia del sistema operativo (macOS y Windows)
y, como alternativa, usa el formato de la configuración regional. El valor detectado se **almacena en caché por proceso**
para evitar llamadas repetidas al sistema.

## Cargas útiles de herramientas y conectores (hora sin procesar del proveedor y campos normalizados)

Las herramientas de los canales devuelven **marcas de tiempo nativas del proveedor** y añaden campos normalizados para mantener la coherencia:

- `timestampMs`: milisegundos desde la época (UTC)
- `timestampUtc`: cadena UTC en formato ISO 8601

Los campos sin procesar del proveedor se conservan para evitar la pérdida de información.

- Discord: marcas de tiempo ISO en UTC
- Slack: cadenas similares al tiempo desde la época provenientes de la API
- Telegram/WhatsApp: marcas de tiempo numéricas o ISO específicas del proveedor

Si necesitas la hora local, conviértela posteriormente mediante la zona horaria conocida.

## Documentación relacionada

- [Prompt del sistema](/es/concepts/system-prompt)
- [Zonas horarias](/es/concepts/timezone)
- [Mensajes](/es/concepts/messages)
