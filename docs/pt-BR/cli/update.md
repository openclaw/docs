---
read_when:
    - Você quer atualizar um checkout do código-fonte com segurança
    - Você está depurando a saída ou as opções de `openclaw update`
    - Você precisa entender o comportamento da forma abreviada `--update`
summary: Referência da CLI para `openclaw update` (atualização do código-fonte relativamente segura + reinicialização automática do Gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-05-03T21:29:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
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

- `--no-restart`: ignora a reinicialização do serviço Gateway após uma atualização bem-sucedida. Atualizações por gerenciador de pacotes que reiniciam o Gateway verificam se o serviço reiniciado informa a versão atualizada esperada antes de o comando ser concluído com sucesso.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: substitui o destino do pacote somente para esta atualização. Para instalações de pacote, `main` é mapeado para `github:openclaw/openclaw#main`.
- `--dry-run`: pré-visualiza as ações de atualização planejadas (fluxo de canal/tag/destino/reinicialização) sem gravar configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.integrityDrifts` quando divergência de artefato de plugin npm é
  detectada durante a sincronização de plugins pós-atualização.
- `--timeout <seconds>`: tempo limite por etapa (o padrão é 1800s).
- `--yes`: ignora prompts de confirmação (por exemplo, confirmação de downgrade).

`openclaw update` não tem uma flag `--verbose`. Use `--dry-run` para pré-visualizar
as ações planejadas de canal/tag/instalação/reinicialização, `--json` para resultados
legíveis por máquina e `openclaw update status --json` quando você só precisar dos
detalhes de canal e disponibilidade. Se você estiver depurando logs do Gateway em torno de uma atualização,
a verbosidade do console e o nível de log em arquivo são separados: `--verbose` do Gateway afeta
a saída de terminal/WebSocket, enquanto logs em arquivo exigem `logging.level: "debug"` ou
`"trace"` na configuração. Veja [Logs do Gateway](/pt-BR/gateway/logging).

<Warning>
Downgrades exigem confirmação porque versões mais antigas podem quebrar a configuração.
</Warning>

## `update status`

Mostra o canal de atualização ativo + tag/branch/SHA do git (para checkouts de origem), além da disponibilidade de atualização.

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

- `dev` → garante um checkout git (padrão: `~/openclaw`, substitua com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala do npm usando `latest`.
- `beta` → prefere a dist-tag npm `beta`, mas recua para `latest` quando beta está
  ausente ou é mais antiga que a versão stable atual.

O atualizador automático do núcleo do Gateway (quando habilitado via configuração) inicia o caminho de atualização da CLI
fora do manipulador de requisições ativo do Gateway. Atualizações de gerenciador de pacotes
`update.run` do plano de controle forçam uma reinicialização de atualização não adiada e sem cooldown após a troca do pacote,
porque o processo antigo do Gateway ainda pode ter partes em memória apontando para
arquivos removidos pelo novo pacote.

Para instalações por gerenciador de pacotes, `openclaw update` resolve a versão
do pacote de destino antes de invocar o gerenciador de pacotes. Instalações globais npm usam uma instalação
em estágio: o OpenClaw instala o novo pacote em um prefixo npm temporário, verifica
o inventário `dist` empacotado ali e então troca essa árvore limpa de pacote para o
prefixo global real. Se a verificação falhar, o doctor pós-atualização, a sincronização de plugins e
o trabalho de reinicialização não rodam a partir da árvore suspeita. Mesmo quando a versão instalada
já corresponde ao destino, o comando atualiza a instalação global do pacote,
depois executa a sincronização de plugins, uma atualização de conclusão de comando principal e o trabalho de reinicialização. Isso
mantém sidecars empacotados e registros de plugins pertencentes ao canal alinhados com a
build instalada do OpenClaw, deixando reconstruções completas de conclusão de comandos de plugins para
execuções explícitas de `openclaw completion --write-state`.

Quando um serviço Gateway gerenciado local está instalado e a reinicialização está habilitada,
atualizações por gerenciador de pacotes param o serviço em execução antes de substituir a árvore
do pacote, depois atualizam os metadados do serviço a partir da instalação atualizada, reiniciam o
serviço e verificam se o Gateway reiniciado informa a versão esperada antes de
relatar sucesso. No macOS, a verificação pós-atualização também verifica se o LaunchAgent
está carregado/em execução para o perfil ativo e se a porta de local loopback configurada está
saudável. Se o plist está instalado, mas o launchd não o supervisiona, o OpenClaw
reexecuta o bootstrap do LaunchAgent automaticamente, depois executa novamente as
verificações de prontidão de saúde/versão/canal. Um bootstrap novo carrega o job RunAtLoad
diretamente, então a recuperação de atualização não executa imediatamente `kickstart -k` no Gateway
recém-iniciado. Se o Gateway ainda não ficar saudável, o comando sai
com código diferente de zero e imprime o caminho do log de reinicialização mais instruções explícitas de reinicialização, reinstalação e
rollback de pacote. Com `--no-restart`,
a substituição do pacote ainda é executada, mas o serviço gerenciado não é parado nem
reiniciado, então o Gateway em execução pode manter código antigo até que você o reinicie
manualmente.

## Fluxo de checkout git

### Seleção de canal

- `stable`: faz checkout da tag não beta mais recente, depois compila e executa o doctor.
- `beta`: prefere a tag `-beta` mais recente, mas recua para a tag stable mais recente quando beta está ausente ou é mais antiga.
- `dev`: faz checkout de `main`, depois busca e faz rebase.

### Etapas de atualização

<Steps>
  <Step title="Verificar worktree limpa">
    Exige ausência de alterações não commitadas.
  </Step>
  <Step title="Trocar canal">
    Troca para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Buscar upstream">
    Somente dev.
  </Step>
  <Step title="Build de preflight (somente dev)">
    Executa lint e build TypeScript em uma worktree temporária. Se a ponta falhar, volta até 10 commits para encontrar a build limpa mais nova.
  </Step>
  <Step title="Rebase">
    Faz rebase para o commit selecionado (somente dev).
  </Step>
  <Step title="Instalar dependências">
    Usa o gerenciador de pacotes do repo. Para checkouts pnpm, o atualizador inicializa `pnpm` sob demanda (via `corepack` primeiro, depois um fallback temporário `npm install pnpm@10`) em vez de executar `npm run build` dentro de um workspace pnpm.
  </Step>
  <Step title="Compilar a Control UI">
    Compila o gateway e a Control UI.
  </Step>
  <Step title="Executar doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins com o canal ativo. Dev usa plugins empacotados; stable e beta usam npm. Atualiza instalações de plugins rastreadas.
  </Step>
</Steps>

No canal de atualização beta, instalações rastreadas de plugins npm e ClawHub que seguem
a linha padrão/latest tentam primeiro uma versão `@beta` do plugin. Se o plugin não tiver
versão beta, o OpenClaw recua para a spec padrão/latest registrada. Versões
exatas e tags explícitas não são reescritas.

<Warning>
Se uma atualização de plugin npm fixada exata resolver para um artefato cuja integridade difere do registro de instalação armazenado, `openclaw update` aborta essa atualização de artefato de plugin em vez de instalá-la. Reinstale ou atualize o plugin explicitamente somente depois de verificar que você confia no novo artefato.
</Warning>

<Note>
Falhas de sincronização de plugins pós-atualização fazem o resultado da atualização falhar e interrompem o trabalho subsequente de reinicialização. Corrija a instalação do plugin ou o erro de atualização, depois execute novamente `openclaw update`.

Quando o Gateway atualizado inicia, o carregamento de plugins é somente verificação: a inicialização não executa gerenciadores de pacotes nem altera árvores de dependências. Reinicializações `update.run` por gerenciador de pacotes ignoram o adiamento ocioso normal e o cooldown de reinicialização depois que a árvore do pacote foi trocada, para que o processo antigo não possa continuar carregando de forma preguiçosa partes removidas.

Se o bootstrap do pnpm ainda falhar, o atualizador para cedo com um erro específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.
</Note>

## Atalho `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Relacionado

- `openclaw doctor` (oferece executar a atualização primeiro em checkouts git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
