---
read_when:
    - Você quer entender roteamento e isolamento de sessão
    - Você quer configurar o escopo de DM para configurações com vários usuários
summary: Como o OpenClaw gerencia sessões de conversa
title: Gerenciamento de sessão
x-i18n:
    generated_at: "2026-04-24T05:49:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: cafff1fd480bdd306f87c818e7cb66bda8440d643fbe9ce5e14b773630b35d37
    source_path: concepts/session.md
    workflow: 15
---

O OpenClaw organiza conversas em **sessões**. Cada mensagem é roteada para uma
sessão com base em sua origem -- DMs, chats em grupo, tarefas Cron etc.

## Como as mensagens são roteadas

| Source          | Comportamento             |
| --------------- | ------------------------- |
| Mensagens diretas | Sessão compartilhada por padrão |
| Chats em grupo  | Isolado por grupo         |
| Salas/canais    | Isolado por sala          |
| Tarefas Cron    | Sessão nova por execução  |
| Webhooks        | Isolado por hook          |

## Isolamento de DM

Por padrão, todas as DMs compartilham uma sessão para manter continuidade. Isso funciona bem para
configurações com um único usuário.

<Warning>
Se várias pessoas puderem enviar mensagens ao seu agente, ative o isolamento de DM. Sem isso, todos os
usuários compartilham o mesmo contexto de conversa -- as mensagens privadas de Alice ficariam
visíveis para Bob.
</Warning>

**A correção:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolar por canal + remetente
  },
}
```

Outras opções:

- `main` (padrão) -- todas as DMs compartilham uma sessão.
- `per-peer` -- isolar por remetente (entre canais).
- `per-channel-peer` -- isolar por canal + remetente (recomendado).
- `per-account-channel-peer` -- isolar por conta + canal + remetente.

<Tip>
Se a mesma pessoa entrar em contato com você por vários canais, use
`session.identityLinks` para vincular suas identidades para que compartilhem uma única sessão.
</Tip>

Verifique sua configuração com `openclaw security audit`.

## Ciclo de vida da sessão

As sessões são reutilizadas até expirarem:

- **Redefinição diária** (padrão) -- nova sessão às 4:00 da manhã no horário local do
  host do gateway.
- **Redefinição por inatividade** (opcional) -- nova sessão após um período de inatividade. Defina
  `session.reset.idleMinutes`.
- **Redefinição manual** -- digite `/new` ou `/reset` no chat. `/new <model>` também
  troca o modelo.

Quando redefinições diária e por inatividade estão configuradas, a que expirar primeiro prevalece.

Sessões com uma sessão CLI ativa pertencente ao provedor não são encerradas pelo padrão diário implícito.
Use `/reset` ou configure `session.reset` explicitamente quando essas sessões devem expirar com base em um temporizador.

## Onde o estado fica

Todo o estado da sessão pertence ao **gateway**. Clientes de UI consultam o gateway para obter
dados da sessão.

- **Armazenamento:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcrições:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Manutenção de sessão

O OpenClaw limita automaticamente o armazenamento de sessões ao longo do tempo. Por padrão, ele é executado
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

Visualize com `openclaw sessions cleanup --dry-run`.

## Inspecionando sessões

- `openclaw status` -- caminho do armazenamento de sessões e atividade recente.
- `openclaw sessions --json` -- todas as sessões (filtre com `--active <minutes>`).
- `/status` no chat -- uso de contexto, modelo e alternâncias.
- `/context list` -- o que está no prompt de sistema.

## Leitura adicional

- [Poda de sessão](/pt-BR/concepts/session-pruning) -- aparando resultados de ferramentas
- [Compaction](/pt-BR/concepts/compaction) -- resumindo conversas longas
- [Ferramentas de sessão](/pt-BR/concepts/session-tool) -- ferramentas do agente para trabalho entre sessões
- [Análise aprofundada do gerenciamento de sessão](/pt-BR/reference/session-management-compaction) --
  schema do armazenamento, transcrições, política de envio, metadados de origem e configuração avançada
- [Múltiplos agentes](/pt-BR/concepts/multi-agent) — roteamento e isolamento de sessão entre agentes
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como trabalho destacado cria registros de tarefas com referências de sessão
- [Roteamento de canal](/pt-BR/channels/channel-routing) — como mensagens de entrada são roteadas para sessões

## Relacionado

- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Ferramentas de sessão](/pt-BR/concepts/session-tool)
- [Fila de comandos](/pt-BR/concepts/queue)
