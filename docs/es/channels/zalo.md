---
read_when:
    - Trabajar en funciones o webhooks de Zalo
summary: Estado de soporte, capacidades y configuración del bot de Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-05T11:05:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Estado: experimental. Los mensajes directos y los chats grupales están implementados; la tabla de [Capacidades](#capabilities) siguiente refleja el comportamiento verificado en bots de Zalo Bot Creator / Marketplace.

## Plugin incluido

Zalo se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas no necesitan una instalación aparte.

En una compilación anterior o una instalación personalizada que excluya Zalo, instala directamente el paquete npm:

- Instalar: `openclaw plugins install @openclaw/zalo`
- Versión fijada: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Desde un checkout local: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Crea un token de bot en [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (inicia sesión, crea un bot, configura los ajustes). El token es `numeric_id:secret`; en los bots de Marketplace, el token utilizable en tiempo de ejecución puede aparecer en el mensaje de bienvenida del bot.
2. Define el token, ya sea como env `ZALO_BOT_TOKEN=...` (solo cuenta predeterminada) o en la configuración.
3. Reinicia el Gateway.
4. Aprueba el código de emparejamiento en el primer contacto por mensaje directo (la política predeterminada de mensajes directos es emparejamiento).

Configuración mínima:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Varias cuentas: agrega más entradas bajo `channels.zalo.accounts.<id>`, cada una con su propio `botToken`/`name`. `channels.zalo.botToken` (plano, sin `accounts`) es una abreviatura heredada para una sola cuenta; prefiere `accounts.<id>.*` para configuraciones nuevas.

## Qué es

Zalo es una aplicación de mensajería enfocada en Vietnam. Su Bot API permite que el Gateway ejecute un bot tanto para conversaciones 1:1 como para chats grupales, con enrutamiento determinista de vuelta a Zalo (el modelo nunca elige canales).

Esta página cubre **bots de Zalo Bot Creator / Marketplace**. Los **bots de Zalo Official Account (OA)** son una superficie de producto distinta y pueden comportarse de forma diferente; esta página no los cubre.

## Cómo funciona

- Los mensajes entrantes se normalizan en el sobre de canal compartido con marcadores de posición para medios.
- Las respuestas siempre se enrutan de vuelta al mismo chat de Zalo; no se usa respuesta con cita (`replyToMode` está fijo como desactivado).
- Long-polling (`getUpdates`) de forma predeterminada; el modo Webhook está disponible mediante `channels.zalo.webhookUrl`.
- Los grupos requieren una @mención para activar el bot; esto no es configurable por canal.

## Límites

| Límite                         | Valor                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Tamaño de fragmento de texto saliente | 2000 caracteres (límite de la API de Zalo)                              |
| Tamaño de medios (entrante/saliente) | `channels.zalo.mediaMaxMb`, valor predeterminado `5` MB                  |
| Cuerpo de solicitud Webhook    | 1 MB, tiempo de espera de lectura de 30 s                                     |
| Límite de frecuencia Webhook   | 120 solicitudes / 60 s por ruta+IP de cliente, luego HTTP 429                 |
| Ventana de eventos duplicados Webhook | 5 minutos (indexada por ruta + cuenta + nombre de evento + chat + remitente + id de mensaje) |

## Control de acceso

### Mensajes directos

- `channels.zalo.dmPolicy`: `pairing` (predeterminado) | `allowlist` | `open` | `disabled`.
- Emparejamiento: los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se apruebe. Los códigos caducan después de 1 hora.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Detalles: [Emparejamiento](/es/channels/pairing)
- `channels.zalo.allowFrom` acepta IDs numéricos de usuario de Zalo (sin búsqueda de nombre de usuario). `open` requiere `"*"`.

### Grupos

Los chats grupales son compatibles con el Plugin (`chatTypes: ["direct", "group"]`) y están protegidos por mención más política de grupo:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` restringe qué IDs de remitente pueden activar el bot en grupos; recurre a `allowFrom` cuando no está definido.
- Resolución predeterminada: cuando `channels.zalo` está configurado, un `groupPolicy` no definido se resuelve como `open`. Cuando `channels.zalo` falta por completo, el runtime falla de forma cerrada a `allowlist`.
- Advertencia reportada en el mundo real: en algunas configuraciones de bots de Marketplace, el bot no se pudo agregar a ningún grupo. Si te ocurre, verifica la configuración de Zalo Bot Platform de tu bot; es una restricción del lado de la plataforma, no una política de OpenClaw.

## Long-polling frente a Webhook

- Predeterminado: long-polling (no requiere URL pública).
- Modo Webhook: define `channels.zalo.webhookUrl` y `channels.zalo.webhookSecret`.
  - La URL del Webhook debe usar HTTPS.
  - El secreto del Webhook debe tener entre 8 y 256 caracteres.
  - Zalo envía eventos con un encabezado `X-Bot-Api-Secret-Token`, comprobado con una comparación en tiempo constante.
  - HTTP del Gateway gestiona las solicitudes Webhook en `channels.zalo.webhookPath` (de forma predeterminada, la ruta de la URL del Webhook).
  - Las solicitudes deben usar `Content-Type: application/json` (o un tipo de medio `+json`).
  - El sondeo getUpdates y el Webhook son mutuamente excluyentes según la documentación de la API de Zalo.

## Tipos de mensaje compatibles

- Texto: compatibilidad completa, fragmentado en 2000 caracteres.
- Medios: entrantes/salientes, limitados por `mediaMaxMb`.
- Reacciones, hilos, encuestas, comandos nativos: no compatibles con el Plugin.
- Streaming: el Plugin declara capacidad de streaming por bloques, pero Zalo no tiene controles dedicados de cola saliente/fusión de texto (a diferencia de algunos otros canales regionales); verifica el comportamiento actual en tu entorno si esto importa para tu caso de uso.

## Capacidades

| Función                  | Estado                            |
| ------------------------ | --------------------------------- |
| Mensajes directos        | Compatible                        |
| Grupos                   | Compatible (protegido por mención) |
| Medios (entrantes/salientes) | Compatible, limitado por `mediaMaxMb` |
| Reacciones               | No compatible                     |
| Hilos                    | No compatible                     |
| Encuestas                | No compatible                     |
| Comandos nativos         | No compatible                     |
| Responder a / citar      | No se usa (fijo como desactivado) |

## Destinos de entrega (CLI/Cron)

Usa un ID de chat como destino:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Solución de problemas

**El bot no responde:**

- Comprueba el token: `openclaw channels status --probe`
- Verifica que el remitente esté aprobado (emparejamiento o `allowFrom`)
- Revisa los registros del Gateway: `openclaw logs --follow`

**El Webhook no recibe eventos:**

- Confirma que la URL del Webhook use HTTPS
- Confirma que el secreto tenga entre 8 y 256 caracteres
- Confirma que el endpoint HTTP del Gateway sea accesible en la ruta configurada
- Confirma que el sondeo getUpdates no se esté ejecutando también (son mutuamente excluyentes)
- Una ráfaga de solicitudes puede devolver HTTP 429 (120 solicitudes / 60 s por ruta+IP); espera y reintenta

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

| Ajuste                                       | Descripción                                       | Predeterminado       |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | Habilitar/deshabilitar el inicio del canal        | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | Token del bot desde Zalo Bot Platform             | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | Leer token desde un archivo (se rechazan symlinks) | -                     |
| `channels.zalo.accounts.<id>.name`           | Nombre para mostrar                               | -                     |
| `channels.zalo.accounts.<id>.enabled`        | Habilitar/deshabilitar esta cuenta                | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | Política de mensajes directos por cuenta          | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | Lista de permitidos de mensajes directos (IDs de usuario) | -              |
| `channels.zalo.accounts.<id>.groupPolicy`    | Política de grupos por cuenta                     | ver [Grupos](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Lista de permitidos de remitentes de grupo; recurre a `allowFrom` | -       |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Límite de medios entrantes/salientes (MB)         | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | Habilitar modo Webhook (HTTPS requerido)          | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Secreto del Webhook (8-256 caracteres)            | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Ruta del Webhook en el servidor HTTP del Gateway  | ruta de la URL del Webhook |
| `channels.zalo.accounts.<id>.proxy`          | URL de proxy para solicitudes de API              | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | Anulación del prefijo de respuesta saliente       | -                     |
| `channels.zalo.defaultAccount`               | Cuenta predeterminada cuando hay varias configuradas | `default`          |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` y otras claves planas de nivel superior son la abreviatura heredada de una sola cuenta para los campos anteriores; ambas formas son compatibles.

Opción env: `ZALO_BOT_TOKEN=...` resuelve solo el token de la cuenta predeterminada.

## Relacionado

- [Descripción general de canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento de chats grupales y activación por mención
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y hardening
