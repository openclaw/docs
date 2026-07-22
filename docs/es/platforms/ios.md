---
read_when:
    - Emparejamiento o reconexión del Node de iOS
    - Activación o solución de problemas del Node directo de Apple Watch
    - Ejecutar la aplicación para iOS desde el código fuente
    - Depuración del descubrimiento del Gateway o de los comandos de canvas
summary: 'Aplicación de Node para iOS: conexión al Gateway, emparejamiento, lienzo y solución de problemas'
title: Aplicación para iOS
x-i18n:
    generated_at: "2026-07-22T13:19:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2b01a63fa1e2c445f7fb35843536f7f5918e94bfe885dac19c852d7d52d86342
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: las compilaciones de la aplicación para iPhone se distribuyen a través de los canales de Apple cuando están habilitadas para una versión. Las compilaciones de desarrollo local también pueden ejecutarse desde el código fuente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone las capacidades del nodo: Canvas, captura de pantalla, captura de cámara, ubicación, modo de conversación, activación por voz y resúmenes opcionales de Salud.
- Recibe comandos `node.invoke` e informa de eventos de estado del nodo.
- Permite explorar en modo de solo lectura el espacio de trabajo del agente seleccionado desde la superficie Agentes (Archivos): navegación por directorios, vistas previas de texto con resaltado de sintaxis, vistas previas de imágenes y exportación mediante la hoja para compartir. No permite operaciones de escritura; el Gateway limita el tamaño de las vistas previas.
- Mantiene una pequeña caché sin conexión y de solo lectura de las sesiones de chat y transcripciones recientes para cada Gateway emparejado: al abrir la aplicación desde cero, muestra inmediatamente la última transcripción conocida y la actualiza cuando responde el Gateway; los chats recientes siguen disponibles para su consulta mientras no hay conexión, y restablecer u olvidar elimina la caché local protegida.
- Pone en cola los mensajes de texto enviados sin conexión en una bandeja de salida duradera por Gateway (hasta 50): las burbujas en cola aparecen en la transcripción, se envían en orden al restablecerse la conexión con reintentos idempotentes, permanecen almacenadas hasta que el historial canónico confirma el envío, vuelven a intentarse con espera incremental antes de mostrar una acción para reintentar o eliminar y caducan en lugar de enviarse tras 48 horas sin conexión; restablecer u olvidar borra la cola junto con la caché.
- Chat es la única superficie de texto y voz. Las acciones de Chat pueden abrir la pantalla completa de Sesiones sin salir de Chat y pueden mostrar u ocultar el razonamiento del asistente y la actividad de las herramientas. Toque el micrófono para dictar un borrador, abra su menú para grabar una nota de voz o use el control integrado de conversación para la voz en tiempo real; el control de conversación se anima según el nivel del micrófono en directo o de la reproducción mientras escucha o habla.
- **Settings -> OpenClaw** abre un asistente específico para la configuración del Gateway cuando la conexión del operador tiene `operator.admin` y el Gateway admite `openclaw.chat`. Su conversación de configuración permanece separada del Chat habitual, oculta localmente las respuestas secretas y solo pasa a Chat después de tocar **Open Chat**.
- Reproduce los mensajes del asistente a petición: mantenga pulsado un mensaje en Chat y elija **Listen**. La aplicación reproduce los clips `tts.speak` compatibles del Gateway con el proveedor de TTS configurado y recurre a la voz del dispositivo cuando el audio del Gateway no está disponible o no puede reproducirse. La reproducción se detiene al cambiar de sesión o enviar la aplicación a segundo plano.

## Requisitos

