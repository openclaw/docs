---
read_when:
    - Configurar grupos de WhatsApp específicamente
    - Cambiar los modos de activación de WhatsApp (`mention` vs `always`)
    - Ajustar las claves de sesión de grupos de WhatsApp o el contexto de mensajes pendientes
sidebarTitle: WhatsApp groups
summary: Manejo de mensajes de grupos de WhatsApp — activación, listas de permitidos, sesiones e inyección de contexto
title: Mensajes de grupo de WhatsApp
x-i18n:
    generated_at: "2026-07-05T11:02:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdc16719e33ed5532e9bc11b195fa1b2d79910ae476d8201adcc9507bbfa1b29
    source_path: channels/group-messages.md
    workflow: 16
---

Para el modelo de grupos multicanal (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo), consulta [Grupos](/es/channels/groups). Esta página cubre el comportamiento específico de WhatsApp sobre ese modelo: activación, listas de permitidos de grupos, claves de sesión por grupo e inyección de contexto de mensajes pendientes.

Objetivo: permitir que OpenClaw esté en grupos de WhatsApp, se active solo cuando se le mencione y mantenga ese hilo separado de la sesión personal de DM.

<Note>
`agents.list[].groupChat.mentionPatterns` se comparte con la activación por mención de los otros canales. Para configuraciones multiagente, configúralo por agente, o usa `messages.groupChat.mentionPatterns` como alternativa global. Si no se configura ninguno, los patrones se derivan del nombre/emoji de identidad del agente.
</Note>

## Comportamiento

- Modos de activación: `mention` (predeterminado) o `always`. `mention` requiere una mención: una @-mención real de WhatsApp (`mentionedJids`), un patrón regex configurado, los dígitos E.164 del bot en cualquier parte del texto o una respuesta citada a uno de los mensajes del bot (excepto en configuraciones de chat consigo mismo con número compartido). `always` activa el agente con cada mensaje, pero el prompt de grupo inyectado le indica que responda solo cuando aporte valor y que devuelva el token silencioso exacto `NO_REPLY` (sin distinguir mayúsculas/minúsculas) en caso contrario. Los valores predeterminados vienen de la configuración (`channels.whatsapp.groups` `requireMention`) y se pueden sobrescribir por grupo mediante `/activation`.
- Lista de permitidos de grupos: cuando `channels.whatsapp.groups` está configurado, solo se admiten los JID de grupo listados (incluye `"*"` para permitir todos); los mensajes de grupos no listados se descartan con una pista en el registro.
- Política de grupos: `channels.whatsapp.groupPolicy` controla si se aceptan mensajes de grupo (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (alternativa: `channels.whatsapp.allowFrom` explícito). El valor predeterminado es `allowlist` (bloqueado hasta que agregues remitentes).
- Sesiones por grupo: las claves de sesión tienen la forma `agent:<agentId>:whatsapp:group:<jid>` (las cuentas no predeterminadas agregan `:thread:whatsapp-account-<accountId>`), por lo que directivas como `/verbose on`, `/trace on` o `/think high` (enviadas como mensajes independientes) quedan acotadas a ese grupo; el estado de DM personal no se toca.
- Inyección de contexto: los mensajes de grupo **solo pendientes** (50 de forma predeterminada) que _no_ activaron una ejecución se anteponen bajo `[Chat messages since your last reply - for context]`, con la línea desencadenante bajo `[Current message - respond to this]`. La ventana de pendientes se borra después de la ejecución; los mensajes que ya están en la sesión no se reinyectan.
- Atribución del remitente: cada línea del grupo incluye la etiqueta del remitente dentro del sobre del mensaje, por ejemplo, `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): texto`, y la identidad del remitente junto con el asunto/miembros del grupo viajan en el bloque de metadatos de conversación no confiable.
- Efímeros/ver una vez: los envoltorios se desenvuelven antes de extraer texto/menciones, por lo que las menciones dentro de ellos igualmente activan.
- Prompt de sistema de grupo: el primer turno de una sesión de grupo (y cualquier turno después de que `/activation` cambie el modo) inyecta guía de activación en el prompt de sistema (`Activation: trigger-only ...` o `Activation: always-on ...`, más "address the specific sender"). La guía persistente de entrega de chat grupal ("You are in a WhatsApp group chat...") siempre se incluye.

## Ejemplo de configuración (WhatsApp)

Haz que las menciones por nombre visible funcionen incluso cuando WhatsApp quite el `@` visual del cuerpo del texto:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // pending group context window (default 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Notas:

- Las regex no distinguen mayúsculas/minúsculas y usan las mismas protecciones de regex segura que otras superficies de regex de configuración; se ignoran los patrones no válidos y la repetición anidada insegura.
- WhatsApp aún envía menciones canónicas mediante `mentionedJids` cuando alguien toca el contacto, por lo que la alternativa con número rara vez es necesaria, pero es una red de seguridad útil.
- La ventana de contexto pendiente se resuelve como `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Comando de activación (solo propietario)

Usa el comando de chat grupal:

- `/activation mention`
- `/activation always`

Solo los números propietarios (desde `channels.whatsapp.allowFrom`, o el E.164 propio del bot cuando no está configurado) pueden cambiar esto; `/activation` de cualquier otra persona se ignora y se almacena solo como contexto. Envía `/status` como mensaje independiente en el grupo para ver el modo de activación actual.

## Cómo usarlo

1. Agrega tu cuenta de WhatsApp (la que ejecuta OpenClaw) al grupo.
2. Di `@openclaw ...` (o incluye el número). Solo los remitentes en la lista de permitidos pueden activarlo, a menos que configures `groupPolicy: "open"`.
3. El prompt del agente incluye el contexto pendiente del grupo más líneas etiquetadas por remitente para que pueda dirigirse a la persona correcta.
4. Las directivas de sesión (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) se aplican solo a la sesión de ese grupo; envíalas como mensajes independientes para que se registren. Tu sesión personal de DM permanece independiente.

## Pruebas / verificación

- Smoke manual:
  - Envía una mención `@openclaw` en el grupo y confirma una respuesta que haga referencia al nombre del remitente.
  - Envía una segunda mención y verifica que el bloque de historial se incluya y luego se borre en el siguiente turno.
- Revisa los registros del Gateway (ejecuta con `--verbose`) para ver entradas `inbound web message` que muestren `from: <groupJid>` y el cuerpo etiquetado por remitente.

## Consideraciones conocidas

- Los Heartbeats se ejecutan en la sesión principal del agente; las sesiones de grupo nunca reciben ejecuciones de Heartbeat.
- La supresión de eco recuerda el prompt combinado (historial + mensaje actual) por sesión para que los mensajes entregados por el propio bot no lo reactiven; un lote repetido idéntico puede omitirse como eco.
- Las entradas del almacén de sesiones aparecen como `agent:<agentId>:whatsapp:group:<jid>` en el almacén de sesiones (`~/.openclaw/agents/<agentId>/sessions/sessions.json` de forma predeterminada); que falte una entrada solo significa que el grupo aún no ha activado una ejecución.
- Los indicadores de escritura siguen `session.typingMode` / `agents.defaults.typingMode`. Cuando se opta por respuestas visibles en modo solo herramienta de mensajes, la escritura comienza inmediatamente de forma predeterminada para que los miembros del grupo puedan ver que el agente está trabajando aunque no se publique ninguna respuesta final automática. La configuración explícita del modo de escritura sigue teniendo prioridad.

## Relacionado

- [Grupos](/es/channels/groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos de difusión](/es/channels/broadcast-groups)
