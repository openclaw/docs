---
read_when:
    - Preparar un informe de error o una solicitud de soporte
    - Depuración de fallos del Gateway, reinicios, presión de memoria o cargas útiles de tamaño excesivo
    - Revisión de qué datos de diagnóstico se registran o se ocultan
summary: Crear paquetes de diagnóstico de Gateway compartibles para informes de errores
title: Exportación de diagnósticos
x-i18n:
    generated_at: "2026-05-11T20:35:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw puede crear un archivo zip de diagnóstico local para informes de errores. Combina
estado del Gateway depurado, salud, registros, forma de configuración y eventos recientes
de estabilidad sin cargas útiles.

Trata los paquetes de diagnóstico como secretos hasta que los hayas revisado. Están
diseñados para omitir o redactar cargas útiles y credenciales, pero aun así resumen
registros locales del Gateway y estado de ejecución a nivel del host.

## Inicio rápido

```bash
openclaw gateway diagnostics export
```

El comando imprime la ruta del zip escrito. Para elegir una ruta:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Para automatización:

```bash
openclaw gateway diagnostics export --json
```

## Comando de chat

Los propietarios pueden usar `/diagnostics [nota]` en el chat para solicitar una exportación
local del Gateway. Úsalo cuando el error haya ocurrido en una conversación real y quieras
un informe para soporte que se pueda copiar y pegar:

1. Envía `/diagnostics` en la conversación donde notaste el problema. Agrega una
   nota breve si ayuda, por ejemplo `/diagnostics bad tool choice`.
2. OpenClaw envía el preámbulo de diagnóstico y solicita una aprobación explícita
   de ejecución. La aprobación ejecuta `openclaw gateway diagnostics export --json`.
   No apruebes diagnósticos mediante una regla que permita todo.
3. Después de la aprobación, OpenClaw responde con un informe pegable que contiene la
   ruta local del paquete, resumen del manifiesto, notas de privacidad e ids de sesión
   relevantes.

En chats grupales, un propietario aún puede ejecutar `/diagnostics`, pero OpenClaw no
publica los detalles de diagnóstico de vuelta en el chat compartido. Envía el preámbulo,
solicitudes de aprobación, resultado de exportación del Gateway y desglose de sesión/hilo
de Codex al propietario mediante la ruta privada de aprobación. El grupo solo recibe un aviso
breve de que el flujo de diagnóstico se envió en privado. Si OpenClaw no puede encontrar una ruta
privada hacia el propietario, el comando falla de forma cerrada y pide al propietario que lo ejecute desde un MD.

Cuando la sesión activa de OpenClaw usa el arnés nativo OpenAI Codex,
la misma aprobación de ejecución también cubre una carga de comentarios a OpenAI para los hilos
del entorno de ejecución de Codex que OpenClaw conoce. Esa carga es independiente del zip local del
Gateway y aparece solo para sesiones con el arnés de Codex. Antes de la aprobación, el
mensaje explica que aprobar diagnósticos también enviará comentarios de Codex, pero no
enumera ids de sesión ni de hilo de Codex. Después de la aprobación, la respuesta del chat enumera
los canales, ids de sesión de OpenClaw, ids de hilo de Codex y comandos locales de reanudación
para los hilos que se enviaron a los servidores de OpenAI. Si rechazas o ignoras la
aprobación, OpenClaw no ejecuta la exportación, no envía comentarios de Codex y
no imprime los ids de Codex.

