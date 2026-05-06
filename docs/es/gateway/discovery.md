---
read_when:
    - Implementar o cambiar el descubrimiento/anuncio de Bonjour
    - Ajustar los modos de conexión remota (directa frente a SSH)
    - Diseño del descubrimiento de nodos + emparejamiento para nodos remotos
summary: Descubrimiento de Node y transportes (Bonjour, Tailscale, SSH) para encontrar el Gateway
title: Descubrimiento y transportes
x-i18n:
    generated_at: "2026-05-06T05:34:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw tiene dos problemas distintos que parecen similares en la superficie:

1. **Control remoto del operador**: la aplicación de la barra de menús de macOS que controla un Gateway que se ejecuta en otro lugar.
2. **Emparejamiento de Node**: iOS/Android (y nodos futuros) que encuentran un Gateway y se emparejan de forma segura.

El objetivo del diseño es mantener todo el descubrimiento/anuncio de red en el **Node Gateway** (`openclaw gateway`) y mantener a los clientes (aplicación de Mac, iOS) como consumidores.

## Términos

- **Gateway**: un único proceso de Gateway de larga ejecución que posee el estado (sesiones, emparejamiento, registro de nodos) y ejecuta canales. La mayoría de las configuraciones usa uno por host; son posibles configuraciones aisladas con varios Gateway.
- **Gateway WS (plano de control)**: el endpoint WebSocket en `127.0.0.1:18789` de forma predeterminada; puede enlazarse a LAN/tailnet mediante `gateway.bind`.
- **Transporte WS directo**: un endpoint Gateway WS orientado a LAN/tailnet (sin SSH).
- **Transporte SSH (respaldo)**: control remoto reenviando `127.0.0.1:18789` mediante SSH.
- **Puente TCP heredado (eliminado)**: transporte de nodo antiguo (consulta
  [Protocolo de puente](/es/gateway/bridge-protocol)); ya no se anuncia para el
  descubrimiento y ya no forma parte de las compilaciones actuales.

Detalles del protocolo:

- [Protocolo de Gateway](/es/gateway/protocol)
- [Protocolo de puente (heredado)](/es/gateway/bridge-protocol)

## Por qué mantenemos tanto directo como SSH

- **WS directo** ofrece la mejor experiencia de usuario en la misma red y dentro de una tailnet:
  - descubrimiento automático en LAN mediante Bonjour
  - tokens de emparejamiento + ACL propiedad del Gateway
  - no se requiere acceso de shell; la superficie del protocolo puede mantenerse limitada y auditable
- **SSH** sigue siendo el respaldo universal:
  - funciona en cualquier lugar donde tengas acceso SSH (incluso entre redes no relacionadas)
  - sobrevive a problemas de multicast/mDNS
  - no requiere nuevos puertos entrantes aparte de SSH

## Entradas de descubrimiento (cómo los clientes saben dónde está el Gateway)

### 1) Descubrimiento Bonjour / DNS-SD

Bonjour multicast es de mejor esfuerzo y no cruza redes. OpenClaw también puede explorar el
mismo beacon de Gateway mediante un dominio DNS-SD de área amplia configurado, por lo que el descubrimiento puede cubrir:

- `local.` en la misma LAN
- un dominio DNS-SD unicast configurado para descubrimiento entre redes

Dirección objetivo:

- El **Gateway** anuncia su endpoint WS mediante Bonjour cuando el Plugin
  `bonjour` incluido está habilitado. El Plugin se inicia automáticamente en hosts macOS y es
  opcional en otros lugares.
- Los clientes exploran y muestran una lista de "elige un Gateway", luego almacenan el endpoint elegido.

Solución de problemas y detalles del beacon: [Bonjour](/es/gateway/bonjour).

#### Detalles del beacon de servicio

- Tipos de servicio:
  - `_openclaw-gw._tcp` (beacon de transporte de Gateway)
- Claves TXT (no secretas):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nombre visible configurado por el operador)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (solo cuando TLS está habilitado)
  - `gatewayTlsSha256=<sha256>` (solo cuando TLS está habilitado y la huella digital está disponible)
  - `canvasPort=<port>` (puerto del host de lienzo; actualmente el mismo que `gatewayPort` cuando el host de lienzo está habilitado)
  - `tailnetDns=<magicdns>` (pista opcional; se detecta automáticamente cuando Tailscale está disponible)
  - `sshPort=<port>` (solo modo completo de mDNS; DNS-SD de área amplia puede omitirlo, en cuyo caso los valores predeterminados de SSH permanecen en `22`)
  - `cliPath=<path>` (solo modo completo de mDNS; DNS-SD de área amplia aún lo escribe como pista de instalación remota)

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes deben tratar los valores TXT solo como pistas de experiencia de usuario.
- El enrutamiento (host/puerto) debe preferir el **endpoint de servicio resuelto** (SRV + A/AAAA) sobre `lanHost`, `tailnetDns` o `gatewayPort` proporcionados por TXT.
- La fijación TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sobrescriba una fijación almacenada previamente.
- Los nodos iOS/Android deben requerir una confirmación explícita de "confiar en esta huella digital" antes de almacenar una fijación por primera vez (verificación fuera de banda) siempre que la ruta elegida esté basada en TLS/segura.

