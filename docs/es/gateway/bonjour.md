---
read_when:
    - Depuración de problemas de detección de Bonjour en macOS/iOS
    - Cambio de los tipos de servicio mDNS, los registros TXT o la experiencia de usuario de detección
summary: Detección mediante Bonjour/mDNS y depuración (señales del Gateway, clientes y modos de fallo comunes)
title: Descubrimiento de Bonjour
x-i18n:
    generated_at: "2026-07-11T23:02:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw puede usar Bonjour (mDNS/DNS-SD) para descubrir un Gateway activo (endpoint WebSocket). La exploración multicast de `local.` es una **función práctica exclusiva de la LAN**: el plugin `bonjour` incluido gestiona la difusión en la LAN, se inicia automáticamente en hosts macOS y requiere activación explícita en Linux, Windows y despliegues de Gateway en contenedores. La misma baliza también puede publicarse mediante un dominio DNS-SD de área amplia configurado para permitir el descubrimiento entre redes. El descubrimiento se realiza con el mejor esfuerzo y **no** sustituye la conectividad mediante SSH o Tailnet.

## Bonjour de área amplia (DNS-SD unicast) mediante Tailscale

Si el nodo y el Gateway están en redes diferentes, el mDNS multicast no puede atravesar ese límite. Mantén la misma experiencia de descubrimiento cambiando a **DNS-SD unicast** ("Bonjour de área amplia") mediante Tailscale:

1. Ejecuta un servidor DNS en el host del Gateway al que se pueda acceder mediante Tailnet.
2. Publica registros DNS-SD para `_openclaw-gw._tcp` bajo una zona dedicada (ejemplo: `openclaw.internal.`).
3. Configura el **DNS dividido** de Tailscale para que el dominio elegido se resuelva mediante ese servidor DNS para los clientes, incluido iOS.

El dominio `openclaw.internal.` anterior es solo un ejemplo: OpenClaw admite cualquier dominio de descubrimiento. Los nodos iOS/Android exploran tanto `local.` como el dominio de área amplia configurado.

### Configuración del Gateway

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
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

Ejecútalo primero sin `--apply` para previsualizar el plan (dominio, ruta del archivo de zona, IP de Tailnet detectada y configuración recomendada) sin instalar nada.

Valídalo desde un equipo conectado a Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Configuración DNS de Tailscale

En la consola de administración de Tailscale:

- Añade un servidor de nombres que apunte a la IP de Tailnet del Gateway (UDP/TCP 53).
- Añade DNS dividido para que el dominio de descubrimiento use ese servidor de nombres.

Una vez que los clientes acepten el DNS de Tailnet, los nodos iOS y el descubrimiento mediante la CLI podrán explorar `_openclaw-gw._tcp` en el dominio de descubrimiento sin multicast.

### Seguridad del listener del Gateway

El puerto WS del Gateway (de forma predeterminada, `18789`) se vincula a loopback de forma predeterminada. Para el acceso mediante LAN/Tailnet, configura explícitamente la vinculación y mantén activada la autenticación. En configuraciones exclusivas de Tailnet, establece `gateway.bind: "tailnet"` en `~/.openclaw/openclaw.json` y reinicia el Gateway (o la aplicación de la barra de menús de macOS).

## Qué se anuncia

Solo el Gateway anuncia `_openclaw-gw._tcp`. La difusión multicast en la LAN procede del plugin `bonjour` incluido cuando está activado; la publicación DNS-SD de área amplia sigue siendo responsabilidad del Gateway.

## Tipos de servicio

- `_openclaw-gw._tcp`: baliza de transporte del Gateway que utilizan los nodos macOS/iOS/Android.

## Claves TXT (indicaciones no secretas)

