---
read_when:
    - Depuración de problemas de descubrimiento Bonjour en macOS/iOS
    - Cambiar los tipos de servicio mDNS, los registros TXT o la experiencia de descubrimiento
summary: Detección y depuración Bonjour/mDNS (anuncios del Gateway, clientes y modos de falla comunes)
title: Detección de Bonjour
x-i18n:
    generated_at: "2026-07-05T11:16:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw puede usar Bonjour (mDNS/DNS-SD) para descubrir un gateway activo (endpoint WebSocket). La exploración multicast `local.` es una **comodidad solo para LAN**: el Plugin `bonjour` incluido es propietario del anuncio en LAN, se inicia automáticamente en hosts macOS y es opcional en Linux, Windows y despliegues de gateway en contenedores. La misma baliza también puede publicarse mediante un dominio DNS-SD de área amplia configurado para descubrimiento entre redes. El descubrimiento es de mejor esfuerzo y **no** reemplaza la conectividad basada en SSH o Tailnet.

## Bonjour de área amplia (DNS-SD unicast) sobre Tailscale

Si el nodo y el gateway están en redes diferentes, mDNS multicast no puede cruzar el límite. Mantén la misma experiencia de descubrimiento cambiando a **DNS-SD unicast** ("Bonjour de área amplia") sobre Tailscale:

1. Ejecuta un servidor DNS en el host del gateway, accesible a través de Tailnet.
2. Publica registros DNS-SD para `_openclaw-gw._tcp` bajo una zona dedicada (ejemplo: `openclaw.internal.`).
3. Configura **DNS dividido** de Tailscale para que el dominio elegido se resuelva mediante ese servidor DNS para los clientes, incluido iOS.

`openclaw.internal.` arriba es solo un ejemplo — OpenClaw admite cualquier dominio de descubrimiento. Los nodos iOS/Android exploran tanto `local.` como tu dominio de área amplia configurado.

### Configuración del gateway

```json5
{
  gateway: { bind: "tailnet" }, // solo tailnet (recomendado)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` también acepta la variable de entorno `OPENCLAW_WIDE_AREA_DOMAIN` como reserva cuando no está configurado.

### Configuración única del servidor DNS (host del gateway, solo macOS)

```bash
openclaw dns setup --apply
```

Este comando es solo para macOS y requiere Homebrew y una conexión de Tailscale en ejecución. Instala CoreDNS (`brew install coredns`) y lo configura para:

- escuchar en el puerto 53 solo en las interfaces Tailscale del gateway
- servir el dominio elegido (ejemplo: `openclaw.internal.`) desde `~/.openclaw/dns/<domain>.db`

Ejecuta primero sin `--apply` para previsualizar el plan (dominio, ruta del archivo de zona, IP de Tailnet detectada, configuración recomendada) sin instalar nada.

Valida desde una máquina conectada a Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configuración DNS de Tailscale

En la consola de administración de Tailscale:

- Añade un servidor de nombres que apunte a la IP de Tailnet del gateway (UDP/TCP 53).
- Añade DNS dividido para que tu dominio de descubrimiento use ese servidor de nombres.

Una vez que los clientes acepten el DNS de Tailnet, los nodos iOS y el descubrimiento de la CLI pueden explorar `_openclaw-gw._tcp` en tu dominio de descubrimiento sin multicast.

### Seguridad del listener del gateway

El puerto WS del gateway (predeterminado `18789`) se enlaza a loopback de forma predeterminada. Para acceso LAN/Tailnet, enlázalo explícitamente y mantén la autenticación habilitada. Para configuraciones solo Tailnet, establece `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json` y reinicia el gateway (o la app de barra de menús de macOS).

## Qué anuncia

Solo el gateway anuncia `_openclaw-gw._tcp`. El anuncio multicast en LAN proviene del Plugin `bonjour` incluido cuando está habilitado; la publicación DNS-SD de área amplia sigue siendo propiedad del gateway.

## Tipos de servicio

- `_openclaw-gw._tcp` - baliza de transporte del gateway, usada por nodos macOS/iOS/Android.

## Claves TXT (pistas no secretas)

| Clave                         | Cuándo está presente                                                         |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `role=gateway`                | Siempre.                                                                     |
| `displayName=<friendly name>` | Siempre.                                                                     |
| `lanHost=<hostname>.local`    | Siempre.                                                                     |
| `gatewayPort=<port>`          | Siempre (WS + HTTP del gateway).                                             |
| `transport=gateway`           | Siempre.                                                                     |
| `gatewayTls=1`                | Solo cuando TLS está habilitado.                                             |
| `gatewayTlsSha256=<sha256>`   | Solo cuando TLS está habilitado y hay una huella digital disponible.         |
| `gatewayDirectReachable=1`    | Solo cuando el gateway es accesible directamente (no solo mediante una ruta de relé/proxy). |
| `canvasPort=<port>`           | Solo cuando el host de canvas está habilitado; actualmente igual que `gatewayPort`. |
| `tailnetDns=<magicdns>`       | Solo modo mDNS completo; pista opcional cuando Tailnet está disponible.      |
| `sshPort=<port>`              | Solo modo completo; omitido en modos mínimo y desactivado.                   |
| `cliPath=<path>`              | Solo modo completo; omitido en modos mínimo y desactivado.                   |

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes no deben tratar TXT como enrutamiento autoritativo.
- Los clientes deben enrutar usando el endpoint de servicio resuelto (SRV + A/AAAA). Trata `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` solo como pistas.
- El direccionamiento automático de SSH debe usar igualmente el host de servicio resuelto, no pistas solo de TXT.
- La fijación TLS nunca debe permitir que un `gatewayTlsSha256` anunciado reemplace una fijación almacenada previamente.
- Los nodos iOS/Android deben tratar las conexiones directas basadas en descubrimiento como **solo TLS** y requerir confirmación explícita del usuario antes de confiar en una huella digital por primera vez.

