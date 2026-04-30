---
read_when:
    - Cambiar la salida o los formatos de registro
    - Depuración de la salida de la CLI o del Gateway
summary: Superficies de registro, registros de archivo, estilos de registro de WS y formato de consola
title: Registro de Gateway
x-i18n:
    generated_at: "2026-04-30T05:42:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 16
---

# Registro

Para una descripción general orientada al usuario (CLI + UI de Control + configuración), consulta [/logging](/es/logging).

OpenClaw tiene dos “superficies” de registro:

- **Salida de consola** (lo que ves en la terminal / UI de Depuración).
- **Registros de archivo** (líneas JSON) escritos por el registrador del Gateway.

## Registrador basado en archivos

- El archivo de registro rotativo predeterminado está en `/tmp/openclaw/` (un archivo por día): `openclaw-YYYY-MM-DD.log`
  - La fecha usa la zona horaria local del host del Gateway.
- Los archivos de registro activos rotan en `logging.maxFileBytes` (predeterminado: 100 MB), conservando
  hasta cinco archivos numerados y continuando la escritura en un archivo activo nuevo.
- La ruta y el nivel del archivo de registro pueden configurarse mediante `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

El formato de archivo es un objeto JSON por línea.

La pestaña Registros de la UI de Control sigue este archivo mediante el Gateway (`logs.tail`).
La CLI puede hacer lo mismo:

```bash
openclaw logs --follow
```

**Verboso frente a niveles de registro**

- **Los registros de archivo** se controlan exclusivamente mediante `logging.level`.
- `--verbose` solo afecta la **verbosidad de la consola** (y el estilo de registro de WS); **no**
  eleva el nivel de registro del archivo.
- Para capturar detalles disponibles solo en modo verboso en registros de archivo, establece `logging.level` en `debug` o
  `trace`.

## Captura de consola

La CLI captura `console.log/info/warn/error/debug/trace` y los escribe en registros de archivo,
sin dejar de imprimir en stdout/stderr.

Puedes ajustar la verbosidad de consola de forma independiente mediante:

- `logging.consoleLevel` (predeterminado `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redacción

OpenClaw puede enmascarar tokens sensibles antes de que la salida de registro o transcripción salga del
proceso. Esta política de redacción de registros se aplica en la consola, registros de archivo, registros
OTLP y sumideros de texto de transcripción de sesión, de modo que los valores secretos coincidentes se
enmascaran antes de escribir líneas JSONL o mensajes en disco.

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: arreglo de cadenas regex (sustituye los valores predeterminados)
  - Usa cadenas regex sin procesar (auto `gi`), o `/pattern/flags` si necesitas indicadores personalizados.
  - Las coincidencias se enmascaran conservando los primeros 6 + últimos 4 caracteres (longitud >= 18); de lo contrario, `***`.
  - Los valores predeterminados cubren asignaciones de claves comunes, flags de CLI, campos JSON, encabezados bearer, bloques PEM y prefijos de tokens populares.

Algunos límites de seguridad siempre redactan, independientemente de `logging.redactSensitive`.
Eso incluye eventos de llamadas de herramientas de la UI de Control, salida de herramienta
`sessions_history`, exportaciones de soporte de diagnóstico, observaciones de errores de proveedores,
visualización de comandos de aprobación de exec y registros del protocolo WebSocket del Gateway. Estas superficies pueden seguir usando
`logging.redactPatterns` como patrones adicionales, pero `redactSensitive: "off"`
no hace que emitan secretos sin procesar.

## Registros WebSocket del Gateway

El Gateway imprime registros del protocolo WebSocket en dos modos:

- **Modo normal (sin `--verbose`)**: solo se imprimen resultados RPC “interesantes”:
  - errores (`ok=false`)
  - llamadas lentas (umbral predeterminado: `>= 50ms`)
  - errores de análisis
- **Modo verboso (`--verbose`)**: imprime todo el tráfico de solicitudes/respuestas WS.

### Estilo de registro WS

`openclaw gateway` admite un conmutador de estilo por Gateway:

- `--ws-log auto` (predeterminado): el modo normal está optimizado; el modo verboso usa salida compacta
- `--ws-log compact`: salida compacta (solicitud/respuesta emparejadas) cuando está en modo verboso
- `--ws-log full`: salida completa por trama cuando está en modo verboso
- `--compact`: alias de `--ws-log compact`

Ejemplos:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Formato de consola (registro de subsistemas)

El formateador de consola es **compatible con TTY** e imprime líneas coherentes con prefijo.
Los registradores de subsistemas mantienen la salida agrupada y fácil de escanear.

Comportamiento:

- **Prefijos de subsistema** en cada línea (p. ej., `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colores de subsistema** (estables por subsistema) más coloración por nivel
- **Color cuando la salida es una TTY o el entorno parece una terminal enriquecida** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeta `NO_COLOR`
- **Prefijos de subsistema acortados**: elimina `gateway/` + `channels/` iniciales, conserva los últimos 2 segmentos (p. ej., `whatsapp/outbound`)
- **Subregistradores por subsistema** (prefijo automático + campo estructurado `{ subsystem }`)
- **`logRaw()`** para salida QR/UX (sin prefijo, sin formato)
- **Estilos de consola** (p. ej., `pretty | compact | json`)
- **Nivel de registro de consola** separado del nivel de registro de archivo (el archivo conserva todo el detalle cuando `logging.level` se establece en `debug`/`trace`)
- **Los cuerpos de mensajes de WhatsApp** se registran en `debug` (usa `--verbose` para verlos)

Esto mantiene estables los registros de archivo existentes mientras hace que la salida interactiva sea fácil de escanear.

## Relacionado

- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
