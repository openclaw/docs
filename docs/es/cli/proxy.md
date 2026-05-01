---
read_when:
    - Debe validar el enrutamiento del proxy administrado por el operador antes del despliegue
    - Debe capturar el tráfico de transporte de OpenClaw localmente para la depuración
    - Desea inspeccionar sesiones de proxy de depuración, objetos binarios grandes o preajustes de consulta integrados
summary: Referencia de CLI para `openclaw proxy`, incluida la validación del proxy administrado por el operador y el inspector local de capturas del proxy de depuración
title: Servidor proxy
x-i18n:
    generated_at: "2026-05-01T05:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valida el enrutamiento de proxy gestionado por el operador, o ejecuta el proxy de depuración explícito local
e inspecciona el tráfico capturado.

Usa `validate` para comprobar de antemano un proxy de reenvío gestionado por el operador antes de habilitar
el enrutamiento de proxy de OpenClaw. Los otros comandos son herramientas de depuración para la investigación
a nivel de transporte: pueden iniciar un proxy local, ejecutar un comando secundario
con la captura habilitada, listar sesiones de captura, consultar patrones de tráfico comunes, leer
blobs capturados y purgar datos de captura locales.

## Comandos

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validar

`openclaw proxy validate` comprueba la URL efectiva del proxy gestionado por el operador a partir de
`--proxy-url`, la configuración o `OPENCLAW_PROXY_URL`. Informa de un problema de configuración cuando
no hay ningún proxy habilitado y configurado; usa `--proxy-url` para una comprobación previa puntual
antes de cambiar la configuración. De forma predeterminada, verifica que un destino público funcione
a través del proxy y que el proxy no pueda alcanzar un canario de loopback temporal.
Los destinos denegados personalizados fallan en modo cerrado: las respuestas HTTP y los fallos
de transporte ambiguos fallan ambos, a menos que puedas verificar por separado una señal de denegación
específica del despliegue.

Opciones:

- `--json`: imprime JSON legible por máquina.
- `--proxy-url <url>`: valida esta URL de proxy en lugar de la configuración o el entorno.
- `--allowed-url <url>`: añade un destino que se espera que funcione a través del proxy. Repítelo para comprobar varios destinos.
- `--denied-url <url>`: añade un destino que se espera que el proxy bloquee. Repítelo para comprobar varios destinos.
- `--timeout-ms <ms>`: tiempo de espera por solicitud en milisegundos.

Consulta [Proxy de red](/es/security/network-proxy) para obtener orientación de despliegue y semántica
de denegación.

## Preajustes de consulta

`openclaw proxy query --preset <name>` acepta:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notas

- `start` usa `127.0.0.1` de forma predeterminada, a menos que se configure `--host`.
- `run` inicia un proxy de depuración local y luego ejecuta el comando después de `--`.
- `validate` sale con el código 1 cuando fallan la configuración del proxy o las comprobaciones de destino.
- Las capturas son datos de depuración locales; usa `openclaw proxy purge` cuando termines.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Proxy de red](/es/security/network-proxy)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)
