---
read_when:
    - Você quer apagar o estado local e manter a CLI instalada
    - Você quer uma simulação do que seria removido
summary: Referência da CLI para `openclaw reset` (redefinir estado/configuração local)
title: Redefinir
x-i18n:
    generated_at: "2026-07-12T15:03:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Redefine a configuração/o estado local (mantém a CLI instalada).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Opções

- `--scope <scope>`: `config`, `config+creds+sessions` ou `full`
- `--yes`: ignora as solicitações de confirmação
- `--non-interactive`: desativa as solicitações; requer `--scope` e `--yes`
- `--dry-run`: exibe as ações sem remover arquivos

## Escopos

| Escopo                  | Remove                                                                                                          | Interrompe o Gateway primeiro |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `config`                | somente o arquivo de configuração                                                                               | não                           |
| `config+creds+sessions` | arquivo de configuração, diretório de OAuth/credenciais e diretórios de sessão por agente                       | sim                           |
| `full`                  | diretório de estado (incluindo configuração/credenciais, se estiverem aninhadas nele), diretórios do workspace e atestações do workspace | sim                           |

`config+creds+sessions` e `full` interrompem um serviço gerenciado do Gateway em execução antes de excluir o estado.

## Observações

- Execute `openclaw backup create` primeiro para criar um snapshot restaurável antes de remover o estado local.
- Sem `--scope`, `openclaw reset` solicita interativamente o escopo a ser removido.
- `--non-interactive` só é válido quando `--scope` e `--yes` estão definidos.
- `config+creds+sessions` e `full` exibem `Next: openclaw onboard --install-daemon` ao concluir.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
