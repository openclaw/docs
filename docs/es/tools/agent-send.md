---
read_when:
    - Quiere activar ejecuciones del agente desde scripts o la línea de comandos
    - Necesita entregar las respuestas del agente a un canal de chat mediante programación
summary: Ejecuta turnos del agente desde la CLI y, opcionalmente, envía las respuestas a los canales
title: Envío del agente
x-i18n:
    generated_at: "2026-07-12T14:53:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` ejecuta un único turno de agente desde la línea de comandos sin un
mensaje de chat entrante. Úselo para flujos de trabajo automatizados, pruebas y
entrega programática. Referencia completa de opciones y comportamiento:
[Referencia de la CLI de agentes](/es/cli/agent).

## Inicio rápido

<Steps>
  <Step title="Ejecutar un turno de agente sencillo">
    ```bash
    openclaw agent --agent main --message "¿Qué tiempo hace hoy?"
    ```

    Envía el mensaje a través del Gateway e imprime la respuesta.

  </Step>

  <Step title="Enviar un prompt multilínea desde un archivo">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Lee un archivo UTF-8 válido como cuerpo del mensaje del agente.

  </Step>

  <Step title="Seleccionar un agente o una sesión específicos">
    ```bash
    # Seleccionar un agente específico
    openclaw agent --agent ops --message "Resume los registros"

    # Seleccionar un número de teléfono (deriva la clave de sesión)
    openclaw agent --to +15555550123 --message "Actualización de estado"

    # Reutilizar una sesión existente
    openclaw agent --session-id abc123 --message "Continúa la tarea"

    # Seleccionar una clave de sesión exacta
    openclaw agent --session-key agent:ops:incident-42 --message "Resume el estado"
    ```

  </Step>

  <Step title="Entregar la respuesta a un canal">
    ```bash
    # Entregar a WhatsApp (canal predeterminado)
    openclaw agent --to +15555550123 --message "Informe listo" --deliver

    # Entregar a Slack
    openclaw agent --agent ops --message "Genera el informe" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Opciones

| Opción                      | Descripción                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| `--message <text>`          | Mensaje en línea que se enviará                                             |
| `--message-file <path>`     | Leer el mensaje desde un archivo UTF-8 válido                               |
| `--to <dest>`               | Derivar la clave de sesión de un destino (teléfono, id de chat)             |
| `--session-key <key>`       | Usar una clave de sesión explícita                                          |
| `--agent <id>`              | Seleccionar un agente configurado (usa su sesión `main`)                    |
| `--session-id <id>`         | Reutilizar una sesión existente por id                                      |
| `--model <id>`              | Sustitución del modelo para esta ejecución (`provider/model` o id de modelo) |
| `--local`                   | Forzar el entorno de ejecución local integrado (omitir el Gateway)          |
| `--deliver`                 | Enviar la respuesta a un canal de chat                                      |
| `--channel <name>`          | Canal de entrega; con `--agent` + `--to`, también aplica el ámbito de MD     |
| `--reply-to <target>`       | Sustitución del destino de entrega                                          |
| `--reply-channel <name>`    | Sustitución del canal de entrega                                            |
| `--reply-account <id>`      | Sustitución del id de la cuenta de entrega                                  |
| `--thinking <level>`        | Establecer el nivel de razonamiento para el perfil de modelo seleccionado   |
| `--verbose <on\|full\|off>` | Persistir el nivel de detalle de la sesión (`full` también registra la salida de las herramientas) |
| `--timeout <seconds>`       | Sustituir el tiempo de espera del agente (predeterminado: 600 o valor de configuración) |
| `--json`                    | Generar una salida JSON estructurada                                        |

## Comportamiento

- De forma predeterminada, la CLI pasa **a través del Gateway**. Añada `--local` para
  forzar el entorno de ejecución integrado en la máquina actual.
- Pase exactamente una de las opciones `--message` o `--message-file`. Los mensajes de archivo conservan
  el contenido multilínea después de eliminar una BOM UTF-8 opcional.
- Si la solicitud al Gateway falla, la CLI **recurre** a la ejecución local integrada;
  ante un tiempo de espera agotado del Gateway, recurre a una sesión nueva en lugar de competir con la
  transcripción original.
- Selección de sesión: `--to` deriva la clave de sesión (los destinos de grupo/canal
  conservan el aislamiento; los chats directos se agrupan en `main`). Cuando se usan juntos
  `--agent`, `--channel` y `--to`, el enrutamiento sigue al destinatario canónico del canal
  y `session.dmScope`. Las identidades estables solo de salida usan una sesión
  propiedad del proveedor y aislada de la sesión principal del agente.
- `--session-key` selecciona una clave explícita. Las claves con prefijo de agente deben usar
  `agent:<agent-id>:<session-key>`, y `--agent` debe coincidir con ese id de agente cuando
  se proporcionan ambos. Las claves simples que no son valores centinela se circunscriben a `--agent` cuando
  se proporciona; por ejemplo, `--agent ops --session-key incident-42` enruta a
  `agent:ops:incident-42`. Sin `--agent`, las claves simples que no son valores centinela se circunscriben
  al agente predeterminado configurado. Los literales `global` y `unknown` permanecen
  sin ámbito solo cuando no se proporciona `--agent`; la ruta alternativa integrada
  resuelve esas sesiones centinela al agente predeterminado configurado.
- `--reply-channel` y `--reply-account` solo afectan a la entrega.
- Las opciones de razonamiento y nivel de detalle se conservan en el almacén de sesiones.
- Salida: texto sin formato de manera predeterminada, o `--json` para una carga estructurada con metadatos.
- Con `--json --deliver`, el JSON incluye el estado de entrega de los envíos realizados,
  suprimidos, parciales y fallidos. Consulte
  [Estado de entrega JSON](/es/cli/agent#json-delivery-status).

## Ejemplos

```bash
# Turno sencillo con salida JSON
openclaw agent --to +15555550123 --message "Rastrea los registros" --verbose on --json

# Turno con una sustitución del modelo
openclaw agent --agent ops --model openai/gpt-5.4 --message "Resume los registros"

# Turno con nivel de razonamiento
openclaw agent --session-id 1234 --message "Resume la bandeja de entrada" --thinking medium

# Prompt multilínea desde un archivo
openclaw agent --agent ops --message-file ./task.md

# Clave de sesión exacta
openclaw agent --session-key agent:ops:incident-42 --message "Resume el estado"

# Clave heredada circunscrita a un agente
openclaw agent --agent ops --session-key incident-42 --message "Resume el estado"

# Entregar a un canal distinto del de la sesión
openclaw agent --agent ops --message "Alerta" --deliver --reply-channel telegram --reply-to "@admin"
```

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Referencia de la CLI de agentes" href="/es/cli/agent" icon="terminal">
    Referencia completa de opciones y parámetros de `openclaw agent`.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    Creación de subagentes en segundo plano.
  </Card>
  <Card title="Sesiones" href="/es/concepts/session" icon="comments">
    Cómo funcionan las claves de sesión y cómo las resuelven `--to`, `--agent` y `--session-id`.
  </Card>
  <Card title="Comandos con barra" href="/es/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos usado dentro de las sesiones de agente.
  </Card>
</CardGroup>