## Depuración en macOS

Herramientas integradas:

```bash
# Browse instances
dns-sd -B _openclaw-gw._tcp local.

# Resolve one instance (replace <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Si la exploración funciona pero la resolución falla, normalmente te enfrentas a una política de LAN o a un problema del resolvedor mDNS.

## Depuración en los registros del Gateway

El gateway escribe un archivo de registro rotativo (impreso al inicio como `gateway log file: ...`). Busca líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

El watchdog trata `probing`, `announcing` y los renombrados recientes por conflicto como estados en progreso. Si el servicio nunca llega a `announced`, OpenClaw vuelve a crear el anunciante y, tras fallos repetidos, deshabilita Bonjour para ese proceso de gateway en lugar de volver a anunciar indefinidamente.

Bonjour usa el nombre de host del sistema para el host `.local` anunciado cuando es una etiqueta DNS válida. Si el nombre de host del sistema contiene espacios, guiones bajos u otro carácter no válido para etiquetas DNS, OpenClaw recurre a `openclaw.local`. Establece `OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar el gateway cuando necesites una etiqueta de host explícita.

## Depuración en nodo iOS

El nodo iOS usa `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar registros: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, luego Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduce -> **Copy**. El registro incluye transiciones de estado del explorador y cambios del conjunto de resultados.

## Cuándo habilitar Bonjour

Bonjour se inicia automáticamente para el arranque del gateway con configuración vacía en hosts macOS, ya que la app local y los nodos iOS/Android cercanos suelen depender del descubrimiento en la misma LAN.

Habilítalo explícitamente cuando el descubrimiento automático en la misma LAN sea útil en Linux, Windows u otro host que no sea macOS:

```bash
openclaw plugins enable bonjour
```

Cuando está habilitado, Bonjour usa `discovery.mdns.mode` para decidir cuántos metadatos TXT publicar; el mismo modo controla las pistas TXT opcionales en registros DNS-SD de área amplia. Modos:

| Modo                | Comportamiento                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (predeterminado) | Solo claves TXT principales; omite `sshPort`, `cliPath`, `tailnetDns`.                                                                                   |
| `full`              | Añade `sshPort`, `cliPath`, `tailnetDns` — úsalo cuando los clientes necesiten esas pistas.                                                                     |
| `off`               | Suprime el multicast LAN sin cambiar la habilitación del Plugin; DNS-SD de área amplia aún puede publicar la baliza mínima cuando `discovery.wideArea.enabled` es true. |

## Cuándo deshabilitar Bonjour

Deja Bonjour deshabilitado cuando el anuncio multicast en LAN sea innecesario, no esté disponible o sea perjudicial — casos comunes son servidores que no son macOS, redes bridge de Docker, WSL o una política de red que descarta multicast mDNS. El gateway sigue siendo accesible mediante su URL publicada, SSH, Tailnet o DNS-SD de área amplia; solo el descubrimiento automático en LAN no es fiable.

Usa la anulación por variable de entorno para problemas acotados al despliegue (segura para imágenes Docker, archivos de servicio, scripts de inicio, depuración puntual — desaparece cuando lo hace el entorno):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Usa la configuración de plugins cuando quieras desactivar intencionalmente el Plugin de descubrimiento LAN incluido para esa configuración de OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Problemas típicos de Docker

El Plugin Bonjour incluido deshabilita automáticamente el anuncio multicast en LAN en contenedores detectados cuando `OPENCLAW_DISABLE_BONJOUR` no está configurado. Las redes bridge de Docker normalmente no reenvían multicast mDNS (`224.0.0.251:5353`) entre el contenedor y la LAN, por lo que anunciar desde el contenedor rara vez hace que el descubrimiento funcione.

Problemas típicos:

- Bonjour se inicia automáticamente en hosts macOS y es opcional en otros lugares. Dejarlo deshabilitado no detiene el gateway — solo omite el anuncio multicast en LAN.
- Deshabilitar Bonjour no cambia `gateway.bind`; Docker sigue usando de forma predeterminada `OPENCLAW_GATEWAY_BIND=lan` para que funcione el puerto publicado del host.
- Deshabilitar Bonjour no deshabilita DNS-SD de área amplia. Usa descubrimiento de área amplia o Tailnet cuando el gateway y el nodo no estén en la misma LAN.
- Reutilizar el mismo `OPENCLAW_CONFIG_DIR` fuera de Docker no conserva la política de deshabilitación automática del contenedor.
- Establece `OPENCLAW_DISABLE_BONJOUR=0` solo para redes de host, macvlan u otra red donde se sepa que pasa multicast mDNS; establécelo en `1` para forzar la deshabilitación.

## Solución de problemas de Bonjour deshabilitado

Si un nodo ya no descubre automáticamente el gateway después de configurar Docker:

1. Confirma si el gateway está ejecutándose en modo automático, forzado activado o forzado desactivado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirma que el propio gateway sea accesible mediante el puerto publicado:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa un destino directo cuando Bonjour esté deshabilitado:
   - Control UI o herramientas locales: `http://127.0.0.1:18789`
   - Clientes LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS de Tailnet, IP de Tailnet, túnel SSH o DNS-SD de área amplia

