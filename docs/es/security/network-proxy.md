---
read_when:
    - Quieres defensa en profundidad contra ataques SSRF y de reenlace de DNS
    - Configurar un proxy directo externo para el tráfico en tiempo de ejecución de OpenClaw
summary: Cómo enrutar el tráfico HTTP y WebSocket del entorno de ejecución de OpenClaw a través de un proxy de filtrado gestionado por el operador
title: Proxy de red
x-i18n:
    generated_at: "2026-05-05T01:49:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7ab345d172d63e388ff1221535efd19934dcbf3173f95bc69131f9ad672e0df
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy de red

OpenClaw puede enrutar el tráfico HTTP y WebSocket en tiempo de ejecución a través de un proxy directo administrado por el operador. Esta es una defensa en profundidad opcional para despliegues que buscan control centralizado de egreso, protección SSRF más sólida y mejor auditabilidad de red.

OpenClaw no incluye, descarga, inicia, configura ni certifica un proxy. Tú ejecutas la tecnología de proxy que se adapte a tu entorno, y OpenClaw enruta a través de ella los clientes HTTP y WebSocket normales locales al proceso.

## ¿Por qué usar un proxy?

Un proxy da a los operadores un único punto de control de red para el tráfico HTTP y WebSocket saliente. Eso puede ser útil incluso fuera del endurecimiento contra SSRF:

- Política central: mantén una política de egreso en lugar de depender de que cada punto de llamada HTTP de la aplicación aplique bien las reglas de red.
- Comprobaciones en tiempo de conexión: evalúa el destino después de la resolución DNS e inmediatamente antes de que el proxy abra la conexión ascendente.
- Defensa contra reenlace DNS: reduce la brecha entre una comprobación DNS a nivel de aplicación y la conexión saliente real.
- Cobertura JavaScript más amplia: enruta clientes ordinarios de `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch y similares por la misma ruta.
- Auditabilidad: registra destinos permitidos y denegados en el límite de egreso.
- Control operativo: aplica reglas de destino, segmentación de red, límites de tasa o listas de permitidos salientes sin reconstruir OpenClaw.

El enrutamiento por proxy es una barrera de seguridad a nivel de proceso para el egreso HTTP y WebSocket normal. Da a los operadores una ruta con cierre por fallo para enrutar clientes HTTP JavaScript compatibles a través de su propio proxy de filtrado, pero no es un sandbox de red a nivel del sistema operativo y no hace que OpenClaw certifique la política de destinos del proxy.

## Cómo enruta OpenClaw el tráfico

Cuando `proxy.enabled=true` y hay una URL de proxy configurada, los procesos de ejecución protegidos como `openclaw gateway run`, `openclaw node run` y `openclaw agent --local` enrutan el egreso HTTP y WebSocket normal a través del proxy configurado:

```text
Proceso OpenClaw
  fetch                  -> proxy de filtrado administrado por el operador -> internet pública
  node:http and https    -> proxy de filtrado administrado por el operador -> internet pública
  WebSocket clients      -> proxy de filtrado administrado por el operador -> internet pública
```

El contrato público es el comportamiento de enrutamiento, no los hooks internos de Node usados para implementarlo. Los clientes WebSocket del plano de control de OpenClaw Gateway usan una ruta directa estrecha para el tráfico RPC de Gateway por local loopback cuando la URL del Gateway usa `localhost` o una IP literal de loopback como `127.0.0.1` o `[::1]`. Esa ruta del plano de control debe poder alcanzar Gateways de loopback incluso cuando el proxy del operador bloquea destinos de loopback. Las solicitudes HTTP y WebSocket normales en tiempo de ejecución siguen usando el proxy configurado.

Internamente, OpenClaw usa dos hooks de enrutamiento a nivel de proceso para esta función:

- El enrutamiento del despachador de Undici cubre `fetch`, clientes basados en undici y transportes que proporcionan su propio despachador de undici.
- El enrutamiento de `global-agent` cubre llamadores de Node core `node:http` y `node:https`, incluidas muchas bibliotecas construidas sobre `http.request`, `https.request`, `http.get` y `https.get`. El modo de proxy administrado fuerza ese agente global para que los agentes HTTP explícitos de Node no omitan accidentalmente el proxy del operador.

Algunos plugins poseen transportes personalizados que necesitan cableado explícito de proxy incluso cuando existe enrutamiento a nivel de proceso. Por ejemplo, el transporte Bot API de Telegram usa su propio despachador HTTP/1 de undici y, por lo tanto, respeta el entorno de proxy del proceso más la alternativa administrada `OPENCLAW_PROXY_URL` en esa ruta de transporte específica del propietario.

La propia URL del proxy debe usar `http://`. Los destinos HTTPS siguen estando admitidos a través del proxy con HTTP `CONNECT`; esto solo significa que OpenClaw espera un listener de proxy directo HTTP sin cifrar, como `http://127.0.0.1:3128`.

