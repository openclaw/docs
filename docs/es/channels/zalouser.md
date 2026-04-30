---
read_when:
    - Configurar Zalo Personal para OpenClaw
    - Depuración del inicio de sesión o del flujo de mensajes de Zalo Personal
summary: Compatibilidad con cuentas personales de Zalo mediante zca-js nativo (inicio de sesión con QR), capacidades y configuración
title: Zalo personal
x-i18n:
    generated_at: "2026-04-30T05:31:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

Estado: experimental. Esta integración automatiza una **cuenta personal de Zalo** mediante `zca-js` nativo dentro de OpenClaw.

<Warning>
Esta es una integración no oficial y puede provocar la suspensión o prohibición de la cuenta. Úsala bajo tu propio riesgo.
</Warning>

## Plugin incluido

Zalo Personal se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones
empaquetadas normales no necesitan una instalación separada.

Si usas una compilación antigua o una instalación personalizada que excluye Zalo Personal,
instala un paquete npm actual cuando se publique uno:

- Instalar mediante la CLI: `openclaw plugins install @openclaw/zalouser`
- O desde un checkout de código fuente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalles: [Plugins](/es/tools/plugin)

Si npm informa que el paquete propiedad de OpenClaw está obsoleto, usa una compilación
empaquetada actual de OpenClaw o la ruta de checkout local hasta que se publique
un paquete npm más nuevo.

No se requiere ningún binario de CLI externo `zca`/`openzca`.

## Configuración rápida (principiante)

1. Asegúrate de que el Plugin Zalo Personal esté disponible.
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

4. Reinicia el Gateway (o finaliza la configuración).
5. El acceso por DM usa emparejamiento de forma predeterminada; aprueba el código de emparejamiento en el primer contacto.

## Qué es

- Se ejecuta completamente dentro del proceso mediante `zca-js`.
- Usa escuchadores de eventos nativos para recibir mensajes entrantes.
- Envía respuestas directamente mediante la API de JS (texto/medios/enlace).
- Está diseñado para casos de uso de “cuenta personal” donde la API de Zalo Bot no está disponible.

## Nomenclatura

El id del canal es `zalouser` para dejar explícito que esto automatiza una **cuenta personal de usuario de Zalo** (no oficial). Mantenemos `zalo` reservado para una posible integración oficial futura con la API de Zalo.

## Encontrar IDs (directorio)

Usa la CLI de directorio para descubrir pares/grupos y sus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Límites

- El texto saliente se divide en fragmentos de ~2000 caracteres (límites del cliente de Zalo).
- El streaming está bloqueado de forma predeterminada.

## Control de acceso (DM)

`channels.zalouser.dmPolicy` admite: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).

`channels.zalouser.allowFrom` acepta IDs de usuario o nombres. Durante la configuración, los nombres se resuelven a IDs usando la búsqueda de contactos dentro del proceso del Plugin.

Aprueba mediante:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acceso a grupos (opcional)

- Predeterminado: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Usa `channels.defaults.groupPolicy` para sobrescribir el valor predeterminado cuando no esté definido.
- Restringe a una allowlist con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (las claves deben ser IDs de grupo estables; los nombres se resuelven a IDs al iniciar cuando es posible)
  - `channels.zalouser.groupAllowFrom` (controla qué remitentes en los grupos permitidos pueden activar el bot)
- Bloquea todos los grupos: `channels.zalouser.groupPolicy = "disabled"`.
- El asistente de configuración puede solicitar allowlists de grupos.
- Al iniciar, OpenClaw resuelve los nombres de grupos/usuarios en las allowlists a IDs y registra el mapeo.
- La coincidencia de allowlist de grupos se basa solo en ID de forma predeterminada. Los nombres sin resolver se ignoran para autenticación a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esté habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la coincidencia mutable por nombre de grupo.
- Si `groupAllowFrom` no está definido, en tiempo de ejecución se recurre a `allowFrom` para las comprobaciones de remitentes de grupo.
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

### Activación por mención en grupo

- `channels.zalouser.groups.<group>.requireMention` controla si las respuestas en grupo requieren una mención.
- Orden de resolución: id/nombre de grupo exacto -> slug de grupo normalizado -> `*` -> predeterminado (`true`).
- Esto se aplica tanto a grupos en allowlist como al modo de grupo abierto.
- Citar un mensaje del bot cuenta como una mención implícita para la activación en grupo.
- Los comandos de control autorizados (por ejemplo `/new`) pueden omitir la activación por mención.
- Cuando se omite un mensaje de grupo porque se requiere una mención, OpenClaw lo almacena como historial de grupo pendiente y lo incluye en el siguiente mensaje de grupo procesado.
- El límite de historial de grupo usa `messages.groupChat.historyLimit` de forma predeterminada (respaldo `50`). Puedes sobrescribirlo por cuenta con `channels.zalouser.historyLimit`.

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
- La acción de reacción a mensaje `react` es compatible con `zalouser` en las acciones de canal.
  - Usa `remove: true` para eliminar un emoji de reacción específico de un mensaje.
  - Semántica de reacciones: [Reacciones](/es/tools/reactions)
- Para mensajes entrantes que incluyen metadatos de evento, OpenClaw envía acuses de entregado + visto (mejor esfuerzo).

## Solución de problemas

**El inicio de sesión no persiste:**

- `openclaw channels status --probe`
- Vuelve a iniciar sesión: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**La allowlist/el nombre de grupo no se resolvió:**

- Usa IDs numéricos en `allowFrom`/`groupAllowFrom`/`groups`, o nombres exactos de amigos/grupos.

**Actualizado desde una configuración antigua basada en CLI:**

- Elimina cualquier suposición antigua sobre procesos externos `zca`.
- El canal ahora se ejecuta completamente en OpenClaw sin binarios de CLI externos.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat de grupo y activación por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
