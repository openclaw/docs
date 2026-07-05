---
read_when:
    - Quieres conectar OpenClaw con SMS mediante Twilio
    - Necesitas configurar un webhook de SMS o una lista de permitidos
summary: Configuración del canal SMS de Twilio, controles de acceso y configuración de webhook
title: SMS
x-i18n:
    generated_at: "2026-07-05T11:04:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee82f9d5a18309e1ccdf341fb78440926f8f2c4bbd00249ad4ab5ce4532c61d
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw recibe y envía SMS mediante un número de teléfono de Twilio o Messaging Service. El Gateway registra una ruta de webhook entrante (predeterminada `/webhooks/sms`), valida las firmas de solicitud de Twilio de forma predeterminada y envía las respuestas de vuelta mediante la API Messages de Twilio.

Estado: plugin oficial, instalado por separado. Solo texto: sin MMS/medios, solo mensajes directos.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada de DM para SMS es el emparejamiento.
  </Card>
  <Card title="Seguridad del Gateway" icon="shield" href="/es/gateway/security">
    Revisa la exposición del webhook y los controles de acceso de remitentes.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
</CardGroup>

## Antes de comenzar

Necesitas:

- El plugin oficial de SMS instalado con `openclaw plugins install @openclaw/sms`.
- Una cuenta de Twilio con un número de teléfono compatible con SMS, o un Twilio Messaging Service.
- El Twilio Account SID y Auth Token.
- Una URL HTTPS pública que llegue a tu OpenClaw Gateway.
- Una opción de política de remitentes: `pairing` (predeterminada) para uso privado, `allowlist` para números de teléfono preaprobados, u `open` solo para acceso SMS intencionadamente público.

Un número de Twilio puede servir tanto para SMS como para [Llamada de voz](/es/plugins/voice-call) si tiene ambas capacidades. El webhook de SMS y el webhook de voz se configuran por separado en Twilio y usan rutas del Gateway separadas; esta página solo cubre el webhook de SMS.

## Configuración rápida

<Steps>
  <Step title="Instala el plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Crea o elige un remitente de Twilio">
    En Twilio, abre **Phone Numbers > Manage > Active numbers** y elige un número compatible con SMS. Guarda:

    - Account SID, por ejemplo `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Número de teléfono remitente, por ejemplo `+15551234567`

    Si usas un Messaging Service en lugar de un número de remitente fijo, guarda el Messaging Service SID, por ejemplo `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configura el canal SMS">

Guarda esto como `sms.patch.json5` y cambia los marcadores de posición:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Aplícalo:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Apunta Twilio al webhook del Gateway">
    En la configuración del número de teléfono de Twilio, abre **Messaging** y establece **A message comes in** en:

```text
https://gateway.example.com/webhooks/sms
```

    Usa HTTP `POST`. La ruta local predeterminada es `/webhooks/sms`; cambia `channels.sms.webhookPath` si necesitas una ruta diferente.

  </Step>

  <Step title="Expón la ruta exacta del webhook de SMS">
    Tu URL pública debe enrutar la ruta de SMS al proceso Gateway (puerto predeterminado `18789`). Si usas Tailscale Funnel para pruebas locales, expón `/webhooks/sms` explícitamente:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Llamada de voz y SMS usan rutas de webhook separadas. Si el mismo número de Twilio gestiona ambos, mantén ambas rutas configuradas en Twilio y en tu túnel.

  </Step>

  <Step title="Inicia el Gateway y aprueba el primer remitente">

```bash
openclaw gateway
```

Envía un mensaje de texto al número de Twilio. El primer mensaje crea una solicitud de emparejamiento. Apruébala:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Los códigos de emparejamiento caducan después de 1 hora.

  </Step>
</Steps>

## Ejemplos de configuración

Todas las claves están bajo `channels.sms` (y por cuenta bajo `channels.sms.accounts.<id>`):

