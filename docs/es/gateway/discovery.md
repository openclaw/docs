---
read_when:
    - Implementación o modificación del descubrimiento o la publicidad mediante Bonjour
    - Ajuste de los modos de conexión remota (directa frente a SSH)
    - Diseño del descubrimiento y emparejamiento de nodos remotos
summary: Detección de Node y transportes (Bonjour, Tailscale, SSH) para encontrar el Gateway
title: Descubrimiento y transportes
x-i18n:
    generated_at: "2026-07-11T23:06:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw tiene dos problemas de descubrimiento relacionados pero distintos:

1. **Control remoto del operador**: la aplicación de la barra de menús de macOS controla un Gateway que se ejecuta en otro lugar.
2. **Emparejamiento de nodos**: iOS/Android (y futuros nodos) encuentran un Gateway y se emparejan de forma segura.

Todo el descubrimiento y la publicidad de red se realizan en el **Gateway del nodo**
(`openclaw gateway`); los clientes (aplicación para Mac, iOS) solo consumen esta información.

## Términos

- **Gateway**: un único proceso de larga duración que posee el estado (sesiones,
  emparejamiento, registro de nodos) y ejecuta canales. La mayoría de las configuraciones usan uno por host;
  también son posibles configuraciones aisladas con varios Gateway.
- **WS del Gateway (plano de control)**: el punto de conexión WebSocket en `127.0.0.1:18789`
  de forma predeterminada; vincúlelo a la LAN o tailnet mediante `gateway.bind`.
- **Transporte WS directo**: un punto de conexión WS del Gateway accesible desde la LAN o tailnet (sin SSH).
- **Transporte SSH (alternativa)**: control remoto mediante el reenvío de
  `127.0.0.1:18789` a través de SSH.
- **Puente TCP heredado (eliminado)**: transporte de nodos anterior (consulte
  [Protocolo del puente](/es/gateway/bridge-protocol)); ya no se anuncia para el
  descubrimiento ni forma parte de las compilaciones actuales.

Detalles del protocolo: [Protocolo del Gateway](/es/gateway/protocol),
[Protocolo del puente (heredado)](/es/gateway/bridge-protocol).

## Por qué existen tanto la conexión directa como SSH

- **WS directo** ofrece la mejor experiencia de usuario en la misma red y dentro de una tailnet:
  descubrimiento automático en la LAN mediante Bonjour, tokens de emparejamiento y ACL gestionados por el Gateway,
  sin necesidad de acceso al shell.
- **SSH** es la alternativa universal: funciona en cualquier lugar donde tenga acceso SSH, incluso
  entre redes no relacionadas, evita los problemas de multidifusión/mDNS y no necesita ningún
  puerto de entrada nuevo aparte del de SSH.

## Fuentes de descubrimiento

### 1) Bonjour / DNS-SD

Bonjour por multidifusión funciona sin garantías y no atraviesa redes. OpenClaw también
permite explorar la misma señal del Gateway mediante un dominio DNS-SD de área amplia
configurado, por lo que el descubrimiento puede abarcar tanto `local.` en la misma LAN como un dominio
DNS-SD unidifusión configurado para el descubrimiento entre redes.

El **Gateway** anuncia su punto de conexión WS mediante Bonjour cuando el Plugin
`bonjour` incluido está habilitado; los clientes exploran y muestran una lista para «elegir un Gateway»,
y después almacenan el punto de conexión seleccionado.

Solución de problemas y detalles de la señal: [Bonjour](/es/gateway/bonjour).

#### Detalles de la señal del servicio

- Tipo de servicio: `_openclaw-gw._tcp` (señal de transporte del Gateway).
- Claves TXT (no secretas):

  | Clave                       | Notas                                                                                                                                                            |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Siempre presente.                                                                                                                                                |
  | `transport=gateway`         | Siempre presente.                                                                                                                                                |
  | `displayName=<name>`        | Nombre para mostrar configurado por el operador.                                                                                                                 |
  | `lanHost=<hostname>.local`  | Solo para el anunciante mDNS de la LAN; DNS-SD de área amplia no lo escribe.                                                                                     |
  | `gatewayPort=18789`         | Puerto de WS y HTTP del Gateway.                                                                                                                                 |
  | `gatewayTls=1`              | Solo cuando TLS está habilitado.                                                                                                                                 |
  | `gatewayTlsSha256=<sha256>` | Solo cuando TLS está habilitado y hay una huella digital disponible.                                                                                             |
  | `tailnetDns=<magicdns>`     | Indicación opcional; se detecta automáticamente cuando Tailscale está disponible.                                                                                |
  | `sshPort=<port>`            | Solo está presente cuando `discovery.mdns.mode="full"`; se omite (SSH usa `22` de forma predeterminada) en el modo `"minimal"` predeterminado, tanto en el anunciante de la LAN como en DNS-SD de área amplia. |
  | `cliPath=<path>`            | La misma condición `discovery.mdns.mode="full"` que `sshPort`; una indicación de instalación remota para la ruta de la CLI.                                      |

  En el contrato de descubrimiento del Plugin se define una clave TXT `canvasPort` para un
  futuro puerto de host del lienzo, pero ninguna ruta de código actual establece un valor, por lo que
  actualmente nunca se emite.

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes deben tratar los valores TXT
  únicamente como indicaciones para la experiencia de usuario.
