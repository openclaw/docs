---
read_when:
    - Quiere activar ejecuciones del agente desde scripts o la línea de comandos
    - Es necesario enviar programáticamente las respuestas del agente a un canal de chat
summary: Ejecuta turnos del agente desde la CLI y, opcionalmente, envía las respuestas a los canales
title: Envío del agente
x-i18n:
    generated_at: "2026-07-21T09:04:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ad3da0feea102725ebb5555e0dd375ed6f3a0396d8ffd0ab916ced303201eabc
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` ejecuta un único turno del agente desde la línea de comandos sin un
mensaje de chat entrante. Se utiliza para flujos de trabajo con scripts, pruebas y
entrega programática. Referencia completa de opciones y comportamiento:
[Referencia de la CLI del agente](/es/cli/agent).

## Inicio rápido

<Steps>
  <Step title="Ejecutar un turno sencillo del agente">
    ```bash
    openclaw agent --agent main --message "¿Qué tiempo hace hoy?"
    ```

    Envía el mensaje a través del Gateway e imprime la respuesta.

  </Step>

  <Step title="Enviar una instrucción multilínea desde un archivo">
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

| Opción                      | Descripción                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | Mensaje en línea que se enviará                                      |
| `--message-file <path>`     | Lee el mensaje de un archivo UTF-8 válido (máximo de 4 MiB)          |
| `--to <dest>`               | Deriva la clave de sesión de un destino (teléfono, id de chat)       |
| `--session-key <key>`       | Utiliza una clave de sesión explícita                                |
| `--agent <id>`              | Selecciona un agente configurado (utiliza su sesión `main`)          |
| `--session-id <id>`         | Reutiliza una sesión existente por id                                |
| `--model <id>`              | Anulación del modelo para esta ejecución (`provider/model` o id del modelo) |
| `--local`                   | Fuerza el entorno de ejecución integrado local (omite el Gateway)    |
| `--deliver`                 | Envía la respuesta a un canal de chat                                |
| `--channel <name>`          | Canal de entrega; con `--agent` + `--to`, también se aplica al ámbito de mensajes directos |
| `--reply-to <target>`       | Anulación del destino de entrega                                     |
| `--reply-channel <name>`    | Anulación del canal de entrega                                       |
| `--reply-account <id>`      | Anulación del id de la cuenta de entrega                             |
| `--thinking <level>`        | Establece el nivel de razonamiento para el perfil de modelo seleccionado |
| `--verbose <on\|full\|off>` | Conserva el nivel de detalle de la sesión (`full` también registra la salida de las herramientas) |
| `--timeout <seconds>`       | Anula el tiempo de espera del agente (600 de forma predeterminada o el valor de configuración) |
| `--json`                    | Genera una salida JSON estructurada                                  |

## Comportamiento

- De forma predeterminada, la CLI pasa **por el Gateway**. Añada `--local` para forzar el
  entorno de ejecución integrado en la máquina actual.
- Proporcione exactamente una de las opciones `--message` o `--message-file`. Los mensajes de archivo conservan
  el contenido multilínea después de eliminar una marca BOM UTF-8 opcional. Los archivos de más de
  4 MiB se rechazan antes del envío.
- Tras los reintentos transitorios del protocolo de enlace, un tiempo de espera agotado o una conexión cerrada del Gateway
  hacen que el comando falle con una indicación en stderr; la CLI nunca vuelve a ejecutar silenciosamente el turno
  de forma integrada. Es posible que el Gateway aún complete un turno aceptado, por lo que se deben verificar el Gateway
  y el estado de la sesión antes de reintentarlo o volver a ejecutarlo con `--local`.
- Selección de sesión: `--to` deriva la clave de sesión (los destinos de grupo o canal
  mantienen el aislamiento; los chats directos se reducen a `main`). Al utilizar conjuntamente `--agent`,
  `--channel` y `--to`, el enrutamiento sigue el destinatario canónico del canal
  y `session.dmScope`. Las identidades estables exclusivamente salientes utilizan una
  sesión propiedad del proveedor y aislada de la sesión principal del agente.
- `--session-key` selecciona una clave explícita. Las claves con prefijo de agente deben utilizar
  `agent:<agent-id>:<session-key>`, y `--agent` debe coincidir con ese id de agente cuando
  se proporcionan ambas. Las claves simples que no sean centinelas se limitan al ámbito de `--agent` cuando
  se proporciona; por ejemplo, `--agent ops --session-key incident-42` se enruta a
  `agent:ops:incident-42`. Sin `--agent`, las claves simples que no sean centinelas se limitan al ámbito
  del agente predeterminado configurado. Los valores literales `global` y `unknown` solo permanecen
  sin ámbito cuando no se proporciona `--agent`.
- `--reply-channel` y `--reply-account` solo afectan a la entrega.
- Las opciones de razonamiento y nivel de detalle se conservan en el almacén de sesiones.
- Salida: texto sin formato de manera predeterminada, o `--json` para obtener una carga útil estructurada y metadatos.
- Con `--json --deliver`, el JSON incluye el estado de entrega de los envíos
  enviados, suprimidos, parciales y fallidos. Consulte
  [Estado de entrega JSON](/es/cli/agent#json-delivery-status).

## Ejemplos

```bash
# Turno sencillo con salida JSON
openclaw agent --to +15555550123 --message "Rastrea los registros" --verbose on --json

# Turno con una anulación del modelo
openclaw agent --agent ops --model openai/gpt-5.4 --message "Resume los registros"

# Turno con nivel de razonamiento
openclaw agent --session-id 1234 --message "Resume la bandeja de entrada" --thinking medium

# Instrucción multilínea desde un archivo
openclaw agent --agent ops --message-file ./task.md

# Clave de sesión exacta
openclaw agent --session-key agent:ops:incident-42 --message "Resume el estado"

# Clave heredada limitada al ámbito de un agente
openclaw agent --agent ops --session-key incident-42 --message "Resume el estado"

# Entregar a un canal distinto del de la sesión
openclaw agent --agent ops --message "Alerta" --deliver --reply-channel telegram --reply-to "@admin"
```

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Referencia de la CLI del agente" href="/es/cli/agent" icon="terminal">
    Referencia completa de opciones y parámetros de `openclaw agent`.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    Creación de subagentes en segundo plano.
  </Card>
  <Card title="Sesiones" href="/es/concepts/session" icon="comments">
    Cómo funcionan las claves de sesión y cómo las resuelven `--to`, `--agent` y `--session-id`.
  </Card>
  <Card title="Comandos con barra" href="/es/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos utilizado dentro de las sesiones del agente.
  </Card>
</CardGroup>
