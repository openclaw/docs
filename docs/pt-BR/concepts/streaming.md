---
read_when:
    - Explicando como o streaming ou a divisão em blocos funciona nos canais
    - Alteração do comportamento de streaming em blocos ou de divisão em partes do canal
    - Depuração de respostas em bloco duplicadas/antecipadas ou de streaming de pré-visualização do canal
summary: Comportamento de streaming + divisão em blocos (respostas em blocos, streaming de pré-visualização do canal, mapeamento de modos)
title: Streaming e divisão em blocos
x-i18n:
    generated_at: "2026-07-12T15:07:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7860a83183459ea3dd05c866118e14bc8469c7adcd074a25b6f4a1174cb1664d
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tem duas camadas de streaming independentes, e atualmente **não há
streaming verdadeiro de deltas de tokens** para mensagens de canal:

- **Streaming em blocos (canais):** emite **blocos** concluídos conforme o assistente
  escreve. Essas são mensagens normais do canal, não deltas de tokens.
- **Streaming de pré-visualização (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  atualiza uma **mensagem de pré-visualização** temporária durante a geração (envio + edições/acréscimos).

## Streaming em blocos (mensagens de canal)

O streaming em blocos envia a saída do assistente em partes maiores à medida que ela fica disponível.

```text
Saída do modelo
  └─ text_delta/eventos
       ├─ (blockStreamingBreak=text_end)
       │    └─ o fragmentador emite blocos conforme o buffer aumenta
       └─ (blockStreamingBreak=message_end)
            └─ o fragmentador descarrega em message_end
                   └─ envio pelo canal (respostas em blocos)
```

- `text_delta/events`: eventos de streaming do modelo (podem ser esparsos em modelos sem streaming).
- `chunker`: `EmbeddedBlockChunker` que aplica limites mín./máx. + preferência de quebra.
- `channel send`: mensagens de saída efetivas (respostas em blocos).

**Controles** (todos em `agents.defaults`, salvo indicação em contrário):

| Chave                                                        | Valores / formato                                                        | Padrão     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                          | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                            | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                                | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (mescla blocos transmitidos antes do envio) | -          |
| `*.blockStreaming` (substituição por canal)                  | `true` / `false`, força o streaming em blocos por canal (e por conta)     | -          |
| `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`) | número, limite rígido                                                | 4000       |
| `*.chunkMode`                                                | `"length"` / `"newline"`                                                  | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | número, limite flexível de linhas que divide respostas altas para evitar cortes na interface | 17         |

`chunkMode: "newline"` divide em linhas em branco (limites de parágrafos), não em cada
quebra de linha, antes de recorrer à fragmentação por comprimento quando o texto excede o
limite.

Canais com uma configuração `streaming` aninhada (Telegram, Discord, Slack, iMessage,
Microsoft Teams) especificam essas substituições como
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`; as formas planas
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` se aplicam
a canais sem essa configuração (por exemplo, Signal, IRC, Google Chat, WhatsApp,
Mattermost). Chaves planas obsoletas em canais com streaming aninhado são migradas por
`openclaw doctor --fix` e não são lidas em tempo de execução.

**Semântica dos limites** para `blockStreamingBreak`:

- `text_end`: transmite blocos assim que o fragmentador os emite; descarrega a cada `text_end`.
- `message_end`: aguarda até que a mensagem do assistente termine e, então, descarrega a saída
  armazenada em buffer. Ainda usa o fragmentador se o texto armazenado exceder `maxChars`, portanto
  pode emitir vários fragmentos ao final.

### Entrega de mídia com streaming em blocos

A mídia transmitida deve usar campos de payload estruturados, como `mediaUrl` ou
`mediaUrls`; o texto transmitido não é interpretado como um comando de anexo. Quando o streaming em
blocos envia mídia antecipadamente, o OpenClaw registra essa entrega para a interação. Se
o payload final do assistente repetir a mesma URL de mídia, a entrega final remove
a mídia duplicada em vez de enviar o anexo novamente.

Payloads finais exatamente duplicados são suprimidos. Se o payload final adicionar
texto distinto ao redor de uma mídia que já foi transmitida, o OpenClaw ainda envia o
novo texto, mantendo a mídia em uma única entrega. Isso evita mensagens de voz
ou arquivos duplicados em canais como o Telegram.

