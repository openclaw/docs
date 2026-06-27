---
read_when:
    - Quiere defensa en profundidad contra ataques SSRF y de reenlace DNS
    - Configuración de un proxy directo externo para el tráfico de ejecución de OpenClaw
summary: Cómo enrutar el tráfico HTTP y WebSocket en tiempo de ejecución de OpenClaw a través de un proxy de filtrado gestionado por el operador
title: Proxy de red
x-i18n:
    generated_at: "2026-06-27T12:57:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw puede enrutar el tráfico HTTP y WebSocket en tiempo de ejecución a través de un proxy directo administrado por el operador. Esto es una defensa en profundidad opcional para despliegues que quieren control centralizado de egreso, mayor protección contra SSRF y mejor auditabilidad de red.

OpenClaw no incluye, descarga, inicia, configura ni certifica un proxy. Usted ejecuta la tecnología de proxy que se ajuste a su entorno, y OpenClaw enruta los clientes HTTP y WebSocket locales al proceso normales a través de él.

## Por qué usar un proxy

Un proxy ofrece a los operadores un único punto de control de red para el tráfico HTTP y WebSocket saliente. Eso puede ser útil incluso fuera del endurecimiento contra SSRF:

- Política central: mantenga una sola política de egreso en lugar de depender de que cada punto de llamada HTTP de la aplicación aplique correctamente las reglas de red.
- Comprobaciones en tiempo de conexión: evalúe el destino después de la resolución DNS e inmediatamente antes de que el proxy abra la conexión ascendente.
- Defensa contra reasignación DNS: reduzca la brecha entre una comprobación DNS a nivel de aplicación y la conexión saliente real.
- Cobertura más amplia de JavaScript: enrute clientes ordinarios de `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch y similares por la misma ruta.
- Auditabilidad: registre destinos permitidos y denegados en el límite de egreso.
- Control operativo: aplique reglas de destino, segmentación de red, límites de tasa o listas de permitidos salientes sin reconstruir OpenClaw.

El enrutamiento por proxy es una barrera a nivel de proceso para el egreso HTTP y WebSocket normal. Ofrece a los operadores una ruta de cierre seguro para enrutar clientes HTTP de JavaScript compatibles a través de su propio proxy de filtrado, pero no es un sandbox de red a nivel de SO y no hace que OpenClaw certifique la política de destinos del proxy.

## Cómo OpenClaw enruta el tráfico

Cuando `proxy.enabled=true` y hay una URL de proxy configurada, los procesos de tiempo de ejecución protegidos, como `openclaw gateway run`, `openclaw node run` y `openclaw agent --local`, enrutan el egreso HTTP y WebSocket normal a través del proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

El contrato público es el comportamiento de enrutamiento, no los hooks internos de Node usados para implementarlo. Los clientes WebSocket del plano de control de OpenClaw Gateway usan una ruta directa estrecha para el tráfico RPC de local loopback Gateway cuando la URL del Gateway usa `localhost` o una IP literal de loopback como `127.0.0.1` o `[::1]`. Esa ruta del plano de control debe poder alcanzar Gateways de loopback incluso cuando el proxy del operador bloquea destinos de loopback. Las solicitudes HTTP y WebSocket normales en tiempo de ejecución siguen usando el proxy configurado.

Internamente, OpenClaw instala Proxyline como runtime de enrutamiento a nivel de proceso para esta función. Proxyline cubre `fetch`, clientes basados en undici, llamadores del núcleo de Node `node:http` / `node:https`, clientes WebSocket comunes y túneles CONNECT creados por helpers. El modo de proxy administrado reemplaza los agentes HTTP de Node proporcionados por el llamador para que los agentes explícitos no eviten accidentalmente el proxy del operador.

Algunos plugins son propietarios de transportes personalizados que necesitan cableado explícito del proxy incluso cuando existe enrutamiento a nivel de proceso. Por ejemplo, el transporte Bot API de Telegram usa su propio despachador HTTP/1 de undici y, por lo tanto, respeta las variables de entorno de proxy del proceso más el fallback administrado `OPENCLAW_PROXY_URL` en esa ruta de transporte específica del propietario.

La propia URL del proxy puede usar `http://` o `https://`. Estos esquemas describen la conexión desde OpenClaw hasta el endpoint del proxy:

