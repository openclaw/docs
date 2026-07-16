---
read_when:
    - Quieres conectar OpenClaw a SMS mediante Twilio
    - Necesita configurar el webhook de SMS o la lista de permitidos
summary: Configuración del canal SMS de Twilio, controles de acceso y configuración del webhook
title: SMS
x-i18n:
    generated_at: "2026-07-16T11:23:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw recibe y envía SMS mediante un número de teléfono de Twilio o un servicio de mensajería. El Gateway registra una ruta de Webhook entrante (valor predeterminado `/webhooks/sms`), valida de forma predeterminada las firmas de las solicitudes de Twilio y devuelve las respuestas mediante la API Messages de Twilio.

Estado: Plugin oficial, instalado por separado. Solo texto: sin MMS ni contenido multimedia; solo mensajes directos.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos para SMS es el emparejamiento.
  </Card>
  <Card title="Seguridad del Gateway" icon="shield" href="/es/gateway/security">
    Revise la exposición del Webhook y los controles de acceso de los remitentes.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos y procedimientos de reparación para distintos canales.
  </Card>
</CardGroup>

## Antes de comenzar

Se necesita:

- El Plugin oficial de SMS instalado con `openclaw plugins install @openclaw/sms`.
- Una cuenta de Twilio con un número de teléfono compatible con SMS o un servicio de mensajería de Twilio.
- El SID de la cuenta y el token de autenticación de Twilio.
- Una URL HTTPS pública que llegue al Gateway de OpenClaw.
- Una política de remitentes: `pairing` (valor predeterminado) para uso privado, `allowlist` para números de teléfono aprobados previamente o `open` solo para permitir intencionadamente el acceso público mediante SMS.

Un número de Twilio puede servir tanto para SMS como para [llamadas de voz](/es/plugins/voice-call) si dispone de ambas capacidades. El Webhook de SMS y el Webhook de voz se configuran por separado en Twilio y utilizan rutas distintas del Gateway; esta página solo trata el Webhook de SMS.

## Configuración rápida

<Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Crear o elegir un remitente de Twilio">
    En Twilio, abra **Phone Numbers > Manage > Active numbers** y elija un número compatible con SMS. Guarde:

    - SID de la cuenta, por ejemplo, `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Token de autenticación
    - Número de teléfono del remitente, por ejemplo, `+15551234567`

    Si utiliza un servicio de mensajería en lugar de un número de remitente fijo, guarde el SID del servicio de mensajería, por ejemplo, `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configurar el canal SMS">

Guarde lo siguiente como `sms.patch.json5` y cambie los marcadores de posición:

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

Aplíquelo:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Dirigir Twilio al Webhook del Gateway">
    En la configuración del número de teléfono de Twilio, abra **Messaging** y establezca **A message comes in** en:

```text
https://gateway.example.com/webhooks/sms
```

    Utilice HTTP `POST`. La ruta local predeterminada es `/webhooks/sms`; cambie `channels.sms.webhookPath` si necesita otra ruta.

  </Step>

  <Step title="Exponer la ruta exacta del Webhook de SMS">
    La URL pública debe dirigir la ruta de SMS al proceso del Gateway (puerto predeterminado `18789`). Si utiliza Tailscale Funnel para realizar pruebas locales, exponga `/webhooks/sms` explícitamente:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Las llamadas de voz y los SMS utilizan rutas de Webhook diferentes. Si el mismo número de Twilio gestiona ambos, mantenga ambas rutas configuradas en Twilio y en el túnel.

  </Step>

  <Step title="Iniciar el Gateway y aprobar al primer remitente">

```bash
openclaw gateway
```

Envíe un mensaje de texto al número de Twilio. El primer mensaje crea una solicitud de emparejamiento. Apruébela:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Los códigos de emparejamiento caducan después de 1 hora.

  </Step>
</Steps>

## Ejemplos de configuración

Todas las claves se encuentran en `channels.sms` (y, para cada cuenta, en `channels.sms.accounts.<id>`):

