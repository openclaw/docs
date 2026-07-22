---
read_when:
    - Depuración de problemas de descubrimiento de Bonjour en macOS/iOS
    - Cambiar los tipos de servicio mDNS, los registros TXT o la experiencia de descubrimiento
summary: Detección mediante Bonjour/mDNS y depuración (balizas del Gateway, clientes y modos de fallo comunes)
title: Descubrimiento de Bonjour
x-i18n:
    generated_at: "2026-07-22T10:33:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f43ef71b323b59362655c390a4df621c2571abbe3b2c1cd2728918c6f76d6f99
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw puede usar Bonjour (mDNS/DNS-SD) para descubrir un Gateway activo (endpoint WebSocket). La exploración multicast `local.` es una **comodidad exclusiva de la LAN**: el Plugin `bonjour` incluido gestiona los anuncios en la LAN, se inicia automáticamente en hosts macOS y es opcional en Linux, Windows y despliegues del Gateway en contenedores. La misma baliza también puede publicarse mediante un dominio DNS-SD de área amplia configurado para el descubrimiento entre redes. El descubrimiento se realiza con el mejor esfuerzo y **no** sustituye la conectividad mediante SSH o Tailnet.

## Bonjour de área amplia (DNS-SD unicast) mediante Tailscale

Si el Node y el Gateway están en redes diferentes, el mDNS multicast no puede atravesar el límite. Se puede mantener la misma experiencia de descubrimiento cambiando a **DNS-SD unicast** («Bonjour de área amplia») mediante Tailscale:

1. Ejecute un servidor DNS en el host del Gateway al que se pueda acceder mediante Tailnet.
2. Publique registros DNS-SD para `_openclaw-gw._tcp` en una zona dedicada (ejemplo: `openclaw.internal.`).
3. Configure el **DNS dividido** de Tailscale para que el dominio elegido se resuelva mediante ese servidor DNS para los clientes, incluido iOS.

El valor `openclaw.internal.` anterior es solo un ejemplo: OpenClaw admite cualquier dominio de descubrimiento. Los Nodes iOS/Android exploran tanto `local.` como el dominio de área amplia configurado.

### Configuración del Gateway

```json5
{
  gateway: { bind: "tailnet" }, // solo Tailnet (recomendado)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` también acepta la variable de entorno `OPENCLAW_WIDE_AREA_DOMAIN` como alternativa cuando no está definido.

### Configuración única del servidor DNS (host del Gateway, solo macOS)

```bash
openclaw dns setup --apply
```

Este comando solo está disponible en macOS y requiere Homebrew y una conexión de Tailscale activa. Instala CoreDNS (`brew install coredns`) y lo configura para:

- escuchar en el puerto 53 únicamente en las interfaces de Tailscale del Gateway
- servir el dominio elegido (ejemplo: `openclaw.internal.`) desde `~/.openclaw/dns/<domain>.db`

Ejecútelo primero sin `--apply` para previsualizar el plan (dominio, ruta del archivo de zona, IP de Tailnet detectada y configuración recomendada) sin instalar nada.

Valide desde una máquina conectada a Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configuración de DNS de Tailscale

En la consola de administración de Tailscale:

- Añada un servidor de nombres que apunte a la IP de Tailnet del Gateway (UDP/TCP 53).
- Añada DNS dividido para que el dominio de descubrimiento use ese servidor de nombres.

Una vez que los clientes acepten el DNS de Tailnet, los Nodes iOS y el descubrimiento de la CLI podrán explorar `_openclaw-gw._tcp` en el dominio de descubrimiento sin multicast.

### Seguridad del listener del Gateway

El puerto WS del Gateway (valor predeterminado: `18789`) se vincula de forma predeterminada a la interfaz de bucle invertido. Para el acceso mediante LAN/Tailnet, vincúlelo explícitamente y mantenga habilitada la autenticación. Para configuraciones exclusivas de Tailnet, establezca `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json` y reinicie el Gateway (o la aplicación de la barra de menús de macOS).

## Qué se anuncia

