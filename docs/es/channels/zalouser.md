---
read_when:
    - Configurar Zalo Personal para OpenClaw
    - Depuración del inicio de sesión o del flujo de mensajes de Zalo Personal
summary: Compatibilidad con cuentas personales de Zalo mediante zca-js nativo (inicio de sesión con QR), capacidades y configuración
title: Zalo personal
x-i18n:
    generated_at: "2026-05-11T20:22:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

Estado: experimental. Esta integración automatiza una **cuenta personal de Zalo** mediante `zca-js` nativo dentro de OpenClaw.

<Warning>
Esta es una integración no oficial y puede provocar la suspensión o prohibición de la cuenta. Úsala bajo tu propio riesgo.
</Warning>

## Plugin incluido

Zalo Personal se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación separada.

Si estás usando una compilación anterior o una instalación personalizada que excluye Zalo Personal, instala el paquete npm directamente:

- Instalar mediante CLI: `openclaw plugins install @openclaw/zalouser`
- Versión fijada: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- O desde un checkout de código fuente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalles: [Plugins](/es/tools/plugin)

No se requiere ningún binario externo de CLI `zca`/`openzca`.

## Configuración rápida (principiantes)

1. Asegúrate de que el Plugin Zalo Personal esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones anteriores/personalizadas pueden añadirlo manualmente con los comandos anteriores.
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

4. Reinicia el Gateway (o finaliza la configuración).
5. El acceso por DM usa emparejamiento de forma predeterminada; aprueba el código de emparejamiento en el primer contacto.

## Qué es

- Se ejecuta completamente dentro del proceso mediante `zca-js`.
- Usa escuchadores de eventos nativos para recibir mensajes entrantes.
- Envía respuestas directamente mediante la API de JS (texto/medios/enlace).
- Está diseñado para casos de uso de "cuenta personal" en los que la API de Zalo Bot no está disponible.

## Nomenclatura

El id de canal es `zalouser` para dejar explícito que esto automatiza una **cuenta de usuario personal de Zalo** (no oficial). Reservamos `zalo` para una posible integración futura con la API oficial de Zalo.

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

`channels.zalouser.allowFrom` debe usar IDs estables de usuarios de Zalo. También puede hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`). Durante la configuración interactiva, los nombres introducidos pueden resolverse a IDs usando la búsqueda de contactos dentro del proceso del Plugin.

Si un nombre sin procesar permanece en la configuración, el arranque lo resuelve solo cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado. Sin esa aceptación explícita, las comprobaciones de remitente en tiempo de ejecución son solo por ID y los nombres sin procesar se ignoran para la autorización.

Aprueba mediante:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acceso a grupos (opcional)

- Predeterminado: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Usa `channels.defaults.groupPolicy` para anular el valor predeterminado cuando no esté definido.
- Restringe a una allowlist con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (las claves deben ser IDs de grupo estables; los nombres se resuelven a IDs al arrancar solo cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado)
  - `channels.zalouser.groupAllowFrom` (controla qué remitentes en grupos permitidos pueden activar el bot; se puede hacer referencia a grupos estáticos de acceso de remitentes con `accessGroup:<name>`)
- Bloquear todos los grupos: `channels.zalouser.groupPolicy = "disabled"`.
- El asistente de configuración puede solicitar allowlists de grupos.
- Al arrancar, OpenClaw resuelve los nombres de grupos/usuarios en las allowlists a IDs y registra el mapeo solo cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado.
- La coincidencia de allowlist de grupos es solo por ID de forma predeterminada. Los nombres no resueltos se ignoran para la autenticación salvo que `channels.zalouser.dangerouslyAllowNameMatching: true` esté habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la resolución mutable de nombres al arrancar y la coincidencia de nombres de grupos en tiempo de ejecución.
- Si `groupAllowFrom` no está definido, el tiempo de ejecución recurre a `allowFrom` para las comprobaciones de remitentes de grupo.
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

### Control de menciones en grupos

- `channels.zalouser.groups.<group>.requireMention` controla si las respuestas de grupo requieren una mención.
- Orden de resolución: id/nombre exacto de grupo -> slug de grupo normalizado -> `*` -> predeterminado (`true`).
- Esto se aplica tanto a grupos en allowlist como al modo de grupo abierto.
- Citar un mensaje del bot cuenta como una mención implícita para la activación en grupo.
- Los comandos de control autorizados (por ejemplo, `/new`) pueden omitir el control de menciones.
- Cuando se omite un mensaje de grupo porque se requiere una mención, OpenClaw lo almacena como historial de grupo pendiente y lo incluye en el siguiente mensaje de grupo procesado.
- El límite del historial de grupo usa `messages.groupChat.historyLimit` de forma predeterminada (fallback `50`). Puedes anularlo por cuenta con `channels.zalouser.historyLimit`.

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

## Escritura, reacciones y acuses de entrega

- OpenClaw envía un evento de escritura antes de despachar una respuesta (mejor esfuerzo).
- La acción de reacción a mensajes `react` es compatible con `zalouser` en las acciones de canal.
  - Usa `remove: true` para quitar un emoji de reacción específico de un mensaje.
  - Semántica de las reacciones: [Reacciones](/es/tools/reactions)
- Para mensajes entrantes que incluyen metadatos de eventos, OpenClaw envía acuses de entregado + visto (mejor esfuerzo).

## Solución de problemas

**El inicio de sesión no persiste:**

- `openclaw channels status --probe`
- Volver a iniciar sesión: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**El nombre de allowlist/grupo no se resolvió:**

- Usa IDs numéricos en `allowFrom`/`groupAllowFrom` e IDs de grupo estables en `groups`. Si necesitas intencionadamente nombres exactos de amigos/grupos, habilita `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Actualizado desde la configuración antigua basada en CLI:**

- Elimina cualquier suposición antigua sobre procesos externos `zca`.
- Ahora el canal se ejecuta por completo en OpenClaw sin binarios externos de CLI.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
