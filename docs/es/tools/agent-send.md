---
read_when:
    - Quieres activar ejecuciones de agentes desde scripts o desde la línea de comandos
    - Necesitas enviar respuestas de agentes a un canal de chat mediante programación
summary: Ejecuta turnos de agente desde la CLI y, opcionalmente, entrega respuestas a canales
title: Envío del agente
x-i18n:
    generated_at: "2026-05-06T05:49:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` ejecuta un único turno de agente desde la línea de comandos sin necesitar
un mensaje de chat entrante. Úsalo para flujos de trabajo con scripts, pruebas y
entrega programática.

## Inicio rápido

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Esto envía el mensaje a través del Gateway e imprime la respuesta.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flags

| Flag                          | Descripción                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Mensaje que enviar (obligatorio)                            |
| `--to \<dest\>`               | Derivar la clave de sesión a partir de un destino (teléfono, id de chat) |
| `--agent \<id\>`              | Apuntar a un agente configurado (usa su sesión `main`)      |
| `--session-id \<id\>`         | Reutilizar una sesión existente por id                      |
| `--local`                     | Forzar el runtime embebido local (omitir Gateway)           |
| `--deliver`                   | Enviar la respuesta a un canal de chat                      |
| `--channel \<name\>`          | Canal de entrega (whatsapp, telegram, discord, slack, etc.) |
| `--reply-to \<target\>`       | Anulación del destino de entrega                            |
| `--reply-channel \<name\>`    | Anulación del canal de entrega                              |
| `--reply-account \<id\>`      | Anulación del id de cuenta de entrega                       |
| `--thinking \<level\>`        | Establecer el nivel de razonamiento para el perfil de modelo seleccionado |
| `--verbose \<on\|full\|off\>` | Establecer el nivel detallado                               |
| `--timeout \<seconds\>`       | Anular el tiempo de espera del agente                       |
| `--json`                      | Emitir JSON estructurado                                    |

## Comportamiento

- De forma predeterminada, la CLI pasa **por el Gateway**. Añade `--local` para forzar el
  runtime embebido en la máquina actual.
- Si el Gateway no está disponible, la CLI **recurre** a la ejecución embebida local.
- Selección de sesión: `--to` deriva la clave de sesión (los destinos de grupo/canal
  conservan el aislamiento; los chats directos se reducen a `main`).
- Las flags de razonamiento y detalle persisten en el almacén de sesiones.
- Salida: texto sin formato de forma predeterminada, o `--json` para una carga estructurada + metadatos.

## Ejemplos

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Relacionado

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/es/cli/agent" icon="terminal">
    Referencia completa de flags y opciones de `openclaw agent`.
  </Card>
  <Card title="Sub-agents" href="/es/tools/subagents" icon="users">
    Generación de subagentes en segundo plano.
  </Card>
  <Card title="Sessions" href="/es/concepts/session" icon="comments">
    Cómo funcionan las claves de sesión y cómo `--to`, `--agent` y `--session-id` las resuelven.
  </Card>
  <Card title="Slash commands" href="/es/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos usado dentro de las sesiones de agente.
  </Card>
</CardGroup>
