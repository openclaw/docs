---
read_when:
    - Configuración específica de grupos de WhatsApp
    - Cambio de los modos de activación de WhatsApp (`mention` frente a `always`)
    - Ajuste de las claves de sesión de grupos de WhatsApp o del contexto de mensajes pendientes
sidebarTitle: WhatsApp groups
summary: Gestión de mensajes de grupos de WhatsApp — activación, listas de permitidos, sesiones e inyección de contexto
title: Mensajes de grupos de WhatsApp
x-i18n:
    generated_at: "2026-07-22T10:25:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7325dd3ae64d7abca8c1de0504f294ae280394fa5dd336d2532c5eaefcb03828
    source_path: channels/group-messages.md
    workflow: 16
---

Para el modelo de grupos entre canales (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo), consulte [Grupos](/es/channels/groups). Esta página aborda el comportamiento específico de WhatsApp que se añade a ese modelo: activación, listas de permitidos de grupos, claves de sesión por grupo e inyección del contexto de mensajes pendientes.

Objetivo: permitir que OpenClaw esté presente en grupos de WhatsApp, se active solo cuando se le mencione y mantenga ese hilo separado de la sesión personal de mensajes directos.

<Note>
`agents.entries.*.groupChat.mentionPatterns` se comparte con el control por menciones de los demás canales. En configuraciones multiagente, establézcalo por agente o use `messages.groupChat.mentionPatterns` como alternativa global. Si no se establece ninguno, los patrones se derivan del nombre o emoji de identidad del agente.
</Note>

## Comportamiento

- Modos de activación: `mention` (predeterminado) o `always`. `mention` requiere una mención: una @mención real de WhatsApp (`mentionedJids`), un patrón de expresión regular configurado, los dígitos E.164 del bot en cualquier parte del texto o una respuesta citada a uno de los mensajes del bot (excepto en configuraciones de chat consigo mismo con número compartido). `always` activa al agente con cada mensaje, pero el prompt de grupo inyectado le indica que responda solo cuando aporte valor y que, de lo contrario, devuelva el token silencioso exacto `NO_REPLY` (sin distinguir mayúsculas de minúsculas). Los valores predeterminados proceden de la configuración (`channels.whatsapp.groups` `requireMention`) y pueden sustituirse para cada grupo mediante `/activation`.
- Lista de permitidos de grupos: cuando se establece `channels.whatsapp.groups`, solo se admiten los JID de grupo enumerados (incluya `"*"` para permitirlos todos); los mensajes de grupos no incluidos se descartan y se registra una indicación en el log.
- Política de grupos: `channels.whatsapp.groupPolicy` controla si se aceptan mensajes de grupo (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (alternativa: `channels.whatsapp.allowFrom` explícito). El valor predeterminado es `allowlist` (bloqueado hasta que se añadan remitentes).
- Sesiones por grupo: las claves de sesión tienen el formato `agent:<agentId>:whatsapp:group:<jid>` (las cuentas no predeterminadas añaden `:thread:whatsapp-account-<accountId>`), por lo que directivas como `/verbose on`, `/trace on` o `/think high` (enviadas como mensajes independientes) se limitan a ese grupo; el estado de los mensajes directos personales no se modifica.
- Inyección de contexto: los mensajes de grupo **solo pendientes** (50 de forma predeterminada) que _no_ activaron una ejecución se anteponen bajo `[Chat messages since your last reply - for context]`, con la línea desencadenante bajo `[Current message - respond to this]`. La ventana de mensajes pendientes se borra después de la ejecución; los mensajes que ya están en la sesión no vuelven a inyectarse.
- Atribución del remitente: cada línea del grupo contiene la etiqueta del remitente dentro del sobre del mensaje, por ejemplo, `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`, y la identidad del remitente, junto con el asunto y los miembros del grupo, se incluye en el bloque de metadatos de conversación no confiables.
- Efímeros/de visualización única: los envoltorios se desempaquetan antes de extraer el texto y las menciones, por lo que las menciones dentro de ellos también activan al agente.
- Prompt del sistema del grupo: el primer turno de una sesión de grupo (y cualquier turno después de que `/activation` cambie el modo) inyecta instrucciones de activación en el prompt del sistema (`Activation: trigger-only ...` o `Activation: always-on ...`, además de «dirigirse al remitente específico»). Siempre se incluyen instrucciones persistentes para la entrega en chats de grupo («Se encuentra en un chat de grupo de WhatsApp...»).

## Ejemplo de configuración (WhatsApp)

Permita que las menciones por nombre para mostrar funcionen incluso cuando WhatsApp elimine el `@` visual del cuerpo del texto:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // ventana de contexto de grupo pendiente (predeterminado: 50)
    },
  },
  agents: {
    entries: {
      main: {
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    },
  },
}
```

Notas:

- Las expresiones regulares no distinguen mayúsculas de minúsculas y usan las mismas protecciones para expresiones regulares seguras que las demás superficies de configuración de expresiones regulares; los patrones no válidos y las repeticiones anidadas no seguras se ignoran.
- WhatsApp sigue enviando menciones canónicas mediante `mentionedJids` cuando alguien toca el contacto, por lo que la alternativa basada en el número rara vez es necesaria, pero resulta útil como medida de seguridad.
- La ventana de contexto pendiente se resuelve como `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Comando de activación (solo para el propietario)

