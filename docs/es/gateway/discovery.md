---
read_when:
    - Implementar o modificar el descubrimiento/anuncio de Bonjour
    - Ajustar los modos de conexión remota (directa vs. SSH)
    - Diseño del descubrimiento de nodos + emparejamiento para nodos remotos
summary: Descubrimiento de Node y transportes (Bonjour, Tailscale, SSH) para encontrar el Gateway
title: Descubrimiento y transportes
x-i18n:
    generated_at: "2026-04-30T05:41:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# Descubrimiento y transportes

OpenClaw tiene dos problemas distintos que parecen similares en la superficie:

1. **Control remoto del operador**: la app de barra de menús de macOS que controla un Gateway ejecutándose en otro lugar.
2. **Emparejamiento de Node**: iOS/Android (y futuros nodes) encontrando un Gateway y emparejándose de forma segura.

El objetivo de diseño es mantener todo el descubrimiento/anuncio de red en el **Node Gateway** (`openclaw gateway`) y mantener los clientes (app de Mac, iOS) como consumidores.

## Términos

- **Gateway**: un único proceso Gateway de larga ejecución que posee el estado (sesiones, emparejamiento, registro de Node) y ejecuta canales. La mayoría de las configuraciones usan uno por host; son posibles configuraciones aisladas con varios Gateways.
- **Gateway WS (plano de control)**: el endpoint WebSocket en `127.0.0.1:18789` de forma predeterminada; puede vincularse a LAN/tailnet mediante `gateway.bind`.
- **Transporte WS directo**: un endpoint Gateway WS expuesto a LAN/tailnet (sin SSH).
- **Transporte SSH (respaldo)**: control remoto reenviando `127.0.0.1:18789` mediante SSH.
- **Puente TCP heredado (eliminado)**: transporte de Node más antiguo (consulta
  [Protocolo de puente](/es/gateway/bridge-protocol)); ya no se anuncia para el
  descubrimiento y ya no forma parte de las compilaciones actuales.

Detalles del protocolo:

- [Protocolo Gateway](/es/gateway/protocol)
- [Protocolo de puente (heredado)](/es/gateway/bridge-protocol)

## Por qué mantenemos tanto "directo" como SSH

- **WS directo** es la mejor UX en la misma red y dentro de una tailnet:
  - descubrimiento automático en LAN mediante Bonjour
  - tokens de emparejamiento + ACL propiedad del Gateway
  - no se requiere acceso a shell; la superficie del protocolo puede mantenerse ajustada y auditable
- **SSH** sigue siendo el respaldo universal:
  - funciona en cualquier lugar donde tengas acceso SSH (incluso entre redes no relacionadas)
  - sobrevive a problemas de multicast/mDNS
  - no requiere nuevos puertos entrantes además de SSH

## Entradas de descubrimiento (cómo los clientes descubren dónde está el Gateway)

### 1) Descubrimiento Bonjour / DNS-SD

Bonjour multicast es de mejor esfuerzo y no cruza redes. OpenClaw también puede explorar la
misma baliza del Gateway mediante un dominio DNS-SD de área amplia configurado, por lo que el descubrimiento puede cubrir:

- `local.` en la misma LAN
- un dominio DNS-SD unicast configurado para descubrimiento entre redes

Dirección objetivo:

- El **Gateway** anuncia su endpoint WS mediante Bonjour.
- Los clientes exploran y muestran una lista para “elegir un Gateway”, luego almacenan el endpoint elegido.

Solución de problemas y detalles de la baliza: [Bonjour](/es/gateway/bonjour).

#### Detalles de la baliza de servicio

- Tipos de servicio:
  - `_openclaw-gw._tcp` (baliza de transporte Gateway)
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

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes deben tratar los valores TXT solo como pistas de UX.
- El enrutamiento (host/puerto) debe preferir el **endpoint de servicio resuelto** (SRV + A/AAAA) por encima de `lanHost`, `tailnetDns` o `gatewayPort` proporcionados por TXT.
- La fijación TLS nunca debe permitir que un `gatewayTlsSha256` anunciado anule una fijación almacenada previamente.
- Los nodes de iOS/Android deben requerir una confirmación explícita de “confiar en esta huella digital” antes de almacenar una fijación por primera vez (verificación fuera de banda) siempre que la ruta elegida sea segura/basada en TLS.