## Algoritmo de fragmentação (limites inferior/superior)

A fragmentação em blocos é implementada por `EmbeddedBlockChunker`:

- **Limite inferior:** não emite até que o buffer seja >= `minChars` (a menos que seja forçado).
- **Limite superior:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Cadeia de preferência de quebra:** `paragraph` -> `newline` -> `sentence` ->
  espaço em branco -> quebra rígida.
- **Cercas de código:** nunca divide dentro de cercas; quando forçado em `maxChars`, fecha
  e reabre a cerca para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, portanto não é possível exceder
os limites de cada canal.

## Coalescência (mesclagem de blocos transmitidos)

Quando o streaming em blocos está ativado, o OpenClaw pode **mesclar fragmentos de blocos
consecutivos** antes de enviá-los, reduzindo o excesso de mensagens de uma única linha e ainda fornecendo
uma saída progressiva.

- A coalescência aguarda **intervalos de inatividade** (`idleMs`) antes de enviar.
- Os buffers são limitados por `maxChars` e são enviados se excederem esse limite.
- `minChars` impede o envio de fragmentos pequenos até que texto suficiente seja acumulado
  (o envio final sempre envia o texto restante).
- O separador é derivado de `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> espaço.
- Substituições por canal estão disponíveis por meio de `*.blockStreamingCoalesce` (incluindo
  configurações por conta).
- Por padrão, Discord, Signal e Slack fazem a coalescência para `{ minChars: 1500, idleMs: 1000 }`,
  salvo substituição.

## Ritmo semelhante ao humano entre blocos

Quando o streaming em blocos estiver habilitado, adicione uma **pausa aleatória** entre as
respostas em blocos, após o primeiro bloco, para que respostas em múltiplos balões pareçam mais naturais.

| `agents.defaults.humanDelay.mode` | Comportamento                 |
| --------------------------------- | ----------------------------- |
| `off` (padrão)                    | Sem pausa                     |
| `natural`                         | Pausa aleatória de 800-2500ms |
| `custom`                          | `minMs`/`maxMs`               |

Substitua por agente por meio de `agents.list[].humanDelay`. Aplica-se somente a **respostas em
blocos**, não a respostas finais nem a resumos de ferramentas.

## "Transmitir blocos ou tudo"

- **Transmitir blocos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (emite conforme avança). Canais que não sejam o Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (envia
  uma vez, possivelmente em vários blocos se for muito longo).
- **Sem streaming em blocos:** `blockStreamingDefault: "off"` (somente a resposta final).

O streaming em blocos fica **desativado, a menos que** `*.blockStreaming` seja definido explicitamente como
`true`. Os canais podem transmitir uma prévia em tempo real (`channels.<channel>.streaming`)
sem respostas em blocos. Os padrões de `blockStreaming*` ficam em
`agents.defaults`, não na raiz da configuração.

## Modos de streaming de prévia

Chave canônica: `channels.<channel>.streaming` (`{ mode, ... }` aninhado; grafias booleanas/de string
legadas no nível superior são reescritas por `openclaw doctor --fix`).

| Modo       | Comportamento                                                               |
| ---------- | --------------------------------------------------------------------------- |
| `off`      | Desativa a transmissão da prévia                                             |
| `partial`  | Uma única prévia substituída pelo texto mais recente                         |
| `block`    | Atualizações da prévia em etapas segmentadas/anexadas                        |
| `progress` | Prévia de progresso/status durante a geração e resposta final ao concluir    |

`streaming.mode: "block"` é um modo de transmissão de prévia para canais com
suporte a edição, como Discord e Telegram; por si só, ele não habilita a entrega
em blocos nesses canais. Use `streaming.block.enabled` para respostas normais em
blocos (os canais sem uma configuração `streaming` aninhada continuam usando a
chave simples `blockStreaming`). O Microsoft Teams é a exceção: ele não possui
um transporte de prévia de rascunho em blocos; portanto, `streaming.mode:
"block"` desativa completamente a transmissão nativa, e a resposta é entregue
normalmente em blocos, em vez de usar a transmissão nativa parcial/de progresso.
O Mattermost também é diferente: no modo `block`, ele alterna a prévia entre
blocos de texto concluído e de atividade de ferramentas, de modo que os blocos
anteriores permanecem visíveis como publicações separadas, em vez de serem
sobrescritos em um único rascunho editável.

### Mapeamento de canais

| Canal      | `off` | `partial` | `block` | `progress`                   |
| ---------- | ----- | --------- | ------- | ---------------------------- |
| Telegram   | Sim   | Sim       | Sim     | rascunho de progresso editável |
| Discord    | Sim   | Sim       | Sim     | rascunho de progresso editável |
| Slack      | Sim   | Sim       | Sim     | Sim                          |
| Mattermost | Sim   | Sim       | Sim     | Sim                          |
| MS Teams   | Sim   | Sim       | Sim     | transmissão nativa de progresso |

A configuração de segmentos da prévia (`streaming.preview.chunk.*`, por exemplo,
em `channels.discord.streaming` ou `channels.telegram.streaming`) usa como padrão
`minChars: 200`, `maxChars: 800` (limitado ao `textChunkLimit` do canal) e
`breakPreference: "paragraph"`.

Somente para o Slack:

- `channels.slack.streaming.nativeTransport` ativa ou desativa as chamadas da API
  de transmissão nativa do Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) quando
  `channels.slack.streaming.mode="partial"` (padrão: `true`).
- A transmissão nativa do Slack e o status da thread do assistente do Slack
  exigem uma thread de resposta como destino. Mensagens diretas de nível
  superior não mostram essa prévia no estilo de thread, mas ainda podem usar
  publicações de prévia de rascunho e edições do Slack.

### Migração de chaves legadas

| Canal    | Chaves legadas                                              | Status                                                                                                                                                                                  |
| -------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, `streaming` escalar/booleano                  | Reescritas como `streaming.mode` por `openclaw doctor --fix`; não são lidas em tempo de execução                                                                                         |
| Discord  | `streamMode`, `streaming` booleano                          | Reescritas como `streaming.mode` por `openclaw doctor --fix`; não são lidas em tempo de execução                                                                                         |
| Slack    | `streamMode`; `streaming` booleano; `nativeStreaming` legado | Reescritas como `streaming.mode` (e `streaming.nativeTransport` para as formas booleanas/legadas) por `openclaw doctor --fix`; não são lidas em tempo de execução |

## Comportamento em tempo de execução

### Telegram

- Usa atualizações de prévia com `sendMessage` + `editMessageText` em DMs e
  grupos/tópicos; o texto final edita a prévia ativa no mesmo lugar. Os
  rascunhos efêmeros de "digitação" de 30 segundos do Telegram
  (`sendMessageDraft`) não são usados para streaming de respostas.
- As prévias iniciais curtas ainda usam debounce para melhorar a experiência
  das notificações push, mas se materializam após um atraso limitado, para que
  execuções ativas não permaneçam visualmente silenciosas.
- Respostas finais longas reutilizam a mensagem de prévia para o primeiro bloco
  e enviam somente os blocos restantes.
- O modo `block` alterna a prévia para uma nova mensagem ao atingir
  `streaming.preview.chunk.maxChars` (padrão 800, limitado ao limite de edição
  de 4096 do Telegram); outros modos expandem uma única prévia até 4096
  caracteres.
- O modo `progress` mantém o progresso das ferramentas em um rascunho de status
  editável, materializa o rótulo de status quando o streaming da resposta está
  ativo, mas ainda não há uma linha de ferramenta disponível, limpa o rascunho
  ao concluir e envia a resposta final pelo fluxo de entrega normal.
- Se a edição final falhar antes de o texto concluído ser confirmado, o
  OpenClaw usa a entrega final normal e remove a prévia obsoleta.
- O streaming de prévia é ignorado quando o streaming em blocos do Telegram
  está explicitamente ativado, para evitar streaming duplicado.
- `/reasoning stream` pode gravar o raciocínio em uma prévia transitória que é
  excluída após a entrega final.
- As respostas do Telegram com citação selecionada são uma exceção: quando
  `replyToMode` não é `"off"` e há texto de citação selecionado, o OpenClaw
  ignora o streaming de prévia da resposta nessa interação (a resposta final
  deve seguir o fluxo nativo de resposta com citação), portanto as linhas de
  prévia do progresso das ferramentas não podem ser renderizadas. Respostas à
  mensagem atual sem texto de citação selecionado continuam usando o streaming
  de prévia. Consulte a [documentação do canal Telegram](/pt-BR/channels/telegram)
  para obter detalhes.

### Discord

- Usa mensagens de prévia enviadas e editadas.
- O modo `block` usa divisão do rascunho em blocos (`draftChunk`).
- O streaming de prévia é ignorado quando o streaming em blocos do Discord está
  explicitamente ativado.
- O modo `progress` acrescenta um pequeno registro de atividade `-#` (contagens
  de pensamentos/chamadas de ferramentas e tempo decorrido) à resposta final e
  exclui o rascunho de status assim que essa resposta é entregue, para que
  canais movimentados não mantenham um registro órfão de ferramentas acima da
  resposta. Respostas finais com erro mantêm o rascunho como registro da
  interação que falhou.
