---
read_when:
    - Você quer atualizar com segurança um checkout do código-fonte
    - Você está depurando a saída ou as opções de `openclaw update`
    - Você precisa entender o comportamento da notação abreviada `--update`
summary: Referência da CLI para `openclaw update` (atualização razoavelmente segura do código-fonte + reinicialização automática do Gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-07-16T12:23:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Atualize o OpenClaw e alterne entre os canais stable/extended-stable/beta/dev.

Se a instalação foi feita via **npm/pnpm/bun** (instalação global, sem metadados do git),
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

| Opção                                            | Descrição                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Não reinicia o serviço do Gateway após uma atualização bem-sucedida. As atualizações pelo gerenciador de pacotes que reiniciam o serviço verificam se o serviço reiniciado informa a versão esperada antes de o comando ser concluído com sucesso.                                                                                              |
| `--channel <stable\|extended-stable\|beta\|dev>` | Define o canal de atualização e o mantém após a atualização bem-sucedida do núcleo. Extended-stable está disponível somente por pacote.                                                                                                                                                                                                      |
| `--tag <dist-tag\|version\|spec>`                | Substitui o pacote de destino somente para esta atualização. Não pode ser combinado com um canal `extended-stable` efetivo, cujo destino exato verificado é obrigatório. Para outras instalações de pacotes, `main` é mapeado para `github:openclaw/openclaw#main`; especificações de origem do GitHub/git são empacotadas em um tarball temporário antes da instalação global preparada pelo npm. |
| `--dry-run`                                      | Visualiza as ações planejadas (fluxo de canal/tag/destino/reinicialização) sem gravar a configuração, instalar, sincronizar plugins ou reiniciar.                                                                                                                                                                                             |
| `--json`                                         | Exibe JSON `UpdateRunResult` legível por máquina. Inclui `postUpdate.plugins.warnings` quando um plugin gerenciado precisa de reparo, detalhes do fallback de plugins do canal beta e `postUpdate.plugins.integrityDrifts` quando é detectada divergência no artefato de um plugin npm durante a sincronização posterior à atualização.                                           |
| `--timeout <seconds>`                            | Tempo limite por etapa. Padrão: `1800`.                                                                                                                                                                                                                                                                                          |
| `--yes`                                          | Ignora as solicitações de confirmação (por exemplo, a confirmação de downgrade).                                                                                                                                                                                                                                                             |
| `--acknowledge-clawhub-risk`                     | Permite que a sincronização de plugins após a atualização prossiga apesar dos avisos de confiança do ClawHub para a comunidade, sem uma solicitação interativa. Sem essa opção, versões arriscadas da comunidade são ignoradas e permanecem inalteradas quando o OpenClaw não pode solicitar confirmação. Pacotes oficiais do ClawHub e fontes de plugins incluídos ignoram essa solicitação. |

Não há uma opção `--verbose`. Use `--dry-run` para visualizar as ações planejadas,
`--json` para resultados legíveis por máquina e `openclaw update status --json`
somente para canal/disponibilidade. O nível de detalhamento do console do Gateway (`--verbose`) e
o nível de log em arquivo (`logging.level: "debug"`/`"trace"`) são controles independentes; consulte
[Logs do Gateway](/pt-BR/gateway/logging).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), as execuções de `openclaw update` que fazem alterações são desabilitadas. Em vez disso, atualize a origem Nix ou a entrada do flake dessa instalação; para o nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) com prioridade para o agente. `openclaw update status` e `openclaw update --dry-run` permanecem somente leitura.
</Note>

<Warning>
Downgrades exigem confirmação porque versões anteriores podem corromper a configuração.
Se a instalação já tiver migrado sessões para o SQLite, restaure os artefatos arquivados
das transcrições legadas antes de iniciar uma versão anterior baseada em arquivos. Consulte
[Doctor: downgrade após a migração das sessões para o SQLite](/pt-BR/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Mostra o canal de atualização ativo, a tag/branch/SHA do git (somente em checkouts do código-fonte)
e a disponibilidade de atualizações.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Opção                 | Padrão  | Descrição                                |
| --------------------- | ------- | ---------------------------------------- |
| `--json`              | `false` | Exibe o JSON de status legível por máquina. |
| `--timeout <seconds>` | `3`     | Tempo limite para as verificações.       |

Para instalações por pacote extended-stable, o status realiza a mesma seleção pública
e verificação exata do pacote que a atualização em primeiro plano. Ele pode informar
`ahead of extended-stable` quando a versão instalada é mais recente. As falhas em JSON
incluem `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` ou `unsupported_git_channel`).

