---
read_when:
    - Você quer que os agentes percebam quando humanos ou outros agentes alteram uma sessão sem que eles saibam
    - Você está depurando avisos de alteração de estado, cursores de monitoramento ou mudanças em session_status desde
    - Você quer entender como os agentes-pai permanecem sincronizados com as sessões-filhas
sidebarTitle: Session state awareness
summary: 'Log de sinais de estado durável da sessão: versões de estado, observadores, avisos de estado desatualizado e reconciliação'
title: Reconhecimento do estado da sessão
x-i18n:
    generated_at: "2026-07-12T21:30:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 06ec310fc482ce658eb37628ac33c4224349846d1ffd6e8edeac01bc84e56341
    source_path: concepts/session-state.md
    workflow: 16
---

Quando várias sessões trabalham no mesmo problema — um gerente delegando a sessões filhas, uma pessoa entrando diretamente em uma sessão de trabalho, dois agentes coordenando-se por meio de [`sessions_send`](/pt-BR/concepts/session-tool) — cada sessão cria suposições sobre as outras. Essas suposições ficam desatualizadas assim que outro ator intervém. A percepção do estado da sessão é o mecanismo que detecta a intervenção, avisa uma vez a sessão afetada e oferece a ela uma maneira econômica de se atualizar antes de agir.

Três componentes trabalham em conjunto:

1. Um **log durável de sinais** registra alterações de estado selecionadas por sessão.
2. **Observadores** mantêm cursores por destino e recebem um único aviso consolidado de estado desatualizado.
3. A **reconciliação** obtém o delta exato por meio de `session_status` com `changesSince`.

## O log de sinais

O OpenClaw acrescenta um evento tipado ao banco de dados de estado compartilhado (`session_state_events`) quando uma sessão observada muda de forma significativa. Os eventos contêm metadados e um resumo de uma linha — nunca o conteúdo da mensagem.

| Tipo                   | Registrado quando                                                  | Notifica observadores |
| ---------------------- | ------------------------------------------------------------------ | --------------------- |
| `human_direct_message` | Uma pessoa envia um turno diretamente a uma sessão observada       | Sim                   |
| `goal_changed`         | O estado do objetivo da sessão é criado, atualizado ou removido    | Sim                   |
| `child_spawned`        | Uma sessão filha de subagente ou ACP é criada                      | Não (inicializa o cursor) |
| `run_completed`        | Uma execução filha termina com sucesso                             | Não (somente log)     |
| `run_failed`           | Uma execução filha falha, atinge o tempo limite ou é cancelada     | Não (somente log)     |
| `compacted`            | O histórico da sessão passa por Compaction                         | Não (somente log)     |

Cada evento identifica seu ator (`human`, `agent` ou `system`). Execuções filhas canceladas e que atingiram o tempo limite são registradas como falhas, com o resultado preciso (`cancelled`, `timeout` ou `error`) preservado no payload do evento.

A **versão de estado** de uma sessão é simplesmente o maior número de sequência em seu log, rastreado em um cabeçalho durável por sessão que sobrevive à limpeza. As linhas de `sessions_list` incluem `stateVersion` quando uma sessão registrou alterações; `session_status` sempre o informa.

Os tipos somente de log existem para o histórico de reconciliação, não para notificações: a entrega normal da conclusão de execuções filhas continua sob responsabilidade dos [anúncios de subagentes](/pt-BR/tools/subagents), e o log de sinais nunca a duplica.

## Observadores

Um observador é uma sessão que mantém um cursor (`session_watch_cursors`) sobre um destino. Os cursores vêm de duas origens:

- **Implícitos (arestas de criação).** Quando uma sessão cria um subagente ou uma sessão filha ACP, o cursor da sessão pai é inicializado automaticamente na versão de criação da sessão filha. As sessões pai nunca fazem a inscrição manualmente.
- **Explícitos (`sessions_send watch: true`).** Qualquer coordenador pode observar um destino que não tenha criado: passe `watch: true` em `sessions_send` e, após o envio ser despachado com sucesso, o remetente será registrado como observador da sessão que realmente recebeu a mensagem. O registro começa na versão de estado atual do destino — o histórico anterior nunca gera avisos. O resultado da ferramenta informa `watched: true|false` quando o parâmetro foi definido.

