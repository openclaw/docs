---
read_when:
    - Emparejamiento o reconexión del Node de Android
    - Depuración del descubrimiento o la autenticación del Gateway en Android
    - Duplicación o control de un dispositivo Android desde un Mac remoto
    - Verificación de la paridad del historial de chat entre clientes
summary: 'Aplicación Android (Node): guía operativa de conexión + superficie de comandos de Connect/Chat/Voice/Canvas'
title: Aplicación para Android
x-i18n:
    generated_at: "2026-07-19T02:04:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a505b449c140eee63d3e587df82c8730f1e076570f00f2e0c699b0f967b1f7f8
    source_path: platforms/android.md
    workflow: 16
---

<Note>
La aplicación oficial para Android está disponible en [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) y como APK independiente firmado en las [versiones de GitHub](https://github.com/openclaw/openclaw/releases) compatibles. Es un nodo complementario y requiere un Gateway de OpenClaw en ejecución. Código fuente: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([instrucciones de compilación](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Resumen de compatibilidad

- Función: aplicación de nodo complementario (Android no aloja el Gateway).
- Gateway obligatorio: sí (ejecútelo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) o `OpenClaw-Android.apk` desde una [versión de GitHub](https://github.com/openclaw/openclaw/releases) compatible, [Primeros pasos](/es/start/getting-started) para el Gateway y, a continuación, [Emparejamiento](/es/channels/pairing).
- Gateway: [Guía operativa](/es/gateway) + [Configuración](/es/gateway/configuration).
  - Protocolos: [Protocolo del Gateway](/es/gateway/protocol) (nodos + plano de control).

El control del sistema (launchd/systemd) reside en el host del Gateway; consulte [Gateway](/es/gateway).

## Complemento para Wear OS

El complemento para Wear OS utiliza la conexión autenticada al Gateway del teléfono Android emparejado; el reloj nunca recibe ni almacena credenciales del Gateway. Permite seleccionar agentes y sesiones, leer transcripciones limitadas, enviar respuestas escritas o dictadas, cancelar una ejecución activa, iniciar una conversación en tiempo real dentro de la sesión seleccionada y conectar o desconectar el Gateway del teléfono emparejado. También ofrece notificaciones locales de respuestas, apariencia oscura o clara y reproducción automática opcional de las respuestas mediante voz. Los controles de los agentes y del Gateway negocian sus capacidades para admitir actualizaciones escalonadas del teléfono y el reloj. La conversación en tiempo real transmite el audio del micrófono y de reproducción mediante un canal temporal de la capa de datos de Wear OS, y se detiene cuando se pierde el teléfono seleccionado, la conexión al Gateway o el canal de audio.

## Instalación fuera de Google Play

Las versiones finales y de corrección normales de GitHub incluyen un `OpenClaw-Android.apk` universal y `OpenClaw-Android-SHA256SUMS.txt`. El APK se compila a partir de la etiqueta de la versión, se firma con la clave de publicación de OpenClaw para Android e incluye la procedencia de GitHub Actions.

Elija una [versión](https://github.com/openclaw/openclaw/releases) que incluya ambos recursos y, a continuación, descargue y verifique esa etiqueta exacta antes de instalarla manualmente:

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
Las instalaciones desde Google Play y mediante el APK independiente utilizan canales de actualización distintos y pueden tener identidades de firma diferentes. Android puede exigir la desinstalación de la aplicación existente antes de cambiar de canal, lo que elimina sus datos locales. Manténgase en un solo canal para las actualizaciones normales.
</Warning>

## Duplicación y control de Android desde un Mac remoto

[scrcpy](https://github.com/Genymobile/scrcpy) duplica una pantalla de Android en una ventana de macOS y
reenvía la entrada del teclado y el puntero mediante Android Debug Bridge (ADB). Este es un flujo de trabajo
del operador, independiente de la conexión del nodo de OpenClaw. Resulta útil cuando el dispositivo Android y el
Mac se encuentran en ubicaciones distintas, pero comparten una red privada de Tailscale.

### Antes de comenzar

- Instale Tailscale en el dispositivo Android y en el Mac, y conecte ambos a la misma tailnet.
- En Android, habilite **Developer options** y **USB debugging**. Android 16 sitúa **Wireless
  debugging** en **Settings > System > Developer options**. Consulte las [opciones para desarrolladores de
  Android](https://developer.android.com/studio/debug/dev-options).
- Instale scrcpy y ADB en el Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Mantenga el dispositivo Android disponible para la primera conexión. Android debe aprobar la clave ADB
  de cada Mac antes de que dicho Mac pueda controlar el dispositivo.

### Habilitación de ADB mediante TCP

Para la configuración inicial, conecte el dispositivo Android por USB a un equipo de confianza y apruebe la
solicitud de depuración. A continuación, ejecute:

```bash
adb devices
adb tcpip 5555
```

Ahora puede desconectar el USB. Si el puerto 5555 deja de escuchar tras reiniciar el dispositivo o restablecer la depuración,
repita este paso de configuración local. Android 11 y versiones posteriores también permiten establecer la confianza inicial mediante
**Wireless debugging > Pair device with pairing code** y `adb pair`.

### Permitir solo el Mac controlador

Las tailnets con concesiones restrictivas deben permitir explícitamente que el Mac controlador acceda al puerto TCP 5555
del dispositivo Android. Añada una regla limitada a la política de la tailnet y sustituya las direcciones de ejemplo
por las IP estables de Tailscale de ambos dispositivos:

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

Consulte las [concesiones de Tailscale](https://tailscale.com/docs/reference/syntax/grants) para conocer los alias de host y otros
selectores. No conceda acceso a este puerto desde Internet ni lo exponga mediante Funnel: un cliente ADB
autorizado tiene un amplio control sobre el dispositivo.

### Conexión e inicio de la duplicación

En el Mac remoto:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

El primer `adb connect` desde este Mac muestra un cuadro de diálogo de autorización en Android. Desbloquee el dispositivo,
confirme la huella digital de la clave y seleccione **Always allow from this computer** solo si el Mac es
de confianza. Una entrada `adb devices` correcta termina en `device`; `unauthorized` significa que la solicitud mostrada en el dispositivo
no se ha aprobado.

Cuando se abra la ventana de scrcpy, utilícela directamente o contrólela con una herramienta de automatización de pantalla de macOS,
como [Peekaboo](https://peekaboo.sh/). scrcpy transporta la imagen y la entrada; Tailscale solo proporciona la
ruta de red privada.

### Solución de problemas

- `Connection timed out`: verifique la concesión de la tailnet para TCP 5555. Un `tailscale ping` correcto demuestra
  la conectividad entre pares, no que la política permita este puerto TCP. Compruébelo con
  `nc -vz <android-tailnet-ip> 5555` desde el Mac.
- `unauthorized`: desbloquee Android y apruebe la clave ADB del Mac remoto, o elimine la estación de trabajo obsoleta
  en **Wireless debugging > Paired devices** y vuelva a emparejarla.
- `Connection refused`: vuelva a conectarse localmente y ejecute `adb tcpip 5555` de nuevo.
- Hay más de un dispositivo en la lista: mantenga el argumento `--serial <android-tailnet-ip>:5555` explícito.

Cuando termine, cierre scrcpy y desconecte ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Guía operativa de conexión

Aplicación de nodo para Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y utiliza el emparejamiento de dispositivos (`role: node`).

Para hosts de Tailscale o públicos, Android requiere un punto de conexión seguro:

- Preferido: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También se admite: cualquier otra URL `wss://` del Gateway con un punto de conexión TLS real
- El protocolo sin cifrar `ws://` sigue siendo compatible en direcciones de LAN privada / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`); la configuración fuera de loopback utiliza automáticamente acceso limitado de operador

### Requisitos previos

- Gateway en ejecución en otra máquina (o accesible mediante SSH).
- El dispositivo/emulador Android puede acceder al WebSocket del Gateway:
  - La misma LAN con mDNS/NSD, **o**
  - La misma tailnet de Tailscale mediante Bonjour de área amplia / DNS-SD unicast (consulte la información siguiente), **o**
  - Host/puerto manual del Gateway (alternativa)
- El emparejamiento móvil mediante tailnet o red pública **no** utiliza puntos de conexión `ws://` con IP sin procesar de la tailnet. Utilice Tailscale Serve u otra URL `wss://` en su lugar.
- La CLI `openclaw` debe estar disponible en la máquina del Gateway (o mediante SSH) para aprobar las solicitudes de emparejamiento.

### 1. Iniciar el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirme que en los registros aparece algo similar a:

- `listening on ws://0.0.0.0:18789`

Para el acceso remoto desde Android mediante Tailscale, es preferible utilizar Serve/Funnel en lugar de enlazar directamente una dirección de la tailnet:

```bash
openclaw gateway --tailscale serve
```

Esto proporciona a Android un punto de conexión seguro `wss://` / `https://`. Una configuración `gateway.bind: "tailnet"` simple no es suficiente para el emparejamiento remoto inicial de Android, salvo que también finalice TLS por separado.

### 2. Verificar la detección (opcional)

Desde la máquina del Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también configuró un dominio de detección de área amplia, compárelo con:

```bash
openclaw gateway discover --json
```

Esto muestra `local.` junto con el dominio de área amplia configurado en una sola operación, mediante el punto de conexión resuelto del servicio en lugar de indicaciones basadas únicamente en TXT.

#### Detección entre redes mediante DNS-SD unicast

La detección NSD/mDNS de Android no atraviesa redes. Si el nodo Android y el Gateway están en redes distintas, pero conectados mediante Tailscale, utilice Bonjour de área amplia / DNS-SD unicast. La detección por sí sola no basta para emparejar Android mediante una tailnet o una red pública: la ruta detectada también necesita un punto de conexión seguro (`wss://` o Tailscale Serve):

1. Configure una zona DNS-SD (por ejemplo, `openclaw.internal.`) en el host del Gateway y publique registros `_openclaw-gw._tcp`.
2. Configure el DNS dividido de Tailscale para el dominio elegido de modo que apunte a ese servidor DNS.

Detalles y ejemplo de configuración de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3. Conectarse desde Android

En la aplicación de Android:

- La aplicación mantiene activa su conexión con el Gateway mediante un **servicio en primer plano** (notificación persistente).
- Abra la pestaña **Connect**.
- Utilice el modo **Setup Code** o **Manual**.
- Si la detección está bloqueada, utilice el host/puerto manual en **Advanced controls**. Para hosts de LAN privada, `ws://` sigue funcionando. Para hosts de Tailscale o públicos, active TLS y utilice un punto de conexión `wss://` / Tailscale Serve.

Después del primer emparejamiento correcto, Android vuelve a conectarse automáticamente al iniciarse con el Gateway emparejado activo (según disponibilidad para los Gateways detectados, que deben estar visibles en la red).

Los códigos de configuración oficiales conectan Android como nodo y conceden acceso completo de operador al Gateway
de forma predeterminada mediante `wss://`. La configuración `ws://` sin cifrar y fuera de loopback
utiliza automáticamente acceso limitado para proteger el token de portador. **Settings → Gateway**
muestra el acceso **Full** o **Limited**. Para una conexión limitada, configure
`wss://` o Tailscale Serve, genere un nuevo código de acceso completo en Control UI o
con `openclaw qr`, escanéelo o péguelo en esa página y vuelva a conectarse. Los operadores
que deseen el perfil reducido pueden seleccionar **Limited access** en Control UI o ejecutar
`openclaw qr --limited`.

### Varios Gateways

La aplicación mantiene un registro de todos los Gateways con los que se ha emparejado, por lo que es posible cambiar entre ellos sin volver a realizar el emparejamiento:

- **Settings -> Gateways** muestra los gateways emparejados con el activo marcado. Toque una entrada para cambiar; la aplicación cierra las sesiones actuales y vuelve a conectarse al gateway seleccionado.
- La pestaña **Connect** muestra un selector rápido cuando hay más de un gateway emparejado.
- Las credenciales, los tokens de dispositivo, la confianza TLS, el historial de chat y los mensajes sin conexión en cola se almacenan por gateway. El cambio nunca mezcla el estado entre gateways, y los mensajes puestos en cola sin conexión se entregan únicamente al gateway para el que se escribieron.
- **Forget** elimina la entrada de registro de un gateway junto con sus credenciales, tokens de dispositivo, pin TLS y chats almacenados en caché.

### Balizas de presencia activa

Después de que se conecte la sesión autenticada del Node, y cuando la aplicación pase a segundo plano mientras el servicio en primer plano siga conectado, Android llama a `node.event` con `event: "node.presence.alive"`. El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del Node/dispositivo emparejado únicamente después de conocer la identidad autenticada del dispositivo Node.

La aplicación considera que la baliza se ha registrado correctamente solo cuando la respuesta del gateway incluye `handled: true`. Los gateways anteriores pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización persistente de la última vez que se vio.

### 4. Aprobar el emparejamiento (CLI)

En la máquina del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles del emparejamiento: [Emparejamiento](/es/channels/pairing).

Opcional: si el Node Android siempre se conecta desde una subred estrictamente controlada, puede habilitar la aprobación automática del Node en el primer emparejamiento mediante CIDR explícitos o direcciones IP exactas:

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

Esto está deshabilitado de forma predeterminada. Se aplica únicamente a emparejamientos `role: node` nuevos sin ámbitos solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

### 5. Verificar que el Node está conectado

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat e historial

La pestaña Chat de Android permite seleccionar la sesión (de forma predeterminada, `main`, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para su visualización: se eliminan las etiquetas de directivas en línea, las cargas útiles XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` y variantes truncadas), así como los tokens de control del modelo ASCII/de ancho completo filtrados; se omiten las filas del asistente con tokens silenciosos, como `NO_REPLY` / `no_reply` exactos; las filas demasiado grandes pueden sustituirse por marcadores de posición)
- Envío: `chat.send`
- Envío persistente: cada envío (texto, imágenes seleccionadas y notas de voz) se registra en una bandeja de salida del dispositivo específica de cada gateway antes de cualquier intento de red, de modo que la finalización de la aplicación no pueda provocar la pérdida de la entrada enviada. Los envíos puestos en cola sin conexión se entregan en orden al volver a conectarse, con claves de idempotencia estables, y un envío solo se retira cuando el turno aparece en el `chat.history` canónico; una confirmación por sí sola no se considera prueba de entrega. Los resultados ambiguos (confirmación perdida, aplicación cerrada durante el envío o reinicio del gateway antes de escribir la transcripción) aparecen como filas visibles con las opciones explícitas **Retry**/**Delete**, en lugar de reenviarse automáticamente. Los comandos con barra nunca se reproducen automáticamente tras una reconexión; quedan pendientes para reintentarlos explícitamente. La cola está limitada (50 mensajes y 48 MB de datos adjuntos por gateway) y las filas no enviadas caducan después de 48 horas. Los borradores del editor que nunca se enviaron no persisten entre procesos.
- Actualizaciones push (sin garantía): `chat.subscribe` -> `event:"chat"`
- Escuchar: mantenga pulsado un mensaje del asistente y elija **Listen** para oírlo; el audio se genera mediante `tts.speak` del gateway con la cadena de proveedores de TTS configurada, y se utiliza el TTS del sistema del dispositivo cuando el gateway no puede generar audio. La reproducción se detiene al cambiar de sesión, iniciar un chat nuevo, pasar la aplicación a segundo plano o cerrar el chat.

### 7. Canvas y cámara

#### Host de Canvas del Gateway (recomendado para contenido web)

Para que el Node muestre HTML/CSS/JS reales que el agente pueda editar en el disco, dirija el Node al host de Canvas del Gateway.

<Note>
Los Nodes cargan Canvas desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, de forma predeterminada `18789`).
</Note>

1. Cree `~/.openclaw/workspace/canvas/index.html` en el host del gateway.
2. Dirija el Node allí (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, utilice un nombre MagicDNS o una IP de tailnet en lugar de `.local`; por ejemplo, `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inserta un cliente de recarga en vivo en el HTML y recarga cuando cambian los archivos. El Gateway también sirve `/__openclaw__/a2ui/`, pero la aplicación de Android trata las páginas A2UI remotas como contenido de solo renderizado. Los comandos A2UI con acciones utilizan la página A2UI incluida y propiedad de la aplicación.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (utilice `{"url":""}` o `{"url":"/"}` para volver a la estructura predeterminada). `canvas.snapshot` devuelve `{ format, base64 }` (de forma predeterminada, `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL`, alias heredado). Estos utilizan la página A2UI incluida y propiedad de la aplicación para el renderizado con acciones.

Comandos de cámara (solo en primer plano; sujetos a permisos): `camera.snap` (jpg), `camera.clip` (mp4). Consulte [Node de cámara](/es/nodes/camera) para conocer los parámetros y los auxiliares de la CLI.

### 8. Voz y superficie ampliada de comandos de Android

- La navegación principal de Android consta de **Home**, **Chat** y **Settings**. La entrada de voz
  pertenece al editor de Chat; no hay una pestaña Voice independiente.
- Toque el micrófono del editor para usar el reconocimiento de voz del dispositivo, que inserta una
  transcripción en el borrador. Mantenga pulsado el micrófono para grabar una nota de voz
  adjunta. La interfaz informa si el reconocimiento no está disponible, si falta el permiso,
  si se producen errores de ocupación/red o si no se detecta voz, en lugar de descartar
  silenciosamente el intento.
- Inicie el modo continuo **Talk** desde la forma de onda de Chat. El dictado, la grabación
  de notas de voz y Talk son vías de uso del micrófono mutuamente excluyentes.
- El modo Talk asciende el servicio en primer plano existente de `connectedDevice` a `connectedDevice|microphone` antes de iniciar la captura y lo degrada cuando se detiene el modo Talk. El servicio del Node declara `FOREGROUND_SERVICE_CONNECTED_DEVICE` con `CHANGE_NETWORK_STATE`; Android 14+ también requiere la declaración `FOREGROUND_SERVICE_MICROPHONE`, la concesión en tiempo de ejecución `RECORD_AUDIO` y el tipo de servicio de micrófono en tiempo de ejecución.
- De forma predeterminada, Talk en Android utiliza el reconocimiento de voz nativo, el chat del Gateway y `talk.speak` mediante el proveedor de Talk configurado en el gateway. El TTS del sistema local solo se utiliza cuando `talk.speak` no está disponible.
- Talk en Android utiliza la retransmisión en tiempo real del Gateway únicamente cuando `talk.realtime.mode` es `realtime` y `talk.realtime.transport` es `gateway-relay`.
- Android no anuncia la capacidad `voiceWake`. Utilice el dictado de Chat,
  una nota de voz o Talk para la entrada de voz.
- Familias adicionales de comandos de Android (la disponibilidad depende del dispositivo, los permisos y la configuración del usuario):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` solo cuando **Settings > Phone Capabilities > Installed Apps** está habilitado; de forma predeterminada, enumera las aplicaciones visibles en el lanzador (pase `includeNonLaunchable` para obtener la lista completa).
  - `notifications.list`, `notifications.actions` (consulte [Reenvío de notificaciones](#notification-forwarding) más adelante)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Archivos del espacio de trabajo (solo lectura)

La vista general de Home incluye una tarjeta **Files** que permite explorar el espacio de trabajo del agente activo mediante las RPC de gateway de solo lectura `agents.workspace.list` / `agents.workspace.get`: navegación por directorios, vistas previas de texto e imágenes y exportación mediante la hoja para compartir de Android. No hay operaciones de escritura y el gateway limita el tamaño de las vistas previas.

## Revisar aprobaciones de comandos

Una conexión de operador con `operator.admin`, o una conexión
`operator.approvals` emparejada a la que el Gateway se dirija explícitamente, puede revisar
las solicitudes de ejecución pendientes en **Settings -> Approvals**. La aplicación carga el
registro de aprobación saneado del Gateway antes de habilitar sus botones, muestra cualquier
advertencia de seguridad y las decisiones exactas ofrecidas por esa solicitud, y envía
al Gateway el ID de aprobación y el tipo de propietario.

El estado de aprobación se comparte con la interfaz de control y las superficies de chat compatibles. La
primera respuesta confirmada prevalece; Android muestra ese resultado canónico incluso cuando
otra superficie haya respondido primero. Si se pierde una respuesta de resolución o se desconecta el Gateway,
la aplicación mantiene la acción bloqueada y vuelve a leer la aprobación
antes de ofrecer otra decisión.

Los gateways anteriores a los métodos de aprobación unificados recurren a los métodos
específicos de ejecución incluidos. La revisión pendiente sigue funcionando, pero el estado conservado del terminal
y el resultado más completo entre superficies requieren un Gateway actualizado.

## Responder a las preguntas del agente

Chat muestra las preguntas pendientes del Gateway como tarjetas nativas para las conexiones de operador
con `operator.questions` (o `operator.admin`). Las tarjetas admiten opciones de selección única y
múltiple, descripciones de opciones, respuestas de texto libre en **Other** y una
cuenta atrás hasta la caducidad. Las reconexiones vuelven a cargar las preguntas pendientes desde el Gateway. Una tarjeta
se bloquea cuando este dispositivo la responde, otra superficie responde primero o la
pregunta caduca o se cancela.

## Puntos de entrada del asistente

Android permite iniciar OpenClaw desde el activador del asistente del sistema (Google Assistant). Al mantener pulsado el botón de inicio (u otro activador `ACTION_ASSIST`) se abre la aplicación; al decir "Hey Google, ask OpenClaw `<prompt>`" se activa el patrón de consulta de App Actions declarado por la aplicación y se transfiere la instrucción al editor de chat sin enviarla automáticamente.

Esto utiliza **App Actions** de Android (capacidad `shortcuts.xml`) declarada en el manifiesto de la aplicación. No se necesita ninguna configuración en el gateway: la aplicación de Android gestiona íntegramente la intención del asistente.

<Note>
La disponibilidad de App Actions depende del dispositivo, de la versión de Google Play Services y de si el usuario ha configurado OpenClaw como aplicación de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar las notificaciones del dispositivo al gateway como elementos `node.event`. Esto se configura **en el dispositivo**, en la hoja Settings de la aplicación, no en la configuración del gateway/`openclaw.json`.

| Configuración                     | Descripción                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reenviar eventos de notificación | Interruptor principal. Desactivado de forma predeterminada; primero se debe conceder el acceso al receptor de notificaciones.                                                                                                              |
| Filtro de paquetes              | **Lista de permitidos** (solo se reenvían los ID de paquete incluidos) o **Lista de bloqueados** (valor predeterminado: todos los paquetes excepto los ID incluidos). El paquete propio de OpenClaw siempre se excluye en el modo de lista de bloqueados para evitar bucles de reenvío. |
| Horas de silencio                 | Intervalo local de inicio/fin en formato HH:mm que suspende el reenvío. Desactivado de forma predeterminada; al activarlo, los valores predeterminados son `22:00`-`07:00`.                                                                                |
| Máximo de eventos por minuto         | Límite de frecuencia por dispositivo para las notificaciones reenviadas. Valor predeterminado: 20.                                                                                                                                          |
| Clave de sesión de enrutamiento           | Opcional. Fija los eventos de notificación reenviados a una sesión específica en lugar de usar la ruta de notificaciones predeterminada del dispositivo.                                                                               |

<Note>
El reenvío de notificaciones requiere el permiso de receptor de notificaciones de Android. La aplicación solicita este permiso durante la configuración.
</Note>

Las notificaciones de WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord y Signal siempre se excluyen. Sus mensajes ya pertenecen a sesiones de canal nativas de OpenClaw; reenviar la notificación de Android como un evento de Node independiente podría enrutar una respuesta a través de la conversación equivocada.

## Contenido relacionado

- [Aplicación para iOS](/es/platforms/ios)
- [Nodes](/es/nodes)
- [Solución de problemas de Nodes de Android](/es/nodes/troubleshooting)
