---
read_when:
    - Quieres defensa en profundidad contra ataques SSRF y de reenlace DNS
    - Configuración de un proxy de reenvío externo para el tráfico en tiempo de ejecución de OpenClaw
summary: Cómo enrutar el tráfico HTTP y WebSocket del entorno de ejecución de OpenClaw a través de un proxy de filtrado gestionado por el operador
title: Proxy de red
x-i18n:
    generated_at: "2026-05-04T05:29:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7140c5ced0e7454a6f85d1ea8f3256bbd28cc0cb42eeafe8e5e6439b90e3f0
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy de red

OpenClaw puede enrutar el tráfico HTTP y WebSocket en tiempo de ejecución a través de un proxy de reenvío administrado por el operador. Esta es una defensa opcional en profundidad para despliegues que quieren control centralizado de salida, protección SSRF más sólida y mejor auditabilidad de red.

OpenClaw no incluye, descarga, inicia, configura ni certifica ningún proxy. Tú ejecutas la tecnología de proxy que encaja con tu entorno, y OpenClaw enruta los clientes HTTP y WebSocket normales locales al proceso a través de él.

## ¿Por qué usar un proxy?

Un proxy da a los operadores un único punto de control de red para el tráfico HTTP y WebSocket saliente. Eso puede ser útil incluso más allá del refuerzo contra SSRF:

- Política central: mantén una única política de salida en lugar de depender de que cada punto de llamada HTTP de la aplicación aplique correctamente las reglas de red.
- Comprobaciones en el momento de conexión: evalúa el destino después de la resolución DNS e inmediatamente antes de que el proxy abra la conexión ascendente.
- Defensa contra DNS rebinding: reduce la brecha entre una comprobación DNS a nivel de aplicación y la conexión saliente real.
- Cobertura más amplia de JavaScript: enruta clientes ordinarios como `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch y similares por la misma ruta.
- Auditabilidad: registra destinos permitidos y denegados en el límite de salida.
- Control operativo: aplica reglas de destino, segmentación de red, límites de tasa o listas de permitidos salientes sin reconstruir OpenClaw.

El enrutamiento por proxy es una barrera a nivel de proceso para la salida HTTP y WebSocket normal. Da a los operadores una ruta cerrada ante fallos para enrutar clientes HTTP JavaScript compatibles a través de su propio proxy filtrante, pero no es un sandbox de red a nivel de sistema operativo y no hace que OpenClaw certifique la política de destinos del proxy.

## Cómo OpenClaw enruta el tráfico

Cuando `proxy.enabled=true` y se configura una URL de proxy, los procesos protegidos en tiempo de ejecución, como `openclaw gateway run`, `openclaw node run` y `openclaw agent --local`, enrutan la salida HTTP y WebSocket normal a través del proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

El contrato público es el comportamiento de enrutamiento, no los hooks internos de Node usados para implementarlo. Los clientes WebSocket del plano de control de OpenClaw Gateway usan una ruta directa estrecha para el tráfico RPC de Gateway de local loopback cuando la URL del Gateway usa `localhost` o una IP de loopback literal como `127.0.0.1` o `[::1]`. Esa ruta del plano de control debe poder alcanzar Gateways de loopback incluso cuando el proxy del operador bloquea destinos de loopback. Las solicitudes HTTP y WebSocket normales en tiempo de ejecución siguen usando el proxy configurado.

Internamente, OpenClaw usa dos hooks de enrutamiento a nivel de proceso para esta función:

- El enrutamiento del despachador de Undici cubre `fetch`, clientes respaldados por undici y transportes que proporcionan su propio despachador de undici.
- El enrutamiento de `global-agent` cubre llamadores del núcleo de Node `node:http` y `node:https`, incluidas muchas bibliotecas construidas sobre `http.request`, `https.request`, `http.get` y `https.get`. El modo de proxy administrado fuerza ese agente global para que los agentes HTTP explícitos de Node no omitan accidentalmente el proxy del operador.

Algunos plugins poseen transportes personalizados que necesitan cableado explícito del proxy incluso cuando existe enrutamiento a nivel de proceso. Por ejemplo, el transporte de Bot API de Telegram usa su propio despachador HTTP/1 de undici y, por lo tanto, respeta las variables de entorno de proxy del proceso más el fallback administrado `OPENCLAW_PROXY_URL` en esa ruta de transporte específica del propietario.

La URL del proxy en sí debe usar `http://`. Los destinos HTTPS siguen siendo compatibles a través del proxy con HTTP `CONNECT`; esto solo significa que OpenClaw espera un listener de proxy de reenvío HTTP plano como `http://127.0.0.1:3128`.

