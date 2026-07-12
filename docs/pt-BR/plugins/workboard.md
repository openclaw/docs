---
read_when:
    - Você quer um quadro de trabalho no estilo Kanban na interface de controle
    - Você está habilitando ou desabilitando o plugin Workboard incluído.
    - Você quer acompanhar o trabalho planejado do agente sem um gerenciador de projetos externo
summary: Quadro de trabalho opcional no painel para cartões gerenciados por agentes e transferência de sessão
title: Plugin Workboard
x-i18n:
    generated_at: "2026-07-12T00:15:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

O plugin Workboard adiciona um quadro opcional no estilo Kanban à
[UI de Controle](/pt-BR/web/control-ui): cartões de trabalho dimensionados para agentes, atribuição a agentes
e um link de volta para a tarefa, a execução e a sessão do painel do cartão.

O Workboard é intencionalmente pequeno: ele acompanha o trabalho operacional local de um
Gateway OpenClaw. Ele não substitui GitHub Issues, Linear, Jira nem
outros sistemas de gerenciamento de projetos de equipe.

## Habilitá-lo

O Workboard vem incluído, mas desabilitado por padrão:

1. Abra **Plugins** na UI de Controle ou use `/settings/plugins` em relação ao
   caminho base configurado da UI de Controle. Por exemplo, um caminho base `/openclaw`
   usa `/openclaw/settings/plugins`.
2. Localize **Workboard** e escolha **Enable**. Como o Workboard está incluído no
   OpenClaw, ele não requer uma ação **Install**.
3. Se a interface informar que é necessário reiniciar, reinicie o Gateway.

A aba Workboard aparece na navegação do painel depois que o runtime do plugin é carregado.
Enquanto ele estiver desabilitado, a aba permanecerá oculta na navegação. Abrir diretamente a
rota `/workboard` enquanto o plugin estiver desabilitado ou bloqueado por
`plugins.allow`/`plugins.deny` exibirá um estado de plugin indisponível em vez dos dados
dos cartões.

O fluxo de trabalho equivalente na CLI é:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configuração

O Workboard não possui configuração específica do plugin. Habilite-o ou desabilite-o com a entrada
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

## Campos dos cartões

| Campo              | Valores                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `status`           | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                               |
| `priority`         | `low`, `normal`, `high`, `urgent`                                                                                       |
| `labels`           | strings de formato livre                                                                                                |
| `agentId`          | agente atribuído opcional                                                                                               |
| referências vinculadas | tarefa, execução, sessão ou URL de origem opcional                                                                  |
| `execution`        | metadados opcionais de uma execução do Codex/Claude iniciada pelo cartão (mecanismo, modo, modelo, sessão, ID da execução, status) |

