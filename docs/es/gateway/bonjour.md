---
read_when:
    - Depuración de problemas de descubrimiento Bonjour en macOS/iOS
    - Cambiar tipos de servicio mDNS, registros TXT o la experiencia de descubrimiento
summary: Descubrimiento Bonjour/mDNS + depuración (beacons de Gateway, clientes y modos de fallo comunes)
title: Descubrimiento Bonjour/mDNS
x-i18n:
    generated_at: "2026-04-24T05:27:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5d9099ce178aca1e6e443281133928f886de965245ad0fb02ce91a27aad3989
    source_path: gateway/bonjour.md
    workflow: 15
---

# Descubrimiento Bonjour / mDNS

OpenClaw usa Bonjour (mDNS / DNS-SD) para descubrir un Gateway activo (endpoint WebSocket).
La exploración multicast `local.` es una **comodidad solo de LAN**. Para el descubrimiento entre redes, el
mismo beacon también puede publicarse a través de un dominio DNS-SD de área amplia configurado. El descubrimiento
sigue siendo de mejor esfuerzo y **no** reemplaza la conectividad basada en SSH o Tailnet.

## Bonjour de área amplia (DNS-SD unicast) sobre Tailscale

Si el nodo y el gateway están en redes distintas, el mDNS multicast no cruzará ese
límite. Puedes mantener la misma UX de descubrimiento cambiando a **DNS-SD unicast**
("Bonjour de área amplia") sobre Tailscale.

Pasos de alto nivel:

1. Ejecuta un servidor DNS en el host del gateway (accesible por Tailnet).
2. Publica registros DNS-SD para `_openclaw-gw._tcp` bajo una zona dedicada
   (ejemplo: `openclaw.internal.`).
3. Configura Tailscale **split DNS** para que tu dominio elegido se resuelva a través de ese
   servidor DNS para los clientes (incluido iOS).

OpenClaw admite cualquier dominio de descubrimiento; `openclaw.internal.` es solo un ejemplo.
Los nodos iOS/Android exploran tanto `local.` como tu dominio configurado de área amplia.

### Configuración de Gateway (recomendada)

```json5
{
  gateway: { bind: "tailnet" }, // solo tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // habilita la publicación DNS-SD de área amplia
}
```

### Configuración inicial del servidor DNS (host del gateway)

```bash
openclaw dns setup --apply
```

Esto instala CoreDNS y lo configura para que:

- escuche en el puerto 53 solo en las interfaces Tailscale del gateway
- sirva tu dominio elegido (ejemplo: `openclaw.internal.`) desde `~/.openclaw/dns/<domain>.db`

Valida desde una máquina conectada al tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configuración DNS de Tailscale

En la consola de administración de Tailscale:

- Añade un servidor de nombres que apunte a la IP tailnet del gateway (UDP/TCP 53).
- Añade split DNS para que tu dominio de descubrimiento use ese servidor de nombres.

Una vez que los clientes acepten el DNS de tailnet, los nodos iOS y el descubrimiento por CLI podrán explorar
`_openclaw-gw._tcp` en tu dominio de descubrimiento sin multicast.

### Seguridad del listener de Gateway (recomendada)

El puerto WS de Gateway (predeterminado `18789`) se enlaza a loopback de forma predeterminada. Para acceso por LAN/tailnet,
enlázalo explícitamente y mantén la autenticación habilitada.

Para configuraciones solo de tailnet:

- Establece `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json`.
- Reinicia Gateway (o reinicia la app de barra de menús de macOS).

## Qué se anuncia

Solo el Gateway anuncia `_openclaw-gw._tcp`.

## Tipos de servicio

- `_openclaw-gw._tcp` — beacon de transporte de gateway (usado por nodos macOS/iOS/Android).

## Claves TXT (indicaciones no secretas)

El Gateway anuncia pequeñas indicaciones no secretas para hacer convenientes los flujos de UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo cuando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (solo cuando TLS está habilitado y la huella digital está disponible)
- `canvasPort=<port>` (solo cuando el host de canvas está habilitado; actualmente es el mismo que `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (indicación opcional cuando Tailnet está disponible)
- `sshPort=<port>` (solo modo completo mDNS; DNS-SD de área amplia puede omitirlo)
- `cliPath=<path>` (solo modo completo mDNS; DNS-SD de área amplia sigue escribiéndolo como indicación de instalación remota)

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS son **no autenticados**. Los clientes no deben tratar TXT como enrutamiento autoritativo.
- Los clientes deben enrutar usando el endpoint de servicio resuelto (SRV + A/AAAA). Trata `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` solo como indicaciones.
- El direccionamiento automático de SSH debe usar igualmente el host del servicio resuelto, no indicaciones solo de TXT.
- La fijación de TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sobrescriba una fijación almacenada previamente.
- Los nodos iOS/Android deben tratar las conexiones directas basadas en descubrimiento como **solo TLS** y exigir confirmación explícita del usuario antes de confiar en una huella digital vista por primera vez.

## Depuración en macOS

Herramientas integradas útiles:

- Explorar instancias:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolver una instancia (sustituye `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Si explorar funciona pero resolver falla, normalmente te estás encontrando con una política de LAN o
un problema del resolvedor mDNS.

## Depuración en registros de Gateway

El Gateway escribe un archivo de registro rotativo (se imprime al iniciar como
`gateway log file: ...`). Busca líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Depuración en nodo iOS

El nodo iOS usa `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar registros:

- Configuración → Gateway → Avanzado → **Discovery Debug Logs**
- Configuración → Gateway → Avanzado → **Discovery Logs** → reproduce → **Copy**

El registro incluye transiciones de estado del navegador y cambios en el conjunto de resultados.

## Modos de fallo comunes

- **Bonjour no cruza redes**: usa Tailnet o SSH.
- **Multicast bloqueado**: algunas redes Wi‑Fi deshabilitan mDNS.
- **Reposo / cambios de interfaz**: macOS puede dejar de mostrar temporalmente resultados mDNS; vuelve a intentarlo.
- **Explorar funciona pero resolver falla**: mantén nombres de máquina simples (evita emojis o
  puntuación) y luego reinicia Gateway. El nombre de instancia del servicio deriva del
  nombre del host, así que los nombres demasiado complejos pueden confundir a algunos resolvedores.

## Nombres de instancia escapados (`\032`)

Bonjour/DNS-SD suele escapar bytes en nombres de instancia de servicio como secuencias decimales `\DDD`
(por ejemplo, los espacios se convierten en `\032`).

- Esto es normal a nivel de protocolo.
- Las interfaces deben decodificar para mostrar (iOS usa `BonjourEscapes.decode`).

## Deshabilitación / configuración

- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita el anuncio (heredado: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de enlace de Gateway.
- `OPENCLAW_SSH_PORT` sobrescribe el puerto SSH cuando se anuncia `sshPort` (heredado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica una indicación MagicDNS en TXT (heredado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` sobrescribe la ruta anunciada de la CLI (heredado: `OPENCLAW_CLI_PATH`).

## Documentación relacionada

- Política de descubrimiento y selección de transporte: [Discovery](/es/gateway/discovery)
- Emparejamiento y aprobaciones de nodos: [Emparejamiento de Gateway](/es/gateway/pairing)
