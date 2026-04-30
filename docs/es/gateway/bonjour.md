---
read_when:
    - Depuración de problemas de descubrimiento de Bonjour en macOS/iOS
    - Cambiar los tipos de servicio mDNS, los registros TXT o la experiencia de descubrimiento
summary: Descubrimiento y depuración de Bonjour/mDNS (balizas de Gateway, clientes y modos de fallo comunes)
title: Descubrimiento de Bonjour
x-i18n:
    generated_at: "2026-04-30T05:39:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Descubrimiento Bonjour / mDNS

OpenClaw usa Bonjour (mDNS / DNS‑SD) para descubrir un Gateway activo (endpoint WebSocket).
La exploración multicast `local.` es una **comodidad solo para LAN**. El plugin `bonjour`
incluido es propietario del anuncio en LAN y está habilitado por defecto. Para el descubrimiento entre redes,
el mismo beacon también puede publicarse mediante un dominio DNS-SD de área amplia configurado.
El descubrimiento sigue siendo de mejor esfuerzo y **no** reemplaza la conectividad basada en SSH o Tailnet.

## Bonjour de área amplia (DNS-SD unicast) sobre Tailscale

Si el nodo y el Gateway están en redes diferentes, mDNS multicast no cruzará el
límite. Puedes mantener la misma experiencia de descubrimiento cambiando a **DNS‑SD unicast**
("Bonjour de área amplia") sobre Tailscale.

Pasos de alto nivel:

1. Ejecuta un servidor DNS en el host del Gateway (accesible mediante Tailnet).
2. Publica registros DNS‑SD para `_openclaw-gw._tcp` bajo una zona dedicada
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

### Configuración única del servidor DNS (host del Gateway)

```bash
openclaw dns setup --apply
```

Esto instala CoreDNS y lo configura para:

- escuchar en el puerto 53 solo en las interfaces Tailscale del Gateway
- servir el dominio elegido (ejemplo: `openclaw.internal.`) desde `~/.openclaw/dns/<domain>.db`

Valida desde una máquina conectada a tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configuración de DNS de Tailscale

En la consola de administración de Tailscale:

- Añade un servidor de nombres que apunte a la IP tailnet del Gateway (UDP/TCP 53).
- Añade DNS dividido para que tu dominio de descubrimiento use ese servidor de nombres.

Cuando los clientes acepten el DNS de tailnet, los nodos iOS y el descubrimiento de la CLI podrán explorar
`_openclaw-gw._tcp` en tu dominio de descubrimiento sin multicast.

### Seguridad del listener del Gateway (recomendada)

El puerto WS del Gateway (por defecto `18789`) se enlaza a loopback por defecto. Para acceso por LAN/tailnet,
enlázalo explícitamente y mantén la autenticación habilitada.

Para configuraciones solo de tailnet:

- Establece `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json`.
- Reinicia el Gateway (o reinicia la app de barra de menús de macOS).

## Qué anuncia

Solo el Gateway anuncia `_openclaw-gw._tcp`. El anuncio multicast en LAN lo
proporciona el plugin `bonjour` incluido; la publicación DNS-SD de área amplia sigue siendo
propiedad del Gateway.

## Tipos de servicio

- `_openclaw-gw._tcp` — beacon de transporte del Gateway (usado por nodos macOS/iOS/Android).

## Claves TXT (pistas no secretas)

