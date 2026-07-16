---
read_when:
    - Como configurar atualizações visíveis de progresso para interações de chat de longa duração
    - Escolha entre os modos de streaming parcial, em bloco e de progresso
    - Explicação de como o OpenClaw atualiza uma mensagem do canal enquanto o trabalho está em andamento
    - Rascunhos de progresso da solução de problemas, mensagens de progresso independentes ou fallback de finalização
summary: 'Rascunhos de progresso: uma mensagem visível de trabalho em andamento que é atualizada enquanto um agente está em execução'
title: Rascunhos de progresso
x-i18n:
    generated_at: "2026-07-16T12:24:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Rascunhos de progresso transformam uma mensagem do canal em uma linha de status ativa enquanto um
agente trabalha, em vez de uma pilha de respostas temporárias indicando que "ainda está trabalhando". Defina
`channels.<channel>.streaming.mode: "progress"` e o OpenClaw cria a
mensagem assim que o trabalho real começa, edita-a à medida que o agente lê, planeja, chama
ferramentas ou aguarda aprovação e, por fim, transforma-a na resposta final.

```text
Trabalhando...
📖 de docs/concepts/progress-drafts.md
🔎 Pesquisa na Web: por "discord edit message"
🛠️ Bash: executar testes
```

<Note>
  O Discord já usa `streaming.mode: "progress"` por padrão quando
  `channels.discord.streaming` não está definido, portanto os rascunhos de progresso
  aparecem nele sem qualquer configuração. Todos os outros canais usam `partial`
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

Padrões a partir daqui: atraso inicial de 5 segundos, linhas compactas de progresso enquanto
um trabalho útil acontece e supressão das mensagens de progresso independentes mais antigas
para esse turno. Rascunhos de linhas brutas de ferramentas usam
um rótulo automático de uma palavra; um título de status omite esse título redundante,
a menos que um seja configurado explicitamente.

Esta página aborda a experiência dos rascunhos de progresso e suas opções de configuração. Para
a matriz completa dos modos de streaming, observações de runtime por canal e migração de
chaves legadas, consulte [Streaming e divisão em blocos](/pt-BR/concepts/streaming).

## O que os usuários veem

| Parte            | Finalidade                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| Título de status | No Discord e Telegram, o preâmbulo do modelo; o Discord adiciona um texto auxiliar.       |
| Rótulo           | Linha inicial/de status opcional, como `Working`.                                   |
| Linhas de progresso  | Atualizações compactas da execução usando os mesmos ícones de ferramentas e formatador de detalhes que `/verbose`. |

Para o progresso bruto de ferramentas, o rótulo aparece quando o agente inicia um trabalho significativo
e permanece ocupado durante o atraso inicial.
Ele fica no topo da lista contínua de linhas de progresso e, portanto, sai da área visível quando
linhas suficientes de trabalho concreto aparecem. Um título de status mostra apenas o status
em linguagem simples do agente, a menos que um rótulo seja configurado explicitamente. Respostas
somente de texto simples nunca mostram um rascunho de progresso; uma linha aparece apenas para atualizações de trabalho real,
por exemplo, `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`
ou `✍️ Write: to /tmp/file`.

