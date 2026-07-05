---
read_when:
    - Preparar un informe de error o una solicitud de soporte
    - Depuración de bloqueos, reinicios, presión de memoria o cargas útiles sobredimensionadas del Gateway
    - Revisar qué datos de diagnóstico se registran o se redactan
summary: Crea paquetes de diagnóstico de Gateway compartibles para informes de errores
title: Exportación de diagnósticos
x-i18n:
    generated_at: "2026-07-05T11:18:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw puede crear un `.zip` de diagnóstico local para informes de errores: estado, salud, registros, forma de configuración y eventos recientes de estabilidad sin cargas útiles sanitizados del Gateway.

Trata los paquetes de diagnóstico como secretos hasta que se revisen. Las cargas útiles y las credenciales se redactan por diseño, pero el paquete aún resume los registros locales del Gateway y el estado de ejecución a nivel del host.

## Inicio rápido

```bash
openclaw gateway diagnostics export
```

Imprime la ruta del zip escrito. Elige una ruta de salida:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Para automatización:

```bash
openclaw gateway diagnostics export --json
```

## Comando de chat

Los propietarios pueden ejecutar `/diagnostics [note]` en cualquier conversación para solicitar una exportación local del Gateway como un informe de soporte que se puede copiar y pegar:

1. Envía `/diagnostics`, opcionalmente con una nota breve (`/diagnostics bad tool choice`).
2. OpenClaw envía un preámbulo y solicita una aprobación explícita de exec, que ejecuta `openclaw gateway diagnostics export --json`. No apruebes diagnósticos mediante una regla de permitir todo.
3. Tras la aprobación, OpenClaw responde con la ruta del paquete local, el resumen del manifiesto, notas de privacidad e ids de sesión relevantes.

En chats de grupo, un propietario aún puede ejecutar `/diagnostics`, pero OpenClaw envía el resultado de la exportación, las solicitudes de aprobación y el desglose de sesión/hilo de Codex al propietario en privado. El grupo solo ve un aviso breve de que los diagnósticos se enviaron en privado. Si no existe una ruta privada hacia el propietario, el comando falla de forma cerrada y pide al propietario que lo ejecute desde un DM.

Cuando la sesión activa usa el arnés nativo de OpenAI Codex, la misma aprobación de exec también cubre una carga de comentarios a OpenAI para los hilos de Codex que OpenClaw conoce. Esa carga es independiente del zip local del Gateway y solo ocurre para sesiones del arnés de Codex. La solicitud de aprobación indica que aprobar también envía comentarios de Codex, sin enumerar ids de sesión ni de hilo de Codex. Tras la aprobación, la respuesta enumera canales, ids de sesión de OpenClaw, ids de hilo de Codex y comandos locales de reanudación para los hilos que se enviaron a OpenAI. Denegar o ignorar la aprobación omite la exportación, la carga de comentarios de Codex y la lista de ids de Codex.

