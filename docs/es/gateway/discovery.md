---
read_when:
    - Implementar o cambiar el descubrimiento/anuncio de Bonjour
    - Ajustar modos de conexión remota (directo frente a SSH)
    - Diseñar el descubrimiento y la vinculación de nodos para nodos remotos
summary: Descubrimiento de nodos y transportes (Bonjour, Tailscale, SSH) para encontrar el gateway
title: Descubrimiento y transportes
x-i18n:
    generated_at: "2026-04-24T05:28:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# Descubrimiento y transportes

OpenClaw tiene dos problemas distintos que en apariencia se parecen:

1. **Control remoto del operador**: la app de barra de menús de macOS controlando un gateway que se ejecuta en otro lugar.
2. **Vinculación de nodos**: iOS/Android (y futuros nodos) encontrando un gateway y vinculándose de forma segura.

El objetivo del diseño es mantener todo el descubrimiento/anuncio de red en el **Node Gateway** (`openclaw gateway`) y dejar a los clientes (app de Mac, iOS) como consumidores.

## Términos

- **Gateway**: un único proceso gateway de larga duración que posee el estado (sesiones, vinculación, registro de nodos) y ejecuta canales. La mayoría de las configuraciones usan uno por host; son posibles configuraciones aisladas de varios gateways.
- **Gateway WS (plano de control)**: el endpoint WebSocket en `127.0.0.1:18789` de forma predeterminada; puede vincularse a LAN/tailnet mediante `gateway.bind`.
- **Transporte WS directo**: un endpoint Gateway WS accesible desde LAN/tailnet (sin SSH).
- **Transporte SSH (alternativa)**: control remoto reenviando `127.0.0.1:18789` por SSH.
- **Puente TCP heredado (eliminado)**: transporte de nodos anterior (consulta
  [Protocolo de puente](/es/gateway/bridge-protocol)); ya no se anuncia para
  descubrimiento y ya no forma parte de las compilaciones actuales.

Detalles del protocolo:

- [Protocolo del Gateway](/es/gateway/protocol)
- [Protocolo de puente (heredado)](/es/gateway/bridge-protocol)

## Por qué mantenemos tanto "directo" como SSH

- **WS directo** es la mejor experiencia de usuario en la misma red y dentro de una tailnet:
  - autodetección en LAN mediante Bonjour
  - tokens de vinculación + ACL propiedad del gateway
  - no se requiere acceso de shell; la superficie del protocolo puede seguir siendo limitada y auditable
- **SSH** sigue siendo la alternativa universal:
  - funciona en cualquier lugar donde tengas acceso SSH (incluso entre redes no relacionadas)
  - sobrevive a problemas de multidifusión/mDNS
  - no requiere nuevos puertos de entrada aparte de SSH

## Entradas de descubrimiento (cómo saben los clientes dónde está el gateway)

### 1) Descubrimiento Bonjour / DNS-SD

El Bonjour por multidifusión es best-effort y no cruza redes. OpenClaw también puede explorar la
misma baliza del gateway mediante un dominio DNS-SD de área extensa configurado, de modo que el descubrimiento puede abarcar:

- `local.` en la misma LAN
- un dominio DNS-SD unicast configurado para descubrimiento entre redes

Dirección objetivo:

- El **gateway** anuncia su endpoint WS mediante Bonjour.
- Los clientes lo exploran y muestran una lista de “elige un gateway”; luego almacenan el endpoint elegido.

Detalles de solución de problemas y de la baliza: [Bonjour](/es/gateway/bonjour).

#### Detalles de la baliza de servicio

- Tipos de servicio:
  - `_openclaw-gw._tcp` (baliza de transporte del gateway)
