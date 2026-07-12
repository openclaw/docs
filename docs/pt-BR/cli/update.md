---
read_when:
    - Você quer atualizar um checkout do código-fonte com segurança
    - Você está depurando a saída ou as opções de `openclaw update`
    - Você precisa entender o comportamento da forma abreviada `--update`
summary: Referência da CLI para `openclaw update` (atualização razoavelmente segura do código-fonte + reinicialização automática do Gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-07-12T15:07:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db7b636b68e693824cb49ada2c176a4e394a3100ce33fff1c96ee20ae8427ee
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Atualize o OpenClaw e alterne entre os canais stable/extended-stable/beta/dev.

Se você instalou via **npm/pnpm/bun** (instalação global, sem metadados do git),
as atualizações seguem o fluxo do gerenciador de pacotes descrito em
[Atualização](/pt-BR/install/updating).

## Uso

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

`openclaw --update` é reescrito como `openclaw update` (útil para shells e
scripts de inicialização).

## Opções

| Sinalizador                                      | Descrição                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Ignora a reinicialização do serviço Gateway após uma atualização bem-sucedida. As atualizações pelo gerenciador de pacotes que reinicializam o serviço verificam se ele informa a versão esperada após a reinicialização antes que o comando seja concluído com sucesso.                                                                                    |
| `--channel <stable\|extended-stable\|beta\|dev>` | Define o canal de atualização e o mantém após a atualização bem-sucedida do núcleo. Extended-stable está disponível apenas para pacotes.                                                                                                                                                                                                                  |
| `--tag <dist-tag\|version\|spec>`                | Substitui o pacote de destino somente para esta atualização. Não pode ser combinado com um canal `extended-stable` efetivo, cujo destino exato verificado é obrigatório. Para outras instalações por pacote, `main` corresponde a `github:openclaw/openclaw#main`; especificações de origem GitHub/git são empacotadas em um tarball temporário antes da instalação global preparada pelo npm. |
| `--dry-run`                                      | Exibe uma prévia das ações planejadas (fluxo de canal/tag/destino/reinicialização) sem gravar a configuração, instalar, sincronizar plugins ou reinicializar.                                                                                                                                                                                              |
| `--json`                                         | Imprime JSON `UpdateRunResult` legível por máquina. Inclui `postUpdate.plugins.warnings` quando um plugin gerenciado precisa de reparo, detalhes do fallback de plugins do canal beta e `postUpdate.plugins.integrityDrifts` quando é detectada divergência nos artefatos de plugins npm durante a sincronização pós-atualização.                           |
| `--timeout <seconds>`                            | Tempo limite por etapa. Padrão: `1800`.                                                                                                                                                                                                                                                                                                                   |
| `--yes`                                          | Ignora solicitações de confirmação (por exemplo, confirmação de downgrade).                                                                                                                                                                                                                                                                               |
| `--acknowledge-clawhub-risk`                     | Permite que a sincronização de plugins pós-atualização prossiga apesar dos avisos de confiança da comunidade no ClawHub sem uma solicitação interativa. Sem esse sinalizador, versões arriscadas da comunidade são ignoradas e permanecem inalteradas quando o OpenClaw não pode solicitar confirmação. Pacotes oficiais do ClawHub e fontes de plugins incluídos ignoram essa solicitação. |

Não há um sinalizador `--verbose`. Use `--dry-run` para visualizar as ações
planejadas, `--json` para obter resultados legíveis por máquina e
`openclaw update status --json` somente para canal/disponibilidade. O nível de
detalhamento do console do Gateway (`--verbose`) e o nível de log do arquivo
(`logging.level: "debug"`/`"trace"`) são controles independentes; consulte
[Logs do Gateway](/pt-BR/gateway/logging).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), execuções de `openclaw update` que fazem alterações ficam desabilitadas. Em vez disso, atualize a origem Nix ou a entrada do flake desta instalação; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) com prioridade para o agente. `openclaw update status` e `openclaw update --dry-run` permanecem somente leitura.
</Note>

