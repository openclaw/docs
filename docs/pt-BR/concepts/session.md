---
read_when:
    - Você quer entender o roteamento e o isolamento de sessões
    - Você quer configurar o escopo de mensagens diretas para configurações multiusuário
    - Você está depurando redefinições diárias ou de sessões ociosas
summary: Como o OpenClaw gerencia sessões de conversa
title: Gerenciamento de sessões
x-i18n:
    generated_at: "2026-05-02T05:46:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiza conversas em **sessões**. Cada mensagem é roteada para uma
sessão com base em sua origem: DMs, conversas em grupo, tarefas cron etc.

## Como as mensagens são roteadas

| Origem             | Comportamento                |
| ------------------ | ---------------------------- |
| Mensagens diretas  | Sessão compartilhada por padrão |
| Conversas em grupo | Isolada por grupo            |
| Salas/canais       | Isolada por sala             |
| Tarefas cron       | Nova sessão por execução     |
| Webhooks           | Isolada por hook             |

## Isolamento de DMs

Por padrão, todos os DMs compartilham uma sessão para continuidade. Isso é adequado para
configurações de usuário único.

<Warning>
Se várias pessoas puderem enviar mensagens ao seu agente, habilite o isolamento de DMs. Sem isso, todos
os usuários compartilham o mesmo contexto de conversa: as mensagens privadas da Alice ficariam
visíveis para Bob.
</Warning>

**A correção:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Outras opções:

- `main` (padrão) -- todos os DMs compartilham uma sessão.
- `per-peer` -- isola por remetente (entre canais).
- `per-channel-peer` -- isola por canal + remetente (recomendado).
- `per-account-channel-peer` -- isola por conta + canal + remetente.

<Tip>
Se a mesma pessoa entrar em contato por vários canais, use
`session.identityLinks` para vincular suas identidades para que elas compartilhem uma sessão.
</Tip>

### Acoplar canais vinculados

Comandos de acoplamento permitem que um usuário mova a rota de resposta da sessão atual de conversa direta para
outro canal vinculado sem iniciar uma nova sessão. Consulte
[Acoplamento de canais](/pt-BR/concepts/channel-docking) para exemplos, configuração e
solução de problemas.

Verifique sua configuração com `openclaw security audit`.

## Ciclo de vida da sessão

As sessões são reutilizadas até expirarem:

- **Redefinição diária** (padrão) -- nova sessão às 4:00 da manhã no horário local do host do Gateway
  host. A atualização diária é baseada em quando o `sessionId` atual começou, não
  em gravações posteriores de metadados.
- **Redefinição por inatividade** (opcional) -- nova sessão após um período de inatividade. Defina
  `session.reset.idleMinutes`. A atualização por inatividade é baseada na última interação real
  de usuário/canal, portanto eventos de sistema de heartbeat, cron e exec não
  mantêm a sessão ativa.
- **Redefinição manual** -- digite `/new` ou `/reset` no chat. `/new <model>` também
  troca o modelo.

Quando redefinições diárias e por inatividade estão configuradas, a que expirar primeiro prevalece.
Heartbeat, cron, exec e outros turnos de eventos de sistema podem gravar metadados da sessão,
mas essas gravações não estendem a atualização da redefinição diária ou por inatividade. Quando uma redefinição
muda a sessão, avisos de eventos de sistema enfileirados para a sessão antiga são
descartados para que atualizações obsoletas em segundo plano não sejam prefixadas ao primeiro prompt da
nova sessão.

Sessões com uma sessão de CLI ativa pertencente ao provedor não são cortadas pelo padrão diário
implícito. Use `/reset` ou configure `session.reset` explicitamente quando essas
sessões devem expirar por temporizador.

## Onde o estado fica

Todo o estado da sessão pertence ao **Gateway**. Clientes de UI consultam o Gateway para
dados de sessão.

- **Armazenamento:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcrições:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantém timestamps separados de ciclo de vida:

- `sessionStartedAt`: quando o `sessionId` atual começou; a redefinição diária usa isto.
- `lastInteractionAt`: última interação de usuário/canal que estende a duração por inatividade.
- `updatedAt`: última mutação da linha no armazenamento; útil para listar e podar, mas não
  autoritativo para a atualização da redefinição diária/por inatividade.

Linhas antigas sem `sessionStartedAt` são resolvidas a partir do cabeçalho de sessão JSONL da transcrição
quando disponível. Se uma linha antiga também não tiver `lastInteractionAt`,
a atualização por inatividade volta para esse horário de início da sessão, não para gravações posteriores
de manutenção.

## Manutenção de sessão

OpenClaw limita automaticamente o armazenamento de sessões ao longo do tempo. Por padrão, ele é executado
no modo `warn` (relata o que seria limpo). Defina `session.maintenance.mode`
como `"enforce"` para limpeza automática:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Para limites de `maxEntries` em tamanho de produção, gravações em tempo de execução do Gateway usam um pequeno buffer de limite superior e limpam de volta até o teto configurado em lotes. Leituras do armazenamento de sessão não podam nem limitam entradas durante a inicialização do Gateway. Isso evita executar limpeza completa do armazenamento em toda inicialização ou sessão cron isolada. `openclaw sessions cleanup --enforce` aplica o limite imediatamente.

A manutenção preserva ponteiros duráveis de conversas externas, incluindo sessões de grupo
e sessões de chat com escopo de thread, enquanto ainda permite que entradas sintéticas de cron,
hook, heartbeat, ACP e subagente expirem com o tempo.

Pré-visualize com `openclaw sessions cleanup --dry-run`.

## Inspecionando sessões

- `openclaw status` -- caminho do armazenamento de sessões e atividade recente.
- `openclaw sessions --json` -- todas as sessões (filtre com `--active <minutes>`).
- `/status` no chat -- uso de contexto, modelo e alternâncias.
- `/context list` -- o que está no prompt do sistema.

## Leitura adicional

- [Poda de sessão](/pt-BR/concepts/session-pruning) -- aparando resultados de ferramentas
- [Compaction](/pt-BR/concepts/compaction) -- resumindo conversas longas
- [Ferramentas de sessão](/pt-BR/concepts/session-tool) -- ferramentas do agente para trabalho entre sessões
- [Aprofundamento no gerenciamento de sessão](/pt-BR/reference/session-management-compaction) --
  esquema de armazenamento, transcrições, política de envio, metadados de origem e configuração avançada
- [Multiagente](/pt-BR/concepts/multi-agent) — roteamento e isolamento de sessões entre agentes
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como trabalho desanexado cria registros de tarefas com referências de sessão
- [Roteamento de canais](/pt-BR/channels/channel-routing) — como mensagens de entrada são roteadas para sessões

## Relacionado

- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Ferramentas de sessão](/pt-BR/concepts/session-tool)
- [Fila de comandos](/pt-BR/concepts/queue)