- Payloads finais de mídia, erro e resposta explícita cancelam prévias
  pendentes sem descarregar um novo rascunho e, em seguida, usam a entrega
  normal.

### Slack

- O modo `partial` pode usar o streaming nativo do Slack
  (`chat.startStream`/`append`/`stop`) quando disponível.
- O modo `block` usa prévias de rascunho no estilo de anexação.
- O modo `progress` usa texto de prévia de status e, em seguida, a resposta
  final.
- DMs de nível superior sem uma thread de resposta usam publicações e edições
  de prévia de rascunho em vez do streaming nativo do Slack.
- O streaming nativo e o streaming de prévia de rascunho suprimem respostas em
  blocos nessa interação, para que uma resposta do Slack seja transmitida por
  apenas um fluxo de entrega.
- Payloads finais de mídia/erro e respostas finais de progresso não criam
  mensagens de rascunho descartáveis; somente respostas finais de texto/bloco
  que podem editar a prévia descarregam o texto de rascunho pendente.

### Mattermost

- No modo `partial`, transmite o raciocínio e o texto parcial da resposta em
  uma única publicação de prévia de rascunho, que é finalizada no mesmo lugar
  quando é seguro enviar a resposta final.
- No modo `progress`, transmite o raciocínio e a atividade das ferramentas em
  uma única prévia de status, que é finalizada no mesmo lugar quando é seguro
  enviar a resposta final.