| Clave                         | Cuándo está presente                                                          |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Siempre.                                                                       |
| `displayName=<friendly name>` | Siempre.                                                                       |
| `lanHost=<hostname>.local`    | Siempre.                                                                       |
| `gatewayPort=<port>`          | Siempre (WS + HTTP del Gateway).                                               |
| `transport=gateway`           | Siempre.                                                                       |
| `gatewayTls=1`                | Solo cuando TLS está activado.                                                 |
| `gatewayTlsSha256=<sha256>`   | Solo cuando TLS está activado y hay una huella digital disponible.             |
| `gatewayDirectReachable=1`    | Solo cuando se puede acceder directamente al Gateway (no únicamente mediante una ruta de retransmisión/proxy). |
| `canvasPort=<port>`           | Solo cuando el host del lienzo está activado; actualmente es igual que `gatewayPort`. |
| `tailnetDns=<magicdns>`       | Solo en el modo mDNS completo; indicación opcional cuando Tailnet está disponible. |
| `sshPort=<port>`              | Solo en el modo completo; se omite en los modos mínimo y desactivado.          |
| `cliPath=<path>`              | Solo en el modo completo; se omite en los modos mínimo y desactivado.          |

Notas de seguridad:

- Los registros TXT de Bonjour/mDNS **no están autenticados**. Los clientes no deben considerar TXT una fuente autoritativa para el enrutamiento.
- Los clientes deben realizar el enrutamiento mediante el endpoint de servicio resuelto (SRV + A/AAAA). Trata `lanHost`, `tailnetDns`, `gatewayPort` y `gatewayTlsSha256` únicamente como indicaciones.
- La selección automática del destino SSH también debe usar el host de servicio resuelto, no indicaciones procedentes únicamente de TXT.
- La fijación de certificados TLS nunca debe permitir que un `gatewayTlsSha256` anunciado sustituya una fijación almacenada previamente.
- Los nodos iOS/Android deben tratar las conexiones directas basadas en descubrimiento como **exclusivas de TLS** y exigir la confirmación explícita del usuario antes de confiar por primera vez en una huella digital.

## Depuración en macOS

Herramientas integradas:

