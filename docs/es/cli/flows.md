---
read_when:
    - Encontrará `openclaw flows` en documentación antigua o notas de la versión
    - Quieres una referencia rápida de inspección de TaskFlow
summary: 'Redirección: los comandos de flujo se encuentran en `openclaw tasks flow`'
title: Flujos (redirección)
x-i18n:
    generated_at: "2026-07-05T11:09:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

No existe ningún comando de nivel superior `openclaw flows`. La inspección duradera de TaskFlow se encuentra en `openclaw tasks flow`.

## Subcomandos

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Subcomando | Descripción                       | Argumentos / opciones                                                                                  |
| ---------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `list`     | Enumera los TaskFlows rastreados. | salida legible por máquina de `--json`; filtro `--status <name>` (consulta los valores de estado abajo). |
| `show`     | Muestra un TaskFlow.              | id. de flujo `<lookup>` o clave de propietario; salida legible por máquina de `--json`.                |
| `cancel`   | Cancela un TaskFlow en ejecución. | id. de flujo `<lookup>` o clave de propietario.                                                        |

`<lookup>` acepta un id. de flujo (devuelto por `list` / `show`) o la clave de propietario del flujo (el identificador estable que el subsistema propietario usa para rastrear el flujo).

### Valores del filtro de estado

`--status` en `list` acepta uno de los siguientes valores: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Ejemplos

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Para conceptos y creación de TaskFlow, consulta [TaskFlow](/es/automation/taskflow). Para el comando padre `tasks`, consulta la [referencia de la CLI de tasks](/es/cli/tasks).

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Automatización](/es/automation)
- [TaskFlow](/es/automation/taskflow)
