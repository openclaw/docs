---
read_when:
    - Estás cambiando cómo se muestran las marcas de tiempo al modelo o a los usuarios
    - Estás depurando el formato de hora en mensajes o en la salida de la indicación del sistema
summary: Gestión de fechas y horas en sobres, indicaciones, herramientas y conectores
title: Fecha y hora
x-i18n:
    generated_at: "2026-05-06T05:33:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw usa de forma predeterminada **la hora local del host para las marcas de tiempo de transporte** y **la zona horaria del usuario solo en el prompt del sistema**.
Las marcas de tiempo del proveedor se conservan para que las herramientas mantengan su semántica nativa (la hora actual está disponible mediante `session_status`).

## Envoltorios de mensajes (local de forma predeterminada)

Los mensajes entrantes se envuelven con una marca de tiempo (precisión de minutos):

```
[Provider ... 2026-01-05 16:26 PST] message text
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
- `envelopeTimestamp: "off"` elimina las marcas de tiempo absolutas de los encabezados del envoltorio.
- `envelopeElapsed: "off"` elimina los sufijos de tiempo transcurrido (el estilo `+2m`).

### Ejemplos

**Local (predeterminado):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Zona horaria del usuario:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Tiempo transcurrido habilitado:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Prompt del sistema: fecha y hora actuales

Si se conoce la zona horaria del usuario, el prompt del sistema incluye una sección dedicada
**Fecha y hora actuales** con **solo la zona horaria** (sin formato de reloj/hora)
para mantener estable el almacenamiento en caché del prompt:

```
Time zone: America/Chicago
```

Cuando el agente necesite la hora actual, usa la herramienta `session_status`; la tarjeta
de estado incluye una línea de marca de tiempo.

## Líneas de eventos del sistema (locales de forma predeterminada)

Los eventos del sistema en cola insertados en el contexto del agente llevan como prefijo una marca de tiempo que usa la
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
- `timeFormat` controla la **visualización de 12 h/24 h** en el prompt. `auto` sigue las preferencias del sistema operativo.

## Detección del formato de hora (auto)

Cuando `timeFormat: "auto"`, OpenClaw inspecciona la preferencia del sistema operativo (macOS/Windows)
y recurre al formato regional. El valor detectado se **almacena en caché por proceso**
para evitar llamadas repetidas al sistema.

## Cargas útiles de herramientas + conectores (hora del proveedor sin procesar + campos normalizados)

Las herramientas de canal devuelven **marcas de tiempo nativas del proveedor** y agregan campos normalizados para mantener la coherencia:

- `timestampMs`: milisegundos desde la época (UTC)
- `timestampUtc`: cadena ISO 8601 UTC

Los campos sin procesar del proveedor se conservan para que no se pierda nada.

- Slack: cadenas similares a época provenientes de la API
- Discord: marcas de tiempo ISO UTC
- Telegram/WhatsApp: marcas de tiempo numéricas/ISO específicas del proveedor

Si necesitas la hora local, conviértela más adelante usando la zona horaria conocida.

## Documentos relacionados

- [Prompt del sistema](/es/concepts/system-prompt)
- [Zonas horarias](/es/concepts/timezone)
- [Mensajes](/es/concepts/messages)
