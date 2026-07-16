---
read_when:
    - Você quer um quadro de trabalho no estilo Kanban na interface de controle
    - Você está ativando ou desativando o plugin Workboard incluído no pacote
    - Você quer acompanhar o trabalho planejado do agente sem um gerenciador de projetos externo
summary: Quadro de trabalho opcional no painel para cartões gerenciados por agentes e transferência de sessão
title: Plugin Workboard
x-i18n:
    generated_at: "2026-07-16T12:49:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

O plugin Workboard adiciona um quadro opcional no estilo Kanban à
[UI de Controle](/pt-BR/web/control-ui): cartões de trabalho dimensionados para agentes, atribuição a agentes
e um link de retorno para a tarefa, a execução e a sessão do painel do cartão.

O Workboard é intencionalmente pequeno: ele acompanha o trabalho operacional local de um
Gateway OpenClaw. Ele não substitui GitHub Issues, Linear, Jira nem
outros sistemas de gerenciamento de projetos de equipe.

## Habilitá-lo

O Workboard vem incluído, mas fica desabilitado por padrão:

1. Abra **Plugins** na UI de Controle ou use `/settings/plugins` em relação ao
   caminho base configurado da UI de Controle. Por exemplo, um caminho base de `/openclaw`
   usa `/openclaw/settings/plugins`.
2. Localize **Workboard** e escolha **Habilitar**. Como o Workboard está incluído no
   OpenClaw, ele não precisa de uma ação **Instalar**.
3. Se a UI informar que é necessário reiniciar, reinicie o Gateway.

A guia Workboard aparece na navegação do painel após o runtime do plugin ser carregado.
Enquanto ele estiver desabilitado, a guia permanecerá oculta na navegação. Abrir a rota
`/workboard` diretamente enquanto o plugin estiver desabilitado ou bloqueado por
`plugins.allow`/`plugins.deny` exibirá um estado de plugin indisponível em vez dos dados
dos cartões.

O fluxo de trabalho equivalente na CLI é:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configuração

O Workboard não tem configuração específica do plugin. Habilite ou desabilite-o com a entrada
padrão do plugin:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Campos do cartão

| Campo       | Valores                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | strings de formato livre                                                                                             |
| `agentId`   | agente atribuído opcional                                                                                       |
| referências vinculadas | tarefa, execução, sessão ou URL de origem opcional                                                                    |
| `execution` | metadados opcionais de uma execução do Codex/Claude iniciada pelo cartão (mecanismo, modo, modelo, sessão, id da execução, status) |