Mientras el proxy está activo, OpenClaw limpia `no_proxy`, `NO_PROXY` y `GLOBAL_AGENT_NO_PROXY`. Esas listas de omisión se basan en destino, así que dejar `localhost` o `127.0.0.1` allí permitiría que objetivos SSRF de alto riesgo se saltaran el proxy filtrante.

Al apagarse, OpenClaw restaura el entorno de proxy anterior y restablece el estado de enrutamiento de proceso en caché.

## Términos de proxy relacionados

- `proxy.enabled` / `proxy.proxyUrl`: enrutamiento saliente mediante proxy de reenvío para la salida en tiempo de ejecución de OpenClaw. Esta página documenta esa función.
- `gateway.auth.mode: "trusted-proxy"`: autenticación entrante mediante proxy inverso con identidad para el acceso al Gateway. Consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy local de depuración e inspector de captura para desarrollo y soporte. Consulta [openclaw proxy](/es/cli/proxy).
- Configuraciones de proxy específicas de canal o proveedor: anulaciones específicas del propietario para un transporte particular. Prefiere el proxy de red administrado cuando el objetivo sea el control centralizado de salida en todo el runtime.

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

`proxy.proxyUrl` tiene precedencia sobre `OPENCLAW_PROXY_URL`.

Si `enabled=true` pero no se configura una URL de proxy válida, los comandos protegidos fallan al iniciar en lugar de volver al acceso directo a la red.

Para servicios de gateway administrados iniciados con `openclaw gateway start`, prefiere almacenar la URL en la configuración:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

El fallback de entorno es mejor para ejecuciones en primer plano. Si lo usas con un servicio instalado, coloca `OPENCLAW_PROXY_URL` en el entorno persistente del servicio, como `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, y luego reinstala el servicio para que launchd, systemd o Scheduled Tasks inicie el gateway con ese valor.

Para comandos `openclaw --container ...`, OpenClaw reenvía `OPENCLAW_PROXY_URL` a la CLI hija dirigida al contenedor cuando está establecida. La URL debe ser accesible desde dentro del contenedor; `127.0.0.1` se refiere al propio contenedor, no al host. OpenClaw rechaza URL de proxy de loopback para comandos dirigidos a contenedores a menos que anules explícitamente esa comprobación de seguridad.

## Requisitos del proxy

La política del proxy es el límite de seguridad. OpenClaw no puede verificar que el proxy bloquee los objetivos correctos.

Configura el proxy para:

- Enlazarse solo a loopback o a una interfaz privada de confianza.
- Restringir el acceso para que solo el proceso, host, contenedor o cuenta de servicio de OpenClaw pueda usarlo.
- Resolver los destinos por sí mismo y bloquear las IP de destino después de la resolución DNS.
- Aplicar la política en el momento de conexión tanto para solicitudes HTTP planas como para túneles HTTPS `CONNECT`.
- Rechazar omisiones basadas en destino para rangos de loopback, privados, link-local, metadatos, multicast, reservados o de documentación.
- Evitar listas de permitidos por nombre de host a menos que confíes plenamente en la ruta de resolución DNS.
- Registrar destino, decisión, estado y motivo sin registrar cuerpos de solicitud, encabezados de autorización, cookies u otros secretos.
- Mantener la política del proxy bajo control de versiones y revisar los cambios como configuración sensible a la seguridad.

## Destinos bloqueados recomendados

Usa esta lista de denegación como punto de partida para cualquier proxy de reenvío, firewall o política de salida.

La lógica de clasificación a nivel de aplicación de OpenClaw vive en `src/infra/net/ssrf.ts` y `src/shared/net/ip.ts`. Los hooks de paridad relevantes son `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` y el manejo del centinela IPv4 integrado para NAT64, 6to4, Teredo, ISATAP y formas IPv4-mapped. Esos archivos son referencias útiles al mantener una política externa de proxy, pero OpenClaw no exporta ni aplica automáticamente esas reglas en tu proxy.

| Rango o host                                                                         | Por qué bloquear                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Direcciones no especificadas y de esta red           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC1918                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Direcciones link-local y rutas comunes de metadatos en la nube |
| `169.254.169.254`, `metadata.google.internal`                                        | Servicios de metadatos en la nube                    |
| `100.64.0.0/10`                                                                      | Espacio de direcciones compartido de NAT de grado operador |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rangos de benchmarking                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rangos de uso especial y documentación               |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                       |
| `fc00::/7`, `fec0::/10`                                                              | Rangos IPv6 locales/privados                         |
| `100::/64`, `2001:20::/28`                                                           | Rangos IPv6 discard y ORCHIDv2                       |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefijos NAT64 con IPv4 integrado                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 y Teredo con IPv4 integrado                     |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatible con IPv4 e IPv6 IPv4-mapped          |

Si tu proveedor de nube o plataforma de red documenta hosts de metadatos o rangos reservados adicionales, añádelos también.

## Validación

Valida el proxy desde el mismo host, contenedor o cuenta de servicio que ejecuta OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

De forma predeterminada, cuando no se proporcionan destinos personalizados, el comando comprueba que `https://example.com/` tenga éxito e inicia un canario temporal de loopback que el proxy no debe alcanzar. La comprobación denegada predeterminada pasa cuando el proxy devuelve una respuesta de denegación que no sea 2xx o bloquea el canario con un fallo de transporte; falla si una respuesta correcta llega al canario. Si no hay ningún proxy habilitado y configurado, la validación informa de un problema de configuración; usa `--proxy-url` para una comprobación preliminar puntual antes de cambiar la configuración. Usa `--allowed-url` y `--denied-url` para probar expectativas específicas del despliegue. Los destinos denegados personalizados son cerrados ante fallos: cualquier respuesta HTTP significa que el destino fue accesible a través del proxy, y cualquier error de transporte se informa como inconcluso porque OpenClaw no puede demostrar que el proxy bloqueó un origen accesible. Si la validación falla, el comando sale con código 1.

