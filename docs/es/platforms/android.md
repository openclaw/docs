---
read_when:
    - Emparejamiento o reconexión del Node de Android
    - Depuración del descubrimiento o la autenticación del Gateway en Android
    - Duplicación o control de un dispositivo Android desde un Mac remoto
    - Verificación de la paridad del historial de chat entre clientes
summary: 'Aplicación para Android (Node): guía operativa de conexión + interfaz de comandos de Conectar/Chat/Voz/Canvas'
title: Aplicación para Android
x-i18n:
    generated_at: "2026-07-21T08:59:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: caa98f2e5834f9974b0df319ea0844acf589fe3735045efe80c97f3f14e2ee45
    source_path: platforms/android.md
    workflow: 16
---

<Note>
La aplicación oficial para Android está disponible en [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) y como APK independiente firmado en las [versiones de GitHub](https://github.com/openclaw/openclaw/releases) compatibles. Es un nodo complementario y requiere un Gateway de OpenClaw en ejecución. Código fuente: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([instrucciones de compilación](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Resumen de compatibilidad

- Función: aplicación de nodo complementario (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútelo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) o `OpenClaw-Android.apk` desde una [versión de GitHub](https://github.com/openclaw/openclaw/releases) compatible, [Primeros pasos](/es/start/getting-started) para el Gateway y, después, [Vinculación](/es/channels/pairing).
- Gateway: [Guía operativa](/es/gateway) + [Configuración](/es/gateway/configuration).
  - Protocolos: [Protocolo del Gateway](/es/gateway/protocol) (nodos + plano de control).

El control del sistema (launchd/systemd) reside en el host del Gateway; consulte [Gateway](/es/gateway).

## Sesiones simultáneas del Gateway

Vincule cada Gateway una vez y, después, abra **Configuración → Gateway**. La marca de verificación indica
el Gateway seleccionado y cada interruptor controla si la sesión del operador de un Gateway no seleccionado
permanece conectada. Los Gateways habilitados se reconectan de forma independiente
mientras la aplicación está en primer plano, por lo que cambiar la selección no desconecta los
demás. Solo el Gateway seleccionado controla la sesión del nodo Android y las
capacidades del dispositivo; esto evita que varios Gateways emitan simultáneamente comandos de cámara,
ubicación, pantalla o notificaciones al mismo teléfono. Android puede
suspender las conexiones secundarias cuando la aplicación deja de estar en primer plano.

## Aplicación complementaria para Wear OS

La aplicación complementaria para Wear OS utiliza la conexión autenticada al Gateway del teléfono Android vinculado; el reloj nunca recibe ni almacena las credenciales del Gateway. Permite seleccionar agentes y sesiones, leer transcripciones acotadas, enviar respuestas de texto o dictadas, cancelar una ejecución activa, iniciar Talk en tiempo real dentro de la sesión seleccionada y conectar o desconectar el Gateway del teléfono vinculado. También ofrece notificaciones locales de respuestas, apariencia oscura o clara y reproducción automática opcional de las respuestas mediante voz. Los controles del agente y del Gateway negocian sus capacidades para admitir actualizaciones escalonadas del teléfono y el reloj. Talk en tiempo real transmite el audio del micrófono y de la reproducción mediante un canal temporal de Wear OS Data Layer y se detiene cuando se pierde el teléfono seleccionado, la conexión al Gateway o el canal de audio.

## Instalación fuera de Google Play

Las versiones finales y correctivas habituales de GitHub incluyen un `OpenClaw-Android.apk` universal y `OpenClaw-Android-SHA256SUMS.txt`. El APK se compila a partir de la etiqueta de la versión, se firma con la clave de publicación de OpenClaw para Android e incluye procedencia de GitHub Actions.

Elija una [versión](https://github.com/openclaw/openclaw/releases) que incluya ambos recursos; después, descargue y verifique esa etiqueta exacta antes de instalarla manualmente:

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
Las instalaciones desde Google Play y mediante el APK independiente utilizan canales de actualización distintos y pueden tener identidades de firma diferentes. Es posible que Android exija desinstalar la aplicación existente antes de cambiar de canal, lo que elimina los datos locales de la aplicación. Manténgase en un único canal para las actualizaciones normales.
</Warning>

## Duplicar y controlar Android desde un Mac remoto

[scrcpy](https://github.com/Genymobile/scrcpy) duplica una pantalla de Android en una ventana de macOS y
reenvía las entradas del teclado y del puntero mediante Android Debug Bridge (ADB). Este es un flujo de trabajo
del operador, independiente de la conexión del nodo de OpenClaw. Resulta útil cuando el dispositivo Android y el
Mac se encuentran en ubicaciones distintas, pero comparten una red privada de Tailscale.

### Antes de comenzar

- Instale Tailscale en el dispositivo Android y en el Mac, y conecte ambos a la misma tailnet.
- En Android, habilite **Developer options** y **USB debugging**. Android 16 sitúa **Wireless
  debugging** en **Settings > System > Developer options**. Consulte [Opciones para desarrolladores de
  Android](https://developer.android.com/studio/debug/dev-options).
- Instale scrcpy y ADB en el Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Mantenga disponible el dispositivo Android para la primera conexión. Android debe aprobar la clave ADB
  de cada Mac antes de que dicho Mac pueda controlar el dispositivo.

### Habilitar ADB mediante TCP

Para la configuración inicial, conecte por USB el dispositivo Android a un equipo de confianza y apruebe la
solicitud de depuración. Después, ejecute:

```bash
adb devices
adb tcpip 5555
```

Ahora puede desconectar el USB. Si el puerto 5555 deja de escuchar después de reiniciar el dispositivo o restablecer la depuración,
repita este paso de configuración local. Android 11 y versiones posteriores también permiten establecer la confianza inicial mediante
**Wireless debugging > Pair device with pairing code** y `adb pair`.

### Permitir únicamente el Mac controlador

Las tailnets con concesiones restrictivas deben permitir explícitamente que el Mac controlador acceda al puerto TCP 5555
del dispositivo Android. Añada una regla específica a la política de la tailnet y sustituya las direcciones de ejemplo
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

Consulte [Concesiones de Tailscale](https://tailscale.com/docs/reference/syntax/grants) para conocer los alias de host y otros
selectores. No conceda acceso a este puerto desde Internet ni lo exponga mediante Funnel: un cliente ADB autorizado
tiene un amplio control sobre el dispositivo.

### Conectarse e iniciar la duplicación

En el Mac remoto:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

La primera `adb connect` desde este Mac muestra un cuadro de diálogo de autorización en Android. Desbloquee el dispositivo,
confirme la huella digital de la clave y seleccione **Always allow from this computer** únicamente si el Mac es
de confianza. Una entrada `adb devices` correcta termina en `device`; `unauthorized` significa que la solicitud
del dispositivo aún no se ha aprobado.

Una vez que se abra la ventana de scrcpy, utilícela directamente o selecciónela como destino mediante una herramienta de automatización de pantalla de macOS,
como [Peekaboo](https://peekaboo.sh/). scrcpy transporta la imagen y las entradas; Tailscale solo proporciona la
ruta de red privada.

### Solución de problemas

- `Connection timed out`: verifique la concesión de la tailnet para TCP 5555. Una `tailscale ping` correcta demuestra
  la conectividad entre pares, no que la política permita este puerto TCP. Realice una prueba con
  `nc -vz <android-tailnet-ip> 5555` desde el Mac.
- `unauthorized`: desbloquee Android y apruebe la clave ADB del Mac remoto, o elimine la estación de trabajo obsoleta
  en **Wireless debugging > Paired devices** y vuelva a vincularla.
- `Connection refused`: vuelva a conectarse localmente y ejecute de nuevo `adb tcpip 5555`.
- Se muestra más de un dispositivo: mantenga el argumento explícito `--serial <android-tailnet-ip>:5555`.

Cuando termine, cierre scrcpy y desconecte ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Guía operativa de conexión

Aplicación del nodo Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y utiliza la vinculación de dispositivos (`role: node`).

Para Tailscale o hosts públicos, Android requiere un punto de conexión seguro:

- Opción preferida: Tailscale Serve/Funnel con `https://<magicdns>`/`wss://<magicdns>`
- También se admite: cualquier otra URL `wss://` del Gateway con un punto de conexión TLS real
- El protocolo sin cifrar `ws://` sigue siendo compatible con direcciones de LAN privada/hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`); la configuración fuera de loopback utiliza automáticamente un acceso de operador limitado

### Requisitos previos

- Gateway en ejecución en otro equipo (o accesible mediante SSH).
- El dispositivo o emulador Android puede acceder al WebSocket del Gateway:
  - En la misma LAN con mDNS/NSD, **o**
  - En la misma tailnet de Tailscale mediante Bonjour de área amplia/DNS-SD unicast (consulte más adelante), **o**
  - Host/puerto manual del Gateway (alternativa)
- La vinculación móvil mediante una tailnet o red pública **no** utiliza puntos de conexión `ws://` con la IP de la tailnet sin procesar. Utilice Tailscale Serve u otra URL `wss://`.
- La CLI `openclaw` está disponible en el equipo del Gateway (o mediante SSH) para aprobar las solicitudes de vinculación.

### 1. Iniciar el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirme que en los registros aparezca algo similar a:

- `listening on ws://0.0.0.0:18789`

Para el acceso remoto de Android mediante Tailscale, prefiera Serve/Funnel en lugar de vincular directamente una dirección de la tailnet:

```bash
openclaw gateway --tailscale serve
```

Esto proporciona a Android un punto de conexión seguro `wss://`/`https://`. Una configuración simple con `gateway.bind: "tailnet"` no es suficiente para la primera vinculación remota de Android, salvo que también termine TLS por separado.

### 2. Verificar la detección (opcional)

Desde el equipo del Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también configuró un dominio de detección de área amplia, compárelo con:

```bash
openclaw gateway discover --json
```

Esto muestra `local.` y el dominio de área amplia configurado en una sola ejecución, utilizando el punto de conexión del servicio resuelto en lugar de indicaciones basadas únicamente en TXT.

#### Detección entre redes mediante DNS-SD unicast

La detección NSD/mDNS de Android no atraviesa redes. Si el nodo Android y el Gateway están en redes distintas, pero conectados mediante Tailscale, utilice Bonjour de área amplia/DNS-SD unicast. La detección por sí sola no es suficiente para la vinculación de Android mediante una tailnet o red pública: la ruta detectada aún necesita un punto de conexión seguro (`wss://` o Tailscale Serve):

1. Configure una zona DNS-SD (por ejemplo, `openclaw.internal.`) en el host del Gateway y publique registros `_openclaw-gw._tcp`.
2. Configure el DNS dividido de Tailscale para que el dominio elegido apunte a ese servidor DNS.

Detalles y ejemplo de configuración de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3. Conectarse desde Android

En la aplicación para Android:

- La aplicación mantiene activa su conexión al Gateway mediante un **servicio en primer plano** (notificación persistente).
- Abra la pestaña **Connect**.
- Utilice el modo **Setup Code** o **Manual**.
- Si la detección está bloqueada, utilice el host/puerto manual en **Advanced controls**. Para los hosts de una LAN privada, `ws://` sigue funcionando. Para hosts de Tailscale o públicos, active TLS y utilice un punto de conexión `wss://`/Tailscale Serve.

Después de la primera vinculación correcta, Android vuelve a conectarse automáticamente al iniciarse al Gateway vinculado activo (con el máximo esfuerzo para los Gateways detectados, que deben estar visibles en la red).

Los códigos de configuración oficiales conectan Android como nodo y conceden acceso completo de operador al Gateway
de forma predeterminada mediante `wss://`. La configuración sin cifrar `ws://` fuera de loopback
utiliza automáticamente acceso limitado para proteger el token al portador. **Configuración → Gateway**
muestra el acceso **Completo** o **Limitado**. Para una conexión limitada, configure
`wss://` o Tailscale Serve, genere un nuevo código de acceso completo en la interfaz de control o
con `openclaw qr`, escanéelo o péguelo en esa página y vuelva a conectarse. Los operadores
que deseen el perfil reducido pueden seleccionar **Acceso limitado** en la interfaz de control o ejecutar
`openclaw qr --limited`.

### Administrar Gateways vinculados

La aplicación mantiene un registro de todos los Gateways con los que se ha vinculado, por lo que puede mantener conectadas las sesiones de operador y cambiar la selección sin volver a realizar la vinculación:

- **Settings → Gateway** muestra los gateways emparejados, con el que tiene el foco marcado. Toque una entrada para enfocarla; las demás sesiones de operador habilitadas permanecen conectadas.
- Cada interruptor controla si ese Gateway sin foco permanece conectado mientras la aplicación está en primer plano. El Gateway con foco permanece habilitado y controla la conexión Node del teléfono y las capacidades del dispositivo.
- La pestaña **Connect** muestra un selector rápido cuando hay más de un gateway emparejado.
- Las credenciales, los tokens del dispositivo, la confianza TLS, el historial de chat y los mensajes sin conexión en cola se almacenan por Gateway. Cambiar el foco nunca mezcla el estado entre Gateways, y los mensajes puestos en cola mientras no hay conexión se entregan únicamente al Gateway para el que se escribieron.
- **Forget** elimina la entrada de registro de un gateway junto con sus credenciales, tokens del dispositivo, anclaje TLS y chats almacenados en caché.

### Balizas de presencia activa

Después de que se conecte la sesión Node autenticada, y cuando la aplicación pase a segundo plano mientras el servicio en primer plano siga conectado, Android llama a `node.event` con `event: "node.presence.alive"`. El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del Node/dispositivo emparejado únicamente después de conocer la identidad autenticada del dispositivo Node.

La aplicación considera que la baliza se ha registrado correctamente solo cuando la respuesta del gateway incluye `handled: true`. Los gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización persistente de la última vez que se vio el dispositivo.

### 4. Aprobar el emparejamiento (CLI)

En la máquina del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles del emparejamiento: [Emparejamiento](/es/channels/pairing).

Opcional: si el Node Android siempre se conecta desde una subred estrictamente controlada, se puede habilitar la aprobación automática del Node durante el primer emparejamiento mediante CIDR explícitos o direcciones IP exactas:

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

Esta opción está deshabilitada de forma predeterminada. Solo se aplica a emparejamientos `role: node` nuevos sin ámbitos solicitados. El emparejamiento de operadores/navegadores y cualquier cambio de rol, ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

### 5. Verificar que el Node esté conectado

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat e historial

La pestaña Chat de Android permite seleccionar la sesión (de forma predeterminada, `main`, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para su visualización: se eliminan las etiquetas de directivas insertadas, las cargas útiles XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` y las variantes truncadas) y los tokens de control del modelo ASCII/de ancho completo filtrados; se omiten las filas silenciosas del asistente formadas por tokens como exactamente `NO_REPLY` / `no_reply`; las filas demasiado grandes pueden sustituirse por marcadores de posición)
- Envío: `chat.send`
- Envío persistente: cada envío (texto, imágenes seleccionadas y notas de voz) se registra en una bandeja de salida del dispositivo específica de cada gateway antes de cualquier intento de red, por lo que cerrar la aplicación no puede perder una entrada enviada. Los envíos puestos en cola mientras no hay conexión se entregan en orden al volver a conectarse, con claves de idempotencia estables, y un envío solo se retira después de que el turno sea visible en el `chat.history` canónico; una confirmación por sí sola no se considera prueba de entrega. Los resultados ambiguos (confirmación perdida, aplicación cerrada durante el envío o reinicio del gateway antes de escribir la transcripción) aparecen como filas visibles con las opciones explícitas **Retry**/**Delete**, en lugar de reenviarse automáticamente. Los comandos de barra diagonal nunca se reproducen automáticamente después de una reconexión; quedan pendientes para volver a intentarlos de forma explícita. La cola está limitada (50 mensajes y 48 MB de bytes de archivos adjuntos por gateway) y las filas no enviadas caducan después de 48 horas. Los borradores del editor que nunca se enviaron no persisten entre procesos.
- Actualizaciones push (sin garantía): `chat.subscribe` -> `event:"chat"`
- Escuchar: mantenga pulsado un mensaje del asistente y elija **Listen** para oírlo; el audio se genera mediante `tts.speak` del gateway con la cadena de proveedores de TTS configurada, y se utiliza el TTS del sistema del dispositivo cuando el gateway no puede generar audio. La reproducción se detiene al cambiar de sesión, iniciar un chat nuevo, pasar la aplicación a segundo plano o cerrar el chat.

### 7. Canvas y cámara

#### Host de Canvas del Gateway (recomendado para contenido web)

Para que el Node muestre HTML/CSS/JS reales que el agente pueda editar en el disco, dirija el Node al host de Canvas del Gateway.

<Note>
Los Nodes cargan el Canvas desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, de forma predeterminada `18789`).
</Note>

1. Cree `~/.openclaw/workspace/canvas/index.html` en el host del gateway.
2. Dirija el Node a esa ubicación (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, use un nombre de MagicDNS o una IP de tailnet en lugar de `.local`; por ejemplo, `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inserta un cliente de recarga en vivo en el HTML y vuelve a cargar cuando cambian los archivos. El Gateway también sirve `/__openclaw__/a2ui/`, pero la aplicación Android trata las páginas A2UI remotas como páginas de solo renderizado. Los comandos A2UI con acciones utilizan la página A2UI incluida y administrada por la aplicación.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (use `{"url":""}` o `{"url":"/"}` para volver a la estructura predeterminada). `canvas.snapshot` devuelve `{ format, base64 }` (de forma predeterminada, `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias heredado `canvas.a2ui.pushJSONL`). Estos utilizan la página A2UI incluida y administrada por la aplicación para el renderizado con acciones.

Comandos de cámara (solo en primer plano; sujetos a permisos): `camera.snap` (jpg), `camera.clip` (mp4). Consulte [Node de cámara](/es/nodes/camera) para conocer los parámetros y los auxiliares de la CLI.

### 8. Voz y superficie ampliada de comandos de Android

- La navegación principal de Android incluye **Home**, **Chat** y **Settings**. La entrada de voz
  pertenece al editor de Chat; no hay una pestaña Voice separada.
- Toque el micrófono del editor para usar el reconocimiento de voz del dispositivo, que inserta una
  transcripción en el borrador. Mantenga pulsado el micrófono para grabar un archivo adjunto
  de nota de voz. La interfaz informa cuando el reconocimiento no está disponible, falta el permiso,
  se producen errores de ocupación/red o no se detecta voz, en lugar de descartar silenciosamente
  el intento.
- Inicie el modo continuo **Talk** desde la forma de onda de Chat. El dictado, la grabación
  de notas de voz y Talk son rutas de micrófono mutuamente excluyentes.
- Talk Mode promueve el servicio en primer plano existente de `connectedDevice` a `connectedDevice|microphone` antes de iniciar la captura y lo degrada cuando Talk Mode se detiene. El servicio Node declara `FOREGROUND_SERVICE_CONNECTED_DEVICE` con `CHANGE_NETWORK_STATE`; Android 14+ también requiere la declaración `FOREGROUND_SERVICE_MICROPHONE`, la concesión en tiempo de ejecución `RECORD_AUDIO` y el tipo de servicio de micrófono en tiempo de ejecución.
- De forma predeterminada, Talk en Android utiliza el reconocimiento de voz nativo, el chat del Gateway y `talk.speak` mediante el proveedor de Talk configurado en el gateway. El TTS del sistema local se utiliza únicamente cuando `talk.speak` no está disponible.
- Talk en Android utiliza la retransmisión en tiempo real del Gateway únicamente cuando `talk.realtime.mode` es `realtime` y `talk.realtime.transport` es `gateway-relay`.
- Android no anuncia la capacidad `voiceWake`. Use el dictado de Chat,
  una nota de voz o Talk para la entrada de voz.
- Familias adicionales de comandos de Android (la disponibilidad depende del dispositivo, los permisos y la configuración del usuario):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` solo cuando **Settings > Phone Capabilities > Installed Apps** está habilitado; de forma predeterminada, muestra las aplicaciones visibles en el iniciador (pase `includeNonLaunchable` para obtener la lista completa).
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
`operator.approvals` emparejada y seleccionada explícitamente por el Gateway, puede revisar
las solicitudes de ejecución pendientes en **Settings -> Approvals**. La aplicación carga el
registro de aprobación saneado del Gateway antes de habilitar sus botones, muestra cualquier
advertencia de seguridad y las decisiones exactas ofrecidas por esa solicitud, y envía
al Gateway el ID de aprobación y el tipo de propietario.

El estado de aprobación se comparte con la interfaz de control y las superficies de chat compatibles. La
primera respuesta confirmada prevalece; Android muestra ese resultado canónico incluso cuando
otra superficie haya respondido primero. Si se pierde una respuesta de resolución o el Gateway
se desconecta, la aplicación mantiene la acción bloqueada y vuelve a leer la aprobación
antes de ofrecer otra decisión.

Los Gateways anteriores a los métodos de aprobación unificados recurren a los métodos
específicos de ejecución incluidos. La revisión pendiente sigue funcionando, pero el estado
conservado del terminal y el resultado más completo entre superficies requieren un Gateway actualizado.

## Responder a las preguntas del agente

Chat muestra las preguntas pendientes del Gateway como tarjetas nativas para conexiones de operador
con `operator.questions` (o `operator.admin`). Las tarjetas admiten opciones de selección
única y múltiple, descripciones de opciones, respuestas **Other** de texto libre y una
cuenta atrás hasta el vencimiento. Las reconexiones vuelven a cargar las preguntas pendientes desde el Gateway. Una tarjeta
se bloquea cuando este dispositivo la responde, otra superficie responde primero o la
pregunta caduca o se cancela.

## Puntos de entrada del asistente

Android permite iniciar OpenClaw desde el activador del asistente del sistema (Google Assistant). Al mantener pulsado el botón de inicio (u otro activador `ACTION_ASSIST`), se abre la aplicación; decir "Hey Google, ask OpenClaw `<prompt>`" coincide con el patrón de consulta de App Actions declarado por la aplicación y transfiere la instrucción al editor de chat sin enviarla automáticamente.

Esto utiliza **App Actions** de Android (capacidad `shortcuts.xml`) declarada en el manifiesto de la aplicación. No se necesita configuración en el gateway: la intención del asistente se gestiona íntegramente en la aplicación Android.

<Note>
La disponibilidad de App Actions depende del dispositivo, la versión de Google Play Services y de si el usuario ha configurado OpenClaw como aplicación de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar las notificaciones del dispositivo al gateway como elementos `node.event`. Esto se configura **en el dispositivo**, en la hoja Settings de la aplicación, no en la configuración de gateway/`openclaw.json`.

| Configuración                     | Descripción                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reenviar eventos de notificación | Interruptor principal. Desactivado de forma predeterminada; primero debe concederse Notification Listener Access.                                                                                                              |
| Filtro de paquetes              | **Lista de permitidos** (solo se reenvían los identificadores de paquete incluidos) o **Lista de bloqueados** (valor predeterminado: todos los paquetes excepto los identificadores incluidos). El paquete propio de OpenClaw siempre se excluye en el modo de lista de bloqueados para evitar bucles de reenvío. |
| Horas de silencio                 | Intervalo local de inicio/fin en formato HH:mm durante el cual se suprime el reenvío. Desactivado de forma predeterminada; una vez activado, el valor predeterminado es `22:00`-`07:00`.                                                                                |
| Máximo de eventos/minuto         | Límite de frecuencia por dispositivo para las notificaciones reenviadas. Valor predeterminado: 20.                                                                                                                                          |
| Clave de sesión de enrutamiento           | Opcional. Fija los eventos de notificación reenviados en una sesión específica en lugar de usar la ruta de notificaciones predeterminada del dispositivo.                                                                               |

<Note>
El reenvío de notificaciones requiere el permiso Notification Listener de Android. La aplicación solicita este permiso durante la configuración.
</Note>

Las notificaciones de WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord y Signal siempre se excluyen. Sus mensajes ya pertenecen a sesiones de canal nativas de OpenClaw; reenviar la notificación de Android como un evento de Node independiente podría enrutar una respuesta a través de la conversación incorrecta.

## Contenido relacionado

- [Aplicación para iOS](/es/platforms/ios)
- [Nodes](/es/nodes)
- [Solución de problemas del Node de Android](/es/nodes/troubleshooting)
