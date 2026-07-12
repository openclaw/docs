---
read_when:
    - Alteração da execução ou da simultaneidade das respostas automáticas
    - Explicando os modos de /queue ou o comportamento de direcionamento de mensagens
summary: Modos de fila de resposta automática, padrões e substituições por sessão
title: Fila de comandos
x-i18n:
    generated_at: "2026-07-11T23:53:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw serializa as execuções de resposta automática recebidas (em todos os canais) por meio de uma pequena fila no processo para impedir que várias execuções de agentes entrem em conflito, ainda permitindo paralelismo seguro entre sessões.

## Por quê

- As execuções de resposta automática podem ser dispendiosas (chamadas ao LLM) e entrar em conflito quando várias mensagens recebidas chegam em um curto intervalo.
- A serialização evita a disputa por recursos compartilhados (arquivos de sessão, logs, entrada padrão da CLI) e reduz a probabilidade de limites de taxa do serviço upstream.

## Como funciona

- Uma fila FIFO com reconhecimento de faixas esvazia cada faixa com um limite configurável de simultaneidade (padrão 1 para faixas não configuradas; `main` tem como padrão 4 e `subagent`, 8).
- `runEmbeddedAgent` enfileira pela **chave da sessão** (faixa `session:<key>`) para garantir apenas uma execução ativa por sessão.
- Cada execução de sessão é então enfileirada em uma **faixa global** (`main` por padrão), de modo que o paralelismo geral seja limitado por `agents.defaults.maxConcurrent`.
- Quando o registro detalhado está habilitado, as execuções enfileiradas emitem um breve aviso caso tenham aguardado mais de aproximadamente 2 segundos antes de começar.
- Os indicadores de digitação ainda são acionados imediatamente ao enfileirar (quando compatíveis com o canal), portanto a experiência do usuário permanece inalterada enquanto a execução aguarda sua vez.

## Padrões

Quando não definidos, todos os canais de entrada usam:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

O direcionamento no mesmo turno é o padrão. Um prompt que chega durante uma execução é injetado no runtime ativo quando a execução pode aceitar direcionamento, portanto nenhuma segunda execução de sessão é iniciada. Se a execução ativa não puder aceitar direcionamento, o OpenClaw aguardará sua conclusão antes de iniciar o prompt.

## Modos da fila

`/queue` controla o que as mensagens recebidas normais fazem enquanto uma sessão já tem uma execução ativa:

- `steer`: injeta mensagens no runtime ativo. O OpenClaw entrega todas as mensagens de direcionamento pendentes **depois que o turno atual do assistente termina de executar suas chamadas de ferramentas**, antes da próxima chamada ao LLM; o servidor de aplicativo do Codex recebe um único `turn/steer` em lote. Se a execução não estiver transmitindo ativamente ou o direcionamento não estiver disponível, o OpenClaw aguardará o término da execução ativa antes de iniciar o prompt.
- `followup`: não direciona. Enfileira cada mensagem para um turno posterior do agente, após o término da execução atual.
- `collect`: não direciona. Agrupa as mensagens enfileiradas em um **único** turno de acompanhamento após a janela de inatividade. Se as mensagens tiverem como destino canais ou threads diferentes, elas serão processadas individualmente para preservar o roteamento.
- `interrupt`: interrompe a execução ativa dessa sessão e, em seguida, executa a mensagem mais recente.

Para conhecer o comportamento de temporização e dependências específico do runtime, consulte [Fila de direcionamento](/pt-BR/concepts/queue-steering). Para o comando explícito `/steer <message>`, consulte [Direcionar](/pt-BR/tools/steer).

Configure globalmente ou por canal por meio de `messages.queue`:

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
- `cap`: número máximo de mensagens enfileiradas por sessão. Valores abaixo de `1` são ignorados.
- `drop: "summarize"` (padrão): descarta as entradas enfileiradas mais antigas conforme necessário, mantém resumos compactos e os injeta como um prompt sintético de acompanhamento.
- `drop: "old"`: descarta as entradas enfileiradas mais antigas conforme necessário, sem preservar resumos.
- `drop: "new"`: rejeita a mensagem mais recente quando a fila já está cheia.

Padrões: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Direcionamento e transmissão

Quando a transmissão do canal é `partial` ou `block`, o direcionamento pode parecer várias respostas visíveis curtas enquanto a execução ativa alcança os limites do runtime:

- `partial`: a prévia pode ser finalizada antecipadamente e, em seguida, uma nova prévia começa depois que o direcionamento é aceito.
- `block`: blocos do tamanho de rascunhos podem criar a mesma aparência sequencial.
- Sem transmissão, o direcionamento recorre a um acompanhamento após a execução ativa quando o runtime não pode aceitar direcionamento no mesmo turno.

`steer` não interrompe ferramentas em execução. Use `/queue interrupt` quando a mensagem mais recente precisar interromper a execução atual.

## Precedência

Para selecionar o modo, o OpenClaw usa:

1. Substituição de `/queue` em linha ou armazenada por sessão.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` padrão.

Para as opções, as opções de `/queue` em linha ou armazenadas têm precedência sobre a configuração. Em seguida, são aplicados, nessa ordem, o atraso específico do canal (`messages.queue.debounceMsByChannel`), os padrões de atraso do Plugin, as opções globais de `messages.queue` e os padrões integrados. `cap` e `drop` são opções globais ou da sessão, não chaves de configuração por canal.

## Substituições por sessão

- Envie `/queue <steer|followup|collect|interrupt>` como comando independente para armazenar o modo da fila da sessão atual.
- As opções podem ser combinadas: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` limpa a substituição da sessão.

