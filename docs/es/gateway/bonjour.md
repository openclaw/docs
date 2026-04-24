---
read_when:
    - Depurar problemas de descubrimiento de Bonjour en macOS/iOS
    - Cambiar tipos de servicio mDNS, registros TXT o la UX de descubrimiento
summary: Descubrimiento y depuración de Bonjour/mDNS (beacons del Gateway, clientes y modos de fallo comunes)
title: Descubrimiento de Bonjour
x-i18n:
    generated_at: "2026-04-24T08:57:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Descubrimiento de Bonjour / mDNS

OpenClaw usa Bonjour (mDNS / DNS‑SD) para descubrir un Gateway activo (endpoint WebSocket).
La exploración por multidifusión de `local.` es una **comodidad solo para LAN**. El
Plugin `bonjour` incluido se encarga del anuncio en la LAN y está habilitado de forma predeterminada. Para el descubrimiento entre redes,
el mismo beacon también puede publicarse mediante un dominio DNS-SD de área amplia configurado.
El descubrimiento sigue siendo de mejor esfuerzo y **no** reemplaza la conectividad basada en SSH o Tailnet.

## Bonjour de área amplia (DNS-SD unicast) sobre Tailscale

Si el node y el gateway están en redes diferentes, la multidifusión mDNS no cruzará
ese límite. Puedes mantener la misma UX de descubrimiento cambiando a **DNS‑SD unicast**
("Bonjour de área amplia") sobre Tailscale.

Pasos de alto nivel:

1. Ejecuta un servidor DNS en el host del gateway (accesible a través de la Tailnet).
2. Publica registros DNS‑SD para `_openclaw-gw._tcp` bajo una zona dedicada
   (ejemplo: `openclaw.internal.`).
3. Configura **split DNS** de Tailscale para que tu dominio elegido se resuelva mediante ese
   servidor DNS para los clientes (incluido iOS).

OpenClaw admite cualquier dominio de descubrimiento; `openclaw.internal.` es solo un ejemplo.
Los nodes iOS/Android exploran tanto `local.` como tu dominio de área amplia configurado.

### Configuración del Gateway (recomendada)

```json5
{
  gateway: { bind: "tailnet" }, // solo tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // habilita la publicación DNS-SD de área amplia
}
```

### Configuración única del servidor DNS (host del gateway)

```bash
openclaw dns setup --apply
```

Esto instala CoreDNS y lo configura para:

- escuchar en el puerto 53 solo en las interfaces Tailscale del gateway
- servir el dominio elegido (ejemplo: `openclaw.internal.`) desde `~/.openclaw/dns/<domain>.db`

Valida desde una máquina conectada a la tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configuración DNS de Tailscale

En la consola de administración de Tailscale:

- Añade un servidor de nombres que apunte a la IP tailnet del gateway (UDP/TCP 53).
- Añade split DNS para que tu dominio de descubrimiento use ese servidor de nombres.

Una vez que los clientes acepten DNS de la tailnet, los nodes de iOS y el descubrimiento de la CLI podrán explorar
`_openclaw-gw._tcp` en tu dominio de descubrimiento sin multidifusión.

### Seguridad del listener del Gateway (recomendada)

El puerto WS del Gateway (predeterminado `18789`) se enlaza a loopback de forma predeterminada. Para acceso por LAN/tailnet,
haz el enlace explícitamente y mantén la autenticación habilitada.

Para configuraciones solo de tailnet:

- Establece `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json`.
- Reinicia el Gateway (o reinicia la app de barra de menú de macOS).

## Qué se anuncia

Solo el Gateway anuncia `_openclaw-gw._tcp`. El anuncio por multidifusión en LAN
lo proporciona el Plugin `bonjour` incluido; la publicación DNS-SD de área amplia sigue siendo
propiedad del Gateway.

## Tipos de servicio

- `_openclaw-gw._tcp` — beacon de transporte del gateway (usado por nodes macOS/iOS/Android).

## Claves TXT (pistas no secretas)

El Gateway anuncia pequeñas pistas no secretas para facilitar los flujos de UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo cuando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (solo cuando TLS está habilitado y la huella digital está disponible)
- `canvasPort=<port>` (solo cuando el host canvas está habilitado; actualmente es el mismo que `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (solo en modo mDNS completo, pista opcional cuando Tailnet está disponible)
- `sshPort=<port>` (solo en modo mDNS completo; DNS-SD de área amplia puede omitirlo)
- `cliPath=<path>` (solo en modo mDNS completo; DNS-SD de área amplia sigue escribiéndolo como pista de instalación remota)

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS son **no autenticados**. Los clientes no deben tratar TXT como enrutamiento autoritativo.
- Los clientes deben enrutar usando el endpoint del servicio resuelto (SRV + A/AAAA). Trata `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` solo como pistas.
- El direccionamiento automático de SSH también debe usar el host del servicio resuelto, no pistas solo de TXT.
- El pinning de TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sobrescriba un pin almacenado previamente.
- Los nodes iOS/Android deben tratar las conexiones directas basadas en descubrimiento como **solo TLS** y requerir confirmación explícita del usuario antes de confiar en una huella digital vista por primera vez.

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

## Depuración en los logs del Gateway

El Gateway escribe un archivo de log rotativo (mostrado al iniciar como
`gateway log file: ...`). Busca líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Depuración en el node de iOS

El node de iOS usa `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar logs:

- Ajustes → Gateway → Avanzado → **Logs de depuración de descubrimiento**
- Ajustes → Gateway → Avanzado → **Logs de descubrimiento** → reproduce → **Copiar**

El log incluye transiciones de estado del navegador y cambios en el conjunto de resultados.

## Modos de fallo comunes

- **Bonjour no cruza redes**: usa Tailnet o SSH.
- **Multidifusión bloqueada**: algunas redes Wi‑Fi deshabilitan mDNS.
- **Reposo / cambios de interfaz**: macOS puede eliminar temporalmente resultados mDNS; vuelve a intentarlo.
- **Explorar funciona pero resolver falla**: mantén los nombres de máquina simples (evita emojis o
  puntuación) y luego reinicia el Gateway. El nombre de instancia del servicio se deriva del
  nombre del host, por lo que nombres demasiado complejos pueden confundir a algunos resolvedores.

## Nombres de instancia escapados (`\032`)

Bonjour/DNS‑SD suele escapar bytes en nombres de instancia de servicio como secuencias decimales `\DDD`
(por ejemplo, los espacios se convierten en `\032`).

- Esto es normal a nivel de protocolo.
- Las UI deben decodificarlos para mostrarlos (iOS usa `BonjourEscapes.decode`).

## Desactivación / configuración

- `openclaw plugins disable bonjour` deshabilita el anuncio por multidifusión en LAN al deshabilitar el Plugin incluido.
- `openclaw plugins enable bonjour` restaura el Plugin predeterminado de descubrimiento en LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita el anuncio por multidifusión en LAN sin cambiar la configuración del Plugin; los valores verdaderos aceptados son `1`, `true`, `yes` y `on` (heredado: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de enlace del Gateway.
- `OPENCLAW_SSH_PORT` sobrescribe el puerto SSH cuando se anuncia `sshPort` (heredado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica una pista de MagicDNS en TXT cuando el modo mDNS completo está habilitado (heredado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` sobrescribe la ruta de la CLI anunciada (heredado: `OPENCLAW_CLI_PATH`).

## Documentos relacionados

- Política de descubrimiento y selección de transporte: [Discovery](/es/gateway/discovery)
- Emparejamiento y aprobaciones de nodes: [Emparejamiento del Gateway](/es/gateway/pairing)
