---
read_when:
    - Você quer entender o roteamento e o isolamento de sessões
    - Você quer configurar o escopo de DM para configurações multiusuário
    - Você está depurando redefinições de sessões diárias ou ociosas
summary: Como o OpenClaw gerencia sessões de conversa
title: Gerenciamento de sessões
x-i18n:
    generated_at: "2026-06-27T17:27:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

O OpenClaw organiza conversas em **sessões**. Cada mensagem é roteada para uma
sessão com base em sua origem -- DMs, chats em grupo, trabalhos Cron etc.

## Como as mensagens são roteadas

| Origem             | Comportamento                  |
| ------------------ | ------------------------------ |
| Mensagens diretas  | Sessão compartilhada por padrão |
| Chats em grupo     | Isolado por grupo              |
| Salas/canais       | Isolado por sala               |
| Trabalhos Cron     | Nova sessão por execução       |
| Webhooks           | Isolado por hook               |

## Isolamento de DM

Por padrão, todos os DMs compartilham uma sessão para continuidade. Isso é adequado para
configurações de usuário único.

<Warning>
Se várias pessoas puderem enviar mensagens ao seu agente, habilite o isolamento de DM. Sem isso, todos
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

- `main` (padrão) -- todos os DMs compartilham uma sessão.
- `per-peer` -- isola por remetente (entre canais).
- `per-channel-peer` -- isola por canal + remetente (recomendado).
- `per-account-channel-peer` -- isola por conta + canal + remetente.

<Tip>
Se a mesma pessoa entrar em contato por vários canais, use
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

- **Redefinição diária** (padrão) -- nova sessão às 4h00 no horário local no host do Gateway.
  A atualização diária é baseada em quando o `sessionId` atual começou, não
  em gravações posteriores de metadados.
- **Redefinição por inatividade** (opcional) -- nova sessão após um período de inatividade. Defina
  `session.reset.idleMinutes`. A atualização por inatividade é baseada na última interação real
  de usuário/canal, portanto eventos de sistema de Heartbeat, Cron e exec não
  mantêm a sessão ativa.
- **Redefinição manual** -- digite `/new` ou `/reset` no chat. `/new <model>` também
  troca o modelo.

Quando as redefinições diária e por inatividade estão configuradas, vence a que expirar primeiro.
Heartbeat, Cron, exec e outros turnos de eventos do sistema podem gravar metadados de sessão,
mas essas gravações não estendem a atualização da redefinição diária ou por inatividade. Quando uma redefinição
troca a sessão, os avisos de eventos do sistema enfileirados para a sessão antiga são
descartados para que atualizações obsoletas em segundo plano não sejam prefixadas ao primeiro prompt na
nova sessão.

Sessões com uma sessão de CLI ativa pertencente ao provedor não são interrompidas pelo padrão diário
implícito. Use `/reset` ou configure `session.reset` explicitamente quando essas
sessões devem expirar em um temporizador.

## Onde o estado fica

Todo o estado da sessão pertence ao **Gateway**. Clientes de UI consultam o Gateway para
dados de sessão.

- **Armazenamento:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcrições:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantém timestamps de ciclo de vida separados:

- `sessionStartedAt`: quando o `sessionId` atual começou; a redefinição diária usa isso.
- `lastInteractionAt`: última interação de usuário/canal que estende a vida útil por inatividade.
- `updatedAt`: última mutação de linha do armazenamento; útil para listagem e poda, mas não
  autoritativo para a atualização de redefinição diária/por inatividade.

Linhas mais antigas sem `sessionStartedAt` são resolvidas pelo cabeçalho de sessão JSONL da transcrição
quando disponível. Se uma linha mais antiga também não tiver `lastInteractionAt`,
a atualização por inatividade volta para esse horário de início da sessão, não para gravações posteriores de
manutenção interna.

## Manutenção de sessões

O OpenClaw limita automaticamente o armazenamento de sessões ao longo do tempo. Por padrão, ele roda
no modo `enforce` e aplica limpeza durante a manutenção. Defina
`session.maintenance.mode` como `"warn"` para relatar o que seria limpo sem modificar o armazenamento/arquivos:

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

Para limites `maxEntries` em tamanho de produção, as gravações de runtime do Gateway usam um pequeno buffer de limite alto e limpam em lotes até voltar ao teto configurado. Leituras do armazenamento de sessões não podam nem limitam entradas durante a inicialização do Gateway. Isso evita executar uma limpeza completa do armazenamento a cada inicialização ou sessão Cron isolada. `openclaw sessions cleanup --enforce` aplica o limite imediatamente.

Sessões de sondagem de execução de modelo do Gateway têm vida curta por padrão. Linhas correspondentes com
chaves explícitas estritas como `agent:*:explicit:model-run-<uuid>` usam retenção fixa de `24h`,
mas a limpeza é condicionada à pressão: ela só remove linhas de sondagem obsoletas quando
a pressão de manutenção/limite de entradas de sessão é atingida. Quando a limpeza de execução de modelo roda,
ela roda antes do corte de idade mais amplo de entradas obsoletas e do limite de entradas. Sessões normais diretas,
de grupo, thread, Cron, hook, Heartbeat, ACP e subagente não herdam
essa retenção de 24h.

A manutenção preserva ponteiros duráveis de conversas externas, incluindo sessões de grupo
e sessões de chat com escopo de thread, enquanto ainda permite que entradas sintéticas de Cron,
hook, Heartbeat, ACP e subagente envelheçam e expirem.

Se você usou anteriormente isolamento de mensagens diretas e depois retornou
`session.dmScope` para `main`, visualize linhas obsoletas de DM com chave por peer com
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Aplicar a mesma flag
aposenta essas linhas antigas de DM direto e mantém suas transcrições como arquivos
excluídos.

Pré-visualize com `openclaw sessions cleanup --dry-run`.

## Inspecionando sessões

- `openclaw status` -- caminho do armazenamento de sessões e atividade recente.
- `openclaw sessions --json` -- todas as sessões (filtre com `--active <minutes>`).
- `/status` no chat -- uso de contexto, modelo e alternâncias.
- `/context list` -- o que está no prompt do sistema.

## Leitura adicional

- [Poda de sessões](/pt-BR/concepts/session-pruning) -- redução de resultados de ferramentas
- [Compaction](/pt-BR/concepts/compaction) -- resumo de conversas longas
- [Ferramentas de sessão](/pt-BR/concepts/session-tool) -- ferramentas de agente para trabalho entre sessões
- [Aprofundamento em gerenciamento de sessões](/pt-BR/reference/session-management-compaction) --
  esquema do armazenamento, transcrições, política de envio, metadados de origem e configuração avançada
- [Multiagente](/pt-BR/concepts/multi-agent) — roteamento e isolamento de sessões entre agentes
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como trabalho desvinculado cria registros de tarefas com referências de sessão
- [Roteamento de canais](/pt-BR/channels/channel-routing) — como mensagens de entrada são roteadas para sessões

## Relacionado

- [Poda de sessões](/pt-BR/concepts/session-pruning)
- [Ferramentas de sessão](/pt-BR/concepts/session-tool)
- [Fila de comandos](/pt-BR/concepts/queue)
