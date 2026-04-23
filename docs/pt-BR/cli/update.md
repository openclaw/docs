---
read_when:
    - Você quer atualizar um checkout do código-fonte com segurança
    - Você precisa entender o comportamento abreviado de `--update`
summary: Referência da CLI para `openclaw update` (atualização de código-fonte relativamente segura + reinicialização automática do Gateway)
title: update
x-i18n:
    generated_at: "2026-04-23T14:02:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Atualize o OpenClaw com segurança e alterne entre os canais stable/beta/dev.

Se você instalou via **npm/pnpm/bun** (instalação global, sem metadados git),
as atualizações acontecem pelo fluxo do gerenciador de pacotes em [Atualização](/pt-BR/install/updating).

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

- `--no-restart`: ignora a reinicialização do serviço Gateway após uma atualização bem-sucedida.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: substitui o alvo do pacote apenas para esta atualização. Para instalações por gerenciador de pacotes, `main` mapeia para `github:openclaw/openclaw#main`.
- `--dry-run`: mostra uma prévia das ações planejadas de atualização (canal/tag/alvo/fluxo de reinicialização) sem gravar configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.integrityDrifts` quando deriva de integridade de artefato de plugin npm é
  detectada durante a sincronização de plugins após a atualização.
- `--timeout <seconds>`: timeout por etapa (o padrão é 1200s).
- `--yes`: ignora prompts de confirmação (por exemplo, confirmação de downgrade)

Observação: downgrades exigem confirmação porque versões mais antigas podem quebrar a configuração.

## `update status`

Mostra o canal de atualização ativo + tag/branch/SHA do git (para checkouts do código-fonte), além da disponibilidade de atualização.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opções:

- `--json`: imprime JSON de status legível por máquina.
- `--timeout <seconds>`: timeout para verificações (o padrão é 3s).

## `update wizard`

Fluxo interativo para escolher um canal de atualização e confirmar se o Gateway deve ser reiniciado
após a atualização (o padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece criar um.

Opções:

- `--timeout <seconds>`: timeout para cada etapa da atualização (padrão `1200`)

## O que ele faz

Quando você troca de canal explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, substitua com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala do npm usando `latest`.
- `beta` → prefere a dist-tag `beta` do npm, mas volta para `latest` quando beta está
  ausente ou é mais antiga que a versão stable atual.

O atualizador automático do núcleo do Gateway (quando ativado via configuração) reutiliza esse mesmo caminho de atualização.

Para instalações por gerenciador de pacotes, `openclaw update` resolve a versão
de pacote alvo antes de invocar o gerenciador de pacotes. Se a versão instalada
corresponder exatamente ao alvo e nenhuma mudança de canal de atualização precisar ser persistida, o
comando sai como ignorado antes do trabalho de instalação do pacote, sincronização de plugins, atualização de conclusão
ou reinicialização do Gateway.

## Fluxo de checkout git

Canais:

- `stable`: faz checkout da tag não-beta mais recente, depois build + doctor.
- `beta`: prefere a tag `-beta` mais recente, mas volta para a tag stable mais recente
  quando beta está ausente ou é mais antiga.
- `dev`: faz checkout de `main`, depois fetch + rebase.

Visão geral:

1. Exige uma worktree limpa (sem alterações não commitadas).
2. Alterna para o canal selecionado (tag ou branch).
3. Faz fetch do upstream (apenas dev).
4. Apenas dev: executa lint de preflight + build TypeScript em uma worktree temporária; se o tip falhar, recua até 10 commits para encontrar o build limpo mais recente.
5. Faz rebase sobre o commit selecionado (apenas dev).
6. Instala dependências com o gerenciador de pacotes do repositório. Para checkouts com pnpm, o atualizador inicializa `pnpm` sob demanda (via `corepack` primeiro, depois um fallback temporário `npm install pnpm@10`) em vez de executar `npm run build` dentro de um workspace pnpm.
7. Faz build + build da UI de Controle.
8. Executa `openclaw doctor` como verificação final de “atualização segura”.
9. Sincroniza plugins com o canal ativo (dev usa plugins empacotados; stable/beta usa npm) e atualiza plugins instalados por npm.

Se uma atualização exata de plugin npm fixado resolver para um artefato cuja integridade
diferir do registro de instalação armazenado, `openclaw update` abortará essa atualização do
artefato do plugin em vez de instalá-la. Reinstale ou atualize o plugin
explicitamente somente depois de verificar que você confia no novo artefato.

Se a inicialização do pnpm ainda falhar, o atualizador agora interrompe cedo com um erro específico do gerenciador de pacotes, em vez de tentar `npm run build` dentro do checkout.

## Abreviação `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Veja também

- `openclaw doctor` (oferece executar a atualização primeiro em checkouts git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