Os cartões também contêm metadados compactos de tentativas, comentários, links, provas,
artefatos, configurações de automação, anexos, logs de workers, estado do protocolo
do worker, reivindicações, diagnósticos, notificações, ID do modelo, estado de arquivamento e
detecção de sessões obsoletas, além de uma lista de eventos recentes (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Esses metadados permitem que um
operador veja como um cartão avançou pelo quadro sem abrir a sessão
vinculada; trata-se de contexto operacional local, não de um substituto para transcrições
de sessões ou o histórico de issues do GitHub.

Os cartões são armazenados no estado próprio do Gateway do plugin e acompanham o restante do
estado do OpenClaw desse Gateway (consulte [Armazenamento](#storage)).

## Iniciar o trabalho a partir de um cartão

Cartões não vinculados podem iniciar o trabalho diretamente:

- **Executar Codex** / **Executar Claude** inicia uma execução de agente acompanhada por tarefa com um
  mecanismo explícito, envia o prompt do cartão e marca o cartão como `running`. As execuções do Codex
  usam `openai/gpt-5.6-sol`; as execuções do Claude usam `anthropic/claude-sonnet-4-6`.
- **Abrir Codex** / **Abrir Claude** cria uma sessão de painel vinculada sem
  enviar o prompt do cartão nem mover o cartão, para trabalho manual que permanece
  anexado ao quadro.

As inicializações autônomas usam o caminho de execução de agente acompanhada por tarefa do Gateway (agente
e modelo padrão, a menos que Codex/Claude seja escolhido explicitamente); em seguida, o Workboard vincula
a tarefa resultante, o ID da execução e a chave da sessão de volta ao cartão. Cada execução
vinculada também registra um resumo da tentativa (mecanismo, modo, modelo, ID da execução,
carimbos de data e hora, status e contagem acumulada de falhas), para que falhas repetidas permaneçam visíveis.

O painel atualiza o status da tarefa com base no registro de tarefas do Gateway, associando
tarefas aos cartões pelo ID da tarefa, ID da execução ou chave da sessão vinculada. Uma tarefa
na fila/em execução mantém ativo o ciclo de vida do cartão; uma tarefa concluída, com falha,
com tempo limite excedido ou cancelada move o cartão para `review` ou `blocked` usando a mesma regra de
sincronização das sessões vinculadas (consulte [Sincronização do ciclo de vida da sessão](#session-lifecycle-sync)).

## Ferramentas de agente

| Ferramenta                                                                                                                                       | Finalidade                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Lista cartões compactos com estado de reivindicação/diagnóstico; filtro de quadro opcional.                                                                                                                      |
| `workboard_read`                                                                                                                                 | Retorna um cartão e um contexto limitado do worker (notas, tentativas, comentários, links, provas, artefatos, resultados dos pais, trabalho recente do responsável, diagnósticos ativos).                         |
| `workboard_create`                                                                                                                               | Cria um cartão com pais, locatário, Skills, quadro, metadados do espaço de trabalho, chave de idempotência, limite de execução e orçamento de novas tentativas opcionais.                                         |
| `workboard_link`                                                                                                                                 | Vincula um cartão pai a um cartão filho. Os filhos permanecem em `todo` até que todos os pais cheguem a `done`; então, a promoção de despacho os move para `ready`.                                                |
| `workboard_claim`                                                                                                                                | Reivindica um cartão para o agente chamador; move `backlog`/`todo`/`ready` para `running`.                                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | Atualiza o Heartbeat da reivindicação durante uma execução mais longa.                                                                                                                                           |
| `workboard_release`                                                                                                                              | Libera a reivindicação após a conclusão, pausa ou transferência; pode mover o cartão para um próximo status.                                                                                                     |
| `workboard_complete` / `workboard_block`                                                                                                         | Ferramentas estruturadas de ciclo de vida para resumos finais, provas, artefatos e manifestos de cartões criados (devem referenciar cartões vinculados de volta ao cartão concluído) ou motivos de bloqueio.       |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Armazena pequenos anexos de cartão no estado SQLite do Plugin, indexa-os no cartão e os expõe no contexto do worker.                                                                                              |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Registra linhas de log do worker e bloqueia um cartão quando um worker automatizado é interrompido sem chamar `workboard_complete`/`workboard_block`.                                                             |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Gerencia metadados persistidos do quadro (nome de exibição, descrição, estado de arquivamento, espaço de trabalho padrão).                                                                                        |
| `workboard_runs`                                                                                                                                 | Retorna o histórico persistido de tentativas de execução de um cartão.                                                                                                                                           |
| `workboard_specify`                                                                                                                              | Transforma um cartão preliminar de triagem/backlog em um cartão `todo` esclarecido; registra o resumo da especificação no cartão.                                                                                 |
| `workboard_decompose`                                                                                                                            | Desdobra um cartão pai de orquestração em filhos vinculados, herdando os metadados de quadro/locatário; pode concluir o pai com um manifesto de cartões criados.                                                  |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Gerencia assinaturas de notificações. As leituras de eventos são seguras para reprodução; `advance` move o cursor durável para que os chamadores retomem sem perder nem ler duas vezes eventos de cartões concluídos/com falha/obsoletos. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Inspeciona namespaces de quadros e estatísticas da fila.                                                                                                                                                         |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Recupera ou transfere trabalhos travados.                                                                                                                                                                        |
| `workboard_comment` / `workboard_proof`                                                                                                          | Adiciona notas de transferência ou anexa referências de provas/artefatos.                                                                                                                                        |
| `workboard_unblock`                                                                                                                              | Move trabalhos bloqueados de volta para `todo`.                                                                                                                                                                  |
| `workboard_dispatch`                                                                                                                             | Aciona a promoção de dependências ou a limpeza de reivindicações obsoletas.                                                                                                                                       |

Cartões reivindicados rejeitam mutações feitas por ferramentas de agente de outros agentes, a menos que o chamador
possua o token de reivindicação retornado por `workboard_claim`. Todo cartão retornado por uma
ferramenta de agente ou chamada RPC do Gateway oculta `metadata.claim.token` como `[redacted]`
(o próprio token é retornado uma única vez, no nível superior, somente por `workboard_claim`),
para que operadores do painel e outros agentes possam inspecionar o estado da reivindicação sem jamais
ver um token utilizável. A recuperação é feita por meio de
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, que não
exigem o token.

## Despacho

O despacho é local ao Gateway: ele não inicia processos arbitrários do sistema operacional. As sessões normais
de subagentes do OpenClaw continuam responsáveis pela execução. Uma passagem de despacho:

1. Promove cartões cujas dependências estão prontas.
2. Registra metadados de despacho nos cartões prontos.
3. Bloqueia reivindicações expiradas ou execuções que excederam o tempo limite.
4. Marca cartões de triagem configurados no quadro como candidatos à orquestração.
5. Reivindica um pequeno lote de cartões prontos e inicia execuções de workers por meio do
   runtime de subagentes do Gateway.

Os workers recebem um contexto limitado do cartão, além do token de reivindicação necessário para enviar Heartbeats,
concluir ou bloquear o cartão por meio das ferramentas do Workboard.

### Seleção de workers

Cada passagem inicia **no máximo 3 workers por padrão**. Os cartões prontos são ordenados por
prioridade, depois por posição e, em seguida, por data de criação. Uma passagem inicia somente um cartão por
proprietário/agente e ignora proprietários que já tenham trabalhos em execução ou em revisão no
quadro. Cartões arquivados, cartões com uma reivindicação ativa e cartões que não estejam no status `ready`
nunca são selecionados para iniciar workers (eles ainda podem ser afetados pelo
lado de dados do despacho: limpeza de reivindicações obsoletas, promoção de dependências e limpeza por tempo limite).

As chaves de sessão são determinísticas por quadro/cartão, portanto despachos repetidos são direcionados
de volta à mesma faixa de worker, em vez de criarem sessões não relacionadas:

- Cartões atribuídos: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Cartões não atribuídos: `subagent:workboard-<boardId>-<cardId>` (o Gateway resolve
  o agente padrão configurado)

Se não for possível iniciar um worker depois que um cartão for reivindicado, o Workboard bloqueia o
cartão, limpa a reivindicação, registra a falha de início da execução e acrescenta uma linha ao
log do worker — visível no painel, no JSON da CLI, nas ferramentas de agente e nos
diagnósticos do cartão.

### Pontos de entrada

- Ação de despacho no painel
- `openclaw workboard dispatch`
- `/workboard dispatch` em um canal compatível com comandos

Todos os três usam o runtime de subagentes do Gateway quando o Gateway está disponível. A
CLI tem um mecanismo alternativo para operadores: se a chamada ao Gateway falhar com um erro de
conexão/indisponibilidade (ou um erro `unknown method` em Gateways mais antigos),
e não houver um destino explícito `--url`/`--token` nem um Gateway remoto configurado
(`OPENCLAW_GATEWAY_URL` ou `gateway.mode: remote`), a CLI executa um
despacho somente de dados no estado SQLite local — ela pode promover dependências,
limpar reivindicações obsoletas e bloquear execuções que excederam o tempo limite, mas não pode iniciar workers. Falhas de autenticação,
permissão e validação de um Gateway acessível não são tratadas
como indisponibilidade; elas são apresentadas como erros de comando, assim como qualquer falha do Gateway
quando um destino explícito `--url`/`--token` tiver sido fornecido.

Os metadados do quadro podem definir `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` e `orchestratorProfile`. O OpenClaw registra essa intenção e
a expõe no contexto do worker; a especificação/decomposição efetiva ainda é executada
por meio das ferramentas normais do Workboard.

## CLI e comando com barra

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

A saída textual de `list` oculta cartões arquivados por padrão (`--include-archived`
substitui esse comportamento); `--json` sempre inclui cartões arquivados, em conformidade com o contrato de cartão completo
usado pelos scripts existentes. `show` aceita um prefixo de ID não ambíguo.
`list`, `create` e `show` sempre leem/gravam diretamente no estado local do Plugin.
Somente `dispatch` chama o Gateway em execução, com o mecanismo alternativo descrito acima.

Consulte a [CLI do Workboard](/pt-BR/cli/workboard) para ver todas as opções, a saída JSON, o comportamento
alternativo do Gateway, o tratamento de prefixos de ID, as regras de seleção de despacho e a
solução de problemas.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`
e `/workboard dispatch` espelham a CLI. Listagem e exibição são operações de leitura
para qualquer remetente de comandos autorizado. Criação e despacho exigem status de proprietário nas
interfaces de chat ou um cliente do Gateway com `operator.write`/`operator.admin`.

## Sincronização do ciclo de vida da sessão

Os cartões podem ser vinculados a uma sessão existente do painel ou a uma criada quando você
inicia o trabalho pelo cartão. Os cartões vinculados mostram o ciclo de vida da sessão em linha:
em execução, obsoleta, vinculada e ociosa, concluída, com falha ou ausente. Você também pode capturar uma
sessão existente na aba Sessions com **Add to Workboard**; o cartão
é vinculado a essa sessão, usa o rótulo da sessão ou o prompt recente do usuário como título
e preenche as notas com o prompt recente do usuário e a resposta mais recente do assistente,
quando disponíveis.

Se a sessão vinculada ficar ausente, o cartão permanecerá vinculado para fornecer contexto e
ainda oferecerá controles de início para reiniciar em uma nova sessão. Se uma sessão vinculada
ativa parar de relatar atividade recente, o Workboard marcará o cartão como
`stale` e armazenará isso como metadado até que o ciclo de vida o remova.

Enquanto um cartão estiver em um estado de trabalho ativo, o Workboard acompanhará a sessão vinculada:

| Estado da sessão vinculada                 | Status do cartão |
| ------------------------------------------ | ---------------- |
| ativa                                      | `running`        |
| concluída                                  | `review`         |
| com falha, encerrada, expirada ou abortada | `blocked`        |

**Os estados de revisão manual têm prioridade.** Mover um cartão para `review`, `blocked` ou `done`
interrompe a sincronização automática desse cartão até que você o mova de volta para `todo` ou `running`.

Iniciar um cartão usa sessões normais do Gateway; o Workboard armazena apenas os
metadados e vínculos do cartão. A transcrição da conversa, a seleção do modelo e o ciclo de vida
da execução continuam sob responsabilidade do sistema normal de sessões. Use **Stop** em um cartão
vinculado ativo para abortar a execução em andamento — o Workboard marcará esse cartão como `blocked` para
que ele continue visível para acompanhamento.

Novos cartões podem ser iniciados a partir de modelos do Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Os modelos preenchem previamente o título, as notas, os rótulos e a prioridade;
o ID do modelo é armazenado como metadado do cartão.

## Fluxo de trabalho do painel

1. Abra a aba Workboard na Control UI.
2. Crie um cartão com título, notas, prioridade, rótulos, agente opcional e
   sessão vinculada opcional — ou abra Sessions e escolha **Add to Workboard**
   para uma sessão existente.
3. Arraste o cartão entre as colunas ou focalize seu controle compacto de status e use
   o menu ou ArrowLeft/ArrowRight.
4. Inicie o trabalho pelo cartão para criar ou reutilizar uma sessão do painel.
5. Abra a sessão vinculada pelo cartão enquanto o agente trabalha.
6. Permita que a sincronização do ciclo de vida mova o trabalho em execução para `review`/`blocked` e, em seguida,
   mova manualmente o cartão para `done` quando ele for aceito.

## Diagnósticos

Os diagnósticos são calculados com base nos metadados locais dos cartões. As verificações integradas sinalizam:

| Tipo                        | Condição                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `stranded_ready`            | Cartão atribuído em `todo`/`backlog`/`ready` sem atualização há mais de 1 hora.                 |
| `running_without_heartbeat` | Cartão em `running` sem Heartbeat de reivindicação ou atualização de execução há mais de 20 minutos. |
| `blocked_too_long`          | Cartão em `blocked` sem atualização há mais de 24 horas.                                       |
| `repeated_failures`         | A contagem de falhas monitorada do cartão atinge 2 ou mais.                                    |
| `missing_proof`             | Cartão em `done` sem comprovação, artefatos ou anexos.                                         |
| `orphaned_session`          | Cartão em `running` com uma `sessionKey`, mas sem metadados de `execution`.                     |

## Permissões

Os métodos RPC do Gateway ficam em `workboard.*`:

| Escopo           | Métodos                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, listagem/obtenção de anexos, leituras de eventos de notificação, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, criação/atualização/movimentação/exclusão/comentário/vinculação/vinculação de dependência/comprovação/artefato, adição/exclusão de anexos, log do worker, violação de protocolo, reivindicação/Heartbeat/liberação/promoção/reatribuição/recuperação/conclusão/bloqueio/desbloqueio, `cards.dispatch`, `cards.bulk`, arquivamento, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, assinatura/exclusão/avanço de notificações |

Nenhum método RPC exige `operator.admin`. Navegadores conectados com acesso de
operador somente leitura podem inspecionar o quadro, mas não podem modificar cartões.

## Armazenamento

O Workboard armazena dados duráveis em um banco de dados relacional SQLite pertencente ao Plugin
no diretório de estado do OpenClaw: quadros, cartões, rótulos, eventos do ciclo de vida,
tentativas de execução, comentários, vínculos de dependência, comprovações, referências de artefatos,
metadados e blobs de anexos, diagnósticos, notificações, logs de workers,
estado de protocolo e assinaturas ficam todos nas tabelas do Workboard (não em
entradas de chave-valor do Plugin). Uma exportação de cartão preserva a narrativa do quadro
sem incorporar o conteúdo dos blobs dos anexos.

Instalações que usaram o Workboard na versão `.28` podem executar
`openclaw doctor --fix` para migrar os namespaces legados de estado do Plugin distribuídos
(`workboard.cards`, `workboard.boards`, `workboard.notify` e, se presente,
`workboard.attachments`) para o banco de dados relacional.

## Solução de problemas

**A aba informa que o Workboard está indisponível**

```bash
openclaw plugins inspect workboard --runtime --json
```

Se `plugins.allow` estiver configurado, adicione `workboard` a ele. Se `plugins.deny`
contiver `workboard`, remova-o antes de habilitar o Plugin.

**Os cartões não são salvos**

Confirme que a conexão do navegador tem acesso `operator.write`. Sessões de operador
somente leitura podem listar cartões, mas não podem criá-los, editá-los, movê-los nem excluí-los.

**Iniciar um cartão não abre a sessão esperada**

Verifique o ID do agente e a sessão vinculada do cartão e, em seguida, abra Sessions ou Chat para
inspecionar o estado real da execução.

**O despacho não inicia um worker**

Confirme que há pelo menos um cartão `ready` sem uma reivindicação ativa:

```bash
openclaw workboard list --status ready
```

Se a CLI relatar despacho somente de dados, inicie ou reinicie o Gateway e
tente novamente — o despacho somente de dados atualiza o estado local do quadro, mas não pode iniciar
execuções de workers de subagentes. Os cartões também podem ser ignorados quando outro cartão do
mesmo proprietário ou agente já está em execução ou aguardando revisão; conclua,
bloqueie ou libere esse trabalho ativo antes de despachar mais trabalho para o mesmo
proprietário.

## Relacionados

- [Control UI](/pt-BR/web/control-ui)
- [CLI do Workboard](/pt-BR/cli/workboard)
- [Plugins](/pt-BR/tools/plugin)
- [Gerenciar Plugins](/pt-BR/plugins/manage-plugins)
- [Sessões](/pt-BR/concepts/session)
