---
read_when:
    - Implementar o cambiar el descubrimiento/anuncio de Bonjour
    - Ajustar los modos de conexión remota (directa vs. SSH)
    - Diseñar el descubrimiento de nodos y el emparejamiento para nodos remotos
summary: Descubrimiento y transportes de Node (Bonjour, Tailscale, SSH) para encontrar el gateway
title: Descubrimiento y transportes
x-i18n:
    generated_at: "2026-07-05T11:18:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw tiene dos problemas de descubrimiento relacionados pero distintos:

1. **Control remoto del operador**: la app de la barra de menús de macOS que controla un Gateway que se ejecuta en otro lugar.
2. **Emparejamiento de Node**: iOS/Android (y futuros Nodes) encontrando un Gateway y emparejándose de forma segura.

Todo el descubrimiento/anuncio de red vive en el **Node Gateway**
(`openclaw gateway`); los clientes (app de Mac, iOS) son solo consumidores.

## Términos

- **Gateway**: un único proceso de larga ejecución que posee el estado (sesiones,
  emparejamiento, registro de Nodes) y ejecuta canales. La mayoría de las configuraciones usan uno por host;
  las configuraciones aisladas con múltiples Gateways son posibles.
- **Gateway WS (plano de control)**: el endpoint WebSocket en `127.0.0.1:18789`
  de forma predeterminada; enlázalo a LAN/tailnet mediante `gateway.bind`.
- **Transporte Direct WS**: un endpoint Gateway WS orientado a LAN/tailnet (sin SSH).
- **Transporte SSH (respaldo)**: control remoto reenviando
  `127.0.0.1:18789` por SSH.
- **Puente TCP heredado (eliminado)**: transporte de Node anterior (consulta
  [Protocolo de puente](/es/gateway/bridge-protocol)); ya no se anuncia para
  descubrimiento y ya no forma parte de las compilaciones actuales.

Detalles del protocolo: [Protocolo de Gateway](/es/gateway/protocol),
[Protocolo de puente (heredado)](/es/gateway/bridge-protocol).

## Por qué existen tanto direct como SSH

- **Direct WS** ofrece la mejor experiencia de usuario en la misma red y dentro de una tailnet: descubrimiento automático de LAN mediante Bonjour, tokens de emparejamiento y ACLs propiedad del Gateway,
  y no requiere acceso al shell.
- **SSH** es el respaldo universal: funciona en cualquier lugar donde tengas acceso SSH, incluso
  entre redes no relacionadas, sobrevive a problemas de multicast/mDNS y no necesita ningún puerto
  entrante nuevo aparte de SSH.

## Entradas de descubrimiento

### 1) Bonjour / DNS-SD

Bonjour multicast es de mejor esfuerzo y no cruza redes. OpenClaw también
admite explorar el mismo beacon del Gateway mediante un dominio DNS-SD de área amplia
configurado, de modo que el descubrimiento pueda cubrir tanto `local.` en la misma LAN como un dominio
DNS-SD unicast configurado para descubrimiento entre redes.

El **Gateway** anuncia su endpoint WS mediante Bonjour cuando el Plugin
`bonjour` incluido está habilitado; los clientes exploran y muestran una lista de "elegir un Gateway",
y luego almacenan el endpoint elegido.

Solución de problemas y detalles del beacon: [Bonjour](/es/gateway/bonjour).

#### Detalles del beacon de servicio

- Tipo de servicio: `_openclaw-gw._tcp` (beacon de transporte de Gateway).
- Claves TXT (no secretas):

  | Clave                       | Notas                                                                                                                                                            |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Siempre presente.                                                                                                                                                |
  | `transport=gateway`         | Siempre presente.                                                                                                                                                |
  | `displayName=<name>`        | Nombre visible configurado por el operador.                                                                                                                      |
  | `lanHost=<hostname>.local`  | Solo anunciante mDNS de LAN; DNS-SD de área amplia no lo escribe.                                                                                                |
  | `gatewayPort=18789`         | Puerto Gateway WS + HTTP.                                                                                                                                        |
  | `gatewayTls=1`              | Solo cuando TLS está habilitado.                                                                                                                                 |
  | `gatewayTlsSha256=<sha256>` | Solo cuando TLS está habilitado y hay una huella digital disponible.                                                                                             |
  | `tailnetDns=<magicdns>`     | Indicio opcional; se detecta automáticamente cuando Tailscale está disponible.                                                                                    |
  | `sshPort=<port>`            | Presente solo cuando `discovery.mdns.mode="full"`; se omite (SSH usa `22` de forma predeterminada) en el modo predeterminado `"minimal"`, tanto en el anunciante LAN como en DNS-SD de área amplia. |
  | `cliPath=<path>`            | La misma condición `discovery.mdns.mode="full"` que `sshPort`; un indicio de instalación remota para la ruta de la CLI.                                          |

  Una clave TXT `canvasPort` está definida en el contrato de descubrimiento del Plugin para un
  futuro puerto de host de canvas, pero ninguna ruta de código actual establece un valor, por lo que
  hoy nunca se emite.

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes deben tratar los valores TXT
  solo como indicios de experiencia de usuario.
