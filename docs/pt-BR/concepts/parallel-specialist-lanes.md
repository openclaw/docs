---
read_when:
    - Você encaminha conversas em grupo para agentes dedicados
    - Você quer trabalho em paralelo sem que uma tarefa longa bloqueie todos os chats
    - Você está projetando uma configuração de operações multiagente
sidebarTitle: Specialist lanes
status: active
summary: Execute agentes especialistas em paralelo sem sobrecarregar a capacidade compartilhada do modelo e das ferramentas
title: Frentes paralelas de especialistas
x-i18n:
    generated_at: "2026-07-11T23:53:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

As vias paralelas de especialistas permitem que um Gateway encaminhe diferentes chats ou salas para
diferentes agentes, mantendo a experiência do usuário rápida. Trate o paralelismo como
um problema de projeto envolvendo recursos escassos, não apenas como "mais agentes".

## Princípios fundamentais

Uma via de especialista só melhora a capacidade de processamento quando reduz a contenção pelos
verdadeiros gargalos:

- **Bloqueios de sessão**: apenas uma execução deve alterar uma determinada sessão por vez.
- **Capacidade global do modelo**: todas as execuções visíveis de chat ainda compartilham os limites do provedor.
- **Capacidade das ferramentas**: trabalhos no shell, navegador, rede e repositório podem ser mais lentos
  que a própria interação com o modelo.
- **Orçamento de contexto**: transcrições longas tornam cada interação futura mais lenta e menos
  focada.
- **Ambiguidade de responsabilidade**: agentes duplicados fazendo o mesmo trabalho desperdiçam capacidade.

O OpenClaw já serializa as execuções por sessão e limita o paralelismo global
por meio da [fila de comandos](/pt-BR/concepts/queue). As vias de especialistas adicionam uma camada de
política: qual agente é responsável por qual trabalho, o que permanece no chat e o que se torna
trabalho em segundo plano.

## Implantação recomendada

### Fase 1: contratos das vias + trabalho pesado em segundo plano

Forneça a cada via um contrato escrito em seu espaço de trabalho e prompt do sistema:

- **Finalidade**: o trabalho pelo qual esta via é responsável.
- **Fora do escopo**: trabalho que ela deve encaminhar em vez de tentar realizar.
- **Orçamento do chat**: respostas rápidas permanecem no chat; tarefas longas recebem uma confirmação breve
  e são executadas por um subagente ou tarefa em segundo plano.
- **Regra de encaminhamento**: quando outra via for responsável pelo trabalho, informe para onde ele deve ser enviado e
  forneça um resumo conciso para o encaminhamento.
- **Regra de risco das ferramentas**: prefira a menor superfície de ferramentas capaz de realizar o trabalho.

Esta é a fase de menor custo e resolve a maior parte dos congestionamentos: um trabalho de programação não
transforma mais a via de pesquisa em algo extremamente lento, e cada chat mantém seu próprio contexto
limpo.

### Fase 2: controles de prioridade e simultaneidade

Ajuste a capacidade da fila e do modelo de acordo com o valor de negócio de cada via:

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

Use chats diretos/pessoais e agentes de operações de produção para trabalhos de alta prioridade. Permita
que pesquisa, elaboração de textos e programação em lote sejam transferidas para tarefas em segundo plano quando o sistema estiver
ocupado.

### Fase 3: coordenador/controlador de tráfego

Adicione um padrão simples de coordenação quando várias vias estiverem ativas:

- Acompanhe as tarefas e os responsáveis ativos de cada via.
- Detecte solicitações duplicadas entre grupos.
- Encaminhe resumos de transferência entre as vias.
- Apresente apenas bloqueios, resultados concluídos e decisões que a pessoa precisa tomar.

Não comece por aqui. Um coordenador sem contratos de vias apenas coordena o caos.

## Modelo mínimo de contrato de via

```md
# Contrato da via

## Responsabilidades

- <trabalho pelo qual esta via é responsável>

## Fora das responsabilidades

- <trabalho a ser encaminhado>

## Orçamento do chat

- Responda diretamente às perguntas rápidas.
- Para trabalhos com várias etapas, lentos ou que exijam muitas ferramentas: confirme brevemente, inicie/execute
  o trabalho em segundo plano e retorne o resultado quando estiver concluído.

## Encaminhamento

Se outra via for responsável pela solicitação, responda com:

- via de destino
- objetivo
- contexto relevante
- próxima ação exata

## Postura quanto às ferramentas

Use a menor superfície de ferramentas capaz de concluir a tarefa. Evite trabalhos abrangentes no shell ou
na rede, a menos que esta via seja explicitamente responsável por eles.
```

## Relacionados

- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Fila de comandos](/pt-BR/concepts/queue)
- [Subagentes](/pt-BR/tools/subagents)
