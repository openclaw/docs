---
read_when:
    - Configurando atualizações visíveis de progresso para turnos de chat de longa duração
    - Escolhendo entre os modos de streaming parcial, em bloco e de progresso
    - Explicando como o OpenClaw atualiza uma mensagem de canal enquanto o trabalho está em andamento
    - Solução de problemas de rascunhos de progresso, mensagens de progresso independentes ou alternativa de finalização
summary: 'Rascunhos de progresso: uma mensagem visível de trabalho em andamento que é atualizada durante a execução de um agente'
title: Rascunhos de progresso
x-i18n:
    generated_at: "2026-05-10T19:32:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d84027a412a2c62ea9a5698d015c7aeb8a7f27d9db79112bb2c1c10f97ebd88
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Rascunhos de progresso fazem turnos longos do agente parecerem vivos no chat sem transformar
a conversa em uma pilha de respostas temporárias de status.

Quando rascunhos de progresso estão habilitados, o OpenClaw cria uma única mensagem
visível de trabalho em andamento apenas depois que o turno demonstra que está fazendo
trabalho real, atualiza essa mensagem enquanto o agente lê, planeja, chama ferramentas
ou aguarda aprovação, e então transforma esse rascunho na resposta final quando o canal
pode fazer isso com segurança.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Use rascunhos de progresso quando quiser uma única mensagem de status organizada durante
trabalhos com muitas ferramentas e a resposta final quando o turno terminar.

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

Isso geralmente basta. O OpenClaw escolherá um rótulo automático de uma palavra,
aguardará até que o trabalho dure pelo menos cinco segundos ou emita um segundo
evento de trabalho, adicionará linhas compactas de progresso enquanto trabalho útil
acontece e suprimirá conversas de progresso autônomas duplicadas nesse turno.

## O que os usuários veem

Um rascunho de progresso tem duas partes:

| Parte               | Finalidade                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Rótulo              | Uma linha curta inicial/de status, como `Thinking...` ou `Shelling...`.                           |
| Linhas de progresso | Atualizações compactas de execução usando os mesmos ícones de ferramenta e formatador de detalhes da saída detalhada. |

O rótulo aparece depois que o agente inicia trabalho significativo e permanece ocupado
por cinco segundos ou emite um segundo evento de trabalho. Ele faz parte da lista
contínua de linhas de progresso, então o status inicial rola para fora assim que
trabalho concreto suficiente aparece. Respostas apenas em texto simples não mostram
um rascunho de progresso. Linhas de progresso são adicionadas apenas quando o agente
emite atualizações úteis de trabalho, por exemplo `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"` ou `✍️ Write: to /tmp/file`.
Por padrão, elas usam o mesmo modo compacto de explicação que `/verbose`; defina
`agents.defaults.toolProgressDetail: "raw"` ao depurar e quando também quiser comandos/detalhes
brutos anexados.
A resposta final substitui o rascunho quando possível; caso contrário, o OpenClaw envia
a resposta final normalmente e limpa ou para de atualizar o rascunho de acordo com o
transporte do canal.

## Escolha um modo

`channels.<channel>.streaming.mode` controla o comportamento visível em andamento:

| Modo       | Melhor para                         | O que aparece no chat                              |
| ---------- | ----------------------------------- | ------------------------------------------------- |
| `off`      | Canais silenciosos                  | Apenas a resposta final.                          |
| `partial`  | Acompanhar o texto da resposta aparecer | Um rascunho editado com o texto mais recente da resposta. |
| `block`    | Blocos maiores de prévia da resposta | Uma prévia atualizada ou anexada em blocos maiores. |
| `progress` | Turnos com muitas ferramentas ou de longa duração | Um rascunho de status, depois a resposta final.   |

Escolha `progress` quando os usuários se importam mais com "o que está acontecendo"
do que em ver o texto da resposta ser transmitido token por token.

Escolha `partial` quando a própria resposta é o sinal de progresso.

Escolha `block` quando quiser atualizações de prévia do rascunho em blocos maiores
de texto. No Discord e no Telegram, `streaming.mode: "block"` ainda é streaming de
prévia, não entrega normal em blocos. Use `streaming.block.enabled` ou o legado
`blockStreaming` quando quiser respostas normais em blocos.

## Configure rótulos

Rótulos de progresso ficam em `channels.<channel>.streaming.progress`.

O rótulo padrão é `auto`, que escolhe a partir do conjunto integrado do OpenClaw
de rótulos de uma palavra com reticências:

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
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

Linhas de progresso são habilitadas por padrão no modo de progresso. Elas vêm de
eventos reais de execução: inícios de ferramentas, atualizações de itens, planos de
tarefas, aprovações, saída de comandos, resumos de patches e atividade semelhante
do agente.

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
quando disponível, o que é útil durante a depuração, mas gera mais ruído no chat.

Por exemplo, o mesmo comando aparece de forma diferente dependendo do modo de detalhe:

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

