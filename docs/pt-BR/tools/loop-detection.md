---
read_when:
    - Um usuário relata que agentes ficam travados repetindo chamadas de ferramentas
    - Você precisa ajustar a proteção contra chamadas repetitivas
    - Você está editando políticas de ferramentas/runtime de agentes
    - Você se depara com abortos `compaction_loop_persisted` após uma nova tentativa por estouro de contexto
summary: Como habilitar e ajustar mecanismos de proteção que detectam loops repetitivos de chamadas de ferramenta
title: Detecção de loop de ferramentas
x-i18n:
    generated_at: "2026-05-11T20:37:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc261bebc0e3138a98ea8be166edbaf4e133c8f582429c5380fe2954196a6fc5
    source_path: tools/loop-detection.md
    workflow: 16
---

O OpenClaw tem duas proteções cooperativas para padrões repetitivos de chamadas de ferramenta:

1. **Detecção de loop** (`tools.loopDetection.enabled`) — desativada por padrão. Observa o histórico móvel de chamadas de ferramenta em busca de padrões repetidos e novas tentativas com ferramentas desconhecidas.
2. **Proteção pós-compaction** (`tools.loopDetection.postCompactionGuard`) — ativada por padrão, a menos que `tools.loopDetection.enabled` esteja explicitamente como `false`. É armada após cada nova tentativa de compaction e aborta a execução quando o agente emite a mesma tripla `(tool, args, result)` dentro da janela.

Ambas são configuradas no mesmo bloco `tools.loopDetection`, mas a proteção pós-compaction é executada sempre que a chave mestra não está explicitamente desligada. Defina `tools.loopDetection.enabled: false` para silenciar ambas as superfícies.

## Por que isso existe

- Detectar sequências repetitivas que não avançam.
- Detectar loops de alta frequência sem resultado (mesma ferramenta, mesmas entradas, erros repetidos).
- Detectar padrões específicos de chamadas repetidas para ferramentas de polling conhecidas.
- Impedir que ciclos de estouro de contexto, depois compaction, depois o mesmo loop, sejam executados indefinidamente.

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
| `enabled`                        | `false` | Chave mestra para os detectores de histórico móvel. Definir `false` também desativa a proteção pós-compaction.                  |
| `historySize`                    | `30`    | Número de chamadas recentes de ferramenta mantidas para análise.                                                                |
| `warningThreshold`               | `10`    | Limite antes de um padrão ser classificado apenas como aviso.                                                                   |
| `criticalThreshold`              | `20`    | Limite para bloquear padrões repetitivos de loop sem avanço.                                                                    |
| `unknownToolThreshold`           | `10`    | Bloqueia chamadas repetidas para a mesma ferramenta indisponível após esse número de falhas.                                    |
| `globalCircuitBreakerThreshold`  | `30`    | Limite global do disjuntor sem avanço entre todos os detectores.                                                                |
| `detectors.genericRepeat`        | `true`  | Avisa sobre padrões repetidos de mesma ferramenta + mesmos parâmetros e bloqueia quando as mesmas chamadas também retornam resultados idênticos. |
| `detectors.knownPollNoProgress`  | `true`  | Detecta padrões conhecidos semelhantes a polling sem mudança de estado.                                                         |
| `detectors.pingPong`             | `true`  | Detecta padrões alternados de ping-pong.                                                                                        |
| `postCompactionGuard.windowSize` | `3`     | Número de chamadas de ferramenta pós-compaction durante as quais a proteção permanece armada e contagem de triplas idênticas que aborta a execução. |

Para `exec`, as verificações sem avanço comparam resultados estáveis do comando e ignoram metadados voláteis de runtime, como duração, PID, ID de sessão e diretório de trabalho. Quando um ID de execução está disponível, o histórico recente de chamadas de ferramenta é avaliado apenas dentro dessa execução, para que ciclos agendados de Heartbeat e novas execuções não herdem contagens de loop obsoletas de execuções anteriores.

## Configuração recomendada

- Para modelos menores, defina `enabled: true` e mantenha os limites nos padrões. Modelos de ponta raramente precisam de detecção por histórico móvel e podem manter a chave mestra em `false`, ainda se beneficiando da proteção pós-compaction.
- Mantenha os limites ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se ocorrerem falsos positivos:
  - Aumente `warningThreshold` e/ou `criticalThreshold`.
  - Opcionalmente, aumente `globalCircuitBreakerThreshold`.
  - Desative apenas o detector específico que está causando problemas (`detectors.<name>: false`).
  - Reduza `historySize` para um contexto histórico menos rígido.
- Para desativar tudo (incluindo a proteção pós-compaction), defina `tools.loopDetection.enabled: false` explicitamente.

## Proteção pós-compaction

Quando o executor conclui uma nova tentativa de compaction após um estouro de contexto, ele arma uma proteção de janela curta que observa as próximas chamadas de ferramenta. Se o agente emitir a mesma tripla `(toolName, argsHash, resultHash)` várias vezes dentro da janela, a proteção conclui que a compaction não interrompeu o loop e aborta a execução com um erro `compaction_loop_persisted`.

A proteção é controlada pela flag mestra `tools.loopDetection.enabled` com uma particularidade: ela permanece **ativada quando a flag não está definida ou é `true`** e só é desativada quando a flag é explicitamente `false`. Isso é intencional. A proteção existe para escapar de loops de compaction que, de outra forma, consumiriam tokens sem limite, então um usuário sem configuração ainda recebe a proteção.

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

- Um `windowSize` menor é mais rigoroso (menos tentativas antes do aborto).
- Um `windowSize` maior dá ao agente mais tentativas de recuperação.
- A proteção nunca aborta quando os resultados estão mudando, apenas quando os resultados são byte a byte idênticos ao longo da janela.
- Ela é intencionalmente estreita: dispara apenas imediatamente após uma nova tentativa de compaction.

<Note>
  A proteção pós-compaction é executada sempre que a flag mestra não está explicitamente como `false`, mesmo que você nunca tenha escrito um bloco `tools.loopDetection`. Para verificar, procure `post-compaction guard armed for N attempts` no log do Gateway imediatamente após um evento de compaction.
</Note>

## Logs e comportamento esperado

Quando um loop é detectado, o OpenClaw relata um evento de loop e reduz ou bloqueia o próximo ciclo de ferramentas, dependendo da severidade. Isso protege os usuários contra gasto descontrolado de tokens e travamentos, preservando o acesso normal às ferramentas.

- Os avisos vêm primeiro.
- A supressão ocorre quando os padrões persistem além do limite de aviso.
- Limites críticos bloqueiam o próximo ciclo de ferramentas e mostram um motivo claro de detecção de loop no registro da execução.
- A proteção pós-compaction emite erros `compaction_loop_persisted` com o nome da ferramenta ofensora e a contagem de chamadas idênticas.

## Relacionados

<CardGroup cols={2}>
  <Card title="Aprovações de exec" href="/pt-BR/tools/exec-approvals" icon="shield">
    Política de permitir/negar para execução no shell.
  </Card>
  <Card title="Níveis de pensamento" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio e interação com a política do provedor.
  </Card>
  <Card title="Subagentes" href="/pt-BR/tools/subagents" icon="users">
    Geração de agentes isolados para limitar comportamento descontrolado.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de `tools.loopDetection` e semântica de mesclagem.
  </Card>
</CardGroup>