Habilitar/deshabilitar/sobrescribir:

- `openclaw plugins enable bonjour` habilita la publicidad multicast LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita la publicidad.
- Cuando el Plugin Bonjour está habilitado y `OPENCLAW_DISABLE_BONJOUR` no está definido,
  Bonjour anuncia en hosts normales y se deshabilita automáticamente dentro de contenedores detectados.
  El inicio de Gateway en macOS con configuración vacía habilita el Plugin automáticamente; las implementaciones en Linux,
  Windows y contenedores necesitan habilitación explícita.
  Usa `0` solo en host, macvlan u otra red compatible con mDNS; usa `1` para
  forzar la deshabilitación.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de enlace del Gateway.
- `OPENCLAW_SSH_PORT` sobrescribe el puerto SSH anunciado cuando se emite `sshPort`.
- `OPENCLAW_TAILNET_DNS` publica una pista `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sobrescribe la ruta CLI anunciada.

### 2) Tailnet (entre redes)

Para configuraciones de estilo Londres/Viena, Bonjour no ayudará. El objetivo "directo" recomendado es:

- nombre MagicDNS de Tailscale (preferido) o una IP estable de tailnet.

Si el Gateway puede detectar que se ejecuta bajo Tailscale, publica `tailnetDns` como pista opcional para los clientes (incluidos los beacons de área amplia).

La aplicación macOS ahora prefiere nombres MagicDNS sobre IPs de Tailscale sin procesar para el descubrimiento de Gateway. Esto mejora la fiabilidad cuando las IPs de tailnet cambian (por ejemplo, después de reinicios de nodo o reasignación de CGNAT), porque los nombres MagicDNS resuelven automáticamente a la IP actual.

Para el emparejamiento de nodos móviles, las pistas de descubrimiento no relajan la seguridad del transporte en rutas tailnet/públicas:

- iOS/Android todavía requieren una ruta de conexión tailnet/pública segura por primera vez (`wss://` o Tailscale Serve/Funnel).
- Una IP de tailnet sin procesar descubierta es una pista de enrutamiento, no permiso para usar `ws://` remoto en texto claro.
- La conexión directa privada LAN `ws://` sigue siendo compatible.
- Si quieres la ruta de Tailscale más sencilla para nodos móviles, usa Tailscale Serve para que el descubrimiento y el código de configuración resuelvan al mismo endpoint MagicDNS seguro.

### 3) Objetivo manual / SSH

Cuando no hay una ruta directa (o la directa está deshabilitada), los clientes siempre pueden conectarse mediante SSH reenviando el puerto de Gateway de loopback.

Consulta [Acceso remoto](/es/gateway/remote).

## Selección de transporte (política del cliente)

Comportamiento recomendado del cliente:

1. Si un endpoint directo emparejado está configurado y es accesible, úsalo.
2. De lo contrario, si el descubrimiento encuentra un Gateway en `local.` o en el dominio de área amplia configurado, ofrece una opción de un toque "Usar este Gateway" y guárdala como el endpoint directo.
3. De lo contrario, si un DNS/IP de tailnet está configurado, prueba directo.
   Para nodos móviles en rutas tailnet/públicas, directo significa un endpoint seguro, no `ws://` remoto en texto claro.
4. De lo contrario, recurre a SSH.

## Emparejamiento + autenticación (transporte directo)

El Gateway es la fuente de verdad para la admisión de nodos/clientes.

- Las solicitudes de emparejamiento se crean/aprueban/rechazan en el Gateway (consulta [Emparejamiento de Gateway](/es/gateway/pairing)).
- El Gateway aplica:
  - autenticación (token / par de claves)
  - ámbitos/ACL (el Gateway no es un proxy sin procesar para todos los métodos)
  - límites de tasa

## Responsabilidades por componente

- **Gateway**: anuncia beacons de descubrimiento, posee las decisiones de emparejamiento y aloja el endpoint WS.
- **Aplicación macOS**: te ayuda a elegir un Gateway, muestra indicaciones de emparejamiento y usa SSH solo como respaldo.
- **Nodos iOS/Android**: exploran Bonjour como comodidad y se conectan al Gateway WS emparejado.

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Tailscale](/es/gateway/tailscale)
- [Descubrimiento Bonjour](/es/gateway/bonjour)
