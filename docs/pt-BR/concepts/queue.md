---
read_when:
    - Alterando a execução ou a concorrência da resposta automática
    - Explicando os modos de /queue ou o comportamento de direcionamento de mensagens
summary: Modos de fila de resposta automática, padrões e substituições por sessão
title: Fila de comandos
x-i18n:
    generated_at: "2026-05-04T02:23:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

Serializamos execuções de resposta automática de entrada (todos os canais) por meio de uma pequena fila em processo para evitar colisões entre múltiplas execuções de agente, ainda permitindo paralelismo seguro entre sessões.

## Por quê

- Execuções de resposta automática podem ser caras (chamadas de LLM) e podem colidir quando várias mensagens de entrada chegam em sequência próxima.
- A serialização evita competição por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a chance de limites de taxa upstream.

## Como funciona

- Uma fila FIFO ciente de faixas drena cada faixa com um limite de concorrência configurável (padrão 1 para faixas não configuradas; `main` usa 4 por padrão, `subagent` usa 8).
- `runEmbeddedPiAgent` enfileira por **chave de sessão** (faixa `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **faixa global** (`main` por padrão), para que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o log detalhado está habilitado, execuções enfileiradas emitem um aviso curto se esperaram mais de ~2s antes de iniciar.
- Indicadores de digitação ainda disparam imediatamente ao enfileirar (quando compatível com o canal), então a experiência do usuário permanece inalterada enquanto aguardamos a vez.

## Padrões

Quando não configuradas, todas as superfícies de canal de entrada usam:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` é o padrão porque mantém a rodada ativa do modelo responsiva sem
iniciar uma segunda execução de sessão. Ele drena todas as mensagens de direcionamento que chegaram
antes do próximo limite do modelo. Se a execução atual não puder aceitar direcionamento,
o OpenClaw recorre a uma entrada de fila de acompanhamento.

## Modos de fila

Mensagens de entrada podem direcionar a execução atual, aguardar uma rodada de acompanhamento ou fazer ambos:

- `steer`: enfileira mensagens de direcionamento no runtime ativo. O Pi entrega todas as mensagens de direcionamento pendentes **depois que a rodada atual do assistente termina de executar suas chamadas de ferramenta**, antes da próxima chamada de LLM; o Codex app-server recebe um `turn/steer` em lote. Se a execução não estiver transmitindo ativamente ou o direcionamento estiver indisponível, o OpenClaw recorre a uma entrada de fila de acompanhamento.
- `queue` (legado): direcionamento antigo, um por vez. O Pi entrega uma mensagem de direcionamento enfileirada em cada limite do modelo; o Codex app-server recebe solicitações `turn/steer` separadas. Prefira `steer`, a menos que você precise do comportamento serializado anterior.
- `followup`: enfileira cada mensagem para uma rodada posterior do agente depois que a execução atual termina.
- `collect`: combina mensagens enfileiradas em uma **única** rodada de acompanhamento depois da janela de silêncio. Se as mensagens tiverem como destino canais/threads diferentes, elas são drenadas individualmente para preservar o roteamento.
- `steer-backlog` (também conhecido como `steer+backlog`): direciona agora **e** preserva a mesma mensagem para uma rodada de acompanhamento.
- `interrupt` (legado): aborta a execução ativa dessa sessão e então executa a mensagem mais recente.

Steer-backlog significa que você pode receber uma resposta de acompanhamento após a execução direcionada, então
superfícies de streaming podem parecer duplicadas. Prefira `collect`/`steer` se quiser
uma resposta por mensagem de entrada.

Para comportamento de temporização e dependências específico do runtime, consulte
[Fila de direcionamento](/pt-BR/concepts/queue-steering). Para o comando explícito `/steer <message>`,
consulte [Direcionar](/tools/steer).

Configure globalmente ou por canal via `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opções da fila

As opções se aplicam a `followup`, `collect` e `steer-backlog` (e a `steer` ou ao `queue` legado quando o direcionamento recorre a acompanhamento):

- `debounceMs`: janela de silêncio antes de drenar acompanhamentos enfileirados. Números puros são milissegundos; as unidades `ms`, `s`, `m`, `h` e `d` são aceitas pelas opções de `/queue`.
- `cap`: máximo de mensagens enfileiradas por sessão. Valores abaixo de `1` são ignorados.
- `drop: "summarize"`: padrão. Descarta as entradas enfileiradas mais antigas conforme necessário, mantém resumos compactos e os injeta como um prompt de acompanhamento sintético.
- `drop: "old"`: descarta as entradas enfileiradas mais antigas conforme necessário, sem preservar resumos.
- `drop: "new"`: rejeita a mensagem mais recente quando a fila já está cheia.

Padrões: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedência

Para seleção de modo, o OpenClaw resolve:

1. Sobrescrita `/queue` inline ou armazenada por sessão.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` padrão.

Para opções, opções `/queue` inline ou armazenadas vencem a configuração. Em seguida,
são aplicados o debounce específico do canal (`messages.queue.debounceMsByChannel`), os
padrões de debounce de Plugin, as opções globais de `messages.queue` e os padrões
integrados. `cap` e `drop` são opções globais/de sessão, não chaves de configuração
por canal.

## Sobrescritas por sessão

- Envie `/queue <mode>` como um comando independente para armazenar o modo da sessão atual.
- As opções podem ser combinadas: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a sobrescrita da sessão.

## Escopo e garantias

- Aplica-se a execuções de agente de resposta automática em todos os canais de entrada que usam o pipeline de resposta do Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat etc.).
- A faixa padrão (`main`) é de todo o processo para entrada + heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Faixas adicionais podem existir (por exemplo, `cron`, `cron-nested`, `nested`, `subagent`), para que tarefas em segundo plano possam executar em paralelo sem bloquear respostas de entrada. Rodadas isoladas de agente cron mantêm um slot `cron` enquanto sua execução interna de agente usa `cron-nested`; ambas usam `cron.maxConcurrentRuns`. Fluxos `nested` não cron compartilhados mantêm seu próprio comportamento de faixa. Essas execuções destacadas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).
- Faixas por sessão garantem que apenas uma execução de agente toque uma determinada sessão por vez.
- Sem dependências externas ou threads de worker em segundo plano; TypeScript puro + promises.

## Solução de problemas

- Se comandos parecerem travados, habilite logs detalhados e procure linhas “queued for …ms” para confirmar que a fila está drenando.
- Se você precisar da profundidade da fila, habilite logs detalhados e observe as linhas de temporização da fila.
- Execuções do Codex app-server que aceitam uma rodada e então param de emitir progresso são interrompidas pelo adaptador do Codex para que a faixa da sessão ativa possa ser liberada em vez de aguardar o timeout da execução externa.
- Quando diagnósticos estão habilitados, sessões que permanecem em `processing` além de `diagnostics.stuckSessionWarnMs` sem resposta, ferramenta, status, bloco ou progresso ACP observado são classificadas pela atividade atual. Trabalho ativo registra log como `session.long_running`; trabalho ativo sem progresso recente registra log como `session.stalled`; `session.stuck` é reservado para bookkeeping de sessão obsoleta sem trabalho ativo, e apenas esse caminho pode liberar a faixa da sessão afetada para que o trabalho enfileirado seja drenado. Diagnósticos `session.stuck` repetidos fazem backoff enquanto a sessão permanece inalterada.

## Relacionados

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Fila de direcionamento](/pt-BR/concepts/queue-steering)
- [Direcionar](/tools/steer)
- [Política de repetição](/pt-BR/concepts/retry)
