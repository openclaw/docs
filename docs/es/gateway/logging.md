---
read_when:
    - Cambiar la salida o los formatos de registro
    - Depuración de la salida de la CLI o del Gateway
summary: Superficies de registro, registros en archivos, estilos de registro de WS y formato de consola
title: Registro del Gateway
x-i18n:
    generated_at: "2026-07-22T10:36:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 257427f06767d4574cb4657d6a3953930807fa08da4e40ef0a403b34c57aaeee
    source_path: gateway/logging.md
    workflow: 16
---

# Registro

Para obtener una descripción general orientada al usuario (CLI + interfaz de control + configuración), consulta [/logging](/es/logging).

OpenClaw tiene dos superficies de registro:

- **Salida de consola**: lo que se ve en el terminal o en la interfaz de depuración.
- **Registros de archivo**: líneas JSON escritas por el registrador del Gateway.

Al iniciarse, el Gateway registra el modelo resuelto del agente predeterminado, junto con los valores predeterminados de modo que afectan a las sesiones nuevas:

```text
modelo del agente: openai/gpt-5.6-sol (razonamiento=medio, rápido=activado)
```

`thinking` procede del agente predeterminado, de los parámetros del modelo o del valor predeterminado global del agente; cuando no está definido, muestra `medium`. `fast` procede del agente predeterminado o de los parámetros `fastMode` del modelo.

## Registrador basado en archivos

- El archivo de registro rotativo predeterminado se encuentra en `/tmp/openclaw/` (un archivo por día): `openclaw-YYYY-MM-DD.log`, fechado según la zona horaria local del host del Gateway. Si ese directorio no es seguro o no admite escritura (propietario incorrecto, escritura habilitada para todos o enlace simbólico), OpenClaw recurre en su lugar a una ruta `os.tmpdir()/openclaw-<uid>` específica del usuario; en Windows siempre utiliza esa ruta alternativa del directorio temporal del sistema operativo.
- Los archivos de registro activos rotan al alcanzar `logging.maxFileBytes` (valor predeterminado: 100 MB), conservan hasta cinco archivos numerados (`.1` a `.5`) y continúan escribiendo en un archivo activo nuevo.
- Configura la ruta y el nivel del archivo de registro mediante `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- El formato del archivo es un objeto JSON por línea.

Las rutas de código de conversación, voz en tiempo real y salas administradas utilizan el registrador de archivos compartido para registros de ciclo de vida acotados destinados a la depuración operativa y a la exportación de registros OTLP. El texto de las transcripciones, las cargas de audio, los identificadores de turno, los identificadores de llamada y los identificadores de elementos del proveedor nunca se copian en el registro.

La pestaña Registros de la interfaz de control sigue este archivo a través del Gateway (`logs.tail`). La CLI hace lo mismo:

```bash
openclaw logs --follow
```

### Modo detallado frente a niveles de registro

- Los **registros de archivo** se controlan exclusivamente mediante `logging.level`.
- `--verbose` solo afecta al **nivel de detalle de la consola** (y al estilo de registro de WS); **no** eleva el nivel de los registros de archivo.
- Para capturar en los registros de archivo detalles exclusivos del modo detallado, establece `logging.level` en `debug` o `trace`.
- El registro de trazas también incluye resúmenes de tiempos de diagnóstico para determinadas rutas críticas, como la preparación de la fábrica de herramientas de plugins. Consulta [/tools/plugin#slow-plugin-tool-setup](/es/tools/plugin#slow-plugin-tool-setup).

## Captura de consola

La CLI captura `console.log/info/warn/error/debug/trace`, los escribe en los registros de archivo y continúa mostrándolos en stdout/stderr.

Ajusta por separado el nivel de detalle de la consola:

- `logging.consoleLevel` (valor predeterminado: `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; el valor predeterminado es `pretty` en un TTY y `compact` en caso contrario)

## Redacción

OpenClaw enmascara los tokens confidenciales antes de que la salida de registros o transcripciones abandone el proceso. Esta política de redacción se aplica a la consola, los registros de archivo, los registros OTLP y los destinos de texto de las transcripciones de sesión, de modo que los valores secretos coincidentes se enmascaran antes de escribir líneas JSONL o mensajes en el disco.

