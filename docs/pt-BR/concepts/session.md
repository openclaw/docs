---
read_when:
    - Você quer entender o roteamento e o isolamento de sessões
    - Você quer configurar o escopo de DM para ambientes multiusuário
    - Você está depurando redefinições de sessão diárias ou por ociosidade
summary: Como o OpenClaw gerencia sessões de conversa
title: Gerenciamento de sessões
x-i18n:
    generated_at: "2026-04-30T09:46:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiza conversas em **sessões**. Cada mensagem é roteada para uma
sessão com base em sua origem: DMs, chats em grupo, trabalhos Cron etc.

## Como as mensagens são roteadas

| Origem          | Comportamento                  |
| --------------- | ------------------------- |
| Mensagens diretas | Sessão compartilhada por padrão |
| Chats em grupo     | Isolada por grupo        |
| Salas/canais  | Isolada por sala         |
| Trabalhos Cron       | Nova sessão por execução     |
| Webhooks        | Isolada por hook         |

## Isolamento de DM

Por padrão, todas as DMs compartilham uma sessão para manter a continuidade. Isso é adequado para
configurações de usuário único.

<Warning>
Se várias pessoas puderem enviar mensagens ao seu agente, habilite o isolamento de DM. Sem isso, todos os
usuários compartilham o mesmo contexto de conversa: as mensagens privadas de Alice ficariam
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

- `main` (padrão) -- todas as DMs compartilham uma sessão.
- `per-peer` -- isola por remetente (entre canais).
- `per-channel-peer` -- isola por canal + remetente (recomendado).
- `per-account-channel-peer` -- isola por conta + canal + remetente.

<Tip>
Se a mesma pessoa entrar em contato com você por vários canais, use
`session.identityLinks` para vincular suas identidades para que compartilhem uma sessão.
</Tip>

### Acoplar canais vinculados

Comandos de acoplamento permitem que um usuário mova a rota de resposta da sessão atual de chat direto para
outro canal vinculado sem iniciar uma nova sessão. Consulte
[Acoplamento de canais](/pt-BR/concepts/channel-docking) para exemplos, configuração e
solução de problemas.

Verifique sua configuração com `openclaw security audit`.

## Ciclo de vida da sessão

As sessões são reutilizadas até expirarem:

- **Redefinição diária** (padrão) -- nova sessão às 4:00 da manhã no horário local no host do Gateway.
  A atualização diária se baseia em quando o `sessionId` atual começou, não
  em gravações posteriores de metadados.
- **Redefinição por inatividade** (opcional) -- nova sessão após um período de inatividade. Defina
  `session.reset.idleMinutes`. A atualização por inatividade se baseia na última
  interação real de usuário/canal, portanto eventos de sistema de heartbeat, cron e exec não
  mantêm a sessão ativa.
- **Redefinição manual** -- digite `/new` ou `/reset` no chat. `/new <model>` também
  troca o modelo.

Quando redefinições diária e por inatividade estão configuradas, vence a que expirar primeiro.
Heartbeat, cron, exec e outras rodadas de eventos de sistema podem gravar metadados da sessão,
mas essas gravações não estendem a atualização de redefinição diária ou por inatividade. Quando uma redefinição
troca a sessão, avisos enfileirados de eventos de sistema da sessão antiga são
descartados para que atualizações antigas em segundo plano não sejam prefixadas ao primeiro prompt na
nova sessão.

Sessões com uma sessão de CLI ativa pertencente ao provedor não são interrompidas pelo padrão diário
implícito. Use `/reset` ou configure `session.reset` explicitamente quando essas
sessões devem expirar por temporizador.

## Onde o estado fica

Todo o estado da sessão pertence ao **Gateway**. Clientes de UI consultam o Gateway para
dados de sessão.

- **Armazenamento:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcrições:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantém timestamps de ciclo de vida separados:

- `sessionStartedAt`: quando o `sessionId` atual começou; a redefinição diária usa isto.
- `lastInteractionAt`: última interação de usuário/canal que estende a vida útil por inatividade.
- `updatedAt`: última mutação da linha do armazenamento; útil para listar e podar, mas não
  autoritativo para a atualização de redefinição diária/por inatividade.

Linhas antigas sem `sessionStartedAt` são resolvidas a partir do cabeçalho de sessão JSONL da transcrição
quando disponível. Se uma linha antiga também não tiver `lastInteractionAt`,
a atualização por inatividade recai para esse horário de início da sessão, não para gravações posteriores
de contabilidade.

## Manutenção de sessões

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

Para limites de `maxEntries` em tamanho de produção, gravações em tempo de execução do Gateway usam um pequeno buffer de marca alta e limpam de volta até o limite configurado em lotes. Isso evita executar a limpeza completa do armazenamento em cada sessão Cron isolada. `openclaw sessions cleanup --enforce` aplica o limite imediatamente.

Pré-visualize com `openclaw sessions cleanup --dry-run`.

## Inspecionando sessões

- `openclaw status` -- caminho do armazenamento de sessões e atividade recente.
- `openclaw sessions --json` -- todas as sessões (filtre com `--active <minutes>`).
- `/status` no chat -- uso de contexto, modelo e alternâncias.
- `/context list` -- o que está no prompt do sistema.

## Leitura adicional

- [Poda de sessões](/pt-BR/concepts/session-pruning) -- remoção de resultados de ferramentas
- [Compaction](/pt-BR/concepts/compaction) -- resumo de conversas longas
- [Ferramentas de sessão](/pt-BR/concepts/session-tool) -- ferramentas do agente para trabalho entre sessões
- [Análise aprofundada de gerenciamento de sessões](/pt-BR/reference/session-management-compaction) --
  esquema do armazenamento, transcrições, política de envio, metadados de origem e configuração avançada
- [Multiagente](/pt-BR/concepts/multi-agent) — roteamento e isolamento de sessões entre agentes
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como trabalho destacado cria registros de tarefas com referências de sessão
- [Roteamento de canais](/pt-BR/channels/channel-routing) — como mensagens de entrada são roteadas para sessões

## Relacionado

- [Poda de sessões](/pt-BR/concepts/session-pruning)
- [Ferramentas de sessão](/pt-BR/concepts/session-tool)
- [Fila de comandos](/pt-BR/concepts/queue)
