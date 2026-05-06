---
read_when:
    - Depuración de problemas de descubrimiento de Bonjour en macOS/iOS
    - Cambiar los tipos de servicio mDNS, los registros TXT o la experiencia de usuario de descubrimiento
summary: Descubrimiento y depuración de Bonjour/mDNS (balizas del Gateway, clientes y modos de fallo comunes)
title: Descubrimiento de Bonjour
x-i18n:
    generated_at: "2026-05-06T05:33:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw puede usar Bonjour (mDNS / DNS-SD) para descubrir un Gateway activo (endpoint WebSocket).
La exploración multicast de `local.` es una **comodidad solo para LAN**. El Plugin `bonjour`
incluido es propietario de la publicidad LAN. Se inicia automáticamente en hosts macOS y es opcional en
Linux, Windows y despliegues de Gateway en contenedores. Para el descubrimiento entre redes, el mismo
beacon también se puede publicar mediante un dominio DNS-SD de área amplia configurado. El descubrimiento
sigue siendo de mejor esfuerzo y **no** reemplaza la conectividad basada en SSH o Tailnet.

## Bonjour de área amplia (DNS-SD unicast) sobre Tailscale

Si el Node y el gateway están en redes diferentes, mDNS multicast no cruzará el
límite. Puedes conservar la misma experiencia de descubrimiento cambiando a **DNS-SD unicast**
("Bonjour de área amplia") sobre Tailscale.

Pasos de alto nivel:

1. Ejecuta un servidor DNS en el host del gateway (accesible a través de Tailnet).
2. Publica registros DNS-SD para `_openclaw-gw._tcp` bajo una zona dedicada
   (ejemplo: `openclaw.internal.`).
3. Configura **DNS dividido** de Tailscale para que tu dominio elegido se resuelva mediante ese
   servidor DNS para los clientes (incluido iOS).

OpenClaw admite cualquier dominio de descubrimiento; `openclaw.internal.` es solo un ejemplo.
Los Nodes iOS/Android exploran tanto `local.` como tu dominio de área amplia configurado.

### Configuración de Gateway (recomendada)

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
- servir tu dominio elegido (ejemplo: `openclaw.internal.`) desde `~/.openclaw/dns/<domain>.db`

Valida desde una máquina conectada a tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configuración de DNS de Tailscale

En la consola de administración de Tailscale:

- Añade un servidor de nombres que apunte a la IP tailnet del gateway (UDP/TCP 53).
- Añade DNS dividido para que tu dominio de descubrimiento use ese servidor de nombres.

Una vez que los clientes acepten el DNS de tailnet, los Nodes iOS y el descubrimiento de CLI pueden explorar
`_openclaw-gw._tcp` en tu dominio de descubrimiento sin multicast.

### Seguridad del listener de Gateway (recomendada)

El puerto WS de Gateway (predeterminado `18789`) se enlaza a loopback de forma predeterminada. Para acceso LAN/tailnet,
enlaza explícitamente y mantén la autenticación habilitada.

Para configuraciones solo tailnet:

- Establece `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json`.
- Reinicia el Gateway (o reinicia la app de la barra de menús de macOS).

## Qué anuncia

Solo el Gateway anuncia `_openclaw-gw._tcp`. La publicidad multicast LAN la
proporciona el Plugin `bonjour` incluido cuando el Plugin está habilitado; la publicación
DNS-SD de área amplia sigue siendo propiedad del Gateway.

## Tipos de servicio

- `_openclaw-gw._tcp` - beacon de transporte del gateway (usado por Nodes macOS/iOS/Android).

## Claves TXT (pistas no secretas)

