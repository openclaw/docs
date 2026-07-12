---
read_when:
    - Você encontra `openclaw flows` em documentações mais antigas ou notas de versão
    - Você quer uma referência rápida para inspecionar o TaskFlow
summary: 'Redirecionamento: os comandos de fluxo ficam em `openclaw tasks flow`'
title: Fluxos (redirecionamento)
x-i18n:
    generated_at: "2026-07-11T23:49:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Não há um comando de nível superior `openclaw flows`. A inspeção de TaskFlows duráveis fica em `openclaw tasks flow`.

## Subcomandos

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Subcomando | Descrição                        | Argumentos / opções                                                                           |
| ---------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| `list`     | Lista os TaskFlows monitorados.  | Saída legível por máquina com `--json`; filtro `--status <name>` (veja os valores abaixo).     |
| `show`     | Exibe um TaskFlow.               | ID do fluxo ou chave do proprietário em `<lookup>`; saída legível por máquina com `--json`.   |
| `cancel`   | Cancela um TaskFlow em execução. | ID do fluxo ou chave do proprietário em `<lookup>`.                                           |

`<lookup>` aceita um ID de fluxo (retornado por `list` / `show`) ou a chave do proprietário do fluxo (o identificador estável usado pelo subsistema proprietário para monitorar o fluxo).

### Valores do filtro de status

`--status` em `list` aceita um destes valores: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Exemplos

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Para conhecer os conceitos e a criação de TaskFlows, consulte [TaskFlow](/pt-BR/automation/taskflow). Para o comando pai `tasks`, consulte a [referência da CLI de `tasks`](/pt-BR/cli/tasks).

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Automação](/pt-BR/automation)
- [TaskFlow](/pt-BR/automation/taskflow)
