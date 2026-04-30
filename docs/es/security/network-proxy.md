---
read_when:
    - Quieres defensa en profundidad contra ataques SSRF y de reenlace de DNS
    - Configuración de un proxy de reenvío externo para el tráfico de ejecución de OpenClaw
summary: Cómo enrutar el tráfico HTTP y WebSocket en tiempo de ejecución de OpenClaw a través de un proxy de filtrado gestionado por el operador
title: Proxy de red
x-i18n:
    generated_at: "2026-04-30T06:01:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy de red

OpenClaw puede enrutar el tráfico HTTP y WebSocket en tiempo de ejecución a través de un proxy directo administrado por el operador. Es una defensa opcional en profundidad para despliegues que quieren control centralizado de salida, protección SSRF más fuerte y mejor auditabilidad de red.

OpenClaw no incluye, descarga, inicia, configura ni certifica un proxy. Tú ejecutas la tecnología de proxy que encaje con tu entorno, y OpenClaw enruta clientes HTTP y WebSocket normales locales al proceso a través de él.

## ¿Por qué usar un proxy?

Un proxy ofrece a los operadores un único punto de control de red para el tráfico HTTP y WebSocket saliente. Esto puede ser útil incluso fuera del endurecimiento contra SSRF:

- Política central: mantener una política de salida en lugar de depender de que cada punto de llamada HTTP de la aplicación aplique correctamente las reglas de red.
- Comprobaciones en tiempo de conexión: evaluar el destino después de la resolución DNS e inmediatamente antes de que el proxy abra la conexión ascendente.
- Defensa contra reenlace DNS: reducir la brecha entre una comprobación DNS a nivel de aplicación y la conexión saliente real.
- Cobertura más amplia de JavaScript: enrutar clientes ordinarios como `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch y similares por la misma ruta.
- Auditabilidad: registrar destinos permitidos y denegados en el límite de salida.
- Control operativo: aplicar reglas de destino, segmentación de red, límites de tasa o listas de permitidos salientes sin reconstruir OpenClaw.

El enrutamiento por proxy es una barrera de protección a nivel de proceso para la salida HTTP y WebSocket normal. Ofrece a los operadores una ruta cerrada por defecto para enrutar clientes HTTP de JavaScript compatibles a través de su propio proxy filtrante, pero no es un entorno aislado de red a nivel de sistema operativo y no hace que OpenClaw certifique la política de destinos del proxy.

## Cómo enruta OpenClaw el tráfico

Cuando `proxy.enabled=true` y se configura una URL de proxy, los procesos protegidos en tiempo de ejecución como `openclaw gateway run`, `openclaw node run` y `openclaw agent --local` enrutan la salida HTTP y WebSocket normal a través del proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

El contrato público es el comportamiento de enrutamiento, no los hooks internos de Node utilizados para implementarlo. Los clientes WebSocket del plano de control de OpenClaw Gateway usan una ruta directa estrecha para el tráfico RPC de Gateway de local loopback cuando la URL de Gateway usa `localhost` o una IP literal de bucle local como `127.0.0.1` o `[::1]`. Esa ruta del plano de control debe poder alcanzar Gateways de bucle local incluso cuando el proxy del operador bloquea destinos de bucle local. Las solicitudes HTTP y WebSocket normales en tiempo de ejecución siguen usando el proxy configurado.

Internamente, OpenClaw usa dos hooks de enrutamiento a nivel de proceso para esta función:

- El enrutamiento del despachador de Undici cubre `fetch`, clientes respaldados por undici y transportes que proporcionan su propio despachador de undici.
- El enrutamiento de `global-agent` cubre llamadores del núcleo de Node `node:http` y `node:https`, incluidas muchas bibliotecas construidas sobre `http.request`, `https.request`, `http.get` y `https.get`. El modo de proxy administrado fuerza ese agente global para que los agentes HTTP explícitos de Node no eludan accidentalmente el proxy del operador.

Algunos plugins poseen transportes personalizados que necesitan cableado explícito de proxy incluso cuando existe enrutamiento a nivel de proceso. Por ejemplo, el transporte de Bot API de Telegram usa su propio despachador HTTP/1 de undici y, por lo tanto, respeta el entorno de proxy del proceso más la reserva administrada `OPENCLAW_PROXY_URL` en esa ruta de transporte específica del propietario.

La URL del proxy debe usar `http://`. Los destinos HTTPS siguen siendo compatibles a través del proxy con HTTP `CONNECT`; esto solo significa que OpenClaw espera un listener de proxy directo HTTP sin cifrar, como `http://127.0.0.1:3128`.

Mientras el proxy está activo, OpenClaw borra `no_proxy`, `NO_PROXY` y `GLOBAL_AGENT_NO_PROXY`. Esas listas de omisión se basan en destinos, por lo que dejar `localhost` o `127.0.0.1` allí permitiría que destinos SSRF de alto riesgo omitieran el proxy filtrante.

Al apagarse, OpenClaw restaura el entorno de proxy anterior y restablece el estado de enrutamiento de proceso en caché.

## Términos relacionados con el proxy