- El enrutamiento (host/puerto) debe dar preferencia al **punto de conexión del servicio resuelto**
  (SRV + A/AAAA) frente a `lanHost`, `tailnetDns` o `gatewayPort` proporcionados mediante TXT.
- La fijación de TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sustituya una
  huella fijada previamente.
- Los nodos iOS/Android deben exigir una confirmación explícita de «confiar en esta huella digital»
  antes de almacenar una huella por primera vez (verificación fuera de banda)
  siempre que la ruta elegida sea segura o esté basada en TLS.

Habilitación, deshabilitación y sustitución:

- `openclaw plugins enable bonjour` habilita la publicidad por multidifusión en la LAN.
- `discovery.mdns.mode` en `openclaw.json` controla la difusión mDNS:
  `"minimal"` (predeterminado), `"full"` (añade `cliPath`/`sshPort` tanto a la
  señal de la LAN como a cualquier zona DNS-SD de área amplia) o `"off"` (deshabilita mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` fuerza la deshabilitación de la publicidad; `discovery.mdns.mode="off"`
  la deshabilita de forma independiente. `OPENCLAW_DISABLE_BONJOUR=0` habilita explícitamente
  la publicidad y anula la deshabilitación automática del Plugin dentro de un contenedor detectado
  (Docker, containerd, Kubernetes, LXC); no anula
  `discovery.mdns.mode="off"`. El Plugin `bonjour` incluido se inicia automáticamente en
  hosts macOS (`enabledByDefaultOnPlatforms: ["darwin"]`) y se deshabilita automáticamente
  dentro de los contenedores detectados; Linux, Windows y otros despliegues
  en contenedores deben ejecutar explícitamente `plugins enable bonjour`.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de vinculación del Gateway.
- `OPENCLAW_SSH_PORT` sustituye el puerto SSH anunciado (solo surte efecto
  cuando `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` publica una indicación `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sustituye la ruta de la CLI anunciada.

### 2) Tailnet (entre redes)

Para los Gateway situados en redes físicas distintas, Bonjour no será útil. El
destino directo recomendado es un nombre MagicDNS de Tailscale (preferido) o una
IP estable de la tailnet.

Si el Gateway detecta que se ejecuta bajo Tailscale, publica
`tailnetDns` como indicación opcional para los clientes (incluidas las señales de área amplia).
La aplicación para macOS prefiere los nombres MagicDNS frente a las direcciones IP sin procesar de Tailscale para el
descubrimiento del Gateway, lo que mantiene la fiabilidad cuando cambian las direcciones IP de la tailnet (reinicios de nodos,
reasignación de CGNAT), ya que MagicDNS resuelve automáticamente la dirección IP actual.

Para el emparejamiento de nodos móviles, las indicaciones de descubrimiento nunca reducen la seguridad del transporte en
rutas de tailnet o públicas:

- iOS/Android siguen necesitando una ruta segura para la primera conexión por tailnet o una red pública
  (`wss://` o Tailscale Serve/Funnel).
- Una dirección IP de tailnet sin procesar descubierta es una indicación de enrutamiento, no un permiso para usar
  `ws://` remoto sin cifrar.
- La conexión directa privada por LAN mediante `ws://` sigue siendo compatible.
- Para obtener la ruta de Tailscale más sencilla en nodos móviles, use Tailscale Serve para que
  tanto el descubrimiento como la configuración se resuelvan al mismo punto de conexión MagicDNS seguro.

### 3) Destino manual / SSH

Cuando no existe una ruta directa (o la conexión directa está deshabilitada), los clientes siempre pueden
conectarse mediante SSH reenviando el puerto del Gateway en local loopback. Consulte
[Acceso remoto](/es/gateway/remote).

## Selección de transporte (política del cliente)

1. Si hay configurado un punto de conexión directo emparejado y es accesible, úselo.
2. En caso contrario, si el descubrimiento encuentra un Gateway en `local.` o en el dominio de área amplia
   configurado, ofrezca una opción de un toque «Usar este Gateway» y guárdelo como
   punto de conexión directo.
3. En caso contrario, si hay configurada una dirección DNS/IP de la tailnet, intente la conexión directa. Para los nodos móviles en
   rutas de tailnet o públicas, «directa» significa un punto de conexión seguro, no un
   `ws://` remoto sin cifrar.
4. En caso contrario, recurra a SSH.

## Emparejamiento y autenticación (transporte directo)

El Gateway es la fuente de referencia para la admisión de nodos y clientes:

- Las solicitudes de emparejamiento se crean, aprueban o rechazan en el Gateway (consulte
  [Emparejamiento del Gateway](/es/gateway/pairing)).
- El Gateway aplica la autenticación (token/par de claves), los ámbitos/ACL (no es un proxy sin restricciones
  para todos los métodos) y los límites de frecuencia.

## Responsabilidades por componente

- **Gateway**: anuncia señales de descubrimiento, gestiona las decisiones de emparejamiento y aloja
  el punto de conexión WS.
- **Aplicación para macOS**: le ayuda a elegir un Gateway, muestra solicitudes de emparejamiento y usa SSH
  solo como alternativa.
- **Nodos iOS/Android**: exploran Bonjour por comodidad y se conectan al
  WS del Gateway emparejado.

## Contenido relacionado

- [Acceso remoto](/es/gateway/remote)
- [Tailscale](/es/gateway/tailscale)
- [Descubrimiento mediante Bonjour](/es/gateway/bonjour)
