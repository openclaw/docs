---
read_when:
    - Você quer o preenchimento automático de comandos do shell para zsh/bash/fish/PowerShell
    - Você precisa armazenar em cache os scripts de conclusão no estado do OpenClaw
summary: Referência da CLI para `openclaw completion` (gerar/instalar scripts de conclusão automática do shell)
title: Conclusão
x-i18n:
    generated_at: "2026-07-11T23:47:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Gere scripts de preenchimento automático do shell, armazene-os em cache no estado do OpenClaw e, opcionalmente, instale-os no perfil do seu shell.

## Uso

```bash
openclaw completion                          # exibe o script zsh na saída padrão
openclaw completion --shell fish             # exibe o script fish
openclaw completion --write-state            # armazena em cache os scripts de todos os shells
openclaw completion --write-state --install  # armazena em cache e instala em uma única etapa
openclaw completion --shell bash --write-state
```

## Opções

- `-s, --shell <shell>`: shell de destino (`zsh`, `bash`, `powershell`, `fish`; padrão: `zsh`)
- `-i, --install`: instala o preenchimento automático adicionando ao perfil do shell uma linha que carrega o script armazenado em cache
- `--write-state`: grava os scripts de preenchimento automático em `$OPENCLAW_STATE_DIR/completions` (padrão: `~/.openclaw/completions`) sem exibi-los na saída padrão; com `--shell`, grava apenas o script desse shell; caso contrário, grava os scripts dos quatro shells
- `-y, --yes`: ignora as solicitações de confirmação da instalação (modo não interativo)

## Fluxo de instalação

`--install` configura seu perfil para usar o script armazenado em cache, portanto o cache precisa existir primeiro: se estiver ausente, o comando falhará e solicitará que você execute `openclaw completion --write-state`. Combine `--write-state --install` para realizar ambas as ações em uma única etapa. Sem `--shell`, `--install` detecta o shell por meio de `$SHELL` (usando zsh como alternativa).

A instalação grava um pequeno bloco `# OpenClaw Completion` no perfil do seu shell e substitui quaisquer linhas antigas e lentas no formato `source <(openclaw completion ...)` pela linha que carrega o script armazenado em cache:

| Shell      | Perfil                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (usa `~/.bash_profile` como alternativa quando `~/.bashrc` está ausente)                                                                                                      |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (no Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1` ou `Documents/WindowsPowerShell/...` para Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## Observações

- Sem `--install` ou `--write-state`, o comando exibe o script na saída padrão.
- A geração do preenchimento automático carrega antecipadamente toda a árvore de comandos, incluindo os comandos da CLI dos plugins, portanto os subcomandos aninhados são incluídos.
- `openclaw update` atualiza automaticamente o cache de preenchimento após uma atualização bem-sucedida; `openclaw doctor` pode corrigir configurações de preenchimento ausentes ou desatualizadas.

## Conteúdo relacionado

- [Referência da CLI](/pt-BR/cli)
