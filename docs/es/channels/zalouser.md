---
read_when:
    - Configurar Zalo Personal para OpenClaw
    - Depurar el inicio de sesión o el flujo de mensajes de Zalo Personal
summary: Compatibilidad con cuentas personales de Zalo mediante `zca-js` nativo (inicio de sesión por QR), capacidades y configuración
title: Zalo personal
x-i18n:
    generated_at: "2026-04-24T05:21:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (no oficial)

Estado: experimental. Esta integración automatiza una **cuenta personal de Zalo** mediante `zca-js` nativo dentro de OpenClaw.

> **Advertencia:** Esta es una integración no oficial y puede provocar la suspensión o el bloqueo de la cuenta. Úsala bajo tu propia responsabilidad.

## Plugin incluido

Zalo Personal se incluye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación independiente.

Si estás usando una compilación anterior o una instalación personalizada que excluye Zalo Personal,
instálalo manualmente:

- Instalar mediante la CLI: `openclaw plugins install @openclaw/zalouser`
- O desde una copia del código fuente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalles: [Plugins](/es/tools/plugin)

No se requiere ningún binario de CLI externo `zca`/`openzca`.

## Configuración rápida (principiante)

1. Asegúrate de que el Plugin de Zalo Personal esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden añadirlo manualmente con los comandos anteriores.
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
5. El acceso por mensaje directo usa `pairing` de forma predeterminada; aprueba el código de vinculación en el primer contacto.

## Qué es

- Se ejecuta completamente dentro del proceso mediante `zca-js`.
- Usa listeners de eventos nativos para recibir mensajes entrantes.
- Envía respuestas directamente mediante la API de JS (texto/multimedia/enlace).
- Está diseñado para casos de uso de “cuenta personal” donde la API de bots de Zalo no está disponible.

## Nomenclatura

El id del canal es `zalouser` para dejar claro que esto automatiza una **cuenta de usuario personal de Zalo** (no oficial). Mantenemos `zalo` reservado para una posible integración oficial futura con la API de Zalo.

## Buscar ID (directorio)

Usa la CLI del directorio para descubrir pares/grupos y sus ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Límites

- El texto saliente se divide en fragmentos de aproximadamente 2000 caracteres (límites del cliente de Zalo).
- El streaming está bloqueado de forma predeterminada.

## Control de acceso (mensajes directos)

`channels.zalouser.dmPolicy` admite: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).

`channels.zalouser.allowFrom` acepta ID de usuario o nombres. Durante la configuración, los nombres se resuelven a ID usando la búsqueda de contactos dentro del proceso del Plugin.

Aprobar mediante:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acceso a grupos (opcional)

- Predeterminado: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Usa `channels.defaults.groupPolicy` para anular el valor predeterminado cuando no esté establecido.
- Restringe a una lista de permitidos con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (las claves deben ser ID de grupo estables; los nombres se resuelven a ID al iniciar cuando es posible)
  - `channels.zalouser.groupAllowFrom` (controla qué remitentes de los grupos permitidos pueden activar el bot)
- Bloquea todos los grupos: `channels.zalouser.groupPolicy = "disabled"`.
- El asistente de configuración puede pedir listas de permitidos para grupos.
- Al iniciar, OpenClaw resuelve los nombres de grupo/usuario en las listas de permitidos a ID y registra la correspondencia.
- La coincidencia de la lista de permitidos de grupos usa solo ID de forma predeterminada. Los nombres no resueltos se ignoran para la autenticación a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esté habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la coincidencia con nombres de grupo mutables.
- Si `groupAllowFrom` no está establecido, el entorno de ejecución usa `allowFrom` como alternativa para las comprobaciones de remitentes de grupo.
- Las comprobaciones de remitente se aplican tanto a los mensajes normales de grupo como a los comandos de control (por ejemplo, `/new`, `/reset`).

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

- `channels.zalouser.groups.<group>.requireMention` controla si las respuestas en grupo requieren una mención.
- Orden de resolución: id/nombre exacto del grupo -> slug normalizado del grupo -> `*` -> predeterminado (`true`).
- Esto se aplica tanto a los grupos de la lista de permitidos como al modo de grupo abierto.
- Citar un mensaje del bot cuenta como una mención implícita para la activación del grupo.
- Los comandos de control autorizados (por ejemplo, `/new`) pueden omitir el control por mención.
- Cuando se omite un mensaje de grupo porque se requiere mención, OpenClaw lo almacena como historial de grupo pendiente y lo incluye en el siguiente mensaje de grupo procesado.
- El límite del historial de grupo usa `messages.groupChat.historyLimit` de forma predeterminada (alternativa `50`). Puedes anularlo por cuenta con `channels.zalouser.historyLimit`.

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

## Escritura, reacciones y acuses de recibo de entrega

- OpenClaw envía un evento de escritura antes de despachar una respuesta (best-effort).
- La acción de reacción a mensajes `react` es compatible con `zalouser` en las acciones de canal.
  - Usa `remove: true` para eliminar un emoji de reacción específico de un mensaje.
  - Semántica de reacciones: [Reacciones](/es/tools/reactions)
- Para los mensajes entrantes que incluyan metadatos del evento, OpenClaw envía acuses de recibo de entregado + visto (best-effort).

## Solución de problemas

**El inicio de sesión no se mantiene:**

- `openclaw channels status --probe`
- Vuelve a iniciar sesión: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**No se resolvió el nombre de la lista de permitidos/grupo:**

- Usa ID numéricos en `allowFrom`/`groupAllowFrom`/`groups`, o nombres exactos de amigo/grupo.

**Actualizaste desde la configuración antigua basada en CLI:**

- Elimina cualquier suposición antigua sobre procesos externos de `zca`.
- El canal ahora se ejecuta completamente dentro de OpenClaw sin binarios de CLI externos.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Vinculación](/es/channels/pairing) — autenticación por mensaje directo y flujo de vinculación
- [Grupos](/es/channels/groups) — comportamiento de los chats de grupo y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
