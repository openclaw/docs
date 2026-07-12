---
doc-schema-version: 1
read_when:
    - Você quer que o OpenClaw mantenha um objetivo visível durante uma sessão longa
    - Você precisa pausar, retomar, bloquear, concluir ou limpar uma meta da sessão
    - Você quer entender as ferramentas get_goal, create_goal e update_goal
    - Você quer ver como as metas aparecem na TUI
summary: 'Metas da sessão: objetivos duráveis por sessão, controles de /goal, ferramentas de meta do modelo, orçamentos de tokens e status da TUI'
title: Objetivo
x-i18n:
    generated_at: "2026-07-12T15:48:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Objetivo

Um **objetivo** é uma meta duradoura associada à sessão atual do OpenClaw.
Ele fornece ao agente e ao operador um alvo compartilhado para trabalhos de longa duração,
sem transformar esse alvo em uma tarefa em segundo plano, lembrete, trabalho Cron ou
ordem permanente.

Os objetivos fazem parte do estado da sessão: acompanham a chave da sessão, persistem após
reinicializações do processo e aparecem em `/goal`, nas ferramentas de objetivo voltadas ao modelo e no rodapé da TUI.

## Início rápido

```text
/goal start deixar a CI verde para o PR 87469 e enviar a correção
/goal
/goal edit deixar a CI verde para o PR 87469, enviar a correção e atualizar a documentação
/goal pause aguardando a CI
/goal resume
/goal complete enviado e verificado
/goal clear
```

`start` é opcional: `/goal get CI green for PR 87469` também cria uma meta,
pois qualquer texto após `/goal` que não seja uma palavra de ação conhecida é tratado como um
novo objetivo.

## Para que servem os objetivos

Use um objetivo quando uma sessão tiver um resultado concreto que deva permanecer visível
ao longo de muitas interações:

- A conclusão de um PR: corrigir, verificar, executar a revisão automática, enviar e abrir ou atualizar o PR.
- Uma sessão de depuração: reproduzir o bug, identificar a área responsável, aplicar a correção e
  comprová-la.
- Uma revisão de documentação: ler a documentação relevante, escrever a nova página, adicionar referências cruzadas e
  verificar a compilação da documentação.
- Uma tarefa de manutenção: inspecionar o estado atual, fazer alterações delimitadas, executar as
  verificações adequadas e relatar o que mudou.

Um objetivo não é uma fila de tarefas. Use [TaskFlow](/pt-BR/automation/taskflow),
[tarefas](/pt-BR/automation/tasks), [tarefas Cron](/pt-BR/automation/cron-jobs) ou
[ordens permanentes](/pt-BR/automation/standing-orders) quando o trabalho precisar ser executado de forma desacoplada,
repetido conforme uma programação, distribuído em subtarefas gerenciadas ou mantido como uma política.

## Referência de comandos

`/goal` sem argumentos exibe o resumo do objetivo atual:

