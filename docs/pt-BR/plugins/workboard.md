---
read_when:
    - Você quer um quadro de trabalho no estilo Kanban na Control UI
    - Você está habilitando ou desabilitando o Plugin Workboard incluído
    - Você quer acompanhar o trabalho planejado do agente sem um gerenciador de projetos externo
summary: Quadro de trabalho opcional do painel para cartões pertencentes ao agente e transferência de sessão
title: Plugin Workboard
x-i18n:
    generated_at: "2026-06-27T18:01:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

O Plugin Workboard adiciona um quadro opcional no estilo Kanban à
[IU de Controle](/pt-BR/web/control-ui). Use-o para reunir cartões de trabalho em
tamanho adequado para agentes, atribuí-los a agentes e acompanhar a tarefa em
segundo plano, a execução e a sessão de painel vinculadas a partir de um único
cartão.

O Workboard é intencionalmente pequeno. Ele acompanha o trabalho operacional
local de um OpenClaw Gateway; não é um substituto para GitHub Issues, Linear,
Jira ou outros sistemas de gerenciamento de projetos de equipe.

## Estado padrão

O Workboard é um Plugin incluído e fica desabilitado por padrão, a menos que
você o habilite na configuração de Plugin.

Habilite-o com:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Depois abra o painel:

```bash
openclaw dashboard
```

A aba Workboard aparece na navegação do painel. Se a aba estiver visível, mas o
Plugin estiver desabilitado ou bloqueado por `plugins.allow` / `plugins.deny`, a
visualização mostrará um estado de Plugin indisponível em vez dos dados locais
dos cartões.

## O que os cartões contêm

Cada cartão armazena:

