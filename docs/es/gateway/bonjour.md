---
read_when:
    - Depuración de problemas de detección de Bonjour en macOS/iOS
    - Cambio de los tipos de servicio mDNS, los registros TXT o la experiencia de usuario de detección
summary: Detección y depuración de Bonjour/mDNS (balizas del Gateway, clientes y modos de fallo comunes)
title: Descubrimiento de Bonjour
x-i18n:
    generated_at: "2026-07-16T11:32:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw puede usar Bonjour (mDNS/DNS-SD) para descubrir un gateway activo (punto de conexión WebSocket). La exploración de multidifusión `local.` es una **comodidad limitada a la LAN**: el Plugin `bonjour` incluido gestiona la publicidad en la LAN, se inicia automáticamente en hosts macOS y requiere activación explícita en Linux, Windows y despliegues de gateway en contenedores. La misma baliza también puede publicarse mediante un dominio DNS-SD de área amplia configurado para el descubrimiento entre redes. El descubrimiento funciona en la medida de lo posible y **no** sustituye la conectividad basada en SSH o Tailnet.

## Bonjour de área amplia (DNS-SD unidifusión) mediante Tailscale

Si el Node y el gateway están en redes distintas, el mDNS multidifusión no puede atravesar el límite. Se puede conservar la misma experiencia de descubrimiento cambiando a **DNS-SD unidifusión** («Bonjour de área amplia») mediante Tailscale:

1. Ejecute un servidor DNS en el host del gateway, accesible mediante Tailnet.
2. Publique registros DNS-SD para `_openclaw-gw._tcp` en una zona dedicada (ejemplo: `openclaw.internal.`).
3. Configure el **DNS dividido** de Tailscale para que el dominio elegido se resuelva mediante ese servidor DNS para los clientes, incluido iOS.

`openclaw.internal.` anterior es solo un ejemplo: OpenClaw admite cualquier dominio de descubrimiento. Los Nodes iOS/Android exploran tanto `local.` como el dominio de área amplia configurado.

### Configuración del gateway

```json5
{
  gateway: { bind: "tailnet" }, // solo Tailnet (recomendado)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` también acepta la variable de entorno `OPENCLAW_WIDE_AREA_DOMAIN` como alternativa cuando no está definido.

### Configuración única del servidor DNS (host del gateway, solo macOS)

```bash
openclaw dns setup --apply
```

Este comando solo está disponible en macOS y requiere Homebrew y una conexión de Tailscale activa. Instala CoreDNS (`brew install coredns`) y lo configura para:

- escuchar en el puerto 53 únicamente en las interfaces de Tailscale del gateway
- servir el dominio elegido (ejemplo: `openclaw.internal.`) desde `~/.openclaw/dns/<domain>.db`

Ejecútelo primero sin `--apply` para obtener una vista previa del plan (dominio, ruta del archivo de zona, IP de Tailnet detectada y configuración recomendada) sin instalar nada.

Valide desde una máquina conectada a Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configuración DNS de Tailscale

En la consola de administración de Tailscale:

- Añada un servidor de nombres que apunte a la IP de Tailnet del gateway (UDP/TCP 53).
- Añada DNS dividido para que el dominio de descubrimiento use ese servidor de nombres.

Una vez que los clientes acepten el DNS de Tailnet, los Nodes iOS y el descubrimiento mediante CLI podrán explorar `_openclaw-gw._tcp` en el dominio de descubrimiento sin multidifusión.

### Seguridad del proceso de escucha del gateway

El puerto WS del gateway (de forma predeterminada, `18789`) se vincula a la interfaz de bucle invertido de forma predeterminada. Para acceder mediante LAN/Tailnet, configure explícitamente la vinculación y mantenga activada la autenticación. Para configuraciones exclusivas de Tailnet, establezca `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json` y reinicie el gateway (o la aplicación de la barra de menús de macOS).

## Qué se anuncia

Solo el gateway anuncia `_openclaw-gw._tcp`. La publicidad de multidifusión en la LAN procede del Plugin `bonjour` incluido cuando está activado; la publicación de DNS-SD de área amplia sigue siendo responsabilidad del gateway.

