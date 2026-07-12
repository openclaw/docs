---
read_when:
    - Quieres conectar OpenClaw a SMS mediante Twilio
    - Necesitas configurar el Webhook de SMS o la lista de permitidos
summary: Configuración del canal SMS de Twilio, controles de acceso y configuración del webhook
title: SMS
x-i18n:
    generated_at: "2026-07-11T22:55:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw recibe y envía SMS mediante un número de teléfono de Twilio o un servicio de mensajería. El Gateway registra una ruta Webhook entrante (de forma predeterminada, `/webhooks/sms`), valida de forma predeterminada las firmas de las solicitudes de Twilio y envía las respuestas mediante la API Messages de Twilio.

Estado: Plugin oficial, instalado por separado. Solo texto: sin MMS ni contenido multimedia; únicamente mensajes directos.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos para SMS es el emparejamiento.
  </Card>
  <Card title="Seguridad del Gateway" icon="shield" href="/es/gateway/security">
    Revisa la exposición del Webhook y los controles de acceso de los remitentes.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y procedimientos de reparación.
  </Card>
</CardGroup>

## Antes de comenzar

Necesitas:

- El Plugin oficial de SMS instalado con `openclaw plugins install @openclaw/sms`.
- Una cuenta de Twilio con un número de teléfono compatible con SMS o un servicio de mensajería de Twilio.
- El SID de cuenta y el token de autenticación de Twilio.
- Una URL HTTPS pública que llegue a tu Gateway de OpenClaw.
- Una política de remitentes: `pairing` (predeterminada) para uso privado, `allowlist` para números de teléfono preaprobados u `open` solo para un acceso por SMS que se desee hacer público.

Un número de Twilio puede servir tanto para SMS como para [llamadas de voz](/es/plugins/voice-call) si dispone de ambas capacidades. El Webhook de SMS y el Webhook de voz se configuran por separado en Twilio y utilizan rutas distintas del Gateway; esta página solo trata el Webhook de SMS.

## Configuración rápida

<Steps>
  <Step title="Instala el Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Crea o elige un remitente de Twilio">
    En Twilio, abre **Phone Numbers > Manage > Active numbers** y elige un número compatible con SMS. Guarda:

    - El SID de cuenta, por ejemplo, `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - El token de autenticación
    - El número de teléfono del remitente, por ejemplo, `+15551234567`

    Si utilizas un servicio de mensajería en lugar de un número de remitente fijo, guarda el SID del servicio de mensajería, por ejemplo, `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configura el canal de SMS">

Guarda lo siguiente como `sms.patch.json5` y cambia los marcadores de posición:

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

  <Step title="Dirige Twilio al Webhook del Gateway">
    En la configuración del número de teléfono de Twilio, abre **Messaging** y establece **A message comes in** en:

```text
https://gateway.example.com/webhooks/sms
```

    Utiliza HTTP `POST`. La ruta local predeterminada es `/webhooks/sms`; cambia `channels.sms.webhookPath` si necesitas otra ruta.

  </Step>

  <Step title="Expón la ruta exacta del Webhook de SMS">
    Tu URL pública debe dirigir la ruta de SMS al proceso del Gateway (puerto predeterminado `18789`). Si utilizas Tailscale Funnel para realizar pruebas locales, expón `/webhooks/sms` explícitamente:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Las llamadas de voz y los SMS utilizan rutas Webhook distintas. Si el mismo número de Twilio gestiona ambos, mantén ambas rutas configuradas en Twilio y en tu túnel.

  </Step>

  <Step title="Inicia el Gateway y aprueba al primer remitente">

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

Todas las claves se encuentran en `channels.sms` (y, para cada cuenta, en `channels.sms.accounts.<id>`):

