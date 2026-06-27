---
read_when:
    - Estás cambiando cómo se muestran las marcas de tiempo al modelo o a los usuarios
    - Estás depurando el formato de hora en los mensajes o en la salida del prompt del sistema
summary: Gestión de fecha y hora en envolturas, prompts, herramientas y conectores
title: Fecha y hora
x-i18n:
    generated_at: "2026-06-27T11:22:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw usa de forma predeterminada la **hora local del host para las marcas de tiempo de transporte** y la **zona horaria del usuario solo en el prompt del sistema**.
Las marcas de tiempo del proveedor se conservan para que las herramientas mantengan su semántica nativa (la hora actual está disponible mediante `session_status`).

## Envoltorios de mensajes (local de forma predeterminada)

Los mensajes entrantes se envuelven con una marca de tiempo (precisión de segundos):

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

Esta marca de tiempo del envoltorio es **local del host de forma predeterminada**, independientemente de la zona horaria del proveedor.

Puedes anular este comportamiento:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` usa UTC.
- `envelopeTimezone: "local"` usa la zona horaria del host.
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (recurre a la zona horaria del host).
- Usa una zona horaria IANA explícita (por ejemplo, `"America/Chicago"`) para una zona fija.
- `envelopeTimestamp: "off"` elimina las marcas de tiempo absolutas de los encabezados de envoltorio, los prefijos directos del prompt del agente y los prefijos incrustados de entrada del modelo.
- `envelopeElapsed: "off"` elimina los sufijos de tiempo transcurrido (el estilo `+2m`).

### Ejemplos

**Local (predeterminado):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Zona horaria del usuario:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Tiempo transcurrido activado:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Prompt del sistema: fecha y hora actuales

Si se conoce la zona horaria del usuario, el prompt del sistema incluye una sección dedicada
**Fecha y hora actuales** con la **zona horaria solamente** (sin formato de reloj/hora)
para mantener estable el almacenamiento en caché del prompt:

```
Time zone: America/Chicago
```

Cuando el agente necesite la hora actual, usa la herramienta `session_status`; la tarjeta de estado
incluye una línea de marca de tiempo.

## Líneas de eventos del sistema (local de forma predeterminada)

Los eventos del sistema en cola insertados en el contexto del agente se prefijan con una marca de tiempo usando la
misma selección de zona horaria que los envoltorios de mensajes (predeterminado: local del host).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Configurar zona horaria del usuario + formato

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

- `userTimezone` establece la **zona horaria local del usuario** para el contexto del prompt.
- `timeFormat` controla la **visualización de 12 h/24 h** en el prompt. `auto` sigue las preferencias del SO.

## Detección del formato de hora (auto)

Cuando `timeFormat: "auto"`, OpenClaw inspecciona la preferencia del SO (macOS/Windows)
y recurre al formato regional. El valor detectado se **almacena en caché por proceso**
para evitar llamadas repetidas al sistema.

## Cargas útiles de herramientas + conectores (hora sin procesar del proveedor + campos normalizados)

Las herramientas de canal devuelven **marcas de tiempo nativas del proveedor** y agregan campos normalizados para mantener la coherencia:

- `timestampMs`: milisegundos desde epoch (UTC)
- `timestampUtc`: cadena ISO 8601 UTC

Los campos sin procesar del proveedor se conservan para que no se pierda nada.

- Slack: cadenas similares a epoch de la API
- Discord: marcas de tiempo ISO UTC
- Telegram/WhatsApp: marcas de tiempo numéricas/ISO específicas del proveedor

Si necesitas la hora local, conviértela aguas abajo usando la zona horaria conocida.

## Documentación relacionada

- [Prompt del sistema](/es/concepts/system-prompt)
- [Zonas horarias](/es/concepts/timezone)
- [Mensajes](/es/concepts/messages)
