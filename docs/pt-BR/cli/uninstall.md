---
read_when:
    - Você quer remover o serviço do gateway e/ou o estado local
    - Você quer primeiro um dry-run
summary: Referência da CLI para `openclaw uninstall` (remover serviço do gateway + dados locais)
title: Desinstalar
x-i18n:
    generated_at: "2026-04-24T05:46:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Desinstala o serviço do gateway + dados locais (a CLI permanece).

Opções:

- `--service`: remove o serviço do gateway
- `--state`: remove o estado e a configuração
- `--workspace`: remove diretórios de workspace
- `--app`: remove o app do macOS
- `--all`: remove serviço, estado, workspace e app
- `--yes`: ignora prompts de confirmação
- `--non-interactive`: desabilita prompts; requer `--yes`
- `--dry-run`: imprime as ações sem remover arquivos

Exemplos:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Observações:

- Execute `openclaw backup create` primeiro se quiser um snapshot restaurável antes de remover o estado ou workspaces.
- `--all` é um atalho para remover serviço, estado, workspace e app juntos.
- `--non-interactive` requer `--yes`.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Desinstalar](/pt-BR/install/uninstall)
