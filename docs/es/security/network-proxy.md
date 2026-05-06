---
read_when:
    - Quieres defensa en profundidad contra ataques SSRF y de revinculación de DNS
    - Configurar un proxy directo externo para el tráfico en tiempo de ejecución de OpenClaw
summary: Cómo enrutar el tráfico HTTP y WebSocket en tiempo de ejecución de OpenClaw a través de un proxy de filtrado gestionado por el operador
title: Proxy de red
x-i18n:
    generated_at: "2026-05-06T18:01:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw puede enrutar el tráfico HTTP y WebSocket en tiempo de ejecución a través de un proxy de reenvío administrado por el operador. Esto es defensa en profundidad opcional para despliegues que quieren control centralizado de salida, protección SSRF más sólida y mejor capacidad de auditoría de red.

OpenClaw no incluye, descarga, inicia, configura ni certifica un proxy. Tú ejecutas la tecnología de proxy que se adapte a tu entorno, y OpenClaw enruta los clientes HTTP y WebSocket normales locales al proceso a través de él.

## Por qué usar un proxy

Un proxy da a los operadores un único punto de control de red para el tráfico HTTP y WebSocket saliente. Eso puede ser útil incluso fuera del endurecimiento frente a SSRF:

- Política centralizada: mantén una política de salida en lugar de depender de que cada punto de llamada HTTP de la aplicación aplique correctamente las reglas de red.
- Comprobaciones en tiempo de conexión: evalúa el destino después de la resolución DNS e inmediatamente antes de que el proxy abra la conexión ascendente.
- Defensa contra DNS rebinding: reduce la brecha entre una comprobación DNS a nivel de aplicación y la conexión saliente real.
- Cobertura más amplia de JavaScript: enruta clientes ordinarios de `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch y similares por la misma ruta.
- Auditabilidad: registra los destinos permitidos y denegados en el límite de salida.
- Control operativo: aplica reglas de destino, segmentación de red, límites de velocidad o listas de permitidos salientes sin recompilar OpenClaw.

El enrutamiento por proxy es una barrera de protección a nivel de proceso para la salida HTTP y WebSocket normal. Da a los operadores una ruta que falla cerrada para enrutar clientes HTTP JavaScript compatibles a través de su propio proxy de filtrado, pero no es un entorno aislado de red a nivel de sistema operativo y no hace que OpenClaw certifique la política de destinos del proxy.

## Cómo OpenClaw enruta el tráfico

Cuando `proxy.enabled=true` y se configura una URL de proxy, los procesos de tiempo de ejecución protegidos, como `openclaw gateway run`, `openclaw node run` y `openclaw agent --local`, enrutan la salida HTTP y WebSocket normal a través del proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

El contrato público es el comportamiento de enrutamiento, no los hooks internos de Node usados para implementarlo. Los clientes WebSocket del plano de control de OpenClaw Gateway usan una ruta directa estrecha para el tráfico RPC del Gateway local loopback cuando la URL del Gateway usa `localhost` o una IP literal de loopback como `127.0.0.1` o `[::1]`. Esa ruta del plano de control debe poder alcanzar Gateways de loopback incluso cuando el proxy del operador bloquea destinos de loopback. Las solicitudes HTTP y WebSocket normales en tiempo de ejecución siguen usando el proxy configurado.

Internamente, OpenClaw usa dos hooks de enrutamiento a nivel de proceso para esta función:

- El enrutamiento del despachador de Undici cubre `fetch`, clientes basados en undici y transportes que proporcionan su propio despachador de undici.
- El enrutamiento de `global-agent` cubre llamadores del núcleo de Node `node:http` y `node:https`, incluidas muchas bibliotecas construidas sobre `http.request`, `https.request`, `http.get` y `https.get`. El modo de proxy administrado fuerza ese agente global para que los agentes HTTP explícitos de Node no omitan accidentalmente el proxy del operador.

Algunos plugins son propietarios de transportes personalizados que necesitan cableado explícito de proxy incluso cuando existe enrutamiento a nivel de proceso. Por ejemplo, el transporte de Bot API de Telegram usa su propio despachador HTTP/1 de undici y por tanto respeta las variables de entorno de proxy del proceso más el respaldo administrado `OPENCLAW_PROXY_URL` en esa ruta de transporte específica del propietario.

La URL del proxy en sí debe usar `http://`. Los destinos HTTPS siguen siendo compatibles a través del proxy con HTTP `CONNECT`; esto solo significa que OpenClaw espera un listener de proxy de reenvío HTTP sin cifrar, como `http://127.0.0.1:3128`.

