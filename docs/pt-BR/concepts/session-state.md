---
read_when:
    - Você quer que os agentes percebam quando humanos ou outros agentes alteram uma sessão sem que eles saibam
    - Você está depurando notificações de alteração de estado, cursores de observação ou session_status changesSince
    - Você quer entender como os agentes pais permanecem sincronizados com as sessões filhas
sidebarTitle: Session state awareness
summary: 'Log de sinais de estado durável da sessão: versões de estado, observadores, avisos de estado desatualizado e reconciliação'
title: Percepção do estado da sessão
x-i18n:
    generated_at: "2026-07-16T12:25:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb4126a0802e1ca4418f225c792490493a78886089b81c3b4567f72090ce34f4
    source_path: concepts/session-state.md
    workflow: 16
---

Quando várias sessões trabalham no mesmo problema — um gerenciador delegando tarefas a sessões filhas, uma pessoa entrando diretamente em uma sessão de trabalho, dois agentes coordenando por meio das [`sessions_send`](/pt-BR/concepts/session-tool) — cada sessão cria suposições sobre as demais. Essas suposições ficam desatualizadas assim que outro ator intervém. A percepção do estado da sessão é o mecanismo que detecta a intervenção, avisa uma vez a sessão afetada e oferece uma maneira econômica de se atualizar antes de agir.

Três componentes trabalham em conjunto:

1. Um **log de sinais durável** registra alterações de estado selecionadas por sessão.
2. **Observadores** mantêm cursores por destino e recebem um único aviso consolidado de estado desatualizado.
3. A **reconciliação** obtém o delta exato por meio de `session_status` com `changesSince`.

## O log de sinais

O OpenClaw adiciona um evento tipado ao banco de dados de estado compartilhado (`session_state_events`) quando uma sessão observada sofre uma alteração relevante. Os eventos contêm metadados e um resumo de uma linha — nunca o conteúdo da mensagem.

| Tipo                   | Registrado quando                                         | Notifica observadores |
| ---------------------- | --------------------------------------------------------- | --------------------- |
| `human_direct_message` | Uma pessoa envia um turno diretamente a uma sessão observada | Sim               |
| `upstream_missing`     | A fonte upstream de uma sessão adotada desaparece         | Sim                   |
| `goal_changed`         | O estado da meta da sessão é criado, atualizado ou removido | Sim                 |
| `child_spawned`        | Uma sessão filha de subagente ou ACP é criada             | Não (inicializa o cursor) |
| `run_completed`        | Uma execução filha termina com sucesso                    | Não (somente log)     |
| `run_failed`           | Uma execução filha falha, excede o tempo limite ou é cancelada | Não (somente log) |
| `compacted`            | O histórico da sessão passa por Compaction                | Não (somente log)     |
| `adopted`              | Uma sessão de catálogo é adotada pelo OpenClaw            | Não (somente log)     |

Cada evento identifica seu ator (`human`, `agent` ou `system`). Execuções filhas canceladas ou que excederam o tempo limite são registradas como falhas, com o resultado exato (`cancelled`, `timeout` ou `error`) preservado na carga útil do evento.

A **versão de estado** de uma sessão é simplesmente o maior número de sequência em seu log, rastreado em um cabeçalho durável por sessão que persiste após a remoção de dados antigos. As linhas de `sessions_list` incluem `stateVersion` quando uma sessão registrou alterações; `session_status` sempre o informa.

Os tipos somente de log existem para o histórico de reconciliação, não para notificação: a entrega normal da conclusão de execuções filhas continua sendo responsabilidade dos [anúncios de subagentes](/pt-BR/tools/subagents), e o log de sinais nunca a duplica.

## Observadores

Um observador é uma sessão que mantém um cursor (`session_watch_cursors`) em um destino. Os cursores têm duas origens:

- **Implícita (arestas de criação).** Quando uma sessão cria um subagente ou uma sessão filha ACP, o cursor da sessão pai é inicializado automaticamente na versão de criação da sessão filha. Sessões pai nunca fazem a inscrição manualmente.
- **Explícita (`sessions_send watch: true`).** Qualquer coordenador pode observar um destino que não tenha sido criado por ele: passe `watch: true` em `sessions_send` e, depois que o envio for despachado com sucesso, o remetente será registrado como observador da sessão que realmente recebeu a mensagem. O registro começa na versão de estado atual do destino — o histórico anterior nunca gera avisos. O resultado da ferramenta informa `watched: true|false` quando o parâmetro foi definido.

A identidade do observador deve ser uma chave de sessão qualificada pelo agente. Em `session.scope="global"`, a chave compartilhada `global` é ambígua entre agentes; portanto, essas sessões recebem o log durável e `changesSince`, mas não recebem avisos proativos.

As observações fazem sua própria limpeza: as linhas de cursor expiram conforme a retenção do log de sinais, são removidas quando a sessão observadora é redefinida e são excluídas junto com qualquer uma das sessões. Não há um verbo para deixar de observar na v1.

Sessões observadas adotadas de um catálogo de sessões são verificadas em uma cadência fixa quanto à atividade humana direta no upstream. A atividade detectada entra no mesmo log de sinais e fluxo de observadores que os demais turnos humanos diretos.

