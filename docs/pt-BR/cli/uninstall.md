---
read_when:
    - Você quer remover o serviço do Gateway e/ou o estado local
    - Você quer fazer primeiro uma simulação sem aplicar alterações
summary: Referência da CLI para `openclaw uninstall` (remover o serviço do Gateway e os dados locais)
title: Desinstalar
x-i18n:
    generated_at: "2026-07-11T23:52:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Desinstale o serviço Gateway e/ou os dados locais. A própria CLI não é
removida; desinstale-a separadamente por meio do npm/pnpm.

## Opções

| Sinalizador         | Padrão  | Descrição                                                    |
| ------------------- | ------- | ------------------------------------------------------------ |
| `--service`         | `false` | Remove o serviço Gateway.                                    |
| `--state`           | `false` | Remove o estado e a configuração.                            |
| `--workspace`       | `false` | Remove os diretórios de espaço de trabalho.                  |
| `--app`             | `false` | Remove o aplicativo para macOS.                              |
| `--all`             | `false` | Atalho para `--service --state --workspace --app`.           |
| `--yes`             | `false` | Ignora as solicitações de confirmação.                       |
| `--non-interactive` | `false` | Desativa as solicitações; requer `--yes`.                    |
| `--dry-run`         | `false` | Exibe as ações planejadas sem remover arquivos.              |

Sem sinalizadores de escopo, uma seleção múltipla interativa solicita quais componentes
devem ser removidos (por padrão, serviço, estado e espaço de trabalho vêm pré-selecionados).

## Exemplos

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Observações

- Execute `openclaw backup create` primeiro para criar um instantâneo restaurável antes de remover
  o estado ou os espaços de trabalho.
- `--state` preserva os diretórios de espaço de trabalho configurados, a menos que `--workspace`
  também seja selecionado.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Desinstalação](/pt-BR/install/uninstall)