- título e notas
- status: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked` ou `done`
- prioridade: `low`, `normal`, `high` ou `urgent`
- rótulos
- ID de agente opcional
- tarefa, execução, sessão ou URL de origem vinculada opcional
- metadados de execução opcionais para uma execução do Codex ou Claude iniciada a partir do cartão
- metadados compactos para tentativas, comentários, links, provas, artefatos, automação,
  anexos, logs de worker, estado de protocolo de worker, reivindicações, diagnósticos,
  notificações, modelos, estado de arquivamento e detecção de sessões obsoletas
- eventos recentes do cartão, como alterações de criação, movimentação, vinculação,
  reivindicação, Heartbeat, tentativa, prova, artefato, diagnóstico, notificação,
  despacho, arquivamento, obsolescência ou atualização por agente

Os cartões são armazenados no estado de Gateway do Plugin. Eles são locais ao
diretório de estado do Gateway e se movem com o restante do estado OpenClaw
desse Gateway.

O Workboard mantém metadados compactos por cartão para que operadores possam
ver como um cartão avançou pelo quadro sem abrir a sessão vinculada. Eventos,
resumos de tentativas, trechos de prova, links relacionados, comentários,
marcadores de arquivamento e marcadores de sessões obsoletas são metadados
locais intencionais; eles não substituem transcrições de sessão nem o histórico
de issues do GitHub.

## Execuções de cartões e tarefas

Cartões sem vínculo podem iniciar trabalho a partir do cartão. Inícios autônomos
usam o caminho de execução de agente rastreado por tarefa do Gateway; depois, o
Workboard vincula a tarefa resultante, o ID da execução e a chave de sessão de
volta ao cartão. O início usa o agente e o modelo padrão configurados no
Gateway. As ações do Codex e do Claude são escolhas opcionais explícitas de
modelo:

- Executar Codex ou Executar Claude inicia uma execução de agente com tarefa,
  envia o prompt do cartão e marca o cartão como `running`.
- Abrir Codex ou Abrir Claude cria uma sessão de painel vinculada sem enviar o
  prompt do cartão nem mover o cartão, para que você possa trabalhar manualmente
  enquanto ele permanece anexado ao quadro.

Os metadados de execução armazenam no cartão o mecanismo selecionado, modo,
referência de modelo, chave de sessão, ID de execução, ID da tarefa quando
disponível e status do ciclo de vida. Execuções do Codex usam
`openai/gpt-5.5`; execuções do Claude usam
`anthropic/claude-sonnet-4-6`.

Cada execução vinculada também registra um resumo de tentativa no mesmo registro
do cartão. O resumo de tentativa mantém o mecanismo, modo, modelo, ID de
execução, carimbos de data/hora, status e contagem contínua de falhas para que
falhas repetidas permaneçam visíveis no quadro.

O painel atualiza o status da tarefa a partir do livro-razão de tarefas do
Gateway e corresponde tarefas de volta aos cartões por ID da tarefa, ID da
execução ou chave de sessão vinculada. Se uma tarefa estiver enfileirada ou em
execução, o ciclo de vida do cartão mostra o estado ativo da tarefa. Se a tarefa
terminar, falhar, expirar ou for cancelada, o ciclo de vida do cartão avança
para status de revisão ou bloqueio usando a mesma sincronização de ciclo de vida
das sessões vinculadas.

## Coordenação de agentes

O Workboard também expõe ferramentas opcionais de agente para fluxos de trabalho
cientes do quadro:

- `workboard_list` lista cartões compactos com estado de reivindicação e
  diagnóstico, com um filtro opcional de quadro.
- `workboard_read` retorna um cartão mais contexto limitado de worker criado a
  partir de notas, tentativas, comentários, links, provas, artefatos, resultados
  de pais, trabalho recente do responsável e diagnósticos ativos.
- `workboard_create` cria um cartão com pais opcionais, locatário, Skills,
  quadro, metadados de espaço de trabalho, chave de idempotência, limite de
  runtime e orçamento de novas tentativas.
- `workboard_link` vincula um cartão pai a um cartão filho. Filhos permanecem em
  `todo` até que todos os pais cheguem a `done`; então a promoção de despacho os
  move para `ready`.
- `workboard_claim` reivindica um cartão para o agente chamador e move cartões
  de backlog, todo ou ready para `running`.
- `workboard_heartbeat` atualiza o Heartbeat da reivindicação durante execuções
  mais longas.
- `workboard_release` libera a reivindicação após conclusão, pausa ou repasse e
  pode mover o cartão para um próximo status.
- `workboard_complete` e `workboard_block` são ferramentas estruturadas de ciclo
  de vida para resumos finais, provas, artefatos, manifestos de cartões criados
  e motivos de bloqueio. Manifestos de cartões criados devem referenciar cartões
  vinculados de volta ao cartão concluído, o que mantém filhos fantasmas fora dos
  resumos.
- `workboard_attachment_add`, `workboard_attachment_read` e
  `workboard_attachment_delete` armazenam pequenos anexos de cartão no estado
  SQLite do Plugin, indexam-nos no cartão e os expõem no contexto do worker.
- `workboard_worker_log` e `workboard_protocol_violation` registram linhas de
  log de worker e bloqueiam cartões quando um worker automatizado para sem
  chamar `workboard_complete` ou `workboard_block`.
- `workboard_board_create`, `workboard_board_archive` e
  `workboard_board_delete` gerenciam metadados persistidos de quadro, como nome
  de exibição, descrição, estado de arquivamento e espaço de trabalho padrão.
- `workboard_runs` retorna o histórico persistido de tentativas de execução
  armazenado em um cartão.
- `workboard_specify` transforma um cartão bruto de triagem ou backlog em um
  cartão `todo` esclarecido e registra o resumo de especificação no cartão.
- `workboard_decompose` distribui um cartão pai de orquestração em filhos
  vinculados, herda metadados de quadro e locatário e pode concluir o pai com um
  manifesto de cartões criados.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance` e
  `workboard_notify_unsubscribe` gerenciam assinaturas de notificação no estado
  do Plugin. Leituras de eventos são seguras para repetição; a ferramenta de
  avanço move o cursor durável para que chamadores possam retomar sem perder nem
  ler duas vezes eventos de cartões concluídos, com falha ou obsoletos.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock` e `workboard_dispatch` permitem que um
  agente inspecione namespaces de quadros, veja estatísticas de fila, recupere
  trabalho travado, adicione notas de repasse, anexe referências de prova ou
  artefato, mova trabalho bloqueado de volta para `todo` e acione a promoção de
  dependências ou a limpeza de reivindicações obsoletas.

Cartões reivindicados rejeitam mutações por ferramentas de agente vindas de
outros agentes, a menos que o chamador tenha o token de reivindicação retornado
por `workboard_claim`. Operadores do painel ainda usam a superfície RPC normal
do Gateway e podem recuperar ou reatribuir cartões.

O Workboard armazena dados duráveis de quadro em um banco de dados relacional
SQLite pertencente ao Plugin sob o diretório de estado do OpenClaw. Quadros,
cartões, rótulos, eventos de ciclo de vida, tentativas de execução, comentários,
links de dependência, provas, referências de artefatos, metadados e blobs de
anexos, diagnósticos, notificações, logs de worker, estado de protocolo e
assinaturas são persistidos em tabelas do Workboard em vez de entradas
chave-valor do Plugin. Uma exportação de cartão ainda preserva a narrativa do
quadro sem incorporar o conteúdo dos blobs de anexos.

Instalações que usaram o Workboard na versão `.28` podem executar
`openclaw doctor --fix` para migrar os namespaces legados de estado de Plugin
enviados (`workboard.cards`, `workboard.boards` e `workboard.notify`) para o
banco de dados relacional. Se um namespace legado `workboard.attachments`
estiver presente, o doctor também migrará esses blobs de anexos.

Os diagnósticos do Workboard são calculados a partir de metadados locais dos
cartões. As verificações integradas sinalizam cartões atribuídos que aguardam
tempo demais, cartões em execução sem Heartbeat recente, cartões bloqueados que
precisam de atenção, falhas repetidas, cartões concluídos sem prova e cartões em
execução que têm apenas um vínculo frouxo de sessão.

O despacho é intencionalmente local ao Gateway. Ele não gera processos
arbitrários do sistema operacional; sessões normais de subagente do OpenClaw
ainda são responsáveis pela execução. A ação de despacho promove cartões prontos
por dependência, registra metadados de despacho em cartões prontos, bloqueia
reivindicações expiradas ou execuções com timeout, marca cartões de triagem
configurados pelo quadro como candidatos de orquestração, depois reivindica um
pequeno lote de cartões prontos e inicia execuções de worker pelo runtime de
subagente do Gateway. Cartões atribuídos usam chaves de sessão de worker
`agent:<id>:subagent:workboard-*`; cartões não atribuídos usam chaves sem escopo
`subagent:workboard-*` para que o Gateway ainda resolva o agente padrão
configurado. Workers recebem contexto limitado do cartão mais o token de
reivindicação de que precisam para enviar Heartbeat, concluir ou bloquear o
cartão pelas ferramentas do Workboard.

### Seleção de worker pelo despacho

Cada passagem de despacho inicia no máximo três workers por padrão. Cartões
prontos são ordenados por prioridade, posição e hora de criação, depois filtrados
para evitar propriedade ativa duplicada. Um despacho inicia apenas um cartão
para um determinado proprietário ou agente na mesma passagem e ignora
proprietários que já têm trabalho em execução ou em revisão no quadro.

Cartões arquivados, cartões com reivindicações ativas e cartões sem status
`ready` não são selecionados para inícios de worker. Eles ainda podem ser
afetados pelo lado de dados do despacho quando houver reivindicações obsoletas,
promoção de dependências ou limpeza de timeout.

### Prompt e ciclo de vida do worker

O prompt do worker inclui o título do cartão, notas e contexto limitados, o
quadro atribuído e o protocolo de worker do Workboard. Ele também inclui o
proprietário da reivindicação e o token de reivindicação para que o worker possa
chamar `workboard_heartbeat`, `workboard_complete` ou `workboard_block` sem que
outro ator assuma o cartão.

Quando um worker inicia com sucesso, o Workboard armazena no cartão a chave de
sessão, ID de execução, mecanismo, modo, rótulo do modelo, status e log de
worker. A chave de sessão é determinística para o quadro e o cartão, o que faz
com que despachos repetidos voltem para a mesma faixa de worker em vez de criar
sessões não relacionadas.

Se um worker não puder ser iniciado depois que um cartão for reivindicado, o
Workboard bloqueia o cartão, limpa a reivindicação, registra a falha de início
da execução e acrescenta uma linha de log de worker. Essa falha fica visível no
painel, no JSON da CLI, nas ferramentas de agente e nos diagnósticos do cartão.

### Pontos de entrada do despacho

Inícios de worker para cartões prontos podem acontecer a partir de:

- a ação de despacho do painel
- `openclaw workboard dispatch`
- `/workboard dispatch` em um canal com suporte a comandos

Todos os três pontos de entrada usam o runtime de subagente do Gateway quando o
Gateway está disponível. A CLI tem um fallback adicional para operadores: se o
Gateway estiver offline ou não expuser o método de despacho do Workboard e
nenhum destino explícito `--url` ou `--token` tiver sido fornecido, ela executa
despacho somente de dados contra o estado SQLite local. Esse fallback pode
promover dependências, limpar reivindicações obsoletas e bloquear execuções com
timeout, mas não pode iniciar workers.

Metadados de quadro podem incluir configurações de orquestração como
`autoDecompose`, `autoDecomposePerDispatch`, `defaultAssignee` e
`orchestratorProfile`. O OpenClaw registra a intenção de orquestração e a expõe
no contexto do worker; a especificação e decomposição reais ainda acontecem
pelas ferramentas normais do Workboard.

## CLI e comando slash

O Plugin registra um comando raiz da CLI:

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` chama o Gateway em execução para que os inícios de worker usem o
mesmo runtime de subagente do painel. Se o Gateway estiver indisponível, ele faz
fallback para despacho somente de dados para que a promoção de dependências, a limpeza de reivindicações obsoletas e o
bloqueio por timeout ainda possam ser executados. Falhas de autenticação, permissão e validação ainda
aparecem como erros de comando, assim como falhas para destinos explícitos `--url` ou `--token`.

