---
read_when:
    - Quieres defensa en profundidad contra ataques SSRF y de reenlace DNS
    - Configurar un proxy de reenvío externo para el tráfico de ejecución de OpenClaw
summary: Cómo enrutar el tráfico HTTP y WebSocket del runtime de OpenClaw a través de un proxy de filtrado gestionado por el operador
title: Proxy de red
x-i18n:
    generated_at: "2026-07-05T11:43:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw puede enrutar el tráfico HTTP y WebSocket en tiempo de ejecución a través de un proxy de reenvío gestionado por el operador. Esta es una defensa en profundidad opcional: control centralizado de salida, protección SSRF más sólida y auditabilidad de destinos en el límite de red. Como el proxy evalúa el destino en el momento de la conexión, después de la resolución DNS e inmediatamente antes de abrir la conexión ascendente, también reduce la brecha de la que depende un ataque de reasignación de DNS entre una comprobación DNS anterior a nivel de aplicación y la conexión saliente real. Una sola política de proxy también ofrece a los operadores un punto único para aplicar reglas de destino, segmentación de red, límites de tasa o listas de permitidos de salida sin reconstruir OpenClaw.

OpenClaw no incluye, descarga, inicia, configura ni certifica un proxy. Tú ejecutas la tecnología de proxy que se ajuste a tu entorno; OpenClaw enruta sus propios clientes HTTP y WebSocket a través de ella.

## Configuración

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

También puedes definir la URL mediante el entorno mientras `proxy.enabled: true` permanece en la configuración:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` tiene prioridad sobre `OPENCLAW_PROXY_URL`. Si `proxy.enabled` es `true` pero no se resuelve ninguna URL válida, los comandos protegidos fallan al iniciar en lugar de volver al acceso directo a la red.

| Clave                | Tipo                                 | Predeterminado | Notas                                                                                                                                       |
| -------------------- | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | boolean                              | sin definir    | Debe ser `true` para activar el enrutamiento.                                                                                               |
| `proxy.proxyUrl`     | string                               | sin definir    | URL de proxy de reenvío `http://` o `https://`. Las credenciales incrustadas en la URL se tratan como sensibles y se redactan en instantáneas/registros. |
| `proxy.tls.caFile`   | string                               | sin definir    | Paquete de CA para verificar un endpoint de proxy `https://` firmado por una CA privada.                                                     |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | Controla el comportamiento de omisión de loopback; consulta más abajo.                                                                       |

Para servicios de Gateway gestionados, guarda la URL en la configuración para que sobreviva a la reinstalación, en lugar de depender del entorno en primer plano:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

La reserva de entorno `OPENCLAW_PROXY_URL` es mejor para ejecuciones en primer plano. Para usarla con un servicio instalado, colócala en el entorno persistente del servicio (`$OPENCLAW_STATE_DIR/.env`, predeterminado `~/.openclaw/.env`) y luego reinstala para que launchd/systemd/Tareas programadas la recojan.

### Endpoint de proxy HTTPS con una CA privada

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` verifica el certificado TLS propio del endpoint de proxy. No es una configuración de confianza MITM de destino, un certificado de cliente ni un sustituto de la política de destinos del proxy. Usa `NODE_EXTRA_CA_CERTS` en su lugar solo cuando todo el proceso Node deba confiar en una CA adicional desde el inicio (por ejemplo, un sistema empresarial de inspección TLS que vuelve a firmar cada certificado de destino HTTPS); esa variable es global al proceso y debe definirse antes de que Node se inicie, por lo que OpenClaw no puede aplicarla durante la ejecución como aplica `proxy.tls.caFile`. Prefiere `proxy.tls.caFile` para la confianza del endpoint de proxy HTTPS: está acotado al enrutamiento de proxy gestionado en lugar de a todo el proceso.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Cómo funciona el enrutamiento

Con `proxy.enabled: true` y una URL válida, los procesos protegidos en tiempo de ejecución (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) enrutan la salida HTTP y WebSocket normal a través del proxy:

```text
OpenClaw process
  fetch, node:http, node:https, WebSocket clients  -> operator proxy -> destination
