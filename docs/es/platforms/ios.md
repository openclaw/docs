---
read_when:
    - Emparejamiento o reconexión del Node de iOS
    - Activación o solución de problemas del Node directo de Apple Watch
    - Ejecutar la aplicación para iOS desde el código fuente
    - Depuración del descubrimiento del Gateway o de los comandos de canvas
summary: 'Aplicación Node para iOS: conexión al Gateway, emparejamiento, canvas y solución de problemas'
title: Aplicación para iOS
x-i18n:
    generated_at: "2026-07-19T01:59:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: edd6a59edb656355e8b524cbd796452c0877264e28ca75f02a564929bcfa89b1
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: las compilaciones de la aplicación para iPhone se distribuyen a través de los canales de Apple cuando están habilitadas para una versión. Las compilaciones de desarrollo locales también pueden ejecutarse desde el código fuente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone las capacidades del Node: Canvas, captura de pantalla, captura de cámara, ubicación, modo Talk, activación por voz y resúmenes opcionales de Salud.
- Recibe comandos `node.invoke` e informa de eventos de estado del Node.
- Permite explorar en modo de solo lectura el espacio de trabajo del agente seleccionado desde la superficie Agents (Files): navegación por directorios, vistas previas de texto con resaltado de sintaxis, vistas previas de imágenes y exportación mediante la hoja para compartir. No permite operaciones de escritura; el Gateway limita el tamaño de las vistas previas.
- Mantiene una pequeña caché sin conexión y de solo lectura de las sesiones de chat y transcripciones recientes por cada Gateway emparejado: los inicios en frío muestran inmediatamente la última transcripción conocida y la actualizan cuando responde el Gateway, los chats recientes siguen disponibles para explorar sin conexión, y restablecer u olvidar purga la caché local protegida.
- Pone en cola los mensajes de texto enviados sin conexión en una bandeja de salida persistente por Gateway (hasta 50): las burbujas en cola aparecen en la transcripción, se envían en orden al reconectarse con reintentos idempotentes, permanecen almacenadas hasta que el historial canónico confirma el envío, se reintentan con espera incremental antes de mostrar una acción para reintentar o eliminar, y caducan en lugar de enviarse tras 48 horas sin conexión; restablecer u olvidar borra la cola junto con la caché.
- Chat es la única superficie de texto y voz. Las acciones de Chat pueden abrir la pantalla Sessions completa sin salir de Chat y pueden mostrar u ocultar el razonamiento del asistente y la actividad de las herramientas. Toca el micrófono para dictar un borrador, abre su menú para grabar una nota de voz o usa el control Talk integrado para la voz en tiempo real; el control Talk se anima según el nivel del micrófono en directo o de la reproducción mientras escucha o habla.
- Reproduce los mensajes del asistente por voz bajo demanda: mantén pulsado un mensaje en Chat y elige **Listen**. La aplicación reproduce los clips `tts.speak` compatibles del Gateway con el proveedor TTS configurado y recurre a la síntesis de voz del dispositivo cuando el audio del Gateway no está disponible o no puede reproducirse. La reproducción se detiene al cambiar de sesión o pasar la aplicación a segundo plano.

## Requisitos