Solo el Gateway anuncia `_openclaw-gw._tcp`. Los anuncios multicast en la LAN proceden del Plugin `bonjour` incluido cuando está habilitado; la publicación DNS-SD de área amplia sigue siendo responsabilidad del Gateway.

## Tipos de servicio

- `_openclaw-gw._tcp` - baliza de transporte del Gateway, utilizada por Nodes macOS/iOS/Android.

## Claves TXT (indicaciones no secretas)

| Clave                           | Cuándo está presente                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Siempre.                                                                        |
| `displayName=<friendly name>` | Siempre.                                                                        |
| `lanHost=<hostname>.local`    | Siempre.                                                                        |
| `gatewayPort=<port>`          | Siempre (WS + HTTP del Gateway).                                                    |
| `transport=gateway`           | Siempre.                                                                        |
| `gatewayTls=1`                | Solo cuando TLS está habilitado.                                                      |
| `gatewayTlsSha256=<sha256>`   | Solo cuando TLS está habilitado y hay una huella digital disponible.                       |
| `gatewayDirectReachable=1`    | Solo cuando se puede acceder directamente al Gateway (no únicamente mediante una ruta de retransmisión/proxy). |
| `canvasPort=<port>`           | Solo cuando el host del lienzo está habilitado; actualmente es igual que `gatewayPort`.     |
| `tailnetDns=<magicdns>`       | Solo en el modo completo de mDNS; indicación opcional cuando Tailnet está disponible.                  |
| `sshPort=<port>`              | Solo en el modo completo; se omite en los modos mínimo y desactivado.                              |
| `cliPath=<path>`              | Solo en el modo completo; se omite en los modos mínimo y desactivado.                              |

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes no deben considerar TXT una fuente de enrutamiento autoritativa.
- Los clientes deben enrutar mediante el endpoint de servicio resuelto (SRV + A/AAAA). Considere `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` únicamente como indicaciones.
- La selección automática del destino SSH también debe usar el host de servicio resuelto, no únicamente indicaciones TXT.
- La fijación de TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sustituya una fijación almacenada previamente.
- Los Nodes iOS/Android deben considerar las conexiones directas basadas en descubrimiento **exclusivas de TLS** y exigir la confirmación explícita del usuario antes de confiar en una huella digital por primera vez.

## Depuración en macOS

Herramientas integradas:

```bash
# Explorar instancias
dns-sd -B _openclaw-gw._tcp local.

# Resolver una instancia (sustituya <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Si la exploración funciona, pero la resolución falla, normalmente se trata de un problema con una política de la LAN o con el sistema de resolución mDNS.

## Depuración en los registros del Gateway

El Gateway escribe un archivo de registro rotativo (se muestra durante el inicio como `gateway log file: ...`). Busque líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw inicia cada servicio Bonjour una sola vez y deja el sondeo, los reintentos, la resolución de conflictos de nombres y la republicación tras cambios de interfaz al respondedor mDNS. Esto evita intentos de publicación superpuestos durante las fluctuaciones normales de la red. Los mensajes internos repetidos de autosondeo se suprimen para impedir que saturen el registro del Gateway.

Cuando varios Gateways de OpenClaw anuncian desde el mismo host, Bonjour puede añadir sufijos como `(2)` o `(3)` para que los nombres de las instancias de servicio sean únicos. Esos sufijos forman parte de la resolución normal de conflictos y no indican una supervisión OCM duplicada.

Bonjour usa el nombre de host del sistema para el host `.local` anunciado cuando es una etiqueta DNS válida. Si el nombre de host del sistema contiene espacios, guiones bajos u otro carácter no válido para una etiqueta DNS, OpenClaw utiliza `openclaw.local` como alternativa. Establezca `OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar el Gateway cuando se necesite una etiqueta de host explícita.

## Depuración en el Node iOS