O comando de barra `/workboard` oferece suporte ao mesmo caminho compacto para operadores:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` e
`/workboard dispatch`. List e show são operações de leitura para remetentes de comando
autorizados. Create e dispatch exigem status de proprietário em superfícies de chat ou um cliente
Gateway com `operator.write` ou `operator.admin`.

Consulte [CLI do Workboard](/pt-BR/cli/workboard) para flags de comando, saída JSON, comportamento de
fallback do Gateway, tratamento inequívoco de prefixos de id, regras de seleção de despacho e
solução de problemas.

## Sincronização do ciclo de vida da sessão

Cartões podem ser vinculados a sessões existentes do painel ou à sessão criada
quando você inicia o trabalho a partir de um cartão. Cartões vinculados mostram o ciclo de vida da sessão inline:
em execução, obsoleto, vinculado ocioso, concluído, com falha ou ausente.

Se a sessão vinculada estiver ausente, o cartão permanece vinculado para contexto e ainda
oferece controles de início para que você possa reiniciar o trabalho em uma nova sessão do painel.
Se uma sessão vinculada ativa parar de reportar atividade recente, o Workboard marca o
cartão como obsoleto e armazena o marcador como metadados do cartão até que o ciclo de vida o limpe.

Você também pode capturar uma sessão existente do painel pela aba Sessions com
Add to Workboard. O cartão é vinculado a essa sessão, usa o rótulo da sessão ou
o prompt recente do usuário como título, e preenche as notas a partir do prompt recente do usuário mais
a resposta mais recente do assistente quando o histórico de chat está disponível.

O Workboard acompanha a sessão vinculada enquanto o cartão ainda está em um estado de trabalho
ativo:

- sessão vinculada ativa -> `running`
- sessão vinculada concluída -> `review`
- sessão vinculada com falha, encerrada, expirada por timeout ou abortada -> `blocked`

Estados manuais de revisão prevalecem. Se você mover um cartão para `review`, `blocked` ou `done`,
o Workboard para de mover automaticamente esse cartão até que você o mova de volta para `todo` ou
`running`.

## Fluxo de trabalho do painel

1. Abra a aba Workboard na Control UI.
2. Crie um cartão com título, notas, prioridade, rótulos, agente opcional e
   sessão vinculada opcional.
3. Ou abra Sessions e escolha Add to Workboard para uma sessão existente.
4. Arraste o cartão entre colunas ou foque o controle compacto de status no cartão
   e use seu menu ou ArrowLeft/ArrowRight.
5. Inicie o trabalho a partir do cartão para criar ou reutilizar uma sessão do painel.
6. Abra a sessão vinculada pelo cartão enquanto o agente trabalha.
7. Deixe a sincronização do ciclo de vida mover o trabalho em execução para revisão ou bloqueado, depois mova manualmente
   o cartão para concluído quando aceito.

Iniciar um cartão usa sessões normais do Gateway. O plugin Workboard armazena apenas
metadados e links do cartão; a transcrição da conversa, a seleção do modelo e o ciclo de vida
da execução continuam pertencendo ao sistema regular de sessões.

Use Stop em um cartão vinculado ativo para abortar a execução da sessão ativa. O Workboard marca
esse cartão como `blocked` para que ele permaneça visível para acompanhamento.

Novos cartões podem começar a partir de templates do Workboard para correções de bugs, docs, releases, revisões de PR
ou trabalho em plugin. Os templates preenchem previamente título, notas, rótulos e prioridade,
e o id do template selecionado é armazenado como metadados do cartão.

## Permissões

O plugin registra métodos RPC do Gateway no namespace `workboard.*`:

- `workboard.cards.list` exige `operator.read`
- `workboard.cards.export` exige `operator.read`
- `workboard.cards.diagnostics` exige `operator.read`
- `workboard.cards.diagnostics.refresh` exige `operator.write`
- leituras de lista/obtenção de anexos e eventos de notificação exigem `operator.read`
- avanço do cursor de notificação exige `operator.write`
- métodos de criar, atualizar, mover, excluir, comentar, vincular, link de dependência, prova, artefato,
  adicionar/excluir anexo, log de worker, violação de protocolo, reivindicação, heartbeat,
  release, concluir, bloquear, desbloquear, despachar, em massa e arquivar exigem
  `operator.write`

Navegadores conectados com acesso de operador somente leitura podem inspecionar o quadro, mas
não podem modificar cartões.

## Configuração

O Workboard não tem configuração específica do plugin hoje. Habilite ou desabilite-o com a
entrada padrão de plugin:

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

Desabilite-o novamente com:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Solução de problemas

### A aba diz que o Workboard está indisponível

Verifique a política de plugin:

```bash
openclaw plugins inspect workboard --runtime --json
```

Se `plugins.allow` estiver configurado, adicione `workboard` a essa lista de permissões. Se
`plugins.deny` contiver `workboard`, remova-o antes de habilitar o plugin.

### Cartões não são salvos

Confirme se a conexão do navegador tem acesso `operator.write`. Sessões de operador somente leitura
podem listar cartões, mas não podem criá-los, editá-los, movê-los ou excluí-los.

### Iniciar um cartão não abre a sessão esperada

O Workboard cria links para sessões normais do painel. Verifique o id do agente do cartão
e a sessão vinculada, depois abra a visualização Sessions ou Chat para inspecionar o estado real
da execução.

### O despacho não inicia um worker

Confirme que há pelo menos um cartão `ready` sem uma reivindicação ativa:

```bash
openclaw workboard list --status ready
```

Se a CLI reportar despacho somente de dados, inicie ou reinicie o Gateway e tente novamente.
O despacho somente de dados atualiza o estado local do quadro, mas não pode iniciar execuções de worker
subagente.

Cartões também podem ser ignorados quando outro cartão para o mesmo proprietário ou agente
já está em execução ou aguardando revisão. Conclua, bloqueie ou libere esse trabalho ativo
antes de despachar mais trabalho para o mesmo proprietário.

## Relacionado

- [Control UI](/pt-BR/web/control-ui)
- [CLI do Workboard](/pt-BR/cli/workboard)
- [Plugins](/pt-BR/tools/plugin)
- [Gerenciar plugins](/pt-BR/plugins/manage-plugins)
- [Sessões](/pt-BR/concepts/session)
