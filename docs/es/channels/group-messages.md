---
read_when:
    - Configuración específica de grupos de WhatsApp
    - Cambio de los modos de activación de WhatsApp (`mention` frente a `always`)
    - Ajuste de las claves de sesión de grupos de WhatsApp o del contexto de mensajes pendientes
sidebarTitle: WhatsApp groups
summary: Gestión de mensajes de grupos de WhatsApp — activación, listas de permitidos, sesiones e inyección de contexto
title: Mensajes de grupos de WhatsApp
x-i18n:
    generated_at: "2026-07-12T14:18:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

Para consultar el modelo de grupos multicanal (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo), véase [Grupos](/es/channels/groups). Esta página describe el comportamiento específico de WhatsApp que se añade a ese modelo: activación, listas de permitidos de grupos, claves de sesión por grupo e inyección de contexto de mensajes pendientes.

Objetivo: permitir que OpenClaw permanezca en grupos de WhatsApp, se active solo cuando se lo mencione y mantenga esa conversación separada de la sesión personal de mensajes directos.

<Note>
`agents.list[].groupChat.mentionPatterns` se comparte con el control de menciones de los demás canales. En configuraciones con varios agentes, establézcalo para cada agente o use `messages.groupChat.mentionPatterns` como alternativa global. Si no se configura ninguno, los patrones se derivan del nombre o emoji de la identidad del agente.
</Note>

## Comportamiento

- Modos de activación: `mention` (predeterminado) o `always`. `mention` requiere una llamada: una @mención real de WhatsApp (`mentionedJids`), un patrón de expresión regular configurado, los dígitos E.164 del bot en cualquier parte del texto o una respuesta citada a uno de los mensajes del bot (excepto en configuraciones de chat consigo mismo con número compartido). `always` activa al agente con cada mensaje, pero el prompt de grupo inyectado le indica que responda solo cuando aporte valor y que, de lo contrario, devuelva el token de silencio exacto `NO_REPLY` (sin distinguir entre mayúsculas y minúsculas). Los valores predeterminados provienen de la configuración (`channels.whatsapp.groups` `requireMention`) y pueden sobrescribirse para cada grupo mediante `/activation`.
- Lista de permitidos de grupos: cuando se establece `channels.whatsapp.groups`, solo se admiten los JID de grupo indicados (incluya `"*"` para permitirlos todos); los mensajes de grupos que no figuren en la lista se descartan con una indicación en el registro.
- Política de grupos: `channels.whatsapp.groupPolicy` controla si se aceptan los mensajes de grupo (`open|disabled|allowlist`). `allowlist` utiliza `channels.whatsapp.groupAllowFrom` (alternativa: `channels.whatsapp.allowFrom` explícito). El valor predeterminado es `allowlist` (se bloquean hasta que se añadan remitentes).
- Sesiones por grupo: las claves de sesión tienen el formato `agent:<agentId>:whatsapp:group:<jid>` (las cuentas no predeterminadas añaden `:thread:whatsapp-account-<accountId>`), por lo que las directivas como `/verbose on`, `/trace on` o `/think high` (enviadas como mensajes independientes) se limitan a ese grupo; el estado de los mensajes directos personales no se modifica.
- Inyección de contexto: los mensajes de grupo **solo pendientes** (50 de forma predeterminada) que _no_ activaron una ejecución se anteponen bajo `[Chat messages since your last reply - for context]`, con la línea que la activa bajo `[Current message - respond to this]`. La ventana de mensajes pendientes se borra después de la ejecución; los mensajes que ya están en la sesión no se vuelven a inyectar.
- Atribución del remitente: cada línea del grupo incluye la etiqueta del remitente dentro del sobre del mensaje, por ejemplo, `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`, y la identidad del remitente, junto con el asunto y los miembros del grupo, se incluye en el bloque de metadatos de conversación no confiables.
- Efímeros/de visualización única: los envoltorios se eliminan antes de extraer el texto y las menciones, por lo que las llamadas que contienen siguen activando el agente.
- Prompt del sistema del grupo: el primer turno de una sesión de grupo (y cualquier turno después de que `/activation` cambie el modo) inyecta instrucciones de activación en el prompt del sistema (`Activation: trigger-only ...` o `Activation: always-on ...`, además de «dirigirse al remitente específico»). Siempre se incluyen las instrucciones persistentes de entrega para chats grupales («Está en un chat grupal de WhatsApp...»).

