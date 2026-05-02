---
read_when:
    - Você quer atualizar um checkout do código-fonte com segurança
    - Você precisa entender o comportamento da abreviação `--update`
summary: Referência da CLI para `openclaw update` (atualização de código-fonte relativamente segura + reinicialização automática do Gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-05-02T20:44:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Atualize o OpenClaw com segurança e alterne entre os canais stable/beta/dev.

Se você instalou via **npm/pnpm/bun** (instalação global, sem metadados do git),
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

- `--no-restart`: pula a reinicialização do serviço Gateway após uma atualização bem-sucedida. Atualizações pelo gerenciador de pacotes que reiniciam o Gateway verificam se o serviço reiniciado informa a versão atualizada esperada antes de o comando ser concluído com sucesso.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: substitui o pacote de destino apenas para esta atualização. Para instalações de pacote, `main` mapeia para `github:openclaw/openclaw#main`.
- `--dry-run`: pré-visualiza as ações de atualização planejadas (fluxo de canal/tag/destino/reinicialização) sem gravar configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.integrityDrifts` quando divergência de artefatos de plugins npm é
  detectada durante a sincronização de plugins pós-atualização.
- `--timeout <seconds>`: tempo limite por etapa (o padrão é 1800s).
- `--yes`: pula prompts de confirmação (por exemplo, confirmação de downgrade).

<Warning>
Downgrades exigem confirmação porque versões mais antigas podem quebrar a configuração.
</Warning>

## `update status`

Mostra o canal de atualização ativo + tag/branch/SHA do git (para checkouts de código-fonte), além da disponibilidade de atualização.

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
após a atualização (o padrão é reiniciar). Se você selecionar `dev` sem um checkout do git, ele
oferece criar um.

Opções:

- `--timeout <seconds>`: tempo limite para cada etapa de atualização (padrão `1800`)

## O que ele faz

Quando você alterna canais explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout do git (padrão: `~/openclaw`, substitua com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala a partir do npm usando `latest`.
- `beta` → prefere a dist-tag npm `beta`, mas recorre a `latest` quando beta está
  ausente ou é mais antiga que a versão stable atual.

O atualizador automático do núcleo do Gateway (quando habilitado via configuração) inicia o caminho de atualização da CLI
fora do manipulador de requisições Gateway em execução. Atualizações do gerenciador de pacotes `update.run` do plano de controle
forçam uma reinicialização de atualização sem adiamento e sem cooldown após a troca do pacote,
porque o processo antigo do Gateway ainda pode ter pedaços em memória que apontam para
arquivos removidos pelo novo pacote.

Para instalações pelo gerenciador de pacotes, `openclaw update` resolve a versão do pacote
de destino antes de invocar o gerenciador de pacotes. Instalações globais npm usam uma instalação
em estágio: o OpenClaw instala o novo pacote em um prefixo npm temporário, verifica
o inventário `dist` empacotado ali e então troca essa árvore de pacote limpa para o
prefixo global real. Se a verificação falhar, o doctor pós-atualização, a sincronização de plugins e
o trabalho de reinicialização não são executados a partir da árvore suspeita. Mesmo quando a versão instalada
já corresponde ao destino, o comando atualiza a instalação global do pacote,
depois executa a sincronização de plugins, uma atualização de conclusão de comandos principais e o trabalho de reinicialização. Isso
mantém sidecars empacotados e registros de plugins pertencentes ao canal alinhados com a
build instalada do OpenClaw, deixando reconstruções completas de conclusão de comandos de plugins para
execuções explícitas de `openclaw completion --write-state`.

Quando um serviço Gateway gerenciado local está instalado e a reinicialização está habilitada,
atualizações pelo gerenciador de pacotes interrompem o serviço em execução antes de substituir a árvore
do pacote, depois atualizam os metadados do serviço a partir da instalação atualizada, reiniciam o
serviço e verificam se o Gateway reiniciado informa a versão esperada. Com
`--no-restart`, a substituição do pacote ainda é executada, mas o serviço gerenciado não é
interrompido nem reiniciado, então o Gateway em execução pode manter o código antigo até você reiniciá-lo
manualmente.

## Fluxo de checkout do git

### Seleção de canal

- `stable`: faz checkout da tag não beta mais recente e depois executa build e doctor.
- `beta`: prefere a tag `-beta` mais recente, mas recorre à tag stable mais recente quando beta está ausente ou é mais antiga.
- `dev`: faz checkout de `main` e depois faz fetch e rebase.

### Etapas de atualização

<Steps>
  <Step title="Verificar worktree limpa">
    Exige que não haja alterações sem commit.
  </Step>
  <Step title="Alternar canal">
    Alterna para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Buscar upstream">
    Apenas dev.
  </Step>
  <Step title="Build de pré-verificação (somente dev)">
    Executa lint e build TypeScript em uma worktree temporária. Se a ponta falhar, volta até 10 commits para encontrar a build limpa mais recente.
  </Step>
  <Step title="Rebase">
    Faz rebase sobre o commit selecionado (somente dev).
  </Step>
  <Step title="Instalar dependências">
    Usa o gerenciador de pacotes do repositório. Para checkouts pnpm, o atualizador inicializa `pnpm` sob demanda (primeiro via `corepack`, depois com fallback temporário `npm install pnpm@10`) em vez de executar `npm run build` dentro de um workspace pnpm.
  </Step>
  <Step title="Construir Control UI">
    Constrói o gateway e a Control UI.
  </Step>
  <Step title="Executar doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins com o canal ativo. Dev usa plugins agrupados; stable e beta usam npm. Atualiza instalações de plugins rastreadas.
  </Step>
</Steps>

No canal de atualização beta, instalações rastreadas de plugins npm e ClawHub que seguem
a linha default/latest tentam primeiro uma versão `@beta` do plugin. Se o plugin não tiver
versão beta, o OpenClaw recorre à especificação default/latest registrada. Versões
exatas e tags explícitas não são reescritas.

<Warning>
Se uma atualização exata de plugin npm fixada resolver para um artefato cuja integridade difere do registro de instalação armazenado, `openclaw update` aborta essa atualização de artefato de plugin em vez de instalá-la. Reinstale ou atualize o plugin explicitamente apenas depois de verificar que você confia no novo artefato.
</Warning>

<Note>
Falhas de sincronização de plugins pós-atualização falham o resultado da atualização e interrompem o trabalho de reinicialização subsequente. Corrija a instalação do plugin ou o erro de atualização e então execute `openclaw update` novamente.

Quando o Gateway atualizado inicia, o carregamento de plugins é apenas de verificação: a inicialização não executa gerenciadores de pacotes nem modifica árvores de dependências. Reinicializações de `update.run` do gerenciador de pacotes ignoram o adiamento ocioso normal e o cooldown de reinicialização depois que a árvore do pacote foi trocada, para que o processo antigo não possa continuar carregando preguiçosamente pedaços removidos.

Se a inicialização do pnpm ainda falhar, o atualizador para cedo com um erro específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.
</Note>

## Abreviação `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Relacionados

- `openclaw doctor` (oferece executar update primeiro em checkouts do git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
