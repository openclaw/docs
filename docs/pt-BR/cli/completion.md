---
read_when:
    - Você quer conclusões de shell para zsh/bash/fish/PowerShell
    - Você precisa armazenar em cache scripts de conclusão no estado do OpenClaw
summary: Referência de CLI para `openclaw completion` (gerar/instalar scripts de conclusão de shell)
title: Conclusão
x-i18n:
    generated_at: "2026-04-24T05:44:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Gere scripts de conclusão de shell e, opcionalmente, instale-os no perfil do seu shell.

## Uso

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Opções

- `-s, --shell <shell>`: shell de destino (`zsh`, `bash`, `powershell`, `fish`; padrão: `zsh`)
- `-i, --install`: instala a conclusão adicionando uma linha de source ao perfil do seu shell
- `--write-state`: grava o(s) script(s) de conclusão em `$OPENCLAW_STATE_DIR/completions` sem imprimir no stdout
- `-y, --yes`: ignora prompts de confirmação de instalação

## Observações

- `--install` grava um pequeno bloco "OpenClaw Completion" no perfil do seu shell e o aponta para o script em cache.
- Sem `--install` ou `--write-state`, o comando imprime o script no stdout.
- A geração de conclusão carrega antecipadamente as árvores de comandos para incluir subcomandos aninhados.

## Relacionado

- [Referência de CLI](/pt-BR/cli)
