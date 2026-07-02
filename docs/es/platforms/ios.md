---
read_when:
    - Emparejar o reconectar el nodo de iOS
    - Ejecutar la app de iOS desde el código fuente
    - Depuración del descubrimiento del Gateway o de comandos de canvas
summary: 'Aplicación de nodo de iOS: conexión al Gateway, emparejamiento, lienzo y solución de problemas'
title: Aplicación para iOS
x-i18n:
    generated_at: "2026-07-02T07:56:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: las compilaciones de la app para iPhone se distribuyen mediante canales de Apple cuando están habilitadas para una versión. Las compilaciones de desarrollo local también pueden ejecutarse desde el código fuente.

## Qué hace

- Se conecta a un Gateway por WebSocket (LAN o tailnet).
- Expone capacidades del nodo: Canvas, instantánea de pantalla, captura de cámara, ubicación, modo Talk, activación por voz.
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

2. En la app iOS, abre Configuración y elige un gateway descubierto (o habilita Host manual e introduce host/puerto).

3. Aprueba la solicitud de emparejamiento en el host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la app vuelve a intentar el emparejamiento con detalles de autenticación modificados (rol/alcances/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

Opcional: si el nodo iOS siempre se conecta desde una subred estrictamente controlada, puedes
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
sin alcances solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, alcance, metadatos o
clave pública siguen requiriendo aprobación manual.

4. Verifica la conexión:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push respaldado por relay para compilaciones oficiales

Las compilaciones iOS distribuidas oficialmente usan el relay push externo en lugar de publicar el token APNs
sin procesar en el gateway.

Las compilaciones oficiales de App Store del canal de publicación público usan el relay alojado en `https://ios-push-relay.openclaw.ai`.

Los despliegues de relay personalizados requieren una ruta de compilación/despliegue iOS deliberadamente separada cuya URL de relay coincida con la URL de relay del gateway. El canal público de publicación en App Store no acepta anulaciones personalizadas de la URL de relay. Si usas una compilación con relay personalizado, configura la URL de relay correspondiente del gateway:

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

- La app iOS se registra en el relay usando App Attest y un JWS de transacción de app de StoreKit.
- El relay devuelve un identificador opaco de relay más una concesión de envío limitada al registro.
- La app iOS obtiene la identidad del gateway emparejado y la incluye en el registro del relay, por lo que el registro respaldado por relay se delega a ese gateway específico.
- La app reenvía ese registro respaldado por relay al gateway emparejado con `push.apns.register`.
- El gateway usa ese identificador de relay almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- Las URL de relay de gateway personalizadas deben coincidir con la URL de relay integrada en la compilación iOS.
- Si la app se conecta más adelante a otro gateway o a una compilación con una URL base de relay distinta, actualiza el registro del relay en lugar de reutilizar la vinculación anterior.

Lo que el gateway **no** necesita para esta ruta:

- Ningún token de relay para todo el despliegue.
- Ninguna clave APNs directa para envíos oficiales de App Store respaldados por relay.

Flujo esperado para el operador:

1. Instala la app iOS oficial.
2. Opcional: configura `gateway.push.apns.relay.baseUrl` en el gateway solo cuando uses una compilación de relay personalizado deliberadamente separada.
3. Empareja la app con el gateway y deja que termine de conectarse.
4. La app publica `push.apns.register` automáticamente después de tener un token APNs, de que la sesión de operador esté conectada y de que el registro en el relay se complete correctamente.
5. Después de eso, `push.test`, las activaciones de reconexión y los avisos de activación pueden usar el registro almacenado respaldado por relay.

## Señales de actividad en segundo plano

Cuando iOS activa la app por un push silencioso, una actualización en segundo plano o un evento de ubicación significativa, la app
intenta una reconexión breve del nodo y luego llama a `node.event` con `event: "node.presence.alive"`.
El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del nodo/dispositivo emparejado solo
después de conocer la identidad autenticada del dispositivo nodo.

La app considera que una activación en segundo plano se registró correctamente solo cuando la respuesta del gateway incluye
`handled: true`. Los gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es
compatible, pero no cuenta como una actualización duradera de último visto.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` sigue funcionando como anulación temporal de entorno para el gateway.
- El canal público de publicación en App Store rechaza `OPENCLAW_PUSH_RELAY_BASE_URL` para compilaciones iOS.

## Flujo de autenticación y confianza

El relay existe para imponer dos restricciones que APNs directo en el gateway no puede proporcionar para
compilaciones iOS oficiales:

- Solo las compilaciones iOS genuinas de OpenClaw distribuidas mediante Apple pueden usar el relay alojado.
- Un gateway solo puede enviar pushes respaldados por relay a dispositivos iOS que se emparejaron con ese gateway específico.

Salto por salto:

1. `iOS app -> gateway`
   - La app primero se empareja con el gateway mediante el flujo normal de autenticación de Gateway.
   - Eso le da a la app una sesión de nodo autenticada más una sesión de operador autenticada.
   - La sesión de operador se usa para llamar a `gateway.identity.get`.

2. `iOS app -> relay`
   - La app llama a los endpoints de registro del relay por HTTPS.
   - El registro incluye prueba de App Attest más un JWS de transacción de app de StoreKit.
   - El relay valida el bundle ID, la prueba de App Attest y la prueba de distribución de Apple, y exige la
     ruta de distribución oficial/producción.
   - Esto es lo que impide que las compilaciones locales de Xcode/desarrollo usen el relay alojado. Una compilación local puede estar
     firmada, pero no satisface la prueba de distribución oficial de Apple que el relay espera.

3. `gateway identity delegation`
   - Antes del registro en el relay, la app obtiene la identidad del gateway emparejado desde
     `gateway.identity.get`.
   - La app incluye esa identidad del gateway en la carga útil de registro del relay.
   - El relay devuelve un identificador de relay y una concesión de envío limitada al registro que se delegan a
     esa identidad del gateway.

4. `gateway -> relay`
   - El gateway almacena el identificador de relay y la concesión de envío de `push.apns.register`.
   - En `push.test`, activaciones de reconexión y avisos de activación, el gateway firma la solicitud de envío con su
     propia identidad de dispositivo.
   - El relay verifica tanto la concesión de envío almacenada como la firma del gateway contra la identidad de
     gateway delegada desde el registro.
   - Otro gateway no puede reutilizar ese registro almacenado, aunque de algún modo obtenga el identificador.

5. `relay -> APNs`
   - El relay posee las credenciales APNs de producción y el token APNs sin procesar para la compilación oficial.
   - El gateway nunca almacena el token APNs sin procesar para compilaciones oficiales respaldadas por relay.
   - El relay envía el push final a APNs en nombre del gateway emparejado.

Por qué se creó este diseño:

- Para mantener las credenciales APNs de producción fuera de los gateways de usuario.
- Para evitar almacenar tokens APNs sin procesar de compilaciones oficiales en el gateway.
- Para permitir el uso del relay alojado solo para compilaciones iOS oficiales de OpenClaw.
- Para impedir que un gateway envíe pushes de activación a dispositivos iOS propiedad de otro gateway.

Las compilaciones locales/manuales permanecen en APNs directo. Si pruebas esas compilaciones sin el relay, el
gateway todavía necesita credenciales APNs directas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de tiempo de ejecución del host del gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena
autenticación de App Store Connect, como `APP_STORE_CONNECT_KEY_ID` y
`APP_STORE_CONNECT_ISSUER_ID`; no configura la entrega APNs directa para compilaciones iOS locales.

Almacenamiento recomendado en el host del gateway:

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

La app iOS explora `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo
dominio de descubrimiento DNS-SD de área amplia. Los gateways en la misma LAN aparecen automáticamente desde `local.`;
el descubrimiento entre redes puede usar el dominio de área amplia configurado sin cambiar el tipo de señal.

### Tailnet (entre redes)

Si mDNS está bloqueado, usa una zona DNS-SD unicast (elige un dominio; ejemplo:
`openclaw.internal.`) y DNS dividido de Tailscale.
Consulta [Bonjour](/es/gateway/bonjour) para ver el ejemplo de CoreDNS.

### Host/puerto manual

En Configuración, habilita **Host manual** e introduce el host + puerto del gateway (predeterminado `18789`).

## Canvas + A2UI

El nodo iOS renderiza un canvas de WKWebView. Usa `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host de canvas del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/`.
- Se sirve desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, predeterminado `18789`).
- El nodo iOS mantiene el andamiaje integrado como la vista predeterminada conectada. `canvas.a2ui.push` y `canvas.a2ui.reset` usan la página A2UI incluida y propiedad de la app.
- Las páginas A2UI remotas del Gateway son solo de renderizado en iOS; las acciones de botones A2UI nativos solo se aceptan desde páginas incluidas y propiedad de la app.
- Vuelve al andamiaje integrado con `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La app iOS es una superficie de nodo móvil, no un backend de Codex Computer Use. Codex
Computer Use y `cua-driver mcp` controlan un escritorio macOS local mediante herramientas
MCP; la app iOS expone capacidades de iPhone mediante comandos de nodo de OpenClaw
como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes todavía pueden operar la app iOS mediante OpenClaw invocando comandos de
nodo, pero esas llamadas pasan por el protocolo de nodo del gateway y siguen los límites de
primer plano/segundo plano de iOS. Usa [Codex Computer Use](/es/plugins/codex-computer-use)
para control de escritorio local y esta página para capacidades de nodo iOS.

### Eval / instantánea de canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo Talk

- La activación por voz y el modo Talk están disponibles en Configuración.
- Los nodos iOS con capacidad Talk anuncian la capacidad `talk` y pueden declarar
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once`;
  el Gateway permite esos comandos push-to-talk de forma predeterminada para nodos
  de confianza con capacidad Talk.
- iOS puede suspender el audio en segundo plano; trata las funciones de voz como de mejor esfuerzo cuando la app no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: trae la app iOS al primer plano (los comandos de canvas/cámara/pantalla lo requieren).
- `A2UI_HOST_UNAVAILABLE`: no se pudo acceder a la página A2UI incluida en el WebView de la app; mantén la app en primer plano en la pestaña Pantalla y vuelve a intentarlo.
- La solicitud de emparejamiento nunca aparece: ejecuta `openclaw devices list` y aprueba manualmente.
- La reconexión falla después de reinstalar: se borró el token de emparejamiento del Keychain; vuelve a emparejar el nodo.

## Documentos relacionados

- [Emparejamiento](/es/channels/pairing)
- [Descubrimiento](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