Mientras el proxy está activo, OpenClaw borra `no_proxy`, `NO_PROXY` y `GLOBAL_AGENT_NO_PROXY`. Esas listas de omisión se basan en el destino, así que dejar `localhost` o `127.0.0.1` ahí permitiría que destinos SSRF de alto riesgo se saltaran el proxy de filtrado.

Al apagarse, OpenClaw restaura el entorno de proxy anterior y reinicia el estado de enrutamiento de proceso en caché.

## Términos de proxy relacionados

- `proxy.enabled` / `proxy.proxyUrl`: enrutamiento de proxy directo saliente para el egreso en tiempo de ejecución de OpenClaw. Esta página documenta esa función.
- `gateway.auth.mode: "trusted-proxy"`: autenticación entrante de proxy inverso consciente de identidad para el acceso al Gateway. Consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy local de depuración e inspector de capturas para desarrollo y soporte. Consulta [openclaw proxy](/es/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opción de adhesión para que `web_fetch` permita que un proxy de entorno HTTP(S) controlado por el operador resuelva DNS manteniendo la fijación DNS estricta y la política de nombre de host predeterminadas. Consulta [Web fetch](/es/tools/web-fetch#trusted-env-proxy).
- Configuración de proxy específica de canal o proveedor: anulaciones específicas del propietario para un transporte particular. Prefiere el proxy de red administrado cuando el objetivo sea el control centralizado de egreso en todo el tiempo de ejecución.

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

Si `enabled=true` pero no hay una URL de proxy válida configurada, los comandos protegidos fallan al iniciar en lugar de volver al acceso directo a la red.

Para servicios de Gateway administrados iniciados con `openclaw gateway start`, prefiere almacenar la URL en la configuración:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

La alternativa de entorno es mejor para ejecuciones en primer plano. Si la usas con un servicio instalado, pon `OPENCLAW_PROXY_URL` en el entorno durable del servicio, como `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, y luego reinstala el servicio para que launchd, systemd o Scheduled Tasks inicien el Gateway con ese valor.

Para comandos `openclaw --container ...`, OpenClaw reenvía `OPENCLAW_PROXY_URL` a la CLI hija orientada al contenedor cuando está definido. La URL debe ser alcanzable desde dentro del contenedor; `127.0.0.1` se refiere al propio contenedor, no al host. OpenClaw rechaza URLs de proxy de loopback para comandos orientados al contenedor a menos que anules explícitamente esa comprobación de seguridad.

## Requisitos del proxy

La política del proxy es el límite de seguridad. OpenClaw no puede verificar que el proxy bloquee los objetivos correctos.

Configura el proxy para:

- Vincularse solo a loopback o a una interfaz privada de confianza.
- Restringir el acceso para que solo el proceso, host, contenedor o cuenta de servicio de OpenClaw pueda usarlo.
- Resolver destinos por sí mismo y bloquear IPs de destino después de la resolución DNS.
- Aplicar la política en tiempo de conexión tanto para solicitudes HTTP sin cifrar como para túneles HTTPS `CONNECT`.
- Rechazar omisiones basadas en destino para rangos de loopback, privados, link-local, metadatos, multidifusión, reservados o documentación.
- Evitar listas de permitidos de nombres de host a menos que confíes plenamente en la ruta de resolución DNS.
- Registrar destino, decisión, estado y motivo sin registrar cuerpos de solicitud, encabezados de autorización, cookies u otros secretos.
- Mantener la política del proxy bajo control de versiones y revisar los cambios como configuración sensible para la seguridad.

## Destinos bloqueados recomendados

Usa esta lista de denegación como punto de partida para cualquier proxy directo, firewall o política de egreso.

La lógica de clasificación a nivel de aplicación de OpenClaw vive en `src/infra/net/ssrf.ts` y `src/shared/net/ip.ts`. Los hooks de paridad relevantes son `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` y el manejo de centinela IPv4 incrustado para NAT64, 6to4, Teredo, ISATAP y formas IPv4 mapeadas. Esos archivos son referencias útiles al mantener una política de proxy externa, pero OpenClaw no exporta ni aplica automáticamente esas reglas en tu proxy.

| Rango o host                                                                         | Por qué bloquear                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Direcciones no especificadas y de esta red           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC1918                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Direcciones link-local y rutas comunes de metadatos en la nube |
| `169.254.169.254`, `metadata.google.internal`                                        | Servicios de metadatos en la nube                    |
| `100.64.0.0/10`                                                                      | Espacio de direcciones compartido NAT de grado operador |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rangos de benchmarking                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rangos de uso especial y documentación               |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multidifusión                                        |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                       |
| `fc00::/7`, `fec0::/10`                                                              | Rangos IPv6 locales/privados                         |
| `100::/64`, `2001:20::/28`                                                           | Rangos IPv6 de descarte y ORCHIDv2                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefijos NAT64 con IPv4 incrustado                   |
| `2002::/16`, `2001::/32`                                                             | 6to4 y Teredo con IPv4 incrustado                    |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatible con IPv4 e IPv6 mapeado a IPv4       |

Si tu proveedor de nube o plataforma de red documenta hosts de metadatos o rangos reservados adicionales, agrégalos también.

## Validación

Valida el proxy desde el mismo host, contenedor o cuenta de servicio que ejecuta OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

De forma predeterminada, cuando no se proporcionan destinos personalizados, el comando comprueba que `https://example.com/` tenga éxito e inicia un canario temporal de loopback que el proxy no debe alcanzar. La comprobación denegada predeterminada pasa cuando el proxy devuelve una respuesta de denegación no 2xx o bloquea el canario con un fallo de transporte; falla si una respuesta correcta llega al canario. Si no hay ningún proxy habilitado y configurado, la validación informa de un problema de configuración; usa `--proxy-url` para una comprobación previa puntual antes de cambiar la configuración. Usa `--allowed-url` y `--denied-url` para probar expectativas específicas del despliegue. Añade `--apns-reachable` para verificar también que la entrega directa HTTP/2 de APNs pueda abrir un túnel CONNECT a través del proxy y recibir una respuesta de APNs sandbox; la sonda usa un token de proveedor intencionalmente inválido, por lo que se espera `403 InvalidProviderToken` y cuenta como alcanzable. Los destinos denegados personalizados usan cierre por fallo: cualquier respuesta HTTP significa que el destino fue alcanzable a través del proxy, y cualquier error de transporte se informa como inconcluso porque OpenClaw no puede probar que el proxy bloqueó un origen alcanzable. En caso de fallo de validación, el comando sale con código 1.

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

La solicitud pública debería completarse correctamente. Las solicitudes a loopback y metadatos deberían ser bloqueadas por el proxy. Para `openclaw proxy validate`, el canario de loopback integrado puede distinguir una denegación del proxy de un origen accesible. Las comprobaciones personalizadas de `--denied-url` no tienen ese canario, así que trata tanto las respuestas HTTP como los fallos de transporte ambiguos como fallos de validación, a menos que tu proxy exponga una señal de denegación específica del despliegue que puedas verificar por separado.

Luego habilita el enrutamiento de proxy de OpenClaw:

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
- Los sockets sin procesar `net`, `tls` y `http2`, los complementos nativos y los procesos secundarios pueden omitir el enrutamiento de proxy a nivel de Node, a menos que hereden y respeten las variables de entorno del proxy.
- IRC es un canal TCP/TLS sin procesar fuera del enrutamiento de proxy directo gestionado por el operador. En despliegues que requieren que todo el tráfico saliente pase por ese proxy directo, establece `channels.irc.enabled=false`, a menos que el tráfico IRC saliente directo esté aprobado explícitamente.
- El proxy local de depuración es una herramienta de diagnóstico, y su reenvío ascendente directo para solicitudes de proxy y túneles CONNECT está deshabilitado de forma predeterminada mientras el modo de proxy gestionado está activo; habilita el reenvío directo solo para diagnósticos locales aprobados.
- Las WebUI locales del usuario y los servidores de modelos locales deberían incluirse en la lista de permitidos de la política de proxy del operador cuando sea necesario; OpenClaw no expone una omisión general de la red local para ellos.
- La omisión del proxy del plano de control del Gateway se limita intencionalmente a `localhost` y a URLs IP literales de loopback. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` para conexiones locales directas al plano de control del Gateway; otros nombres de host se enrutan como tráfico ordinario basado en nombre de host.
- OpenClaw no inspecciona, prueba ni certifica tu política de proxy.
- Trata los cambios de política de proxy como cambios operativos sensibles para la seguridad.
