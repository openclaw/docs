---
read_when:
    - Preparar un informe de error o una solicitud de soporte
    - Depuración de fallos del Gateway, reinicios, presión de memoria o cargas útiles sobredimensionadas
    - Revisar qué datos de diagnóstico se registran o se ocultan
summary: Crear paquetes de diagnóstico de Gateway compartibles para informes de errores
title: Exportación de diagnósticos
x-i18n:
    generated_at: "2026-04-30T05:40:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw puede crear un zip de diagnóstico local para informes de errores. Combina
estado, salud, registros, forma de configuración y eventos recientes de
estabilidad sin carga útil del Gateway saneados.

Trata los paquetes de diagnóstico como secretos hasta que los hayas revisado. Están
diseñados para omitir o censurar cargas útiles y credenciales, pero aun así resumen
registros locales del Gateway y el estado de ejecución a nivel de host.

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
copiable y pegable para soporte:

1. Envía `/diagnostics` en la conversación donde notaste el problema. Agrega una
   nota corta si ayuda, por ejemplo `/diagnostics bad tool choice`.
2. OpenClaw envía el preámbulo de diagnóstico y solicita una aprobación explícita
   de ejecución. La aprobación ejecuta `openclaw gateway diagnostics export --json`.
   No apruebes diagnósticos mediante una regla de permitir todo.
3. Tras la aprobación, OpenClaw responde con un informe pegable que contiene la ruta
   del paquete local, el resumen del manifiesto, notas de privacidad e ids de sesión relevantes.

En chats grupales, un propietario todavía puede ejecutar `/diagnostics`, pero OpenClaw no
publica los detalles de diagnóstico en el chat compartido. Envía el preámbulo,
las solicitudes de aprobación, el resultado de exportación del Gateway y el desglose de sesión/hilo de Codex al
propietario mediante la ruta privada de aprobación. El grupo solo recibe un aviso breve
de que el flujo de diagnóstico se envió en privado. Si OpenClaw no puede encontrar una ruta privada
para el propietario, el comando falla cerrado y pide al propietario que lo ejecute desde un DM.

Cuando la sesión activa de OpenClaw usa el arnés nativo de OpenAI Codex,
la misma aprobación de ejecución también cubre una carga de comentarios a OpenAI para los hilos de ejecución de Codex
que OpenClaw conoce. Esa carga es independiente del zip local del
Gateway y aparece solo para sesiones del arnés de Codex. Antes de la aprobación, el
mensaje explica que aprobar los diagnósticos también enviará comentarios de Codex, pero
no enumera ids de sesión ni de hilo de Codex. Tras la aprobación, la respuesta del chat enumera
los canales, ids de sesión de OpenClaw, ids de hilo de Codex y comandos locales de reanudación
para los hilos que se enviaron a servidores de OpenAI. Si deniegas o ignoras la
aprobación, OpenClaw no ejecuta la exportación, no envía comentarios de Codex y
no imprime los ids de Codex.

Eso hace que el ciclo común de depuración de Codex sea corto: nota el comportamiento incorrecto en
Telegram, Discord u otro canal, ejecuta `/diagnostics`, aprueba una vez, comparte
el informe con soporte y luego ejecuta localmente el comando `codex resume <thread-id>`
impreso si quieres inspeccionar tú mismo el hilo nativo de Codex. Consulta
[Arnés de Codex](/es/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) para
ese flujo de inspección.

## Qué contiene la exportación

El zip incluye:

- `summary.md`: resumen legible por humanos para soporte.
- `diagnostics.json`: resumen legible por máquina de configuración, registros, estado, salud
  y datos de estabilidad.
- `manifest.json`: metadatos de exportación y lista de archivos.
- Forma de configuración saneada y detalles de configuración no secretos.
- Resúmenes de registros saneados y líneas de registro recientes censuradas.
- Instantáneas de estado y salud del Gateway con el mejor esfuerzo.
- `stability/latest.json`: paquete de estabilidad persistido más reciente, cuando esté disponible.

La exportación es útil incluso cuando el Gateway no está saludable. Si el Gateway no puede
responder solicitudes de estado o salud, los registros locales, la forma de configuración y el
paquete de estabilidad más reciente se recopilan igualmente cuando están disponibles.

## Modelo de privacidad

Los diagnósticos están diseñados para poder compartirse. La exportación conserva datos operativos
que ayudan a depurar, como:

- nombres de subsistemas, ids de plugin, ids de proveedor, ids de canal y modos configurados
- códigos de estado, duraciones, recuentos de bytes, estado de cola y lecturas de memoria
- metadatos de registros saneados y mensajes operativos censurados
- forma de configuración y ajustes de funciones no secretos

La exportación omite o censura:

- texto de chat, prompts, instrucciones, cuerpos de webhook y salidas de herramientas
- credenciales, claves de API, tokens, cookies y valores secretos
- cuerpos sin procesar de solicitudes o respuestas
- ids de cuenta, ids de mensaje, ids de sesión sin procesar, nombres de host y nombres de usuario locales

Cuando un mensaje de registro parece texto de usuario, chat, prompt o carga útil de herramienta, la
exportación conserva solo que se omitió un mensaje y el recuento de bytes.

## Grabador de estabilidad

El Gateway registra de forma predeterminada un flujo de estabilidad acotado y sin carga útil cuando
los diagnósticos están habilitados. Es para hechos operativos, no para contenido.

El mismo Heartbeat diagnóstico registra advertencias de actividad cuando el Gateway sigue
ejecutándose pero el bucle de eventos de Node.js o la CPU parecen saturados. Estos eventos
`diagnostic.liveness.warning` incluyen retraso del bucle de eventos, utilización del bucle de eventos,
proporción de núcleos de CPU y recuentos de sesiones activas/en espera/en cola. No
reinician el Gateway por sí mismos.

Inspecciona el grabador en vivo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecciona el paquete de estabilidad persistido más reciente tras una salida fatal, un tiempo de espera
de apagado o una falla de inicio tras reinicio:

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

- `--output <path>`: escribe en una ruta de zip específica.
- `--log-lines <count>`: cantidad máxima de líneas de registro saneadas que incluir.
- `--log-bytes <bytes>`: cantidad máxima de bytes de registro que inspeccionar.
- `--url <url>`: URL WebSocket del Gateway para instantáneas de estado y salud.
- `--token <token>`: token del Gateway para instantáneas de estado y salud.
- `--password <password>`: contraseña del Gateway para instantáneas de estado y salud.
- `--timeout <ms>`: tiempo de espera de instantáneas de estado y salud.
- `--no-stability-bundle`: omite la búsqueda de paquetes de estabilidad persistidos.
- `--json`: imprime metadatos de exportación legibles por máquina.

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

Deshabilitar los diagnósticos reduce el detalle de los informes de errores. No afecta el registro normal
del Gateway.

## Relacionado

- [Comprobaciones de salud](/es/gateway/health)
- [CLI del Gateway](/es/cli/gateway#gateway-diagnostics-export)
- [Protocolo del Gateway](/es/gateway/protocol#system-and-identity)
- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — flujo independiente para transmitir diagnósticos a un recopilador
