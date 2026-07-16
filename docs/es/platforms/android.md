---
read_when:
    - Emparejamiento o reconexión del nodo Android
    - Depuración del descubrimiento o la autenticación del Gateway en Android
    - Duplicar o controlar un dispositivo Android desde un Mac remoto
    - Verificación de la paridad del historial de chat entre clientes
summary: 'Aplicación para Android (Node): guía operativa de conexión + conjunto de comandos de Conectar/Chat/Voz/Canvas'
title: Aplicación para Android
x-i18n:
    generated_at: "2026-07-16T11:44:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
La aplicación oficial para Android está disponible en [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) y como APK independiente firmado en las [versiones de GitHub](https://github.com/openclaw/openclaw/releases) compatibles. Es un Node complementario y requiere un Gateway de OpenClaw en ejecución. Código fuente: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([instrucciones de compilación](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Resumen de compatibilidad

- Función: aplicación de Node complementario (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútelo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) o `OpenClaw-Android.apk` de una [versión de GitHub](https://github.com/openclaw/openclaw/releases) compatible, [Primeros pasos](/es/start/getting-started) para el Gateway y, después, [Emparejamiento](/es/channels/pairing).
- Gateway: [Guía operativa](/es/gateway) + [Configuración](/es/gateway/configuration).
  - Protocolos: [Protocolo del Gateway](/es/gateway/protocol) (Nodes + plano de control).

El control del sistema (launchd/systemd) reside en el host del Gateway; consulte [Gateway](/es/gateway).

## Instalación fuera de Google Play

Las versiones finales y de corrección habituales de GitHub incluyen un `OpenClaw-Android.apk` universal y `OpenClaw-Android-SHA256SUMS.txt`. El APK se compila a partir de la etiqueta de la versión, se firma con la clave de publicación de OpenClaw para Android e incluye procedencia de GitHub Actions.

Elija una [versión](https://github.com/openclaw/openclaw/releases) que incluya ambos recursos y, después, descargue y verifique esa etiqueta exacta antes de realizar la instalación manual:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Las instalaciones desde Google Play y mediante el APK independiente utilizan canales de actualización distintos y pueden tener identidades de firma diferentes. Android puede exigir que se desinstale la aplicación existente antes de cambiar de canal, lo que elimina los datos locales de la aplicación. Manténgase en un mismo canal para las actualizaciones normales.
</Warning>

## Duplicar y controlar Android desde un Mac remoto

[scrcpy](https://github.com/Genymobile/scrcpy) duplica una pantalla de Android en una ventana de macOS y
reenvía la entrada del teclado y del puntero mediante Android Debug Bridge (ADB). Este es un flujo de trabajo
del lado del operador, independiente de la conexión del Node de OpenClaw. Resulta útil cuando el dispositivo
Android y el Mac están en ubicaciones diferentes, pero comparten una red privada de Tailscale.

### Antes de comenzar

- Instale Tailscale en el dispositivo Android y en el Mac, y conecte ambos a la misma tailnet.
- En Android, active **Developer options** y **USB debugging**. Android 16 sitúa **Wireless
  debugging** en **Settings > System > Developer options**. Consulte las [opciones para desarrolladores de
  Android](https://developer.android.com/studio/debug/dev-options).
- Instale scrcpy y ADB en el Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Mantenga disponible el dispositivo Android durante la primera conexión. Android debe aprobar la clave ADB
  de cada Mac antes de que este pueda controlar el dispositivo.

### Activar ADB mediante TCP

Para la configuración inicial, conecte el dispositivo Android por USB a un equipo de confianza y apruebe su
solicitud de depuración. Después, ejecute:

```bash
adb devices
adb tcpip 5555
```

Ahora puede desconectar el USB. Si el puerto 5555 deja de escuchar después de reiniciar el dispositivo o restablecer la depuración,
repita este paso de configuración local. Android 11 y versiones posteriores también pueden establecer la confianza inicial mediante
**Wireless debugging > Pair device with pairing code** y `adb pair`.

### Permitir únicamente el Mac controlador

Las tailnets con permisos restrictivos deben permitir explícitamente que el Mac controlador acceda al puerto TCP 5555
del dispositivo Android. Añada una regla limitada a la política de la tailnet, sustituyendo las direcciones de ejemplo
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

Consulte [permisos de Tailscale](https://tailscale.com/docs/reference/syntax/grants) para conocer los alias de host y otros
selectores. No habilite este puerto para la Internet pública ni lo exponga mediante Funnel: un cliente ADB
autorizado tiene un amplio control sobre el dispositivo.

### Conectarse e iniciar la duplicación

En el Mac remoto:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

La primera ejecución de `adb connect` desde este Mac muestra un cuadro de autorización en Android. Desbloquee el dispositivo,
confirme la huella digital de la clave y seleccione **Always allow from this computer** únicamente si el Mac es
de confianza. Una entrada `adb devices` correcta termina en `device`; `unauthorized` significa que la solicitud
del dispositivo aún no se ha aprobado.

Una vez abierta la ventana de scrcpy, úsela directamente o selecciónela como destino con una herramienta de automatización de pantalla de macOS,
como [Peekaboo](https://peekaboo.sh/). scrcpy transmite la pantalla y la entrada; Tailscale únicamente proporciona la
ruta de red privada.

### Solución de problemas

- `Connection timed out`: compruebe el permiso de la tailnet para TCP 5555. Que `tailscale ping` se complete correctamente demuestra
  la conectividad con el par, no que la política permita este puerto TCP. Realice una prueba con
  `nc -vz <android-tailnet-ip> 5555` desde el Mac.
- `unauthorized`: desbloquee Android y apruebe la clave ADB del Mac remoto, o elimine la estación de trabajo obsoleta
  en **Wireless debugging > Paired devices** y vuelva a emparejarla.
- `Connection refused`: vuelva a conectarse localmente y ejecute `adb tcpip 5555` de nuevo.
- Hay más de un dispositivo en la lista: mantenga el argumento explícito `--serial <android-tailnet-ip>:5555`.

Cuando termine, cierre scrcpy y desconecte ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Guía operativa de conexión

Aplicación del Node de Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y utiliza el emparejamiento de dispositivos (`role: node`).

Para Tailscale o hosts públicos, Android requiere un extremo seguro:

- Opción preferida: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También se admite: cualquier otra URL `wss://` del Gateway con un extremo TLS real
- El tráfico sin cifrar `ws://` sigue siendo compatible en direcciones de LAN privadas / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`); la configuración fuera del bucle invertido utiliza automáticamente acceso limitado de operador

### Requisitos previos

- Gateway en ejecución en otra máquina (o accesible mediante SSH).
- El dispositivo o emulador Android puede acceder al WebSocket del Gateway:
  - En la misma LAN con mDNS/NSD, **o**
  - En la misma tailnet de Tailscale mediante Bonjour de área extensa / DNS-SD unidifusión (consulte más adelante), **o**
  - Host/puerto del Gateway manual (alternativa)
- El emparejamiento móvil mediante una tailnet o un host público **no** utiliza extremos `ws://` con la IP de la tailnet sin procesar. Utilice Tailscale Serve u otra URL `wss://`.
- La CLI `openclaw` está disponible en la máquina del Gateway (o mediante SSH) para aprobar solicitudes de emparejamiento.

### 1. Iniciar el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirme que en los registros aparece algo similar a:

- `listening on ws://0.0.0.0:18789`

Para acceder de forma remota desde Android mediante Tailscale, utilice preferentemente Serve/Funnel en lugar de vincular directamente una tailnet:

```bash
openclaw gateway --tailscale serve
```

Esto proporciona a Android un extremo seguro `wss://` / `https://`. Una configuración básica `gateway.bind: "tailnet"` no es suficiente para el primer emparejamiento remoto con Android, salvo que TLS también se termine por separado.

### 2. Verificar la detección (opcional)

Desde la máquina del Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas sobre depuración: [Bonjour](/es/gateway/bonjour).

Si también configuró un dominio de detección de área extensa, compárelo con:

```bash
openclaw gateway discover --json
```

Esto muestra `local.` junto con el dominio de área extensa configurado en una sola ejecución y utiliza el extremo resuelto del servicio en lugar de limitarse a las indicaciones TXT.

#### Detección entre redes mediante DNS-SD unidifusión

La detección NSD/mDNS de Android no atraviesa redes. Si el Node de Android y el Gateway se encuentran en redes diferentes, pero están conectados mediante Tailscale, utilice Bonjour de área extensa / DNS-SD unidifusión. La detección por sí sola no basta para emparejar Android mediante una tailnet o un host público: la ruta detectada sigue necesitando un extremo seguro (`wss://` o Tailscale Serve):

1. Configure una zona DNS-SD (por ejemplo, `openclaw.internal.`) en el host del Gateway y publique registros `_openclaw-gw._tcp`.
2. Configure el DNS dividido de Tailscale para que el dominio elegido apunte a ese servidor DNS.

Detalles y ejemplo de configuración de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3. Conectarse desde Android

En la aplicación para Android:

- La aplicación mantiene activa su conexión con el Gateway mediante un **servicio en primer plano** (notificación persistente).
- Abra la pestaña **Connect**.
- Utilice el modo **Setup Code** o **Manual**.
- Si la detección está bloqueada, utilice el host/puerto manual en **Advanced controls**. Para hosts de LAN privada, `ws://` sigue funcionando. Para hosts de Tailscale o públicos, active TLS y utilice un extremo `wss://` / Tailscale Serve.

Después del primer emparejamiento correcto, Android se vuelve a conectar automáticamente al iniciarse con el Gateway emparejado activo (se intenta cuando se trata de Gateways detectados, que deben estar visibles en la red).

Los códigos oficiales de configuración conectan Android como Node y conceden acceso completo de operador al Gateway
de forma predeterminada mediante `wss://`. La configuración `ws://` sin cifrar y fuera del bucle invertido
utiliza automáticamente acceso limitado para proteger el token de portador. **Settings → Gateway**
muestra el acceso **Full** o **Limited**. Para una conexión limitada, configure
`wss://` o Tailscale Serve, genere un nuevo código de acceso completo en la interfaz de control o
con `openclaw qr`, después escanéelo o péguelo en esa página y vuelva a conectarse. Los operadores
que deseen el perfil reducido pueden seleccionar **Limited access** en la interfaz de control o ejecutar
`openclaw qr --limited`.

### Varios Gateways

La aplicación mantiene un registro de todos los Gateways con los que se ha emparejado, por lo que puede cambiar entre ellos sin volver a realizar el emparejamiento:

- **Settings -> Gateways** muestra los Gateways emparejados e indica cuál está activo. Toque una entrada para cambiar; la aplicación cierra las sesiones actuales y vuelve a conectarse al Gateway seleccionado.
- La pestaña **Connect** muestra un selector rápido cuando hay más de un Gateway emparejado.
- Las credenciales, los tokens del dispositivo, la confianza TLS, el historial de chat y los mensajes sin conexión en cola se almacenan por Gateway. Al cambiar, nunca se mezcla el estado entre Gateways, y los mensajes puestos en cola mientras no había conexión solo se entregan al Gateway para el que se escribieron.
- **Forget** elimina la entrada de registro de un Gateway junto con sus credenciales, tokens del dispositivo, anclaje TLS y chats almacenados en caché.

### Señales de presencia activa

Después de conectarse la sesión autenticada del Node y cuando la aplicación pasa a segundo plano mientras el servicio en primer plano sigue conectado, Android llama a `node.event` con `event: "node.presence.alive"`. El Gateway lo registra como `lastSeenAtMs`/`lastSeenReason` en los metadatos del Node/dispositivo emparejado únicamente después de conocer la identidad autenticada del dispositivo Node.

La aplicación considera que la señal se ha registrado correctamente solo cuando la respuesta del Gateway incluye `handled: true`. Los Gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización persistente de la última actividad.

### 4. Aprobar el emparejamiento (CLI)

En la máquina del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles del emparejamiento: [Emparejamiento](/es/channels/pairing).

Opcional: si el Node Android siempre se conecta desde una subred estrictamente controlada, se puede habilitar la aprobación automática de la primera vinculación del Node mediante CIDR explícitos o direcciones IP exactas:

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

Esta opción está deshabilitada de forma predeterminada. Solo se aplica al emparejamiento nuevo de `role: node` sin ámbitos solicitados. El emparejamiento de operadores o navegadores y cualquier cambio de rol, ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

### 5. Verificar que el Node esté conectado

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat e historial

La pestaña Chat de Android permite seleccionar la sesión (de forma predeterminada, `main`, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para su visualización: se eliminan las etiquetas de directivas insertadas, las cargas útiles XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` y sus variantes truncadas) y los tokens de control del modelo filtrados en ASCII o de ancho completo; se omiten las filas del asistente con tokens silenciosos, como las coincidencias exactas de `NO_REPLY` / `no_reply`; las filas demasiado grandes pueden sustituirse por marcadores de posición)
- Envío: `chat.send`
- Envío duradero: cada envío (texto, imágenes seleccionadas y notas de voz) se registra en una bandeja de salida por Gateway en el dispositivo antes de cualquier intento de conexión a la red, por lo que el cierre de la aplicación no puede provocar la pérdida de entradas enviadas. Los envíos en cola mientras no hay conexión se entregan en orden al reconectarse, con claves de idempotencia estables, y solo se retiran cuando el turno aparece en el `chat.history` canónico; una mera confirmación no se considera prueba de entrega. Los resultados ambiguos (confirmación perdida, aplicación cerrada durante el envío o reinicio del Gateway antes de escribir la transcripción) se muestran como filas visibles con las opciones explícitas **Reintentar**/**Eliminar**, en lugar de volver a enviarse automáticamente. Los comandos con barra nunca se reproducen automáticamente tras una reconexión; quedan pendientes para que se reintenten de forma explícita. La cola está limitada (50 mensajes y 48 MB de datos adjuntos por Gateway) y las filas no enviadas caducan después de 48 horas. Los borradores del editor que nunca se enviaron no persisten al finalizar el proceso.
- Actualizaciones push (de mejor esfuerzo): `chat.subscribe` -> `event:"chat"`
- Escuchar: mantenga pulsado un mensaje del asistente y seleccione **Escuchar** para oírlo; el audio se genera mediante el `tts.speak` del Gateway con la cadena de proveedores TTS configurada, y se utiliza el TTS del sistema del dispositivo cuando el Gateway no puede generar el audio. La reproducción se detiene al cambiar de sesión, iniciar un chat nuevo, enviar la aplicación a segundo plano o cerrar el chat.

### 7. Canvas y cámara

#### Host de Canvas del Gateway (recomendado para contenido web)

Para que el Node muestre HTML/CSS/JS real que el agente pueda editar en el disco, diríjalo al host de Canvas del Gateway.

<Note>
Los Nodes cargan Canvas desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, de forma predeterminada `18789`).
</Note>

1. Cree `~/.openclaw/workspace/canvas/index.html` en el host del Gateway.
2. Dirija el Node a él (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, utilice un nombre MagicDNS o una IP de tailnet en lugar de `.local`; por ejemplo, `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inserta un cliente de recarga en vivo en el HTML y vuelve a cargarlo cuando cambian los archivos. El Gateway también sirve `/__openclaw__/a2ui/`, pero la aplicación de Android trata las páginas A2UI remotas como contenido de solo representación. Los comandos A2UI con acciones utilizan la página A2UI incluida y propiedad de la aplicación.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (utilice `{"url":""}` o `{"url":"/"}` para volver a la estructura predeterminada). `canvas.snapshot` devuelve `{ format, base64 }` (de forma predeterminada, `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL`, alias heredado). Estos utilizan la página A2UI incluida y propiedad de la aplicación para la representación con acciones.

Comandos de cámara (solo en primer plano; sujetos a permisos): `camera.snap` (jpg), `camera.clip` (mp4). Consulte [Node de cámara](/es/nodes/camera) para conocer los parámetros y los asistentes de la CLI.

### 8. Voz y superficie ampliada de comandos de Android

- Pestaña Voz: Android tiene dos modos explícitos de captura. **Mic** es una sesión manual de la pestaña Voz que envía cada pausa como un turno de chat y se detiene cuando la aplicación deja de estar en primer plano o el usuario sale de la pestaña Voz. **Talk** es el modo Talk continuo y sigue escuchando hasta que se desactiva o el Node se desconecta.
- El modo Talk promueve el servicio en primer plano existente de `connectedDevice` a `connectedDevice|microphone` antes de iniciar la captura y lo degrada cuando se detiene el modo Talk. El servicio del Node declara `FOREGROUND_SERVICE_CONNECTED_DEVICE` con `CHANGE_NETWORK_STATE`; Android 14+ también requiere la declaración `FOREGROUND_SERVICE_MICROPHONE`, la concesión en tiempo de ejecución `RECORD_AUDIO` y el tipo de servicio de micrófono en tiempo de ejecución.
- De forma predeterminada, Talk de Android utiliza el reconocimiento de voz nativo, el chat del Gateway y `talk.speak` mediante el proveedor de Talk configurado en el Gateway. El TTS del sistema local solo se utiliza cuando `talk.speak` no está disponible.
- Talk de Android utiliza la retransmisión en tiempo real del Gateway solo cuando `talk.realtime.mode` es `realtime` y `talk.realtime.transport` es `gateway-relay`.
- Android no anuncia la capacidad `voiceWake`. Utilice **Mic** o **Talk** para la entrada de voz.
- Familias adicionales de comandos de Android (su disponibilidad depende del dispositivo, los permisos y los ajustes del usuario):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` solo cuando **Settings > Phone Capabilities > Installed Apps** está habilitado; enumera de forma predeterminada las aplicaciones visibles en el iniciador (pase `includeNonLaunchable` para obtener la lista completa).
  - `notifications.list`, `notifications.actions` (consulte [Reenvío de notificaciones](#notification-forwarding) más adelante)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Archivos del espacio de trabajo (solo lectura)

La vista general de Inicio incluye una tarjeta **Archivos** que permite explorar el espacio de trabajo del agente activo mediante los RPC de solo lectura `agents.workspace.list` / `agents.workspace.get` del Gateway: navegación por directorios, vistas previas de texto e imágenes y exportación mediante la hoja para compartir de Android. No hay operaciones de escritura y el Gateway limita el tamaño de las vistas previas.

## Revisar aprobaciones de comandos

Una conexión de operador con `operator.admin`, o una conexión
`operator.approvals` emparejada y dirigida explícitamente por el Gateway, puede revisar
las solicitudes de ejecución pendientes en **Settings -> Approvals**. La aplicación carga el
registro de aprobación depurado del Gateway antes de habilitar sus botones, muestra cualquier
advertencia de seguridad y las decisiones exactas que ofrece la solicitud, y envía
el ID de aprobación y el tipo de propietario al Gateway.

El estado de aprobación se comparte con la interfaz de control y las superficies de chat compatibles. La
primera respuesta confirmada prevalece; Android muestra ese resultado canónico incluso cuando
otra superficie haya respondido primero. Si se pierde una respuesta de resolución o el Gateway
se desconecta, la aplicación mantiene la acción bloqueada y vuelve a consultar la aprobación
antes de ofrecer otra decisión.

Los Gateways anteriores a los métodos de aprobación unificados recurren a los métodos
específicos de ejecución distribuidos. La revisión pendiente sigue funcionando, pero el estado de terminal
conservado y el resultado más completo entre superficies requieren un Gateway actualizado.

## Puntos de entrada del asistente

Android permite iniciar OpenClaw desde el activador del asistente del sistema (Google Assistant). Al mantener pulsado el botón de inicio (u otro activador `ACTION_ASSIST`), se abre la aplicación; al decir «Hey Google, ask OpenClaw `<prompt>`», se activa el patrón de consulta de App Actions declarado por la aplicación y se transfiere la indicación al editor del chat sin enviarla automáticamente.

Esto utiliza **App Actions** de Android (capacidad `shortcuts.xml`) declarada en el manifiesto de la aplicación. No se necesita ninguna configuración en el Gateway: la aplicación de Android gestiona por completo la intención del asistente.

<Note>
La disponibilidad de App Actions depende del dispositivo, de la versión de Google Play Services y de que el usuario haya establecido OpenClaw como aplicación de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar las notificaciones del dispositivo al Gateway como elementos `node.event`. Esto se configura **en el dispositivo**, en la hoja de ajustes de la aplicación, no en la configuración de gateway/`openclaw.json`.

| Ajuste                      | Descripción                                                                                                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | Interruptor principal. Desactivado de forma predeterminada; primero se debe conceder Notification Listener Access.                                                                                          |
| Package Filter              | **Allowlist** (solo se reenvían los ID de paquete enumerados) o **Blocklist** (valor predeterminado: todos los paquetes excepto los ID enumerados). El paquete de OpenClaw siempre se excluye en el modo Blocklist para evitar bucles de reenvío. |
| Quiet Hours                 | Intervalo local de inicio/fin con formato HH:mm que suprime el reenvío. Deshabilitado de forma predeterminada; una vez habilitado, sus valores predeterminados son `22:00`-`07:00`.      |
| Max Events / Minute         | Límite por dispositivo de la frecuencia de notificaciones reenviadas. Valor predeterminado: 20.                                                                                                             |
| Route Session Key           | Opcional. Fija los eventos de notificación reenviados en una sesión específica en lugar de usar la ruta de notificaciones predeterminada del dispositivo.                                                   |

<Note>
El reenvío de notificaciones requiere el permiso Notification Listener de Android. La aplicación solicita este permiso durante la configuración.
</Note>

Las notificaciones de WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord y Signal siempre se excluyen. Sus mensajes ya pertenecen a sesiones de canales nativas de OpenClaw; reenviar la notificación de Android como un evento independiente del Node podría dirigir una respuesta a través de la conversación equivocada.

## Contenido relacionado

- [Aplicación para iOS](/es/platforms/ios)
- [Nodes](/es/nodes)
- [Solución de problemas del Node Android](/es/nodes/troubleshooting)