Eso hace que el ciclo habitual de depuración de Codex sea corto: notar el comportamiento incorrecto en
Telegram, Discord u otro canal, ejecutar `/diagnostics`, aprobar una vez, compartir
el informe con soporte y luego ejecutar localmente el comando `codex resume <thread-id>` impreso
si quieres inspeccionar el hilo nativo de Codex por tu cuenta. Consulta
[Arnés de Codex](/es/plugins/codex-harness#inspect-codex-threads-locally) para
ese flujo de inspección.

## Qué contiene la exportación

El zip incluye:

- `summary.md`: resumen legible por humanos para soporte.
- `diagnostics.json`: resumen legible por máquina de configuración, registros, estado, salud
  y datos de estabilidad.
- `manifest.json`: metadatos de exportación y lista de archivos.
- Forma de configuración depurada y detalles de configuración no secretos.
- Resúmenes de registros depurados y líneas recientes de registro redactadas.
- Instantáneas de mejor esfuerzo de estado y salud del Gateway.
- `stability/latest.json`: paquete de estabilidad persistido más reciente, cuando esté disponible.

La exportación es útil incluso cuando el Gateway no está saludable. Si el Gateway no puede
responder solicitudes de estado o salud, los registros locales, la forma de configuración y el
paquete de estabilidad más reciente aún se recopilan cuando están disponibles.

## Modelo de privacidad

Los diagnósticos están diseñados para poder compartirse. La exportación conserva datos operativos
que ayudan a depurar, como:

- nombres de subsistemas, ids de plugin, ids de proveedor, ids de canal y modos configurados
- códigos de estado, duraciones, recuentos de bytes, estado de cola y lecturas de memoria
- metadatos de registro depurados y mensajes operativos redactados
- forma de configuración y ajustes de funciones no secretos

La exportación omite o redacta:

- texto de chat, prompts, instrucciones, cuerpos de Webhook y salidas de herramientas
- credenciales, claves de API, tokens, cookies y valores secretos
- cuerpos sin procesar de solicitudes o respuestas
- ids de cuenta, ids de mensaje, ids de sesión sin procesar, nombres de host y nombres de usuario locales

Cuando un mensaje de registro parece texto de usuario, chat, prompt o carga útil de herramienta, la
exportación conserva solo que se omitió un mensaje y el recuento de bytes.

## Registrador de estabilidad

El Gateway registra de forma predeterminada un flujo de estabilidad acotado y sin cargas útiles cuando
los diagnósticos están habilitados. Es para hechos operativos, no para contenido.

El mismo Heartbeat de diagnóstico registra muestras de vivacidad cuando el Gateway sigue
ejecutándose pero el bucle de eventos de Node.js o la CPU parecen saturados. Estos eventos
`diagnostic.liveness.warning` incluyen demora del bucle de eventos, utilización del bucle de eventos,
proporción de núcleos de CPU, recuentos de sesiones activas/en espera/en cola, la fase actual
de inicio/ejecución cuando se conoce, intervalos de fase recientes y etiquetas acotadas de
trabajo activo/en cola. Las muestras inactivas permanecen en telemetría en nivel `info`. Las muestras de vivacidad
se convierten en advertencias del Gateway solo cuando hay trabajo esperando o en cola, o cuando el trabajo activo
se solapa con demora sostenida del bucle de eventos. Los picos transitorios de demora máxima durante
trabajo en segundo plano por lo demás saludable permanecen en los registros de depuración. No reinician el
Gateway por sí solos.

Las fases de inicio también emiten eventos `diagnostic.phase.completed` con temporización de reloj de pared y
CPU. Los diagnósticos de ejecución incrustada atascada marcan `terminalProgressStale=true`
cuando el último progreso del puente parecía terminal, como un elemento de respuesta sin procesar o
un evento de finalización de respuesta, pero el Gateway aún considera activa la ejecución incrustada.

Inspecciona el registrador en vivo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecciona el paquete de estabilidad persistido más reciente después de una salida fatal, tiempo de espera
de apagado o fallo de inicio tras reinicio:

```bash
openclaw gateway stability --bundle latest
```

Crea un zip de diagnóstico desde el paquete persistido más reciente:

```bash
openclaw gateway stability --bundle latest --export
```

Los paquetes persistidos se encuentran en `~/.openclaw/logs/stability/` cuando existen eventos.

## Opciones útiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: escribe en una ruta de zip específica.
- `--log-lines <count>`: máximo de líneas de registro depuradas que incluir.
- `--log-bytes <bytes>`: máximo de bytes de registro que inspeccionar.
- `--url <url>`: URL WebSocket del Gateway para instantáneas de estado y salud.
- `--token <token>`: token del Gateway para instantáneas de estado y salud.
- `--password <password>`: contraseña del Gateway para instantáneas de estado y salud.
- `--timeout <ms>`: tiempo de espera de instantáneas de estado y salud.
- `--no-stability-bundle`: omite la búsqueda de paquetes de estabilidad persistidos.
- `--json`: imprime metadatos de exportación legibles por máquina.

## Deshabilitar diagnósticos

Los diagnósticos están habilitados de forma predeterminada. Para deshabilitar el registrador de estabilidad y
la recopilación de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Deshabilitar los diagnósticos reduce el detalle de los informes de errores. No afecta el registro normal
del Gateway.

## Relacionado

- [Comprobaciones de salud](/es/gateway/health)
- [CLI del Gateway](/es/cli/gateway#gateway-diagnostics-export)
- [Protocolo del Gateway](/es/gateway/protocol#system-and-identity)
- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — flujo separado para transmitir diagnósticos a un recopilador
