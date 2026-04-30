---
read_when:
    - Trabajar en funcionalidades o Webhooks de Zalo
summary: Estado de soporte, capacidades y configuración del bot de Zalo
title: Zalo
x-i18n:
    generated_at: "2026-04-30T05:31:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

Estado: experimental. Se admiten los mensajes directos. La sección [Capacidades](#capabilities) de abajo refleja el comportamiento actual de los bots de Marketplace.

## Plugin incluido

Zalo se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación aparte.

Si estás en una compilación anterior o una instalación personalizada que excluye Zalo, instala un paquete npm actual cuando se publique uno:

- Instalar mediante la CLI: `openclaw plugins install @openclaw/zalo`
- O desde un checkout del código fuente: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detalles: [Plugins](/es/tools/plugin)

Si npm informa que el paquete propiedad de OpenClaw está obsoleto, usa una compilación empaquetada actual de OpenClaw o la ruta del checkout local hasta que se publique un paquete npm más reciente.

## Configuración rápida (principiante)

1. Asegúrate de que el Plugin de Zalo esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones anteriores/personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Configura el token:
   - Variable de entorno: `ZALO_BOT_TOKEN=...`
   - O configuración: `channels.zalo.accounts.default.botToken: "..."`.
3. Reinicia el Gateway (o termina la configuración).
4. El acceso por mensajes directos usa emparejamiento de forma predeterminada; aprueba el código de emparejamiento en el primer contacto.

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

## Qué es

Zalo es una aplicación de mensajería enfocada en Vietnam; su Bot API permite que el Gateway ejecute un bot para conversaciones 1:1.
Encaja bien para soporte o notificaciones cuando quieres enrutamiento determinista de vuelta a Zalo.

Esta página refleja el comportamiento actual de OpenClaw para **Zalo Bot Creator / bots de Marketplace**.
Los **bots de Zalo Official Account (OA)** son una superficie de producto distinta de Zalo y pueden comportarse de forma diferente.

- Un canal de Zalo Bot API propiedad del Gateway.
- Enrutamiento determinista: las respuestas vuelven a Zalo; el modelo nunca elige canales.
- Los mensajes directos comparten la sesión principal del agente.
- La sección [Capacidades](#capabilities) de abajo muestra el soporte actual para bots de Marketplace.

## Configuración (ruta rápida)

### 1) Crea un token de bot (Zalo Bot Platform)

1. Ve a [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) e inicia sesión.
2. Crea un bot nuevo y configura sus ajustes.
3. Copia el token completo del bot (normalmente `numeric_id:secret`). Para bots de Marketplace, el token de ejecución utilizable puede aparecer en el mensaje de bienvenida del bot después de crearlo.

### 2) Configura el token (variable de entorno o configuración)

Ejemplo:

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

Si más adelante pasas a una superficie de bot de Zalo donde haya grupos disponibles, puedes añadir configuración específica para grupos, como `groupPolicy` y `groupAllowFrom`, de forma explícita. Para el comportamiento actual de los bots de Marketplace, consulta [Capacidades](#capabilities).

Opción de variable de entorno: `ZALO_BOT_TOKEN=...` (solo funciona para la cuenta predeterminada).

Soporte multicuenta: usa `channels.zalo.accounts` con tokens por cuenta y `name` opcional.

3. Reinicia el Gateway. Zalo se inicia cuando se resuelve un token (variable de entorno o configuración).
4. El acceso por mensajes directos usa emparejamiento de forma predeterminada. Aprueba el código cuando se contacte al bot por primera vez.

## Cómo funciona (comportamiento)

- Los mensajes entrantes se normalizan en el sobre de canal compartido con marcadores de posición para medios.
- Las respuestas siempre se enrutan de vuelta al mismo chat de Zalo.
- Long-polling de forma predeterminada; el modo Webhook está disponible con `channels.zalo.webhookUrl`.

## Límites

- El texto saliente se divide en fragmentos de 2000 caracteres (límite de la API de Zalo).
- Las descargas/subidas de medios están limitadas por `channels.zalo.mediaMaxMb` (valor predeterminado 5).
- El streaming está bloqueado de forma predeterminada porque el límite de 2000 caracteres hace que el streaming sea menos útil.

## Control de acceso (mensajes directos)

### Acceso por mensajes directos

- Predeterminado: `channels.zalo.dmPolicy = "pairing"`. Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueben (los códigos caducan después de 1 hora).
- Aprobar mediante:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- El emparejamiento es el intercambio de token predeterminado. Detalles: [Emparejamiento](/es/channels/pairing)
- `channels.zalo.allowFrom` acepta identificadores numéricos de usuario (no hay búsqueda por nombre de usuario disponible).

## Control de acceso (grupos)

Para **Zalo Bot Creator / bots de Marketplace**, el soporte de grupos no estaba disponible en la práctica porque el bot no podía añadirse a ningún grupo.

Eso significa que las claves de configuración relacionadas con grupos de abajo existen en el esquema, pero no eran utilizables para bots de Marketplace:

- `channels.zalo.groupPolicy` controla el manejo de entradas de grupo: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` restringe qué identificadores de remitente pueden activar el bot en grupos.
- Si `groupAllowFrom` no está definido, Zalo recurre a `allowFrom` para las comprobaciones de remitente.
- Nota de ejecución: si falta `channels.zalo` por completo, la ejecución sigue recurriendo a `groupPolicy="allowlist"` por seguridad.

Los valores de la política de grupo (cuando el acceso a grupos está disponible en tu superficie de bot) son:

- `groupPolicy: "disabled"` — bloquea todos los mensajes de grupo.
- `groupPolicy: "open"` — permite a cualquier miembro del grupo (con acceso condicionado a menciones).
- `groupPolicy: "allowlist"` — valor predeterminado cerrado ante fallos; solo se aceptan remitentes permitidos.

Si usas una superficie de producto de bot de Zalo diferente y has verificado que el comportamiento de grupos funciona, documéntalo por separado en lugar de asumir que coincide con el flujo de bots de Marketplace.

## Long-polling frente a Webhook

- Predeterminado: long-polling (no se requiere URL pública).
- Modo Webhook: define `channels.zalo.webhookUrl` y `channels.zalo.webhookSecret`.
  - El secreto del Webhook debe tener entre 8 y 256 caracteres.
  - La URL del Webhook debe usar HTTPS.
  - Zalo envía eventos con el encabezado `X-Bot-Api-Secret-Token` para verificación.
  - El HTTP del Gateway gestiona las solicitudes de Webhook en `channels.zalo.webhookPath` (valor predeterminado: la ruta de la URL del Webhook).
  - Las solicitudes deben usar `Content-Type: application/json` (o tipos de medio `+json`).
  - Los eventos duplicados (`event_name + message_id`) se ignoran durante una ventana breve de reproducción.
  - El tráfico en ráfagas se limita por ruta/origen y puede devolver HTTP 429.

**Nota:** getUpdates (polling) y Webhook son mutuamente excluyentes según la documentación de la API de Zalo.

## Tipos de mensaje admitidos

Para una instantánea rápida del soporte, consulta [Capacidades](#capabilities). Las notas de abajo añaden detalle donde el comportamiento necesita contexto adicional.

- **Mensajes de texto**: Soporte completo con división en fragmentos de 2000 caracteres.
- **URL simples en texto**: Se comportan como entrada de texto normal.
- **Vistas previas de enlaces / tarjetas enriquecidas de enlaces**: Consulta el estado de bots de Marketplace en [Capacidades](#capabilities); no activaban una respuesta de forma fiable.
- **Mensajes de imagen**: Consulta el estado de bots de Marketplace en [Capacidades](#capabilities); el manejo de imágenes entrantes no era fiable (indicador de escritura sin una respuesta final).
- **Stickers**: Consulta el estado de bots de Marketplace en [Capacidades](#capabilities).
- **Notas de voz / archivos de audio / vídeo / adjuntos de archivo genéricos**: Consulta el estado de bots de Marketplace en [Capacidades](#capabilities).
- **Tipos no admitidos**: Registrados (por ejemplo, mensajes de usuarios protegidos).

## Capacidades

Esta tabla resume el comportamiento actual de **Zalo Bot Creator / bots de Marketplace** en OpenClaw.

| Función                     | Estado                                  |
| --------------------------- | --------------------------------------- |
| Mensajes directos           | ✅ Admitidos                            |
| Grupos                      | ❌ No disponibles para bots de Marketplace |
| Medios (imágenes entrantes) | ⚠️ Limitado / verificar en tu entorno   |
| Medios (imágenes salientes) | ⚠️ No vuelto a probar para bots de Marketplace |
| URL simples en texto        | ✅ Admitidas                            |
| Vistas previas de enlaces   | ⚠️ Poco fiables para bots de Marketplace |
| Reacciones                  | ❌ No admitidas                         |
| Stickers                    | ⚠️ Sin respuesta del agente para bots de Marketplace |
| Notas de voz / audio / vídeo | ⚠️ Sin respuesta del agente para bots de Marketplace |
| Adjuntos de archivo         | ⚠️ Sin respuesta del agente para bots de Marketplace |
| Hilos                       | ❌ No admitidos                         |
| Encuestas                   | ❌ No admitidas                         |
| Comandos nativos            | ❌ No admitidos                         |
| Streaming                   | ⚠️ Bloqueado (límite de 2000 caracteres) |

## Destinos de entrega (CLI/cron)

- Usa un id de chat como destino.
- Ejemplo: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Solución de problemas

**El bot no responde:**

- Comprueba que el token sea válido: `openclaw channels status --probe`
- Verifica que el remitente esté aprobado (emparejamiento o allowFrom)
- Revisa los registros del Gateway: `openclaw logs --follow`

**El Webhook no recibe eventos:**

- Asegúrate de que la URL del Webhook use HTTPS
- Verifica que el token secreto tenga entre 8 y 256 caracteres
- Confirma que el endpoint HTTP del Gateway sea accesible en la ruta configurada
- Comprueba que el polling de getUpdates no esté en ejecución (son mutuamente excluyentes)

## Referencia de configuración (Zalo)

Configuración completa: [Configuración](/es/gateway/configuration)

Las claves planas de nivel superior (`channels.zalo.botToken`, `channels.zalo.dmPolicy` y similares) son una abreviatura heredada de cuenta única. Prefiere `channels.zalo.accounts.<id>.*` para configuraciones nuevas. Ambas formas siguen documentadas aquí porque existen en el esquema.

Opciones del proveedor:

- `channels.zalo.enabled`: habilitar/deshabilitar el inicio del canal.
- `channels.zalo.botToken`: token de bot de Zalo Bot Platform.
- `channels.zalo.tokenFile`: leer el token desde una ruta de archivo normal. Los enlaces simbólicos se rechazan.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: pairing).
- `channels.zalo.allowFrom`: lista de permitidos para mensajes directos (identificadores de usuario). `open` requiere `"*"`. El asistente pedirá identificadores numéricos.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (valor predeterminado: allowlist). Presente en la configuración; consulta [Capacidades](#capabilities) y [Control de acceso (grupos)](#access-control-groups) para el comportamiento actual de bots de Marketplace.
- `channels.zalo.groupAllowFrom`: lista de permitidos de remitentes de grupo (identificadores de usuario). Recurre a `allowFrom` cuando no está definido.
- `channels.zalo.mediaMaxMb`: límite de medios entrantes/salientes (MB, valor predeterminado 5).
- `channels.zalo.webhookUrl`: habilitar el modo Webhook (HTTPS requerido).
- `channels.zalo.webhookSecret`: secreto del Webhook (8-256 caracteres).
- `channels.zalo.webhookPath`: ruta del Webhook en el servidor HTTP del Gateway.
- `channels.zalo.proxy`: URL de proxy para solicitudes a la API.

Opciones multicuenta:

- `channels.zalo.accounts.<id>.botToken`: token por cuenta.
- `channels.zalo.accounts.<id>.tokenFile`: archivo de token normal por cuenta. Los enlaces simbólicos se rechazan.
- `channels.zalo.accounts.<id>.name`: nombre para mostrar.
- `channels.zalo.accounts.<id>.enabled`: habilitar/deshabilitar la cuenta.
- `channels.zalo.accounts.<id>.dmPolicy`: política de mensajes directos por cuenta.
- `channels.zalo.accounts.<id>.allowFrom`: lista de permitidos por cuenta.
- `channels.zalo.accounts.<id>.groupPolicy`: política de grupo por cuenta. Presente en la configuración; consulta [Capacidades](#capabilities) y [Control de acceso (grupos)](#access-control-groups) para el comportamiento actual de bots de Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: lista de permitidos de remitentes de grupo por cuenta.
- `channels.zalo.accounts.<id>.webhookUrl`: URL de Webhook por cuenta.
- `channels.zalo.accounts.<id>.webhookSecret`: secreto de Webhook por cuenta.
- `channels.zalo.accounts.<id>.webhookPath`: ruta de Webhook por cuenta.
- `channels.zalo.accounts.<id>.proxy`: URL de proxy por cuenta.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación por mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats de grupo y acceso condicionado a menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
