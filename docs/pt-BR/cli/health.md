---
read_when:
    - Você quer verificar rapidamente a integridade do Gateway em execução
summary: Referência da CLI para `openclaw health` (instantâneo de integridade do Gateway via RPC)
title: Saúde
x-i18n:
    generated_at: "2026-05-10T19:28:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw health`

Busca a integridade do Gateway em execução.

## Opções

| Opção            | Padrão  | Descrição                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------- |
| `--json`         | `false` | Imprime JSON legível por máquina em vez de texto.                          |
| `--timeout <ms>` | `10000` | Tempo limite da conexão em milissegundos.                                  |
| `--verbose`      | `false` | Registro detalhado. Força uma sondagem ativa e expande a saída por agente. |
| `--debug`        | `false` | Alias para `--verbose`.                                                    |

Exemplos:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Observações:

- Por padrão, `openclaw health` solicita ao Gateway em execução o instantâneo de integridade. Quando o
  Gateway já tem um instantâneo em cache recente, ele pode retornar essa carga útil em cache e
  atualizar em segundo plano.
- `--verbose` força uma sondagem ativa, imprime os detalhes de conexão do Gateway e expande a
  saída legível por humanos em todas as contas e agentes configurados.
- A saída inclui armazenamentos de sessão por agente quando vários agentes estão configurados.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Integridade do Gateway](/pt-BR/gateway/health)