Os cartões também contêm metadados compactos de tentativas, comentários, links, comprovações,
artefatos, configurações de automação, anexos, logs de workers, estado do protocolo de
workers, reivindicações, diagnósticos, notificações, id do modelo, estado de arquivamento e
detecção de sessões obsoletas, além de uma lista de eventos recentes (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Esses metadados permitem que um
operador veja como um cartão percorreu o quadro sem abrir a sessão vinculada;
eles constituem contexto operacional local, não substituem as transcrições da sessão
nem o histórico do issue no GitHub.

O plugin e a UI de Controle usam um único contrato de cartão do Workboard. Portanto, as atualizações
do painel preservam a proveniência e a autoridade do workspace, o estado de reivindicação, as ações
de diagnóstico e os números de sequência das notificações, em vez de projetarem uma cópia menor
do cartão exclusiva da UI. Tipos de diagnóstico, níveis de gravidade de diagnóstico e
tipos de notificação desconhecidos são ignorados até que ambas as superfícies ofereçam suporte a eles;
eles nunca são reescritos como outro estado válido.

O painel aberto é atualizado por invalidações de `plugin.workboard.changed`. Cada
evento contém apenas uma época e uma revisão do armazenamento; em seguida, a UI relê os cartões canônicos
por meio do RPC `operator.read` normal. Várias revisões são agrupadas em
uma única leitura subsequente. O Workboard adia essa leitura enquanto um cartão está sendo arrastado,
editado ou gravado e a retoma após a conclusão da interação local. Uma
reconexão sempre realiza um recarregamento canônico. Não há sondagem completa rotineira dos cartões,
e **Atualizar** permanece disponível para recuperação manual.

Quando há mais de um quadro, a barra de ferramentas inclui um filtro **Quadro** baseado
em metadados persistidos dos quadros, e não apenas nos cartões visíveis no momento. Assim, quadros
vazios e arquivados continuam selecionáveis. Cartões sem um id de quadro explícito
pertencem ao quadro canônico `default`. O quadro selecionado é armazenado
no parâmetro de consulta `?board=`, portanto a URL filtrada do Workboard pode ser adicionada aos favoritos
ou compartilhada; escolher **Todos os quadros** remove o parâmetro.

Os cartões são armazenados no estado do próprio plugin no Gateway e acompanham o restante
do estado do OpenClaw desse Gateway (consulte [Armazenamento](#storage)).

## Iniciar trabalho a partir de um cartão

Cartões não vinculados podem iniciar o trabalho diretamente:

- **Executar Codex** / **Executar Claude** inicia uma execução de agente acompanhada como tarefa com um
  mecanismo explícito, envia o prompt do cartão e marca o cartão como `running`. As execuções do Codex
  usam `openai/gpt-5.6-sol`; as execuções do Claude usam `anthropic/claude-sonnet-4-6`.
- **Abrir Codex** / **Abrir Claude** cria uma sessão vinculada no painel sem
  enviar o prompt do cartão nem mover o cartão, para trabalhos manuais que permanecem
  associados ao quadro.

As inicializações autônomas usam o caminho de execução de agente acompanhado como tarefa do Gateway (agente
e modelo padrão, a menos que Codex/Claude seja escolhido explicitamente); em seguida, o Workboard vincula
a tarefa resultante, o id da execução e a chave da sessão ao cartão. Cada execução
vinculada também registra um resumo da tentativa (mecanismo, modo, modelo, id da execução,
carimbos de data/hora, status, contagem acumulada de falhas), para que falhas repetidas permaneçam visíveis.

O painel atualiza o status da tarefa usando o registro de tarefas do Gateway, associando
tarefas aos cartões por id da tarefa, id da execução ou chave da sessão vinculada. Uma tarefa na fila/em execução
mantém ativo o ciclo de vida do cartão; uma tarefa concluída, com falha, que excedeu o tempo limite ou foi
cancelada move o cartão em direção a `review` ou `blocked` usando a mesma regra de
sincronização das sessões vinculadas (consulte [Sincronização do ciclo de vida da sessão](#session-lifecycle-sync)).

## Ferramentas do agente

| Ferramenta                                                                                                                                             | Finalidade                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Listar cartões compactos com estado de reivindicação/diagnóstico; filtro opcional por quadro.                                                                                                                    |
| `workboard_read`                                                                                                                                 | Retornar um cartão junto com contexto limitado do worker (notas, tentativas, comentários, links, comprovação, artefatos, resultados dos pais, trabalho recente do responsável, diagnósticos ativos).                               |
| `workboard_create`                                                                                                                               | Criar um cartão com pais, locatário, Skills, quadro, metadados do workspace, chave de idempotência, limite de tempo de execução e orçamento de novas tentativas opcionais.                                                             |
| `workboard_link`                                                                                                                                 | Vincular um pai a um cartão filho. Os filhos permanecem em `todo` até que todos os pais atinjam `done`; então, a promoção pelo despacho os move para `ready`.                                                     |
| `workboard_claim`                                                                                                                                | Reivindicar um cartão para o agente chamador; move `backlog`/`todo`/`ready` para `running`.                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | Atualizar o heartbeat da reivindicação durante uma execução mais longa.                                                                                                                                          |
| `workboard_release`                                                                                                                              | Liberar a reivindicação após conclusão, pausa ou transferência; pode mover o cartão para um próximo status.                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | Ferramentas estruturadas de ciclo de vida para resumos finais, comprovações, artefatos e manifestos de cartões criados (devem referenciar cartões vinculados de volta ao cartão concluído) ou motivos de bloqueio.                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Armazenar pequenos anexos de cartões no estado SQLite do plugin, indexá-los no cartão e disponibilizá-los no contexto do worker.                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Registrar linhas de log do worker e bloquear um cartão quando um worker automatizado parar sem chamar `workboard_complete`/`workboard_block`.                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Gerenciar metadados persistentes do quadro (nome de exibição, descrição, estado de arquivamento, workspace padrão).                                                                                            |
| `workboard_runs`                                                                                                                                 | Retornar o histórico persistente de tentativas de execução de um cartão.                                                                                                                                      |
| `workboard_specify`                                                                                                                              | Transformar um cartão preliminar de triagem/backlog em um cartão `todo` esclarecido; registra o resumo da especificação no cartão.                                                                                      |
| `workboard_decompose`                                                                                                                            | Distribuir um cartão pai de orquestração em filhos vinculados, herdando os metadados de quadro/locatário; pode concluir o pai com um manifesto de cartões criados.                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Gerenciar assinaturas de notificações. As leituras de eventos são seguras para reprodução; `advance` move o cursor durável para que os chamadores retomem sem perder nem ler duas vezes eventos de cartões concluídos/com falha/obsoletos. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Inspecionar namespaces de quadros e estatísticas da fila.                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Recuperar ou transferir trabalhos travados.                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | Adicionar notas de transferência ou anexar referências de comprovação/artefato.                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Mover o trabalho bloqueado de volta para `todo`.                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | Mover um cartão para outro status; cartões reivindicados exigem o escopo de reivindicação do agente chamador.                                                                                                      |
| `workboard_dispatch`                                                                                                                             | Acionar a promoção de dependências ou a limpeza de reivindicações obsoletas sem iniciar workers; a inicialização de workers usa o Gateway ou o despacho por comando de barra.                                                        |

Cartões reivindicados rejeitam mutações por ferramentas de agente provenientes de outros agentes, a menos que o chamador
tenha o token de reivindicação retornado por `workboard_claim`. Todo cartão retornado por uma
ferramenta de agente ou chamada RPC do Gateway oculta `metadata.claim.token` como `[redacted]`
(o token em si é retornado uma única vez, no nível superior, somente por `workboard_claim`),
para que operadores do painel e outros agentes possam inspecionar o estado da reivindicação sem jamais
ver um token utilizável. A recuperação ocorre por meio de
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, que não
exigem o token.

## Despacho

O despacho é local ao Gateway: ele não inicia processos arbitrários do sistema operacional. As sessões
normais de subagentes do OpenClaw continuam responsáveis pela execução. Uma passagem de despacho:

1. Promove cartões cujas dependências estão prontas.
2. Registra metadados de despacho nos cartões prontos.
3. Bloqueia reivindicações expiradas ou execuções que excederam o tempo limite.
4. Marca cartões de triagem configurados no quadro como candidatos à orquestração.
5. Reivindica um pequeno lote de cartões prontos e inicia execuções de workers por meio do
   runtime de subagentes do Gateway.

Os workers recebem contexto limitado do cartão, além do token de reivindicação necessário para enviar heartbeat,
concluir ou bloquear o cartão por meio das ferramentas do Workboard.

Os caminhos de workspace seguem a autoridade existente do sistema de arquivos do chamador. Clientes do Gateway
com `operator.write` podem usar workspaces de agentes configurados;
clientes `operator.admin` podem usar outros checkouts do host. Ferramentas de agente em sandbox usam
o acesso ao workspace de seu sandbox, enquanto ferramentas sem sandbox, restritas ao workspace, usam sua
raiz de workspace configurada. O Workboard registra essa autoridade quando um workspace é
atribuído e volta a cruzá-la com a autoridade atual do chamador no momento do despacho,
de modo que um cartão persistente não possa ampliar o acesso de um chamador posterior. Cartões antigos com um
workspace explícito do host, mas sem autoridade registrada, devem ter esse workspace
salvo novamente antes de um despacho com acesso total ao host; cartões sem um caminho no host adotam a
autoridade do chamador atual quando são despachados pela primeira vez.

O despacho vinculado ao workspace aceita um diretório ou checkout do Git somente quando a
raiz do repositório corresponde exatamente ao workspace do agente de destino. Uma solicitação de worktree
é restringida a esse diretório e persistida como um workspace de diretório, de modo que o
host não materializa o checkout nem executa código de configuração do repositório. O
worker de destino deve usar um sandbox Docker gravável e não compartilhado para esse
workspace exato, sem execução elevada, substituições persistentes de execução do host/Node ou
ferramentas não classificadas de plugins e MCP. O Workboard enumera suas ferramentas registradas
em vez de confiar em um prefixo `workboard_*`, e o despacho recusa um contêiner Docker
ativo cujo hash de montagem/configuração em uso esteja obsoleto. O despacho informa a
política de destino incompatível em vez de iniciar um worker com menos isolamento.
O despacho com acesso total ao host pode ter como destino outros checkouts locais e mantém a configuração normal de
worktrees gerenciadas.

A autoridade do workspace não cria um segundo modelo de permissões para o ciclo de vida dos cartões.
Chamadores que podem modificar cartões do Workboard podem movê-los manualmente pelos mesmos
status em todas as superfícies; o acesso somente leitura ao workspace apenas impede o
despacho de workers que precisa de gravação.

### Seleção de workers

Cada passagem inicia **no máximo 3 workers por padrão**. Os cartões prontos são ordenados por
prioridade, depois por posição e, em seguida, por horário de criação. Uma passagem inicia apenas um cartão por
proprietário/agente e ignora proprietários que já tenham trabalho em execução ou em revisão no
quadro. Cartões arquivados, cartões com uma reivindicação ativa e cartões que não estejam no status `ready`
nunca são selecionados para inicialização de workers (eles ainda podem ser afetados pelo
lado de dados do despacho: limpeza de reivindicações obsoletas, promoção de dependências, limpeza por
tempo limite).

As chaves de sessão são determinísticas por quadro/cartão, portanto despachos repetidos são encaminhados
de volta à mesma faixa de worker, em vez de criar sessões não relacionadas:

- Cartões atribuídos: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Cartões não atribuídos: `subagent:workboard-<boardId>-<cardId>` (o Gateway resolve
  o agente padrão configurado)

Se um worker não puder ser iniciado depois que um cartão for reivindicado, o Workboard bloqueia o
cartão, limpa a reivindicação, registra a falha de inicialização da execução e acrescenta uma linha ao log do
worker — visível no painel, no JSON da CLI, nas ferramentas de agente e nos
diagnósticos do cartão.

### Pontos de entrada

- Ação de despacho do painel
- `openclaw workboard dispatch`
- `/workboard dispatch` em um canal compatível com comandos

Todos os três usam o runtime de subagentes do Gateway quando o Gateway está disponível. A
CLI tem um fallback para o operador: se a chamada ao Gateway falhar com um erro de
conexão/indisponibilidade (ou um erro `unknown method` em Gateways mais
antigos), e não houver um destino `--url`/`--token` explícito nem um Gateway
remoto configurado (`OPENCLAW_GATEWAY_URL` ou `gateway.mode: remote`) aplicável, a CLI executará
o despacho somente de dados no estado SQLite local — ela pode promover dependências,
limpar reivindicações obsoletas e bloquear execuções que atingiram o tempo limite, mas não pode iniciar workers. Falhas de autenticação,
permissão e validação de um Gateway acessível não são tratadas
como indisponibilidade; elas são exibidas como erros de comando, assim como qualquer falha do Gateway
quando um destino `--url`/`--token` explícito tiver sido fornecido.

Os metadados do quadro podem definir `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` e `orchestratorProfile`. O OpenClaw registra essa intenção e
a expõe no contexto do worker; a especificação/decomposição efetiva ainda é executada
pelas ferramentas normais do Workboard.

## CLI e comando de barra

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

A saída de texto de `list` oculta cartões arquivados por padrão (`--include-archived`
substitui esse comportamento); `--json` sempre inclui cartões arquivados, em conformidade com o contrato
de cartões completos usado pelos scripts existentes. `show` e `move` aceitam um prefixo
de ID inequívoco. `list`, `create`, `show` e `move` sempre leem/gravam diretamente
o estado local do plugin. Somente `dispatch` chama o Gateway em execução, com o fallback
descrito acima.

Consulte [CLI do Workboard](/pt-BR/cli/workboard) para ver todas as flags, a saída JSON, o comportamento de
fallback do Gateway, o tratamento de prefixos de ID, as regras de seleção de despacho e a
solução de problemas.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` e `/workboard dispatch` refletem
a CLI. Listar e exibir são operações de leitura para qualquer remetente de comandos autorizado.
Criar, mover e despachar exigem status de proprietário nas superfícies de chat ou um cliente
Gateway com `operator.write`/`operator.admin`. Movimentações manuais do operador usam o
mesmo comportamento de substituição de reivindicação que o recurso de arrastar e soltar do painel. O acesso dessas operações à worktree
ainda segue o mesmo limite do espaço de trabalho descrito acima.

## Sincronização do ciclo de vida da sessão

Os cartões podem ser vinculados a uma sessão existente do painel ou a uma criada quando o
trabalho é iniciado pelo cartão. Os cartões vinculados exibem o ciclo de vida da sessão em linha:
em execução, obsoleta, vinculada e ociosa, concluída, com falha ou ausente. Também é possível capturar uma
sessão existente na aba Sessions com **Add to Workboard**; o cartão
é vinculado a essa sessão, usa o rótulo da sessão ou o prompt recente do usuário como título
e preenche as notas com o prompt recente do usuário e a resposta mais recente do assistente,
quando disponíveis.

Se a sessão vinculada desaparecer, o cartão permanecerá vinculado para preservar o contexto e
ainda oferecerá controles de início para reiniciar em uma nova sessão. Se uma sessão vinculada
ativa deixar de relatar atividade recente, o Workboard marcará o cartão como
`stale` e armazenará isso como metadados até que o ciclo de vida os remova.

Enquanto um cartão estiver em um estado de trabalho ativo, o Workboard acompanhará a sessão vinculada:

| Estado da sessão vinculada             | Status do cartão |
| --------------------------------------- | ---------------- |
| ativa                                   | `running`   |
| concluída                               | `review`    |
| falhou, foi encerrada, atingiu o tempo limite ou foi abortada | `blocked`   |

**Os estados de revisão manual têm prioridade.** Mover um cartão para `review`, `blocked` ou `done`
interrompe a sincronização automática desse cartão até que ele seja movido de volta para `todo` ou `running`.

Iniciar um cartão usa sessões normais do Gateway; o Workboard armazena apenas os
metadados e vínculos do cartão. A transcrição da conversa, a seleção do modelo e o ciclo de vida
da execução permanecem sob responsabilidade do sistema normal de sessões. Use **Stop** em um cartão
vinculado ativo para abortar a execução ativa — o Workboard marcará esse cartão como `blocked` para que
ele permaneça visível para acompanhamento.

Novos cartões podem ser iniciados a partir de modelos do Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Os modelos preenchem previamente o título, as notas, os rótulos e a prioridade;
o ID do modelo é armazenado como metadados do cartão.

## Fluxo de trabalho do painel

1. Abra a aba Workboard na Control UI.
2. Crie um cartão com título, notas, prioridade, rótulos, agente opcional e
   sessão vinculada opcional — ou abra Sessions e escolha **Add to Workboard**
   para uma sessão existente.
3. Arraste o cartão entre as colunas ou coloque o foco no controle compacto de status e use
   o menu ou ArrowLeft/ArrowRight. Durante o arraste, o cartão de origem fica esmaecido e
   as colunas de destino disponíveis recebem um contorno.
4. Inicie o trabalho pelo cartão para criar ou reutilizar uma sessão do painel.
5. Abra a sessão vinculada pelo cartão enquanto o agente trabalha.
6. Deixe que a sincronização do ciclo de vida mova o trabalho em execução para `review`/`blocked` e, em seguida, mova
   manualmente o cartão para `done` quando ele for aceito.

## Diagnósticos

Os diagnósticos são calculados com base nos metadados locais dos cartões. As verificações integradas sinalizam:

| Tipo                        | Condição                                                                       |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Cartão `todo`/`backlog`/`ready` atribuído sem atualização há mais de 1 hora.             |
| `running_without_heartbeat` | Cartão `running` sem Heartbeat de reivindicação nem atualização de execução há mais de 20 minutos. |
| `blocked_too_long`          | Cartão `blocked` sem atualização há mais de 24 horas.                                   |
| `repeated_failures`         | A contagem de falhas monitorada do cartão chega a 2 ou mais.                                |
| `missing_proof`             | Cartão `done` sem comprovação, artefatos ou anexos.                          |
| `orphaned_session`          | Cartão `running` com um `sessionKey`, mas sem metadados `execution`.                |

## Permissões

Os métodos RPC do Gateway ficam em `workboard.*`:

| Escopo            | Métodos                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, listar/obter anexos, leituras de eventos de notificação, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, criar/atualizar/mover/excluir/comentar/vincular/vincular dependência/comprovação/artefato, adicionar/excluir anexo, log do worker, violação de protocolo, reivindicar/Heartbeat/liberar/promover/reatribuir/recuperar/concluir/bloquear/desbloquear, `cards.dispatch`, `cards.bulk`, arquivar, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, assinar/excluir/avançar notificação |

Nenhum método RPC exige `operator.admin`. Navegadores conectados com acesso de
operador somente leitura podem inspecionar o quadro, mas não podem modificar cartões. Um escopo de administrador
amplia os caminhos de host do Workboard aceitos; ele não altera os métodos disponíveis.

## Armazenamento

O Workboard armazena dados duráveis em um banco de dados SQLite relacional pertencente ao plugin
no diretório de estado do OpenClaw: quadros, cartões, rótulos, eventos de ciclo de vida,
tentativas de execução, comentários, vínculos de dependência, comprovações, referências de artefatos,
metadados e blobs de anexos, diagnósticos, notificações, logs de workers,
estado do protocolo e assinaturas ficam todos em tabelas do Workboard (não
em entradas de chave-valor do plugin). Uma exportação de cartão preserva a narrativa do quadro
sem incorporar o conteúdo dos blobs de anexos.

Instalações que usaram o Workboard na versão `.28` podem executar
`openclaw doctor --fix` para migrar os namespaces legados enviados do estado do plugin
(`workboard.cards`, `workboard.boards`, `workboard.notify` e, se presente,
`workboard.attachments`) para o banco de dados relacional.

## Solução de problemas

**A aba informa que o Workboard está indisponível**

```bash
openclaw plugins inspect workboard --runtime --json
```

Se `plugins.allow` estiver configurado, adicione `workboard` a ele. Se `plugins.deny`
contiver `workboard`, remova-o antes de habilitar o plugin.

**Os cartões não são salvos**

Confirme se a conexão do navegador tem acesso `operator.write`. Sessões de operador
somente leitura podem listar cartões, mas não podem criá-los, editá-los, movê-los nem excluí-los.

**Iniciar um cartão não abre a sessão esperada**

Verifique o ID do agente e a sessão vinculada do cartão e, em seguida, abra Sessions ou Chat para
inspecionar o estado real da execução.

**O despacho não inicia um worker**

Confirme se há pelo menos um cartão `ready` sem uma reivindicação ativa:

```bash
openclaw workboard list --status ready
```

Se a CLI informar despacho somente de dados, inicie ou reinicie o Gateway e
tente novamente — o despacho somente de dados atualiza o estado local do quadro, mas não pode iniciar
execuções de workers subagentes. Os cartões também podem ser ignorados quando outro cartão do
mesmo proprietário ou agente já estiver em execução ou aguardando revisão; conclua,
bloqueie ou libere esse trabalho ativo antes de despachar mais trabalho para o mesmo
proprietário.

## Relacionados

- [Control UI](/pt-BR/web/control-ui)
- [CLI do Workboard](/pt-BR/cli/workboard)
- [Plugins](/pt-BR/tools/plugin)
- [Gerenciar plugins](/pt-BR/plugins/manage-plugins)
- [Sessões](/pt-BR/concepts/session)