- `http://proxy.example:3128`: OpenClaw abre una conexión TCP sin cifrar al proxy directo y envía solicitudes de proxy HTTP, incluido `CONNECT` para destinos HTTPS.
- `https://proxy.example:8443`: OpenClaw abre TLS al endpoint del proxy, verifica el certificado del proxy y luego envía solicitudes de proxy HTTP dentro de esa sesión TLS.

El HTTPS de destino es independiente del TLS del endpoint del proxy. Para un destino HTTPS, OpenClaw sigue pidiendo al proxy un túnel HTTP `CONNECT` y luego inicia TLS de destino a través de ese túnel.

Mientras el proxy está activo, OpenClaw borra `no_proxy` y `NO_PROXY`. Esas listas de omisión se basan en destinos, por lo que dejar `localhost` o `127.0.0.1` allí permitiría que objetivos SSRF de alto riesgo saltaran el proxy de filtrado.

Al apagarse, OpenClaw restaura el entorno de proxy anterior y restablece el estado de enrutamiento de proceso en caché.

## Términos relacionados del proxy

- `proxy.enabled` / `proxy.proxyUrl`: enrutamiento de proxy directo saliente para el egreso del runtime de OpenClaw. Esta página documenta esa función.
- `gateway.auth.mode: "trusted-proxy"`: autenticación entrante mediante proxy inverso consciente de identidad para acceso al Gateway. Consulte [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy local de depuración e inspector de capturas para desarrollo y soporte. Consulte [openclaw proxy](/es/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opción explícita para que `web_fetch` permita que un proxy env HTTP(S) controlado por el operador resuelva DNS, manteniendo la fijación DNS estricta predeterminada y la política de nombres de host. Consulte [Web fetch](/es/tools/web-fetch#trusted-env-proxy).
- Configuración de proxy específica de canal o proveedor: anulaciones específicas del propietario para un transporte determinado. Prefiera el proxy de red administrado cuando el objetivo sea el control centralizado de egreso en todo el runtime.

## Configuración

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Para un endpoint de proxy HTTPS con una CA de proxy privada:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

También puede proporcionar la URL a través del entorno, manteniendo `proxy.enabled=true` en la configuración:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` tiene prioridad sobre `OPENCLAW_PROXY_URL`.

### Modo de loopback del Gateway

Los clientes locales del plano de control del Gateway normalmente se conectan a un WebSocket de loopback como `ws://127.0.0.1:18789`. Use `proxy.loopbackMode` para elegir cómo se comportan las excepciones de loopback del proxy administrado mientras el proxy administrado está activo:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (predeterminado): OpenClaw registra la autoridad de loopback del Gateway en la política de bypass administrado de Proxyline para que el tráfico WebSocket local del Gateway pueda conectarse directamente. Los puertos personalizados de Gateway en loopback funcionan porque se registran el host y el puerto de la URL activa del Gateway. El Plugin de navegador incluido también puede registrar los endpoints locales exactos de preparación de CDP y WebSocket de DevTools para navegadores administrados lanzados por OpenClaw, y el proveedor incluido de embeddings de memoria de Ollama puede usar su propia ruta directa protegida más estrecha para el origen exacto configurado de embeddings de loopback local al host.
- `proxy`: OpenClaw no registra bypasses de loopback de Gateway ni Ollama, por lo que ese tráfico de loopback se envía a través del proxy administrado. Si el proxy es remoto, debe proporcionar enrutamiento especial para el servicio de loopback del host de OpenClaw, como asignarlo a un nombre de host, IP o túnel alcanzable por el proxy. Los proxies remotos estándar resuelven `127.0.0.1` y `localhost` desde el host del proxy, no desde el host de OpenClaw.
- `block`: OpenClaw deniega las conexiones de loopback del plano de control del Gateway y las conexiones de loopback de embeddings locales al host protegidas de Ollama antes de abrir un socket.

Si `enabled=true` pero no hay ninguna URL de proxy válida configurada, los comandos protegidos fallan al iniciar en lugar de volver al acceso directo a la red.

Para servicios de Gateway administrados iniciados con `openclaw gateway start`, prefiera almacenar la URL en la configuración:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

El fallback de entorno es mejor para ejecuciones en primer plano. Si lo usa con un servicio instalado, coloque `OPENCLAW_PROXY_URL` en el entorno durable del servicio, como `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, y luego reinstale el servicio para que launchd, systemd o Scheduled Tasks inicie el gateway con ese valor.

Para comandos `openclaw --container ...`, OpenClaw reenvía `OPENCLAW_PROXY_URL` a la CLI hija dirigida al contenedor cuando está establecida. La URL debe ser alcanzable desde dentro del contenedor; `127.0.0.1` se refiere al propio contenedor, no al host. OpenClaw rechaza las URL de proxy de loopback para comandos dirigidos a contenedores a menos que anule explícitamente esa comprobación de seguridad.

## Requisitos del proxy

La política del proxy es el límite de seguridad. OpenClaw no puede verificar que el proxy bloquee los objetivos correctos.

Configure el proxy para:

- Vincularse solo a loopback o a una interfaz privada de confianza.
- Restringir el acceso para que solo el proceso, host, contenedor o cuenta de servicio de OpenClaw pueda usarlo.
- Resolver los destinos por sí mismo y bloquear las IP de destino después de la resolución DNS.
- Aplicar la política en tiempo de conexión tanto para solicitudes HTTP sin cifrar como para túneles HTTPS `CONNECT`.
- Rechazar omisiones basadas en destino para rangos de loopback, privados, link-local, metadata, multicast, reservados o de documentación.
- Evitar listas de permitidos de nombres de host a menos que confíe plenamente en la ruta de resolución DNS.
- Registrar destino, decisión, estado y motivo sin registrar cuerpos de solicitud, encabezados de autorización, cookies ni otros secretos.
- Mantener la política de proxy bajo control de versiones y revisar los cambios como configuración sensible para la seguridad.

## Destinos bloqueados recomendados

Use esta lista de denegación como punto de partida para cualquier proxy directo, firewall o política de egreso.

La lógica de clasificación a nivel de aplicación de OpenClaw vive en `src/infra/net/ssrf.ts` y `packages/net-policy/src/ip.ts`. Los hooks de paridad relevantes son `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` y el manejo de centinelas IPv4 incrustadas para NAT64, 6to4, Teredo, ISATAP y formas IPv4 asignadas. Esos archivos son referencias útiles al mantener una política de proxy externa, pero OpenClaw no exporta ni aplica automáticamente esas reglas en su proxy.

| Rango o host                                                                          | Por qué bloquearlo                                                |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                   | Bucle de retorno IPv4                                             |
| `::1/128`                                                                             | Bucle de retorno IPv6                                             |
| `0.0.0.0/8`, `::/128`                                                                 | Direcciones no especificadas y de esta red                        |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                       | Redes privadas RFC1918                                            |
| `169.254.0.0/16`, `fe80::/10`                                                         | Direcciones link-local y rutas comunes de metadatos en la nube    |
| `169.254.169.254`, `metadata.google.internal`                                         | Servicios de metadatos en la nube                                 |
| `100.64.0.0/10`                                                                       | Espacio de direcciones compartidas de NAT de grado operador       |
| `198.18.0.0/15`, `2001:2::/48`                                                        | Rangos de benchmarking                                            |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`  | Rangos de uso especial y documentación                            |
| `224.0.0.0/4`, `ff00::/8`                                                             | Multidifusión                                                     |
| `240.0.0.0/4`                                                                         | IPv4 reservado                                                    |
| `fc00::/7`, `fec0::/10`                                                               | Rangos locales/privados IPv6                                      |
| `100::/64`, `2001:20::/28`                                                            | Rangos de descarte IPv6 y ORCHIDv2                                |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                      | Prefijos NAT64 con IPv4 incrustado                                |
| `2002::/16`, `2001::/32`                                                              | 6to4 y Teredo con IPv4 incrustado                                 |
| `::/96`, `::ffff:0:0/96`                                                              | IPv6 compatible con IPv4 e IPv6 mapeado a IPv4                    |

Si tu proveedor de nube o plataforma de red documenta hosts de metadatos o rangos reservados adicionales, añádelos también.

## Validación

Valida el proxy desde el mismo host, contenedor o cuenta de servicio que ejecuta OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Para un endpoint de proxy HTTPS firmado por una CA privada:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

De forma predeterminada, cuando no se proporcionan destinos personalizados, el comando comprueba que `https://example.com/` funcione e inicia un canario temporal de bucle de retorno que el proxy no debe alcanzar. La comprobación denegada predeterminada pasa cuando el proxy devuelve una respuesta de denegación que no es 2xx o bloquea el canario con un fallo de transporte; falla si una respuesta correcta llega al canario. Si no hay ningún proxy habilitado y configurado, la validación informa un problema de configuración; usa `--proxy-url` para una comprobación previa puntual antes de cambiar la configuración. Usa `--allowed-url` y `--denied-url` para probar expectativas específicas del despliegue. Añade `--apns-reachable` para verificar también que la entrega directa HTTP/2 de APNs pueda abrir un túnel CONNECT a través del proxy y recibir una respuesta de APNs en sandbox; la prueba usa un token de proveedor intencionalmente no válido, por lo que se espera `403 InvalidProviderToken` y cuenta como alcanzable. Los destinos denegados personalizados fallan de forma cerrada: cualquier respuesta HTTP significa que el destino fue alcanzable a través del proxy, y cualquier error de transporte se informa como no concluyente porque OpenClaw no puede demostrar que el proxy bloqueó un origen alcanzable. Si la validación falla, el comando sale con el código 1.

Usa `--json` para automatización. La salida JSON contiene el resultado global, la fuente efectiva de configuración del proxy, cualquier error de configuración y cada comprobación de destino. Las credenciales de URL del proxy se redactan en la salida de texto y JSON:

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

La solicitud pública debería funcionar. Las solicitudes de bucle de retorno y metadatos deberían ser bloqueadas por el proxy. Para `openclaw proxy validate`, el canario de bucle de retorno integrado puede distinguir una denegación del proxy de un origen alcanzable. Las comprobaciones personalizadas de `--denied-url` no tienen ese canario, así que trata tanto las respuestas HTTP como los fallos de transporte ambiguos como fallos de validación, salvo que tu proxy exponga una señal de denegación específica del despliegue que puedas verificar por separado.

## Confianza en la CA del proxy

Usa `proxy.tls.caFile` administrado cuando el endpoint del proxy use un certificado firmado por una CA privada:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Esa CA se usa para la verificación TLS del endpoint del proxy. No es una configuración de confianza MITM para destinos, un certificado de cliente ni un reemplazo de la política de destinos del proxy.

Usa `NODE_EXTRA_CA_CERTS` solo cuando todo el proceso Node deba confiar en una CA adicional desde el inicio del proceso, por ejemplo cuando un sistema empresarial de inspección TLS vuelve a firmar certificados de destino para cada cliente HTTPS del proceso. `NODE_EXTRA_CA_CERTS` es global para el proceso y debe estar presente antes de que Node se inicie. Prefiere `proxy.tls.caFile` para la confianza en endpoints de proxy HTTPS porque está acotado al enrutamiento de proxy administrado.

Luego habilita el enrutamiento de proxy de OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

o configura:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## Límites

- El proxy mejora la cobertura para clientes HTTP y WebSocket JavaScript locales al proceso, pero no es un sandbox de red a nivel del sistema operativo.
- El tráfico del plano de control de bucle de retorno del Gateway usa de forma predeterminada una omisión local directa mediante `proxy.loopbackMode: "gateway-only"`. OpenClaw implementa esa omisión registrando la autoridad de bucle de retorno activa del Gateway en la política de omisión administrada de Proxyline. Los operadores pueden configurar `proxy.loopbackMode: "proxy"` para enviar el tráfico de bucle de retorno del Gateway a través del proxy administrado, o `proxy.loopbackMode: "block"` para denegar conexiones de bucle de retorno del Gateway. Consulta [Modo de bucle de retorno del Gateway](#gateway-loopback-mode) para la salvedad del proxy remoto.
- Los sockets sin procesar `net`, `tls` y `http2`, los complementos nativos y los procesos secundarios que no sean de OpenClaw pueden omitir el enrutamiento de proxy a nivel de Node salvo que hereden y respeten las variables de entorno del proxy. Las CLI secundarias bifurcadas de OpenClaw heredan la URL del proxy administrado y el estado de `proxy.loopbackMode`.
- IRC es un canal TCP/TLS sin procesar fuera del enrutamiento por proxy directo administrado por el operador. En despliegues que requieren que toda la salida pase por ese proxy directo, configura `channels.irc.enabled=false` salvo que la salida directa de IRC esté aprobada explícitamente.
- El proxy local de depuración es una herramienta de diagnóstico y su reenvío directo ascendente para solicitudes de proxy y túneles CONNECT está deshabilitado de forma predeterminada mientras el modo de proxy administrado está activo; habilita el reenvío directo solo para diagnósticos locales aprobados.
- Las WebUIs locales de usuario y los servidores locales de modelos deberían estar en la lista de permitidos de la política de proxy del operador cuando sea necesario; OpenClaw no expone una omisión general de red local para ellos. El proveedor incluido de embeddings de memoria Ollama es más estrecho: puede usar una ruta directa protegida solo para el origen exacto de embeddings de bucle de retorno local al host derivado del `baseUrl` configurado, de modo que los embeddings locales al host sigan funcionando cuando el proxy administrado no pueda alcanzar el bucle de retorno del host. Los hosts de embeddings Ollama en LAN, tailnet, red privada y públicos siguen usando la ruta del proxy administrado. `proxy.loopbackMode: "proxy"` envía este tráfico de bucle de retorno de Ollama a través del proxy administrado, y `proxy.loopbackMode: "block"` lo deniega antes de abrir una conexión.
- La omisión del proxy del plano de control del Gateway se limita intencionalmente a `localhost` y a URLs con IP de bucle de retorno literales. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` para conexiones locales directas del plano de control del Gateway; otros nombres de host se enrutan como tráfico ordinario basado en nombre de host.
- OpenClaw no inspecciona, prueba ni certifica tu política de proxy.
- Trata los cambios de política de proxy como cambios operativos sensibles para la seguridad.

| Superficie                                                   | Estado del proxy administrado                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `fetch`, `node:http`, `node:https`, clientes WebSocket comunes | Enrutados a través de hooks de proxy administrado cuando están configurados.                            |
| HTTP/2 directo de APNs                                       | Enrutado a través del asistente CONNECT administrado de APNs.                                          |
| Bucle de retorno del plano de control del Gateway            | Directo solo para la URL local de bucle de retorno del Gateway configurada.                             |
| Reenvío ascendente del proxy de depuración                   | Deshabilitado mientras el modo de proxy administrado está activo salvo que se habilite explícitamente para diagnósticos locales. |
| IRC                                                          | TCP/TLS sin procesar; no se proxifica mediante el modo de proxy HTTP administrado. Deshabilítalo salvo que la salida directa de IRC esté aprobada. |
| Otras llamadas de cliente sin procesar `net`, `tls` o `http2` | Deben ser clasificadas por la protección de sockets sin procesar antes de integrarse.                   |