## `update repair`

Executa novamente a finalização da atualização após o pacote principal já ter sido alterado, mas o
trabalho de reparo posterior não ter sido concluído corretamente. Esse é o caminho de recuperação compatível quando
`openclaw update` instalou o novo pacote principal, mas a sincronização de plugins posterior à atualização do núcleo,
os metadados de plugins npm gerenciados, a atualização do registro ou o reparo do Doctor
não convergiram.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Opção                                            | Descrição                                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Mantém o canal de atualização do núcleo antes do reparo. Para extended-stable, plugins npm oficiais qualificados que seguem uma intenção simples/padrão ou `latest` têm como destino a versão exata instalada do núcleo. O reparo de extended-stable é rejeitado em checkouts do Git sem alterar a configuração. |
| `--json`                                         | Exibe o JSON de finalização legível por máquina.                                                                                                                                                                                                                                  |
| `--timeout <seconds>`                            | Tempo limite para as etapas de reparo. Padrão: `1800`.                                                                                                                                                                                                                 |
| `--yes`                                          | Ignora as solicitações de confirmação.                                                                                                                                                                                                                                            |
| `--acknowledge-clawhub-risk`                     | Mesmo comportamento que em `openclaw update`.                                                                                                                                                                                                                                    |
| `--no-restart`                                   | Aceito para manter a equivalência; o reparo nunca reinicia o Gateway.                                                                                                                                                                                                              |

`update repair` executa `openclaw doctor --fix`, recarrega a configuração reparada e
os registros de instalação, sincroniza os plugins rastreados para o canal de atualização ativo, atualiza
as instalações de plugins npm gerenciados, repara os conteúdos ausentes de plugins configurados,
atualiza o registro de plugins e grava metadados convergentes nos registros de instalação.
Ele não instala um novo pacote principal nem reinicia o Gateway.

## `update wizard`

Fluxo interativo para escolher um canal de atualização e confirmar se o
Gateway deve ser reiniciado depois (o padrão é reiniciar). Selecionar `dev` sem um checkout
do git oferece a opção de criar um.

| Opção                 | Padrão  | Descrição                           |
| --------------------- | ------- | ----------------------------------- |
| `--timeout <seconds>` | `1800`  | Tempo limite para cada etapa da atualização. |

## O que ele faz

Alternar explicitamente os canais (`--channel ...`) também mantém o método de instalação
alinhado:

- `dev` -> garante um checkout do git (o padrão é `~/openclaw`, ou
  `$OPENCLAW_HOME/openclaw` quando `OPENCLAW_HOME` está definido; substitua com
  `OPENCLAW_GIT_DIR`), atualiza-o e instala a CLI global a partir desse
  checkout.
- `stable` -> instala a partir do npm usando `latest`.
- `extended-stable` -> resolve o seletor público `extended-stable` do npm,
  verifica o pacote exato selecionado e instala essa versão exata. Ele
  não recorre a outro seletor como fallback e é rejeitado para checkouts do Git.
- `beta` -> prioriza a dist-tag `beta` do npm, recorrendo a `latest` quando a versão beta está
  ausente ou é anterior à versão stable atual.

### Transferência da reinicialização

O atualizador automático do núcleo do Gateway (quando habilitado pela configuração) inicia o caminho de
atualização da CLI fora do manipulador de solicitações ativo do Gateway. As atualizações pelo gerenciador de pacotes do
plano de controle `update.run` e as atualizações supervisionadas de checkouts do git usam
a mesma transferência para o serviço gerenciado, em vez de substituir a árvore de pacotes ou
recompilar `dist/` dentro do processo ativo do Gateway: o Gateway inicia um
auxiliar desanexado e encerra, e esse auxiliar executa `openclaw update --yes --json`
fora da árvore de processos do Gateway. Se a transferência não estiver disponível,
`update.run` retorna uma resposta estruturada com o comando seguro do shell que deve ser executado
manualmente.