El Gateway anuncia pequeñas pistas no secretas para facilitar los flujos de UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo cuando TLS está habilitado)
- `gatewayTlsSha256=<sha256>` (solo cuando TLS está habilitado y la huella está disponible)
- `canvasPort=<port>` (solo cuando el host de canvas está habilitado; actualmente el mismo que `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (solo modo completo de mDNS, pista opcional cuando Tailnet está disponible)
- `sshPort=<port>` (solo modo completo de mDNS; DNS-SD de área amplia puede omitirlo)
- `cliPath=<path>` (solo modo completo de mDNS; DNS-SD de área amplia todavía lo escribe como pista de instalación remota)

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes no deben tratar TXT como enrutamiento autoritativo.
- Los clientes deben enrutar usando el endpoint de servicio resuelto (SRV + A/AAAA). Trata `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` solo como pistas.
- El objetivo automático de SSH debe usar igualmente el host de servicio resuelto, no pistas solo de TXT.
- La fijación TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sobrescriba un pin almacenado previamente.
- Los nodos iOS/Android deben tratar las conexiones directas basadas en descubrimiento como **solo TLS** y exigir confirmación explícita del usuario antes de confiar en una huella por primera vez.

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

Si la exploración funciona pero la resolución falla, normalmente se debe a una política de LAN o a un
problema del resolvedor mDNS.

## Depuración en los registros del Gateway

El Gateway escribe un archivo de registro rotativo (impreso al inicio como
`gateway log file: ...`). Busca líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour usa el nombre de host del sistema para el host `.local` anunciado cuando es una
etiqueta DNS válida. Si el nombre de host del sistema contiene espacios, guiones bajos u otro
carácter inválido para una etiqueta DNS, OpenClaw recurre a `openclaw.local`. Establece
`OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar el Gateway cuando necesites una
etiqueta de host explícita.

## Depuración en nodo iOS

El nodo iOS usa `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar registros:

- Ajustes → Gateway → Avanzado → **Registros de depuración de descubrimiento**
- Ajustes → Gateway → Avanzado → **Registros de descubrimiento** → reproduce → **Copiar**

El registro incluye transiciones de estado del explorador y cambios del conjunto de resultados.

## Cuándo deshabilitar Bonjour

Deshabilita Bonjour solo cuando el anuncio multicast en LAN no esté disponible o sea perjudicial.
El caso habitual es un Gateway ejecutándose detrás de redes bridge de Docker, WSL o una
política de red que descarta multicast mDNS. En esos entornos, el Gateway sigue
siendo accesible mediante su URL publicada, SSH, Tailnet o DNS-SD de área amplia,
pero el autodescubrimiento en LAN no es fiable.

Prefiere la anulación de entorno existente cuando el problema depende del despliegue:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Eso deshabilita el anuncio multicast en LAN sin cambiar la configuración del plugin.
Es seguro para imágenes Docker, archivos de servicio, scripts de lanzamiento y depuración puntual
porque el ajuste desaparece cuando lo hace el entorno.

Usa la configuración de plugin solo cuando quieras desactivar intencionalmente el
plugin de descubrimiento LAN incluido para esa configuración de OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Particularidades de Docker

El plugin Bonjour incluido deshabilita automáticamente el anuncio multicast en LAN en contenedores
detectados cuando `OPENCLAW_DISABLE_BONJOUR` no está establecido. Las redes bridge de Docker
normalmente no reenvían multicast mDNS (`224.0.0.251:5353`) entre el contenedor
y la LAN, por lo que anunciar desde el contenedor rara vez hace que el descubrimiento funcione.

Particularidades importantes:

- Deshabilitar Bonjour no detiene el Gateway. Solo detiene el anuncio multicast
  en LAN.
- Deshabilitar Bonjour no cambia `gateway.bind`; Docker sigue usando por defecto
  `OPENCLAW_GATEWAY_BIND=lan` para que el puerto de host publicado pueda funcionar.
- Deshabilitar Bonjour no deshabilita DNS-SD de área amplia. Usa descubrimiento de área amplia
  o Tailnet cuando el Gateway y el nodo no estén en la misma LAN.
- Reutilizar el mismo `OPENCLAW_CONFIG_DIR` fuera de Docker no conserva la
  política de autodeshabilitación del contenedor.
- Establece `OPENCLAW_DISABLE_BONJOUR=0` solo para redes host, macvlan u otra
  red donde se sepa que multicast mDNS pasa; establécelo en `1` para forzar la deshabilitación.

## Solución de problemas de Bonjour deshabilitado

Si un nodo ya no descubre automáticamente el Gateway después de configurar Docker:

1. Confirma si el Gateway se ejecuta en modo automático, forzado activado o forzado desactivado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirma que el propio Gateway es accesible mediante el puerto publicado:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa un objetivo directo cuando Bonjour esté deshabilitado:
   - Control UI o herramientas locales: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS de Tailnet, IP de Tailnet, túnel SSH o
     DNS-SD de área amplia

4. Si habilitaste Bonjour deliberadamente en Docker con
   `OPENCLAW_DISABLE_BONJOUR=0`, prueba multicast desde el host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la exploración está vacía o los registros del Gateway muestran cancelaciones repetidas del watchdog
   de ciao, restaura `OPENCLAW_DISABLE_BONJOUR=1` y usa una ruta directa o
   por Tailnet.

## Modos de fallo comunes

- **Bonjour no cruza redes**: usa Tailnet o SSH.
- **Multicast bloqueado**: algunas redes Wi‑Fi deshabilitan mDNS.
- **Anunciante atascado en sondeo/anuncio**: hosts con multicast bloqueado,
  bridges de contenedor, WSL o cambios de interfaz pueden dejar al anunciante ciao en un
  estado no anunciado. OpenClaw reintenta unas cuantas veces y luego deshabilita Bonjour
  para el proceso actual del Gateway en vez de reiniciar el anunciante indefinidamente.
- **Red bridge de Docker**: Bonjour se deshabilita automáticamente en contenedores detectados.
  Establece `OPENCLAW_DISABLE_BONJOUR=0` solo para host, macvlan u otra
  red compatible con mDNS.
- **Suspensión / cambios de interfaz**: macOS puede descartar temporalmente resultados mDNS; reintenta.
- **La exploración funciona pero la resolución falla**: mantén nombres de máquina simples (evita emojis o
  puntuación) y luego reinicia el Gateway. El nombre de instancia del servicio deriva del
  nombre de host, por lo que nombres demasiado complejos pueden confundir algunos resolvedores.

## Nombres de instancia escapados (`\032`)

Bonjour/DNS‑SD suele escapar bytes en nombres de instancia de servicio como secuencias decimales `\DDD`
(p. ej., los espacios se convierten en `\032`).

- Esto es normal a nivel de protocolo.
- Las UI deben decodificar para mostrar (iOS usa `BonjourEscapes.decode`).

## Deshabilitación / configuración

- `openclaw plugins disable bonjour` deshabilita el anuncio multicast en LAN al deshabilitar el plugin incluido.
- `openclaw plugins enable bonjour` restaura el plugin predeterminado de descubrimiento LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` deshabilita el anuncio multicast en LAN sin cambiar la configuración del plugin; los valores verdaderos aceptados son `1`, `true`, `yes` y `on` (heredado: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` fuerza la activación del anuncio multicast en LAN, incluso dentro de contenedores detectados; los valores falsos aceptados son `0`, `false`, `no` y `off`.
- Cuando `OPENCLAW_DISABLE_BONJOUR` no está establecido, Bonjour anuncia en hosts normales y se deshabilita automáticamente dentro de contenedores detectados.
- `gateway.bind` en `~/.openclaw/openclaw.json` controla el modo de enlace del Gateway.
- `OPENCLAW_SSH_PORT` anula el puerto SSH cuando se anuncia `sshPort` (heredado: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publica una pista MagicDNS en TXT cuando el modo completo de mDNS está habilitado (heredado: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` anula la ruta anunciada de la CLI (heredado: `OPENCLAW_CLI_PATH`).

## Documentación relacionada

- Política de descubrimiento y selección de transporte: [Descubrimiento](/es/gateway/discovery)
- Emparejamiento de Node + aprobaciones: [Emparejamiento del Gateway](/es/gateway/pairing)