| Clave                                   | Predeterminado | Propósito                                                           |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | Habilita o deshabilita el canal/la cuenta.                          |
| `accountSid`                            | —               | Twilio Account SID (`AC...`).                                       |
| `authToken`                             | —               | Twilio Auth Token; cadena de texto plano o SecretRef.               |
| `fromNumber`                            | —               | Número remitente E.164.                                             |
| `messagingServiceSid`                   | —               | Messaging Service SID (`MG...`) usado cuando no se resuelve `fromNumber`. |
| `defaultTo`                             | —               | Destino predeterminado cuando un flujo de envío omite un destino explícito. |
| `webhookPath`                           | `/webhooks/sms` | Ruta HTTP del Gateway para webhooks entrantes de Twilio.            |
| `publicWebhookUrl`                      | —               | URL pública configurada en Twilio; requerida para la validación de firmas. |
| `dangerouslyDisableSignatureValidation` | `false`         | Omite las comprobaciones de `X-Twilio-Signature`; solo para pruebas con túneles locales. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` o `disabled`.                        |
| `allowFrom`                             | `[]`            | Números remitentes permitidos en E.164, o `"*"` con `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`          | Máximo de caracteres por fragmento SMS saliente.                    |
| `accounts`, `defaultAccount`            | —               | Mapa multicuenta e id de cuenta predeterminada.                     |

### Archivo de configuración

Usa la configuración mediante archivo cuando quieras que la definición del canal viaje con la configuración del Gateway:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### Variables de entorno

Las variables de entorno se aplican solo a la cuenta predeterminada; los valores de configuración tienen precedencia sobre los valores de entorno.

| Variable                                        | Se asigna a                                         |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`) | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (separado por comas)                   |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Luego habilita el canal en la configuración:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### Token de autenticación SecretRef

`authToken` puede ser un SecretRef (`source: "env" | "file" | "exec"`). Usa esto cuando el Gateway deba resolver el Twilio Auth Token desde el runtime de secretos de OpenClaw en lugar de almacenar configuración en texto plano:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

La variable de entorno o el proveedor de secretos referenciado debe ser visible para el runtime del Gateway. Reinicia los procesos Gateway gestionados después de cambiar variables de entorno del host.

### Remitente de Messaging Service

Usa `messagingServiceSid` en lugar de `fromNumber` cuando Twilio deba elegir el remitente mediante un Messaging Service:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Si tanto `fromNumber` como `messagingServiceSid` están presentes después de resolver la configuración y el entorno, se usa `fromNumber`.

### Destino saliente predeterminado

Configura `defaultTo` cuando la automatización o la entrega iniciada por un agente deba tener un destino predeterminado si un flujo de envío omite un destino explícito:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## Control de acceso

`channels.sms.dmPolicy` controla el acceso directo por SMS:

- `pairing` (predeterminado): los remitentes desconocidos reciben un código de emparejamiento; apruébalo con `openclaw pairing approve sms <CODE>`.
- `allowlist`: solo se procesan los remitentes en `allowFrom`. Un `allowFrom` vacío rechaza a todos los remitentes (el Gateway registra una advertencia de inicio).
- `open`: la validación de configuración requiere que `allowFrom` incluya `"*"`. Sin el comodín, solo los números listados pueden chatear.
- `disabled`: se descartan todos los DM entrantes.

Las entradas de `allowFrom` deben ser números de teléfono E.164, como `+15551234567`. Se aceptan y normalizan los prefijos `sms:` y `twilio-sms:`. Para un asistente privado, prefiere `dmPolicy: "allowlist"` con números de teléfono explícitos:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## Enviar SMS

