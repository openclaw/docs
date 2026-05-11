---
read_when:
    - Desea activar ejecuciones de agentes desde scripts o la línea de comandos
    - Necesitas entregar respuestas de agentes a un canal de chat mediante programación
summary: Ejecuta turnos de agente desde la CLI y, opcionalmente, envía respuestas a los canales
title: Envío del agente
x-i18n:
    generated_at: "2026-05-11T20:54:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` ejecuta un solo turno de agente desde la línea de comandos sin necesitar
un mensaje de chat entrante. Úsalo para flujos de trabajo con scripts, pruebas y
entrega programática.

## Inicio rápido

<Steps>
  <Step title="Ejecutar un turno de agente simple">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Esto envía el mensaje a través del Gateway e imprime la respuesta.

  </Step>

  <Step title="Dirigir a un agente o una sesión específicos">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Entregar la respuesta a un canal">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Indicadores

| Indicador                     | Descripción                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Mensaje para enviar (obligatorio)                           |
| `--to \<dest\>`               | Deriva la clave de sesión de un destino (teléfono, id de chat) |
| `--agent \<id\>`              | Dirige a un agente configurado (usa su sesión `main`)       |
| `--session-id \<id\>`         | Reutiliza una sesión existente por id                       |
| `--local`                     | Fuerza el runtime embebido local (omite el Gateway)         |
| `--deliver`                   | Envía la respuesta a un canal de chat                       |
| `--channel \<name\>`          | Canal de entrega (whatsapp, telegram, discord, slack, etc.) |
| `--reply-to \<target\>`       | Anulación del destino de entrega                            |
| `--reply-channel \<name\>`    | Anulación del canal de entrega                              |
| `--reply-account \<id\>`      | Anulación del id de cuenta de entrega                       |
| `--thinking \<level\>`        | Establece el nivel de pensamiento para el perfil de modelo seleccionado |
| `--verbose \<on\|full\|off\>` | Establece el nivel de detalle                               |
| `--timeout \<seconds\>`       | Anula el tiempo de espera del agente                        |
| `--json`                      | Emite JSON estructurado                                     |

## Comportamiento

- De forma predeterminada, la CLI pasa **por el Gateway**. Añade `--local` para forzar el
  runtime embebido en la máquina actual.
- Si no se puede acceder al Gateway, la CLI **recurre** a la ejecución embebida local.
- Selección de sesión: `--to` deriva la clave de sesión (los destinos de grupo/canal
  conservan el aislamiento; los chats directos se reducen a `main`).
- Los indicadores de pensamiento y detalle persisten en el almacén de sesiones.
- Salida: texto sin formato de forma predeterminada, o `--json` para carga útil estructurada + metadatos.
- Con `--json --deliver`, el JSON incluye el estado de entrega para envíos
  enviados, suprimidos, parciales y fallidos. Consulta
  [estado de entrega JSON](/es/cli/agent#json-delivery-status).

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
  <Card title="Referencia de CLI del agente" href="/es/cli/agent" icon="terminal">
    Referencia completa de indicadores y opciones de `openclaw agent`.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    Generación de subagentes en segundo plano.
  </Card>
  <Card title="Sesiones" href="/es/concepts/session" icon="comments">
    Cómo funcionan las claves de sesión y cómo `--to`, `--agent` y `--session-id` las resuelven.
  </Card>
  <Card title="Comandos de barra" href="/es/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos usados dentro de las sesiones de agente.
  </Card>
</CardGroup>