- Gateway en ejecución en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - Misma LAN mediante Bonjour, **o**
  - Tailnet mediante DNS-SD unicast (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host/puerto manual (alternativa).

## Inicio rápido (emparejar + conectar)

En el primer inicio, la aplicación muestra una breve explicación del emparejamiento y una
página de permisos (notificaciones, cámara, micrófono, fotos, contactos,
calendario, recordatorios y ubicación). Todos los permisos son opcionales y pueden cambiarse
más adelante en **Settings** -> **Permissions** o en la aplicación Settings de iOS.

1. Inicia un Gateway autenticado con una ruta accesible desde el teléfono. Tailscale
   Serve es la ruta remota recomendada:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Para una configuración de confianza en la misma LAN, usa en su lugar un `gateway.bind: "lan"`
autenticado. La vinculación predeterminada a loopback no es accesible desde un teléfono. Si el
Gateway aún no se ha configurado, ejecuta primero `openclaw onboard` para que la creación
del código de configuración disponga de una ruta de autenticación mediante token o contraseña.

2. Abre la [interfaz de control](/es/web/control-ui), selecciona **Nodes** y haz clic en
   **Pair mobile device** en la página **Devices**. Se recomienda el acceso completo
   y está seleccionado de forma predeterminada; elige Limited access solo cuando quieras omitir
   los controles administrativos del Gateway y, a continuación, haz clic en **Create setup code**.

3. En la aplicación para iOS, abre **Settings** -> **Gateway**, escanea el código QR (o pega
   el código de configuración) y conéctate.

   Si el código de configuración contiene rutas tanto de LAN como de Tailscale Serve, la aplicación
   las prueba en orden y guarda el primer endpoint accesible.

4. La aplicación oficial se conecta automáticamente. Si **Pending approval** muestra una
   solicitud, revisa su rol y sus ámbitos antes de aprobarla.

   **Settings → Gateway** muestra si la conexión de operador guardada tiene acceso
   **Full** o **Limited**. La configuración `ws://` de LAN en texto sin formato se limita
   automáticamente para proteger el token de portador. Si está limitada, configura `wss://` o
   Tailscale Serve, escanea un nuevo código de acceso completo desde la interfaz de control o `openclaw qr`
   y vuelve a conectarte para habilitar los ajustes y las actualizaciones.

El botón de la interfaz de control requiere una sesión ya emparejada con `operator.admin`.
Como alternativa desde el terminal, selecciona un Gateway detectado en la aplicación para iOS (o habilita
Manual Host e introduce el host/puerto) y, a continuación, aprueba la solicitud en el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la aplicación vuelve a intentar el emparejamiento con datos de autenticación modificados (rol/ámbitos/clave pública), la solicitud pendiente anterior se sustituye y se crea un nuevo `requestId`. Ejecuta `openclaw devices list` de nuevo antes de aprobarla.

Opcional: si el Node de iOS siempre se conecta desde una subred estrictamente controlada, puedes habilitar la aprobación automática del Node durante el primer emparejamiento mediante CIDR explícitos o direcciones IP exactas:

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

Esta opción está deshabilitada de forma predeterminada. Solo se aplica al emparejamiento `role: node` inicial sin ámbitos solicitados. El emparejamiento de operadores/navegadores y cualquier cambio de rol, ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

5. Verifica la conexión:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resúmenes de Salud

El Node de iOS puede devolver un agregado opcional y de solo lectura de HealthKit correspondiente al día
natural actual. El consentimiento del dispositivo iOS y la autorización explícita de comandos del Gateway son
controles independientes. Consulta [Resúmenes de HealthKit](/es/platforms/ios-healthkit) para obtener información sobre
la configuración, la invocación, los campos de la carga útil, el comportamiento de privacidad y la solución de problemas.

De forma predeterminada, la aplicación complementaria para Apple Watch sigue utilizando el enlace existente del iPhone y
no necesita un emparejamiento independiente con el Gateway. Empareja el Watch con el iPhone en
la aplicación Watch de Apple, instala OpenClaw desde **Watch app -> My Watch -> Available
Apps** y, a continuación, abre OpenClaw una vez en ambos dispositivos.

## Revisar aprobaciones de comandos

Una conexión de operador con `operator.admin`, o una conexión
`operator.approvals` emparejada a la que el Gateway se dirija explícitamente, puede revisar
solicitudes de ejecución pendientes en el iPhone. La tarjeta de aprobación muestra la
vista previa saneada del comando del Gateway, la advertencia, el contexto del host, la caducidad y solo las
decisiones que ofrece esa solicitud. El Apple Watch emparejado recibe la misma
solicitud segura para el revisor mediante el enlace existente del iPhone y ofrece el subconjunto compacto
de decisiones para permitir una vez o denegar. El modo Gateway directo del Watch no transmite
solicitudes de aprobación.

El estado de aprobación se comparte con la interfaz de control y las superficies de chat compatibles. La
primera respuesta confirmada prevalece. El iPhone y el Watch obtienen el registro terminal canónico
del Gateway después de que otra superficie resuelva la solicitud, después de una
notificación remota de resolución y siempre que pueda haberse perdido una
confirmación de resolución. Las acciones permanecen deshabilitadas hasta que esa nueva lectura confirma si la
solicitud sigue pendiente.

La titularidad de la aprobación está vinculada al Gateway seleccionado. Cambiar de Gateway no permite
aplicar una solicitud anterior a la conexión de reemplazo. Los Gateways anteriores a los
métodos de aprobación unificados recurren a los métodos específicos de ejecución incluidos;
el estado terminal conservado y los resultados más completos entre superficies requieren un
Gateway actualizado.

## Responder a preguntas del agente

Chat muestra las preguntas pendientes del Gateway como tarjetas nativas para las conexiones de operador
con `operator.questions` (o `operator.admin`). Las tarjetas admiten opciones de selección
única y múltiple, descripciones de opciones, respuestas de texto libre **Other** y una
cuenta atrás hasta la caducidad. Las reconexiones vuelven a cargar las preguntas pendientes desde el Gateway. Una tarjeta
se bloquea cuando este dispositivo la responde, otra superficie responde primero o la
pregunta caduca o se cancela.

## Node directo opcional para Apple Watch

El modo directo proporciona al reloj su propia identidad de Node firmada y conexión con el Gateway.
Los comandos compatibles del Node siguen funcionando mediante la red Wi-Fi o celular del reloj mientras
OpenClaw está activo, incluso cuando el iPhone emparejado no está disponible.

Requisitos:

- El iPhone está conectado al Gateway con el ámbito `operator.admin`.
- El código de configuración anuncia un endpoint `wss://` del Gateway con un certificado de confianza
  para watchOS; el reloj consulta el origen `https://` correspondiente. No se admiten HTTP sin formato ni
  certificados autofirmados o cuya confianza se base únicamente en la huella digital. Consulta [Emparejamiento gestionado por el
  Gateway](/es/gateway/pairing) para configurar el endpoint. Las rutas de loopback, exclusivas del iPhone
  y exclusivas de la tailnet no son accesibles de forma independiente para el reloj.
- El uso de la red celular requiere un Apple Watch compatible con conexión celular y con el servicio activo.
- OpenClaw está activo en el reloj. Apple no permite que las aplicaciones normales de watchOS
  mantengan conexiones WebSocket/TCP genéricas, por lo que el Node directo utiliza consultas HTTPS
  breves y vuelve a conectarse cuando la aplicación regresa a primer plano. Consulta la
  [guía de Apple sobre redes de bajo nivel en watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configuración:

1. En el iPhone, abre **Settings -> Apple Watch**.
2. Toca **Enable Direct Gateway Connection**.
3. Abre OpenClaw en el reloj antes de que caduque el código de configuración de corta duración.
4. Verifica la fila independiente del Apple Watch con `openclaw nodes status`.

El código de configuración contiene una credencial de arranque de corta duración y exclusiva del Node; trátala
como una contraseña hasta que caduque. Nunca contiene la contraseña ni el token del Gateway guardados
en el iPhone. Tras el emparejamiento, el reloj almacena su propio token de dispositivo y
elimina la credencial de arranque. El modo directo solo abarca los comandos siguientes.
Chat, Talk, las aprobaciones y el flujo de notificaciones `watch.*` existente siguen siendo
funciones transmitidas por el iPhone y continúan requiriendo el iPhone emparejado.

Comandos directos del Node de watchOS:

| Superficie    | Comandos                       | Notas                                                   |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| Dispositivo   | `device.info`, `device.status` | Identidad, batería, temperatura, almacenamiento y red del Watch. |
| Notificaciones | `system.notify`                | Mientras la aplicación está activa; requiere permiso en el Watch. |

watchOS no expone WebKit a aplicaciones de terceros, por lo que el Node directo del reloj
no anuncia comandos de Canvas.

## Notificaciones push mediante enlace para compilaciones oficiales

Las compilaciones oficiales distribuidas de iOS utilizan un enlace externo de notificaciones push en lugar de publicar el token APNs sin procesar en el Gateway. Las compilaciones oficiales de la App Store procedentes del canal público de versiones utilizan el enlace alojado en `https://ios-push-relay.openclaw.ai`; esta URL base está integrada para la distribución mediante App Store y no admite ninguna sobrescritura.

Las implementaciones de enlaces personalizados requieren una ruta de compilación e implementación de iOS deliberadamente independiente cuya URL del enlace coincida con la URL del enlace del Gateway. El canal de versiones de App Store nunca acepta una URL de enlace personalizada. Si utilizas una compilación con un enlace personalizado, establece la URL correspondiente del enlace del Gateway:

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

- La aplicación iOS se registra en el relay mediante App Attest y un JWS de transacción de la aplicación de StoreKit.
- El relay devuelve un identificador opaco de relay junto con una autorización de envío limitada al registro.
- La aplicación iOS obtiene la identidad del gateway emparejado (`gateway.identity.get`) y la incluye en el registro del relay, de modo que el registro respaldado por el relay se delega en ese gateway específico.
- La aplicación reenvía ese registro respaldado por el relay al gateway emparejado mediante `push.apns.register`.
- El gateway utiliza ese identificador de relay almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- Si posteriormente la aplicación se conecta a otro gateway o a una compilación con una URL base de relay diferente, actualiza el registro del relay en lugar de reutilizar la vinculación anterior.

Lo que el gateway **no** necesita para esta ruta: ningún token de relay para todo el despliegue ni una clave de APNs directa para los envíos oficiales respaldados por el relay de la App Store.

Flujo esperado para el operador:

1. Instalar la aplicación iOS oficial.
2. Opcional: establecer `gateway.push.apns.relay.baseUrl` en el gateway solo cuando se utilice deliberadamente una compilación de relay personalizada e independiente.
3. Emparejar la aplicación con el gateway y dejar que termine de conectarse.
4. La aplicación publica `push.apns.register` cuando ya dispone de un token de APNs, la sesión del operador está conectada y el registro del relay se completa correctamente.
5. A partir de entonces, `push.test`, las activaciones por reconexión y los avisos de activación pueden utilizar el registro almacenado respaldado por el relay.

## Señales de actividad en segundo plano

Cuando iOS activa la aplicación mediante una notificación push silenciosa, una actualización en segundo plano o un evento de cambio significativo de ubicación, la aplicación intenta realizar una reconexión breve del nodo y después llama a `node.event` con `event: "node.presence.alive"`. El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del nodo/dispositivo emparejado solo después de conocer la identidad autenticada del dispositivo del nodo.

La aplicación considera que una activación en segundo plano se ha registrado correctamente solo cuando la respuesta del gateway incluye `handled: true`. Los gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización persistente de la última vez que se vio el dispositivo.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` sigue funcionando como anulación temporal mediante variable de entorno para el gateway (`gateway.push.apns.relay.baseUrl` es la ruta que prioriza la configuración).
- El modo push de la compilación de lanzamiento de la App Store tiene codificado de forma fija el host del relay alojado y nunca lee una anulación de la URL del relay; la variable de entorno de tiempo de compilación `OPENCLAW_PUSH_RELAY_BASE_URL` solo afecta a los modos de compilación local/sandbox de iOS.

## Flujo de autenticación y confianza

El relay existe para aplicar dos restricciones que el uso directo de APNs en el gateway no puede proporcionar para las compilaciones oficiales de iOS:

- Solo las compilaciones genuinas de OpenClaw para iOS distribuidas mediante Apple pueden utilizar el relay alojado.
- Un gateway solo puede enviar notificaciones push respaldadas por el relay a dispositivos iOS emparejados con ese gateway específico.

Salto por salto:

1. `iOS app -> gateway`: la aplicación se empareja con el gateway mediante el flujo normal de autenticación del Gateway, lo que le proporciona una sesión de nodo autenticada y una sesión de operador autenticada. La sesión del operador llama a `gateway.identity.get`.
2. `iOS app -> relay`: la aplicación llama a los endpoints de registro del relay mediante HTTPS con una prueba de App Attest y un JWS de transacción de la aplicación de StoreKit. El relay valida el ID del paquete, la prueba de App Attest y la prueba de distribución de Apple, y exige la ruta de distribución oficial/de producción; esto impide que las compilaciones locales de Xcode/desarrollo utilicen el relay alojado, ya que una compilación local no puede satisfacer la prueba de distribución oficial de Apple.
3. `gateway identity delegation`: antes del registro del relay, la aplicación obtiene la identidad del gateway emparejado desde `gateway.identity.get` y la incluye en la carga útil del registro del relay. El relay devuelve un identificador de relay y una autorización de envío limitada al registro que se delega en esa identidad del gateway.
4. `gateway -> relay`: el gateway almacena el identificador del relay y la autorización de envío de `push.apns.register`. En `push.test`, las activaciones por reconexión y los avisos de activación, el gateway firma la solicitud de envío con su propia identidad de dispositivo; el relay verifica tanto la autorización de envío almacenada como la firma del gateway con respecto a la identidad del gateway delegada durante el registro. Ningún otro gateway puede reutilizar ese registro almacenado, aunque de algún modo obtenga el identificador.
5. `relay -> APNs`: el relay posee las credenciales de APNs de producción y el token de APNs sin procesar de la compilación oficial. El gateway nunca almacena el token de APNs sin procesar de las compilaciones oficiales respaldadas por el relay; el relay envía la notificación push final a APNs en nombre del gateway emparejado.

Motivo de este diseño: mantener las credenciales de APNs de producción fuera de los gateways de los usuarios, evitar almacenar en el gateway los tokens de APNs sin procesar de la compilación oficial, permitir el uso del relay alojado únicamente a las compilaciones oficiales de OpenClaw para iOS e impedir que un gateway envíe notificaciones push de activación a dispositivos iOS que pertenezcan a otro gateway.

Las compilaciones locales/manuales siguen utilizando APNs directamente. Si se prueban esas compilaciones sin el relay, el gateway aún necesita credenciales directas de APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno del runtime del host del gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena la autenticación de App Store Connect, como `APP_STORE_CONNECT_KEY_ID` y `APP_STORE_CONNECT_ISSUER_ID`; no configura la entrega directa mediante APNs para las compilaciones locales de iOS.

Almacenamiento recomendado en el host del gateway, coherente con las demás credenciales de proveedores en `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

No confirmar el archivo `.p8` en el repositorio ni colocarlo dentro de la copia de trabajo del repositorio.

## Rutas de descubrimiento

### Bonjour (LAN)

La aplicación iOS examina `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo dominio de descubrimiento DNS-SD de área amplia. Los gateways de la misma LAN aparecen automáticamente desde `local.`; el descubrimiento entre redes puede utilizar el dominio de área amplia configurado sin cambiar el tipo de señal.

### Tailnet (entre redes)

Si mDNS está bloqueado, utilizar una zona DNS-SD unicast (elegir un dominio; ejemplo: `openclaw.internal.`) y DNS dividido de Tailscale. Consultar [Bonjour](/es/gateway/bonjour) para ver el ejemplo de CoreDNS.

### Host/puerto manual

En Settings, activar **Manual Host** e introducir el host y el puerto del gateway (valor predeterminado: `18789`).

## Varios gateways

La aplicación mantiene un registro de todos los gateways con los que se ha emparejado, por lo que es posible alternar entre ellos sin volver a realizar el emparejamiento:

- **Settings -> Gateway** muestra una lista **Paired Gateways** con el gateway activo marcado. Tocar una entrada para cambiar; la aplicación cierra las sesiones actuales y se vuelve a conectar al gateway seleccionado. Cuando hay más de un gateway emparejado, aparece un menú de cambio rápido junto a la fila de conexión.
- Las credenciales, las decisiones de confianza de TLS, las preferencias específicas de cada gateway y el historial de chat almacenado en caché se guardan por gateway. El cambio nunca mezcla el estado entre gateways y el registro de notificaciones push sigue al gateway activo.
- Deslizar un gateway emparejado (o utilizar su menú contextual) para **Forget** y eliminar sus credenciales, tokens de dispositivo, anclaje TLS y chats almacenados en caché.
- Los gateways descubiertos deben estar visibles en la red para poder cambiar a ellos; los gateways manuales se vuelven a conectar mediante el host y el puerto guardados.

## Canvas + A2UI

El nodo iOS representa un canvas WKWebView. Utilizar `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host del canvas del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/` desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, valor predeterminado `18789`).
- El nodo iOS mantiene la estructura integrada como vista conectada predeterminada. `canvas.a2ui.push` y `canvas.a2ui.reset` utilizan la página A2UI incluida y propiedad de la aplicación.
- Las páginas A2UI remotas del Gateway son solo de representación en iOS; las acciones de botones A2UI nativas solo se aceptan desde páginas incluidas y propiedad de la aplicación.
- Volver a la estructura integrada con `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La aplicación iOS es una superficie de nodo móvil, no un backend de Codex Computer Use. Codex Computer Use y `cua-driver mcp` controlan un escritorio macOS local mediante herramientas MCP; la aplicación iOS expone las capacidades del iPhone mediante comandos de nodo de OpenClaw como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes también pueden operar la aplicación iOS mediante OpenClaw invocando comandos de nodo, pero esas llamadas pasan por el protocolo de nodos del gateway y están sujetas a los límites de primer plano/segundo plano de iOS. Utilizar [Codex Computer Use](/es/plugins/codex-computer-use) para controlar el escritorio local y esta página para consultar las capacidades de los nodos iOS.

### Evaluación/instantánea del canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo de conversación

- La activación por voz y el modo de conversación están disponibles en Settings.
- La conversación en tiempo real de OpenAI utiliza WebRTC propiedad del cliente cuando `talk.realtime.transport` es `webrtc`; una configuración explícita de `gateway-relay` sigue siendo propiedad del Gateway. Consultar [Modo de conversación](/es/nodes/talk).
- Los nodos iOS con capacidad de conversación anuncian la capacidad `talk` y pueden declarar `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once`; el Gateway permite de forma predeterminada esos comandos de pulsar para hablar en nodos de confianza con capacidad de conversación.
- iOS puede suspender el audio en segundo plano; las funciones de voz deben considerarse de disponibilidad no garantizada cuando la aplicación no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: poner la aplicación iOS en primer plano (los comandos de canvas/cámara/pantalla lo requieren).
- `A2UI_HOST_UNAVAILABLE`: no se pudo acceder a la página A2UI incluida desde la WebView de la aplicación; mantener la aplicación en primer plano en la pestaña Screen y volver a intentarlo.
- La solicitud de emparejamiento nunca aparece: ejecutar `openclaw devices list` y aprobarla manualmente.
- El Watch no muestra el estado del iPhone: confirmar que el iPhone informa de `watchPaired: true`
  y `watchAppInstalled: true` en `watch.status`. Si el emparejamiento es falso, emparejar el
  Watch en la aplicación Watch de Apple. Si la instalación es falsa, instalar la aplicación complementaria
  desde **My Watch -> Available Apps**. Después de cualquiera de los cambios, abrir OpenClaw una vez en el
  Watch; la accesibilidad inmediata sigue exigiendo que ambas aplicaciones estén en ejecución,
  mientras que las actualizaciones en cola pueden llegar posteriormente en segundo plano.
- La reconexión falla después de reinstalar: se ha borrado el token de emparejamiento del Keychain; volver a emparejar el nodo.

## Documentación relacionada

- [Emparejamiento](/es/channels/pairing)
- [Descubrimiento](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
