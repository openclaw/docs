---
read_when:
    - Um usuário relata que agentes estão ficando presos repetindo chamadas de ferramenta
    - Você precisa ajustar a proteção contra chamadas repetitivas
    - Você está editando políticas de ferramenta/runtime do agente
summary: Como habilitar e ajustar guardrails que detectam loops repetitivos de chamadas de ferramenta
title: Detecção de loop de ferramenta
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T06:17:33Z"
  model: gpt-5.4
  provider: openai
  source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
  source_path: tools/loop-detection.md
  workflow: 15
---

O OpenClaw pode impedir que agentes fiquem presos em padrões repetidos de chamadas de ferramenta.
Essa proteção fica **desabilitada por padrão**.

Habilite-a apenas onde for necessário, porque ela pode bloquear chamadas repetidas legítimas com configurações restritas.

## Por que isso existe

- Detectar sequências repetitivas que não fazem progresso.
- Detectar loops de alta frequência sem resultado (mesma ferramenta, mesmas entradas, erros repetidos).
- Detectar padrões específicos de chamadas repetidas para ferramentas conhecidas de polling.

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

- `enabled`: interruptor principal. `false` significa que nenhuma detecção de loop é executada.
- `historySize`: número de chamadas recentes de ferramenta mantidas para análise.
- `warningThreshold`: limite antes de classificar um padrão apenas como aviso.
- `criticalThreshold`: limite para bloquear padrões repetitivos de loop.
- `globalCircuitBreakerThreshold`: limite global do disjuntor para ausência de progresso.
- `detectors.genericRepeat`: detecta padrões repetidos de mesma ferramenta + mesmos parâmetros.
- `detectors.knownPollNoProgress`: detecta padrões conhecidos de polling sem mudança de estado.
- `detectors.pingPong`: detecta padrões alternados de ping-pong.

## Configuração recomendada

- Comece com `enabled: true`, mantendo os padrões inalterados.
- Mantenha os limites ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se ocorrerem falsos positivos:
  - aumente `warningThreshold` e/ou `criticalThreshold`
  - (opcionalmente) aumente `globalCircuitBreakerThreshold`
  - desabilite apenas o detector que estiver causando problemas
  - reduza `historySize` para um contexto histórico menos rigoroso

## Logs e comportamento esperado

Quando um loop é detectado, o OpenClaw informa um evento de loop e bloqueia ou reduz o próximo ciclo de ferramenta dependendo da gravidade.
Isso protege os usuários contra gasto descontrolado de tokens e travamentos, preservando o acesso normal às ferramentas.

- Prefira primeiro aviso e supressão temporária.
- Escalone apenas quando evidência repetida se acumular.

## Observações

- `tools.loopDetection` é mesclado com substituições no nível do agente.
- A configuração por agente substitui ou estende totalmente os valores globais.
- Se não houver configuração, as proteções permanecem desligadas.

## Relacionado

- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- [Níveis de Thinking](/pt-BR/tools/thinking)
- [Subagentes](/pt-BR/tools/subagents)
