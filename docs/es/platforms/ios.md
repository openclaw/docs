---
read_when:
    - Emparejar o reconectar el nodo iOS
    - Ejecutar la aplicación iOS desde el código fuente
    - Depurar la detección del Gateway o comandos de lienzo
summary: 'Aplicación de nodo iOS: conexión al Gateway, emparejamiento, lienzo y resolución de problemas'
title: Aplicación para iOS
x-i18n:
    generated_at: "2026-07-05T11:31:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 627b48b8ae742423c21eabf65a55bbb4477c96447565ad6f5469e9cfb51b0ca1
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: las compilaciones de la app para iPhone se distribuyen mediante los canales de Apple cuando están habilitadas para una versión. Las compilaciones de desarrollo local también pueden ejecutarse desde el código fuente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone capacidades de nodo: Lienzo, instantánea de pantalla, captura de cámara, ubicación, modo de conversación, activación por voz.
- Recibe comandos `node.invoke` e informa eventos de estado del nodo.

## Requisitos

- Gateway en ejecución en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - Misma LAN mediante Bonjour, **o**
  - Tailnet mediante DNS-SD unicast (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host/puerto manual (respaldo).

## Inicio rápido (emparejar + conectar)

1. Inicia un Gateway autenticado con una ruta que tu teléfono pueda alcanzar. Tailscale
   Serve es la ruta remota recomendada:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Para una configuración confiable en la misma LAN, usa en su lugar un `gateway.bind: "lan"`
autenticado. El enlace local loopback predeterminado no es accesible desde un teléfono. Si el
Gateway aún no se ha configurado, ejecuta primero `openclaw onboard` para que la creación del
código de configuración tenga una ruta de autenticación con token o contraseña.

2. Abre la [IU de control](/es/web/control-ui), selecciona **Nodos** y haz clic en
   **Emparejar dispositivo móvil** en la tarjeta **Dispositivos**.

3. En la app de iOS, abre **Configuración** -> **Gateway**, escanea el código QR (o pega
   el código de configuración) y conéctate.

4. La app oficial se conecta automáticamente. Si **Dispositivos** muestra una solicitud
   pendiente, revisa su rol y ámbitos antes de aprobarla.

El botón de la IU de control requiere una sesión ya emparejada con `operator.admin`.
Como respaldo desde la terminal, elige un gateway descubierto en la app de iOS (o habilita
Host manual e introduce host/puerto), y luego aprueba la solicitud en el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la app reintenta el emparejamiento con detalles de autenticación cambiados (rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`. Ejecuta `openclaw devices list` otra vez antes de aprobar.

Opcional: si el nodo iOS siempre se conecta desde una subred estrictamente controlada, puedes optar por la aprobación automática de nodos por primera vez con CIDR explícitos o IP exactas:

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

Esto está deshabilitado de forma predeterminada. Se aplica solo al emparejamiento nuevo con `role: node` sin ámbitos solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

5. Verifica la conexión:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push respaldado por relé para compilaciones oficiales

Las compilaciones oficiales distribuidas de iOS usan un relé push externo en lugar de publicar el token APNs sin procesar en el gateway. Las compilaciones oficiales de App Store desde el carril de versión pública usan el relé alojado en `https://ios-push-relay.openclaw.ai`; esta URL base está codificada para la distribución de App Store y no lee ninguna sobrescritura.

Los despliegues de relé personalizados requieren una ruta de compilación/despliegue de iOS deliberadamente separada cuya URL de relé coincida con la URL de relé del gateway. El carril de versión de App Store nunca acepta una URL de relé personalizada. Si usas una compilación con relé personalizado, configura la URL de relé del gateway correspondiente:

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

- La app de iOS se registra con el relé mediante App Attest y un JWS de transacción de app de StoreKit.
- El relé devuelve un identificador de relé opaco más una concesión de envío con ámbito de registro.
- La app de iOS obtiene la identidad del gateway emparejado (`gateway.identity.get`) y la incluye en el registro del relé, de modo que el registro respaldado por relé se delega a ese gateway específico.
- La app reenvía ese registro respaldado por relé al gateway emparejado con `push.apns.register`.
- El gateway usa ese identificador de relé almacenado para `push.test`, activaciones en segundo plano y señales de activación.
- Si la app se conecta más tarde a un gateway diferente o a una compilación con una URL base de relé distinta, actualiza el registro del relé en lugar de reutilizar la vinculación anterior.

Lo que el gateway **no** necesita para esta ruta: ningún token de relé de todo el despliegue, ninguna clave APNs directa para envíos oficiales respaldados por relé de App Store.

Flujo esperado para el operador:

1. Instala la app oficial de iOS.
2. Opcional: configura `gateway.push.apns.relay.baseUrl` en el gateway solo cuando uses una compilación con relé personalizado deliberadamente separada.
3. Empareja la app con el gateway y deja que termine de conectarse.
4. La app publica `push.apns.register` una vez que tiene un token APNs, la sesión de operador está conectada y el registro del relé se completa correctamente.
5. Después de eso, `push.test`, las activaciones de reconexión y las señales de activación pueden usar el registro almacenado respaldado por relé.

## Balizas de actividad en segundo plano

Cuando iOS activa la app por una notificación push silenciosa, actualización en segundo plano o evento de ubicación significativa, la app intenta una reconexión breve del nodo y luego llama a `node.event` con `event: "node.presence.alive"`. El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del nodo/dispositivo emparejado solo después de conocer la identidad autenticada del dispositivo de nodo.

La app considera que una activación en segundo plano se registró correctamente solo cuando la respuesta del gateway incluye `handled: true`. Los gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización duradera de última vez visto.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` todavía funciona como sobrescritura temporal de entorno para el gateway (`gateway.push.apns.relay.baseUrl` es la ruta prioritaria de configuración).
- El modo push de la compilación de versión de App Store codifica el host de relé alojado y nunca lee una sobrescritura de URL de relé: la variable de entorno de compilación `OPENCLAW_PUSH_RELAY_BASE_URL` solo afecta los modos de compilación local/sandbox de iOS.

## Flujo de autenticación y confianza

El relé existe para aplicar dos restricciones que APNs directo en el gateway no puede proporcionar para compilaciones oficiales de iOS:

- Solo las compilaciones genuinas de OpenClaw para iOS distribuidas mediante Apple pueden usar el relé alojado.
- Un gateway puede enviar pushes respaldados por relé solo para dispositivos iOS emparejados con ese gateway específico.

Salto a salto:

1. `iOS app -> gateway`: la app se empareja con el gateway mediante el flujo normal de autenticación del Gateway, lo que le da una sesión de nodo autenticada más una sesión de operador autenticada. La sesión de operador llama a `gateway.identity.get`.
2. `iOS app -> relay`: la app llama a los endpoints de registro del relé mediante HTTPS con prueba de App Attest más un JWS de transacción de app de StoreKit. El relé valida el ID de paquete, la prueba de App Attest y la prueba de distribución de Apple, y requiere la ruta de distribución oficial/producción; esto es lo que impide que las compilaciones locales de Xcode/desarrollo usen el relé alojado, ya que una compilación local no puede satisfacer la prueba de distribución oficial de Apple.
3. `gateway identity delegation`: antes del registro del relé, la app obtiene la identidad del gateway emparejado desde `gateway.identity.get` y la incluye en la carga útil de registro del relé. El relé devuelve un identificador de relé y una concesión de envío con ámbito de registro delegada a esa identidad de gateway.
4. `gateway -> relay`: el gateway almacena el identificador de relé y la concesión de envío de `push.apns.register`. En `push.test`, activaciones de reconexión y señales de activación, el gateway firma la solicitud de envío con su propia identidad de dispositivo; el relé verifica tanto la concesión de envío almacenada como la firma del gateway contra la identidad de gateway delegada desde el registro. Otro gateway no puede reutilizar ese registro almacenado, incluso si de algún modo obtiene el identificador.
5. `relay -> APNs`: el relé posee las credenciales APNs de producción y el token APNs sin procesar para la compilación oficial. El gateway nunca almacena el token APNs sin procesar para compilaciones oficiales respaldadas por relé; el relé envía el push final a APNs en nombre del gateway emparejado.

Por qué se creó este diseño: para mantener las credenciales APNs de producción fuera de los gateways de usuarios, evitar almacenar tokens APNs sin procesar de compilaciones oficiales en el gateway, permitir el uso del relé alojado solo para compilaciones oficiales de OpenClaw para iOS e impedir que un gateway envíe pushes de activación a dispositivos iOS pertenecientes a un gateway diferente.

Las compilaciones locales/manuales permanecen en APNs directo. Si estás probando esas compilaciones sin el relé, el gateway aún necesita credenciales APNs directas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de runtime del host del gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena autenticación de App Store Connect como `APP_STORE_CONNECT_KEY_ID` y `APP_STORE_CONNECT_ISSUER_ID`; no configura la entrega APNs directa para compilaciones locales de iOS.

Almacenamiento recomendado en el host del gateway, coherente con otras credenciales de proveedores bajo `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

No confirmes el archivo `.p8` ni lo coloques bajo el checkout del repositorio.

## Rutas de descubrimiento

### Bonjour (LAN)

La app de iOS busca `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo dominio de descubrimiento DNS-SD de área amplia. Los gateways en la misma LAN aparecen automáticamente desde `local.`; el descubrimiento entre redes puede usar el dominio de área amplia configurado sin cambiar el tipo de baliza.

### Tailnet (entre redes)

Si mDNS está bloqueado, usa una zona DNS-SD unicast (elige un dominio; ejemplo: `openclaw.internal.`) y DNS dividido de Tailscale. Consulta [Bonjour](/es/gateway/bonjour) para ver el ejemplo de CoreDNS.

### Host/puerto manual

En Configuración, habilita **Host manual** e introduce el host + puerto del gateway (predeterminado `18789`).

## Lienzo + A2UI

El nodo iOS renderiza un lienzo WKWebView. Usa `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host de lienzo del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/`, desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, predeterminado `18789`).
- El nodo iOS mantiene el andamiaje integrado como la vista predeterminada conectada. `canvas.a2ui.push` y `canvas.a2ui.reset` usan la página A2UI incluida y propiedad de la app.
- Las páginas A2UI remotas del Gateway son solo de renderizado en iOS; las acciones nativas de botones A2UI se aceptan solo desde páginas incluidas y propiedad de la app.
- Vuelve al andamiaje integrado con `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La app de iOS es una superficie de nodo móvil, no un backend de Codex Computer Use. Codex Computer Use y `cua-driver mcp` controlan un escritorio local de macOS mediante herramientas MCP; la app de iOS expone capacidades de iPhone mediante comandos de nodo de OpenClaw como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes aún pueden operar la app de iOS mediante OpenClaw invocando comandos de nodo, pero esas llamadas pasan por el protocolo de nodos del gateway y siguen los límites de primer plano/segundo plano de iOS. Usa [Codex Computer Use](/es/plugins/codex-computer-use) para el control del escritorio local y esta página para las capacidades de nodo iOS.

### Evaluación / instantánea de lienzo

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo de conversación

- La activación por voz y el modo de conversación están disponibles en Configuración.
- La conversación en tiempo real de OpenAI usa WebRTC propiedad del cliente cuando `talk.realtime.transport` es `webrtc`; una configuración explícita de `gateway-relay` sigue siendo propiedad del Gateway. Consulta [Modo de conversación](/es/nodes/talk).
- Los nodos iOS compatibles con conversación anuncian la capacidad `talk` y pueden declarar `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once`; el Gateway permite esos comandos de pulsar para hablar de forma predeterminada para los nodos de confianza compatibles con conversación.
- iOS puede suspender el audio en segundo plano; trata las funciones de voz como de mejor esfuerzo cuando la app no esté activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: trae la app de iOS al primer plano (los comandos de lienzo/cámara/pantalla lo requieren).
- `A2UI_HOST_UNAVAILABLE`: no se pudo acceder a la página A2UI incluida desde la WebView de la app; mantén la app en primer plano en la pestaña Pantalla y vuelve a intentarlo.
- La solicitud de emparejamiento nunca aparece: ejecuta `openclaw devices list` y aprueba manualmente.
- La reconexión falla después de reinstalar: se borró el token de emparejamiento del llavero; vuelve a emparejar el nodo.

## Documentación relacionada

- [Emparejamiento](/es/channels/pairing)
- [Discovery](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