- Claves TXT (no secretas):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nombre descriptivo configurado por el operador)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (solo cuando TLS está habilitado)
  - `gatewayTlsSha256=<sha256>` (solo cuando TLS está habilitado y la huella está disponible)
  - `canvasPort=<port>` (puerto del host de canvas; actualmente es el mismo que `gatewayPort` cuando el host de canvas está habilitado)
  - `tailnetDns=<magicdns>` (pista opcional; se detecta automáticamente cuando Tailscale está disponible)
  - `sshPort=<port>` (solo en modo mDNS completo; el DNS-SD de área extensa puede omitirlo, en cuyo caso se usan los valores predeterminados de SSH en `22`)
  - `cliPath=<path>` (solo en modo mDNS completo; el DNS-SD de área extensa sigue escribiéndolo como pista para instalación remota)

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes deben tratar los valores TXT solo como pistas de UX.
- El enrutamiento (host/puerto) debe preferir el **endpoint de servicio resuelto** (SRV + A/AAAA) frente a `lanHost`, `tailnetDns` o `gatewayPort` proporcionados por TXT.
- La fijación de TLS nunca debe permitir que un `gatewayTlsSha256` anunciado anule una huella fijada previamente almacenada.
- Los nodos iOS/Android deben requerir una confirmación explícita de “confiar en esta huella” antes de almacenar una fijación inicial (verificación fuera de banda) siempre que la ruta elegida sea segura/basada en TLS.

Desactivar/anular:

- `OPENCLAW_DISABLE_BONJOUR=1` desactiva el anuncio.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de vinculación del Gateway.
- `OPENCLAW_SSH_PORT` anula el puerto SSH anunciado cuando se emite `sshPort`.
- `OPENCLAW_TAILNET_DNS` publica una pista `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` anula la ruta de CLI anunciada.

### 2) Tailnet (entre redes)

Para configuraciones tipo London/Vienna, Bonjour no sirve. El objetivo “directo” recomendado es:

- nombre MagicDNS de Tailscale (preferido) o una IP tailnet estable.

Si el gateway puede detectar que se está ejecutando bajo Tailscale, publica `tailnetDns` como pista opcional para los clientes (incluidas las balizas de área extensa).

La app de macOS ahora prefiere nombres MagicDNS frente a IP de Tailscale sin procesar para el descubrimiento de gateways. Esto mejora la fiabilidad cuando las IP de tailnet cambian (por ejemplo tras reinicios de nodos o reasignación CGNAT), porque los nombres MagicDNS se resuelven automáticamente a la IP actual.

Para la vinculación de nodos móviles, las pistas de descubrimiento no relajan la seguridad del transporte en rutas tailnet/públicas:

- iOS/Android siguen requiriendo una ruta segura de primera conexión en tailnet/pública (`wss://` o Tailscale Serve/Funnel).
- Una IP tailnet sin procesar descubierta es una pista de enrutamiento, no un permiso para usar `ws://` remoto en texto plano.
- La conexión directa `ws://` en LAN privada sigue siendo compatible.
- Si quieres la ruta más simple de Tailscale para nodos móviles, usa Tailscale Serve para que el descubrimiento y el código de configuración resuelvan ambos al mismo endpoint seguro de MagicDNS.

### 3) Objetivo manual / SSH

Cuando no hay una ruta directa (o el modo directo está desactivado), los clientes siempre pueden conectarse por SSH reenviando el puerto loopback del gateway.

Consulta [Acceso remoto](/es/gateway/remote).

## Selección de transporte (política del cliente)

Comportamiento recomendado del cliente:

1. Si hay configurado y accesible un endpoint directo vinculado, úsalo.
2. Si no, si el descubrimiento encuentra un gateway en `local.` o en el dominio de área extensa configurado, ofrece una opción de un toque “Usar este gateway” y guárdala como endpoint directo.
3. Si no, si está configurado un DNS/IP de tailnet, prueba directo.
   Para nodos móviles en rutas tailnet/públicas, directo significa un endpoint seguro, no `ws://` remoto en texto plano.
4. Si no, recurre a SSH.

## Vinculación + autenticación (transporte directo)

El gateway es la fuente de verdad para la admisión de nodos/clientes.

- Las solicitudes de vinculación se crean/aprueban/rechazan en el gateway (consulta [Vinculación del Gateway](/es/gateway/pairing)).
- El gateway aplica:
  - autenticación (token / par de claves)
  - ámbitos/ACL (el gateway no es un proxy sin procesar para todos los métodos)
  - límites de velocidad

## Responsabilidades por componente

- **Gateway**: anuncia balizas de descubrimiento, es propietario de las decisiones de vinculación y aloja el endpoint WS.
- **App de macOS**: te ayuda a elegir un gateway, muestra solicitudes de vinculación y usa SSH solo como alternativa.
- **Nodos iOS/Android**: exploran Bonjour por comodidad y se conectan al Gateway WS vinculado.

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Tailscale](/es/gateway/tailscale)
- [Descubrimiento Bonjour](/es/gateway/bonjour)
