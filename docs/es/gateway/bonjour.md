---
read_when:
    - Depuración de problemas de descubrimiento Bonjour en macOS/iOS
    - Cambiar tipos de servicio mDNS, registros TXT o la experiencia de descubrimiento
summary: Descubrimiento Bonjour/mDNS + depuración (balizas de Gateway, clientes y modos de fallo comunes)
title: Descubrimiento Bonjour
x-i18n:
    generated_at: "2026-04-26T11:27:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Descubrimiento Bonjour / mDNS

OpenClaw usa Bonjour (mDNS / DNS-SD) para descubrir un Gateway activo (endpoint WebSocket).
La exploración multicast `local.` es una comodidad **solo para LAN**. El Plugin
incluido `bonjour` es propietario de la publicación en LAN y está habilitado de forma predeterminada. Para el descubrimiento entre redes,
la misma baliza también puede publicarse mediante un dominio DNS-SD de área amplia configurado.
El descubrimiento sigue siendo de mejor esfuerzo y **no** sustituye la conectividad basada en SSH o Tailnet.

## Bonjour de área amplia (Unicast DNS-SD) sobre Tailscale

Si el nodo y el gateway están en redes diferentes, el mDNS multicast no cruzará el
límite. Puedes mantener la misma experiencia de descubrimiento cambiando a **unicast DNS-SD**
("Wide-Area Bonjour") sobre Tailscale.

Pasos de alto nivel:

1. Ejecuta un servidor DNS en el host del gateway (accesible a través de Tailnet).
2. Publica registros DNS-SD para `_openclaw-gw._tcp` bajo una zona dedicada
   (ejemplo: `openclaw.internal.`).
3. Configura **split DNS** de Tailscale para que tu dominio elegido se resuelva mediante ese
   servidor DNS para los clientes (incluido iOS).

OpenClaw admite cualquier dominio de descubrimiento; `openclaw.internal.` es solo un ejemplo.
Los nodos iOS/Android exploran tanto `local.` como tu dominio configurado de área amplia.

### Configuración del Gateway (recomendada)

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

Esto instala CoreDNS y lo configura para:

- escuchar en el puerto 53 solo en las interfaces Tailscale del gateway
- servir tu dominio elegido (ejemplo: `openclaw.internal.`) desde `~/.openclaw/dns/<domain>.db`

Valídalo desde una máquina conectada a tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Ajustes DNS de Tailscale

En la consola de administración de Tailscale:

- Añade un nameserver que apunte a la IP tailnet del gateway (UDP/TCP 53).
- Añade split DNS para que tu dominio de descubrimiento use ese nameserver.

Una vez que los clientes acepten el DNS de tailnet, los nodos iOS y el descubrimiento por CLI podrán explorar
`_openclaw-gw._tcp` en tu dominio de descubrimiento sin multicast.

### Seguridad del listener de Gateway (recomendada)

El puerto WS del Gateway (predeterminado `18789`) se enlaza a loopback de forma predeterminada. Para acceso por LAN/tailnet,
enlázalo explícitamente y mantén la autenticación habilitada.

Para configuraciones solo tailnet:

- Establece `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json`.
- Reinicia el Gateway (o reinicia la app de barra de menús de macOS).

## Qué publica

Solo el Gateway publica `_openclaw-gw._tcp`. La publicación multicast en LAN
la proporciona el Plugin incluido `bonjour`; la publicación DNS-SD de área amplia sigue
siendo propiedad del Gateway.

## Tipos de servicio

- `_openclaw-gw._tcp` — baliza de transporte del gateway (usada por nodos macOS/iOS/Android).

## Claves TXT (indicadores no secretos)