```text
Meta
Status: ativo
Objetivo: deixar a CI verde para o PR 87469 e enviar a correção
Tokens usados: 12k
Orçamento de tokens: 12k/50k

Comandos: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Comando                                             | Efeito                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `/goal` ou `/goal status`                           | Exibe a meta atual.                                                                         |
| `/goal start <objective>`                           | Cria uma nova meta para a sessão atual.                                                     |
| `/goal set <objective>`, `/goal create <objective>` | Aliases de `start`.                                                                         |
| `/goal <objective>`                                 | Também cria uma nova meta (qualquer texto que não seja uma palavra de ação reconhecida).    |
| `/goal edit <objective>`                            | Reformula o objetivo atual; o status e a contabilização de tokens permanecem inalterados.   |
| `/goal pause [note]`                                | Pausa uma meta ativa.                                                                       |
| `/goal resume [note]`                               | Retoma uma meta pausada, bloqueada, limitada por uso ou limitada por orçamento.             |
| `/goal complete [note]`                             | Marca a meta como alcançada.                                                                |
| `/goal done [note]`                                 | Alias de `complete`.                                                                        |
| `/goal block [note]`                                | Marca a meta como bloqueada.                                                                |
| `/goal blocked [note]`                              | Alias de `block`.                                                                           |
| `/goal clear`                                       | Remove a meta da sessão.                                                                    |

Só pode existir uma meta por vez em uma sessão. Iniciar uma segunda meta falha
com `Goal error: goal already exists` até que a atual seja removida.

`/goal start` não aceita um sinalizador de orçamento de tokens; um orçamento só
pode ser definido por meio da ferramenta `create_goal` voltada para o modelo.

## Status

- `active`: a sessão está buscando alcançar a meta.
- `paused`: o operador pausou a meta; `/goal resume` a torna ativa
  novamente.
- `blocked`: o agente ou operador relatou um bloqueio real; `/goal resume`
  a torna ativa novamente quando novas informações ou um novo estado estão disponíveis.
- `budget_limited`: o orçamento de tokens configurado foi atingido; `/goal resume`
  reinicia a busca pelo mesmo objetivo com uma nova janela de orçamento.
- `usage_limited`: reservado para um futuro estado de interrupção por limite de uso; `/goal
resume` reinicia a busca da mesma forma.
- `complete`: a meta foi alcançada. Metas concluídas são terminais; use `/goal
clear` antes de iniciar outra meta.

`/new` e `/reset` apagam o objetivo atual da sessão, pois iniciam intencionalmente
um novo contexto de sessão.

## Orçamentos de tokens

Os objetivos podem ter um orçamento de tokens positivo opcional, definido por meio do
parâmetro `token_budget` da ferramenta `create_goal`. O orçamento é medido a partir da
contagem atualizada de tokens da sessão no momento da criação do objetivo. Se a sessão tiver apenas
um instantâneo de tokens desatualizado ou desconhecido quando o objetivo for iniciado, o OpenClaw aguardará o
próximo instantâneo atualizado e o usará como referência, para que os tokens gastos antes da
existência do objetivo não sejam contabilizados nele.

Quando o uso atinge o orçamento, o objetivo passa para `budget_limited`. Isso não
exclui o objetivo nem apaga a finalidade; informa ao operador e ao
agente que o objetivo não está mais sendo buscado ativamente até que seja retomado ou
apagado. A retomada inicia uma nova janela de orçamento a partir da contagem atualizada de
tokens atual.

Os orçamentos de tokens são um mecanismo de proteção para objetivos da sessão, não um limite de cobrança. A
cota do provedor, os relatórios de custos e o comportamento da janela de contexto ainda usam os controles normais de
uso e de modelo do OpenClaw.

## Ferramentas de modelo

O OpenClaw disponibiliza três ferramentas de objetivo para os ambientes de execução de agentes:

| Ferramenta     | Finalidade                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `get_goal`     | Lê a meta atual da sessão: status, objetivo, uso de tokens e orçamento de tokens.                                                    |
| `create_goal`  | Cria uma meta somente quando as instruções do usuário ou do sistema solicitam uma explicitamente. Falha se a sessão já tiver uma meta. |
| `update_goal`  | Marca a meta como `complete` ou `blocked`.                                                                                           |

O modelo não pode pausar, retomar, limpar ou substituir uma meta silenciosamente. Essas ações permanecem
como controles do operador/da sessão por meio de `/goal` e dos comandos de redefinição, para que o agente
possa relatar a conclusão ou um bloqueio real sem alterar discretamente o
objetivo.

`update_goal` deve marcar uma meta como `complete` somente quando o objetivo
tiver sido realmente alcançado. Deve marcar uma meta como `blocked` somente depois que a mesma
condição de bloqueio ocorrer novamente por pelo menos três turnos consecutivos da meta, não por
dificuldades comuns ou falta de refinamento.

## Contexto da meta em cada turno

Cada turno de usuário/chat com uma meta ativa inclui esta linha de contexto com função de usuário:

```text
Meta ativa: <objective> — avance-a ou atualize seu status (get_goal/update_goal).
```

O OpenClaw mantém a linha compacta truncando objetivos longos. Metas pausadas,
bloqueadas, limitadas por orçamento, limitadas por uso e concluídas não são injetadas,
portanto, uma interrupção do operador permanece em vigor até que a meta seja retomada.

## Interface de controle

A Interface de controle web mostra a meta como uma etiqueta compacta acima do campo de composição do chat:
um ícone de status, o rótulo de status (por exemplo, `Pursuing goal`), o objetivo
truncado e um cronômetro de tempo decorrido atualizado em tempo real.

A etiqueta contém controles embutidos:

- **Lápis** preenche previamente o campo de composição com `/goal edit <objective>` para que o
  objetivo possa ser reformulado e enviado.
- **Pausar/retomar** alterna entre `/goal pause` e `/goal resume` com base
  no status atual.
- **Lixeira** envia `/goal clear`.
- **Divisa** expande a etiqueta para mostrar o objetivo completo, a nota de status
  mais recente, o uso de tokens e o tempo decorrido.

Os botões de ação ficam ocultos enquanto o campo de composição não puder enviar (por exemplo,
quando a conexão com o Gateway estiver indisponível); a divisa de expansão continua funcionando.

## TUI

O rodapé da TUI mantém a meta da sessão ativa visível ao lado dos campos de agente,
sessão e modelo, antes dos indicadores de tokens/modo.

Exemplos de rodapé:

- `Pursuing goal (12k/50k)` para uma meta ativa com orçamento de tokens.
- `Goal paused (/goal resume)` para uma meta pausada.
- `Goal blocked (/goal resume)` para uma meta bloqueada.
- `Goal hit usage limits (/goal resume)` para uma meta limitada por uso.
- `Goal unmet (50k/50k)` para uma meta limitada por orçamento.
- `Goal achieved (42k)` para uma meta concluída.

O rodapé é intencionalmente compacto. Use `/goal` para consultar o objetivo completo,
a nota, o orçamento de tokens e os comandos disponíveis.

## Comportamento do canal

`/goal` funciona em sessões do OpenClaw que aceitam comandos, incluindo a TUI e
superfícies de chat que permitem comandos de texto. O estado da meta é associado à
chave da sessão, não ao transporte, portanto duas superfícies que compartilham uma chave de sessão veem a
mesma meta.

O estado da meta não é uma diretiva de entrega: ele não força respostas por meio de um
canal, não altera o comportamento da fila, não aprova ferramentas nem agenda trabalho.

## Solução de problemas

| Mensagem                               | Significado                                                                                                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | A sessão já tem uma meta. Use `/goal` para inspecioná-la, `/goal complete` se estiver concluída ou `/goal clear` antes de iniciar um objetivo diferente.               |
| `Goal error: goal not found`           | A sessão ainda não tem uma meta. Inicie uma com `/goal start <objective>`.                                                                                             |
| `Goal error: goal is already complete` | A meta está em estado terminal. Limpe-a antes de iniciar ou retomar outro objetivo.                                                                                    |

Se o uso de tokens mostrar `0` ou parecer desatualizado, a sessão ativa talvez ainda não tenha um
snapshot recente de tokens. O uso é atualizado à medida que o OpenClaw registra o uso da sessão
e os totais derivados da transcrição.

## Relacionado

- [Comandos de barra](/pt-BR/tools/slash-commands)
- [TUI](/pt-BR/web/tui)
- [Ferramenta de sessão](/pt-BR/concepts/session-tool)
- [Compaction](/pt-BR/concepts/compaction)
- [TaskFlow](/pt-BR/automation/taskflow)
- [Ordens permanentes](/pt-BR/automation/standing-orders)
