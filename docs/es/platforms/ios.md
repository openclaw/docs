---
read_when:
    - Emparejar o reconectar el nodo iOS
    - Ejecutar la aplicación iOS desde el código fuente
    - Depuración del descubrimiento del Gateway o de comandos de canvas
summary: 'Aplicación de nodo para iOS: conexión al Gateway, emparejamiento, lienzo y solución de problemas'
title: aplicación para iOS
x-i18n:
    generated_at: "2026-07-02T22:22:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: las compilaciones de la app para iPhone se distribuyen a través de los canales de Apple cuando están habilitadas para una versión. Las compilaciones de desarrollo local también pueden ejecutarse desde el código fuente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone capacidades de nodo: Canvas, instantánea de pantalla, captura de cámara, ubicación, modo Talk, activación por voz.
- Recibe comandos `node.invoke` e informa eventos de estado del nodo.

## Requisitos

- Gateway ejecutándose en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - La misma LAN mediante Bonjour, **o**
  - Tailnet mediante DNS-SD unicast (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host/puerto manual (alternativa).

## Inicio rápido (emparejar + conectar)

1. Inicia el Gateway:

```bash
openclaw gateway --port 18789
```

2. En la app de iOS, abre Ajustes y elige un gateway descubierto (o habilita Host manual e introduce host/puerto).

3. Aprueba la solicitud de emparejamiento en el host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la app reintenta el emparejamiento con detalles de autenticación modificados (rol/ámbitos/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

Opcional: si el nodo de iOS siempre se conecta desde una subred estrictamente controlada, puedes
activar la aprobación automática inicial de nodos con CIDR explícitos o IP exactas:

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

Esto está deshabilitado de forma predeterminada. Solo se aplica al emparejamiento nuevo con `role: node`
sin ámbitos solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, ámbito, metadatos o
clave pública siguen requiriendo aprobación manual.

4. Verifica la conexión:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push respaldado por relay para compilaciones oficiales

Las compilaciones oficiales distribuidas de iOS usan el relay de push externo en lugar de publicar el token APNs
sin procesar en el gateway.

Las compilaciones oficiales de App Store del canal público de lanzamiento usan el relay alojado en `https://ios-push-relay.openclaw.ai`.

Los despliegues de relay personalizados requieren una ruta de compilación/despliegue de iOS deliberadamente separada cuya URL de relay coincida con la URL de relay del gateway. El canal público de lanzamiento de App Store no acepta anulaciones de URL de relay personalizada. Si usas una compilación con relay personalizado, configura la URL de relay correspondiente del gateway:

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
- El relay devuelve un identificador de relay opaco más una concesión de envío limitada al registro.
- La app de iOS obtiene la identidad del gateway emparejado y la incluye en el registro del relay, de modo que el registro respaldado por relay se delega a ese gateway específico.
- La app reenvía ese registro respaldado por relay al gateway emparejado con `push.apns.register`.
- El gateway usa ese identificador de relay almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- Las URL de relay de gateway personalizadas deben coincidir con la URL de relay integrada en la compilación de iOS.
- Si la app se conecta más tarde a un gateway diferente o a una compilación con una URL base de relay diferente, actualiza el registro de relay en lugar de reutilizar la vinculación anterior.

Lo que el gateway **no** necesita para esta ruta:

- Ningún token de relay para todo el despliegue.
- Ninguna clave APNs directa para envíos respaldados por relay de la App Store oficial.

Flujo esperado para el operador:

1. Instala la app oficial de iOS.
2. Opcional: configura `gateway.push.apns.relay.baseUrl` en el gateway solo cuando uses una compilación de relay personalizado deliberadamente separada.
3. Empareja la app con el gateway y deja que termine de conectarse.
4. La app publica `push.apns.register` automáticamente después de tener un token APNs, de que la sesión del operador esté conectada y de que el registro de relay se complete correctamente.
5. Después de eso, `push.test`, las activaciones de reconexión y los avisos de activación pueden usar el registro almacenado respaldado por relay.

## Beacons de presencia en segundo plano

Cuando iOS despierta la app por un push silencioso, una actualización en segundo plano o un evento de ubicación significativa, la app
intenta una reconexión breve del nodo y luego llama a `node.event` con `event: "node.presence.alive"`.
El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del nodo/dispositivo emparejado solo
después de conocer la identidad autenticada del dispositivo de nodo.

La app considera que una activación en segundo plano se registró correctamente solo cuando la respuesta del gateway incluye
`handled: true`. Los gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es
compatible, pero no cuenta como una actualización duradera de última presencia.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` sigue funcionando como anulación temporal de entorno para el gateway.
- El canal público de lanzamiento de App Store rechaza `OPENCLAW_PUSH_RELAY_BASE_URL` para compilaciones de iOS.

## Flujo de autenticación y confianza

El relay existe para imponer dos restricciones que APNs directo en el gateway no puede proporcionar para
compilaciones oficiales de iOS:

- Solo las compilaciones genuinas de OpenClaw para iOS distribuidas a través de Apple pueden usar el relay alojado.
- Un gateway puede enviar pushes respaldados por relay solo para dispositivos iOS emparejados con ese gateway específico.

Salto a salto:

1. `iOS app -> gateway`
   - La app primero se empareja con el gateway mediante el flujo de autenticación normal del Gateway.
   - Eso da a la app una sesión de nodo autenticada más una sesión de operador autenticada.
   - La sesión de operador se usa para llamar a `gateway.identity.get`.

2. `iOS app -> relay`
   - La app llama a los endpoints de registro del relay mediante HTTPS.
   - El registro incluye una prueba de App Attest más un JWS de transacción de app de StoreKit.
   - El relay valida el ID de paquete, la prueba de App Attest y la prueba de distribución de Apple, y exige la
     ruta de distribución oficial/de producción.
   - Esto es lo que bloquea que las compilaciones locales de Xcode/desarrollo usen el relay alojado. Una compilación local puede estar
     firmada, pero no satisface la prueba de distribución oficial de Apple que espera el relay.

3. `gateway identity delegation`
   - Antes del registro del relay, la app obtiene la identidad del gateway emparejado desde
     `gateway.identity.get`.
   - La app incluye esa identidad del gateway en la carga útil de registro del relay.
   - El relay devuelve un identificador de relay y una concesión de envío limitada al registro delegados a
     esa identidad del gateway.

4. `gateway -> relay`
   - El gateway almacena el identificador de relay y la concesión de envío de `push.apns.register`.
   - En `push.test`, activaciones de reconexión y avisos de activación, el gateway firma la solicitud de envío con su
     propia identidad de dispositivo.
   - El relay verifica tanto la concesión de envío almacenada como la firma del gateway contra la identidad de
     gateway delegada desde el registro.
   - Otro gateway no puede reutilizar ese registro almacenado, incluso si de algún modo obtiene el identificador.

5. `relay -> APNs`
   - El relay posee las credenciales APNs de producción y el token APNs sin procesar para la compilación oficial.
   - El gateway nunca almacena el token APNs sin procesar para compilaciones oficiales respaldadas por relay.
   - El relay envía el push final a APNs en nombre del gateway emparejado.

Por qué se creó este diseño:

- Para mantener las credenciales APNs de producción fuera de los gateways de usuario.
- Para evitar almacenar tokens APNs sin procesar de compilaciones oficiales en el gateway.
- Para permitir el uso del relay alojado solo para compilaciones oficiales de OpenClaw para iOS.
- Para impedir que un gateway envíe pushes de activación a dispositivos iOS pertenecientes a un gateway diferente.

Las compilaciones locales/manuales permanecen en APNs directo. Si pruebas esas compilaciones sin el relay, el
gateway sigue necesitando credenciales APNs directas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de tiempo de ejecución del host del gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena
autenticación de App Store Connect como `APP_STORE_CONNECT_KEY_ID` y
`APP_STORE_CONNECT_ISSUER_ID`; no configura la entrega APNs directa para compilaciones locales de iOS.

Almacenamiento recomendado en el host del gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

No confirmes el archivo `.p8` ni lo coloques dentro del checkout del repositorio.

## Rutas de descubrimiento

### Bonjour (LAN)

La app de iOS explora `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo
dominio de descubrimiento DNS-SD de área amplia. Los gateways de la misma LAN aparecen automáticamente desde `local.`;
el descubrimiento entre redes puede usar el dominio de área amplia configurado sin cambiar el tipo de beacon.

### Tailnet (entre redes)

Si mDNS está bloqueado, usa una zona DNS-SD unicast (elige un dominio; ejemplo:
`openclaw.internal.`) y DNS dividido de Tailscale.
Consulta [Bonjour](/es/gateway/bonjour) para ver el ejemplo de CoreDNS.

### Host/puerto manual

En Ajustes, habilita **Host manual** e introduce el host + puerto del gateway (predeterminado `18789`).

## Canvas + A2UI

El nodo de iOS renderiza un canvas de WKWebView. Usa `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host de canvas del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/`.
- Se sirve desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, predeterminado `18789`).
- El nodo de iOS mantiene el scaffold integrado como la vista predeterminada conectada. `canvas.a2ui.push` y `canvas.a2ui.reset` usan la página A2UI incluida que pertenece a la app.
- Las páginas A2UI remotas del Gateway son de solo renderizado en iOS; las acciones de botones A2UI nativos solo se aceptan desde páginas incluidas que pertenecen a la app.
- Vuelve al scaffold integrado con `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La app de iOS es una superficie de nodo móvil, no un backend de Codex Computer Use. Codex
Computer Use y `cua-driver mcp` controlan un escritorio local de macOS mediante herramientas
MCP; la app de iOS expone capacidades de iPhone mediante comandos de nodo de OpenClaw
como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes aún pueden operar la app de iOS mediante OpenClaw invocando comandos de
nodo, pero esas llamadas pasan por el protocolo de nodo del gateway y siguen los límites de
primer plano/segundo plano de iOS. Usa [Codex Computer Use](/es/plugins/codex-computer-use)
para el control de escritorio local y esta página para las capacidades de nodo de iOS.

### Evaluación / instantánea de Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo Talk

- La activación por voz y el modo Talk están disponibles en Ajustes.
- Talk en tiempo real de OpenAI usa WebRTC propiedad del cliente cuando `talk.realtime.transport` es `webrtc`; una configuración explícita de `gateway-relay` sigue perteneciendo al Gateway. Consulta [Modo Talk](/es/nodes/talk).
- Los nodos de iOS compatibles con Talk anuncian la capacidad `talk` y pueden declarar
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once`;
  el Gateway permite esos comandos push-to-talk de forma predeterminada para nodos
  compatibles con Talk y de confianza.
- iOS puede suspender el audio en segundo plano; trata las funciones de voz como de mejor esfuerzo cuando la app no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: lleva la app de iOS al primer plano (los comandos de canvas/cámara/pantalla lo requieren).
- `A2UI_HOST_UNAVAILABLE`: no se pudo acceder a la página A2UI incluida en el WebView de la app; mantén la app en primer plano en la pestaña Pantalla y reintenta.
- La solicitud de emparejamiento nunca aparece: ejecuta `openclaw devices list` y aprueba manualmente.
- La reconexión falla después de reinstalar: el token de emparejamiento de Keychain se borró; vuelve a emparejar el nodo.

## Documentación relacionada

- [Emparejamiento](/es/channels/pairing)
- [Descubrimiento](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
