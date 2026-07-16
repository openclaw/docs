---
read_when:
    - Emparejamiento o reconexión del Node de iOS
    - Habilitación o solución de problemas del Node directo de Apple Watch
    - Ejecutar la aplicación para iOS desde el código fuente
    - Depuración de la detección del Gateway o de los comandos del lienzo
summary: 'Aplicación de Node para iOS: conexión al Gateway, emparejamiento, canvas y solución de problemas'
title: Aplicación para iOS
x-i18n:
    generated_at: "2026-07-16T11:46:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: las compilaciones de la aplicación para iPhone se distribuyen a través de los canales de Apple cuando están habilitadas para una versión. Las compilaciones de desarrollo local también pueden ejecutarse desde el código fuente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone las capacidades del Node: Canvas, captura de pantalla, captura de cámara, ubicación, modo de conversación, activación por voz y resúmenes opcionales de salud.
- Recibe comandos `node.invoke` e informa de eventos de estado del Node.
- Permite explorar en modo de solo lectura el espacio de trabajo del agente seleccionado desde la superficie Agentes (Archivos): navegación por directorios, vistas previas de texto con resaltado de sintaxis, vistas previas de imágenes y exportación mediante la hoja para compartir. No se permiten operaciones de escritura; el Gateway limita el tamaño de las vistas previas.
- Mantiene una pequeña caché sin conexión y de solo lectura de las sesiones y transcripciones de chat recientes por cada Gateway emparejado: los inicios en frío muestran de inmediato la última transcripción conocida y la actualizan cuando responde el Gateway, los chats recientes siguen siendo accesibles sin conexión y restablecer u olvidar purga la caché local protegida.
- Pone en cola los mensajes de texto enviados sin conexión en una bandeja de salida duradera por Gateway (hasta 50): las burbujas en cola aparecen en la transcripción, se envían en orden al reconectarse con reintentos idempotentes, permanecen almacenadas hasta que el historial canónico confirma el envío, se reintentan con espera exponencial antes de mostrar una acción para reintentar o eliminar, y caducan en lugar de enviarse después de 48 horas sin conexión; restablecer u olvidar borra la cola junto con la caché.
- Reproduce los mensajes del asistente por voz bajo demanda: mantenga pulsado un mensaje en Chat y elija **Listen**. La aplicación reproduce los clips `tts.speak` compatibles del Gateway con el proveedor de TTS configurado y recurre a la síntesis de voz del dispositivo cuando el audio del Gateway no está disponible o no se puede reproducir. La reproducción se detiene al cambiar de sesión o cuando la aplicación pasa a segundo plano.

## Requisitos

