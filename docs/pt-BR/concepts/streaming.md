---
read_when:
    - Explicação de como o streaming ou a divisão em blocos funciona nos canais
    - Alteração do comportamento de streaming de blocos ou fragmentação de canais
    - Depuração de respostas de bloco duplicadas/antecipadas ou do streaming de pré-visualização do canal
summary: Comportamento de streaming + fragmentação (respostas em blocos, streaming de pré-visualização do canal, mapeamento de modos)
title: Streaming e divisão em blocos
x-i18n:
    generated_at: "2026-07-16T12:25:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tem duas camadas de streaming independentes, e atualmente **não há
streaming real de deltas de tokens** para mensagens de canal:

- **Streaming em blocos (canais):** emite **blocos** concluídos conforme o assistente
  escreve. São mensagens normais do canal, não deltas de tokens.
- **Streaming de pré-visualização (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  atualiza uma **mensagem de pré-visualização** temporária durante a geração (envio + edições/acréscimos).

## Streaming em blocos (mensagens de canal)

O streaming em blocos envia a saída do assistente em partes maiores conforme ela fica disponível.

```text
Saída do modelo
  └─ text_delta/eventos
       ├─ (blockStreamingBreak=text_end)
       │    └─ o fragmentador emite blocos conforme o buffer aumenta
       └─ (blockStreamingBreak=message_end)
            └─ o fragmentador esvazia em message_end
                   └─ envio ao canal (respostas em blocos)
```

- `text_delta/events`: eventos de streaming do modelo (podem ser esparsos para modelos sem streaming).
- `chunker`: `EmbeddedBlockChunker` aplicando limites mín./máx. + preferência de quebra.
- `channel send`: mensagens de saída efetivas (respostas em blocos).

**Controles** (todos em `agents.defaults`, salvo indicação em contrário):

| Chave                                                        | Valores / formato                                                        | Padrão     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (mesclar blocos transmitidos antes do envio) | -          |
| `*.streaming.block.enabled` (substituição do canal)               | `true` / `false`, força o streaming em blocos por canal (e por conta)  | -          |
| `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`) | número, limite rígido                                                        | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | número, limite flexível de linhas que divide respostas altas para evitar cortes na interface | 17         |

`streaming.chunkMode: "newline"` divide em linhas em branco (limites de parágrafos),
não em cada nova linha, antes de recorrer à fragmentação por comprimento quando o texto
excede o limite.

Os canais incluídos expressam essas substituições como
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. As formas simples
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` são
legadas em todos os canais incluídos: `openclaw doctor --fix` as migra para
o formato aninhado, e os esquemas dos canais as rejeitam. As configurações de
plugins externos do SDK que ainda usam as formas simples continuam funcionando por meio
de um fallback obsoleto (com um aviso em tempo de execução) até o próximo ciclo de lançamento.

**Semântica dos limites** para `blockStreamingBreak`:

- `text_end`: transmite blocos assim que o fragmentador os emite; esvazia a cada `text_end`.
- `message_end`: aguarda a mensagem do assistente terminar e então esvazia a saída
  armazenada em buffer. Ainda usa o fragmentador se o texto armazenado exceder `maxChars`, portanto
  pode emitir vários fragmentos ao final.

### Entrega de mídia com streaming em blocos

A mídia transmitida deve usar campos de payload estruturados, como `mediaUrl` ou
`mediaUrls`; o texto transmitido não é interpretado como um comando de anexo. Quando o streaming em
blocos envia mídia antecipadamente, o OpenClaw registra essa entrega para o turno. Se
o payload final do assistente repetir a mesma URL de mídia, a entrega final remove
a mídia duplicada em vez de enviar o anexo novamente.

Payloads finais exatamente duplicados são suprimidos. Se o payload final adicionar
texto distinto ao redor de uma mídia que já foi transmitida, o OpenClaw ainda envia o
novo texto, mantendo uma única entrega da mídia. Isso evita notas de voz ou
arquivos duplicados em canais como o Telegram.

## Algoritmo de fragmentação (limites inferior/superior)

A fragmentação em blocos é implementada por `EmbeddedBlockChunker`:

- **Limite inferior:** não emite até que o buffer seja >= `minChars` (a menos que seja forçado).
- **Limite superior:** prioriza divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Cadeia de preferência de quebra:** `paragraph` -> `newline` -> `sentence` ->
  espaço em branco -> quebra rígida.
- **Cercas de código:** nunca divide dentro de cercas; quando forçado em `maxChars`, fecha
  e reabre a cerca para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, portanto não é possível exceder
os limites específicos de cada canal.

## Coalescência (mesclagem de blocos transmitidos)

Quando o streaming em blocos está ativado, o OpenClaw pode **mesclar fragmentos de
blocos consecutivos** antes de enviá-los, reduzindo o excesso de mensagens de uma só linha sem deixar de fornecer
uma saída progressiva.

- A coalescência aguarda **intervalos de inatividade** (`idleMs`) antes de esvaziar.
- Os buffers são limitados por `maxChars` e esvaziados quando excedem esse limite.
- `minChars` impede o envio de fragmentos minúsculos até que texto suficiente se acumule
  (o esvaziamento final sempre envia o texto restante).
- O separador é derivado de `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> espaço.
- Substituições por canal estão disponíveis por meio de `*.streaming.block.coalesce` (incluindo
  configurações por conta).
