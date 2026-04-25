---
read_when:
    - Alterar execução ou concorrência de respostas automáticas
summary: Projeto de fila de comandos que serializa execuções de resposta automática recebidas
title: Fila de comandos
x-i18n:
    generated_at: "2026-04-25T13:44:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c027be3e9a67f91a49c5d4d69fa8191d3e7651265a152c4723b10062b339f2a
    source_path: concepts/queue.md
    workflow: 15
---

Serializamos execuções de resposta automática recebidas (todos os canais) por meio de uma pequena fila em processo para evitar colisões entre múltiplas execuções do agente, ao mesmo tempo permitindo paralelismo seguro entre sessões.

## Por quê

- Execuções de resposta automática podem ser caras (chamadas de LLM) e podem colidir quando várias mensagens recebidas chegam em um intervalo curto.
- A serialização evita disputa por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a chance de limites de taxa upstream.

## Como funciona

- Uma fila FIFO sensível a lanes drena cada lane com um limite configurável de concorrência (padrão 1 para lanes não configuradas; `main` usa 4 por padrão e `subagent`, 8).
- `runEmbeddedPiAgent` enfileira por **chave de sessão** (lane `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Em seguida, cada execução da sessão é enfileirada em uma **lane global** (`main` por padrão), para que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o log detalhado está habilitado, execuções enfileiradas emitem um aviso curto se tiverem esperado mais de ~2s antes de começar.
- Indicadores de digitação ainda são acionados imediatamente ao entrar na fila (quando o canal oferece suporte), portanto a experiência do usuário não muda enquanto aguardamos nossa vez.

## Modos da fila (por canal)

Mensagens recebidas podem direcionar a execução atual, esperar por um turno de acompanhamento ou fazer ambos:

- `steer`: injeta imediatamente na execução atual (cancela chamadas de ferramenta pendentes após o próximo limite de ferramenta). Se não estiver em streaming, usa fallback para acompanhamento.
- `followup`: enfileira para o próximo turno do agente depois que a execução atual terminar.
- `collect`: agrupa todas as mensagens enfileiradas em um **único** turno de acompanhamento (padrão). Se mensagens tiverem como destino canais/threads diferentes, elas são drenadas individualmente para preservar o roteamento.
- `steer-backlog` (também conhecido como `steer+backlog`): direciona agora **e** preserva a mensagem para um turno de acompanhamento.
- `interrupt` (legado): aborta a execução ativa daquela sessão e então executa a mensagem mais recente.
- `queue` (alias legado): igual a `steer`.

`steer-backlog` significa que você pode receber uma resposta de acompanhamento após a execução direcionada, então superfícies com streaming podem parecer duplicadas. Prefira `collect`/`steer` se quiser uma resposta por mensagem recebida.
Envie `/queue collect` como comando independente (por sessão) ou defina `messages.queue.byChannel.discord: "collect"`.

Padrões (quando não definidos na configuração):

- Todas as superfícies → `collect`

Configure globalmente ou por canal via `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opções da fila

As opções se aplicam a `followup`, `collect` e `steer-backlog` (e a `steer` quando usa fallback para acompanhamento):

- `debounceMs`: espera por silêncio antes de iniciar um turno de acompanhamento (evita “continue, continue”).
- `cap`: máximo de mensagens enfileiradas por sessão.
- `drop`: política de overflow (`old`, `new`, `summarize`).

`Summarize` mantém uma lista curta em tópicos das mensagens descartadas e a injeta como um prompt sintético de acompanhamento.
Padrões: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Substituições por sessão

- Envie `/queue <mode>` como comando independente para armazenar o modo da sessão atual.
- As opções podem ser combinadas: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a substituição da sessão.

## Escopo e garantias

- Aplica-se a execuções do agente com resposta automática em todos os canais de entrada que usam o pipeline de resposta do gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat etc.).
- A lane padrão (`main`) é de todo o processo para entradas + Heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Lanes adicionais podem existir (por exemplo, `cron`, `subagent`), para que jobs em segundo plano possam executar em paralelo sem bloquear respostas recebidas. Essas execuções destacadas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).
- Lanes por sessão garantem que apenas uma execução do agente toque em uma sessão específica por vez.
- Sem dependências externas nem threads de worker em segundo plano; apenas TypeScript + promises.

## Solução de problemas

- Se comandos parecerem travados, habilite logs detalhados e procure linhas “queued for …ms” para confirmar que a fila está sendo drenada.
- Se você precisar da profundidade da fila, habilite logs detalhados e observe as linhas de temporização da fila.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Política de novas tentativas](/pt-BR/concepts/retry)
