---
read_when:
    - Um usuário relata que agentes ficam travados repetindo chamadas de ferramentas
    - Você precisa ajustar a proteção contra chamadas repetitivas
    - Você está editando políticas de ferramentas/tempo de execução de agentes
summary: Como habilitar e ajustar proteções que detectam loops repetitivos de chamadas de ferramentas
title: Detecção de loops de ferramentas
x-i18n:
    generated_at: "2026-04-30T10:12:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw pode impedir que agentes fiquem presos em padrões repetidos de chamadas de ferramentas.
A proteção fica **desativada por padrão**.

Ative-a somente onde for necessário, porque ela pode bloquear chamadas repetidas legítimas com configurações rígidas.

## Por que isso existe

- Detectar sequências repetitivas que não avançam.
- Detectar loops de alta frequência sem resultados (mesma ferramenta, mesmas entradas, erros repetidos).
- Detectar padrões específicos de chamadas repetidas para ferramentas de sondagem conhecidas.

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

- `enabled`: Chave principal. `false` significa que nenhuma detecção de loop é executada.
- `historySize`: número de chamadas de ferramentas recentes mantidas para análise.
- `warningThreshold`: limite antes de classificar um padrão apenas como aviso.
- `criticalThreshold`: limite para bloquear padrões repetitivos de loop.
- `globalCircuitBreakerThreshold`: limite global do disjuntor sem progresso.
- `detectors.genericRepeat`: detecta padrões repetidos de mesma ferramenta + mesmos parâmetros.
- `detectors.knownPollNoProgress`: detecta padrões conhecidos semelhantes a sondagem sem mudança de estado.
- `detectors.pingPong`: detecta padrões alternados de pingue-pongue.

Para `exec`, as verificações sem progresso comparam resultados estáveis de comandos e ignoram metadados voláteis de runtime, como duração, PID, ID da sessão e diretório de trabalho.
Quando um ID de execução está disponível, o histórico recente de chamadas de ferramentas é avaliado somente dentro dessa execução, para que ciclos agendados de Heartbeat e novas execuções não herdem contagens de loop obsoletas de execuções anteriores.

## Configuração recomendada

- Comece com `enabled: true`, sem alterar os padrões.
- Mantenha os limites ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se ocorrerem falsos positivos:
  - aumente `warningThreshold` e/ou `criticalThreshold`
  - (opcionalmente) aumente `globalCircuitBreakerThreshold`
  - desative somente o detector que está causando problemas
  - reduza `historySize` para um contexto histórico menos rígido

## Logs e comportamento esperado

Quando um loop é detectado, o OpenClaw relata um evento de loop e bloqueia ou atenua o próximo ciclo de ferramentas, dependendo da gravidade.
Isso protege os usuários contra gasto descontrolado de tokens e travamentos, preservando o acesso normal às ferramentas.

- Prefira aviso e supressão temporária primeiro.
- Escalone somente quando evidências repetidas se acumularem.

## Observações

- `tools.loopDetection` é mesclado com substituições no nível do agente.
- A configuração por agente substitui ou estende totalmente os valores globais.
- Se nenhuma configuração existir, as proteções permanecem desativadas.

## Relacionado

- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- [Níveis de raciocínio](/pt-BR/tools/thinking)
- [Subagentes](/pt-BR/tools/subagents)
