---
doc-schema-version: 1
read_when:
    - Você quer que o OpenClaw mantenha um objetivo visível durante uma sessão longa
    - Você precisa pausar, retomar, bloquear, concluir ou limpar uma meta de sessão
    - Você quer entender as ferramentas get_goal, create_goal e update_goal
    - Você quer ver como os objetivos aparecem na TUI
summary: 'Objetivos da sessão: objetivos duráveis por sessão, controles /goal, ferramentas de objetivo do modelo, orçamentos de tokens e status da TUI'
title: Objetivo
x-i18n:
    generated_at: "2026-06-27T18:15:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# Objetivo

Um **objetivo** é um objetivo durável anexado à sessão atual do OpenClaw.
Ele dá ao agente e ao operador um alvo compartilhado para trabalho de longa duração,
sem transformar esse alvo em uma tarefa em segundo plano, lembrete, tarefa cron ou
ordem permanente.

Objetivos são estado da sessão. Eles acompanham a chave da sessão, sobrevivem a
reinicializações do processo, aparecem em `/goal`, ficam disponíveis para o modelo
por meio das ferramentas de objetivo e aparecem no rodapé da TUI quando a sessão
ativa tem um.

## Início rápido

Defina um objetivo:

```text
/goal start get CI green for PR 87469 and push the fix
```

Verifique-o:

```text
/goal
```

Pause-o quando o trabalho estiver intencionalmente aguardando:

```text
/goal pause waiting for CI
```

Retome-o:

```text
/goal resume
```

Marque-o como concluído:

```text
/goal complete pushed and verified
```

Limpe-o:

```text
/goal clear
```

## Para que servem os objetivos

Use um objetivo quando uma sessão tiver um resultado concreto que deve permanecer visível
ao longo de muitos turnos:

- Um fechamento de PR: corrigir, verificar, fazer autoreview, enviar e abrir ou atualizar o PR.
- Uma execução de depuração: reproduzir o bug, identificar a superfície responsável, corrigir e comprovar
  a correção.
- Uma revisão de docs: ler os docs relevantes, escrever a nova página, adicionar links cruzados e
  verificar o build dos docs.
- Uma tarefa de manutenção: inspecionar o estado atual, fazer alterações delimitadas, executar as
  verificações certas e relatar o que mudou.

Um objetivo não é uma fila de tarefas. Use [TaskFlow](/pt-BR/automation/taskflow),
[tarefas](/pt-BR/automation/tasks), [tarefas cron](/pt-BR/automation/cron-jobs) ou
[ordens permanentes](/pt-BR/automation/standing-orders) quando o trabalho deve ser executado de forma desacoplada,
repetir em uma programação, se desdobrar em subtrabalhos gerenciados ou persistir como uma política.

## Referência de comandos

`/goal` sem argumentos imprime o resumo do objetivo atual:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

Comandos:

- `/goal` ou `/goal status` mostra o objetivo atual.
- `/goal start <objective>` cria um novo objetivo para a sessão atual.
- `/goal set <objective>` e `/goal create <objective>` são aliases para
  `start`.
- `/goal pause [note]` pausa um objetivo ativo.
- `/goal resume [note]` retoma um objetivo pausado, bloqueado, limitado por uso ou
  limitado por orçamento.
- `/goal complete [note]` marca o objetivo como alcançado.
- `/goal done [note]` é um alias para `complete`.
- `/goal block [note]` marca o objetivo como bloqueado.
- `/goal blocked [note]` é um alias para `block`.
- `/goal clear` remove o objetivo da sessão.

Apenas um objetivo pode existir em uma sessão por vez. Iniciar um segundo objetivo falha
até que o atual seja limpo.

## Status

Objetivos usam um pequeno conjunto de status:

- `active`: a sessão está buscando o objetivo.
- `paused`: o operador pausou o objetivo; `/goal resume` o torna ativo novamente.
- `blocked`: o agente ou operador relatou um bloqueio real; `/goal resume`
  o torna ativo novamente quando novas informações ou estado estiverem disponíveis.
- `budget_limited`: o orçamento de tokens configurado foi atingido; `/goal resume`
  reinicia a busca a partir do mesmo objetivo.
- `usage_limited`: reservado para estados de parada por limite de uso; `/goal resume`
  reinicia a busca quando permitido.
- `complete`: o objetivo foi alcançado. Objetivos concluídos são terminais; use
  `/goal clear` antes de iniciar outro objetivo.

`/new` e `/reset` limpam o objetivo da sessão atual porque iniciam intencionalmente
um contexto de sessão novo.

## Orçamentos de tokens

