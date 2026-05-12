---
read_when:
    - Depuración de problemas de descubrimiento de Bonjour en macOS/iOS
    - Cambiar los tipos de servicio mDNS, los registros TXT o la experiencia de descubrimiento
summary: Descubrimiento y depuración de Bonjour/mDNS (balizas de Gateway, clientes y modos de fallo comunes)
title: Descubrimiento de Bonjour
x-i18n:
    generated_at: "2026-05-12T12:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw puede usar Bonjour (mDNS / DNS-SD) para descubrir un Gateway activo (endpoint WebSocket).
La exploración multicast de `local.` es una **comodidad solo para LAN**. El plugin `bonjour`
incluido es propietario de la publicación en LAN. Se inicia automáticamente en hosts macOS y es opcional en
Linux, Windows e implementaciones de Gateway en contenedores. Para descubrimiento entre redes, la misma
baliza también puede publicarse mediante un dominio DNS-SD de área amplia configurado. El descubrimiento
sigue siendo de mejor esfuerzo y **no** reemplaza la conectividad basada en SSH o Tailnet.

## Bonjour de área amplia (DNS-SD unicast) sobre Tailscale

Si el nodo y el Gateway están en redes diferentes, mDNS multicast no cruzará el
límite. Puedes conservar la misma experiencia de descubrimiento cambiando a **DNS-SD unicast**
("Bonjour de área amplia") sobre Tailscale.

Pasos de alto nivel:

1. Ejecuta un servidor DNS en el host del Gateway (alcanzable mediante Tailnet).
2. Publica registros DNS-SD para `_openclaw-gw._tcp` bajo una zona dedicada
   (ejemplo: `openclaw.internal.`).
3. Configura **DNS dividido** de Tailscale para que tu dominio elegido resuelva mediante ese
   servidor DNS para los clientes (incluido iOS).

OpenClaw admite cualquier dominio de descubrimiento; `openclaw.internal.` es solo un ejemplo.
Los nodos iOS/Android exploran tanto `local.` como tu dominio de área amplia configurado.

### Configuración del Gateway (recomendado)

```json5
{
  gateway: { bind: "tailnet" }, // solo tailnet (recomendado)
  discovery: { wideArea: { enabled: true } }, // habilita la publicación DNS-SD de área amplia
}
```

### Configuración única del servidor DNS (host del Gateway)

```bash
openclaw dns setup --apply
```

Esto instala CoreDNS y lo configura para:

- escuchar en el puerto 53 solo en las interfaces Tailscale del Gateway
- servir tu dominio elegido (ejemplo: `openclaw.internal.`) desde `~/.openclaw/dns/<domain>.db`

Valida desde una máquina conectada a tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configuración de DNS de Tailscale

En la consola de administración de Tailscale:

- Agrega un servidor de nombres que apunte a la IP de tailnet del Gateway (UDP/TCP 53).
- Agrega DNS dividido para que tu dominio de descubrimiento use ese servidor de nombres.

Una vez que los clientes acepten el DNS de tailnet, los nodos iOS y el descubrimiento de CLI pueden explorar
`_openclaw-gw._tcp` en tu dominio de descubrimiento sin multicast.

### Seguridad del listener del Gateway (recomendado)

El puerto WS del Gateway (predeterminado `18789`) se enlaza a loopback de forma predeterminada. Para acceso LAN/tailnet,
enlázalo explícitamente y mantén la autenticación habilitada.

Para configuraciones solo de tailnet:

- Establece `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json`.
- Reinicia el Gateway (o reinicia la app de la barra de menú de macOS).

## Qué anuncia

Solo el Gateway anuncia `_openclaw-gw._tcp`. La publicidad multicast LAN la
proporciona el plugin `bonjour` incluido cuando el plugin está habilitado; la
publicación DNS-SD de área amplia sigue siendo propiedad del Gateway.

## Tipos de servicio

- `_openclaw-gw._tcp` - baliza de transporte del Gateway (usada por nodos macOS/iOS/Android).

## Claves TXT (indicios no secretos)

