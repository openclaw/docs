---
read_when:
    - Emparejar o reconectar el nodo Android
    - Depurar el descubrimiento o la autenticación del Gateway de Android
    - Duplicar o controlar un dispositivo Android desde una Mac remota
    - Verificación de la paridad del historial de chat entre clientes
summary: 'Aplicación de Android (node): runbook de conexión + superficie de comandos Connect/Chat/Voice/Canvas'
title: Aplicación Android
x-i18n:
    generated_at: "2026-07-05T20:18:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb86ad2c7e4966b110e7e760c537e681c9a71207b06f01ac4daa123b52cdded7
    source_path: platforms/android.md
    workflow: 16
---

<Note>
La aplicación oficial de Android está disponible en [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). Es un nodo complementario y requiere un Gateway de OpenClaw en ejecución. Fuente: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([instrucciones de compilación](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Resumen de compatibilidad

- Rol: aplicación de nodo complementario (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútalo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) para la aplicación, [Primeros pasos](/es/start/getting-started) para el Gateway y luego [Emparejamiento](/es/channels/pairing).
- Gateway: [Runbook](/es/gateway) + [Configuración](/es/gateway/configuration).
  - Protocolos: [Protocolo del Gateway](/es/gateway/protocol) (nodos + plano de control).

El control del sistema (launchd/systemd) reside en el host del Gateway; consulta [Gateway](/es/gateway).

## Reflejar y controlar Android desde un Mac remoto

[scrcpy](https://github.com/Genymobile/scrcpy) refleja una pantalla de Android en una ventana de macOS y
reenvía la entrada de teclado y puntero a través de Android Debug Bridge (ADB). Este es un flujo de trabajo del lado del operador,
separado de la conexión de nodo de OpenClaw. Es útil cuando el dispositivo Android y el
Mac están en ubicaciones distintas, pero comparten una red privada de Tailscale.

### Antes de empezar

- Instala Tailscale en el dispositivo Android y en el Mac, y conecta ambos a la misma tailnet.
- En Android, activa **Opciones de desarrollador** y **Depuración USB**. Android 16 coloca **Depuración
  inalámbrica** en **Ajustes > Sistema > Opciones de desarrollador**. Consulta [Opciones de desarrollador de Android](https://developer.android.com/studio/debug/dev-options).
- Instala scrcpy y ADB en el Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Mantén el dispositivo Android disponible para la primera conexión. Android debe aprobar la clave ADB
  de cada Mac antes de que ese Mac pueda controlar el dispositivo.

### Activar ADB sobre TCP

Para la configuración inicial, conecta el dispositivo Android por USB a un equipo de confianza y aprueba su
aviso de depuración. Luego ejecuta:

```bash
adb devices
adb tcpip 5555
```

Ahora puedes desconectar el USB. Si el puerto 5555 deja de estar en escucha después de reiniciar el dispositivo o restablecer la depuración,
repite este paso de configuración local. Android 11 y versiones posteriores también pueden establecer la confianza inicial con
**Depuración inalámbrica > Emparejar dispositivo con código de emparejamiento** y `adb pair`.

### Permitir solo el Mac controlador

Las tailnets con permisos restrictivos deben permitir explícitamente que el Mac controlador alcance el puerto TCP 5555
en el dispositivo Android. Añade una regla limitada a la política de la tailnet, sustituyendo las direcciones de ejemplo
por las IP estables de Tailscale de los dos dispositivos:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

Consulta [permisos de Tailscale](https://tailscale.com/docs/reference/syntax/grants) para alias de host y otros
selectores. No concedas este puerto a la Internet pública ni lo expongas con Funnel: un cliente ADB autorizado
tiene un control amplio del dispositivo.

### Conectar e iniciar la duplicación

En el Mac remoto:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

El primer `adb connect` desde este Mac muestra un diálogo de autorización en Android. Desbloquea el dispositivo,
confirma la huella digital de la clave y selecciona **Permitir siempre desde este ordenador** solo cuando el Mac sea
de confianza. Una entrada correcta de `adb devices` termina en `device`; `unauthorized` significa que el aviso en el dispositivo
no se ha aprobado.

Una vez que se abre la ventana de scrcpy, úsala directamente o dirígela con una herramienta de automatización de pantalla de macOS como
[Peekaboo](https://peekaboo.sh/). scrcpy transporta la pantalla y la entrada; Tailscale solo proporciona la
ruta de red privada.

### Solución de problemas

- `Connection timed out`: verifica el permiso de tailnet para TCP 5555. Un `tailscale ping` correcto demuestra
  la alcanzabilidad entre pares, no que la política permita este puerto TCP. Prueba con
  `nc -vz <android-tailnet-ip> 5555` desde el Mac.
- `unauthorized`: desbloquea Android y aprueba la clave ADB del Mac remoto, o elimina la estación de trabajo obsoleta
  en **Depuración inalámbrica > Dispositivos emparejados** y vuelve a emparejarla.
- `Connection refused`: vuelve a conectar localmente y ejecuta `adb tcpip 5555` otra vez.
- Más de un dispositivo listado: mantén el argumento explícito `--serial <android-tailnet-ip>:5555`.

Cuando termines, cierra scrcpy y desconecta ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Runbook de conexión

Aplicación de nodo Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y usa emparejamiento de dispositivos (`role: node`).

Para Tailscale o hosts públicos, Android requiere un endpoint seguro:

- Preferido: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También compatible: cualquier otra URL de Gateway `wss://` con un endpoint TLS real
- El texto claro `ws://` sigue siendo compatible en direcciones de LAN privadas / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`)

### Requisitos previos

- Gateway ejecutándose en otra máquina (o accesible mediante SSH).
- El dispositivo/emulador Android puede alcanzar el WebSocket del gateway:
  - Misma LAN con mDNS/NSD, **o**
  - Misma tailnet de Tailscale usando Wide-Area Bonjour / DNS-SD unicast (ver abajo), **o**
  - Host/puerto de gateway manual (alternativa)
- El emparejamiento móvil en tailnet/público **no** usa endpoints de IP de tailnet sin procesar `ws://`. Usa Tailscale Serve u otra URL `wss://` en su lugar.
- La CLI `openclaw` disponible en la máquina del gateway (o mediante SSH), para aprobar solicitudes de emparejamiento.

### 1. Iniciar el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirma en los registros que ves algo como:

- `listening on ws://0.0.0.0:18789`

Para acceso remoto de Android por Tailscale, prefiere Serve/Funnel en lugar de un enlace de tailnet sin procesar:

```bash
openclaw gateway --tailscale serve
```

Esto da a Android un endpoint seguro `wss://` / `https://`. Una configuración simple `gateway.bind: "tailnet"` no basta para el emparejamiento remoto inicial de Android salvo que también termines TLS por separado.

### 2. Verificar el descubrimiento (opcional)

Desde la máquina del gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también configuraste un dominio de descubrimiento de área amplia, compáralo con:

```bash
openclaw gateway discover --json
```

Eso muestra `local.` más el dominio de área amplia configurado en una sola pasada, usando el endpoint de servicio resuelto en lugar de sugerencias solo TXT.

#### Descubrimiento entre redes mediante DNS-SD unicast

El descubrimiento NSD/mDNS de Android no cruza redes. Si el nodo Android y el gateway están en redes distintas pero conectados mediante Tailscale, usa Wide-Area Bonjour / DNS-SD unicast en su lugar. El descubrimiento por sí solo no es suficiente para el emparejamiento de Android por tailnet/público: la ruta descubierta aún necesita un endpoint seguro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (ejemplo `openclaw.internal.`) en el host del gateway y publica registros `_openclaw-gw._tcp`.
2. Configura DNS dividido de Tailscale para el dominio elegido apuntando a ese servidor DNS.

Detalles y configuración de CoreDNS de ejemplo: [Bonjour](/es/gateway/bonjour).

### 3. Conectarse desde Android

En la aplicación Android:

- La aplicación mantiene activa su conexión con el gateway mediante un **servicio en primer plano** (notificación persistente).
- Abre la pestaña **Conectar**.
- Usa el modo **Código de configuración** o **Manual**.
- Si el descubrimiento está bloqueado, usa host/puerto manual en **Controles avanzados**. Para hosts de LAN privada, `ws://` sigue funcionando. Para hosts de Tailscale/públicos, activa TLS y usa un endpoint `wss://` / Tailscale Serve.

Después del primer emparejamiento correcto, Android se reconecta automáticamente al iniciarse: el endpoint manual (si está activado), o en caso contrario el último gateway descubierto (mejor esfuerzo).

### Balizas de presencia activa

Después de que la sesión de nodo autenticada se conecta, y cuando la aplicación pasa a segundo plano mientras el servicio en primer plano sigue conectado, Android llama a `node.event` con `event: "node.presence.alive"`. El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del nodo/dispositivo emparejado solo después de que se conoce la identidad autenticada del dispositivo de nodo.

La aplicación cuenta la baliza como registrada correctamente solo cuando la respuesta del gateway incluye `handled: true`. Los gateways antiguos pueden reconocer `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización duradera de última vista.

### 4. Aprobar el emparejamiento (CLI)

En la máquina del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles de emparejamiento: [Emparejamiento](/es/channels/pairing).

Opcional: si el nodo Android siempre se conecta desde una subred estrictamente controlada, puedes optar por la aprobación automática de nodos por primera vez con CIDR explícitos o IP exactas:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Esto está desactivado de forma predeterminada. Se aplica solo al emparejamiento nuevo con `role: node` sin ámbitos solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

### 5. Verificar que el nodo esté conectado

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat + historial

La pestaña Chat de Android admite selección de sesión (por defecto `main`, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para visualización: se eliminan las etiquetas de directiva en línea, las cargas XML de llamadas de herramienta en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` y variantes truncadas), y los tokens de control del modelo filtrados en ASCII/ancho completo; se omiten las filas de asistente con tokens silenciosos como los exactos `NO_REPLY` / `no_reply`; las filas demasiado grandes pueden reemplazarse por marcadores de posición)
- Enviar: `chat.send`
- Actualizaciones push (mejor esfuerzo): `chat.subscribe` -> `event:"chat"`

### 7. Canvas + cámara

#### Host Canvas del Gateway (recomendado para contenido web)

Para que el nodo muestre HTML/CSS/JS real que el agente pueda editar en disco, apunta el nodo al host de canvas del Gateway.

<Note>
Los nodos cargan canvas desde el servidor HTTP del Gateway (mismo puerto que `gateway.port`, predeterminado `18789`).
</Note>

1. Crea `~/.openclaw/workspace/canvas/index.html` en el host del gateway.
2. Navega el nodo hasta él (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, usa un nombre MagicDNS o una IP de tailnet en lugar de `.local`, por ejemplo `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inyecta un cliente de recarga en vivo en HTML y recarga cuando cambian los archivos. El Gateway también sirve `/__openclaw__/a2ui/`, pero la aplicación Android trata las páginas A2UI remotas como solo renderizado. Los comandos A2UI con capacidad de acción usan la página A2UI incluida y propiedad de la aplicación.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` para volver al andamiaje predeterminado). `canvas.snapshot` devuelve `{ format, base64 }` (`format="jpeg"` predeterminado).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias heredado `canvas.a2ui.pushJSONL`). Estos usan la página A2UI incluida y propiedad de la aplicación para renderizado con capacidad de acción.

Comandos de cámara (solo en primer plano; protegidos por permiso): `camera.snap` (jpg), `camera.clip` (mp4). Consulta [Nodo de cámara](/es/nodes/camera) para parámetros y ayudantes de CLI.

### 8. Voz + superficie ampliada de comandos de Android

- Pestaña Voz: Android tiene dos modos explícitos de captura. **Mic** es una sesión manual de la pestaña Voz que envía cada pausa como un turno de chat y se detiene cuando la aplicación deja de estar en primer plano o el usuario sale de la pestaña Voz. **Talk** es el Talk Mode continuo y sigue escuchando hasta que se desactiva o el nodo se desconecta.
- Talk Mode promociona el servicio en primer plano existente de `connectedDevice` a `connectedDevice|microphone` antes de que empiece la captura y luego lo degrada cuando Talk Mode se detiene. El servicio del nodo declara `FOREGROUND_SERVICE_CONNECTED_DEVICE` con `CHANGE_NETWORK_STATE`; Android 14+ también requiere la declaración `FOREGROUND_SERVICE_MICROPHONE`, el permiso en tiempo de ejecución `RECORD_AUDIO` y el tipo de servicio de micrófono en tiempo de ejecución.
- De forma predeterminada, Android Talk usa reconocimiento de voz nativo, chat de Gateway y `talk.speak` a través del proveedor de Talk de Gateway configurado. La TTS del sistema local solo se usa cuando `talk.speak` no está disponible.
- Android Talk usa retransmisión de Gateway en tiempo real solo cuando `talk.realtime.mode` es `realtime` y `talk.realtime.transport` es `gateway-relay`.
- Voice wake está implementado en el código fuente (`VoiceWakeMode`), pero el runtime de la aplicación distribuida siempre lo fuerza a `off` al conectarse; hoy no hay ningún conmutador visible para el usuario.
- Familias adicionales de comandos de Android (la disponibilidad depende del dispositivo, los permisos y la configuración del usuario):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` solo cuando **Configuración > Capacidades del teléfono > Aplicaciones instaladas** está habilitado; enumera de forma predeterminada las aplicaciones visibles en el lanzador (pasa `includeNonLaunchable` para obtener la lista completa).
  - `notifications.list`, `notifications.actions` (consulta [Reenvío de notificaciones](#notification-forwarding) abajo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Puntos de entrada del asistente

Android permite iniciar OpenClaw desde el disparador del asistente del sistema (Google Assistant). Mantener pulsado el botón de inicio (u otro disparador `ACTION_ASSIST`) abre la aplicación; decir "Hey Google, ask OpenClaw `<prompt>`" coincide con el patrón de consulta App Actions declarado por la aplicación y pasa el prompt al compositor de chat sin enviarlo automáticamente.

Esto usa **App Actions** de Android (capacidad `shortcuts.xml`) declaradas en el manifiesto de la aplicación. No se necesita configuración del lado del Gateway: la intención del asistente la gestiona por completo la aplicación de Android.

<Note>
La disponibilidad de App Actions depende del dispositivo, la versión de Google Play Services y de si el usuario ha configurado OpenClaw como la aplicación de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar notificaciones del dispositivo al Gateway como elementos `node.event`. Esto se configura **en el dispositivo**, en la hoja de configuración de la aplicación, no en la configuración de Gateway/`openclaw.json`.

| Configuración               | Descripción                                                                                                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reenviar eventos de notificación | Conmutador principal. Desactivado de forma predeterminada; requiere que primero se conceda acceso al listener de notificaciones.                                                                                                  |
| Filtro de paquetes          | **Lista de permitidos** (solo se reenvían los ID de paquete enumerados) o **lista de bloqueados** (predeterminado: todos los paquetes excepto los ID enumerados). El propio paquete de OpenClaw siempre se excluye en modo lista de bloqueados para evitar bucles de reenvío. |
| Horas silenciosas           | Ventana local de inicio/fin HH:mm que suprime el reenvío. Desactivada de forma predeterminada; una vez habilitada, usa `22:00`-`07:00` de forma predeterminada.                                                                     |
| Máx. eventos / minuto       | Límite de tasa por dispositivo para notificaciones reenviadas. Valor predeterminado: 20.                                                                                                                                            |
| Clave de sesión de ruta     | Opcional. Fija los eventos de notificación reenviados en una sesión específica en lugar de la ruta de notificaciones predeterminada del dispositivo.                                                                                 |

<Note>
El reenvío de notificaciones requiere el permiso de listener de notificaciones de Android. La aplicación lo solicita durante la configuración.
</Note>

## Relacionado

- [Aplicación iOS](/es/platforms/ios)
- [Nodos](/es/nodes)
- [Solución de problemas de nodos Android](/es/nodes/troubleshooting)