Usa `--json` para automatización. La salida JSON contiene el resultado global, la fuente efectiva de configuración del proxy, cualquier error de configuración y cada comprobación de destino. Las credenciales de la URL del proxy se redactan en la salida de texto y JSON:

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

La solicitud pública debería completarse correctamente. Las solicitudes de loopback y de metadatos deberían ser bloqueadas por el proxy. Para `openclaw proxy validate`, el canario de loopback integrado puede distinguir una denegación del proxy de un origen accesible. Las comprobaciones personalizadas con `--denied-url` no tienen ese canario, así que trata tanto las respuestas HTTP como los fallos de transporte ambiguos como fallos de validación, salvo que tu proxy exponga una señal de denegación específica del despliegue que puedas verificar por separado.

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

- El proxy mejora la cobertura para clientes HTTP y WebSocket de JavaScript locales al proceso, pero no es un sandbox de red a nivel del sistema operativo.
- Los sockets sin procesar de `net`, `tls` y `http2`, los complementos nativos y los procesos secundarios pueden omitir el enrutamiento de proxy a nivel de Node, salvo que hereden y respeten las variables de entorno del proxy.
- IRC es un canal TCP/TLS sin procesar fuera del enrutamiento de proxy directo administrado por el operador. En despliegues que requieren que todo el tráfico de salida pase por ese proxy directo, configura `channels.irc.enabled=false`, salvo que el tráfico de salida directo de IRC esté aprobado explícitamente.
- El proxy de depuración local es una herramienta de diagnóstico, y su reenvío ascendente directo para solicitudes de proxy y túneles CONNECT está deshabilitado de forma predeterminada mientras el modo de proxy administrado está activo; habilita el reenvío directo solo para diagnósticos locales aprobados.
- Las WebUI locales del usuario y los servidores de modelos locales deberían incluirse en la lista de permitidos de la política de proxy del operador cuando sea necesario; OpenClaw no expone una omisión general de la red local para ellos.
- La omisión del proxy del plano de control del Gateway está limitada intencionalmente a `localhost` y a URL de IP de loopback literales. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` para conexiones directas locales al plano de control del Gateway; otros nombres de host se enrutan como tráfico ordinario basado en nombres de host.
- OpenClaw no inspecciona, prueba ni certifica tu política de proxy.
- Trata los cambios en la política de proxy como cambios operativos sensibles para la seguridad.
