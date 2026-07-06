---
read_when:
    - Emparejar o reconectar el nodo iOS
    - Ejecutar la aplicación iOS desde el código fuente
    - Depuración del descubrimiento del gateway o de los comandos de canvas
summary: 'App de Node para iOS: conexión al Gateway, emparejamiento, lienzo y solución de problemas'
title: Aplicación de iOS
x-i18n:
    generated_at: "2026-07-06T10:49:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b118e6983ba0077e9d4752548ef3ea3adfe699a10398f673520610076004da1b
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: las compilaciones de la app para iPhone se distribuyen a través de los canales de Apple cuando están habilitadas para una versión. Las compilaciones de desarrollo local también pueden ejecutarse desde el código fuente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone capacidades del nodo: Canvas, instantánea de pantalla, captura de cámara, ubicación, modo Talk y activación por voz.
- Recibe comandos `node.invoke` e informa eventos de estado del nodo.
- Mantiene una pequeña caché sin conexión de solo lectura de sesiones de chat y transcripciones recientes por gateway emparejado: los inicios en frío muestran inmediatamente la última transcripción conocida y se actualizan cuando el gateway responde, los chats recientes siguen disponibles para navegar mientras está desconectado, y restablecer/olvidar purga la caché local protegida.
- Pone en cola los mensajes de texto enviados mientras está desconectado en una bandeja de salida duradera por gateway (hasta 50): las burbujas en cola se muestran en la transcripción, se envían en orden al reconectar con claves de idempotencia para que nada se envíe dos veces, reintentan con retroceso antes de aparecer como "No enviado" con reintentar/eliminar en el menú contextual del mensaje, y caducan en lugar de enviarse después de 48 horas sin conexión; restablecer/olvidar borra la cola junto con la caché.

## Requisitos

