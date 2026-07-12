---
read_when:
    - Quieres activar ejecuciones del agente desde scripts o la línea de comandos
    - Necesitas enviar las respuestas del agente a un canal de chat mediante programación
summary: Ejecuta turnos del agente desde la CLI y, opcionalmente, envía las respuestas a los canales
title: Envío del agente
x-i18n:
    generated_at: "2026-07-11T23:36:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` ejecuta un único turno del agente desde la línea de comandos sin un
mensaje de chat entrante. Úsalo para flujos de trabajo automatizados, pruebas y
entrega programática. Referencia completa de opciones y comportamiento:
[Referencia de la CLI del agente](/es/cli/agent).

## Inicio rápido

<Steps>
  <Step title="Ejecutar un turno sencillo del agente">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Envía el mensaje a través del Gateway e imprime la respuesta.

  </Step>

  <Step title="Enviar una instrucción multilínea desde un archivo">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Lee un archivo UTF-8 válido como cuerpo del mensaje del agente.

  </Step>

  <Step title="Dirigirse a un agente o una sesión específicos">
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

## Opciones

| Opción                      | Descripción                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- |
| `--message <text>`          | Mensaje en línea que se enviará                                              |
| `--message-file <path>`     | Lee el mensaje desde un archivo UTF-8 válido                                 |
| `--to <dest>`               | Deriva la clave de sesión de un destino (teléfono, id. de chat)              |
| `--session-key <key>`       | Usa una clave de sesión explícita                                            |
| `--agent <id>`              | Se dirige a un agente configurado (usa su sesión `main`)                     |
| `--session-id <id>`         | Reutiliza una sesión existente por id.                                       |
| `--model <id>`              | Sustituye el modelo para esta ejecución (`provider/model` o id. del modelo)   |
| `--local`                   | Fuerza el entorno de ejecución local integrado (omite el Gateway)            |
| `--deliver`                 | Envía la respuesta a un canal de chat                                        |
| `--channel <name>`          | Canal de entrega; con `--agent` + `--to`, también aplica el ámbito de MD      |
| `--reply-to <target>`       | Sustituye el destino de entrega                                              |
| `--reply-channel <name>`    | Sustituye el canal de entrega                                                |
| `--reply-account <id>`      | Sustituye el id. de la cuenta de entrega                                     |
| `--thinking <level>`        | Establece el nivel de razonamiento para el perfil de modelo seleccionado     |
| `--verbose <on\|full\|off>` | Conserva el nivel detallado para la sesión (`full` también registra la salida de las herramientas) |
| `--timeout <seconds>`       | Sustituye el tiempo de espera del agente (600 de forma predeterminada, o el valor de configuración) |
| `--json`                    | Genera JSON estructurado                                                     |

## Comportamiento

- De forma predeterminada, la CLI pasa **por el Gateway**. Añade `--local` para
  forzar el entorno de ejecución integrado en la máquina actual.
- Proporciona exactamente una de las opciones `--message` o `--message-file`. Los mensajes de
  archivo conservan el contenido multilínea después de eliminar una marca BOM UTF-8 opcional.
- Si la solicitud al Gateway falla, la CLI **recurre** a la ejecución local
  integrada; cuando se agota el tiempo de espera del Gateway, recurre a una sesión nueva en lugar de competir con
  la transcripción original.
- Selección de sesión: `--to` deriva la clave de sesión (los destinos de grupo/canal
  mantienen el aislamiento; los chats directos se agrupan en `main`). Cuando se usan juntos
  `--agent`, `--channel` y `--to`, el enrutamiento sigue al destinatario canónico
  del canal y a `session.dmScope`. Las identidades estables exclusivamente salientes usan una
  sesión propiedad del proveedor, aislada de la sesión principal del agente.
- `--session-key` selecciona una clave explícita. Las claves con prefijo de agente deben usar
  `agent:<agent-id>:<session-key>`, y `--agent` debe coincidir con ese id. de agente cuando
  se proporcionan ambos. Las claves simples que no son centinelas se asignan al ámbito de `--agent` cuando
  se proporciona; por ejemplo, `--agent ops --session-key incident-42` dirige a
  `agent:ops:incident-42`. Sin `--agent`, las claves simples que no son centinelas se asignan
  al ámbito del agente predeterminado configurado. Los valores literales `global` y `unknown` permanecen
  sin ámbito solo cuando no se proporciona `--agent`; la ruta alternativa integrada
  resuelve esas sesiones centinela al agente predeterminado configurado.
- `--reply-channel` y `--reply-account` solo afectan a la entrega.
- Las opciones de razonamiento y nivel detallado se conservan en el almacén de sesiones.
- Salida: texto sin formato de manera predeterminada, o `--json` para una carga útil estructurada y metadatos.
- Con `--json --deliver`, el JSON incluye el estado de entrega de los envíos
  realizados, suprimidos, parciales y fallidos. Consulta
  [Estado de entrega JSON](/es/cli/agent#json-delivery-status).

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

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Referencia de la CLI del agente" href="/es/cli/agent" icon="terminal">
    Referencia completa de las opciones de `openclaw agent`.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    Creación de subagentes en segundo plano.
  </Card>
  <Card title="Sesiones" href="/es/concepts/session" icon="comments">
    Cómo funcionan las claves de sesión y cómo las resuelven `--to`, `--agent` y `--session-id`.
  </Card>
  <Card title="Comandos con barra" href="/es/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos utilizados dentro de las sesiones del agente.
  </Card>
</CardGroup>
