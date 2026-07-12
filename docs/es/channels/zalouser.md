---
read_when:
    - Configuración de Zalo Personal para OpenClaw
    - Depuración del inicio de sesión o del flujo de mensajes de Zalo Personal
summary: Compatibilidad con cuentas personales de Zalo mediante zca-js nativo (inicio de sesión con código QR), funcionalidades y configuración
title: Zalo personal
x-i18n:
    generated_at: "2026-07-11T22:57:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Estado: experimental. Esta integración automatiza una **cuenta personal de Zalo** mediante `zca-js` nativo, dentro del proceso y sin ningún binario CLI externo.

<Warning>
Esta es una integración no oficial y puede provocar la suspensión o el bloqueo de la cuenta. Úsela bajo su propia responsabilidad.
</Warning>

## Instalación

Zalo Personal es un plugin externo oficial que no está incluido en el núcleo. Instálelo antes de usarlo:

```bash
openclaw plugins install @openclaw/zalouser
```

- Fijar una versión: `openclaw plugins install @openclaw/zalouser@<version>`
- Desde una copia de trabajo del código fuente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Instale el plugin (indicado anteriormente).
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
5. El acceso por mensaje directo utiliza el emparejamiento de forma predeterminada; apruebe el código de emparejamiento en el primer contacto.

## Qué es

- Se ejecuta íntegramente dentro del proceso mediante la biblioteca `zca-js` (sin ningún binario externo `zca`/`openzca`).
- Utiliza escuchas de eventos nativas (`message`, `error`) para recibir mensajes entrantes.
- Envía respuestas directamente mediante la API de JS (texto, contenido multimedia y enlaces).
- Está diseñado para casos de uso con «cuentas personales» en los que la API de bots de Zalo no está disponible.

## Nomenclatura

El identificador del canal es `zalouser` para dejar claro que automatiza una **cuenta de usuario personal de Zalo** (de forma no oficial). `zalo` queda reservado para una posible integración oficial futura con la API de Zalo.

## Búsqueda de identificadores (directorio)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Límites

- El texto saliente se divide en fragmentos de 2000 caracteres (límite del cliente de Zalo).
- No se admite la transmisión en tiempo real.

## Control de acceso (mensajes directos)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: `pairing`).

`channels.zalouser.allowFrom` debe utilizar identificadores estables de usuarios de Zalo. También puede hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`). Durante la configuración interactiva, los nombres introducidos pueden resolverse como identificadores mediante la búsqueda de contactos que realiza el plugin dentro del proceso.

Si permanece un nombre sin procesar en la configuración, se resuelve durante el inicio únicamente cuando está habilitado `channels.zalouser.dangerouslyAllowNameMatching: true`. Sin esta habilitación explícita, las comprobaciones de remitentes durante la ejecución utilizan únicamente identificadores y los nombres sin procesar se ignoran para la autorización.

Apruebe mediante:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acceso a grupos (opcional)

- Valor predeterminado: `channels.zalouser.groupPolicy = "allowlist"` (los grupos requieren una entrada explícita en la lista de permitidos).
- Abrir todos los grupos: `channels.zalouser.groupPolicy = "open"`.
- Bloquear todos los grupos: `channels.zalouser.groupPolicy = "disabled"`.
- Con `groupPolicy = "allowlist"`:
  - Las claves de `channels.zalouser.groups` deben ser identificadores estables de grupos; los nombres se resuelven como identificadores durante el inicio únicamente cuando está habilitado `channels.zalouser.dangerouslyAllowNameMatching: true`.
  - `channels.zalouser.groupAllowFrom` controla qué remitentes de los grupos permitidos pueden activar el bot; se puede hacer referencia a grupos estáticos de acceso de remitentes mediante `accessGroup:<name>`.
- El asistente de configuración puede solicitar listas de grupos permitidos.
- De forma predeterminada, la correspondencia con la lista de grupos permitidos utiliza únicamente identificadores. Los nombres no resueltos se ignoran para la autorización, a menos que esté habilitado `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la resolución de nombres mutables durante el inicio y la correspondencia con nombres de grupos durante la ejecución.
- `groupAllowFrom` **no** recurre a `allowFrom` para los mensajes de grupo normales: si se deja vacío en un grupo incluido en la lista de permitidos, cualquier remitente podrá utilizar ese grupo. Los comandos de control autorizados (por ejemplo, `/new`) son la excepción; las comprobaciones del remitente del comando recurren a `allowFrom` cuando `groupAllowFrom` está vacío.

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
`channels.zalouser.groups.<id>.allow` es el nombre de un campo heredado; la configuración actual utiliza `enabled`. `openclaw doctor --fix` migra automáticamente `allow` a `enabled`.
</Note>

