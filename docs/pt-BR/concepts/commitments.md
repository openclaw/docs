---
read_when:
    - Você quer que o OpenClaw se lembre de continuações naturais
    - Você quer entender como os check-ins inferidos diferem dos lembretes
    - Você quer revisar ou descartar compromissos de acompanhamento
sidebarTitle: Commitments
summary: Memória de acompanhamento inferida para check-ins que não são lembretes exatos
title: Compromissos inferidos
x-i18n:
    generated_at: "2026-07-11T23:51:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Compromissos são memórias de acompanhamento de curta duração. Quando ativados, o OpenClaw pode
perceber que uma conversa criou uma oportunidade futura de retomar o contato e se lembrar
de trazê-la de volta mais tarde.

Exemplos:

- Você menciona uma entrevista amanhã. O OpenClaw pode perguntar depois como foi.
- Você diz que está exausto. O OpenClaw pode perguntar mais tarde se você dormiu.
- O agente diz que fará um acompanhamento depois que algo mudar. O OpenClaw pode acompanhar
  essa pendência.

Compromissos não são fatos duradouros como `MEMORY.md` nem são lembretes
exatos. Eles ficam entre a memória e a automação: o OpenClaw se lembra de uma
obrigação vinculada à conversa e, então, o Heartbeat a entrega quando chega o momento.

## Ativar compromissos

Os compromissos ficam desativados por padrão (`commitments.enabled: false`). Ative-os na configuração:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

`openclaw.json` equivalente:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` limita quantos acompanhamentos inferidos podem ser entregues
por sessão do agente em um período contínuo de um dia. O padrão é `3`.

## Como funciona

Após uma resposta do agente, o OpenClaw pode executar em segundo plano uma etapa oculta de extração em um
contexto separado, com as ferramentas desativadas. Essa etapa procura apenas compromissos de acompanhamento inferidos. Ela
não escreve na conversa visível nem solicita que o agente principal
raciocine sobre a extração.

Quando encontra um candidato com alto grau de confiança, o OpenClaw armazena um compromisso com:

- o ID do agente
- a chave da sessão
- o canal original e o destino da entrega
- uma janela de vencimento
- uma breve sugestão de retomada do contato
- metadados não instrucionais para o Heartbeat decidir se deve enviá-lo

A entrega ocorre por meio do Heartbeat. Quando chega o momento de um compromisso, o Heartbeat
adiciona o compromisso ao ciclo do Heartbeat para o mesmo escopo de agente e canal.
O prompt avisa explicitamente que os metadados do compromisso não são confiáveis e instrui
o modelo a não seguir instruções contidas neles nem usar ferramentas por causa deles. O
modelo pode enviar uma única mensagem natural de retomada ou responder `HEARTBEAT_OK` para descartá-lo.
Se o Heartbeat estiver configurado com `target: "none"`, os compromissos pendentes permanecem
internos e não enviam mensagens externas de retomada. Os prompts de entrega de compromissos não
reproduzem o texto da conversa original, apenas a sugestão de retomada e os
metadados, e os ciclos do Heartbeat para compromissos pendentes são executados sem as ferramentas do OpenClaw.

O OpenClaw nunca entrega um compromisso inferido imediatamente após armazená-lo.
O horário de vencimento é ajustado para, no mínimo, um intervalo do Heartbeat após a criação do compromisso,
para que o acompanhamento não seja repetido no mesmo instante em que foi
inferido.

## Escopo

Os compromissos são limitados ao contexto exato de agente e canal em que foram
criados. Um acompanhamento inferido durante uma conversa com um agente no Discord não é
entregue por outro agente, outro canal ou uma sessão não relacionada.

Esse escopo faz parte do recurso. Retomadas naturais devem parecer uma continuação
da mesma conversa, não um sistema global de lembretes.

## Compromissos em comparação com lembretes

| Necessidade                                     | Use                                      |
| ----------------------------------------------- | ---------------------------------------- |
| "Lembre-me às 15h"                              | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Avise-me daqui a 20 minutos"                   | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Execute este relatório todos os dias úteis"    | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Tenho uma entrevista amanhã"                   | Compromissos                             |
| "Passei a noite toda acordado"                  | Compromissos                             |
| "Faça um acompanhamento se eu não responder a esta conversa pendente" | Compromissos             |

Solicitações explícitas do usuário já pertencem ao fluxo do agendador. Os compromissos servem apenas
para acompanhamentos inferidos: momentos em que o usuário não pediu um lembrete,
mas a conversa claramente criou uma oportunidade útil de retomar o contato no futuro.

## Gerenciar compromissos

Use a CLI para inspecionar e limpar compromissos armazenados:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulte [`openclaw commitments`](/pt-BR/cli/commitments) para ver a referência completa do comando.

## Privacidade e custo

A extração de compromissos usa uma etapa de LLM; portanto, ativá-la adiciona uso do modelo em segundo plano
após interações elegíveis. Essa etapa fica oculta da
conversa visível ao usuário, mas pode ler a interação recente necessária para decidir se
há um acompanhamento.

Os compromissos armazenados fazem parte do estado local do OpenClaw. Eles são memória operacional, não
memória de longo prazo. Desative o recurso com:

```bash
openclaw config set commitments.enabled false
```

## Solução de problemas

Se os acompanhamentos esperados não estiverem aparecendo:

- Confirme se `commitments.enabled` é `true`.
- Verifique `openclaw commitments --all` em busca de registros pendentes, descartados, adiados ou expirados.
- Certifique-se de que o Heartbeat esteja em execução para o agente.
- Verifique se `commitments.maxPerDay` já foi atingido para essa
  sessão do agente.
- Lembre-se de que lembretes exatos são ignorados pela extração de compromissos e devem
  aparecer em [tarefas agendadas](/pt-BR/automation/cron-jobs).

## Conteúdo relacionado

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Active Memory](/pt-BR/concepts/active-memory)
- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [`openclaw commitments`](/pt-BR/cli/commitments)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#commitments)