- Discord, Signal e Slack usam por padrão a coalescência `{ minChars: 1500, idleMs: 1000 }`,
  salvo substituição.

## Ritmo semelhante ao humano entre blocos

Quando o streaming em blocos está ativado, adiciona uma **pausa aleatória** entre as
respostas em blocos, após o primeiro bloco, para que respostas com várias mensagens pareçam mais naturais.

| `agents.defaults.humanDelay.mode` | Comportamento           |
| --------------------------------- | ----------------------- |
| `off` (padrão)                   | Sem pausa               |
| `natural`                         | Pausa aleatória de 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Substitua por agente por meio de `agents.list[].humanDelay`. Aplica-se somente a **respostas em
blocos**, não a respostas finais nem a resumos de ferramentas.

## "Transmitir fragmentos ou tudo"

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (emite à medida que avança). Canais que não sejam o Telegram também precisam de
  `*.streaming.block.enabled: true`.
- **Transmitir tudo ao final:** `blockStreamingBreak: "message_end"` (esvazia
  uma vez, possivelmente em vários fragmentos se for muito longo).
- **Sem streaming em blocos:** `blockStreamingDefault: "off"` (somente a resposta final).

O streaming em blocos fica **desativado, a menos que** `*.streaming.block.enabled` seja explicitamente
definido como `true` (exceção: o QQ Bot não tem chaves `streaming.block` e transmite
respostas em blocos, a menos que `channels.qqbot.streaming.mode` seja `"off"`). Os canais podem
transmitir uma pré-visualização ao vivo (`channels.<channel>.streaming.mode`) sem respostas em
blocos. Os padrões de `blockStreaming*` ficam em `agents.defaults`, não na
raiz da configuração.

## Modos de streaming de pré-visualização

Chave canônica: `channels.<channel>.streaming` (`{ mode, ... }` aninhada; formas
booleanas/de string legadas no nível superior são reescritas por `openclaw doctor --fix`).

| Modo       | Comportamento                                                         |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Desativa o streaming de pré-visualização                              |
| `partial`  | Pré-visualização única substituída pelo texto mais recente             |
| `block`    | Pré-visualização atualizada em etapas fragmentadas/acrescentadas       |
| `progress` | Pré-visualização de progresso/status durante a geração, resposta final ao concluir |

`streaming.mode: "block"` é um modo de streaming de pré-visualização para canais
com suporte a edição, como Discord e Telegram; por si só, ele não ativa a entrega em
blocos nesses canais. Use `streaming.block.enabled` para respostas normais em blocos.
O Microsoft Teams é a
exceção: ele não tem transporte de blocos para pré-visualizações de rascunho, portanto `streaming.mode:
"block"` desativa completamente o streaming nativo, e a resposta é entregue como uma
entrega normal em blocos, em vez de streaming nativo parcial/de progresso. O Mattermost também
é diferente: no modo `block`, ele alterna a pré-visualização entre texto concluído e
blocos de atividade de ferramentas, de modo que os blocos anteriores permaneçam visíveis como publicações separadas,
em vez de serem substituídos em um único rascunho editável.

### Mapeamento de canais

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Sim   | Sim       | Sim     | rascunho de progresso editável |
| Discord    | Sim   | Sim       | Sim     | rascunho de progresso editável |
| Slack      | Sim   | Sim       | Sim     | Sim                     |
| Mattermost | Sim   | Sim       | Sim     | Sim                     |
| MS Teams   | Sim   | Sim       | Sim     | streaming de progresso nativo |

