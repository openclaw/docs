---
doc-schema-version: 1
read_when:
    - Você quer que o OpenClaw mantenha um objetivo visível durante uma sessão longa
    - Você precisa pausar, retomar, bloquear, concluir ou limpar o objetivo de uma sessão
    - Você quer entender as ferramentas get_goal, create_goal e update_goal
    - Você quer ver como as metas aparecem na TUI
summary: 'Objetivos da sessão: objetivos duráveis por sessão, controles de /goal, ferramentas de objetivo do modelo, orçamentos de tokens e status da TUI'
title: Objetivo
x-i18n:
    generated_at: "2026-07-12T00:26:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Meta

Uma **meta** é um objetivo duradouro associado à sessão atual do OpenClaw.
Ela fornece ao agente e ao operador um propósito compartilhado para trabalhos de longa duração,
sem transformar esse propósito em uma tarefa em segundo plano, um lembrete, um trabalho Cron ou
uma ordem permanente.

As metas fazem parte do estado da sessão: elas acompanham a chave da sessão, persistem após
reinicializações do processo e aparecem em `/goal`, nas ferramentas de meta voltadas ao modelo e no
rodapé da TUI.

## Início rápido

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal edit get CI green for PR 87469, push the fix, and update docs
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` é opcional: `/goal get CI green for PR 87469` também cria uma meta,
pois qualquer texto após `/goal` que não seja uma palavra de ação conhecida é tratado como um
novo objetivo.

## Para que servem as metas

Use uma meta quando uma sessão tiver um resultado concreto que deva permanecer visível
ao longo de muitas interações:

- A conclusão de um PR: corrigir, verificar, executar a revisão automática, enviar e abrir ou atualizar o PR.
- Uma sessão de depuração: reproduzir o bug, identificar a área responsável, aplicar a correção e
  comprová-la.
- Uma revisão de documentação: ler a documentação relevante, escrever a nova página, adicionar referências cruzadas e
  verificar a compilação da documentação.
- Uma tarefa de manutenção: inspecionar o estado atual, fazer alterações delimitadas, executar as
  verificações adequadas e relatar o que mudou.

Uma meta não é uma fila de tarefas. Use o [TaskFlow](/pt-BR/automation/taskflow),
as [tarefas](/pt-BR/automation/tasks), os [trabalhos Cron](/pt-BR/automation/cron-jobs) ou
as [ordens permanentes](/pt-BR/automation/standing-orders) quando o trabalho precisar ser executado de forma independente,
repetido segundo uma programação, distribuído em subtarefas gerenciadas ou mantido como uma política.

## Referência de comandos

`/goal` sem argumentos exibe o resumo da meta atual:

```text
Meta
Status: ativa
Objetivo: deixar a CI verde para o PR 87469 e enviar a correção
Tokens usados: 12k
Orçamento de tokens: 12k/50k

