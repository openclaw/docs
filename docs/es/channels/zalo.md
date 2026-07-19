---
read_when:
    - Trabajar con funciones o webhooks de Zalo
summary: Estado de compatibilidad, capacidades y configuración del bot de Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-19T02:20:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f3e0bfe6003d3b2f38411fcc5a4e82266733b042693c7853d0b3c8a3864273c5
    source_path: channels/zalo.md
    workflow: 16
---

Estado: experimental. Tanto los mensajes directos como los chats grupales están implementados; la tabla de [Capacidades](#capabilities) que aparece a continuación refleja el comportamiento verificado en los bots de Zalo Bot Creator / Marketplace.

## Plugin incluido

Zalo se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas no necesitan una instalación independiente.

En una compilación anterior o una instalación personalizada que excluya Zalo, instale directamente el paquete npm:

- Instalación: `openclaw plugins install @openclaw/zalo`
- Versión fijada: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Desde un checkout local: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Cree un token de bot en [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (inicie sesión, cree un bot y configure los ajustes). El token es `numeric_id:secret`; en el caso de los bots de Marketplace, el token de tiempo de ejecución utilizable puede aparecer en el mensaje de bienvenida del bot.
2. Establezca el token, ya sea mediante la variable de entorno `ZALO_BOT_TOKEN=...` (solo para la cuenta predeterminada) o en la configuración.
3. Reinicie el Gateway.
4. Apruebe el código de vinculación en el primer contacto por mensaje directo (la política predeterminada para mensajes directos es la vinculación).

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

Varias cuentas: añada más entradas en `channels.zalo.accounts.<id>`, cada una con sus propios `botToken`/`name`. `channels.zalo.botToken` (formato plano, sin `accounts`) es una forma abreviada heredada para una sola cuenta; se recomienda usar `accounts.<id>.*` en las configuraciones nuevas.

## Qué es

Zalo es una aplicación de mensajería orientada a Vietnam. Su API de bots permite que el Gateway ejecute un bot tanto para conversaciones 1:1 como para chats grupales, con enrutamiento determinista de vuelta a Zalo (el modelo nunca elige los canales).

Esta página trata sobre los **bots de Zalo Bot Creator / Marketplace**. Los **bots de Zalo Official Account (OA)** corresponden a una superficie de producto diferente y pueden comportarse de manera distinta; esta página no los abarca.

## Cómo funciona

- Los mensajes entrantes se normalizan en el sobre de canal compartido con marcadores de posición para contenido multimedia.
- Las respuestas siempre se enrutan de vuelta al mismo chat de Zalo; no se usa la respuesta con cita (`replyToMode` está siempre desactivado).
- Sondeo largo (`getUpdates`) de forma predeterminada; el modo Webhook está disponible mediante `channels.zalo.webhookUrl`.
- Los grupos requieren una @mención para activar el bot; esto no se puede configurar por canal.

## Límites

| Límite                                | Valor                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Tamaño del fragmento de texto saliente | 2000 caracteres (límite de la API de Zalo)                                              |
| Tamaño multimedia (entrante/saliente) | `channels.zalo.mediaMaxMb`, valor predeterminado de `5` MB                        |
| Cuerpo de la solicitud Webhook        | 1 MB, tiempo de espera de lectura de 30s                                                |
| Límite de frecuencia del Webhook      | 120 solicitudes / 60s por ruta+IP de cliente; después, HTTP 429                         |
| Marcadores de repetición del Webhook  | 30 días, hasta 20,000 eventos completados por cuenta (identificados por id de mensaje)  |

## Control de acceso

### Mensajes directos

- `channels.zalo.dmPolicy`: `pairing` (valor predeterminado) | `allowlist` | `open` | `disabled`.
- Emparejamiento: los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se apruebe. Los códigos caducan después de 1 hora.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Detalles: [Emparejamiento](/es/channels/pairing)
- `channels.zalo.allowFrom` acepta identificadores numéricos de usuario de Zalo (sin búsqueda por nombre de usuario). `open` requiere `"*"`.

### Grupos

El plugin admite chats grupales (`chatTypes: ["direct", "group"]`) y estos están sujetos a una mención y a la política de grupos:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` restringe qué ID de remitente pueden activar el bot en grupos; si no se establece, se utiliza `allowFrom`.
- Resolución predeterminada: cuando se configura `channels.zalo`, un valor `groupPolicy` no establecido se resuelve como `open`. Cuando `channels.zalo` falta por completo, el entorno de ejecución adopta de forma segura `allowlist`.
- Advertencia observada en entornos reales: en algunas configuraciones de bots de Marketplace, no se pudo añadir el bot a ningún grupo. Si ocurre, compruébelo en la configuración de Zalo Bot Platform del bot; es una restricción de la plataforma, no una política de OpenClaw.

## Sondeo prolongado frente a Webhook

- Valor predeterminado: sondeo prolongado (no requiere una URL pública).
- Modo Webhook: establezca `channels.zalo.webhookUrl` y `channels.zalo.webhookSecret`.
  - La URL del Webhook debe usar HTTPS.
  - El secreto del Webhook debe tener entre 8 y 256 caracteres.
  - Zalo envía los eventos con una cabecera `X-Bot-Api-Secret-Token`, que se comprueba mediante una comparación de tiempo constante.
  - El HTTP del Gateway gestiona las solicitudes del Webhook en `channels.zalo.webhookPath` (de forma predeterminada, la ruta de la URL del Webhook).
  - Las solicitudes deben usar `Content-Type: application/json` (o un tipo de medio `+json`).
  - Solo se devuelve HTTP 200 después de almacenar de forma duradera el evento sin procesar; los fallos de almacenamiento devuelven HTTP 500.
  - Según la documentación de la API de Zalo, el sondeo de getUpdates y el Webhook son mutuamente excluyentes.

## Tipos de mensajes compatibles

- Texto: compatibilidad completa, dividido en fragmentos de 2000 caracteres.
- Contenido multimedia: entrante y saliente, limitado por `mediaMaxMb`.
- Reacciones, hilos, encuestas y comandos nativos: no compatibles con el Plugin.
- Transmisión: el Plugin declara capacidad de transmisión por bloques, pero Zalo no dispone de opciones específicas para ajustar la cola saliente ni la combinación de texto (a diferencia de otros canales regionales); si esto es importante para su caso de uso, compruebe el comportamiento actual en su entorno.

## Capacidades

| Función                  | Estado                            |
| ------------------------ | --------------------------------- |
| Mensajes directos          | Compatible                         |
| Grupos                   | Compatible (requiere mención)         |
| Contenido multimedia (entrante/saliente) | Compatible, limitado por `mediaMaxMb` |
| Reacciones                | No compatible                     |
| Hilos                  | No compatible                     |
| Encuestas                    | No compatible                     |
| Comandos nativos          | No compatible                     |
| Respuesta a / cita         | No se utiliza (desactivado de forma fija)              |

## Destinos de entrega (CLI/Cron)

Use un ID de chat como destino:

```bash
openclaw message send --channel zalo --target 123456789 --message "hola"
```

## Solución de problemas

**El bot no responde:**

- Compruebe el token: `openclaw channels status --probe`
- Compruebe que el remitente esté aprobado (emparejamiento o `allowFrom`)
- Compruebe los registros del Gateway: `openclaw logs --follow`

**El Webhook no recibe eventos:**

- Confirme que la URL del Webhook use HTTPS
- Confirme que el secreto tenga entre 8 y 256 caracteres
- Confirme que se pueda acceder al endpoint HTTP del Gateway en la ruta configurada
- Confirme que el sondeo de getUpdates no se esté ejecutando también (son mutuamente excluyentes)
- Una ráfaga de solicitudes puede devolver HTTP 429 (120 solicitudes / 60s por ruta+IP); espere y vuelva a intentarlo

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

| Ajuste                                      | Descripción                                       | Valor predeterminado               |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | Habilitar/deshabilitar el inicio del canal                    | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | Token del bot de Zalo Bot Platform                  | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | Leer el token desde un archivo (se rechazan los enlaces simbólicos)        | -                     |
| `channels.zalo.accounts.<id>.name`           | Nombre para mostrar                                      | -                     |
| `channels.zalo.accounts.<id>.enabled`        | Habilitar/deshabilitar esta cuenta                       | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | Política de mensajes directos por cuenta                             | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | Lista de remitentes permitidos para mensajes directos (ID de usuario)                           | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | Política de grupos por cuenta                          | consulte [Grupos](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Lista de remitentes permitidos en grupos; si no se establece, se utiliza `allowFrom` | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Límite de contenido multimedia entrante/saliente (MB)                   | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | Habilitar el modo Webhook (requiere HTTPS)              | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Secreto del Webhook (8-256 caracteres)                      | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Ruta del Webhook en el servidor HTTP del Gateway           | ruta de la URL del Webhook      |
| `channels.zalo.accounts.<id>.proxy`          | URL del proxy para las solicitudes a la API                        | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | Sustitución del prefijo de las respuestas salientes                 | -                     |
| `channels.zalo.defaultAccount`               | Cuenta predeterminada cuando se configuran varias      | `default`             |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` y otras claves planas de nivel superior son la forma abreviada heredada para una sola cuenta de los campos anteriores; se admiten ambas formas.

Opción de entorno: `ZALO_BOT_TOKEN=...` resuelve únicamente el token de la cuenta predeterminada.

## Temas relacionados

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento de los chats de grupo y requisito de mención
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para los mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de la seguridad
