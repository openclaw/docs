---
read_when:
    - Depuración de problemas de descubrimiento de Bonjour en macOS/iOS
    - Cambiar tipos de servicio mDNS, registros TXT o la UX de descubrimiento
summary: Descubrimiento y depuración de Bonjour/mDNS (balizas de Gateway, clientes y modos de fallo comunes)
title: Detección de Bonjour
x-i18n:
    generated_at: "2026-05-11T20:33:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw puede usar Bonjour (mDNS / DNS-SD) para descubrir un Gateway activo (endpoint WebSocket).
La exploración multicast de `local.` es una **comodidad solo para LAN**. El plugin `bonjour`
incluido es propietario de la publicidad en LAN. Se inicia automáticamente en hosts macOS y es opcional en
Linux, Windows e implementaciones de Gateway en contenedores. Para descubrimiento entre redes, la misma
baliza también puede publicarse mediante un dominio DNS-SD de área amplia configurado. El descubrimiento
sigue siendo de mejor esfuerzo y **no** reemplaza la conectividad basada en SSH o Tailnet.

## Bonjour de área amplia (DNS-SD unicast) sobre Tailscale

Si el nodo y el gateway están en redes diferentes, el mDNS multicast no cruzará el
límite. Puedes mantener la misma experiencia de descubrimiento cambiando a **DNS-SD unicast**
("Wide-Area Bonjour") sobre Tailscale.

Pasos generales:

1. Ejecuta un servidor DNS en el host del gateway (alcanzable a través de Tailnet).
2. Publica registros DNS-SD para `_openclaw-gw._tcp` bajo una zona dedicada
   (ejemplo: `openclaw.internal.`).
3. Configura **DNS dividido** de Tailscale para que el dominio elegido se resuelva mediante ese
   servidor DNS para los clientes (incluido iOS).

OpenClaw admite cualquier dominio de descubrimiento; `openclaw.internal.` es solo un ejemplo.
Los nodos iOS/Android exploran tanto `local.` como tu dominio de área amplia configurado.

### Configuración del Gateway (recomendada)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
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

### Configuración DNS de Tailscale

En la consola de administración de Tailscale:

- Añade un servidor de nombres que apunte a la IP tailnet del gateway (UDP/TCP 53).
- Añade DNS dividido para que tu dominio de descubrimiento use ese servidor de nombres.

Una vez que los clientes acepten el DNS de tailnet, los nodos iOS y el descubrimiento de la CLI pueden explorar
`_openclaw-gw._tcp` en tu dominio de descubrimiento sin multicast.

### Seguridad del listener del Gateway (recomendada)

El puerto WS del Gateway (predeterminado `18789`) se vincula a loopback de forma predeterminada. Para acceso LAN/tailnet,
vincúlalo explícitamente y mantén la autenticación activada.

Para configuraciones solo de tailnet:

- Define `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json`.
- Reinicia el Gateway (o reinicia la aplicación de la barra de menús de macOS).

## Qué publicita

Solo el Gateway publicita `_openclaw-gw._tcp`. La publicidad multicast LAN la
proporciona el plugin `bonjour` incluido cuando el plugin está habilitado; la publicación
DNS-SD de área amplia sigue siendo propiedad del Gateway.

## Tipos de servicio

- `_openclaw-gw._tcp` - baliza de transporte del gateway (usada por nodos macOS/iOS/Android).

## Claves TXT (pistas no secretas)

El Gateway publicita pequeñas pistas no secretas para facilitar los flujos de la IU:

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
- `cliPath=<path>` (solo modo mDNS completo; DNS-SD de área amplia aún lo escribe como pista de instalación remota)

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes no deben tratar TXT como enrutamiento autoritativo.
- Los clientes deben enrutar usando el endpoint de servicio resuelto (SRV + A/AAAA). Trata `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` solo como pistas.
- La selección automática de destino SSH también debe usar el host de servicio resuelto, no pistas solo de TXT.
- La fijación de TLS nunca debe permitir que un `gatewayTlsSha256` publicitado reemplace una fijación almacenada previamente.
- Los nodos iOS/Android deben tratar las conexiones directas basadas en descubrimiento como **solo TLS** y exigir confirmación explícita del usuario antes de confiar en una huella digital por primera vez.

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

