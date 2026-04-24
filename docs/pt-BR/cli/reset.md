---
read_when:
    - Você quer apagar o estado local mantendo a CLI instalada
    - Você quer uma simulação do que seria removido
summary: Referência da CLI para `openclaw reset` (redefinir estado/configuração local)
title: Redefinir
x-i18n:
    generated_at: "2026-04-24T05:46:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Redefine a configuração/estado local (mantém a CLI instalada).

Opções:

- `--scope <scope>`: `config`, `config+creds+sessions` ou `full`
- `--yes`: ignora prompts de confirmação
- `--non-interactive`: desabilita prompts; exige `--scope` e `--yes`
- `--dry-run`: imprime ações sem remover arquivos

Exemplos:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Observações:

- Execute `openclaw backup create` primeiro se quiser um snapshot restaurável antes de remover o estado local.
- Se você omitir `--scope`, `openclaw reset` usa um prompt interativo para escolher o que remover.
- `--non-interactive` só é válido quando `--scope` e `--yes` estão definidos.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
