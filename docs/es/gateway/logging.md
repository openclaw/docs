---
read_when:
    - Cambiar la salida o los formatos de registro
    - Depurar la salida de la CLI o del Gateway
summary: Superficies de registro, registros de archivos, estilos de registro WS y formato de consola
title: Registro de Gateway
x-i18n:
    generated_at: "2026-04-24T05:29:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# Registro

Para una visión general orientada al usuario (CLI + UI de Control + configuración), consulta [/logging](/es/logging).

OpenClaw tiene dos “superficies” de registro:

- **Salida de consola** (lo que ves en la terminal / UI de depuración).
- **Registros de archivos** (líneas JSON) escritos por el registrador de Gateway.

## Registrador basado en archivos

- El archivo de registro rotativo predeterminado está en `/tmp/openclaw/` (un archivo por día): `openclaw-YYYY-MM-DD.log`
  - La fecha usa la zona horaria local del host de Gateway.
- La ruta y el nivel del archivo de registro se pueden configurar mediante `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

El formato del archivo es un objeto JSON por línea.

La pestaña Logs de la UI de Control sigue este archivo a través de Gateway (`logs.tail`).
La CLI puede hacer lo mismo:

```bash
openclaw logs --follow
```

**Verboso frente a niveles de registro**

- Los **registros de archivo** se controlan exclusivamente con `logging.level`.
- `--verbose` solo afecta la **verbosidad de consola** (y el estilo de registro WS); **no**
  aumenta el nivel de registro del archivo.
- Para capturar en los registros de archivo detalles solo verbosos, establece `logging.level` en `debug` o
  `trace`.

## Captura de consola

La CLI captura `console.log/info/warn/error/debug/trace` y los escribe en los registros de archivo,
mientras sigue imprimiéndolos en stdout/stderr.

Puedes ajustar la verbosidad de la consola de forma independiente mediante:

- `logging.consoleLevel` (predeterminado `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redacción del resumen de herramientas

Los resúmenes detallados de herramientas (por ejemplo `🛠️ Exec: ...`) pueden ocultar tokens sensibles antes de que lleguen al
flujo de consola. Esto es **solo para herramientas** y no modifica los registros de archivo.

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: arreglo de cadenas regex (anula los valores predeterminados)
  - Usa cadenas regex sin procesar (auto `gi`), o `/pattern/flags` si necesitas banderas personalizadas.
  - Las coincidencias se ocultan conservando los primeros 6 + últimos 4 caracteres (longitud >= 18), de lo contrario `***`.
  - Los valores predeterminados cubren asignaciones comunes de claves, flags de CLI, campos JSON, encabezados bearer, bloques PEM y prefijos de tokens populares.

## Registros WebSocket de Gateway

Gateway imprime registros del protocolo WebSocket en dos modos:

- **Modo normal (sin `--verbose`)**: solo se imprimen resultados RPC “interesantes”:
  - errores (`ok=false`)
  - llamadas lentas (umbral predeterminado: `>= 50ms`)
  - errores de análisis
- **Modo verboso (`--verbose`)**: imprime todo el tráfico de solicitud/respuesta WS.

### Estilo de registro WS

`openclaw gateway` admite un selector de estilo por Gateway:

- `--ws-log auto` (predeterminado): el modo normal está optimizado; el modo verboso usa salida compacta
- `--ws-log compact`: salida compacta (solicitud/respuesta emparejada) cuando es verboso
- `--ws-log full`: salida completa por frame cuando es verboso
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

El formateador de consola **detecta TTY** e imprime líneas coherentes con prefijo.
Los registradores de subsistemas mantienen la salida agrupada y fácil de examinar.

Comportamiento:

- **Prefijos de subsistema** en cada línea (por ejemplo `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colores de subsistema** (estables por subsistema) más coloración por nivel
- **Color cuando la salida es un TTY o el entorno parece una terminal enriquecida** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respetando `NO_COLOR`
- **Prefijos de subsistema abreviados**: elimina el prefijo `gateway/` + `channels/`, conserva los últimos 2 segmentos (por ejemplo `whatsapp/outbound`)
- **Sub-registradores por subsistema** (prefijo automático + campo estructurado `{ subsystem }`)
- **`logRaw()`** para salida QR/UX (sin prefijo, sin formato)
- **Estilos de consola** (por ejemplo `pretty | compact | json`)
- **Nivel de registro de consola** separado del nivel de registro de archivo (el archivo conserva todo el detalle cuando `logging.level` está en `debug`/`trace`)
- Los **cuerpos de mensajes de WhatsApp** se registran en `debug` (usa `--verbose` para verlos)

Esto mantiene estables los registros de archivo existentes a la vez que hace que la salida interactiva sea fácil de examinar.

## Relacionado

- [Resumen de registro](/es/logging)
- [Exportación de diagnóstico](/es/gateway/diagnostics)
