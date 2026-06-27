---
read_when:
    - Quieres activar ejecuciones de agente desde scripts o la línea de comandos
    - Necesitas entregar respuestas del agente a un canal de chat mediante programación
summary: Ejecuta turnos de agente desde la CLI y, opcionalmente, entrega respuestas a canales
title: Envío de agente
x-i18n:
    generated_at: "2026-06-27T12:59:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` ejecuta un único turno de agente desde la línea de comandos sin necesitar
un mensaje de chat entrante. Úsalo para flujos de trabajo con scripts, pruebas y
entrega programática.

## Inicio rápido

<Steps>
  <Step title="Ejecutar un turno de agente sencillo">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Esto envía el mensaje a través del Gateway e imprime la respuesta.

  </Step>

  <Step title="Enviar un prompt multilínea desde un archivo">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Esto lee un archivo UTF-8 válido como cuerpo del mensaje del agente.

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

| Flag                          | Descripción                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Mensaje en línea que se enviará                             |
| `--message-file \<path\>`     | Leer el mensaje desde un archivo UTF-8 válido               |
| `--to \<dest\>`               | Derivar la clave de sesión desde un destino (teléfono, id de chat) |
| `--session-key \<key\>`       | Usar una clave de sesión explícita                          |
| `--agent \<id\>`              | Apuntar a un agente configurado (usa su sesión `main`)      |
| `--session-id \<id\>`         | Reutilizar una sesión existente por id                      |
| `--local`                     | Forzar el runtime embebido local (omitir el Gateway)        |
| `--deliver`                   | Enviar la respuesta a un canal de chat                      |
| `--channel \<name\>`          | Canal de entrega (whatsapp, telegram, discord, slack, etc.) |
| `--reply-to \<target\>`       | Anulación del destino de entrega                            |
| `--reply-channel \<name\>`    | Anulación del canal de entrega                              |
| `--reply-account \<id\>`      | Anulación del id de cuenta de entrega                       |
| `--thinking \<level\>`        | Establecer el nivel de razonamiento para el perfil de modelo seleccionado |
| `--verbose \<on\|full\|off\>` | Establecer el nivel de detalle                              |
| `--timeout \<seconds\>`       | Anular el tiempo de espera del agente                       |
| `--json`                      | Generar JSON estructurado                                   |

## Comportamiento

- De forma predeterminada, la CLI pasa **a través del Gateway**. Añade `--local` para forzar el
  runtime embebido en la máquina actual.
- Pasa exactamente uno de `--message` o `--message-file`. Los mensajes de archivo conservan
  el contenido multilínea después de eliminar un BOM UTF-8 opcional.
- Si el Gateway no está disponible, la CLI **recurre** a la ejecución embebida local.
- Selección de sesión: `--to` deriva la clave de sesión (los destinos de grupo/canal
  conservan el aislamiento; los chats directos se contraen a `main`).
- `--session-key` selecciona una clave explícita. Las claves con prefijo de agente deben usar
  `agent:<agent-id>:<session-key>`, y `--agent` debe coincidir con ese id de agente cuando
  se proporcionan ambos. Las claves simples que no son centinela se acotan a `--agent` cuando
  se proporciona; por ejemplo, `--agent ops --session-key incident-42` enruta a
  `agent:ops:incident-42`. Sin `--agent`, las claves simples que no son centinela se acotan
  al agente predeterminado configurado. Los literales `global` y `unknown` permanecen
  sin ámbito solo cuando no se proporciona `--agent`; en ese caso, la reserva embebida
  y la propiedad del almacén usan el agente predeterminado configurado.
- Las flags de razonamiento y detalle persisten en el almacén de sesión.
- Salida: texto sin formato de forma predeterminada, o `--json` para carga estructurada + metadatos.
- Con `--json --deliver`, el JSON incluye el estado de entrega para envíos enviados,
  suprimidos, parciales y fallidos. Consulta
  [estado de entrega JSON](/es/cli/agent#json-delivery-status).

## Ejemplos

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

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
  <Card title="Referencia de la CLI de agentes" href="/es/cli/agent" icon="terminal">
    Referencia completa de flags y opciones de `openclaw agent`.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    Creación de subagentes en segundo plano.
  </Card>
  <Card title="Sesiones" href="/es/concepts/session" icon="comments">
    Cómo funcionan las claves de sesión y cómo `--to`, `--agent` y `--session-id` las resuelven.
  </Card>
  <Card title="Comandos de barra" href="/es/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos usado dentro de sesiones de agente.
  </Card>
</CardGroup>