Use el comando del chat de grupo:

- `/activation mention`
- `/activation always`

Solo los números del propietario (procedentes de `channels.whatsapp.allowFrom` o el E.164 propio del bot si no se establece) pueden cambiar este valor; `/activation` enviado por cualquier otra persona se ignora y se almacena únicamente como contexto. Envíe `/status` como mensaje independiente en el grupo para ver el modo de activación actual.

## Cómo usarlo

1. Añada al grupo su cuenta de WhatsApp (la que ejecuta OpenClaw).
2. Escriba `@openclaw ...` (o incluya el número). Solo los remitentes incluidos en la lista de permitidos pueden activarlo, a menos que se establezca `groupPolicy: "open"`.
3. El prompt del agente incluye el contexto de grupo pendiente y líneas etiquetadas con el remitente para que pueda dirigirse a la persona correcta.
4. Las directivas de sesión (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) se aplican únicamente a la sesión de ese grupo; envíelas como mensajes independientes para que se registren. La sesión personal de mensajes directos permanece independiente.

## Pruebas/verificación

- Prueba de humo manual:
  - Envíe una mención `@openclaw` en el grupo y confirme que se recibe una respuesta que hace referencia al nombre del remitente.
  - Envíe una segunda mención y verifique que se incluya el bloque del historial y que después se borre en el siguiente turno.
- Compruebe los logs del Gateway (ejecútelo con `--verbose`) para encontrar entradas `inbound web message` que muestren `from: <groupJid>` y el cuerpo etiquetado con el remitente.

## Consideraciones conocidas

- Los Heartbeat se ejecutan en la sesión principal del agente; las sesiones de grupo nunca reciben ejecuciones de Heartbeat.
- La supresión de eco recuerda el prompt combinado (historial + mensaje actual) por sesión para que los mensajes entregados por el propio bot no vuelvan a activarlo; un lote idéntico repetido puede omitirse como eco.
- Las entradas del almacén de sesiones aparecen como `agent:<agentId>:whatsapp:group:<jid>` en el almacén de sesiones SQLite por agente; la ausencia de una entrada solo significa que el grupo todavía no ha activado ninguna ejecución.
- Los indicadores de escritura siguen `agents.entries.*.typingMode` / `agents.defaults.typingMode`. Cuando se configura que las respuestas visibles usen el modo exclusivo de la herramienta de mensajes, la escritura comienza inmediatamente de forma predeterminada para que los miembros del grupo puedan ver que el agente está trabajando, aunque no se publique ninguna respuesta final automática. La configuración explícita del modo de escritura sigue teniendo prioridad.

## Contenido relacionado

- [Grupos](/es/channels/groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos de difusión](/es/channels/broadcast-groups)
