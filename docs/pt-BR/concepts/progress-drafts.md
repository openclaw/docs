---
read_when:
    - Configurando atualizações de progresso visíveis para turnos de chat de longa duração
    - Escolhendo entre os modos de transmissão parcial, em bloco e de progresso
    - Explicando como o OpenClaw atualiza uma mensagem de canal enquanto o trabalho está em andamento
    - Solução de problemas de rascunhos de progresso, mensagens de progresso independentes ou mecanismo de contingência de finalização
summary: 'Rascunhos de progresso: uma mensagem visível de trabalho em andamento que é atualizada enquanto um agente é executado'
title: Rascunhos de progresso
x-i18n:
    generated_at: "2026-05-04T02:23:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Rascunhos de progresso fazem turnos de agentes de longa duração parecerem ativos no chat sem transformar a conversa em uma pilha de respostas temporárias de status.

Quando os rascunhos de progresso estão habilitados, o OpenClaw cria uma única mensagem visível de trabalho em andamento somente depois que o turno comprova que está fazendo trabalho real, atualiza essa mensagem enquanto o agente lê, planeja, chama ferramentas ou aguarda aprovação e, então, transforma esse rascunho na resposta final quando o canal consegue fazer isso com segurança.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Use rascunhos de progresso quando você quiser uma única mensagem de status organizada durante trabalhos com muitas ferramentas e a resposta final quando o turno terminar.

## Início Rápido

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

Isso geralmente é suficiente. O OpenClaw escolherá um rótulo automático de uma palavra, aguardará até que o trabalho dure pelo menos cinco segundos ou emita um segundo evento de trabalho, adicionará linhas compactas de progresso enquanto trabalho útil acontece e suprimirá mensagens independentes duplicadas de progresso nesse turno.

## O Que os Usuários Veem

Um rascunho de progresso tem duas partes:

| Parte               | Finalidade                                                                    |
| ------------------- | ----------------------------------------------------------------------------- |
| Rótulo              | Um título curto, como `Thinking...` ou `Shelling...`.                         |
| Linhas de progresso | Atualizações compactas de execução usando os mesmos rótulos e ícones da saída detalhada. |

O rótulo aparece depois que o agente inicia trabalho significativo e continua ocupado por cinco segundos ou emite um segundo evento de trabalho. Respostas somente em texto simples não mostram um rascunho de progresso. Linhas de progresso são adicionadas somente quando o agente emite atualizações úteis de trabalho, por exemplo `🛠️ Exec`, `🔎 Web Search` ou `✍️ Write: to /tmp/file`. Por padrão, elas usam o mesmo modo de explicação compacto de `/verbose`; defina `agents.defaults.toolProgressDetail: "raw"` ao depurar e também quiser comandos/detalhes brutos anexados.
A resposta final substitui o rascunho quando possível; caso contrário, o OpenClaw envia a resposta final normalmente e limpa ou para de atualizar o rascunho de acordo com o transporte do canal.

## Escolher Um Modo

`channels.<channel>.streaming.mode` controla o comportamento visível de andamento:

| Modo       | Melhor para                         | O que aparece no chat                               |
| ---------- | ----------------------------------- | --------------------------------------------------- |
| `off`      | Canais silenciosos                  | Somente a resposta final.                           |
| `partial`  | Ver o texto da resposta aparecer    | Um rascunho editado com o texto mais recente da resposta. |
| `block`    | Trechos maiores de prévia da resposta | Uma prévia atualizada ou anexada em trechos maiores. |
| `progress` | Turnos com muitas ferramentas ou longa duração | Um rascunho de status e, depois, a resposta final. |

Escolha `progress` quando os usuários se importam mais com "o que está acontecendo" do que com ver o texto da resposta ser transmitido token por token.

Escolha `partial` quando a própria resposta é o sinal de progresso.

Escolha `block` quando você quiser atualizações de prévia em rascunho em trechos maiores de texto. No Discord e no Telegram, `streaming.mode: "block"` ainda é streaming de prévia, não entrega normal em blocos. Use `streaming.block.enabled` ou o legado `blockStreaming` quando quiser respostas normais em bloco.

## Configurar Rótulos

Rótulos de progresso ficam em `channels.<channel>.streaming.progress`.

O rótulo padrão é `auto`, que escolhe a partir do conjunto integrado do OpenClaw de rótulos de uma palavra com reticências:

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

Oculte o rótulo e mostre somente as linhas de progresso:

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

## Controlar Linhas de Progresso

Linhas de progresso são habilitadas por padrão no modo de progresso. Elas vêm de eventos reais de execução: inícios de ferramentas, atualizações de itens, planos de tarefas, aprovações, saída de comandos, resumos de patches e atividades semelhantes do agente.

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