- El enrutamiento (host/puerto) debería preferir el **endpoint de servicio resuelto**
  (SRV + A/AAAA) sobre `lanHost`, `tailnetDns` o `gatewayPort` proporcionados por TXT.
- La fijación de TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sobrescriba una
  fijación almacenada previamente.
- Los Nodes iOS/Android deberían requerir una confirmación explícita de "confiar en esta huella digital"
  antes de almacenar una fijación por primera vez (verificación fuera de banda)
  siempre que la ruta elegida esté basada en seguridad/TLS.

Habilitar, deshabilitar y sobrescribir:

- `openclaw plugins enable bonjour` habilita el anuncio multicast de LAN.
- `discovery.mdns.mode` en `openclaw.json` controla la difusión mDNS:
  `"minimal"` (predeterminado), `"full"` (agrega `cliPath`/`sshPort` tanto al beacon LAN
  como a cualquier zona DNS-SD de área amplia), u `"off"` (deshabilita mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` fuerza la deshabilitación del anuncio; `discovery.mdns.mode="off"`
  lo deshabilita independientemente. `OPENCLAW_DISABLE_BONJOUR=0` es una
  aceptación explícita que sobrescribe la deshabilitación automática del Plugin dentro de un contenedor detectado
  (Docker, containerd, Kubernetes, LXC); no sobrescribe
  `discovery.mdns.mode="off"`. El Plugin `bonjour` incluido se inicia automáticamente en
  hosts macOS (`enabledByDefaultOnPlatforms: ["darwin"]`) y se deshabilita automáticamente
  dentro de contenedores detectados; Linux, Windows y otros despliegues
  en contenedores necesitan `plugins enable bonjour` explícito.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de enlace del Gateway.
- `OPENCLAW_SSH_PORT` sobrescribe el puerto SSH anunciado (solo tiene efecto
  cuando `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` publica un indicio `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sobrescribe la ruta CLI anunciada.

### 2) Tailnet (entre redes)

Para Gateways en redes físicas diferentes, Bonjour no ayudará. El
destino directo recomendado es un nombre MagicDNS de Tailscale (preferido) o una
IP estable de tailnet.

Si el Gateway detecta que se está ejecutando bajo Tailscale, publica
`tailnetDns` como un indicio opcional para los clientes (incluidos los beacons de área amplia).
La app de macOS prefiere nombres MagicDNS sobre IPs sin procesar de Tailscale para el descubrimiento
del Gateway, lo que sigue siendo fiable cuando cambian las IPs de tailnet (reinicios de Node,
reasignación CGNAT), ya que MagicDNS resuelve automáticamente a la IP actual.

Para el emparejamiento de Nodes móviles, los indicios de descubrimiento nunca relajan la seguridad del transporte en
rutas tailnet/públicas:

- iOS/Android siguen requiriendo una ruta segura de conexión inicial tailnet/pública
  (`wss://` o Tailscale Serve/Funnel).
- Una IP tailnet sin procesar descubierta es un indicio de enrutamiento, no permiso para usar
  `ws://` remoto en texto plano.
- La conexión directa privada de LAN `ws://` sigue siendo compatible.
- Para la ruta de Tailscale más simple en Nodes móviles, usa Tailscale Serve para que
  el descubrimiento y la configuración resuelvan ambos al mismo endpoint MagicDNS seguro.

### 3) Destino manual / SSH

Cuando no hay ruta directa (o direct está deshabilitado), los clientes siempre pueden
conectarse mediante SSH reenviando el puerto de Gateway de loopback. Consulta
[Acceso remoto](/es/gateway/remote).

## Selección de transporte (política del cliente)

1. Si un endpoint directo emparejado está configurado y accesible, úsalo.
2. De lo contrario, si el descubrimiento encuentra un Gateway en `local.` o en el dominio de área amplia
   configurado, ofrece una opción de un toque "Usar este Gateway" y guárdala como
   endpoint directo.
3. De lo contrario, si hay una DNS/IP de tailnet configurada, prueba direct. Para Nodes móviles en
   rutas tailnet/públicas, direct significa un endpoint seguro, no `ws://`
   remoto en texto plano.
4. De lo contrario, recurre a SSH.

## Emparejamiento y autenticación (transporte direct)

El Gateway es la fuente de verdad para la admisión de Nodes/clientes:

- Las solicitudes de emparejamiento se crean/aprueban/rechazan en el Gateway (consulta
  [Emparejamiento de Gateway](/es/gateway/pairing)).
- El Gateway aplica autenticación (token/par de claves), alcances/ACLs (no es un proxy sin procesar
  para cada método) y límites de tasa.

## Responsabilidades por componente

- **Gateway**: anuncia beacons de descubrimiento, posee decisiones de emparejamiento, aloja
  el endpoint WS.
- **App de macOS**: te ayuda a elegir un Gateway, muestra solicitudes de emparejamiento, usa SSH
  solo como respaldo.
- **Nodes iOS/Android**: exploran Bonjour como comodidad, se conectan al
  Gateway WS emparejado.

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Tailscale](/es/gateway/tailscale)
- [Descubrimiento Bonjour](/es/gateway/bonjour)