Si la exploración funciona pero la resolución falla, normalmente te encuentras con una política LAN o
un problema del resolutor mDNS.

## Depuración en los logs del Gateway

El Gateway escribe un archivo de log rotativo (impreso al inicio como
`gateway log file: ...`). Busca líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

El watchdog trata `probing`, `announcing` y los cambios de nombre por conflicto recientes como
estados en curso. Si el servicio nunca llega a `announced`, OpenClaw finalmente
recrea el publicador y, tras fallos repetidos, deshabilita Bonjour para ese
proceso del Gateway en lugar de volver a publicitar indefinidamente.

Bonjour usa el nombre de host del sistema para el host `.local` publicitado cuando es una
etiqueta DNS válida. Si el nombre de host del sistema contiene espacios, guiones bajos u otro
carácter de etiqueta DNS no válido, OpenClaw recurre a `openclaw.local`. Define
`OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar el Gateway cuando necesites una
etiqueta de host explícita.

## Depuración en nodo iOS

El nodo iOS usa `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar logs:

- Configuración → Gateway → Avanzado → **Logs de depuración de descubrimiento**
- Configuración → Gateway → Avanzado → **Logs de descubrimiento** → reproducir → **Copiar**

El log incluye transiciones de estado del navegador y cambios del conjunto de resultados.

## Cuándo habilitar Bonjour

Bonjour se inicia automáticamente para el inicio del Gateway con configuración vacía en hosts macOS porque la
aplicación local y los nodos iOS/Android cercanos suelen depender del descubrimiento en la misma LAN.

Habilita Bonjour explícitamente cuando el descubrimiento automático en la misma LAN sea útil en Linux,
Windows u otro host que no sea macOS:

```bash
openclaw plugins enable bonjour
```

Cuando está habilitado, Bonjour usa `discovery.mdns.mode` para decidir cuántos metadatos TXT
publicar. El modo predeterminado es `minimal`; usa `full` solo cuando los clientes locales necesiten
pistas `cliPath` o `sshPort`, y usa `off` para suprimir el multicast LAN sin
cambiar la habilitación del plugin.

## Cuándo deshabilitar Bonjour

Deja Bonjour deshabilitado cuando la publicidad multicast LAN sea innecesaria, no esté disponible
o sea perjudicial. Los casos comunes son servidores que no son macOS, redes puente de Docker,
WSL o una política de red que descarta multicast mDNS. En esos entornos el
Gateway sigue siendo alcanzable mediante su URL publicada, SSH, Tailnet o DNS-SD
de área amplia, pero el descubrimiento automático LAN no es confiable.

Prefiere la anulación de entorno existente cuando el problema está limitado a la implementación:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Eso deshabilita la publicidad multicast LAN sin cambiar la configuración del plugin.
Es seguro para imágenes Docker, archivos de servicio, scripts de inicio y depuración puntual
porque la configuración desaparece cuando lo hace el entorno.

Usa la configuración del plugin cuando quieras desactivar intencionalmente el plugin de descubrimiento LAN
incluido para esa configuración de OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Problemas frecuentes de Docker

El plugin Bonjour incluido deshabilita automáticamente la publicidad multicast LAN en contenedores
detectados cuando `OPENCLAW_DISABLE_BONJOUR` no está definido. Las redes puente de Docker
normalmente no reenvían multicast mDNS (`224.0.0.251:5353`) entre el contenedor
y la LAN, por lo que publicitar desde el contenedor rara vez hace que el descubrimiento funcione.

Problemas importantes:

- Bonjour se inicia automáticamente en hosts macOS y es opcional en otros lugares. Dejarlo
  deshabilitado no detiene el Gateway; solo omite la publicidad multicast LAN.
- Deshabilitar Bonjour no cambia `gateway.bind`; Docker sigue usando por defecto
  `OPENCLAW_GATEWAY_BIND=lan` para que el puerto de host publicado pueda funcionar.
- Deshabilitar Bonjour no deshabilita DNS-SD de área amplia. Usa descubrimiento de área amplia
  o Tailnet cuando el Gateway y el nodo no estén en la misma LAN.
- Reutilizar el mismo `OPENCLAW_CONFIG_DIR` fuera de Docker no conserva la
  política de deshabilitación automática del contenedor.