A configuração de fragmentos da pré-visualização (`streaming.preview.chunk.*`, por exemplo, em
`channels.discord.streaming` ou `channels.telegram.streaming`) usa como padrão
`minChars: 200`, `maxChars: 800` (limitado ao `textChunkLimit` do canal) e
`breakPreference: "paragraph"`.

Somente para o Slack:

- `channels.slack.streaming.nativeTransport` alterna as chamadas da API de streaming nativo do Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) quando
  `channels.slack.streaming.mode="partial"` (padrão: `true`).
- O streaming nativo do Slack e o status da thread do assistente do Slack exigem um destino de
  thread de resposta. Mensagens diretas no nível superior não exibem essa pré-visualização no estilo de thread, mas ainda
  podem usar publicações e edições de pré-visualização de rascunho do Slack.

### Migração de chaves legadas

| Canal    | Chaves legadas                                              | Status                                                                                                                                               |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, `streaming` escalar/booleana                    | Reescrita como `streaming.mode` por `openclaw doctor --fix`; não é lida em tempo de execução                                                                        |
| Discord  | `streamMode`, `streaming` booleana                           | Reescrita como `streaming.mode` por `openclaw doctor --fix`; não é lida em tempo de execução                                                                        |
| Slack    | `streamMode`; `streaming` booleana; `nativeStreaming` legada | Reescrita como `streaming.mode` (e `streaming.nativeTransport` para as formas booleana/legada) por `openclaw doctor --fix`; não é lida em tempo de execução         |
| Matrix   | `streaming` escalar/booleana                                  | Reescrita como `streaming.mode` (incluindo o modo `"quiet"` do Matrix) por `openclaw doctor --fix`; não é lida em tempo de execução                                    |
| Feishu   | `streaming` booleana                                         | Reescrita como `streaming.mode` por `openclaw doctor --fix`; não é lida em tempo de execução                                                                        |
| QQ Bot   | `streaming` booleana; `streaming.c2cStreamApi`               | Reescrita como `streaming.mode` (e `streaming.nativeTransport` para as formas booleana/`c2cStreamApi`) por `openclaw doctor --fix`; não é lida em tempo de execução |

## Comportamento em tempo de execução

### Telegram

- Usa atualizações de pré-visualização com `sendMessage` + `editMessageText` em DMs e
  grupos/tópicos; o texto final edita a pré-visualização ativa no próprio local. Os rascunhos
  efêmeros de "digitação" de 30 segundos do Telegram (`sendMessageDraft`) não são usados para
  a transmissão contínua da resposta.
- Pré-visualizações iniciais curtas ainda usam debounce para a experiência de notificações push, mas
  são materializadas após um atraso limitado, para que execuções ativas não permaneçam visualmente silenciosas.
- Respostas finais longas reutilizam a mensagem de pré-visualização para o primeiro bloco e enviam apenas os
  blocos restantes.
- O modo `block` alterna a pré-visualização para uma nova mensagem em
  `streaming.preview.chunk.maxChars` (padrão 800, limitado ao limite de edição de 4096
  do Telegram); outros modos expandem uma única pré-visualização até 4096 caracteres.
- O modo `progress` mantém o progresso das ferramentas em um rascunho de status editável, materializa
  o rótulo de status quando a transmissão contínua da resposta está ativa, mas ainda não há
  nenhuma linha de ferramenta disponível, limpa o rascunho ao concluir e envia a resposta final
  pela entrega normal.
- Se a edição final falhar antes da confirmação do texto concluído, o OpenClaw usa
  a entrega final normal e limpa a pré-visualização obsoleta.
- A transmissão contínua da pré-visualização é ignorada quando a transmissão em blocos do Telegram está explicitamente
  ativada, para evitar transmissão duplicada.
- `/reasoning stream` pode gravar o raciocínio em uma pré-visualização temporária que é
  excluída após a entrega final.
- As respostas a citações selecionadas do Telegram são uma exceção: quando `replyToMode` não é
  `"off"` e há texto de citação selecionado, o OpenClaw ignora a transmissão da pré-visualização
  da resposta nessa interação (a resposta final deve passar pelo caminho nativo de resposta à
  citação), portanto as linhas de pré-visualização do progresso das ferramentas não podem ser renderizadas. As respostas
  à mensagem atual sem texto de citação selecionado continuam mantendo a transmissão da pré-visualização. Consulte a
  [documentação do canal Telegram](/pt-BR/channels/telegram) para obter detalhes.

