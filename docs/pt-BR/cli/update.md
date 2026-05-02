---
read_when:
    - Você quer atualizar um checkout do código-fonte com segurança
    - Você precisa entender o comportamento da forma abreviada `--update`
summary: Referência da CLI para `openclaw update` (atualização relativamente segura da origem + reinício automático do Gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-05-02T05:44:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
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

- `--no-restart`: pula a reinicialização do serviço Gateway após uma atualização bem-sucedida. Atualizações por gerenciador de pacotes que reiniciam o Gateway verificam se o serviço reiniciado relata a versão atualizada esperada antes de o comando ser concluído com sucesso.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: sobrescreve o destino do pacote apenas para esta atualização. Para instalações por pacote, `main` mapeia para `github:openclaw/openclaw#main`.
- `--dry-run`: pré-visualiza as ações de atualização planejadas (canal/tag/destino/fluxo de reinicialização) sem gravar configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.integrityDrifts` quando desvio de artefato de Plugin npm é
  detectado durante a sincronização de plugins pós-atualização.
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
após a atualização (o padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece criar um.

Opções:

- `--timeout <seconds>`: tempo limite para cada etapa de atualização (padrão `1800`)

## O que ele faz

Quando você troca de canal explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, sobrescreva com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala a partir do npm usando `latest`.
- `beta` → prefere a dist-tag npm `beta`, mas recorre a `latest` quando beta está
  ausente ou é mais antigo que a versão stable atual.

O autoatualizador do núcleo do Gateway (quando habilitado via configuração) inicia o caminho de atualização da CLI
fora do manipulador de requisições do Gateway em execução. Atualizações por gerenciador de pacotes
`update.run` do plano de controle forçam uma reinicialização de atualização sem adiamento e sem cooldown após a troca do pacote,
porque o processo antigo do Gateway ainda pode ter chunks em memória que apontam para
arquivos removidos pelo novo pacote.

Para instalações por gerenciador de pacotes, `openclaw update` resolve a versão do pacote de destino
antes de invocar o gerenciador de pacotes. Instalações globais npm usam uma instalação em estágio:
o OpenClaw instala o novo pacote em um prefixo npm temporário, verifica ali o inventário
do `dist` empacotado e então troca essa árvore de pacote limpa para o
prefixo global real. Se a verificação falhar, o doctor pós-atualização, a sincronização de plugins e o
trabalho de reinicialização não são executados a partir da árvore suspeita. Mesmo quando a versão instalada
já corresponde ao destino, o comando atualiza a instalação global do pacote,
depois executa a sincronização de plugins, uma atualização de conclusão de comandos do núcleo e o trabalho de reinicialização. Isso
mantém sidecars empacotados e registros de plugins pertencentes ao canal alinhados com o
build instalado do OpenClaw, deixando recompilações completas de conclusão de comandos de Plugin para
execuções explícitas de `openclaw completion --write-state`.

Quando um serviço Gateway gerenciado local está instalado e a reinicialização está habilitada,
atualizações por gerenciador de pacotes param o serviço em execução antes de substituir a árvore
do pacote, depois atualizam os metadados do serviço a partir da instalação atualizada, reiniciam o
serviço e verificam se o Gateway reiniciado relata a versão esperada. Com
`--no-restart`, a substituição do pacote ainda é executada, mas o serviço gerenciado não é
parado nem reiniciado, então o Gateway em execução pode manter o código antigo até que você o reinicie
manualmente.

## Fluxo de checkout git

### Seleção de canal

- `stable`: faz checkout da tag não beta mais recente, depois compila e executa o doctor.
- `beta`: prefere a tag `-beta` mais recente, mas recorre à tag stable mais recente quando beta está ausente ou é mais antigo.
- `dev`: faz checkout de `main`, depois busca e faz rebase.

### Etapas da atualização

<Steps>
  <Step title="Verificar worktree limpa">
    Exige que não haja alterações não commitadas.
  </Step>
  <Step title="Trocar canal">
    Troca para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Buscar upstream">
    Apenas dev.
  </Step>
  <Step title="Build de preflight (apenas dev)">
    Executa lint e build TypeScript em uma worktree temporária. Se a ponta falhar, volta até 10 commits para encontrar o build limpo mais recente.
  </Step>
  <Step title="Rebase">
    Faz rebase sobre o commit selecionado (apenas dev).
  </Step>
  <Step title="Instalar dependências">
    Usa o gerenciador de pacotes do repo. Para checkouts pnpm, o atualizador inicializa `pnpm` sob demanda (via `corepack` primeiro, depois um fallback temporário `npm install pnpm@10`) em vez de executar `npm run build` dentro de um workspace pnpm.
  </Step>
  <Step title="Compilar Control UI">
    Compila o Gateway e a Control UI.
  </Step>
  <Step title="Executar doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins para o canal ativo. Dev usa plugins incluídos; stable e beta usam npm. Atualiza plugins instalados pelo npm.
  </Step>
</Steps>

<Warning>
Se uma atualização exata de Plugin npm fixado resolver para um artefato cuja integridade difere do registro de instalação armazenado, `openclaw update` aborta essa atualização de artefato de Plugin em vez de instalá-lo. Reinstale ou atualize o Plugin explicitamente somente após verificar que você confia no novo artefato.
</Warning>

<Note>
Falhas na sincronização de plugins pós-atualização fazem o resultado da atualização falhar e interrompem o trabalho de reinicialização seguinte. Corrija o erro de instalação ou atualização do Plugin e depois execute `openclaw update` novamente.

Quando o Gateway atualizado inicia, o carregamento de plugins é somente verificação: a inicialização não executa gerenciadores de pacotes nem altera árvores de dependências. Reinicializações de `update.run` do gerenciador de pacotes ignoram o adiamento ocioso normal e o cooldown de reinicialização depois que a árvore do pacote foi trocada, para que o processo antigo não consiga continuar carregando chunks removidos sob demanda.

Se a inicialização do pnpm ainda falhar, o atualizador para cedo com um erro específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.
</Note>

## Abreviação `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Relacionado

- `openclaw doctor` (oferece executar update primeiro em checkouts git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
