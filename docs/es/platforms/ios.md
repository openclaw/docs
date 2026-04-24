---
read_when:
    - Emparejar o reconectar el Node de iOS
    - Ejecutar la app de iOS desde el código fuente
    - Depurar el descubrimiento del gateway o los comandos de canvas
summary: 'App Node de iOS: conectarse al Gateway, Pairing, canvas y solución de problemas'
title: App de iOS
x-i18n:
    generated_at: "2026-04-24T05:37:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

Disponibilidad: vista previa interna. La app de iOS aún no se distribuye públicamente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone capacidades del Node: Canvas, instantánea de pantalla, captura de cámara, ubicación, modo Talk, activación por voz.
- Recibe comandos `node.invoke` e informa eventos de estado del Node.

## Requisitos

- Gateway en ejecución en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - Misma LAN mediante Bonjour, **o**
  - Tailnet mediante DNS-SD unicast (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host/puerto manual (respaldo).

## Inicio rápido (Pairing + conexión)

1. Inicia el Gateway:

```bash
openclaw gateway --port 18789
```

2. En la app de iOS, abre Settings y elige un gateway detectado (o habilita Manual Host e introduce host/puerto).

3. Aprueba la solicitud de Pairing en el host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la app reintenta el Pairing con detalles de autenticación cambiados (role/scopes/public key),
la solicitud pendiente anterior queda reemplazada y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` otra vez antes de aprobar.

4. Verifica la conexión:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push respaldado por relay para compilaciones oficiales

Las compilaciones oficiales distribuidas de iOS usan el relay push externo en lugar de publicar el token APNs
sin procesar al gateway.

Requisito del lado del gateway:

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

- La app de iOS se registra en el relay usando App Attest y el recibo de la app.
- El relay devuelve un identificador opaco de relay más un permiso de envío con alcance de registro.
- La app de iOS obtiene la identidad del gateway emparejado y la incluye en el registro del relay, para que el registro respaldado por relay quede delegado a ese gateway específico.
- La app reenvía ese registro respaldado por relay al gateway emparejado con `push.apns.register`.
- El gateway usa ese identificador de relay almacenado para `push.test`, activaciones en segundo plano y toques de activación.
- La URL base del relay del gateway debe coincidir con la URL del relay incorporada en la compilación oficial/TestFlight de iOS.
- Si más tarde la app se conecta a otro gateway o a una compilación con una URL base de relay distinta, actualiza el registro del relay en lugar de reutilizar el vínculo anterior.

Qué **no** necesita el gateway para esta ruta:

- Ningún token de relay para todo el despliegue.
- Ninguna clave APNs directa para envíos oficiales/TestFlight respaldados por relay.

Flujo esperado para el operador:

1. Instala la compilación oficial/TestFlight de iOS.
2. Configura `gateway.push.apns.relay.baseUrl` en el gateway.
3. Empareja la app con el gateway y deja que termine de conectarse.
4. La app publica `push.apns.register` automáticamente después de tener un token APNs, de que la sesión del operador esté conectada y de que el registro del relay tenga éxito.
5. Después de eso, `push.test`, las activaciones de reconexión y los toques de activación pueden usar el registro respaldado por relay almacenado.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` sigue funcionando como sobrescritura temporal por entorno para el gateway.

## Flujo de autenticación y confianza

El relay existe para aplicar dos restricciones que el modelo directo APNs-en-gateway no puede proporcionar para
las compilaciones oficiales de iOS:

- Solo las compilaciones auténticas de OpenClaw para iOS distribuidas a través de Apple pueden usar el relay alojado.
- Un gateway solo puede enviar pushes respaldados por relay a dispositivos iOS que se emparejaron con ese
  gateway específico.

Salto a salto:

1. `app iOS -> gateway`
   - La app primero se empareja con el gateway mediante el flujo normal de autenticación del Gateway.
   - Eso da a la app una sesión autenticada de Node más una sesión autenticada de operador.
   - La sesión del operador se usa para llamar a `gateway.identity.get`.

2. `app iOS -> relay`
   - La app llama a los endpoints de registro del relay mediante HTTPS.
   - El registro incluye prueba App Attest más el recibo de la app.
   - El relay valida el bundle ID, la prueba App Attest y el recibo de Apple, y requiere la
     ruta oficial/de producción de distribución.
   - Esto es lo que impide que compilaciones locales de Xcode/desarrollo usen el relay alojado. Una compilación local puede estar
     firmada, pero no satisface la prueba oficial de distribución de Apple que espera el relay.

3. `delegación de identidad del gateway`
   - Antes del registro en el relay, la app obtiene la identidad del gateway emparejado desde
     `gateway.identity.get`.
   - La app incluye esa identidad del gateway en la carga útil de registro del relay.
   - El relay devuelve un identificador de relay y un permiso de envío con alcance de registro delegados a
     esa identidad de gateway.

4. `gateway -> relay`
   - El gateway almacena el identificador de relay y el permiso de envío de `push.apns.register`.
   - En `push.test`, activaciones de reconexión y toques de activación, el gateway firma la solicitud de envío con su
     propia identidad de dispositivo.
   - El relay verifica tanto el permiso de envío almacenado como la firma del gateway frente a la identidad
     de gateway delegada en el registro.
   - Otro gateway no puede reutilizar ese registro almacenado, aunque de algún modo obtuviera el identificador.

5. `relay -> APNs`
   - El relay es propietario de las credenciales APNs de producción y del token APNs sin procesar para la compilación oficial.
   - El gateway nunca almacena el token APNs sin procesar para compilaciones oficiales respaldadas por relay.
   - El relay envía el push final a APNs en nombre del gateway emparejado.

Por qué se creó este diseño:

- Para mantener las credenciales APNs de producción fuera de los gateways de los usuarios.
- Para evitar almacenar tokens APNs sin procesar de compilaciones oficiales en el gateway.
- Para permitir el uso del relay alojado solo en compilaciones oficiales/TestFlight de OpenClaw.
- Para impedir que un gateway envíe pushes de activación a dispositivos iOS propiedad de otro gateway.

Las compilaciones locales/manuales siguen usando APNs directos. Si pruebas esas compilaciones sin el relay, el
gateway sigue necesitando credenciales APNs directas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de runtime del host del gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena
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

No hagas commit del archivo `.p8` ni lo coloques dentro del checkout del repositorio.

## Rutas de descubrimiento

### Bonjour (LAN)

La app de iOS explora `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo
dominio de descubrimiento DNS-SD de área amplia. Los gateways de la misma LAN aparecen automáticamente desde `local.`;
el descubrimiento entre redes puede usar el dominio de área amplia configurado sin cambiar el tipo de beacon.

### Tailnet (entre redes)

Si mDNS está bloqueado, usa una zona DNS-SD unicast (elige un dominio; ejemplo:
`openclaw.internal.`) y DNS dividido de Tailscale.
Consulta [Bonjour](/es/gateway/bonjour) para ver el ejemplo con CoreDNS.

### Host/puerto manual

En Settings, habilita **Manual Host** e introduce el host + puerto del gateway (predeterminado `18789`).

## Canvas + A2UI

El Node de iOS renderiza un canvas WKWebView. Usa `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El canvas host del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/`.
- Se sirve desde el servidor HTTP del Gateway (mismo puerto que `gateway.port`, predeterminado `18789`).
- El Node de iOS navega automáticamente a A2UI al conectarse cuando se anuncia una URL de canvas host.
- Vuelve al scaffold integrado con `canvas.navigate` y `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo Talk

- La activación por voz y el modo Talk están disponibles en Settings.
- iOS puede suspender el audio en segundo plano; trata las funciones de voz como best-effort cuando la app no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: lleva la app de iOS al primer plano (los comandos de canvas/cámara/pantalla lo requieren).
- `A2UI_HOST_NOT_CONFIGURED`: el Gateway no anunció una URL de canvas host; comprueba `canvasHost` en [Configuración del Gateway](/es/gateway/configuration).
- El prompt de Pairing nunca aparece: ejecuta `openclaw devices list` y aprueba manualmente.
- La reconexión falla después de reinstalar: el token de Pairing de Keychain se borró; vuelve a emparejar el Node.

## Documentación relacionada

- [Pairing](/es/channels/pairing)
- [Descubrimiento](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
