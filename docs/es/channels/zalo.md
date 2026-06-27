---
read_when:
    - Trabajar en funciones o Webhooks de Zalo
summary: Estado de soporte, capacidades y configuración del bot de Zalo
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Estado: experimental. Se admiten los mensajes directos. La sección [Capacidades](#capabilities) siguiente refleja el comportamiento actual de los bots de Marketplace.

## Plugin incluido

Zalo se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación independiente.

Si usas una compilación anterior o una instalación personalizada que excluye Zalo, instala directamente el paquete de npm:

- Instalar mediante CLI: `openclaw plugins install @openclaw/zalo`
- Versión fijada: `openclaw plugins install @openclaw/zalo@2026.5.2`
- O desde un checkout de código fuente: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiante)

1. Asegúrate de que el Plugin de Zalo esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones anteriores o personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Define el token:
   - Env: `ZALO_BOT_TOKEN=...`
   - O config: `channels.zalo.accounts.default.botToken: "..."`.
3. Reinicia el Gateway (o finaliza la configuración).
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

Zalo es una aplicación de mensajería centrada en Vietnam; su Bot API permite que el Gateway ejecute un bot para conversaciones 1:1.
Es una buena opción para soporte o notificaciones cuando quieres enrutamiento determinista de vuelta a Zalo.

Esta página refleja el comportamiento actual de OpenClaw para **bots de Zalo Bot Creator / Marketplace**.
Los **bots de Zalo Official Account (OA)** son una superficie de producto diferente de Zalo y pueden comportarse de otra manera.

