---
read_when:
    - Explicando como funcionam a transmissão em fluxo ou a fragmentação nos canais
    - Alteração do comportamento de transmissão de blocos ou de fragmentação de canais
    - Depuração de respostas de bloco duplicadas/antecipadas ou streaming de pré-visualização do canal
summary: Comportamento de transmissão + fragmentação (respostas em bloco, transmissão de prévia do canal, mapeamento de modos)
title: Transmissão contínua e fragmentação
x-i18n:
    generated_at: "2026-05-06T05:52:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tem duas camadas separadas de streaming:

- **Streaming em blocos (canais):** emite **blocos** concluídos enquanto o assistente escreve. Estas são mensagens normais de canal (não deltas de token).
- **Streaming de pré-visualização (Telegram/Discord/Slack):** atualiza uma **mensagem de pré-visualização** temporária durante a geração.

Atualmente, **não há streaming real de delta de token** para mensagens de canal. O streaming de pré-visualização é baseado em mensagens (envio + edições/acréscimos).

## Streaming em blocos (mensagens de canal)

O streaming em blocos envia a saída do assistente em partes maiores conforme ela fica disponível.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legenda:

- `text_delta/events`: eventos de stream do modelo (podem ser esparsos para modelos sem streaming).
- `chunker`: `EmbeddedBlockChunker` aplicando limites mínimo/máximo + preferência de quebra.
- `channel send`: mensagens de saída reais (respostas em bloco).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desativado por padrão).
- Substituições de canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos transmitidos antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de divisão do canal: `*.chunkMode` (`length` por padrão, `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por comprimento).
- Limite flexível do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar corte na UI.

**Semântica de limite:**

- `text_end`: transmite blocos assim que o chunker emite; faz flush em cada `text_end`.
- `message_end`: espera até a mensagem do assistente terminar e então faz flush da saída em buffer.

`message_end` ainda usa o chunker se o texto em buffer exceder `maxChars`, então ele pode emitir múltiplos chunks no final.

### Entrega de mídia com streaming em blocos

Diretivas `MEDIA:` são metadados normais de entrega. Quando o streaming em blocos envia um
bloco de mídia antecipadamente, o OpenClaw lembra essa entrega para o turno. Se o payload
final do assistente repetir a mesma URL de mídia, a entrega final remove a mídia
duplicada em vez de enviar o anexo novamente.

Payloads finais exatamente duplicados são suprimidos. Se o payload final adiciona
texto distinto ao redor da mídia que já foi transmitida, o OpenClaw ainda envia o
novo texto mantendo a mídia com entrega única. Isso evita notas de voz ou arquivos
duplicados em canais como Telegram quando um agente emite `MEDIA:` durante o
streaming e o provedor também a inclui na resposta concluída.

## Algoritmo de chunking (limites baixo/alto)

A divisão em blocos é implementada por `EmbeddedBlockChunker`:

- **Limite baixo:** não emite até o buffer >= `minChars` (a menos que forçado).
- **Limite alto:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Cercas de código:** nunca divide dentro de cercas; quando forçado em `maxChars`, fecha + reabre a cerca para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, então você não consegue exceder os limites por canal.

## Coalescing (mesclar blocos transmitidos)

Quando o streaming em blocos está ativado, o OpenClaw pode **mesclar chunks de blocos consecutivos**
antes de enviá-los. Isso reduz "spam de uma linha" e ainda fornece
saída progressiva.

- O coalescing espera por **intervalos ociosos** (`idleMs`) antes de fazer flush.
- Os buffers são limitados por `maxChars` e farão flush se excederem esse limite.
- `minChars` impede o envio de fragmentos minúsculos até que texto suficiente se acumule
  (o flush final sempre envia o texto restante).
- O joiner é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Substituições de canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão do coalesce é aumentado para 1500 para Signal/Slack/Discord, a menos que seja substituído.

## Ritmo semelhante ao humano entre blocos

Quando o streaming em blocos está ativado, você pode adicionar uma **pausa randomizada** entre
respostas em bloco (após o primeiro bloco). Isso faz respostas com múltiplas bolhas parecerem
mais naturais.

- Configuração: `agents.defaults.humanDelay` (substitua por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em bloco**, não a respostas finais ou resumos de ferramentas.

## "Transmitir chunks ou tudo"

Isso corresponde a:

- **Transmitir chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite conforme avança). Canais que não são Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (faz flush uma vez, possivelmente em múltiplos chunks se for muito longo).
- **Sem streaming em blocos:** `blockStreamingDefault: "off"` (apenas resposta final).

**Observação sobre canais:** O streaming em blocos fica **desativado a menos que**
`*.blockStreaming` seja definido explicitamente como `true`. Os canais podem transmitir uma pré-visualização ao vivo
(`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete de localização da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na configuração raiz.

## Modos de streaming de pré-visualização

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desativa o streaming de pré-visualização.
- `partial`: pré-visualização única que é substituída pelo texto mais recente.
- `block`: pré-visualização atualizada em etapas divididas/anexadas.
- `progress`: pré-visualização de progresso/status durante a geração, resposta final ao concluir.

`streaming.mode: "block"` é um modo de streaming de pré-visualização para canais com suporte a edição,
como Discord e Telegram. Ele não ativa a entrega em blocos do canal ali.
Use `streaming.block.enabled` ou a chave legada de canal `blockStreaming` quando
quiser respostas normais em bloco. Microsoft Teams é a exceção: ele não tem
transporte de bloco de pré-visualização de rascunho, então `streaming.mode: "block"` corresponde à entrega em bloco do Teams
em vez de streaming parcial/progresso nativo.

### Mapeamento de canais

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Discord    | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream de progresso nativo  |

Somente Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas da API de streaming nativa do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- O streaming nativo do Slack e o status de thread do assistente no Slack exigem um alvo de thread de resposta. DMs de nível superior não mostram essa pré-visualização no estilo de thread, mas ainda podem usar posts e edições de pré-visualização de rascunho do Slack.

Migração de chave legada:

- Telegram: valores legados `streamMode` e escalares/booleanos `streaming` são detectados e migrados por caminhos de compatibilidade de doctor/config para `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano migram automaticamente para o enum `streaming`.
- Slack: `streamMode` migra automaticamente para `streaming.mode`; `streaming` booleano migra automaticamente para `streaming.mode` mais `streaming.nativeTransport`; `nativeStreaming` legado migra automaticamente para `streaming.nativeTransport`.

### Comportamento em runtime

Telegram:

- Usa `sendMessage` + atualizações de pré-visualização com `editMessageText` em DMs e grupos/tópicos.
- O texto final edita a pré-visualização ativa no lugar; finais longos reutilizam essa mensagem para o primeiro chunk e enviam apenas os chunks restantes.
- O modo `progress` mantém o progresso de ferramentas em um rascunho de status editável, limpa esse rascunho ao concluir e envia a resposta final por entrega normal.
- Se a edição final falhar antes de o texto concluído ser confirmado, o OpenClaw usa entrega final normal e limpa a pré-visualização obsoleta.
- O streaming de pré-visualização é ignorado quando o streaming em blocos do Telegram está explicitamente ativado (para evitar streaming duplicado).
- `/reasoning stream` pode escrever o raciocínio em uma pré-visualização transitória que é excluída após a entrega final.

Discord:

- Usa envio + edição de mensagens de pré-visualização.
- O modo `block` usa divisão de rascunho (`draftChunk`).
- O streaming de pré-visualização é ignorado quando o streaming em blocos do Discord está explicitamente ativado.
- Payloads finais de mídia, erro e resposta explícita cancelam pré-visualizações pendentes sem fazer flush de um novo rascunho, e então usam entrega normal.

Slack:

- `partial` pode usar streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa pré-visualizações de rascunho no estilo de acréscimo.
- `progress` usa texto de pré-visualização de status, depois a resposta final.
- DMs de nível superior sem uma thread de resposta usam posts e edições de pré-visualização de rascunho em vez do streaming nativo do Slack.
- Streaming de pré-visualização nativo e de rascunho suprimem respostas em bloco para esse turno, então uma resposta do Slack é transmitida por apenas um caminho de entrega.
- Payloads finais de mídia/erro e finais de progresso não criam mensagens de rascunho descartáveis; somente finais de texto/bloco que podem editar a pré-visualização fazem flush do texto de rascunho pendente.

Mattermost:

- Transmite pensamento, atividade de ferramentas e texto parcial de resposta em um único post de pré-visualização de rascunho que é finalizado no lugar quando é seguro enviar a resposta final.
- Recorre ao envio de um novo post final se o post de pré-visualização foi excluído ou está indisponível no momento da finalização.
- Payloads finais de mídia/erro cancelam atualizações de pré-visualização pendentes antes da entrega normal, em vez de fazer flush de um post de pré-visualização temporário.

Matrix:

- Pré-visualizações de rascunho são finalizadas no lugar quando o texto final pode reutilizar o evento de pré-visualização.
- Finais apenas de mídia, erro e incompatibilidade de alvo de resposta cancelam atualizações de pré-visualização pendentes antes da entrega normal; uma pré-visualização obsoleta já visível é redigida.

### Atualizações de pré-visualização de progresso de ferramentas

O streaming de pré-visualização também pode incluir atualizações de **progresso de ferramentas** - linhas curtas de status como "pesquisando na web", "lendo arquivo" ou "chamando ferramenta" - que aparecem na mesma mensagem de pré-visualização enquanto as ferramentas estão em execução, antes da resposta final. Isso mantém turnos de ferramentas com múltiplas etapas visualmente ativos em vez de silenciosos entre a primeira pré-visualização de pensamento e a resposta final.

Superfícies compatíveis:

- **Discord**, **Slack**, **Telegram** e **Matrix** transmitem o progresso de ferramentas para a edição da pré-visualização ao vivo por padrão quando o streaming de pré-visualização está ativo. Microsoft Teams usa seu fluxo de progresso nativo em chats pessoais.
- Telegram é distribuído com atualizações de pré-visualização de progresso de ferramentas ativadas desde `v2026.4.22`; mantê-las ativadas preserva esse comportamento lançado.
- **Mattermost** já incorpora a atividade de ferramentas em sua única publicação de pré-visualização em rascunho (veja acima).
- As edições de progresso de ferramentas seguem o modo ativo de streaming de pré-visualização; elas são ignoradas quando o streaming de pré-visualização está `off` ou quando o streaming em bloco assumiu a mensagem. No Telegram, `streaming.mode: "off"` é somente final: a conversa genérica de progresso também é suprimida em vez de ser entregue como mensagens de status independentes, enquanto solicitações de aprovação, cargas de mídia e erros continuam sendo roteados normalmente.
- Para manter o streaming de pré-visualização, mas ocultar linhas de progresso de ferramentas, defina `streaming.preview.toolProgress` como `false` para esse canal. Para manter as linhas de progresso de ferramentas visíveis enquanto oculta texto de comando/execução, defina `streaming.preview.commandText` como `"status"` ou `streaming.progress.commandText` como `"status"`; o padrão é `"raw"` para preservar o comportamento lançado. Esta política é compartilhada por canais de rascunho/progresso que usam o renderizador de progresso compacto do OpenClaw, incluindo Discord, Matrix, Microsoft Teams, Mattermost, pré-visualizações de rascunho do Slack e Telegram. Para desativar completamente as edições de pré-visualização, defina `streaming.mode` como `off`.
- Respostas com citação selecionada no Telegram são uma exceção: quando `replyToMode` não está `"off"` e há texto de citação selecionado, o OpenClaw ignora o stream de pré-visualização da resposta desse turno, então as linhas de pré-visualização de progresso de ferramentas não podem ser renderizadas. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm o streaming de pré-visualização. Consulte a [documentação do canal Telegram](/pt-BR/channels/telegram) para detalhes.

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

Use o mesmo formato sob outra chave de canal de progresso compacto, por exemplo `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` ou pré-visualizações de rascunho do Slack. Para o modo de rascunho de progresso, coloque a mesma política em `streaming.progress`:

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

## Relacionado

- [Refatoração do ciclo de vida das mensagens](/pt-BR/concepts/message-lifecycle-refactor) - design-alvo compartilhado para pré-visualização, edição, stream e finalização
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts) - mensagens visíveis de trabalho em andamento que são atualizadas durante turnos longos
- [Mensagens](/pt-BR/concepts/messages) - ciclo de vida e entrega de mensagens
- [Nova tentativa](/pt-BR/concepts/retry) - comportamento de nova tentativa em falha de entrega
- [Canais](/pt-BR/channels) - suporte a streaming por canal
