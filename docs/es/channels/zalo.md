---
read_when:
    - Trabajo con funciones o Webhooks de Zalo
summary: Estado de compatibilidad, capacidades y configuración del bot de Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-11T22:56:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Estado: experimental. Tanto los mensajes directos como los chats grupales están implementados; la tabla de [capacidades](#capabilities) que aparece a continuación refleja el comportamiento verificado en bots de Zalo Bot Creator / Marketplace.

## Plugin incluido

Zalo se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas no necesitan una instalación aparte.

En una compilación anterior o una instalación personalizada que excluya Zalo, instala directamente el paquete npm:

- Instalación: `openclaw plugins install @openclaw/zalo`
- Versión fijada: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Desde un repositorio local: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Crea un token de bot en [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (inicia sesión, crea un bot y configura los ajustes). El token tiene el formato `numeric_id:secret`; en los bots de Marketplace, el token utilizable en tiempo de ejecución puede aparecer en el mensaje de bienvenida del bot.
2. Define el token mediante la variable de entorno `ZALO_BOT_TOKEN=...` (solo para la cuenta predeterminada) o en la configuración.
3. Reinicia el Gateway.
4. Aprueba el código de vinculación en el primer contacto por mensaje directo (la política predeterminada para mensajes directos es la vinculación).

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

Varias cuentas: añade más entradas en `channels.zalo.accounts.<id>`, cada una con sus propios valores `botToken`/`name`. `channels.zalo.botToken` (plano, sin `accounts`) es una forma abreviada heredada para una sola cuenta; para configuraciones nuevas, se recomienda `accounts.<id>.*`.

## Qué es

Zalo es una aplicación de mensajería orientada a Vietnam. Su API de bots permite que el Gateway ejecute un bot tanto para conversaciones individuales como para chats grupales, con enrutamiento determinista de vuelta a Zalo (el modelo nunca elige los canales).

Esta página trata sobre los **bots de Zalo Bot Creator / Marketplace**. Los **bots de Zalo Official Account (OA)** corresponden a una superficie de producto distinta y pueden comportarse de manera diferente; esta página no los cubre.

## Cómo funciona

- Los mensajes entrantes se normalizan en el contenedor compartido del canal con marcadores de posición para contenido multimedia.
- Las respuestas siempre se enrutan de vuelta al mismo chat de Zalo; no se usan respuestas con cita (`replyToMode` está desactivado de forma fija).
- De forma predeterminada se usa sondeo prolongado (`getUpdates`); el modo Webhook está disponible mediante `channels.zalo.webhookUrl`.
- En los grupos se requiere una @mención para activar el bot; esto no se puede configurar por canal.

## Límites

| Límite                                         | Valor                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Tamaño de fragmento de texto saliente          | 2000 caracteres (límite de la API de Zalo)                                                         |
| Tamaño multimedia (entrante/saliente)          | `channels.zalo.mediaMaxMb`, valor predeterminado `5` MB                                            |
| Cuerpo de solicitud de Webhook                 | 1 MB, tiempo de espera de lectura de 30 s                                                          |
| Límite de frecuencia del Webhook               | 120 solicitudes / 60 s por ruta+IP del cliente; después, HTTP 429                                  |
| Ventana de eventos duplicados del Webhook      | 5 minutos (clave: ruta + cuenta + nombre del evento + chat + remitente + identificador del mensaje) |

## Control de acceso

### Mensajes directos

- `channels.zalo.dmPolicy`: `pairing` (predeterminado) | `allowlist` | `open` | `disabled`.
- Vinculación: los remitentes desconocidos reciben un código de vinculación; los mensajes se ignoran hasta que se aprueba. Los códigos caducan al cabo de 1 hora.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Detalles: [Vinculación](/es/channels/pairing)
- `channels.zalo.allowFrom` acepta identificadores numéricos de usuarios de Zalo (sin búsqueda por nombre de usuario). `open` requiere `"*"`.

### Grupos

El Plugin admite chats grupales (`chatTypes: ["direct", "group"]`), sujetos a una mención y a la política de grupos:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` restringe qué identificadores de remitentes pueden activar el bot en grupos; si no está definido, se utiliza `allowFrom`.
- Resolución predeterminada: cuando `channels.zalo` está configurado, un `groupPolicy` sin definir se resuelve como `open`. Cuando `channels.zalo` no existe en absoluto, el tiempo de ejecución adopta de forma segura `allowlist`.
- Advertencia observada en entornos reales: en algunas configuraciones de bots de Marketplace, el bot no se pudo añadir a ningún grupo. Si te ocurre, compruébalo en los ajustes de Zalo Bot Platform de tu bot; es una restricción de la plataforma, no una política de OpenClaw.

## Sondeo prolongado frente a Webhook

- Valor predeterminado: sondeo prolongado (no se requiere una URL pública).
- Modo Webhook: define `channels.zalo.webhookUrl` y `channels.zalo.webhookSecret`.
  - La URL del Webhook debe usar HTTPS.
  - El secreto del Webhook debe tener entre 8 y 256 caracteres.
  - Zalo envía los eventos con una cabecera `X-Bot-Api-Secret-Token`, que se verifica mediante una comparación en tiempo constante.
  - El servidor HTTP del Gateway procesa las solicitudes del Webhook en `channels.zalo.webhookPath` (de forma predeterminada, la ruta de la URL del Webhook).
  - Las solicitudes deben usar `Content-Type: application/json` (o un tipo multimedia `+json`).
  - Según la documentación de la API de Zalo, el sondeo mediante getUpdates y el Webhook son mutuamente excluyentes.

## Tipos de mensajes compatibles

- Texto: compatibilidad completa, dividido en fragmentos de 2000 caracteres.
- Contenido multimedia: entrante y saliente, limitado por `mediaMaxMb`.
- Reacciones, hilos, encuestas y comandos nativos: el Plugin no los admite.
- Transmisión: el Plugin declara la capacidad de transmisión por bloques, pero Zalo no dispone de controles específicos de ajuste para la cola saliente o la combinación de texto (a diferencia de otros canales regionales); si esto es importante para tu caso de uso, verifica el comportamiento actual en tu entorno.

## Capacidades

| Función                                | Estado                                  |
| -------------------------------------- | --------------------------------------- |
| Mensajes directos                      | Compatible                              |
| Grupos                                 | Compatible (requiere mención)           |
| Contenido multimedia (entrante/saliente) | Compatible, limitado por `mediaMaxMb` |
| Reacciones                             | No compatible                           |
| Hilos                                  | No compatible                           |
| Encuestas                              | No compatible                           |
| Comandos nativos                       | No compatible                           |
| Respuesta a mensaje / cita             | No se utiliza (desactivado de forma fija) |

## Destinos de entrega (CLI/Cron)

Usa un identificador de chat como destino:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Solución de problemas

**El bot no responde:**

- Comprueba el token: `openclaw channels status --probe`
- Verifica que el remitente esté aprobado (vinculación o `allowFrom`)
- Comprueba los registros del Gateway: `openclaw logs --follow`

**El Webhook no recibe eventos:**

- Confirma que la URL del Webhook use HTTPS
- Confirma que el secreto tenga entre 8 y 256 caracteres
- Confirma que el punto de conexión HTTP del Gateway sea accesible en la ruta configurada
- Confirma que el sondeo mediante getUpdates no se esté ejecutando también (son mutuamente excluyentes)
- Una ráfaga de solicitudes puede devolver HTTP 429 (120 solicitudes / 60 s por ruta+IP); espera y vuelve a intentarlo

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

| Ajuste                                       | Descripción                                                        | Valor predeterminado   |
| -------------------------------------------- | ------------------------------------------------------------------ | ---------------------- |
| `channels.zalo.enabled`                      | Activa o desactiva el inicio del canal                             | `true`                 |
| `channels.zalo.accounts.<id>.botToken`       | Token del bot de Zalo Bot Platform                                 | -                      |
| `channels.zalo.accounts.<id>.tokenFile`      | Lee el token desde un archivo (se rechazan enlaces simbólicos)     | -                      |
| `channels.zalo.accounts.<id>.name`           | Nombre para mostrar                                                | -                      |
| `channels.zalo.accounts.<id>.enabled`        | Activa o desactiva esta cuenta                                     | `true`                 |
| `channels.zalo.accounts.<id>.dmPolicy`       | Política de mensajes directos por cuenta                           | `pairing`              |
| `channels.zalo.accounts.<id>.allowFrom`      | Lista de permitidos para mensajes directos (identificadores de usuario) | -                 |
| `channels.zalo.accounts.<id>.groupPolicy`    | Política de grupos por cuenta                                      | consulta [Grupos](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Lista de remitentes permitidos en grupos; si no existe, usa `allowFrom` | -                  |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Límite de contenido multimedia entrante/saliente (MB)              | `5`                    |
| `channels.zalo.accounts.<id>.webhookUrl`     | Activa el modo Webhook (requiere HTTPS)                             | -                      |
| `channels.zalo.accounts.<id>.webhookSecret`  | Secreto del Webhook (8-256 caracteres)                             | -                      |
| `channels.zalo.accounts.<id>.webhookPath`    | Ruta del Webhook en el servidor HTTP del Gateway                   | ruta de la URL del Webhook |
| `channels.zalo.accounts.<id>.proxy`          | URL del proxy para solicitudes a la API                            | -                      |
| `channels.zalo.accounts.<id>.responsePrefix` | Sustitución del prefijo de respuesta saliente                      | -                      |
| `channels.zalo.defaultAccount`               | Cuenta predeterminada cuando hay varias configuradas               | `default`              |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` y otras claves planas de nivel superior son la forma abreviada heredada para una sola cuenta de los campos anteriores; se admiten ambas formas.

Opción de entorno: `ZALO_BOT_TOKEN=...` solo se resuelve como el token de la cuenta predeterminada.

## Relacionado

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Vinculación](/es/channels/pairing) - autenticación de mensajes directos y flujo de vinculación
- [Grupos](/es/channels/groups) - comportamiento de los chats grupales y activación mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de seguridad