## Ejemplo de configuración (WhatsApp)

Permite que las menciones mediante el nombre para mostrar funcionen incluso cuando WhatsApp elimina el carácter visual `@` del cuerpo del texto:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // ventana de contexto pendiente del grupo (valor predeterminado: 50)
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

- Las expresiones regulares no distinguen entre mayúsculas y minúsculas y usan las mismas medidas de protección para expresiones regulares seguras que otras superficies de expresiones regulares de configuración; los patrones no válidos y las repeticiones anidadas no seguras se ignoran.
- WhatsApp sigue enviando menciones canónicas mediante `mentionedJids` cuando alguien toca el contacto, por lo que rara vez se necesita usar el número como alternativa, pero resulta una medida de seguridad útil.
- La ventana de contexto pendiente se resuelve en este orden: `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Comando de activación (solo para el propietario)

Usa el comando del chat grupal:

- `/activation mention`
- `/activation always`

Solo los números de los propietarios (de `channels.whatsapp.allowFrom`, o el número E.164 del propio bot si no está configurado) pueden cambiar esto; el comando `/activation` de cualquier otra persona se ignora y se almacena únicamente como contexto. Envía `/status` como mensaje independiente en el grupo para ver el modo de activación actual.

## Cómo usarlo

1. Añade tu cuenta de WhatsApp (la que ejecuta OpenClaw) al grupo.
2. Escribe `@openclaw ...` (o incluye el número). Solo los remitentes incluidos en la lista de permitidos pueden activarlo, a menos que establezcas `groupPolicy: "open"`.
3. El prompt del agente incluye el contexto pendiente del grupo y líneas etiquetadas con el remitente para que pueda dirigirse a la persona correcta.
4. Las directivas de sesión (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) solo se aplican a la sesión de ese grupo; envíalas como mensajes independientes para que se registren. Tu sesión personal de mensajes directos permanece independiente.

## Pruebas / verificación

- Prueba rápida manual:
  - Envía un mensaje de comprobación con `@openclaw` en el grupo y confirma que la respuesta haga referencia al nombre del remitente.
  - Envía un segundo mensaje de comprobación y verifica que se incluya el bloque del historial y que luego se borre en el siguiente turno.
- Comprueba los registros del Gateway (ejecutado con `--verbose`) para buscar entradas `inbound web message` que muestren `from: <groupJid>` y el cuerpo etiquetado con el remitente.

## Consideraciones conocidas

- Los Heartbeat se ejecutan en la sesión principal del agente; las sesiones de grupo nunca reciben ejecuciones de Heartbeat.
- La supresión de eco recuerda el prompt combinado (historial + mensaje actual) de cada sesión para que los mensajes entregados por el propio bot no vuelvan a activarlo; un lote repetido idéntico puede omitirse como eco.
- Las entradas del almacén de sesiones aparecen como `agent:<agentId>:whatsapp:group:<jid>` en el almacén de sesiones SQLite de cada agente; que falte una entrada solo significa que el grupo aún no ha activado una ejecución.
- Los indicadores de escritura siguen `session.typingMode` / `agents.defaults.typingMode`. Cuando se habilitan las respuestas visibles en el modo exclusivo de la herramienta de mensajes, la escritura comienza inmediatamente de forma predeterminada para que los miembros del grupo puedan ver que el agente está trabajando, aunque no se publique ninguna respuesta final automática. La configuración explícita del modo de escritura sigue teniendo prioridad.

## Relacionado

- [Grupos](/es/channels/groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos de difusión](/es/channels/broadcast-groups)
