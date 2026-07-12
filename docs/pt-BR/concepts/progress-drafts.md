---
read_when:
    - Configurando atualizações de progresso visíveis para interações de chat de longa duração
    - Escolha entre os modos de streaming parcial, em bloco e de progresso
    - Explicação de como o OpenClaw atualiza uma mensagem do canal enquanto o trabalho está em andamento
    - Rascunhos de progresso da solução de problemas, mensagens de progresso independentes ou fallback de finalização
summary: 'Rascunhos de progresso: uma mensagem visível de trabalho em andamento que é atualizada enquanto um agente está em execução'
title: Rascunhos de progresso
x-i18n:
    generated_at: "2026-07-12T21:31:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4f937a61dfa360ac1d6c67e1a05e5ac698af563f2b58624d6de4e69a7f904cdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Os rascunhos de progresso transformam uma mensagem do canal em uma linha de status dinâmica enquanto um
agente trabalha, em vez de uma pilha de respostas temporárias do tipo "ainda trabalhando". Defina
`channels.<channel>.streaming.mode: "progress"` e o OpenClaw cria a
mensagem assim que o trabalho real começa, edita-a à medida que o agente lê, planeja, chama
ferramentas ou aguarda aprovação e, em seguida, a transforma na resposta final.

```text
Executando no shell...
📖 de docs/concepts/progress-drafts.md
🔎 Pesquisa na Web: por "editar mensagem no Discord"
🛠️ Bash: executar testes
```

<Note>
  O Discord já usa `streaming.mode: "progress"` por padrão quando
  `channels.discord.streaming` não está definido, portanto os rascunhos de progresso
  aparecem nele sem nenhuma configuração. Todos os outros canais usam `partial`
  ou `off` por padrão; consulte [Streaming e divisão em blocos](/pt-BR/concepts/streaming#channel-mapping)
  para ver a tabela completa de padrões por canal.
</Note>

## Início rápido

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

Os padrões a partir daqui são: um atraso inicial de 5 segundos (ou início imediato em um segundo evento de
trabalho), linhas de progresso compactas enquanto ocorre trabalho útil e supressão das
mensagens de progresso independentes mais antigas para essa interação. Rascunhos de linhas brutas de ferramentas usam
um rótulo automático de uma palavra; o status narrado omite esse título redundante, a menos que
você configure um explicitamente.

Esta página aborda a experiência de rascunhos de progresso e suas opções de configuração. Para ver a
matriz completa dos modos de streaming, as observações de runtime por canal e a migração de chaves
legadas, consulte [Streaming e divisão em blocos](/pt-BR/concepts/streaming).

## O que os usuários veem

| Parte              | Finalidade                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Rótulo             | Linha inicial/de status opcional, como `Working` ou `Shelling`.                                    |
| Linhas de progresso | Atualizações compactas da execução usando os mesmos ícones de ferramentas e formatador de detalhes de `/verbose`. |

Para o progresso bruto das ferramentas, o rótulo aparece quando o agente começa um trabalho significativo
e permanece ocupado durante o atraso inicial, ou quando um segundo evento de trabalho é disparado imediatamente.
Ele fica no topo da lista contínua de linhas de progresso, portanto desaparece com a rolagem quando
linhas de trabalho concretas suficientes aparecem. O progresso narrado mostra apenas o status
em linguagem simples do agente, a menos que um rótulo seja configurado explicitamente. Respostas
somente em texto simples nunca mostram um rascunho de progresso; uma linha aparece apenas para atualizações de trabalho reais,
por exemplo, `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`,
ou `✍️ Write: to /tmp/file`.

A resposta final substitui o rascunho no mesmo lugar quando o canal pode fazer isso com segurança;
caso contrário, o OpenClaw envia a resposta final pela entrega normal e
limpa ou para de atualizar o rascunho (consulte [Finalização](#finalization)).

## Escolha um modo

`channels.<channel>.streaming.mode` controla o comportamento visível durante o processamento:

| Modo       | Ideal para                              | O que aparece no chat                                      |
| ---------- | --------------------------------------- | ---------------------------------------------------------- |
| `off`      | Canais silenciosos                      | Apenas a resposta final.                                   |
| `partial`  | Acompanhar o texto da resposta surgindo | Um rascunho editado com o texto mais recente da resposta.  |
| `block`    | Trechos maiores de prévia da resposta   | Uma prévia atualizada ou ampliada em trechos maiores.       |
| `progress` | Interações longas ou com muitas ferramentas | Um rascunho de status e, depois, a resposta final.      |

Escolha `progress` quando os usuários se importarem mais com "o que está acontecendo" do que em acompanhar
o texto da resposta sendo transmitido token por token; `partial` quando o próprio texto da resposta for
o indicador de progresso; `block` para trechos maiores de prévia. No Discord e no
Telegram, `streaming.mode: "block"` ainda é transmissão de prévia, não entrega normal
de resposta em blocos — use `streaming.block.enabled` para isso.

## Configurar rótulos

Os rótulos de progresso ficam em `channels.<channel>.streaming.progress`. O rótulo
padrão das linhas brutas de ferramentas é `"auto"`, que seleciona um rótulo do
conjunto integrado de palavras únicas do OpenClaw. O progresso narrado oculta
esse rótulo implícito; defina `label: "auto"` explicitamente se também quiser
exibi-lo acima da narração:

```text
Trabalhando, Executando, Rastejando, Agarrando, Beliscando, Mudando, Borbulhando, Mareando,
Recifando, Rachando, Peneirando, Salgando, Nautilando, Krillando, Cracando,
Lagosteando, EmPoçaDeMaré, Perolando, Estalando, Emergindo
```

Use um rótulo fixo:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigando",
        },
      },
    },
  },
}
```

Use seu próprio conjunto de rótulos (ainda selecionados aleatoriamente/por semente quando `label: "auto"`):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Verificando", "Lendo", "Testando", "Finalizando"],
        },
      },
    },
  },
}
```

