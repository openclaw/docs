---
read_when:
    - Cambiar la salida o los formatos de registro
    - Depuración de la salida de CLI o Gateway
summary: Superficies de registro, registros de archivo, estilos de registro de WS y formato de consola
title: Registro de Gateway
x-i18n:
    generated_at: "2026-05-06T09:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 078b4196ef1c5af5f7f0a4253f704d90d474a3ff668ec555559cab56cbcb15c6
    source_path: gateway/logging.md
    workflow: 16
---

# Registro

Para obtener una descripción general orientada al usuario (CLI + Control UI + configuración), consulta [/logging](/es/logging).

OpenClaw tiene dos "superficies" de registro:

- **Salida de consola** (lo que ves en el terminal / Debug UI).
- **Registros de archivo** (líneas JSON) escritos por el registrador del Gateway.

Al iniciar, el Gateway registra el modelo de agente predeterminado resuelto junto con los
valores predeterminados de modo que afectan a las sesiones nuevas, por ejemplo:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` proviene del agente predeterminado, los parámetros del modelo o el valor predeterminado global del agente;
cuando no está definido, el resumen de inicio muestra `medium`. `fast` proviene del
agente predeterminado o de los parámetros `fastMode` del modelo.

## Registrador basado en archivos

- El archivo de registro rotativo predeterminado está bajo `/tmp/openclaw/` (un archivo por día): `openclaw-YYYY-MM-DD.log`
  - La fecha usa la zona horaria local del host del Gateway.
- Los archivos de registro activos rotan en `logging.maxFileBytes` (predeterminado: 100 MB), conservan
  hasta cinco archivos numerados y siguen escribiendo en un archivo activo nuevo.
- La ruta y el nivel del archivo de registro se pueden configurar mediante `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

El formato de archivo es un objeto JSON por línea.

La pestaña Logs de Control UI sigue este archivo mediante el Gateway (`logs.tail`).
La CLI puede hacer lo mismo:

```bash
openclaw logs --follow
```

**Verbose frente a niveles de registro**

- **Los registros de archivo** se controlan exclusivamente mediante `logging.level`.
- `--verbose` solo afecta la **verbosidad de la consola** (y el estilo de registro WS); **no**
  eleva el nivel de registro del archivo.
- Para capturar detalles exclusivos de verbose en los registros de archivo, establece `logging.level` en `debug` o
  `trace`.
- El registro de trazas también incluye resúmenes de tiempos de diagnóstico para rutas críticas seleccionadas,
  como la preparación de fábrica de herramientas de Plugin. Consulta
  [/tools/plugin#slow-plugin-tool-setup](/es/tools/plugin#slow-plugin-tool-setup).

## Captura de consola

La CLI captura `console.log/info/warn/error/debug/trace` y los escribe en registros de archivo,
sin dejar de imprimir en stdout/stderr.

Puedes ajustar la verbosidad de la consola de forma independiente mediante:

- `logging.consoleLevel` (predeterminado `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redacción

OpenClaw puede enmascarar tokens sensibles antes de que la salida de registro o transcripción salga del
proceso. Esta política de redacción de registros se aplica en las salidas de texto de consola, archivo de registro, registro
OTLP y transcripción de sesión, de modo que los valores secretos coincidentes se
enmascaran antes de escribir líneas JSONL o mensajes en disco.

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: arreglo de cadenas regex (anula los valores predeterminados)
  - Usa cadenas regex sin procesar (auto `gi`), o `/pattern/flags` si necesitas flags personalizados.
  - Las coincidencias se enmascaran conservando los primeros 6 + últimos 4 caracteres (longitud >= 18), de lo contrario `***`.
  - Los valores predeterminados cubren asignaciones de claves comunes, flags de CLI, campos JSON, cabeceras bearer, bloques PEM, prefijos de tokens populares y nombres de campos de credenciales de pago como número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago.

Algunos límites de seguridad siempre redactan independientemente de `logging.redactSensitive`.
Esto incluye eventos de llamadas de herramientas de Control UI, salida de herramienta `sessions_history`,
exportaciones de soporte de diagnóstico, observaciones de errores de proveedor, visualización de comandos de aprobación de ejecución
y registros del protocolo WebSocket del Gateway. Estas superficies pueden seguir usando
`logging.redactPatterns` como patrones adicionales, pero `redactSensitive: "off"`
no hace que emitan secretos sin procesar.

## Registros WebSocket del Gateway

El Gateway imprime registros del protocolo WebSocket en dos modos:

- **Modo normal (sin `--verbose`)**: solo se imprimen resultados RPC "interesantes":
  - errores (`ok=false`)
  - llamadas lentas (umbral predeterminado: `>= 50ms`)
  - errores de análisis
- **Modo verbose (`--verbose`)**: imprime todo el tráfico de solicitud/respuesta WS.

### Estilo de registro WS

`openclaw gateway` admite un cambio de estilo por Gateway:

- `--ws-log auto` (predeterminado): el modo normal está optimizado; el modo verbose usa salida compacta
- `--ws-log compact`: salida compacta (solicitud/respuesta emparejadas) cuando está en verbose
- `--ws-log full`: salida completa por frame cuando está en verbose
- `--compact`: alias de `--ws-log compact`

Ejemplos:

```bash
# optimizado (solo errores/lento)
openclaw gateway

# mostrar todo el tráfico WS (emparejado)
openclaw gateway --verbose --ws-log compact

# mostrar todo el tráfico WS (metadatos completos)
openclaw gateway --verbose --ws-log full
```

## Formato de consola (registro de subsistemas)

El formateador de consola es **consciente de TTY** e imprime líneas coherentes con prefijo.
Los registradores de subsistemas mantienen la salida agrupada y fácil de revisar.

Comportamiento:

- **Prefijos de subsistema** en cada línea (p. ej. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colores de subsistema** (estables por subsistema) además de coloración por nivel
- **Color cuando la salida es un TTY o el entorno parece un terminal enriquecido** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeta `NO_COLOR`
- **Prefijos de subsistema abreviados**: elimina los prefijos iniciales `gateway/` + `channels/`, conserva los últimos 2 segmentos (p. ej. `whatsapp/outbound`)
- **Subregistradores por subsistema** (prefijo automático + campo estructurado `{ subsystem }`)
- **`logRaw()`** para salida QR/UX (sin prefijo, sin formato)
- **Estilos de consola** (p. ej. `pretty | compact | json`)
- **Nivel de registro de consola** separado del nivel de registro de archivo (el archivo conserva todo el detalle cuando `logging.level` se establece en `debug`/`trace`)
- **Los cuerpos de mensajes de WhatsApp** se registran en `debug` (usa `--verbose` para verlos)

Esto mantiene estables los registros de archivo existentes y hace que la salida interactiva sea fácil de revisar.

## Relacionado

- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry)
- [Exportación de diagnóstico](/es/gateway/diagnostics)
