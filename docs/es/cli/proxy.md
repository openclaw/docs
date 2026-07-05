---
read_when:
    - Necesitas validar el enrutamiento de proxy gestionado por el operador antes de la implementación
    - Necesitas capturar localmente el tráfico de transporte de OpenClaw para depuración
    - Quieres inspeccionar sesiones del proxy de depuración, blobs o preajustes de consulta integrados
summary: Referencia de la CLI para `openclaw proxy`, incluida la validación del proxy gestionado por el operador y el inspector de captura del proxy de depuración local
title: Proxy
x-i18n:
    generated_at: "2026-07-05T11:09:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valida el enrutamiento de proxy gestionado por el operador, o ejecuta el proxy de depuración explícito local e inspecciona el tráfico capturado.

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

`validate` realiza comprobaciones previas de un proxy directo gestionado por el operador. El resto son herramientas de depuración para la investigación a nivel de transporte: iniciar un proxy local con captura, ejecutar un comando hijo a través de él, listar sesiones de captura, consultar patrones de tráfico, leer blobs capturados y purgar los datos de captura locales.

## Validar

Comprueba la URL efectiva del proxy gestionado por el operador a partir de `--proxy-url`, la configuración (`proxy.proxyUrl`) o `OPENCLAW_PROXY_URL`, en ese orden de precedencia. Informa de un problema de configuración si no hay ningún proxy habilitado y configurado; pasa `--proxy-url` para una comprobación previa puntual sin tocar la configuración.

Las URL de proxy gestionado usan `http://` para un listener de proxy directo simple, o `https://` cuando OpenClaw debe abrir TLS hacia el endpoint del proxy antes de enviar solicitudes de proxy. Usa `--proxy-ca-file` para confiar en una CA privada para esa conexión TLS.

De forma predeterminada ejecuta:

- una comprobación **permitida** contra `https://example.com/` (sustituye/añade con `--allowed-url`, repetible)
- una comprobación **denegada** contra un canario temporal de loopback (sustituye con `--denied-url`, repetible)

Los destinos personalizados de `--denied-url` son fail-closed: tanto las respuestas HTTP como los fallos de transporte ambiguos cuentan como fallos, salvo que puedas verificar de forma independiente una señal de denegación específica del despliegue. El canario de loopback integrado es el único destino en el que un error de transporte se trata como prueba de bloqueo.

Añade `--apns-reachable` para abrir también un túnel APNs HTTP/2 CONNECT a través del proxy y confirmar que APNs de sandbox responde. La sonda envía un token de proveedor intencionadamente inválido, por lo que una respuesta APNs `403 InvalidProviderToken` cuenta como una señal correcta de alcanzabilidad (no como un fallo).

### Opciones

| Indicador                | Efecto                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | imprime JSON legible por máquina                                                                                        |
| `--proxy-url <url>`      | valida esta URL de proxy `http://`/`https://` en lugar de la configuración o el entorno                                  |
| `--proxy-ca-file <path>` | confía en este archivo de CA PEM para la verificación TLS de un endpoint de proxy HTTPS                                  |
| `--allowed-url <url>`    | destino que se espera que tenga éxito a través del proxy (repetible)                                                    |
| `--denied-url <url>`     | destino que se espera que sea bloqueado por el proxy (repetible)                                                        |
| `--apns-reachable`       | verifica también que APNs HTTP/2 de sandbox sea alcanzable a través del proxy                                           |
| `--apns-authority <url>` | autoridad APNs que se sondeará (predeterminado `https://api.sandbox.push.apple.com`; producción es `https://api.push.apple.com`) |
| `--timeout-ms <ms>`      | tiempo de espera por solicitud                                                                                          |

Sale con código 1 cuando la configuración del proxy o las comprobaciones de destino fallan.

Consulta [Proxy de red](/es/security/network-proxy) para obtener orientación sobre el despliegue y la semántica de denegación.

## Proxy de depuración

`start` lanza un proxy local con captura e imprime su URL, la ruta del certificado de CA y la ruta de la base de datos de captura; deténlo con Ctrl+C. De forma predeterminada se enlaza a `127.0.0.1`, salvo que se defina `--host`.

`run` inicia un proxy de depuración local y luego ejecuta `<cmd...>` (después de `--`) con el entorno del proxy aplicado, dentro de su propia sesión de captura.

El reenvío directo aguas arriba del proxy de depuración abre sockets aguas arriba para diagnóstico. Cuando el modo de proxy gestionado de OpenClaw está activo, el reenvío directo para solicitudes de proxy y túneles CONNECT está deshabilitado de forma predeterminada; define `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` solo para diagnósticos locales aprobados.

`coverage` imprime un informe JSON (`summary` + `entries` por transporte) de qué transportes están capturados, son solo proxy o no están cubiertos.

`sessions` lista las sesiones de captura recientes (`--limit`, predeterminado 20).

`query --preset <name>` ejecuta una consulta integrada contra el tráfico capturado, opcionalmente limitada a `--session <id>`. Preajustes:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` imprime el contenido sin procesar de un blob de carga útil capturado.

`purge` elimina todos los metadatos y blobs del tráfico capturado. Las capturas son datos de depuración locales; púrgalas cuando termines.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Proxy de red](/es/security/network-proxy)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)