- No modo `block`, alterna entre publicações de texto concluído e de atividade
  das ferramentas; atualizações de ferramentas paralelas e consecutivas
  compartilham a publicação atual de atividade das ferramentas.
- Recorre ao envio de uma nova publicação final se a publicação de prévia tiver
  sido excluída ou estiver indisponível no momento da finalização.
- Payloads finais de mídia/erro cancelam atualizações de prévia pendentes antes
  da entrega normal, em vez de descarregar uma publicação de prévia
  temporária.

### Matrix

- As prévias de rascunho são finalizadas no mesmo lugar quando o texto final
  pode reutilizar o evento de prévia.
- Respostas finais somente de mídia, com erro ou com destino de resposta
  incompatível cancelam atualizações de prévia pendentes antes da entrega
  normal; uma prévia obsoleta que já esteja visível é ocultada.

## Atualizações de prévia do progresso das ferramentas

O streaming de prévia também pode incluir atualizações de **progresso das
ferramentas**: linhas curtas de status, como "pesquisando na web", "lendo
arquivo" ou "chamando ferramenta", que aparecem na mesma mensagem de prévia
enquanto as ferramentas estão em execução, antes da resposta final. No modo
app-server do Codex, as mensagens de preâmbulo/comentário do Codex usam esse
mesmo fluxo de prévia, portanto notas curtas de progresso, como "Estou
verificando...", podem ser transmitidas para o rascunho editável sem fazer
parte da resposta final. Isso mantém as interações com ferramentas em várias
etapas visualmente ativas, em vez de silenciosas entre a primeira prévia de
raciocínio e a resposta final.

Ferramentas de longa duração podem emitir progresso tipado antes de
retornarem. Por exemplo, `web_fetch` inicia um temporizador de cinco segundos
quando começa: se a busca ainda estiver pendente, a prévia mostrará
`Fetching page content...`; se a busca terminar ou for cancelada antes disso,
nenhuma linha de progresso será emitida. O resultado final posterior da
ferramenta ainda será entregue normalmente ao modelo.

