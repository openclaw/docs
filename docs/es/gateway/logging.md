---
read_when:
    - Cambiar la salida o los formatos de registro
    - Depuración de la salida de la CLI o del gateway
summary: Superficies de registro, registros en archivos, estilos de registro de WS y formato de consola
title: Registro de Gateway
x-i18n:
    generated_at: "2026-06-27T11:31:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# Registro

Para obtener una vista general orientada al usuario (CLI + Control UI + configuración), consulta [/logging](/es/logging).

OpenClaw tiene dos "superficies" de registro:

- **Salida de consola** (lo que ves en la terminal / interfaz de depuración).
- **Registros de archivo** (líneas JSON) escritos por el registrador del Gateway.

Al iniciar, el Gateway registra el modelo de agente predeterminado resuelto junto con los
valores predeterminados de modo que afectan a las sesiones nuevas, por ejemplo:

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` proviene del agente predeterminado, de los parámetros del modelo o del valor predeterminado global del agente;
cuando no está definido, el resumen de inicio muestra `medium`. `fast` proviene del
agente predeterminado o de los parámetros `fastMode` del modelo.

## Registrador basado en archivos

- El archivo de registro rotativo predeterminado está bajo `/tmp/openclaw/` (un archivo por día): `openclaw-YYYY-MM-DD.log`
  - La fecha usa la zona horaria local del host del Gateway.
- Los archivos de registro activos rotan en `logging.maxFileBytes` (predeterminado: 100 MB), conservando
  hasta cinco archivos numerados y continuando la escritura en un archivo activo nuevo.
- La ruta y el nivel del archivo de registro se pueden configurar mediante `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

El formato del archivo es un objeto JSON por línea.

Las rutas de código de Talk, voz en tiempo real y salas administradas usan el registrador de archivo compartido para
registros de ciclo de vida acotados. Estos registros están pensados para la depuración operativa
y la exportación de registros OTLP; el texto de transcripciones, las cargas de audio, los ids de turno, los ids de llamada y
los ids de elementos del proveedor no se copian en el registro.

La pestaña Logs de Control UI sigue este archivo mediante el Gateway (`logs.tail`).
La CLI puede hacer lo mismo:

```bash
openclaw logs --follow
```

**Modo detallado frente a niveles de registro**

- **Registros de archivo** se controlan exclusivamente mediante `logging.level`.
- `--verbose` solo afecta la **verbosidad de consola** (y el estilo de registro WS); **no**
  eleva el nivel de registro de archivo.
- Para capturar detalles exclusivos del modo detallado en los registros de archivo, establece `logging.level` en `debug` o
  `trace`.
- El registro de traza también incluye resúmenes de tiempos de diagnóstico para rutas críticas seleccionadas,
  como la preparación de la fábrica de herramientas de Plugin. Consulta
  [/tools/plugin#slow-plugin-tool-setup](/es/tools/plugin#slow-plugin-tool-setup).

## Captura de consola

La CLI captura `console.log/info/warn/error/debug/trace` y los escribe en los registros de archivo,
sin dejar de imprimir en stdout/stderr.

Puedes ajustar la verbosidad de consola de forma independiente mediante:

- `logging.consoleLevel` (predeterminado `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redacción

OpenClaw puede enmascarar tokens confidenciales antes de que la salida de registro o transcripción salga del
proceso. Esta política de redacción de registros se aplica en la consola, registros de archivo, registros
OTLP y destinos de texto de transcripción de sesión, de modo que los valores secretos coincidentes se
enmascaran antes de que las líneas JSONL o los mensajes se escriban en disco.

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: arreglo de cadenas regex (anula los valores predeterminados)
  - Usa cadenas regex sin formato (auto `gi`), o `/pattern/flags` si necesitas indicadores personalizados.
  - Las coincidencias se enmascaran conservando los primeros 6 + últimos 4 caracteres (longitud >= 18); en caso contrario, `***`.
  - Los valores predeterminados cubren asignaciones de claves comunes, flags de CLI, campos JSON, encabezados bearer, bloques PEM, prefijos de tokens populares y nombres de campos de credenciales de pago como número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago.

Algunos límites de seguridad siempre redactan independientemente de `logging.redactSensitive`.
Eso incluye eventos de llamadas a herramientas de Control UI, salida de herramientas `sessions_history`,
exportaciones de soporte de diagnóstico, observaciones de errores de proveedor, visualización de comandos de aprobación exec
y registros del protocolo WebSocket del Gateway. Estas superficies aún pueden usar
`logging.redactPatterns` como patrones adicionales, pero `redactSensitive: "off"`
no hace que emitan secretos sin procesar.

## Registros WebSocket del Gateway

El Gateway imprime registros del protocolo WebSocket en dos modos:

- **Modo normal (sin `--verbose`)**: solo se imprimen resultados RPC "interesantes":
  - errores (`ok=false`)
  - llamadas lentas (umbral predeterminado: `>= 50ms`)
  - errores de análisis
- **Modo detallado (`--verbose`)**: imprime todo el tráfico de solicitud/respuesta WS.

### Estilo de registro WS

`openclaw gateway` admite un selector de estilo por Gateway:

- `--ws-log auto` (predeterminado): el modo normal está optimizado; el modo detallado usa salida compacta
- `--ws-log compact`: salida compacta (solicitud/respuesta emparejadas) cuando está en modo detallado
- `--ws-log full`: salida completa por frame cuando está en modo detallado
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

El formateador de consola es **consciente de TTY** e imprime líneas coherentes con prefijos.
Los registradores de subsistemas mantienen la salida agrupada y fácil de escanear.

Comportamiento:

- **Prefijos de subsistema** en cada línea (p. ej. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colores de subsistema** (estables por subsistema) además de coloreado por nivel
- **Color cuando la salida es una TTY o el entorno parece una terminal enriquecida** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeta `NO_COLOR`
- **Prefijos de subsistema acortados**: elimina `gateway/` + `channels/` iniciales, conserva los últimos 2 segmentos (p. ej. `whatsapp/outbound`)
- **Subregistradores por subsistema** (prefijo automático + campo estructurado `{ subsystem }`)
- **`logRaw()`** para salida QR/UX (sin prefijo, sin formato)
- **Estilos de consola** (p. ej. `pretty | compact | json`)
- **Nivel de registro de consola** separado del nivel de registro de archivo (el archivo conserva todo el detalle cuando `logging.level` se establece en `debug`/`trace`)
- **Cuerpos de mensajes de WhatsApp** se registran en `debug` (usa `--verbose` para verlos)

Esto mantiene estables los registros de archivo existentes y, al mismo tiempo, hace que la salida interactiva sea fácil de escanear.

## Relacionado

- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