```

Internamente, OpenClaw instala [Proxyline](https://github.com/openclaw/proxyline) como entorno de ejecución de enrutamiento a nivel de proceso. Cubre `fetch`, clientes basados en undici, `node:http`/`node:https`, clientes WebSocket comunes y túneles `CONNECT` creados por asistentes, y reemplaza los agentes HTTP de Node proporcionados por el llamador para que los agentes explícitos (incluidos `axios`, `got`, `node-fetch` y clientes similares basados en agentes de Node) no puedan omitir silenciosamente el proxy.

El esquema de URL del proxy describe el salto desde OpenClaw hasta el proxy, no hasta el destino final:

- `http://proxy.example:3128` — TCP simple hacia el proxy; OpenClaw envía solicitudes de proxy HTTP, incluido `CONNECT` para destinos HTTPS.
- `https://proxy.example:8443` — OpenClaw abre TLS hacia el propio proxy (verificando el certificado del proxy) y luego envía solicitudes de proxy HTTP dentro de esa sesión.

El TLS de destino es independiente del TLS del endpoint de proxy: para un destino HTTPS, OpenClaw siempre solicita al proxy un túnel `CONNECT` e inicia TLS de destino a través de ese túnel.

Mientras el proxy está activo, OpenClaw borra `no_proxy`/`NO_PROXY`. Esas listas de omisión se basan en destinos; dejar `localhost` o `127.0.0.1` allí permitiría que los objetivos SSRF omitieran el proxy por completo. Al apagarse, OpenClaw restaura el entorno de proxy anterior y restablece el estado de enrutamiento en caché.

Algunos plugins poseen un transporte personalizado que necesita su propio cableado de proxy incluso con el enrutamiento a nivel de proceso activo. El cliente de Bot API de Telegram usa su propio despachador HTTP/1 de undici y respeta por separado el entorno de proxy del proceso más la reserva `OPENCLAW_PROXY_URL`.

### Modo loopback de Gateway

Los clientes locales del plano de control de Gateway normalmente se conectan a un WebSocket de loopback como `ws://127.0.0.1:18789`. `proxy.loopbackMode` controla si ese tráfico omite el proxy gestionado:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

| Modo                     | Comportamiento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (predeterminado) | OpenClaw registra la autoridad de loopback de Gateway activa como una excepción de conexión directa, por lo que el tráfico WebSocket local de Gateway se conecta sin el proxy. Los puertos de loopback personalizados funcionan porque la excepción apunta al host/puerto configurado exacto. El plugin de navegador incluido registra el mismo tipo de excepción para las URL exactas locales de preparación CDP y WebSocket de DevTools de los navegadores gestionados iniciados por OpenClaw; el proveedor incluido de embeddings de memoria de Ollama tiene una ruta directa protegida más estrecha para su origen exacto configurado de embeddings de loopback local al host. |
| `proxy`                  | No se registran excepciones de loopback; el tráfico de loopback de Gateway y Ollama pasa por el proxy. Un proxy remoto debe poder enrutar de vuelta al servicio de loopback del host de OpenClaw (por ejemplo, mediante un nombre de host, IP o túnel alcanzable); un proxy remoto estándar resuelve `127.0.0.1`/`localhost` contra sí mismo, no contra el host de OpenClaw.                                                                                                                                                                                                                |
| `block`                  | OpenClaw deniega las conexiones de loopback del plano de control de Gateway y las conexiones protegidas de embeddings de loopback de Ollama antes de abrir un socket.                                                                                                                                                                                                                                                                                                                                                                                                                               |

