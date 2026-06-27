---
read_when:
    - Configuración específica de grupos de WhatsApp
    - Cambiar los modos de activación de WhatsApp (`mention` vs `always`)
    - Ajuste de claves de sesión de grupo de WhatsApp o contexto de mensajes pendientes
sidebarTitle: WhatsApp groups
summary: 'Manejo de mensajes de grupo de WhatsApp: activación, listas de permitidos, sesiones e inyección de contexto'
title: Mensajes de grupo de WhatsApp
x-i18n:
    generated_at: "2026-06-27T10:37:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

Para el modelo de grupos multicanal (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo), consulta [Grupos](/es/channels/groups). Esta página cubre el comportamiento específico de WhatsApp sobre ese modelo: activación, listas de permitidos de grupos, claves de sesión por grupo e inyección de contexto de mensajes pendientes.

Objetivo: permitir que OpenClaw esté en grupos de WhatsApp, se active solo cuando se le mencione y mantenga ese hilo separado de la sesión de mensaje directo personal.

<Note>
`agents.list[].groupChat.mentionPatterns` también lo usan Telegram, Discord, Slack e iMessage. Para configuraciones multiagente, defínelo por agente, o usa `messages.groupChat.mentionPatterns` como alternativa global.
</Note>

## Comportamiento

- Modos de activación: `mention` (predeterminado) o `always`. `mention` requiere una mención (menciones @ reales de WhatsApp mediante `mentionedJids`, patrones regex seguros, o el E.164 del bot en cualquier parte del texto). `always` activa el agente con cada mensaje, pero solo debería responder cuando pueda aportar valor significativo; de lo contrario, devuelve el token silencioso exacto `NO_REPLY` / `no_reply`. Los valores predeterminados se pueden definir en la configuración (`channels.whatsapp.groups`) y sobrescribir por grupo mediante `/activation`. Cuando `channels.whatsapp.groups` está definido, también actúa como lista de permitidos de grupos (incluye `"*"` para permitir todos).
- Política de grupos: `channels.whatsapp.groupPolicy` controla si se aceptan mensajes de grupo (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (alternativa: `channels.whatsapp.allowFrom` explícito). El valor predeterminado es `allowlist` (bloqueado hasta que agregues remitentes).
- Sesiones por grupo: las claves de sesión tienen la forma `agent:<agentId>:whatsapp:group:<jid>`, de modo que comandos como `/verbose on`, `/trace on` o `/think high` (enviados como mensajes independientes) quedan limitados a ese grupo; el estado del mensaje directo personal no se modifica. Los Heartbeat se omiten para hilos de grupo.
- Inyección de contexto: los mensajes de grupo **solo pendientes** (50 de forma predeterminada) que _no_ activaron una ejecución se anteponen bajo `[Chat messages since your last reply - for context]`, con la línea activadora bajo `[Current message - respond to this]`. Los mensajes que ya están en la sesión no se reinyectan.
- Exposición del remitente: ahora cada lote de grupo termina con `[from: Sender Name (+E164)]` para que OpenClaw sepa quién está hablando.
- Efímeros/ver una vez: los desempaquetamos antes de extraer texto/menciones, por lo que las menciones dentro de ellos igualmente activan.
- Prompt del sistema de grupo: en el primer turno de una sesión de grupo (y siempre que `/activation` cambie el modo) inyectamos un breve texto en el prompt del sistema como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Si los metadatos no están disponibles, igualmente le indicamos al agente que es un chat de grupo.

## Ejemplo de configuración (WhatsApp)

Agrega un bloque `groupChat` a `~/.openclaw/openclaw.json` para que las menciones por nombre visible funcionen incluso cuando WhatsApp elimina la `@` visual en el cuerpo del texto:

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

- Las regex no distinguen mayúsculas de minúsculas y usan las mismas protecciones de regex seguras que otras superficies de regex de configuración; los patrones no válidos y la repetición anidada insegura se ignoran.
- WhatsApp sigue enviando menciones canónicas mediante `mentionedJids` cuando alguien toca el contacto, por lo que la alternativa del número rara vez se necesita, pero es una red de seguridad útil.

### Comando de activación (solo propietario)

Usa el comando de chat de grupo:

- `/activation mention`
- `/activation always`

Solo el número del propietario (desde `channels.whatsapp.allowFrom`, o el E.164 propio del bot cuando no está definido) puede cambiar esto. Envía `/status` como mensaje independiente en el grupo para ver el modo de activación actual.

## Cómo usarlo

1. Agrega tu cuenta de WhatsApp (la que ejecuta OpenClaw) al grupo.
2. Di `@openclaw …` (o incluye el número). Solo los remitentes en la lista de permitidos pueden activarlo, salvo que definas `groupPolicy: "open"`.
3. El prompt del agente incluirá contexto reciente del grupo más el marcador final `[from: …]` para que pueda dirigirse a la persona correcta.
4. Las directivas de nivel de sesión (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) se aplican solo a la sesión de ese grupo; envíalas como mensajes independientes para que se registren. Tu sesión de mensaje directo personal permanece independiente.

## Pruebas / verificación

- Prueba manual básica:
  - Envía una mención `@openclaw` en el grupo y confirma una respuesta que haga referencia al nombre del remitente.
  - Envía una segunda mención y verifica que el bloque de historial se incluya y luego se borre en el siguiente turno.
- Revisa los registros del Gateway (ejecuta con `--verbose`) para ver entradas de `inbound web message` que muestran `from: <groupJid>` y el sufijo `[from: …]`.

## Consideraciones conocidas

- Los Heartbeat se omiten intencionalmente en grupos para evitar difusiones ruidosas.
- La supresión de eco usa la cadena combinada del lote; si envías texto idéntico dos veces sin menciones, solo el primero recibirá una respuesta.
- Las entradas del almacén de sesiones aparecerán como `agent:<agentId>:whatsapp:group:<jid>` en el almacén de sesiones (`~/.openclaw/agents/<agentId>/sessions/sessions.json` de forma predeterminada); una entrada ausente solo significa que el grupo aún no ha activado una ejecución.
- Los indicadores de escritura en grupos siguen `agents.defaults.typingMode`. Cuando las respuestas visibles se habilitan en modo solo herramienta de mensajes, la escritura comienza de inmediato de forma predeterminada para que los miembros del grupo puedan ver que el agente está trabajando aunque no se publique una respuesta final automática. La configuración explícita del modo de escritura sigue teniendo prioridad.

## Relacionado

- [Grupos](/es/channels/groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos de difusión](/es/channels/broadcast-groups)