Con el canal SMS seleccionado, los destinos aceptan números E.164 sin prefijo o el prefijo `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Cuando la selección de canal es implícita, el prefijo `twilio-sms:` selecciona este canal sin apropiarse del prefijo de servicio `sms:`, que iMessage usa para elegir la entrega SMS del operador para sus propios destinos:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

La CLI requiere un `--target` explícito. `defaultTo` es para rutas de automatización y entrega iniciada por agentes donde el destino puede resolverse desde la configuración del canal.

Las respuestas de agentes desde conversaciones SMS entrantes vuelven automáticamente al remitente mediante el remitente de Twilio configurado.

La salida SMS es texto sin formato. OpenClaw elimina markdown, aplana los bloques de código delimitados, reescribe los enlaces como `label (url)` y divide las respuestas largas en fragmentos de como máximo `textChunkLimit` caracteres (predeterminado 1500) antes de enviarlas mediante Twilio.

## Verificar la configuración

Después de que el Gateway se inicie:

1. Confirma que el registro del Gateway muestra la ruta del Webhook de SMS.
2. Ejecuta una prueba del lado de Twilio (comprueba la URL/método del Webhook de Twilio configurado y los errores entrantes recientes):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Envía un SMS al número de Twilio desde tu teléfono.
4. Ejecuta `openclaw pairing list sms`.
5. Aprueba el código de emparejamiento con `openclaw pairing approve sms <CODE>`.
6. Envía otro SMS y confirma que el agente responde.

Para pruebas solo de salida, usa:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Prueba de extremo a extremo desde macOS iMessage/SMS

En un Mac que pueda enviar SMS del operador mediante Mensajes, puedes usar `imsg` para controlar el lado del remitente sin tocar tu teléfono:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

El primer mensaje debería crear una solicitud de emparejamiento. El segundo mensaje debería recibir la respuesta del agente a través de Twilio.

## Seguridad del Webhook

De forma predeterminada, OpenClaw valida `X-Twilio-Signature` usando `publicWebhookUrl` y `authToken`. Mantén `publicWebhookUrl` alineado byte por byte con la URL configurada en Twilio, incluidos el esquema, el host, la ruta y la cadena de consulta.

La ruta del Webhook también aplica, independientemente de la validación de firma:

- Solo `POST`.
- Límite de tasa de 30 solicitudes por minuto por IP de origen (HTTP 429 por encima de eso).
- La carga útil `AccountSid` debe coincidir con el `accountSid` configurado (HTTP 403 en caso contrario).
- Los valores `MessageSid` repetidos se deduplican durante 10 minutos.
- Se rechazan los cuerpos de solicitud de más de 32 KB.

Solo para pruebas con túnel local, puedes configurar:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

No uses la validación de firma deshabilitada en un Gateway público.

## Configuración de varias cuentas

Usa `accounts` cuando operes más de un número de Twilio:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

Cada cuenta debe usar un `webhookPath` distinto; el Gateway se niega a registrar una ruta de Webhook cuya ruta ya pertenece a otra cuenta. Las alternativas de entorno `TWILIO_*`/`SMS_*` se aplican solo a la cuenta predeterminada; configura `defaultAccount` para cambiar cuál es esa cuenta.

## Solución de problemas

### Twilio devuelve 403 u OpenClaw rechaza el Webhook

Comprueba que `publicWebhookUrl` coincida exactamente con la URL configurada en Twilio, incluidos el esquema, el host, la ruta y la cadena de consulta. Twilio firma la cadena de URL pública, por lo que las reescrituras de proxy y los nombres de host alternativos pueden romper la validación de firma.

Un 403 con `Invalid account` significa que el `AccountSid` de la carga útil entrante no coincide con el `accountSid` configurado; comprueba que el Webhook apunte a la cuenta propietaria del número.

### No aparece ninguna solicitud de emparejamiento

Comprueba la URL y el método del Webhook de **Messaging** del número de Twilio. Debe apuntar a la URL del Webhook de SMS y usar `POST`. Confirma también que el Gateway sea accesible desde la Internet pública o a través de tu túnel.

Si el registro de mensajes de Twilio muestra el error `11200`, Twilio aceptó el SMS entrante pero no pudo llegar a tu Webhook. Comprueba:

- **Messaging > A message comes in** de Twilio apunta a `publicWebhookUrl`.
- El método es `POST`.
- El túnel o proxy inverso expone el `webhookPath` exacto; para Tailscale Funnel, ejecuta `tailscale funnel status` y confirma que `/webhooks/sms` esté listado.
- `publicWebhookUrl` usa el mismo esquema, host, ruta y cadena de consulta que envía Twilio, para que la validación de firma pueda reproducir la URL firmada.

`openclaw channels status --channel sms --probe` muestra tanto configuraciones de Webhook de Twilio no coincidentes como errores `11200` recientes.

### Fallan los envíos salientes

Confirma que `accountSid`, `authToken` y `fromNumber` o `messagingServiceSid` estén resueltos. Si usas una cuenta de prueba de Twilio, es posible que el número de destino deba verificarse en Twilio antes de que se envíen SMS salientes.

### Los mensajes llegan, pero el agente no responde

Comprueba `dmPolicy` y `allowFrom`. Con la política predeterminada `pairing`, el remitente debe aprobarse antes de que se procesen los turnos normales del agente.