El Gateway anuncia pequeños indicios no secretos para facilitar los flujos de interfaz:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo cuando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (solo cuando TLS está habilitado y la huella digital está disponible)
- `canvasPort=<port>` (solo cuando el host de canvas está habilitado; actualmente el mismo que `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (solo modo completo de mDNS, indicio opcional cuando Tailnet está disponible)
- `sshPort=<port>` (solo modo completo; omitido en modos minimal y off)
- `cliPath=<path>` (solo modo completo; omitido en modos minimal y off)

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes no deben tratar TXT como enrutamiento autoritativo.
- Los clientes deben enrutar usando el endpoint de servicio resuelto (SRV + A/AAAA). Trata `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` solo como indicios.
- La selección automática de destino SSH también debe usar el host de servicio resuelto, no indicios solo de TXT.
- El pinning TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sobrescriba un pin almacenado previamente.
- Los nodos iOS/Android deben tratar las conexiones directas basadas en descubrimiento como **solo TLS** y requerir confirmación explícita del usuario antes de confiar en una huella digital por primera vez.

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

Si la exploración funciona pero la resolución falla, normalmente estás encontrando una política de LAN o
un problema del resolvedor mDNS.

## Depuración en logs del Gateway

El Gateway escribe un archivo de log rotativo (impreso al inicio como
`gateway log file: ...`). Busca líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

El watchdog trata `probing`, `announcing` activos y renombrados recientes por conflicto como
estados en progreso. Si el servicio nunca alcanza `announced`, OpenClaw finalmente
recrea el anunciador y, tras fallos repetidos, deshabilita Bonjour para ese
proceso de Gateway en lugar de volver a anunciar indefinidamente.

Bonjour usa el nombre de host del sistema para el host `.local` anunciado cuando es una
etiqueta DNS válida. Si el nombre de host del sistema contiene espacios, guiones bajos u otro
carácter inválido para etiquetas DNS, OpenClaw recurre a `openclaw.local`. Establece
`OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar el Gateway cuando necesites una
etiqueta de host explícita.

## Depuración en nodo iOS

El nodo iOS usa `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar logs:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduce → **Copy**

El log incluye transiciones de estado del navegador y cambios del conjunto de resultados.

## Cuándo habilitar Bonjour

Bonjour se inicia automáticamente para el arranque del Gateway con configuración vacía en hosts macOS porque la
app local y los nodos iOS/Android cercanos suelen depender del descubrimiento en la misma LAN.

Habilita Bonjour explícitamente cuando el descubrimiento automático en la misma LAN sea útil en Linux,
Windows u otro host no macOS:

```bash
openclaw plugins enable bonjour
```

Cuando está habilitado, Bonjour usa `discovery.mdns.mode` para decidir cuántos metadatos TXT
publicar. El mismo modo controla indicios TXT opcionales en registros DNS-SD de área amplia.
El modo predeterminado es `minimal`; usa `full` solo cuando los clientes necesiten indicios `cliPath` o
`sshPort`. Usa `off` para suprimir multicast LAN sin cambiar la habilitación del plugin;
DNS-SD de área amplia aún puede publicar la baliza mínima del Gateway cuando
`discovery.wideArea.enabled` es true.

## Cuándo deshabilitar Bonjour

Deja Bonjour deshabilitado cuando la publicidad multicast LAN sea innecesaria, no esté disponible
o sea perjudicial. Los casos comunes son servidores no macOS, redes de puente Docker,
WSL o una política de red que descarta multicast mDNS. En esos entornos, el
Gateway sigue siendo alcanzable mediante su URL publicada, SSH, Tailnet o DNS-SD
de área amplia, pero el descubrimiento automático LAN no es fiable.

Prefiere la anulación de entorno existente cuando el problema tiene alcance de despliegue:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Eso deshabilita la publicidad multicast LAN sin cambiar la configuración del plugin.
Es seguro para imágenes Docker, archivos de servicio, scripts de lanzamiento y depuración puntual
porque la configuración desaparece cuando lo hace el entorno.

Usa la configuración del plugin cuando quieras desactivar intencionalmente el plugin de descubrimiento LAN
incluido para esa configuración de OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Particularidades de Docker

El plugin Bonjour incluido deshabilita automáticamente la publicidad multicast LAN en contenedores
detectados cuando `OPENCLAW_DISABLE_BONJOUR` no está definido. Las redes de puente Docker
normalmente no reenvían multicast mDNS (`224.0.0.251:5353`) entre el contenedor
y la LAN, así que anunciar desde el contenedor rara vez hace que el descubrimiento funcione.

Particularidades importantes:

- Bonjour se inicia automáticamente en hosts macOS y es opcional en otros lugares. Dejarlo
  deshabilitado no detiene el Gateway; solo omite la publicidad multicast LAN.
- Deshabilitar Bonjour no cambia `gateway.bind`; Docker aún usa de forma predeterminada
  `OPENCLAW_GATEWAY_BIND=lan` para que el puerto publicado del host pueda funcionar.
- Deshabilitar Bonjour no deshabilita DNS-SD de área amplia. Usa descubrimiento de área amplia
  o Tailnet cuando el Gateway y el nodo no estén en la misma LAN.
- Reutilizar el mismo `OPENCLAW_CONFIG_DIR` fuera de Docker no conserva la
  política de deshabilitación automática del contenedor.
- Establece `OPENCLAW_DISABLE_BONJOUR=0` solo para redes de host, macvlan u otra
  red donde se sepa que mDNS multicast pasa; establécelo en `1` para forzar la deshabilitación.

## Solución de problemas de Bonjour deshabilitado

Si un nodo ya no descubre automáticamente el Gateway después de configurar Docker:

1. Confirma si el Gateway se está ejecutando en modo automático, forzado activado o forzado desactivado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirma que el propio Gateway sea alcanzable mediante el puerto publicado:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa un destino directo cuando Bonjour esté deshabilitado:
   - UI de control o herramientas locales: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: Tailnet MagicDNS, IP de Tailnet, túnel SSH o
     DNS-SD de área amplia

4. Si habilitaste deliberadamente el plugin Bonjour en Docker y forzaste la publicidad
   con `OPENCLAW_DISABLE_BONJOUR=0`, prueba multicast desde el host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la exploración está vacía o los logs del Gateway muestran cancelaciones repetidas del watchdog
   de ciao, restaura `OPENCLAW_DISABLE_BONJOUR=1` y usa una ruta directa o
   Tailnet.

## Modos de fallo comunes

- **Bonjour no cruza redes**: usa Tailnet o SSH.
- **Multicast bloqueado**: algunas redes Wi-Fi deshabilitan mDNS.
- **Anunciador atascado en probing/announcing**: hosts con multicast bloqueado,
  puentes de contenedor, WSL o cambios de interfaz pueden dejar el anunciador ciao en un
  estado no anunciado. OpenClaw reintenta unas pocas veces y luego deshabilita Bonjour
  para el proceso de Gateway actual en lugar de reiniciar el anunciador indefinidamente.
- **Red de puente Docker**: Bonjour se deshabilita automáticamente en contenedores detectados.
  Establece `OPENCLAW_DISABLE_BONJOUR=0` solo para host, macvlan u otra
  red compatible con mDNS.
- **Suspensión / cambios de interfaz**: macOS puede perder temporalmente resultados mDNS; reintenta.
- **La exploración funciona pero la resolución falla**: mantén los nombres de máquina simples (evita emojis o
  puntuación), luego reinicia el Gateway. El nombre de instancia del servicio deriva del
  nombre de host, por lo que nombres demasiado complejos pueden confundir algunos resolvedores.

## Nombres de instancia escapados (`\032`)

Bonjour/DNS-SD a menudo escapa bytes en nombres de instancia de servicio como secuencias decimales `\DDD`
(p. ej., los espacios se convierten en `\032`).

- Esto es normal a nivel de protocolo.
- Las UI deben decodificar para la visualización (iOS usa `BonjourEscapes.decode`).

## Habilitación / deshabilitación / configuración

- Los hosts macOS inician automáticamente el Plugin de descubrimiento LAN incluido de forma predeterminada.
- `openclaw plugins enable bonjour` habilita el Plugin de descubrimiento LAN incluido en hosts donde no está habilitado de forma predeterminada.
- `openclaw plugins disable bonjour` deshabilita el anuncio de multidifusión LAN al deshabilitar el Plugin incluido.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita el anuncio de multidifusión LAN sin cambiar la configuración del Plugin; los valores verdaderos aceptados son `1`, `true`, `yes` y `on` (heredado: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` fuerza la activación del anuncio de multidifusión LAN, incluso dentro de contenedores detectados; los valores falsos aceptados son `0`, `false`, `no` y `off`.
- Cuando el Plugin Bonjour está habilitado y `OPENCLAW_DISABLE_BONJOUR` no está definido, Bonjour anuncia en hosts normales y se deshabilita automáticamente dentro de contenedores detectados.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de enlace del Gateway.
- `OPENCLAW_SSH_PORT` anula el puerto SSH cuando se anuncia `sshPort` (heredado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica una sugerencia de MagicDNS en TXT cuando el modo completo de mDNS está habilitado (heredado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` anula la ruta anunciada de la CLI (heredado: `OPENCLAW_CLI_PATH`).

## Documentación relacionada

- Política de descubrimiento y selección de transporte: [Descubrimiento](/es/gateway/discovery)
- Emparejamiento de Node + aprobaciones: [Emparejamiento del Gateway](/es/gateway/pairing)