```bash
# Browse instances
dns-sd -B _openclaw-gw._tcp local.

# Resolve one instance (replace <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Si la exploración funciona, pero la resolución falla, normalmente se debe a una política de la LAN o a un problema del solucionador mDNS.

## Depuración en los registros del Gateway

El Gateway escribe un archivo de registro rotativo (mostrado al iniciar como `gateway log file: ...`). Busca las líneas `bonjour:`, especialmente:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

El supervisor considera los estados activos `probing`, `announcing` y los cambios de nombre recientes causados por conflictos como estados en curso. Si el servicio nunca alcanza `announced`, OpenClaw vuelve a crear el anunciador y, tras errores repetidos, desactiva Bonjour para ese proceso del Gateway en lugar de volver a anunciarlo indefinidamente.

Bonjour usa el nombre de host del sistema para el host `.local` anunciado cuando es una etiqueta DNS válida. Si el nombre de host del sistema contiene espacios, guiones bajos u otro carácter no válido para una etiqueta DNS, OpenClaw usa `openclaw.local` como alternativa. Define `OPENCLAW_MDNS_HOSTNAME=<name>` antes de iniciar el Gateway cuando necesites una etiqueta de host explícita.

## Depuración en un nodo iOS

El nodo iOS usa `NWBrowser` para descubrir `_openclaw-gw._tcp`.

Para capturar registros: Ajustes -> Gateway -> Avanzado -> **Registros de depuración del descubrimiento** y, después, Ajustes -> Gateway -> Avanzado -> **Registros de descubrimiento** -> reproduce el problema -> **Copiar**. El registro incluye las transiciones de estado del explorador y los cambios en el conjunto de resultados.

## Cuándo activar Bonjour

Bonjour se inicia automáticamente al arrancar el Gateway con una configuración vacía en hosts macOS, ya que la aplicación local y los nodos iOS/Android cercanos suelen depender del descubrimiento en la misma LAN.

Actívalo explícitamente cuando el descubrimiento automático en la misma LAN resulte útil en Linux, Windows u otro host que no use macOS:

```bash
openclaw plugins enable bonjour
```

Cuando Bonjour está activado, usa `discovery.mdns.mode` para decidir cuántos metadatos TXT publicar; el mismo modo controla las indicaciones TXT opcionales de los registros DNS-SD de área amplia. Modos:

| Modo                | Comportamiento                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (predeterminado) | Solo las claves TXT principales; omite `sshPort`, `cliPath` y `tailnetDns`.                                                                              |
| `full`              | Añade `sshPort`, `cliPath` y `tailnetDns`; úsalo cuando los clientes necesiten esas indicaciones.                                                              |
| `off`               | Suprime el multicast en la LAN sin cambiar la activación del plugin; DNS-SD de área amplia aún puede publicar la baliza mínima cuando `discovery.wideArea.enabled` es `true`. |

## Cuándo desactivar Bonjour

Deja Bonjour desactivado cuando la difusión multicast en la LAN sea innecesaria, no esté disponible o resulte perjudicial; algunos casos habituales son los servidores que no usan macOS, las redes puente de Docker, WSL o una política de red que descarte el multicast mDNS. Se puede seguir accediendo al Gateway mediante su URL publicada, SSH, Tailnet o DNS-SD de área amplia; solo el descubrimiento automático en la LAN deja de ser fiable.

Usa la sobrescritura mediante variable de entorno para problemas específicos del despliegue (es segura para imágenes de Docker, archivos de servicio, scripts de inicio y depuración puntual; desaparece cuando lo hace el entorno):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Usa la configuración del plugin cuando quieras desactivar intencionadamente el plugin de descubrimiento en la LAN incluido para esa configuración de OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Consideraciones de Docker

El plugin Bonjour incluido desactiva automáticamente la difusión multicast en la LAN cuando detecta que se ejecuta en un contenedor y `OPENCLAW_DISABLE_BONJOUR` no está definido. Normalmente, las redes puente de Docker no reenvían el multicast mDNS (`224.0.0.251:5353`) entre el contenedor y la LAN, por lo que anunciar desde el contenedor rara vez permite que el descubrimiento funcione.

Consideraciones:

- Bonjour se inicia automáticamente en hosts macOS y requiere activación explícita en otros sistemas. Dejarlo desactivado no detiene el Gateway; solo omite la difusión multicast en la LAN.
- Desactivar Bonjour no cambia `gateway.bind`; Docker continúa usando `OPENCLAW_GATEWAY_BIND=lan` de forma predeterminada para que funcione el puerto publicado del host.
- Desactivar Bonjour no desactiva DNS-SD de área amplia. Usa el descubrimiento de área amplia o Tailnet cuando el Gateway y el nodo no estén en la misma LAN.
- Reutilizar el mismo `OPENCLAW_CONFIG_DIR` fuera de Docker no conserva la política de desactivación automática del contenedor.
- Define `OPENCLAW_DISABLE_BONJOUR=0` únicamente para redes del host, macvlan u otra red en la que se sepa que puede pasar el multicast mDNS; defínelo como `1` para forzar la desactivación.

## Solución de problemas con Bonjour desactivado

Si un nodo deja de descubrir automáticamente el Gateway después de configurar Docker:

1. Confirma si el Gateway se ejecuta en modo automático, activado forzosamente o desactivado forzosamente:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirma que se puede acceder al propio Gateway mediante el puerto publicado:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa un destino directo cuando Bonjour esté desactivado:
   - Interfaz de control o herramientas locales: `http://127.0.0.1:18789`
   - Clientes de la LAN: `http://<gateway-host>:18789`
   - Clientes entre redes: MagicDNS de Tailnet, IP de Tailnet, túnel SSH o DNS-SD de área amplia

4. Si activaste deliberadamente el plugin Bonjour en Docker y forzaste la difusión con `OPENCLAW_DISABLE_BONJOUR=0`, prueba el multicast desde el host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la exploración no devuelve resultados o los registros del Gateway muestran cancelaciones repetidas del supervisor de ciao, restablece `OPENCLAW_DISABLE_BONJOUR=1` y usa una ruta directa o mediante Tailnet.