El Node iOS utiliza `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar registros: Settings -> Gateway -> Advanced -> **Discovery Debug Logs** y, después, Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduzca el problema -> **Copy**. El registro incluye las transiciones de estado del explorador y los cambios en el conjunto de resultados.

## Cuándo habilitar Bonjour

Bonjour se inicia automáticamente cuando el Gateway arranca con una configuración vacía en hosts macOS, ya que la aplicación local y los Nodes iOS/Android cercanos suelen depender del descubrimiento en la misma LAN.

Habilítelo explícitamente cuando el descubrimiento automático en la misma LAN sea útil en Linux, Windows u otro host que no sea macOS:

```bash
openclaw plugins enable bonjour
```

Cuando está habilitado, Bonjour usa `discovery.mdns.mode` para decidir cuántos metadatos TXT publicar; el mismo modo controla las indicaciones TXT opcionales de los registros DNS-SD de área amplia. Modos:

| Modo                | Comportamiento                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (predeterminado) | Solo las claves TXT principales; omite `sshPort`, `cliPath`, `tailnetDns`.                                                                            |
| `full`              | Añade `sshPort`, `cliPath`, `tailnetDns`; úselo cuando los clientes necesiten esas indicaciones.                                                             |
| `off`               | Suprime el multicast de la LAN sin cambiar la habilitación del Plugin; el DNS-SD de área amplia puede seguir publicándose cuando se establece `discovery.wideArea.domain`. |

## Cuándo deshabilitar Bonjour

Mantenga Bonjour deshabilitado cuando los anuncios multicast en la LAN sean innecesarios, no estén disponibles o resulten perjudiciales; algunos casos habituales son los servidores que no usan macOS, las redes puente de Docker, WSL o una política de red que descarte el multicast mDNS. El Gateway sigue siendo accesible mediante su URL publicada, SSH, Tailnet o DNS-SD de área amplia; solo el descubrimiento automático en la LAN deja de ser fiable.

Use la anulación mediante variable de entorno para problemas específicos del despliegue (es segura para imágenes de Docker, archivos de servicio, scripts de inicio y depuraciones puntuales; desaparece cuando desaparece el entorno):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Use la configuración del Plugin cuando se quiera desactivar intencionadamente el Plugin de descubrimiento en la LAN incluido para esa configuración de OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Consideraciones de Docker

El Plugin Bonjour incluido deshabilita automáticamente los anuncios multicast en la LAN dentro de contenedores detectados cuando `OPENCLAW_DISABLE_BONJOUR` no está definido. Las redes puente de Docker normalmente no reenvían el multicast mDNS (`224.0.0.251:5353`) entre el contenedor y la LAN, por lo que anunciar desde el contenedor rara vez hace que funcione el descubrimiento.

Consideraciones:

- Bonjour se inicia automáticamente en hosts macOS y es opcional en los demás. Mantenerlo deshabilitado no detiene el Gateway; solo omite los anuncios multicast en la LAN.
- Deshabilitar Bonjour no cambia `gateway.bind`; Docker sigue usando `OPENCLAW_GATEWAY_BIND=lan` de forma predeterminada para que funcione el puerto publicado del host.
- Deshabilitar Bonjour no deshabilita el DNS-SD de área amplia. Use el descubrimiento de área amplia o Tailnet cuando el Gateway y el Node no estén en la misma LAN.
- Reutilizar el mismo `OPENCLAW_CONFIG_DIR` fuera de Docker no conserva la política de deshabilitación automática del contenedor.
- Establezca `OPENCLAW_DISABLE_BONJOUR=0` únicamente para redes del host, macvlan u otra red en la que se sepa que pasa el multicast mDNS; establézcalo en `1` para forzar la deshabilitación.

## Solución de problemas con Bonjour deshabilitado

Si un Node deja de descubrir automáticamente el Gateway después de configurar Docker:

1. Confirme si el Gateway se ejecuta en modo automático, forzado como activado o forzado como desactivado:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirme que se puede acceder al propio Gateway mediante el puerto publicado:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Use un destino directo cuando Bonjour esté deshabilitado:
   - Interfaz de control o herramientas locales: `http://127.0.0.1:18789`
   - Clientes de la LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS de Tailnet, IP de Tailnet, túnel SSH o DNS-SD de área amplia

