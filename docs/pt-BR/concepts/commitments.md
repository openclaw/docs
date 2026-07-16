---
read_when:
    - Você quer que o OpenClaw se lembre de acompanhamentos naturais
    - Você quer entender como os check-ins inferidos diferem dos lembretes
    - Você quer revisar ou descartar compromissos de acompanhamento
sidebarTitle: Commitments
summary: Memória de acompanhamento inferida para check-ins que não são lembretes exatos
title: Compromissos inferidos
x-i18n:
    generated_at: "2026-07-16T12:23:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

Commitments são memórias de acompanhamento de curta duração. Quando ativados, o OpenClaw pode
perceber que uma conversa criou uma oportunidade de acompanhamento futuro e se lembrar
de retomá-la mais tarde.

Exemplos:

- Você menciona uma entrevista amanhã. O OpenClaw pode perguntar depois como foi.
- Você diz que está exausto. O OpenClaw pode perguntar mais tarde se você dormiu.
- O agente diz que fará um acompanhamento depois que algo mudar. O OpenClaw pode acompanhar
  essa questão pendente.

Commitments não são fatos duradouros como `MEMORY.md`, nem são lembretes
exatos. Eles ficam entre a memória e a automação: o OpenClaw se lembra de uma
obrigação vinculada à conversa, e então o Heartbeat a entrega quando chega o momento.

## Ativar Commitments

Commitments ficam desativados por padrão (`commitments.enabled: false`). Ative-os na configuração:

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
por sessão do agente em um período móvel de um dia. O padrão é `3`.

## Como funciona

Após uma resposta do agente, o OpenClaw pode executar uma etapa oculta de extração em segundo plano em um
contexto separado, com as ferramentas desativadas. Essa etapa procura apenas Commitments de acompanhamento inferidos. Ela
não escreve na conversa visível nem pede ao agente principal
que raciocine sobre a extração.

Quando encontra um candidato com alto grau de confiança, o OpenClaw armazena um Commitment com:

- o ID do agente
- a chave da sessão
- o canal original e o destino da entrega
- uma janela de vencimento
- uma breve sugestão de acompanhamento
- metadados não instrucionais para o Heartbeat decidir se deve enviá-lo

A entrega ocorre por meio do Heartbeat. Quando um Commitment chega ao vencimento, o Heartbeat
adiciona o Commitment ao turno do Heartbeat para o mesmo escopo de agente e canal.
O prompt avisa explicitamente que os metadados do Commitment não são confiáveis e instrui
o modelo a não seguir instruções contidas neles nem usar ferramentas por causa deles. O
modelo pode enviar uma única mensagem natural de acompanhamento ou responder `HEARTBEAT_OK` para descartá-lo.
Se o Heartbeat estiver configurado com `target: "none"`, os Commitments vencidos permanecem
internos e não enviam acompanhamentos externos. Os prompts de entrega de Commitments não
reproduzem o texto da conversa original, apenas a sugestão de acompanhamento e os
metadados, e os turnos do Heartbeat com Commitments vencidos são executados sem as ferramentas do OpenClaw.

O OpenClaw nunca entrega um Commitment inferido imediatamente após gravá-lo.
O horário de vencimento é ajustado para pelo menos um intervalo do Heartbeat após a criação
do Commitment, para que o acompanhamento não seja repetido no mesmo momento em que foi
inferido.

## Escopo

Commitments são limitados ao contexto exato de agente e canal no qual foram
criados. Um acompanhamento inferido durante uma conversa com um agente no Discord não é
entregue por outro agente, outro canal ou uma sessão não relacionada.

Esse escopo faz parte do recurso. Acompanhamentos naturais devem parecer a continuação da mesma
conversa, e não um sistema global de lembretes.

## Commitments versus lembretes

| Necessidade                                      | Usar                                     |
| ------------------------------------------------ | ---------------------------------------- |
| "Lembre-me às 15h"                               | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Avise-me daqui a 20 minutos"                    | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Execute este relatório todos os dias úteis"     | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Tenho uma entrevista amanhã"                    | Commitments                              |
| "Passei a noite toda acordado"                   | Commitments                              |
| "Faça um acompanhamento se eu não responder a esta conversa pendente" | Commitments                 |

Solicitações exatas do usuário já pertencem ao fluxo do agendador. Commitments servem apenas
para acompanhamentos inferidos: momentos em que o usuário não pediu um lembrete,
mas a conversa claramente criou uma oportunidade útil de acompanhamento futuro.

## Gerenciar Commitments

Use a CLI para inspecionar e remover Commitments armazenados:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulte [`openclaw commitments`](/pt-BR/cli/commitments) para ver a referência completa dos comandos.

## Privacidade e custo

A extração de Commitments usa uma etapa de LLM, portanto ativá-la adiciona uso do modelo em segundo plano
após turnos elegíveis. A etapa fica oculta da conversa visível
ao usuário, mas pode ler a troca recente necessária para decidir se existe um
acompanhamento.

Os Commitments armazenados são memória operacional local do OpenClaw no banco de dados compartilhado
de estado SQLite, não memória de longo prazo. Desative o recurso com:

```bash
openclaw config set commitments.enabled false
```

## Solução de problemas

Se os acompanhamentos esperados não estiverem aparecendo:

- Confirme se `commitments.enabled` é `true`.
- Verifique `openclaw commitments --all` para encontrar registros pendentes, descartados, adiados ou expirados.
- Certifique-se de que o Heartbeat esteja em execução para o agente.
- Verifique se `commitments.maxPerDay` já foi atingido para essa
  sessão do agente.
- Lembre-se de que lembretes exatos são ignorados pela extração de Commitments e devem
  aparecer em [tarefas agendadas](/pt-BR/automation/cron-jobs).

## Relacionados

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Active Memory](/pt-BR/concepts/active-memory)
- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [`openclaw commitments`](/pt-BR/cli/commitments)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#commitments)