### Discord

- Usa o envio e a edição de mensagens de pré-visualização.
- O modo `block` usa divisão do rascunho em blocos (`draftChunk`).
- A transmissão contínua da pré-visualização é ignorada quando a transmissão em blocos do Discord está explicitamente
  ativada.
- O modo `progress` acrescenta um pequeno recibo de atividade `-#` (contagens de pensamentos/chamadas
  de ferramentas e tempo decorrido) à resposta final e exclui o rascunho de status
  assim que essa resposta é entregue, para que canais movimentados não mantenham registros órfãos de ferramentas
  acima da resposta. Respostas finais de erro mantêm o rascunho como registro da interação
  com falha.
- Cargas finais de mídia, erro e resposta explícita cancelam pré-visualizações pendentes
  sem liberar um novo rascunho e, em seguida, usam a entrega normal.

### Slack

- `partial` pode usar a transmissão contínua nativa do Slack (`chat.startStream`/`append`/`stop`)
  quando disponível.
- `block` usa pré-visualizações de rascunho no estilo de acréscimo.
- `progress` usa o texto da pré-visualização de status e, depois, a resposta final.
- DMs de nível superior sem uma thread de resposta usam publicações e edições de pré-visualização de rascunho
  em vez da transmissão contínua nativa do Slack.
- A transmissão contínua de pré-visualizações nativas e de rascunho suprime respostas em blocos nessa interação, para que uma
  resposta do Slack seja transmitida por apenas um caminho de entrega.
- Cargas finais de mídia/erro e respostas finais de progresso não criam mensagens de rascunho
  descartáveis; apenas respostas finais de texto/bloco que podem editar a pré-visualização liberam o texto
  de rascunho pendente.

### Mattermost

- No modo `partial`, transmite o raciocínio e o texto parcial da resposta em uma única publicação
  de pré-visualização de rascunho, que é finalizada no próprio local quando é seguro enviar a resposta final.
- No modo `progress`, transmite o raciocínio e a atividade das ferramentas em uma única
  pré-visualização de status, que é finalizada no próprio local quando é seguro enviar a resposta final.
- No modo `block`, alterna entre publicações de texto concluído e de atividade das ferramentas;
  atualizações paralelas e consecutivas de ferramentas compartilham a publicação atual de atividade das ferramentas.
- Recorre ao envio de uma nova publicação final se a publicação de pré-visualização tiver sido excluída ou
  estiver indisponível no momento da finalização.
- Cargas finais de mídia/erro cancelam atualizações pendentes da pré-visualização antes da entrega
  normal, em vez de liberar uma publicação temporária de pré-visualização.

### Matrix

- As pré-visualizações de rascunho são finalizadas no próprio local quando o texto final pode reutilizar o evento
  de pré-visualização.
- Respostas finais somente de mídia, de erro e com incompatibilidade no destino da resposta cancelam atualizações pendentes da pré-visualização
  antes da entrega normal; uma pré-visualização obsoleta já visível é ocultada.

## Atualizações de pré-visualização do progresso das ferramentas

A transmissão contínua da pré-visualização também pode incluir atualizações de **progresso das ferramentas**: linhas curtas de status
como "pesquisando na Web", "lendo arquivo" ou "chamando ferramenta", que aparecem
na mesma mensagem de pré-visualização enquanto as ferramentas estão em execução, antes da resposta final.
No modo de servidor de aplicativo do Codex, as mensagens de preâmbulo/comentário do Codex usam esse mesmo
caminho de pré-visualização, portanto notas curtas de progresso como "Estou verificando..." podem ser transmitidas para o
rascunho editável sem se tornarem parte da resposta final. Isso mantém
interações de ferramentas com várias etapas visualmente ativas, em vez de silenciosas entre a primeira
pré-visualização do raciocínio e a resposta final.

Ferramentas de longa duração podem emitir progresso tipado antes de retornarem. Por exemplo,
`web_fetch` ativa um temporizador de cinco segundos ao iniciar: se a busca ainda estiver
pendente, a pré-visualização mostrará `Fetching page content...`; se a busca terminar ou
for cancelada antes disso, nenhuma linha de progresso será emitida. O resultado final posterior da ferramenta
ainda será entregue normalmente ao modelo.

Superfícies compatíveis:

