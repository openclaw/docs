---
read_when:
    - Configurando atualizações de progresso visíveis para turnos de chat de longa duração
    - Escolhendo entre os modos de streaming parcial, em bloco e de progresso
    - Explicando como o OpenClaw atualiza uma mensagem de canal enquanto o trabalho está em andamento
    - Solução de problemas de rascunhos de progresso, mensagens de progresso independentes ou fallback de finalização
summary: 'Rascunhos de progresso: uma mensagem visível de trabalho em andamento que é atualizada enquanto um agente é executado'
title: Rascunhos de progresso
x-i18n:
    generated_at: "2026-06-27T17:26:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Os rascunhos de progresso fazem turnos de agente de longa duração parecerem vivos no chat sem transformar
a conversa em uma pilha de respostas temporárias de status.

Quando os rascunhos de progresso estão habilitados, o OpenClaw cria uma mensagem
visível de trabalho em andamento somente depois que o turno prova que está fazendo trabalho real,
atualiza-a enquanto o agente lê, planeja, chama ferramentas ou aguarda aprovação, e então
transforma esse rascunho na resposta final quando o canal consegue fazer isso com segurança.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Use rascunhos de progresso quando quiser uma única mensagem de status organizada durante trabalho
intenso com ferramentas e a resposta final quando o turno terminar.

## Início rápido

Habilite rascunhos de progresso por canal com `streaming.mode: "progress"`:

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

Isso geralmente é suficiente. O OpenClaw escolherá um rótulo automático de uma
palavra, aguardará até que o trabalho dure pelo menos cinco segundos ou emita um
segundo evento de trabalho, adicionará linhas de progresso compactas enquanto trabalho útil
acontece e suprimirá conversas de progresso independentes duplicadas para esse turno.

## O que os usuários veem

Um rascunho de progresso tem duas partes:

| Parte              | Finalidade                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Rótulo             | Uma linha curta inicial/de status, como `Working` ou `Shelling`.                             |
| Linhas de progresso | Atualizações compactas de execução usando os mesmos ícones de ferramenta e formatador de detalhes da saída detalhada. |

O rótulo aparece depois que o agente começa trabalho significativo e permanece ocupado
por cinco segundos ou emite um segundo evento de trabalho. Ele faz parte da lista rolante
de linhas de progresso, então o status inicial sai da visualização quando trabalho concreto
suficiente aparece. Respostas somente em texto simples não mostram um rascunho de progresso.
Linhas de progresso são adicionadas somente quando o agente emite atualizações úteis de trabalho,
por exemplo `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"` ou `✍️ Write: to /tmp/file`.
Por padrão, elas usam o mesmo modo explicativo compacto de `/verbose`; defina
`agents.defaults.toolProgressDetail: "raw"` ao depurar e também quiser comandos/detalhes
brutos anexados.
A resposta final substitui o rascunho quando possível; caso contrário, o
OpenClaw envia a resposta final normalmente e limpa ou para de atualizar o
rascunho de acordo com o transporte do canal.

## Escolha um modo

`channels.<channel>.streaming.mode` controla o comportamento visível em andamento:

| Modo       | Ideal para                         | O que aparece no chat                              |
| ---------- | ---------------------------------- | -------------------------------------------------- |
| `off`      | Canais silenciosos                 | Apenas a resposta final.                           |
| `partial`  | Ver o texto da resposta aparecer   | Um rascunho editado com o texto mais recente da resposta. |
| `block`    | Blocos maiores de prévia da resposta | Uma prévia atualizada ou anexada em blocos maiores. |
| `progress` | Turnos intensos com ferramentas ou de longa duração | Um rascunho de status, depois a resposta final.    |

Escolha `progress` quando os usuários se importam mais com "o que está acontecendo" do que em ver
o texto da resposta ser transmitido token por token.

Escolha `partial` quando a própria resposta é o sinal de progresso.

