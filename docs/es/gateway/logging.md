---
read_when:
    - Cambiar la salida o los formatos de registro
    - Depuración de la salida de la CLI o del Gateway
summary: Superficies de registro, registros en archivos, estilos de registro de WS y formato de consola
title: Registro del Gateway
x-i18n:
    generated_at: "2026-05-02T05:26:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb5f5ccd77909e82bd2938a33514ce8361c69910eb945c731d9b2c8266174c13
    source_path: gateway/logging.md
    workflow: 16
---

# Registro

Para una descripción general orientada al usuario (CLI + interfaz de control + configuración), consulta [/logging](/es/logging).

OpenClaw tiene dos “superficies” de registro:

- **Salida de consola** (lo que ves en la terminal / interfaz de depuración).
- **Registros de archivo** (líneas JSON) escritos por el registrador del Gateway.

## Registrador basado en archivos

- El archivo de registro rotativo predeterminado está bajo `/tmp/openclaw/` (un archivo por día): `openclaw-YYYY-MM-DD.log`
  - La fecha usa la zona horaria local del host del Gateway.
- Los archivos de registro activos rotan en `logging.maxFileBytes` (predeterminado: 100 MB), conservan
  hasta cinco archivos numerados y continúan escribiendo un nuevo archivo activo.
- La ruta y el nivel del archivo de registro se pueden configurar mediante `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

El formato de archivo es un objeto JSON por línea.

La pestaña de registros de la interfaz de control sigue este archivo mediante el Gateway (`logs.tail`).
La CLI puede hacer lo mismo:

```bash
openclaw logs --follow
```

**Detallado frente a niveles de registro**

- **Los registros de archivo** se controlan exclusivamente con `logging.level`.
- `--verbose` solo afecta la **verbosidad de la consola** (y el estilo de registro WS); **no**
  aumenta el nivel de registro del archivo.
- Para capturar detalles solo disponibles en modo detallado en los registros de archivo, establece `logging.level` en `debug` o
  `trace`.
- El registro de trazas también incluye resúmenes de tiempos de diagnóstico para rutas críticas seleccionadas,
  como la preparación de la fábrica de herramientas de Plugin. Consulta
  [/tools/plugin#slow-plugin-tool-setup](/es/tools/plugin#slow-plugin-tool-setup).

## Captura de consola

La CLI captura `console.log/info/warn/error/debug/trace` y los escribe en los registros de archivo,
mientras sigue imprimiendo en stdout/stderr.

Puedes ajustar la verbosidad de la consola de forma independiente mediante:

- `logging.consoleLevel` (predeterminado `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redacción

OpenClaw puede enmascarar tokens sensibles antes de que la salida de registro o transcripción salga del
proceso. Esta política de redacción de registros se aplica en los destinos de texto de consola, registro de archivo, registros
OTLP y transcripciones de sesión, de modo que los valores secretos coincidentes se enmascaran
antes de que las líneas JSONL o los mensajes se escriban en disco.

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: arreglo de cadenas regex (sobrescribe los valores predeterminados)
  - Usa cadenas regex sin procesar (`gi` automático), o `/pattern/flags` si necesitas marcas personalizadas.
  - Las coincidencias se enmascaran conservando los primeros 6 + últimos 4 caracteres (longitud >= 18); de lo contrario, `***`.
  - Los valores predeterminados cubren asignaciones de claves comunes, flags de CLI, campos JSON, encabezados bearer, bloques PEM, prefijos populares de tokens y nombres de campos de credenciales de pago como número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago.

Algunos límites de seguridad siempre redactan independientemente de `logging.redactSensitive`.
Eso incluye eventos de llamadas a herramientas de la interfaz de control, salida de herramienta `sessions_history`,
exportaciones de soporte de diagnóstico, observaciones de errores de proveedores, visualización de comandos de aprobación de ejecución
y registros del protocolo WebSocket del Gateway. Estas superficies todavía pueden usar
`logging.redactPatterns` como patrones adicionales, pero `redactSensitive: "off"`
no hace que emitan secretos sin procesar.

## Registros WebSocket del Gateway

El Gateway imprime registros del protocolo WebSocket en dos modos:

- **Modo normal (sin `--verbose`)**: solo se imprimen resultados RPC “interesantes”:
  - errores (`ok=false`)
  - llamadas lentas (umbral predeterminado: `>= 50ms`)
  - errores de análisis
- **Modo detallado (`--verbose`)**: imprime todo el tráfico de solicitudes/respuestas WS.

### Estilo de registro WS

`openclaw gateway` admite un selector de estilo por Gateway:

- `--ws-log auto` (predeterminado): el modo normal está optimizado; el modo detallado usa salida compacta
- `--ws-log compact`: salida compacta (solicitud/respuesta emparejadas) en modo detallado
- `--ws-log full`: salida completa por frame en modo detallado
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

## Formato de consola (registro por subsistema)

El formateador de consola es **consciente de TTY** e imprime líneas coherentes con prefijo.
Los registradores de subsistema mantienen la salida agrupada y fácil de revisar.

Comportamiento:

- **Prefijos de subsistema** en cada línea (p. ej. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colores de subsistema** (estables por subsistema) más coloración por nivel
- **Color cuando la salida es una TTY o el entorno parece una terminal enriquecida** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeta `NO_COLOR`
- **Prefijos de subsistema abreviados**: elimina `gateway/` + `channels/` iniciales, conserva los últimos 2 segmentos (p. ej. `whatsapp/outbound`)
- **Subregistradores por subsistema** (prefijo automático + campo estructurado `{ subsystem }`)
- **`logRaw()`** para salida QR/UX (sin prefijo, sin formato)
- **Estilos de consola** (p. ej. `pretty | compact | json`)
- **Nivel de registro de consola** separado del nivel de registro de archivo (el archivo conserva todo el detalle cuando `logging.level` se establece en `debug`/`trace`)
- **Los cuerpos de mensajes de WhatsApp** se registran en `debug` (usa `--verbose` para verlos)

Esto mantiene estables los registros de archivo existentes y hace que la salida interactiva sea fácil de revisar.

## Relacionado

- [Registro](/es/logging)
- [Exportación OpenTelemetry](/es/gateway/opentelemetry)
- [Exportación de diagnóstico](/es/gateway/diagnostics)
