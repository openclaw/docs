---
read_when:
    - Você quer verificar rapidamente a integridade do Gateway em execução
summary: Referência da CLI para `openclaw health` (instantâneo da integridade do Gateway via RPC)
title: Saúde
x-i18n:
    generated_at: "2026-07-12T15:04:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Obtém um instantâneo de integridade do Gateway em execução por meio de RPC via WebSocket (sem conexões diretas aos canais pela CLI).

## Opções

| Sinalizador      | Padrão  | Descrição                                                                                                                 |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--json`         | `false` | Exibe JSON legível por máquina em vez de texto.                                                                           |
| `--timeout <ms>` | `10000` | Tempo limite de conexão em milissegundos.                                                                                 |
| `--verbose`      | `false` | Força uma sondagem em tempo real e expande a saída para todas as contas e todos os agentes configurados.                  |
| `--debug`        | `false` | Alias de `--verbose`.                                                                                                     |

Exemplos:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Comportamento

- Sem `--verbose`, o Gateway pode retornar um instantâneo armazenado em cache (atualizado há no máximo 60 segundos e sem alterações em relação ao estado de execução dos canais em tempo real) e atualizá-lo em segundo plano para o próximo solicitante.
- `--verbose` força uma sondagem em tempo real (sondagens das contas de cada canal), exibe os detalhes da conexão com o Gateway e expande a saída legível por humanos para todas as contas e todos os agentes configurados, em vez de apenas para o agente padrão.
- `--json` sempre retorna o instantâneo completo: canais, sondagens por conta, estado de carregamento dos plugins, estado de quarentena do mecanismo de contexto, estado do cache de preços dos modelos, integridade do loop de eventos e armazenamentos de sessões por agente.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [`openclaw status`](/pt-BR/cli/status) — diagnóstico local e sondagens de canais sem um instantâneo completo de integridade
- [Integridade do Gateway](/pt-BR/gateway/health)