## Tipos de servicio

- `_openclaw-gw._tcp` - baliza de transporte del gateway, utilizada por los Nodes macOS/iOS/Android.

## Claves TXT (indicaciones no secretas)

| Clave                         | Cuándo está presente                                                            |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Siempre.                                                                        |
| `displayName=<friendly name>` | Siempre.                                                                        |
| `lanHost=<hostname>.local`    | Siempre.                                                                        |
| `gatewayPort=<port>`          | Siempre (WS + HTTP del gateway).                                                |
| `transport=gateway`           | Siempre.                                                                        |
| `gatewayTls=1`                | Solo cuando TLS está activado.                                                  |
| `gatewayTlsSha256=<sha256>`   | Solo cuando TLS está activado y hay una huella digital disponible.              |
| `gatewayDirectReachable=1`    | Solo cuando se puede acceder directamente al gateway (no solo mediante una ruta de retransmisión/proxy). |
| `canvasPort=<port>`           | Solo cuando el host del lienzo está activado; actualmente es el mismo que `gatewayPort`. |
| `tailnetDns=<magicdns>`       | Solo en el modo completo de mDNS; indicación opcional cuando Tailnet está disponible. |
| `sshPort=<port>`              | Solo en el modo completo; se omite en los modos mínimo y desactivado.           |
| `cliPath=<path>`              | Solo en el modo completo; se omite en los modos mínimo y desactivado.           |

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes no deben considerar TXT como información de enrutamiento autoritativa.
- Los clientes deben realizar el enrutamiento mediante el punto de conexión de servicio resuelto (SRV + A/AAAA). Considere `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` únicamente como indicaciones.
- La selección automática del destino SSH también debe usar el host de servicio resuelto, no indicaciones basadas únicamente en TXT.
- La fijación de TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sustituya una fijación almacenada previamente.
- Los Nodes iOS/Android deben considerar las conexiones directas basadas en el descubrimiento como **exclusivas de TLS** y requerir la confirmación explícita del usuario antes de confiar por primera vez en una huella digital.

## Depuración en macOS

Herramientas integradas:

```bash
# Explorar instancias
dns-sd -B _openclaw-gw._tcp local.

# Resolver una instancia (sustituya <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Si la exploración funciona, pero la resolución falla, normalmente se debe a una política de LAN o a un problema del solucionador de mDNS.

## Depuración en los registros del Gateway

El gateway escribe un archivo de registro rotativo (que se muestra al iniciarse como `gateway log file: ...`). Busque líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw inicia cada servicio Bonjour una vez y deja el sondeo, los reintentos, la resolución de conflictos de nombres y la republicación tras cambios de interfaz a cargo del respondedor mDNS. Esto evita intentos de publicación superpuestos durante las fluctuaciones normales de la red. Se suprimen los mensajes internos repetidos de autosondeo para impedir que saturen el registro del gateway.

Cuando varios gateways de OpenClaw se anuncian desde el mismo host, Bonjour puede añadir sufijos como `(2)` o `(3)` para mantener únicos los nombres de las instancias de servicio. Estos sufijos forman parte de la resolución normal de conflictos y no indican una supervisión OCM duplicada.

Bonjour usa el nombre de host del sistema para el host `.local` anunciado cuando es una etiqueta DNS válida. Si el nombre de host del sistema contiene espacios, guiones bajos u otro carácter no válido para una etiqueta DNS, OpenClaw utiliza `openclaw.local` como alternativa. Establezca `OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar el gateway cuando se necesite una etiqueta de host explícita.

## Depuración en un Node iOS

