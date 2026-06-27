---
read_when:
    - Alterar a execução ou a concorrência da resposta automática
    - Explicando modos de /queue ou comportamento de direcionamento de mensagens
summary: Modos da fila de resposta automática, padrões e substituições por sessão
title: Fila de comandos
x-i18n:
    generated_at: "2026-06-27T17:26:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

Serializamos execuções de resposta automática de entrada (todos os canais) por meio de uma pequena fila em processo para impedir que várias execuções de agente colidam, ainda permitindo paralelismo seguro entre sessões.

## Por quê

- Execuções de resposta automática podem ser caras (chamadas de LLM) e podem colidir quando várias mensagens de entrada chegam muito próximas.
- A serialização evita disputa por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a chance de limites de taxa upstream.

## Como funciona

- Uma fila FIFO ciente de lanes esvazia cada lane com um limite de concorrência configurável (padrão 1 para lanes não configuradas; main usa 4 por padrão, subagent usa 8).
- `runEmbeddedAgent` enfileira por **chave de sessão** (lane `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **lane global** (`main` por padrão), de modo que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o logging verboso está ativado, execuções enfileiradas emitem um aviso curto se esperarem mais de ~2s antes de iniciar.
- Indicadores de digitação ainda disparam imediatamente ao enfileirar (quando compatíveis com o canal), portanto a experiência do usuário permanece inalterada enquanto aguardamos nossa vez.

## Padrões

Quando não definido, todas as superfícies de canal de entrada usam:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

O direcionamento no mesmo turno é o padrão. Um prompt que chega no meio da execução é injetado
no runtime ativo quando a execução pode aceitar direcionamento, então nenhuma segunda execução
de sessão é iniciada. Se a execução ativa não puder aceitar direcionamento, o OpenClaw espera a
execução ativa terminar antes de iniciar o prompt.

## Modos de fila

`/queue` controla o que mensagens de entrada normais fazem enquanto uma sessão já tem
uma execução ativa:

- `steer`: injeta mensagens no runtime ativo. O OpenClaw entrega todas as mensagens de direcionamento pendentes **depois que o turno atual do assistente termina de executar suas chamadas de ferramenta**, antes da próxima chamada de LLM; o app-server do Codex recebe um `turn/steer` em lote. Se a execução não estiver transmitindo ativamente ou se o direcionamento estiver indisponível, o OpenClaw espera até que a execução ativa termine antes de iniciar o prompt.
- `followup`: não direciona. Enfileira cada mensagem para um turno posterior do agente depois que a execução atual termina.
- `collect`: não direciona. Agrupa mensagens enfileiradas em um **único** turno de acompanhamento após a janela de silêncio. Se as mensagens apontarem para canais/threads diferentes, elas são esvaziadas individualmente para preservar o roteamento.
- `interrupt`: aborta a execução ativa dessa sessão e então executa a mensagem mais recente.

Para comportamento de timing e dependência específico do runtime, consulte
[Fila de direcionamento](/pt-BR/concepts/queue-steering). Para o comando explícito `/steer <message>`,
consulte [Direcionar](/pt-BR/tools/steer).

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

## Opções de fila

As opções se aplicam à entrega enfileirada. `debounceMs` também define a
janela de silêncio de direcionamento do Codex no modo `steer`:

- `debounceMs`: janela de silêncio antes de esvaziar acompanhamentos enfileirados ou lotes collect; no modo `steer` do Codex, janela de silêncio antes de enviar `turn/steer` em lote. Números simples são milissegundos; as unidades `ms`, `s`, `m`, `h` e `d` são aceitas por opções de `/queue`.
- `cap`: máximo de mensagens enfileiradas por sessão. Valores abaixo de `1` são ignorados.
- `drop: "summarize"`: padrão. Descarta as entradas enfileiradas mais antigas conforme necessário, mantém resumos compactos e os injeta como um prompt sintético de acompanhamento.
- `drop: "old"`: descarta as entradas enfileiradas mais antigas conforme necessário, sem preservar resumos.
- `drop: "new"`: rejeita a mensagem mais recente quando a fila já está cheia.

Padrões: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Direcionamento e streaming

Quando o streaming do canal é `partial` ou `block`, o direcionamento pode parecer várias
respostas visíveis curtas enquanto a execução ativa alcança limites do runtime:

- `partial`: a prévia pode finalizar cedo e então uma nova prévia começa depois que
  o direcionamento é aceito.
- `block`: blocos do tamanho de rascunho podem criar a mesma aparência sequencial.
- Sem streaming, o direcionamento recai para um acompanhamento após a execução ativa quando
  o runtime não consegue aceitar direcionamento no mesmo turno.

`steer` não aborta ferramentas em andamento. Use `/queue interrupt` quando a mensagem
mais recente deve abortar a execução atual.

## Precedência

Para seleção de modo, o OpenClaw resolve:

1. Sobrescrita de `/queue` inline ou armazenada por sessão.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` padrão.

Para opções, opções inline ou armazenadas de `/queue` têm precedência sobre a configuração. Em seguida,
são aplicados debounce específico por canal (`messages.queue.debounceMsByChannel`), padrões de
debounce do Plugin, opções globais de `messages.queue` e padrões integrados.
`cap` e `drop` são opções globais/de sessão, não chaves de configuração por canal.

## Sobrescritas por sessão

- Envie `/queue <steer|followup|collect|interrupt>` como um comando independente para armazenar o modo de fila da sessão atual.
- Opções podem ser combinadas: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a sobrescrita da sessão.

## Escopo e garantias

- Aplica-se a execuções de agente de resposta automática em todos os canais de entrada que usam o pipeline de resposta do Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- A lane padrão (`main`) é ampla ao processo para entradas + heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Lanes adicionais podem existir (por exemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que trabalhos em segundo plano possam executar em paralelo sem bloquear respostas de entrada. Turnos isolados de agente cron seguram um slot `cron` enquanto sua execução interna de agente usa `cron-nested`; ambos usam `cron.maxConcurrentRuns`. Fluxos compartilhados não cron `nested` mantêm seu próprio comportamento de lane. Essas execuções desvinculadas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).
- Lanes por sessão garantem que apenas uma execução de agente toque uma determinada sessão por vez.
- Sem dependências externas ou threads de worker em segundo plano; TypeScript puro + promises.

## Solução de problemas

- Se os comandos parecerem travados, ative logs verbosos e procure linhas "queued for ...ms" para confirmar que a fila está sendo esvaziada.
- Se você precisar da profundidade da fila, ative logs verbosos e observe as linhas de timing da fila.
- Execuções do app-server do Codex que aceitam um turno e então param de emitir progresso são interrompidas pelo adaptador do Codex para que a lane de sessão ativa possa ser liberada em vez de esperar pelo timeout da execução externa.
- Quando diagnósticos estão ativados, sessões que permanecem em `processing` além de `diagnostics.stuckSessionWarnMs` sem resposta, ferramenta, status, bloco ou progresso ACP observado são classificadas pela atividade atual. Trabalho ativo é registrado como `session.long_running`; chamadas de modelo silenciosas com proprietário também permanecem `session.long_running` até `diagnostics.stuckSessionAbortMs`, para que provedores lentos ou sem streaming não sejam reportados como parados cedo demais. Trabalho ativo sem progresso recente é registrado como `session.stalled`; chamadas de modelo com proprietário mudam para `session.stalled` no ou após o limite de abort, e atividade antiga de modelo/ferramenta sem proprietário não é ocultada como longa execução. `session.stuck` é reservado para bookkeeping recuperável de sessão antiga, incluindo sessões enfileiradas ociosas com atividade antiga de modelo/ferramenta sem proprietário, e somente esse caminho pode liberar a lane da sessão afetada para que o trabalho enfileirado seja esvaziado. Diagnósticos `session.stuck` repetidos fazem backoff enquanto a sessão permanece inalterada.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Fila de direcionamento](/pt-BR/concepts/queue-steering)
- [Direcionar](/pt-BR/tools/steer)
- [Política de repetição](/pt-BR/concepts/retry)