- Un Gateway en ejecución en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - La misma LAN mediante Bonjour, **o**
  - Una tailnet mediante DNS-SD unidifusión (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host y puerto manuales (alternativa).

## Inicio rápido (emparejar y conectar)

En el primer inicio, la aplicación muestra una breve explicación del
emparejamiento y una página de permisos (notificaciones, cámara, micrófono,
fotos, contactos, calendario, recordatorios y ubicación). Todos los permisos
son opcionales y pueden modificarse posteriormente en **Settings** -> **Permissions**
o en la aplicación Ajustes de iOS.

1. Inicie un Gateway autenticado con una ruta accesible desde el teléfono. Tailscale
   Serve es la ruta remota recomendada:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Para una configuración de confianza en la misma LAN, use en su lugar un
`gateway.bind: "lan"` autenticado. La vinculación predeterminada a la interfaz de
bucle invertido no es accesible desde un teléfono. Si el Gateway aún no se ha
configurado, ejecute primero `openclaw onboard` para que la creación del código
de configuración disponga de una ruta de autenticación mediante token o contraseña.

2. Abra la [interfaz de control](/es/web/control-ui), seleccione **Nodes** y haga clic en
   **Pair mobile device** en la página **Devices**. Se recomienda el acceso
   completo y está seleccionado de forma predeterminada; elija Limited access
   solo cuando quiera omitir los controles administrativos del Gateway y, a
   continuación, haga clic en **Create setup code**.

3. En la aplicación para iOS, abra **Settings** -> **Gateway**, escanee el código QR
   (o pegue el código de configuración) y conéctese.

   Si el código de configuración contiene rutas tanto de LAN como de Tailscale
   Serve, la aplicación las comprueba en orden y guarda el primer punto de
   conexión accesible.

   Los gateways emparejados permanecen en la lista **Gateways**. La marca de
   verificación identifica el Gateway activo; use el control con forma de rayo
   de otra fila para mantener conectada al mismo tiempo su sesión de operador.
   Cambiar el Gateway activo no desconecta los demás gateways habilitados. Solo
   el Gateway activo recibe la sesión del nodo del iPhone que contiene sus
   capacidades, por lo que los comandos de cámara, pantalla, ubicación y otros
   comandos del dispositivo siempre tienen un único propietario inequívoco. iOS
   puede suspender estas conexiones en primer plano después de que la aplicación
   pase a segundo plano.

4. La aplicación oficial se conecta automáticamente. Si **Pending approval** muestra
   una solicitud, revise su rol y ámbitos antes de aprobarla.

   **Settings → Gateway** indica si la conexión de operador guardada tiene
   acceso **Full** o **Limited**. La configuración `ws://` de LAN en texto
   sin cifrar se limita automáticamente por motivos de seguridad del token al
   portador. Si está limitada, configure `wss://` o Tailscale Serve,
   escanee un nuevo código de acceso completo desde la interfaz de control o
   `openclaw qr` y vuelva a conectarse para habilitar la configuración y las
   actualizaciones.

El botón de la interfaz de control requiere una sesión ya emparejada con `operator.admin`.
Como alternativa desde la terminal, elija un Gateway detectado en la aplicación
para iOS (o habilite Manual Host e introduzca el host y el puerto) y, a
continuación, apruebe la solicitud en el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la aplicación vuelve a intentar el emparejamiento con datos de autenticación modificados (rol, ámbitos o clave pública), la solicitud pendiente anterior se sustituye y se crea un nuevo `requestId`. Vuelva a ejecutar `openclaw devices list` antes de aprobarla.

Opcional: si el nodo de iOS siempre se conecta desde una subred estrictamente controlada, puede habilitar la aprobación automática del nodo durante el primer emparejamiento mediante CIDR explícitos o direcciones IP exactas:

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

Esta opción está deshabilitada de forma predeterminada. Solo se aplica a emparejamientos `role: node` nuevos sin ámbitos solicitados. El emparejamiento de operadores o navegadores y cualquier cambio de rol, ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

5. Verifique la conexión:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resúmenes de salud

El nodo de iOS puede devolver un agregado de HealthKit opcional y de solo
lectura correspondiente al día natural actual. El consentimiento del dispositivo
iOS y la autorización explícita de comandos del Gateway son controles
independientes. Consulte [Resúmenes de HealthKit](/es/platforms/ios-healthkit) para
obtener información sobre la configuración, la invocación, los campos de la
carga útil, el comportamiento de privacidad y la resolución de problemas.

De forma predeterminada, la aplicación complementaria de Apple Watch sigue
usando el relé existente del iPhone y no necesita un emparejamiento independiente
con el Gateway. Empareje el Watch con el iPhone en la aplicación Watch de Apple,
instale OpenClaw desde **Watch app -> My Watch -> Available Apps** y, a
continuación, abra OpenClaw una vez en ambos dispositivos.

## Revisión de aprobaciones de comandos

Una conexión de operador con `operator.admin`, o una conexión
`operator.approvals` emparejada a la que el Gateway se dirija explícitamente,
puede revisar solicitudes de ejecución pendientes en el iPhone. La tarjeta de
aprobación muestra la vista previa saneada del comando proporcionada por el
Gateway, la advertencia, el contexto del host, la caducidad y únicamente las
decisiones ofrecidas por esa solicitud. El Apple Watch emparejado recibe la
misma solicitud segura para el revisor mediante el relé existente del iPhone y
ofrece el subconjunto compacto de decisiones de permitir una vez o denegar. El
modo de Gateway directo del Watch no transmite solicitudes de aprobación.

El estado de aprobación se comparte con la interfaz de control y las superficies
de chat compatibles. La primera respuesta confirmada prevalece. El iPhone y el
Watch obtienen el registro terminal canónico del Gateway después de que otra
superficie resuelva la solicitud, tras una notificación remota de resolución y
siempre que pueda haberse perdido una confirmación de resolución. Las acciones
permanecen deshabilitadas hasta que esa nueva lectura confirma si la solicitud
sigue pendiente.

La propiedad de la aprobación está vinculada al Gateway seleccionado. Cambiar
de Gateway no permite aplicar una solicitud anterior a la conexión sustituta.
Los gateways anteriores a los métodos de aprobación unificados recurren a los
métodos específicos de ejecución incluidos en la versión distribuida; para
conservar el estado terminal y obtener resultados más completos entre
superficies se requiere un Gateway actualizado.

## Responder a las preguntas del agente

Chat muestra las preguntas pendientes del Gateway como tarjetas nativas para
las conexiones de operador con `operator.questions` (o `operator.admin`). Las
tarjetas admiten opciones de selección única y múltiple, descripciones de las
opciones, respuestas de texto libre **Other** y una cuenta atrás hasta la
caducidad. Al volver a conectarse, se cargan de nuevo las preguntas pendientes
desde el Gateway. Una tarjeta se bloquea cuando este dispositivo responde,
cuando otra superficie responde primero o cuando la pregunta caduca o se
cancela.

## Nodo directo opcional de Apple Watch

El modo directo proporciona al reloj su propia identidad de nodo firmada y su
propia conexión con el Gateway. Los comandos de nodo compatibles siguen
funcionando mediante la red Wi-Fi o celular del reloj mientras OpenClaw está
activo, incluso cuando el iPhone emparejado no está disponible.

Requisitos:

- El iPhone está conectado al Gateway con el ámbito `operator.admin`.
- El código de configuración anuncia un punto de conexión `wss://` del Gateway con un certificado de confianza
  para watchOS; el reloj consulta periódicamente el origen `https://` correspondiente. No se admiten HTTP sin cifrar ni
  certificados autofirmados o basados únicamente en una huella digital. Consulte [Emparejamiento
  gestionado por el Gateway](/es/gateway/pairing) para configurar el punto de conexión. Las rutas de bucle invertido, exclusivas del iPhone
  y exclusivas de la tailnet no son accesibles de forma independiente para el reloj.
- El uso de la red celular requiere un Apple Watch con capacidad celular y servicio activo.
- OpenClaw está activo en el reloj. Apple no permite que las aplicaciones watchOS convencionales
  mantengan conexiones WebSocket/TCP genéricas, por lo que el nodo directo utiliza consultas HTTPS
  breves y vuelve a conectarse cuando la aplicación regresa al primer plano. Consulte las
  [directrices de Apple sobre redes de bajo nivel en watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configuración:

1. En el iPhone, abra **Settings -> Apple Watch**.
2. Toque **Enable Direct Gateway Connection**.
3. Abra OpenClaw en el reloj antes de que caduque el código de configuración de corta duración.
4. Verifique la fila independiente de Apple Watch con `openclaw nodes status`.

El código de configuración contiene una credencial de arranque de corta
duración y exclusiva del nodo; trátela como una contraseña hasta que caduque.
Nunca contiene la contraseña ni el token del Gateway guardados en el iPhone.
Después del emparejamiento, el reloj almacena su propio token de dispositivo y
elimina la credencial de arranque. El modo directo solo abarca los comandos
indicados a continuación. Chat, el modo de conversación, las aprobaciones y el
flujo de notificaciones `watch.*` existente siguen siendo funciones del
relé del iPhone y continúan requiriendo el iPhone emparejado.

Comandos directos del nodo de watchOS:

| Superficie    | Comandos                       | Notas                                                    |
| ------------- | ------------------------------ | -------------------------------------------------------- |
| Dispositivo   | `device.info`, `device.status` | Identidad, batería, temperatura, almacenamiento y red del Watch. |
| Notificaciones | `system.notify`                | Mientras la aplicación está activa; requiere permiso del Watch. |

watchOS no proporciona WebKit a las aplicaciones de terceros, por lo que el
nodo directo del Watch no anuncia comandos de Canvas.

## Notificaciones push mediante relé para compilaciones oficiales

Las compilaciones oficiales distribuidas para iOS utilizan un relé push externo en lugar de publicar el token APNs sin procesar en el Gateway. Las compilaciones oficiales de App Store del canal público de versiones utilizan el relé alojado en `https://ios-push-relay.openclaw.ai`; esta URL base está codificada de forma fija para la distribución mediante App Store y no lee ninguna sobrescritura.

Las implementaciones con un relé personalizado requieren una ruta de compilación e implementación para iOS deliberadamente independiente cuya URL de relé coincida con la URL de relé del Gateway. El canal de versiones de App Store nunca acepta una URL de relé personalizada. Si se utiliza una compilación con relé personalizado, establezca la URL de relé correspondiente del Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Cómo funciona el flujo:

- La aplicación de iOS se registra en el relé mediante App Attest y un JWS de transacción de la aplicación de StoreKit.
- El relé devuelve un identificador de relé opaco junto con una autorización de envío limitada al registro.
- La aplicación de iOS obtiene la identidad del Gateway emparejado (`gateway.identity.get`) y la incluye en el registro del relé, de modo que el registro respaldado por el relé queda delegado a ese Gateway específico.
- La aplicación reenvía ese registro respaldado por el relé al Gateway emparejado mediante `push.apns.register`.
- El Gateway utiliza ese identificador de relé almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- Si posteriormente la aplicación se conecta a otro Gateway o a una compilación con una URL base de relé distinta, actualiza el registro del relé en lugar de reutilizar la vinculación anterior.

Lo que el Gateway **no** necesita para esta ruta: ningún token de relé para todo el despliegue ni una clave directa de APNs para los envíos oficiales de App Store respaldados por el relé.

Flujo previsto para el operador:

1. Instalar la aplicación oficial de iOS.
2. Opcional: establecer `gateway.push.apns.relay.baseUrl` en el Gateway únicamente cuando se utilice deliberadamente una compilación de relé personalizada e independiente.
3. Emparejar la aplicación con el Gateway y dejar que termine de conectarse.
4. La aplicación publica `push.apns.register` una vez que tiene un token de APNs, la sesión del operador está conectada y el registro del relé se completa correctamente.
5. Después, `push.test`, las activaciones por reconexión y los avisos de activación pueden utilizar el registro respaldado por el relé almacenado.

## Señales de actividad en segundo plano

Cuando iOS activa la aplicación mediante una notificación push silenciosa, una actualización en segundo plano o un evento de cambio significativo de ubicación, la aplicación intenta una breve reconexión del Node y luego llama a `node.event` con `event: "node.presence.alive"`. El Gateway registra esta información como `lastSeenAtMs`/`lastSeenReason` en los metadatos del Node/dispositivo emparejado únicamente después de conocer la identidad autenticada del dispositivo Node.

La aplicación considera que una activación en segundo plano se ha registrado correctamente solo cuando la respuesta del Gateway incluye `handled: true`. Los Gateway anteriores pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización duradera de la última vez que se vio el dispositivo.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` sigue funcionando como reemplazo temporal mediante una variable de entorno para el Gateway (`gateway.push.apns.relay.baseUrl` es la ruta que prioriza la configuración).
- El modo push de la compilación de lanzamiento de App Store incorpora de forma fija el host del relé alojado y nunca lee una URL de relé alternativa; la variable de entorno de compilación `OPENCLAW_PUSH_RELAY_BASE_URL` solo afecta a los modos de compilación local o de entorno aislado de iOS.

## Flujo de autenticación y confianza

El relé existe para aplicar dos restricciones que el uso directo de APNs desde el Gateway no puede proporcionar para las compilaciones oficiales de iOS:

- Solo las compilaciones auténticas de OpenClaw para iOS distribuidas a través de Apple pueden utilizar el relé alojado.
- Un Gateway solo puede enviar notificaciones push respaldadas por el relé a dispositivos iOS emparejados con ese Gateway específico.

Paso a paso:

1. `iOS app -> gateway`: la aplicación se empareja con el Gateway mediante el flujo de autenticación normal del Gateway, lo que le proporciona una sesión de Node autenticada y una sesión de operador autenticada. La sesión del operador llama a `gateway.identity.get`.
2. `iOS app -> relay`: la aplicación llama a los endpoints de registro del relé mediante HTTPS con una prueba de App Attest y un JWS de transacción de la aplicación de StoreKit. El relé valida el ID del paquete, la prueba de App Attest y la prueba de distribución de Apple, y exige la ruta de distribución oficial/de producción; esto impide que las compilaciones locales de Xcode/desarrollo utilicen el relé alojado, ya que una compilación local no puede satisfacer la prueba de distribución oficial de Apple.
3. `gateway identity delegation`: antes de registrarse en el relé, la aplicación obtiene la identidad del Gateway emparejado desde `gateway.identity.get` y la incluye en la carga útil de registro del relé. El relé devuelve un identificador de relé y una autorización de envío limitada al registro y delegada a esa identidad del Gateway.
4. `gateway -> relay`: el Gateway almacena el identificador del relé y la autorización de envío procedentes de `push.apns.register`. Durante `push.test`, las activaciones por reconexión y los avisos de activación, el Gateway firma la solicitud de envío con su propia identidad de dispositivo; el relé verifica tanto la autorización de envío almacenada como la firma del Gateway con respecto a la identidad del Gateway delegada durante el registro. Otro Gateway no puede reutilizar ese registro almacenado, aunque de algún modo obtenga el identificador.
5. `relay -> APNs`: el relé posee las credenciales de APNs de producción y el token de APNs sin procesar de la compilación oficial. El Gateway nunca almacena el token de APNs sin procesar de las compilaciones oficiales respaldadas por el relé; el relé envía la notificación push final a APNs en nombre del Gateway emparejado.

Motivo de este diseño: mantener las credenciales de APNs de producción fuera de los Gateway de los usuarios, evitar almacenar en el Gateway los tokens de APNs sin procesar de la compilación oficial, permitir el uso del relé alojado solo a las compilaciones oficiales de OpenClaw para iOS e impedir que un Gateway envíe notificaciones push de activación a dispositivos iOS pertenecientes a otro Gateway.

Las compilaciones locales/manuales siguen utilizando APNs directamente. Si se prueban esas compilaciones sin el relé, el Gateway aún necesita credenciales directas de APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de ejecución del host del Gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena datos de autenticación de App Store Connect, como `APP_STORE_CONNECT_KEY_ID` y `APP_STORE_CONNECT_ISSUER_ID`; no configura la entrega directa mediante APNs para las compilaciones locales de iOS.

Almacenamiento recomendado en el host del Gateway, coherente con las demás credenciales de proveedores en `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

No confirmar el archivo `.p8` en el repositorio ni colocarlo dentro de la copia de trabajo del repositorio.

## Rutas de detección

### Bonjour (LAN)

La aplicación de iOS explora `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo dominio de detección DNS-SD de área amplia. Los Gateway de la misma LAN aparecen automáticamente mediante `local.`; la detección entre redes puede utilizar el dominio de área amplia configurado sin cambiar el tipo de señal.

### Tailnet (entre redes)

Si mDNS está bloqueado, utilizar una zona DNS-SD unicast (elegir un dominio; ejemplo: `openclaw.internal.`) y el DNS dividido de Tailscale. Consultar [Bonjour](/es/gateway/bonjour) para ver el ejemplo de CoreDNS.

### Host/puerto manual

En Settings, activar **Manual Host** e introducir el host y el puerto del Gateway (valor predeterminado: `18789`).

## Varios Gateway

La aplicación conserva un registro de todos los Gateway con los que se ha emparejado, lo que permite alternar entre ellos sin volver a realizar el emparejamiento:

- **Settings -> Gateway** muestra una lista **Paired Gateways** con el Gateway activo marcado. Tocar una entrada para cambiar; la aplicación cierra las sesiones actuales y vuelve a conectarse al Gateway seleccionado. Cuando hay más de un Gateway emparejado, aparece un menú de cambio rápido junto a la fila de conexión.
- Las credenciales, las decisiones de confianza de TLS, las preferencias específicas de cada Gateway y el historial de chat almacenado en caché se guardan por Gateway. El cambio nunca mezcla el estado entre Gateway, y el registro de notificaciones push sigue al Gateway activo.
- Deslizar un Gateway emparejado (o utilizar su menú contextual) para **Forget** y eliminar sus credenciales, tokens de dispositivo, pin de TLS y chats almacenados en caché.
- Los Gateway detectados deben estar visibles en la red para poder cambiar a ellos; los Gateway manuales se reconectan mediante el host y el puerto guardados.

## Canvas + A2UI

El Node de iOS representa un canvas de WKWebView. Utilizar `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host del canvas del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/` desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, valor predeterminado: `18789`).
- El Node de iOS mantiene la estructura integrada como vista conectada predeterminada. `canvas.a2ui.push` y `canvas.a2ui.reset` utilizan la página A2UI incluida y propiedad de la aplicación.
- Las páginas A2UI remotas del Gateway son de solo representación en iOS; las acciones nativas de los botones A2UI solo se aceptan desde páginas incluidas y propiedad de la aplicación.
- Volver a la estructura integrada con `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La aplicación de iOS es una superficie de Node móvil, no un backend de Codex Computer Use. Codex Computer Use y `cua-driver mcp` controlan un escritorio macOS local mediante herramientas MCP; la aplicación de iOS expone las capacidades del iPhone mediante comandos de Node de OpenClaw, como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes aún pueden operar la aplicación de iOS mediante OpenClaw invocando comandos de Node, pero esas llamadas pasan por el protocolo de Node del Gateway y están sujetas a los límites de primer y segundo plano de iOS. Utilizar [Codex Computer Use](/es/plugins/codex-computer-use) para controlar el escritorio local y esta página para consultar las capacidades del Node de iOS.

### Evaluación / instantánea del canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo de conversación

- La activación por voz y el modo de conversación están disponibles en Settings.
- El modo Talk en tiempo real de OpenAI utiliza WebRTC propiedad del cliente cuando `talk.realtime.transport` es `webrtc`; una configuración explícita de `gateway-relay` sigue siendo propiedad del Gateway. Consultar [Modo Talk](/es/nodes/talk).
- Los Nodes de iOS compatibles con Talk anuncian la capacidad `talk` y pueden declarar `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once`; el Gateway permite de forma predeterminada esos comandos de pulsar para hablar para los Nodes de confianza compatibles con Talk.
- iOS puede suspender el audio en segundo plano; las funciones de voz deben considerarse de mejor esfuerzo cuando la aplicación no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: poner la aplicación de iOS en primer plano (los comandos de canvas/cámara/pantalla lo requieren).
- `A2UI_HOST_UNAVAILABLE`: no se pudo acceder a la página A2UI incluida desde la WebView de la aplicación; mantener la aplicación en primer plano en la pestaña Screen y volver a intentarlo.
- La solicitud de emparejamiento nunca aparece: ejecutar `openclaw devices list` y aprobarla manualmente.
- El Watch no muestra el estado del iPhone: confirmar que el iPhone informa de `watchPaired: true`
  y `watchAppInstalled: true` en `watch.status`. Si el emparejamiento es falso, emparejar el
  Watch en la aplicación Watch de Apple. Si la instalación es falsa, instalar la aplicación complementaria
  desde **My Watch -> Available Apps**. Después de cualquiera de los cambios, abrir OpenClaw una vez en el
  Watch; la disponibilidad inmediata sigue requiriendo que ambas aplicaciones estén ejecutándose,
  mientras que las actualizaciones en cola pueden llegar posteriormente en segundo plano.
- La reconexión falla después de reinstalar: el token de emparejamiento del llavero se ha borrado; volver a emparejar el Node.

## Documentación relacionada

- [Emparejamiento](/es/channels/pairing)
- [Detección](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
