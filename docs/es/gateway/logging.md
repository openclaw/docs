---
read_when:
    - Cambiar la salida o los formatos de registro
    - Depuración de la salida de CLI o Gateway
summary: Superficies de registro, registros de archivos, estilos de registro WS y formato de consola
title: Registro de Gateway
x-i18n:
    generated_at: "2026-05-06T17:56:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16bce5763754d13f855a46777b4c3cc7a7c966e35e0cd08a15f359fd22623bcb
    source_path: gateway/logging.md
    workflow: 16
---

# Registro

Para una descripción general orientada al usuario (CLI + Control UI + configuración), consulta [/logging](/es/logging).

OpenClaw tiene dos "superficies" de registro:

- **Salida de consola** (lo que ves en la terminal / Debug UI).
- **Registros de archivo** (líneas JSON) escritos por el registrador del Gateway.

Al iniciar, el Gateway registra el modelo de agente predeterminado resuelto junto con los
valores predeterminados de modo que afectan a las sesiones nuevas, por ejemplo:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` proviene del agente predeterminado, los parámetros del modelo o el valor predeterminado global del agente;
cuando no está configurado, el resumen de inicio muestra `medium`. `fast` proviene del
agente predeterminado o de los parámetros `fastMode` del modelo.

## Registrador basado en archivos

- El archivo de registro rotativo predeterminado está bajo `/tmp/openclaw/` (un archivo por día): `openclaw-YYYY-MM-DD.log`
  - La fecha usa la zona horaria local del host del Gateway.
- Los archivos de registro activos rotan en `logging.maxFileBytes` (valor predeterminado: 100 MB), conservando
  hasta cinco archivos numerados y continuando la escritura en un archivo activo nuevo.
- La ruta y el nivel del archivo de registro se pueden configurar mediante `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

El formato de archivo es un objeto JSON por línea.

Las rutas de código de conversación, voz en tiempo real y salas gestionadas usan el registrador de archivos compartido para
registros de ciclo de vida acotados. Estos registros están pensados para depuración operativa
y exportación de registros OTLP; el texto de la transcripción, las cargas de audio, los ids de turnos, los ids de llamadas y
los ids de elementos del proveedor no se copian en el registro.

La pestaña Logs de Control UI sigue este archivo mediante el Gateway (`logs.tail`).
La CLI puede hacer lo mismo:

```bash
openclaw logs --follow
```

**Detallado frente a niveles de registro**

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
mientras sigue imprimiendo en stdout/stderr.

Puedes ajustar la verbosidad de consola de forma independiente mediante:

- `logging.consoleLevel` (valor predeterminado `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redacción

OpenClaw puede enmascarar tokens sensibles antes de que la salida de registro o transcripción salga del
proceso. Esta política de redacción de registros se aplica a los sumideros de texto de consola, registro de archivo, registros
OTLP y transcripciones de sesión, de modo que los valores secretos coincidentes se
enmascaran antes de que se escriban líneas JSONL o mensajes en disco.

- `logging.redactSensitive`: `off` | `tools` (valor predeterminado: `tools`)
- `logging.redactPatterns`: matriz de cadenas regex (sobrescribe los valores predeterminados)
  - Usa cadenas regex sin procesar (auto `gi`), o `/pattern/flags` si necesitas banderas personalizadas.
  - Las coincidencias se enmascaran conservando los primeros 6 + últimos 4 caracteres (longitud >= 18); de lo contrario, `***`.
  - Los valores predeterminados cubren asignaciones de claves comunes, banderas de CLI, campos JSON, encabezados bearer, bloques PEM, prefijos de token populares y nombres de campos de credenciales de pago como número de tarjeta, CVC/CVV, token de pago compartido y credencial de pago.

Algunos límites de seguridad siempre redactan sin importar `logging.redactSensitive`.
Eso incluye eventos de llamadas a herramientas de Control UI, salida de herramienta `sessions_history`,
exportaciones de soporte de diagnóstico, observaciones de errores de proveedor, visualización de comandos de aprobación de exec
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

- `--ws-log auto` (valor predeterminado): el modo normal está optimizado; el modo detallado usa salida compacta
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

## Formato de consola (registro de subsistema)

El formateador de consola es **consciente de TTY** e imprime líneas prefijadas coherentes.
Los registradores de subsistema mantienen la salida agrupada y fácil de examinar.

Comportamiento:

- **Prefijos de subsistema** en cada línea (p. ej. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colores de subsistema** (estables por subsistema) además del coloreado por nivel
- **Color cuando la salida es una TTY o el entorno parece una terminal enriquecida** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeta `NO_COLOR`
- **Prefijos de subsistema acortados**: elimina los prefijos iniciales `gateway/` + `channels/`, conserva los últimos 2 segmentos (p. ej. `whatsapp/outbound`)
- **Subregistradores por subsistema** (prefijo automático + campo estructurado `{ subsystem }`)
- **`logRaw()`** para salida QR/UX (sin prefijo, sin formato)
- **Estilos de consola** (p. ej. `pretty | compact | json`)
- **Nivel de registro de consola** separado del nivel de registro de archivo (el archivo conserva todo el detalle cuando `logging.level` está establecido en `debug`/`trace`)
- **Cuerpos de mensajes de WhatsApp** se registran en `debug` (usa `--verbose` para verlos)

Esto mantiene estables los registros de archivo existentes mientras hace que la salida interactiva sea fácil de examinar.

## Relacionado

- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
