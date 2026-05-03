---
read_when:
    - Um usuário relata que os agentes ficam presos repetindo chamadas de ferramenta
    - Você precisa ajustar a proteção contra chamadas repetitivas
    - Você está editando políticas de ferramentas/tempo de execução de agentes
summary: Como habilitar e ajustar proteções que detectam loops repetitivos de chamadas de ferramentas
title: Detecção de loop de ferramentas
x-i18n:
    generated_at: "2026-05-03T21:39:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw pode evitar que agentes fiquem presos em padrões repetidos de chamadas de ferramenta.
A proteção é **desativada por padrão**.

Ative-a somente onde necessário, porque ela pode bloquear chamadas repetidas legítimas com configurações estritas.

## Por que isso existe

- Detectar sequências repetitivas que não fazem progresso.
- Detectar loops de alta frequência sem resultado (mesma ferramenta, mesmas entradas, erros repetidos).
- Detectar padrões específicos de chamadas repetidas para ferramentas conhecidas de sondagem.

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
- `historySize`: número de chamadas de ferramenta recentes mantidas para análise.
- `warningThreshold`: limite antes de classificar um padrão apenas como aviso.
- `criticalThreshold`: limite para bloquear padrões de loop repetitivos.
- `globalCircuitBreakerThreshold`: limite global do disjuntor sem progresso.
- `detectors.genericRepeat`: detecta padrões repetidos de mesma ferramenta + mesmos parâmetros.
- `detectors.knownPollNoProgress`: detecta padrões conhecidos semelhantes a sondagem sem mudança de estado.
- `detectors.pingPong`: detecta padrões alternados de pingue-pongue.

Para `exec`, verificações sem progresso comparam resultados estáveis de comandos e ignoram metadados voláteis de runtime, como duração, PID, ID de sessão e diretório de trabalho.
Quando um ID de execução está disponível, o histórico recente de chamadas de ferramenta é avaliado somente dentro dessa execução, para que ciclos agendados de Heartbeat e execuções novas não herdem contagens de loop obsoletas de execuções anteriores.

## Configuração recomendada

- Para modelos menores, comece com `enabled: true`, sem alterar os padrões. Modelos de ponta raramente precisam de detecção de loop e podem deixá-la desativada.
- Mantenha os limites ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se ocorrerem falsos positivos:
  - aumente `warningThreshold` e/ou `criticalThreshold`
  - (opcionalmente) aumente `globalCircuitBreakerThreshold`
  - desative somente o detector que está causando problemas
  - reduza `historySize` para um contexto histórico menos estrito

## Logs e comportamento esperado

Quando um loop é detectado, o OpenClaw relata um evento de loop e bloqueia ou suaviza o próximo ciclo de ferramenta dependendo da severidade.
Isso protege usuários contra gasto descontrolado de tokens e travamentos, preservando o acesso normal às ferramentas.

- Prefira primeiro aviso e supressão temporária.
- Escale somente quando evidências repetidas se acumularem.

## Observações

- `tools.loopDetection` é mesclado com substituições em nível de agente.
- A configuração por agente substitui ou estende completamente os valores globais.
- Se não existir configuração, as proteções permanecem desativadas.

## Relacionado

- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- [Níveis de pensamento](/pt-BR/tools/thinking)
- [Subagentes](/pt-BR/tools/subagents)
