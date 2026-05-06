---
read_when:
    - Você quer verificar rapidamente a integridade do Gateway em execução
summary: Referência da CLI para `openclaw health` (instantâneo de integridade do Gateway via RPC)
title: Saúde
x-i18n:
    generated_at: "2026-05-06T09:02:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Busca a integridade do Gateway em execução.

Opções:

- `--json`: saída legível por máquina
- `--timeout <ms>`: tempo limite de conexão em milissegundos (padrão `10000`)
- `--verbose`: registro detalhado
- `--debug`: alias para `--verbose`

Exemplos:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Observações:

- Por padrão, `openclaw health` solicita ao gateway em execução o snapshot de integridade. Quando o
  gateway já tem um snapshot recente em cache, ele pode retornar essa carga útil em cache e
  atualizar em segundo plano.
- `--verbose` força uma sondagem ao vivo, imprime detalhes da conexão do gateway e expande a
  saída legível por humanos em todas as contas e agentes configurados.
- A saída inclui armazenamentos de sessão por agente quando vários agentes estão configurados.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Integridade do Gateway](/pt-BR/gateway/health)
