---
read_when:
    - Configuración de Zalo Personal para OpenClaw
    - Depuración del inicio de sesión o del flujo de mensajes de Zalo Personal
summary: Soporte para cuentas personales de Zalo mediante zca-js nativo (inicio de sesión por QR), capacidades y configuración
title: Zalo personal
x-i18n:
    generated_at: "2026-07-05T11:07:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Estado: experimental. Esta integración automatiza una **cuenta personal de Zalo** mediante `zca-js` nativo, en proceso, sin ningún binario CLI externo.

<Warning>
Esta es una integración no oficial y puede provocar la suspensión o prohibición de la cuenta. Úsala bajo tu propio riesgo.
</Warning>

## Instalación

Zalo Personal es un plugin externo oficial, no incluido en el núcleo. Instálalo antes de usarlo:

```bash
openclaw plugins install @openclaw/zalouser
```

- Fijar una versión: `openclaw plugins install @openclaw/zalouser@<version>`
- Desde un checkout de código fuente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Instala el plugin (arriba).
2. Inicia sesión (QR, en la máquina del Gateway):
   - `openclaw channels login --channel zalouser`
   - Escanea el código QR con la aplicación móvil de Zalo.
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

4. Reinicia el Gateway (o termina la configuración).
5. El acceso por DM usa emparejamiento de forma predeterminada; aprueba el código de emparejamiento en el primer contacto.

## Qué es

- Se ejecuta completamente en proceso mediante la biblioteca `zca-js` (sin binario externo `zca`/`openzca`).
- Usa listeners de eventos nativos (`message`, `error`) para recibir mensajes entrantes.
- Envía respuestas directamente a través de la API de JS (texto/multimedia/enlace).
- Diseñado para casos de uso de "cuenta personal" en los que la API de Zalo Bot no está disponible.

## Nomenclatura

El id del canal es `zalouser` para dejar explícito que esto automatiza una **cuenta personal de usuario de Zalo** (no oficial). `zalo` está reservado para una posible integración futura con la API oficial de Zalo.

## Buscar IDs (directorio)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Límites

- El texto saliente se divide en fragmentos de 2000 caracteres (límite del cliente de Zalo).
- No se admite streaming.

## Control de acceso (DM)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).

`channels.zalouser.allowFrom` debe usar IDs de usuario de Zalo estables. También puede hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`). Durante la configuración interactiva, los nombres introducidos se pueden resolver a IDs usando la búsqueda de contactos en proceso del plugin.

Si un nombre sin procesar permanece en la configuración, el inicio lo resuelve solo cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado. Sin esa activación explícita, las comprobaciones de remitente en tiempo de ejecución son solo por ID y los nombres sin procesar se ignoran para la autorización.

Aprueba mediante:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acceso a grupos (opcional)

- Predeterminado: `channels.zalouser.groupPolicy = "allowlist"` (los grupos requieren una entrada explícita en la lista de permitidos).
- Abrir todos los grupos: `channels.zalouser.groupPolicy = "open"`.
- Bloquear todos los grupos: `channels.zalouser.groupPolicy = "disabled"`.
- Con `groupPolicy = "allowlist"`:
  - Las claves de `channels.zalouser.groups` deben ser IDs de grupo estables; los nombres se resuelven a IDs al iniciar solo cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado.
  - `channels.zalouser.groupAllowFrom` controla qué remitentes de los grupos permitidos pueden activar el bot; los grupos estáticos de acceso de remitentes se pueden referenciar con `accessGroup:<name>`.
- El asistente de configuración puede solicitar listas de permitidos de grupos.
- La coincidencia de la lista de permitidos de grupos es solo por ID de forma predeterminada. Los nombres no resueltos se ignoran para la autenticación salvo que `channels.zalouser.dangerouslyAllowNameMatching: true` esté habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la resolución mutable de nombres al iniciar y la coincidencia de nombres de grupo en tiempo de ejecución.
- `groupAllowFrom` **no** recurre a `allowFrom` para mensajes de grupo normales: dejarlo vacío en un grupo permitido abre ese grupo a cualquier remitente. Los comandos de control autorizados (por ejemplo `/new`) son la excepción; las comprobaciones del remitente del comando recurren a `allowFrom` cuando `groupAllowFrom` está vacío.

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
`channels.zalouser.groups.<id>.allow` es un nombre de campo heredado; la configuración actual usa `enabled`. `openclaw doctor --fix` migra `allow` a `enabled` automáticamente.
</Note>

### Control de menciones en grupos

- `channels.zalouser.groups.<group>.requireMention` controla si las respuestas de grupo requieren una mención.
- Orden de resolución: id de grupo -> alias `group:<id>` -> nombre/slug del grupo (los candidatos basados en nombre solo se aplican cuando `dangerouslyAllowNameMatching: true`) -> `*` -> predeterminado (`true`).
- Se aplica tanto a grupos permitidos como al modo de grupo abierto.
- Citar un mensaje del bot cuenta como una mención implícita para activar el grupo.
- Los comandos de control autorizados (por ejemplo `/new`) pueden omitir el control de menciones.
- Cuando se omite un mensaje de grupo porque se requiere una mención, OpenClaw lo almacena como historial de grupo pendiente y lo incluye en el siguiente mensaje de grupo procesado.
- Límite de historial de grupo: `channels.zalouser.historyLimit`, luego `messages.groupChat.historyLimit`, luego un valor alternativo de `50`.

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

La selección de perfil también puede venir de variables de entorno:

| Var                | Propósito                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Nombre de perfil que se usará cuando no se configure `profile` en el canal o la cuenta. |
| `ZCA_PROFILE`      | Alternativa heredada, usada solo cuando `ZALOUSER_PROFILE` no está configurada. |

Los nombres de perfil seleccionan las credenciales guardadas de inicio de sesión de Zalo en el estado de OpenClaw. Orden de resolución:

1. `profile` explícito en la configuración.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. El id de cuenta para cuentas no predeterminadas, o `default` para la cuenta predeterminada.

Para configuraciones de varias cuentas, prefiere establecer `profile` en cada cuenta dentro de la configuración para que una variable de entorno no haga que varias cuentas compartan la misma sesión de inicio de sesión.

## Escritura, reacciones y acuses de entrega

- OpenClaw envía un evento de escritura antes de despachar una respuesta (mejor esfuerzo).
- La acción de reacción de mensaje `react` se admite para `zalouser` en las acciones del canal.
  - Usa `remove: true` para quitar un emoji de reacción específico de un mensaje.
  - Semántica de reacciones: [Reacciones](/es/tools/reactions)
- Para mensajes entrantes que incluyen metadatos de evento, OpenClaw envía acuses de entregado + visto (mejor esfuerzo).

## Solución de problemas

**El inicio de sesión no se mantiene:**

- `openclaw channels status --probe`
- Volver a iniciar sesión: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**El nombre de la lista de permitidos/grupo no se resolvió:**

- Usa IDs numéricos en `allowFrom`/`groupAllowFrom` e IDs de grupo estables en `groups`. Si necesitas intencionalmente nombres exactos de amigos/grupos, habilita `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Actualizaste desde una configuración antigua basada en `zca`/CLI externo:**

- Elimina cualquier suposición sobre procesos externos `zca`; el canal ahora se ejecuta completamente en proceso mediante `zca-js`, sin binario CLI externo.

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) - autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento del chat de grupo y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo
