---
read_when:
    - Configurando atualizações visíveis de progresso para turnos de chat de longa duração
    - Escolhendo entre os modos de streaming parcial, em bloco e de progresso
    - Explicando como o OpenClaw atualiza uma mensagem de canal enquanto o trabalho está em andamento
    - Solução de problemas de rascunhos de progresso, mensagens de progresso independentes ou alternativa de finalização
summary: 'Rascunhos de progresso: uma mensagem visível de trabalho em andamento que é atualizada enquanto um agente é executado'
title: Rascunhos de progresso
x-i18n:
    generated_at: "2026-05-03T21:30:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Rascunhos de progresso fazem turnos longos de agentes parecerem vivos no chat sem transformar
a conversa em uma pilha de respostas temporárias de status.

Quando os rascunhos de progresso estão habilitados, o OpenClaw cria uma mensagem visível
de trabalho em andamento, atualiza-a enquanto o agente lê, planeja, chama ferramentas ou
aguarda aprovação, e então transforma esse rascunho na resposta final quando o canal pode
fazer isso com segurança.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

Use rascunhos de progresso quando você quiser uma única mensagem de status organizada durante trabalhos
com muitas ferramentas e a resposta final quando o turno terminar.

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

Isso geralmente é suficiente. O OpenClaw escolherá um rótulo automático de uma palavra, adicionará
linhas compactas de progresso enquanto trabalho útil acontece e suprimirá conversas de progresso
autônomas duplicadas para esse turno.

## O Que os Usuários Veem

Um rascunho de progresso tem duas partes:

| Parte              | Finalidade                                                       |
| ------------------ | ---------------------------------------------------------------- |
| Rótulo             | Um título curto como `Thinking` ou `Shelling`.                   |
| Linhas de progresso | Atualizações compactas da execução, como chamadas de ferramentas, etapas de tarefa ou aprovações. |

O rótulo aparece imediatamente quando o agente começa a responder. Linhas de progresso são
adicionadas somente quando o agente emite atualizações úteis de trabalho. A resposta final substitui
o rascunho quando possível; caso contrário, o OpenClaw envia a resposta final normalmente e
limpa ou para de atualizar o rascunho de acordo com o transporte do canal.

## Escolher Um Modo

`channels.<channel>.streaming.mode` controla o comportamento visível de andamento:

| Modo       | Melhor para                      | O que aparece no chat                             |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Canais silenciosos               | Somente a resposta final.                         |
| `partial`  | Ver o texto da resposta aparecer | Um rascunho editado com o texto mais recente da resposta. |
| `block`    | Trechos maiores de prévia da resposta | Uma prévia atualizada ou anexada em trechos maiores. |
| `progress` | Turnos com muitas ferramentas ou de longa duração | Um rascunho de status, depois a resposta final. |

Escolha `progress` quando os usuários se importam mais com "o que está acontecendo" do que em assistir
ao texto da resposta ser transmitido token por token.

Escolha `partial` quando a própria resposta é o sinal de progresso.

Escolha `block` quando você quiser atualizações de prévia em rascunho em trechos de texto maiores. No
Discord e Telegram, `streaming.mode: "block"` ainda é transmissão de prévia, não
entrega normal em blocos. Use `streaming.block.enabled` ou o legado
`blockStreaming` quando quiser respostas normais em blocos.

## Configurar Rótulos

Rótulos de progresso ficam em `channels.<channel>.streaming.progress`.

O rótulo padrão é `auto`, que escolhe do conjunto integrado de rótulos de uma palavra do OpenClaw:

