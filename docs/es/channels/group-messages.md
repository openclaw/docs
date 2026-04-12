---
read_when:
    - Cambiar reglas de mensajes de grupo o menciones
summary: Comportamiento y configuración para el manejo de mensajes de grupo de WhatsApp (mentionPatterns se comparten entre superficies)
title: Mensajes de grupo
x-i18n:
    generated_at: "2026-04-12T23:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d9484dd1de74d42f8dce4c3ac80d60c24864df30a7802e64893ef55506230fe
    source_path: channels/group-messages.md
    workflow: 15
---

# Mensajes de grupo (canal web de WhatsApp)

Objetivo: permitir que Clawd permanezca en grupos de WhatsApp, se active solo cuando lo mencionen y mantenga ese hilo separado de la sesión personal por DM.

Nota: `agents.list[].groupChat.mentionPatterns` ahora también se usa en Telegram/Discord/Slack/iMessage; esta documentación se centra en el comportamiento específico de WhatsApp. Para configuraciones con varios agentes, establece `agents.list[].groupChat.mentionPatterns` por agente (o usa `messages.groupChat.mentionPatterns` como respaldo global).

## Implementación actual (2025-12-03)

- Modos de activación: `mention` (predeterminado) o `always`. `mention` requiere una mención (menciones reales de WhatsApp con @ a través de `mentionedJids`, patrones regex seguros o el E.164 del bot en cualquier parte del texto). `always` activa al agente con cada mensaje, pero debería responder solo cuando pueda aportar un valor significativo; de lo contrario devuelve el token silencioso exacto `NO_REPLY` / `no_reply`. Los valores predeterminados pueden establecerse en la configuración (`channels.whatsapp.groups`) y sobrescribirse por grupo mediante `/activation`. Cuando se establece `channels.whatsapp.groups`, también actúa como una lista de permitidos de grupos (incluye `"*"` para permitir todos).
- Política de grupos: `channels.whatsapp.groupPolicy` controla si se aceptan mensajes de grupo (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (respaldo: `channels.whatsapp.allowFrom` explícito). El valor predeterminado es `allowlist` (bloqueado hasta que agregues remitentes).
- Sesiones por grupo: las claves de sesión tienen el formato `agent:<agentId>:whatsapp:group:<jid>`, por lo que comandos como `/verbose on`, `/trace on` o `/think high` (enviados como mensajes independientes) se limitan a ese grupo; el estado de DM personal no se toca. Los Heartbeat se omiten para los hilos de grupo.
- Inyección de contexto: los mensajes de grupo **solo pendientes** (predeterminado: 50) que _no_ activaron una ejecución se anteponen bajo `[Mensajes del chat desde tu última respuesta - para contexto]`, con la línea que activó la ejecución bajo `[Mensaje actual - responde a esto]`. Los mensajes que ya están en la sesión no se vuelven a inyectar.
- Presentación del remitente: cada lote de grupo ahora termina con `[from: Nombre del remitente (+E164)]` para que Pi sepa quién está hablando.
- Efímeros/view-once: los desenvolvemos antes de extraer texto/menciones, así que las menciones dentro de ellos igualmente activan.
- Prompt del sistema para grupos: en el primer turno de una sesión de grupo (y cada vez que `/activation` cambia el modo) inyectamos una breve nota en el prompt del sistema como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Si los metadatos no están disponibles, igualmente le indicamos al agente que es un chat grupal.

## Ejemplo de configuración (WhatsApp)

Agrega un bloque `groupChat` a `~/.openclaw/openclaw.json` para que las menciones por nombre visible funcionen incluso cuando WhatsApp quita la `@` visual en el cuerpo del texto:

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

- Las regex no distinguen entre mayúsculas y minúsculas y usan las mismas protecciones de regex segura que otras superficies regex de configuración; los patrones no válidos y las repeticiones anidadas inseguras se ignoran.
- WhatsApp sigue enviando menciones canónicas mediante `mentionedJids` cuando alguien toca el contacto, así que el respaldo con el número rara vez es necesario, pero es una red de seguridad útil.

### Comando de activación (solo propietario)

Usa el comando del chat grupal:

- `/activation mention`
- `/activation always`

Solo el número del propietario (de `channels.whatsapp.allowFrom`, o el propio E.164 del bot cuando no está configurado) puede cambiar esto. Envía `/status` como mensaje independiente en el grupo para ver el modo de activación actual.

## Cómo usarlo

1. Agrega tu cuenta de WhatsApp (la que ejecuta OpenClaw) al grupo.
2. Di `@openclaw …` (o incluye el número). Solo los remitentes en la lista de permitidos pueden activarlo a menos que establezcas `groupPolicy: "open"`.
3. El prompt del agente incluirá el contexto reciente del grupo más el marcador final `[from: …]` para que pueda dirigirse a la persona correcta.
4. Las directivas a nivel de sesión (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) se aplican solo a la sesión de ese grupo; envíalas como mensajes independientes para que se registren. Tu sesión personal por DM permanece independiente.

## Pruebas / verificación

- Prueba manual rápida:
  - Envía una mención `@openclaw` en el grupo y confirma una respuesta que haga referencia al nombre del remitente.
  - Envía una segunda mención y verifica que el bloque de historial se incluya y luego se borre en el siguiente turno.
- Revisa los logs del gateway (ejecuta con `--verbose`) para ver entradas `inbound web message` que muestren `from: <groupJid>` y el sufijo `[from: …]`.

## Consideraciones conocidas

- Los Heartbeat se omiten intencionalmente en grupos para evitar difusiones ruidosas.
- La supresión de eco usa la cadena combinada del lote; si envías el mismo texto dos veces sin menciones, solo la primera recibirá respuesta.
- Las entradas del almacén de sesiones aparecerán como `agent:<agentId>:whatsapp:group:<jid>` en el almacén de sesiones (`~/.openclaw/agents/<agentId>/sessions/sessions.json` de forma predeterminada); una entrada faltante solo significa que el grupo aún no ha activado una ejecución.
- Los indicadores de escritura en grupos siguen `agents.defaults.typingMode` (predeterminado: `message` cuando no hay mención).