- La redacción de valores confidenciales está siempre habilitada.
- `logging.redactPatterns`: matriz de cadenas de expresiones regulares (sustituye los valores predeterminados)
  - Utiliza cadenas de expresiones regulares sin procesar (`gi` automático) o `/pattern/flags` para indicadores personalizados.
  - Las coincidencias se enmascaran conservando los primeros 6 y los últimos 4 caracteres (para valores >= 18 caracteres); los valores más cortos se convierten en `***`.
  - Los valores predeterminados abarcan asignaciones habituales de claves, indicadores de la CLI, campos JSON, encabezados de portador, bloques PEM, prefijos de tokens de proveedores populares y nombres de campos de credenciales de pago (número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago).

Los límites de seguridad, como los eventos de llamadas a herramientas de la interfaz de control, la salida de `sessions_history`, las exportaciones de diagnóstico, los errores de proveedores, la visualización de aprobación de ejecución y los registros WebSocket del Gateway, siempre aplican la redacción. `logging.redactPatterns` añade patrones específicos de la implementación.

## Registros WebSocket del Gateway

El Gateway muestra los registros del protocolo WebSocket en dos modos:

- **Modo normal (sin `--verbose`)**: solo se muestran los resultados RPC «relevantes»: errores (`ok=false`), llamadas lentas (umbral predeterminado: `>= 50ms`) y errores de análisis.
- **Modo detallado (`--verbose`)**: muestra todo el tráfico de solicitudes y respuestas de WS.

### Estilo de registro de WS

`openclaw gateway` admite un selector de estilo por Gateway:

- `--ws-log auto` (valor predeterminado): el modo normal está optimizado; el modo detallado utiliza una salida compacta.
- `--ws-log compact`: salida compacta (solicitud y respuesta emparejadas) en modo detallado.
- `--ws-log full`: salida completa por trama en modo detallado.
- `--compact`: alias de `--ws-log compact`.

```bash
# optimizado (solo errores/operaciones lentas)
openclaw gateway

# mostrar todo el tráfico de WS (emparejado)
openclaw gateway --verbose --ws-log compact

# mostrar todo el tráfico de WS (metadatos completos)
openclaw gateway --verbose --ws-log full
```

## Formato de consola (registro por subsistema)

El formateador de consola **detecta el TTY** y muestra líneas uniformes con prefijos. Los registradores de subsistemas mantienen la salida agrupada y fácil de examinar:

- **Prefijos de subsistema** en cada línea (p. ej., `[gateway]`, `[canvas]`, `[tailscale]`).
- **Colores de subsistema** (estables para cada subsistema y derivados mediante hash del nombre), además de colores por nivel.
- **Color cuando la salida es un TTY** o el entorno parece un terminal avanzado (`TERM`/`COLORTERM`/`TERM_PROGRAM`); respeta `NO_COLOR` y `FORCE_COLOR`.
- **Prefijos de subsistema abreviados**: elimina un segmento inicial `gateway/`, `channels/` o `providers/` y conserva como máximo los 2 últimos segmentos restantes (p. ej., `channels/turn/kernel` se muestra como `turn/kernel`). Los subsistemas de canales conocidos (`telegram`, `whatsapp`, `slack`, etc.) siempre se reducen únicamente al nombre del canal.
- **Registradores secundarios por subsistema** (prefijo automático + campo estructurado `{ subsystem }`).
- **`logRaw()`** para la salida de QR/UX (sin prefijo ni formato).
- **Estilos de consola**: `pretty` | `compact` | `json`.
- El **nivel de registro de la consola** es independiente del nivel de registro de archivo (el archivo conserva todos los detalles cuando `logging.level` es `debug`/`trace`).
- Los **cuerpos de los mensajes de WhatsApp** se registran en `debug` (utiliza `--verbose` para verlos).

Esto mantiene estables los registros de archivo y facilita el examen de la salida interactiva.

## Contenido relacionado

- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