```text
Thinking
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

Linhas de progresso são habilitadas por padrão no modo de progresso. Elas vêm de eventos reais de execução:
inícios de ferramentas, atualizações de itens, planos de tarefa, aprovações, saída de comandos, resumos
de patches e atividades semelhantes do agente.

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

Com `toolProgress: false`, o OpenClaw ainda suprime as mensagens autônomas mais antigas
de progresso de ferramentas para esse turno. O canal permanece visualmente silencioso até a
resposta final, exceto pelo rótulo se algum estiver configurado.

## Comportamento do Canal

Cada canal usa o transporte mais limpo compatível:

| Canal           | Transporte de progresso             | Observações                                                           |
| --------------- | ----------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envia uma mensagem e depois a edita. | O texto final é editado no local quando cabe em uma mensagem de prévia segura. |
| Matrix          | Envia um evento e depois o edita.    | A configuração de transmissão no nível da conta controla rascunhos no nível da conta. |
| Microsoft Teams | Stream nativo do Teams em chats pessoais. | `streaming.mode: "block"` é mapeado para entrega em blocos do Teams. |
| Slack           | Stream nativo ou publicação de rascunho editável. | A disponibilidade de thread afeta se a transmissão nativa pode ser usada. |
| Telegram        | Envia uma mensagem e depois a edita. | Rascunhos visíveis mais antigos podem ser substituídos para que os carimbos de data/hora finais continuem úteis. |
| Mattermost      | Publicação de rascunho editável.    | A atividade de ferramentas é incorporada à mesma publicação em estilo de rascunho. |

Canais sem suporte seguro a edição geralmente recorrem a indicadores de digitação ou
entrega somente final.

## Finalização

Quando a resposta final está pronta, o OpenClaw tenta manter o chat limpo:

- Se o rascunho puder se tornar a resposta final com segurança, o OpenClaw o edita no local.
- Se o canal usa transmissão nativa de progresso, o OpenClaw finaliza esse stream
  quando o transporte nativo aceita o texto final.
- Se a resposta final tiver mídia, um prompt de aprovação, um destino explícito de resposta,
  muitos trechos ou uma edição/envio com falha, o OpenClaw envia a resposta final pelo
  caminho normal de entrega do canal.

O caminho alternativo é intencional. É melhor enviar uma nova resposta final do que
perder texto, direcionar uma resposta para a thread errada ou sobrescrever um rascunho com uma carga que o canal
não consegue representar com segurança.

## Solução de Problemas

**Vejo apenas a resposta final.**

Verifique se `channels.<channel>.streaming.mode` está definido como `progress` para a
conta ou canal que tratou a mensagem. Alguns caminhos de grupo ou resposta citada podem
desabilitar prévias de rascunho para um turno quando o canal não consegue editar com segurança a
mensagem correta.

**Vejo o rótulo, mas nenhuma linha de ferramenta.**

Verifique `streaming.progress.toolProgress`. Se for `false`, o OpenClaw mantém o
comportamento de rascunho único, mas oculta linhas de progresso de ferramentas e tarefas.

**Vejo uma nova mensagem final em vez de um rascunho editado.**

Isso é um fallback de segurança. Pode acontecer com respostas com mídia, respostas longas,
destinos explícitos de resposta, rascunhos antigos do Telegram, destinos de thread ausentes no Slack,
mensagens de prévia excluídas ou falha na finalização de stream nativo.

**Ainda vejo mensagens autônomas de progresso.**

O modo de progresso suprime mensagens padrão autônomas de progresso de ferramentas quando um rascunho
está ativo. Se mensagens autônomas ainda aparecerem, verifique se o turno está realmente
usando o modo de progresso e não `streaming.mode: "off"` ou um caminho de canal que
não consegue criar um rascunho para essa mensagem.

**O Teams se comporta de forma diferente do Discord ou Telegram.**

O Microsoft Teams usa um stream nativo em chats pessoais em vez do transporte genérico
de prévia por envio e edição. O Teams também trata `streaming.mode: "block"` como
entrega em blocos do Teams porque ele não tem o mesmo modo de bloco de prévia em rascunho
usado pelo Discord e Telegram.

## Relacionados

- [Transmissão e divisão em trechos](/pt-BR/concepts/streaming)
- [Mensagens](/pt-BR/concepts/messages)
- [Configuração de canais](/pt-BR/gateway/config-channels)
- [Discord](/pt-BR/channels/discord)
- [Matrix](/pt-BR/channels/matrix)
- [Microsoft Teams](/pt-BR/channels/msteams)
- [Slack](/pt-BR/channels/slack)
- [Telegram](/pt-BR/channels/telegram)