El Node iOS usa `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar registros: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, luego Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduzca el problema -> **Copy**. El registro incluye las transiciones de estado del explorador y los cambios en el conjunto de resultados.

## Cuándo activar Bonjour

Bonjour se inicia automáticamente cuando el gateway se inicia con una configuración vacía en hosts macOS, ya que la aplicación local y los Nodes iOS/Android cercanos suelen depender del descubrimiento en la misma LAN.

Actívelo explícitamente cuando el descubrimiento automático en la misma LAN resulte útil en Linux, Windows u otro host que no sea macOS:

```bash
openclaw plugins enable bonjour
```

Cuando está activado, Bonjour usa `discovery.mdns.mode` para decidir cuántos metadatos TXT publicar; el mismo modo controla las indicaciones TXT opcionales de los registros DNS-SD de área amplia. Modos:

| Modo                | Comportamiento                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (predeterminado) | Solo las claves TXT principales; omite `sshPort`, `cliPath`, `tailnetDns`.                                                                                                 |
| `full`              | Añade `sshPort`, `cliPath`, `tailnetDns`; úselo cuando los clientes necesiten esas indicaciones.                                                                                  |
| `off`               | Suprime la multidifusión en la LAN sin cambiar la activación del Plugin; DNS-SD de área amplia todavía puede publicar la baliza mínima cuando `discovery.wideArea.enabled` es verdadero. |

## Cuándo desactivar Bonjour

Mantenga Bonjour desactivado cuando la publicidad de multidifusión en la LAN sea innecesaria, no esté disponible o resulte perjudicial; algunos casos habituales son los servidores que no usan macOS, las redes puente de Docker, WSL o las políticas de red que descartan la multidifusión mDNS. Se puede seguir accediendo al gateway mediante su URL publicada, SSH, Tailnet o DNS-SD de área amplia; solo el descubrimiento automático en la LAN deja de ser fiable.

Use la sustitución mediante variable de entorno para problemas específicos del despliegue (es segura para imágenes de Docker, archivos de servicio, scripts de inicio y depuraciones puntuales; desaparece cuando desaparece el entorno):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Use la configuración del Plugin cuando se quiera desactivar intencionadamente el Plugin de descubrimiento en la LAN incluido para esa configuración de OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Consideraciones de Docker

El Plugin Bonjour incluido desactiva automáticamente la publicidad de multidifusión en la LAN en los contenedores detectados cuando `OPENCLAW_DISABLE_BONJOUR` no está definido. Las redes puente de Docker normalmente no reenvían la multidifusión mDNS (`224.0.0.251:5353`) entre el contenedor y la LAN, por lo que anunciar desde el contenedor rara vez permite que funcione el descubrimiento.

Consideraciones:

- Bonjour se inicia automáticamente en hosts macOS y requiere activación explícita en los demás sistemas. Mantenerlo desactivado no detiene el gateway; solo omite la publicidad de multidifusión en la LAN.
- Desactivar Bonjour no cambia `gateway.bind`; Docker sigue usando `OPENCLAW_GATEWAY_BIND=lan` de forma predeterminada para que funcione el puerto publicado del host.
- Desactivar Bonjour no desactiva DNS-SD de área amplia. Use el descubrimiento de área amplia o Tailnet cuando el gateway y el Node no estén en la misma LAN.
- Reutilizar el mismo `OPENCLAW_CONFIG_DIR` fuera de Docker no conserva la política de desactivación automática del contenedor.
- Establezca `OPENCLAW_DISABLE_BONJOUR=0` únicamente para redes de host, macvlan u otra red en la que se sepa que pasa la multidifusión mDNS; establézcalo en `1` para forzar la desactivación.

## Solución de problemas con Bonjour desactivado

Si un Node deja de descubrir automáticamente el gateway después de configurar Docker:

1. Confirme si el gateway se ejecuta en modo automático, activado de forma forzada o desactivado de forma forzada:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirme que se puede acceder al propio gateway mediante el puerto publicado:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Use un destino directo cuando Bonjour esté desactivado:
   - Interfaz de control o herramientas locales: `http://127.0.0.1:18789`
   - Clientes de la LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS de Tailnet, IP de Tailnet, túnel SSH o DNS-SD de área amplia

4. Si se ha activado deliberadamente el Plugin Bonjour en Docker y se ha forzado la publicidad con `OPENCLAW_DISABLE_BONJOUR=0`, pruebe la multidifusión desde el host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la exploración no devuelve resultados o los registros del Gateway muestran fallos repetidos del sondeo de ciao, restaure `OPENCLAW_DISABLE_BONJOUR=1` y use una ruta directa o mediante Tailnet.