Superfícies compatíveis:

- **Discord**, **Slack**, **Telegram** e **Matrix** transmitem o progresso das
  ferramentas e as atualizações de preâmbulo do Codex para a edição da prévia
  ativa por padrão, quando o streaming de prévia está ativo. O Microsoft Teams
  usa seu streaming nativo de progresso em conversas pessoais.
- O Telegram inclui atualizações de prévia do progresso das ferramentas
  ativadas desde a `v2026.4.22`; mantê-las ativadas preserva esse comportamento
  lançado.
- O **Mattermost** incorpora a atividade das ferramentas em uma publicação de
  prévia nos modos `partial` e `progress`, ou em uma publicação de atividade
  das ferramentas entre blocos de texto no modo `block` (veja acima).
- As edições de progresso das ferramentas seguem o modo ativo de streaming de
  prévia; elas são ignoradas quando o streaming de prévia está `off` ou quando
  o streaming em blocos assumiu o controle da mensagem. No Telegram,
  `streaming.mode: "off"` envia apenas a resposta final: mensagens genéricas
  de progresso também são suprimidas, em vez de entregues como mensagens de
  status independentes, enquanto solicitações de aprovação, payloads de mídia
  e erros continuam sendo encaminhados normalmente.
- Para manter o streaming de prévia, mas ocultar as linhas de progresso das
  ferramentas, defina `streaming.preview.toolProgress` como `false` para esse
  canal (padrão `true`). Para manter as linhas de progresso das ferramentas
  visíveis e ocultar o texto de comando/execução, defina
  `streaming.preview.commandText` como `"status"` ou
  `streaming.progress.commandText` como `"status"`; o padrão é `"raw"` para
  preservar o comportamento lançado. Essa política é compartilhada pelos
  canais de rascunho/progresso que usam o renderizador compacto de progresso
  do OpenClaw, incluindo Discord, Matrix, Microsoft Teams, Mattermost, prévias
  de rascunho do Slack e Telegram. Para desativar completamente as edições de
  prévia, defina `streaming.mode` como `off`.

## Renderização do rascunho de progresso

Os rascunhos do modo de progresso (`streaming.progress.*`) têm limites e podem
ser configurados por canal:

| Chave                             | Padrão          | Comportamento                                                        |
| --------------------------------- | --------------- | ------------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`             | Máximo de linhas compactas de progresso mantidas abaixo do rótulo do rascunho |
| `streaming.progress.maxLineChars` | `120`           | Máximo de caracteres por linha compacta antes do truncamento (considera palavras) |
| `streaming.progress.label`        | `"auto"`        | Título do rascunho; uma string personalizada ou `false` para ocultá-lo |
| `streaming.progress.labels`       | conjunto interno | Rótulos candidatos usados quando `label: "auto"`                    |

### Fluxo de progresso de comentários

Além do progresso das ferramentas, o renderizador compacto de progresso pode
exibir mais um fluxo no rascunho:

- **`streaming.progress.commentary`** - renderiza o **comentário** do modelo
  antes da ferramenta (uma breve narração como "Vou verificar... e depois...")
  intercalado com as linhas das ferramentas no rascunho de progresso.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Mantenha as linhas de progresso visíveis, mas oculte o texto bruto de
comando/execução:

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

Use a mesma estrutura em outra chave de canal com progresso compacto, por
exemplo, `channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` ou nas prévias de rascunho do Slack. Para o modo de
rascunho de progresso, coloque a mesma política em `streaming.progress`:

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

- [Refatoração do ciclo de vida das mensagens](/pt-BR/concepts/message-lifecycle-refactor) - design compartilhado pretendido para prévia, edição, streaming e finalização
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts) - mensagens visíveis de trabalho em andamento que são atualizadas durante interações longas
- [Mensagens](/pt-BR/concepts/messages) - ciclo de vida e entrega de mensagens
- [Nova tentativa](/pt-BR/concepts/retry) - comportamento de nova tentativa em caso de falha na entrega
- [Canais](/pt-BR/channels) - suporte a streaming por canal