<Warning>
Downgrades exigem confirmação porque versões mais antigas podem danificar a configuração.
Se a instalação já tiver migrado as sessões para SQLite, restaure os artefatos
arquivados de transcrições legadas antes de iniciar uma versão mais antiga
baseada em arquivos. Consulte
[Doctor: downgrade após a migração das sessões para SQLite](/pt-BR/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Mostra o canal de atualização ativo, a tag/branch/SHA do git (somente em
checkouts do código-fonte) e a disponibilidade de atualizações.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Sinalizador           | Padrão  | Descrição                                |
| --------------------- | ------- | ---------------------------------------- |
| `--json`              | `false` | Imprime o JSON de status legível por máquina. |
| `--timeout <seconds>` | `3`     | Tempo limite para as verificações.       |

Para instalações de pacotes extended-stable, o status executa o mesmo seletor
público e a mesma verificação exata de pacote que a atualização em primeiro
plano. Ele pode informar `ahead of extended-stable` quando a versão instalada
é mais recente. Falhas no JSON incluem `registry.reason`
(`selector_missing`, `selector_query_failed`, `exact_package_mismatch` ou
`unsupported_git_channel`).

## `update repair`

Executa novamente a finalização da atualização depois que o pacote principal
já foi alterado, mas o trabalho de reparo posterior não foi concluído
corretamente. Esse é o caminho de recuperação compatível quando
`openclaw update` instalou o novo pacote principal, mas a sincronização de
plugins posterior, os metadados de plugins npm gerenciados, a atualização do
registro ou o reparo do Doctor não convergiram.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Sinalizador                                      | Descrição                                                                                                                                                                                                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Mantém o canal de atualização do núcleo antes do reparo. Para extended-stable, plugins npm oficiais qualificados que seguem a intenção padrão/sem especificação ou `latest` têm como destino a versão exata instalada do núcleo. O reparo de extended-stable é rejeitado em checkouts do Git sem alterar a configuração. |
| `--json`                                         | Imprime o JSON de finalização legível por máquina.                                                                                                                                                                                                                                       |
| `--timeout <seconds>`                            | Tempo limite das etapas de reparo. Padrão: `1800`.                                                                                                                                                                                                                                       |
| `--yes`                                          | Ignora solicitações de confirmação.                                                                                                                                                                                                                                                       |
| `--acknowledge-clawhub-risk`                     | Mesmo comportamento que em `openclaw update`.                                                                                                                                                                                                                                            |
| `--no-restart`                                   | Aceito por paridade; o reparo nunca reinicializa o Gateway.                                                                                                                                                                                                                              |

`update repair` executa `openclaw doctor --fix`, recarrega a configuração
reparada e os registros de instalação, sincroniza os plugins rastreados para o
canal de atualização ativo, atualiza as instalações de plugins npm gerenciados,
repara payloads ausentes de plugins configurados, atualiza o registro de
plugins e grava metadados convergentes dos registros de instalação.
Ele não instala um novo pacote principal nem reinicializa o Gateway.

## `update wizard`

Fluxo interativo para escolher um canal de atualização e confirmar se o
Gateway deve ser reinicializado depois (o padrão é reinicializar). Selecionar
`dev` sem um checkout do git oferece a opção de criar um.

| Sinalizador           | Padrão | Descrição                              |
| --------------------- | ------ | -------------------------------------- |
| `--timeout <seconds>` | `1800` | Tempo limite de cada etapa da atualização. |

## O que ele faz

Alternar canais explicitamente (`--channel ...`) também mantém o método de
instalação alinhado:

- `dev` -> garante um checkout do git (padrão: `~/openclaw`, ou
  `$OPENCLAW_HOME/openclaw` quando `OPENCLAW_HOME` estiver definido; substitua
  com `OPENCLAW_GIT_DIR`), atualiza-o e instala a CLI global a partir desse
  checkout.
- `stable` -> instala a partir do npm usando `latest`.
- `extended-stable` -> resolve o seletor público `extended-stable` do npm,
  verifica o pacote exato selecionado e instala essa versão exata. Não usa
  outro seletor como fallback e é rejeitado para checkouts do Git.
- `beta` -> dá preferência à dist-tag `beta` do npm, usando `latest` como
  fallback quando beta está ausente ou é mais antigo que a versão estável
  atual.

### Transferência da reinicialização

O atualizador automático do núcleo do Gateway (quando habilitado pela
configuração) inicia o caminho de atualização da CLI fora do manipulador de
solicitações ativo do Gateway. As atualizações do gerenciador de pacotes
`update.run` do plano de controle e as atualizações supervisionadas de
checkouts do git usam a mesma transferência para o serviço gerenciado, em vez
de substituir a árvore de pacotes ou recompilar `dist/` dentro do processo
ativo do Gateway: o Gateway inicia um auxiliar desacoplado e encerra, e esse
auxiliar executa `openclaw update --yes --json` fora da árvore de processos do
Gateway. Se a transferência não estiver disponível, `update.run` retorna uma
resposta estruturada com o comando de shell seguro que deve ser executado
manualmente.

As seleções extended-stable armazenadas recebem dicas de inicialização somente leitura e de atualização a cada 24 horas
quando `update.checkOnStart` está habilitado. Essas verificações nunca aplicam uma atualização,
iniciam uma transferência, reiniciam o Gateway, usam atraso/jitter do canal stable nem usam a
cadência de sondagem do canal beta. Atualizações explícitas em primeiro plano, atualizações simples em primeiro plano com
`update.channel: "extended-stable"` armazenado, status sob demanda e a transferência do
Gateway gerenciado correspondente continuam sendo compatíveis.

Quando um serviço local do Gateway gerenciado está instalado e a reinicialização está habilitada,
as atualizações pelo gerenciador de pacotes e por checkout do Git interrompem o serviço em execução antes de
substituir a árvore de pacotes ou modificar a saída do checkout/build. Em seguida, o atualizador
atualiza os metadados do serviço, reinicia o serviço e verifica o
Gateway reiniciado antes de informar `Gateway: restarted and verified.`.
Além disso, as atualizações pelo gerenciador de pacotes verificam se o Gateway reiniciado informa a
versão esperada do pacote; as atualizações por checkout do Git verificam a integridade do gateway e a
prontidão do serviço após a recompilação.

No macOS, a verificação pós-atualização também confirma se o LaunchAgent está
carregado/em execução para o perfil ativo e se a porta de loopback configurada está
funcionando corretamente. Se o plist estiver instalado, mas o launchd não estiver supervisionando-o, o OpenClaw
reinicializa automaticamente o bootstrap do LaunchAgent e executa novamente as verificações de integridade/versão/
prontidão do canal (um bootstrap novo carrega diretamente o trabalho `RunAtLoad`,
portanto a recuperação não executa imediatamente `kickstart -k` no Gateway recém-iniciado). Se
o Gateway ainda não ficar íntegro, o comando será encerrado com código diferente de zero e
exibirá o caminho do log de reinicialização, além de instruções para reiniciar, reinstalar e reverter
o pacote.

Se não for possível executar a reinicialização, o comando exibirá `Gateway: restart skipped (...)` ou
`Gateway: restart failed: ...` com uma dica para executar manualmente `openclaw gateway restart`.
Com `--no-restart`, a substituição do pacote ou a recompilação do Git ainda será executada, mas o
serviço gerenciado não será interrompido nem reiniciado, portanto o Gateway em execução continuará usando o código
antigo até que você o reinicie manualmente.

### Formato da resposta do plano de controle

Quando `update.run` é executado pelo plano de controle do Gateway em uma instalação
pelo gerenciador de pacotes ou em um checkout supervisionado do Git, o manipulador informa o início da transferência
separadamente da atualização da CLI que continua após o encerramento do Gateway:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` e
  `handoff.status: "started"`: o Gateway criou a transferência do serviço gerenciado
  e agendou sua própria reinicialização para que o auxiliar desacoplado possa executar
  `openclaw update --yes --json` fora do processo do serviço ativo.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` e
  `handoff.status: "unavailable"`: o OpenClaw não conseguiu encontrar um limite de
  serviço supervisor e uma identidade de serviço persistente para uma transferência segura (por
  exemplo, a transferência do systemd exige a identidade de unidade `OPENCLAW_SYSTEMD_UNIT`,
  não apenas marcadores de processo do systemd presentes no ambiente). A resposta inclui
  `handoff.command`, o comando de shell que deve ser executado fora do Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: o Gateway
  tentou criar a transferência, mas não conseguiu iniciar o auxiliar desacoplado.

O payload `sentinel` é gravado antes de o Gateway ser encerrado, e a transferência da CLI
atualiza essa mesma sentinela de reinicialização depois que as verificações de integridade da
reinicialização do serviço gerenciado são concluídas. Durante a transferência, a sentinela pode conter
`stats.reason: "restart-health-pending"` sem continuação de sucesso; o
Gateway reiniciado consulta a sentinela e dispara a continuação somente depois que a CLI
verifica a integridade do serviço e regrava a sentinela com o resultado `ok` final.
`openclaw status` e `openclaw status --all` exibem uma linha `Update restart`
enquanto essa sentinela está pendente ou apresenta falha, e `update.status` atualiza e
retorna a sentinela mais recente.

## Fluxo de checkout do Git

### Seleção do canal

- `stable`: faz checkout da tag não beta mais recente e, em seguida, executa o build e o doctor.
- `beta`: dá preferência à tag `-beta` mais recente, recorrendo à tag stable mais recente
  quando a beta não existe ou é mais antiga.
- `dev`: faz checkout de `main` e, em seguida, executa fetch e rebase.
- `extended-stable`: incompatível com checkouts do Git; nenhuma modificação no checkout
  ocorre.

### Etapas da atualização

<Steps>
  <Step title="Verificar se a árvore de trabalho está limpa">
    Exige que não haja alterações sem commit.
  </Step>
  <Step title="Trocar de canal">
    Troca para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Buscar do repositório upstream">
    Somente para dev.
  </Step>
  <Step title="Build de pré-verificação (somente dev)">
    Executa o build do TypeScript em uma árvore de trabalho temporária. Se a ponta falhar, retrocede até 10 commits para encontrar o commit compilável mais recente. Defina `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para também executar o lint durante essa pré-verificação; o lint é executado em modo serial restrito porque as máquinas de atualização dos usuários geralmente são menores que os executores de CI.
  </Step>
  <Step title="Executar rebase">
    Executa o rebase sobre o commit selecionado (somente dev).
  </Step>
  <Step title="Instalar dependências">
    Usa o gerenciador de pacotes do repositório. Para checkouts do pnpm, o atualizador inicializa o `pnpm` sob demanda (primeiro por meio do `corepack` e depois usando `npm install pnpm@11` temporariamente como alternativa), em vez de executar `npm run build` dentro de um workspace do pnpm. Se a inicialização do pnpm ainda falhar, o atualizador será interrompido antecipadamente com um erro específico do gerenciador de pacotes, em vez de tentar executar `npm run build` no checkout.
  </Step>
  <Step title="Compilar a interface de controle">
    Compila o gateway e a interface de controle.
  </Step>
  <Step title="Executar o doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza os plugins com o canal ativo. O canal dev usa plugins incluídos; stable e beta usam npm. Atualiza as instalações de plugins rastreadas.
  </Step>
</Steps>

### Detalhes da sincronização de plugins

No canal beta, as instalações rastreadas de plugins do npm e do ClawHub que seguem a
linha padrão/latest tentam primeiro uma versão `@beta` do plugin. Se o plugin não tiver uma
versão beta, o OpenClaw recorrerá à especificação padrão/latest registrada e
informará um aviso. Para plugins do npm, o OpenClaw também recorre à alternativa quando o pacote
beta existe, mas falha na validação da instalação. Esses avisos de uso de alternativa não
causam falha na atualização do núcleo. Versões exatas e tags explícitas nunca são regravadas.

<Warning>
Se uma atualização de plugin do npm fixada em uma versão exata for resolvida para um artefato cuja integridade difere do registro de instalação armazenado, `openclaw update` interromperá a atualização desse artefato do plugin em vez de instalá-lo. Reinstale ou atualize o plugin explicitamente somente depois de verificar que você confia no novo artefato.
</Warning>

<Note>
As falhas de sincronização de plugins pós-atualização que estejam limitadas a um plugin gerenciado e que o caminho de sincronização possa contornar (por exemplo, um registro npm inacessível para um plugin não essencial) são informadas como avisos depois que a atualização do núcleo é concluída com sucesso. O resultado JSON mantém o `status: "ok"` de atualização no nível superior e informa `postUpdate.plugins.status: "warning"` com orientações para executar `openclaw update repair` e `openclaw plugins inspect <id> --runtime --json`. Exceções inesperadas do atualizador ou da sincronização ainda causam falha no resultado da atualização. Corrija o erro de instalação ou atualização do plugin e execute novamente `openclaw update repair`.

Após a etapa de sincronização de cada plugin, `openclaw update` executa uma passagem obrigatória de **convergência pós-núcleo** antes que o gateway seja reiniciado: ela repara payloads ausentes de plugins configurados, valida no disco cada registro de instalação rastreado _ativo_ e verifica estaticamente se o respectivo `package.json` pode ser analisado (e se qualquer `main` declarado explicitamente existe). Falhas nessa passagem e um snapshot de configuração inválido retornam `postUpdate.plugins.status: "error"` e alteram o `status` da atualização no nível superior para `"error"`, portanto `openclaw update` é encerrado com código diferente de zero e o gateway _não_ é reiniciado com um conjunto de plugins não verificado. O erro inclui linhas estruturadas em `postUpdate.plugins.warnings[].guidance` que indicam `openclaw update repair` e `openclaw plugins inspect <id> --runtime --json`. Entradas de plugins desabilitados e registros que não sejam destinos oficiais de sincronização vinculados a uma fonte confiável são ignorados aqui (refletindo a política `skipDisabledPlugins` usada pela verificação de payload ausente), portanto um registro obsoleto de plugin desabilitado não pode bloquear uma atualização que, de outra forma, seria válida.

Quando o Gateway atualizado é iniciado, o carregamento de plugins é somente para verificação: a inicialização não executa gerenciadores de pacotes nem modifica árvores de dependências. As reinicializações de `update.run` pelo gerenciador de pacotes são transferidas para o caminho de serviço gerenciado da CLI, portanto a troca do pacote ocorre fora do processo antigo do Gateway, e as verificações de integridade do serviço determinam se a atualização pode ser informada como concluída.
</Note>

Depois que uma atualização do núcleo extended-stable é concluída com sucesso, a integridade e a
convergência de plugins pós-núcleo têm como destino os plugins npm oficiais elegíveis na versão exata
instalada do núcleo. Para a intenção padrão/`latest`, o OpenClaw não consulta
`@extended-stable` do plugin nem recorre ao `latest` do npm; ele deriva a versão do pacote
a partir do núcleo instalado. Fixações explícitas de versão, tags explícitas diferentes de `latest`,
pacotes de terceiros e fontes que não sejam npm mantêm sua intenção existente.

Para instalações pelo gerenciador de pacotes, `openclaw update` resolve a versão de destino do pacote
antes de invocar o gerenciador de pacotes. As instalações globais do npm usam uma instalação
preparada: o OpenClaw instala o novo pacote em um prefixo temporário do npm,
verifica ali o inventário de `dist` empacotado e, em seguida, troca essa árvore de pacotes limpa
para o prefixo global real. Se a verificação falhar, o doctor pós-atualização,
a sincronização de plugins e a reinicialização não serão executados a partir da árvore suspeita. Mesmo quando a
versão instalada já corresponde ao destino, o comando atualiza a
instalação global do pacote e, em seguida, executa a sincronização de plugins, uma atualização das
conclusões de comandos do núcleo e a reinicialização. Isso mantém os componentes auxiliares empacotados e os
registros de plugins pertencentes ao canal alinhados com o build instalado do OpenClaw, enquanto deixa as
recompilações completas das conclusões de comandos de plugins para execuções explícitas de
`openclaw completion --write-state`.

## Relacionados

- `openclaw doctor` (oferece executar primeiro a atualização em checkouts do Git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
