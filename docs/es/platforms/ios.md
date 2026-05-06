---
read_when:
    - Emparejar o reconectar el nodo iOS
    - Ejecutar la aplicación de iOS desde el código fuente
    - Depuración del descubrimiento del Gateway o los comandos de canvas
summary: 'Aplicación de nodo de iOS: conexión al Gateway, emparejamiento, lienzo y solución de problemas'
title: Aplicación para iOS
x-i18n:
    generated_at: "2026-05-06T05:41:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidad: vista previa interna. La aplicación de iOS aún no se distribuye públicamente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone capacidades de Node: Canvas, instantánea de pantalla, captura de cámara, ubicación, modo de conversación, activación por voz.
- Recibe comandos `node.invoke` e informa eventos de estado de Node.

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

2. En la aplicación de iOS, abre Ajustes y elige un gateway descubierto (o habilita Host manual e introduce host/puerto).

3. Aprueba la solicitud de emparejamiento en el host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la aplicación reintenta el emparejamiento con detalles de autenticación cambiados (rol/ámbitos/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

Opcional: si el Node de iOS siempre se conecta desde una subred estrictamente controlada, puedes
activar la aprobación automática de Node en el primer uso con CIDR explícitos o IP exactas:

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

Esto está deshabilitado de forma predeterminada. Solo se aplica al emparejamiento nuevo de `role: node` sin
ámbitos solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, ámbito, metadatos o
clave pública aún requieren aprobación manual.

4. Verifica la conexión:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Notificaciones push respaldadas por retransmisor para compilaciones oficiales

Las compilaciones distribuidas oficiales de iOS usan el retransmisor de notificaciones push externo en lugar de publicar el token APNs
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

- La aplicación de iOS se registra en el retransmisor usando App Attest y un JWS de transacción de aplicación de StoreKit.
- El retransmisor devuelve un identificador opaco de retransmisor más una concesión de envío limitada al registro.
- La aplicación de iOS obtiene la identidad del gateway emparejado y la incluye en el registro del retransmisor, de modo que el registro respaldado por retransmisor se delega a ese gateway específico.
- La aplicación reenvía ese registro respaldado por retransmisor al gateway emparejado con `push.apns.register`.
- El gateway usa ese identificador de retransmisor almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- La URL base del retransmisor del gateway debe coincidir con la URL del retransmisor integrada en la compilación oficial/TestFlight de iOS.
- Si la aplicación se conecta más tarde a otro gateway o a una compilación con una URL base de retransmisor distinta, actualiza el registro del retransmisor en lugar de reutilizar la vinculación anterior.

Lo que el gateway **no** necesita para esta ruta:

- Ningún token de retransmisor para todo el despliegue.
- Ninguna clave APNs directa para envíos oficiales/TestFlight respaldados por retransmisor.

Flujo esperado del operador:

1. Instala la compilación oficial/TestFlight de iOS.
2. Configura `gateway.push.apns.relay.baseUrl` en el gateway.
3. Empareja la aplicación con el gateway y deja que termine de conectarse.
4. La aplicación publica `push.apns.register` automáticamente después de tener un token APNs, la sesión de operador esté conectada y el registro del retransmisor se realice correctamente.
5. Después de eso, `push.test`, las activaciones de reconexión y los avisos de activación pueden usar el registro almacenado respaldado por retransmisor.

## Señales de actividad en segundo plano

Cuando iOS despierta la aplicación por una notificación push silenciosa, una actualización en segundo plano o un evento de ubicación significativa, la aplicación
intenta una reconexión breve de Node y luego llama a `node.event` con `event: "node.presence.alive"`.
El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del Node/dispositivo emparejado solo
después de que se conoce la identidad autenticada del dispositivo Node.

La aplicación trata una activación en segundo plano como registrada correctamente solo cuando la respuesta del gateway incluye
`handled: true`. Los gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es
compatible, pero no cuenta como una actualización duradera de último visto.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` todavía funciona como anulación temporal de entorno para el gateway.

## Flujo de autenticación y confianza

El retransmisor existe para aplicar dos restricciones que APNs directo en el gateway no puede proporcionar para
compilaciones oficiales de iOS:

- Solo las compilaciones genuinas de OpenClaw para iOS distribuidas a través de Apple pueden usar el retransmisor alojado.
- Un gateway solo puede enviar notificaciones push respaldadas por retransmisor a dispositivos iOS emparejados con ese gateway específico.

Salto por salto:

1. `iOS app -> gateway`
   - La aplicación primero se empareja con el gateway mediante el flujo de autenticación normal del Gateway.
   - Eso da a la aplicación una sesión de Node autenticada más una sesión de operador autenticada.
   - La sesión de operador se usa para llamar a `gateway.identity.get`.

2. `iOS app -> relay`
   - La aplicación llama a los endpoints de registro del retransmisor mediante HTTPS.
   - El registro incluye prueba de App Attest más un JWS de transacción de aplicación de StoreKit.
   - El retransmisor valida el ID de paquete, la prueba de App Attest y la prueba de distribución de Apple, y requiere la
     ruta de distribución oficial/producción.
   - Esto es lo que impide que las compilaciones locales de Xcode/desarrollo usen el retransmisor alojado. Una compilación local puede estar
     firmada, pero no satisface la prueba de distribución oficial de Apple que espera el retransmisor.

3. `gateway identity delegation`
   - Antes del registro del retransmisor, la aplicación obtiene la identidad del gateway emparejado desde
     `gateway.identity.get`.
   - La aplicación incluye esa identidad del gateway en la carga útil de registro del retransmisor.
   - El retransmisor devuelve un identificador de retransmisor y una concesión de envío limitada al registro que se delegan a
     esa identidad de gateway.

4. `gateway -> relay`
   - El gateway almacena el identificador de retransmisor y la concesión de envío de `push.apns.register`.
   - En `push.test`, activaciones de reconexión y avisos de activación, el gateway firma la solicitud de envío con su
     propia identidad de dispositivo.
   - El retransmisor verifica tanto la concesión de envío almacenada como la firma del gateway frente a la identidad de
     gateway delegada desde el registro.
   - Otro gateway no puede reutilizar ese registro almacenado, aunque de algún modo obtenga el identificador.

5. `relay -> APNs`
   - El retransmisor posee las credenciales APNs de producción y el token APNs sin procesar de la compilación oficial.
   - El gateway nunca almacena el token APNs sin procesar para compilaciones oficiales respaldadas por retransmisor.
   - El retransmisor envía la notificación push final a APNs en nombre del gateway emparejado.

Por qué se creó este diseño:

- Para mantener las credenciales APNs de producción fuera de los gateways de los usuarios.
- Para evitar almacenar tokens APNs sin procesar de compilaciones oficiales en el gateway.
- Para permitir el uso del retransmisor alojado solo para compilaciones oficiales/TestFlight de OpenClaw.
- Para impedir que un gateway envíe notificaciones push de activación a dispositivos iOS pertenecientes a otro gateway.

Las compilaciones locales/manuales permanecen en APNs directo. Si estás probando esas compilaciones sin el retransmisor, el
gateway todavía necesita credenciales APNs directas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de ejecución del host del gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena
autenticación de App Store Connect / TestFlight como `ASC_KEY_ID` y `ASC_ISSUER_ID`; no configura
entrega APNs directa para compilaciones locales de iOS.

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

La aplicación de iOS examina `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo
dominio de descubrimiento DNS-SD de área amplia. Los gateways en la misma LAN aparecen automáticamente desde `local.`;
el descubrimiento entre redes puede usar el dominio de área amplia configurado sin cambiar el tipo de baliza.

### Tailnet (entre redes)

Si mDNS está bloqueado, usa una zona DNS-SD unicast (elige un dominio; ejemplo:
`openclaw.internal.`) y DNS dividido de Tailscale.
Consulta [Bonjour](/es/gateway/bonjour) para ver el ejemplo de CoreDNS.

### Host/puerto manual

En Ajustes, habilita **Host manual** e introduce el host + puerto del gateway (predeterminado `18789`).

## Canvas + A2UI

El Node de iOS renderiza un canvas WKWebView. Usa `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host de canvas del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/`.
- Se sirve desde el servidor HTTP del Gateway (mismo puerto que `gateway.port`, predeterminado `18789`).
- El Node de iOS navega automáticamente a A2UI al conectarse cuando se anuncia una URL de host de canvas.
- Vuelve al andamiaje integrado con `canvas.navigate` y `{"url":""}`.

## Relación con Computer Use

La aplicación de iOS es una superficie móvil de Node, no un backend de Codex Computer Use. Codex
Computer Use y `cua-driver mcp` controlan un escritorio local de macOS mediante herramientas MCP;
la aplicación de iOS expone capacidades de iPhone mediante comandos de Node de OpenClaw
como `canvas.*`, `camera.*`, `screen.*`, `location.*` y `talk.*`.

Los agentes todavía pueden operar la aplicación de iOS mediante OpenClaw invocando comandos de
Node, pero esas llamadas pasan por el protocolo de Node del gateway y siguen los límites de primer
plano/segundo plano de iOS. Usa [Codex Computer Use](/es/plugins/codex-computer-use)
para el control de escritorio local y esta página para las capacidades de Node de iOS.

### Eval / instantánea de Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo de conversación

- La activación por voz y el modo de conversación están disponibles en Ajustes.
- Los Nodes de iOS con capacidad de conversación anuncian la capacidad `talk` y pueden declarar
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` y `talk.ptt.once`;
  el Gateway permite esos comandos de pulsar para hablar de forma predeterminada para Nodes
  de conversación de confianza.
- iOS puede suspender el audio en segundo plano; trata las funciones de voz como de mejor esfuerzo cuando la aplicación no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: trae la aplicación de iOS al primer plano (los comandos de canvas/cámara/pantalla lo requieren).
- `A2UI_HOST_NOT_CONFIGURED`: el Gateway no anunció una URL de host de canvas; revisa `canvasHost` en [Configuración del Gateway](/es/gateway/configuration).
- La solicitud de emparejamiento nunca aparece: ejecuta `openclaw devices list` y aprueba manualmente.
- La reconexión falla después de reinstalar: el token de emparejamiento del llavero se borró; vuelve a emparejar el Node.

## Documentos relacionados

- [Emparejamiento](/es/channels/pairing)
- [Descubrimiento](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
