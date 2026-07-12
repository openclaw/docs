---
read_when:
    - Emparejamiento o reconexión del Node de Android
    - Depuración del descubrimiento o la autenticación del Gateway en Android
    - Duplicar o controlar un dispositivo Android desde un Mac remoto
    - Verificación de la paridad del historial de chat entre clientes
summary: 'Aplicación para Android (nodo): guía operativa de conexión + conjunto de comandos de Conexión/Chat/Voz/Canvas'
title: Aplicación para Android
x-i18n:
    generated_at: "2026-07-12T14:35:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7cba1a3db2743dc9145ba5cd3eb3129b87952d7ec4090afd2776bb71a590627b
    source_path: platforms/android.md
    workflow: 16
---

<Note>
La aplicación oficial para Android está disponible en [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) y como APK independiente firmado en las [versiones de GitHub](https://github.com/openclaw/openclaw/releases) compatibles. Es un nodo complementario y requiere un Gateway de OpenClaw en ejecución. Código fuente: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([instrucciones de compilación](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Resumen de compatibilidad

- Función: aplicación de nodo complementario (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútelo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) o `OpenClaw-Android.apk` de una [versión de GitHub](https://github.com/openclaw/openclaw/releases) compatible, [Primeros pasos](/es/start/getting-started) para el Gateway y, a continuación, [Emparejamiento](/es/channels/pairing).
- Gateway: [Guía operativa](/es/gateway) + [Configuración](/es/gateway/configuration).
  - Protocolos: [Protocolo del Gateway](/es/gateway/protocol) (nodos + plano de control).

El control del sistema (launchd/systemd) reside en el host del Gateway; consulte [Gateway](/es/gateway).

## Instalación fuera de Google Play

Las versiones finales y de corrección habituales de GitHub incluyen un archivo universal `OpenClaw-Android.apk` y `OpenClaw-Android-SHA256SUMS.txt`. El APK se compila a partir de la etiqueta de la versión, se firma con la clave de publicación de OpenClaw para Android e incluye la procedencia de GitHub Actions.

Elija una [versión](https://github.com/openclaw/openclaw/releases) que incluya ambos recursos y, a continuación, descargue y verifique esa etiqueta exacta antes de instalarla de forma externa:

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
Las instalaciones desde Google Play y mediante el APK independiente utilizan canales de actualización diferentes y pueden tener identidades de firma distintas. Android puede exigir la desinstalación de la aplicación existente antes de cambiar de canal, lo que elimina sus datos locales. Manténgase en un solo canal para las actualizaciones normales.
</Warning>

## Duplicar y controlar Android desde un Mac remoto

[scrcpy](https://github.com/Genymobile/scrcpy) duplica la pantalla de Android en una ventana de macOS y
reenvía la entrada del teclado y del puntero mediante Android Debug Bridge (ADB). Este es un flujo de
trabajo del lado del operador, independiente de la conexión del nodo de OpenClaw. Resulta útil cuando
el dispositivo Android y el Mac están en ubicaciones diferentes, pero comparten una red privada de
Tailscale.

### Antes de comenzar

- Instale Tailscale en el dispositivo Android y en el Mac, y conecte ambos a la misma tailnet.
- En Android, active **Developer options** y **USB debugging**. Android 16 sitúa **Wireless
  debugging** en **Settings > System > Developer options**. Consulte las [opciones para
  desarrolladores de Android](https://developer.android.com/studio/debug/dev-options).
- Instale scrcpy y ADB en el Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Mantenga disponible el dispositivo Android para la primera conexión. Android debe aprobar la clave
  ADB de cada Mac antes de que este pueda controlar el dispositivo.

### Activación de ADB mediante TCP

Para la configuración inicial, conecte el dispositivo Android por USB a un equipo de confianza y
apruebe la solicitud de depuración. A continuación, ejecute:

```bash
adb devices
adb tcpip 5555
```

Ahora puede desconectar el USB. Si el puerto 5555 deja de escuchar después de reiniciar el dispositivo
o restablecer la depuración, repita este paso de configuración local. Android 11 y versiones posteriores
también pueden establecer la confianza inicial mediante **Wireless debugging > Pair device with pairing code**
y `adb pair`.

### Permitir únicamente el Mac controlador

Las tailnets con concesiones restrictivas deben permitir explícitamente que el Mac controlador acceda
al puerto TCP 5555 del dispositivo Android. Añada una regla específica a la política de la tailnet y
sustituya las direcciones de ejemplo por las IP estables de Tailscale de los dos dispositivos:

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

Consulte las [concesiones de Tailscale](https://tailscale.com/docs/reference/syntax/grants) para conocer
los alias de host y otros selectores. No permita el acceso a este puerto desde la Internet pública ni lo
exponga mediante Funnel: un cliente ADB autorizado dispone de un amplio control del dispositivo.

### Conexión e inicio de la duplicación

En el Mac remoto:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

El primer `adb connect` desde este Mac muestra un cuadro de diálogo de autorización en Android.
Desbloquee el dispositivo, confirme la huella digital de la clave y seleccione **Always allow from this computer**
solo si el Mac es de confianza. Una entrada correcta de `adb devices` termina en `device`; `unauthorized`
significa que todavía no se ha aprobado la solicitud en el dispositivo.

Cuando se abra la ventana de scrcpy, úsela directamente o diríjase a ella con una herramienta de
automatización de pantalla de macOS como [Peekaboo](https://peekaboo.sh/). scrcpy transmite la pantalla
y la entrada; Tailscale proporciona únicamente la ruta de red privada.

### Solución de problemas

- `Connection timed out`: compruebe la concesión de la tailnet para TCP 5555. Un `tailscale ping` correcto
  demuestra la accesibilidad entre pares, pero no que la política permita este puerto TCP. Realice la
  prueba desde el Mac con `nc -vz <android-tailnet-ip> 5555`.
- `unauthorized`: desbloquee Android y apruebe la clave ADB del Mac remoto, o elimine la estación de trabajo
  obsoleta en **Wireless debugging > Paired devices** y vuelva a emparejarla.
- `Connection refused`: vuelva a conectarlo localmente y ejecute otra vez `adb tcpip 5555`.
- Se muestra más de un dispositivo: mantenga el argumento explícito `--serial <android-tailnet-ip>:5555`.

Cuando termine, cierre scrcpy y desconecte ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Guía operativa de conexión

Aplicación de nodo de Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y utiliza el emparejamiento de dispositivos (`role: node`).

Para hosts de Tailscale o públicos, Android requiere un endpoint seguro:

- Opción preferida: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También se admite: cualquier otra URL `wss://` del Gateway con un endpoint TLS real
- El formato sin cifrar `ws://` sigue siendo compatible con direcciones de LAN privadas / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`)

### Requisitos previos

- Gateway en ejecución en otra máquina (o accesible mediante SSH).
- El dispositivo o emulador Android puede acceder al WebSocket del Gateway:
  - Misma LAN con mDNS/NSD, **o**
  - Misma tailnet de Tailscale mediante Bonjour de área extensa / DNS-SD unidifusión (véase más adelante), **o**
  - Host/puerto manual del Gateway (alternativa)
- El emparejamiento móvil mediante tailnet o hosts públicos **no** utiliza endpoints `ws://` con IP sin procesar de la tailnet. Utilice en su lugar Tailscale Serve u otra URL `wss://`.
- La CLI `openclaw` está disponible en la máquina del Gateway (o mediante SSH) para aprobar las solicitudes de emparejamiento.

### 1. Iniciar el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirme que en los registros aparezca algo parecido a:

- `listening on ws://0.0.0.0:18789`

Para el acceso remoto de Android mediante Tailscale, es preferible utilizar Serve/Funnel en lugar de una vinculación directa a la tailnet:

```bash
openclaw gateway --tailscale serve
```

Esto proporciona a Android un endpoint seguro `wss://` / `https://`. Una configuración simple `gateway.bind: "tailnet"` no es suficiente para el primer emparejamiento remoto de Android, salvo que también finalice TLS por separado.

### 2. Verificar la detección (opcional)

Desde la máquina del Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también ha configurado un dominio de detección de área extensa, compárelo con:

```bash
openclaw gateway discover --json
```

Esto muestra `local.` y el dominio de área extensa configurado en una sola operación, utilizando el endpoint resuelto del servicio en lugar de indicaciones basadas únicamente en TXT.

#### Detección entre redes mediante DNS-SD unidifusión

La detección NSD/mDNS de Android no atraviesa redes. Si el nodo Android y el Gateway se encuentran en redes distintas, pero están conectados mediante Tailscale, utilice Bonjour de área extensa / DNS-SD unidifusión. La detección por sí sola no basta para emparejar Android mediante una tailnet o un host público: la ruta detectada sigue necesitando un endpoint seguro (`wss://` o Tailscale Serve):

1. Configure una zona DNS-SD (por ejemplo, `openclaw.internal.`) en el host del Gateway y publique registros `_openclaw-gw._tcp`.
2. Configure el DNS dividido de Tailscale para el dominio elegido de modo que apunte a ese servidor DNS.

Detalles y configuración de ejemplo de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3. Conectarse desde Android

En la aplicación para Android:

- La aplicación mantiene activa la conexión con el Gateway mediante un **servicio en primer plano** (notificación persistente).
- Abra la pestaña **Connect**.
- Utilice el modo **Setup Code** o **Manual**.
- Si la detección está bloqueada, utilice el host/puerto manual en **Advanced controls**. Para los hosts de una LAN privada, `ws://` sigue funcionando. Para hosts públicos o de Tailscale, active TLS y utilice un endpoint `wss://` / Tailscale Serve.

Después del primer emparejamiento correcto, Android vuelve a conectarse automáticamente al iniciarse al Gateway emparejado activo (según disponibilidad en el caso de los gateways detectados, que deben estar visibles en la red).

### Varios gateways

La aplicación conserva un registro de todos los gateways con los que se ha emparejado, por lo que puede cambiar de uno a otro sin repetir el emparejamiento:

- **Settings -> Gateways** muestra los gateways emparejados e indica cuál está activo. Toque una entrada para cambiar; la aplicación cierra las sesiones actuales y vuelve a conectarse al Gateway seleccionado.
- La pestaña **Connect** muestra un selector rápido cuando hay más de un Gateway emparejado.
- Las credenciales, los tokens del dispositivo, la confianza TLS, el historial de chat y los mensajes sin conexión en cola se almacenan por Gateway. El cambio nunca mezcla el estado entre gateways y los mensajes puestos en cola mientras no había conexión solo se entregan al Gateway para el que se escribieron.
- **Forget** elimina la entrada de registro de un Gateway junto con sus credenciales, tokens del dispositivo, anclaje TLS y chats almacenados en caché.

### Señales de presencia activa

Después de conectar la sesión autenticada del nodo y cuando la aplicación pasa a segundo plano mientras el servicio en primer plano sigue conectado, Android llama a `node.event` con `event: "node.presence.alive"`. El Gateway registra este evento como `lastSeenAtMs`/`lastSeenReason` en los metadatos del nodo o dispositivo emparejado únicamente después de conocer la identidad autenticada del dispositivo del nodo.

La aplicación considera que la señal se ha registrado correctamente solo cuando la respuesta del Gateway incluye `handled: true`. Los gateways anteriores pueden confirmar `node.event` con `{ "ok": true }`; esta respuesta es compatible, pero no cuenta como una actualización persistente de la última actividad.

### 4. Aprobar el emparejamiento (CLI)

En la máquina del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles del emparejamiento: [Emparejamiento](/es/channels/pairing).

Opcional: si el nodo Android siempre se conecta desde una subred estrictamente controlada, puede habilitar la aprobación automática del primer emparejamiento del nodo mediante CIDR explícitos o direcciones IP exactas:

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

Esta opción está desactivada de forma predeterminada. Solo se aplica a emparejamientos nuevos con `role: node` y sin ámbitos solicitados. El emparejamiento de operadores o navegadores y cualquier cambio de función, ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

### 5. Verificar que el nodo esté conectado

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat e historial

La pestaña Chat de Android permite seleccionar una sesión (`main` de forma predeterminada, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para visualización: se eliminan las etiquetas de directivas en línea, las cargas XML de llamadas a herramientas en texto sin formato (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` y variantes truncadas) y los tokens de control del modelo filtrados en ASCII o de ancho completo; se omiten las filas silenciosas del asistente, como las que contienen exactamente `NO_REPLY` / `no_reply`; las filas demasiado grandes pueden sustituirse por marcadores de posición)
- Envío: `chat.send`
- Envío duradero: cada envío (texto, imágenes seleccionadas y notas de voz) se registra en una bandeja de salida por Gateway en el dispositivo antes de cualquier intento de red, de modo que el cierre de la aplicación no pueda provocar la pérdida de las entradas enviadas. Los envíos puestos en cola sin conexión se entregan en orden al reconectarse, con claves de idempotencia estables, y un envío solo se retira cuando el turno aparece en el `chat.history` canónico; una confirmación por sí sola no se considera prueba de entrega. Los resultados ambiguos (confirmación perdida, aplicación cerrada durante el envío o reinicio del Gateway antes de escribir la transcripción) aparecen como filas visibles con las opciones explícitas **Reintentar**/**Eliminar**, en lugar de reenviarse automáticamente. Los comandos con barra nunca se reproducen automáticamente tras una reconexión; quedan pendientes para que se reintenten explícitamente. La cola está limitada (50 mensajes y 48 MB de datos adjuntos por Gateway) y las filas no enviadas caducan después de 48 horas. Los borradores del redactor que nunca se enviaron no persisten tras finalizar el proceso.
- Actualizaciones push (según disponibilidad): `chat.subscribe` -> `event:"chat"`
- Escuchar: mantenga pulsado un mensaje del asistente y elija **Escuchar** para oírlo; el audio se genera mediante `tts.speak` del Gateway con la cadena de proveedores de TTS configurada, y se utiliza el TTS del sistema en el dispositivo cuando el Gateway no puede generar el audio. La reproducción se detiene al cambiar de sesión, iniciar un chat nuevo, pasar la aplicación a segundo plano o cerrar el chat.

### 7. Canvas + cámara

#### Host de Canvas del Gateway (recomendado para contenido web)

Para que el Node muestre HTML/CSS/JS real que el agente pueda editar en el disco, dirija el Node al host de Canvas del Gateway.

<Note>
Los Nodes cargan Canvas desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, cuyo valor predeterminado es `18789`).
</Note>

1. Cree `~/.openclaw/workspace/canvas/index.html` en el host del Gateway.
2. Dirija el Node a esa ubicación (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, use un nombre de MagicDNS o una IP de tailnet en lugar de `.local`, por ejemplo, `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inyecta en el HTML un cliente de recarga en vivo y vuelve a cargar cuando cambian los archivos. El Gateway también sirve `/__openclaw__/a2ui/`, pero la aplicación para Android trata las páginas A2UI remotas como páginas de solo representación. Los comandos A2UI con capacidad de ejecutar acciones utilizan la página A2UI incluida y propiedad de la aplicación.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (use `{"url":""}` o `{"url":"/"}` para volver a la estructura predeterminada). `canvas.snapshot` devuelve `{ format, base64 }` (valor predeterminado: `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias heredado `canvas.a2ui.pushJSONL`). Estos utilizan la página A2UI incluida y propiedad de la aplicación para la representación con capacidad de ejecutar acciones.

Comandos de la cámara (solo en primer plano; sujetos a permisos): `camera.snap` (jpg), `camera.clip` (mp4). Consulte [Node de cámara](/es/nodes/camera) para conocer los parámetros y los auxiliares de la CLI.

### 8. Voz + superficie ampliada de comandos de Android

- Pestaña Voz: Android tiene dos modos de captura explícitos. **Micrófono** es una sesión manual de la pestaña Voz que envía cada pausa como un turno de chat y se detiene cuando la aplicación deja de estar en primer plano o el usuario sale de la pestaña Voz. **Hablar** es el modo Hablar continuo y sigue escuchando hasta que se desactiva o el Node se desconecta.
- El modo Hablar promociona el servicio existente en primer plano de `connectedDevice` a `connectedDevice|microphone` antes de iniciar la captura y vuelve a degradarlo cuando se detiene el modo Hablar. El servicio del Node declara `FOREGROUND_SERVICE_CONNECTED_DEVICE` con `CHANGE_NETWORK_STATE`; Android 14+ también requiere la declaración `FOREGROUND_SERVICE_MICROPHONE`, el permiso de ejecución `RECORD_AUDIO` y el tipo de servicio de micrófono durante la ejecución.
- De forma predeterminada, Hablar en Android utiliza el reconocimiento de voz nativo, el chat del Gateway y `talk.speak` mediante el proveedor de Hablar configurado en el Gateway. El TTS del sistema local solo se utiliza cuando `talk.speak` no está disponible.
- Hablar en Android solo utiliza la retransmisión en tiempo real del Gateway cuando `talk.realtime.mode` es `realtime` y `talk.realtime.transport` es `gateway-relay`.
- Android no anuncia la capacidad `voiceWake`. Use **Micrófono** o **Hablar** para la entrada de voz.
- Familias adicionales de comandos de Android (la disponibilidad depende del dispositivo, los permisos y la configuración del usuario):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` solo cuando **Settings > Phone Capabilities > Installed Apps** está habilitado; muestra de forma predeterminada las aplicaciones visibles en el iniciador (pase `includeNonLaunchable` para obtener la lista completa).
  - `notifications.list`, `notifications.actions` (consulte [Reenvío de notificaciones](#notification-forwarding) a continuación)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Archivos del espacio de trabajo (solo lectura)

La vista general de Inicio incluye una tarjeta **Archivos** que permite explorar el espacio de trabajo del agente activo mediante los RPC de solo lectura `agents.workspace.list` / `agents.workspace.get` del Gateway: navegación por directorios, vistas previas de texto e imágenes y exportación mediante la hoja para compartir de Android. No hay operaciones de escritura y el Gateway limita el tamaño de las vistas previas.

## Revisión de aprobaciones de comandos

Una conexión de operador con `operator.admin`, o una conexión
`operator.approvals` emparejada y destinada explícitamente por el Gateway, puede revisar
las solicitudes de ejecución pendientes en **Settings -> Approvals**. La aplicación carga el
registro de aprobación saneado del Gateway antes de habilitar sus botones, muestra cualquier
advertencia de seguridad y las decisiones exactas que ofrece esa solicitud, y devuelve
al Gateway el ID de aprobación y el tipo de propietario.

El estado de aprobación se comparte con la interfaz de control y las superficies de chat compatibles. La
primera respuesta confirmada prevalece; Android muestra ese resultado canónico incluso cuando
otra superficie haya respondido primero. Si se pierde una respuesta de resolución o el Gateway
se desconecta, la aplicación mantiene la acción bloqueada y vuelve a leer la aprobación
antes de ofrecer otra decisión.

Los Gateways anteriores a los métodos de aprobación unificados recurren a los métodos
específicos de ejecución incluidos. La revisión pendiente sigue funcionando, pero el estado
de terminal conservado y el resultado más completo entre superficies requieren un Gateway actualizado.

## Puntos de entrada del asistente

Android permite iniciar OpenClaw desde el activador del asistente del sistema (Google Assistant). Al mantener pulsado el botón de inicio (u otro activador `ACTION_ASSIST`), se abre la aplicación; al decir "Hey Google, ask OpenClaw `<prompt>`", se reconoce el patrón de consulta de App Actions declarado por la aplicación y se transfiere la instrucción al redactor del chat sin enviarla automáticamente.

Esto utiliza las **App Actions** de Android (capacidad de `shortcuts.xml`) declaradas en el manifiesto de la aplicación. No se necesita ninguna configuración en el Gateway: la intención del asistente se gestiona íntegramente mediante la aplicación para Android.

<Note>
La disponibilidad de App Actions depende del dispositivo, de la versión de Google Play Services y de si el usuario ha establecido OpenClaw como aplicación de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar las notificaciones del dispositivo al Gateway como elementos `node.event`. Esto se configura **en el dispositivo**, en la hoja Settings de la aplicación, no en la configuración del Gateway/`openclaw.json`.

| Configuración               | Descripción                                                                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | Interruptor principal. Desactivado de forma predeterminada; primero se debe conceder acceso al receptor de notificaciones.                                                                                                   |
| Package Filter              | **Allowlist** (solo se reenvían los ID de paquete indicados) o **Blocklist** (valor predeterminado: todos los paquetes excepto los ID indicados). El paquete propio de OpenClaw siempre se excluye en el modo Blocklist para evitar bucles de reenvío. |
| Quiet Hours                 | Intervalo local de inicio/fin en formato HH:mm que suprime el reenvío. Deshabilitado de forma predeterminada; una vez habilitado, el valor predeterminado es `22:00`-`07:00`.                                                |
| Max Events / Minute         | Límite de frecuencia por dispositivo para las notificaciones reenviadas. Valor predeterminado: 20.                                                                                                                           |
| Route Session Key           | Opcional. Fija los eventos de notificaciones reenviadas a una sesión específica en lugar de usar la ruta de notificaciones predeterminada del dispositivo.                                                                  |

<Note>
El reenvío de notificaciones requiere el permiso de receptor de notificaciones de Android. La aplicación solicita este permiso durante la configuración.
</Note>

Las notificaciones de WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord y Signal siempre se excluyen. Sus mensajes ya pertenecen a sesiones de canales nativos de OpenClaw; reenviar la notificación de Android como un evento independiente del Node podría dirigir una respuesta a través de una conversación incorrecta.

## Relacionado

- [Aplicación para iOS](/es/platforms/ios)
- [Nodes](/es/nodes)
- [Solución de problemas del Node de Android](/es/nodes/troubleshooting)
