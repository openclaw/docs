---
read_when:
    - Preparar un informe de error o una solicitud de soporte
    - Depuración de fallos, reinicios, presión de memoria o cargas útiles sobredimensionadas del Gateway
    - Revisar qué datos de diagnóstico se registran o se ocultan
summary: Crear paquetes de diagnóstico de Gateway que se puedan compartir para informes de errores
title: Exportación de diagnósticos
x-i18n:
    generated_at: "2026-05-03T21:32:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw puede crear un zip de diagnósticos local para informes de errores. Combina
estado, salud, registros, forma de configuración y eventos recientes de
estabilidad sin cargas útiles del Gateway, todo sanitizado.

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

Los propietarios pueden usar `/diagnostics [note]` en el chat para solicitar una exportación local del Gateway.
Usa esto cuando el error ocurrió en una conversación real y quieres un informe
que se pueda copiar y pegar para soporte:

1. Envía `/diagnostics` en la conversación donde notaste el problema. Agrega una
   nota breve si ayuda, por ejemplo `/diagnostics bad tool choice`.
2. OpenClaw envía el preámbulo de diagnósticos y solicita una aprobación explícita
   de ejecución. La aprobación ejecuta `openclaw gateway diagnostics export --json`.
   No apruebes diagnósticos mediante una regla de permitir todo.
3. Después de la aprobación, OpenClaw responde con un informe pegable que contiene la ruta
   del paquete local, el resumen del manifiesto, notas de privacidad e ids de sesión relevantes.

En chats grupales, un propietario aún puede ejecutar `/diagnostics`, pero OpenClaw no
publica los detalles de diagnóstico de vuelta en el chat compartido. Envía el preámbulo,
las solicitudes de aprobación, el resultado de exportación del Gateway y el desglose de sesión/hilo de Codex
al propietario mediante la ruta privada de aprobación. El grupo solo recibe un aviso breve
de que el flujo de diagnósticos se envió de forma privada. Si OpenClaw no puede encontrar una ruta privada
del propietario, el comando falla de forma cerrada y pide al propietario que lo ejecute desde un DM.

Cuando la sesión activa de OpenClaw usa el arnés nativo de OpenAI Codex,
la misma aprobación de ejecución también cubre una carga de comentarios de OpenAI para los hilos
del tiempo de ejecución de Codex que OpenClaw conoce. Esa carga está separada del zip local
del Gateway y aparece solo para sesiones con arnés de Codex. Antes de la aprobación, el
aviso explica que aprobar los diagnósticos también enviará comentarios de Codex, pero no
lista ids de sesión o hilo de Codex. Después de la aprobación, la respuesta del chat lista
los canales, los ids de sesión de OpenClaw, los ids de hilo de Codex y los comandos locales de reanudación
para los hilos que se enviaron a servidores de OpenAI. Si rechazas o ignoras la
aprobación, OpenClaw no ejecuta la exportación, no envía comentarios de Codex y
no imprime los ids de Codex.

Eso acorta el bucle común de depuración de Codex: nota el comportamiento incorrecto en
Telegram, Discord u otro canal, ejecuta `/diagnostics`, aprueba una vez, comparte
el informe con soporte y luego ejecuta localmente el comando impreso `codex resume <thread-id>`
si quieres inspeccionar el hilo nativo de Codex tú mismo. Consulta
[arnés de Codex](/es/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) para
ese flujo de inspección.

## Qué contiene la exportación

El zip incluye:

- `summary.md`: resumen legible por humanos para soporte.
- `diagnostics.json`: resumen legible por máquina de configuración, registros, estado, salud
  y datos de estabilidad.
- `manifest.json`: metadatos de exportación y lista de archivos.
- Forma de configuración sanitizada y detalles de configuración no secretos.
- Resúmenes de registros sanitizados y líneas recientes de registro redactadas.
- Instantáneas de estado y salud del Gateway con el mejor esfuerzo.
- `stability/latest.json`: paquete de estabilidad persistido más reciente, cuando esté disponible.

La exportación es útil incluso cuando el Gateway no está saludable. Si el Gateway no puede
responder solicitudes de estado o salud, los registros locales, la forma de configuración y el paquete
de estabilidad más reciente se recopilan de todos modos cuando están disponibles.

## Modelo de privacidad

Los diagnósticos están diseñados para poder compartirse. La exportación conserva datos operativos
que ayudan a depurar, como:

- nombres de subsistemas, ids de plugins, ids de proveedores, ids de canales y modos configurados
- códigos de estado, duraciones, recuentos de bytes, estado de cola y lecturas de memoria
- metadatos de registro sanitizados y mensajes operativos redactados
- forma de configuración y ajustes de funciones no secretos

La exportación omite o redacta:

- texto de chat, prompts, instrucciones, cuerpos de webhook y salidas de herramientas
- credenciales, claves de API, tokens, cookies y valores secretos
- cuerpos sin procesar de solicitud o respuesta
- ids de cuenta, ids de mensaje, ids de sesión sin procesar, nombres de host y nombres de usuario locales

Cuando un mensaje de registro parece texto de usuario, chat, prompt o carga útil de herramienta, la
exportación conserva solo que se omitió un mensaje y el recuento de bytes.

## Grabador de estabilidad

El Gateway registra de forma predeterminada un flujo de estabilidad acotado y sin cargas útiles cuando
los diagnósticos están habilitados. Es para hechos operativos, no para contenido.

El mismo Heartbeat de diagnóstico registra muestras de actividad cuando el Gateway sigue
ejecutándose pero el bucle de eventos de Node.js o la CPU parecen saturados. Estos eventos
`diagnostic.liveness.warning` incluyen retardo del bucle de eventos, utilización del bucle de eventos,
proporción de núcleos de CPU y recuentos de sesiones activas/en espera/en cola. Las muestras inactivas
permanecen en la telemetría en nivel `info`. Las muestras de actividad se convierten en advertencias del Gateway
solo cuando hay trabajo en espera o en cola, o cuando el trabajo activo se superpone con
un retardo sostenido del bucle de eventos. Los picos transitorios de retardo máximo durante trabajo de fondo
por lo demás saludable permanecen en los registros de depuración. No reinician el Gateway por
sí solos.

Inspecciona el grabador en vivo:

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

Crea un zip de diagnósticos desde el paquete persistido más reciente:

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

- `--output <path>`: escribir en una ruta de zip específica.
- `--log-lines <count>`: máximo de líneas de registro sanitizadas que se incluirán.
- `--log-bytes <bytes>`: máximo de bytes de registro que se inspeccionarán.
- `--url <url>`: URL WebSocket del Gateway para instantáneas de estado y salud.
- `--token <token>`: token del Gateway para instantáneas de estado y salud.
- `--password <password>`: contraseña del Gateway para instantáneas de estado y salud.
- `--timeout <ms>`: tiempo de espera de instantáneas de estado y salud.
- `--no-stability-bundle`: omitir la búsqueda de paquete de estabilidad persistido.
- `--json`: imprimir metadatos de exportación legibles por máquina.

## Deshabilitar diagnósticos

Los diagnósticos están habilitados de forma predeterminada. Para deshabilitar el grabador de estabilidad y
la recopilación de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Deshabilitar los diagnósticos reduce el detalle del informe de errores. No afecta el registro normal
del Gateway.

## Relacionado

- [Comprobaciones de salud](/es/gateway/health)
- [CLI del Gateway](/es/cli/gateway#gateway-diagnostics-export)
- [Protocolo del Gateway](/es/gateway/protocol#system-and-identity)
- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — flujo separado para transmitir diagnósticos a un recopilador
