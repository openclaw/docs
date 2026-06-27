---
read_when:
    - Configuración de Zalo Personal para OpenClaw
    - Depuración del inicio de sesión o del flujo de mensajes de Zalo Personal
summary: Compatibilidad con cuentas personales de Zalo mediante zca-js nativo (inicio de sesión con QR), capacidades y configuración
title: Zalo personal
x-i18n:
    generated_at: "2026-06-27T10:48:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

Estado: experimental. Esta integración automatiza una **cuenta personal de Zalo** mediante `zca-js` nativo dentro de OpenClaw.

<Warning>
Esta es una integración no oficial y puede provocar la suspensión o el bloqueo de la cuenta. Úsala bajo tu propio riesgo.
</Warning>

## Plugin incluido

Zalo Personal se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones
empaquetadas normales no necesitan una instalación separada.

Si usas una compilación anterior o una instalación personalizada que excluye Zalo Personal,
instala el paquete npm directamente:

- Instalar mediante CLI: `openclaw plugins install @openclaw/zalouser`
- Versión fijada: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- O desde un checkout de código fuente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalles: [Plugins](/es/tools/plugin)

No se requiere ningún binario CLI externo `zca`/`openzca`.

## Configuración rápida (principiantes)

1. Asegúrate de que el Plugin Zalo Personal esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones anteriores/personalizadas pueden agregarlo manualmente con los comandos anteriores.
2. Inicia sesión (QR, en la máquina del Gateway):
   - `openclaw channels login --channel zalouser`
   - Escanea el código QR con la app móvil de Zalo.
3. Habilita el canal:

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

4. Reinicia el Gateway (o finaliza la configuración).
5. El acceso por DM usa emparejamiento de forma predeterminada; aprueba el código de emparejamiento en el primer contacto.

## Qué es

- Se ejecuta completamente dentro del proceso mediante `zca-js`.
- Usa escuchadores de eventos nativos para recibir mensajes entrantes.
- Envía respuestas directamente a través de la API de JS (texto/multimedia/enlace).
- Está diseñado para casos de uso de "cuenta personal" en los que la API de Zalo Bot no está disponible.

## Nomenclatura

El id de canal es `zalouser` para dejar explícito que esto automatiza una **cuenta personal de usuario de Zalo** (no oficial). Mantenemos `zalo` reservado para una posible integración futura con la API oficial de Zalo.

## Buscar IDs (directorio)

Usa la CLI de directorio para descubrir pares/grupos y sus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Límites

- El texto saliente se divide en fragmentos de ~2000 caracteres (límites del cliente de Zalo).
- El streaming está bloqueado de forma predeterminada.

## Control de acceso (DMs)

`channels.zalouser.dmPolicy` admite: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).

`channels.zalouser.allowFrom` debe usar IDs estables de usuarios de Zalo. También puede hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`). Durante la configuración interactiva, los nombres introducidos se pueden resolver a IDs usando la búsqueda de contactos dentro del proceso del Plugin.

Si un nombre sin procesar permanece en la configuración, el arranque lo resuelve solo cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado. Sin esa activación explícita, las comprobaciones de remitente en runtime usan solo IDs y los nombres sin procesar se ignoran para la autorización.

Aprueba mediante:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acceso a grupos (opcional)

- Predeterminado: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Usa `channels.defaults.groupPolicy` para sobrescribir el valor predeterminado cuando no esté definido.
- Restringir a una lista de permitidos con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (las claves deben ser IDs de grupo estables; los nombres se resuelven a IDs al arrancar solo cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado)
  - `channels.zalouser.groupAllowFrom` (controla qué remitentes de los grupos permitidos pueden activar el bot; los grupos estáticos de acceso de remitentes se pueden referenciar con `accessGroup:<name>`)
- Bloquear todos los grupos: `channels.zalouser.groupPolicy = "disabled"`.
- El asistente de configuración puede pedir listas de permitidos de grupos.
- Al arrancar, OpenClaw resuelve los nombres de grupos/usuarios en las listas de permitidos a IDs y registra el mapeo solo cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado.
- La coincidencia de listas de permitidos de grupos usa solo IDs de forma predeterminada. Los nombres no resueltos se ignoran para autenticación salvo que `channels.zalouser.dangerouslyAllowNameMatching: true` esté habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la resolución mutable de nombres al arrancar y la coincidencia de nombres de grupo en runtime.
- Si `groupAllowFrom` no está definido, runtime recurre a `allowFrom` para las comprobaciones de remitentes de grupos.
- Las comprobaciones de remitente se aplican tanto a mensajes normales de grupo como a comandos de control (por ejemplo, `/new`, `/reset`).

Ejemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Control por menciones en grupos

- `channels.zalouser.groups.<group>.requireMention` controla si las respuestas de grupo requieren una mención.
- Orden de resolución: id/nombre exacto del grupo -> slug normalizado del grupo -> `*` -> predeterminado (`true`).
- Esto se aplica tanto a grupos en lista de permitidos como al modo de grupo abierto.
- Citar un mensaje del bot cuenta como una mención implícita para la activación de grupo.
- Los comandos de control autorizados (por ejemplo, `/new`) pueden omitir el control por menciones.
- Cuando se omite un mensaje de grupo porque se requiere mención, OpenClaw lo almacena como historial de grupo pendiente y lo incluye en el siguiente mensaje de grupo procesado.
- El límite de historial de grupo usa de forma predeterminada `messages.groupChat.historyLimit` (fallback `50`). Puedes sobrescribirlo por cuenta con `channels.zalouser.historyLimit`.

Ejemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
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

El Plugin Zalo Personal también puede leer la selección de perfil desde variables de entorno:

- `ZALOUSER_PROFILE`: nombre de perfil que se usa cuando no se establece `profile` en la configuración del canal o de la cuenta.
- `ZCA_PROFILE`: nombre de perfil fallback heredado, usado solo cuando `ZALOUSER_PROFILE` no está establecido.

Los nombres de perfil seleccionan las credenciales guardadas de inicio de sesión de Zalo en el estado de OpenClaw. El orden de resolución es:

1. `profile` explícito en la configuración.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. El id de cuenta para cuentas no predeterminadas, o `default` para la cuenta predeterminada.

Para configuraciones con varias cuentas, prefiere establecer `profile` en cada cuenta en la configuración para que
una variable de entorno no haga que varias cuentas compartan la misma sesión
de inicio de sesión.

## Escritura, reacciones y acuses de entrega

- OpenClaw envía un evento de escritura antes de despachar una respuesta (con el mejor esfuerzo).
- La acción de reacción a mensajes `react` se admite para `zalouser` en acciones de canal.
  - Usa `remove: true` para eliminar un emoji de reacción específico de un mensaje.
  - Semántica de reacciones: [Reacciones](/es/tools/reactions)
- Para mensajes entrantes que incluyen metadatos de evento, OpenClaw envía acuses de entregado + visto (con el mejor esfuerzo).

## Solución de problemas

**El inicio de sesión no persiste:**

- `openclaw channels status --probe`
- Volver a iniciar sesión: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**El nombre de la lista de permitidos/grupo no se resolvió:**

- Usa IDs numéricos en `allowFrom`/`groupAllowFrom` e IDs de grupo estables en `groups`. Si necesitas intencionalmente nombres exactos de amigos/grupos, habilita `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Actualizaste desde una configuración antigua basada en CLI:**

- Elimina cualquier suposición antigua sobre un proceso externo `zca`.
- El canal ahora se ejecuta completamente en OpenClaw sin binarios CLI externos.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
