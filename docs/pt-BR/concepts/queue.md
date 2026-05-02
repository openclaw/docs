---
read_when:
    - Alterando a execução ou a concorrência da resposta automática
    - Explicando os modos de /queue ou o comportamento de direcionamento de mensagens
summary: Modos da fila de resposta automática, padrões e substituições por sessão
title: Fila de comandos
x-i18n:
    generated_at: "2026-05-02T05:45:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

Serializamos execuções de resposta automática recebidas (todos os canais) por uma pequena fila em processo para impedir colisões entre múltiplas execuções de agente, enquanto ainda permitimos paralelismo seguro entre sessões.

## Por quê

- Execuções de resposta automática podem ser caras (chamadas de LLM) e podem colidir quando várias mensagens recebidas chegam em intervalos próximos.
- A serialização evita competição por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a chance de limites de taxa upstream.

## Como funciona

- Uma fila FIFO ciente de faixas esvazia cada faixa com um limite de concorrência configurável (padrão 1 para faixas não configuradas; a principal usa 4 por padrão, subagente usa 8).
- `runEmbeddedPiAgent` enfileira por **chave de sessão** (faixa `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **faixa global** (`main` por padrão), para que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o registro detalhado está habilitado, execuções enfileiradas emitem um aviso curto se esperarem mais de ~2s antes de iniciar.
- Indicadores de digitação ainda disparam imediatamente no enfileiramento (quando o canal oferece suporte), então a experiência do usuário fica inalterada enquanto aguardamos nossa vez.

## Padrões

Quando não definido, todas as superfícies de canais recebidos usam:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` é o padrão porque mantém o turno do modelo ativo responsivo sem
iniciar uma segunda execução de sessão. Ele drena todas as mensagens de direcionamento que chegaram
antes do próximo limite do modelo. Se a execução atual não puder aceitar direcionamento,
o OpenClaw recorre a uma entrada de fila de acompanhamento.

## Modos de fila

Mensagens recebidas podem direcionar a execução atual, aguardar um turno de acompanhamento ou fazer ambos:

- `steer`: enfileira mensagens de direcionamento no runtime ativo. O Pi entrega todas as mensagens de direcionamento pendentes **depois que o turno atual do assistente termina de executar suas chamadas de ferramentas**, antes da próxima chamada de LLM; o app-server do Codex recebe um `turn/steer` em lote. Se a execução não estiver transmitindo ativamente ou o direcionamento estiver indisponível, o OpenClaw recorre a uma entrada de fila de acompanhamento.
- `queue` (legado): direcionamento antigo, um por vez. O Pi entrega uma mensagem de direcionamento enfileirada em cada limite do modelo; o app-server do Codex recebe solicitações `turn/steer` separadas. Prefira `steer`, a menos que você precise do comportamento serializado anterior.
- `followup`: enfileira cada mensagem para um turno posterior do agente depois que a execução atual termina.
- `collect`: combina mensagens enfileiradas em um **único** turno de acompanhamento após a janela de silêncio. Se as mensagens tiverem como destino canais/threads diferentes, elas são drenadas individualmente para preservar o roteamento.
- `steer-backlog` (também conhecido como `steer+backlog`): direciona agora **e** preserva a mesma mensagem para um turno de acompanhamento.
- `interrupt` (legado): aborta a execução ativa dessa sessão e depois executa a mensagem mais recente.

Steer-backlog significa que você pode receber uma resposta de acompanhamento depois da execução direcionada, então
superfícies de streaming podem parecer duplicadas. Prefira `collect`/`steer` se você quiser
uma resposta por mensagem recebida.

Para comportamento de temporização e dependência específico do runtime, consulte
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

As opções se aplicam a `followup`, `collect` e `steer-backlog` (e a `steer` ou `queue` legado quando o direcionamento recorre a acompanhamento):

- `debounceMs`: janela de silêncio antes de drenar acompanhamentos enfileirados. Números sem unidade são milissegundos; as unidades `ms`, `s`, `m`, `h` e `d` são aceitas pelas opções de `/queue`.
- `cap`: máximo de mensagens enfileiradas por sessão. Valores abaixo de `1` são ignorados.
- `drop: "summarize"`: padrão. Remove as entradas enfileiradas mais antigas conforme necessário, mantém resumos compactos e os injeta como um prompt sintético de acompanhamento.
- `drop: "old"`: remove as entradas enfileiradas mais antigas conforme necessário, sem preservar resumos.
- `drop: "new"`: rejeita a mensagem mais recente quando a fila já está cheia.

Padrões: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedência

Para seleção de modo, o OpenClaw resolve:

1. Substituição de `/queue` inline ou armazenada por sessão.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Padrão `steer`.

Para opções, opções de `/queue` inline ou armazenadas vencem a configuração. Depois,
são aplicados debounce específico do canal (`messages.queue.debounceMsByChannel`), padrões
de debounce do Plugin, opções globais de `messages.queue` e padrões integrados. `cap` e `drop` são opções globais/de sessão, não chaves
de configuração por canal.

## Substituições por sessão

- Envie `/queue <mode>` como um comando independente para armazenar o modo da sessão atual.
- Opções podem ser combinadas: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a substituição da sessão.

## Escopo e garantias

- Aplica-se a execuções de agentes de resposta automática em todos os canais recebidos que usam o pipeline de resposta do Gateway (web do WhatsApp, Telegram, Slack, Discord, Signal, iMessage, webchat etc.).
- A faixa padrão (`main`) é válida para todo o processo para mensagens recebidas + Heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Faixas adicionais podem existir (por exemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que trabalhos em segundo plano possam executar em paralelo sem bloquear respostas recebidas. Turnos isolados de agente Cron ocupam um slot `cron` enquanto a execução interna do agente usa `cron-nested`; ambos usam `cron.maxConcurrentRuns`. Fluxos `nested` não Cron compartilhados mantêm seu próprio comportamento de faixa. Essas execuções desacopladas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).
- Faixas por sessão garantem que apenas uma execução de agente toque em determinada sessão por vez.
- Sem dependências externas nem threads de worker em segundo plano; TypeScript puro + promises.

## Solução de problemas

- Se comandos parecerem travados, habilite logs detalhados e procure linhas “queued for …ms” para confirmar que a fila está drenando.
- Se você precisar da profundidade da fila, habilite logs detalhados e observe as linhas de temporização da fila.
- Execuções do app-server do Codex que aceitam um turno e depois param de emitir progresso são interrompidas pelo adaptador Codex, para que a faixa da sessão ativa possa ser liberada em vez de esperar pelo timeout da execução externa.
- Quando diagnósticos estão habilitados, sessões que permanecem em `processing` além de `diagnostics.stuckSessionWarnMs` sem resposta, ferramenta, status, bloco ou progresso ACP observado são classificadas pela atividade atual. Trabalho ativo é registrado como `session.long_running`; trabalho ativo sem progresso recente é registrado como `session.stalled`; `session.stuck` é reservado para bookkeeping de sessão obsoleto sem trabalho ativo, e somente esse caminho pode liberar a faixa de sessão afetada para que o trabalho enfileirado seja drenado. Diagnósticos `session.stuck` repetidos recuam enquanto a sessão permanecer inalterada.

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Fila de direcionamento](/pt-BR/concepts/queue-steering)
- [Política de nova tentativa](/pt-BR/concepts/retry)
