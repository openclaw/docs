---
read_when:
    - Incorporación de una nueva instancia de asistente
    - Revisando las implicaciones de seguridad y permisos
summary: Guía de principio a fin para ejecutar OpenClaw como asistente personal con advertencias de seguridad
title: Configuración del asistente personal
x-i18n:
    generated_at: "2026-05-11T20:54:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 74dd13c4b43faa8e29e1fd56a355f36c6cf7c3fa8193bb62c1056211933f4df9
    source_path: start/openclaw.md
    workflow: 16
---

OpenClaw es un gateway autohospedado que conecta Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo y más con agentes de IA. Esta guía cubre la configuración de "asistente personal": un número dedicado de WhatsApp que se comporta como tu asistente de IA siempre activo.

## ⚠️ La seguridad primero

Estás poniendo a un agente en posición de:

- ejecutar comandos en tu máquina (según tu política de herramientas)
- leer/escribir archivos en tu espacio de trabajo
- enviar mensajes de vuelta mediante WhatsApp/Telegram/Discord/Mattermost y otros canales incluidos

Empieza de forma conservadora:

- Define siempre `channels.whatsapp.allowFrom` (nunca lo ejecutes abierto a todo el mundo en tu Mac personal).
- Usa un número dedicado de WhatsApp para el asistente.
- Los Heartbeats ahora se ejecutan de forma predeterminada cada 30 minutos. Desactívalos hasta que confíes en la configuración estableciendo `agents.defaults.heartbeat.every: "0m"`.

## Requisitos previos

- OpenClaw instalado y configurado inicialmente; consulta [Primeros pasos](/es/start/getting-started) si todavía no lo has hecho
- Un segundo número de teléfono (SIM/eSIM/prepago) para el asistente

## La configuración con dos teléfonos (recomendada)

Quieres esto:

```mermaid
flowchart TB
    A["<b>Tu teléfono (personal)<br></b><br>Tu WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Segundo teléfono (asistente)<br></b><br>WA del asistente<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Tu Mac (openclaw)<br></b><br>Agente de IA"]
```

Si vinculas tu WhatsApp personal con OpenClaw, cada mensaje que recibas se convierte en "entrada del agente". Eso rara vez es lo que quieres.

## Inicio rápido en 5 minutos

1. Empareja WhatsApp Web (muestra un QR; escanéalo con el teléfono del asistente):

```bash
openclaw channels login
```

2. Inicia el Gateway (déjalo en ejecución):

```bash
openclaw gateway --port 18789
```

3. Coloca una configuración mínima en `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Ahora envía un mensaje al número del asistente desde tu teléfono incluido en la lista de permitidos.

Cuando finaliza la incorporación, OpenClaw abre automáticamente el panel y muestra un enlace limpio (sin token). Si el panel solicita autenticación, pega el secreto compartido configurado en los ajustes de Control UI. La incorporación usa un token de forma predeterminada (`gateway.auth.token`), pero la autenticación con contraseña también funciona si cambiaste `gateway.auth.mode` a `password`. Para volver a abrirlo más tarde: `openclaw dashboard`.

## Dale al agente un espacio de trabajo (AGENTS)

OpenClaw lee instrucciones operativas y "memoria" desde su directorio de espacio de trabajo.

De forma predeterminada, OpenClaw usa `~/.openclaw/workspace` como espacio de trabajo del agente y lo creará (junto con los archivos iniciales `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) automáticamente durante la configuración o la primera ejecución del agente. `BOOTSTRAP.md` solo se crea cuando el espacio de trabajo es completamente nuevo (no debería volver después de que lo elimines). `MEMORY.md` es opcional (no se crea automáticamente); cuando está presente, se carga para las sesiones normales. Las sesiones de subagentes solo inyectan `AGENTS.md` y `TOOLS.md`.

<Tip>
Trata esta carpeta como la memoria de OpenClaw y conviértela en un repositorio git (idealmente privado) para que tus archivos `AGENTS.md` y de memoria tengan copia de seguridad. Si git está instalado, los espacios de trabajo nuevos se inicializan automáticamente.
</Tip>

```bash
openclaw setup
```

Diseño completo del espacio de trabajo + guía de copia de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
Flujo de trabajo de memoria: [Memoria](/es/concepts/memory)