Comandos: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Comando                                             | Efeito                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/goal` ou `/goal status`                           | Exibe a meta atual.                                                                          |
| `/goal start <objective>`                           | Cria uma nova meta para a sessão atual.                                                      |
| `/goal set <objective>`, `/goal create <objective>` | Aliases de `start`.                                                                          |
| `/goal <objective>`                                 | Também cria uma nova meta (qualquer texto que não seja uma palavra de ação reconhecida).      |
| `/goal edit <objective>`                            | Reformula o objetivo atual; o status e a contabilização de tokens permanecem inalterados.     |
| `/goal pause [note]`                                | Pausa uma meta ativa.                                                                        |
| `/goal resume [note]`                               | Retoma uma meta pausada, bloqueada, limitada por uso ou limitada pelo orçamento.              |
| `/goal complete [note]`                             | Marca a meta como alcançada.                                                                 |
| `/goal done [note]`                                 | Alias de `complete`.                                                                         |
| `/goal block [note]`                                | Marca a meta como bloqueada.                                                                 |
| `/goal blocked [note]`                              | Alias de `block`.                                                                            |
| `/goal clear`                                       | Remove a meta da sessão.                                                                     |

Só pode existir uma meta por sessão de cada vez. A criação de uma segunda meta falha
com `Goal error: goal already exists` até que a atual seja removida.

`/goal start` não aceita uma opção de orçamento de tokens; um orçamento só pode ser definido
pela ferramenta `create_goal` voltada ao modelo.

## Status

- `active`: a sessão está buscando alcançar a meta.
- `paused`: o operador pausou a meta; `/goal resume` a torna ativa
  novamente.
- `blocked`: o agente ou o operador relatou um bloqueio real; `/goal resume`
  torna a meta ativa novamente quando novas informações ou um novo estado estiverem disponíveis.
- `budget_limited`: o orçamento de tokens configurado foi atingido; `/goal resume`
  reinicia a busca pelo mesmo objetivo com uma nova janela de orçamento.
- `usage_limited`: reservado para um futuro estado de interrupção por limite de uso; `/goal
resume` reinicia a busca da mesma maneira.
- `complete`: a meta foi alcançada. Metas concluídas são terminais; use `/goal
clear` antes de iniciar outra meta.

`/new` e `/reset` removem a meta da sessão atual, pois iniciam intencionalmente
um novo contexto de sessão.

## Orçamentos de tokens

As metas podem ter um orçamento de tokens positivo opcional, definido pelo parâmetro
`token_budget` da ferramenta `create_goal`. O orçamento é medido a partir da
contagem atualizada de tokens da sessão no momento da criação da meta. Se a sessão tiver apenas um
retrato desatualizado ou desconhecido da contagem de tokens quando a meta for iniciada, o OpenClaw aguardará o
próximo retrato atualizado e o usará como referência, para que os tokens gastos antes da
existência da meta não sejam contabilizados nela.

Quando o uso atinge o orçamento, a meta passa para `budget_limited`. Isso não
exclui a meta nem apaga o objetivo; apenas informa ao operador e ao
agente que a meta deixou de ser buscada ativamente até ser retomada ou
removida. Retomar inicia uma nova janela de orçamento com a contagem atualizada de
tokens atual.

Os orçamentos de tokens são um mecanismo de proteção para metas da sessão, não um limite de cobrança. A cota
do provedor, os relatórios de custos e o comportamento da janela de contexto continuam usando os controles normais
de uso e modelo do OpenClaw.

## Ferramentas do modelo

O OpenClaw disponibiliza três ferramentas de meta aos ambientes de execução de agentes:

| Ferramenta    | Finalidade                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Lê a meta atual da sessão: status, objetivo, uso de tokens e orçamento de tokens.                                                     |
| `create_goal` | Cria uma meta somente quando as instruções do usuário ou do sistema solicitam isso explicitamente. Falha se a sessão já tiver uma meta. |
| `update_goal` | Marca a meta como `complete` ou `blocked`.                                                                                            |

O modelo não pode pausar, retomar, remover ou substituir silenciosamente uma meta. Essas ações permanecem
como controles do operador ou da sessão por meio de `/goal` e dos comandos de redefinição, para que o agente
possa relatar a conclusão ou um bloqueio genuíno sem alterar discretamente o
objetivo.

`update_goal` só deve marcar uma meta como `complete` quando o objetivo tiver sido
realmente alcançado. Só deve marcar uma meta como `blocked` após a mesma
condição de bloqueio se repetir por pelo menos três interações consecutivas da meta, não em casos de
dificuldade comum ou falta de refinamento.

## Contexto da meta em cada interação

Cada interação do usuário ou do chat com uma meta ativa inclui esta linha de contexto com função de usuário:

```text
Meta ativa: <objective> — avance-a ou atualize seu status (get_goal/update_goal).
```

O OpenClaw mantém a linha compacta truncando objetivos longos. Metas pausadas,
bloqueadas, limitadas pelo orçamento, limitadas pelo uso e concluídas não são inseridas,
portanto uma interrupção feita pelo operador permanece em vigor até que a meta seja retomada.

## Interface de controle

A interface de controle web exibe a meta como um indicador compacto acima do campo de composição do chat:
um ícone de status, o rótulo do status (por exemplo, `Buscando a meta`), o objetivo
truncado e um cronômetro de tempo decorrido atualizado em tempo real.

O indicador contém controles integrados:

- **Lápis** preenche o campo de composição com `/goal edit <objective>` para que o
  objetivo possa ser reformulado e enviado.
- **Pausar/retomar** alterna entre `/goal pause` e `/goal resume` de acordo
  com o status atual.
- **Lixeira** envia `/goal clear`.
- **Seta** expande o indicador para mostrar o objetivo completo, a observação de status mais
  recente, o uso de tokens e o tempo decorrido.

Os botões de ação ficam ocultos enquanto o campo de composição não pode enviar mensagens (por exemplo,
quando a conexão com o Gateway está inativa); a seta de expansão continua funcionando.

## TUI

O rodapé da TUI mantém a meta da sessão ativa visível ao lado dos campos de agente,
sessão e modelo, antes dos indicadores de tokens e modo.

Exemplos de rodapé:

- `Buscando a meta (12k/50k)` para uma meta ativa com orçamento de tokens.
- `Meta pausada (/goal resume)` para uma meta pausada.
- `Meta bloqueada (/goal resume)` para uma meta bloqueada.
- `Meta atingiu os limites de uso (/goal resume)` para uma meta limitada por uso.
- `Meta não alcançada (50k/50k)` para uma meta limitada pelo orçamento.
- `Meta alcançada (42k)` para uma meta concluída.

O rodapé é intencionalmente compacto. Use `/goal` para consultar o objetivo completo,
a observação, o orçamento de tokens e os comandos disponíveis.

## Comportamento nos canais

`/goal` funciona em sessões do OpenClaw compatíveis com comandos, incluindo a TUI e
as interfaces de chat que permitem comandos de texto. O estado da meta está associado à
chave da sessão, não ao transporte, portanto duas interfaces que compartilham uma chave de sessão veem a
mesma meta.

O estado da meta não é uma diretiva de entrega: ele não força respostas por um
canal, não altera o comportamento da fila, não aprova ferramentas nem agenda trabalhos.

## Solução de problemas

| Mensagem                                | Significado                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`       | A sessão já tem uma meta. Use `/goal` para inspecioná-la, `/goal complete` se estiver concluída ou `/goal clear` antes de iniciar um objetivo diferente.      |
| `Goal error: goal not found`            | A sessão ainda não tem uma meta. Inicie uma com `/goal start <objective>`.                                                                                    |
| `Goal error: goal is already complete`  | A meta é terminal. Remova-a antes de iniciar ou retomar outro objetivo.                                                                                       |

Se o uso de tokens mostrar `0` ou parecer desatualizado, talvez a sessão ativa ainda não tenha um
retrato atualizado dos tokens. O uso é atualizado à medida que o OpenClaw registra o uso da sessão
e os totais derivados da transcrição.

## Relacionados

- [Comandos de barra](/pt-BR/tools/slash-commands)
- [TUI](/pt-BR/web/tui)
- [Ferramenta de sessão](/pt-BR/concepts/session-tool)
- [Compaction](/pt-BR/concepts/compaction)
- [TaskFlow](/pt-BR/automation/taskflow)
- [Ordens permanentes](/pt-BR/automation/standing-orders)
