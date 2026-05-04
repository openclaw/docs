---
read_when:
    - Debe validar el enrutamiento de proxy gestionado por el operador antes de la implementación
    - Debes capturar localmente el tráfico de transporte de OpenClaw para depuración
    - Quieres inspeccionar sesiones del proxy de depuración, blobs o preajustes de consulta integrados
summary: Referencia de CLI para `openclaw proxy`, incluida la validación del proxy gestionado por el operador y el inspector local de capturas del proxy de depuración
title: Servidor proxy
x-i18n:
    generated_at: "2026-05-04T18:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092c4e946dcab5e78e37d6fc77bb067b7a649368f8571fa127e462a85fa14ce5
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valida el enrutamiento de proxy gestionado por el operador, o ejecuta el proxy de depuración explícito local
e inspecciona el tráfico capturado.

Usa `validate` para comprobar previamente un proxy de reenvío gestionado por el operador antes de habilitar
el enrutamiento de proxy de OpenClaw. Los demás comandos son herramientas de depuración para
la investigación a nivel de transporte: pueden iniciar un proxy local, ejecutar un comando hijo
con captura habilitada, listar sesiones de captura, consultar patrones de tráfico comunes, leer
blobs capturados y purgar datos locales de captura.

## Comandos

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validar

`openclaw proxy validate` comprueba la URL efectiva del proxy gestionado por el operador desde
`--proxy-url`, la configuración o `OPENCLAW_PROXY_URL`. Informa de un problema de configuración cuando
no hay ningún proxy habilitado y configurado; usa `--proxy-url` para una comprobación previa puntual
antes de cambiar la configuración. De forma predeterminada, verifica que un destino público funciona
a través del proxy y que el proxy no puede alcanzar un canary de loopback temporal.
Los destinos denegados personalizados fallan de forma cerrada: las respuestas HTTP y los fallos
de transporte ambiguos fallan a menos que puedas verificar por separado una señal de denegación
específica del despliegue. Añade `--apns-reachable` para abrir también un túnel CONNECT HTTP/2 de APNs
a través del proxy y confirmar que APNs sandbox responde; la prueba usa un token de proveedor
intencionadamente no válido, por lo que una respuesta de APNs `403 InvalidProviderToken`
es una señal correcta de alcanzabilidad.

Opciones:

- `--json`: imprime JSON legible por máquinas.
- `--proxy-url <url>`: valida esta URL de proxy en lugar de la configuración o el entorno.
- `--allowed-url <url>`: añade un destino que se espera que funcione a través del proxy. Repite para comprobar varios destinos.
- `--denied-url <url>`: añade un destino que se espera que el proxy bloquee. Repite para comprobar varios destinos.
- `--apns-reachable`: verifica también que APNs sandbox HTTP/2 sea alcanzable a través del proxy.
- `--apns-authority <url>`: autoridad de APNs que se probará con `--apns-reachable` (`https://api.sandbox.push.apple.com` de forma predeterminada; producción es `https://api.push.apple.com`).
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

- `start` usa `127.0.0.1` de forma predeterminada, salvo que se defina `--host`.
- `run` inicia un proxy de depuración local y luego ejecuta el comando después de `--`.
- El reenvío upstream directo del proxy de depuración abre sockets upstream para diagnóstico. Cuando el modo de proxy gestionado de OpenClaw está activo, el reenvío directo para solicitudes de proxy y túneles CONNECT está deshabilitado de forma predeterminada; define `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` solo para diagnósticos locales aprobados.
- `validate` sale con código 1 cuando fallan la configuración del proxy o las comprobaciones de destino.
- Las capturas son datos de depuración locales; usa `openclaw proxy purge` cuando termines.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Proxy de red](/es/security/network-proxy)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)
