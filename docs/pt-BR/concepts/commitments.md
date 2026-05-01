---
read_when:
    - Você quer que o OpenClaw se lembre de acompanhamentos naturais
    - Você quer entender como as verificações inferidas diferem dos lembretes
    - Você quer revisar ou descartar compromissos de acompanhamento
sidebarTitle: Commitments
summary: Memória de acompanhamento inferida para verificações que não são lembretes exatos
title: Compromissos inferidos
x-i18n:
    generated_at: "2026-05-01T05:56:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

Compromissos são memórias de acompanhamento de curta duração. Quando ativados, o OpenClaw pode
perceber que uma conversa criou uma oportunidade futura de check-in e lembrar
de trazê-la de volta mais tarde.

Exemplos:

- Você menciona uma entrevista amanhã. O OpenClaw pode fazer check-in depois.
- Você diz que está exausto. O OpenClaw pode perguntar depois se você dormiu.
- O agente diz que fará acompanhamento depois que algo mudar. O OpenClaw pode acompanhar
  esse loop aberto.

Compromissos não são fatos duráveis como `MEMORY.md`, e não são lembretes
exatos. Eles ficam entre memória e automação: o OpenClaw lembra uma obrigação
vinculada à conversa, então o Heartbeat a entrega quando ela vence.

## Ativar compromissos

Compromissos ficam desativados por padrão. Ative-os na configuração:

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
por sessão de agente em um dia móvel. O padrão é `3`.

## Como funciona

Depois de uma resposta do agente, o OpenClaw pode executar uma passagem oculta de extração em segundo plano em um
contexto separado. Essa passagem procura apenas compromissos de acompanhamento inferidos. Ela
não escreve na conversa visível e não pede ao agente principal
para raciocinar sobre a extração.

Quando encontra um candidato de alta confiança, o OpenClaw armazena um compromisso com:

- o id do agente
- a chave da sessão
- o canal original e o alvo de entrega
- uma janela de vencimento
- um check-in curto sugerido
- metadados não instrucionais para o Heartbeat decidir se deve enviá-lo

A entrega acontece pelo Heartbeat. Quando um compromisso vence, o Heartbeat
adiciona o compromisso à rodada de Heartbeat para o mesmo agente e escopo de canal.
O modelo pode enviar um check-in natural ou responder `HEARTBEAT_OK` para dispensá-lo.
Se o Heartbeat estiver configurado com `target: "none"`, os compromissos vencidos permanecem
internos e não enviam check-ins externos. Prompts de entrega de compromisso não
reproduzem o texto da conversa original, e rodadas de Heartbeat de compromisso vencido são executadas
sem ferramentas do OpenClaw.

O OpenClaw nunca entrega um compromisso inferido imediatamente depois de gravá-lo.
O horário de vencimento é limitado a pelo menos um intervalo de Heartbeat depois que o compromisso
é criado, para que o acompanhamento não ecoe de volta no mesmo momento em que foi
inferido.

## Escopo

Compromissos têm escopo limitado ao agente exato e ao contexto de canal em que foram
criados. Um acompanhamento inferido durante uma conversa com um agente no Discord não é
entregue por outro agente, outro canal ou uma sessão não relacionada.

Esse escopo faz parte do recurso. Check-ins naturais devem parecer a continuação da mesma
conversa, não um sistema global de lembretes.

## Compromissos vs lembretes

| Necessidade                                     | Usar                                     |
| ----------------------------------------------- | ---------------------------------------- |
| "Lembre-me às 15h"                              | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Me avise em 20 minutos"                        | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Execute este relatório todos os dias úteis"    | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Tenho uma entrevista amanhã"                   | Compromissos                             |
| "Passei a noite inteira acordado"               | Compromissos                             |
| "Faça acompanhamento se eu não responder esta thread aberta" | Compromissos                  |

Solicitações exatas do usuário já pertencem ao caminho do agendador. Compromissos são apenas
para acompanhamentos inferidos: os momentos em que o usuário não pediu um lembrete,
mas a conversa claramente criou um check-in futuro útil.

## Gerenciar compromissos

Use a CLI para inspecionar e limpar compromissos armazenados:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulte [`openclaw commitments`](/pt-BR/cli/commitments) para a referência do comando.

## Privacidade e custo

A extração de compromissos usa uma passagem de LLM, então ativá-la adiciona uso de modelo em segundo plano
após rodadas elegíveis. A passagem fica oculta da conversa visível ao usuário,
mas pode ler a troca recente necessária para decidir se existe um
acompanhamento.

Compromissos armazenados são estado local do OpenClaw. Eles são memória operacional, não
memória de longo prazo. Desative o recurso com:

```bash
openclaw config set commitments.enabled false
```

## Solução de problemas

Se acompanhamentos esperados não estiverem aparecendo:

- Confirme que `commitments.enabled` é `true`.
- Verifique `openclaw commitments --all` em busca de registros pendentes, dispensados, adiados ou expirados.
- Certifique-se de que o Heartbeat esteja em execução para o agente.
- Verifique se `commitments.maxPerDay` já foi atingido para essa
  sessão de agente.
- Lembre-se de que lembretes exatos são ignorados pela extração de compromissos e devem
  aparecer em [tarefas agendadas](/pt-BR/automation/cron-jobs).

## Relacionados

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Active memory](/pt-BR/concepts/active-memory)
- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [`openclaw commitments`](/pt-BR/cli/commitments)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#commitments)