## Cancelamento de turnos enfileirados

Enquanto um prompt permanece na fila de acompanhamento ou agrupamento (por exemplo, um `chat.send` da TUI ou do webchat que chega enquanto outro turno está ativo), o Gateway mantém uma **identidade de cancelamento pertencente ao Gateway** para o `runId` desse cliente até que o conteúdo enfileirado seja executado ou descartado. A identidade acompanha o conteúdo incorporado a um resumo de excedentes.

- `chat.abort` com um `runId` específico cancela esse turno enquanto ele ainda está enfileirado, se o solicitante tiver autorização (as mesmas regras de propriedade das execuções ativas).
- `chat.abort` para uma sessão sem `runId` cancela **primeiro os turnos enfileirados autorizados** e, em seguida, interrompe as execuções ativas autorizadas. Essa ordem impede que o processamento da fila promova trabalho para uma sessão parcialmente interrompida.
- Limpar toda a fila da sessão sem verificações por solicitante não é o método de interrupção para sessões com vários proprietários.
- As esperas enfileiradas não são apresentadas como execuções ativas de agentes em `sessions.list` e não possuem a semântica de tempo limite das execuções ativas; apenas a fase ativa possui essa semântica.

Os clientes (incluindo a TUI) encaminham prompts recebidos durante uma execução e deixam que o Gateway aplique o modo da fila. Esc/`/stop` usa uma interrupção com escopo de sessão para que a perda de identificadores locais não deixe um prompt ainda enfileirado em execução.

## Escopo e garantias

- Aplica-se às execuções de agentes de resposta automática em todos os canais de entrada que usam o pipeline de respostas do Gateway (WhatsApp Web, Telegram, Slack, Discord, Signal, iMessage, webchat etc.).
- A faixa padrão (`main`) abrange todo o processo para entradas + heartbeats principais; defina `agents.defaults.maxConcurrent` para permitir várias sessões em paralelo.
- Podem existir faixas adicionais (por exemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que tarefas em segundo plano sejam executadas em paralelo sem bloquear respostas recebidas. Turnos isolados de agentes do Cron ocupam uma vaga de `cron`, enquanto a execução interna do agente usa `cron-nested`; ambos usam `cron.maxConcurrentRuns`. Fluxos `nested` compartilhados que não são do Cron mantêm o comportamento da própria faixa. Essas execuções desvinculadas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).
- As faixas por sessão garantem que apenas uma execução de agente interaja com determinada sessão por vez.
- Sem dependências externas nem threads de trabalho em segundo plano; apenas TypeScript + promessas.

## Solução de problemas

- Se os comandos parecerem travados, habilite os logs detalhados e procure linhas `"queued for ...ms"` para confirmar que a fila está sendo processada.
- As execuções do servidor de aplicativo do Codex que aceitam um turno e depois deixam de emitir progresso são interrompidas pelo adaptador do Codex para que a faixa da sessão ativa possa ser liberada, em vez de aguardar o tempo limite da execução externa.
- Quando o diagnóstico está habilitado, as sessões que permanecem em `processing` além de `diagnostics.stuckSessionWarnMs` sem nenhuma resposta, ferramenta, status, bloco ou progresso de ACP observado são classificadas pela atividade atual:
  - O trabalho ativo com progresso recente é registrado como `session.long_running`. Chamadas silenciosas ao modelo com proprietário também permanecem como `session.long_running` até `diagnostics.stuckSessionAbortMs`, para que provedores lentos ou sem transmissão não sejam relatados como paralisados cedo demais.
  - O trabalho ativo sem progresso recente é registrado como `session.stalled`; chamadas ao modelo com proprietário, chamadas de ferramentas bloqueadas e execuções incorporadas paralisadas mudam para `session.stalled` ao atingir ou ultrapassar o limite de interrupção. Atividades obsoletas de modelo ou ferramenta sem proprietário não ficam ocultas como execuções prolongadas.
  - `session.stuck` é reservado para registros recuperáveis e obsoletos da sessão, incluindo sessões enfileiradas inativas com atividades obsoletas de modelo ou ferramenta sem proprietário.
  - `session.stuck` sempre aciona uma recuperação que pode liberar a faixa da sessão afetada. Uma classificação `session.stalled` após `diagnostics.stuckSessionAbortMs` (chamada de ferramenta bloqueada, chamada de modelo paralisada ou execução incorporada paralisada) também pode acionar a recuperação por interrupção ativa; portanto, ambas as classificações podem destravar uma fila, não apenas `session.stuck`.
  - Linhas repetidas de aviso de `session.stuck` e `session.long_running` nos logs usam recuo exponencial enquanto a sessão permanece inalterada; as tentativas de recuperação ainda são executadas a cada ciclo de Heartbeat, independentemente desse recuo.

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Fila de direcionamento](/pt-BR/concepts/queue-steering)
- [Direcionar](/pt-BR/tools/steer)
- [Política de repetição](/pt-BR/concepts/retry)