- `proxy.enabled` / `proxy.proxyUrl`: enrutamiento de proxy directo saliente para la salida en tiempo de ejecución de OpenClaw. Esta página documenta esa función.
- `gateway.auth.mode: "trusted-proxy"`: autenticación entrante mediante proxy inverso consciente de identidad para el acceso a Gateway. Consulta [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy de depuración local e inspector de capturas para desarrollo y soporte. Consulta [openclaw proxy](/es/cli/proxy).
- Configuraciones de proxy específicas de canal o proveedor: anulaciones específicas del propietario para un transporte concreto. Prefiere el proxy de red administrado cuando el objetivo sea el control centralizado de salida en todo el tiempo de ejecución.

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

Si `enabled=true` pero no se configura una URL de proxy válida, los comandos protegidos fallan al iniciar en lugar de volver al acceso directo a la red.

Para servicios de gateway administrados iniciados con `openclaw gateway start`, prefiere guardar la URL en la configuración:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

La reserva de entorno es mejor para ejecuciones en primer plano. Si la usas con un servicio instalado, coloca `OPENCLAW_PROXY_URL` en el entorno durable del servicio, como `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, y luego reinstala el servicio para que launchd, systemd o Scheduled Tasks inicie el gateway con ese valor.

Para comandos `openclaw --container ...`, OpenClaw reenvía `OPENCLAW_PROXY_URL` a la CLI hija orientada al contenedor cuando está definida. La URL debe ser alcanzable desde dentro del contenedor; `127.0.0.1` se refiere al propio contenedor, no al host. OpenClaw rechaza las URL de proxy de bucle local para comandos orientados a contenedores salvo que anules explícitamente esa comprobación de seguridad.

## Requisitos del proxy

La política del proxy es el límite de seguridad. OpenClaw no puede verificar que el proxy bloquee los objetivos correctos.

Configura el proxy para:

- Vincularse solo a bucle local o a una interfaz privada de confianza.
- Restringir el acceso para que solo el proceso, host, contenedor o cuenta de servicio de OpenClaw pueda usarlo.
- Resolver los destinos por sí mismo y bloquear las IP de destino después de la resolución DNS.
- Aplicar la política en tiempo de conexión tanto para solicitudes HTTP sin cifrar como para túneles HTTPS `CONNECT`.
- Rechazar omisiones basadas en destino para rangos de bucle local, privados, de enlace local, de metadatos, multicast, reservados o de documentación.
- Evitar listas de permitidos de nombres de host salvo que confíes plenamente en la ruta de resolución DNS.
- Registrar destino, decisión, estado y motivo sin registrar cuerpos de solicitud, encabezados de autorización, cookies u otros secretos.
- Mantener la política del proxy bajo control de versiones y revisar los cambios como configuración sensible para la seguridad.

## Destinos bloqueados recomendados

Usa esta lista de denegación como punto de partida para cualquier proxy directo, firewall o política de salida.

La lógica de clasificación a nivel de aplicación de OpenClaw vive en `src/infra/net/ssrf.ts` y `src/shared/net/ip.ts`. Los hooks de paridad relevantes son `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` y el manejo centinela IPv4 incorporado para NAT64, 6to4, Teredo, ISATAP y formas IPv4-mapped. Esos archivos son referencias útiles al mantener una política de proxy externa, pero OpenClaw no exporta ni aplica automáticamente esas reglas en tu proxy.

| Rango o host                                                                         | Por qué bloquear                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Bucle local IPv4                                     |
| `::1/128`                                                                            | Bucle local IPv6                                     |
| `0.0.0.0/8`, `::/128`                                                                | Direcciones no especificadas y de esta red           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC1918                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Direcciones de enlace local y rutas comunes de metadatos en la nube |
| `169.254.169.254`, `metadata.google.internal`                                        | Servicios de metadatos en la nube                    |
| `100.64.0.0/10`                                                                      | Espacio de direcciones compartido de NAT de operador |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rangos de pruebas de rendimiento                     |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rangos de uso especial y documentación               |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                       |
| `fc00::/7`, `fec0::/10`                                                              | Rangos locales/privados IPv6                         |
| `100::/64`, `2001:20::/28`                                                           | Rangos IPv6 de descarte y ORCHIDv2                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefijos NAT64 con IPv4 incrustado                   |
| `2002::/16`, `2001::/32`                                                             | 6to4 y Teredo con IPv4 incrustado                    |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatible con IPv4 e IPv6 IPv4-mapped          |

Si tu proveedor de nube o plataforma de red documenta hosts de metadatos o rangos reservados adicionales, añádelos también.

## Validación

Valida el proxy desde el mismo host, contenedor o cuenta de servicio que ejecuta OpenClaw:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

La solicitud pública debería tener éxito. Las solicitudes de bucle local y metadatos deberían fallar en el proxy.

Luego habilita el enrutamiento por proxy de OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

o define:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Límites

- El proxy mejora la cobertura para clientes HTTP y WebSocket de JavaScript locales al proceso, pero no es un entorno aislado de red a nivel de sistema operativo.
- Sockets sin procesar `net`, `tls` y `http2`, complementos nativos y procesos hijos pueden eludir el enrutamiento por proxy a nivel de Node salvo que hereden y respeten variables de entorno de proxy.
- Las WebUIs locales de usuario y los servidores de modelos locales deberían estar en la lista de permitidos de la política de proxy del operador cuando sea necesario; OpenClaw no expone una omisión general de red local para ellos.
- La omisión de proxy del plano de control de Gateway está limitada intencionadamente a `localhost` y URL de IP de bucle local literales. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` para conexiones directas locales del plano de control de Gateway; otros nombres de host se enrutan como tráfico ordinario basado en nombres de host.
- OpenClaw no inspecciona, prueba ni certifica tu política de proxy.
- Trata los cambios de política de proxy como cambios operativos sensibles para la seguridad.
