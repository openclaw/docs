---
read_when:
    - Desea contar con defensa en profundidad contra ataques SSRF y de revinculación de DNS
    - Configurar un proxy directo externo para el tráfico en tiempo de ejecución de OpenClaw
summary: Cómo enrutar el tráfico HTTP y WebSocket del tiempo de ejecución de OpenClaw a través de un proxy de filtrado gestionado por el operador
title: Proxy de red
x-i18n:
    generated_at: "2026-05-07T16:23:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22895b7c5521927b7145f55dff9b777e701691f01a6421db0f5b1ff489734775
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw puede enrutar el tráfico HTTP y WebSocket en tiempo de ejecución a través de un proxy directo gestionado por el operador. Esta es una defensa opcional en profundidad para implementaciones que quieren control centralizado de salida, protección SSRF más sólida y mejor auditabilidad de red.

OpenClaw no incluye, descarga, inicia, configura ni certifica un proxy. Tú ejecutas la tecnología de proxy que se ajuste a tu entorno, y OpenClaw enruta a través de ella los clientes HTTP y WebSocket normales locales al proceso.

## Por qué usar un proxy

Un proxy ofrece a los operadores un único punto de control de red para el tráfico HTTP y WebSocket saliente. Eso puede ser útil incluso fuera del refuerzo contra SSRF:

- Política central: mantener una sola política de salida en lugar de depender de que cada punto de llamada HTTP de la aplicación aplique correctamente las reglas de red.
- Comprobaciones en tiempo de conexión: evaluar el destino después de la resolución DNS e inmediatamente antes de que el proxy abra la conexión ascendente.
- Defensa contra DNS rebinding: reducir la brecha entre una comprobación DNS a nivel de aplicación y la conexión saliente real.
- Cobertura más amplia de JavaScript: enrutar clientes ordinarios como `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch y similares por la misma ruta.
- Auditabilidad: registrar destinos permitidos y denegados en el límite de salida.
- Control operativo: aplicar reglas de destino, segmentación de red, límites de tasa o listas de permitidos salientes sin reconstruir OpenClaw.

El enrutamiento por proxy es una barrera de seguridad a nivel de proceso para la salida HTTP y WebSocket normal. Ofrece a los operadores una ruta de cierre seguro para enrutar clientes HTTP de JavaScript compatibles a través de su propio proxy de filtrado, pero no es un sandbox de red a nivel de sistema operativo y no hace que OpenClaw certifique la política de destinos del proxy.

## Cómo enruta OpenClaw el tráfico

Cuando `proxy.enabled=true` y hay una URL de proxy configurada, los procesos de tiempo de ejecución protegidos, como `openclaw gateway run`, `openclaw node run` y `openclaw agent --local`, enrutan la salida HTTP y WebSocket normal a través del proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

El contrato público es el comportamiento de enrutamiento, no los hooks internos de Node usados para implementarlo. Los clientes WebSocket del plano de control de OpenClaw Gateway usan una ruta directa estrecha para el tráfico RPC de Gateway por local loopback cuando la URL de Gateway usa `localhost` o una IP literal de loopback, como `127.0.0.1` o `[::1]`. Esa ruta del plano de control debe poder alcanzar Gateways de loopback incluso cuando el proxy del operador bloquea destinos de loopback. Las solicitudes HTTP y WebSocket normales de tiempo de ejecución siguen usando el proxy configurado.

Internamente, OpenClaw usa dos hooks de enrutamiento a nivel de proceso para esta función:

- El enrutamiento del despachador de Undici cubre `fetch`, clientes respaldados por undici y transportes que proporcionan su propio despachador de undici.
- El enrutamiento de `global-agent` cubre llamadores del núcleo de Node `node:http` y `node:https`, incluidas muchas bibliotecas construidas sobre `http.request`, `https.request`, `http.get` y `https.get`. El modo de proxy gestionado fuerza ese agente global para que los agentes HTTP explícitos de Node no eviten accidentalmente el proxy del operador.

Algunos plugins poseen transportes personalizados que necesitan cableado explícito de proxy incluso cuando existe enrutamiento a nivel de proceso. Por ejemplo, el transporte de la API Bot de Telegram usa su propio despachador HTTP/1 de undici y, por lo tanto, respeta el entorno de proxy del proceso más la alternativa gestionada `OPENCLAW_PROXY_URL` en esa ruta de transporte específica del propietario.

La URL del proxy debe usar `http://`. Los destinos HTTPS siguen siendo compatibles a través del proxy con HTTP `CONNECT`; esto solo significa que OpenClaw espera un listener de proxy directo HTTP simple, como `http://127.0.0.1:3128`.