Mientras el proxy está activo, OpenClaw borra `no_proxy`, `NO_PROXY` y `GLOBAL_AGENT_NO_PROXY`. Esas listas de omisión se basan en el destino, así que dejar `localhost` o `127.0.0.1` allí permitiría que destinos SSRF de alto riesgo evitaran el proxy de filtrado.

Al apagar, OpenClaw restaura el entorno de proxy anterior y restablece el estado de enrutamiento de proceso en caché.

## Términos de proxy relacionados

- `proxy.enabled` / `proxy.proxyUrl`: enrutamiento de proxy de reenvío saliente para la salida en tiempo de ejecución de OpenClaw. Esta página documenta esa función.
- `gateway.auth.mode: "trusted-proxy"`: autenticación de proxy inverso entrante con reconocimiento de identidad para el acceso al Gateway. Consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy de depuración local e inspector de captura para desarrollo y soporte. Consulta [openclaw proxy](/es/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opción explícita para que `web_fetch` permita que un proxy HTTP(S) de entorno controlado por el operador resuelva DNS mientras mantiene la fijación DNS estricta y la política de nombres de host predeterminadas. Consulta [Obtención web](/es/tools/web-fetch#trusted-env-proxy).
- Configuraciones de proxy específicas de canal o proveedor: anulaciones específicas del propietario para un transporte concreto. Prefiere el proxy de red administrado cuando el objetivo es el control centralizado de salida en todo el tiempo de ejecución.

## Configuración

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

También puedes proporcionar la URL a través del entorno, manteniendo `proxy.enabled=true` en la configuración:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` tiene prioridad sobre `OPENCLAW_PROXY_URL`.

### Modo de loopback de Gateway

Los clientes locales del plano de control del Gateway suelen conectarse a un WebSocket de loopback como `ws://127.0.0.1:18789`. Usa `proxy.loopbackMode` para elegir cómo se comporta ese tráfico mientras el proxy administrado está activo:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (predeterminado): OpenClaw registra la autoridad de loopback del Gateway en el controlador `NO_PROXY` activo de `global-agent` para que el tráfico WebSocket local del Gateway pueda conectarse directamente. Los puertos personalizados del Gateway de loopback funcionan porque se registran el host y el puerto de la URL activa del Gateway.
- `proxy`: OpenClaw no registra una autoridad `NO_PROXY` de loopback del Gateway, por lo que el tráfico local del Gateway se envía a través del proxy administrado. Si el proxy es remoto, debe proporcionar enrutamiento especial para el servicio de loopback del host de OpenClaw, como asignarlo a un nombre de host, IP o túnel alcanzable por el proxy. Los proxies remotos estándar resuelven `127.0.0.1` y `localhost` desde el host del proxy, no desde el host de OpenClaw.
- `block`: OpenClaw deniega las conexiones de plano de control del Gateway de loopback antes de abrir un socket.

Si `enabled=true` pero no hay configurada una URL de proxy válida, los comandos protegidos fallan al iniciar en lugar de volver al acceso directo a la red.

Para servicios de gateway administrados iniciados con `openclaw gateway start`, prefiere almacenar la URL en la configuración:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

El respaldo de entorno es mejor para ejecuciones en primer plano. Si lo usas con un servicio instalado, pon `OPENCLAW_PROXY_URL` en el entorno durable del servicio, como `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, y luego reinstala el servicio para que launchd, systemd o Scheduled Tasks inicie el gateway con ese valor.

Para comandos `openclaw --container ...`, OpenClaw reenvía `OPENCLAW_PROXY_URL` al CLI hijo dirigido al contenedor cuando está establecido. La URL debe ser alcanzable desde dentro del contenedor; `127.0.0.1` se refiere al contenedor mismo, no al host. OpenClaw rechaza URL de proxy de loopback para comandos dirigidos a contenedores salvo que anules explícitamente esa comprobación de seguridad.

## Requisitos del proxy

La política del proxy es el límite de seguridad. OpenClaw no puede verificar que el proxy bloquee los objetivos correctos.

Configura el proxy para:

- Vincularse solo a loopback o a una interfaz privada de confianza.
- Restringir el acceso para que solo el proceso, host, contenedor o cuenta de servicio de OpenClaw pueda usarlo.
- Resolver los destinos por sí mismo y bloquear IP de destino después de la resolución DNS.
- Aplicar la política en tiempo de conexión tanto para solicitudes HTTP sin cifrar como para túneles HTTPS `CONNECT`.
- Rechazar omisiones basadas en destino para rangos de loopback, privados, link-local, metadatos, multidifusión, reservados o de documentación.
- Evitar listas de permitidos de nombres de host salvo que confíes plenamente en la ruta de resolución DNS.
- Registrar destino, decisión, estado y motivo sin registrar cuerpos de solicitud, encabezados de autorización, cookies u otros secretos.
- Mantener la política del proxy bajo control de versiones y revisar los cambios como configuración sensible para la seguridad.

## Destinos bloqueados recomendados

Usa esta lista de denegación como punto de partida para cualquier proxy de reenvío, firewall o política de salida.

La lógica de clasificación a nivel de aplicación de OpenClaw vive en `src/infra/net/ssrf.ts` y `src/shared/net/ip.ts`. Los hooks de paridad relevantes son `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` y el manejo centinela IPv4 incrustado para NAT64, 6to4, Teredo, ISATAP y formas IPv4 mapeadas. Esos archivos son referencias útiles al mantener una política de proxy externa, pero OpenClaw no exporta ni aplica automáticamente esas reglas en tu proxy.

| Rango u host                                                                         | Por qué bloquear                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                       |
| `::1/128`                                                                            | Loopback IPv6                                       |
| `0.0.0.0/8`, `::/128`                                                                | Direcciones no especificadas y de esta red          |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC1918                              |
| `169.254.0.0/16`, `fe80::/10`                                                        | Direcciones link-local y rutas comunes de metadatos de nube |
| `169.254.169.254`, `metadata.google.internal`                                        | Servicios de metadatos de nube                      |
| `100.64.0.0/10`                                                                      | Espacio de direcciones compartido NAT de grado operador |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rangos de benchmarking                              |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rangos de uso especial y documentación              |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multidifusión                                       |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                      |
| `fc00::/7`, `fec0::/10`                                                              | Rangos locales/privados IPv6                        |
| `100::/64`, `2001:20::/28`                                                           | Rangos IPv6 discard y ORCHIDv2                      |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefijos NAT64 con IPv4 incrustado                  |
| `2002::/16`, `2001::/32`                                                             | 6to4 y Teredo con IPv4 incrustado                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatible con IPv4 y mapeado a IPv4           |

Si tu proveedor de nube o plataforma de red documenta hosts de metadatos o rangos reservados adicionales, añádelos también.

## Validación

Valida el proxy desde el mismo host, contenedor o cuenta de servicio que ejecuta OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

De forma predeterminada, cuando no se proporcionan destinos personalizados, el comando comprueba que `https://example.com/` se complete correctamente e inicia un canary temporal de loopback que el proxy no debe alcanzar. La comprobación denegada predeterminada pasa cuando el proxy devuelve una respuesta de denegación que no es 2xx o bloquea el canary con un fallo de transporte; falla si una respuesta correcta llega al canary. Si no hay ningún proxy habilitado y configurado, la validación informa de un problema de configuración; usa `--proxy-url` para una comprobación previa puntual antes de cambiar la configuración. Usa `--allowed-url` y `--denied-url` para probar expectativas específicas del despliegue. Añade `--apns-reachable` para verificar también que la entrega directa HTTP/2 de APNs puede abrir un túnel CONNECT a través del proxy y recibir una respuesta de APNs de sandbox; la sonda usa un token de proveedor intencionadamente no válido, por lo que se espera `403 InvalidProviderToken` y cuenta como alcanzable. Los destinos denegados personalizados fallan en modo cerrado: cualquier respuesta HTTP significa que el destino fue alcanzable a través del proxy, y cualquier error de transporte se informa como no concluyente porque OpenClaw no puede demostrar que el proxy bloqueó un origen alcanzable. Si la validación falla, el comando sale con el código 1.

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

La solicitud pública debería completarse correctamente. Las solicitudes de loopback y de metadatos deberían ser bloqueadas por el proxy. Para `openclaw proxy validate`, el canary de loopback integrado puede distinguir una denegación del proxy de un origen alcanzable. Las comprobaciones personalizadas de `--denied-url` no tienen ese canary, así que trata tanto las respuestas HTTP como los fallos de transporte ambiguos como fallos de validación, a menos que tu proxy exponga una señal de denegación específica del despliegue que puedas verificar por separado.

Luego habilita el enrutamiento por proxy de OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

o establece:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Límites

- El proxy mejora la cobertura para clientes JavaScript HTTP y WebSocket locales al proceso, pero no es un sandbox de red a nivel del sistema operativo.
- El tráfico de plano de control de loopback del Gateway se dirige de forma predeterminada mediante una omisión local directa a través de `proxy.loopbackMode: "gateway-only"`. OpenClaw implementa esa omisión registrando la autoridad de loopback del Gateway activo en el controlador `NO_PROXY` gestionado de `global-agent`. Los operadores pueden establecer `proxy.loopbackMode: "proxy"` para enviar el tráfico de loopback del Gateway a través del proxy gestionado, o `proxy.loopbackMode: "block"` para denegar las conexiones de loopback del Gateway. Consulta [Modo de loopback del Gateway](#gateway-loopback-mode) para la advertencia sobre proxy remoto.
- Los sockets sin procesar `net`, `tls` y `http2`, los complementos nativos y los procesos secundarios que no sean de OpenClaw pueden omitir el enrutamiento por proxy a nivel de Node, a menos que hereden y respeten las variables de entorno del proxy. Las CLI secundarias bifurcadas de OpenClaw heredan la URL del proxy gestionado y el estado de `proxy.loopbackMode`.
- IRC es un canal TCP/TLS sin procesar fuera del enrutamiento de proxy de reenvío gestionado por el operador. En despliegues que requieren que toda la salida pase por ese proxy de reenvío, establece `channels.irc.enabled=false` a menos que la salida directa de IRC esté aprobada explícitamente.
- El proxy de depuración local es una herramienta de diagnóstico y su reenvío ascendente directo para solicitudes de proxy y túneles CONNECT está deshabilitado de forma predeterminada mientras el modo de proxy gestionado está activo; habilita el reenvío directo solo para diagnósticos locales aprobados.
- Las WebUI locales del usuario y los servidores de modelos locales deben incluirse en la lista de permitidos de la política de proxy del operador cuando sea necesario; OpenClaw no expone una omisión general de red local para ellos.
- La omisión del proxy del plano de control del Gateway está limitada intencionadamente a `localhost` y URL de IP de loopback literales. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` para conexiones locales directas del plano de control del Gateway; otros nombres de host se enrutan como tráfico ordinario basado en nombres de host.
- OpenClaw no inspecciona, prueba ni certifica tu política de proxy.
- Trata los cambios de política de proxy como cambios operativos sensibles para la seguridad.