Deshabilitar/anular:

- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita el anuncio.
- Cuando `OPENCLAW_DISABLE_BONJOUR` no está definido, Bonjour anuncia en hosts normales
  y se deshabilita automáticamente dentro de contenedores detectados. Usa `0` solo en host, macvlan
  u otra red compatible con mDNS; usa `1` para forzar la deshabilitación.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de vinculación del Gateway.
- `OPENCLAW_SSH_PORT` anula el puerto SSH anunciado cuando se emite `sshPort`.
- `OPENCLAW_TAILNET_DNS` publica una pista `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` anula la ruta anunciada de la CLI.

### 2) Tailnet (entre redes)

Para configuraciones estilo Londres/Viena, Bonjour no ayudará. El objetivo “directo” recomendado es:

- Nombre MagicDNS de Tailscale (preferido) o una IP estable de tailnet.

Si el Gateway puede detectar que se está ejecutando bajo Tailscale, publica `tailnetDns` como pista opcional para los clientes (incluidas balizas de área amplia).

La app de macOS ahora prefiere nombres MagicDNS sobre IP sin procesar de Tailscale para el descubrimiento de Gateway. Esto mejora la fiabilidad cuando cambian las IP de tailnet (por ejemplo, después de reinicios de Node o reasignación de CGNAT), porque los nombres MagicDNS se resuelven automáticamente a la IP actual.

Para el emparejamiento de Node móvil, las pistas de descubrimiento no relajan la seguridad del transporte en rutas de tailnet/públicas:

- iOS/Android aún requieren una ruta segura de conexión inicial tailnet/pública (`wss://` o Tailscale Serve/Funnel).
- Una IP de tailnet sin procesar descubierta es una pista de enrutamiento, no permiso para usar `ws://` remoto en texto claro.
- La conexión directa privada por LAN mediante `ws://` sigue siendo compatible.
- Si quieres la ruta más sencilla de Tailscale para nodes móviles, usa Tailscale Serve para que el descubrimiento y el código de configuración resuelvan ambos al mismo endpoint MagicDNS seguro.

### 3) Destino manual / SSH

Cuando no hay ruta directa (o la directa está deshabilitada), los clientes siempre pueden conectarse mediante SSH reenviando el puerto Gateway de loopback.

Consulta [Acceso remoto](/es/gateway/remote).

## Selección de transporte (política del cliente)

Comportamiento recomendado del cliente:

1. Si un endpoint directo emparejado está configurado y es accesible, úsalo.
2. De lo contrario, si el descubrimiento encuentra un Gateway en `local.` o en el dominio de área amplia configurado, ofrece una opción de un toque “Usar este Gateway” y guárdala como el endpoint directo.
3. De lo contrario, si hay una DNS/IP de tailnet configurada, intenta directo.
   Para nodes móviles en rutas tailnet/públicas, directo significa un endpoint seguro, no `ws://` remoto en texto claro.
4. De lo contrario, recurre a SSH.

## Emparejamiento + autenticación (transporte directo)

El Gateway es la fuente de verdad para la admisión de Node/cliente.

- Las solicitudes de emparejamiento se crean/aprueban/rechazan en el Gateway (consulta [Emparejamiento Gateway](/es/gateway/pairing)).
- El Gateway aplica:
  - autenticación (token / par de claves)
  - ámbitos/ACL (el Gateway no es un proxy sin procesar a todos los métodos)
  - límites de frecuencia

## Responsabilidades por componente

- **Gateway**: anuncia balizas de descubrimiento, posee decisiones de emparejamiento y aloja el endpoint WS.
- **App de macOS**: te ayuda a elegir un Gateway, muestra solicitudes de emparejamiento y usa SSH solo como respaldo.
- **Nodes de iOS/Android**: exploran Bonjour por comodidad y se conectan al Gateway WS emparejado.

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Tailscale](/es/gateway/tailscale)
- [Descubrimiento Bonjour](/es/gateway/bonjour)