A resposta final substitui o rascunho no mesmo lugar quando o canal pode fazer isso com
segurança; caso contrário, o OpenClaw envia a resposta final pela entrega normal e
limpa ou para de atualizar o rascunho (consulte [Finalização](#finalization)).

## Escolha um modo

`channels.<channel>.streaming.mode` controla o comportamento visível durante o processamento:

| Modo       | Mais adequado para                         | O que aparece no chat                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Canais silenciosos                   | Somente a resposta final.                            |
| `partial`  | Observar o texto da resposta aparecer      | Um rascunho editado com o texto mais recente da resposta.     |
| `block`    | Blocos maiores de pré-visualização da resposta     | Uma pré-visualização atualizada ou ampliada em blocos maiores. |
| `progress` | Turnos com muitas ferramentas ou de longa duração | Um rascunho de status e, depois, a resposta final.          |

Escolha `progress` quando os usuários se importarem mais com "o que está acontecendo" do que em observar
o texto da resposta ser transmitido token por token; `partial` quando o próprio texto da resposta for
o sinal de progresso; `block` para blocos maiores de pré-visualização. No Discord e
Telegram, `streaming.mode: "block"` ainda é streaming de pré-visualização, não a entrega normal de
respostas em blocos — use `streaming.block.enabled` para isso.

## Configure rótulos

Os rótulos de progresso ficam em `channels.<channel>.streaming.progress`. O rótulo padrão
das linhas brutas de ferramentas é `"auto"`, que usa o rótulo interno simples `Working`.
Um título de status oculta esse rótulo implícito; defina
`label: "auto"` explicitamente se também quiser um rótulo acima dele:

```text
Trabalhando
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

Use seu próprio conjunto de rótulos (ainda escolhido aleatoriamente/por semente quando `label: "auto"`):

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

## Controle as linhas de progresso

As linhas de progresso vêm de eventos reais da execução: início de ferramentas, atualizações de itens, planos de
tarefas, aprovações, saída de comandos, resumos de patches e atividades semelhantes do agente.
Elas ficam habilitadas por padrão (`progress.toolProgress`, padrão `true`).

As ferramentas também podem emitir progresso tipado enquanto uma única chamada ainda está em execução. É
assim que uma busca ou recuperação lenta atualiza o rascunho visível antes que a ferramenta
retorne seu resultado final. A atualização de progresso é um resultado parcial da ferramenta com
conteúdo vazio para o modelo e metadados públicos explícitos do canal:

```json
{
  "content": [],
  "progress": {
    "text": "Recuperando conteúdo da página...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

O OpenClaw renderiza somente `progress.text` na interface de progresso do canal. O resultado normal
da ferramenta ainda chega depois como `content`/`details` e é a única parte
retornada ao modelo.

Ao adicionar progresso a uma ferramenta, emita uma mensagem curta e genérica e adie-a
até que a operação esteja pendente por tempo suficiente para ser útil. `web_fetch`
faz exatamente isso com um atraso de 5 segundos:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Recuperando conteúdo da página...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Chamadas rápidas não mostram uma linha de progresso; chamadas longas mostram uma enquanto ainda estão pendentes;
chamadas canceladas limpam o temporizador antes que um progresso obsoleto possa aparecer. O texto de progresso
é um canal lateral público da interface, portanto nunca deve incluir segredos, argumentos brutos,
conteúdo recuperado, saída de comandos ou texto da página.

### Modo de detalhes

O OpenClaw usa o mesmo formatador para rascunhos de progresso e `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` é o padrão e mantém os rascunhos estáveis com rótulos concisos.
`"raw"` acrescenta o comando subjacente quando disponível, o que é útil durante
a depuração, mas gera mais ruído no chat. Por exemplo, uma chamada `node --check /tmp/app.js`
é renderizada de modo diferente em cada modo:

| Modo      | Linha de progresso                                                   |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Texto de comando/execução

`streaming.progress.commandText` (padrão `"raw"`) controla quantos detalhes do comando
aparecem ao lado das linhas de progresso de exec/bash, independentemente do modo de detalhes
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

`streaming.progress.commentary` (padrão `false`) intercala a narração de
comentário/preâmbulo do modelo anterior à ferramenta (💬, por exemplo, "Vou verificar... e depois
...") com as linhas de ferramentas no rascunho. Consulte
[Streaming e divisão em blocos](/pt-BR/concepts/streaming#commentary-progress-lane) para ver o
formato de configuração compartilhado entre canais.

Com a faixa de comentários habilitada, os preâmbulos são renderizados apenas como essas linhas
💬 intercaladas; o título de status abaixo não interfere, para que a faixa mantenha seu
formato documentado.

### Título de status

No Discord e Telegram no modo de progresso, o preâmbulo tipado do modelo anterior à ferramenta
se torna o título de status do rascunho sempre que estiver disponível. Outros
canais no modo de progresso mantêm seu comportamento de status existente. O título fica
ativado por padrão e não ignora o bloqueio normal de atividade em turnos curtos;
habilitar `streaming.progress.commentary` encaminha os preâmbulos para a faixa intercalada
de comentários.

No Discord, quando um modelo utilitário é resolvido para o agente — um
[`utilityModel`](/pt-BR/gateway/config-agents#utilitymodel) explícito ou o padrão
de modelo pequeno declarado pelo provedor principal (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) — ele fornece um texto auxiliar curto em linguagem simples
quando o modelo não emite um preâmbulo ou permanece sem atualizações por cerca de 20 segundos
(atualmente, o título do Telegram usa apenas o preâmbulo):

```text
Atualizando o modelo padrão na sua configuração e depois reiniciando o gateway para
aplicar a alteração. Uma chamada de listagem de agentes falhou e está sendo tentada novamente.
```

A narração utilitária fica ativada por padrão (`streaming.progress.narration`, padrão
`true`) e nunca recorre ao modelo principal: ela é executada apenas com um
`utilityModel` explícito ou um padrão declarado pelo provedor principal
do agente. Defina `utilityModel: ""` para desabilitar completamente o roteamento utilitário. As linhas de ferramentas
continuam se acumulando abaixo e voltam a aparecer se ambas as fontes de status pararem. As edições do
rascunho ainda aguardam o bloqueio normal de atividade e uma alteração real
no texto, o que evita flashes em turnos rápidos e reduz a rotatividade de edições em canais
movimentados. Defina `narration: false` para desabilitar apenas o texto auxiliar do modelo utilitário; os títulos
de preâmbulo do modelo permanecem habilitados:

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

A entrada da narração é limitada e tem dados sensíveis removidos: o modelo utilitário recebe o
texto da solicitação de entrada junto com os mesmos resumos compactos e com dados sensíveis removidos das ferramentas que o rascunho
renderizaria — nunca a saída bruta de comandos nem os resultados das ferramentas. Com
`commandText: "status"`, a entrada da narração também omite o texto de comandos exec/bash,
correspondendo ao que o rascunho mostra.

### Limites de linhas

Limite quantas linhas permanecem visíveis (padrão 8):

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

As linhas de progresso são compactadas automaticamente para reduzir o reajuste do balão de chat enquanto
o rascunho é editado, e o OpenClaw trunca linhas longas para que edições repetidas do rascunho
não quebrem as linhas de forma diferente a cada atualização. O limite padrão por linha é de 120
caracteres; o texto corrido é cortado em um limite de palavra, enquanto detalhes longos, como caminhos ou
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
portanto clientes que não conseguem renderizar o formato mais elaborado ainda mostram o texto compacto
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

Com `toolProgress: false`, o OpenClaw ainda suprime as mensagens independentes
mais antigas de progresso das ferramentas nessa interação — o canal permanece
visualmente silencioso até a resposta final, exceto pelo rótulo, caso algum esteja configurado.

## Comportamento do canal

| Canal           | Transporte do progresso                    | Observações                                                                                                                                                    |
| --------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Envia uma mensagem e depois a edita.       | Usa por padrão o modo `progress`; a resposta final inclui um comprovante de atividade `-#`, e o rascunho de status é excluído após a entrega da resposta. |
| Matrix          | Envia um evento e depois o edita.          | A configuração de streaming no nível da conta controla os rascunhos no nível da conta.                                                                         |
| Microsoft Teams | Stream nativo do Teams em chats pessoais.  | `streaming.mode: "block"` corresponde à entrega em blocos do Teams.                                                                                                    |
| Slack           | Stream nativo ou publicação de rascunho editável. | Exige um destino de thread de resposta; mensagens diretas de nível superior sem um ainda recebem publicações de prévia do rascunho e edições.              |
| Telegram        | Envia uma mensagem e depois a edita.       | Se uma mensagem chegar entre o rascunho de progresso e a resposta, o rascunho será republicado abaixo dela (publicar o novo e depois excluir o antigo), em vez de fazer a tela do cliente saltar. |
| Mattermost      | Publicação de rascunho editável.           | O modo `block` alterna entre publicações de texto concluído e de atividade das ferramentas; outros modos incorporam a atividade das ferramentas à mesma publicação no estilo de rascunho. |

Os canais sem suporte seguro à edição usam indicadores de digitação ou
entrega somente da resposta final como alternativa. Consulte [Streaming e divisão em partes](/pt-BR/concepts/streaming) para ver
a análise completa do comportamento em tempo de execução de cada canal.

## Finalização

Quando a resposta final está pronta, o OpenClaw tenta manter o chat organizado:

- No modo `progress` no Discord, a resposta final é enviada como uma nova mensagem
  com um pequeno comprovante de atividade `-#` anexado (por exemplo,
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`), e o rascunho de status é
  excluído assim que essa resposta é entregue. Canais movimentados não mantêm nenhum log órfão de ferramentas
  acima da resposta; respostas finais com erro mantêm o rascunho como registro visível da
  interação que falhou.
- Se o rascunho puder se tornar a resposta final com segurança (modos `partial`/`block`),
  o OpenClaw o edita no mesmo lugar.
- Se o canal usar streaming nativo de progresso, o OpenClaw finaliza esse
  stream quando o transporte nativo aceita o texto final.
- Caso contrário (mídia, uma solicitação de aprovação, um destino explícito de resposta, partes
  demais ou falha na edição ou no envio), o OpenClaw envia a resposta final pelo
  fluxo normal de entrega do canal, em vez de substituir o rascunho.

Essa alternativa é intencional: enviar uma nova resposta final é melhor do que perder texto,
associar uma resposta à thread errada ou substituir um rascunho por um conteúdo que o canal
não consegue representar com segurança.

## Solução de problemas

**Vejo apenas a resposta final.**

Verifique se `channels.<channel>.streaming.mode` está definido como `progress` para a conta
ou o canal que processou a mensagem. Alguns fluxos de grupo ou de resposta com citação desativam
as prévias de rascunho em uma interação quando o canal não consegue editar com segurança a
mensagem correta.

**Vejo o rótulo, mas nenhuma linha de ferramenta.**

Verifique `streaming.progress.toolProgress`. Se estiver definido como `false`, o OpenClaw mantém o
comportamento de rascunho único, mas oculta as linhas de progresso das ferramentas e tarefas.

**Vejo uma nova mensagem final em vez de um rascunho editado.**

Essa é a alternativa de segurança descrita em [Finalização](#finalization). Isso pode
acontecer em respostas com mídia, respostas longas, destinos explícitos de resposta, rascunhos antigos do Telegram,
destinos de thread ausentes no Slack, mensagens de prévia excluídas ou falha na
finalização do stream nativo.

**Ainda vejo mensagens independentes de progresso.**

O modo de progresso suprime as mensagens independentes padrão de progresso das ferramentas sempre que um
rascunho está ativo. Se as mensagens independentes ainda aparecerem, confirme se a interação está
realmente usando o modo `progress`, e não `streaming.mode: "off"` ou um fluxo do canal
que não consegue criar um rascunho para essa mensagem.

**O Teams se comporta de maneira diferente do Discord ou Telegram.**

O Microsoft Teams usa um stream nativo em chats pessoais, em vez do transporte genérico
de prévia com envio e edição, e associa `streaming.mode: "block"` à
entrega em blocos do Teams porque não possui um modo de bloco de prévia de rascunho como o Discord e o
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