A identidade do observador deve ser uma chave de sessão qualificada por agente. Sob `session.scope="global"`, a chave compartilhada `global` é ambígua entre agentes; portanto, essas sessões recebem o log durável e `changesSince`, mas não avisos proativos.

As observações são limpas automaticamente: as linhas de cursor expiram conforme a retenção do log de sinais, são removidas quando a sessão observadora é redefinida e são excluídas com qualquer uma das sessões. Não há um verbo para deixar de observar na v1.

## Avisos: um, não vários

Quando ocorre um evento qualificável para notificação e o cursor de um observador está atrasado, o observador recebe um aviso do sistema em seu próximo turno:

```
A sessão "agent:main:subagent:child" mudou (outro ator). Reconcilie antes de agir: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Os observadores de sessões principais também são despertados imediatamente por meio de um acionamento de Heartbeat; observadores de subagentes aninhados recebem o aviso no próximo turno.

O protocolo foi deliberadamente projetado para evitar spam:

- **Um aviso pendente por par observador/destino.** O texto do aviso permanece idêntico em bytes enquanto está pendente, e a fila de eventos do sistema elimina duplicatas com base nele; portanto, vinte alterações rápidas no mesmo destino ainda produzem uma única linha no prompt do observador.
- **Marca-d'água congelada.** O cursor congela sua posição notificada quando um aviso entra na fila. Outros eventos significativos avançam apenas a marca-d'água significativa; eles não geram uma nova notificação.
- **Confirmação ao consumir, reabertura somente para trabalho intercalado.** Quando o turno do observador consome o aviso, o cursor avança. Se outros eventos significativos tiverem ocorrido entre a entrada na fila e o consumo, será aberto exatamente um novo aviso para o restante.
- **Supressão de eventos próprios.** Um observador nunca recebe notificações sobre eventos que ele próprio causou.
- **Recuperação após reinicialização.** Os avisos pendentes ficam em uma fila na memória; uma varredura na inicialização os rematerializa a partir dos cursores duráveis após a reinicialização do Gateway.

## Reconciliação

O aviso informa ao observador exatamente o que fazer. `session_status` com `changesSince: <version>` retorna os eventos tipados posteriores à versão especificada (até 200), sem avançar nenhum cursor:

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "mensagem humana via telegram"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "objetivo atualizado" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` significa que a versão solicitada é anterior ao histórico retido — atualize todo o estado da sessão (`sessions_history`, `session_status`) em vez de tratar a resposta como um delta exato. O sinal de lacuna é exato: ele vem de uma marca-d'água de limpeza por sessão, não é inferido por aritmética de sequências.

## Armazenamento e limites

O histórico fica no banco de dados de estado compartilhado, limitado a 30 dias e 50.000 linhas; os cabeçalhos por sessão permanecem monotônicos após a limpeza. O registro funciona na modalidade de melhor esforço — uma falha ao acrescentar é registrada e nunca causa falha no turno de origem — portanto, `stateVersion` é o cabeçalho do log de sinais, não uma versão transacional de captura de alterações de dados.

Limites atuais:

- A entrega de avisos pressupõe que um processo do Gateway seja proprietário do banco de dados de estado compartilhado. Vários gateways compartilham o log durável e `changesSince`, mas a v1 não envia avisos entre processos.
- Os eventos de Compaction abrangem os responsáveis pela Compaction do runtime incorporado; a Compaction exclusiva do harness nativo não é registrada por completo.
- Os detalhes do payload de resultados cancelados são produzidos atualmente por execuções filhas ACP; cancelamentos de subagentes nativos aparecem como falhas genéricas.

## Relacionados

- [Ferramentas de sessão](/pt-BR/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Subagentes](/pt-BR/tools/subagents) — arestas de criação e anúncios de conclusão
- [Heartbeat](/pt-BR/gateway/heartbeat) — como avisos enfileirados despertam sessões principais
- [Gerenciamento de sessões](/pt-BR/concepts/session) — chaves de sessão, escopos, ciclo de vida
