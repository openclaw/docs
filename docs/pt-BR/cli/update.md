---
read_when:
    - Você quer atualizar um checkout do código-fonte com segurança
    - Você precisa entender o comportamento abreviado de `--update`
summary: Referência da CLI para `openclaw update` (atualização de código-fonte relativamente segura + reinicialização automática do gateway)
title: Atualização
x-i18n:
    generated_at: "2026-04-24T05:46:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
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

- `--no-restart`: ignora a reinicialização do serviço Gateway após uma atualização bem-sucedida.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: sobrescreve o alvo do pacote apenas para esta atualização. Para instalações por pacote, `main` é mapeado para `github:openclaw/openclaw#main`.
- `--dry-run`: mostra uma prévia das ações planejadas de atualização (canal/tag/alvo/fluxo de reinicialização) sem gravar configuração, instalar, sincronizar Plugins ou reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.integrityDrifts` quando desvio de integridade de artefato de Plugin npm é
  detectado durante a sincronização de Plugin pós-atualização.
- `--timeout <seconds>`: timeout por etapa (o padrão é 1200s).
- `--yes`: ignora prompts de confirmação (por exemplo, confirmação de downgrade)

Observação: downgrades exigem confirmação porque versões antigas podem quebrar a configuração.

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

- `--timeout <seconds>`: timeout para cada etapa de atualização (padrão `1200`)

## O que ele faz

Quando você troca de canal explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, sobrescreva com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala do npm usando `latest`.
- `beta` → prefere a dist-tag `beta` do npm, mas recua para `latest` quando `beta`
  está ausente ou é mais antiga que a versão stable atual.

O atualizador automático do core do Gateway (quando ativado via configuração) reutiliza este mesmo caminho de atualização.

Para instalações por gerenciador de pacotes, `openclaw update` resolve a versão
de pacote de destino antes de invocar o gerenciador de pacotes. Se a versão instalada
corresponder exatamente ao destino e não houver necessidade de persistir mudança de canal de atualização,
o comando sai como ignorado antes da instalação do pacote, sincronização de Plugin, atualização de conclusão
ou reinicialização do gateway.

## Fluxo de checkout git

Canais:

- `stable`: faz checkout da tag não beta mais recente e depois executa build + doctor.
- `beta`: prefere a tag `-beta` mais recente, mas recua para a tag stable mais recente
  quando `beta` está ausente ou é mais antiga.
- `dev`: faz checkout de `main` e depois executa fetch + rebase.

Em alto nível:

1. Exige um worktree limpo (sem alterações não commitadas).
2. Alterna para o canal selecionado (tag ou branch).
3. Executa fetch do upstream (somente dev).
4. Somente dev: executa lint de preflight + build TypeScript em um worktree temporário; se a ponta falhar, retrocede até 10 commits para encontrar a build limpa mais recente.
5. Faz rebase sobre o commit selecionado (somente dev).
6. Instala dependências com o gerenciador de pacotes do repositório. Para checkouts com pnpm, o atualizador inicializa `pnpm` sob demanda (primeiro via `corepack`, depois com fallback temporário `npm install pnpm@10`) em vez de executar `npm run build` dentro de um workspace pnpm.
7. Executa build + build da Control UI.
8. Executa `openclaw doctor` como verificação final de “atualização segura”.
9. Sincroniza Plugins com o canal ativo (dev usa Plugins empacotados; stable/beta usa npm) e atualiza Plugins instalados por npm.

Se uma atualização exata de Plugin npm fixado resolver para um artefato cuja integridade
for diferente do registro de instalação armazenado, `openclaw update` abortará essa atualização
de artefato de Plugin em vez de instalá-la. Reinstale ou atualize o Plugin explicitamente
apenas após verificar que você confia no novo artefato.

Se a inicialização do pnpm ainda falhar, o atualizador agora interrompe cedo com um erro
específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.

## Abreviação `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Relacionado

- `openclaw doctor` (oferece executar a atualização primeiro em checkouts git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualizando](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
