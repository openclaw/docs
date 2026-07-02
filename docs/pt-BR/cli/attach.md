---
read_when:
    - Você quer que o Claude Code use as ferramentas MCP do OpenClaw Gateway
    - Você precisa de uma concessão MCP temporária vinculada à sessão para um harness externo
summary: Referência da CLI para `openclaw attach` (iniciar o Claude Code com uma concessão MCP Gateway com escopo)
title: Anexar CLI
x-i18n:
    generated_at: "2026-07-02T00:47:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` inicia o Claude Code com uma configuração MCP temporária estrita vinculada
a uma sessão do Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opções:

- `--session <key>` vincula a concessão a uma sessão do Gateway. O padrão é a sessão principal.
- `--ttl <ms>` solicita um TTL positivo para a concessão, em milissegundos. O Gateway aplica seu próprio limite máximo.
- `--bin <path>` seleciona o binário do Claude Code. O padrão é `claude`.
- `--print-config` grava o `.mcp.json` temporário, imprime o comando de inicialização e o ambiente, e mantém a concessão ativa até o TTL expirar.

O token de portador é passado por variáveis de ambiente, não por argv. O OpenClaw
inicia o Claude Code com `--strict-mcp-config --mcp-config <path>` para que os
servidores MCP do Claude do ambiente não entrem na sessão anexada. Inicializações normais revogam a
concessão quando o processo do Claude Code termina.

Veja também: [CLI do Gateway](/pt-BR/cli/gateway), [CLI MCP](/pt-BR/cli/mcp) e [CLI ACP](/pt-BR/cli/acp).