- Un Gateway en ejecución en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - La misma LAN mediante Bonjour, **o**
  - Una tailnet mediante DNS-SD unicast (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host/puerto manual (alternativa).

## Inicio rápido (emparejar y conectar)

En el primer inicio, la aplicación muestra una breve explicación del emparejamiento y una
página de permisos (notificaciones, cámara, micrófono, fotos, contactos,
calendario, recordatorios y ubicación). Todos los permisos son opcionales y pueden modificarse
posteriormente en **Settings** -> **Permissions** o en la aplicación Ajustes de iOS.

1. Inicie un Gateway autenticado con una ruta accesible desde el teléfono. Tailscale
   Serve es la ruta remota recomendada:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Para una configuración de confianza en la misma LAN, utilice en su lugar un `gateway.bind: "lan"`
autenticado. El enlace predeterminado a la interfaz de bucle invertido no es accesible desde un teléfono. Si el
Gateway aún no se ha configurado, ejecute primero `openclaw onboard` para que la creación
del código de configuración disponga de una ruta de autenticación mediante token o contraseña.

2. Abra la [interfaz de control](/es/web/control-ui), seleccione **Nodes** y haga clic en
   **Pair mobile device** en la página **Devices**. Se recomienda el acceso completo
   y está seleccionado de forma predeterminada; elija Limited access solo si desea omitir
   los controles administrativos del Gateway y, después, haga clic en **Create setup code**.

3. En la aplicación para iOS, abra **Settings** -> **Gateway**, escanee el código QR (o pegue
   el código de configuración) y conéctese.

   Si el código de configuración contiene rutas de LAN y Tailscale Serve, la aplicación
   las prueba en orden y guarda el primer endpoint accesible.

4. La aplicación oficial se conecta automáticamente. Si **Pending approval** muestra una
   solicitud, revise su rol y sus ámbitos antes de aprobarla.

   **Settings → Gateway** muestra si la conexión de operador guardada tiene acceso
   **Full** o **Limited**. La configuración `ws://` de LAN en texto sin formato queda limitada
   automáticamente para proteger el token de portador. Si está limitada, configure `wss://` o
   Tailscale Serve, escanee un nuevo código de acceso completo desde la interfaz de control o `openclaw qr`,
   y vuelva a conectarse para habilitar los ajustes y las actualizaciones.

El botón de la interfaz de control requiere una sesión ya emparejada con `operator.admin`.
Como alternativa desde la terminal, elija un Gateway detectado en la aplicación para iOS (o habilite
Manual Host e introduzca el host/puerto) y, después, apruebe la solicitud en el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la aplicación vuelve a intentar el emparejamiento con datos de autenticación modificados (rol/ámbitos/clave pública), la solicitud pendiente anterior queda sustituida y se crea un nuevo `requestId`. Ejecute de nuevo `openclaw devices list` antes de aprobar.

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

## Resúmenes de salud

El Node de iOS puede devolver, previa aceptación, un agregado de HealthKit de solo lectura para el día
natural actual. El consentimiento en el iPhone y la autorización explícita de comandos del Gateway son
controles independientes. Consulte [Resúmenes de HealthKit](/es/platforms/ios-healthkit) para obtener información sobre
la configuración, la invocación, los campos de la carga útil, el comportamiento de privacidad y la solución de problemas.

De forma predeterminada, la aplicación complementaria del Apple Watch continúa utilizando el relay existente del iPhone y
no necesita un emparejamiento independiente con el Gateway. Empareje el Watch con el iPhone en
la aplicación Watch de Apple, instale OpenClaw desde **Watch app -> My Watch -> Available
Apps** y, después, abra OpenClaw una vez en ambos dispositivos.

## Revisión de aprobaciones de comandos

Una conexión de operador con `operator.admin`, o una conexión
`operator.approvals` emparejada a la que el Gateway se dirija explícitamente, puede revisar
las solicitudes de ejecución pendientes en el iPhone. La tarjeta de aprobación muestra la
vista previa saneada del comando del Gateway, la advertencia, el contexto del host, la caducidad y únicamente las
decisiones ofrecidas por esa solicitud. El Apple Watch emparejado recibe la misma
solicitud segura para el revisor mediante el relay existente del iPhone y ofrece el subconjunto compacto
de decisiones para permitir una vez o denegar. El modo directo del Gateway en el Watch no transmite
solicitudes de aprobación.

El estado de aprobación se comparte con la interfaz de control y las superficies de chat compatibles. La
primera respuesta confirmada prevalece. El iPhone y el Watch obtienen el registro
terminal canónico del Gateway después de que otra superficie resuelva la solicitud, después de una
notificación remota de resolución y siempre que pueda haberse perdido una confirmación
de resolución. Las acciones permanecen deshabilitadas hasta que esa nueva lectura confirme si la
solicitud sigue pendiente.

La propiedad de la aprobación está vinculada al Gateway seleccionado. Al cambiar de Gateway, no se puede
aplicar una solicitud anterior a la conexión de reemplazo. Los Gateway anteriores a los
métodos de aprobación unificados recurren a los métodos específicos de ejecución incluidos;
para conservar el estado terminal y obtener resultados más completos entre superficies se requiere un
Gateway actualizado.

## Node directo opcional para Apple Watch

El modo directo proporciona al reloj su propia identidad de Node firmada y conexión con el Gateway.
Los comandos de Node compatibles siguen funcionando mediante Wi-Fi o la red móvil del reloj mientras
OpenClaw está activo, incluso cuando el iPhone emparejado no está disponible.

Requisitos:

- El iPhone está conectado al Gateway con el ámbito `operator.admin`.
- El código de configuración anuncia un endpoint del Gateway `wss://` con un certificado de confianza
  para watchOS; el reloj consulta el origen `https://` correspondiente. No se admiten HTTP sin cifrar ni
  certificados autofirmados o basados únicamente en una huella digital. Consulte [Emparejamiento administrado por el
  Gateway](/es/gateway/pairing) para configurar el endpoint. El reloj no puede acceder de forma independiente a rutas de bucle invertido, exclusivas del iPhone
  o exclusivas de la tailnet.
- El uso de la red móvil requiere un Apple Watch compatible con conectividad móvil y con el servicio activo.
- OpenClaw está activo en el reloj. Apple no permite que las aplicaciones watchOS convencionales
  mantengan conexiones WebSocket/TCP genéricas, por lo que el Node directo utiliza consultas HTTPS
  breves y vuelve a conectarse cuando la aplicación regresa al primer plano. Consulte la
  [guía de Apple sobre redes de bajo nivel en watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configuración:

1. En el iPhone, abra **Settings -> Apple Watch**.
2. Pulse **Enable Direct Gateway Connection**.
3. Abra OpenClaw en el reloj antes de que caduque el código de configuración de corta duración.
4. Verifique la fila independiente del Apple Watch con `openclaw nodes status`.

El código de configuración contiene una credencial de arranque de corta duración exclusiva para el Node; trátela
como una contraseña hasta que caduque. Nunca contiene la contraseña ni el token del Gateway
guardados en el iPhone. Tras el emparejamiento, el reloj almacena su propio token de dispositivo y
elimina la credencial de arranque. El modo directo solo comprende los comandos indicados a continuación.
El chat, la conversación, las aprobaciones y el flujo de notificaciones `watch.*` existente siguen siendo
funciones del relay del iPhone y aún requieren el iPhone emparejado.

Comandos directos del Node de watchOS:

| Superficie    | Comandos                       | Notas                                                   |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| Dispositivo   | `device.info`, `device.status` | Identidad, batería, estado térmico, almacenamiento y red del Watch. |
| Notificaciones | `system.notify`                | Mientras la aplicación está activa; requiere permiso en el Watch.     |

watchOS no expone WebKit a aplicaciones de terceros, por lo que el Node directo del reloj
no anuncia comandos de Canvas.

## Push respaldado por relay para compilaciones oficiales

Las compilaciones oficiales distribuidas de iOS utilizan un relay de push externo en lugar de publicar el token APNs sin procesar en el Gateway. Las compilaciones oficiales de App Store procedentes del canal público de versiones utilizan el relay alojado en `https://ios-push-relay.openclaw.ai`; esta URL base está codificada para la distribución mediante App Store y no admite ninguna anulación.

Los despliegues de relay personalizados requieren una ruta de compilación y despliegue de iOS deliberadamente independiente cuya URL del relay coincida con la URL del relay del Gateway. El canal de versiones de App Store nunca acepta una URL de relay personalizada. Si utiliza una compilación con relay personalizado, establezca la URL correspondiente del relay del Gateway:

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

- La aplicación para iOS se registra en el relay mediante App Attest y un JWS de transacción de la aplicación de StoreKit.
- El relay devuelve un identificador opaco del relay junto con una concesión de envío limitada al registro.
- La aplicación para iOS obtiene la identidad del Gateway emparejado (`gateway.identity.get`) y la incluye en el registro del relay, por lo que el registro respaldado por el relay se delega en ese Gateway específico.
- La aplicación reenvía ese registro respaldado por el relay al Gateway emparejado mediante `push.apns.register`.
- El Gateway utiliza ese identificador de relay almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- Si posteriormente la aplicación se conecta a otro Gateway o a una compilación con una URL base de relay diferente, actualiza el registro del relay en lugar de reutilizar la vinculación anterior.

Lo que el Gateway **no** necesita para esta ruta: ningún token de relay para todo el despliegue ni una clave APNs directa para los envíos oficiales de App Store respaldados por el relay.

Flujo esperado para el operador:

1. Instale la aplicación oficial para iOS.
2. Opcional: establezca `gateway.push.apns.relay.baseUrl` en el Gateway únicamente cuando utilice una compilación con relay personalizado deliberadamente independiente.
3. Empareje la aplicación con el Gateway y deje que termine de conectarse.
4. La aplicación publica `push.apns.register` cuando dispone de un token APNs, la sesión del operador está conectada y el registro del relay se completa correctamente.
5. A partir de ese momento, `push.test`, las activaciones de reconexión y los avisos de activación pueden utilizar el registro respaldado por el relay almacenado.

## Señales de actividad en segundo plano

Cuando iOS activa la aplicación debido a una notificación push silenciosa, una actualización en segundo plano o un evento de cambio significativo de ubicación, la aplicación intenta una reconexión breve del Node y después llama a `node.event` con `event: "node.presence.alive"`. El Gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del Node/dispositivo emparejado únicamente después de conocer la identidad autenticada del dispositivo Node.

La aplicación considera que una activación en segundo plano se ha registrado correctamente solo cuando la respuesta del Gateway incluye `handled: true`. Los Gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización persistente de la última vez que se vio el dispositivo.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` sigue funcionando como una sustitución temporal mediante una variable de entorno para el Gateway (`gateway.push.apns.relay.baseUrl` es la ruta que prioriza la configuración).
- El modo push de la compilación de lanzamiento para App Store incorpora de forma fija el host del relé alojado y nunca lee una sustitución de la URL del relé; la variable de entorno de compilación `OPENCLAW_PUSH_RELAY_BASE_URL` solo afecta a los modos de compilación local o de entorno aislado de iOS.

## Flujo de autenticación y confianza

El relé existe para imponer dos restricciones que el uso directo de APNs en el Gateway no puede proporcionar a las compilaciones oficiales de iOS:

- Solo las compilaciones auténticas de OpenClaw para iOS distribuidas mediante Apple pueden usar el relé alojado.
- Un Gateway puede enviar notificaciones push mediante el relé únicamente a dispositivos iOS emparejados con ese Gateway específico.

Paso a paso:

1. `iOS app -> gateway`: la aplicación se empareja con el Gateway mediante el flujo de autenticación habitual del Gateway, lo que le proporciona una sesión de Node autenticada y una sesión de operador autenticada. La sesión de operador llama a `gateway.identity.get`.
2. `iOS app -> relay`: la aplicación llama a los puntos de conexión de registro del relé mediante HTTPS con una prueba de App Attest y un JWS de transacción de la aplicación de StoreKit. El relé valida el ID del paquete, la prueba de App Attest y la prueba de distribución de Apple, y exige la ruta de distribución oficial/de producción. Esto impide que las compilaciones locales de Xcode/desarrollo usen el relé alojado, ya que una compilación local no puede satisfacer la prueba de distribución oficial de Apple.
3. `gateway identity delegation`: antes del registro en el relé, la aplicación obtiene la identidad del Gateway emparejado desde `gateway.identity.get` y la incluye en la carga útil de registro del relé. El relé devuelve un identificador de relé y una autorización de envío limitada al registro y delegada a esa identidad del Gateway.
4. `gateway -> relay`: el Gateway almacena el identificador del relé y la autorización de envío de `push.apns.register`. En `push.test`, las activaciones por reconexión y los avisos de activación, el Gateway firma la solicitud de envío con su propia identidad de dispositivo; el relé verifica tanto la autorización de envío almacenada como la firma del Gateway con respecto a la identidad delegada del Gateway indicada durante el registro. Otro Gateway no puede reutilizar ese registro almacenado, aunque de algún modo obtenga el identificador.
5. `relay -> APNs`: el relé posee las credenciales de APNs de producción y el token de APNs sin procesar de la compilación oficial. El Gateway nunca almacena el token de APNs sin procesar de las compilaciones oficiales que usan el relé; el relé envía la notificación push final a APNs en nombre del Gateway emparejado.

Motivo de este diseño: mantener las credenciales de APNs de producción fuera de los Gateways de los usuarios, evitar almacenar en el Gateway los tokens de APNs sin procesar de la compilación oficial, permitir el uso del relé alojado únicamente a las compilaciones oficiales de OpenClaw para iOS e impedir que un Gateway envíe notificaciones push de activación a dispositivos iOS pertenecientes a otro Gateway.

Las compilaciones locales/manuales siguen usando APNs directamente. Si se prueban esas compilaciones sin el relé, el Gateway sigue necesitando credenciales directas de APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de ejecución del host del Gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena la autenticación de App Store Connect, como `APP_STORE_CONNECT_KEY_ID` y `APP_STORE_CONNECT_ISSUER_ID`; no configura la entrega directa mediante APNs para las compilaciones locales de iOS.

Almacenamiento recomendado en el host del Gateway, coherente con otras credenciales de proveedores en `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

No confirme el archivo `.p8` en el repositorio ni lo coloque dentro de la copia de trabajo del repositorio.

## Rutas de detección

### Bonjour (LAN)

La aplicación de iOS busca `_openclaw-gw._tcp` en `local.` y, cuando está configurado, en el mismo dominio de detección DNS-SD de área extensa. Los Gateways de la misma LAN aparecen automáticamente desde `local.`; la detección entre redes puede usar el dominio de área extensa configurado sin cambiar el tipo de señal.

### Tailnet (entre redes)

Si mDNS está bloqueado, use una zona DNS-SD unidifusión (elija un dominio; ejemplo: `openclaw.internal.`) y DNS dividido de Tailscale. Consulte [Bonjour](/es/gateway/bonjour) para ver el ejemplo de CoreDNS.

### Host/puerto manual

En Settings, active **Manual Host** e introduzca el host y el puerto del Gateway (valor predeterminado: `18789`).

## Varios Gateways

La aplicación mantiene un registro de todos los Gateways con los que se ha emparejado, lo que permite cambiar entre ellos sin volver a realizar el emparejamiento:

- **Settings -> Gateway** muestra una lista **Paired Gateways** con el Gateway activo marcado. Toque una entrada para cambiar; la aplicación cierra las sesiones actuales y vuelve a conectarse al Gateway seleccionado. Cuando hay más de un Gateway emparejado, aparece un menú de cambio rápido junto a la fila de conexión.
- Las credenciales, las decisiones de confianza TLS, las preferencias específicas de cada Gateway y el historial de chat almacenado en caché se guardan por Gateway. El cambio nunca mezcla el estado entre Gateways y el registro de notificaciones push sigue al Gateway activo.
- Deslice un Gateway emparejado (o use su menú contextual) para seleccionar **Forget**, lo que elimina sus credenciales, tokens de dispositivo, fijación TLS y chats almacenados en caché.
- Los Gateways detectados deben estar visibles en la red para poder cambiar a ellos; los Gateways manuales vuelven a conectarse mediante el host y el puerto guardados.

## Canvas + A2UI

El Node de iOS representa un Canvas WKWebView. Use `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host del Canvas del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/` desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, valor predeterminado: `18789`).
- El Node de iOS mantiene la estructura integrada como vista conectada predeterminada. `canvas.a2ui.push` y `canvas.a2ui.reset` usan la página A2UI incluida y propiedad de la aplicación.
- Las páginas A2UI remotas del Gateway son de solo representación en iOS; las acciones de botones A2UI nativas solo se aceptan desde páginas incluidas y propiedad de la aplicación.
- Vuelva a la estructura integrada con `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La aplicación de iOS es una superficie de Node móvil, no un backend de Codex Computer Use. Codex Computer Use y `cua-driver mcp` controlan un escritorio local de macOS mediante herramientas MCP; la aplicación de iOS expone las capacidades del iPhone mediante comandos de Node de OpenClaw como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes pueden seguir operando la aplicación de iOS mediante OpenClaw invocando comandos de Node, pero esas llamadas pasan por el protocolo de Node del Gateway y están sujetas a los límites de primer plano/segundo plano de iOS. Use [Codex Computer Use](/es/plugins/codex-computer-use) para controlar el escritorio local y esta página para consultar las capacidades del Node de iOS.

### Evaluación/instantánea del Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo de conversación

- La activación por voz y el modo de conversación están disponibles en Settings.
- La conversación en tiempo real de OpenAI usa WebRTC controlado por el cliente cuando `talk.realtime.transport` es `webrtc`; una configuración explícita de `gateway-relay` sigue estando controlada por el Gateway. Consulte [Modo de conversación](/es/nodes/talk).
- Los Nodes de iOS compatibles con conversación anuncian la capacidad `talk` y pueden declarar `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once`; el Gateway permite de forma predeterminada esos comandos de pulsar para hablar en Nodes de confianza compatibles con conversación.
- iOS puede suspender el audio en segundo plano; las funciones de voz deben considerarse sujetas a disponibilidad cuando la aplicación no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: lleve la aplicación de iOS al primer plano (los comandos de Canvas/cámara/pantalla lo requieren).
- `A2UI_HOST_UNAVAILABLE`: no se pudo acceder a la página A2UI incluida desde la WebView de la aplicación; mantenga la aplicación en primer plano en la pestaña Screen y vuelva a intentarlo.
- La solicitud de emparejamiento nunca aparece: ejecute `openclaw devices list` y apruébela manualmente.
- El Watch no muestra el estado del iPhone: confirme que el iPhone indique `watchPaired: true`
  y `watchAppInstalled: true` en `watch.status`. Si el emparejamiento es falso, empareje el
  Watch en la aplicación Watch de Apple. Si la instalación es falsa, instale la aplicación complementaria
  desde **My Watch -> Available Apps**. Después de cualquiera de los cambios, abra OpenClaw una vez en el
  Watch; la disponibilidad inmediata sigue requiriendo que ambas aplicaciones estén en ejecución,
  mientras que las actualizaciones en cola pueden llegar más tarde en segundo plano.
- La reconexión falla después de reinstalar: se borró el token de emparejamiento del llavero; vuelva a emparejar el Node.

## Documentación relacionada

- [Emparejamiento](/es/channels/pairing)
- [Detección](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