Oculte o rótulo e mostre apenas as linhas de progresso:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## Controlar as linhas de progresso

As linhas de progresso vêm de eventos reais da execução: inicializações de
ferramentas, atualizações de itens, planos de tarefas, aprovações, saída de
comandos, resumos de patches e atividades semelhantes do agente. Elas são
ativadas por padrão (`progress.toolProgress`, padrão `true`).

As ferramentas também podem emitir progresso tipado enquanto uma única chamada
ainda está em execução. É assim que uma busca ou obtenção lenta atualiza o
rascunho visível antes que a ferramenta retorne o resultado final. A atualização
de progresso é um resultado parcial da ferramenta, com conteúdo do modelo vazio
e metadados explícitos do canal público:

```json
{
  "content": [],
  "progress": {
    "text": "Obtendo o conteúdo da página...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

O OpenClaw renderiza apenas `progress.text` na interface de progresso do canal.
O resultado normal da ferramenta ainda chega depois como `content`/`details` e
é a única parte retornada ao modelo.

Ao adicionar progresso a uma ferramenta, emita uma mensagem curta e genérica e
atrase-a até que a operação esteja pendente por tempo suficiente para que seja
útil. `web_fetch` faz exatamente isso com um atraso de 5 segundos:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Obtendo o conteúdo da página...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Chamadas rápidas não exibem linha de progresso; chamadas longas exibem uma enquanto ainda estão pendentes;
chamadas canceladas limpam o temporizador antes que um progresso obsoleto possa aparecer. O texto de progresso
é um canal lateral público da interface, portanto nunca deve incluir segredos, argumentos brutos,
conteúdo obtido, saída de comandos ou texto da página.

### Modo detalhado

O OpenClaw usa o mesmo formatador para rascunhos de progresso e `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explicar | bruto
    },
  },
}
```

`"explain"` é o padrão e mantém os rascunhos estáveis com rótulos concisos.
`"raw"` acrescenta o comando subjacente quando disponível, o que é útil durante a
depuração, mas gera mais ruído no chat. Por exemplo, uma chamada `node --check /tmp/app.js`
é exibida de forma diferente conforme o modo:

| Modo      | Linha de progresso                                               |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Texto do comando/execução

`streaming.progress.commandText` (padrão `"raw"`) controla quantos detalhes do comando
são exibidos ao lado das linhas de progresso de exec/bash, independentemente do modo de detalhes
acima. Defina-o como `"status"` para manter uma linha de progresso da ferramenta visível enquanto oculta
completamente o texto do comando:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### Faixa de comentários

`streaming.progress.commentary` (padrão `false`) intercala a narração de comentários/preâmbulo do modelo antes das ferramentas (💬, por exemplo, "Vou verificar... e depois
...") com as linhas de ferramentas no rascunho. Consulte
[Streaming e fragmentação](/pt-BR/concepts/streaming#commentary-progress-lane) para conhecer o
formato de configuração compartilhado entre os canais.

### Status narrado

Quando um modelo utilitário é definido para o agente — um
[`utilityModel`](/pt-BR/gateway/config-agents#utilitymodel) explícito ou o padrão de modelo
pequeno declarado pelo provedor principal (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) —, o rascunho de progresso substitui as linhas
contínuas de ferramentas por uma breve narração em linguagem simples sobre o que o agente está fazendo,
escrita por esse modelo mais econômico e atualizada conforme o trabalho avança:

```text
Atualizando o modelo padrão na sua configuração e, em seguida, reiniciando o gateway para
aplicá-lo. Uma chamada de listagem de agentes falhou e está sendo tentada novamente.
```

A narração é ativada por padrão (`streaming.progress.narration`, padrão `true`)
e nunca recorre ao modelo principal: ela é executada somente com um
`utilityModel` explícito ou um padrão declarado pelo provedor principal
do agente. Defina `utilityModel: ""` para desativar completamente o roteamento utilitário. As linhas de ferramentas
continuam se acumulando abaixo e retornam se a narração parar, e o rascunho é
editado somente após o controle normal de atividade e quando o texto da narração realmente
muda, o que evita exibições rápidas em interações breves e reduz a quantidade de edições em
canais movimentados. Desative-a para manter as linhas brutas de ferramentas:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

A entrada de narração é limitada e editada: o modelo utilitário recebe o
texto da solicitação recebida mais os mesmos resumos compactos e editados de ferramentas que o rascunho
renderizaria — nunca a saída bruta de comandos nem resultados de ferramentas. Com
`commandText: "status"`, a entrada de narração também omite o texto de comandos exec/bash,
correspondendo ao que o rascunho mostra.

### Limites de linhas

Limite quantas linhas permanecem visíveis (padrão: 8):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

As linhas de progresso são compactadas automaticamente para reduzir o refluxo dos balões de chat enquanto
o rascunho é editado, e o OpenClaw trunca linhas longas para que edições repetidas do rascunho
não quebrem as linhas de forma diferente a cada atualização. O limite padrão por linha é de 120
caracteres; a prosa é cortada em um limite de palavra, enquanto detalhes longos, como caminhos ou
comandos brutos, são encurtados com reticências no meio para que o sufixo permaneça visível.

Ajuste o limite por linha:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

### Renderização avançada (Slack)

O Slack pode renderizar linhas de progresso como campos estruturados do Block Kit em vez de
texto simples:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

A renderização avançada sempre envia o mesmo corpo em texto simples junto com os campos do Block Kit,
portanto clientes que não conseguem renderizar o formato mais avançado ainda exibem o texto compacto
de progresso.

### Ocultar linhas de ferramentas/tarefas

Mantenha o único rascunho de progresso, mas oculte as linhas de ferramentas e tarefas:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

Com `toolProgress: false`, o OpenClaw ainda suprime as antigas mensagens independentes
de progresso de ferramentas nessa interação — o canal permanece visualmente silencioso até
a resposta final, exceto pelo rótulo, caso um esteja configurado.

## Comportamento do canal

| Canal           | Transporte de progresso                             | Observações                                                                                                                                                                                                 |
| --------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Envia uma mensagem e depois a edita.                | Usa o modo `progress` por padrão; a resposta final inclui um comprovante de atividade `-#`, e o rascunho de status é excluído após a entrega da resposta.                                                   |
| Matrix          | Envia um evento e depois o edita.                   | A configuração de streaming no nível da conta controla os rascunhos no nível da conta.                                                                                                                     |
| Microsoft Teams | Stream nativo do Teams em chats pessoais.           | `streaming.mode: "block"` é mapeado para a entrega em blocos do Teams.                                                                                                                                     |
| Slack           | Stream nativo ou publicação de rascunho editável.   | Requer um destino de thread de resposta; mensagens diretas de nível superior sem um destino ainda recebem publicações de pré-visualização do rascunho e edições.                                          |
| Telegram        | Envia uma mensagem e depois a edita.                | Se uma mensagem for entregue entre o rascunho de progresso e a resposta, o rascunho será republicado abaixo dela (publicar o novo e depois excluir o antigo), em vez de fazer a tela do cliente saltar.     |
| Mattermost      | Publicação de rascunho editável.                    | O modo `block` alterna entre publicações de texto concluído e de atividade de ferramentas; outros modos incorporam a atividade de ferramentas à mesma publicação no estilo de rascunho.                    |