| Clave                                   | Valor predeterminado | Finalidad                                                           |
| --------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`               | Activa o desactiva el canal o la cuenta.                            |
| `accountSid`                            | —                    | SID de la cuenta de Twilio (`AC...`).                               |
| `authToken`                             | —                    | Token de autenticación de Twilio; cadena de texto sin cifrar o SecretRef. |
| `fromNumber`                            | —                    | Número del remitente en formato E.164.                              |
| `messagingServiceSid`                   | —                    | SID del servicio de mensajería (`MG...`) utilizado cuando no se resuelve ningún `fromNumber`. |
| `defaultTo`                             | —                    | Destino predeterminado cuando un flujo de envío omite un destinatario explícito. |
| `webhookPath`                           | `/webhooks/sms`      | Ruta HTTP del Gateway para los Webhooks entrantes de Twilio.        |
| `publicWebhookUrl`                      | —                    | URL pública configurada en Twilio; necesaria para validar firmas.   |
| `dangerouslyDisableSignatureValidation` | `false`              | Omite las comprobaciones de `X-Twilio-Signature`; solo para probar túneles locales. |
| `dmPolicy`                              | `"pairing"`          | `pairing`, `allowlist`, `open` o `disabled`.                        |
| `allowFrom`                             | `[]`                 | Números de remitente permitidos en formato E.164, o `"*"` con `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`               | Número máximo de caracteres por fragmento de SMS saliente.          |
| `accounts`, `defaultAccount`            | —                    | Mapa de varias cuentas e identificador de la cuenta predeterminada. |

### Archivo de configuración

Utiliza la configuración mediante archivo cuando quieras que la definición del canal forme parte de la configuración del Gateway:

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

Las variables de entorno se aplican únicamente a la cuenta predeterminada; los valores de configuración tienen prioridad sobre los valores del entorno.

| Variable                                        | Se asigna a                                         |
| ----------------------------------------------- | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                        |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                         |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`) | `fromNumber`                                        |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                               |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                       |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (separados por comas)                   |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                    |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`)  |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Después, activa el canal en la configuración:

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

`authToken` puede ser una SecretRef (`source: "env" | "file" | "exec"`). Utiliza esta opción cuando el Gateway deba resolver el token de autenticación de Twilio mediante el entorno de ejecución de secretos de OpenClaw en lugar de almacenarlo como configuración en texto sin cifrar:

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

La variable de entorno o el proveedor de secretos al que se hace referencia debe ser visible para el entorno de ejecución del Gateway. Reinicia los procesos administrados del Gateway después de cambiar las variables de entorno del host.

### Remitente mediante servicio de mensajería

Utiliza `messagingServiceSid` en lugar de `fromNumber` cuando Twilio deba elegir el remitente mediante un servicio de mensajería:

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

Si tanto `fromNumber` como `messagingServiceSid` están presentes después de resolver la configuración y el entorno, se utiliza `fromNumber`.

### Destinatario saliente predeterminado

Establece `defaultTo` cuando una automatización o una entrega iniciada por un agente deba tener un destino predeterminado si un flujo de envío omite un destinatario explícito:

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

`channels.sms.dmPolicy` controla el acceso directo mediante SMS:

- `pairing` (predeterminada): los remitentes desconocidos reciben un código de emparejamiento; apruébalo con `openclaw pairing approve sms <CODE>`.
- `allowlist`: solo se procesan los remitentes incluidos en `allowFrom`. Un `allowFrom` vacío rechaza a todos los remitentes (el Gateway registra una advertencia al iniciarse).
- `open`: la validación de la configuración exige que `allowFrom` incluya `"*"`. Sin el comodín, solo pueden chatear los números enumerados.
- `disabled`: se descartan todos los mensajes directos entrantes.

Las entradas de `allowFrom` deben ser números de teléfono en formato E.164, como `+15551234567`. Se aceptan y normalizan los prefijos `sms:` y `twilio-sms:`. Para un asistente privado, utiliza preferentemente `dmPolicy: "allowlist"` con números de teléfono explícitos:

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

## Envío de SMS

Con el canal de SMS seleccionado, los destinatarios aceptan números E.164 sin prefijo o con el prefijo `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Cuando la selección del canal es implícita, el prefijo `twilio-sms:` selecciona este canal sin apropiarse del prefijo de servicio `sms:`, que iMessage utiliza para elegir la entrega por SMS del operador para sus propios destinatarios:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

La CLI requiere un `--target` explícito. `defaultTo` se utiliza en las rutas de automatización y de entrega iniciada por agentes en las que el destinatario puede resolverse a partir de la configuración del canal.

Las respuestas del agente a conversaciones de SMS entrantes se devuelven automáticamente al remitente mediante el remitente de Twilio configurado.

La salida de SMS es texto sin formato. OpenClaw elimina Markdown, aplana los bloques de código delimitados, reescribe los enlaces como `label (url)` y divide las respuestas largas en fragmentos de hasta `textChunkLimit` caracteres (1500 de forma predeterminada) antes de enviarlos mediante Twilio.

## Verificar la configuración

Después de iniciar el Gateway:

1. Confirma que el registro del Gateway muestre la ruta del Webhook de SMS.
2. Ejecuta una comprobación del lado de Twilio (verifica la URL y el método del Webhook de Twilio configurados, así como los errores de entrada recientes):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Envía un SMS al número de Twilio desde tu teléfono.
4. Ejecuta `openclaw pairing list sms`.
5. Aprueba el código de vinculación con `openclaw pairing approve sms <CODE>`.
6. Envía otro SMS y confirma que el agente responda.

Para realizar pruebas solo de salida, usa:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Prueba integral desde iMessage/SMS de macOS

