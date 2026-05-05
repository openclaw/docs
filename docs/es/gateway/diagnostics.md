---
read_when:
    - Preparar un informe de error o una solicitud de soporte
    - Depuración de fallos del Gateway, reinicios, presión de memoria o cargas útiles sobredimensionadas
    - Revisar qué datos de diagnóstico se registran o se enmascaran
summary: Crea paquetes de diagnóstico de Gateway que se puedan compartir para informes de errores
title: Exportación de diagnósticos
x-i18n:
    generated_at: "2026-05-05T01:46:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56539280bc7a7868063328626e63b2576feb5578e2651d3a2976ee9c34243382
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw puede crear un zip de diagnóstico local para informes de errores. Combina
estado del Gateway saneado, salud, registros, forma de configuración y eventos
recientes de estabilidad sin payload.

Trata los paquetes de diagnóstico como secretos hasta que los hayas revisado. Están
diseñados para omitir o redactar payloads y credenciales, pero aun así resumen
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

Los propietarios pueden usar `/diagnostics [note]` en el chat para solicitar una exportación local del Gateway.
Úsalo cuando el error haya ocurrido en una conversación real y quieras un informe
que se pueda copiar y pegar para soporte:

1. Envía `/diagnostics` en la conversación donde notaste el problema. Añade una
   nota breve si ayuda, por ejemplo `/diagnostics bad tool choice`.
2. OpenClaw envía el preámbulo de diagnóstico y solicita una aprobación explícita
   de ejecución. La aprobación ejecuta `openclaw gateway diagnostics export --json`.
   No apruebes diagnósticos mediante una regla de permitir todo.
3. Tras la aprobación, OpenClaw responde con un informe pegable que contiene la
   ruta del paquete local, el resumen del manifiesto, notas de privacidad e IDs de sesión relevantes.

En chats grupales, un propietario aún puede ejecutar `/diagnostics`, pero OpenClaw no
publica los detalles de diagnóstico de vuelta en el chat compartido. Envía el preámbulo,
las solicitudes de aprobación, el resultado de la exportación del Gateway y el desglose de sesión/hilo de Codex
al propietario mediante la ruta privada de aprobación. El grupo solo recibe un aviso breve
de que el flujo de diagnóstico se envió en privado. Si OpenClaw no puede encontrar una ruta privada
al propietario, el comando falla de forma cerrada y pide al propietario ejecutarlo desde un DM.

Cuando la sesión activa de OpenClaw usa el arnés nativo de OpenAI Codex,
la misma aprobación de ejecución también cubre una carga de feedback de OpenAI para los hilos de ejecución de Codex
que OpenClaw conoce. Esa carga es independiente del zip local del Gateway
y aparece solo para sesiones del arnés de Codex. Antes de la aprobación, el
mensaje explica que aprobar los diagnósticos también enviará feedback de Codex, pero
no lista IDs de sesión o hilo de Codex. Tras la aprobación, la respuesta del chat lista
los canales, IDs de sesión de OpenClaw, IDs de hilo de Codex y comandos locales de reanudación
para los hilos enviados a servidores de OpenAI. Si deniegas o ignoras la
aprobación, OpenClaw no ejecuta la exportación, no envía feedback de Codex y
no imprime los IDs de Codex.

Eso acorta el ciclo común de depuración de Codex: observa el mal comportamiento en
Telegram, Discord u otro canal, ejecuta `/diagnostics`, aprueba una vez, comparte
el informe con soporte y luego ejecuta localmente el comando impreso `codex resume <thread-id>`
si quieres inspeccionar por tu cuenta el hilo nativo de Codex. Consulta
[arnés de Codex](/es/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) para
ese flujo de inspección.

## Qué contiene la exportación

El zip incluye:

- `summary.md`: vista general legible por humanos para soporte.
- `diagnostics.json`: resumen legible por máquina de configuración, registros, estado, salud
  y datos de estabilidad.
- `manifest.json`: metadatos de exportación y lista de archivos.
- Forma de configuración saneada y detalles de configuración no secretos.
- Resúmenes de registros saneados y líneas recientes de registro redactadas.
- Instantáneas de mejor esfuerzo del estado y la salud del Gateway.
- `stability/latest.json`: paquete de estabilidad persistido más reciente, cuando esté disponible.

La exportación es útil incluso cuando el Gateway no está saludable. Si el Gateway no puede
responder solicitudes de estado o salud, los registros locales, la forma de configuración y el paquete
de estabilidad más reciente se recopilan igualmente cuando están disponibles.

## Modelo de privacidad

Los diagnósticos están diseñados para poder compartirse. La exportación conserva datos operativos
que ayudan a depurar, como:

- nombres de subsistema, identificadores de Plugin, identificadores de proveedor, identificadores de canal y modos configurados
- códigos de estado, duraciones, recuentos de bytes, estado de cola y lecturas de memoria
- metadatos de registro saneados y mensajes operativos redactados
- forma de configuración y ajustes no secretos de características

La exportación omite o redacta:

- texto de chat, prompts, instrucciones, cuerpos de Webhook y salidas de herramientas
- credenciales, claves de API, tokens, cookies y valores secretos
- cuerpos sin procesar de solicitud o respuesta
- identificadores de cuenta, identificadores de mensaje, identificadores sin procesar de sesión, nombres de host y nombres de usuario locales

Cuando un mensaje de registro parece texto de usuario, chat, prompt o payload de herramienta, la
exportación conserva solo que se omitió un mensaje y el recuento de bytes.

## Registrador de estabilidad

El Gateway registra de forma predeterminada un flujo de estabilidad acotado y sin payload cuando
los diagnósticos están habilitados. Es para hechos operativos, no para contenido.

El mismo Heartbeat de diagnóstico registra muestras de vivacidad cuando el Gateway sigue
ejecutándose pero el bucle de eventos de Node.js o la CPU parecen saturados. Estos eventos
`diagnostic.liveness.warning` incluyen retardo del bucle de eventos, utilización del bucle de eventos,
relación de núcleos de CPU, recuentos de sesiones activas/en espera/en cola, la fase actual
de inicio/ejecución cuando se conoce, tramos de fase recientes y etiquetas acotadas de trabajo activo/en cola.
Las muestras inactivas permanecen en telemetría en nivel `info`. Las muestras de vivacidad
se convierten en advertencias del Gateway solo cuando hay trabajo en espera o en cola, o cuando el trabajo activo
se solapa con un retardo sostenido del bucle de eventos. Los picos transitorios de retardo máximo durante
trabajo en segundo plano por lo demás saludable permanecen en los registros de depuración. No reinician el
Gateway por sí solos.

Las fases de inicio también emiten eventos `diagnostic.phase.completed` con tiempos de reloj real y
CPU. Los diagnósticos de ejecución incrustada atascada marcan `terminalProgressStale=true`
cuando el último progreso del puente parecía terminal, como un elemento de respuesta sin procesar o un
evento de finalización de respuesta, pero el Gateway aún considera activa la ejecución incrustada.

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

- `--output <path>`: escribe en una ruta zip específica.
- `--log-lines <count>`: máximo de líneas de registro saneadas que se incluirán.
- `--log-bytes <bytes>`: máximo de bytes de registro que se inspeccionarán.
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

Deshabilitar los diagnósticos reduce el detalle de los informes de error. No afecta el registro normal
del Gateway.

## Relacionado

- [Comprobaciones de salud](/es/gateway/health)
- [CLI del Gateway](/es/cli/gateway#gateway-diagnostics-export)
- [Protocolo del Gateway](/es/gateway/protocol#system-and-identity)
- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — flujo independiente para transmitir diagnósticos a un recopilador
