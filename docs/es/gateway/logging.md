---
read_when:
    - Cambiar la salida o los formatos de registro
    - Depurar la salida de la CLI o del Gateway
summary: Superficies de registro, registros de archivos, estilos de registro WS y formato de consola
title: Registro del Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c005cfc4cfe456b3734d3928a16c9cd131a2b465d46f2aba9c9c61db22dcc399
    source_path: gateway/logging.md
    workflow: 15
---

# Registro

Para una descripción general orientada al usuario (CLI + Control UI + configuración), consulta [/logging](/es/logging).

OpenClaw tiene dos “superficies” de registro:

- **Salida de consola** (lo que ves en la terminal / Debug UI).
- **Registros de archivos** (líneas JSON) escritos por el registrador del Gateway.

## Registrador basado en archivos

- El archivo de registro rotativo predeterminado está en `/tmp/openclaw/` (un archivo por día): `openclaw-YYYY-MM-DD.log`
  - La fecha usa la zona horaria local del host del Gateway.
- Los archivos de registro activos rotan en `logging.maxFileBytes` (predeterminado: 100 MB), manteniendo
  hasta cinco archivos numerados y continuando la escritura en un archivo activo nuevo.
- La ruta y el nivel del archivo de registro se pueden configurar mediante `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

El formato del archivo es un objeto JSON por línea.

La pestaña Logs de Control UI hace tail de este archivo a través del Gateway (`logs.tail`).
La CLI puede hacer lo mismo:

```bash
openclaw logs --follow
```

**Modo detallado frente a niveles de registro**

- Los **registros de archivos** se controlan exclusivamente mediante `logging.level`.
- `--verbose` solo afecta a la **verbosidad de la consola** (y al estilo de registro WS); **no**
  aumenta el nivel de registro del archivo.
- Para capturar detalles solo visibles en modo detallado en los registros de archivos, establece `logging.level` en `debug` o
  `trace`.

## Captura de consola

La CLI captura `console.log/info/warn/error/debug/trace` y los escribe en registros de archivos,
mientras sigue imprimiéndolos en stdout/stderr.

Puedes ajustar la verbosidad de la consola de forma independiente mediante:

- `logging.consoleLevel` (predeterminado `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redacción del resumen de herramientas

Los resúmenes detallados de herramientas (p. ej. `🛠️ Exec: ...`) pueden enmascarar tokens sensibles antes de que lleguen al
flujo de la consola. Esto es **solo para herramientas** y no altera los registros de archivos.

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: matriz de cadenas regex (sobrescribe los valores predeterminados)
  - Usa cadenas regex sin procesar (auto `gi`), o `/pattern/flags` si necesitas flags personalizados.
  - Las coincidencias se enmascaran manteniendo los primeros 6 + últimos 4 caracteres (longitud >= 18), en caso contrario `***`.
  - Los valores predeterminados cubren asignaciones comunes de claves, flags de CLI, campos JSON, encabezados bearer, bloques PEM y prefijos populares de tokens.

## Registros WebSocket del Gateway

El Gateway imprime registros del protocolo WebSocket en dos modos:

- **Modo normal (sin `--verbose`)**: solo se imprimen los resultados RPC “interesantes”:
  - errores (`ok=false`)
  - llamadas lentas (umbral predeterminado: `>= 50ms`)
  - errores de análisis
- **Modo detallado (`--verbose`)**: imprime todo el tráfico de solicitud/respuesta WS.

### Estilo de registro WS

`openclaw gateway` admite un selector de estilo por Gateway:

- `--ws-log auto` (predeterminado): el modo normal está optimizado; el modo detallado usa salida compacta
- `--ws-log compact`: salida compacta (solicitud/respuesta emparejada) en modo detallado
- `--ws-log full`: salida completa por trama en modo detallado
- `--compact`: alias de `--ws-log compact`

Ejemplos:

```bash
# optimizado (solo errores/lentas)
openclaw gateway

# mostrar todo el tráfico WS (emparejado)
openclaw gateway --verbose --ws-log compact

# mostrar todo el tráfico WS (metadatos completos)
openclaw gateway --verbose --ws-log full
```

## Formato de consola (registro de subsistemas)

El formateador de consola **detecta TTY** e imprime líneas consistentes con prefijos.
Los registradores de subsistema mantienen la salida agrupada y fácil de examinar.

Comportamiento:

- **Prefijos de subsistema** en cada línea (p. ej. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colores de subsistema** (estables por subsistema) más coloración por nivel
- **Color cuando la salida es un TTY o el entorno parece una terminal enriquecida** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respetando `NO_COLOR`
- **Prefijos de subsistema abreviados**: elimina los segmentos iniciales `gateway/` + `channels/`, conserva los 2 últimos segmentos (p. ej. `whatsapp/outbound`)
- **Subregistradores por subsistema** (prefijo automático + campo estructurado `{ subsystem }`)
- **`logRaw()`** para salida QR/UX (sin prefijo, sin formato)
- **Estilos de consola** (p. ej. `pretty | compact | json`)
- **Nivel de registro de consola** separado del nivel de registro de archivos (el archivo conserva el detalle completo cuando `logging.level` está en `debug`/`trace`)
- Los **cuerpos de mensajes de WhatsApp** se registran en `debug` (usa `--verbose` para verlos)

Esto mantiene estables los registros de archivos existentes mientras hace que la salida interactiva sea fácil de examinar.

## Relacionado

- [Logging](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
