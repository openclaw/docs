---
read_when:
    - Você quer atualizar um checkout do código-fonte com segurança
    - Você precisa entender o comportamento abreviado de `--update`
summary: Referência da CLI para `openclaw update` (atualização de código-fonte relativamente segura + reinicialização automática do gateway)
title: Update
x-i18n:
    generated_at: "2026-04-26T11:26:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Atualize o OpenClaw com segurança e alterne entre os canais stable/beta/dev.

Se você instalou via **npm/pnpm/bun** (instalação global, sem metadados git),
as atualizações acontecem pelo fluxo do gerenciador de pacotes em [Atualizando](/pt-BR/install/updating).

## Uso

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opções

- `--no-restart`: ignora a reinicialização do serviço Gateway após uma atualização bem-sucedida. Atualizações pelo gerenciador de pacotes que reiniciam o Gateway verificam se o serviço reiniciado relata a versão atualizada esperada antes de o comando ser concluído com sucesso.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: substitui o alvo do pacote apenas para esta atualização. Para instalações por pacote, `main` é mapeado para `github:openclaw/openclaw#main`.
- `--dry-run`: visualiza as ações planejadas de atualização (canal/tag/alvo/fluxo de reinicialização) sem gravar configuração, instalar, sincronizar plugins nem reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.integrityDrifts` quando deriva de integridade de artefato de plugin npm é
  detectada durante a sincronização de plugins pós-atualização.
- `--timeout <seconds>`: tempo limite por etapa (o padrão é 1800s).
- `--yes`: ignora prompts de confirmação (por exemplo, confirmação de downgrade)

Observação: downgrades exigem confirmação porque versões antigas podem quebrar a configuração.

## `update status`

Mostra o canal de atualização ativo + tag/branch/SHA do git (para checkouts do código-fonte), além da disponibilidade de atualizações.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opções:

- `--json`: imprime JSON de status legível por máquina.
- `--timeout <seconds>`: tempo limite para verificações (o padrão é 3s).

## `update wizard`

Fluxo interativo para escolher um canal de atualização e confirmar se o Gateway deve ser reiniciado
após a atualização (o padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece criar um.

Opções:

- `--timeout <seconds>`: tempo limite para cada etapa da atualização (padrão `1800`)

## O que ele faz

Quando você alterna de canal explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, substitua com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala do npm usando `latest`.
- `beta` → prefere a dist-tag `beta` do npm, mas usa `latest` como fallback quando `beta` está
  ausente ou é mais antiga que a versão stable atual.

O atualizador automático do núcleo do Gateway (quando ativado via configuração) reutiliza esse mesmo caminho de atualização.

Para instalações por gerenciador de pacotes, `openclaw update` resolve a
versão-alvo do pacote antes de invocar o gerenciador de pacotes. Mesmo quando a versão
instalada já corresponde ao alvo, o comando atualiza a instalação global do pacote,
depois executa sincronização de plugins, atualização de completions e trabalho de reinicialização. Isso mantém sidecars empacotados
e registros de plugins pertencentes ao canal alinhados com a build
instalada do OpenClaw.

## Fluxo de checkout git

Canais:

- `stable`: faz checkout da tag não-beta mais recente, depois build + doctor.
- `beta`: prefere a tag `-beta` mais recente, mas usa como fallback a tag stable mais recente
  quando `beta` está ausente ou é mais antiga.
- `dev`: faz checkout de `main`, depois fetch + rebase.

Visão geral:

1. Exige um worktree limpo (sem alterações não commitadas).
2. Alterna para o canal selecionado (tag ou branch).
3. Faz fetch do upstream (apenas `dev`).
4. Apenas `dev`: executa lint de preflight + build de TypeScript em um worktree temporário; se a ponta falhar, recua até 10 commits para encontrar a build limpa mais recente.
5. Faz rebase sobre o commit selecionado (apenas `dev`).
6. Instala dependências com o gerenciador de pacotes do repositório. Para checkouts com pnpm, o atualizador inicializa `pnpm` sob demanda (via `corepack` primeiro, depois com fallback temporário `npm install pnpm@10`) em vez de executar `npm run build` dentro de um workspace pnpm.
7. Executa build + build da Control UI.
8. Executa `openclaw doctor` como verificação final de “atualização segura”.
9. Sincroniza plugins com o canal ativo (`dev` usa plugins empacotados; `stable`/`beta` usam npm) e atualiza plugins instalados por npm.

Se uma atualização exata fixada de plugin npm resolver para um artefato cuja integridade
difere do registro de instalação armazenado, `openclaw update` aborta essa atualização
do artefato do plugin em vez de instalá-la. Reinstale ou atualize o plugin
explicitamente apenas depois de verificar que você confia no novo artefato.

Falhas de sincronização de plugins pós-atualização fazem o resultado da atualização falhar e interrompem o trabalho
de reinicialização subsequente. Corrija o erro de instalação/atualização do plugin e depois execute novamente
`openclaw update`.

Se a inicialização do pnpm ainda falhar, o atualizador agora para mais cedo com um erro
específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.

## Abreviação `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Relacionados

- `openclaw doctor` (oferece executar update primeiro em checkouts git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualizando](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