- **Discord**, **Slack**, **Telegram** e **Matrix** transmitem o progresso das ferramentas e
  as atualizações de preâmbulo do Codex para a edição da pré-visualização ativa por padrão quando a transmissão
  contínua da pré-visualização está ativa. O Microsoft Teams usa seu fluxo nativo de progresso em
  conversas pessoais.
- O Telegram é fornecido com atualizações de pré-visualização do progresso das ferramentas ativadas desde
  `v2026.4.22`; mantê-las ativadas preserva esse comportamento lançado.
- O **Mattermost** incorpora a atividade das ferramentas em uma publicação de pré-visualização nos modos `partial` e
  `progress`, ou em uma publicação de atividade das ferramentas entre blocos de texto no modo `block`
  (consulte acima).
- As edições do progresso das ferramentas seguem o modo ativo de transmissão contínua da pré-visualização; elas são
  ignoradas quando a transmissão contínua da pré-visualização é `off` ou quando a transmissão em blocos
  assume o controle da mensagem. No Telegram, `streaming.mode: "off"` é apenas para o conteúdo final: a
  comunicação genérica de progresso também é suprimida, em vez de ser entregue como mensagens de status
  independentes, enquanto solicitações de aprovação, cargas de mídia e erros continuam sendo encaminhados
  normalmente.
- Para manter a transmissão contínua da pré-visualização, mas ocultar as linhas de progresso das ferramentas, defina
  `streaming.preview.toolProgress` como `false` para esse canal (padrão
  `true`). Para manter as linhas de progresso das ferramentas visíveis enquanto oculta o texto de comando/execução,
  defina `streaming.preview.commandText` como `"status"` ou
  `streaming.progress.commandText` como `"status"`; o padrão é `"raw"` para
  preservar o comportamento lançado. Essa política é compartilhada por canais de rascunho/progresso
  que usam o renderizador compacto de progresso do OpenClaw, incluindo Discord, Matrix,
  Microsoft Teams, Mattermost, pré-visualizações de rascunho do Slack e Telegram. Para desativar
  completamente as edições da pré-visualização, defina `streaming.mode` como `off`.

## Renderização do rascunho de progresso

Os rascunhos no modo de progresso (`streaming.progress.*`) são limitados e configuráveis por
canal:

| Chave                             | Padrão        | Comportamento                                                          |
| --------------------------------- | ------------- | ---------------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Máximo de linhas compactas de progresso mantidas abaixo do rótulo do rascunho |
| `streaming.progress.maxLineChars` | `120`         | Máximo de caracteres por linha compacta antes do truncamento (considerando palavras) |
| `streaming.progress.label`        | `"auto"`      | Título do rascunho; uma string personalizada ou `false` para ocultá-lo           |
| `streaming.progress.labels`       | conjunto integrado | Rótulos candidatos usados quando `label: "auto"`                    |

### Faixa de progresso de comentários

Além do progresso das ferramentas, o renderizador compacto de progresso pode exibir mais uma faixa
no rascunho:

- **`streaming.progress.commentary`** - renderiza o
  **comentário** anterior às ferramentas do modelo (uma breve narração como "Vou verificar... e depois...")
  intercalado com linhas de ferramentas no rascunho de progresso. No Discord e no Telegram, no modo de progresso,
  o mesmo preâmbulo fornece o título do status mesmo quando essa faixa opcional
  está desativada; outros canais mantêm o comportamento de progresso existente. Consulte
  [Rascunhos de progresso](/pt-BR/concepts/progress-drafts#status-headline).

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Mantenha as linhas de progresso visíveis, mas oculte o texto bruto de comando/execução:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Use a mesma estrutura em outra chave de canal de progresso compacto, por exemplo
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` ou pré-visualizações de rascunho do Slack. Para o modo de rascunho de progresso, coloque
a mesma política em `streaming.progress`:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## Relacionados

- [Refatoração do ciclo de vida das mensagens](/pt-BR/concepts/message-lifecycle-refactor) - design compartilhado de destino para pré-visualização, edição, transmissão contínua e finalização
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts) - mensagens visíveis de trabalho em andamento que são atualizadas durante interações longas
- [Mensagens](/pt-BR/concepts/messages) - ciclo de vida e entrega das mensagens
- [Nova tentativa](/pt-BR/concepts/retry) - comportamento de nova tentativa em caso de falha na entrega
- [Canais](/pt-BR/channels) - compatibilidade com transmissão contínua por canal
