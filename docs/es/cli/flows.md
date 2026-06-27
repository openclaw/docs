---
read_when:
    - Encontrará `openclaw flows` en documentación antigua o notas de la versión
    - Quieres una referencia rápida de inspección de TaskFlow
summary: 'Redirección: los comandos de flujo están en `openclaw tasks flow`'
title: Flujos (redirección)
x-i18n:
    generated_at: "2026-05-11T20:26:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw tasks flow`

No hay un comando de nivel superior `openclaw flows`. La inspección persistente de TaskFlow está en `openclaw tasks flow`.

## Subcomandos

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Subcomando | Descripción                | Argumentos / opciones                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | Lista TaskFlows rastreados.    | salida legible por máquina `--json`; filtro `--status <name>` (consulta los valores de estado a continuación). |
| `show`     | Muestra un TaskFlow.         | id de flujo `<lookup>` o clave del propietario; salida legible por máquina `--json`.                    |
| `cancel`   | Cancela un TaskFlow en ejecución. | id de flujo `<lookup>` o clave del propietario.                                                      |

`<lookup>` acepta un id de flujo (devuelto por `list` / `show`) o la clave del propietario del flujo (el identificador estable que usa el subsistema propietario para rastrear el flujo).

### Valores del filtro de estado

`--status` en `list` acepta uno de:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Ejemplos

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Para ver los conceptos completos de TaskFlow y la creación, consulta [TaskFlow](/es/automation/taskflow). Para el comando principal `tasks`, consulta la [referencia de CLI de tasks](/es/cli/tasks).

## Relacionado

- [Referencia de CLI](/es/cli)
- [Automatización](/es/automation)
- [TaskFlow](/es/automation/taskflow)