`"explain"` é o padrão e mantém os rascunhos estáveis com rótulos concisos como `🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` anexa o comando/detalhe subjacente quando disponível, o que é útil durante a depuração, mas deixa o chat mais ruidoso.

Por exemplo, o mesmo comando aparece de forma diferente dependendo do modo de detalhe:

| Modo      | Linha de progresso                                                   |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Com `toolProgress: false`, o OpenClaw ainda suprime as mensagens independentes antigas de progresso de ferramentas nesse turno. O canal permanece visualmente silencioso até a resposta final, exceto pelo rótulo se um estiver configurado.

## Comportamento do Canal

Cada canal usa o transporte mais limpo compatível:

| Canal           | Transporte de progresso                 | Observações                                                           |
| --------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envia uma mensagem e depois a edita.    | O texto final é editado no lugar quando cabe em uma mensagem segura de prévia. |
| Matrix          | Envia um evento e depois o edita.       | A configuração de streaming em nível de conta controla rascunhos em nível de conta. |
| Microsoft Teams | Stream nativo do Teams em chats pessoais. | `streaming.mode: "block"` mapeia para entrega em bloco do Teams.      |
| Slack           | Stream nativo ou publicação de rascunho editável. | A disponibilidade de thread afeta se o streaming nativo pode ser usado. |
| Telegram        | Envia uma mensagem e depois a edita.    | Rascunhos visíveis mais antigos podem ser substituídos para manter carimbos de data/hora finais úteis. |
| Mattermost      | Publicação de rascunho editável.        | A atividade de ferramentas é integrada à mesma publicação em estilo de rascunho. |

Canais sem suporte seguro a edição geralmente recorrem a indicadores de digitação ou entrega somente final.

## Finalização

Quando a resposta final está pronta, o OpenClaw tenta manter o chat limpo:

- Se o rascunho puder se tornar a resposta final com segurança, o OpenClaw o edita no lugar.
- Se o canal usa streaming de progresso nativo, o OpenClaw finaliza esse stream quando o transporte nativo aceita o texto final.
- Se a resposta final tiver mídia, um prompt de aprovação, um alvo de resposta explícito, blocos demais ou uma edição/envio com falha, o OpenClaw envia a resposta final pelo caminho normal de entrega do canal.

O caminho de fallback é intencional. É melhor enviar uma nova resposta final do que perder texto, encadear uma resposta na thread errada ou sobrescrever um rascunho com um payload que o canal não consegue representar com segurança.

## Solução de Problemas

**Vejo somente a resposta final.**

Verifique se `channels.<channel>.streaming.mode` está definido como `progress` para a conta ou o canal que processou a mensagem. Alguns caminhos de grupo ou resposta com citação podem desabilitar prévias de rascunho para um turno quando o canal não consegue editar a mensagem certa com segurança.

**Vejo o rótulo, mas nenhuma linha de ferramenta.**

Verifique `streaming.progress.toolProgress`. Se for `false`, o OpenClaw mantém o comportamento de rascunho único, mas oculta linhas de progresso de ferramentas e tarefas.

**Vejo uma nova mensagem final em vez de um rascunho editado.**

Isso é um fallback de segurança. Pode acontecer para respostas com mídia, respostas longas, alvos de resposta explícitos, rascunhos antigos do Telegram, alvos de thread ausentes no Slack, mensagens de prévia excluídas ou falha na finalização de stream nativo.

**Ainda vejo mensagens independentes de progresso.**

O modo de progresso suprime mensagens padrão independentes de progresso de ferramentas quando um rascunho está ativo. Se mensagens independentes ainda aparecerem, verifique se o turno está realmente usando o modo de progresso e não `streaming.mode: "off"` ou um caminho de canal que não consegue criar um rascunho para essa mensagem.

**O Teams se comporta de forma diferente do Discord ou do Telegram.**

O Microsoft Teams usa um stream nativo em chats pessoais em vez do transporte genérico de prévia por envio e edição. O Teams também trata `streaming.mode: "block"` como entrega em bloco do Teams porque não tem o mesmo modo de bloco de prévia em rascunho usado pelo Discord e pelo Telegram.

## Relacionado

- [Streaming e divisão em blocos](/pt-BR/concepts/streaming)
- [Mensagens](/pt-BR/concepts/messages)
- [Configuração de canais](/pt-BR/gateway/config-channels)
- [Discord](/pt-BR/channels/discord)
- [Matrix](/pt-BR/channels/matrix)
- [Microsoft Teams](/pt-BR/channels/msteams)
- [Slack](/pt-BR/channels/slack)
- [Telegram](/pt-BR/channels/telegram)