4. Si habilitó deliberadamente el Plugin Bonjour en Docker y forzó los anuncios con `OPENCLAW_DISABLE_BONJOUR=0`, pruebe el multicast desde el host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la exploración no devuelve resultados o los registros del Gateway muestran fallos repetidos de sondeo de ciao, restaure `OPENCLAW_DISABLE_BONJOUR=1` y use una ruta directa o mediante Tailnet.

## Modos de fallo habituales

- **Bonjour no atraviesa redes**: use Tailnet o SSH.
- **Multidifusión bloqueada**: algunas redes Wi-Fi deshabilitan mDNS.
- **El anunciador se queda bloqueado durante el sondeo o el anuncio**: los hosts con la multidifusión bloqueada, los puentes de contenedores, WSL o los cambios frecuentes de interfaz pueden dejar el respondedor en un estado no anunciado. El Gateway sigue disponible mediante rutas directas, SSH, Tailnet o DNS-SD de área amplia; deshabilite Bonjour en la LAN con `discovery.mdns.mode: "off"` o `OPENCLAW_DISABLE_BONJOUR=1` cuando la multidifusión no esté disponible.
- **Redes puente de Docker**: Bonjour se deshabilita automáticamente en los contenedores detectados. Configure `OPENCLAW_DISABLE_BONJOUR=0` solo para una red de host, macvlan u otra red compatible con mDNS.
- **Suspensión o cambios frecuentes de interfaz**: macOS puede dejar de mostrar temporalmente los resultados de mDNS; vuelva a intentarlo.
- **La exploración funciona, pero la resolución falla**: use nombres de máquina sencillos (evite emojis o signos de puntuación) y reinicie el Gateway. El nombre de la instancia del servicio se deriva del nombre del host, por lo que los nombres demasiado complejos pueden confundir a algunos resolutores.

## Nombres de instancia con secuencias de escape (`\032`)

Bonjour/DNS-SD suele representar bytes mediante secuencias decimales `\DDD` en los nombres de instancia de servicio (los espacios se convierten en `\032`). Esto es normal en el nivel del protocolo; las interfaces de usuario deben decodificarlos para mostrarlos (iOS usa `BonjourEscapes.decode`).

## Habilitación, deshabilitación y configuración

| Configuración                                        | Efecto                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Habilita el plugin de detección de LAN incluido en los hosts donde no está habilitado de forma predeterminada. |
| `openclaw plugins disable bonjour`                   | Deshabilita los anuncios de multidifusión en la LAN al deshabilitar el plugin incluido. |
| `OPENCLAW_DISABLE_BONJOUR=1` (o `true`/`yes`/`on`)  | Deshabilita los anuncios de multidifusión en la LAN sin cambiar la configuración del plugin. |
| `OPENCLAW_DISABLE_BONJOUR=0` (o `false`/`no`/`off`) | Fuerza la activación de los anuncios de multidifusión en la LAN, incluso dentro de los contenedores detectados. |
| `discovery.mdns.mode`                                | `off` \| `minimal` (predeterminado) \| `full` — consulte los modos anteriores. |
| `gateway.bind`                                       | Controla el modo de vinculación del Gateway en `~/.openclaw/openclaw.json`. |
| `OPENCLAW_SSH_PORT`                                  | Sustituye el puerto SSH cuando se anuncia `sshPort` (modo completo). |
| `OPENCLAW_TAILNET_DNS`                               | Publica una indicación de MagicDNS en TXT cuando está habilitado el modo completo de mDNS. |
| `OPENCLAW_CLI_PATH`                                  | Sustituye la ruta de la CLI anunciada (modo completo). |

Los hosts macOS inician automáticamente y de forma predeterminada el plugin de detección de LAN incluido. Cuando el plugin de Bonjour está habilitado y `OPENCLAW_DISABLE_BONJOUR` no está configurado, Bonjour se anuncia en hosts normales y se deshabilita automáticamente dentro de los contenedores detectados (Docker, máquinas de Fly.io y entornos de ejecución de contenedores habituales).

## Documentación relacionada

- Política de detección y selección de transporte: [Detección](/es/gateway/discovery)
- Emparejamiento de Node y aprobaciones: [Emparejamiento del Gateway](/es/gateway/pairing)