La omisión del plano de control de Gateway se limita a `localhost` y URL con IP de loopback literal: usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789`. Otros nombres de host se enrutan como tráfico ordinario.

### Contenedores

Para comandos `openclaw --container ...`, OpenClaw reenvía `OPENCLAW_PROXY_URL` al CLI hijo dirigido al contenedor cuando está definido. La URL debe ser alcanzable desde dentro del contenedor: `127.0.0.1` allí se refiere al propio contenedor, no al host. OpenClaw rechaza las URL de proxy de loopback para comandos dirigidos a contenedores a menos que definas `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` para anular explícitamente esa comprobación.

## Términos de proxy relacionados

- `proxy.enabled` / `proxy.proxyUrl` — enrutamiento de proxy de reenvío saliente para salida en tiempo de ejecución. Esta página.
- `gateway.auth.mode: "trusted-proxy"` — autenticación entrante de proxy inverso con identidad para acceso a Gateway. Consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
- `openclaw proxy` — proxy de depuración local e inspector de capturas para desarrollo y soporte. Consulta [openclaw proxy](/es/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — opción explícita para que `web_fetch` permita que un proxy HTTP(S) de entorno controlado por el operador resuelva DNS, manteniendo de forma predeterminada una fijación DNS estricta y una política de nombre de host. Consulta [Obtención web](/es/tools/web-fetch#trusted-env-proxy).
- Configuraciones de proxy específicas de canal o proveedor — anulaciones específicas del propietario para un transporte. Prefiere el proxy de red gestionado para el control centralizado de salida en todo el entorno de ejecución.

## Validación del proxy

La política de destinos del proxy es el límite de seguridad real; OpenClaw no puede verificar que tu proxy bloquee los objetivos correctos. Configúralo para:

- Enlazarse solo a loopback o a una interfaz privada de confianza, alcanzable únicamente por el proceso/host/contenedor/cuenta de servicio de OpenClaw.
- Resolver destinos por sí mismo y bloquear por IP después de la resolución DNS, en el momento de la conexión, tanto para HTTP simple como para túneles HTTPS `CONNECT`.
- Rechazar omisiones basadas en destino para rangos de loopback, privados, de enlace local, metadatos, multidifusión, reservados y de documentación.
- Evitar listas de permitidos de nombres de host a menos que confíes plenamente en la ruta de resolución DNS.
- Registrar destino, decisión, estado y motivo; nunca cuerpos de solicitud, encabezados de autorización, cookies u otros secretos.
- Mantener la política bajo control de versiones y revisar los cambios como sensibles para la seguridad.

Valida desde el mismo host/contenedor/cuenta de servicio que ejecuta OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Con un endpoint de proxy HTTPS de CA privada:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Opción                   | Propósito                                                            |
| ------------------------ | -------------------------------------------------------------------- |
| `--proxy-url <url>`      | Validar esta URL en lugar de resolver config/env.                    |
| `--proxy-ca-file <path>` | Paquete de CA para un endpoint de proxy HTTPS.                       |
| `--allowed-url <url>`    | Destino que se espera que tenga éxito (repetible).                   |
| `--denied-url <url>`     | Destino que se espera que se bloquee (repetible).                    |
| `--apns-reachable`       | Verificar también que el proxy pueda tunelizar una sonda HTTP/2 directa al sandbox de APNs. |
| `--apns-authority <url>` | Sobrescribir la autoridad de APNs sondeada con `--apns-reachable`.   |
| `--timeout-ms <ms>`      | Tiempo de espera por solicitud.                                      |
| `--json`                 | Salida legible por máquina.                                          |

Si `proxy.enabled` no es `true` y no se proporciona `--proxy-url`, el comando informa un problema de configuración en lugar de validar; pasa `--proxy-url` para una comprobación previa puntual antes de cambiar la configuración.

Sin `--allowed-url`/`--denied-url`, las comprobaciones predeterminadas son: `https://example.com/` debe tener éxito, y debe bloquearse un servidor canario de loopback temporal al que el proxy no debe llegar. La comprobación de loopback pasa si hay un fallo de transporte, o con una respuesta que no sea 2xx y que no contenga el token por ejecución del canario; falla con una respuesta 2xx sin el token (un éxito inesperado de algo distinto del canario) y, especialmente, con cualquier respuesta que lleve el token coincidente, ya que eso prueba que el proxy realmente reenvió un destino de loopback que debería haber denegado. Los destinos personalizados de `--denied-url` no tienen ese token canario, así que fallan de forma cerrada: cualquier respuesta HTTP cuenta como alcanzable (fallo), y un error de transporte se informa como no concluyente en lugar de probado como bloqueado, porque OpenClaw no puede confirmar si tu proxy denegó un origen alcanzable o si ocurrió algún otro problema. `--apns-reachable` envía un token de proveedor intencionalmente no válido, por lo que una respuesta `403 InvalidProviderToken` cuenta como prueba de que el túnel llegó a Apple. El comando sale con `1` ante cualquier fallo de validación; las credenciales de la URL del proxy se redactan tanto en la salida de texto como en la JSON.

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

