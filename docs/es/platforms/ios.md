---
read_when:
    - Emparejamiento o reconexión del nodo de iOS
    - Activación o solución de problemas del Node directo de Apple Watch
    - Ejecutar la aplicación para iOS desde el código fuente
    - Depuración del descubrimiento del Gateway o de los comandos de canvas
summary: 'Aplicación de nodo para iOS: conexión al Gateway, emparejamiento, lienzo y solución de problemas'
title: Aplicación para iOS
x-i18n:
    generated_at: "2026-07-21T09:02:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb768b5fd67d44c2e576a06fe6a39c406cf7b64227bbd9a91f930c0d0bbead61
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: las compilaciones de la aplicación para iPhone se distribuyen a través de los canales de Apple cuando están habilitadas para una versión. Las compilaciones de desarrollo local también pueden ejecutarse desde el código fuente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone las capacidades del Node: Canvas, captura de pantalla, captura de cámara, ubicación, modo Talk, activación por voz y resúmenes de Salud opcionales.
- Recibe comandos `node.invoke` e informa de eventos de estado del Node.
- Permite explorar, en modo de solo lectura, el espacio de trabajo del agente seleccionado desde la superficie Agentes (Archivos): navegación por directorios, vistas previas de texto con resaltado de sintaxis, vistas previas de imágenes y exportación mediante la hoja para compartir. No admite operaciones de escritura; el Gateway limita el tamaño de las vistas previas.
- Mantiene una pequeña caché sin conexión y de solo lectura de las sesiones y transcripciones de chat recientes por cada Gateway emparejado: los inicios en frío muestran inmediatamente la última transcripción conocida y la actualizan cuando responde el Gateway, los chats recientes siguen siendo accesibles durante la desconexión y restablecer u olvidar purga la caché local protegida.
- Pone en cola los mensajes de texto enviados durante la desconexión en una bandeja de salida persistente por Gateway (hasta 50): las burbujas en cola aparecen en la transcripción, se envían en orden al volver a conectarse con reintentos idempotentes, persisten hasta que el historial canónico confirma el envío, vuelven a intentarse con espera incremental antes de mostrar una acción para reintentar o eliminar y caducan, en lugar de enviarse, tras 48 horas sin conexión; restablecer u olvidar borra la cola junto con la caché.
- Chat es la única superficie de texto y voz. Las acciones de Chat pueden abrir la pantalla completa de Sesiones sin salir de Chat y pueden mostrar u ocultar el razonamiento del asistente y la actividad de las herramientas. Se puede tocar el micrófono para dictar un borrador, abrir su menú para grabar una nota de voz o usar el control Talk integrado para voz en tiempo real; el control Talk se anima según el nivel del micrófono en directo o de la reproducción mientras escucha o habla.
- Reproduce los mensajes del asistente a petición: mantenga pulsado un mensaje en Chat y elija **Escuchar**. La aplicación reproduce los clips `tts.speak` compatibles del Gateway con el proveedor de TTS configurado y recurre a la síntesis de voz del dispositivo cuando el audio del Gateway no está disponible o no se puede reproducir. La reproducción se detiene al cambiar de sesión o cuando la aplicación pasa a segundo plano.

## Requisitos

