---
read_when:
    - Alteração da execução ou da concorrência da resposta automática
    - Explicando os modos de /queue ou o comportamento de direcionamento de mensagens
summary: Modos da fila de resposta automática, padrões e substituições por sessão
title: Fila de comandos
x-i18n:
    generated_at: "2026-05-06T05:52:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

Serializamos execuções de resposta automática de entrada (todos os canais) por meio de uma pequena fila no próprio processo para impedir colisões entre múltiplas execuções de agente, enquanto ainda permitimos paralelismo seguro entre sessões.

## Por quê

- Execuções de resposta automática podem ser caras (chamadas de LLM) e podem colidir quando várias mensagens de entrada chegam muito próximas.
- A serialização evita competição por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a chance de limites de taxa upstream.

## Como funciona

- Uma fila FIFO ciente de lanes drena cada lane com um limite de concorrência configurável (padrão 1 para lanes não configuradas; main usa 4 por padrão, subagent usa 8).
- `runEmbeddedPiAgent` enfileira por **chave de sessão** (lane `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **lane global** (`main` por padrão), de modo que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o log detalhado está habilitado, execuções enfileiradas emitem um aviso curto se esperaram mais de ~2s antes de iniciar.
- Indicadores de digitação ainda disparam imediatamente ao enfileirar (quando suportados pelo canal), então a experiência do usuário não muda enquanto aguardamos nossa vez.

## Padrões

Quando não definido, todas as superfícies de canal de entrada usam:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` é o padrão porque mantém o turno do modelo ativo responsivo sem
iniciar uma segunda execução de sessão. Ele drena todas as mensagens de orientação que chegaram
antes do próximo limite do modelo. Se a execução atual não puder aceitar orientação,
o OpenClaw recorre a uma entrada de fila de acompanhamento.

## Modos da fila

Mensagens de entrada podem orientar a execução atual, aguardar um turno de acompanhamento ou fazer ambos:

- `steer`: enfileira mensagens de orientação no runtime ativo. O Pi entrega todas as mensagens de orientação pendentes **depois que o turno atual do assistente termina de executar suas chamadas de ferramenta**, antes da próxima chamada de LLM; o app-server do Codex recebe um `turn/steer` agrupado. Se a execução não estiver transmitindo ativamente ou a orientação estiver indisponível, o OpenClaw recorre a uma entrada de fila de acompanhamento.
- `queue` (legado): orientação antiga, uma por vez. O Pi entrega uma mensagem de orientação enfileirada em cada limite do modelo; o app-server do Codex recebe solicitações `turn/steer` separadas. Prefira `steer`, a menos que você precise do comportamento serializado anterior.
- `followup`: enfileira cada mensagem para um turno posterior do agente após o fim da execução atual.
- `collect`: combina mensagens enfileiradas em um **único** turno de acompanhamento após a janela de silêncio. Se as mensagens tiverem como destino canais/threads diferentes, elas são drenadas individualmente para preservar o roteamento.
- `steer-backlog` (também conhecido como `steer+backlog`): orienta agora **e** preserva a mesma mensagem para um turno de acompanhamento.
- `interrupt` (legado): interrompe a execução ativa dessa sessão e então executa a mensagem mais recente.

Steer-backlog significa que você pode receber uma resposta de acompanhamento após a execução orientada, então
superfícies de streaming podem parecer duplicadas. Prefira `collect`/`steer` se quiser
uma resposta por mensagem de entrada.

Para comportamento de tempo e dependência específico do runtime, consulte
[Fila de orientação](/pt-BR/concepts/queue-steering). Para o comando explícito `/steer <message>`,
consulte [Orientar](/pt-BR/tools/steer).

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

As opções se aplicam a `followup`, `collect` e `steer-backlog` (e a `steer` ou `queue` legado quando a orientação recorre a acompanhamento):

- `debounceMs`: janela de silêncio antes de drenar acompanhamentos enfileirados. Números simples são milissegundos; unidades `ms`, `s`, `m`, `h` e `d` são aceitas pelas opções de `/queue`.
- `cap`: máximo de mensagens enfileiradas por sessão. Valores abaixo de `1` são ignorados.
- `drop: "summarize"`: padrão. Descarta as entradas enfileiradas mais antigas conforme necessário, mantém resumos compactos e os injeta como um prompt sintético de acompanhamento.
- `drop: "old"`: descarta as entradas enfileiradas mais antigas conforme necessário, sem preservar resumos.
- `drop: "new"`: rejeita a mensagem mais recente quando a fila já está cheia.

Padrões: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedência

Para seleção de modo, o OpenClaw resolve:

1. Sobrescrita inline ou armazenada por sessão de `/queue`.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Padrão `steer`.

Para opções, opções inline ou armazenadas de `/queue` vencem a configuração. Em seguida,
debounce específico do canal (`messages.queue.debounceMsByChannel`), padrões de debounce do Plugin,
opções globais de `messages.queue` e padrões integrados são
aplicados. `cap` e `drop` são opções globais/de sessão, não chaves de configuração
por canal.

## Sobrescritas por sessão

- Envie `/queue <mode>` como um comando independente para armazenar o modo da sessão atual.
- As opções podem ser combinadas: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a sobrescrita da sessão.

## Escopo e garantias

- Aplica-se a execuções de agente de resposta automática em todos os canais de entrada que usam o pipeline de resposta do Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat etc.).
- A lane padrão (`main`) é compartilhada por todo o processo para entrada + heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Lanes adicionais podem existir (por exemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que tarefas em segundo plano possam executar em paralelo sem bloquear respostas de entrada. Turnos isolados de agente cron mantêm um slot `cron` enquanto sua execução interna de agente usa `cron-nested`; ambos usam `cron.maxConcurrentRuns`. Fluxos `nested` não cron compartilhados mantêm seu próprio comportamento de lane. Essas execuções destacadas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).
- Lanes por sessão garantem que apenas uma execução de agente toque em uma determinada sessão por vez.
- Sem dependências externas ou threads de worker em segundo plano; TypeScript puro + promises.

## Solução de problemas

- Se os comandos parecerem travados, habilite logs detalhados e procure linhas "queued for ...ms" para confirmar que a fila está drenando.
- Se você precisar da profundidade da fila, habilite logs detalhados e observe as linhas de tempo da fila.
- Execuções do app-server do Codex que aceitam um turno e depois param de emitir progresso são interrompidas pelo adaptador do Codex para que a lane da sessão ativa possa ser liberada em vez de aguardar o timeout da execução externa.
- Quando diagnósticos estão habilitados, sessões que permanecem em `processing` após `diagnostics.stuckSessionWarnMs` sem resposta, ferramenta, status, bloco ou progresso ACP observado são classificadas pela atividade atual. Trabalho ativo registra como `session.long_running`; trabalho ativo sem progresso recente registra como `session.stalled`; `session.stuck` é reservado para escrituração obsoleta de sessão sem trabalho ativo, e somente esse caminho pode liberar a lane de sessão afetada para que o trabalho enfileirado drene. Diagnósticos `session.stuck` repetidos recuam enquanto a sessão permanece inalterada.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Fila de orientação](/pt-BR/concepts/queue-steering)
- [Orientar](/pt-BR/tools/steer)
- [Política de nova tentativa](/pt-BR/concepts/retry)