As seleções de estabilidade estendida armazenadas recebem dicas de inicialização
somente leitura e de atualização a cada 24 horas quando `update.checkOnStart` está
habilitado. Essas verificações nunca aplicam uma atualização, iniciam uma
transferência, reiniciam o Gateway, usam atraso/jitter do canal estável nem usam
a cadência de sondagem beta. Atualizações explícitas em primeiro plano,
atualizações simples em primeiro plano com `update.channel: "extended-stable"` armazenado, status
sob demanda e a transferência do Gateway gerenciado correspondente continuam
sendo compatíveis.

Quando um serviço local de Gateway gerenciado está instalado e a reinicialização
está habilitada, as atualizações pelo gerenciador de pacotes e por checkout do
git interrompem o serviço em execução antes de substituir a árvore do pacote ou
modificar a saída do checkout/build. Em seguida, o atualizador renova os
metadados do serviço, reinicia o serviço e verifica o Gateway reiniciado antes
de informar `Gateway: restarted and verified.`. As atualizações pelo gerenciador de pacotes
também verificam se o Gateway reiniciado informa a versão esperada do pacote;
as atualizações por checkout do git verificam a integridade do gateway e a
prontidão do serviço após a recompilação.

As atualizações pelo gerenciador de pacotes normalmente continuam usando o
binário do Node registrado no serviço gerenciado. Se esse Node não puder
executar a versão de destino, mas o Node atual da CLI puder e for comprovado que
o serviço pertence ao pacote que está sendo atualizado, uma atualização com
reinicialização habilitada usa o Node atual para a finalização e reescreve os
metadados do serviço para esse runtime. `--no-restart` não pode reparar os
metadados do serviço, portanto a mesma incompatibilidade de runtime interrompe
o processo antes da modificação do pacote.

No macOS, a verificação pós-atualização também confirma se o LaunchAgent está
carregado/em execução para o perfil ativo e se a porta de loopback configurada
está íntegra. Se o plist estiver instalado, mas o launchd não o estiver
supervisionando, o OpenClaw reinicializa o bootstrap do LaunchAgent
automaticamente e executa novamente as verificações de integridade/versão/
prontidão do canal (um novo bootstrap carrega diretamente o trabalho
`RunAtLoad`, portanto a recuperação não `kickstart -k`
imediatamente o Gateway recém-iniciado). Se o Gateway ainda não ficar íntegro,
o comando será encerrado com código diferente de zero e exibirá o caminho do
log de reinicialização, além de instruções de reinicialização, reinstalação e
reversão do pacote.

Se não for possível executar a reinicialização, o comando exibirá
`Gateway: restart skipped (...)` ou `Gateway: restart failed: ...` com uma dica manual de
`openclaw gateway restart`. Com `--no-restart`, a substituição do pacote ou a
recompilação do git ainda é executada, mas o serviço gerenciado não é
interrompido nem reiniciado; portanto, o Gateway em execução mantém o código
antigo até ser reiniciado manualmente.

### Formato da resposta do plano de controle

Quando `update.run` é executado pelo plano de controle do Gateway em uma
instalação por gerenciador de pacotes ou um checkout do git supervisionado, o
manipulador informa o início da transferência separadamente da atualização da
CLI que continua após o encerramento do Gateway:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` e
  `handoff.status: "started"`: o Gateway criou a transferência do serviço gerenciado
  e agendou a própria reinicialização para que o auxiliar desanexado possa
  executar `openclaw update --yes --json` fora do processo ativo do serviço.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` e
  `handoff.status: "unavailable"`: o OpenClaw não conseguiu encontrar um limite de
  serviço supervisor e uma identidade durável de serviço para uma transferência
  segura (por exemplo, a transferência do systemd exige a identidade da unidade
  `OPENCLAW_SYSTEMD_UNIT`, não apenas marcadores de processo do systemd presentes no
  ambiente). A resposta inclui `handoff.command`, o comando de shell a ser
  executado fora do Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: o Gateway
  tentou criar a transferência, mas não conseguiu iniciar o auxiliar
  desanexado.

