---
read_when:
    - Implementar o cambiar el descubrimiento/publicación con Bonjour
    - Ajustar los modos de conexión remota (directa vs SSH)
    - Diseñar el descubrimiento de Node + emparejamiento para Nodes remotos
summary: Descubrimiento de Node y transportes (Bonjour, Tailscale, SSH) para encontrar el Gateway
title: Descubrimiento y transportes
x-i18n:
    generated_at: "2026-04-26T11:28:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# Descubrimiento y transportes

OpenClaw tiene dos problemas distintos que en la superficie parecen similares:

1. **Control remoto del operador**: la app de barra de menú de macOS controlando un Gateway que se ejecuta en otro lugar.
2. **Emparejamiento de Node**: iOS/Android (y futuros Nodes) encontrando un Gateway y emparejándose de forma segura.

El objetivo de diseño es mantener todo el descubrimiento/publicación de red en el **Node Gateway** (`openclaw gateway`) y mantener a los clientes (app de Mac, iOS) como consumidores.

## Términos

- **Gateway**: un único proceso Gateway de larga ejecución que posee el estado (sesiones, emparejamiento, registro de Nodes) y ejecuta canales. La mayoría de las configuraciones usan uno por host; son posibles configuraciones aisladas con varios gateways.
- **Gateway WS (plano de control)**: el endpoint WebSocket en `127.0.0.1:18789` por defecto; puede vincularse a LAN/tailnet mediante `gateway.bind`.
- **Transporte WS directo**: un endpoint Gateway WS expuesto a LAN/tailnet (sin SSH).
- **Transporte SSH (alternativa)**: control remoto reenviando `127.0.0.1:18789` a través de SSH.
- **Puente TCP heredado (eliminado)**: transporte de Node antiguo (consulta
  [Protocolo de puente](/es/gateway/bridge-protocol)); ya no se publica para
  descubrimiento y ya no forma parte de las compilaciones actuales.

Detalles del protocolo:

- [Protocolo del Gateway](/es/gateway/protocol)
- [Protocolo de puente (heredado)](/es/gateway/bridge-protocol)

## Por qué mantenemos tanto “directo” como SSH

- **WS directo** es la mejor UX en la misma red y dentro de una tailnet:
  - autodetección en LAN mediante Bonjour
  - tokens de emparejamiento + ACL gestionados por el Gateway
  - no requiere acceso de shell; la superficie del protocolo puede seguir siendo limitada y auditable
- **SSH** sigue siendo la alternativa universal:
  - funciona en cualquier lugar donde tengas acceso SSH (incluso entre redes no relacionadas)
  - sobrevive a problemas de multidifusión/mDNS
  - no requiere nuevos puertos entrantes aparte de SSH

## Entradas de descubrimiento (cómo los clientes saben dónde está el Gateway)

### 1) Descubrimiento Bonjour / DNS-SD

Bonjour por multidifusión funciona según el mejor esfuerzo y no cruza redes. OpenClaw también puede explorar la
misma baliza del Gateway mediante un dominio DNS-SD de área amplia configurado, de modo que el descubrimiento puede cubrir:

- `local.` en la misma LAN
- un dominio DNS-SD unicast configurado para descubrimiento entre redes

Dirección objetivo:

- El **Gateway** publica su endpoint WS mediante Bonjour.
- Los clientes exploran y muestran una lista de “elegir un Gateway”, y luego almacenan el endpoint elegido.

Detalles de solución de problemas y balizas: [Bonjour](/es/gateway/bonjour).

#### Detalles de la baliza de servicio

- Tipos de servicio:
  - `_openclaw-gw._tcp` (baliza de transporte del gateway)
