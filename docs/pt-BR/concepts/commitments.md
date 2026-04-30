---
read_when:
    - Você quer que o OpenClaw se lembre de continuações naturais
    - Você quer entender como os registros inferidos diferem dos lembretes
    - Você quer revisar ou descartar compromissos de acompanhamento
sidebarTitle: Commitments
summary: Memória de acompanhamento inferida para verificações que não são lembretes exatos
title: Compromissos inferidos
x-i18n:
    generated_at: "2026-04-30T09:43:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

Compromissos são memórias de acompanhamento de curta duração. Quando ativados, o OpenClaw pode
perceber que uma conversa criou uma oportunidade futura de verificação e lembrar
de retomá-la depois.

Exemplos:

- Você menciona uma entrevista amanhã. O OpenClaw pode verificar depois.
- Você diz que está exausto. O OpenClaw pode perguntar depois se você dormiu.
- O agente diz que fará um acompanhamento depois que algo mudar. O OpenClaw pode rastrear
  esse ciclo aberto.

Compromissos não são fatos duráveis como `MEMORY.md`, e não são lembretes
exatos. Eles ficam entre memória e automação: o OpenClaw lembra uma
obrigação vinculada à conversa, então o Heartbeat a entrega quando ela vence.

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
por sessão de agente em um dia contínuo. O padrão é `3`.

## Como funciona

Depois de uma resposta do agente, o OpenClaw pode executar uma passagem oculta de extração em segundo plano em um
contexto separado. Essa passagem procura apenas compromissos de acompanhamento inferidos. Ela
não escreve na conversa visível e não pede ao agente principal
para raciocinar sobre a extração.

Quando encontra um candidato de alta confiança, o OpenClaw armazena um compromisso com:

- o ID do agente
- a chave da sessão
- o canal original e o destino de entrega
- uma janela de vencimento
- uma sugestão curta de verificação
- contexto de origem suficiente para o Heartbeat decidir se deve enviá-lo

A entrega acontece por meio do Heartbeat. Quando um compromisso vence, o Heartbeat
adiciona o compromisso ao turno de Heartbeat para o mesmo agente e escopo de canal.
O modelo pode enviar uma verificação natural ou responder `HEARTBEAT_OK` para descartá-lo.

O OpenClaw nunca entrega um compromisso inferido imediatamente depois de escrevê-lo.
O horário de vencimento é limitado a pelo menos um intervalo de Heartbeat depois que o compromisso
é criado, para que o acompanhamento não seja repetido no mesmo momento em que foi
inferido.

## Escopo

Compromissos são escopados ao agente e ao contexto de canal exatos em que foram
criados. Um acompanhamento inferido ao conversar com um agente no Discord não é
entregue por outro agente, outro canal ou uma sessão não relacionada.

Esse escopo faz parte do recurso. Verificações naturais devem parecer a continuação
da mesma conversa, não um sistema global de lembretes.

## Compromissos vs. lembretes

| Necessidade                                     | Use                                      |
| ----------------------------------------------- | ---------------------------------------- |
| "Lembre-me às 15h"                              | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Me avise em 20 minutos"                        | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Execute este relatório todos os dias úteis"    | [Tarefas agendadas](/pt-BR/automation/cron-jobs) |
| "Tenho uma entrevista amanhã"                   | Compromissos                            |
| "Passei a noite acordado"                       | Compromissos                            |
| "Faça acompanhamento se eu não responder a esta conversa aberta" | Compromissos              |

Solicitações exatas do usuário já pertencem ao caminho do agendador. Compromissos são apenas
para acompanhamentos inferidos: os momentos em que o usuário não pediu um lembrete,
mas a conversa claramente criou uma verificação futura útil.

## Gerenciar compromissos

Use a CLI para inspecionar e limpar compromissos armazenados:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Veja [`openclaw commitments`](/pt-BR/cli/commitments) para a referência do comando.

## Privacidade e custo

A extração de compromissos usa uma passagem de LLM, então ativá-la adiciona uso de modelo em segundo plano
após turnos elegíveis. A passagem fica oculta da conversa
visível ao usuário, mas pode ler a troca recente necessária para decidir se existe um
acompanhamento.

Compromissos armazenados são estado local do OpenClaw. Eles são memória operacional, não
memória de longo prazo. Desative o recurso com:

```bash
openclaw config set commitments.enabled false
```

## Solução de problemas

Se os acompanhamentos esperados não aparecerem:

- Confirme que `commitments.enabled` é `true`.
- Verifique `openclaw commitments --all` para registros pendentes, descartados, adiados ou expirados.
- Certifique-se de que o Heartbeat esteja em execução para o agente.
- Verifique se `commitments.maxPerDay` já foi atingido para essa
  sessão de agente.
- Lembre-se de que lembretes exatos são ignorados pela extração de compromissos e devem
  aparecer em [tarefas agendadas](/pt-BR/automation/cron-jobs).

## Relacionado

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Active Memory](/pt-BR/concepts/active-memory)
- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [`openclaw commitments`](/pt-BR/cli/commitments)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#commitments)