| Clave                                   | Valor predeterminado | Finalidad                                                            |
| --------------------------------------- | -------------------- | -------------------------------------------------------------------- |
| `enabled`                      | `true`    | Activa o desactiva el canal o la cuenta.                             |
| `accountSid`                      | —                    | SID de la cuenta de Twilio (`AC...`).                     |
| `authToken`                      | —                    | Token de autenticación de Twilio; cadena de texto sin formato o SecretRef. |
| `fromNumber`                      | —                    | Número del remitente en formato E.164.                               |
| `messagingServiceSid`                      | —                    | SID del servicio de mensajería (`MG...`) utilizado cuando no se resuelve ningún `fromNumber`. |
| `defaultTo`                      | —                    | Destino predeterminado cuando un flujo de envío omite un destinatario explícito. |
| `webhookPath`                      | `/webhooks/sms`    | Ruta HTTP del Gateway para los Webhooks entrantes de Twilio.         |
| `publicWebhookUrl`                      | —                    | URL pública configurada en Twilio; necesaria para validar la firma. |
| `dangerouslyDisableSignatureValidation`                      | `false`    | Omite las comprobaciones de `X-Twilio-Signature`; solo para probar túneles locales. |
| `dmPolicy`                      | `"pairing"`    | `pairing`, `allowlist`, `open` o `disabled`. |
| `allowFrom`                      | `[]`    | Números de remitentes permitidos en formato E.164, o `"*"` con `dmPolicy: "open"`. |
| `textChunkLimit`                      | `1500`    | Número máximo de caracteres por fragmento de SMS saliente.          |
| `accounts`, `defaultAccount`  | —                    | Mapa de varias cuentas e identificador de la cuenta predeterminada. |

### Archivo de configuración

Utilice la configuración mediante archivo cuando quiera que la definición del canal forme parte de la configuración del Gateway:

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

Las variables de entorno solo se aplican a la cuenta predeterminada; los valores de configuración tienen prioridad sobre los valores del entorno.

| Variable                                        | Corresponde a                                       |
| ----------------------------------------------- | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                              | `accountSid`                                  |
| `TWILIO_AUTH_TOKEN`                              | `authToken`                                  |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`)   | `fromNumber`                                  |
| `TWILIO_MESSAGING_SERVICE_SID`                              | `messagingServiceSid`                                  |
| `SMS_PUBLIC_WEBHOOK_URL`                              | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                  |
| `SMS_ALLOWED_USERS`                              | `allowFrom` (separados por comas)            |
| `SMS_TEXT_CHUNK_LIMIT`                              | `textChunkLimit`                                  |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`                              | `dangerouslyDisableSignatureValidation` (`"true"`)             |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

A continuación, active el canal en la configuración:

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

`authToken` puede ser una SecretRef (`source: "env" | "file" | "exec"`). Utilícela cuando el Gateway deba resolver el token de autenticación de Twilio mediante el entorno de ejecución de secretos de OpenClaw en lugar de almacenarlo como configuración de texto sin formato:

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

La variable de entorno o el proveedor de secretos referenciado debe ser visible para el entorno de ejecución del Gateway. Reinicie los procesos administrados del Gateway después de cambiar las variables de entorno del host.

### Remitente del servicio de mensajería

Utilice `messagingServiceSid` en lugar de `fromNumber` cuando Twilio deba elegir el remitente mediante un servicio de mensajería:

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

### Destino saliente predeterminado

Establezca `defaultTo` cuando la automatización o la entrega iniciada por un agente deban tener un destino predeterminado si un flujo de envío omite un destinatario explícito:

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

- `pairing` (valor predeterminado): los remitentes desconocidos reciben un código de emparejamiento; apruébelo con `openclaw pairing approve sms <CODE>`.
- `allowlist`: solo se procesan los remitentes incluidos en `allowFrom`. Un valor vacío de `allowFrom` rechaza a todos los remitentes (el Gateway registra una advertencia al iniciarse).
- `open`: la validación de la configuración requiere que `allowFrom` incluya `"*"`. Sin el comodín, solo pueden conversar los números indicados.
- `disabled`: se descartan todos los mensajes directos entrantes.