Opcional: elige un espacio de trabajo distinto con `agents.defaults.workspace` (admite `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Si ya distribuyes tus propios archivos de espacio de trabajo desde un repositorio, puedes desactivar por completo la creación de archivos de arranque:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## La configuración que lo convierte en "un asistente"

OpenClaw tiene valores predeterminados adecuados para una configuración de asistente, pero normalmente querrás ajustar:

- la personalidad/instrucciones en [`SOUL.md`](/es/concepts/soul)
- los valores predeterminados de razonamiento (si lo deseas)
- los Heartbeats (cuando ya confíes en él)

Ejemplo:

```json5
{
  logging: { level: "info" },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      workspace: "~/.openclaw/workspace",
      thinkingDefault: "high",
      timeoutSeconds: 1800,
      // Start with 0; enable later.
      heartbeat: { every: "0m" },
    },
    list: [
      {
        id: "main",
        default: true,
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sesiones y memoria

- Archivos de sesión: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Metadatos de sesión (uso de tokens, última ruta, etc.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (heredado: `~/.openclaw/sessions/sessions.json`)
- `/new` o `/reset` inicia una sesión nueva para ese chat (configurable mediante `resetTriggers`). Si se envía solo, OpenClaw confirma el reinicio sin invocar el modelo.
- `/compact [instructions]` compacta el contexto de la sesión e informa del presupuesto de contexto restante.

## Heartbeats (modo proactivo)

De forma predeterminada, OpenClaw ejecuta un Heartbeat cada 30 minutos con el prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Define `agents.defaults.heartbeat.every: "0m"` para desactivarlo.

- Si `HEARTBEAT.md` existe pero está efectivamente vacío (solo líneas en blanco y encabezados Markdown como `# Heading`), OpenClaw omite la ejecución del Heartbeat para ahorrar llamadas a la API.
- Si falta el archivo, el Heartbeat se sigue ejecutando y el modelo decide qué hacer.
- Si el agente responde con `HEARTBEAT_OK` (opcionalmente con relleno breve; consulta `agents.defaults.heartbeat.ackMaxChars`), OpenClaw suprime el envío saliente para ese Heartbeat.
- De forma predeterminada, se permite la entrega de Heartbeats a destinos de estilo DM `user:<id>`. Define `agents.defaults.heartbeat.directPolicy: "block"` para suprimir la entrega a destinos directos mientras mantienes activas las ejecuciones de Heartbeat.
- Los Heartbeats ejecutan turnos completos del agente; los intervalos más cortos consumen más tokens.

```json5
{
  agents: {
    defaults: {
      heartbeat: { every: "30m" },
    },
  },
}
```

## Medios de entrada y salida

Los adjuntos entrantes (imágenes/audio/documentos) pueden exponerse a tu comando mediante plantillas:

- `{{MediaPath}}` (ruta de archivo temporal local)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (si la transcripción de audio está habilitada)

Adjuntos salientes del agente: incluye `MEDIA:<path-or-url>` en su propia línea (sin espacios). Ejemplo:

```
Aquí está la captura de pantalla.
MEDIA:https://example.com/screenshot.png
```

OpenClaw los extrae y los envía como medios junto con el texto.

El comportamiento de rutas locales sigue el mismo modelo de confianza de lectura de archivos que el agente:

- Si `tools.fs.workspaceOnly` es `true`, las rutas locales salientes de `MEDIA:` quedan restringidas a la raíz temporal de OpenClaw, la caché de medios, las rutas del espacio de trabajo del agente y los archivos generados por el sandbox.
- Si `tools.fs.workspaceOnly` es `false`, `MEDIA:` saliente puede usar archivos locales del host que el agente ya tenga permitido leer.
- Las rutas locales pueden ser absolutas, relativas al espacio de trabajo o relativas al directorio personal con `~/`.
- Los envíos locales del host siguen permitiendo solo medios y tipos de documentos seguros (imágenes, audio, vídeo, PDF y documentos de Office). Los archivos de texto sin formato y los archivos con apariencia de secretos no se tratan como medios enviables.

Eso significa que las imágenes/archivos generados fuera del espacio de trabajo ahora pueden enviarse cuando tu política de fs ya permite esas lecturas, sin volver a abrir la exfiltración arbitraria de adjuntos de texto del host.

## Lista de comprobación de operaciones

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

Los registros se encuentran en `/tmp/openclaw/` (predeterminado: `openclaw-YYYY-MM-DD.log`).

## Próximos pasos

- WebChat: [WebChat](/es/web/webchat)
- Operaciones del Gateway: [Runbook del Gateway](/es/gateway)
- Cron + activaciones: [Trabajos de Cron](/es/automation/cron-jobs)
- Complemento de barra de menús de macOS: [Aplicación OpenClaw para macOS](/es/platforms/macos)
- Aplicación de nodo de iOS: [Aplicación iOS](/es/platforms/ios)
- Aplicación de nodo de Android: [Aplicación Android](/es/platforms/android)
- Estado de Windows: [Windows (WSL2)](/es/platforms/windows)
- Estado de Linux: [Aplicación Linux](/es/platforms/linux)
- Seguridad: [Seguridad](/es/gateway/security)

## Relacionado

- [Primeros pasos](/es/start/getting-started)
- [Configuración](/es/start/setup)
- [Resumen de canales](/es/channels)
