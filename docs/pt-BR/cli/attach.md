---
read_when:
    - Você quer que o Claude Code use as ferramentas MCP do Gateway do OpenClaw
    - Você precisa de uma concessão temporária de MCP vinculada à sessão para um harness externo
summary: Referência da CLI para `openclaw attach` (inicia o Claude Code com uma concessão MCP de Gateway com escopo definido)
title: Anexar CLI
x-i18n:
    generated_at: "2026-07-11T23:49:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` inicia o Claude Code com uma configuração MCP temporária e restrita, vinculada a uma sessão do Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opções:

- `--session <key>` vincula a concessão a uma sessão do Gateway. O padrão é a sessão principal.
- `--ttl <ms>` solicita um TTL positivo para a concessão, em milissegundos. O Gateway aplica seu próprio limite máximo.
- `--bin <path>` seleciona o binário do Claude Code. Padrão: `claude`.
- `--print-config` grava o `.mcp.json` temporário, exibe o comando de inicialização e as variáveis de ambiente e mantém a concessão ativa até o TTL expirar (não inicia o Claude Code nem revoga a concessão).

O token bearer é transmitido por variáveis de ambiente, não por argv. O OpenClaw inicia o Claude Code com `--strict-mcp-config --mcp-config <path>` para impedir que servidores MCP do Claude presentes no ambiente participem da sessão anexada. Inicializações normais (sem `--print-config`) revogam a concessão quando o processo do Claude Code é encerrado.

Consulte também: [CLI do Gateway](/pt-BR/cli/gateway), [CLI do MCP](/pt-BR/cli/mcp) e [CLI do ACP](/pt-BR/cli/acp).
