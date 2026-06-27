---
read_when:
    - Emparejar o volver a conectar el nodo de iOS
    - Ejecutar la app de iOS desde el código fuente
    - Depuración del descubrimiento del Gateway o de comandos de canvas
summary: 'Aplicación de nodo iOS: conexión al Gateway, emparejamiento, lienzo y solución de problemas'
title: aplicación para iOS
x-i18n:
    generated_at: "2026-06-27T12:00:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: las compilaciones de la app para iPhone se distribuyen mediante canales de Apple cuando están habilitadas para una versión. Las compilaciones de desarrollo local también pueden ejecutarse desde el código fuente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o red tailnet).
- Expone capacidades de nodo: lienzo, instantánea de pantalla, captura de cámara, ubicación, modo de conversación, activación por voz.
- Recibe comandos `node.invoke` e informa eventos de estado del nodo.

## Requisitos

- Gateway ejecutándose en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - La misma LAN mediante Bonjour, **o**
  - Red tailnet mediante DNS-SD unicast (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host/puerto manual (alternativa).

## Inicio rápido (emparejar + conectar)

1. Inicia el Gateway:

```bash
openclaw gateway --port 18789
```

2. En la app iOS, abre Configuración y elige un gateway descubierto (o habilita Host manual e introduce host/puerto).

3. Aprueba la solicitud de emparejamiento en el host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la app reintenta el emparejamiento con detalles de autenticación modificados (rol/alcances/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

Opcional: si el nodo iOS siempre se conecta desde una subred estrechamente controlada, puedes
optar por la aprobación automática de nodos por primera vez con CIDR explícitos o IP exactas:

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

Esto está deshabilitado de forma predeterminada. Se aplica solo al emparejamiento nuevo con `role: node`
sin alcances solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, alcance, metadatos o
clave pública siguen requiriendo aprobación manual.

4. Verifica la conexión:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push respaldado por retransmisor para compilaciones oficiales

Las compilaciones oficiales distribuidas de iOS usan el retransmisor push externo en lugar de publicar el token
APNs sin procesar en el gateway.

Las compilaciones oficiales/TestFlight de la ruta de publicación pública de App Store usan el retransmisor alojado en `https://ios-push-relay.openclaw.ai`.

Los despliegues de retransmisor personalizados requieren una ruta de compilación/despliegue de iOS deliberadamente separada cuya URL de retransmisor coincida con la URL de retransmisor del gateway. La ruta de publicación pública de App Store no acepta sobrescrituras de URL de retransmisor personalizadas. Si usas una compilación con retransmisor personalizado, configura la URL de retransmisor coincidente del gateway:

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

- La app iOS se registra con el retransmisor usando App Attest y un JWS de transacción de app de StoreKit.
- El retransmisor devuelve un identificador de retransmisor opaco más una concesión de envío limitada al registro.
- La app iOS obtiene la identidad del gateway emparejado y la incluye en el registro del retransmisor, por lo que el registro respaldado por retransmisor se delega a ese gateway específico.
- La app reenvía ese registro respaldado por retransmisor al gateway emparejado con `push.apns.register`.
- El gateway usa ese identificador de retransmisor almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- Las URL de retransmisor de gateway personalizadas deben coincidir con la URL de retransmisor integrada en la compilación de iOS.
- Si la app se conecta más tarde a otro gateway o a una compilación con una URL base de retransmisor diferente, actualiza el registro del retransmisor en lugar de reutilizar el enlace antiguo.

Lo que el gateway **no** necesita para esta ruta:

- Ningún token de retransmisor para todo el despliegue.
- Ninguna clave APNs directa para envíos oficiales/TestFlight respaldados por retransmisor.

Flujo esperado para el operador:

1. Instala la compilación oficial/TestFlight de iOS.
2. Opcional: configura `gateway.push.apns.relay.baseUrl` en el gateway solo cuando uses una compilación de retransmisor personalizado deliberadamente separada.
3. Empareja la app con el gateway y deja que termine de conectarse.
4. La app publica `push.apns.register` automáticamente después de tener un token APNs, de que la sesión de operador esté conectada y de que el registro del retransmisor se complete correctamente.
5. Después de eso, `push.test`, las activaciones de reconexión y los avisos de activación pueden usar el registro almacenado respaldado por retransmisor.

## Señales de actividad en segundo plano

Cuando iOS activa la app por una notificación push silenciosa, una actualización en segundo plano o un evento de ubicación significativa, la app
intenta una reconexión breve del nodo y luego llama a `node.event` con `event: "node.presence.alive"`.
El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del nodo/dispositivo emparejado solo
después de conocer la identidad autenticada del dispositivo de nodo.

La app trata una activación en segundo plano como registrada correctamente solo cuando la respuesta del gateway incluye
`handled: true`. Los gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es
compatible, pero no cuenta como una actualización duradera de última vista.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` todavía funciona como sobrescritura temporal de entorno para el gateway.
- La ruta de publicación pública de App Store rechaza `OPENCLAW_PUSH_RELAY_BASE_URL` para compilaciones de iOS.

## Autenticación y flujo de confianza

El retransmisor existe para imponer dos restricciones que APNs directo en el gateway no puede proporcionar para
compilaciones oficiales de iOS:

- Solo las compilaciones genuinas de OpenClaw para iOS distribuidas mediante Apple pueden usar el retransmisor alojado.
- Un gateway puede enviar push respaldados por retransmisor solo a dispositivos iOS que se emparejaron con ese
  gateway específico.

Salto por salto:

1. `iOS app -> gateway`
   - La app primero se empareja con el gateway mediante el flujo normal de autenticación del Gateway.
   - Eso le da a la app una sesión de nodo autenticada más una sesión de operador autenticada.
   - La sesión de operador se usa para llamar a `gateway.identity.get`.

2. `iOS app -> relay`
   - La app llama a los endpoints de registro del retransmisor por HTTPS.
   - El registro incluye prueba de App Attest más un JWS de transacción de app de StoreKit.
   - El retransmisor valida el ID de paquete, la prueba de App Attest y la prueba de distribución de Apple, y exige la
     ruta de distribución oficial/producción.
   - Esto es lo que bloquea que las compilaciones locales de Xcode/desarrollo usen el retransmisor alojado. Una compilación local puede estar
     firmada, pero no satisface la prueba de distribución oficial de Apple que espera el retransmisor.

3. `gateway identity delegation`
   - Antes del registro del retransmisor, la app obtiene la identidad del gateway emparejado desde
     `gateway.identity.get`.
   - La app incluye esa identidad del gateway en la carga útil de registro del retransmisor.
   - El retransmisor devuelve un identificador de retransmisor y una concesión de envío limitada al registro que se delegan a
     esa identidad del gateway.

4. `gateway -> relay`
   - El gateway almacena el identificador de retransmisor y la concesión de envío de `push.apns.register`.
   - En `push.test`, activaciones de reconexión y avisos de activación, el gateway firma la solicitud de envío con su
     propia identidad de dispositivo.
   - El retransmisor verifica tanto la concesión de envío almacenada como la firma del gateway contra la identidad del
     gateway delegada desde el registro.
   - Otro gateway no puede reutilizar ese registro almacenado, incluso si de algún modo obtiene el identificador.

5. `relay -> APNs`
   - El retransmisor posee las credenciales APNs de producción y el token APNs sin procesar para la compilación oficial.
   - El gateway nunca almacena el token APNs sin procesar para compilaciones oficiales respaldadas por retransmisor.
   - El retransmisor envía el push final a APNs en nombre del gateway emparejado.

Por qué se creó este diseño:

- Para mantener las credenciales APNs de producción fuera de los gateways de usuario.
- Para evitar almacenar tokens APNs sin procesar de compilaciones oficiales en el gateway.
- Para permitir el uso del retransmisor alojado solo a compilaciones oficiales/TestFlight de OpenClaw.
- Para impedir que un gateway envíe push de activación a dispositivos iOS pertenecientes a otro gateway.

Las compilaciones locales/manuales permanecen en APNs directo. Si estás probando esas compilaciones sin el retransmisor, el
gateway todavía necesita credenciales APNs directas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de tiempo de ejecución del host del gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena
autenticación de App Store Connect / TestFlight como `APP_STORE_CONNECT_KEY_ID` y
`APP_STORE_CONNECT_ISSUER_ID`; no configura la entrega APNs directa para compilaciones locales de iOS.

Almacenamiento recomendado en el host del gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

No confirmes el archivo `.p8` ni lo coloques bajo el checkout del repositorio.

## Rutas de detección

### Bonjour (LAN)

La app iOS explora `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo
dominio de detección DNS-SD de área amplia. Los gateways en la misma LAN aparecen automáticamente desde `local.`;
la detección entre redes puede usar el dominio de área amplia configurado sin cambiar el tipo de baliza.

### Tailnet (entre redes)

Si mDNS está bloqueado, usa una zona DNS-SD unicast (elige un dominio; ejemplo:
`openclaw.internal.`) y DNS dividido de Tailscale.
Consulta [Bonjour](/es/gateway/bonjour) para el ejemplo de CoreDNS.

### Host/puerto manual

En Configuración, habilita **Host manual** e introduce el host del gateway + puerto (predeterminado `18789`).

## Lienzo + A2UI

El nodo iOS renderiza un lienzo WKWebView. Usa `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host de lienzo del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/`.
- Se sirve desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, predeterminado `18789`).
- El nodo iOS mantiene el andamiaje integrado como la vista predeterminada conectada. `canvas.a2ui.push` y `canvas.a2ui.reset` usan la página A2UI incluida y propiedad de la app.
- Las páginas A2UI de Gateway remoto son solo de renderizado en iOS; las acciones de botones A2UI nativas se aceptan solo desde páginas incluidas y propiedad de la app.
- Vuelve al andamiaje integrado con `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La app iOS es una superficie de nodo móvil, no un backend de Codex Computer Use. Codex
Computer Use y `cua-driver mcp` controlan un escritorio macOS local mediante herramientas
MCP; la app iOS expone capacidades de iPhone mediante comandos de nodo de OpenClaw
como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes aún pueden operar la app iOS mediante OpenClaw invocando comandos de
nodo, pero esas llamadas pasan por el protocolo de nodo del gateway y siguen los límites de
primer plano/segundo plano de iOS. Usa [Codex Computer Use](/es/plugins/codex-computer-use)
para el control del escritorio local y esta página para las capacidades de nodo de iOS.

### Evaluación / instantánea de lienzo

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo de conversación

- La activación por voz y el modo de conversación están disponibles en Configuración.
- Los nodos iOS con capacidad de conversación anuncian la capacidad `talk` y pueden declarar
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once`;
  el Gateway permite esos comandos de pulsar para hablar de forma predeterminada para nodos
  de confianza con capacidad de conversación.
- iOS puede suspender el audio en segundo plano; trata las funciones de voz como de mejor esfuerzo cuando la app no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: trae la app iOS al primer plano (los comandos de lienzo/cámara/pantalla lo requieren).
- `A2UI_HOST_UNAVAILABLE`: no se pudo acceder a la página A2UI incluida en el WebView de la app; mantén la app en primer plano en la pestaña Pantalla y reintenta.
- La solicitud de emparejamiento nunca aparece: ejecuta `openclaw devices list` y aprueba manualmente.
- La reconexión falla después de reinstalar: se borró el token de emparejamiento de Keychain; vuelve a emparejar el nodo.

## Documentación relacionada

- [Emparejamiento](/es/channels/pairing)
- [Detección](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