## Modos de fallo habituales

- **Bonjour no atraviesa redes**: use Tailnet o SSH.
- **Multidifusión bloqueada**: algunas redes Wi-Fi deshabilitan mDNS.
- **El anunciador queda atascado en sondeo/anuncio**: los hosts con multidifusión bloqueada, los puentes de contenedores, WSL o los cambios frecuentes de interfaz pueden dejar el anunciador ciao en un estado no anunciado. OpenClaw lo reintenta varias veces y, después, deshabilita Bonjour para el proceso actual del Gateway, en lugar de reiniciar indefinidamente el anunciador.
- **Red de puente de Docker**: Bonjour se deshabilita automáticamente en los contenedores detectados. Establezca `OPENCLAW_DISABLE_BONJOUR=0` únicamente para una red de host, macvlan u otra red compatible con mDNS.
- **Suspensión/cambios frecuentes de interfaz**: macOS puede dejar de mostrar temporalmente los resultados de mDNS; vuelva a intentarlo.
- **La exploración funciona, pero la resolución falla**: use nombres de máquina sencillos (evite emojis o signos de puntuación) y, después, reinicie el Gateway. El nombre de la instancia del servicio se deriva del nombre del host, por lo que los nombres excesivamente complejos pueden confundir a algunos resolutores.

## Nombres de instancia con secuencias de escape (`\032`)

Bonjour/DNS-SD suele representar los bytes de los nombres de instancias de servicio mediante secuencias decimales `\DDD` (los espacios se convierten en `\032`). Esto es normal a nivel de protocolo; las interfaces de usuario deben decodificarlas para mostrarlas (iOS usa `BonjourEscapes.decode`).

## Activación, desactivación y configuración

| Ajuste                                               | Efecto                                                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Habilita el Plugin incluido de descubrimiento de LAN en los hosts donde no está habilitado de forma predeterminada.         |
| `openclaw plugins disable bonjour`                   | Deshabilita los anuncios de multidifusión de LAN mediante la desactivación del Plugin incluido.                             |
| `OPENCLAW_DISABLE_BONJOUR=1` (o `true`/`yes`/`on`)   | Deshabilita los anuncios de multidifusión de LAN sin cambiar la configuración del Plugin.                                   |
| `OPENCLAW_DISABLE_BONJOUR=0` (o `false`/`no`/`off`)  | Fuerza la activación de los anuncios de multidifusión de LAN, incluso dentro de los contenedores detectados.                 |
| `discovery.mdns.mode`                                | `off` \| `minimal` (predeterminado) \| `full` — consulte los modos anteriores.                                               |
| `gateway.bind`                                       | Controla el modo de enlace del Gateway en `~/.openclaw/openclaw.json`.                                                       |
| `OPENCLAW_SSH_PORT`                                  | Sustituye el puerto SSH cuando se anuncia `sshPort` (modo completo).                                                         |
| `OPENCLAW_TAILNET_DNS`                               | Publica una indicación de MagicDNS en TXT cuando está habilitado el modo completo de mDNS.                                   |
| `OPENCLAW_CLI_PATH`                                  | Sustituye la ruta de la CLI anunciada (modo completo).                                                                       |

De forma predeterminada, los hosts macOS inician automáticamente el Plugin incluido de descubrimiento de LAN. Cuando el Plugin de Bonjour está habilitado y `OPENCLAW_DISABLE_BONJOUR` no está definido, Bonjour se anuncia en los hosts normales y se deshabilita automáticamente dentro de los contenedores detectados (máquinas de Docker y Fly.io, y entornos de ejecución de contenedores habituales).

## Documentación relacionada

- Política de descubrimiento y selección del transporte: [Descubrimiento](/es/gateway/discovery)
- Emparejamiento de Node y aprobaciones: [Emparejamiento del Gateway](/es/gateway/pairing)
