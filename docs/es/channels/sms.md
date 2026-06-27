---
read_when:
    - Quieres conectar OpenClaw a SMS mediante Twilio
    - Necesitas configurar un webhook de SMS o una lista de permitidos
summary: Configuración del canal SMS de Twilio, controles de acceso y configuración de webhook
title: SMS
x-i18n:
    generated_at: "2026-06-27T10:45:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw puede recibir y enviar SMS mediante un número de teléfono de Twilio o un Messaging Service. El Gateway registra una ruta de Webhook entrante, valida las firmas de solicitud de Twilio de forma predeterminada y envía las respuestas de vuelta mediante la API Messages de Twilio.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    La política predeterminada de DM para SMS es el emparejamiento.
  </Card>
  <Card title="Gateway security" icon="shield" href="/es/gateway/security">
    Revisa la exposición de Webhook y los controles de acceso del remitente.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
</CardGroup>

## Antes de comenzar

Necesitas:

- El Plugin oficial de SMS instalado con `openclaw plugins install @openclaw/sms`.
- Una cuenta de Twilio con un número de teléfono compatible con SMS, o un Twilio Messaging Service.
- El Account SID y Auth Token de Twilio.
- Una URL HTTPS pública que llegue a tu OpenClaw Gateway.
- Una elección de política de remitente: `pairing` para uso privado, `allowlist` para números de teléfono preaprobados, u `open` solo para acceso SMS intencionalmente público.

Usa un número de Twilio para SMS y Voice Call si el número tiene ambas capacidades. Configura el Webhook de SMS y el Webhook de Voice por separado en Twilio; esta página solo cubre el Webhook de SMS.

## Configuración rápida

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Create or choose a Twilio sender">
    En Twilio, abre **Phone Numbers > Manage > Active numbers** y elige un número compatible con SMS. Guarda:

    - Account SID, por ejemplo `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Número de teléfono del remitente, por ejemplo `+15551234567`

    Si usas un Messaging Service en lugar de un número de remitente fijo, guarda el Messaging Service SID, por ejemplo `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configure the SMS channel">

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

  <Step title="Point Twilio at the Gateway webhook">
    En la configuración del número de teléfono de Twilio, abre **Messaging** y establece **A message comes in** en:

```text
https://gateway.example.com/webhooks/sms
```

    Usa HTTP `POST`. La ruta local predeterminada es `/webhooks/sms`; cambia `channels.sms.webhookPath` si necesitas una ruta diferente.

  </Step>

  <Step title="Expose the exact SMS webhook path">
    Tu URL pública debe enrutar la ruta de SMS al proceso Gateway. Si usas Tailscale Funnel para pruebas locales, expón `/webhooks/sms` explícitamente:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call y SMS usan rutas de Webhook separadas. Si el mismo número de Twilio maneja ambos, mantén ambas rutas configuradas en Twilio y en tu túnel.

  </Step>

  <Step title="Start the Gateway and approve first sender">

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

### Archivo de configuración

Usa la configuración mediante archivo de configuración cuando quieras que la definición del canal viaje con la configuración del Gateway:

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

Usa la configuración mediante env para despliegues de una sola cuenta donde los secretos provienen del entorno del host:

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

`TWILIO_SMS_FROM` se acepta como alias de `TWILIO_PHONE_NUMBER`. Usa `TWILIO_MESSAGING_SERVICE_SID` en lugar de un remitente de número de teléfono cuando Twilio deba elegir el remitente desde un Messaging Service.

### Token de autenticación SecretRef

`authToken` puede ser un SecretRef. Usa esto cuando el Gateway deba resolver el Twilio Auth Token desde el runtime de secretos de OpenClaw en lugar de almacenar configuración en texto plano:

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

### Número privado solo con lista de permitidos

Usa `allowlist` cuando solo números de teléfono conocidos deban poder hablar con el agente:

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

Si tanto `fromNumber` como `messagingServiceSid` están presentes después de resolver configuración y env, se usa `fromNumber`.

### Destino saliente predeterminado

Establece `defaultTo` cuando la automatización o la entrega iniciada por el agente deba tener un destino predeterminado si un flujo de envío omite un objetivo explícito:

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

