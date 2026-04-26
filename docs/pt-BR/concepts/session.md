---
read_when:
    - Você quer entender o roteamento e o isolamento de sessões
    - Você quer configurar o escopo de DM para ambientes multiusuário
    - Você está depurando redefinições diárias ou por inatividade de sessões
summary: Como o OpenClaw gerencia sessões de conversa
title: Gerenciamento de sessão
x-i18n:
    generated_at: "2026-04-26T11:27:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36995997dc7eb612333c6bbfe6cd6c08dc22769ad0a7e47d15dbb4208e6113
    source_path: concepts/session.md
    workflow: 15
---

O OpenClaw organiza conversas em **sessões**. Cada mensagem é roteada para uma
sessão com base em sua origem — DMs, chats em grupo, tarefas Cron etc.

## Como as mensagens são roteadas

| Origem          | Comportamento              |
| --------------- | -------------------------- |
| Mensagens diretas | Sessão compartilhada por padrão |
| Chats em grupo  | Isoladas por grupo         |
| Salas/canais    | Isoladas por sala          |
| Tarefas Cron    | Nova sessão por execução   |
| Webhooks        | Isoladas por hook          |

## Isolamento de DM

Por padrão, todas as DMs compartilham uma sessão para manter continuidade. Isso é adequado para
ambientes de usuário único.

<Warning>
Se várias pessoas puderem enviar mensagens ao seu agente, ative o isolamento de DM. Sem isso, todos
os usuários compartilham o mesmo contexto de conversa — as mensagens privadas da Alice ficariam
visíveis para Bob.
</Warning>

**A correção:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isola por canal + remetente
  },
}
```

Outras opções:

- `main` (padrão) — todas as DMs compartilham uma sessão.
- `per-peer` — isola por remetente (entre canais).
- `per-channel-peer` — isola por canal + remetente (recomendado).
- `per-account-channel-peer` — isola por conta + canal + remetente.

<Tip>
Se a mesma pessoa entrar em contato com você por vários canais, use
`session.identityLinks` para vincular as identidades dela e fazer com que compartilhem uma sessão.
</Tip>

Verifique sua configuração com `openclaw security audit`.

## Ciclo de vida da sessão

As sessões são reutilizadas até expirarem:

- **Redefinição diária** (padrão) — nova sessão às 4:00 da manhã no horário local do host do Gateway.
  A renovação diária se baseia em quando o `sessionId` atual começou, não
  em gravações posteriores de metadados.
- **Redefinição por inatividade** (opcional) — nova sessão após um período de inatividade. Defina
  `session.reset.idleMinutes`. A renovação por inatividade se baseia na última interação real
  de usuário/canal, então Heartbeat, Cron e eventos de sistema exec não mantêm a sessão ativa.
- **Redefinição manual** — digite `/new` ou `/reset` no chat. `/new <model>` também
  troca o model.

Quando redefinições diária e por inatividade estão configuradas, vale a que expirar primeiro.
Turnos de Heartbeat, Cron, exec e outros eventos de sistema podem gravar metadados da sessão,
mas essas gravações não estendem a renovação de redefinição diária ou por inatividade. Quando uma redefinição
troca a sessão, avisos enfileirados de eventos de sistema da sessão antiga são
descartados para que atualizações obsoletas em segundo plano não sejam antepostas ao primeiro prompt na
nova sessão.

Sessões com uma sessão de CLI ativa controlada pelo provider não são interrompidas pela
configuração diária implícita padrão. Use `/reset` ou configure `session.reset` explicitamente quando essas
sessões precisarem expirar por temporizador.

## Onde o estado fica armazenado

Todo o estado da sessão pertence ao **Gateway**. Clientes de UI consultam o Gateway para obter
dados de sessão.

- **Armazenamento:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcrições:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantém carimbos de data/hora de ciclo de vida separados:

- `sessionStartedAt`: quando o `sessionId` atual começou; a redefinição diária usa isso.
- `lastInteractionAt`: última interação de usuário/canal que estende a vida útil por inatividade.
- `updatedAt`: última mutação da linha no armazenamento; útil para listagem e remoção, mas não
  é autoritativo para a renovação de redefinição diária/por inatividade.

Linhas mais antigas sem `sessionStartedAt` são resolvidas a partir do cabeçalho de sessão JSONL da
transcrição quando disponível. Se uma linha mais antiga também não tiver `lastInteractionAt`,
a renovação por inatividade recorre ao horário de início da sessão, não a gravações posteriores de controle.

## Manutenção de sessão

O OpenClaw limita automaticamente o armazenamento de sessões ao longo do tempo. Por padrão, ele executa
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

- `openclaw status` — caminho do armazenamento de sessões e atividade recente.
- `openclaw sessions --json` — todas as sessões (filtre com `--active <minutes>`).
- `/status` no chat — uso de contexto, model e alternâncias.
- `/context list` — o que está no prompt do sistema.

## Leitura adicional

- [Session Pruning](/pt-BR/concepts/session-pruning) — corte de resultados de ferramentas
- [Compaction](/pt-BR/concepts/compaction) — resumo de conversas longas
- [Ferramentas de sessão](/pt-BR/concepts/session-tool) — ferramentas do agente para trabalho entre sessões
- [Análise detalhada do gerenciamento de sessão](/pt-BR/reference/session-management-compaction) —
  esquema de armazenamento, transcrições, política de envio, metadados de origem e configuração avançada
- [Multi-Agent](/pt-BR/concepts/multi-agent) — roteamento e isolamento de sessões entre agentes
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como trabalho desanexado cria registros de tarefa com referências de sessão
- [Roteamento de canal](/pt-BR/channels/channel-routing) — como mensagens de entrada são roteadas para sessões

## Relacionado

- [Session pruning](/pt-BR/concepts/session-pruning)
- [Ferramentas de sessão](/pt-BR/concepts/session-tool)
- [Fila de comandos](/pt-BR/concepts/queue)
