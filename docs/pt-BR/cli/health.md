---
read_when:
    - Você quer verificar rapidamente a integridade do Gateway em execução
summary: Referência da CLI para `openclaw health` (snapshot de integridade do Gateway via RPC)
title: Integridade
x-i18n:
    generated_at: "2026-04-24T05:45:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Busca a integridade no Gateway em execução.

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

- `openclaw health` por padrão consulta o gateway em execução para obter seu snapshot de integridade. Quando o
  gateway já tem um snapshot em cache recente, ele pode retornar essa carga em cache e
  atualizar em segundo plano.
- `--verbose` força uma sondagem em tempo real, imprime detalhes de conexão do gateway e expande a
  saída legível por humanos para todas as contas e agentes configurados.
- A saída inclui armazenamentos de sessão por agente quando vários agentes estão configurados.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Integridade do Gateway](/pt-BR/gateway/health)
