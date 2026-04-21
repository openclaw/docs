---
read_when:
    - Quieres activar ejecuciones del agente desde scripts o la línea de comandos
    - Necesitas entregar mediante programación respuestas del agente a un canal de chat
summary: Ejecuta turnos del agente desde la CLI y, opcionalmente, entrega respuestas a canales
title: Envío del agente
x-i18n:
    generated_at: "2026-04-21T13:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# Envío del agente

`openclaw agent` ejecuta un solo turno del agente desde la línea de comandos sin necesitar
un mensaje entrante de chat. Úsalo para flujos de trabajo con scripts, pruebas y
entrega programática.

## Inicio rápido

<Steps>
  <Step title="Ejecuta un turno simple del agente">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Esto envía el mensaje a través del Gateway e imprime la respuesta.

  </Step>

  <Step title="Apunta a un agente o sesión específicos">
    ```bash
    # Apunta a un agente específico
    openclaw agent --agent ops --message "Summarize logs"

    # Apunta a un número de teléfono (deriva la clave de sesión)
    openclaw agent --to +15555550123 --message "Status update"

    # Reutiliza una sesión existente
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Entrega la respuesta a un canal">
    ```bash
    # Entrega a WhatsApp (canal predeterminado)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Entrega a Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Indicadores

| Indicador                     | Descripción                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Mensaje que se enviará (obligatorio)                        |
| `--to \<dest\>`               | Deriva la clave de sesión a partir de un destino (teléfono, id de chat) |
| `--agent \<id\>`              | Apunta a un agente configurado (usa su sesión `main`)       |
| `--session-id \<id\>`         | Reutiliza una sesión existente por id                       |
| `--local`                     | Fuerza el runtime integrado local (omite el Gateway)        |
| `--deliver`                   | Envía la respuesta a un canal de chat                       |
| `--channel \<name\>`          | Canal de entrega (whatsapp, telegram, discord, slack, etc.) |
| `--reply-to \<target\>`       | Anulación del destino de entrega                            |
| `--reply-channel \<name\>`    | Anulación del canal de entrega                              |
| `--reply-account \<id\>`      | Anulación del id de cuenta de entrega                       |
| `--thinking \<level\>`        | Establece el nivel de thinking para el perfil de modelo seleccionado |
| `--verbose \<on\|full\|off\>` | Establece el nivel de detalle                               |
| `--timeout \<seconds\>`       | Anula el tiempo de espera del agente                        |
| `--json`                      | Produce JSON estructurado                                   |

## Comportamiento

- De forma predeterminada, la CLI pasa **a través del Gateway**. Añade `--local` para forzar el
  runtime integrado en la máquina actual.
- Si no se puede acceder al Gateway, la CLI **recurre** a la ejecución integrada local.
- Selección de sesión: `--to` deriva la clave de sesión (los destinos de grupo/canal
  preservan el aislamiento; los chats directos se consolidan en `main`).
- Los indicadores de thinking y detalle persisten en el almacén de sesiones.
- Salida: texto sin formato de forma predeterminada, o `--json` para payload estructurado + metadatos.

## Ejemplos

```bash
# Turno simple con salida JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turno con nivel de thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Entrega a un canal diferente al de la sesión
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Relacionado

- [Referencia de la CLI del agente](/cli/agent)
- [Sub-agents](/es/tools/subagents) — generación de subagentes en segundo plano
- [Sessions](/es/concepts/session) — cómo funcionan las claves de sesión