- Un canal de Zalo Bot API propiedad del Gateway.
- Enrutamiento determinista: las respuestas vuelven a Zalo; el modelo nunca elige canales.
- Los mensajes directos comparten la sesión principal del agente.
- La sección [Capacidades](#capabilities) siguiente muestra la compatibilidad actual de los bots de Marketplace.

## Configuración (ruta rápida)

### 1) Crear un token de bot (Zalo Bot Platform)

1. Ve a [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) e inicia sesión.
2. Crea un bot nuevo y configura sus ajustes.
3. Copia el token completo del bot (normalmente `numeric_id:secret`). Para bots de Marketplace, el token de ejecución utilizable puede aparecer en el mensaje de bienvenida del bot después de crearlo.

### 2) Configurar el token (env o config)

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

Si más adelante migras a una superficie de bot de Zalo donde los grupos estén disponibles, puedes añadir explícitamente configuración específica de grupos como `groupPolicy` y `groupAllowFrom`. Para el comportamiento actual de bots de Marketplace, consulta [Capacidades](#capabilities).

Opción env: `ZALO_BOT_TOKEN=...` (funciona solo para la cuenta predeterminada).

Compatibilidad con varias cuentas: usa `channels.zalo.accounts` con tokens por cuenta y `name` opcional.

3. Reinicia el Gateway. Zalo se inicia cuando se resuelve un token (env o config).
4. El acceso por mensajes directos usa emparejamiento de forma predeterminada. Aprueba el código cuando el bot reciba el primer contacto.

## Cómo funciona (comportamiento)

- Los mensajes entrantes se normalizan en el sobre de canal compartido con marcadores de posición multimedia.
- Las respuestas siempre se enrutan de vuelta al mismo chat de Zalo.
- Long-polling de forma predeterminada; el modo Webhook está disponible con `channels.zalo.webhookUrl`.

## Límites

- El texto saliente se divide en fragmentos de 2000 caracteres (límite de la API de Zalo).
- Las descargas/cargas multimedia están limitadas por `channels.zalo.mediaMaxMb` (predeterminado 5).
- El streaming está bloqueado de forma predeterminada porque el límite de 2000 caracteres hace que el streaming sea menos útil.

## Control de acceso (mensajes directos)

### Acceso por mensajes directos

- Predeterminado: `channels.zalo.dmPolicy = "pairing"`. Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueben (los códigos caducan después de 1 hora).
- Aprobar mediante:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- El emparejamiento es el intercambio de token predeterminado. Detalles: [Emparejamiento](/es/channels/pairing)
- `channels.zalo.allowFrom` acepta IDs numéricos de usuario (no hay búsqueda de nombre de usuario disponible).

## Control de acceso (grupos)

Para **bots de Zalo Bot Creator / Marketplace**, la compatibilidad con grupos no estaba disponible en la práctica porque el bot no podía añadirse a ningún grupo.

Esto significa que las claves de configuración relacionadas con grupos siguientes existen en el esquema, pero no eran utilizables para bots de Marketplace:

- `channels.zalo.groupPolicy` controla el manejo de entradas de grupo: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` restringe qué IDs de remitente pueden activar el bot en grupos.
- Si `groupAllowFrom` no está definido, Zalo recurre a `allowFrom` para las comprobaciones de remitente.
- Nota de ejecución: si `channels.zalo` falta por completo, la ejecución aún recurre a `groupPolicy="allowlist"` por seguridad.

Los valores de política de grupo (cuando el acceso a grupos está disponible en tu superficie de bot) son:

- `groupPolicy: "disabled"` — bloquea todos los mensajes de grupo.
- `groupPolicy: "open"` — permite a cualquier miembro del grupo (limitado por mención).
- `groupPolicy: "allowlist"` — valor predeterminado cerrado ante fallo; solo se aceptan remitentes permitidos.

Si usas una superficie de producto de bot de Zalo diferente y has verificado que el comportamiento de grupos funciona, documéntalo por separado en lugar de asumir que coincide con el flujo de bots de Marketplace.

## Long-polling frente a Webhook

- Predeterminado: long-polling (no requiere URL pública).
- Modo Webhook: define `channels.zalo.webhookUrl` y `channels.zalo.webhookSecret`.
  - El secreto del Webhook debe tener entre 8 y 256 caracteres.
  - La URL del Webhook debe usar HTTPS.
  - Zalo envía eventos con el encabezado `X-Bot-Api-Secret-Token` para verificación.
  - El HTTP del Gateway gestiona solicitudes de Webhook en `channels.zalo.webhookPath` (por defecto, la ruta de la URL del Webhook).
  - Las solicitudes deben usar `Content-Type: application/json` (o tipos multimedia `+json`).
  - Los eventos duplicados (`event_name + message_id`) se ignoran durante una breve ventana de reproducción.
  - El tráfico en ráfagas se limita por tasa según ruta/origen y puede devolver HTTP 429.

**Nota:** getUpdates (polling) y Webhook son mutuamente excluyentes según la documentación de la API de Zalo.

## Tipos de mensaje admitidos

Para una instantánea rápida de compatibilidad, consulta [Capacidades](#capabilities). Las notas siguientes añaden detalles cuando el comportamiento necesita contexto adicional.

- **Mensajes de texto**: Compatibilidad completa con fragmentación a 2000 caracteres.
- **URL simples en texto**: Se comportan como entrada de texto normal.
- **Vistas previas de enlaces / tarjetas de enlace enriquecidas**: Consulta el estado de bots de Marketplace en [Capacidades](#capabilities); no activaban una respuesta de forma fiable.
- **Mensajes de imagen**: Consulta el estado de bots de Marketplace en [Capacidades](#capabilities); el manejo de imágenes entrantes no era fiable (indicador de escritura sin respuesta final).
- **Stickers**: Consulta el estado de bots de Marketplace en [Capacidades](#capabilities).
- **Notas de voz / archivos de audio / video / adjuntos de archivo genéricos**: Consulta el estado de bots de Marketplace en [Capacidades](#capabilities).
- **Tipos no compatibles**: Se registran (por ejemplo, mensajes de usuarios protegidos).

## Capacidades

Esta tabla resume el comportamiento actual de **bots de Zalo Bot Creator / Marketplace** en OpenClaw.

| Función                     | Estado                                            |
| --------------------------- | ------------------------------------------------- |
| Mensajes directos           | ✅ Compatible                                     |
| Grupos                      | ❌ No disponible para bots de Marketplace         |
| Multimedia (imágenes entrantes) | ⚠️ Limitado / verifica en tu entorno          |
| Multimedia (imágenes salientes) | ⚠️ No vuelto a probar para bots de Marketplace |
| URL simples en texto        | ✅ Compatible                                     |
| Vistas previas de enlaces   | ⚠️ No fiable para bots de Marketplace             |
| Reacciones                  | ❌ No compatible                                  |
| Stickers                    | ⚠️ Sin respuesta del agente para bots de Marketplace |
| Notas de voz / audio / video | ⚠️ Sin respuesta del agente para bots de Marketplace |
| Adjuntos de archivo         | ⚠️ Sin respuesta del agente para bots de Marketplace |
| Hilos                       | ❌ No compatible                                  |
| Encuestas                   | ❌ No compatible                                  |
| Comandos nativos            | ❌ No compatible                                  |
| Streaming                   | ⚠️ Bloqueado (límite de 2000 caracteres)          |

## Destinos de entrega (CLI/cron)

- Usa un id de chat como destino.
- Ejemplo: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Solución de problemas

**El bot no responde:**

- Comprueba que el token sea válido: `openclaw channels status --probe`
- Verifica que el remitente esté aprobado (emparejamiento o allowFrom)
- Revisa los logs del Gateway: `openclaw logs --follow`

**El Webhook no recibe eventos:**

- Asegúrate de que la URL del Webhook use HTTPS
- Verifica que el token secreto tenga entre 8 y 256 caracteres
- Confirma que el endpoint HTTP del Gateway sea accesible en la ruta configurada
- Comprueba que el polling getUpdates no esté ejecutándose (son mutuamente excluyentes)

## Referencia de configuración (Zalo)

Configuración completa: [Configuración](/es/gateway/configuration)

Las claves planas de nivel superior (`channels.zalo.botToken`, `channels.zalo.dmPolicy` y similares) son una abreviatura heredada para una sola cuenta. Prefiere `channels.zalo.accounts.<id>.*` para configuraciones nuevas. Ambas formas siguen documentadas aquí porque existen en el esquema.

Opciones del proveedor:

- `channels.zalo.enabled`: habilita/deshabilita el inicio del canal.
- `channels.zalo.botToken`: token del bot de Zalo Bot Platform.
- `channels.zalo.tokenFile`: lee el token desde una ruta de archivo regular. Los symlinks se rechazan.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing).
- `channels.zalo.allowFrom`: lista de permitidos de mensajes directos (IDs de usuario). `open` requiere `"*"`. El asistente pedirá IDs numéricos.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (predeterminado: allowlist). Presente en la configuración; consulta [Capacidades](#capabilities) y [Control de acceso (grupos)](#access-control-groups) para el comportamiento actual de bots de Marketplace.
- `channels.zalo.groupAllowFrom`: lista de permitidos de remitentes de grupo (IDs de usuario). Recurre a `allowFrom` cuando no está definido.
- `channels.zalo.mediaMaxMb`: límite de multimedia entrante/saliente (MB, predeterminado 5).
- `channels.zalo.webhookUrl`: habilita el modo Webhook (requiere HTTPS).
- `channels.zalo.webhookSecret`: secreto del Webhook (8-256 caracteres).
- `channels.zalo.webhookPath`: ruta del Webhook en el servidor HTTP del Gateway.
- `channels.zalo.proxy`: URL de proxy para solicitudes de API.

Opciones de varias cuentas:

- `channels.zalo.accounts.<id>.botToken`: token por cuenta.
- `channels.zalo.accounts.<id>.tokenFile`: archivo regular de token por cuenta. Los symlinks se rechazan.
- `channels.zalo.accounts.<id>.name`: nombre para mostrar.
- `channels.zalo.accounts.<id>.enabled`: habilita/deshabilita la cuenta.
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
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat de grupo y activación por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