- `pairing` (predeterminado)
- `allowlist` (requiere al menos un remitente en `allowFrom`)
- `open` (requiere que `allowFrom` incluya `"*"`)
- `disabled`

Las entradas de `allowFrom` deben ser números de teléfono E.164 como `+15551234567`. Se aceptan prefijos `sms:` y se normalizan. Para un asistente privado, prefiere `dmPolicy: "allowlist"` con números de teléfono explícitos.

## Enviar SMS

Los objetivos de SMS saliente usan el prefijo de servicio `sms:` con el canal SMS seleccionado:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Cuando la selección del canal es implícita, `twilio-sms:+15551234567` selecciona este canal sin apropiarse del prefijo de servicio `sms:` existente y propiedad del canal usado por iMessage.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

La CLI requiere un `--target` explícito. `defaultTo` es para rutas de automatización y entrega iniciadas por el agente donde el objetivo puede resolverse desde la configuración del canal.

Las respuestas del agente desde conversaciones SMS entrantes vuelven automáticamente al remitente mediante el remitente de Twilio configurado.

La salida SMS es texto sin formato. OpenClaw elimina markdown, aplana bloques de código delimitados, preserva enlaces legibles y divide respuestas largas antes de enviarlas mediante Twilio.

## Verificar la configuración

Después de que se inicie el Gateway:

1. Confirma que el registro del Gateway muestra la ruta de Webhook de SMS.
2. Ejecuta una prueba desde el lado de Twilio:

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

### Prueba integral desde macOS iMessage/SMS

En un Mac que pueda enviar SMS de operador mediante Messages, puedes usar `imsg` para controlar el lado del remitente sin tocar tu teléfono:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

El primer mensaje debe crear una solicitud de emparejamiento. El segundo mensaje debe recibir la respuesta del agente mediante Twilio.

## Seguridad del Webhook

De forma predeterminada, OpenClaw valida `X-Twilio-Signature` usando `publicWebhookUrl` y `authToken`. Mantén `publicWebhookUrl` alineada byte por byte con la URL configurada en Twilio, incluidos esquema, host, ruta y cadena de consulta.

Solo para pruebas con túnel local, puedes establecer:

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

Cada cuenta debe usar un `webhookPath` distinto.

## Solución de problemas

### Twilio devuelve 403 u OpenClaw rechaza el Webhook

Comprueba que `publicWebhookUrl` coincida exactamente con la URL configurada en Twilio, incluidos esquema, host, ruta y cadena de consulta. Twilio firma la cadena de URL pública, por lo que las reescrituras de proxy y los nombres de host alternativos pueden romper la validación de firma.

### No aparece ninguna solicitud de emparejamiento

Comprueba la URL y el método del Webhook de **Messaging** del número de Twilio. Debe apuntar a la URL del Webhook de SMS y usar `POST`. Confirma también que el Gateway sea accesible desde la Internet pública o mediante tu túnel.

Si el registro de mensajes de Twilio muestra el error `11200`, Twilio aceptó el SMS entrante pero no pudo llegar a tu Webhook. Comprueba:

- Twilio **Messaging > A message comes in** apunta a `publicWebhookUrl`.
- El método es `POST`.
- El túnel o proxy inverso expone el `webhookPath` exacto; para Tailscale Funnel, ejecuta `tailscale funnel status` y confirma que `/webhooks/sms` aparezca en la lista.
- `publicWebhookUrl` usa el mismo esquema, host, ruta y cadena de consulta que envía Twilio, para que la validación de firma pueda reproducir la URL firmada.

### Fallan los envíos salientes

Confirma que `accountSid`, `authToken` y `fromNumber` o `messagingServiceSid` se resuelvan. Si usas una cuenta de prueba de Twilio, es posible que el número de destino deba verificarse en Twilio antes de que se envíen SMS salientes.

### Los mensajes llegan pero el agente no responde

Comprueba `dmPolicy` y `allowFrom`. Con la política `pairing` predeterminada, el remitente debe estar aprobado antes de que se procesen los turnos normales del agente.