Las entradas de `allowFrom` deben ser números de teléfono en formato E.164, como `+15551234567`. Se aceptan y normalizan los prefijos `sms:` y `twilio-sms:`. Para un asistente privado, se recomienda `dmPolicy: "allowlist"` con números de teléfono explícitos:

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

Con el canal SMS seleccionado, los destinos aceptan números E.164 sin prefijo o el prefijo `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Cuando la selección del canal es implícita, el prefijo `twilio-sms:` selecciona este canal sin sustituir el prefijo de servicio `sms:`, que iMessage utiliza para elegir la entrega de SMS mediante el operador para sus propios destinos:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

La CLI requiere un valor explícito de `--target`. `defaultTo` está destinado a las rutas de automatización y entrega iniciada por agentes en las que el destino puede resolverse a partir de la configuración del canal.

Las respuestas del agente a conversaciones SMS entrantes se devuelven automáticamente al remitente mediante el remitente de Twilio configurado.

La salida SMS es texto sin formato. OpenClaw elimina el formato Markdown, aplana los bloques de código delimitados, reescribe los enlaces como `label (url)` y divide las respuestas largas en fragmentos de un máximo de `textChunkLimit` caracteres (1500 de forma predeterminada) antes de enviarlos mediante Twilio.

## Verificar la configuración

Después de que se inicie el Gateway:

1. Confirme que el registro del Gateway muestre la ruta del Webhook de SMS.
2. Ejecute una sonda del lado de Twilio (comprueba la URL y el método del Webhook de Twilio configurados, así como los errores entrantes recientes):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Envíe un SMS al número de Twilio desde su teléfono.
4. Ejecute `openclaw pairing list sms`.
5. Apruebe el código de vinculación con `openclaw pairing approve sms <CODE>`.
6. Envíe otro SMS y confirme que el agente responda.

Para realizar pruebas solo de salida, use:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "Prueba de SMS de OpenClaw"
```

### Prueba de extremo a extremo desde iMessage/SMS de macOS

En un Mac que pueda enviar SMS del operador mediante Messages, puede usar `imsg` para controlar el lado del remitente sin tocar el teléfono:

```bash
imsg send --to "+15551234567" --service sms --text "E2E de SMS de OpenClaw $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "responde exactamente SMS pong" --json
```

El primer mensaje debe crear una solicitud de vinculación. El segundo mensaje debe recibir la respuesta del agente mediante Twilio.

## Seguridad del Webhook

De forma predeterminada, OpenClaw valida `X-Twilio-Signature` mediante `publicWebhookUrl` y `authToken`. Mantenga la parte del punto de conexión de `publicWebhookUrl` idéntica byte por byte a la URL configurada en Twilio, incluidos el esquema, el host, la ruta y la cadena de consulta. OpenClaw excluye de la computación de la firma los fragmentos de [anulación de conexión](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) de Twilio (`#...`), tal como exige Twilio.

La ruta del Webhook también impone lo siguiente, independientemente de la validación de la firma:

- Solo `POST`.
- Presupuesto de solicitudes fallidas de 300 solicitudes por minuto por cuenta de SMS, ruta del Webhook y dirección de cliente resuelta. Todas las solicitudes cuentan para este presupuesto, pero HTTP 429 solo se aplica después de que una solicitud falle al analizar el cuerpo, validar Twilio o comprobar la coincidencia de AccountSid.
- Límite de frecuencia de devoluciones de llamada procesables de 30 devoluciones de llamada aceptadas por minuto por cuenta de SMS, ruta del Webhook y dirección de cliente resuelta después de superar esas comprobaciones (HTTP 429 por encima de ese límite). Si la validación de la firma está desactivada, este límite de 30/min es el máximo de procesamiento sin autenticar.
- Las direcciones de cliente se resuelven mediante las reglas compartidas de proxies de confianza del Gateway. Si `gateway.trustedProxies` contiene el proxy inverso que reenvía las devoluciones de llamada de Twilio, OpenClaw determina estos límites a partir de la dirección de cliente reenviada; de lo contrario, utiliza la dirección directa del socket.
- El valor `AccountSid` de la carga útil debe coincidir con el `accountSid` configurado (de lo contrario, HTTP 403).
- Los valores `MessageSid` reproducidos se deduplican durante 10 minutos.
- La caché de reproducción de cada cuenta de SMS conserva hasta 10,000 SID de mensajes activos. Cuando todas las ranuras están activas, los nuevos Webhooks de esa cuenta se rechazan de forma segura con HTTP 429 y un encabezado `Retry-After` hasta que caduque la ranura más antigua.
- Se rechazan los cuerpos de solicitud superiores a 32 KB.

