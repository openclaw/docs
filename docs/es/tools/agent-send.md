---
read_when:
    - Quieres activar ejecuciones del agente desde scripts o la línea de comandos
    - Necesitas entregar respuestas del agente a un canal de chat de forma programática
summary: Ejecutar turnos de agente desde la CLI y entregar opcionalmente respuestas a canales
title: Envío de agente
x-i18n:
    generated_at: "2026-04-24T05:51:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent` ejecuta un único turno de agente desde la línea de comandos sin necesitar
un mensaje entrante de chat. Úsalo para flujos de trabajo con scripts, pruebas y
entrega programática.

## Inicio rápido

<Steps>
  <Step title="Ejecutar un turno simple de agente">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Esto envía el mensaje a través del Gateway e imprime la respuesta.

  </Step>

  <Step title="Apuntar a un agente o sesión específicos">
    ```bash
    # Apuntar a un agente específico
    openclaw agent --agent ops --message "Summarize logs"

    # Apuntar a un número de teléfono (deriva la clave de sesión)
    openclaw agent --to +15555550123 --message "Status update"

    # Reutilizar una sesión existente
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Entregar la respuesta a un canal">
    ```bash
    # Entregar a WhatsApp (canal predeterminado)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Entregar a Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flags

| Flag                          | Descripción                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Mensaje que se enviará (obligatorio)                        |
| `--to \<dest\>`               | Derivar la clave de sesión a partir de un destino (teléfono, id de chat) |
| `--agent \<id\>`              | Apuntar a un agente configurado (usa su sesión `main`)      |
| `--session-id \<id\>`         | Reutilizar una sesión existente por id                      |
| `--local`                     | Forzar tiempo de ejecución embebido local (omitir Gateway)  |
| `--deliver`                   | Enviar la respuesta a un canal de chat                      |
| `--channel \<name\>`          | Canal de entrega (whatsapp, telegram, discord, slack, etc.) |
| `--reply-to \<target\>`       | Sobrescritura del destino de entrega                        |
| `--reply-channel \<name\>`    | Sobrescritura del canal de entrega                          |
| `--reply-account \<id\>`      | Sobrescritura del id de cuenta de entrega                   |
| `--thinking \<level\>`        | Establecer el nivel de thinking para el perfil de modelo seleccionado |
| `--verbose \<on\|full\|off\>` | Establecer el nivel de detalle                              |
| `--timeout \<seconds\>`       | Sobrescribir el tiempo de espera del agente                 |
| `--json`                      | Salida JSON estructurada                                    |

## Comportamiento

- De forma predeterminada, la CLI va **a través del Gateway**. Agrega `--local` para forzar el
  tiempo de ejecución embebido local en la máquina actual.
- Si el Gateway no está disponible, la CLI **recurre** a la ejecución embebida local.
- Selección de sesión: `--to` deriva la clave de sesión (los destinos de grupo/canal
  conservan el aislamiento; los chats directos se reducen a `main`).
- Los flags de thinking y verbose persisten en el almacenamiento de sesión.
- Salida: texto plano de forma predeterminada, o `--json` para carga útil estructurada + metadatos.

## Ejemplos

```bash
# Turno simple con salida JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turno con nivel de thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Entregar a un canal diferente al de la sesión
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Relacionado

- [Referencia de CLI de Agent](/es/cli/agent)
- [Sub-agents](/es/tools/subagents) — creación de subagentes en segundo plano
- [Sesiones](/es/concepts/session) — cómo funcionan las claves de sesión
