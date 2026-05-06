---
read_when:
    - Configurar grupos de WhatsApp específicamente
    - Cambiar los modos de activación de WhatsApp (`mention` vs `always`)
    - Ajustar las claves de sesión de grupos de WhatsApp o el contexto de mensajes pendientes
sidebarTitle: WhatsApp groups
summary: Gestión de mensajes de grupo de WhatsApp — activación, listas de permitidos, sesiones e inyección de contexto
title: Mensajes de grupo de WhatsApp
x-i18n:
    generated_at: "2026-05-06T05:26:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 489f04ea9f4d0954f77eee4590d609383d5dc987eaaea5eb121b454620a2d0fe
    source_path: channels/group-messages.md
    workflow: 16
---

Para el modelo de grupos multicanal (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo), consulta [Grupos](/es/channels/groups). Esta página cubre el comportamiento específico de WhatsApp sobre ese modelo: activación, listas de permitidos de grupos, claves de sesión por grupo e inyección de contexto de mensajes pendientes.

Objetivo: permitir que OpenClaw esté en grupos de WhatsApp, se despierte solo cuando se le mencione y mantenga ese hilo separado de la sesión de MD personal.

<Note>
`agents.list[].groupChat.mentionPatterns` también lo usan Telegram, Discord, Slack e iMessage. Para configuraciones multiagente, configúralo por agente o usa `messages.groupChat.mentionPatterns` como alternativa global.
</Note>

## Comportamiento

- Modos de activación: `mention` (predeterminado) o `always`. `mention` requiere una mención (menciones @ reales de WhatsApp mediante `mentionedJids`, patrones regex seguros o el E.164 del bot en cualquier parte del texto). `always` despierta al agente con cada mensaje, pero solo debe responder cuando pueda aportar valor significativo; de lo contrario, devuelve el token silencioso exacto `NO_REPLY` / `no_reply`. Los valores predeterminados pueden configurarse en la configuración (`channels.whatsapp.groups`) y sobrescribirse por grupo mediante `/activation`. Cuando `channels.whatsapp.groups` está configurado, también actúa como lista de permitidos de grupos (incluye `"*"` para permitir todos).
- Política de grupos: `channels.whatsapp.groupPolicy` controla si se aceptan mensajes de grupo (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (alternativa: `channels.whatsapp.allowFrom` explícito). El valor predeterminado es `allowlist` (bloqueado hasta que agregues remitentes).
- Sesiones por grupo: las claves de sesión tienen el formato `agent:<agentId>:whatsapp:group:<jid>`, por lo que comandos como `/verbose on`, `/trace on` o `/think high` (enviados como mensajes independientes) quedan limitados a ese grupo; el estado de MD personal no se toca. Los Heartbeats se omiten para los hilos de grupo.
- Inyección de contexto: los mensajes de grupo **solo pendientes** (50 de forma predeterminada) que _no_ desencadenaron una ejecución se anteponen bajo `[Chat messages since your last reply - for context]`, con la línea desencadenante bajo `[Current message - respond to this]`. Los mensajes que ya están en la sesión no se vuelven a inyectar.
- Exposición del remitente: cada lote de grupo ahora termina con `[from: Sender Name (+E164)]` para que Pi sepa quién está hablando.
- Efímeros/ver una vez: los desempaquetamos antes de extraer texto/menciones, por lo que las menciones dentro de ellos siguen desencadenando la activación.
- Prompt de sistema de grupo: en el primer turno de una sesión de grupo (y siempre que `/activation` cambia el modo) inyectamos un texto breve en el prompt de sistema como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Si los metadatos no están disponibles, aun así le decimos al agente que es un chat de grupo.

## Ejemplo de configuración (WhatsApp)

Agrega un bloque `groupChat` a `~/.openclaw/openclaw.json` para que las menciones por nombre visible funcionen incluso cuando WhatsApp elimina el `@` visual del cuerpo del texto:

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

- Las regex no distinguen mayúsculas de minúsculas y usan las mismas protecciones de regex segura que otras superficies de regex de configuración; los patrones no válidos y la repetición anidada insegura se ignoran.
- WhatsApp sigue enviando menciones canónicas mediante `mentionedJids` cuando alguien toca el contacto, por lo que la alternativa del número rara vez es necesaria, pero es una red de seguridad útil.

### Comando de activación (solo propietario)

Usa el comando del chat de grupo:

- `/activation mention`
- `/activation always`

Solo el número del propietario (desde `channels.whatsapp.allowFrom`, o el E.164 propio del bot cuando no está configurado) puede cambiar esto. Envía `/status` como mensaje independiente en el grupo para ver el modo de activación actual.

## Cómo usarlo

1. Agrega tu cuenta de WhatsApp (la que ejecuta OpenClaw) al grupo.
2. Di `@openclaw …` (o incluye el número). Solo los remitentes permitidos pueden desencadenarlo, a menos que configures `groupPolicy: "open"`.
3. El prompt del agente incluirá contexto reciente del grupo más el marcador final `[from: …]` para que pueda dirigirse a la persona correcta.
4. Las directivas a nivel de sesión (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) se aplican solo a la sesión de ese grupo; envíalas como mensajes independientes para que se registren. Tu sesión de MD personal permanece independiente.

## Pruebas / verificación

- Smoke manual:
  - Envía una mención `@openclaw` en el grupo y confirma una respuesta que haga referencia al nombre del remitente.
  - Envía una segunda mención y verifica que el bloque de historial se incluya y luego se borre en el siguiente turno.
- Revisa los registros del Gateway (ejecútalo con `--verbose`) para ver entradas `inbound web message` que muestren `from: <groupJid>` y el sufijo `[from: …]`.

## Consideraciones conocidas

- Los Heartbeats se omiten intencionalmente para grupos para evitar difusiones ruidosas.
- La supresión de eco usa la cadena combinada del lote; si envías texto idéntico dos veces sin menciones, solo el primero recibirá respuesta.
- Las entradas del almacén de sesiones aparecerán como `agent:<agentId>:whatsapp:group:<jid>` en el almacén de sesiones (`~/.openclaw/agents/<agentId>/sessions/sessions.json` de forma predeterminada); una entrada ausente solo significa que el grupo todavía no ha desencadenado una ejecución.
- Los indicadores de escritura en grupos siguen `agents.defaults.typingMode`. Cuando las respuestas visibles usan el modo predeterminado solo de herramienta de mensajes, la escritura empieza inmediatamente de forma predeterminada para que los miembros del grupo puedan ver que el agente está trabajando, incluso si no se publica una respuesta final automática. La configuración explícita del modo de escritura sigue teniendo prioridad.

## Relacionado

- [Grupos](/es/channels/groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos de difusión](/es/channels/broadcast-groups)
