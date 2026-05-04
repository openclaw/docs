---
read_when:
    - Configuración de Zalo Personal para OpenClaw
    - Depuración del inicio de sesión o del flujo de mensajes de Zalo Personal
summary: Compatibilidad con cuentas personales de Zalo mediante zca-js nativo (inicio de sesión con QR), capacidades y configuración
title: Zalo personal
x-i18n:
    generated_at: "2026-05-04T18:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6d27f0ca502e6426abe21d609efd0a168a0b6b0fafe8d52d59f1a717da1ed5
    source_path: channels/zalouser.md
    workflow: 16
---

Estado: experimental. Esta integración automatiza una **cuenta personal de Zalo** mediante `zca-js` nativo dentro de OpenClaw.

<Warning>
Esta es una integración no oficial y puede provocar la suspensión o el bloqueo de la cuenta. Úsela bajo su propia responsabilidad.
</Warning>

## Plugin incluido

Zalo Personal se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación separada.

Si usa una compilación anterior o una instalación personalizada que excluye Zalo Personal, instale el paquete npm directamente:

- Instalar mediante la CLI: `openclaw plugins install @openclaw/zalouser`
- Versión fijada: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- O desde una copia local del código fuente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalles: [Plugins](/es/tools/plugin)

No se requiere ningún binario externo de la CLI `zca`/`openzca`.

## Configuración rápida (principiante)

1. Asegúrese de que el Plugin Zalo Personal esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones anteriores/personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Inicie sesión (QR, en la máquina del Gateway):
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
5. El acceso por MD usa emparejamiento de forma predeterminada; apruebe el código de emparejamiento en el primer contacto.

## Qué es

- Se ejecuta completamente dentro del proceso mediante `zca-js`.
- Usa escuchadores de eventos nativos para recibir mensajes entrantes.
- Envía respuestas directamente mediante la API de JS (texto/medios/enlace).
- Diseñado para casos de uso de “cuenta personal” en los que la API de Zalo Bot no está disponible.

## Nomenclatura

El id de canal es `zalouser` para dejar explícito que esto automatiza una **cuenta personal de usuario de Zalo** (no oficial). Mantenemos `zalo` reservado para una posible integración futura con la API oficial de Zalo.

## Buscar IDs (directorio)

Use la CLI de directorio para descubrir pares/grupos y sus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Límites

- El texto saliente se divide en fragmentos de ~2000 caracteres (límites del cliente de Zalo).
- El streaming está bloqueado de forma predeterminada.

## Control de acceso (MD)

`channels.zalouser.dmPolicy` admite: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).

`channels.zalouser.allowFrom` debe usar IDs de usuario de Zalo estables. Durante la configuración interactiva, los nombres introducidos pueden resolverse a IDs mediante la búsqueda de contactos en proceso del Plugin.

Si un nombre sin procesar permanece en la configuración, el arranque solo lo resuelve cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado. Sin esa aceptación explícita, las comprobaciones de remitente en tiempo de ejecución solo usan IDs y los nombres sin procesar se ignoran para la autorización.

Apruebe mediante:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acceso a grupos (opcional)

- Predeterminado: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Use `channels.defaults.groupPolicy` para sobrescribir el valor predeterminado cuando no esté definido.
- Restrinja a una lista de permitidos con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (las claves deben ser IDs de grupo estables; los nombres se resuelven a IDs al arrancar solo cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado)
  - `channels.zalouser.groupAllowFrom` (controla qué remitentes en grupos permitidos pueden activar el bot)
- Bloquear todos los grupos: `channels.zalouser.groupPolicy = "disabled"`.
- El asistente de configuración puede solicitar listas de permitidos para grupos.
- Al arrancar, OpenClaw resuelve los nombres de grupos/usuarios en listas de permitidos a IDs y registra la asignación solo cuando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado.
- La coincidencia de listas de permitidos de grupos usa solo IDs de forma predeterminada. Los nombres no resueltos se ignoran para la autenticación, salvo que `channels.zalouser.dangerouslyAllowNameMatching: true` esté habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la resolución de nombres mutable al arranque y la coincidencia de nombres de grupo en tiempo de ejecución.
- Si `groupAllowFrom` no está definido, el tiempo de ejecución recurre a `allowFrom` para las comprobaciones de remitente de grupo.
- Las comprobaciones de remitente se aplican tanto a mensajes de grupo normales como a comandos de control (por ejemplo `/new`, `/reset`).

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

### Control por mención en grupos

- `channels.zalouser.groups.<group>.requireMention` controla si las respuestas de grupo requieren una mención.
- Orden de resolución: id/nombre de grupo exacto -> slug de grupo normalizado -> `*` -> predeterminado (`true`).
- Esto se aplica tanto a grupos en la lista de permitidos como al modo de grupo abierto.
- Citar un mensaje del bot cuenta como una mención implícita para la activación en grupo.
- Los comandos de control autorizados (por ejemplo `/new`) pueden omitir el control por mención.
- Cuando se omite un mensaje de grupo porque se requiere mención, OpenClaw lo almacena como historial de grupo pendiente y lo incluye en el siguiente mensaje de grupo procesado.
- El límite de historial de grupo usa `messages.groupChat.historyLimit` de forma predeterminada (respaldo `50`). Puede sobrescribirlo por cuenta con `channels.zalouser.historyLimit`.

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

## Escritura, reacciones y confirmaciones de entrega

- OpenClaw envía un evento de escritura antes de despachar una respuesta (mejor esfuerzo).
- La acción de reacción a mensaje `react` es compatible con `zalouser` en acciones de canal.
  - Use `remove: true` para eliminar un emoji de reacción específico de un mensaje.
  - Semántica de reacciones: [Reacciones](/es/tools/reactions)
- Para los mensajes entrantes que incluyen metadatos de evento, OpenClaw envía confirmaciones de entregado + visto (mejor esfuerzo).

## Solución de problemas

**El inicio de sesión no se conserva:**

- `openclaw channels status --probe`
- Vuelva a iniciar sesión: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**La lista de permitidos/el nombre de grupo no se resolvió:**

- Use IDs numéricos en `allowFrom`/`groupAllowFrom` e IDs de grupo estables en `groups`. Si necesita intencionadamente nombres exactos de amigos/grupos, habilite `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Actualizado desde una configuración antigua basada en CLI:**

- Elimine cualquier suposición antigua sobre procesos externos `zca`.
- El canal ahora se ejecuta completamente en OpenClaw sin binarios externos de la CLI.

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