Escolha `block` quando quiser atualizações de prévia de rascunho em blocos de texto maiores. No
Discord e no Telegram, `streaming.mode: "block"` ainda é streaming de prévia, não
entrega normal em blocos. Use `streaming.block.enabled` ou o legado
`blockStreaming` quando quiser respostas normais em blocos.

## Configure rótulos

Rótulos de progresso ficam em `channels.<channel>.streaming.progress`.

O rótulo padrão é `auto`, que escolhe a partir do conjunto integrado de rótulos
de uma palavra do OpenClaw:

```text
Working
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
```

Use um rótulo fixo:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

Use seu próprio conjunto automático de rótulos:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

Oculte o rótulo e mostre apenas linhas de progresso:

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

## Controle linhas de progresso

Linhas de progresso são habilitadas por padrão no modo de progresso. Elas vêm de eventos reais
de execução: inícios de ferramentas, atualizações de itens, planos de tarefas, aprovações, saída de comandos,
resumos de patches e atividade semelhante do agente.

Ferramentas também podem emitir progresso tipado enquanto uma única chamada de ferramenta ainda está em execução.
É assim que uma busca ou pesquisa lenta pode atualizar o rascunho visível antes de a ferramenta
retornar seu resultado final. A atualização de progresso é um resultado parcial da ferramenta com
conteúdo de modelo vazio e metadados explícitos de canal público:

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

O OpenClaw renderiza somente `progress.text` na UI de progresso do canal. O
resultado normal da ferramenta ainda chega depois como `content` e `details`, e é a
única parte retornada ao modelo.

Ao adicionar progresso a uma ferramenta, use uma mensagem curta e genérica e atrase-a até
que a operação esteja pendente por tempo suficiente para ser útil:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Esse padrão significa que chamadas rápidas não mostram uma linha de progresso, chamadas longas mostram uma
enquanto ainda estão pendentes, e chamadas canceladas limpam o temporizador antes que progresso
obsoleto possa aparecer. Texto de progresso é um canal lateral de UI público, portanto não deve
incluir segredos, argumentos brutos, conteúdo buscado, saída de comandos ou texto de páginas.

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

`"explain"` é o padrão e mantém os rascunhos estáveis com rótulos concisos como
`🛠️ check JS syntax for /tmp/app.js`. `"raw"` anexa o comando/detalhe subjacente
quando disponível, o que é útil durante a depuração, mas mais ruidoso no chat.

Por exemplo, o mesmo comando aparece de formas diferentes dependendo do modo de detalhe:

| Modo      | Linha de progresso                                           |
| --------- | ------------------------------------------------------------ |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                         |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

Limite quantas linhas permanecem visíveis:

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

Linhas de progresso são compactadas automaticamente para reduzir o refluxo dos balões de chat enquanto o rascunho é editado.

O OpenClaw trunca linhas de progresso longas por padrão para que edições repetidas do rascunho não
quebrem linhas de forma diferente a cada atualização. O orçamento padrão por linha é de 120 caracteres.
Prosa é cortada em um limite de palavra, enquanto detalhes longos, como caminhos ou comandos brutos,
são encurtados com reticências no meio para que o sufixo permaneça visível.

Ajuste o orçamento por linha:

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

O Slack pode renderizar linhas de progresso como campos estruturados do Block Kit em vez de um
único corpo de texto:

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

A renderização rica mantém o mesmo fallback em texto simples para que canais e clientes que
não suportam o formato mais rico ainda possam mostrar o texto compacto de progresso.

Mantenha o único rascunho de progresso, mas oculte linhas de ferramentas e tarefas:

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
mais antigas de progresso de ferramentas para esse turno. O canal permanece visualmente silencioso até a
resposta final, exceto pelo rótulo se um estiver configurado.

## Comportamento dos canais

Cada canal usa o transporte mais limpo que suporta:

