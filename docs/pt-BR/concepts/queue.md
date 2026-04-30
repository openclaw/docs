---
read_when:
    - Alterando a execução ou a concorrência da resposta automática
    - Explicando os modos de /queue ou o comportamento de direcionamento de mensagens
summary: Modos da fila de resposta automática, padrões e sobrescrições por sessão
title: Fila de comandos
x-i18n:
    generated_at: "2026-04-30T18:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

Serializamos execuções de resposta automática de entrada (todos os canais) por meio de uma pequena fila em processo para evitar colisões entre várias execuções de agente, ainda permitindo paralelismo seguro entre sessões.

## Por quê

- Execuções de resposta automática podem ser caras (chamadas de LLM) e podem colidir quando várias mensagens de entrada chegam em sequência rápida.
- A serialização evita competição por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a chance de limites de taxa upstream.

## Como funciona

- Uma fila FIFO ciente de faixas drena cada faixa com um limite de concorrência configurável (padrão 1 para faixas não configuradas; main usa 4 por padrão, subagent usa 8).
- `runEmbeddedPiAgent` enfileira por **chave de sessão** (faixa `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **faixa global** (`main` por padrão), de modo que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o registro detalhado está ativado, execuções enfileiradas emitem um breve aviso se esperaram mais de ~2s antes de iniciar.
- Indicadores de digitação ainda disparam imediatamente ao enfileirar (quando o canal oferece suporte), então a experiência do usuário não muda enquanto aguardamos nossa vez.

## Padrões

Quando não definido, todas as superfícies de canal de entrada usam:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` é o padrão porque mantém o turno do modelo ativo responsivo sem
iniciar uma segunda execução de sessão. Ele drena todas as mensagens de direcionamento que chegaram
antes do próximo limite do modelo. Se a execução atual não puder aceitar direcionamento,
o OpenClaw recorre a uma entrada de fila de acompanhamento.

## Modos de fila

Mensagens de entrada podem direcionar a execução atual, aguardar um turno de acompanhamento ou fazer ambos:

- `steer`: enfileira mensagens de direcionamento no runtime ativo. O Pi entrega todas as mensagens de direcionamento pendentes **depois que o turno atual do assistente termina de executar suas chamadas de ferramentas**, antes da próxima chamada de LLM; o app-server do Codex recebe um `turn/steer` em lote. Se a execução não estiver transmitindo ativamente ou o direcionamento não estiver disponível, o OpenClaw recorre a uma entrada de fila de acompanhamento.
- `queue` (legado): direcionamento antigo, um por vez. O Pi entrega uma mensagem de direcionamento enfileirada em cada limite do modelo; o app-server do Codex recebe solicitações `turn/steer` separadas. Prefira `steer`, a menos que você precise do comportamento serializado anterior.
- `followup`: enfileira cada mensagem para um turno de agente posterior, depois que a execução atual termina.
- `collect`: agrega mensagens enfileiradas em um **único** turno de acompanhamento após a janela silenciosa. Se as mensagens tiverem como alvo canais/threads diferentes, elas drenam individualmente para preservar o roteamento.
- `steer-backlog` (também conhecido como `steer+backlog`): direciona agora **e** preserva a mesma mensagem para um turno de acompanhamento.
- `interrupt` (legado): interrompe a execução ativa dessa sessão e então executa a mensagem mais recente.

Steer-backlog significa que você pode receber uma resposta de acompanhamento depois da execução direcionada, então
superfícies de streaming podem parecer duplicadas. Prefira `collect`/`steer` se quiser
uma resposta por mensagem de entrada.

Para comportamento de temporização e dependências específico do runtime, consulte
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

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

As opções se aplicam a `followup`, `collect` e `steer-backlog` (e a `steer` ou ao `queue` legado quando o direcionamento recorre a acompanhamento):

- `debounceMs`: janela silenciosa antes de drenar acompanhamentos enfileirados. Números simples são milissegundos; as unidades `ms`, `s`, `m`, `h` e `d` são aceitas pelas opções de `/queue`.
- `cap`: máximo de mensagens enfileiradas por sessão. Valores abaixo de `1` são ignorados.
- `drop: "summarize"`: padrão. Descarta as entradas enfileiradas mais antigas conforme necessário, mantém resumos compactos e os injeta como um prompt sintético de acompanhamento.
- `drop: "old"`: descarta as entradas enfileiradas mais antigas conforme necessário, sem preservar resumos.
- `drop: "new"`: rejeita a mensagem mais recente quando a fila já está cheia.

Padrões: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedência

Para seleção de modo, o OpenClaw resolve:

1. Substituição inline ou armazenada de `/queue` por sessão.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` padrão.

Para opções, opções inline ou armazenadas de `/queue` vencem a configuração. Em seguida,
são aplicados debounce específico do canal (`messages.queue.debounceMsByChannel`), padrões
de debounce de Plugin, opções globais de `messages.queue` e padrões integrados.
`cap` e `drop` são opções globais/de sessão, não chaves de configuração por canal.

## Substituições por sessão

- Envie `/queue <mode>` como um comando autônomo para armazenar o modo da sessão atual.
- Opções podem ser combinadas: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a substituição da sessão.

## Escopo e garantias

- Aplica-se a execuções de agente de resposta automática em todos os canais de entrada que usam o pipeline de resposta do Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat etc.).
- A faixa padrão (`main`) é ampla ao processo para entradas + Heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Faixas adicionais podem existir (por exemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que trabalhos em segundo plano possam rodar em paralelo sem bloquear respostas de entrada. Turnos isolados de agente Cron ocupam um slot `cron` enquanto sua execução interna de agente usa `cron-nested`; ambos usam `cron.maxConcurrentRuns`. Fluxos `nested` compartilhados não Cron mantêm seu próprio comportamento de faixa. Essas execuções destacadas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).
- Faixas por sessão garantem que apenas uma execução de agente toque uma determinada sessão por vez.
- Sem dependências externas ou threads de worker em segundo plano; TypeScript puro + promises.

## Solução de problemas

- Se os comandos parecem travados, ative logs detalhados e procure linhas “queued for …ms” para confirmar que a fila está drenando.
- Se precisar da profundidade da fila, ative logs detalhados e observe as linhas de temporização da fila.
- Execuções do app-server do Codex que aceitam um turno e então param de emitir progresso são interrompidas pelo adaptador do Codex para que a faixa da sessão ativa possa ser liberada em vez de aguardar o timeout da execução externa.
- Quando diagnósticos estão ativados, sessões que permanecem em `processing` além de `diagnostics.stuckSessionWarnMs` registram um aviso de sessão travada. Execuções incorporadas ativas, operações de resposta ativas e tarefas de faixa ativas permanecem apenas como aviso por padrão; contabilidade de inicialização obsoleta sem trabalho de sessão ativo pode liberar a faixa de sessão afetada para que o trabalho enfileirado drene.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Fila de direcionamento](/pt-BR/concepts/queue-steering)
- [Política de repetição](/pt-BR/concepts/retry)