Mientras el proxy está activo, OpenClaw borra `no_proxy`, `NO_PROXY` y `GLOBAL_AGENT_NO_PROXY`. Esas listas de bypass se basan en el destino, por lo que dejar `localhost` o `127.0.0.1` allí permitiría que objetivos SSRF de alto riesgo omitieran el proxy de filtrado.

Al apagar, OpenClaw restaura el entorno de proxy anterior y restablece el estado de enrutamiento del proceso en caché.

## Términos de proxy relacionados

- `proxy.enabled` / `proxy.proxyUrl`: enrutamiento saliente por proxy directo para la salida de tiempo de ejecución de OpenClaw. Esta página documenta esa función.
- `gateway.auth.mode: "trusted-proxy"`: autenticación entrante mediante proxy inverso con identidad para el acceso a Gateway. Consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy local de depuración e inspector de captura para desarrollo y soporte. Consulta [openclaw proxy](/es/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opción explícita para que `web_fetch` permita que un proxy HTTP(S) de entorno controlado por el operador resuelva DNS, manteniendo la fijación DNS estricta predeterminada y la política de nombres de host. Consulta [Web fetch](/es/tools/web-fetch#trusted-env-proxy).
- Configuración de proxy específica de canal o proveedor: anulaciones específicas del propietario para un transporte concreto. Prefiere el proxy de red gestionado cuando el objetivo sea el control centralizado de salida en todo el tiempo de ejecución.

## Configuración

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

También puedes proporcionar la URL mediante el entorno, manteniendo `proxy.enabled=true` en la configuración:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` tiene prioridad sobre `OPENCLAW_PROXY_URL`.

### Modo de loopback de Gateway

Los clientes locales del plano de control de Gateway suelen conectarse a un WebSocket de loopback como `ws://127.0.0.1:18789`. Usa `proxy.loopbackMode` para elegir cómo se comporta ese tráfico mientras el proxy gestionado está activo:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (predeterminado): OpenClaw registra la autoridad de loopback de Gateway en el controlador `NO_PROXY` activo de `global-agent` para que el tráfico WebSocket local de Gateway pueda conectarse directamente. Los puertos personalizados de Gateway en loopback funcionan porque se registran el host y el puerto de la URL activa de Gateway.
- `proxy`: OpenClaw no registra una autoridad `NO_PROXY` de loopback de Gateway, por lo que el tráfico local de Gateway se envía a través del proxy gestionado. Si el proxy es remoto, debe proporcionar enrutamiento especial para el servicio de loopback del host de OpenClaw, como asignarlo a un nombre de host, IP o túnel alcanzable por el proxy. Los proxies remotos estándar resuelven `127.0.0.1` y `localhost` desde el host del proxy, no desde el host de OpenClaw.
- `block`: OpenClaw deniega las conexiones del plano de control de Gateway por loopback antes de abrir un socket.

Si `enabled=true` pero no hay configurada una URL de proxy válida, los comandos protegidos fallan al iniciar en lugar de volver al acceso directo a la red.

Para servicios gestionados de gateway iniciados con `openclaw gateway start`, prefiere almacenar la URL en la configuración:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

La alternativa de entorno es mejor para ejecuciones en primer plano. Si la usas con un servicio instalado, coloca `OPENCLAW_PROXY_URL` en el entorno duradero del servicio, como `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, y luego reinstala el servicio para que launchd, systemd o Scheduled Tasks inicie el gateway con ese valor.

Para comandos `openclaw --container ...`, OpenClaw reenvía `OPENCLAW_PROXY_URL` al CLI hijo dirigido al contenedor cuando está definido. La URL debe ser alcanzable desde dentro del contenedor; `127.0.0.1` se refiere al propio contenedor, no al host. OpenClaw rechaza las URL de proxy de loopback para comandos dirigidos al contenedor, salvo que anules explícitamente esa comprobación de seguridad.

## Requisitos del proxy

La política del proxy es el límite de seguridad. OpenClaw no puede verificar que el proxy bloquee los objetivos correctos.

Configura el proxy para:

- Escuchar solo en loopback o en una interfaz privada de confianza.
- Restringir el acceso para que solo el proceso, host, contenedor o cuenta de servicio de OpenClaw pueda usarlo.
- Resolver los destinos por sí mismo y bloquear las IP de destino después de la resolución DNS.
- Aplicar la política en tiempo de conexión tanto para solicitudes HTTP simples como para túneles HTTPS `CONNECT`.
- Rechazar bypasses basados en destino para rangos de loopback, privados, link-local, metadatos, multicast, reservados o de documentación.
- Evitar listas de permitidos de nombres de host salvo que confíes plenamente en la ruta de resolución DNS.
- Registrar destino, decisión, estado y motivo sin registrar cuerpos de solicitud, encabezados de autorización, cookies u otros secretos.
- Mantener la política del proxy bajo control de versiones y revisar los cambios como configuración sensible para la seguridad.

## Destinos bloqueados recomendados

Usa esta lista de denegación como punto de partida para cualquier proxy directo, firewall o política de salida.

La lógica de clasificación a nivel de aplicación de OpenClaw vive en `src/infra/net/ssrf.ts` y `src/shared/net/ip.ts`. Los hooks de paridad relevantes son `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` y el manejo de centinelas IPv4 incrustadas para NAT64, 6to4, Teredo, ISATAP y formas IPv4-mapped. Esos archivos son referencias útiles al mantener una política de proxy externa, pero OpenClaw no exporta ni aplica automáticamente esas reglas en tu proxy.

| Rango o host                                                                         | Por qué bloquear                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Direcciones no especificadas y de esta red           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC1918                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Direcciones link-local y rutas comunes de metadatos de nube |
| `169.254.169.254`, `metadata.google.internal`                                        | Servicios de metadatos de nube                       |
| `100.64.0.0/10`                                                                      | Espacio de direcciones compartido de NAT de grado operador |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rangos de benchmarking                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rangos de uso especial y documentación               |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                       |
| `fc00::/7`, `fec0::/10`                                                              | Rangos locales/privados IPv6                         |
| `100::/64`, `2001:20::/28`                                                           | Rangos IPv6 discard y ORCHIDv2                       |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefijos NAT64 con IPv4 incrustada                   |
| `2002::/16`, `2001::/32`                                                             | 6to4 y Teredo con IPv4 incrustada                    |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatible con IPv4 e IPv4-mapped               |

Si tu proveedor de nube o plataforma de red documenta hosts de metadatos o rangos reservados adicionales, agrégalos también.

## Validación

Valida el proxy desde el mismo host, contenedor o cuenta de servicio que ejecuta OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

De forma predeterminada, cuando no se proporcionan destinos personalizados, el comando comprueba que `https://example.com/` se complete correctamente e inicia un canario temporal de loopback que el proxy no debe alcanzar. La comprobación denegada predeterminada pasa cuando el proxy devuelve una respuesta de denegación no 2xx o bloquea el canario con un fallo de transporte; falla si una respuesta correcta llega al canario. Si no hay ningún proxy habilitado y configurado, la validación informa un problema de configuración; usa `--proxy-url` para una comprobación previa puntual antes de cambiar la configuración. Usa `--allowed-url` y `--denied-url` para probar expectativas específicas del despliegue. Añade `--apns-reachable` para verificar también que la entrega directa de APNs por HTTP/2 puede abrir un túnel CONNECT a través del proxy y recibir una respuesta de APNs sandbox; la prueba usa un token de proveedor intencionalmente no válido, por lo que se espera `403 InvalidProviderToken` y cuenta como alcanzable. Los destinos denegados personalizados fallan en modo cerrado: cualquier respuesta HTTP significa que el destino era alcanzable a través del proxy, y cualquier error de transporte se informa como inconcluso porque OpenClaw no puede demostrar que el proxy haya bloqueado un origen alcanzable. Si la validación falla, el comando sale con el código 1.

Usa `--json` para automatización. La salida JSON contiene el resultado general, el origen efectivo de la configuración del proxy, cualquier error de configuración y cada comprobación de destino. Las credenciales de la URL del proxy se redactan en la salida de texto y JSON:

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
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

También puedes validar manualmente con `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

La solicitud pública debería completarse correctamente. El proxy debería bloquear las solicitudes de loopback y metadatos. Para `openclaw proxy validate`, el canario de loopback integrado puede distinguir una denegación del proxy de un origen alcanzable. Las comprobaciones personalizadas de `--denied-url` no tienen ese canario, así que trata tanto las respuestas HTTP como los fallos de transporte ambiguos como fallos de validación, a menos que tu proxy exponga una señal de denegación específica del despliegue que puedas verificar por separado.

Luego habilita el enrutamiento del proxy de OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

o configura:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Límites

- El proxy mejora la cobertura para clientes HTTP y WebSocket de JavaScript locales al proceso, pero no es un sandbox de red a nivel de sistema operativo.
- El tráfico de plano de control de loopback del Gateway usa de forma predeterminada una omisión local directa mediante `proxy.loopbackMode: "gateway-only"`. OpenClaw implementa esa omisión registrando la autoridad de loopback activa del Gateway en el controlador gestionado `global-agent` `NO_PROXY`. Los operadores pueden establecer `proxy.loopbackMode: "proxy"` para enviar el tráfico de loopback del Gateway a través del proxy gestionado, o `proxy.loopbackMode: "block"` para denegar conexiones de loopback del Gateway. Consulta [Modo de loopback del Gateway](#gateway-loopback-mode) para la salvedad del proxy remoto.
- Los sockets `net`, `tls` y `http2` sin procesar, los complementos nativos y los procesos secundarios que no son de OpenClaw pueden omitir el enrutamiento de proxy a nivel de Node, a menos que hereden y respeten las variables de entorno del proxy. Las CLI secundarias bifurcadas de OpenClaw heredan la URL del proxy gestionado y el estado de `proxy.loopbackMode`.
- IRC es un canal TCP/TLS sin procesar fuera del enrutamiento por proxy directo gestionado por el operador. En despliegues que requieren toda la salida a través de ese proxy directo, establece `channels.irc.enabled=false` a menos que la salida directa de IRC esté aprobada explícitamente.
- El proxy de depuración local es una herramienta de diagnóstico, y su reenvío ascendente directo para solicitudes de proxy y túneles CONNECT está deshabilitado de forma predeterminada mientras el modo de proxy gestionado está activo; habilita el reenvío directo solo para diagnósticos locales aprobados.
- Las WebUI locales del usuario y los servidores de modelos locales deben incluirse en la lista de permitidos de la política de proxy del operador cuando sea necesario; OpenClaw no expone una omisión general de red local para ellos.
- La omisión de proxy del plano de control del Gateway se limita intencionalmente a `localhost` y a URL con IP de loopback literales. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` para conexiones locales directas del plano de control del Gateway; otros nombres de host se enrutan como tráfico ordinario basado en nombre de host.
- OpenClaw no inspecciona, prueba ni certifica tu política de proxy.
- Trata los cambios de política de proxy como cambios operativos sensibles para la seguridad.

| Superficie                                                   | Estado del proxy gestionado                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `fetch`, `node:http`, `node:https`, clientes WebSocket comunes | Enrutado a través de hooks de proxy gestionado cuando está configurado.                                |
| HTTP/2 directo de APNs                                       | Enrutado a través del helper CONNECT gestionado de APNs.                                               |
| Loopback del plano de control del Gateway                    | Directo solo para la URL local de loopback del Gateway configurada.                                    |
| Reenvío ascendente del proxy de depuración                   | Deshabilitado mientras el modo de proxy gestionado está activo, salvo que se habilite explícitamente para diagnósticos locales. |
| IRC                                                          | TCP/TLS sin procesar; no se proxifica mediante el modo de proxy HTTP gestionado. Deshabilítalo salvo que la salida directa de IRC esté aprobada. |
| Otras llamadas de cliente `net`, `tls` o `http2` sin procesar | Deben ser clasificadas por la protección de sockets sin procesar antes de integrarse.                  |
