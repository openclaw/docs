---
read_when:
    - Quieres activar ejecuciones de agentes desde scripts o la línea de comandos
    - Debes enviar respuestas del agente a un canal de chat de forma programática
summary: Ejecuta turnos de agente desde la CLI y, opcionalmente, entrega respuestas a los canales
title: Envío del agente
x-i18n:
    generated_at: "2026-07-05T11:42:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d18acce5a6925463d6fb97c2cbf1d6392611cbeced604a821fa1edaa7fbc5b01
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` ejecuta un único turno de agente desde la línea de comandos sin un
mensaje de chat entrante. Úsalo para flujos de trabajo con scripts, pruebas y
entrega programática. Referencia completa de flags y comportamiento:
[Referencia de la CLI de agente](/es/cli/agent).

## Inicio rápido

<Steps>
  <Step title="Ejecutar un turno de agente simple">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Envía el mensaje a través del Gateway e imprime la respuesta.

  </Step>

  <Step title="Enviar un prompt multilínea desde un archivo">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Lee un archivo UTF-8 válido como cuerpo del mensaje del agente.

  </Step>

  <Step title="Apuntar a un agente o una sesión específicos">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
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

## Flags

| Flag                        | Descripción                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | Mensaje en línea para enviar                                         |
| `--message-file <path>`     | Leer el mensaje desde un archivo UTF-8 válido                        |
| `--to <dest>`               | Derivar la clave de sesión desde un destino (teléfono, id de chat)   |
| `--session-key <key>`       | Usar una clave de sesión explícita                                   |
| `--agent <id>`              | Apuntar a un agente configurado (usa su sesión `main`)               |
| `--session-id <id>`         | Reutilizar una sesión existente por id                               |
| `--model <id>`              | Anulación de modelo para esta ejecución (`provider/model` o id de modelo) |
| `--local`                   | Forzar runtime embebido local (omitir Gateway)                       |
| `--deliver`                 | Enviar la respuesta a un canal de chat                               |
| `--channel <name>`          | Canal de entrega (discord, slack, telegram, whatsapp, etc.)          |
| `--reply-to <target>`       | Anulación del destino de entrega                                     |
| `--reply-channel <name>`    | Anulación del canal de entrega                                       |
| `--reply-account <id>`      | Anulación del id de cuenta de entrega                                |
| `--thinking <level>`        | Establecer el nivel de razonamiento para el perfil de modelo seleccionado |
| `--verbose <on\|full\|off>` | Persistir el nivel detallado para la sesión (`full` también registra la salida de herramientas) |
| `--timeout <seconds>`       | Anular el timeout del agente (predeterminado 600, o valor de configuración) |
| `--json`                    | Generar JSON estructurado                                            |

## Comportamiento

- De forma predeterminada, la CLI pasa **por el Gateway**. Añade `--local` para forzar el
  runtime embebido en la máquina actual.
- Pasa exactamente uno de `--message` o `--message-file`. Los mensajes de archivo preservan
  el contenido multilínea tras eliminar un BOM UTF-8 opcional.
- Si la solicitud al Gateway falla, la CLI **recurre** a la ejecución embebida local;
  un timeout del Gateway recurre con una sesión nueva en lugar de competir con la
  transcripción original.
- Selección de sesión: `--to` deriva la clave de sesión (los destinos de grupo/canal
  preservan el aislamiento; los chats directos se reducen a `main`).
- `--session-key` selecciona una clave explícita. Las claves con prefijo de agente deben usar
  `agent:<agent-id>:<session-key>`, y `--agent` debe coincidir con ese id de agente cuando
  ambos se proporcionan. Las claves sin formato que no sean centinela se acotan a `--agent` cuando
  se proporciona; por ejemplo, `--agent ops --session-key incident-42` enruta a
  `agent:ops:incident-42`. Sin `--agent`, las claves sin formato que no sean centinela se acotan
  al agente predeterminado configurado. Los literales `global` y `unknown` permanecen
  sin acotar solo cuando no se proporciona `--agent`; la ruta de fallback embebida
  resuelve esas sesiones centinela al agente predeterminado configurado.
- `--channel`, `--reply-channel` y `--reply-account` afectan la entrega de respuestas,
  no el enrutamiento de sesiones.
- Los flags de razonamiento y detalle persisten en el almacén de sesiones.
- Salida: texto sin formato de forma predeterminada, o `--json` para payload estructurado + metadatos.
- Con `--json --deliver`, el JSON incluye el estado de entrega para envíos enviados,
  suprimidos, parciales y fallidos. Consulta
  [estado de entrega JSON](/es/cli/agent#json-delivery-status).

## Ejemplos

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Relacionado

<CardGroup cols={2}>
  <Card title="Referencia de la CLI de agente" href="/es/cli/agent" icon="terminal">
    Referencia completa de flags y opciones de `openclaw agent`.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    Creación de subagentes en segundo plano.
  </Card>
  <Card title="Sesiones" href="/es/concepts/session" icon="comments">
    Cómo funcionan las claves de sesión y cómo `--to`, `--agent` y `--session-id` las resuelven.
  </Card>
  <Card title="Comandos slash" href="/es/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos usado dentro de las sesiones de agente.
  </Card>
</CardGroup>