Comprobación manual con `curl` (la solicitud pública debería tener éxito; las solicitudes de loopback y de metadatos deberían ser bloqueadas por el propio proxy — `curl` por sí solo no puede distinguir una denegación del proxy de un origen inalcanzable del modo en que puede hacerlo el canario integrado de `openclaw proxy validate`):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Destinos bloqueados recomendados

Lista de denegación inicial para cualquier proxy de reenvío, firewall o política de egreso. El clasificador SSRF propio de OpenClaw vive en `src/infra/net/ssrf.ts` y `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, el prefijo de benchmark RFC 2544 y el manejo de IPv4 incrustado para formas NAT64/6to4/Teredo/ISATAP/IPv4-mapped): referencias útiles, pero OpenClaw no exporta ni aplica estas reglas en tu proxy externo.

| Rango o host                                                                         | Por qué bloquear                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                     |
| `::1/128`                                                                            | Loopback IPv6                                     |
| `0.0.0.0/8`, `::/128`                                                                | Direcciones no especificadas / de esta red        |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC 1918                           |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local, incluidas rutas comunes de metadatos en la nube |
| `169.254.169.254`, `metadata.google.internal`                                        | Servicios de metadatos en la nube                 |
| `100.64.0.0/10`                                                                      | Espacio de direcciones compartidas de NAT de grado operador |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rangos de benchmark                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rangos de uso especial y documentación            |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multidifusión                                     |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                    |
| `fc00::/7`, `fec0::/10`                                                              | Rangos IPv6 locales/privados                      |
| `100::/64`, `2001:20::/28`                                                           | Rangos IPv6 de descarte y ORCHIDv2                |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefijos NAT64 con IPv4 incrustado                |
| `2002::/16`, `2001::/32`                                                             | 6to4 y Teredo con IPv4 incrustado                 |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatible con IPv4 y IPv4-mapped            |

Agrega cualquier host de metadatos o rango reservado adicional que documente tu proveedor de nube o plataforma de red.

## Límites

| Superficie                                                   | Estado del proxy administrado                                                                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, clientes WebSocket comunes | Enrutados mediante hooks de proxy administrado cuando están configurados.                                                                                 |
| HTTP/2 directo de APNs                                       | Enrutado mediante el helper `CONNECT` administrado de APNs.                                                                                              |
| local loopback del plano de control de Gateway                | Directo solo para la URL exacta configurada del Gateway local loopback.                                                                                   |
| Reenvío upstream del proxy de depuración                     | Deshabilitado mientras el modo de proxy administrado está activo, salvo que se habilite explícitamente para diagnósticos locales.                         |
| IRC                                                          | TCP/TLS sin procesar; no se proxifica mediante el modo de proxy HTTP administrado. Configura `channels.irc.enabled: false` si tu despliegue requiere que todo el egreso pase por el proxy de reenvío. |
| Otras llamadas de cliente `net`, `tls` o `http2` sin procesar | Deben ser clasificadas por la protección de sockets sin procesar antes de aterrizar.                                                                      |

- Esta es cobertura a nivel de proceso para clientes HTTP/WebSocket de JavaScript, no un sandbox de red a nivel de SO.
- Los sockets `net`, `tls`, `http2` sin procesar, los complementos nativos y los procesos secundarios que no son de OpenClaw pueden omitir el enrutamiento a nivel de Node salvo que hereden y respeten las variables de entorno de proxy. Las CLI secundarias bifurcadas de OpenClaw heredan la URL del proxy administrado y el estado de `proxy.loopbackMode`.
- Las WebUI locales del usuario y los servidores de modelos locales no están cubiertos por una omisión general de red local: inclúyelos en la lista de permitidos de la política de proxy del operador si es necesario. La excepción es la ruta directa protegida del proveedor de embeddings de memoria Ollama incluido, limitada al origen exacto de host local loopback desde su `baseUrl` configurada; los hosts Ollama de LAN, tailnet, red privada y públicos siguen usando el proxy administrado.
- El reenvío upstream directo del proxy de depuración local (para solicitudes de proxy y túneles `CONNECT`) está deshabilitado de forma predeterminada mientras el modo de proxy administrado está activo; habilítalo solo para diagnósticos locales aprobados.
- OpenClaw no inspecciona, prueba ni certifica tu política de proxy. Trata los cambios en la política de proxy como cambios operativos sensibles para la seguridad.