Linhas de progresso são compactadas automaticamente para reduzir o refluxo do balão de chat enquanto o rascunho é editado.

O OpenClaw trunca linhas longas de progresso por padrão para que edições repetidas
do rascunho não quebrem linha de forma diferente a cada atualização. O prefixo
permanece legível, e detalhes longos, como caminhos ou comandos brutos, são encurtados
com reticências.

O Slack pode renderizar linhas de progresso como campos estruturados do Block Kit em
vez de um único corpo de texto:

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

A renderização rica mantém o mesmo fallback de texto simples para que canais e clientes
que não aceitam o formato mais rico ainda possam mostrar o texto compacto de progresso.

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

Com `toolProgress: false`, o OpenClaw ainda suprime as mensagens autônomas antigas
de progresso de ferramentas nesse turno. O canal permanece visualmente silencioso até
a resposta final, exceto pelo rótulo se houver um configurado.

## Comportamento por canal

Cada canal usa o transporte mais limpo que aceita:

| Canal           | Transporte de progresso                  | Observações                                                           |
| --------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envia uma mensagem e depois a edita.     | O texto final é editado no lugar quando cabe em uma mensagem de prévia segura. |
| Matrix          | Envia um evento e depois o edita.        | A configuração de streaming no nível da conta controla rascunhos no nível da conta. |
| Microsoft Teams | Stream nativo do Teams em chats pessoais. | `streaming.mode: "block"` mapeia para entrega em blocos do Teams.     |
| Slack           | Stream nativo ou publicação de rascunho editável. | A disponibilidade de thread afeta se o streaming nativo pode ser usado. |
| Telegram        | Envia uma mensagem e depois a edita.     | Rascunhos visíveis antigos podem ser substituídos para que timestamps finais continuem úteis. |
| Mattermost      | Publicação de rascunho editável.         | A atividade de ferramentas é incorporada à mesma publicação em estilo de rascunho. |

Canais sem suporte seguro a edição geralmente fazem fallback para indicadores de digitação
ou entrega apenas da resposta final.

## Finalização

Quando a resposta final está pronta, o OpenClaw tenta manter o chat limpo:

- Se o rascunho puder se tornar a resposta final com segurança, o OpenClaw o edita no lugar.
- Se o canal usa streaming nativo de progresso, o OpenClaw finaliza esse stream
  quando o transporte nativo aceita o texto final.
- Se a resposta final tiver mídia, um prompt de aprovação, um alvo explícito de resposta,
  chunks demais ou uma falha de edição/envio, o OpenClaw envia a resposta final pelo
  caminho normal de entrega do canal.

O caminho de fallback é intencional. É melhor enviar uma nova resposta final do que
perder texto, colocar uma resposta na thread errada ou sobrescrever um rascunho com
uma carga útil que o canal não consegue representar com segurança.

## Solução de problemas

**Vejo apenas a resposta final.**

Verifique se `channels.<channel>.streaming.mode` está definido como `progress` para
a conta ou o canal que processou a mensagem. Alguns caminhos de grupo ou resposta
citada podem desabilitar prévias de rascunho em um turno quando o canal não consegue
editar a mensagem correta com segurança.

**Vejo o rótulo, mas nenhuma linha de ferramenta.**

Verifique `streaming.progress.toolProgress`. Se for `false`, o OpenClaw mantém o
comportamento de rascunho único, mas oculta linhas de progresso de ferramentas e tarefas.

**Vejo uma nova mensagem final em vez de um rascunho editado.**

Isso é um fallback de segurança. Pode acontecer com respostas de mídia, respostas longas,
alvos explícitos de resposta, rascunhos antigos do Telegram, alvos de thread ausentes no
Slack, mensagens de prévia excluídas ou falha na finalização de stream nativo.

**Ainda vejo mensagens autônomas de progresso.**

O modo de progresso suprime mensagens autônomas padrão de progresso de ferramentas quando
um rascunho está ativo. Se mensagens autônomas ainda aparecerem, verifique se o turno está
realmente usando o modo de progresso e não `streaming.mode: "off"` ou um caminho de canal
que não consegue criar um rascunho para essa mensagem.

**O Teams se comporta de forma diferente do Discord ou do Telegram.**

O Microsoft Teams usa um stream nativo em chats pessoais em vez do transporte genérico de
envio e edição de prévia. O Teams também trata `streaming.mode: "block"` como entrega em
blocos do Teams porque não tem o mesmo modo de bloco de prévia de rascunho usado pelo
Discord e pelo Telegram.

## Relacionados

- [Streaming e fragmentação](/pt-BR/concepts/streaming)
- [Mensagens](/pt-BR/concepts/messages)
- [Configuração de canais](/pt-BR/gateway/config-channels)
- [Discord](/pt-BR/channels/discord)
- [Matrix](/pt-BR/channels/matrix)
- [Microsoft Teams](/pt-BR/channels/msteams)
- [Slack](/pt-BR/channels/slack)
- [Telegram](/pt-BR/channels/telegram)
