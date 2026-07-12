---
read_when:
    - Cambiar la salida o los formatos de registro
    - Depuración de la salida de la CLI o del Gateway
summary: Superficies de registro, registros en archivos, estilos de registro de WS y formato de consola
title: Registro del Gateway
x-i18n:
    generated_at: "2026-07-11T23:08:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Registro

Para obtener una descripción general orientada al usuario (CLI + interfaz de control + configuración), consulta [/logging](/es/logging).

OpenClaw tiene dos superficies de registro:

- **Salida de consola**: lo que ves en el terminal o en la interfaz de depuración.
- **Registros de archivo**: líneas JSON escritas por el registrador del Gateway.

Al iniciarse, el Gateway registra el modelo predeterminado resuelto del agente, además de los valores predeterminados de los modos que afectan a las sesiones nuevas:

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking` procede del agente predeterminado, de los parámetros del modelo o del valor predeterminado global del agente; si no está definido, muestra `medium`. `fast` procede del agente predeterminado o de los parámetros `fastMode` del modelo.

## Registrador basado en archivos

- El archivo de registro rotativo predeterminado se encuentra en `/tmp/openclaw/` (un archivo por día): `openclaw-YYYY-MM-DD.log`, fechado según la zona horaria local del host del Gateway. Si ese directorio no es seguro o no permite escritura (propietario incorrecto, escritura habilitada para todos o un enlace simbólico), OpenClaw utiliza en su lugar una ruta `os.tmpdir()/openclaw-<uid>` específica del usuario; en Windows siempre utiliza esta alternativa basada en el directorio temporal del sistema operativo.
- Los archivos de registro activos rotan al alcanzar `logging.maxFileBytes` (valor predeterminado: 100 MB), conservan hasta cinco archivos numerados (`.1` a `.5`) y continúan escribiendo en un archivo activo nuevo.
- Configura la ruta y el nivel del archivo de registro mediante `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- El formato del archivo es un objeto JSON por línea.

Las rutas de código de conversación, voz en tiempo real y salas administradas utilizan el registrador de archivos compartido para registros acotados del ciclo de vida destinados a la depuración operativa y la exportación de registros OTLP. El texto de la transcripción, las cargas de audio, los identificadores de turno, los identificadores de llamada y los identificadores de elementos del proveedor nunca se copian en el registro.

La pestaña Registros de la interfaz de control sigue este archivo mediante el Gateway (`logs.tail`). La CLI hace lo mismo:

```bash
openclaw logs --follow
```

### Modo detallado frente a niveles de registro

