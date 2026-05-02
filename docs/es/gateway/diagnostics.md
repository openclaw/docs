---
read_when:
    - Preparar un informe de error o una solicitud de soporte
    - Depuración de fallos del Gateway, reinicios, presión de memoria o cargas útiles demasiado grandes
    - Revisar qué datos de diagnóstico se registran o se ocultan
summary: Crea paquetes de diagnóstico de Gateway compartibles para informes de errores
title: Exportación de diagnósticos
x-i18n:
    generated_at: "2026-05-02T05:25:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw puede crear un zip local de diagnóstico para informes de errores. Combina
estado, salud, registros, forma de configuración y eventos recientes de
estabilidad sin cargas útiles del Gateway, todo sanitizado.

Trata los paquetes de diagnóstico como secretos hasta que los hayas revisado.
Están diseñados para omitir o censurar cargas útiles y credenciales, pero aun así
resumen los registros locales del Gateway y el estado de tiempo de ejecución a
nivel del host.

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
Úsalo cuando el error haya ocurrido en una conversación real y quieras un
informe que se pueda copiar y pegar para soporte:

1. Envía `/diagnostics` en la conversación donde notaste el problema. Añade una
   nota breve si ayuda, por ejemplo `/diagnostics bad tool choice`.
2. OpenClaw envía el preámbulo de diagnóstico y solicita una aprobación explícita
   de ejecución. La aprobación ejecuta `openclaw gateway diagnostics export --json`.
   No apruebes diagnósticos mediante una regla de permitir todo.
3. Después de la aprobación, OpenClaw responde con un informe pegable que contiene la ruta local
   del paquete, el resumen del manifiesto, notas de privacidad e ids de sesión relevantes.

En chats de grupo, un propietario aún puede ejecutar `/diagnostics`, pero OpenClaw no
publica los detalles de diagnóstico de vuelta en el chat compartido. Envía el preámbulo,
las solicitudes de aprobación, el resultado de exportación del Gateway y el desglose de sesión/hilo de Codex
al propietario mediante la ruta privada de aprobación. El grupo solo recibe un aviso breve
de que el flujo de diagnóstico se envió en privado. Si OpenClaw no puede encontrar una ruta privada
hacia el propietario, el comando falla de forma cerrada y pide al propietario que lo ejecute desde un DM.

Cuando la sesión activa de OpenClaw usa el arnés nativo de OpenAI Codex,
la misma aprobación de ejecución también cubre una carga de comentarios de OpenAI para los hilos de tiempo de ejecución de Codex
que OpenClaw conoce. Esa carga es independiente del zip local del Gateway
y aparece solo para sesiones con arnés de Codex. Antes de la aprobación, el
prompt explica que aprobar diagnósticos también enviará comentarios de Codex, pero
no enumera ids de sesión ni de hilo de Codex. Después de la aprobación, la respuesta de chat enumera
los canales, los ids de sesión de OpenClaw, los ids de hilo de Codex y los comandos locales de reanudación
para los hilos que se enviaron a servidores de OpenAI. Si deniegas o ignoras la
aprobación, OpenClaw no ejecuta la exportación, no envía comentarios de Codex y
no imprime los ids de Codex.

Eso hace que el bucle común de depuración de Codex sea breve: notar el mal comportamiento en
Telegram, Discord u otro canal, ejecutar `/diagnostics`, aprobar una vez, compartir
el informe con soporte y luego ejecutar localmente el comando `codex resume <thread-id>` impreso
si quieres inspeccionar tú mismo el hilo nativo de Codex. Consulta
[Arnés de Codex](/es/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) para
ese flujo de inspección.

## Qué contiene la exportación

El zip incluye:

- `summary.md`: resumen legible por humanos para soporte.
- `diagnostics.json`: resumen legible por máquina de configuración, registros, estado, salud
  y datos de estabilidad.
- `manifest.json`: metadatos de exportación y lista de archivos.
- Forma de configuración sanitizada y detalles de configuración no secretos.
- Resúmenes de registros sanitizados y líneas recientes de registro censuradas.
- Instantáneas de estado y salud del Gateway de mejor esfuerzo.
- `stability/latest.json`: el paquete de estabilidad persistido más reciente, cuando esté disponible.

La exportación es útil incluso cuando el Gateway no está saludable. Si el Gateway no puede
responder a solicitudes de estado o salud, los registros locales, la forma de configuración y el
paquete de estabilidad más reciente aún se recopilan cuando están disponibles.

## Modelo de privacidad

Los diagnósticos están diseñados para poder compartirse. La exportación conserva datos operativos
que ayudan a depurar, como:

- nombres de subsistemas, ids de plugins, ids de proveedores, ids de canales y modos configurados
- códigos de estado, duraciones, recuentos de bytes, estado de cola y lecturas de memoria
- metadatos de registro sanitizados y mensajes operativos censurados
- forma de configuración y ajustes de funciones no secretos

La exportación omite o censura:

- texto de chat, prompts, instrucciones, cuerpos de Webhook y salidas de herramientas
- credenciales, claves de API, tokens, cookies y valores secretos
- cuerpos sin procesar de solicitudes o respuestas
- ids de cuenta, ids de mensaje, ids de sesión sin procesar, nombres de host y nombres de usuario locales

Cuando un mensaje de registro parece texto de usuario, chat, prompt o carga útil de herramienta, la
exportación conserva solo que se omitió un mensaje y el recuento de bytes.

## Grabador de estabilidad

El Gateway registra de forma predeterminada un flujo de estabilidad limitado y sin cargas útiles cuando
los diagnósticos están habilitados. Es para hechos operativos, no para contenido.

El mismo Heartbeat de diagnóstico registra muestras de actividad cuando el Gateway sigue
ejecutándose pero el bucle de eventos de Node.js o la CPU parecen saturados. Estos eventos
`diagnostic.liveness.warning` incluyen retraso del bucle de eventos, utilización del bucle de eventos,
relación de núcleos de CPU y recuentos de sesiones activas/en espera/en cola. Las muestras inactivas
permanecen en telemetría a nivel `info`; solo se registran como advertencias del Gateway
cuando el trabajo de diagnóstico está activo, en espera o en cola. No
reinician el Gateway por sí mismas.

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

Crea un zip de diagnóstico a partir del paquete persistido más reciente:

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

- `--output <path>`: escribir en una ruta zip específica.
- `--log-lines <count>`: líneas de registro sanitizadas máximas que incluir.
- `--log-bytes <bytes>`: bytes de registro máximos que inspeccionar.
- `--url <url>`: URL de WebSocket del Gateway para instantáneas de estado y salud.
- `--token <token>`: token del Gateway para instantáneas de estado y salud.
- `--password <password>`: contraseña del Gateway para instantáneas de estado y salud.
- `--timeout <ms>`: tiempo de espera de instantáneas de estado y salud.
- `--no-stability-bundle`: omitir la búsqueda de paquetes de estabilidad persistidos.
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

Deshabilitar los diagnósticos reduce el detalle de los informes de errores. No afecta al registro normal
del Gateway.

## Relacionado

- [Comprobaciones de salud](/es/gateway/health)
- [CLI del Gateway](/es/cli/gateway#gateway-diagnostics-export)
- [Protocolo del Gateway](/es/gateway/protocol#system-and-identity)
- [Registro](/es/logging)
- [Exportación de OpenTelemetry](/es/gateway/opentelemetry) — flujo independiente para transmitir diagnósticos a un recopilador
