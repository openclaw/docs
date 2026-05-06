---
read_when:
    - Um usuário relata agentes travados repetindo chamadas de ferramenta
    - Você precisa ajustar a proteção contra chamadas repetitivas
    - Você está editando políticas de ferramentas/tempo de execução de agentes
    - Você encontra abortos de `compaction_loop_persisted` após uma nova tentativa por estouro de contexto
summary: Como habilitar e ajustar proteções que detectam ciclos repetitivos de chamadas de ferramenta
title: Detecção de loop de ferramentas
x-i18n:
    generated_at: "2026-05-06T09:17:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw tem duas proteções cooperantes para padrões repetitivos de chamadas de ferramenta:

1. **Detecção de loop** (`tools.loopDetection.enabled`) — desativada por padrão. Observa o histórico móvel de chamadas de ferramenta em busca de padrões repetidos e novas tentativas com ferramentas desconhecidas.
2. **Guarda pós-Compaction** (`tools.loopDetection.postCompactionGuard`) — ativado por padrão, a menos que `tools.loopDetection.enabled` seja explicitamente `false`. É armado após cada nova tentativa de Compaction e aborta a execução quando o agente emite a mesma tripla `(tool, args, result)` dentro da janela.

Ambos são configurados no mesmo bloco `tools.loopDetection`, mas o guarda pós-Compaction é executado sempre que a chave mestra não está explicitamente desligada. Defina `tools.loopDetection.enabled: false` para silenciar ambas as superfícies.

## Por que isso existe

- Detectar sequências repetitivas que não avançam.
- Detectar loops de alta frequência sem resultado (mesma ferramenta, mesmas entradas, erros repetidos).
- Detectar padrões específicos de chamadas repetidas para ferramentas de sondagem conhecidas.
- Impedir que ciclos de estouro de contexto, depois Compaction, depois o mesmo loop, sejam executados indefinidamente.

## Bloco de configuração

Padrões globais, com todos os campos documentados exibidos:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
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

| Campo                            | Padrão  | Efeito                                                                                                                          |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | Chave mestra para os detectores de histórico móvel. Definir como `false` também desativa o guarda pós-Compaction.               |
| `historySize`                    | `30`    | Número de chamadas de ferramenta recentes mantidas para análise.                                                                |
| `warningThreshold`               | `10`    | Limite antes de um padrão ser classificado apenas como aviso.                                                                   |
| `criticalThreshold`              | `20`    | Limite para bloquear padrões de loop repetitivo.                                                                                |
| `unknownToolThreshold`           | `10`    | Bloqueia chamadas repetidas para a mesma ferramenta indisponível após essa quantidade de falhas.                                |
| `globalCircuitBreakerThreshold`  | `30`    | Limite global do disjuntor de ausência de progresso em todos os detectores.                                                     |
| `detectors.genericRepeat`        | `true`  | Detecta padrões repetidos de mesma ferramenta + mesmos parâmetros.                                                              |
| `detectors.knownPollNoProgress`  | `true`  | Detecta padrões conhecidos semelhantes a sondagem sem mudança de estado.                                                        |
| `detectors.pingPong`             | `true`  | Detecta padrões alternados de pingue-pongue.                                                                                    |
| `postCompactionGuard.windowSize` | `3`     | Número de chamadas de ferramenta pós-Compaction durante as quais o guarda permanece armado e a contagem de triplas idênticas que aborta a execução. |

Para `exec`, verificações de ausência de progresso comparam resultados estáveis de comandos e ignoram metadados voláteis de runtime, como duração, PID, ID de sessão e diretório de trabalho. Quando um ID de execução está disponível, o histórico recente de chamadas de ferramenta é avaliado somente dentro dessa execução, para que ciclos agendados de Heartbeat e execuções novas não herdem contagens de loop antigas de execuções anteriores.

## Configuração recomendada

- Para modelos menores, defina `enabled: true` e mantenha os limites nos padrões. Modelos de ponta raramente precisam de detecção por histórico móvel e podem manter a chave mestra em `false` enquanto ainda se beneficiam do guarda pós-Compaction.
- Mantenha os limites ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se ocorrerem falsos positivos:
  - Aumente `warningThreshold` e/ou `criticalThreshold`.
  - Opcionalmente, aumente `globalCircuitBreakerThreshold`.
  - Desative apenas o detector específico que causa problemas (`detectors.<name>: false`).
  - Reduza `historySize` para um contexto histórico menos rigoroso.
- Para desativar tudo (incluindo o guarda pós-Compaction), defina `tools.loopDetection.enabled: false` explicitamente.

## Guarda pós-Compaction

Quando o executor conclui uma nova tentativa de Compaction após um estouro de contexto, ele arma um guarda de janela curta que observa as próximas chamadas de ferramenta. Se o agente emitir a mesma tripla `(toolName, argsHash, resultHash)` várias vezes dentro da janela, o guarda conclui que a Compaction não interrompeu o loop e aborta a execução com um erro `compaction_loop_persisted`.

O guarda é controlado pelo sinalizador mestre `tools.loopDetection.enabled` com um detalhe: ele permanece **ativado quando o sinalizador não está definido ou é `true`** e só é desativado quando o sinalizador é explicitamente `false`. Isso é intencional. O guarda existe para escapar de loops de Compaction que, de outra forma, consumiriam tokens sem limite, então um usuário sem configuração ainda recebe a proteção.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- Um `windowSize` menor é mais rigoroso (menos tentativas antes de abortar).
- Um `windowSize` maior dá ao agente mais tentativas de recuperação.
- O guarda nunca aborta quando os resultados estão mudando, apenas quando os resultados são byte a byte idênticos em toda a janela.
- Ele é intencionalmente restrito: dispara apenas logo após uma nova tentativa de Compaction.

<Note>
  O guarda pós-Compaction é executado sempre que o sinalizador mestre não é explicitamente `false`, mesmo que você nunca tenha escrito um bloco `tools.loopDetection`. Para verificar, procure `post-compaction guard armed for N attempts` no log do Gateway imediatamente após um evento de Compaction.
</Note>

## Logs e comportamento esperado

Quando um loop é detectado, OpenClaw relata um evento de loop e atenua ou bloqueia o próximo ciclo de ferramentas, dependendo da severidade. Isso protege usuários contra gasto descontrolado de tokens e travamentos, preservando o acesso normal às ferramentas.

- Os avisos vêm primeiro.
- A supressão ocorre quando os padrões persistem além do limite de aviso.
- Limites críticos bloqueiam o próximo ciclo de ferramentas e expõem um motivo claro de detecção de loop no registro da execução.
- O guarda pós-Compaction emite erros `compaction_loop_persisted` com o nome da ferramenta ofensora e a contagem de chamadas idênticas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Aprovações de exec" href="/pt-BR/tools/exec-approvals" icon="shield">
    Política de permitir/negar para execução no shell.
  </Card>
  <Card title="Níveis de raciocínio" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio e interação com políticas de provedor.
  </Card>
  <Card title="Subagentes" href="/pt-BR/tools/subagents" icon="users">
    Geração de agentes isolados para limitar comportamento descontrolado.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de `tools.loopDetection` e semântica de mesclagem.
  </Card>
</CardGroup>
