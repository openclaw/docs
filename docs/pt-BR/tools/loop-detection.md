---
read_when:
    - Um usuário relata que os agentes ficam presos repetindo chamadas de ferramentas
    - Você precisa ajustar a proteção contra chamadas repetitivas
    - Você está editando as políticas de ferramentas/runtime do agente
    - Você encontra interrupções de `compaction_loop_persisted` após uma nova tentativa devido ao estouro de contexto
summary: Como habilitar e ajustar proteções que detectam loops repetitivos de chamadas de ferramentas
title: Detecção de loop de ferramentas
x-i18n:
    generated_at: "2026-07-12T15:45:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

O OpenClaw tem duas proteções cooperativas contra padrões repetitivos de chamadas de ferramentas,
ambas configuradas em `tools.loopDetection`:

1. **Detecção de loops** (`enabled`) - desativada por padrão. Monitora o histórico
   deslizante de chamadas de ferramentas em busca de padrões repetidos e novas tentativas com ferramentas desconhecidas.
2. **Proteção pós-Compaction** (`postCompactionGuard`) - ativada sempre que
   `enabled` não é explicitamente `false`. É armada após cada nova tentativa de Compaction e
   interrompe a execução se o agente repetir a mesma tripla `(tool, args, result)`
   dentro da janela.

Defina `tools.loopDetection.enabled: false` para silenciar ambas as proteções.

## Por que isso existe

- Detectar sequências repetitivas que não fazem progresso.
- Detectar loops de alta frequência sem resultados (mesma ferramenta, mesmas entradas, repetição de
  erros).
- Detectar padrões específicos de chamadas repetidas para ferramentas de sondagem conhecidas.
- Interromper ciclos de estouro de contexto -> Compaction -> mesmo loop, em vez de permitir que
  sejam executados indefinidamente.

## Bloco de configuração

