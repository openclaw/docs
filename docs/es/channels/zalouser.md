---
read_when:
    - Configuración de Zalo Personal para OpenClaw
    - Depuración del inicio de sesión o del flujo de mensajes de Zalo Personal
summary: Compatibilidad con cuentas personales de Zalo mediante zca-js nativo (inicio de sesión con código QR), capacidades y configuración
title: Zalo personal
x-i18n:
    generated_at: "2026-07-19T01:48:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 09cecad1a9a5b34b932c5e68e2b3164b360fb6af1dcd2fd5b5979d1b2a1bd62b
    source_path: channels/zalouser.md
    workflow: 16
---

Estado: experimental. Esta integración automatiza una **cuenta personal de Zalo** mediante `zca-js` nativo, dentro del proceso y sin ningún binario de CLI externo.

<Warning>
Esta es una integración no oficial y puede provocar la suspensión o el bloqueo de la cuenta. Úsela bajo su propia responsabilidad.
</Warning>

## Instalación

Zalo Personal es un plugin externo oficial que no se incluye en el núcleo. Instálelo antes de usarlo:

```bash
openclaw plugins install @openclaw/zalouser
```

- Fijar una versión: `openclaw plugins install @openclaw/zalouser@<version>`
- Desde un checkout del código fuente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Instale el plugin (véase arriba).
2. Inicie sesión (mediante QR, en la máquina del Gateway):
   - `openclaw channels login --channel zalouser`
   - Escanee el código QR con la aplicación móvil de Zalo.
3. Habilite el canal:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Reinicie el Gateway (o finalice la configuración).
5. El acceso por mensaje directo usa el emparejamiento de forma predeterminada; apruebe el código de emparejamiento en el primer contacto.

## Qué es

- Se ejecuta por completo dentro del proceso mediante la biblioteca `zca-js` (sin ningún binario externo `zca`/`openzca`).
- Utiliza escuchas de eventos nativas (`message`, `error`) para recibir mensajes entrantes.
- Envía respuestas directamente mediante la API de JS (texto, contenido multimedia y enlaces).
- Está diseñada para casos de uso de «cuentas personales» en los que la API de bots de Zalo no está disponible.

## Nomenclatura

El id. del canal es `zalouser` para dejar explícito que automatiza una **cuenta de usuario personal de Zalo** (de manera no oficial). `zalo` está reservado para una posible integración oficial futura con la API de Zalo.

## Búsqueda de identificadores (directorio)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Límites

- El texto saliente se divide en fragmentos de 2000 caracteres (límite del cliente de Zalo).
- No se admite la transmisión en streaming.
- Los identificadores de los mensajes entrantes completados se conservan durante 30 días, con un límite de las 1000 entradas más recientes por cuenta.

## Durabilidad de los mensajes entrantes

OpenClaw almacena cada devolución de llamada de mensaje `zca-js` sin procesar antes de procesarla. Los mensajes pendientes se reanudan desde la cola de la cuenta después de reiniciar el Gateway, y el procesamiento permanece serializado por chat directo o grupo.

La escucha del socket `zca-js` no proporciona una confirmación de entrega ni reproduce automáticamente los mensajes antiguos después de volver a conectarse. Por tanto, la cola duradera protege el intervalo de fallo local posterior a que una devolución de llamada llegue a OpenClaw; no puede recuperar un mensaje que el socket nunca entregó. Las marcas de exclusión de reproducción son principalmente una protección contra devoluciones de llamada repetidas con el mismo identificador de mensaje de Zalo.

## Control de acceso (mensajes directos)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: `pairing`).

