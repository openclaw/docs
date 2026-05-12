---
read_when:
    - Você quer atualizar um checkout do código-fonte com segurança
    - Você está depurando a saída ou as opções de `openclaw update`
    - Você precisa entender o comportamento abreviado de `--update`
summary: Referência da CLI para `openclaw update` (atualização de código-fonte relativamente segura + reinicialização automática do Gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-05-12T08:45:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93244af800aaa53c55a52f9593a7727910aa91acac9d1e34e89c39a95b133461
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Atualize o OpenClaw com segurança e alterne entre canais stable/beta/dev.

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

- `--no-restart`: ignora a reinicialização do serviço Gateway após uma atualização bem-sucedida. Atualizações pelo gerenciador de pacotes que reiniciam o Gateway verificam se o serviço reiniciado informa a versão atualizada esperada antes de o comando ser concluído com sucesso.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: substitui o destino do pacote apenas para esta atualização. Para instalações por pacote, `main` mapeia para `github:openclaw/openclaw#main`.
- `--dry-run`: visualiza as ações de atualização planejadas (fluxo de canal/tag/destino/reinicialização) sem gravar configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.warnings` quando plugins gerenciados corrompidos ou não carregáveis precisam de
  reparo após a atualização principal ser concluída, detalhes de fallback de plugins do canal beta
  quando um plugin não tem release beta, e `postUpdate.plugins.integrityDrifts`
  quando deriva de artefato de plugin npm é detectada durante a sincronização de plugins pós-atualização.
- `--timeout <seconds>`: tempo limite por etapa (o padrão é 1800s).
- `--yes`: ignora prompts de confirmação (por exemplo, confirmação de downgrade).

`openclaw update` não tem uma flag `--verbose`. Use `--dry-run` para visualizar
as ações planejadas de canal/tag/instalação/reinicialização, `--json` para resultados
legíveis por máquina e `openclaw update status --json` quando você só precisa de
detalhes de canal e disponibilidade. Se você está depurando logs do Gateway durante
uma atualização, a verbosidade do console e o nível de log em arquivo são separados: Gateway `--verbose` afeta
a saída de terminal/WebSocket, enquanto logs em arquivo exigem `logging.level: "debug"` ou
`"trace"` na configuração. Consulte [Logs do Gateway](/pt-BR/gateway/logging).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), execuções mutáveis de `openclaw update` são desabilitadas. Em vez disso, atualize a fonte Nix ou a entrada flake para esta instalação; para nix-openclaw, use o [Início Rápido](https://github.com/openclaw/nix-openclaw#quick-start) com agente primeiro. `openclaw update status` e `openclaw update --dry-run` continuam somente leitura.
</Note>

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

Fluxo interativo para escolher um canal de atualização e confirmar se deve reiniciar o Gateway
após a atualização (o padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece a criação de um.

Opções:

- `--timeout <seconds>`: tempo limite para cada etapa de atualização (padrão `1800`)

## O que ele faz

Quando você troca de canal explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, substitua com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala a partir do npm usando `latest`.
- `beta` → prefere a dist-tag npm `beta`, mas faz fallback para `latest` quando beta está
  ausente ou é mais antiga que a release stable atual.

O atualizador automático do núcleo do Gateway (quando habilitado via configuração) inicia o caminho de atualização da CLI
fora do manipulador de requisições do Gateway ativo. Atualizações `update.run` do plano de controle pelo gerenciador de pacotes
forçam uma reinicialização de atualização não adiada e sem cooldown após a troca do pacote,
porque o processo antigo do Gateway ainda pode ter chunks em memória que apontam para
arquivos removidos pelo novo pacote.

Para instalações por gerenciador de pacotes, `openclaw update` resolve a versão do pacote
de destino antes de invocar o gerenciador de pacotes. Instalações globais npm usam uma instalação
em estágio: o OpenClaw instala o novo pacote em um prefixo npm temporário, verifica
o inventário `dist` empacotado ali e então troca essa árvore de pacote limpa para o
prefixo global real. Se a verificação falhar, doctor pós-atualização, sincronização de plugins e
trabalho de reinicialização não são executados a partir da árvore suspeita. Mesmo quando a versão instalada
já corresponde ao destino, o comando atualiza a instalação global do pacote
e então executa sincronização de plugins, atualização de conclusão de comando principal e trabalho de reinicialização. Isso
mantém sidecars empacotados e registros de plugins pertencentes ao canal alinhados com a
build instalada do OpenClaw, enquanto deixa rebuilds completos de conclusão de comandos de plugins para
execuções explícitas de `openclaw completion --write-state`.

Quando um serviço Gateway gerenciado local está instalado e a reinicialização está habilitada,
atualizações pelo gerenciador de pacotes param o serviço em execução antes de substituir a árvore
do pacote, depois atualizam os metadados do serviço a partir da instalação atualizada, reiniciam o
serviço e verificam se o Gateway reiniciado informa a versão esperada antes de
relatar sucesso. No macOS, a verificação pós-atualização também verifica se o LaunchAgent
está carregado/em execução para o perfil ativo e se a porta local loopback configurada está
saudável. Se o plist estiver instalado, mas o launchd não o estiver supervisionando, o OpenClaw
refaz o bootstrap do LaunchAgent automaticamente e então executa novamente as
verificações de prontidão de integridade/versão/canal. Um bootstrap novo carrega o job RunAtLoad
diretamente, então a recuperação de atualização não executa imediatamente `kickstart -k` no Gateway
recém-iniciado. Se o Gateway ainda não ficar saudável, o comando sai
com valor diferente de zero e imprime o caminho do log de reinicialização mais instruções explícitas de reinicialização, reinstalação e
rollback de pacote. Com `--no-restart`,
a substituição do pacote ainda é executada, mas o serviço gerenciado não é parado nem
reiniciado, então o Gateway em execução pode manter o código antigo até você reiniciá-lo
manualmente.

## Fluxo de checkout git

### Seleção de canal

- `stable`: faz checkout da tag não beta mais recente, depois executa build e doctor.
- `beta`: prefere a tag `-beta` mais recente, mas faz fallback para a tag stable mais recente quando beta está ausente ou é mais antiga.
- `dev`: faz checkout de `main`, depois executa fetch e rebase.

### Etapas de atualização

<Steps>
  <Step title="Verificar worktree limpa">
    Não requer alterações não commitadas.
  </Step>
  <Step title="Trocar canal">
    Alterna para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Buscar upstream">
    Apenas dev.
  </Step>
  <Step title="Build de preflight (apenas dev)">
    Executa a build TypeScript em uma worktree temporária. Se a ponta falhar, volta até 10 commits para encontrar o commit mais novo que compila. Defina `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para também executar lint durante este preflight; o lint é executado em modo serial restrito porque hosts de atualização de usuários frequentemente são menores que executores de CI.
  </Step>
  <Step title="Rebase">
    Faz rebase sobre o commit selecionado (apenas dev).
  </Step>
  <Step title="Instalar dependências">
    Usa o gerenciador de pacotes do repositório. Para checkouts pnpm, o atualizador inicializa `pnpm` sob demanda (via `corepack` primeiro, depois um fallback temporário `npm install pnpm@11`) em vez de executar `npm run build` dentro de um workspace pnpm.
  </Step>
  <Step title="Compilar Control UI">
    Compila o gateway e a Control UI.
  </Step>
  <Step title="Executar doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins com o canal ativo. Dev usa plugins empacotados; stable e beta usam npm. Atualiza instalações rastreadas de plugins.
  </Step>
</Steps>

No canal de atualização beta, instalações rastreadas de plugins npm e ClawHub que seguem
a linha padrão/latest tentam primeiro uma release `@beta` do plugin. Se o plugin não tiver
release beta, o OpenClaw faz fallback para a spec default/latest registrada e relata
isso como um aviso. Para plugins npm, o OpenClaw também faz fallback quando o pacote
beta existe, mas falha na validação de instalação. Esses avisos de fallback de plugins não
fazem a atualização principal falhar. Versões exatas e tags explícitas não são
reescritas.

<Warning>
Se uma atualização de plugin npm fixada em versão exata resolver para um artefato cuja integridade difere do registro de instalação armazenado, `openclaw update` aborta essa atualização de artefato de plugin em vez de instalá-lo. Reinstale ou atualize o plugin explicitamente somente depois de verificar que você confia no novo artefato.
</Warning>

<Note>
Falhas de sincronização de plugins pós-atualização que são escopadas a um plugin gerenciado e que o caminho de sincronização consegue contornar (por exemplo, um registro npm inacessível para um plugin não essencial) são relatadas como avisos após a atualização principal ser concluída. O resultado JSON mantém o `status: "ok"` de nível superior da atualização e relata `postUpdate.plugins.status: "warning"` com orientações de `openclaw doctor --fix` e `openclaw plugins inspect <id> --runtime --json`. Exceções inesperadas do atualizador ou da sincronização ainda fazem o resultado da atualização falhar. Corrija a instalação do plugin ou o erro de atualização e então execute novamente `openclaw doctor --fix` ou `openclaw update`.

Após a etapa de sincronização por plugin, `openclaw update` executa uma passagem obrigatória de **convergência pós-núcleo** antes de o gateway ser reiniciado: ela repara payloads de plugins configurados ausentes, valida no disco cada registro de instalação rastreado _ativo_ e verifica estaticamente se seu `package.json` é analisável (e se qualquer `main` declarado explicitamente existe). Falhas dessa passagem — e um snapshot inválido de configuração do OpenClaw — retornam `postUpdate.plugins.status: "error"` e alteram o `status` de nível superior da atualização para `"error"`, então `openclaw update` sai com valor diferente de zero e o gateway _não_ é reiniciado com um conjunto de plugins não verificado. O erro inclui linhas estruturadas `postUpdate.plugins.warnings[].guidance` apontando para `openclaw doctor --fix` e `openclaw plugins inspect <id> --runtime --json` para acompanhamento. Entradas de plugins desabilitados e registros que não são destinos oficiais de sincronização vinculados a fontes confiáveis são ignorados aqui, refletindo a política `skipDisabledPlugins` usada pela verificação de payload ausente, então um registro de plugin desabilitado obsoleto não pode bloquear uma atualização que, de outra forma, seria válida.

Quando o Gateway atualizado inicia, o carregamento de plugins é apenas verificação: a inicialização não executa gerenciadores de pacotes nem altera árvores de dependências. Reinicializações `update.run` pelo gerenciador de pacotes ignoram a postergação ociosa normal e o cooldown de reinicialização depois que a árvore do pacote foi trocada, então o processo antigo não consegue continuar carregando chunks removidos de forma preguiçosa.

Se o bootstrap do pnpm ainda falhar, o atualizador para cedo com um erro específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.
</Note>

## Atalho `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Relacionado

- `openclaw doctor` (oferece executar a atualização primeiro em checkouts git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