Padrões globais, com todos os campos documentados exibidos:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // chave principal dos detectores de histórico deslizante
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
        windowSize: 3, // armada após nova tentativa de Compaction; executada a menos que enabled seja explicitamente false
      },
    },
  },
}
```

Substituição por agente (opcional, em `agents.list[].tools.loopDetection`):

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

As configurações por agente são sobrepostas ao bloco global campo a campo (incluindo
`detectors` e `postCompactionGuard` aninhados), portanto um agente só precisa definir os
campos que deseja alterar.

### Comportamento dos campos

| Campo                            | Padrão  | Efeito                                                                                                                                      |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | Chave principal dos detectores de histórico deslizante. `false` também desativa a proteção pós-Compaction.                                  |
| `historySize`                    | `30`    | Número de chamadas de ferramentas recentes mantidas para análise.                                                                           |
| `warningThreshold`               | `10`    | Contagem de repetições antes que um padrão seja classificado apenas como aviso.                                                              |
| `criticalThreshold`              | `20`    | Contagem de repetições para bloquear um padrão de loop sem progresso. Em caso de configuração incorreta, o runtime a limita acima de `warningThreshold`. |
| `unknownToolThreshold`           | `10`    | Bloqueia chamadas repetidas à mesma ferramenta indisponível após esse número de falhas. Não é controlado por `detectors`.                    |
| `globalCircuitBreakerThreshold`  | `30`    | Disjuntor global contra falta de progresso em todos os detectores. Em caso de configuração incorreta, o runtime o limita acima de `criticalThreshold`. Não é controlado por `detectors`. |
| `detectors.genericRepeat`        | `true`  | Emite um aviso sobre chamadas repetidas com a mesma ferramenta + os mesmos argumentos; bloqueia quando essas chamadas também retornam resultados idênticos. |
| `detectors.knownPollNoProgress`  | `true`  | Detecta padrões conhecidos de sondagem sem progresso (`process` com `action: "poll"`/`"log"`, `command_status`).                             |
| `detectors.pingPong`             | `true`  | Detecta padrões alternados de pingue-pongue sem progresso entre duas chamadas.                                                              |
| `postCompactionGuard.windowSize` | `3`     | Número de tentativas durante as quais a proteção permanece armada após a Compaction e quantidade de triplas idênticas que interrompe a execução. |

Para `exec`, o hash de ausência de progresso compara resultados estáveis do comando (status,
código de saída, indicador de tempo limite excedido, saída) e ignora metadados voláteis do runtime, como
duração, PID, ID da sessão e diretório de trabalho. Os resultados do envio de mensagens
são processados por hash com a remoção de IDs voláteis de cada chamada (ID da mensagem, ID do arquivo, registro de data e hora),
para que um resultado de "enviado" não pareça idêntico a outro resultado de "enviado".
Quando um ID de execução está disponível, o histórico é avaliado somente dentro dessa execução,
portanto ciclos agendados de Heartbeat e novas execuções não herdam contagens de loops obsoletas
de execuções anteriores.

## Configuração recomendada

- Para modelos menores, defina `enabled: true` e mantenha os limites nos valores
  padrão. Modelos de ponta raramente precisam da detecção por histórico deslizante e podem
  manter a chave principal como `false`, enquanto ainda se beneficiam da
  proteção pós-Compaction.
- Mantenha os limites na ordem `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`; o runtime ajusta `criticalThreshold` e
  `globalCircuitBreakerThreshold` para cima se você os definir como iguais ou inferiores ao
  limite que precisam exceder.
- Se ocorrerem falsos positivos:
  - Aumente `warningThreshold` e/ou `criticalThreshold`.
  - Opcionalmente, aumente `globalCircuitBreakerThreshold`.
  - Desative somente o detector específico que está causando problemas (`detectors.<name>: false`).
  - Reduza `historySize` para obter uma janela de histórico mais curta.
- Para desativar tudo, incluindo a proteção pós-Compaction, defina
  `tools.loopDetection.enabled: false` explicitamente.

## Proteção pós-Compaction

Após uma nova tentativa de Compaction decorrente de um estouro de contexto, o executor arma uma
proteção de janela curta para as próximas chamadas de ferramentas. Se o agente emitir a mesma
tripla `(toolName, argsHash, resultHash)` `postCompactionGuard.windowSize`
vezes dentro dessa janela, a proteção conclui que a Compaction não interrompeu o
loop e encerra a execução com um erro `compaction_loop_persisted`.

A proteção é controlada pelo sinalizador principal `tools.loopDetection.enabled`, com uma
particularidade: ela permanece **ativada quando o sinalizador não está definido ou é `true`** e só é
desativada quando o sinalizador é explicitamente `false`. Isso é intencional — a proteção
existe para escapar de loops de Compaction que, de outra forma, consumiriam tokens sem limites,
portanto até mesmo um usuário sem configuração recebe essa proteção.

```json5
{
  tools: {
    loopDetection: {
      // chave principal; defina como false para desativar a proteção junto com os detectores deslizantes
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // padrão
      },
    },
  },
}
```

- Um `windowSize` menor é mais rigoroso (menos tentativas antes da interrupção).
- Um `windowSize` maior oferece ao agente mais tentativas de recuperação.
- A proteção nunca interrompe enquanto os resultados estiverem mudando; somente resultados
  idênticos byte a byte em toda a janela a acionam.
- Ela só é armada imediatamente após uma nova tentativa de Compaction, e não em outros
  pontos de uma execução.

<Note>
  A proteção pós-Compaction é executada sempre que o sinalizador principal não é explicitamente `false`, mesmo que você nunca tenha criado um bloco `tools.loopDetection`. Para verificar, procure por `post-compaction guard armed for N attempts` no log do Gateway imediatamente após um evento de Compaction.
</Note>

## Logs e comportamento esperado

Quando um loop é detectado, o OpenClaw registra um evento de loop e emite um aviso ou bloqueia
o próximo ciclo de ferramentas, dependendo da gravidade, protegendo contra consumo descontrolado de
tokens e travamentos, enquanto preserva o acesso normal às ferramentas.

- Os avisos vêm primeiro.
- O bloqueio ocorre quando um padrão persiste além do limite de aviso.
- Os limites críticos bloqueiam o próximo ciclo de ferramentas e apresentam um motivo claro
  de detecção de loop no registro da execução.
- A proteção pós-Compaction emite erros `compaction_loop_persisted` que identificam
  a ferramenta responsável e a contagem de chamadas idênticas.

## Relacionados

<CardGroup cols={2}>
  <Card title="Aprovações de Exec" href="/pt-BR/tools/exec-approvals" icon="shield">
    Política de permissão/negação para execução no shell.
  </Card>
  <Card title="Níveis de raciocínio" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio e interação com a política do provedor.
  </Card>
  <Card title="Subagentes" href="/pt-BR/tools/subagents" icon="users">
    Criação de agentes isolados para limitar comportamentos descontrolados.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-tools#toolsloopdetection" icon="gear">
    Esquema completo de `tools.loopDetection` e semântica de mesclagem.
  </Card>
</CardGroup>