`channels.zalouser.allowFrom` debe usar identificadores estables de usuarios de Zalo. También puede hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`). Durante la configuración interactiva, los nombres introducidos pueden resolverse a identificadores mediante la búsqueda de contactos dentro del proceso del plugin.

Si permanece un nombre sin procesar en la configuración, el inicio solo lo resuelve cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado. Sin esa activación explícita, las comprobaciones de remitentes en tiempo de ejecución se basan exclusivamente en identificadores y los nombres sin procesar se ignoran para la autorización.

Apruebe mediante:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acceso a grupos (opcional)

- Valor predeterminado: `channels.zalouser.groupPolicy = "allowlist"` (los grupos requieren una entrada explícita en la lista de permitidos).
- Abrir todos los grupos: `channels.zalouser.groupPolicy = "open"`.
- Bloquear todos los grupos: `channels.zalouser.groupPolicy = "disabled"`.
- Con `groupPolicy = "allowlist"`:
  - Las claves de `channels.zalouser.groups` deben ser identificadores estables de grupos; los nombres se resuelven a identificadores durante el inicio únicamente cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado.
  - `channels.zalouser.groupAllowFrom` controla qué remitentes de los grupos permitidos pueden activar el bot; se puede hacer referencia a grupos estáticos de acceso de remitentes mediante `accessGroup:<name>`.
- El asistente de configuración puede solicitar listas de grupos permitidos.
- La coincidencia con la lista de grupos permitidos se basa exclusivamente en identificadores de forma predeterminada. Los nombres sin resolver se ignoran para la autorización, salvo que `channels.zalouser.dangerouslyAllowNameMatching: true` esté habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la resolución de nombres mutables durante el inicio y la coincidencia de nombres de grupos en tiempo de ejecución.
- `groupAllowFrom` **no** recurre a `allowFrom` para los mensajes normales de grupos: si se deja vacío en un grupo incluido en la lista de permitidos, se abre ese grupo a cualquier remitente. Los comandos de control autorizados (por ejemplo, `/new`) son la excepción; las comprobaciones del remitente de comandos recurren a `allowFrom` cuando `groupAllowFrom` está vacío.

Ejemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` es un nombre de campo heredado; la configuración actual usa `enabled`. `openclaw doctor --fix` migra automáticamente `allow` a `enabled`.
</Note>

### Filtrado por menciones en grupos

- `channels.zalouser.groups.<group>.requireMention` controla si las respuestas de grupos requieren una mención.
- Orden de resolución: identificador del grupo -> alias `group:<id>` -> nombre/slug del grupo (los candidatos basados en nombres solo se aplican cuando `dangerouslyAllowNameMatching: true`) -> `*` -> valor predeterminado (`true`).
- Se aplica tanto a los grupos incluidos en la lista de permitidos como al modo de grupos abiertos.
- Citar un mensaje del bot cuenta como una mención implícita para activar el grupo.
- Los comandos de control autorizados (por ejemplo, `/new`) pueden omitir el filtrado por menciones.
- Cuando se omite un mensaje de grupo porque se requiere una mención, OpenClaw lo almacena como historial de grupo pendiente y lo incluye en el siguiente mensaje de grupo procesado.
- Límite del historial del grupo: `channels.zalouser.historyLimit`, después `messages.groupChat.historyLimit` y, a continuación, un valor alternativo de `50`.

Ejemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## Varias cuentas

Las cuentas se asignan a perfiles `zalouser` en el estado de OpenClaw. Ejemplo:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Variables de entorno

La selección del perfil también puede proceder de variables de entorno:

| Variable                | Finalidad                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Nombre del perfil que se usará cuando no se haya establecido ningún `profile` en la configuración del canal o de la cuenta. |
| `ZCA_PROFILE`      | Alternativa heredada, utilizada únicamente cuando `ZALOUSER_PROFILE` no está establecida.             |

Los nombres de perfil seleccionan las credenciales de inicio de sesión de Zalo guardadas en el estado de OpenClaw. Orden de resolución:

1. `profile` explícito en la configuración.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. El identificador de cuenta para las cuentas no predeterminadas, o `default` para la cuenta predeterminada.

En las configuraciones con varias cuentas, es preferible establecer `profile` en cada cuenta de la configuración para que una sola variable de entorno no haga que varias cuentas compartan la misma sesión de inicio de sesión.

## Escritura, reacciones y confirmaciones de entrega

- OpenClaw envía un evento de escritura antes de despachar una respuesta (en la medida de lo posible).
- La acción de reacción a mensajes `react` es compatible con `zalouser` en las acciones del canal.
  - Use `remove: true` para eliminar un emoji de reacción específico de un mensaje.
  - Semántica de las reacciones: [Reacciones](/es/tools/reactions)
- Para los mensajes entrantes que incluyen metadatos de eventos, OpenClaw envía confirmaciones de entrega y lectura (en la medida de lo posible).

## Solución de problemas

**El inicio de sesión no se conserva:**

- `openclaw channels status --probe`
- Vuelva a iniciar sesión: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**No se resolvió el nombre de la lista de permitidos o del grupo:**

- Use identificadores numéricos en `allowFrom`/`groupAllowFrom` e identificadores estables de grupos en `groups`. Si necesita intencionadamente nombres exactos de amigos o grupos, habilite `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Actualización desde una configuración externa antigua basada en `zca`/CLI:**

- Elimine cualquier supuesto relativo a un proceso externo `zca`; ahora el canal se ejecuta por completo dentro del proceso mediante `zca-js`, sin ningún binario de CLI externo.

## Contenido relacionado

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación por mensaje directo y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento de los chats de grupo y filtrado por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de seguridad
