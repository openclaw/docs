---
read_when:
    - Você quer atualizar uma cópia de trabalho do código-fonte com segurança
    - Você precisa entender o comportamento da forma abreviada `--update`
summary: Referência da CLI para `openclaw update` (atualização do código-fonte relativamente segura + reinício automático do Gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-04-30T09:43:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
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

- `--no-restart`: ignora a reinicialização do serviço Gateway após uma atualização bem-sucedida. Atualizações pelo gerenciador de pacotes que reiniciam o Gateway verificam se o serviço reiniciado informa a versão atualizada esperada antes de o comando ser concluído com sucesso.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: substitui o destino do pacote somente para esta atualização. Para instalações por pacote, `main` mapeia para `github:openclaw/openclaw#main`.
- `--dry-run`: pré-visualiza as ações de atualização planejadas (fluxo de canal/tag/destino/reinicialização) sem gravar configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.integrityDrifts` quando desvio de artefato de Plugin npm é
  detectado durante a sincronização de Plugin pós-atualização.
- `--timeout <seconds>`: tempo limite por etapa (o padrão é 1800s).
- `--yes`: ignora solicitações de confirmação (por exemplo, confirmação de downgrade).

<Warning>
Downgrades exigem confirmação porque versões mais antigas podem quebrar a configuração.
</Warning>

## `update status`

Mostra o canal de atualização ativo + tag/branch/SHA git (para checkouts de origem), além da disponibilidade de atualização.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opções:

- `--json`: imprime JSON de status legível por máquina.
- `--timeout <seconds>`: tempo limite para verificações (o padrão é 3s).

## `update wizard`

Fluxo interativo para escolher um canal de atualização e confirmar se deve reiniciar o Gateway
após a atualização (o padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece criar um.

Opções:

- `--timeout <seconds>`: tempo limite para cada etapa de atualização (padrão `1800`)

## O que ele faz

Quando você alterna canais explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, substitua com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global desse checkout.
- `stable` → instala a partir do npm usando `latest`.
- `beta` → prefere a dist-tag npm `beta`, mas recua para `latest` quando beta está
  ausente ou é mais antigo que a versão stable atual.

O atualizador automático do núcleo do Gateway (quando habilitado via configuração) reutiliza esse mesmo caminho de atualização.

Para instalações por gerenciador de pacotes, `openclaw update` resolve a versão
do pacote de destino antes de invocar o gerenciador de pacotes. Instalações globais npm usam uma instalação em estágio:
o OpenClaw instala o novo pacote em um prefixo npm temporário, verifica
o inventário `dist` empacotado ali e então troca essa árvore de pacote limpa para o
prefixo global real. Se a verificação falhar, o doctor pós-atualização, a sincronização de plugins e
o trabalho de reinicialização não são executados a partir da árvore suspeita. Mesmo quando a versão instalada
já corresponde ao destino, o comando atualiza a instalação global do pacote,
então executa a sincronização de plugins, uma atualização de conclusão de comando do núcleo e o trabalho de reinicialização. Isso
mantém sidecars empacotados e registros de Plugin pertencentes ao canal alinhados com a
compilação instalada do OpenClaw, deixando reconstruções completas de conclusão de comando de Plugin para
execuções explícitas de `openclaw completion --write-state`.

Quando um serviço Gateway gerenciado local está instalado e a reinicialização está habilitada,
atualizações por gerenciador de pacotes param o serviço em execução antes de substituir a árvore
de pacotes, então atualizam os metadados do serviço a partir da instalação atualizada, reiniciam o
serviço e verificam se o Gateway reiniciado informa a versão esperada. Com
`--no-restart`, a substituição do pacote ainda é executada, mas o serviço gerenciado não é
parado nem reiniciado, então o Gateway em execução pode manter o código antigo até você reiniciá-lo
manualmente.

## Fluxo de checkout git

### Seleção de canal

- `stable`: faz checkout da tag não beta mais recente, depois compila e executa doctor.
- `beta`: prefere a tag `-beta` mais recente, mas recua para a tag stable mais recente quando beta está ausente ou é mais antiga.
- `dev`: faz checkout de `main`, depois busca e faz rebase.

### Etapas de atualização

<Steps>
  <Step title="Verificar worktree limpa">
    Exige que não haja alterações não confirmadas.
  </Step>
  <Step title="Alternar canal">
    Alterna para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Buscar upstream">
    Apenas dev.
  </Step>
  <Step title="Compilação preflight (somente dev)">
    Executa lint e compilação TypeScript em uma worktree temporária. Se a ponta falhar, volta até 10 commits para encontrar a compilação limpa mais recente.
  </Step>
  <Step title="Rebase">
    Faz rebase no commit selecionado (somente dev).
  </Step>
  <Step title="Instalar dependências">
    Usa o gerenciador de pacotes do repositório. Para checkouts pnpm, o atualizador inicializa `pnpm` sob demanda (via `corepack` primeiro, depois um fallback temporário `npm install pnpm@10`) em vez de executar `npm run build` dentro de um workspace pnpm.
  </Step>
  <Step title="Compilar Control UI">
    Compila o gateway e a Control UI.
  </Step>
  <Step title="Executar doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins com o canal ativo. Dev usa plugins incluídos; stable e beta usam npm. Atualiza plugins instalados via npm.
  </Step>
</Steps>

<Warning>
Se uma atualização exata de Plugin npm fixada resolver para um artefato cuja integridade difere do registro de instalação armazenado, `openclaw update` aborta essa atualização de artefato de Plugin em vez de instalá-la. Reinstale ou atualize o Plugin explicitamente somente depois de verificar que você confia no novo artefato.
</Warning>

<Note>
Falhas de sincronização de Plugin pós-atualização fazem o resultado da atualização falhar e interrompem o trabalho de reinicialização subsequente. Corrija o erro de instalação ou atualização do Plugin e então execute novamente `openclaw update`.

Quando o Gateway atualizado inicia, dependências de runtime de plugins incluídos habilitados são preparadas antes da ativação do Plugin. Reinicializações disparadas por atualização drenam qualquer preparação de dependência de runtime ativa antes de fechar o Gateway, então reinicializações do gerenciador de serviços não interrompem uma instalação npm em andamento.

Se a inicialização do pnpm ainda falhar, o atualizador para cedo com um erro específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.
</Note>

## Abreviação `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Relacionado

- `openclaw doctor` (oferece executar update primeiro em checkouts git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