Canais sem suporte seguro a edições recorrem a indicadores de digitação ou à
entrega somente da resposta final. Consulte [Streaming e fragmentação](/pt-BR/concepts/streaming) para ver a
análise completa do comportamento em tempo de execução por canal.

## Finalização

Quando a resposta final está pronta, o OpenClaw tenta manter o chat organizado:

- No modo `progress` no Discord, a resposta final é enviada como uma nova mensagem
  com um pequeno comprovante de atividade `-#` anexado (por exemplo,
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`), e o rascunho de status é
  excluído assim que essa resposta é entregue. Canais movimentados não mantêm nenhum log
  de ferramenta órfão acima da resposta; em caso de erro na resposta final, o rascunho é mantido como o registro visível
  da interação que falhou.
- Se o rascunho puder se tornar a resposta final com segurança (modos `partial`/`block`),
  o OpenClaw o edita no próprio local.
- Se o canal usar streaming nativo de progresso, o OpenClaw finaliza esse
  stream quando o transporte nativo aceita o texto final.
- Caso contrário (mídia, uma solicitação de aprovação, um destino de resposta explícito, muitos
  blocos ou falha ao editar/enviar), o OpenClaw envia a resposta final pelo
  fluxo normal de entrega do canal, em vez de sobrescrever o rascunho.

O fallback é intencional: enviar uma nova resposta final é melhor do que perder texto,
associar uma resposta à conversa errada ou sobrescrever um rascunho com um payload que o canal
não consegue representar com segurança.

## Solução de problemas

**Só vejo a resposta final.**

Verifique se `channels.<channel>.streaming.mode` está definido como `progress` para a conta
ou o canal que processou a mensagem. Alguns fluxos de grupo ou de resposta com citação desativam
as prévias de rascunho em uma interação quando o canal não consegue editar com segurança a
mensagem correta.

**Vejo o rótulo, mas nenhuma linha de ferramenta.**

Verifique `streaming.progress.toolProgress`. Se for `false`, o OpenClaw mantém o
comportamento de rascunho único, mas oculta as linhas de progresso de ferramentas e tarefas.

**Vejo uma nova mensagem final em vez de um rascunho editado.**

Esse é o fallback de segurança descrito em [Finalização](#finalization). Isso pode
acontecer em respostas com mídia, respostas longas, destinos de resposta explícitos, rascunhos
antigos do Telegram, destinos de thread ausentes no Slack, mensagens de pré-visualização excluídas ou falha
na finalização do stream nativo.

**Ainda vejo mensagens de progresso independentes.**

O modo de progresso suprime as mensagens independentes padrão de progresso de ferramentas sempre que um
rascunho está ativo. Se mensagens independentes ainda aparecerem, confirme se o turno está
realmente usando o modo `progress`, e não `streaming.mode: "off"` nem um caminho de
canal que não consiga criar um rascunho para essa mensagem.

**O Teams se comporta de modo diferente do Discord ou Telegram.**

O Microsoft Teams usa um stream nativo em conversas pessoais, em vez do transporte genérico
de pré-visualização com envio e edição, e mapeia `streaming.mode: "block"` para a entrega em blocos do Teams
porque não tem um modo de bloco com pré-visualização de rascunho como o Discord e o
Telegram.

## Relacionados

- [Streaming e divisão em partes](/pt-BR/concepts/streaming)
- [Mensagens](/pt-BR/concepts/messages)
- [Configuração de canais](/pt-BR/gateway/config-channels)
- [Discord](/pt-BR/channels/discord)
- [Matrix](/pt-BR/channels/matrix)
- [Microsoft Teams](/pt-BR/channels/msteams)
- [Slack](/pt-BR/channels/slack)
- [Telegram](/pt-BR/channels/telegram)
- [Mattermost](/pt-BR/channels/mattermost)
