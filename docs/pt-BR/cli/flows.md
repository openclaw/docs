---
read_when:
    - Você encontra `openclaw flows` em documentação mais antiga ou notas de versão
    - Você quer uma referência rápida de inspeção do TaskFlow
summary: 'Redirecionamento: os comandos de fluxo ficam em `openclaw tasks flow`'
title: Fluxos (redirecionamento)
x-i18n:
    generated_at: "2026-05-10T19:27:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Não há comando de nível superior `openclaw flows`. A inspeção durável de TaskFlow fica em `openclaw tasks flow`.

## Subcomandos

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Subcomando | Descrição                | Argumentos / opções                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | Lista TaskFlows rastreados.    | Saída legível por máquina com `--json`; filtro `--status <name>` (veja os valores de status abaixo). |
| `show`     | Mostra um TaskFlow.         | `<lookup>` ID do fluxo ou chave do proprietário; saída legível por máquina com `--json`.                    |
| `cancel`   | Cancela um TaskFlow em execução. | `<lookup>` ID do fluxo ou chave do proprietário.                                                      |

`<lookup>` aceita um ID de fluxo (retornado por `list` / `show`) ou a chave do proprietário do fluxo (o identificador estável que o subsistema responsável usa para rastrear o fluxo).

### Valores do filtro de status

`--status` em `list` aceita um de:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Exemplos

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Para ver os conceitos completos de TaskFlow e criação, consulte [TaskFlow](/pt-BR/automation/taskflow). Para o comando pai `tasks`, consulte [referência da CLI de tasks](/pt-BR/cli/tasks).

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Automação](/pt-BR/automation)
- [TaskFlow](/pt-BR/automation/taskflow)