Objetivos podem ter um orçamento de tokens positivo opcional. O orçamento é armazenado com o
objetivo e medido a partir da contagem de tokens nova da sessão no momento da criação. Se a
sessão atual tiver apenas uso de tokens obsoleto ou desconhecido quando o objetivo começa,
o OpenClaw aguarda o próximo instantâneo novo de tokens da sessão e usa isso como a
linha de base, para que tokens gastos antes de o objetivo existir não sejam cobrados do objetivo.

Quando o uso de tokens atinge o orçamento, o objetivo muda para `budget_limited`. Isso
não exclui o objetivo nem apaga o objetivo. Ele informa ao operador e ao
agente que o objetivo não está mais sendo buscado ativamente até ser retomado ou
limpo.

Orçamentos de tokens são uma proteção de objetivo de sessão, não um limite de cobrança. Cota do provedor,
relatórios de custo e comportamento da janela de contexto ainda usam os controles normais de uso
e modelo do OpenClaw.

## Ferramentas do modelo

O OpenClaw expõe três ferramentas centrais de objetivo para harnesses de agente:

- `get_goal`: lê o objetivo da sessão atual, incluindo status, objetivo, uso de
  tokens e orçamento de tokens.
- `create_goal`: cria um objetivo apenas quando as instruções do usuário, sistema ou desenvolvedor
  solicitam explicitamente um. Ele falha se a sessão já tiver um
  objetivo.
- `update_goal`: marca o objetivo como `complete` ou `blocked`.

O modelo não pode pausar, retomar, limpar ou substituir um objetivo silenciosamente. Esses são
controles de operador/sessão por meio de `/goal` e comandos de redefinição. Isso impede que o
agente mova o alvo discretamente, preservando um caminho limpo para o
agente relatar a conclusão ou um bloqueio genuíno.

A ferramenta `update_goal` deve marcar um objetivo como `complete` apenas quando o objetivo for
realmente alcançado. Ela deve marcar um objetivo como `blocked` apenas quando a mesma condição
de bloqueio se repetiu e o agente não consegue fazer progresso significativo sem
nova entrada do usuário ou uma mudança de estado externa.

## TUI

A TUI mantém o objetivo da sessão ativa visível no rodapé ao lado do
agente, sessão, modelo, controles de execução e contagens de tokens.

Exemplos de rodapé:

- `Pursuing goal (12k/50k)` para um objetivo ativo com orçamento de tokens.
- `Goal paused (/goal resume)` para um objetivo pausado.
- `Goal blocked (/goal resume)` para um objetivo bloqueado.
- `Goal hit usage limits (/goal resume)` para um objetivo limitado por uso.
- `Goal unmet (50k/50k)` para um objetivo limitado por orçamento.
- `Goal achieved (42k)` para um objetivo concluído.

O rodapé é intencionalmente compacto. Use `/goal` para ver o objetivo completo, nota,
orçamento de tokens e comandos disponíveis.

## Comportamento de canal

O comando `/goal` funciona em sessões do OpenClaw com suporte a comandos, incluindo a
TUI e superfícies de chat que permitem comandos de texto. O estado do objetivo é anexado à
chave da sessão, não ao transporte. Se duas superfícies usarem a mesma sessão, elas verão
o mesmo objetivo.

O estado do objetivo não é uma diretiva de entrega. Ele não força respostas por meio de um
canal, altera o comportamento da fila, aprova ferramentas nem agenda trabalho.

## Solução de problemas

`Goal error: goal already exists` significa que a sessão já tem um objetivo. Use
`/goal` para inspecioná-lo, `/goal complete` se ele estiver concluído ou `/goal clear` antes de
iniciar um objetivo diferente.

`Goal error: goal not found` significa que a sessão ainda não tem objetivo. Inicie um com
`/goal start <objective>`.

`Goal error: goal is already complete` significa que o objetivo é terminal. Limpe-o
antes de iniciar ou retomar outro objetivo.

Se o uso de tokens parecer `0` ou obsoleto, a sessão ativa talvez ainda não tenha um
instantâneo novo de tokens. O uso é atualizado à medida que o OpenClaw registra o uso da sessão e
totais derivados da transcrição.

## Relacionados

- [Comandos slash](/pt-BR/tools/slash-commands)
- [TUI](/pt-BR/web/tui)
- [Ferramenta de sessão](/pt-BR/concepts/session-tool)
- [Compaction](/pt-BR/concepts/compaction)
- [TaskFlow](/pt-BR/automation/taskflow)
- [Ordens permanentes](/pt-BR/automation/standing-orders)
