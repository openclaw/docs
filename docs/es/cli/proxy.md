---
read_when:
    - Debe validar el enrutamiento del proxy gestionado por el operador antes del despliegue.
    - Necesitas capturar localmente el tráfico de transporte de OpenClaw para depuración
    - Quieres inspeccionar sesiones del proxy de depuración, blobs o preajustes de consulta integrados
summary: Referencia de la CLI para `openclaw proxy`, incluida la validación del proxy gestionado por el operador y el inspector local de capturas del proxy para depuración
title: Proxy
x-i18n:
    generated_at: "2026-07-11T23:00:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valida el enrutamiento mediante un proxy administrado por el operador, o ejecuta el proxy de depuración explícito local e inspecciona el tráfico capturado.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` realiza comprobaciones preliminares de un proxy de reenvío administrado por el operador. El resto son herramientas de depuración para investigar en el nivel de transporte: iniciar un proxy local que capture el tráfico, ejecutar un comando secundario a través de él, enumerar las sesiones de captura, consultar patrones de tráfico, leer los objetos binarios capturados y eliminar los datos de captura locales.

## Validación

Comprueba la URL efectiva del proxy administrado por el operador a partir de `--proxy-url`, la configuración (`proxy.proxyUrl`) o `OPENCLAW_PROXY_URL`, en ese orden de precedencia. Informa de un problema de configuración si no hay ningún proxy habilitado y configurado; proporciona `--proxy-url` para realizar una comprobación preliminar puntual sin modificar la configuración.

Las URL de proxies administrados usan `http://` para un servidor de escucha de proxy de reenvío sin cifrar, o `https://` cuando OpenClaw debe establecer una conexión TLS con el propio punto de conexión del proxy antes de enviar solicitudes al proxy. Usa `--proxy-ca-file` para confiar en una CA privada para esa conexión TLS.

De forma predeterminada, ejecuta:

- una comprobación **permitida** con `https://example.com/` (sustituye o añade destinos con `--allowed-url`, que puede repetirse)
- una comprobación **denegada** con un valor canario temporal de bucle invertido (sustitúyelo con `--denied-url`, que puede repetirse)

Los destinos personalizados de `--denied-url` adoptan un comportamiento seguro ante fallos: tanto las respuestas HTTP como los fallos de transporte ambiguos cuentan como fallos, a menos que puedas verificar de forma independiente una señal de denegación específica del despliegue. El valor canario de bucle invertido integrado es el único destino en el que un error de transporte se considera una prueba de bloqueo.

Añade `--apns-reachable` para abrir también un túnel CONNECT HTTP/2 de APNs a través del proxy y confirmar que el entorno de pruebas de APNs responde. La sonda envía intencionadamente un token de proveedor no válido, por lo que una respuesta `403 InvalidProviderToken` de APNs cuenta como señal de accesibilidad correcta, no como fallo.

### Opciones

| Opción                   | Efecto                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | imprime JSON legible por máquinas                                                                                             |
| `--proxy-url <url>`      | valida esta URL de proxy `http://`/`https://` en lugar de la configuración o la variable de entorno                           |
| `--proxy-ca-file <path>` | confía en este archivo de CA en formato PEM para verificar mediante TLS un punto de conexión de proxy HTTPS                    |
| `--allowed-url <url>`    | destino que debe responder correctamente a través del proxy (puede repetirse)                                                 |
| `--denied-url <url>`     | destino que el proxy debe bloquear (puede repetirse)                                                                          |
| `--apns-reachable`       | verifica también que el entorno de pruebas de APNs mediante HTTP/2 sea accesible a través del proxy                           |
| `--apns-authority <url>` | autoridad de APNs que se comprobará (valor predeterminado: `https://api.sandbox.push.apple.com`; producción: `https://api.push.apple.com`) |
| `--timeout-ms <ms>`      | tiempo de espera por solicitud                                                                                                |

Finaliza con el código 1 cuando falla la configuración del proxy o las comprobaciones de destino.

Consulta [Proxy de red](/es/security/network-proxy) para obtener orientación sobre el despliegue y la semántica de denegación.

## Proxy de depuración

`start` inicia un proxy local que captura el tráfico e imprime su URL, la ruta del certificado de CA y la ruta de la base de datos de capturas; detenlo con Ctrl+C. De forma predeterminada, se vincula a `127.0.0.1`, salvo que se establezca `--host`.

`run` inicia un proxy de depuración local y, a continuación, ejecuta `<cmd...>` (después de `--`) con las variables de entorno del proxy aplicadas, en su propia sesión de captura.

El reenvío directo hacia destinos ascendentes del proxy de depuración abre sockets ascendentes para fines de diagnóstico. Cuando está activo el modo de proxy administrado de OpenClaw, el reenvío directo de solicitudes de proxy y túneles CONNECT está deshabilitado de forma predeterminada; establece `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` únicamente para diagnósticos locales aprobados.

`coverage` imprime un informe JSON (`summary` y `entries` por transporte) que indica qué transportes se capturan, cuáles funcionan únicamente mediante proxy y cuáles no están cubiertos.

`sessions` enumera las sesiones de captura recientes (`--limit`, valor predeterminado: 20).

`query --preset <name>` ejecuta una consulta integrada sobre el tráfico capturado, que puede limitarse opcionalmente a `--session <id>`. Valores preestablecidos:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` imprime el contenido sin procesar de un objeto binario de carga útil capturado.

`purge` elimina todos los metadatos y objetos binarios del tráfico capturado. Las capturas son datos de depuración locales; elimínalas cuando termines.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Proxy de red](/es/security/network-proxy)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)
