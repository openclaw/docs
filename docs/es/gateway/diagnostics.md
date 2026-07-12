---
read_when:
    - Preparar un informe de errores o una solicitud de asistencia
    - Depuración de bloqueos y reinicios del Gateway, presión de memoria o cargas útiles sobredimensionadas
    - Revisión de qué datos de diagnóstico se registran o se ocultan
summary: Crea paquetes de diagnóstico compartibles del Gateway para informes de errores
title: Exportación de diagnósticos
x-i18n:
    generated_at: "2026-07-11T23:04:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw puede crear un archivo `.zip` de diagnóstico local para informes de errores: estado, salud y registros saneados del Gateway, estructura de la configuración y eventos recientes de estabilidad sin cargas útiles.

Trata los paquetes de diagnóstico como secretos hasta que se revisen. Las cargas útiles y las credenciales se ocultan por diseño, pero el paquete sigue resumiendo los registros locales del Gateway y el estado de ejecución del host.

## Inicio rápido

```bash
openclaw gateway diagnostics export
```

Muestra la ruta del archivo zip generado. Para elegir una ruta de salida:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Para automatización:

```bash
openclaw gateway diagnostics export --json
```

## Comando de chat

Los propietarios pueden ejecutar `/diagnostics [note]` en cualquier conversación para solicitar una exportación local del Gateway como un único informe de soporte que se puede copiar y pegar:

1. Envía `/diagnostics`, opcionalmente con una nota breve (`/diagnostics mala elección de herramienta`).
2. OpenClaw envía un preámbulo y solicita una única aprobación explícita de ejecución, que ejecuta `openclaw gateway diagnostics export --json`. No apruebes los diagnósticos mediante una regla que permita todo.
3. Tras la aprobación, OpenClaw responde con la ruta local del paquete, un resumen del manifiesto, notas de privacidad y los identificadores de sesión pertinentes.

En los chats grupales, un propietario puede seguir ejecutando `/diagnostics`, pero OpenClaw envía de forma privada al propietario el resultado de la exportación, las solicitudes de aprobación y el desglose de sesiones e hilos de Codex. El grupo solo ve un aviso breve que indica que los diagnósticos se enviaron de forma privada. Si no existe una vía privada hacia el propietario, el comando se cierra de forma segura y le pide que lo ejecute desde un mensaje directo.

Cuando la sesión activa utiliza el entorno nativo de OpenAI Codex, la misma aprobación de ejecución también cubre el envío de comentarios a OpenAI para los hilos de Codex que OpenClaw conoce. Ese envío es independiente del archivo zip local del Gateway y solo se produce en sesiones del entorno de Codex. La solicitud de aprobación indica que aprobarla también envía comentarios de Codex, sin enumerar identificadores de sesiones ni de hilos de Codex. Tras la aprobación, la respuesta enumera los canales, los identificadores de sesión de OpenClaw, los identificadores de hilo de Codex y los comandos locales de reanudación de los hilos enviados a OpenAI. Rechazar o ignorar la aprobación omite la exportación, el envío de comentarios de Codex y la lista de identificadores de Codex.