Twilio no reintenta HTTP 429 de forma predeterminada ni documenta compatibilidad con `Retry-After`. Las anulaciones de conexión `#rp=4xx` y `#rp=all` habilitan los reintentos para errores 4xx, pero Twilio limita la transacción de reintento completa a 15 segundos, por lo que los reintentos aún pueden finalizar antes de que caduque una ranura de la caché de reproducción. Configure una URL alternativa cuando otro controlador deba recibir las entregas fallidas; trate un 429 como un rechazo seguro, no como un mecanismo fiable de contrapresión.

Solo para pruebas con túneles locales, puede establecer:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

No use la validación de firma desactivada en un Gateway público.

## Configuración de varias cuentas

Use `accounts` cuando utilice más de un número de Twilio:

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

Cada cuenta debe usar un `webhookPath` distinto; el Gateway se niega a registrar una ruta de Webhook cuya ruta ya pertenezca a otra cuenta. Las alternativas de entorno `TWILIO_*`/`SMS_*` solo se aplican a la cuenta predeterminada; establezca `defaultAccount` para cambiar qué cuenta es la predeterminada.

## Solución de problemas

### Twilio devuelve 403 u OpenClaw rechaza el Webhook

Compruebe que `publicWebhookUrl` coincida exactamente con la URL configurada en Twilio, incluidos el esquema, el host, la ruta y la cadena de consulta. Twilio firma la cadena de la URL pública, por lo que las reescrituras del proxy y los nombres de host alternativos pueden impedir la validación de la firma.

Un error 403 con `Invalid account` significa que el `AccountSid` de la carga útil entrante no coincide con el `accountSid` configurado; compruebe que el Webhook apunte a la cuenta propietaria del número.

### No aparece ninguna solicitud de vinculación

Compruebe la URL y el método del Webhook de **Messaging** del número de Twilio. Debe apuntar a la URL del Webhook de SMS y usar `POST`. Confirme también que el Gateway sea accesible desde la Internet pública o mediante el túnel.

Si el registro de mensajes de Twilio muestra el error `11200`, Twilio aceptó el SMS entrante, pero no pudo acceder al Webhook. Compruebe lo siguiente:

- En Twilio, **Messaging > A message comes in** apunta a `publicWebhookUrl`.
- El método es `POST`.
- El túnel o proxy inverso expone el `webhookPath` exacto; para Tailscale Funnel, ejecute `tailscale funnel status` y confirme que `/webhooks/sms` aparezca en la lista.
- `publicWebhookUrl` usa el mismo esquema, host, ruta y cadena de consulta que envía Twilio, de modo que la validación de la firma pueda reproducir la URL firmada.

`openclaw channels status --channel sms --probe` muestra tanto los ajustes del Webhook de Twilio que no coinciden como los errores `11200` recientes.

### Fallan los envíos salientes

Confirme que se resuelvan `accountSid`, `authToken` y `fromNumber` o `messagingServiceSid`. Si usa una cuenta de prueba de Twilio, es posible que el número de destino deba verificarse en Twilio antes de poder enviar SMS salientes.

### Los mensajes llegan, pero el agente no responde

Compruebe `dmPolicy` y `allowFrom`. Con la política `pairing` predeterminada, se debe aprobar al remitente antes de procesar las interacciones normales del agente.
