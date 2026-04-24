---
read_when:
    - Alterando execução automática de respostas ou concorrência
summary: Projeto da fila de comandos que serializa execuções de resposta automática de entrada
title: Fila de comandos
x-i18n:
    generated_at: "2026-04-24T05:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# Fila de comandos (2026-01-16)

Serializamos execuções automáticas de resposta de entrada (todos os canais) por meio de uma pequena fila em processo para evitar colisões entre várias execuções de agentes, ao mesmo tempo em que ainda permitimos paralelismo seguro entre sessões.

## Por quê

- Execuções automáticas de resposta podem ser caras (chamadas de LLM) e podem colidir quando várias mensagens de entrada chegam em intervalos curtos.
- A serialização evita competição por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a chance de limites de taxa upstream.

## Como funciona

- Uma fila FIFO consciente de lanes drena cada lane com um limite configurável de concorrência (padrão 1 para lanes não configuradas; `main` usa padrão 4 e `subagent` usa 8).
- `runEmbeddedPiAgent` enfileira por **chave de sessão** (lane `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **lane global** (`main` por padrão) para que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o log detalhado está ativado, execuções enfileiradas emitem um aviso curto se aguardaram mais de ~2s antes de iniciar.
- Indicadores de digitação ainda disparam imediatamente ao enfileirar (quando compatíveis com o canal), então a experiência do usuário permanece inalterada enquanto aguardamos nossa vez.

## Modos de fila (por canal)

Mensagens de entrada podem direcionar a execução atual, aguardar um turno de acompanhamento ou fazer ambos:

- `steer`: injeta imediatamente na execução atual (cancela chamadas de ferramenta pendentes após o próximo limite de ferramenta). Se não estiver em streaming, recorre a followup.
- `followup`: enfileira para o próximo turno do agente depois que a execução atual terminar.
- `collect`: consolida todas as mensagens enfileiradas em **um único** turno de acompanhamento (padrão). Se as mensagens tiverem como alvo canais/threads diferentes, elas serão drenadas individualmente para preservar o roteamento.
- `steer-backlog` (também conhecido como `steer+backlog`): direciona agora **e** preserva a mensagem para um turno de acompanhamento.
- `interrupt` (legado): aborta a execução ativa dessa sessão e depois executa a mensagem mais recente.
- `queue` (alias legado): igual a `steer`.

Steer-backlog significa que você pode receber uma resposta de acompanhamento após a execução direcionada, então
superfícies com streaming podem parecer duplicadas. Prefira `collect`/`steer` se quiser
uma resposta por mensagem de entrada.
Envie `/queue collect` como um comando isolado (por sessão) ou defina `messages.queue.byChannel.discord: "collect"`.

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

As opções se aplicam a `followup`, `collect` e `steer-backlog` (e a `steer` quando ele recorre a followup):

- `debounceMs`: espera silêncio antes de iniciar um turno de acompanhamento (evita “continue, continue”).
- `cap`: máximo de mensagens enfileiradas por sessão.
- `drop`: política de overflow (`old`, `new`, `summarize`).

Summarize mantém uma lista curta em tópicos das mensagens descartadas e a injeta como um prompt sintético de acompanhamento.
Padrões: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Substituições por sessão

- Envie `/queue <mode>` como um comando isolado para armazenar o modo da sessão atual.
- As opções podem ser combinadas: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a substituição da sessão.

## Escopo e garantias

- Aplica-se a execuções de agentes de resposta automática em todos os canais de entrada que usam o pipeline de resposta do gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat etc.).
- A lane padrão (`main`) é de todo o processo para entrada + heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Lanes adicionais podem existir (por exemplo, `cron`, `subagent`) para que trabalhos em segundo plano possam ser executados em paralelo sem bloquear respostas de entrada. Essas execuções desacopladas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).
- Lanes por sessão garantem que apenas uma execução de agente toque uma determinada sessão por vez.
- Sem dependências externas nem threads de worker em segundo plano; TypeScript puro + promises.

## Solução de problemas

- Se os comandos parecerem travados, habilite logs detalhados e procure linhas “queued for …ms” para confirmar que a fila está sendo drenada.
- Se você precisar da profundidade da fila, habilite logs detalhados e observe as linhas de tempo da fila.

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Política de retry](/pt-BR/concepts/retry)