- Define `OPENCLAW_DISABLE_BONJOUR=0` solo para redes de host, macvlan u otra
  red donde se sepa que el multicast mDNS pasa; defínelo en `1` para forzar la deshabilitación.

## Solución de problemas de Bonjour deshabilitado

Si un nodo ya no descubre automáticamente el Gateway después de configurar Docker:

1. Confirma si el Gateway se ejecuta en modo automático, forzado activado o forzado desactivado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirma que el propio Gateway sea alcanzable mediante el puerto publicado:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa un destino directo cuando Bonjour esté deshabilitado:
   - IU de control o herramientas locales: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS de Tailnet, IP de Tailnet, túnel SSH o
     DNS-SD de área amplia

4. Si habilitaste deliberadamente el plugin Bonjour en Docker y forzaste la publicidad
   con `OPENCLAW_DISABLE_BONJOUR=0`, prueba el multicast desde el host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la exploración está vacía o los logs del Gateway muestran cancelaciones repetidas del watchdog de ciao,
   restaura `OPENCLAW_DISABLE_BONJOUR=1` y usa una ruta directa o
   de Tailnet.

## Modos de fallo comunes

- **Bonjour no cruza redes**: usa Tailnet o SSH.
- **Multicast bloqueado**: algunas redes Wi-Fi deshabilitan mDNS.
- **Publicador atascado en probing/announcing**: hosts con multicast bloqueado,
  puentes de contenedores, WSL o cambios de interfaz pueden dejar el publicador ciao en un
  estado no anunciado. OpenClaw reintenta varias veces y luego deshabilita Bonjour
  para el proceso del Gateway actual en lugar de reiniciar el publicador indefinidamente.
- **Red puente de Docker**: Bonjour se deshabilita automáticamente en contenedores detectados.
  Define `OPENCLAW_DISABLE_BONJOUR=0` solo para host, macvlan u otra
  red compatible con mDNS.
- **Suspensión / cambios de interfaz**: macOS puede descartar temporalmente los resultados mDNS; reintenta.
- **La exploración funciona pero la resolución falla**: mantén nombres de máquina simples (evita emojis o
  puntuación) y luego reinicia el Gateway. El nombre de la instancia de servicio deriva del
  nombre de host, por lo que los nombres demasiado complejos pueden confundir a algunos resolutores.

## Nombres de instancia escapados (`\032`)

Bonjour/DNS-SD a menudo escapa bytes en nombres de instancias de servicio como secuencias decimales `\DDD`
(por ejemplo, los espacios se convierten en `\032`).

- Esto es normal a nivel de protocolo.
- Las IU deben decodificar para la visualización (iOS usa `BonjourEscapes.decode`).

## Habilitación / deshabilitación / configuración

- Las máquinas anfitrionas macOS inician automáticamente de forma predeterminada el Plugin de descubrimiento LAN incluido.
- `openclaw plugins enable bonjour` habilita el Plugin de descubrimiento LAN incluido en las máquinas anfitrionas donde no está habilitado de forma predeterminada.
- `openclaw plugins disable bonjour` deshabilita el anuncio multicast en LAN al deshabilitar el Plugin incluido.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita el anuncio multicast en LAN sin cambiar la configuración del Plugin; los valores verdaderos aceptados son `1`, `true`, `yes` y `on` (heredado: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` fuerza la activación del anuncio multicast en LAN, incluso dentro de contenedores detectados; los valores falsos aceptados son `0`, `false`, `no` y `off`.
- Cuando el Plugin Bonjour está habilitado y `OPENCLAW_DISABLE_BONJOUR` no está definido, Bonjour anuncia en máquinas anfitrionas normales y se deshabilita automáticamente dentro de contenedores detectados.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de vinculación del Gateway.
- `OPENCLAW_SSH_PORT` reemplaza el puerto SSH cuando se anuncia `sshPort` (heredado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica una pista de MagicDNS en TXT cuando el modo completo de mDNS está habilitado (heredado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` reemplaza la ruta de CLI anunciada (heredado: `OPENCLAW_CLI_PATH`).

## Documentación relacionada

- Política de descubrimiento y selección de transporte: [Descubrimiento](/es/gateway/discovery)
- Emparejamiento de Node + aprobaciones: [Emparejamiento del Gateway](/es/gateway/pairing)
