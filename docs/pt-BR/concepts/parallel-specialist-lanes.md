---
read_when:
    - Você encaminha conversas em grupo para agentes dedicados
    - Você quer trabalho em paralelo sem que uma tarefa longa bloqueie todas as conversas
    - Você está projetando uma configuração de operações multiagente
sidebarTitle: Specialist lanes
status: active
summary: Execute agentes especialistas em paralelo sem sobrecarregar a capacidade compartilhada de modelos e ferramentas
title: Faixas paralelas de especialistas
x-i18n:
    generated_at: "2026-05-10T19:32:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8721056fbe08822ac92d4bc14c8c2b0977e93eaa58c2849f83b3c0f310992f93
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

As faixas especializadas paralelas permitem que um Gateway roteie diferentes chats ou salas para
agentes diferentes, mantendo a experiência do usuário rápida. O ponto é tratar o
paralelismo como um problema de projeto de recursos escassos, não apenas como "mais agentes".

## Princípios básicos

Uma faixa especializada só melhora a vazão quando reduz a contenção pelos
gargalos reais:

- **Bloqueios de sessão**: apenas uma execução deve modificar uma determinada sessão por vez.
- **Capacidade global do modelo**: todas as execuções visíveis de chat ainda compartilham os limites do provedor.
- **Capacidade de ferramentas**: shell, navegador, rede e trabalho no repositório podem ser mais lentos
  do que a própria rodada do modelo.
- **Orçamento de contexto**: transcrições longas tornam cada rodada futura mais lenta e menos
  focada.
- **Ambiguidade de propriedade**: agentes duplicados fazendo o mesmo trabalho desperdiçam capacidade.

O OpenClaw já serializa execuções por sessão e limita o paralelismo global por meio da
[fila de comandos](/pt-BR/concepts/queue). Faixas especializadas adicionam política por cima:
qual agente é responsável por qual trabalho, o que permanece no chat e o que vira trabalho
em segundo plano.

## Implantação recomendada

### Fase 1: contratos de faixa + trabalho pesado em segundo plano

Dê a cada faixa um contrato escrito em seu workspace e prompt de sistema:

- **Propósito**: o trabalho que esta faixa assume.
- **Não objetivos**: trabalho que ela deve repassar em vez de tentar.
- **Orçamento de chat**: respostas rápidas permanecem no chat; tarefas longas devem reconhecer
  brevemente e então rodar em um subagente ou tarefa em segundo plano.
- **Regra de repasse**: quando outra faixa for responsável pelo trabalho, diga para onde ele deve ir e
  forneça um resumo compacto de repasse.
- **Regra de risco de ferramenta**: prefira a menor superfície de ferramenta que possa fazer o trabalho.

Esta é a fase mais barata e corrige a maior parte dos congestionamentos: um trabalho de programação não
transforma mais a faixa de pesquisa em lentidão extrema, e cada chat mantém seu próprio contexto limpo.

### Fase 2: controles de prioridade e concorrência

Ajuste a fila e a capacidade do modelo em torno do valor de negócio de cada faixa:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

Use chats diretos/pessoais e agentes de operações de produção para trabalho de alta prioridade. Deixe
pesquisa, redação e programação em lote migrarem para tarefas em segundo plano quando o sistema estiver
ocupado.

### Fase 3: coordenador / controlador de tráfego

Adicione um pequeno padrão de coordenador quando várias faixas estiverem ativas:

- Acompanhar tarefas e responsáveis ativos por faixa.
- Detectar solicitações duplicadas entre grupos.
- Rotear resumos de repasse entre faixas.
- Exibir apenas bloqueadores, resultados concluídos e decisões que o humano precisa tomar.

Não comece por aqui. Um coordenador sem contratos de faixa apenas coordena caos.

## Modelo mínimo de contrato de faixa

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## Relacionado

- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Fila de comandos](/pt-BR/concepts/queue)
- [Subagentes](/pt-BR/tools/subagents)