O payload `sentinel` é gravado antes do encerramento do Gateway, e a
transferência da CLI atualiza esse mesmo sentinela de reinicialização depois que
as verificações de integridade da reinicialização do serviço gerenciado são
concluídas. Durante a transferência, o sentinela pode conter
`stats.reason: "restart-health-pending"` sem continuação de sucesso; o Gateway reiniciado o consulta
periodicamente e aciona a continuação somente depois que a CLI verifica a
integridade do serviço e reescreve o sentinela com o resultado final
`ok`. `openclaw status` e `openclaw status --all` mostram uma linha
`Update restart` enquanto esse sentinela está pendente ou apresenta falha, e
`update.status` atualiza e retorna o sentinela mais recente.

## Fluxo de checkout do Git

### Seleção de canal

- `stable`: faz checkout da tag não beta mais recente e, em seguida, executa o build e o doctor.
- `beta`: dá preferência à tag `-beta` mais recente, recorrendo à tag estável mais recente
  quando a beta estiver ausente ou for mais antiga.
- `dev`: faz checkout de `main` e, em seguida, busca e executa o rebase.
- `extended-stable`: incompatível com checkouts do Git; nenhuma modificação
  do checkout ocorre.

### Etapas da atualização

<Steps>
  <Step title="Verificar se a árvore de trabalho está limpa">
    Exige que não haja alterações não confirmadas.
  </Step>
  <Step title="Alternar canal">
    Alterna para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Buscar do upstream">
    Somente para desenvolvimento.
  </Step>
  <Step title="Build de pré-verificação (somente desenvolvimento)">
    Executa o build do TypeScript em uma árvore de trabalho temporária. Se a ponta falhar, retrocede até 10 commits para encontrar o commit compilável mais recente. Defina `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para também executar o lint durante essa pré-verificação; o lint é executado no modo serial restrito porque as máquinas dos usuários que executam atualizações costumam ser menores que os runners de CI.
  </Step>
  <Step title="Executar rebase">
    Executa o rebase sobre o commit selecionado (somente desenvolvimento).
  </Step>
  <Step title="Instalar dependências">
    Usa o gerenciador de pacotes do repositório. Para checkouts do pnpm, o atualizador inicializa `pnpm` sob demanda (primeiro por meio de `corepack` e depois usando temporariamente `npm install pnpm@11` como alternativa), em vez de executar `npm run build` dentro de um workspace do pnpm. Se a inicialização do pnpm ainda falhar, o atualizador será interrompido antecipadamente com um erro específico do gerenciador de pacotes, em vez de tentar executar `npm run build` no checkout.
  </Step>
  <Step title="Compilar a interface de controle">
    Compila o gateway e a interface de controle.
  </Step>
  <Step title="Executar o doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza os plugins com o canal ativo. O desenvolvimento usa plugins incluídos; os canais estável e beta usam npm. Atualiza as instalações de plugins rastreadas.
  </Step>
</Steps>

### Detalhes da sincronização de plugins

No canal beta, as instalações rastreadas de plugins do npm e do ClawHub que
seguem a linha padrão/mais recente tentam primeiro uma versão
`@beta` do plugin. Se o plugin não tiver uma versão beta, o OpenClaw
recorrerá à especificação padrão/mais recente registrada e informará um aviso.
Para plugins do npm, o OpenClaw também recorrerá à alternativa quando o pacote
beta existir, mas falhar na validação da instalação. Esses avisos de alternativa
não causam falha na atualização do núcleo. Versões exatas e tags explícitas
nunca são reescritas.

<Warning>
Se uma atualização de plugin do npm fixada em uma versão exata for resolvida para um artefato cuja integridade seja diferente do registro de instalação armazenado, `openclaw update` interromperá a atualização desse artefato de plugin em vez de instalá-lo. Reinstale ou atualize o plugin explicitamente somente depois de verificar que o novo artefato é confiável.
</Warning>

<Note>
As falhas de sincronização de plugins após a atualização que estão restritas a um plugin gerenciado e que o caminho de sincronização consegue contornar (por exemplo, um registro npm inacessível para um plugin não essencial) são informadas como avisos após a conclusão bem-sucedida da atualização do núcleo. O resultado JSON mantém o `status: "ok"` da atualização no nível superior e informa `postUpdate.plugins.status: "warning"` com orientações de `openclaw update repair` e `openclaw plugins inspect <id> --runtime --json`. Exceções inesperadas do atualizador ou da sincronização ainda causam falha no resultado da atualização. Corrija o erro de instalação ou atualização do plugin e execute novamente `openclaw update repair`. Quando uma atualização com falha deixa um plugin gerenciado inutilizável, o OpenClaw desabilita sua entrada de runtime e redefine os slots ativos sem alterar a política `plugins.allow` ou `plugins.deny` criada pelo operador.

Após a etapa de sincronização de cada plugin, `openclaw update` executa uma passagem obrigatória de **convergência pós-núcleo** antes da reinicialização do gateway: ela repara payloads ausentes de plugins configurados, valida no disco cada registro de instalação rastreado _ativo_ e verifica estaticamente se seu `package.json` pode ser analisado (e se qualquer `main` declarado explicitamente existe). As falhas dessa passagem, bem como um snapshot de configuração inválido, retornam `postUpdate.plugins.status: "error"` e alteram o `status` da atualização no nível superior para `"error"`, fazendo com que `openclaw update` seja encerrado com código diferente de zero e que o gateway _não_ seja reiniciado com um conjunto de plugins não verificado. O erro inclui linhas estruturadas de `postUpdate.plugins.warnings[].guidance` que apontam para `openclaw update repair` e `openclaw plugins inspect <id> --runtime --json`. Entradas de plugins desabilitados e registros que não são destinos oficiais de sincronização vinculados a fontes confiáveis são ignorados aqui (refletindo a política `skipDisabledPlugins` usada pela verificação de payload ausente), portanto um registro obsoleto de plugin desabilitado não pode bloquear uma atualização que, de outra forma, seria válida.

Quando o Gateway atualizado é iniciado, o carregamento de plugins apenas faz verificações: a inicialização não executa gerenciadores de pacotes nem modifica árvores de dependências. As reinicializações `update.run` do gerenciador de pacotes são entregues ao caminho da CLI do serviço gerenciado, de modo que a troca de pacote ocorre fora do processo do Gateway antigo e as verificações de integridade do serviço determinam se a atualização pode ser informada como concluída.
</Note>

Após uma atualização bem-sucedida do núcleo de estabilidade estendida, a
integridade e a convergência pós-núcleo dos plugins têm como alvo os plugins npm
oficiais qualificados na versão exata instalada do núcleo. Para a intenção
padrão/`latest`, o OpenClaw não consulta o
`@extended-stable` do plugin nem recorre ao `latest` do npm; ele
deriva a versão do pacote a partir do núcleo instalado. Fixações de versão
explícitas, tags explícitas diferentes de `latest`, pacotes de
terceiros e fontes que não sejam npm mantêm a intenção existente.

Para instalações por gerenciador de pacotes, `openclaw update` resolve a
versão de destino do pacote antes de invocar o gerenciador de pacotes. As
instalações globais do npm usam uma instalação em estágio: o OpenClaw instala o
novo pacote em um prefixo temporário do npm, permite que o pacote candidato
valide a versão do Node do host durante `preinstall` e verifica ali o
inventário empacotado `dist`. Uma proteção de conclusão empacotada
permanece fora desse inventário até `preinstall` ser concluído com
sucesso; assim, os gerenciadores de pacotes que ignoram scripts de ciclo de vida
também são interrompidos antes da ativação. No npm 12 e posteriores, o
atualizador aprova somente o ciclo de vida do OpenClaw candidato; os scripts de
dependências transitivas permanecem bloqueados. Em seguida, o OpenClaw troca a
árvore de pacotes limpa pelo prefixo global real. Se a verificação falhar, o
doctor pós-atualização, a sincronização de plugins e o trabalho de
reinicialização não serão executados a partir da árvore suspeita. Mesmo quando a
versão instalada já corresponde à versão de destino, o comando renova a
instalação global do pacote e depois executa a sincronização de plugins, uma
renovação da conclusão dos comandos do núcleo e o trabalho de reinicialização.
Isso mantém os componentes auxiliares empacotados e os registros de plugins
pertencentes ao canal alinhados ao build instalado do OpenClaw, enquanto deixa
as recompilações completas da conclusão dos comandos de plugins para execuções
explícitas de `openclaw completion --write-state`.

## Relacionado

- `openclaw doctor` (oferece executar a atualização primeiro em checkouts do git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
