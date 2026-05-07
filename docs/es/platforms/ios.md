---
read_when:
    - Emparejar o volver a conectar el Node de iOS
    - Ejecutar la aplicación iOS desde el código fuente
    - Depuración del descubrimiento del Gateway o de los comandos de canvas
summary: 'App de Node para iOS: conexión al Gateway, emparejamiento, lienzo y solución de problemas'
title: aplicación iOS
x-i18n:
    generated_at: "2026-05-07T13:20:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: vista previa interna. La app de iOS todavía no se distribuye públicamente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone capacidades de nodo: Canvas, captura de pantalla, captura de cámara, ubicación, modo de conversación, activación por voz.
- Recibe comandos `node.invoke` y reporta eventos de estado del nodo.

## Requisitos

- Gateway ejecutándose en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - Misma LAN mediante Bonjour, **o**
  - Tailnet mediante DNS-SD unicast (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host/puerto manual (alternativa).

## Inicio rápido (emparejar + conectar)

1. Inicia el Gateway:

```bash
openclaw gateway --port 18789
```

2. En la app de iOS, abre Configuración y elige un gateway descubierto (o habilita Host manual e introduce host/puerto).

3. Aprueba la solicitud de emparejamiento en el host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la app reintenta el emparejamiento con detalles de autenticación cambiados (rol/alcances/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

Opcional: si el nodo iOS siempre se conecta desde una subred estrictamente controlada, puedes
habilitar la aprobación automática de nodos por primera vez con CIDR explícitos o IP exactas:

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

## Push respaldado por relé para compilaciones oficiales

Las compilaciones iOS distribuidas oficialmente usan el relé push externo en lugar de publicar el token APNs
sin procesar en el gateway.

Requisito del lado del Gateway:

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

- La app de iOS se registra con el relé usando App Attest y un JWS de transacción de app de StoreKit.
- El relé devuelve un identificador de relé opaco junto con una concesión de envío limitada al registro.
- La app de iOS obtiene la identidad del gateway emparejado y la incluye en el registro del relé, de modo que el registro respaldado por relé se delega a ese gateway específico.
- La app reenvía ese registro respaldado por relé al gateway emparejado con `push.apns.register`.
- El gateway usa ese identificador de relé almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- La URL base del relé del gateway debe coincidir con la URL de relé integrada en la compilación iOS oficial/TestFlight.
- Si la app se conecta más tarde a un gateway diferente o a una compilación con una URL base de relé distinta, actualiza el registro del relé en lugar de reutilizar el vínculo anterior.

Qué **no** necesita el gateway para esta ruta:

- Ningún token de relé para todo el despliegue.
- Ninguna clave APNs directa para envíos oficiales/TestFlight respaldados por relé.

Flujo esperado para el operador:

1. Instala la compilación iOS oficial/TestFlight.
2. Configura `gateway.push.apns.relay.baseUrl` en el gateway.
3. Empareja la app con el gateway y deja que termine de conectarse.
4. La app publica `push.apns.register` automáticamente después de tener un token APNs, de que la sesión del operador esté conectada y de que el registro del relé se complete correctamente.
5. Después de eso, `push.test`, las activaciones de reconexión y los avisos de activación pueden usar el registro almacenado respaldado por relé.

## Señales de vida en segundo plano

Cuando iOS activa la app por un push silencioso, una actualización en segundo plano o un evento de ubicación significativa, la app
intenta una reconexión corta del nodo y luego llama a `node.event` con `event: "node.presence.alive"`.
El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del nodo/dispositivo emparejado solo
después de que se conoce la identidad autenticada del dispositivo de nodo.

La app trata una activación en segundo plano como registrada correctamente solo cuando la respuesta del gateway incluye
`handled: true`. Gateways anteriores pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es
compatible, pero no cuenta como una actualización duradera de última vez visto.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` todavía funciona como anulación temporal de env para el gateway.

## Flujo de autenticación y confianza

El relé existe para aplicar dos restricciones que APNs directo en el gateway no puede proporcionar para
compilaciones oficiales de iOS:

- Solo compilaciones iOS genuinas de OpenClaw distribuidas mediante Apple pueden usar el relé alojado.
- Un gateway puede enviar pushes respaldados por relé solo para dispositivos iOS que se emparejaron con ese gateway específico.

Salto por salto:

1. `iOS app -> gateway`
   - La app primero se empareja con el gateway mediante el flujo normal de autenticación del Gateway.
   - Eso le da a la app una sesión de nodo autenticada junto con una sesión de operador autenticada.
   - La sesión de operador se usa para llamar a `gateway.identity.get`.

2. `iOS app -> relay`
   - La app llama a los endpoints de registro del relé mediante HTTPS.
   - El registro incluye prueba de App Attest junto con un JWS de transacción de app de StoreKit.
   - El relé valida el ID del paquete, la prueba de App Attest y la prueba de distribución de Apple, y requiere la
     ruta de distribución oficial/de producción.
   - Esto es lo que bloquea que compilaciones locales de Xcode/dev usen el relé alojado. Una compilación local puede estar
     firmada, pero no satisface la prueba de distribución oficial de Apple que espera el relé.

3. `gateway identity delegation`
   - Antes del registro del relé, la app obtiene la identidad del gateway emparejado desde
     `gateway.identity.get`.
   - La app incluye esa identidad del gateway en la carga útil del registro del relé.
   - El relé devuelve un identificador de relé y una concesión de envío limitada al registro que están delegados a
     esa identidad del gateway.

4. `gateway -> relay`
   - El gateway almacena el identificador de relé y la concesión de envío de `push.apns.register`.
   - En `push.test`, activaciones de reconexión y avisos de activación, el gateway firma la solicitud de envío con su
     propia identidad de dispositivo.
   - El relé verifica tanto la concesión de envío almacenada como la firma del gateway frente a la identidad del
     gateway delegada desde el registro.
   - Otro gateway no puede reutilizar ese registro almacenado, aunque de alguna forma obtenga el identificador.

5. `relay -> APNs`
   - El relé posee las credenciales APNs de producción y el token APNs sin procesar para la compilación oficial.
   - El gateway nunca almacena el token APNs sin procesar para compilaciones oficiales respaldadas por relé.
   - El relé envía el push final a APNs en nombre del gateway emparejado.

Por qué se creó este diseño:

- Para mantener las credenciales APNs de producción fuera de los gateways de usuario.
- Para evitar almacenar tokens APNs sin procesar de compilaciones oficiales en el gateway.
- Para permitir el uso del relé alojado solo para compilaciones oficiales/TestFlight de OpenClaw.
- Para impedir que un gateway envíe pushes de activación a dispositivos iOS propiedad de otro gateway.

Las compilaciones locales/manuales siguen usando APNs directo. Si pruebas esas compilaciones sin el relé, el
gateway todavía necesita credenciales APNs directas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de ejecución del host del gateway, no configuraciones de Fastlane. `apps/ios/fastlane/.env` solo almacena
autenticación de App Store Connect / TestFlight como `ASC_KEY_ID` y `ASC_ISSUER_ID`; no configura
la entrega APNs directa para compilaciones locales de iOS.

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
dominio de descubrimiento DNS-SD de área amplia. Los gateways en la misma LAN aparecen automáticamente desde `local.`;
el descubrimiento entre redes puede usar el dominio de área amplia configurado sin cambiar el tipo de señal.

### Tailnet (entre redes)

Si mDNS está bloqueado, usa una zona DNS-SD unicast (elige un dominio; ejemplo:
`openclaw.internal.`) y DNS dividido de Tailscale.
Consulta [Bonjour](/es/gateway/bonjour) para ver el ejemplo de CoreDNS.

### Host/puerto manual

En Configuración, habilita **Host manual** e introduce el host + puerto del gateway (predeterminado `18789`).

## Canvas + A2UI

El nodo iOS renderiza un canvas WKWebView. Usa `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host de canvas del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/`.
- Se sirve desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, predeterminado `18789`).
- El nodo iOS navega automáticamente a A2UI al conectarse cuando se anuncia una URL de host de canvas.
- Vuelve al andamiaje integrado con `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La app de iOS es una superficie de nodo móvil, no un backend de Codex Computer Use. Codex
Computer Use y `cua-driver mcp` controlan un escritorio macOS local mediante herramientas
MCP; la app de iOS expone capacidades de iPhone mediante comandos de nodo de OpenClaw
como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes todavía pueden operar la app de iOS mediante OpenClaw invocando comandos de
nodo, pero esas llamadas pasan por el protocolo de nodo del gateway y siguen los límites
de primer plano/segundo plano de iOS. Usa [Codex Computer Use](/es/plugins/codex-computer-use)
para el control del escritorio local y esta página para las capacidades de nodo de iOS.

### Eval / instantánea de canvas

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
  el Gateway permite esos comandos pulsar para hablar de forma predeterminada para nodos
  de confianza con capacidad de conversación.
- iOS puede suspender el audio en segundo plano; trata las funciones de voz como de mejor esfuerzo cuando la app no esté activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: trae la app de iOS al primer plano (los comandos de canvas/cámara/pantalla lo requieren).
- `A2UI_HOST_NOT_CONFIGURED`: el Gateway no anunció la URL de superficie del Plugin Canvas; revisa `plugins.entries.canvas.config.host` en [Configuración del Gateway](/es/gateway/configuration).
- El aviso de emparejamiento nunca aparece: ejecuta `openclaw devices list` y aprueba manualmente.
- La reconexión falla después de reinstalar: se borró el token de emparejamiento del llavero; vuelve a emparejar el nodo.

## Documentos relacionados

- [Emparejamiento](/es/channels/pairing)
- [Descubrimiento](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