## Modos de fallo habituales

- **Bonjour no atraviesa redes**: use Tailnet o SSH.
- **Multidifusión bloqueada**: algunas redes Wi-Fi deshabilitan mDNS.
- **El anunciante se queda bloqueado en la sondeación o el anuncio**: los hosts con multidifusión bloqueada, los puentes de contenedores, WSL o los cambios frecuentes de interfaz pueden dejar el respondedor en un estado sin anunciar. El Gateway sigue disponible mediante rutas directas, SSH, Tailnet o DNS-SD de área extensa; deshabilite Bonjour en la LAN con `discovery.mdns.mode: "off"` o `OPENCLAW_DISABLE_BONJOUR=1` cuando la multidifusión no esté disponible.
- **Red de puente de Docker**: Bonjour se deshabilita automáticamente en los contenedores detectados. Establezca `OPENCLAW_DISABLE_BONJOUR=0` solo para una red de host, macvlan u otra red compatible con mDNS.
- **Cambios frecuentes por suspensión o de interfaz**: macOS puede dejar de mostrar temporalmente los resultados de mDNS; vuelva a intentarlo.
- **La exploración funciona, pero la resolución falla**: mantenga simples los nombres de las máquinas (evite emojis o signos de puntuación) y, después, reinicie el Gateway. El nombre de instancia del servicio se deriva del nombre del host, por lo que los nombres demasiado complejos pueden confundir a algunos resolutores.

## Nombres de instancia con secuencias de escape (`\032`)

Bonjour/DNS-SD suele representar los bytes mediante secuencias decimales `\DDD` en los nombres de instancia de servicio (los espacios se convierten en `\032`). Esto es normal en el nivel del protocolo; las interfaces de usuario deben decodificarlas para mostrarlas (iOS usa `BonjourEscapes.decode`).

## Activación, desactivación y configuración

| Ajuste                                              | Efecto                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Activa el Plugin de detección en LAN incluido en los hosts donde no está activado de forma predeterminada. |
| `openclaw plugins disable bonjour`                   | Deshabilita el anuncio por multidifusión en la LAN al deshabilitar el Plugin incluido.               |
| `OPENCLAW_DISABLE_BONJOUR=1` (o `true`/`yes`/`on`)  | Deshabilita el anuncio por multidifusión en la LAN sin cambiar la configuración del Plugin.                |
| `OPENCLAW_DISABLE_BONJOUR=0` (o `false`/`no`/`off`) | Fuerza la activación del anuncio por multidifusión en la LAN, incluso dentro de los contenedores detectados.        |
| `discovery.mdns.mode`                                | `off` \| `minimal` (predeterminado) \| `full` — consulte los modos anteriores.                         |
| `gateway.bind`                                       | Controla el modo de enlace del Gateway en `~/.openclaw/openclaw.json`.                    |
| `OPENCLAW_SSH_PORT`                                  | Anula el puerto SSH cuando se anuncia `sshPort` (modo completo).                  |
| `OPENCLAW_TAILNET_DNS`                               | Publica una indicación de MagicDNS en TXT cuando está activado el modo completo de mDNS.                  |
| `OPENCLAW_CLI_PATH`                                  | Anula la ruta de la CLI anunciada (modo completo).                                    |

Los hosts macOS inician automáticamente y de forma predeterminada el Plugin de detección en LAN incluido. Cuando el Plugin de Bonjour está activado y `OPENCLAW_DISABLE_BONJOUR` no está establecido, Bonjour realiza anuncios en los hosts normales y se deshabilita automáticamente dentro de los contenedores detectados (máquinas de Docker y Fly.io, y entornos de ejecución de contenedores habituales).

## Documentación relacionada

- Política de detección y selección de transporte: [Detección](/es/gateway/discovery)
- Emparejamiento de Node y aprobaciones: [Emparejamiento del Gateway](/es/gateway/pairing)