Eso hace que el ciclo de depuración de Codex sea corto: observa un mal comportamiento en un canal, ejecuta `/diagnostics`, aprueba una vez, comparte el informe y luego ejecuta localmente el comando `codex resume <thread-id>` impreso si quieres inspeccionar el hilo tú mismo. Consulta [arnés de Codex](/es/plugins/codex-harness#inspect-codex-threads-locally).

## Qué contiene la exportación

- `summary.md`: resumen legible para humanos para soporte.
- `diagnostics.json`: resumen legible por máquina de configuración, registros, estado, salud y datos de estabilidad.
- `manifest.json`: metadatos de exportación y lista de archivos.
- Forma de configuración sanitizada y detalles de configuración no secretos.
- Resúmenes de registros sanitizados y líneas de registro recientes redactadas.
- Instantáneas de mejor esfuerzo de estado y salud del Gateway.
- `stability/latest.json`: paquete de estabilidad persistido más reciente, cuando está disponible.

La exportación sigue siendo útil cuando el Gateway no está saludable: si las solicitudes de estado/salud fallan, se recopilan los registros locales, la forma de configuración y el paquete de estabilidad más reciente cuando están disponibles.

## Modelo de privacidad

Conservado: nombres de subsistemas, ids de plugins, ids de proveedores, ids de canales, modos configurados, códigos de estado, duraciones, recuentos de bytes, estado de cola, lecturas de memoria, metadatos de registro sanitizados, mensajes operativos redactados, forma de configuración y ajustes de funciones no secretos.

Omitido o redactado: texto de chat, prompts, instrucciones, cuerpos de webhook, salidas de herramientas, credenciales, claves de API, tokens, cookies, valores secretos, cuerpos sin procesar de solicitud/respuesta, ids de cuenta, ids de mensaje, ids de sesión sin procesar, nombres de host y nombres de usuario locales.

Cuando un mensaje de registro parece texto de usuario, chat, prompt o carga útil de herramienta, la exportación conserva solo que se omitió un mensaje y su recuento de bytes.

## Grabador de estabilidad

El Gateway registra por defecto un flujo de estabilidad acotado y sin cargas útiles cuando los diagnósticos están habilitados. Captura hechos operativos, no contenido.

El mismo heartbeat también muestrea la actividad cuando el bucle de eventos o la CPU parecen saturados, emitiendo eventos `diagnostic.liveness.warning` con retraso del bucle de eventos, utilización del bucle de eventos, proporción de núcleos de CPU, recuentos de sesiones activas/en espera/en cola, la fase actual de inicio/ejecución (cuando se conoce), intervalos de fase recientes y etiquetas de trabajo acotadas. Estos se convierten en líneas de registro de nivel `warn` del Gateway solo cuando hay trabajo en espera o en cola, o cuando el trabajo activo se superpone con un retraso sostenido del bucle de eventos; de lo contrario, se registran en `debug`. Las muestras de actividad en reposo aún se registran como eventos de diagnóstico, pero nunca escalan por sí solas a una advertencia.

Las fases de inicio emiten eventos `diagnostic.phase.completed` con tiempos de reloj y CPU. Los diagnósticos de ejecución incrustada bloqueada marcan `terminalProgressStale=true` cuando el último progreso del puente parecía terminal (por ejemplo, un elemento de respuesta sin procesar o un evento de finalización de respuesta), pero el Gateway todavía considera activa la ejecución incrustada.

Inspecciona el grabador en vivo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecciona el paquete persistido más reciente después de una salida fatal, un tiempo de espera de apagado o un fallo de inicio por reinicio:

```bash
openclaw gateway stability --bundle latest
```

Crea un zip de diagnóstico a partir del paquete persistido más reciente:

```bash
openclaw gateway stability --bundle latest --export
```

Los paquetes persistidos viven bajo `~/.openclaw/logs/stability/` cuando existen eventos.

## Opciones útiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Marca                   | Predeterminado                                                               | Descripción                                                  |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Escribe en una ruta zip específica (o directorio).           |
| `--log-lines <count>`   | `5000`                                                                        | Máximo de líneas de registro sanitizadas que incluir.        |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Máximo de bytes de registro que inspeccionar.                |
| `--url <url>`           | -                                                                             | URL WebSocket del Gateway para instantáneas de estado/salud. |
| `--token <token>`       | -                                                                             | Token del Gateway para instantáneas de estado/salud.         |
| `--password <password>` | -                                                                             | Contraseña del Gateway para instantáneas de estado/salud.    |
| `--timeout <ms>`        | `3000`                                                                        | Tiempo de espera de instantáneas de estado/salud.            |
| `--no-stability-bundle` | off                                                                           | Omite la búsqueda de paquetes de estabilidad persistidos.    |
| `--json`                | off                                                                           | Imprime metadatos de exportación legibles por máquina.       |

## Deshabilitar diagnósticos

Los diagnósticos están habilitados por defecto. Para deshabilitar el grabador de estabilidad y la recopilación de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Deshabilitar los diagnósticos reduce el detalle de los informes de errores; no afecta al registro normal del Gateway.

Las instantáneas de presión crítica de memoria están desactivadas por defecto. Para capturar la instantánea de estabilidad previa al OOM además de los eventos normales de diagnóstico:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Usa esto solo en hosts que puedan tolerar el escaneo adicional del sistema de archivos y la escritura de instantáneas durante presión crítica de memoria. Los eventos normales de presión de memoria siguen registrando RSS, heap, umbral y datos de crecimiento (`rss_threshold`, `heap_threshold`, `rss_growth`) cuando la instantánea está desactivada.

## Relacionado

- [Comprobaciones de salud](/es/gateway/health)
- [CLI del Gateway](/es/cli/gateway#gateway-diagnostics-export)
- [Protocolo del Gateway](/es/gateway/protocol#rpc-method-families)
- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) - flujo separado para transmitir diagnósticos a un recopilador
