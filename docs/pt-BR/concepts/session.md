---
read_when:
    - Você quer entender o roteamento e o isolamento de sessões
    - Você quer configurar o escopo de DM para ambientes multiusuário
    - Você está depurando redefinições de sessão diárias ou por inatividade
summary: Como o OpenClaw gerencia sessões de conversa
title: Gerenciamento de sessões
x-i18n:
    generated_at: "2026-05-07T13:15:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e5ec741a33262ce5c42caf021ad81892e89b3315db31ac7b141d5a13e8b22a2
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiza conversas em **sessões**. Cada mensagem é roteada para uma
sessão com base em sua origem -- DMs, conversas em grupo, trabalhos Cron, etc.

## Como as mensagens são roteadas

| Origem              | Comportamento               |
| ------------------- | --------------------------- |
| Mensagens diretas   | Sessão compartilhada por padrão |
| Conversas em grupo  | Isolada por grupo           |
| Salas/canais        | Isolada por sala            |
| Trabalhos Cron      | Nova sessão por execução    |
| Webhooks            | Isolada por hook            |

## Isolamento de DMs

Por padrão, todas as DMs compartilham uma sessão para manter a continuidade. Isso é adequado para
configurações com um único usuário.

<Warning>
Se várias pessoas puderem enviar mensagens ao seu agente, ative o isolamento de DMs. Sem isso, todos
os usuários compartilham o mesmo contexto de conversa -- as mensagens privadas de Alice ficariam
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
`session.identityLinks` para vincular as identidades dela para que compartilhem uma sessão.
</Tip>

### Acoplar canais vinculados

Comandos de acoplamento permitem que um usuário mova a rota de resposta da sessão de chat direto atual para
outro canal vinculado sem iniciar uma nova sessão. Consulte
[Acoplamento de canais](/pt-BR/concepts/channel-docking) para exemplos, configuração e
solução de problemas.

Verifique sua configuração com `openclaw security audit`.

## Ciclo de vida da sessão

As sessões são reutilizadas até expirarem:

- **Redefinição diária** (padrão) -- nova sessão às 4:00 da manhã no horário local do host do Gateway.
  A renovação diária é baseada em quando o `sessionId` atual começou, não
  em gravações posteriores de metadados.
- **Redefinição por inatividade** (opcional) -- nova sessão após um período de inatividade. Defina
  `session.reset.idleMinutes`. A renovação por inatividade é baseada na última interação real de
  usuário/canal, portanto eventos de sistema de Heartbeat, Cron e exec não
  mantêm a sessão ativa.
- **Redefinição manual** -- digite `/new` ou `/reset` no chat. `/new <model>` também
  troca o modelo.

Quando as redefinições diária e por inatividade estão configuradas, vence a que expirar primeiro.
Heartbeat, Cron, exec e outros turnos de eventos de sistema podem gravar metadados da sessão,
mas essas gravações não estendem a renovação da redefinição diária ou por inatividade. Quando uma redefinição
troca a sessão, avisos de eventos de sistema enfileirados para a sessão antiga são
descartados para que atualizações obsoletas em segundo plano não sejam anexadas ao primeiro prompt da
nova sessão.

Sessões com uma sessão de CLI ativa pertencente ao provedor não são interrompidas pelo padrão
diário implícito. Use `/reset` ou configure `session.reset` explicitamente quando essas
sessões devem expirar com um temporizador.

## Onde o estado fica

Todo o estado da sessão pertence ao **Gateway**. Clientes de UI consultam o Gateway para
obter dados da sessão.

- **Armazenamento:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcrições:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantém carimbos de data/hora de ciclo de vida separados:

- `sessionStartedAt`: quando o `sessionId` atual começou; a redefinição diária usa isso.
- `lastInteractionAt`: última interação de usuário/canal que estende a duração por inatividade.
- `updatedAt`: última mutação da linha do armazenamento; útil para listagem e poda, mas não
  é autoritativo para a renovação da redefinição diária/por inatividade.

Linhas antigas sem `sessionStartedAt` são resolvidas a partir do cabeçalho de sessão JSONL da transcrição
quando disponível. Se uma linha antiga também não tiver `lastInteractionAt`,
a renovação por inatividade volta ao horário de início dessa sessão, não a gravações posteriores de
controle interno.

## Manutenção de sessões

O OpenClaw limita automaticamente o armazenamento de sessões ao longo do tempo. Por padrão, ele executa
em modo `warn` (relata o que seria limpo). Defina `session.maintenance.mode`
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

Para limites `maxEntries` de tamanho de produção, as gravações em tempo de execução do Gateway usam um pequeno buffer de marca alta e limpam em lotes até voltar ao limite configurado. Leituras do armazenamento de sessões não podam nem limitam entradas durante a inicialização do Gateway. Isso evita executar uma limpeza completa do armazenamento em toda inicialização ou sessão Cron isolada. `openclaw sessions cleanup --enforce` aplica o limite imediatamente.

A manutenção preserva ponteiros duráveis de conversas externas, incluindo sessões de grupo
e sessões de chat com escopo de thread, enquanto ainda permite que entradas sintéticas de Cron,
hook, Heartbeat, ACP e subagente envelheçam até serem removidas.

Se você usou anteriormente isolamento de mensagens diretas e depois retornou
`session.dmScope` para `main`, visualize linhas obsoletas de DM indexadas por peer com
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Aplicar a mesma flag
aposenta essas linhas antigas de DM direta e mantém suas transcrições como arquivos
excluídos.

Visualize com `openclaw sessions cleanup --dry-run`.

## Inspecionando sessões

- `openclaw status` -- caminho do armazenamento de sessões e atividade recente.
- `openclaw sessions --json` -- todas as sessões (filtre com `--active <minutes>`).
- `/status` no chat -- uso de contexto, modelo e alternâncias.
- `/context list` -- o que está no prompt do sistema.

## Leitura adicional

- [Poda de sessões](/pt-BR/concepts/session-pruning) -- remoção de resultados de ferramentas
- [Compaction](/pt-BR/concepts/compaction) -- resumo de conversas longas
- [Ferramentas de sessão](/pt-BR/concepts/session-tool) -- ferramentas do agente para trabalho entre sessões
- [Aprofundamento no gerenciamento de sessões](/pt-BR/reference/session-management-compaction) --
  esquema do armazenamento, transcrições, política de envio, metadados de origem e configuração avançada
- [Multiagente](/pt-BR/concepts/multi-agent) — roteamento e isolamento de sessões entre agentes
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como trabalho desacoplado cria registros de tarefas com referências de sessão
- [Roteamento de canais](/pt-BR/channels/channel-routing) — como mensagens de entrada são roteadas para sessões

## Relacionado

- [Poda de sessões](/pt-BR/concepts/session-pruning)
- [Ferramentas de sessão](/pt-BR/concepts/session-tool)
- [Fila de comandos](/pt-BR/concepts/queue)