| Canal           | Transporte de progresso                | Observações                                                           |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envia uma mensagem e depois a edita.   | O texto final é editado no lugar quando cabe em uma mensagem de prévia segura. |
| Matrix          | Envia um evento e depois o edita.      | A configuração de streaming no nível da conta controla rascunhos no nível da conta. |
| Microsoft Teams | Stream nativo do Teams em chats pessoais. | `streaming.mode: "block"` mapeia para a entrega em blocos do Teams. |
| Slack           | Stream nativo ou postagem de rascunho editável. | A disponibilidade de thread afeta se o streaming nativo pode ser usado. |
| Telegram        | Envia uma mensagem e depois a edita.   | Rascunhos visíveis mais antigos podem ser substituídos para que os timestamps finais continuem úteis. |
| Mattermost      | Postagem de rascunho editável.         | A atividade de ferramentas é incorporada à mesma postagem em estilo de rascunho. |

Canais sem suporte seguro a edição geralmente recorrem a indicadores de digitação ou
entrega somente final.

## Finalização

Quando a resposta final está pronta, o OpenClaw tenta manter o chat limpo:

- Se o rascunho puder se tornar a resposta final com segurança, o OpenClaw o edita no lugar.
- Se o canal usa streaming de progresso nativo, o OpenClaw finaliza esse stream
  quando o transporte nativo aceita o texto final.
- Se a resposta final tem mídia, um prompt de aprovação, um alvo explícito de resposta,
  blocos demais ou uma edição/envio com falha, o OpenClaw envia a resposta final pelo
  caminho normal de entrega do canal.

O caminho de fallback é intencional. É melhor enviar uma resposta final nova do que
perder texto, encaminhar uma resposta para a thread errada ou sobrescrever um rascunho com uma carga útil que o canal
não consegue representar com segurança.

## Solução de problemas

**Vejo apenas a resposta final.**

Verifique se `channels.<channel>.streaming.mode` está definido como `progress` para a
conta ou canal que processou a mensagem. Alguns caminhos de grupo ou resposta citada podem
desabilitar prévias de rascunho para um turno quando o canal não consegue editar com segurança a
mensagem correta.

**Vejo o rótulo, mas nenhuma linha de ferramenta.**

Verifique `streaming.progress.toolProgress`. Se for `false`, o OpenClaw mantém o
comportamento de rascunho único, mas oculta linhas de progresso de ferramentas e tarefas.

**Vejo uma mensagem final nova em vez de um rascunho editado.**

Isso é um fallback de segurança. Pode acontecer com respostas de mídia, respostas longas,
alvos explícitos de resposta, rascunhos antigos do Telegram, alvos de thread do Slack ausentes,
mensagens de prévia excluídas ou falha na finalização de stream nativo.

**Ainda vejo mensagens independentes de progresso.**

O modo de progresso suprime mensagens independentes padrão de progresso de ferramentas quando um rascunho
está ativo. Se mensagens independentes ainda aparecerem, verifique se o turno está realmente
usando o modo de progresso e não `streaming.mode: "off"` ou um caminho de canal que
não consegue criar um rascunho para essa mensagem.

**O Teams se comporta de forma diferente do Discord ou Telegram.**

Microsoft Teams usa um fluxo nativo em conversas pessoais em vez do transporte genérico
de pré-visualização com envio e edição. Teams também trata `streaming.mode: "block"` como
entrega em blocos do Teams porque não tem o mesmo modo de bloco de rascunho de pré-visualização
usado pelo Discord e pelo Telegram.

## Relacionado

- [Streaming e divisão em partes](/pt-BR/concepts/streaming)
- [Mensagens](/pt-BR/concepts/messages)
- [Configuração de canais](/pt-BR/gateway/config-channels)
- [Discord](/pt-BR/channels/discord)
- [Matrix](/pt-BR/channels/matrix)
- [Microsoft Teams](/pt-BR/channels/msteams)
- [Slack](/pt-BR/channels/slack)
- [Telegram](/pt-BR/channels/telegram)