- Gateway ejecutándose en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - Misma LAN mediante Bonjour, **o**
  - Tailnet mediante DNS-SD unicast (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host/puerto manual (respaldo).

## Inicio rápido (emparejar + conectar)

1. Inicia un Gateway autenticado con una ruta accesible desde tu teléfono. Tailscale
   Serve es la ruta remota recomendada:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Para una configuración de confianza en la misma LAN, usa en su lugar un `gateway.bind: "lan"`
autenticado. El enlace local loopback predeterminado no es accesible desde un teléfono. Si el
Gateway aún no se ha configurado, ejecuta primero `openclaw onboard` para que la creación
del código de configuración tenga una ruta de autenticación con token o contraseña.

2. Abre la [Control UI](/es/web/control-ui), selecciona **Nodos** y haz clic en
   **Emparejar dispositivo móvil** en la tarjeta **Dispositivos**.

3. En la app de iOS, abre **Configuración** -> **Gateway**, escanea el código QR (o pega
   el código de configuración) y conecta.

   Si el código de configuración contiene rutas de LAN y Tailscale Serve, la app
   las prueba en orden y guarda el primer endpoint accesible.

4. La app oficial se conecta automáticamente. Si **Dispositivos** muestra una solicitud
   pendiente, revisa su rol y alcances antes de aprobarla.

La app complementaria de Apple Watch no tiene una aprobación de emparejamiento de OpenClaw separada.
Empareja el Watch con el iPhone en la app Watch de Apple, instala OpenClaw desde
**App Watch -> Mi Watch -> Apps disponibles** y luego abre OpenClaw una vez en ambos
dispositivos. OpenClaw sigue inmediatamente los cambios de emparejamiento e instalación de Apple Watch;
la aprobación de dispositivo del Gateway cubre el nodo del iPhone.

El botón de la Control UI requiere una sesión ya emparejada con `operator.admin`.
Como alternativa desde la terminal, elige un gateway descubierto en la app de iOS (o habilita
Host manual e introduce el host/puerto), y luego aprueba la solicitud en el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la app reintenta el emparejamiento con detalles de autenticación cambiados (rol/alcances/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`. Ejecuta `openclaw devices list` de nuevo antes de aprobar.

Opcional: si el nodo de iOS siempre se conecta desde una subred muy controlada, puedes optar por la aprobación automática de nodos por primera vez con CIDR explícitos o IP exactas:

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

Esto está deshabilitado de forma predeterminada. Solo se aplica al emparejamiento nuevo con `role: node` sin alcances solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, alcance, metadatos o clave pública aún requieren aprobación manual.

5. Verifica la conexión:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push respaldado por relay para compilaciones oficiales

Las compilaciones oficiales distribuidas de iOS usan un relay de push externo en lugar de publicar el token APNs sin procesar en el gateway. Las compilaciones oficiales de App Store del canal de lanzamiento público usan el relay alojado en `https://ios-push-relay.openclaw.ai`; esta URL base está codificada para la distribución de App Store y no lee ninguna anulación.

Los despliegues de relay personalizados requieren una ruta de compilación/despliegue de iOS deliberadamente separada cuya URL de relay coincida con la URL de relay del gateway. El canal de lanzamiento de App Store nunca acepta una URL de relay personalizada. Si usas una compilación con relay personalizado, establece la URL de relay correspondiente del gateway:

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

- La app de iOS se registra con el relay usando App Attest y un JWS de transacción de app de StoreKit.
- El relay devuelve un identificador de relay opaco más una concesión de envío con alcance de registro.
- La app de iOS obtiene la identidad del gateway emparejado (`gateway.identity.get`) y la incluye en el registro del relay, de modo que el registro respaldado por relay se delega a ese gateway específico.
- La app reenvía ese registro respaldado por relay al gateway emparejado con `push.apns.register`.
- El gateway usa ese identificador de relay almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- Si más adelante la app se conecta a otro gateway o a una compilación con una URL base de relay distinta, actualiza el registro del relay en lugar de reutilizar el enlace anterior.

Lo que el gateway **no** necesita para esta ruta: ningún token de relay para todo el despliegue, ninguna clave APNs directa para envíos oficiales de App Store respaldados por relay.

Flujo esperado del operador:

1. Instala la app oficial de iOS.
2. Opcional: establece `gateway.push.apns.relay.baseUrl` en el gateway solo cuando uses una compilación con relay personalizado deliberadamente separada.
3. Empareja la app con el gateway y deja que termine de conectarse.
4. La app publica `push.apns.register` una vez que tiene un token APNs, la sesión del operador está conectada y el registro del relay se completa correctamente.
5. Después, `push.test`, las activaciones de reconexión y los avisos de activación pueden usar el registro almacenado respaldado por relay.

## Señales de vida en segundo plano

Cuando iOS despierta la app por un push silencioso, actualización en segundo plano o evento de ubicación significativa, la app intenta una breve reconexión del nodo y luego llama a `node.event` con `event: "node.presence.alive"`. El gateway lo registra como `lastSeenAtMs`/`lastSeenReason` en los metadatos del nodo/dispositivo emparejado solo después de conocer la identidad autenticada del dispositivo de nodo.

La app considera que una activación en segundo plano se registró correctamente solo cuando la respuesta del gateway incluye `handled: true`. Los gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización duradera de última actividad.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` sigue funcionando como anulación temporal de env para el gateway (`gateway.push.apns.relay.baseUrl` es la ruta que prioriza la configuración).
- El modo push de la compilación de lanzamiento de App Store codifica el host de relay alojado y nunca lee una anulación de URL de relay: la variable env de tiempo de compilación `OPENCLAW_PUSH_RELAY_BASE_URL` solo afecta a los modos de compilación local/sandbox de iOS.

## Flujo de autenticación y confianza

El relay existe para imponer dos restricciones que APNs directo en gateway no puede proporcionar para compilaciones oficiales de iOS:

- Solo las compilaciones genuinas de OpenClaw para iOS distribuidas a través de Apple pueden usar el relay alojado.
- Un gateway solo puede enviar pushes respaldados por relay a dispositivos iOS que se emparejaron con ese gateway específico.

Salto por salto:

1. `iOS app -> gateway`: la app se empareja con el gateway mediante el flujo normal de autenticación de Gateway, lo que le da una sesión de nodo autenticada más una sesión de operador autenticada. La sesión de operador llama a `gateway.identity.get`.
2. `iOS app -> relay`: la app llama a los endpoints de registro del relay por HTTPS con prueba de App Attest más un JWS de transacción de app de StoreKit. El relay valida el ID de paquete, la prueba de App Attest y la prueba de distribución de Apple, y exige la ruta de distribución oficial/producción; esto es lo que bloquea que compilaciones locales de Xcode/desarrollo usen el relay alojado, ya que una compilación local no puede satisfacer la prueba de distribución oficial de Apple.
3. `delegación de identidad del gateway`: antes del registro del relay, la app obtiene la identidad del gateway emparejado desde `gateway.identity.get` y la incluye en la carga útil de registro del relay. El relay devuelve un identificador de relay y una concesión de envío con alcance de registro delegada a esa identidad de gateway.
4. `gateway -> relay`: el gateway almacena el identificador de relay y la concesión de envío de `push.apns.register`. En `push.test`, activaciones de reconexión y avisos de activación, el gateway firma la solicitud de envío con su propia identidad de dispositivo; el relay verifica tanto la concesión de envío almacenada como la firma del gateway frente a la identidad de gateway delegada desde el registro. Otro gateway no puede reutilizar ese registro almacenado, aunque de algún modo obtenga el identificador.
5. `relay -> APNs`: el relay posee las credenciales APNs de producción y el token APNs sin procesar de la compilación oficial. El gateway nunca almacena el token APNs sin procesar para compilaciones oficiales respaldadas por relay; el relay envía el push final a APNs en nombre del gateway emparejado.

Por qué se creó este diseño: para mantener las credenciales APNs de producción fuera de los gateways de usuario, evitar almacenar tokens APNs sin procesar de compilaciones oficiales en el gateway, permitir el uso del relay alojado solo para compilaciones oficiales de OpenClaw para iOS e impedir que un gateway envíe pushes de activación a dispositivos iOS pertenecientes a otro gateway.

Las compilaciones locales/manuales permanecen con APNs directo. Si pruebas esas compilaciones sin el relay, el gateway aún necesita credenciales APNs directas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables env de tiempo de ejecución del host del gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena autenticación de App Store Connect, como `APP_STORE_CONNECT_KEY_ID` y `APP_STORE_CONNECT_ISSUER_ID`; no configura la entrega directa de APNs para compilaciones locales de iOS.

Almacenamiento recomendado en el host del gateway, coherente con otras credenciales de proveedores en `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

No confirmes el archivo `.p8` ni lo coloques dentro del checkout del repo.

## Rutas de descubrimiento

### Bonjour (LAN)

La app de iOS explora `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo dominio de descubrimiento DNS-SD de área amplia. Los gateways de la misma LAN aparecen automáticamente desde `local.`; el descubrimiento entre redes puede usar el dominio de área amplia configurado sin cambiar el tipo de señal.

### Tailnet (entre redes)

Si mDNS está bloqueado, usa una zona DNS-SD unicast (elige un dominio; ejemplo: `openclaw.internal.`) y DNS dividido de Tailscale. Consulta [Bonjour](/es/gateway/bonjour) para ver el ejemplo de CoreDNS.

### Host/puerto manual

En Configuración, habilita **Host manual** e introduce el host + puerto del gateway (predeterminado `18789`).

## Canvas + A2UI

El nodo de iOS renderiza un canvas WKWebView. Usa `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host de canvas del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/` desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, predeterminado `18789`).
- El nodo de iOS mantiene el andamiaje integrado como vista predeterminada conectada. `canvas.a2ui.push` y `canvas.a2ui.reset` usan la página A2UI agrupada propiedad de la app.
- Las páginas A2UI remotas del Gateway son solo de renderizado en iOS; las acciones nativas de botones A2UI solo se aceptan desde páginas agrupadas propiedad de la app.
- Vuelve al andamiaje integrado con `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La app de iOS es una interfaz de nodo móvil, no un backend de Codex Computer Use. Codex Computer Use y `cua-driver mcp` controlan un escritorio local de macOS mediante herramientas MCP; la app de iOS expone capacidades de iPhone mediante comandos de nodo de OpenClaw como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes todavía pueden operar la app de iOS mediante OpenClaw invocando comandos de nodo, pero esas llamadas pasan por el protocolo de nodo del Gateway y siguen los límites de primer plano/segundo plano de iOS. Usa [Codex Computer Use](/es/plugins/codex-computer-use) para el control del escritorio local y esta página para las capacidades de nodo de iOS.

### Evaluación / instantánea de canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo de conversación

- La activación por voz y el modo de conversación están disponibles en Configuración.
- Talk en tiempo real de OpenAI usa WebRTC propiedad del cliente cuando `talk.realtime.transport` es `webrtc`; una configuración explícita de `gateway-relay` sigue siendo propiedad del Gateway. Consulta [Modo de conversación](/es/nodes/talk).
- Los nodos de iOS compatibles con Talk anuncian la capacidad `talk` y pueden declarar `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once`; el Gateway permite esos comandos de pulsar para hablar de forma predeterminada para nodos confiables compatibles con Talk.
- iOS puede suspender el audio en segundo plano; trata las funciones de voz como de mejor esfuerzo cuando la app no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: lleva la app de iOS al primer plano (los comandos de canvas/cámara/pantalla lo requieren).
- `A2UI_HOST_UNAVAILABLE`: no se pudo acceder a la página A2UI incluida en la WebView de la app; mantén la app en primer plano en la pestaña Pantalla y vuelve a intentarlo.
- La solicitud de emparejamiento nunca aparece: ejecuta `openclaw devices list` y aprueba manualmente.
- Watch no muestra ningún estado del iPhone: confirma que el iPhone informa `watchPaired: true`
  y `watchAppInstalled: true` en `watch.status`. Si el emparejamiento es falso, empareja el
  Watch en la app Watch de Apple. Si la instalación es falsa, instala la app complementaria
  desde **Mi reloj -> Apps disponibles**. Después de cualquiera de los cambios, abre OpenClaw en el
  Watch una vez; la accesibilidad inmediata todavía requiere que ambas apps se estén ejecutando,
  mientras que las actualizaciones en cola pueden llegar más tarde en segundo plano.
- La reconexión falla después de reinstalar: se borró el token de emparejamiento del Keychain; vuelve a emparejar el nodo.

## Documentación relacionada

- [Emparejamiento](/es/channels/pairing)
- [Descubrimiento](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