- Claves TXT (no secretas):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<nombre descriptivo>` (nombre visible configurado por el operador)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (solo cuando TLS está habilitado)
  - `gatewayTlsSha256=<sha256>` (solo cuando TLS está habilitado y la huella digital está disponible)
  - `canvasPort=<port>` (puerto del host de canvas; actualmente es el mismo que `gatewayPort` cuando el host de canvas está habilitado)
  - `tailnetDns=<magicdns>` (sugerencia opcional; se detecta automáticamente cuando Tailscale está disponible)
  - `sshPort=<port>` (solo en modo mDNS completo; DNS-SD de área amplia puede omitirlo, en cuyo caso los valores predeterminados de SSH siguen siendo `22`)
  - `cliPath=<path>` (solo en modo mDNS completo; DNS-SD de área amplia sigue escribiéndolo como sugerencia de instalación remota)

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS son **no autenticados**. Los clientes deben tratar los valores TXT solo como sugerencias de UX.
- El enrutamiento (host/puerto) debe preferir el **endpoint del servicio resuelto** (SRV + A/AAAA) sobre `lanHost`, `tailnetDns` o `gatewayPort` proporcionados en TXT.
- El pinning de TLS nunca debe permitir que un `gatewayTlsSha256` publicado sustituya un pin almacenado previamente.
- Los Nodes de iOS/Android deben requerir una confirmación explícita de “confiar en esta huella digital” antes de almacenar un pin por primera vez (verificación fuera de banda) siempre que la ruta elegida sea segura o se base en TLS.

Desactivar/sustituir:

- `OPENCLAW_DISABLE_BONJOUR=1` desactiva la publicación.
- Docker Compose usa por defecto `OPENCLAW_DISABLE_BONJOUR=1` porque las redes bridge
  normalmente no transportan de forma fiable la multidifusión mDNS; usa `0` solo en host, macvlan
  u otra red compatible con mDNS.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de enlace del Gateway.
- `OPENCLAW_SSH_PORT` sustituye el puerto SSH publicado cuando se emite `sshPort`.
- `OPENCLAW_TAILNET_DNS` publica una sugerencia `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sustituye la ruta CLI publicada.

### 2) Tailnet (entre redes)

Para configuraciones estilo Londres/Viena, Bonjour no ayudará. El destino “directo” recomendado es:

- nombre MagicDNS de Tailscale (preferido) o una IP tailnet estable.

Si el Gateway puede detectar que se está ejecutando bajo Tailscale, publica `tailnetDns` como sugerencia opcional para los clientes (incluidas las balizas de área amplia).

Ahora la app de macOS prefiere nombres MagicDNS sobre IP sin procesar de Tailscale para el descubrimiento del Gateway. Esto mejora la fiabilidad cuando cambian las IP tailnet (por ejemplo, tras reinicios de Node o reasignación de CGNAT), porque los nombres MagicDNS resuelven automáticamente a la IP actual.

Para el emparejamiento de Nodes móviles, las sugerencias de descubrimiento no relajan la seguridad del transporte en rutas tailnet/públicas:

- iOS/Android siguen requiriendo una ruta segura en la primera conexión tailnet/pública (`wss://` o Tailscale Serve/Funnel).
- Una IP tailnet sin procesar descubierta es una sugerencia de enrutamiento, no un permiso para usar `ws://` remoto en texto plano.
- La conexión directa privada por LAN con `ws://` sigue siendo compatible.
- Si quieres la ruta Tailscale más sencilla para Nodes móviles, usa Tailscale Serve para que tanto el descubrimiento como el código de configuración resuelvan al mismo endpoint seguro de MagicDNS.

### 3) Destino manual / SSH

Cuando no hay una ruta directa (o la ruta directa está deshabilitada), los clientes siempre pueden conectarse mediante SSH reenviando el puerto loopback del Gateway.

Consulta [Acceso remoto](/es/gateway/remote).

## Selección de transporte (política del cliente)

Comportamiento recomendado del cliente:

1. Si hay un endpoint directo emparejado configurado y es accesible, úsalo.
2. En caso contrario, si el descubrimiento encuentra un Gateway en `local.` o en el dominio de área amplia configurado, ofrece una opción de un toque “Usar este Gateway” y guárdalo como endpoint directo.
3. En caso contrario, si hay configurado un DNS/IP tailnet, intenta conexión directa.
   Para Nodes móviles en rutas tailnet/públicas, directo significa un endpoint seguro, no `ws://` remoto en texto plano.
4. En caso contrario, recurre a SSH.

## Emparejamiento + autenticación (transporte directo)

El Gateway es la fuente de verdad para la admisión de Node/cliente.

- Las solicitudes de emparejamiento se crean/aprueban/rechazan en el Gateway (consulta [Emparejamiento del Gateway](/es/gateway/pairing)).
- El Gateway aplica:
  - autenticación (token / keypair)
  - alcances/ACL (el Gateway no es un proxy sin procesar para todos los métodos)
  - límites de tasa

## Responsabilidades por componente

- **Gateway**: publica balizas de descubrimiento, controla las decisiones de emparejamiento y aloja el endpoint WS.
- **App de macOS**: te ayuda a elegir un Gateway, muestra avisos de emparejamiento y usa SSH solo como alternativa.
- **Nodes de iOS/Android**: exploran Bonjour como comodidad y se conectan al Gateway WS emparejado.

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Tailscale](/es/gateway/tailscale)
- [Descubrimiento Bonjour](/es/gateway/bonjour)