El Gateway publica pequeños indicadores no secretos para hacer cómodos los flujos de UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo cuando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (solo cuando TLS está habilitado y la huella digital está disponible)
- `canvasPort=<port>` (solo cuando el host de canvas está habilitado; actualmente es el mismo que `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (solo en modo mDNS completo, indicador opcional cuando Tailnet está disponible)
- `sshPort=<port>` (solo en modo mDNS completo; DNS-SD de área amplia puede omitirlo)
- `cliPath=<path>` (solo en modo mDNS completo; DNS-SD de área amplia sigue escribiéndolo como indicador de instalación remota)

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS son **no autenticados**. Los clientes no deben tratar TXT como enrutamiento autoritativo.
- Los clientes deben enrutar usando el endpoint del servicio resuelto (SRV + A/AAAA). Trata `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` solo como indicadores.
- El direccionamiento automático por SSH debe usar igualmente el host del servicio resuelto, no indicadores solo TXT.
- El pinning de TLS nunca debe permitir que un `gatewayTlsSha256` publicado anule un pin almacenado previamente.
- Los nodos iOS/Android deben tratar las conexiones directas basadas en descubrimiento como **solo TLS** y exigir confirmación explícita del usuario antes de confiar en una huella digital por primera vez.

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

Si explorar funciona pero resolver falla, normalmente estás topándote con una política de LAN o
un problema del resolvedor mDNS.

## Depuración en los registros del Gateway

El Gateway escribe un archivo de registro rotativo (se imprime al iniciar como
`gateway log file: ...`). Busca líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Depuración en el nodo iOS

El nodo iOS usa `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar registros:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduce → **Copy**

El registro incluye transiciones de estado del navegador y cambios en el conjunto de resultados.

## Cuándo deshabilitar Bonjour

Deshabilita Bonjour solo cuando la publicación multicast en LAN no esté disponible o sea perjudicial.
El caso más común es un Gateway que se ejecuta detrás de redes bridge de Docker, WSL o una
política de red que descarta multicast mDNS. En esos entornos el Gateway sigue
siendo accesible a través de su URL publicada, SSH, Tailnet o DNS-SD de área amplia,
pero el descubrimiento automático por LAN no es fiable.

Prefiere la anulación de entorno existente cuando el problema esté limitado al despliegue:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Eso deshabilita la publicación multicast en LAN sin cambiar la configuración del Plugin.
Es seguro para imágenes Docker, archivos de servicio, scripts de arranque y depuración
puntual porque el ajuste desaparece cuando lo hace el entorno.

Usa configuración de Plugin solo cuando realmente quieras apagar el
Plugin incluido de descubrimiento LAN para esa configuración de OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Consideraciones de Docker

Docker Compose incluido establece `OPENCLAW_DISABLE_BONJOUR=1` para el servicio Gateway
de forma predeterminada. Las redes bridge de Docker normalmente no reenvían multicast mDNS
(`224.0.0.251:5353`) entre el contenedor y la LAN, por lo que dejar Bonjour activado puede
producir fallos repetidos de ciao `probing` o `announcing` sin hacer que el descubrimiento
funcione.

Consideraciones importantes:

- Deshabilitar Bonjour no detiene el Gateway. Solo detiene la
  publicación multicast en LAN.
- Deshabilitar Bonjour no cambia `gateway.bind`; Docker sigue usando
  `OPENCLAW_GATEWAY_BIND=lan` de forma predeterminada para que el puerto publicado del host pueda funcionar.
- Deshabilitar Bonjour no deshabilita DNS-SD de área amplia. Usa descubrimiento de área amplia
  o Tailnet cuando el Gateway y el nodo no estén en la misma LAN.
- Reutilizar el mismo `OPENCLAW_CONFIG_DIR` fuera de Docker no hereda el
  valor predeterminado de Compose a menos que el entorno siga estableciendo `OPENCLAW_DISABLE_BONJOUR`.
- Establece `OPENCLAW_DISABLE_BONJOUR=0` solo para host networking, macvlan u otra
  red donde se sepa que el multicast mDNS funciona.

## Solución de problemas con Bonjour deshabilitado

Si un nodo deja de descubrir automáticamente el Gateway tras configurar Docker:

1. Confirma si el Gateway está suprimiendo intencionadamente la publicación LAN:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirma que el propio Gateway es accesible mediante el puerto publicado:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa un destino directo cuando Bonjour esté deshabilitado:
   - UI de control o herramientas locales: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: Tailnet MagicDNS, IP de Tailnet, túnel SSH o
     DNS-SD de área amplia

4. Si habilitaste Bonjour intencionadamente en Docker con
   `OPENCLAW_DISABLE_BONJOUR=0`, prueba multicast desde el host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la exploración está vacía o los registros del Gateway muestran cancelaciones
   repetidas del watchdog de ciao, restablece `OPENCLAW_DISABLE_BONJOUR=1` y usa una ruta directa o
   de Tailnet.

## Modos de fallo comunes

- **Bonjour no cruza redes**: usa Tailnet o SSH.
- **Multicast bloqueado**: algunas redes Wi‑Fi deshabilitan mDNS.
- **El publicador se queda atascado en probing/announcing**: hosts con multicast bloqueado,
  bridges de contenedores, WSL o cambios de interfaz pueden dejar el publicador ciao en un
  estado no publicado. OpenClaw reintenta unas pocas veces y luego deshabilita Bonjour
  para el proceso actual del Gateway en lugar de reiniciar el publicador indefinidamente.
- **Red bridge de Docker**: Docker Compose incluido deshabilita Bonjour de
  forma predeterminada con `OPENCLAW_DISABLE_BONJOUR=1`. Establécelo en `0` solo para host,
  macvlan u otra red compatible con mDNS.
- **Suspensión / cambios de interfaz**: macOS puede descartar temporalmente resultados mDNS; vuelve a intentarlo.
- **Explorar funciona pero resolver falla**: mantén simples los nombres de las máquinas (evita emojis o
  puntuación), luego reinicia el Gateway. El nombre de instancia del servicio deriva del
  nombre del host, por lo que nombres demasiado complejos pueden confundir a algunos resolvedores.

## Nombres de instancia escapados (`\032`)

Bonjour/DNS-SD suele escapar bytes en nombres de instancia de servicio como secuencias decimales `\DDD`
(por ejemplo, los espacios se convierten en `\032`).

- Esto es normal a nivel de protocolo.
- Las interfaces deben decodificarlos para mostrarlos (iOS usa `BonjourEscapes.decode`).

## Deshabilitación / configuración

- `openclaw plugins disable bonjour` deshabilita la publicación multicast en LAN al deshabilitar el Plugin incluido.
- `openclaw plugins enable bonjour` restaura el Plugin predeterminado de descubrimiento LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita la publicación multicast en LAN sin cambiar la configuración del Plugin; los valores verdaderos aceptados son `1`, `true`, `yes` y `on` (heredado: `OPENCLAW_DISABLE_BONJOUR`).
- Docker Compose establece `OPENCLAW_DISABLE_BONJOUR=1` de forma predeterminada para redes bridge; anúlalo con `OPENCLAW_DISABLE_BONJOUR=0` solo cuando el multicast mDNS esté disponible.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de enlace del Gateway.
- `OPENCLAW_SSH_PORT` anula el puerto SSH cuando se publica `sshPort` (heredado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica un indicador MagicDNS en TXT cuando el modo mDNS completo está habilitado (heredado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` anula la ruta CLI publicada (heredado: `OPENCLAW_CLI_PATH`).

## Documentación relacionada

- Política de descubrimiento y selección de transporte: [Discovery](/es/gateway/discovery)
- Emparejamiento de nodos + aprobaciones: [Emparejamiento del Gateway](/es/gateway/pairing)