El Gateway anuncia pequeñas pistas no secretas para facilitar los flujos de interfaz de usuario:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo cuando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (solo cuando TLS está habilitado y la huella digital está disponible)
- `canvasPort=<port>` (solo cuando el host de canvas está habilitado; actualmente igual que `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (solo modo mDNS completo, pista opcional cuando Tailnet está disponible)
- `sshPort=<port>` (solo modo mDNS completo; DNS-SD de área amplia puede omitirlo)
- `cliPath=<path>` (solo modo mDNS completo; DNS-SD de área amplia todavía lo escribe como pista de instalación remota)

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes no deben tratar TXT como enrutamiento autoritativo.
- Los clientes deben enrutar usando el endpoint de servicio resuelto (SRV + A/AAAA). Trata `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` solo como pistas.
- La selección automática de destino SSH también debe usar el host de servicio resuelto, no pistas solo de TXT.
- El anclaje de TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sobrescriba un pin almacenado previamente.
- Los Nodes iOS/Android deben tratar las conexiones directas basadas en descubrimiento como **solo TLS** y exigir confirmación explícita del usuario antes de confiar en una huella digital por primera vez.

## Depuración en macOS

Herramientas integradas útiles:

- Explorar instancias:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolver una instancia (reemplaza `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Si la exploración funciona pero la resolución falla, normalmente te encuentras con una política de LAN o
un problema del resolver mDNS.

## Depuración en los registros de Gateway

El Gateway escribe un archivo de registro rotativo (impreso al inicio como
`gateway log file: ...`). Busca líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour usa el nombre de host del sistema para el host `.local` anunciado cuando es una
etiqueta DNS válida. Si el nombre de host del sistema contiene espacios, guiones bajos u otro
carácter no válido para etiquetas DNS, OpenClaw recurre a `openclaw.local`. Establece
`OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar el Gateway cuando necesites una
etiqueta de host explícita.

## Depuración en Node iOS

El Node iOS usa `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar registros:

- Configuración → Gateway → Avanzado → **Registros de depuración de descubrimiento**
- Configuración → Gateway → Avanzado → **Registros de descubrimiento** → reproducir → **Copiar**

El registro incluye transiciones de estado del navegador y cambios en el conjunto de resultados.

## Cuándo habilitar Bonjour

Bonjour se inicia automáticamente en el arranque de Gateway con configuración vacía en hosts macOS porque la
app local y los Nodes iOS/Android cercanos suelen depender del descubrimiento en la misma LAN.

Habilita Bonjour explícitamente cuando el autodescubrimiento en la misma LAN sea útil en Linux,
Windows u otro host que no sea macOS:

```bash
openclaw plugins enable bonjour
```

Cuando está habilitado, Bonjour usa `discovery.mdns.mode` para decidir cuántos metadatos TXT
publicar. El modo predeterminado es `minimal`; usa `full` solo cuando los clientes locales necesiten
pistas `cliPath` o `sshPort`, y usa `off` para suprimir multicast LAN sin
cambiar la habilitación del Plugin.

## Cuándo deshabilitar Bonjour

Deja Bonjour deshabilitado cuando la publicidad multicast LAN sea innecesaria, no esté disponible
o sea perjudicial. Los casos comunes son servidores que no son macOS, redes de puente Docker,
WSL o una política de red que bloquea multicast mDNS. En esos entornos el
Gateway sigue siendo accesible mediante su URL publicada, SSH, Tailnet o DNS-SD
de área amplia, pero el autodescubrimiento LAN no es confiable.

Prefiere la anulación de entorno existente cuando el problema depende del despliegue:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Eso deshabilita la publicidad multicast LAN sin cambiar la configuración del Plugin.
Es seguro para imágenes Docker, archivos de servicio, scripts de lanzamiento y depuración puntual
porque la configuración desaparece cuando lo hace el entorno.

Usa la configuración del Plugin cuando quieras desactivar intencionadamente el Plugin de
descubrimiento LAN incluido para esa configuración de OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Consideraciones de Docker

El Plugin Bonjour incluido deshabilita automáticamente la publicidad multicast LAN en contenedores
detectados cuando `OPENCLAW_DISABLE_BONJOUR` no está definido. Las redes de puente Docker
normalmente no reenvían multicast mDNS (`224.0.0.251:5353`) entre el contenedor
y la LAN, por lo que anunciar desde el contenedor rara vez hace que el descubrimiento funcione.

Consideraciones importantes:

- Bonjour se inicia automáticamente en hosts macOS y es opcional en otros lugares. Dejarlo
  deshabilitado no detiene el Gateway; solo omite la publicidad multicast LAN.
- Deshabilitar Bonjour no cambia `gateway.bind`; Docker sigue usando por defecto
  `OPENCLAW_GATEWAY_BIND=lan` para que el puerto de host publicado pueda funcionar.
- Deshabilitar Bonjour no deshabilita DNS-SD de área amplia. Usa descubrimiento de área amplia
  o Tailnet cuando el Gateway y el Node no estén en la misma LAN.
- Reutilizar el mismo `OPENCLAW_CONFIG_DIR` fuera de Docker no conserva la
  política de deshabilitación automática del contenedor.
- Establece `OPENCLAW_DISABLE_BONJOUR=0` solo para redes de host, macvlan u otra
  red donde se sepa que multicast mDNS pasa; establécelo en `1` para forzar la deshabilitación.

## Solución de problemas de Bonjour deshabilitado

Si un Node ya no descubre automáticamente el Gateway después de configurar Docker:

1. Confirma si el Gateway se está ejecutando en modo automático, forzado activado o forzado desactivado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirma que el propio Gateway es accesible mediante el puerto publicado:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa un destino directo cuando Bonjour esté deshabilitado:
   - Control UI o herramientas locales: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS de Tailnet, IP de Tailnet, túnel SSH o
     DNS-SD de área amplia

4. Si habilitaste deliberadamente el Plugin Bonjour en Docker y forzaste la publicidad
   con `OPENCLAW_DISABLE_BONJOUR=0`, prueba multicast desde el host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la exploración está vacía o los registros de Gateway muestran cancelaciones repetidas
   del watchdog de ciao, restaura `OPENCLAW_DISABLE_BONJOUR=1` y usa una ruta directa o
   de Tailnet.

## Modos de fallo comunes

- **Bonjour no cruza redes**: usa Tailnet o SSH.
- **Multicast bloqueado**: algunas redes Wi-Fi deshabilitan mDNS.
- **Advertiser atascado en sondeo/anuncio**: hosts con multicast bloqueado,
  puentes de contenedores, WSL o cambios de interfaz pueden dejar el advertiser ciao en un
  estado no anunciado. OpenClaw reintenta algunas veces y luego deshabilita Bonjour
  para el proceso actual de Gateway en lugar de reiniciar el advertiser indefinidamente.
- **Red de puente Docker**: Bonjour se deshabilita automáticamente en contenedores detectados.
  Establece `OPENCLAW_DISABLE_BONJOUR=0` solo para host, macvlan u otra
  red compatible con mDNS.
- **Suspensión / cambios de interfaz**: macOS puede perder temporalmente resultados mDNS; vuelve a intentarlo.
- **La exploración funciona pero la resolución falla**: mantén simples los nombres de máquina (evita emojis o
  puntuación) y luego reinicia el Gateway. El nombre de instancia de servicio deriva del
  nombre de host, por lo que nombres demasiado complejos pueden confundir a algunos resolvers.

## Nombres de instancia escapados (`\032`)

Bonjour/DNS-SD suele escapar bytes en nombres de instancia de servicio como secuencias decimales `\DDD`
(por ejemplo, los espacios se convierten en `\032`).

- Esto es normal a nivel de protocolo.
- Las interfaces de usuario deben decodificar para mostrar (iOS usa `BonjourEscapes.decode`).

## Habilitación / deshabilitación / configuración

- Los hosts macOS inician automáticamente el Plugin de descubrimiento LAN incluido de forma predeterminada.
- `openclaw plugins enable bonjour` habilita el Plugin de descubrimiento LAN incluido en hosts donde no está habilitado de forma predeterminada.
- `openclaw plugins disable bonjour` deshabilita la publicidad multicast LAN al deshabilitar el Plugin incluido.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita la publicidad multicast LAN sin cambiar la configuración del Plugin; los valores verdaderos aceptados son `1`, `true`, `yes` y `on` (heredado: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` fuerza la activación de la publicidad multicast LAN, incluso dentro de contenedores detectados; los valores falsos aceptados son `0`, `false`, `no` y `off`.
- Cuando el Plugin Bonjour está habilitado y `OPENCLAW_DISABLE_BONJOUR` no está definido, Bonjour anuncia en hosts normales y se deshabilita automáticamente dentro de contenedores detectados.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de enlace del Gateway.
- `OPENCLAW_SSH_PORT` anula el puerto SSH cuando se anuncia `sshPort` (heredado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica una pista MagicDNS en TXT cuando el modo mDNS completo está habilitado (heredado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` anula la ruta de CLI anunciada (heredado: `OPENCLAW_CLI_PATH`).

## Documentación relacionada

- Política de descubrimiento y selección de transporte: [Descubrimiento](/es/gateway/discovery)
- Emparejamiento de Node + aprobaciones: [Emparejamiento de Gateway](/es/gateway/pairing)