### Requisito de menciones en grupos

- `channels.zalouser.groups.<group>.requireMention` controla si las respuestas en grupos requieren una mención.
- Orden de resolución: identificador del grupo -> alias `group:<id>` -> nombre/slug del grupo (los candidatos basados en nombres solo se aplican cuando `dangerouslyAllowNameMatching: true`) -> `*` -> valor predeterminado (`true`).
- Se aplica tanto a los grupos incluidos en la lista de permitidos como al modo de grupos abiertos.
- Citar un mensaje del bot cuenta como una mención implícita para activar el grupo.
- Los comandos de control autorizados (por ejemplo, `/new`) pueden omitir el requisito de mención.
- Cuando se omite un mensaje de grupo porque se requiere una mención, OpenClaw lo almacena como historial de grupo pendiente y lo incluye en el siguiente mensaje de grupo procesado.
- Límite del historial de grupo: `channels.zalouser.historyLimit`, después `messages.groupChat.historyLimit` y, finalmente, un valor alternativo de `50`.

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

Las cuentas se asignan a perfiles de `zalouser` en el estado de OpenClaw. Ejemplo:

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

| Variable           | Finalidad                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Nombre del perfil que se utilizará cuando no se haya definido ningún `profile` en la configuración del canal o la cuenta. |
| `ZCA_PROFILE`      | Valor alternativo heredado, utilizado únicamente cuando `ZALOUSER_PROFILE` no está definido.                        |

Los nombres de perfil seleccionan las credenciales guardadas de inicio de sesión de Zalo en el estado de OpenClaw. Orden de resolución:

1. `profile` explícito en la configuración.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. El identificador de la cuenta para las cuentas no predeterminadas, o `default` para la cuenta predeterminada.

Para configuraciones con varias cuentas, es preferible definir `profile` en cada cuenta de la configuración, de modo que una sola variable de entorno no haga que varias cuentas compartan la misma sesión de inicio de sesión.

## Escritura, reacciones y confirmaciones de entrega

- OpenClaw envía un evento de escritura antes de transmitir una respuesta (según disponibilidad).
- La acción de reacción a mensajes `react` es compatible con `zalouser` en las acciones de canal.
  - Utilice `remove: true` para eliminar de un mensaje un emoji de reacción específico.
  - Semántica de las reacciones: [Reacciones](/es/tools/reactions)
- Para los mensajes entrantes que incluyen metadatos de eventos, OpenClaw envía confirmaciones de entrega y lectura (según disponibilidad).

## Solución de problemas

**El inicio de sesión no se conserva:**

- `openclaw channels status --probe`
- Vuelva a iniciar sesión: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**No se resolvió el nombre de la lista de permitidos o del grupo:**

- Utilice identificadores numéricos en `allowFrom`/`groupAllowFrom` e identificadores estables de grupos en `groups`. Si necesita intencionadamente nombres exactos de amigos o grupos, habilite `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Actualización desde una configuración antigua basada en un `zca` externo o en la CLI:**

- Elimine todas las suposiciones relacionadas con un proceso `zca` externo; el canal ahora se ejecuta íntegramente dentro del proceso mediante `zca-js`, sin ningún binario CLI externo.

## Contenido relacionado

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento de los chats grupales y requisito de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de la seguridad
