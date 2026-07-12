---
read_when:
    - Alteração da execução ou da simultaneidade das respostas automáticas
    - Explicação dos modos de /queue ou do comportamento de direcionamento de mensagens
summary: Modos da fila de resposta automática, valores padrão e substituições por sessão
title: Fila de comandos
x-i18n:
    generated_at: "2026-07-12T15:06:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

O OpenClaw serializa as execuções de resposta automática recebidas (em todos os canais) por meio de uma pequena fila em processo para evitar colisões entre várias execuções de agentes, enquanto ainda permite paralelismo seguro entre sessões.

## Por quê

- As execuções de resposta automática podem ser dispendiosas (chamadas ao LLM) e podem colidir quando várias mensagens recebidas chegam em intervalos curtos.
- A serialização evita a disputa por recursos compartilhados (arquivos de sessão, logs, stdin da CLI) e reduz a possibilidade de limites de taxa dos serviços upstream.

## Como funciona

- Uma fila FIFO com reconhecimento de faixas esvazia cada faixa com um limite de simultaneidade configurável (padrão de 1 para faixas não configuradas; `main` tem padrão 4 e `subagent`, 8).
- `runEmbeddedAgent` enfileira pela **chave da sessão** (faixa `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **faixa global** (`main` por padrão), para que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o registro detalhado está ativado, as execuções enfileiradas emitem um aviso breve caso aguardem mais de ~2s antes de começar.
- Os indicadores de digitação ainda são acionados imediatamente ao enfileirar (quando compatíveis com o canal), portanto, a experiência do usuário permanece inalterada enquanto a execução aguarda sua vez.

## Padrões

Quando não definido, todas as superfícies de canais de entrada usam:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

O direcionamento no mesmo turno é o padrão. Um prompt que chega durante uma execução é injetado no runtime ativo quando a execução pode aceitar direcionamento, portanto, nenhuma segunda execução de sessão é iniciada. Se a execução ativa não puder aceitar direcionamento, o OpenClaw aguardará sua conclusão antes de iniciar o prompt.

## Modos da fila

`/queue` controla o que as mensagens recebidas normais fazem enquanto uma sessão já tem uma execução ativa:

- `steer`: injeta mensagens no runtime ativo. O OpenClaw entrega todas as mensagens de direcionamento pendentes **depois que o turno atual do assistente termina de executar suas chamadas de ferramentas**, antes da próxima chamada ao LLM; o servidor de aplicativo do Codex recebe um único `turn/steer` em lote. Se a execução não estiver transmitindo ativamente ou o direcionamento não estiver disponível, o OpenClaw aguardará o término da execução ativa antes de iniciar o prompt.
- `followup`: não direciona. Enfileira cada mensagem para um turno posterior do agente após o término da execução atual.
- `collect`: não direciona. Agrupa as mensagens enfileiradas em um **único** turno de acompanhamento após a janela de inatividade. Se as mensagens tiverem como destino canais/threads diferentes, elas serão processadas individualmente para preservar o roteamento.
- `interrupt`: interrompe a execução ativa dessa sessão e, em seguida, executa a mensagem mais recente.

Para saber mais sobre temporização específica do runtime e comportamento das dependências, consulte [Fila de direcionamento](/pt-BR/concepts/queue-steering). Para o comando explícito `/steer <message>`, consulte [Direcionar](/pt-BR/tools/steer).

Configure globalmente ou por canal usando `messages.queue`:

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

As opções se aplicam à entrega enfileirada. `debounceMs` também define a janela de inatividade do direcionamento do Codex no modo `steer`:

- `debounceMs`: janela de inatividade antes de processar acompanhamentos enfileirados ou lotes agrupados; no modo `steer` do Codex, janela de inatividade antes de enviar `turn/steer` em lote. Números sem unidade representam milissegundos; as unidades `ms`, `s`, `m`, `h` e `d` são aceitas pelas opções de `/queue`.
- `cap`: quantidade máxima de mensagens enfileiradas por sessão. Valores inferiores a `1` são ignorados.
- `drop: "summarize"` (padrão): descarta as entradas enfileiradas mais antigas conforme necessário, mantém resumos compactos e os injeta como um prompt sintético de acompanhamento.
- `drop: "old"`: descarta as entradas enfileiradas mais antigas conforme necessário, sem preservar resumos.
- `drop: "new"`: rejeita a mensagem mais recente quando a fila já está cheia.

Padrões: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Direcionamento e streaming

Quando o streaming do canal é `partial` ou `block`, o direcionamento pode aparecer como várias respostas curtas visíveis enquanto a execução ativa alcança os limites do runtime:

- `partial`: a prévia pode ser finalizada antecipadamente e, então, uma nova prévia começa após o direcionamento ser aceito.
- `block`: blocos do tamanho de rascunhos podem criar a mesma aparência sequencial.
- Sem streaming, o direcionamento recorre a um acompanhamento após a execução ativa quando o runtime não pode aceitar direcionamento no mesmo turno.

`steer` não interrompe ferramentas em andamento. Use `/queue interrupt` quando a mensagem mais recente precisar interromper a execução atual.

## Precedência

Para selecionar o modo, o OpenClaw resolve:

1. Substituição de `/queue` por sessão, definida em linha ou armazenada.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Padrão `steer`.

Para as opções, as opções de `/queue` definidas em linha ou armazenadas prevalecem sobre a configuração. Em seguida, são aplicados, nesta ordem, o debounce específico do canal (`messages.queue.debounceMsByChannel`), os padrões de debounce do plugin, as opções globais de `messages.queue` e os padrões integrados. `cap` e `drop` são opções globais/de sessão, não chaves de configuração por canal.

## Substituições por sessão

- Envie `/queue <steer|followup|collect|interrupt>` como um comando independente para armazenar o modo da fila da sessão atual.
- As opções podem ser combinadas: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a substituição da sessão.

## Cancelamento de turnos enfileirados

Enquanto um prompt permanece na fila de acompanhamento/agrupamento (por exemplo, um `chat.send` da TUI ou do
chat web que chega enquanto outro turno está ativo), o Gateway mantém uma
**identidade de cancelamento pertencente ao Gateway** para o `runId` desse cliente até que o conteúdo
enfileirado seja executado ou descartado. A identidade acompanha o conteúdo incorporado a um
resumo de excedente.

- `chat.abort` com um `runId` específico cancela esse turno enquanto ele ainda está
  enfileirado, se o solicitante estiver autorizado (as mesmas regras de propriedade das execuções ativas).
- `chat.abort` para uma sessão sem `runId` cancela **primeiro os turnos enfileirados
  autorizados** e, depois, interrompe as execuções ativas autorizadas. Essa ordem impede que o processamento da fila
  promova trabalho para uma sessão parcialmente interrompida.
- Limpar toda a fila da sessão sem verificações por solicitante não é o
  caminho de interrupção para sessões com vários proprietários.
- As esperas enfileiradas não são projetadas como execuções de agentes ativas em `sessions.list` e
  não possuem a semântica de tempo limite das execuções ativas; apenas a fase ativa possui.

Os clientes (incluindo a TUI) encaminham prompts enviados durante a execução e permitem que o Gateway aplique o
modo da fila. Esc/`/stop` usa uma interrupção no escopo da sessão para que identificadores locais perdidos
não deixem um prompt ainda enfileirado em execução.

## Escopo e garantias

- Aplica-se às execuções de agentes de resposta automática em todos os canais de entrada que usam o pipeline de resposta do Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, chat web etc.).
- A faixa padrão (`main`) abrange todo o processo para entradas + heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Podem existir faixas adicionais (por exemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que tarefas em segundo plano possam ser executadas em paralelo sem bloquear respostas de entrada. Turnos isolados de agentes Cron ocupam um slot de `cron`, enquanto sua execução interna do agente usa `cron-nested`; ambos usam `cron.maxConcurrentRuns`. Fluxos `nested` compartilhados que não são Cron mantêm seu próprio comportamento de faixa. Essas execuções desvinculadas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).
- As faixas por sessão garantem que apenas uma execução de agente acesse determinada sessão por vez.
- Sem dependências externas ou threads de trabalho em segundo plano; apenas TypeScript + promises.

## Solução de problemas

- Se os comandos parecerem travados, ative os logs detalhados e procure linhas com "queued for ...ms" para confirmar que a fila está sendo processada.
- Execuções do servidor de aplicativo do Codex que aceitam um turno e depois param de emitir progresso são interrompidas pelo adaptador do Codex para que a faixa da sessão ativa possa ser liberada, em vez de aguardar o tempo limite da execução externa.
- Quando os diagnósticos estão ativados, as sessões que permanecem em `processing` além de `diagnostics.stuckSessionWarnMs` sem resposta, ferramenta, status, bloco ou progresso de ACP observado são classificadas pela atividade atual:
  - Trabalho ativo com progresso recente é registrado como `session.long_running`. Chamadas silenciosas ao modelo com proprietário também permanecem como `session.long_running` até `diagnostics.stuckSessionAbortMs`, para que provedores lentos ou sem streaming não sejam relatados como paralisados cedo demais.
  - Trabalho ativo sem progresso recente é registrado como `session.stalled`; chamadas ao modelo com proprietário, chamadas de ferramentas bloqueadas e execuções incorporadas paralisadas mudam para `session.stalled` ao atingir ou ultrapassar o limite de interrupção. Atividade obsoleta de modelo/ferramenta sem proprietário não é ocultada como execução longa.
  - `session.stuck` é reservado para registros obsoletos e recuperáveis da sessão, incluindo sessões enfileiradas ociosas com atividade obsoleta de modelo/ferramenta sem proprietário.
  - `session.stuck` sempre aciona uma recuperação capaz de liberar a faixa da sessão afetada. Uma classificação `session.stalled` além de `diagnostics.stuckSessionAbortMs` (chamada de ferramenta bloqueada, chamada de modelo paralisada ou execução incorporada paralisada) também pode acionar a recuperação por interrupção ativa; portanto, ambas as classificações podem destravar uma fila, não apenas `session.stuck`.
  - Linhas de log de aviso repetidas de `session.stuck` e `session.long_running` aplicam recuo exponencial enquanto a sessão permanece inalterada; as tentativas de recuperação continuam sendo executadas a cada ciclo de heartbeat, independentemente desse recuo.

## Relacionados

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Fila de direcionamento](/pt-BR/concepts/queue-steering)
- [Direcionar](/pt-BR/tools/steer)
- [Política de novas tentativas](/pt-BR/concepts/retry)
