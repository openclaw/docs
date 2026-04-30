---
read_when:
    - Alterando a execução ou a concorrência da resposta automática
    - Explicando os modos de /queue ou o comportamento de direcionamento de mensagens
summary: Modos, padrões e substituições por sessão da fila de resposta automática
title: Fila de comandos
x-i18n:
    generated_at: "2026-04-30T09:46:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

Serializamos execuções de resposta automática recebidas (todos os canais) por meio de uma pequena fila em processo para impedir que várias execuções do agente colidam, enquanto ainda permitimos paralelismo seguro entre sessões.

## Por quê

- Execuções de resposta automática podem ser caras (chamadas LLM) e podem colidir quando várias mensagens recebidas chegam muito próximas umas das outras.
- A serialização evita competição por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a chance de limites de taxa do upstream.

## Como funciona

- Uma fila FIFO ciente de lane drena cada lane com um limite de concorrência configurável (padrão 1 para lanes não configuradas; main usa 4 por padrão, subagent usa 8).
- `runEmbeddedPiAgent` enfileira por **chave de sessão** (lane `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **lane global** (`main` por padrão), para que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o registro em log detalhado está ativado, execuções enfileiradas emitem um aviso curto se aguardarem mais de ~2s antes de começar.
- Indicadores de digitação ainda disparam imediatamente ao enfileirar (quando compatíveis com o canal), então a experiência do usuário permanece inalterada enquanto aguardamos nossa vez.

## Padrões

Quando não definido, todas as superfícies de canal de entrada usam:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` é o padrão porque mantém o turno do modelo ativo responsivo sem
iniciar uma segunda execução de sessão. Ele drena todas as mensagens de steering que chegaram
antes do próximo limite do modelo. Se a execução atual não puder aceitar steering,
o OpenClaw recorre a uma entrada de fila de followup.

## Modos de fila

Mensagens recebidas podem orientar a execução atual, aguardar um turno de followup ou fazer ambos:

- `steer`: enfileira mensagens de steering no runtime ativo. Pi entrega todas as mensagens de steering pendentes **depois que o turno atual do assistente termina de executar suas chamadas de ferramentas**, antes da próxima chamada LLM; o app-server do Codex recebe um `turn/steer` em lote. Se a execução não estiver transmitindo ativamente ou se steering não estiver disponível, o OpenClaw recorre a uma entrada de fila de followup.
- `queue` (legado): steering antigo, uma por vez. Pi entrega uma mensagem de steering enfileirada em cada limite do modelo; o app-server do Codex recebe solicitações `turn/steer` separadas. Prefira `steer`, a menos que você precise do comportamento serializado anterior.
- `followup`: enfileira cada mensagem para um turno posterior do agente depois que a execução atual termina.
- `collect`: combina mensagens enfileiradas em um **único** turno de followup depois da janela de silêncio. Se as mensagens tiverem como alvo canais/threads diferentes, elas drenam individualmente para preservar o roteamento.
- `steer-backlog` (também conhecido como `steer+backlog`): orienta agora **e** preserva a mesma mensagem para um turno de followup.
- `interrupt` (legado): aborta a execução ativa dessa sessão e então executa a mensagem mais recente.

Steer-backlog significa que você pode receber uma resposta de followup após a execução orientada, então
superfícies de streaming podem parecer duplicadas. Prefira `collect`/`steer` se você quiser
uma resposta por mensagem recebida.

Para comportamento de temporização e dependências específico do runtime, consulte
[Fila de steering](/pt-BR/concepts/queue-steering).

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

As opções se aplicam a `followup`, `collect` e `steer-backlog` (e a `steer` ou ao `queue` legado quando steering recorre a followup):

- `debounceMs`: janela de silêncio antes de drenar followups enfileirados. Números simples são milissegundos; as unidades `ms`, `s`, `m`, `h` e `d` são aceitas pelas opções de `/queue`.
- `cap`: máximo de mensagens enfileiradas por sessão. Valores abaixo de `1` são ignorados.
- `drop: "summarize"`: padrão. Descarta as entradas enfileiradas mais antigas conforme necessário, mantém resumos compactos e os injeta como um prompt de followup sintético.
- `drop: "old"`: descarta as entradas enfileiradas mais antigas conforme necessário, sem preservar resumos.
- `drop: "new"`: rejeita a mensagem mais recente quando a fila já está cheia.

Padrões: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedência

Para seleção de modo, o OpenClaw resolve:

1. Substituição `/queue` inline ou armazenada por sessão.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` padrão.

Para opções, opções `/queue` inline ou armazenadas têm precedência sobre a configuração. Em seguida,
debounce específico do canal (`messages.queue.debounceMsByChannel`), padrões de debounce de Plugin,
opções globais de `messages.queue` e padrões integrados são aplicados. `cap` e `drop` são opções globais/de sessão, não chaves de configuração por canal.

## Substituições por sessão

- Envie `/queue <mode>` como um comando independente para armazenar o modo da sessão atual.
- As opções podem ser combinadas: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a substituição da sessão.

## Escopo e garantias

- Aplica-se a execuções de agente de resposta automática em todos os canais de entrada que usam o pipeline de resposta do Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat etc.).
- A lane padrão (`main`) é de todo o processo para entradas + Heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Lanes adicionais podem existir (por exemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que jobs em segundo plano possam executar em paralelo sem bloquear respostas recebidas. Turnos de agente cron isolados mantêm um slot `cron` enquanto a execução interna do agente usa `cron-nested`; ambos usam `cron.maxConcurrentRuns`. Fluxos `nested` não cron compartilhados mantêm seu próprio comportamento de lane. Essas execuções desvinculadas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).
- Lanes por sessão garantem que apenas uma execução de agente toque uma determinada sessão por vez.
- Sem dependências externas ou threads de worker em segundo plano; TypeScript puro + promises.

## Solução de problemas

- Se comandos parecerem travados, ative logs detalhados e procure linhas “queued for …ms” para confirmar que a fila está drenando.
- Se você precisar da profundidade da fila, ative logs detalhados e observe as linhas de temporização da fila.
- Quando diagnósticos estão ativados, sessões que permanecem em `processing` além de `diagnostics.stuckSessionWarnMs` registram um aviso de sessão travada. Execuções incorporadas ativas, operações de resposta ativas e tarefas de lane ativas permanecem apenas como aviso por padrão; contabilidade de inicialização obsoleta sem trabalho de sessão ativo pode liberar a lane da sessão afetada para que o trabalho enfileirado drene.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Fila de steering](/pt-BR/concepts/queue-steering)
- [Política de repetição](/pt-BR/concepts/retry)
