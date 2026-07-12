---
read_when:
    - Você quer entender o roteamento e o isolamento de sessões
    - Você quer configurar o escopo das mensagens diretas para ambientes com vários usuários
    - Você está depurando redefinições de sessão diárias ou por inatividade
summary: Como o OpenClaw gerencia sessões de conversa
title: Gerenciamento de sessões
x-i18n:
    generated_at: "2026-07-12T15:12:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

O OpenClaw encaminha cada mensagem recebida para uma **sessão** com base em sua
origem: mensagens diretas, conversas em grupo, tarefas cron etc. Todo o estado
da sessão pertence ao **Gateway**; os clientes de interface consultam o Gateway
para obter os dados da sessão.

## Como as mensagens são encaminhadas

| Origem             | Comportamento                     |
| ------------------ | --------------------------------- |
| Mensagens diretas  | Sessão compartilhada por padrão   |
| Conversas em grupo | Isolada por grupo                  |
| Salas/canais       | Isolada por sala                   |
| Tarefas cron       | Nova sessão a cada execução        |
| Webhooks           | Isolada por Webhook                |

## Isolamento de mensagens diretas

Por padrão, todas as mensagens diretas compartilham uma sessão para manter a
continuidade, o que é adequado para configurações com um único usuário.

<Warning>
Se várias pessoas puderem enviar mensagens ao seu agente, habilite o isolamento
de mensagens diretas. Sem ele, todos os usuários compartilham o mesmo contexto
de conversa; portanto, as mensagens privadas de Alice ficariam visíveis para Bob.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolar por canal + remetente
  },
}
```

Opções de `session.dmScope`:

| Valor                      | Comportamento                                      |
| -------------------------- | -------------------------------------------------- |
| `main` (padrão)            | Todas as mensagens diretas compartilham uma sessão |
| `per-peer`                 | Isolar por remetente, entre canais                 |
| `per-channel-peer`         | Isolar por canal + remetente (recomendado)         |
| `per-account-channel-peer` | Isolar por conta + canal + remetente                |

<Tip>
Se a mesma pessoa entrar em contato com você por vários canais, use
`session.identityLinks` para mapear suas identidades para um único ID de par
canônico, de modo que elas compartilhem uma sessão.
</Tip>

### Acoplar canais vinculados

Os comandos de acoplamento transferem a rota de resposta da sessão atual de
conversa direta para outro canal vinculado sem iniciar uma nova sessão. Consulte
[Acoplamento de canais](/pt-BR/concepts/channel-docking) para ver exemplos,
configuração e solução de problemas.

Verifique sua configuração com `openclaw security audit`.

## Ciclo de vida da sessão

As sessões são reutilizadas até expirarem conforme `session.reset`:

- **Redefinição diária** (`mode: "daily"` por padrão) - nova sessão em um horário
  local configurado (`session.reset.atHour`, padrão `4`, 0-23) no host do
  Gateway. A validade diária é baseada no momento em que o `sessionId` atual
  foi iniciado, não em gravações posteriores de metadados.
- **Redefinição por inatividade** (`mode: "idle"`) - nova sessão após
  `session.reset.idleMinutes` de inatividade. A validade por inatividade é
  baseada na última interação real do usuário/canal; portanto, eventos de
  sistema de Heartbeat, Cron e exec não mantêm a sessão ativa.
- **Redefinição manual** - digite `/new` ou `/reset` na conversa. `/new <model>`
  também altera o modelo.

Quando as redefinições diária e por inatividade estão configuradas, prevalece a
que expirar primeiro. Heartbeat, Cron, exec e outros turnos de eventos do sistema
podem gravar metadados da sessão, mas essas gravações não estendem a validade da
redefinição diária nem daquela por inatividade. Quando uma redefinição renova a
sessão, as notificações de eventos do sistema enfileiradas para a sessão anterior
são descartadas, para que atualizações antigas em segundo plano não sejam
adicionadas antes do primeiro prompt da nova sessão.

Sessões com uma sessão de CLI ativa pertencente ao provedor não são encerradas
pela redefinição diária padrão implícita. Use `/reset` ou configure
`session.reset` explicitamente quando essas sessões precisarem expirar segundo
um temporizador.

Substitua o padrão por tipo de conversa ou por canal:

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` oferece suporte a `direct` (alias legado `dm`), `group` e `thread`.
O `session.idleMinutes` legado de nível superior ainda funciona como um alias de compatibilidade para
um padrão do modo ocioso quando nenhum bloco `session.reset`/`resetByType` está definido.

## Onde o estado fica armazenado

- **Linhas de sessão em tempo de execução:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Arquivos de transcrição arquivados:** `~/.openclaw/agents/<agentId>/sessions/`
- **Origem da migração de linhas legadas:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

As linhas de sessão no banco de dados SQLite por agente mantêm registros de data e hora
separados do ciclo de vida:

