---
read_when:
    - Cambiar la salida o los formatos de registro
    - Depuración de la salida de la CLI o del Gateway
summary: Superficies de registro, registros de archivos, estilos de registro WS y formato de consola
title: Registro de Gateway
x-i18n:
    generated_at: "2026-07-05T11:19:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7c689690d10ccdc5eca838e5248a5bf235a595c7498c600760dc71cf5c688eb
    source_path: gateway/logging.md
    workflow: 16
---

# Registro

Para ver una descripción general orientada al usuario (CLI + Interfaz de control + configuración), consulta [/logging](/es/logging).

OpenClaw tiene dos superficies de registro:

- **Salida de consola** - lo que ves en la terminal / Interfaz de depuración.
- **Registros de archivo** - líneas JSON escritas por el registrador del Gateway.

Al iniciar, el Gateway registra el modelo de agente predeterminado resuelto más los valores predeterminados de modo que afectan a las sesiones nuevas:

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` proviene del agente predeterminado, de los parámetros del modelo o del valor predeterminado global del agente; cuando no está definido muestra `medium`. `fast` proviene del agente predeterminado o de los parámetros `fastMode` del modelo.

## Registrador basado en archivos

- El archivo de registro rotativo predeterminado está bajo `/tmp/openclaw/` (un archivo por día): `openclaw-YYYY-MM-DD.log`, fechado según la zona horaria local del host del Gateway. Si ese directorio no es seguro o no se puede escribir (propietario incorrecto, escribible por todos, un enlace simbólico), OpenClaw recurre en su lugar a una ruta `os.tmpdir()/openclaw-<uid>` con ámbito de usuario; en Windows siempre usa esa alternativa de tmpdir del sistema operativo.
- Los archivos de registro activos rotan en `logging.maxFileBytes` (predeterminado: 100 MB), mantienen hasta cinco archivos numerados (`.1` a `.5`) y continúan escribiendo en un archivo activo nuevo.
- Configura la ruta y el nivel del archivo de registro mediante `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- El formato de archivo es un objeto JSON por línea.

Las rutas de código de Talk, voz en tiempo real y salas administradas usan el registrador de archivos compartido para registros de ciclo de vida acotados destinados a la depuración operativa y a la exportación de registros OTLP. El texto de transcripciones, las cargas de audio, los id de turno, los id de llamada y los id de elementos del proveedor nunca se copian en el registro.

La pestaña Registros de la Interfaz de control sigue este archivo mediante el Gateway (`logs.tail`). La CLI hace lo mismo:

```bash
openclaw logs --follow
```

### Detallado frente a niveles de registro

- Los **registros de archivo** se controlan exclusivamente mediante `logging.level`.
- `--verbose` solo afecta la **verbosidad de consola** (y el estilo de registro WS); **no** eleva el nivel de registro de archivo.
- Para capturar detalles solo detallados en los registros de archivo, establece `logging.level` en `debug` o `trace`.
- El registro de trazas también incluye resúmenes de tiempos de diagnóstico para rutas críticas seleccionadas, como la preparación de la fábrica de herramientas de Plugin. Consulta [/tools/plugin#slow-plugin-tool-setup](/es/tools/plugin#slow-plugin-tool-setup).

## Captura de consola

La CLI captura `console.log/info/warn/error/debug/trace`, los escribe en los registros de archivo y sigue imprimiendo en stdout/stderr.

Ajusta la verbosidad de consola de forma independiente:

- `logging.consoleLevel` (predeterminado `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; por defecto `pretty` en una TTY, `compact` en caso contrario)

## Redacción

OpenClaw enmascara los tokens sensibles antes de que la salida de registros o transcripciones salga del proceso. Esta política de redacción se aplica en consola, registros de archivo, registros OTLP y sumideros de texto de transcripción de sesión, por lo que los valores secretos coincidentes se enmascaran antes de que las líneas JSONL o los mensajes se escriban en disco.

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: arreglo de cadenas regex (anula los valores predeterminados)
  - Usa cadenas regex sin procesar (auto `gi`) o `/pattern/flags` para banderas personalizadas.
  - Las coincidencias se enmascaran conservando los primeros 6 + últimos 4 caracteres (valores >= 18 caracteres); los valores más cortos se convierten en `***`.
  - Los valores predeterminados cubren asignaciones de claves comunes, banderas de CLI, campos JSON, encabezados bearer, bloques PEM, prefijos populares de tokens de proveedores y nombres de campos de credenciales de pago (número de tarjeta, CVC/CVV, token de pago compartido, credencial de pago).

Algunos límites de seguridad siempre redactan independientemente de `logging.redactSensitive`: eventos de llamada a herramientas de la Interfaz de control, salida de la herramienta `sessions_history`, exportaciones de soporte de diagnóstico, observaciones de errores de proveedor, visualización de comandos de aprobación de ejecución y registros del protocolo WebSocket del Gateway. Estas superficies siguen respetando `logging.redactPatterns` como patrones adicionales, pero `redactSensitive: "off"` no hace que emitan secretos sin procesar.

## Registros WebSocket del Gateway

El Gateway imprime registros del protocolo WebSocket en dos modos:

- **Modo normal (sin `--verbose`)**: solo imprime resultados RPC "interesantes": errores (`ok=false`), llamadas lentas (umbral predeterminado: `>= 50ms`) y errores de análisis.
- **Modo detallado (`--verbose`)**: imprime todo el tráfico de solicitud/respuesta WS.

### Estilo de registro WS

`openclaw gateway` admite un selector de estilo por Gateway:

- `--ws-log auto` (predeterminado): el modo normal está optimizado; el modo detallado usa salida compacta.
- `--ws-log compact`: salida compacta (solicitud/respuesta emparejadas) cuando está detallado.
- `--ws-log full`: salida completa por trama cuando está detallado.
- `--compact`: alias de `--ws-log compact`.

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Formato de consola (registro por subsistema)

El formateador de consola es **consciente de TTY** e imprime líneas consistentes con prefijo. Los registradores de subsistema mantienen la salida agrupada y fácil de escanear:

- **Prefijos de subsistema** en cada línea (p. ej. `[gateway]`, `[canvas]`, `[tailscale]`).
- **Colores de subsistema** (estables por subsistema, con hash a partir del nombre) más coloración por nivel.
- **Color cuando la salida es una TTY** o el entorno parece una terminal enriquecida (`TERM`/`COLORTERM`/`TERM_PROGRAM`); respeta `NO_COLOR` y `FORCE_COLOR`.
- **Prefijos de subsistema acortados**: elimina un segmento inicial `gateway/`, `channels/` o `providers/`, y luego conserva como máximo los últimos 2 segmentos restantes (p. ej. `channels/turn/kernel` se muestra como `turn/kernel`). Los subsistemas de canales conocidos (`telegram`, `whatsapp`, `slack`, etc.) siempre se contraen solo al nombre del canal.
- **Subregistradores por subsistema** (prefijo automático + campo estructurado `{ subsystem }`).
- **`logRaw()`** para salida QR/UX (sin prefijo, sin formato).
- **Estilos de consola**: `pretty` | `compact` | `json`.
- El **nivel de registro de consola** está separado del nivel de registro de archivo (el archivo conserva todos los detalles cuando `logging.level` es `debug`/`trace`).
- Los **cuerpos de mensajes de WhatsApp** se registran en `debug` (usa `--verbose` para verlos).

Esto mantiene estables los registros de archivo mientras hace que la salida interactiva sea fácil de escanear.

## Relacionado

- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry)
- [Exportación de diagnóstico](/es/gateway/diagnostics)