En un Mac que pueda enviar SMS del operador mediante Mensajes, puedes usar `imsg` para controlar el lado del remitente sin tocar el teléfono:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

El primer mensaje debería crear una solicitud de vinculación. El segundo mensaje debería recibir la respuesta del agente a través de Twilio.

## Seguridad del Webhook

De forma predeterminada, OpenClaw valida `X-Twilio-Signature` mediante `publicWebhookUrl` y `authToken`. Mantén la parte del punto de conexión de `publicWebhookUrl` idéntica byte por byte a la URL configurada en Twilio, incluidos el esquema, el host, la ruta y la cadena de consulta. OpenClaw excluye de la comprobación de la firma los fragmentos de [anulación de conexión](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) de Twilio (`#...`), tal como exige Twilio.

La ruta del Webhook también aplica lo siguiente, con independencia de la validación de la firma:

- Solo `POST`.
- Límite de frecuencia de 30 solicitudes por minuto y por dirección IP de origen (HTTP 429 si se supera).
- El valor `AccountSid` de la carga útil debe coincidir con el `accountSid` configurado (de lo contrario, HTTP 403).
- Los valores `MessageSid` repetidos se deduplican durante 10 minutos.
- La caché de repetición de cada cuenta de SMS conserva hasta 10 000 SID de mensajes activos. Cuando todas las posiciones están activas, los nuevos Webhooks de esa cuenta se rechazan de forma segura con HTTP 429 y un encabezado `Retry-After` hasta que caduque la posición más antigua.
- Se rechazan los cuerpos de solicitud de más de 32 KB.

Twilio no reintenta las respuestas HTTP 429 de forma predeterminada ni documenta compatibilidad con `Retry-After`. Las anulaciones de conexión `#rp=4xx` y `#rp=all` habilitan los reintentos de errores 4xx, pero Twilio limita la transacción completa de reintento a 15 segundos, por lo que los reintentos aún pueden finalizar antes de que caduque una posición de la caché de repetición. Configura una URL de respaldo cuando otro controlador deba recibir las entregas fallidas; considera una respuesta 429 como un rechazo seguro, no como contrapresión fiable.

Solo para pruebas con túneles locales, puedes establecer:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

No desactives la validación de firmas en un Gateway público.

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

Cada cuenta debe usar un `webhookPath` distinto; el Gateway se niega a registrar una ruta de Webhook cuya ruta ya pertenezca a otra cuenta. Las alternativas mediante variables de entorno `TWILIO_*`/`SMS_*` solo se aplican a la cuenta predeterminada; establece `defaultAccount` para cambiar qué cuenta es.

## Solución de problemas

### Twilio devuelve 403 u OpenClaw rechaza el Webhook

Comprueba que `publicWebhookUrl` coincida exactamente con la URL configurada en Twilio, incluidos el esquema, el host, la ruta y la cadena de consulta. Twilio firma la cadena de la URL pública, por lo que las reescrituras del proxy y los nombres de host alternativos pueden impedir la validación de la firma.

Una respuesta 403 con `Invalid account` significa que el `AccountSid` de la carga útil entrante no coincide con el `accountSid` configurado; comprueba que el Webhook apunte a la cuenta propietaria del número.

### No aparece ninguna solicitud de vinculación

Comprueba la URL y el método del Webhook de **Messaging** del número de Twilio. Debe apuntar a la URL del Webhook de SMS y usar `POST`. Confirma también que se pueda acceder al Gateway desde la Internet pública o mediante tu túnel.

Si el registro de mensajes de Twilio muestra el error `11200`, Twilio aceptó el SMS entrante, pero no pudo acceder a tu Webhook. Comprueba lo siguiente:

- En Twilio, **Messaging > A message comes in** apunta a `publicWebhookUrl`.
- El método es `POST`.
- El túnel o proxy inverso expone el `webhookPath` exacto; para Tailscale Funnel, ejecuta `tailscale funnel status` y confirma que `/webhooks/sms` aparezca en la lista.
- `publicWebhookUrl` usa el mismo esquema, host, ruta y cadena de consulta que envía Twilio, para que la validación de la firma pueda reproducir la URL firmada.

`openclaw channels status --channel sms --probe` muestra tanto las discrepancias en la configuración del Webhook de Twilio como los errores `11200` recientes.

### Los envíos salientes fallan

Confirma que se resuelvan `accountSid`, `authToken` y `fromNumber` o `messagingServiceSid`. Si usas una cuenta de prueba de Twilio, es posible que debas verificar el número de destino en Twilio antes de poder enviar SMS salientes.

### Los mensajes llegan, pero el agente no responde

Comprueba `dmPolicy` y `allowFrom`. Con la política predeterminada `pairing`, se debe aprobar al remitente antes de procesar las interacciones normales del agente.
