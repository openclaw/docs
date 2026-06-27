---
read_when:
    - Você quer remover o serviço Gateway e/ou o estado local
    - Você quer primeiro uma simulação
summary: Referência da CLI para `openclaw uninstall` (remover serviço Gateway + dados locais)
title: Desinstalar
x-i18n:
    generated_at: "2026-06-27T17:22:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Desinstale o serviço de Gateway + dados locais (a CLI permanece).

Opções:

- `--service`: remove o serviço de Gateway
- `--state`: remove estado e configuração
- `--workspace`: remove diretórios de espaço de trabalho
- `--app`: remove o aplicativo do macOS
- `--all`: remove serviço, estado, espaço de trabalho e aplicativo
- `--yes`: ignora prompts de confirmação
- `--non-interactive`: desativa prompts; exige `--yes`
- `--dry-run`: imprime ações sem remover arquivos

Exemplos:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Notas:

- Execute `openclaw backup create` primeiro se quiser um snapshot restaurável antes de remover estado ou espaços de trabalho.
- `--state` preserva os diretórios de espaço de trabalho configurados, a menos que `--workspace` também esteja selecionado.
- `--all` é um atalho para remover serviço, estado, espaço de trabalho e aplicativo juntos.
- `--non-interactive` exige `--yes`.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Desinstalar](/pt-BR/install/uninstall)
