---
read_when:
    - Cambiar las reglas de mensajes de grupo o las menciones
summary: Comportamiento y configuración para el manejo de mensajes de grupo de WhatsApp (mentionPatterns se comparten entre superficies)
title: Mensajes de grupo
x-i18n:
    generated_at: "2026-04-30T05:28:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Objetivo: permitir que Clawd esté en grupos de WhatsApp, se active solo cuando se le mencione y mantenga ese hilo separado de la sesión personal de mensajes directos.

<Note>
`agents.list[].groupChat.mentionPatterns` también lo usan Telegram, Discord, Slack e iMessage. Este documento se centra en el comportamiento específico de WhatsApp. Para configuraciones multiagente, define `agents.list[].groupChat.mentionPatterns` por agente, o usa `messages.groupChat.mentionPatterns` como respaldo global.
</Note>

## Implementación actual (2025-12-03)

- Modos de activación: `mention` (predeterminado) o `always`. `mention` requiere una mención (menciones @ reales de WhatsApp mediante `mentionedJids`, patrones regex seguros o el E.164 del bot en cualquier parte del texto). `always` activa el agente en cada mensaje, pero solo debería responder cuando pueda aportar valor significativo; de lo contrario, devuelve el token silencioso exacto `NO_REPLY` / `no_reply`. Los valores predeterminados se pueden definir en la configuración (`channels.whatsapp.groups`) y sobrescribir por grupo mediante `/activation`. Cuando `channels.whatsapp.groups` está definido, también actúa como lista de permitidos de grupos (incluye `"*"` para permitir todos).
- Política de grupos: `channels.whatsapp.groupPolicy` controla si se aceptan mensajes de grupo (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (respaldo: `channels.whatsapp.allowFrom` explícito). El valor predeterminado es `allowlist` (bloqueado hasta que añadas remitentes).
- Sesiones por grupo: las claves de sesión se ven como `agent:<agentId>:whatsapp:group:<jid>`, por lo que comandos como `/verbose on`, `/trace on` o `/think high` (enviados como mensajes independientes) quedan acotados a ese grupo; el estado personal de mensajes directos no se toca. Los Heartbeat se omiten en los hilos de grupo.
- Inyección de contexto: los mensajes de grupo **solo pendientes** (50 de forma predeterminada) que _no_ activaron una ejecución se anteponen bajo `[Chat messages since your last reply - for context]`, con la línea activadora bajo `[Current message - respond to this]`. Los mensajes que ya están en la sesión no se vuelven a inyectar.
- Exposición del remitente: cada lote de grupo ahora termina con `[from: Sender Name (+E164)]` para que Pi sepa quién está hablando.
- Efímeros/ver una vez: los desenvolvemos antes de extraer texto/menciones, por lo que las menciones dentro de ellos siguen activando.
- Prompt de sistema de grupo: en el primer turno de una sesión de grupo (y siempre que `/activation` cambie el modo) inyectamos un texto breve en el prompt de sistema como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Si los metadatos no están disponibles, aun así le decimos al agente que es un chat de grupo.

## Ejemplo de configuración (WhatsApp)

Añade un bloque `groupChat` a `~/.openclaw/openclaw.json` para que las menciones por nombre visible funcionen incluso cuando WhatsApp elimina el `@` visual del cuerpo del texto:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Notas:

- Las regex no distinguen mayúsculas/minúsculas y usan las mismas protecciones de regex seguras que otras superficies de regex de configuración; los patrones no válidos y la repetición anidada insegura se ignoran.
- WhatsApp sigue enviando menciones canónicas mediante `mentionedJids` cuando alguien toca el contacto, por lo que el respaldo por número rara vez es necesario, pero es una red de seguridad útil.

### Comando de activación (solo propietario)

Usa el comando del chat de grupo:

- `/activation mention`
- `/activation always`

Solo el número del propietario (desde `channels.whatsapp.allowFrom`, o el E.164 propio del bot si no está definido) puede cambiar esto. Envía `/status` como mensaje independiente en el grupo para ver el modo de activación actual.

## Cómo usarlo

1. Añade tu cuenta de WhatsApp (la que ejecuta OpenClaw) al grupo.
2. Di `@openclaw …` (o incluye el número). Solo los remitentes en la lista de permitidos pueden activarlo, a menos que definas `groupPolicy: "open"`.
3. El prompt del agente incluirá el contexto reciente del grupo más el marcador final `[from: …]` para que pueda dirigirse a la persona correcta.
4. Las directivas de nivel de sesión (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) se aplican solo a la sesión de ese grupo; envíalas como mensajes independientes para que se registren. Tu sesión personal de mensajes directos permanece independiente.

## Pruebas / verificación

- Smoke manual:
  - Envía una mención `@openclaw` en el grupo y confirma una respuesta que haga referencia al nombre del remitente.
  - Envía una segunda mención y verifica que el bloque de historial se incluya y luego se borre en el siguiente turno.
- Revisa los registros del Gateway (ejecutado con `--verbose`) para ver entradas `inbound web message` que muestran `from: <groupJid>` y el sufijo `[from: …]`.

## Consideraciones conocidas

- Los Heartbeat se omiten intencionalmente en grupos para evitar transmisiones ruidosas.
- La supresión de eco usa la cadena combinada del lote; si envías texto idéntico dos veces sin menciones, solo el primero recibirá una respuesta.
- Las entradas del almacén de sesiones aparecerán como `agent:<agentId>:whatsapp:group:<jid>` en el almacén de sesiones (`~/.openclaw/agents/<agentId>/sessions/sessions.json` de forma predeterminada); que falte una entrada solo significa que el grupo aún no ha activado una ejecución.
- Los indicadores de escritura en grupos siguen `agents.defaults.typingMode`. Cuando las respuestas visibles usan el modo predeterminado solo mediante herramienta de mensajes, la escritura empieza inmediatamente de forma predeterminada para que los miembros del grupo puedan ver que el agente está trabajando aunque no se publique ninguna respuesta final automática. La configuración explícita del modo de escritura sigue teniendo prioridad.

## Relacionado

- [Grupos](/es/channels/groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos de difusión](/es/channels/broadcast-groups)
