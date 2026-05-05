---
read_when:
    - Um usuário relata que agentes ficam presos repetindo chamadas de ferramentas
    - Você precisa ajustar a proteção contra chamadas repetitivas
    - Você está editando políticas de ferramentas/tempo de execução do agente
summary: Como habilitar e ajustar proteções que detectam loops repetitivos de chamadas de ferramentas
title: Detecção de loop de ferramentas
x-i18n:
    generated_at: "2026-05-05T01:49:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw pode impedir que agentes fiquem presos em padrões repetidos de chamadas de ferramentas.
A proteção é **desativada por padrão**.

Habilite-a apenas onde necessário, porque ela pode bloquear chamadas repetidas legítimas com configurações rígidas.

## Por que isso existe

- Detectar sequências repetitivas que não fazem progresso.
- Detectar loops de alta frequência sem resultado (mesma ferramenta, mesmas entradas, erros repetidos).
- Detectar padrões específicos de chamadas repetidas para ferramentas de polling conhecidas.

## Bloco de configuração

Padrões globais:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Substituição por agente (opcional):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Comportamento dos campos

- `enabled`: chave principal. `false` significa que nenhuma detecção de loop é realizada.
- `historySize`: número de chamadas recentes de ferramentas mantidas para análise.
- `warningThreshold`: limite antes de classificar um padrão apenas como aviso.
- `criticalThreshold`: limite para bloquear padrões de loop repetitivos.
- `globalCircuitBreakerThreshold`: limite global do disjuntor de ausência de progresso.
- `detectors.genericRepeat`: detecta padrões repetidos de mesma ferramenta + mesmos parâmetros.
- `detectors.knownPollNoProgress`: detecta padrões conhecidos semelhantes a polling sem alteração de estado.
- `detectors.pingPong`: detecta padrões alternados de ping-pong.

Para `exec`, as verificações de ausência de progresso comparam resultados estáveis de comandos e ignoram metadados voláteis de runtime, como duração, PID, ID da sessão e diretório de trabalho.
Quando um ID de execução está disponível, o histórico recente de chamadas de ferramentas é avaliado apenas dentro dessa execução, para que ciclos de Heartbeat agendados e execuções novas não herdem contagens de loop antigas de execuções anteriores.

## Configuração recomendada

- Para modelos menores, comece com `enabled: true`, mantendo os padrões inalterados. Modelos flagship raramente precisam de detecção de loop e podem deixá-la desativada.
- Mantenha os limites ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se ocorrerem falsos positivos:
  - aumente `warningThreshold` e/ou `criticalThreshold`
  - (opcionalmente) aumente `globalCircuitBreakerThreshold`
  - desative apenas o detector que está causando problemas
  - reduza `historySize` para um contexto histórico menos rígido

## Proteção pós-Compaction

Quando o executor conclui uma nova tentativa de Compaction automática (após um estouro de contexto), ele arma uma proteção de janela curta que observa as próximas chamadas de ferramentas. Se o agente emitir a _mesma_ tripla `(toolName, args, result)` várias vezes dentro dessa janela, a proteção conclui que a Compaction não quebrou o loop e aborta a execução com um erro `compaction_loop_persisted`.

Este é um caminho de código separado dos detectores globais de `tools.loopDetection`. Ele é configurável de forma independente:

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`: número de chamadas de ferramentas pós-Compaction durante as quais a proteção permanece armada _e_ a contagem de triplas idênticas (ferramenta, argumentos, resultado) que aciona um aborto.

A proteção nunca aborta quando os resultados estão mudando, apenas quando os resultados são idênticos byte a byte em toda a janela. Ela é intencionalmente estreita: dispara apenas no momento imediatamente posterior a uma nova tentativa de Compaction.

## Logs e comportamento esperado

Quando um loop é detectado, o OpenClaw relata um evento de loop e bloqueia ou atenua o próximo ciclo de ferramentas, dependendo da severidade.
Isso protege os usuários contra gasto descontrolado de tokens e travamentos, preservando o acesso normal às ferramentas.

- Prefira primeiro avisos e supressão temporária.
- Escale apenas quando evidências repetidas se acumularem.

## Observações

- `tools.loopDetection` é mesclado com substituições no nível do agente.
- A configuração por agente substitui ou estende totalmente os valores globais.
- Se nenhuma configuração existir, as proteções permanecem desativadas.

## Relacionado

- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- [Níveis de raciocínio](/pt-BR/tools/thinking)
- [Subagentes](/pt-BR/tools/subagents)
