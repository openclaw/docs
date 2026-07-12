---
read_when:
    - Quieres una defensa en profundidad contra ataques SSRF y de revinculación de DNS
    - Configuración de un proxy de reenvío externo para el tráfico de ejecución de OpenClaw
summary: Cómo enrutar el tráfico HTTP y WebSocket del entorno de ejecución de OpenClaw mediante un proxy de filtrado administrado por el operador
title: Proxy de red
x-i18n:
    generated_at: "2026-07-11T23:34:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw puede enrutar el tráfico HTTP y WebSocket en tiempo de ejecución mediante un proxy directo administrado por el operador. Se trata de una defensa en profundidad opcional: control centralizado del tráfico saliente, mayor protección contra SSRF y capacidad de auditoría de los destinos en el perímetro de la red. Como el proxy evalúa el destino en el momento de la conexión, después de la resolución DNS e inmediatamente antes de abrir la conexión ascendente, también reduce el intervalo del que depende un ataque de revinculación de DNS entre una comprobación de DNS anterior en el ámbito de la aplicación y la conexión saliente real. Una única política de proxy también proporciona a los operadores un lugar centralizado donde aplicar reglas de destino, segmentación de red, límites de frecuencia o listas de destinos salientes permitidos sin tener que recompilar OpenClaw.

OpenClaw no incluye, descarga, inicia, configura ni certifica ningún proxy. Usted ejecuta la tecnología de proxy que mejor se adapte a su entorno; OpenClaw enruta sus propios clientes HTTP y WebSocket a través de ella.

## Configuración

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

También puede definir la URL mediante el entorno mientras `proxy.enabled: true` permanezca en la configuración:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` tiene prioridad sobre `OPENCLAW_PROXY_URL`. Si `proxy.enabled` es `true`, pero no se resuelve ninguna URL válida, los comandos protegidos fallan durante el inicio en lugar de recurrir al acceso directo a la red.

| Clave                | Tipo                                 | Valor predeterminado | Notas                                                                                                                                                   |
| -------------------- | ------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | booleano                             | sin definir          | Debe ser `true` para activar el enrutamiento.                                                                                                            |
| `proxy.proxyUrl`     | cadena                               | sin definir          | URL de proxy directo `http://` o `https://`. Las credenciales incorporadas en la URL se consideran confidenciales y se ocultan en instantáneas y registros. |
| `proxy.tls.caFile`   | cadena                               | sin definir          | Paquete de CA para verificar un punto de conexión de proxy `https://` firmado por una CA privada.                                                        |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only`       | Controla el comportamiento de omisión del bucle invertido; consulte la información siguiente.                                                           |

Para servicios administrados del Gateway, almacene la URL en la configuración para que se conserve después de una reinstalación, en lugar de depender de variables de entorno del proceso en primer plano:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

El valor de entorno alternativo `OPENCLAW_PROXY_URL` es más adecuado para ejecuciones en primer plano. Para usarlo con un servicio instalado, colóquelo en el entorno persistente del servicio (`$OPENCLAW_STATE_DIR/.env`, de manera predeterminada `~/.openclaw/.env`) y, a continuación, vuelva a instalarlo para que launchd, systemd o Tareas programadas lo recojan.

### Punto de conexión de proxy HTTPS con una CA privada

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` verifica el certificado TLS propio del punto de conexión del proxy. No es una configuración de confianza MITM para el destino, un certificado de cliente ni un sustituto de la política de destinos del proxy. Use `NODE_EXTRA_CA_CERTS` únicamente cuando todo el proceso de Node deba confiar en una CA adicional desde el inicio (por ejemplo, un sistema empresarial de inspección TLS que vuelva a firmar todos los certificados de destinos HTTPS); esta variable se aplica a todo el proceso y debe establecerse antes de iniciar Node, por lo que OpenClaw no puede aplicarla durante la ejecución como hace con `proxy.tls.caFile`. Para confiar en el punto de conexión del proxy HTTPS, prefiera `proxy.tls.caFile`: su alcance se limita al enrutamiento administrado mediante proxy, en lugar de abarcar todo el proceso.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Funcionamiento del enrutamiento

Con `proxy.enabled: true` y una URL válida, los procesos protegidos en tiempo de ejecución (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) enrutan el tráfico saliente HTTP y WebSocket normal mediante el proxy:

```text
Proceso de OpenClaw
  fetch, node:http, node:https, clientes WebSocket  -> proxy del operador -> destino
```