- Los **registros de archivo** se controlan exclusivamente mediante `logging.level`.
- `--verbose` solo afecta al **nivel de detalle de la consola** (y al estilo de registro de WS); **no** aumenta el nivel de los registros de archivo.
- Para capturar en los registros de archivo detalles que solo aparecen en modo detallado, establece `logging.level` en `debug` o `trace`.
- El registro de seguimiento también incluye resúmenes de tiempos de diagnóstico para determinadas rutas críticas, como la preparación de la factoría de herramientas de Plugin. Consulta [/tools/plugin#slow-plugin-tool-setup](/es/tools/plugin#slow-plugin-tool-setup).

## Captura de consola

La CLI captura `console.log/info/warn/error/debug/trace`, los escribe en los registros de archivo y continúa mostrándolos en stdout/stderr.

Ajusta de forma independiente el nivel de detalle de la consola:

- `logging.consoleLevel` (valor predeterminado: `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; el valor predeterminado es `pretty` en una TTY y `compact` en los demás casos)

## Censura

OpenClaw enmascara los tokens confidenciales antes de que la salida de registros o transcripciones abandone el proceso. Esta política de censura se aplica a los destinos de texto de la consola, los registros de archivo, los registros OTLP y las transcripciones de sesión, por lo que los valores secretos coincidentes se enmascaran antes de escribir en el disco líneas JSONL o mensajes.

- `logging.redactSensitive`: `off` | `tools` (valor predeterminado: `tools`)
- `logging.redactPatterns`: matriz de cadenas de expresiones regulares (sustituye los valores predeterminados)
  - Utiliza cadenas de expresiones regulares sin delimitadores (`gi` automático), o `/pattern/flags` para especificar indicadores personalizados.
  - Las coincidencias se enmascaran conservando los primeros 6 y los últimos 4 caracteres (para valores de al menos 18 caracteres); los valores más cortos se convierten en `***`.
  - Los valores predeterminados abarcan asignaciones de claves habituales, indicadores de la CLI, campos JSON, cabeceras de portador, bloques PEM, prefijos de tokens de proveedores populares y nombres de campos de credenciales de pago (número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago).

Algunos límites de seguridad siempre aplican censura independientemente de `logging.redactSensitive`: eventos de llamadas a herramientas de la interfaz de control, salida de la herramienta `sessions_history`, exportaciones de asistencia para diagnósticos, observaciones de errores del proveedor, visualización de comandos de aprobación de ejecución y registros del protocolo WebSocket del Gateway. Estas superficies siguen respetando `logging.redactPatterns` como patrones adicionales, pero `redactSensitive: "off"` no hace que emitan secretos sin enmascarar.

## Registros WebSocket del Gateway

El Gateway muestra los registros del protocolo WebSocket en dos modos:

- **Modo normal (sin `--verbose`)**: solo muestra resultados RPC «relevantes»: errores (`ok=false`), llamadas lentas (umbral predeterminado: `>= 50ms`) y errores de análisis.
- **Modo detallado (`--verbose`)**: muestra todo el tráfico de solicitudes y respuestas de WS.

### Estilo de registro de WS

`openclaw gateway` admite un selector de estilo específico para cada Gateway:

- `--ws-log auto` (valor predeterminado): el modo normal está optimizado; el modo detallado utiliza una salida compacta.
- `--ws-log compact`: salida compacta (solicitud y respuesta emparejadas) en modo detallado.
- `--ws-log full`: salida completa por trama en modo detallado.
- `--compact`: alias de `--ws-log compact`.

```bash
# optimizado (solo errores/lentitud)
openclaw gateway

# mostrar todo el tráfico WS (emparejado)
openclaw gateway --verbose --ws-log compact

# mostrar todo el tráfico WS (metadatos completos)
openclaw gateway --verbose --ws-log full
```

## Formato de consola (registro por subsistemas)

El formateador de consola **detecta la TTY** y muestra líneas coherentes con prefijos. Los registradores de subsistemas mantienen la salida agrupada y fácil de examinar:

- **Prefijos de subsistema** en cada línea (por ejemplo, `[gateway]`, `[canvas]`, `[tailscale]`).
- **Colores de subsistema** (estables para cada subsistema y derivados del nombre mediante hash), además de colores según el nivel.
- **Color cuando la salida es una TTY** o el entorno parece un terminal enriquecido (`TERM`/`COLORTERM`/`TERM_PROGRAM`); respeta `NO_COLOR` y `FORCE_COLOR`.
- **Prefijos de subsistema abreviados**: elimina un segmento inicial `gateway/`, `channels/` o `providers/` y conserva como máximo los 2 últimos segmentos restantes (por ejemplo, `channels/turn/kernel` se muestra como `turn/kernel`). Los subsistemas de canales conocidos (`telegram`, `whatsapp`, `slack`, etc.) siempre se reducen únicamente al nombre del canal.
- **Registradores secundarios por subsistema** (prefijo automático + campo estructurado `{ subsystem }`).
- **`logRaw()`** para la salida de QR/UX (sin prefijo ni formato).
- **Estilos de consola**: `pretty` | `compact` | `json`.
- El **nivel de registro de la consola** es independiente del nivel de registro del archivo (el archivo conserva todos los detalles cuando `logging.level` es `debug`/`trace`).
- Los **cuerpos de mensajes de WhatsApp** se registran en el nivel `debug` (utiliza `--verbose` para verlos).

Esto mantiene estables los registros de archivo y, al mismo tiempo, facilita el examen de la salida interactiva.

## Temas relacionados

- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