Esto acorta el ciclo de depuración de Codex: detecta un comportamiento incorrecto en un canal, ejecuta `/diagnostics`, aprueba una vez, comparte el informe y, si quieres inspeccionar el hilo personalmente, ejecuta de forma local el comando `codex resume <thread-id>` mostrado. Consulta [Entorno de Codex](/es/plugins/codex-harness#inspect-codex-threads-locally).

## Contenido de la exportación

- `summary.md`: resumen legible para el equipo de soporte.
- `diagnostics.json`: resumen procesable por máquinas de la configuración, los registros, el estado, la salud y los datos de estabilidad.
- `manifest.json`: metadatos de la exportación y lista de archivos.
- Estructura saneada de la configuración y detalles no secretos de esta.
- Resúmenes saneados de los registros y líneas recientes de registro con datos ocultos.
- Instantáneas del estado y la salud del Gateway obtenidas con el mejor esfuerzo posible.
- `stability/latest.json`: paquete de estabilidad persistente más reciente, cuando esté disponible.

La exportación sigue siendo útil cuando el Gateway no está en buen estado: si fallan las solicitudes de estado o salud, se recopilan igualmente los registros locales, la estructura de la configuración y el paquete de estabilidad más reciente cuando están disponibles.

## Modelo de privacidad

Se conservan: nombres de subsistemas, identificadores de plugins, identificadores de proveedores, identificadores de canales, modos configurados, códigos de estado, duraciones, recuentos de bytes, estado de las colas, lecturas de memoria, metadatos saneados de los registros, mensajes operativos con datos ocultos, estructura de la configuración y ajustes no secretos de las funciones.

Se omiten o se ocultan: texto de chats, instrucciones para modelos, instrucciones, cuerpos de webhooks, salidas de herramientas, credenciales, claves de API, tokens, cookies, valores secretos, cuerpos sin procesar de solicitudes y respuestas, identificadores de cuentas, identificadores de mensajes, identificadores de sesión sin procesar, nombres de host y nombres de usuario locales.

Cuando un mensaje de registro parece contener texto de un usuario, chat, instrucción para un modelo o carga útil de una herramienta, la exportación solo conserva la indicación de que se omitió un mensaje y su recuento de bytes.

## Registrador de estabilidad

De forma predeterminada, el Gateway registra un flujo de estabilidad limitado y sin cargas útiles cuando los diagnósticos están activados. Captura datos operativos, no contenido.

El mismo Heartbeat también toma muestras de actividad cuando el bucle de eventos o la CPU parecen saturados y emite eventos `diagnostic.liveness.warning` con el retraso del bucle de eventos, su utilización, la proporción de núcleos de CPU, los recuentos de sesiones activas, en espera y en cola, la fase actual de inicio o ejecución (cuando se conoce), los intervalos de fases recientes y etiquetas de trabajo limitadas. Estos se convierten en líneas de registro de nivel `warn` del Gateway solo cuando hay trabajo en espera o en cola, o cuando el trabajo activo coincide con un retraso sostenido del bucle de eventos; en los demás casos, se registran con el nivel `debug`. Las muestras de actividad en reposo se siguen registrando como eventos de diagnóstico, pero nunca escalan por sí solas a una advertencia.

Las fases de inicio emiten eventos `diagnostic.phase.completed` con mediciones de tiempo de reloj y de CPU. Los diagnósticos de ejecuciones integradas bloqueadas establecen `terminalProgressStale=true` cuando el último progreso del puente parecía terminal (por ejemplo, un elemento de respuesta sin procesar o un evento de finalización de respuesta), pero el Gateway aún considera activa la ejecución integrada.

Inspecciona el registrador en directo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecciona el paquete persistente más reciente después de una salida fatal, un tiempo de espera agotado durante el apagado o un fallo de inicio tras un reinicio:

```bash
openclaw gateway stability --bundle latest
```

Crea un archivo zip de diagnóstico a partir del paquete persistente más reciente:

```bash
openclaw gateway stability --bundle latest --export
```

Los paquetes persistentes se almacenan en `~/.openclaw/logs/stability/` cuando existen eventos.

## Opciones útiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Opción                  | Valor predeterminado                                                           | Descripción                                                        |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Escribe en una ruta específica de archivo zip (o directorio).      |
| `--log-lines <count>`   | `5000`                                                                         | Número máximo de líneas de registro saneadas que se incluirán.     |
| `--log-bytes <bytes>`   | `1000000`                                                                      | Número máximo de bytes de registro que se inspeccionarán.          |
| `--url <url>`           | -                                                                              | URL de WebSocket del Gateway para instantáneas de estado y salud.  |
| `--token <token>`       | -                                                                              | Token del Gateway para instantáneas de estado y salud.             |
| `--password <password>` | -                                                                              | Contraseña del Gateway para instantáneas de estado y salud.        |
| `--timeout <ms>`        | `3000`                                                                         | Tiempo de espera de las instantáneas de estado y salud.            |
| `--no-stability-bundle` | desactivado                                                                    | Omite la búsqueda de paquetes de estabilidad persistentes.         |
| `--json`                | desactivado                                                                    | Muestra metadatos de exportación procesables por máquinas.         |

## Desactivar los diagnósticos

Los diagnósticos están activados de forma predeterminada. Para desactivar el registrador de estabilidad y la recopilación de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Desactivar los diagnósticos reduce el nivel de detalle de los informes de errores; no afecta al registro normal del Gateway.

Las instantáneas de presión crítica de memoria están desactivadas de forma predeterminada. Para capturar la instantánea de estabilidad previa a un agotamiento de memoria, además de los eventos normales de diagnóstico:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Úsalo solo en hosts que puedan tolerar el análisis adicional del sistema de archivos y la escritura de la instantánea durante una presión crítica de memoria. Los eventos normales de presión de memoria siguen registrando los datos de RSS, montón, umbral y crecimiento (`rss_threshold`, `heap_threshold`, `rss_growth`) cuando la instantánea está desactivada.

## Contenido relacionado

- [Comprobaciones de salud](/es/gateway/health)
- [CLI del Gateway](/es/cli/gateway#gateway-diagnostics-export)
- [Protocolo del Gateway](/es/gateway/protocol#rpc-method-families)
- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) - flujo independiente para transmitir diagnósticos a un recopilador