Internamente, OpenClaw instala [Proxyline](https://github.com/openclaw/proxyline) como entorno de ejecución de enrutamiento en el ámbito del proceso. Abarca `fetch`, clientes basados en undici, `node:http`/`node:https`, clientes WebSocket habituales y túneles `CONNECT` creados por funciones auxiliares, y sustituye los agentes HTTP de Node proporcionados por el invocador para que los agentes explícitos (incluidos `axios`, `got`, `node-fetch` y clientes similares basados en agentes de Node) no puedan omitir el proxy de forma inadvertida.

El esquema de la URL del proxy describe el tramo desde OpenClaw hasta el proxy, no hasta el destino final:

- `http://proxy.example:3128` — TCP sin cifrar hasta el proxy; OpenClaw envía solicitudes de proxy HTTP, incluido `CONNECT` para destinos HTTPS.
- `https://proxy.example:8443` — OpenClaw abre una conexión TLS con el propio proxy (y verifica su certificado) y, a continuación, envía solicitudes de proxy HTTP dentro de esa sesión.

El TLS del destino es independiente del TLS del punto de conexión del proxy: para un destino HTTPS, OpenClaw siempre solicita al proxy un túnel `CONNECT` e inicia el TLS del destino a través de ese túnel.

Mientras el proxy está activo, OpenClaw borra `no_proxy`/`NO_PROXY`. Estas listas de omisión se basan en el destino; dejar `localhost` o `127.0.0.1` en ellas permitiría que los destinos SSRF omitieran el proxy por completo. Al cerrarse, OpenClaw restaura el entorno de proxy anterior y restablece el estado de enrutamiento almacenado en caché.

Algunos plugins poseen un transporte personalizado que necesita su propia integración con el proxy incluso cuando está activo el enrutamiento en el ámbito del proceso. El cliente de la API de bots de Telegram utiliza su propio despachador HTTP/1 de undici y respeta por separado las variables de entorno del proxy del proceso, además del valor alternativo `OPENCLAW_PROXY_URL`.

### Modo de bucle invertido del Gateway

Los clientes locales del plano de control del Gateway normalmente se conectan a un WebSocket de bucle invertido como `ws://127.0.0.1:18789`. `proxy.loopbackMode` controla si ese tráfico omite el proxy administrado:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

| Modo                     | Comportamiento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (predeterminado) | OpenClaw registra la autoridad de bucle invertido del Gateway activo como una excepción de conexión directa, por lo que el tráfico WebSocket local del Gateway se conecta sin el proxy. Los puertos de bucle invertido personalizados funcionan porque la excepción se dirige al host y puerto configurados exactos. El plugin de navegador incluido registra el mismo tipo de excepción para las URL locales exactas de disponibilidad de CDP y WebSocket de DevTools de los navegadores administrados iniciados por OpenClaw; el proveedor incluido de incrustaciones de memoria de Ollama tiene una ruta directa protegida más restringida para su origen de incrustaciones de bucle invertido local al host configurado exacto. |
| `proxy`                  | No se registra ninguna excepción de bucle invertido; el tráfico de bucle invertido del Gateway y de Ollama pasa por el proxy. Un proxy remoto debe poder enrutar el tráfico de vuelta al servicio de bucle invertido del host de OpenClaw (por ejemplo, mediante un nombre de host, una dirección IP o un túnel accesibles); un proxy remoto estándar resuelve `127.0.0.1`/`localhost` con respecto a sí mismo, no con respecto al host de OpenClaw.                                                                                                                                                                                                                                             |
| `block`                  | OpenClaw rechaza las conexiones del plano de control de bucle invertido del Gateway y las conexiones protegidas de incrustaciones de bucle invertido de Ollama antes de abrir un socket.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

La omisión del plano de control del Gateway se limita a `localhost` y a las URL con direcciones IP literales de bucle invertido: use `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789`. Los demás nombres de host se enrutan como tráfico ordinario.

### Contenedores

Para los comandos `openclaw --container ...`, OpenClaw reenvía `OPENCLAW_PROXY_URL` a la CLI secundaria dirigida al contenedor cuando está definida. La URL debe ser accesible desde el interior del contenedor; allí, `127.0.0.1` hace referencia al propio contenedor, no al host. OpenClaw rechaza las URL de proxy de bucle invertido para comandos dirigidos a contenedores, a menos que establezca `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` para anular explícitamente esa comprobación.

## Términos relacionados con el proxy

- `proxy.enabled` / `proxy.proxyUrl` — enrutamiento de proxy directo saliente para el tráfico en tiempo de ejecución. Esta página.
- `gateway.auth.mode: "trusted-proxy"` — autenticación de proxy inverso entrante con conocimiento de identidad para acceder al Gateway. Consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).
- `openclaw proxy` — proxy local de depuración e inspector de capturas para desarrollo y soporte. Consulte [openclaw proxy](/es/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — opción de participación para que `web_fetch` permita a un proxy de entorno HTTP(S) controlado por el operador resolver DNS, mientras mantiene de forma predeterminada la fijación estricta de DNS y la política de nombres de host. Consulte [Obtención web](/es/tools/web-fetch#trusted-env-proxy).
- Configuración de proxy específica de un canal o proveedor — anulaciones específicas del propietario para un transporte. Prefiera el proxy de red administrado para controlar de forma centralizada el tráfico saliente de todo el entorno de ejecución.

## Validación del proxy

La política de destinos del proxy es el verdadero perímetro de seguridad; OpenClaw no puede verificar que su proxy bloquee los destinos correctos. Configúrelo para:

- Enlazarse únicamente al bucle invertido o a una interfaz privada de confianza, accesible solo para el proceso, host, contenedor o cuenta de servicio de OpenClaw.
- Resolver por sí mismo los destinos y bloquear por dirección IP después de la resolución DNS, en el momento de la conexión, tanto para HTTP sin cifrar como para túneles HTTPS `CONNECT`.
- Rechazar omisiones basadas en el destino para rangos de bucle invertido, privados, de vínculo local, de metadatos, multidifusión, reservados y de documentación.
- Evitar listas de nombres de host permitidos, a menos que confíe plenamente en la ruta de resolución DNS.
- Registrar el destino, la decisión, el estado y el motivo; nunca los cuerpos de las solicitudes, los encabezados de autorización, las cookies ni otros secretos.
- Mantener la política bajo control de versiones y revisar los cambios como sensibles para la seguridad.

Valide desde el mismo host, contenedor o cuenta de servicio que ejecuta OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Con un punto de conexión de proxy HTTPS que use una CA privada:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Opción                   | Propósito                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `--proxy-url <url>`      | Valida esta URL en lugar de resolver la configuración o las variables de entorno.              |
| `--proxy-ca-file <path>` | Paquete de certificados de CA para un endpoint de proxy HTTPS.                                 |
| `--allowed-url <url>`    | Destino que se espera que sea accesible (se puede repetir).                                    |
| `--denied-url <url>`     | Destino que se espera que esté bloqueado (se puede repetir).                                   |
| `--apns-reachable`       | Verifica también que el proxy pueda tunelizar una sonda HTTP/2 directa al entorno aislado APNs. |
| `--apns-authority <url>` | Sustituye la autoridad APNs sondeada con `--apns-reachable`.                                   |
| `--timeout-ms <ms>`      | Tiempo de espera por solicitud.                                                                |
| `--json`                 | Salida legible por máquina.                                                                    |

Si `proxy.enabled` no es `true` y no se proporciona `--proxy-url`, el comando informa de un problema de configuración en lugar de realizar la validación; proporcione `--proxy-url` para una comprobación previa puntual antes de cambiar la configuración.

Si no se especifica `--allowed-url` ni `--denied-url`, las comprobaciones predeterminadas son las siguientes: `https://example.com/` debe ser accesible y debe bloquearse un servidor señuelo temporal de bucle local al que el proxy no debe poder acceder. La comprobación de bucle local se supera si se produce un fallo de transporte o una respuesta que no sea 2xx y que no contenga el token por ejecución del señuelo; falla si se recibe una respuesta 2xx sin el token (un acceso correcto inesperado procedente de algo distinto del señuelo) y, especialmente, si cualquier respuesta contiene el token correspondiente, ya que esto demuestra que el proxy reenvió realmente un destino de bucle local que debería haber denegado. Los destinos personalizados de `--denied-url` no tienen dicho token señuelo, por lo que adoptan un comportamiento de denegación ante fallos: cualquier respuesta HTTP cuenta como accesible (fallo), y un error de transporte se informa como no concluyente en lugar de considerarse un bloqueo demostrado, porque OpenClaw no puede confirmar si el proxy denegó un origen accesible o si se produjo algún otro problema. `--apns-reachable` envía intencionadamente un token de proveedor no válido, por lo que una respuesta `403 InvalidProviderToken` demuestra que el túnel llegó a Apple. El comando finaliza con `1` ante cualquier fallo de validación; las credenciales de la URL del proxy se ocultan tanto en la salida de texto como en la salida JSON.

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

Comprobación manual con `curl` (la solicitud pública debe completarse correctamente; el proxy debe bloquear las solicitudes de bucle local y de metadatos; `curl` por sí solo no puede distinguir entre una denegación del proxy y un origen inaccesible como sí puede hacerlo el señuelo integrado de `openclaw proxy validate`):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Destinos cuyo bloqueo se recomienda

Lista de denegación inicial para cualquier proxy directo, cortafuegos o política de salida. El clasificador SSRF de OpenClaw se encuentra en `src/infra/net/ssrf.ts` y `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, el prefijo de evaluación comparativa RFC 2544 y la gestión de IPv4 incrustada para los formatos NAT64/6to4/Teredo/ISATAP/IPv4 mapeada); son referencias útiles, pero OpenClaw no exporta ni aplica estas reglas en su proxy externo.

| Intervalo o host                                                                      | Motivo del bloqueo                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                   | Bucle local IPv4                                             |
| `::1/128`                                                                             | Bucle local IPv6                                             |
| `0.0.0.0/8`, `::/128`                                                                 | Direcciones no especificadas o de esta red                   |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                       | Redes privadas RFC 1918                                      |
| `169.254.0.0/16`, `fe80::/10`                                                         | Enlace local, incluidas rutas comunes de metadatos en la nube |
| `169.254.169.254`, `metadata.google.internal`                                         | Servicios de metadatos en la nube                            |
| `100.64.0.0/10`                                                                       | Espacio de direcciones compartido de NAT de nivel de operador |
| `198.18.0.0/15`, `2001:2::/48`                                                        | Intervalos de evaluación comparativa                         |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`  | Intervalos de uso especial y documentación                   |
| `224.0.0.0/4`, `ff00::/8`                                                             | Multidifusión                                                |
| `240.0.0.0/4`                                                                         | IPv4 reservada                                               |
| `fc00::/7`, `fec0::/10`                                                               | Intervalos IPv6 locales o privados                           |
| `100::/64`, `2001:20::/28`                                                            | Intervalos IPv6 de descarte y ORCHIDv2                       |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                      | Prefijos NAT64 con IPv4 incrustada                           |
| `2002::/16`, `2001::/32`                                                              | 6to4 y Teredo con IPv4 incrustada                            |
| `::/96`, `::ffff:0:0/96`                                                              | IPv6 compatible con IPv4 e IPv6 con IPv4 mapeada             |

Añada cualquier host de metadatos o intervalo reservado adicional que documente su proveedor de nube o plataforma de red.

## Límites

| Superficie                                                   | Estado del proxy administrado                                                                                                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, clientes WebSocket comunes | Se enrutan mediante enlaces del proxy administrado cuando está configurado.                                                                                                                       |
| HTTP/2 directo de APNs                                       | Se enruta mediante el asistente `CONNECT` administrado de APNs.                                                                                                                                   |
| Bucle local del plano de control del Gateway                 | Conexión directa solo para la URL local de bucle local del Gateway configurada exactamente.                                                                                                       |
| Reenvío ascendente del proxy de depuración                   | Se desactiva mientras el modo de proxy administrado está activo, salvo que se habilite explícitamente para diagnósticos locales.                                                                   |
| IRC                                                          | TCP/TLS sin procesar; no se enruta mediante el modo de proxy HTTP administrado. Establezca `channels.irc.enabled: false` si su despliegue exige que todo el tráfico saliente pase por el proxy directo. |
| Otras llamadas de cliente `net`, `tls` o `http2` sin procesar | El protector de sockets sin procesar debe clasificarlas antes de incorporarlas.                                                                                                                    |

- Esta cobertura se aplica a nivel de proceso para clientes HTTP/WebSocket de JavaScript, no es un entorno aislado de red a nivel del sistema operativo.
- Los sockets `net`, `tls` y `http2` sin procesar, los complementos nativos y los procesos secundarios ajenos a OpenClaw pueden eludir el enrutamiento de Node, salvo que hereden y respeten las variables de entorno del proxy. Las CLI secundarias bifurcadas de OpenClaw heredan la URL del proxy administrado y el estado de `proxy.loopbackMode`.
- Las WebUI locales del usuario y los servidores de modelos locales no están cubiertos por una omisión general de la red local; inclúyalos en la lista de permitidos de la política de proxy del operador si es necesario. La excepción es la ruta directa protegida del proveedor integrado de incrustaciones de memoria de Ollama, limitada al origen de bucle local exacto del host indicado en su `baseUrl` configurada; los hosts Ollama de LAN, tailnet, redes privadas y redes públicas siguen utilizando el proxy administrado.
- El reenvío ascendente directo del proxy de depuración local (para solicitudes de proxy y túneles `CONNECT`) está desactivado de forma predeterminada mientras el modo de proxy administrado está activo; actívelo únicamente para diagnósticos locales aprobados.
- OpenClaw no inspecciona, prueba ni certifica su política de proxy. Trate los cambios de la política de proxy como cambios operativos sensibles para la seguridad.