Se a fonte upstream de uma sessão adotada for excluída externamente, três verificações ausentes consecutivas (cerca de três ciclos do monitor) produzirão um único sinal `upstream_missing` para seus observadores e removerão o vínculo upstream. Continuar novamente a sessão do catálogo cria um novo vínculo.

## Avisos: um, não vários

Quando ocorre um evento qualificável para notificação e o cursor de um observador está atrasado, o observador recebe um único aviso do sistema em seu próximo turno:

```
A sessão "agent:main:subagent:child" foi alterada (outro ator). Reconcilie antes de agir: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Os observadores da sessão principal também são despertados imediatamente por meio de uma ativação do Heartbeat; observadores que são subagentes aninhados recebem o aviso no próximo turno.

O protocolo foi deliberadamente projetado para evitar spam:

- **Um aviso pendente por par observador/destino.** O texto do aviso permanece idêntico em bytes enquanto está pendente, e a fila de eventos do sistema elimina duplicatas com base nele; portanto, vinte alterações rápidas no mesmo destino ainda produzem apenas uma linha no prompt do observador.
- **Marca-d'água congelada.** O cursor congela sua posição notificada quando um aviso é colocado na fila. Outros eventos relevantes avançam somente a marca-d'água relevante; eles não geram uma nova notificação.
- **Confirmação ao consumir, reabertura somente para trabalho intercalado.** Quando o turno do observador consome o aviso, o cursor avança. Se outros eventos relevantes tiverem ocorrido entre a entrada na fila e o consumo, exatamente um novo aviso será aberto para o restante.
- **Supressão de eventos próprios.** Um observador nunca é notificado sobre eventos causados por ele próprio.
- **Recuperação após reinicialização.** Os avisos pendentes ficam em uma fila na memória; uma varredura de inicialização os recria a partir dos cursores duráveis após a reinicialização do Gateway.

## Reconciliação

O aviso informa ao observador exatamente o que fazer. `session_status` com `changesSince: <version>` retorna os eventos tipados posteriores a essa versão (até 200), sem avançar nenhum cursor:

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
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "meta atualizada" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` significa que a versão solicitada é anterior ao histórico retido — atualize todo o estado da sessão (`sessions_history`, `session_status`) em vez de tratar a resposta como um delta exato. O sinal de lacuna é exato: ele vem de uma marca-d'água de dados removidos por sessão, não é inferido por aritmética de sequência.

## Armazenamento e limites

O histórico fica no banco de dados de estado compartilhado, limitado a 30 dias e 50.000 linhas; os cabeçalhos por sessão permanecem monotônicos após a remoção de dados antigos. O registro é feito em caráter de melhor esforço — uma falha ao adicionar um evento é registrada no log e nunca faz o turno de origem falhar — portanto, `stateVersion` é um cabeçalho do log de sinais, não uma versão transacional de captura de alterações de dados.

Limites atuais:

- A entrega de avisos pressupõe que um único processo do Gateway seja responsável pelo banco de dados de estado compartilhado. Vários Gateways compartilham o log durável e `changesSince`, mas a v1 não envia avisos entre processos.
- Os eventos de Compaction abrangem os responsáveis pela Compaction do runtime incorporado; a Compaction exclusiva do harness nativo não é registrada integralmente.
- Os detalhes da carga útil de resultados cancelados são produzidos atualmente por execuções filhas ACP; cancelamentos de subagentes nativos aparecem como falhas genéricas.
- A detecção do próprio eco upstream compara o texto normalizado do usuário. Um prompt externo que corresponda a uma das 10 mensagens de usuário mais recentes da sessão no lado do OpenClaw é tratado como eco próprio.
- Uma única linha JSONL local do Claude maior que o limite de varredura de 1 MiB por cadência bloqueia o cursor dessa sessão na v1; bytes não classificados nunca são ignorados.
- As verificações do Claude em Node pareado classificam os 50 itens mais recentes da transcrição por cadência. Rajadas maiores podem ficar fora da janela de varredura da v1.
- As leituras do histórico do Claude em Node pareado não expõem um resultado definitivo de thread não encontrada; portanto, exclusões remotas do Claude não são classificadas como `upstream_missing` na v1.
- Sessões de catálogo que não foram adotadas permanecem fora da camada de percepção na v1.
- Sessões adotadas antes deste recurso não possuem vínculo upstream; continue-as uma vez pelo catálogo para iniciar o monitoramento upstream.
- Os vínculos upstream pressupõem que cada chave de sessão adotada corresponda a um único agente responsável (a adoção usa o agente padrão do armazenamento). A adoção por vários agentes da mesma thread externa não é monitorada na v1.

## Relacionados

- [Ferramentas de sessão](/pt-BR/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Subagentes](/pt-BR/tools/subagents) — arestas de criação e anúncios de conclusão
- [Heartbeat](/pt-BR/gateway/heartbeat) — como os avisos na fila despertam as sessões principais
- [Gerenciamento de sessões](/pt-BR/concepts/session) — chaves, escopos e ciclo de vida das sessões
