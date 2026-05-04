---
read_when:
    - Debe validar el enrutamiento del proxy gestionado por el operador antes del despliegue
    - Debe capturar el tráfico de transporte de OpenClaw localmente para depuración
    - Quieres inspeccionar sesiones de proxy de depuración, blobs o preajustes de consulta integrados
summary: Referencia de CLI para `openclaw proxy`, incluida la validación del proxy administrado por el operador y el inspector de captura del proxy de depuración local
title: Proxy
x-i18n:
    generated_at: "2026-05-04T05:27:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9589bedafb97c31bcb6536a04307cd0c6550e1f307693bd4401785d79f34a1eb
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valida el enrutamiento de proxy administrado por el operador, o ejecuta el proxy
explícito de depuración local e inspecciona el tráfico capturado.

Usa `validate` para comprobar de antemano un proxy de reenvío administrado por el operador antes de habilitar
el enrutamiento de proxy de OpenClaw. Los demás comandos son herramientas de depuración para la
investigación a nivel de transporte: pueden iniciar un proxy local, ejecutar un comando secundario
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

`openclaw proxy validate` comprueba la URL efectiva del proxy administrado por el operador desde
`--proxy-url`, la configuración o `OPENCLAW_PROXY_URL`. Informa de un problema de configuración cuando
no hay ningún proxy habilitado y configurado; usa `--proxy-url` para una comprobación puntual
antes de cambiar la configuración. De forma predeterminada, verifica que un destino público funcione
a través del proxy y que el proxy no pueda llegar a un canario temporal de loopback.
Los destinos denegados personalizados fallan en modo cerrado: las respuestas HTTP y los fallos
de transporte ambiguos fallan salvo que puedas verificar por separado una señal de denegación
específica de la implementación.

Opciones:

- `--json`: imprime JSON legible por máquinas.
- `--proxy-url <url>`: valida esta URL de proxy en lugar de la configuración o el entorno.
- `--allowed-url <url>`: añade un destino que se espera que funcione a través del proxy. Repite para comprobar varios destinos.
- `--denied-url <url>`: añade un destino que se espera que el proxy bloquee. Repite para comprobar varios destinos.
- `--timeout-ms <ms>`: tiempo de espera por solicitud en milisegundos.

Consulta [Proxy de red](/es/security/network-proxy) para obtener orientación sobre la implementación y la semántica
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

- `start` usa `127.0.0.1` de forma predeterminada salvo que se establezca `--host`.
- `run` inicia un proxy de depuración local y luego ejecuta el comando después de `--`.
- El reenvío directo al origen del proxy de depuración abre sockets ascendentes para diagnósticos. Cuando el modo de proxy administrado de OpenClaw está activo, el reenvío directo para solicitudes de proxy y túneles CONNECT está deshabilitado de forma predeterminada; establece `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` solo para diagnósticos locales aprobados.
- `validate` sale con código 1 cuando fallan la configuración del proxy o las comprobaciones de destino.
- Las capturas son datos locales de depuración; usa `openclaw proxy purge` cuando termines.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Proxy de red](/es/security/network-proxy)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)