- `sessionStartedAt`: quando o `sessionId` atual começou; a redefinição diária usa esse valor.
- `lastInteractionAt`: última interação do usuário/canal que estende a duração do período ocioso.
- `updatedAt`: última alteração da linha no armazenamento; útil para listagem e limpeza, mas não é
  a fonte autoritativa para determinar a atualidade da redefinição diária/por inatividade.

Durante a migração de instalações mais antigas, a inicialização do Gateway e o `openclaw doctor
--fix` importam automaticamente para o SQLite as linhas legadas de `sessions.json` e o histórico
JSONL de transcrições ativas. As linhas sem `sessionStartedAt` são resolvidas pelo cabeçalho da
sessão no JSONL de transcrição legado, quando disponível. Se uma linha mais antiga também não
tiver `lastInteractionAt`, a atualidade do período ocioso usará como fallback o horário de início
da sessão, e não gravações administrativas posteriores. Use `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` e a [sequência de migração do
Doctor](/pt-BR/cli/doctor#session-sqlite-migration) quando quiser evidências explícitas
de inspeção ou validação.

## Manutenção de sessões

O OpenClaw limita o armazenamento de sessões ao longo do tempo por meio de `session.maintenance`,
com os padrões mostrados abaixo:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" aplica a limpeza; "warn" apenas relata
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Para limites de `maxEntries` dimensionados para produção, as gravações do tempo de execução do
Gateway usam um pequeno buffer acima do limite máximo e fazem a limpeza em lotes até atingir
novamente o limite configurado. As leituras do armazenamento de sessões não removem nem limitam
entradas durante a inicialização do Gateway, portanto a inicialização e as sessões Cron isoladas
não arcam com o custo de uma limpeza completa do armazenamento.
`openclaw sessions cleanup --enforce` aplica o limite imediatamente.

As sessões de sondagem de execução de modelo do Gateway têm duração curta por padrão. As linhas
que correspondem a `agent:*:explicit:model-run-<uuid>` usam uma retenção fixa de `24h`, mas a
limpeza é condicionada à pressão: ela só remove linhas de sondagem obsoletas quando a pressão
de manutenção/limite de entradas de sessão é atingida e é executada antes do limite geral de
idade das entradas obsoletas e do limite de entradas. Sessões normais diretas, de grupo, de
thread, Cron, hook, Heartbeat, ACP e de subagentes não herdam essa retenção de 24h.

A manutenção preserva ponteiros duráveis de conversas externas, incluindo sessões de grupo
e sessões de chat com escopo de thread, enquanto ainda permite que entradas sintéticas de Cron,
hook, Heartbeat, ACP e subagentes expirem com o tempo.

Se você usava anteriormente o isolamento de mensagens diretas e depois redefiniu `session.dmScope`
como `main`, visualize as linhas obsoletas de mensagens diretas indexadas por par com
`openclaw sessions cleanup --dry-run --fix-dm-scope`. A aplicação da mesma opção
desativa essas linhas antigas de mensagens diretas e mantém suas transcrições como arquivos
marcados como excluídos.

Visualize qualquer execução de manutenção com `openclaw sessions cleanup --dry-run`.

## Inspeção de sessões

| Comando                    | Exibe                                                   |
| -------------------------- | ------------------------------------------------------- |
| `openclaw status`          | Caminho do armazenamento de sessões e atividade recente |
| `openclaw sessions --json` | Todas as sessões (filtre com `--active <minutes>`)       |
| `/status` no chat          | Uso do contexto, modelo e opções                         |
| `/context list`            | O que está no prompt do sistema                          |

## Leitura adicional

- [Pesquisa de sessões](/concepts/session-search) - recuperação de texto completo em transcrições anteriores
- [Limpeza de sessões](/pt-BR/concepts/session-pruning) - redução dos resultados de ferramentas
- [Compaction](/pt-BR/concepts/compaction) - resumo de conversas longas
- [Ferramentas de sessão](/pt-BR/concepts/session-tool) - ferramentas do agente para trabalho entre sessões
- [Análise detalhada do gerenciamento de sessões](/pt-BR/reference/session-management-compaction) -
  esquema do armazenamento, transcrições, política de envio, metadados de origem e configuração avançada
- [Multiagente](/pt-BR/concepts/multi-agent) - roteamento e isolamento de sessões entre agentes
- [Tarefas em segundo plano](/pt-BR/automation/tasks) - como o trabalho desvinculado cria registros de tarefas com referências de sessão
- [Roteamento de canais](/pt-BR/channels/channel-routing) - como as mensagens recebidas são roteadas para sessões

## Relacionado

- [Limpeza de sessões](/pt-BR/concepts/session-pruning)
- [Ferramentas de sessão](/pt-BR/concepts/session-tool)
- [Fila de comandos](/pt-BR/concepts/queue)