4. Si habilitaste deliberadamente el Plugin Bonjour en Docker y forzaste el anuncio con `OPENCLAW_DISABLE_BONJOUR=0`, prueba multicast desde el host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la exploración está vacía, o los registros del Gateway muestran cancelaciones repetidas del watchdog de ciao, restaura `OPENCLAW_DISABLE_BONJOUR=1` y usa una ruta directa o de Tailnet.

## Modos de fallo comunes

- **Bonjour no cruza redes**: usa Tailnet o SSH.
- **Multidifusión bloqueada**: algunas redes Wi-Fi deshabilitan mDNS.
- **Anunciante atascado en sondeo/anuncio**: los hosts con multidifusión bloqueada, puentes de contenedores, WSL o cambios de interfaz pueden dejar el anunciante ciao en un estado no anunciado. OpenClaw reintenta varias veces y luego deshabilita Bonjour para el proceso actual del gateway en lugar de reiniciar el anunciante indefinidamente.
- **Red de puente de Docker**: Bonjour se autodeshabilita en contenedores detectados. Establece `OPENCLAW_DISABLE_BONJOUR=0` solo para host, macvlan u otra red compatible con mDNS.
- **Suspensión/cambios de interfaz**: macOS puede perder temporalmente los resultados de mDNS; vuelve a intentarlo.
- **La exploración funciona, pero la resolución falla**: mantén simples los nombres de máquina (evita emojis o puntuación) y luego reinicia el gateway. El nombre de la instancia de servicio se deriva del nombre del host, por lo que los nombres demasiado complejos pueden confundir a algunos resolvedores.

## Nombres de instancia escapados (`\032`)

Bonjour/DNS-SD a menudo escapa bytes en nombres de instancia de servicio como secuencias decimales `\DDD` (los espacios se convierten en `\032`). Esto es normal a nivel de protocolo; las interfaces deben decodificarlo para mostrarlo (iOS usa `BonjourEscapes.decode`).

## Habilitación / deshabilitación / configuración

| Ajuste                                               | Efecto                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Habilita el plugin de descubrimiento LAN incluido en hosts donde no está habilitado de forma predeterminada. |
| `openclaw plugins disable bonjour`                   | Deshabilita el anuncio de multidifusión LAN al deshabilitar el plugin incluido.   |
| `OPENCLAW_DISABLE_BONJOUR=1` (o `true`/`yes`/`on`)   | Deshabilita el anuncio de multidifusión LAN sin cambiar la configuración del plugin. |
| `OPENCLAW_DISABLE_BONJOUR=0` (o `false`/`no`/`off`)  | Fuerza la activación del anuncio de multidifusión LAN, incluso dentro de contenedores detectados. |
| `discovery.mdns.mode`                                | `off` \| `minimal` (predeterminado) \| `full` — consulta los modos anteriores.    |
| `gateway.bind`                                       | Controla el modo de enlace del gateway en `~/.openclaw/openclaw.json`.            |
| `OPENCLAW_SSH_PORT`                                  | Anula el puerto SSH cuando se anuncia `sshPort` (modo completo).                  |
| `OPENCLAW_TAILNET_DNS`                               | Publica una pista MagicDNS en TXT cuando el modo completo de mDNS está habilitado. |
| `OPENCLAW_CLI_PATH`                                  | Anula la ruta de CLI anunciada (modo completo).                                   |

Los hosts macOS inician automáticamente el plugin de descubrimiento LAN incluido de forma predeterminada. Cuando el plugin Bonjour está habilitado y `OPENCLAW_DISABLE_BONJOUR` no está definido, Bonjour se anuncia en hosts normales y se autodeshabilita dentro de contenedores detectados (Docker, máquinas Fly.io y runtimes de contenedores comunes).

## Documentos relacionados

- Política de descubrimiento y selección de transporte: [Descubrimiento](/es/gateway/discovery)
- Emparejamiento de Node + aprobaciones: [Emparejamiento de Gateway](/es/gateway/pairing)
