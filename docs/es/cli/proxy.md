---
read_when:
    - Necesitas validar el enrutamiento de proxy gestionado por el operador antes del despliegue
    - Necesitas capturar localmente el tráfico de transporte de OpenClaw para depuración
    - Quieres inspeccionar sesiones de proxy de depuración, blobs o preajustes de consulta integrados
summary: Referencia de la CLI para `openclaw proxy`, incluida la validación de proxy gestionado por el operador y el inspector de captura del proxy de depuración local
title: Proxy
x-i18n:
    generated_at: "2026-06-27T11:04:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valida el enrutamiento de proxy gestionado por el operador, o ejecuta el proxy de depuración explícito local
e inspecciona el tráfico capturado.

Usa `validate` para comprobar previamente un proxy de reenvío gestionado por el operador antes de habilitar
el enrutamiento de proxy de OpenClaw. Los otros comandos son herramientas de depuración para
investigación a nivel de transporte: pueden iniciar un proxy local, ejecutar un comando hijo
con la captura habilitada, listar sesiones de captura, consultar patrones de tráfico comunes, leer
blobs capturados y purgar datos de captura locales.

## Comandos

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validar

`openclaw proxy validate` comprueba la URL efectiva del proxy gestionado por el operador desde
`--proxy-url`, la configuración o `OPENCLAW_PROXY_URL`. Las URL de proxy gestionado pueden usar
`http://` para un listener de proxy de reenvío simple o `https://` cuando OpenClaw debe
abrir TLS hacia el endpoint del proxy antes de enviar solicitudes de proxy. Informa de un
problema de configuración cuando no hay ningún proxy habilitado y configurado; usa `--proxy-url` para una
comprobación previa puntual antes de cambiar la configuración. Añade `--proxy-ca-file` para confiar en una
CA privada para la conexión TLS a un endpoint de proxy HTTPS. De forma predeterminada,
verifica que un destino público tenga éxito a través del proxy y que el proxy
no pueda alcanzar un canario de loopback temporal. Los destinos denegados personalizados
fallan en modo cerrado: las respuestas HTTP y los fallos de transporte ambiguos fallan salvo que
puedas verificar por separado una señal de denegación específica del despliegue. Añade
`--apns-reachable` para abrir también un túnel CONNECT HTTP/2 de APNs a través del proxy
y confirmar que APNs sandbox responde; la prueba usa un token de proveedor intencionadamente inválido,
por lo que una respuesta de APNs `403 InvalidProviderToken` es una señal correcta
de alcanzabilidad.

Opciones:

- `--json`: imprime JSON legible por máquina.
- `--proxy-url <url>`: valida esta URL de proxy `http://` o `https://` en lugar de la configuración o el entorno.
- `--proxy-ca-file <path>`: confía en este archivo de CA PEM para la verificación TLS de un endpoint de proxy HTTPS.
- `--allowed-url <url>`: añade un destino que se espera que tenga éxito a través del proxy. Repite para comprobar varios destinos.
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

- `start` usa `127.0.0.1` de forma predeterminada salvo que se establezca `--host`.
- `run` inicia un proxy de depuración local y luego ejecuta el comando después de `--`.
- El reenvío ascendente directo del proxy de depuración abre sockets ascendentes para diagnóstico. Cuando el modo de proxy gestionado de OpenClaw está activo, el reenvío directo para solicitudes de proxy y túneles CONNECT está deshabilitado de forma predeterminada; establece `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` solo para diagnósticos locales aprobados.
- `validate` sale con el código 1 cuando fallan la configuración del proxy o las comprobaciones de destino.
- Las capturas son datos de depuración locales; usa `openclaw proxy purge` cuando termines.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Proxy de red](/es/security/network-proxy)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)
