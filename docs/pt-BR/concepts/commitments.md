---
read_when:
    - Você quer que o OpenClaw se lembre de continuações naturais
    - Você quer entender como os check-ins inferidos diferem dos lembretes
    - Você quer revisar ou descartar compromissos de acompanhamento
sidebarTitle: Commitments
summary: Memória de acompanhamento inferida para check-ins que não são lembretes exatos
title: Compromissos inferidos
x-i18n:
    generated_at: "2026-07-12T15:08:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Compromissos são memórias de acompanhamento de curta duração. Quando habilitados, o OpenClaw pode
perceber que uma conversa criou uma oportunidade de acompanhamento futuro e se lembrar
de retomá-la mais tarde.

Exemplos:

- Você menciona uma entrevista amanhã. O OpenClaw pode perguntar depois como foi.
- Você diz que está exausto. O OpenClaw pode perguntar mais tarde se você dormiu.
- O agente diz que fará um acompanhamento depois que algo mudar. O OpenClaw pode acompanhar
  essa pendência.

Compromissos não são fatos duráveis como `MEMORY.md` nem são lembretes
exatos. Eles ficam entre a memória e a automação: o OpenClaw se lembra de uma
obrigação vinculada à conversa e, então, o heartbeat a entrega quando chega o momento.

## Habilitar compromissos

Compromissos ficam desativados por padrão (`commitments.enabled: false`). Habilite-os na configuração:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

O `openclaw.json` equivalente:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` limita quantos acompanhamentos inferidos podem ser entregues
por sessão do agente em um período móvel de um dia. O padrão é `3`.

## Como funciona

Após uma resposta do agente, o OpenClaw pode executar uma etapa oculta de extração em segundo plano em um
contexto separado, com as ferramentas desabilitadas. Essa etapa procura apenas compromissos de acompanhamento inferidos. Ela
não escreve na conversa visível nem solicita que o agente principal
raciocine sobre a extração.

Ao encontrar um candidato com alta confiança, o OpenClaw armazena um compromisso com:

- o ID do agente
- a chave da sessão
- o canal original e o destino da entrega
- uma janela de vencimento
- uma breve sugestão de acompanhamento
- metadados sem instruções para o heartbeat decidir se deve enviá-lo

A entrega ocorre por meio do heartbeat. Quando chega o momento de um compromisso, o heartbeat
adiciona o compromisso à execução do heartbeat para o mesmo agente e escopo de canal.
O prompt avisa explicitamente que os metadados do compromisso não são confiáveis e instrui
o modelo a não seguir instruções contidas neles nem usar ferramentas por causa deles. O
modelo pode enviar uma mensagem natural de acompanhamento ou responder `HEARTBEAT_OK` para descartá-lo.
Se o heartbeat estiver configurado com `target: "none"`, os compromissos vencidos permanecem
internos e não enviam acompanhamentos externos. Os prompts de entrega de compromissos não
reproduzem o texto da conversa original, apenas a sugestão de acompanhamento e os
metadados, e as execuções do heartbeat para compromissos vencidos ocorrem sem as ferramentas do OpenClaw.

O OpenClaw nunca entrega um compromisso inferido imediatamente após armazená-lo.
O horário de vencimento é ajustado para, no mínimo, um intervalo de heartbeat após a criação
do compromisso, para que o acompanhamento não seja repetido no mesmo momento em que foi
inferido.

## Escopo

Os compromissos são restritos ao contexto exato do agente e do canal em que foram
criados. Um acompanhamento inferido durante uma conversa com um agente no Discord não é
entregue por outro agente, outro canal nem por uma sessão não relacionada.

Esse escopo faz parte do recurso. Acompanhamentos naturais devem parecer uma continuação
da mesma conversa, não um sistema global de lembretes.

## Compromissos versus lembretes

| Necessidade                                      | Usar                                          |
| ------------------------------------------------ | --------------------------------------------- |
| "Lembre-me às 15h"                               | [Tarefas agendadas](/pt-BR/automation/cron-jobs)    |
| "Avise-me daqui a 20 minutos"                    | [Tarefas agendadas](/pt-BR/automation/cron-jobs)    |
| "Execute este relatório todos os dias úteis"     | [Tarefas agendadas](/pt-BR/automation/cron-jobs)    |
| "Tenho uma entrevista amanhã"                    | Compromissos                                  |
| "Passei a noite toda acordado"                   | Compromissos                                  |
| "Faça um acompanhamento se eu não responder a esta discussão em aberto" | Compromissos                 |

Solicitações explícitas do usuário já pertencem ao fluxo do agendador. Compromissos servem apenas
para acompanhamentos inferidos: os momentos em que o usuário não pediu um lembrete,
mas a conversa criou claramente uma oportunidade útil de acompanhamento futuro.

## Gerenciar compromissos

Use a CLI para inspecionar e limpar os compromissos armazenados:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulte [`openclaw commitments`](/pt-BR/cli/commitments) para ver a referência completa do comando.

## Privacidade e custo

A extração de compromissos usa uma etapa de LLM, portanto habilitá-la adiciona uso do modelo
em segundo plano após interações qualificadas. A etapa fica oculta da conversa
visível para o usuário, mas pode ler a interação recente necessária para decidir se
existe um acompanhamento.

Os compromissos armazenados são um estado local do OpenClaw. Eles são memória operacional, não
memória de longo prazo. Desabilite o recurso com:

```bash
openclaw config set commitments.enabled false
```

## Solução de problemas

Se os acompanhamentos esperados não estiverem aparecendo:

- Confirme se `commitments.enabled` é `true`.
- Verifique em `openclaw commitments --all` se há registros pendentes, descartados, adiados ou expirados.
- Verifique se o heartbeat está em execução para o agente.
- Verifique se `commitments.maxPerDay` já foi atingido para essa
  sessão do agente.
- Lembre-se de que lembretes exatos são ignorados pela extração de compromissos e devem
  aparecer em [tarefas agendadas](/pt-BR/automation/cron-jobs).

## Relacionados

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Active Memory](/pt-BR/concepts/active-memory)
- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [`openclaw commitments`](/pt-BR/cli/commitments)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#commitments)