- Un Gateway en ejecución en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - La misma LAN mediante Bonjour, **o**
  - Una tailnet mediante DNS-SD unidifusión (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host/puerto manual (alternativa).

## Inicio rápido (emparejar y conectar)

En el primer inicio, la aplicación presenta una breve explicación del emparejamiento y una
página de permisos (notificaciones, cámara, micrófono, fotos, contactos,
calendario, recordatorios y ubicación). Todos los permisos son opcionales y pueden cambiarse
más adelante en **Ajustes** -> **Permisos** o en la aplicación Ajustes de iOS.

1. Inicie un Gateway autenticado con una ruta a la que pueda acceder el teléfono. Tailscale
   Serve es la ruta remota recomendada:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Para una configuración de confianza en la misma LAN, use en su lugar un `gateway.bind: "lan"`
autenticado. No se puede acceder desde un teléfono al enlace de bucle invertido predeterminado. Si el
Gateway aún no se ha configurado, ejecute primero `openclaw onboard` para que la creación
del código de configuración disponga de una ruta de autenticación mediante token o contraseña.

2. Abra la [IU de control](/es/web/control-ui), seleccione **Nodes** y haga clic en
   **Pair mobile device** en la página **Devices**. Se recomienda el acceso completo
   y está seleccionado de forma predeterminada; elija Limited access solo cuando quiera omitir
   los controles administrativos del Gateway y, a continuación, haga clic en **Create setup code**.

3. En la aplicación para iOS, abra **Ajustes** -> **Gateway**, escanee el código QR (o pegue
   el código de configuración) y conéctese.

   Si el código de configuración contiene rutas tanto de LAN como de Tailscale Serve, la aplicación
   las comprueba en orden y guarda el primer endpoint accesible.

   Los Gateways emparejados permanecen en la lista **Gateways**. La marca de verificación identifica
   el Gateway seleccionado; use el control con forma de rayo en otra fila para mantener conectada
   simultáneamente su sesión de operador. Cambiar la selección no
   desconecta los demás Gateways habilitados. Solo el Gateway seleccionado recibe la
   sesión de Node del iPhone que incorpora capacidades, por lo que la cámara, la pantalla, la ubicación y
   los demás comandos del dispositivo siempre tienen un único propietario inequívoco. iOS puede suspender
   estas conexiones en primer plano después de que la aplicación pase a segundo plano.

4. La aplicación oficial se conecta automáticamente. Si **Pending approval** muestra una
   solicitud, revise su rol y sus ámbitos antes de aprobarla.

   **Ajustes → Gateway** muestra si la conexión de operador guardada tiene acceso
   **Completo** o **Limitado**. La configuración `ws://` de LAN en texto sin formato se limita automáticamente
   para proteger el token al portador. Si está limitada, configure `wss://` o
   Tailscale Serve, escanee un nuevo código de acceso completo desde la IU de control o `openclaw qr`
   y vuelva a conectarse para habilitar los ajustes y las actualizaciones.

El botón de la IU de control requiere una sesión ya emparejada con `operator.admin`.
Como alternativa desde el terminal, elija un Gateway detectado en la aplicación para iOS (o habilite
Manual Host e introduzca el host/puerto) y, a continuación, apruebe la solicitud en el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la aplicación vuelve a intentar el emparejamiento con datos de autenticación modificados (rol/ámbitos/clave pública), la solicitud pendiente anterior se sustituye y se crea un nuevo `requestId`. Ejecute de nuevo `openclaw devices list` antes de aprobar.

Opcional: si el Node de iOS siempre se conecta desde una subred estrictamente controlada, puede habilitar la aprobación automática del Node en el primer emparejamiento mediante CIDR explícitos o direcciones IP exactas:

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

## Resúmenes de Salud

El Node de iOS puede devolver un agregado de HealthKit opcional y de solo lectura para el día
natural actual. El consentimiento del dispositivo iOS y la autorización explícita del comando del Gateway son
controles independientes. Consulte [Resúmenes de HealthKit](/es/platforms/ios-healthkit) para conocer
la configuración, la invocación, los campos de la carga útil, el comportamiento de privacidad y la solución de problemas.

De forma predeterminada, la aplicación complementaria del Apple Watch sigue usando el relay existente del iPhone y
no necesita un emparejamiento independiente con el Gateway. Empareje el Watch con el iPhone en
la aplicación Watch de Apple, instale OpenClaw desde **Watch app -> My Watch -> Available
Apps** y, a continuación, abra OpenClaw una vez en ambos dispositivos.

## Revisar aprobaciones de comandos

Una conexión de operador con `operator.admin`, o una conexión
`operator.approvals` emparejada a la que el Gateway se dirija explícitamente, puede revisar
las solicitudes de ejecución pendientes en el iPhone. La tarjeta de aprobación muestra la
vista previa saneada del comando del Gateway, la advertencia, el contexto del host, la caducidad y solo las
decisiones que ofrece esa solicitud. El Apple Watch emparejado recibe la misma
solicitud segura para el revisor mediante el relay existente del iPhone y ofrece el subconjunto compacto
de decisiones permitir una vez/denegar. El modo directo del Gateway en el Watch no transmite
solicitudes de aprobación.

El estado de aprobación se comparte con la IU de control y las superficies de chat compatibles. La
primera respuesta confirmada prevalece. El iPhone y el Watch obtienen el registro
terminal canónico del Gateway después de que otra superficie resuelva la solicitud, tras una notificación
remota de resolución y siempre que pueda haberse perdido una confirmación
de resolución. Las acciones permanecen deshabilitadas hasta que esa lectura posterior confirma si la
solicitud sigue pendiente.

La propiedad de la aprobación está vinculada al Gateway seleccionado. Cambiar de Gateway no permite
aplicar una solicitud antigua a la conexión de sustitución. Los Gateways anteriores a los
métodos de aprobación unificados recurren a los métodos específicos de ejecución incluidos;
el estado terminal conservado y los resultados más completos entre superficies requieren un
Gateway actualizado.

## Responder preguntas del agente

Chat muestra las preguntas pendientes del Gateway como tarjetas nativas para conexiones de operador
con `operator.questions` (o `operator.admin`). Las tarjetas admiten opciones de selección
única y múltiple, descripciones de opciones, respuestas de texto libre en **Otro** y una
cuenta atrás hasta la caducidad. Al volver a conectarse, se recargan las preguntas pendientes desde el Gateway. Una tarjeta
se bloquea cuando este dispositivo la responde, otra superficie la responde primero o la
pregunta caduca o se cancela.

## Node directo opcional del Apple Watch

El modo directo proporciona al Watch su propia identidad de Node firmada y conexión con el Gateway.
Los comandos de Node compatibles siguen funcionando mediante la red Wi-Fi o celular del Watch mientras
OpenClaw está activo, incluso cuando el iPhone emparejado no está disponible.

Requisitos:

- El iPhone está conectado al Gateway con el ámbito `operator.admin`.
- El código de configuración anuncia un endpoint del Gateway `wss://` con un certificado de confianza
  para watchOS; el Watch consulta periódicamente el origen `https://` correspondiente. No se admiten HTTP en texto sin formato ni
  certificados autofirmados o de confianza basada únicamente en la huella digital. Consulte [Emparejamiento gestionado por el
  Gateway](/es/gateway/pairing) para configurar el endpoint. El Watch no puede acceder de forma independiente
  a rutas de bucle invertido, exclusivas del iPhone o exclusivas de la tailnet.
- El uso de la red celular requiere un Apple Watch con capacidad celular y servicio activo.
- OpenClaw está activo en el Watch. Apple no permite que las aplicaciones normales de watchOS
  mantengan conexiones WebSocket/TCP genéricas, por lo que el Node directo usa consultas HTTPS
  breves y vuelve a conectarse cuando la aplicación regresa al primer plano. Consulte la
  [guía de Apple sobre redes de bajo nivel en watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configuración:

1. En el iPhone, abra **Ajustes -> Apple Watch**.
2. Toque **Habilitar conexión directa con el Gateway**.
3. Abra OpenClaw en el Watch antes de que caduque el código de configuración de corta duración.
4. Verifique la fila independiente del Apple Watch con `openclaw nodes status`.

El código de configuración contiene una credencial de arranque de corta duración y exclusiva del Node; trátela
como una contraseña hasta que caduque. Nunca contiene la contraseña ni el token del Gateway
guardados en el iPhone. Tras el emparejamiento, el Watch almacena su propio token de dispositivo y
elimina la credencial de arranque. El modo directo solo abarca los comandos siguientes.
Chat, Talk, las aprobaciones y el flujo de notificaciones `watch.*` existente siguen siendo
funciones del relay del iPhone y aún requieren el iPhone emparejado.

Comandos directos del Node de watchOS:

| Superficie    | Comandos                       | Notas                                                         |
| ------------- | ------------------------------ | ------------------------------------------------------------- |
| Dispositivo   | `device.info`, `device.status` | Identidad, batería, estado térmico, almacenamiento y red del Watch. |
| Notificaciones | `system.notify`                | Mientras la aplicación está activa; requiere permiso del Watch. |

watchOS no expone WebKit a aplicaciones de terceros, por lo que el Node directo del Watch
no anuncia comandos de Canvas.

## Notificaciones push mediante relay para compilaciones oficiales

Las compilaciones oficiales distribuidas de iOS usan un relay push externo en lugar de publicar el token de APNs sin procesar en el Gateway. Las compilaciones oficiales de App Store del canal público de versiones usan el relay alojado en `https://ios-push-relay.openclaw.ai`; esta URL base está codificada de forma fija para la distribución mediante App Store y no lee ninguna configuración alternativa.

Las implementaciones de relay personalizadas requieren una ruta de compilación e implementación de iOS deliberadamente independiente cuya URL de relay coincida con la URL de relay del Gateway. El canal de versiones de App Store nunca acepta una URL de relay personalizada. Si se usa una compilación con relay personalizado, establezca la URL de relay correspondiente en el Gateway:

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

Funcionamiento del flujo:

- La app para iOS se registra en el relé mediante App Attest y un JWS de transacción de la app de StoreKit.
- El relé devuelve un identificador opaco de relé junto con una autorización de envío limitada al registro.
- La app para iOS obtiene la identidad del gateway emparejado (`gateway.identity.get`) y la incluye en el registro del relé, de modo que el registro respaldado por el relé queda delegado a ese gateway específico.
- La app reenvía ese registro respaldado por el relé al gateway emparejado mediante `push.apns.register`.
- El gateway usa ese identificador de relé almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- Si posteriormente la app se conecta a otro gateway o a una compilación con una URL base de relé diferente, actualiza el registro del relé en lugar de reutilizar la vinculación anterior.

Lo que el gateway **no** necesita para esta ruta: ningún token de relé para todo el despliegue ni una clave directa de APNs para los envíos oficiales respaldados por el relé de la App Store.

Flujo esperado para el operador:

1. Instale la app oficial para iOS.
2. Opcional: establezca `gateway.push.apns.relay.baseUrl` en el gateway únicamente cuando use una compilación de relé personalizada y deliberadamente independiente.
3. Empareje la app con el gateway y deje que termine de conectarse.
4. La app publica `push.apns.register` cuando dispone de un token de APNs, la sesión del operador está conectada y el registro del relé se completa correctamente.
5. A partir de entonces, `push.test`, las activaciones de reconexión y los avisos de activación pueden usar el registro respaldado por el relé almacenado.

## Señales de actividad en segundo plano

Cuando iOS activa la app debido a una notificación push silenciosa, una actualización en segundo plano o un evento de cambio significativo de ubicación, la app intenta una breve reconexión del nodo y después llama a `node.event` con `event: "node.presence.alive"`. El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del nodo/dispositivo emparejado solo después de conocer la identidad autenticada del dispositivo del nodo.

La app considera que una activación en segundo plano se ha registrado correctamente solo cuando la respuesta del gateway incluye `handled: true`. Los gateways anteriores pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización duradera de la última actividad.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` sigue funcionando como una anulación temporal mediante una variable de entorno para el gateway (`gateway.push.apns.relay.baseUrl` es la ruta que prioriza la configuración).
- El modo de notificaciones push de la compilación de lanzamiento de la App Store incorpora de forma fija el host del relé alojado y nunca lee una anulación de la URL del relé; la variable de entorno de compilación `OPENCLAW_PUSH_RELAY_BASE_URL` solo afecta a los modos de compilación local/sandbox de iOS.

## Flujo de autenticación y confianza

El relé existe para aplicar dos restricciones que el uso directo de APNs en el gateway no puede proporcionar a las compilaciones oficiales para iOS:

- Solo las compilaciones auténticas de OpenClaw para iOS distribuidas mediante Apple pueden usar el relé alojado.
- Un gateway solo puede enviar notificaciones push respaldadas por el relé a dispositivos iOS emparejados con ese gateway específico.

Salto por salto:

1. `iOS app -> gateway`: la app se empareja con el gateway mediante el flujo normal de autenticación del Gateway, lo que le proporciona una sesión autenticada del nodo y una sesión autenticada del operador. La sesión del operador llama a `gateway.identity.get`.
2. `iOS app -> relay`: la app llama a los endpoints de registro del relé mediante HTTPS con una prueba de App Attest y un JWS de transacción de la app de StoreKit. El relé valida el ID del paquete, la prueba de App Attest y la prueba de distribución de Apple, y exige la ruta de distribución oficial/de producción; esto impide que las compilaciones locales de Xcode/desarrollo usen el relé alojado, ya que una compilación local no puede satisfacer la prueba oficial de distribución de Apple.
3. `gateway identity delegation`: antes del registro del relé, la app obtiene la identidad del gateway emparejado de `gateway.identity.get` y la incluye en la carga útil del registro del relé. El relé devuelve un identificador de relé y una autorización de envío limitada al registro y delegada a la identidad de ese gateway.
4. `gateway -> relay`: el gateway almacena el identificador de relé y la autorización de envío de `push.apns.register`. En `push.test`, las activaciones de reconexión y los avisos de activación, el gateway firma la solicitud de envío con su propia identidad de dispositivo; el relé verifica tanto la autorización de envío almacenada como la firma del gateway respecto a la identidad del gateway delegada durante el registro. Ningún otro gateway puede reutilizar ese registro almacenado, aunque de algún modo obtenga el identificador.
5. `relay -> APNs`: el relé posee las credenciales de APNs de producción y el token de APNs sin procesar de la compilación oficial. El gateway nunca almacena el token de APNs sin procesar de las compilaciones oficiales respaldadas por el relé; el relé envía la notificación push final a APNs en nombre del gateway emparejado.

Motivo por el que se creó este diseño: mantener las credenciales de APNs de producción fuera de los gateways de los usuarios, evitar almacenar en el gateway los tokens de APNs sin procesar de la compilación oficial, permitir el uso del relé alojado solo a las compilaciones oficiales de OpenClaw para iOS e impedir que un gateway envíe notificaciones push de activación a dispositivos iOS pertenecientes a otro gateway.

Las compilaciones locales/manuales siguen usando APNs directamente. Si se prueban esas compilaciones sin el relé, el gateway sigue necesitando credenciales directas de APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de ejecución del host del gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena datos de autenticación de App Store Connect, como `APP_STORE_CONNECT_KEY_ID` y `APP_STORE_CONNECT_ISSUER_ID`; no configura la entrega directa mediante APNs para las compilaciones locales de iOS.

Almacenamiento recomendado en el host del gateway, coherente con las demás credenciales de proveedores en `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

No confirme el archivo `.p8` en el control de versiones ni lo coloque en el checkout del repositorio.

## Rutas de descubrimiento

### Bonjour (LAN)

La app para iOS explora `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo dominio de descubrimiento DNS-SD de área amplia. Los gateways de la misma LAN aparecen automáticamente mediante `local.`; el descubrimiento entre redes puede usar el dominio de área amplia configurado sin cambiar el tipo de señal.

### Tailnet (entre redes)

Si mDNS está bloqueado, use una zona DNS-SD unicast (elija un dominio; ejemplo: `openclaw.internal.`) y el DNS dividido de Tailscale. Consulte [Bonjour](/es/gateway/bonjour) para ver el ejemplo de CoreDNS.

### Host/puerto manual

En Settings, habilite **Manual Host** e introduzca el host y el puerto del gateway (valor predeterminado: `18789`).

## Varios gateways

La app mantiene un registro de todos los gateways con los que se ha emparejado, lo que permite cambiar entre ellos sin volver a realizar el emparejamiento:

- **Settings -> Gateway** muestra una lista **Paired Gateways** con el gateway activo marcado. Toque una entrada para cambiar; la app cierra las sesiones actuales y vuelve a conectarse al gateway seleccionado. Cuando hay más de un gateway emparejado, aparece un menú de cambio rápido junto a la fila de conexión.
- Las credenciales, las decisiones de confianza TLS, las preferencias de cada gateway y el historial de chat almacenado en caché se guardan por separado para cada gateway. El cambio nunca mezcla el estado entre gateways y el registro de notificaciones push sigue al gateway activo.
- Deslice un gateway emparejado (o use su menú contextual) para seleccionar **Forget**, lo que elimina sus credenciales, tokens de dispositivo, pin TLS y chats almacenados en caché.
- Los gateways descubiertos deben estar visibles en la red para poder cambiar a ellos; los gateways manuales se reconectan mediante el host y el puerto guardados.

## Canvas + A2UI

El nodo de iOS renderiza un canvas de WKWebView. Use `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host del canvas del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/` desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, de forma predeterminada `18789`).
- El nodo de iOS mantiene la estructura integrada como vista conectada predeterminada. `canvas.a2ui.push` y `canvas.a2ui.reset` usan la página A2UI incluida y propiedad de la app.
- Las páginas A2UI del Gateway remoto son de solo renderizado en iOS; las acciones nativas de botones A2UI solo se aceptan desde páginas incluidas y propiedad de la app.
- Vuelva a la estructura integrada mediante `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La app para iOS es una superficie de nodo móvil, no un backend de Codex Computer Use. Codex Computer Use y `cua-driver mcp` controlan un escritorio macOS local mediante herramientas MCP; la app para iOS expone las capacidades del iPhone mediante comandos de nodo de OpenClaw como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes pueden seguir operando la app para iOS mediante OpenClaw invocando comandos de nodo, pero esas llamadas pasan por el protocolo de nodo del gateway y están sujetas a los límites de primer y segundo plano de iOS. Use [Codex Computer Use](/es/plugins/codex-computer-use) para controlar el escritorio local y esta página para consultar las capacidades del nodo de iOS.

### Evaluación / instantánea del canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo de conversación

- La activación por voz y el modo de conversación están disponibles en Settings.
- El modo Talk en tiempo real de OpenAI usa WebRTC propiedad del cliente cuando `talk.realtime.transport` es `webrtc`; una configuración explícita de `gateway-relay` sigue siendo propiedad del Gateway. Consulte [Modo Talk](/es/nodes/talk).
- Los nodos de iOS compatibles con Talk anuncian la capacidad `talk` y pueden declarar `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once`; el Gateway permite de forma predeterminada esos comandos de pulsar para hablar en los nodos de confianza compatibles con Talk.
- iOS puede suspender el audio en segundo plano; considere que las funciones de voz funcionan sin garantías cuando la app no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: lleve la app para iOS a primer plano (los comandos de canvas/cámara/pantalla lo requieren).
- `A2UI_HOST_UNAVAILABLE`: no se pudo acceder a la página A2UI incluida desde la WebView de la app; mantenga la app en primer plano en la pestaña Screen y vuelva a intentarlo.
- La solicitud de emparejamiento nunca aparece: ejecute `openclaw devices list` y apruébela manualmente.
- El Watch no muestra el estado del iPhone: confirme que el iPhone indica `watchPaired: true`
  y `watchAppInstalled: true` en `watch.status`. Si el emparejamiento es falso, empareje el
  Watch en la app Watch de Apple. Si la instalación es falsa, instale la app complementaria
  desde **My Watch -> Available Apps**. Después de cualquiera de estos cambios, abra OpenClaw una vez en el
  Watch; la disponibilidad inmediata sigue requiriendo que ambas apps estén en ejecución,
  mientras que las actualizaciones en cola pueden llegar más tarde en segundo plano.
- La reconexión falla tras reinstalar: se eliminó el token de emparejamiento del Llavero; vuelva a emparejar el nodo.

## Documentación relacionada

- [Emparejamiento](/es/channels/pairing)
- [Descubrimiento](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
